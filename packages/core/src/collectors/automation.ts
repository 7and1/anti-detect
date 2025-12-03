import type { AutomationData } from '@anti-detect/types';

export async function collectAutomation(): Promise<AutomationData> {
  return {
    webdriver: detectWebdriver(),
    chromeRuntime: detectChromeRuntime(),
    cdpTraces: detectCDPTraces(),
    phantomJS: detectPhantomJS(),
    selenium: detectSelenium(),
    puppeteer: detectPuppeteer(),
    playwright: detectPlaywright(),
    nightmareJS: detectNightmareJS(),
  };
}

function detectWebdriver(): boolean {
  // Check navigator.webdriver
  if (navigator.webdriver === true) {
    return true;
  }

  // Check for webdriver property on document
  if ((document as any).webdriver) {
    return true;
  }

  // Check for webdriver in window
  if ((window as any).webdriver) {
    return true;
  }

  return false;
}

function detectChromeRuntime(): boolean {
  // Check for chrome.runtime (present in real Chrome)
  try {
    // In headless Chrome without extensions, this is often missing or different
    const hasRuntime = !!(window as any).chrome?.runtime;
    const hasApp = !!(window as any).chrome?.app;

    // Real Chrome typically has both
    return hasRuntime || hasApp;
  } catch {
    return false;
  }
}

function detectCDPTraces(): boolean {
  // Check for Chrome DevTools Protocol traces
  const cdpProps = [
    'cdc_adoQpoasnfa76pfcZLmcfl_Array',
    'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
    'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
    '__webdriver_script_function',
    '__driver_evaluate',
    '__webdriver_evaluate',
    '__selenium_evaluate',
    '__fxdriver_evaluate',
    '__driver_unwrapped',
    '__webdriver_unwrapped',
    '__selenium_unwrapped',
    '__fxdriver_unwrapped',
  ];

  for (const prop of cdpProps) {
    if (prop in window || prop in document) {
      return true;
    }
  }

  return false;
}

function detectPhantomJS(): boolean {
  // Check for PhantomJS signatures
  if ((window as any).callPhantom || (window as any)._phantom) {
    return true;
  }

  // Check user agent
  if (navigator.userAgent.toLowerCase().includes('phantomjs')) {
    return true;
  }

  return false;
}

function detectSelenium(): boolean {
  // Check for Selenium-specific properties
  const seleniumProps = [
    '_Selenium_IDE_Recorder',
    '_selenium',
    '__webdriver_script_fn',
    '__driver_evaluate',
    '__webdriver_evaluate',
    '__selenium_evaluate',
    '__webdriver_unwrapped',
    '__selenium_unwrapped',
  ];

  for (const prop of seleniumProps) {
    if (prop in window || prop in document) {
      return true;
    }
  }

  // Check for $cdc_ properties (Chromedriver)
  for (const prop in window) {
    if (prop.startsWith('$cdc_') || prop.startsWith('$wdc_')) {
      return true;
    }
  }

  return false;
}

function detectPuppeteer(): boolean {
  // Check for Puppeteer-specific signatures
  if ((window as any).__puppeteer_evaluation_script__) {
    return true;
  }

  // Check for HeadlessChrome in user agent
  if (navigator.userAgent.includes('HeadlessChrome')) {
    return true;
  }

  return false;
}

function detectPlaywright(): boolean {
  // Check for Playwright-specific properties
  if ((window as any).__playwright) {
    return true;
  }

  if ((window as any).__pw_manual) {
    return true;
  }

  return false;
}

function detectNightmareJS(): boolean {
  // Check for Nightmare.js signatures
  if ((window as any).__nightmare) {
    return true;
  }

  if (navigator.userAgent.includes('Nightmare')) {
    return true;
  }

  return false;
}
