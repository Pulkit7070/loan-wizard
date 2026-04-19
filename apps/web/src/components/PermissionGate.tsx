'use client';
import { useState } from 'react';
import { Camera, Mic, MapPin } from 'lucide-react';

type Step = 'camera' | 'mic' | 'geo' | 'done';

export function PermissionGate({ onGranted }: { onGranted: () => void }) {
  const [step, setStep] = useState<Step>('camera');
  const [error, setError] = useState('');

  async function requestCamera() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop immediately — perception engine will open the real stream
      stream.getTracks().forEach((t) => t.stop());
      setStep('mic');
    } catch {
      setError('Camera access is required to continue. Please allow and try again.');
    }
  }

  async function requestMic() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStep('geo');
    } catch {
      setError('Microphone access is required. Please allow and try again.');
    }
  }

  async function requestGeo() {
    setError('');
    navigator.geolocation.getCurrentPosition(
      () => { setStep('done'); onGranted(); },
      () => { setStep('done'); onGranted(); }, // geo is optional
    );
  }

  const steps: Record<Exclude<Step, 'done'>, { icon: React.ReactNode; title: string; reason: string; action: () => void; label: string }> = {
    camera: {
      icon: <Camera size={40} className="text-navy" />,
      title: 'Allow Camera Access',
      reason: 'RBI video-KYC requires us to verify your identity via live video during the application.',
      action: requestCamera,
      label: 'Allow Camera',
    },
    mic: {
      icon: <Mic size={40} className="text-navy" />,
      title: 'Allow Microphone Access',
      reason: 'Your spoken responses are transcribed to fill the application form automatically.',
      action: requestMic,
      label: 'Allow Microphone',
    },
    geo: {
      icon: <MapPin size={40} className="text-navy" />,
      title: 'Allow Location Access',
      reason: 'Location is used for fraud prevention and regulatory compliance checks.',
      action: requestGeo,
      label: 'Allow Location',
    },
  };

  if (step === 'done') return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="max-w-sm w-full p-8 text-center">
        <div className="flex justify-center mb-4">{current.icon}</div>
        <h2 className="text-xl font-bold text-navy mb-2">{current.title}</h2>
        <p className="text-gray-600 mb-6">{current.reason}</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          onClick={current.action}
          className="w-full bg-navy text-white py-3 rounded-xl font-semibold hover:bg-[#0d3060] transition-colors"
        >
          {current.label}
        </button>
      </div>
    </div>
  );
}
