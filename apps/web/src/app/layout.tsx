import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { I18nProvider } from '../components/I18nProvider';

export const metadata: Metadata = {
  title: 'Loan Wizard — Instant Offer',
  description: 'Get a personalised loan offer in under 2 minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const tenant = cookieStore.get('tenant')?.value ?? 'alpha';

  return (
    <html lang="en" data-theme={tenant}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
