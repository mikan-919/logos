// Interface 登録のためのヘルパ型。
// Interface 自体も本来 Logos の Entity だが、プロトタイプでは登録関数として表現する。

import type { Engine } from "../core/engine.ts";

export interface LogosInterface {
  name: string;
  install(engine: Engine): void;
}
