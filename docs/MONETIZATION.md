# Monetization Guide — The Bharath News

## Active (implemented)

### 1. Google AdSense
- Set `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` and slot IDs in `.env.local`
- Script loads in `src/app/layout.jsx`; slots render via `AdSlot` component
- Placements: sidebar, article top/bottom (configure `NEXT_PUBLIC_ADSENSE_SLOT_*`)

### 2. Sponsored Content (CMS)
- Firestore `sponsors` collection drives sidebar advertorials
- Admin adds docs: `{ title, description, imageUrl, linkUrl, sponsoredBy, placement, active: true }`
- Rendered in `PageSidebar` via `getActiveSponsors()`

### 3. Newsletter
- Signup captures emails to `subscribers` collection
- Daily digest worker cron (`0 8 * * *`) sends via Resend when `RESEND_API_KEY` is set
- Trigger manually: `POST /api/newsletter` on the worker

### 4. Social Distribution
- Telegram auto-post for articles with score >= 7 (set `TELEGRAM_BOT_TOKEN`)
- Facebook optional via `FACEBOOK_PAGE_TOKEN`
- WhatsApp: channel links + share URLs (no API posting yet)

### 5. Creator Revenue Share (scaffold)
- `creator_profiles.earningsBalance` and `revenueShareEligible` fields
- Eligibility: 10K+ views and 5+ posts (`checkRevenueShareEligibility`)
- Displayed in Creator Space dashboard
- Payout integration: not yet implemented (Razorpay/Stripe Connect recommended)

## Recommended next steps

### Affiliate Marketing
- Add `affiliateUrl` field to articles for product/deal stories
- Partner with Amazon India, Noon, Flipkart affiliate programs
- UTM tracking already in `src/utils/share.js`

### Premium Subscription
- Stripe Checkout for ad-free + early access tier
- Gate premium content with `article.isPremium` + Firebase custom claims
- Estimated effort: 2-3 days

### Push Notifications (FCM)
- Set `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in `.env.local`
- Register service worker for web push on breaking news (score >= 9)
- Re-engagement for newsletter subscribers

### YouTube / Channel Growth
- Monetize YouTube channel separately (AdSense for YouTube)
- Cross-promote via worker video fetch pipeline

### Direct Sales
- Sell sponsored placements via admin `sponsors` collection
- GCC business summit, remittance services, NRI insurance — high CPM niches

## Worker secrets checklist
```
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
ANTHROPIC_API_KEY    # Claude Haiku classification
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
RESEND_API_KEY       # Newsletter
FACEBOOK_PAGE_TOKEN  # Optional
```

## Revenue projection levers
| Channel | RPM estimate | Notes |
|---------|-------------|-------|
| AdSense display | $1-3 | Needs 10K+ monthly pageviews |
| Sponsored posts | $50-500/post | Direct GCC business sales |
| Newsletter ads | $5-15 CPM | After 1K+ subscribers |
| Creator rev share | 20-30% of ad revenue on their content | After payout wiring |
