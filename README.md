# Daniela Job Search Dashboard — static shell

A single-page site that lets Daniela sign in with a magic link and download her
tailored CVs and cover letters. It is deployed to Cloudflare Pages.

**This repo is served publicly.** Cloudflare Pages serves a site over the open
internet regardless of whether the source repo is private. That is why this repo is
separate from `ai-job-search`: there is no path by which a misconfigured build can
publish her documents. Nothing personal belongs in here — no names in content, no
CVs, no tracker CSV, no service_role key.

## What's in here

Everything Cloudflare serves lives under `public/`. This README sits **outside** it
on purpose: Pages would otherwise publish it at `/README.md`, and it names her.

| File | Purpose |
|---|---|
| `public/index.html` | Three views: sign-in, loading, dashboard |
| `public/app.js` | Auth, data load, filtering, signed-URL downloads |
| `public/styles.css` | Styling, including the status palette |
| `public/config.js` | Supabase project URL + publishable key (both public by design) |
| `public/vendor/supabase.js` | supabase-js 2.112.1 UMD, vendored on purpose — see below |

Nothing under `public/` contains a personal name. Download filenames are built from
the `company` column of the RLS-gated row at click time, not from `config.js`.

### Why supabase-js is vendored rather than loaded from a CDN

A compromised or hijacked CDN could serve modified JS that exfiltrates her session
token, and there is no build step here to pin an integrity hash against. Vendoring
makes the bytes we serve the bytes we reviewed. To upgrade:

```bash
npm pack @supabase/supabase-js
tar -xzf supabase-supabase-js-*.tgz
cp package/dist/umd/supabase.js public/vendor/supabase.js
```

## Security model

The publishable key in `config.js` is **public by design**. It identifies the
project; it grants nothing. Access is controlled entirely by Postgres RLS:

- `public.applications` is default-deny. The only policy is `select` for
  `authenticated` where `public.is_viewer()` is true.
- `public.is_viewer()` is a `security definer` function checking the signed-in JWT's
  email against `public.allowed_viewers`. `execute` is revoked from `anon`.
- The `applications` storage bucket is **private**. Files are reachable only through
  short-lived signed URLs (60 seconds), minted per click.
- There are **no** insert/update/delete policies. Writes happen only from the sync
  script in the `ai-job-search` repo using the `service_role` key, which lives in a
  gitignored `.env` on Thomas's machine and is never committed anywhere.

Supabase will mint a JWT for *any* email that requests a magic link. The allowlist is
what stops an unknown signed-in user from seeing data — they get an empty table. New
signups should also be disabled in the Supabase dashboard
(Authentication → Sign In / Providers → disable new user signups) as a second layer.

## Deploy (Cloudflare Pages)

1. Push this directory to its own GitHub repo (private is fine).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Framework preset: **None**. Build command: *(empty)*. Output directory: `public`.
4. Deploy. Note the `*.pages.dev` URL.
5. In Supabase → Authentication → URL Configuration, set **Site URL** to that URL and
   add it to **Redirect URLs**. Magic links will not work until this is done.

Local preview: `cd public && python3 -m http.server 8000`, then open
`http://localhost:8000`. Magic-link redirects only come back to an origin configured
in Supabase, so add `http://localhost:8000` there too if you want to test locally.

## Data contract

`app.js` reads these columns from `public.applications`:

```
id, company, role, sector, role_type, status, status_date,
fit_rating, notes, cv_object, cover_letter_object, updated_at
```

`cv_object` / `cover_letter_object` are object paths inside the private
`applications` bucket, e.g. `ntg_vp_strategic_customer_accounts/cv.pdf`. Empty or
null renders as `—` rather than a broken link.

`status` is one of `drafted`, `applied`, `interview`, `offer`, `hired`, `rejected`,
`no_response`, `offer_declined`, `interview_only`, `withdrawn`.

**`drafted` means written but not sent.** It is styled in muted grey and excluded
from the interview-rate denominator, matching `/html-report` in the source repo — an
unsent package must never read as progress.

## Not built yet

Charts (status funnel, score distribution) are **deferred**, not dropped. v1 is stat
cards, a filterable table, and downloads. The encrypted single-file report produced by
`/html-report` in the `ai-job-search` repo remains the offline fallback.
