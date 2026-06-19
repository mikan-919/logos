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
	if (scrollEl) {
		scrollEl.scrollTop = Math.max(0, tl.nowTopPx - 160);
	}
});

const STATE_COLOR: Record<string, string> = {
	done: "var(--positive)",
	active: "var(--accent)",
	upcoming: "var(--line-strong)",
	backlog: "var(--line)",
};
</script>

<!-- Right column: today's vertical schedule -->
<div class="flex flex-col h-full border-l border-[var(--line)] min-w-0">

	<div class="px-4 h-10 flex items-center border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-300)]">
			Today
		</span>
	</div>

	<div bind:this={scrollEl} class="flex-1 overflow-y-auto no-scrollbar relative">
		<div class="relative" style="height: {totalHeight + 48}px;">

			<!-- Hour grid -->
			{#each hours as h}
				<div class="absolute left-0 right-0 flex items-start pointer-events-none"
					style="top: {(h - HOUR_START) * HOUR_PX}px;">
					<div class="w-12 shrink-0 flex justify-end pr-2 pt-1">
						<span class="font-mono text-[9.5px] tabular-nums text-[var(--ink-300)]">
							{String(h).padStart(2, "0")}
						</span>
					</div>
					<div class="flex-1 border-t border-[var(--line)]"></div>
				</div>
			{/each}

			<!-- Task blocks -->
			{#each tl.scheduled as task (task.id)}
				{@const top = (task.start - HOUR_START) * HOUR_PX}
				{@const height = Math.max(28, (task.end - task.start) * HOUR_PX - 4)}
				{@const isHero = tl.heroTask?.id === task.id}
				<button
					type="button"
					onclick={() => !task.state.includes("done") && tl.ignite(task)}
					disabled={task.state === "done"}
					class="absolute left-12 right-2 text-left transition-colors
						   {task.state === 'done' ? 'cursor-default opacity-50' : 'cursor-pointer'}"
					style="top: {top}px; height: {height}px;">
					<div class="relative h-full border overflow-hidden transition-colors
								{isHero ? 'border-[var(--accent)] bg-[var(--surface)]' : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]'}">
						<!-- left accent bar -->
						<div class="absolute left-0 top-0 bottom-0 w-0.5 transition-colors"
							style="background: {STATE_COLOR[task.state] ?? 'var(--line)'}"></div>
						<!-- progress fill for active -->
						{#if task.state === "active" && isHero}
							<div class="absolute inset-y-0 left-0 bg-[var(--accent-soft)] pointer-events-none transition-all"
								style="width: {tl.pomoProgress * 100}%"></div>
						{/if}
						<div class="relative px-2 py-1.5 h-full flex flex-col justify-center">
							<p class="font-mono text-[9.5px] tracking-[0.04em] leading-none
									  truncate {task.state === 'done' ? 'line-through text-[var(--ink-300)]' : 'text-[var(--ink-700)]'}">
								{task.title}
							</p>
							{#if height > 42}
								<p class="font-mono text-[9px] tracking-[0.04em] text-[var(--ink-300)] mt-0.5 tabular-nums">
									{hhmm(task.start)} – {hhmm(task.end)}
								</p>
							{/if}
						</div>
					</div>
				</button>
			{/each}

			<!-- NOW line -->
			{#if tl.nowHour >= HOUR_START && tl.nowHour <= HOUR_END}
				<div class="absolute left-12 right-0 pointer-events-none z-10"
					style="top: {tl.nowTopPx}px;">
					<div class="relative border-t border-[var(--accent)]"
						style="box-shadow: 0 0 6px rgba(241,83,31,0.3)">
						<div class="absolute -left-[3px] -top-[3px] w-[6px] h-[6px]
									rounded-full bg-[var(--accent)]"
							style="box-shadow: 0 0 6px var(--accent)"></div>
					</div>
				</div>
			{/if}

		</div>
	</div>

</div>
