<script lang="ts">
import { tick } from "svelte";
import { tl, HOUR_START, HOUR_END, HOUR_PX } from "$lib/timeline/state.svelte";
import TaskBlock from "$lib/timeline/TaskBlock.svelte";
import Pomodoro from "$lib/timeline/Pomodoro.svelte";
import CalendarPeek from "$lib/timeline/CalendarPeek.svelte";

$effect(() => tl.startClocks());

// Scroll to now on mount
let timelineEl: HTMLDivElement;
$effect(() => {
	if (timelineEl) {
		const offset = Math.max(0, tl.nowTopPx - 180);
		timelineEl.scrollTop = offset;
	}
});

// FLIP source rect per task id
let blockRefs = $state<Record<string, TaskBlock>>({});

function getSourceRect() {
	if (!tl.ignited) return undefined;
	return blockRefs[tl.ignited.id]?.getRect();
}

const hours = Array.from(
	{ length: HOUR_END - HOUR_START + 1 },
	(_, i) => HOUR_START + i,
);

const totalHeight = $derived((HOUR_END - HOUR_START + 1) * HOUR_PX);
</script>

<div class="app-frame w-full max-w-[440px] mx-auto h-dvh flex flex-col
			border-l border-r border-[var(--line)] bg-[var(--paper)] relative overflow-hidden">

	<!-- Top bar -->
	<div class="flex items-baseline justify-between px-5 py-4 border-b border-[var(--line)] shrink-0">
		<div class="flex items-baseline gap-3">
			<h1 class="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-500)]">
				Rotax
			</h1>
			<span class="font-mono text-[11px] tracking-[0.06em] text-[var(--ink-300)] tabular-nums">
				{tl.dateLabel}
			</span>
		</div>
		<button type="button" onclick={() => (tl.calOpen = true)}
			class="font-mono text-[10px] tracking-[0.14em] uppercase
				   border border-[var(--line)] px-3 py-1.5 text-[var(--ink-300)]
				   hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors">
			俯瞰
		</button>
	</div>

	<!-- Timeline -->
	<div bind:this={timelineEl}
		class="flex-1 overflow-y-auto no-scrollbar relative
			   transition-all duration-300 {tl.ignited || tl.calOpen ? 'opacity-40 pointer-events-none scale-[0.985] saturate-50' : ''}"
		style="filter: {tl.ignited || tl.calOpen ? 'brightness(0.85)' : 'none'}">

		<!-- Absolute positioning container -->
		<div class="relative" style="height: {totalHeight + 80}px;">

			<!-- Hour grid lines + tick labels -->
			{#each hours as h}
				<div class="absolute left-0 right-0 flex items-start pointer-events-none"
					style="top: {(h - HOUR_START) * HOUR_PX}px; height: {HOUR_PX}px;">
					<!-- tick -->
					<div class="w-12 shrink-0 flex justify-end pr-3 pt-1">
						<span class="font-mono text-[10px] tabular-nums text-[var(--ink-300)]">
							{String(h).padStart(2, "0")}
						</span>
					</div>
					<!-- horizontal hairline -->
					<div class="flex-1 border-t border-[var(--line)]"></div>
				</div>
			{/each}

			<!-- Task blocks (absolute positioned by start hour) -->
			<div class="absolute left-12 right-0 top-0 bottom-0">
				{#each tl.scheduled as task (task.id)}
					<TaskBlock {task} bind:this={blockRefs[task.id]} />
				{/each}
			</div>

			<!-- NOW line -->
			{#if tl.nowHour >= HOUR_START && tl.nowHour <= HOUR_END}
				<div class="absolute left-12 right-0 pointer-events-none z-10"
					style="top: {tl.nowTopPx}px;">
					<div class="relative border-t border-[var(--accent)]"
						style="box-shadow: 0 0 8px rgba(241,83,31,0.35)">
						<div class="absolute -left-[3px] -top-[3.5px] w-[7px] h-[7px] rounded-full bg-[var(--accent)]"
							style="box-shadow: 0 0 8px var(--accent)"></div>
					</div>
				</div>
			{/if}

		</div>
	</div>

	<!-- Pomodoro overlay (FLIP from task block) -->
	<Pomodoro {getSourceRect} />

	<!-- Calendar peek -->
	<CalendarPeek />

</div>
