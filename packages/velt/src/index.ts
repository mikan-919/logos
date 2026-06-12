import type { World } from "@logos/core/src/world";
import type { Name } from "@logos/rotax/src/components";
import type { VeltNote } from "./components";

const ORIGIN = "velt";

export function createVelt(world: World) {
  function createNote(name: Name, note: VeltNote): string {
    const entityId = world.createEntity();
    world.setComponent(entityId, "Name", name, ORIGIN);
    world.setComponent(entityId, "VeltNote", note, ORIGIN);
    return entityId;
  }

  function listNotes(): Array<{ entityId: string; name: Name; note: VeltNote }> {
    const entityIds = world.query(["Name", "VeltNote"]);
    return entityIds.map((entityId) => {
      const comps = world.getComponents(entityId);
      const name = comps.find((c) => c.type === "Name")!.data as Name;
      const note = comps.find((c) => c.type === "VeltNote")!.data as VeltNote;
      return { entityId, name, note };
    });
  }

  return { createNote, listNotes };
}

export type Velt = ReturnType<typeof createVelt>;
