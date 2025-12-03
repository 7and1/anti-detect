import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'How Bot Detection Works: Complete Technical Guide 2024 | Anti-Detect.com',
  description:
    'Deep dive into bot detection systems - Cloudflare, Akamai, PerimeterX, DataDome. Learn how they work and how to pass their checks.',
  keywords: [
    'bot detection',
    'cloudflare bot fight',
    'akamai bot manager',
    'perimeter x',
    'datadome',
    'anti-bot',
    'captcha bypass',
    'web scraping',
  ],
  openGraph: {
    title: 'How Bot Detection Works: Complete Technical Guide 2024',
    description:
      'Deep dive into bot detection systems and how they identify automated traffic.',
    type: 'article',
  },
};

export default function BotDetectionArticlePage() {
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
            <span className="text-text-secondary">Bot Detection</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <span className="text-xs font-semibold text-warning uppercase tracking-wider">
              Technical Guide
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-2 mb-6">
              How Bot Detection Works: A Technical Deep Dive
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span>20 min read</span>
              <span>•</span>
              <span>Last updated: December 2024</span>
            </div>
          </header>

          {/* Table of Contents */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-12">
            <h2 className="text-sm font-semibold text-text-primary mb-4">In This Guide</h2>
            <nav className="space-y-2 text-sm">
              <a href="#overview" className="block text-text-muted hover:text-accent">
                1. Bot Detection Overview
              </a>
              <a href="#techniques" className="block text-text-muted hover:text-accent">
                2. Detection Techniques Used
              </a>
              <a href="#cloudflare" className="block text-text-muted hover:text-accent">
                3. Cloudflare Bot Fight Mode
              </a>
              <a href="#others" className="block text-text-muted hover:text-accent">
                4. Other Major Providers
              </a>
              <a href="#passing" className="block text-text-muted hover:text-accent">
                5. How to Pass Bot Detection
              </a>
              <a href="#future" className="block text-text-muted hover:text-accent">
                6. Future of Bot Detection
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              Every major website is fighting a war against bots. Some estimates say 40% of ALL
              internet traffic is bot traffic. Most of it is malicious - scraping, credential
              stuffing, price manipulation, ticket scalping. So websites fight back with
              increasingly sophisticated detection systems. Let me show you exactly how they work.
            </p>

            {/* Section 1 */}
            <section id="overview" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Bot Detection Overview
              </h2>
              <p className="text-text-secondary mb-4">
                Modern bot detection isn't just checking if you're running Selenium. It's a
                multi-layered system that analyzes everything from your network packets to how
                you move your mouse. The goal is simple: tell humans from machines.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">The Detection Stack</h3>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Layer 1: Network Level</h4>
                  <p className="text-text-secondary text-sm">
                    IP reputation, ASN analysis, TLS fingerprinting, connection patterns
                  </p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Layer 2: Browser Level</h4>
                  <p className="text-text-secondary text-sm">
                    JavaScript challenges, WebDriver detection, browser fingerprinting
                  </p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Layer 3: Behavioral Level</h4>
                  <p className="text-text-secondary text-sm">
                    Mouse movements, click patterns, scroll behavior, typing rhythms
                  </p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Layer 4: Machine Learning</h4>
                  <p className="text-text-secondary text-sm">
                    Pattern recognition across all signals, anomaly detection, reputation scoring
                  </p>
                </div>
              </div>

              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg mb-4">
                <p className="text-text-secondary">
                  <strong className="text-accent">Key Insight:</strong> Modern bot detection
                  doesn't rely on any single signal. It combines hundreds of data points and
                  assigns a probability score. Even if you pass most checks, failing on
                  unusual signals can trigger detection.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="techniques" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Detection Techniques Used
              </h2>

              <h3 className="text-xl font-bold text-text-primary mb-3">JavaScript Challenges</h3>
              <p className="text-text-secondary mb-4">
                The first line of defense. A script runs in your browser to check for automation
                signals:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// Common checks performed:
navigator.webdriver          // Selenium/Puppeteer flag
window.__selenium_evaluate   // Selenium artifacts
window.__nightmare           // Nightmare.js
window._phantom              // PhantomJS
window.callPhantom          // PhantomJS
document.$cdc_asdjflasutopfhvcZLmcfl_ // Chrome DevTools Protocol
window.chrome               // Expected in Chrome browser
Notification.permission     // Permission API behavior
navigator.plugins           // Plugin count`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Browser Fingerprinting</h3>
              <p className="text-text-secondary mb-4">
                Detailed collection of browser characteristics to identify inconsistencies:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Canvas fingerprint - does it match the claimed browser?</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>WebGL fingerprint - GPU vendor/renderer consistency</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Audio fingerprint - AudioContext processing patterns</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Font list - matches expected OS fonts?</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Screen dimensions - realistic for claimed device?</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Behavioral Analysis</h3>
              <p className="text-text-secondary mb-4">
                This is where sophisticated bots struggle most. Real humans have distinct patterns:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Mouse movements:</strong> Humans have curved, imperfect paths. Bots go in straight lines or have mathematically perfect curves.</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Timing:</strong> Humans have variable delays. Bots often have consistent timing.</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Scroll patterns:</strong> Humans scroll smoothly with momentum. Bots often jump.</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Focus events:</strong> Humans switch tabs, lose focus. Bots maintain perfect focus.</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Proof of Work Challenges</h3>
              <p className="text-text-secondary mb-4">
                Some systems require your browser to solve computational puzzles:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Cloudflare's Turnstile:</strong> Invisible challenges based on behavior</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>hCaptcha:</strong> ML-based image challenges</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>reCAPTCHA v3:</strong> Silent scoring based on behavior</span>
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="cloudflare" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Cloudflare Bot Fight Mode
              </h2>
              <p className="text-text-secondary mb-4">
                Cloudflare protects over 20% of websites. Their bot detection is among the most
                widely deployed. Here's how it works:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Detection Signals</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span><strong>JA3/JA4 TLS Fingerprint:</strong> Checks if TLS handshake matches claimed browser</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span><strong>IP Intelligence:</strong> Datacenter IPs, known VPN exits, tor nodes flagged</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span><strong>Request Patterns:</strong> Rate limiting, request sequences, header order</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">4.</span>
                  <span><strong>JavaScript Execution:</strong> Turnstile challenges, browser API checks</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Challenge Types</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-text-primary">Challenge</th>
                      <th className="text-left py-3 px-4 text-text-primary">Triggered By</th>
                      <th className="text-left py-3 px-4 text-text-primary">Bypass Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">JS Challenge</td>
                      <td className="py-3 px-4">Suspicious signals</td>
                      <td className="py-3 px-4"><span className="text-success">Easy</span></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Managed Challenge</td>
                      <td className="py-3 px-4">Medium risk score</td>
                      <td className="py-3 px-4"><span className="text-warning">Medium</span></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Interactive Challenge</td>
                      <td className="py-3 px-4">High risk score</td>
                      <td className="py-3 px-4"><span className="text-error">Hard</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Block</td>
                      <td className="py-3 px-4">Known bad actor</td>
                      <td className="py-3 px-4"><span className="text-error">Blocked</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-warning">Pro Tip:</strong> Cloudflare gives you a
                  "cf_clearance" cookie after passing challenges. This cookie is tied to your
                  browser fingerprint. Changing fingerprint = new challenge.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="others" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Other Major Providers
              </h2>

              <div className="space-y-6">
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h3 className="text-lg font-bold text-error mb-2">Akamai Bot Manager</h3>
                  <p className="text-text-secondary mb-2">
                    Used by major enterprises (banks, airlines, retailers). Known for aggressive
                    detection and very low false positive tolerance.
                  </p>
                  <p className="text-text-secondary text-sm mb-2">
                    <strong>Key Features:</strong> Device fingerprinting, behavioral biometrics,
                    credential abuse detection, API security.
                  </p>
                  <p className="text-text-muted text-sm">Difficulty: Very Hard</p>
                </div>

                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h3 className="text-lg font-bold text-warning mb-2">PerimeterX (HUMAN)</h3>
                  <p className="text-text-secondary mb-2">
                    Formerly PerimeterX, now HUMAN. Focuses heavily on behavioral analysis.
                    Popular with e-commerce and ticketing sites.
                  </p>
                  <p className="text-text-secondary text-sm mb-2">
                    <strong>Key Features:</strong> Sensor data collection, mouse dynamics,
                    keyboard patterns, mobile device signals.
                  </p>
                  <p className="text-text-muted text-sm">Difficulty: Hard</p>
                </div>

                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h3 className="text-lg font-bold text-accent mb-2">DataDome</h3>
                  <p className="text-text-secondary mb-2">
                    Real-time bot detection with fast response times. Good at catching
                    sophisticated scrapers and headless browsers.
                  </p>
                  <p className="text-text-secondary text-sm mb-2">
                    <strong>Key Features:</strong> ML-based detection, device fingerprinting,
                    CAPTCHA challenges, API protection.
                  </p>
                  <p className="text-text-muted text-sm">Difficulty: Medium-Hard</p>
                </div>

                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h3 className="text-lg font-bold text-success mb-2">Kasada</h3>
                  <p className="text-text-secondary mb-2">
                    Focuses on making reverse engineering expensive. Uses proof-of-work
                    challenges and obfuscated JavaScript.
                  </p>
                  <p className="text-text-secondary text-sm mb-2">
                    <strong>Key Features:</strong> Client-side challenges, code obfuscation,
                    bot economics targeting.
                  </p>
                  <p className="text-text-muted text-sm">Difficulty: Hard</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="passing" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How to Pass Bot Detection
              </h2>
              <p className="text-text-secondary mb-6">
                Let me be clear: there's no magic bullet. But here's what actually works:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">1. Use Real Browsers</h3>
              <p className="text-text-secondary mb-4">
                Anti-detect browsers use actual Chromium/Firefox engines. They produce real
                fingerprints because they ARE real browsers. This is the most reliable approach.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">2. Residential Proxies</h3>
              <p className="text-text-secondary mb-4">
                Datacenter IPs are almost always flagged. Residential proxies come from real ISPs
                and have much better reputation. Mobile proxies are even better.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">3. Human-Like Behavior</h3>
              <p className="text-text-secondary mb-4">
                If you're automating, add randomized delays, natural mouse movements, and
                realistic scrolling patterns. Libraries like Puppeteer-extra-plugin-stealth help.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">4. TLS Fingerprint Matching</h3>
              <p className="text-text-secondary mb-4">
                Your TLS fingerprint must match your claimed browser. Use libraries like utls (Go)
                or curl-impersonate that replicate browser TLS signatures.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">5. Consistent Fingerprints</h3>
              <p className="text-text-secondary mb-4">
                All your signals must tell the same story. A Chrome user-agent with Firefox
                canvas fingerprint and Safari TLS fingerprint = instant detection.
              </p>

              <div className="p-4 bg-error/10 border-l-4 border-error rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-error">Warning:</strong> Bot detection systems share
                  intelligence. Getting blocked on one site can affect your reputation across
                  others. Start slowly, maintain good behavior patterns.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="future" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Future of Bot Detection
              </h2>
              <p className="text-text-secondary mb-4">
                The arms race continues. Here's where things are heading:
              </p>

              <ul className="space-y-3 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>AI-Generated Behavior:</strong> Bots will use AI to generate more human-like behavior patterns</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Hardware Attestation:</strong> Checking if requests come from real devices (like Apple's DeviceCheck)</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Zero-Knowledge Proofs:</strong> Proving humanness without revealing identity</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Continuous Authentication:</strong> Ongoing behavioral verification throughout sessions</span>
                </li>
              </ul>

              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-accent">The Reality:</strong> Detection will keep
                  getting better. The winning strategy isn't to "beat" detection - it's to use
                  legitimate tools that produce genuine browser behavior. Anti-detect browsers
                  will continue to evolve alongside detection systems.
                </p>
              </div>
            </section>

            {/* CTA */}
            <div className="p-8 rounded-lg bg-gradient-to-br from-warning/20 to-accent/10 border border-warning/30 not-prose">
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Test Your Bot Detection Score
              </h3>
              <p className="text-text-secondary mb-6">
                Our bot detection test runs the same checks used by major anti-bot systems.
                See if your browser would pass or fail - before you get blocked.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tools/bot"
                  className="px-6 py-3 bg-warning text-bg-primary font-semibold rounded-lg text-center"
                >
                  Test My Bot Score
                </Link>
                <Link
                  href="/learn/anti-detect-browsers"
                  className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary rounded-lg text-center transition-colors"
                >
                  Anti-Detect Browser Guide
                </Link>
              </div>
            </div>
          </div>

          {/* Sources */}
          <footer className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sources & References</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>• Cloudflare - Bot Fight Mode Documentation</li>
              <li>• Akamai - Bot Manager Technical Overview</li>
              <li>• HUMAN (PerimeterX) - Detection Research Papers</li>
              <li>• Imperva - Bad Bot Report 2024</li>
              <li>• DataDome - Bot Detection Methodology</li>
            </ul>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
