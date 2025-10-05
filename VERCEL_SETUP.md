# Vercel Deployment Setup

Your app works on Bolt but not on Vercel because **environment variables are not configured**. Follow these steps to fix it.

## Quick Fix (5 minutes)

### Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the left sidebar
4. Add these variables one by one:

#### Required Variables:

```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your anon key)
```

```
Name: VITE_GEMINI_API_KEY
Value: AIzaSy... (your Gemini API key)
```

#### Optional (for Stripe payments):

```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_... (your Stripe key)
```

### Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Click **Settings** (gear icon) in sidebar
4. Click **API**
5. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`

### Step 3: Redeploy

After adding all environment variables:

1. Go back to your Vercel project
2. Click **Deployments** tab
3. Click the three dots (...) on the latest deployment
4. Click **Redeploy**

**That's it!** Your app should now work on Vercel.

---

## Detailed Instructions

### Where to Find Each Variable

#### VITE_SUPABASE_URL
- Location: Supabase Dashboard > Settings > API
- Format: `https://xxxxxxxxxxxxx.supabase.co`
- Example: `https://abcdefghijklmn.supabase.co`

#### VITE_SUPABASE_ANON_KEY
- Location: Supabase Dashboard > Settings > API > Project API keys
- Label: **anon** **public**
- Format: Long JWT token starting with `eyJ`
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...`

#### VITE_GEMINI_API_KEY
- Location: [Google AI Studio](https://makersuite.google.com/app/apikey)
- Format: Starts with `AIza`
- Example: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456`

#### VITE_STRIPE_PUBLISHABLE_KEY (Optional)
- Location: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- Label: **Publishable key**
- Format: Starts with `pk_test_` or `pk_live_`
- Example: `pk_test_51AbCdEf...`

---

## Vercel Environment Variable Settings

For each variable, use these settings:

- **Environment**: Select all (Production, Preview, Development)
- **Value**: Paste the actual value
- **Save**

### Screenshot Locations

1. **Vercel Dashboard** → Your Project
2. **Settings** tab
3. **Environment Variables** (left sidebar)
4. **Add New** button
5. Fill in Name and Value
6. Select all environments
7. Click **Save**

---

## Common Issues

### Issue: "Supabase not configured" message

**Solution**:
- Verify `VITE_SUPABASE_URL` is set correctly
- Verify `VITE_SUPABASE_ANON_KEY` is set correctly
- Make sure both start with `VITE_` prefix
- Redeploy after adding variables

### Issue: "Gemini API error"

**Solution**:
- Verify `VITE_GEMINI_API_KEY` is set
- Check the API key is valid in Google AI Studio
- Ensure Generative Language API is enabled

### Issue: Variables not working after adding them

**Solution**:
- Click **Redeploy** on latest deployment
- Environment variables only apply to new builds
- Wait for deployment to complete

### Issue: App works locally but not on Vercel

**Solution**:
- Local uses `.env` file
- Vercel needs variables added in dashboard
- They must have exact same names

---

## Verification Checklist

After deployment, verify:

- [ ] Homepage loads without errors
- [ ] Can sign up / sign in
- [ ] Can upload a design
- [ ] Analysis completes successfully
- [ ] No console errors about Supabase
- [ ] `/design-help` page works
- [ ] `/design-info` page works

---

## Alternative: Use Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add VITE_SUPABASE_URL production
# Paste value when prompted

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste value when prompted

vercel env add VITE_GEMINI_API_KEY production
# Paste value when prompted

# Redeploy
vercel --prod
```

---

## Security Note

✅ **Safe to use in Vercel:**
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key (protected by RLS)
- `VITE_GEMINI_API_KEY` - Has domain restrictions
- `VITE_STRIPE_PUBLISHABLE_KEY` - Public publishable key

❌ **Never use in frontend:**
- Supabase service role key
- Stripe secret key
- Any private keys

The `VITE_` prefix makes these variables available to the browser, which is intended for these public keys.

---

## Still Not Working?

1. **Check Vercel build logs:**
   - Deployments tab → Click latest deployment
   - Check for build errors

2. **Check browser console:**
   - Open your Vercel site
   - Press F12
   - Look for errors in Console tab

3. **Verify environment variables are loaded:**
   - In browser console, type:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```
   - Should show your Supabase URL
   - If shows `undefined`, variables aren't loaded

4. **Check Supabase is accessible:**
   - Visit your Supabase URL directly
   - Should show "ok" or similar response

---

## Need Help?

If issues persist:

1. Check Vercel deployment logs
2. Check browser console errors
3. Verify all environment variables are set
4. Make sure you redeployed after adding variables
5. Check Supabase project is active

**Most common fix:** Add the environment variables and click Redeploy!
