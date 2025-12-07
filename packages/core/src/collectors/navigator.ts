import type { NavigatorData } from '@anti-detect/types';

export async function collectNavigator(): Promise<NavigatorData> {
  const nav = window.navigator;

  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    languages: Array.from(nav.languages || []),
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: (nav as any).deviceMemory,
    maxTouchPoints: nav.maxTouchPoints || 0,
    webdriver: nav.webdriver === true,
    vendor: nav.vendor,
    vendorSub: nav.vendorSub,
    product: nav.product,
    productSub: nav.productSub,
    appName: nav.appName,
    appCodeName: nav.appCodeName,
    appVersion: nav.appVersion,
  };
}
