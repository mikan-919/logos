import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Rotax } from "./index";

const nameSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

const statusSchema = z.enum(["todo", "in-progress", "done"]);

export function createRotaxRouter(rotax: Rotax) {
  const app = new Hono()
    .get("/tasks", (c) => {
      return c.json(rotax.listTasks());
    })
    .post("/tasks", zValidator("json", nameSchema), (c) => {
      const name = c.req.valid("json");
      const entityId = rotax.createTask(name);
      return c.json({ entityId }, 201);
    })
    .patch(
      "/tasks/:id/status",
      zValidator("json", z.object({ status: statusSchema })),
      (c) => {
        const { id } = c.req.param();
        const { status } = c.req.valid("json");
        rotax.setTaskStatus(id, status);
        return c.json({ ok: true });
      }
    )
    .patch(
      "/tasks/:id",
      zValidator("json", nameSchema.partial()),
      (c) => {
        const { id } = c.req.param();
        const patch = c.req.valid("json");
        rotax.updateTask(id, patch);
        return c.json({ ok: true });
      }
    )
    .delete("/tasks/:id", (c) => {
      const { id } = c.req.param();
      rotax.deleteTask(id);
      return c.json({ ok: true });
    })
    .patch(
      "/tasks/:id/schedule",
      zValidator("json", z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })),
      (c) => {
        const { id } = c.req.param();
        const { date } = c.req.valid("json");
        rotax.scheduleTask(id, date);
        return c.json({ ok: true });
      }
    )
    .delete("/tasks/:id/schedule", (c) => {
      const { id } = c.req.param();
      rotax.unscheduleTask(id);
      return c.json({ ok: true });
    });

  return app;
}

export type RotaxRouter = ReturnType<typeof createRotaxRouter>;
