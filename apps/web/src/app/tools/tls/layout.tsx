import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TLS Fingerprint Test - JA3/JA4 SSL Fingerprinting | Anti-detect.com',
  description:
    'Test your TLS fingerprint and check JA3/JA4 signatures. Discover how websites track you through SSL/TLS handshakes and protect your connection privacy.',
  keywords: [
    'tls fingerprint',
    'ja3 fingerprint',
    'ja4 fingerprint',
    'ssl fingerprint test',
    'tls fingerprinting',
    'client hello fingerprint',
    'ssl handshake tracking',
    'tls privacy test',
    'browser tls test',
    'ja3 hash',
  ],
  openGraph: {
    title: 'TLS Fingerprint Test - JA3/JA4 SSL Fingerprinting',
    description:
      'Test your TLS fingerprint and check JA3/JA4 signatures. Free tool to discover how websites track you through SSL/TLS.',
    type: 'website',
    url: 'https://anti-detect.com/tools/tls',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TLS Fingerprint Test - JA3/JA4 SSL Fingerprinting',
    description:
      'Test your TLS fingerprint and check JA3/JA4 signatures. Free tool to discover how websites track you through SSL/TLS.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/tls',
  },
};

export default function TLSLayout({ children }: { children: React.ReactNode }) {
  return children;
}
