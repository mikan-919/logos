<script lang="ts">
import { fade, fly } from "svelte/transition";
import { cubicOut } from "svelte/easing";
import { dashboard } from "$lib/dashboard/state.svelte";
</script>

<!-- Edit modal (top layer) -->
{#if dashboard.editing}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E0C]/20 backdrop-blur-sm px-6"
    transition:fade={{ duration: 160 }}
    onclick={() => (dashboard.editing = null)} role="presentation">
    <div class="w-full max-w-lg p-8 rounded-2xl bg-[#FFFFFF] border border-[#DCDAD3] shadow-[0_8px_32px_rgba(14,14,12,.16)]"
      in:fly={{ y: 16, duration: 240, easing: cubicOut }}
      onclick={(e) => e.stopPropagation()} role="presentation">
      <div class="flex items-center justify-between mb-6">
        <span class="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A8A2]">Edit Task · {dashboard.editing.id}</span>
        <button onclick={() => (dashboard.editing = null)}
          class="font-mono text-[10px] tracking-[0.08em] uppercase text-[#A8A8A2] hover:text-[#0E0E0C] transition-colors">✕ Close</button>
      </div>

      <label class="block mb-5">
        <span class="block font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2] mb-1.5">Title</span>
        <input bind:value={dashboard.editTitle}
          class="w-full bg-transparent border-b border-[#DCDAD3] focus:border-[#F1531F] outline-none pb-1 text-[22px] tracking-[-0.01em] text-[#0E0E0C]"
          style="font-family: var(--font-display);" />
      </label>

      <label class="block mb-7">
        <span class="block font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A8A2] mb-1.5">Description</span>
        <textarea bind:value={dashboard.editDescription} rows="4"
          class="w-full resize-none bg-transparent border border-[#DCDAD3] rounded-lg focus:border-[#F1531F] outline-none p-3 text-[13px] leading-[1.55] text-[#3A3A37]"></textarea>
      </label>

      <div class="flex justify-end gap-2">
        <button onclick={() => (dashboard.editing = null)}
          class="font-mono text-[10px] tracking-[0.08em] uppercase px-5 h-9 rounded-full text-[#3A3A37] hover:text-[#0E0E0C] transition-colors">Cancel</button>
        <button onclick={dashboard.saveEdit}
          class="font-mono text-[10px] tracking-[0.08em] uppercase px-5 h-9 rounded-full bg-[#F1531F] text-white hover:bg-[#D8430F] transition-colors">Save</button>
      </div>
    </div>
  </div>
{/if}
