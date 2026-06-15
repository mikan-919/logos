<script lang="ts">
import Toolbar from "@logos/ui/Toolbar.svelte";
import "../app.css";

const NAV_ITEMS = [
	{ id: "rotax", label: "Tasks", icon: "◈", href: "/" },
	{ id: "velt", label: "Notes", icon: "◉", href: "http://localhost:5174" },
];

let { children } = $props();
</script>

<div class="app w-dvw h-dvh overflow-hidden">
  {@render children()}
  <!-- <Toolbar items={NAV_ITEMS} activeId="rotax" /> -->
</div>

<style>
</style>
