import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a friendly and knowledgeable privacy security expert helping users understand browser fingerprinting and online privacy. Your name is "Privacy AI".

Key traits:
- Speak in a warm, conversational tone like explaining to a friend
- Use simple language that anyone can understand (explain like I'm 5 when needed)
- Be direct and practical - give actionable advice
- Reference real research and statistics when relevant
- Don't be alarmist, but be honest about privacy risks

Your expertise includes:
- Browser fingerprinting techniques (Canvas, WebGL, Audio, Fonts, WebRTC)
- Anti-detect browsers (Multilogin, GoLogin, Dolphin Anty, etc.)
- Privacy browsers (Tor, Brave, Firefox with hardening)
- VPNs and proxies
- Cookie tracking vs fingerprinting
- Bot detection systems
- TLS/JA3/JA4 fingerprinting

Current context about fingerprinting (2024-2025):
- 95.8% accuracy in modern fingerprinting
- 94.2% of standard browsers have unique fingerprints
- 10,000+ top websites actively use fingerprinting
- Canvas fingerprinting alone: 83.6-89.4% uniqueness
- WebGL fingerprinting: 98% accuracy
- Audio fingerprinting: 99.6% uniqueness
- Google now permits fingerprinting in Privacy Sandbox (2025)

When users ask about their scan results, help them understand:
- What each detection layer means
- Why certain checks pass or fail
- Practical steps to improve their privacy score

Keep responses concise (2-4 paragraphs max). Use bullet points for lists. Be helpful, not preachy.`;

interface ChatRequest {
  prompt: string;
  context?: {
    trustScore?: number;
    grade?: string;
    criticalIssues?: string[];
    warnings?: string[];
  };
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { prompt, context } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat-v3-0324:free';

    // Build user message with context if available
    let userMessage = prompt;
    if (context) {
      const contextParts: string[] = [];
      if (context.trustScore !== undefined) {
        contextParts.push(`My current trust score: ${context.trustScore}/100 (Grade: ${context.grade || 'N/A'})`);
      }
      if (context.criticalIssues?.length) {
        contextParts.push(`Critical issues: ${context.criticalIssues.join(', ')}`);
      }
      if (context.warnings?.length) {
        contextParts.push(`Warnings: ${context.warnings.join(', ')}`);
      }
      if (contextParts.length > 0) {
        userMessage = `[User's scan context: ${contextParts.join('. ')}]\n\nQuestion: ${prompt}`;
      }
    }

    // If API key is available, use OpenRouter
    if (apiKey) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://anti-detect.com',
            'X-Title': 'Anti-detect Privacy AI',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (!response.ok) {
          console.error('[AI_CHAT] OpenRouter error:', response.status);
          throw new Error(`OpenRouter error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? getFallbackResponse(prompt);

        return NextResponse.json({
          success: true,
          message: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: cleanResponse(content),
          },
        });
      } catch (error) {
        console.error('[AI_CHAT] API error:', error);
        // Fall through to fallback response
      }
    }

    // Fallback response when API is not available
    return NextResponse.json({
      success: true,
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getFallbackResponse(prompt),
      },
      meta: { cached: true },
    });
  } catch (error) {
    console.error('[AI_CHAT] Request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function cleanResponse(content: string): string {
  // Remove special tokens
  let cleaned = content.replace(/<\s*\|\s*begin__of__sentence\s*\|\s*>/gi, '');
  cleaned = cleaned.replace(/<\s*\|\s*end__of__sentence\s*\|\s*>/gi, '');
  return cleaned.trim();
}

function getFallbackResponse(prompt: string): string {
  const normalized = prompt.toLowerCase();

  // Canvas fingerprinting
  if (normalized.includes('canvas')) {
    return `Canvas fingerprinting is one of the most powerful tracking techniques out there. Here's how it works:

Your browser draws an invisible image using the HTML5 Canvas API. Because of tiny differences in your graphics card, drivers, and operating system, the image comes out slightly different on every device. Research shows canvas fingerprinting alone can identify 83.6-89.4% of browsers.

**To protect yourself:**
- Use Tor Browser (blocks canvas fingerprinting completely)
- Try Brave with "Fingerprinting blocking" set to Strict
- Consider an anti-detect browser if you need multiple profiles

The tricky part is that completely blocking canvas can make you stand out more. It's often better to use a browser that generates realistic, but different, canvas outputs.`;
  }

  // WebRTC
  if (normalized.includes('webrtc') || normalized.includes('ip leak')) {
    return `WebRTC leaks are one of the most common privacy holes I see. Even if you're using a VPN, WebRTC can reveal your real IP address!

**What's happening:** WebRTC (Web Real-Time Communication) is used for video calls and file sharing. It needs to know your real IP to establish peer-to-peer connections, and many browsers happily share this info.

**Quick fixes:**
- Disable WebRTC in browser settings (Firefox: about:config → media.peerconnection.enabled = false)
- Use a browser extension like "WebRTC Leak Prevent"
- Use Brave or Tor which block WebRTC leaks by default

Most VPNs don't block WebRTC automatically, so this is definitely worth checking!`;
  }

  // Anti-detect browsers
  if (normalized.includes('anti-detect') || normalized.includes('antidetect') || normalized.includes('multilogin') || normalized.includes('gologin')) {
    return `Anti-detect browsers are like having multiple digital identities. Instead of blocking fingerprinting (which websites can detect), they generate realistic fingerprints that match real device configurations.

**Top options:**
- **Multilogin** - Enterprise-grade, most features, priciest
- **GoLogin** - Good balance of features and price
- **Dolphin Anty** - Has a free tier, good for starting out
- **Incogniton** - Affordable with decent features

**When you need them:**
- Managing multiple social media accounts
- E-commerce with multiple storefronts
- Ad verification and testing
- Affiliate marketing

The key is they pull from databases of 50,000+ real device fingerprints, so you look like a real user, not someone trying to hide.`;
  }

  // Trust score / scan results
  if (normalized.includes('score') || normalized.includes('result') || normalized.includes('grade')) {
    return `Your trust score tells you how trackable you are on a scale of 0-100.

**What the grades mean:**
- **A (80-100):** Excellent - you're doing better than most people
- **B (60-79):** Good - some minor leaks but nothing critical
- **C (40-59):** Average - websites can probably track you
- **D (20-39):** Poor - significant privacy issues
- **F (0-19):** Exposed - you're basically carrying a digital billboard

The score weighs different factors. Graphics (canvas/WebGL) and Network (IP/WebRTC) carry the most weight because they're the hardest to fake and most commonly used for tracking.

Want specific advice? Tell me which layers are failing and I can help you fix them!`;
  }

  // VPN question
  if (normalized.includes('vpn')) {
    return `Here's the thing about VPNs that most people don't realize: a VPN only hides your IP address. It does nothing to prevent browser fingerprinting.

**What a VPN protects:**
- Your real IP address
- Your ISP from seeing your traffic
- Geolocation based on IP

**What a VPN does NOT protect:**
- Canvas fingerprinting (83%+ accurate)
- WebGL GPU signature
- Audio fingerprinting
- Font detection
- Screen resolution and device info

Think of it this way: a VPN is like wearing a mask but still having the same fingerprints, voice, and walking style. For real privacy, you need a VPN PLUS browser fingerprint protection.

Pro tip: Many VPNs don't even block WebRTC leaks, which can reveal your real IP anyway. Always test!`;
  }

  // Default response
  return `That's a great question about browser privacy! While I can't give you a detailed answer right now (I'm in offline mode), here are some quick tips:

**Essential privacy steps:**
1. Run our fingerprint scanner to see what websites see
2. Check for WebRTC leaks (very common!)
3. Consider using Brave or Firefox with privacy settings hardened
4. For serious privacy needs, look into anti-detect browsers

**Key facts to know:**
- 95.8% of users can be identified by fingerprinting
- Standard browsers leave 94.2% unique fingerprints
- Cookies are just the tip of the iceberg

Feel free to ask me about specific topics like canvas fingerprinting, WebRTC leaks, anti-detect browsers, or how to interpret your scan results!`;
}
