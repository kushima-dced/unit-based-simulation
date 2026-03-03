# Cursor Rules 図解

Cursor のルールシステムの構造と動作を図で説明します。

---

## 1. ルール適用の流れ

```mermaid
flowchart TD
    subgraph トリガー["トリガー"]
        A[ユーザーが AI に質問・依頼]
    end

    subgraph ルール読み込み["ルール読み込み"]
        B[alwaysApply: true のルール]
        C[開いているファイルにマッチする globs のルール]
    end

    subgraph 適用["適用"]
        D[AI がルールを参照]
        E[ルールに従ってコード生成・編集]
    end

    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
```

---

## 2. ルールの種類と適用条件

```mermaid
flowchart LR
    subgraph ルール["ルールファイル (.mdc)"]
        R1[alwaysApply: true]
        R2[globs: **/*.ts]
        R3[globs: **/*.tsx]
        R4[globs: doc/**/*]
    end

    subgraph 適用条件["適用条件"]
        R1 --> |常に| A1[全セッションで適用]
        R2 --> |*.ts を開いている時| A2[TypeScript ファイル編集時]
        R3 --> |*.tsx を開いている時| A3[React コンポーネント編集時]
        R4 --> |doc/ 内を開いている時| A4[ドキュメント編集時]
    end
```

---

## 3. ディレクトリ構造

```mermaid
flowchart TD
    subgraph プロジェクト["プロジェクトルート"]
        cursor[".cursor/"]
    end

    subgraph cursor_dir[".cursor/"]
        rules["rules/"]
    end

    subgraph rules_dir["rules/"]
        rule1["project-standards.mdc\n(alwaysApply: true)"]
        rule2["typescript.mdc\n(globs: **/*.ts)"]
        rule3["react.mdc\n(globs: **/*.tsx)"]
    end

    cursor --> rules
    rules --> rule1
    rules --> rule2
    rules --> rule3
```

---

## 4. ルールファイルの構造

```mermaid
flowchart TB
    subgraph ファイル["ルールファイル (.mdc)"]
        FM[Frontmatter ブロック]
        CONT[ルール本文]
    end

    subgraph FM_detail["Frontmatter の内容"]
        desc["description: ルールの説明"]
        globs["globs: ファイルパターン\n(例: **/*.tsx)"]
        always["alwaysApply: true/false"]
    end

    FM --> desc
    FM --> globs
    FM --> always
    FM --> CONT
```

---

## 5. ルール作成の判断フロー

```mermaid
flowchart TD
    START[ルールを作成する]
    Q1{プロジェクト全体に\n適用するか？}
    Q2{特定ファイルのみに\n適用するか？}

    START --> Q1
    Q1 -->|はい| A1[alwaysApply: true]
    Q1 -->|いいえ| Q2
    Q2 -->|はい| A2[globs を指定]
    Q2 -->|いいえ| A3[用途に応じて選択]

    A1 --> CREATE["ルールを作成"]
    A2 --> CREATE
    A3 --> CREATE

    subgraph 例["例"]
        E1["コーディング規約 → alwaysApply"]
        E2["React の書き方 → globs: **/*.tsx"]
        E3["API 規約 → globs: **/api/**"]
    end
```

---

## 6. まとめ

| 設定 | 適用タイミング |
|------|----------------|
| `alwaysApply: true` | 常に（全セッション） |
| `globs: **/*.ts` | `.ts` ファイルを開いている時 |
| `globs: **/*.tsx` | `.tsx` ファイルを開いている時 |
| `globs: doc/**/*` | `doc/` 配下のファイルを開いている時 |

---

*このドキュメントは Cursor のルール機能の理解を助けるための図解です*
