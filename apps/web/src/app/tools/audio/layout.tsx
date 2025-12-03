import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio Fingerprint Test - AudioContext Tracking Detection | Anti-detect.com',
  description:
    'Test your browser for audio fingerprinting. Discover how websites track you through AudioContext API and Web Audio characteristics. Free audio fingerprint detector.',
  keywords: [
    'audio fingerprint',
    'audio context fingerprinting',
    'audio fingerprint test',
    'web audio tracking',
    'audiocontext privacy',
    'browser audio test',
    'audio tracking detection',
    'audio hash',
    'web audio api fingerprint',
    'audio fingerprint detector',
  ],
  openGraph: {
    title: 'Audio Fingerprint Test - AudioContext Tracking Detection',
    description:
      'Test your browser for audio fingerprinting. Free tool to check how websites track you through Web Audio API.',
    type: 'website',
    url: 'https://anti-detect.com/tools/audio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Audio Fingerprint Test - AudioContext Tracking Detection',
    description:
      'Test your browser for audio fingerprinting. Free tool to check how websites track you through Web Audio API.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/audio',
  },
};

export default function AudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
