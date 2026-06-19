<script lang="ts">
import { tl } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

const C = 2 * Math.PI * 72; // ring circumference (r=72)

const strokeOffset = $derived(C * (1 - tl.pomoProgress));

const pomoDuration = $derived(Math.round(tl.pomoTotal / 60));

const isRunning = $derived(!!tl.ignited && tl.running && !tl.paused);
const isActive  = $derived(!!tl.ignited);
</script>

<!-- Center column: hero task + pomodoro ring -->
<div class="flex flex-col h-full min-w-0">

	<!-- Status label -->
	<div class="px-8 h-10 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase
					 {isActive ? 'text-[var(--accent)]' : 'text-[var(--ink-300)]'}">
			{isActive ? (tl.paused ? 'Paused' : 'Focus') : (tl.heroTask ? 'Up next' : 'Ready')}
		</span>
		{#if tl.heroTask?.start != null && tl.heroTask?.end != null}
			<span class="font-mono text-[10px] tracking-[0.06em] text-[var(--ink-300)] ml-3 tabular-nums">
				{hhmm(tl.heroTask.start!)} – {hhmm(tl.heroTask.end!)}
			</span>
		{/if}
	</div>

	<!-- Task title -->
	<div class="px-8 pt-8 pb-4 shrink-0">
		{#if tl.heroTask}
			<h2 class="text-[clamp(22px,2.4vw,32px)] leading-[1.15] tracking-[-0.01em] text-[var(--ink)]
					   {!isActive ? 'text-[var(--ink-500)]' : ''}">
				{tl.heroTask.title}
			</h2>
		{:else}
			<h2 class="text-[clamp(22px,2.4vw,32px)] leading-[1.15] text-[var(--ink-300)]">
				タスクなし
			</h2>
		{/if}
	</div>

	<!-- Pomodoro ring — center of the column -->
	<div class="flex-1 flex flex-col items-center justify-center gap-6 min-h-0 px-8">
		<div class="relative w-[168px] h-[168px] shrink-0">
			<svg class="w-full h-full -rotate-90" viewBox="0 0 168 168">
				<!-- track -->
				<circle cx="84" cy="84" r="72"
					stroke="var(--line)" stroke-width="5" fill="none"/>
				<!-- progress -->
				<circle cx="84" cy="84" r="72"
					stroke="{isActive ? 'var(--accent)' : 'var(--line-strong)'}"
					stroke-width="5" fill="none"
					stroke-linecap="round"
					stroke-dasharray="{C}"
					stroke-dashoffset="{isActive ? strokeOffset : 0}"
					style="transition: stroke-dashoffset 0.9s linear, stroke 0.3s ease"/>
			</svg>
			<div class="absolute inset-0 flex flex-col items-center justify-center">
				<span class="font-mono text-[36px] leading-none tracking-[-0.02em] tabular-nums
							 {isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-300)]'}">
					{isActive ? tl.pomoDisplay : `${pomoDuration}:00`}
				</span>
				<span class="font-mono text-[9.5px] tracking-[0.18em] uppercase mt-2
							 {isActive ? (tl.paused ? 'text-[var(--ink-300)]' : 'text-[var(--accent)]') : 'text-[var(--ink-300)]'}">
					{isActive ? (tl.paused ? 'paused' : 'focus') : 'ready'}
				</span>
			</div>
		</div>

		<!-- Controls -->
		{#if tl.heroTask}
			<div class="flex gap-2 w-full max-w-[220px]">
				{#if isActive}
					<button type="button" onclick={tl.togglePause}
						class="flex-1 py-2.5 border border-[var(--line)] font-mono text-[10px]
							   tracking-[0.08em] uppercase text-[var(--ink-500)]
							   hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors">
						{tl.paused ? '再開' : '一時停止'}
					</button>
					<button type="button" onclick={() => tl.collapse(true)}
						class="flex-1 py-2.5 bg-[var(--accent)] font-mono text-[10px]
							   tracking-[0.08em] uppercase text-white
							   hover:bg-[var(--accent-hover)] transition-colors">
						完了
					</button>
				{:else}
					<button type="button" onclick={() => tl.ignite(tl.heroTask!)}
						class="flex-1 py-2.5 bg-[var(--accent)] font-mono text-[10px]
							   tracking-[0.08em] uppercase text-white
							   hover:bg-[var(--accent-hover)] transition-colors">
						開始
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Bottom spacer to align with timeline -->
	<div class="h-10 border-t border-[var(--line)] shrink-0"></div>

</div>
