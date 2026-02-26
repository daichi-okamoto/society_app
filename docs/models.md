# モデル設計（実装同期版）

最終更新: 2026-02-26

## ユーザー・チーム

### `users`
- 役割: 認証主体
- 主要項目:
  - `role`: `participant | admin`
  - `status`: `active | suspended`
  - `name`, `name_kana`, `email`, `phone`, `address`

### `teams`
- 役割: チーム本体
- 主要項目:
  - `name`
  - `captain_user_id`
  - `created_by`
  - `join_code`（招待コード）
  - `approval_status`: `pending | approved`
- 招待コード仕様:
  - 形式: `TS-xxxxxx`
  - `xxxxxx` は 6 桁ランダム数字
  - 一意制約あり

### `team_members`
- 役割: ユーザーとチームの所属関係（恒久）
- 主要項目:
  - `team_id`, `user_id`
  - `role`: `captain | member`
  - `status`: `active | removed`
  - `joined_at`
- 制約:
  - `(team_id, user_id)` 一意

### `team_manual_members`
- 役割: アプリ未登録ユーザーの恒久メンバー（チーム管理で手動追加）
- 主要項目:
  - `team_id`
  - `name`, `name_kana`, `phone`
  - 住所関連: `postal_code`, `prefecture`, `city`, `building`
  - `position`, `jersey_number`
- 注意:
  - チーム管理画面の「手動追加」はここに保存される

### `team_join_requests`
- 役割: 招待コード参加申請
- 主要項目:
  - `team_id`, `user_id`
  - `status`: `pending | approved | rejected`
  - `requested_at`, `decided_at`, `decided_by`
- 制約:
  - 既所属ユーザーは申請不可
  - `pending` 重複申請不可

## 大会・エントリー

### `tournaments`
- 役割: 大会マスタ
- 主要項目:
  - `name`, `event_date`, `venue`
  - `max_teams`, `entry_fee_amount`
  - `description`, `rules`, `status`

### `tournament_entries`
- 役割: チームの大会参加申請
- 主要項目:
  - `tournament_id`, `team_id`
  - `status`: `pending | approved | rejected | cancelled`
  - `category`, `captain_name`, `captain_phone`
- 制約:
  - `(tournament_id, team_id)` 一意

### `entry_rosters`
- 役割: 大会エントリーに対する提出名簿ヘッダ（Issue01）
- 主要項目:
  - `tournament_entry_id`
  - `submitted_at`
  - `submitted_by_user_id`
- 制約:
  - `tournament_entry_id` ごとに 1 件

### `entry_roster_players`
- 役割: 提出名簿の選手明細
- 主要項目:
  - `entry_roster_id`
  - `source`: `team_member | guest`
  - `team_member_id`（`team_member` のときのみ）
  - `name`, `name_kana`, `phone`, `email`, `address`
  - `position`, `jersey_number`
- 注意:
  - `guest` は大会限定。チーム恒久メンバーには昇格しない（Issue02）

## 試合・結果・その他

### `matches`
- `tournament_id`, `home_team_id`, `away_team_id`, `kickoff_at`, `status`

### `match_results`
- `match_id`, `home_score`, `away_score`

### `payments`
- `tournament_entry_id`, `amount`, `currency`, `method`, `status`

### `notifications`, `notification_targets`, `notification_reads`
- 通知配信/対象/既読管理

### `announcements`, `messages`
- お知らせ・個別連絡

### `tournament_images`
- 大会画像管理
