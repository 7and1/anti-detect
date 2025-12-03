import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bot Detection Test - Am I a Bot? Check Browser Automation | Anti-detect.com',
  description:
    'Test if your browser looks like a bot or automated script. Check for automation detection signals, headless browser indicators, and learn how to avoid bot detection.',
  keywords: [
    'bot detection test',
    'am i a bot',
    'browser automation detection',
    'headless browser detection',
    'selenium detection',
    'puppeteer detection',
    'automation detection test',
    'bot checker',
    'browser bot test',
    'anti bot detection',
  ],
  openGraph: {
    title: 'Bot Detection Test - Am I a Bot? Check Browser Automation',
    description:
      'Test if your browser looks like a bot. Free tool to check for automation detection signals and headless browser indicators.',
    type: 'website',
    url: 'https://anti-detect.com/tools/bot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bot Detection Test - Am I a Bot? Check Browser Automation',
    description:
      'Test if your browser looks like a bot. Free tool to check for automation detection signals and headless browser indicators.',
  },
  alternates: {
    canonical: 'https://anti-detect.com/tools/bot',
  },
};

export default function BotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
