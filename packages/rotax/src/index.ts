import type { World } from "@logos/core/src/world";
import type { Name, Task } from "./components";

const ORIGIN = "rotax";

export function createRotax(world: World) {
  function createTask(name: Name): string {
    const entityId = world.createEntity();
    world.setComponent(entityId, "Name", name, ORIGIN);
    world.setComponent(entityId, "Task", { status: "todo" } satisfies Task, ORIGIN);
    return entityId;
  }

  function listTasks(): Array<{ entityId: string; name: Name; task: Task }> {
    const entityIds = world.query(["Name", "Task"]);
    return entityIds.map((entityId) => {
      const comps = world.getComponents(entityId);
      const name = comps.find((c) => c.type === "Name")!.data as Name;
      const task = comps.find((c) => c.type === "Task")!.data as Task;
      return { entityId, name, task };
    });
  }

  function completeTask(entityId: string): void {
    world.setComponent(entityId, "Task", { status: "done" } satisfies Task, ORIGIN);
  }

  function reopenTask(entityId: string): void {
    world.setComponent(entityId, "Task", { status: "todo" } satisfies Task, ORIGIN);
  }

  return { createTask, listTasks, completeTask, reopenTask };
}

export type Rotax = ReturnType<typeof createRotax>;
