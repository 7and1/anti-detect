# Deployment Setup Guide

This guide explains how to securely configure GitHub Actions to deploy to Cloudflare Pages automatically.

## Prerequisites

- GitHub repository with admin access
- Cloudflare account with API token
- Project already configured for Cloudflare Pages

## Step 1: Add GitHub Secrets

GitHub Secrets store sensitive credentials securely and are never exposed in your code or logs.

### How to Add Secrets:

1. Go to your GitHub repository: `https://github.com/anti-detect/anti-detect.com`
2. Click on **Settings** (tab at the top)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret below:

### Required Secrets:

#### CLOUDFLARE_ACCOUNT_ID
- **Name:** `CLOUDFLARE_ACCOUNT_ID`
- **Value:** `[Get from Cloudflare Dashboard → Workers & Pages → Overview]`

#### CLOUDFLARE_API_TOKEN
- **Name:** `CLOUDFLARE_API_TOKEN`
- **Value:** `[Get from Cloudflare Dashboard → My Profile → API Tokens]`

#### OPENROUTER_API_KEY (if using AI features)
- **Name:** `OPENROUTER_API_KEY`
- **Value:** `[Your OpenRouter API key]`

## Step 2: Verify Workflow Configuration

The workflow file at `.github/workflows/deploy.yml` is already configured to:

✅ Run linting and type checking on all pushes
✅ Deploy to production when code is pushed to `main` branch
✅ Deploy to staging when code is pushed to `staging` branch
✅ Create preview deployments for pull requests
✅ Automatically comment on PRs with preview URLs

## Step 3: Test the Deployment

1. Make a small change to your code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "test: trigger deployment"
   git push origin main
   ```
3. Go to the **Actions** tab in your GitHub repository
4. You should see the workflow running
5. Once complete, your site will be deployed to Cloudflare Pages

## How It Works

### Automatic Deployments:

- **Push to `main`** → Deploys to production (`https://anti-detect.com`)
- **Push to `staging`** → Deploys to staging (`https://staging.anti-detect.com`)
- **Open a PR** → Creates a preview deployment with a unique URL

### Security Features:

✅ **No secrets in code** - All credentials stored in GitHub Secrets
✅ **Encrypted** - Secrets are encrypted at rest and in transit
✅ **Limited access** - Only GitHub Actions workflows can access secrets
✅ **Audit trail** - All deployments logged in Actions tab
✅ **Branch protection** - Deployments only from specified branches

## Deployment Steps (Automated):

1. **Lint & Test** - Runs on every push/PR
2. **Build** - Compiles all packages and apps
3. **Deploy API** - Deploys Hono API to Cloudflare Workers
4. **Deploy Web** - Deploys Next.js app to Cloudflare Pages

## Troubleshooting

### Deployment Fails

1. Check the **Actions** tab for error messages
2. Verify secrets are correctly set in repository settings
3. Ensure Cloudflare project name matches: `anti-detect-web`

### Secret Not Working

1. Delete and re-add the secret (they cannot be viewed after creation)
2. Ensure no extra spaces or characters were copied
3. Verify the secret name exactly matches the workflow file

### Build Errors

1. Test locally first: `pnpm build`
2. Check Node.js version matches workflow (v20)
3. Verify all environment variables are set

## Manual Deployment (if needed)

If you need to deploy manually:

```bash
# Deploy API
pnpm deploy:api

# Deploy Web
pnpm deploy:web

# Deploy everything
pnpm deploy
```

## Important Notes

⚠️ **Never commit API keys or secrets to your repository**
⚠️ **This repository will be public - secrets must stay in GitHub Settings**
⚠️ **Rotate your API tokens periodically for security**

## Next Steps

After setting up secrets:

1. ✅ Push code to trigger first deployment
2. ✅ Verify deployment in Cloudflare dashboard
3. ✅ Set up custom domain (if not already configured)
4. ✅ Enable branch protection rules in GitHub
5. ✅ Configure environment-specific settings
