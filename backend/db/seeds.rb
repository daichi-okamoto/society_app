puts "[seed] start"

def upsert_user!(attrs)
  user = User.find_or_initialize_by(email: attrs.fetch(:email))
  user.assign_attributes(attrs)
  user.password = attrs.fetch(:password) if attrs[:password]
  user.save!
  user
end

def upsert_team!(name:, captain:, created_by:, join_code:)
  team = Team.find_or_initialize_by(name: name)
  team.assign_attributes(
    captain_user_id: captain.id,
    created_by: created_by.id,
    join_code: join_code
  )
  team.save!
  team
end

def upsert_member!(team:, user:, role:)
  member = TeamMember.find_or_initialize_by(team_id: team.id, user_id: user.id)
  member.assign_attributes(role: role, status: :active, joined_at: Time.current)
  member.save!
end

admin = upsert_user!(
  name: "運営 管理者",
  name_kana: "うんえい かんりしゃ",
  birth_date: Date.new(1988, 4, 1),
  phone: "09000000001",
  email: "admin@society-app.local",
  address: "東京都渋谷区",
  role: :admin,
  status: :active,
  password: "password123"
)

captain_a = upsert_user!(
  name: "田中 太郎",
  name_kana: "たなか たろう",
  birth_date: Date.new(1993, 5, 12),
  phone: "09000000002",
  email: "captain-a@society-app.local",
  address: "東京都新宿区",
  status: :active,
  password: "password123"
)

captain_b = upsert_user!(
  name: "鈴木 次郎",
  name_kana: "すずき じろう",
  birth_date: Date.new(1994, 8, 3),
  phone: "09000000003",
  email: "captain-b@society-app.local",
  address: "東京都世田谷区",
  status: :active,
  password: "password123"
)

members = [
  ["伊藤 健", "いとう けん", "member-1@society-app.local"],
  ["高橋 智", "たかはし さとし", "member-2@society-app.local"],
  ["山本 陸", "やまもと りく", "member-3@society-app.local"],
  ["中村 海", "なかむら かい", "member-4@society-app.local"],
  ["小林 蒼", "こばやし あおい", "member-5@society-app.local"],
  ["渡辺 大", "わたなべ だい", "member-6@society-app.local"],
  ["加藤 誠", "かとう まこと", "member-7@society-app.local"],
  ["吉田 蓮", "よしだ れん", "member-8@society-app.local"]
].each_with_index.map do |(name, kana, email), index|
  upsert_user!(
    name: name,
    name_kana: kana,
    birth_date: Date.new(1995, 1, index + 1),
    phone: format("09000001%03d", index),
    email: email,
    address: "東京都",
    status: :active,
    password: "password123"
  )
end

team_a = upsert_team!(name: "渋谷ファルコンズ", captain: captain_a, created_by: admin, join_code: "SHIBU1")
team_b = upsert_team!(name: "新宿ブレイカーズ", captain: captain_b, created_by: admin, join_code: "SHINJ2")
team_live = upsert_team!(name: "FC 渋谷ユナイテッド", captain: captain_a, created_by: admin, join_code: "SHIBU12")
team_yoyogi = upsert_team!(name: "代々木サンダース", captain: members[0], created_by: admin, join_code: "YOYOGI")
team_meguro = upsert_team!(name: "目黒グリフォンズ", captain: members[1], created_by: admin, join_code: "MEGURO")
team_ebisu = upsert_team!(name: "恵比寿スターズ", captain: members[2], created_by: admin, join_code: "EBISU7")

upsert_member!(team: team_a, user: captain_a, role: :captain)
upsert_member!(team: team_b, user: captain_b, role: :captain)
members.first(4).each { |user| upsert_member!(team: team_a, user: user, role: :member) }
members.last(4).each { |user| upsert_member!(team: team_b, user: user, role: :member) }
upsert_member!(team: team_live, user: captain_a, role: :captain)
upsert_member!(team: team_yoyogi, user: members[0], role: :captain)
upsert_member!(team: team_meguro, user: members[1], role: :captain)
upsert_member!(team: team_ebisu, user: members[2], role: :captain)

tournaments = [
  {
    name: "J7 渋谷カップ Vol.12",
    event_date: Date.current,
    venue: "代々木フットサルコート",
    description: "開催中の大会デモデータ"
  },
  {
    name: "平日夜間・新宿ナイトリーグ",
    event_date: Date.current + 7,
    venue: "新宿中央公園",
    description: "未来の予定大会デモデータ"
  },
  {
    name: "U-30限定 チャンピオンシップ",
    event_date: Date.current + 14,
    venue: "豊洲ピッチ",
    description: "未来の予定大会デモデータ"
  },
  {
    name: "エントリー確認用・渋谷ウィンターカップ",
    event_date: Date.current + 10,
    venue: "渋谷スポーツセンター",
    description: "エントリー済み（未開催）画面確認用デモデータ"
  },
  {
    name: "J7 渋谷カップ Vol.11",
    event_date: Date.current - 21,
    venue: "代々木フットサルコート",
    description: "過去大会デモデータ"
  },
  {
    name: "スプリング・オープントーナメント",
    event_date: Date.current - 35,
    venue: "江東フットサルフィールド",
    description: "過去大会デモデータ"
  }
].map do |attrs|
  tournament = Tournament.find_or_initialize_by(name: attrs.fetch(:name))
  tournament.assign_attributes(
    event_date: attrs.fetch(:event_date),
    venue: attrs.fetch(:venue),
    match_half_minutes: 12,
    max_teams: 16,
    entry_fee_amount: 8000,
    entry_fee_currency: "JPY",
    cancel_deadline_date: attrs.fetch(:event_date) - 5,
    description: attrs.fetch(:description)
  )
  tournament.save!
  tournament
end

tournament_today = tournaments.find { |t| t.name == "J7 渋谷カップ Vol.12" }
tournament_future = tournaments.find { |t| t.name == "平日夜間・新宿ナイトリーグ" }
tournament_future_entry_demo = tournaments.find { |t| t.name == "エントリー確認用・渋谷ウィンターカップ" }
tournament_past = tournaments.find { |t| t.name == "J7 渋谷カップ Vol.11" }

entry_today = TournamentEntry.find_or_initialize_by(tournament_id: tournament_today.id, team_id: team_a.id)
entry_today.assign_attributes(status: :approved, applied_at: 3.days.ago, decided_at: 2.days.ago, decided_by: admin.id)
entry_today.save!

entry_future = TournamentEntry.find_or_initialize_by(tournament_id: tournament_future.id, team_id: team_b.id)
entry_future.assign_attributes(status: :pending, applied_at: 1.day.ago)
entry_future.save!

entry_future_demo = TournamentEntry.find_or_initialize_by(tournament_id: tournament_future_entry_demo.id, team_id: team_a.id)
entry_future_demo.assign_attributes(status: :approved, applied_at: 2.days.ago, decided_at: 1.day.ago, decided_by: admin.id)
entry_future_demo.save!

entry_past = TournamentEntry.find_or_initialize_by(tournament_id: tournament_past.id, team_id: team_a.id)
entry_past.assign_attributes(status: :approved, applied_at: 30.days.ago, decided_at: 28.days.ago, decided_by: admin.id)
entry_past.save!

past_match = Match.find_or_initialize_by(tournament_id: tournament_past.id, field: "Aコート")
past_match.assign_attributes(
  home_team_id: team_a.id,
  away_team_id: team_b.id,
  kickoff_at: tournament_past.event_date.to_time.change(hour: 10),
  status: :finished
)
past_match.save!

result = MatchResult.find_or_initialize_by(match_id: past_match.id)
result.assign_attributes(home_score: 3, away_score: 1, updated_by: admin.id)
result.save!

[
  {
    home_team_id: team_live.id,
    away_team_id: team_yoyogi.id,
    kickoff_at: tournament_today.event_date.to_time.change(hour: 10, min: 0),
    field: "Aコート",
    status: :finished,
    result: { home_score: 2, away_score: 0 }
  },
  {
    home_team_id: team_live.id,
    away_team_id: team_meguro.id,
    kickoff_at: tournament_today.event_date.to_time.change(hour: 11, min: 30),
    field: "Bコート",
    status: :scheduled
  },
  {
    home_team_id: team_live.id,
    away_team_id: team_ebisu.id,
    kickoff_at: tournament_today.event_date.to_time.change(hour: 13, min: 0),
    field: "Aコート",
    status: :scheduled
  }
].each do |attrs|
  live_match = Match.find_or_initialize_by(
    tournament_id: tournament_today.id,
    kickoff_at: attrs.fetch(:kickoff_at)
  )
  live_match.assign_attributes(
    home_team_id: attrs.fetch(:home_team_id),
    away_team_id: attrs.fetch(:away_team_id),
    field: attrs.fetch(:field),
    status: attrs.fetch(:status)
  )
  live_match.save!

  if attrs[:result]
    live_result = MatchResult.find_or_initialize_by(match_id: live_match.id)
    live_result.assign_attributes(
      home_score: attrs[:result][:home_score],
      away_score: attrs[:result][:away_score],
      updated_by: admin.id
    )
    live_result.save!
  else
    live_match.match_result&.destroy
  end
end

[
  {
    home_team_id: team_a.id,
    away_team_id: team_ebisu.id,
    kickoff_at: tournament_future_entry_demo.event_date.to_time.change(hour: 10, min: 30),
    field: "Aコート",
    status: :finished,
    result: { home_score: 2, away_score: 1 }
  },
  {
    home_team_id: team_yoyogi.id,
    away_team_id: team_meguro.id,
    kickoff_at: tournament_future_entry_demo.event_date.to_time.change(hour: 11, min: 0),
    field: "Bコート",
    status: :scheduled
  }
].each do |attrs|
  demo_match = Match.find_or_initialize_by(
    tournament_id: tournament_future_entry_demo.id,
    kickoff_at: attrs.fetch(:kickoff_at)
  )
  demo_match.assign_attributes(
    home_team_id: attrs.fetch(:home_team_id),
    away_team_id: attrs.fetch(:away_team_id),
    field: attrs.fetch(:field),
    status: attrs.fetch(:status)
  )
  demo_match.save!

  if attrs[:result]
    demo_result = MatchResult.find_or_initialize_by(match_id: demo_match.id)
    demo_result.assign_attributes(
      home_score: attrs[:result][:home_score],
      away_score: attrs[:result][:away_score],
      updated_by: admin.id
    )
    demo_result.save!
  else
    demo_match.match_result&.destroy
  end
end

puts "[seed] done"
