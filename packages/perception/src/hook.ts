import { useCallback, useEffect, useRef, useState } from 'react';
import { PerceptionEngine } from './engine';
import type { PerceptionConfig, PerceptionHandle } from './index';

export function usePerception(config: PerceptionConfig): PerceptionHandle {
  const [status, setStatus] = useState<PerceptionHandle['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<PerceptionEngine | null>(null);
  // Keep a stable ref to config.onEvent to avoid stale closures
  const onEventRef = useRef(config.onEvent);
  onEventRef.current = config.onEvent;

  const start = useCallback(async () => {
    if (engineRef.current) return;

    setStatus('requesting_permissions');
    setError(null);

    const engine = new PerceptionEngine({
      ...config,
      onEvent: (e) => {
        onEventRef.current(e);
        if (e.type === 'permission_granted') setStatus('running');
        if (e.type === 'session_ended') setStatus('ended');
        if (e.type === 'error') { setError(e.payload.message); setStatus('error'); }
      },
    });

    engineRef.current = engine;

    if (videoRef.current) engine.attachVideo(videoRef.current);

    try {
      await engine.start();
    } catch (err) {
      setError(String(err));
      setStatus('error');
      engineRef.current = null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setStatus('ended');
  }, []);

  // Wire video ref to engine if ref becomes available after start
  useEffect(() => {
    if (videoRef.current && engineRef.current) {
      engineRef.current.attachVideo(videoRef.current);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  return { status, videoRef, start, stop, error };
}
