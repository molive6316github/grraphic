/*
  # Configure Email Verification Settings

  This migration documents the email verification configuration.
  
  ## Email Verification Settings (configured in Supabase Dashboard):
  
  1. Authentication > Providers > Email
     - Enable email provider
     - Confirm email: ENABLED
     - Secure email change: ENABLED
     
  2. Authentication > Email Templates
     - Confirmation email: Customize with your branding
     - Password reset email: Customize with your branding
     
  3. Authentication > URL Configuration
     - Site URL: Your production URL
     - Redirect URLs: Add your production and development URLs
     
  ## Notes:
  - Email verification is required for new signups
  - Users must verify their email before they can sign in
  - Password reset emails are sent with a secure token
  - All auth emails use Supabase's email service by default
*/

-- This migration serves as documentation for email verification configuration
-- The actual email verification settings are configured in the Supabase Dashboard
SELECT 1;
