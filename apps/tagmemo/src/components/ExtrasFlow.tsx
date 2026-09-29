import { render } from "irisout";
import { loadData, updateExtra } from "../data.ts";
import { ExtrasDialog } from "./ExtrasDialog.tsx";

export function ExtrasFlow({
  extras,
  activeExtra,
  extraKey,
  extraValue,
  booleanFields,
  textFields,
  selectedId,
  status,
  busy,
  onApplyData,
  onFail,
}) {
  render(
    <ExtrasDialog
      extras={extras}
      activeExtra={activeExtra}
      extraKey={extraKey}
      extraValue={extraValue}
      booleanFields={booleanFields}
      textFields={textFields}
      status={status}
      busy={busy}
      onClose={close}
      onChoose={choose}
      onField={setField}
      onSave={save}
    />,
  );

  function close() {
    (document.getElementById("components-dialog") as HTMLDialogElement)?.close();
  }

  function choose(key) {
    extraKey(key);
    extraValue({ ...extras().find((item) => item.type_key === key)?.value });
  }

  function setField(name, value) {
    extraValue((current) => ({ ...current, [name]: value }));
  }

  function save(event) {
    event.preventDefault();
    if (busy() || !activeExtra()) return;
    busy(true);
    updateExtra(selectedId(), activeExtra(), { ...extraValue() })
      .then(() => {
        close();
        loadData()
          .then((data) => {
            onApplyData(data);
            busy(false);
          })
          .catch(onFail);
      })
      .catch(onFail);
  }
}
