<script lang="ts">
import { tl } from "$lib/timeline/state.svelte";
import BacklogPanel from "$lib/timeline/BacklogPanel.svelte";
import HeroPanel from "$lib/timeline/HeroPanel.svelte";
import SchedulePanel from "$lib/timeline/SchedulePanel.svelte";
import WeekPanel from "$lib/timeline/WeekPanel.svelte";
import CalendarPeek from "$lib/timeline/CalendarPeek.svelte";
import TaskPopover from "$lib/timeline/TaskPopover.svelte";

$effect(() => tl.startClocks());
</script>

<!--
  2-column layout
  ┌────────────┬──────────────────────────────────────┐
  │  BACKLOG   │  UP NEXT (HeroPanel)                  │
  │            ├───────────────────────┬──────────────┤
  │            │  TODAY (SchedulePanel)│ WEEK         │
  └────────────┴───────────────────────┴──────────────┘
-->
<div class="w-dvw h-dvh bg-[var(--paper)] text-[var(--ink)] flex flex-col overflow-hidden relative">

	<!-- Top bar -->
	<div class="flex items-baseline justify-between px-6 py-3.5 border-b border-[var(--line)] shrink-0">
		<div class="flex items-baseline gap-4">
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

	<!-- 2 columns: backlog (280px) | right (flex-1) -->
	<div class="flex-1 min-h-0 grid" style="grid-template-columns: 280px 1fr;">

		<!-- Left: Backlog — dim when timer running -->
		<div class="min-h-0 overflow-hidden transition-all duration-500
					{tl.ignited ? 'opacity-25 pointer-events-none' : ''}">
			<BacklogPanel />
		</div>

		<!-- Right: UP NEXT stacked above [TODAY | WEEK] -->
		<div class="min-h-0 flex flex-col">

			<!-- UP NEXT: HeroPanel — roughly top 45% -->
			<div class="flex-[9] min-h-0 overflow-hidden border-b border-[var(--line)]">
				<HeroPanel />
			</div>

			<!-- TODAY + WEEK: bottom portion — dim when timer running -->
			<div class="flex-[11] min-h-0 flex transition-all duration-500
						{tl.ignited ? 'opacity-25 pointer-events-none' : ''}">

				<!-- TODAY: primary — 2 parts -->
				<div class="flex-[2] min-w-0 min-h-0 overflow-hidden">
					<SchedulePanel />
				</div>

				<!-- WEEK: secondary — 3 parts -->
				<div class="flex-[3] min-w-0 min-h-0 overflow-hidden">
					<WeekPanel />
				</div>

			</div>
		</div>

	</div>

	<!-- Calendar peek overlay -->
	<CalendarPeek />

	<!-- Task detail popover -->
	<TaskPopover />

</div>
