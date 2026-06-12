// ConflictTracker — docs/idea/sync_and_conflict.md「並行Conflictの判定」。
//
// 外部サービスは version vector をくれないので、Logos 側が Component ごとに
// 「最後に書いた値(lastWritten)」「最後に見た値(lastSeen)」を覚えておく。
//
//   incoming == lastWritten                         → echo（因果的後続）→ no-op
//   incoming != lastSeen
//      かつ 相手側にも未反映の変更あり               → 並行 = Conflict
//      かつ 相手側に未反映の変更なし                 → ただの新しい編集 → 受け入れて同期
//
// 比較はすべて正規形(canonical)で行う。

import { canonical, canonicalEqual } from "./canonical.ts";

interface Mark {
  /** Logos が最後にこの Component へ書いた値（正規形）。 */
  lastWritten?: string;
  /** Logos が最後にこの Component で観測した値（正規形）。 */
  lastSeen: string;
  /** lastSeen 以降に外部/内部で未消化の変更があるか。 */
  dirty: boolean;
}

function key(entity: string, type: string): string {
  return `${entity}::${type}`;
}

export class ConflictTracker {
  private marks = new Map<string, Mark>();

  private mark(entity: string, type: string): Mark {
    const k = key(entity, type);
    let m = this.marks.get(k);
    if (!m) {
      m = { lastSeen: "", dirty: false };
      this.marks.set(k, m);
    }
    return m;
  }

  /** Logos がこの Component を value に書いたことを記録（echo 判定の基準）。 */
  recordWrite(entity: string, type: string, value: unknown): void {
    const m = this.mark(entity, type);
    const c = canonical(value);
    m.lastWritten = c;
    m.lastSeen = c;
    m.dirty = false;
  }

  /**
   * Component が value に変化したと観測したときの分類。
   * echo なら no-op として扱い、それ以外は dirty を立てる。
   */
  classify(entity: string, type: string, value: unknown): "echo" | "changed" {
    const m = this.mark(entity, type);
    const c = canonical(value);
    if (m.lastWritten !== undefined && c === m.lastWritten) {
      // 自分の書き込みが原因で戻ってきた echo。lastSeen も揃えて沈静化。
      m.lastSeen = c;
      m.dirty = false;
      return "echo";
    }
    if (c === m.lastSeen) return "echo"; // 既に見た値（不動点）→ no-op
    m.lastSeen = c;
    m.dirty = true;
    return "changed";
  }

  /** ユーザー編集など、外部観測を経ない内部変更を未消化としてマークする。 */
  markEdited(entity: string, type: string): void {
    this.mark(entity, type).dirty = true;
  }

  isDirty(entity: string, type: string): boolean {
    return this.mark(entity, type).dirty;
  }

  /** reconcile で相手側へ反映し終えた（未消化フラグを下ろす）。 */
  clearDirty(entity: string, type: string): void {
    this.mark(entity, type).dirty = false;
  }

  equal(a: unknown, b: unknown): boolean {
    return canonicalEqual(a, b);
  }
}
