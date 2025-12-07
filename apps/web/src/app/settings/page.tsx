import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

const SETTINGS_SECTIONS = [
  {
    title: 'Risk Models',
    description: 'Tune scoring weights per vertical and roll out presets to every workspace project.',
    href: '/settings/models',
    badge: 'Recommended',
  },
  {
    title: 'Automation & Webhooks',
    description: 'Point batch runs to SIEM/SOAR targets and ship signed payloads with custom headers.',
    href: '/automation#webhooks',
  },
  {
    title: 'API Access',
    description: 'Need API keys or service accounts? Ping the platform team and we will provision credentials.',
    href: 'mailto:platform@anti-detect.com?subject=API%20access%20request',
    external: true,
  },
];

const CHECKLIST = [
  'Lock scoring presets before inviting collaborators.',
  'Add webhook endpoints per environment (staging vs production).',
  'Rotate automation secrets quarterly for downstream SIEM pipelines.',
];

export default function SettingsLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto w-full max-w-5xl space-y-12">
          <section className="space-y-6 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Workspace settings</p>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary">Configure how Anti-detect runs for your team</h1>
            <p className="text-lg text-text-secondary max-w-3xl mx-auto">
              Manage scoring presets, automation targets, and integration touch points in one place. Use the cards below to
              jump into the right surface.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {SETTINGS_SECTIONS.map((section) => (
              <Link
                key={section.title}
                href={section.href}
                prefetch={!section.external}
                className="rounded-2xl border border-border bg-bg-secondary p-6 text-left hover:border-accent transition-colors"
                target={section.external ? '_blank' : undefined}
                rel={section.external ? 'noreferrer' : undefined}
              >
                {section.badge && (
                  <span className="inline-flex items-center rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold">
                    {section.badge}
                  </span>
                )}
                <h2 className="mt-3 text-xl font-semibold text-text-primary">{section.title}</h2>
                <p className="mt-2 text-sm text-text-secondary">{section.description}</p>
              </Link>
            ))}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-bg-secondary p-6">
              <h3 className="text-lg font-semibold text-text-primary">Rollout checklist</h3>
              <ul className="mt-4 space-y-3 text-sm text-text-secondary">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-success">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-bg-secondary to-bg-tertiary p-6">
              <h3 className="text-lg font-semibold text-text-primary">Need something else?</h3>
              <p className="mt-3 text-sm text-text-secondary">
                We routinely add new settings surfaces (org management, API keys, collaboration). Drop us a note and we will
                prioritize the roadmap.
              </p>
              <Link
                href="mailto:founders@anti-detect.com?subject=Settings%20feedback"
                className="mt-4 inline-flex items-center text-sm font-semibold text-accent"
              >
                Contact support →
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
