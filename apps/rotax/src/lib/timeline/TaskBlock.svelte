<script lang="ts">
import type { Task } from "$lib/dashboard/seed";
import { hhmm } from "$lib/dashboard/format";
import { tl, HOUR_START, HOUR_PX } from "./state.svelte";

let { task }: { task: Task & { start: number; end: number } } = $props();

const top = $derived((task.start - HOUR_START) * HOUR_PX);
const height = $derived(Math.max(36, (task.end - task.start) * HOUR_PX - 6));
const isActive = $derived(task.state === "active");
const isDone = $derived(task.state === "done");
const isIgnited = $derived(tl.ignited?.id === task.id);

let blockEl: HTMLButtonElement;

// Expose rect so Pomodoro can FLIP from it
export function getRect() {
	return blockEl?.getBoundingClientRect();
}
</script>

<button
	bind:this={blockEl}
	type="button"
	onclick={() => !isDone && !isIgnited && tl.ignite(task)}
	disabled={isDone || isIgnited}
	class="absolute left-0 right-0 mx-3 text-left transition-all"
	style="top: {top}px; height: {height}px;"
>
	<div class="relative h-full rounded-none border transition-all overflow-hidden
		{isActive ? 'border-[var(--accent)] bg-[var(--surface)]' : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]'}
		{isDone ? 'opacity-50 cursor-default' : 'cursor-pointer'}
		{isIgnited ? 'opacity-0 pointer-events-none' : ''}">

		<!-- accent left edge -->
		<div class="absolute left-0 top-0 bottom-0 w-0.5 transition-colors
			{isActive ? 'bg-[var(--accent)]' : 'bg-[var(--line-strong)]'}"></div>

		<!-- progress fill (active task) -->
		{#if isActive}
			<div class="absolute left-0 top-0 bottom-0 bg-[var(--accent-soft)] pointer-events-none transition-all"
				style="width: {tl.pomoProgress * 100}%"></div>
		{/if}

		<div class="relative px-3 py-2 flex flex-col justify-center h-full">
			<p class="text-[13px] leading-[1.3] truncate
				{isDone ? 'line-through text-[var(--ink-300)]' : 'text-[var(--ink)]'}">
				{task.title}
			</p>
			<p class="font-mono text-[10px] tracking-[0.06em] text-[var(--ink-300)] mt-0.5">
				{hhmm(task.start)} – {hhmm(task.end)}
				{#if isDone}&nbsp;·&nbsp;✓ 完了{/if}
				{#if isActive}
					&nbsp;·&nbsp;<span class="text-[var(--accent)]">進行中</span>
				{/if}
			</p>
		</div>
	</div>
</button>
