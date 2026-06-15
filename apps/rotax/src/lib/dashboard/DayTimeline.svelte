<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
import { HOUR_TICKS, pct, fmtHour, laneTop, hhmm } from "$lib/dashboard/format";
</script>

<!-- R1C1: Day Timeline (fills the ceiling zone) -->
<div class="col-start-1 row-start-1 flex flex-col justify-start pt-4 pb-6 pr-8">
  <!-- header -->
  <div class="flex items-baseline gap-3 mb-4">
    <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2]">Today</span>
    <span class="font-mono text-[9px] tracking-[0.08em] uppercase text-[#6E6E69] tabular-nums">{dashboard.dateLabel}</span>
  </div>

  <!-- timeline body -->
  <div class="relative h-12">
    <!-- baseline -->
    <div class="absolute left-0 right-0 h-px bg-[#DCDAD3]" style="top: 12px"></div>

    <!-- hour ticks (mark on the baseline, label at the bottom) -->
    {#each HOUR_TICKS as h}
      <span class="absolute w-px h-1.5 bg-[#D2D0C8] -translate-x-1/2" style="left: {pct(h)}%; top: 9px"></span>
      <span class="absolute -translate-x-1/2 font-mono text-[8.5px] tracking-[0.06em] text-[#C7C5BE] tabular-nums" style="left: {pct(h)}%; top: 38px">{fmtHour(h)}</span>
    {/each}

    <!-- task spans stacked into up to 3 lanes -->
    {#each dashboard.laidSpans as { span, lane, overlap, underActive } (span.id)}
      <button type="button" onclick={() => (dashboard.pinned = span)}
        title="{span.title}  ·  {fmtHour(span.start)}:00 → {fmtHour(span.end)}:00"
        class="group absolute h-[5px] rounded-full cursor-pointer transition-opacity hover:opacity-80"
        class:bg-[#A8A8A2]={span.state === "done"}
        class:bg-[#F1531F]={span.state === "active"}
        class:bg-[#C2C0B8]={span.state === "upcoming"}
        style="left: {pct(span.start)}%; width: {pct(span.end) - pct(span.start)}%; top: {laneTop(lane)}px">
        {#if span.state === "active"}
          <span class="absolute bottom-full left-0 mb-1 whitespace-nowrap font-mono text-[8.5px] tracking-[0.08em] uppercase text-[#F1531F]">
            {span.id} · {span.title}
          </span>
        {:else if !underActive}
          <span class="absolute bottom-full left-0 mb-1 whitespace-nowrap font-mono text-[8.5px] tracking-[0.06em] uppercase text-[#A8A8A2] opacity-0 group-hover:opacity-100 transition-opacity">
            {overlap > 1 ? `×${overlap}` : span.title}
          </span>
        {/if}
      </button>
    {/each}

    <!-- NOW marker: orange while on the active task, grey in the gaps -->
    {#if dashboard.nowOnAxis}
      <div class="absolute w-px -translate-x-1/2 pointer-events-none transition-colors"
        class:bg-[#F1531F]={dashboard.onActiveTask} class:bg-[#A8A8A2]={!dashboard.onActiveTask}
        style="left: {pct(dashboard.nowHour)}%; top: 6px; height: 30px">
        <span class="absolute top-[2.5px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full bg-[#F7F5F1] ring-2 transition-colors"
          class:ring-[#F1531F]={dashboard.onActiveTask} class:ring-[#A8A8A2]={!dashboard.onActiveTask}></span>
        <span class="absolute top-[38px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8.5px] tracking-[0.08em] uppercase tabular-nums transition-colors"
          class:text-[#F1531F]={dashboard.onActiveTask} class:text-[#A8A8A2]={!dashboard.onActiveTask}>Now {hhmm(dashboard.nowHour)}</span>
      </div>
    {/if}
  </div>
</div>
