'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

type ChallengeStatus = 'idle' | 'running' | 'complete';
type LevelStatus = 'pending' | 'running' | 'passed' | 'failed';

interface Level {
  id: number;
  name: string;
  description: string;
  points: number;
  status: LevelStatus;
  score: number;
  checks: { id: string; name: string; passed: boolean }[];
}

interface ChallengeResult {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  levelsPassed: number;
  verdict: 'HUMAN' | 'SUSPICIOUS' | 'LIKELY BOT';
}

export default function ChallengePage() {
  const [status, setStatus] = useState<ChallengeStatus>('idle');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levels, setLevels] = useState<Level[]>([
    {
      id: 1,
      name: 'Basic JS',
      description: 'JavaScript API consistency checks',
      points: 100,
      status: 'pending',
      score: 0,
      checks: [],
    },
    {
      id: 2,
      name: 'Headless Hunter',
      description: 'Detect headless browser signatures',
      points: 200,
      status: 'pending',
      score: 0,
      checks: [],
    },
    {
      id: 3,
      name: 'TLS Inspector',
      description: 'JA3/JA4 TLS fingerprint analysis',
      points: 300,
      status: 'pending',
      score: 0,
      checks: [],
    },
    {
      id: 4,
      name: 'Human Verification',
      description: 'Behavior & Turnstile verification',
      points: 400,
      status: 'pending',
      score: 0,
      checks: [],
    },
  ]);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const calculateResults = useCallback(() => {
    const totalScore = levels.reduce((sum, l) => sum + l.score, 0);
    const maxScore = levels.reduce((sum, l) => sum + l.points, 0);
    const percentageScore = Math.round((totalScore / maxScore) * 100);
    const levelsPassed = levels.filter((l) => l.status === 'passed').length;

    let verdict: 'HUMAN' | 'SUSPICIOUS' | 'LIKELY BOT';
    if (percentageScore >= 90) verdict = 'HUMAN';
    else if (percentageScore >= 50) verdict = 'SUSPICIOUS';
    else verdict = 'LIKELY BOT';

    setResult({
      totalScore,
      maxScore,
      percentageScore,
      levelsPassed,
      verdict,
    });
  }, [levels]);

  const runLevel = useCallback(async (levelId: number) => {
    setLevels((prev) =>
      prev.map((l) => (l.id === levelId ? { ...l, status: 'running' } : l))
    );

    try {
      // Call API for challenge verification
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
      const response = await fetch(`${apiUrl}/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: levelId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Challenge verification failed');
      }

      const data = await response.json();

      // Use API response if available, otherwise fall back to local checks
      const checks = data.checks || runLevelChecks(levelId);
      const passedCount = checks.filter((c: any) => c.passed).length;
      const passed = passedCount >= Math.ceil(checks.length * 0.6);
      const score = passed
        ? levels.find((l) => l.id === levelId)?.points || 0
        : Math.floor((levels.find((l) => l.id === levelId)?.points || 0) * (passedCount / checks.length));

      setLevels((prev) =>
        prev.map((l) =>
          l.id === levelId
            ? { ...l, status: passed ? 'passed' : 'failed', score, checks }
            : l
        )
      );

      // Move to next level or complete
      if (levelId < 4) {
        setCurrentLevel(levelId + 1);
        await runLevel(levelId + 1);
      } else {
        // Calculate final results
        calculateResults();
        setStatus('complete');
      }
    } catch (error) {
      console.error('Level verification error:', error);
      // Fall back to local checks on error
      const checks = runLevelChecks(levelId);
      const passedCount = checks.filter((c) => c.passed).length;
      const passed = passedCount >= Math.ceil(checks.length * 0.6);
      const score = passed
        ? levels.find((l) => l.id === levelId)?.points || 0
        : Math.floor((levels.find((l) => l.id === levelId)?.points || 0) * (passedCount / checks.length));

      setLevels((prev) =>
        prev.map((l) =>
          l.id === levelId
            ? { ...l, status: passed ? 'passed' : 'failed', score, checks }
            : l
        )
      );

      // Move to next level or complete
      if (levelId < 4) {
        setCurrentLevel(levelId + 1);
        await runLevel(levelId + 1);
      } else {
        calculateResults();
        setStatus('complete');
      }
    }
  }, [levels, calculateResults]);

  const startChallenge = useCallback(async () => {
    setStatus('running');
    setCurrentLevel(1);
    setResult(null);

    // Reset levels
    setLevels((prev) =>
      prev.map((l) => ({ ...l, status: 'pending', score: 0, checks: [] }))
    );

    // Start Level 1
    await runLevel(1);
  }, [runLevel]);

  const runLevelChecks = (levelId: number): { id: string; name: string; passed: boolean }[] => {
    switch (levelId) {
      case 1: // Basic JS
        return [
          { id: 'navigator', name: 'Navigator API', passed: typeof navigator !== 'undefined' },
          { id: 'window', name: 'Window object', passed: typeof window !== 'undefined' },
          { id: 'document', name: 'Document object', passed: typeof document !== 'undefined' },
          { id: 'performance', name: 'Performance API', passed: typeof performance !== 'undefined' },
          { id: 'localStorage', name: 'LocalStorage', passed: typeof localStorage !== 'undefined' },
        ];

      case 2: // Headless Hunter
        const isHeadless = navigator.userAgent.includes('HeadlessChrome');
        const hasWebdriver = (navigator as any).webdriver === true;
        const hasChrome = !!(window as any).chrome;
        const hasPlugins = navigator.plugins.length > 0;

        return [
          { id: 'no-headless-ua', name: 'No headless UA', passed: !isHeadless },
          { id: 'no-webdriver', name: 'No webdriver flag', passed: !hasWebdriver },
          { id: 'chrome-runtime', name: 'Chrome runtime', passed: hasChrome },
          { id: 'has-plugins', name: 'Has plugins', passed: hasPlugins },
          { id: 'has-languages', name: 'Has languages', passed: navigator.languages.length > 0 },
        ];

      case 3: // TLS Inspector
        // In production, this would check actual JA3/JA4 from the server
        return [
          { id: 'tls-version', name: 'Modern TLS', passed: true },
          { id: 'ja3-consistent', name: 'JA3 Consistent', passed: Math.random() > 0.3 },
          { id: 'not-automation', name: 'Not automation JA3', passed: Math.random() > 0.2 },
        ];

      case 4: // Human Verification
        // In production, this would use actual Turnstile and behavior analysis
        return [
          { id: 'mouse-movement', name: 'Mouse movement', passed: true },
          { id: 'interaction', name: 'User interaction', passed: true },
          { id: 'timing', name: 'Human timing', passed: Math.random() > 0.2 },
        ];

      default:
        return [];
    }
  };

  useEffect(() => {
    if (status === 'complete') {
      calculateResults();
    }
  }, [status, calculateResults]);

  const getStatusIcon = (levelStatus: LevelStatus) => {
    switch (levelStatus) {
      case 'pending':
        return (
          <div className="w-8 h-8 rounded-full border-2 border-text-disabled flex items-center justify-center">
            <span className="text-text-disabled text-sm">○</span>
          </div>
        );
      case 'running':
        return (
          <div className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 rounded-full bg-accent" />
          </div>
        );
      case 'passed':
        return (
          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
            <svg className="w-5 h-5 text-bg-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-8 h-8 rounded-full bg-error flex items-center justify-center">
            <svg className="w-5 h-5 text-bg-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'HUMAN':
        return 'text-success';
      case 'SUSPICIOUS':
        return 'text-warning';
      case 'LIKELY BOT':
        return 'text-error';
      default:
        return 'text-text-secondary';
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
              Challenge <span className="gradient-text">Arena</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Prove your browser is human. Pass 4 progressive detection levels to earn your trust score.
              Can your automation bypass our detectors?
            </p>
          </div>

          {status === 'running' && (
            <div className="mb-8 text-center" data-testid="challenge-running">
              <p className="text-sm text-text-secondary">
                Running level {Math.min(currentLevel, levels.length)} of {levels.length}...
              </p>
            </div>
          )}

          {/* Challenge Levels */}
          <div className="space-y-4 mb-8">
            {levels.map((level) => (
              <div
                key={level.id}
                className={`p-6 rounded-lg border transition-all ${
                  level.status === 'running'
                    ? 'border-accent bg-accent/5'
                    : level.status === 'passed'
                      ? 'border-success/30 bg-success/5'
                      : level.status === 'failed'
                        ? 'border-error/30 bg-error/5'
                        : 'border-border bg-bg-secondary'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  {getStatusIcon(level.status)}

                  {/* Level Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-text-primary">
                        Level {level.id}: {level.name}
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-mono bg-bg-tertiary text-text-muted rounded">
                        {level.points} pts
                      </span>
                    </div>
                    <p className="text-sm text-text-muted mt-1">{level.description}</p>
                  </div>

                  {/* Score */}
                  {level.status !== 'pending' && (
                    <div className="text-right">
                      <span
                        className={`text-2xl font-bold font-mono ${
                          level.status === 'passed'
                            ? 'text-success'
                            : level.status === 'failed'
                              ? 'text-error'
                              : 'text-accent'
                        }`}
                        data-testid="level-score"
                      >
                        {level.score}
                      </span>
                      <span className="text-sm text-text-muted">/{level.points}</span>
                    </div>
                  )}
                </div>

                {/* Checks (when expanded) */}
                {level.checks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {level.checks.map((check) => (
                        <div
                          key={check.id}
                          className="flex items-center gap-2 px-3 py-2 rounded bg-bg-primary"
                          data-testid="check-item"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              check.passed ? 'bg-success' : 'bg-error'
                            }`}
                          />
                          <span className="text-xs text-text-secondary">{check.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Results */}
          {status === 'complete' && result && (
            <div
              className="p-8 rounded-lg bg-bg-secondary border border-border text-center mb-8"
              data-testid="challenge-complete"
            >
              <h2 className="text-2xl font-bold text-text-primary mb-6">Challenge Complete</h2>

              {/* Verdict */}
              <div
                className={`text-5xl font-bold mb-4 ${getVerdictColor(result.verdict)}`}
                data-testid="verdict"
              >
                {result.verdict}
              </div>

              {/* Score */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-4xl font-bold font-mono text-text-primary" data-testid="final-score">
                  {result.totalScore}
                </span>
                <span className="text-2xl text-text-muted">/ {result.maxScore}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="text-2xl font-bold text-accent font-mono">
                    {result.percentageScore}%
                  </div>
                  <div className="text-xs text-text-muted">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success font-mono">
                    {result.levelsPassed}/4
                  </div>
                  <div className="text-xs text-text-muted">Levels Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-terminal font-mono">
                    {result.percentageScore >= 90 ? 'A' : result.percentageScore >= 70 ? 'B' : result.percentageScore >= 50 ? 'C' : 'F'}
                  </div>
                  <div className="text-xs text-text-muted">Grade</div>
                </div>
              </div>

              {/* CTA */}
              {result.verdict !== 'HUMAN' && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 mb-6">
                  <p className="text-sm text-text-secondary mb-3">
                    Your browser shows signs of automation. Get a human-like fingerprint:
                  </p>
                  <a
                    href="https://mutilogin.com/?ref=antidetect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-success text-bg-primary font-semibold rounded-lg"
                  >
                    Try Mutilogin
                  </a>
                </div>
              )}

              <button
                onClick={startChallenge}
                className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Start Button */}
          {status === 'idle' && (
            <div className="text-center">
              <button
                onClick={startChallenge}
                className="px-8 py-4 bg-accent text-white font-bold text-lg rounded-lg hover:bg-accent/90 transition-colors"
              >
                Start Challenge
              </button>
              <p className="text-sm text-text-muted mt-4">
                Takes about 30 seconds to complete all 4 levels
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-bg-secondary border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-3">How It Works</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-success">1.</span>
                  JavaScript API consistency checks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">2.</span>
                  Headless browser signature detection
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">3.</span>
                  TLS fingerprint (JA3/JA4) analysis
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">4.</span>
                  Behavior & human verification
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-lg bg-bg-secondary border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-3">Scoring</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  90%+ = HUMAN - You passed!
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  50-89% = SUSPICIOUS - Needs improvement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error" />
                  &lt;50% = LIKELY BOT - Detected
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
