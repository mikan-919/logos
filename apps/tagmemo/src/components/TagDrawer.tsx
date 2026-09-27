import { render } from "irisout";

export function TagDrawer({ open, tags, draftTags, onClose, onToggleTag }) {
  render(
    <aside
      class={open() ? "spa-drawer open" : "spa-drawer"}
      aria-label="メモのタグ"
      aria-hidden={!open()}
    >
      <header>
        <strong>タグ</strong>
        <button type="button" onClick={onClose}>
          閉じる
        </button>
      </header>
      <div class="spa-drawer-body">
        <section class="spa-drawer-card">
          <h2>現在</h2>
          <p>このメモに付いているタグです。</p>
          {tags()
            .filter((tag) => draftTags().includes(tag.id))
            .map((tag) => (
              <div key={tag.id} class="spa-drawer-row">
                <span>#{tag.name}</span>
                <button
                  type="button"
                  aria-label={`${tag.name}を外す`}
                  onClick={() => {
                    onToggleTag(tag.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          {draftTags().length === 0 && <p>タグはありません。</p>}
        </section>
        <section class="spa-drawer-card">
          <h2>追加</h2>
          <p>既存のタグから選べます。</p>
          {tags()
            .filter((tag) => !draftTags().includes(tag.id))
            .map((tag) => (
              <div key={tag.id} class="spa-drawer-row">
                <span>#{tag.name}</span>
                <button
                  type="button"
                  aria-label={`${tag.name}を付ける`}
                  onClick={() => {
                    onToggleTag(tag.id);
                  }}
                >
                  ＋
                </button>
              </div>
            ))}
        </section>
      </div>
    </aside>,
  );
}
