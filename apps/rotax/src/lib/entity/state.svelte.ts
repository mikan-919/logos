import { seedEntities, type Entity, type Component } from "./seed";

class EntityState {
	entities = $state<Entity[]>(seedEntities());
	focusedId = $state<string>(seedEntities()[0].id);
	query = $state("");
	world = $state<"all" | "rotax" | "velt" | "github">("all");

	focused = $derived(
		this.entities.find((e) => e.id === this.focusedId) ?? this.entities[0],
	);

	filteredComponents = $derived.by(() => {
		const e = this.focused;
		if (!e) return [];
		if (this.world === "all") return e.components;
		return e.components.filter((c) => c.service === this.world);
	});

	// Archetype filter on entities
	archetypes = $derived(
		[...new Set(this.entities.map((e) => e.archetype))].sort(),
	);

	matchedEntities = $derived.by(() => {
		const q = this.query.trim().toLowerCase();
		if (!q) return this.entities;
		return this.entities.filter(
			(e) =>
				e.id.toLowerCase().includes(q) ||
				e.archetype.toLowerCase().includes(q) ||
				e.components.some((c) => c.title.toLowerCase().includes(q)),
		);
	});

	focus = (id: string) => {
		this.focusedId = id;
	};
}

export const entity = new EntityState();
