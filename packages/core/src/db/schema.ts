import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const entities = sqliteTable("entities", {
	id: text("id").primaryKey(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const components = sqliteTable("components", {
	id: text("id").primaryKey(),
	entityId: text("entity_id")
		.notNull()
		.references(() => entities.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	data: text("data", { mode: "json" }).notNull(),
	origin: text("origin").notNull(), // "logos" | interface id
	authority: text("authority", { enum: ["external", "internal"] }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// append-only log of all component mutations
export const changeLog = sqliteTable("change_log", {
	id: text("id").primaryKey(),
	entityId: text("entity_id").notNull(),
	componentType: text("component_type").notNull(),
	op: text("op", { enum: ["create", "update", "delete"] }).notNull(),
	dataBefore: text("data_before", { mode: "json" }),
	dataAfter: text("data_after", { mode: "json" }),
	origin: text("origin").notNull(),
	at: integer("at", { mode: "timestamp" }).notNull(),
});
