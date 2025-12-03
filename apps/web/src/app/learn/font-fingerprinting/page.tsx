import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Font Fingerprinting: How Your Installed Fonts Track You | Anti-Detect.com',
  description:
    'Learn how websites use font detection to create unique fingerprints. Your installed fonts reveal your OS, profession, and can track you across sites.',
  keywords: [
    'font fingerprinting',
    'font detection',
    'browser fingerprinting',
    'installed fonts',
    'privacy',
    'font enumeration',
    'system fonts',
    'tracking',
  ],
  openGraph: {
    title: 'Font Fingerprinting: How Your Installed Fonts Track You',
    description:
      'Learn how websites use font detection to create unique fingerprints from your installed fonts.',
    type: 'article',
  },
};

export default function FontFingerprintingPage() {
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
            <span className="text-text-secondary">Font Fingerprinting</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Deep Dive
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-2 mb-6">
              Font Fingerprinting: Your Fonts Are Tracking You
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
              <a href="#what-is-font" className="block text-text-muted hover:text-accent">
                1. What is Font Fingerprinting?
              </a>
              <a href="#how-it-works" className="block text-text-muted hover:text-accent">
                2. How Font Detection Works
              </a>
              <a href="#why-unique" className="block text-text-muted hover:text-accent">
                3. Why Your Fonts Are Unique
              </a>
              <a href="#statistics" className="block text-text-muted hover:text-accent">
                4. Statistics & Entropy Data
              </a>
              <a href="#protection" className="block text-text-muted hover:text-accent">
                5. How to Protect Yourself
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              Here's something you probably never considered: the fonts installed on your computer
              are surprisingly identifying. A graphic designer with Adobe fonts, a coder with
              programming fonts, a gamer with custom fonts - each has a unique signature. Websites
              have been exploiting this for tracking since 2009, and it's still one of the most
              effective fingerprinting techniques today.
            </p>

            {/* Section 1 */}
            <section id="what-is-font" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                What is Font Fingerprinting?
              </h2>
              <p className="text-text-secondary mb-4">
                Font fingerprinting is a technique that identifies your browser by detecting which
                fonts are installed on your system. Each operating system comes with different
                default fonts. Then users install additional fonts based on their software and
                preferences. The combination becomes a unique identifier.
              </p>
              <p className="text-text-secondary mb-4">
                The technique was first described in research by the EFF (Electronic Frontier
                Foundation) in 2010 and has since been found on thousands of websites.
              </p>
              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg mb-4">
                <p className="text-text-secondary">
                  <strong className="text-accent">Key Insight:</strong> According to studies, font
                  fingerprinting alone provides approximately 13.9 bits of entropy - meaning it
                  can distinguish between roughly 15,000 different configurations. Combined with
                  other fingerprinting, this is highly effective.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="how-it-works" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How Font Detection Works
              </h2>
              <p className="text-text-secondary mb-4">
                Websites can't directly ask your browser "what fonts do you have?" But they can
                detect fonts indirectly through several clever techniques:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Method 1: Width Measurement</h3>
              <p className="text-text-secondary mb-4">
                The most common method. It renders text using a specific font and measures the
                width. If the font exists, the width matches expected values. If not, a fallback
                font is used, producing different dimensions.
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// Create a span element
const span = document.createElement('span');
span.style.position = 'absolute';
span.style.left = '-9999px';
span.style.fontSize = '72px';
span.innerHTML = 'mmmmmmmmmmlli';

// Set fallback font first
span.style.fontFamily = 'monospace';
document.body.appendChild(span);
const baseWidth = span.offsetWidth;

// Now test target font with monospace fallback
span.style.fontFamily = '"Comic Sans MS", monospace';
const testWidth = span.offsetWidth;

// If widths differ, the font exists
const hasComicSans = (testWidth !== baseWidth);`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Method 2: Canvas Rendering</h3>
              <p className="text-text-secondary mb-4">
                Similar to canvas fingerprinting, but specifically testing how fonts render:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Draw text with test font
ctx.font = '72px "Arial"';
ctx.fillText('Test', 0, 50);

// Get image data
const arialData = canvas.toDataURL();

// Compare with other fonts
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.font = '72px "Helvetica"';
ctx.fillText('Test', 0, 50);
const helveticaData = canvas.toDataURL();

// If different, fonts render differently on this system`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Method 3: CSS Font Loading API</h3>
              <p className="text-text-secondary mb-4">
                Modern browsers have a Font Loading API that can be used to check font availability:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// Check if a font is available
document.fonts.check('12px "Segoe UI"'); // true on Windows
document.fonts.check('12px "San Francisco"'); // true on macOS`}
              </pre>

              <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-warning">Note:</strong> Websites typically test hundreds
                  of fonts to build your font list. The specific combination creates your fingerprint.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="why-unique" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Why Your Fonts Are Unique
              </h2>
              <p className="text-text-secondary mb-4">
                Your font list reveals more about you than you might think:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Operating System</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Windows:</strong> Segoe UI, Calibri, Cambria, Consolas</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>macOS:</strong> San Francisco, Helvetica Neue, Menlo, SF Pro</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Linux:</strong> DejaVu Sans, Liberation Sans, Ubuntu</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Installed Software</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Microsoft Office:</strong> Adds 50+ fonts (Calibri, Cambria, etc.)</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Adobe Creative Suite:</strong> Hundreds of unique fonts</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Development Tools:</strong> Fira Code, JetBrains Mono, Hack</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Games:</strong> Some games install custom fonts</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Language & Region</h3>
              <p className="text-text-secondary mb-4">
                Different language packs install different fonts:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Japanese:</strong> MS Gothic, Yu Gothic, Meiryo</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Chinese:</strong> SimSun, Microsoft YaHei, PingFang</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Korean:</strong> Malgun Gothic, Batang</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Arabic:</strong> Traditional Arabic, Simplified Arabic</span>
                </li>
              </ul>

              <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                <h4 className="font-bold text-text-primary mb-2">Example: A Designer's Font List</h4>
                <p className="text-text-secondary text-sm">
                  macOS + Adobe CC + additional design fonts = very unique signature:
                  San Francisco, Helvetica Neue, Adobe Garamond Pro, Futura PT, Proxima Nova,
                  Brandon Grotesque, Avenir Next, Gotham...
                </p>
                <p className="text-text-muted text-xs mt-2">
                  This combination might be shared by only 0.01% of users.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="statistics" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Statistics & Entropy Data
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
                      <td className="py-3 px-4">Font fingerprint entropy</td>
                      <td className="py-3 px-4 font-mono text-accent">~13.9 bits</td>
                      <td className="py-3 px-4 text-sm">Laperdrix 2016</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Unique font combinations</td>
                      <td className="py-3 px-4 font-mono text-accent">~67%</td>
                      <td className="py-3 px-4 text-sm">AmIUnique Study</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Average fonts detected (Windows)</td>
                      <td className="py-3 px-4 font-mono text-accent">~300</td>
                      <td className="py-3 px-4 text-sm">Fingerprint.js</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Average fonts detected (macOS)</td>
                      <td className="py-3 px-4 font-mono text-accent">~250</td>
                      <td className="py-3 px-4 text-sm">Fingerprint.js</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Sites using font detection</td>
                      <td className="py-3 px-4 font-mono text-accent">~15%</td>
                      <td className="py-3 px-4 text-sm">Top 10K (estimated)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3">Most Identifying Fonts</h3>
              <p className="text-text-secondary mb-4">
                Some fonts are more identifying because fewer people have them:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h4 className="font-bold text-error mb-2">Highly Identifying</h4>
                  <ul className="text-sm text-text-muted space-y-1">
                    <li>• Adobe fonts (Garamond Pro, Minion, etc.)</li>
                    <li>• Monotype fonts (paid licenses)</li>
                    <li>• Professional design fonts</li>
                    <li>• Regional/specialty fonts</li>
                  </ul>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <h4 className="font-bold text-success mb-2">Low Identifying</h4>
                  <ul className="text-sm text-text-muted space-y-1">
                    <li>• Default OS fonts</li>
                    <li>• Common Google Fonts</li>
                    <li>• Web-safe fonts</li>
                    <li>• Default Office fonts</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="protection" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How to Protect Yourself
              </h2>

              <h3 className="text-xl font-bold text-text-primary mb-3">1. Browser Settings</h3>
              <p className="text-text-secondary mb-4">
                Firefox has the best built-in protection:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><code className="text-terminal">privacy.resistFingerprinting</code> = true in about:config</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>This limits font detection to a standard set of fonts</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">2. Tor Browser</h3>
              <p className="text-text-secondary mb-4">
                Tor Browser restricts fonts to a standard list shared by all users. This eliminates
                font fingerprinting as an identification vector.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">3. Anti-Detect Browsers</h3>
              <p className="text-text-secondary mb-4">
                Anti-detect browsers let you define a specific font list for each profile. You can:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Match fonts to your claimed OS</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Use common font lists that don't stand out</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span>Maintain consistent font fingerprints per profile</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">4. Minimize Installed Fonts</h3>
              <p className="text-text-secondary mb-4">
                Less practical, but: having fewer installed fonts means less unique fingerprint.
                Stick to default OS fonts if privacy is paramount.
              </p>

              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-accent">Reality:</strong> Font fingerprinting is rarely
                  used alone. It's combined with canvas, WebGL, and other techniques. Protecting
                  just against fonts while leaving other fingerprints exposed won't help much.
                  A comprehensive approach is needed.
                </p>
              </div>
            </section>

            {/* CTA */}
            <div className="p-8 rounded-lg bg-gradient-to-br from-accent/20 to-success/10 border border-accent/30 not-prose">
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Check Your Font Fingerprint
              </h3>
              <p className="text-text-secondary mb-6">
                See exactly which fonts websites can detect on your system and how unique your
                font combination is compared to other users.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tools/fonts"
                  className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg text-center"
                >
                  Test My Fonts
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary rounded-lg text-center transition-colors"
                >
                  Full Fingerprint Scan
                </Link>
              </div>
            </div>
          </div>

          {/* Sources */}
          <footer className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sources & References</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>• Laperdrix, P. - "Browser Fingerprinting: A Survey" (2020)</li>
              <li>• EFF - Panopticlick Font Detection Research</li>
              <li>• AmIUnique - Font Fingerprint Statistics</li>
              <li>• FingerprintJS - Font Detection Documentation</li>
            </ul>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
