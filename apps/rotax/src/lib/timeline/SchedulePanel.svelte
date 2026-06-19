<script lang="ts">
import { tl, HOUR_START, HOUR_END, HOUR_PX } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

const hours = Array.from(
	{ length: HOUR_END - HOUR_START + 1 },
	(_, i) => HOUR_START + i,
);

const totalHeight = (HOUR_END - HOUR_START + 1) * HOUR_PX;

let scrollEl: HTMLDivElement;
$effect(() => {
	if (scrollEl) scrollEl.scrollTop = Math.max(0, tl.nowTopPx - 160);
});

const STATE_BG: Record<string, string> = {
	done:     "transparent",
	active:   "var(--surface)",
	upcoming: "var(--surface)",
	backlog:  "var(--surface)",
};
const STATE_BORDER: Record<string, string> = {
	done:     "var(--line)",
	active:   "var(--accent)",
	upcoming: "var(--line-strong)",
	backlog:  "var(--line)",
};
const STATE_BAR: Record<string, string> = {
	done:     "var(--positive)",
	active:   "var(--accent)",
	upcoming: "var(--ink-300)",
	backlog:  "var(--line)",
};
</script>

<div class="flex flex-col h-full border-l border-[var(--line)] min-w-0">

	<div class="px-4 h-11 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-500)]">
			Today
		</span>
	</div>

	<div bind:this={scrollEl} class="flex-1 overflow-y-auto no-scrollbar relative">
		<div class="relative" style="height: {totalHeight + 48}px;">

			<!-- Hour grid -->
			{#each hours as h}
				<div class="absolute left-0 right-0 flex pointer-events-none"
					style="top: {(h - HOUR_START) * HOUR_PX}px; height: {HOUR_PX}px;">
					<div class="w-11 shrink-0 flex justify-end items-start pr-2 pt-2">
						<span class="font-mono text-[10.5px] tabular-nums text-[var(--ink-500)]">
							{String(h).padStart(2, "0")}
						</span>
					</div>
					<div class="flex-1 border-t border-[var(--line)]"></div>
				</div>
			{/each}

			<!-- Task blocks -->
			{#each tl.scheduled as task (task.id)}
				{@const top = (task.start - HOUR_START) * HOUR_PX + 2}
				{@const height = Math.max(40, (task.end - task.start) * HOUR_PX - 6)}
				{@const isHero = tl.heroTask?.id === task.id}
				<button
					type="button"
					onclick={() => task.state !== "done" && tl.ignite(task)}
					disabled={task.state === "done"}
					class="absolute left-11 right-1.5 text-left transition-all
						   {task.state === 'done' ? 'cursor-default opacity-40' : 'cursor-pointer'}"
					style="top: {top}px; height: {height}px;">

					<div class="relative h-full overflow-hidden transition-colors border"
						style="background: {STATE_BG[task.state]}; border-color: {STATE_BORDER[task.state]};
							   {isHero ? 'box-shadow: 0 0 0 1px var(--accent);' : ''}">

						<!-- Left accent bar -->
						<div class="absolute left-0 top-0 bottom-0 w-[3px]"
							style="background: {STATE_BAR[task.state]}"></div>

						<!-- Progress fill (active) -->
						{#if task.state === "active" && isHero}
							<div class="absolute inset-y-0 left-0 pointer-events-none bg-[var(--accent-soft)] transition-all"
								style="width: {tl.pomoProgress * 100}%"></div>
						{/if}

						<div class="relative pl-3 pr-2 py-2 h-full flex flex-col justify-center gap-0.5">
							<p class="text-[12px] leading-[1.3] font-medium
									  {task.state === 'done' ? 'line-through text-[var(--ink-300)]' : 'text-[var(--ink)]'}
									  {height < 44 ? 'truncate' : ''}">
								{task.title}
							</p>
							{#if height > 46}
								<p class="font-mono text-[10px] tracking-[0.04em] text-[var(--ink-300)] tabular-nums">
									{hhmm(task.start)} – {hhmm(task.end)}
								</p>
							{/if}
						</div>
					</div>
				</button>
			{/each}

			<!-- NOW line -->
			{#if tl.nowHour >= HOUR_START && tl.nowHour <= HOUR_END}
				<div class="absolute left-11 right-0 pointer-events-none z-10"
					style="top: {tl.nowTopPx}px;">
					<div class="relative border-t-2 border-[var(--accent)]"
						style="box-shadow: 0 0 8px rgba(241,83,31,0.25)">
						<div class="absolute -left-[4px] -top-[4px] w-[8px] h-[8px]
									rounded-full bg-[var(--accent)]"></div>
					</div>
				</div>
			{/if}

		</div>
	</div>

</div>
