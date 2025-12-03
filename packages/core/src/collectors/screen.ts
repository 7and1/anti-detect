import type { ScreenData } from '@anti-detect/types';

export async function collectScreen(): Promise<ScreenData> {
  const scr = window.screen;

  return {
    width: scr.width,
    height: scr.height,
    availWidth: scr.availWidth,
    availHeight: scr.availHeight,
    colorDepth: scr.colorDepth,
    pixelDepth: scr.pixelDepth,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: scr.orientation?.type,
  };
}
