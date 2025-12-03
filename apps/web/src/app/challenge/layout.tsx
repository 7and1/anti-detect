import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fingerprint Challenge Arena | Test Your Anti-Detection Setup | Anti-detect.com',
  description:
    'Test your browser fingerprint against real-world detection challenges. Face Cloudflare, Akamai, PerimeterX, and DataDome-style tests. Verify your anti-detect browser setup passes advanced bot detection.',
  keywords: [
    'fingerprint challenge',
    'bot detection challenge',
    'anti-detect test',
    'cloudflare challenge',
    'akamai bot detection',
    'perimeterx test',
    'datadome challenge',
    'browser fingerprint challenge',
    'automation detection test',
    'anti-bot challenge',
    'web scraping test',
    'fingerprint verification',
    'bot detection bypass test',
    'real-world detection test',
  ],
  openGraph: {
    title: 'Fingerprint Challenge Arena | Test Your Anti-Detection Setup',
    description:
      'Test your browser fingerprint against real-world detection challenges from Cloudflare, Akamai, PerimeterX, and DataDome. Verify your anti-detect setup.',
    type: 'website',
    url: 'https://anti-detect.com/challenge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fingerprint Challenge Arena | Test Your Anti-Detection',
    description:
      'Test your browser fingerprint against real-world bot detection challenges. Verify your anti-detect browser setup.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/challenge',
  },
};

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
