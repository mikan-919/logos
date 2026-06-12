// Logos core type definitions.
// 語彙は CONTEXT.md / docs/idea/first_logic.md に準拠する。

export type EntityId = string;

/** Component の実体。`type` が視点（GithubIssue, LinearIssue, Refs ...）を表す。 */
export interface Component {
  type: string;
  /** 表現Componentのフィールド（title, status ...）。set-like 型は values に集合を持つ。 */
  fields: Record<string, unknown>;
}

/**
 * Entity — 概念上同じものを表す一意の単位。Entity 自体は名前を持たない。
 * components は型ごとに一意（同型は1つだけ）。
 */
export interface Entity {
  id: EntityId;
  components: Map<string, Component>;
  /** 並行Conflict 待ちで reconcile を止めている間 true。 */
  status: "ok" | "conflict";
}

/** Component 型のスキーマ宣言（Interface が定義する）。 */
export interface ComponentSchema {
  type: string;
  fields: string[];
  /** Refs / Assign のように集合を内包する1Componentとして扱う型。 */
  setLike?: boolean;
  /** どのモック外部サービスに属するか（書戻し先）。内部属性なら undefined。 */
  service?: string;
}

/**
 * Event — 短命な Component。payload を運ばず「このEntityを見直せ」という合図のみ。
 * 消費されると同時に削除される（地産地消）。
 */
export interface LogosEvent {
  id: string;
  entity: EntityId;
  /** `Event<T>`（外部由来）か `Change<C>`（内部変更由来）か。 */
  kind: "external" | "change";
  /** Event<T> の T、または Change<C> の C にあたる Component 型。 */
  componentType: string;
  reason: string;
}

/** UI/CLI で収束の様子を観察するためのログ行。 */
export interface LogLine {
  ts: number;
  level: "event" | "reconcile" | "noop" | "conflict" | "info";
  message: string;
}
