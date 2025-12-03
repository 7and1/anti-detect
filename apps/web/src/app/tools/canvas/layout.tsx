import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canvas Fingerprint Test - Detect Canvas Tracking | Anti-detect.com',
  description:
    'Test your browser for canvas fingerprinting. Discover if websites can track you through HTML5 canvas and learn how to protect your privacy with our free canvas fingerprint detector.',
  keywords: [
    'canvas fingerprint test',
    'canvas fingerprinting check',
    'html5 canvas tracking',
    'canvas fingerprint detector',
    'browser fingerprint canvas',
    'canvas privacy test',
    'detect canvas fingerprinting',
    'canvas tracking protection',
    'browser canvas test',
    'anti canvas fingerprinting',
  ],
  openGraph: {
    title: 'Canvas Fingerprint Test - Detect Canvas Tracking',
    description:
      'Test your browser for canvas fingerprinting. Free tool to detect if websites can track you through HTML5 canvas.',
    type: 'website',
    url: 'https://anti-detect.com/tools/canvas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canvas Fingerprint Test - Detect Canvas Tracking',
    description:
      'Test your browser for canvas fingerprinting. Free tool to detect if websites can track you through HTML5 canvas.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/canvas',
  },
};

export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
