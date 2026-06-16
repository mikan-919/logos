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
	captureFlip([
		"daytimeline",

		"progress",

		"trajectory",

		"taskpool",

		"divider-center",
		,
	]);
	dashboard.view = next;
	await tick();
}

function onKeydown(e: KeyboardEvent) {
	const el = e.target as HTMLElement | null;
	const typing =
		el &&
		(el.tagName === "INPUT" ||
			el.tagName === "TEXTAREA" ||
			el.isContentEditable);
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

<div class="w-dvw h-dvh bg-[#F7F5F1] text-[#0E0E0C] grid overflow-hidden grid-cols-1"
  style="grid-template-rows: 4.5rem auto 1fr 16rem;">
  <NewTaskBar />


    <!-- Compact today strip: keep only the clock (DayTimeline) and the
         progress/controls bar; each FLIPs individually to its new position. -->
         <div class="px-8 overflow-hidden row-[2/3] col-start-1 grid grid-cols-[1fr_auto]">
           <DayTimeline />
           <!-- R1C2: Brand labels (pinned to the top) -->
           <div class="col-start-2 row-start-1 flex flex-col items-end justify-start gap-0.5 pt-6 pl-8">
             {#each dashboard.brandLabels as label}
               <span class="font-mono text-[10.5px] tracking-[0.08em] text-[#6E6E69]">[{label}]</span>
             {/each}
           </div>

         </div>
         <div class="px-8 overflow-hidden row-[3/4] col-start-1 grid grid-cols-[1fr_auto]">
           <HeroStage />
         </div>
    <!-- Lower region: TASK POOL stays on the left, trajectory + day stack on the right. -->
    <div class="flex flex-col min-h-0 row-[3/5] col-start-1 transition-transform ease-in-out duration-400 {dashboard.view==="today"?"translate-y-[calc(100%-16rem)]":"translate-y-0"}">
        <ProgressBar />
      <div use:flip={{ key: "divider-center" }} class="h-px bg-[#DCDAD3] shrink-0"></div>
      <div class="grid flex-1 min-h-0 backdrop-blur-lg bg-[#f7f5f180]" style="grid-template-columns: 280px 1fr;">
        <TaskPool />
        <div class="flex flex-col min-h-0 min-w-0">
          <div class="shrink-0 border-b border-[#0E0E0C]/20 transition-height ease-in-out {dashboard.view==="today"?"h-64":"h-50"}">
            <Trajectory />
          </div>
          <div class="flex-1 min-h-0">
            <TimelineView />
          </div>
        </div>
      </div>
    </div>
</div>

<EditModal />
<svelte:window onkeydown={onKeydown} />
