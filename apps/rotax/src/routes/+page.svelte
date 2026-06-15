<script lang="ts">
import { fade, fly } from "svelte/transition";
import { cubicOut } from "svelte/easing";

// ---- Domain model ----------------------------------------------------------
// Single source of truth. A task carries its own `state`; scheduled tasks also
// have start/end hours on today's timeline, backlog tasks leave them null.
type TaskState = "done" | "active" | "upcoming" | "backlog";

type Task = {
	id: string;
	title: string;
	description: string;
	todos: string[];
	start: number | null; // hour 0–24 on the day timeline, null = backlog
	end: number | null;
	state: TaskState;
};

let tasks = $state<Task[]>([
	{
		id: "TASK-1A2B",
		title: "Setup repo",
		description: "Bootstrap the Bun monorepo and CI.",
		todos: [
			"Init Bun workspaces",
			"Biome + tsconfig presets",
			"GitHub Actions pipeline",
		],
		start: 7,
		end: 8.5,
		state: "done",
	},
	{
		id: "TASK-3C4D",
		title: "Schema draft",
		description: "Model the persistence layer for entities and components.",
		todos: [
			"Entity / Component tables",
			"Migration 0001",
			"Index hot query paths",
		],
		start: 8.5,
		end: 10,
		state: "done",
	},
	{
		id: "TASK-5E6F",
		title: "ECS core",
		description: "Land the archetype-based ECS runtime.",
		todos: ["Archetype storage", "System scheduler", "Benchmark 10k entities"],
		start: 10,
		end: 11,
		state: "done",
	},
	{
		id: "TASK-7G8H",
		title: "Router wiring",
		description: "Stand up the HTTP router and middleware stack.",
		todos: [
			"Mount route tree",
			"Error boundary middleware",
			"Structured request logging",
		],
		start: 11,
		end: 12,
		state: "done",
	},
	{
		id: "TASK-32F9",
		title: "Implement World API",
		description:
			"Expose the simulation world over HTTP so clients can query entities and submit commands.",
		todos: [
			"Define /world REST routes",
			"Wire ECS queries into handlers",
			"Cursor-based pagination",
			"Integration tests against seed data",
		],
		start: 16,
		end: 17,
		state: "upcoming",
	},
	{
		id: "TASK-A1B2",
		title: "Velt sync",
		description: "Stream world deltas to clients in real time.",
		todos: [
			"Open WebSocket channel",
			"Diff / patch protocol",
			"Reconnect with backoff",
		],
		start: 21,
		end: 22,
		state: "upcoming",
	},
	{
		id: "TASK-C3D4",
		title: "UI polish",
		description: "Tighten the dashboard before the demo.",
		todos: [
			"Timeline hover states",
			"Empty / loading states",
			"Keyboard shortcuts",
		],
		start: 22,
		end: 23,
		state: "upcoming",
	},
	{
		id: "TASK-E5F6",
		title: "Zestium hook",
		description: "Notify Zestium when a run completes.",
		todos: [
			"Register outbound webhook",
			"Sign payloads (HMAC)",
			"Retry queue on failure",
		],
		start: 23,
		end: 24,
		state: "upcoming",
	},
	{
		id: "TASK-RL01",
		title: "Rate-limit the public API",
		description: "Protect the public endpoints from abuse.",
		todos: [],
		start: null,
		end: null,
		state: "backlog",
	},
	{
		id: "TASK-CA02",
		title: "Cache world snapshots in Redis",
		description: "Serve hot reads from an in-memory snapshot.",
		todos: [],
		start: null,
		end: null,
		state: "backlog",
	},
	{
		id: "TASK-OA03",
		title: "Generate OpenAPI spec",
		description: "Publish a typed contract for API consumers.",
		todos: [],
		start: null,
		end: null,
		state: "backlog",
	},
	{
		id: "TASK-SD04",
		title: "Seed a demo dataset",
		description: "Ship a believable world for demos and tests.",
		todos: [],
		start: null,
		end: null,
		state: "backlog",
	},
	{
		id: "TASK-PL05",
		title: "Profile cold-start latency",
		description: "Find and shave the worst startup costs.",
		todos: [],
		start: null,
		end: null,
		state: "backlog",
	},
	{
		id: "TASK-RB06",
		title: "Write the deploy runbook",
		description: "Document how to ship and roll back.",
		todos: [],
		start: null,
		end: null,
		state: "backlog",
	},
]);

// ---- Derived views ---------------------------------------------------------
// Every panel reads from one of these; none of them holds its own copy.
const scheduled = $derived(
	tasks
		.filter(
			(t): t is Task & { start: number; end: number } =>
				t.start !== null && t.end !== null,
		)
		.sort((a, b) => a.start - b.start),
);
const daySpans = $derived(scheduled);
// Past lane: everything already behind us on the timeline, done or not.
const trajectoryPast = $derived(scheduled.filter((t) => t.end <= nowHour));
// Upcoming lane also surfaces the running task, flagged for special display.
const trajectoryUpcoming = $derived(
	scheduled.filter((t) => t.state === "active" || t.state === "upcoming"),
);
const backlog = $derived(tasks.filter((t) => t.state === "backlog"));
const activeTask = $derived(tasks.find((t) => t.state === "active") ?? null);

// Lay scheduled spans into up to 3 stacked lanes (overlap = packed schedule).
// Greedy: each span takes the first lane whose previous task has already ended.
// Also tag how many spans are concurrent (for the ×N hover) and whether the
// span sits under the active/orange task (where hover labels are suppressed).
const MAX_LANES = 3;
type LaidSpan = {
	span: (typeof daySpans)[number];
	lane: number;
	overlap: number;
	underActive: boolean;
};
const laidSpans = $derived.by<LaidSpan[]>(() => {
	const laneEnds: number[] = [];
	const placed: LaidSpan[] = [];
	for (const span of daySpans) {
		let lane = laneEnds.findIndex((e) => e <= span.start + 1e-9);
		if (lane === -1 && laneEnds.length < MAX_LANES) {
			lane = laneEnds.length;
			laneEnds.push(span.end);
		} else if (lane !== -1) {
			laneEnds[lane] = span.end;
		}
		placed.push({ span, lane, overlap: 0, underActive: false });
	}
	const act = daySpans.find((s) => s.state === "active") ?? null;
	for (const p of placed) {
		p.overlap = daySpans.filter(
			(o) => o.start < p.span.end && o.end > p.span.start,
		).length;
		p.underActive =
			!!act &&
			p.span !== act &&
			p.span.start < act.end &&
			p.span.end > act.start;
	}
	return placed.filter((p) => p.lane >= 0); // overflow beyond 3 lanes isn't drawn
});

// ---- Live clock ------------------------------------------------------------
const DAY_START = 6;
const DAY_END = 24;

let now = $state(new Date());
$effect(() => {
	const id = setInterval(() => {
		now = new Date();
	}, 250);
	return () => clearInterval(id);
});

// Current time as a fractional hour (0–24) on the day axis.
const nowHour = $derived(
	now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600,
);
const nowOnAxis = $derived(nowHour >= DAY_START && nowHour <= DAY_END);

// The Now marker only lights up (orange) while we're inside the active task's
// scheduled window; in the gaps between tasks it goes quiet/grey.
const onActiveTask = $derived(
	activeTask !== null &&
		nowHour >= activeTask.start! &&
		nowHour < activeTask.end!,
);

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
	"JAN",
	"FEB",
	"MAR",
	"APR",
	"MAY",
	"JUN",
	"JUL",
	"AUG",
	"SEP",
	"OCT",
	"NOV",
	"DEC",
];
const dateLabel = $derived(
	`${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()} · JST`,
);

const HOUR_TICKS = [6, 9, 12, 15, 18, 21, 24];
const pct = (h: number) => ((h - DAY_START) / (DAY_END - DAY_START)) * 100;
// Vertical pixel position of a lane (0 = centred on the baseline, stacking down).
const laneTop = (lane: number) => 9.5 + lane * 8;
const fmtHour = (h: number) => String(Math.floor(h)).padStart(2, "0");
const hhmm = (h: number) =>
	`${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h - Math.floor(h)) * 60)).padStart(2, "0")}`;
// HH:MM:SS — for the live readouts that should visibly tick every second.
const hms = (h: number) => {
	const total = Math.max(0, Math.round(h * 3600));
	const s = total % 60;
	const m = Math.floor(total / 60) % 60;
	const hr = Math.floor(total / 3600);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${p(hr)}:${p(m)}:${p(s)}`;
};
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// MM:SS — for the pomodoro countdown.
const mmss = (sec: number) => {
	const s = Math.max(0, Math.round(sec));
	return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// ---- Pomodoro timer --------------------------------------------------------
// The bottom progress bar is one pomodoro: 0–100% over a focus block, then a
// break, repeating. Every few focus sessions the short break becomes a long one.
const FOCUS_SEC = 15; // dummy: 15 min focus + 5 min break
const BREAK_SEC = 5;
const LONG_BREAK_SEC = 15;
const SESSIONS_BEFORE_LONG = 4;
const SESSION_TARGET = 8;

let running = $state(true);
let phase = $state<"focus" | "break">("focus");
let pomoElapsed = $state(0); // seconds into the current phase
let sessionsDone = $state(0);
// Bar positions (%) where a focus session actually completed on the active task.
let pomoHistory = $state<number[]>([]);

const onBreak = $derived(phase === "break");
const phaseLength = $derived(
	phase === "focus"
		? FOCUS_SEC
		: sessionsDone % SESSIONS_BEFORE_LONG === 0
			? LONG_BREAK_SEC
			: BREAK_SEC,
);
const pomoRemaining = $derived(Math.max(0, phaseLength - pomoElapsed));

// Advance once a second while a task is actively running (paused = frozen).
$effect(() => {
	const id = setInterval(() => {
		if (!running || !activeTask) return;
		if (pomoElapsed + 1 >= phaseLength) {
			if (phase === "focus") {
				sessionsDone += 1;
				if (activeTask) {
					const dur = activeTask.end! - activeTask.start!;
					pomoHistory.push(clamp01((nowHour - activeTask.start!) / dur) * 100);
				}
				phase = "break";
			} else {
				phase = "focus";
			}
			pomoElapsed = 0;
		} else {
			pomoElapsed += 1;
		}
	}, 1000);
	return () => clearInterval(id);
});

function togglePause() {
	running = !running;
}

// Promote a task to active. Only one task runs at a time, so any current active
// task drops back to upcoming. Starting resets the pomodoro to a fresh focus block.
function startTask(task: Task) {
	for (const t of tasks) if (t.state === "active") t.state = "upcoming";
	// Starting reschedules the task to begin now, keeping its planned duration,
	// so the timeline and readouts line up with when it actually started.
	const dur = task.start !== null && task.end !== null ? task.end - task.start : 1;
	task.start = nowHour;
	task.end = Math.min(DAY_END, nowHour + dur);
	task.state = "active";
	running = true;
	phase = "focus";
	pomoElapsed = 0;
	pomoHistory = [];
	reschedTask = null;
	pinned = null;
}

function completeActive() {
	const a = tasks.find((t) => t.state === "active");
	if (a) a.state = "done";
}

// Hold-to-confirm: the action only fires after the pointer is held down for the
// full duration, with a sweeping fill as feedback. Releasing early cancels.
function hold(node: HTMLElement, params: { onhold: () => void; duration?: number }) {
	let onhold = params.onhold;
	const duration = params.duration ?? 600;

	const fill = document.createElement("span");
	fill.style.cssText =
		"position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.3);pointer-events:none;border-radius:inherit;";
	node.style.position = "relative";
	node.style.overflow = "hidden";
	node.appendChild(fill);

	let raf = 0;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let startedAt = 0;

	function tick(t: number) {
		const p = Math.min(1, (t - startedAt) / duration);
		fill.style.width = `${p * 100}%`;
		if (p < 1) raf = requestAnimationFrame(tick);
	}
	function down(e: PointerEvent) {
		e.preventDefault();
		startedAt = performance.now();
		raf = requestAnimationFrame(tick);
		timer = setTimeout(() => {
			cancel();
			onhold();
		}, duration);
	}
	function cancel() {
		if (timer) clearTimeout(timer);
		timer = null;
		cancelAnimationFrame(raf);
		fill.style.width = "0";
	}

	node.addEventListener("pointerdown", down);
	node.addEventListener("pointerup", cancel);
	node.addEventListener("pointerleave", cancel);
	node.addEventListener("pointercancel", cancel);

	return {
		update(p: { onhold: () => void; duration?: number }) {
			onhold = p.onhold;
		},
		destroy() {
			cancel();
			node.removeEventListener("pointerdown", down);
			node.removeEventListener("pointerup", cancel);
			node.removeEventListener("pointerleave", cancel);
			node.removeEventListener("pointercancel", cancel);
			fill.remove();
		},
	};
}

// ---- Active-task readouts --------------------------------------------------
// The hero shows the active task; if nothing is running, it previews the next
// upcoming one (muted, labelled UP NEXT) so the stage is never empty.
const nextUpcoming = $derived(
	scheduled.find((t) => t.state === "upcoming") ?? null,
);
const heroTask = $derived(activeTask ?? nextUpcoming);
const heroIsUpcoming = $derived(activeTask === null && nextUpcoming !== null);
const heroLabel = $derived(
	activeTask ? "IN PROGRESS" : heroIsUpcoming ? "UP NEXT" : "NO TASKS",
);
const heroTime = $derived(
	heroTask ? `${hhmm(heroTask.start!)} → ${hhmm(heroTask.end!)}` : "—",
);
const elapsedH = $derived(
	activeTask ? Math.max(0, nowHour - activeTask.start!) : 0,
);
// The amount bar reflects how far through the active task's window we are.
const heroProgress = $derived(
	activeTask
		? clamp01(
				(nowHour - activeTask.start!) / (activeTask.end! - activeTask.start!),
			)
		: 0,
);
const elapsedPct = $derived(Math.round(heroProgress * 100));
const heroPctExact = $derived(heroProgress * 100); // unrounded, for smooth bar width

// Predicted pomodoro points: project focus-session completions from now to the
// end of the task's window, assuming the timer keeps running (continues the
// current cycle if active, else a fresh focus block from now).
const pomoForecast = $derived.by(() => {
	if (!heroTask) return [];
	const startH = heroTask.start!;
	const endH = heroTask.end!;
	const dur = endH - startH;
	if (dur <= 0) return [];
	const F = FOCUS_SEC / 3600;
	const B = BREAK_SEC / 3600;
	const L = LONG_BREAK_SEC / 3600;

	const marks: number[] = [];
	let cursor = nowHour;
	let ph: "focus" | "break" = activeTask ? phase : "focus";
	let sess = activeTask ? sessionsDone : 0;
	let leftInPhase = activeTask ? pomoRemaining / 3600 : F;

	for (let guard = 0; guard < 128; guard++) {
		cursor += leftInPhase;
		if (cursor >= endH) break;
		if (ph === "focus") {
			marks.push(((cursor - startH) / dur) * 100); // a pomodoro completes here
			sess += 1;
			ph = "break";
			leftInPhase = sess % SESSIONS_BEFORE_LONG === 0 ? L : B;
		} else {
			ph = "focus";
			leftInPhase = F;
		}
	}
	return marks;
});

const taskStats = $derived([
	{ key: "ELAPSED", value: hms(elapsedH) },
	{ key: "EST. FINISH", value: activeTask ? hhmm(activeTask.end!) : "—" },
	{ key: "SESSION", value: `${sessionsDone} / ${SESSION_TARGET}` },
]);

const doneCount = $derived(scheduled.filter((t) => t.state === "done").length);
const focusH = $derived(
	scheduled
		.filter((t) => t.state === "done")
		.reduce((sum, t) => sum + (t.end - t.start), 0),
);
const dayStats = $derived([
	{ key: "DONE", value: `${doneCount} / ${scheduled.length}` },
	{ key: "FOCUS", value: hhmm(focusH) },
	{ key: "STATUS", value: "ON TRACK", accent: true },
]);

// ---- Detail overlay --------------------------------------------------------
let pinned = $state<Task | null>(null);
let hoveredId = $state<string | null>(null);

const hoveredTask = $derived(
	hoveredId !== null ? (tasks.find((t) => t.id === hoveredId) ?? null) : null,
);
// A hovered backlog task previews on top; otherwise the last clicked task stays.
const selectedCard = $derived(hoveredTask ?? pinned);

// ---- Edit (modal) ----------------------------------------------------------
let editing = $state<Task | null>(null);
let editTitle = $state("");
let editDescription = $state("");

function openEdit(task: Task) {
	editing = task;
	editTitle = task.title;
	editDescription = task.description;
}
function saveEdit() {
	if (!editing) return;
	editing.title = editTitle.trim() || editing.title;
	editing.description = editDescription.trim();
	editing = null;
}

// ---- Reschedule (popover) --------------------------------------------------
let reschedTask = $state<Task | null>(null);
let reStart = $state("09:00");
let reEnd = $state("10:00");

const toHHMM = (h: number | null, fallback: string) => {
	if (h === null) return fallback;
	const m = Math.round(h * 60);
	return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const fromHHMM = (s: string) => {
	const [h, m] = s.split(":").map(Number);
	return h + (m || 0) / 60;
};

function openReschedule(task: Task) {
	reschedTask = reschedTask === task ? null : task;
	if (reschedTask) {
		reStart = toHHMM(task.start, "09:00");
		reEnd = toHHMM(task.end, "10:00");
	}
}
function applyReschedule() {
	if (!reschedTask) return;
	const s = fromHHMM(reStart);
	const e = fromHHMM(reEnd);
	if (e > s) {
		reschedTask.start = s;
		reschedTask.end = e;
		if (reschedTask.state === "backlog") reschedTask.state = "upcoming";
	}
	reschedTask = null;
}
function unschedule(task: Task) {
	task.start = null;
	task.end = null;
	task.state = "backlog";
	reschedTask = null;
	pinned = null;
}
// Do Now == Start: both reschedule the task to begin now and run it.
function doNow(task: Task) {
	startTask(task);
}

// Throttle backlog hover so sweeping the cursor across the list doesn't thrash
// the overlay. The latest target wins after the cooldown.
const HOVER_THROTTLE = 120;
let lastHoverAt = 0;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

function hoverTask(id: string | null) {
	if (hoverTimer) {
		clearTimeout(hoverTimer);
		hoverTimer = null;
	}
	const now = Date.now();
	const wait = HOVER_THROTTLE - (now - lastHoverAt);
	if (wait <= 0) {
		lastHoverAt = now;
		hoveredId = id;
	} else {
		hoverTimer = setTimeout(() => {
			lastHoverAt = Date.now();
			hoveredId = id;
			hoverTimer = null;
		}, wait);
	}
}

// ---- New task --------------------------------------------------------------
let newTaskTitle = $state("");

function makeId() {
	return `TASK-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
}

function addTask() {
	const title = newTaskTitle.trim();
	if (!title) return;
	tasks.push({
		id: makeId(),
		title,
		description: "",
		todos: [],
		start: null,
		end: null,
		state: "backlog",
	});
	newTaskTitle = "";
}

const brandLabels = ["LOGOS", "Rotax", "Velt", "Zestium"];
</script>

<div class="w-dvw h-dvh bg-[#F7F5F1] text-[#0E0E0C] grid overflow-hidden" style="grid-template-rows: 4.5rem 1fr 12rem;">

  <!-- Row 1: New task input -->
  <div class="flex items-center gap-4 px-8 border-b border-[#DCDAD3]">
    <span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0">New&nbsp;Task</span>
    <span class="text-[#C2C0B8] shrink-0">＋</span>
    <input
      type="text"
      bind:value={newTaskTitle}
      onkeydown={(e) => e.key === "Enter" && addTask()}
      placeholder="What needs to be done?"
      class="flex-1 min-w-0 bg-transparent border-0 outline-none
             text-[clamp(16px,1.8vw,24px)] tracking-[-0.01em] text-[#0E0E0C]
             placeholder:text-[#C2C0B8] placeholder:font-normal"
      style="font-family: var(--font-display);" />
    <button onclick={addTask} disabled={!newTaskTitle.trim()}
      class="shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-9 rounded-full
             bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors
             disabled:opacity-30 disabled:hover:bg-[#F1531F]">
      Add ↵
    </button>
  </div>

  <!-- Row 2: Hero Task -->
  <div class="grid px-8 border-b border-[#DCDAD3]" style="grid-template-columns: 1fr auto; grid-template-rows: 5fr auto auto 3fr auto;">

    <!-- R1C1: Day Timeline (fills the ceiling zone) -->
    <div class="col-start-1 row-start-1 flex flex-col justify-start pt-4 pb-6 pr-8">
      <!-- header -->
      <div class="flex items-baseline gap-3 mb-4">
        <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2]">Today</span>
        <span class="font-mono text-[9px] tracking-[0.08em] uppercase text-[#6E6E69] tabular-nums">{dateLabel}</span>
      </div>

      <!-- timeline body -->
      <div class="relative h-12">
        <!-- baseline -->
        <div class="absolute left-0 right-0 h-px bg-[#DCDAD3]" style="top: 12px"></div>

        <!-- hour ticks (mark on the baseline, label at the bottom) -->
        {#each HOUR_TICKS as h}
          <span class="absolute w-px h-1.5 bg-[#D2D0C8] -translate-x-1/2" style="left: {pct(h)}%; top: 9px"></span>
          <span class="absolute -translate-x-1/2 font-mono text-[8.5px] tracking-[0.06em] text-[#C7C5BE] tabular-nums" style="left: {pct(h)}%; top: 38px">{fmtHour(h)}</span>
        {/each}

        <!-- task spans stacked into up to 3 lanes -->
        {#each laidSpans as { span, lane, overlap, underActive } (span.id)}
          <button type="button" onclick={() => (pinned = span)}
            title="{span.title}  ·  {fmtHour(span.start)}:00 → {fmtHour(span.end)}:00"
            class="group absolute h-[5px] rounded-full cursor-pointer transition-opacity hover:opacity-80"
            class:bg-[#A8A8A2]={span.state === "done"}
            class:bg-[#F1531F]={span.state === "active"}
            class:bg-[#C2C0B8]={span.state === "upcoming"}
            style="left: {pct(span.start)}%; width: {pct(span.end) - pct(span.start)}%; top: {laneTop(lane)}px">
            {#if span.state === "active"}
              <span class="absolute bottom-full left-0 mb-1 whitespace-nowrap font-mono text-[8.5px] tracking-[0.08em] uppercase text-[#F1531F]">
                {span.id} · {span.title}
              </span>
            {:else if !underActive}
              <span class="absolute bottom-full left-0 mb-1 whitespace-nowrap font-mono text-[8.5px] tracking-[0.06em] uppercase text-[#A8A8A2] opacity-0 group-hover:opacity-100 transition-opacity">
                {overlap > 1 ? `×${overlap}` : span.title}
              </span>
            {/if}
          </button>
        {/each}

        <!-- NOW marker: orange while on the active task, grey in the gaps -->
        {#if nowOnAxis}
          <div class="absolute w-px -translate-x-1/2 pointer-events-none transition-colors"
            class:bg-[#F1531F]={onActiveTask} class:bg-[#A8A8A2]={!onActiveTask}
            style="left: {pct(nowHour)}%; top: 6px; height: 30px">
            <span class="absolute top-[2.5px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full bg-[#F7F5F1] ring-2 transition-colors"
              class:ring-[#F1531F]={onActiveTask} class:ring-[#A8A8A2]={!onActiveTask}></span>
            <span class="absolute top-[38px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8.5px] tracking-[0.08em] uppercase tabular-nums transition-colors"
              class:text-[#F1531F]={onActiveTask} class:text-[#A8A8A2]={!onActiveTask}>Now {hhmm(nowHour)}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- R2C1: HAVE A NEXT label (bottom-aligned to the divider) -->
    <div class="col-start-1 row-start-2 flex items-end">
      <p class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[#6E6E69] mb-2">
        {heroLabel} &nbsp;&nbsp; {heroTime}
      </p>
    </div>

    <!-- R1C2: Brand labels (pinned to the top) -->
    <div class="col-start-2 row-start-1 flex flex-col items-end justify-start gap-0.5 pt-6 pl-8">
      {#each brandLabels as label}
        <span class="font-mono text-[10.5px] tracking-[0.08em] text-[#6E6E69]">[{label}]</span>
      {/each}
    </div>

    <!-- R3C1: Title + description -->
    <div class="col-start-1 row-start-3 flex flex-col justify-start">
      <div class="w-[55%] h-px bg-[#DCDAD3] mb-2"></div>
      <!-- grid-overlap so the outgoing and incoming task share one cell and
           cross-animate: old slides up + fades, new fades in from below. -->
      <div class="grid overflow-hidden">
        {#key heroTask?.id}
          <div class="col-start-1 row-start-1"
            in:fly={{ y: 28, duration: 320, easing: cubicOut }}
            out:fly={{ y: -28, duration: 240, easing: cubicOut }}>
            <h1 class="font-bold text-[clamp(48px,6vw,96px)] tracking-[-0.03em] leading-[0.95] mb-4 transition-colors"
              class:text-[#0E0E0C]={!heroIsUpcoming} class:text-[#B0AEA7]={heroIsUpcoming}
              style="font-family: var(--font-display);">
              {heroTask?.title ?? "No tasks scheduled"}
            </h1>
            <div class="text-[14px] leading-[1.55] transition-colors"
              class:text-[#3A3A37]={!heroIsUpcoming} class:text-[#B0AEA7]={heroIsUpcoming}>
              <p class="m-0">{heroTask?.description ?? ""}</p>
              {#each heroTask?.todos ?? [] as todo}
                <p class="m-0">- {todo}</p>
              {/each}
            </div>
          </div>
        {/key}
      </div>
    </div>

    <!-- R3C2: hairline (top, aligned with HAVE A NEXT bottom) + Task intelligence -->
    <div class="col-start-2 row-start-3 flex flex-col gap-4 pl-8 w-[220px]">
      <div class="w-full h-px bg-[#DCDAD3]"></div>

      <!-- Hero metric: the pomodoro timer (focal point, phase-coloured accent) -->
      <div class="flex flex-col border-l-2 pl-4 -ml-px transition-colors"
        class:border-[#F1531F]={activeTask && !onBreak}
        class:border-[#2E6F4E]={activeTask && onBreak}
        class:border-[#DCDAD3]={!activeTask}>
        <span class="self-start inline-flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] uppercase px-2.5 h-[24px] rounded-full mb-2.5 transition-colors"
          class:bg-[#F1531F]={activeTask && !onBreak} class:text-white={!!activeTask}
          class:bg-[#2E6F4E]={activeTask && onBreak}
          class:bg-transparent={!activeTask} class:text-[#A8A8A2]={!activeTask}
          class:ring-1={!activeTask} class:ring-[#DCDAD3]={!activeTask}>
          {#if activeTask}
            <span class="w-1.5 h-1.5 rounded-full bg-white" class:animate-pulse={running}></span>
            {onBreak ? "Break" : "Focus"}
          {:else}
            Ready
          {/if}
        </span>
        <span class="font-mono text-[54px] leading-[0.85] tracking-[-0.03em] tabular-nums transition-colors"
          class:text-[#0E0E0C]={activeTask && !onBreak} class:text-[#2E6F4E]={activeTask && onBreak}
          class:text-[#C2C0B8]={!activeTask}>{activeTask ? mmss(pomoRemaining) : "--:--"}</span>
      </div>

      <!-- Task stats -->
      <div class="flex flex-col gap-1 pt-1 border-t border-[#EDEBE4]">
        {#each taskStats as row}
          <div class="flex justify-between gap-2">
            <span class="font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">{row.key}</span>
            <span class="font-mono text-[9px] tracking-[0.04em] tabular-nums text-[#3A3A37]">{row.value}</span>
          </div>
        {/each}
      </div>

      <!-- Today stats -->
      <div class="flex flex-col gap-1 pt-2 border-t border-[#EDEBE4]">
        <span class="font-mono text-[8.5px] tracking-[0.12em] uppercase text-[#C7C5BE] mb-0.5">Today</span>
        {#each dayStats as row}
          <div class="flex justify-between gap-2">
            <span class="font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">{row.key}</span>
            <span class="font-mono text-[9px] tracking-[0.04em] tabular-nums {row.accent ? 'text-[#2E6F4E]' : 'text-[#3A3A37]'}">{row.value}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- R5: Progress bar + controls -->
    <div class="col-span-2 row-start-5 flex items-center gap-6 pb-6">

      <!-- elapsed % -->
      <span class="font-mono text-[10px] tracking-[0.08em] text-[#A8A8A2] tabular-nums shrink-0">
        {String(elapsedPct).padStart(3, "0")}%
      </span>

      <!-- track -->
      <div class="relative flex-1 h-[6px] rounded-full bg-[#E6E4DD] overflow-hidden">
        <!-- fill -->
        <div class="absolute left-0 top-0 h-full rounded-full bg-[#F1531F] transition-[width] duration-200 ease-linear"
          class:opacity-40={!running} style="width: {heroPctExact}%"></div>
        <!-- pomodoro points: predicted (hollow) on the track, recorded (solid) over the fill -->
        <div class="absolute inset-0 pointer-events-none">
          {#each pomoForecast as m}
            <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-white/50" style="left: {m}%"></div>
          {/each}
          {#each pomoHistory as m}
            <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-white" style="left: {m}%"></div>
          {/each}
        </div>
        <!-- moving head -->
        {#if running && activeTask}
          <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-[#F1531F] ring-2 ring-[#F7F5F1]"
            style="left: {heroPctExact}%"></div>
        {/if}
      </div>

      <!-- controls -->
      <div class="flex items-center gap-2 shrink-0">
        {#if activeTask}
          <button onclick={togglePause}
            class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
                   px-3 h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37]
                   hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">
            {#if running}
              <span class="text-[8px]">❚❚</span> Pause
            {:else}
              <span class="text-[9px]">▶</span> Resume
            {/if}
          </button>
          <button use:hold={{ onhold: completeActive }}
            class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
                   px-3 h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors select-none touch-none">
            <span class="text-[10px]">✓</span> Hold to Complete
          </button>
        {:else if heroTask}
          <button use:hold={{ onhold: () => heroTask && startTask(heroTask) }}
            class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
                   px-4 h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors select-none touch-none">
            <span class="text-[9px]">▶</span> Hold to Start
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Row 3: Bottom -->
  <div class="grid" style="grid-template-columns: 280px 1fr;">

    <!-- Task Pool -->
    <div class="flex items-start gap-4 px-6 py-6 border-r border-[#DCDAD3] min-h-0 overflow-hidden">
      <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0"
        style="writing-mode: vertical-lr; transform: rotate(180deg);">TASK POOL</span>
      <div class="no-scrollbar flex flex-col gap-1 flex-1 min-w-0 h-full overflow-y-auto pr-1">
        {#each backlog as task}
          <div
            onmouseenter={() => hoverTask(task.id)}
            onmouseleave={() => hoverTask(null)}
            onclick={() => { pinned = task; hoverTask(null); }}
            class="group flex items-center py-0.5 cursor-pointer"
            role="presentation">
            <span class="text-[14px] italic text-[#3A3A37] truncate group-hover:text-[#0E0E0C] transition-colors">- {task.title}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Trajectory -->
    <div class="relative flex items-stretch gap-6 px-8 py-5 min-w-0">
      <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0 self-end"
        style="writing-mode: vertical-rl; transform: rotate(180deg);">TRAJECTORY</span>
      <div class="flex flex-col min-w-0 flex-1 h-full gap-7">
        <!-- Top: upcoming -->
        <div class="flex-1 min-h-0 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#F1531F]">Upcoming</span>
            <span class="flex-1 h-px bg-[#EDEBE4]"></span>
          </div>
          <div class="no-scrollbar flex overflow-x-auto overflow-y-hidden gap-0 min-w-0">
            {#each trajectoryUpcoming as card, i}
              <button type="button" onclick={() => (pinned = card)}
                class="shrink-0 w-48 px-5 text-left cursor-pointer transition-opacity hover:opacity-60"
                class:border-l={i > 0} class:border-[#DCDAD3]={i > 0} class:pl-5={i > 0} class:pl-0={i === 0}>
                <span class="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] uppercase mb-0.5"
                  class:text-[#F1531F]={card.state === "active"} class:text-[#A8A8A2]={card.state !== "active"}>
                  {#if card.state === "active"}
                    <span class="w-1.5 h-1.5 rounded-full bg-[#F1531F] animate-pulse"></span>Now
                  {:else}
                    {card.id}
                  {/if}
                </span>
                <h2 class="text-[18px] font-semibold tracking-[-0.01em] m-0 truncate"
                  class:text-[#F1531F]={card.state === "active"} class:text-[#0E0E0C]={card.state !== "active"}
                  style="font-family: var(--font-display);">{card.title}</h2>
              </button>
            {/each}
          </div>
        </div>

        <!-- Bottom: past -->
        <div class="flex-1 min-h-0 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2]">Past</span>
            <span class="flex-1 h-px bg-[#EDEBE4]"></span>
          </div>
          <div class="no-scrollbar flex overflow-x-auto overflow-y-hidden gap-0 min-w-0">
            {#each trajectoryPast as card, i}
              <button type="button" onclick={() => (pinned = card)}
                class="shrink-0 w-48 px-5 text-left cursor-pointer transition-opacity hover:opacity-60 opacity-50"
                class:border-l={i > 0} class:border-[#DCDAD3]={i > 0} class:pl-5={i > 0} class:pl-0={i === 0}>
                <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-0.5">{card.id}</span>
                <h2 class="text-[18px] font-semibold tracking-[-0.01em] text-[#0E0E0C] m-0 truncate"
                  class:line-through={card.state === "done"} class:decoration-[#C2C0B8]={card.state === "done"}
                  style="font-family: var(--font-display);">{card.title}</h2>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Detail overlay -->
      {#if selectedCard}
        <div class="absolute inset-0 z-20 flex items-stretch bg-[#F7F5F1]/92 backdrop-blur-xl"
          transition:fade={{ duration: 180 }}
          onclick={() => { pinned = null; hoveredId = null; }} role="presentation">
          <div class="relative flex-1 min-h-0 flex flex-col px-12 py-5"
            in:fly={{ y: 16, duration: 280, easing: cubicOut }}
            onclick={(e) => e.stopPropagation()} role="presentation">

            <!-- close -->
            <button type="button" onclick={() => { pinned = null; hoveredId = null; }}
              class="absolute top-5 right-8 font-mono text-[11px] tracking-[0.08em] uppercase text-[#A8A8A2] hover:text-[#0E0E0C] transition-colors">✕ Close</button>

            <!-- body: left = id/title/controls, right = description -->
            <div class="flex flex-1 min-h-0 gap-12">

              <!-- left column -->
              <div class="flex flex-col min-w-0 w-[44%] shrink-0">
                <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-1">{selectedCard.id}</span>
                <h2 class="text-[28px] font-semibold tracking-[-0.02em] text-[#0E0E0C] m-0 mb-4 truncate"
                  style="font-family: var(--font-display);">{selectedCard.title}</h2>

                <!-- controls under title -->
                <div class="flex flex-wrap items-center gap-2">
                  <button use:hold={{ onhold: () => selectedCard && startTask(selectedCard) }}
                    class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors select-none touch-none">
                    <span class="text-[9px]">▶</span> Hold to Start
                  </button>
                  <button onclick={() => selectedCard && openEdit(selectedCard)}
                    class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Edit</button>

                  <!-- Reschedule + popover -->
                  <div class="relative">
                    <button onclick={() => selectedCard && openReschedule(selectedCard)}
                      class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border transition-colors"
                      class:border-[#0E0E0C]={reschedTask === selectedCard}
                      class:text-[#0E0E0C]={reschedTask === selectedCard}
                      class:border-[#C2C0B8]={reschedTask !== selectedCard}
                      class:text-[#3A3A37]={reschedTask !== selectedCard}>Reschedule</button>

                    {#if reschedTask && reschedTask === selectedCard}
                      <div class="absolute left-0 bottom-[calc(100%+8px)] z-40 w-60 p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCDAD3] shadow-[0_8px_24px_rgba(14,14,12,.10)]"
                        transition:fly={{ y: 6, duration: 160, easing: cubicOut }}>
                        <div class="flex items-center gap-3 mb-3">
                          <label class="flex flex-col gap-1 flex-1">
                            <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2]">Start</span>
                            <input type="time" step="900" bind:value={reStart}
                              class="font-mono text-[13px] tabular-nums bg-transparent border-b border-[#DCDAD3] focus:border-[#F1531F] outline-none pb-0.5" />
                          </label>
                          <label class="flex flex-col gap-1 flex-1">
                            <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2]">End</span>
                            <input type="time" step="900" bind:value={reEnd}
                              class="font-mono text-[13px] tabular-nums bg-transparent border-b border-[#DCDAD3] focus:border-[#F1531F] outline-none pb-0.5" />
                          </label>
                        </div>
                        <button onclick={applyReschedule}
                          class="w-full font-mono text-[10px] tracking-[0.08em] uppercase h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors mb-2">Apply</button>
                        <div class="flex gap-2">
                          <button onclick={() => reschedTask && doNow(reschedTask)}
                            class="flex-1 font-mono text-[10px] tracking-[0.08em] uppercase h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Do Now</button>
                          <button onclick={() => reschedTask && unschedule(reschedTask)}
                            class="flex-1 font-mono text-[10px] tracking-[0.08em] uppercase h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Unschedule</button>
                        </div>
                      </div>
                    {/if}
                  </div>

                  <button class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border border-[#E0BBB2] text-[#C2331B] hover:bg-[#C2331B] hover:text-white hover:border-[#C2331B] transition-colors">Delete</button>
                </div>
              </div>

              <!-- right column: description -->
              <div class="no-scrollbar flex-1 min-w-0 min-h-0 overflow-y-auto border-l border-[#DCDAD3] pl-12 text-[13px] leading-[1.6] text-[#3A3A37]">
                <p class="m-0 mb-1 font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">Description</p>
                <p class="m-0">{selectedCard.description}</p>
                {#if selectedCard.todos.length}
                  <p class="m-0 mt-4 mb-1 font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">Subtasks</p>
                  {#each selectedCard.todos as todo}
                    <p class="m-0">- {todo}</p>
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

  </div>
</div>

<!-- Edit modal (top layer) -->
{#if editing}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E0C]/20 backdrop-blur-sm px-6"
    transition:fade={{ duration: 160 }}
    onclick={() => (editing = null)} role="presentation">
    <div class="w-full max-w-lg p-8 rounded-2xl bg-[#FFFFFF] border border-[#DCDAD3] shadow-[0_8px_32px_rgba(14,14,12,.16)]"
      in:fly={{ y: 16, duration: 240, easing: cubicOut }}
      onclick={(e) => e.stopPropagation()} role="presentation">
      <div class="flex items-center justify-between mb-6">
        <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2]">Edit Task · {editing.id}</span>
        <button onclick={() => (editing = null)}
          class="font-mono text-[10px] tracking-[0.08em] uppercase text-[#A8A8A2] hover:text-[#0E0E0C] transition-colors">✕ Close</button>
      </div>

      <label class="block mb-5">
        <span class="block font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2] mb-1.5">Title</span>
        <input bind:value={editTitle}
          class="w-full bg-transparent border-b border-[#DCDAD3] focus:border-[#F1531F] outline-none pb-1 text-[22px] tracking-[-0.01em] text-[#0E0E0C]"
          style="font-family: var(--font-display);" />
      </label>

      <label class="block mb-7">
        <span class="block font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2] mb-1.5">Description</span>
        <textarea bind:value={editDescription} rows="4"
          class="w-full resize-none bg-transparent border border-[#DCDAD3] rounded-lg focus:border-[#F1531F] outline-none p-3 text-[13px] leading-[1.55] text-[#3A3A37]"></textarea>
      </label>

      <div class="flex justify-end gap-2">
        <button onclick={() => (editing = null)}
          class="font-mono text-[10px] tracking-[0.08em] uppercase px-5 h-9 rounded-full text-[#3A3A37] hover:text-[#0E0E0C] transition-colors">Cancel</button>
        <button onclick={saveEdit}
          class="font-mono text-[10px] tracking-[0.08em] uppercase px-5 h-9 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors">Save</button>
      </div>
    </div>
  </div>
{/if}

<svelte:window onkeydown={(e) => { if (e.key === "Escape") { editing = null; reschedTask = null; } }} />

<style>
  /* Hide scrollbars while keeping scroll behaviour. */
  .no-scrollbar {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* legacy Edge/IE */
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none; /* WebKit */
  }
</style>
