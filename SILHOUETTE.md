# Silhouette — Build Documentation

> Peer-to-peer campus clothing rental marketplace
> From her closet to yours.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Environment Setup](#environment-setup)
6. [Feature Breakdown by Phase](#feature-breakdown-by-phase)
7. [Pages & Routes](#pages--routes)
8. [Key Flows](#key-flows)
9. [What's Left](#whats-left)

---

## Product Overview

**User:** College women aged 18–22 on US university campuses.

**Problem:** Students spend ~$1,541/year on apparel yet still feel like they have nothing to wear. Existing rental platforms require shipping and steep fees — none are built for the speed of college social life.

**Job to be done:** When I have a themed party or going-out night, help me show up in a great outfit without spending money I don't have or rewearing something everyone has already seen.

**Business model:** Silhouette takes a **3% platform fee** on every rental transaction.

**Core decisions:**
- iOS-first (web-responsive for now, native app later)
- Stripe Connect Express — sellers receive direct payouts
- Seller manually approves each booking request
- Security deposit held at checkout, released when seller taps "Item Returned"
- No campus scoping in v1 — all listings visible to all users
- No strikes system in v1

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime |
| Payments | Stripe Connect Express *(keys not yet wired)* |
| Hosting | Vercel (recommended) |

---

## Project Structure

```
silhouette/
├── app/
│   ├── (app)/                    # Authenticated app shell
│   │   ├── layout.tsx            # Bottom nav + T&Cs gate
│   │   ├── browse/
│   │   │   ├── page.tsx          # Browse feed with filters
│   │   │   └── [id]/page.tsx     # Listing detail
│   │   ├── listings/
│   │   │   ├── page.tsx          # My Closet
│   │   │   ├── actions.ts        # createListing, togglePause, deleteListing
│   │   │   └── new/page.tsx      # Create listing form
│   │   ├── bookings/
│   │   │   ├── page.tsx          # Bookings list (renter + seller)
│   │   │   ├── actions.ts        # createBooking, approve, decline, markReturned
│   │   │   ├── new/page.tsx      # Date picker + price summary
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Booking detail + actions
│   │   │       └── chat/
│   │   │           ├── page.tsx  # Chat page (server wrapper)
│   │   │           └── ChatThread.tsx  # Real-time chat (client)
│   │   ├── dashboard/page.tsx    # Seller earnings dashboard
│   │   ├── reviews/
│   │   │   ├── actions.ts        # submitReview
│   │   │   └── new/page.tsx      # Star picker + review form
│   │   └── profile/page.tsx      # Profile + reviews + ratings
│   ├── auth/
│   │   ├── actions.ts            # signUp, signIn, signOut, updateProfile, acceptTerms
│   │   ├── callback/route.ts     # Supabase OAuth callback
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── setup/page.tsx        # Profile setup
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Redirects to /browse
├── components/
│   ├── BottomNav.tsx             # 5-tab nav (Browse, My Closet, Bookings, Earnings, Profile)
│   ├── TermsModal.tsx            # T&Cs gate on first login
│   ├── ListingCard.tsx           # Browse grid card
│   ├── BrowseFilters.tsx         # Category + size filter chips
│   ├── PhotoUpload.tsx           # Multi-photo upload to Supabase Storage
│   └── BookingsNavItem.tsx       # Pending request badge
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client (cookies)
├── types/
│   └── database.ts               # TypeScript types for all tables
├── supabase/
│   └── schema.sql                # Full DB schema — run this in Supabase SQL editor
├── proxy.ts                      # Route protection (Next.js 16 middleware)
└── .env.local                    # Environment variables (not committed)
```

---

## Database Schema

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid | References `auth.users` |
| email | text | |
| full_name | text | |
| university | text | |
| major | text | |
| grad_year | smallint | |
| profile_photo_url | text | |
| bio | text | |
| stripe_account_id | text | Stripe Connect account |
| terms_accepted_at | timestamptz | Set on T&Cs acceptance |
| created_at | timestamptz | |

#### `listings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| seller_id | uuid | → users |
| title | text | |
| description | text | |
| category | enum | formal, themed, going-out, interview, logo-wear |
| size | enum | XS, S, M, L, XL |
| price_per_day | numeric | $5–$100 enforced by DB constraint |
| deposit_amount | numeric | |
| is_paused | boolean | |
| is_deleted | boolean | Soft delete |

#### `listing_photos`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| listing_id | uuid | → listings |
| photo_url | text | Supabase Storage public URL |
| display_order | smallint | First photo = cover |

#### `bookings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| listing_id | uuid | → listings |
| renter_id | uuid | → users |
| pickup_date | date | |
| return_date | date | |
| total_rental_price | numeric | price_per_day × days |
| deposit_amount | numeric | |
| platform_fee | numeric | 3% of rental |
| stripe_payment_intent_id | text | Rental charge |
| stripe_deposit_intent_id | text | Deposit hold (manual capture) |
| status | enum | pending → confirmed → active → completed \| cancelled |

#### `messages`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| booking_id | uuid | → bookings |
| sender_id | uuid | → users |
| content | text | |
| created_at | timestamptz | |

> Realtime enabled via `alter publication supabase_realtime add table public.messages`

#### `reviews`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| booking_id | uuid | → bookings |
| reviewer_id | uuid | → users |
| reviewee_id | uuid | → users |
| rating | smallint | 1–5 |
| body | text | Optional |
| created_at | timestamptz | |

> Unique constraint on `(booking_id, reviewer_id)` — one review per booking per person.

#### `waitlist`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| email | text | Unique |
| university | text | |
| created_at | timestamptz | |

### Storage Buckets
| Bucket | Public |
|---|---|
| `listing-photos` | Yes |
| `profile-photos` | Yes |

### Availability Function
```sql
check_listing_availability(
  p_listing_id uuid,
  p_pickup date,
  p_return date,
  p_exclude_booking_id uuid DEFAULT null
) returns boolean
```
Returns `false` if any confirmed/active booking overlaps the requested dates.

---

## Environment Setup

### `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # For server-side admin ops

# Add when ready for payments:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### First-time Supabase setup
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Create two public storage buckets: `listing-photos` and `profile-photos`
4. In **Auth → Settings**, set `mailer_autoconfirm = true` for development (turn off before launch)
5. Fill in `.env.local` with your project URL and anon key

### Run locally
```bash
npm install
npm run dev
# App runs at http://localhost:3001
```

---

## Feature Breakdown by Phase

### Phase 1 — Auth + Navigation Shell ✅
- Sign up / login / sign out (Supabase Auth, email + password)
- Profile setup: name, university, major, grad year, bio
- T&Cs acceptance modal — stored in DB with timestamp, shown on first login
- Bottom nav: Browse, My Closet, Bookings, Earnings, Profile
- Route protection via `proxy.ts` — unauthenticated users redirected to `/auth/login`

### Phase 2 — Listings + Browse ✅
- **Create listing:** photos (up to 5, uploaded to Supabase Storage), title, description, category, size, price/day ($5–$100), deposit amount
- **My Closet:** view, pause/unpause, delete listings
- **Browse feed:** 2-column grid, filter by category and size via URL params
- **Listing detail:** photo carousel (scroll-snap), pricing cards, seller profile card, Request to Book CTA

### Phase 3 — Booking Flow + Earnings ✅
- **Date picker:** select pickup + return, availability checked against existing bookings
- **Price breakdown:** rental subtotal + deposit hold + 3% platform fee
- **Booking creation:** status starts as `pending`
- **Seller approve / decline:** pending → confirmed or cancelled
- **Mark as Returned:** seller taps → status → `completed` (deposit release hook ready for Stripe)
- **Bookings list:** renter and seller sections, status badges, direct chat links
- **Earnings dashboard:** total earned, pending requests needing response, active rentals, completed history

### Phase 4 — Real-time Chat ✅
- Chat thread per booking at `/bookings/[id]/chat`
- **Supabase Realtime** subscription — messages appear instantly on both sides
- **Optimistic sends** — message appears immediately, confirmed on DB write
- **Quick-reply templates:** "Ready for pickup!", "On my way!", "Where should we meet?", etc.
- Chat button on booking detail + direct Chat link on bookings list
- Empty state with coordination prompt

### Phase 5 — Reviews ✅
- After booking completes, both renter and seller see "Leave a review" on the booking detail
- **Interactive star picker** (1–5) with hover states and label feedback ("Good", "Excellent", etc.)
- Optional written review (up to 300 chars)
- One review per booking per user (DB unique constraint + server-side guard)
- **Profile page:** stats row (listing count, review count, average rating), star display, full review list with reviewer photos + dates

---

## Pages & Routes

| Route | Who sees it | Description |
|---|---|---|
| `/auth/login` | Public | Email + password login |
| `/auth/signup` | Public | Create account |
| `/auth/setup` | Authenticated | Profile setup (name, uni, major, year, bio) |
| `/browse` | Authenticated | Grid of all active listings, filterable |
| `/browse/[id]` | Authenticated | Full listing detail, book CTA |
| `/listings` | Authenticated | My Closet — seller's own listings |
| `/listings/new` | Authenticated | Create a new listing |
| `/bookings` | Authenticated | All bookings (renting + selling) |
| `/bookings/new?listing=ID` | Authenticated | Date picker + request form |
| `/bookings/[id]` | Participants only | Booking detail, actions, review prompt |
| `/bookings/[id]/chat` | Participants only | Real-time chat thread |
| `/dashboard` | Authenticated | Seller earnings dashboard |
| `/reviews/new?booking=ID&reviewee=ID` | Participants only | Submit a review |
| `/profile` | Authenticated | Own profile, reviews, ratings, sign out |

---

## Key Flows

### Full Rental Loop
```
Renter browses → finds listing → selects dates → sees price breakdown
  → sends booking request (status: pending)
  → Seller sees request in /bookings and /dashboard
  → Seller approves (status: confirmed)
  → Both chat via /bookings/[id]/chat to coordinate pickup
  → Item picked up (status: active — manual or auto on pickup date)
  → Item returned → Seller taps "Mark as returned" (status: completed)
  → Deposit released (Stripe cancel on deposit PaymentIntent)
  → Both prompted to leave a review
  → Reviews appear on each other's profiles
```

### Stripe Payment Flow *(keys not yet wired)*
```
At checkout:
  1. Rental PaymentIntent — captured immediately
     - application_fee_amount = rental × 3%
     - transfer_data.destination = seller's stripe_account_id
  2. Deposit PaymentIntent — capture_method: manual (held, not captured)

On "Mark as Returned":
  - stripe.paymentIntents.cancel(deposit_intent_id)  → releases hold
```

### Seller Stripe Connect Onboarding *(to build)*
```
Seller clicks "Connect Stripe" in profile/listings
  → API creates Stripe Connect account link
  → Seller completes Express onboarding
  → stripe_account_id saved to users table
  → Payouts flow automatically on future completed bookings
```

---

## What's Left

### Stripe (Phase 6)
Add to `.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
Build:
- `app/api/stripe/create-payment-intent/route.ts` — rental charge + deposit hold
- `app/api/stripe/webhook/route.ts` — handle `payment_intent.succeeded`, `payment_intent.canceled`
- `app/(app)/profile/connect/page.tsx` — Stripe Connect Express onboarding
- Wire deposit release in `markReturned` action

### Deploy to Vercel
1. Push to GitHub (already connected at `github.com/conwaysloane-rgb/silhouette`)
2. Import repo at [vercel.com](https://vercel.com)
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — get `silhouette.vercel.app` URL
5. Update Supabase Auth redirect URL to production domain

### Before Going Live
- [ ] Turn off `mailer_autoconfirm` in Supabase Auth
- [ ] Set up SMTP for transactional email (Resend or Postmark)
- [ ] Update Supabase Auth redirect URLs to production domain
- [ ] Enable `.edu` email restriction (or university allowlist) in sign-up
- [ ] Add Stripe production keys
- [ ] Set up Stripe webhook endpoint pointing to production URL
- [ ] Review Supabase RLS policies under real user load
- [ ] Add `NEXT_PUBLIC_SITE_URL` env var on Vercel

### Nice to Have (Later Phases)
- [ ] Push notifications (Web Push API via service worker)
- [ ] Profile photo upload (currently takes URL, needs upload flow)
- [ ] Search by keyword on browse feed
- [ ] "Available tonight" filter (checks no bookings for today's date)
- [ ] Listing edit page (currently can only pause/delete)
- [ ] Dispute/support tab
- [ ] Admin dashboard for manual support triage
- [ ] Friday outfit nudge notification (scheduled job)

---

## GitHub Repository

[github.com/conwaysloane-rgb/silhouette](https://github.com/conwaysloane-rgb/silhouette)

---

*Built with Claude Code · May 2026*
