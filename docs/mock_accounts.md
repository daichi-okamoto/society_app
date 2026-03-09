# 仮データアカウント一覧（開発環境）

最終更新日: 2026-03-04  
対象環境: **ローカル開発DB**

## 前提
- このドキュメントは `backend/db/seeds.rb` の投入データと、開発中に追加したテストアカウントを整理したものです。
- ID はDB状態で変動する可能性があります（ただし現時点の実測値を記載）。
- 本番環境では絶対に同じID/パスワードを使わないでください。

## 1. 共通ログイン情報
- APIログイン: `POST /auth/login`
- 既知パスワード（本ドキュメント掲載アカウント）: `password123`

## 2. Seed由来アカウント（`backend/db/seeds.rb`）

| user_id | role | email | name | phone | password |
|---:|---|---|---|---|---|
| 1 | admin | `admin@society-app.local` | 運営 管理者 | `09000000001` | `password123` |
| 2 | participant | `captain-a@society-app.local` | 田中 太郎 | `08095588125` | `password123` |
| 3 | participant | `captain-b@society-app.local` | 鈴木 次郎 | `09000000003` | `password123` |
| 4 | participant | `member-1@society-app.local` | 伊藤 健 | `09000001000` | `password123` |
| 5 | participant | `member-2@society-app.local` | 高橋 智 | `09000001001` | `password123` |
| 6 | participant | `member-3@society-app.local` | 山本 陸 | `09000001002` | `password123` |
| 7 | participant | `member-4@society-app.local` | 中村 海 | `09000001003` | `password123` |
| 8 | participant | `member-5@society-app.local` | 小林 蒼 | `09000001004` | `password123` |
| 9 | participant | `member-6@society-app.local` | 渡辺 大 | `09000001005` | `password123` |
| 10 | participant | `member-7@society-app.local` | 加藤 誠 | `09000001006` | `password123` |
| 11 | participant | `member-8@society-app.local` | 吉田 蓮 | `09000001007` | `password123` |

## 3. 追加テスト由来アカウント

### 3-1. 管理者テストアカウント
| user_id | role | email | name | phone | password |
|---:|---|---|---|---|---|
| 13 | admin | `admin_test@society-app.local` | テスト管理者 | `09000000000` | `password123` |

### 3-2. 10人チームテストアカウント
| user_id | role | email | name | phone | password |
|---:|---|---|---|---|---|
| 15 | participant | `captain10@example.com` | テスト代表 | `09011112222` | `password123` |
| 16 | participant | `member10_1@example.com` | テストメンバー1 | `09022220001` | `password123` |
| 17 | participant | `member10_2@example.com` | テストメンバー2 | `09022220002` | `password123` |
| 18 | participant | `member10_3@example.com` | テストメンバー3 | `09022220003` | `password123` |
| 19 | participant | `member10_4@example.com` | テストメンバー4 | `09022220004` | `password123` |
| 20 | participant | `member10_5@example.com` | テストメンバー5 | `09022220005` | `password123` |
| 21 | participant | `member10_6@example.com` | テストメンバー6 | `09022220006` | `password123` |
| 22 | participant | `member10_7@example.com` | テストメンバー7 | `09022220007` | `password123` |
| 23 | participant | `member10_8@example.com` | テストメンバー8 | `09022220008` | `password123` |
| 24 | participant | `member10_9@example.com` | テストメンバー9 | `09022220009` | `password123` |

## 4. チーム紐付け（どのアカウントがどのデータを持つか）

### 4-1. キャプテンチーム
| team_id | team_name | captain_user_id | captain_email | join_code | approval_status |
|---:|---|---:|---|---|---|
| 1 | 渋谷ファルコンズ | 2 | `captain-a@society-app.local` | `SHIBU1` | approved |
| 2 | 新宿ブレイカーズ | 3 | `captain-b@society-app.local` | `SHINJ2` | approved |
| 3 | FC 渋谷ユナイテッド | 2 | `captain-a@society-app.local` | `SHIBU12` | approved |
| 4 | 代々木サンダース | 4 | `member-1@society-app.local` | `YOYOGI` | approved |
| 5 | 目黒グリフォンズ | 5 | `member-2@society-app.local` | `MEGURO` | approved |
| 6 | 恵比寿スターズ | 6 | `member-3@society-app.local` | `EBISU7` | approved |
| 8 | FCts | 13 | `admin_test@society-app.local` | `CZKGJ2` | approved |
| 9 | テストFC | 1 | `admin@society-app.local` | `TS-013802` | approved |
| 10 | テストFC10人 | 15 | `captain10@example.com` | `NTECBVSB` | approved |

### 4-2. 10人チームの所属
- キャプテン: `captain10@example.com`（user_id: 15）
- メンバー: `member10_1@example.com` 〜 `member10_9@example.com`（user_id: 16〜24）
- チーム: `テストFC10人`（team_id: 10）

## 5. 大会・エントリー紐付け（主要）

| entry_id | tournament_id | tournament_name | team_id | team_name | status |
|---:|---:|---|---:|---|---|
| 1 | 1 | J7 渋谷カップ Vol.12 | 1 | 渋谷ファルコンズ | approved |
| 2 | 2 | 平日夜間・新宿ナイトリーグ | 2 | 新宿ブレイカーズ | pending |
| 4 | 6 | エントリー確認用・渋谷ウィンターカップ | 1 | 渋谷ファルコンズ | approved |
| 5 | 7 | 第9回高森ソサイチ大会 | 10 | テストFC10人 | pending |
| 6 | 8 | テスト大会 | 10 | テストFC10人 | pending |

## 6. 決済データ（主要）

| payment_id | tournament_entry_id | team_name | tournament_name | status | amount | method |
|---:|---:|---|---|---|---:|---|
| 1 | 5 | テストFC10人 | 第9回高森ソサイチ大会 | pending | 12000 | card |
| 2 | 5 | テストFC10人 | 第9回高森ソサイチ大会 | paid | 12000 | card |
| 3 | 6 | テストFC10人 | テスト大会 | pending | 12000 | card |

## 7. ログイン確認用サンプル

### 管理者ログイン（seed）
```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@society-app.local","password":"password123"}'
```

### 10人チーム代表ログイン
```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"captain10@example.com","password":"password123"}'
```

## 8. 既知パスワードに再統一するコマンド（ローカル用）

必要時に、仮データアカウントのパスワードを `password123` に戻すコマンドです。

```bash
cd backend
bin/rails runner '
targets=%w[
  admin@society-app.local captain-a@society-app.local captain-b@society-app.local
  member-1@society-app.local member-2@society-app.local member-3@society-app.local
  member-4@society-app.local member-5@society-app.local member-6@society-app.local
  member-7@society-app.local member-8@society-app.local admin_test@society-app.local
  captain10@example.com member10_1@example.com member10_2@example.com member10_3@example.com
  member10_4@example.com member10_5@example.com member10_6@example.com member10_7@example.com
  member10_8@example.com member10_9@example.com
]
User.where(email: targets).find_each do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.save!
end
puts "updated=#{User.where(email: targets).count}"
'
```

