'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface WebRTCResult {
  localIPs: string[];
  publicIP: string | null;
  hasLeak: boolean;
  stunResults: {
    server: string;
    localCandidate: string | null;
    reflexiveCandidate: string | null;
  }[];
}

export default function WebRTCPage() {
  const [result, setResult] = useState<WebRTCResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const STUN_SERVERS = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun.cloudflare.com:3478',
  ];

  const runTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const localIPs: string[] = [];
      let publicIP: string | null = null;
      const stunResults: WebRTCResult['stunResults'] = [];

      const RTCPeerConnection =
        window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection ||
        (window as any).mozRTCPeerConnection;

      if (!RTCPeerConnection) {
        setResult({
          localIPs: [],
          publicIP: null,
          hasLeak: false,
          stunResults: [],
        });
        return;
      }

      for (const server of STUN_SERVERS) {
        const stunResult = await testStunServer(server, RTCPeerConnection);
        stunResults.push(stunResult);

        if (stunResult.localCandidate) {
          const ip = extractIP(stunResult.localCandidate);
          if (ip && !localIPs.includes(ip) && isPrivateIP(ip)) {
            localIPs.push(ip);
          }
        }

        if (stunResult.reflexiveCandidate) {
          const ip = extractIP(stunResult.reflexiveCandidate);
          if (ip && !isPrivateIP(ip)) {
            publicIP = ip;
          }
        }
      }

      setResult({
        localIPs,
        publicIP,
        hasLeak: localIPs.length > 0 || publicIP !== null,
        stunResults,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testStunServer = async (
    server: string,
    RTCPeerConnection: typeof window.RTCPeerConnection
  ): Promise<WebRTCResult['stunResults'][0]> => {
    return new Promise((resolve) => {
      const result = {
        server,
        localCandidate: null as string | null,
        reflexiveCandidate: null as string | null,
      };

      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: server }],
        });

        const timeout = setTimeout(() => {
          pc.close();
          resolve(result);
        }, 3000);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            if (candidate.includes('host')) {
              result.localCandidate = candidate;
            } else if (candidate.includes('srflx')) {
              result.reflexiveCandidate = candidate;
            }
          }
        };

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            pc.close();
            resolve(result);
          }
        };

        pc.createDataChannel('test');
        pc.createOffer().then((offer) => pc.setLocalDescription(offer));
      } catch {
        resolve(result);
      }
    });
  };

  const extractIP = (candidate: string): string | null => {
    const match = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    return match ? (match[1] ?? null) : null;
  };

  const isPrivateIP = (ip: string): boolean => {
    return /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)/.test(ip);
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
              WebRTC <span className="gradient-text">Leak Test</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Check if your browser is leaking your real IP address through WebRTC.
              VPNs don't always protect against this leak.
            </p>
          </div>

          {/* Result Card */}
          <div
            className={`p-8 rounded-lg border mb-8 ${
              result?.hasLeak
                ? 'border-error/50 bg-error/10'
                : 'border-success/50 bg-success/10'
            }`}
          >
            <div className="text-center">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-text-secondary">Testing WebRTC...</span>
                </div>
              ) : result ? (
                <>
                  <div
                    className={`text-6xl mb-4 ${
                      result.hasLeak ? 'text-error' : 'text-success'
                    }`}
                  >
                    {result.hasLeak ? '⚠️' : '✓'}
                  </div>
                  <h2
                    className={`text-2xl font-bold mb-2 ${
                      result.hasLeak ? 'text-error' : 'text-success'
                    }`}
                  >
                    {result.hasLeak ? 'WebRTC Leak Detected!' : 'No WebRTC Leak'}
                  </h2>
                  <p className="text-text-secondary">
                    {result.hasLeak
                      ? 'Your real IP address is exposed through WebRTC'
                      : 'Your browser is not leaking IP addresses via WebRTC'}
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
              {/* Local IPs */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Local IP Addresses
                </h3>
                {result.localIPs.length > 0 ? (
                  <div className="space-y-2">
                    {result.localIPs.map((ip, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 rounded bg-error/10 border border-error/30"
                      >
                        <span className="text-error">⚠️</span>
                        <span className="font-mono text-error">{ip}</span>
                        <span className="text-xs text-error/70">LEAKED</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded bg-success/10 border border-success/30">
                    <span className="text-success">✓</span>
                    <span className="text-success">No local IPs exposed</span>
                  </div>
                )}
              </div>

              {/* Public IP */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Public IP Address
                </h3>
                {result.publicIP ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded bg-warning/10 border border-warning/30">
                    <span className="text-warning">⚠️</span>
                    <span className="font-mono text-warning">{result.publicIP}</span>
                    <span className="text-xs text-warning/70">VISIBLE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded bg-success/10 border border-success/30">
                    <span className="text-success">✓</span>
                    <span className="text-success">No public IP exposed via WebRTC</span>
                  </div>
                )}
              </div>

              {/* STUN Server Results */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  STUN Server Tests
                </h3>
                <div className="space-y-2">
                  {result.stunResults.map((stun, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 rounded bg-bg-primary"
                    >
                      <span className="text-sm font-mono text-text-muted">{stun.server}</span>
                      <div className="flex items-center gap-2">
                        {stun.localCandidate || stun.reflexiveCandidate ? (
                          <span className="px-2 py-1 text-xs bg-error/10 text-error rounded">
                            Candidates Found
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-success/10 text-success rounded">
                            No Leaks
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fix Recommendations */}
              {result.hasLeak && (
                <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                  <h3 className="text-lg font-semibold text-warning mb-4">
                    How to Fix WebRTC Leaks
                  </h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-warning">1.</span>
                      <span>Use a browser extension like WebRTC Leak Prevent or uBlock Origin</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">2.</span>
                      <span>
                        In Firefox, set `media.peerconnection.enabled` to `false` in about:config
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">3.</span>
                      <span>Use an anti-detect browser with built-in WebRTC protection</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-warning">4.</span>
                      <span>Configure your VPN to block WebRTC (if supported)</span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-4 border-t border-warning/30">
                    <a
                      href="https://mutilogin.com/?ref=antidetect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-success text-bg-primary font-semibold rounded-lg"
                    >
                      Get WebRTC Protection with Mutilogin
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
                Understanding WebRTC Leaks
              </h2>

              {/* What is WebRTC */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  What is WebRTC?
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Think of WebRTC as your browser's built-in phone system. It lets you make video calls, share your screen, or chat with someone directly - without needing to download any special software. Pretty cool, right?
                  </p>
                  <p>
                    Over 3 billion devices worldwide use WebRTC every day for video conferencing, online gaming, and real-time collaboration. You've probably used it yourself on platforms like Google Meet, Discord, or Zoom's web version.
                  </p>
                  <p>
                    But here's the catch: to connect you directly with another person (imagine two phones trying to find each other), WebRTC needs to know where you are on the internet. That's where your IP address comes in. And that's also where the privacy problem starts.
                  </p>
                </div>
              </div>

              {/* How Leaks Happen */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  How Do WebRTC Leaks Happen?
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Here's the thing: when you use a VPN, you're basically sending all your internet traffic through a secret tunnel. The tunnel hides your real IP address from websites. Smart, right?
                  </p>
                  <p>
                    But WebRTC doesn't always play by those rules. It uses something called STUN servers (Session Traversal Utilities for NAT) to figure out how to connect you directly to another person. When WebRTC talks to these STUN servers, it sometimes goes around your VPN tunnel - like a kid sneaking out through the back door when mom said to use the front entrance.
                  </p>
                  <p>
                    What gets leaked? Two types of addresses:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong className="text-text-primary">Local IP addresses</strong> - Think of this like your apartment number in a building. It shows you're behind a router (like 192.168.1.5). Not super dangerous alone, but it's extra information trackers love.
                    </li>
                    <li>
                      <strong className="text-text-primary">Public IP addresses</strong> - This is your real internet address. The big one. The address your VPN is supposed to hide. When this leaks, websites know exactly where you really are.
                    </li>
                  </ul>
                  <p>
                    The scariest part? This happens silently. No permission prompts. No warnings. No "Are you sure you want to share your IP?" alerts. It just... happens.
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
                    Let's say you're using a VPN because you want privacy. Maybe you're traveling and want to watch your home country's Netflix. Maybe you're a journalist protecting your sources. Maybe you just don't want your internet provider knowing every website you visit.
                  </p>
                  <p>
                    You think you're protected. But if WebRTC is leaking, websites can see your real IP address. They know you're using a VPN (because the VPN's IP doesn't match your real one). They know where you actually are. Your privacy protection just... doesn't work.
                  </p>
                  <p>
                    Real-world implications:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Advertisers can track you across websites even with a VPN</li>
                    <li>Streaming services can detect and block VPN users</li>
                    <li>Your ISP can see which sites you visit, defeating the VPN's purpose</li>
                    <li>In countries with restricted internet, your real location gets exposed</li>
                  </ul>
                  <p>
                    And here's a sobering fact: this vulnerability was discovered way back in 2015 by security researcher Daniel Roesler. Nearly a decade later, it's still a problem. Why? Because the IP exchange isn't a bug - it's literally how WebRTC is designed to work. You can't tell WebRTC to skip finding your IP address; that's like asking your phone to make calls without dialing a number.
                  </p>
                </div>
              </div>

              {/* Statistics & Research */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  What The Research Shows
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Security researchers have been studying this problem for years, and the numbers are eye-opening. Let me break down what the latest research tells us:
                  </p>

                  {/* Statistics Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg">
                      <thead className="bg-bg-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Finding
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Impact
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Source
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">84% of VPN users affected</td>
                          <td className="px-4 py-3 text-sm">Without specific protection, most VPN users are vulnerable</td>
                          <td className="px-4 py-3 text-sm text-accent">
                            <a
                              href="https://www.security.org/vpn/webrtc-leak/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Security.org 2024
                            </a>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">3+ billion devices use WebRTC</td>
                          <td className="px-4 py-3 text-sm">The scope of potential exposure is massive</td>
                          <td className="px-4 py-3 text-sm text-accent">
                            <a
                              href="https://www.security.org/vpn/webrtc-leak/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Industry estimates 2024
                            </a>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Chrome is most leakage-prone</td>
                          <td className="px-4 py-3 text-sm">Exposes CGNAT addresses on mobile, metadata on desktop</td>
                          <td className="px-4 py-3 text-sm text-accent">
                            <a
                              href="https://arxiv.org/pdf/2510.16168"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              arXiv 2025 Study
                            </a>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Firefox leaks on Android only</td>
                          <td className="px-4 py-3 text-sm">Strong desktop protection, but mobile users exposed</td>
                          <td className="px-4 py-3 text-sm text-accent">
                            <a
                              href="https://arxiv.org/pdf/2510.16168"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              arXiv 2025 Study
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">Tor Browser prevents all leaks</td>
                          <td className="px-4 py-3 text-sm">Only browser with complete WebRTC leak protection</td>
                          <td className="px-4 py-3 text-sm text-accent">
                            <a
                              href="https://arxiv.org/pdf/2510.16168"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              arXiv 2025 Study
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>
                    A 2025 cross-platform study published on arXiv examined WebRTC metadata leakage across current browser builds. The researchers tested Chrome, Brave, Firefox, and Tor on both desktop and mobile platforms. Their findings are both detailed and concerning.
                  </p>
                  <p>
                    Chrome turned out to be the worst offender, consistently leaking local network information. Brave doesn't leak IP addresses directly, but it exposes session-stable mDNS identifiers (think of these as fingerprints that can still identify you). Firefox does great on desktop but fails on Android. Only Tor Browser completely blocks all forms of WebRTC leakage.
                  </p>
                  <p>
                    Another important study by Nibert and colleagues (CRiSIS 2024) found that even with VPNs, SOCKS proxies, or HTTP/S proxies active, WebRTC can still leak sensitive public IP addresses - particularly in large corporate networks without NAT (Network Address Translation). Their solution? Confining Firefox in a Docker container. It worked, but it's hardly a solution for regular users.
                  </p>
                  <p>
                    The persistent theme across all this research? WebRTC leaks are architectural, not accidental. The protocol needs to exchange IP addresses to function. Researchers Al-Fannah (2017), Fakis (2020), and Tang (2023) all documented how this "feature" creates privacy vulnerabilities that persist even with modern protections.
                  </p>
                </div>
              </div>

              {/* Related Reading */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Want to Learn More?
                </h3>
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    If you found this information helpful, check out our comprehensive guide on WebRTC leaks. It dives deeper into the technical details, shows you exactly how the attacks work, and explains multiple ways to protect yourself.
                  </p>
                  <a
                    href="/learn/webrtc-leaks"
                    className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                  >
                    Read the complete WebRTC Leaks guide
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
                    Research sources: Security.org, arXiv (2025), Al-Fannah et al. (2017), Nibert et al. (CRiSIS 2024), Fakis et al. (2020), Tang et al. (2023)
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
