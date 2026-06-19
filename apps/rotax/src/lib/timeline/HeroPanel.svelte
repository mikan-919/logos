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
		<!-- ── ACTIVE: timer ── -->
		<div class="flex-1 flex flex-col items-center justify-center gap-6 px-10 min-h-0">
			<p class="font-mono text-[11px] tracking-[0.10em] uppercase text-[var(--ink-300)] text-center">
				{tl.ignited!.title}
			</p>

			<div class="relative w-[200px] h-[200px] shrink-0">
				<svg class="w-full h-full -rotate-90" viewBox="0 0 200 200">
					<circle cx="100" cy="100" r="88" stroke="var(--line)" stroke-width="6" fill="none"/>
					<circle cx="100" cy="100" r="88" stroke="var(--accent)" stroke-width="6" fill="none"
						stroke-linecap="round"
						stroke-dasharray="{C}"
						stroke-dashoffset="{strokeOffset}"
						style="transition: stroke-dashoffset 0.9s linear"/>
				</svg>
				<div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
					<span class="font-mono text-[44px] leading-none tracking-[-0.03em] tabular-nums text-[var(--ink)]">
						{tl.pomoDisplay}
					</span>
					<span class="font-mono text-[10px] tracking-[0.20em] uppercase mt-1
								 {tl.paused ? 'text-[var(--ink-300)]' : 'text-[var(--accent)]'}">
						{tl.paused ? 'paused' : 'focus'}
					</span>
				</div>
			</div>

			<div class="flex gap-2 w-full max-w-[260px]">
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
		<div class="flex-1 flex flex-col justify-center px-10 min-h-0 gap-8">

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
