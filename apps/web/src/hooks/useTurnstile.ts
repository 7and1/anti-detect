'use client';

import { useState, useCallback, useRef } from 'react';

interface TurnstileState {
  token: string | null;
  isVerifying: boolean;
  error: string | null;
}

/**
 * Hook for managing Cloudflare Turnstile verification
 * Use this with the Turnstile component to protect API calls
 */
export function useTurnstile() {
  const [state, setState] = useState<TurnstileState>({
    token: null,
    isVerifying: false,
    error: null,
  });

  const tokenRef = useRef<string | null>(null);

  // Handle successful verification
  const onSuccess = useCallback((token: string) => {
    tokenRef.current = token;
    setState({
      token,
      isVerifying: false,
      error: null,
    });
  }, []);

  // Handle verification error
  const onError = useCallback((error?: string) => {
    tokenRef.current = null;
    setState({
      token: null,
      isVerifying: false,
      error: error || 'Verification failed',
    });
  }, []);

  // Handle expiration (token needs refresh)
  const onExpire = useCallback(() => {
    tokenRef.current = null;
    setState((prev) => ({
      ...prev,
      token: null,
      error: 'Token expired, please verify again',
    }));
  }, []);

  // Reset state (call when retrying)
  const reset = useCallback(() => {
    tokenRef.current = null;
    setState({
      token: null,
      isVerifying: false,
      error: null,
    });
  }, []);

  // Get headers for API calls
  const getHeaders = useCallback((): Record<string, string> => {
    if (!tokenRef.current) {
      return {};
    }
    return {
      'X-Turnstile-Token': tokenRef.current,
    };
  }, []);

  return {
    token: state.token,
    isVerifying: state.isVerifying,
    error: state.error,
    isVerified: !!state.token,
    onSuccess,
    onError,
    onExpire,
    reset,
    getHeaders,
  };
}

/**
 * Fetch wrapper that includes Turnstile token
 * Use this for protected API calls
 */
export async function fetchWithTurnstile(
  url: string,
  token: string | null,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('X-Turnstile-Token', token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
