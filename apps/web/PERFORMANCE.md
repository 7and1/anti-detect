# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Anti-detect.com web application.

## 📊 Performance Metrics

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms
- **INP (Interaction to Next Paint)**: < 200ms

## 🚀 Implemented Optimizations

### 1. Next.js Configuration

**File**: `next.config.ts`

#### Compiler Optimizations
```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production',
}
```
- Removes console.log statements in production
- Reduces bundle size by ~5-10%

#### Package Import Optimization
```typescript
experimental: {
  optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dialog'],
}
```
- Tree-shakes large icon libraries
- Reduces initial bundle size by ~50KB

#### Compression
```typescript
swcMinify: true,
compress: true,
```
- SWC minifier (faster than Terser)
- Gzip compression enabled

#### Image Optimization
```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```
- Modern image formats (AVIF, WebP)
- Responsive image sizes
- 60-second minimum cache TTL

### 2. Caching Strategy

#### Static Assets (1 year cache)
```typescript
source: '/_next/static/:path*'
Cache-Control: public, max-age=31536000, immutable
```

#### Images (30 days cache)
```typescript
source: '/:path*.{jpg,jpeg,png,gif,svg,ico,webp,avif}'
Cache-Control: public, max-age=2592000, must-revalidate
```

#### Fonts (1 year cache)
```typescript
source: '/:path*.{woff,woff2,ttf,otf,eot}'
Cache-Control: public, max-age=31536000, immutable
```

### 3. Font Loading

**File**: `app/layout.tsx`

```typescript
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
```
- `font-display: swap` prevents FOIT (Flash of Invisible Text)
- Fonts load asynchronously
- CSS variables for efficient font switching

### 4. Web Vitals Monitoring

**File**: `lib/performance.ts`

- Automatic tracking of Core Web Vitals
- Real-time performance monitoring
- Metrics reported to analytics endpoint

```typescript
import { initWebVitals } from '@/lib/performance';

// In client component
useEffect(() => {
  initWebVitals();
}, []);
```

### 5. Bundle Analysis

#### View Bundle Size
```bash
# Analyze bundle with interactive visualization
pnpm build:analyze

# Get console report
pnpm perf:analyze
```

#### Bundle Size Thresholds
- **Warning**: 244 KB (uncompressed)
- **Error**: 488 KB (uncompressed)

### 6. Code Splitting

All routes are automatically code-split by Next.js App Router:
- `/` - Scanner page
- `/tools` - Tools directory
- `/generator` - Profile generator
- `/challenge` - Challenge arena
- `/learn` - Learning resources

### 7. Lighthouse CI

**File**: `lighthouserc.json`

```bash
# Run Lighthouse audit
pnpm lighthouse
```

Performance targets:
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

## 📈 Performance Testing

### Local Testing

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Analyze bundle size**
   ```bash
   pnpm perf:analyze
   ```

3. **Run Lighthouse**
   ```bash
   pnpm lighthouse
   ```

4. **View bundle visualization**
   ```bash
   pnpm build:analyze
   ```

### Production Testing

1. Deploy to Cloudflare Pages
2. Test with [PageSpeed Insights](https://pagespeed.web.dev/)
3. Monitor Core Web Vitals via Analytics
4. Use [WebPageTest](https://www.webpagetest.org/) for detailed analysis

## 🛠️ Performance Best Practices

### 1. Image Optimization

Always use Next.js Image component:
```tsx
import Image from 'next/image';

<Image
  src="/images/hero.png"
  alt="Hero image"
  width={1200}
  height={630}
  priority // For above-the-fold images
  placeholder="blur" // Optional blur placeholder
/>
```

### 2. Dynamic Imports

For heavy components:
```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR if not needed
});
```

### 3. React Server Components

Use Server Components by default:
```tsx
// app/page.tsx (Server Component by default)
export default function Page() {
  // Runs on server only
  return <div>Content</div>;
}
```

Add `'use client'` only when needed:
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect)
- Browser APIs

### 4. Avoid Layout Shift

Reserve space for dynamic content:
```tsx
<div className="min-h-[400px]">
  {loading ? <Skeleton /> : <Content />}
</div>
```

### 5. Prefetch Critical Resources

```tsx
<link rel="preconnect" href="https://api.anti-detect.com" />
<link rel="dns-prefetch" href="https://api.anti-detect.com" />
```

## 🔍 Monitoring

### Development

- Performance metrics logged to console (dev only)
- React DevTools Profiler for component analysis
- Bundle analyzer for size tracking

### Production

- Core Web Vitals sent to `/api/analytics/vitals`
- Monitor via Analytics dashboard
- Lighthouse CI in GitHub Actions

## 📦 Dependencies

### Production
- `web-vitals` - Core Web Vitals tracking

### Development
- `@next/bundle-analyzer` - Bundle size visualization
- `@lhci/cli` - Lighthouse CI automation

## 🎯 Performance Checklist

- [x] Enable SWC minification
- [x] Configure image optimization
- [x] Set up aggressive caching
- [x] Optimize font loading
- [x] Track Web Vitals
- [x] Configure bundle analyzer
- [x] Set up Lighthouse CI
- [x] Optimize package imports
- [x] Remove console.log in production
- [x] Enable compression

## 📚 Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Cloudflare Pages Performance](https://developers.cloudflare.com/pages/platform/limits/)

## 🚨 Common Issues

### Large Bundle Size

**Problem**: Bundle size exceeds 488 KB

**Solution**:
1. Run `pnpm build:analyze` to identify large chunks
2. Use dynamic imports for heavy components
3. Remove unused dependencies
4. Optimize third-party libraries

### Poor LCP Score

**Problem**: Largest Contentful Paint > 2.5s

**Solution**:
1. Optimize above-the-fold images
2. Use `priority` prop on hero images
3. Reduce server response time (TTFB)
4. Remove render-blocking resources

### High CLS Score

**Problem**: Cumulative Layout Shift > 0.1

**Solution**:
1. Set width/height on images and videos
2. Reserve space for dynamic content
3. Avoid inserting content above existing content
4. Use CSS transforms instead of layout properties

### Slow TTFB

**Problem**: Time to First Byte > 800ms

**Solution**:
1. Use Cloudflare edge caching
2. Optimize API response time
3. Enable HTTP/2 or HTTP/3
4. Use CDN for static assets

## 🎉 Expected Results

After implementing these optimizations, you should see:

- **Performance Score**: 90-100
- **LCP**: < 2.0s
- **FID**: < 50ms
- **CLS**: < 0.05
- **Bundle Size**: < 200 KB (initial load)
- **Page Load**: < 1.5s (on 3G)
- **Lighthouse Score**: 95+
