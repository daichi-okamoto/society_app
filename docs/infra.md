# インフラ構成 / デプロイ手順（MVP / 本番のみ / 永久保存）

## 1. 構成
- フロント: Cloudflare Pages（React SPA）
- バックエンド: Render Web Service（Rails API）
- DB: Render Postgres
- 画像: Cloudflare R2
- 決済: Stripe
- メール: SMTP（SendGrid/Resend等）

## 2. 予算目安
- Render Web + Postgres: 月1,500〜3,000円
- Cloudflare Pages: 0円
- R2: 0〜数百円
- SMTP: 無料枠から開始

## 3. Render（Rails API）設定
1. Renderで `Web Service` を作成
2. Root Directory: `backend`
3. Build Command: `bundle install && bin/rails db:migrate`
4. Start Command: `bundle exec puma -C config/puma.rb`
5. Postgresを接続し `DATABASE_URL` を設定
6. `SECRET_KEY_BASE` を設定
7. `APP_BASE_URL` にフロントURLを設定
8. `APP_HOST` はAPIドメイン、`APP_PORT` は空または `443`

## 4. Cloudflare Pages（React SPA）設定
1. Pagesでプロジェクト作成
2. Root Directory: `frontend`
3. Build Command: `npm ci && npm run build`
4. Build Output Directory: `dist`
5. 環境変数 `VITE_API_BASE_URL` をRender API URLに設定
6. `VITE_STRIPE_PUBLIC_KEY` を設定

## 5. R2 設定
1. バケット作成（例: `society-images`）
2. Access Keyを発行
3. Rails側ENVを設定
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

## 6. Stripe 設定
1. Stripeで本番キーを発行
2. Rails側ENVを設定
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
3. フロント側ENVを設定
- `VITE_STRIPE_PUBLIC_KEY`
4. Webhookエンドポイントを登録
- `https://<APIドメイン>/webhooks/stripe`
- イベント: `checkout.session.completed`, `payment_intent.payment_failed`

## 7. SMTP 設定
- Rails側ENVを設定
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_AUTH`（通常 `plain`）
- `SMTP_STARTTLS`（通常 `true`）

## 8. 接続確認チェックリスト

### APIヘルスチェック
```bash
curl -sS https://<APIドメイン>/healthz
```
期待値:
```json
{"status":"ok"}
```

### API準備状態チェック（外部連携設定）
```bash
curl -sS https://<APIドメイン>/readyz
```
期待値:
- `status: "ok"`（DB接続OK）
- `services.stripe/r2/smtp` が `true`

### DB接続（Renderログ確認）
- デプロイ後ログに `db:migrate` 成功が出る
- API起動エラーがない

### R2疎通（管理者ログイン後）
1. `POST /uploads/presign` を呼ぶ
2. 返却された `upload_url` に `PUT` でアップロード
3. `public_url` で参照できることを確認

### Stripe疎通
1. テスト決済を1件実行
2. Stripe Webhook配信ログが `2xx`
3. Rails側で支払い状態が `paid` に更新

### SMTP疎通
1. 参加申請承認 or 個別連絡を1件実行
2. 受信メールを確認
3. Railsログで送信失敗がないことを確認

## 9. 本番運用ルール
- 本番のみ運用（stagingなし）
- 画像は削除方針が決まるまで永久保存
- DBバックアップはRender標準機能 + 週次エクスポート
- 障害調査は `request_id` でログ追跡

## 10. 具体手順
- Render本番デプロイRunbook: `docs/deploy_render.md`
- Cloudflare Pages本番デプロイRunbook: `docs/deploy_pages.md`
