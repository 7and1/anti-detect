import type { TimezoneData } from '@anti-detect/types';

export async function collectTimezone(): Promise<TimezoneData> {
  const offset = new Date().getTimezoneOffset();

  let name = 'Unknown';

  try {
    // Use Intl API if available
    name = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback: estimate from offset
    name = estimateTimezoneFromOffset(offset);
  }

  // Check if DST is active
  const jan = new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(new Date().getFullYear(), 6, 1).getTimezoneOffset();
  const dst = Math.max(jan, jul) !== offset;

  return {
    name,
    offset,
    dst,
  };
}

function estimateTimezoneFromOffset(offset: number): string {
  // Common timezone mappings by offset
  const offsetMap: Record<number, string> = {
    0: 'UTC',
    60: 'Europe/Paris',
    120: 'Europe/Athens',
    180: 'Europe/Moscow',
    240: 'Asia/Dubai',
    300: 'Asia/Karachi',
    330: 'Asia/Kolkata',
    360: 'Asia/Dhaka',
    420: 'Asia/Bangkok',
    480: 'Asia/Shanghai',
    540: 'Asia/Tokyo',
    600: 'Australia/Sydney',
    660: 'Pacific/Auckland',
    720: 'Pacific/Fiji',
    '-60': 'Atlantic/Azores',
    '-120': 'America/Sao_Paulo',
    '-180': 'America/Buenos_Aires',
    '-240': 'America/Halifax',
    '-300': 'America/New_York',
    '-360': 'America/Chicago',
    '-420': 'America/Denver',
    '-480': 'America/Los_Angeles',
    '-540': 'America/Anchorage',
    '-600': 'Pacific/Honolulu',
  };

  return offsetMap[offset.toString()] || `UTC${offset >= 0 ? '-' : '+'}${Math.abs(offset / 60)}`;
}
