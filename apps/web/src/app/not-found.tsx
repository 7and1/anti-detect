import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Page not found</p>
        <h1 className="mt-2 text-3xl font-semibold text-text-primary">
          Let&apos;s get you back to scanning.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          The link you followed does not exist. Jump to the fingerprint scanner or explore our tools.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          >
            Open scanner
          </Link>
          <Link
            href="/tools"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-muted/60"
          >
            View tools
          </Link>
        </div>
      </div>
    </div>
  );
}
