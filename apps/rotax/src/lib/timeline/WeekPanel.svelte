<script lang="ts">
import { tl } from "./state.svelte";

// Generate next 7 days from today
function weekDays(now: Date) {
	const days = [];
	const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	for (let i = 0; i < 7; i++) {
		const d = new Date(now);
		d.setDate(d.getDate() + i);
		days.push({
			label: DAY_LABELS[d.getDay()],
			date: d.getDate(),
			isToday: i === 0,
		});
	}
	return days;
}

// Rough task count per day — today uses real data, others are seeded from
// the same tasks shifted deterministically (visual filler only).
function taskDots(dayIndex: number, now: Date): number {
	if (dayIndex === 0) return tl.scheduled.length;
	// deterministic fake: vary 1–4 dots based on day
	return ((dayIndex * 3 + now.getDay()) % 4) + 1;
}

const days = $derived(weekDays(tl.now));
</script>

<!--
  WeekPanel: rough 7-day overview, low visual priority.
  Shows existence of tasks per day, not details.
-->
<div class="flex flex-col h-full border-l border-[var(--line)] min-w-0 bg-[var(--paper)]">

	<div class="px-4 h-10 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[var(--ink-300)]">
			Week
		</span>
	</div>

	<div class="flex-1 overflow-y-auto no-scrollbar py-1">
		{#each days as day, i}
			<div class="flex items-start gap-2 px-4 py-2.5 border-b border-[var(--line)]
						{day.isToday ? '' : 'opacity-40'}">

				<!-- Day label -->
				<div class="w-8 shrink-0 flex flex-col items-end pt-0.5">
					<span class="font-mono text-[9px] tracking-[0.08em] uppercase
								 {day.isToday ? 'text-[var(--accent)]' : 'text-[var(--ink-300)]'}">
						{day.label}
					</span>
					<span class="font-mono text-[9px] tabular-nums text-[var(--ink-300)]">
						{day.date}
					</span>
				</div>

				<!-- Task dots -->
				<div class="flex flex-wrap gap-1 pt-1.5">
					{#each Array(taskDots(i, tl.now)) as _}
						<div class="w-1.5 h-1.5 rounded-full
									{day.isToday ? 'bg-[var(--ink-500)]' : 'bg-[var(--ink-300)]'}">
						</div>
					{/each}
				</div>

			</div>
		{/each}
	</div>

</div>
