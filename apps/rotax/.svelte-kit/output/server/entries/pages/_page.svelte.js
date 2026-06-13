import { a as attr, c as escape_html, b as attr_class, s as stringify, e as ensure_array_like } from "../../chunks/index.js";
import { marked } from "marked";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
var FEATURE_FLAG_NAMES = Object.freeze({
  // This flag exists as a workaround for issue 454 (basically a browser bug) - seems like these rect values take time to update when in grid layout. Setting it to true can cause strange behaviour in the REPL for non-grid zones, see issue 470
  USE_COMPUTED_STYLE_INSTEAD_OF_BOUNDING_RECT: "USE_COMPUTED_STYLE_INSTEAD_OF_BOUNDING_RECT"
});
_defineProperty({}, FEATURE_FLAG_NAMES.USE_COMPUTED_STYLE_INSTEAD_OF_BOUNDING_RECT, false);
var _ID_TO_INSTRUCTION;
var INSTRUCTION_IDs$1 = {
  DND_ZONE_ACTIVE: "dnd-zone-active",
  DND_ZONE_DRAG_DISABLED: "dnd-zone-drag-disabled"
};
_ID_TO_INSTRUCTION = {}, _defineProperty(_ID_TO_INSTRUCTION, INSTRUCTION_IDs$1.DND_ZONE_ACTIVE, "Tab to one the items and press space-bar or enter to start dragging it"), _defineProperty(_ID_TO_INSTRUCTION, INSTRUCTION_IDs$1.DND_ZONE_DRAG_DISABLED, "This is a disabled drag and drop list"), _ID_TO_INSTRUCTION;
function KanbanCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { task } = $$props;
    const statusColors = {
      "todo": "badge-todo",
      "in-progress": "badge-progress",
      "done": "badge-done"
    };
    const statusLabels = { "todo": "Todo", "in-progress": "In Progress", "done": "Done" };
    $$renderer2.push(`<div class="card svelte-7v0i77"${attr("data-entity-id", task.entityId)} role="button" tabindex="0"><div class="card-left svelte-7v0i77">`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<h3 class="card-title svelte-7v0i77">${escape_html(task.name.title)}</h3>`);
    }
    $$renderer2.push(`<!--]--> <span${attr_class(`badge ${stringify(statusColors[task.task.status])}`, "svelte-7v0i77")}>${escape_html(statusLabels[task.task.status])}</span> `);
    if (task.createdAt) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="meta-date svelte-7v0i77">${escape_html(new Date(task.createdAt).toLocaleDateString("ja-JP"))}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="card-divider svelte-7v0i77"></div> <div class="card-right svelte-7v0i77">`);
    if (task.name.description) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`${html(marked.parse(task.name.description))}`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span class="empty-description svelte-7v0i77">クリックして編集</span>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function KanbanColumn($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      columnId,
      label,
      tasks,
      onFinalize,
      onAdd,
      onStatusChange,
      onUpdate,
      onDelete
    } = $$props;
    let localItems = tasks.map((t) => ({ ...t, id: t.entityId }));
    const SHADOW_ID = "id:dnd-shadow-placeholder-0000";
    $$renderer2.push(`<div class="column svelte-mykq0n"><div class="column-header svelte-mykq0n"><span class="column-label svelte-mykq0n">${escape_html(label)}</span> <span class="column-count svelte-mykq0n">${escape_html(localItems.filter((t) => t.id !== SHADOW_ID).length)}</span> <button class="btn-add svelte-mykq0n" aria-label="タスクを追加">+</button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="cards svelte-mykq0n"><!--[-->`);
    const each_array = ensure_array_like(localItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let task = each_array[$$index];
      $$renderer2.push(`<div class="card-wrapper svelte-mykq0n">`);
      KanbanCard($$renderer2, { task });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let view = "kanban";
    let cols = { "todo": [], "in-progress": [], "done": [] };
    let allTasks = [];
    function syncFromServer(ts) {
      allTasks = [...ts];
      cols = {
        "todo": ts.filter((t) => t.task.status === "todo"),
        "in-progress": ts.filter((t) => t.task.status === "in-progress"),
        "done": ts.filter((t) => t.task.status === "done")
      };
    }
    syncFromServer(data.tasks);
    function localDate(d = /* @__PURE__ */ new Date()) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    const today = localDate();
    function addDays(base, n) {
      const [y, m, d] = base.split("-").map(Number);
      return localDate(new Date(y, m - 1, d + n));
    }
    const pastDates = Array.from({ length: 30 }, (_, i) => addDays(today, -(i + 1))).reverse();
    const futureDates = Array.from({ length: 30 }, (_, i) => addDays(today, i + 1));
    [...pastDates, today, ...futureDates];
    const SHADOW_ID = "id:dnd-shadow-placeholder-0000";
    async function handleFinalize(columnId, items) {
      const real = items.filter((i) => i.id !== SHADOW_ID);
      const moved = real.filter((t) => t.task.status !== columnId);
      cols[columnId] = real.map(({ id: _id, ...rest }) => ({ ...rest, task: { status: columnId } }));
      if (moved.length === 0) return;
      for (const s of Object.keys(cols)) {
        if (s === columnId) continue;
        cols[s] = cols[s].filter((t) => !moved.some((m) => m.entityId === t.entityId));
      }
      await Promise.all(moved.map((t) => fetch(`/api/tasks/${t.entityId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: columnId })
      })));
    }
    async function handleAdd(columnId, title) {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      const { entityId } = await res.json();
      if (columnId !== "todo") {
        await fetch(`/api/tasks/${entityId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: columnId })
        });
      }
      const t = { entityId, name: { title }, task: { status: columnId } };
      cols[columnId] = [...cols[columnId], t];
      allTasks = [...allTasks, t];
    }
    async function handleStatusChange(entityId, status) {
      for (const s of Object.keys(cols)) cols[s] = cols[s].filter((t) => t.entityId !== entityId);
      const task = allTasks.find((t) => t.entityId === entityId);
      if (task) {
        const updated = { ...task, task: { status } };
        cols[status] = [...cols[status], updated];
        allTasks = allTasks.map((t) => t.entityId === entityId ? updated : t);
      }
      await fetch(`/api/tasks/${entityId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    }
    async function handleUpdate(entityId, patch) {
      allTasks = allTasks.map((t) => t.entityId === entityId ? { ...t, name: { ...t.name, ...patch } } : t);
      for (const s of Object.keys(cols)) {
        cols[s] = cols[s].map((t) => t.entityId === entityId ? { ...t, name: { ...t.name, ...patch } } : t);
      }
      await fetch(`/api/tasks/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    }
    async function handleDelete(entityId) {
      allTasks = allTasks.filter((t) => t.entityId !== entityId);
      for (const s of Object.keys(cols)) cols[s] = cols[s].filter((t) => t.entityId !== entityId);
      await fetch(`/api/tasks/${entityId}`, { method: "DELETE" });
    }
    $$renderer2.push(`<header class="top-bar svelte-1uha8ag"><h1 class="page-title svelte-1uha8ag">Rotax</h1> <span class="task-count svelte-1uha8ag">${escape_html(allTasks.length)}</span> <div class="view-toggle svelte-1uha8ag"><button${attr_class("toggle-btn svelte-1uha8ag", void 0, { "active": view === "timeline" })}>Timeline</button> <button${attr_class("toggle-btn svelte-1uha8ag", void 0, { "active": view === "kanban" })}>Kanban</button></div></header> <main class="svelte-1uha8ag">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="kanban svelte-1uha8ag">`);
      KanbanColumn($$renderer2, {
        columnId: "done",
        label: "Done",
        tasks: cols["done"],
        onFinalize: handleFinalize,
        onAdd: handleAdd,
        onStatusChange: handleStatusChange,
        onUpdate: handleUpdate,
        onDelete: handleDelete
      });
      $$renderer2.push(`<!----> `);
      KanbanColumn($$renderer2, {
        columnId: "in-progress",
        label: "In Progress",
        tasks: cols["in-progress"],
        onFinalize: handleFinalize,
        onAdd: handleAdd,
        onStatusChange: handleStatusChange,
        onUpdate: handleUpdate,
        onDelete: handleDelete
      });
      $$renderer2.push(`<!----> `);
      KanbanColumn($$renderer2, {
        columnId: "todo",
        label: "Todo",
        tasks: cols["todo"],
        onFinalize: handleFinalize,
        onAdd: handleAdd,
        onStatusChange: handleStatusChange,
        onUpdate: handleUpdate,
        onDelete: handleDelete
      });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></main> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
