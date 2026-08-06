# Static dashboard shell

Single-page app: magic-link sign-in, then reads rows and short-lived signed file
URLs from a Supabase project. No build step. supabase-js is vendored deliberately
rather than CDN-loaded, so a hijacked CDN cannot exfiltrate a user session.

> **Everything in this repo is published.** It deploys to the open internet from the
> repo root, so any file added here is served — including this one. Keep it free of
> personal data: no names, no documents, no tracker data, no `service_role` key. The
> key in `config.js` is a publishable key and grants nothing on its own; access is
> controlled entirely by Postgres row-level security.

## Layout

| File | Purpose |
|---|---|
| `index.html` | Three views: sign-in, loading, dashboard |
| `app.js` | Auth, data load, filtering, signed-URL downloads |
| `styles.css` | Styling, including the status palette |
| `config.js` | Supabase project URL + publishable key |
| `vendor/supabase.js` | supabase-js UMD, vendored — see below |

## Deploy

Framework preset **None**, build command **empty**, every path/directory field left
at its default. The site is at the repo root and there is nothing to build.

Local preview: `python3 -m http.server 8000`. Magic-link redirects only return to an
origin registered in Supabase, so add that origin there before testing sign-in.

## Upgrading supabase-js

There is no build step to pin an integrity hash against, so the bundle is committed
rather than fetched at runtime:

```bash
npm pack @supabase/supabase-js
tar -xzf supabase-supabase-js-*.tgz
cp package/dist/umd/supabase.js vendor/supabase.js
```

Operator documentation — deploy steps, security model, allowlist, data contract —
lives in the private source repo, not here.
