<script lang="ts">
import { fly } from "svelte/transition";
import { cubicOut } from "svelte/easing";
import { dashboard } from "$lib/dashboard/state.svelte";
import { HOUR_TICKS, pct, fmtHour } from "$lib/dashboard/format";
</script>

<!-- Multi-day timeline: a vertical stack of day rows, today on top. -->
<div class="relative flex flex-col min-h-0 overflow-y-auto no-scrollbar px-8 pb-8">
  <!-- Back to today -->
  <div class="sticky top-0 z-10 flex justify-end py-3 bg-[#F7F5F1]/90 backdrop-blur">
    <button type="button" onclick={() => dashboard.backToToday()}
      class="font-mono text-[10px] tracking-[0.08em] uppercase text-[#F1531F] hover:text-[#D8430F] transition-colors">← Back to today</button>
  </div>

  {#each dashboard.timelineDays as day, i (day.key)}
    <div class="flex items-stretch gap-6 border-b border-[#0E0E0C]/15 first:border-t"
      in:fly={{ x: -12, duration: 320, delay: i * 45, easing: cubicOut }}>
      <!-- Date label -->
      <div class="shrink-0 w-20 flex items-center justify-center py-6">
        <span class="font-semibold tabular-nums leading-none {day.isToday ? 'text-[28px]' : 'text-[34px]'}"
          style="font-family: var(--font-display);"
          class:text-[#0E0E0C]={true}>{day.label}</span>
      </div>

      <!-- Day timeline body -->
      <div class="relative flex-1 min-w-0 h-28">
        <!-- baseline -->
        <div class="absolute left-0 right-0 h-px bg-[#DCDAD3]" style="top: 50%"></div>

        <!-- hour ticks -->
        {#each HOUR_TICKS as h}
          <span class="absolute w-px h-2 bg-[#E2E0D8] -translate-x-1/2" style="left: {pct(h)}%; top: calc(50% - 4px)"></span>
          <span class="absolute -translate-x-1/2 font-mono text-[8px] tracking-[0.06em] text-[#C7C5BE] tabular-nums" style="left: {pct(h)}%; bottom: 4px">{fmtHour(h)}</span>
        {/each}

        <!-- span bars -->
        {#each day.laid as { span, lane } (span.id)}
          <button type="button" onclick={() => (dashboard.pinned = span)}
            title="{span.title}  ·  {fmtHour(span.start)}:00 → {fmtHour(span.end)}:00"
            class="absolute h-7 rounded-md border cursor-pointer transition-opacity hover:opacity-80"
            class:bg-[#F2D3C8]={span.state !== "active"}
            class:border-[#D9B3A6]={span.state !== "active"}
            class:bg-[#F1531F]={span.state === "active"}
            class:border-[#D8430F]={span.state === "active"}
            style="left: {pct(span.start)}%; width: {pct(span.end) - pct(span.start)}%; top: calc(20% + {lane * 8}px)"></button>
        {/each}

        <!-- NOW marker (today only) -->
        {#if day.isToday && dashboard.nowOnAxis}
          <div class="absolute top-2 bottom-2 w-px bg-[#F1531F] -translate-x-1/2 pointer-events-none"
            style="left: {pct(dashboard.nowHour)}%">
            <span class="absolute -top-0.5 left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full bg-[#F7F5F1] ring-2 ring-[#F1531F]"></span>
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>
