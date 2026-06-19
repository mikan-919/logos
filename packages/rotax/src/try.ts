import { createDb } from "@logos/core/src/db";
import { createWorld } from "@logos/core/src/world";
import { createRotax } from "./index";

const db = createDb("logos.db");
const world = createWorld(db);
const rotax = createRotax(world);

// create a couple tasks
rotax.createTask({ title: "Logosのコアを作る", description: "ECSワールドの最小実装" });
rotax.createTask({ title: "RotaxのUIを作る" });

// list
const tasks = rotax.listTasks();
console.log("Tasks:", tasks);

// complete first one
rotax.completeTask(tasks[0].entityId);
console.log("After complete:", rotax.listTasks());
