<script lang="ts">
import { tl } from "./state.svelte";

// FLIP: animate from task block's rect → expanded overlay
let { getSourceRect }: { getSourceRect: () => DOMRect | undefined } = $props();

let overlayEl: HTMLDivElement;
let appEl: HTMLElement | null = $state(null);

const C = 2 * Math.PI * 84; // ring circumference

const strokeOffset = $derived(C * (1 - tl.pomoProgress));

const pomoDuration = $derived(Math.round(tl.pomoTotal / 60));

// Animate in on mount via FLIP
$effect(() => {
	if (!tl.ignited || !overlayEl) return;

	const src = getSourceRect();
	if (!src) return;

	appEl = overlayEl.closest(".app-frame") as HTMLElement | null;
	if (!appEl) return;
	const app = appEl.getBoundingClientRect();

	// Start from source rect
	const fromTop = src.top - app.top;
	const fromLeft = src.left - app.left;
	const fromW = src.width;
	const fromH = src.height;

	overlayEl.style.transition = "none";
	overlayEl.style.top = fromTop + "px";
	overlayEl.style.left = fromLeft + "px";
	overlayEl.style.width = fromW + "px";
	overlayEl.style.height = fromH + "px";
	overlayEl.style.borderRadius = "0px";
	overlayEl.style.opacity = "0";

	// Target: expanded overlay
	const targetTop = app.height * 0.14;
	const targetH = app.height * 0.66;

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			overlayEl.style.transition =
				"top 420ms cubic-bezier(.22,.61,.36,1), left 420ms cubic-bezier(.22,.61,.36,1), width 420ms cubic-bezier(.22,.61,.36,1), height 420ms cubic-bezier(.22,.61,.36,1), border-radius 420ms cubic-bezier(.22,.61,.36,1), opacity 200ms ease";
			overlayEl.style.top = targetTop + "px";
			overlayEl.style.left = "12px";
			overlayEl.style.width = app.width - 24 + "px";
			overlayEl.style.height = targetH + "px";
			overlayEl.style.borderRadius = "0px";
			overlayEl.style.opacity = "1";
		});
	});
});

function close(completed: boolean) {
	if (!overlayEl || !appEl) { tl.collapse(completed); return; }

	const src = getSourceRect();
	const app = appEl.getBoundingClientRect();

	if (src) {
		overlayEl.style.transition =
			"top 380ms cubic-bezier(.22,.61,.36,1), left 380ms cubic-bezier(.22,.61,.36,1), width 380ms cubic-bezier(.22,.61,.36,1), height 380ms cubic-bezier(.22,.61,.36,1), opacity 200ms ease 180ms";
		overlayEl.style.top = (src.top - app.top) + "px";
		overlayEl.style.left = (src.left - app.left) + "px";
		overlayEl.style.width = src.width + "px";
		overlayEl.style.height = src.height + "px";
		overlayEl.style.opacity = "0";
	}

	setTimeout(() => tl.collapse(completed), 400);
}
</script>

{#if tl.ignited}
	<!-- Scrim -->
	<div class="absolute inset-0 bg-[var(--ink)]/20 z-20 backdrop-blur-[2px]"
		onclick={() => close(false)}></div>

	<!-- Pomodoro overlay — positioned absolutely, FLIP from block rect -->
	<div bind:this={overlayEl}
		class="absolute z-30 bg-[var(--surface)] border border-[var(--accent)] flex flex-col overflow-hidden"
		style="opacity: 0;">

		<!-- Header -->
		<div class="flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
			<div>
				<p class="text-[15px] leading-[1.3] text-[var(--ink)]">{tl.ignited.title}</p>
				<p class="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-300)] mt-1">
					集中 {pomoDuration}分
				</p>
			</div>
			<button type="button" onclick={() => close(false)}
				class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)]
					   hover:text-[var(--ink)] transition-colors mt-0.5">
				戻す
			</button>
		</div>

		<div class="w-full h-px bg-[var(--line)] shrink-0"></div>

		<!-- Ring timer -->
		<div class="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
			<div class="relative w-44 h-44">
				<svg class="w-full h-full -rotate-90" viewBox="0 0 188 188">
					<circle cx="94" cy="94" r="84" stroke="var(--line)" stroke-width="5" fill="none"/>
					<circle cx="94" cy="94" r="84" stroke="var(--accent)" stroke-width="5" fill="none"
						stroke-linecap="round"
						stroke-dasharray="{C}"
						stroke-dashoffset="{strokeOffset}"
						style="transition: stroke-dashoffset 0.9s linear"/>
				</svg>
				<div class="absolute inset-0 flex flex-col items-center justify-center">
					<span class="font-mono text-[38px] leading-none tracking-[-0.02em] tabular-nums text-[var(--ink)]">
						{tl.pomoDisplay()}
					</span>
					<span class="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-300)] mt-2">
						{tl.paused ? "paused" : "focus"}
					</span>
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="w-full h-px bg-[var(--line)] shrink-0"></div>
		<div class="flex gap-3 px-5 py-4 shrink-0">
			<button type="button" onclick={tl.togglePause}
				class="flex-1 py-3 border border-[var(--line)] font-mono text-[11px] tracking-[0.08em]
					   uppercase text-[var(--ink-500)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]
					   transition-colors">
				{tl.paused ? "再開" : "一時停止"}
			</button>
			<button type="button" onclick={() => close(true)}
				class="flex-1 py-3 bg-[var(--accent)] font-mono text-[11px] tracking-[0.08em]
					   uppercase text-white hover:bg-[var(--accent-hover)] transition-colors">
				完了
			</button>
		</div>
	</div>
{/if}
