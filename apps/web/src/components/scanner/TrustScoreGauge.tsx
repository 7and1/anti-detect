'use client';

import { useEffect, useState } from 'react';

interface TrustScoreGaugeProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TrustScoreGauge({
  score,
  grade,
  animate = true,
  size = 'lg',
}: TrustScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentScore = Math.round(start + (score - start) * easeOutQuart);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, animate]);

  const getGradeColor = () => {
    switch (grade) {
      case 'A':
        return 'text-success';
      case 'B':
        return 'text-green-400';
      case 'C':
        return 'text-warning';
      case 'D':
        return 'text-orange-500';
      case 'F':
        return 'text-error';
      default:
        return 'text-text-muted';
    }
  };

  const getGradeBg = () => {
    switch (grade) {
      case 'A':
        return 'from-success/20 to-success/5';
      case 'B':
        return 'from-green-400/20 to-green-400/5';
      case 'C':
        return 'from-warning/20 to-warning/5';
      case 'D':
        return 'from-orange-500/20 to-orange-500/5';
      case 'F':
        return 'from-error/20 to-error/5';
      default:
        return 'from-text-muted/20 to-text-muted/5';
    }
  };

  const getGlowColor = () => {
    switch (grade) {
      case 'A':
        return 'shadow-success/30';
      case 'B':
        return 'shadow-green-400/30';
      case 'C':
        return 'shadow-warning/30';
      case 'D':
        return 'shadow-orange-500/30';
      case 'F':
        return 'shadow-error/30';
      default:
        return 'shadow-text-muted/30';
    }
  };

  const sizeClasses = {
    sm: {
      container: 'w-32 h-32',
      score: 'text-3xl',
      grade: 'text-lg',
      label: 'text-xs',
    },
    md: {
      container: 'w-48 h-48',
      score: 'text-5xl',
      grade: 'text-2xl',
      label: 'text-sm',
    },
    lg: {
      container: 'w-64 h-64',
      score: 'text-7xl',
      grade: 'text-3xl',
      label: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  // SVG arc parameters
  const strokeWidth = size === 'lg' ? 12 : size === 'md' ? 10 : 8;
  const radius = size === 'lg' ? 110 : size === 'md' ? 80 : 52;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const offset = arcLength - (arcLength * displayScore) / 100;

  return (
    <div className={`relative ${classes.container}`}>
      {/* Background glow */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-radial ${getGradeBg()} blur-2xl opacity-50`}
      />

      {/* SVG Gauge */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-[135deg]"
        viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}
      >
        {/* Track */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-bg-tertiary"
          strokeDasharray={`${arcLength} ${circumference}`}
        />

        {/* Progress */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
          style={{
            filter: `drop-shadow(0 0 ${size === 'lg' ? 8 : 4}px currentColor)`,
          }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${classes.score} font-bold ${getGradeColor()} font-mono`}>
          {displayScore}
        </span>
        <span className={`${classes.grade} font-bold ${getGradeColor()} -mt-2`}>
          Grade {grade}
        </span>
        <span className={`${classes.label} text-text-muted mt-1`}>Trust Score</span>
      </div>
    </div>
  );
}
