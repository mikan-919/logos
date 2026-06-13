<script lang="ts">
  import type { Task } from "$lib/types";
  import { marked } from "marked";

  let {
    task,
    onStatusChange,
    onUpdate,
    onDelete,
  }: {
    task: Task;
    onStatusChange: (entityId: string, status: Task["task"]["status"]) => void;
    onUpdate: (entityId: string, patch: { title?: string; description?: string }) => void;
    onDelete: (entityId: string) => void;
  } = $props();

  let editing = $state(false);
  let editTitle = $state("");
  let editDescription = $state("");

  $effect(() => {
    if (!editing) {
      editTitle = task.name.title;
      editDescription = task.name.description ?? "";
    }
  });

  function startEdit() {
    editTitle = task.name.title;
    editDescription = task.name.description ?? "";
    editing = true;
  }

  function saveEdit() {
    onUpdate(task.entityId, { title: editTitle, description: editDescription });
    editing = false;
  }

  function cancelEdit() {
    editing = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") cancelEdit();
    if (e.key === "Enter" && e.metaKey) saveEdit();
  }

  const statusColors: Record<string, string> = {
    "todo": "badge-todo",
    "in-progress": "badge-progress",
    "done": "badge-done",
  };

  const statusLabels: Record<string, string> = {
    "todo": "Todo",
    "in-progress": "In Progress",
    "done": "Done",
  };
</script>

<div
  class="card"
  data-entity-id={task.entityId}
  role="button"
  tabindex="0"
  onclick={!editing ? startEdit : undefined}
  onkeydown={(e) => { if (!editing && (e.key === "Enter" || e.key === " ")) startEdit(); }}
>
  <div class="card-left">
    {#if editing}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="edit-title"
        bind:value={editTitle}
        onkeydown={handleKeydown}
        placeholder="Task title"
        autofocus
        onclick={(e) => e.stopPropagation()}
      />
    {:else}
      <h3 class="card-title">{task.name.title}</h3>
    {/if}

    <span class="badge {statusColors[task.task.status]}">
      {statusLabels[task.task.status]}
    </span>

    {#if task.createdAt}
      <span class="meta-date">{new Date(task.createdAt).toLocaleDateString("ja-JP")}</span>
    {/if}

    {#if editing}
      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
      <div class="edit-actions" onclick={(e) => e.stopPropagation()}>
        <button class="btn-save" onclick={saveEdit}>保存</button>
        <button class="btn-cancel" onclick={cancelEdit}>キャンセル</button>
        <button class="btn-delete" onclick={() => onDelete(task.entityId)}>削除</button>
      </div>
    {/if}
  </div>

  <div class="card-divider"></div>

  <div class="card-right">
    {#if editing}
      <textarea
        class="edit-description"
        bind:value={editDescription}
        onkeydown={handleKeydown}
        placeholder="Markdownで内容を入力..."
        onclick={(e) => e.stopPropagation()}
        rows={6}
      ></textarea>
    {:else if task.name.description}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html marked.parse(task.name.description)}
    {:else}
      <span class="empty-description">クリックして編集</span>
    {/if}
  </div>
</div>

<style>
  .card {
    background: var(--color-white);
    border: 1px solid var(--color-smoke);
    border-radius: 6px;
    display: flex;
    gap: 0;
    min-height: 100px;
    cursor: pointer;
    transition: box-shadow 0.15s, border-color 0.15s;
    overflow: hidden;
  }

  .card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-color: var(--color-dusk);
  }

  .card-left {
    width: 40%;
    flex-shrink: 0;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--color-ghost);
    border-right: 1px solid var(--color-veil);
  }

  .card-divider {
    display: none;
  }

  .card-right {
    flex: 1;
    padding: 14px 16px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-ash);
    overflow: hidden;
  }

  .card-right :global(p) {
    margin: 0 0 8px;
  }

  .card-right :global(p:last-child) {
    margin-bottom: 0;
  }

  .card-right :global(code) {
    font-family: "DM Mono", monospace;
    font-size: 11px;
    background: var(--color-tint);
    color: var(--color-depth);
    padding: 1px 4px;
    border-radius: 3px;
  }

  .card-title {
    font-family: "DM Serif Display", serif;
    font-size: 14px;
    font-weight: 400;
    color: var(--color-ash);
    margin: 0;
    line-height: 1.3;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    font-family: "DM Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 3px;
    width: fit-content;
  }

  .badge-todo {
    background: var(--color-cloud);
    color: var(--color-dusk);
    border: 1px solid var(--color-smoke);
  }

  .badge-progress {
    background: var(--color-tint);
    color: var(--color-depth);
    border: 1px solid var(--color-haze);
  }

  .badge-done {
    background: var(--color-ash);
    color: var(--color-cloud);
    border: 1px solid var(--color-ash);
  }

  .meta-date {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    color: var(--color-fog);
  }

  .empty-description {
    font-family: "DM Mono", monospace;
    font-size: 11px;
    color: var(--color-fog);
    font-style: italic;
  }

  .edit-title {
    font-family: "DM Serif Display", serif;
    font-size: 14px;
    color: var(--color-ash);
    border: 1px solid var(--color-smoke);
    border-radius: 4px;
    padding: 4px 8px;
    width: 100%;
    background: var(--color-white);
    outline: none;
  }

  .edit-title:focus {
    border-color: var(--color-prism);
  }

  .edit-description {
    font-family: "DM Mono", monospace;
    font-size: 12px;
    color: var(--color-ash);
    border: 1px solid var(--color-smoke);
    border-radius: 4px;
    padding: 8px;
    width: 100%;
    resize: vertical;
    background: var(--color-white);
    outline: none;
    line-height: 1.6;
  }

  .edit-description:focus {
    border-color: var(--color-prism);
  }

  .edit-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .btn-save {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    background: var(--color-prism);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    padding: 4px 10px;
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
    padding: 4px 10px;
    cursor: pointer;
  }

  .btn-delete {
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    background: transparent;
    color: #c0392b;
    border: 1px solid #e8c6c3;
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    margin-left: auto;
  }
</style>
