'use client';

import { useState, useEffect } from 'react';

export const runtime = 'edge';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { TrustScoreGauge } from '@/components/scanner/TrustScoreGauge';

interface ReportData {
  id: string;
  createdAt: string;
  trustScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  fingerprint: {
    navigator: {
      userAgent: string;
      platform: string;
      language: string;
      languages: string[];
      hardwareConcurrency: number;
      deviceMemory: number;
    };
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    };
    webgl: {
      vendor: string;
      renderer: string;
      hash: string;
    };
    canvas: {
      hash: string;
      isNoisy: boolean;
    };
    audio: {
      hash: string;
    };
    fonts: {
      count: number;
      hash: string;
    };
    timezone: {
      offset: number;
      name: string;
    };
  };
  detections: {
    layer: string;
    score: number;
    issues: string[];
  }[];
  consistency: {
    passed: number;
    failed: number;
    warnings: string[];
  };
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/report/${reportId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Report not found or has expired');
          } else {
            setError('Failed to load report');
          }
          return;
        }
        const data = await response.json();
        setReport(data);
      } catch {
        // For demo, generate mock data
        setReport(generateMockReport(reportId));
      } finally {
        setIsLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const generateMockReport = (id: string): ReportData => {
    return {
      id,
      createdAt: new Date().toISOString(),
      trustScore: 72,
      grade: 'C',
      fingerprint: {
        navigator: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          platform: 'Win32',
          language: 'en-US',
          languages: ['en-US', 'en'],
          hardwareConcurrency: 8,
          deviceMemory: 8,
        },
        screen: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
          pixelRatio: 1,
        },
        webgl: {
          vendor: 'Google Inc. (NVIDIA)',
          renderer: 'ANGLE (NVIDIA GeForce RTX 3080)',
          hash: 'a1b2c3d4e5f6',
        },
        canvas: {
          hash: 'f6e5d4c3b2a1',
          isNoisy: false,
        },
        audio: {
          hash: '123456789abc',
        },
        fonts: {
          count: 45,
          hash: 'abc123def456',
        },
        timezone: {
          offset: -480,
          name: 'America/Los_Angeles',
        },
      },
      detections: [
        { layer: 'Navigator', score: 85, issues: [] },
        { layer: 'Graphics', score: 70, issues: ['Canvas unprotected'] },
        { layer: 'Network', score: 65, issues: ['WebRTC leak detected'] },
        { layer: 'Automation', score: 95, issues: [] },
        { layer: 'Fonts', score: 60, issues: ['Rare font combination'] },
        { layer: 'Locale', score: 80, issues: [] },
      ],
      consistency: {
        passed: 12,
        failed: 3,
        warnings: [
          'Timezone does not match IP geolocation',
          'Canvas fingerprint is stable (trackable)',
          'WebRTC exposes local IP addresses',
        ],
      },
    };
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Browser Fingerprint Report',
        text: `Check out this browser fingerprint analysis - Trust Score: ${report?.trustScore}`,
        url: window.location.href,
      });
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-primary">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading report...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-primary">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Report Not Found</h1>
            <p className="text-text-secondary mb-6">
              {error || 'This report may have expired or the link is invalid.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg"
            >
              Run New Scan
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Share */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Fingerprint <span className="gradient-text">Report</span>
              </h1>
              <p className="text-text-muted text-sm">
                Generated {new Date(report.createdAt).toLocaleString()} • ID: {report.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-accent text-bg-primary font-semibold rounded-lg"
              >
                Share Report
              </button>
            </div>
          </div>

          {/* Trust Score */}
          <div className="p-8 rounded-lg bg-bg-secondary border border-border mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <TrustScoreGauge score={report.trustScore} grade={report.grade} />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Trust Score: {report.trustScore}/100
                </h2>
                <p className="text-text-secondary">
                  {report.trustScore >= 80
                    ? 'This browser profile appears legitimate and consistent.'
                    : report.trustScore >= 60
                    ? 'Some inconsistencies detected. May trigger soft blocks on some sites.'
                    : 'Significant issues detected. High risk of detection and blocking.'}
                </p>
              </div>
            </div>
          </div>

          {/* Detection Layers */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Detection Layers</h3>
            <div className="space-y-4">
              {report.detections.map((detection, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-24 text-text-muted text-sm">{detection.layer}</div>
                  <div className="flex-1">
                    <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          detection.score >= 80
                            ? 'bg-success'
                            : detection.score >= 60
                            ? 'bg-warning'
                            : 'bg-error'
                        }`}
                        style={{ width: `${detection.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span
                      className={`font-mono ${
                        detection.score >= 80
                          ? 'text-success'
                          : detection.score >= 60
                          ? 'text-warning'
                          : 'text-error'
                      }`}
                    >
                      {detection.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consistency Warnings */}
          {report.consistency.warnings.length > 0 && (
            <div className="p-6 rounded-lg bg-warning/10 border border-warning/30 mb-8">
              <h3 className="text-lg font-semibold text-warning mb-4">
                Consistency Warnings ({report.consistency.failed})
              </h3>
              <ul className="space-y-2">
                {report.consistency.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-3 text-text-secondary">
                    <span className="text-warning">⚠️</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fingerprint Details */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Fingerprint Details</h3>

            {/* Navigator */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-accent mb-3">Navigator</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DetailRow label="Platform" value={report.fingerprint.navigator.platform} />
                <DetailRow label="Language" value={report.fingerprint.navigator.language} />
                <DetailRow
                  label="Hardware Concurrency"
                  value={`${report.fingerprint.navigator.hardwareConcurrency} cores`}
                />
                <DetailRow
                  label="Device Memory"
                  value={`${report.fingerprint.navigator.deviceMemory} GB`}
                />
              </div>
              <div className="mt-3 p-3 bg-bg-primary rounded text-xs font-mono text-text-muted break-all">
                {report.fingerprint.navigator.userAgent}
              </div>
            </div>

            {/* Screen */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-accent mb-3">Screen</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DetailRow
                  label="Resolution"
                  value={`${report.fingerprint.screen.width}×${report.fingerprint.screen.height}`}
                />
                <DetailRow label="Color Depth" value={`${report.fingerprint.screen.colorDepth}-bit`} />
                <DetailRow label="Pixel Ratio" value={`${report.fingerprint.screen.pixelRatio}x`} />
              </div>
            </div>

            {/* WebGL */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-accent mb-3">WebGL</h4>
              <div className="grid grid-cols-1 gap-3">
                <DetailRow label="Vendor" value={report.fingerprint.webgl.vendor} />
                <DetailRow label="Renderer" value={report.fingerprint.webgl.renderer} />
                <DetailRow label="Hash" value={report.fingerprint.webgl.hash} mono />
              </div>
            </div>

            {/* Other */}
            <div>
              <h4 className="text-sm font-semibold text-accent mb-3">Other Fingerprints</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DetailRow
                  label="Canvas"
                  value={`${report.fingerprint.canvas.hash.slice(0, 16)}...`}
                  mono
                  status={report.fingerprint.canvas.isNoisy ? 'protected' : 'exposed'}
                />
                <DetailRow
                  label="Audio"
                  value={`${report.fingerprint.audio.hash.slice(0, 16)}...`}
                  mono
                />
                <DetailRow
                  label="Fonts"
                  value={`${report.fingerprint.fonts.count} detected`}
                />
                <DetailRow label="Timezone" value={report.fingerprint.timezone.name} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg text-center"
            >
              Run New Scan
            </Link>
            <Link
              href="/tools"
              className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary rounded-lg text-center transition-colors"
            >
              Explore Tools
            </Link>
            <a
              href="https://mutilogin.com/?ref=antidetect"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-success text-bg-primary font-semibold rounded-lg text-center"
            >
              Get Protected
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  status,
}: {
  label: string;
  value: string;
  mono?: boolean;
  status?: 'protected' | 'exposed';
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-bg-primary rounded">
      <span className="text-text-muted text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${mono ? 'font-mono text-terminal' : 'text-text-primary'}`}>
          {value}
        </span>
        {status && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              status === 'protected'
                ? 'bg-success/20 text-success'
                : 'bg-warning/20 text-warning'
            }`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
