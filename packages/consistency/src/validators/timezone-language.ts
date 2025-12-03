import type { ConsistencyRule, ValidationInput, RuleResult } from '../types';

// Timezone to region mapping
const TIMEZONE_REGIONS: Record<string, string[]> = {
  'America/New_York': ['US', 'CA'],
  'America/Chicago': ['US', 'CA', 'MX'],
  'America/Denver': ['US', 'CA', 'MX'],
  'America/Los_Angeles': ['US', 'CA', 'MX'],
  'America/Anchorage': ['US'],
  'Pacific/Honolulu': ['US'],
  'America/Toronto': ['CA'],
  'America/Vancouver': ['CA'],
  'America/Sao_Paulo': ['BR'],
  'America/Buenos_Aires': ['AR'],
  'America/Mexico_City': ['MX'],
  'Europe/London': ['GB', 'IE', 'PT'],
  'Europe/Paris': ['FR', 'BE', 'NL', 'LU', 'MC', 'AD'],
  'Europe/Berlin': ['DE', 'AT', 'CH', 'LI'],
  'Europe/Rome': ['IT', 'SM', 'VA'],
  'Europe/Madrid': ['ES'],
  'Europe/Moscow': ['RU', 'BY'],
  'Europe/Kiev': ['UA'],
  'Europe/Warsaw': ['PL'],
  'Europe/Amsterdam': ['NL', 'BE'],
  'Europe/Brussels': ['BE', 'LU'],
  'Europe/Zurich': ['CH', 'LI'],
  'Europe/Vienna': ['AT'],
  'Europe/Stockholm': ['SE'],
  'Europe/Oslo': ['NO'],
  'Europe/Copenhagen': ['DK'],
  'Europe/Helsinki': ['FI', 'EE'],
  'Europe/Athens': ['GR', 'CY'],
  'Europe/Istanbul': ['TR'],
  'Asia/Tokyo': ['JP'],
  'Asia/Seoul': ['KR'],
  'Asia/Shanghai': ['CN', 'TW', 'HK', 'MO'],
  'Asia/Hong_Kong': ['HK', 'CN'],
  'Asia/Singapore': ['SG', 'MY'],
  'Asia/Bangkok': ['TH', 'VN', 'KH', 'LA'],
  'Asia/Jakarta': ['ID'],
  'Asia/Manila': ['PH'],
  'Asia/Kolkata': ['IN'],
  'Asia/Dubai': ['AE', 'OM'],
  'Asia/Riyadh': ['SA'],
  'Asia/Jerusalem': ['IL'],
  'Asia/Karachi': ['PK'],
  'Asia/Dhaka': ['BD'],
  'Australia/Sydney': ['AU'],
  'Australia/Melbourne': ['AU'],
  'Australia/Brisbane': ['AU'],
  'Australia/Perth': ['AU'],
  'Pacific/Auckland': ['NZ'],
  'Africa/Cairo': ['EG'],
  'Africa/Lagos': ['NG'],
  'Africa/Johannesburg': ['ZA'],
};

// Language to country mapping
const LANGUAGE_COUNTRIES: Record<string, string[]> = {
  'en': ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'SG', 'IN', 'PH'],
  'en-US': ['US', 'CA'],
  'en-GB': ['GB', 'IE', 'AU', 'NZ', 'ZA'],
  'de': ['DE', 'AT', 'CH', 'LI'],
  'fr': ['FR', 'BE', 'CH', 'CA', 'LU'],
  'es': ['ES', 'MX', 'AR', 'CO', 'CL', 'PE'],
  'it': ['IT', 'CH', 'SM'],
  'pt': ['PT', 'BR'],
  'pt-BR': ['BR'],
  'nl': ['NL', 'BE'],
  'ru': ['RU', 'BY', 'KZ', 'UA'],
  'pl': ['PL'],
  'ja': ['JP'],
  'ko': ['KR'],
  'zh': ['CN', 'TW', 'HK', 'SG'],
  'zh-CN': ['CN'],
  'zh-TW': ['TW'],
  'ar': ['SA', 'AE', 'EG', 'JO', 'LB'],
  'hi': ['IN'],
  'th': ['TH'],
  'vi': ['VN'],
  'id': ['ID'],
  'tr': ['TR'],
  'he': ['IL'],
  'sv': ['SE'],
  'no': ['NO'],
  'da': ['DK'],
  'fi': ['FI'],
  'el': ['GR', 'CY'],
  'uk': ['UA'],
  'cs': ['CZ'],
  'hu': ['HU'],
  'ro': ['RO'],
};

/**
 * Timezone and Language consistency validation rules
 */
export const timezoneLanguageRules: ConsistencyRule[] = [
  {
    id: 'timezone-ip-mismatch',
    name: 'Timezone/IP Mismatch',
    description: 'Timezone does not match IP geolocation',
    severity: 'warning',
    penalty: 10,
    category: 'timezone-language',
    check: (data: ValidationInput): RuleResult => {
      if (!data.ipInfo) {
        return { passed: true, message: null };
      }

      const tz = data.fingerprint.timezone.name;
      const ipCountry = data.ipInfo.countryCode;
      const expectedCountries = TIMEZONE_REGIONS[tz];

      if (expectedCountries && !expectedCountries.includes(ipCountry)) {
        return {
          passed: false,
          message: `Timezone ${tz} unexpected for IP country ${ipCountry}`,
          details: { timezone: tz, ipCountry, expectedCountries },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'language-timezone-mismatch',
    name: 'Language/Timezone Mismatch',
    description: 'Primary language unusual for timezone region',
    severity: 'info',
    penalty: 5,
    category: 'timezone-language',
    check: (data: ValidationInput): RuleResult => {
      const lang = data.fingerprint.navigator.language;
      const tz = data.fingerprint.timezone.name;

      // Extract language code
      const langCode = lang.split('-')[0] || lang;

      // Check for obvious mismatches
      // Japanese timezone with non-Asian language
      if (tz === 'Asia/Tokyo' && !['ja', 'en', 'ko', 'zh'].includes(langCode)) {
        return {
          passed: false,
          message: `Language ${lang} unusual for timezone ${tz}`,
          details: { language: lang, timezone: tz },
        };
      }

      // Korean timezone with non-Korean/English
      if (tz === 'Asia/Seoul' && !['ko', 'en', 'ja'].includes(langCode)) {
        return {
          passed: false,
          message: `Language ${lang} unusual for timezone ${tz}`,
          details: { language: lang, timezone: tz },
        };
      }

      // Chinese timezone with European language
      if (tz === 'Asia/Shanghai' && ['de', 'fr', 'it', 'es', 'pt'].includes(langCode)) {
        return {
          passed: false,
          message: `Language ${lang} unusual for timezone ${tz}`,
          details: { language: lang, timezone: tz },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'language-ip-mismatch',
    name: 'Language/IP Mismatch',
    description: 'Primary language unusual for IP country',
    severity: 'info',
    penalty: 3,
    category: 'timezone-language',
    check: (data: ValidationInput): RuleResult => {
      if (!data.ipInfo) {
        return { passed: true, message: null };
      }

      const lang = data.fingerprint.navigator.language;
      const ipCountry = data.ipInfo.countryCode;
      const langCountries = LANGUAGE_COUNTRIES[lang];

      // Only flag if we have mapping and countries don't match
      if (langCountries && !langCountries.includes(ipCountry)) {
        // English is common everywhere, so reduce severity
        if (lang.startsWith('en')) {
          return { passed: true, message: null };
        }

        return {
          passed: false,
          message: `Language ${lang} unusual for IP country ${ipCountry}`,
          details: { language: lang, ipCountry, expectedCountries: langCountries },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'timezone-offset-mismatch',
    name: 'Timezone Offset Mismatch',
    description: 'Timezone offset does not match timezone name',
    severity: 'warning',
    penalty: 8,
    category: 'timezone-language',
    check: (data: ValidationInput): RuleResult => {
      const tz = data.fingerprint.timezone.name;
      const offset = data.fingerprint.timezone.offset;

      // Known timezone offsets (in minutes, negative = ahead of UTC)
      const expectedOffsets: Record<string, number[]> = {
        'America/New_York': [-300, -240], // EST/EDT
        'America/Chicago': [-360, -300], // CST/CDT
        'America/Denver': [-420, -360], // MST/MDT
        'America/Los_Angeles': [-480, -420], // PST/PDT
        'America/Anchorage': [-540, -480], // AKST/AKDT
        'Pacific/Honolulu': [-600], // HST
        'Europe/London': [0, -60], // GMT/BST
        'Europe/Paris': [-60, -120], // CET/CEST
        'Europe/Berlin': [-60, -120],
        'Europe/Moscow': [-180], // MSK
        'Asia/Tokyo': [-540], // JST
        'Asia/Shanghai': [-480], // CST
        'Asia/Singapore': [-480], // SGT
        'Asia/Kolkata': [-330], // IST
        'Asia/Dubai': [-240], // GST
        'Australia/Sydney': [-600, -660], // AEST/AEDT
        'Pacific/Auckland': [-720, -780], // NZST/NZDT
        'UTC': [0],
      };

      const expected = expectedOffsets[tz];
      if (expected && !expected.includes(offset)) {
        return {
          passed: false,
          message: `Timezone offset ${offset} does not match ${tz}`,
          details: { timezone: tz, offset, expectedOffsets: expected },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'languages-order',
    name: 'Languages Order',
    description: 'Primary language should be first in languages array',
    severity: 'info',
    penalty: 2,
    category: 'timezone-language',
    check: (data: ValidationInput): RuleResult => {
      const language = data.fingerprint.navigator.language;
      const languages = data.fingerprint.navigator.languages;

      if (languages.length > 0 && languages[0] !== language) {
        return {
          passed: false,
          message: `Primary language ${language} not first in languages array`,
          details: { language, languages: languages.slice(0, 3) },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'timezone-invalid',
    name: 'Invalid Timezone',
    description: 'Timezone name should be a valid IANA timezone',
    severity: 'warning',
    penalty: 5,
    category: 'timezone-language',
    check: (data: ValidationInput): RuleResult => {
      const tz = data.fingerprint.timezone.name;

      // Check if it looks like a valid IANA timezone
      const validPatterns = [
        /^(Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_]+$/,
        /^UTC$/,
        /^Etc\/(GMT|UTC)/,
      ];

      const isValid = validPatterns.some((pattern) => pattern.test(tz)) || tz === 'Unknown';

      if (!isValid) {
        return {
          passed: false,
          message: `Invalid timezone format: ${tz}`,
          details: { timezone: tz },
        };
      }

      return { passed: true, message: null };
    },
  },
];
