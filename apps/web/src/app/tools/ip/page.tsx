'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface IPResult {
  ip: string;
  type: 'IPv4' | 'IPv6';
  location: {
    country: string;
    countryCode: string;
    region: string;
    city: string;
    timezone: string;
    latitude: number;
    longitude: number;
  };
  network: {
    asn: string;
    org: string;
    isp: string;
  };
  detection: {
    isProxy: boolean;
    isVPN: boolean;
    isTor: boolean;
    isDatacenter: boolean;
    isRelay: boolean;
    riskScore: number;
  };
  webrtc: {
    localIPs: string[];
    publicIP: string | null;
    hasLeak: boolean;
  };
  // New enhanced data
  reverseDns: {
    hostname: string | null;
    isValidHostname: boolean;
    hostnameType: 'residential' | 'datacenter' | 'vpn' | 'hosting' | 'unknown';
  };
  whois: {
    netname: string;
    orgName: string;
    registrar: string;
    country: string;
    cidr: string;
    netRange: {
      start: string;
      end: string;
    };
    abuseContact: string;
  };
  enhanced: {
    hostnameType: string;
    netType: {
      category: 'residential' | 'business' | 'datacenter' | 'vpn' | 'mobile' | 'unknown';
      confidence: number;
      details: string[];
    };
    privacy: {
      hasStaticHostname: boolean;
      isDatacenter: boolean;
      vpnRisk: boolean;
    };
  };
  blacklistStatus: {
    listed: boolean;
    lists: Array<{
      name: string;
      reason?: string;
      listedDate?: string;
    }>;
  };
}

export default function IPPage() {
  const [result, setResult] = useState<IPResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWebRTCLeaks = useCallback(async (): Promise<{
    localIPs: string[];
    publicIP: string | null;
    hasLeak: boolean;
  }> => {
    const localIPs: string[] = [];
    let publicIP: string | null = null;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      pc.createDataChannel('');

      const candidates = await new Promise<RTCIceCandidate[]>((resolve) => {
        const candidates: RTCIceCandidate[] = [];
        const timeout = setTimeout(() => resolve(candidates), 3000);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            candidates.push(event.candidate);
          } else {
            clearTimeout(timeout);
            resolve(candidates);
          }
        };

        pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      });

      candidates.forEach((candidate) => {
        const parts = candidate.candidate.split(' ');
        const ip = parts[4];
        if (ip && !localIPs.includes(ip)) {
          localIPs.push(ip);
        }
      });

      // Use Cloudflare trace to get public IP
      const traceResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const traceText = await traceResponse.text();
      const ipMatch = traceText.match(/ip=([\\d.:]+)/);
      publicIP = ipMatch?.[1] ?? null;

      return {
        localIPs,
        publicIP,
        hasLeak: Boolean(publicIP && localIPs.some((ip) => !ip.startsWith('10.') && !ip.startsWith('192.168'))),
      };
    } catch {
      return {
        localIPs: [],
        publicIP: null,
        hasLeak: false,
      };
    }
  }, []);

  const runTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch IP info from our API
      const response = await fetch('/api/ip/check');

      if (!response.ok) {
        throw new Error('Failed to fetch IP info');
      }

      const data = await response.json();

      // Also run WebRTC leak test
      const webrtcResult = await testWebRTCLeaks();

      setResult({
        ip: data.ip || 'Unknown',
        type: data.ip?.includes(':') ? 'IPv6' : 'IPv4',
        location: {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          timezone: data.timezone || 'Unknown',
          latitude: Number(data.latitude) || 0,
          longitude: Number(data.longitude) || 0,
        },
        network: {
          asn: data.asn || 'Unknown',
          org: data.org || 'Unknown',
          isp: data.isp || 'Unknown',
        },
        detection: {
          isProxy: data.isProxy || false,
          isVPN: data.isVPN || false,
          isTor: data.isTor || false,
          isDatacenter: data.isDatacenter || false,
          isRelay: data.isRelay || false,
          riskScore: data.riskScore || 0,
        },
        webrtc: webrtcResult,
        // Enhanced data
        reverseDns: data.reverseDns || {
          hostname: null,
          isValidHostname: false,
          hostnameType: 'unknown',
        },
        whois: data.whois || {
          netname: 'Unknown',
          orgName: 'Unknown',
          registrar: 'Unknown',
          country: 'Unknown',
          cidr: 'Unknown',
          netRange: { start: 'Unknown', end: 'Unknown' },
          abuseContact: 'Unknown',
        },
        enhanced: data.enhanced || {
          hostnameType: 'unknown',
          netType: { category: 'unknown', confidence: 0, details: [] },
          privacy: { hasStaticHostname: false, isDatacenter: false, vpnRisk: false },
        },
        blacklistStatus: data.blacklistStatus || { listed: false, lists: [] },
      });
    } catch (err) {
      console.error('IP test failed:', err);

      // Fallback: Get basic IP info from public API
      try {
        const fallbackResponse = await fetch('https://api.ipify.org?format=json');
        const fallbackData = await fallbackResponse.json();

        const webrtcResult = await testWebRTCLeaks();

        setResult({
          ip: fallbackData.ip || 'Unknown',
          type: fallbackData.ip?.includes(':') ? 'IPv6' : 'IPv4',
          location: {
            country: 'Unknown',
            countryCode: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
            latitude: 0,
            longitude: 0,
          },
          network: {
            asn: 'Unknown',
            org: 'Unknown',
            isp: 'Unknown',
          },
          detection: {
            isProxy: false,
            isVPN: false,
            isTor: false,
            isDatacenter: false,
            isRelay: false,
            riskScore: 0,
          },
          webrtc: webrtcResult,
          // Enhanced data defaults for fallback
          reverseDns: {
            hostname: null,
            isValidHostname: false,
            hostnameType: 'unknown',
          },
          whois: {
            netname: 'Unknown',
            orgName: 'Unknown',
            registrar: 'Unknown',
            country: 'Unknown',
            cidr: 'Unknown',
            netRange: { start: 'Unknown', end: 'Unknown' },
            abuseContact: 'Unknown',
          },
          enhanced: {
            hostnameType: 'unknown',
            netType: { category: 'unknown', confidence: 0, details: [] },
            privacy: { hasStaticHostname: false, isDatacenter: false, vpnRisk: false },
          },
          blacklistStatus: { listed: false, lists: [] },
        });
      } catch {
        setError('Failed to detect IP address');
      }
    } finally {
      setIsLoading(false);
    }
  }, [testWebRTCLeaks]);

  const isPrivateIP = (ip: string): boolean => {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] !== undefined && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;

    return false;
  };

  const getRiskLevel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'High Risk', color: 'text-error' };
    if (score >= 50) return { label: 'Medium Risk', color: 'text-warning' };
    if (score >= 20) return { label: 'Low Risk', color: 'text-accent' };
    return { label: 'Clean', color: 'text-success' };
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
              IP & <span className="gradient-text">Geolocation</span> Test
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              See what websites know about you from your IP address. We check for VPN/proxy
              detection, datacenter IPs, and WebRTC leaks.
            </p>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto" />
              <p className="text-text-muted mt-4">Analyzing your IP address...</p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-lg bg-error/10 border border-error/30 text-center">
              <p className="text-error">{error}</p>
              <button
                onClick={runTest}
                className="mt-4 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90"
              >
                Try Again
              </button>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-6">
              {/* IP Address Display */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border text-center">
                <p className="text-sm text-text-muted mb-2">Your IP Address</p>
                <p className="text-3xl font-mono text-terminal mb-2">{result.ip}</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs ${
                    result.type === 'IPv6' ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'
                  }`}
                >
                  {result.type}
                </span>
              </div>

              {/* WebRTC Leak Alert */}
              {result.webrtc.hasLeak && (
                <div className="p-6 rounded-lg border border-error/50 bg-error/10">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl text-error">⚠️</span>
                    <div>
                      <h3 className="text-lg font-semibold text-error">WebRTC Leak Detected</h3>
                      <p className="text-text-secondary mt-1">
                        Your real IP addresses are being exposed through WebRTC, even if you're using a VPN.
                      </p>
                      {result.webrtc.localIPs.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-text-muted">Local IPs leaked:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {result.webrtc.localIPs.map((ip) => (
                              <span
                                key={ip}
                                className="px-2 py-1 bg-error/20 text-error text-xs font-mono rounded"
                              >
                                {ip}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.webrtc.publicIP && (
                        <p className="mt-2 text-sm text-error">
                          Public IP leaked: <span className="font-mono">{result.webrtc.publicIP}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location Info */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Location</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Country</p>
                    <p className="font-semibold text-text-primary">
                      {result.location.countryCode !== 'XX' && (
                        <span className="mr-2">{getFlagEmoji(result.location.countryCode)}</span>
                      )}
                      {result.location.country}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Region</p>
                    <p className="font-semibold text-text-primary">{result.location.region}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">City</p>
                    <p className="font-semibold text-text-primary">{result.location.city}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Timezone</p>
                    <p className="font-mono text-text-primary text-sm">{result.location.timezone}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary col-span-2">
                    <p className="text-xs text-text-muted mb-1">Coordinates</p>
                    <p className="font-mono text-text-primary text-sm">
                      {result.location.latitude.toFixed(4)}, {result.location.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Network Info */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Network</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">ASN</span>
                    <span className="font-mono text-text-primary">{result.network.asn}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Organization</span>
                    <span className="text-text-primary text-right max-w-[60%]">{result.network.org}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-text-muted">ISP</span>
                    <span className="text-text-primary text-right max-w-[60%]">{result.network.isp}</span>
                  </div>
                </div>
              </div>

              {/* Reverse DNS Info */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Reverse DNS</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Hostname</span>
                    <span className="text-text-primary text-right max-w-[60%] font-mono text-sm">
                      {result.reverseDns.hostname || 'No hostname'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Hostname Type</span>
                    <span className={`text-sm font-medium ${
                      result.reverseDns.hostnameType === 'residential' ? 'text-success' :
                      result.reverseDns.hostnameType === 'datacenter' ? 'text-warning' :
                      result.reverseDns.hostnameType === 'vpn' ? 'text-error' :
                      'text-text-muted'
                    }`}>
                      {result.reverseDns.hostnameType.charAt(0).toUpperCase() + result.reverseDns.hostnameType.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-text-muted">Valid DNS</span>
                    <span className={`text-sm font-medium ${
                      result.reverseDns.isValidHostname ? 'text-success' : 'text-warning'
                    }`}>
                      {result.reverseDns.isValidHostname ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* WHOIS Info */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">WHOIS Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Network Name</span>
                    <span className="text-text-primary text-right max-w-[60%]">{result.whois.netname}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Organization</span>
                    <span className="text-text-primary text-right max-w-[60%]">{result.whois.orgName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">CIDR Range</span>
                    <span className="text-text-primary font-mono text-sm">{result.whois.cidr}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Registrar</span>
                    <span className="text-text-primary text-right max-w-[60%]">{result.whois.registrar}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-text-muted">Network Type</span>
                    <span className={`text-sm font-medium ${
                      result.enhanced.netType.category === 'residential' ? 'text-success' :
                      result.enhanced.netType.category === 'datacenter' ? 'text-warning' :
                      result.enhanced.netType.category === 'vpn' ? 'text-error' :
                      'text-text-muted'
                    }`}>
                      {result.enhanced.netType.category.charAt(0).toUpperCase() + result.enhanced.netType.category.slice(1)}
                      <span className="text-xs ml-1 text-text-muted">({result.enhanced.netType.confidence}% confidence)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Blacklist Status */}
              {result.blacklistStatus.listed && (
                <div className="p-6 rounded-lg border border-error/50 bg-error/10">
                  <h3 className="text-lg font-semibold text-error mb-4">⚠️ Blacklist Detected</h3>
                  <div className="space-y-2">
                    {result.blacklistStatus.lists.map((list, index) => (
                      <div key={index} className="p-3 rounded bg-bg-primary border border-error/30">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-error">{list.name}</span>
                          {list.listedDate && (
                            <span className="text-xs text-text-muted">
                              {new Date(list.listedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {list.reason && (
                          <p className="text-sm text-text-secondary">{list.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detection Results */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Detection Results</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Risk Score:</span>
                    <span className={`font-bold ${getRiskLevel(result.detection.riskScore).color}`}>
                      {result.detection.riskScore}/100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Proxy', value: result.detection.isProxy },
                    { label: 'VPN', value: result.detection.isVPN },
                    { label: 'Tor', value: result.detection.isTor },
                    { label: 'Datacenter', value: result.detection.isDatacenter },
                    { label: 'Relay/CDN', value: result.detection.isRelay },
                    { label: 'WebRTC Leak', value: result.webrtc.hasLeak },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`p-3 rounded flex items-center justify-between ${
                        item.value ? 'bg-warning/10 border border-warning/30' : 'bg-success/10 border border-success/30'
                      }`}
                    >
                      <span className={item.value ? 'text-warning' : 'text-success'}>{item.label}</span>
                      <span className={`font-semibold ${item.value ? 'text-warning' : 'text-success'}`}>
                        {item.value ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Level Explanation */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  What This Means
                </h3>
                <div className="space-y-4 text-text-secondary">
                  {result.reverseDns.hostname && (
                    <p className="flex items-start gap-2">
                      <span className="text-accent">🌐</span>
                      Reverse DNS hostname found: <span className="font-mono text-text-primary">{result.reverseDns.hostname}</span>
                      {result.reverseDns.hostnameType === 'residential'
                        ? ' - This indicates a residential ISP connection (good).'
                        : result.reverseDns.hostnameType === 'datacenter'
                        ? ' - This indicates a datacenter or hosting provider (suspicious).'
                        : result.reverseDns.hostnameType === 'vpn'
                        ? ' - This indicates a VPN provider (high privacy, may be blocked).'
                        : ' - Hostname type detected.'
                      }
                    </p>
                  )}
                  {result.detection.isDatacenter && (
                    <p className="flex items-start gap-2">
                      <span className="text-warning">⚠️</span>
                      Your IP belongs to a datacenter. Many websites treat datacenter IPs as suspicious
                      and may block or challenge you. This is common for VPNs, proxies, and hosting services.
                    </p>
                  )}
                  {result.detection.isVPN && (
                    <p className="flex items-start gap-2">
                      <span className="text-accent">🔒</span>
                      VPN usage detected. While good for privacy, some websites may limit access or
                      show different content. Choose residential IP VPNs for best compatibility.
                    </p>
                  )}
                  {result.detection.isTor && (
                    <p className="flex items-start gap-2">
                      <span className="text-accent">🧅</span>
                      Tor exit node detected. Expect more CAPTCHAs and potential blocks from some
                      services. High anonymity but limited compatibility.
                    </p>
                  )}
                  {result.blacklistStatus.listed && (
                    <p className="flex items-start gap-2">
                      <span className="text-error">⛔</span>
                      Your IP appears on {result.blacklistStatus.lists.length} blacklist(s). This may affect email delivery,
                      website access, and online services. Consider using a different IP if experiencing issues.
                    </p>
                  )}
                  {result.webrtc.hasLeak && (
                    <p className="flex items-start gap-2">
                      <span className="text-error">🚨</span>
                      WebRTC is leaking your real IP even if you're using a VPN. Fix this in your
                      browser settings or use a WebRTC blocker extension to maintain privacy.
                    </p>
                  )}
                  {result.enhanced.netType.category === 'residential' && (
                    <p className="flex items-start gap-2">
                      <span className="text-success">✅</span>
                      Your IP appears to be a regular residential connection. This is ideal for
                      avoiding detection and has the best compatibility with all websites.
                    </p>
                  )}
                </div>
              </div>

              {/* Protection Tips */}
              <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                <h3 className="text-lg font-semibold text-warning mb-4">Privacy Recommendations</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <span className="text-warning">1.</span>
                    <span>
                      Use a reputable VPN with residential IPs to avoid datacenter detection
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">2.</span>
                    <span>
                      Disable WebRTC or use a browser extension to prevent IP leaks
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">3.</span>
                    <span>
                      Consider using anti-detect browsers with proxy integration for maximum anonymity
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">4.</span>
                    <span>
                      Ensure your timezone and language match your apparent location
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Educational Content */}
          {result && (
            <section className="mt-12 pt-12 border-t border-border/50">
              <h2 className="text-3xl font-bold text-text-primary mb-6">
                Understanding IP Tracking & Geolocation
              </h2>

              {/* What is IP Tracking */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  What Your IP Address Reveals About You
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Think of your IP address as your computer's home address on the internet. Just like how your street address tells people which house is yours, your IP address tells websites where to send the data you requested. Simple enough, right?
                  </p>
                  <p>
                    But here's where it gets interesting (and a bit creepy): your IP address reveals way more than just how to reach you. It's like having an address that also says "John Smith, lives in apartment 3B, drives a Honda, gets Amazon deliveries every Tuesday." Websites can extract a surprising amount of information from those few numbers.
                  </p>
                  <p>
                    When you visit a website, here's what they instantly know from your IP:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-text-primary">Your approximate location:</strong> Not your exact house, but usually your city and sometimes your neighborhood</li>
                    <li><strong className="text-text-primary">Your internet provider (ISP):</strong> Whether you're on Comcast, AT&T, or some other company</li>
                    <li><strong className="text-text-primary">What type of connection you're using:</strong> Home internet, mobile data, corporate network, VPN, datacenter, etc.</li>
                    <li><strong className="text-text-primary">Your timezone:</strong> Which helps them guess when you're likely to be online</li>
                    <li><strong className="text-text-primary">Whether you're likely a "real" user:</strong> Or if you're using a VPN, proxy, or datacenter IP that might indicate automation or fraud</li>
                  </ul>
                  <p>
                    The geolocation market isn't small potatoes either. It grew from $15.7 billion in 2024 to a projected $25.9 billion by 2028. That's a lot of money being made from figuring out where people are - and it shows you just how valuable this information is to businesses.
                  </p>
                </div>
              </div>

              {/* How Accurate Is It */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  How Accurate Is IP Geolocation Really?
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Here's the truth that geolocation companies don't always want to advertise: IP geolocation is fundamentally educated guesswork, not exact science. Think of it as looking at someone's area code and guessing what part of town they live in - you'll be close, but not precise.
                  </p>
                  <p>
                    MaxMind, one of the largest IP geolocation database providers, publishes their accuracy numbers. And they're pretty honest about the limitations:
                  </p>

                  {/* Accuracy Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg">
                      <thead className="bg-bg-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Level
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Accuracy
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Country</td>
                          <td className="px-4 py-3 text-sm font-semibold text-success">99.8%</td>
                          <td className="px-4 py-3 text-sm">Almost always correct</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">State/Region (US)</td>
                          <td className="px-4 py-3 text-sm font-semibold text-accent">~80%</td>
                          <td className="px-4 py-3 text-sm">Pretty reliable</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">City (50km radius)</td>
                          <td className="px-4 py-3 text-sm font-semibold text-warning">66%</td>
                          <td className="px-4 py-3 text-sm">Gets it right 2 out of 3 times</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">ISP Name (US)</td>
                          <td className="px-4 py-3 text-sm font-semibold text-success">95%</td>
                          <td className="px-4 py-3 text-sm">Very reliable for identifying your internet provider</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">Mobile Connection Type</td>
                          <td className="px-4 py-3 text-sm font-semibold text-success">95%</td>
                          <td className="px-4 py-3 text-sm">Can usually tell if you're on cellular</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>
                    Notice something? The accuracy drops dramatically as you get more specific. Country-level? Nearly perfect. City-level? Eh, maybe. Street address or specific building? Forget about it - not happening.
                  </p>
                  <p>
                    The type of connection matters a lot too. If you're on home broadband with a fixed IP address, geolocation is usually accurate down to your city or sometimes your neighborhood. But if you're on mobile data or using a corporate VPN that routes all traffic through a central location, the location could be off by hundreds of miles.
                  </p>
                  <p>
                    Network professionals are pretty clear about this: IP geolocation is more educated guesswork than precise science. It works well at the regional level but falls short when you need exact location data. And here's a key point - it's impossible to guarantee 100% accuracy because ISPs can change how they route traffic, people use VPNs, and IP addresses get reassigned.
                  </p>
                  <p>
                    Yet despite these limitations, businesses still use this data for critical decisions. A 2024 study found that location-based personalization increased conversion rates by 32% and customer satisfaction by 27%. So even imperfect location data is incredibly valuable.
                  </p>
                </div>
              </div>

              {/* VPN and DNS Leaks */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  The Reality of VPN Leaks
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    So you're using a VPN to hide your real IP and location, right? Smart move. Except... VPN usage grew by 41% between 2023 and 2025, and unfortunately, not all VPNs are created equal. Many of them leak your real IP address, completely defeating the purpose.
                  </p>
                  <p>
                    The statistics are honestly alarming. Let me break down what researchers have found when they actually tested VPN services:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-text-primary">16% of all VPNs leak users' IP addresses</strong> - That's roughly 1 in 6 VPN services failing at their primary job</li>
                    <li><strong className="text-text-primary">When 74 VPNs were tested, 15 were leaking</strong> - That's 21.62% failure rate from real-world testing</li>
                    <li><strong className="text-text-primary">23% of VPN applications leak DNS requests under specific conditions</strong> - Even if your IP is hidden, DNS leaks can reveal which websites you visit</li>
                    <li><strong className="text-text-primary">On mobile, it's even worse: 25% of VPN apps on Google Play Store have DNS leaks</strong></li>
                    <li><strong className="text-text-primary">For Android specifically: 84% of tested VPNs leaked the user's IP address</strong> - That's catastrophically bad</li>
                  </ul>
                  <p>
                    And here's the really scary part: a study of around 280 free mobile VPN apps found that 38% of them actually contained malware. Not just failing to protect you - actively putting you at risk. Another study found that 18% of free VPN apps didn't encrypt user traffic at all. They were literally doing nothing.
                  </p>
                  <p>
                    Academic research backs this up. A study presented at the Internet Measurement Conference found that 25 out of 62 VPN providers were leaking user traffic. Another study by Tatang, Dennis & Schneider (2019) revealed that nearly 4% of globally accessible DNS servers are configured in ways that could inadvertently leak sensitive information.
                  </p>
                  <p>
                    The lesson? Using "a VPN" isn't enough. You need to test for leaks regularly (which is exactly what this tool does), and you need to use a reputable VPN service. Free VPNs are almost always a bad idea - if you're not paying for the product, you ARE the product.
                  </p>
                </div>
              </div>

              {/* Privacy Implications */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Why This Matters for Your Privacy
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    You might be thinking, "Okay, so websites know my general location and ISP. So what?" Fair question. Let me paint you a picture of why this actually matters.
                  </p>
                  <p>
                    <strong className="text-text-primary">Price discrimination:</strong> Airlines and booking sites have been caught showing different prices to users from different locations. Same flight, same date, different price based on where you're connecting from. Wealthy neighborhood? Higher prices. Using a budget ISP? Maybe you'll see the discount rate.
                  </p>
                  <p>
                    <strong className="text-text-primary">Content censorship:</strong> Streaming services, news sites, and social media platforms all use your IP to decide what content you can access. Living in the wrong country? Sorry, that video isn't available. Using a VPN? Sorry, we're going to block you entirely.
                  </p>
                  <p>
                    <strong className="text-text-primary">Targeted surveillance:</strong> In 2025, research involving 500 participants demonstrated that IP geolocation can expose individuals to unauthorized tracking, data breaches, and the use of inaccurate location data that can lead to wrongful identifications. The lack of transparency around how location data is processed and protected raises serious concerns.
                  </p>
                  <p>
                    <strong className="text-text-primary">Fraud detection gone wrong:</strong> Many services use datacenter IPs as a signal of potential fraud. But what if you're a legitimate user who happens to be on a VPN? You might get blocked or forced through extra verification steps, all because the system assumes you're suspicious.
                  </p>
                  <p>
                    Here's a real-world example: if websites detect you're using a VPN or proxy, they might:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Block you entirely (looking at you, Netflix)</li>
                    <li>Show you endless CAPTCHAs</li>
                    <li>Limit your access to certain features</li>
                    <li>Flag your account as "high risk"</li>
                    <li>Charge you higher prices</li>
                    <li>Report your activity to authorities (in some countries)</li>
                  </ul>
                  <p>
                    The global market for location-based access services is projected to grow at 12% annually, reaching $7.4 billion by 2031. All this growth is built on knowing where you are and controlling what you can access based on that information.
                  </p>
                </div>
              </div>

              {/* Related Reading */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Learn More About IP Privacy
                </h3>
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    IP tracking is just one piece of the browser fingerprinting puzzle. To understand the full picture of how websites track and identify you, check out our comprehensive guides on related topics.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/learn/webrtc-leaks"
                      className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                    >
                      Learn about WebRTC leaks and how they expose your real IP
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                    <Link
                      href="/learn/browser-fingerprinting"
                    className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                  >
                    Understand how browser fingerprinting works beyond just IP addresses
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                  <p className="text-sm text-text-muted mt-4">
                    Data sources: <a href="https://support.maxmind.com/hc/en-us/articles/4407630607131-Geolocation-Accuracy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">MaxMind Geolocation Accuracy</a>, <a href="https://thebestvpn.com/vpn-leak-test/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">TheBestVPN Leak Test Study</a>, <a href="https://umatechnology.org/16-of-vpns-leak-your-ip-address-its-time-to-take-action/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">UMA Technology VPN Research</a>, <a href="https://litport.net/blog/ip-geolocation-a-comprehensive-guide-to-location-intelligence-69228" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">IP Geolocation Market 2025</a>, Tatang, Dennis & Schneider (2019), Internet Measurement Conference studies
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

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
