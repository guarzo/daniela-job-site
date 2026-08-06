# Static dashboard shell

Single-page app: magic-link sign-in, then reads rows and short-lived signed file
URLs from a Supabase project. No build step, no server-side code — an assets-only
Cloudflare Worker. supabase-js is vendored deliberately rather than CDN-loaded, so a
hijacked CDN cannot exfiltrate a user session.

> **Everything under `public/` is published to the open internet.** Keep it free of
> personal data: no names, no documents, no tracker data, no `service_role` key. The
> key in `public/config.js` is a *publishable* key and grants nothing on its own;
> access is controlled entirely by Postgres row-level security.
>
> Files outside `public/` — this README, `wrangler.jsonc` — are never uploaded.

## Layout

| File | Purpose |
|---|---|
| `wrangler.jsonc` | Deploy config. Points at `./public`. Not published. |
| `public/index.html` | Three views: sign-in, loading, dashboard |
| `public/app.js` | Auth, data load, filtering, signed-URL downloads |
| `public/styles.css` | Styling, including the status palette |
| `public/config.js` | Supabase project URL + publishable key |
| `public/vendor/supabase.js` | supabase-js UMD, vendored — see below |

## Deploy

Cloudflare → Workers → connect to Git. Build command **empty**, deploy command
`npx wrangler deploy`, and leave every path setting at its default — the asset
directory is declared in `wrangler.jsonc`, not in the dashboard.

Validate the config without deploying:

```bash
npx wrangler deploy --dry-run
```

It should report reading from `.../public`. Note that its file count includes
directories, so 5 files plus `vendor/` reports as 6.

Local preview: `cd public && python3 -m http.server 8000`. Magic-link redirects only
return to an origin registered in Supabase, so add that origin there before testing
sign-in.

## Upgrading supabase-js

There is no build step to pin an integrity hash against, so the bundle is committed
rather than fetched at runtime:

```bash
npm pack @supabase/supabase-js
tar -xzf supabase-supabase-js-*.tgz
cp package/dist/umd/supabase.js public/vendor/supabase.js
```

Operator documentation — security model, allowlist, data contract — lives in the
private source repo, not here.
