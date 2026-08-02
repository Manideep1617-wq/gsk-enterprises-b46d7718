# GSK Enterprises — Real Estate Mediator Platform

A regional real estate mediator/brokerage website built with [Lovable](https://lovable.dev). The platform lets a mediator (site owner) list verified properties for Sale/Rent, receive property listing requests from sellers, and collect buyer inquiries — all leads are closed offline via Call/WhatsApp.

**Live site:** https://gsk-enterprises.lovable.app

---

## Business Model

This is not a self-service listing marketplace. It works like this:

1. **Buyers** browse listings publicly (no login needed) and contact the mediator directly via Call/WhatsApp/inquiry form when interested.
2. **Sellers** submit a "Sell/Rent Your Property" request through a public form — this does NOT create a live listing.
3. **The Mediator (Admin)** reviews each seller request, verifies it, and manually publishes it as a full listing with photos and final details.
4. All deals close offline; the site has no payment/checkout system.

---

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **Backend/Database/Auth/Storage:** Supabase
- **Hosting:** Lovable's default deployment

---

## User Roles

| Role | Login required? | Can do |
|---|---|---|
| Visitor/Buyer | No | Browse, search, filter listings, view details, submit inquiry, call/WhatsApp |
| Seller | No | Submit a property listing/rental request (goes to Admin for review) |
| Admin/Mediator | Yes | Approve/reject seller requests, add/edit/delete listings, view inquiries |

---

## Pages

- **Home** — hero, quick search/filters, featured listings, "how it works," sell-property CTA
- **Browse/Listings** — full searchable/filterable grid of active listings
- **Listing Detail** — image gallery, full specs, map, Call/WhatsApp buttons, inquiry form
- **Sell/Rent Your Property** — public request form (name, phone, type, location, price, size, images)
- **About/Contact**
- **Admin Dashboard** *(login required)*:
  - Listings (add/edit/delete, change status: Active/Sold/Rented/Inactive)
  - Seller Requests (approve → auto-converts to a listing, or reject)
  - Inquiries (buyer leads per listing)

---

## Database Tables (Supabase)

- **listings** — id, title, description, listing_type (Sale/Rent), property_type, price, area_value, area_unit, facing, address, latitude, longitude, images[], status, created_at
- **seller_requests** — id, seller_name, phone, listing_type, property_type, location, area_value, area_unit, expected_price, description, images[], status (Pending/Approved/Rejected), created_at
- **inquiries** — id, listing_id, buyer_name, phone, message, status, created_at
- **user_roles** — id, user_id (references auth.users), role (e.g. 'admin')

### Admin Access Logic
Admin access is controlled via the `user_roles` table. A user is treated as an Admin only if a row exists in `user_roles` with their `user_id` and `role = 'admin'`.

Current admin account: `gshanker9700@gmail.com`

⚠️ **Known gotcha:** Admin roles were originally auto-granted only at the moment an account's email was first confirmed (via a database trigger tied to one hardcoded email). If you add a new admin in the future, don't rely on this trigger — manually insert their role instead:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = 'NEW_ADMIN_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Known Issues / Troubleshooting Log

### "Access Denied" on Admin login (resolved)
- **Symptom:** Logging in with correct admin credentials showed "Access Denied" instead of the dashboard.
- **Root cause:** The auto-admin-grant trigger only fired for a specific hardcoded email at the moment of email confirmation. Accounts confirmed before this rule existed (or created differently) never received the `admin` role automatically.
- **Fix:** Manually inserted the admin role via SQL (see command above). Confirmed via query that `gshanker9700@gmail.com` has `role = admin` in `user_roles`.
- **Secondary issue found:** The project had a "Build unsuccessful" error at the same time, meaning the live/published site could have been running outdated or broken code even after database fixes. Always check for a "Build unsuccessful" banner in Lovable and click **Fix Build** before assuming a database-only fix will show up on the live site.

---

## Setup Notes for Future Changes

- When asking Lovable to make changes, prefer specific, single-feature prompts over broad "rebuild everything" requests — broad requests are more likely to leave features half-wired (e.g., UI built without the backend logic behind it, as happened with the original "New Listing" form).
- After any fix, always check for a **"Build unsuccessful"** banner in the Lovable chat — a broken build can silently mean your live site isn't running the code you think it is.
- Test in an **incognito window** after any auth-related fix, to rule out cached session issues.
- Image uploads use Supabase Storage (bucket: `listing-images` or similar) — not plain URL fields.

---

## Roadmap / Not Yet Built

- [ ] WhatsApp/SMS auto-notification to mediator on new inquiry or seller request
- [ ] Analytics on listing views/inquiries
- [ ] Multiple staff/agent admin accounts
