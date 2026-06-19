import { seedEntities, type Entity, type Component, type Ref } from "./seed";
export { archetypeColor, resolveArchetype, isKnownArchetype } from "./archetypes";

// Derived ref with direction context — used in RefsPanel
export type DirectedRef = Ref & {
	direction: "outgoing" | "incoming";
	fromEntityId: string;
	fromArchetype: string;
};

// Rotax only shows entities that have at least one rotax Task component.
function hasRotaxTask(e: Entity): boolean {
	return e.components.some((c) => c.service === "rotax" && c.kind === "Task");
}

class EntityState {
	// All entities from the store, pre-filtered to rotax Task scope.
	entities = $state<Entity[]>(seedEntities().filter(hasRotaxTask));
	focusedId = $state<string>("");
	query = $state("");
	serviceFilter = $state<string>("all");

	// Auto-focus: prefer entity with an active component, then first match
	_init = (() => {
		const active = this.entities.find((e) =>
			e.components.some((c) => c.state === "active"),
		);
		this.focusedId = active?.id ?? this.entities[0]?.id ?? "";
	})();

	focused = $derived(
		this.entities.find((e) => e.id === this.focusedId) ?? this.entities[0],
	);

	filteredComponents = $derived.by(() => {
		const e = this.focused;
		if (!e) return [];
		if (this.serviceFilter === "all") return e.components;
		return e.components.filter((c) => c.service === this.serviceFilter);
	});

	// All unique services across the focused entity's components
	availableServices = $derived.by(() => {
		const e = this.focused;
		if (!e) return [];
		return [...new Set(e.components.map((c) => c.service))].sort();
	});

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

	hasActiveComponent = (e: Entity) =>
		e.components.some((c) => c.state === "active");

	// Directed refs: outgoing from focused + incoming from all others
	directedRefs = $derived.by((): DirectedRef[] => {
		const f = this.focused;
		if (!f) return [];

		const out: DirectedRef[] = f.refs.map((r) => ({
			...r,
			direction: "outgoing" as const,
			fromEntityId: f.id,
			fromArchetype: f.archetype,
		}));

		const inc: DirectedRef[] = [];
		for (const e of this.entities) {
			if (e.id === f.id) continue;
			for (const r of e.refs) {
				if (r.toEntityId === f.id) {
					inc.push({
						...r,
						direction: "incoming" as const,
						fromEntityId: e.id,
						fromArchetype: e.archetype,
						toEntityId: f.id,
						toArchetype: f.archetype,
					});
				}
			}
		}

		return [...out, ...inc];
	});

	focus = (id: string) => {
		this.focusedId = id;
		// reset service filter when switching entity
		this.serviceFilter = "all";
	};
}

export const entity = new EntityState();
