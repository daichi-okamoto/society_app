# API仕様（実装同期版）

最終更新: 2026-02-26

## 前提
- Base URL: Rails API
- 認証: セッションCookie（Devise）
- 形式: JSON
- エラー形式:
```json
{ "error": { "code": "validation_error", "details": {} } }
```

## Auth
- `POST /auth/register`
- `POST /auth/admin/register`
- `POST /auth/login`
- `POST /auth/logout`

## User
- `GET /users/me`
- `PATCH /users/me`

## Team
- `GET /teams`
  - query: `q`, `status`, `sort`, `limit`, `offset`
  - response:
    - `teams[]`
    - `meta: { total_count, limit, offset, has_more }`
    - `summary: { total_teams, pending_teams }`
- `POST /teams`
  - 作成時に `join_code` は `TS-xxxxxx` 形式で自動発行
- `GET /teams/:id`
- `PATCH /teams/:id`
- `PATCH /teams/:id/moderate`（admin）
  - `decision`: `approve | suspend`
- `POST /teams/:id/transfer_captain`

## Team Join Request
- `POST /teams/:team_id/join_requests`
- `GET /teams/:team_id/join_requests`
- `PATCH /team_join_requests/:id`
- `POST /teams/join-by-code`

### 招待コードフロー
1. 参加者が `join_code` を入力
2. `team_join_requests` に `pending` を作成
3. キャプテン/管理者が `approved` or `rejected`
4. `approved` のみ `team_members` を作成

## Team Manual Member（恒久）
- `POST /teams/:team_id/manual_members`
- `PATCH /teams/:team_id/manual_members/:id`
- `DELETE /teams/:team_id/manual_members/:id`

## Tournament
- `GET /tournaments`
- `GET /tournaments/:id`
- `POST /tournaments`
- `PATCH /tournaments/:id`
- `DELETE /tournaments/:id`

## Tournament Entry
- `POST /tournaments/:tournament_id/entries`
- `GET /tournaments/:tournament_id/entries/me`
- `GET /tournament_entries`
- `PATCH /tournament_entries/:id`
- `POST /tournament_entries/:id/cancel`

## Entry Roster（提出名簿）
- `GET /tournaments/:tournament_id/entry_roster`
  - query: `team_id`（任意）
- `POST /tournaments/:tournament_id/entry_roster`
  - body:
```json
{
  "players": [
    {
      "source": "team_member",
      "team_member_id": 123,
      "position": "MF",
      "jersey_number": 10
    },
    {
      "source": "guest",
      "name": "ゲスト太郎",
      "name_kana": "げすとたろう",
      "phone": "090-0000-0000",
      "email": "guest@example.com",
      "address": "東京都...",
      "position": "FW",
      "jersey_number": 99
    }
  ]
}
```
- 仕様:
  - `source=team_member` は該当チームの `team_members.active` のみ許可
  - `source=guest` は大会限定（チーム恒久データに保存しない）

## Match / Result
- `GET /tournaments/:tournament_id/matches`
- `POST /tournaments/:tournament_id/matches`
- `PATCH /matches/:id`
- `POST /matches/:id/result`

## Payment
- `POST /payments/stripe/checkout`
- `POST /payments/:id/refund`
- `POST /webhooks/stripe`

## Notification / Announcement / Message
- `GET /notifications`
- `GET /notifications/history`
- `POST /notifications`
- `DELETE /notifications/:id`
- `POST /notifications/:id/read`
- `GET /notifications/stream`
- `GET /notifications/admin`
- `GET /announcements`
- `POST /announcements`
- `DELETE /announcements/:id`
- `POST /messages`

## Image / Export / Health
- `GET /tournaments/:tournament_id/images`
- `POST /tournaments/:tournament_id/images`
- `DELETE /tournament_images/:id`
- `POST /uploads/presign`
- `GET /exports/insurance`
  - `entry_rosters` + `entry_roster_players` を正本としてCSV出力
  - query: `tournament_id`（任意）
- `GET /healthz`
- `GET /readyz`
