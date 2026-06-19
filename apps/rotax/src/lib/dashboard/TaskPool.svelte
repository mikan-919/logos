<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
import { flip } from "$lib/dashboard/flip";
</script>

<!-- Task Pool -->
<div use:flip={{ key: "taskpool" }} class="flex items-start gap-4 {dashboard.view==="today" ? "h-50": "h-full"} px-6 py-6 pb-0 border-r border-[#DCDAD3] min-h-0 overflow-hidden">
  <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0"
    style="writing-mode: vertical-lr; transform: rotate(180deg);">TASK POOL</span>
  <div class="no-scrollbar flex flex-col gap-0.5 flex-1 min-w-0 h-full overflow-y-auto pr-1">
    {#if dashboard.backlog.length === 0}
      <span class="text-[12px] text-[#C2C0B8] italic py-1">No unscheduled tasks.</span>
    {/if}
    {#each dashboard.backlog as task}
      <button type="button"
        onmouseenter={() => dashboard.hoverTask(task.id)}
        onmouseleave={() => dashboard.hoverTask(null)}
        onclick={() => { dashboard.pinned = task; dashboard.hoverTask(null); }}
        class="group flex items-center gap-2 w-full text-left px-2 py-1 -mx-2 rounded-sm cursor-pointer
               hover:bg-[#FFFFFF] focus-visible:bg-[#FFFFFF] outline-none
               focus-visible:ring-1 focus-visible:ring-[#F1531F] transition-colors">
        <span class="font-mono text-[11px] text-[#C2C0B8] shrink-0 group-hover:text-[#F1531F] group-focus-visible:text-[#F1531F] transition-colors">›</span>
        <span class="text-[14px] text-[#3A3A37] truncate group-hover:text-[#0E0E0C] transition-colors">{task.title}</span>
      </button>
    {/each}
  </div>
</div>
