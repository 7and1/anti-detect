/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom performance metrics
 */

import type { Metric } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

/**
 * Thresholds for Core Web Vitals (based on Google's recommendations)
 */
const THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    poor: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    poor: 1800,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    poor: 500,
  },
};

/**
 * Get rating for a metric based on thresholds
 */
function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to analytics endpoint
 */
async function reportMetric(metric: PerformanceMetric): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Performance]', metric);
    return;
  }

  try {
    // Send to analytics endpoint
    const body = JSON.stringify({
      metrics: [metric],
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body);
    } else {
      // Fallback to fetch
      fetch('/api/analytics/vitals', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch((error) => {
        console.error('Failed to report metric:', error);
      });
    }
  } catch (error) {
    console.error('Failed to report metric:', error);
  }
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Dynamically import web-vitals to avoid bundling it on server
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
    const reportWebVital = (metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      };
      reportMetric(performanceMetric);
    };

    onCLS(reportWebVital);
    onFID(reportWebVital);
    onFCP(reportWebVital);
    onLCP(reportWebVital);
    onTTFB(reportWebVital);
    onINP(reportWebVital);
  });
}

/**
 * Mark a custom performance measurement
 */
export function markPerformance(name: string): void {
  if (typeof window === 'undefined') return;
  if (!('performance' in window)) return;

  performance.mark(name);
}

/**
 * Measure duration between two marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof window === 'undefined') return null;
  if (!('performance' in window)) return null;

  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    return measure?.duration ?? null;
  } catch (error) {
    console.error('Failed to measure performance:', error);
    return null;
  }
}

/**
 * Get navigation timing data
 */
export function getNavigationTiming(): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  if (!('performance' in window)) return null;

  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;

  if (!navigation) return null;

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * Get resource timing data
 */
export function getResourceTiming(): {
  scripts: number;
  styles: number;
  images: number;
  fonts: number;
  total: number;
} {
  if (typeof window === 'undefined')
    return { scripts: 0, styles: 0, images: 0, fonts: 0, total: 0 };
  if (!('performance' in window))
    return { scripts: 0, styles: 0, images: 0, fonts: 0, total: 0 };

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const result = {
    scripts: 0,
    styles: 0,
    images: 0,
    fonts: 0,
    total: resources.length,
  };

  resources.forEach((resource) => {
    if (resource.initiatorType === 'script') result.scripts++;
    else if (resource.initiatorType === 'css') result.styles++;
    else if (resource.initiatorType === 'img') result.images++;
    else if (resource.initiatorType === 'font') result.fonts++;
  });

  return result;
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;

  console.group('📊 Performance Metrics');

  const navigation = getNavigationTiming();
  if (navigation) {
    console.table(navigation);
  }

  const resources = getResourceTiming();
  console.table(resources);

  console.groupEnd();
}
