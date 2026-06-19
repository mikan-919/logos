<script lang="ts">
import { tl, HOUR_START, HOUR_END, fakeDayTasks } from "./state.svelte";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MINI_PX = 6; // px per hour in mini timeline
const TOTAL_HOURS = HOUR_END - HOUR_START;
const GRID_H = TOTAL_HOURS * MINI_PX; // 102px

// Hour labels to show (every 3h)
const hourMarks = [7, 10, 13, 16, 19, 22];

const days = $derived.by(() => {
	const out = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(tl.now);
		d.setDate(d.getDate() + i);
		out.push({
			offset: i,
			label: DAY_LABELS[d.getDay()],
			date: d.getDate(),
			isToday: i === 0,
			tasks: i === 0
				? tl.scheduled.map(t => ({ start: t.start, end: t.end }))
				: fakeDayTasks(i).map(t => ({ start: t.start, end: t.end })),
		});
	}
	return out;
});

function taskTop(start: number) {
	return (start - HOUR_START) * MINI_PX;
}
function taskHeight(start: number, end: number) {
	return Math.max(2, (end - start) * MINI_PX - 1);
}
</script>

<div class="flex flex-col h-full border-l border-[var(--line)] min-w-0 bg-[var(--paper)]">

	<!-- Header bar -->
	<div class="px-3 h-11 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-300)]">Week</span>
	</div>

	<div class="flex-1 overflow-hidden flex min-h-0">

		<!-- Hour axis -->
		<div class="w-7 shrink-0 relative border-r border-[var(--line)] mt-9">
			{#each hourMarks as h}
				<div class="absolute right-1 leading-none"
					style="top: {(h - HOUR_START) * MINI_PX - 4}px;">
					<span class="font-mono text-[8px] tabular-nums text-[var(--ink-300)]">{h}</span>
				</div>
			{/each}
		</div>

		<!-- Day columns -->
		<div class="flex-1 overflow-x-auto flex min-w-0">
			{#each days as day}
				{@const isSelected = tl.viewDayOffset === day.offset}
				<button
					type="button"
					onclick={() => tl.setViewDay(day.offset)}
					class="flex-1 min-w-[52px] flex flex-col border-r border-[var(--line)] last:border-r-0
						   transition-colors {isSelected ? 'bg-[var(--surface)]' : 'hover:bg-[var(--surface)]/50'}">

					<!-- Day header -->
					<div class="h-9 flex flex-col items-center justify-center shrink-0 border-b border-[var(--line)]
								{isSelected ? 'border-b-[var(--accent)]' : ''}">
						<span class="font-mono text-[8.5px] tracking-[0.06em] uppercase
									 {day.isToday ? 'text-[var(--accent)]' : 'text-[var(--ink-300)]'}
									 {isSelected ? 'font-bold' : ''}">
							{day.label}
						</span>
						<span class="font-mono text-[10px] tabular-nums
									 {day.isToday ? 'text-[var(--accent)] font-medium' : 'text-[var(--ink-500)]'}
									 {isSelected ? 'font-bold' : ''}">
							{day.date}
						</span>
					</div>

					<!-- Mini timeline -->
					<div class="relative w-full" style="height: {GRID_H}px; flex-shrink: 0;">

						<!-- Hour lines -->
						{#each hourMarks as h}
							<div class="absolute left-0 right-0 border-t border-[var(--line)]"
								style="top: {(h - HOUR_START) * MINI_PX}px; opacity: 0.5;"></div>
						{/each}

						<!-- Task blocks -->
						{#each day.tasks as task}
							<div class="absolute left-0.5 right-0.5 rounded-[1px]
										{day.isToday ? 'bg-[var(--accent)]' : 'bg-[var(--ink-300)]'}
										{!day.isToday ? 'opacity-50' : ''}"
								style="top: {taskTop(task.start)}px; height: {taskHeight(task.start, task.end)}px;">
							</div>
						{/each}

						<!-- NOW line (today only) -->
						{#if day.isToday && tl.nowHour >= HOUR_START && tl.nowHour <= HOUR_END}
							<div class="absolute left-0 right-0 border-t border-[var(--accent)] pointer-events-none"
								style="top: {(tl.nowHour - HOUR_START) * MINI_PX}px; opacity: 0.7;">
							</div>
						{/if}

					</div>

				</button>
			{/each}
		</div>

	</div>

	<!-- Selected day label -->
	<div class="px-3 h-8 flex items-center border-t border-[var(--line)] shrink-0">
		<span class="font-mono text-[9px] tracking-[0.06em] text-[var(--ink-300)]">
			{tl.viewDateLabel}
		</span>
	</div>

</div>
