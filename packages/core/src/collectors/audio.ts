import type { AudioData } from '@anti-detect/types';

export async function collectAudio(): Promise<AudioData> {
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContext) {
      return { hash: 'not-available' };
    }

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gain = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

    gain.gain.setValueAtTime(0, audioContext.currentTime);

    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(0);

    // Collect audio data
    const fingerprint = await new Promise<Float32Array>((resolve) => {
      let collected = false;
      scriptProcessor.onaudioprocess = (event) => {
        if (!collected) {
          collected = true;
          const channelData = event.inputBuffer.getChannelData(0);
          resolve(new Float32Array(channelData));
        }
      };

      // Timeout after 500ms
      setTimeout(() => {
        if (!collected) {
          collected = true;
          resolve(new Float32Array(0));
        }
      }, 500);
    });

    // Cleanup
    oscillator.stop();
    scriptProcessor.disconnect();
    gain.disconnect();
    analyser.disconnect();
    oscillator.disconnect();
    await audioContext.close();

    // Generate hash
    const hash = await hashAudioData(fingerprint);

    return {
      hash,
      sampleRate: audioContext.sampleRate,
      channelCount: audioContext.destination.channelCount,
      state: audioContext.state,
    };
  } catch (error) {
    return { hash: 'error' };
  }
}

async function hashAudioData(data: Float32Array): Promise<string> {
  if (data.length === 0) {
    return 'empty';
  }

  // Convert to string and hash
  const str = Array.from(data.slice(0, 100))
    .map((v) => v.toFixed(6))
    .join(',');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
