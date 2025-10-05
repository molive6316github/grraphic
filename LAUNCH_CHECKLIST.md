# Launch Checklist

Use this checklist before deploying Grraphic to production.

## Pre-Launch Verification

### Environment Setup
- [ ] All environment variables configured in `.env`
- [ ] Supabase project created and configured
- [ ] Gemini API key obtained and tested
- [ ] Stripe account set up (if using payments)
- [ ] Google OAuth configured (if using)

### Database
- [ ] All 15 migrations applied successfully
- [ ] RLS enabled on all tables
- [ ] Test policies allow expected access
- [ ] Test policies block unauthorized access
- [ ] pg_cron extension enabled
- [ ] Scheduled jobs configured

### Authentication
- [ ] Email/password sign-up works
- [ ] Email/password sign-in works
- [ ] Google OAuth works (if enabled)
- [ ] Session persistence works
- [ ] Sign-out works correctly
- [ ] Protected routes require authentication

### Core Features
- [ ] File upload works (under 3MB)
- [ ] Large file upload works for Pro users (3-10MB)
- [ ] AI analysis completes successfully
- [ ] Analysis results display correctly
- [ ] Analysis history saves
- [ ] Analysis history loads
- [ ] Delete analysis works
- [ ] Public sharing works
- [ ] Public analysis view works

### Subscriptions
- [ ] Pro subscription checkout works
- [ ] Webhook receives events
- [ ] Subscription status updates
- [ ] Pro features unlock after subscription
- [ ] Credit system tracks usage
- [ ] Monthly credit reset configured
- [ ] Subscription expiration works

### Admin Panel
- [ ] Admin user created
- [ ] Admin panel accessible
- [ ] User list displays
- [ ] Grant Pro subscription works
- [ ] Remove Pro subscription works
- [ ] Set subscription duration works
- [ ] Add admin works
- [ ] Remove admin works
- [ ] Analytics display correctly

### UI/UX
- [ ] Dark mode toggle works
- [ ] Theme persists across sessions
- [ ] All buttons respond to clicks
- [ ] Loading states show appropriately
- [ ] Error messages display clearly
- [ ] Success messages display
- [ ] Forms validate input
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works

### Performance
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Bundle size is reasonable (<500KB gzipped)
- [ ] Images load quickly
- [ ] API responses are fast (<3s)
- [ ] No console errors in production

### Security
- [ ] `.env` file not committed
- [ ] API keys not exposed in client
- [ ] RLS policies tested
- [ ] SQL injection protected
- [ ] XSS protected
- [ ] CSRF protected
- [ ] HTTPS enforced
- [ ] Secure headers configured

### SEO
- [ ] Meta tags present
- [ ] Open Graph tags configured
- [ ] Twitter Card tags configured
- [ ] robots.txt deployed
- [ ] Sitemap created (if applicable)
- [ ] Canonical URLs set
- [ ] Page titles descriptive

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Edge Functions
- [ ] stripe-checkout deployed
- [ ] stripe-webhook deployed
- [ ] Edge function secrets configured
- [ ] Functions respond correctly
- [ ] Error handling works

### Documentation
- [ ] README.md complete
- [ ] QUICKSTART.md accurate
- [ ] DEPLOYMENT.md detailed
- [ ] FEATURES.md comprehensive
- [ ] Code comments helpful
- [ ] API documented

### Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring set up
- [ ] Database query logs accessible
- [ ] Supabase alerts configured
- [ ] Stripe webhooks monitored

## Post-Launch Verification

### Immediate (First Hour)
- [ ] Homepage loads
- [ ] Sign-up flow works
- [ ] First analysis completes
- [ ] No critical errors
- [ ] SSL certificate valid
- [ ] Domain resolves correctly

### First Day
- [ ] All features working
- [ ] No widespread errors
- [ ] Performance acceptable
- [ ] User feedback collected
- [ ] Analytics tracking

### First Week
- [ ] Database performance good
- [ ] API rate limits not exceeded
- [ ] Subscription payments processing
- [ ] Email notifications working
- [ ] Mobile experience smooth

### First Month
- [ ] Monthly credit reset working
- [ ] Subscription renewals processing
- [ ] Storage usage acceptable
- [ ] API costs reasonable
- [ ] User retention tracked

## Rollback Plan

If critical issues arise:

1. **Database Issues**
   - Revert last migration
   - Restore from Supabase backup
   - Check RLS policies

2. **Code Issues**
   - Revert to previous deployment
   - Roll back git commit
   - Re-deploy stable version

3. **API Issues**
   - Check API key validity
   - Verify rate limits
   - Test with different accounts

4. **Payment Issues**
   - Pause new subscriptions
   - Contact Stripe support
   - Refund affected users

## Emergency Contacts

- **Supabase Support**: support@supabase.io
- **Stripe Support**: https://support.stripe.com
- **Google Cloud Support**: https://cloud.google.com/support
- **Hosting Provider**: [Your hosting support]

## Success Metrics

Track these metrics post-launch:

- Sign-ups per day
- Active users
- Analyses completed
- Pro conversions
- Error rate
- Page load time
- API response time
- Database query time

## Notes

- Keep this checklist updated
- Document any issues encountered
- Share feedback with team
- Celebrate successful launch! 🎉
