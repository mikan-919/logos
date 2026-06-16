<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
import { hold } from "$lib/dashboard/format";
import { flip } from "$lib/dashboard/flip";
</script>

<!-- Progress bar + controls. Shared by the full HeroStage (today) and the
     compact strip (timeline). The grid-placement classes only apply when
     mounted inside the center grid; they are inert in the compact strip. -->
<div use:flip={{ key: "progress" }} class="col-span-2 row-start-5 px-8 flex items-center gap-6 pb-6">

  <!-- elapsed % -->
  <span class="font-mono text-[10px] tracking-[0.08em] text-[#A8A8A2] tabular-nums shrink-0">
    {String(dashboard.elapsedPct).padStart(3, "0")}%
  </span>

  <!-- track -->
  <div class="relative flex-1 h-[6px] rounded-full bg-[#E6E4DD] overflow-hidden">
    <!-- fill -->
    <div class="absolute left-0 top-0 h-full rounded-full bg-[#F1531F] transition-[width] duration-200 ease-linear"
      class:opacity-40={!dashboard.running} style="width: {dashboard.heroPctExact}%"></div>
    <!-- pomodoro points: predicted (hollow) on the track, recorded (solid) over the fill -->
    <div class="absolute inset-0 pointer-events-none">
      {#each dashboard.pomoForecast as m}
        <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[6px] h-[6px] bg-[#F1531F]/50" style="left: {m}%"></div>
      {/each}
      {#each dashboard.pomoHistory as m}
        <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[6px] h-[6px] bg-[#F1531F]" style="left: {m}%"></div>
      {/each}
    </div>
    <!-- moving head -->
    {#if dashboard.running && dashboard.activeTask}
      <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-[#F1531F] ring-2 ring-[#F7F5F1]"
        style="left: {dashboard.heroPctExact}%"></div>
    {/if}
  </div>

  <!-- controls -->
  <div class="flex items-center gap-2 shrink-0">
    {#if dashboard.activeTask}
      <button onclick={dashboard.togglePause}
        class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
               px-3 h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37]
               hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">
        {#if dashboard.running}
          <span class="text-[8px]">❚❚</span> Pause
        {:else}
          <span class="text-[9px]">▶</span> Resume
        {/if}
      </button>
      <button use:hold={{ onhold: dashboard.completeActive }}
        class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
               px-3 h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors select-none touch-none">
        <span class="text-[10px]">✓</span> Hold to Complete
      </button>
    {:else if dashboard.heroTask}
      <button use:hold={{ onhold: () => dashboard.heroTask && dashboard.startTask(dashboard.heroTask) }}
        class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
               px-4 h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors select-none touch-none">
        <span class="text-[9px]">▶</span> Hold to Start
      </button>
    {/if}
  </div>
</div>
