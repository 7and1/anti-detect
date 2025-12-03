import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Font Fingerprint Test - Detect Font-Based Tracking | Anti-detect.com',
  description:
    'Test your browser for font fingerprinting. Discover which fonts are installed on your system and how websites use them to track you. Free font detection tool.',
  keywords: [
    'font fingerprinting',
    'font detection test',
    'installed fonts check',
    'font enumeration',
    'font privacy test',
    'browser font test',
    'font tracking detection',
    'system fonts check',
    'font fingerprint detector',
    'font-based tracking',
  ],
  openGraph: {
    title: 'Font Fingerprint Test - Detect Font-Based Tracking',
    description:
      'Test your browser for font fingerprinting. Free tool to check which fonts can be detected and how they track you.',
    type: 'website',
    url: 'https://anti-detect.com/tools/fonts',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Font Fingerprint Test - Detect Font-Based Tracking',
    description:
      'Test your browser for font fingerprinting. Free tool to check which fonts can be detected and how they track you.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/fonts',
  },
};

export default function FontsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
