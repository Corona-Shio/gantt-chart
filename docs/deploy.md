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
