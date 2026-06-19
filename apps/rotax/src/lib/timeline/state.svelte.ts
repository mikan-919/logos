import { seedTasks, type Task } from "$lib/dashboard/seed";
import { hhmm } from "$lib/dashboard/format";

export const HOUR_START = 7;
export const HOUR_END = 24;
export const HOUR_PX = 80;

class TimelineState {
	tasks = $state<Task[]>(seedTasks());
	now = $state(new Date());
	running = $state(false);
	pomoElapsed = $state(0);
	pomoTotal = $state(25 * 60);
	paused = $state(false);
	ignited = $state<Task | null>(null);
	calOpen = $state(false);
	// The cursor — which task the user has selected/is looking at.
	// Persists across columns; the center always renders this task.
	selectedId = $state<string | null>(null);

	#clockInterval: ReturnType<typeof setInterval> | null = null;
	#pomoInterval: ReturnType<typeof setInterval> | null = null;

	scheduled = $derived(
		this.tasks
			.filter((t): t is Task & { start: number; end: number } =>
				t.start !== null && t.end !== null,
			)
			.sort((a, b) => a.start - b.start),
	);

	backlog = $derived(this.tasks.filter((t) => t.state === "backlog"));

	activeTask = $derived(this.tasks.find((t) => t.state === "active") ?? null);

	nextUpcoming = $derived(
		this.scheduled.find((t) => t.state === "upcoming") ?? null,
	);

	// Default cursor target when nothing is explicitly selected
	defaultTask = $derived(this.activeTask ?? this.nextUpcoming);

	// The task the cursor is on — explicit selection > default
	selected = $derived(
		this.selectedId
			? (this.tasks.find((t) => t.id === this.selectedId) ?? this.defaultTask)
			: this.defaultTask,
	);

	// Center column: when timer running show ignited, otherwise show cursor
	heroTask = $derived(this.ignited ?? this.selected);

	select = (task: Task) => {
		this.selectedId = task.id;
	};

	nowHour = $derived(
		this.now.getHours() +
			this.now.getMinutes() / 60 +
			this.now.getSeconds() / 3600,
	);

	nowTopPx = $derived((this.nowHour - HOUR_START) * HOUR_PX);

	dateLabel = $derived(
		this.now.toLocaleDateString("ja-JP", {
			month: "long",
			day: "numeric",
			weekday: "short",
		}),
	);

	pomoRemaining = $derived(Math.max(0, this.pomoTotal - this.pomoElapsed));

	pomoProgress = $derived(
		this.pomoTotal > 0 ? this.pomoElapsed / this.pomoTotal : 0,
	);

	pomoDisplay = $derived.by(() => {
		const r = this.pomoRemaining;
		const m = Math.floor(r / 60);
		const s = r % 60;
		return `${m}:${String(s).padStart(2, "0")}`;
	});

	ignite = (task: Task) => {
		// Un-ignite if same task
		if (this.ignited?.id === task.id) {
			this.collapse(false);
			return;
		}
		if (this.ignited) this.collapse(false);
		this.ignited = task;
		this.pomoElapsed = 0;
		this.pomoTotal =
			task.start !== null && task.end !== null
				? Math.round((task.end - task.start) * 60) * 60
				: 25 * 60;
		this.paused = false;
		this.running = true;
		task.state = "active";
	};

	collapse = (completed: boolean) => {
		if (!this.ignited) return;
		if (completed) {
			this.ignited.state = "done";
		} else {
			if (this.ignited.state === "active") this.ignited.state = "upcoming";
		}
		this.ignited = null;
		this.running = false;
		this.paused = false;
		this.pomoElapsed = 0;
	};

	togglePause = () => {
		this.paused = !this.paused;
	};

	startClocks = () => {
		this.#clockInterval = setInterval(() => {
			this.now = new Date();
		}, 1000);
		this.#pomoInterval = setInterval(() => {
			if (!this.running || this.paused || !this.ignited) return;
			if (this.pomoElapsed >= this.pomoTotal) {
				this.collapse(true);
				return;
			}
			this.pomoElapsed += 1;
		}, 1000);
		return () => {
			clearInterval(this.#clockInterval!);
			clearInterval(this.#pomoInterval!);
		};
	};
}

export const tl = new TimelineState();
