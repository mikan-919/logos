import type { InitialData } from "./initial-data.ts";
import { relatedOrder } from "./tag-model.ts";

const plusIcon =
  '<svg class="stream-inline-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
const userIcon =
  '<svg class="stream-inline-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character,
  );
}

export function renderInitialHtml(html: string, data: InitialData): string {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  const first = data.notes[0];
  const notes = relatedOrder(
    data.notes.map((note) => ({
      ...note,
      tagStates:
        note.tagStates ?? note.tagIds.map((id) => ({ id, state: "on" as const, score: 1 })),
    })),
    first?.id ?? "",
  )
    .map(
      (
        note,
        index,
      ) => `<section class="stream-note${index === 0 ? " active" : ""}" data-note-id="${escapeHtml(note.id)}">
      <div class="stream-note-head"><p class="stream-kicker">メモ</p><input class="stream-title" value="${escapeHtml(note.title)}" placeholder="無題" disabled>
        <div class="stream-note-tags">${note.tagLabels.map((tag) => `<span class="stream-tag">#${escapeHtml(tag.name)}</span>`).join("")}${index === 0 ? `<button class="stream-add-tag" disabled>${plusIcon} タグ</button>` : ""}</div></div>
      <article class="stream-doc">${note.body
        .split("\n")
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("")}</article>
    </section>`,
    )
    .join("");
  const view = `<script id="tagmemo-initial-data" type="application/json">${payload}</script>
    <div id="ssr-view" class="stream-app"><header class="stream-topbar">
      <div class="stream-top-left"><strong class="stream-brand">TAGMEMO</strong><button disabled>ライブラリ</button></div>
      <span class="stream-current-title">${escapeHtml(first?.title ?? "")}</span>
      <div class="stream-top-right"><button class="stream-action" disabled>要約</button><button class="stream-action" disabled>タグ</button><button class="stream-save" disabled>保存済み</button><div class="stream-account"><button class="stream-account-button" disabled>${userIcon}</button></div></div>
    </header><main class="stream-scroll"><div class="stream-content">${notes || '<div class="stream-empty"><h1>メモはありません</h1><p>下の新しいメモボタンから作成してください。</p></div>'}</div></main>
    <nav class="stream-dock"><button disabled>ライブラリ</button><button disabled>タグ</button><button class="stream-dock-new" disabled>${plusIcon}</button></nav></div>`;
  if (!html.includes("<body>")) throw new Error("HTML に body がありません");
  return html.replace("<body>", `<body>${view}`);
}
