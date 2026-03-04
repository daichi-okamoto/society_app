# Stripe決済ロードマップ

最終更新日: 2026-03-04

## 目的
- 大会エントリー時のカード決済を安定運用する
- ユーザー体験を「外部遷移中心」から「アプリ内完結」に段階移行する

## フェーズ

### Phase 1（実装中）: 現行Checkoutの安定化
- [x] Checkout戻り先を実在ルートへ統一
- [x] 同一エントリーの `pending` Payment 重複作成を防止（再利用）
- [x] 既に `paid` の場合は再Checkoutを作らず完了扱いにする
- [x] 完了画面でWebhook反映済みの支払い状態を取得して表示する
- [x] エラー表示の精度改善（メンバー不足と重複を分離）

実装メモ:
- API
  - `POST /payments/stripe/checkout`
  - `GET /payments/latest?tournament_entry_id=...`
- フロント
  - エントリー確認画面で `already_paid` を考慮
  - 完了画面で `payment=success` 時に `payments/latest` を参照

残タスク:
- [ ] Payment作成時に冪等キーを導入（同時押下対策の強化）
- [ ] `pending` の長期滞留レコードの管理方針を決める

### Phase 2: Embedded Checkout（アプリ内埋め込み）
- [x] Stripe Checkout Sessionを `ui_mode=embedded` で発行
- [x] フロントで埋め込み表示コンポーネント実装
- [ ] キャンセル/失敗/再試行導線をUIに統合
- [ ] E2Eテスト追加（成功・失敗・キャンセル）

### Phase 3: カード登録（保存）
- [x] Stripe CustomerをUserに紐づけ
- [x] SetupIntent API実装
- [x] カード登録/更新/削除UI実装
- [x] 既定カード選択で決済起点を簡略化（登録済みなら直接課金）

### Phase 4: 完全アプリ内決済（Payment Element）
- [x] PaymentIntent API実装
- [x] Payment Elementで確認画面内決済
- [x] 3DS対応とエラーハンドリング最適化

### Phase 5: 運用強化
- [x] 返金フローと監査ログ強化
- [x] 管理画面の入金ステータス可視化
- [x] メトリクス/アラート整備

## Stripe側の設定チェックリスト
- [x] `STRIPE_SECRET_KEY` 設定
- [x] `STRIPE_WEBHOOK_SECRET` 設定
- [x] `stripe listen --forward-to http://localhost:3000/webhooks/stripe` によるローカル受信確認
- [ ] 本番環境のWebhookエンドポイント登録
- [ ] 本番鍵の安全な保管（シークレットマネージャ）
- [ ] フロント環境変数 `VITE_STRIPE_PUBLISHABLE_KEY` の設定

## テスト観点
- カード決済成功時に `Payment.status=paid` へ遷移
- Webhook遅延時に完了画面で「確認中」を表示
- 既決済エントリーで重複Checkoutが作られない
- メンバー不足時に正しいエラー文言が表示される
