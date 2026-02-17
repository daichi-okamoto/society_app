# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_02_17_000100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "announcements", force: :cascade do |t|
    t.string "title", null: false
    t.text "body", null: false
    t.datetime "published_at", null: false
    t.bigint "created_by", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["published_at"], name: "index_announcements_on_published_at"
  end

  create_table "match_results", force: :cascade do |t|
    t.bigint "match_id", null: false
    t.integer "home_score", default: 0, null: false
    t.integer "away_score", default: 0, null: false
    t.bigint "updated_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["match_id"], name: "index_match_results_on_match_id"
  end

  create_table "matches", force: :cascade do |t|
    t.bigint "tournament_id", null: false
    t.bigint "home_team_id", null: false
    t.bigint "away_team_id", null: false
    t.datetime "kickoff_at", null: false
    t.string "field", null: false
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["kickoff_at"], name: "index_matches_on_kickoff_at"
    t.index ["tournament_id"], name: "index_matches_on_tournament_id"
  end

  create_table "messages", force: :cascade do |t|
    t.bigint "from_user_id", null: false
    t.bigint "to_user_id", null: false
    t.string "subject", null: false
    t.text "body", null: false
    t.datetime "sent_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["sent_at"], name: "index_messages_on_sent_at"
    t.index ["to_user_id"], name: "index_messages_on_to_user_id"
  end

  create_table "notification_reads", force: :cascade do |t|
    t.bigint "notification_id", null: false
    t.bigint "user_id", null: false
    t.datetime "read_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["notification_id", "user_id"], name: "index_notification_reads_on_notification_id_and_user_id", unique: true
  end

  create_table "notification_targets", force: :cascade do |t|
    t.bigint "notification_id", null: false
    t.integer "target_type", null: false
    t.bigint "target_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["notification_id"], name: "index_notification_targets_on_notification_id"
    t.index ["target_type", "target_id"], name: "index_notification_targets_on_target_type_and_target_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.string "title", null: false
    t.text "body", null: false
    t.datetime "scheduled_at", null: false
    t.datetime "sent_at"
    t.bigint "created_by", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["sent_at"], name: "index_notifications_on_sent_at"
  end

  create_table "payments", force: :cascade do |t|
    t.bigint "tournament_entry_id", null: false
    t.integer "amount", null: false
    t.string "currency", default: "JPY", null: false
    t.integer "method", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "stripe_payment_intent_id"
    t.string "stripe_refund_id"
    t.integer "refund_amount"
    t.integer "refund_fee_amount"
    t.datetime "paid_at"
    t.datetime "refunded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_payments_on_status"
    t.index ["tournament_entry_id"], name: "index_payments_on_tournament_entry_id"
  end

  create_table "team_join_requests", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.bigint "user_id", null: false
    t.integer "status", default: 0, null: false
    t.datetime "requested_at"
    t.datetime "decided_at"
    t.bigint "decided_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["team_id", "user_id", "status"], name: "idx_join_requests_pending"
    t.index ["team_id"], name: "index_team_join_requests_on_team_id"
    t.index ["user_id"], name: "index_team_join_requests_on_user_id"
  end

  create_table "team_members", force: :cascade do |t|
    t.bigint "team_id", null: false
    t.bigint "user_id", null: false
    t.integer "role", default: 1, null: false
    t.integer "status", default: 0, null: false
    t.datetime "joined_at"
    t.datetime "removed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["team_id", "user_id"], name: "index_team_members_on_team_id_and_user_id", unique: true
    t.index ["team_id"], name: "index_team_members_on_team_id"
    t.index ["user_id"], name: "index_team_members_on_user_id"
  end

  create_table "teams", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "captain_user_id", null: false
    t.string "join_code", null: false
    t.bigint "created_by", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["captain_user_id"], name: "index_teams_on_captain_user_id"
    t.index ["join_code"], name: "index_teams_on_join_code", unique: true
  end

  create_table "tournament_entries", force: :cascade do |t|
    t.bigint "tournament_id", null: false
    t.bigint "team_id", null: false
    t.integer "status", default: 0, null: false
    t.datetime "applied_at"
    t.datetime "decided_at"
    t.bigint "decided_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["team_id"], name: "index_tournament_entries_on_team_id"
    t.index ["tournament_id", "team_id"], name: "index_tournament_entries_on_tournament_id_and_team_id", unique: true
    t.index ["tournament_id"], name: "index_tournament_entries_on_tournament_id"
  end

  create_table "tournament_images", force: :cascade do |t|
    t.bigint "tournament_id", null: false
    t.string "file_url", null: false
    t.string "file_name", null: false
    t.string "content_type", null: false
    t.integer "size_bytes", null: false
    t.bigint "uploaded_by", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tournament_id"], name: "index_tournament_images_on_tournament_id"
  end

  create_table "tournaments", force: :cascade do |t|
    t.string "name", null: false
    t.date "event_date", null: false
    t.string "venue", null: false
    t.integer "match_half_minutes", default: 12, null: false
    t.integer "max_teams", default: 15, null: false
    t.integer "entry_fee_amount", default: 0, null: false
    t.string "entry_fee_currency", default: "JPY", null: false
    t.date "cancel_deadline_date", null: false
    t.text "description"
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "active_entry_teams_count", default: 0, null: false
    t.index ["event_date"], name: "index_tournaments_on_event_date"
    t.index ["status"], name: "index_tournaments_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "name_kana", null: false
    t.date "birth_date", null: false
    t.string "phone", null: false
    t.string "address"
    t.integer "role", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "announcements", "users", column: "created_by"
  add_foreign_key "match_results", "matches"
  add_foreign_key "match_results", "users", column: "updated_by"
  add_foreign_key "matches", "teams", column: "away_team_id"
  add_foreign_key "matches", "teams", column: "home_team_id"
  add_foreign_key "matches", "tournaments"
  add_foreign_key "messages", "users", column: "from_user_id"
  add_foreign_key "messages", "users", column: "to_user_id"
  add_foreign_key "notification_reads", "notifications"
  add_foreign_key "notification_reads", "users"
  add_foreign_key "notification_targets", "notifications"
  add_foreign_key "notifications", "users", column: "created_by"
  add_foreign_key "payments", "tournament_entries"
  add_foreign_key "team_join_requests", "teams"
  add_foreign_key "team_join_requests", "users"
  add_foreign_key "team_join_requests", "users", column: "decided_by"
  add_foreign_key "team_members", "teams"
  add_foreign_key "team_members", "users"
  add_foreign_key "teams", "users", column: "captain_user_id"
  add_foreign_key "teams", "users", column: "created_by"
  add_foreign_key "tournament_entries", "teams"
  add_foreign_key "tournament_entries", "tournaments"
  add_foreign_key "tournament_entries", "users", column: "decided_by"
  add_foreign_key "tournament_images", "tournaments"
  add_foreign_key "tournament_images", "users", column: "uploaded_by"
end
