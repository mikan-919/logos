<script lang="ts">
import { fade, fly } from "svelte/transition";
import { cubicOut } from "svelte/easing";
import { dashboard } from "$lib/dashboard/state.svelte";
import { mmss } from "$lib/dashboard/format";
import ProgressBar from "$lib/dashboard/ProgressBar.svelte";
</script>

<!-- R2C1: HAVE A NEXT label (bottom-aligned to the divider) -->
<div class="flex items-end">
  <p class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[#6E6E69] mb-2">
    {dashboard.heroLabel} &nbsp;&nbsp; {dashboard.heroTime}
  </p>
</div>

<!-- R3C1: Title + description -->
<div class="col-start-1 row-start-3 flex flex-col justify-start">
  <div class="w-[55%] h-px bg-[#DCDAD3] mb-2"></div>
  <!-- grid-overlap so the outgoing and incoming task share one cell and
       cross-animate: old slides up + fades, new fades in from below. -->
  <div class="grid overflow-hidden">
    {#key dashboard.heroTask?.id}
      <div class="col-start-1 row-start-1"
        in:fly={{ y: 28, duration: 320, easing: cubicOut }}
        out:fly={{ y: -28, duration: 240, easing: cubicOut }}>
        <h1 class="font-bold text-[clamp(48px,6vw,96px)] tracking-[-0.03em] leading-[0.95] mb-4 transition-colors"
          class:text-[#0E0E0C]={!dashboard.heroIsUpcoming} class:text-[#B0AEA7]={dashboard.heroIsUpcoming}
          style="font-family: var(--font-display);">
          {dashboard.heroTask?.title ?? "No tasks scheduled"}
        </h1>
        <div class="text-[14px] leading-[1.55] transition-colors"
          class:text-[#3A3A37]={!dashboard.heroIsUpcoming} class:text-[#B0AEA7]={dashboard.heroIsUpcoming}>
          <p class="m-0">{dashboard.heroTask?.description ?? ""}</p>
          {#each dashboard.heroTask?.todos ?? [] as todo}
            <p class="m-0">- {todo}</p>
          {/each}
        </div>
      </div>
    {/key}
  </div>
</div>

<!-- R3C2: hairline (top, aligned with HAVE A NEXT bottom) + Task intelligence -->
<div class="col-start-2 row-start-3 flex flex-col gap-4 pl-8 w-[220px]">
  <div class="w-full h-px bg-[#DCDAD3]"></div>

  <!-- Hero metric: the pomodoro timer (focal point, phase-coloured accent) -->
  <div class="flex flex-col border-l-2 pl-4 -ml-px transition-colors"
    class:border-[#F1531F]={dashboard.activeTask && !dashboard.onBreak}
    class:border-[#2E6F4E]={dashboard.activeTask && dashboard.onBreak}
    class:border-[#DCDAD3]={!dashboard.activeTask}>
    <span class="self-start inline-flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] uppercase px-2.5 h-[24px] rounded-full mb-2.5 transition-colors"
      class:bg-[#F1531F]={dashboard.activeTask && !dashboard.onBreak} class:text-white={!!dashboard.activeTask}
      class:bg-[#2E6F4E]={dashboard.activeTask && dashboard.onBreak}
      class:bg-transparent={!dashboard.activeTask} class:text-[#A8A8A2]={!dashboard.activeTask}
      class:ring-1={!dashboard.activeTask} class:ring-[#DCDAD3]={!dashboard.activeTask}>
      {#if dashboard.activeTask}
        <span class="w-1.5 h-1.5 rounded-full bg-white" class:animate-pulse={dashboard.running}></span>
        {dashboard.onBreak ? "Break" : "Focus"}
      {:else}
        Ready
      {/if}
    </span>
    <span class="font-mono text-[54px] leading-[0.85] tracking-[-0.03em] tabular-nums transition-colors"
      class:text-[#0E0E0C]={dashboard.activeTask && !dashboard.onBreak} class:text-[#2E6F4E]={dashboard.activeTask && dashboard.onBreak}
      class:text-[#C2C0B8]={!dashboard.activeTask}>{dashboard.activeTask ? mmss(dashboard.pomoRemaining) : "--:--"}</span>
  </div>

  <!-- Task stats -->
  <div class="flex flex-col gap-1 pt-1 border-t border-[#EDEBE4]">
    {#each dashboard.taskStats as row}
      <div class="flex justify-between gap-2">
        <span class="font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">{row.key}</span>
        <span class="font-mono text-[9px] tracking-[0.04em] tabular-nums text-[#3A3A37]">{row.value}</span>
      </div>
    {/each}
  </div>

  <!-- Today stats -->
  <div class="flex flex-col gap-1 pt-2 border-t border-[#EDEBE4]">
    <span class="font-mono text-[8.5px] tracking-[0.12em] uppercase text-[#C7C5BE] mb-0.5">Today</span>
    {#each dashboard.dayStats as row}
      <div class="flex justify-between gap-2">
        <span class="font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">{row.key}</span>
        <span class="font-mono text-[9px] tracking-[0.04em] tabular-nums {row.accent ? 'text-[#2E6F4E]' : 'text-[#3A3A37]'}">{row.value}</span>
      </div>
    {/each}
  </div>
</div>
