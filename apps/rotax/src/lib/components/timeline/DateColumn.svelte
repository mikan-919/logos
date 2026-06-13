<script lang="ts">
  import { dndzone } from "svelte-dnd-action";
  import type { Task } from "$lib/types";

  let {
    date,
    tasks,
    isToday = false,
    isPast = false,
    onSchedule,
  }: {
    date: string;
    tasks: Task[];
    isToday?: boolean;
    isPast?: boolean;
    onSchedule: (entityId: string, date: string) => void;
  } = $props();

  const SHADOW_ID = "id:dnd-shadow-placeholder-0000";
  type DndTask = Task & { id: string };

  let localItems = $state<DndTask[]>(tasks.map((t) => ({ ...t, id: t.entityId })));
  let isDragging = $state(false);

  $effect(() => {
    if (isDragging) return;
    localItems = tasks.map((t) => ({ ...t, id: t.entityId }));
  });

  function formatDate(d: string) {
    const dt = new Date(d + "T00:00:00");
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  }

  function formatDow(d: string) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(d + "T00:00:00").getDay()];
  }
</script>

<div class="date-col" class:today={isToday} class:past={isPast} data-today={isToday}>
  <div class="date-header">
    <span class="date-num">{formatDate(date)}</span>
    <span class="dow">{formatDow(date)}</span>
    {#if isToday}<span class="today-pill">Today</span>{/if}
  </div>

  <div
    class="drop-zone"
    use:dndzone={{ items: localItems, flipDurationMs: 120, type: "timeline" }}
    onconsider={(e: CustomEvent<{ items: DndTask[] }>) => {
      isDragging = true;
      localItems = e.detail.items;
    }}
    onfinalize={(e: CustomEvent<{ items: DndTask[] }>) => {
      const real = e.detail.items.filter((i) => i.id !== SHADOW_ID);
      localItems = real;
      isDragging = false;
      const moved = real.filter((t) => t.schedule?.date !== date);
      moved.forEach((t) => onSchedule(t.entityId, date));
    }}
  >
    {#each localItems as task (task.id)}
      <div class="tl-card" class:past={isPast} class:today={isToday} data-entity-id={task.entityId}>
        <span class="tl-title">{task.name.title}</span>
        {#if task.name.description}
          <span class="tl-desc">{task.name.description.slice(0, 50)}</span>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .date-col {
    width: 160px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid var(--color-smoke);
    background: var(--color-white);
  }
  .date-col.past { background: var(--color-cloud); }
  .date-col.today {
    width: 240px;
    background: var(--color-tint);
    border-left: 1px solid var(--color-haze);
    border-right: 1px solid var(--color-haze);
  }

  .date-header {
    padding: 8px 12px 6px;
    border-bottom: 1px solid var(--color-smoke);
    display: flex;
    align-items: baseline;
    gap: 5px;
    flex-shrink: 0;
  }
  .date-num {
    font-family: "DM Mono", monospace;
    font-size: 12px;
    color: var(--color-ash);
    font-weight: 500;
  }
  .today .date-num { color: var(--color-depth); }
  .past .date-num { color: var(--color-fog); }
  .dow {
    font-family: "DM Mono", monospace;
    font-size: 9px;
    color: var(--color-fog);
    letter-spacing: 0.04em;
  }
  .today-pill {
    margin-left: auto;
    font-family: "DM Mono", monospace;
    font-size: 8px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--color-prism);
    color: var(--color-white);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .drop-zone {
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    overflow-y: auto;
    min-height: 40px;
  }

  .tl-card {
    background: var(--color-white);
    border: 1px solid var(--color-smoke);
    border-radius: 4px;
    padding: 6px 8px;
    cursor: grab;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tl-card.past { opacity: 0.65; }
  .tl-card.today { border-color: var(--color-haze); }

  .tl-title {
    font-family: "DM Serif Display", serif;
    font-size: 11px;
    color: var(--color-ash);
    line-height: 1.3;
  }
  .tl-desc {
    font-family: "DM Mono", monospace;
    font-size: 9px;
    color: var(--color-fog);
  }
</style>
