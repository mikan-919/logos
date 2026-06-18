<script lang="ts">
import { entity } from "./state.svelte";

const worlds = ["all", "rotax", "velt", "github"] as const;
</script>

<!-- worldbar: archetype-query input + world/layer switch (A5) -->
<!-- Square, hairline bottom — structure shown honestly -->
<div class="flex items-center gap-0 border-b border-[var(--line)] min-w-0">

  <!-- Archetype query (left, fills space) -->
  <label class="flex items-center gap-3 flex-1 min-w-0 px-6 h-12">
    <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)] shrink-0 select-none">
      ARCHETYPE
    </span>
    <input
      type="text"
      bind:value={entity.query}
      placeholder="filter entities…"
      class="flex-1 min-w-0 bg-transparent border-0 outline-none
             font-mono text-[13px] tracking-[0.02em] text-[var(--ink)]
             placeholder:text-[var(--ink-300)]" />
  </label>

  <!-- Divider -->
  <div class="w-px h-6 bg-[var(--line)] shrink-0"></div>

  <!-- World switch (right) -->
  <div class="flex items-center gap-0 px-4 h-12 shrink-0">
    <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)] mr-3 select-none">
      LAYER
    </span>
    <div class="flex items-center gap-1">
      {#each worlds as w}
        <button
          type="button"
          onclick={() => (entity.world = w)}
          class="font-mono text-[10.5px] tracking-[0.08em] uppercase px-3 h-7
                 rounded-full border transition-colors
                 {entity.world === w
                   ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                   : 'text-[var(--ink-500)] border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'}">
          {w}
        </button>
      {/each}
    </div>
  </div>

</div>
