<script lang="ts">
import { fade, fly } from "svelte/transition";
import { cubicOut } from "svelte/easing";

const mockHeroTask = {
	id: "TASK-32F9",
	title: "Implement World API",
	time: "12:00 → 21:00",
	description: "I have todo.",
	todos: ["This", "Another", "other"],
	progress: 0.3,
};

let running = $state(true);
let done = $state(false);

function togglePause() {
	running = !running;
}

function complete() {
	done = true;
	running = false;
}

const elapsedPct = $derived(
	done ? 100 : Math.round(mockHeroTask.progress * 100),
);

let pool = $state([
	"AAAAAAAA",
	"BBBBB",
	"CCCCCC",
	"DDDDDDDDDDD",
	"EEEEEEEEEEE",
	"FFFFFF",
]);

let deletingItem = $state<string | null>(null);
let deleteTimer: ReturnType<typeof setTimeout> | null = null;

function startDelete(item: string) {
	deletingItem = item;
	deleteTimer = setTimeout(() => {
		pool = pool.filter((i) => i !== item);
		deletingItem = null;
		deleteTimer = null;
	}, 800);
}

function cancelDelete() {
	if (deleteTimer) clearTimeout(deleteTimer);
	deleteTimer = null;
	deletingItem = null;
}

const trajectoryDone = [
	{ id: "TASK-1A2B", title: "Setup repo", todos: ["This", "Another", "other"] },
	{
		id: "TASK-3C4D",
		title: "Schema draft",
		todos: ["This", "Another", "other"],
	},
	{ id: "TASK-5E6F", title: "ECS core", todos: ["This", "Another", "other"] },
	{
		id: "TASK-7G8H",
		title: "Router wiring",
		todos: ["This", "Another", "other"],
	},
];

const trajectoryUpcoming = [
	{ id: "TASK-98F9A", title: "World API", todos: ["This", "Another", "other"] },
	{ id: "TASK-A1B2", title: "Velt sync", todos: ["This", "Another", "other"] },
	{ id: "TASK-C3D4", title: "UI polish", todos: ["This", "Another", "other"] },
	{
		id: "TASK-E5F6",
		title: "Zestium hook",
		todos: ["This", "Another", "other"],
	},
];

type Detail = { id: string; title: string; todos: string[] };

let pinned = $state<Detail | null>(null);
let hoveredPool = $state<string | null>(null);

function poolDetail(item: string): Detail {
	return { id: "POOL", title: item, todos: ["This", "Another", "other"] };
}

// Throttle pool hover so sweeping the cursor across the list doesn't thrash
// the overlay. The latest target wins after the cooldown.
const HOVER_THROTTLE = 120;
let lastHoverAt = 0;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

function hoverPool(item: string | null) {
	if (hoverTimer) {
		clearTimeout(hoverTimer);
		hoverTimer = null;
	}
	const now = Date.now();
	const wait = HOVER_THROTTLE - (now - lastHoverAt);
	if (wait <= 0) {
		lastHoverAt = now;
		hoveredPool = item;
	} else {
		hoverTimer = setTimeout(() => {
			lastHoverAt = Date.now();
			hoveredPool = item;
			hoverTimer = null;
		}, wait);
	}
}

// Detail shown in the Trajectory overlay: a hovered pool task previews on top,
// otherwise the last clicked (pinned) task stays open.
const selectedCard = $derived(
	hoveredPool !== null ? poolDetail(hoveredPool) : pinned,
);

let newTaskTitle = $state("");

function addTask() {
	const title = newTaskTitle.trim();
	if (!title) return;
	pool = [...pool, title];
	newTaskTitle = "";
}

const brandLabels = ["LOGOS", "Rotax", "Velt", "Zestium"];

const metaBlock = [
	{ key: "OBJECTIVE", value: "32F9-A71C" },
	{ key: "SESSION", value: "0xB3D9F201" },
	{ key: "GLOBAL TIME", value: "13:49:02 UTC" },
	{ key: "LOCAL", value: "JST +09:00" },
	{ key: "UPTIME", value: "412:07:55" },
	{ key: "NODE", value: "rtx-04 / eu-w1" },
	{ key: "BUILD", value: "v0.3.1-canary" },
	{ key: "LATENCY", value: "12ms" },
	{ key: "IP", value: "192.0.2.144" },
	{ key: "HASH", value: "9f3ac0e8d1" },
];
</script>

<div class="w-dvw h-dvh bg-[#F7F5F1] text-[#0E0E0C] grid overflow-hidden" style="grid-template-rows: 4.5rem 1fr 12rem;">

  <!-- Row 1: New task input -->
  <div class="flex items-center gap-4 px-8 border-b border-[#DCDAD3]">
    <span class="font-mono text-[10px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0">New&nbsp;Task</span>
    <span class="text-[#C2C0B8] shrink-0">＋</span>
    <input
      type="text"
      bind:value={newTaskTitle}
      onkeydown={(e) => e.key === "Enter" && addTask()}
      placeholder="What needs to be done?"
      class="flex-1 min-w-0 bg-transparent border-0 outline-none
             text-[clamp(16px,1.8vw,24px)] tracking-[-0.01em] text-[#0E0E0C]
             placeholder:text-[#C2C0B8] placeholder:font-normal"
      style="font-family: 'Inter Tight', 'Satoshi', sans-serif;" />
    <button onclick={addTask} disabled={!newTaskTitle.trim()}
      class="shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-9 rounded-full
             bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors
             disabled:opacity-30 disabled:hover:bg-[#F1531F]">
      Add ↵
    </button>
  </div>

  <!-- Row 2: Hero Task -->
  <div class="grid px-8 border-b border-[#DCDAD3]" style="grid-template-columns: 1fr auto; grid-template-rows: 1fr auto auto 1fr auto;">

    <!-- R2C1: HAVE A NEXT label (bottom-aligned to the divider) -->
    <div class="col-start-1 row-start-2 flex items-end">
      <p class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[#6E6E69] m-0">
        HAVE A NEXT &nbsp;&nbsp; {mockHeroTask.time}
      </p>
    </div>

    <!-- R1C2: Brand labels (pinned to the top) -->
    <div class="col-start-2 row-start-1 flex flex-col items-end justify-start gap-0.5 pt-6 pl-8">
      {#each brandLabels as label}
        <span class="font-mono text-[10.5px] tracking-[0.08em] text-[#6E6E69]">[{label}]</span>
      {/each}
    </div>

    <!-- R3C1: Title + description -->
    <div class="col-start-1 row-start-3 flex flex-col justify-start">
      <div class="w-[55%] h-px bg-[#DCDAD3] mt-2 mb-1"></div>
      <h1 class="font-bold text-[clamp(48px,6vw,96px)] tracking-[-0.03em] leading-[0.95] text-[#0E0E0C] mb-4"
        style="font-family: 'Inter Tight', 'Satoshi', sans-serif;">
        {mockHeroTask.title}
      </h1>
      <div class="text-[14px] leading-[1.55] text-[#3A3A37]">
        <p class="m-0">{mockHeroTask.description}</p>
        {#each mockHeroTask.todos as todo}
          <p class="m-0">- {todo}</p>
        {/each}
      </div>
    </div>

    <!-- R3C2: hairline (top, aligned with HAVE A NEXT bottom) + Meta -->
    <div class="col-start-2 row-start-3 flex flex-col gap-3 pl-8">
      <div class="w-full h-px bg-[#DCDAD3]"></div>
      <div class="flex flex-col gap-0.5">
        {#each metaBlock as row}
          <div class="flex gap-2">
            <span class="font-mono text-[8.5px] tracking-[0.08em] uppercase text-[#C7C5BE] min-w-[80px]">{row.key}</span>
            <span class="font-mono text-[8.5px] tracking-[0.04em] text-[#B0AEA7]">{row.value}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- R5: Progress bar + controls -->
    <div class="col-span-2 row-start-5 flex items-center gap-6 pb-6">

      <!-- elapsed % -->
      <span class="font-mono text-[10px] tracking-[0.08em] text-[#A8A8A2] tabular-nums shrink-0">
        {String(elapsedPct).padStart(3, "0")}%
      </span>

      <!-- track -->
      <div class="relative flex-1 h-[6px] rounded-full bg-[#E6E4DD] overflow-hidden">
        <!-- ticks decoration -->
        <div class="absolute inset-0 flex justify-between px-[2px] pointer-events-none">
          {#each Array(40) as _}
            <div class="w-px h-full bg-[#D2D0C8]"></div>
          {/each}
        </div>
        <!-- fill -->
        <div class="absolute left-0 top-0 h-full rounded-full bg-[#F1531F] transition-[width] duration-300"
          class:opacity-40={!running && !done} style="width: {elapsedPct}%"></div>
        <!-- moving head -->
        {#if running && !done}
          <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-[#F1531F] ring-2 ring-[#F7F5F1]"
            style="left: {elapsedPct}%"></div>
        {/if}
      </div>

      <!-- controls -->
      <div class="flex items-center gap-2 shrink-0">
        <button onclick={togglePause} disabled={done}
          class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
                 px-3 h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37]
                 hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors
                 disabled:opacity-30 disabled:hover:border-[#C2C0B8] disabled:hover:text-[#3A3A37]">
          {#if running}
            <span class="text-[8px]">❚❚</span> Pause
          {:else}
            <span class="text-[9px]">▶</span> Resume
          {/if}
        </button>
        <button onclick={complete} disabled={done}
          class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
                 px-3 h-8 rounded-full bg-[#F1531F] text-white
                 hover:bg-[#D8430F] transition-colors
                 disabled:bg-[#2E6F4E] disabled:opacity-100">
          {#if done}
            <span class="text-[10px]">✓</span> Done
          {:else}
            <span class="text-[10px]">✓</span> Complete
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Row 3: Bottom -->
  <div class="grid" style="grid-template-columns: 280px 1fr;">

    <!-- Task Pool -->
    <div class="flex items-start gap-4 px-6 py-6 border-r border-[#DCDAD3] min-h-0 overflow-hidden">
      <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0"
        style="writing-mode: vertical-rl; transform: rotate(180deg);">TASK POOL</span>
      <div class="flex flex-col gap-1 flex-1 min-w-0 h-full overflow-y-auto pr-1">
        {#each pool as item}
          <div
            onmouseenter={() => hoverPool(item)}
            onmouseleave={() => hoverPool(null)}
            onclick={() => { pinned = poolDetail(item); hoverPool(null); }}
            class="group flex items-center justify-between gap-3 py-0.5 cursor-pointer"
            role="presentation">
            <span class="text-[14px] italic text-[#3A3A37] truncate">- {item.length > 14 ? item.slice(0, 14) + "…" : item}</span>
            <span class="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onclick={(e) => e.stopPropagation()} role="presentation">
              <button class="font-mono text-[9px] tracking-[0.06em] uppercase text-[#A8A8A2] hover:text-[#0E0E0C] transition-colors">Start</button>
              <button class="font-mono text-[9px] tracking-[0.06em] uppercase text-[#A8A8A2] hover:text-[#0E0E0C] transition-colors">Edit</button>
              <button
                onmousedown={() => startDelete(item)}
                onmouseup={cancelDelete}
                onmouseleave={cancelDelete}
                class="relative overflow-hidden font-mono text-[9px] tracking-[0.06em] uppercase text-[#A8A8A2] hover:text-[#C2331B] transition-colors select-none">
                <span class="relative z-10">{deletingItem === item ? "Hold…" : "Delete"}</span>
                {#if deletingItem === item}
                  <span class="absolute left-0 bottom-0 h-px bg-[#C2331B] delete-progress"></span>
                {/if}
              </button>
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Trajectory -->
    <div class="relative flex items-stretch gap-6 px-8 py-5 min-w-0">
      <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0 self-end"
        style="writing-mode: vertical-rl; transform: rotate(180deg);">TRAJECTORY</span>
      <div class="flex flex-col min-w-0 flex-1 h-full gap-7">
        <!-- Top: completed -->
        <div class="flex-1 min-h-0 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2]">Done</span>
            <span class="flex-1 h-px bg-[#EDEBE4]"></span>
          </div>
          <div class="flex overflow-x-auto overflow-y-hidden gap-0 min-w-0">
            {#each trajectoryDone as card, i}
              <button type="button" onclick={() => (pinned = card)}
                class="shrink-0 w-48 px-5 text-left cursor-pointer transition-opacity hover:opacity-60 opacity-50"
                class:border-l={i > 0} class:border-[#DCDAD3]={i > 0} class:pl-5={i > 0} class:pl-0={i === 0}>
                <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-0.5">{card.id}</span>
                <h2 class="text-[18px] font-semibold tracking-[-0.01em] text-[#0E0E0C] m-0 line-through decoration-[#C2C0B8] truncate"
                  style="font-family: 'Inter Tight', 'Satoshi', sans-serif;">{card.title}</h2>
              </button>
            {/each}
          </div>
        </div>

        <!-- Bottom: upcoming -->
        <div class="flex-1 min-h-0 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#F1531F]">Upcoming</span>
            <span class="flex-1 h-px bg-[#EDEBE4]"></span>
          </div>
          <div class="flex overflow-x-auto overflow-y-hidden gap-0 min-w-0">
            {#each trajectoryUpcoming as card, i}
              <button type="button" onclick={() => (pinned = card)}
                class="shrink-0 w-48 px-5 text-left cursor-pointer transition-opacity hover:opacity-60"
                class:border-l={i > 0} class:border-[#DCDAD3]={i > 0} class:pl-5={i > 0} class:pl-0={i === 0}>
                <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-0.5">{card.id}</span>
                <h2 class="text-[18px] font-semibold tracking-[-0.01em] text-[#0E0E0C] m-0 truncate"
                  style="font-family: 'Inter Tight', 'Satoshi', sans-serif;">{card.title}</h2>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Detail overlay -->
      {#if selectedCard}
        <div class="absolute inset-0 z-20 flex items-stretch bg-[#F7F5F1]/92 backdrop-blur-xl"
          transition:fade={{ duration: 180 }}
          onclick={() => { pinned = null; hoveredPool = null; }} role="presentation">
          <div class="relative flex-1 min-h-0 flex flex-col px-12 py-5"
            in:fly={{ y: 16, duration: 280, easing: cubicOut }}
            onclick={(e) => e.stopPropagation()} role="presentation">

            <!-- close -->
            <button type="button" onclick={() => { pinned = null; hoveredPool = null; }}
              class="absolute top-5 right-8 font-mono text-[11px] tracking-[0.08em] uppercase text-[#A8A8A2] hover:text-[#0E0E0C] transition-colors">✕ Close</button>

            <!-- body: left = id/title/controls, right = description -->
            <div class="flex flex-1 min-h-0 gap-12">

              <!-- left column -->
              <div class="flex flex-col min-w-0 w-[44%] shrink-0">
                <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-1">{selectedCard.id}</span>
                <h2 class="text-[28px] font-semibold tracking-[-0.02em] text-[#0E0E0C] m-0 mb-4 truncate"
                  style="font-family: 'Inter Tight', 'Satoshi', sans-serif;">{selectedCard.title}</h2>

                <!-- controls under title -->
                <div class="flex flex-wrap items-center gap-2">
                  <button class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors">
                    <span class="text-[9px]">▶</span> Start
                  </button>
                  <button class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Edit</button>
                  <button class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Reschedule</button>
                  <button class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border border-[#E0BBB2] text-[#C2331B] hover:bg-[#C2331B] hover:text-white hover:border-[#C2331B] transition-colors">Delete</button>
                </div>
              </div>

              <!-- right column: description -->
              <div class="flex-1 min-w-0 min-h-0 overflow-y-auto border-l border-[#DCDAD3] pl-12 text-[13px] leading-[1.6] text-[#3A3A37]">
                <p class="m-0 mb-1 font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">Description</p>
                <p class="m-0">I have todo.</p>
                {#each selectedCard.todos as todo}
                  <p class="m-0">- {todo}</p>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

  </div>
</div>

<style>
  .delete-progress {
    width: 0;
    animation: delete-fill 800ms linear forwards;
  }
  @keyframes delete-fill {
    to { width: 100%; }
  }
</style>
