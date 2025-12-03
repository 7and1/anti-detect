# Routing and Deployment Specification

**Version:** 1.0
**Last Updated:** 2025-12-01
**Status:** Production Ready

---

## Table of Contents

1. [Complete Route Map](#1-complete-route-map)
2. [Next.js App Router Configuration](#2-nextjs-app-router-configuration)
3. [Middleware Configuration](#3-middleware-configuration)
4. [Cloudflare Workers Configuration](#4-cloudflare-workers-configuration)
5. [Cloudflare Pages Configuration](#5-cloudflare-pages-configuration)
6. [DNS Configuration](#6-dns-configuration)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Environment Variables](#8-environment-variables)
9. [Monitoring Setup](#9-monitoring-setup)
10. [Caching Strategy](#10-caching-strategy)
11. [Launch Checklist](#11-launch-checklist)

---

## 1. Complete Route Map

### 1.1 Route Architecture Overview

```
anti-detect.com/
├── (marketing)/           # Marketing & static pages
│   ├── /                 # Homepage (Scanner)
│   ├── /about            # About page
│   ├── /privacy          # Privacy policy
│   └── /terms            # Terms of service
│
├── tools/                # Tool suite
│   ├── /tools            # Tools index page
│   ├── /tools/generator  # Fingerprint generator
│   ├── /tools/challenge  # Challenge arena
│   ├── /tools/webrtc-leak       # WebRTC leak test
│   ├── /tools/canvas-fingerprint # Canvas test
│   ├── /tools/font-fingerprint   # Font detection
│   ├── /tools/tls-fingerprint    # TLS fingerprint
│   └── /tools/timezone-check     # Timezone checker
│
├── report/               # Shareable reports
│   ├── /report/[uuid]    # View report
│   └── /report/[uuid]/pdf # Generate PDF
│
├── learn/                # SEO content hub
│   ├── /learn            # Content hub index
│   └── /learn/[slug]     # MDX content pages
│
└── api/                  # API proxy routes
    └── /api/*            # Proxy to Worker
```

### 1.2 Detailed Route Specifications

#### Marketing Route Group `(marketing)`

```typescript
// apps/web/src/app/(marketing)/layout.tsx
// Shared layout for marketing pages (header, footer, CTA bars)

Routes:
┌─────────────────────────────────────────────────────────────────┐
│ Route: /                                                         │
│ Page: apps/web/src/app/(marketing)/page.tsx                    │
│ Title: "Anti-detect.com - Browser Fingerprint Scanner"         │
│ Description: "Detect 50+ fingerprint signals. Free tool."      │
│ Component: <ScannerPage />                                      │
│ Features:                                                        │
│   - Real-time fingerprint scanner                               │
│   - Live detection cards (JavaScript, WebRTC, Canvas, etc.)    │
│   - Threat score calculation                                    │
│   - CTA to Multilogin                                           │
│ Cache: ISR, revalidate every 3600s                             │
│ OG Image: /og/scanner.png                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /about                                                    │
│ Page: apps/web/src/app/(marketing)/about/page.tsx              │
│ Title: "About Anti-detect.com"                                  │
│ Component: <AboutPage />                                         │
│ Features:                                                        │
│   - Mission statement                                            │
│   - Technology overview                                          │
│   - Privacy commitment                                           │
│   - Team/company info (optional)                                │
│ Cache: Static (generateStaticParams)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /privacy                                                  │
│ Page: apps/web/src/app/(marketing)/privacy/page.tsx            │
│ Title: "Privacy Policy - Anti-detect.com"                       │
│ Component: <PrivacyPage />                                       │
│ Features: Legal document with TOC                               │
│ Cache: Static                                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /terms                                                    │
│ Page: apps/web/src/app/(marketing)/terms/page.tsx              │
│ Title: "Terms of Service - Anti-detect.com"                     │
│ Component: <TermsPage />                                         │
│ Features: Legal document with TOC                               │
│ Cache: Static                                                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Tools Route Group

```typescript
// apps/web/src/app/tools/layout.tsx
// Shared layout for all tools (navigation sidebar, breadcrumbs)

Routes:
┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools                                                    │
│ Page: apps/web/src/app/tools/page.tsx                          │
│ Title: "Browser Fingerprint Tools - Anti-detect.com"           │
│ Component: <ToolsIndexPage />                                    │
│ Features:                                                        │
│   - Grid of all available tools                                 │
│   - Tool categories                                              │
│   - Quick access cards                                           │
│ Cache: ISR, revalidate every 3600s                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools/generator                                          │
│ Page: apps/web/src/app/tools/generator/page.tsx                │
│ Title: "Fingerprint Generator - Create Browser Profiles"       │
│ Component: <GeneratorPage />                                     │
│ Features:                                                        │
│   - OS/Browser selection                                         │
│   - Fingerprint customization                                    │
│   - JSON export                                                  │
│   - Multilogin integration                                       │
│ Cache: Dynamic (user interactions)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools/challenge                                          │
│ Page: apps/web/src/app/tools/challenge/page.tsx                │
│ Title: "Challenge Arena - Test Anti-bot Systems"               │
│ Component: <ChallengeArenaPage />                                │
│ Features:                                                        │
│   - Challenge cards (Cloudflare, PerimeterX, etc.)             │
│   - Real-time testing                                            │
│   - Success/failure tracking                                     │
│ Cache: Dynamic                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools/webrtc-leak                                        │
│ Page: apps/web/src/app/tools/webrtc-leak/page.tsx              │
│ Title: "WebRTC Leak Test - Detect IP Leaks"                    │
│ Component: <WebRTCLeakPage />                                    │
│ Features: Real-time WebRTC IP detection                         │
│ Cache: Dynamic                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools/canvas-fingerprint                                 │
│ Page: apps/web/src/app/tools/canvas-fingerprint/page.tsx       │
│ Title: "Canvas Fingerprint Test"                                │
│ Component: <CanvasFingerprintPage />                             │
│ Features: Canvas rendering analysis                             │
│ Cache: Dynamic                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools/font-fingerprint                                   │
│ Page: apps/web/src/app/tools/font-fingerprint/page.tsx         │
│ Title: "Font Detection Test"                                    │
│ Component: <FontFingerprintPage />                               │
│ Features: System font enumeration                               │
│ Cache: Dynamic                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools/tls-fingerprint                                    │
│ Page: apps/web/src/app/tools/tls-fingerprint/page.tsx          │
│ Title: "TLS Fingerprint Test - JA3/JA4"                        │
│ Component: <TLSFingerprintPage />                                │
│ Features: TLS handshake analysis                                │
│ Cache: Dynamic                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /tools/timezone-check                                     │
│ Page: apps/web/src/app/tools/timezone-check/page.tsx           │
│ Title: "Timezone Checker - Detect Location Mismatches"         │
│ Component: <TimezoneCheckPage />                                 │
│ Features: Timezone vs IP location comparison                    │
│ Cache: Dynamic                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Reports Route Group

```typescript
// Shareable scan reports with UUID-based URLs

Routes:
┌─────────────────────────────────────────────────────────────────┐
│ Route: /report/[uuid]                                            │
│ Page: apps/web/src/app/report/[uuid]/page.tsx                  │
│ Title: "Fingerprint Scan Report - Anti-detect.com"             │
│ Component: <ReportPage />                                        │
│ Features:                                                        │
│   - Shareable scan results                                       │
│   - QR code for mobile sharing                                  │
│   - Export to PDF button                                         │
│   - Social meta tags with preview                               │
│ Cache: ISR with on-demand revalidation                          │
│ Dynamic Params: generateStaticParams for popular reports        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /report/[uuid]/pdf                                        │
│ Page: apps/web/src/app/report/[uuid]/pdf/route.ts              │
│ Type: Route Handler (GET)                                        │
│ Response: application/pdf                                        │
│ Features:                                                        │
│   - Generate PDF from scan data                                  │
│   - Puppeteer rendering via Cloudflare Browser Rendering API   │
│   - Store in R2 bucket for caching                              │
│   - Return pre-signed URL                                        │
│ Headers:                                                         │
│   - Content-Type: application/pdf                               │
│   - Content-Disposition: attachment; filename="report.pdf"      │
└─────────────────────────────────────────────────────────────────┘
```

#### Learn (SEO Content Hub)

```typescript
// MDX-powered content hub for SEO

Routes:
┌─────────────────────────────────────────────────────────────────┐
│ Route: /learn                                                    │
│ Page: apps/web/src/app/learn/page.tsx                          │
│ Title: "Learn About Browser Fingerprinting"                     │
│ Component: <LearnIndexPage />                                    │
│ Features:                                                        │
│   - Content grid with categories                                 │
│   - Featured articles                                            │
│   - Search/filter                                                │
│ Cache: ISR, revalidate every 3600s                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Route: /learn/[slug]                                             │
│ Page: apps/web/src/app/learn/[slug]/page.tsx                   │
│ Title: Dynamic (from MDX frontmatter)                           │
│ Component: <LearnArticlePage />                                  │
│ Features:                                                        │
│   - MDX content rendering                                        │
│   - Code syntax highlighting                                     │
│   - Table of contents                                            │
│   - Related articles                                             │
│   - Reading time estimate                                        │
│ Content Source: apps/web/content/learn/*.mdx                   │
│ Cache: Static (generateStaticParams from MDX files)             │
│                                                                  │
│ Example slugs:                                                   │
│   - /learn/what-is-browser-fingerprinting                       │
│   - /learn/canvas-fingerprinting-explained                      │
│   - /learn/webrtc-leak-prevention                               │
│   - /learn/multilogin-setup-guide                               │
└─────────────────────────────────────────────────────────────────┘
```

#### API Routes (Proxy to Worker)

```typescript
// Next.js API routes proxy requests to Cloudflare Worker

Routes:
┌─────────────────────────────────────────────────────────────────┐
│ Route: /api/*                                                    │
│ Behavior: Proxy all requests to Cloudflare Worker API          │
│ Worker URL: https://api.anti-detect.com                        │
│                                                                  │
│ Implementation: apps/web/src/middleware.ts                      │
│                                                                  │
│ Example routing:                                                 │
│   Frontend: POST /api/scan/start                                │
│   → Worker: POST https://api.anti-detect.com/api/scan/start    │
│                                                                  │
│   Frontend: GET /api/report/abc-123                             │
│   → Worker: GET https://api.anti-detect.com/api/report/abc-123 │
│                                                                  │
│ Headers forwarded:                                               │
│   - Authorization (if present)                                   │
│   - User-Agent                                                   │
│   - CF-Connecting-IP (Cloudflare IP)                           │
│   - CF-Ray (Request ID)                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Route Metadata Template

```typescript
// apps/web/src/app/(marketing)/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anti-detect.com - Browser Fingerprint Scanner',
  description: 'Detect 50+ browser fingerprint signals. Free tool to check WebRTC leaks, canvas fingerprinting, and tracking methods. Protect your privacy.',
  keywords: ['browser fingerprint', 'webrtc leak', 'canvas fingerprinting', 'anti-detect browser', 'privacy tools'],

  // Open Graph
  openGraph: {
    title: 'Anti-detect.com - Browser Fingerprint Scanner',
    description: 'Detect 50+ fingerprint signals instantly',
    url: 'https://anti-detect.com',
    siteName: 'Anti-detect.com',
    images: [
      {
        url: 'https://anti-detect.com/og/scanner.png',
        width: 1200,
        height: 630,
        alt: 'Anti-detect.com Scanner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Anti-detect.com - Browser Fingerprint Scanner',
    description: 'Detect 50+ fingerprint signals instantly',
    images: ['https://anti-detect.com/og/scanner.png'],
    creator: '@multilogin',
  },

  // Canonical URL
  alternates: {
    canonical: 'https://anti-detect.com',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

---

## 2. Next.js App Router Configuration

### 2.1 Root Layout

```typescript
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@/components/Analytics';
import { Providers } from '@/components/Providers';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://anti-detect.com'),
  title: {
    default: 'Anti-detect.com - Browser Fingerprint Scanner',
    template: '%s | Anti-detect.com',
  },
  description: 'Advanced browser fingerprint detection and anti-tracking toolkit',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
```

### 2.2 Marketing Layout

```typescript
// apps/web/src/app/(marketing)/layout.tsx
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CTABar } from '@/components/marketing/CTABar';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <CTABar />
      <Footer />
    </div>
  );
}
```

### 2.3 Tools Layout

```typescript
// apps/web/src/app/tools/layout.tsx
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToolsSidebar } from '@/components/tools/ToolsSidebar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <ToolsSidebar />
        <main className="flex-1 p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

### 2.4 Loading States

```typescript
// apps/web/src/app/(marketing)/loading.tsx
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <Skeleton className="h-12 w-3/4 mb-4" />
      <Skeleton className="h-6 w-1/2 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}

// apps/web/src/app/tools/loading.tsx
import { ToolCardSkeleton } from '@/components/tools/ToolCardSkeleton';

export default function ToolsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### 2.5 Error Boundaries

```typescript
// apps/web/src/app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry
    console.error('Root error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
      <h1 className="text-4xl font-bold mb-2">Something went wrong!</h1>
      <p className="text-zinc-400 mb-8 text-center max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go home
        </Button>
      </div>
    </div>
  );
}

// apps/web/src/app/tools/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

export default function ToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tools error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Tool Error</h2>
      <p className="text-zinc-400 mb-6 text-center max-w-md">
        {error.message || 'Failed to load tool. Please try again.'}
      </p>
      <Button onClick={() => reset()}>Retry</Button>
    </div>
  );
}
```

### 2.6 Not Found Pages

```typescript
// apps/web/src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <FileQuestion className="h-24 w-24 text-zinc-600 mb-6" />
      <h1 className="text-6xl font-bold mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-zinc-400 mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tools">Browse tools</Link>
        </Button>
      </div>
    </div>
  );
}
```

### 2.7 Route Handlers Example

```typescript
// apps/web/src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  });
}

// apps/web/src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path');
  const tag = request.nextUrl.searchParams.get('tag');

  if (path) {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  }

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag });
  }

  return NextResponse.json({ message: 'Missing path or tag' }, { status: 400 });
}
```

---

## 3. Middleware Configuration

### 3.1 Next.js Middleware

```typescript
// apps/web/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cloudflare Worker API URL
const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_API_URL || 'https://api.anti-detect.com';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API Proxy: Forward /api/* to Cloudflare Worker
  if (pathname.startsWith('/api/')) {
    const workerUrl = new URL(pathname, WORKER_API_URL);
    workerUrl.search = request.nextUrl.search;

    return NextResponse.rewrite(workerUrl);
  }

  // 2. Security Headers
  const response = NextResponse.next();

  // CSP Header
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.anti-detect.com wss://api.anti-detect.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 3.2 Internationalization Setup (Future)

```typescript
// apps/web/src/middleware.ts (i18n version)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  return matchLocale(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  return NextResponse.redirect(request.nextUrl);
}
```

---

## 4. Cloudflare Workers Configuration

### 4.1 wrangler.toml (Complete Configuration)

```toml
# apps/api/wrangler.toml
name = "anti-detect-api"
compatibility_date = "2024-01-01"
main = "src/index.ts"

# Workers configuration
workers_dev = true
route = ""
zone_id = "" # Add after DNS setup

# Account ID (get from Cloudflare dashboard)
account_id = "YOUR_ACCOUNT_ID"

# Node.js compatibility
node_compat = true

# ===========================
# D1 Database Binding
# ===========================
[[d1_databases]]
binding = "DB"
database_name = "anti-detect-production"
database_id = "YOUR_D1_DATABASE_ID"

# Preview database for staging
[[d1_databases]]
binding = "DB"
database_name = "anti-detect-preview"
database_id = "YOUR_D1_PREVIEW_DATABASE_ID"
preview_database_id = "YOUR_D1_PREVIEW_DATABASE_ID"

# ===========================
# KV Namespace Bindings
# ===========================

# IP Cache (Geolocation data)
[[kv_namespaces]]
binding = "IP_CACHE"
id = "YOUR_KV_IP_CACHE_ID"
preview_id = "YOUR_KV_IP_CACHE_PREVIEW_ID"

# JA3 Database (TLS fingerprints)
[[kv_namespaces]]
binding = "JA3_DB"
id = "YOUR_KV_JA3_DB_ID"
preview_id = "YOUR_KV_JA3_DB_PREVIEW_ID"

# Rate Limiting (Token bucket state)
[[kv_namespaces]]
binding = "RATE_LIMITS"
id = "YOUR_KV_RATE_LIMITS_ID"
preview_id = "YOUR_KV_RATE_LIMITS_PREVIEW_ID"

# ===========================
# R2 Bucket Binding
# ===========================
[[r2_buckets]]
binding = "REPORTS_BUCKET"
bucket_name = "anti-detect-reports"
preview_bucket_name = "anti-detect-reports-preview"

# ===========================
# Environment Variables
# ===========================
[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
CORS_ORIGIN = "https://anti-detect.com"
RATE_LIMIT_WINDOW = "60000"  # 60 seconds
RATE_LIMIT_MAX_REQUESTS = "100"

# ===========================
# Routes (Production)
# ===========================
[[routes]]
pattern = "api.anti-detect.com/*"
zone_name = "anti-detect.com"

# ===========================
# Cron Triggers
# ===========================
[triggers]
crons = [
  "0 0 * * *",    # Daily cleanup at midnight UTC
  "0 */6 * * *"   # Analytics aggregation every 6 hours
]

# ===========================
# Observability
# ===========================
[observability]
enabled = true

# Logpush to R2
[logpush]
enabled = true

# ===========================
# Limits
# ===========================
[limits]
cpu_ms = 50  # CPU time limit per request

# ===========================
# Build Configuration
# ===========================
[build]
command = "npm run build"
watch_dirs = ["src"]

[build.upload]
format = "service-worker"

# ===========================
# Development Environment
# ===========================
[env.development]
vars = { ENVIRONMENT = "development", LOG_LEVEL = "debug" }

# ===========================
# Staging Environment
# ===========================
[env.staging]
vars = { ENVIRONMENT = "staging", CORS_ORIGIN = "https://staging.anti-detect.com" }

[[env.staging.routes]]
pattern = "api-staging.anti-detect.com/*"
zone_name = "anti-detect.com"
```

### 4.2 Worker Entry Point

```typescript
// apps/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { scanRoutes } from './routes/scan';
import { generateRoutes } from './routes/generate';
import { challengeRoutes } from './routes/challenge';
import { reportRoutes } from './routes/report';
import { ipRoutes } from './routes/ip';
import { healthRoutes } from './routes/health';

import { rateLimitMiddleware } from './middleware/rate-limit';
import { errorHandler } from './middleware/error-handler';

export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  IP_CACHE: KVNamespace;
  JA3_DB: KVNamespace;
  RATE_LIMITS: KVNamespace;

  // R2 Bucket
  REPORTS_BUCKET: R2Bucket;

  // Environment Variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW: string;
  RATE_LIMIT_MAX_REQUESTS: string;
}

const app = new Hono<{ Bindings: Env }>();

// ===========================
// Global Middleware
// ===========================

// Logger
app.use('*', logger());

// Pretty JSON in development
app.use('*', prettyJSON());

// CORS
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = c.env.CORS_ORIGIN.split(',');
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400,
  credentials: true,
}));

// Rate Limiting
app.use('/api/*', rateLimitMiddleware);

// ===========================
// Routes
// ===========================

app.route('/api/health', healthRoutes);
app.route('/api/scan', scanRoutes);
app.route('/api/generate', generateRoutes);
app.route('/api/challenge', challengeRoutes);
app.route('/api/report', reportRoutes);
app.route('/api/ip', ipRoutes);

// ===========================
// Error Handling
// ===========================

app.onError(errorHandler);

// ===========================
// 404 Handler
// ===========================

app.notFound((c) => {
  return c.json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      statusCode: 404,
    },
  }, 404);
});

// ===========================
// Cron Handlers
// ===========================

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    switch (event.cron) {
      case '0 0 * * *':
        // Daily cleanup: Delete old reports, clear expired caches
        ctx.waitUntil(dailyCleanup(env));
        break;

      case '0 */6 * * *':
        // Analytics aggregation: Rollup scan data
        ctx.waitUntil(aggregateAnalytics(env));
        break;
    }
  },
};

async function dailyCleanup(env: Env) {
  // Delete reports older than 30 days
  await env.DB.prepare(`
    DELETE FROM reports
    WHERE created_at < datetime('now', '-30 days')
  `).run();

  console.log('Daily cleanup completed');
}

async function aggregateAnalytics(env: Env) {
  // Aggregate scan statistics
  await env.DB.prepare(`
    INSERT INTO scan_stats (date, total_scans, unique_ips)
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total_scans,
      COUNT(DISTINCT ip_address) as unique_ips
    FROM scans
    WHERE created_at >= datetime('now', '-6 hours')
    GROUP BY DATE(created_at)
    ON CONFLICT(date) DO UPDATE SET
      total_scans = total_scans + excluded.total_scans,
      unique_ips = unique_ips + excluded.unique_ips
  `).run();

  console.log('Analytics aggregation completed');
}
```

### 4.3 D1 Database Setup Commands

```bash
# Create production database
wrangler d1 create anti-detect-production

# Create preview database
wrangler d1 create anti-detect-preview

# Run migrations (production)
wrangler d1 migrations apply anti-detect-production --remote

# Run migrations (local)
wrangler d1 migrations apply anti-detect-production --local

# Query database
wrangler d1 execute anti-detect-production --command "SELECT * FROM fingerprints LIMIT 10"

# Backup database
wrangler d1 export anti-detect-production --output backup.sql
```

### 4.4 KV Namespace Setup Commands

```bash
# Create KV namespaces
wrangler kv:namespace create "IP_CACHE"
wrangler kv:namespace create "IP_CACHE" --preview

wrangler kv:namespace create "JA3_DB"
wrangler kv:namespace create "JA3_DB" --preview

wrangler kv:namespace create "RATE_LIMITS"
wrangler kv:namespace create "RATE_LIMITS" --preview

# Populate KV data
wrangler kv:key put --namespace-id=YOUR_KV_ID "ja3:hash123" "Chrome 120 / Windows 10"

# Bulk upload
wrangler kv:key bulk put --namespace-id=YOUR_KV_ID ja3-database.json

# List keys
wrangler kv:key list --namespace-id=YOUR_KV_ID

# Get value
wrangler kv:key get --namespace-id=YOUR_KV_ID "ja3:hash123"
```

### 4.5 R2 Bucket Setup Commands

```bash
# Create R2 buckets
wrangler r2 bucket create anti-detect-reports
wrangler r2 bucket create anti-detect-reports-preview

# List buckets
wrangler r2 bucket list

# Upload file
wrangler r2 object put anti-detect-reports/test.pdf --file=./test.pdf

# List objects
wrangler r2 object list anti-detect-reports

# Download object
wrangler r2 object get anti-detect-reports/test.pdf --file=./downloaded.pdf
```

---

## 5. Cloudflare Pages Configuration

### 5.1 Build Configuration

```yaml
# Cloudflare Pages Dashboard Settings
# (Set in Pages > Settings > Builds & deployments)

Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: apps/web
Node version: 18

# Environment variables (Production)
NEXT_PUBLIC_WORKER_API_URL=https://api.anti-detect.com
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SITE_URL=https://anti-detect.com
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
NODE_ENV=production
```

### 5.2 Functions Configuration

```typescript
// apps/web/functions/_middleware.ts
// Cloudflare Pages Functions

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: {
    ASSETS: Fetcher;
  };
}) {
  const response = await context.next();

  // Add custom headers to all responses
  response.headers.set('X-Powered-By', 'Cloudflare Pages');

  return response;
}
```

### 5.3 Custom Domains

```yaml
# Cloudflare Pages > Custom domains

Primary domain:
  anti-detect.com

Additional domains:
  www.anti-detect.com → Redirect to anti-detect.com

Preview deployments:
  [branch-name].anti-detect.pages.dev

Production deployment:
  anti-detect.pages.dev
```

### 5.4 Build Cache

```yaml
# Cloudflare Pages > Settings > Build cache

Enable build cache: Yes
Cache key: node_modules/.cache

# Cache directories:
- node_modules
- .next/cache
- apps/web/.next/cache
```

---

## 6. DNS Configuration

### 6.1 Cloudflare DNS Records

```dns
# Root Domain
Type: A
Name: anti-detect.com
Content: 192.0.2.1 (Cloudflare Pages IP - auto-assigned)
Proxy: Enabled (Orange cloud)
TTL: Auto

# WWW Subdomain
Type: CNAME
Name: www
Content: anti-detect.com
Proxy: Enabled
TTL: Auto

# API Subdomain
Type: CNAME
Name: api
Content: anti-detect.com (Workers route)
Proxy: Enabled
TTL: Auto

# Email (if needed)
Type: MX
Name: anti-detect.com
Priority: 10
Content: mx.your-provider.com
Proxy: Disabled
TTL: Auto
```

### 6.2 SSL/TLS Settings

```yaml
# Cloudflare > SSL/TLS

SSL/TLS encryption mode: Full (strict)

Edge Certificates:
  - Always Use HTTPS: On
  - HTTP Strict Transport Security (HSTS): Enabled
    - Max Age: 12 months
    - Include subdomains: Yes
    - Preload: Yes
    - No-Sniff: Yes

  - Minimum TLS Version: TLS 1.2
  - Opportunistic Encryption: On
  - TLS 1.3: Enabled
  - Automatic HTTPS Rewrites: On
  - Certificate Transparency Monitoring: On

Origin Server:
  - Origin certificate: Cloudflare Origin Certificate (15 years)
  - Authenticated Origin Pulls: On
```

### 6.3 WAF Rules

```yaml
# Cloudflare > Security > WAF

Managed Rules:
  - Cloudflare Managed Ruleset: Enabled
  - OWASP Core Ruleset: Enabled

Rate Limiting Rules:
  - Name: API Rate Limit
    Expression: (http.request.uri.path contains "/api/")
    Rate: 100 requests per 60 seconds
    Action: Challenge

  - Name: Scanner Rate Limit
    Expression: (http.request.uri.path eq "/")
    Rate: 20 requests per 60 seconds
    Action: Block
    Duration: 300 seconds

Custom Rules:
  - Name: Block Bad Bots
    Expression: (cf.client.bot) and not (cf.verified_bot_category in {"Search Engine Crawler"})
    Action: Block

  - Name: Geo-block High Risk Countries (Optional)
    Expression: (ip.geoip.country in {"CN" "RU" "KP"})
    Action: Challenge
```

### 6.4 Page Rules

```yaml
# Cloudflare > Rules > Page Rules

Rule 1: Cache Static Assets
  URL: anti-detect.com/_next/static/*
  Settings:
    - Cache Level: Cache Everything
    - Edge Cache TTL: 1 month
    - Browser Cache TTL: 1 month

Rule 2: Force HTTPS
  URL: http://anti-detect.com/*
  Settings:
    - Always Use HTTPS: On

Rule 3: WWW Redirect
  URL: www.anti-detect.com/*
  Settings:
    - Forwarding URL: 301 Redirect to https://anti-detect.com/$1
```

---

## 7. CI/CD Pipeline

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  # ===========================
  # Lint & Type Check
  # ===========================
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript check
        run: pnpm type-check

  # ===========================
  # Test
  # ===========================
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run integration tests
        run: pnpm test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  # ===========================
  # Build Web App
  # ===========================
  build-web:
    name: Build Web
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web app
        run: pnpm build:web
        env:
          NEXT_PUBLIC_WORKER_API_URL: ${{ secrets.NEXT_PUBLIC_WORKER_API_URL }}
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: apps/web/.next

  # ===========================
  # Build API Worker
  # ===========================
  build-api:
    name: Build API
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build API worker
        run: pnpm build:api

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: api-build
          path: apps/api/dist

  # ===========================
  # Deploy Web (Pages)
  # ===========================
  deploy-web:
    name: Deploy Web to Cloudflare Pages
    runs-on: ubuntu-latest
    needs: [build-web]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://anti-detect.com
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: web-build
          path: apps/web/.next

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: anti-detect-web
          directory: apps/web/.next
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

  # ===========================
  # Deploy API (Workers)
  # ===========================
  deploy-api:
    name: Deploy API to Cloudflare Workers
    runs-on: ubuntu-latest
    needs: [build-api]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://api.anti-detect.com
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: api-build
          path: apps/api/dist

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: apps/api
          command: deploy --env production

  # ===========================
  # Deploy Preview (PR)
  # ===========================
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [build-web, build-api]
    if: github.event_name == 'pull_request'
    environment:
      name: preview
      url: https://pr-${{ github.event.number }}.anti-detect.pages.dev
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download web build
        uses: actions/download-artifact@v3
        with:
          name: web-build
          path: apps/web/.next

      - name: Deploy Preview to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: anti-detect-web
          directory: apps/web/.next
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          branch: pr-${{ github.event.number }}

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed to https://pr-${{ github.event.number }}.anti-detect.pages.dev`
            })
```

### 7.2 Secrets Management

```yaml
# GitHub Repository > Settings > Secrets and variables > Actions

Required Secrets:
  CLOUDFLARE_API_TOKEN          # Cloudflare API token (Edit Workers, Edit Pages)
  CLOUDFLARE_ACCOUNT_ID         # Cloudflare account ID
  NEXT_PUBLIC_WORKER_API_URL    # API worker URL (https://api.anti-detect.com)
  NEXT_PUBLIC_SITE_URL          # Site URL (https://anti-detect.com)
  SENTRY_DSN                    # Sentry error tracking DSN
  REVALIDATION_SECRET           # Secret for on-demand revalidation

Optional Secrets:
  CODECOV_TOKEN                 # Code coverage reporting
  SLACK_WEBHOOK_URL             # Deployment notifications
```

---

## 8. Environment Variables

### 8.1 Web App (.env)

```bash
# apps/web/.env.local (Development)
NEXT_PUBLIC_WORKER_API_URL=http://localhost:8787
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=1.0.0-dev
NEXT_PUBLIC_SENTRY_DSN=
NODE_ENV=development
REVALIDATION_SECRET=dev-secret-change-in-production

# apps/web/.env.production (Production)
NEXT_PUBLIC_WORKER_API_URL=https://api.anti-detect.com
NEXT_PUBLIC_SITE_URL=https://anti-detect.com
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production
REVALIDATION_SECRET=CHANGE_THIS_IN_PRODUCTION_USE_STRONG_SECRET
```

### 8.2 API Worker (.dev.vars)

```bash
# apps/api/.dev.vars (Development)
ENVIRONMENT=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
SENTRY_DSN=

# Production values set in wrangler.toml [vars] section
```

### 8.3 Environment Variables Table

| Variable | Web | API | Description | Example |
|----------|-----|-----|-------------|---------|
| `NEXT_PUBLIC_WORKER_API_URL` | ✅ | ❌ | Worker API URL | `https://api.anti-detect.com` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ❌ | Frontend URL | `https://anti-detect.com` |
| `NEXT_PUBLIC_APP_VERSION` | ✅ | ❌ | App version | `1.0.0` |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ | ❌ | Sentry DSN (public) | `https://...@sentry.io/...` |
| `REVALIDATION_SECRET` | ✅ | ❌ | ISR revalidation secret | Random 32-char string |
| `ENVIRONMENT` | ❌ | ✅ | Environment name | `production` |
| `LOG_LEVEL` | ❌ | ✅ | Logging verbosity | `info` / `debug` |
| `CORS_ORIGIN` | ❌ | ✅ | Allowed origins | `https://anti-detect.com` |
| `RATE_LIMIT_WINDOW` | ❌ | ✅ | Rate limit window (ms) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | ✅ | Max requests per window | `100` |

---

## 9. Monitoring Setup

### 9.1 Cloudflare Analytics

```yaml
# Enable in Cloudflare Dashboard

Web Analytics:
  - Enabled: Yes
  - Site tag: <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
  - Privacy mode: Yes
  - Automatic installation: Via Pages integration

Workers Analytics:
  - GraphQL Analytics API: Enabled
  - Metrics tracked:
    - Request count
    - Response time (p50, p95, p99)
    - Error rate
    - CPU time
    - KV operations

Logs:
  - Logpush: Enabled
  - Destination: R2 bucket (anti-detect-logs)
  - Fields: All available
  - Retention: 30 days
```

### 9.2 Sentry Configuration

```typescript
// apps/web/src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    // Filter out known errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
    return event;
  },

  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['anti-detect.com', 'api.anti-detect.com'],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// apps/api/src/lib/sentry.ts
import { Toucan } from 'toucan-js';

export function initSentry(request: Request, env: Env, ctx: ExecutionContext) {
  return new Toucan({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    request,
    context: ctx,
    requestDataOptions: {
      allowedHeaders: ['user-agent', 'cf-ray', 'cf-connecting-ip'],
    },
  });
}
```

### 9.3 Uptime Monitoring

```yaml
# Use Cloudflare Health Checks or external service (UptimeRobot, Pingdom)

Monitors:
  - Name: Homepage
    URL: https://anti-detect.com
    Method: GET
    Interval: 60 seconds
    Timeout: 10 seconds
    Expected: 200 OK

  - Name: API Health
    URL: https://api.anti-detect.com/api/health
    Method: GET
    Interval: 60 seconds
    Timeout: 5 seconds
    Expected: 200 OK, Body contains "ok"

  - Name: Scanner Tool
    URL: https://anti-detect.com/
    Method: GET
    Interval: 300 seconds
    Expected: 200 OK, Body contains "Scanner"

Alerts:
  - Email: ops@anti-detect.com
  - Slack: #monitoring channel
  - PagerDuty: P1 incidents
```

### 9.4 Performance Monitoring

```typescript
// apps/web/src/lib/vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to Cloudflare Analytics
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    const body = JSON.stringify(metric);
    navigator.sendBeacon('/api/vitals', body);
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// apps/web/src/app/api/vitals/route.ts
export async function POST(request: Request) {
  const metric = await request.json();

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric);
  }

  // Send to analytics service
  // await sendToCloudflareAnalytics(metric);

  return new Response('OK', { status: 200 });
}
```

---

## 10. Caching Strategy

### 10.1 Cloudflare Cache Rules

```yaml
# Cloudflare > Caching > Cache Rules

Static Assets Rule:
  Name: Cache Static Assets
  Expression: (http.request.uri.path contains "/_next/static/")
  Cache eligibility: Eligible for cache
  Cache TTL:
    - Edge TTL: 1 year
    - Browser TTL: 1 year
  Cache key:
    - Query string: Include all
    - Headers: None
  Respect origin: No

Dynamic Pages Rule:
  Name: Cache Dynamic Pages
  Expression: (http.request.uri.path eq "/") or (http.request.uri.path contains "/tools/")
  Cache eligibility: Eligible for cache
  Cache TTL:
    - Edge TTL: 1 hour
    - Browser TTL: 0 (no browser cache, use stale-while-revalidate)
  Cache key:
    - Query string: Ignore all
    - Headers: Accept-Language
  Respect origin: Yes (honor Cache-Control)

API Responses Rule:
  Name: Cache API Responses
  Expression: (http.request.uri.path contains "/api/") and (http.request.method eq "GET")
  Cache eligibility: Eligible for cache
  Cache TTL:
    - Edge TTL: 5 minutes
    - Browser TTL: 0
  Cache key:
    - Query string: Include all
    - Headers: Authorization
  Respect origin: Yes
```

### 10.2 Next.js Cache Configuration

```typescript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static optimization
  output: 'standalone',

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year for static images
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.{jpg,jpeg,png,gif,svg,ico,webp,avif}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

module.exports = nextConfig;
```

### 10.3 ISR Configuration

```typescript
// apps/web/src/app/(marketing)/page.tsx
export const revalidate = 3600; // Revalidate every hour

// apps/web/src/app/tools/page.tsx
export const revalidate = 3600;

// apps/web/src/app/report/[uuid]/page.tsx
export const revalidate = 86400; // Revalidate every 24 hours

export async function generateStaticParams() {
  // Generate static pages for recent reports
  const reports = await getRecentReports(100);

  return reports.map((report) => ({
    uuid: report.uuid,
  }));
}

// apps/web/src/app/learn/[slug]/page.tsx
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const articles = getAllArticles();

  return articles.map((article) => ({
    slug: article.slug,
  }));
}
```

### 10.4 KV Caching in Worker

```typescript
// apps/api/src/lib/cache.ts
export async function getCachedOrFetch<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await kv.get(key, 'json');
  if (cached) {
    return cached as T;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await kv.put(key, JSON.stringify(data), {
    expirationTtl: ttl,
  });

  return data;
}

// Usage example
const ipInfo = await getCachedOrFetch(
  env.IP_CACHE,
  `ip:${clientIP}`,
  () => fetchIPInfo(clientIP),
  86400 // 24 hours
);
```

---

## 11. Launch Checklist

### 11.1 Pre-Launch Verification

```markdown
## Infrastructure
- [ ] Cloudflare account created
- [ ] Domain purchased and added to Cloudflare
- [ ] DNS records configured (A, CNAME, MX)
- [ ] SSL/TLS certificate active (Full strict mode)
- [ ] D1 database created and migrated
- [ ] KV namespaces created (IP_CACHE, JA3_DB, RATE_LIMITS)
- [ ] R2 bucket created (anti-detect-reports)
- [ ] Worker deployed to production
- [ ] Pages project connected to GitHub
- [ ] Custom domain linked to Pages
- [ ] Environment variables set (web + api)

## Code
- [ ] All TypeScript errors resolved
- [ ] ESLint passing (0 errors)
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Build succeeds (web + api)
- [ ] Production build tested locally
- [ ] No console.log in production code
- [ ] API keys rotated from development values

## Features
- [ ] Scanner detects all 50+ signals
- [ ] Generator creates valid fingerprints
- [ ] Challenge arena connects to services
- [ ] Report sharing works (UUID URLs)
- [ ] PDF export functional
- [ ] All individual tools working
- [ ] SEO content pages render correctly
- [ ] MDX articles display properly

## Performance
- [ ] Lighthouse score >90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Core Web Vitals passing (LCP <2.5s, FID <100ms, CLS <0.1)
- [ ] Page load time <3s on 3G
- [ ] API response time <200ms (p95)
- [ ] Images optimized (AVIF/WebP)
- [ ] Fonts subset and preloaded
- [ ] Code split (bundle size <200KB initial)

## Security
- [ ] HTTPS enforced (HSTS enabled)
- [ ] CSP header configured
- [ ] XSS protection enabled
- [ ] CSRF protection implemented
- [ ] Rate limiting active (API + frontend)
- [ ] WAF rules enabled
- [ ] Secrets not exposed in client code
- [ ] API authentication working
- [ ] CORS properly configured
- [ ] Security headers verified (securityheaders.com A+ rating)

## SEO
- [ ] Meta tags complete (title, description, OG, Twitter)
- [ ] Sitemap.xml generated and submitted
- [ ] Robots.txt configured
- [ ] Schema.org markup added
- [ ] Canonical URLs set
- [ ] 404 page styled
- [ ] Redirects configured (www → non-www)
- [ ] Google Search Console verified
- [ ] Google Analytics / Cloudflare Analytics enabled

## Monitoring
- [ ] Sentry error tracking configured
- [ ] Uptime monitoring active (3 endpoints)
- [ ] Cloudflare Analytics enabled
- [ ] Web Vitals reporting working
- [ ] Alert notifications configured (email, Slack)
- [ ] Log retention set (30 days)
- [ ] Backup strategy documented

## Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent (if applicable)
- [ ] GDPR compliance verified
- [ ] Contact email configured

## Documentation
- [ ] README.md updated
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Runbook created (incident response)
- [ ] Architecture diagram included
- [ ] Changelog initialized
```

### 11.2 DNS Propagation Check

```bash
# Check DNS propagation globally
dig anti-detect.com @8.8.8.8
dig anti-detect.com @1.1.1.1

# Check from multiple locations
curl https://www.whatsmydns.net/api/lookup?query=anti-detect.com&type=A

# Verify SSL certificate
openssl s_client -connect anti-detect.com:443 -servername anti-detect.com

# Test HSTS
curl -I https://anti-detect.com | grep -i strict-transport-security
```

### 11.3 SSL Verification

```bash
# Test SSL configuration
ssllabs.com/ssltest/analyze.html?d=anti-detect.com

# Expected results:
# - Overall Rating: A+
# - Certificate: Valid (Cloudflare Origin)
# - Protocol Support: TLS 1.2, TLS 1.3
# - Key Exchange: ECDHE 256 bits
# - Cipher Strength: 256 bits
# - HSTS: Yes (max-age=31536000)
```

### 11.4 Performance Baseline

```yaml
# Lighthouse Audit (Run from PageSpeed Insights)

Target Scores:
  Performance: 95+
  Accessibility: 100
  Best Practices: 100
  SEO: 100

Core Web Vitals:
  LCP (Largest Contentful Paint): <2.5s
  FID (First Input Delay): <100ms
  CLS (Cumulative Layout Shift): <0.1
  TTFB (Time to First Byte): <600ms
  FCP (First Contentful Paint): <1.8s

# WebPageTest.org (3G connection)
  First Byte: <1s
  Start Render: <2s
  Speed Index: <3s
  Fully Loaded: <5s
```

### 11.5 Post-Launch Monitoring

```yaml
First 24 Hours:
  - [ ] Monitor error rates (target: <0.1%)
  - [ ] Check API response times (target: p95 <200ms)
  - [ ] Verify cache hit ratio (target: >80%)
  - [ ] Confirm zero downtime
  - [ ] Review logs for anomalies
  - [ ] Test from multiple geos (US, EU, Asia)
  - [ ] Monitor costs (Workers requests, R2 storage)

First Week:
  - [ ] Analyze traffic patterns
  - [ ] Review Web Vitals trends
  - [ ] Check conversion funnel (scanner → CTA)
  - [ ] Optimize slow endpoints
  - [ ] Adjust rate limits if needed
  - [ ] Review security alerts
  - [ ] Gather user feedback

First Month:
  - [ ] Performance regression testing
  - [ ] SEO ranking check
  - [ ] Cost optimization review
  - [ ] Feature usage analytics
  - [ ] Planned maintenance window
  - [ ] Backup/restore test
  - [ ] Incident retrospective (if any)
```

---

## 12. Quick Reference Commands

### 12.1 Development

```bash
# Start development servers
pnpm dev           # Runs web + api in parallel
pnpm dev:web       # Next.js dev server (localhost:3000)
pnpm dev:api       # Wrangler dev server (localhost:8787)

# Build
pnpm build         # Build all apps
pnpm build:web     # Build web app only
pnpm build:api     # Build API worker only

# Testing
pnpm test          # Run all tests
pnpm test:unit     # Unit tests only
pnpm test:e2e      # End-to-end tests
pnpm lint          # ESLint
pnpm type-check    # TypeScript check
```

### 12.2 Deployment

```bash
# Deploy to production
pnpm deploy:web    # Deploy web to Cloudflare Pages
pnpm deploy:api    # Deploy API to Cloudflare Workers
pnpm deploy        # Deploy both

# Deploy to staging
pnpm deploy:web --env staging
pnpm deploy:api --env staging

# Preview deployment
wrangler pages publish apps/web/.next --project-name=anti-detect-web --branch=preview
```

### 12.3 Database Operations

```bash
# Run migrations
wrangler d1 migrations apply anti-detect-production --remote

# Query database
wrangler d1 execute anti-detect-production --command "SELECT COUNT(*) FROM fingerprints"

# Backup database
wrangler d1 export anti-detect-production --output backup-$(date +%Y%m%d).sql

# Seed database
wrangler d1 execute anti-detect-production --file seed.sql --remote
```

### 12.4 Cache Management

```bash
# Clear Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Revalidate specific path (Next.js ISR)
curl -X POST "https://anti-detect.com/api/revalidate?secret=YOUR_SECRET&path=/"

# Clear KV namespace
wrangler kv:key delete --namespace-id=YOUR_KV_ID "key-to-delete"
```

---

## Appendix A: File Structure Reference

```
anti-detect.com/
├── apps/
│   ├── web/                                # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx           # Homepage (Scanner)
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   ├── error.tsx
│   │   │   │   │   ├── about/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── privacy/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── terms/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── tools/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx           # Tools index
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   ├── error.tsx
│   │   │   │   │   ├── generator/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── challenge/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── webrtc-leak/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── canvas-fingerprint/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── font-fingerprint/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── tls-fingerprint/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── timezone-check/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── report/
│   │   │   │   │   └── [uuid]/
│   │   │   │   │       ├── page.tsx        # View report
│   │   │   │   │       └── pdf/
│   │   │   │   │           └── route.ts    # PDF generation
│   │   │   │   ├── learn/
│   │   │   │   │   ├── page.tsx            # Content hub
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx        # MDX article
│   │   │   │   ├── api/
│   │   │   │   │   ├── health/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── revalidate/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── vitals/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── layout.tsx              # Root layout
│   │   │   │   ├── error.tsx               # Root error boundary
│   │   │   │   ├── not-found.tsx           # 404 page
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── content/
│   │   │   └── learn/                      # MDX content
│   │   ├── public/
│   │   ├── middleware.ts
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                                # Cloudflare Workers API
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── lib/
│       │   └── index.ts
│       ├── wrangler.toml
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── database/                           # D1 schema & migrations
│   ├── types/                              # Shared TypeScript types
│   └── config/                             # Shared configs (ESLint, TS, etc.)
│
├── .github/
│   └── workflows/
│       └── deploy.yml                      # CI/CD pipeline
│
├── docs/
│   ├── BLUEPRINT.md
│   ├── API-SPECIFICATION.md
│   ├── COMPONENT-SPECIFICATIONS.md
│   ├── DATABASE-SCHEMA.md
│   └── ROUTING-DEPLOYMENT.md               # This file
│
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
└── README.md
```

---

## Appendix B: Troubleshooting

### Common Issues

**Issue: Build fails with "Module not found"**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

**Issue: Worker deployment fails with binding errors**
```bash
# Solution: Verify wrangler.toml binding IDs match Cloudflare dashboard
wrangler kv:namespace list
wrangler d1 list
wrangler r2 bucket list

# Update IDs in wrangler.toml
```

**Issue: DNS not resolving**
```bash
# Solution: Check DNS propagation and Cloudflare proxy status
dig anti-detect.com @1.1.1.1
nslookup anti-detect.com

# Ensure Cloudflare proxy is enabled (orange cloud)
```

**Issue: 500 errors from Worker**
```bash
# Solution: Check Worker logs
wrangler tail anti-detect-api --env production

# Enable debug logging
# Set LOG_LEVEL=debug in wrangler.toml
```

**Issue: ISR not revalidating**
```bash
# Solution: Manually revalidate
curl -X POST "https://anti-detect.com/api/revalidate?secret=YOUR_SECRET&path=/"

# Check Next.js cache headers
curl -I https://anti-detect.com/
```

---

**End of Document**

This specification is production-ready and can be used as a complete reference for deploying Anti-detect.com to Cloudflare's edge infrastructure. All configurations are copy-paste ready with placeholders for secrets and IDs.
