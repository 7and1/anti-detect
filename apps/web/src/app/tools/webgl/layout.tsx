import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WebGL Fingerprint Test - GPU & Graphics Tracking | Anti-detect.com',
  description:
    'Test your WebGL fingerprint and check GPU tracking. Discover how websites identify you through graphics card and WebGL rendering characteristics.',
  keywords: [
    'webgl fingerprint',
    'webgl fingerprinting test',
    'gpu fingerprint',
    'graphics card tracking',
    'webgl privacy test',
    'webgl renderer',
    'gpu tracking detection',
    'browser webgl test',
    'webgl hash',
    'graphics fingerprinting',
  ],
  openGraph: {
    title: 'WebGL Fingerprint Test - GPU & Graphics Tracking',
    description:
      'Test your WebGL fingerprint. Free tool to check how websites track you through GPU and graphics rendering.',
    type: 'website',
    url: 'https://anti-detect.com/tools/webgl',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebGL Fingerprint Test - GPU & Graphics Tracking',
    description:
      'Test your WebGL fingerprint. Free tool to check how websites track you through GPU and graphics rendering.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/webgl',
  },
};

export default function WebGLLayout({ children }: { children: React.ReactNode }) {
  return children;
}
