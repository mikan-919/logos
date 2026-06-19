// Archetype registry — open string system with progressive interpretation.
//
// An archetype is just a string. Any entity can carry any archetype value.
// "Interpretable" archetypes are registered here with display metadata;
// unknown archetypes fall back to UNKNOWN_ARCHETYPE and render generically.
// Add new entries to the registry as archetypes become well-understood.

export type ArchetypeEntry = {
	/** Display color (CSS value). Used for node, chip, and accent. */
	color: string;
	/** Short description shown as tooltip / accessible label. */
	description: string;
};

// Well-known archetypes. Extend this as new archetypes are understood.
export const ARCHETYPE_REGISTRY: Record<string, ArchetypeEntry> = {
	TASK: {
		color: "var(--accent)",       // #F1531F — the thing being worked on
		description: "A unit of work with a defined state and timeline.",
	},
	PERSON: {
		color: "var(--warning)",      // #B7791F — a human actor
		description: "A person referenced as assignee, author, or stakeholder.",
	},
	DOCUMENT: {
		color: "var(--positive)",     // #2E6F4E — a written artifact
		description: "A note, spec, report, or other written artifact.",
	},
};

// Fallback for any archetype not yet in the registry.
export const UNKNOWN_ARCHETYPE: ArchetypeEntry = {
	color: "var(--ink-300)",
	description: "An archetype not yet interpreted by this client.",
};

export function resolveArchetype(archetype: string): ArchetypeEntry {
	return ARCHETYPE_REGISTRY[archetype] ?? UNKNOWN_ARCHETYPE;
}

export function archetypeColor(archetype: string): string {
	return resolveArchetype(archetype).color;
}

export function isKnownArchetype(archetype: string): boolean {
	return archetype in ARCHETYPE_REGISTRY;
}
