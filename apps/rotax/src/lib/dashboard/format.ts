import type { Task } from "./seed";
export const DAY_START = 6;
export const DAY_END = 24;
export const MAX_LANES = 3;

export const HOUR_TICKS = [6, 9, 12, 15, 18, 21, 24];
export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const MONTHS = [
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

export const FOCUS_SEC = 15; // dummy: 15 min focus + 5 min break
export const BREAK_SEC = 5;
export const LONG_BREAK_SEC = 15;
export const SESSIONS_BEFORE_LONG = 4;
export const SESSION_TARGET = 8;

export const pct = (h: number) => ((h - DAY_START) / (DAY_END - DAY_START)) * 100;
// Vertical pixel position of a lane (0 = centred on the baseline, stacking down).
export const laneTop = (lane: number) => 9.5 + lane * 8;
export const fmtHour = (h: number) => String(Math.floor(h)).padStart(2, "0");
export const hhmm = (h: number) =>
	`${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h - Math.floor(h)) * 60)).padStart(2, "0")}`;
// HH:MM:SS — for the live readouts that should visibly tick every second.
export const hms = (h: number) => {
	const total = Math.max(0, Math.round(h * 3600));
	const s = total % 60;
	const m = Math.floor(total / 60) % 60;
	const hr = Math.floor(total / 3600);
	const p = (n: number) => String(n).padStart(2, "0");
	return `${p(hr)}:${p(m)}:${p(s)}`;
};
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
// MM:SS — for the pomodoro countdown.
export const mmss = (sec: number) => {
	const s = Math.max(0, Math.round(sec));
	return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const toHHMM = (h: number | null, fallback: string) => {
	if (h === null) return fallback;
	const m = Math.round(h * 60);
	return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
export const fromHHMM = (s: string) => {
	const [h, m] = s.split(":").map(Number);
	return h + (m || 0) / 60;
};

export type LaidSpan = {
	span: Task & { start: number; end: number };
	lane: number;
	overlap: number;
	underActive: boolean;
};

// Hold-to-confirm: the action only fires after the pointer is held down for the
// full duration, with a sweeping fill as feedback. Releasing early cancels.
export function hold(node: HTMLElement, params: { onhold: () => void; duration?: number }) {
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
