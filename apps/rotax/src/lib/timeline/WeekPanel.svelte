<script lang="ts">
import { tl, fakeDayTasks } from "./state.svelte";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TOTAL_HOURS = 24; // 0-24, full day

// Hour labels to show
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

// percentage-based: fills the container height regardless of px
function pct(h: number) { return `${(h / TOTAL_HOURS) * 100}%`; }
function taskTop(start: number) { return pct(start); }
function taskHeight(start: number, end: number) { return `max(2px, ${((end - start) / TOTAL_HOURS) * 100}%)`; }
function nowTop() { return pct(tl.nowHour); }
</script>

<div class="flex flex-col h-full border-l border-[var(--line)] min-w-0 bg-[var(--paper)] opacity-70 hover:opacity-100 transition-opacity duration-300">

	<!-- Header bar -->
	<div class="px-3 h-11 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-300)]">Week</span>
	</div>

	<!-- Hour axis + day columns -->
	<div class="flex-1 min-h-0 flex overflow-hidden">

		<!-- Hour axis -->
		<div class="w-6 shrink-0 relative border-r border-[var(--line)]">
			{#each hourMarks as h}
				<div class="absolute right-1 leading-none -translate-y-1/2"
					style="top: {pct(h)};">
					<span class="font-mono text-[7px] tabular-nums text-[var(--ink-300)]">{h}</span>
				</div>
			{/each}
		</div>

		<!-- Day columns -->
		<div class="flex-1 flex min-w-0 min-h-0">
			{#each days as day}
				{@const isSelected = tl.viewDayOffset === day.offset}
				<div class="flex-1 min-w-0 flex flex-col border-r border-[var(--line)] last:border-r-0
						   transition-colors {isSelected ? 'bg-[var(--surface)]' : ''}">

					<!-- Day header — click switches TODAY view -->
					<button
						type="button"
						onclick={() => tl.setViewDay(day.offset)}
						class="h-9 w-full flex flex-col items-center justify-center shrink-0 border-b hover:bg-[var(--surface)]/60 transition-colors
							   {isSelected ? 'border-[var(--accent)]' : 'border-[var(--line)]'}">
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

					<!-- Mini timeline — fills remaining height, percentage-positioned -->
					<div class="flex-1 relative min-h-0 w-full">

						<!-- Hour lines -->
						{#each hourMarks as h}
							<div class="absolute left-0 right-0 border-t border-[var(--line)] opacity-50"
								style="top: {pct(h)};"></div>
						{/each}

						<!-- Task blocks — individually clickable for popover -->
						{#each day.tasks as task}
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
						{/each}

						<!-- NOW line (today only) -->
						{#if day.isToday}
							<div class="absolute left-0 right-0 border-t border-[var(--accent)] pointer-events-none opacity-80"
								style="top: {nowTop()};"></div>
						{/if}

					</div>

				</div>
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
