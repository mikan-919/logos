<script lang="ts">
import { tl } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

function onBackdrop(e: MouseEvent) {
	if (e.target === e.currentTarget) tl.closePopover();
}

function onKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") tl.closePopover();
}
</script>

{#if tl.popoverTask}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4 sm:items-center"
		onclick={onBackdrop}
		onkeydown={onKeydown}
		tabindex="-1"
		role="dialog"
		aria-modal="true">

		<!-- Backdrop -->
		<div class="absolute inset-0 bg-[var(--ink)]/10 backdrop-blur-[2px]"></div>

		<!-- Card -->
		<div class="relative w-full max-w-sm bg-[var(--paper)] border border-[var(--line-strong)] shadow-lg">

			<!-- Header -->
			<div class="flex items-start justify-between px-5 pt-5 pb-3 border-b border-[var(--line)]">
				<div class="flex flex-col gap-1 min-w-0 pr-4">
					<p class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-300)]">
						{hhmm(tl.popoverTask.start)} – {hhmm(tl.popoverTask.end)}
						{#if tl.popoverTask.state === 'done'}
							<span class="ml-2 text-[var(--positive)]">✓ 完了</span>
						{/if}
					</p>
					<h2 class="text-[18px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--ink)]">
						{tl.popoverTask.title}
					</h2>
				</div>
				<button
					type="button"
					onclick={tl.closePopover}
					class="shrink-0 w-7 h-7 flex items-center justify-center text-[var(--ink-300)]
						   hover:text-[var(--ink)] transition-colors font-mono text-[14px]">
					✕
				</button>
			</div>

			<!-- Body -->
			<div class="px-5 py-4 flex flex-col gap-4">

				{#if tl.popoverTask.description}
					<p class="text-[13px] leading-[1.55] text-[var(--ink-500)]">
						{tl.popoverTask.description}
					</p>
				{/if}

				{#if tl.popoverTask.todos && tl.popoverTask.todos.length > 0}
					<ul class="flex flex-col gap-1.5">
						{#each tl.popoverTask.todos as todo}
							<li class="flex items-start gap-2 text-[12px] text-[var(--ink-500)]">
								<span class="font-mono text-[var(--line-strong)] mt-[2px]">—</span>
								<span>{todo}</span>
							</li>
						{/each}
					</ul>
				{/if}

				{#if !tl.popoverTask.description && (!tl.popoverTask.todos || tl.popoverTask.todos.length === 0)}
					<p class="text-[12px] text-[var(--ink-300)] font-mono tracking-[0.04em]">詳細なし</p>
				{/if}

			</div>

		</div>
	</div>
{/if}
