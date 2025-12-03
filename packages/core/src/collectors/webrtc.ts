import type { WebRTCData, StunResult } from '@anti-detect/types';

// STUN servers to test
const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
];

export async function collectWebRTC(): Promise<WebRTCData> {
  const localIPs: string[] = [];
  let publicIP: string | null = null;
  let hasLeak = false;
  const stunResults: StunResult[] = [];

  try {
    const RTCPeerConnection =
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection;

    if (!RTCPeerConnection) {
      return { localIPs: [], publicIP: null, hasLeak: false };
    }

    // Test with STUN servers
    for (const server of STUN_SERVERS) {
      const result = await testStunServer(server, RTCPeerConnection);
      stunResults.push(result);

      if (result.localCandidate) {
        const ip = extractIP(result.localCandidate);
        if (ip && !localIPs.includes(ip)) {
          localIPs.push(ip);
        }
      }

      if (result.reflexiveCandidate) {
        const ip = extractIP(result.reflexiveCandidate);
        if (ip && isPublicIP(ip)) {
          publicIP = ip;
        }
      }
    }

    // Check for leak (local IPs exposed)
    hasLeak = localIPs.length > 0 || publicIP !== null;
  } catch (error) {
    console.error('WebRTC detection error:', error);
  }

  return {
    localIPs,
    publicIP,
    hasLeak,
    stunResults,
  };
}

async function testStunServer(
  server: string,
  RTCPeerConnection: typeof window.RTCPeerConnection
): Promise<StunResult> {
  const result: StunResult = {
    server,
    localCandidate: null,
    reflexiveCandidate: null,
    relayCandidate: null,
  };

  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: server }],
      });

      const timeout = setTimeout(() => {
        pc.close();
        resolve(result);
      }, 3000);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;

          if (candidate.includes('host')) {
            result.localCandidate = candidate;
          } else if (candidate.includes('srflx')) {
            result.reflexiveCandidate = candidate;
          } else if (candidate.includes('relay')) {
            result.relayCandidate = candidate;
          }
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          pc.close();
          resolve(result);
        }
      };

      // Create data channel to trigger ICE gathering
      pc.createDataChannel('test');

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((err) => {
          result.error = err.message;
          clearTimeout(timeout);
          pc.close();
          resolve(result);
        });
    } catch (err: any) {
      result.error = err.message;
      resolve(result);
    }
  });
}

function extractIP(candidate: string): string | null {
  // ICE candidate format: "candidate:... <priority> <ip> <port> ..."
  const match = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  if (match) {
    return match[1] ?? null;
  }

  // IPv6
  const ipv6Match = candidate.match(/([a-f0-9:]+:+[a-f0-9]+)/i);
  if (ipv6Match) {
    return ipv6Match[1] ?? null;
  }

  return null;
}

function isPublicIP(ip: string): boolean {
  // Check if IP is private
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];

  return !privateRanges.some((range) => range.test(ip));
}
