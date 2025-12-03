'use client';

import { useState } from 'react';

interface Check {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value: string | number | boolean;
  message?: string;
}

interface DetectionCardProps {
  layerId: string;
  layerName: string;
  icon: React.ReactNode;
  score: number;
  status: 'pass' | 'warn' | 'fail';
  checks: Check[];
  isExpanded?: boolean;
}

export function DetectionCard({
  layerId,
  layerName,
  icon,
  score,
  status,
  checks,
  isExpanded: defaultExpanded = false,
}: DetectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded badge-pass">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            PASS
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded badge-warn">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            WARN
          </span>
        );
      case 'fail':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded badge-fail">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            FAIL
          </span>
        );
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'pass':
        return 'border-success/30 hover:border-success/50';
      case 'warn':
        return 'border-warning/30 hover:border-warning/50';
      case 'fail':
        return 'border-error/30 hover:border-error/50';
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-error';
  };

  return (
    <div
      className={`rounded-lg border bg-bg-secondary transition-all duration-200 ${getBorderColor()}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-secondary">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{layerName}</h3>
            <p className="text-xs text-text-muted font-mono uppercase">{layerId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-2xl font-bold font-mono ${getScoreColor()}`}>{score}</span>
          {getStatusBadge(status)}
          <svg
            className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border">
          <div className="space-y-2">
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between py-2 px-3 rounded bg-bg-primary"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      check.status === 'pass'
                        ? 'bg-success'
                        : check.status === 'warn'
                          ? 'bg-warning'
                          : 'bg-error'
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary">{check.name}</span>
                    {check.message && (
                      <p className="text-xs text-text-muted mt-0.5">{check.message}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-mono text-text-secondary truncate max-w-[200px]">
                  {typeof check.value === 'boolean'
                    ? check.value
                      ? 'Yes'
                      : 'No'
                    : String(check.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Icon components for each layer
export const LayerIcons = {
  network: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  ),
  navigator: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  graphics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  audio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  ),
  fonts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
      />
    </svg>
  ),
  locale: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  automation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
};
