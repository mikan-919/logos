# Logos

Logos は、複数のアプリが同じ対象の情報を扱うための基盤。

## 用語

**Entity**:
Logos 内で識別子を持つ対象。固定された種類ではなく、付いている Component によって情報を持つ。

**Component**:
Entity に付く、型を持った情報。各アプリは Component の型を定義し、任意の Entity に追加できる。

**アプリ**:
Logos の Entity を利用する画面と機能。利用する Component を選び、同じ Entity を他のアプリと共有する。
