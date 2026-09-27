import type { InitialData } from "./initial-data.ts";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export function renderInitialHtml(html: string, data: InitialData): string {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  const first = data.notes[0];
  const tagCount = (id: string) => data.notes.filter((note) => note.tagIds.includes(id)).length;
  const navTags = data.tags
    .slice(0, 7)
    .map(
      (tag) =>
        `<button class="spa-navitem" disabled><span>#${escapeHtml(tag.name)}</span><small>${tagCount(tag.id)}</small></button>`,
    )
    .join("");
  const notes = data.notes
    .map(
      (note, index) => `<button class="spa-note${index === 0 ? " active" : ""}" disabled>
    <strong>${escapeHtml(note.title || "無題")}</strong><span class="spa-note-snippet">${escapeHtml(note.body)}</span>
    <span class="spa-note-meta"><span>${note.tagLabels.map((tag) => `<small>#${escapeHtml(tag.name)}</small>`).join("")}</span><time>${note.updatedAt ? escapeHtml(new Date(note.updatedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })) : ""}</time></span>
  </button>`,
    )
    .join("");
  const currentTags =
    first?.tagLabels
      .map(
        (tag) =>
          `<span class="spa-tag"><span>#${escapeHtml(tag.name)}</span><button disabled>×</button></span>`,
      )
      .join("") ?? "";
  const body =
    first?.body
      .split("\n")
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("") ?? "";
  const view = `<script id="tagmemo-initial-data" type="application/json">${payload}</script>
    <div id="ssr-view" class="spa-app">
      <aside class="spa-nav" aria-label="メインナビゲーション">
        <div class="spa-brand">TAGMEMO</div>
        <nav class="spa-navgroup"><button class="spa-navitem active" disabled><span>すべてのメモ</span><small>${data.notes.length}</small></button>
          <button class="spa-navitem" disabled><span>最近</span><small>7日</small></button>
          <button class="spa-navitem" disabled><span>タグなし</span><small>${data.notes.filter((note) => note.tagIds.length === 0).length}</small></button></nav>
        <nav class="spa-navgroup"><p class="spa-navlabel">タグ</p>${navTags}<button class="spa-navitem" disabled><span>タグ管理</span><small>›</small></button></nav>
        <div class="spa-navspacer"></div><button class="spa-logout" disabled>ログアウト</button><button class="spa-newnote" disabled>新しいメモ</button>
      </aside>
      <section class="spa-shell"><header class="spa-topbar">
        <button class="spa-topbtn spa-list-toggle" disabled>☰</button><label class="spa-search"><span>⌕</span><input placeholder="メモとタグを検索" disabled></label>
        <div class="spa-topspacer"></div><button class="spa-topbtn spa-mobile-new" disabled>＋</button>
        <button class="spa-topbtn spa-desktop-action" disabled>要約</button><button class="spa-topbtn spa-desktop-action" disabled>タグ</button>
        <button class="spa-topbtn spa-desktop-action" disabled>ログアウト</button><button class="spa-topbtn primary" disabled>保存済み</button>
      </header><div class="spa-work"><div class="spa-notes-work">
        <aside class="spa-listpane" aria-label="メモ一覧"><div class="spa-listhead"><h2>すべてのメモ</h2><p>${data.notes.length} 件のメモ</p></div>
          <div class="spa-listfilters"><button class="active" disabled>更新順</button><button disabled>作成順</button><button disabled>名前順</button></div>
          <div class="spa-notes">${notes || '<p class="spa-list-empty">該当するメモはありません</p>'}</div></aside>
        <main class="spa-editor"><div class="spa-editor-inner"${first ? "" : ' data-hidden="true"'}>
          <input class="spa-title" value="${escapeHtml(first?.title ?? "")}" placeholder="無題" disabled>
          <div class="spa-meta-row">${currentTags}<button class="spa-add-tag" disabled>＋ タグ</button></div>
          <article class="spa-doc">${body}</article>
          <div class="spa-editor-footer"><button disabled>メモを削除</button></div></div>
          ${first ? "" : '<div class="spa-editor-empty"><h2>メモを選択してください</h2><p>左の一覧から選ぶか、新しいメモを作成してください。</p></div>'}
        </main></div></div></section>
    </div>`;
  if (!html.includes("<body>")) throw new Error("HTML に body がありません");
  return html.replace("<body>", `<body>${view}`);
}
