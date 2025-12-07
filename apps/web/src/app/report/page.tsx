'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

const EXAMPLE_REPORTS = [
  { id: 'demo', label: 'Latest demo report' },
  { id: 'baseline', label: 'Baseline fingerprint' },
  { id: 'anomaly', label: 'Anomaly investigation' },
];

export default function ReportLandingPage() {
  const [reportId, setReportId] = useState('');
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reportId.trim();
    if (!trimmed) return;
    router.push(`/report/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="mx-auto w-full max-w-4xl space-y-10">
          <section className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">Reports</p>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary">Inspect a fingerprint report</h1>
            <p className="text-lg text-text-secondary">
              Paste any report ID below or open one of the curated examples to explore drift, anomalies, and telemetry.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-bg-secondary p-6 space-y-4">
            <label className="text-sm font-medium text-text-primary" htmlFor="report-id-input">
              Report ID
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                id="report-id-input"
                className="flex-1 rounded-lg border border-border bg-bg-primary px-4 py-3 text-sm text-text-primary"
                placeholder="rep_8f3a21f or demo"
                value={reportId}
                onChange={(event) => setReportId(event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="submit"
                className="rounded-lg bg-success px-6 py-3 text-sm font-semibold text-bg-primary hover:bg-success/90"
              >
                Open report
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Reports expire automatically based on your workspace retention policy. Contact support if you need archived data
              restored.
            </p>
          </form>

          <section className="rounded-2xl border border-border bg-bg-secondary p-6">
            <h2 className="text-lg font-semibold text-text-primary">Quick links</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {EXAMPLE_REPORTS.map((example) => (
                <Link
                  key={example.id}
                  href={`/report/${example.id}`}
                  className="rounded-xl border border-border-subtle bg-bg-primary px-4 py-3 text-sm text-text-secondary hover:border-accent"
                >
                  <span className="block text-text-primary font-medium">{example.label}</span>
                  <span className="text-xs text-text-muted">/report/{example.id}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
