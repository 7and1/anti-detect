# 🔐 How to Add GitHub Secrets

## Quick 5-Minute Setup

### Step 1: Open Repository Settings

Navigate to your repository:
```
https://github.com/anti-detect/anti-detect.com
```

Click the **Settings** tab (top right)

### Step 2: Navigate to Secrets

In the left sidebar:
1. Click **Secrets and variables**
2. Click **Actions**

Direct link:
```
https://github.com/anti-detect/anti-detect.com/settings/secrets/actions
```

### Step 3: Add Secrets

Click **"New repository secret"** button for each secret below:

---

#### Secret #1: Cloudflare Account ID

1. **Name:**
   ```
   CLOUDFLARE_ACCOUNT_ID
   ```

2. **Secret (Value):**
   ```
   your-cloudflare-account-id
   ```

   **Note:** Get this from your Cloudflare dashboard or the setup email

3. Click **"Add secret"**

---

#### Secret #2: Cloudflare API Token

1. **Name:**
   ```
   CLOUDFLARE_API_TOKEN
   ```

2. **Secret (Value):**
   ```
   your-cloudflare-api-token
   ```

   **Note:** Get this from Cloudflare Dashboard → My Profile → API Tokens

3. Click **"Add secret"**

---

#### Secret #3: OpenRouter API Key (Optional)

Only needed if using AI features:

1. **Name:**
   ```
   OPENROUTER_API_KEY
   ```

2. **Secret (Value):**
   ```
   your-openrouter-key-here
   ```

3. Click **"Add secret"**

---

### Step 4: Verify Secrets Are Added

After adding all secrets, you should see them listed:

- ✅ CLOUDFLARE_ACCOUNT_ID
- ✅ CLOUDFLARE_API_TOKEN
- ✅ OPENROUTER_API_KEY (optional)

**Note:** You won't be able to view the secret values after creation (by design).

---

### Step 5: Trigger Deployment

Push any change to the `main` branch:

```bash
# Option 1: Empty commit
git commit --allow-empty -m "chore: trigger deployment"
git push origin main

# Option 2: Commit the documentation files
git add .
git commit -m "docs: add deployment documentation"
git push origin main
```

---

### Step 6: Watch Deployment

Go to the Actions tab:
```
https://github.com/anti-detect/anti-detect.com/actions
```

You should see:
- ✅ Workflow running
- ✅ Lint & Test job passes
- ✅ Deploy API job starts
- ✅ Deploy Web job starts
- ✅ Deployment completes

---

## 🎯 What Happens Next?

Once secrets are added and code is pushed:

1. **GitHub Actions triggers** - Workflow starts automatically
2. **Code is built** - All packages compiled
3. **Tests run** - Quality checks pass
4. **API deploys** - To Cloudflare Workers
5. **Web deploys** - To Cloudflare Pages
6. **Site is live!** - https://anti-detect.com

---

## 🔒 Security Notes

✅ **Encrypted** - Secrets encrypted at rest and in transit
✅ **Private** - Only visible to repository admins
✅ **Secure** - Only GitHub Actions can access them
✅ **Safe for public repos** - Secrets never exposed in logs or code
✅ **Auditable** - All usage tracked in Actions tab

---

## 🐛 Troubleshooting

### "Secret not found" Error

- Verify secret name matches exactly (case-sensitive)
- No typos in the secret name
- Secret should be a **Repository Secret**, not Environment Secret

### Secret Not Working

1. Delete the secret
2. Re-add it (copy/paste carefully)
3. Ensure no extra spaces or line breaks

### Deployment Still Fails

1. Check Actions logs for specific error
2. Verify Cloudflare resources exist (D1, KV, R2)
3. Check wrangler.toml configuration
4. Ensure API token has correct permissions

---

## ✅ Checklist

- [ ] Opened repository settings
- [ ] Navigated to Secrets and variables → Actions
- [ ] Added CLOUDFLARE_ACCOUNT_ID secret
- [ ] Added CLOUDFLARE_API_TOKEN secret
- [ ] Added OPENROUTER_API_KEY secret (if needed)
- [ ] Verified all secrets are listed
- [ ] Pushed code to trigger deployment
- [ ] Checked Actions tab for workflow status
- [ ] Verified deployment completed successfully

---

## 📞 Need Help?

- Check the Actions logs for error messages
- Review `DEPLOYMENT_GUIDE.md` for detailed setup
- Verify Cloudflare dashboard for resource status

---

**Token Status:** ✅ Verified and Active

Your Cloudflare API token has been verified and is ready to use!
