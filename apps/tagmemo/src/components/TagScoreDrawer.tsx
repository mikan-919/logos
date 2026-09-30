import { derived, render } from "irisout";
import { createTag, loadData } from "../data.ts";
import { Icon } from "./Icon.tsx";

function TagScoreRow({ tag, onScore }) {
  render(
    <div key={tag.id} class="stream-tag-state-row">
      <div class="stream-tag-state-main">
        <div>
          <strong>#{tag.name}</strong>
          <span>{`${Math.round(tag.score * 100)}%`}</span>
        </div>
        <div class="stream-tag-confidence" style={`--p:${tag.score * 100}`}>
          <span></span>
        </div>
      </div>
      <div class="stream-tag-state-controls" role="group" aria-label={`${tag.name}の該当確率`}>
        <button
          class={tag.score === 0 ? "active" : ""}
          type="button"
          title="該当確率を0%にする（オフ）"
          aria-label={`${tag.name}をオフ`}
          onClick={() => onScore(tag, 0)}
        >
          <Icon name="x" />
        </button>
        <button
          class={tag.score === 1 ? "active" : ""}
          type="button"
          title="該当確率を100%にする（オン）"
          aria-label={`${tag.name}をオン`}
          onClick={() => onScore(tag, 1)}
        >
          <Icon name="check" />
        </button>
      </div>
    </div>,
  );
}

export function TagScoreDrawer({
  open,
  note,
  candidates,
  inferring,
  query,
  busy,
  selectedId,
  draftNew,
  onApplyData,
  onFail,
  onClose,
  onScore,
}) {
  const tagName = derived(() => query().trim().replace(/^#/, ""));
  const exactTag = derived(() =>
    candidates().find((tag) => tag.name.toLocaleLowerCase() === tagName().toLocaleLowerCase()),
  );
  const visibleTags = derived(() =>
    candidates().filter((tag) =>
      tag.name.toLocaleLowerCase().includes(tagName().toLocaleLowerCase()),
    ),
  );
  render(
    <div
      class="stream-tag-backdrop"
      data-hidden={!open()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        class={open() ? "stream-tag-drawer open" : "stream-tag-drawer"}
        aria-label="メモのタグ"
        aria-hidden={!open()}
      >
        <header>
          <strong>すべてのタグ</strong>
          <button type="button" aria-label="閉じる" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>
        <div class="stream-tag-drawer-body">
          <div class="stream-tag-state-card">
            <form
              class="stream-tag-search"
              onSubmit={(event) => {
                event.preventDefault();
                const name = tagName();
                if (!name || busy()) return;
                const existing = exactTag();
                if (existing) {
                  onScore(existing, 1);
                  query("");
                } else {
                  createTagForNote(name);
                }
              }}
            >
              <label for="tag-drawer-search">タグを検索・確率を設定</label>
              <div>
                <input
                  id="tag-drawer-search"
                  type="search"
                  maxlength="100"
                  autocomplete="off"
                  disabled={!note()}
                  value={query()}
                  onInput={(event) => query(event.currentTarget.value)}
                />
                <button type="submit" disabled={!note() || !tagName() || busy()}>
                  {exactTag() ? "100%にする" : "作成"}
                </button>
              </div>
            </form>
            <div class="stream-tag-state-head">
              <div>
                <h2>タグ</h2>
                <p>全タグの該当確率を表示します。50%以上をタグとして扱います。</p>
              </div>
              <small>0%　100%</small>
            </div>
            {visibleTags().map((tag) => (
              <TagScoreRow key={tag.id} tag={tag} onScore={onScore} />
            ))}
            <p class="stream-tag-empty" data-hidden={!inferring()}>
              タグを推定しています。
            </p>
            <p class="stream-tag-empty" data-hidden={Boolean(note())}>
              メモを選択してください。
            </p>
            <p
              class="stream-tag-empty"
              data-hidden={!note() || visibleTags().length !== 0 || Boolean(tagName())}
            >
              表示するタグはありません。
            </p>
            <p
              class="stream-tag-empty"
              data-hidden={!note() || !tagName() || visibleTags().length !== 0}
            >
              一致するタグはありません。作成すると該当確率を100%に設定します。
            </p>
          </div>
        </div>
      </aside>
    </div>,
  );

  function createTagForNote(name) {
    if (busy() || !note()) return;
    const selected = selectedId();
    const draft = draftNew();
    busy(true);
    createTag(name)
      .then((id) => loadData().then((data) => ({ id, data })))
      .then(({ id, data }) => {
        onApplyData(data);
        busy(false);
        if (selectedId() === selected && draftNew() === draft) onScore({ id, name, score: 1 }, 1);
        query("");
      })
      .catch((error) => onFail(error));
  }
}
