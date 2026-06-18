// Domain model for the Logos entity inspector.
// An Entity is the thing-in-itself — identified only by an opaque id.
// Its appearances (Components) come from external services; Refs are dashed paths
// to other Entities; Provenance is the append-only origin-stamped record.

export type ComponentState = "done" | "active" | "upcoming" | "backlog";

export type Component = {
	id: string;
	service: string;       // e.g. "rotax", "velt", "github"
	kind: string;          // e.g. "Task", "Note", "Issue"
	title: string;
	meta: Array<{ key: string; value: string }>;
	state: ComponentState;
};

export type Ref = {
	id: string;
	toEntityId: string;
	toArchetype: string;
	label: string;         // e.g. "depends-on", "blocks", "related-to"
};

export type ProvenanceEntry = {
	ts: string;
	origin: string;
	event: string;
};

export type Entity = {
	id: string;
	archetype: string;     // e.g. "TASK", "PROJECT", "CONCEPT"
	components: Component[];
	refs: Ref[];
	provenance: ProvenanceEntry[];
};

export function seedEntities(): Entity[] {
	return [
		{
			id: "ENT-A1B2",
			archetype: "TASK",
			components: [
				{
					id: "CMP-001",
					service: "rotax",
					kind: "Task",
					title: "Finish the quarterly report",
					meta: [
						{ key: "start", value: "16:00" },
						{ key: "end", value: "17:00" },
						{ key: "state", value: "upcoming" },
					],
					state: "upcoming",
				},
				{
					id: "CMP-002",
					service: "velt",
					kind: "Note",
					title: "Q3 analysis notes — draft",
					meta: [
						{ key: "created", value: "2026-06-18" },
						{ key: "words", value: "1 240" },
					],
					state: "active",
				},
				{
					id: "CMP-003",
					service: "github",
					kind: "Issue",
					title: "Report data pipeline: fix NaN in revenue column",
					meta: [
						{ key: "repo", value: "analytics/pipeline" },
						{ key: "status", value: "closed" },
					],
					state: "done",
				},
			],
			refs: [
				{
					id: "REF-R1",
					toEntityId: "ENT-C3D4",
					toArchetype: "PROJECT",
					label: "part-of",
				},
				{
					id: "REF-R2",
					toEntityId: "ENT-E5F6",
					toArchetype: "PERSON",
					label: "assigned-to",
				},
				{
					id: "REF-R3",
					toEntityId: "ENT-G7H8",
					toArchetype: "TASK",
					label: "depends-on",
				},
			],
			provenance: [
				{
					ts: "2026-06-19T09:14:22Z",
					origin: "rotax",
					event: "component CMP-001 state → upcoming",
				},
				{
					ts: "2026-06-18T17:42:01Z",
					origin: "velt",
					event: "component CMP-002 created",
				},
				{
					ts: "2026-06-18T11:03:55Z",
					origin: "github",
					event: "component CMP-003 state → closed",
				},
				{
					ts: "2026-06-17T08:00:00Z",
					origin: "logos",
					event: "entity ENT-A1B2 grounded",
				},
			],
		},
		{
			id: "ENT-C3D4",
			archetype: "PROJECT",
			components: [
				{
					id: "CMP-010",
					service: "rotax",
					kind: "Task",
					title: "Plan the sprint",
					meta: [
						{ key: "state", value: "done" },
						{ key: "end", value: "09:30" },
					],
					state: "done",
				},
			],
			refs: [
				{
					id: "REF-P1",
					toEntityId: "ENT-A1B2",
					toArchetype: "TASK",
					label: "contains",
				},
			],
			provenance: [
				{
					ts: "2026-06-15T10:00:00Z",
					origin: "logos",
					event: "entity ENT-C3D4 grounded",
				},
			],
		},
		{
			id: "ENT-E5F6",
			archetype: "PERSON",
			components: [
				{
					id: "CMP-020",
					service: "velt",
					kind: "Note",
					title: "Stakeholder context — Yamamoto-san",
					meta: [{ key: "created", value: "2026-06-10" }],
					state: "backlog",
				},
			],
			refs: [],
			provenance: [
				{
					ts: "2026-06-10T09:00:00Z",
					origin: "logos",
					event: "entity ENT-E5F6 grounded",
				},
			],
		},
		{
			id: "ENT-G7H8",
			archetype: "TASK",
			components: [
				{
					id: "CMP-030",
					service: "rotax",
					kind: "Task",
					title: "Pull the latest data export",
					meta: [
						{ key: "state", value: "done" },
						{ key: "end", value: "15:00" },
					],
					state: "done",
				},
			],
			refs: [],
			provenance: [
				{
					ts: "2026-06-19T07:00:00Z",
					origin: "rotax",
					event: "component CMP-030 state → done",
				},
			],
		},
	];
}
