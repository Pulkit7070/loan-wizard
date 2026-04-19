'use client';
import { useEffect, useState } from 'react';
import { Camera, Mic, MapPin, AlertCircle } from 'lucide-react';

type Step = 'checking' | 'camera' | 'geo' | 'denied' | 'done';

export function PermissionGate({ onGranted }: { onGranted: () => void }) {
  const [step, setStep] = useState<Step>('checking');
  const [error, setError] = useState('');

  // On mount, check if camera+mic is already granted — if so, skip the dialog
  useEffect(() => {
    async function preflight() {
      try {
        const [cam, mic] = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ]);
        if (cam.state === 'denied' || mic.state === 'denied') {
          setStep('denied');
          return;
        }
        if (cam.state === 'granted' && mic.state === 'granted') {
          // Already granted — acquire briefly to confirm, then move to geo
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach((t) => t.stop());
          setStep('geo');
          return;
        }
      } catch {
        // permissions API not supported — fall through to manual step
      }
      setStep('camera');
    }
    preflight();
  }, []);

  async function requestCameraAndMic() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStep('geo');
    } catch (err: unknown) {
      const name = err instanceof Error ? (err as { name?: string }).name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStep('denied');
      } else {
        setError('Could not access camera or microphone. Please check your device and try again.');
      }
    }
  }

  async function requestGeo() {
    setError('');
    navigator.geolocation.getCurrentPosition(
      () => { setStep('done'); onGranted(); },
      () => { setStep('done'); onGranted(); }, // geo is optional
    );
  }

  if (step === 'done') return null;

  if (step === 'checking') {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'denied') {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="max-w-sm w-full p-8 text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Camera access blocked</h2>
          <p className="text-gray-600 mb-4">
            Your browser has blocked camera or microphone access for this site.
          </p>
          <ol className="text-left text-sm text-gray-700 space-y-2 mb-6 bg-gray-50 p-4 rounded-xl">
            <li>1. Click the <strong>lock icon</strong> in your browser's address bar</li>
            <li>2. Set <strong>Camera</strong> and <strong>Microphone</strong> to <strong>Allow</strong></li>
            <li>3. Reload the page</li>
          </ol>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-navy text-white py-3 rounded-xl font-semibold hover:bg-[#0d3060] transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  const steps = {
    camera: {
      icon: <><Camera size={40} className="text-navy inline-block mr-2" /><Mic size={40} className="text-navy inline-block" /></>,
      title: 'Allow Camera & Microphone',
      reason: 'RBI video-KYC requires live video to verify your identity, and your spoken responses fill the form automatically.',
      action: requestCameraAndMic,
      label: 'Allow Camera & Mic',
    },
    geo: {
      icon: <MapPin size={40} className="text-navy" />,
      title: 'Allow Location Access',
      reason: 'Location is used for fraud prevention and regulatory compliance checks.',
      action: requestGeo,
      label: 'Allow Location',
    },
  } as const;

  const current = steps[step as 'camera' | 'geo'];

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
