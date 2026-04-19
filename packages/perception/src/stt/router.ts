import type { STTResult } from './web-speech';
import { AudioBuffer, whisperFallback } from './whisper-fallback';

export interface STTRouterConfig {
  sttFallbackUrl?: string;
  sttConfidenceThreshold?: number;
}

export class STTRouter {
  private audioBuffer: AudioBuffer;
  readonly threshold: number;
  readonly fallbackUrl?: string;

  constructor(config: STTRouterConfig) {
    this.threshold = config.sttConfidenceThreshold ?? 0.7;
    this.fallbackUrl = config.sttFallbackUrl;
    this.audioBuffer = new AudioBuffer();
  }

  startAudioCapture(stream: MediaStream): void {
    this.audioBuffer.start(stream);
  }

  stopAudioCapture(): void {
    this.audioBuffer.stop();
  }

  async resolve(primary: STTResult): Promise<STTResult> {
    if (primary.confidence >= this.threshold || !this.fallbackUrl) {
      return primary;
    }
    const blob = this.audioBuffer.getBlob();
    if (!blob) return primary;
    try {
      return await whisperFallback(blob, this.fallbackUrl);
    } catch {
      return primary;
    }
  }
}
