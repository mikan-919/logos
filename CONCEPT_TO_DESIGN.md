# Concept → Design

> Derived from: CONTEXT.md, README.md, docs/idea/{core,world,layers,external_boundary}.md, docs/adr/*, and the prior moodboard DESIGN.md (read as data).
> Compiles to: DESIGN.md (Google Labs open spec) + LAYOUT.md (sibling structural spec).
> Generated: 2026-06-18

## The concept in one paragraph

Logos is a **conceptual-grounding substrate** — an ECS "world" that records that
scattered service representations (a GitHub Issue, a Linear Issue, a Notion Page)
are *the same concept*, grounding them on a shared conceptual ground (接地). An
**Entity** is the concept itself — Kant's thing-in-itself (物自体), which *has no
name of its own*; a **Component** is one appearance of it on one service (現象);
**Refs** are paths between already-grounded Entities, not groundings themselves.
Every write passes through a single API and is recorded in an **append-only,
provenance-stamped log** (由来付きログ). Its audience is systems-minded builders
of the substrate and its layers (Rotax/Velt/…), whose stated values are radical
minimalism ("これ以上でも以下でもない"), provenance honesty, and *visible*
structure. The emotional target is **calm exactness**, not reassurance — the
enemy is hidden magic, not anxiety.

## Subject world

The ground and the baseline (接地). Thing-in-itself vs. appearance (物自体 /
現象): one invisible concept, many concrete appearances. The Entity is
*unnameable* — meaning lives in its Components, never in a title. Archetype
queries ("return every Entity holding a RotaxTask"). An append-only log where
every change carries its origin. **Merge** as a pointed declaration that "these
two appearances are one concept." Refs as *paths* (tangents that leave the
ground), distinct from groundings (blocks that sit on the ground). A single
write-mouth; one value in the world, no copies, no reconciliation echo. A "world"
deliberately kept thin.

## Axioms

| ID | Decision | Concept evidence (quote/cite) | Forced / Free | The choice & why | Token(s) |
|----|----------|-------------------------------|---------------|------------------|----------|
| A1 | Ground = quiet neutral substrate | "概念という共通の地面"; "Entity自体は名前を持たない" — the ground & the concept carry no color of their own; meaning is in the appearances | Forced→Free | Near-neutral monochrome ground so Components (appearances) carry all signal. **Hue free** → warm off-white paper, never pure white/black. | colors.background, colors.surface, colors.on-surface, colors.muted, colors.line |
| A2 | One accent = "the grounding now in focus" | Grounding/Merge declares *this one* concept now; "書き込みの単一口" — one mouth, one focus signal | Forced→Free | A single scarce accent marks the focused Entity / current selection / destructive Merge — nothing else. **Hue free** → orange. ≤5% of any screen. | colors.accent, colors.accent-soft, colors.on-accent |
| A3 | Provenance & meta are monospaced | "append-only 由来付きログ"; archetype query; coordinate-like data — the matter-of-factness of data *is* the truth | Forced | Origins, ids, timestamps, query strings render mono + uppercase + tracked, so they read as measured record, not prose. | typography.meta, typography.data |
| A4 | Noumenon/phenomenon scale contrast | "Entity が物自体（概念）、Component がサービス上の現象" — the concept is the large invisible thing; appearances are small & concrete | Forced→Free | Dramatize the gap: display oversized, meta tiny, **no middle size**. Contrast forced; grotesque face is **free**. | typography.display, typography.h1, typography.h2, typography.body, typography.meta |
| A5 | Make structure visible, not hidden | "構造を見せる"; ECS archetypes; the baseline grid is the literal *ground* things are grounded on | Forced | Hairline rules and index numbers (01/02) are ornament; regions divide by 1px lines, never shadow. Editorial surfaces square (radius 0). | colors.line, colors.line-strong, rounded.none, components.entityRow, components.indexLabel |
| A6 | Flat depth; layer with frost | "コピーが存在せず echo…問題は生まれない"; "影でリッチさを演出しない" — one store, no copies → depth is conceptual, not physical | Forced | No drop shadows for hierarchy. Transient overlays (Merge dialog, query palette) float via frost/blur over the ground. | elevation (flat), components.frostSheet |
| A7 | Signature: the grounding baseline | "概念という共通の地面に接地"; "`Refs` は…接地されたEntity同士をつなぐ道" — groundings sit ON the line; Refs are paths that leave it | Free | A horizontal ground-line motif: the Entity is an unlabeled node on it; Components are blocks resting on it; Refs are *dashed* tangents leaving it. Reused in hero, rows, and refs. | components.groundLine, components.refPath, components.entityNode |
| A8 | Generous whitespace (Ma) | "Logos のコア…薄さで十分"; "これ以上でも以下でもない" — thinness is a stated value | Forced→Free | Restraint forced; large section gaps (≥48px) prove the thinness. Exact rhythm **free** → 4px base scale. | spacing.* |
| A9 | Dual radius: square record vs. soft UI | Concept mandates *visible structure* (→ square ledgers) but not chrome; OS-native softness for interactive chrome is a deliberate identity choice | Free | radius 0 for ledgers/log/poster surfaces; radius-md for buttons/inputs/widgets. | rounded.none, rounded.sm, rounded.md, rounded.full |
| A10 | Inverted "night" world | "Logos…ワールド" — the world can be observed under either light; appearances persist either way | Free | Provide a dark ground (not a naive invert): paper→ink, accent lifted for dark legibility. | colors.* (dark variants noted in prose) |

## Free-axis bets

- **Orange accent (A2).** The concept forces *scarcity and singularity* of color, not a specific hue. Orange is chosen as the "live grounding" signal: warm enough to read as a human act of declaration (Merge is a human judgment, not an automatic join), saturated enough that a 5% dose dominates attention. The restraint that pays for it: everything else stays in warm grayscale; semantic colors are desaturated so the accent is never rivaled.
- **The ground-line signature (A7).** Derived literally from 接地 — the one metaphor the whole product is named around. It earns its keep by encoding a *real distinction* the data model makes: solid block-on-line = grounding (表現 Component), dashed tangent = path (Refs). The motif is information, not decoration. Restraint: it appears only where grounding is the subject (hero, component rows, refs), never as filler.
- **Grotesque + mono pairing (A3/A4).** A humanist-grotesque display against a strict monospace for provenance stages the noumenon/phenomenon split typographically: the concept speaks in the large grotesque, the record answers in small mono. Restraint: exactly two families plus body; no third voice.

## Forbidden moves

- **No prescriptive CTA/urgency chrome.** Logos is a substrate that *records*
  declarations, it does not tell the user what to do (world.md: it provides store,
  query, notify — "これ以上でも以下でもない"). → no urgency banners, no "do this next."
- **No shadows for hierarchy** (A6) — frost or hairline only.
- **No second saturated color** beside the accent (A2) — semantic colors stay
  desaturated; at most two colored systems on screen, then back to monochrome.
- **No title on the Entity itself** (A1: 名前を持たない) — the Entity is shown as a
  node/id; any human-readable label is explicitly a `Name` Component, rendered as
  an appearance among others, never as the page title.
- **No solid line for a Ref** (A7) — Refs are paths, not groundings; always dashed.
- **No mid-size headings** used as routine body (A4) — the middle is reserved.

## Open questions

- Which layer's view is the *primary* product surface to ship first — the
  world-level Entity inspector (designed here) or a single layer like Rotax? The
  token system is layer-agnostic; LAYOUT.md models the Entity-inspector surface.
- Should `Merge` (a destructive, irreversible declaration) get a dedicated accent
  treatment distinct from "in focus," or share the single accent? Left to a human.
