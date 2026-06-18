<script lang="ts">
import { entity, archetypeColor } from "./state.svelte";

const STATE_LABEL: Record<string, string> = {
	done: "DONE",
	active: "ACTIVE",
	upcoming: "NEXT",
	backlog: "BACKLOG",
};

const STATE_COLOR: Record<string, string> = {
	done: "var(--positive)",
	active: "var(--accent)",
	upcoming: "var(--ink-500)",
	backlog: "var(--ink-300)",
};
</script>

<!--
  components region: the grounded appearances (表現), indexed square rows (A1/A5).
  Active component gets accent left-border + subtle background lift.
  Rows are square (border-radius: 0), hairline-separated — structure shown honestly.
-->
<div class="flex flex-col min-h-0 border-r border-[var(--line)]">

  <!-- region header -->
  <div class="flex items-center gap-3 px-5 h-10 border-b border-[var(--line)] shrink-0">
    <span class="font-mono text-[10px] tracking-[0.10em] uppercase text-[var(--ink-300)]">
      COMPONENTS
    </span>
    <span class="font-mono text-[10px] text-[var(--ink-300)]">
      {entity.filteredComponents.length}
      {#if entity.serviceFilter !== "all"}
        <span class="opacity-60">of {entity.focused?.components.length ?? 0}</span>
      {/if}
    </span>
  </div>

  <!-- component rows -->
  <div class="flex-1 overflow-y-auto no-scrollbar">
    {#each entity.filteredComponents as comp, i}
      {@const isActive = comp.state === "active"}
      <div class="relative flex items-start gap-4 px-5 py-3.5 border-b border-[var(--line)]
                  transition-colors {isActive ? 'bg-[var(--surface)]' : 'hover:bg-[var(--paper)]'}">

        <!-- Active accent left-border -->
        {#if isActive}
          <div class="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--accent)]"></div>
        {/if}

        <!-- index label -->
        <span class="font-mono text-[10px] tracking-[0.08em] text-[var(--ink-300)] shrink-0 pt-0.5 w-5 text-right select-none">
          {String(i + 1).padStart(2, "0")}
        </span>

        <!-- body -->
        <div class="flex-1 min-w-0">
          <!-- service · kind header + state badge -->
          <div class="flex items-center gap-1.5 mb-1">
            <span class="font-mono text-[10px] tracking-[0.08em] uppercase"
              style="color: {isActive ? 'var(--accent)' : 'var(--ink-500)'}">
              {comp.service}
            </span>
            <span class="font-mono text-[10px] text-[var(--line-strong)]">·</span>
            <span class="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
              {comp.kind}
            </span>

            <!-- state badge — right-aligned -->
            <span class="ml-auto font-mono text-[10px] tracking-[0.08em] uppercase shrink-0 flex items-center gap-1"
              style="color: {STATE_COLOR[comp.state] ?? 'var(--ink-300)'}">
              {#if isActive}
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse inline-block"></span>
              {/if}
              {STATE_LABEL[comp.state] ?? comp.state}
            </span>
          </div>

          <!-- title -->
          <p class="text-[14px] leading-[1.4] m-0 mb-2 {isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-700)]'}">
            {comp.title}
          </p>

          <!-- meta key-values -->
          {#if comp.meta.length > 0}
            <div class="flex flex-wrap gap-x-4 gap-y-0.5">
              {#each comp.meta as { key, value }}
                <span class="font-mono text-[10px] tracking-[0.06em] text-[var(--ink-300)]">
                  {key}&thinsp;<span class="text-[var(--ink-500)]">{value}</span>
                </span>
              {/each}
            </div>
          {/if}
        </div>

      </div>
    {/each}

    {#if entity.filteredComponents.length === 0}
      <div class="flex items-center justify-center h-20">
        <span class="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
          NO COMPONENTS
        </span>
      </div>
    {/if}
  </div>

</div>
