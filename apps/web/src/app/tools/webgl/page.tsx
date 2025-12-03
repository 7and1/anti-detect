'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface WebGLResult {
  version: string;
  version2: string | null;
  vendor: string;
  renderer: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxViewportDims: [number, number];
  maxVertexAttribs: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  aliasedLineWidthRange: [number, number];
  aliasedPointSizeRange: [number, number];
  extensions: string[];
  shaderPrecision: {
    vertexHigh: string;
    vertexMedium: string;
    vertexLow: string;
    fragmentHigh: string;
    fragmentMedium: string;
    fragmentLow: string;
  };
  isSoftwareRenderer: boolean;
  hash: string;
}

export default function WebGLPage() {
  const [result, setResult] = useState<WebGLResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllExtensions, setShowAllExtensions] = useState(false);

  const runTest = useCallback(async () => {
    setIsLoading(true);

    try {
      const canvas = document.createElement('canvas');

      // Try WebGL 2 first, then WebGL 1
      let gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
      let version2: string | null = null;

      if (gl) {
        version2 = gl.getParameter(gl.VERSION);
      }

      // Always get WebGL 1 for compatibility
      const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl1) {
        throw new Error('WebGL not supported');
      }

      const webglCtx = gl1 as WebGLRenderingContext;

      // Basic info
      const vendor = webglCtx.getParameter(webglCtx.VENDOR) || 'Unknown';
      const renderer = webglCtx.getParameter(webglCtx.RENDERER) || 'Unknown';
      const version = webglCtx.getParameter(webglCtx.VERSION) || 'Unknown';

      // Unmasked info (requires extension)
      let unmaskedVendor = vendor;
      let unmaskedRenderer = renderer;

      const debugInfo = webglCtx.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        unmaskedVendor = webglCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
        unmaskedRenderer = webglCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
      }

      // Capabilities
      const maxTextureSize = Number(webglCtx.getParameter(webglCtx.MAX_TEXTURE_SIZE)) || 0;
      const maxRenderbufferSize = Number(webglCtx.getParameter(webglCtx.MAX_RENDERBUFFER_SIZE)) || 0;
      const maxViewportDims = webglCtx.getParameter(webglCtx.MAX_VIEWPORT_DIMS) as Int32Array;
      const maxVertexAttribs = webglCtx.getParameter(webglCtx.MAX_VERTEX_ATTRIBS);
      const maxVertexUniformVectors = webglCtx.getParameter(webglCtx.MAX_VERTEX_UNIFORM_VECTORS);
      const maxFragmentUniformVectors = webglCtx.getParameter(webglCtx.MAX_FRAGMENT_UNIFORM_VECTORS);
      const maxVaryingVectors = webglCtx.getParameter(webglCtx.MAX_VARYING_VECTORS);
      const aliasedLineWidthRange = webglCtx.getParameter(webglCtx.ALIASED_LINE_WIDTH_RANGE) as Float32Array;
      const aliasedPointSizeRange = webglCtx.getParameter(webglCtx.ALIASED_POINT_SIZE_RANGE) as Float32Array;

      // Extensions
      const extensions = webglCtx.getSupportedExtensions() || [];

      // Shader precision
      const getShaderPrecision = (shaderType: number, precisionType: number) => {
        const format = webglCtx.getShaderPrecisionFormat(shaderType, precisionType);
        if (format) {
          return `${format.precision} (${format.rangeMin} to ${format.rangeMax})`;
        }
        return 'Not supported';
      };

      const shaderPrecision = {
        vertexHigh: getShaderPrecision(webglCtx.VERTEX_SHADER, webglCtx.HIGH_FLOAT),
        vertexMedium: getShaderPrecision(webglCtx.VERTEX_SHADER, webglCtx.MEDIUM_FLOAT),
        vertexLow: getShaderPrecision(webglCtx.VERTEX_SHADER, webglCtx.LOW_FLOAT),
        fragmentHigh: getShaderPrecision(webglCtx.FRAGMENT_SHADER, webglCtx.HIGH_FLOAT),
        fragmentMedium: getShaderPrecision(webglCtx.FRAGMENT_SHADER, webglCtx.MEDIUM_FLOAT),
        fragmentLow: getShaderPrecision(webglCtx.FRAGMENT_SHADER, webglCtx.LOW_FLOAT),
      };

      // Detect software renderer
      const softwareRenderers = ['SwiftShader', 'LLVMpipe', 'Mesa', 'VirtualBox', 'VMware', 'llvmpipe'];
      const isSoftwareRenderer = softwareRenderers.some(
        sr => unmaskedRenderer.toLowerCase().includes(sr.toLowerCase())
      );

      // Generate hash
      const dataToHash = [
        vendor, renderer, unmaskedVendor, unmaskedRenderer,
        maxTextureSize, maxRenderbufferSize, extensions.join(',')
      ].join('|');

      const encoder = new TextEncoder();
      const data = encoder.encode(dataToHash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setResult({
        version,
        version2,
        vendor,
        renderer,
        unmaskedVendor,
        unmaskedRenderer,
        maxTextureSize,
        maxRenderbufferSize,
        maxViewportDims: [maxViewportDims[0], maxViewportDims[1]],
        maxVertexAttribs,
        maxVertexUniformVectors,
        maxFragmentUniformVectors,
        maxVaryingVectors,
        aliasedLineWidthRange: [aliasedLineWidthRange[0], aliasedLineWidthRange[1]],
        aliasedPointSizeRange: [aliasedPointSizeRange[0], aliasedPointSizeRange[1]],
        extensions: extensions.sort(),
        shaderPrecision,
        isSoftwareRenderer,
        hash,
      });
    } catch (err) {
      console.error('WebGL test failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runTest();
  }, [runTest]);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              WebGL <span className="gradient-text">Fingerprint Test</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              WebGL reveals detailed information about your GPU and graphics capabilities.
              This data is highly identifying and used for browser fingerprinting.
            </p>
          </div>

          {result && (
            <div className="space-y-6">
              {/* GPU Information */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">GPU Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Vendor (Masked)</span>
                    <span className="font-mono text-text-primary">{result.vendor}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Renderer (Masked)</span>
                    <span className="font-mono text-text-primary text-right max-w-[60%] break-words">
                      {result.renderer}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Unmasked Vendor</span>
                    <span className="font-mono text-terminal">{result.unmaskedVendor}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-muted">Unmasked Renderer</span>
                    <span className="font-mono text-terminal text-right max-w-[60%] break-words">
                      {result.unmaskedRenderer}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-text-muted">WebGL Hash</span>
                    <span className="font-mono text-accent text-sm">
                      {result.hash.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Software Renderer Warning */}
              {result.isSoftwareRenderer && (
                <div className="p-6 rounded-lg border border-error/50 bg-error/10">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl text-error">⚠️</span>
                    <div>
                      <h3 className="text-lg font-semibold text-error">Software Renderer Detected</h3>
                      <p className="text-text-secondary mt-1">
                        Your browser is using a software renderer ({result.unmaskedRenderer}).
                        This is commonly associated with headless browsers and automation tools.
                        Websites may flag this as suspicious.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* WebGL Versions */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">WebGL Versions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-bg-primary">
                    <p className="text-sm text-text-muted mb-1">WebGL 1.0</p>
                    <p className="font-mono text-success">{result.version}</p>
                  </div>
                  <div className="p-4 rounded bg-bg-primary">
                    <p className="text-sm text-text-muted mb-1">WebGL 2.0</p>
                    <p className={`font-mono ${result.version2 ? 'text-success' : 'text-text-muted'}`}>
                      {result.version2 || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Capabilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Max Texture Size</p>
                    <p className="font-mono text-text-primary">{result.maxTextureSize.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Max Renderbuffer</p>
                    <p className="font-mono text-text-primary">{result.maxRenderbufferSize.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Max Viewport</p>
                    <p className="font-mono text-text-primary">
                      {result.maxViewportDims[0]} × {result.maxViewportDims[1]}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Vertex Attribs</p>
                    <p className="font-mono text-text-primary">{result.maxVertexAttribs}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Vertex Uniforms</p>
                    <p className="font-mono text-text-primary">{result.maxVertexUniformVectors}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Fragment Uniforms</p>
                    <p className="font-mono text-text-primary">{result.maxFragmentUniformVectors}</p>
                  </div>
                </div>
              </div>

              {/* Shader Precision */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Shader Precision</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-muted mb-2">Vertex Shader</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">High Float</span>
                        <span className="font-mono text-text-primary">{result.shaderPrecision.vertexHigh}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Medium Float</span>
                        <span className="font-mono text-text-primary">{result.shaderPrecision.vertexMedium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Low Float</span>
                        <span className="font-mono text-text-primary">{result.shaderPrecision.vertexLow}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-2">Fragment Shader</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">High Float</span>
                        <span className="font-mono text-text-primary">{result.shaderPrecision.fragmentHigh}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Medium Float</span>
                        <span className="font-mono text-text-primary">{result.shaderPrecision.fragmentMedium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Low Float</span>
                        <span className="font-mono text-text-primary">{result.shaderPrecision.fragmentLow}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extensions */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Extensions ({result.extensions.length})
                  </h3>
                  <button
                    onClick={() => setShowAllExtensions(!showAllExtensions)}
                    className="text-sm text-accent hover:underline"
                  >
                    {showAllExtensions ? 'Show less' : 'Show all'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(showAllExtensions ? result.extensions : result.extensions.slice(0, 10)).map((ext) => (
                    <span
                      key={ext}
                      className="px-2 py-1 text-xs font-mono bg-bg-primary text-text-secondary rounded"
                    >
                      {ext}
                    </span>
                  ))}
                  {!showAllExtensions && result.extensions.length > 10 && (
                    <span className="px-2 py-1 text-xs text-text-muted">
                      +{result.extensions.length - 10} more
                    </span>
                  )}
                </div>
              </div>

              {/* How WebGL Fingerprinting Works */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  How WebGL Fingerprinting Works
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    WebGL fingerprinting exploits the graphics API to identify your browser:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Your GPU vendor and model uniquely identify your hardware
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Driver versions and capabilities vary by system
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Supported extensions differ between GPU generations
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Shader precision values are hardware-dependent
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      This data combined creates a unique WebGL fingerprint
                    </li>
                  </ul>
                </div>
              </div>

              {/* Protection Options */}
              <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                <h3 className="text-lg font-semibold text-warning mb-4">Protection Options</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <span className="text-warning">1.</span>
                    <span>
                      Use Firefox with <code className="text-terminal">privacy.resistFingerprinting</code> to report
                      generic WebGL values
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">2.</span>
                    <span>
                      Tor Browser spoofs WebGL vendor/renderer to standard values
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">3.</span>
                    <span>
                      Anti-detect browsers let you customize WebGL parameters per profile
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">4.</span>
                    <span>
                      Disable WebGL entirely (breaks many websites)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Educational Content */}
          <div className="mt-16 space-y-8 text-text-secondary">
            <h2 className="text-3xl font-bold text-text-primary">
              Understanding WebGL Fingerprinting
            </h2>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                What Is WebGL Fingerprinting?
              </h3>
              <p className="leading-relaxed">
                Think of WebGL fingerprinting as asking your computer to draw a specific picture, then examining every tiny detail about <em>how</em> it drew that picture—not what the picture looks like, but the microscopic quirks in the brush strokes. WebGL (Web Graphics Library) is the technology that lets websites display 3D graphics in your browser without plugins. It directly accesses your Graphics Processing Unit (GPU), and here's the wild part: every GPU draws things slightly differently.
              </p>
              <p className="leading-relaxed">
                When a website asks your browser to render a simple 3D scene through WebGL, your GPU performs billions of floating-point calculations. Different GPU models from NVIDIA, AMD, Intel, and Apple handle these calculations with microscopic variations. Your driver version (the software that talks to your GPU) adds another layer of uniqueness. Even the way your GPU rounds numbers or handles anti-aliasing creates a distinctive signature. Combine all these factors, and you get a fingerprint that's often as unique as your actual fingerprint.
              </p>
              <p className="leading-relaxed">
                The foundational research came from Keaton Mowery and Hovav Shacham at UC San Diego in 2012 with their paper "Pixel Perfect: Fingerprinting Canvas in HTML5." They discovered that rendering text and WebGL scenes to a canvas element, then examining the pixels produced, created a fingerprint that was "consistent, high-entropy, orthogonal to other fingerprints, transparent to the user, and readily obtainable." Testing across 294 browser instances yielded <strong>116 distinct fingerprints</strong> with approximately <strong>5.73 bits of entropy</strong> from text rendering alone—and significantly more when combined with WebGL.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                How WebGL Fingerprinting Actually Works
              </h3>
              <p className="leading-relaxed">
                WebGL fingerprinting collects data at multiple levels. First, there's the <strong>renderer string</strong>—your GPU's name and sometimes the driver version. This alone is highly identifying. If you're running an NVIDIA RTX 4090, that shows up in your fingerprint. If your driver is version 531.18, that might show too. The combination of GPU model and driver version immediately narrows you down to a small subset of internet users.
              </p>
              <p className="leading-relaxed">
                But tracker scripts don't stop there. They query your GPU's <strong>capabilities</strong>: maximum texture size (often 16384 for modern GPUs, but varies), supported extensions (things like "WEBGL_compressed_texture_s3tc" or "EXT_texture_filter_anisotropic"), shader precision (how accurately your GPU handles decimal numbers), and viewport dimensions. Each of these parameters adds entropy to your fingerprint.
              </p>
              <p className="leading-relaxed">
                Then comes the rendering test. According to Mowery and Shacham's research, websites render specific 3D scenes using carefully selected parameters—particular textures, anti-aliasing settings, lighting, and transparency effects. They capture the output image and hash it. Because GPUs and drivers differ in how they implement the WebGL specification (there's wiggle room in the standards), the output varies between systems. Your Intel Iris Xe Graphics will produce a different hash than an AMD Radeon RX 7900, even when rendering the identical scene.
              </p>
              <p className="leading-relaxed">
                The 2014 study "The Web Never Forgets" by Acar et al. from Princeton and KU Leuven found that <strong>5.5% of the top 100,000 websites</strong> actively employed canvas fingerprinting (closely related to WebGL fingerprinting). They used automated crawlers to scan for fingerprinting scripts, finding them on 5,542 websites. That was 2014—the number has only grown since.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The DrawnApart Breakthrough: GPU Fingerprinting in 150 Milliseconds
              </h3>
              <p className="leading-relaxed">
                In recent years, researchers discovered they could fingerprint GPUs not just by what they support, but by <em>how fast</em> they perform specific operations. The "DrawnApart" technique uses WebGL 2.0 compute shaders to measure subtle performance characteristics of your GPU. Think of it like identifying a car not just by its make and model, but by precisely timing how quickly it accelerates from 0 to 60.
              </p>
              <p className="leading-relaxed">
                Here's what makes DrawnApart scary effective: testing across 2,550 devices with 1,605 unique GPU configurations, researchers achieved <strong>98% classification accuracy in just 150 milliseconds</strong>. The technique boosts the median tracking duration by <strong>67%</strong> compared to using current tracking methods alone. It works by running specific computation tasks and measuring execution time with microsecond precision. Since every GPU has a unique performance profile (affected by clock speed, memory bandwidth, thermal throttling, and driver optimizations), the timing measurements create a distinctive fingerprint.
              </p>
              <p className="leading-relaxed">
                What's particularly concerning is that DrawnApart works even when privacy tools mask your renderer string. You can spoof your GPU name to say "Generic GPU" all day long, but you can't fake how fast your actual hardware completes mathematical operations. The physics of your silicon gives you away. And because it runs in 150 milliseconds, you won't even notice it happening—faster than an eye blink.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Cross-Browser Tracking: Following You Everywhere
              </h3>
              <p className="leading-relaxed">
                One of the most disturbing applications of WebGL fingerprinting is cross-browser tracking. Most people think using different browsers keeps their activities separate—checking personal email in Chrome, browsing social media in Firefox, doing work in Edge. That separation is an illusion.
              </p>
              <p className="leading-relaxed">
                Research from the 2017 NDSS Symposium by Yinzhi Cao, Song Li, and Erik Wijmans demonstrated a technique that tracks users across <em>different browsers</em> on the same machine with <strong>99.24% accuracy</strong>. They used novel OS and hardware-level features, particularly WebGL rendering characteristics. The key insight: your GPU is the same regardless of which browser you use. When Chrome, Firefox, and Safari all query the same GPU, they get similar responses.
              </p>
              <p className="leading-relaxed">
                The researchers performed 20 unique WebGL rendering tasks with carefully selected parameters: specific textures, anti-aliasing modes, lighting effects, and transparency settings. The combined fingerprint was unique enough to identify the machine across browsers, defeating the privacy assumption that different browsers provide separate identities. This means ad networks can connect your "anonymous" browsing in one browser to your logged-in session in another, building a complete profile of your online activity.
              </p>
            </div>

            {/* Statistics Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-bg-secondary rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-bg-primary">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      WebGL Fingerprinting Research Findings
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Result
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">DrawnApart GPU Classification Accuracy</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">98% in 150ms</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.bleepingcomputer.com/news/security/researchers-use-gpu-fingerprinting-to-track-users-online/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        BleepingComputer 2023
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Tracking Duration Improvement</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">+67% median boost</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.bitdefender.com/en-us/blog/hotforsecurity/researchers-discover-how-to-use-gpu-based-fingerprinting-for-user-tracking"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Bitdefender Report
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Pixel Perfect Study: Distinct Fingerprints</td>
                    <td className="px-4 py-3 text-sm">116 from 294 browsers (5.73 bits)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://hovav.net/ucsd/dist/canvas.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Mowery & Shacham 2012
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Canvas Fingerprinting Prevalence</td>
                    <td className="px-4 py-3 text-sm">5.5% of top 100k websites</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.esat.kuleuven.be/cosic/publications/article-2457.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Acar et al. 2014
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Cross-Browser Tracking Accuracy</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">99.24%</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.ndss-symposium.org/ndss2017/ndss-2017-programme/cross-browser-fingerprinting-os-and-hardware-level-features/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Cao et al. NDSS 2017
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">State-of-Art vs Hardware-Based Tracking</td>
                    <td className="px-4 py-3 text-sm">90.84% vs 99.24%</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://yinzhicao.org/TrackingFree/crossbrowsertracking_NDSS17.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        NDSS 2017 Paper
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Automation Detection Problem
              </h3>
              <p className="leading-relaxed">
                If you're using Selenium, Puppeteer, or Playwright for web automation, WebGL fingerprinting is one of your biggest obstacles. Headless browsers often use software renderers like SwiftShader (Chrome's fallback renderer) or LLVMpipe instead of real GPUs. These software renderers have distinctive fingerprints that immediately signal "automation tool" to detection systems.
              </p>
              <p className="leading-relaxed">
                Even when automation tools run in headed mode with GPU access, the fingerprint might not match a legitimate user. For example, if your script runs on a server with an NVIDIA Tesla T4 (a data center GPU), websites will notice that consumer users don't typically browse from data center hardware. Or if you're running headless Chrome on Linux with Mesa drivers while your User-Agent claims to be Windows 10 with Chrome, that inconsistency gets flagged instantly.
              </p>
              <p className="leading-relaxed">
                The detection systems are sophisticated. They don't just check if WebGL works—they verify that your entire fingerprint is internally consistent. Your GPU vendor should match your platform (ANGLE on Windows, Metal on macOS). Your maximum texture size should align with your claimed GPU model. Your supported extensions should match the browser version you're claiming to be. A single mismatch can trigger a block.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Why WebGL Fingerprinting Is So Persistent
              </h3>
              <p className="leading-relaxed">
                Unlike cookies or localStorage that you can clear, or IP addresses that change, your WebGL fingerprint is determined by your hardware. Unless you physically swap your GPU or update your drivers, your fingerprint remains constant. This persistence makes WebGL fingerprinting incredibly valuable for long-term tracking.
              </p>
              <p className="leading-relaxed">
                Even privacy-focused techniques like browser profiles or virtual machines don't fully solve this. If you run multiple virtual machines on the same host and give them GPU access, they'll all report the same or similar GPU fingerprints because they're ultimately using the same physical hardware. The only way to get a different WebGL fingerprint is to actually use different hardware.
              </p>
              <p className="leading-relaxed">
                This is why professional multi-accounting and anti-detect browsing requires either real device farms (physically separate machines with different GPUs) or sophisticated software spoofing that intercepts WebGL API calls and returns fake but consistent values. But spoofing has its own challenges—you need to return values that make sense together, that match your other fingerprints (like canvas, which is closely related—see our <a href="/tools/canvas" className="text-accent hover:underline">Canvas Fingerprint Test</a>), and that don't include known "fake" patterns that detection systems have catalogued.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Protecting Against WebGL Fingerprinting
              </h3>
              <p className="leading-relaxed">
                For general privacy, Firefox offers the most robust protection through its <code className="text-terminal bg-bg-primary px-1 py-0.5 rounded">privacy.resistFingerprinting</code> setting. When enabled, Firefox reports generic WebGL values instead of your real GPU information. The trade-off is that this makes you identifiable as "someone using Firefox anti-fingerprinting," and it can break some websites that require WebGL for legitimate functionality (like Google Maps, WebGL games, or 3D modeling tools).
              </p>
              <p className="leading-relaxed">
                Tor Browser takes a similar approach, spoofing WebGL vendor and renderer to standard values. But Tor's threat model is different—they assume all Tor users have the same fingerprint, so you're anonymous within the crowd of millions of Tor users. If you're trying to appear as a unique organic user (for web scraping, multi-accounting, or testing), the "everyone looks the same" approach doesn't work.
              </p>
              <p className="leading-relaxed">
                For automation and multi-accounting, anti-detect browsers are the industry standard. Tools like Multilogin, GoLogin, and AdsPower let you create browser profiles with custom WebGL parameters. The key is consistency: if your profile claims to have an Intel HD Graphics 630, it must report all the parameters that a real Intel HD 630 would report—the correct maximum texture size, the right extensions, appropriate shader precision values, and a canvas rendering hash that matches that hardware.
              </p>
              <p className="leading-relaxed">
                Some advanced users disable WebGL entirely through browser settings or extensions. This works for privacy but breaks a surprising amount of the modern web. Many sites use WebGL not for 3D graphics but for faster 2D rendering, image processing, or even as a bot detection method (if WebGL doesn't work at all, they flag you as suspicious).
              </p>
              <p className="leading-relaxed">
                The nuclear option is using real browsers on real devices with real, diverse hardware. Device farms where each browser instance runs on physically separate hardware with different GPU models are nearly impossible to detect through WebGL fingerprinting. But this approach is expensive and doesn't scale well.
              </p>
              <p className="leading-relaxed">
                Want to understand how WebGL fingerprinting fits into the broader fingerprinting landscape? Check our complete guide on <a href="/learn/webgl-fingerprinting" className="text-accent hover:underline">WebGL Fingerprinting Defense Strategies</a> and explore related techniques like <a href="/tools/fonts" className="text-accent hover:underline">Font Fingerprinting</a> and <a href="/tools/audio" className="text-accent hover:underline">Audio Fingerprinting</a> that use similar hardware-based tracking approaches.
              </p>
            </div>
          </div>

          {/* Test Again Button */}
          <div className="mt-8 text-center">
            <button
              onClick={runTest}
              disabled={isLoading}
              className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Again'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
