export const workspacePage = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Logos</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; --line: #d6d4ce; --ink: #20211f; --muted: #676a63; --paper: #fff; --ground: #f5f4ef; --accent: #405d47; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--ground); color: var(--ink); }
    main { width: min(72rem, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
    header, section, article { background: var(--paper); border: 1px solid var(--line); border-radius: .7rem; padding: 1rem; }
    header, section { margin-bottom: 1rem; }
    h1, h2, h3, p { margin-top: 0; }
    nav, .row, .actions, .pills { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; }
    nav { margin: 1rem 0; }
    button, input, textarea, select { font: inherit; }
    button { cursor: pointer; padding: .55rem .75rem; border: 1px solid var(--line); border-radius: .4rem; background: white; color: var(--ink); }
    button:hover { border-color: var(--accent); }
    button[aria-current="page"] { background: var(--ink); color: white; }
    button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 3px solid #9bb89e; outline-offset: 2px; }
    input, textarea, select { padding: .55rem; border: 1px solid var(--line); border-radius: .35rem; background: white; color: var(--ink); }
    label { display: grid; gap: .3rem; min-width: 11rem; }
    textarea { min-height: 7rem; resize: vertical; }
    form { display: grid; gap: .7rem; }
    .row { align-items: end; }
    .row label { flex: 1 1 12rem; }
    .toolbar { color: var(--muted); }
    .toolbar summary { cursor: pointer; }
    .toolbar-content { display: flex; flex-wrap: wrap; align-items: end; gap: .8rem; padding-top: .8rem; }
    .entity-list { display: grid; gap: .55rem; margin-top: 1rem; }
    .entity-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .entity-main { min-width: 0; }
    .entity-name { display: block; max-width: 100%; overflow-wrap: anywhere; border: 0; padding: 0; text-align: left; font-weight: 700; }
    .note-preview { max-height: 4.5em; margin: .35rem 0 0; overflow: hidden; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--muted); }
    .pills { margin-top: .45rem; }
    .pill { border: 1px solid var(--line); border-radius: 2rem; padding: .12rem .5rem; color: var(--muted); font-size: .85rem; }
    .component-count { flex: 0 0 auto; color: var(--accent); }
    .calendar { display: grid; grid-template-columns: repeat(7, minmax(8rem, 1fr)); gap: .5rem; overflow-x: auto; }
    .day { min-height: 9rem; background: #faf9f6; }
    .day h3 { font-size: .95rem; }
    .calendar-item { display: grid; width: 100%; margin-top: .4rem; text-align: left; border-left: .25rem solid var(--accent); }
    .empty, .muted { color: var(--muted); }
    .status { position: sticky; bottom: .75rem; min-height: 2.5rem; padding: .6rem .8rem; background: var(--ink); color: white; border-radius: .4rem; }
    dialog { width: min(54rem, calc(100% - 1.5rem)); max-height: calc(100% - 2rem); padding: 0; border: 1px solid var(--line); border-radius: .8rem; box-shadow: 0 1rem 3rem #0003; }
    dialog::backdrop { background: #17191680; }
    .dialog-body { padding: 1rem; overflow: auto; }
    .dialog-header { position: sticky; top: -1rem; z-index: 1; display: flex; justify-content: space-between; align-items: start; gap: 1rem; margin: -1rem -1rem 1rem; padding: 1rem; background: var(--paper); border-bottom: 1px solid var(--line); }
    .components { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr)); gap: .75rem; }
    .component-card { display: grid; align-content: start; gap: .6rem; }
    .component-card h3 { margin-bottom: 0; }
    .component-card label { min-width: 0; }
    .component-state { min-height: 1.3em; margin: 0; color: var(--muted); font-size: .9rem; }
    .tag-options { display: grid; gap: .35rem; max-height: 10rem; overflow: auto; }
    .tag-options label { display: flex; min-width: 0; align-items: center; gap: .5rem; }
    .tag-options input { width: 1rem; height: 1rem; }
    .section-small { margin-top: 1rem; }
    .reference { display: flex; gap: .5rem; align-items: center; margin: .35rem 0; }
    pre { max-width: 100%; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
    [hidden] { display: none !important; }
    @media (max-width: 640px) {
      main { width: min(100% - 1rem, 72rem); padding-top: .75rem; }
      .entity-row { align-items: start; }
      .component-count { padding: .45rem; }
      .calendar { grid-template-columns: repeat(7, minmax(7rem, 1fr)); }
    }
  </style>
</head>
<body>
<main>
  <header>
    <h1>Logos</h1>
    <p class="muted">同じEntityをTask、Calendar、NoteのViewで扱います。</p>
    <nav aria-label="Views">
      <button id="nav-tasks" aria-current="page">Tasks</button>
      <button id="nav-calendar">Calendar</button>
      <button id="nav-notes">Notes</button>
    </nav>
    <details class="toolbar">
      <summary>データの保存と復元</summary>
      <div class="toolbar-content">
        <button id="sample-button" type="button">サンプルを読み込む</button>
        <button id="export-button" type="button">エクスポート</button>
        <form id="restore-form" class="row">
          <label>復元ファイル<input id="restore-file" type="file" accept="application/json"></label>
          <button>復元</button>
        </form>
      </div>
    </details>
  </header>

  <section id="tasks-view">
    <h2>Tasks</h2>
    <form id="create-task-form" class="row">
      <label>新しいTask<input id="create-task-name" required></label>
      <button>作成</button>
    </form>
    <div id="tasks-list" class="entity-list"></div>
  </section>

  <section id="calendar-view" hidden>
    <h2>Calendar</h2>
    <form id="create-event-form" class="row">
      <label>Event名<input id="create-event-name" required></label>
      <label>開始<input id="create-event-start" type="datetime-local" required></label>
      <label>終了<input id="create-event-end" type="datetime-local" required></label>
      <label>タイムゾーン<input id="create-event-zone" required></label>
      <button>作成</button>
    </form>
    <div class="actions section-small"><button id="week-previous">前週</button><button id="week-today">今週</button><button id="week-next">次週</button></div>
    <p id="week-label" class="muted"></p>
    <div id="calendar" class="calendar"></div>
  </section>

  <section id="notes-view" hidden>
    <h2>Notes</h2>
    <form id="create-note-form" class="row">
      <label>新しいNote<input id="create-note-name" required></label>
      <button>作成</button>
    </form>
    <label class="section-small">表示条件
      <select id="notes-requirement">
        <option value="notes">Name + Note</option>
        <option value="tagged-notes">Name + Note + Tag</option>
      </select>
    </label>
    <div id="notes-list" class="entity-list"></div>
  </section>

  <p id="status" class="status" role="status">読み込み中</p>
</main>

<dialog id="component-popover" aria-labelledby="popover-title">
  <div class="dialog-body">
    <div class="dialog-header">
      <div>
        <h2 id="popover-title">Entity Components</h2>
        <p id="popover-meta" class="muted"></p>
      </div>
      <div class="actions"><button id="archive-button" type="button">アーカイブ</button><button id="close-popover" type="button">閉じる</button></div>
    </div>
    <p id="dialog-status" class="muted" role="status"></p>
    <div id="components" class="components"></div>
    <details class="section-small">
      <summary>Relationと履歴</summary>
      <form id="reference-form" class="row section-small">
        <label>参照先<select id="reference-target"></select></label>
        <button>参照を追加</button>
      </form>
      <div id="references"></div>
      <ol id="history"></ol>
    </details>
    <details id="unknown-components-details" class="section-small" hidden>
      <summary>未対応Component</summary>
      <p class="muted">この画面では編集できません。データは保持されます。</p>
      <div id="unknown-components"></div>
    </details>
    <pre id="conflict-latest" hidden></pre>
  </div>
</dialog>

<script>
  let allEntities = [];
  let selected;
  let currentView = 'tasks';
  let dialogDirty = false;
  let weekCursor = startOfWeek(new Date());
  const byId = (id) => document.getElementById(id);
  const operationId = () => crypto.randomUUID();
  const component = (entity, typeId, activeOnly = true) => entity.components.find((item) => item.typeId === typeId && (!activeOnly || item.active));
  const componentDefinitions = [
    { typeId: 'name', label: 'Name', editable: true },
    { typeId: 'task', label: 'Task', editable: true },
    { typeId: 'note', label: 'Note', editable: true },
    { typeId: 'event', label: 'Event', editable: true },
    { typeId: 'tag', label: 'Tag', editable: true },
    { typeId: 'this-is-tag', label: 'ThisIsTag', editable: true },
    { typeId: 'estimate', label: 'Estimate', editable: true },
  ];
  const statusLabels = { todo: '未着手', doing: '進行中', done: '完了' };
  const commandLabels = {
    'entity.create': 'Entityを作成', 'entity.rename': 'Nameを変更', 'entity.archive': 'アーカイブ', 'entity.restore': 'アーカイブを復元',
    'component.add': 'Componentを追加', 'component.disable': 'Componentを解除', 'component.restore': 'Componentを復元', 'component.update': 'Componentを更新',
    'relation.add': '参照を追加', 'relation.remove': '参照を解除', 'workspace.sample': 'サンプルを投入', 'workspace.restore': 'ワークスペースを復元',
  };

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
  const commandBody = (extra = {}) => JSON.stringify({ operationId: operationId(), expectedRevision: selected.revision, ...extra });
  function nameOf(entity) { return component(entity, 'name')?.data?.value || entity.name || entity.id; }
  function activeComponents(entity) { return entity.components.filter((item) => item.active); }
  function componentLabel(typeId) { return componentDefinitions.find((item) => item.typeId === typeId)?.label || typeId; }

  async function loadAll() {
    const value = await api('/api/workspace/entities?includeArchived=true');
    allEntities = value.entities;
    byId('sample-button').disabled = allEntities.length !== 0;
    if (selected) selected = allEntities.find((item) => item.id === selected.id) || selected;
  }
  async function loadView(id = currentView) {
    const result = await api('/api/workspace/views/' + encodeURIComponent(id));
    if (id === 'tasks') renderList('tasks-list', result.entities, 'tasks');
    if (id === 'notes' || id === 'tagged-notes') renderList('notes-list', result.entities, id);
    if (id === 'calendar') renderCalendar(result.entities);
  }
  function renderList(targetId, entities, viewId) {
    const list = byId(targetId);
    list.replaceChildren();
    for (const entity of entities) {
      const row = document.createElement('article');
      row.className = 'entity-row';
      const main = document.createElement('div');
      main.className = 'entity-main';
      const title = document.createElement('button');
      title.className = 'entity-name';
      title.type = 'button';
      title.textContent = nameOf(entity);
      title.onclick = () => openPopover(entity.id);
      main.append(title);
      const note = component(entity, 'note');
      if (viewId === 'notes' && note?.data?.body) {
        const preview = document.createElement('p');
        preview.className = 'note-preview';
        preview.textContent = note.data.body;
        main.append(preview);
      }
      const pills = document.createElement('div');
      pills.className = 'pills';
      for (const item of activeComponents(entity)) {
        if (item.typeId === 'name') continue;
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = item.typeId === 'task' ? statusLabels[item.data.status] : componentLabel(item.typeId);
        pills.append(pill);
      }
      if ((viewId === 'notes' || viewId === 'tagged-notes') && component(entity, 'tag')?.data?.entityIds?.length) {
        const tags = component(entity, 'tag').data.entityIds.map((id) => allEntities.find((item) => item.id === id)).filter(Boolean);
        for (const tag of tags) {
          const pill = document.createElement('span');
          pill.className = 'pill';
          pill.textContent = nameOf(tag);
          pills.append(pill);
        }
      }
      main.append(pills);
      const count = document.createElement('button');
      count.className = 'component-count';
      count.type = 'button';
      count.textContent = activeComponents(entity).length + ' components';
      count.setAttribute('aria-label', 'Open ' + nameOf(entity) + ' components');
      count.onclick = () => openPopover(entity.id);
      row.append(main, count);
      list.append(row);
    }
    if (!entities.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = viewId === 'tagged-notes'
        ? 'Name、Note、Tagを持つEntityはありません。Component数からTagを追加できます。'
        : 'このViewの条件に合うEntityはありません。';
      list.append(empty);
    }
  }
  function setView(view) {
    currentView = view;
    byId('tasks-view').hidden = view !== 'tasks';
    byId('calendar-view').hidden = view !== 'calendar';
    byId('notes-view').hidden = view !== 'notes';
    byId('nav-tasks').setAttribute('aria-current', view === 'tasks' ? 'page' : 'false');
    byId('nav-calendar').setAttribute('aria-current', view === 'calendar' ? 'page' : 'false');
    byId('nav-notes').setAttribute('aria-current', view === 'notes' ? 'page' : 'false');
  }
  function openPopover(entityId) {
    api('/api/workspace/entities/' + encodeURIComponent(entityId)).then(async (entity) => {
      selected = entity;
      dialogDirty = false;
      renderPopover();
      await Promise.all([loadReferences(), loadHistory()]);
      byId('component-popover').showModal();
    }).catch(handleError);
  }
  function renderPopover() {
    if (!selected) return;
    byId('popover-title').textContent = nameOf(selected);
    byId('popover-meta').textContent = 'Entity ' + selected.id + ' · revision ' + selected.revision + ' · ' + activeComponents(selected).length + ' components';
    byId('archive-button').textContent = selected.archivedAt ? '復元' : 'アーカイブ';
    if (!dialogDirty) byId('conflict-latest').hidden = true;
    const container = byId('components');
    container.replaceChildren();
    for (const definition of componentDefinitions) {
      renderComponentEditor(container, definition);
    }
    const known = new Set(componentDefinitions.map((item) => item.typeId));
    const unknown = selected.components.filter((item) => !known.has(item.typeId));
    byId('unknown-components-details').hidden = unknown.length === 0;
    const unknownList = byId('unknown-components');
    unknownList.replaceChildren();
    for (const item of unknown) {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(item, null, 2);
      unknownList.append(pre);
    }
    const targets = byId('reference-target');
    const previous = targets.value;
    targets.replaceChildren();
    for (const entity of allEntities.filter((item) => item.id !== selected.id && !item.archivedAt)) {
      const option = document.createElement('option');
      option.value = entity.id;
      option.textContent = nameOf(entity);
      targets.append(option);
    }
    if ([...targets.options].some((item) => item.value === previous)) targets.value = previous;
  }
  function renderComponentEditor(container, definition) {
    const stored = component(selected, definition.typeId, false);
    const active = stored?.active;
    const card = document.createElement('article');
    card.className = 'component-card';
    const heading = document.createElement('h3');
    heading.textContent = definition.label;
    card.append(heading);
    const state = document.createElement('p');
    state.className = 'component-state';
    state.textContent = active ? '有効' : stored ? '解除済み。保存した値を復元できます。' : '未追加';
    card.append(state);
    let readData = () => stored?.data;
    if (definition.typeId === 'name') {
      const input = document.createElement('input');
      input.required = true;
      input.value = stored?.data?.value || '';
      input.setAttribute('aria-label', 'Name');
      card.append(input);
      readData = () => ({ value: input.value });
    } else if (definition.typeId === 'task') {
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Task status');
      for (const [value, label] of Object.entries(statusLabels)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.append(option);
      }
      select.value = stored?.data?.status || 'todo';
      card.append(select);
      readData = () => ({ status: select.value });
    } else if (definition.typeId === 'note') {
      const textarea = document.createElement('textarea');
      textarea.value = stored?.data?.body || '';
      textarea.setAttribute('aria-label', 'Note body');
      card.append(textarea);
      readData = () => ({ body: textarea.value });
    } else if (definition.typeId === 'event') {
      const start = document.createElement('input');
      start.type = 'datetime-local';
      start.required = true;
      start.setAttribute('aria-label', 'Event start');
      const end = document.createElement('input');
      end.type = 'datetime-local';
      end.required = true;
      end.setAttribute('aria-label', 'Event end');
      const zone = document.createElement('input');
      zone.required = true;
      zone.setAttribute('aria-label', 'Event time zone');
      const timeZone = stored?.data?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      zone.value = timeZone;
      if (stored?.data?.startUtc) start.value = localValue(stored.data.startUtc, timeZone);
      if (stored?.data?.endUtc) end.value = localValue(stored.data.endUtc, timeZone);
      card.append(labelled('開始', start), labelled('終了', end), labelled('タイムゾーン', zone));
      readData = () => ({ startUtc: utcValue(start.value, zone.value), endUtc: utcValue(end.value, zone.value), timeZone: zone.value });
    } else if (definition.typeId === 'tag') {
      const tagOptions = document.createElement('div');
      tagOptions.className = 'tag-options';
      const selectedIds = stored?.data?.entityIds || [];
      const tags = allEntities.filter((entity) => component(entity, 'this-is-tag')?.active
        && (!entity.archivedAt || selectedIds.includes(entity.id)));
      for (const tag of tags) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = tag.id;
        checkbox.checked = selectedIds.includes(tag.id);
        const label = document.createElement('label');
        const text = document.createElement('span');
        text.textContent = nameOf(tag);
        label.append(checkbox, text);
        tagOptions.append(label);
      }
      if (!tags.length) {
        const empty = document.createElement('span');
        empty.className = 'muted';
        empty.textContent = 'Tag Entityはありません。';
        tagOptions.append(empty);
      }
      const newTagName = document.createElement('input');
      newTagName.placeholder = '新しいTag名';
      newTagName.setAttribute('aria-label', '新しいTag名');
      const createTag = document.createElement('button');
      createTag.type = 'button';
      createTag.textContent = 'Tag Entityを作成';
      createTag.onclick = () => createTagEntity(newTagName.value);
      card.append(tagOptions, labelled('Tagを追加', newTagName), createTag);
      readData = () => ({ entityIds: [...tagOptions.querySelectorAll('input:checked')].map((input) => input.value) });
    } else if (definition.typeId === 'estimate') {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.step = '1';
      input.value = stored?.data?.minutes || '';
      input.setAttribute('aria-label', 'Estimate minutes');
      card.append(input);
      readData = () => ({ minutes: Number(input.value) });
    } else if (definition.typeId === 'this-is-tag') {
      const message = document.createElement('p');
      message.className = 'muted';
      message.textContent = 'このEntityをTagとして扱います。';
      card.append(message);
    }
    const actions = document.createElement('div');
    actions.className = 'actions';
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = active ? '保存' : stored ? '復元' : '追加';
    save.onclick = async () => {
      try {
        await mutateComponent(definition.typeId, active ? 'update' : stored ? 'restore' : 'add', readData());
      } catch (error) { handleError(error); }
    };
    actions.append(save);
    if (active && definition.typeId !== 'name') {
      const disable = document.createElement('button');
      disable.type = 'button';
      disable.textContent = '解除';
      disable.onclick = () => disableComponent(definition.typeId).catch(handleError);
      actions.append(disable);
    }
    card.append(actions);
    for (const input of card.querySelectorAll('input, textarea, select')) {
      input.addEventListener('input', () => { dialogDirty = true; });
      input.addEventListener('change', () => { dialogDirty = true; });
    }
    container.append(card);
  }
  function labelled(labelText, control) {
    const label = document.createElement('label');
    const title = document.createElement('span');
    title.textContent = labelText;
    label.append(title, control);
    return label;
  }
  async function mutateComponent(typeId, mode, data) {
    const suffix = mode === 'restore' ? '/restore' : '';
    const method = mode === 'update' ? 'PUT' : 'POST';
    const options = { method, headers: { 'content-type': 'application/json' }, body: commandBody(mode === 'restore' ? {} : { data }) };
    selected = await api('/api/workspace/entities/' + encodeURIComponent(selected.id) + '/components/' + encodeURIComponent(typeId) + suffix, options);
    await afterMutation();
  }
  async function disableComponent(typeId) {
    selected = await api('/api/workspace/entities/' + encodeURIComponent(selected.id) + '/components/' + encodeURIComponent(typeId), {
      method: 'DELETE', headers: { 'content-type': 'application/json' }, body: commandBody(),
    });
    await afterMutation();
  }
  async function createTagEntity(name) {
    try {
      if (!name.trim()) throw new Error('Tag名を入力してください');
      if (!component(selected, 'tag')?.active) {
        selected = await api('/api/workspace/entities/' + selected.id + '/components/tag', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: commandBody({ data: { entityIds: [] } }),
        });
      }
      const tag = await api('/api/workspace/entities', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, operationId: operationId(), components: [{ typeId: 'this-is-tag', data: {} }] }),
      });
      const currentIds = component(selected, 'tag')?.data?.entityIds || [];
      selected = await api('/api/workspace/entities/' + selected.id + '/components/tag', {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: commandBody({ data: { entityIds: [...currentIds, tag.id] } }),
      });
      await afterMutation();
      byId('dialog-status').textContent = 'Tag Entityを作成して追加しました';
    } catch (error) { handleError(error); }
  }
  async function afterMutation() {
    dialogDirty = false;
    await loadAll();
    selected = await api('/api/workspace/entities/' + encodeURIComponent(selected.id));
    renderPopover();
    await Promise.all([loadReferences(), loadHistory(), loadView(currentView === 'notes' ? byId('notes-requirement').value : currentView)]);
    byId('status').textContent = '保存しました';
  }
  function handleError(error) {
    if (error.status === 409 && error.payload?.entity) {
      selected = error.payload.entity;
      byId('popover-meta').textContent = '別画面の保存後の状態: revision ' + selected.revision;
      byId('conflict-latest').hidden = false;
      byId('conflict-latest').textContent = '入力を残しました。最新状態を確認し、もう一度保存してください。\\n' + JSON.stringify({ revision: selected.revision, components: selected.components }, null, 2);
      byId('dialog-status').textContent = '別画面で更新されました。';
      return;
    }
    byId('dialog-status').textContent = error.message;
    byId('status').textContent = error.message;
  }
  async function loadReferences() {
    if (!selected) return;
    const value = await api('/api/workspace/entities/' + encodeURIComponent(selected.id) + '/references');
    const container = byId('references');
    container.replaceChildren();
    for (const relation of value.outgoing) {
      const row = document.createElement('div');
      row.className = 'reference';
      const target = allEntities.find((item) => item.id === relation.toEntityId);
      const link = document.createElement('button');
      link.type = 'button';
      link.textContent = '→ ' + (target ? nameOf(target) : relation.toEntityId);
      link.onclick = () => openPopover(relation.toEntityId);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '解除';
      remove.onclick = () => removeReference(relation.toEntityId);
      row.append(link, remove);
      container.append(row);
    }
    for (const relation of value.incoming) {
      const source = allEntities.find((item) => item.id === relation.fromEntityId);
      const row = document.createElement('div');
      row.className = 'reference';
      row.textContent = '← ' + (source ? nameOf(source) : relation.fromEntityId);
      container.append(row);
    }
    if (!value.outgoing.length && !value.incoming.length) container.textContent = '参照はありません。';
  }
  async function loadHistory() {
    if (!selected) return;
    const value = await api('/api/workspace/entities/' + encodeURIComponent(selected.id) + '/history');
    const list = byId('history');
    list.replaceChildren();
    for (const event of value.events) {
      const item = document.createElement('li');
      const summary = document.createElement('strong');
      summary.textContent = (commandLabels[event.command] || event.command) + ' / ' + event.actor + ' / ' + new Date(event.at).toLocaleString();
      const detail = document.createElement('pre');
      detail.textContent = JSON.stringify({ operationId: event.operationId, revision: event.beforeRevision + ' → ' + event.afterRevision, changes: event.changes }, null, 2);
      item.append(summary, detail);
      list.append(item);
    }
    if (!value.events.length) list.textContent = '履歴はありません。';
  }
  async function addReference() {
    const targetEntityId = byId('reference-target').value;
    if (!targetEntityId) throw new Error('参照先を選択してください');
    await api('/api/workspace/entities/' + selected.id + '/references', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: commandBody({ targetEntityId }),
    });
    await afterMutation();
  }
  async function removeReference(targetEntityId) {
    try {
      await api('/api/workspace/entities/' + selected.id + '/references/' + targetEntityId, {
        method: 'DELETE', headers: { 'content-type': 'application/json' }, body: commandBody(),
      });
      await afterMutation();
    } catch (error) { handleError(error); }
  }
  function dateParts(date, timeZone) {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  }
  function localValue(utc, timeZone) {
    const parts = dateParts(new Date(utc), timeZone);
    return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute;
  }
  function utcValue(local, timeZone) {
    const values = local.match(/^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})$/);
    if (!values) throw new Error('開始と終了を入力してください');
    const desired = Date.UTC(+values[1], +values[2] - 1, +values[3], +values[4], +values[5]);
    let instant = desired;
    for (let attempt = 0; attempt < 3; attempt++) {
      const parts = dateParts(new Date(instant), timeZone);
      instant += desired - Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    }
    if (localValue(new Date(instant).toISOString(), timeZone) !== local) throw new Error('指定時刻はタイムゾーン上に存在しません');
    return new Date(instant).toISOString();
  }
  function startOfWeek(date) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
    return result;
  }
  function setEventDefaults() {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    byId('create-event-zone').value = zone;
    byId('create-event-start').value = localValue(now.toISOString(), zone);
    byId('create-event-end').value = localValue(end.toISOString(), zone);
  }
  function renderCalendar(entities) {
    const end = new Date(weekCursor);
    end.setDate(end.getDate() + 7);
    byId('week-label').textContent = weekCursor.toLocaleDateString() + 'から7日間';
    const calendar = byId('calendar');
    calendar.replaceChildren();
    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(weekCursor);
      date.setDate(date.getDate() + offset);
      const day = document.createElement('article');
      day.className = 'day';
      const heading = document.createElement('h3');
      heading.textContent = date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      day.append(heading);
      const dateKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      for (const entity of entities) {
        const event = component(entity, 'event');
        if (!event || Date.parse(event.data.startUtc) >= end.getTime() || Date.parse(event.data.endUtc) < weekCursor.getTime()) continue;
        if (localValue(event.data.startUtc, Intl.DateTimeFormat().resolvedOptions().timeZone).slice(0, 10) !== dateKey) continue;
        const button = document.createElement('button');
        button.className = 'calendar-item';
        button.type = 'button';
        const time = localValue(event.data.startUtc, Intl.DateTimeFormat().resolvedOptions().timeZone).slice(11);
        button.textContent = time + ' ' + nameOf(entity) + ' · ' + activeComponents(entity).length + ' components';
        button.onclick = () => openPopover(entity.id);
        day.append(button);
      }
      calendar.append(day);
    }
  }
  async function createEntity(name, components) {
    const entity = await api('/api/workspace/entities', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, operationId: operationId(), components }),
    });
    await loadAll();
    await loadView(currentView === 'notes' ? byId('notes-requirement').value : currentView);
    byId('status').textContent = '作成しました';
    openPopover(entity.id);
  }
  function downloadExport(snapshot) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    link.download = 'logos-workspace-export.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function restoreWorkspace() {
    const file = byId('restore-file').files[0];
    if (!file) throw new Error('復元ファイルを選択してください');
    if (!confirm('空のワークスペースへ復元します。続けますか？')) return;
    let backup;
    try { backup = JSON.parse(await file.text()); }
    catch { throw new Error('復元ファイルはJSONである必要があります'); }
    await api('/api/workspace/restore', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ backup, operationId: operationId() }),
    });
    selected = undefined;
    byId('component-popover').close();
    await loadAll();
    await loadView('tasks');
    byId('restore-file').value = '';
    byId('status').textContent = '復元しました';
  }
  async function loadSample() {
    if (allEntities.length) {
      byId('status').textContent = 'サンプルは空のワークスペースでのみ読み込めます';
      return;
    }
    if (!confirm('空のワークスペースにサンプルを読み込みます。続けますか？')) return;
    await api('/api/workspace/sample', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operationId: operationId() }),
    });
    await loadAll();
    await loadView('tasks');
    byId('status').textContent = 'サンプルを読み込みました';
  }

  byId('nav-tasks').onclick = () => { setView('tasks'); loadView('tasks').catch(handleError); };
  byId('nav-calendar').onclick = () => { setView('calendar'); loadView('calendar').catch(handleError); };
  byId('nav-notes').onclick = () => { setView('notes'); loadView(byId('notes-requirement').value).catch(handleError); };
  byId('notes-requirement').onchange = () => loadView(byId('notes-requirement').value).catch(handleError);
  byId('close-popover').onclick = () => byId('component-popover').close();
  byId('component-popover').addEventListener('click', (event) => {
    if (event.target === byId('component-popover')) byId('component-popover').close();
  });
  byId('archive-button').onclick = async () => {
    try {
      selected = await api('/api/workspace/entities/' + selected.id, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: commandBody({ action: selected.archivedAt ? 'restore' : 'archive' }),
      });
      await afterMutation();
    } catch (error) { handleError(error); }
  };
  byId('create-task-form').onsubmit = (event) => {
    event.preventDefault();
    createEntity(byId('create-task-name').value, [{ typeId: 'task', data: { status: 'todo' } }]).then(() => { byId('create-task-name').value = ''; }).catch(handleError);
  };
  byId('create-note-form').onsubmit = (event) => {
    event.preventDefault();
    createEntity(byId('create-note-name').value, [{ typeId: 'note', data: { body: '' } }]).then(() => { byId('create-note-name').value = ''; }).catch(handleError);
  };
  byId('create-event-form').onsubmit = (event) => {
    event.preventDefault();
    try {
      createEntity(byId('create-event-name').value, [{
        typeId: 'event',
        data: {
          startUtc: utcValue(byId('create-event-start').value, byId('create-event-zone').value),
          endUtc: utcValue(byId('create-event-end').value, byId('create-event-zone').value),
          timeZone: byId('create-event-zone').value,
        },
      }]).then(() => { byId('create-event-name').value = ''; }).catch(handleError);
    } catch (error) { handleError(error); }
  };
  byId('reference-form').onsubmit = (event) => { event.preventDefault(); addReference().catch(handleError); };
  byId('week-previous').onclick = () => { weekCursor.setDate(weekCursor.getDate() - 7); loadView('calendar').catch(handleError); };
  byId('week-next').onclick = () => { weekCursor.setDate(weekCursor.getDate() + 7); loadView('calendar').catch(handleError); };
  byId('week-today').onclick = () => { weekCursor = startOfWeek(new Date()); loadView('calendar').catch(handleError); };
  byId('sample-button').onclick = () => loadSample().catch(handleError);
  byId('export-button').onclick = async () => {
    try { downloadExport(await api('/api/workspace/export')); byId('status').textContent = 'エクスポートしました'; }
    catch (error) { handleError(error); }
  };
  byId('restore-form').onsubmit = (event) => { event.preventDefault(); restoreWorkspace().catch(handleError); };
  const changes = new EventSource('/api/workspace/events');
  changes.onmessage = async () => {
    try {
      await loadAll();
      if (currentView === 'notes') await loadView(byId('notes-requirement').value);
      else await loadView(currentView);
      if (selected && byId('component-popover').open) {
        const latest = await api('/api/workspace/entities/' + encodeURIComponent(selected.id));
        if (!dialogDirty) {
          selected = latest;
          renderPopover();
          await Promise.all([loadReferences(), loadHistory()]);
        } else {
          byId('popover-meta').textContent = '別画面で更新されました。入力中の値を確認してください。';
        }
      }
    } catch (error) { handleError(error); }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) changes.onmessage(); });
  setEventDefaults();
  setView('tasks');
  Promise.all([loadAll(), loadView('tasks')]).then(() => { byId('status').textContent = '保存済み'; }).catch(handleError);
</script>
</body>
</html>`;
