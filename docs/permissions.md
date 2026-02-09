# 権限マトリクス（MVP）

## 役割
- admin: 運営
- captain: チーム代表
- member: チームメンバー
- guest: 未ログイン

## 画面/機能別の権限

### 公開（guest可）
- 大会一覧閲覧
- 大会詳細閲覧
- 過去大会結果閲覧
- お知らせ一覧閲覧

### 一般ユーザー（member/captain）
- アカウント登録/ログイン
- プロフィール閲覧/編集（本人のみ）
- チーム一覧閲覧（チーム名/代表名/過去成績）
- チーム作成
- 参加コードによるチーム参加申請
- 参加申請の取り下げ（本人）
- 大会申込の閲覧（自分のチームのみ）
- 大会の試合結果/順位表閲覧

### チームメンバー（member）
- 所属チーム詳細の閲覧
- 所属チームのメンバー一覧閲覧
- 大会画像の閲覧/ダウンロード（参加大会のみ）

### チーム代表（captain）
- 所属チームの参加申請の承認/却下
- メンバー削除
- 代表移譲
- 大会参加申込（チーム単位）
- 大会参加申込のキャンセル（締切内）
- Stripe決済開始（カード決済）

### 運営（admin）
- 大会作成/編集
- 大会参加申込の承認/却下
- 試合作成/編集
- 結果入力/順位表更新
- チーム/メンバー管理（代表移譲を含む）
- 保険名簿CSV出力
- お知らせ作成
- 個別連絡送信
- 画像アップロード/削除
- 決済状況確認/返金処理

## API権限サマリ

### Auth
- POST /auth/login: guest
- POST /auth/logout: member/captain/admin
- POST /auth/register: guest

### Users
- GET /users/me: member/captain/admin
- PATCH /users/me: member/captain/admin（本人のみ）

### Teams
- GET /teams: member/captain/admin
- POST /teams: member/captain/admin
- GET /teams/:id: team member only
- PATCH /teams/:id: captain/admin
- POST /teams/:id/join-requests: member/captain/admin
- GET /teams/:id/join-requests: captain/admin
- PATCH /team-join-requests/:id: captain/admin
- POST /teams/:id/transfer-captain: captain/admin
- DELETE /team-members/:id: captain/admin

### Tournaments
- GET /tournaments: guest
- GET /tournaments/:id: guest
- POST /tournaments: admin
- PATCH /tournaments/:id: admin

### Tournament Entries
- POST /tournaments/:id/entries: captain
- GET /tournament-entries: admin
- PATCH /tournament-entries/:id: admin
- POST /tournament-entries/:id/cancel: captain

### Matches / Results
- GET /tournaments/:id/matches: guest
- POST /tournaments/:id/matches: admin
- PATCH /matches/:id: admin
- POST /matches/:id/result: admin

### Payments
- POST /payments/stripe/checkout: captain
- POST /payments/:id/refund: admin
- POST /webhooks/stripe: Stripe only

### Announcements / Messages
- GET /announcements: guest
- POST /announcements: admin
- POST /messages: admin

### Tournament Images
- GET /tournaments/:id/images: tournament participants only
- POST /tournaments/:id/images: admin
- DELETE /tournament-images/:id: admin

