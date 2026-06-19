<script lang="ts">
  interface NavItem {
    id: string;
    label: string;
    icon: string;
    href: string;
  }

  let { items, activeId }: { items: NavItem[]; activeId: string } = $props();
</script>

<nav class="toolbar">
  {#each items as item}
    <a
      href={item.href}
      class="toolbar-item"
      class:active={item.id === activeId}
      aria-current={item.id === activeId ? "page" : undefined}
    >
      <span class="toolbar-icon">{item.icon}</span>
      <span class="toolbar-label">{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--color-ink);
    border-top: 1px solid #1e1e1e;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    z-index: 100;
  }

  .toolbar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 20px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--color-fog);
    transition: color 0.15s, background 0.15s;
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .toolbar-item:hover {
    color: var(--color-haze);
    background: rgba(255, 255, 255, 0.05);
  }

  .toolbar-item.active {
    color: var(--color-prism);
  }

  .toolbar-icon {
    font-size: 18px;
    line-height: 1;
  }

  .toolbar-label {
    line-height: 1;
  }
</style>
