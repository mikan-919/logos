// モック外部サービス（GitHub / Linear）。本物の API の代わりに、
//   - write 時に値を変形（小文字化）して保存する → docs の「非冪等な変換」を再現
//   - 変更があれば webhook を発火する
// ことで、echo・正規形比較・燃料切れの挙動を観察できるようにする。

export interface ExternalRecord {
  externalId: string;
  fields: Record<string, unknown>;
}

export type WebhookFn = (externalId: string, fields: Record<string, unknown>) => void;

export class MockExternalStore {
  private records = new Map<string, ExternalRecord>();
  private webhook?: WebhookFn;

  constructor(public readonly service: string) {}

  onWebhook(fn: WebhookFn): void {
    this.webhook = fn;
  }

  seed(externalId: string, fields: Record<string, unknown>): void {
    this.records.set(externalId, { externalId, fields: this.transform(fields) });
  }

  get(externalId: string): ExternalRecord | undefined {
    return this.records.get(externalId);
  }

  /**
   * 外部サービス側で値が書かれる（Logos の書戻し or ユーザーの直接編集の両方がここを通る）。
   * 変形後の値が既存と異なる場合のみ webhook を飛ばす。
   * @param fireWebhook Logos からの書戻しでも webhook は飛ぶ（echo の素）。
   */
  write(externalId: string, fields: Record<string, unknown>, fireWebhook = true): void {
    const transformed = this.transform(fields);
    const existing = this.records.get(externalId);
    const merged: ExternalRecord = {
      externalId,
      fields: { ...(existing?.fields ?? {}), ...transformed },
    };
    const changed = JSON.stringify(existing?.fields) !== JSON.stringify(merged.fields);
    this.records.set(externalId, merged);
    if (changed && fireWebhook && this.webhook) {
      this.webhook(externalId, merged.fields);
    }
  }

  /** 外部サービス特有の正規化（ここでは title を小文字化する非冪等変換を模す）。 */
  private transform(fields: Record<string, unknown>): Record<string, unknown> {
    const out = { ...fields };
    if (typeof out.title === "string") out.title = out.title.toLowerCase();
    return out;
  }
}
