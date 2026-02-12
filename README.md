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

## Git管理ルール（このリポジトリ）
- Gitに含める（管理対象）
  - `gas/appsscript.json`
  - `gas/src/**/*.gs`（GASロジック本体）
  - `gas/src/Index.html`（フロントビルドの同期先。デプロイ対象）
  - `frontend/src/**` などのソースコード
- Gitに含めない（生成物・ローカル情報）
  - `frontend/dist/`
  - `node_modules/`
  - `.clasp.json`（プロジェクトIDなど環境依存情報）

## 運用フロー（推奨）
1. 開発
   - フロント変更: `npm run dev`
   - GAS変更: `gas/src/*.gs` を編集
2. 反映準備
   - `npm run build`
   - これは `frontend` をビルドし、`gas/src/Index.html` を自動同期します
3. Gitコミット
   - ソース変更に加えて、必要なら同期後の `gas/src/Index.html` も一緒にコミット
4. GASへ反映
   - `npm run gas:push`
   - 必要に応じて `npm run gas:deploy`

補足:
- `gas/src/Index.html` は生成物ですが、Apps Scriptへそのままpushする実体のため、このリポジトリでは管理対象にしています。
- 同期時刻コメントは出力しないようにして、無意味な差分が出ないようにしています。

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
