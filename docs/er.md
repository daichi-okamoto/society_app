# ER図（MVP）

## エンティティ一覧
- users
- teams
- team_members
- team_join_requests
- tournaments
- tournament_entries
- matches
- match_results
- payments
- announcements
- announcement_reads
- messages
- notifications
- notification_targets
- notification_reads

## テーブル定義（主要カラム）

### users
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| name | string | 氏名 |
| name_kana | string | ふりがな |
| birth_date | date | 生年月日 |
| phone | string | 電話 |
| email | string | ユニーク |
| address | string | 住所 |
| role | enum | participant, admin |
| status | enum | active, suspended |
| created_at | datetime | |
| updated_at | datetime | |

### teams
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| name | string | |
| captain_user_id | UUID | FK users.id |
| join_code | string | ユニーク、推測困難 |
| created_by | UUID | FK users.id |
| created_at | datetime | |
| updated_at | datetime | |

### team_members
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| team_id | UUID | FK teams.id |
| user_id | UUID | FK users.id |
| role | enum | captain, member |
| status | enum | active, removed |
| joined_at | datetime | |
| removed_at | datetime | nullable |

### team_join_requests
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| team_id | UUID | FK teams.id |
| user_id | UUID | FK users.id |
| status | enum | pending, approved, rejected |
| requested_at | datetime | |
| decided_at | datetime | nullable |
| decided_by | UUID | FK users.id |

### tournaments
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| name | string | |
| event_date | date | |
| venue | string | |
| match_half_minutes | int | 例: 12 |
| max_teams | int | 例: 15 |
| entry_fee_amount | int | チーム単位の参加費 |
| entry_fee_currency | string | 例: JPY |
| cancel_deadline_date | date | 大会前日が締切（23:59まで） |
| description | text | |
| status | enum | draft, open, closed |
| created_at | datetime | |
| updated_at | datetime | |

### tournament_entries
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| tournament_id | UUID | FK tournaments.id |
| team_id | UUID | FK teams.id |
| status | enum | pending, approved, rejected, cancelled |
| applied_at | datetime | |
| decided_at | datetime | nullable |
| decided_by | UUID | FK users.id |

### matches
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| tournament_id | UUID | FK tournaments.id |
| home_team_id | UUID | FK teams.id |
| away_team_id | UUID | FK teams.id |
| kickoff_at | datetime | |
| field | string | コート番号など |
| status | enum | scheduled, finished |

### match_results
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| match_id | UUID | FK matches.id |
| home_score | int | |
| away_score | int | |
| updated_by | UUID | FK users.id |
| updated_at | datetime | |

### payments
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| tournament_entry_id | UUID | FK tournament_entries.id |
| amount | int | |
| currency | string | 例: JPY |
| method | enum | card, cash |
| status | enum | pending, paid, failed, refunded |
| stripe_payment_intent_id | string | nullable |
| stripe_refund_id | string | nullable |
| refund_amount | int | nullable |
| refund_fee_amount | int | nullable |
| paid_at | datetime | nullable |
| refunded_at | datetime | nullable |

### tournament_images
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| tournament_id | UUID | FK tournaments.id |
| file_url | string | 署名URL or CDN |
| file_name | string | |
| content_type | string | |
| size_bytes | int | |
| uploaded_by | UUID | FK users.id |
| created_at | datetime | |

### announcements
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| title | string | |
| body | text | |
| published_at | datetime | |
| created_by | UUID | FK users.id |

### announcement_reads
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| announcement_id | UUID | FK announcements.id |
| user_id | UUID | FK users.id |
| read_at | datetime | |

### messages
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| from_user_id | UUID | FK users.id |
| to_user_id | UUID | FK users.id |
| subject | string | |
| body | text | |
| sent_at | datetime | |

### notifications
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| title | string | |
| body | text | |
| scheduled_at | datetime | 送信予約 |
| sent_at | datetime | nullable |
| created_by | UUID | FK users.id |

### notification_targets
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| notification_id | UUID | FK notifications.id |
| target_type | enum | all, tournament, team, user |
| target_id | UUID | nullable |

### notification_reads
| column | type | note |
| --- | --- | --- |
| id | UUID | PK |
| notification_id | UUID | FK notifications.id |
| user_id | UUID | FK users.id |
| read_at | datetime | |

## リレーション概要
- users 1 - * team_members
- teams 1 - * team_members
- teams 1 - * team_join_requests
- users 1 - * team_join_requests
- tournaments 1 - * tournament_entries
- teams 1 - * tournament_entries
- tournaments 1 - * matches
- matches 1 - 1 match_results
- tournament_entries 1 - * payments
- tournaments 1 - * tournament_images
- announcements 1 - * announcement_reads
- users 1 - * announcement_reads
- notifications 1 - * notification_targets
- notifications 1 - * notification_reads
- users 1 - * notification_reads

## 制約
- teams.captain_user_id は team_members の captain と一致
- team_members は (team_id, user_id) でユニーク
- team_join_requests は (team_id, user_id, status=pending) でユニーク
- tournament_entries は (tournament_id, team_id) でユニーク
- payments は tournament_entry_id に対して最新1件が有効
- tournament_images は大会参加済みチームのメンバーのみ閲覧可（アプリ側権限制御）

## インデックス設計（MVP）
- users
- uniq_users_email (email)
- idx_users_role (role)
- teams
- uniq_teams_join_code (join_code)
- idx_teams_captain_user_id (captain_user_id)
- team_members
- uniq_team_members_team_user (team_id, user_id)
- idx_team_members_user_id (user_id)
- team_join_requests
- uniq_team_join_requests_pending (team_id, user_id, status) where status='pending'
- idx_team_join_requests_team_id (team_id)
- idx_team_join_requests_user_id (user_id)
- tournaments
- idx_tournaments_event_date (event_date)
- idx_tournaments_status (status)
- tournament_entries
- uniq_tournament_entries (tournament_id, team_id)
- idx_tournament_entries_team_id (team_id)
- idx_tournament_entries_status (status)
- matches
- idx_matches_tournament_id (tournament_id)
- idx_matches_kickoff_at (kickoff_at)
- match_results
- uniq_match_results_match_id (match_id)
- payments
- idx_payments_entry_id (tournament_entry_id)
- idx_payments_status (status)
- announcements
- idx_announcements_published_at (published_at)
- announcement_reads
- uniq_announcement_reads (announcement_id, user_id)
- messages
- idx_messages_to_user_id (to_user_id)
- idx_messages_sent_at (sent_at)

## 外部キー制約（削除ルール）
- teams.captain_user_id -> users.id
- on delete restrict
- teams.created_by -> users.id
- on delete restrict
- team_members.team_id -> teams.id
- on delete cascade
- team_members.user_id -> users.id
- on delete restrict
- team_join_requests.team_id -> teams.id
- on delete cascade
- team_join_requests.user_id -> users.id
- on delete restrict
- team_join_requests.decided_by -> users.id
- on delete set null
- tournament_entries.tournament_id -> tournaments.id
- on delete cascade
- tournament_entries.team_id -> teams.id
- on delete restrict
- tournament_entries.decided_by -> users.id
- on delete set null
- matches.tournament_id -> tournaments.id
- on delete cascade
- matches.home_team_id -> teams.id
- on delete restrict
- matches.away_team_id -> teams.id
- on delete restrict
- match_results.match_id -> matches.id
- on delete cascade
- match_results.updated_by -> users.id
- on delete set null
- payments.tournament_entry_id -> tournament_entries.id
- on delete cascade
- tournament_images.tournament_id -> tournaments.id
- on delete cascade
- tournament_images.uploaded_by -> users.id
- on delete set null
- announcements.created_by -> users.id
- on delete set null
- announcement_reads.announcement_id -> announcements.id
- on delete cascade
- announcement_reads.user_id -> users.id
- on delete cascade
- messages.from_user_id -> users.id
- on delete set null
- messages.to_user_id -> users.id
- on delete cascade
- notifications.created_by -> users.id
- on delete set null
- notification_targets.notification_id -> notifications.id
- on delete cascade
- notification_reads.notification_id -> notifications.id
- on delete cascade
- notification_reads.user_id -> users.id
- on delete cascade

## 状態遷移（MVP）
- team_join_requests.status
- pending -> approved, rejected
- approved, rejected は終端
- tournament_entries.status
- pending -> approved, rejected, cancelled
- approved -> cancelled
- rejected, cancelled は終端
- matches.status
- scheduled -> finished
- match_results は matches.status=finished のとき作成/更新可
- payments.status
- pending -> paid, failed
- paid -> refunded
- failed, refunded は終端
