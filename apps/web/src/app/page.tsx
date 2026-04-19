'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Video, Mic, Clock, CheckCircle2 } from 'lucide-react';
import { ConsentBanner } from '../components/ConsentBanner';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Button } from '../components/ui/Button';
import { useT } from '../components/I18nProvider';

export default function LandingPage() {
  const router = useRouter();
  const { t } = useT();
  const [loading, setLoading] = useState(false);

  async function startSession() {
    setLoading(true);
    try {
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
    } catch {
      setLoading(false);
    }
  }

  return (
    <>
      <ConsentBanner />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-(--color-surface)/95 backdrop-blur border-b border-(--color-muted)/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-(--color-fg) text-lg">LoanWizard</span>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-xs bg-(--color-muted)/10 text-(--color-muted) px-3 py-1 rounded-full hidden sm:block">
              🔒 RBI Compliant
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-(--color-fg) leading-tight mb-4"
          >
            {t('landing.hero')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-(--color-muted) max-w-xl mx-auto mb-10"
          >
            {t('landing.sub')}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Button size="lg" onClick={startSession} loading={loading} aria-label="Start loan session">
              {loading ? t('landing.starting') : t('landing.cta')}
            </Button>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="pb-16">
          <h2 className="text-center text-xl font-bold text-(--color-fg) mb-8">{t('landing.how')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: 1, title: t('landing.step1.title'), desc: t('landing.step1.desc') },
              { n: 2, title: t('landing.step2.title'), desc: t('landing.step2.desc') },
              { n: 3, title: t('landing.step3.title'), desc: t('landing.step3.desc') },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center p-6 bg-(--color-surface) rounded-[var(--radius-lg)] border border-(--color-muted)/10 shadow-sm">
                <span className="w-10 h-10 rounded-full bg-(--color-brand) text-(--color-brand-fg) flex items-center justify-center font-bold mb-4">{n}</span>
                <p className="font-semibold text-(--color-fg) mb-1">{title}</p>
                <p className="text-sm text-(--color-muted)">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust cards */}
        <section className="pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Video size={20} />, title: t('landing.trust1.title'), desc: t('landing.trust1.desc') },
              { icon: <Mic size={20} />, title: t('landing.trust2.title'), desc: t('landing.trust2.desc') },
              { icon: <Clock size={20} />, title: t('landing.trust3.title'), desc: t('landing.trust3.desc') },
              { icon: <ShieldCheck size={20} />, title: t('landing.trust4.title'), desc: t('landing.trust4.desc') },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-4 bg-(--color-surface) rounded-[var(--radius-lg)] border border-(--color-muted)/10 shadow-sm">
                <span className="text-(--color-brand) mb-3 block">{icon}</span>
                <p className="font-semibold text-(--color-fg) text-sm">{title}</p>
                <p className="text-xs text-(--color-muted) mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance */}
        <section className="pb-20 grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius-lg)] p-5 text-sm text-blue-900">
            <p className="font-semibold mb-2">{t('landing.dpdp.title')}</p>
            <ul className="space-y-1 text-blue-800">
              {([1,2,3,4,5] as const).map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-blue-500" />
                  {t(`landing.dpdp.item${i}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] p-4 text-sm text-amber-900">
              {t('landing.rbi')}
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <Button size="lg" onClick={startSession} loading={loading} className="w-full">
                {loading ? t('landing.starting') : t('landing.cta')}
              </Button>
              <p className="text-xs text-(--color-muted) text-center mt-3">{t('landing.terms')}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-(--color-muted)/10 py-6 text-center text-xs text-(--color-muted)">
        <p>LoanWizard · RBI Reg. NBFC · DPDP Compliant · IRDAI Notice: No insurance product</p>
        <p className="mt-1">
          <a href="/admin" className="underline hover:text-(--color-fg) transition-colors">Admin</a>
          {' · '}
          <a href="#" className="underline hover:text-(--color-fg) transition-colors">Privacy</a>
          {' · '}
          <a href="#" className="underline hover:text-(--color-fg) transition-colors">Terms</a>
        </p>
      </footer>
    </>
  );
}
