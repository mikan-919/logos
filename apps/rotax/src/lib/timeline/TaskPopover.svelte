<script lang="ts">
import { tl } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

const CARD_W = 260;
const CARD_H_EST = 180; // rough estimate to avoid going off-screen

// Compute clamped position so card stays in viewport
const pos = $derived.by(() => {
	if (!tl.popoverTask) return { x: 0, y: 0 };
	const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
	const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
	const x = Math.min(tl.popoverPos.x + 12, vw - CARD_W - 12);
	const y = Math.min(tl.popoverPos.y, vh - CARD_H_EST - 12);
	return { x: Math.max(8, x), y: Math.max(8, y) };
});

function onKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape') tl.closePopover();
}
</script>

<svelte:window onkeydown={onKeydown} />

{#if tl.popoverTask}
	<!-- Invisible full-screen capture layer for click-outside -->
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40" onclick={tl.closePopover}></div>

	<!-- Popover card -->
	<div
		role="tooltip"
		class="fixed z-50 w-[260px] bg-[var(--paper)] border border-[var(--line-strong)] shadow-lg"
		style="left: {pos.x}px; top: {pos.y}px;">

		<!-- Header -->
		<div class="flex items-start justify-between px-4 pt-4 pb-2.5 border-b border-[var(--line)]">
			<div class="flex flex-col gap-0.5 min-w-0 pr-3">
				<p class="font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--ink-300)]">
					{hhmm(tl.popoverTask.start)} – {hhmm(tl.popoverTask.end)}
					{#if tl.popoverTask.state === 'done'}
						<span class="text-[var(--positive)]"> ✓</span>
					{/if}
				</p>
				<p class="text-[14px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--ink)]">
					{tl.popoverTask.title}
				</p>
			</div>
			<button
				type="button"
				onclick={tl.closePopover}
				class="shrink-0 w-6 h-6 flex items-center justify-center text-[var(--ink-300)]
					   hover:text-[var(--ink)] transition-colors font-mono text-[11px] mt-0.5">
				✕
			</button>
		</div>

		<!-- Body -->
		<div class="px-4 py-3 flex flex-col gap-3">
			{#if tl.popoverTask.description}
				<p class="text-[12px] leading-[1.5] text-[var(--ink-500)]">
					{tl.popoverTask.description}
				</p>
			{/if}

			{#if tl.popoverTask.todos && tl.popoverTask.todos.length > 0}
				<ul class="flex flex-col gap-1">
					{#each tl.popoverTask.todos as todo}
						<li class="flex items-start gap-1.5 text-[11px] text-[var(--ink-500)]">
							<span class="font-mono text-[var(--ink-300)] mt-px shrink-0">—</span>
							<span>{todo}</span>
						</li>
					{/each}
				</ul>
			{/if}

			{#if !tl.popoverTask.description && (!tl.popoverTask.todos || tl.popoverTask.todos.length === 0)}
				<p class="text-[11px] text-[var(--ink-300)] font-mono tracking-[0.04em]">詳細なし</p>
			{/if}
		</div>

	</div>
{/if}
