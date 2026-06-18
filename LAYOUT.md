---
name: Logos
concept_source: CONCEPT_TO_DESIGN.md
---

# Logos — Layout

> Derived from the concept, in parallel with DESIGN.md. The primary surface is the
> **Entity inspector** (the "grounding view"): one concept, its appearances grounded
> on a common line, its paths, and its provenance. A region exists because the
> concept demands it, not because a token is available.

## Regions

| id          | role                                                        | axiom | binds                       |
|-------------|-------------------------------------------------------------|-------|-----------------------------|
| worldbar    | global utility: archetype-query input + world/layer switch  | A5    | components.statBlock         |
| entity      | hero: the focused Entity as an unlabeled node on the ground line | A7    | components.entityNode / groundLine |
| components  | the grounded appearances (表現 Components), indexed rows on the line | A1    | components.entityRow         |
| refs        | paths to other Entities (Refs), dashed tangents leaving the line | A7    | components.refPath           |
| provenance  | append-only, origin-stamped change log                      | A3    | components.provenanceLog     |

## Reading order

`worldbar → entity → components → refs → provenance`

The world is **queried** (one of its three sworn responsibilities) before anything
surfaces (worldbar first, A5/world.md). A concept then **surfaces** as the hero
(entity, A7) — the thing-in-itself before its appearances. Its **groundings** are
the substance and come next (components, A1), then the **paths** that leave the
ground (refs, A7), and finally the **record** of how it came to be grounded
(provenance, A3: history answers last, in mono).

## Grid — base (narrow / mobile)

```layout-grid base
worldbar
entity
components
refs
provenance
```

## Grid — wide

```layout-grid wide
worldbar    worldbar    worldbar
entity      entity      entity
components  components  refs
components  components  provenance
```

## Responsive note

The one forced focus is **components** (A1) — the grounded appearances *are* the
Entity's substance — so it keeps the widest footprint at every breakpoint and never
collapses below full prominence. On `wide` it claims two of three columns with
`refs` and `provenance` stacked in the third (paths above record, mirroring the
reading order); on `base` everything stacks into a single ground-line column so the
baseline metaphor (things resting on one line) stays literally true top to bottom.
