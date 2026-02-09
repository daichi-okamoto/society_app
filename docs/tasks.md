# タスク分割（MVP / 1人開発 / 1時間タスク / 優先度順）

## P0: まず動く基盤
- プロジェクト構成を決める（Rails API + React SPA）
- ローカル開発環境の前提を整理する（Ruby/Node/Postgres）
- Rails API の新規アプリ作成
- React SPA の新規アプリ作成
- ルートに README を作る
- `.env.example` を作る
- CORS 設定の方針を決める

## P1: 認証/権限
- Devise を導入
- User モデルに必要カラムを追加
- セッション認証API（login/logout）を作る
- 登録API（register）を作る
- `GET /users/me` を作る
- `PATCH /users/me` を作る
- `admin/captain/member` の権限チェックを実装
- `require_admin!` を作る
- `require_captain!` を作る
- `require_team_member!` を作る

## P2: チーム参加フロー（最重要）
- Team モデル作成
- TeamMember モデル作成
- join_code 発行ロジック作成
- Team 作成API
- チーム一覧API（TeamSummary）
- チーム詳細API（TeamDetail）
- TeamJoinRequest モデル作成
- 参加コード申請API
- 参加申請一覧API（代表/運営）
- 参加申請の承認/却下API
- 代表移譲API
- メンバー削除API

## P3: 大会申込フロー
- Tournament モデル作成
- 大会作成/編集API
- 大会一覧/詳細API
- TournamentEntry モデル作成
- 参加申込API
- 申込一覧API（運営）
- 申込承認/却下API
- 申込キャンセルAPI

## P4: 決済（Stripe）
- Payment モデル作成
- Stripe Checkout API
- Stripe Webhook エンドポイント
- 返金API
- 決済状態の更新処理

## P5: 試合/結果
- Match モデル作成
- MatchResult モデル作成
- 試合作成API
- 試合一覧API
- 結果入力API

## P6: 画像/名簿
- TournamentImage モデル作成
- 画像一覧API（参加者のみ）
- 画像アップロードAPI（運営）
- 画像削除API（運営）
- 保険名簿CSVの出力ロジック
- 管理画面からのダウンロードAPI

## P7: 通知（メール）
- メール送信サービスの導入
- 参加申請承認/却下メール
- 参加申込承認/却下メール
- 決済完了/失敗メール
- キャンセル/返金完了メール
- 個別連絡メール

## P8: リアルタイム通知（SSE）
- Notification モデル作成
- NotificationTarget モデル作成
- NotificationRead モデル作成
- SSE エンドポイント作成（/notifications/stream）
- 通知作成API（運営）
- 既読API
- 画面側のバナー/バッジ表示

## P9: お知らせ/連絡
- Announcement モデル作成
- お知らせ一覧API
- お知らせ作成API
- Message モデル作成
- 個別連絡API

## P10: フロント（React SPA）
- ログイン/登録画面
- トップ/大会一覧画面
- 大会詳細画面
- チーム一覧/作成画面
- 参加コード入力画面
- チーム詳細/承認管理画面
- 大会申込/決済画面
- 試合結果/順位画面
- 画像ギャラリー画面
- 管理画面（大会/申込/結果/画像/名簿）

## P11: QA / 運用
- 主要フローE2Eテスト
- 例外系テスト（未認証/権限/締切超過）
- ログ/監視の最小設定
- デプロイ手順の確認
