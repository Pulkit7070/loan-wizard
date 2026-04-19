'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConsentBanner } from '../components/ConsentBanner';
import { ShieldCheck, Video, Mic, Clock } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startSession() {
    setLoading(true);
    const res = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        campaign_source: new URLSearchParams(window.location.search).get('src') ?? 'direct',
        device_user_agent: navigator.userAgent,
      }),
    });
    const { session_id } = await res.json();
    router.push(`/session/${session_id}`);
  }

  return (
    <>
      <ConsentBanner />
      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-navy mb-4">
            Your loan offer, in under 2 minutes
          </h1>
          <p className="text-lg text-gray-600">
            Answer 4 simple questions via video and get a personalised offer instantly.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 gap-4 mb-10">
          <FeatureRow icon={<Video size={20} />} title="Video interview" desc="A short AI-guided video call — no branch visit, no paperwork." />
          <FeatureRow icon={<Mic size={20} />} title="Voice-powered form" desc="Just speak; we extract your details automatically." />
          <FeatureRow icon={<Clock size={20} />} title="Instant decision" desc="Your offer is ready the moment the call ends." />
          <FeatureRow icon={<ShieldCheck size={20} />} title="RBI & DPDP compliant" desc="Video-KYC meets RBI guidelines. Data retained 5 years per regulation." />
        </div>

        {/* DPDP consent block */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-10 text-sm text-blue-900">
          <p className="font-semibold mb-2">Data Collection — DPDP Act 2023</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Video &amp; audio recording for identity verification</li>
            <li>Microphone transcription to auto-fill your application</li>
            <li>Location for fraud prevention and compliance</li>
            <li>Data retained for 5 years per RBI Video-KYC guidelines</li>
            <li>You have the right to access or request deletion of your data</li>
          </ul>
        </div>

        {/* RBI retention notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-10 text-sm text-amber-900">
          <strong>RBI Video-KYC Retention Notice:</strong> Your video recording will be stored
          securely for a minimum of 5 years as required by RBI Master Direction on KYC.
        </div>

        <button
          onClick={startSession}
          disabled={loading}
          className="w-full bg-navy text-white py-4 rounded-xl text-lg font-semibold hover:bg-[#0d3060] transition-colors disabled:opacity-60"
        >
          {loading ? 'Starting…' : 'Start my session →'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          By continuing you agree to our{' '}
          <a href="#" className="underline">Terms &amp; Conditions</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </main>
    </>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <span className="mt-0.5 text-navy">{icon}</span>
      <div>
        <p className="font-semibold text-navy">{title}</p>
        <p className="text-gray-600 text-sm">{desc}</p>
      </div>
    </div>
  );
}
