export interface MediaResult {
  stream: MediaStream;
  audioTrack: MediaStreamTrack;
  videoTrack: MediaStreamTrack;
}

export async function requestMedia(): Promise<MediaResult> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  const videoTrack = stream.getVideoTracks()[0];
  const audioTrack = stream.getAudioTracks()[0];
  return { stream, audioTrack, videoTrack };
}

export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((t) => t.stop());
}

export function attachStreamToVideo(stream: MediaStream, el: HTMLVideoElement): void {
  el.srcObject = stream;
  el.muted = true;
  el.play().catch(() => {/* autoplay policy – user gesture starts it */});
}
