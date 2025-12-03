import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../index';

export const generateRoutes = new Hono<{ Bindings: Env }>();

// Query parameters schema
const generateQuerySchema = z.object({
  os: z.enum(['Windows', 'macOS', 'Linux', 'Android', 'iOS']).optional(),
  browser: z.enum(['Chrome', 'Firefox', 'Safari', 'Edge']).optional(),
  quality: z.enum(['standard', 'premium', 'verified']).optional().default('standard'),
});

// GET /generate - Generate a fingerprint
generateRoutes.get(
  '/',
  zValidator('query', generateQuerySchema),
  async (c) => {
    const { os, browser, quality } = c.req.valid('query');
    const db = c.env.DB;

    // Build query based on filters
    let query = 'SELECT * FROM fingerprints WHERE is_active = 1';
    const params: any[] = [];

    if (os) {
      query += ' AND os = ?';
      params.push(os);
    }

    if (browser) {
      query += ' AND browser = ?';
      params.push(browser);
    }

    // Quality filter
    if (quality === 'verified') {
      query += ' AND quality_score >= 90';
    } else if (quality === 'premium') {
      query += ' AND quality_score >= 70';
    } else {
      query += ' AND quality_score >= 50';
    }

    // Random selection
    query += ' ORDER BY RANDOM() LIMIT 1';

    const result = await db.prepare(query).bind(...params).first();

    if (!result) {
      return c.json({
        error: 'No fingerprint found',
        message: 'No fingerprint matching the criteria was found',
      }, 404);
    }

    // Parse JSON fields
    const languages = JSON.parse(result.languages as string || '["en-US"]');
    const fonts = JSON.parse(result.fonts as string || '[]');

    const fingerprint = {
      id: result.id,
      hash: result.hash,

      // Core identifiers
      userAgent: result.user_agent,
      platform: result.platform,

      // Screen
      screen: {
        width: result.screen_width,
        height: result.screen_height,
        availWidth: result.screen_width,
        availHeight: (result.screen_height as number) - 40, // Taskbar
        colorDepth: 24,
        pixelDepth: 24,
        devicePixelRatio: result.device_pixel_ratio,
      },

      // Hardware
      hardware: {
        hardwareConcurrency: result.hardware_concurrency,
        deviceMemory: result.device_memory,
        maxTouchPoints: result.max_touch_points,
      },

      // WebGL
      webgl: {
        vendor: result.webgl_vendor,
        renderer: result.webgl_renderer,
        version: result.webgl_version || 'WebGL 1.0',
      },

      // Locale
      locale: {
        timezone: result.timezone,
        timezoneOffset: getTimezoneOffset(result.timezone as string),
        languages: languages,
        language: languages[0] || 'en-US',
      },

      // Fonts
      fonts: fonts,

      // Hashes
      hashes: {
        canvas: result.canvas_hash,
        audio: result.audio_hash,
        webgl: result.webgl_hash || generateHash(result.webgl_renderer as string),
        fonts: generateHash(fonts.join(',')),
      },

      // Metadata
      metadata: {
        id: result.id,
        qualityScore: result.quality_score,
        source: result.source,
        collectedAt: result.collected_at,
        os: result.os,
        osVersion: result.os_version,
        browser: result.browser,
        browserVersion: result.browser_version,
      },
    };

    return c.json({ fingerprint });
  }
);

// GET /generate/export/:format - Export fingerprint in specific format
generateRoutes.get(
  '/export/:format',
  zValidator('query', generateQuerySchema),
  async (c) => {
    const format = c.req.param('format');
    const validFormats = ['json', 'puppeteer', 'playwright', 'selenium', 'mutilogin'];

    if (!validFormats.includes(format)) {
      return c.json({
        error: 'Invalid format',
        message: `Format must be one of: ${validFormats.join(', ')}`,
      }, 400);
    }

    // Get fingerprint first
    const { os, browser, quality } = c.req.valid('query');
    const db = c.env.DB;

    let query = 'SELECT * FROM fingerprints WHERE is_active = 1';
    const params: any[] = [];

    if (os) {
      query += ' AND os = ?';
      params.push(os);
    }

    if (browser) {
      query += ' AND browser = ?';
      params.push(browser);
    }

    if (quality === 'verified') {
      query += ' AND quality_score >= 90';
    } else if (quality === 'premium') {
      query += ' AND quality_score >= 70';
    } else {
      query += ' AND quality_score >= 50';
    }

    query += ' ORDER BY RANDOM() LIMIT 1';

    const result = await db.prepare(query).bind(...params).first();

    if (!result) {
      return c.json({ error: 'No fingerprint found' }, 404);
    }

    const languages = JSON.parse(result.languages as string || '["en-US"]');

    // Generate export code based on format
    let code: string;

    switch (format) {
      case 'puppeteer':
        code = generatePuppeteerCode(result, languages);
        break;
      case 'playwright':
        code = generatePlaywrightCode(result, languages);
        break;
      case 'selenium':
        code = generateSeleniumCode(result);
        break;
      case 'mutilogin':
        code = generateMutiloginProfile(result, languages);
        break;
      default:
        code = JSON.stringify(result, null, 2);
    }

    return c.json({
      format,
      code,
      fingerprint: {
        os: result.os,
        browser: result.browser,
        qualityScore: result.quality_score,
      },
    });
  }
);

// GET /generate/stats - Get available fingerprint statistics
generateRoutes.get('/stats', async (c) => {
  const db = c.env.DB;

  const stats = await db.batch([
    db.prepare('SELECT COUNT(*) as total FROM fingerprints WHERE is_active = 1'),
    db.prepare(`
      SELECT os, COUNT(*) as count
      FROM fingerprints
      WHERE is_active = 1
      GROUP BY os
      ORDER BY count DESC
    `),
    db.prepare(`
      SELECT browser, COUNT(*) as count
      FROM fingerprints
      WHERE is_active = 1
      GROUP BY browser
      ORDER BY count DESC
    `),
    db.prepare(`
      SELECT
        SUM(CASE WHEN quality_score >= 90 THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN quality_score >= 70 AND quality_score < 90 THEN 1 ELSE 0 END) as premium,
        SUM(CASE WHEN quality_score >= 50 AND quality_score < 70 THEN 1 ELSE 0 END) as standard
      FROM fingerprints
      WHERE is_active = 1
    `),
  ]);

  return c.json({
    total: (stats[0].results[0] as any)?.total || 0,
    byOS: stats[1].results,
    byBrowser: stats[2].results,
    byQuality: stats[3].results[0],
  });
});

// Helper functions
function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    'America/New_York': -300,
    'America/Chicago': -360,
    'America/Denver': -420,
    'America/Los_Angeles': -480,
    'Europe/London': 0,
    'Europe/Paris': 60,
    'Europe/Berlin': 60,
    'Asia/Tokyo': 540,
    'Asia/Shanghai': 480,
  };
  return offsets[timezone] || 0;
}

function generateHash(input: string): string {
  // Simple hash for demo - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function generatePuppeteerCode(fp: any, languages: string[]): string {
  return `const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: false,
  args: [
    '--window-size=${fp.screen_width},${fp.screen_height}',
    '--disable-blink-features=AutomationControlled',
  ],
});

const page = await browser.newPage();

await page.setUserAgent('${fp.user_agent}');

await page.setViewport({
  width: ${fp.screen_width},
  height: ${fp.screen_height},
  deviceScaleFactor: ${fp.device_pixel_ratio},
});

await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => ${fp.hardware_concurrency}
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    get: () => ${fp.device_memory}
  });
  Object.defineProperty(navigator, 'platform', {
    get: () => '${fp.platform}'
  });
  Object.defineProperty(navigator, 'languages', {
    get: () => ${JSON.stringify(languages)}
  });
  Object.defineProperty(navigator, 'maxTouchPoints', {
    get: () => ${fp.max_touch_points}
  });
});

// Your automation code here
await page.goto('https://example.com');
`;
}

function generatePlaywrightCode(fp: any, languages: string[]): string {
  return `const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: false,
});

const context = await browser.newContext({
  userAgent: '${fp.user_agent}',
  viewport: {
    width: ${fp.screen_width},
    height: ${fp.screen_height},
  },
  deviceScaleFactor: ${fp.device_pixel_ratio},
  locale: '${languages[0] || 'en-US'}',
  timezoneId: '${fp.timezone}',
  permissions: ['geolocation'],
});

// Add fingerprint overrides
await context.addInitScript(() => {
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => ${fp.hardware_concurrency}
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    get: () => ${fp.device_memory}
  });
  Object.defineProperty(navigator, 'platform', {
    get: () => '${fp.platform}'
  });
  Object.defineProperty(navigator, 'maxTouchPoints', {
    get: () => ${fp.max_touch_points}
  });
});

const page = await context.newPage();

// Your automation code here
await page.goto('https://example.com');
`;
}

function generateSeleniumCode(fp: any): string {
  return `from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument(f'--window-size=${fp.screen_width},${fp.screen_height}')
options.add_argument('user-agent=${fp.user_agent}')

# Disable automation flags
options.add_experimental_option('excludeSwitches', ['enable-automation'])
options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(options=options)

# Override navigator properties
driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
    'source': '''
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => ${fp.hardware_concurrency}
        });
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => ${fp.device_memory}
        });
        Object.defineProperty(navigator, 'platform', {
            get: () => '${fp.platform}'
        });
    '''
})

# Your automation code here
driver.get('https://example.com')
`;
}

function generateMutiloginProfile(fp: any, languages: string[]): string {
  const profile = {
    name: `Generated Profile ${Date.now()}`,
    os: fp.os,
    browser: fp.browser,
    navigator: {
      userAgent: fp.user_agent,
      platform: fp.platform,
      hardwareConcurrency: fp.hardware_concurrency,
      deviceMemory: fp.device_memory,
      languages: languages,
      maxTouchPoints: fp.max_touch_points,
    },
    screen: {
      width: fp.screen_width,
      height: fp.screen_height,
      devicePixelRatio: fp.device_pixel_ratio,
    },
    webgl: {
      vendor: fp.webgl_vendor,
      renderer: fp.webgl_renderer,
    },
    timezone: {
      id: fp.timezone,
    },
    fonts: {
      families: JSON.parse(fp.fonts || '[]'),
    },
  };

  return JSON.stringify(profile, null, 2);
}
