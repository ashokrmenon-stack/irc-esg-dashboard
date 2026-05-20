# IRC ESG Dashboard (Netlify + Supabase Auth)

Authenticated employee dashboard for IRC ESG data. Reads live from Supabase Postgres views; sign-in is restricted to `@indorama.com` email addresses via magic link.

## Stack
- Next.js 14 (App Router, RSC)
- Supabase (Postgres + Auth)
- Tailwind CSS + Recharts
- Deployed on Netlify

## Pages
- `/login` – magic-link sign-in (@indorama.com only)
- `/overview` – KPI cards + headline trends
- `/emissions` – GHG Scope 1+2 by year and entity
- `/energy` – Total energy consumption
- `/water` – Water withdrawn
- `/waste` – Waste generated
- `/air` – Air pollutants (NOx by default)

All pages read from `public.v_entity_year_summary` in Supabase.

---

## 1. One-time Supabase auth setup

In Supabase dashboard → **Authentication** → **Providers** → make sure **Email** is enabled (it is by default; magic link works out of the box).

Then **Authentication** → **URL Configuration**:
- Site URL: `https://your-site.netlify.app` (replace after Netlify deploy)
- Redirect URLs: add `https://your-site.netlify.app/auth/callback` and `http://localhost:3000/auth/callback` (for local dev)

(Optional, hardening) **Authentication** → **Settings**:
- Disable "Allow new users to sign up" — so only invited users get accounts. Or leave on and rely on the @indorama.com client + middleware check.

## 2. Local dev

```bash
cp .env.local.example .env.local
# already prefilled with your project URL + anon key
npm install
npm run dev
# open http://localhost:3000
```

Sign in with your @indorama.com email → check inbox for magic link → click → you're in.

## 3. Deploy to Netlify

```bash
npm i -g netlify-cli
netlify login
netlify init      # connect to a new Netlify site
netlify deploy --prod
```

Then in Netlify dashboard → Site settings → **Environment variables** → add the same three from `.env.local.example`, but set `NEXT_PUBLIC_SITE_URL` to your real Netlify URL (e.g. `https://irc-esg.netlify.app`).

Redeploy: `netlify deploy --prod`.

Lastly, go back to Supabase → Authentication → URL Configuration and update Site URL + Redirect URLs to your real Netlify URL.

## 4. Custom domain (optional)

In Netlify → Domain management → add `esg.indorama.com` → follow DNS instructions. Then update Supabase Auth URL Configuration again.

## Updating data

Edit values in Supabase (Table Editor or SQL Editor) — pages auto-refresh every 5 minutes (`revalidate = 300`). To force an immediate refresh, redeploy or hit any page after the cache window.

## Adding new pages

1. Create `app/(dashboard)/<route>/page.tsx` — copy structure from `emissions/page.tsx`.
2. Add the route + icon to the `nav` array in `app/(dashboard)/layout.tsx`.
3. If the metric isn't in `v_entity_year_summary`, either extend that view in Supabase or write a new query.

## Notes
- The anon JWT is exposed in the client bundle — that's intentional and safe because RLS on `esg_data` only allows `SELECT` for anon/authenticated.
- Middleware enforces `@indorama.com` domain check on top of Supabase Auth.
- For Google SSO instead of magic link, enable Google provider in Supabase → Authentication → Providers and swap the login page's `signInWithOtp` for `signInWithOAuth({ provider: 'google' })`.
