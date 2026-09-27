import { createChevronRightIcon } from "./Icon.tsx";

// 構造用クラスだけ保存し、表示用クラスは読み込み時に付け直す。
// 開閉時の見た目は openNodeClass、openHeadClass、矢印の rotate-90 で調整する。
const nodeClass = "summary-node relative inline align-baseline";
const openNodeClass =
  "open rounded-[13px] border border-[#3a3a3a] bg-[#1b1b1b] box-decoration-slice";
const headClass =
  "summary-head inline-flex max-w-full items-baseline gap-[5px] rounded-lg border border-[#2d2d2d] bg-[var(--raised)] align-baseline leading-[1.5]";
const openHeadClass = "mr-[5px] border-[#3b3b3b] bg-[#282828]";
const toggleClass =
  "toggle inline-grid size-[18px] shrink-0 place-items-center rounded-md bg-[#2c2c2c] p-0 text-[11px]! text-[var(--muted)]! transition-colors duration-[180ms] hover:bg-[#333] hover:text-[var(--text)]!";
const chevronClass =
  "block size-3 origin-center transition-transform duration-[250ms] ease-[var(--ease)]";
const textClass =
  "summary-text rounded-[5px] p-0 font-[650] whitespace-normal outline-none focus:bg-[#292929]";
const innerClass =
  "summary-detail-inner inline bg-transparent text-[#d8d8d3] outline-none focus:rounded-[5px] focus:bg-white/[0.025]";

export function styleSummaryNode(node: Element) {
  const open = node.classList.contains("open");
  node.setAttribute("class", `${nodeClass}${open ? ` ${openNodeClass}` : ""}`);
  node.setAttribute("contenteditable", "false");

  const head = node.querySelector(":scope > .summary-head");
  head?.setAttribute("class", `${headClass}${open ? ` ${openHeadClass}` : ""}`);

  const toggle = node.querySelector(":scope > .summary-head > .toggle");
  toggle?.setAttribute("class", toggleClass);
  toggle?.setAttribute("aria-expanded", String(open));
  toggle?.setAttribute("aria-label", open ? "要約を閉じる" : "要約を開く");
  if (toggle) {
    const chevron = createChevronRightIcon();
    chevron.setAttribute("class", `${chevronClass}${open ? " rotate-90" : ""}`);
    toggle.replaceChildren(chevron);
  }

  const text = node.querySelector(":scope > .summary-head > .summary-text");
  text?.setAttribute("class", textClass);
  text?.setAttribute("contenteditable", "true");
  node
    .querySelector(":scope > .summary-head > .summary-meta")
    ?.setAttribute("class", "summary-meta hidden");
  node
    .querySelector(":scope > .summary-detail")
    ?.setAttribute("class", `summary-detail ${open ? "inline" : "hidden"}`);
  node
    .querySelector(":scope > .summary-detail > .summary-detail-clip")
    ?.setAttribute("class", "summary-detail-clip inline");
  const inner = node.querySelector(
    ":scope > .summary-detail > .summary-detail-clip > .summary-detail-inner",
  );
  inner?.setAttribute("class", innerClass);
  inner?.setAttribute("contenteditable", "true");
}

export function createSummaryNode(label: string, detail: DocumentFragment) {
  const node = document.createElement("span");
  node.className = "summary-node open";
  const head = document.createElement("span");
  head.className = "summary-head";
  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.type = "button";
  const text = document.createElement("span");
  text.className = "summary-text";
  text.textContent = label;
  const meta = document.createElement("span");
  meta.className = "summary-meta";
  meta.textContent = "summary";
  head.append(toggle, text, meta);
  const body = document.createElement("span");
  body.className = "summary-detail";
  const clip = document.createElement("span");
  clip.className = "summary-detail-clip";
  const inner = document.createElement("span");
  inner.className = "summary-detail-inner";
  inner.append(detail);
  clip.append(inner);
  body.append(clip);
  node.append(head, body);
  styleSummaryNode(node);
  return node;
}
