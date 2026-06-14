# Monochrome Grid — Design System

> あなたのムードボードから抽出した6つの癖を、Web／モバイル両対応の汎用システムに凝縮したもの。
> 一言で言えば「温かみのあるモノクロの紙面に、特大グロテスク見出しと極小キャプションの落差をつくり、グリッドと連番で構造を見せ、座標や罫線のような技術的ディテールで締め、オレンジを一点だけ刺す」。

---

## 0. 設計原則 (Principles)

抽出された6軸を、実装判断の拠りどころとなる原則として固定する。迷ったときはこの順に優先する。

1. **モノクロ・ファースト** — まずグレースケールだけで成立させ、色は最後に一点だけ足す。色数が増えそうになったら、それは情報設計の失敗のサイン。
2. **落差で語る (Scale Contrast)** — 中間サイズを使わない。見出しは特大、本文・キャプションは極小。中庸を排してリズムを生む。
3. **構造を見せる (Visible Structure)** — グリッド、連番(01/02/03)、目次、罫線を隠さず、むしろ意匠として表に出す。
4. **技術的ディテール** — 座標・等高線・バーコード・モノスペースのメタ情報など、データの素っ気なさそのものを装飾として使う。
5. **間と引き算 (Ma)** — 要素を足すより余白を増やす。静けさを最大のリソースとして扱う。
6. **OSネイティブの端正さ** — 角丸カード、すりガラス、システムUIの簡潔さを基準に。装飾的なイラストやベタなグラデーションには逃げない。

---

## 1. カラー (Color Tokens)

### 1.1 ベース — 温かみのあるグレースケール

真っ白・真っ黒を避け、わずかに温度をのせる。これが「紙面」の質感をつくる中核。

| トークン | 用途 | HEX |
|---|---|---|
| `--paper` | 既定の背景(オフホワイト) | `#F7F5F1` |
| `--paper-pure` | カード等、一段持ち上げる白 | `#FFFFFF` |
| `--ink` | 既定のテキスト(ニアブラック) | `#0E0E0C` |
| `--ink-700` | 副次テキスト | `#3A3A37` |
| `--ink-500` | キャプション・メタ情報 | `#6E6E69` |
| `--ink-300` | プレースホルダ・無効 | `#A8A8A2` |
| `--line` | ヘアライン罫線 | `#DCDAD3` |
| `--line-strong` | 強い区切り | `#C2C0B8` |
| `--surface-dark` | ダーク面の背景 | `#0E0E0C` |
| `--surface-dark-2` | ダーク面のカード | `#1A1A18` |

### 1.2 アクセント — オレンジ(一点投入専用)

塗り面積は画面の5%を上限の目安に。CTA・現在地・選択中・重要指標など「いま見るべき一点」にだけ使う。

| トークン | 用途 | HEX |
|---|---|---|
| `--accent` | 既定のオレンジ | `#F1531F` |
| `--accent-hover` | ホバー・押下 | `#D8430F` |
| `--accent-soft` | 淡い背景・タグ地 | `#FBE2D6` |
| `--accent-ink` | オレンジ面上のテキスト | `#FFFFFF` |

### 1.3 セマンティック

機能色も彩度を抑え、紙面から浮かせない。成功にすら緑を多用しない。

| トークン | 用途 | HEX |
|---|---|---|
| `--positive` | 成功・進捗 | `#2E6F4E` |
| `--warning` | 注意 | `#B7791F` |
| `--danger` | エラー・破壊的操作 | `#C2331B` |

> **ルール**: 1画面に出すアクセント=オレンジ、機能色を含めても着色は同時に2系統まで。それ以上はモノクロに戻す。

---

## 2. タイポグラフィ (Typography)

スイス・インターナショナルタイポグラフィの系譜。**グロテスク系サンセリフ**を主役に、技術ディテール用に**モノスペース**を併用する二段構成。

### 2.1 フォントファミリー

| 役割 | 第一候補 | 無料フォールバック |
|---|---|---|
| Display / 見出し | Neue Haas Grotesk Display | Inter Tight / Satoshi |
| Text / 本文 | Neue Haas Grotesk Text | Inter / Satoshi |
| Mono / 技術ラベル | Söhne Mono | JetBrains Mono / IBM Plex Mono |

```css
--font-display: "Neue Haas Grotesk Display", "Inter Tight", "Satoshi", sans-serif;
--font-text:    "Neue Haas Grotesk Text", "Inter", "Satoshi", sans-serif;
--font-mono:    "Söhne Mono", "JetBrains Mono", "IBM Plex Mono", monospace;
```

### 2.2 タイプスケール

「落差で語る」原則のため、見出しと本文の間を意図的に飛ばす(中間サイズを常用しない)。倍率はおよそ1.5。

| トークン | px (Web) | 用途 | 字間 / 行間 |
|---|---|---|---|
| `--text-display` | 96 | 文字を画像として使う主役 | -0.03em / 0.95 |
| `--text-h1` | 56 | ページ見出し | -0.02em / 1.0 |
| `--text-h2` | 32 | セクション見出し | -0.01em / 1.1 |
| `--text-body` | 16 | 本文 | 0 / 1.55 |
| `--text-caption` | 12 | キャプション | 0.01em / 1.4 |
| `--text-meta` | 10.5 | 技術メタ(mono・大文字) | 0.08em / 1.2 |

> モバイルでは `--text-display` を 56、`--text-h1` を 36 に縮める。落差(display ÷ body)の比率は維持する。

### 2.3 タイポグラフィの作法

- 見出しは**詰める** (negative tracking)、メタ情報は**開ける** (positive tracking)。この緊張差がスイス感の正体。
- メタ・ラベル・連番は **mono + 大文字 + letter-spacing 0.08em** で統一。例: `LAT 35.6762° N` / `INDEX 01 — 03`。
- 本文は左揃え・ラグ(右端そろえない)を既定に。両端揃えは使わない。

---

## 3. スペーシング & グリッド

### 3.1 スペーシングスケール (4px base)

| トークン | px |
|---|---|
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-6` | 24 |
| `--space-8` | 32 |
| `--space-12` | 48 |
| `--space-16` | 64 |
| `--space-24` | 96 |

> 「間と引き算」の原則上、セクション区切りは `--space-16` 以上を惜しまない。要素を詰めるより空ける。

### 3.2 グリッド

構造を意匠として見せるため、グリッドは隠さずレイアウトの骨として明示する。

| 環境 | カラム | ガター | 外マージン | 最大幅 |
|---|---|---|---|---|
| Desktop | 12 | 24px | 96px | 1440px |
| Tablet | 8 | 20px | 48px | — |
| Mobile | 4 | 16px | 20px | — |

- ベースライングリッドは 8px。すべての縦位置を8の倍数に乗せる。
- 連番(01/02/03)、目次、ページ番号はグリッドの端に固定配置し、コンテンツの「索引」として機能させる。

---

## 4. 罫線・角丸・面 (Borders, Radius, Surface)

### 4.1 ヘアライン

技術図面のような細い線が世界観の要。**1pxの罫線を多用**し、影に頼らず領域を仕切る。

```css
--border-hairline: 1px solid var(--line);
--border-strong:   1px solid var(--line-strong);
--border-ink:      1px solid var(--ink);
```

### 4.2 角丸

OSネイティブの端正さ。鋭角(ポスター的)と角丸(UI的)を用途で使い分ける。

| トークン | px | 用途 |
|---|---|---|
| `--radius-none` | 0 | エディトリアル・ポスター面・罫線ブロック |
| `--radius-sm` | 8 | ボタン・入力欄・タグ |
| `--radius-md` | 16 | カード・ウィジェット |
| `--radius-lg` | 24 | モーダル・大きなシート |
| `--radius-full` | 999 | アイコンボタン・ピル |

### 4.3 エレベーションとフロスト

影は最小限。浮かせたいときは強い影より**フロスト(すりガラス)**を優先する。

```css
--shadow-card: 0 1px 2px rgba(14,14,12,.04), 0 8px 24px rgba(14,14,12,.06);
--frost: backdrop-filter: blur(20px) saturate(1.1); background: rgba(247,245,241,.72);
```

---

## 5. コンポーネント作法 (Components)

汎用なので各部品の具体実装ではなく「あなたの癖に沿った振る舞い」を定義する。

### 5.1 ボタン

| 種類 | 地 | 文字 | 枠 | 用途 |
|---|---|---|---|---|
| Primary | `--accent` | `--accent-ink` | なし | 1画面に原則1つ |
| Secondary | 透明 | `--ink` | `--border-ink` | 並列の操作 |
| Ghost | 透明 | `--ink-700` | なし | 補助操作 |

- ラベルは大文字 or センテンスケースで統一し、文中に矢印(`↗` `→`)を添えるとボード内の作例(BRUTAL等)の質感に合う。
- 角丸 `--radius-sm`、高さは8の倍数(40 / 48)。

### 5.2 カード / ウィジェット

- 既定は `--paper-pure` 地 + `--border-hairline`、影なし。浮かせる必要があるときだけ `--shadow-card`。
- 角丸 `--radius-md`。内側パディングは `--space-6` 以上。
- 左上または右上に mono のインデックス(`01`)やメタ(`PARTLY CLOUDY / 24°`)を置くと世界観が締まる。

### 5.3 ディバイダ & 索引

- セクション間はヘアライン1本。装飾的な区切り線は使わない。
- 目次・ナビは「`01` ラベル + ヘアライン + テキスト」の三点セットで構成し、構造そのものを見せる。

### 5.4 データ表示 (天気・指標など)

ボードで最頻出だったパターン。数値を主役にした静かな表示を標準化する。

- 主指標は `--text-display` 級で特大に、単位・ラベルは `--text-meta`(mono)で極小に。落差で見せる。
- 進捗・状態はオレンジ1色のバー/ドットで表現。多色化しない。

### 5.5 フォーム

- 入力欄は `--paper-pure` 地 + 下線または `--border-hairline`、角丸 `--radius-sm`。
- フォーカス時のみ枠を `--accent` に。プレースホルダは `--ink-300`。

---

## 6. モーション (Motion)

端正さを壊さないため、動きは速く・小さく・控えめに。

| トークン | 値 | 用途 |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.0,.0,1)` | 標準 |
| `--dur-fast` | 120ms | ホバー・トグル |
| `--dur-base` | 200ms | 出現・遷移 |
| `--dur-slow` | 360ms | シート・モーダル |

- 移動距離は8〜16pxまで。大きく跳ねる動きは避ける。
- フェード+わずかな上方向スライドを基本に。バウンスは使わない。

---

## 7. ダークモード

ボード内のダーク作例(BRUTAL / HIGHER DIMENSION / 黒地ポスター)に対応。色を反転せず、専用の値を持つ。

| トークン | HEX |
|---|---|
| `--paper` | `#0E0E0C` |
| `--paper-pure` | `#1A1A18` |
| `--ink` | `#F2F0EA` |
| `--ink-500` | `#9A9A92` |
| `--line` | `#2A2A27` |
| `--accent` | `#FF6A38`(暗地で映えるよう少し明るく) |

---

## 8. Do / Don't

**Do**
- まずモノクロで完成させ、オレンジは「いま見るべき一点」にだけ足す。
- 見出しは特大に詰め、メタは極小に開く。中間を避ける。
- 連番・目次・座標・罫線で「構造」を堂々と見せる。
- 余白を最大のリソースとして扱う。

**Don't**
- 彩度の高い色を複数同時に使う。
- 影でリッチさを演出する(フロストか罫線で代替)。
- 中庸なサイズの見出しを多用してリズムを殺す。
- 装飾的イラストやベタなグラデーションに逃げる。

---

## 付録: CSS変数まとめ (コピペ用)

```css
:root {
  /* Color */
  --paper:#F7F5F1; --paper-pure:#FFFFFF;
  --ink:#0E0E0C; --ink-700:#3A3A37; --ink-500:#6E6E69; --ink-300:#A8A8A2;
  --line:#DCDAD3; --line-strong:#C2C0B8;
  --accent:#F1531F; --accent-hover:#D8430F; --accent-soft:#FBE2D6; --accent-ink:#FFFFFF;
  --positive:#2E6F4E; --warning:#B7791F; --danger:#C2331B;

  /* Type */
  --font-display:"Neue Haas Grotesk Display","Inter Tight","Satoshi",sans-serif;
  --font-text:"Neue Haas Grotesk Text","Inter","Satoshi",sans-serif;
  --font-mono:"Söhne Mono","JetBrains Mono","IBM Plex Mono",monospace;

  /* Space */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px; --space-24:96px;

  /* Radius */
  --radius-sm:8px; --radius-md:16px; --radius-lg:24px; --radius-full:999px;

  /* Border */
  --border-hairline:1px solid var(--line);
  --border-strong:1px solid var(--line-strong);

  /* Motion */
  --ease:cubic-bezier(.2,.0,.0,1);
  --dur-fast:120ms; --dur-base:200ms; --dur-slow:360ms;
}
```
