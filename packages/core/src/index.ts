/**
 * @anti-detect/core
 *
 * Core fingerprint collection engine for Anti-detect.com
 *
 * This package provides browser-side fingerprint collection using various
 * JavaScript APIs. It's designed to run in the browser and collect data
 * that can be sent to the server for analysis.
 */

export { collect, collectAll } from './collect';
export * from './collectors';
export { AutomationClient } from './automation-client';
export type { AutomationTaskPayload } from './automation-client';
export type {
  FingerprintData,
  NavigatorData,
  ScreenData,
  WebGLData,
  CanvasData,
  AudioData,
  FontsData,
  TimezoneData,
  WebRTCData,
  AutomationData,
} from '@anti-detect/types';
