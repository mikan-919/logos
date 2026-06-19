<script lang="ts">
import { tl } from "./state.svelte";
</script>

<div class="flex flex-col h-full border-r border-[var(--line)] min-w-0">

	<div class="px-5 h-11 flex items-center gap-2 border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-500)]">Backlog</span>
		<span class="font-mono text-[10px] text-[var(--ink-300)]">{tl.backlog.length}</span>
	</div>

	<div class="flex-1 overflow-y-auto no-scrollbar">
		{#each tl.backlog as task (task.id)}
			{@const isCursor = tl.selected?.id === task.id}
			<button
				type="button"
				onclick={() => tl.select(task)}
				class="w-full text-left px-5 py-3 flex items-center gap-3 group
					   border-b border-[var(--line)] transition-colors outline-none
					   focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]
					   {isCursor
						   ? 'bg-[var(--accent)] text-white'
						   : 'hover:bg-[var(--surface)] text-[var(--ink-700)] hover:text-[var(--ink)]'}">
				<span class="shrink-0 font-mono text-[12px] leading-none transition-colors
							 {isCursor ? 'text-white' : 'text-[var(--line-strong)] group-hover:text-[var(--accent)]'}">
					›
				</span>
				<span class="text-[14px] leading-[1.35]">
					{task.title}
				</span>
			</button>
		{/each}

		{#if tl.backlog.length === 0}
			<div class="flex items-center justify-center h-24">
				<span class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)]">
					すべて完了
				</span>
			</div>
		{/if}
	</div>

</div>
