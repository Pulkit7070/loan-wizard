import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { getOffer as fetchOffer } from '../../../../../lib/ml-client';
import { buildRiskInput, setOffer, getOffer } from '../../../../../lib/session-store';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const input = buildRiskInput(params.id);
  if (!input) {
    return NextResponse.json({ error: 'session not found' }, { status: 404 });
  }

  const offer = await fetchOffer(input);
  setOffer(params.id, offer);

  await prisma.session.update({
    where: { id: params.id },
    data: { status: offer.eligible ? 'offered' : 'rejected' },
  });

  return NextResponse.json(offer);
}

// Offer page fetches this if sessionStorage is empty (e.g. direct navigation)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const offer = getOffer(params.id);
  if (!offer) {
    return NextResponse.json({ error: 'offer not found' }, { status: 404 });
  }
  return NextResponse.json(offer);
}
