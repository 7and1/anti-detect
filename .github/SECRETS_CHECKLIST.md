# GitHub Secrets Setup Checklist

## Quick Setup (5 minutes)

### 1. Go to Repository Settings
- Navigate to: `https://github.com/anti-detect/anti-detect.com/settings/secrets/actions`

### 2. Add These Secrets

Click **"New repository secret"** for each:

#### Secret 1: CLOUDFLARE_ACCOUNT_ID
```
Name: CLOUDFLARE_ACCOUNT_ID
Value: [your-cloudflare-account-id]
```
Get from: Cloudflare Dashboard → Workers & Pages → Overview

#### Secret 2: CLOUDFLARE_API_TOKEN
```
Name: CLOUDFLARE_API_TOKEN
Value: [your-cloudflare-api-token]
```
Get from: Cloudflare Dashboard → My Profile → API Tokens

#### Secret 3: OPENROUTER_API_KEY (optional - for AI features)
```
Name: OPENROUTER_API_KEY
Value: [your-openrouter-key]
```

### 3. Verify Setup

After adding secrets, trigger a deployment:

```bash
git commit --allow-empty -m "chore: trigger deployment"
git push origin main
```

Then check: `https://github.com/anti-detect/anti-detect.com/actions`

---

## ✅ Checklist

- [ ] Added `CLOUDFLARE_ACCOUNT_ID` secret
- [ ] Added `CLOUDFLARE_API_TOKEN` secret
- [ ] Added `OPENROUTER_API_KEY` secret (if needed)
- [ ] Pushed code to test deployment
- [ ] Verified workflow runs successfully in Actions tab
- [ ] Confirmed site is deployed to Cloudflare Pages

---

## Security Notes

✅ **Safe to delete this file after setup** - It contains instructions only
✅ **Never commit actual secret values** - They're stored securely in GitHub
✅ **Workflow already configured** - Just add secrets and it works automatically

---

**Status:** Cloudflare API token verified ✓ (Valid and Active)
