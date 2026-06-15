# 001 — Split the rotax dashboard mockup into a shared state module + region components

**Written against commit:** `4087a9f`
**Target file:** `apps/rotax/src/routes/+page.svelte` (currently 1082 lines, everything inline)
**Status:** TODO

---

## Why this matters

`apps/rotax/src/routes/+page.svelte` is a single 1082-line Svelte 5 component holding the
entire dashboard mockup: the domain model + seed data, all reactive state (live clock,
pomodoro timer, derived views), every action, a custom `hold` Svelte action, and the full
markup for four visual regions plus two modals.

The goal is **the minimum split that makes this navigable, without slowing down mockup
iteration**. The thing that kills iteration speed when you split a Svelte file is
**prop-plumbing** — threading dozens of `$state`/`$derived` values and callbacks down
through component props. Svelte 5 has a purpose-built escape hatch: **runes inside a
`.svelte.ts` module**. You put `$state`/`$derived` in a module, export a single singleton
object, and any component imports it directly and reads/writes it. No props, no events, no
context API. Editing the mockup stays as fast as it is today — you just have smaller files.

So this split has two moves:

1. **One shared state module** (`state.svelte.ts`) holds all reactive state + actions as a
   singleton. Components import it and use it directly.
2. **Markup is cut into region components** matching the three CSS-grid rows, plus the two
   modals. `+page.svelte` shrinks to a ~40-line layout shell.

This is a **pure refactor**. The rendered UI and all behavior must be byte-for-byte
identical. No features added, no styling changed, no bug fixes (even if you spot one — see
"Escape hatches").

---

## Conventions to follow (match these exactly)

- **Svelte 5 runes only.** `$state`, `$derived`, `$derived.by`, `$effect`, `$props`. No
  stores (`writable`), no `export let`. The current file uses runes throughout — keep it.
- **TypeScript** in every `<script lang="ts">` and `.ts` file.
- **Tailwind utility classes inline in markup**, exactly as they appear now. Do not extract
  classes, do not reformat them, do not "tidy" them. Move them verbatim.
- **Import alias:** `$lib` → `apps/rotax/src/lib`. e.g. `import { dashboard } from "$lib/dashboard/state.svelte";`
  (Note: import paths to a `.svelte.ts` module are written **without** the `.ts` extension,
  but **with** `.svelte` — i.e. `"$lib/dashboard/state.svelte"`.)
- **Indentation:** tabs inside `<script>` blocks (matches current file), two spaces in
  markup (matches current file). Preserve whatever a moved block already uses.
- Do **not** touch `apps/rotax/src/lib/types.ts` — that `Task` interface is the *real*
  persistence model used by `+page.server.ts` and the API. The mockup's `Task` type is a
  *separate, local* shape and stays local to the mockup (it moves to `seed.ts`). These two
  must not be merged.

---

## Target file layout

Create a new folder `apps/rotax/src/lib/dashboard/` containing:

```
apps/rotax/src/lib/dashboard/
  seed.ts              ← Task/TaskState types + the seed tasks array (pure data)
  format.ts            ← pure helpers + constants + the `hold` action (no runes)
  state.svelte.ts      ← all reactive state, derived views, actions (the singleton store)
  NewTaskBar.svelte    ← grid Row 1
  DayTimeline.svelte   ← grid Row 2, the timeline block (R1C1)
  HeroStage.svelte     ← grid Row 2, everything else (hero title/desc, sidebar, progress bar)
  TaskPool.svelte      ← grid Row 3, left column
  Trajectory.svelte    ← grid Row 3, right column (incl. the detail overlay)
  EditModal.svelte     ← the top-layer edit modal
```

And rewrite `apps/rotax/src/routes/+page.svelte` to a thin shell.

**In scope:** the nine files above + rewriting `+page.svelte`.
**Out of scope / do not touch:** `types.ts`, `+page.server.ts`, `+layout.svelte`,
`api/tasks/+server.ts`, `app.css`, `tailwind.config.ts`, anything under `build/` or
`.svelte-kit/`, and any other app.

---

## Step 1 — `seed.ts` (pure data)

Move lines 8–177 (the `TaskState` type, `Task` type, and the `tasks` seed array) into
`apps/rotax/src/lib/dashboard/seed.ts`. This file has **no runes** — it just exports the
types and a plain array factory.

Because the array becomes reactive `$state` in the store, export it as a **factory function**
so the seed data is a fresh array each time (avoids a shared-mutable-module-export footgun):

```ts
// apps/rotax/src/lib/dashboard/seed.ts
export type TaskState = "done" | "active" | "upcoming" | "backlog";

export type Task = {
	id: string;
	title: string;
	description: string;
	todos: string[];
	start: number | null; // hour 0–24 on the day timeline, null = backlog
	end: number | null;
	state: TaskState;
};

export function seedTasks(): Task[] {
	return [
		{
			id: "TASK-1A2B",
			title: "Setup repo",
			// ... move all 14 task objects here verbatim from lines 21–176 ...
		},
		// ...
	];
}
```

Keep the explanatory comment from lines 5–7 above the types.

**Verify:** `cd apps/rotax && bunx tsc --noEmit -p tsconfig.json` reports no new errors in
`seed.ts` (it should report errors elsewhere until later steps land — that's expected; just
confirm `seed.ts` itself is clean).

---

## Step 2 — `format.ts` (pure helpers, constants, `hold` action)

Move all the **pure, non-reactive** helpers and constants here. These reference no `$state`
and can be plain exported consts/functions.

Move into `apps/rotax/src/lib/dashboard/format.ts`:

- Constants: `DAY_START` (6), `DAY_END` (24), `MAX_LANES` (3), `HOUR_TICKS`,
  `WEEKDAYS`, `MONTHS`, and the pomodoro constants `FOCUS_SEC`, `BREAK_SEC`,
  `LONG_BREAK_SEC`, `SESSIONS_BEFORE_LONG`, `SESSION_TARGET` (lines 203, 238–239,
  263–282, 308–312). The pomodoro constants are read by the store **and** by forecast math
  — exporting them from here keeps one source of truth.
- Pure functions (lines 283–303, 552–560): `pct`, `laneTop`, `fmtHour`, `hhmm`, `hms`,
  `clamp01`, `mmss`, `toHHMM`, `fromHHMM`. Note `pct` and `laneTop` close over
  `DAY_START`/`DAY_END` — keep them in this file so the constants are in scope.
- The `LaidSpan` type (lines 204–209) — it's referenced by the store's lane-layout derived.
- The `hold` Svelte action (lines 383–437) verbatim. It's pure DOM, no runes.

```ts
// apps/rotax/src/lib/dashboard/format.ts
export const DAY_START = 6;
export const DAY_END = 24;
export const MAX_LANES = 3;
// ... etc ...

export const pct = (h: number) => ((h - DAY_START) / (DAY_END - DAY_START)) * 100;
export const laneTop = (lane: number) => 9.5 + lane * 8;
// ... move hhmm, hms, mmss, fmtHour, clamp01, toHHMM, fromHHMM verbatim ...

export type LaidSpan = {
	span: { id: string; title: string; start: number; end: number; state: string };
	lane: number;
	overlap: number;
	underActive: boolean;
};

export function hold(node: HTMLElement, params: { onhold: () => void; duration?: number }) {
	// ... move lines 384–436 verbatim ...
}
```

> Note on `LaidSpan`: in the original it was typed against `(typeof daySpans)[number]`.
> Since `daySpans` now lives on the store, redeclare the `span` field with the concrete
> shape shown above (a scheduled task always has non-null `start`/`end`). This keeps
> `format.ts` free of any store import. If the executor finds the structural type causes a
> tsc error where `laidSpans` is consumed, fall back to importing the scheduled-task type
> from the store — but try the concrete inline shape first.

**Verify:** `bunx tsc --noEmit -p tsconfig.json` shows `format.ts` itself clean.

---

## Step 3 — `state.svelte.ts` (the singleton store) — the critical step

This module holds **all reactive state, derived views, and actions**. The pattern is a
**class with rune fields, instantiated once and exported as a singleton**. Svelte 5 fully
supports `$state` / `$derived` / `$derived.by` as class fields in a `.svelte.ts` file.

### 3a. The class skeleton

```ts
// apps/rotax/src/lib/dashboard/state.svelte.ts
import { seedTasks, type Task, type TaskState } from "./seed";
import {
	DAY_START, DAY_END, MAX_LANES,
	FOCUS_SEC, BREAK_SEC, LONG_BREAK_SEC, SESSIONS_BEFORE_LONG, SESSION_TARGET,
	WEEKDAYS, MONTHS, clamp01, hhmm, hms, mmss,
	type LaidSpan,
} from "./format";

class DashboardState {
	// ---- core state ----
	tasks = $state<Task[]>(seedTasks());
	now = $state(new Date());

	// pomodoro
	running = $state(true);
	phase = $state<"focus" | "break">("focus");
	pomoElapsed = $state(0);
	sessionsDone = $state(0);
	pomoHistory = $state<number[]>([]);

	// overlay / selection
	pinned = $state<Task | null>(null);
	hoveredId = $state<string | null>(null);

	// edit modal
	editing = $state<Task | null>(null);
	editTitle = $state("");
	editDescription = $state("");

	// reschedule popover
	reschedTask = $state<Task | null>(null);
	reStart = $state("09:00");
	reEnd = $state("10:00");

	// new task
	newTaskTitle = $state("");

	// hover-throttle bookkeeping (plain fields, not reactive)
	#lastHoverAt = 0;
	#hoverTimer: ReturnType<typeof setTimeout> | null = null;

	// ---- derived views (each becomes a getter; forward refs are fine) ----
	scheduled = $derived(/* move lines 181–188 */);
	nowHour = $derived(/* move lines 250–252 */);
	// ... see 3b for the full list ...

	// ---- actions: move the functions as methods (see 3c) ----
}

export const dashboard = new DashboardState();
```

### 3b. Move every reactive value as a class field

Map the current top-level declarations to class fields. **`$state` → `$state` field**,
**`const x = $derived(...)` → `x = $derived(...)` field**, **`$derived.by` → `$derived.by`
field**. Inside each derived/method, replace bare references to other reactive values with
`this.`-qualified references (e.g. `nowHour` → `this.nowHour`, `tasks` → `this.tasks`,
`activeTask` → `this.activeTask`).

Move these (current line → field):

| Current lines | Becomes field |
|---|---|
| 181–188 `scheduled` | `scheduled = $derived(...)` |
| 189 `daySpans` | `daySpans = $derived(this.scheduled)` |
| 191 `trajectoryPast` | `trajectoryPast = $derived(this.scheduled.filter((t) => t.end <= this.nowHour))` |
| 193–195 `trajectoryUpcoming` | derived field |
| 196 `backlog` | derived field |
| 197 `activeTask` | derived field |
| 210–235 `laidSpans` | `laidSpans = $derived.by<LaidSpan[]>(() => { ... })` |
| 250–252 `nowHour` | derived field |
| 253 `nowOnAxis` | derived field |
| 257–261 `onActiveTask` | derived field |
| 278–280 `dateLabel` | derived field (uses `WEEKDAYS`/`MONTHS` from format.ts) |
| 321 `onBreak` | derived field |
| 322–328 `phaseLength` | derived field |
| 329 `pomoRemaining` | derived field |
| 442–444 `nextUpcoming` | derived field |
| 445 `heroTask` | derived field |
| 446 `heroIsUpcoming` | derived field |
| 447–449 `heroLabel` | derived field |
| 450–452 `heroTime` | derived field (uses `hhmm`) |
| 453–455 `elapsedH` | derived field |
| 457–463 `heroProgress` | derived field |
| 464 `elapsedPct` | derived field |
| 465 `heroPctExact` | derived field |
| 470–500 `pomoForecast` | `$derived.by` field |
| 502–506 `taskStats` | derived field |
| 508 `doneCount` | derived field |
| 509–513 `focusH` | derived field |
| 514–518 `dayStats` | derived field |
| 524–526 `hoveredTask` | derived field |
| 528 `selectedCard` | derived field |
| 639 `brandLabels` | a plain `readonly` field or keep in format.ts (it's a const) — put it on the store as `brandLabels = ["LOGOS", "Rotax", "Velt", "Zestium"]` for convenience |

> **Reference inside `$derived.by` callbacks:** in `laidSpans` and `pomoForecast`, references
> like `daySpans`, `nowHour`, `phase`, `sessionsDone`, `pomoRemaining`, `activeTask` all
> become `this.daySpans` etc. The `MAX_LANES`, `FOCUS_SEC`, `BREAK_SEC`, `LONG_BREAK_SEC`,
> `SESSIONS_BEFORE_LONG` come from the `format.ts` imports.

### 3c. Move the actions as methods

Move these functions to class methods, **binding them as arrow-function fields** so `this`
stays correct when they're passed as event handlers (`onclick={dashboard.addTask}`):

- `togglePause` (354–356)
- `startTask(task)` (360–374)
- `completeActive` (376–379)
- `openEdit(task)` / `saveEdit` (535–545)
- `openReschedule(task)` / `applyReschedule` / `unschedule(task)` / `doNow(task)` (562–590)
- `hoverTask(id)` (598–615) — uses the private `#lastHoverAt` / `#hoverTimer` fields and the
  `HOVER_THROTTLE` const (594; keep it as a local `const` in the module or a static)
- `makeId` (620–622) / `addTask` (624–637)

Use the **arrow-field** form so handlers keep their binding:

```ts
	togglePause = () => {
		this.running = !this.running;
	};

	startTask = (task: Task) => {
		for (const t of this.tasks) if (t.state === "active") t.state = "upcoming";
		const dur = task.start !== null && task.end !== null ? task.end - task.start : 1;
		task.start = this.nowHour;
		task.end = Math.min(DAY_END, this.nowHour + dur);
		task.state = "active";
		this.running = true;
		this.phase = "focus";
		this.pomoElapsed = 0;
		this.pomoHistory = [];
		this.reschedTask = null;
		this.pinned = null;
	};
	// ... etc, the rest verbatim with this.-qualification ...
```

### 3d. The two intervals — `startClocks()`, NOT `$effect`

The original has two `$effect` blocks with `setInterval` (the clock at 242–247 and the
pomodoro at 332–352). **`$effect` cannot run at module top level** — it needs a component or
effect-root context. Do **not** put `$effect` in this module.

Instead expose a plain method that sets up both intervals and returns a teardown function.
It uses plain `setInterval` (mutating `$state` from a timer callback is fine and reactive):

```ts
	// Set up the live clock + pomodoro ticking. Returns a cleanup fn.
	// Call this from the root component's $effect so it's torn down on unmount.
	startClocks = (): (() => void) => {
		const clock = setInterval(() => {
			this.now = new Date();
		}, 250);

		const pomo = setInterval(() => {
			if (!this.running || !this.activeTask) return;
			if (this.pomoElapsed + 1 >= this.phaseLength) {
				if (this.phase === "focus") {
					this.sessionsDone += 1;
					if (this.activeTask) {
						const dur = this.activeTask.end! - this.activeTask.start!;
						this.pomoHistory.push(
							clamp01((this.nowHour - this.activeTask.start!) / dur) * 100,
						);
					}
					this.phase = "break";
				} else {
					this.phase = "focus";
				}
				this.pomoElapsed = 0;
			} else {
				this.pomoElapsed += 1;
			}
		}, 1000);

		return () => {
			clearInterval(clock);
			clearInterval(pomo);
		};
	};
```

### 3e. Expose constants the markup needs

The markup reads a few constants directly (`HOUR_TICKS`, `SESSION_TARGET` via `taskStats`,
etc.). Those that markup touches should be importable in the components straight from
`format.ts` — components import `{ pct, hhmm, HOUR_TICKS, ... }` from `"$lib/dashboard/format"`
and `{ dashboard }` from `"$lib/dashboard/state.svelte"`. No need to re-export through the
store.

**Verify after this step:** `bunx tsc --noEmit -p tsconfig.json`. `seed.ts`, `format.ts`,
and `state.svelte.ts` must all be clean. `+page.svelte` will still error until Steps 4–6 —
that's fine.

---

## Step 4 — Region components

Each component imports the singleton and the helpers it uses, then contains the moved markup
**verbatim**, with one mechanical change: every reference to a state value or function gets
`dashboard.` prepended (e.g. `heroTask` → `dashboard.heroTask`, `addTask` → `dashboard.addTask`,
`bind:value={newTaskTitle}` → `bind:value={dashboard.newTaskTitle}`), and pure helpers
(`pct`, `hhmm`, `fmtHour`, `laneTop`, `mmss`, etc.) are imported from `format.ts` and used
unprefixed. The `hold` action is imported from `format.ts` and used as `use:hold={...}`.

A component has **no `<script>` state of its own** beyond the imports — that's the whole
point. Example shape:

```svelte
<!-- apps/rotax/src/lib/dashboard/NewTaskBar.svelte -->
<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
</script>

<!-- Row 1: New task input — moved verbatim from +page.svelte lines 644–663,
     with newTaskTitle → dashboard.newTaskTitle and addTask → dashboard.addTask -->
<div class="flex items-center gap-4 px-8 border-b border-[#DCDAD3]">
  ...
</div>
```

Component → source-line mapping (move the markup verbatim, apply the `dashboard.` prefixing):

| Component | Source lines | Imports needed |
|---|---|---|
| `NewTaskBar.svelte` | 644–663 | `dashboard` |
| `DayTimeline.svelte` | 668–720 | `dashboard`, `{ HOUR_TICKS, pct, fmtHour, laneTop, hhmm }` from format |
| `HeroStage.svelte` | 722–866 (the HAVE-A-NEXT label, brand labels, title/desc, sidebar, and progress/controls — i.e. everything in Row 2 **except** the timeline) | `dashboard`, `{ mmss, hold }` + `fade/fly/cubicOut` (see below) |
| `TaskPool.svelte` | 873–888 | `dashboard` |
| `Trajectory.svelte` | 891–1029 (both lanes **and** the detail overlay) | `dashboard`, `{ hold }`, `fade/fly/cubicOut` |
| `EditModal.svelte` | 1035–1069 | `dashboard`, `fly/fade/cubicOut` |

**Transition imports:** any component using `fade`/`fly` needs
`import { fade, fly } from "svelte/transition";` and `import { cubicOut } from "svelte/easing";`
at the top of its `<script>` (these came from lines 2–3). Add them only where used:
`HeroStage` (the `{#key}` cross-fade, 742–759), `Trajectory` (overlay + reschedule popover),
`EditModal`.

**`HeroStage` internal structure:** it owns the grid cells R2C1, R1C2, R3C1, R3C2, and R5 of
the Row-2 grid. Keep its outer markup as the same set of `col-start-*/row-start-*` divs —
i.e. `HeroStage` renders those grid children directly (no extra wrapper div), so it must be
placed inside the same grid as `DayTimeline`. See Step 5 for how `+page.svelte` composes the
grid. If rendering sibling grid-children from two components is awkward, the acceptable
fallback is: `+page.svelte` keeps the Row-2 `<div class="grid ...">` wrapper and renders
`<DayTimeline />` then `<HeroStage />` inside it — both components emit grid-positioned
children that land in the right cells because the positioning is by explicit
`col-start/row-start`, not source order. **Verify the rendered layout matches before/after.**

**`Trajectory` + overlay:** the detail overlay (944–1028) lives inside the Trajectory
container `<div>` (891) because it's `absolute inset-0` to it. Keep the overlay inside
`Trajectory.svelte` so the positioning context is preserved.

---

## Step 5 — Rewrite `+page.svelte` as a thin shell

Replace the entire file with the layout skeleton (the outer grid from line 642 and the row
structure), composing the components, plus the `startClocks` wiring and the
`<svelte:window>` keydown handler.

```svelte
<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
import NewTaskBar from "$lib/dashboard/NewTaskBar.svelte";
import DayTimeline from "$lib/dashboard/DayTimeline.svelte";
import HeroStage from "$lib/dashboard/HeroStage.svelte";
import TaskPool from "$lib/dashboard/TaskPool.svelte";
import Trajectory from "$lib/dashboard/Trajectory.svelte";
import EditModal from "$lib/dashboard/EditModal.svelte";

// Live clock + pomodoro ticking, torn down on unmount.
$effect(() => dashboard.startClocks());
</script>

<div class="w-dvw h-dvh bg-[#F7F5F1] text-[#0E0E0C] grid overflow-hidden"
  style="grid-template-rows: 4.5rem 1fr 12rem;">

  <NewTaskBar />

  <!-- Row 2 grid: timeline + hero share this grid (positioned by col/row-start) -->
  <div class="grid px-8 border-b border-[#DCDAD3]"
    style="grid-template-columns: 1fr auto; grid-template-rows: 5fr auto auto 3fr auto;">
    <DayTimeline />
    <HeroStage />
  </div>

  <!-- Row 3 grid -->
  <div class="grid" style="grid-template-columns: 280px 1fr;">
    <TaskPool />
    <Trajectory />
  </div>
</div>

<EditModal />

<svelte:window onkeydown={(e) => {
  if (e.key === "Escape") { dashboard.editing = null; dashboard.reschedTask = null; }
}} />

<style>
  /* Hide scrollbars while keeping scroll behaviour. */
  .no-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
```

> **`.no-scrollbar` style:** it's used by `TaskPool`, `Trajectory`, and the overlay. Svelte
> `<style>` is scoped per-component, so a `.no-scrollbar` defined only in `+page.svelte` will
> **not** apply to child components. Two options — pick the simpler one that works:
> 1. **Move `.no-scrollbar` to global CSS:** add the two rules to `apps/rotax/src/app.css`
>    (which is already imported globally in `+layout.svelte`) and drop the `<style>` block
>    from `+page.svelte`. **Preferred** — one definition, applies everywhere.
> 2. Duplicate the `<style>` block into each component that uses `.no-scrollbar`.
>
> Use option 1. Confirm `app.css` is the global stylesheet (it's imported in
> `+layout.svelte` line `import "../app.css";`). Append the rules; don't remove anything.

---

## Step 6 — Verification gates

Run from `apps/rotax/`:

1. **Type check:** `bunx tsc --noEmit -p tsconfig.json`
   → Expected: **no errors** (the whole tree now type-checks). Compare against a baseline
   run on the original commit if unsure which errors are pre-existing; the refactor must not
   *add* any.

2. **Svelte check:** `bunx svelte-check --tsconfig ./tsconfig.json`
   (svelte-check ships transitively via `@sveltejs/kit`; if the binary isn't found, skip and
   note it — `tsc` + the dev build below are the binding gates.)
   → Expected: no new errors/warnings introduced by the refactor.

3. **Build:** `bun run build`
   → Expected: completes successfully, no compile errors.

4. **Manual parity check (the real gate):** `bun run dev`, open the app, and confirm the UI
   is **visually and behaviorally identical** to before:
   - New-task input adds a backlog task (Enter and the Add button); button disables when empty.
   - Day timeline renders task spans in up to 3 lanes, hour ticks, and a live "Now" marker
     that ticks every ~0.25s and turns orange only while on the active task.
   - Hero shows the active task (or "UP NEXT" preview); the title cross-fades when it changes.
   - Pomodoro timer counts down (MM:SS), the bottom progress bar fills, forecast dots
     (hollow) and history dots (solid) render, Pause/Resume + Hold-to-Complete /
     Hold-to-Start work (the hold-fill sweep animates).
   - Task pool hover previews a card in the trajectory overlay; clicking a pool item or a
     trajectory card opens the detail overlay with Start/Edit/Reschedule/Delete.
   - Reschedule popover applies times / Do Now / Unschedule.
   - Edit modal opens, saves title+description, Escape closes it.

The mockup has no automated tests (confirmed: no test files, no test script in
`package.json`). The manual parity check in step 4 is therefore the primary correctness gate
— do not skip it. If you cannot run a browser, run steps 1–3 and **explicitly report that
the manual check was not performed** so the reviewer runs it.

---

## Done criteria (machine-checkable where possible)

- [ ] `apps/rotax/src/routes/+page.svelte` is ≤ ~60 lines and contains no `$state`/`$derived`/
      action definitions — only imports, the grid shell, the `startClocks` `$effect`, the
      `<svelte:window>`, and the `<style>` (or none, if `.no-scrollbar` moved to `app.css`).
      Check: `wc -l apps/rotax/src/routes/+page.svelte` → well under 100.
- [ ] The nine new files exist under `apps/rotax/src/lib/dashboard/`.
- [ ] `bunx tsc --noEmit -p tsconfig.json` passes with no new errors.
- [ ] `bun run build` succeeds.
- [ ] Manual parity check passes (or is explicitly reported as un-run).
- [ ] No file outside the in-scope list changed, **except** `app.css` if you took option 1
      for `.no-scrollbar` (that single addition is allowed and expected).

---

## Test plan

No existing test suite to extend, and adding one is out of scope for this refactor. The
"test" is the manual parity check in Step 6.4. If the reviewer wants regression protection
later, the natural follow-up (separate plan) is a Playwright smoke test that loads `/` and
asserts the four regions render — but **do not add it as part of this plan**.

---

## Maintenance notes (for the reviewer)

- The whole design hinges on the **singleton store** pattern. Future mockup edits should keep
  adding reactive state to `state.svelte.ts` and reading it directly in components — resist
  reintroducing prop-plumbing, which would defeat the purpose.
- `startClocks()` deliberately uses plain `setInterval`, not `$effect`, because the module
  has no component context. The lifecycle is owned by the root `+page.svelte` `$effect`. If a
  second consumer ever calls `startClocks()`, you'll get duplicate intervals — keep it
  single-caller.
- The mockup `Task` type (in `seed.ts`) and the real `Task` interface (in `types.ts`) are
  intentionally distinct. When the mockup is later wired to real data, that mapping is a
  deliberate, separate task — don't let them silently merge.
- Watch in review: that the Row-2 grid still positions cells correctly after splitting
  `DayTimeline` / `HeroStage` (the cells use explicit `col-start`/`row-start`, so source
  order shouldn't matter — but verify visually), and that `.no-scrollbar` actually applies
  inside the child components (scoped-style gotcha).

---

## Escape hatches — STOP and report instead of improvising if:

- **You spot a bug in the original logic.** This is a pure refactor. Preserve the existing
  behavior exactly, even if it looks wrong (e.g. `daySpans` being a trivial alias of
  `scheduled`, or any off-by-one). Note it for the reviewer; do not fix it here.
- **`$derived` / `$state` class fields don't compile in `state.svelte.ts`** (e.g. a Svelte
  version that doesn't support runes-in-classes). The installed Svelte is `^5.33.13`, which
  supports it — but if you hit a hard compiler error, STOP and report rather than falling
  back to `writable` stores (that would change the conventions). The fallback worth trying
  first is plain exported `$state`/`$derived` at module top level with the actions as
  exported functions; report that you switched.
- **The Row-2 two-component grid renders visibly differently** from the original and you
  can't make the explicit-grid-placement approach match. STOP and report — the fallback
  (keep one combined `HeroRow.svelte` for all of Row 2 incl. timeline) changes the agreed
  granularity and needs sign-off.
- **`bunx tsc` shows pre-existing errors you can't distinguish from new ones.** Run tsc on
  the clean `4087a9f` checkout first to capture the baseline, then compare. If still unclear,
  report the diff rather than guessing.
