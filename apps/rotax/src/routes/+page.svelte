<script lang="ts">
import { tl } from "$lib/timeline/state.svelte";
import BacklogPanel from "$lib/timeline/BacklogPanel.svelte";
import HeroPanel from "$lib/timeline/HeroPanel.svelte";
import SchedulePanel from "$lib/timeline/SchedulePanel.svelte";
import CalendarPeek from "$lib/timeline/CalendarPeek.svelte";

$effect(() => tl.startClocks());
</script>

<!--
  3-column layout  (B案)
  ┌──────────────────────────────────────────────────┐
  │ Rotax                          2026-06-19 Thu 俯瞰│  ← top bar (full width)
  ├────────────┬──────────────────┬──────────────────┤
  │  BACKLOG   │   hero + pomo    │   TODAY schedule  │
  │  (1fr)     │   (1.6fr)        │   (1.2fr)         │
  └────────────┴──────────────────┴──────────────────┘
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

	<!-- 3 columns -->
	<div class="flex-1 min-h-0 grid" style="grid-template-columns: 1fr 1.6fr 1.2fr;">
		<BacklogPanel />
		<HeroPanel />
		<SchedulePanel />
	</div>

	<!-- Calendar peek overlay -->
	<CalendarPeek />

</div>
