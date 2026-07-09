
# GSK Enterprises — Real Estate Mediator Platform

Regional mediator site for **GSK Enterprises Real Estate Developers**, Kattedan Sri Ram Colony. Visitors browse verified listings and contact the mediator via Call/WhatsApp. Sellers submit requests (no login). Only **gshanker9700@gmail.com** can access the admin dashboard.

## Brand & contact (hardcoded)
- Name: GSK Enterprises — Real Estate Developers
- Region: Kattedan, Sri Ram Colony (Hyderabad)
- Phones / WhatsApp: +91 87121 77076, +91 97008 37455
- Email: gshanker9700@gmail.com
- Tagline nod: "Open Plots · Houses · Lands — Purchase & Sale"
- Also mention Home / Business / Personal loans as a secondary "Services" strip (from your poster)

## Pages (public)
1. **Home** — hero with quick search (location, property type, Sale/Rent), 6 featured listings, "How it works" (Browse → Contact → Close), Sell/Rent CTA, footer.
2. **Browse** (`/browse`) — grid + filters (Sale/Rent, property type, price range, area with sqft/acre/cent/gunta unit, facing under "More"), sort, empty state.
3. **Listing detail** (`/listing/$id`) — image carousel, full specs, Google Maps embed, sticky Call + WhatsApp buttons (pre-filled message), inquiry form, similar properties.
4. **Sell/Rent your property** (`/sell`) — public form → pending SellerRequest.
5. **About / Contact** (`/about`) — story, service area, trust signals, contact block, business hours.

## Pages (admin, gated)
- `/auth` — public sign-in (email + password + Google). Non-admin emails are signed out immediately with a "not authorized" toast.
- `/admin` (under `_authenticated`, extra `admin` role check) — dashboard stats.
- `/admin/listings` — table, add/edit/delete, status (Active/Sold/Rented/Inactive), multi-image upload.
- `/admin/requests` — pending seller requests; "Approve & Convert to Listing" pre-fills the new-listing form; Reject / Mark Contacted.
- `/admin/inquiries` — grouped by listing, mark Contacted/Closed.

## Data model (Lovable Cloud / Supabase)
- `listings` — id, title, description, listing_type, property_type, price, area_value, area_unit, facing, address_text, latitude, longitude, cover_image, images[], status, created_at.
- `seller_requests` — id, seller_name, phone, listing_type, property_type, location, area_value, area_unit, expected_price, facing, description, images[], status, created_at.
- `inquiries` — id, listing_id (FK), buyer_name, phone, message, status, created_at.
- `user_roles` — id, user_id → auth.users, role enum (`admin`). Seeded via migration for gshanker9700@gmail.com after first sign-in (or via `has_role` gate + email-domain trigger scoped to that exact email).
- Storage bucket `property-images` (public read, admin-only write) for listing/request photos.

## Security
- Only `status = Active` listings visible to `anon`.
- RLS: public SELECT on listings (Active) and inserts on seller_requests + inquiries (rate-limit via simple validation). All write/edit/delete on listings/requests/inquiries scoped to `has_role(auth.uid(),'admin')`.
- `/admin/*` gated by `_authenticated` layout + child `beforeLoad` that checks `has_role` and redirects non-admins to `/`.
- Only gshanker9700@gmail.com is auto-granted `admin` on verified email; any other signup gets no role and cannot see admin UI or perform admin writes.

## Design
Direction: clean, real-estate-appropriate — **Urbanist + Epilogue** typography, Navy Trust palette (`#0f1b3d` primary, warm amber `#e0a458` accent) with generous whitespace, Housing.com-style cards. I'll generate 3 rendered design directions after plan approval so you can pick one before I build.

## Build order (single continuous pass)
1. Enable Lovable Cloud; run migrations (tables + RLS + grants + storage bucket + user_roles + has_role).
2. Design directions → you pick one → apply tokens.
3. Public pages with dummy data → wire to DB.
4. Auth + admin gating + role enforcement.
5. Admin CRUD (listings, requests approve-to-listing, inquiries).
6. Forms, image upload, WhatsApp/Call/Maps integrations, SEO meta per page.
7. Verify on mobile + desktop.

## Technical details
- TanStack Start, Lovable Cloud, TanStack Query (`ensureQueryData` + `useSuspenseQuery`).
- Server functions in `src/lib/*.functions.ts`; public reads via server publishable client, admin writes via `requireSupabaseAuth` + `has_role` check.
- WhatsApp: `https://wa.me/918712177076?text=<encoded>`; Call: `tel:+918712177076`.
- Google Maps embed via iframe with lat/lng per listing.
- Zod validation on all forms; toast feedback on success/error.

## Explicitly out of scope (per spec)
No online payments, no buyer accounts, no chat, no auto-valuation, no i18n.
