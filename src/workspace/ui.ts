export const workspacePage = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Logos Workspace</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; --line: #d5d1c7; --ink: #20211f; --muted: #65675f; --paper: #fff; --ground: #f4f2ec; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--ground); color: var(--ink); }
    main { width: min(76rem, calc(100% - 2rem)); margin: 0 auto; padding: 1.5rem 0 4rem; }
    header, section, article { background: var(--paper); border: 1px solid var(--line); border-radius: .6rem; padding: 1rem; }
    header, section { margin-bottom: 1rem; }
    h1, h2, h3, p { margin-top: 0; }
    nav, .row, .actions, .features { display: flex; flex-wrap: wrap; gap: .65rem; align-items: end; }
    nav { margin-top: 1rem; }
    form { display: grid; gap: .75rem; }
    label { display: grid; gap: .3rem; min-width: 12rem; }
    input, textarea, select, button { font: inherit; padding: .6rem; }
    textarea { min-height: 9rem; resize: vertical; }
    button { cursor: pointer; }
    button[aria-current="page"], button[aria-current="true"] { background: var(--ink); color: white; }
    .muted { color: var(--muted); }
    .status { position: sticky; bottom: 1rem; min-height: 2.6rem; padding: .55rem .8rem; background: var(--ink); color: white; border-radius: .4rem; }
    .entity-list { display: grid; gap: .5rem; margin-top: 1rem; }
    .entity { display: flex; gap: .75rem; justify-content: space-between; align-items: center; text-align: left; width: 100%; }
    .pills { display: flex; flex-wrap: wrap; gap: .3rem; }
    .pill { border: 1px solid var(--line); border-radius: 2rem; padding: .15rem .45rem; font-size: .8rem; }
    .features { align-items: stretch; }
    .features article { flex: 1 1 20rem; }
    .calendar { display: grid; grid-template-columns: repeat(7, minmax(8rem, 1fr)); gap: .5rem; overflow-x: auto; }
    .day { min-height: 10rem; background: #faf9f5; }
    .event { display: block; width: 100%; margin: .4rem 0; text-align: left; border-left: .3rem solid #526b45; }
    .reference { display: flex; gap: .5rem; align-items: center; margin: .4rem 0; }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
<main>
  <header>
    <h1>Logos Workspace</h1>
    <p class="muted">同じ対象を一覧、詳細、週カレンダーから扱います。</p>
    <nav aria-label="表示">
      <button id="nav-list" aria-current="page">対象一覧</button>
      <button id="nav-calendar">週カレンダー</button>
      <button id="nav-estimates">見積時間一覧</button>
    </nav>
  </header>

  <section id="list-view">
    <h2>対象一覧</h2>
    <form id="create-form" class="row">
      <label>新しい対象の名前<input id="create-name" required></label>
      <button>作成</button>
    </form>
    <form id="filter-form" class="row">
      <label>名前検索<input id="filter-name" type="search"></label>
      <label>進捗
        <select id="filter-progress">
          <option value="">すべて</option>
          <option value="none">進捗機能なし</option>
          <option value="todo">未着手</option>
          <option value="doing">進行中</option>
          <option value="done">完了</option>
        </select>
      </label>
      <button>絞り込む</button>
    </form>
    <div id="entities" class="entity-list"></div>
  </section>

  <section id="detail-view" hidden>
    <div class="actions"><button id="back-list">一覧へ戻る</button></div>
    <h2>対象詳細</h2>
    <form id="rename-form" class="row">
      <label>名前<input id="detail-name" required></label>
      <button>改名</button>
      <button id="archive-button" type="button">アーカイブ</button>
    </form>
    <p class="muted">ID: <code id="detail-id"></code> / revision: <span id="detail-revision"></span></p>
    <pre id="conflict-latest" hidden></pre>
    <div class="features">
      <article>
        <h3>本文</h3>
        <p id="body-state" class="muted"></p>
        <form id="body-form">
          <label>Markdown<textarea id="body-markdown"></textarea></label>
          <div class="actions"><button id="body-submit">本文機能を追加</button><button id="body-toggle" type="button" hidden></button></div>
        </form>
      </article>
      <article>
        <h3>進捗</h3>
        <p id="progress-state" class="muted"></p>
        <form id="progress-form">
          <label>状態<select id="progress-status"><option value="todo">未着手</option><option value="doing">進行中</option><option value="done">完了</option></select></label>
          <div class="actions"><button id="progress-submit">進捗機能を追加</button><button id="progress-toggle" type="button" hidden></button></div>
        </form>
      </article>
      <article>
        <h3>実施予定</h3>
        <p id="schedule-state" class="muted">時刻付きの単発予定だけを扱います。</p>
        <form id="schedule-form">
          <label>開始<input id="schedule-start" type="datetime-local" required></label>
          <label>終了<input id="schedule-end" type="datetime-local" required></label>
          <label>タイムゾーン<input id="schedule-zone" required></label>
          <div class="actions"><button id="schedule-submit">実施予定を追加</button><button id="schedule-toggle" type="button" hidden></button></div>
        </form>
      </article>
      <article>
        <h3>見積時間</h3>
        <p id="estimate-state" class="muted"></p>
        <form id="estimate-form">
          <label>分<input id="estimate-minutes" type="number" min="1" step="5" required></label>
          <div class="actions"><button id="estimate-submit">見積時間機能を追加</button><button id="estimate-toggle" type="button" hidden></button></div>
        </form>
      </article>
    </div>
    <article>
      <h3>参照</h3>
      <form id="reference-form" class="row">
        <label>参照先<select id="reference-target"></select></label>
        <button>参照を追加</button>
      </form>
      <div id="references"></div>
    </article>
    <article id="unknown-components" hidden>
      <h3>未対応のComponent</h3>
      <p class="muted">この実装では編集できません。データは保持されます。</p>
      <div id="unknown-component-list"></div>
    </article>
  </section>

  <section id="estimate-view" hidden>
    <h2>見積時間一覧</h2>
    <p>合計: <strong id="estimate-total">0分</strong></p>
    <div id="estimate-list" class="entity-list"></div>
  </section>

  <section id="calendar-view" hidden>
    <div class="actions"><button id="week-previous">前週</button><button id="week-today">今週</button><button id="week-next">次週</button></div>
    <h2 id="week-label">週カレンダー</h2>
    <p class="muted">Scheduleを持つ対象だけを表示します。日時変更は対象詳細のフォームから行います。</p>
    <div id="calendar" class="calendar"></div>
  </section>
  <p class="status" id="status" role="status">読み込み中</p>
</main>
<script>
  let allEntities = [];
  let selected;
  let currentView = 'list';
  let detailDirty = false;
  let weekCursor = startOfWeek(new Date());
  const byId = (id) => document.getElementById(id);
  const operationId = () => crypto.randomUUID();
  const component = (entity, typeId, activeOnly = true) => entity.components.find((item) => item.typeId === typeId && (!activeOnly || item.active));
  const featureLabel = { body: '本文', progress: '進捗', schedule: '実施予定', estimate: '見積時間' };
  const addFeatureLabel = { body: '本文機能を追加', progress: '進捗を管理', schedule: '実施予定を追加', estimate: '見積時間を追加' };
  const progressLabel = { todo: '未着手', doing: '進行中', done: '完了' };

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

  async function loadAll() {
    const value = await api('/api/workspace/entities?includeArchived=true');
    allEntities = value.entities;
    if (selected) selected = allEntities.find((item) => item.id === selected.id) || selected;
  }
  async function loadList() {
    const params = new URLSearchParams();
    const name = byId('filter-name').value;
    const progress = byId('filter-progress').value;
    if (name) params.set('name', name);
    if (progress === 'none') params.set('hasProgress', 'false');
    if (progress && progress !== 'none') params.set('progress', progress);
    const value = await api('/api/workspace/entities?' + params);
    const list = byId('entities');
    list.replaceChildren();
    for (const entity of value.entities) {
      const button = document.createElement('button');
      button.className = 'entity';
      button.type = 'button';
      const name = document.createElement('strong');
      name.textContent = entity.name;
      const pills = document.createElement('span');
      pills.className = 'pills';
      for (const item of entity.components.filter((candidate) => candidate.active)) {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = item.typeId === 'progress' ? progressLabel[item.data.status] : featureLabel[item.typeId] || item.typeId;
        pills.append(pill);
      }
      button.append(name, pills);
      button.onclick = () => openDetail(entity.id);
      list.append(button);
    }
    if (!value.entities.length) list.textContent = '該当する対象はありません。';
  }
  async function openDetail(entityId) {
    const entity = await api('/api/workspace/entities/' + encodeURIComponent(entityId));
    selected = entity;
    detailDirty = false;
    currentView = 'detail';
    setView();
    renderDetail(false);
    await loadReferences();
  }
  function setView() {
    byId('list-view').hidden = currentView !== 'list';
    byId('detail-view').hidden = currentView !== 'detail';
    byId('calendar-view').hidden = currentView !== 'calendar';
    byId('estimate-view').hidden = currentView !== 'estimates';
    byId('nav-list').setAttribute('aria-current', currentView === 'list' ? 'page' : 'false');
    byId('nav-calendar').setAttribute('aria-current', currentView === 'calendar' ? 'page' : 'false');
    byId('nav-estimates').setAttribute('aria-current', currentView === 'estimates' ? 'page' : 'false');
  }
  function renderDetail(preserveInputs) {
    if (!selected) return;
    if (!preserveInputs) byId('detail-name').value = selected.name;
    byId('detail-id').textContent = selected.id;
    byId('detail-revision').textContent = selected.revision;
    byId('archive-button').textContent = selected.archivedAt ? '復元' : 'アーカイブ';
    if (!preserveInputs) byId('conflict-latest').hidden = true;
    renderFeature('body', preserveInputs);
    renderFeature('progress', preserveInputs);
    renderFeature('schedule', preserveInputs);
    renderFeature('estimate', preserveInputs);
    const unknown = selected.components.filter((item) => !Object.hasOwn(featureLabel, item.typeId));
    byId('unknown-components').hidden = unknown.length === 0;
    const unknownList = byId('unknown-component-list');
    unknownList.replaceChildren();
    for (const item of unknown) {
      const value = document.createElement('pre');
      value.textContent = JSON.stringify(item, null, 2);
      unknownList.append(value);
    }
    const targets = byId('reference-target');
    const previous = targets.value;
    targets.replaceChildren();
    for (const entity of allEntities.filter((item) => item.id !== selected.id && !item.archivedAt)) {
      const option = document.createElement('option');
      option.value = entity.id;
      option.textContent = entity.name;
      targets.append(option);
    }
    if ([...targets.options].some((item) => item.value === previous)) targets.value = previous;
  }
  function renderFeature(typeId, preserveInputs) {
    const stored = component(selected, typeId, false);
    const active = stored?.active;
    byId(typeId + '-state').textContent = active ? '有効' : stored ? '解除済み。保存した値から復元できます。' : '未追加';
    byId(typeId + '-submit').textContent = active ? '保存' : stored ? '保存した値を復元' : addFeatureLabel[typeId] || (featureLabel[typeId] || typeId) + '機能を追加';
    byId(typeId + '-submit').dataset.mode = active ? 'save' : stored ? 'restore' : 'add';
    const toggle = byId(typeId + '-toggle');
    toggle.hidden = !active;
    toggle.textContent = '機能を解除';
    if (!stored && !preserveInputs) {
      if (typeId === 'body') byId('body-markdown').value = '';
      if (typeId === 'progress') byId('progress-status').value = 'todo';
      if (typeId === 'estimate') byId('estimate-minutes').value = '';
      if (typeId === 'schedule') {
        byId('schedule-start').value = '';
        byId('schedule-end').value = '';
        byId('schedule-zone').value = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
    }
    if (preserveInputs || !stored) return;
    if (typeId === 'body') byId('body-markdown').value = stored.data.markdown;
    if (typeId === 'progress') byId('progress-status').value = stored.data.status;
    if (typeId === 'estimate') byId('estimate-minutes').value = stored.data.minutes;
    if (typeId === 'schedule') {
      byId('schedule-zone').value = stored.data.timeZone;
      byId('schedule-start').value = localValue(stored.data.startUtc, stored.data.timeZone);
      byId('schedule-end').value = localValue(stored.data.endUtc, stored.data.timeZone);
    }
  }
  async function loadReferences() {
    if (!selected) return;
    const value = await api('/api/workspace/entities/' + selected.id + '/references');
    const container = byId('references');
    container.replaceChildren();
    for (const relation of value.outgoing) {
      const row = document.createElement('div');
      row.className = 'reference';
      const target = allEntities.find((item) => item.id === relation.toEntityId);
      const link = document.createElement('button');
      link.type = 'button';
      link.textContent = '→ ' + (target?.name || relation.toEntityId);
      link.onclick = () => openDetail(relation.toEntityId);
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
      row.textContent = '← ' + (source?.name || relation.fromEntityId);
      container.append(row);
    }
    if (!value.outgoing.length && !value.incoming.length) container.textContent = '参照はありません。';
  }
  async function mutateEntity(action, extra = {}) {
    selected = await api('/api/workspace/entities/' + selected.id, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: commandBody({ action, ...extra }),
    });
    await afterMutation();
  }
  async function mutateFeature(typeId, data) {
    const button = byId(typeId + '-submit');
    const mode = button.dataset.mode;
    const suffix = mode === 'restore' ? '/restore' : '';
    const method = mode === 'save' ? 'PUT' : 'POST';
    selected = await api('/api/workspace/entities/' + selected.id + '/components/' + typeId + suffix, {
      method, headers: { 'content-type': 'application/json' }, body: commandBody(mode === 'add' ? { data } : mode === 'save' ? { data } : {}),
    });
    await afterMutation();
  }
  async function disableFeature(typeId) {
    selected = await api('/api/workspace/entities/' + selected.id + '/components/' + typeId, {
      method: 'DELETE', headers: { 'content-type': 'application/json' }, body: commandBody(),
    });
    await afterMutation();
  }
  async function addReference() {
    const targetEntityId = byId('reference-target').value;
    if (!targetEntityId) throw new Error('参照先を選択してください');
    await api('/api/workspace/entities/' + selected.id + '/references', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: commandBody({ targetEntityId }),
    });
    selected = await api('/api/workspace/entities/' + selected.id);
    await afterMutation();
  }
  async function removeReference(targetEntityId) {
    try {
      await api('/api/workspace/entities/' + selected.id + '/references/' + targetEntityId, {
        method: 'DELETE', headers: { 'content-type': 'application/json' }, body: commandBody(),
      });
      selected = await api('/api/workspace/entities/' + selected.id);
      await afterMutation();
    } catch (error) { handleError(error); }
  }
  async function afterMutation() {
    detailDirty = false;
    await loadAll();
    renderDetail(false);
    await loadReferences();
    byId('status').textContent = '保存しました';
  }
  function handleError(error) {
    if (error.status === 409 && error.payload?.entity) {
      selected = error.payload.entity;
      renderDetail(true);
      showLatest(selected);
      byId('status').textContent = '別の画面で更新されました。入力は残しています。内容を確認して再度保存してください。';
      return;
    }
    byId('status').textContent = error.message;
  }
  function showLatest(entity) {
    const latest = byId('conflict-latest');
    latest.hidden = false;
    latest.textContent = '別画面の保存内容\\n' + JSON.stringify({ name: entity.name, revision: entity.revision, components: entity.components }, null, 2);
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
  async function loadCalendar() {
    const displayTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const end = new Date(weekCursor);
    end.setDate(end.getDate() + 7);
    const value = await api('/api/workspace/calendar?startUtc=' + encodeURIComponent(weekCursor.toISOString()) + '&endUtc=' + encodeURIComponent(end.toISOString()));
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
      for (const entry of value.entries.filter((item) => localValue(item.schedule.data.startUtc, displayTimeZone).slice(0, 10) === dateKey)) {
        const button = document.createElement('button');
        button.className = 'event';
        button.type = 'button';
        const local = localValue(entry.schedule.data.startUtc, displayTimeZone).slice(11);
        button.textContent = local + ' ' + entry.entity.name + (entry.progress ? ' [' + progressLabel[entry.progress.data.status] + ']' : '');
        button.onclick = () => openDetail(entry.entity.id);
        day.append(button);
      }
      calendar.append(day);
    }
  }
  function formatMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return remainder + '分';
    return hours + '時間' + (remainder ? remainder + '分' : '');
  }
  async function loadEstimates() {
    const value = await api('/api/workspace/estimates');
    byId('estimate-total').textContent = formatMinutes(value.totalMinutes);
    const list = byId('estimate-list');
    list.replaceChildren();
    for (const entry of value.entries) {
      const button = document.createElement('button');
      button.className = 'entity';
      button.type = 'button';
      const name = document.createElement('strong');
      name.textContent = entry.entity.name;
      const duration = document.createElement('span');
      duration.textContent = formatMinutes(entry.estimate.data.minutes);
      button.append(name, duration);
      button.onclick = () => openDetail(entry.entity.id);
      list.append(button);
    }
    if (!value.entries.length) list.textContent = '見積時間を持つ対象はありません。';
  }

  byId('nav-list').onclick = async () => { currentView = 'list'; setView(); await loadList(); };
  byId('back-list').onclick = byId('nav-list').onclick;
  byId('nav-calendar').onclick = async () => { currentView = 'calendar'; setView(); await loadCalendar(); };
  byId('nav-estimates').onclick = async () => { currentView = 'estimates'; setView(); await loadEstimates(); };
  byId('create-form').onsubmit = async (event) => {
    event.preventDefault();
    try {
      const entity = await api('/api/workspace/entities', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: byId('create-name').value, operationId: operationId() }) });
      byId('create-name').value = '';
      await loadAll();
      await openDetail(entity.id);
      byId('status').textContent = '作成しました';
    } catch (error) { handleError(error); }
  };
  byId('filter-form').onsubmit = async (event) => { event.preventDefault(); try { await loadList(); } catch (error) { handleError(error); } };
  byId('rename-form').onsubmit = async (event) => { event.preventDefault(); try { await mutateEntity('rename', { name: byId('detail-name').value }); } catch (error) { handleError(error); } };
  byId('archive-button').onclick = async () => { try { await mutateEntity(selected.archivedAt ? 'restore' : 'archive'); } catch (error) { handleError(error); } };
  byId('body-form').onsubmit = async (event) => { event.preventDefault(); try { await mutateFeature('body', { markdown: byId('body-markdown').value }); } catch (error) { handleError(error); } };
  byId('progress-form').onsubmit = async (event) => { event.preventDefault(); try { await mutateFeature('progress', { status: byId('progress-status').value }); } catch (error) { handleError(error); } };
  byId('schedule-form').onsubmit = async (event) => {
    event.preventDefault();
    try {
      const timeZone = byId('schedule-zone').value;
      await mutateFeature('schedule', { startUtc: utcValue(byId('schedule-start').value, timeZone), endUtc: utcValue(byId('schedule-end').value, timeZone), timeZone });
    } catch (error) { handleError(error); }
  };
  byId('estimate-form').onsubmit = async (event) => {
    event.preventDefault();
    try { await mutateFeature('estimate', { minutes: Number(byId('estimate-minutes').value) }); }
    catch (error) { handleError(error); }
  };
  for (const typeId of ['body', 'progress', 'schedule', 'estimate']) byId(typeId + '-toggle').onclick = () => disableFeature(typeId).catch(handleError);
  for (const input of ['detail-name', 'body-markdown', 'progress-status', 'schedule-start', 'schedule-end', 'schedule-zone', 'estimate-minutes']) {
    byId(input).addEventListener('input', () => { detailDirty = true; });
  }
  byId('reference-form').onsubmit = (event) => { event.preventDefault(); addReference().catch(handleError); };
  byId('week-previous').onclick = () => { weekCursor.setDate(weekCursor.getDate() - 7); loadCalendar().catch(handleError); };
  byId('week-next').onclick = () => { weekCursor.setDate(weekCursor.getDate() + 7); loadCalendar().catch(handleError); };
  byId('week-today').onclick = () => { weekCursor = startOfWeek(new Date()); loadCalendar().catch(handleError); };
  const changes = new EventSource('/api/workspace/events');
  changes.onmessage = async () => {
    try {
      await loadAll();
      if (currentView === 'list') await loadList();
      if (currentView === 'calendar') await loadCalendar();
      if (currentView === 'estimates') await loadEstimates();
      if (currentView === 'detail' && selected) {
        selected = await api('/api/workspace/entities/' + selected.id);
        renderDetail(detailDirty);
        if (detailDirty) {
          showLatest(selected);
          byId('status').textContent = '別の画面で更新されました。入力は残しています。';
        }
        await loadReferences();
      }
    } catch (error) { handleError(error); }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) changes.onmessage(); });
  Promise.all([loadAll(), loadList()]).then(() => { byId('status').textContent = '保存済み'; }).catch(handleError);
</script>
</body>
</html>`;
