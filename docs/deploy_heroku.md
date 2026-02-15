# Heroku本番デプロイ手順（Rails API）

## 1. 前提
- Herokuアカウント作成済み
- Heroku CLI インストール済み
- アプリ名: `society_app`
- DBプラン: Heroku Postgres `Mini`

## 2. デプロイ方式（推奨）
モノレポ直デプロイは手順が増えるため、`backend` を別アプリとしてデプロイする。

### 推奨: backend を別リポジトリとしてデプロイ
1. backend を subtree で切り出す
```bash
git subtree split --prefix backend -b heroku-backend
```
2. Heroku アプリ作成
```bash
heroku apps:create society_app
```
3. Heroku にデプロイ
```bash
git push heroku heroku-backend:main
```

## 3. Heroku アドオン追加
```bash
heroku addons:create heroku-postgresql:mini --app society_app
```

## 4. 必須ENV設定（Heroku）
Heroku の Config Vars に以下を設定する。

- `RAILS_ENV=production`
- `RACK_ENV=production`
- `APP_BASE_URL`（フロントURL）
- `APP_HOST`（APIドメイン）
- `CORS_ORIGINS`（Pagesドメイン）
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_AUTH`（例: `plain`）
- `SMTP_STARTTLS`（例: `true`）
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

注記:
- `DATABASE_URL` は Heroku Postgres 追加時に自動設定される
- `SECRET_KEY_BASE` は自動生成される場合があるが、未設定なら `rails secret` で設定する

## 5. Web起動コマンド
Heroku は `Procfile` が無ければ `rails server` を推測する。API だけなら問題ないが、明示する場合は `Procfile` を追加。

`Procfile` 例（backend を別デプロイする場合）:
```
web: bundle exec puma -C config/puma.rb
```

## 6. Dynoプラン設定
Heroku Dashboard -> `Resources` で `Basic` に変更する。

## 7. 初回デプロイ後の確認
1. デプロイログで `db:migrate` 成功を確認
2. ヘルスチェック
```bash
curl -sS https://<heroku-app>.herokuapp.com/healthz
```
3. 準備状態チェック
```bash
curl -sS https://<heroku-app>.herokuapp.com/readyz
```
期待:
- `status` が `ok`
- `services.database` が `true`
- `services.stripe/r2/smtp` が `true`

## 8. 外部連携の接続確認
1. Stripe:
- Webhook URL: `https://<heroku-app>.herokuapp.com/webhooks/stripe`
- イベント: `checkout.session.completed`, `payment_intent.payment_failed`
- Stripe管理画面で配信が `2xx`
2. R2:
- 管理者で `POST /uploads/presign` を実行
- 返却 `upload_url` に `PUT` できること
3. SMTP:
- 参加申請承認 or 個別連絡でメール受信を確認

## 9. 本番運用
- `main` へのデプロイは `git push heroku main`
- ロールバックは `heroku releases:rollback`

## 10. トラブルシュート
- `500` が出る: `heroku logs --tail` で `request_id` を確認
- `readyz` が `degraded`: `DATABASE_URL` / ENV の未設定を確認
- `CORS error`: `CORS_ORIGINS` に Pages ドメインが含まれているか確認
