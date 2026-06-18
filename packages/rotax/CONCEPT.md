---
name: rotax
---
# Rotax — Concept

## Single job
Logos に接地した概念をタスクとして時間軸に並べ、実行するカレンダー＋タスクアプリ（Google Calendar + Linear を一つにしたもの）。タスクは Rotax 内の独立した行ではなく、Velt のノートや外部 Issue と同じ概念(Entity)に乗った RotaxTask Component なので、予定を立て・進めることがその概念そのものへの行為になる。

## Audience & state
作者自身。一日をこなしている最中に開く — 「今何をやるべきか」「この後に何があるか」を把握し、タスクを前に進めたい実務的な状態。瞑想的でも振り返りでもなく、進行中。Google Calendar（いつ）と Linear（何を・どこまで）を行き来する手間を一つの面に畳みたい。Yatra が過去の振り返りなら、Rotax は**今と、これから**の領分。

## Values
- **接地（Logos のタスク）** — タスクは Logos の概念に乗る RotaxTask Component（status, scheduledAt 等）。→ タスクを Rotax 内に閉じた独立データとして持つことを**禁じる**（同じ概念の Velt ノート・外部 Issue から切り離さない）。同じタスクのコピーを作ることを**禁じる**。
- **時間と実行の一体（Calendar + Linear）** — 「いつ」（カレンダー）と「何を・どこまで」（タスク状態）は同じ面の両側面。→ 予定（カレンダー）とタスク状態（進捗）を別アプリ・別画面に割ることを**禁じる**。
- **今を起点に読める** — 一日は「今」をアンカーに、背後に過ぎたもの・前方にこれからが並ぶ（実装の hero / trajectory）。→ 「今」を持たないフラットなタスクリストだけで一日を見せることを**禁じる**。
- **today ⟷ multi-day の連続** — 一日の詳細と複数日の俯瞰は同じものの寄り引き（実装の FLIP morph）。→ today と timeline をモーダルな別画面としてハード遷移で分断することを**禁じる**。

## Subject world
カレンダー＋タスクの語彙：スケジュール、時間軸（一日の開始〜終了）、span（開始-終了の予定）、lane（重なりを段に積む＝詰まった予定）、backlog（未配置のタスク）、状態（active / upcoming / done）、trajectory（過ぎた lane と これからの lane、now に近い順）、today ダッシュボード ⟷ multi-day timeline、Pomodoro の focus/break セッション、"IN PROGRESS" / "UP NEXT" / "ON TRACK" / est. finish。参照点は Google Calendar（時間）と Linear（タスク追跡）。
Logos 基盤：RotaxTask（時間・タスク）、Name Component、archetype query「RotaxTask を持つ Entity を返す」。"Rotax" は rota（当番表・予定表＝時間の割り当て）を思わせる、時間の割り付けレイヤー。

## Forbidden moves
- タスクを Rotax 内に閉じた独立データにする — 接地により無効（タスクは Logos の概念に乗る）。
- カレンダー（予定）とタスク状態を別アプリ／別画面に割る — 時間と実行の一体により無効。
- 過去の活動履歴を Rotax の主役にする — Yatra の領分により無効（Rotax は今とこれから）。
- today と multi-day をモーダルに分断する（ハード遷移） — today ⟷ multi-day の連続により無効。
- 「今」を持たないフラットなタスクリストだけで一日を見せる — 今を起点に読めるにより無効。

## Content shape
**時間軸の上のタスク（calendar timeline）＋状態を持つタスク** — 一つの時間軸が寄り引きで姿を変える。寄った状態（today）：now をアンカーに、進行中タスクの hero、背後に過ぎた trajectory・前方にこれからの trajectory、一日の span が lane に積まれる。引いた状態（multi-day）：複数日の timeline が縦に並び、FLIP で today と連続する。タスクは軸上の span（開始-終了）か backlog（未配置）のいずれか。順序は本質的に時間。
