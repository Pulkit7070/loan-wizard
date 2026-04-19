export interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

export function speak(text: string, opts: TTSOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = opts.lang ?? 'en-IN';
    utter.rate = opts.rate ?? 0.9;
    utter.pitch = opts.pitch ?? 1.0;
    utter.onend = () => resolve();
    utter.onerror = (e) => reject(new Error(e.error));
    synth.speak(utter);
  });
}
