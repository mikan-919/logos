<script lang="ts">
import { tl } from "./state.svelte";
import type { Task } from "$lib/dashboard/seed";
</script>

<!-- Left column: backlog tasks — unscheduled, click to ignite directly -->
<div class="flex flex-col h-full border-r border-[var(--line)] min-w-0">

	<div class="px-5 h-10 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-300)]">
			Backlog
		</span>
		<span class="font-mono text-[10px] text-[var(--ink-300)] ml-2">
			{tl.backlog.length}
		</span>
	</div>

	<div class="flex-1 overflow-y-auto no-scrollbar py-1">
		{#each tl.backlog as task (task.id)}
			<button
				type="button"
				onclick={() => tl.ignite(task)}
				class="w-full text-left px-5 py-2.5 flex items-start gap-2 group
					   hover:bg-[var(--surface)] transition-colors outline-none
					   focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]
					   {tl.ignited?.id === task.id ? 'bg-[var(--accent-soft)]' : ''}">
				<span class="font-mono text-[10px] text-[var(--line-strong)] shrink-0 mt-0.5
							 group-hover:text-[var(--accent)] transition-colors
							 {tl.ignited?.id === task.id ? 'text-[var(--accent)]' : ''}">
					›
				</span>
				<span class="text-[13px] leading-[1.35] text-[var(--ink-700)]
							 group-hover:text-[var(--ink)] transition-colors truncate">
					{task.title}
				</span>
			</button>
		{/each}

		{#if tl.backlog.length === 0}
			<div class="flex items-center justify-center h-20">
				<span class="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
					すべて完了
				</span>
			</div>
		{/if}
	</div>

</div>
