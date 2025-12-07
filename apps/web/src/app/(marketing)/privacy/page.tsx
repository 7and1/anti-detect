import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Anti-detect.com collects, processes, and stores data with a privacy-first approach.',
  alternates: { canonical: 'https://anti-detect.com/privacy' },
};

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'Browser fingerprint data stays client-side by default. IP metadata is processed at the edge for analytics and rate limiting. Optional shared reports are stored in D1 with a 30-day TTL.',
  },
  {
    title: 'How we use data',
    body: 'To generate trust scores, improve detection quality, and operate automation queues. We never sell fingerprint data and do not build marketing profiles.',
  },
  {
    title: 'Retention',
    body: 'Shared reports auto-delete after 30 days. Task/webhook logs rotate every 14 days. KV caches expire within 24 hours.',
  },
  {
    title: 'Your controls',
    body: 'Run scans anonymously, skip Turnstile, or delete shared reports anytime via the report page or API.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Privacy</p>
        <h1 className="text-4xl font-bold text-text-primary">Privacy-first by design</h1>
        <p className="text-text-secondary max-w-3xl">
          We only keep what we need to calculate scores and deliver the features you opt into. No third-party ad
          trackers. No fingerprint resale.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-2xl border border-border bg-bg-secondary/70 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
