export const workspacePage = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Logos MVP</title>
<style>
:root {
  color-scheme: light;
  --bg: #f7f7f5; --ink: #0d0d0c; --muted: #74746e; --surface: #ecece8;
  --surface-2: #e4e4df; --line: #ddddd7; --semantic: #46c27c; --danger: #9f3b32;
  --ease: cubic-bezier(.2,.8,.2,1); --header: 62px;
  font-family: "LINE Seed JP", "Hiragino Sans", "Yu Gothic", system-ui, sans-serif;
  font-size: 14px; line-height: 1.5;
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); }
button, input, textarea, select { font: inherit; color: inherit; }
button { cursor: pointer; }
button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
header { position: sticky; top: 0; z-index: 50; height: var(--header); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px; padding: 0 18px; background: rgba(247,247,245,.92); border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: baseline; gap: 8px; min-width: max-content; }
.brand strong { font-weight: 800; font-size: 18px; letter-spacing: -.02em; }
.brand small { color: var(--muted); font-size: 11px; }
.tabs { display: flex; height: 100%; align-items: stretch; gap: 2px; }
.tab { position: relative; border: 0; background: transparent; padding: 0 14px; color: var(--muted); font-weight: 400; }
.tab:hover { color: var(--ink); }
.tab[aria-selected="true"] { color: var(--ink); font-weight: 700; }
.tab[aria-selected="true"]::after { content: ""; position: absolute; left: 12px; right: 12px; bottom: 0; height: 2px; background: var(--ink); }
.header-actions { display: flex; gap: 8px; align-items: center; }
.control, .icon-button { min-height: 38px; border: 0; border-radius: 8px; background: var(--surface); padding: 0 12px; }
.control:hover, .icon-button:hover { background: var(--surface-2); }
.primary { background: var(--ink); color: var(--bg); }
.primary:hover { background: #2a2a27; }
.icon-button { width: 38px; min-height: 38px; padding: 0; border-radius: 6px; display: grid; place-items: center; }
.header-menu { position: relative; }
.header-menu summary { list-style: none; }
.header-menu summary::-webkit-details-marker { display: none; }
.header-menu-panel { position: absolute; top: calc(100% + 8px); right: 0; z-index: 60; display: grid; gap: 8px; width: min(330px, calc(100vw - 24px)); padding: 12px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 14px 38px #0d0d0c20; }
.header-menu-panel form { display: flex; gap: 6px; align-items: end; }
.header-menu-panel label { min-width: 0; flex: 1; }
.app { height: calc(100vh - var(--header)); min-height: 520px; }
.workspace { height: 100%; display: grid; grid-template-columns: 300px minmax(0, 1fr); }
.pane { min-width: 0; min-height: 0; background: var(--bg); }
.list-pane { border-right: 1px solid var(--line); display: flex; flex-direction: column; }
.main-pane { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.pane-head { min-height: 54px; padding: 8px 12px 8px 16px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.pane-head-main { display: flex; align-items: center; gap: 8px; min-width: 0; }
.pane-title { font-weight: 700; font-size: 15px; }
.muted { color: var(--muted); }
.list-filters { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--line); }
.list-filters select { min-width: 0; width: 100%; border: 0; border-radius: 6px; background: var(--surface); padding: 6px 8px; }
.list { min-height: 0; overflow: auto; padding: 6px; }
.list-item { width: 100%; text-align: left; border: 0; background: transparent; border-radius: 6px; padding: 10px; display: grid; gap: 4px; }
.list-item:hover { background: var(--surface); }
.list-item.active { background: var(--surface-2); }
.list-item-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.list-item-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: var(--muted); display: inline-block; }
.dot.changed { background: var(--semantic); }
.editor { overflow: auto; padding: 24px; max-width: 980px; width: 100%; margin: 0 auto; }
.editor.empty { display: grid; place-items: center; color: var(--muted); }
.editor-head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 22px; }
.editor-head-main { flex: 1; min-width: 0; }
.title-input { width: 100%; border: 0; background: transparent; padding: 0; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -.025em; }
.title-input::placeholder { color: #aaa9a2; }
.field { display: grid; gap: 6px; margin: 0 0 16px; }
.field label, .popover-field label { font-size: 12px; color: var(--muted); }
.text-input, .select-input, .date-input, .textarea { width: 100%; border: 0; border-radius: 8px; background: var(--surface); min-height: 38px; padding: 9px 11px; }
.textarea { resize: vertical; min-height: 180px; line-height: 1.6; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.section-title { font-size: 12px; color: var(--muted); margin: 20px 0 8px; }
.inline-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.status-chip { font-size: 12px; padding: 4px 7px; border-radius: 6px; background: var(--surface); color: var(--muted); }
.component-trigger { border: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 28px; }
.component-trigger:hover { background: var(--surface-2); color: var(--ink); }
.component-trigger::after { content: "⌄"; font-size: 11px; color: var(--muted); transform: translateY(-1px); }
.entity-id { font-family: "SFMono-Regular", "Cascadia Code", monospace; font-size: 10px; color: var(--muted); overflow-wrap: anywhere; }
.component-popover { position: fixed; z-index: 100; width: min(380px, calc(100vw - 24px)); max-height: min(620px, calc(100vh - 24px)); overflow: auto; background: var(--bg); border: 1px solid var(--line); box-shadow: 0 14px 38px #0d0d0c20; border-radius: 8px; padding: 6px; }
.component-popover[hidden] { display: none; }
.popover-backdrop { position: fixed; inset: 0; z-index: 90; background: transparent; }
.popover-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border-bottom: 1px solid var(--line); }
.popover-title { font-weight: 700; }
.popover-entity { font-family: "SFMono-Regular", "Cascadia Code", monospace; font-size: 10px; color: var(--muted); }
.popover-component { padding: 10px; border-bottom: 1px solid var(--line); }
.popover-component:last-of-type { border-bottom: 0; }
.popover-component-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.popover-component-name { font-size: 12px; font-weight: 700; }
.popover-current { font-weight: 400; color: var(--muted); }
.popover-grid { display: grid; gap: 8px; }
.popover-grid.two { grid-template-columns: 1fr 1fr; }
.popover-field { display: grid; gap: 4px; min-width: 0; }
.popover-input, .popover-select, .popover-textarea { width: 100%; border: 0; border-radius: 6px; background: var(--surface); min-height: 34px; padding: 7px 9px; }
.popover-textarea { resize: vertical; min-height: 72px; }
.popover-add { display: grid; gap: 6px; padding: 10px; }
.popover-add button { width: 100%; text-align: left; }
.remove-btn { border: 0; background: transparent; color: var(--muted); padding: 4px 6px; border-radius: 5px; }
.remove-btn:hover { background: var(--surface); color: var(--danger); }
.tag-options { display: grid; gap: 4px; max-height: 112px; overflow: auto; }
.tag-options label { display: flex; gap: 7px; align-items: center; min-width: 0; }
.tag-options input { width: 16px; height: 16px; }
.note-preview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--muted); font-size: 12px; }
.calendar-wrap { flex: 1; min-height: 0; overflow: auto; padding: 18px; }
.calendar-detail { flex: 0 0 260px; overflow: auto; padding: 14px 18px; border-top: 1px solid var(--line); }
.calendar-detail-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.calendar-detail .title-input { font-size: 20px; }
.calendar-detail .textarea { min-height: 88px; }
.calendar-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.calendar-title { font-size: 20px; font-weight: 700; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(110px, 1fr)); border-top: 1px solid var(--line); border-left: 1px solid var(--line); min-width: 770px; }
.weekday, .day-cell { border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.weekday { padding: 7px 8px; font-size: 12px; color: var(--muted); background: var(--surface); }
.day-cell { min-height: 118px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.day-cell.outside { color: #aaa9a2; background: #fafaf8; }
.day-number { font-size: 12px; }
.day-events { display: grid; gap: 4px; }
.event-pill { border: 0; background: var(--surface); border-radius: 5px; padding: 5px 6px; text-align: left; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.event-pill:hover { background: var(--surface-2); }
.event-pill.selected { background: var(--ink); color: var(--bg); }
.entity-tools { padding: 14px 18px; border-top: 1px solid var(--line); max-height: 240px; overflow: auto; }
.entity-tools summary { cursor: pointer; font-weight: 700; }
.reference-row { display: flex; gap: 6px; align-items: center; margin: 5px 0; }
.history { padding-left: 20px; }
.history pre { white-space: pre-wrap; overflow-wrap: anywhere; }
.status { position: fixed; z-index: 40; bottom: 12px; left: 50%; transform: translateX(-50%); max-width: calc(100vw - 24px); padding: 7px 11px; border-radius: 6px; background: var(--ink); color: white; box-shadow: 0 4px 18px #0002; }
.mobile-back { display: none; }
.flash { animation: flash 820ms var(--ease); }
@keyframes flash { 0% { background: rgba(70,194,124,.22); } 100% { background: transparent; } }
@media (max-width: 1100px) { .workspace { grid-template-columns: 270px minmax(0, 1fr); } }
@media (max-width: 760px) {
  header { grid-template-columns: auto 1fr auto; padding: 0 8px; gap: 4px; }
  .brand small { display: none; }
  .tabs { justify-content: center; }
  .tab { padding: 0 5px; font-size: 13px; }
  .header-actions { gap: 4px; }
  .header-actions > .control, .header-menu > summary { padding-left: 7px; padding-right: 7px; }
  .workspace { grid-template-columns: 1fr; }
  .list-pane { display: none; }
  .workspace.mobile-list .list-pane { display: flex; }
  .workspace.mobile-list .main-pane { display: none; }
  .editor { padding: 18px; }
  .field-row { grid-template-columns: 1fr; }
  .calendar-wrap { padding: 12px; }
  .calendar-detail { flex-basis: 250px; padding: 12px; }
  .title-input { font-size: 24px; }
  .mobile-back { display: inline-flex; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
<header>
  <div class="brand"><strong>Logos</strong><small>MVP</small></div>
  <nav class="tabs" aria-label="アプリ切り替え" role="tablist">
    <button class="tab" role="tab" aria-selected="true" data-app="task">Task</button>
    <button class="tab" role="tab" aria-selected="false" data-app="calendar">Calendar</button>
    <button class="tab" role="tab" aria-selected="false" data-app="note">Note</button>
  </nav>
  <div class="header-actions">
    <details class="header-menu">
      <summary class="control">データ</summary>
      <div class="header-menu-panel">
        <button id="sample-button" class="control" type="button">サンプルを読み込む</button>
        <button id="export-button" class="control" type="button">エクスポート</button>
        <form id="restore-form">
          <label class="popover-field">復元ファイル<input id="restore-file" type="file" accept="application/json"></label>
          <button class="control" type="submit">復元</button>
        </form>
      </div>
    </details>
    <button id="new-entity" class="control primary" type="button">新規Entity</button>
  </div>
</header>
<div id="app" class="app"></div>
<div id="popover-root"></div>
<p id="status" class="status" role="status" aria-live="polite">読み込み中</p>
<script>
(() => {
  const labels = { task: 'Task', event: 'Event', note: 'Note', tag: 'Tag', 'this-is-tag': 'ThisIsTag', estimate: 'Estimate', name: 'Name' };
  const typeIds = ['task', 'event', 'note', 'tag', 'this-is-tag', 'estimate'];
  const state = {
    app: ['task', 'calendar', 'note'].includes(localStorage.getItem('logos-mvp-app')) ? localStorage.getItem('logos-mvp-app') : 'task',
    selectedId: localStorage.getItem('logos-mvp-selected'),
    calendarCursor: new Date(),
    taggedOnly: false,
    showArchived: false,
    mobileList: false,
    changedId: null
  };
  let allEntities = [];
  let viewEntities = [];
  let currentRequirements = [];
  let popupTrigger = null;
  const dirtyEntityIds = new Set();
  const saveQueues = new Map();
  const root = document.getElementById('app');
  const tabs = Array.from(document.querySelectorAll('.tab'));

  const byId = (id) => document.getElementById(id);
  const operationId = () => crypto.randomUUID();
  const component = (entity, typeId, activeOnly = true) => entity && entity.components
    ? entity.components.find((item) => item.typeId === typeId && (!activeOnly || item.active))
    : undefined;
  const nameOf = (entity) => component(entity, 'name') && component(entity, 'name').data.value || entity.name || entity.id;
  const activeComponents = (entity) => entity.components.filter((item) => item.active);
  const primaryType = () => state.app === 'calendar' ? 'event' : state.app;
  const viewId = () => state.app === 'calendar' ? 'calendar' : state.app === 'note' && state.taggedOnly ? 'tagged-notes' : state.app === 'note' ? 'notes' : 'tasks';
  const entityById = (id) => allEntities.find((item) => item.id === id) || viewEntities.find((item) => item.id === id);
  const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

  async function api(path, options) {
    const response = await fetch(path, options);
    const value = await response.json();
    if (!response.ok) {
      const error = new Error(value.error || '操作に失敗しました');
      error.status = response.status;
      error.payload = value;
      throw error;
    }
    return value;
  }
  function getEntity(entityId) {
    return allEntities.find((entity) => entity.id === entityId) || viewEntities.find((entity) => entity.id === entityId);
  }
  function selectedEntity() { return viewEntities.find((entity) => entity.id === state.selectedId); }
  function activeRequirementsMatch(entity, requirements) {
    return requirements.every((typeId) => {
      const item = component(entity, typeId);
      return Boolean(item && item.active);
    });
  }
  async function loadAll() {
    const result = await api('/api/workspace/entities?includeArchived=true');
    allEntities = result.entities;
    byId('sample-button').disabled = allEntities.length !== 0;
  }
  async function loadView() {
    const id = viewId();
    const result = await api('/api/workspace/views/' + encodeURIComponent(id));
    currentRequirements = result.definition.requires;
    viewEntities = result.entities;
    if (state.showArchived) {
      const archived = allEntities.filter((entity) => entity.archivedAt && activeRequirementsMatch(entity, currentRequirements));
      viewEntities = viewEntities.concat(archived);
    }
    ensureSelection();
  }
  function render() {
    ensureSelection();
    const type = primaryType();
    const selected = selectedEntity();
    root.className = 'app';
    root.innerHTML = '<div class="workspace' + (state.mobileList ? ' mobile-list' : '') + '">' +
      renderListPane(type) +
      '<main class="pane main-pane" aria-live="polite">' +
      (state.app === 'calendar' ? renderCalendar(selected) : renderEditor(selected, type)) +
      '</main></div>';
    bind();
    if (selected) loadRecordTools(selected.id).catch(showError);
  }
  function appLabel(type) { return type === 'task' ? 'Task' : type === 'event' ? 'Event' : 'Note'; }
  function renderListPane(type) {
    const label = appLabel(type);
    let filter = '';
    if (state.app === 'note') {
      filter = '<div class="list-filters"><select id="notes-filter" aria-label="メモの表示条件">' +
        '<option value="all"' + (state.taggedOnly ? '' : ' selected') + '>すべてのメモ</option>' +
        '<option value="tagged"' + (state.taggedOnly ? ' selected' : '') + '>Tag付きメモ</option></select></div>';
    }
    const items = viewEntities.length
      ? viewEntities.map((entity) => renderListItem(entity, type)).join('')
      : '<div class="muted" style="padding:12px">まだ' + label + 'がありません。</div>';
    return '<aside id="list-pane" class="pane list-pane"><div class="pane-head"><span class="pane-title">' + label + '</span>' +
      '<button class="icon-button" data-new="' + type + '" aria-label="' + label + 'を追加">＋</button></div>' +
      (state.showArchived ? '<div class="list-filters"><label><input id="show-archived" type="checkbox" checked>アーカイブを表示</label></div>' :
        '<div class="list-filters"><label><input id="show-archived" type="checkbox">アーカイブを表示</label></div>') +
      filter + '<div id="entity-list" class="list">' + items + '</div></aside>';
  }
  function renderListItem(entity, type) {
    const name = nameOf(entity);
    let meta = '';
    if (type === 'task') {
      const task = component(entity, 'task');
      meta = statusLabel(task.data.status) + ' · ' + formatDate(task.data.due);
      if (task.data.priority) meta += ' · ' + priorityLabel(task.data.priority);
    } else if (type === 'event') {
      const event = component(entity, 'event');
      meta = event && event.data.startUtc ? formatDateTime(event.data.startUtc, event.data.timeZone) : '日時なし';
    } else {
      const note = component(entity, 'note');
      meta = note && note.data.body ? note.data.body.replace(/\\n/g, ' ') : '本文なし';
    }
    return '<button class="list-item' + (entity.id === state.selectedId ? ' active' : '') +
      '" data-select="' + escapeHtml(entity.id) + '" aria-pressed="' + String(entity.id === state.selectedId) + '">' +
      '<span class="list-item-row"><span class="list-item-title">' + escapeHtml(name || '無題') + '</span>' +
      (state.changedId === entity.id ? '<span class="dot changed" aria-label="更新済み"></span>' : '<span class="dot" hidden></span>') +
      '</span><span class="meta">' + escapeHtml(meta) + (entity.archivedAt ? ' · アーカイブ' : '') + '</span></button>';
  }

  function renderEditor(entity, type) {
    if (!entity) return '<div class="pane-head"><span class="pane-title">' + appLabel(type) + '</span></div>' +
      '<div class="editor empty"><div class="empty-state"><strong>項目がありません</strong>左側の＋から作成できます。</div></div>';
    const mainComponent = component(entity, type);
    if (!mainComponent) return '<div class="editor empty"><div class="empty-state"><strong>項目がありません</strong>左側の＋から作成できます。</div></div>';
    return '<div class="pane-head"><div class="pane-head-main"><button class="control mobile-back" data-mobile-back type="button">一覧</button>' +
      '<span class="pane-title">' + labels[type] + '</span><span class="entity-id">' + escapeHtml(entity.id) + '</span></div>' +
      '<div class="inline-controls"><button class="status-chip component-trigger" data-components="' + escapeHtml(entity.id) +
      '" data-primary="' + type + '" aria-haspopup="dialog" aria-expanded="false">' + activeComponents(entity).length + ' components</button>' +
      '<button class="remove-btn" data-archive="' + escapeHtml(entity.id) + '" type="button">' + (entity.archivedAt ? '復元' : 'アーカイブ') + '</button></div></div>' +
      '<div id="editor" class="editor' + (state.changedId === entity.id ? ' flash' : '') + '">' +
      '<div class="editor-head"><div class="editor-head-main"><input class="title-input" data-edit-type="name" data-edit-field="value" value="' +
      escapeHtml(nameOf(entity)) + '" placeholder="無題" aria-label="Entityの名前"></div></div>' +
      (type === 'task' ? renderTaskFull(mainComponent.data) : type === 'note' ? renderNoteFull(mainComponent.data) : renderEventFull(mainComponent.data)) +
      renderEntityTools(entity) + '</div>';
  }
  function renderTaskFull(data) {
    return '<div class="field-row"><div class="field"><label for="task-status">状態</label><select id="task-status" class="select-input" data-edit-type="task" data-edit-field="status">' +
      option('todo', '未着手', data.status) + option('doing', '進行中', data.status) + option('done', '完了', data.status) +
      '</select></div><div class="field"><label for="task-due">期限</label><input id="task-due" class="date-input" type="date" data-edit-type="task" data-edit-field="due" value="' +
      escapeHtml(data.due || '') + '"></div></div><div class="field"><label for="task-priority">優先度</label><select id="task-priority" class="select-input" data-edit-type="task" data-edit-field="priority">' +
      option('low', '低', data.priority || 'medium') + option('medium', '中', data.priority || 'medium') + option('high', '高', data.priority || 'medium') +
      '</select></div><div class="field"><label for="task-description">内容</label><textarea id="task-description" class="textarea" data-edit-type="task" data-edit-field="description">' +
      escapeHtml(data.description || '') + '</textarea></div>';
  }
  function renderNoteFull(data) {
    return '<div class="field"><label for="note-body">本文</label><textarea id="note-body" class="textarea" style="min-height:420px" data-edit-type="note" data-edit-field="body">' +
      escapeHtml(data.body || '') + '</textarea></div>';
  }
  function renderEventFull(data) {
    const zone = data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return '<div class="field-row"><div class="field"><label for="event-start">開始</label><input id="event-start" class="date-input" type="datetime-local" data-edit-type="event" data-edit-field="startLocal" value="' +
      escapeHtml(data.startUtc ? localValue(data.startUtc, zone) : '') + '"></div><div class="field"><label for="event-end">終了</label><input id="event-end" class="date-input" type="datetime-local" data-edit-type="event" data-edit-field="endLocal" value="' +
      escapeHtml(data.endUtc ? localValue(data.endUtc, zone) : '') + '"></div></div><div class="field"><label for="event-zone">タイムゾーン</label><input id="event-zone" class="text-input" data-edit-type="event" data-edit-field="timeZone" value="' +
      escapeHtml(zone) + '"></div><div class="field"><label for="event-location">場所</label><input id="event-location" class="text-input" data-edit-type="event" data-edit-field="location" value="' +
      escapeHtml(data.location || '') + '"></div><div class="field"><label for="event-description">内容</label><textarea id="event-description" class="textarea" data-edit-type="event" data-edit-field="description">' +
      escapeHtml(data.description || '') + '</textarea></div>';
  }
  function option(value, label, selected) {
    return '<option value="' + value + '"' + (selected === value ? ' selected' : '') + '>' + label + '</option>';
  }
  function renderEntityTools(entity) {
    const options = allEntities.filter((item) => item.id !== entity.id && !item.archivedAt)
      .map((item) => '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(nameOf(item)) + '</option>').join('');
    return '<details class="entity-tools"><summary>参照と履歴</summary><form id="reference-form" class="inline-controls">' +
      '<label class="popover-field">参照先<select id="reference-target" class="select-input"><option value="">選択</option>' + options + '</select></label>' +
      '<button class="control" type="submit">参照を追加</button></form><div id="references"></div><ol id="history" class="history"></ol></details>';
  }

  function renderCalendar(selected) {
    const cursor = state.calendarCursor;
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    const cells = [];
    for (let index = 0; index < 42; index++) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      cells.push(date);
    }
    const days = cells.map((date) => renderDayCell(date, month)).join('');
    return '<div class="pane-head"><div class="pane-head-main"><button class="control mobile-back" data-mobile-back type="button">一覧</button>' +
      '<span class="pane-title">Calendar</span><span class="entity-id">' + (selected ? escapeHtml(selected.id) : '') + '</span></div>' +
      '<div class="inline-controls">' + (selected ? '<button class="status-chip component-trigger" data-components="' + escapeHtml(selected.id) +
      '" data-primary="event" aria-haspopup="dialog" aria-expanded="false">' + activeComponents(selected).length + ' components</button>' : '<span class="status-chip">' +
      viewEntities.length + ' events</span>') + (selected ? '<button class="remove-btn" data-archive="' + escapeHtml(selected.id) + '" type="button">' +
      (selected.archivedAt ? '復元' : 'アーカイブ') + '</button>' : '') + '</div></div>' +
      '<div class="calendar-wrap"><div class="calendar-toolbar"><div class="calendar-title">' + year + '年 ' + (month + 1) + '月</div>' +
      '<div class="inline-controls"><button class="control" data-cal="prev">前月</button><button class="control" data-cal="today">今月</button><button class="control" data-cal="next">翌月</button></div></div>' +
      '<div class="calendar-grid">' + ['日', '月', '火', '水', '木', '金', '土'].map((day) => '<div class="weekday">' + day + '</div>').join('') + days + '</div></div>' +
      (selected ? '<section class="calendar-detail"><div class="calendar-detail-head"><span class="muted">予定の詳細</span></div>' +
        '<div class="field"><label for="calendar-name">共通Name</label><input id="calendar-name" class="title-input" data-edit-type="name" data-edit-field="value" value="' +
        escapeHtml(nameOf(selected)) + '"></div>' + renderEventFull(component(selected, 'event').data) + '</section>' +
        renderEntityTools(entityById(selected.id)) : '') +
      (selected ? '' : '<div class="calendar-detail muted">予定を選択すると詳細を編集できます。</div>');
  }
  function renderDayCell(date, month) {
    const year = date.getFullYear();
    const dayMonth = String(date.getMonth() + 1).padStart(2, '0');
    const dayDate = String(date.getDate()).padStart(2, '0');
    const key = year + '-' + dayMonth + '-' + dayDate;
    const events = viewEntities.filter((entity) => {
      const event = component(entity, 'event');
      if (!event) return false;
      const parts = dateParts(new Date(event.data.startUtc), event.data.timeZone);
      return parts.year + '-' + parts.month + '-' + parts.day === key;
    });
    return '<div class="day-cell' + (date.getMonth() !== month ? ' outside' : '') + '"><div class="day-number">' + date.getDate() + '</div><div class="day-events">' +
      events.map((entity) => '<button class="event-pill' + (entity.id === state.selectedId ? ' selected' : '') + '" data-select="' + escapeHtml(entity.id) +
      '" type="button">' + escapeHtml(nameOf(entity)) + '</button>').join('') + '</div></div>';
  }

  function statusLabel(status) { return status === 'done' ? '完了' : status === 'doing' ? '進行中' : '未着手'; }
  function priorityLabel(priority) { return priority === 'high' ? '高' : priority === 'low' ? '低' : '中'; }
  function formatDate(value) {
    if (!value) return '期限なし';
    const parts = value.split('-');
    return parts[1].replace(/^0/, '') + '/' + parts[2].replace(/^0/, '');
  }
  function formatDateTime(utc, zone) {
    try {
      return new Intl.DateTimeFormat('ja-JP', { timeZone: zone, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(utc));
    } catch {
      return new Date(utc).toLocaleString('ja-JP');
    }
  }
  function dateParts(date, zone) {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  }
  function localValue(utc, zone) {
    const parts = dateParts(new Date(utc), zone);
    return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute;
  }
  function utcValue(local, zone) {
    const values = local.match(/^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})$/);
    if (!values) throw new Error('開始と終了を入力してください');
    const desired = Date.UTC(+values[1], +values[2] - 1, +values[3], +values[4], +values[5]);
    let instant = desired;
    for (let attempt = 0; attempt < 3; attempt++) {
      const parts = dateParts(new Date(instant), zone);
      instant += desired - Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    }
    if (localValue(new Date(instant).toISOString(), zone) !== local) throw new Error('指定時刻はタイムゾーン上に存在しません');
    return new Date(instant).toISOString();
  }

  function updateTabs() {
    tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.app === state.app)));
  }
  function setStatus(message) { byId('status').textContent = message; }
  function ensureSelection() {
    if (!viewEntities.some((entity) => entity.id === state.selectedId)) state.selectedId = viewEntities[0] ? viewEntities[0].id : null;
    if (state.selectedId) localStorage.setItem('logos-mvp-selected', state.selectedId);
    localStorage.setItem('logos-mvp-app', state.app);
  }
  async function reloadWorkspace() {
    await loadAll();
    await loadView();
    render();
  }
  function replaceCachedEntity(entity) {
    allEntities = allEntities.map((item) => item.id === entity.id ? entity : item);
    viewEntities = viewEntities.map((item) => item.id === entity.id ? entity : item);
  }
  function flashEntity(entityId) {
    state.changedId = entityId;
    refreshListItems();
    setTimeout(() => {
      if (state.changedId === entityId) {
        state.changedId = null;
        refreshListItems();
      }
    }, 820);
  }
  function refreshListItems() {
    const list = byId('entity-list');
    if (list) list.innerHTML = viewEntities.map((entity) => renderListItem(entity, primaryType())).join('');
    bindList();
  }

  function queueSave(entityId, type, data) {
    if (type === 'name' && !String(data.value || '').trim()) {
      setStatus('Nameは空にできません');
      return;
    }
    let queue = saveQueues.get(entityId);
    if (!queue) {
      queue = { pending: new Map(), timer: null, running: null };
      saveQueues.set(entityId, queue);
    }
    queue.pending.set(type, data);
    dirtyEntityIds.add(entityId);
    setStatus('保存中…');
    clearTimeout(queue.timer);
    queue.timer = setTimeout(() => flushSaves(entityId).catch(() => {}), 450);
  }
  async function flushSaves(entityId) {
    const queue = saveQueues.get(entityId);
    if (!queue) return true;
    if (queue.running) return queue.running;
    clearTimeout(queue.timer);
    queue.timer = null;
    const running = drainSaves(entityId, queue);
    queue.running = running;
    return running;
  }
  async function drainSaves(entityId, queue) {
    let failed = false;
    let failedEntry = null;
    try {
      while (queue.pending.size) {
        const entry = queue.pending.entries().next().value;
        const type = entry[0];
        const data = entry[1];
        queue.pending.delete(type);
        failedEntry = { type, data };
        const known = getEntity(entityId);
        const latest = await api('/api/workspace/entities/' + encodeURIComponent(entityId));
        if (known && latest.revision !== known.revision) {
          replaceCachedEntity(latest);
          const conflict = new Error('別画面で変更されています。入力を残しました。');
          conflict.status = 409;
          conflict.payload = { entity: latest };
          throw conflict;
        }
        const saved = await api('/api/workspace/entities/' + encodeURIComponent(entityId) + '/components/' + encodeURIComponent(type), {
          method: 'PUT', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ operationId: operationId(), expectedRevision: latest.revision, data })
        });
        replaceCachedEntity(saved);
        flashEntity(entityId);
        failedEntry = null;
      }
      setStatus('保存済み');
    } catch (error) {
      failed = true;
      if (failedEntry && !queue.pending.has(failedEntry.type)) {
        queue.pending.set(failedEntry.type, failedEntry.data);
      }
      if (error.payload && error.payload.entity) replaceCachedEntity(error.payload.entity);
      showError(error);
    } finally {
      queue.running = null;
      if (!queue.pending.size && !failed) {
        dirtyEntityIds.delete(entityId);
        saveQueues.delete(entityId);
      }
    }
    return !failed;
  }
  function showError(error) {
    if (error && error.status === 409) setStatus('別画面で変更されています。入力を残しました。再度編集すると保存できます。');
    else setStatus(error && error.message ? error.message : '操作に失敗しました');
  }

  function readComponentData(scope, type) {
    function value(field) {
      const node = scope.querySelector('[data-edit-type="' + type + '"][data-edit-field="' + field + '"]');
      if (node) return node.value;
      const current = component(getEntity(state.selectedId), type, false);
      return current && current.data[field] != null ? current.data[field] : '';
    }
    if (type === 'name') return { value: value('value') };
    if (type === 'task') return {
      status: value('status') || 'todo',
      due: value('due'),
      priority: value('priority') || 'medium',
      description: value('description')
    };
    if (type === 'note') return { body: value('body') };
    if (type === 'event') {
      const zone = value('timeZone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {
        startUtc: utcValue(value('startLocal'), zone),
        endUtc: utcValue(value('endLocal'), zone),
        timeZone: zone,
        location: value('location'),
        description: value('description')
      };
    }
    if (type === 'tag') {
      return { entityIds: Array.from(scope.querySelectorAll('[data-tag-id]:checked')).map((node) => node.dataset.tagId) };
    }
    if (type === 'estimate') return { minutes: Number(value('minutes')) };
    if (type === 'this-is-tag') return {};
    return {};
  }
  function bindEditors(scope) {
    scope.querySelectorAll('[data-edit-type][data-edit-field]').forEach((field) => {
      const eventName = field.tagName === 'SELECT' || field.type === 'date' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        try {
          queueSave(state.selectedId, field.dataset.editType, readComponentData(scope, field.dataset.editType));
        } catch (error) {
          setStatus(error.message);
        }
      });
    });
  }
  function bindList() {
    root.querySelectorAll('[data-select]').forEach((button) => button.addEventListener('click', () => {
      state.selectedId = button.dataset.select;
      state.mobileList = false;
      ensureSelection();
      render();
    }));
  }
  function bindComponentTriggers(scope) {
    scope.querySelectorAll('[data-components]').forEach((trigger) => trigger.addEventListener('click', () => openComponentPopover(trigger)));
  }

  function renderComponentPopover(entity, primary) {
    const active = typeIds.filter((type) => type !== primary && component(entity, type));
    const stored = typeIds.filter((type) => type !== primary && !component(entity, type) && component(entity, type, false));
    const unknown = entity.components.filter((item) => !['name', ...typeIds].includes(item.typeId));
    return '<div class="popover-backdrop" data-popover-close></div><section class="component-popover" role="dialog" aria-label="EntityのComponents" data-popover>' +
      '<div class="popover-head"><div><div class="popover-title">Components</div><div class="popover-entity">' + escapeHtml(entity.id) + '</div></div>' +
      '<button class="icon-button" data-popover-close type="button" aria-label="閉じる">×</button></div>' +
      renderPopoverComponent(entity, 'name') +
      (active.length ? active.map((type) => renderPopoverComponent(entity, type)).join('') : '<div class="popover-empty">他のComponentはまだありません。</div>') +
      (stored.length ? '<div class="popover-add"><span class="muted">解除済み</span>' + stored.map((type) =>
        '<button class="control" data-component-restore="' + type + '" type="button">復元 ' + labels[type] + '</button>').join('') + '</div>' : '') +
      '<div class="popover-add">' + typeIds.filter((type) => !component(entity, type, false)).map((type) =>
        '<button class="control" data-component-add="' + type + '" type="button">＋ ' + labels[type] + '</button>').join('') + '</div>' +
      (unknown.length ? '<details class="popover-component"><summary>未対応Component</summary><pre>' + escapeHtml(JSON.stringify(unknown, null, 2)) + '</pre></details>' : '') +
      '</section>';
  }
  function renderPopoverComponent(entity, type) {
    const item = component(entity, type, false);
    const active = item && item.active;
    let body = '';
    if (!active) body = '<div class="popover-empty">解除済み。保存した値を復元できます。</div>';
    else if (type === 'name') body = '<div class="popover-grid"><div class="popover-field"><label>共通Name</label><input class="popover-input" data-edit-type="name" data-edit-field="value" value="' +
      escapeHtml(nameOf(entity)) + '"></div></div>';
    else if (type === 'task') body = renderTaskQuick(item.data);
    else if (type === 'note') body = '<div class="popover-grid"><div class="popover-field"><label>本文</label><textarea class="popover-textarea" data-edit-type="note" data-edit-field="body">' +
      escapeHtml(item.data.body || '') + '</textarea></div></div>';
    else if (type === 'event') body = renderEventQuick(item.data);
    else if (type === 'tag') body = renderTagQuick(entity, item.data);
    else if (type === 'estimate') body = '<div class="popover-grid"><div class="popover-field"><label>見積時間（分）</label><input class="popover-input" type="number" min="1" step="1" data-edit-type="estimate" data-edit-field="minutes" value="' +
      escapeHtml(item.data.minutes || '') + '"></div></div>';
    else if (type === 'this-is-tag') body = '<div class="popover-empty">このEntityをTagとして扱います。</div>';
    return '<section class="popover-component"><div class="popover-component-head"><span class="popover-component-name">' + labels[type] +
      (active ? '' : ' <span class="popover-current">解除済み</span>') + '</span>' +
      (type !== 'name' && active ? '<button class="remove-btn" data-component-remove="' + type + '" type="button" aria-label="' + labels[type] + 'を削除">削除</button>' : '') +
      '</div>' + body + '</section>';
  }
  function renderTaskQuick(data) {
    return '<div class="popover-grid"><div class="popover-field"><label>状態</label><select class="popover-select" data-edit-type="task" data-edit-field="status">' +
      option('todo', '未着手', data.status) + option('doing', '進行中', data.status) + option('done', '完了', data.status) +
      '</select></div><div class="popover-grid two"><div class="popover-field"><label>期限</label><input class="popover-input" type="date" data-edit-type="task" data-edit-field="due" value="' +
      escapeHtml(data.due || '') + '"></div><div class="popover-field"><label>優先度</label><select class="popover-select" data-edit-type="task" data-edit-field="priority">' +
      option('low', '低', data.priority || 'medium') + option('medium', '中', data.priority || 'medium') + option('high', '高', data.priority || 'medium') +
      '</select></div></div></div>';
  }
  function renderEventQuick(data) {
    const zone = data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return '<div class="popover-grid"><div class="popover-field"><label>開始</label><input class="popover-input" type="datetime-local" data-edit-type="event" data-edit-field="startLocal" value="' +
      escapeHtml(localValue(data.startUtc, zone)) + '"></div><div class="popover-field"><label>終了</label><input class="popover-input" type="datetime-local" data-edit-type="event" data-edit-field="endLocal" value="' +
      escapeHtml(localValue(data.endUtc, zone)) + '"></div><div class="popover-field"><label>タイムゾーン</label><input class="popover-input" data-edit-type="event" data-edit-field="timeZone" value="' +
      escapeHtml(zone) + '"></div></div>';
  }
  function renderTagQuick(entity, data) {
    const ids = data.entityIds || [];
    const options = allEntities.filter((item) => component(item, 'this-is-tag') && (!item.archivedAt || ids.includes(item.id)));
    return '<div class="tag-options">' + (options.length ? options.map((tag) =>
      '<label><input type="checkbox" data-tag-id="' + escapeHtml(tag.id) + '"' + (ids.includes(tag.id) ? ' checked' : '') +
      '><span>' + escapeHtml(nameOf(tag)) + '</span></label>').join('') : '<span class="muted">Tag Entityはありません。</span>') +
      '</div><div class="popover-grid"><div class="popover-field"><label>新しいTag Entity</label><input class="popover-input" data-new-tag-name placeholder="Tag名"></div>' +
      '<button class="control" data-create-tag="' + escapeHtml(entity.id) + '" type="button">Tag Entityを作成</button></div>';
  }

  function openComponentPopover(trigger) {
    closeComponentPopover(false);
    const entity = getEntity(trigger.dataset.components);
    if (!entity) return;
    popupTrigger = trigger;
    const layer = document.createElement('div');
    layer.id = 'componentPopoverLayer';
    layer.innerHTML = renderComponentPopover(entity, trigger.dataset.primary);
    document.body.append(layer);
    const popup = layer.querySelector('[data-popover]');
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(380, window.innerWidth - 24);
    let left = Math.min(rect.right - width, window.innerWidth - width - 12);
    left = Math.max(12, left);
    let top = rect.bottom + 8;
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    requestAnimationFrame(() => {
      const bounds = popup.getBoundingClientRect();
      if (bounds.bottom > window.innerHeight - 12) popup.style.top = Math.max(12, rect.top - bounds.height - 8) + 'px';
    });
    trigger.setAttribute('aria-expanded', 'true');
    bindEditors(popup);
    layer.querySelectorAll('[data-popover-close]').forEach((button) => button.addEventListener('click', () => closeComponentPopover()));
    layer.querySelectorAll('[data-component-add]').forEach((button) => button.addEventListener('click', () =>
      mutateStructure(entity.id, button.dataset.componentAdd, 'add').catch(showError)));
    layer.querySelectorAll('[data-component-restore]').forEach((button) => button.addEventListener('click', () =>
      mutateStructure(entity.id, button.dataset.componentRestore, 'restore').catch(showError)));
    layer.querySelectorAll('[data-component-remove]').forEach((button) => button.addEventListener('click', () =>
      mutateStructure(entity.id, button.dataset.componentRemove, 'remove').catch(showError)));
    layer.querySelectorAll('[data-create-tag]').forEach((button) => button.addEventListener('click', () => {
      const input = layer.querySelector('[data-new-tag-name]');
      createTag(entity.id, input ? input.value : '').catch(showError);
    }));
    layer.querySelectorAll('[data-tag-id]').forEach((checkbox) => checkbox.addEventListener('change', () => {
      queueSave(entity.id, 'tag', readComponentData(layer, 'tag'));
    }));
    document.addEventListener('keydown', popoverEscape);
  }
  function closeComponentPopover(returnFocus = true) {
    const layer = document.getElementById('componentPopoverLayer');
    if (layer) layer.remove();
    document.removeEventListener('keydown', popoverEscape);
    if (popupTrigger) popupTrigger.setAttribute('aria-expanded', 'false');
    const trigger = popupTrigger;
    popupTrigger = null;
    if (returnFocus && trigger && trigger.isConnected) trigger.focus();
  }
  function popoverEscape(event) { if (event.key === 'Escape') closeComponentPopover(); }
  async function mutateStructure(entityId, type, action) {
    if (!await flushSaves(entityId)) return;
    const entity = await api('/api/workspace/entities/' + encodeURIComponent(entityId));
    let updated;
    const route = '/api/workspace/entities/' + encodeURIComponent(entityId) + '/components/' + encodeURIComponent(type);
    const meta = { operationId: operationId(), expectedRevision: entity.revision };
    if (action === 'remove') {
      updated = await api(route, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify(meta) });
    } else if (action === 'restore') {
      updated = await api(route + '/restore', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(meta) });
    } else {
      updated = await api(route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...meta, data: defaultComponent(type) }) });
    }
    replaceCachedEntity(updated);
    closeComponentPopover(false);
    await reloadWorkspace();
    const next = root.querySelector('[data-components="' + entityId + '"]');
    if (next) openComponentPopover(next);
  }
  async function createTag(entityId, name) {
    if (!name.trim()) throw new Error('Tag名を入力してください');
    if (!await flushSaves(entityId)) return;
    const entity = await api('/api/workspace/entities/' + encodeURIComponent(entityId));
    const tag = await api('/api/workspace/entities', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), operationId: operationId(), components: [{ typeId: 'this-is-tag', data: {} }] })
    });
    const current = component(entity, 'tag', false);
    const ids = current && current.data.entityIds ? current.data.entityIds : [];
    const route = '/api/workspace/entities/' + encodeURIComponent(entityId) + '/components/tag';
    if (current && !current.active) {
      await api(route + '/restore', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operationId: operationId(), expectedRevision: entity.revision }) });
      const updated = await api('/api/workspace/entities/' + encodeURIComponent(entityId));
      await api(route, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operationId: operationId(), expectedRevision: updated.revision, data: { entityIds: ids.concat([tag.id]) } }) });
    } else if (current) {
      await api(route, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operationId: operationId(), expectedRevision: entity.revision, data: { entityIds: ids.concat([tag.id]) } }) });
    } else {
      await api(route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operationId: operationId(), expectedRevision: entity.revision, data: { entityIds: [tag.id] } }) });
    }
    closeComponentPopover(false);
    await reloadWorkspace();
    const next = root.querySelector('[data-components="' + entityId + '"]');
    if (next) openComponentPopover(next);
    setStatus('Tagを作成して追加しました');
  }

  function bind() {
    bindList();
    bindEditors(root);
    bindComponentTriggers(root);
    root.querySelectorAll('[data-new]').forEach((button) => button.addEventListener('click', () => createEntity(button.dataset.new).catch(showError)));
    root.querySelectorAll('[data-mobile-back]').forEach((button) => button.addEventListener('click', () => { state.mobileList = true; render(); }));
    root.querySelectorAll('[data-cal]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.cal === 'prev') state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() - 1, 1);
      else if (button.dataset.cal === 'next') state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() + 1, 1);
      else state.calendarCursor = new Date();
      render();
    }));
    root.querySelectorAll('[data-archive]').forEach((button) => button.addEventListener('click', () => toggleArchive(button.dataset.archive).catch(showError)));
    const noteFilter = byId('notes-filter');
    if (noteFilter) noteFilter.addEventListener('change', () => {
      state.taggedOnly = noteFilter.value === 'tagged';
      loadView().then(render).catch(showError);
    });
    const archived = byId('show-archived');
    if (archived) archived.addEventListener('change', () => {
      state.showArchived = archived.checked;
      loadView().then(render).catch(showError);
    });
    const referenceForm = byId('reference-form');
    if (referenceForm) referenceForm.addEventListener('submit', (event) => { event.preventDefault(); addReference().catch(showError); });
    root.querySelectorAll('[data-remove-reference]').forEach((button) => button.addEventListener('click', () =>
      removeReference(button.dataset.removeReference).catch(showError)));
  }
  async function createEntity(type) {
    const data = defaultComponent(type);
    const response = await api('/api/workspace/entities', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: defaultName(type), operationId: operationId(), components: [{ typeId: type, data }] })
    });
    state.selectedId = response.id;
    state.mobileList = false;
    await reloadWorkspace();
    setStatus('作成しました');
  }
  function defaultName(type) {
    return type === 'task' ? '新しいタスク' : type === 'event' ? '新しい予定' : '新しいメモ';
  }
  function defaultComponent(type) {
    if (type === 'task') return { status: 'todo', due: '', priority: 'medium', description: '' };
    if (type === 'event') {
      const start = new Date();
      start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {
        startUtc: start.toISOString(), endUtc: end.toISOString(), timeZone: zone, location: '', description: ''
      };
    }
    if (type === 'note') return { body: '' };
    if (type === 'tag') return { entityIds: [] };
    if (type === 'estimate') return { minutes: 30 };
    return {};
  }
  async function toggleArchive(entityId) {
    if (!await flushSaves(entityId)) return;
    const entity = await api('/api/workspace/entities/' + encodeURIComponent(entityId));
    const updated = await api('/api/workspace/entities/' + encodeURIComponent(entityId), {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operationId: operationId(), expectedRevision: entity.revision, action: entity.archivedAt ? 'restore' : 'archive' })
    });
    replaceCachedEntity(updated);
    await reloadWorkspace();
    setStatus(updated.archivedAt ? 'アーカイブしました' : '復元しました');
  }
  async function loadRecordTools(entityId) {
    const entities = await Promise.all([
      api('/api/workspace/entities/' + encodeURIComponent(entityId) + '/references'),
      api('/api/workspace/entities/' + encodeURIComponent(entityId) + '/history')
    ]);
    if (entityId !== state.selectedId) return;
    const refs = byId('references');
    const history = byId('history');
    if (!refs || !history) return;
    const value = entities[0];
    let html = '';
    value.outgoing.forEach((relation) => {
      const target = allEntities.find((item) => item.id === relation.toEntityId);
      html += '<div class="reference-row"><button class="control" data-open-entity="' + escapeHtml(relation.toEntityId) + '" type="button">→ ' +
        escapeHtml(target ? nameOf(target) : relation.toEntityId) + '</button><button class="remove-btn" data-remove-reference="' +
        escapeHtml(relation.toEntityId) + '" type="button">解除</button></div>';
    });
    value.incoming.forEach((relation) => {
      const source = allEntities.find((item) => item.id === relation.fromEntityId);
      html += '<div class="reference-row">← ' + escapeHtml(source ? nameOf(source) : relation.fromEntityId) + '</div>';
    });
    refs.innerHTML = html || '<p class="muted">参照はありません。</p>';
    const events = entities[1].events;
    history.innerHTML = events.length ? events.map((item) => '<li><strong>' +
      escapeHtml(item.command + ' · ' + item.actor + ' · ' + new Date(item.at).toLocaleString()) +
      '</strong><pre>' + escapeHtml(JSON.stringify({ operationId: item.operationId, revision: item.beforeRevision + ' → ' + item.afterRevision, changes: item.changes }, null, 2)) +
      '</pre></li>').join('') : '<li class="muted">履歴はありません。</li>';
    refs.querySelectorAll('[data-remove-reference]').forEach((button) => button.addEventListener('click', () =>
      removeReference(button.dataset.removeReference).catch(showError)));
    refs.querySelectorAll('[data-open-entity]').forEach((button) => button.addEventListener('click', () => {
      state.selectedId = button.dataset.openEntity;
      state.mobileList = false;
      setStatus('参照先を開くには、そのEntityが現在のViewに必要なComponentを持つ必要があります。');
      render();
    }));
  }
  async function addReference() {
    const entity = selectedEntity();
    const target = byId('reference-target');
    if (!entity || !target || !target.value) throw new Error('参照先を選択してください');
    if (!await flushSaves(entity.id)) return;
    const latest = await api('/api/workspace/entities/' + encodeURIComponent(entity.id));
    await api('/api/workspace/entities/' + encodeURIComponent(entity.id) + '/references', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operationId: operationId(), expectedRevision: latest.revision, targetEntityId: target.value })
    });
    await reloadWorkspace();
  }
  async function removeReference(targetEntityId) {
    const entity = selectedEntity();
    if (!entity) return;
    if (!await flushSaves(entity.id)) return;
    const latest = await api('/api/workspace/entities/' + encodeURIComponent(entity.id));
    await api('/api/workspace/entities/' + encodeURIComponent(entity.id) + '/references/' + encodeURIComponent(targetEntityId), {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operationId: operationId(), expectedRevision: latest.revision })
    });
    await reloadWorkspace();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      const menu = document.querySelector('.header-menu[open]');
      if (menu) menu.open = false;
    }
  }
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.app = tab.dataset.app;
      state.mobileList = false;
      updateTabs();
      closeComponentPopover(false);
      loadView().then(render).catch(showError);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const current = tabs.indexOf(tab);
      const next = tabs[(current + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      next.click();
    });
  });
  byId('new-entity').addEventListener('click', () => createEntity(primaryType()).catch(showError));
  byId('sample-button').addEventListener('click', async () => {
    try {
      if (allEntities.length && !allEntities.every((entity) => entity.archivedAt)) {
        throw new Error('サンプルは空のワークスペースでのみ読み込めます');
      }
      if (!confirm('空のワークスペースにサンプルを読み込みます。続けますか？')) return;
      await api('/api/workspace/sample', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operationId: operationId() }) });
      state.app = 'task';
      state.selectedId = null;
      await loadAll(); await loadView(); updateTabs(); render();
      setStatus('サンプルを読み込みました');
    } catch (error) { showError(error); }
  });
  byId('export-button').addEventListener('click', async () => {
    try {
      const snapshot = await api('/api/workspace/export');
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
      anchor.download = 'logos-workspace-export.json';
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      setStatus('エクスポートしました');
    } catch (error) { showError(error); }
  });
  byId('restore-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const file = byId('restore-file').files[0];
      if (!file) throw new Error('復元ファイルを選択してください');
      if (allEntities.length) throw new Error('復元先は空のワークスペースにしてください');
      const backup = JSON.parse(await file.text());
      await api('/api/workspace/restore', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ backup, operationId: operationId() }) });
      state.selectedId = null;
      await loadAll(); await loadView(); render();
      byId('restore-file').value = '';
      setStatus('復元しました');
    } catch (error) { showError(error); }
  });
  document.addEventListener('keydown', handleKeydown);
  const changes = new EventSource('/api/workspace/events');
  changes.onmessage = async () => {
    try {
      if (dirtyEntityIds.has(state.selectedId)) {
        setStatus('別画面で更新されました。編集中の値を保存した後に再読み込みしてください。');
        return;
      }
      const selectedId = state.selectedId;
      await loadAll(); await loadView();
      if (selectedId && viewEntities.some((entity) => entity.id === selectedId)) state.selectedId = selectedId;
      render();
    } catch (error) { showError(error); }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) changes.onmessage(); });
  async function initialize() {
    try {
      await loadAll();
      await loadView();
      updateTabs();
      render();
      setStatus('保存済み');
    } catch (error) { showError(error); }
  }
  initialize();
})();
</script>
</body>
</html>
`;
