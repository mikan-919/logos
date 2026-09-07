import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { RevisionConflictError } from "./errors";
import type {
  WorkspaceComponent,
  WorkspaceEntity,
  WorkspaceEntityView,
  WorkspaceEvent,
  WorkspaceRelation,
} from "./types";

interface EntityRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  revision: number;
  archived_at: string | null;
}

interface ComponentRow {
  entity_id: string;
  type_id: string;
  schema_version: number;
  data_json: string;
  active: number;
  created_at: string;
  updated_at: string;
  disabled_at: string | null;
}

interface EventRow {
  id: string;
  schema_version: 1;
  operation_id: string;
  entity_id: string;
  command: WorkspaceEvent["command"];
  before_revision: number;
  after_revision: number;
  changes_json: string;
  actor: string;
  at: string;
}

interface RelationRow {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  type: "references";
  active: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_operation_id: string;
  removed_at: string | null;
}

function entityFromRow(row: EntityRow): WorkspaceEntity {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revision: row.revision,
    ...(row.archived_at ? { archivedAt: row.archived_at } : {}),
  };
}

function componentFromRow(row: ComponentRow): WorkspaceComponent {
  return {
    entityId: row.entity_id,
    typeId: row.type_id,
    schemaVersion: row.schema_version,
    data: JSON.parse(row.data_json) as unknown,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.disabled_at ? { disabledAt: row.disabled_at } : {}),
  };
}

function eventFromRow(row: EventRow): WorkspaceEvent {
  return {
    id: row.id,
    schemaVersion: row.schema_version,
    operationId: row.operation_id,
    entityId: row.entity_id,
    command: row.command,
    beforeRevision: row.before_revision,
    afterRevision: row.after_revision,
    changes: JSON.parse(row.changes_json) as Record<string, unknown>,
    actor: row.actor,
    at: row.at,
  };
}

function relationFromRow(row: RelationRow): WorkspaceRelation {
  return {
    id: row.id,
    fromEntityId: row.from_entity_id,
    toEntityId: row.to_entity_id,
    type: row.type,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    createdOperationId: row.created_operation_id,
    ...(row.removed_at ? { removedAt: row.removed_at } : {}),
  };
}

export class WorkspaceStore {
  readonly path: string;

  private constructor(private readonly database: Database, path: string) {
    this.path = path;
  }

  static async open(workspace: string): Promise<WorkspaceStore> {
    const path = join(workspace, ".logos-workspace", "workspace.sqlite");
    await mkdir(dirname(path), { recursive: true });
    const database = new Database(path, { create: true, strict: true });
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("PRAGMA journal_mode = WAL");
    database.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        revision INTEGER NOT NULL CHECK (revision >= 0),
        archived_at TEXT
      );
      CREATE TABLE IF NOT EXISTS components (
        entity_id TEXT NOT NULL REFERENCES entities(id),
        type_id TEXT NOT NULL,
        schema_version INTEGER NOT NULL CHECK (schema_version > 0),
        data_json TEXT NOT NULL,
        active INTEGER NOT NULL CHECK (active IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        disabled_at TEXT,
        PRIMARY KEY (entity_id, type_id)
      );
      CREATE TABLE IF NOT EXISTS events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        schema_version INTEGER NOT NULL,
        operation_id TEXT NOT NULL UNIQUE,
        entity_id TEXT NOT NULL,
        command TEXT NOT NULL,
        before_revision INTEGER NOT NULL,
        after_revision INTEGER NOT NULL,
        changes_json TEXT NOT NULL,
        actor TEXT NOT NULL,
        at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS relations (
        id TEXT PRIMARY KEY,
        from_entity_id TEXT NOT NULL REFERENCES entities(id),
        to_entity_id TEXT NOT NULL REFERENCES entities(id),
        type TEXT NOT NULL CHECK (type = 'references'),
        active INTEGER NOT NULL CHECK (active IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_operation_id TEXT NOT NULL,
        removed_at TEXT,
        UNIQUE (from_entity_id, to_entity_id, type)
      );
      CREATE INDEX IF NOT EXISTS components_type_active
        ON components(type_id, active);
      CREATE INDEX IF NOT EXISTS events_entity_sequence
        ON events(entity_id, sequence);
      CREATE INDEX IF NOT EXISTS relations_from_active
        ON relations(from_entity_id, active);
      CREATE INDEX IF NOT EXISTS relations_to_active
        ON relations(to_entity_id, active);
    `);
    return new WorkspaceStore(database, path);
  }

  close(): void {
    this.database.close();
  }

  entity(entityId: string): WorkspaceEntityView | undefined {
    const row = this.database
      .query<EntityRow, [string]>("SELECT * FROM entities WHERE id = ?")
      .get(entityId);
    if (!row) return undefined;
    return {
      ...entityFromRow(row),
      components: this.components(entityId),
    };
  }

  entities(): WorkspaceEntityView[] {
    const rows = this.database
      .query<EntityRow, []>("SELECT * FROM entities ORDER BY created_at, id")
      .all();
    return rows.map((row) => ({
      ...entityFromRow(row),
      components: this.components(row.id),
    }));
  }

  component(entityId: string, typeId: string): WorkspaceComponent | undefined {
    const row = this.database
      .query<ComponentRow, [string, string]>(
        "SELECT * FROM components WHERE entity_id = ? AND type_id = ?",
      )
      .get(entityId, typeId);
    return row ? componentFromRow(row) : undefined;
  }

  components(entityId: string): WorkspaceComponent[] {
    return this.database
      .query<ComponentRow, [string]>(
        "SELECT * FROM components WHERE entity_id = ? ORDER BY type_id",
      )
      .all(entityId)
      .map(componentFromRow);
  }

  eventByOperation(operationId: string): WorkspaceEvent | undefined {
    const row = this.database
      .query<EventRow, [string]>("SELECT * FROM events WHERE operation_id = ?")
      .get(operationId);
    return row ? eventFromRow(row) : undefined;
  }

  events(entityId?: string): WorkspaceEvent[] {
    const rows = entityId
      ? this.database
          .query<EventRow, [string]>("SELECT * FROM events WHERE entity_id = ? ORDER BY sequence")
          .all(entityId)
      : this.database.query<EventRow, []>("SELECT * FROM events ORDER BY sequence").all();
    return rows.map(eventFromRow);
  }

  relation(fromEntityId: string, toEntityId: string): WorkspaceRelation | undefined {
    const row = this.database
      .query<RelationRow, [string, string]>(
        "SELECT * FROM relations WHERE from_entity_id = ? AND to_entity_id = ? AND type = 'references'",
      )
      .get(fromEntityId, toEntityId);
    return row ? relationFromRow(row) : undefined;
  }

  references(entityId: string): { outgoing: WorkspaceRelation[]; incoming: WorkspaceRelation[] } {
    const outgoing = this.database
      .query<RelationRow, [string]>(
        "SELECT * FROM relations WHERE from_entity_id = ? AND active = 1 ORDER BY created_at, id",
      )
      .all(entityId)
      .map(relationFromRow);
    const incoming = this.database
      .query<RelationRow, [string]>(
        "SELECT * FROM relations WHERE to_entity_id = ? AND active = 1 ORDER BY created_at, id",
      )
      .all(entityId)
      .map(relationFromRow);
    return { outgoing, incoming };
  }

  save(
    entity: WorkspaceEntity,
    event: WorkspaceEvent,
    component?: WorkspaceComponent,
    relation?: WorkspaceRelation,
  ): void {
    const transaction = this.database.transaction(() => {
      if (event.beforeRevision === -1) {
        this.database
          .query(
            `INSERT INTO entities
              (id, name, created_at, updated_at, revision, archived_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(
            entity.id,
            entity.name,
            entity.createdAt,
            entity.updatedAt,
            entity.revision,
            entity.archivedAt ?? null,
          );
      } else {
        const result = this.database
          .query(
            `UPDATE entities
                SET name = ?, updated_at = ?, revision = ?, archived_at = ?
              WHERE id = ? AND revision = ?`,
          )
          .run(
            entity.name,
            entity.updatedAt,
            entity.revision,
            entity.archivedAt ?? null,
            entity.id,
            event.beforeRevision,
          );
        if (result.changes !== 1) {
          const current = this.database
            .query<{ revision: number }, [string]>("SELECT revision FROM entities WHERE id = ?")
            .get(entity.id);
          throw new RevisionConflictError(
            entity.id,
            event.beforeRevision,
            current?.revision ?? -1,
          );
        }
      }

      if (component) {
        this.database
          .query(
            `INSERT INTO components
              (entity_id, type_id, schema_version, data_json, active, created_at, updated_at, disabled_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(entity_id, type_id) DO UPDATE SET
               schema_version = excluded.schema_version,
               data_json = excluded.data_json,
               active = excluded.active,
               updated_at = excluded.updated_at,
               disabled_at = excluded.disabled_at`,
          )
          .run(
            component.entityId,
            component.typeId,
            component.schemaVersion,
            JSON.stringify(component.data),
            component.active ? 1 : 0,
            component.createdAt,
            component.updatedAt,
            component.disabledAt ?? null,
          );
      }

      if (relation) {
        this.database
          .query(
            `INSERT INTO relations
              (id, from_entity_id, to_entity_id, type, active, created_at, updated_at,
               created_by, created_operation_id, removed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(from_entity_id, to_entity_id, type) DO UPDATE SET
               active = excluded.active,
               updated_at = excluded.updated_at,
               removed_at = excluded.removed_at`,
          )
          .run(
            relation.id,
            relation.fromEntityId,
            relation.toEntityId,
            relation.type,
            relation.active ? 1 : 0,
            relation.createdAt,
            relation.updatedAt,
            relation.createdBy,
            relation.createdOperationId,
            relation.removedAt ?? null,
          );
      }

      this.database
        .query(
          `INSERT INTO events
            (id, schema_version, operation_id, entity_id, command, before_revision,
             after_revision, changes_json, actor, at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          event.id,
          event.schemaVersion,
          event.operationId,
          event.entityId,
          event.command,
          event.beforeRevision,
          event.afterRevision,
          JSON.stringify(event.changes),
          event.actor,
          event.at,
        );
    });
    transaction.immediate();
  }
}
