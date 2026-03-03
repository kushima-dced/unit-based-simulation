# プロジェクトルール一覧

`.cursor/rules/` に設定されている Cursor ルールの一覧です。

---

## 1. プロジェクトワークフロー（常時適用）

| ファイル | 適用条件 |
|----------|----------|
| `project-workflow.mdc` | 常に適用（alwaysApply: true） |

### 内容

- **実装を始める前に `doc/` ディレクトリ配下を必ず確認する**
- 確認対象: requirements.md, tech-stack.md, progress.md, README.md

---

## 2. Next.js ベストプラクティス（ファイル指定）

| ファイル | 適用条件 |
|----------|----------|
| `nextjs-best-practices.mdc` | `**/*.ts`, `**/*.tsx` を編集時 |

### 内容

- **Cache Components 有効化なしでのベストプラクティス**
  - `cacheComponents` を有効にせず、従来の fetch キャッシュを活用
  - `next.revalidate` / `revalidateTag` / `revalidatePath` で再検証
  - 動的データが必要な場合のみ `cache: 'no-store'` を使用

---

*ルールの詳細は各 `.mdc` ファイルを参照*
