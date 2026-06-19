<script lang="ts">
import { tl } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

const C = 2 * Math.PI * 88;
const strokeOffset = $derived(C * (1 - tl.pomoProgress));
const isActive = $derived(!!tl.ignited);

// Split title into lines for poster display (break at spaces, max ~12 chars/line)
function posterLines(title: string): string[] {
	const words = title.split(" ");
	const lines: string[] = [];
	let current = "";
	for (const w of words) {
		if (current && (current + " " + w).length > 12) {
			lines.push(current);
			current = w;
		} else {
			current = current ? current + " " + w : w;
		}
	}
	if (current) lines.push(current);
	return lines;
}

const lines = $derived(tl.heroTask ? posterLines(tl.heroTask.title) : []);
</script>

<div class="flex flex-col h-full border-x border-[var(--line)] min-w-0">

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

	{#if isActive}
		<!-- ── ACTIVE: poster timer — same visual language as idle ── -->
		<div class="flex-1 flex flex-col px-10 pt-[10%] min-h-0 gap-8 overflow-hidden">

			<!-- Title lines stay, but smaller / muted -->
			<div class="flex flex-col gap-0" style="line-height: 0.92;">
				{#each lines as line}
					<span class="text-[clamp(28px,3.5vw,52px)] font-bold tracking-[-0.03em]
								 uppercase leading-[0.92]
								 {tl.paused ? 'text-[var(--ink-300)]' : 'text-[var(--ink-500)]'}">
						{line}
					</span>
				{/each}
			</div>

			<!-- Countdown — same typographic scale as the poster title -->
			<div class="relative flex flex-col gap-2">
				<!-- thin progress arc behind the number (decorative, not primary) -->
				<svg class="absolute -left-2 -top-4 opacity-20 -rotate-90"
					width="180" height="180" viewBox="0 0 180 180" style="pointer-events:none">
					<circle cx="90" cy="90" r="80" stroke="var(--accent)" stroke-width="3" fill="none"
						stroke-dasharray="{2 * Math.PI * 80}"
						stroke-dashoffset="{2 * Math.PI * 80 * (1 - tl.pomoProgress)}"
						style="transition: stroke-dashoffset 0.9s linear"/>
				</svg>

				<span class="font-mono text-[clamp(52px,6.5vw,88px)] leading-none tracking-[-0.04em]
							 tabular-nums {tl.paused ? 'text-[var(--ink-300)]' : 'text-[var(--ink)]'}">
					{tl.pomoDisplay}
				</span>
				<span class="font-mono text-[11px] tracking-[0.20em] uppercase
							 {tl.paused ? 'text-[var(--ink-300)]' : 'text-[var(--accent)]'}">
					{tl.paused ? 'paused' : 'focus'}
				</span>
			</div>

			<!-- Controls — same width/style as idle CTA -->
			<div class="flex gap-2 max-w-xs">
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
			</div>
		</div>

	{:else if tl.heroTask}
		<!-- ── IDLE: poster — selected task rendered large ── -->
		<div class="flex-1 flex flex-col px-10 pt-[10%] min-h-0 gap-8 overflow-hidden">

			<!-- Time above -->
			{#if tl.heroTask.start != null}
				<span class="font-mono text-[13px] tracking-[0.08em] text-[var(--ink-300)] tabular-nums">
					{hhmm(tl.heroTask.start)}
				</span>
			{/if}

			<!-- Poster title -->
			<div class="flex flex-col gap-0" style="line-height: 0.92;">
				{#each lines as line}
					<span class="text-[clamp(40px,5.5vw,80px)] font-bold tracking-[-0.03em]
								 text-[var(--ink)] uppercase leading-[0.92]">
						{line}
					</span>
				{/each}
			</div>

			<!-- Time below -->
			{#if tl.heroTask.end != null}
				<span class="font-mono text-[13px] tracking-[0.08em] text-[var(--ink-300)] tabular-nums">
					{hhmm(tl.heroTask.end)}
				</span>
			{/if}

			<!-- CTA -->
			<div class="flex flex-col gap-3 max-w-xs">
				<button type="button" onclick={() => tl.ignite(tl.heroTask!)}
					class="w-full py-4 bg-[var(--accent)] text-white font-mono text-[13px]
						   tracking-[0.10em] uppercase hover:bg-[var(--accent-hover)]
						   transition-colors flex items-center justify-center gap-3">
					<span class="text-[18px] leading-none">▶</span>
					今すぐ開始
				</button>
			</div>

		</div>

	{:else}
		<!-- ── EMPTY ── -->
		<div class="flex-1 flex flex-col items-center justify-center gap-3">
			<p class="text-[clamp(20px,2.4vw,32px)] text-[var(--ink-300)]">今日のタスクなし</p>
			<p class="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
				左のバックログから選んで開始
			</p>
		</div>
	{/if}

	<div class="h-11 border-t border-[var(--line)] shrink-0"></div>
</div>
