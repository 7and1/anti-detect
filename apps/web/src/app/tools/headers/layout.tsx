import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HTTP Headers Test - Check Browser Headers & User Agent | Anti-detect.com',
  description:
    'Check your browser HTTP headers and User-Agent string. Test what information your browser sends to websites and identify potential tracking vectors.',
  keywords: [
    'http headers check',
    'browser headers test',
    'user agent checker',
    'http headers privacy',
    'browser headers detector',
    'user agent test',
    'http request headers',
    'browser header fingerprint',
    'accept headers test',
    'user agent fingerprint',
  ],
  openGraph: {
    title: 'HTTP Headers Test - Check Browser Headers & User Agent',
    description:
      'Check your browser HTTP headers. Free tool to test what information your browser sends to websites.',
    type: 'website',
    url: 'https://anti-detect.com/tools/headers',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HTTP Headers Test - Check Browser Headers & User Agent',
    description:
      'Check your browser HTTP headers. Free tool to test what information your browser sends to websites.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/headers',
  },
};

export default function HeadersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
