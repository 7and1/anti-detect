'use client';

interface ScannerProgressProps {
  progress: number;
  status: 'idle' | 'scanning' | 'complete' | 'error';
  currentLayer?: string;
}

export function ScannerProgress({ progress, status, currentLayer }: ScannerProgressProps) {
  const getMessage = () => {
    switch (status) {
      case 'idle':
        return 'Ready to scan';
      case 'scanning':
        return currentLayer ? `Analyzing ${currentLayer}...` : 'Scanning...';
      case 'complete':
        return 'Scan complete';
      case 'error':
        return 'Scan failed';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="relative h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out rounded-full ${
            status === 'error'
              ? 'bg-error'
              : status === 'complete'
                ? 'bg-success'
                : 'bg-gradient-to-r from-accent to-terminal'
          }`}
          style={{ width: `${progress}%` }}
        />

        {/* Animated glow effect */}
        {status === 'scanning' && (
          <div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"
            style={{ left: `${Math.max(0, progress - 10)}%` }}
          />
        )}
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-text-secondary">{getMessage()}</span>
        <span className="text-sm font-mono text-text-muted">{progress}%</span>
      </div>

      {/* Radar animation when scanning */}
      {status === 'scanning' && (
        <div className="relative w-32 h-32 mx-auto mt-8">
          <div className="absolute inset-0 rounded-full border border-accent/30" />
          <div className="absolute inset-4 rounded-full border border-accent/20" />
          <div className="absolute inset-8 rounded-full border border-accent/10" />

          {/* Radar sweep */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(139, 92, 246, 0.3) 60deg, transparent 120deg)',
              animation: 'spin 2s linear infinite',
            }}
          />

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(500%);
          }
        }
      `}</style>
    </div>
  );
}
