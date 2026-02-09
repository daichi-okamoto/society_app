# フロント（React SPA）画面構成・ルーティング設計

## ルーティング方針
- 公開ページと認証必須ページを分離
- 参加者向けと運営向けを分離（`/admin` 配下）
- 主要導線は「大会一覧 → 大会詳細 → 申込/結果/画像」

## 公開ルート（未ログインOK）
- `/` トップ（大会一覧/過去大会）
- `/tournaments/:id` 大会詳細
- `/tournaments/:id/results` 試合結果/順位表
- `/announcements` お知らせ一覧
- `/login` ログイン
- `/register` 新規登録

## 参加者ルート（ログイン必須）
- `/me` マイページ
- `/teams` チーム一覧
- `/teams/new` チーム作成
- `/teams/:id` チーム詳細（所属メンバーのみ）
- `/teams/:id/join` 参加コード入力
- `/teams/:id/requests` 参加申請管理（代表のみ）
- `/teams/:id/transfer` 代表移譲（代表/運営）
- `/tournaments/:id/entry` 大会参加申込（代表のみ）
- `/tournaments/:id/payment` 決済
- `/tournaments/:id/images` 画像ギャラリー（参加者のみ）

## 運営ルート（admin）
- `/admin` 管理ダッシュボード
- `/admin/tournaments` 大会管理
- `/admin/tournaments/new` 大会作成
- `/admin/tournaments/:id` 大会編集
- `/admin/entries` 申込管理
- `/admin/teams` チーム/メンバー管理
- `/admin/matches` 試合管理
- `/admin/results` 結果管理
- `/admin/announcements` お知らせ管理
- `/admin/messages` 個別連絡
- `/admin/images` 画像管理
- `/admin/payments` 決済管理
- `/admin/exports` 名簿CSV出力

## 画面構成（主要ページ）
- トップ: 大会カード一覧、過去大会リンク
- 大会詳細: 基本情報、参加ボタン、結果/画像タブ
- チーム一覧: 所属チームと全チーム
- チーム詳細: メンバー一覧、申請管理、代表移譲
- マイページ: 参加履歴、申込状況、プロフィール
- 管理ダッシュボード: 申込/決済/結果のサマリー

