# Product

## Register

product

## Users

Two people with very different relationships to the same data.

**Daniela** is the job seeker. She opens this most days, often more than once, and
already knows every row in the table by heart. She does not need to be reminded what
"Acme, Backend Engineer" is. What she needs is to see what moved since yesterday, get
to a document fast, and leave a note when something happens. Her context is personal,
not professional: this is her own life, checked from her own devices, frequently at
the low-energy end of the day.

**A helper** (partner, coach, or whoever is supporting the search) signs in
occasionally. They have none of Daniela's recall. For them the table has to explain
itself: status must be legible without knowing the backstory, and the shape of the
search as a whole should be readable in a glance rather than reconstructed row by row.

Designing for both means state has to be visible rather than remembered, without
making the frequent user wade through explanation she does not need.

## Product Purpose

A private dashboard over a job search that is tracked and assembled elsewhere. An
upstream pipeline (private repo) produces applications, statuses, fit scores, and
documents; this site is where that becomes readable, and where Daniela records notes
and feedback that flow back for review.

So it is not a read-only report and not a full workspace. It is a window with a
narrow write path: read state, act on what needs acting on, leave a note.

Success is that opening it feels worth doing. A job search runs for months and mostly
produces silence and rejection. A tracker that makes that feel like an audit is a
tracker she will stop opening, and an unopened tracker has no value regardless of how
correct its data is.

## Brand Personality

Warm, personal, unbothered.

The anchor is a piece of art she chose: a WPAP pop-art chigüire in magenta, cyan,
acid yellow, and deep indigo. It carries the whole personality, and it earns its place
rather than decorating.

A capybara is the internet's shorthand for staying completely serene while chaos
happens around it. Pointed at a job search, that is not a joke, it is the thesis. The
chigüire holds its posture whether the table is full of interviews or full of silence.
The interface takes the same position: it reports what happened, it does not react.

Personality lives in color, type, and the chigüire's presence. It never lives in
commentary about how the search is going.

"Chigüire" is the word used throughout, not "capybara." It is her word, and using it
is most of what separates this from a template.

## Anti-references

**The current shell.** White cards on grey, uniform 12px radii, blue primary button,
system font stack, evenly spaced stat tiles. This is the default every generator
produces. It is the specific thing being moved away from.

**Anything that reads as generic SaaS.** Gradient heroes, big-number-plus-label stat
templates, glassmorphism, identical card grids, colored side-stripes on rows.

**The reflex escape route.** Swapping generic-light for dense terminal-dark (Linear,
Raycast) trades one default for another. The chigüire palette exists precisely so the
answer is neither.

**Motivational framing.** No streaks, no progress bars toward a goal, no confetti, no
encouragement copy. The chigüire is calm, not cheerful. Warmth here means the
interface is pleasant to sit with, not that it tells her she is doing great.

## Design Principles

**Calm under bad news.** Rejection and silence are the statistical norm of a job
search. They get reported plainly and never dramatized. Nothing turns alarming because
the numbers turned bad.

**Hers, not a template.** Her artwork, her word for it. Specificity is the whole
defense against generic output. When a choice is between the conventional option and
the one that belongs to this person, take the second.

**Two speeds of reader.** Daniela has total recall; her helper has none. Encode state
so it is readable cold, without adding explanation that gets tedious on the fifth visit
this week.

**Fun is structural.** Personality comes from palette, typography, and where the
chigüire sits, decided once at the system level. It is not sprinkled on afterward as
animations or easter eggs.

**Decoration never outranks data.** The palette is loud, and the table still has to be
scannable. Status encoding wins every conflict with chrome. If a color is doing a job
in the data, it does not also decorate.

## Accessibility & Inclusion

WCAG 2.2 AA. No specific known user needs beyond the standard baseline.

- AA contrast for all text and interactive elements, in whichever theme ships.
- Visible focus rings throughout; fully keyboard operable.
- Respect `prefers-reduced-motion`.
- **Status must never depend on color alone.** The current badges do exactly that, and
  the `#10b981` offer / `#ef4444` rejected pairing is the textbook red-green failure.
  Every status needs a non-color carrier: label, shape, position, or icon.
- The chigüire is decorative. It gets an empty `alt` where it is ornamental, and real
  alt text only where it carries meaning (an empty state, for instance).

## Asset Notes

- `Chiguire_1.ai` is the licensed source. Clean vector, transparent ground.
- The Fiverr preview PNG was watermarked and has been deleted. Do not re-add it.
- Full SVG is ~289 KB gzipped. Fine for sign-in and empty states, too heavy for
  small or repeated use. Simplify or rasterize for those.
- Everything under `public/` is served publicly. Source art stays at the repo root,
  which `wrangler.jsonc` never uploads.
