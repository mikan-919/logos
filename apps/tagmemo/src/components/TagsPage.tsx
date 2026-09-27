import { derived, render } from "irisout";

export function TagsPage({ tags, notes, query, onQuery, newTag, onNewTag, onCreate, onOpenTag }) {
  const visibleTags = derived(() =>
    tags().filter((tag) => tag.name.toLocaleLowerCase().includes(query().toLocaleLowerCase())),
  );
  render(
    <main class="spa-tags-page">
      <div class="spa-tags-inner">
        <header class="spa-tags-head">
          <div>
            <h1>タグ</h1>
            <p>タグの作成と使用状況を確認できます。</p>
          </div>
        </header>
        <div class="spa-tagstats">
          <div>
            <strong>{tags().length}</strong>
            <span>タグ</span>
          </div>
          <div>
            <strong>{notes().reduce((count, note) => count + note.tagIds.length, 0)}</strong>
            <span>設定数</span>
          </div>
          <div>
            <strong>{notes().length}</strong>
            <span>メモ</span>
          </div>
        </div>
        <form class="spa-tag-create" onSubmit={onCreate}>
          <label for="new-tag-name">新しいタグ</label>
          <input
            id="new-tag-name"
            maxlength="80"
            placeholder="タグ名"
            required
            value={newTag()}
            onInput={(event) => {
              onNewTag(event.currentTarget.value);
            }}
          />
          <button type="submit">＋ 作成</button>
        </form>
        <label class="spa-tag-search">
          <span>タグを検索</span>
          <input
            type="search"
            value={query()}
            onInput={(event) => {
              onQuery(event.currentTarget.value);
            }}
            placeholder="名前で検索"
          />
        </label>
        <div class="spa-tagtable">
          {visibleTags().map((tag) => (
            <button
              key={tag.id}
              class="spa-tagrow"
              type="button"
              onClick={() => {
                onOpenTag(tag.id);
              }}
            >
              <strong>#{tag.name}</strong>
              <span class="spa-usagebar">
                <span
                  style={`width:${Math.round((notes().filter((note) => note.tagIds.includes(tag.id)).length / Math.max(1, notes().length)) * 100)}%`}
                ></span>
              </span>
              <small>
                {notes().filter((note) => note.tagIds.includes(tag.id)).length} 件のメモ
              </small>
              <span>›</span>
            </button>
          ))}
          {visibleTags().length === 0 && <p class="spa-tags-empty">タグがありません</p>}
        </div>
      </div>
    </main>,
  );
}
