# API設計（MVP / REST / Rails + Devise）

## 前提
- APIスタイル: REST
- 認証: セッションクッキー（Devise）
- 権限: 運営/admin, 代表/captain, メンバー/member
- 返却形式: JSON
- 日付/時刻: ISO8601

## 共通仕様

### 認証
- ログイン済み: セッションクッキーで認証
- 未ログインでもアクセス可能な公開APIあり（大会結果/画像の閲覧は参加者のみ）

### ページング
- 一覧系は `page` / `per_page` を使用
- response に `meta.pagination` を含める

### エラー形式
```json
{
  "error": {
    "code": "validation_error",
    "message": "Human readable error message",
    "details": {
      "field": ["message"]
    }
  }
}
```

### レスポンス共通
```json
{
  "data": {},
  "meta": {},
  "errors": null
}
```

### 権限表
- admin: 運営
- captain: チーム代表
- member: チームメンバー

### ページング
- 一覧系は `page`（1始まり）と `per_page` を使用
- デフォルト: `page=1`, `per_page=20`
- response に `meta.pagination` を含める

### 共通オブジェクト定義（抜粋）

#### User
```json
{
  "id": "uuid",
  "name": "山田太郎",
  "name_kana": "ヤマダタロウ",
  "birth_date": "1990-01-01",
  "phone": "090-0000-0000",
  "email": "user@example.com",
  "address": "東京都...",
  "role": "participant"
}
```

#### TeamSummary
```json
{
  "id": "uuid",
  "name": "FC Example",
  "captain_name": "山田太郎",
  "past_results": [
    { "tournament_id": "uuid", "tournament_name": "大会名", "rank": 3 }
  ]
}
```

#### TeamDetail（所属チームのみ members を含む）
```json
{
  "id": "uuid",
  "name": "FC Example",
  "join_code": "ABC123",
  "captain_user_id": "uuid",
  "members": [
    { "user_id": "uuid", "name": "山田太郎", "role": "captain" },
    { "user_id": "uuid", "name": "佐藤花子", "role": "member" }
  ]
}
```

#### TournamentSummary
```json
{
  "id": "uuid",
  "name": "大会名",
  "event_date": "2026-05-01",
  "venue": "会場"
}
```

#### TournamentDetail
```json
{
  "id": "uuid",
  "name": "大会名",
  "event_date": "2026-05-01",
  "venue": "会場",
  "match_half_minutes": 12,
  "max_teams": 15,
  "entry_fee_amount": 20000,
  "entry_fee_currency": "JPY",
  "cancel_deadline_date": "2026-04-30",
  "description": "..."
}
```

#### PaginationMeta
```json
{
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 120
  }
}
```

---

## Auth

### POST /auth/login
- 説明: ログイン
- 認可: 公開
- body
```json
{ "email": "user@example.com", "password": "password" }
```
- response
```json
{
  "data": {
    "user": { "id": "...", "name": "...", "role": "participant" }
  }
}
```

### POST /auth/logout
- 説明: ログアウト
- 認可: ログイン必須

### POST /auth/register
- 説明: ユーザー登録
- 認可: 公開
- body
```json
{
  "name": "山田太郎",
  "name_kana": "ヤマダタロウ",
  "birth_date": "1990-01-01",
  "phone": "090-0000-0000",
  "email": "user@example.com",
  "address": "東京都...",
  "password": "password"
}
```
- response
```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "山田太郎",
      "email": "user@example.com"
    }
  }
}
```

---

## Users

### GET /users/me
- 説明: 自分のプロフィール取得
- 認可: ログイン必須
- response
```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "山田太郎",
      "name_kana": "ヤマダタロウ",
      "birth_date": "1990-01-01",
      "phone": "090-0000-0000",
      "email": "user@example.com",
      "address": "東京都..."
    }
  }
}
```

### PATCH /users/me
- 説明: 自分のプロフィール更新
- 認可: 本人のみ
- バリデーション
- 必須: name, name_kana, birth_date, phone, email
- email一意
- birth_dateは過去日付
- response
```json
{
  "data": { "user": { "id": "...", "name": "山田太郎" } }
}
```

---

## Teams

### GET /teams
- 説明: チーム一覧（全チーム）
- 認可: ログイン必須
- query
- page, per_page
- response
```json
{
  "data": {
    "teams": [
      {
        "id": "...",
        "name": "FC Example",
        "captain_name": "山田太郎",
        "past_results": [
          { "tournament_id": "...", "tournament_name": "春大会", "rank": 1 },
          { "tournament_id": "...", "tournament_name": "夏大会", "rank": 3 }
        ]
      }
    ]
  },
  "meta": { "pagination": { "page": 1, "per_page": 20, "total": 120 } }
}
```

### POST /teams
- 説明: チーム作成
- 認可: ログイン必須
- body
```json
{ "name": "FC Example" }
```
- 結果
- 参加コードを自動発行
- 作成者は captain として team_members に登録
- response
```json
{
  "data": {
    "team": {
      "id": "...",
      "name": "FC Example",
      "join_code": "ABC123",
      "captain_user_id": "..."
    }
  }
}
```

### GET /teams/:id
- 説明: チーム詳細
- 認可: チームメンバーのみ
- response
```json
{
  "data": {
    "team": {
      "id": "...",
      "name": "FC Example",
      "captain_user_id": "...",
      "members": [
        { "user_id": "...", "name": "山田太郎", "role": "captain" }
      ]
    }
  }
}
```

### PATCH /teams/:id
- 説明: チーム名更新
- 認可: captain または admin
- response
```json
{ "data": { "team": { "id": "...", "name": "FC Example" } } }
```

### POST /teams/:id/join-requests
- 説明: 参加コードで申請
- 認可: ログイン必須
- body
```json
{ "join_code": "ABC123" }
```
- ルール
- 既に所属している場合は不可
- 同一チームの pending 申請は不可
- response
```json
{
  "data": {
    "join_request": { "id": "...", "status": "pending" }
  }
}
```

### GET /teams/:id/join-requests
- 説明: 参加申請一覧
- 認可: captain または admin
- response
```json
{
  "data": {
    "join_requests": [
      { "id": "...", "user_id": "...", "status": "pending" }
    ]
  }
}
```

### PATCH /team-join-requests/:id
- 説明: 参加申請の承認/却下
- 認可: captain または admin
- body
```json
{ "status": "approved" }
```
- response
```json
{ "data": { "join_request": { "id": "...", "status": "approved" } } }
```

### POST /teams/:id/transfer-captain
- 説明: 代表移譲
- 認可: captain または admin
- body
```json
{ "new_captain_user_id": "..." }
```
- ルール
- 移譲先は既存メンバーのみ
- response
```json
{ "data": { "team": { "id": "...", "captain_user_id": "..." } } }
```

### DELETE /team-members/:id
- 説明: メンバー削除
- 認可: captain または admin
- response
```json
{ "data": { "deleted": true } }
```

---

## Tournaments

### GET /tournaments
- 説明: 大会一覧（公開）
- 認可: 公開
- query
- page, per_page
- response
```json
{
  "data": {
    "tournaments": [
      { "id": "...", "name": "大会名", "event_date": "2026-05-01", "venue": "会場" }
    ]
  },
  "meta": { "pagination": { "page": 1, "per_page": 20, "total": 40 } }
}
```

### GET /tournaments/:id
- 説明: 大会詳細
- 認可: 公開
- response
```json
{
  "data": {
    "tournament": {
      "id": "...",
      "name": "大会名",
      "event_date": "2026-05-01",
      "venue": "会場",
      "match_half_minutes": 12,
      "max_teams": 15,
      "entry_fee_amount": 20000,
      "entry_fee_currency": "JPY",
      "cancel_deadline_date": "2026-04-30"
    }
  }
}
```

### POST /tournaments
- 説明: 大会作成
- 認可: admin
- body
```json
{
  "name": "大会名",
  "event_date": "2026-05-01",
  "venue": "会場",
  "match_half_minutes": 12,
  "max_teams": 15,
  "entry_fee_amount": 20000,
  "entry_fee_currency": "JPY",
  "cancel_deadline_date": "2026-04-30",
  "description": "..."
}
```
- response
```json
{ "data": { "tournament": { "id": "...", "name": "大会名" } } }
```

### PATCH /tournaments/:id
- 説明: 大会更新
- 認可: admin
- response
```json
{ "data": { "tournament": { "id": "...", "name": "大会名" } } }
```

---

## Tournament Entries（大会参加申込）

### POST /tournaments/:id/entries
- 説明: チーム単位の参加申込
- 認可: captain
- body
```json
{ "team_id": "..." }
```
- バリデーション
- チーム人数7人以上
- response
```json
{ "data": { "entry": { "id": "...", "status": "pending" } } }
```

### GET /tournament-entries
- 説明: 申込一覧
- 認可: admin
- query
- page, per_page
- response
```json
{
  "data": {
    "entries": [
      { "id": "...", "team_id": "...", "status": "pending" }
    ]
  },
  "meta": { "pagination": { "page": 1, "per_page": 20, "total": 120 } }
}
```

### PATCH /tournament-entries/:id
- 説明: 申込承認/却下
- 認可: admin
- body
```json
{ "status": "approved" }
```
- response
```json
{ "data": { "entry": { "id": "...", "status": "approved" } } }
```

### POST /tournament-entries/:id/cancel
- 説明: 申込キャンセル
- 認可: captain
- ルール
- 大会前日 23:59 まで
- カード決済は手数料控除して返金
- response
```json
{
  "data": {
    "entry": { "id": "...", "status": "cancelled" },
    "refund": { "amount": 18000, "fee_amount": 2000, "status": "refunded" }
  }
}
```

---

## Matches / Results

### GET /tournaments/:id/matches
- 説明: 試合一覧
- 認可: 公開
- response
```json
{
  "data": {
    "matches": [
      {
        "id": "...",
        "home_team_id": "...",
        "away_team_id": "...",
        "kickoff_at": "2026-05-01T10:00:00+09:00",
        "field": "A",
        "status": "scheduled"
      }
    ]
  }
}
```

### POST /tournaments/:id/matches
- 説明: 試合作成
- 認可: admin
- response
```json
{ "data": { "match": { "id": "..." } } }
```

### PATCH /matches/:id
- 説明: 試合更新
- 認可: admin
- response
```json
{ "data": { "match": { "id": "...", "status": "scheduled" } } }
```

### POST /matches/:id/result
- 説明: 結果入力
- 認可: admin
- body
```json
{ "home_score": 2, "away_score": 1 }
```
- response
```json
{ "data": { "result": { "match_id": "...", "home_score": 2, "away_score": 1 } } }
```

---

## Payments（Stripe）

### POST /payments/stripe/checkout
- 説明: Stripe決済開始
- 認可: captain
- body
```json
{ "tournament_entry_id": "..." }
```
- response
```json
{ "data": { "checkout_url": "https://..." } }
```

### POST /payments/:id/refund
- 説明: 返金処理
- 認可: admin
- response
```json
{ "data": { "payment": { "id": "...", "status": "refunded" } } }
```

### POST /webhooks/stripe
- 説明: Stripe webhook
- 認可: Stripeのみ

---

## Announcements / Messages

### GET /announcements
- 説明: お知らせ一覧
- 認可: 公開
- query
- page, per_page
- response
```json
{
  "data": { "announcements": [ { "id": "...", "title": "..." } ] },
  "meta": { "pagination": { "page": 1, "per_page": 20, "total": 30 } }
}
```

### POST /announcements
- 説明: お知らせ作成
- 認可: admin
- response
```json
{ "data": { "announcement": { "id": "...", "title": "..." } } }
```

### POST /messages
- 説明: 個別連絡
- 認可: admin
- body
```json
{ "to_user_id": "...", "subject": "...", "body": "..." }
```
- response
```json
{ "data": { "message": { "id": "...", "to_user_id": "..." } } }
```

---

## Tournament Images

### GET /tournaments/:id/images
- 説明: 大会画像一覧
- 認可: 参加チームメンバーのみ
- response
```json
{
  "data": {
    "images": [
      {
        "id": "...",
        "file_name": "image1.jpg",
        "download_url": "https://signed-url.example.com/...",
        "content_type": "image/jpeg",
        "size_bytes": 102400
      }
    ]
  }
}
```

### POST /tournaments/:id/images
- 説明: 画像アップロード
- 認可: admin
- 備考
- S3等にアップロードし file_url を保存
- response
```json
{ "data": { "image": { "id": "...", "file_name": "image1.jpg" } } }
```

### DELETE /tournament-images/:id
- 説明: 画像削除
- 認可: admin
- response
```json
{ "data": { "deleted": true } }
```

---

## メール通知（イベント）
- チーム参加申請の承認/却下
- 大会参加申込の承認/却下
- 決済完了/失敗
- キャンセル/返金完了
- 運営からの個別連絡/お知らせ

---

## エラーパターン一覧（MVP）

### 共通エラーコード
- unauthorized: 未ログイン
- forbidden: 権限不足
- not_found: 対象が存在しない
- validation_error: 入力不正
- conflict: 状態競合（重複申請など）
- payment_error: 決済関連の失敗
- rate_limited: 過剰なリクエスト

### Auth
- POST /auth/login
- unauthorized: メールまたはパスワードが不正
- validation_error: 必須項目不足
- POST /auth/register
- validation_error: 必須項目不足/形式不正
- conflict: email が既に存在

### Users
- PATCH /users/me
- validation_error: 必須項目不足、email重複、birth_dateが未来日

### Teams
- GET /teams
- unauthorized: 未ログイン
- POST /teams
- validation_error: name必須/長すぎ
- GET /teams/:id
- forbidden: チームメンバー以外
- not_found: teamが存在しない
- POST /teams/:id/join-requests
- validation_error: 参加コード不正
- conflict: 既に所属、またはpending申請あり
- PATCH /team-join-requests/:id
- forbidden: 代表/運営以外
- not_found: 申請が存在しない
- conflict: 既に承認/却下済み
- POST /teams/:id/transfer-captain
- validation_error: 移譲先がメンバーでない
- conflict: 既に同一代表
- DELETE /team-members/:id
- forbidden: 代表/運営以外
- conflict: 代表本人の削除（移譲前）

### Tournaments
- POST /tournaments
- validation_error: event_dateが過去、max_teams<1、entry_fee_amount<0
- GET /tournaments/:id
- not_found: 大会が存在しない

### Tournament Entries
- POST /tournaments/:id/entries
- forbidden: 代表以外
- validation_error: team_id不正、人数不足（7人未満）
- conflict: 既に申込済み、募集終了、定員超過
- PATCH /tournament-entries/:id
- not_found: 申込が存在しない
- conflict: 既に承認/却下済み
- POST /tournament-entries/:id/cancel
- forbidden: 代表以外
- conflict: 締切超過、未承認の申込、既にキャンセル済み
- payment_error: Stripe返金失敗

### Matches / Results
- POST /tournaments/:id/matches
- validation_error: 同一チーム対戦
- POST /matches/:id/result
- validation_error: スコアが負の値
- not_found: 試合が存在しない

### Payments
- POST /payments/stripe/checkout
- forbidden: 代表以外
- conflict: 既に支払い済み
- payment_error: Stripe決済開始失敗
- POST /payments/:id/refund
- payment_error: Stripe返金失敗
- conflict: 返金対象外（支払い未完了/締切超過）

### Announcements / Messages
- POST /announcements
- validation_error: title/body必須
- POST /messages
- validation_error: to_user_id/subject/body必須

### Tournament Images
- GET /tournaments/:id/images
- forbidden: 大会参加者以外
- POST /tournaments/:id/images
- validation_error: 画像形式/サイズ不正
- DELETE /tournament-images/:id
- not_found: 画像が存在しない

---

## Stripeフロー詳細（Checkout / Webhook / 返金）

### 前提
- 決済対象は `tournament_entries`（チーム単位）
- 決済金額は `tournaments.entry_fee_amount`
- 支払い方法: card or cash
- card の場合のみ Stripe を利用

### Checkoutフロー（card）
1. 代表が `POST /payments/stripe/checkout` を呼ぶ
2. サーバが以下を生成
- Stripe Checkout Session または PaymentIntent
- `payments` レコード（status: pending）
3. レスポンスで `checkout_url` を返す
4. クライアントが `checkout_url` に遷移して決済
5. StripeがWebhookを送信
6. Webhookで支払い結果を確定し `payments.status` を更新

### Webhookイベント
- `checkout.session.completed` or `payment_intent.succeeded`
- 支払い成功
- `payments.status = paid`
- `paid_at` を保存
- `payment_intent_id` を保存

- `payment_intent.payment_failed`
- 支払い失敗
- `payments.status = failed`

### 返金フロー（キャンセル）
1. 代表が `POST /tournament-entries/:id/cancel` を呼ぶ
2. サーバがキャンセル可否を確認
- 大会前日 23:59 以内
- 既にキャンセル済みでない
- 支払い済み/未払いかで分岐
3. card決済の場合
- Stripeで refund を作成
- `payments.status = refunded`
- `refund_amount` と `refund_fee_amount` を保存
4. cashの場合
- `payments.status` は変更なし（`method=cash` のため）
- `tournament_entries.status = cancelled`

### 返金額の扱い
- 返金額 = 支払い額 - 手数料
- 手数料は Stripe で確定した実額を保存

### 状態遷移（支払い）
- pending -> paid -> refunded
- pending -> failed

### 状態遷移（申込）
- pending -> approved -> cancelled
- pending -> rejected

### 想定される失敗ケース
- Webhook未着: 支払い状態が確定しない
- 返金失敗: `payment_error` を返す
- 重複Webhook: 冪等性で二重更新を防止

### 実装上の注意
- Webhook処理は冪等にする
- 決済成功/失敗はWebhookを信頼（フロントの戻りURLは参考扱い）
- 返金はキャンセル処理内でサーバ側から行う

---

## Railsルーティング/コントローラ設計案（MVP）

### ルーティング方針
- `namespace :api` でAPIを分離
- `resources` を基本に、状態遷移系は `member` で明示
- Webhookは `api/webhooks/stripe` に集約

### routes.rb（案）
```ruby
Rails.application.routes.draw do
  namespace :api do
    post "auth/login" => "auth#login"
    post "auth/logout" => "auth#logout"
    post "auth/register" => "auth#register"

    resource :users, only: [] do
      get "me", to: "users#me"
      patch "me", to: "users#update"
    end

    resources :teams, only: [:index, :create, :show, :update] do
      resources :join_requests, only: [:create, :index], controller: "team_join_requests"
      post "transfer_captain", on: :member
    end
    resources :team_join_requests, only: [:update]
    resources :team_members, only: [:destroy]

    resources :tournaments, only: [:index, :show, :create, :update] do
      resources :entries, only: [:create], controller: "tournament_entries"
      resources :matches, only: [:index, :create], controller: "matches"
      resources :images, only: [:index, :create], controller: "tournament_images"
    end
    resources :tournament_entries, only: [:index, :update] do
      post "cancel", on: :member
    end
    resources :matches, only: [:update] do
      post "result", on: :member
    end

    post "payments/stripe/checkout", to: "payments#checkout"
    post "payments/:id/refund", to: "payments#refund"
    post "webhooks/stripe", to: "webhooks#stripe"

    resources :announcements, only: [:index, :create]
    resources :messages, only: [:create]
  end
end
```

### コントローラ対応表
- Api::AuthController
- `login`, `logout`, `register`

- Api::UsersController
- `me`, `update`

- Api::TeamsController
- `index`, `create`, `show`, `update`, `transfer_captain`

- Api::TeamJoinRequestsController
- `create`, `index`, `update`

- Api::TeamMembersController
- `destroy`

- Api::TournamentsController
- `index`, `show`, `create`, `update`

- Api::TournamentEntriesController
- `create`, `index`, `update`, `cancel`

- Api::MatchesController
- `index`, `create`, `update`, `result`

- Api::TournamentImagesController
- `index`, `create`

- Api::PaymentsController
- `checkout`, `refund`

- Api::WebhooksController
- `stripe`

- Api::AnnouncementsController
- `index`, `create`

- Api::MessagesController
- `create`

### 認可フィルタ（例）
- `before_action :authenticate_user!`（公開API以外）
- `before_action :require_admin!`
- `before_action :require_captain!`
- `before_action :require_team_member!`

---

## Realtime Notifications（SSE）

### GET /notifications/stream
- 説明: SSEで通知をリアルタイム配信
- 認可: ログイン必須
- response（SSE）
```
event: notification
data: {"id":"...","title":"もうすぐ試合","body":"10:30開始です","sent_at":"2026-04-01T10:20:00Z"}

```

### GET /notifications
- 説明: 受信した通知の一覧
- 認可: ログイン必須
- query
- page, per_page
- response
```json
{
  "data": {
    "notifications": [
      { "id": "...", "title": "...", "body": "...", "sent_at": "2026-04-01T10:20:00Z", "read_at": null }
    ]
  },
  "meta": { "pagination": { "page": 1, "per_page": 20, "total": 40 } }
}
```

### POST /notifications
- 説明: 通知作成（送信予約含む）
- 認可: admin
- body
```json
{
  "title": "もうすぐ試合",
  "body": "第1試合が10:30に開始します",
  "scheduled_at": "2026-04-01T10:20:00Z",
  "targets": [
    { "target_type": "team", "target_id": "..." }
  ]
}
```
- response
```json
{ "data": { "notification": { "id": "...", "scheduled_at": "2026-04-01T10:20:00Z" } } }
```

### POST /notifications/:id/read
- 説明: 通知既読
- 認可: ログイン必須
- response
```json
{ "data": { "read": true } }
```
