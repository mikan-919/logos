<script lang="ts">
import { entity, archetypeColor } from "./state.svelte";
</script>

<!--
  worldbar: archetype-query input + entity picker (A5)
  Left: filter input that narrows the entity list below.
  Right: service filter that narrows which components are shown in the panel.
  Both have visible labels so their purpose is immediately readable.
-->
<div class="flex items-stretch border-b border-[var(--line)]">

  <!-- Entity search -->
  <label class="flex items-center gap-2 flex-1 min-w-0 px-5 h-12 shrink-0">
    <span class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)] select-none whitespace-nowrap">
      ENTITY
    </span>
    <input
      type="text"
      bind:value={entity.query}
      placeholder="search id, archetype, or title…"
      class="flex-1 min-w-0 bg-transparent border-0 outline-none
             font-mono text-[12px] tracking-[0.02em] text-[var(--ink)]
             placeholder:text-[var(--ink-300)]" />
  </label>

  <!-- Divider -->
  <div class="w-px self-stretch bg-[var(--line)] shrink-0 my-2"></div>

  <!-- Service filter — "which service's components to show" -->
  <div class="flex items-center gap-2 px-4 h-12 shrink-0">
    <span class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)] select-none whitespace-nowrap">
      SERVICE
    </span>
    <div class="flex items-center gap-1">
      {#each ["all", ...entity.availableServices] as s}
        <button
          type="button"
          onclick={() => (entity.serviceFilter = s)}
          class="font-mono text-[10px] tracking-[0.08em] uppercase px-2.5 h-6
                 rounded-full border transition-colors
                 {entity.serviceFilter === s
                   ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                   : 'text-[var(--ink-500)] border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'}">
          {s}
        </button>
      {/each}
    </div>
  </div>

</div>
