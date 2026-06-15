<script lang="ts">
import { fade, fly } from "svelte/transition";
import { cubicOut } from "svelte/easing";
import { dashboard } from "$lib/dashboard/state.svelte";
import { hold } from "$lib/dashboard/format";
import { flip } from "$lib/dashboard/flip";
</script>

<!-- Trajectory (shared element: morphs between today / timeline layouts) -->
<div use:flip={{ key: "trajectory" }} class="relative flex items-stretch gap-6 px-8 py-5 min-w-0">
  <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2] shrink-0 self-end"
    style="writing-mode: vertical-rl; transform: rotate(180deg);">TRAJECTORY</span>
  <div class="flex flex-col min-w-0 flex-1 h-full gap-7">
    <!-- Top: upcoming -->
    <div class="flex-1 min-h-0 flex flex-col justify-center">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#F1531F]">Upcoming</span>
        <span class="flex-1 h-px bg-[#EDEBE4]"></span>
      </div>
      <div class="no-scrollbar flex overflow-x-auto overflow-y-hidden gap-0 min-w-0">
        {#each dashboard.trajectoryUpcoming as card, i}
          <button type="button" onclick={() => (dashboard.pinned = card)}
            class="shrink-0 w-48 px-5 text-left cursor-pointer transition-opacity hover:opacity-60"
            class:border-l={i > 0} class:border-[#DCDAD3]={i > 0} class:pl-5={i > 0} class:pl-0={i === 0}>
            <span class="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] uppercase mb-0.5"
              class:text-[#F1531F]={card.state === "active"} class:text-[#A8A8A2]={card.state !== "active"}>
              {#if card.state === "active"}
                <span class="w-1.5 h-1.5 rounded-full bg-[#F1531F] animate-pulse"></span>Now
              {:else}
                {card.id}
              {/if}
            </span>
            <h2 class="text-[18px] font-semibold tracking-[-0.01em] m-0 truncate"
              class:text-[#F1531F]={card.state === "active"} class:text-[#0E0E0C]={card.state !== "active"}
              style="font-family: var(--font-display);">{card.title}</h2>
          </button>
        {/each}
      </div>
    </div>

    <!-- Bottom: past -->
    <div class="flex-1 min-h-0 flex flex-col justify-center">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2]">Past</span>
        <span class="flex-1 h-px bg-[#EDEBE4]"></span>
      </div>
      <div class="no-scrollbar flex overflow-x-auto overflow-y-hidden gap-0 min-w-0">
        {#each dashboard.trajectoryPast as card, i}
          <button type="button" onclick={() => (dashboard.pinned = card)}
            class="shrink-0 w-48 px-5 text-left cursor-pointer transition-opacity hover:opacity-60 opacity-50"
            class:border-l={i > 0} class:border-[#DCDAD3]={i > 0} class:pl-5={i > 0} class:pl-0={i === 0}>
            <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-0.5">{card.id}</span>
            <h2 class="text-[18px] font-semibold tracking-[-0.01em] text-[#0E0E0C] m-0 truncate"
              class:line-through={card.state === "done"} class:decoration-[#C2C0B8]={card.state === "done"}
              style="font-family: var(--font-display);">{card.title}</h2>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Detail overlay -->
  {#if dashboard.selectedCard}
    <div class="absolute inset-0 z-20 flex items-stretch bg-[#F7F5F1]/92 backdrop-blur-xl"
      transition:fade={{ duration: 180 }}
      onclick={() => { dashboard.pinned = null; dashboard.hoveredId = null; }} role="presentation">
      <div class="relative flex-1 min-h-0 flex flex-col px-12 py-5"
        in:fly={{ y: 16, duration: 280, easing: cubicOut }}
        onclick={(e) => e.stopPropagation()} role="presentation">

        <!-- close -->
        <button type="button" onclick={() => { dashboard.pinned = null; dashboard.hoveredId = null; }}
          class="absolute top-5 right-8 font-mono text-[11px] tracking-[0.08em] uppercase text-[#A8A8A2] hover:text-[#0E0E0C] transition-colors">✕ Close</button>

        <!-- body: left = id/title/controls, right = description -->
        <div class="flex flex-1 min-h-0 gap-12">

          <!-- left column -->
          <div class="flex flex-col min-w-0 w-[44%] shrink-0">
            <span class="block font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2] mb-1">{dashboard.selectedCard.id}</span>
            <h2 class="text-[28px] font-semibold tracking-[-0.02em] text-[#0E0E0C] m-0 mb-4 truncate"
              style="font-family: var(--font-display);">{dashboard.selectedCard.title}</h2>

            <!-- controls under title -->
            <div class="flex flex-wrap items-center gap-2">
              <button use:hold={{ onhold: () => dashboard.selectedCard && dashboard.startTask(dashboard.selectedCard) }}
                class="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors select-none touch-none">
                <span class="text-[9px]">▶</span> Hold to Start
              </button>
              <button onclick={() => dashboard.selectedCard && dashboard.openEdit(dashboard.selectedCard)}
                class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Edit</button>

              <!-- Reschedule + popover -->
              <div class="relative">
                <button onclick={() => dashboard.selectedCard && dashboard.openReschedule(dashboard.selectedCard)}
                  class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border transition-colors"
                  class:border-[#0E0E0C]={dashboard.reschedTask === dashboard.selectedCard}
                  class:text-[#0E0E0C]={dashboard.reschedTask === dashboard.selectedCard}
                  class:border-[#C2C0B8]={dashboard.reschedTask !== dashboard.selectedCard}
                  class:text-[#3A3A37]={dashboard.reschedTask !== dashboard.selectedCard}>Reschedule</button>

                {#if dashboard.reschedTask && dashboard.reschedTask === dashboard.selectedCard}
                  <div class="absolute left-0 bottom-[calc(100%+8px)] z-40 w-60 p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCDAD3] shadow-[0_8px_24px_rgba(14,14,12,.10)]"
                    transition:fly={{ y: 6, duration: 160, easing: cubicOut }}>
                    <div class="flex items-center gap-3 mb-3">
                      <label class="flex flex-col gap-1 flex-1">
                        <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2]">Start</span>
                        <input type="time" step="900" bind:value={dashboard.reStart}
                          class="font-mono text-[13px] tabular-nums bg-transparent border-b border-[#DCDAD3] focus:border-[#F1531F] outline-none pb-0.5" />
                      </label>
                      <label class="flex flex-col gap-1 flex-1">
                        <span class="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2]">End</span>
                        <input type="time" step="900" bind:value={dashboard.reEnd}
                          class="font-mono text-[13px] tabular-nums bg-transparent border-b border-[#DCDAD3] focus:border-[#F1531F] outline-none pb-0.5" />
                      </label>
                    </div>
                    <button onclick={dashboard.applyReschedule}
                      class="w-full font-mono text-[10px] tracking-[0.08em] uppercase h-8 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors mb-2">Apply</button>
                    <div class="flex gap-2">
                      <button onclick={() => dashboard.reschedTask && dashboard.doNow(dashboard.reschedTask)}
                        class="flex-1 font-mono text-[10px] tracking-[0.08em] uppercase h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Do Now</button>
                      <button onclick={() => dashboard.reschedTask && dashboard.unschedule(dashboard.reschedTask)}
                        class="flex-1 font-mono text-[10px] tracking-[0.08em] uppercase h-8 rounded-full border border-[#C2C0B8] text-[#3A3A37] hover:border-[#0E0E0C] hover:text-[#0E0E0C] transition-colors">Unschedule</button>
                    </div>
                  </div>
                {/if}
              </div>

              <button class="font-mono text-[10px] tracking-[0.08em] uppercase px-4 h-8 rounded-full border border-[#E0BBB2] text-[#C2331B] hover:bg-[#C2331B] hover:text-white hover:border-[#C2331B] transition-colors">Delete</button>
            </div>
          </div>

          <!-- right column: description -->
          <div class="no-scrollbar flex-1 min-w-0 min-h-0 overflow-y-auto border-l border-[#DCDAD3] pl-12 text-[13px] leading-[1.6] text-[#3A3A37]">
            <p class="m-0 mb-1 font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">Description</p>
            <p class="m-0">{dashboard.selectedCard.description}</p>
            {#if dashboard.selectedCard.todos.length}
              <p class="m-0 mt-4 mb-1 font-mono text-[9px] tracking-[0.08em] uppercase text-[#A8A8A2]">Subtasks</p>
              {#each dashboard.selectedCard.todos as todo}
                <p class="m-0">- {todo}</p>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
