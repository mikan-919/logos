<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
import { flip } from "$lib/dashboard/flip";
</script>

<!-- Task Pool -->
<div use:flip={{ key: "taskpool" }} class="flex items-start gap-4 {dashboard.view==="today" ? "h-50": "h-full"} px-6 py-6 pb-0 border-r border-[#DCDAD3] min-h-0 overflow-hidden">
  <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0"
    style="writing-mode: vertical-lr; transform: rotate(180deg);">TASK POOL</span>
  <div class="no-scrollbar flex flex-col gap-1 flex-1 min-w-0 h-full overflow-y-auto pr-1">
    {#each dashboard.backlog as task}
      <div
        onmouseenter={() => dashboard.hoverTask(task.id)}
        onmouseleave={() => dashboard.hoverTask(null)}
        onclick={() => { dashboard.pinned = task; dashboard.hoverTask(null); }}
        class="group flex items-center py-0.5 cursor-pointer"
        role="presentation">
        <span class="text-[14px] italic text-[#3A3A37] truncate group-hover:text-[#0E0E0C] transition-colors">- {task.title}</span>
      </div>
    {/each}
  </div>
</div>
