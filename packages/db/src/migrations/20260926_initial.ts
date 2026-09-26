import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("entities")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("created_at", "text", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable("users")
    .addColumn("id", "text", (col) => col.primaryKey())
    .execute();

  await db.schema
    .createTable("permission_types")
    .addColumn("key", "text", (col) => col.primaryKey())
    .execute();
  await sql`INSERT INTO permission_types (key) VALUES ('read'), ('write'), ('manage')`.execute(db);

  await db.schema
    .createTable("entity_permissions")
    .addColumn("entity_id", "text", (col) =>
      col.notNull().references("entities.id").onDelete("cascade"),
    )
    .addColumn("user_id", "text", (col) => col.notNull().references("users.id").onDelete("cascade"))
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
    .addColumn("schema", "text", (col) => col.notNull())
    .addCheckConstraint(
      "component_types_schema_object",
      sql`json_valid(schema) AND json_type(schema) = 'object'`,
    )
    .execute();

  await db.schema
    .createTable("components")
    .addColumn("entity_id", "text", (col) =>
      col.notNull().references("entities.id").onDelete("cascade"),
    )
    .addColumn("type_key", "text", (col) => col.notNull().references("component_types.key"))
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("revision", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("updated_at", "text", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addPrimaryKeyConstraint("components_pk", ["entity_id", "type_key"])
    .addCheckConstraint(
      "components_value_object",
      sql`json_valid(value) AND json_type(value) = 'object'`,
    )
    .addCheckConstraint("components_revision_positive", sql`revision > 0`)
    .execute();
  await db.schema
    .createIndex("components_by_type")
    .on("components")
    .columns(["type_key", "entity_id"])
    .execute();

  await sql`CREATE TRIGGER components_refs_insert BEFORE INSERT ON components
    BEGIN SELECT RAISE(ABORT, 'missing entity reference') WHERE EXISTS (
      SELECT 1 FROM json_each(NEW.value, '$.entities') AS ref
      LEFT JOIN entities AS target ON target.id = ref.value WHERE target.id IS NULL
    ); END`.execute(db);
  await sql`CREATE TRIGGER components_refs_update BEFORE UPDATE OF value ON components
    BEGIN SELECT RAISE(ABORT, 'missing entity reference') WHERE EXISTS (
      SELECT 1 FROM json_each(NEW.value, '$.entities') AS ref
      LEFT JOIN entities AS target ON target.id = ref.value WHERE target.id IS NULL
    ); END`.execute(db);
  await sql`CREATE TRIGGER entities_referenced_delete BEFORE DELETE ON entities
    BEGIN SELECT RAISE(ABORT, 'entity is referenced') WHERE EXISTS (
      SELECT 1 FROM components AS component, json_each(component.value, '$.entities') AS ref
      WHERE component.entity_id <> OLD.id AND ref.value = OLD.id
    ); END`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("components").execute();
  await db.schema.dropTable("component_types").execute();
  await db.schema.dropTable("entity_permissions").execute();
  await db.schema.dropTable("permission_types").execute();
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("entities").execute();
}
