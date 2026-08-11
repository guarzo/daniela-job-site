/* Chigüire — job search dashboard, Cloudflare assets-only shell.
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

  /* Badge treatment per status. Colour is never the only carrier: the label is
   * always spelled out, and fill / dash / strike / ring each encode something on
   * their own. See the status table in DESIGN.md.
   *
   *   fill    an offer exists (acid ground, ink on top) — the only use of acid
   *   dashed  never really underway: not sent yet, or never answered
   *   struck  she closed it herself, rather than it closing on her
   *   ring    hired, the one terminal state that earns a second mark
   */
  var STATUS_STYLE = {
    drafted: 'badge-outline badge-dashed',
    applied: 'badge-outline',
    interview: 'badge-outline',
    interview_only: 'badge-outline',
    rejected: 'badge-outline',
    no_response: 'badge-outline badge-dashed',
    withdrawn: 'badge-outline badge-struck',
    offer: 'badge-acid',
    offer_declined: 'badge-acid badge-struck',
    hired: 'badge-acid badge-ring',
  };

  // Statuses that count as a live, submitted application.
  var ACTIVE = ['applied', 'interview', 'offer'];
  // Statuses that mean an interview happened at some point.
  var REACHED_INTERVIEW = ['interview', 'interview_only', 'offer', 'offer_declined', 'hired'];

  var el = function (id) { return document.getElementById(id); };
  var rows = [];
  var shortlist = [];
  var signalsByApp = {};
  var filter = { q: '', status: 'all' };
  var shortlistQ = '';
  var NOTE_MAX = 2000; // mirrors the char_length check on public.viewer_signals

  function show(view) {
    ['view-auth', 'view-loading', 'view-app'].forEach(function (v) {
      el(v).hidden = v !== view;
    });
  }

  // All four bands at once. Used to stand the dashboard down when a load fails:
  // an empty table under a live heading reads as "you have nothing", which is a
  // different claim from "we could not find out".
  function bands(on) {
    ['shortlist-band', 'queue-band', 'history-band', 'rates-band'].forEach(function (b) {
      el(b).hidden = !on;
    });
  }

  function say(node, text, kind) {
    node.textContent = text;
    node.className = 'msg' + (kind ? ' msg-' + kind : '');
  }

  // Database and network errors are logged, never displayed. Postgres speaks in
  // strings like "permission denied for table applications" — an internal table name
  // shown to someone who is job hunting on her phone, and who can do nothing with it.
  // The console keeps the real text for whoever is debugging; the screen gets a
  // sentence that says what failed and what to do next.
  //
  // Pass `retry` when the failure is one the page can recover from without a reload.
  // "Check your connection and reload" is a fair instruction on a laptop and a poor
  // one on a phone, where reloading means finding the address bar again.
  function oops(node, sentence, err, retry) {
    var raw = err && err.message ? err.message : err;
    if (window.console && console.error) console.error(sentence, raw);
    say(node, sentence, 'err');
    if (!retry) return;
    var b = elem('button', 'act msg-retry', 'Try again');
    b.type = 'button';
    b.addEventListener('click', function () {
      b.disabled = true;
      retry();
    });
    node.appendChild(document.createTextNode(' '));
    node.appendChild(b);
  }

  function elem(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
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
          // Fixed wording for the same reason the success message is fixed: a raw
          // provider error could in principle read differently for an address that
          // exists. It also covers the common case, which is rate limiting, and
          // "wait a moment" is the right instruction for that.
          oops(el('auth-msg'), 'Could not send the link. Wait a moment and try again.', res.error);
          return;
        }
        // Deliberately identical wording regardless of whether the address is on the
        // allowlist — the sign-in form should not confirm who has access.
        say(el('auth-msg'), 'Check your email for a sign-in link. It expires in about an hour.', 'ok');
      })
      .catch(function (err) {
        btn.disabled = false;
        oops(el('auth-msg'), 'Could not reach the server. Check your connection and try again.', err);
      });
  });

  el('signout').addEventListener('click', function () {
    sb.auth.signOut().then(function () {
      window.location.hash = '';
      window.location.reload();
    });
  });

  /* ---------- data ---------- */

  function indexSignals(list) {
    signalsByApp = {};
    list.forEach(function (s) {
      (signalsByApp[s.application_id] = signalsByApp[s.application_id] || []).push(s);
    });
  }

  function load(session) {
    el('who').textContent = session.user.email || '';
    show('view-loading');
    Promise.all([
      sb
        .from('applications')
        .select('id,company,role,status,status_date,fit_rating,notes,cv_object,cover_letter_object')
        .order('fit_rating', { ascending: false, nullsFirst: false }),
      sb
        .from('viewer_signals')
        .select('id,application_id,kind,note,created_at,processed_at')
        .order('created_at', { ascending: true }),
      // Ranked postings. Ordered server-side so the band's "best score first"
      // claim survives a client that never re-sorts.
      sb
        .from('shortlist')
        .select('id,url,company,role,portal,rank_score,rank_verdict,rank_date,location,location_detail,language_gate,language_note,strengths,gaps')
        .order('rank_score', { ascending: false, nullsFirst: false }),
    ]).then(function (both) {
      var appsRes = both[0];
      var sigRes = both[1];
      var shortRes = both[2];
      show('view-app');
      if (appsRes.error) {
        // Same reasoning as the transport catch below: stand the bands down rather
        // than presenting empty tables as an answer.
        bands(false);
        oops(
          el('app-msg'),
          'Could not load your applications.',
          appsRes.error,
          function () { load(session); }
        );
        return;
      }
      bands(true);
      rows = appsRes.data || [];
      // A shortlist failure degrades to an empty band rather than taking the
      // dashboard down: the drafted packages are still worth showing without it.
      shortlist = shortRes.error ? [] : shortRes.data || [];
      if (shortRes.error && window.console && console.error) {
        console.error('Could not load the shortlist.', shortRes.error.message || shortRes.error);
      }

      // A failure to read feedback must not blank the dashboard — the documents are
      // the point, and they work without it. Degrade to an empty index and say so.
      indexSignals(sigRes.error ? [] : sigRes.data || []);

      if (rows.length === 0 && shortlist.length === 0) {
        // Deliberately impersonal: this string ships in a publicly served file, so
        // it must not name anyone. It is also the response an off-allowlist visitor
        // sees — RLS returns zero rows rather than an error, and that is correct.
        // Not styled as an error for the same reason: zero rows is a valid answer,
        // and colouring it red would tell a visitor they hit a wall rather than a
        // legitimately empty account.
        say(
          el('app-msg'),
          'No applications are visible for this account. If you expected to see some, ask the account owner to add this email address.'
        );
      } else if (sigRes.error) {
        oops(
          el('app-msg'),
          'Your applications loaded, but the feedback you have recorded could not be read.',
          sigRes.error,
          function () { load(session); }
        );
      } else {
        say(el('app-msg'), '');
      }
      renderShortlist();
      renderQueue();
      renderFilters();
      renderHistory();
      renderRates();
    },
    // Two-argument .then, not a trailing .catch: this handler must see rejections
    // from the queries above and nothing else. A trailing .catch would also swallow
    // any exception thrown by the render calls in the success path and report it as
    // a network failure, which would send someone to check their wifi over a bug.
    function (err) {
      // Both queries reject together on a transport failure — offline, DNS, Supabase
      // unreachable. Without this the page sits on "Loading" indefinitely with no way
      // out but a manual reload, which is the wrong answer on a phone with one bar.
      // The bands stand down rather than showing empty tables: "Nothing drafted right
      // now" would be a lie when the truth is that we never got to ask.
      show('view-app');
      bands(false);
      oops(
        el('app-msg'),
        'Could not reach the server. Check your connection.',
        err,
        function () { load(session); }
      );
    });
  }

  /* ---------- shared cells ---------- */

  function badge(status) {
    var s = elem('span', 'badge ' + (STATUS_STYLE[status] || 'badge-outline'));
    // Only known statuses get a colour token; an unrecognised one falls back to the
    // inherited foreground rather than resolving to an undefined custom property.
    if (STATUS_STYLE[status]) s.style.setProperty('--badge', 'var(--st-' + status + ')');
    s.textContent = STATUS_LABEL[status] || status;
    return s;
  }

  function docButton(label, objectPath, filename) {
    var b = elem('button', 'act', label);
    b.type = 'button';
    if (!objectPath) {
      b.textContent = 'None yet';
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
            oops(el('app-msg'), 'Could not open that document. Try again in a moment.', res.error);
            return;
          }
          say(el('app-msg'), '');
          window.location.href = res.data.signedUrl;
        })
        .catch(function (err) {
          b.disabled = false;
          b.textContent = was;
          oops(el('app-msg'), 'Could not open that document. Check your connection and try again.', err);
        });
    });
    return b;
  }

  // The documents themselves, without a cell around them. The queue renders records as
  // list items and the history band renders them as table rows, so everything that
  // builds content returns the content and the caller decides what wraps it.
  function docsBox(r) {
    var box = elem('div', 'docs');
    // Filename stem comes from the RLS-gated row, never from a file served
    // publicly — nothing on the open internet should carry a personal name.
    var stem = r.company || 'Application';
    if (r.cv_object) box.appendChild(docButton('CV', r.cv_object, stem + ' - CV.pdf'));
    if (r.cover_letter_object)
      box.appendChild(docButton('Cover letter', r.cover_letter_object, stem + ' - Cover Letter.pdf'));
    if (!r.cv_object && !r.cover_letter_object) box.appendChild(docButton('', null));
    return box;
  }

  function docsCell(r) {
    var td = elem('td');
    td.setAttribute('data-label', 'Documents');
    td.appendChild(docsBox(r));
    return td;
  }

  /* The upstream note used to be a `title` tooltip, which keyboard and touch users
   * could not reach at all. It is a real disclosure now. The panel it reveals differs
   * by band — a full-width <tr> in the table, a block inside the record in the queue —
   * so the panel is passed in already built and this only wires the button to it. */
  function noteToggle(id, panel, label) {
    var btn = elem('button', 'disc', label || 'Note');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
    return btn;
  }

  /* Cell contents are wrapped in a single element because the narrow layout turns
   * each cell into a two-column label/value grid, and loose children would each
   * become a grid item. Returns the extra <tr>, or null. */
  function roleCell(r, colspan) {
    var td = elem('td');
    td.setAttribute('data-label', 'Role');
    var box = elem('div');
    box.appendChild(elem('div', null, r.role || ''));
    td.appendChild(box);
    if (!r.notes) return { td: td, extra: null };

    var id = 'note-' + r.id;
    var extra = elem('tr', 'noterow');
    extra.hidden = true;
    var noteTd = elem('td');
    noteTd.id = id;
    noteTd.colSpan = colspan;
    noteTd.appendChild(elem('p', null, r.notes));
    extra.appendChild(noteTd);

    box.appendChild(noteToggle(id, extra));
    return { td: td, extra: extra };
  }

  /* ---------- feedback ---------- */

  /* Signals are insert-only: there is no retraction, so a decision she changed her
   * mind about is demoted rather than deleted. The most recent sent/hold wins and
   * every earlier one is struck through, which keeps the record honest without
   * making the current answer ambiguous. Notes never supersede anything. */
  function decoratedSignals(appId) {
    var list = signalsByApp[appId] || [];
    var last = -1;
    list.forEach(function (s, i) {
      if (s.kind === 'sent' || s.kind === 'hold') last = i;
    });
    return list.map(function (s, i) {
      var superseded = (s.kind === 'sent' || s.kind === 'hold') && i !== last;
      return { s: s, superseded: superseded };
    });
  }

  function sigChip(d) {
    var s = d.s;
    var cls = 'sig' + (s.kind === 'hold' ? ' sig-hold' : '') + (d.superseded ? ' sig-old' : '');
    var base = s.kind === 'sent' ? 'Sent' : s.kind === 'hold' ? "Don't send" : 'Note';
    var when = (s.created_at || '').slice(0, 10);
    var c = elem('span', cls, base + (when ? ' · ' + when : '') + (s.processed_at ? '' : ' · awaiting sync'));
    // title is an attribute, not parsed as markup — safe for round-tripped note text.
    if (s.note) c.title = s.note;
    if (d.superseded) c.title = (s.note ? s.note + '\n\n' : '') + 'Replaced by a later decision.';
    return c;
  }

  function redrawChips(appId, chips) {
    chips.textContent = '';
    decoratedSignals(appId).forEach(function (d) { chips.appendChild(sigChip(d)); });
  }

  function recordSignal(appId, kind, note, chips, btn) {
    var was = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving…';
    return sb
      .from('viewer_signals')
      .insert({ application_id: appId, kind: kind, note: note || null })
      .select('id,application_id,kind,note,created_at,processed_at')
      .then(function (res) {
        btn.disabled = false;
        btn.textContent = was;
        if (res.error) {
          oops(el('app-msg'), 'Could not record that. Nothing was saved, so try again.', res.error);
          return false;
        }
        var row = (res.data || [])[0];
        if (row) {
          (signalsByApp[appId] = signalsByApp[appId] || []).push(row);
          // Redraw rather than append: the new signal may have superseded an older one.
          redrawChips(appId, chips);
          // The chip now reads "awaiting sync"; the row's ground has to agree. Pending
          // has two carriers and they are set in different places, so without this the
          // record she just acted on sat on settled ground wearing a pending chip until
          // the next reload — the interface contradicting itself on the primary path.
          // Repainting rather than re-rendering: a re-render would close a note form
          // left open on another row and drop focus from the button she just pressed.
          var owner = ownerRecord(chips);
          if (owner) {
            var after = owner.nextElementSibling;
            paintPending(
              owner,
              after && after.nodeName === 'TR' && after.className.indexOf('noterow') !== -1
                ? after
                : null
            );
          }
        }
        say(el('app-msg'), 'Recorded. It reaches the tracker the next time signals are picked up.', 'ok');
        return true;
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = was;
        oops(el('app-msg'), 'Could not record that. Nothing was saved, so try again.', err);
        return false;
      });
  }

  // One form per row, reused by both text kinds. Toggled directly rather than by
  // re-rendering the table, so half-typed text survives a click elsewhere.
  function noteForm(appId, chips) {
    var root = elem('div', 'noteform');
    root.setAttribute('data-open', 'false');
    var inner = elem('div');

    var ta = document.createElement('textarea');
    ta.maxLength = NOTE_MAX;
    ta.setAttribute('aria-label', 'Note');

    var row = elem('div', 'row');
    var save = elem('button', 'act', 'Save');
    save.type = 'button';
    var cancel = elem('button', 'act', 'Cancel');
    cancel.type = 'button';
    var count = elem('span', 'count');

    var form = { root: root, kind: 'note' };
    var opener = null;
    function setCount() {
      count.textContent = ta.value.length + ' / ' + NOTE_MAX;
      // Only reachable if maxLength is bypassed, but the DB check is the real gate.
      count.setAttribute('data-over', String(ta.value.length > NOTE_MAX));
    }
    function close() {
      root.setAttribute('data-open', 'false');
      ta.value = '';
      setCount();
      // The form is visibility:hidden once closed, so focus would otherwise fall to
      // the body and a keyboard user would restart the tab run from the top of the
      // page. Send it back to whichever button opened this.
      if (opener && document.contains(opener)) opener.focus();
    }

    ta.addEventListener('input', setCount);
    cancel.addEventListener('click', close);
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); }
    });
    save.addEventListener('click', function () {
      var text = ta.value.trim();
      // The DB enforces this too (note_required_for_text_kinds); checking here saves a
      // round trip and phrases the failure as instruction rather than a constraint name.
      if (!text) {
        say(el('app-msg'), 'Add some text before saving, or press Cancel.', 'err');
        ta.focus();
        return;
      }
      recordSignal(appId, form.kind, text, chips, save).then(function (ok) {
        if (ok) close();
      });
    });

    form.open = function (kind, from) {
      form.kind = kind;
      opener = from || null;
      ta.placeholder = kind === 'hold'
        ? "Why this one shouldn't go out"
        : 'What you want us to know about this one';
      root.setAttribute('data-open', 'true');
      setCount();
      ta.focus();
    };

    row.appendChild(save);
    row.appendChild(cancel);
    row.appendChild(count);
    inner.appendChild(ta);
    inner.appendChild(row);
    root.appendChild(inner);
    return form;
  }

  function feedbackBox(r, actions) {
    var box = elem('div', 'fb');

    var chips = elem('div', 'sigs');
    redrawChips(r.id, chips);
    box.appendChild(chips);

    var form = noteForm(r.id, chips);
    var bar = elem('div', 'sigbar');

    if (actions.indexOf('sent') !== -1) {
      // The one thing she came to the page to do, so it is the one control with a
      // filled ground. The other two stay as text: three identical underlines gave a
      // destructive action the same weight as the primary one.
      var sent = elem('button', 'act act-primary', 'Mark sent');
      sent.type = 'button';
      sent.addEventListener('click', function () { recordSignal(r.id, 'sent', null, chips, sent); });
      bar.appendChild(sent);
    }

    var textKinds = [['note', 'Add note']];
    if (actions.indexOf('hold') !== -1) textKinds.push(['hold', "Don't send"]);
    textKinds.forEach(function (pair) {
      var b = elem('button', 'act', pair[1]);
      b.type = 'button';
      b.addEventListener('click', function () { form.open(pair[0], b); });
      bar.appendChild(b);
    });

    box.appendChild(bar);
    box.appendChild(form.root);
    return box;
  }

  function feedbackCell(r, actions) {
    var td = elem('td');
    td.setAttribute('data-label', 'Feedback');
    td.appendChild(feedbackBox(r, actions));
    return td;
  }

  // A row is pending when it carries at least one signal the tracker has not picked
  // up. It changes the row's ground, never its status badge: the repo decides status,
  // and the UI must not imply the dashboard did.
  function isPending(r) {
    return (signalsByApp[r.id] || []).some(function (s) { return !s.processed_at; });
  }

  // Fit is right-aligned tabular mono, so the decimal point is what the eye lines up
  // on — and Number#toString drops trailing zeros, so 81 sat a full digit to the right
  // of 88.4 and the column read ragged. Rather than render 81.0 and put a decimal on
  // every whole score, whole numbers get an empty span whose CSS ::after reserves the
  // width of ".0" without painting it. Generated content is not selected or copied, and
  // aria-hidden keeps it out of the accessibility tree, so the cell still says "81".
  function fillFit(node, r) {
    // Appended, never assigned: fitTag has already put an "Fit" label into the node for
    // screen readers, and setting textContent here would delete it and leave a record
    // with no score reading as a bare dash.
    if (r.fit_rating == null) {
      node.appendChild(document.createTextNode('—'));
      return node;
    }
    var text = String(r.fit_rating);
    node.appendChild(document.createTextNode(text));
    if (text.indexOf('.') === -1) {
      var pad = elem('span', 'fit-pad');
      pad.setAttribute('aria-hidden', 'true');
      node.appendChild(pad);
    }
    return node;
  }

  function fitCell(r) {
    var td = elem('td', 'num');
    td.setAttribute('data-label', 'Fit');
    return fillFit(td, r);
  }

  /* In the queue, fit is the reason a record is where it is — the band claims "best fit
   * first" and this is the evidence. So it is the one place fit carries ink rather than
   * being a grey number, and it is why the everyday screen is no longer entirely
   * colourless. It stays neutral in the history band, where fit is a footnote and the
   * status column owns the colour. */
  function fitTag(r) {
    var p = elem('p', 'rec-fit');
    if (r.fit_rating == null) p.className = 'rec-fit rec-fit-none';
    var label = elem('span', 'sr-only', 'Fit ');
    p.appendChild(label);
    return fillFit(p, r);
  }

  function companyCell(r) {
    var td = elem('td', 'cell-company', r.company || '');
    td.setAttribute('data-label', 'Company');
    return td;
  }

  // The pending ground, applied to a whole record. Shared by first render and by the
  // post-signal repaint so the two cannot drift: they were separate before, and the
  // repaint was simply missing. In the history table the disclosure row is a
  // continuation of the same record, so it carries the pending edge too — without it
  // the left rule stops mid-record. In the queue the record is one element and there is
  // nothing to continue. Both row kinds are built classless apart from their own base
  // class, so the wholesale className assignment is safe here.
  function paintPending(node, extra) {
    node.className = node.nodeName === 'LI' ? 'rec pending' : 'pending';
    if (extra) extra.className = 'noterow pending';
  }

  // Walks up to the element that owns a node: a <tr> in the history table, an <li> in
  // the queue. Used to find the record a chip belongs to without threading it through
  // feedbackBox and noteForm purely to reach it.
  function ownerRecord(node) {
    var n = node;
    while (n && n.nodeName !== 'TR' && n.nodeName !== 'LI') n = n.parentNode;
    return n;
  }

  function appendRow(body, tr, role, r) {
    if (isPending(r)) paintPending(tr, role.extra);
    body.appendChild(tr);
    if (role.extra) body.appendChild(role.extra);
  }

  /* ---------- band 1: ready to send ---------- */

  /* One drafted package as a single block: who and how well it fits on the first line,
   * the role on the second, what there is to read on the third, what to do about it on
   * the fourth. Reading order is the order she works in. */
  function queueRecord(r) {
    var li = elem('li', 'rec');

    var head = elem('div', 'rec-head');
    head.appendChild(elem('p', 'rec-co', r.company || ''));
    head.appendChild(fitTag(r));
    li.appendChild(head);

    li.appendChild(elem('p', 'rec-role', r.role || ''));

    // Documents and the note sit on one line: both are "things to read before
    // deciding", and separating them was what put Note on a line of its own. The
    // actions sit on that same line, pushed right — reading left to right is now
    // "what there is to read, then what to do about it".
    var foot = elem('div', 'rec-foot');
    var meta = elem('div', 'rec-meta');
    meta.appendChild(docsBox(r));
    var panel = null;
    if (r.notes) {
      var id = 'note-' + r.id;
      panel = elem('div', 'rec-note');
      panel.id = id;
      panel.hidden = true;
      panel.appendChild(elem('p', null, r.notes));
      meta.appendChild(noteToggle(id, panel));
    }
    foot.appendChild(meta);
    foot.appendChild(feedbackBox(r, ['sent', 'hold']));
    li.appendChild(foot);
    if (panel) li.appendChild(panel);

    if (isPending(r)) paintPending(li, null);
    return li;
  }

  /* ---------- band 0: worth a look ---------- */

  // Only http(s) postings become links. The URL reaches the browser from the
  // scraper by way of the database, so a javascript: or data: href would be a
  // script-execution hole opened by whatever a crawler happened to read. Anything
  // that is not plainly http(s) renders as inert text instead.
  function postingLink(r) {
    var safe = /^https?:\/\//i.test(r.url || '');
    var node = elem(safe ? 'a' : 'p', 'rec-role', r.role || '');
    if (safe) {
      node.href = r.url;
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
    }
    return node;
  }

  // Same ink as the queue's fit tag, for the same reason: the band claims "best
  // score first" and this is the evidence for the ordering.
  function scoreTag(r) {
    var p = elem('p', 'rec-fit' + (r.rank_score == null ? ' rec-fit-none' : ''));
    p.appendChild(elem('span', 'sr-only', 'Score '));
    p.appendChild(document.createTextNode(r.rank_score == null ? '—' : String(r.rank_score)));
    return p;
  }

  // /rank's veto gates, rendered only when they are not PASS.
  //
  // Whether these matter at all depends on the candidate. Where relocation is
  // acceptable, FLAG is the *common* verdict and a score shown without it reads
  // as unconditional — which is the case this exists for. Where location is a
  // hard filter, FLAG means travel rather than a move, and is rarer.
  //
  // FAIL is rendered rather than assumed unreachable, and that is not defensive
  // padding: /rank drops a FAIL from the shortlist it *presents*, but still
  // writes the entry back as status: ranked, and the sync keys on status. FAILs
  // reach this table. A view that silently dropped the verdict it did not expect
  // would show one as an ordinary opportunity — which is how the flag went
  // missing in the first place.
  //
  // Text nodes throughout: language_note is agent prose derived from third-party
  // posting text, the same untrusted class as strengths and gaps.
  function caveats(r) {
    var out = [];
    if (r.location && r.location !== 'PASS') {
      // The gate answers "is there a catch"; only the city answers "is it a catch
      // I care about", which is the question a relocation premium turns on.
      var where = r.location_detail || (r.location === 'FAIL' ? 'ruled out' : 'relocation or travel');
      out.push(r.location === 'FAIL' ? 'Location ruled out — ' + where : where);
    }
    if (r.language_gate && r.language_gate !== 'PASS') {
      out.push('Language — ' + (r.language_note || 'requirement above declared level'));
    }
    if (!out.length) return null;

    var p = elem('p', 'rec-caveat');
    p.appendChild(elem('span', 'sr-only', 'Caveat: '));
    p.appendChild(document.createTextNode('⚠ ' + out.join(' · ')));
    return p;
  }

  // The bullets are written by the ranking agents as plain text. They are appended
  // as text nodes, never as markup — elem() sets textContent.
  function bulletList(title, items) {
    var box = elem('div', 'rec-why');
    box.appendChild(elem('p', 't-label', title));
    var ul = elem('ul');
    items.forEach(function (t) { ul.appendChild(elem('li', null, t)); });
    box.appendChild(ul);
    return box;
  }

  function shortlistRecord(r) {
    var li = elem('li', 'rec');

    var head = elem('div', 'rec-head');
    head.appendChild(elem('p', 'rec-co', r.company || ''));
    head.appendChild(scoreTag(r));
    li.appendChild(head);

    li.appendChild(postingLink(r));

    // `fit` is deliberately not shown. It is a scrape-time guess, written before
    // anything scored the posting, so it contradicts the rank verdict often enough
    // to be noise — records read "strong fit" at 89 while carrying fit "low".
    // The verdict and the score are the ranked signal; showing both is enough.
    var meta = [];
    if (r.rank_verdict) meta.push(r.rank_verdict);
    if (r.portal) meta.push(r.portal);
    if (meta.length) li.appendChild(elem('p', 'rec-sub', meta.join(' · ')));

    var caveat = caveats(r);
    if (caveat) li.appendChild(caveat);

    var strengths = r.strengths || [];
    var gaps = r.gaps || [];
    if (strengths.length || gaps.length) {
      var panel = elem('div', 'rec-note');
      panel.id = 'why-' + r.id;
      panel.hidden = true;
      if (strengths.length) panel.appendChild(bulletList('Strengths', strengths));
      if (gaps.length) panel.appendChild(bulletList('Gaps', gaps));

      var foot = elem('div', 'rec-foot');
      var box = elem('div', 'rec-meta');
      box.appendChild(noteToggle(panel.id, panel, 'Why'));
      foot.appendChild(box);
      li.appendChild(foot);
      li.appendChild(panel);
    }

    return li;
  }

  function matchesShortlist(r) {
    if (!shortlistQ) return true;
    return ((r.company || '') + ' ' + (r.role || '')).toLowerCase().indexOf(shortlistQ) !== -1;
  }

  function renderShortlist() {
    var list = el('shortlist-list');
    list.textContent = '';
    var visible = shortlist.filter(matchesShortlist);

    // The count reports the whole shortlist, not the filtered view — it answers
    // "how big is the pile", which a search box should not change.
    el('shortlist-count').textContent = shortlist.length ? shortlist.length + ' ranked' : '';
    el('shortlist-tools').hidden = shortlist.length === 0;
    el('shortlist-empty').hidden = visible.length !== 0;
    list.hidden = visible.length === 0;

    if (shortlist.length && !visible.length) {
      el('shortlist-empty').textContent = 'No ranked postings match that search.';
    } else {
      el('shortlist-empty').textContent =
        'Nothing ranked yet. Postings show up here once they have been scored.';
    }

    visible.forEach(function (r) {
      list.appendChild(shortlistRecord(r));
    });
  }

  el('sq').addEventListener('input', function (e) {
    shortlistQ = e.target.value.trim().toLowerCase();
    renderShortlist();
  });

  function renderQueue() {
    var list = el('queue-list');
    list.textContent = '';
    // Best fit first: this band answers "what should go out next".
    var drafted = rows.filter(function (r) { return r.status === 'drafted'; });
    el('queue-count').textContent = drafted.length ? drafted.length + ' waiting' : '';
    el('queue-empty').hidden = drafted.length !== 0;
    list.hidden = drafted.length === 0;

    drafted.forEach(function (r) {
      list.appendChild(queueRecord(r));
    });
  }

  /* ---------- band 2: out in the world ---------- */

  function renderFilters() {
    var present = [];
    rows.forEach(function (r) {
      if (r.status !== 'drafted' && present.indexOf(r.status) === -1) present.push(r.status);
    });
    var box = el('status-filters');
    box.textContent = '';
    ['all'].concat(present).forEach(function (s) {
      var b = elem('button', 'chip', s === 'all' ? 'All' : STATUS_LABEL[s] || s);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(filter.status === s));
      b.addEventListener('click', function () {
        filter.status = s;
        renderFilters();
        renderHistory();
      });
      box.appendChild(b);
    });
  }

  el('q').addEventListener('input', function (e) {
    filter.q = e.target.value.toLowerCase();
    renderHistory();
  });

  function sent() {
    return rows.filter(function (r) { return r.status !== 'drafted'; });
  }

  function renderHistory() {
    var all = sent();
    var list = all.filter(function (r) {
      if (filter.status !== 'all' && r.status !== filter.status) return false;
      if (!filter.q) return true;
      return ((r.company || '') + ' ' + (r.role || '')).toLowerCase().indexOf(filter.q) !== -1;
    });
    // Recency, not fit. Fit answers "what should I send", and the queue above already
    // answered it; this band answers "what moved".
    list = list.slice().sort(function (a, b) {
      return String(b.status_date || '').localeCompare(String(a.status_date || ''));
    });

    el('history-count').textContent = all.length
      ? (list.length === all.length ? all.length + ' sent' : list.length + ' of ' + all.length)
      : '';

    var body = el('history-body');
    body.textContent = '';
    list.forEach(function (r) {
      var tr = elem('tr');
      var role = roleCell(r, 7);

      var status = elem('td');
      status.setAttribute('data-label', 'Status');
      status.appendChild(badge(r.status));

      var date = elem('td', 'cell-date', r.status_date || '—');
      date.setAttribute('data-label', 'Last moved');

      tr.appendChild(companyCell(r));
      tr.appendChild(role.td);
      tr.appendChild(status);
      tr.appendChild(date);
      tr.appendChild(fitCell(r));
      tr.appendChild(docsCell(r));
      tr.appendChild(feedbackCell(r, ['note']));
      appendRow(body, tr, role, r);
    });

    var empty = el('history-empty');
    empty.hidden = list.length !== 0;
    el('history').hidden = list.length === 0;
    // Nothing sent yet means nothing to search or filter. The controls stay for a
    // search that merely returns no matches — she needs them to get back.
    el('history-tools').hidden = all.length === 0;
    // "Everything sent, most recent first" describes a table. With nothing sent there
    // is no table, and the sentence sat above "Nothing has gone out yet" saying the
    // same thing twice with a gap between them.
    el('history-note').hidden = all.length === 0;
    empty.textContent = all.length === 0
      ? 'Nothing has gone out yet.'
      : 'No sent applications match this search.';
  }

  /* ---------- band 3: where it stands ---------- */

  function renderRates() {
    // Draft rows are excluded from every figure here: an unsent package is not a
    // submission, and counting it as one would flatter the rate.
    var submitted = sent();
    var active = submitted.filter(function (r) { return ACTIVE.indexOf(r.status) !== -1; }).length;
    var interviews = submitted.filter(function (r) {
      return REACHED_INTERVIEW.indexOf(r.status) !== -1;
    }).length;
    var rate = submitted.length ? Math.round((interviews / submitted.length) * 100) + '%' : '—';

    // Four zeroes and a dash say nothing the history band's own empty copy has not
    // already said, so the whole band stands down until there is a rate to report.
    el('rates-band').hidden = submitted.length === 0;
    if (submitted.length === 0) return;

    var items = [
      { n: submitted.length, l: 'Sent' },
      { n: active, l: 'Still live' },
      { n: interviews, l: 'Reached interview' },
      { n: rate, l: 'Interview rate' },
    ];
    var box = el('rates');
    box.textContent = '';
    items.forEach(function (s) {
      var d = elem('div');
      d.appendChild(elem('div', 'rate-n', String(s.n)));
      d.appendChild(elem('div', 'rate-l', s.l));
      box.appendChild(d);
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
