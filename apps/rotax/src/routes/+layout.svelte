<script lang="ts">
import TopToolbar from "$lib/components/TopToolbar.svelte";
import Toolbar from "@logos/ui/Toolbar.svelte";
import "../app.css";

const NAV_ITEMS = [
	{ id: "rotax", label: "Tasks", icon: "◈", href: "/" },
	{ id: "velt", label: "Notes", icon: "◉", href: "http://localhost:5174" },
];

let { children } = $props();
</script>

<div class="app">
    <TopToolbar />
  {@render children()}
  <Toolbar items={NAV_ITEMS} activeId="rotax" />
</div>

<style>
  .app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 56px;
  }
</style>
