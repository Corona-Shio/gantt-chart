# Deploy Guide

## 1. Frontend build
```bash
npm --prefix frontend install
npm run build
```

## 2. Apps Script setup
1. Apps Script プロジェクトを作成
2. `.clasp.json.example` を `.clasp.json` にコピーし `scriptId` を設定
3. `clasp login`

## 3. Push
```bash
clasp push
clasp deploy
```

## 4. Schema initialize
Apps Script Editor で以下を実行:
- `initializeSchema()`
- `createDailyBackupTrigger()`

## 5. Users
`users` シートに利用者メールとロールを登録:
- admin
- editor
- viewer

## 6. 運用メモ（2026-02-13）

### 固定デプロイID運用
- 現在の固定デプロイID:
  - `AKfycbwIAxjObcbyoQCGMReGlmB19n25ftOSgWeGwLv-oBvEbmTXM7148onWIadnB0PSvTuF`
- 固定URL:
  - `https://script.google.com/macros/s/AKfycbwIAxjObcbyoQCGMReGlmB19n25ftOSgWeGwLv-oBvEbmTXM7148onWIadnB0PSvTuF/exec`
- 更新手順:
  1. `npm run build`
  2. `npm run gas:push`
  3. `npm run gas:deploy`（同じIDを更新）

### 重要: HTML配信の二重経路
- Apps Script 側では `Index` と `src/Index` のどちらが読まれるかで差が出る場合がある。
- このリポジトリではビルド同期時に以下2ファイルへ同内容を書き込む:
  - `gas/Index.html`
  - `gas/src/Index.html`
- `doGet()` は `Index` 優先、なければ `src/Index` を読む。

### 既知の見分け方（重要）
- 致命エラー:
  - `Invalid type received for "day"... Received [function]`
  - `TypeError: d.replace is not a function`
  - これは古いフロントJSが配信されているサイン。
- 基本無視でよいログ:
  - `Unrecognized feature: ambient-light-sensor / speaker / vibrate / vr`
  - `An iframe which has both allow-scripts and allow-same-origin...`
  - `Net state changed ...`
  - `Document replacement detected ...`
  - `content.js ... message port closed ...`

### 反映確認のコツ
- URL末尾にキャッシュバスターを付ける:
  - `...?nocache=<version>`
- `clasp push` が `Skipping push.` の場合、必要に応じて:
  - `npx clasp push --force`
