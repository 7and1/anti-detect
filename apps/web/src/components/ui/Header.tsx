'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Scanner', href: '/', description: 'Test your fingerprint' },
    { name: 'Generator', href: '/generator', description: 'Generate fingerprints' },
    { name: 'Challenge', href: '/challenge', description: 'Prove you\'re human' },
    { name: 'Learn', href: '/learn', description: 'Education center' },
  ];

  // Open AI chat by dispatching custom event
  const openAIChat = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-privacy-ai-chat'));
    setIsMenuOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-terminal flex items-center justify-center">
              <svg
                className="w-5 h-5 text-bg-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-primary">
              Anti-<span className="text-success">detect</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            {/* AI Chat Button */}
            <button
              onClick={openAIChat}
              className="group relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-accent rounded-lg transition-colors"
              title="Ask Privacy AI"
            >
              <div className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
              </div>
              <span className="hidden lg:inline">AI</span>
            </button>

            <a
              href="https://mutilogin.com/?ref=antidetect"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-semibold bg-success text-bg-primary rounded-lg hover:bg-success/90 transition-colors"
            >
              Get Protected
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="block text-xs text-text-muted mt-0.5">{item.description}</span>
                </Link>
              ))}

              {/* AI Chat Button - Mobile */}
              <button
                onClick={openAIChat}
                className="mx-4 mt-2 px-4 py-3 flex items-center gap-3 text-left text-text-secondary hover:text-accent hover:bg-bg-hover rounded-lg transition-colors"
              >
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
                </div>
                <div>
                  <span className="font-medium">Privacy AI</span>
                  <span className="block text-xs text-text-muted mt-0.5">Ask about fingerprinting</span>
                </div>
              </button>

              <a
                href="https://mutilogin.com/?ref=antidetect"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-4 mt-4 px-4 py-2 text-center text-sm font-semibold bg-success text-bg-primary rounded-lg"
              >
                Get Protected
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
