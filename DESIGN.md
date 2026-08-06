<!-- Colors, status roles, typography, and the named rules are resolved and normative:
     every value below is the value in public/styles.css. Component tokens in section 5
     are still direction only. Re-run $impeccable document to capture them and to
     generate the DESIGN.json sidecar. -->
---
name: Chigüire
description: A private job-search ledger, printed in CMYK on bone paper.
fonts:
  display: "Space Grotesk"
  body: "Space Grotesk"
  mono: "JetBrains Mono"
colors:
  paper: "#f6f4eb"
  paper-sunk: "#edeade"
  paper-ink: "#101934"
  paper-muted: "#525a6f"
  paper-rule: "#d7d4ca"
  night: "#080f24"
  night-raised: "#111d47"
  night-ink: "#eae8df"
  night-muted: "#9ea4b5"
  night-rule: "#28324d"
  acid: "#d8e400"
---

# Design System: Chigüire

## 1. Overview

**Creative North Star: "The Screenprint Ledger"**

A record of something personal, kept on warm bone paper and printed in four
saturated inks. The reference object is a screenprinted poster, not a dashboard: flat
areas of unmixed color, hard edges, no gradients, no simulated depth. The chigüire is
the printed image, and the interface is the page it sits on.

Everything in this system derives from one piece of art the user chose. The four inks
are sampled from it rather than picked from a palette generator, which is why they sit
together without tuning. Indigo carries structure, cyan and violet carry motion,
magenta carries the bad news, and acid yellow is held in reserve for the moments that
actually matter.

This system explicitly rejects the shell it replaces: white cards on grey, uniform
12px radii, a blue primary button, evenly spaced stat tiles. It equally rejects the
escape route of dense terminal dark mode. Bone paper is neither, which is the point.
Per PRODUCT.md, decoration never outranks data: the palette is loud, and a
seven-column table still has to be scannable at a glance.

**Key Characteristics:**

- Flat, printed, unmixed color. No gradients, no shadows, no glass.
- Warm bone ground by day, deep indigo by night. Both are real, neither is a filter.
- Four inks with assigned jobs, not four decorative accents.
- Status carried by shape and label as well as hue, never by hue alone.
- The chigüire appears twice: a poster at the door, a small mark on the ledger. Never
  as wallpaper.

## 2. Colors

Four inks sampled directly from the artwork, on a warm bone ground, with a deep indigo
night counterpart.

**Every value below is verified at WCAG 2.2 AA against the _sunk_ ground**
(`--bg-sunk`: `#edeade` light, `#111d47` night), not the page ground. Rows carrying a
pending signal sit on the sunk ground, and that is the stricter of the two cases;
passing there implies passing on paper and on night. This is why the shipped status
values are a shade darker on light and a shade lighter on night than the seed values
they replaced.

### Primary

- **Acid** (`#d8e400`, `oklch(88% 0.197 113.6)`): the loudest note in the artwork and
  the rarest in the interface. Reserved for offers and hires, the two states worth
  interrupting someone for. Used as a solid fill with ink on top, never as text or as a
  border on paper. It is the only ink promoted to a named CSS token; the rest live
  inside the status variables.
- **Indigo** (`oklch(24.7% 0.109 268)`): the artwork's structural color and the source
  of every neutral in this system. Not used as an accent in its own right, and not a
  token: it is present as the hue inside Ink, Night, and Night Raised.

### Secondary

- **Cyan** (`#006ea8` light, `#2090cb` night): applications in flight. Sent, waiting,
  alive. It carries the fit score in the queue too, exposed as `--fit`. The queue holds
  only drafts and so has no status badges, and in the history band fit is a grey
  footnote, so the two readings never appear in the same band. Reusing the value rather
  than adding a lighter cyan keeps the Four Inks Rule literal.
- **Violet** (`#a93c9b` light, `#cb5ebd` night): interviews, reached or in progress.
  Escalated from cyan, short of an outcome.

### Tertiary

- **Magenta** (`#cd0d5b` light, `#f4427a` night): rejection and closure. Deliberately
  magenta rather than red. It is the artwork's own color, it is not an alarm, and it
  removes the red-green pairing that made the previous status palette unreadable for
  the most common form of color blindness.

### Neutral

- **Paper** (`#f6f4eb`, `oklch(96.5% 0.012 95)`): the default ground. Warm, tinted
  toward the acid hue family so it belongs to the palette rather than sitting under it.
- **Paper Sunk** (`#edeade`, `oklch(93.5% 0.016 95)`): reserved. See the Sunk Means
  Pending rule below.
- **Ink** (`#101934`, `oklch(22% 0.055 268)`): all body text. Indigo pushed dark, so
  text is never neutral grey and never pure black. 15.7:1 on paper.
- **Ink Muted** (`#525a6f`, `oklch(47% 0.035 268)`): labels, secondary text, column
  headers. 5.71:1 on the sunk ground, comfortably readable rather than merely legal.
- **Rule** (`#d7d4ca`, `oklch(87% 0.014 95)`): dividers and table row separators only.
- **Night** (`#080f24`), **Night Raised** (`#111d47`), **Night Ink** (`#eae8df`),
  **Night Muted** (`#9ea4b5`, 6.53:1 on Night Raised), **Night Rule** (`#28324d`): the
  dark counterparts, same hues, inverted lightness. Night Ink is bone, not white.

### Status Roles

Ten states, matching `STATUS_LABEL` and `STATUS_STYLE` in `app.js` exactly. Every
outline value clears 4.5:1 against the sunk ground in its own theme; the measured
minimum across all twenty values is 4.55:1. Acid fill with ink on top is 12.40:1.

| Status | Light | Night | Ink | Treatment |
|---|---|---|---|---|
| Drafted | `#646975` | `#858894` | neutral | Outline, dashed |
| Applied | `#006ea8` | `#2090cb` | cyan | Outline |
| Interview | `#a93c9b` | `#cb5ebd` | violet | Outline |
| Interview only | `#a93c9b` | `#cb5ebd` | violet | Outline |
| Offer | `#d8e400` | `#d8e400` | acid | Acid fill, ink text |
| Offer declined | `#d8e400` | `#d8e400` | acid | Acid fill, ink text, strikethrough |
| Hired | `#d8e400` | `#d8e400` | acid | Acid fill, ink text, plus an offset ring |
| Rejected | `#cd0d5b` | `#f4427a` | magenta | Outline |
| No response | `#666970` | `#85888f` | neutral | Outline, dashed |
| Withdrawn | `#66696f` | `#85888e` | neutral | Outline, strikethrough |

Four structural marks carry meaning without hue, and each encodes exactly one thing:

- **Fill** — an offer exists. Acid ground, ink on top. Nothing else is ever filled.
- **Dashed** — never really underway: not sent yet, or never answered.
- **Strikethrough** — she closed it herself, rather than it closing on her.
- **Ring** — Hired, the one terminal state that earns a second mark.

Interview and Interview only share an ink and an outline on purpose: both reached the
interview stage, and the difference between them is an outcome, not a hue. The word
"only" is the carrier, and it is spelled out in full on every badge.

### Named Rules

**The Acid Reserve Rule.** Acid yellow means one thing: an offer exists. It appears on
Offer, Offer Declined, and Hired, and nowhere else. If acid is visible anywhere but
those three states, something has gone wrong. Its scarcity is the entire mechanism by
which it means anything.

**The Fill, Don't Write Rule.** Acid is a background, never a foreground. At 88%
lightness it cannot reach 4.5:1 against bone, and darkening it to comply turns it olive
and destroys it. Filled with ink on top it reaches 12.4:1, which makes it
simultaneously the loudest and the most readable element on the page. This applies to
borders as well as text: acid against paper is 1.27:1, so there is no such thing as an
acid outline. The rule holds on the night theme too, even though acid-as-text would
technically pass there: one ink, one job, in both themes.

**The Sunk Means Pending Rule.** `--bg-sunk` has exactly one meaning in the running
interface: this record carries a signal she has recorded that the repository has not
picked up yet. It is not a table-header fill, not a note-row fill, and not a generic
recessed tone. Three places used it that way during the build and all three had to be
undone, because a header painted the same value as the first pending row made the two
read as one block. If a surface needs to separate from its background and it is not
pending, separate it with a rule or with spacing.

The rule bounds what the value _means_, not how loudly pending is drawn. A ledger row
is 40px and takes the fill as a band; a queue record is 130px and takes it as a slab,
loud enough that two pending records turned the whole queue into a selection state. So
the queue marks pending with the 1px inset edge and the chip that says "awaiting sync"
in words, and leaves the fill to the ledger. A pending record is one she has already
dealt with; it should recede, not shout.

**The Never Alone Rule.** No status is distinguished by color alone. Every badge
carries its label spelled out, and fill / dashed / strikethrough / ring each encode one
thing on their own. Verified against protanopia, deuteranopia, and tritanopia by
construction: acid, magenta, and cyan separate on lightness as well as hue.

**The Four Inks Rule.** Acid, magenta, cyan, violet. No fifth color enters this system.
If something needs to be distinguished and the four inks are exhausted, distinguish it
with shape, weight, or position instead.

## 3. Typography

**Display Font:** `Space Grotesk` (700)
**Body Font:** `Space Grotesk` (400/500/600)
**Label/Mono Font:** `JetBrains Mono` (400/500)

**Character:** A tight bold grotesque for headings against a monospace for data. Space
Grotesk's squared-off terminals and tight apertures match the artwork's flat geometry
without tipping into novelty; JetBrains Mono makes six columns of dates, statuses, and
fit scores align into readable columns instead of ragged text. The contrast between the
two is the hierarchy, so neither should be chosen to blend with the other. Both are
OFL. Self-host them from `public/`, woff2 only, with `font-display: swap`. No
third-party font CDN: this is a private dashboard and it should not phone anywhere it
does not have to.

### Hierarchy

Five steps, declared in `rem` so the scale tracks the reader's own root size.

| Role | Token | Size | Weight | Face |
|---|---|---|---|---|
| Display | `--t-display` | 3.5rem | 700 | Grotesk |
| Headline | `--t-headline` | 2rem | 700 | Grotesk |
| Title | `--t-title` | 1.3125rem | 600 | Grotesk |
| Body | `--t-body` | 1rem | 400 | Grotesk |
| Label | `--t-label` | 0.75rem | 500 | Mono, uppercase, 0.09em |

Adjacent ratios are 1.75, 1.52, 1.31, and 1.33. The Contrast Rule holds throughout.

- **Display**: the sign-in screen, where the chigüire appears at full size. This is the
  one place type is allowed to be large.
- **Headline**: the dashboard title. One per screen. Also the sign-in `h1` at the
  narrow breakpoint, where Display would wrap.
- **Title**: band headings ("Ready to send", "Out in the world") and stat values.
- **Body**: prose and the text-bearing table cells. Prose measure is capped between
  62ch and 72ch depending on how load-bearing the paragraph is: 62ch for the sign-in
  copy, 68ch for band notes, 70ch for notes and the footer.
- **Label**: column headers, stat labels, chips, the mono microcopy on signal pills.

**Data is not a sixth step.** Mono figures — fit scores, dates, counts — are set at
`0.94em` of whatever step they sit in, always with `font-variant-numeric: tabular-nums`.
That is an optical size-match, not a scale position: JetBrains Mono runs visually larger
than Space Grotesk at the same nominal size, and setting them equal makes the data
columns shout over the prose beside them. Because it is relative, a mono figure inside a
Body cell and one inside a Title stat both stay matched to their neighbour without a
second token.

### Named Rules

**The Tabular Rule.** Every number in the table uses tabular figures
(`font-variant-numeric: tabular-nums`). Fit scores and dates that shift horizontally
between rows are unscannable, which defeats the only reason the table exists.

**The Contrast Rule.** At least a 1.25 ratio between adjacent steps in the scale. The
current shell sets its `h1` at 20px against 15px body, which is not a hierarchy, it is
a rounding error.

## 4. Elevation

This system is flat. There are no shadows anywhere, in either theme.

A screenprint has no depth, and neither does this. Where separation is needed it comes
from a one pixel Rule or from spacing. Tone is not available as a general-purpose
separator: the one recessed value in the system, `--bg-sunk`, is spoken for by pending
records. Nothing floats and nothing lifts.

Motion is responsive rather than choreographed: state changes, filter transitions, and
sign-in feedback get transitions, and nothing gets an entrance. Ease out with
exponential curves, never bounce or elastic. Never animate layout properties. All
motion respects `prefers-reduced-motion`.

The note form is where both halves of that were tested. It used to open by
transitioning `grid-template-rows` from `0fr` to `1fr` together with its `margin-top`,
which is 200ms of reflow of everything below it, on a page that can hold a dozen of
them. The obvious repair is to animate `opacity` and `transform` on the form instead
and let the height change land in one frame. That was considered and rejected: the
second sentence of this section rules the repair out as firmly as the third rules out
the original, because a form fading and sliding into place is an entrance. It opens and
closes instantly now, and the height change happens once instead of on a timer. What
still moves is the triangle beside the disclosure label, which rotates in place, and
rotating a marker that is already on screen is a state change rather than an arrival.

### Named Rules

**The No Shadow Rule.** `box-shadow` is prohibited as elevation in this system,
including for hover, including for modals, including "just a subtle one". The single
exception is the 1px `inset` mark on a pending row, which is a printed rule drawn with
`box-shadow` specifically to avoid the banned side-stripe border; it casts nothing.

**The Audit Test.** If a surface looks like it is hovering above the page, the design
has drifted back toward the shell this replaces.

## 5. Components

Everything below is built and shipped. `public/styles.css` is the source of truth for
exact values; this section records the reasoning that produced them.

### Buttons

- **Shape:** square or barely softened. The 8px-everywhere radius of the current shell
  is part of what makes it generic. Flat printed shapes want hard corners.
- **Primary:** ink fill, paper text. Not acid, which is reserved for status.
- **Hover / Focus:** background shift, no lift, no shadow. Focus rings visible and
  high contrast in both themes.

### Chips

- **Style:** the filter chips are the interface's main interactive texture. Outline at
  rest, ink fill when pressed.
- **State:** `aria-pressed` remains the source of truth.

### Cards / Containers

Per the shared design laws, cards are the lazy answer and nested cards are always
wrong. The current shell wraps the table, the stats, and the sign-in form each in
their own bordered rounded box. Most of that should simply be the page. Use tone and
rule lines to group; reach for a container only where one is genuinely the right
affordance.

### Inputs / Fields

- **Style:** rule-line underline or a single hairline border on paper. No inner
  shadow, no filled grey wells.
- **Focus:** high-contrast ring, not a color-only border shift.

### Table

The history band, and the one component that carries a real comparison. Bone ground, an
unfilled header row over a single rule, hairline rules between records, mono figures,
status badges per the table in section 2. A record with a pending signal takes the sunk
ground and a 1px inset left mark (`box-shadow: inset 1px 0 0`, not a border, per the
side-stripe ban). Long notes live in a disclosure row bound to their record: the
record's closing rule moves down onto the disclosure so the two read as one block.

**The 979px breakpoint.** Below 980px the table abandons columns entirely and each
record becomes a stacked block, with `data-label` on every cell rendering the column
name through `::before`. The break is well above the obvious 719 because the table has
seven columns and needs 923px to lay out with its documents and actions each on one
line. The breakpoint follows the table, not the viewport category, and it was measured
against `dev/fixtures.js`, which carries the longest company and role strings
deliberately.

### Queue records

The queue is a list, not a table, and this is the screen she is actually on. Five
drafted packages are five decisions taken one at a time, not rows compared across
columns. As a table the two columns that read identically on every record — documents
and actions — took 406 of the 1132px available while the company and role wrapped
inside 248px and 417px: a third of the width spent on repetition, with the information
squeezed into what was left.

Each record is one block: company and fit on the first line, role on the second,
then a foot that runs documents and the note disclosure on the left and the actions on
the right. Reading left to right is "what there is to read, then what to do about it",
which is the order she works in. The right edge is shared by the fit figure and the
actions, so both form a column she can hit without looking.

**One primary per record.** `Mark sent` is the thing she opened the page to do, so it is
the only filled control on the page: ink ground, paper label, no underline, per the
button rule above. `Add note` and `Don't send` stay as text. Twenty-five identical
underlines gave a destructive action exactly the weight of the primary one.

Records hold a uniform height whether or not they carry a signal, because the feedback
box lays its chips and its actions out in one row rather than stacking them. A record
whose height changes when she acts on it is a record that moves the next one out from
under the cursor.

### The note disclosure

Both bands reveal the upstream note with the same control, built by one function, so
the word and the marker cannot drift apart between them: the label `Note`, and a small
solid triangle that points right when closed and turns down when open.

The label is deliberately not renamed. In the queue's foot the disclosure sits in the
meta group on the left and `Add note` sits in the action group on the right, on the same
line, sharing a word: one reads, one writes. That was raised as a collision, but the
collision was in the marker rather than the vocabulary. The foot's whole organising idea
is that the left is what there is to read and the right is what to do about it, the two
groups are pushed to opposite edges, and both halves are entitled to the word "note"
because a note is what each of them is about. The verb is what separates them, and
`Add note` already carries it.

What could not stand was `+`. It is the universal write affordance, it was sitting on
the read control, and it was pointing at the real write control from the far side of the
same line: "Note +" is a sentence that promises to add a note. A triangle says disclosure
and nothing else. It is drawn with borders rather than set as a ▸ glyph, so the mark does
not depend on the mono face's coverage of Geometric Shapes, and because a flat solid
triangle is already this system's idiom. It inherits `currentColor`, so it follows the
label through hover and through both themes without a second value.

In the ledger the same control sits in the Role cell while `Add note` sits in Feedback,
so the two were never adjacent there and the shared word never read as a pair. The marker
was just as wrong, and it is one component, so it was one fix.

### The Chigüire

Shipped as `public/img/chiguire.webp` — 680 × 625, RGBA, 100 KB, derived from
`Chiguire_1.ai` at the worktree root via `pdftocairo` and Pillow at quality 70. The
`.ai` source stays outside `public/` and is never uploaded.

It appears in exactly two places, at two sizes. The sign-in screen runs it at up to
30rem, dropping to 19rem and stacking above the form below the card breakpoint: that
screen is the only one in the app with nothing to do and no data to protect, so it is
the only one that gets to be a poster. Past sign-in it is a mark, not a poster —
`public/img/chiguire-mark.webp`, 192 × 176, 19 KB, cropped to the drawing's bounding
box and set at 3rem in the masthead, 2.5rem below the breakpoint. About 40px is the
floor: under that the WPAP facets average out into a dark blob and it stops being the
drawing. The separate small file rather than a scaled-down large one, because 100 KB is
a poor trade for a 40px mark on a phone.

**The word is never displayed.** The drawing is the name, and a private dashboard has
nobody to introduce itself to. So the artwork is not decorative and does not take an
empty `alt` — it *is* the `h1` on both screens, and its alt text is the only place
"Chigüire" exists in the rendered page. That keeps the heading in the document outline
and in the accessibility tree while nothing on screen spells it out. The `h1` wrappers
drop the UA margin and carry no type rules, since they hold no text node; the images
inside are `display: block`, which is what keeps the heading from adding leading around
the art.

Note that `public/` is served to the open internet, so the artwork is reachable at a
guessable URL by anyone. That is fine for a drawing and would not be fine for anything
else.

## 6. Do's and Don'ts

### Do:

- **Do** reserve acid yellow (`#d8e400`) for the three states where an offer exists:
  Offer, Offer declined, Hired. Nothing else.
- **Do** fill with acid and write in ink on top, never the reverse, in both themes.
  This covers borders too, not just text.
- **Do** reserve `--bg-sunk` for pending records. Nothing else gets that tone.
- **Do** give every status a non-color carrier: its label, plus one of fill, dashed,
  strikethrough, or ring.
- **Do** use tabular figures for every number, at `0.94em` of the surrounding step.
- **Do** separate surfaces with a one pixel rule or with spacing.
- **Do** tint every neutral toward the palette. Paper is warm bone, Ink is dark indigo.
- **Do** use the word "chigüire" in interface copy, not "capybara".
- **Do** vary spacing to create rhythm.

### Don't:

- **Don't** reproduce the current generic-SaaS shell: white cards on grey, uniform
  12px radii, a blue primary button, evenly spaced stat tiles.
- **Don't** reach for dense terminal dark mode as the escape from generic light. That
  trades one default for another.
- **Don't** use `#000` or `#fff` anywhere. Ink is `#101934`, Night Ink is `#eae8df`.
- **Don't** use red and green together for status. That pairing is why the palette was
  rebuilt around magenta, cyan, violet, and acid.
- **Don't** add motivational framing: no streaks, no progress bars toward a goal, no
  confetti, no encouragement copy. The chigüire is calm, not cheerful.
- **Don't** use `box-shadow` for elevation, or use gradients or glassmorphism at all.
- **Don't** use gradient text or `background-clip: text`.
- **Don't** use a colored `border-left` or `border-right` over 1px as an accent stripe.
- **Don't** build a hero-metric block: big number, small label, gradient accent.
- **Don't** nest cards, or wrap things in containers by reflex.
- **Don't** use em dashes in interface copy.
- **Don't** let the chigüire become wallpaper. Twice per session, at two sizes.
