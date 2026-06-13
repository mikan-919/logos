import { j as ensure_array_like, k as attr, l as attr_class, m as escape_html } from './index-DROUJSNW.js';

function TopToolbar($$renderer) {
  $$renderer.push(`<div class="absolute left-1/2 transform -translate-x-1/2"><div class="flex items-center w-60 bg-ash rounded-full border-2 border-red-500 h-12"></div></div>`);
}
function Toolbar($$renderer, $$props) {
  let { items, activeId } = $$props;
  $$renderer.push(`<nav class="toolbar svelte-1eswefp"><!--[-->`);
  const each_array = ensure_array_like(items);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let item = each_array[$$index];
    $$renderer.push(`<a${attr("href", item.href)}${attr_class("toolbar-item svelte-1eswefp", void 0, { "active": item.id === activeId })}${attr("aria-current", item.id === activeId ? "page" : void 0)}><span class="toolbar-icon svelte-1eswefp">${escape_html(item.icon)}</span> <span class="toolbar-label svelte-1eswefp">${escape_html(item.label)}</span></a>`);
  }
  $$renderer.push(`<!--]--></nav>`);
}
function _layout($$renderer, $$props) {
  const NAV_ITEMS = [
    { id: "rotax", label: "Tasks", icon: "◈", href: "/" },
    {
      id: "velt",
      label: "Notes",
      icon: "◉",
      href: "http://localhost:5174"
    }
  ];
  let { children } = $$props;
  $$renderer.push(`<div class="app svelte-12qhfyh">`);
  TopToolbar($$renderer);
  $$renderer.push(`<!----> `);
  children($$renderer);
  $$renderer.push(`<!----> `);
  Toolbar($$renderer, { items: NAV_ITEMS, activeId: "rotax" });
  $$renderer.push(`<!----></div>`);
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-Bjhr9LnN.js.map
