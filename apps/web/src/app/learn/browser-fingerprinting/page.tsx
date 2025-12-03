import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'What is Browser Fingerprinting? Complete Guide 2024 | Anti-Detect.com',
  description:
    'Learn what browser fingerprinting is, how websites track you without cookies, and how to protect your privacy. Comprehensive guide with real examples and data.',
  keywords: [
    'browser fingerprinting',
    'digital fingerprint',
    'online tracking',
    'privacy',
    'anti-detect',
    'canvas fingerprint',
    'webgl fingerprint',
  ],
  openGraph: {
    title: 'What is Browser Fingerprinting? Complete Guide 2024',
    description:
      'Learn what browser fingerprinting is, how websites track you without cookies, and how to protect your privacy.',
    type: 'article',
  },
};

export default function BrowserFingerprintingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-text-muted mb-8">
            <Link href="/learn" className="hover:text-accent">
              Learn
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">Browser Fingerprinting</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Fundamentals
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-2 mb-6">
              What is Browser Fingerprinting? The Complete Guide
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span>12 min read</span>
              <span>•</span>
              <span>Last updated: December 2024</span>
            </div>
          </header>

          {/* Table of Contents */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-12">
            <h2 className="text-sm font-semibold text-text-primary mb-4">In This Guide</h2>
            <nav className="space-y-2 text-sm">
              <a href="#what-is-fingerprinting" className="block text-text-muted hover:text-accent">
                1. What is Browser Fingerprinting?
              </a>
              <a href="#how-it-works" className="block text-text-muted hover:text-accent">
                2. How Browser Fingerprinting Works
              </a>
              <a href="#techniques" className="block text-text-muted hover:text-accent">
                3. Fingerprinting Techniques Explained
              </a>
              <a href="#statistics" className="block text-text-muted hover:text-accent">
                4. Browser Fingerprinting Statistics
              </a>
              <a href="#who-uses-it" className="block text-text-muted hover:text-accent">
                5. Who Uses Browser Fingerprinting?
              </a>
              <a href="#protection" className="block text-text-muted hover:text-accent">
                6. How to Protect Against Fingerprinting
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              Alright, let me break this down for you. You know how every person has a unique
              fingerprint? Well, your browser has one too. And here's the wild part - you can
              delete all your cookies, use incognito mode, even switch VPNs - but websites can
              STILL identify you. That's browser fingerprinting, and it's way more powerful
              than most people realize.
            </p>

            {/* Section 1 */}
            <section id="what-is-fingerprinting" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                What is Browser Fingerprinting?
              </h2>
              <p className="text-text-secondary mb-4">
                Browser fingerprinting is a tracking technique that collects information about
                your browser, device, and settings to create a unique identifier. Think of it
                like a digital DNA test - it combines dozens of seemingly innocent data points
                to create a profile that's often unique to YOU.
              </p>
              <p className="text-text-secondary mb-4">
                Here's the thing most people don't get: each data point alone isn't
                identifying. Lots of people have 1920x1080 screens. Lots of people use Chrome.
                Lots of people are in the Pacific timezone. But when you combine ALL of these
                together? That's when things get interesting.
              </p>
              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg mb-4">
                <p className="text-text-secondary">
                  <strong className="text-accent">Key Insight:</strong> Research from the
                  Electronic Frontier Foundation shows that 83.6% of browsers have a unique
                  fingerprint. That number jumps to 94.2% if Flash or Java is enabled.
                </p>
              </div>
              <p className="text-text-secondary">
                Unlike cookies, which you can delete, or IP addresses, which you can hide with
                a VPN - your browser fingerprint is based on how your browser BEHAVES. And
                that's almost impossible to fake perfectly.
              </p>
            </section>

            {/* Section 2 */}
            <section id="how-it-works" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How Browser Fingerprinting Works
              </h2>
              <p className="text-text-secondary mb-4">
                Let me walk you through what happens when you visit a website with
                fingerprinting. It's actually kind of genius - in a creepy way.
              </p>
              <ol className="space-y-4 mb-6">
                <li className="flex gap-3">
                  <span className="text-accent font-bold">1.</span>
                  <div className="text-text-secondary">
                    <strong className="text-text-primary">JavaScript Execution:</strong> A
                    script runs in your browser, collecting data through browser APIs.
                    These APIs were designed for legitimate purposes but reveal identifying
                    information.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-bold">2.</span>
                  <div className="text-text-secondary">
                    <strong className="text-text-primary">Data Collection:</strong> The
                    script gathers 50+ data points: screen size, installed fonts, GPU info,
                    timezone, language, plugin list, and more.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-bold">3.</span>
                  <div className="text-text-secondary">
                    <strong className="text-text-primary">Hash Generation:</strong> All
                    collected data is combined and hashed into a unique identifier - your
                    fingerprint.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-bold">4.</span>
                  <div className="text-text-secondary">
                    <strong className="text-text-primary">Cross-Site Tracking:</strong> This
                    fingerprint is stored server-side and used to identify you across
                    different websites, sessions, and even devices.
                  </div>
                </li>
              </ol>
              <p className="text-text-secondary">
                The scary part? This all happens invisibly in milliseconds. No popup asking
                for permission. No cookie banner. Nothing.
              </p>
            </section>

            {/* Section 3 */}
            <section id="techniques" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Fingerprinting Techniques Explained
              </h2>
              <p className="text-text-secondary mb-6">
                There are several major fingerprinting techniques. Each one exploits a
                different browser feature:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Canvas Fingerprinting</h3>
              <p className="text-text-secondary mb-4">
                This is the most common technique. A website draws an invisible image using
                your browser's Canvas API. Due to differences in GPUs, font rendering, and
                anti-aliasing, the resulting image is slightly different on every computer.
              </p>
              <p className="text-text-secondary mb-6">
                The website converts this image to a hash - boom, unique identifier. Canvas
                fingerprinting is used by approximately 14,371 of the top 100,000 websites
                according to Princeton's WebTAP project.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">WebGL Fingerprinting</h3>
              <p className="text-text-secondary mb-4">
                WebGL gives websites access to your GPU for 3D rendering. But it also exposes
                your GPU vendor and model, which is highly identifying. Combined with shader
                precision tests, WebGL creates another unique fingerprint.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Audio Fingerprinting</h3>
              <p className="text-text-secondary mb-4">
                Using the AudioContext API, websites can generate sound waves and analyze how
                your browser processes them. Tiny differences in audio hardware and drivers
                create unique signatures. This technique was discovered in 2016 and is now
                widespread.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Font Fingerprinting</h3>
              <p className="text-text-secondary mb-4">
                Your installed fonts are surprisingly identifying. Windows, macOS, and Linux
                all have different default fonts. Professional software like Adobe Creative
                Suite installs unique fonts. The combination of fonts on your system is often
                unique.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">TLS/JA3 Fingerprinting</h3>
              <p className="text-text-secondary mb-4">
                This one's next level. When your browser connects to a website, it sends a
                "Client Hello" message with its cryptographic capabilities. The specific
                combination of cipher suites, TLS extensions, and protocols creates a
                fingerprint called JA3. This happens at the network level - no JavaScript
                needed.
              </p>
            </section>

            {/* Section 4 - Statistics */}
            <section id="statistics" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Browser Fingerprinting Statistics
              </h2>
              <p className="text-text-secondary mb-6">
                Let's look at some real numbers. This isn't theoretical - this is what's
                actually happening on the web:
              </p>

              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-text-primary">Metric</th>
                      <th className="text-left py-3 px-4 text-text-primary">Value</th>
                      <th className="text-left py-3 px-4 text-text-primary">Source</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Unique fingerprints</td>
                      <td className="py-3 px-4 font-mono text-accent">83.6%</td>
                      <td className="py-3 px-4 text-sm">EFF Panopticlick</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Top 10k sites using fingerprinting</td>
                      <td className="py-3 px-4 font-mono text-accent">25%+</td>
                      <td className="py-3 px-4 text-sm">Princeton WebTAP</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Canvas fingerprint entropy</td>
                      <td className="py-3 px-4 font-mono text-accent">~10 bits</td>
                      <td className="py-3 px-4 text-sm">Acar et al. 2014</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Font list entropy</td>
                      <td className="py-3 px-4 font-mono text-accent">~13 bits</td>
                      <td className="py-3 px-4 text-sm">Laperdrix 2016</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Accuracy over 30 days</td>
                      <td className="py-3 px-4 font-mono text-accent">91%</td>
                      <td className="py-3 px-4 text-sm">Vastel et al. 2018</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Fingerprint tracking scripts</td>
                      <td className="py-3 px-4 font-mono text-accent">7,000+</td>
                      <td className="py-3 px-4 text-sm">WhoTracksMe 2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-warning">Important:</strong> These numbers are
                  growing. As cookies become less reliable due to browser restrictions,
                  fingerprinting adoption is increasing by approximately 30% year-over-year.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="who-uses-it" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Who Uses Browser Fingerprinting?
              </h2>
              <p className="text-text-secondary mb-4">
                Browser fingerprinting isn't just used by shady tracking companies. It's
                everywhere:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <div>
                    <strong className="text-text-primary">Banks & Financial Services:</strong>{' '}
                    To detect fraud and account takeovers. If your fingerprint changes
                    dramatically, they'll flag the session.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <div>
                    <strong className="text-text-primary">E-commerce Platforms:</strong>{' '}
                    Amazon, eBay, and others use fingerprinting to prevent multi-account
                    abuse, detect bots, and enforce purchase limits.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <div>
                    <strong className="text-text-primary">Ad Networks:</strong>{' '}
                    Google, Facebook, and thousands of ad tech companies use fingerprinting
                    to track you across websites and build profiles for targeted ads.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <div>
                    <strong className="text-text-primary">Bot Detection Services:</strong>{' '}
                    Cloudflare, PerimeterX, DataDome, and Akamai all use fingerprinting
                    as part of their bot detection stack.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <div>
                    <strong className="text-text-primary">Streaming Services:</strong>{' '}
                    Netflix, Spotify, and others use fingerprinting to enforce device
                    limits and detect account sharing.
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="protection" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How to Protect Against Fingerprinting
              </h2>
              <p className="text-text-secondary mb-6">
                Here's the honest truth: perfect protection is nearly impossible. But you can
                make tracking significantly harder:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">1. Use Tor Browser</h3>
              <p className="text-text-secondary mb-4">
                Tor Browser is designed to make all users look identical. It blocks
                fingerprinting scripts, standardizes screen sizes, and limits font access.
                Downside? It's slow, and many websites block it entirely.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">
                2. Firefox with Privacy Settings
              </h3>
              <p className="text-text-secondary mb-4">
                Firefox's "Enhanced Tracking Protection" and "resist fingerprinting" settings
                provide good baseline protection. Enable these in about:config for better
                privacy - but some websites may break.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">
                3. Browser Extensions
              </h3>
              <p className="text-text-secondary mb-4">
                Extensions like Canvas Blocker, Privacy Badger, and uBlock Origin can help.
                But ironically, the specific combination of extensions you use can itself be
                a fingerprint. It's a cat-and-mouse game.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">
                4. Anti-Detect Browsers
              </h3>
              <p className="text-text-secondary mb-4">
                For serious privacy (or business needs like managing multiple accounts),
                anti-detect browsers are the real solution. They don't just BLOCK
                fingerprinting - they CREATE consistent, realistic fingerprints that blend
                in with normal users.
              </p>
              <p className="text-text-secondary mb-4">
                Tools like Multilogin, GoLogin, and Dolphin Anty let you create browser
                profiles with specific fingerprints. Each profile has consistent canvas,
                WebGL, fonts, and other attributes that match real browsers.
              </p>
            </section>

            {/* CTA */}
            <div className="p-8 rounded-lg bg-gradient-to-br from-accent/20 to-success/10 border border-accent/30 not-prose">
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Test Your Browser's Fingerprint
              </h3>
              <p className="text-text-secondary mb-6">
                Want to see how unique YOUR browser is? Our free fingerprint scanner analyzes
                50+ data points and shows exactly what websites can see about you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/"
                  className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg text-center"
                >
                  Scan My Browser Free
                </Link>
                <Link
                  href="/tools"
                  className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary rounded-lg text-center transition-colors"
                >
                  Explore All Tools
                </Link>
              </div>
            </div>
          </div>

          {/* Author / Sources */}
          <footer className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sources & References</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>
                • Electronic Frontier Foundation - Panopticlick Study
              </li>
              <li>
                • Princeton WebTAP - Web Transparency & Accountability Project
              </li>
              <li>
                • Laperdrix, P. et al. - "Beauty and the Beast: Diverting Modern Web Browsers to Build Unique Browser Fingerprints"
              </li>
              <li>
                • Acar, G. et al. - "The Web Never Forgets: Persistent Tracking Mechanisms in the Wild"
              </li>
              <li>
                • Vastel, A. et al. - "FP-Scanner: The Privacy Implications of Browser Fingerprint Inconsistencies"
              </li>
            </ul>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
