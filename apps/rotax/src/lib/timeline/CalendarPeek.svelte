<script lang="ts">
import { tl } from "./state.svelte";

const DAYS = ["日","月","火","水","木","金","土"];

// June 2026
const year = 2026, month = 5; // 0-indexed
const firstDay = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();
const today = 19;

const cells: (number | null)[] = [
	...Array(firstDay).fill(null),
	...Array.from({ length: daysInMonth }, (_, i) => i + 1),
];
</script>

{#if tl.calOpen}
	<!-- Scrim -->
	<div class="absolute inset-0 bg-[var(--ink)]/20 z-20 backdrop-blur-[2px]"
		onclick={() => (tl.calOpen = false)}></div>

	<!-- Calendar panel -->
	<div class="absolute left-3 right-3 top-16 bottom-4 z-30
				bg-[var(--surface)] border border-[var(--line)] flex flex-col overflow-hidden
				animate-in fade-in slide-in-from-bottom-2 duration-300">

		<!-- Header -->
		<div class="flex items-baseline justify-between px-5 py-4 border-b border-[var(--line)] shrink-0">
			<span class="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--ink-300)]">
				2026 / 06
			</span>
			<button type="button" onclick={() => (tl.calOpen = false)}
				class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)]
					   hover:text-[var(--ink)] transition-colors">
				タイムラインへ
			</button>
		</div>

		<!-- Day-of-week labels -->
		<div class="grid grid-cols-7 px-4 pt-3 pb-1 shrink-0">
			{#each DAYS as d}
				<span class="font-mono text-[9px] tracking-[0.08em] uppercase text-[var(--ink-300)] text-center">
					{d}
				</span>
			{/each}
		</div>

		<!-- Date grid -->
		<div class="grid grid-cols-7 gap-1 px-4 pb-4">
			{#each cells as cell}
				<div class="aspect-square flex items-end justify-end p-1.5
							border transition-colors font-mono text-[11px] tabular-nums
							{cell === today
								? 'border-[var(--accent)] text-[var(--accent)]'
								: cell !== null
									? 'border-[var(--line)] text-[var(--ink-300)]'
									: 'border-transparent'}">
					{cell ?? ""}
				</div>
			{/each}
		</div>

	</div>
{/if}
