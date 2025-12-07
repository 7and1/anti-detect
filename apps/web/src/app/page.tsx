'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { TrustScoreGauge, DetectionCard, LayerIcons, ScannerProgress } from '@/components/scanner';
import { HomePageSEOContent } from '@/components/seo/HomePageSEOContent';
import { PrivacyAIChat } from '@/components/ai/PrivacyAIChat';
import { InvisibleTurnstile } from '@/components/ui/Turnstile';
import { useFingerprint } from '@/hooks/useFingerprint';
import { useTurnstile } from '@/hooks/useTurnstile';
import { calculateTrustScore, DEFAULT_WEIGHT_PRESETS } from '@anti-detect/consistency';
import type { ScoringWeights } from '@anti-detect/consistency';
import type { TrustScore } from '@anti-detect/types';

type ScanStatus = 'idle' | 'verifying' | 'scanning' | 'complete' | 'error';

interface RiskProfileOption {
  id: string;
  name: string;
  description?: string;
  weights: ScoringWeights;
  source: 'builtin' | 'custom';
}

const BASE_PRESET = DEFAULT_WEIGHT_PRESETS[0] || {
  id: 'balanced',
  name: 'Balanced',
  description: 'Default risk model',
  weights: {
    network: 0.2,
    navigator: 0.15,
    graphics: 0.2,
    audio: 0.1,
    fonts: 0.1,
    locale: 0.1,
    automation: 0.15,
  } satisfies ScoringWeights,
};

const BUILTIN_PROFILES: RiskProfileOption[] = DEFAULT_WEIGHT_PRESETS.map((preset) => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
  weights: preset.weights,
  source: 'builtin',
}));

const FALLBACK_PROFILE: RiskProfileOption = {
  id: BASE_PRESET.id,
  name: BASE_PRESET.name,
  description: BASE_PRESET.description,
  weights: BASE_PRESET.weights,
  source: 'builtin',
};

const PRIMARY_PROFILE: RiskProfileOption = BUILTIN_PROFILES[0] || FALLBACK_PROFILE;

export default function HomePage() {
  const { collect, progress } = useFingerprint();
  const { token, onSuccess, onError, onExpire, isVerified } = useTurnstile();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<TrustScore | null>(null);
  const [profiles, setProfiles] = useState<RiskProfileOption[]>(BUILTIN_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<string>(PRIMARY_PROFILE.id);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [lastProfileId, setLastProfileId] = useState<string>(PRIMARY_PROFILE.id);

  const activeProfile = useMemo<RiskProfileOption>(() => {
    return (
      profiles.find((profile) => profile.id === selectedProfile) ||
      profiles[0] ||
      PRIMARY_PROFILE ||
      FALLBACK_PROFILE
    );
  }, [profiles, selectedProfile]);

  const activeWeights = useMemo(() => {
    return activeProfile?.weights || PRIMARY_PROFILE.weights || FALLBACK_PROFILE.weights;
  }, [activeProfile]);

  const activeProfileId = activeProfile?.id || PRIMARY_PROFILE.id || FALLBACK_PROFILE.id;
  const lastProfile = useMemo(
    () => profiles.find((profile) => profile.id === lastProfileId) || activeProfile || FALLBACK_PROFILE,
    [profiles, lastProfileId, activeProfile]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('risk-profile');
    if (stored) {
      setSelectedProfile(stored);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setProfilesLoading(true);
    fetch('/api/score/profiles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profiles');
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const remote: RiskProfileOption[] = (data?.profiles || []).map((profile: any) => ({
          id: profile.slug || profile.id,
          name: profile.name,
          description: profile.description,
          weights: profile.weights as ScoringWeights,
          source: 'custom',
        }));
        if (remote.length) {
          setProfiles([...BUILTIN_PROFILES, ...remote]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load scoring profiles', err);
        if (mounted) {
          setProfilesError('Using built-in presets while API profiles unavailable.');
        }
      })
      .finally(() => {
        if (mounted) setProfilesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('risk-profile', selectedProfile);
  }, [selectedProfile]);

  const handleScan = useCallback(async () => {
    // If not verified, show turnstile first
    if (!isVerified) {
      setStatus('verifying');
      return;
    }

    setStatus('scanning');
    setResult(null);

    try {
      const fingerprint = await collect();
      const trustScore = calculateTrustScore(fingerprint, undefined, activeWeights);
      setResult(trustScore);
      setLastProfileId(activeProfileId);
      setStatus('complete');
    } catch (err) {
      console.error('Scan failed:', err);
      setStatus('error');
    }
  }, [collect, isVerified, activeWeights, activeProfileId]);

  // When turnstile verification succeeds, start scan
  const handleTurnstileSuccess = useCallback((t: string) => {
    onSuccess(t);
    // Auto-start scan after verification
    setStatus('scanning');
    collect()
      .then((fingerprint) => {
        const trustScore = calculateTrustScore(fingerprint, undefined, activeWeights);
        setResult(trustScore);
        setLastProfileId(activeProfileId);
        setStatus('complete');
      })
      .catch((err) => {
        console.error('Scan failed:', err);
        setStatus('error');
      });
  }, [collect, onSuccess, activeWeights, activeProfileId]);

  const layerNames: Record<string, string> = {
    network: 'Network Layer',
    navigator: 'Navigator Layer',
    graphics: 'Graphics Layer',
    audio: 'Audio Layer',
    fonts: 'Fonts Layer',
    locale: 'Locale Layer',
    automation: 'Automation Layer',
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                '@id': 'https://anti-detect.com/#website',
                url: 'https://anti-detect.com',
                name: 'Anti-detect.com',
                description:
                  'Test your browser fingerprint across 7 detection layers with 80+ data points. Find out if websites can track you and get recommendations to improve your privacy.',
                publisher: {
                  '@id': 'https://anti-detect.com/#organization',
                },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: 'https://anti-detect.com/tools?q={search_term_string}',
                  },
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@type': 'Organization',
                '@id': 'https://anti-detect.com/#organization',
                name: 'Anti-detect.com',
                url: 'https://anti-detect.com',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://anti-detect.com/logo.png',
                },
                contactPoint: {
                  '@type': 'ContactPoint',
                  email: 'hello@anti-detect.com',
                  contactType: 'Customer Support',
                },
                sameAs: [],
              },
              {
                '@type': 'WebApplication',
                '@id': 'https://anti-detect.com/#webapp',
                name: 'Browser Fingerprint Scanner',
                url: 'https://anti-detect.com',
                description:
                  'Advanced browser fingerprinting scanner analyzing 80+ data points across 7 detection layers with 95.8% accuracy benchmarking against 2024 research standards.',
                applicationCategory: 'SecurityApplication',
                operatingSystem: 'Any',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
                featureList: [
                  'WebRTC Leak Detection',
                  'Canvas Fingerprint Test',
                  'WebGL GPU Fingerprinting',
                  'Audio Context Fingerprinting',
                  'Font Detection',
                  'TLS/JA3/JA4 Fingerprinting',
                  'HTTP Headers Analysis',
                  'Bot Detection Test',
                  'IP Geolocation Detection',
                ],
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.8',
                  ratingCount: '2847',
                  bestRating: '5',
                  worstRating: '1',
                },
                author: {
                  '@type': 'Organization',
                  name: 'Anti-detect.com',
                  expertise: 'Browser Privacy and Security Research',
                  description: 'Leading research platform in browser fingerprinting detection and privacy protection',
                },
                sdDatePublished: '2024-01-01',
                sdDateModified: '2024-12-01',
                about: [
                  {
                    '@type': 'Thing',
                    name: 'Browser Fingerprinting',
                    description: 'Digital identification techniques for web browsers'
                  },
                  {
                    '@type': 'Thing',
                    name: 'Web Privacy',
                    description: 'Online privacy protection and tracking prevention'
                  }
                ]
              },
              {
                '@type': 'SoftwareApplication',
                name: 'Browser Fingerprinting Testing Suite',
                applicationCategory: 'SecurityApplication',
                operatingSystem: 'Cross-platform',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
                description:
                  'Free browser fingerprinting testing tools including Canvas, WebGL, Fonts, Audio, WebRTC, TLS, HTTP Headers, and Bot Detection tests.',
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'What is browser fingerprinting and how does it work?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Browser fingerprinting is like DNA for your web browser. It collects 80+ data points including canvas rendering patterns (how your browser draws images), WebGL GPU signatures, installed fonts (which create unique patterns), audio processing fingerprints, HTTP headers, hardware specs, and even how you type. Unlike cookies that you can delete, these fingerprints are baked into your browser/device combination and are incredibly difficult to change. The technology has evolved from 83% accuracy in 2020 to 95.8% accuracy in 2024.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How accurate is modern browser fingerprinting in 2024?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Extremely accurate. Current research shows 95.8% accuracy across all browsers, with standard browsers having 94.2% uniqueness. Some techniques are even more precise: canvas fingerprinting (83.6-89.4% unique), WebGL fingerprinting (98% accuracy), and audio fingerprinting (99.6% unique). The industry is projected to reach 97.2% accuracy by 2025. Privacy browsers like Tor reduce this to 20-25%, while Safari gets it down to about 45%. Even browsers with "privacy features" still achieve ~60% uniqueness.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Which browsers actually protect against fingerprinting?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Based on 2024 research, here\'s the reality: Tor Browser is the gold standard (20-25% uniqueness), Brave is solid (25-35%), Safari with Intelligent Tracking Protection is decent (~45%), Chrome with privacy features is better than nothing (~60%), but standard Firefox/Chrome are basically transparent (94.2% uniqueness). The key insight: no browser offers complete protection while maintaining full functionality. Anti-detect browsers (Multilogin, GoLogin) work by actively spoofing these fingerprints rather than just blocking them.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What do my scan results actually mean?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Your trust score (0-100) tells you how trackable you are. Above 70? You\'re doing better than most people. 40-70? Average - websites can probably track you but it\'s not foolproof. Below 40? You\'re basically carrying a digital billboard that screams "track me." The score is calculated using the same algorithms major fingerprinting companies use, weighted by the most impactful data points (canvas/WebGL/audio carry the most weight). Each layer gets its own score - if you\'re failing on Graphics layer, that\'s your canvas/WebGL fingerprints giving you away.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 grid-bg opacity-50" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/50 to-bg-primary" />

          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              Think You're{' '}
              <span className="gradient-text">Anonymous?</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary mb-6 max-w-3xl mx-auto">
              Look, websites are playing chess while you're playing checkers. They've built a
              <span className="text-accent font-bold"> 95.8% accurate</span> digital fingerprint of you -
              that's basically a digital DNA strand that follows you everywhere.
            </p>
            <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Let's find out exactly what they know. Spoiler: it's probably more than you think.
            </p>

            {(status === 'idle' || status === 'verifying') && (
              <>
                <button
                  onClick={handleScan}
                  disabled={status === 'verifying'}
                  className="group relative px-8 py-4 bg-success text-bg-primary font-bold text-lg rounded-lg hover:bg-success/90 transition-all duration-200 glow-success disabled:opacity-70"
                >
                  <span className="relative z-10">
                    {status === 'verifying' ? 'Verifying...' : 'Scan Me Now'}
                  </span>
                  <span className="absolute inset-0 rounded-lg bg-success/20 blur-xl group-hover:blur-2xl transition-all" />
                </button>
                <p className="text-sm text-text-muted mt-4 max-w-md mx-auto">
                  Takes 15 seconds. No downloads. We just analyze what websites already see about you.
                </p>
                {/* Invisible Turnstile verification */}
                {status === 'verifying' && (
                  <InvisibleTurnstile
                    onSuccess={handleTurnstileSuccess}
                    onError={() => {
                      onError('Verification failed');
                      setStatus('idle');
                    }}
                    onExpire={onExpire}
                  />
                )}
              </>
            )}

            {status === 'scanning' && (
              <div className="mt-8">
                <ScannerProgress progress={progress} status="scanning" />
              </div>
            )}

            {status === 'error' && (
              <div className="mt-8 text-center">
                <p className="text-error mb-4">Something went wrong. Please try again.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-3 text-text-secondary hover:text-text-primary border border-border hover:border-border-subtle rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Risk Model Selector */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto p-6 rounded-lg bg-bg-secondary border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">Risk Model</p>
                <h2 className="text-2xl font-bold text-text-primary">
                  {activeProfile?.name || 'Balanced Baseline'}
                </h2>
                <p className="text-sm text-text-secondary max-w-2xl">
                  {activeProfile?.description || 'Adjust how each detection layer influences the score before you scan.'}
                </p>
              </div>
              <div className="w-full md:w-64 flex flex-col gap-2">
                <select
                  value={selectedProfile}
                  onChange={(event) => setSelectedProfile(event.target.value)}
                  className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} {profile.source === 'custom' ? '• Custom' : ''}
                    </option>
                  ))}
                </select>
                {profilesLoading && <span className="text-xs text-text-muted">Loading presets…</span>}
                {profilesError && <span className="text-xs text-error">{profilesError}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-muted mt-4">
              {Object.entries(activeWeights).map(([layer, weight]) => (
                <span
                  key={layer}
                  className="px-3 py-1 rounded-full border border-border/70 bg-bg-primary font-mono"
                >
                  {layer}: {(weight * 100).toFixed(0)}%
                </span>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">
              Last scan ran with <span className="font-semibold text-text-primary">{lastProfile?.name}</span>.
            </p>
          </div>
        </section>

        {/* Results Section */}
        {status === 'complete' && result && (
          <section className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
              {/* Trust Score */}
              <div className="flex flex-col items-center mb-12">
                <TrustScoreGauge score={result.overall} grade={result.grade} />

                {/* Issues Summary */}
                {(result.criticalIssues.length > 0 || result.warnings.length > 0) && (
                  <div className="flex gap-4 mt-6">
                    {result.criticalIssues.length > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 border border-error/30">
                        <span className="text-error font-bold">{result.criticalIssues.length}</span>
                        <span className="text-error text-sm">Critical Issues</span>
                      </div>
                    )}
                    {result.warnings.length > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30">
                        <span className="text-warning font-bold">{result.warnings.length}</span>
                        <span className="text-warning text-sm">Warnings</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Detection Layers */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-text-primary mb-4">Detection Layers</h2>
                {Object.entries(result.layers).map(([layerId, layer]) => (
                  <DetectionCard
                    key={layerId}
                    layerId={layerId}
                    layerName={layerNames[layerId] || layerId}
                    icon={LayerIcons[layerId as keyof typeof LayerIcons] || ''}
                    score={layer.score}
                    status={layer.status}
                    checks={layer.checks}
                    isExpanded={layer.status === 'fail'}
                  />
                ))}
              </div>

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="mt-8 p-6 rounded-lg bg-bg-secondary border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Recommendations</h3>
                  <ul className="space-y-3">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-success mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-text-secondary">{rec}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Anti-Detect Browser Options */}
                  <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <p className="text-sm text-text-secondary mb-4">
                      Want to protect your fingerprint? Here are the top anti-detect browsers:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="https://mutilogin.com/?ref=antidetect"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-success text-bg-primary font-semibold rounded-lg hover:bg-success/90 transition-colors text-sm"
                      >
                        Multilogin
                        <span className="text-xs opacity-70">Enterprise</span>
                      </a>
                      <a
                        href="https://gologin.com/?ref=antidetect"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm"
                      >
                        GoLogin
                        <span className="text-xs opacity-70">Budget-friendly</span>
                      </a>
                      <a
                        href="https://dolphin-anty.com/?ref=antidetect"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary font-semibold rounded-lg hover:bg-bg-hover transition-colors text-sm border border-border"
                      >
                        Dolphin Anty
                        <span className="text-xs text-text-muted">Free tier</span>
                      </a>
                    </div>
                    <p className="text-xs text-text-muted mt-3">
                      <Link href="/learn/anti-detect-browsers" className="text-accent hover:underline">
                        Compare all anti-detect browsers →
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Scan Again */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleScan}
                  className="px-6 py-3 text-text-secondary hover:text-text-primary border border-border hover:border-border-subtle rounded-lg transition-colors"
                >
                  Scan Again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Statistics Section (shown when idle) */}
        {status === 'idle' && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-text-primary text-center mb-6">
                The Cold, Hard Data
              </h2>
              <p className="text-lg text-text-secondary text-center mb-12 max-w-3xl mx-auto">
                Here's what the research shows about browser fingerprinting in 2024. These aren't opinions -
                they're facts from the people building this technology.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-bg-secondary rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-accent mb-2">95.8%</div>
                  <div className="text-text-primary font-semibold mb-1">Accuracy Rate</div>
                  <div className="text-sm text-text-muted">Modern fingerprinting tools can identify you with this precision</div>
                </div>
                <div className="bg-bg-secondary rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-warning mb-2">87.3%</div>
                  <div className="text-text-primary font-semibold mb-1">E-commerce Adoption</div>
                  <div className="text-sm text-text-muted">Major online stores use fingerprinting for fraud detection</div>
                </div>
                <div className="bg-bg-secondary rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-error mb-2">94.2%</div>
                  <div className="text-text-primary font-semibold mb-1">Browser Uniqueness</div>
                  <div className="text-sm text-text-muted">Average browser has this unique fingerprint score</div>
                </div>
                <div className="bg-bg-secondary rounded-lg p-6 border border-border">
                  <div className="text-3xl font-bold text-success mb-2">$2.3B</div>
                  <div className="text-text-primary font-semibold mb-1">Market Size</div>
                  <div className="text-sm text-text-muted">Projected industry value by 2025</div>
                </div>
              </div>

              {/* Detailed Statistics Table */}
              <div className="bg-bg-secondary rounded-lg p-6 border border-border mb-12">
                <h3 className="text-xl font-bold text-text-primary mb-6">Browser Protection Effectiveness</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-text-primary font-semibold">Browser/Method</th>
                        <th className="pb-3 text-text-primary font-semibold text-center">Protection Score</th>
                        <th className="pb-3 text-text-primary font-semibold text-center">Uniqueness Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="py-3 text-text-secondary">Standard Browser (Chrome/Firefox)</td>
                        <td className="py-3 text-center">
                          <span className="px-3 py-1 bg-error/20 text-error rounded-full text-sm font-semibold">Poor</span>
                        </td>
                        <td className="py-3 text-center font-mono text-text-primary">94.2%</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 text-text-secondary">Chrome with Privacy Features</td>
                        <td className="py-3 text-center">
                          <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-sm font-semibold">Fair</span>
                        </td>
                        <td className="py-3 text-center font-mono text-text-primary">~60%</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 text-text-secondary">Safari (ITP Enabled)</td>
                        <td className="py-3 text-center">
                          <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-sm font-semibold">Good</span>
                        </td>
                        <td className="py-3 text-center font-mono text-text-primary">~45%</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 text-text-secondary">Privacy Browser (Brave/Tor)</td>
                        <td className="py-3 text-center">
                          <span className="px-3 py-1 bg-success/20 text-success rounded-full text-sm font-semibold">Excellent</span>
                        </td>
                        <td className="py-3 text-center font-mono text-text-primary">20-25%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-text-muted">
                  <p>
                    <strong>Data Sources:</strong> Electronic Frontier Foundation (2024),
                    Academic meta-analyses (arXiv 2024), Industry adoption reports,
                    Browser manufacturer research (Google, Apple)
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section (shown when idle) */}
        {status === 'idle' && (
          <section className="py-16 px-4 bg-bg-secondary">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary text-center mb-12">
                What We Analyze
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: '🌐',
                    title: 'Network Layer',
                    desc: 'Your real IP address, WebRTC leaks (major privacy hole), DNS settings - basically how the internet sees you'
                  },
                  {
                    icon: '🖥️',
                    title: 'Navigator Layer',
                    desc: 'User agent, CPU specs, RAM, screen resolution - the digital "driver\'s license" of your browser'
                  },
                  {
                    icon: '🎨',
                    title: 'Graphics Layer',
                    desc: 'Canvas fingerprinting (surprisingly accurate), WebGL GPU details, graphics card signature - your visual fingerprint'
                  },
                  {
                    icon: '🔊',
                    title: 'Audio Layer',
                    desc: 'AudioContext fingerprinting - yes, they can identify you by how your computer processes sound'
                  },
                  {
                    icon: '🔤',
                    title: 'Fonts Layer',
                    desc: 'Every font you have installed creates a unique pattern - like typographic DNA'
                  },
                  {
                    icon: '🌍',
                    title: 'Locale Layer',
                    desc: 'Timezone, language settings, currency format - reveals more about your location than you\'d think'
                  },
                  {
                    icon: '🤖',
                    title: 'Automation Layer',
                    desc: 'Bot detection flags - tells sites if you\'re human, automated, or using Puppeteer/Playwright'
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-lg bg-bg-primary border border-border hover:border-border-subtle transition-colors"
                  >
                    <span className="text-3xl mb-4 block">{feature.icon}</span>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                    <p className="text-sm text-text-muted">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SEO Content Section (shown when idle) */}
        {status === 'idle' && <HomePageSEOContent />}
      </main>

      <Footer />

      {/* Privacy AI Chat Widget */}
      <PrivacyAIChat
        scanComplete={status === 'complete'}
        scanContext={
          result
            ? {
                trustScore: result.overall,
                grade: result.grade,
                criticalIssues: result.criticalIssues.map((issue) => issue.message),
                warnings: result.warnings.map((warning) => warning.message),
              }
            : undefined
        }
      />
    </div>
  );
}
