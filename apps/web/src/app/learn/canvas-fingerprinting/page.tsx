import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Canvas Fingerprinting Explained: How Websites Track You Without Cookies | Anti-Detect.com',
  description:
    'Complete guide to canvas fingerprinting - how it works, who uses it, and how to protect yourself. Learn why 25% of top websites use this invisible tracking technique.',
  keywords: [
    'canvas fingerprinting',
    'browser fingerprinting',
    'online tracking',
    'privacy',
    'canvas API',
    'digital fingerprint',
    'tracking protection',
    'anti-fingerprinting',
  ],
  openGraph: {
    title: 'Canvas Fingerprinting Explained: How Websites Track You Without Cookies',
    description:
      'Complete guide to canvas fingerprinting - how it works, who uses it, and how to protect yourself.',
    type: 'article',
  },
};

export default function CanvasFingerprintingPage() {
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
            <span className="text-text-secondary">Canvas Fingerprinting</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Deep Dive
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mt-2 mb-6">
              Canvas Fingerprinting: The Invisible Tracking Technique
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span>15 min read</span>
              <span>•</span>
              <span>Last updated: December 2024</span>
            </div>
          </header>

          {/* Table of Contents */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-12">
            <h2 className="text-sm font-semibold text-text-primary mb-4">In This Guide</h2>
            <nav className="space-y-2 text-sm">
              <a href="#what-is-canvas" className="block text-text-muted hover:text-accent">
                1. What is Canvas Fingerprinting?
              </a>
              <a href="#how-it-works" className="block text-text-muted hover:text-accent">
                2. How Canvas Fingerprinting Works (Technical Deep Dive)
              </a>
              <a href="#why-unique" className="block text-text-muted hover:text-accent">
                3. Why Your Canvas Fingerprint is Unique
              </a>
              <a href="#statistics" className="block text-text-muted hover:text-accent">
                4. Canvas Fingerprinting Statistics & Data
              </a>
              <a href="#detection" className="block text-text-muted hover:text-accent">
                5. How to Detect Canvas Fingerprinting
              </a>
              <a href="#protection" className="block text-text-muted hover:text-accent">
                6. Protection Methods & Tools
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <p className="text-lg text-text-secondary leading-relaxed mb-8">
              Okay, let me tell you about something that's been quietly tracking you for over a
              decade. Canvas fingerprinting. It's one of the most effective browser tracking
              techniques ever invented, and the crazy part? It uses a web feature designed for
              drawing graphics. Every time you visit a website, your browser can be asked to draw
              an invisible image - and that image is slightly different on YOUR computer than on
              anyone else's. Mind-blowing, right?
            </p>

            {/* Section 1 */}
            <section id="what-is-canvas" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                What is Canvas Fingerprinting?
              </h2>
              <p className="text-text-secondary mb-4">
                Canvas fingerprinting exploits the HTML5 Canvas API - a feature that lets websites
                draw 2D graphics in your browser. When a website uses canvas fingerprinting, it
                asks your browser to render some text or graphics. The resulting image is then
                converted into a unique code that identifies your browser.
              </p>
              <p className="text-text-secondary mb-4">
                Here's the thing that makes this technique so powerful: the way your browser draws
                this image depends on your operating system, your graphics card, your drivers, your
                fonts, and even tiny differences in how your hardware processes graphics. No two
                computers render it EXACTLY the same way.
              </p>
              <div className="p-4 bg-accent/10 border-l-4 border-accent rounded-r-lg mb-4">
                <p className="text-text-secondary">
                  <strong className="text-accent">Key Insight:</strong> Canvas fingerprinting was
                  first publicly documented in 2012 by Keaton Mowery and Hovav Shacham from UC San
                  Diego. By 2014, it was found on over 5% of the top 100,000 websites. Today, that
                  number has grown to approximately 25%.
                </p>
              </div>
              <p className="text-text-secondary">
                The beauty (or horror, depending on your perspective) of canvas fingerprinting is
                that it's completely invisible. No permission dialogs, no cookie banners, no
                visible signs at all. Your browser just draws something, and boom - you're tracked.
              </p>
            </section>

            {/* Section 2 */}
            <section id="how-it-works" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How Canvas Fingerprinting Works: Technical Deep Dive
              </h2>
              <p className="text-text-secondary mb-4">
                Let me break down exactly what happens when a website fingerprints your canvas.
                This is the actual process, simplified so anyone can understand it:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 1: Create a Hidden Canvas</h3>
              <p className="text-text-secondary mb-4">
                The website creates an invisible canvas element. You won't see it anywhere on the
                page - it's created purely in memory. Here's what the code looks like:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`const canvas = document.createElement('canvas');
canvas.width = 200;
canvas.height = 50;
const ctx = canvas.getContext('2d');`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 2: Draw Complex Graphics</h3>
              <p className="text-text-secondary mb-4">
                The script draws text and shapes using specific settings. These settings are chosen
                to maximize the differences between systems:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// Draw text with anti-aliasing effects
ctx.textBaseline = 'top';
ctx.font = '14px Arial';
ctx.fillStyle = '#f60';
ctx.fillRect(125, 1, 62, 20);
ctx.fillStyle = '#069';
ctx.fillText('Canvas FP 🦊', 2, 15);

// Draw overlapping shapes with blending
ctx.globalCompositeOperation = 'multiply';
ctx.fillStyle = 'rgb(255, 0, 255)';
ctx.beginPath();
ctx.arc(50, 50, 50, 0, Math.PI * 2);
ctx.closePath();
ctx.fill();`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 3: Extract the Fingerprint</h3>
              <p className="text-text-secondary mb-4">
                The canvas is converted to a data URL (basically a text representation of the image),
                then hashed to create a unique identifier:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`const dataURL = canvas.toDataURL();
// Result: "data:image/png;base64,iVBORw0KG..."
// This long string is then hashed:
const fingerprint = sha256(dataURL);
// Result: "a4f7b2c8d9e3f6..."  <- Your canvas fingerprint`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Step 4: Send to Server</h3>
              <p className="text-text-secondary mb-4">
                The fingerprint hash is sent back to the tracking server, where it's stored and
                used to identify you across visits, devices, and even different websites that use
                the same tracking service.
              </p>

              <div className="p-4 bg-warning/10 border-l-4 border-warning rounded-r-lg">
                <p className="text-text-secondary">
                  <strong className="text-warning">Fun Fact:</strong> The most common canvas
                  fingerprinting script renders the text "Cwm fjordbank glyphs vext quiz" - a
                  pangram (sentence using every letter of the alphabet) that tests maximum font
                  variation.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="why-unique" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Why Your Canvas Fingerprint is Unique
              </h2>
              <p className="text-text-secondary mb-4">
                You might be thinking: "How can drawing a simple image be unique?" Great question.
                Here are all the factors that affect your canvas rendering:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                  <h4 className="font-bold text-text-primary mb-2">GPU & Graphics Driver</h4>
                  <p className="text-sm text-text-muted">
                    Different GPUs (NVIDIA, AMD, Intel, Apple Silicon) render pixels differently.
                    Even the same GPU with different driver versions produces variations.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Font Rendering</h4>
                  <p className="text-sm text-text-muted">
                    Windows, macOS, and Linux all render fonts differently. ClearType, subpixel
                    rendering, and anti-aliasing settings create unique patterns.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Browser Engine</h4>
                  <p className="text-sm text-text-muted">
                    Chrome (Blink), Firefox (Gecko), and Safari (WebKit) all implement canvas
                    differently, affecting color space handling and rendering order.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Operating System</h4>
                  <p className="text-sm text-text-muted">
                    Windows 10 vs 11, macOS versions, Linux distributions - each has different
                    graphics libraries and system fonts.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Display Settings</h4>
                  <p className="text-sm text-text-muted">
                    DPI scaling, color profiles, and hardware acceleration settings all affect
                    the final rendered output.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                  <h4 className="font-bold text-text-primary mb-2">Installed Fonts</h4>
                  <p className="text-sm text-text-muted">
                    If the script uses a font you don't have, a fallback is used - and that
                    fallback differs by system.
                  </p>
                </div>
              </div>

              <p className="text-text-secondary">
                When you combine all these factors, the probability that two random users have the
                exact same canvas fingerprint is incredibly low - typically less than 0.1% among
                unique browsers.
              </p>
            </section>

            {/* Section 4 - Statistics */}
            <section id="statistics" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Canvas Fingerprinting Statistics & Data
              </h2>
              <p className="text-text-secondary mb-6">
                Here's the real data on canvas fingerprinting usage and effectiveness. These
                numbers come from academic research and web crawls:
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
                      <td className="py-3 px-4">Top 100K sites using canvas FP</td>
                      <td className="py-3 px-4 font-mono text-accent">~25%</td>
                      <td className="py-3 px-4 text-sm">HTTP Archive 2024</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Canvas entropy (identifying bits)</td>
                      <td className="py-3 px-4 font-mono text-accent">~10.2 bits</td>
                      <td className="py-3 px-4 text-sm">Acar et al. 2014</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Unique canvas fingerprints</td>
                      <td className="py-3 px-4 font-mono text-accent">~58%</td>
                      <td className="py-3 px-4 text-sm">AmIUnique Study</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Combined with other signals</td>
                      <td className="py-3 px-4 font-mono text-accent">94%+ unique</td>
                      <td className="py-3 px-4 text-sm">EFF Panopticlick</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">Third-party canvas scripts</td>
                      <td className="py-3 px-4 font-mono text-accent">14,371 sites</td>
                      <td className="py-3 px-4 text-sm">Princeton WebTAP</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Growth rate (YoY)</td>
                      <td className="py-3 px-4 font-mono text-accent">+18%</td>
                      <td className="py-3 px-4 text-sm">WhoTracksMe 2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3">Top Canvas Fingerprinting Scripts</h3>
              <p className="text-text-secondary mb-4">
                Here are the most common fingerprinting libraries found in the wild:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">1.</span>
                  <span><strong>FingerprintJS</strong> - Found on 7,000+ sites, used for fraud detection</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">2.</span>
                  <span><strong>Google Analytics</strong> - Uses canvas as part of client ID generation</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">3.</span>
                  <span><strong>AddThis/Oracle</strong> - Social sharing widget with fingerprinting</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">4.</span>
                  <span><strong>Criteo</strong> - Retargeting ads, heavy fingerprinting user</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">5.</span>
                  <span><strong>MediaMath</strong> - Ad exchange with cross-device tracking</span>
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="detection" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                How to Detect Canvas Fingerprinting
              </h2>
              <p className="text-text-secondary mb-4">
                Want to know if a website is fingerprinting your canvas? Here's how to detect it:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Browser Developer Tools</h3>
              <p className="text-text-secondary mb-4">
                Open your browser's DevTools (F12), go to Console, and look for calls to these APIs:
              </p>
              <pre className="p-4 rounded-lg bg-bg-tertiary text-terminal text-sm overflow-x-auto mb-4">
{`// Watch for these canvas API calls:
canvas.toDataURL()
canvas.toBlob()
ctx.getImageData()

// In DevTools Console, paste this to detect:
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function() {
  console.warn('Canvas fingerprint detected!', new Error().stack);
  return originalToDataURL.apply(this, arguments);
};`}
              </pre>

              <h3 className="text-xl font-bold text-text-primary mb-3">Browser Extensions</h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Canvas Blocker</strong> (Firefox) - Shows notifications when canvas fingerprinting is attempted</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>Privacy Badger</strong> (All browsers) - Learns and blocks fingerprinting scripts</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-accent">•</span>
                  <span><strong>NoScript</strong> (Firefox) - Blocks JavaScript entirely, including fingerprinting</span>
                </li>
              </ul>

              <h3 className="text-xl font-bold text-text-primary mb-3">Online Tools</h3>
              <p className="text-text-secondary mb-4">
                Use these tools to see your canvas fingerprint and test protection:
              </p>
              <div className="p-4 bg-bg-secondary rounded-lg border border-border mb-4">
                <p className="text-text-secondary">
                  <strong className="text-text-primary">Our Canvas Test Tool:</strong>{' '}
                  <Link href="/tools/canvas" className="text-accent hover:underline">
                    anti-detect.com/tools/canvas
                  </Link>
                  {' '}- See exactly what your canvas fingerprint looks like and compare it to others.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="protection" className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Protection Methods & Tools
              </h2>
              <p className="text-text-secondary mb-6">
                Here are your options for protecting against canvas fingerprinting, ranked from
                basic to advanced:
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Level 1: Browser Settings</h3>
              <p className="text-text-secondary mb-4">
                <strong>Firefox resist fingerprinting:</strong> Go to <code className="text-terminal">about:config</code>,
                set <code className="text-terminal">privacy.resistFingerprinting = true</code>. This returns
                a blank canvas to all websites. Warning: Some sites may break.
              </p>
              <p className="text-text-secondary mb-4">
                <strong>Brave Browser:</strong> Has built-in fingerprint randomization. Canvas data is slightly
                modified each session, breaking cross-session tracking.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Level 2: Extensions</h3>
              <p className="text-text-secondary mb-4">
                <strong>Canvas Blocker (Firefox):</strong> Adds noise to canvas data or returns fake values.
                Configurable protection levels let you balance privacy vs. compatibility.
              </p>
              <p className="text-text-secondary mb-4">
                Problem: Extensions themselves can be detected (via their behavior patterns), and
                ironically, using specific privacy extensions can make you MORE unique.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Level 3: Tor Browser</h3>
              <p className="text-text-secondary mb-4">
                Tor Browser standardizes canvas output across all users. When a site requests canvas data,
                every Tor user returns the exact same fingerprint. This is the "blend into the crowd" approach.
              </p>

              <h3 className="text-xl font-bold text-text-primary mb-3">Level 4: Anti-Detect Browsers</h3>
              <p className="text-text-secondary mb-4">
                For serious privacy or business needs (managing multiple accounts, web scraping,
                market research), anti-detect browsers are the real solution. They don't just
                block fingerprinting - they create REALISTIC fingerprints that match real browsers.
              </p>

              <div className="p-4 bg-bg-secondary rounded-lg border border-border space-y-4">
                <div>
                  <h4 className="font-bold text-text-primary">Multilogin</h4>
                  <p className="text-sm text-text-muted">
                    Enterprise solution with Mimic (Chromium) and Stealthfox (Firefox) engines.
                    Creates consistent canvas fingerprints per profile. $99+/month.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">GoLogin</h4>
                  <p className="text-sm text-text-muted">
                    Budget-friendly alternative with good canvas spoofing. Cloud profiles and
                    team features. $24+/month with free tier available.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">Dolphin Anty</h4>
                  <p className="text-sm text-text-muted">
                    Popular among affiliate marketers. Good canvas protection with team
                    collaboration features. Free tier for 10 profiles.
                  </p>
                </div>
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
                  <span>Canvas fingerprinting is used by 25%+ of top websites and growing</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">2</span>
                  <span>It works by exploiting tiny differences in how your hardware renders graphics</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">3</span>
                  <span>Canvas alone provides ~10 bits of entropy - enough to narrow down your identity significantly</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">4</span>
                  <span>Combined with other fingerprinting, it can identify you with 94%+ accuracy</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary">
                  <span className="text-success text-xl">5</span>
                  <span>Protection options range from Firefox settings to full anti-detect browsers</span>
                </li>
              </ul>
            </section>

            {/* CTA */}
            <div className="p-8 rounded-lg bg-gradient-to-br from-accent/20 to-success/10 border border-accent/30 not-prose">
              <h3 className="text-xl font-bold text-text-primary mb-4">
                Test Your Canvas Fingerprint Now
              </h3>
              <p className="text-text-secondary mb-6">
                See what your canvas fingerprint looks like and how unique it is compared to other
                users. Our free tool shows you exactly what tracking scripts can extract from your
                browser.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tools/canvas"
                  className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg text-center"
                >
                  Test My Canvas Fingerprint
                </Link>
                <Link
                  href="/learn/anti-detect-browsers"
                  className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary rounded-lg text-center transition-colors"
                >
                  Compare Anti-Detect Browsers
                </Link>
              </div>
            </div>
          </div>

          {/* Author / Sources */}
          <footer className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sources & References</h3>
            <ul className="text-sm text-text-muted space-y-2">
              <li>
                • Mowery, K. & Shacham, H. (2012) - "Pixel Perfect: Fingerprinting Canvas in HTML5"
              </li>
              <li>
                • Acar, G. et al. (2014) - "The Web Never Forgets: Persistent Tracking Mechanisms in the Wild"
              </li>
              <li>
                • Princeton WebTAP Project - Web Transparency & Accountability Project
              </li>
              <li>
                • HTTP Archive - Web Almanac 2024
              </li>
              <li>
                • AmIUnique - Canvas Fingerprinting Study
              </li>
              <li>
                • WhoTracksMe - Tracker Database 2024
              </li>
            </ul>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
