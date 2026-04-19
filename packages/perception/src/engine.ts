import type { PerceptionEvent, FormData, CVSignal } from '@loan-wizard/contracts';
import { requestMedia, stopStream, attachStreamToVideo } from './media/webrtc';
import { captureGeo } from './media/geo';
import { speak } from './tts/browser-tts';
import { WebSpeechSTT } from './stt/web-speech';
import { STTRouter } from './stt/router';
import { detectFaces } from './cv/face-detector';
import { LivenessTracker } from './cv/liveness';
import { AgeEstimator } from './cv/age-estimator';
import { DEFAULT_SCRIPT, type AgentScript } from './script';
import type { PerceptionConfig } from './index';

const CV_INTERVAL_MS = 500; // 2 Hz

export class PerceptionEngine {
  private config: PerceptionConfig;
  private script: AgentScript;
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private sttRouter: STTRouter;
  private webSpeech: WebSpeechSTT | null = null;
  private liveness = new LivenessTracker();
  private ageEstimator: AgeEstimator;
  private cvLoopId: ReturnType<typeof setInterval> | null = null;
  private turnIdx = 0;
  private questionIdx = 0;
  private pendingTranscript = '';
  private isRunning = false;
  private formData: Partial<FormData> = {};

  constructor(config: PerceptionConfig) {
    this.config = config;
    this.script = config.script ?? DEFAULT_SCRIPT;
    this.sttRouter = new STTRouter({
      sttFallbackUrl: config.sttFallbackUrl,
      sttConfidenceThreshold: config.sttConfidenceThreshold,
    });
    this.ageEstimator = new AgeEstimator(config.ageModelUrl);
  }

  attachVideo(el: HTMLVideoElement): void {
    this.videoEl = el;
    if (this.stream) attachStreamToVideo(this.stream, el);
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // 1. Request permissions
      const media = await requestMedia();
      this.stream = media.stream;
      if (this.videoEl) attachStreamToVideo(this.stream, this.videoEl);

      const geo = await captureGeo();
      this.emit({
        type: 'permission_granted',
        payload: { camera: true, mic: true, geo: geo !== null },
      });

      // 2. Start audio capture for Whisper fallback buffer
      this.sttRouter.startAudioCapture(this.stream!);

      // 3. Load TF.js models (non-blocking – CV loop waits on model ready)
      this.ageEstimator.load().catch(() => {/* handled inside AgeEstimator */});

      // 4. Start CV loop
      this.startCVLoop(geo ?? null);

      // 5. Run scripted agent flow
      await this.runScript();

    } catch (err) {
      this.emit({
        type: 'error',
        payload: { code: 'START_FAILED', message: String(err) },
      });
      this.stop();
    }
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    this.webSpeech?.stop();
    this.sttRouter.stopAudioCapture();
    this.stopCVLoop();
    if (this.stream) { stopStream(this.stream); this.stream = null; }
    this.liveness.reset();
    this.ageEstimator.reset();

    this.emit({ type: 'session_ended', payload: { reason: 'complete' } });
  }

  private emit(event: PerceptionEvent): void {
    this.config.onEvent(event);
  }

  // ─── scripted flow ──────────────────────────────────────────────────────────

  private async runScript(): Promise<void> {
    for (this.questionIdx = 0; this.questionIdx < this.script.questions.length; this.questionIdx++) {
      if (!this.isRunning) break;
      const q = this.script.questions[this.questionIdx];

      this.emit({ type: 'question_asked', payload: { question_id: q.id, text: q.text } });
      await speak(q.text);

      const answer = await this.listenForAnswer(10000);
      if (!answer) continue;

      // Emit transcript turn
      const customerTurn = {
        turn_idx: this.turnIdx++,
        speaker: 'customer' as const,
        text: answer.text,
        confidence: answer.confidence,
        timestamp: new Date().toISOString(),
        question_id: q.id,
      };
      this.emit({ type: 'transcript_turn', payload: customerTurn });

      // Extract field
      const extracted = q.extractor(answer.text);
      if (extracted) {
        this.emit({
          type: 'form_field_extracted',
          payload: { field: q.expectedField, value: extracted.value, confidence: extracted.confidence },
        });
        (this.formData as any)[q.expectedField] = extracted.value;
      }
    }

    if (this.isRunning) this.stop();
  }

  private listenForAnswer(timeoutMs: number): Promise<{ text: string; confidence: number } | null> {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (r: { text: string; confidence: number } | null) => {
        if (settled) return;
        settled = true;
        this.webSpeech?.stop();
        this.webSpeech = null;
        resolve(r);
      };

      const timer = setTimeout(() => settle(null), timeoutMs);

      this.webSpeech = new WebSpeechSTT(async (result) => {
        if (!result.isFinal) return;
        clearTimeout(timer);
        const resolved = await this.sttRouter.resolve(result);
        settle({ text: resolved.text, confidence: resolved.confidence });
      });

      try {
        this.webSpeech.start();
      } catch (e) {
        clearTimeout(timer);
        settle(null);
      }
    });
  }

  // ─── CV loop ────────────────────────────────────────────────────────────────

  private startCVLoop(geo: { lat: number; lng: number } | null): void {
    this.cvLoopId = setInterval(async () => {
      if (!this.videoEl || !this.isRunning) return;

      try {
        const faces = await detectFaces(this.videoEl);
        const facePresent = faces.length > 0;
        const now = Date.now();

        let ageEstimate: number | null = null;
        let ageConfidence = 0;
        let livenessScore = 0;
        let blinkCount = 0;
        let headPoseDelta = 0;

        if (facePresent) {
          const face = faces[0];
          const lv = this.liveness.update(face, now);
          blinkCount = lv.blinkCount;
          headPoseDelta = lv.headPoseDelta;
          livenessScore = this.liveness.getLivenessScore(now);

          const age = await this.ageEstimator.estimate(this.videoEl);
          if (age) { ageEstimate = age.age; ageConfidence = age.confidence; }
        }

        const signal: CVSignal = {
          session_id: this.config.sessionId,
          timestamp: new Date(now).toISOString(),
          age_estimate: ageEstimate,
          age_confidence: ageConfidence,
          liveness_score: livenessScore,
          face_present: facePresent,
          blink_count_window: blinkCount,
          head_pose_delta: headPoseDelta,
        };
        this.emit({ type: 'cv_signal', payload: signal });
      } catch {
        // CV errors are non-fatal
      }
    }, CV_INTERVAL_MS);
  }

  private stopCVLoop(): void {
    if (this.cvLoopId !== null) { clearInterval(this.cvLoopId); this.cvLoopId = null; }
  }
}
