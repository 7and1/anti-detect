'use client';

import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface Tool {
  name: string;
  description: string;
  href: string;
  icon: string;
  category: 'fingerprint' | 'network' | 'analysis';
  status: 'live' | 'beta' | 'coming-soon';
}

const TOOLS: Tool[] = [
  {
    name: 'Canvas Fingerprint',
    description: 'Test your canvas fingerprint and check if noise protection is active',
    href: '/tools/canvas',
    icon: '🎨',
    category: 'fingerprint',
    status: 'live',
  },
  {
    name: 'WebGL Fingerprint',
    description: 'Analyze your GPU fingerprint, vendor, and renderer information',
    href: '/tools/webgl',
    icon: '🔲',
    category: 'fingerprint',
    status: 'live',
  },
  {
    name: 'Font Detection',
    description: 'Detect installed fonts and see how unique your font fingerprint is',
    href: '/tools/fonts',
    icon: '🔤',
    category: 'fingerprint',
    status: 'live',
  },
  {
    name: 'Audio Fingerprint',
    description: 'Test AudioContext fingerprinting used by tracking scripts',
    href: '/tools/audio',
    icon: '🔊',
    category: 'fingerprint',
    status: 'live',
  },
  {
    name: 'WebRTC Leak Test',
    description: 'Check if your real IP is exposed through WebRTC connections',
    href: '/tools/webrtc',
    icon: '📡',
    category: 'network',
    status: 'live',
  },
  {
    name: 'TLS/JA3 Fingerprint',
    description: 'Analyze your TLS fingerprint used by bot detection systems',
    href: '/tools/tls',
    icon: '🔐',
    category: 'network',
    status: 'live',
  },
  {
    name: 'IP & Geolocation',
    description: 'See your IP address, location, and check for VPN/proxy detection',
    href: '/tools/ip',
    icon: '🌍',
    category: 'network',
    status: 'live',
  },
  {
    name: 'HTTP Headers',
    description: 'Inspect your HTTP headers and check for privacy leaks',
    href: '/tools/headers',
    icon: '📋',
    category: 'network',
    status: 'live',
  },
  {
    name: 'Fingerprint Scanner',
    description: 'Complete browser fingerprint analysis with trust score',
    href: '/',
    icon: '🔍',
    category: 'analysis',
    status: 'live',
  },
  {
    name: 'Profile Generator',
    description: 'Generate realistic browser profiles for anti-detect browsers',
    href: '/generator',
    icon: '⚙️',
    category: 'analysis',
    status: 'live',
  },
  {
    name: 'Challenge Arena',
    description: 'Test your setup against real-world detection challenges',
    href: '/challenge',
    icon: '🎯',
    category: 'analysis',
    status: 'live',
  },
  {
    name: 'Bot Detection Test',
    description: 'See if your browser passes common bot detection checks',
    href: '/tools/bot',
    icon: '🤖',
    category: 'analysis',
    status: 'live',
  },
];

export default function ToolsPage() {
  const fingerprintTools = TOOLS.filter((t) => t.category === 'fingerprint');
  const networkTools = TOOLS.filter((t) => t.category === 'network');
  const analysisTools = TOOLS.filter((t) => t.category === 'analysis');

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Browser <span className="gradient-text">Testing Tools</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Comprehensive suite of tools to analyze your browser fingerprint, detect privacy leaks,
              and test your anti-detection setup.
            </p>
          </div>

          {/* Fingerprint Tools */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="text-accent">▸</span>
              Fingerprint Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fingerprintTools.map((tool) => (
                <ToolCard key={tool.href} tool={tool} />
              ))}
            </div>
          </section>

          {/* Network Tools */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="text-accent">▸</span>
              Network & Security
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {networkTools.map((tool) => (
                <ToolCard key={tool.href} tool={tool} />
              ))}
            </div>
          </section>

          {/* Analysis Tools */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="text-accent">▸</span>
              Analysis & Generation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysisTools.map((tool) => (
                <ToolCard key={tool.href} tool={tool} />
              ))}
            </div>
          </section>

          {/* Educational Content */}
          <section className="mt-16 space-y-8 text-text-secondary">
            <h2 className="text-3xl font-bold text-text-primary">
              Why Browser Fingerprinting Testing Matters
            </h2>

            <div className="space-y-6">
              <p className="leading-relaxed text-lg">
                Every time you visit a website, your browser broadcasts a detailed profile of your device—like showing up to a masquerade party while holding your driver's license. Browser fingerprinting combines dozens of data points from your hardware, software, and settings to create a unique identifier that follows you across the internet. Our comprehensive testing suite reveals exactly what information you're leaking.
              </p>

              <p className="leading-relaxed">
                Unlike cookies that you can clear or IP addresses that change when you restart your router, browser fingerprints are determined by your actual hardware and software configuration. Your GPU model affects your <Link href="/tools/webgl" className="text-accent hover:underline">WebGL fingerprint</Link>. Your audio drivers influence your <Link href="/tools/audio" className="text-accent hover:underline">audio fingerprint</Link>. The fonts installed by Adobe Creative Suite or Microsoft Office make your <Link href="/tools/fonts" className="text-accent hover:underline">font fingerprint</Link> highly distinctive. Even the mathematical quirks in how your GPU renders a simple gradient create a <Link href="/tools/canvas" className="text-accent hover:underline">canvas fingerprint</Link> that's consistent across browser restarts and incognito mode.
              </p>

              <p className="leading-relaxed">
                The stakes are higher than most people realize. According to research from Princeton University and the Electronic Frontier Foundation, <strong>83.6% of browser fingerprints are unique</strong>—meaning tracking companies can identify you among millions of users without cookies or login data. This number jumps to <strong>94.2% when combined with plugin detection</strong>. Major advertising networks, social media platforms, and even e-commerce sites use fingerprinting to track your browsing history, build consumer profiles, and serve targeted ads—all while you think you're browsing anonymously.
              </p>

              <h3 className="text-2xl font-semibold text-text-primary mt-8">
                How Our Testing Tools Work
              </h3>

              <p className="leading-relaxed">
                Our fingerprinting tools use the same techniques that tracking companies deploy on millions of websites. When you run our <Link href="/tools/canvas" className="text-accent hover:underline">Canvas Fingerprint Test</Link>, we render text and graphics using your browser's HTML5 canvas API, then analyze the microscopic variations in how your GPU processes the rendering. Different hardware produces different outputs—we hash that output to create your unique canvas signature.
              </p>

              <p className="leading-relaxed">
                The <Link href="/tools/webgl" className="text-accent hover:underline">WebGL test</Link> queries your GPU directly, extracting the vendor string (NVIDIA, AMD, Intel), renderer information, supported extensions, and maximum texture sizes. We also test performance characteristics—the same "DrawnApart" technique used by researchers that achieved 98% GPU identification accuracy in just 150 milliseconds. Your <Link href="/tools/fonts" className="text-accent hover:underline">font detection</Link> measures text rendering dimensions to infer which fonts are installed, revealing your operating system, installed software, and even your profession (designers have Adobe fonts, developers have coding fonts).
              </p>

              <p className="leading-relaxed">
                Network tests expose different vulnerabilities. The <Link href="/tools/webrtc" className="text-accent hover:underline">WebRTC Leak Test</Link> attempts to establish peer-to-peer connections that can bypass your VPN and reveal your real IP address—a technique used by streaming services to detect proxy users. Our <Link href="/tools/tls" className="text-accent hover:underline">TLS Fingerprinting test</Link> analyzes the "handshake" your browser makes when establishing secure connections, extracting JA3/JA4 signatures that identify your exact browser version and potentially detect automation tools. The <Link href="/tools/headers" className="text-accent hover:underline">HTTP Headers analysis</Link> shows exactly what metadata your browser sends with every request, from User-Agent strings to Accept-Language preferences that narrow down your location and identity.
              </p>

              <h3 className="text-2xl font-semibold text-text-primary mt-8">
                Who Needs These Tests and Why
              </h3>

              <p className="leading-relaxed">
                <strong>Privacy-conscious users</strong> need to understand what they're actually leaking. Just because you're using incognito mode or cleared your cookies doesn't mean you're anonymous. Our tests reveal the fingerprinting vectors that persist regardless of privacy settings. If you care about online privacy, you need to know your fingerprint's uniqueness score.
              </p>

              <p className="leading-relaxed">
                <strong>Web scraping professionals and automation engineers</strong> face sophisticated bot detection systems that analyze fingerprints to distinguish humans from scripts. Cloudflare, Akamai, PerimeterX, and DataDome all use fingerprinting as a core detection mechanism. If your <Link href="/tools/bot" className="text-accent hover:underline">bot detection test</Link> shows red flags, your scraping operations will get blocked. Our tools help you identify exactly which fingerprint attributes are exposing your automation setup.
              </p>

              <p className="leading-relaxed">
                <strong>Multi-accounting businesses</strong>—managing multiple social media accounts, e-commerce seller accounts, or advertising accounts—must avoid fingerprint detection. Platforms like Amazon, eBay, Facebook, and Google use fingerprinting to detect when multiple accounts originate from the same device. A single inconsistent fingerprint can trigger account bans that cost thousands in lost revenue. Testing each browser profile before going live is essential.
              </p>

              <p className="leading-relaxed">
                <strong>Security researchers and penetration testers</strong> use our tools to understand tracking technologies and test fingerprinting defenses. Understanding how canvas, WebGL, and audio fingerprinting work is crucial for security audits and privacy research. Our tools provide the same capabilities as commercial fingerprinting services but with full transparency about what's being tested.
              </p>

              <h3 className="text-2xl font-semibold text-text-primary mt-8">
                Beyond Detection: What to Do Next
              </h3>

              <p className="leading-relaxed">
                Testing alone isn't enough—you need to understand your results and take action. If our tests show you have a highly unique fingerprint (most users do), you have several options. For basic privacy, browsers like Tor Browser and Brave offer fingerprinting resistance by normalizing values so all users appear identical. Firefox's <code className="text-terminal bg-bg-primary px-1 py-0.5 rounded">privacy.resistFingerprinting</code> setting provides similar protection. These approaches work through "safety in numbers"—you're anonymous within a crowd of users with identical fingerprints.
              </p>

              <p className="leading-relaxed">
                For automation and multi-accounting, you need anti-detect browsers that don't just block fingerprinting but <em>spoof</em> it convincingly. Professional solutions like Multilogin, GoLogin, and AdsPower maintain databases of real device fingerprints and ensure every attribute is internally consistent. Your canvas fingerprint must match your WebGL vendor, which must align with your User-Agent, which must correspond to your font list—one inconsistency and sophisticated detection systems will flag you.
              </p>

              <p className="leading-relaxed">
                The future of online privacy is a constant arms race between tracking companies developing new fingerprinting techniques and privacy tools creating new defenses. New methods like <Link href="/tools/audio" className="text-accent hover:underline">audio fingerprinting</Link> (99.6% unique) and GPU performance profiling continue to emerge. Regular testing with our comprehensive suite ensures you understand your current fingerprint exposure and can adapt your privacy strategy as tracking evolves.
              </p>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 p-8 rounded-lg bg-gradient-to-r from-accent/20 to-success/20 border border-accent/30">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Need Professional Anti-Detection?
              </h2>
              <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                Our tools can detect vulnerabilities, but you need a professional solution to fix them.
                Mutilogin provides enterprise-grade browser fingerprint protection.
              </p>
              <a
                href="https://mutilogin.com/?ref=antidetect"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-success text-bg-primary font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Mutilogin Free
                <span>→</span>
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const isComingSoon = tool.status === 'coming-soon';

  const content = (
    <div
      className={`relative p-6 rounded-lg border transition-all duration-200 h-full ${
        isComingSoon
          ? 'bg-bg-secondary/50 border-border/50 cursor-not-allowed opacity-60'
          : 'bg-bg-secondary border-border hover:border-accent hover:bg-bg-secondary/80 cursor-pointer'
      }`}
    >
      {/* Status Badge */}
      {tool.status !== 'live' && (
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs px-2 py-1 rounded ${
              tool.status === 'beta'
                ? 'bg-warning/20 text-warning'
                : 'bg-border text-text-muted'
            }`}
          >
            {tool.status === 'beta' ? 'Beta' : 'Coming Soon'}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="text-4xl mb-4">{tool.icon}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{tool.name}</h3>

      {/* Description */}
      <p className="text-sm text-text-muted">{tool.description}</p>

      {/* Arrow for live tools */}
      {!isComingSoon && (
        <div className="absolute bottom-4 right-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </div>
      )}
    </div>
  );

  if (isComingSoon) {
    return <div className="group">{content}</div>;
  }

  return (
    <Link href={tool.href} className="group">
      {content}
    </Link>
  );
}
