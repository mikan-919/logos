<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
</script>

<div class="row-1/2 flex items-center gap-4 px-8 border-b border-[#DCDAD3]">
  <span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0">New&nbsp;Task</span>
  <span class="text-[#C2C0B8] shrink-0">＋</span>
  <input
    type="text"
    bind:value={dashboard.newTaskTitle}
    onkeydown={(e) => e.key === "Enter" && dashboard.addTask()}
    placeholder="What needs to be done?"
    class="flex-1 min-w-0 bg-transparent border-0 outline-none
           text-[clamp(16px,1.8vw,24px)] tracking-[-0.01em] text-[#0E0E0C]
           placeholder:text-[#C2C0B8] placeholder:font-normal"
    style="font-family: var(--font-display);" />
  <button onclick={dashboard.addTask} disabled={!dashboard.newTaskTitle.trim()}
    class="shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-9 rounded-full
           bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors
           disabled:opacity-30 disabled:hover:bg-[#F1531F]">
    Add ↵
  </button>
</div>
