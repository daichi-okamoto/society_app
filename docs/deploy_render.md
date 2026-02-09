# Render本番デプロイ手順（Rails API）

## 1. 前提
- Renderアカウント作成済み
- GitHub連携済み
- このリポジトリに `render.yaml` が存在する

## 2. 初回デプロイ（Blueprint）
1. Renderで `New` -> `Blueprint` を選択
2. 対象リポジトリを選択
3. `render.yaml` を読み込んで作成
4. Web Service `society-app-api` と DB `society-app-db` が生成されることを確認

## 3. 必須ENV設定
`society-app-api` に以下を設定する（`sync: false` 項目）。

- `APP_BASE_URL`
- `APP_HOST`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

## 4. 初回デプロイ後の確認
1. Deployログで `bundle install` と `db:migrate` 成功を確認
2. ヘルスチェック
```bash
curl -sS https://<render-api-domain>/healthz
```
3. 準備状態チェック
```bash
curl -sS https://<render-api-domain>/readyz
```
期待:
- `status` が `ok`
- `services.database` が `true`
- `services.stripe/r2/smtp` が `true`

## 5. 外部連携の接続確認
1. Stripe:
- Webhook URL: `https://<render-api-domain>/webhooks/stripe`
- イベント: `checkout.session.completed`, `payment_intent.payment_failed`
- Stripe管理画面で配信が `2xx`
2. R2:
- 管理者で `POST /uploads/presign` を実行
- 返却 `upload_url` に `PUT` できること
3. SMTP:
- 参加申請承認 or 個別連絡でメール受信を確認

## 6. デプロイ運用
- 通常は `main` へのマージで自動デプロイ
- 緊急時はRender画面で `Manual Deploy` -> `Deploy latest commit`
- リリース失敗時は直前コミットを再デプロイ

## 7. トラブルシュート
- `500` が出る: Renderログで `request_id` をキーに検索
- `readyz` が `degraded`: DB接続 (`DATABASE_URL`) を確認
- `readyz` で `stripe/r2/smtp=false`: ENV未設定 or typo を修正
