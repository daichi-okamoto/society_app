# 環境変数一覧（MVP）

## 共通
- `APP_ENV` : `development` / `production`
- `APP_BASE_URL` : アプリのベースURL
- `APP_HOST` : RailsのメールURLホスト
- `APP_PORT` : RailsのメールURLポート（開発用）
- `CORS_ORIGINS` : 許可するフロントのオリジン（カンマ区切り）

## DB（Postgres）
- `DATABASE_URL`

## Rails（秘密情報）
- `SECRET_KEY_BASE`
- `ADMIN_SIGNUP_CODE`（管理者登録用の招待コード）

## Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLIC_KEY`（フロント用）

## Cloudflare R2
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ENDPOINT`
- `R2_PUBLIC_BASE_URL`（署名URL生成のベース）

## SMTP（メール送信）
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_AUTH`（例: `plain`）
- `SMTP_STARTTLS`（`true` / `false`）
