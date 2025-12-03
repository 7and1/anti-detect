import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browser Fingerprinting Testing Tools | Comprehensive Privacy Suite | Anti-detect.com',
  description:
    'Complete suite of free browser fingerprinting tools. Test canvas, WebGL, fonts, audio, WebRTC leaks, TLS fingerprints, IP detection, and HTTP headers. Detect privacy vulnerabilities and bot detection.',
  keywords: [
    'browser fingerprinting tools',
    'privacy testing suite',
    'fingerprint detection',
    'canvas fingerprint test',
    'webgl test',
    'font detection',
    'audio fingerprint',
    'webrtc leak test',
    'tls fingerprint',
    'ip leak test',
    'http headers check',
    'bot detection test',
    'anti-detect browser testing',
    'browser privacy tools',
    'fingerprint scanner',
  ],
  openGraph: {
    title: 'Browser Fingerprinting Testing Tools | Comprehensive Privacy Suite',
    description:
      'Free tools to test your browser fingerprint: canvas, WebGL, fonts, audio, WebRTC leaks, TLS fingerprints, IP detection, and more. Complete privacy analysis.',
    type: 'website',
    url: 'https://anti-detect.com/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browser Fingerprinting Testing Tools | Comprehensive Privacy Suite',
    description:
      'Free tools to test your browser fingerprint: canvas, WebGL, fonts, audio, WebRTC leaks, TLS fingerprints, IP detection, and more.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
