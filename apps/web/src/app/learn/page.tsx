import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'Learn Browser Fingerprinting | Anti-Detect.com',
  description:
    'Comprehensive guides on browser fingerprinting, anti-detection, and online privacy. Learn how websites track you and how to protect yourself.',
  openGraph: {
    title: 'Learn Browser Fingerprinting | Anti-Detect.com',
    description:
      'Comprehensive guides on browser fingerprinting, anti-detection, and online privacy.',
    type: 'website',
  },
};

interface Article {
  title: string;
  description: string;
  href: string;
  category: string;
  readTime: string;
  featured?: boolean;
}

const ARTICLES: Article[] = [
  {
    title: 'What is Browser Fingerprinting?',
    description:
      'A complete guide to understanding how websites identify and track you without cookies using browser fingerprinting techniques.',
    href: '/learn/browser-fingerprinting',
    category: 'Fundamentals',
    readTime: '12 min',
    featured: true,
  },
  {
    title: 'Canvas Fingerprinting Explained',
    description:
      'Deep dive into canvas fingerprinting: how it works, why it\'s so effective, and methods to protect against it.',
    href: '/learn/canvas-fingerprinting',
    category: 'Techniques',
    readTime: '8 min',
  },
  {
    title: 'WebRTC Leaks and How to Prevent Them',
    description:
      'Understanding WebRTC IP leaks that bypass VPNs and how to protect your real IP address.',
    href: '/learn/webrtc-leaks',
    category: 'Privacy',
    readTime: '6 min',
  },
  {
    title: 'TLS/JA3 Fingerprinting Guide',
    description:
      'How TLS fingerprints are used by bot detection systems and CDNs to identify automation tools.',
    href: '/learn/tls-fingerprinting',
    category: 'Advanced',
    readTime: '10 min',
  },
  {
    title: 'What is an Anti-Detect Browser?',
    description:
      'Complete guide to anti-detect browsers: what they are, how they work, and when you need one.',
    href: '/learn/anti-detect-browsers',
    category: 'Tools',
    readTime: '9 min',
  },
  {
    title: 'Font Fingerprinting Deep Dive',
    description:
      'How your installed fonts create a unique identifier and reveal your operating system.',
    href: '/learn/font-fingerprinting',
    category: 'Techniques',
    readTime: '7 min',
  },
  {
    title: 'Bot Detection: How Websites Catch Automation',
    description:
      'Inside look at how websites detect bots, scrapers, and automation tools.',
    href: '/learn/bot-detection',
    category: 'Advanced',
    readTime: '11 min',
  },
  {
    title: 'VPNs vs Anti-Detect Browsers',
    description:
      'Understanding the difference between VPNs and anti-detect browsers for online privacy.',
    href: '/learn/vpn-vs-antidetect',
    category: 'Privacy',
    readTime: '5 min',
  },
];

export default function LearnPage() {
  const featuredArticle = ARTICLES.find((a) => a.featured);
  const otherArticles = ARTICLES.filter((a) => !a.featured);
  const categories = [...new Set(ARTICLES.map((a) => a.category))];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Learn <span className="gradient-text">Browser Fingerprinting</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Comprehensive guides on how browser fingerprinting works, anti-detection techniques,
              and protecting your online privacy.
            </p>
          </div>

          {/* Featured Article */}
          {featuredArticle && (
            <Link
              href={featuredArticle.href}
              className="block mb-12 p-8 rounded-lg bg-gradient-to-br from-accent/20 to-success/10 border border-accent/30 hover:border-accent/50 transition-colors group"
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                Featured Guide
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mt-2 mb-4 group-hover:text-accent transition-colors">
                {featuredArticle.title}
              </h2>
              <p className="text-text-secondary mb-4 max-w-2xl">
                {featuredArticle.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="px-2 py-1 bg-bg-secondary rounded">{featuredArticle.category}</span>
                <span>{featuredArticle.readTime} read</span>
              </div>
            </Link>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-text-muted mr-2">Filter:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                className="px-3 py-1 text-sm border border-border rounded-full hover:border-accent hover:text-accent transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {otherArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="p-6 rounded-lg bg-bg-secondary border border-border hover:border-accent/50 transition-colors group"
              >
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {article.category}
                </span>
                <h3 className="text-lg font-bold text-text-primary mt-2 mb-3 group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-text-muted mb-4 line-clamp-2">{article.description}</p>
                <span className="text-xs text-text-muted">{article.readTime} read</span>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="p-8 rounded-lg bg-bg-secondary border border-border text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Ready to Test Your Browser?
            </h2>
            <p className="text-text-secondary mb-6 max-w-xl mx-auto">
              Use our free fingerprint scanner to see how unique and trackable your browser is.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-accent text-bg-primary font-semibold rounded-lg"
              >
                Scan My Browser
              </Link>
              <Link
                href="/tools"
                className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                Explore Tools
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
