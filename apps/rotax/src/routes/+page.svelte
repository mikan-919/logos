<script lang="ts">
  import { flushSync } from "svelte";
  import KanbanColumn from "$lib/components/KanbanColumn.svelte";
  import DateColumn from "$lib/components/timeline/DateColumn.svelte";
  import type { Task, TaskStatus, ViewMode } from "$lib/types";

  let { data } = $props();
  type DndTask = Task & { id: string };

  let view = $state<ViewMode>("kanban");
  let timelineEl = $state<HTMLElement | null>(null);

  // ── per-card view transition ────────────────────────────
  // Tag only the cards currently visible in the viewport so the browser
  // FLIPs them between kanban ↔ timeline; everything else crossfades.
  function visibleCardIds(): string[] {
    const ids: string[] = [];
    document.querySelectorAll<HTMLElement>("[data-entity-id]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const vis = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      if (vis && el.dataset.entityId) ids.push(el.dataset.entityId);
    });
    return ids;
  }
  function tagCards(ids: string[]) {
    for (const id of ids) {
      const el = document.querySelector<HTMLElement>(`[data-entity-id="${CSS.escape(id)}"]`);
      if (el) el.style.viewTransitionName = `card-${id}`;
    }
  }
  function clearCardTags() {
    document.querySelectorAll<HTMLElement>("[data-entity-id]").forEach((el) => {
      el.style.viewTransitionName = "";
    });
  }

  function scrollTodayIntoView(behavior: ScrollBehavior = "auto") {
    if (!timelineEl) return;
    const col = timelineEl.querySelector<HTMLElement>('[data-today="true"]');
    if (!col) return;
    // place today ~1/3 from the left so today + upcoming days are visible
    timelineEl.scrollTo({ left: col.offsetLeft - timelineEl.clientWidth / 3, behavior });
  }

  function switchView(next: ViewMode) {
    if (next === view) return;

    if (!("startViewTransition" in document)) {
      flushSync(() => {
        view = next;
      });
      if (next === "timeline") scrollTodayIntoView();
      return;
    }

    const ids = visibleCardIds();
    tagCards(ids);

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        view = next;
      });
      if (next === "timeline") scrollTodayIntoView("auto");
      tagCards(ids); // re-tag matching cards in the freshly rendered view
    });
    transition.finished.finally(() => clearCardTags());
  }

  // ── state ──────────────────────────────────────────────
  let cols = $state<Record<TaskStatus, Task[]>>({ "todo": [], "in-progress": [], "done": [] });
  let allTasks = $state<Task[]>([]);

  function syncFromServer(ts: Task[]) {
    allTasks = [...ts];
    cols = {
      "todo": ts.filter((t) => t.task.status === "todo"),
      "in-progress": ts.filter((t) => t.task.status === "in-progress"),
      "done": ts.filter((t) => t.task.status === "done"),
    };
  }
  syncFromServer(data.tasks);

  function localDate(d: Date = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const today = localDate();
  function addDays(base: string, n: number) {
    const [y, m, d] = base.split("-").map(Number);
    return localDate(new Date(y, m - 1, d + n));
  }
  const pastDates = Array.from({ length: 30 }, (_, i) => addDays(today, -(i + 1))).reverse();
  const futureDates = Array.from({ length: 30 }, (_, i) => addDays(today, i + 1));
  const allDates = [...pastDates, today, ...futureDates];
  function tasksForDate(date: string) {
    return allTasks.filter((t) => t.schedule?.date === date);
  }

  // ── kanban handlers ─────────────────────────────────────
  const SHADOW_ID = "id:dnd-shadow-placeholder-0000";

  async function handleFinalize(columnId: TaskStatus, items: DndTask[]) {
    const real = items.filter((i) => i.id !== SHADOW_ID);
    const moved = real.filter((t) => t.task.status !== columnId);
    cols[columnId] = real.map(({ id: _id, ...rest }) => ({ ...rest, task: { status: columnId } } as Task));
    if (moved.length === 0) return;
    for (const s of Object.keys(cols) as TaskStatus[]) {
      if (s === columnId) continue;
      cols[s] = cols[s].filter((t) => !moved.some((m) => m.entityId === t.entityId));
    }
    await Promise.all(moved.map((t) =>
      fetch(`/api/tasks/${t.entityId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: columnId }),
      })
    ));
  }

  async function handleAdd(columnId: TaskStatus, title: string) {
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const { entityId } = await res.json();
    if (columnId !== "todo") {
      await fetch(`/api/tasks/${entityId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: columnId }),
      });
    }
    const t: Task = { entityId, name: { title }, task: { status: columnId } };
    cols[columnId] = [...cols[columnId], t];
    allTasks = [...allTasks, t];
  }

  async function handleStatusChange(entityId: string, status: TaskStatus) {
    for (const s of Object.keys(cols) as TaskStatus[]) cols[s] = cols[s].filter((t) => t.entityId !== entityId);
    const task = allTasks.find((t) => t.entityId === entityId);
    if (task) {
      const updated = { ...task, task: { status } };
      cols[status] = [...cols[status], updated];
      allTasks = allTasks.map((t) => t.entityId === entityId ? updated : t);
    }
    await fetch(`/api/tasks/${entityId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleUpdate(entityId: string, patch: { title?: string; description?: string }) {
    allTasks = allTasks.map((t) => t.entityId === entityId ? { ...t, name: { ...t.name, ...patch } } : t);
    for (const s of Object.keys(cols) as TaskStatus[]) {
      cols[s] = cols[s].map((t) => t.entityId === entityId ? { ...t, name: { ...t.name, ...patch } } : t);
    }
    await fetch(`/api/tasks/${entityId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function handleDelete(entityId: string) {
    allTasks = allTasks.filter((t) => t.entityId !== entityId);
    for (const s of Object.keys(cols) as TaskStatus[]) cols[s] = cols[s].filter((t) => t.entityId !== entityId);
    await fetch(`/api/tasks/${entityId}`, { method: "DELETE" });
  }

  async function handleSchedule(entityId: string, date: string) {
    const status: TaskStatus = date < today ? "done" : date === today ? "in-progress" : "todo";
    allTasks = allTasks.map((t) =>
      t.entityId === entityId ? { ...t, schedule: { date }, task: { status } } : t
    );
    await fetch(`/api/tasks/${entityId}/schedule`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
  }
</script>

<!-- floating toolbar -->
<header class="top-bar">
  <h1 class="page-title">Rotax</h1>
  <span class="task-count">{allTasks.length}</span>
  <div class="view-toggle">
    <button class="toggle-btn" class:active={view === "timeline"} onclick={() => switchView("timeline")}>
      Timeline
    </button>
    <button class="toggle-btn" class:active={view === "kanban"} onclick={() => switchView("kanban")}>
      Kanban
    </button>
  </div>
</header>

<main>
  {#if view === "kanban"}
    <div class="kanban">
      <KanbanColumn
        columnId="done" label="Done"
        tasks={cols["done"]}
        onFinalize={handleFinalize} onAdd={handleAdd}
        onStatusChange={handleStatusChange} onUpdate={handleUpdate} onDelete={handleDelete}
      />
      <KanbanColumn
        columnId="in-progress" label="In Progress"
        tasks={cols["in-progress"]}
        onFinalize={handleFinalize} onAdd={handleAdd}
        onStatusChange={handleStatusChange} onUpdate={handleUpdate} onDelete={handleDelete}
      />
      <KanbanColumn
        columnId="todo" label="Todo"
        tasks={cols["todo"]}
        onFinalize={handleFinalize} onAdd={handleAdd}
        onStatusChange={handleStatusChange} onUpdate={handleUpdate} onDelete={handleDelete}
      />
    </div>
  {:else}
    <div class="timeline" bind:this={timelineEl}>
      <div class="date-track">
        {#each allDates as date (date)}
          <DateColumn
            {date}
            isToday={date === today}
            isPast={date < today}
            tasks={tasksForDate(date)}
            onSchedule={handleSchedule}
          />
        {/each}
      </div>
    </div>
  {/if}
</main>

{#if view === "timeline"}
  <button class="today-fab" onclick={() => scrollTodayIntoView("smooth")}>Today</button>
{/if}

<style>
  /* floating toolbar */
  .top-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 24px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-smoke);
    z-index: 50;
  }

  .page-title {
    font-family: "Bebas Neue", sans-serif;
    font-size: 26px;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--color-ink);
    margin: 0;
    line-height: 1;
  }

  .task-count {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    color: var(--color-fog);
    background: var(--color-cloud);
    border: 1px solid var(--color-smoke);
    border-radius: 10px;
    padding: 2px 8px;
  }

  .view-toggle {
    margin-left: auto;
    display: flex;
    background: var(--color-cloud);
    border: 1px solid var(--color-smoke);
    border-radius: 6px;
    padding: 3px;
    gap: 2px;
  }

  .toggle-btn {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 4px 14px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-dusk);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .toggle-btn.active {
    background: var(--color-white);
    color: var(--color-ash);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  /* layout */
  main {
    position: fixed;
    top: 48px; bottom: 56px; left: 0; right: 0;
  }

  /* kanban: three equal columns */
  .kanban {
    display: flex;
    height: 100%;
    gap: 16px;
    padding: 16px;
  }

  /* timeline: one continuous horizontal scroll */
  .timeline {
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .date-track {
    display: flex;
    height: 100%;
  }

  /* floating "jump to today" button */
  .today-fab {
    position: fixed;
    bottom: 72px;
    right: 24px;
    z-index: 60;
    font-family: "DM Mono", monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-white);
    background: var(--color-prism);
    border: none;
    border-radius: 999px;
    padding: 8px 18px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
    transition: background 0.15s;
  }
  .today-fab:hover {
    background: var(--color-depth);
  }
</style>
