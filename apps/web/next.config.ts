import type { NextConfig } from 'next';

// Bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features
  experimental: {
    // Enable React 19 features
    // reactCompiler: true, // Disabled - requires babel-plugin-react-compiler
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dialog'],
  },

  // Enable Edge Runtime for Cloudflare Pages
  // This allows deploying to Cloudflare's edge network
  ...(process.env.CLOUDFLARE_PAGES && {
    output: 'standalone',
  }),

  // Image optimization
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Production optimization
  swcMinify: true,
  compress: true,

  // Security headers + Performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/:path*.{jpg,jpeg,png,gif,svg,ico,webp,avif}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, must-revalidate',
          },
        ],
      },
      // Cache fonts
      {
        source: '/:path*.{woff,woff2,ttf,otf,eot}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Rewrites for API proxy to Cloudflare Worker
  // Note: /api/ai/* routes are handled by Next.js API routes (not proxied)
  async rewrites() {
    return [
      {
        source: '/api/scan/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.anti-detect.com'}/scan/:path*`,
      },
      {
        source: '/api/report/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.anti-detect.com'}/report/:path*`,
      },
      {
        source: '/api/ip/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.anti-detect.com'}/ip/:path*`,
      },
      {
        source: '/api/tls/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.anti-detect.com'}/tls/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
