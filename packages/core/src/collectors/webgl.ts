import type { WebGLData } from '@anti-detect/types';

export async function collectWebGL(): Promise<WebGLData> {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    return {
      vendor: 'Not available',
      renderer: 'Not available',
    };
  }

  const webgl = gl as WebGLRenderingContext;

  // Get basic info
  const vendor = webgl.getParameter(webgl.VENDOR) || '';
  const renderer = webgl.getParameter(webgl.RENDERER) || '';
  const version = webgl.getParameter(webgl.VERSION) || '';
  const shadingLanguageVersion = webgl.getParameter(webgl.SHADING_LANGUAGE_VERSION) || '';

  // Get unmasked info (requires WEBGL_debug_renderer_info extension)
  const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
  let unmaskedVendor = '';
  let unmaskedRenderer = '';

  if (debugInfo) {
    unmaskedVendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    unmaskedRenderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
  }

  // Get capabilities
  const maxTextureSize = webgl.getParameter(webgl.MAX_TEXTURE_SIZE);
  const maxRenderBufferSize = webgl.getParameter(webgl.MAX_RENDERBUFFER_SIZE);

  // Get extensions
  const extensions = webgl.getSupportedExtensions() || [];

  return {
    vendor,
    renderer,
    version,
    shadingLanguageVersion,
    unmaskedVendor,
    unmaskedRenderer,
    maxTextureSize,
    maxRenderBufferSize,
    extensions,
  };
}
