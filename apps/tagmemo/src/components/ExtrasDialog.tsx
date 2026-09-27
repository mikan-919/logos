import { render } from "irisout";
import { Icon } from "./Icon.tsx";

export function ExtrasDialog({
  extras,
  activeExtra,
  extraKey,
  extraValue,
  booleanFields,
  textFields,
  status,
  busy,
  onClose,
  onChoose,
  onField,
  onSave,
}) {
  render(
    <dialog id="components-dialog" class="components-dialog">
      <form class="editor-form" onSubmit={onSave}>
        <div class="dialog-head">
          <div>
            <p class="eyebrow">関連データ</p>
            <h2>Component</h2>
          </div>
          <button class="icon-button" type="button" aria-label="閉じる" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <label for="component-select">編集する Component</label>
        <select
          id="component-select"
          value={extraKey()}
          onChange={(event) => {
            onChoose(event.currentTarget.value);
          }}
        >
          {extras().map((item) => (
            <option key={item.type_key} value={item.type_key}>
              {item.type_key}
            </option>
          ))}
        </select>
        <div class="component-fields">
          {booleanFields().map((field) => (
            <label key={field.name} class="checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(extraValue()[field.name])}
                onChange={(event) => {
                  onField(field.name, event.currentTarget.checked);
                }}
              />
              <span>{field.name}</span>
            </label>
          ))}
          {textFields().map((field) => (
            <label key={field.name}>
              <span>{field.name}</span>
              <input
                type={field.type === "string" ? "text" : "number"}
                step={field.type === "integer" ? "1" : "any"}
                value={extraValue()[field.name] ?? ""}
                onInput={(event) => {
                  onField(
                    field.name,
                    field.type === "string"
                      ? event.currentTarget.value
                      : Number(event.currentTarget.value),
                  );
                }}
              />
            </label>
          ))}
        </div>
        <p class="status" role="alert">
          {status()}
        </p>
        <div class="dialog-actions">
          <span class="spacer"></span>
          <button class="primary" type="submit" disabled={busy() || !activeExtra()}>
            変更を保存
          </button>
        </div>
      </form>
    </dialog>,
  );
}
