import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WebRTC Leak Test - Check Your Real IP Address | Anti-detect.com',
  description:
    'Test if your browser is leaking your real IP address through WebRTC. Detect VPN leaks, check local IPs, and protect your online privacy with our free WebRTC leak detector.',
  keywords: [
    'webrtc leak test',
    'webrtc ip leak',
    'check webrtc leak',
    'webrtc leak detector',
    'vpn leak test',
    'ip leak test',
    'real ip address',
    'webrtc privacy',
    'browser leak test',
    'stun leak test',
  ],
  openGraph: {
    title: 'WebRTC Leak Test - Check Your Real IP Address',
    description:
      'Test if your browser is leaking your real IP address through WebRTC. Free tool to detect VPN and proxy leaks.',
    type: 'website',
    url: 'https://anti-detect.com/tools/webrtc',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebRTC Leak Test - Check Your Real IP Address',
    description:
      'Test if your browser is leaking your real IP address through WebRTC. Free tool to detect VPN and proxy leaks.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/webrtc',
  },
};

export default function WebRTCLayout({ children }: { children: React.ReactNode }) {
  return children;
}
