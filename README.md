# Static dashboard shell

Single-page app: magic-link sign-in, then reads rows and short-lived signed file
URLs from a Supabase project, and writes short feedback signals back. No build step,
no server-side code — an assets-only Cloudflare Worker. supabase-js is vendored
deliberately rather than CDN-loaded, so a hijacked CDN cannot exfiltrate a user
session.

> **Everything under `public/` is published to the open internet.** Keep it free of
> personal data: no names, no documents, no tracker data, no `service_role` key. The
> key in `public/config.js` is a *publishable* key and grants nothing on its own;
> access is controlled entirely by Postgres row-level security.
>
> Files outside `public/` — this README, `wrangler.jsonc`, `dev/` — are never uploaded.

## Layout

| File | Purpose |
|---|---|
| `wrangler.jsonc` | Deploy config. Points at `./public`. Not published. |
| `public/index.html` | Three views: sign-in, loading, dashboard |
| `public/app.js` | Auth, data load, filtering, signed-URL downloads, feedback controls |
| `public/styles.css` | Styling, including the status palette |
| `public/config.js` | Supabase project URL + publishable key |
| `public/vendor/supabase.js` | supabase-js UMD, vendored — see below |
| `dev/harness.html` | Local render harness. Not published — see below |
| `dev/fixtures.js` | Fixture rows for the harness. Invented data only. Not published |

## Looking at the page

The dashboard only renders with a Supabase session, so an unauthenticated browser gets
the sign-in screen and nothing else. This is exactly how a full redesign once shipped
without anyone ever seeing the ledger with rows in it.

`dev/harness.html` replaces the Supabase client wholesale and loads the real
`styles.css` and `app.js` against fixture rows. It injects `public/index.html`'s body at
runtime rather than duplicating it, so it cannot drift from the page it tests.

```bash
python3 -m http.server 8788        # from the repository root
# http://localhost:8788/dev/harness.html
```

Query flags: `?empty`, `?error`, `?offline`, `?auth` for the degraded states. Run this
before claiming any visual change is done.

## The write path

This surface is no longer read-only. A signed-in viewer can mark a package sent, leave
a note, or flag "don't send". Those go into an append-only `viewer_signals` table —
never into the application rows, which still have no insert/update/delete policy at
all. The table has select and insert policies only, so a viewer cannot edit or erase
what they recorded; the columns that identify and timestamp a signal are not
insertable, so their server-side defaults always hold.

Two consequences for anyone editing `app.js`:

- **Never mutate the status badge from a signal.** The source repo decides status; a
  pending signal renders as a separate chip. The UI must not imply otherwise.
- **No `innerHTML`, ever.** Note text round-trips through the database and back into
  the page. Build every node with `createElement` and write text with `textContent`.

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
