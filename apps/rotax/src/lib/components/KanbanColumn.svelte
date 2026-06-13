<script lang="ts">
  import { dndzone } from "svelte-dnd-action";
  import KanbanCard from "./KanbanCard.svelte";
  import type { Task, TaskStatus } from "$lib/types";

  let {
    columnId,
    label,
    tasks,
    onFinalize,
    onAdd,
    onStatusChange,
    onUpdate,
    onDelete,
  }: {
    columnId: TaskStatus;
    label: string;
    tasks: Task[];
    onFinalize: (columnId: TaskStatus, items: DndTask[]) => void;
    onAdd: (columnId: TaskStatus, title: string) => void;
    onStatusChange: (entityId: string, status: TaskStatus) => void;
    onUpdate: (entityId: string, patch: { title?: string; description?: string }) => void;
    onDelete: (entityId: string) => void;
  } = $props();

  type DndTask = Task & { id: string };

  let localItems = $state<DndTask[]>(tasks.map((t) => ({ ...t, id: t.entityId })));
  let isDragging = $state(false);

  const SHADOW_ID = "id:dnd-shadow-placeholder-0000";

  // sync from parent whenever not dragging (picks up content changes like title/description edits)
  $effect(() => {
    if (isDragging) return;
    localItems = tasks.map((t) => ({ ...t, id: t.entityId }));
  });

  let addingNew = $state(false);
  let newTitle = $state("");

  function handleAdd() {
    const t = newTitle.trim();
    if (!t) return;
    onAdd(columnId, t);
    newTitle = "";
    addingNew = false;
  }

  function handleAddKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") { addingNew = false; newTitle = ""; }
  }
</script>

<div class="column">
  <div class="column-header">
    <span class="column-label">{label}</span>
    <span class="column-count">{localItems.filter(t => t.id !== SHADOW_ID).length}</span>
    <button class="btn-add" onclick={() => (addingNew = true)} aria-label="タスクを追加">+</button>
  </div>

  {#if addingNew}
    <div class="new-task-form">
      <input
        class="new-task-input"
        bind:value={newTitle}
        onkeydown={handleAddKeydown}
        placeholder="タスクを入力..."
        autofocus
      />
      <div class="new-task-actions">
        <button class="btn-save" onclick={handleAdd}>追加</button>
        <button class="btn-cancel" onclick={() => { addingNew = false; newTitle = ""; }}>キャンセル</button>
      </div>
    </div>
  {/if}

  <div
    class="cards"
    use:dndzone={{ items: localItems, flipDurationMs: 150, type: "kanban" }}
    onconsider={(e: CustomEvent<{ items: DndTask[] }>) => {
      isDragging = true;
      localItems = e.detail.items;
    }}
    onfinalize={(e: CustomEvent<{ items: DndTask[] }>) => {
      localItems = e.detail.items.map((item) => ({
        ...item,
        task: { status: columnId },
      }));
      isDragging = false;
      onFinalize(columnId, e.detail.items);
    }}
  >
    {#each localItems as task (task.id)}
      <div class="card-wrapper">
        <KanbanCard
          {task}
          {onStatusChange}
          {onUpdate}
          {onDelete}
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
  }

  .column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 2px;
  }

  .column-label {
    font-family: "DM Mono", monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ash);
    flex: 1;
  }

  .column-count {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    color: var(--color-fog);
    background: var(--color-cloud);
    border: 1px solid var(--color-smoke);
    border-radius: 10px;
    padding: 1px 6px;
  }

  .btn-add {
    font-size: 16px;
    line-height: 1;
    color: var(--color-dusk);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }

  .btn-add:hover {
    color: var(--color-prism);
    background: var(--color-tint);
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 60px;
  }

  .card-wrapper {
    /* needed for dnd */
  }

  .new-task-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--color-ghost);
    border: 1px solid var(--color-smoke);
    border-radius: 6px;
    padding: 12px;
  }

  .new-task-input {
    font-family: "DM Serif Display", serif;
    font-size: 14px;
    color: var(--color-ash);
    border: 1px solid var(--color-smoke);
    border-radius: 4px;
    padding: 6px 10px;
    background: var(--color-white);
    outline: none;
    width: 100%;
  }

  .new-task-input:focus {
    border-color: var(--color-prism);
  }

  .new-task-actions {
    display: flex;
    gap: 6px;
  }

  .btn-save {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    background: var(--color-prism);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    padding: 4px 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-save:hover {
    background: var(--color-depth);
  }

  .btn-cancel {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    background: transparent;
    color: var(--color-dusk);
    border: 1px solid var(--color-smoke);
    border-radius: 4px;
    padding: 4px 12px;
    cursor: pointer;
  }
</style>
