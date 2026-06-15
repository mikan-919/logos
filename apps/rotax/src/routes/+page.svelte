<script lang="ts">
import { tick } from "svelte";
import { dashboard } from "$lib/dashboard/state.svelte";
import { captureFlip, flip } from "$lib/dashboard/flip";
import NewTaskBar from "$lib/dashboard/NewTaskBar.svelte";
import DayTimeline from "$lib/dashboard/DayTimeline.svelte";
import HeroStage from "$lib/dashboard/HeroStage.svelte";
import ProgressBar from "$lib/dashboard/ProgressBar.svelte";
import TaskPool from "$lib/dashboard/TaskPool.svelte";
import Trajectory from "$lib/dashboard/Trajectory.svelte";
import TimelineView from "$lib/dashboard/TimelineView.svelte";
import EditModal from "$lib/dashboard/EditModal.svelte";

$effect(() => dashboard.startClocks());

// Capture every shared element's rect, flip the view, then let the freshly
// mounted nodes animate from First → Last on the next tick. Each matching
// element (clock, progress bar, trajectory, task pool) morphs to its new spot.
async function switchView(next: "today" | "timeline") {
  if (dashboard.view === next) return;
  captureFlip(["daytimeline", "progress", "trajectory", "taskpool", "divider-center"]);
  dashboard.view = next;
  await tick();
}

function onKeydown(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  if (e.key === "Escape") {
    if (dashboard.editing || dashboard.reschedTask) {
      dashboard.editing = null;
      dashboard.reschedTask = null;
      return;
    }
    if (dashboard.view === "timeline") switchView("today");
    return;
  }
  if (typing) return;
  if (e.key === "t" || e.key === "T") {
    e.preventDefault();
    switchView(dashboard.view === "today" ? "timeline" : "today");
  }
}
</script>

<div class="w-dvw h-dvh bg-[#F7F5F1] text-[#0E0E0C] grid overflow-hidden"
  style="grid-template-rows: {dashboard.view === 'today' ? '4.5rem 1fr 12rem' : '4.5rem auto 1fr'};">
  <NewTaskBar />

  {#if dashboard.view === "today"}
    <div class="grid px-8" style="grid-template-columns: 1fr auto; grid-template-rows: 5fr auto auto 3fr auto;">
      <DayTimeline />
      <HeroStage />
    </div>
    <!-- Lower region. The divider at its top is the same FLIP element as the
         compact-strip divider, so the boundary line slides between views. -->
    <div class="flex flex-col min-h-0">
      <div use:flip={{ key: "divider-center" }} class="h-px bg-[#DCDAD3] shrink-0"></div>
      <div class="grid flex-1 min-h-0" style="grid-template-columns: 280px 1fr;">
        <TaskPool />
        <Trajectory />
      </div>
    </div>
  {:else}
    <!-- Compact today strip: keep only the clock (DayTimeline) and the
         progress/controls bar; each FLIPs individually to its new position. -->
    <div class="px-8 overflow-hidden">
      <DayTimeline />
      <ProgressBar />
    </div>
    <!-- Lower region: TASK POOL stays on the left, trajectory + day stack on the right. -->
    <div class="flex flex-col min-h-0">
      <div use:flip={{ key: "divider-center" }} class="h-px bg-[#DCDAD3] shrink-0"></div>
      <div class="grid flex-1 min-h-0" style="grid-template-columns: 280px 1fr;">
        <TaskPool />
        <div class="flex flex-col min-h-0 min-w-0">
          <div class="shrink-0 border-b border-[#0E0E0C]/20">
            <Trajectory />
          </div>
          <div class="flex-1 min-h-0">
            <TimelineView />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<EditModal />
<svelte:window onkeydown={onKeydown} />
