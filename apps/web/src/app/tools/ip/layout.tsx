import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IP Leak Test & Geolocation Check - What\'s My IP? | Anti-detect.com',
  description:
    'Check your IP address and geolocation. Test for IP leaks, DNS leaks, and discover what information websites can see. Free IP address checker and privacy test tool.',
  keywords: [
    'ip leak test',
    'check my ip',
    'what is my ip',
    'ip geolocation',
    'ip address checker',
    'dns leak test',
    'my ip address',
    'ip location test',
    'ip privacy check',
    'vpn ip test',
  ],
  openGraph: {
    title: 'IP Leak Test & Geolocation Check - What\'s My IP?',
    description:
      'Check your IP address and geolocation. Free tool to test for IP leaks and see what information websites can detect.',
    type: 'website',
    url: 'https://anti-detect.com/tools/ip',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IP Leak Test & Geolocation Check - What\'s My IP?',
    description:
      'Check your IP address and geolocation. Free tool to test for IP leaks and see what information websites can detect.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/ip',
  },
};

export default function IPLayout({ children }: { children: React.ReactNode }) {
  return children;
}
