<script lang="ts">
const mockHeroTask = {
	id: "TASK-32F9",
	title: "Implement World API",
	time: "12:00 → 21:00",
	description: "I have todo.",
	todos: ["This", "Another", "other"],
	progress: 0.3,
};

const mockPool = [
	"AAAAAAAA",
	"BBBBB",
	"CCCCCC",
	"DDDDDDDDDDD",
	"EEEEEEEEEEE",
	"FFFFFF",
];

const mockTrajectory = [
	{ id: "TASK-98F9A", title: "Task name", todos: ["This", "Another", "other"] },
	{ id: "TASK-98F9A", title: "Task name", todos: ["This", "Another", "other"] },
	{ id: "TASK-98F9A", title: "Task name", todos: ["This", "Another", "other"] },
	{ id: "TASK-98F9A", title: "Task name", todos: ["This", "Another", "other"] },
	{ id: "TASK-98F9A", title: "Task name", todos: ["This", "Another", "other"] },
	{ id: "TASK-98F9A", title: "Task name", todos: ["This", "Another", "other"] },
	{ id: "TASK-98F9A", title: "Task name", todos: ["This", "Another", "other"] },
];

const timelineNodes = [
	{ label: "MON 09", active: false, count: 2 },
	{ label: "TUE 10", active: false, count: 0 },
	{ label: "WED 11", active: false, count: 4 },
	{ label: "THU 12", active: true, count: 3 },
	{ label: "FRI 13", active: false, count: 1 },
	{ label: "SAT 14", active: false, count: 0 },
	{ label: "SUN 15", active: false, count: 0 },
];

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

<div class="w-dvw h-dvh bg-[#F7F5F1] text-[#0E0E0C] grid overflow-hidden" style="grid-template-rows: 8rem 1fr 12rem;">

  <!-- Row 1: Timeline -->
  <div class="flex items-center justify-between px-8 border-b border-[#DCDAD3]">
    <div class="flex items-center gap-12">
      {#each timelineNodes as node}
        <div class="flex flex-col items-center gap-1">
          <div class="rounded-full transition-colors duration-[120ms]"
            class:w-[10px]={!node.active} class:h-[10px]={!node.active} class:bg-[#C2C0B8]={!node.active}
            class:w-[14px]={node.active} class:h-[14px]={node.active} class:bg-[#F1531F]={node.active}
          ></div>
          <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[#6E6E69]">{node.label}</span>
          {#if node.count > 0}
            <span class="font-mono text-[9px] tracking-[0.06em] text-[#A8A8A2]">{node.count}</span>
          {:else}
            <span class="font-mono text-[9px] text-[#DCDAD3]">·</span>
          {/if}
        </div>
      {/each}
    </div>
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

    <!-- R5: Progress bar -->
    <div class="col-span-2 row-start-5 flex items-center gap-4 pb-6">
      <div class="relative flex-1 h-px bg-[#C2C0B8]">
        <div class="absolute left-0 top-0 h-px bg-[#F1531F]" style="width: {mockHeroTask.progress * 100}%"></div>
      </div>
      <span class="font-mono text-[12px] text-[#6E6E69]">↗</span>
    </div>
  </div>

  <!-- Row 3: Bottom -->
  <div class="grid" style="grid-template-columns: 280px 1fr;">

    <!-- Task Pool -->
    <div class="flex items-start gap-4 px-6 py-6 border-r border-[#DCDAD3]">
      <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0"
        style="writing-mode: vertical-rl; transform: rotate(180deg);">TASK POOL</span>
      <div class="flex flex-col gap-1">
        {#each mockPool as item}
          <p class="text-[14px] italic text-[#3A3A37] m-0">- {item}</p>
        {/each}
      </div>
    </div>

    <!-- Trajectory -->
    <div class="flex items-start gap-6 px-8 py-6 min-w-0 overflow-hidden">
      <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0"
        style="writing-mode: vertical-rl; transform: rotate(180deg);">TRAJECTORY</span>
      <div class="flex overflow-x-auto gap-0 min-w-0 flex-1">
        {#each mockTrajectory as card, i}
          <div class="shrink-0 w-56 px-6" class:border-l={i > 0} class:border-[#DCDAD3]={i > 0} class:pl-6={i > 0} class:pl-0={i === 0}>
            <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-1">{card.id}</span>
            <h2 class="text-[22px] font-semibold tracking-[-0.01em] text-[#0E0E0C] m-0 mb-2"
              style="font-family: 'Inter Tight', 'Satoshi', sans-serif;">{card.title}</h2>
            <div class="text-[12px] leading-[1.5] text-[#3A3A37]">
              <p class="m-0">Descriptions</p>
              <p class="m-0">I have todo.</p>
              {#each card.todos as todo}
                <p class="m-0">- {todo}</p>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

  </div>
</div>
