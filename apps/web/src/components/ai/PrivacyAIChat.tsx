'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

interface ScanContext {
  trustScore?: number;
  grade?: string;
  criticalIssues?: string[];
  warnings?: string[];
}

interface PrivacyAIChatProps {
  scanContext?: ScanContext;
  scanComplete?: boolean; // New prop to detect when scan is complete
}

const MAX_MESSAGES_PER_MINUTE = 6;
const PROMPT_DELAY_MS = 15000; // 15 seconds

const quickStartQuestions = [
  'What is browser fingerprinting?',
  'How do I protect my privacy?',
  'What does my score mean?',
  'Is a VPN enough?',
];

export function PrivacyAIChat({ scanContext, scanComplete }: PrivacyAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey there! I'm your Privacy AI assistant. I can help you understand browser fingerprinting, interpret your scan results, and give you practical tips to protect your online privacy.

What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showScanPrompt, setShowScanPrompt] = useState(false); // New state for scan complete prompt
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasShownScanPrompt, setHasShownScanPrompt] = useState(false); // Track if we've shown scan prompt

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show scan complete prompt immediately when scan finishes
  useEffect(() => {
    if (scanComplete && scanContext && !hasShownScanPrompt && !isOpen) {
      // Clear any existing timer
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
      setShowBubble(false);
      setShowScanPrompt(true);
      setHasShownScanPrompt(true);
    }
  }, [scanComplete, scanContext, hasShownScanPrompt, isOpen]);

  // Show bubble prompt after 15 seconds (only if no scan has been done)
  useEffect(() => {
    if (!scanComplete && !hasInteracted) {
      bubbleTimerRef.current = setTimeout(() => {
        if (!hasInteracted && !showScanPrompt) {
          setShowBubble(true);
        }
      }, PROMPT_DELAY_MS);
    }

    return () => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
    };
  }, [hasInteracted, scanComplete, showScanPrompt]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Listen for open chat event from header menu
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setShowBubble(false);
      setShowScanPrompt(false);
      setHasInteracted(true);
    };

    window.addEventListener('open-privacy-ai-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-privacy-ai-chat', handleOpenChat);
    };
  }, []);

  // Rate limiting check
  const canSend = useMemo(() => {
    const now = Date.now();
    return timestamps.filter((ts) => now - ts < 60_000).length < MAX_MESSAGES_PER_MINUTE;
  }, [timestamps]);

  const pushMessage = useCallback((role: 'assistant' | 'user', content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, content },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!canSend) {
        setError('Slow down! You can send up to 6 messages per minute.');
        return;
      }

      setError('');
      pushMessage('user', trimmed);
      setInput('');
      setIsThinking(true);
      setHasInteracted(true);
      setShowBubble(false);

      setTimestamps((prev) => {
        const now = Date.now();
        const recent = prev.filter((ts) => now - ts < 60_000);
        return [...recent, now];
      });

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            context: scanContext,
          }),
        });

        if (!response.ok) {
          throw new Error('Request failed');
        }

        const data = await response.json();
        if (data.success && data.message?.content) {
          pushMessage('assistant', data.message.content);
        } else {
          pushMessage('assistant', 'Sorry, I encountered an issue. Please try again!');
        }
      } catch (err) {
        console.error('Chat error:', err);
        pushMessage('assistant', 'Oops! Something went wrong. Please try again.');
      } finally {
        setIsThinking(false);
      }
    },
    [canSend, pushMessage, scanContext]
  );

  const handleToggle = useCallback(() => {
    setIsOpen((current) => !current);
    setShowBubble(false);
    setShowScanPrompt(false);
    setHasInteracted(true);
  }, []);

  // Handle AI analysis of scan results
  const handleAnalyzeScan = useCallback(() => {
    setShowScanPrompt(false);
    setShowBubble(false);
    setIsOpen(true);
    setHasInteracted(true);

    // Build analysis request based on scan context
    if (scanContext) {
      const grade = scanContext.grade || 'Unknown';
      const score = scanContext.trustScore ?? 0;
      const issues = scanContext.criticalIssues?.length || 0;
      const warnings = scanContext.warnings?.length || 0;

      const analysisPrompt = `Analyze my browser fingerprint scan results: I got a ${grade} grade with a trust score of ${score}/100. I have ${issues} critical issues and ${warnings} warnings. What does this mean and how can I improve my privacy?`;

      // Send the analysis request
      sendMessage(analysisPrompt);
    }
  }, [scanContext, sendMessage]);

  // Dismiss scan prompt without analyzing
  const handleDismissScanPrompt = useCallback(() => {
    setShowScanPrompt(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}

      {/* Chat container */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {/* Scan Complete Prompt - Shows immediately after scan */}
        {showScanPrompt && !isOpen && scanContext && (
          <div
            className="pointer-events-auto animate-fade-in-up max-w-sm rounded-2xl border border-success/40 bg-bg-secondary/95 backdrop-blur-xl p-4 shadow-2xl shadow-success/20"
            role="alert"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-success flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-success">
                  Scan Complete
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-text-primary">
                    Grade: {scanContext.grade}
                  </span>
                  <span className="text-sm text-text-muted">
                    ({scanContext.trustScore}/100)
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-text-secondary mb-4">
              Want me to analyze your results and explain what they mean? I can give you personalized tips to improve your privacy.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleAnalyzeScan}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-accent to-success text-white font-semibold rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Yes, Analyze My Results
              </button>
              <button
                onClick={handleDismissScanPrompt}
                className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors text-sm"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {/* Regular Bubble prompt - Shows after 15 seconds if no scan */}
        {showBubble && !isOpen && !showScanPrompt && (
          <div
            className="pointer-events-auto animate-fade-in-up max-w-xs rounded-2xl border border-accent/30 bg-bg-secondary/95 backdrop-blur-xl p-4 shadow-2xl shadow-accent/10"
            role="alert"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Privacy AI
              </span>
            </div>
            <p className="text-sm text-text-primary font-medium mb-1">
              Questions about your privacy?
            </p>
            <p className="text-xs text-text-muted mb-3">
              I can explain your fingerprint results and help you protect yourself.
            </p>
            <button
              onClick={handleToggle}
              className="text-xs font-bold uppercase tracking-widest text-success hover:text-success/80 transition-colors"
            >
              Start Chat →
            </button>
          </div>
        )}

        {/* Chat window */}
        {isOpen && (
          <div
            className="pointer-events-auto fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 animate-scale-in"
            role="dialog"
            aria-label="Privacy AI Chat"
          >
            {/* Glass card */}
            <div className="rounded-3xl border border-border/50 bg-bg-secondary/95 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
              {/* Header */}
              <div className="relative px-6 py-4 border-b border-border/50 bg-gradient-to-r from-accent/10 to-success/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center shadow-lg shadow-accent/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-bg-secondary animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">Privacy AI</h3>
                      <p className="text-xs text-text-muted">Browser fingerprinting expert</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggle}
                    className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
                    aria-label="Close chat"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-accent text-white rounded-br-md'
                          : 'bg-bg-tertiary text-text-primary rounded-bl-md'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-success">
                            AI
                          </span>
                        </div>
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-bg-tertiary rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-text-muted">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              {messages.length <= 2 && !isThinking && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {quickStartQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => sendMessage(question)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent hover:text-accent transition-all bg-bg-tertiary/50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="p-4 border-t border-border/50 bg-bg-tertiary/30">
                {error && (
                  <p className="text-xs text-warning mb-2">{error}</p>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about privacy & fingerprinting..."
                    className="flex-1 bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                    disabled={isThinking}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={isThinking || !input.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-accent to-success text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
                    aria-label="Send message"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center mt-2">
                  Powered by AI · Privacy-focused responses
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={handleToggle}
          className={`pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
            isOpen
              ? 'bg-bg-tertiary text-text-primary rotate-90'
              : 'bg-gradient-to-br from-accent to-success text-white'
          }`}
          aria-label={isOpen ? 'Close Privacy AI chat' : 'Open Privacy AI chat'}
        >
          {/* Pulsing ring when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full animate-ping bg-accent/30" />
          )}

          {/* Icon */}
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}

          {/* Sparkle effect */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
              <span className="absolute h-full w-full rounded-full bg-success animate-pulse" />
              <span className="relative h-2 w-2 rounded-full bg-white" />
            </span>
          )}
        </button>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thumb-border::-webkit-scrollbar-thumb {
          background-color: var(--color-border);
          border-radius: 3px;
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </>
  );
}

function formatMessage(content: string): React.ReactNode {
  // Split by lines and handle markdown-like formatting
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    // Bold text **text**
    let formattedLine: React.ReactNode = line;
    if (line.includes('**')) {
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      formattedLine = parts.map((part, idx) =>
        idx % 2 === 1 ? (
          <strong key={idx} className="font-semibold text-accent">
            {part}
          </strong>
        ) : (
          part
        )
      );
    }

    // Bullet points
    if (line.trim().startsWith('- ')) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 my-1">
          <span className="text-success shrink-0">•</span>
          <span>{typeof formattedLine === 'string' ? formattedLine.replace(/^-\s*/, '') : formattedLine}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const listMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (listMatch) {
      elements.push(
        <div key={`ol-${i}`} className="flex gap-2 my-1">
          <span className="text-accent font-semibold shrink-0">{listMatch[1]}.</span>
          <span>{listMatch[2]}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1">
        {formattedLine}
      </p>
    );
  }

  return <>{elements}</>;
}
