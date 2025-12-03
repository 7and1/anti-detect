import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'TLS/JA3 Fingerprinting: How Servers Identify Your Browser Before Loading | Anti-Detect.com',
  description:
    'Deep dive into TLS fingerprinting and JA3 hashes. Learn how servers can identify your browser at the network level, before any JavaScript runs.',
  keywords: [
    'tls fingerprinting',
    'ja3 fingerprint',
    'ssl fingerprint',
    'ja3s',
    'browser fingerprinting',
    'network fingerprint',
    'client hello',
    'cipher suites',
  ],
  openGraph: {
    title: 'TLS/JA3 Fingerprinting: How Servers Identify Your Browser',
    description:
      'Learn how servers can identify your browser at the network level using TLS fingerprinting.',
    type: 'article',
  },
};

export default function TLSFingerprintingPage() {
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
            <span className="text-text-secondary">TLS Fingerprinting</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Advanced Topic
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-2 mb-6">
              TLS/JA3 Fingerprinting: The Network-Level Tracking You Can't See
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span>18 min read</span>
              <span>•</span>
              <span>Last updated: December 2024</span>
            </div>
          </header>

          {/* Table of Contents */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-12">
            <h2 className="text-sm font-semibold text-text-primary mb-4">In This Guide</h2>
            <nav className="space-y-2 text-sm">
              <a href="#what-is-tls" className="block text-text-muted hover:text-accent">
                1. What is TLS Fingerprinting?
              </a>
              <a href="#how-it-works" className="block text-text-muted hover:text-accent">
                2. How TLS Fingerprinting Works
              </a>
              <a href="#ja3-explained" className="block text-text-muted hover:text-accent">
                3. JA3 Fingerprinting Explained
              </a>
              <a href="#detection" className="block text-text-muted hover:text-accent">
                4. Who Uses TLS Fingerprinting
              </a>
              <a href="#data" className="block text-text-muted hover:text-accent">
                5. Statistics & Real-World Data
              </a>
              <a href="#bypass" className="block text-text-muted hover:text-accent">
                6. How to Bypass TLS Fingerprinting
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              Here's something that'll blow your mind: websites can identify your browser BEFORE
              you even load the page. Before any JavaScript runs. Before they read your cookies.
              How? TLS fingerprinting. It happens at the network level during the encrypted
              connection setup, and it's one of the hardest tracking techniques to beat.
            </p>

            {/* Section 1 */}
            <section id="what-is-tls" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                What is TLS Fingerprinting?
              </h2>
              <p className="text-text-secondary mb-4">
                When your browser connects to a website, it doesn't just start talking. First, it
                has to set up an encrypted connection using TLS (Transport Layer Security - the
                "S" in HTTPS). During this setup, your browser sends a "Client Hello" message that
                describes its encryption capabilities.
              </p>
              <p className="text-text-secondary mb-4">
                Here's the thing: different browsers, different versions, different operating
                systems - they all send slightly different Client Hello messages. This pattern
                is unique enough to identify your browser type, and often your specific version.
              </p>
              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg mb-4">
                <p className="text-text-secondary">
                  <strong className="text-accent">Key Insight:</strong> TLS fingerprinting is
                  particularly dangerous because it works even if you block JavaScript, use
                  incognito mode, or change your User-Agent. The fingerprint happens at the
                  network level, outside of JavaScript's reach.
                </p>
              </div>
              <p className="text-text-secondary">
                Think of it like a handshake. Before you can have a private conversation, you
                need to agree on how to encrypt it. The way you propose that agreement reveals
                a lot about who you are.
              </p>
            </section>

            {/* Section 2 */}
            <section id="how-it-works" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How TLS Fingerprinting Works
              </h2>
              <p className="text-text-secondary mb-4">
                Let me break down what happens when your browser connects to any HTTPS website:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 1: TCP Connection</h3>
              <p className="text-text-secondary mb-4">
                Your browser opens a TCP connection to the server. Nothing unusual here.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 2: Client Hello</h3>
              <p className="text-text-secondary mb-4">
                Your browser sends a "Client Hello" message. This includes:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>TLS Version:</strong> What versions you support (1.2, 1.3)</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Cipher Suites:</strong> Which encryption algorithms you support, in order of preference</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Extensions:</strong> Additional capabilities (SNI, ALPN, etc.)</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Elliptic Curves:</strong> Which curves you support for key exchange</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Signature Algorithms:</strong> How you can sign data</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 3: The Fingerprint</h3>
              <p className="text-text-secondary mb-4">
                The server (or any network observer) captures this Client Hello and extracts a
                fingerprint. The most common format is JA3, which hashes the following:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`JA3 = MD5(
  TLSVersion,
  CipherSuites (sorted),
  Extensions (sorted),
  EllipticCurves,
  EllipticCurvePointFormats
)

Example JA3 hash: e7d705a3286e19ea42f587b344ee6865`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">What a Real Client Hello Looks Like</h3>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`Handshake Protocol: Client Hello
    Version: TLS 1.2 (0x0303)
    Random: 1a2b3c4d5e6f...
    Session ID Length: 32
    Cipher Suites Length: 36
    Cipher Suites (18 suites)
        TLS_AES_128_GCM_SHA256
        TLS_AES_256_GCM_SHA384
        TLS_CHACHA20_POLY1305_SHA256
        TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
        ... (14 more)
    Extension: server_name (len=18)
        Server Name: example.com
    Extension: supported_versions (len=9)
        TLS 1.3, TLS 1.2
    Extension: key_share (len=107)
    ... (15 more extensions)`}
              </pre>

              <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-warning">Important:</strong> Each browser has a
                  distinct pattern. Chrome 120 looks different from Chrome 119. Firefox looks
                  completely different from Chrome. Safari has its own unique signature.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="ja3-explained" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                JA3 Fingerprinting Explained
              </h2>
              <p className="text-text-secondary mb-4">
                JA3 was created by Salesforce's security team in 2017. It's now the de facto
                standard for TLS fingerprinting. Here's how it works:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">JA3 String Format</h3>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`JA3 String = SSLVersion,CipherSuites,Extensions,EllipticCurves,EllipticCurvePointFormats

Example:
771,4866-4867-4865-49196-49200-159-52393-52392-52394-49195-49199-158-49188-49192-107-49187-49191-103-49162-49172-57-49161-49171-51-157-156-61-60-53-47-255,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0

This hashes to: e7d705a3286e19ea42f587b344ee6865`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">JA3S: Server Fingerprinting</h3>
              <p className="text-text-secondary mb-4">
                JA3S is the server-side equivalent. It fingerprints the Server Hello response.
                By combining JA3 (client) and JA3S (server), you can identify specific
                client-server pairs and detect anomalies.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Common JA3 Hashes</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-text-primary">Client</th>
                      <th className="text-left py-3 px-4 text-text-primary">JA3 Hash</th>
                      <th className="text-left py-3 px-4 text-text-primary">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Chrome 120 (Win)</td>
                      <td className="py-3 px-4 font-mono text-xs">e7d705a3286e19ea42f587b344ee6865</td>
                      <td className="py-3 px-4 text-sm">Most common</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Firefox 120</td>
                      <td className="py-3 px-4 font-mono text-xs">579ccef312d18482fc42e2b822ca2430</td>
                      <td className="py-3 px-4 text-sm">Unique to Firefox</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Safari (macOS)</td>
                      <td className="py-3 px-4 font-mono text-xs">773906b0efdefa24a7f2b8eb6985bf37</td>
                      <td className="py-3 px-4 text-sm">Apple-specific</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Python Requests</td>
                      <td className="py-3 px-4 font-mono text-xs">3b5074b1b5d032e5620f69f9f700ff0e</td>
                      <td className="py-3 px-4 text-sm">Common bot</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">curl</td>
                      <td className="py-3 px-4 font-mono text-xs">456523fc94726331a4d5a2e1d40b2cd7</td>
                      <td className="py-3 px-4 text-sm">Scripting tool</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3">Why JA3 is So Effective</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span><strong>Hard to spoof:</strong> You need to modify the TLS stack itself, not just headers</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span><strong>Happens before content:</strong> Detection occurs before any page load</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span><strong>Consistent:</strong> Same browser = same fingerprint (until version update)</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">4.</span>
                  <span><strong>Works with encryption:</strong> Even with HTTPS, the handshake is visible</span>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="detection" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Who Uses TLS Fingerprinting?
              </h2>
              <p className="text-text-secondary mb-4">
                TLS fingerprinting is used heavily in security and anti-bot systems:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Bot Detection Services</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Cloudflare:</strong> Uses JA3 as part of Bot Fight Mode</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Akamai:</strong> Bot Manager includes TLS fingerprinting</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>PerimeterX (HUMAN):</strong> Heavy JA3 analysis</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>DataDome:</strong> Combines JA3 with behavioral analysis</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Enterprise Security</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Threat hunting:</strong> Identify malware C2 communications</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Zero-day detection:</strong> Spot unusual TLS patterns</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Network monitoring:</strong> Identify unauthorized applications</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">What They Can Detect</h3>
              <div className="p-4 bg-bg-secondary rounded-lg border border-border mb-4">
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li>• Browser type (Chrome, Firefox, Safari, etc.)</li>
                  <li>• Operating system (Windows, macOS, Linux)</li>
                  <li>• Automated tools (Python, curl, Go, etc.)</li>
                  <li>• Modified/patched browsers</li>
                  <li>• Headless browsers (Puppeteer, Playwright)</li>
                  <li>• VPN/Proxy applications (some have unique signatures)</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="data" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Statistics & Real-World Data
              </h2>
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
                      <td className="py-3 px-4">Unique JA3 fingerprints</td>
                      <td className="py-3 px-4 font-mono text-accent">~10,000</td>
                      <td className="py-3 px-4 text-sm">Salesforce Research</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Sites using JA3 detection</td>
                      <td className="py-3 px-4 font-mono text-accent">30%+</td>
                      <td className="py-3 px-4 text-sm">Top 10K sites (est.)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Bot detection accuracy</td>
                      <td className="py-3 px-4 font-mono text-accent">85-95%</td>
                      <td className="py-3 px-4 text-sm">Industry reports</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">JA3 entropy</td>
                      <td className="py-3 px-4 font-mono text-accent">~13 bits</td>
                      <td className="py-3 px-4 text-sm">Fingerprint studies</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Chrome market share</td>
                      <td className="py-3 px-4 font-mono text-accent">65%</td>
                      <td className="py-3 px-4 text-sm">StatCounter 2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-accent">Interesting Finding:</strong> Because Chrome
                  dominates browser market share (65%+), Chrome JA3 fingerprints are by far the
                  most common. Using any other browser's JA3 actually makes you MORE unique and
                  potentially more trackable.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="bypass" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How to Bypass TLS Fingerprinting
              </h2>
              <p className="text-text-secondary mb-6">
                This is where it gets tricky. TLS fingerprinting is much harder to bypass than
                JavaScript-based fingerprinting. Here are your options:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Option 1: TLS Spoofing Libraries</h3>
              <p className="text-text-secondary mb-4">
                For developers, libraries exist that can mimic real browser TLS patterns:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>utls (Go):</strong> Most popular, supports Chrome/Firefox/Safari impersonation</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>curl-impersonate:</strong> curl with browser-like TLS fingerprints</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>tls-client (Python):</strong> Python library for TLS spoofing</span>
                </li>
              </ul>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`# curl-impersonate example
curl-impersonate-chrome https://example.com

# This uses Chrome's exact TLS fingerprint`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Option 2: Anti-Detect Browsers</h3>
              <p className="text-text-secondary mb-4">
                Premium anti-detect browsers like Multilogin use modified Chromium engines that
                produce real Chrome TLS fingerprints. Since they're actually based on Chromium,
                the fingerprint is authentic.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Option 3: Residential Proxies with Browser Profiles</h3>
              <p className="text-text-secondary mb-4">
                Some proxy providers offer browser profile integration that handles TLS
                fingerprint matching automatically. Your requests appear to come from real
                browsers in residential networks.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">What Doesn't Work</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-error">✗</span>
                  <span><strong>Changing User-Agent:</strong> JA3 and UA can be compared for mismatches</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-error">✗</span>
                  <span><strong>VPNs alone:</strong> They change IP, not TLS fingerprint</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-error">✗</span>
                  <span><strong>JavaScript modifications:</strong> TLS happens before JS loads</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-error">✗</span>
                  <span><strong>Browser extensions:</strong> Can't modify TLS handshake</span>
                </li>
              </ul>

              <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-warning">Reality Check:</strong> Perfect TLS spoofing is
                  an arms race. Detection systems constantly update their databases and look for
                  subtle inconsistencies. The best approach is using legitimate browsers (like
                  anti-detect software) rather than trying to fake fingerprints.
                </p>
              </div>
            </section>

            {/* Key Takeaways */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Key Takeaways
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">1</span>
                  <span>TLS fingerprinting happens at network level, before JavaScript runs</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">2</span>
                  <span>JA3 is the industry standard for TLS fingerprinting</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">3</span>
                  <span>30%+ of major sites use TLS fingerprinting for bot detection</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">4</span>
                  <span>Standard browsers/VPNs don't protect against TLS fingerprinting</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">5</span>
                  <span>Anti-detect browsers with real Chromium engines are the most reliable solution</span>
                </li>
              </ul>
            </section>

            {/* CTA */}
            <div className="p-8 rounded-lg bg-gradient-to-br from-accent/20 to-success/10 border border-accent/30 not-prose">
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Check Your TLS Fingerprint
              </h3>
              <p className="text-text-secondary mb-6">
                Our TLS fingerprint tool shows you exactly what servers see when you connect -
                including your JA3 hash and how it compares to common browsers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tools/tls"
                  className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg text-center"
                >
                  Check My TLS Fingerprint
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

          {/* Author / Sources */}
          <footer className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sources & References</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>
                • Salesforce Engineering - JA3 Technical Documentation
              </li>
              <li>
                • IETF RFC 8446 - TLS 1.3 Specification
              </li>
              <li>
                • Cloudflare Blog - Bot Fight Mode Technical Details
              </li>
              <li>
                • StatCounter - Browser Market Share Statistics 2024
              </li>
              <li>
                • GitHub - JA3 Fingerprint Database
              </li>
            </ul>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
