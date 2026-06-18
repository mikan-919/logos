<script lang="ts">
import { entity, archetypeColor } from "./state.svelte";

const outgoing = $derived(entity.directedRefs.filter((r) => r.direction === "outgoing"));
const incoming = $derived(entity.directedRefs.filter((r) => r.direction === "incoming"));
</script>

<!--
  refs region: paths to other Entities — dashed connectors, muted ink (A7).
  Split into FROM (incoming) and TO (outgoing) sections so direction is unambiguous.
  A Ref is a path, not a grounding — always dashed, never solid.
-->
<div class="flex flex-col min-h-0 border-b border-[var(--line)]">

  <!-- region header -->
  <div class="flex items-center gap-2 px-4 h-10 border-b border-[var(--line)] shrink-0">
    <span class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)]">REFS</span>
    <span class="font-mono text-[10px] text-[var(--ink-300)]">{entity.directedRefs.length}</span>
  </div>

  <div class="flex-1 overflow-y-auto no-scrollbar">

    <!-- Incoming refs: other entities → this entity -->
    {#if incoming.length > 0}
      <div class="px-4 pt-2.5 pb-1">
        <span class="font-mono text-[9.5px] tracking-[0.10em] uppercase text-[var(--ink-300)] select-none">
          FROM
        </span>
      </div>
      {#each incoming as ref}
        {@const fromColor = archetypeColor(ref.fromArchetype)}
        <button
          type="button"
          onclick={() => entity.focus(ref.fromEntityId)}
          class="w-full flex items-center gap-2 px-4 py-2 border-b border-[var(--line)]
                 hover:bg-[var(--paper)] transition-colors text-left group outline-none
                 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]">

          <!-- source entity chip -->
          <span class="font-mono text-[10px] tracking-[0.06em] uppercase shrink-0"
            style="color: {fromColor}">{ref.fromEntityId}</span>

          <!-- dashed arrow right -->
          <div class="flex items-center gap-0.5 flex-1 min-w-0">
            <div class="flex-1 border-t border-dashed border-[var(--line-strong)] min-w-2"></div>
            <span class="font-mono text-[9.5px] tracking-[0.06em] uppercase text-[var(--ink-300)] px-1 whitespace-nowrap truncate">
              {ref.label}
            </span>
            <div class="flex-1 border-t border-dashed border-[var(--line-strong)] min-w-2"></div>
            <span class="text-[var(--ink-300)] text-[11px]">▶</span>
          </div>

          <!-- this entity (target) -->
          <span class="font-mono text-[10px] tracking-[0.06em] uppercase text-[var(--accent)] shrink-0">
            {entity.focused?.id}
          </span>
        </button>
      {/each}
    {/if}

    <!-- Outgoing refs: this entity → other entities -->
    {#if outgoing.length > 0}
      <div class="px-4 pt-2.5 pb-1">
        <span class="font-mono text-[9.5px] tracking-[0.10em] uppercase text-[var(--ink-300)] select-none">
          TO
        </span>
      </div>
      {#each outgoing as ref}
        {@const toColor = archetypeColor(ref.toArchetype)}
        <button
          type="button"
          onclick={() => entity.focus(ref.toEntityId)}
          class="w-full flex items-center gap-2 px-4 py-2 border-b border-[var(--line)]
                 hover:bg-[var(--paper)] transition-colors text-left group outline-none
                 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]">

          <!-- this entity (source) -->
          <span class="font-mono text-[10px] tracking-[0.06em] uppercase text-[var(--accent)] shrink-0">
            {entity.focused?.id}
          </span>

          <!-- dashed arrow right -->
          <div class="flex items-center gap-0.5 flex-1 min-w-0">
            <div class="flex-1 border-t border-dashed border-[var(--line-strong)] min-w-2"></div>
            <span class="font-mono text-[9.5px] tracking-[0.06em] uppercase text-[var(--ink-300)] px-1 whitespace-nowrap truncate">
              {ref.label}
            </span>
            <div class="flex-1 border-t border-dashed border-[var(--line-strong)] min-w-2"></div>
            <span class="text-[var(--ink-300)] text-[11px]">▶</span>
          </div>

          <!-- target entity chip -->
          <span class="font-mono text-[10px] tracking-[0.06em] uppercase shrink-0"
            style="color: {toColor}">{ref.toEntityId}</span>
        </button>
      {/each}
    {/if}

    {#if entity.directedRefs.length === 0}
      <div class="flex items-center justify-center h-16">
        <span class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)]">NO REFS</span>
      </div>
    {/if}

  </div>

</div>
