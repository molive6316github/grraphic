# Deployment Guide for Grraphic

This guide will help you deploy Grraphic to production.

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Google Cloud Console**: Set up OAuth credentials
3. **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **Stripe Account** (Optional): For payment processing

## Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI Configuration (Required)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Stripe Configuration (Optional - for payments)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Supabase Setup

### 1. Database Migrations

Run all migrations in order from the `supabase/migrations/` directory:

```bash
# Or use the Supabase CLI
supabase db push
```

### 2. Enable Row Level Security

All tables should have RLS enabled (already configured in migrations):
- `users` - User profiles and subscription data
- `design_analyses` - Design analysis history
- `admins` - Admin user management
- `stripe_customers` - Stripe customer records
- `stripe_subscriptions` - Subscription management
- `stripe_orders` - Order history

### 3. Configure Authentication

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Email/Password authentication
3. Enable Google OAuth:
   - Add your Google Client ID and Client Secret
   - Set redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### 4. Deploy Edge Functions

Deploy the Stripe webhook handler:

```bash
supabase functions deploy stripe-webhook
supabase functions deploy stripe-checkout
```

Set secrets for edge functions:

```bash
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 5. Enable pg_cron Extension

In your Supabase SQL editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

This enables automatic subscription expiration.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`
   - Supabase: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

## Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Enable the Generative Language API in Google Cloud Console
4. Set HTTP referrer restrictions (optional):
   - Add your production domain
   - Add `localhost:5173` for local development

## Stripe Setup (Optional)

### 1. Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a product "Grraphic Pro"
3. Add a recurring price (e.g., $9.99/month)
4. Copy the Price ID and update `src/stripe-config.ts`

### 2. Configure Webhook

1. Go to Developers > Webhooks in Stripe Dashboard
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret

## Building for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

The build output will be in the `dist/` directory.

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel settings
4. Deploy

### Option 2: Netlify

1. Push your code to GitHub
2. Import the repository in Netlify
3. Add environment variables in Netlify settings
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Deploy

### Option 3: Static Hosting

Upload the contents of `dist/` to any static hosting service:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- GitHub Pages

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Google OAuth working
- [ ] Gemini API responding
- [ ] Stripe webhooks receiving events (if using payments)
- [ ] Edge functions deployed and working
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Analytics/monitoring set up (optional)

## Admin Setup

To create the first admin user:

1. Sign up for an account through the app
2. In Supabase SQL editor, run:

```sql
INSERT INTO admins (user_id, granted_by)
VALUES ('your_user_id', 'your_user_id');
```

Replace `your_user_id` with your actual user ID from the `auth.users` table.

## Monitoring

Monitor your application using:
- Supabase Dashboard (database, auth, functions)
- Stripe Dashboard (payments, subscriptions)
- Browser console (client errors)
- Vercel/Netlify logs (deployment, runtime errors)

## Security Considerations

1. **Never commit `.env` files** - Already in .gitignore
2. **Use environment variables** - For all sensitive data
3. **Enable RLS** - Already configured on all tables
4. **Validate API keys** - Restrict by domain/IP
5. **Monitor usage** - Set up alerts for unusual activity
6. **Regular backups** - Configure in Supabase
7. **HTTPS only** - Enforce secure connections

## Troubleshooting

### Authentication Issues
- Verify Supabase URL and anon key
- Check Google OAuth redirect URIs
- Ensure RLS policies allow user operations

### API Errors
- Verify Gemini API key
- Check API restrictions in Google Cloud Console
- Monitor rate limits

### Payment Issues
- Verify Stripe keys (test vs. production)
- Check webhook endpoint is accessible
- Verify webhook secret matches

### Database Issues
- Check RLS policies
- Verify migrations ran successfully
- Check Supabase logs

## Support

For issues or questions:
1. Check Supabase documentation
2. Check Stripe documentation
3. Check Google AI documentation
4. Review application logs

## License

See LICENSE file for details.
