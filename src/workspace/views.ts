export interface WorkspaceViewDefinition {
  id: string;
  label: string;
  requires: string[];
  presentation: "list" | "calendar";
}

export const workspaceViews: WorkspaceViewDefinition[] = [
  { id: "tasks", label: "Tasks", requires: ["name", "task"], presentation: "list" },
  { id: "calendar", label: "Calendar", requires: ["name", "event"], presentation: "calendar" },
  { id: "notes", label: "Notes", requires: ["name", "note"], presentation: "list" },
  { id: "tagged-notes", label: "Tagged notes", requires: ["name", "note", "tag"], presentation: "list" },
  { id: "tags", label: "Tags", requires: ["name", "this-is-tag"], presentation: "list" },
];

export function workspaceView(id: string): WorkspaceViewDefinition | undefined {
  return workspaceViews.find((view) => view.id === id);
}
