export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  entityId: string;
  name: { title: string; description?: string };
  task: { status: TaskStatus };
  schedule?: { date: string };
  createdAt?: string;
}

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

export type ViewMode = "kanban" | "timeline";
