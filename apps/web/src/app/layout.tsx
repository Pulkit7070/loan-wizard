import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Loan Wizard — Instant Offer',
  description: 'Get a personalised loan offer in under 2 minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafafa] text-[#0a2540]">{children}</body>
    </html>
  );
}
