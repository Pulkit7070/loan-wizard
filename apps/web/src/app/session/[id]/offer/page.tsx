'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Offer } from '@loan-wizard/contracts';
import { OfferCard } from '../../../../components/OfferCard';

export default function OfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [showKfs, setShowKfs] = useState(false);

  useEffect(() => {
    // Primary: sessionStorage (set by processing page immediately after ML call)
    try {
      const stored = sessionStorage.getItem(`offer_${params.id}`);
      if (stored) { setOffer(JSON.parse(stored)); return; }
    } catch {/* SSR guard */}

    // Fallback: re-fetch from server (handles direct navigation / refresh)
    fetch(`/api/session/${params.id}/offer`)
      .then((r) => r.ok ? r.json() : null)
      .then((o) => { if (o) setOffer(o); })
      .catch(() => {});
  }, [params.id]);

  function handleAccept() {
    router.push(`/session/${params.id}/accepted`);
  }

  if (!offer) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-navy border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#fafafa]">
      <h1 className="text-2xl font-bold text-navy mb-8 text-center">Your personalised offer is ready</h1>
      <OfferCard offer={offer} onAccept={handleAccept} />

      {/* KFS */}
      <button onClick={() => setShowKfs(true)} className="mt-6 text-sm underline text-gray-500">
        View Key Fact Statement (RBI required)
      </button>

      {showKfs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowKfs(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-navy mb-4">Key Fact Statement</h2>
            <table className="w-full text-sm">
              <tbody>
                <KfsRow label="Loan Amount" value={`₹${offer.amount?.toLocaleString('en-IN')}`} />
                <KfsRow label="Interest Rate" value={`${offer.interest_rate}% p.a. (fixed)`} />
                <KfsRow label="Tenure" value={`${offer.tenure_months} months`} />
                <KfsRow label="Monthly EMI" value={`₹${offer.emi?.toLocaleString('en-IN')}`} />
                <KfsRow label="Processing Fee" value="1% of loan amount" />
                <KfsRow label="Prepayment Charges" value="Nil after 12 months" />
              </tbody>
            </table>
            <button onClick={() => setShowKfs(false)} className="mt-6 w-full bg-navy text-white py-2 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KfsRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 text-gray-600">{label}</td>
      <td className="py-2 font-medium text-right">{value}</td>
    </tr>
  );
}
