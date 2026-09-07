export const workspacePage = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Logos Workspace</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; }
    body { margin: 0; background: #f4f2ec; color: #20211f; }
    main { width: min(70rem, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
    header, section { background: #fff; border: 1px solid #d5d1c7; border-radius: .6rem; padding: 1rem; margin-bottom: 1rem; }
    h1, h2 { margin: 0 0 1rem; }
    form { display: grid; gap: .75rem; }
    label { display: grid; gap: .35rem; }
    input, textarea, button { font: inherit; padding: .6rem; }
    textarea { min-height: 10rem; resize: vertical; }
    button { width: fit-content; cursor: pointer; }
    #entities { display: flex; flex-wrap: wrap; gap: .5rem; }
    #entities button[aria-current="true"] { background: #20211f; color: white; }
    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: .75rem; }
    .status { min-height: 1.5rem; }
    .muted { color: #65675f; }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
<main>
  <header>
    <h1>Logos Workspace</h1>
    <p class="muted">名前、本文、実施予定を同じ対象IDへ保存します。</p>
  </header>
  <section>
    <h2>対象を作成</h2>
    <form id="create-form">
      <label>名前<input id="create-name" required></label>
      <button>作成</button>
    </form>
  </section>
  <section>
    <h2>対象一覧</h2>
    <div id="entities"></div>
  </section>
  <section id="detail" hidden>
    <h2 id="detail-name"></h2>
    <p class="muted">ID: <code id="detail-id"></code> / revision: <span id="detail-revision"></span></p>
    <form id="body-form">
      <label>本文<textarea id="body-markdown"></textarea></label>
      <button id="body-submit">本文機能を追加</button>
    </form>
    <hr>
    <form id="schedule-form">
      <div class="row">
        <label>開始<input id="schedule-start" type="datetime-local" required></label>
        <label>終了<input id="schedule-end" type="datetime-local" required></label>
        <label>タイムゾーン<input id="schedule-zone" required></label>
      </div>
      <button id="schedule-submit">実施予定を追加</button>
    </form>
  </section>
  <p class="status" id="status" role="status"></p>
</main>
<script>
  let selected;
  const byId = (id) => document.getElementById(id);
  const operationId = () => crypto.randomUUID();
  const component = (entity, typeId) => entity.components.find((item) => item.typeId === typeId && item.active);
  async function api(path, options) {
    const response = await fetch(path, options);
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || '保存できませんでした');
    return value;
  }
  async function load(selectId) {
    const value = await api('/api/workspace/entities');
    const list = byId('entities');
    list.replaceChildren();
    for (const entity of value.entities) {
      const button = document.createElement('button');
      button.textContent = entity.name;
      button.type = 'button';
      button.setAttribute('aria-current', String(entity.id === selectId));
      button.onclick = () => show(entity);
      list.append(button);
    }
    if (selectId) {
      const entity = value.entities.find((item) => item.id === selectId);
      if (entity) show(entity);
    }
  }
  function show(entity) {
    selected = entity;
    byId('detail').hidden = false;
    byId('detail-name').textContent = entity.name;
    byId('detail-id').textContent = entity.id;
    byId('detail-revision').textContent = entity.revision;
    const body = component(entity, 'body');
    byId('body-markdown').value = body?.data.markdown || '';
    byId('body-submit').textContent = body ? '本文を保存' : '本文機能を追加';
    const schedule = component(entity, 'schedule');
    byId('schedule-zone').value = schedule?.data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    byId('schedule-start').value = schedule ? localValue(schedule.data.startUtc, schedule.data.timeZone) : '';
    byId('schedule-end').value = schedule ? localValue(schedule.data.endUtc, schedule.data.timeZone) : '';
    byId('schedule-submit').textContent = schedule ? '実施予定を保存' : '実施予定を追加';
  }
  function dateParts(date, timeZone) {
    return Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
    );
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
      const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
      instant += desired - represented;
    }
    if (localValue(new Date(instant).toISOString(), timeZone) !== local) {
      throw new Error('指定時刻はタイムゾーン上に存在しません');
    }
    return new Date(instant).toISOString();
  }
  async function saveComponent(typeId, data) {
    const current = component(selected, typeId);
    const method = current ? 'PUT' : 'POST';
    selected = await api('/api/workspace/entities/' + selected.id + '/components/' + typeId, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operationId: operationId(), expectedRevision: selected.revision, data }),
    });
    await load(selected.id);
    byId('status').textContent = '保存しました';
  }
  byId('create-form').onsubmit = async (event) => {
    event.preventDefault();
    try {
      const entity = await api('/api/workspace/entities', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: byId('create-name').value, operationId: operationId() }),
      });
      byId('create-name').value = '';
      await load(entity.id);
      byId('status').textContent = '作成しました';
    } catch (error) { byId('status').textContent = error.message; }
  };
  byId('body-form').onsubmit = async (event) => {
    event.preventDefault();
    try { await saveComponent('body', { markdown: byId('body-markdown').value }); }
    catch (error) { byId('status').textContent = error.message; }
  };
  byId('schedule-form').onsubmit = async (event) => {
    event.preventDefault();
    try {
      const timeZone = byId('schedule-zone').value;
      await saveComponent('schedule', {
        startUtc: utcValue(byId('schedule-start').value, timeZone),
        endUtc: utcValue(byId('schedule-end').value, timeZone),
        timeZone,
      });
    } catch (error) { byId('status').textContent = error.message; }
  };
  load().catch((error) => { byId('status').textContent = error.message; });
</script>
</body>
</html>`;
