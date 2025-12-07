'use client';

import { useState, useEffect, useCallback } from 'react';

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
  historyKey?: string;
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

interface HistoryEntry {
  sessionId: string;
  reportId: string;
  trustScore: number;
  createdAt: number;
  issuesCount: number;
  warningsCount: number;
  deltas: {
    score: number;
    issues: number;
    warnings: number;
    fingerprintChanged: boolean;
  };
  layerChanges: Array<{
    layer: string;
    delta: number;
    current: number;
  }>;
}

interface HistorySummary {
  latestScore: number;
  deltaScore: number;
  issuesDelta: number;
  fingerprintChanged: boolean;
}

interface TrendCardProps {
  label: string;
  value: string;
  delta: number;
}

interface TrendStatusProps {
  changed: boolean;
}

const TrendCard = ({ label, value, delta }: TrendCardProps) => (
  <div className="p-4 rounded-lg bg-bg-primary border border-border/70">
    <p className="text-xs uppercase tracking-wide text-text-muted mb-1">{label}</p>
    <p className="text-2xl font-semibold text-text-primary">{value}</p>
    <p className={`text-sm font-mono ${delta >= 0 ? 'text-success' : 'text-error'}`}>
      {delta >= 0 ? '+' : ''}
      {delta}
    </p>
  </div>
);

const TrendStatus = ({ changed }: TrendStatusProps) => (
  <div className="p-4 rounded-lg bg-bg-primary border border-border/70 flex flex-col">
    <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Fingerprint Drift</p>
    <p className={`text-lg font-semibold ${changed ? 'text-warning' : 'text-success'}`}>
      {changed ? 'Changes detected' : 'Stable'}
    </p>
    <p className="text-xs text-text-muted">
      {changed ? 'Environment shifted vs previous scan' : 'Matches previous baseline'}
    </p>
  </div>
);

function generateMockReport(id: string): ReportData {
  return {
    id,
    createdAt: new Date().toISOString(),
    trustScore: 72,
    grade: 'C',
    historyKey: id,
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
}

function normalizeReportResponse(payload: any, fallbackId: string): ReportData {
  if (!payload) {
    return generateMockReport(fallbackId);
  }

  const fallback = generateMockReport(fallbackId);
  const layers = payload.scanData?.layers ?? {};
  const detections = Object.entries(layers).map(([layer, layerInfo]) => {
    const info = (layerInfo || {}) as { score?: number; checks?: Array<{ status: string; message?: string; id?: string }>; };
    const score = typeof info.score === 'number' ? info.score : 0;
    const issues = Array.isArray(info.checks)
      ? info.checks
          .filter((check) => check.status && check.status !== 'pass')
          .map((check) => check.message || check.id || 'Issue detected')
      : [];
    return { layer, score, issues };
  });

  return {
    ...fallback,
    id: payload.reportId || payload.id || fallback.id,
    createdAt: payload.createdAt || fallback.createdAt,
    trustScore: typeof payload.trustScore === 'number' ? payload.trustScore : fallback.trustScore,
    grade: payload.grade || fallback.grade,
    historyKey: payload.historyKey || fallback.historyKey,
    detections: detections.length ? detections : fallback.detections,
    consistency: {
      passed: fallback.consistency.passed,
      failed: payload.scanData?.criticalIssues?.length ?? fallback.consistency.failed,
      warnings:
        payload.scanData?.warnings?.map((warning: any) => warning.message || warning.layer || 'Warning detected') ||
        fallback.consistency.warnings,
    },
  };
}

function generateMockHistory(): { history: HistoryEntry[]; summary: HistorySummary } {
  const now = Date.now();
  const history: HistoryEntry[] = [0, 1, 2, 3].map((index) => {
    const score = 70 + index * 2;
    const prevScore = index === 3 ? score : score - 2;
    return {
      sessionId: `mock-session-${index}`,
      reportId: `mock-report-${index}`,
      trustScore: score,
      createdAt: now - index * 86400000,
      issuesCount: Math.max(0, 5 - index),
      warningsCount: Math.max(0, 4 - index),
      deltas: {
        score: index === 3 ? 0 : score - prevScore,
        issues: -1,
        warnings: -1,
        fingerprintChanged: index === 1,
      },
      layerChanges: [
        {
          layer: 'navigator',
          delta: index === 0 ? 3 : 0,
          current: score,
        },
      ],
    };
  });

  return {
    history,
    summary: {
      latestScore: history[0]?.trustScore ?? 0,
      deltaScore: history[0]?.deltas?.score ?? 0,
      issuesDelta: history[0]?.deltas?.issues ?? 0,
      fingerprintChanged: history[0]?.deltas?.fingerprintChanged ?? false,
    },
  };
}

function formatHistoryDate(timestamp: number) {
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date().toLocaleString();
  }
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params?.id as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historySummary, setHistorySummary] = useState<HistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async (historyKey: string) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/report/history/${historyKey}?limit=8`);
      if (!response.ok) {
        throw new Error('History unavailable');
      }
      const payload = await response.json();
      if (Array.isArray(payload.history) && payload.history.length > 0) {
        setHistory(payload.history);
        setHistorySummary(
          payload.summary || {
            latestScore: payload.history[0]?.trustScore ?? 0,
            deltaScore: payload.history[0].deltas?.score ?? 0,
            issuesDelta: payload.history[0].deltas?.issues ?? 0,
            fingerprintChanged: payload.history[0].deltas?.fingerprintChanged ?? false,
          }
        );
      } else {
        const mock = generateMockHistory();
        setHistory(mock.history);
        setHistorySummary(mock.summary);
      }
    } catch (err) {
      console.error(err);
      const mock = generateMockHistory();
      setHistory(mock.history);
      setHistorySummary(mock.summary);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
          setReport(generateMockReport(reportId));
          return;
        }
        const data = await response.json();
        setReport(normalizeReportResponse(data, reportId));
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

  useEffect(() => {
    if (report?.historyKey) {
      fetchHistory(report.historyKey);
    }
  }, [report?.historyKey, fetchHistory]);

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

          {(historyLoading || history.length > 0) && (
            <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Trend &amp; Drift Analytics</h3>
                {report.historyKey && (
                  <p className="text-xs text-text-muted">Profile Key: {report.historyKey.slice(0, 12)}</p>
                )}
              </div>
              {historySummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <TrendCard
                    label="Latest Score"
                    value={`${historySummary.latestScore}/100`
                    }
                    delta={historySummary.deltaScore}
                  />
                  <TrendCard
                    label="Issues Delta"
                    value={`${historySummary.issuesDelta > 0 ? '+' : ''}${historySummary.issuesDelta}`}
                    delta={historySummary.issuesDelta}
                  />
                  <TrendStatus
                    changed={historySummary.fingerprintChanged}
                  />
                </div>
              )}
              {historyLoading && (
                <p className="text-text-muted text-sm">Loading trend history…</p>
              )}
              {!historyLoading && history.length === 0 && (
                <p className="text-text-muted text-sm">No previous scans available for this profile yet.</p>
              )}
              {!historyLoading && history.length > 0 && (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.sessionId}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg bg-bg-primary border border-border/60"
                    >
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide">
                          {formatHistoryDate(entry.createdAt)}
                        </p>
                        <p className="text-lg font-semibold text-text-primary">
                          Score {entry.trustScore}
                          <span
                            className={`ml-2 text-sm font-mono ${
                              entry.deltas.score >= 0 ? 'text-success' : 'text-error'
                            }`}
                          >
                            ({entry.deltas.score >= 0 ? '+' : ''}
                            {entry.deltas.score})
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span
                          className={`px-3 py-1 rounded-full border ${
                            entry.deltas.issues <= 0
                              ? 'border-success/40 text-success'
                              : 'border-error/40 text-error'
                          }`}
                        >
                          Issues {entry.issuesCount}
                          {entry.deltas.issues !== 0 && (
                            <span className="ml-1">
                              ({entry.deltas.issues > 0 ? '+' : ''}
                              {entry.deltas.issues})
                            </span>
                          )}
                        </span>
                        <span className="px-3 py-1 rounded-full border border-border text-text-secondary">
                          {entry.deltas.fingerprintChanged ? 'Fingerprint drift' : 'Fingerprint stable'}
                        </span>
                        {entry.layerChanges.slice(0, 2).map((change) => (
                          <span key={change.layer} className="px-3 py-1 rounded-full bg-bg-secondary/80 text-text-muted border border-border">
                            {change.layer}: {change.delta >= 0 ? '+' : ''}
                            {change.delta}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
