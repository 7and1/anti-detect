import { vi } from 'vitest';

// Provide deterministic screen + navigator data for jsdom
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
    orientation: { type: 'landscape-primary' },
  },
  configurable: true,
});

Object.defineProperty(window, 'devicePixelRatio', {
  value: 2,
  configurable: true,
});

Object.defineProperty(navigator, 'deviceMemory', {
  value: 8,
  configurable: true,
});

// Minimal ImageData polyfill for environments without Canvas implementation
if (typeof globalThis.ImageData === 'undefined') {
  class PolyfillImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  }

  (globalThis as any).ImageData = PolyfillImageData;
}

const canvasImageData = new Uint8ClampedArray(200 * 50 * 4);

const mock2dCtx = {
  textBaseline: 'top',
  font: '14px Arial',
  fillStyle: '#000',
  fillRect: vi.fn(),
  fillText: vi.fn(),
  getImageData: vi.fn(() => ({
    data: canvasImageData,
    width: 200,
    height: 50,
  })),
};

const webglDebugExtension = {
  UNMASKED_VENDOR_WEBGL: 0x9245,
  UNMASKED_RENDERER_WEBGL: 0x9246,
};

const mockWebGLCtx = {
  VENDOR: 0x1f00,
  RENDERER: 0x1f01,
  VERSION: 0x1f02,
  SHADING_LANGUAGE_VERSION: 0x8b8c,
  MAX_TEXTURE_SIZE: 0x0d33,
  MAX_RENDERBUFFER_SIZE: 0x84e8,
  getParameter: (param: number) => {
    switch (param) {
      case 0x1f00:
        return 'Mock WebGL Vendor';
      case 0x1f01:
        return 'Mock WebGL Renderer';
      case 0x1f02:
        return 'WebGL 1.0';
      case 0x8b8c:
        return 'WebGL GLSL ES 1.0';
      case 0x0d33:
        return 4096;
      case 0x84e8:
        return 4096;
      case webglDebugExtension.UNMASKED_VENDOR_WEBGL:
        return 'Mock Unmasked Vendor';
      case webglDebugExtension.UNMASKED_RENDERER_WEBGL:
        return 'Mock Unmasked Renderer';
      default:
        return '';
    }
  },
  getExtension: (name: string) => {
    if (name === 'WEBGL_debug_renderer_info') {
      return webglDebugExtension;
    }
    return null;
  },
  getSupportedExtensions: () => ['WEBGL_debug_renderer_info'],
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value(this: HTMLCanvasElement, type?: string) {
    if (type === 'webgl' || type === 'experimental-webgl') {
      return mockWebGLCtx;
    }
    return mock2dCtx;
  },
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: () => 'data:image/png;base64,mock',
});
