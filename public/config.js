// Public Supabase connection details.
//
// The publishable key is PUBLIC BY DESIGN. It identifies the project, it does not
// grant access. Every table in this project is default-deny under RLS and readable
// only by a signed-in user whose email sits in public.allowed_viewers. Do not put a
// service_role key in this file or anywhere else in this repo — this site is served
// publicly by Cloudflare Pages even though the repo is private.
window.APP_CONFIG = {
  SUPABASE_URL: 'https://gvxnfrprbjhaqdezxvbu.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_tlrwHGSVohGcaJ76WfkCKQ_CI-ecZdw',
  BUCKET: 'applications',
};
