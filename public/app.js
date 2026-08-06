/* Job Search Dashboard — Cloudflare Pages shell.
 *
 * This file is served publicly. It contains no personal data: every row and every
 * document comes from Supabase after a magic-link sign-in, and is gated by RLS on
 * public.allowed_viewers. A signed-in stranger sees an empty table, not a 403 page,
 * because the policy denies rows rather than the request.
 *
 * All DOM writes use textContent / createElement. Nothing from the database is ever
 * passed to innerHTML — company names, roles, and notes are attacker-influenced in
 * principle (they originate in third-party job postings) and are treated as data.
 */
(function () {
  'use strict';

  var CFG = window.APP_CONFIG;
  var sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  var STATUS_LABEL = {
    drafted: 'Draft',
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
    no_response: 'No response',
    offer_declined: 'Offer declined',
    interview_only: 'Interview only',
    withdrawn: 'Withdrawn',
  };
  var STATUS_COLOR = {
    drafted: '#94a3b8',
    applied: '#3b82f6',
    interview: '#8b5cf6',
    offer: '#10b981',
    hired: '#059669',
    rejected: '#ef4444',
    no_response: '#cbd5e1',
    offer_declined: '#f59e0b',
    interview_only: '#8b5cf6',
    withdrawn: '#a1a1aa',
  };
  // Statuses that count as a live, submitted application.
  var ACTIVE = ['applied', 'interview', 'offer'];

  var el = function (id) { return document.getElementById(id); };
  var rows = [];
  var filter = { q: '', status: 'all' };

  function show(view) {
    ['view-auth', 'view-loading', 'view-app'].forEach(function (v) {
      el(v).hidden = v !== view;
    });
  }

  function say(node, text, kind) {
    node.textContent = text;
    node.className = 'msg' + (kind ? ' ' + kind : '');
  }

  /* ---------- auth ---------- */

  el('auth-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = el('email').value.trim();
    if (!email) return;
    var btn = el('auth-submit');
    btn.disabled = true;
    say(el('auth-msg'), 'Sending…');
    sb.auth
      .signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin + window.location.pathname } })
      .then(function (res) {
        btn.disabled = false;
        if (res.error) {
          say(el('auth-msg'), res.error.message, 'err');
          return;
        }
        // Deliberately identical wording regardless of whether the address is on the
        // allowlist — the sign-in form should not confirm who has access.
        say(el('auth-msg'), 'Check your email for a sign-in link. It expires in about an hour.', 'ok');
      })
      .catch(function (err) {
        btn.disabled = false;
        say(el('auth-msg'), String(err && err.message ? err.message : err), 'err');
      });
  });

  el('signout').addEventListener('click', function () {
    sb.auth.signOut().then(function () {
      window.location.hash = '';
      window.location.reload();
    });
  });

  /* ---------- data ---------- */

  function load(session) {
    el('who').textContent = session.user.email || '';
    show('view-loading');
    sb.from('applications')
      .select('id,company,role,sector,role_type,status,status_date,fit_rating,notes,cv_object,cover_letter_object,updated_at')
      .order('fit_rating', { ascending: false, nullsFirst: false })
      .then(function (res) {
        show('view-app');
        if (res.error) {
          say(el('app-msg'), 'Could not load applications: ' + res.error.message, 'err');
          return;
        }
        rows = res.data || [];
        if (rows.length === 0) {
          // Deliberately impersonal: this string ships in a publicly served file, so
          // it must not name anyone. It is also the response an off-allowlist visitor
          // sees — RLS returns zero rows rather than an error, and that is correct.
          say(
            el('app-msg'),
            'No applications are visible for this account. If you expected to see some, ask the account owner to add this email address.',
            'err'
          );
        } else {
          say(el('app-msg'), '');
        }
        renderStats();
        renderFilters();
        renderTable();
      });
  }

  function renderStats() {
    var drafted = rows.filter(function (r) { return r.status === 'drafted'; }).length;
    var active = rows.filter(function (r) { return ACTIVE.indexOf(r.status) !== -1; }).length;
    var interviews = rows.filter(function (r) {
      return r.status === 'interview' || r.status === 'interview_only' || r.status === 'offer' || r.status === 'hired';
    }).length;
    // Draft rows are excluded from every rate: an unsent package is not a submission.
    var submitted = rows.filter(function (r) { return r.status !== 'drafted'; }).length;
    var rate = submitted ? Math.round((interviews / submitted) * 100) + '%' : '—';

    var stats = [
      { n: rows.length, l: 'Packages' },
      { n: drafted, l: 'Draft (not sent)' },
      { n: active, l: 'Active' },
      { n: submitted, l: 'Submitted' },
      { n: rate, l: 'Interview rate' },
    ];
    var box = el('stats');
    box.textContent = '';
    stats.forEach(function (s) {
      var d = document.createElement('div');
      d.className = 'stat';
      var n = document.createElement('div');
      n.className = 'n';
      n.textContent = String(s.n);
      var l = document.createElement('div');
      l.className = 'l';
      l.textContent = s.l;
      d.appendChild(n);
      d.appendChild(l);
      box.appendChild(d);
    });
  }

  function renderFilters() {
    var present = [];
    rows.forEach(function (r) {
      if (present.indexOf(r.status) === -1) present.push(r.status);
    });
    var box = el('status-filters');
    box.textContent = '';
    ['all'].concat(present).forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = s === 'all' ? 'All' : STATUS_LABEL[s] || s;
      b.setAttribute('aria-pressed', String(filter.status === s));
      b.addEventListener('click', function () {
        filter.status = s;
        renderFilters();
        renderTable();
      });
      box.appendChild(b);
    });
  }

  el('q').addEventListener('input', function (e) {
    filter.q = e.target.value.toLowerCase();
    renderTable();
  });

  function visible() {
    return rows.filter(function (r) {
      if (filter.status !== 'all' && r.status !== filter.status) return false;
      if (!filter.q) return true;
      return ((r.company || '') + ' ' + (r.role || '')).toLowerCase().indexOf(filter.q) !== -1;
    });
  }

  function badge(status) {
    var s = document.createElement('span');
    s.className = 'badge';
    s.style.background = STATUS_COLOR[status] || '#94a3b8';
    s.textContent = STATUS_LABEL[status] || status;
    return s;
  }

  function docButton(label, objectPath, filename) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'doc';
    b.textContent = label;
    if (!objectPath) {
      b.textContent = '—';
      b.disabled = true;
      return b;
    }
    b.addEventListener('click', function () {
      b.disabled = true;
      var was = b.textContent;
      b.textContent = 'Opening…';
      // Signed URLs are minted on demand and expire in 60s, so nothing durable
      // ever lands in browser history or a shared link.
      sb.storage
        .from(CFG.BUCKET)
        .createSignedUrl(objectPath, 60, { download: filename })
        .then(function (res) {
          b.disabled = false;
          b.textContent = was;
          if (res.error || !res.data) {
            say(el('app-msg'), 'Could not open that file: ' + ((res.error && res.error.message) || 'unknown error'), 'err');
            return;
          }
          say(el('app-msg'), '');
          window.location.href = res.data.signedUrl;
        })
        .catch(function (err) {
          b.disabled = false;
          b.textContent = was;
          say(el('app-msg'), String(err && err.message ? err.message : err), 'err');
        });
    });
    return b;
  }

  function renderTable() {
    var body = el('apps-body');
    body.textContent = '';
    var list = visible();
    el('empty').hidden = list.length !== 0;
    list.forEach(function (r) {
      var tr = document.createElement('tr');

      var tdC = document.createElement('td');
      tdC.textContent = r.company || '';
      tr.appendChild(tdC);

      var tdR = document.createElement('td');
      tdR.textContent = r.role || '';
      if (r.notes) tdR.title = r.notes;
      tr.appendChild(tdR);

      var tdS = document.createElement('td');
      tdS.appendChild(badge(r.status));
      tr.appendChild(tdS);

      var tdD = document.createElement('td');
      tdD.textContent = r.status_date || '';
      tr.appendChild(tdD);

      var tdF = document.createElement('td');
      tdF.className = 'num';
      tdF.textContent = r.fit_rating == null ? '' : String(r.fit_rating);
      tr.appendChild(tdF);

      var tdDoc = document.createElement('td');
      // Filename stem comes from the RLS-gated row, never from a file served
      // publicly — nothing on the open internet should carry a personal name.
      var stem = r.company || 'Application';
      if (r.cv_object) tdDoc.appendChild(docButton('CV', r.cv_object, stem + ' - CV.pdf'));
      if (r.cover_letter_object)
        tdDoc.appendChild(docButton('Cover letter', r.cover_letter_object, stem + ' - Cover Letter.pdf'));
      if (!r.cv_object && !r.cover_letter_object) tdDoc.appendChild(docButton('—', null));
      tr.appendChild(tdDoc);

      body.appendChild(tr);
    });
  }

  /* ---------- boot ---------- */

  show('view-loading');
  sb.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (session) {
      // Strip the implicit-flow tokens out of the address bar once the client has
      // consumed them, so the access token is not left sitting in a copied URL.
      if (window.location.hash.indexOf('access_token') !== -1) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      load(session);
    } else {
      show('view-auth');
      // A magic link that failed (expired, already used) comes back with an error
      // in the hash rather than a session. Surface it instead of showing a bare form.
      var h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      if (h.get('error_description')) {
        say(el('auth-msg'), h.get('error_description').replace(/\+/g, ' '), 'err');
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  });

  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN' && session && el('view-app').hidden) load(session);
    if (event === 'SIGNED_OUT') show('view-auth');
  });
})();
