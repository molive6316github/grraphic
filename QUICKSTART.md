# Quick Start Guide

Get Grraphic up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- A Gemini API key (free tier works)

## Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your project URL and anon key
3. Go to SQL Editor and run all migrations from `supabase/migrations/` in order

## Step 3: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Enable the Generative Language API in Google Cloud Console

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Required - Get from Supabase Dashboard > Settings > API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Required - Get from Google AI Studio
VITE_GEMINI_API_KEY=your-gemini-api-key

# Optional - Only needed if using Stripe payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Step 5: Run Database Migrations

In your Supabase SQL Editor, run each migration file in order:

1. `20250920210007_tiny_credit.sql`
2. `20250921111650_mute_torch.sql`
3. `20250922102408_tender_fountain.sql`
4. `20251001110018_young_canyon.sql`
5. `20251001112208_broad_temple.sql`
6. `20251001112506_dry_spire.sql`
7. `20251001112822_fierce_coast.sql`
8. `20251002231933_add_public_analysis_policy.sql`
9. `20251002232205_add_username_to_users.sql`
10. `20251002232359_update_handle_new_user_with_username.sql`
11. `20251003204139_fix_admin_policies.sql`
12. `20251005154036_fix_admin_policies_final.sql`
13. `20251005154238_allow_admins_view_all_users.sql`
14. `20251005154432_add_subscription_expiration.sql`
15. `20251005160032_add_cron_expire_subscriptions.sql`

Or use the Supabase CLI:

```bash
supabase db push
```

## Step 6: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Step 7: Create Your First Admin User

1. Sign up for an account through the app
2. In Supabase SQL Editor, run:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Then insert into admins table (replace YOUR_USER_ID)
INSERT INTO admins (user_id, granted_by)
VALUES ('YOUR_USER_ID', 'YOUR_USER_ID');
```

## Step 8: Test the App

1. **Upload a design**: Click "Upload Design" and select an image
2. **Get analysis**: Wait for AI analysis to complete
3. **View history**: Check your analysis history
4. **Share**: Make an analysis public and share the link
5. **Admin panel**: Access admin features via the shield icon

## Optional: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. In Supabase Dashboard > Authentication > Providers:
   - Enable Google provider
   - Paste your Client ID and Secret

## Optional: Set Up Stripe Payments

See `DEPLOYMENT.md` for detailed Stripe setup instructions.

## Troubleshooting

### "Supabase not configured" error
- Check that `.env` file exists
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Restart the dev server after changing .env

### "Gemini API error"
- Verify VITE_GEMINI_API_KEY is correct
- Check that Generative Language API is enabled
- Ensure you haven't hit rate limits

### "Cannot read properties of undefined"
- Run all database migrations
- Check browser console for specific errors
- Verify RLS policies are enabled

### Authentication not working
- Check Supabase project is active
- Verify email provider is enabled
- Check browser console for errors

### Images not uploading
- Files must be under 10MB
- Only image files are accepted (JPG, PNG, GIF, WebP)
- Check browser console for specific errors

## Development Tips

- Use Chrome DevTools for debugging
- Check Network tab for API errors
- Monitor Supabase logs for database issues
- Use React DevTools for component debugging

## Next Steps

1. Read `FEATURES.md` to learn about all features
2. Read `DEPLOYMENT.md` for production deployment
3. Customize the design and branding
4. Add your own features!

## Getting Help

- Check browser console for errors
- Check Supabase logs
- Review migration files for database schema
- Check environment variables are set correctly

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## File Structure

```
grraphic/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── supabase/
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge functions
├── public/             # Static assets
├── .env                # Environment variables (create this)
└── package.json        # Dependencies
```

That's it! You're ready to start using Grraphic. Happy designing! 🎨
