import { createSummaryNode, styleSummaryNode } from "./components/SummaryNode.tsx";

const allowedTags = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "B",
  "STRONG",
  "I",
  "EM",
  "BR",
  "SPAN",
  "BUTTON",
]);
const allowedClasses = new Set([
  "summary-node",
  "summary-head",
  "toggle",
  "summary-text",
  "summary-meta",
  "summary-detail",
  "summary-detail-clip",
  "summary-detail-inner",
  "open",
]);

function clean(node) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
  if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
  const tag = allowedTags.has(node.tagName) ? node.tagName.toLowerCase() : "span";
  const element = document.createElement(tag);
  const classes = [...node.classList].filter((name) => allowedClasses.has(name));
  if (classes.length) element.className = classes.join(" ");
  if (tag === "button") element.type = "button";
  if (tag === "button" && classes.includes("toggle")) return element;
  for (const child of node.childNodes) element.append(clean(child));
  return element;
}

function cleanHtml(html) {
  const source = new DOMParser().parseFromString(html, "text/html");
  const fragment = document.createDocumentFragment();
  for (const child of source.body.childNodes) fragment.append(clean(child));
  return fragment;
}

function flatten(fragment) {
  const result = document.createDocumentFragment();
  const visit = (node) => {
    if (node.nodeType === Node.TEXT_NODE)
      return result.append(document.createTextNode(node.textContent ?? ""));
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.classList.contains("summary-node")) return result.append(clean(node));
    if (["P", "DIV", "H1", "H2", "LI"].includes(node.tagName) && result.childNodes.length)
      result.append(document.createTextNode(" "));
    if (["B", "STRONG", "I", "EM"].includes(node.tagName)) {
      const mark = document.createElement(node.tagName.toLowerCase());
      for (const child of node.childNodes) mark.append(clean(child));
      result.append(mark);
    } else for (const child of node.childNodes) visit(child);
  };
  for (const child of fragment.childNodes) visit(child);
  return result;
}

function wireSummaryNodes(root) {
  for (const node of root.querySelectorAll(".summary-node")) styleSummaryNode(node);
}

export function setupWysiwyg() {
  const root = document.getElementById("scroll-root") as HTMLElement;
  const menu = document.getElementById("selection-menu") as HTMLElement;
  const modal = document.getElementById("summary-modal") as HTMLElement;
  const input = document.getElementById("summary-input") as HTMLInputElement;
  const preview = document.getElementById("selection-preview") as HTMLElement;
  const crumb = document.getElementById("editor-crumb") as HTMLElement;
  let savedRange = null;
  let selectedDoc = null;
  const activeDoc = () =>
    root.querySelector(".stream-note.active .stream-doc") as HTMLElement | null;
  const activeTitle = () =>
    root.querySelector(".stream-note.active .stream-title") as HTMLInputElement | null;

  function selectionRange() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed || !selection.toString().trim())
      return null;
    const range = selection.getRangeAt(0);
    const origin =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    const doc = origin?.closest(".stream-doc");
    if (!doc) return null;
    selectedDoc = doc;
    return range;
  }
  function showMenu() {
    if (modal.classList.contains("show")) return menu.classList.remove("show");
    const range = selectionRange();
    if (!range) return menu.classList.remove("show");
    const rect = range.getBoundingClientRect();
    menu.style.left =
      Math.max(8, Math.min(window.innerWidth - 180, rect.left + rect.width / 2 - 80)) + "px";
    menu.style.top = Math.max(8, rect.top - 46) + "px";
    menu.classList.add("show");
  }
  function closeSummary() {
    modal.classList.remove("show");
    savedRange = null;
    selectedDoc?.focus();
  }
  function openSummary() {
    const range = selectionRange();
    if (!range) return;
    savedRange = range.cloneRange();
    preview.textContent = window.getSelection()?.toString().trim() ?? "";
    input.value = "";
    menu.classList.remove("show");
    modal.classList.add("show");
    input.focus();
  }
  function createSummary() {
    const label = input.value.trim();
    if (!label || !savedRange || !selectedDoc) return;
    const range = savedRange;
    const node = createSummaryNode(label, flatten(range.extractContents()));
    range.insertNode(node);
    wireSummaryNodes(selectedDoc);
    closeSummary();
    selectedDoc.dispatchEvent(new Event("input", { bubbles: true }));
  }
  root.addEventListener("mousedown", (event) => {
    if (
      (event.target as Element).closest("[data-editor-command], [data-editor-action='summarize']")
    )
      event.preventDefault();
  });
  root.addEventListener("click", (event) => {
    const target = event.target as Element;
    const toggle = target.closest(".summary-head > .toggle");
    if (toggle) {
      const node = toggle.closest(".summary-node");
      node?.classList.toggle("open");
      wireSummaryNodes(root);
      node?.closest(".stream-doc")?.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    const command = (target.closest("[data-editor-command]") as HTMLElement)?.dataset.editorCommand;
    if (command) {
      document.execCommand(command, false);
      selectedDoc?.focus();
      return;
    }
    switch ((target.closest("[data-editor-action]") as HTMLElement)?.dataset.editorAction) {
      case "summarize":
        openSummary();
        break;
      case "create":
        createSummary();
        break;
      case "cancel":
        closeSummary();
        break;
    }
  });
  root.addEventListener("paste", (event) => {
    if (!(event.target as Element).closest(".stream-doc")) return;
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData?.getData("text/plain") ?? "");
  });
  root.addEventListener("dragover", (event) => {
    if ((event.target as Element).closest(".stream-doc")) event.preventDefault();
  });
  root.addEventListener("drop", (event) => {
    if ((event.target as Element).closest(".stream-doc")) event.preventDefault();
  });
  root.addEventListener("focusin", (event) => {
    const node = (event.target as Element).closest(".summary-node");
    if (!node) return crumb.classList.remove("show");
    let depth = 1;
    for (
      let parent = node.parentElement?.closest(".summary-node");
      parent;
      parent = parent.parentElement?.closest(".summary-node")
    )
      depth++;
    crumb.textContent = `深さ ${depth}`;
    crumb.classList.add("show");
  });
  document.addEventListener("selectionchange", showMenu);
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "m") {
      event.preventDefault();
      openSummary();
    }
    if (event.key === "Escape" && modal.classList.contains("show")) closeSummary();
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeSummary();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      createSummary();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeSummary();
    }
  });

  function set(note) {
    const doc = activeDoc();
    if (!doc) return;
    const title = activeTitle();
    if (title) title.value = note?.title ?? "";
    doc.replaceChildren();
    if (note?.bodyHtml) doc.append(cleanHtml(note.bodyHtml));
    else if (note?.body)
      for (const line of note.body.split("\n")) {
        const p = document.createElement("p");
        p.textContent = line;
        doc.append(p);
      }
    wireSummaryNodes(doc);
    doc.dataset.hydrated = "true";
    menu.classList.remove("show");
    modal.classList.remove("show");
    savedRange = null;
  }
  function sync(notes) {
    for (const note of notes) {
      const doc = [...root.querySelectorAll(".stream-doc")].find(
        (element) => element.getAttribute("data-doc-id") === (note.id || "draft"),
      );
      if (!doc || (doc as HTMLElement).dataset.hydrated) continue;
      doc.replaceChildren();
      if (note.bodyHtml) doc.append(cleanHtml(note.bodyHtml));
      else if (note.body)
        for (const line of note.body.split("\n")) {
          const p = document.createElement("p");
          p.textContent = line;
          doc.append(p);
        }
      wireSummaryNodes(doc);
      (doc as HTMLElement).dataset.hydrated = "true";
    }
  }
  function get() {
    const doc = activeDoc();
    if (!doc) return { title: "", text: "", html: "" };
    const fragment = document.createElement("div");
    for (const node of doc.childNodes) fragment.append(clean(node));
    const plain = fragment.cloneNode(true) as HTMLElement;
    for (const node of [...plain.querySelectorAll(".summary-node")].reverse()) {
      const detail = node.querySelector(
        ":scope > .summary-detail > .summary-detail-clip > .summary-detail-inner",
      );
      node.replaceWith(...(detail ? [...detail.childNodes] : []));
    }
    return {
      title: activeTitle()?.value.trim() ?? "",
      text: [...plain.childNodes]
        .map((node) => node.textContent)
        .join("\n")
        .trim(),
      html: fragment.innerHTML,
    };
  }
  return { set, sync, get, openSummary };
}
