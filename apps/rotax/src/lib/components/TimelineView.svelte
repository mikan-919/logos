<script lang="ts">
  import { dndzone } from "svelte-dnd-action";
  import type { Task } from "$lib/types";

  let {
    tasks,
    onSchedule,
    onUnschedule,
    onUpdate,
    onDelete,
  }: {
    tasks: Task[];
    onSchedule: (entityId: string, date: string) => void;
    onUnschedule: (entityId: string) => void;
    onUpdate: (entityId: string, patch: { title?: string; description?: string }) => void;
    onDelete: (entityId: string) => void;
  } = $props();

  const VISIBLE_DAYS = 5;
  const SHADOW_ID = "id:dnd-shadow-placeholder-0000";

  type DndTask = Task & { id: string };

  // generate date range centered on today, extending ±30 days
  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  function addDays(base: string, n: number): string {
    const d = new Date(base + "T00:00:00");
    d.setDate(d.getDate() + n);
    return isoDate(d);
  }

  const today = isoDate(new Date());

  // generate 61 days centered on today
  const allDates = Array.from({ length: 61 }, (_, i) => addDays(today, i - 30));

  function dateLabel(date: string): string {
    const d = new Date(date + "T00:00:00");
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return `${m}/${day} ${dow}`;
  }

  function statusFromDate(date: string): Task["task"]["status"] {
    if (date < today) return "done";
    if (date === today) return "in-progress";
    return "todo";
  }

  // unscheduled tasks
  let unscheduledItems = $state<DndTask[]>(
    tasks.filter((t) => !t.schedule).map((t) => ({ ...t, id: t.entityId }))
  );

  // per-date items
  let dateItems = $state<Record<string, DndTask[]>>(
    Object.fromEntries(
      allDates.map((date) => [
        date,
        tasks
          .filter((t) => t.schedule?.date === date)
          .map((t) => ({ ...t, id: t.entityId })),
      ])
    )
  );

  $effect(() => {
    unscheduledItems = tasks
      .filter((t) => !t.schedule)
      .map((t) => ({ ...t, id: t.entityId }));
    for (const date of allDates) {
      dateItems[date] = tasks
        .filter((t) => t.schedule?.date === date)
        .map((t) => ({ ...t, id: t.entityId }));
    }
  });

  let isDragging = $state(false);

  function handleConsider(date: string | null, items: DndTask[]) {
    isDragging = true;
    if (date === null) {
      unscheduledItems = items;
    } else {
      dateItems[date] = items;
    }
  }

  function handleFinalize(date: string | null, items: DndTask[]) {
    const realItems = items.filter((i) => i.id !== SHADOW_ID);
    if (date === null) {
      unscheduledItems = realItems;
      // tasks dropped here get unscheduled
      const moved = realItems.filter((t) => t.schedule);
      moved.forEach((t) => onUnschedule(t.entityId));
    } else {
      dateItems[date] = realItems;
      // tasks dropped here get scheduled to this date
      const moved = realItems.filter((t) => t.schedule?.date !== date);
      moved.forEach((t) => onSchedule(t.entityId, date));
    }
    isDragging = false;
  }

  // scroll to today on mount
  let scrollContainer: HTMLElement;
  $effect(() => {
    if (!scrollContainer) return;
    const todayEl = scrollContainer.querySelector("[data-today='true']") as HTMLElement;
    if (todayEl) {
      scrollContainer.scrollLeft = todayEl.offsetLeft - scrollContainer.offsetWidth / 2 + todayEl.offsetWidth / 2;
    }
  });
</script>

<div class="timeline-layout">
  <!-- unscheduled pool -->
  <div class="unscheduled-panel">
    <div class="unscheduled-header">Unscheduled</div>
    <div
      class="unscheduled-zone"
      use:dndzone={{ items: unscheduledItems, flipDurationMs: 120, type: "timeline" }}
      onconsider={(e: CustomEvent<{ items: DndTask[] }>) => handleConsider(null, e.detail.items)}
      onfinalize={(e: CustomEvent<{ items: DndTask[] }>) => handleFinalize(null, e.detail.items)}
    >
      {#each unscheduledItems as task (task.id)}
        <div class="tl-card unscheduled-card">
          <span class="tl-title">{task.name.title}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- date columns -->
  <div class="date-scroll" bind:this={scrollContainer}>
    <div class="date-track">
      {#each allDates as date (date)}
        {@const isToday = date === today}
        {@const isPast = date < today}
        <div
          class="date-col"
          class:today={isToday}
          class:past={isPast}
          data-today={isToday}
        >
          <div class="date-header">
            <span class="date-label">{dateLabel(date)}</span>
            {#if isToday}<span class="today-badge">Today</span>{/if}
          </div>
          <div
            class="date-zone"
            use:dndzone={{ items: dateItems[date], flipDurationMs: 120, type: "timeline" }}
            onconsider={(e: CustomEvent<{ items: DndTask[] }>) => handleConsider(date, e.detail.items)}
            onfinalize={(e: CustomEvent<{ items: DndTask[] }>) => handleFinalize(date, e.detail.items)}
          >
            {#each dateItems[date] as task (task.id)}
              <div class="tl-card" class:done={isPast} class:in-progress={isToday}>
                <span class="tl-title">{task.name.title}</span>
                {#if task.name.description}
                  <span class="tl-desc">{task.name.description.slice(0, 60)}</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .timeline-layout {
    display: flex;
    height: 100%;
    overflow: hidden;
    gap: 0;
  }

  /* unscheduled panel */
  .unscheduled-panel {
    width: 160px;
    flex-shrink: 0;
    border-right: 1px solid var(--color-smoke);
    display: flex;
    flex-direction: column;
    background: var(--color-cloud);
  }

  .unscheduled-header {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-dusk);
    padding: 12px 14px 8px;
    border-bottom: 1px solid var(--color-smoke);
  }

  .unscheduled-zone {
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
  }

  /* date scroll */
  .date-scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
  }

  .date-track {
    display: flex;
    height: 100%;
    gap: 0;
  }

  .date-col {
    width: 200px;
    flex-shrink: 0;
    border-right: 1px solid var(--color-smoke);
    display: flex;
    flex-direction: column;
    background: var(--color-white);
  }

  .date-col.past {
    background: var(--color-cloud);
  }

  .date-col.today {
    background: var(--color-tint);
    border-right: 1px solid var(--color-haze);
    border-left: 1px solid var(--color-haze);
  }

  .date-header {
    padding: 10px 14px 8px;
    border-bottom: 1px solid var(--color-smoke);
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .date-label {
    font-family: "DM Mono", monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--color-ash);
  }

  .today .date-label {
    color: var(--color-depth);
    font-weight: 500;
  }

  .past .date-label {
    color: var(--color-fog);
  }

  .today-badge {
    font-family: "DM Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--color-prism);
    color: var(--color-white);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .date-zone {
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
    min-height: 60px;
  }

  /* cards */
  .tl-card {
    background: var(--color-white);
    border: 1px solid var(--color-smoke);
    border-radius: 5px;
    padding: 8px 10px;
    cursor: grab;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .tl-card.done {
    background: var(--color-ghost);
    opacity: 0.7;
  }

  .tl-card.in-progress {
    border-color: var(--color-haze);
    background: var(--color-white);
  }

  .unscheduled-card {
    background: var(--color-white);
    border-style: dashed;
  }

  .tl-title {
    font-family: "DM Serif Display", serif;
    font-size: 12px;
    color: var(--color-ash);
    line-height: 1.3;
  }

  .tl-desc {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    color: var(--color-fog);
    line-height: 1.4;
  }
</style>
