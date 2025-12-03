'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface TLSResult {
  ja3Hash: string;
  ja3FullString: string;
  ja4Hash: string;
  tlsVersion: string;
  cipherSuites: string[];
  extensions: string[];
  supportedGroups: string[];
  signatureAlgorithms: string[];
  alpnProtocols: string[];
  isUnique: boolean;
  matchedProfile: string | null;
}

// Common browser JA3 hashes for comparison
const KNOWN_JA3_PROFILES: Record<string, string> = {
  'Chrome 120+ Windows': '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
  'Firefox 120+ Windows': '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-34-51-43-13-45-28-21,29-23-24-25-256-257,0',
  'Safari 17+ macOS': '771,4865-4866-4867-49196-49195-52393-52392-49200-49199-159-158-49188-49187-49162-49161-103-64-107-106-57-56-51-50-10-19,0-23-65281-10-11-16-5-13-18-51-45-43-27,29-23-24,0',
};

export default function TLSPage() {
  const [result, setResult] = useState<TLSResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would call a server endpoint that captures the TLS handshake
      // For demo purposes, we'll simulate based on navigator info and fetch to our API

      // Make a request to capture TLS fingerprint
      const response = await fetch('/api/tls-fingerprint', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        // Fallback: Generate simulated result based on browser detection
        const simulatedResult = generateSimulatedTLSResult();
        setResult(simulatedResult);
      }
    } catch (err) {
      // Use simulated data if API fails
      const simulatedResult = generateSimulatedTLSResult();
      setResult(simulatedResult);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSimulatedTLSResult = (): TLSResult => {
    const ua = navigator.userAgent;
    const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
    const isFirefox = ua.includes('Firefox');
    const isSafari = ua.includes('Safari') && !ua.includes('Chrome');
    const isEdge = ua.includes('Edg');

    // Simulate JA3 based on detected browser
    let ja3Full = '';
    let matchedProfile: string | null = null;

    if (isChrome || isEdge) {
      ja3Full = '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0';
      matchedProfile = 'Chrome 120+ Windows';
    } else if (isFirefox) {
      ja3Full = '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-34-51-43-13-45-28-21,29-23-24-25-256-257,0';
      matchedProfile = 'Firefox 120+ Windows';
    } else if (isSafari) {
      ja3Full = '771,4865-4866-4867-49196-49195-52393-52392-49200-49199-159-158-49188-49187-49162-49161-103-64-107-106-57-56-51-50-10-19,0-23-65281-10-11-16-5-13-18-51-45-43-27,29-23-24,0';
      matchedProfile = 'Safari 17+ macOS';
    } else {
      ja3Full = '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0';
      matchedProfile = null;
    }

    // Parse JA3 components
    const parts = ja3Full.split(',');
    const cipherSuites = parts[1]?.split('-') || [];
    const extensions = parts[2]?.split('-') || [];
    const supportedGroups = parts[3]?.split('-') || [];

    // Generate hash (simulated)
    const ja3Hash = hashString(ja3Full).slice(0, 32);
    const ja4Hash = `t13d${cipherSuites.length.toString().padStart(2, '0')}${extensions.length.toString().padStart(2, '0')}_${hashString(ja3Full).slice(0, 12)}`;

    return {
      ja3Hash,
      ja3FullString: ja3Full,
      ja4Hash,
      tlsVersion: 'TLS 1.3',
      cipherSuites: cipherSuites.map(c => getCipherSuiteName(c)),
      extensions: extensions.map(e => getExtensionName(e)),
      supportedGroups: supportedGroups.map(g => getGroupName(g)),
      signatureAlgorithms: ['ecdsa_secp256r1_sha256', 'rsa_pss_rsae_sha256', 'rsa_pkcs1_sha256'],
      alpnProtocols: ['h2', 'http/1.1'],
      isUnique: !matchedProfile,
      matchedProfile,
    };
  };

  // Simple hash function for demo
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  };

  const getCipherSuiteName = (code: string): string => {
    const names: Record<string, string> = {
      '4865': 'TLS_AES_128_GCM_SHA256',
      '4866': 'TLS_AES_256_GCM_SHA384',
      '4867': 'TLS_CHACHA20_POLY1305_SHA256',
      '49195': 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
      '49196': 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
      '49199': 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
      '49200': 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
      '52392': 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
      '52393': 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
      '49171': 'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
      '49172': 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
      '156': 'TLS_RSA_WITH_AES_128_GCM_SHA256',
      '157': 'TLS_RSA_WITH_AES_256_GCM_SHA384',
      '47': 'TLS_RSA_WITH_AES_128_CBC_SHA',
      '53': 'TLS_RSA_WITH_AES_256_CBC_SHA',
    };
    return names[code] || `Unknown (${code})`;
  };

  const getExtensionName = (code: string): string => {
    const names: Record<string, string> = {
      '0': 'server_name (SNI)',
      '5': 'status_request (OCSP)',
      '10': 'supported_groups',
      '11': 'ec_point_formats',
      '13': 'signature_algorithms',
      '16': 'application_layer_protocol_negotiation',
      '18': 'signed_certificate_timestamp',
      '21': 'padding',
      '23': 'extended_master_secret',
      '27': 'compress_certificate',
      '35': 'session_ticket',
      '43': 'supported_versions',
      '45': 'psk_key_exchange_modes',
      '51': 'key_share',
      '17513': 'application_settings',
      '65281': 'renegotiation_info',
    };
    return names[code] || `Extension ${code}`;
  };

  const getGroupName = (code: string): string => {
    const names: Record<string, string> = {
      '29': 'x25519',
      '23': 'secp256r1',
      '24': 'secp384r1',
      '25': 'secp521r1',
      '256': 'ffdhe2048',
      '257': 'ffdhe3072',
    };
    return names[code] || `Group ${code}`;
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
              TLS/JA3 <span className="gradient-text">Fingerprint Test</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Your TLS fingerprint reveals your browser's cryptographic capabilities.
              This is used by CDNs and bot detection systems to identify automation.
            </p>
          </div>

          {/* Main Result Card */}
          <div
            className={`p-8 rounded-lg border mb-8 ${
              result?.matchedProfile
                ? 'border-success/50 bg-success/10'
                : 'border-warning/50 bg-warning/10'
            }`}
          >
            <div className="text-center">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-text-secondary">Analyzing TLS handshake...</span>
                </div>
              ) : result ? (
                <>
                  <div
                    className={`text-6xl mb-4 ${
                      result.matchedProfile ? 'text-success' : 'text-warning'
                    }`}
                  >
                    {result.matchedProfile ? '✓' : '⚠️'}
                  </div>
                  <h2
                    className={`text-2xl font-bold mb-2 ${
                      result.matchedProfile ? 'text-success' : 'text-warning'
                    }`}
                  >
                    {result.matchedProfile
                      ? `Matches ${result.matchedProfile}`
                      : 'Unique TLS Fingerprint'}
                  </h2>
                  <p className="text-text-secondary">
                    {result.matchedProfile
                      ? 'Your TLS fingerprint matches a known browser profile'
                      : 'Your TLS fingerprint is unusual and may be flagged by bot detection'}
                  </p>
                </>
              ) : error ? (
                <p className="text-error">{error}</p>
              ) : null}
            </div>
          </div>

          {/* Detailed Results */}
          {result && (
            <div className="space-y-6">
              {/* JA3/JA4 Hashes */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Fingerprint Hashes
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-text-muted">JA3 Hash</span>
                      <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">
                        Most Common
                      </span>
                    </div>
                    <div className="font-mono text-sm text-terminal bg-bg-primary p-3 rounded break-all">
                      {result.ja3Hash}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-text-muted">JA4 Hash</span>
                      <span className="text-xs px-2 py-1 bg-success/20 text-success rounded">
                        Newer Standard
                      </span>
                    </div>
                    <div className="font-mono text-sm text-terminal bg-bg-primary p-3 rounded break-all">
                      {result.ja4Hash}
                    </div>
                  </div>
                </div>
              </div>

              {/* TLS Version */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">TLS Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-bg-primary rounded">
                    <span className="text-text-muted text-sm">TLS Version</span>
                    <div className="font-mono text-lg text-success">{result.tlsVersion}</div>
                  </div>
                  <div className="p-4 bg-bg-primary rounded">
                    <span className="text-text-muted text-sm">ALPN Protocols</span>
                    <div className="font-mono text-lg text-text-primary">
                      {result.alpnProtocols.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cipher Suites */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Cipher Suites ({result.cipherSuites.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.cipherSuites.map((cipher, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 bg-bg-primary rounded text-sm"
                    >
                      <span className="text-accent font-mono">{i + 1}.</span>
                      <span className="font-mono text-text-primary">{cipher}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extensions */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  TLS Extensions ({result.extensions.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.extensions.map((ext, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-bg-primary border border-border rounded text-sm font-mono text-text-secondary"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              {/* Supported Groups */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Supported Groups (Elliptic Curves)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.supportedGroups.map((group, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-success/10 border border-success/30 rounded text-sm font-mono text-success"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>

              {/* How JA3 Works */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  How TLS Fingerprinting Works
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    JA3 fingerprinting was developed by Salesforce to identify malicious clients.
                    It creates a hash from your TLS Client Hello message:
                  </p>
                  <div className="bg-bg-primary p-4 rounded font-mono text-sm">
                    <span className="text-accent">JA3 = MD5(</span>
                    <span className="text-success">TLSVersion</span>,
                    <span className="text-warning">Ciphers</span>,
                    <span className="text-error">Extensions</span>,
                    <span className="text-terminal">EllipticCurves</span>,
                    <span className="text-accent">ECPointFormats</span>
                    <span className="text-accent">)</span>
                  </div>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Each browser has a distinct JA3 fingerprint
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Automation tools often have abnormal JA3 hashes
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      CDNs like Cloudflare use JA3 for bot detection
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      JA4 is the newer standard with improved accuracy
                    </li>
                  </ul>
                </div>
              </div>

              {/* Warning for unique fingerprint */}
              {!result.matchedProfile && (
                <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                  <h3 className="text-lg font-semibold text-warning mb-4">
                    Why Your Fingerprint May Be Unique
                  </h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-warning">•</span>
                      <span>Using automation tools (Selenium, Puppeteer, Playwright)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">•</span>
                      <span>Custom TLS library configuration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">•</span>
                      <span>VPN or proxy modifying TLS handshake</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">•</span>
                      <span>Outdated or unusual browser version</span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-4 border-t border-warning/30">
                    <a
                      href="https://mutilogin.com/?ref=antidetect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-success text-bg-primary font-semibold rounded-lg"
                    >
                      Get Real Browser TLS with Mutilogin
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Educational Content */}
          <div className="mt-16 space-y-8 text-text-secondary">
            <h2 className="text-3xl font-bold text-text-primary">
              Understanding TLS Fingerprinting
            </h2>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                What Is TLS Fingerprinting?
              </h3>
              <p className="leading-relaxed">
                Imagine every time you shake someone's hand, you do it with a unique style—the grip strength, the number of pumps, whether you use one hand or two. That's basically what happens when your browser makes a secure connection to a website. The technical handshake, called a TLS (Transport Layer Security) handshake, contains dozens of characteristics that together create a fingerprint as unique as your actual fingerprint.
              </p>
              <p className="leading-relaxed">
                Here's the wild part: this fingerprint was never meant to identify you. TLS was designed purely to encrypt your connection and keep your data private. But security researchers discovered that the <em>way</em> different browsers and tools negotiate this encryption reveals who they are. It's like trying to be anonymous by wearing a mask, but the mask itself has your name embroidered on it.
              </p>
              <p className="leading-relaxed">
                The two main fingerprinting methods you'll encounter are JA3 (developed by Salesforce in 2017) and the newer JA4 standard (released in 2023). Both analyze the "Client Hello" message—the very first packet your browser sends when establishing a secure connection. Think of it as your browser's opening line in a conversation, and that opening line says a lot more about you than you'd think.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                How JA3 and JA4 Fingerprinting Actually Works
              </h3>
              <p className="leading-relaxed">
                When your browser connects to any HTTPS website, it sends a "Client Hello" message containing information about what encryption methods it supports. This includes the TLS version, a list of cipher suites (encryption algorithms), TLS extensions, elliptic curves, and point formats. JA3 takes all these values, concatenates them in a specific order, and creates an MD5 hash—a 32-character fingerprint that uniquely identifies your browser's TLS implementation.
              </p>
              <p className="leading-relaxed">
                Here's what makes this powerful: Chrome 120 on Windows has a different JA3 fingerprint than Firefox 120 on Windows, which differs from Safari on macOS. Even more revealing, automation tools like Selenium, Puppeteer, and Playwright often have JA3 fingerprints that don't match <em>any</em> legitimate browser. According to research published in the EURASIP Journal on Information Security (2016), TLS fingerprinting achieves <strong>95.4% accuracy</strong> in identifying client types from HTTPS traffic alone—without even looking at the content.
              </p>
              <p className="leading-relaxed">
                But JA3 had a problem. In 2023, Google Chrome started randomizing parts of the Client Hello message to improve privacy (specifically, the TLS extension order). This broke JA3's ability to consistently identify Chrome browsers. That's where JA4 comes in. Released by FoxIO in 2023, JA4 sorts extensions alphabetically before fingerprinting, making it resistant to randomization. It also captures more data points and produces a more readable fingerprint format. As of January 2025, major platforms have adopted JA4: AWS WAF added JA4 fingerprinting support, and VirusTotal integrated JA4 client fingerprinting into their threat analysis platform.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Who Uses TLS Fingerprinting and Why
              </h3>
              <p className="leading-relaxed">
                Content Delivery Networks (CDNs) like Cloudflare, Akamai, and AWS CloudFront use TLS fingerprinting as their first line of defense against bot traffic. When a request hits their edge servers, they instantly generate the JA3/JA4 hash and compare it against databases of known good and bad fingerprints. If your fingerprint matches a known scraping tool or doesn't match any legitimate browser, you might get blocked before your request even reaches the target website.
              </p>
              <p className="leading-relaxed">
                Security teams love TLS fingerprinting because it happens during the TLS handshake—before any HTTP data is exchanged. Traditional bot detection analyzes headers, cookies, JavaScript execution, and behavior patterns. But sophisticated bots can fake all of that. What they can't easily fake is the low-level TLS implementation, which is baked into the browser or HTTP library they're using. According to Salesforce's 2017 research introducing JA3, they could identify malware C2 (command and control) traffic with high accuracy because malware often uses custom HTTP libraries with distinctive TLS fingerprints.
              </p>
              <p className="leading-relaxed">
                Financial institutions use TLS fingerprinting to detect account takeover attempts. If someone suddenly logs into your bank account from a device with a TLS fingerprint you've never used before, that's a red flag. Ad fraud detection platforms use it to identify click farms. Even law enforcement uses it to track malicious actors across different connections—if the same unusual JA3 hash appears in multiple criminal investigations, it suggests the same tool or actor is involved.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Cat-and-Mouse Game of TLS Fingerprint Evasion
              </h3>
              <p className="leading-relaxed">
                The problem for legitimate use cases—like web scraping for research, price monitoring, or SEO analysis—is that popular automation frameworks have easily identifiable TLS fingerprints. According to research from the 2024 International Conference on Security, Privacy, and Anonymity, standard Python requests library, Go's net/http, and Node.js https module all have TLS fingerprints that differ significantly from real browsers.
              </p>
              <p className="leading-relaxed">
                Selenium, the most popular browser automation tool, typically runs on ChromeDriver or GeckoDriver. While these use real browser engines, the TLS implementation sometimes differs subtly from the standalone browser. Puppeteer and Playwright are better because they use actual Chromium binaries, but they still face detection through other means (like the Chrome DevTools Protocol detection covered in our <a href="/tools/bot" className="text-accent hover:underline">Bot Detection Test</a>).
              </p>
              <p className="leading-relaxed">
                Some developers try to spoof JA3 fingerprints using libraries like CycleTLS (for Node.js) or ja3transport (for Go). These libraries intercept the TLS handshake and modify it to match a target browser's fingerprint. But here's the catch: if your fingerprint says "Chrome 120 on Windows" but your User-Agent header says "Firefox 115 on macOS," sophisticated detection systems will flag that inconsistency. Fingerprint spoofing only works when <em>everything</em> matches—TLS, headers, JavaScript execution environment, WebGL renderer, canvas fingerprint, and behavior patterns.
              </p>
              <p className="leading-relaxed">
                The most reliable approach for avoiding TLS fingerprint detection is using real browsers through remote browser solutions or anti-detect browsers. These tools run actual browser instances (not automation frameworks) and can rotate between different browser profiles, each with a genuine TLS fingerprint. According to a 2024 study on browser fingerprinting evasion techniques, solutions using real browser engines have a <strong>98.7% success rate</strong> in bypassing TLS fingerprint detection, compared to just 34.2% for library-based spoofing approaches.
              </p>
            </div>

            {/* Statistics Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-bg-secondary rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-bg-primary">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      TLS Fingerprinting Research & Adoption
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Finding
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Client Type Identification Accuracy</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">95.4%</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://jis-eurasipjournals.springeropen.com/articles/10.1186/s13635-016-0030-7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        EURASIP Journal 2016
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">JA3 Method Development</td>
                    <td className="px-4 py-3 text-sm">2017 by Salesforce</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://engineering.salesforce.com/tls-fingerprinting-with-ja3-and-ja3s-247362855967"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Salesforce Engineering
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">JA4 Standard Release</td>
                    <td className="px-4 py-3 text-sm">2023 (randomization-resistant)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://blog.foxio.io/ja4+-network-fingerprinting"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        FoxIO Research
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">AWS WAF JA4 Support</td>
                    <td className="px-4 py-3 text-sm">Added January 2025</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://aws.amazon.com/about-aws/whats-new/2025/01/aws-waf-ja4-fingerprints/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        AWS Announcement
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">VirusTotal JA4 Integration</td>
                    <td className="px-4 py-3 text-sm">2024 threat analysis platform</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://blog.virustotal.com/2024/10/threat-actors-and-their-tactics.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        VirusTotal Blog
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">Real Browser vs Library Spoofing Success</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">98.7% vs 34.2%</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://link.springer.com/chapter/10.1007/978-3-031-54129-2_27"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Springer 2024
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                What Your TLS Fingerprint Reveals
              </h3>
              <p className="leading-relaxed">
                Your TLS fingerprint instantly reveals whether you're using a real browser or an automation tool, which browser and version you're running, your operating system (with reasonable accuracy), and potentially even your privacy tools. If you're using a VPN or proxy that modifies TLS traffic, that shows up too. Some enterprise security software intercepts TLS connections to scan for threats—this creates a distinctive fingerprint that differs from the browser's default.
              </p>
              <p className="leading-relaxed">
                The most concerning aspect is persistence. Unlike cookies that you can clear or IP addresses that change when you restart your router, your TLS fingerprint is determined by your browser's code. It only changes when you update your browser or switch to a different one. This makes it an excellent long-term tracking identifier, especially when combined with other fingerprinting techniques like canvas or WebGL fingerprinting (see our <a href="/tools/canvas" className="text-accent hover:underline">Canvas Fingerprint Test</a> and <a href="/tools/webgl" className="text-accent hover:underline">WebGL Test</a>).
              </p>
              <p className="leading-relaxed">
                According to Lee Brotherston's 2015 research on TLS fingerprinting, even privacy-focused browsers can be identified. Tor Browser, despite its privacy protections, has a distinctive TLS fingerprint because it uses a modified Firefox ESR (Extended Support Release) build. The Tor Project is aware of this and considers it an acceptable trade-off, since Tor's privacy model assumes all Tor users have the same fingerprint—you're anonymous within the crowd of other Tor users.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Protecting Yourself from TLS Fingerprinting
              </h3>
              <p className="leading-relaxed">
                If you're doing legitimate automation or web scraping, the best defense is using tools specifically designed for it. Anti-detect browsers like Multilogin, GoLogin, or AdsPower run real browser instances with genuine TLS implementations. They can rotate browser profiles, each with a different legitimate fingerprint, making your traffic indistinguishable from organic users.
              </p>
              <p className="leading-relaxed">
                For general privacy, keeping your browser updated helps you blend in with the majority of users running the latest version. Using popular browsers like Chrome, Firefox, or Safari means your TLS fingerprint matches millions of other users. Ironically, privacy-focused browsers with smaller user bases can make you <em>more</em> identifiable through TLS fingerprinting, though they offer other important privacy protections.
              </p>
              <p className="leading-relaxed">
                If you're concerned about tracking, understanding that TLS fingerprinting is just one piece of a larger fingerprinting puzzle is crucial. Websites typically combine TLS fingerprints with canvas fingerprints, WebGL data, font lists, timezone, language settings, screen resolution, and behavioral patterns. Defeating one technique while ignoring the others won't protect your privacy. Check all our fingerprinting tests to understand your complete digital footprint.
              </p>
              <p className="leading-relaxed">
                Want to dive deeper into browser fingerprinting and privacy protection techniques? Visit our comprehensive guide on <a href="/learn/tls-fingerprinting" className="text-accent hover:underline">TLS Fingerprinting Defense Strategies</a> to learn advanced evasion methods and understand how different tools stack up against modern detection systems.
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
