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

## 未完・未確認リスト（直近）
- [x] CORS 設定の実装（`backend/config/initializers/cors.rb`）
- [ ] 主要フローE2Eテスト（Playwright/Cypress などの導入と実装）
- [ ] ログ/監視の最小設定（例: 例外通知 or 集約ログの導入）
- [ ] 本番デプロイ実行（Render / Cloudflare Pages）
- [ ] 本番ENVの設定と疎通確認（Stripe / R2 / SMTP / API）

---

## 現行Issueバックログ（2026-02-24更新 / 着手順）

### Issue 01 (`P0`) ✅ 実装済み (2026-02-25)
- タイトル: 名簿提出をサーバー保存へ移行（sessionStorage依存解消）
- 目的: 端末依存をなくし、提出済み名簿をシステムの正本データにする
- スコープ:
  - `tournament_entries` に紐づく名簿正規テーブル（例: `entry_rosters`, `entry_roster_players`）を追加
  - 名簿提出/取得/再提出APIを追加
  - フロント `TournamentEntryRoster` / `TournamentEntryReview` をAPI連携に変更
- 受け入れ条件:
  - 別端末/別ブラウザでも提出済み名簿が表示される
  - 「提出済み」表示がDB状態と一致する

### Issue 02 (`P0`) ✅ 実装済み (2026-02-25)
- タイトル: チーム恒久メンバーと大会限定ゲストをデータモデルで分離
- 目的: 「手動でメンバー追加」と「名簿提出時のゲスト追加」の責務を分離する
- 方針:
  - チーム管理画面の手動追加は恒久的にチームへ保存（`team_members` 系）
  - 名簿提出画面の手動追加は大会限定ゲストとして保存（`entry_roster_players` 系）
- 受け入れ条件:
  - チーム一覧/メンバー一覧に大会限定ゲストが混入しない
  - 名簿画面には大会限定ゲストが表示される

### Issue 03 (`P0`) ✅ 実装済み (2026-02-25)
- タイトル: 名簿提出画面のUI文言を用途別に分離
- 目的: ユーザーの誤操作を防ぐ
- スコープ:
  - チーム管理側: 「チームメンバーを追加（継続）」
  - 名簿側: 「ゲスト選手を追加（この大会のみ）」
  - 名簿画面に注意文言を追加
- 受け入れ条件:
  - 名称だけで保存先の違いが判別できる

### Issue 04 (`P0`) ✅ 実装済み (2026-02-26)
- タイトル: 保険CSVを提出済み名簿ベースに変更
- 目的: 保険提出用データを大会実提出データと一致させる
- スコープ:
  - `exports#insurance` を `TeamMember` 全件出力から名簿提出データ出力に切替
  - 大会単位・提出日時の条件を整理
- 受け入れ条件:
  - CSV内容が提出済み名簿と一致

### Issue 05 (`P1`) ✅ 実装済み (2026-02-26)
- タイトル: 管理者チーム一覧から通常チーム詳細への遷移追加
- 目的: 承認待ち以外のチームも管理画面で詳細確認可能にする
- スコープ:
  - `/admin/teams/:id` ルート追加
  - 一覧カードクリックで詳細遷移
- 受け入れ条件:
  - 管理者チーム一覧の全カードから詳細へ遷移できる

### Issue 06 (`P1`) ✅ 実装済み (2026-02-26)
- タイトル: 参加ステータス定義の統一（`pending` / `approved`）
- 目的: ホーム・マイページ・結果詳細の件数不一致をなくす
- スコープ:
  - 参加中・出場大会数の判定ルールを統一
  - バッジ文言/色を統一
- 受け入れ条件:
  - 同一ユーザーで画面間の集計値が一致

### Issue 07 (`P1`) ✅ 実装済み (2026-02-26)
- タイトル: Frontendテスト失敗の修復
- 目的: ルーティング/認証まわりの回帰検知を復旧
- 対象:
  - `src/pages/admin/AdminTournaments.test.jsx`
  - `src/pages/admin/AdminNotifications.test.jsx`
  - `src/routes/guards.test.jsx`
  - `src/pages/app/Teams.test.jsx`
- 受け入れ条件:
  - `npm test -- --run` が全件成功

### Issue 08 (`P1`) ✅ 実装済み (2026-02-26)
- タイトル: Backendテスト実行環境の整備
- 目的: request specをローカル/CIで安定実行可能にする
- スコープ:
  - PostgreSQLテスト環境手順を整備
  - 実行手順をドキュメント化
- 受け入れ条件:
  - `bundle exec rspec` が実行可能

### Issue 09 (`P2`) ✅ 実装済み (2026-02-26)
- タイトル: ドキュメント更新（models/api/flow）
- 目的: 実装と設計ドキュメントの同期
- スコープ:
  - `docs/models.md`, `docs/api.md`, `docs/flow.md` 更新
  - 招待コード仕様（`TS-xxxxxx`）を明記

### Issue 10 (`P2`) ✅ 実装済み (2026-02-26)
- タイトル: 大会別エントリー取得のN+1改善
- 目的: パフォーマンス改善
- スコープ:
  - `AppHome` / `MyPage` の `tournaments/:id/entries/me` 多重呼び出しを集約API化

### Issue 11 (`P2`) ✅ 実装済み (2026-02-26)
- タイトル: 旧認証ヘルパー整理（`frontend/src/lib/auth.js`）
- 目的: 死蔵コードの削除または統合
- スコープ:
  - 未使用なら削除、使用中なら `AuthContext` に統合

---

## 対応履歴（2026-02-24）

### Fix: ローカル `/app/home`・`/teams` 取得失敗時の原因可視化
- 事象:
  - 画面上で「ホーム情報の取得に失敗しました」「チーム一覧の取得に失敗しました」のみ表示され、原因判別が困難
- 原因:
  - API疎通失敗時（例: `http://localhost:3000` 未起動）と401/その他エラーを同一文言で扱っていた
- 修正:
  - `frontend/src/lib/api.js` でネットワーク失敗時に `code: network_error` を付与
  - `frontend/src/pages/app/AppHome.jsx` でエラー種別別メッセージ化
  - `frontend/src/pages/app/Teams.jsx` でエラー種別別メッセージ化
- 確認観点:
  - API停止時に「APIサーバー未起動の可能性」文言が表示されること
  - 401時にログイン状態確認導線が維持されること

## 対応履歴（2026-02-25）

### Issue01-03 実装
- 名簿提出を `sessionStorage` 保存からAPI保存へ移行
  - 追加: `entry_rosters` / `entry_roster_players`
  - 追加API: `GET/POST /tournaments/:tournament_id/entry_roster`
- チーム手動追加メンバーをサーバー永続化
  - 追加: `team_manual_members`
  - 追加API: `POST/PATCH/DELETE /teams/:team_id/manual_members/:id`
- UI文言を用途別に分離
  - チーム管理: 恒久メンバー追加
  - 名簿提出: ゲスト選手追加（この大会のみ）

### Issue04-06 実装
- 保険CSVを提出済み名簿ベースへ変更
  - `exports#insurance` を `entry_rosters` / `entry_roster_players` 参照に切替
  - `tournament_id` クエリで大会単位出力に対応
- 管理者チーム導線を整備
  - 承認待ち詳細導線と承認待ち0件時メッセージを維持
- 参加ステータス判定を共通化
  - `frontend/src/lib/entryStatus.js` を追加
  - Home / MyPage / Teams の参加中判定と表示を同一基準化

## 対応履歴（2026-02-26）

### Issue07-09 実装
- Frontendテスト失敗を修復
  - 対象: `AdminTournaments.test.jsx` / `AdminNotifications.test.jsx` / `guards.test.jsx` / `Teams.test.jsx`
  - 結果: `npm test -- --run` 全件成功（30 files / 38 tests）
- Backendテスト実行環境を整備
  - `backend/README.md` に PostgreSQL 前提の test DB 作成・移行手順を明記
  - `bundle exec rspec` がローカルで実行可能（42 examples / 0 failures）を確認
- 実装同期ドキュメント更新
  - `docs/models.md` を現行モデルに同期
  - `docs/api.md` を現行ルート・名簿提出仕様に同期
  - `docs/flow.md` を恒久メンバー/大会限定ゲスト分離フローに同期
  - 招待コード仕様 `TS-xxxxxx` を明記

### Issue10-11 実装
- 大会エントリー取得のN+1改善（AppHome / MyPage）
  - 追加API: `GET /tournament_entries/me_bulk?tournament_ids=...`
  - `AppHome` / `MyPage` は `entries/me` 多重呼び出しから集約API呼び出しへ移行
  - request spec 追加: `spec/requests/tournament_entries_spec.rb`
- 旧認証ヘルパ整理
  - 未使用ファイル `frontend/src/lib/auth.js` を削除
  - 既存実装は `AuthContext` に一本化
