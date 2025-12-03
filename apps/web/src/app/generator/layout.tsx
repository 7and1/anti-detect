import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browser Fingerprint Profile Generator | Create Realistic Browser Profiles | Anti-detect.com',
  description:
    'Generate realistic browser fingerprint profiles for anti-detect browsers. Create consistent profiles with matching canvas, WebGL, fonts, audio, and HTTP headers. Perfect for web scraping and multi-accounting.',
  keywords: [
    'browser profile generator',
    'fingerprint profile generator',
    'anti-detect profile creator',
    'browser fingerprint generator',
    'realistic browser profiles',
    'canvas fingerprint generator',
    'webgl profile generator',
    'user agent generator',
    'browser configuration generator',
    'anti-detect browser profiles',
    'multi-accounting profiles',
    'web scraping profiles',
    'automation browser profiles',
    'fingerprint spoofing profiles',
  ],
  openGraph: {
    title: 'Browser Fingerprint Profile Generator | Create Realistic Browser Profiles',
    description:
      'Generate realistic browser fingerprint profiles with consistent canvas, WebGL, fonts, audio, and headers. Perfect for anti-detect browsers, web scraping, and multi-accounting.',
    type: 'website',
    url: 'https://anti-detect.com/generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browser Fingerprint Profile Generator | Create Realistic Profiles',
    description:
      'Generate realistic browser fingerprint profiles with consistent attributes. Perfect for anti-detect browsers and automation.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/generator',
  },
};

export default function GeneratorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
