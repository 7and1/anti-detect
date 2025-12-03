# 🚀 Complete Deployment Guide

## ✅ Current Status

- **GitHub Actions workflow**: Already configured
- **Cloudflare API token**: Verified and active
- **Security**: All secrets use GitHub Secrets (safe for public repos)

---

## 📋 Step-by-Step Setup

### 1. Add GitHub Secrets (Required)

Go to: `https://github.com/anti-detect/anti-detect.com/settings/secrets/actions`

Click **"New repository secret"** and add each:

| Secret Name | Where to Get Value |
|------------|-------------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Workers & Pages → Overview |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens |
| `OPENROUTER_API_KEY` | OpenRouter Dashboard (optional) |

### 2. Set Up Cloudflare Resources (Required for API)

Before the API will work, you need to create these Cloudflare resources:

#### D1 Database
```bash
# Create D1 database
wrangler d1 create anti-detect

# Copy the database_id from output and update wrangler.toml
```

#### KV Namespaces
```bash
# Create KV namespaces
wrangler kv:namespace create IP_CACHE
wrangler kv:namespace create JA3_DB
wrangler kv:namespace create RATE_LIMITS

# Copy each ID and update wrangler.toml
```

#### R2 Bucket
```bash
# Create R2 bucket
wrangler r2 bucket create anti-detect-reports
```

#### Secrets (for Turnstile)
```bash
# Add Turnstile secret
wrangler secret put TURNSTILE_SECRET
# Enter your Cloudflare Turnstile secret key when prompted
```

### 3. Update wrangler.toml

Update `apps/api/wrangler.toml` with the IDs from step 2:

```toml
# Replace these placeholders with actual IDs:
database_id = "YOUR_D1_DATABASE_ID"  # From D1 creation
id = "YOUR_KV_ID"  # For each KV namespace
```

### 4. Test Deployment

```bash
# Commit your changes
git add .
git commit -m "chore: configure Cloudflare resources"
git push origin main
```

Then watch the deployment: `https://github.com/anti-detect/anti-detect.com/actions`

---

## 🔄 How It Works

### Automatic Deployments

| Event | Deployment | URL |
|-------|-----------|-----|
| Push to `main` | Production | https://anti-detect.com |
| Push to `staging` | Staging | https://staging.anti-detect.com |
| Open PR | Preview | Auto-generated URL |

### Workflow Steps

1. **Lint & Test** - Validates code quality
2. **Build Packages** - Compiles shared packages
3. **Deploy API** - Deploys to Cloudflare Workers
4. **Deploy Web** - Deploys to Cloudflare Pages

### Security Features

✅ Secrets stored securely in GitHub (never in code)
✅ Encrypted in transit and at rest
✅ Only accessible by GitHub Actions
✅ Safe for public repositories
✅ Full audit trail in Actions tab

---

## 🎯 Quick Commands

### Local Development
```bash
# Run everything
pnpm dev

# Run API only
pnpm --filter=@anti-detect/api dev

# Run web only
pnpm --filter=@anti-detect/web dev
```

### Build
```bash
# Build everything
pnpm build

# Build specific package
pnpm --filter=@anti-detect/web build
```

### Deploy Manually (if needed)
```bash
# Deploy API
pnpm --filter=@anti-detect/api deploy

# Deploy web
pnpm --filter=@anti-detect/web deploy

# Deploy everything
pnpm deploy
```

---

## 🔍 Monitoring & Debugging

### Check Deployment Status
- Actions: `https://github.com/anti-detect/anti-detect.com/actions`
- Cloudflare Dashboard: `https://dash.cloudflare.com`

### View Logs
```bash
# API logs
wrangler tail anti-detect-api

# Staging logs
wrangler tail anti-detect-api-staging
```

### Common Issues

#### Secret Not Working
1. Delete and re-add the secret (copy carefully)
2. Ensure no extra spaces
3. Verify exact name matches workflow

#### Build Fails
1. Test locally: `pnpm build`
2. Check Node version: `node -v` (should be v20+)
3. Clear cache: `pnpm clean && pnpm install`

#### API Deploy Fails
1. Verify Cloudflare resources exist
2. Check wrangler.toml IDs are correct
3. Ensure API token has correct permissions

---

## 📚 Documentation Files

- `DEPLOYMENT_SETUP.md` - Detailed setup guide
- `.github/SECRETS_CHECKLIST.md` - Quick checklist
- `DEPLOYMENT_GUIDE.md` - This file (complete guide)

---

## ⚠️ Important Notes

1. **Never commit secrets** - Always use GitHub Secrets or wrangler secrets
2. **Public repository** - Workflow is configured for public repos
3. **Token rotation** - Rotate API tokens periodically
4. **Branch protection** - Consider enabling branch protection for `main`
5. **Environment variables** - Set in GitHub Secrets, not in code

---

## 🎉 Next Steps

After deployment:

1. ✅ Verify site is live at https://anti-detect.com
2. ✅ Test API at https://api.anti-detect.com
3. ✅ Set up custom domain in Cloudflare (if needed)
4. ✅ Configure Turnstile for bot protection
5. ✅ Enable Cloudflare Analytics
6. ✅ Set up monitoring and alerts

---

**Status:** Ready to deploy ✓

Your workflow is already configured and your Cloudflare token is verified. Just add the secrets to GitHub and push your code!
