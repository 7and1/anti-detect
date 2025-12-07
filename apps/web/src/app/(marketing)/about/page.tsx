import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Anti-detect.com',
  description:
    'Learn how Anti-detect.com helps you understand, harden, and automate browser fingerprints with privacy-first tooling.',
  alternates: { canonical: 'https://anti-detect.com/about' },
};

const HIGHLIGHTS = [
  '7-layer fingerprint engine (network, navigator, graphics, audio, fonts, locale, automation)',
  'Cloudflare-native stack (Workers, D1, KV, R2) for global low-latency responses',
  'Playwright-powered smoke & journey tests on every deploy',
  'Privacy-first: zero storage by default, opt-in shareable reports with TTL',
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <header className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">About</p>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary">Built for analysts, loved by operators</h1>
        <p className="text-lg text-text-secondary max-w-3xl mx-auto">
          Anti-detect.com combines deep browser telemetry with automation rails so you can see what trackers see,
          remediate risk, and ship consistent profiles to your fleet.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {HIGHLIGHTS.map((item) => (
          <div key={item} className="rounded-2xl border border-border bg-bg-secondary/70 p-5 shadow-sm">
            <p className="text-sm text-text-primary">{item}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-bg-secondary/60 p-6 space-y-4">
        <h2 className="text-2xl font-semibold text-text-primary">Why we exist</h2>
        <p className="text-text-secondary">
          Fingerprinting is no longer a niche anti-bot trick. It powers fraud scoring, ad quality checks, account
          integrity, and even KYC controls. We give you the same visibility vendors have—without asking you to wire up
          brittle scripts or leak sensitive data.
        </p>
      </section>
    </div>
  );
}
