<script lang="ts">
import { tl } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

const C = 2 * Math.PI * 88; // r=88

const strokeOffset = $derived(C * (1 - tl.pomoProgress));
const pomoDuration = $derived(Math.round(tl.pomoTotal / 60));
const isActive = $derived(!!tl.ignited);
</script>

<div class="flex flex-col h-full min-w-0">

	<!-- Status bar -->
	<div class="px-8 h-11 flex items-center gap-3 border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[11px] tracking-[0.12em] uppercase font-medium
					 {isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-300)]'}">
			{isActive ? (tl.paused ? 'Paused' : 'Focus') : (tl.heroTask ? 'Up next' : 'Ready')}
		</span>
		{#if tl.heroTask?.start != null && tl.heroTask?.end != null}
			<span class="font-mono text-[11px] tracking-[0.04em] text-[var(--ink-300)] tabular-nums">
				{hhmm(tl.heroTask.start!)} – {hhmm(tl.heroTask.end!)}
			</span>
		{/if}
	</div>

	<!-- Body: title + ring stacked, vertically centered -->
	<div class="flex-1 flex flex-col items-center justify-center gap-8 px-10 min-h-0">

		<!-- Task title -->
		<div class="w-full text-center">
			{#if tl.heroTask}
				<h2 class="text-[clamp(26px,2.8vw,40px)] leading-[1.15] tracking-[-0.02em]
						   {isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-500)]'}">
					{tl.heroTask.title}
				</h2>
				{#if tl.heroTask.description}
					<p class="mt-2 text-[14px] leading-[1.5] text-[var(--ink-300)] max-w-sm mx-auto">
						{tl.heroTask.description}
					</p>
				{/if}
			{:else}
				<h2 class="text-[clamp(26px,2.8vw,40px)] leading-[1.15] text-[var(--ink-300)]">
					タスクなし
				</h2>
			{/if}
		</div>

		<!-- Pomodoro ring -->
		<div class="relative w-[200px] h-[200px] shrink-0">
			<svg class="w-full h-full -rotate-90" viewBox="0 0 200 200">
				<circle cx="100" cy="100" r="88"
					stroke="var(--line)" stroke-width="6" fill="none"/>
				<circle cx="100" cy="100" r="88"
					stroke="{isActive ? 'var(--accent)' : 'var(--line-strong)'}"
					stroke-width="6" fill="none"
					stroke-linecap="round"
					stroke-dasharray="{C}"
					stroke-dashoffset="{isActive ? strokeOffset : 0}"
					style="transition: stroke-dashoffset 0.9s linear, stroke 0.3s ease"/>
			</svg>
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
				<span class="font-mono text-[42px] leading-none tracking-[-0.03em] tabular-nums
							 {isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-300)]'}">
					{isActive ? tl.pomoDisplay : `${String(pomoDuration).padStart(2,'0')}:00`}
				</span>
				<span class="font-mono text-[10px] tracking-[0.20em] uppercase mt-1
							 {isActive ? (tl.paused ? 'text-[var(--ink-300)]' : 'text-[var(--accent)]') : 'text-[var(--ink-300)]'}">
					{isActive ? (tl.paused ? 'paused' : 'focus') : 'ready'}
				</span>
			</div>
		</div>

		<!-- Controls -->
		{#if tl.heroTask}
			<div class="flex gap-2 w-full max-w-[240px]">
				{#if isActive}
					<button type="button" onclick={tl.togglePause}
						class="flex-1 py-3 border border-[var(--line)] font-mono text-[11px]
							   tracking-[0.08em] uppercase text-[var(--ink-500)]
							   hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors">
						{tl.paused ? '再開' : '一時停止'}
					</button>
					<button type="button" onclick={() => tl.collapse(true)}
						class="flex-1 py-3 bg-[var(--accent)] font-mono text-[11px]
							   tracking-[0.08em] uppercase text-white
							   hover:bg-[var(--accent-hover)] transition-colors">
						完了
					</button>
				{:else}
					<button type="button" onclick={() => tl.ignite(tl.heroTask!)}
						class="flex-1 py-3 bg-[var(--accent)] font-mono text-[11px]
							   tracking-[0.08em] uppercase text-white
							   hover:bg-[var(--accent-hover)] transition-colors">
						開始
					</button>
				{/if}
			</div>
		{/if}

	</div>

	<div class="h-11 border-t border-[var(--line)] shrink-0"></div>

</div>
