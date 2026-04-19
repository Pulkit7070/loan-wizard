import { NextRequest, NextResponse } from 'next/server';
import type { PerceptionEvent } from '@loan-wizard/contracts';
import { logTranscript, logCvSignal } from '../../../../../lib/audit-logger';
import { updateFormField, appendCvSignal, appendTranscript } from '../../../../../lib/session-store';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const event = (await req.json()) as PerceptionEvent;
  const sessionId = params.id;

  try {
    if (event.type === 'transcript_turn') {
      await logTranscript(sessionId, event.payload);
      if (event.payload.speaker === 'customer') {
        appendTranscript(sessionId, event.payload.text);
      }
    } else if (event.type === 'cv_signal') {
      await logCvSignal(sessionId, event.payload);
      appendCvSignal(sessionId, event.payload);
    } else if (event.type === 'form_field_extracted') {
      updateFormField(sessionId, event.payload.field, event.payload.value);
    }
  } catch {
    // best-effort — do not fail the client
  }

  return NextResponse.json({ ok: true });
}
