import type { Generated, JSONColumnType } from "kysely";

export type PermissionKey = "read" | "write" | "manage";
export type JsonObject = Record<string, unknown>;

export interface Database {
  entities: EntitiesTable;
  users: UsersTable;
  permission_types: PermissionTypesTable;
  entity_permissions: EntityPermissionsTable;
  component_types: ComponentTypesTable;
  components: ComponentsTable;
}

export interface EntitiesTable {
  id: string;
  created_at: Generated<Date>;
}

export interface UsersTable {
  id: string;
}

export interface PermissionTypesTable {
  key: PermissionKey;
}

export interface EntityPermissionsTable {
  entity_id: string;
  user_id: string;
  permission_key: PermissionKey;
}

export interface ComponentTypesTable {
  key: string;
  owner_app: string;
  schema: JSONColumnType<JsonObject>;
}

export interface ComponentsTable {
  entity_id: string;
  type_key: string;
  value: JSONColumnType<JsonObject>;
  revision: Generated<string>;
  updated_at: Generated<Date>;
}
