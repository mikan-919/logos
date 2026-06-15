<script lang="ts">
import { dashboard } from "$lib/dashboard/state.svelte";
import NewTaskBar from "$lib/dashboard/NewTaskBar.svelte";
import DayTimeline from "$lib/dashboard/DayTimeline.svelte";
import HeroStage from "$lib/dashboard/HeroStage.svelte";
import TaskPool from "$lib/dashboard/TaskPool.svelte";
import Trajectory from "$lib/dashboard/Trajectory.svelte";
import EditModal from "$lib/dashboard/EditModal.svelte";

$effect(() => dashboard.startClocks());
</script>

<div class="w-dvw h-dvh bg-[#F7F5F1] text-[#0E0E0C] grid overflow-hidden" style="grid-template-rows: 4.5rem 1fr 12rem;">
  <NewTaskBar />
  <div class="grid px-8 border-b border-[#DCDAD3]" style="grid-template-columns: 1fr auto; grid-template-rows: 5fr auto auto 3fr auto;">
    <DayTimeline />
    <HeroStage />
  </div>
  <div class="grid" style="grid-template-columns: 280px 1fr;">
    <TaskPool />
    <Trajectory />
  </div>
</div>
<EditModal />
<svelte:window onkeydown={(e) => {
  if (e.key === "Escape") { dashboard.editing = null; dashboard.reschedTask = null; }
}} />
