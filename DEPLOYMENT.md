# Deployment Guide

Complete guide for deploying Anti-detect.com to production using Cloudflare Pages (frontend) and Cloudflare Workers (backend).

## 📋 Prerequisites

### Required Accounts
- [x] Cloudflare account (Free tier sufficient for testing)
- [x] GitHub account (for CI/CD)
- [x] Domain name (configured in Cloudflare)

### Required Tools
```bash
# Node.js 18+ and pnpm
node --version  # v18.0.0 or higher
pnpm --version  # v8.0.0 or higher

# Wrangler CLI
pnpm add -g wrangler
wrangler --version

# Playwright (for E2E tests)
pnpm install
pnpm exec playwright install
```

---

## 🚀 Deployment Steps

### Phase 1: Cloudflare Setup

#### 1.1 Create Cloudflare Turnstile Site

1. Go to https://dash.cloudflare.com/
2. Navigate to **Turnstile** section
3. Click **Add Site**
4. Configure:
   - **Site name**: Anti-detect.com
   - **Domain**: anti-detect.com
   - **Widget Mode**: Invisible
5. Save the **Site Key** and **Secret Key**

#### 1.2 Create D1 Database

```bash
# Navigate to API directory
cd apps/api

# Create D1 database
wrangler d1 create anti-detect

# Output will show:
# database_id = "xxxx-xxxx-xxxx-xxxx"
# Copy this ID to wrangler.toml
```

**Update `apps/api/wrangler.toml`**:
```toml
[[d1_databases]]
binding = "DB"
database_name = "anti-detect"
database_id = "YOUR_D1_DATABASE_ID"  # Replace with actual ID
```

**Initialize database schema**:
```bash
# Apply migrations
wrangler d1 execute anti-detect --file=./migrations/0001_initial.sql
wrangler d1 execute anti-detect --file=./migrations/0002_analytics.sql
```

#### 1.3 Create KV Namespaces

```bash
# Create KV namespaces
wrangler kv:namespace create "IP_CACHE"
wrangler kv:namespace create "JA3_DB"
wrangler kv:namespace create "RATE_LIMITS"

# Output will show IDs for each:
# id = "xxxx"
# Copy these IDs to wrangler.toml
```

**Update `apps/api/wrangler.toml`**:
```toml
[[kv_namespaces]]
binding = "IP_CACHE"
id = "YOUR_IP_CACHE_KV_ID"

[[kv_namespaces]]
binding = "JA3_DB"
id = "YOUR_JA3_DB_KV_ID"

[[kv_namespaces]]
binding = "RATE_LIMITS"
id = "YOUR_RATE_LIMITS_KV_ID"
```

#### 1.4 Create R2 Bucket

```bash
# Create R2 bucket for report storage
wrangler r2 bucket create anti-detect-reports

# Update wrangler.toml (bucket_name already configured)
```

#### 1.5 Configure Cloudflare Workers Secrets

```bash
# Navigate to API directory
cd apps/api

# Set Turnstile secret
wrangler secret put TURNSTILE_SECRET
# Enter your Turnstile secret key when prompted

# Verify secrets
wrangler secret list
```

---

### Phase 2: Backend Deployment (Cloudflare Workers)

#### 2.1 Update Configuration

Edit `apps/api/wrangler.toml`:
```toml
[vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://anti-detect.com"  # Your production domain
TURNSTILE_SITE_KEY = "YOUR_PRODUCTION_SITE_KEY"
```

#### 2.2 Deploy API

```bash
cd apps/api

# Build and deploy
pnpm build
wrangler deploy

# Output will show:
# ✅ Published anti-detect-api
# https://anti-detect-api.YOUR_SUBDOMAIN.workers.dev
```

#### 2.3 Configure Custom Domain

1. Go to Cloudflare Dashboard → Workers
2. Select `anti-detect-api`
3. Click **Triggers** tab
4. Add **Custom Domain**: `api.anti-detect.com`
5. Cloudflare will automatically provision SSL certificate

#### 2.4 Verify API

```bash
# Test health endpoint
curl https://api.anti-detect.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-01T...","environment":"production"}
```

---

### Phase 3: Frontend Deployment (Cloudflare Pages)

#### 3.1 Configure Environment Variables

Create `apps/web/.env.production`:
```bash
NEXT_PUBLIC_API_URL=https://api.anti-detect.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=YOUR_PRODUCTION_SITE_KEY
```

#### 3.2 Build for Cloudflare Pages

```bash
cd apps/web

# Install dependencies
pnpm install

# Build with Cloudflare adapter
pnpm build:cf

# Output directory: .vercel/output/static
```

#### 3.3 Deploy to Cloudflare Pages

**Option A: Using Wrangler CLI**
```bash
cd apps/web

# Deploy
wrangler pages deploy .vercel/output/static --project-name=anti-detect-web

# Output will show:
# ✅ Deployment complete!
# https://anti-detect-web.pages.dev
```

**Option B: Using Cloudflare Dashboard**
1. Go to https://dash.cloudflare.com/ → **Pages**
2. Click **Create a project**
3. Connect to GitHub repository
4. Configure build settings:
   - **Build command**: `cd apps/web && pnpm build:cf`
   - **Build output directory**: `apps/web/.vercel/output/static`
   - **Root directory**: `/`
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://api.anti-detect.com`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: `<your-site-key>`
6. Click **Save and Deploy**

#### 3.4 Configure Custom Domain

1. Go to Cloudflare Pages project settings
2. Click **Custom domains**
3. Add domain: `anti-detect.com` and `www.anti-detect.com`
4. Cloudflare will automatically:
   - Create DNS records
   - Provision SSL certificate
   - Enable HTTP/3

#### 3.5 Verify Frontend

Visit https://anti-detect.com and verify:
- [ ] Page loads correctly
- [ ] Scanner works
- [ ] Turnstile verification functions
- [ ] API calls succeed
- [ ] All tools load

---

### Phase 4: DNS Configuration

#### 4.1 DNS Records (Cloudflare DNS)

```
Type    Name    Content                             Proxy
----    ----    -------                             -----
A       @       192.0.2.1 (Cloudflare Pages)       ✅ Proxied
CNAME   www     anti-detect.com                    ✅ Proxied
CNAME   api     anti-detect-api.workers.dev        ✅ Proxied
```

#### 4.2 SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode: **Full (strict)**
3. Enable:
   - [ ] Always Use HTTPS
   - [ ] HTTP Strict Transport Security (HSTS)
   - [ ] Minimum TLS Version: 1.2
   - [ ] TLS 1.3: Enabled

---

## 🔧 CI/CD Setup (GitHub Actions)

### 5.1 Create GitHub Secrets

Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
```
CLOUDFLARE_API_TOKEN=<your-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
NEXT_PUBLIC_API_URL=https://api.anti-detect.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-site-key>
```

### 5.2 Create Workflow Files

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Unit tests
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: E2E tests
        run: pnpm test:e2e
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8787
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA

  deploy-api:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Deploy to Cloudflare Workers
        run: pnpm wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-web:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build:cf
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${{ secrets.NEXT_PUBLIC_TURNSTILE_SITE_KEY }}

      - name: Deploy to Cloudflare Pages
        run: pnpm wrangler pages deploy .vercel/output/static --project-name=anti-detect-web
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 📊 Post-Deployment Verification

### Functional Testing
```bash
# Health check
curl https://api.anti-detect.com/health

# Frontend accessibility
curl -I https://anti-detect.com

# SSL certificate
openssl s_client -connect anti-detect.com:443 -servername anti-detect.com

# DNS resolution
dig anti-detect.com
dig api.anti-detect.com
```

### Performance Testing
```bash
# Run Lighthouse
cd apps/web
pnpm lighthouse

# Expected scores:
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

### Security Testing
```bash
# Check security headers
curl -I https://anti-detect.com

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

---

## 🔍 Monitoring & Logging

### Cloudflare Analytics

1. **Workers Analytics**
   - Go to Cloudflare Dashboard → Workers → `anti-detect-api` → **Metrics**
   - Monitor: Requests, Errors, CPU time, Duration

2. **Pages Analytics**
   - Go to Cloudflare Dashboard → Pages → `anti-detect-web` → **Analytics**
   - Monitor: Page views, Bandwidth, Top pages

3. **Web Analytics** (Optional)
   - Enable Cloudflare Web Analytics for detailed visitor insights

### Log Streaming

```bash
# Stream Workers logs
wrangler tail anti-detect-api

# Filter errors only
wrangler tail anti-detect-api --status error
```

### Alerts Setup

1. Go to **Notifications** in Cloudflare Dashboard
2. Create alerts for:
   - [ ] High error rate (>5% error rate)
   - [ ] Traffic spike (>10x normal traffic)
   - [ ] SSL certificate expiration
   - [ ] Origin health check failures

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Turnstile verification failed"
```bash
# Verify secret is set
wrangler secret list

# Check CORS origin
# Ensure CORS_ORIGIN in wrangler.toml matches frontend domain
```

#### 2. "Rate limit exceeded"
```bash
# Check KV namespace is configured
wrangler kv:namespace list

# Verify RATE_LIMITS binding in wrangler.toml
```

#### 3. "Database not found"
```bash
# List D1 databases
wrangler d1 list

# Verify database_id in wrangler.toml
```

#### 4. "CORS error"
```bash
# Check CORS_ORIGIN environment variable
# Frontend URL: https://anti-detect.com
# API expects: CORS_ORIGIN=https://anti-detect.com
```

### Rollback Procedure

**Workers**:
```bash
# List deployments
wrangler deployments list

# Rollback to previous deployment
wrangler rollback <deployment-id>
```

**Pages**:
1. Go to Cloudflare Dashboard → Pages → `anti-detect-web`
2. Click **Deployments**
3. Find previous successful deployment
4. Click **···** → **Rollback to this deployment**

---

## 📈 Scaling Considerations

### Performance Optimization

- **Workers**: Default 100k requests/day (free), unlimited on paid plans
- **Pages**: Unlimited requests, 500 builds/month
- **D1**: 5GB storage (free), 100k reads/day, 50k writes/day
- **KV**: 100k reads/day (free), 1k writes/day
- **R2**: 10GB storage (free), 10M read requests/month

### Upgrade Path

When you outgrow free tier:
1. **Workers Paid** ($5/month): 10M requests, additional $0.50/million
2. **Pages Pro** ($20/month): 5k builds, advanced features
3. **D1 Paid**: Pay-as-you-go for additional storage and operations

---

## 🎉 Success Checklist

- [ ] Backend API deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] Turnstile working
- [ ] Rate limiting functional
- [ ] Database migrations applied
- [ ] All tests passing
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Security headers verified
- [ ] Performance scores >90
- [ ] CI/CD pipeline active

---

## 📞 Support

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community**: https://discord.gg/cloudflaredev

---

**Deployment Complete! 🚀**

Your Anti-detect.com application is now live and serving users globally on Cloudflare's edge network.
