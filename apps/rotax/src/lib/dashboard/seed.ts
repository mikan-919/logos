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
			title: "Morning workout",
			description: "Get moving before the day fills up.",
			todos: ["Stretch + warm up", "30 min run", "Cool down & shower"],
			start: 7,
			end: 8.5,
			state: "done",
		},
		{
			id: "TASK-3C4D",
			title: "Plan the day",
			description: "Sort out priorities over coffee.",
			todos: ["Review calendar", "Pick top 3 tasks", "Clear inbox to zero"],
			start: 8.5,
			end: 10,
			state: "done",
		},
		{
			id: "TASK-5E6F",
			title: "Grocery shopping",
			description: "Stock up for the week.",
			todos: ["Make a list", "Hit the market", "Restock pantry"],
			start: 10,
			end: 11,
			state: "done",
		},
		{
			id: "TASK-7G8H",
			title: "Pay the bills",
			description: "Clear the monthly payments.",
			todos: ["Electricity & water", "Credit card", "Update budget sheet"],
			start: 11,
			end: 12,
			state: "done",
		},
		{
			id: "TASK-32F9",
			title: "Finish the report",
			description: "Wrap up the quarterly summary and send it off.",
			todos: [
				"Pull the latest numbers",
				"Write the summary",
				"Proofread",
				"Email to the team",
			],
			start: 16,
			end: 17,
			state: "upcoming",
		},
		{
			id: "TASK-A1B2",
			title: "Call mom",
			description: "Catch up on the weekend plans.",
			todos: ["Ask about the trip", "Confirm dinner", "Share photos"],
			start: 21,
			end: 22,
			state: "upcoming",
		},
		{
			id: "TASK-C3D4",
			title: "Tidy the apartment",
			description: "Reset the space before the week ends.",
			todos: ["Vacuum", "Laundry", "Take out the trash"],
			start: 22,
			end: 23,
			state: "upcoming",
		},
		{
			id: "TASK-E5F6",
			title: "Read before bed",
			description: "Wind down with a few chapters.",
			todos: ["Pick up where I left off", "Read 20 pages", "Lights out"],
			start: 23,
			end: 24,
			state: "upcoming",
		},
		{
			id: "TASK-SL01",
			title: "Sleep",
			description: "Get enough rest.",
			todos: [],
			start: 24,
			end: 31, // 07:00 翌日
			state: "upcoming",
		},
		{
			id: "TASK-RL01",
			title: "Book a dentist appointment",
			description: "Overdue for a checkup.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-CA02",
			title: "Renew car insurance",
			description: "Compare quotes before it lapses.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-OA03",
			title: "Reply to emails",
			description: "Clear out the personal inbox.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-SD04",
			title: "Water the plants",
			description: "The ferns are looking thirsty.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-PL05",
			title: "Plan weekend trip",
			description: "Figure out where to go on Saturday.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
		{
			id: "TASK-RB06",
			title: "Fix the leaky faucet",
			description: "Grab a new washer and sort the bathroom sink.",
			todos: [],
			start: null,
			end: null,
			state: "backlog",
		},
	];
}
