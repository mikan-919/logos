import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("entities")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .execute();

  await db.schema
    .createTable("permission_types")
    .addColumn("key", "text", (col) => col.primaryKey())
    .execute();

  await sql`INSERT INTO permission_types (key) VALUES ('read'), ('write'), ('manage')`.execute(db);

  await db.schema
    .createTable("entity_permissions")
    .addColumn("entity_id", "uuid", (col) =>
      col.notNull().references("entities.id").onDelete("cascade"),
    )
    .addColumn("user_id", "uuid", (col) => col.notNull().references("users.id").onDelete("cascade"))
    .addColumn("permission_key", "text", (col) => col.notNull().references("permission_types.key"))
    .addPrimaryKeyConstraint("entity_permissions_pk", ["entity_id", "user_id", "permission_key"])
    .execute();

  await db.schema
    .createIndex("entity_permissions_by_user")
    .on("entity_permissions")
    .columns(["user_id", "permission_key", "entity_id"])
    .execute();

  await db.schema
    .createTable("component_types")
    .addColumn("key", "text", (col) => col.primaryKey())
    .addColumn("owner_app", "text", (col) => col.notNull())
    .addColumn("schema", "jsonb", (col) => col.notNull())
    .addCheckConstraint("component_types_schema_object", sql`jsonb_typeof("schema") = 'object'`)
    .execute();

  await db.schema
    .createTable("components")
    .addColumn("entity_id", "uuid", (col) =>
      col.notNull().references("entities.id").onDelete("cascade"),
    )
    .addColumn("type_key", "text", (col) => col.notNull().references("component_types.key"))
    .addColumn("value", "jsonb", (col) => col.notNull())
    .addColumn("revision", "bigint", (col) => col.notNull().defaultTo(1))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint("components_pk", ["entity_id", "type_key"])
    .addCheckConstraint("components_value_object", sql`jsonb_typeof("value") = 'object'`)
    .addCheckConstraint("components_revision_positive", sql`revision > 0`)
    .execute();

  await db.schema
    .createIndex("components_by_type")
    .on("components")
    .columns(["type_key", "entity_id"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("components").execute();
  await db.schema.dropTable("component_types").execute();
  await db.schema.dropTable("entity_permissions").execute();
  await db.schema.dropTable("permission_types").execute();
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("entities").execute();
}
