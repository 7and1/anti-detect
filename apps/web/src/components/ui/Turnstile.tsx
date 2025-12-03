'use client';

import { Turnstile as TurnstileWidget } from '@marsidev/react-turnstile';

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: (error?: string) => void;
  onExpire?: () => void;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

// Get site key from environment
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/**
 * Cloudflare Turnstile component for human verification
 * Wrap this in your forms that need protection
 */
export function Turnstile({
  onSuccess,
  onError,
  onExpire,
  className,
  theme = 'dark',
  size = 'normal',
}: TurnstileProps) {
  // Don't render if no site key configured
  if (!TURNSTILE_SITE_KEY) {
    console.warn('Turnstile: NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured');
    // In development, auto-succeed to allow testing
    if (process.env.NODE_ENV === 'development') {
      // Call onSuccess with a fake token after a delay
      setTimeout(() => onSuccess('dev-token-bypass'), 100);
    }
    return null;
  }

  return (
    <div className={className}>
      <TurnstileWidget
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme,
          size,
          appearance: 'interaction-only', // Only show if interaction needed
        }}
      />
    </div>
  );
}

/**
 * Invisible Turnstile - verifies in background without UI
 * Use for less critical operations where you want seamless UX
 */
export function InvisibleTurnstile({
  onSuccess,
  onError,
  onExpire,
}: Omit<TurnstileProps, 'className' | 'theme' | 'size'>) {
  if (!TURNSTILE_SITE_KEY) {
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => onSuccess('dev-token-bypass'), 100);
    }
    return null;
  }

  return (
    <TurnstileWidget
      siteKey={TURNSTILE_SITE_KEY}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      options={{
        size: 'invisible',
      }}
    />
  );
}
