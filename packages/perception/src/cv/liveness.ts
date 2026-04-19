import type { BlazeFacePrediction } from './face-detector';
import { getLandmarks } from './face-detector';

// Eye Aspect Ratio from two eye landmark points (simplified: distance proxy)
function eyeAspectRatio(eye1: number[], eye2: number[]): number {
  const dx = eye1[0] - eye2[0];
  const dy = eye1[1] - eye2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

const BLINK_EAR_THRESHOLD = 0.2; // normalised, needs calibration
const BLINK_WINDOW_SECS = 5;
const STILL_HEAD_SECS = 10;

interface BlinkSample {
  ts: number;
  ear: number;
}

export class LivenessTracker {
  private blinkSamples: BlinkSample[] = [];
  private blinkCount = 0;
  private lastBlinkTs = 0;
  private inBlink = false;

  // Nose position history for head-pose delta
  private noseHistory: Array<{ ts: number; x: number; y: number }> = [];

  update(face: BlazeFacePrediction, ts: number): { blinkCount: number; headPoseDelta: number } {
    const lm = getLandmarks(face);
    // lm[0] = right eye, lm[1] = left eye, lm[2] = nose
    const rightEye = lm[0];
    const leftEye = lm[1];
    const nose = lm[2];

    // EAR proxy: use inter-eye distance vs expected — simplified for BlazeFace
    const faceBox = face.topLeft as number[];
    const faceBox2 = face.bottomRight as number[];
    const faceH = Math.abs(faceBox2[1] - faceBox[1]) || 1;
    const ear = eyeAspectRatio(rightEye, leftEye) / faceH;

    const now = ts;

    if (ear < BLINK_EAR_THRESHOLD) {
      if (!this.inBlink) {
        this.inBlink = true;
        this.blinkCount++;
        this.lastBlinkTs = now;
      }
    } else {
      this.inBlink = false;
    }

    // Trim blink window
    this.blinkSamples.push({ ts: now, ear });
    this.blinkSamples = this.blinkSamples.filter((s) => now - s.ts < BLINK_WINDOW_SECS * 1000);

    // Head pose: track nose
    this.noseHistory.push({ ts: now, x: nose[0], y: nose[1] });
    this.noseHistory = this.noseHistory.filter((n) => now - n.ts < STILL_HEAD_SECS * 1000);

    let headPoseDelta = 0;
    if (this.noseHistory.length >= 2) {
      const first = this.noseHistory[0];
      const last = this.noseHistory[this.noseHistory.length - 1];
      const dx = last.x - first.x;
      const dy = last.y - first.y;
      headPoseDelta = Math.sqrt(dx * dx + dy * dy);
    }

    return { blinkCount: this.blinksInWindow(now), headPoseDelta };
  }

  private blinksInWindow(now: number): number {
    return this.blinkSamples.filter(
      (s) => now - s.ts < BLINK_WINDOW_SECS * 1000 && s.ear < BLINK_EAR_THRESHOLD,
    ).length;
  }

  getLivenessScore(now: number): number {
    const blinks = this.blinksInWindow(now);
    const hasMove = this.noseHistory.length >= 2 &&
      (() => {
        const f = this.noseHistory[0], l = this.noseHistory[this.noseHistory.length - 1];
        return Math.hypot(l.x - f.x, l.y - f.y) > 5; // >5px movement
      })();

    if (blinks > 0 && hasMove) return 1.0;
    if (blinks > 0 || hasMove) return 0.5;
    return 0.0;
  }

  reset(): void {
    this.blinkSamples = [];
    this.blinkCount = 0;
    this.noseHistory = [];
    this.inBlink = false;
  }
}
