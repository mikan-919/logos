// ---- Domain model ----------------------------------------------------------
// Single source of truth. A task carries its own `state`; scheduled tasks also
// have start/end hours on today's timeline, backlog tasks leave them null.
export type TaskState = "done" | "active" | "upcoming" | "backlog";

export type Task = {
	id: string;
	title: string;
	description: string;
	todos: string[];
	start: number | null; // hour 0–24 on the day timeline, null = backlog
	end: number | null;
	state: TaskState;
};

export function seedTasks(): Task[] {
	return [
		{
			id: "TASK-1A2B",
			title: "Setup repo",
			description: "Bootstrap the Bun monorepo and CI.",
			todos: [
				"Init Bun workspaces",
				"Biome + tsconfig presets",
				"GitHub Actions pipeline",
			],
			start: 7,
			end: 8.5,
			state: "done",
		},
		{
			id: "TASK-3C4D",
			title: "Schema draft",
			description: "Model the persistence layer for entities and components.",
			todos: [
				"Entity / Component tables",
				"Migration 0001",
				"Index hot query paths",
			],
			start: 8.5,
			end: 10,
			state: "done",
		},
		{
			id: "TASK-5E6F",
			title: "ECS core",
			description: "Land the archetype-based ECS runtime.",
			todos: ["Archetype storage", "System scheduler", "Benchmark 10k entities"],
			start: 10,
			end: 11,
			state: "done",
		},
		{
			id: "TASK-7G8H",
			title: "Router wiring",
			description: "Stand up the HTTP router and middleware stack.",
			todos: [
				"Mount route tree",
				"Error boundary middleware",
				"Structured request logging",
			],
			start: 11,
			end: 12,
			state: "done",
		},
		{
			id: "TASK-32F9",
			title: "Implement World API",
			description:
				"Expose the simulation world over HTTP so clients can query entities and submit commands.",
			todos: [
				"Define /world REST routes",
				"Wire ECS queries into handlers",
				"Cursor-based pagination",
				"Integration tests against seed data",
			],
			start: 16,
			end: 17,
			state: "upcoming",
		},
		{
			id: "TASK-A1B2",
			title: "Velt sync",
			description: "Stream world deltas to clients in real time.",
			todos: [
				"Open WebSocket channel",
				"Diff / patch protocol",
				"Reconnect with backoff",
			],
			start: 21,
			end: 22,
			state: "upcoming",
		},
		{
			id: "TASK-C3D4",
			title: "UI polish",
			description: "Tighten the dashboard before the demo.",
			todos: [
				"Timeline hover states",
				"Empty / loading states",
				"Keyboard shortcuts",
			],
			start: 22,
			end: 23,
			state: "upcoming",
		},
		{
			id: "TASK-E5F6",
			title: "Zestium hook",
			description: "Notify Zestium when a run completes.",
			todos: [
				"Register outbound webhook",
				"Sign payloads (HMAC)",
				"Retry queue on failure",
			],
			start: 23,
			end: 24,
			state: "upcoming",
		},
		{
			id: "TASK-RL01",
			title: "Rate-limit the public API",
			description: "Protect the public endpoints from abuse.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-CA02",
			title: "Cache world snapshots in Redis",
			description: "Serve hot reads from an in-memory snapshot.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-OA03",
			title: "Generate OpenAPI spec",
			description: "Publish a typed contract for API consumers.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-SD04",
			title: "Seed a demo dataset",
			description: "Ship a believable world for demos and tests.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-PL05",
			title: "Profile cold-start latency",
			description: "Find and shave the worst startup costs.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-RB06",
			title: "Write the deploy runbook",
			description: "Document how to ship and roll back.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
	];
}
