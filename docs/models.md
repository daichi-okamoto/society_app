# モデル/バリデーション設計（MVP / Rails）

## users
- バリデーション
- name: 必須, 1-50
- name_kana: 必須, 1-50
- birth_date: 必須, 過去日付
- phone: 必須, 形式チェック（数字とハイフン）
- email: 必須, 一意, 形式チェック
- address: 任意, 1-200
- role: 必須, enum(participant, admin)
- status: 必須, enum(active, suspended)

## teams
- バリデーション
- name: 必須, 1-50
- captain_user_id: 必須
- join_code: 必須, 一意, 6-12英数字
- created_by: 必須
- ルール
- captain_user_id は team_members の captain と一致

## team_members
- バリデーション
- team_id: 必須
- user_id: 必須
- role: 必須, enum(captain, member)
- status: 必須, enum(active, removed)
- 一意制約
- team_id + user_id

## team_join_requests
- バリデーション
- team_id: 必須
- user_id: 必須
- status: 必須, enum(pending, approved, rejected)
- 一意制約
- team_id + user_id + status(pending)
- ルール
- 既所属なら作成不可

## tournaments
- バリデーション
- name: 必須
- event_date: 必須, 未来日
- venue: 必須
- match_half_minutes: 必須, 1以上
- max_teams: 必須, 1以上
- entry_fee_amount: 必須, 0以上
- entry_fee_currency: 必須, 例 JPY
- cancel_deadline_date: 必須, event_date前日

## tournament_entries
- バリデーション
- tournament_id: 必須
- team_id: 必須
- status: 必須, enum(pending, approved, rejected, cancelled)
- 一意制約
- tournament_id + team_id
- ルール
- チーム人数7人以上
- 定員超過不可

## matches
- バリデーション
- tournament_id: 必須
- home_team_id: 必須
- away_team_id: 必須
- kickoff_at: 必須
- status: 必須, enum(scheduled, finished)
- ルール
- home_team_id != away_team_id

## match_results
- バリデーション
- match_id: 必須
- home_score: 必須, 0以上
- away_score: 必須, 0以上

## payments
- バリデーション
- tournament_entry_id: 必須
- amount: 必須, 0以上
- currency: 必須
- method: 必須, enum(card, cash)
- status: 必須, enum(pending, paid, failed, refunded)
- ルール
- cardの場合のみ stripe_payment_intent_id 必須
- refundはstatus=paidのみ

## announcements
- バリデーション
- title: 必須, 1-100
- body: 必須
- published_at: 必須

## messages
- バリデーション
- from_user_id: 必須
- to_user_id: 必須
- subject: 必須, 1-100
- body: 必須

## tournament_images
- バリデーション
- tournament_id: 必須
- file_url: 必須
- file_name: 必須
- content_type: 必須, image/jpeg or image/png
- size_bytes: 必須, 上限設定
- uploaded_by: 必須

