import type { Generated } from "kysely";

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
  created_at: Generated<string>;
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
  schema: string;
}

export interface ComponentsTable {
  entity_id: string;
  type_key: string;
  value: string;
  revision: Generated<number>;
  updated_at: Generated<string>;
}
