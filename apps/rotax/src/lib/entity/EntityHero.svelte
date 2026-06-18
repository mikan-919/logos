<script lang="ts">
import { entity } from "./state.svelte";
</script>

<!-- entity region: the focused Entity as an unlabeled node on the ground line (A7)
     No title — the Entity has no name of its own. Only its id in mono, on the hairline. -->
<div class="px-6 py-5 border-b border-[var(--line)]">

  <!-- entity picker row: matched entities as mono chips, focused one is accented -->
  <div class="flex flex-wrap items-center gap-2 mb-5">
    {#each entity.matchedEntities as e}
      <button
        type="button"
        onclick={() => entity.focus(e.id)}
        class="font-mono text-[10.5px] tracking-[0.08em] uppercase px-3 h-7
               rounded-full border transition-colors
               {e.id === entity.focused?.id
                 ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                 : 'text-[var(--ink-500)] border-[var(--line)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'}">
        {e.archetype} · {e.id}
      </button>
    {/each}
    {#if entity.matchedEntities.length === 0}
      <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
        NO MATCH
      </span>
    {/if}
  </div>

  <!-- ground line: the hairline the metaphor rests on (A7) -->
  <!-- Node: unlabeled accent dot on the line, then dashed extensions on each side -->
  <div class="relative flex items-center h-8">
    <!-- left dashed extension -->
    <div class="flex-1 border-t border-dashed border-[var(--line-strong)]"></div>

    <!-- the Entity node: accent filled circle, no label -->
    <div class="relative flex-shrink-0 mx-4 flex flex-col items-center gap-1.5">
      <div class="w-3 h-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]"></div>
      <!-- id floats above the node in mono -->
      <span class="absolute bottom-full mb-1.5 font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--accent)] whitespace-nowrap">
        {entity.focused?.id ?? "—"}
      </span>
    </div>

    <!-- right dashed extension -->
    <div class="flex-1 border-t border-dashed border-[var(--line-strong)]"></div>
  </div>

  <!-- archetype label below the line, right-aligned -->
  <div class="flex justify-end mt-2">
    <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
      {entity.focused?.archetype ?? "—"}
    </span>
  </div>

</div>
