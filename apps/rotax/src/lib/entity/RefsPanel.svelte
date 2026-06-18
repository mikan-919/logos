<script lang="ts">
import { entity } from "./state.svelte";
</script>

<!-- refs region: paths to other Entities — dashed connectors, muted ink (A7)
     Never a solid line; a Ref is a path, not a grounding. -->
<div class="flex flex-col min-h-0 border-b border-[var(--line)]">

  <!-- region header -->
  <div class="flex items-center gap-3 px-4 h-10 border-b border-[var(--line)] shrink-0">
    <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
      REFS
    </span>
    <span class="font-mono text-[10.5px] tracking-[0.08em] text-[var(--ink-300)]">
      {entity.focused?.refs.length ?? 0}
    </span>
  </div>

  <!-- ref rows -->
  <div class="flex-1 overflow-y-auto no-scrollbar">
    {#each entity.focused?.refs ?? [] as ref}
      <button
        type="button"
        onclick={() => entity.focus(ref.toEntityId)}
        class="w-full flex items-start gap-3 px-4 py-3 border-b border-[var(--line)]
               hover:bg-[var(--paper)] transition-colors text-left group outline-none
               focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:ring-inset">

        <!-- dashed connector glyph (vertical dashed line as visual language for paths) -->
        <div class="flex flex-col items-center shrink-0 mt-1 gap-0.5">
          <div class="w-px h-2 border-l border-dashed border-[var(--line-strong)]"></div>
          <div class="w-1.5 h-1.5 rounded-full border border-[var(--ink-300)] group-hover:border-[var(--accent)] transition-colors"></div>
          <div class="w-px h-2 border-l border-dashed border-[var(--line-strong)]"></div>
        </div>

        <div class="flex-1 min-w-0">
          <!-- label (the path type) -->
          <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)] group-hover:text-[var(--ink-500)] transition-colors">
            {ref.label}
          </span>
          <!-- target entity id + archetype -->
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
              {ref.toArchetype}
            </span>
            <span class="font-mono text-[10.5px] tracking-[0.08em] text-[var(--accent)] group-hover:underline">
              {ref.toEntityId}
            </span>
          </div>
        </div>

        <span class="font-mono text-[10.5px] text-[var(--ink-300)] shrink-0 mt-0.5 group-hover:text-[var(--accent)] transition-colors">›</span>
      </button>
    {/each}

    {#if (entity.focused?.refs.length ?? 0) === 0}
      <div class="flex items-center justify-center h-16">
        <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
          NO REFS
        </span>
      </div>
    {/if}
  </div>

</div>
