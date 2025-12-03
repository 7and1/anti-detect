'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface FontResult {
  detectedFonts: string[];
  totalTested: number;
  detectionRate: number;
  osIndicators: {
    windows: number;
    macos: number;
    linux: number;
  };
  predictedOS: string;
  hash: string;
  uniqueness: 'common' | 'uncommon' | 'rare';
}

// Comprehensive font list for testing
const TEST_FONTS = [
  // Windows fonts
  'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Candara', 'Comic Sans MS',
  'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Georgia', 'Impact',
  'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
  'Segoe UI', 'Segoe UI Symbol', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
  'Verdana', 'Webdings', 'Wingdings',

  // macOS fonts
  'American Typewriter', 'Apple Chancery', 'Apple SD Gothic Neo', 'AppleGothic',
  'Avenir', 'Avenir Next', 'Baskerville', 'Big Caslon', 'Brush Script MT',
  'Chalkboard', 'Chalkduster', 'Cochin', 'Copperplate', 'Futura', 'Geneva',
  'Gill Sans', 'Helvetica', 'Helvetica Neue', 'Herculanum', 'Hoefler Text',
  'Lucida Grande', 'Marker Felt', 'Menlo', 'Monaco', 'Noteworthy', 'Optima',
  'Papyrus', 'Phosphate', 'PT Sans', 'PT Serif', 'San Francisco', 'Skia',
  'Snell Roundhand', 'STHeiti', 'Zapfino',

  // Linux fonts
  'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif', 'Droid Sans', 'Droid Sans Mono',
  'Droid Serif', 'FreeMono', 'FreeSans', 'FreeSerif', 'Liberation Mono',
  'Liberation Sans', 'Liberation Serif', 'Noto Sans', 'Noto Serif', 'Ubuntu',
  'Ubuntu Mono',

  // Common web fonts
  'Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Source Sans Pro', 'Oswald',
  'Raleway', 'Merriweather', 'Nunito', 'Poppins', 'Playfair Display', 'Inter',
];

// OS-specific font indicators
const OS_FONTS = {
  windows: [
    'Segoe UI', 'Calibri', 'Cambria', 'Consolas', 'Constantia', 'Corbel',
    'Microsoft Sans Serif', 'Segoe UI Symbol', 'Webdings', 'Wingdings',
  ],
  macos: [
    'Helvetica Neue', 'Lucida Grande', 'Menlo', 'Monaco', 'San Francisco',
    'Avenir', 'Avenir Next', 'Futura', 'Geneva', 'Gill Sans', 'Optima',
  ],
  linux: [
    'DejaVu Sans', 'DejaVu Sans Mono', 'Liberation Sans', 'Liberation Mono',
    'Ubuntu', 'Ubuntu Mono', 'Noto Sans', 'FreeSans', 'Droid Sans',
  ],
};

export default function FontsPage() {
  const [result, setResult] = useState<FontResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const runTest = useCallback(async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      const detectedFonts: string[] = [];
      const testDiv = document.createElement('div');
      testDiv.style.position = 'absolute';
      testDiv.style.left = '-9999px';
      testDiv.style.fontSize = '72px';
      document.body.appendChild(testDiv);

      // Base fonts for comparison
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const baseWidths: Record<string, number> = {};

      // Get base widths
      for (const base of baseFonts) {
        testDiv.style.fontFamily = base;
        testDiv.textContent = 'mmmmmmmmmmlli';
        baseWidths[base] = testDiv.offsetWidth;
      }

      // Test each font
      for (let i = 0; i < TEST_FONTS.length; i++) {
        const font = TEST_FONTS[i];
        let detected = false;

        for (const base of baseFonts) {
          testDiv.style.fontFamily = `'${font}', ${base}`;
          testDiv.textContent = 'mmmmmmmmmmlli';

          if (testDiv.offsetWidth !== baseWidths[base]) {
            detected = true;
            break;
          }
        }

        if (detected) {
          detectedFonts.push(font);
        }

        // Update progress
        if (i % 10 === 0) {
          setProgress(Math.round((i / TEST_FONTS.length) * 100));
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      document.body.removeChild(testDiv);

      // Calculate OS indicators
      const osIndicators = {
        windows: OS_FONTS.windows.filter(f => detectedFonts.includes(f)).length,
        macos: OS_FONTS.macos.filter(f => detectedFonts.includes(f)).length,
        linux: OS_FONTS.linux.filter(f => detectedFonts.includes(f)).length,
      };

      // Predict OS based on font indicators
      let predictedOS = 'Unknown';
      const maxScore = Math.max(osIndicators.windows, osIndicators.macos, osIndicators.linux);
      if (maxScore > 0) {
        if (osIndicators.windows === maxScore) predictedOS = 'Windows';
        else if (osIndicators.macos === maxScore) predictedOS = 'macOS';
        else if (osIndicators.linux === maxScore) predictedOS = 'Linux';
      }

      // Generate hash
      const hash = await hashFonts(detectedFonts);

      // Determine uniqueness
      const detectionRate = (detectedFonts.length / TEST_FONTS.length) * 100;
      let uniqueness: 'common' | 'uncommon' | 'rare' = 'common';
      if (detectedFonts.length > 60) uniqueness = 'rare';
      else if (detectedFonts.length > 40) uniqueness = 'uncommon';

      setResult({
        detectedFonts,
        totalTested: TEST_FONTS.length,
        detectionRate,
        osIndicators,
        predictedOS,
        hash,
        uniqueness,
      });
    } catch (err) {
      console.error('Font detection failed:', err);
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  }, []);

  const hashFonts = async (fonts: string[]): Promise<string> => {
    const data = fonts.sort().join(',');
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    runTest();
  }, [runTest]);

  const getUniquenessColor = (uniqueness: string) => {
    switch (uniqueness) {
      case 'rare': return 'text-error';
      case 'uncommon': return 'text-warning';
      default: return 'text-success';
    }
  };

  const getUniquenessLabel = (uniqueness: string) => {
    switch (uniqueness) {
      case 'rare': return 'Highly Unique (Easy to Track)';
      case 'uncommon': return 'Somewhat Unique';
      default: return 'Common (Harder to Track)';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Font <span className="gradient-text">Fingerprint Test</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Your installed fonts create a unique fingerprint. The combination of fonts
              reveals your operating system and can be used for tracking.
            </p>
          </div>

          {/* Progress or Results */}
          {isLoading ? (
            <div className="p-8 rounded-lg bg-bg-secondary border border-border mb-8">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Detecting Fonts...
                </h3>
                <div className="w-full bg-bg-primary rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-accent to-success transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-text-muted text-sm">
                  Testing {TEST_FONTS.length} fonts...
                </p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Summary Card */}
              <div className="p-8 rounded-lg bg-bg-secondary border border-border mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-bold text-accent mb-2">
                      {result.detectedFonts.length}
                    </div>
                    <div className="text-text-muted">Fonts Detected</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-terminal mb-2">
                      {result.predictedOS}
                    </div>
                    <div className="text-text-muted">Predicted OS</div>
                  </div>
                  <div>
                    <div className={`text-4xl font-bold ${getUniquenessColor(result.uniqueness)} mb-2`}>
                      {result.uniqueness.charAt(0).toUpperCase() + result.uniqueness.slice(1)}
                    </div>
                    <div className="text-text-muted">Uniqueness</div>
                  </div>
                </div>
              </div>

              {/* Uniqueness Warning */}
              <div
                className={`p-6 rounded-lg border mb-8 ${
                  result.uniqueness === 'rare'
                    ? 'border-error/50 bg-error/10'
                    : result.uniqueness === 'uncommon'
                    ? 'border-warning/50 bg-warning/10'
                    : 'border-success/50 bg-success/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-4xl ${getUniquenessColor(result.uniqueness)}`}>
                    {result.uniqueness === 'rare' ? '⚠️' : result.uniqueness === 'uncommon' ? '⚡' : '✓'}
                  </span>
                  <div>
                    <h3 className={`text-lg font-semibold ${getUniquenessColor(result.uniqueness)}`}>
                      {getUniquenessLabel(result.uniqueness)}
                    </h3>
                    <p className="text-text-secondary mt-1">
                      {result.uniqueness === 'rare'
                        ? `With ${result.detectedFonts.length} fonts detected, your browser has a very distinctive fingerprint that makes you easy to track.`
                        : result.uniqueness === 'uncommon'
                        ? 'Your font combination is somewhat unusual, which may help identify you across websites.'
                        : 'Your font fingerprint is relatively common, making you harder to uniquely identify.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Font Hash */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Font Fingerprint Hash</h3>
                <div className="font-mono text-sm text-terminal bg-bg-primary p-4 rounded break-all">
                  {result.hash}
                </div>
              </div>

              {/* OS Detection */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">OS Detection Analysis</h3>
                <div className="space-y-4">
                  {(['windows', 'macos', 'linux'] as const).map((os) => {
                    const score = result.osIndicators[os];
                    const maxPossible = OS_FONTS[os].length;
                    const percentage = (score / maxPossible) * 100;
                    const isPredicted = result.predictedOS.toLowerCase() === os.toLowerCase() ||
                      (result.predictedOS === 'macOS' && os === 'macos');

                    return (
                      <div key={os}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-text-primary capitalize flex items-center gap-2">
                            {os === 'windows' && '🪟'}
                            {os === 'macos' && '🍎'}
                            {os === 'linux' && '🐧'}
                            {os === 'macos' ? 'macOS' : os.charAt(0).toUpperCase() + os.slice(1)}
                            {isPredicted && (
                              <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded">
                                Detected
                              </span>
                            )}
                          </span>
                          <span className="text-text-muted">
                            {score}/{maxPossible} fonts
                          </span>
                        </div>
                        <div className="w-full bg-bg-primary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isPredicted ? 'bg-success' : 'bg-border'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detected Fonts List */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Detected Fonts ({result.detectedFonts.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                  {result.detectedFonts.map((font, i) => {
                    const isWindowsFont = OS_FONTS.windows.includes(font);
                    const isMacFont = OS_FONTS.macos.includes(font);
                    const isLinuxFont = OS_FONTS.linux.includes(font);

                    return (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded text-sm ${
                          isWindowsFont
                            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                            : isMacFont
                            ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                            : isLinuxFont
                            ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                            : 'bg-bg-primary border border-border text-text-secondary'
                        }`}
                        style={{ fontFamily: `'${font}', sans-serif` }}
                      >
                        {font}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-500/30 rounded" /> Windows
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-500/30 rounded" /> macOS
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-orange-500/30 rounded" /> Linux
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-bg-primary border border-border rounded" /> Common
                  </span>
                </div>
              </div>

              {/* How It Works */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  How Font Fingerprinting Works
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Font fingerprinting detects which fonts are installed on your system by measuring
                    how text renders:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Each font has unique character widths and heights
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      If a font isn't installed, the browser falls back to a default
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      By comparing rendered text dimensions, we detect installed fonts
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Operating systems come with different default fonts
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Custom fonts from apps (Adobe, Microsoft Office) add uniqueness
                    </li>
                  </ul>
                </div>
              </div>

              {/* Protection Tips */}
              {result.uniqueness !== 'common' && (
                <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                  <h3 className="text-lg font-semibold text-warning mb-4">
                    Reduce Your Font Fingerprint
                  </h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-warning">1.</span>
                      <span>Use Firefox with `privacy.resistFingerprinting` enabled</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">2.</span>
                      <span>Use Tor Browser which limits exposed fonts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">3.</span>
                      <span>Remove unnecessary custom fonts from your system</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">4.</span>
                      <span>Use an anti-detect browser with font spoofing</span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-4 border-t border-warning/30">
                    <a
                      href="https://mutilogin.com/?ref=antidetect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-success text-bg-primary font-semibold rounded-lg"
                    >
                      Get Font Protection with Mutilogin
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Educational Content */}
          <div className="mt-16 space-y-8 text-text-secondary">
            <h2 className="text-3xl font-bold text-text-primary">
              Understanding Font Fingerprinting
            </h2>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                What Is Font Fingerprinting?
              </h3>
              <p className="leading-relaxed">
                Imagine if someone could tell exactly which books are on your bookshelf just by asking you to read a sentence aloud. That's essentially what font fingerprinting does with your computer. Every time you install software—Adobe Creative Suite, Microsoft Office, AutoCAD, or even that random free font you downloaded for a school project—it adds fonts to your system. The specific combination of fonts installed on your computer is almost as unique as your fingerprint.
              </p>
              <p className="leading-relaxed">
                Here's why this matters: websites can detect which fonts you have without asking your permission. They don't see a list saying "Arial, Calibri, Helvetica"—instead, they use a clever trick. They render invisible text in different fonts and measure how wide each character is. If the width matches what that font should be, bingo—you have it installed. Do this for 100+ fonts, and you've created a unique identifier.
              </p>
              <p className="leading-relaxed">
                The research goes back to 2012 when Boda and colleagues designed the first browser-independent fingerprinting algorithm that relied mainly on fonts, timezone, and screen resolution. But it really exploded in 2015 with a study titled "Fingerprinting Web Users Through Font Metrics" published in Springer. The researchers found that font metrics alone uniquely identified <strong>34% of over 1,000 participants</strong>, and for everyone else, it significantly narrowed down their anonymity set. The scary part? The test only took milliseconds and required checking just <strong>43 specific glyphs</strong> out of over 125,000 possible characters to capture all the variation.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Flash Era: When Font Tracking Was Trivial
              </h3>
              <p className="leading-relaxed">
                In the early days of the web, tracking fonts was absurdly easy. Adobe Flash Player would, by default, create a complete list of all installed fonts and expose it to websites through ActionScript. Third-party libraries could grab this list and upload it to a server in milliseconds. It was a privacy nightmare, but nobody really understood the implications at the time. If you had Adobe Creative Suite installed, websites knew it. If you had Korean or Arabic fonts from specialized software, they knew it.
              </p>
              <p className="leading-relaxed">
                When browsers finally killed Flash (Safari in 2016, Chrome and Firefox by 2020), tracking companies had to get creative. They couldn't just ask for a font list anymore—they had to <em>infer</em> it. That's where font metrics measurement came in. Modern font fingerprinting is a brute force approach: try different fonts from a large dictionary of known typefaces, render some text, and measure the dimensions. If the dimensions differ from the default fallback font, that custom font exists on your system.
              </p>
              <p className="leading-relaxed">
                Here's the technical process: a website creates an invisible div, sets the font to something generic like "monospace," renders a test string (often something with varied character widths like "mmmmmmmmmmlli"), and measures the width in pixels. Then it changes the font to "'Helvetica Neue', monospace" and measures again. If the width changed, you have Helvetica Neue installed. Repeat this 200+ times, and you've got a complete font profile in under a second.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                How Unique Are Font Fingerprints Really?
              </h3>
              <p className="leading-relaxed">
                The uniqueness of font fingerprints has been studied extensively. Peter Eckersley's groundbreaking 2010 study at the Electronic Frontier Foundation gathered over 470,000 fingerprints and found that fonts contributed <strong>13.9 bits of entropy</strong>—making them the second most identifying attribute after browser plugins (which contributed 15.4 bits). In that study, <strong>83.6% of collected fingerprints were unique</strong>, and fonts played a major role.
              </p>
              <p className="leading-relaxed">
                Fast forward to 2016, and the AmIUnique project analyzed 118,934 fingerprints. They confirmed that <strong>89.4% of collected fingerprints were unique</strong>, with fonts remaining one of the top contributors to uniqueness. But here's where it gets interesting: the uniqueness varies dramatically by platform. Recent analysis shows that <strong>74% of desktop devices</strong> can be uniquely identified, but only <strong>45% of mobile devices</strong> meet the same threshold. Even more striking: only <strong>33% of iPhones could be uniquely identified</strong>, with another 33% of iPhones being nearly impossible to track because 20 or more devices shared the exact same fingerprint.
              </p>
              <p className="leading-relaxed">
                Why the difference? Desktop users install software that comes bundled with fonts—Adobe products add dozens of fonts, Microsoft Office adds several, design tools add even more. Mobile devices, especially iPhones, come with a fixed set of system fonts and don't let users (or apps) easily install custom fonts. An iPhone 13 running iOS 16 has almost identical fonts to millions of other iPhone 13s running iOS 16. But a Windows 10 laptop used by a graphic designer might have 400+ fonts, creating a fingerprint that's one in a million.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                OS Detection Through Fonts: The Dead Giveaway
              </h3>
              <p className="leading-relaxed">
                Operating systems ship with signature font collections, making OS detection through fonts incredibly reliable. Windows includes Segoe UI, Calibri, Cambria, and Consolas. macOS ships with Helvetica Neue, San Francisco, Avenir, and Lucida Grande. Linux distributions typically include DejaVu Sans, Liberation fonts, and Ubuntu fonts. If a website detects you have Segoe UI and Calibri but no Helvetica Neue, you're running Windows. It's that simple.
              </p>
              <p className="leading-relaxed">
                But it goes deeper than just identifying Windows vs. Mac. Different versions of Windows include different fonts. Windows Vista introduced Calibri and Cambria. Windows 7 added Segoe UI. Windows 10 refined Segoe UI further and added Segoe UI Symbol. If you have Calibri but not Segoe UI Symbol, you're likely running Windows 7 or 8. This lets trackers not just identify your OS, but narrow down the version—sometimes to the specific update.
              </p>
              <p className="leading-relaxed">
                For macOS, the situation is similar. San Francisco font was introduced in macOS El Capitan (2015) and became the system font in macOS Big Sur (2020). If you have San Francisco but your other fingerprints suggest an older Mac, there's an inconsistency that security systems flag. These version-specific fonts become telltale signs of spoofing attempts—if your User-Agent says "Windows 11" but you're missing fonts that Windows 11 introduced, automated detection systems will catch you.
              </p>
            </div>

            {/* Statistics Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-bg-secondary rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-bg-primary">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Font Fingerprinting Research Findings
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Result
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Font Metrics Unique Identification Rate</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">34% of 1,000+ users</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://link.springer.com/chapter/10.1007/978-3-662-47854-7_7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Springer 2015
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Glyphs Required for Full Variation</td>
                    <td className="px-4 py-3 text-sm">43 out of 125,000+</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.bamsoftware.com/papers/fontfp.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Font Fingerprinting Study
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Font Entropy Contribution (2010)</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">13.9 bits (2nd highest)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.eff.org/deeplinks/2010/01/primer-information-theory-and-privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Eckersley EFF 2010
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Unique Fingerprints (Panopticlick)</td>
                    <td className="px-4 py-3 text-sm">83.6% of 470k samples</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://coveryourtracks.eff.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        EFF Panopticlick
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">AmIUnique Fingerprint Uniqueness</td>
                    <td className="px-4 py-3 text-sm">89.4% of 118,934 samples</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://amiunique.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        AmIUnique 2016
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Desktop vs Mobile Unique Identification</td>
                    <td className="px-4 py-3 text-sm">74% vs 45%</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://arxiv.org/pdf/2411.12045"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        arXiv 2024
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">iPhone Unique Identification Rate</td>
                    <td className="px-4 py-3 text-sm">33% uniquely trackable</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://medium.com/slido-dev-blog/we-collected-500-000-browser-fingerprints-here-is-what-we-found-82c319464dc9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Slido 500k Analysis
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Professional Software Problem
              </h3>
              <p className="leading-relaxed">
                Installing professional software on your computer is like hanging a neon sign that says "I do graphic design" or "I'm a video editor." Adobe Creative Cloud installs dozens of fonts: Myriad Pro, Minion Pro, Adobe Garamond, Kozuka Gothic, and many more. If a website detects these, they know you have Adobe products. Microsoft Office adds Calibri, Cambria, Candara, Consolas, and Constantia. AutoCAD adds its own fonts. Even specialized language packs add region-specific fonts.
              </p>
              <p className="leading-relaxed">
                According to the Springer study on font fingerprinting, installing even <strong>one unusual font</strong> can be a highly identifying metric. Think about it: if 99% of users don't have "Papyrus" installed but you do (maybe from some old software), that immediately puts you in the 1%. Add five more unusual fonts, and you might be one in ten thousand. This is why researchers found that font whitelisting—limiting browsers to only report a standard set of fonts—could <strong>reduce unique fingerprints below 10%</strong> and more than quadruple anonymity set sizes on average.
              </p>
              <p className="leading-relaxed">
                For automation and web scraping, this becomes a critical problem. If you're trying to look like a regular consumer browsing from a home computer, but your font list reveals Adobe Creative Suite, Microsoft Visual Studio, and specialized database management software, that doesn't match the profile. Sophisticated detection systems build user profiles based on expected font combinations. A grandmother browsing shopping sites shouldn't have developer tools installed. An office worker probably has Microsoft Office fonts but not Adobe design suite fonts.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Modern Defense: Browser Fingerprinting Resistance
              </h3>
              <p className="leading-relaxed">
                Modern browsers have started fighting back. Firefox's <code className="text-terminal bg-bg-primary px-1 py-0.5 rounded">privacy.resistFingerprinting</code> setting limits the fonts exposed to websites, reporting only a small set of common fonts regardless of what's actually installed. Tor Browser takes this even further, reporting an identical font list for all Tor users. The W3C (World Wide Web Consortium) has been discussing "Fonts, Privacy, and Not Breaking the Web" since at least 2024, trying to find a balance between legitimate use cases and privacy protection.
              </p>
              <p className="leading-relaxed">
                But these protections come with trade-offs. If a website needs to render Japanese text and your browser claims not to support any Japanese fonts (even though you actually have them), the site breaks. If a web-based design tool needs to show you what your document will look like in "Times New Roman" vs "Georgia," and your browser lies about font availability, the tool doesn't work. This is the fundamental tension in privacy protection: every defense mechanism potentially breaks legitimate functionality.
              </p>
              <p className="leading-relaxed">
                For anti-detect browsers and privacy tools, the approach is different. Instead of blocking font detection, they <em>spoof</em> it—returning a fake but realistic font list that matches the profile you're trying to emulate. If you're pretending to be a Windows 10 home user, the browser reports the standard Windows 10 fonts and nothing else. If you're simulating a MacBook Pro, it reports macOS Big Sur fonts. The key is consistency: your font list must match your User-Agent, your screen resolution, your timezone, and every other fingerprint attribute (see our <a href="/tools/canvas" className="text-accent hover:underline">Canvas Test</a> and <a href="/tools/webgl" className="text-accent hover:underline">WebGL Test</a> for related tracking methods).
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Practical Protection Strategies
              </h3>
              <p className="leading-relaxed">
                If you're concerned about font fingerprinting tracking you across the web, here's what actually works. First, understand that you can't just "uninstall fonts" on most systems—many are required by the OS or applications. But you <em>can</em> avoid installing unnecessary fonts. That free font pack you were thinking of downloading? It makes you more unique. That specialized software with 50 custom fonts? Consider if you really need it.
              </p>
              <p className="leading-relaxed">
                For general privacy, Firefox with resistFingerprinting enabled is your best bet. It breaks some websites, but if privacy is your priority, that's the trade-off. Tor Browser offers even stronger protection but with more breakage. Both approaches work on the principle of "safety in numbers"—if millions of users have the same fingerprint, you're anonymous within that crowd.
              </p>
              <p className="leading-relaxed">
                For automation, web scraping, or multi-accounting where you need to appear as a unique organic user, anti-detect browsers are essential. They maintain profile databases with realistic font combinations for different scenarios. A "US home user on Windows 10" profile includes the fonts that profile would actually have—nothing more, nothing less. The browser intercepts font detection attempts and returns the profile's font list, ensuring consistency with all other fingerprint elements.
              </p>
              <p className="leading-relaxed">
                Browser extensions claiming to "block font fingerprinting" often don't work well because they can't perfectly spoof the font rendering measurements. If an extension claims you don't have Arial installed but the browser still renders Arial correctly (with the correct character widths), sophisticated fingerprinting scripts will detect the inconsistency and flag you as suspicious.
              </p>
              <p className="leading-relaxed">
                Want to dive deeper into browser fingerprinting protection? Check our comprehensive guide on <a href="/learn/font-fingerprinting" className="text-accent hover:underline">Font Fingerprinting Defense Strategies</a> and explore how fonts combine with <a href="/tools/audio" className="text-accent hover:underline">Audio Fingerprinting</a> and <a href="/tools/headers" className="text-accent hover:underline">HTTP Headers</a> to create a complete digital fingerprint that follows you across the web.
              </p>
            </div>
          </div>

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
