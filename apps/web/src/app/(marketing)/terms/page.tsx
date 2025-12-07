import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Usage rules, disclaimers, and acceptable use for Anti-detect.com.',
  alternates: { canonical: 'https://anti-detect.com/terms' },
};

const TERMS = [
  {
    title: 'Acceptable use',
    body: 'Do not use Anti-detect.com to violate platform terms, conduct fraud, or bypass lawful controls. Research, testing, and defensive use are allowed.',
  },
  {
    title: 'Availability',
    body: 'Service is provided “as is” without SLA unless otherwise contracted. We target 99.95% uptime via Cloudflare Workers and KV.',
  },
  {
    title: 'Data handling',
    body: 'Shared reports are temporary. Sensitive data should not be sent in free-text fields. See Privacy Policy for retention windows.',
  },
  {
    title: 'Liability',
    body: 'We are not liable for indirect or consequential damages. Maximum aggregate liability is limited to the fees you paid in the last 3 months.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Terms</p>
        <h1 className="text-4xl font-bold text-text-primary">Terms of Service</h1>
        <p className="text-text-secondary max-w-3xl">
          Plain-language rules so you can ship confidently. For enterprise MSAs, contact us to tailor obligations.
        </p>
      </header>

      <div className="space-y-4">
        {TERMS.map((section) => (
          <div key={section.title} className="rounded-2xl border border-border bg-bg-secondary/70 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
