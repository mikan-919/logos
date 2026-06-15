import { seedTasks, type Task, type TaskState } from "./seed";
import {
	DAY_START,
	DAY_END,
	FOCUS_SEC,
	BREAK_SEC,
	LONG_BREAK_SEC,
	SESSIONS_BEFORE_LONG,
	SESSION_TARGET,
	WEEKDAYS,
	MONTHS,
	clamp01,
	hhmm,
	hms,
	mmss,
	toHHMM,
	fromHHMM,
	layoutLanes,
	type LaidSpan,
} from "./format";

const HOVER_THROTTLE = 120;

class DashboardState {
	tasks = $state<Task[]>(seedTasks());
	now = $state(new Date());
	running = $state(true);
	phase = $state<"focus" | "break">("focus");
	pomoElapsed = $state(0);
	sessionsDone = $state(0);
	pomoHistory = $state<number[]>([]);
	pinned = $state<Task | null>(null);
	hoveredId = $state<string | null>(null);
	editing = $state<Task | null>(null);
	editTitle = $state("");
	editDescription = $state("");
	reschedTask = $state<Task | null>(null);
	reStart = $state("09:00");
	reEnd = $state("10:00");
	newTaskTitle = $state("");
	#lastHoverAt = 0;
	#hoverTimer: ReturnType<typeof setTimeout> | null = null;

	brandLabels = ["LOGOS", "Rotax", "Velt", "Zestium"];

	// ---- Derived views ---------------------------------------------------------
	scheduled = $derived(
		this.tasks
			.filter(
				(t): t is Task & { start: number; end: number } =>
					t.start !== null && t.end !== null,
			)
			.sort((a, b) => a.start - b.start),
	);
	daySpans = $derived(this.scheduled);

	// Past lane: everything already behind us on the timeline, done or not.
	trajectoryPast = $derived(this.scheduled.filter((t) => t.end <= this.nowHour));
	// Upcoming lane also surfaces the running task, flagged for special display.
	trajectoryUpcoming = $derived(
		this.scheduled.filter((t) => t.state === "active" || t.state === "upcoming"),
	);
	backlog = $derived(this.tasks.filter((t) => t.state === "backlog"));
	activeTask = $derived(this.tasks.find((t) => t.state === "active") ?? null);

	// Lay scheduled spans into up to 3 stacked lanes (overlap = packed schedule).
	laidSpans = $derived<LaidSpan[]>(layoutLanes(this.daySpans));

	// ---- Multi-day timeline view ----------------------------------------------
	// Toggle between the today dashboard and a vertical stack of day timelines.
	view = $state<"today" | "timeline">("today");
	toggleView = () => {
		this.view = this.view === "today" ? "timeline" : "today";
	};
	backToToday = () => {
		this.view = "today";
	};

	// Synthesize a handful of day rows from the existing scheduled spans — no
	// model change, just believable filler so the timeline view has content.
	// TODAY keeps real states; other days are deterministically shifted and
	// recolored (past = done, future = upcoming).
	timelineDays = $derived.by(() => {
		const base = this.scheduled;
		// Offsets relative to today, top → bottom (today first, then "6/15"-style rows).
		const offsets = [0, -1, -2, 1, 2, 3];
		return offsets.map((off, idx) => {
			const d = new Date(this.now);
			d.setDate(d.getDate() + off);
			const label = off === 0 ? "TODAY" : `${d.getMonth() + 1}/${d.getDate()}`;
			// Pick a deterministic slice of the scheduled spans for this row and
			// shift it around so each day reads differently.
			const shift = off === 0 ? 0 : ((idx * 1.5) % 5) - 2;
			const slice = base.filter((_, i) => off === 0 || (i + idx) % 2 === 0);
			const spans = slice.map((t) => {
				const start = off === 0 ? t.start : Math.max(DAY_START, Math.min(DAY_END - 1, t.start + shift));
				const end = off === 0 ? t.end : Math.max(start + 0.5, Math.min(DAY_END, t.end + shift));
				const state: TaskState = off === 0 ? t.state : off < 0 ? "done" : "upcoming";
				return { ...t, id: `${t.id}-${off}`, start, end, state };
			});
			return { key: `day-${off}`, label, isToday: off === 0, laid: layoutLanes(spans) };
		});
	});

	// ---- Live clock ------------------------------------------------------------
	nowHour = $derived(
		this.now.getHours() + this.now.getMinutes() / 60 + this.now.getSeconds() / 3600,
	);
	nowOnAxis = $derived(this.nowHour >= DAY_START && this.nowHour <= DAY_END);

	onActiveTask = $derived(
		this.activeTask !== null &&
			this.nowHour >= this.activeTask.start! &&
			this.nowHour < this.activeTask.end!,
	);

	dateLabel = $derived(
		`${WEEKDAYS[this.now.getDay()]} ${this.now.getDate()} ${MONTHS[this.now.getMonth()]} ${this.now.getFullYear()} · JST`,
	);

	// ---- Pomodoro timer --------------------------------------------------------
	onBreak = $derived(this.phase === "break");
	phaseLength = $derived(
		this.phase === "focus"
			? FOCUS_SEC
			: this.sessionsDone % SESSIONS_BEFORE_LONG === 0
				? LONG_BREAK_SEC
				: BREAK_SEC,
	);
	pomoRemaining = $derived(Math.max(0, this.phaseLength - this.pomoElapsed));

	// ---- Active-task readouts --------------------------------------------------
	nextUpcoming = $derived(
		this.scheduled.find((t) => t.state === "upcoming") ?? null,
	);
	heroTask = $derived(this.activeTask ?? this.nextUpcoming);
	heroIsUpcoming = $derived(this.activeTask === null && this.nextUpcoming !== null);
	heroLabel = $derived(
		this.activeTask ? "IN PROGRESS" : this.heroIsUpcoming ? "UP NEXT" : "NO TASKS",
	);
	heroTime = $derived(
		this.heroTask ? `${hhmm(this.heroTask.start!)} → ${hhmm(this.heroTask.end!)}` : "—",
	);
	elapsedH = $derived(
		this.activeTask ? Math.max(0, this.nowHour - this.activeTask.start!) : 0,
	);
	heroProgress = $derived(
		this.activeTask
			? clamp01(
					(this.nowHour - this.activeTask.start!) / (this.activeTask.end! - this.activeTask.start!),
				)
			: 0,
	);
	elapsedPct = $derived(Math.round(this.heroProgress * 100));
	heroPctExact = $derived(this.heroProgress * 100);

	pomoForecast = $derived.by(() => {
		if (!this.heroTask) return [];
		const startH = this.heroTask.start!;
		const endH = this.heroTask.end!;
		const dur = endH - startH;
		if (dur <= 0) return [];
		const F = FOCUS_SEC / 3600;
		const B = BREAK_SEC / 3600;
		const L = LONG_BREAK_SEC / 3600;

		const marks: number[] = [];
		let cursor = this.nowHour;
		let ph: "focus" | "break" = this.activeTask ? this.phase : "focus";
		let sess = this.activeTask ? this.sessionsDone : 0;
		let leftInPhase = this.activeTask ? this.pomoRemaining / 3600 : F;

		for (let guard = 0; guard < 128; guard++) {
			cursor += leftInPhase;
			if (cursor >= endH) break;
			if (ph === "focus") {
				marks.push(((cursor - startH) / dur) * 100);
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

	taskStats = $derived([
		{ key: "ELAPSED", value: hms(this.elapsedH) },
		{ key: "EST. FINISH", value: this.activeTask ? hhmm(this.activeTask.end!) : "—" },
		{ key: "SESSION", value: `${this.sessionsDone} / ${SESSION_TARGET}` },
	]);

	doneCount = $derived(this.scheduled.filter((t) => t.state === "done").length);
	focusH = $derived(
		this.scheduled
			.filter((t) => t.state === "done")
			.reduce((sum, t) => sum + (t.end - t.start), 0),
	);
	dayStats = $derived([
		{ key: "DONE", value: `${this.doneCount} / ${this.scheduled.length}` },
		{ key: "FOCUS", value: hhmm(this.focusH) },
		{ key: "STATUS", value: "ON TRACK", accent: true },
	]);

	hoveredTask = $derived(
		this.hoveredId !== null ? (this.tasks.find((t) => t.id === this.hoveredId) ?? null) : null,
	);
	selectedCard = $derived(this.hoveredTask ?? this.pinned);

	// ---- Actions ---------------------------------------------------------------
	togglePause = () => { this.running = !this.running; };

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

	completeActive = () => {
		const a = this.tasks.find((t) => t.state === "active");
		if (a) a.state = "done";
	};

	openEdit = (task: Task) => {
		this.editing = task;
		this.editTitle = task.title;
		this.editDescription = task.description;
	};

	saveEdit = () => {
		if (!this.editing) return;
		this.editing.title = this.editTitle.trim() || this.editing.title;
		this.editing.description = this.editDescription.trim();
		this.editing = null;
	};

	openReschedule = (task: Task) => {
		this.reschedTask = this.reschedTask === task ? null : task;
		if (this.reschedTask) {
			this.reStart = toHHMM(task.start, "09:00");
			this.reEnd = toHHMM(task.end, "10:00");
		}
	};

	applyReschedule = () => {
		if (!this.reschedTask) return;
		const s = fromHHMM(this.reStart);
		const e = fromHHMM(this.reEnd);
		if (e > s) {
			this.reschedTask.start = s;
			this.reschedTask.end = e;
			if (this.reschedTask.state === "backlog") this.reschedTask.state = "upcoming";
		}
		this.reschedTask = null;
	};

	unschedule = (task: Task) => {
		task.start = null;
		task.end = null;
		task.state = "backlog";
		this.reschedTask = null;
		this.pinned = null;
	};

	doNow = (task: Task) => {
		this.startTask(task);
	};

	hoverTask = (id: string | null) => {
		if (this.#hoverTimer) {
			clearTimeout(this.#hoverTimer);
			this.#hoverTimer = null;
		}
		const now = Date.now();
		const wait = HOVER_THROTTLE - (now - this.#lastHoverAt);
		if (wait <= 0) {
			this.#lastHoverAt = now;
			this.hoveredId = id;
		} else {
			this.#hoverTimer = setTimeout(() => {
				this.#lastHoverAt = Date.now();
				this.hoveredId = id;
				this.#hoverTimer = null;
			}, wait);
		}
	};

	makeId = () => `TASK-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

	addTask = () => {
		const title = this.newTaskTitle.trim();
		if (!title) return;
		this.tasks.push({
			id: this.makeId(),
			title,
			description: "",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		});
		this.newTaskTitle = "";
	};

	// ---- Clock intervals -------------------------------------------------------
	// $effect cannot run at module top level. This method sets up both intervals
	// and returns a teardown function. Called from +page.svelte via $effect.
	startClocks = (): (() => void) => {
		const clock = setInterval(() => { this.now = new Date(); }, 250);
		const pomo = setInterval(() => {
			if (!this.running || !this.activeTask) return;
			if (this.pomoElapsed + 1 >= this.phaseLength) {
				if (this.phase === "focus") {
					this.sessionsDone += 1;
					if (this.activeTask) {
						const dur = this.activeTask.end! - this.activeTask.start!;
						this.pomoHistory.push(clamp01((this.nowHour - this.activeTask.start!) / dur) * 100);
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
		return () => { clearInterval(clock); clearInterval(pomo); };
	};
}

export const dashboard = new DashboardState();
