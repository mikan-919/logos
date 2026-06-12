const API = "/api";
const selected = new Set();

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

let entities = [];

async function refresh() {
  entities = (await api("GET", "/entities")).data || [];
  renderEntities();
  renderExternal();
  renderConcurrent();
  await renderLog();
}

function renderEntities() {
  const root = document.getElementById("entities");
  root.innerHTML = "";
  if (!entities.length) root.append(el("p", "hint", "(no entities)"));

  for (const e of entities) {
    const card = el("div", "entity" + (selected.has(e.id) ? " selected" : "") + (e.status === "conflict" ? " conflict" : ""));
    card.append(el("div", "id", e.id));

    const badges = el("div", "badges");
    for (const c of e.components) badges.append(el("span", "badge " + c.type, c.type));
    card.append(badges);

    for (const c of e.components) {
      if (!("title" in c.fields)) continue;
      const row = el("div", "comp-row");
      row.append(el("label", null, c.type));
      const input = el("input");
      input.value = c.fields.title;
      input.addEventListener("click", (ev) => ev.stopPropagation());
      input.addEventListener("change", async () => {
        await api("PATCH", `/components/${e.id}/${c.type}`, { title: input.value });
        await refresh();
      });
      row.append(input);
      card.append(row);
    }

    if (e.status === "conflict") {
      const banner = el("div", "conflict-banner");
      banner.append(el("span", null, "⚠ 並行 Conflict — どちらの値を採用しますか？"));
      for (const c of e.components) {
        if (!("title" in c.fields)) continue;
        const b = el("button", null, `${c.type} "${c.fields.title}"`);
        b.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          await api("POST", `/conflicts/${e.id}/resolve`, { winnerType: c.type });
          await refresh();
        });
        banner.append(b);
      }
      card.append(banner);
    }

    card.addEventListener("click", () => toggleSelect(e.id));
    root.append(card);
  }
  document.getElementById("merge-btn").disabled = selected.size !== 2;
}

function toggleSelect(id) {
  if (selected.has(id)) selected.delete(id);
  else {
    if (selected.size >= 2) selected.clear();
    selected.add(id);
  }
  renderEntities();
}

document.getElementById("merge-btn").addEventListener("click", async () => {
  const [a, b] = [...selected];
  const res = await api("POST", "/merge", { a, b });
  if (!res.ok) alert(`Merge 失敗: ${res.data.conflictType} が両方に存在します`);
  selected.clear();
  await refresh();
});

function serviceComponents() {
  const list = [];
  for (const e of entities)
    for (const c of e.components)
      if (c.service && c.fields.externalId)
        list.push({ service: c.service, externalId: c.fields.externalId, type: c.type, title: c.fields.title });
  return list;
}

function renderExternal() {
  const root = document.getElementById("external-edit");
  root.innerHTML = "";
  for (const sc of serviceComponents()) {
    const row = el("div", "edit-row");
    row.append(el("span", "svc", sc.service));
    const input = el("input");
    input.value = sc.title;
    const btn = el("button", "ghost", "送信");
    btn.addEventListener("click", async () => {
      await api("POST", "/mock/edit", { service: sc.service, externalId: sc.externalId, fields: { title: input.value } });
      await refresh();
    });
    row.append(input, btn);
    root.append(row);
  }
}

function renderConcurrent() {
  const root = document.getElementById("concurrent");
  root.innerHTML = "";

  // 2つ以上の service component が接地している Entity を探す
  let groundedComps = null;
  for (const e of entities) {
    const svc = e.components.filter((c) => c.service && c.fields.externalId && "title" in c.fields);
    if (svc.length >= 2) { groundedComps = svc; break; }
  }

  if (!groundedComps) {
    root.append(el("p", "hint", "複数の Component が接地している Entity が必要です（先に Merge）。"));
    return;
  }

  const defaultTitles = ["Fix login screen", "Fix auth flow", "Update auth docs"];
  const entries = groundedComps.map((c, i) => {
    const input = el("input");
    input.value = defaultTitles[i] ?? c.fields.title;
    const row = el("div", "edit-row");
    row.append(el("span", "svc", c.service));
    row.append(input);
    root.append(row);
    return { c, input };
  });

  const btn = el("button", null, "同時に送信");
  btn.addEventListener("click", async () => {
    await api("POST", "/mock/edit", {
      edits: entries.map(({ c, input }) => ({
        service: c.service,
        externalId: c.fields.externalId,
        fields: { title: input.value },
      })),
    });
    await refresh();
  });
  root.append(btn);
}

async function renderLog() {
  const lines = (await api("GET", "/log?n=40")).data || [];
  const root = document.getElementById("log");
  root.innerHTML = "";
  for (const l of lines.slice().reverse()) {
    root.append(el("div", "l " + l.level, `[${l.level}] ${l.message}`));
  }
}

refresh();
