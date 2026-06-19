import { createDb } from "@logos/core/src/db";
import { createWorld } from "@logos/core/src/world";
import { createRotax } from "./index";
import { createVelt } from "@logos/velt/src/index";

const db = createDb(":memory:");
const world = createWorld(db);
const rotax = createRotax(world);
const velt = createVelt(world);

// タスクとノートを別々に作る
const taskId = rotax.createTask({ title: "Logosのコアを作る" });
// ノートはNameなしで作る（タスク側のNameに接地させるため）
const noteId = world.createEntity();
world.setComponent(noteId, "VeltNote", { content: "ECSワールドの最小実装。EntityとComponentだけでいい。" }, "velt");

console.log("Before merge:");
console.log("Task entity components:", world.getComponents(taskId));
console.log("Note entity components:", world.getComponents(noteId));

// 「このタスクとこのノートは同じ概念だ」と宣言する
world.merge(taskId, noteId, "logos");

console.log("\nAfter merge (taskId now holds both):");
console.log(world.getComponents(taskId));

// タスク一覧にVeltNoteが見える
const tasks = rotax.listTasks();
for (const t of tasks) {
  const comps = world.getComponents(t.entityId);
  const note = comps.find((c) => c.type === "VeltNote");
  console.log(`\n[${t.task.status}] ${t.name.title}`);
  if (note) console.log("  → Note:", (note.data as any).content);
}
