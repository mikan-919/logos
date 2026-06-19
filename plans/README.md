# rotax improvement plans

Plans written by the `/improve` advisor. Each is self-contained for a fresh executor.

**Base commit:** `4087a9f`

## Plans

| # | Plan | Scope | Risk | Status |
|---|------|-------|------|--------|
| 001 | [Split the rotax dashboard mockup](001-split-rotax-mockup.md) | Refactor `apps/rotax/src/routes/+page.svelte` (1082 lines) into a shared `.svelte.ts` state module + region components | Low–Med (pure refactor, no test suite — manual parity check is the gate) | DONE (commit `b04acdc`; tsc/build/svelte-check clean, no new errors; manual browser parity check still pending) |

## Execution order

Just 001. No dependencies.

## Notes

- 001 is a **pure refactor** — UI and behavior must be identical before/after. Granularity
  was chosen as "region-level" (~6 components matching the grid rows) per the requester, to
  keep mockup iteration fast.
- The mockup has **no automated tests**; correctness rests on the manual parity check in
  plan 001 Step 6.4. A Playwright smoke test is a possible future plan but explicitly out of
  scope here.

## Considered and rejected

- *Extracting Tailwind classes into `@apply` / component styles* — would change the
  inline-utility convention and slow mockup edits. Not done.
- *Merging the mockup `Task` type with `lib/types.ts`* — they're intentionally distinct (UI
  mock shape vs. real persistence model). Not done.
