import { render } from "irisout";
import { Icon } from "./Icon.tsx";

export function StreamDock({ onLibrary, onTags, onNew }) {
  render(
    <nav class="stream-dock" aria-label="操作">
      <button type="button" onClick={onLibrary}>
        ライブラリ
      </button>
      <button type="button" onClick={onTags}>
        タグ
      </button>
      <button class="stream-dock-new" type="button" aria-label="新しいメモ" onClick={onNew}>
        <Icon name="plus" />
      </button>
    </nav>,
  );
}
