'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface HeaderInfo {
  name: string;
  value: string;
  category: 'request' | 'client-hints' | 'security' | 'other';
  risk: 'low' | 'medium' | 'high' | 'info';
  description: string;
}

interface HeadersResult {
  headers: HeaderInfo[];
  clientHintsSupported: boolean;
  securityScore: number;
  fingerprintRisk: 'low' | 'medium' | 'high';
  userAgent: string;
  acceptLanguage: string;
  doNotTrack: string | null;
  secFetchHeaders: {
    dest: string | null;
    mode: string | null;
    site: string | null;
    user: string | null;
  };
}

// Common headers that reveal fingerprinting info
const TRACKED_HEADERS = [
  'user-agent',
  'accept',
  'accept-language',
  'accept-encoding',
  'connection',
  'cache-control',
  'pragma',
  'dnt',
  'upgrade-insecure-requests',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
  'sec-fetch-user',
  'sec-ch-ua',
  'sec-ch-ua-mobile',
  'sec-ch-ua-platform',
  'sec-ch-ua-platform-version',
  'sec-ch-ua-arch',
  'sec-ch-ua-bitness',
  'sec-ch-ua-model',
  'sec-ch-ua-full-version-list',
];

export default function HeadersPage() {
  const [result, setResult] = useState<HeadersResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<Record<string, string>>({});

  const analyzeHeaders = useCallback(async () => {
    setIsLoading(true);

    try {
      // Call our API to get the headers as seen by the server
      const response = await fetch('/api/headers', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch headers');
      }

      const data = await response.json();
      setRawHeaders(data.headers || {});

      // Analyze the headers
      const headers: HeaderInfo[] = [];
      const receivedHeaders = data.headers || {};

      // User-Agent analysis
      const userAgent = receivedHeaders['user-agent'] || navigator.userAgent;
      headers.push({
        name: 'User-Agent',
        value: userAgent,
        category: 'request',
        risk: 'high',
        description: 'Identifies your browser, OS, and device. Highly unique and commonly used for tracking.',
      });

      // Accept-Language analysis
      const acceptLanguage = receivedHeaders['accept-language'] || navigator.language;
      headers.push({
        name: 'Accept-Language',
        value: acceptLanguage,
        category: 'request',
        risk: 'medium',
        description: 'Reveals your language preferences and locale, narrowing down your identity.',
      });

      // Accept header
      if (receivedHeaders['accept']) {
        headers.push({
          name: 'Accept',
          value: receivedHeaders['accept'],
          category: 'request',
          risk: 'low',
          description: 'Content types your browser accepts. Varies slightly between browsers.',
        });
      }

      // Accept-Encoding
      if (receivedHeaders['accept-encoding']) {
        headers.push({
          name: 'Accept-Encoding',
          value: receivedHeaders['accept-encoding'],
          category: 'request',
          risk: 'low',
          description: 'Compression algorithms supported. Can help identify browser type.',
        });
      }

      // DNT (Do Not Track)
      const dnt = receivedHeaders['dnt'] || null;
      if (dnt !== null) {
        headers.push({
          name: 'DNT (Do Not Track)',
          value: dnt,
          category: 'security',
          risk: dnt === '1' ? 'medium' : 'info',
          description: dnt === '1'
            ? 'Enabled - Ironically, enabling DNT can make you more trackable as fewer users enable it.'
            : 'Not set or disabled.',
        });
      }

      // Sec-Fetch headers
      const secFetchDest = receivedHeaders['sec-fetch-dest'];
      const secFetchMode = receivedHeaders['sec-fetch-mode'];
      const secFetchSite = receivedHeaders['sec-fetch-site'];
      const secFetchUser = receivedHeaders['sec-fetch-user'];

      if (secFetchDest) {
        headers.push({
          name: 'Sec-Fetch-Dest',
          value: secFetchDest,
          category: 'security',
          risk: 'info',
          description: 'Indicates the request destination type. Part of Fetch Metadata security headers.',
        });
      }

      if (secFetchMode) {
        headers.push({
          name: 'Sec-Fetch-Mode',
          value: secFetchMode,
          category: 'security',
          risk: 'info',
          description: 'Indicates the request mode (cors, navigate, no-cors, etc).',
        });
      }

      if (secFetchSite) {
        headers.push({
          name: 'Sec-Fetch-Site',
          value: secFetchSite,
          category: 'security',
          risk: 'info',
          description: 'Indicates the relationship between request origin and target.',
        });
      }

      // Client Hints
      const clientHintsSupported = !!(
        receivedHeaders['sec-ch-ua'] ||
        receivedHeaders['sec-ch-ua-mobile'] ||
        receivedHeaders['sec-ch-ua-platform']
      );

      if (receivedHeaders['sec-ch-ua']) {
        headers.push({
          name: 'Sec-CH-UA',
          value: receivedHeaders['sec-ch-ua'],
          category: 'client-hints',
          risk: 'medium',
          description: 'Client Hints: Browser brand and version info. More structured than User-Agent.',
        });
      }

      if (receivedHeaders['sec-ch-ua-mobile']) {
        headers.push({
          name: 'Sec-CH-UA-Mobile',
          value: receivedHeaders['sec-ch-ua-mobile'],
          category: 'client-hints',
          risk: 'low',
          description: 'Client Hints: Indicates if browser is on a mobile device.',
        });
      }

      if (receivedHeaders['sec-ch-ua-platform']) {
        headers.push({
          name: 'Sec-CH-UA-Platform',
          value: receivedHeaders['sec-ch-ua-platform'],
          category: 'client-hints',
          risk: 'medium',
          description: 'Client Hints: Operating system platform.',
        });
      }

      if (receivedHeaders['sec-ch-ua-platform-version']) {
        headers.push({
          name: 'Sec-CH-UA-Platform-Version',
          value: receivedHeaders['sec-ch-ua-platform-version'],
          category: 'client-hints',
          risk: 'high',
          description: 'Client Hints: Detailed OS version - highly identifying.',
        });
      }

      if (receivedHeaders['sec-ch-ua-arch']) {
        headers.push({
          name: 'Sec-CH-UA-Arch',
          value: receivedHeaders['sec-ch-ua-arch'],
          category: 'client-hints',
          risk: 'medium',
          description: 'Client Hints: CPU architecture (x86, arm, etc).',
        });
      }

      if (receivedHeaders['sec-ch-ua-bitness']) {
        headers.push({
          name: 'Sec-CH-UA-Bitness',
          value: receivedHeaders['sec-ch-ua-bitness'],
          category: 'client-hints',
          risk: 'low',
          description: 'Client Hints: CPU bitness (32 or 64 bit).',
        });
      }

      // Calculate fingerprint risk
      const highRiskCount = headers.filter(h => h.risk === 'high').length;
      const mediumRiskCount = headers.filter(h => h.risk === 'medium').length;

      let fingerprintRisk: 'low' | 'medium' | 'high' = 'low';
      if (highRiskCount >= 2 || (highRiskCount >= 1 && mediumRiskCount >= 3)) {
        fingerprintRisk = 'high';
      } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
        fingerprintRisk = 'medium';
      }

      // Calculate security score (0-100)
      let securityScore = 100;
      securityScore -= highRiskCount * 15;
      securityScore -= mediumRiskCount * 8;
      if (!dnt || dnt !== '1') securityScore -= 5;
      if (clientHintsSupported) securityScore -= 10;
      securityScore = Math.max(0, Math.min(100, securityScore));

      setResult({
        headers,
        clientHintsSupported,
        securityScore,
        fingerprintRisk,
        userAgent,
        acceptLanguage,
        doNotTrack: dnt,
        secFetchHeaders: {
          dest: secFetchDest || null,
          mode: secFetchMode || null,
          site: secFetchSite || null,
          user: secFetchUser || null,
        },
      });
    } catch (err) {
      console.error('Header analysis failed:', err);
      // Fallback to client-side detection
      fallbackAnalysis();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fallbackAnalysis = () => {
    const headers: HeaderInfo[] = [];

    // User-Agent from navigator
    headers.push({
      name: 'User-Agent',
      value: navigator.userAgent,
      category: 'request',
      risk: 'high',
      description: 'Identifies your browser, OS, and device. Highly unique and commonly used for tracking.',
    });

    // Language
    headers.push({
      name: 'Accept-Language',
      value: navigator.languages?.join(', ') || navigator.language,
      category: 'request',
      risk: 'medium',
      description: 'Reveals your language preferences and locale.',
    });

    // DNT
    const dnt = navigator.doNotTrack;
    headers.push({
      name: 'DNT (Do Not Track)',
      value: dnt || 'not set',
      category: 'security',
      risk: dnt === '1' ? 'medium' : 'info',
      description: dnt === '1'
        ? 'Enabled - Ironically, enabling DNT can make you more trackable.'
        : 'Not set or disabled.',
    });

    // Check for userAgentData (Client Hints API)
    const uaData = (navigator as any).userAgentData;
    const clientHintsSupported = !!uaData;

    if (uaData) {
      headers.push({
        name: 'Sec-CH-UA (via JS)',
        value: uaData.brands?.map((b: any) => `"${b.brand}";v="${b.version}"`).join(', ') || 'N/A',
        category: 'client-hints',
        risk: 'medium',
        description: 'Client Hints detected via JavaScript API.',
      });

      headers.push({
        name: 'Sec-CH-UA-Mobile (via JS)',
        value: uaData.mobile ? '?1' : '?0',
        category: 'client-hints',
        risk: 'low',
        description: 'Mobile device detection via Client Hints.',
      });

      headers.push({
        name: 'Sec-CH-UA-Platform (via JS)',
        value: uaData.platform || 'Unknown',
        category: 'client-hints',
        risk: 'medium',
        description: 'Platform detection via Client Hints.',
      });
    }

    const highRiskCount = headers.filter(h => h.risk === 'high').length;
    const mediumRiskCount = headers.filter(h => h.risk === 'medium').length;

    let fingerprintRisk: 'low' | 'medium' | 'high' = 'low';
    if (highRiskCount >= 2 || (highRiskCount >= 1 && mediumRiskCount >= 3)) {
      fingerprintRisk = 'high';
    } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
      fingerprintRisk = 'medium';
    }

    let securityScore = 100;
    securityScore -= highRiskCount * 15;
    securityScore -= mediumRiskCount * 8;
    securityScore = Math.max(0, Math.min(100, securityScore));

    setResult({
      headers,
      clientHintsSupported,
      securityScore,
      fingerprintRisk,
      userAgent: navigator.userAgent,
      acceptLanguage: navigator.languages?.join(', ') || navigator.language,
      doNotTrack: dnt,
      secFetchHeaders: {
        dest: null,
        mode: null,
        site: null,
        user: null,
      },
    });
  };

  useEffect(() => {
    analyzeHeaders();
  }, [analyzeHeaders]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-text-muted';
    }
  };

  const getRiskBg = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-error/10 border-error/30';
      case 'medium': return 'bg-warning/10 border-warning/30';
      case 'low': return 'bg-success/10 border-success/30';
      default: return 'bg-bg-tertiary border-border';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'request': return '📤';
      case 'client-hints': return '💡';
      case 'security': return '🔒';
      default: return '📋';
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
              HTTP <span className="gradient-text">Headers Analysis</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              HTTP headers reveal detailed information about your browser, operating system, and preferences.
              See exactly what data your browser sends with every request.
            </p>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <p className="text-text-secondary mt-4">Analyzing headers...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-lg border ${getRiskBg(result.fingerprintRisk)}`}>
                  <p className="text-sm text-text-muted mb-1">Fingerprint Risk</p>
                  <p className={`text-2xl font-bold capitalize ${getRiskColor(result.fingerprintRisk)}`}>
                    {result.fingerprintRisk}
                  </p>
                </div>
                <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                  <p className="text-sm text-text-muted mb-1">Privacy Score</p>
                  <p className={`text-2xl font-bold ${
                    result.securityScore >= 70 ? 'text-success' :
                    result.securityScore >= 40 ? 'text-warning' : 'text-error'
                  }`}>
                    {result.securityScore}/100
                  </p>
                </div>
                <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                  <p className="text-sm text-text-muted mb-1">Client Hints</p>
                  <p className={`text-2xl font-bold ${result.clientHintsSupported ? 'text-warning' : 'text-success'}`}>
                    {result.clientHintsSupported ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {/* User-Agent Breakdown */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">User-Agent Analysis</h3>
                <div className="p-4 rounded bg-bg-primary font-mono text-sm text-terminal break-all">
                  {result.userAgent}
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const ua = result.userAgent.toLowerCase();
                    const browser = ua.includes('chrome') ? 'Chrome' :
                                   ua.includes('firefox') ? 'Firefox' :
                                   ua.includes('safari') ? 'Safari' :
                                   ua.includes('edge') ? 'Edge' : 'Unknown';
                    const os = ua.includes('windows') ? 'Windows' :
                              ua.includes('mac') ? 'macOS' :
                              ua.includes('linux') ? 'Linux' :
                              ua.includes('android') ? 'Android' :
                              ua.includes('ios') ? 'iOS' : 'Unknown';
                    const mobile = ua.includes('mobile') || ua.includes('android');

                    return (
                      <>
                        <div className="p-3 rounded bg-bg-tertiary">
                          <p className="text-xs text-text-muted">Browser</p>
                          <p className="text-text-primary font-medium">{browser}</p>
                        </div>
                        <div className="p-3 rounded bg-bg-tertiary">
                          <p className="text-xs text-text-muted">OS</p>
                          <p className="text-text-primary font-medium">{os}</p>
                        </div>
                        <div className="p-3 rounded bg-bg-tertiary">
                          <p className="text-xs text-text-muted">Device Type</p>
                          <p className="text-text-primary font-medium">{mobile ? 'Mobile' : 'Desktop'}</p>
                        </div>
                        <div className="p-3 rounded bg-bg-tertiary">
                          <p className="text-xs text-text-muted">Language</p>
                          <p className="text-text-primary font-medium">{result.acceptLanguage.split(',')[0]}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Headers by Category */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Detected Headers</h3>
                <div className="space-y-3">
                  {result.headers.map((header, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getRiskBg(header.risk)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{getCategoryIcon(header.category)}</span>
                            <span className="font-medium text-text-primary">{header.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${getRiskColor(header.risk)} bg-bg-primary`}>
                              {header.risk} risk
                            </span>
                          </div>
                          <p className="font-mono text-sm text-terminal break-all mb-2">{header.value}</p>
                          <p className="text-sm text-text-muted">{header.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Hints Explanation */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  What are Client Hints?
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Client Hints (CH) are a newer alternative to the User-Agent header. Instead of sending
                    all browser information in one string, they split it into multiple headers that servers
                    can request individually.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded bg-bg-primary">
                      <h4 className="font-medium text-text-primary mb-2">Low Entropy (Default)</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Sec-CH-UA (browser brand)</li>
                        <li>• Sec-CH-UA-Mobile (mobile/desktop)</li>
                        <li>• Sec-CH-UA-Platform (OS family)</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded bg-bg-primary">
                      <h4 className="font-medium text-text-primary mb-2">High Entropy (On Request)</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Sec-CH-UA-Platform-Version</li>
                        <li>• Sec-CH-UA-Arch (CPU architecture)</li>
                        <li>• Sec-CH-UA-Model (device model)</li>
                        <li>• Sec-CH-UA-Full-Version-List</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Stats */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Header Fingerprinting Statistics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-text-muted text-sm">Header</th>
                        <th className="text-left py-2 text-text-muted text-sm">Entropy</th>
                        <th className="text-left py-2 text-text-muted text-sm">Uniqueness</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-secondary">
                      <tr className="border-b border-border/50">
                        <td className="py-2">User-Agent</td>
                        <td className="py-2 font-mono text-accent">~10-12 bits</td>
                        <td className="py-2 text-sm">1 in 1,000 - 4,000</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2">Accept-Language</td>
                        <td className="py-2 font-mono text-accent">~4-6 bits</td>
                        <td className="py-2 text-sm">1 in 16 - 64</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2">Accept</td>
                        <td className="py-2 font-mono text-accent">~2-3 bits</td>
                        <td className="py-2 text-sm">1 in 4 - 8</td>
                      </tr>
                      <tr>
                        <td className="py-2">DNT Header</td>
                        <td className="py-2 font-mono text-accent">~0.5 bits</td>
                        <td className="py-2 text-sm">~15% of users enable</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-text-muted mt-4">
                  Source: EFF Panopticlick Study, AmIUnique Database
                </p>
              </div>

              {/* Protection Tips */}
              <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                <h3 className="text-lg font-semibold text-warning mb-4">Protection Options</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <span className="text-warning">1.</span>
                    <span>
                      <strong>Tor Browser</strong> - Uses a standardized User-Agent shared by all Tor users
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">2.</span>
                    <span>
                      <strong>Firefox with privacy.resistFingerprinting</strong> - Normalizes headers to common values
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">3.</span>
                    <span>
                      <strong>Anti-detect browsers</strong> - Allow customizing all header values per profile
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">4.</span>
                    <span>
                      <strong>User-Agent switcher extensions</strong> - Basic protection, but can create inconsistencies
                    </span>
                  </li>
                </ul>
              </div>

              {/* Raw Headers Debug */}
              {Object.keys(rawHeaders).length > 0 && (
                <details className="p-6 rounded-lg bg-bg-secondary border border-border">
                  <summary className="cursor-pointer text-lg font-semibold text-text-primary">
                    Raw Headers (Debug View)
                  </summary>
                  <div className="mt-4 p-4 rounded bg-bg-primary font-mono text-sm overflow-x-auto">
                    {Object.entries(rawHeaders).map(([key, value]) => (
                      <div key={key} className="flex gap-2 py-1">
                        <span className="text-accent">{key}:</span>
                        <span className="text-text-secondary break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Educational Content */}
          <div className="mt-16 space-y-8 text-text-secondary">
            <h2 className="text-3xl font-bold text-text-primary">
              Understanding HTTP Headers Fingerprinting
            </h2>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                What Are HTTP Headers and Why They Matter
              </h3>
              <p className="leading-relaxed">
                Every time your browser requests a web page, it sends a package of metadata called HTTP headers. Think of these headers as the return address and delivery instructions on a letter—they tell the server who you are, what you can accept, and how to communicate with you. But here's the problem: these "delivery instructions" are so specific and unique that they inadvertently create a fingerprint that can track you across the entire internet.
              </p>
              <p className="leading-relaxed">
                The User-Agent header is the biggest culprit. Originally designed to help websites adapt their content to different browsers (showing a mobile layout for phones, desktop for computers), it reveals your browser name and version, operating system and version, device model, and even rendering engine details. A typical User-Agent might say: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"—which immediately narrows you down to users running Chrome 120 on 64-bit Windows 10.
              </p>
              <p className="leading-relaxed">
                According to research from the Electronic Frontier Foundation's Panopticlick study and the AmIUnique database, the User-Agent header alone contributes <strong>10-12 bits of entropy</strong>, meaning it can distinguish you from <strong>1 in 1,000 to 1 in 4,000 other users</strong>. But browsers don't just send User-Agent—they send Accept-Language (revealing your locale), Accept-Encoding (compression support), DNT (Do Not Track preference), and increasingly, Client Hints that break down browser information into even more granular pieces.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The User-Agent Reduction Initiative: Privacy Theater?
              </h3>
              <p className="leading-relaxed">
                Browser vendors finally acknowledged that User-Agent headers leak too much information. Google Chrome announced a "User-Agent Reduction" plan, gradually removing detailed version numbers and device information. Starting in 2022, Chrome on Android began reporting generic values like "Android 10" instead of specific device models. By 2023, the full rollout reduced User-Agent to minimally identifying information—or so they claimed.
              </p>
              <p className="leading-relaxed">
                But there's a catch. While Google reduced the User-Agent string, they simultaneously introduced <em>Client Hints</em>—a new set of headers that provide the same information, just split into multiple pieces. Instead of one User-Agent string, websites can now request Sec-CH-UA (browser brand), Sec-CH-UA-Platform (OS), Sec-CH-UA-Platform-Version (exact OS version), Sec-CH-UA-Arch (CPU architecture), Sec-CH-UA-Model (device model), and more. The W3C's "Mitigating Browser Fingerprinting in Web Specifications" guidance warns that these headers, when combined, provide <em>more</em> entropy than the original User-Agent.
              </p>
              <p className="leading-relaxed">
                Critics argue this is privacy theater—the illusion of privacy protection while maintaining (or increasing) tracking capabilities. Legitimate websites that need device information for responsive design get a cleaner API, but trackers get more granular data points to fingerprint users. According to 2024 research published in arXiv on "Fingerprinting and Tracing Shadows," Client Hints enable sophisticated tracking while bypassing GDPR and CCPA consent requirements because they're framed as "necessary browser functionality" rather than tracking mechanisms.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Language Header Paradox
              </h3>
              <p className="leading-relaxed">
                Accept-Language is particularly revealing because language preferences are geographically concentrated. If your Accept-Language header says "en-US,en;q=0.9," you're probably in the United States. But if it says "en-GB,cy;q=0.8,en;q=0.7," you're likely in Wales (English + Welsh). According to the AmIUnique database, Accept-Language contributes <strong>4-6 bits of entropy</strong>, narrowing you down to <strong>1 in 16 to 1 in 64 users</strong>.
              </p>
              <p className="leading-relaxed">
                The entropy increases dramatically when you consider language order and weighting. Someone with "es-MX,es;q=0.9,en;q=0.8" (Mexican Spanish primary, general Spanish secondary, English tertiary) is <em>much</em> rarer than someone with just "en-US." If you've customized your language preferences—maybe you speak three languages and ordered them by proficiency—your Accept-Language header might be unique among millions of users.
              </p>
              <p className="leading-relaxed">
                Worse, Accept-Language correlates with timezone, IP geolocation, and content preferences. If your headers say you prefer French but your IP address is in Japan, that's highly unusual. Sophisticated tracking systems flag these inconsistencies. For web scraping and automation, getting the Accept-Language right for your target market is crucial—if you're pretending to be a US user, your headers better say "en-US," not "zh-CN" (Chinese).
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Do Not Track Irony
              </h3>
              <p className="leading-relaxed">
                Here's one of the internet's cruelest ironies: enabling "Do Not Track" (DNT) can actually make you <em>more</em> trackable. DNT is a header that signals "DNT: 1" if you've enabled the setting in your browser. It's a polite request asking websites not to track you—but it's entirely voluntary. Most major websites ignore it. According to research, only about <strong>15% of users enable DNT</strong>, which means sending "DNT: 1" immediately puts you in a minority group.
              </p>
              <p className="leading-relaxed">
                Even worse, DNT contributes <strong>~0.5 bits of entropy</strong> to your fingerprint. It's a binary value (enabled or disabled), so it can't identify you alone, but combined with other headers, it narrows down possibilities. The Electronic Frontier Foundation, which pioneered privacy research, has repeatedly pointed out this paradox: privacy-conscious users who enable DNT become more identifiable through their privacy settings.
              </p>
              <p className="leading-relaxed">
                The situation got so absurd that Apple removed DNT support from Safari entirely, arguing it provided no privacy benefit while increasing fingerprinting surface. Mozilla (Firefox) kept it but warns users it doesn't do much. The lesson? Sometimes the best privacy strategy is to <em>not</em> use privacy features that make you stand out from the crowd.
              </p>
            </div>

            {/* Statistics Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-bg-secondary rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-bg-primary">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      HTTP Headers Research Findings
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
                    <td className="px-4 py-3 text-sm">User-Agent Entropy</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">10-12 bits (1 in 1,000-4,000)</td>
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
                    <td className="px-4 py-3 text-sm">Accept-Language Entropy</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">4-6 bits (1 in 16-64)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://amiunique.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        AmIUnique Database
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">HTTP Headers Overall Entropy</td>
                    <td className="px-4 py-3 text-sm">0.085 to 0.249 (varies by dataset)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://arxiv.org/pdf/1905.01051"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Browser Fingerprinting Survey
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">DNT (Do Not Track) Adoption</td>
                    <td className="px-4 py-3 text-sm">~15% of users (0.5 bits entropy)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.w3.org/TR/fingerprinting-guidance/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        W3C Fingerprinting Guidance
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Combined Fingerprint Uniqueness</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">83.6% (94.2% with Flash/Java)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        ACM "Hiding in the Crowd"
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">Chrome User-Agent Reduction Timeline</td>
                    <td className="px-4 py-3 text-sm">2022-2023 rollout (replaced by Client Hints)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        MDN Web Docs
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Client Hints: The New Fingerprinting Frontier
              </h3>
              <p className="leading-relaxed">
                Client Hints split browser information into "low entropy" (automatically sent) and "high entropy" (sent only when requested by servers) categories. The default low-entropy hints include Sec-CH-UA (browser brand and major version), Sec-CH-UA-Mobile (mobile or desktop), and Sec-CH-UA-Platform (OS family like "Windows" or "macOS"). Websites must explicitly request high-entropy hints like Sec-CH-UA-Platform-Version (exact OS version like "10.0.22621"), Sec-CH-UA-Arch (x86, ARM, etc.), or Sec-CH-UA-Model (specific device model).
              </p>
              <p className="leading-relaxed">
                In theory, this limits fingerprinting—servers can't access detailed device info without asking. In practice, major tracking networks <em>always</em> request high-entropy hints. According to The Privacy Sandbox research on "Browser Fingerprinting & Client Hints," sites using fingerprinting scripts request all available Client Hints, combining them into a fingerprint that's actually <em>more</em> detailed than the old User-Agent. A fingerprint combining Sec-CH-UA, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, and Sec-CH-UA-Full-Version-List provides enough entropy to uniquely identify most users.
              </p>
              <p className="leading-relaxed">
                For anti-detect browsers and automation tools, Client Hints add complexity. You can't just spoof the User-Agent anymore—you need to ensure Client Hints match. If your User-Agent says "Chrome 120 on Windows 11" but your Sec-CH-UA-Platform-Version says "10.0.19045" (Windows 10 build number), detection systems catch the inconsistency immediately. Every fingerprint attribute must align perfectly—headers, canvas, WebGL (see our <a href="/tools/canvas" className="text-accent hover:underline">Canvas Test</a> and <a href="/tools/webgl" className="text-accent hover:underline">WebGL Test</a>), fonts, and more.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Automation Arms Race
              </h3>
              <p className="leading-relaxed">
                Headless browsers used to have obvious header signatures. Puppeteer's default User-Agent included "HeadlessChrome" in the string—literally advertising itself as automation. Selenium's default headers differed subtly from real browsers in the Accept header ordering. Modern automation frameworks have improved, but detection systems evolved faster.
              </p>
              <p className="leading-relaxed">
                Today's sophisticated detection doesn't just check individual headers—it analyzes <em>consistency</em> across all fingerprinting vectors. Your headers say macOS but your <a href="/tools/fonts" className="text-accent hover:underline">font list</a> includes Windows-specific fonts? Blocked. Your User-Agent says mobile but your screen resolution is desktop-sized? Blocked. Your Accept-Language is Chinese but you're accessing the site from a US IP with English content preferences? Highly suspicious.
              </p>
              <p className="leading-relaxed">
                The 2025 ACM Web Conference paper "The First Early Evidence of the Use of Browser Fingerprinting for Online Tracking" demonstrated that fingerprinting can bypass GDPR and CCPA opt-outs entirely. Researchers found that major advertising networks use header analysis alongside canvas and WebGL to track users who've explicitly rejected cookies. The trackers argue headers are "necessary technical information," not tracking data subject to privacy laws—a legal gray area that privacy advocates are fighting.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Protecting Against Header Fingerprinting
              </h3>
              <p className="leading-relaxed">
                For general privacy, Tor Browser remains the gold standard. Every Tor user sends identical headers—same User-Agent (updated with each Tor version), same Accept-Language (en-US,en;q=0.5), same Accept headers. You're anonymous within the crowd of millions of Tor users. The trade-off? Some websites block Tor traffic, and performance is slower due to onion routing.
              </p>
              <p className="leading-relaxed">
                Firefox's <code className="text-terminal bg-bg-primary px-1 py-0.5 rounded">privacy.resistFingerprinting</code> setting normalizes headers to common values, reduces User-Agent specificity, and blocks Client Hints. It's effective but can break websites that depend on accurate browser detection for legitimate features like video codecs or responsive layouts. You might get a mobile site on desktop or vice versa.
              </p>
              <p className="leading-relaxed">
                Browser extensions like "User-Agent Switcher" provide basic protection by changing your User-Agent string. But they're easily defeated because they don't modify Client Hints, Accept headers, or other identifying headers. Worse, they often create <em>inconsistencies</em>—your User-Agent says Safari on macOS but your other headers still say Chrome on Windows. Detection systems are built to catch exactly these mismatches.
              </p>
              <p className="leading-relaxed">
                For automation and multi-accounting, anti-detect browsers are essential. They maintain comprehensive browser profiles where <em>every</em> header is internally consistent. If a profile claims to be an iPhone 14 Pro running Safari, it sends the exact headers that device would send—correct User-Agent format, appropriate Accept headers, matching Client Hints, and consistent Accept-Language for the target locale. The profiles often come from real device fingerprints collected from actual users.
              </p>
              <p className="leading-relaxed">
                The future of header privacy is uncertain. Browser vendors are caught between legitimate web functionality (which requires device information) and user privacy (which requires hiding that information). The current trajectory—replacing simple headers with complex Client Hints—seems to favor trackers. Understanding HTTP headers fingerprinting is crucial for both privacy protection and web automation success.
              </p>
              <p className="leading-relaxed">
                Want to dive deeper? Check our comprehensive guide on <a href="/learn/http-headers" className="text-accent hover:underline">HTTP Headers Defense Strategies</a> and explore how headers combine with <a href="/tools/audio" className="text-accent hover:underline">Audio Fingerprinting</a> and other techniques to create a complete digital fingerprint that tracks you across the web.
              </p>
            </div>
          </div>

          {/* Test Again Button */}
          <div className="mt-8 text-center">
            <button
              onClick={analyzeHeaders}
              disabled={isLoading}
              className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Again'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
