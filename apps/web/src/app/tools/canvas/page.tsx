'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface CanvasResult {
  hash: string;
  isNoisyCanvas: boolean;
  uniqueness: 'unique' | 'common' | 'unknown';
  imageData: string;
  webglHash: string;
  webglRenderer: string;
  webglVendor: string;
}

export default function CanvasPage() {
  const [result, setResult] = useState<CanvasResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const runTest = useCallback(async () => {
    setIsLoading(true);

    try {
      // Canvas 2D fingerprint
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas not supported');
      }

      // Draw test pattern
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('Anti-detect.com', 2, 2);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas Test', 4, 17);

      // Add some drawing
      ctx.strokeStyle = '#3300ff';
      ctx.beginPath();
      ctx.arc(50, 50, 25, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.stroke();

      const imageData = canvas.toDataURL();
      const hash = await hashData(imageData);

      // Detect noise
      const canvas2 = document.createElement('canvas');
      canvas2.width = 200;
      canvas2.height = 50;
      const ctx2 = canvas2.getContext('2d');
      if (ctx2) {
        ctx2.textBaseline = 'top';
        ctx2.font = '14px Arial';
        ctx2.fillStyle = '#f60';
        ctx2.fillRect(0, 0, 200, 50);
        ctx2.fillStyle = '#069';
        ctx2.fillText('Anti-detect.com', 2, 2);
        ctx2.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx2.fillText('Canvas Test', 4, 17);
        ctx2.strokeStyle = '#3300ff';
        ctx2.beginPath();
        ctx2.arc(50, 50, 25, 0, Math.PI * 2, true);
        ctx2.closePath();
        ctx2.stroke();
      }

      const imageData1 = ctx.getImageData(0, 0, 200, 50);
      const imageData2 = ctx2?.getImageData(0, 0, 200, 50);
      let differences = 0;
      if (imageData2) {
        for (let i = 0; i < imageData1.data.length; i++) {
          if (imageData1.data[i] !== imageData2.data[i]) {
            differences++;
          }
        }
      }

      // WebGL fingerprint
      const webglCanvas = document.createElement('canvas');
      const gl = webglCanvas.getContext('webgl') || webglCanvas.getContext('experimental-webgl');
      let webglHash = 'not-available';
      let webglRenderer = 'Not available';
      let webglVendor = 'Not available';

      if (gl) {
        const webglCtx = gl as WebGLRenderingContext;
        webglVendor = webglCtx.getParameter(webglCtx.VENDOR) || '';
        webglRenderer = webglCtx.getParameter(webglCtx.RENDERER) || '';

        const debugInfo = webglCtx.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          webglVendor = webglCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || webglVendor;
          webglRenderer = webglCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || webglRenderer;
        }

        webglHash = await hashData(webglVendor + webglRenderer);
      }

      // Update visible canvas
      if (canvasRef.current) {
        const displayCtx = canvasRef.current.getContext('2d');
        if (displayCtx) {
          canvasRef.current.width = 200;
          canvasRef.current.height = 50;
          displayCtx.drawImage(canvas, 0, 0);
        }
      }

      setResult({
        hash,
        isNoisyCanvas: differences > 10,
        uniqueness: 'unknown', // In production, check against database
        imageData,
        webglHash,
        webglRenderer,
        webglVendor,
      });
    } catch (err) {
      console.error('Canvas test failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hashData = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    runTest();
  }, [runTest]);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Canvas <span className="gradient-text">Fingerprint Test</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Your browser's canvas fingerprint is a unique identifier based on how it renders
              graphics. Websites use this to track you across the web.
            </p>
          </div>

          {/* Canvas Preview */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Your Canvas Fingerprint</h3>
            <div className="flex justify-center mb-4 p-4 bg-bg-primary rounded">
              <canvas ref={canvasRef} className="border border-border rounded" />
            </div>
            {result && (
              <div className="text-center">
                <span className="text-sm text-text-muted">Hash: </span>
                <span className="font-mono text-sm text-terminal break-all">{result.hash}</span>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Canvas Protection Status */}
              <div
                className={`p-6 rounded-lg border ${
                  result.isNoisyCanvas
                    ? 'border-success/50 bg-success/10'
                    : 'border-warning/50 bg-warning/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-4xl ${result.isNoisyCanvas ? 'text-success' : 'text-warning'}`}>
                    {result.isNoisyCanvas ? '🛡️' : '⚠️'}
                  </span>
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        result.isNoisyCanvas ? 'text-success' : 'text-warning'
                      }`}
                    >
                      {result.isNoisyCanvas ? 'Canvas Protection Active' : 'Canvas Unprotected'}
                    </h3>
                    <p className="text-text-secondary mt-1">
                      {result.isNoisyCanvas
                        ? 'Your browser is adding noise to canvas fingerprints, making tracking harder.'
                        : 'Your canvas fingerprint is stable and can be used to track you across websites.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* WebGL Info */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">WebGL Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Vendor</span>
                    <span className="font-mono text-text-primary">{result.webglVendor}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Renderer</span>
                    <span className="font-mono text-text-primary text-right max-w-[60%] break-words">
                      {result.webglRenderer}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-text-muted">WebGL Hash</span>
                    <span className="font-mono text-terminal text-sm">
                      {result.webglHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  How Canvas Fingerprinting Works
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Canvas fingerprinting works by exploiting subtle differences in how browsers
                    render graphics. When you draw text or shapes on a canvas:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Different GPUs produce slightly different pixel values
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Font rendering varies between operating systems
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Anti-aliasing algorithms differ between browsers
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      These tiny differences create a unique "fingerprint"
                    </li>
                  </ul>
                </div>
              </div>

              {/* Protection Tips */}
              {!result.isNoisyCanvas && (
                <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                  <h3 className="text-lg font-semibold text-warning mb-4">Protection Options</h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-warning">1.</span>
                      <span>
                        Use Firefox with `privacy.resistFingerprinting` enabled in about:config
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">2.</span>
                      <span>
                        Install a browser extension like Canvas Blocker or CanvasFingerprint Defender
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">3.</span>
                      <span>Use Tor Browser which standardizes canvas output</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">4.</span>
                      <span>Use an anti-detect browser with canvas noise injection</span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-4 border-t border-warning/30">
                    <a
                      href="https://mutilogin.com/?ref=antidetect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-success text-bg-primary font-semibold rounded-lg"
                    >
                      Get Canvas Protection with Mutilogin
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Educational Content */}
          {result && (
            <section className="mt-12 pt-12 border-t border-border/50">
              <h2 className="text-3xl font-bold text-text-primary mb-6">
                Understanding Canvas Fingerprinting
              </h2>

              {/* The Scale of the Problem */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  The Scale of the Problem
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Imagine walking into a store, and instead of asking for your name, they just look at how you walk, what you're wearing, and the unique way you tie your shoelaces. They don't need you to show ID - they already know it's you. That's basically what canvas fingerprinting does online.
                  </p>
                  <p>
                    Canvas fingerprinting exploded into public awareness in 2014 when researchers from Princeton University and KU Leuven University published their groundbreaking paper titled "The Web Never Forgets." The name says it all - once a website captures your canvas fingerprint, that identifier can follow you across the internet, even if you clear your cookies or use private browsing mode.
                  </p>
                  <p>
                    How widespread is this? Studies found that 5% of the top 100,000 websites were using canvas fingerprinting back when it was first deployed. By 2024, a study of 1 million websites discovered 14,371 sites actively performing canvas fingerprinting. That's over 10,000 of the world's most popular sites using this technique to identify you.
                  </p>
                  <p>
                    The technique itself isn't even that new. Two researchers from UC San Diego - Keaton Mowery and Hovav Shacham - first described it back in May 2012 in a paper called "Pixel Perfect: Fingerprinting Canvas in HTML5." They showed how the HTML5 canvas element (originally designed to let websites draw graphics and create animations) could be weaponized for tracking.
                  </p>
                  <p>
                    Think about that: a feature built to make the web more visual and interactive became one of the most powerful tracking tools on the internet. It's like if your TV remote, designed to help you change channels, also secretly recorded everything you watched and sold that data to advertisers. Oh wait...
                  </p>
                </div>
              </div>

              {/* Why This Matters */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Why This Matters for Your Privacy
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Here's why canvas fingerprinting is particularly sneaky and dangerous:
                  </p>
                  <p>
                    <strong className="text-text-primary">It's invisible:</strong> Unlike cookies that browsers can block or users can delete, canvas fingerprinting happens silently. There's no notification, no consent prompt, no "Allow this website to fingerprint you?" dialog. The website just does it. You won't see it in your browser's developer tools. You won't get any warning. It just... happens.
                  </p>
                  <p>
                    <strong className="text-text-primary">It doesn't need your permission:</strong> Cookies require storing data on your device, which means browsers can ask for permission. But canvas fingerprinting uses your browser's own rendering engine - something it needs to display any website properly. Blocking it entirely would break legitimate websites that use canvas for games, charts, or photo editing.
                  </p>
                  <p>
                    <strong className="text-text-primary">You can't easily delete it:</strong> With cookies, you hit "Clear browsing data" and boom - fresh start. But your canvas fingerprint? That's based on your hardware (GPU, fonts, operating system). Unless you literally buy a new computer or radically change your system configuration, your fingerprint stays the same. It's persistent across browsing sessions, across different websites, even across different browsers on the same machine.
                  </p>
                  <p>
                    According to the Tor Project - the folks who literally built a browser to protect anonymity - canvas fingerprinting is serious business. Their documentation states: <em>"After plugins and plugin-provided information, we believe that the HTML5 Canvas is the single largest fingerprinting threat browsers face today."</em>
                  </p>
                  <p>
                    Let that sink in. Of all the ways websites can track you - cookies, IP addresses, user agents, screen resolution - the Tor Project considers canvas fingerprinting the biggest threat after plugins. These are people who spend their careers protecting journalists, activists, and whistleblowers. When they're worried, you should be too.
                  </p>
                  <p>
                    Real-world impacts include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Advertisers building detailed profiles that follow you across unrelated websites</li>
                    <li>Price discrimination where different users see different prices based on their fingerprint</li>
                    <li>De-anonymization of whistleblowers or journalists despite using privacy tools</li>
                    <li>Social media platforms linking your "anonymous" account to your real identity</li>
                    <li>Data brokers correlating your canvas fingerprint with other tracking methods for comprehensive surveillance</li>
                  </ul>
                </div>
              </div>

              {/* What The Research Shows */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  What The Research Shows
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    The academic research on canvas fingerprinting paints a complex picture. Early studies were alarming, but recent research shows the reality is more nuanced - though still concerning.
                  </p>

                  {/* Statistics Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg">
                      <thead className="bg-bg-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Study
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Unique Fingerprints
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Sample Size
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">
                            <a
                              href="https://en.wikipedia.org/wiki/Canvas_fingerprinting"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              Eckersley 2010
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm">83.6% (94.2% with Flash/Java)</td>
                          <td className="px-4 py-3 text-sm">470,161 fingerprints</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">
                            <a
                              href="https://en.wikipedia.org/wiki/Canvas_fingerprinting"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              Laperdrix et al. 2016 (AmIUnique)
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm">89.4%</td>
                          <td className="px-4 py-3 text-sm">118,934 fingerprints</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">
                            <a
                              href="https://en.wikipedia.org/wiki/Canvas_fingerprinting"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              "Hiding in the Crowd" (ACM)
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm">33.6% overall (35.7% desktop, 18.5% mobile)</td>
                          <td className="px-4 py-3 text-sm">2,067,942 fingerprints</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            <a
                              href="https://multilogin.com/blog/the-great-myth-of-canvas-fingerprinting/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              Multilogin 2025 Testing
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm">Many identical fingerprints for popular configs</td>
                          <td className="px-4 py-3 text-sm">Hundreds of devices tested</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>
                    Notice the huge variation? Early studies (Eckersley 2010, Laperdrix 2016) found that 83-89% of browsers had unique fingerprints - meaning canvas fingerprinting could identify almost everyone. Scary stuff.
                  </p>
                  <p>
                    But a more recent study called "Hiding in the Crowd" analyzed over 2 million fingerprints from one of France's top 15 websites and found something different: only 33.6% of fingerprints were truly unique. On mobile devices, that number dropped to just 18.5%. Why the big difference?
                  </p>
                  <p>
                    Turns out, popular devices with standard configurations often produce <em>identical</em> canvas fingerprints. Multilogin's 2025 testing found that all MacBook Pros from 2020-2024 with default Safari settings share the same fingerprint. Twenty-three different laptops with Intel integrated graphics produced identical canvas outputs.
                  </p>
                  <p>
                    So does that mean canvas fingerprinting doesn't work? Not quite. Here's the catch: when combined with other tracking methods (cookies, IP address, browser version, screen resolution, timezone, language settings, etc.), even a "common" canvas fingerprint becomes part of a unique profile. You might share a canvas fingerprint with 100,000 other MacBook Pro users, but how many of those are also in your city, using your ISP, with your exact browser plugins, visiting the same websites at the same time? Probably just you.
                  </p>
                  <p>
                    A 2022 technique called DrawnApart made things even worse. It can boost the tracking duration of individual fingerprints by 67% when combined with other fingerprinting methods. The research keeps getting more sophisticated.
                  </p>
                  <p>
                    A 2024 paper presented at the SECURWARE conference warns that newer technologies like WebGPU (the successor to WebGL) promise even greater privacy risks due to closer hardware access. The cat-and-mouse game between privacy and surveillance continues to escalate.
                  </p>
                </div>
              </div>

              {/* Related Reading */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Want to Dive Deeper?
                </h3>
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    This is just scratching the surface. Our comprehensive guide on canvas fingerprinting goes into the technical details, shows you exactly how the technique works under the hood, and explains multiple ways to protect yourself.
                  </p>
                  <a
                    href="/learn/canvas-fingerprinting"
                    className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                  >
                    Read the complete Canvas Fingerprinting guide
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                  <p className="text-sm text-text-muted mt-4">
                    Research sources: Eckersley (2010), Mowery & Shacham (2012), Princeton & KU Leuven (2014), Laperdrix et al. (2016), "Hiding in the Crowd" (ACM), DrawnApart (2022), Multilogin (2025), SECURWARE (2024), Tor Project Documentation
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Test Again Button */}
          <div className="mt-8 text-center">
            <button
              onClick={runTest}
              disabled={isLoading}
              className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Again'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
