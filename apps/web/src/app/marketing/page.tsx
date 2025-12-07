import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

const FEATURES = [
  {
    title: 'Scanner-as-a-Service',
    body: 'Continuously profile fleets, marketplaces, and partner traffic with a single automation queue.',
  },
  {
    title: 'Risk Model Presets',
    body: 'Ship AdTech, Banking, and Anti-Fraud weight packs without touching core scoring logic.',
  },
  {
    title: 'Telemetry Exports',
    body: 'Push signed JSON/PDF bundles into SIEM, SOAR, or CSPM targets with a built-in verification chain.',
  },
];

const CALLOUTS = [
  {
    label: '99.95% uptime',
    value: 'Global workers + KV fanout for resilient automation.',
  },
  {
    label: 'Playwright ready',
    value: 'End-to-end specs guard every journey, automation, and webhook.',
  },
  {
    label: 'Cloudflare native',
    value: 'Runs on Workers, R2, D1, and Durable Objects for predictable ops.',
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto w-full max-w-5xl space-y-20">
          <section className="text-center space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Anti-detect platform</p>
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary">
              All-in-one browser intelligence
            </h1>
            <p className="text-lg text-text-secondary max-w-3xl mx-auto">
              Automate scanner runs, diff reports, and webhook hand-offs without stitching together scripts. Anti-detect
              keeps scoring, automation, and exports in one CF-native stack.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/automation"
                className="inline-flex items-center justify-center rounded-lg bg-success px-6 py-3 text-sm font-semibold text-bg-primary hover:bg-success/90"
              >
                Launch automation
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-text-primary hover:border-border-subtle hover:text-accent"
              >
                Explore docs
              </Link>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border bg-bg-secondary p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{feature.body}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-gradient-to-br from-bg-secondary to-bg-tertiary p-8">
            <div className="grid gap-6 md:grid-cols-3">
              {CALLOUTS.map((callout) => (
                <div key={callout.label} className="space-y-1">
                  <p className="text-xs uppercase text-text-muted">{callout.label}</p>
                  <p className="text-base text-text-primary">{callout.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl bg-bg-primary/70 p-6">
              <p className="text-sm text-text-muted">Need tailored risk scoring or telemetry?</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/settings/models" className="text-sm font-semibold text-accent">
                  Configure models
                </Link>
                <span className="text-text-muted">·</span>
                <Link href="/report/demo" className="text-sm font-semibold text-accent">
                  Review sample report
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
