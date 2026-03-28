# WHAT-YES Production Readiness

## Completed ✅
- [x] Supabase tables created (seller_applications, agreements_signed, flagged_content)
- [x] Legal pages (seller-terms, buyer-terms, privacy-policy, community-guidelines)
- [x] Seller application flow with ID verification
- [x] Admin review dashboard
- [x] Database Security - Applied RLS policies to all 13 tables (31 policies)
- [x] Featured Sellers API - `/api/sellers/featured`
- [x] Homepage fetches real data (no hardcoded demos)
- [x] Mux streaming routes - `/api/mux/create-stream`, `/api/mux/webhook`
- [x] Stripe Connect routes - `/api/stripe/connect`, `/api/stripe/webhook`, `/api/stripe/checkout`
- [x] Test seller accounts exist (SarahLuxury, MikeTheCollector, JamesTech)

## User Action Required 🔧

### 1. GoDaddy DNS Setup
In GoDaddy DNS settings for what-yes.com:
```
A Record:     @    →  75.2.60.5
CNAME Record: www  →  what-yes-live.netlify.app
```
Then disable any parking page/forwarding.

In Netlify Dashboard → Domain Management:
- Add `what-yes.com`
- Add `www.what-yes.com`

### 2. Netlify Environment Variables
Add these in Netlify → Site settings → Environment variables:

**Already have values (copy from .env.local):**
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PUSHER_APP_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`

**Need from your accounts:**
- `MUX_TOKEN_ID` - Get from mux.com dashboard
- `MUX_TOKEN_SECRET` - Get from mux.com dashboard
- `PUSHER_APP_ID` - Get from pusher.com dashboard
- `PUSHER_SECRET` - Get from pusher.com dashboard
- `STRIPE_SECRET_KEY` - Get from stripe.com dashboard
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe webhooks

### 3. Stripe Connect Setup
1. Create Stripe account at stripe.com
2. Enable Stripe Connect in dashboard
3. Set redirect URLs for OAuth
4. Add webhook endpoint: `https://what-yes.com/api/stripe/webhook`

### 4. Mux Setup
1. Create Mux account at mux.com
2. Create API token with Video permissions
3. Copy Token ID and Secret to Netlify env vars

### 5. Pusher Setup
1. Go to pusher.com dashboard
2. Copy APP_ID and SECRET (you already have the public key)

## API Routes Summary
- `/api/auctions` - CRUD auctions
- `/api/sellers/featured` - Featured sellers
- `/api/sellers/can-go-live` - Check seller eligibility
- `/api/seller-applications` - KYC applications
- `/api/mux/create-stream` - Create live stream
- `/api/stripe/connect` - Stripe Connect onboarding
- `/api/stripe/checkout` - Payment processing
- `/api/stripe/webhook` - Payment events
