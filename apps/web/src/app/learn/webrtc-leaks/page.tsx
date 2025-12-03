import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'WebRTC Leaks Explained: How Your Real IP Gets Exposed (Even with VPN) | Anti-Detect.com',
  description:
    'Learn about WebRTC IP leaks - why your VPN might not protect you, how websites discover your real IP address, and how to prevent WebRTC leaks completely.',
  keywords: [
    'webrtc leak',
    'webrtc ip leak',
    'vpn leak',
    'real ip address',
    'webrtc test',
    'disable webrtc',
    'ip leak protection',
    'stun server',
  ],
  openGraph: {
    title: 'WebRTC Leaks Explained: How Your Real IP Gets Exposed',
    description:
      'Learn about WebRTC IP leaks and how to protect your privacy even when using a VPN.',
    type: 'article',
  },
};

export default function WebRTCLeaksPage() {
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
            <span className="text-text-secondary">WebRTC Leaks</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <span className="text-xs font-semibold text-error uppercase tracking-wider">
              Privacy Risk
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-2 mb-6">
              WebRTC IP Leaks: Why Your VPN Might Not Be Protecting You
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span>12 min read</span>
              <span>•</span>
              <span>Last updated: December 2024</span>
            </div>
          </header>

          {/* Warning Banner */}
          <div className="p-6 rounded-lg bg-error/10 border border-error/30 mb-12">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-lg font-bold text-error mb-2">Critical Privacy Issue</h2>
                <p className="text-text-secondary">
                  Even if you're using a VPN, your real IP address might be exposed through WebRTC.
                  This affects 70%+ of browsers by default. Check if you're vulnerable below.
                </p>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-12">
            <h2 className="text-sm font-semibold text-text-primary mb-4">In This Guide</h2>
            <nav className="space-y-2 text-sm">
              <a href="#what-is-webrtc" className="block text-text-muted hover:text-accent">
                1. What is WebRTC and Why Does It Leak Your IP?
              </a>
              <a href="#how-leaks-work" className="block text-text-muted hover:text-accent">
                2. How WebRTC Leaks Work (Technical Explanation)
              </a>
              <a href="#vpn-bypass" className="block text-text-muted hover:text-accent">
                3. Why VPNs Don't Always Protect You
              </a>
              <a href="#test-yourself" className="block text-text-muted hover:text-accent">
                4. How to Test for WebRTC Leaks
              </a>
              <a href="#prevention" className="block text-text-muted hover:text-accent">
                5. How to Prevent WebRTC Leaks
              </a>
              <a href="#browsers" className="block text-text-muted hover:text-accent">
                6. Browser-by-Browser Protection Guide
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              Here's a scenario that happens way too often: You're being careful about your privacy.
              You paid for a VPN. You're connected. You think you're safe. But guess what? A simple
              website can still see your REAL IP address in seconds - no hacking required. This is
              called a WebRTC leak, and it's one of the most dangerous privacy vulnerabilities that
              almost nobody talks about.
            </p>

            {/* Section 1 */}
            <section id="what-is-webrtc" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                What is WebRTC and Why Does It Leak Your IP?
              </h2>
              <p className="text-text-secondary mb-4">
                WebRTC (Web Real-Time Communication) is a powerful technology built into your browser.
                It's what makes video calls, voice chat, and peer-to-peer file sharing work directly
                in your browser without plugins. Google Hangouts, Discord web, Zoom's browser client -
                they all use WebRTC.
              </p>
              <p className="text-text-secondary mb-4">
                Here's the problem: for two computers to connect directly (peer-to-peer), they need
                to know each other's IP addresses. WebRTC was designed to find this information
                automatically, and it does this REALLY well. Too well, actually.
              </p>
              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg mb-4">
                <p className="text-text-secondary">
                  <strong className="text-accent">Key Insight:</strong> WebRTC is designed to bypass
                  proxies and VPNs to establish direct connections. This feature, called "ICE"
                  (Interactive Connectivity Establishment), actively tries to find your real IP -
                  and usually succeeds.
                </p>
              </div>
              <p className="text-text-secondary">
                The technology queries something called STUN servers (Session Traversal Utilities
                for NAT) to discover all your IP addresses - including your real one, your local
                network IP, and any VPN IPs. And here's the kicker: any website with JavaScript
                can access this information.
              </p>
            </section>

            {/* Section 2 */}
            <section id="how-leaks-work" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How WebRTC Leaks Work: Technical Deep Dive
              </h2>
              <p className="text-text-secondary mb-4">
                Let me break down exactly what happens when a website exploits WebRTC to find your
                real IP:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 1: Create a Peer Connection</h3>
              <p className="text-text-secondary mb-4">
                A website creates a WebRTC peer connection object. This is legitimate browser API
                that's supposed to enable video calls, but it can be used for tracking:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// This is all it takes to start discovering your IPs
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
});`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 2: Request ICE Candidates</h3>
              <p className="text-text-secondary mb-4">
                The browser automatically starts gathering ICE candidates - essentially, all the
                different ways another computer could connect to you:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// Create a fake data channel to trigger ICE gathering
pc.createDataChannel('');

// Create an offer to force candidate gathering
pc.createOffer().then(offer => pc.setLocalDescription(offer));

// Listen for candidates (your IP addresses)
pc.onicecandidate = (event) => {
  if (event.candidate) {
    // This contains your IP address!
    console.log(event.candidate.candidate);
  }
};`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 3: Extract IP Addresses</h3>
              <p className="text-text-secondary mb-4">
                The ICE candidates contain IP addresses in a specific format. The website parses
                these to extract all your IPs:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// Example ICE candidate string:
// "candidate:842163049 1 udp 1677729535 192.168.1.105 54321 typ srflx raddr 0.0.0.0 rport 0 generation 0"
//                                       ^^^^^^^^^^^^^^
//                                       Your real local IP!

// "candidate:842163049 1 udp 1677729535 98.76.54.32 54321 typ srflx raddr 0.0.0.0 rport 0 generation 0"
//                                       ^^^^^^^^^^^
//                                       Your real PUBLIC IP (bypassed VPN!)`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">What Gets Exposed</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-text-primary">IP Type</th>
                      <th className="text-left py-3 px-4 text-text-primary">Example</th>
                      <th className="text-left py-3 px-4 text-text-primary">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Local/Private IP</td>
                      <td className="py-3 px-4 font-mono">192.168.1.105</td>
                      <td className="py-3 px-4"><span className="text-warning">Medium</span></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Public IP (Real)</td>
                      <td className="py-3 px-4 font-mono">98.76.54.32</td>
                      <td className="py-3 px-4"><span className="text-error">Critical</span></td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">VPN IP (Expected)</td>
                      <td className="py-3 px-4 font-mono">185.199.110.153</td>
                      <td className="py-3 px-4"><span className="text-success">Safe</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">IPv6 Address</td>
                      <td className="py-3 px-4 font-mono text-xs">2001:db8::8a2e:370:7334</td>
                      <td className="py-3 px-4"><span className="text-error">Critical</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3 */}
            <section id="vpn-bypass" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Why VPNs Don't Always Protect You
              </h2>
              <p className="text-text-secondary mb-4">
                This is the part that makes most people angry when they learn about it. You're
                paying for a VPN. You see that green "Connected" icon. But WebRTC can still
                expose your real IP. Here's why:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">The VPN Tunnel Problem</h3>
              <p className="text-text-secondary mb-4">
                VPNs work by routing your internet traffic through an encrypted tunnel. But
                WebRTC uses STUN servers to discover your IP OUTSIDE of the browser's normal
                network stack. It's essentially asking your network interface directly: "Hey,
                what's my IP?"
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">UDP vs TCP</h3>
              <p className="text-text-secondary mb-4">
                WebRTC prefers UDP connections (faster for real-time communication). Some VPNs
                only tunnel TCP traffic, leaving UDP requests to go through your real connection.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">IPv6 Leaks</h3>
              <p className="text-text-secondary mb-4">
                Many VPNs only handle IPv4 traffic. If your ISP provides IPv6, WebRTC can discover
                and expose your IPv6 address - which is often more identifying than IPv4 since
                it's frequently static and unique to your connection.
              </p>

              <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg mb-4">
                <p className="text-text-secondary">
                  <strong className="text-warning">Statistics:</strong> According to a 2023 study,
                  approximately 20-30% of VPN users are vulnerable to WebRTC leaks. Free VPNs are
                  particularly risky, with leak rates exceeding 50%.
                </p>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3">VPNs That DO Protect Against WebRTC</h3>
              <p className="text-text-secondary mb-4">
                Not all VPNs are equal. Here's which ones handle WebRTC properly:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success">✓</span>
                  <span><strong>ExpressVPN</strong> - Built-in WebRTC leak protection</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success">✓</span>
                  <span><strong>NordVPN</strong> - Browser extensions block WebRTC</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success">✓</span>
                  <span><strong>Mullvad</strong> - Disables WebRTC by default in their browser</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-warning">~</span>
                  <span><strong>Most others</strong> - Require manual browser configuration</span>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="test-yourself" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How to Test for WebRTC Leaks
              </h2>
              <p className="text-text-secondary mb-4">
                Testing is simple. Here's exactly what to do:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 1: Note Your Real IP</h3>
              <p className="text-text-secondary mb-4">
                Before connecting to your VPN, note your real IP address. You can find it at any
                "what is my ip" site.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 2: Connect to VPN</h3>
              <p className="text-text-secondary mb-4">
                Connect to your VPN and verify it's working. Your IP should now show the VPN
                server's IP.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 3: Run a WebRTC Test</h3>
              <p className="text-text-secondary mb-4">
                Use a WebRTC leak test tool (like ours!) to check if your real IP is exposed:
              </p>
              <div className="p-4 bg-bg-secondary rounded-lg border border-border mb-4">
                <p className="text-text-secondary">
                  <strong className="text-text-primary">Our WebRTC Test Tool:</strong>{' '}
                  <Link href="/tools/webrtc" className="text-accent hover:underline">
                    anti-detect.com/tools/webrtc
                  </Link>
                  {' '}- Shows all IPs discovered through WebRTC, including local and public addresses.
                </p>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3">What to Look For</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-error">❌</span>
                  <span><strong>LEAK:</strong> Your real public IP appears alongside VPN IP</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-warning">⚠️</span>
                  <span><strong>PARTIAL:</strong> Local IP visible (192.168.x.x) - less critical but still trackable</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success">✓</span>
                  <span><strong>SAFE:</strong> Only VPN IP shown, or WebRTC disabled</span>
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="prevention" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How to Prevent WebRTC Leaks
              </h2>
              <p className="text-text-secondary mb-6">
                Here are your options, from easiest to most thorough:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Option 1: Browser Extensions</h3>
              <p className="text-text-secondary mb-4">
                The quickest fix is a browser extension that blocks WebRTC:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>WebRTC Leak Prevent</strong> (Chrome) - Simple toggle to disable WebRTC</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>uBlock Origin</strong> (All browsers) - Has WebRTC blocking option in settings</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>VPN browser extensions</strong> - Most include WebRTC protection</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Option 2: Browser Settings</h3>
              <p className="text-text-secondary mb-4">
                Each browser has different ways to disable WebRTC natively. See the browser-specific
                guide below for details.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Option 3: Use WebRTC-Safe Browsers</h3>
              <p className="text-text-secondary mb-4">
                Some browsers handle WebRTC more safely by default:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Tor Browser</strong> - WebRTC completely disabled</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Brave</strong> - Has WebRTC leak protection built-in (Settings → Privacy)</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Mullvad Browser</strong> - Privacy-focused Firefox fork, WebRTC disabled</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Option 4: Anti-Detect Browsers</h3>
              <p className="text-text-secondary mb-4">
                For maximum protection, anti-detect browsers let you control WebRTC per profile:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Completely disable WebRTC</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Spoof WebRTC IP to match VPN location</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Enable WebRTC for specific sites that need it (like video calls)</span>
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="browsers" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Browser-by-Browser Protection Guide
              </h2>

              <h3 className="text-xl font-bold text-text-primary mb-3">Google Chrome</h3>
              <p className="text-text-secondary mb-4">
                Chrome doesn't let you fully disable WebRTC through settings. You need an extension:
              </p>
              <ol className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span>Install "WebRTC Leak Prevent" from Chrome Web Store</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span>Set to "Disable non-proxied UDP"</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span>Test with our WebRTC tool to verify</span>
                </li>
              </ol>

              <h3 className="text-xl font-bold text-text-primary mb-3">Firefox</h3>
              <p className="text-text-secondary mb-4">
                Firefox lets you disable WebRTC completely through about:config:
              </p>
              <ol className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span>Type <code className="text-terminal">about:config</code> in address bar</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span>Search for <code className="text-terminal">media.peerconnection.enabled</code></span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span>Set to <code className="text-terminal">false</code></span>
                </li>
              </ol>
              <p className="text-text-secondary mb-4">
                <strong>Note:</strong> This will break video calling in the browser.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Safari</h3>
              <p className="text-text-secondary mb-4">
                Safari has limited WebRTC support and is less vulnerable by default. To disable:
              </p>
              <ol className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span>Safari → Preferences → Advanced</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span>Enable "Show Develop menu"</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span>Develop → Experimental Features → Disable "WebRTC mDNS ICE candidates"</span>
                </li>
              </ol>

              <h3 className="text-xl font-bold text-text-primary mb-3">Microsoft Edge</h3>
              <p className="text-text-secondary mb-4">
                Edge (Chromium-based) requires an extension similar to Chrome, or you can use the
                flags:
              </p>
              <ol className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span>Go to <code className="text-terminal">edge://flags</code></span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span>Search "WebRTC"</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span>Disable "Anonymize local IPs exposed by WebRTC"</span>
                </li>
              </ol>

              <h3 className="text-xl font-bold text-text-primary mb-3">Brave Browser</h3>
              <p className="text-text-secondary mb-4">
                Brave has built-in protection - just make sure it's enabled:
              </p>
              <ol className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span>Settings → Privacy and Security</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span>Find "WebRTC IP Handling Policy"</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span>Set to "Disable non-proxied UDP"</span>
                </li>
              </ol>
            </section>

            {/* Statistics Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                WebRTC Leak Statistics
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
                      <td className="py-3 px-4">VPN users vulnerable to WebRTC</td>
                      <td className="py-3 px-4 font-mono text-error">20-30%</td>
                      <td className="py-3 px-4 text-sm">RestorePrivacy 2023</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Free VPN WebRTC leak rate</td>
                      <td className="py-3 px-4 font-mono text-error">50%+</td>
                      <td className="py-3 px-4 text-sm">VPNpro Study</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Browsers with WebRTC enabled</td>
                      <td className="py-3 px-4 font-mono text-accent">70%+</td>
                      <td className="py-3 px-4 text-sm">Can I Use 2024</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Users aware of WebRTC leaks</td>
                      <td className="py-3 px-4 font-mono text-warning">&lt;15%</td>
                      <td className="py-3 px-4 text-sm">Survey data</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* CTA */}
            <div className="p-8 rounded-lg bg-gradient-to-br from-error/20 to-accent/10 border border-error/30 not-prose">
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Test Your WebRTC Now
              </h3>
              <p className="text-text-secondary mb-6">
                Don't assume you're protected. Our free WebRTC test shows exactly what IP addresses
                websites can discover from your browser - including local IPs that could identify
                your network.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tools/webrtc"
                  className="px-6 py-3 bg-error text-white font-semibold rounded-lg text-center"
                >
                  Test for WebRTC Leaks
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary rounded-lg text-center transition-colors"
                >
                  Full Browser Scan
                </Link>
              </div>
            </div>
          </div>

          {/* Author / Sources */}
          <footer className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sources & References</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>
                • RestorePrivacy - VPN Leak Testing Study 2023
              </li>
              <li>
                • VPNpro - Free VPN Security Analysis
              </li>
              <li>
                • IETF RFC 8825 - WebRTC Overview
              </li>
              <li>
                • Can I Use - WebRTC Browser Support Data
              </li>
              <li>
                • Mozilla Developer Network - WebRTC API Documentation
              </li>
            </ul>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
