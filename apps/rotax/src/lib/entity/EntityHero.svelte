<script lang="ts">
import { entity, archetypeColor, isKnownArchetype } from "./state.svelte";
</script>

<!--
  entity region: the focused Entity as an unlabeled node on the ground line (A7).
  No title — the Entity has no name of its own. Only its id in mono, on the hairline.
  Entity chips are color-coded by archetype so TASK vs PROJECT vs PERSON is legible at a glance.
  The chip with an active component gets a "NOW" pulse badge.
-->
<div class="px-5 py-4 border-b border-[var(--line)]">

  <!-- Entity picker: archetype-colored chips, active entity accented node -->
  <div class="flex flex-wrap items-center gap-1.5 mb-4">
    <span class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)] mr-1 select-none self-center">
      GROUND
    </span>

    {#each entity.matchedEntities as e}
      {@const isActive = entity.hasActiveComponent(e)}
      {@const isFocused = e.id === entity.focused?.id}
      {@const color = archetypeColor(e.archetype)}
      <button
        type="button"
        onclick={() => entity.focus(e.id)}
        class="relative flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase
               px-2.5 h-7 rounded-full border transition-colors focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-offset-1"
        style="
          {isFocused
            ? `background: ${color}; color: white; border-color: ${color}; --tw-ring-color: ${color};`
            : `color: var(--ink-500); border-color: var(--line); --tw-ring-color: ${color};`}
        "
      >
        <!-- NOW pulse for entity with active component -->
        {#if isActive}
          <span class="relative flex h-1.5 w-1.5 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style="background: {isFocused ? 'white' : color}"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5"
              style="background: {isFocused ? 'white' : color}"></span>
          </span>
        {/if}
        <!-- archetype · id -->
        <span>{e.archetype}</span>
        <span class="opacity-50">·</span>
        <span>{e.id}</span>
      </button>
    {/each}

    {#if entity.matchedEntities.length === 0}
      <span class="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-300)]">NO MATCH</span>
    {/if}
  </div>

  <!-- Ground line: the hairline the metaphor rests on (A7) -->
  <div class="relative flex items-center h-10">
    <!-- left dashed extension -->
    <div class="flex-1 border-t border-dashed border-[var(--line-strong)]"></div>

    <!-- Entity node: accent-colored circle for the focused entity, no label -->
    {#if entity.focused}
      {@const color = archetypeColor(entity.focused.archetype)}
      {@const isActive = entity.hasActiveComponent(entity.focused)}
      <div class="relative flex-shrink-0 mx-5 flex flex-col items-center">
        <!-- id floats above the node -->
        <span class="absolute bottom-full mb-1.5 font-mono text-[10px] tracking-[0.08em] uppercase whitespace-nowrap"
          style="color: {color}">
          {entity.focused.id}
        </span>

        <!-- node: solid circle + ring for active -->
        <div class="w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style="background: {color}; {isActive ? `box-shadow: 0 0 0 4px color-mix(in srgb, ${color} 20%, transparent);` : ''}">
        </div>

        <!-- archetype below the node -->
        <span class="absolute top-full mt-1.5 font-mono text-[9px] tracking-[0.08em] uppercase"
          style="color: {color}; opacity: 0.7">
          {entity.focused.archetype}{!isKnownArchetype(entity.focused.archetype) ? ' ?' : ''}
          {#if isActive}<span class="ml-1 opacity-100">· NOW</span>{/if}
        </span>
      </div>
    {/if}

    <!-- right dashed extension -->
    <div class="flex-1 border-t border-dashed border-[var(--line-strong)]"></div>
  </div>

  <!-- spacer for the archetype label below the node -->
  <div class="h-5"></div>

</div>
