import type { World } from "@logos/core/src/world";
import type { Name, Task, Schedule } from "./components";

const ORIGIN = "rotax";

export function createRotax(world: World) {
  function createTask(name: Name): string {
    const entityId = world.createEntity();
    world.setComponent(entityId, "Name", name, ORIGIN);
    world.setComponent(entityId, "Task", { status: "todo" } satisfies Task, ORIGIN);
    return entityId;
  }

  function listTasks(): Array<{ entityId: string; name: Name; task: Task; schedule?: Schedule }> {
    const entityIds = world.query(["Name", "Task"]);
    return entityIds.map((entityId) => {
      const comps = world.getComponents(entityId);
      const name = comps.find((c) => c.type === "Name")!.data as Name;
      const task = comps.find((c) => c.type === "Task")!.data as Task;
      const scheduleComp = comps.find((c) => c.type === "Schedule");
      const schedule = scheduleComp ? (scheduleComp.data as Schedule) : undefined;
      return { entityId, name, task, schedule };
    });
  }

  function scheduleTask(entityId: string, date: string): void {
    world.setComponent(entityId, "Schedule", { date } satisfies Schedule, ORIGIN);
    // auto-derive status from date
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const status: Task["status"] = date < today ? "done" : date === today ? "in-progress" : "todo";
    world.setComponent(entityId, "Task", { status } satisfies Task, ORIGIN);
  }

  function unscheduleTask(entityId: string): void {
    world.removeComponent(entityId, "Schedule", ORIGIN);
  }

  function startTask(entityId: string): void {
    world.setComponent(entityId, "Task", { status: "in-progress" } satisfies Task, ORIGIN);
  }

  function completeTask(entityId: string): void {
    world.setComponent(entityId, "Task", { status: "done" } satisfies Task, ORIGIN);
  }

  function reopenTask(entityId: string): void {
    world.setComponent(entityId, "Task", { status: "todo" } satisfies Task, ORIGIN);
  }

  function setTaskStatus(entityId: string, status: Task["status"]): void {
    world.setComponent(entityId, "Task", { status } satisfies Task, ORIGIN);
  }

  function deleteTask(entityId: string): void {
    world.removeComponent(entityId, "Task", ORIGIN);
    world.removeComponent(entityId, "Name", ORIGIN);
  }

  function updateTask(entityId: string, name: Partial<Name>): void {
    const comps = world.getComponents(entityId);
    const existing = comps.find((c) => c.type === "Name")!.data as Name;
    world.setComponent(entityId, "Name", { ...existing, ...name }, ORIGIN);
  }

  return { createTask, listTasks, startTask, completeTask, reopenTask, setTaskStatus, deleteTask, updateTask, scheduleTask, unscheduleTask };
}

export type Rotax = ReturnType<typeof createRotax>;
