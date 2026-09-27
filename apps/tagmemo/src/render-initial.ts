import type { InitialData } from "./initial-data.ts";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function renderInitialHtml(html: string, data: InitialData): string {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  const tags = data.tags
    .map(
      (tag) => `<div class="tag-item"><span class="tag-name">${escapeHtml(tag.name)}</span></div>`,
    )
    .join("");
  const notes = data.notes.length
    ? data.notes
        .map(
          (note) => `<article class="memo-card">
            <h2>${escapeHtml(note.title)}</h2>
            <p>${escapeHtml(note.body)}</p>
            <div class="card-footer"><div class="chips">${note.tagLabels
              .map((tag) => `<span class="chip">${escapeHtml(tag.name)}</span>`)
              .join("")}</div><button type="button" disabled>編集</button></div>
          </article>`,
        )
        .join("")
    : '<div class="empty"><strong>メモがありません</strong><span>メモを作成して、タグで整理できます。</span></div>';
  const view = `<script id="tagmemo-initial-data" type="application/json">${payload}</script>
    <div id="ssr-view" class="shell">
      <header class="topbar">
        <div class="brand"><span>TagMemo</span></div>
        <label class="search"><span>検索</span><input type="search" placeholder="メモを検索" disabled></label>
        <button class="primary" type="button" disabled>＋ メモを作成</button>
        <button class="quiet logout" type="button" disabled>ログアウト</button>
      </header>
      <div class="workspace">
        <aside class="sidebar" aria-label="タグ">
          <p class="eyebrow">ライブラリ</p>
          <div class="nav-item active"><span>すべてのメモ</span><span>${data.notes.length}</span></div>
          <div class="sidebar-heading"><p class="eyebrow">タグ</p><span>${data.tags.length}</span></div>
          <div class="tag-list">${tags}</div>
          <form class="new-tag-form"><label for="ssr-new-tag-name">タグを追加</label><div>
            <input id="ssr-new-tag-name" placeholder="タグ名" disabled>
            <button type="button" aria-label="タグを追加" disabled>＋</button>
          </div></form>
        </aside>
        <main class="main">
          <div class="main-heading"><div><p class="eyebrow">あなたのノート</p><h1>すべてのメモ</h1></div>
            <span class="count">${data.notes.length} 件</span></div>
          <p class="status" role="status" aria-live="polite"></p>
          <div class="memo-list">${notes}</div>
        </main>
      </div>
    </div>`;
  if (!html.includes("<body>")) throw new Error("HTML に body がありません");
  return html.replace("<body>", `<body>${view}`);
}
