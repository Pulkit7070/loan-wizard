'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PerceptionEvent, FormData, CVSignal } from '@loan-wizard/contracts';
import { usePerception } from '@loan-wizard/perception';
import { VideoPanel } from './VideoPanel';
import { FormSidePanel } from './FormSidePanel';
import { CVIndicatorStrip } from './CVIndicatorStrip';
import { RecordingIndicator } from './RecordingIndicator';

export function AgentCallUI({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<FormData>>({});
  const [latestCv, setLatestCv] = useState<CVSignal | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [ending, setEnding] = useState(false);
  const endingRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const endSession = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setEnding(true);
    await fetch(`/api/session/${sessionId}/end`, { method: 'POST' }).catch(() => {});
    router.push(`/session/${sessionId}/processing`);
  }, [sessionId, router]);

  const handleEvent = useCallback(async (event: PerceptionEvent) => {
    // Persist everything fire-and-forget
    fetch(`/api/session/${sessionId}/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {});

    switch (event.type) {
      case 'form_field_extracted':
        setForm((f) => ({ ...f, [event.payload.field]: event.payload.value }));
        break;
      case 'cv_signal':
        setLatestCv(event.payload);
        break;
      case 'question_asked':
        setCurrentQuestion(event.payload.text);
        break;
      case 'session_ended':
        await endSession();
        break;
    }
  }, [sessionId, endSession]);

  const { videoRef, start, status, error: perceptionError } = usePerception({
    sessionId,
    onEvent: handleEvent,
  });

  // Start perception once mounted — permissions already granted by PermissionGate
  useEffect(() => {
    start();
  }, [start]);

  if (perceptionError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-sm px-6">
          <p className="text-red-600 font-semibold mb-2">Camera or microphone error</p>
          <p className="text-gray-500 text-sm mb-4">{perceptionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-navy text-white rounded-xl"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const statusText = (() => {
    if (status === 'requesting_permissions') return 'Requesting permissions…';
    if (status === 'running' && currentQuestion) return currentQuestion;
    if (status === 'running') return 'Starting session…';
    if (status === 'ended') return 'Session complete';
    return 'Waiting…';
  })();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <RecordingIndicator elapsed={elapsed} />
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          🔒 RBI Video-KYC Compliant
        </span>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4">
          <VideoPanel videoRef={videoRef} />
        </div>
        <div className="w-80 flex-shrink-0">
          <FormSidePanel form={form} />
        </div>
      </div>

      {/* CV strip */}
      <CVIndicatorStrip signal={latestCv} />

      {/* Question bar + end button */}
      <div className="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-700 flex-1">
          {status === 'running' && currentQuestion
            ? <><span className="font-medium">Agent:</span> {statusText}</>
            : statusText}
        </p>
        <button
          onClick={endSession}
          disabled={ending}
          className="shrink-0 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {ending ? 'Ending…' : 'End call'}
        </button>
      </div>
    </div>
  );
}
