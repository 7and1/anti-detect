'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled UI error', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">We hit a bump.</h1>
        <p className="mt-3 text-base text-muted-foreground">
          The page crashed. You can retry, or head back to the fingerprint scanner.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-muted-foreground/80">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-muted/60"
          >
            Go to scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
