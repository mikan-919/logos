<script lang="ts">
import WorldBar from "$lib/entity/WorldBar.svelte";
import EntityHero from "$lib/entity/EntityHero.svelte";
import ComponentsPanel from "$lib/entity/ComponentsPanel.svelte";
import RefsPanel from "$lib/entity/RefsPanel.svelte";
import ProvenancePanel from "$lib/entity/ProvenancePanel.svelte";
</script>

<!--
  LAYOUT.md grid — reading order: worldbar → entity → components → refs → provenance

  Base (narrow / mobile): single column stack
    worldbar / entity / components / refs / provenance

  Wide (≥ 960px): 3-column grid
    worldbar    worldbar    worldbar     ← col-span-3, row 1
    entity      entity      entity       ← col-span-3, row 2
    components  components  refs         ← col 1-2 + col 3, row 3
    components  components  provenance   ← col 1-2 + col 3, row 4

  Components keeps the widest footprint at every breakpoint (A1).
  Refs and provenance stack in the third column (paths above record).
-->
<div class="w-dvw h-dvh bg-[var(--paper)] text-[var(--ink)] overflow-hidden
            flex flex-col md:grid md:min-h-0"
  style="grid-template-columns: 1fr 1fr 1fr;
         grid-template-rows: auto auto 1fr 1fr;">

  <!-- worldbar: col 1-3 / row 1 -->
  <div class="md:col-start-1 md:col-end-4 md:row-start-1">
    <WorldBar />
  </div>

  <!-- entity: col 1-3 / row 2 -->
  <div class="md:col-start-1 md:col-end-4 md:row-start-2">
    <EntityHero />
  </div>

  <!-- components: col 1-2 / row 3-4 (tallest region) -->
  <div class="md:col-start-1 md:col-end-3 md:row-start-3 md:row-end-5 min-h-0 overflow-hidden flex flex-col">
    <ComponentsPanel />
  </div>

  <!-- refs: col 3 / row 3 -->
  <div class="md:col-start-3 md:col-end-4 md:row-start-3 min-h-0 overflow-hidden flex flex-col border-l border-[var(--line)]">
    <RefsPanel />
  </div>

  <!-- provenance: col 3 / row 4 -->
  <div class="md:col-start-3 md:col-end-4 md:row-start-4 min-h-0 overflow-hidden flex flex-col border-l border-t border-[var(--line)]">
    <ProvenancePanel />
  </div>

</div>
