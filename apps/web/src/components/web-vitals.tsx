'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/performance';

/**
 * Web Vitals monitoring component
 * Automatically tracks Core Web Vitals when mounted
 */
export function WebVitals() {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
