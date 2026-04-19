'use client';
import { useState } from 'react';
import type { Offer } from '@loan-wizard/contracts';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function OfferCard({ offer, onAccept }: { offer: Offer; onAccept: () => void }) {
  const [showWhy, setShowWhy] = useState(false);

  if (!offer.eligible) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
        <p className="text-xl font-semibold text-red-600 mb-2">We cannot offer a loan at this time</p>
        <p className="text-gray-600">{offer.rejection_reason ?? 'You do not meet the current eligibility criteria.'}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto"
    >
      <p className="text-navy text-lg font-medium mb-1">You are eligible for</p>
      <p className="text-5xl font-bold text-amber-500 mb-1">{INR.format(offer.amount!)}</p>
      <p className="text-gray-600 mb-1">
        at <strong>{offer.interest_rate}% p.a.</strong> for <strong>{offer.tenure_months} months</strong>
      </p>
      <p className="text-gray-600 mb-6">
        EMI: <strong className="text-navy">{INR.format(offer.emi!)} / month</strong>
      </p>

      <button
        onClick={() => setShowWhy(!showWhy)}
        className="flex items-center gap-1 text-sm text-navy underline mb-4"
      >
        {showWhy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Why this offer?
      </button>

      {showWhy && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-6"
        >
          <ReasonCodePanel codes={offer.reason_codes} />
        </motion.div>
      )}

      <button
        onClick={onAccept}
        className="w-full bg-navy text-white py-3 rounded-xl font-semibold hover:bg-[#0d3060] transition-colors"
      >
        Accept this offer
      </button>
    </motion.div>
  );
}

function ReasonCodePanel({ codes }: { codes: Offer['reason_codes'] }) {
  return (
    <div className="flex flex-col gap-3">
      {codes.map((rc) => (
        <div key={rc.code}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">{rc.label}</span>
            <span className="text-gray-500">{Math.round(rc.weight * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full"
              style={{ width: `${Math.round(rc.weight * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
