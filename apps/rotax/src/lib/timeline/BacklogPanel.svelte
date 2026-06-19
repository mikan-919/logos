<script lang="ts">
import { tl } from "./state.svelte";
</script>

<div class="flex flex-col h-full border-r border-[var(--line)] min-w-0">

	<div class="px-5 h-11 flex items-center gap-2 border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-500)]">
			Backlog
		</span>
		<span class="font-mono text-[10px] text-[var(--ink-300)]">{tl.backlog.length}</span>
	</div>

	<div class="flex-1 overflow-y-auto no-scrollbar">
		{#each tl.backlog as task (task.id)}
			<button
				type="button"
				onclick={() => tl.ignite(task)}
				class="w-full text-left px-5 py-3 flex items-center gap-3 group
					   border-b border-[var(--line)] transition-colors outline-none
					   hover:bg-[var(--surface)]
					   focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]
					   {tl.ignited?.id === task.id ? 'bg-[var(--accent-soft)]' : ''}">
				<span class="text-[var(--line-strong)] group-hover:text-[var(--accent)] transition-colors shrink-0
							 {tl.ignited?.id === task.id ? '!text-[var(--accent)]' : ''}
							 text-[16px] leading-none">
					›
				</span>
				<span class="text-[14px] leading-[1.4] text-[var(--ink-700)]
							 group-hover:text-[var(--ink)] transition-colors">
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
