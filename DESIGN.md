---
version: alpha
name: Logos
description: Conceptual-grounding substrate — a warm-monochrome editorial ground where service appearances are grounded on a common line, with provenance rendered as measured mono record.
colors:
  primary: "#0E0E0C"
  primary-700: "#3A3A37"
  primary-500: "#6E6E69"
  primary-300: "#A8A8A2"
  background: "#F7F5F1"
  surface: "#FFFFFF"
  on-surface: "#0E0E0C"
  muted: "#6E6E69"
  line: "#DCDAD3"
  line-strong: "#C2C0B8"
  accent: "#F1531F"
  accent-hover: "#D8430F"
  accent-soft: "#FBE2D6"
  on-accent: "#FFFFFF"
  positive: "#2E6F4E"
  warning: "#B7791F"
  danger: "#C2331B"
typography:
  display:
    fontFamily: "DM Sans, Zen Kaku Gothic Antique, sans-serif"
    fontSize: 96px
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: -0.03em
  h1:
    fontFamily: "DM Sans, Zen Kaku Gothic Antique, sans-serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -0.02em
  h2:
    fontFamily: "DM Sans, Zen Kaku Gothic Antique, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.01em
  body:
    fontFamily: "DM Sans, Zen Kaku Gothic Antique, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  meta:
    fontFamily: "JetBrains Mono, M PLUS 1 Code, monospace"
    fontSize: 10.5px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.08em
  data:
    fontFamily: "JetBrains Mono, M PLUS 1 Code, monospace"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
spacing:
  base: 16px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 24px
  xl: 32px
  gutter: 24px
  section: 64px
  void: 96px
rounded:
  none: 0px
  sm: 8px
  md: 16px
  lg: 24px
  full: 9999px
components:
  entityNode:
    color: "{colors.accent}"
    fontFamily: "{typography.meta}"
  groundLine:
    borderColor: "{colors.line-strong}"
  refPath:
    borderColor: "{colors.line-strong}"
    color: "{colors.muted}"
  entityRow:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    padding: "{spacing.lg}"
  indexLabel:
    color: "{colors.muted}"
    fontFamily: "{typography.meta}"
  provenanceLog:
    backgroundColor: "{colors.background}"
    color: "{colors.muted}"
    fontFamily: "{typography.data}"
  frostSheet:
    backgroundColor: "{colors.surface}"
  statBlock:
    color: "{colors.accent}"
    fontFamily: "{typography.data}"
---

# Logos — Design System

The visual language of a conceptual-grounding substrate. One warm-monochrome
ground; service *appearances* are the only things that carry color and weight.
The **signature** is the grounding baseline (A7): the Entity is an unlabeled node
on a hairline ground; its Components are blocks resting on that line; its Refs are
dashed tangents leaving it.

## Overview

Logos grounds scattered representations onto a shared conceptual ground (接地).
The audience is systems-minded builders who value minimalism and provenance
honesty; the feel is **calm exactness**, never reassurance-chrome. The whole
surface reads like a precise technical broadsheet: oversized grotesque for the
concept, tiny monospace for the record, hairlines and index numbers showing the
structure on purpose.

## Colors

The ground is deliberately near-neutral and *warm* — meaning belongs to the
appearances, not the substrate (A1). Never pure white or black: `{colors.background}`
is the off-white paper, `{colors.primary}` the warm near-black ink, with a 700/500/300
ink ramp for secondary, meta, and disabled text. `{colors.line}` / `{colors.line-strong}`
are the hairlines that do the dividing work shadows are forbidden from doing (A5/A6).

A single scarce accent, `{colors.accent}`, marks exactly one thing: the grounding
in focus — the selected Entity, the current query target, or a destructive Merge
(A2). It must stay under ~5% of any screen; `{colors.accent-soft}` backs tags and
`{colors.on-accent}` is text on accent fills. Semantic colors (`{colors.positive}`,
`{colors.warning}`, `{colors.danger}`) are desaturated on purpose so they never
rival the accent — at most two colored systems on screen, then back to monochrome.

## Typography

Three voices stage the noumenon/phenomenon split (A4). `{typography.display}` and
`{typography.h1}` are oversized grotesque, tightly tracked — the *concept*, the large
invisible thing made loud. `{typography.body}` is quiet humanist sans for prose.
`{typography.meta}` and `{typography.data}` are **monospace, uppercase, positively
tracked** — provenance, ids, timestamps, archetype-query strings read as measured
*record*, not marketing (A3). The middle is intentionally empty: `{typography.h2}`
exists for true section breaks only, never as routine body (A4). Headings tighten
(negative tracking); meta opens (positive tracking) — that tension is the house style.

## Layout

Generous, not dense — whitespace is the proof of a thin core (A8). Section gaps run
`{spacing.section}`+ and major voids reach `{spacing.void}`; the base unit is
`{spacing.base}` on a 4px scale. A 12-column desktop grid (24px gutter, 96px margin,
1440px max), 8-column tablet, 4-column mobile — and the grid is shown, not hidden:
index numbers and rules pin to its edges as the content's "index" (A5). Body text is
left-aligned, ragged-right; never justified.

## Elevation & Depth

**Flat.** One store, no copies, so hierarchy is conceptual and needs no drop shadow
(A6). Regions separate by hairline only. The sole exception is transient overlays —
the Merge dialog and the query palette — which float on a frosted sheet
(`{components.frostSheet}`, `backdrop-blur` over the ground), not on a shadow.

## Shapes

Two radius languages (A9). **Square** (`{rounded.none}`) for everything that is
*record*: the Entity ledger, component rows, the provenance log, poster surfaces —
structure shown honestly. **Soft** (`{rounded.md}` cards, `{rounded.sm}` buttons and
inputs, `{rounded.full}` pills/icon-buttons) for interactive chrome, an OS-native
端正さ chosen deliberately as identity, not derived from the concept.

## Components

- **entityNode (A7/A1):** the focused Entity, drawn as an unlabeled accent node + mono
  id on the ground line. It carries *no title* — any human label is a `Name` Component
  shown among the appearances, never as the page heading.
- **groundLine (A7):** the horizontal hairline the whole metaphor rests on; Components
  sit on it.
- **entityRow (A1/A5):** one grounded appearance (RotaxTask, VeltNote, GithubIssue…) —
  square, hairline-bordered, surface fill, a mono index label (`01`) and service meta
  top-corner. The substance of the page; full width at every breakpoint.
- **refPath (A7):** a Ref to another Entity — rendered with a **dashed** connector and
  muted ink, visually distinct from a grounding. Never a solid line.
- **provenanceLog (A3):** the append-only change log — reverse-chronological mono rows,
  each stamped with origin; reads as a ledger, not a feed.
- **indexLabel / statBlock (A4/A5):** mono micro-labels and oversized-figure stats that
  carry the scale contrast.
- **frostSheet (A6):** the only "elevated" surface — transient overlays.

## Do's and Don'ts

**Do**
- Keep the ground monochrome; spend the accent on the one grounding in focus.
- Show structure: hairlines, index numbers, the ground line, the visible grid.
- Render every origin/id/timestamp in mono; let provenance read as record.
- Treat whitespace as the proof of a thin core.

**Don't**
- Add prescriptive CTA or urgency chrome — Logos records declarations, it does not
  tell users what to do.
- Use shadows for hierarchy — frost or hairline only.
- Introduce a second saturated color beside the accent.
- Give the Entity a title — it has no name of its own.
- Draw a Ref as a solid line — Refs are paths, not groundings.
- Use mid-size headings as routine body; the middle is reserved.
