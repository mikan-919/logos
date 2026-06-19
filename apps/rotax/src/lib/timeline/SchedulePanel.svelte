<script lang="ts">
import { tl, HOUR_START, HOUR_END } from "./state.svelte";
import { hhmm } from "$lib/dashboard/format";

// Gap compression: proportional to hours, capped
const GAP_PX_PER_HOUR = 28;
const GAP_MIN = 6;
const GAP_MAX = 56;

// Task height: proportional to duration, with min/max
const TASK_PX_PER_HOUR = 56;
const TASK_MIN = 48;
const TASK_MAX = 140;

type Item = {
	task: { id: string; start: number; end: number; title: string; state?: string };
	gapPx: number;
	taskHeight: number;
	crossesMidnight: boolean;
	isCursor: boolean;
	isDone: boolean;
	isClickable: boolean;
};

const items = $derived.by((): Item[] => {
	const tasks = tl.viewDayTasks;
	return tasks.map((task, i) => {
		const prev = tasks[i - 1];
		const gapHours = prev ? Math.max(0, task.start - prev.end) : Math.max(0, task.start - HOUR_START);
		const gapPx = Math.min(Math.max(gapHours * GAP_PX_PER_HOUR, GAP_MIN), GAP_MAX);
		const dur = Math.max(0, Math.min(task.end, HOUR_END) - Math.max(task.start, HOUR_START));
		const taskHeight = Math.min(Math.max(dur * TASK_PX_PER_HOUR, TASK_MIN), TASK_MAX);
		return {
			task,
			gapPx,
			taskHeight,
			crossesMidnight: task.end > 24,
			isCursor: tl.viewDayOffset === 0 && tl.selected?.id === task.id && !tl.ignited,
			isDone: 'state' in task && task.state === "done",
			isClickable: tl.viewDayOffset === 0 && !('state' in task && task.state === "done"),
		};
	});
});

// NOW: index after which the now-line should appear
const nowInsertIdx = $derived.by(() => {
	if (tl.viewDayOffset !== 0) return -1;
	const h = tl.nowHour;
	const tasks = tl.viewDayTasks;
	let idx = -1;
	for (let i = 0; i < tasks.length; i++) {
		if (tasks[i].start <= h) idx = i;
	}
	return idx;
});
</script>

<div class="flex flex-col h-full border-l border-[var(--line)] min-w-0">

	<div class="px-4 h-11 flex items-center gap-2 border-b border-[var(--line)] shrink-0">
		<span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--ink-500)]">
			{tl.viewDayOffset === 0 ? 'Today' : tl.viewDateLabel}
		</span>
	</div>

	<div class="flex-1 overflow-y-auto no-scrollbar px-2 pt-3 pb-6">

		{#each items as item, i (item.task.id)}
			<!-- NOW line: appears between the last started task and the next -->
			{#if tl.viewDayOffset === 0 && nowInsertIdx === i - 1}
				<div class="flex items-center gap-2 my-1">
					<span class="font-mono text-[9px] text-[var(--accent)] tabular-nums w-10 text-right shrink-0">
						{hhmm(tl.nowHour)}
					</span>
					<div class="flex-1 border-t-2 border-[var(--accent)] relative">
						<div class="absolute -left-[3px] -top-[4px] w-[6px] h-[6px] rounded-full bg-[var(--accent)]"></div>
					</div>
				</div>
			{/if}

			<!-- Gap + task row -->
			<div style="margin-top: {item.gapPx}px" class="flex items-start gap-2">

				<!-- Time anchor -->
				<span class="font-mono text-[10px] tabular-nums text-[var(--ink-300)] w-10 text-right shrink-0 pt-[10px] leading-none">
					{hhmm(item.task.start)}
				</span>

				<!-- Task block -->
				<button
					type="button"
					onclick={() => item.isClickable && 'state' in item.task && tl.select(item.task as any)}
					disabled={!item.isClickable}
					style="height: {item.taskHeight}px"
					class="flex-1 min-w-0 text-left transition-all
						   {item.isClickable ? 'cursor-pointer' : 'cursor-default'}
						   {item.isDone ? 'opacity-35' : ''}">

					<div class="relative h-full overflow-hidden border transition-all
								{item.isCursor
									? 'bg-[var(--accent)] border-[var(--accent)]'
									: item.isDone
										? 'bg-transparent border-[var(--line)]'
										: tl.viewDayOffset !== 0
											? 'bg-[var(--paper)] border-[var(--line)]'
											: 'bg-[var(--surface)] border-[var(--line-strong)] hover:border-[var(--accent)]'}">

						<!-- Left accent bar -->
						{#if !item.isCursor && !item.isDone}
							<div class="absolute left-0 top-0 bottom-0 w-[3px]
										{tl.viewDayOffset !== 0 ? 'bg-[var(--line)]' : 'bg-[var(--line-strong)]'}">
							</div>
						{/if}

						<div class="relative pl-3 pr-2 py-2 h-full flex flex-col justify-center gap-0.5">
							<p class="text-[12px] leading-[1.3] font-medium
									  {item.isCursor ? 'text-white' : item.isDone ? 'line-through text-[var(--ink-300)]' : tl.viewDayOffset !== 0 ? 'text-[var(--ink-300)]' : 'text-[var(--ink)]'}
									  {item.taskHeight < 52 ? 'truncate' : ''}">
								{item.task.title}
							</p>
							{#if item.taskHeight > 52 && !item.crossesMidnight}
								<p class="font-mono text-[10px] tracking-[0.04em] tabular-nums
										  {item.isCursor ? 'text-white/70' : 'text-[var(--ink-300)]'}">
									{hhmm(item.task.start)} – {hhmm(item.task.end)}
								</p>
							{/if}
							{#if item.crossesMidnight}
								<p class="font-mono text-[9px] tracking-[0.06em]
										  {item.isCursor ? 'text-white/60' : 'text-[var(--ink-300)]'}">
									↓ 翌
								</p>
							{/if}
						</div>
					</div>
				</button>
			</div>
		{/each}

		<!-- NOW line at end if after all tasks -->
		{#if tl.viewDayOffset === 0 && nowInsertIdx === items.length - 1}
			<div class="flex items-center gap-2 mt-2">
				<span class="font-mono text-[9px] text-[var(--accent)] tabular-nums w-10 text-right shrink-0">
					{hhmm(tl.nowHour)}
				</span>
				<div class="flex-1 border-t-2 border-[var(--accent)] relative">
					<div class="absolute -left-[3px] -top-[4px] w-[6px] h-[6px] rounded-full bg-[var(--accent)]"></div>
				</div>
			</div>
		{/if}

	</div>

</div>
