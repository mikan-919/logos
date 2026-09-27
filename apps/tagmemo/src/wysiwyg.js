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
]);

function clean(node) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
  if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
  const tag = allowedTags.has(node.tagName) ? node.tagName.toLowerCase() : "span";
  const element = document.createElement(tag);
  const classes = [...node.classList].filter((name) => allowedClasses.has(name));
  if (classes.length) element.className = classes.join(" ");
  if (tag === "button") element.type = "button";
  for (const child of node.childNodes) element.append(clean(child));
  return element;
}

function cleanHtml(html) {
  const source = new DOMParser().parseFromString(html, "text/html");
  const fragment = document.createDocumentFragment();
  for (const child of source.body.childNodes) fragment.append(clean(child));
  return fragment;
}

function summaryNode(label, detail) {
  const node = document.createElement("span");
  node.className = "summary-node open";
  const head = document.createElement("span");
  head.className = "summary-head";
  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.type = "button";
  toggle.textContent = "›";
  toggle.setAttribute("aria-label", "要約を閉じる");
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
  return node;
}

function flatten(fragment) {
  const result = document.createDocumentFragment();
  const visit = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result.append(document.createTextNode(node.textContent ?? ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.classList.contains("summary-node")) {
      result.append(clean(node));
      return;
    }
    const block = ["P", "DIV", "H1", "H2", "LI", "BLOCKQUOTE"].includes(node.tagName);
    if (block && result.childNodes.length) result.append(document.createTextNode(" "));
    if (["B", "STRONG", "I", "EM"].includes(node.tagName)) {
      const mark = document.createElement(node.tagName.toLowerCase());
      for (const child of node.childNodes) mark.append(clean(child));
      result.append(mark);
    } else {
      for (const child of node.childNodes) visit(child);
    }
  };
  for (const child of fragment.childNodes) visit(child);
  return result;
}

export function setupWysiwyg() {
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById("memo-dialog"));
  const root = dialog.querySelector(".wysiwyg-app");
  const doc = document.getElementById("memo-document");
  const menu = document.getElementById("selection-menu");
  const modal = document.getElementById("summary-modal");
  const input = /** @type {HTMLInputElement} */ (document.getElementById("summary-input"));
  const preview = document.getElementById("selection-preview");
  const crumb = document.getElementById("editor-crumb");
  let savedRange = null;

  function wire() {
    for (const node of doc.querySelectorAll(".summary-node")) {
      node.setAttribute("contenteditable", "false");
      node
        .querySelector(":scope > .summary-head > .summary-text")
        ?.setAttribute("contenteditable", "true");
      node
        .querySelector(":scope > .summary-detail > .summary-detail-clip > .summary-detail-inner")
        ?.setAttribute("contenteditable", "true");
      const toggle = node.querySelector(":scope > .summary-head > .toggle");
      toggle?.setAttribute("aria-expanded", String(node.classList.contains("open")));
      toggle?.setAttribute(
        "aria-label",
        node.classList.contains("open") ? "要約を閉じる" : "要約を開く",
      );
    }
  }

  function bodyNodes() {
    return [...doc.childNodes].filter(
      (node) => node !== document.getElementById("memo-document-title"),
    );
  }

  function selectionRange() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed || !selection.toString().trim())
      return null;
    const range = selection.getRangeAt(0);
    const title = document.getElementById("memo-document-title");
    if (!doc.contains(range.commonAncestorContainer) || range.intersectsNode(title)) return null;
    return range;
  }

  function showMenu() {
    if (!dialog.open || modal.classList.contains("show")) return menu.classList.remove("show");
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
    doc.focus();
  }

  function openSummary() {
    const range = selectionRange();
    if (!range) return;
    savedRange = range.cloneRange();
    preview.textContent = window.getSelection().toString().trim();
    input.value = "";
    menu.classList.remove("show");
    modal.classList.add("show");
    input.focus();
  }

  function createSummary() {
    const label = input.value.trim();
    if (!label || !savedRange) return;
    const range = savedRange;
    const node = summaryNode(label, flatten(range.extractContents()));
    range.insertNode(node);
    wire();
    const after = document.createRange();
    after.setStartAfter(node);
    after.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(after);
    closeSummary();
  }

  root.addEventListener("mousedown", (event) => {
    if (
      /** @type {Element} */ (event.target).closest(
        "[data-editor-command], [data-editor-action='summarize']",
      )
    )
      event.preventDefault();
  });
  root.addEventListener("click", (event) => {
    const target = /** @type {Element} */ (event.target);
    const toggle = target.closest(".summary-head > .toggle");
    if (toggle) {
      const node = toggle.closest(".summary-node");
      node.classList.toggle("open");
      wire();
      return;
    }
    const command = /** @type {HTMLElement} */ (target.closest("[data-editor-command]"))?.dataset
      .editorCommand;
    if (command) {
      document.execCommand(
        command.startsWith("h") ? "formatBlock" : command,
        false,
        command.startsWith("h") ? command : null,
      );
      doc.focus();
      return;
    }
    switch (
      /** @type {HTMLElement} */ (target.closest("[data-editor-action]"))?.dataset.editorAction
    ) {
      case "summarize":
        openSummary();
        break;
      case "create":
        createSummary();
        break;
      case "cancel":
        closeSummary();
        break;
      case "expand":
      case "collapse": {
        const open =
          /** @type {HTMLElement} */ (target.closest("[data-editor-action]")).dataset
            .editorAction === "expand";
        doc
          .querySelectorAll(".summary-node")
          .forEach((node) => node.classList.toggle("open", open));
        wire();
        break;
      }
    }
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
  doc.addEventListener("paste", (event) => {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
  });
  doc.addEventListener("dragover", (event) => event.preventDefault());
  doc.addEventListener("drop", (event) => event.preventDefault());
  doc.addEventListener("focusin", (event) => {
    const node = /** @type {Element} */ (event.target).closest(".summary-node");
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
  doc.addEventListener("focusout", () =>
    setTimeout(() => {
      if (!doc.contains(document.activeElement)) crumb.classList.remove("show");
    }, 0),
  );
  document.addEventListener("selectionchange", showMenu);
  document.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "m") {
      event.preventDefault();
      openSummary();
    }
    if (event.key === "Escape" && modal.classList.contains("show")) {
      event.preventDefault();
      closeSummary();
    }
  });

  return {
    set(title, text, html) {
      doc.replaceChildren();
      const heading = document.createElement("h1");
      heading.id = "memo-document-title";
      heading.textContent = title;
      doc.append(heading);
      if (html) doc.append(cleanHtml(html));
      else
        for (const line of (text || "").split("\n")) {
          const p = document.createElement("p");
          p.textContent = line;
          doc.append(p);
        }
      wire();
      menu.classList.remove("show");
      modal.classList.remove("show");
      savedRange = null;
    },
    get() {
      const heading = document.getElementById("memo-document-title");
      const fragment = document.createElement("div");
      for (const node of bodyNodes()) fragment.append(clean(node));
      const plain = /** @type {HTMLElement} */ (fragment.cloneNode(true));
      for (const node of [...plain.querySelectorAll(".summary-node")].reverse()) {
        const detail = node.querySelector(
          ":scope > .summary-detail > .summary-detail-clip > .summary-detail-inner",
        );
        node.replaceWith(...(detail ? [...detail.childNodes] : []));
      }
      return {
        title: heading.textContent.trim(),
        text: [...plain.childNodes]
          .map((node) => node.textContent)
          .join("\n")
          .trim(),
        html: fragment.innerHTML,
      };
    },
  };
}
