<script lang="ts">
import { entity } from "./state.svelte";

const STATE_COLORS: Record<string, string> = {
	done: "var(--positive)",
	active: "var(--accent)",
	upcoming: "var(--ink-500)",
	backlog: "var(--ink-300)",
};
</script>

<!-- components region: the grounded appearances (表現), indexed square rows on the line (A1/A5)
     Full-width at every breakpoint; widest footprint at wide layout (2 of 3 cols). -->
<div class="flex flex-col min-h-0 border-r border-[var(--line)]">

  <!-- region header -->
  <div class="flex items-center gap-3 px-6 h-10 border-b border-[var(--line)] shrink-0">
    <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
      COMPONENTS
    </span>
    <span class="font-mono text-[10.5px] tracking-[0.08em] text-[var(--ink-300)]">
      {entity.filteredComponents.length}
    </span>
  </div>

  <!-- component rows — square, hairline-bordered, surface fill -->
  <div class="flex-1 overflow-y-auto no-scrollbar">
    {#each entity.filteredComponents as comp, i}
      <div class="flex items-start gap-4 px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--paper)] transition-colors">

        <!-- index label (mono, top-left) -->
        <span class="font-mono text-[10.5px] tracking-[0.08em] text-[var(--ink-300)] shrink-0 pt-0.5 w-6 text-right">
          {String(i + 1).padStart(2, "0")}
        </span>

        <!-- body -->
        <div class="flex-1 min-w-0">
          <!-- service + kind header row -->
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-500)]">
              {comp.service}
            </span>
            <span class="font-mono text-[10.5px] tracking-[0.08em] text-[var(--line-strong)]">·</span>
            <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
              {comp.kind}
            </span>

            <!-- state badge — right-aligned -->
            <span class="ml-auto font-mono text-[10.5px] tracking-[0.08em] uppercase shrink-0"
              style="color: {STATE_COLORS[comp.state] ?? 'var(--ink-300)'}">
              {comp.state}
            </span>
          </div>

          <!-- title (body voice) -->
          <p class="text-[14px] leading-[1.45] text-[var(--ink)] m-0 mb-2 truncate">
            {comp.title}
          </p>

          <!-- meta key-values (mono data voice) -->
          <div class="flex flex-wrap gap-x-4 gap-y-0.5">
            {#each comp.meta as { key, value }}
              <span class="font-mono text-[10.5px] tracking-[0.06em] text-[var(--ink-300)]">
                {key}&nbsp;<span class="text-[var(--ink-500)]">{value}</span>
              </span>
            {/each}
          </div>
        </div>

      </div>
    {/each}

    {#if entity.filteredComponents.length === 0}
      <div class="flex items-center justify-center h-24">
        <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
          NO COMPONENTS
        </span>
      </div>
    {/if}
  </div>

</div>
