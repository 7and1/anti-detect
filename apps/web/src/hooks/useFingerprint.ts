'use client';

import { useState, useCallback } from 'react';
import { collectAll } from '@anti-detect/core';
import type { FingerprintData } from '@anti-detect/types';

export { type FingerprintData } from '@anti-detect/types';

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const collect = useCallback(async () => {
    setIsCollecting(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates since collectAll runs in parallel
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const data = await collectAll();

      clearInterval(progressInterval);
      setProgress(100);
      setFingerprint(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Collection failed');
      throw err;
    } finally {
      setIsCollecting(false);
    }
  }, []);

  return { fingerprint, isCollecting, progress, error, collect };
}
