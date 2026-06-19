<script lang="ts">
import { entity } from "./state.svelte";

function fmtTs(ts: string): string {
	const d = new Date(ts);
	const date = d.toISOString().slice(0, 10);
	const time = d.toISOString().slice(11, 19);
	return `${date} ${time}`;
}
</script>

<!-- provenance region: append-only, reverse-chronological, origin-stamped change log (A3)
     Mono throughout — history reads as measured record, not a feed. -->
<div class="flex flex-col min-h-0 flex-1">

  <!-- region header -->
  <div class="flex items-center gap-3 px-4 h-10 border-b border-[var(--line)] shrink-0">
    <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
      PROVENANCE
    </span>
  </div>

  <!-- log rows — reverse-chronological, mono, no reverse on layout (append-only reads bottom-up in display order) -->
  <div class="flex-1 overflow-y-auto no-scrollbar bg-[var(--paper)]">
    {#each entity.focused?.provenance ?? [] as entry}
      <div class="flex flex-col gap-0.5 px-4 py-2.5 border-b border-[var(--line)]">
        <!-- origin + timestamp (mono meta) -->
        <div class="flex items-center gap-2">
          <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--accent)] shrink-0">
            {entry.origin}
          </span>
          <span class="font-mono text-[10.5px] tracking-[0.06em] text-[var(--ink-300)] tabular-nums">
            {fmtTs(entry.ts)}
          </span>
        </div>
        <!-- event description (mono data) -->
        <span class="font-mono text-[11px] tracking-[0.02em] text-[var(--ink-500)] leading-[1.4]">
          {entry.event}
        </span>
      </div>
    {/each}

    {#if (entity.focused?.provenance.length ?? 0) === 0}
      <div class="flex items-center justify-center h-16">
        <span class="font-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--ink-300)]">
          NO RECORD
        </span>
      </div>
    {/if}
  </div>

</div>
