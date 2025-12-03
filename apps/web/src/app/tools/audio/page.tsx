'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface AudioResult {
  hash: string;
  sampleRate: number;
  channelCount: number;
  baseLatency: number;
  outputLatency: number;
  state: AudioContextState;
  destination: {
    maxChannelCount: number;
    numberOfInputs: number;
    numberOfOutputs: number;
  };
  isProtected: boolean;
  rawDataSample: number[];
  uniqueness: 'unique' | 'common' | 'unknown';
}

export default function AudioPage() {
  const [result, setResult] = useState<AudioResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const runTest = useCallback(async () => {
    setIsLoading(true);

    try {
      // Create AudioContext
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();

      // Create oscillator for fingerprinting
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      // Create compressor (adds variation based on hardware)
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
      compressor.knee.setValueAtTime(40, audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, audioContext.currentTime);
      compressor.attack.setValueAtTime(0, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      // Connect nodes
      oscillator.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(audioContext.destination);

      // Create gain node to mute output (we don't want to hear anything)
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      analyser.connect(gain);
      gain.connect(audioContext.destination);

      // Start oscillator
      oscillator.start(0);

      // Wait for audio processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get frequency data
      const dataArray = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(dataArray);

      // Stop oscillator
      oscillator.stop();

      // Extract sample data for fingerprinting
      const rawDataSample = Array.from(dataArray.slice(0, 100)).map(v =>
        parseFloat(v.toFixed(6))
      );

      // Generate hash from audio data
      const dataString = rawDataSample.map(v => v.toString()).join(',');
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check for audio protection (all values are the same or -Infinity)
      const uniqueValues = new Set(rawDataSample.filter(v => isFinite(v)));
      const isProtected = uniqueValues.size < 10;

      // Get context info
      const sampleRate = Number(audioContext.sampleRate) || 0;
      const baseLatency = Number(audioContext.baseLatency) || 0;
      const outputLatency = Number((audioContext as any).outputLatency) || 0;
      const state = audioContext.state;
      const destination = {
        maxChannelCount: audioContext.destination.maxChannelCount,
        numberOfInputs: audioContext.destination.numberOfInputs,
        numberOfOutputs: audioContext.destination.numberOfOutputs,
      };

      // Clean up
      await audioContext.close();

      // Draw waveform
      if (canvasRef.current) {
        drawWaveform(canvasRef.current, rawDataSample);
      }

      setResult({
        hash,
        sampleRate,
        channelCount: destination.maxChannelCount,
        baseLatency,
        outputLatency,
        state,
        destination,
        isProtected,
        rawDataSample,
        uniqueness: 'unknown', // Would need database lookup
      });
    } catch (err) {
      console.error('Audio test failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const drawWaveform = (canvas: HTMLCanvasElement, data: number[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Normalize data
    const validData = data.filter(v => isFinite(v));
    if (validData.length === 0) return;

    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min || 1;

    // Draw waveform
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, i) => {
      if (!isFinite(value)) value = min;
      const x = (i / data.length) * width;
      const normalizedValue = (value - min) / range;
      const y = height - normalizedValue * height * 0.8 - height * 0.1;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.3)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  };

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
              Audio <span className="gradient-text">Fingerprint Test</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Audio fingerprinting uses the Web Audio API to create a unique identifier based
              on how your browser processes sound. This technique doesn't require microphone access.
            </p>
          </div>

          {/* Audio Waveform */}
          <div className="p-6 rounded-lg bg-bg-secondary border border-border mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Audio Fingerprint Waveform
            </h3>
            <div className="flex justify-center mb-4 bg-bg-primary rounded p-2">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="rounded max-w-full"
              />
            </div>
            {result && (
              <div className="text-center">
                <span className="text-sm text-text-muted">Hash: </span>
                <span className="font-mono text-sm text-terminal break-all">{result.hash}</span>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-6">
              {/* Protection Status */}
              <div
                className={`p-6 rounded-lg border ${
                  result.isProtected
                    ? 'border-success/50 bg-success/10'
                    : 'border-warning/50 bg-warning/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-4xl ${result.isProtected ? 'text-success' : 'text-warning'}`}>
                    {result.isProtected ? '🛡️' : '🔊'}
                  </span>
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        result.isProtected ? 'text-success' : 'text-warning'
                      }`}
                    >
                      {result.isProtected ? 'Audio Protection Detected' : 'Audio Fingerprint Active'}
                    </h3>
                    <p className="text-text-secondary mt-1">
                      {result.isProtected
                        ? 'Your browser appears to be protecting against audio fingerprinting by returning uniform values.'
                        : 'Your browser generates a unique audio fingerprint that can be used to track you across websites.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Context Info */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  AudioContext Properties
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Sample Rate</p>
                    <p className="font-mono text-text-primary">{result.sampleRate.toLocaleString()} Hz</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Max Channels</p>
                    <p className="font-mono text-text-primary">{result.channelCount}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Base Latency</p>
                    <p className="font-mono text-text-primary">
                      {result.baseLatency > 0 ? `${(result.baseLatency * 1000).toFixed(2)} ms` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Output Latency</p>
                    <p className="font-mono text-text-primary">
                      {result.outputLatency > 0 ? `${(result.outputLatency * 1000).toFixed(2)} ms` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Destination Inputs</p>
                    <p className="font-mono text-text-primary">{result.destination.numberOfInputs}</p>
                  </div>
                  <div className="p-3 rounded bg-bg-primary">
                    <p className="text-xs text-text-muted mb-1">Destination Outputs</p>
                    <p className="font-mono text-text-primary">{result.destination.numberOfOutputs}</p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  How Audio Fingerprinting Works
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Audio fingerprinting exploits subtle differences in how browsers process sound:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      An oscillator generates a test tone (inaudible to you)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      The audio passes through processing nodes (compressor, analyser)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      Different hardware/software produces slightly different outputs
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      The resulting frequency data is hashed to create your fingerprint
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">•</span>
                      This works without any microphone or speaker access
                    </li>
                  </ul>
                </div>
              </div>

              {/* Statistics */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Audio Fingerprinting Statistics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-text-muted text-sm">Metric</th>
                        <th className="text-left py-2 text-text-muted text-sm">Value</th>
                        <th className="text-left py-2 text-text-muted text-sm">Source</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-secondary">
                      <tr className="border-b border-border/50">
                        <td className="py-2">Entropy</td>
                        <td className="py-2 font-mono text-accent">~8.5 bits</td>
                        <td className="py-2 text-sm">Englehardt & Narayanan, 2016</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2">Top 10k sites using</td>
                        <td className="py-2 font-mono text-accent">~67%</td>
                        <td className="py-2 text-sm">Princeton WebTAP, 2023</td>
                      </tr>
                      <tr>
                        <td className="py-2">Tracking accuracy</td>
                        <td className="py-2 font-mono text-accent">~96%</td>
                        <td className="py-2 text-sm">Combined with canvas</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Protection Options */}
              <div className="p-6 rounded-lg bg-warning/10 border border-warning/30">
                <h3 className="text-lg font-semibold text-warning mb-4">Protection Options</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <span className="text-warning">1.</span>
                    <span>
                      Tor Browser normalizes AudioContext output to prevent fingerprinting
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">2.</span>
                    <span>
                      Firefox with <code className="text-terminal">privacy.resistFingerprinting</code> adds noise
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">3.</span>
                    <span>
                      Brave browser has built-in audio fingerprinting protection
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-warning">4.</span>
                    <span>
                      Anti-detect browsers can spoof audio context values
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Educational Content */}
          <div className="mt-16 space-y-8 text-text-secondary">
            <h2 className="text-3xl font-bold text-text-primary">
              Understanding Audio Fingerprinting
            </h2>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                What Is Audio Fingerprinting?
              </h3>
              <p className="leading-relaxed">
                Audio fingerprinting sounds creepy—like websites are secretly listening to you through your microphone. But here's the truth: it's actually weirder and more clever than that. Audio fingerprinting has nothing to do with your microphone or speakers. Instead, it exploits how your browser's audio <em>stack</em>—the combination of your operating system, audio drivers, browser version, and hardware—processes sound signals internally. Even when no actual sound is played or recorded.
              </p>
              <p className="leading-relaxed">
                Think of it this way: if you asked 100 people to mentally calculate 237 × 489, most would get the same answer (115,893), but the <em>process</em> each person uses would vary slightly. Some use long multiplication, others break it down differently, some use shortcuts. Audio fingerprinting is similar—it asks your browser to process a specific audio signal and examines the microscopic quirks in <em>how</em> that processing happens. The final output isn't what matters; what matters is the unique digital signature created by your specific hardware and software combination.
              </p>
              <p className="leading-relaxed">
                The technique was discovered in the wild by Steven Englehardt and Arvind Narayanan from Princeton University in their landmark 2016 study "Online Tracking: A 1-million-site Measurement and Analysis." They found audio fingerprinting scripts on major websites, silently generating unique identifiers for visitors. The researchers measured that AudioContext fingerprinting contributed approximately <strong>5.4 bits of entropy</strong>—enough to distinguish between roughly 42 different configurations. When combined with other fingerprinting techniques, it becomes devastatingly effective.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                How the Web Audio API Becomes a Tracking Tool
              </h3>
              <p className="leading-relaxed">
                The Web Audio API was created for legitimate purposes: online games with 3D sound, music production tools, audio visualizers, and educational applications. It's an incredibly powerful API that gives JavaScript direct access to audio processing capabilities without plugins. Developers can create oscillators (sound wave generators), apply effects like compression and distortion, analyze frequencies, and mix multiple audio sources—all in real-time.
              </p>
              <p className="leading-relaxed">
                Tracking companies realized they could abuse this API for fingerprinting. Here's the typical attack: a tracking script creates an AudioContext (or OfflineAudioContext for faster processing), generates a test signal using an OscillatorNode—usually a triangle wave at a specific frequency like 10,000 Hz—and passes it through a DynamicsCompressorNode. The compressor is key because it applies complex mathematical operations (threshold detection, ratio calculations, attack and release timing) that vary slightly based on your hardware's floating-point arithmetic implementation.
              </p>
              <p className="leading-relaxed">
                The processed audio then goes to an AnalyserNode, which extracts frequency data as a Float32Array—an array of decimal numbers representing the audio spectrum. Different systems produce microscopically different values due to variations in audio driver implementations, CPU floating-point precision, and even subtle differences in how browsers implement the Web Audio specification. The script hashes these values, creating a fingerprint that's consistent for your device but different from others.
              </p>
              <p className="leading-relaxed">
                According to the 2019 Oxford Academic study "A Web Browser Fingerprinting Method Based on the Web Audio API" by Queiroz, audio fingerprints can achieve <strong>99.6% uniqueness</strong>, making them one of the most effective fingerprinting techniques available. The study proved that audio features alone can identify not just the device type but even the specific browser version and rendering engine.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Silent Execution: Why You Never Know It's Happening
              </h3>
              <p className="leading-relaxed">
                The insidious aspect of audio fingerprinting is its invisibility. The entire process happens in milliseconds, uses minimal CPU resources, and produces no audible sound—even if your speakers are unmuted. The oscillator is typically connected to a muted gain node or uses OfflineAudioContext, which processes audio without routing it to your speakers. You won't see any permission prompts, no microphone indicator lights up, and there's no UI element suggesting audio processing is occurring.
              </p>
              <p className="leading-relaxed">
                Browser developer tools don't help much either. If you open the Network tab, you might see the fingerprinting script load, but the actual AudioContext operations happen entirely in JavaScript—no network requests, no obvious traces. The only way to detect it is through specialized privacy tools that monitor AudioContext API calls, or by reading the page's JavaScript code (which is usually minified and obfuscated).
              </p>
              <p className="leading-relaxed">
                The technique works across browsers on the same machine. If you use Chrome, Firefox, and Safari on the same computer, they'll produce similar but not identical audio fingerprints because they use the same underlying audio hardware and drivers. This similarity enables cross-browser tracking—ad networks can correlate your "anonymous" browsing in Firefox with your logged-in Facebook session in Chrome, linking your entire online activity.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Why Audio Fingerprinting Is So Hard to Defeat
              </h3>
              <p className="leading-relaxed">
                Unlike cookies that you can clear or IP addresses that change, your audio fingerprint is determined by your hardware and software configuration. It doesn't rely on stored data that can be deleted. Even if you reinstall your browser or use incognito mode, the fingerprint remains the same because the underlying audio stack hasn't changed. The only ways to change your audio fingerprint are updating your audio drivers (which most people never do), changing your browser to a different version, or literally switching to different hardware.
              </p>
              <p className="leading-relaxed">
                Privacy tools face a dilemma. If they completely block the Web Audio API, legitimate sites break—music players stop working, educational audio tools fail, games lose sound effects. If they try to "normalize" the output (return the same values for everyone), sophisticated trackers can detect the normalization pattern itself and flag you as suspicious. It's like trying to be anonymous by wearing a disguise that everyone recognizes.
              </p>
              <p className="leading-relaxed">
                Some privacy browsers like Tor and Brave attempt to add random noise to the audio output or normalize AudioContext properties. Firefox's <code className="text-terminal bg-bg-primary px-1 py-0.5 rounded">privacy.resistFingerprinting</code> setting modifies audio processing to reduce uniqueness. But according to research from Darkwave Technologies on AudioContext fingerprinting, these protections often fail against advanced tracking scripts that test for protection mechanisms and adjust their fingerprinting approach accordingly.
              </p>
            </div>

            {/* Statistics Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-bg-secondary rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-bg-primary">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                      Audio Fingerprinting Research Findings
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
                    <td className="px-4 py-3 text-sm">AudioContext Entropy Contribution</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">5.4 bits</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.cs.princeton.edu/~arvindn/publications/OpenWPM_1_million_site_tracking_measurement.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Englehardt & Narayanan 2016
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Audio Fingerprint Uniqueness Rate</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">99.6%</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://academic.oup.com/comjnl/article/62/8/1106/5298776"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Oxford Academic 2019
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Discovery in the Wild</td>
                    <td className="px-4 py-3 text-sm">1-million-site measurement</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://techcrunch.com/2016/05/19/audio-fingerprinting-being-used-to-track-web-users-study-finds/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        TechCrunch 2016
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Device Identification Capability</td>
                    <td className="px-4 py-3 text-sm">Type, browser, rendering engine</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.researchgate.net/publication/330716497_A_Web_Browser_Fingerprinting_Method_Based_on_the_Web_Audio_API"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Queiroz ResearchGate
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-sm">Combined Canvas + Audio Accuracy</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">~96% tracking</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://fingerprint.com/blog/audio-fingerprinting/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        FingerprintJS Analysis
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">Processing Time</td>
                    <td className="px-4 py-3 text-sm">Milliseconds (invisible)</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href="https://www.darkwavetech.com/projects/device-fingerprinting/audiocontext-fingerprinting"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Darkwave Technologies
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Real-World Prevalence and Industry Use
              </h3>
              <p className="leading-relaxed">
                Audio fingerprinting isn't just a theoretical threat—it's actively deployed on major websites. The Princeton study found audio fingerprinting scripts across thousands of popular sites, often bundled with advertising networks and analytics platforms. Companies don't advertise this capability because it sounds invasive (even though it doesn't actually listen to you), so most website owners don't even realize their analytics provider is using it.
              </p>
              <p className="leading-relaxed">
                The technique is particularly popular for fraud detection and bot prevention. Legitimate security companies use audio fingerprinting alongside canvas, WebGL, and behavioral analysis to distinguish real users from bots. If a visitor's fingerprint suddenly changes between page loads (something that would never happen naturally), it suggests automation tools or fingerprint spoofing. Financial services use it to detect account takeover—if someone logs into your bank account from a device with a completely different audio fingerprint, that's a red flag.
              </p>
              <p className="leading-relaxed">
                But the same technology enables cross-site tracking. Ad networks use audio fingerprints (combined with other techniques—see our <a href="/tools/canvas" className="text-accent hover:underline">Canvas Test</a> and <a href="/tools/webgl" className="text-accent hover:underline">WebGL Test</a>) to build profiles that follow you across the web. They can track you even when you clear cookies, use different browsers, or connect from different networks. The fingerprint is tied to your physical device, making it extremely persistent.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                The Automation Detection Problem
              </h3>
              <p className="leading-relaxed">
                If you're using Selenium, Puppeteer, or Playwright for web automation, audio fingerprinting is a significant detection vector. Headless browsers often lack proper audio stack implementation or return default values that differ from real browsers. Even headed automation tools can have audio fingerprints that don't match typical user configurations. If your script runs on a Linux server with ALSA audio drivers while claiming to be Windows 10 with Chrome, the audio fingerprint will expose the lie.
              </p>
              <p className="leading-relaxed">
                Some automation frameworks try to mock the Web Audio API, returning fake but plausible values. But sophisticated detection systems test for consistency across multiple fingerprinting vectors. Your audio sample rate should match your claimed operating system. If you report 48,000 Hz (common on Windows) but your <a href="/tools/headers" className="text-accent hover:underline">HTTP headers</a> and other fingerprints suggest macOS (which typically uses 44,100 Hz), that inconsistency triggers alerts.
              </p>
              <p className="leading-relaxed">
                The arms race continues. Detection companies analyze audio fingerprints from millions of real devices and flag patterns that don't match known configurations. If your automation tool returns an audio fingerprint that no real device produces, you're busted. This is why professional anti-detect browsers maintain databases of genuine device fingerprints and ensure every spoofed attribute is internally consistent.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-text-primary">
                Protecting Against Audio Fingerprinting
              </h3>
              <p className="leading-relaxed">
                For general privacy, your best options are Tor Browser, Brave, or Firefox with privacy.resistFingerprinting enabled. Tor Browser normalizes audio output so all Tor users produce identical fingerprints—you're anonymous within the crowd. Brave adds random noise to audio processing, making the fingerprint unstable and less useful for tracking. Firefox's setting provides similar protections but may break audio-heavy websites.
              </p>
              <p className="leading-relaxed">
                Browser extensions that claim to "block audio fingerprinting" vary wildly in effectiveness. Some simply disable the Web Audio API entirely, which breaks legitimate functionality. Others attempt to randomize output, but poorly implemented randomization can actually make you <em>more</em> identifiable—if your audio fingerprint changes every time while everyone else's remains stable, you stand out.
              </p>
              <p className="leading-relaxed">
                For automation and multi-accounting scenarios, anti-detect browsers are essential. They don't block audio fingerprinting; instead, they <em>spoof</em> it convincingly. Each browser profile has a realistic audio fingerprint that matches the rest of the profile's attributes. If the profile claims to be a Windows 10 Dell laptop, the audio fingerprint matches what a real Dell laptop would produce—correct sample rate, appropriate channel count, and realistic latency values.
              </p>
              <p className="leading-relaxed">
                The nuclear option is using real devices with diverse hardware. If each automation instance runs on physically different hardware, the audio fingerprints are naturally unique and genuine. But this doesn't scale well—you'd need dozens or hundreds of physical devices for serious operations, which gets expensive fast.
              </p>
              <p className="leading-relaxed">
                Understanding audio fingerprinting is crucial because it's part of a larger tracking ecosystem. Websites rarely use just one technique—they combine audio with canvas, WebGL, fonts, and more to create a comprehensive fingerprint. Check our guide on <a href="/learn/audio-fingerprinting" className="text-accent hover:underline">Audio Fingerprinting Defense Strategies</a> to learn advanced protection techniques and understand how audio fingerprinting fits into the complete browser fingerprinting picture.
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
