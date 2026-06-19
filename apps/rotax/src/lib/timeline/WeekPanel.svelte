<script lang="ts">
import { tl, fakeDayTasks } from "./state.svelte";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TOTAL_HOURS = 24;
const hourMarks = [0, 6, 12, 18, 24];

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
				? tl.scheduled.map(t => ({
						id: t.id,
						start: t.start,
						end: t.end,
						title: t.title,
						description: t.description,
						todos: t.todos,
						state: t.state,
					}))
				: fakeDayTasks(i),
		});
	}
	return out;
});

function pct(h: number) { return `${(h / TOTAL_HOURS) * 100}%`; }
function taskTop(start: number) { return pct(Math.min(start, TOTAL_HOURS)); }
function taskHeight(start: number, end: number) {
	const s = Math.min(start, TOTAL_HOURS);
	const e = Math.min(end, TOTAL_HOURS);
	return `max(2px, ${((e - s) / TOTAL_HOURS) * 100}%)`;
}
function nowTop() { return pct(Math.min(tl.nowHour, TOTAL_HOURS)); }
</script>

<div class="flex flex-col h-full border-l border-[var(--line)] min-w-0 bg-[var(--paper)] opacity-70 hover:opacity-100 transition-opacity duration-300">

	<!-- Panel header -->
	<div class="px-3 h-11 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-300)]">Week</span>
	</div>

	<!-- Day label row (separate from timeline so heights match) -->
	<div class="flex shrink-0 border-b border-[var(--line)]">
		<!-- Spacer for hour axis -->
		<div class="w-6 shrink-0"></div>
		<!-- Day headers -->
		{#each days as day}
			{@const isSelected = tl.viewDayOffset === day.offset}
			<button
				type="button"
				onclick={() => tl.setViewDay(day.offset)}
				class="flex-1 min-w-0 h-9 flex flex-col items-center justify-center
					   hover:bg-[var(--surface)]/60 transition-colors
					   {isSelected ? 'border-b-2 border-[var(--accent)]' : ''}">
				<span class="font-mono text-[8px] tracking-[0.04em] uppercase
							 {day.isToday ? 'text-[var(--accent)]' : 'text-[var(--ink-300)]'}
							 {isSelected ? 'font-bold' : ''}">
					{day.label}
				</span>
				<span class="font-mono text-[10px] tabular-nums leading-tight
							 {day.isToday ? 'text-[var(--accent)] font-medium' : 'text-[var(--ink-500)]'}
							 {isSelected ? 'font-bold' : ''}">
					{day.date}
				</span>
			</button>
		{/each}
	</div>

	<!-- Timeline area: hour axis + day columns share exact same height -->
	<div class="flex-1 min-h-0 flex overflow-hidden">

		<!-- Hour axis -->
		<div class="w-6 shrink-0 relative border-r border-[var(--line)] h-full">
			{#each hourMarks as h}
				<div class="absolute right-1 leading-none -translate-y-1/2"
					style="top: {pct(h)};">
					<span class="font-mono text-[7px] tabular-nums text-[var(--ink-300)]">{h}</span>
				</div>
			{/each}
		</div>

		<!-- Day columns — no internal headers, just the timeline -->
		<div class="flex-1 flex min-w-0">
			{#each days as day}
				{@const isSelected = tl.viewDayOffset === day.offset}
				<div class="flex-1 min-w-0 relative border-r border-[var(--line)] last:border-r-0 h-full
							{isSelected ? 'bg-[var(--surface)]' : ''}">

					<!-- Hour lines -->
					{#each hourMarks as h}
						<div class="absolute left-0 right-0 border-t border-[var(--line)] opacity-50 pointer-events-none"
							style="top: {pct(h)};"></div>
					{/each}

					<!-- Task blocks -->
					{#each day.tasks as task}
						{#if task.start < TOTAL_HOURS}
							<button
								type="button"
								onclick={(e) => { e.stopPropagation(); tl.openPopover(task, { x: e.clientX, y: e.clientY }); }}
								class="absolute left-0.5 right-0.5 rounded-[1px] overflow-hidden px-0.5 py-px text-left
									   hover:opacity-100 transition-opacity
									   {day.isToday ? 'bg-[var(--accent)]' : 'bg-[var(--ink-300)] opacity-50'}"
								style="top: {taskTop(task.start)}; height: {taskHeight(task.start, task.end)};">
								<span class="block truncate font-sans text-[8px] leading-tight
											 {day.isToday ? 'text-white/60' : 'text-white/70'}">
									{task.title}
								</span>
							</button>
						{/if}
					{/each}

					<!-- NOW line (today only) -->
					{#if day.isToday}
						<div class="absolute left-0 right-0 border-t border-[var(--accent)] pointer-events-none opacity-80"
							style="top: {nowTop()};"></div>
					{/if}

				</div>
			{/each}
		</div>

	</div>

	<!-- Footer -->
	<div class="px-3 h-8 flex items-center border-t border-[var(--line)] shrink-0">
		<span class="font-mono text-[9px] tracking-[0.06em] text-[var(--ink-300)]">
			{tl.viewDateLabel}
		</span>
	</div>

</div>
