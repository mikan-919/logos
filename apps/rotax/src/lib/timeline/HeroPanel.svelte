<script lang="ts">
import { tl } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

const C = 2 * Math.PI * 88;
const strokeOffset = $derived(C * (1 - tl.pomoProgress));
const isActive = $derived(!!tl.ignited);
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
		<!-- ACTIVE: ring is the focus, sidebars dimmed by parent -->
		<div class="flex-1 flex flex-col items-center justify-center gap-6 px-10 min-h-0">

			<p class="text-[15px] text-[var(--ink-500)] text-center leading-[1.3] max-w-sm">
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

	{:else}
		<!-- IDLE: task title + primary CTA -->
		<div class="flex-1 flex flex-col justify-center px-10 min-h-0 gap-10">

			{#if tl.heroTask}
				<div>
					<h2 class="text-[clamp(28px,3vw,44px)] leading-[1.1] tracking-[-0.02em] text-[var(--ink)] mb-3">
						{tl.heroTask.title}
					</h2>
					{#if tl.heroTask.description}
						<p class="text-[14px] leading-[1.55] text-[var(--ink-300)] max-w-sm">
							{tl.heroTask.description}
						</p>
					{/if}
				</div>

				<div class="flex flex-col gap-3 max-w-sm">
					<button type="button" onclick={() => tl.ignite(tl.heroTask!)}
						class="w-full py-4 bg-[var(--accent)] text-white font-mono text-[13px]
							   tracking-[0.10em] uppercase hover:bg-[var(--accent-hover)]
							   transition-colors flex items-center justify-center gap-3">
						<span class="text-[18px] leading-none">▶</span>
						今すぐ開始
					</button>
					<p class="font-mono text-[10px] tracking-[0.06em] text-[var(--ink-300)] text-center leading-[1.7]">
						または左のバックログ・右のスケジュールから選択
					</p>
				</div>

			{:else}
				<div class="flex flex-col items-center gap-4 text-center">
					<p class="text-[clamp(20px,2.4vw,32px)] text-[var(--ink-300)] leading-[1.2]">
						今日のタスクがありません
					</p>
					<p class="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
						左のバックログから選んで開始
					</p>
				</div>
			{/if}

		</div>

	{/if}

	<div class="h-11 border-t border-[var(--line)] shrink-0"></div>

</div>
