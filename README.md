# Anime Production Scheduler (GAS + React + Vite)

アニメ制作チーム向けのスケジュール管理アプリです。テーブルとガントチャートを主機能として、複数人での安全な運用を想定しています。

## 主な機能（MVP）
- タスクCRUD（ステータス / チャンネル / 担当 / 脚本番号 / タスク種 / タスク名 / 開始日 / 終了日）
- チャンネル別表示タブ（全体タブ含む）
- 脚本番号の自然順ソート（`714 < 714A < 715`）
- ガント上のクリック/ドラッグで新規タスク範囲指定
- 公開日の可視化（チャンネル色の公開日マーカー）
- 楽観ロック（version）による同時編集競合検知
- 監査ログ（全更新）と論理削除

## ディレクトリ構成
- `frontend/`: React + Vite + TypeScript フロントエンド
- `gas/src/`: Google Apps Script バックエンド
- `scripts/sync-build-to-gas.mjs`: ViteビルドをGAS `Index.html` に同期

## セットアップ
1. Frontend依存関係のインストール
   - `npm --prefix frontend install`
2. フロントエンド開発起動
   - `npm run dev`
3. フロントエンド本番ビルド + GAS HTML同期
   - `npm run build`

## GAS デプロイ準備
1. `clasp` でApps Scriptプロジェクトに紐づけ（`.clasp.json` 作成）
2. `gas/src` 配下をpush
   - `npm run gas:push`
3. Web Appとしてデプロイ
   - `npm run gas:deploy`

## 初期化
Apps Script Editorから以下を実行
- `initializeSchema`（各シートと初期マスタ作成）
- `createDailyBackupTrigger`（日次バックアップトリガー作成）

## 注意
- タイムゾーンは `Asia/Tokyo`（JST）固定を前提
- 認証は `users` シートの許可メールアドレスで制御
- 初期MVPでは支払い計算機能は含みません
