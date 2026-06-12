// 正規形(canonical form)での比較。docs/idea/sync_and_conflict.md「正規形での比較（必須）」。
//
// 外部ストレージが書いた値を変形して返す（例: "B" を保存すると "b" になる）と、
// 生値比較では reconcile が毎回「まだ違う」と判断して上書きし続け、ループが止まらない。
// 正規形で畳めば不動点に収束し、echo は no-op になって燃料切れで止まる。

/** フィールド値を正規化する。プロトタイプでは「trim + 小文字化 + 空白畳み」を共通則とする。 */
export function canonical(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

/** 2 つの値が正規形で同値か。 */
export function canonicalEqual(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}
