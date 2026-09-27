import { render } from "irisout";

export function SpaNavigation({
  notes,
  tags,
  view,
  selectedTag,
  mobileOpen,
  onView,
  onTag,
  onManage,
  onNew,
  onLogout,
}) {
  render(
    <aside class={mobileOpen() ? "spa-nav open" : "spa-nav"} aria-label="メインナビゲーション">
      <div class="spa-brand">TAGMEMO</div>
      <nav class="spa-navgroup" aria-label="メモ">
        <button
          class={view() === "all" ? "spa-navitem active" : "spa-navitem"}
          type="button"
          onClick={() => {
            onView("all");
          }}
        >
          <span>すべてのメモ</span>
          <small>{notes().length}</small>
        </button>
        <button
          class={view() === "recent" ? "spa-navitem active" : "spa-navitem"}
          type="button"
          onClick={() => {
            onView("recent");
          }}
        >
          <span>最近</span>
          <small>7日</small>
        </button>
        <button
          class={view() === "untagged" ? "spa-navitem active" : "spa-navitem"}
          type="button"
          onClick={() => {
            onView("untagged");
          }}
        >
          <span>タグなし</span>
          <small>{notes().filter((note) => note.tagIds.length === 0).length}</small>
        </button>
      </nav>
      <nav class="spa-navgroup" aria-label="タグ">
        <p class="spa-navlabel">タグ</p>
        {tags()
          .slice(0, 7)
          .map((tag) => (
            <button
              key={tag.id}
              class={
                view() === "tag" && selectedTag() === tag.id ? "spa-navitem active" : "spa-navitem"
              }
              type="button"
              onClick={() => {
                onTag(tag.id);
              }}
            >
              <span>#{tag.name}</span>
              <small>{notes().filter((note) => note.tagIds.includes(tag.id)).length}</small>
            </button>
          ))}
        <button
          class={view() === "tags" ? "spa-navitem active" : "spa-navitem"}
          type="button"
          onClick={onManage}
        >
          <span>タグ管理</span>
          <small>›</small>
        </button>
      </nav>
      <div class="spa-navspacer"></div>
      <button class="spa-logout" type="button" onClick={onLogout}>
        ログアウト
      </button>
      <button class="spa-newnote" type="button" onClick={onNew}>
        新しいメモ
      </button>
    </aside>,
  );
}
