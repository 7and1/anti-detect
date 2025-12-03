import type { FingerprintData } from '@anti-detect/types';
import {
  collectNavigator,
  collectScreen,
  collectWebGL,
  collectCanvas,
  collectAudio,
  collectFonts,
  collectTimezone,
  collectPlugins,
  collectWebRTC,
  collectAutomation,
} from './collectors';

/**
 * Collect all fingerprint data in parallel
 */
export async function collectAll(): Promise<FingerprintData> {
  // Run all collectors in parallel for speed
  const [
    navigator,
    screen,
    webgl,
    canvas,
    audio,
    fonts,
    timezone,
    plugins,
    webrtc,
    automation,
  ] = await Promise.all([
    collectNavigator(),
    collectScreen(),
    collectWebGL(),
    collectCanvas(),
    collectAudio(),
    collectFonts(),
    collectTimezone(),
    collectPlugins(),
    collectWebRTC(),
    collectAutomation(),
  ]);

  return {
    navigator,
    screen,
    webgl,
    canvas,
    audio,
    fonts,
    timezone,
    plugins,
    webrtc,
    automation,
  };
}

/**
 * Collect specific fingerprint data
 */
export async function collect(
  collectors: Array<keyof FingerprintData>
): Promise<Partial<FingerprintData>> {
  const collectorMap = {
    navigator: collectNavigator,
    screen: collectScreen,
    webgl: collectWebGL,
    canvas: collectCanvas,
    audio: collectAudio,
    fonts: collectFonts,
    timezone: collectTimezone,
    plugins: collectPlugins,
    webrtc: collectWebRTC,
    automation: collectAutomation,
  };

  const results: Partial<FingerprintData> = {};

  await Promise.all(
    collectors.map(async (key) => {
      const collector = collectorMap[key as keyof typeof collectorMap];
      if (collector) {
        (results as any)[key] = await collector();
      }
    })
  );

  return results;
}
