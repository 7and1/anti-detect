import Link from 'next/link';

export function Footer() {
  const tools = [
    { name: 'Fingerprint Scanner', href: '/' },
    { name: 'Fingerprint Generator', href: '/tools/generator' },
    { name: 'Challenge Arena', href: '/tools/challenge' },
    { name: 'Automation Queue', href: '/automation' },
    { name: 'WebRTC Leak Test', href: '/tools/webrtc-leak' },
    { name: 'Canvas Fingerprint', href: '/tools/canvas-fingerprint' },
    { name: 'TLS Fingerprint', href: '/tools/tls-fingerprint' },
    { name: 'Timezone Checker', href: '/tools/timezone-check' },
  ];

  const learn = [
    { name: 'What is Browser Fingerprinting?', href: '/learn/browser-fingerprinting' },
    { name: 'How WebRTC Leaks Work', href: '/learn/webrtc-leaks' },
    { name: 'Canvas Fingerprinting Guide', href: '/learn/canvas-fingerprinting' },
    { name: 'Anti-Detect Browsers', href: '/learn/anti-detect-browsers' },
  ];

  const legal = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'About', href: '/about' },
  ];

  return (
    <footer className="bg-bg-secondary border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-terminal flex items-center justify-center">
                <svg className="w-5 h-5 text-bg-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-text-primary">
                Anti-<span className="text-success">detect</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-text-muted">
              The most comprehensive browser fingerprint analysis platform. Test, learn, and protect
              your online privacy.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://twitter.com/antidetect"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Tools
            </h3>
            <ul className="mt-4 space-y-2">
              {tools.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Learn
            </h3>
            <ul className="mt-4 space-y-2">
              {learn.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Contact
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:hello@anti-detect.com"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  hello@anti-detect.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="mt-8 p-4 bg-bg-tertiary rounded-lg">
              <div className="text-2xl font-bold text-success font-mono">127,543</div>
              <div className="text-xs text-text-muted mt-1">Fingerprints in database</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Anti-detect.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
