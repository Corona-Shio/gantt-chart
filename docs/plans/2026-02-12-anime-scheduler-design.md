# Anime Scheduler Design (2026-02-12)

## Goal
複数人で使えるアニメ制作スケジュール管理アプリを、GAS + React + Vite で無料運用する。

## MVP
- タスクCRUD
- ガント作成/移動/リサイズ
- チャンネル別タブ
- 脚本番号自然順ソート
- 公開日表示
- 権限（admin/editor/viewer）
- 監査ログ + 論理削除
- 初回インポート
- 日次バックアップ

## Decisions
- Backend: Apps Script doPost RPC (`action` + `payload`)
- Storage: Google Sheets
- Frontend: React + vis-timeline
- Concurrency: `version` による楽観ロック
- Validation: 必須 / 日付整合 / マスタ一致を必須
- Timezone: Asia/Tokyo 固定

## Data Sheets
- tasks
- release_dates
- master_channels
- master_task_types
- master_statuses
- users
- audit_log

## Security
- users シートの active user のみ許可
- editor/admin のみ更新系API実行可

## Out of Scope
- 支払い計算
- 高度フィルタ
- 一括編集
- エクスポート
