# Security Best Practices Report

## Executive Summary

Rails API と React frontend を対象に、認証・認可、通知、ファイルアップロード周りを優先して確認した。今回のレビューでは、他ユーザー向け通知を任意ユーザーが既読化できる認可不備と、アップロード API がファイル種別・サイズを十分に制限していない問題を確認し、修正済みである。確認した範囲では、これ以外に直ちに悪用しやすい高危険度の脆弱性は見つからなかったが、Rails 側の専用静的解析ツールは未導入のため、継続的な確認が望ましい。

## High Severity

### SEC-001 他ユーザー向け通知を既読化できる認可不備
- Impact: 任意の認証済みユーザーが、対象外の通知 ID を知っていれば既読状態を作成できる。
- Status: Fixed
- Location: [`backend/app/controllers/notifications_controller.rb`](/Users/okamotodaichi/workspace/society_app/backend/app/controllers/notifications_controller.rb):86

`POST /notifications/:id/read` が通知の受信対象者かどうかを確認せずに `NotificationRead` を作成していたため、他ユーザー専用通知でも既読化できる状態だった。現在は `notifications_for_user(current_user)` に含まれる通知だけを `accessible_notification` で解決し、非対象通知は `404` を返すように修正している。

## Medium Severity

### SEC-002 アップロード API のファイル種別・サイズ検証不足
- Status: Fixed
- Location: [`backend/app/controllers/uploads_controller.rb`](/Users/okamotodaichi/workspace/society_app/backend/app/controllers/uploads_controller.rb):4

`/uploads/direct` と `/uploads/presign` がアップロード内容の MIME type やサイズを十分に制限しておらず、想定外のファイルや過大ファイルを保存できる状態だった。現在は JPEG/PNG/WebP のみ許可し、プロフィール画像は 5MB、その他画像は 10MB に制限し、ファイル名もサニタイズしている。

## Validation

- [`backend/spec/requests/notifications_spec.rb`](/Users/okamotodaichi/workspace/society_app/backend/spec/requests/notifications_spec.rb):47
- [`backend/spec/requests/authorization_spec.rb`](/Users/okamotodaichi/workspace/society_app/backend/spec/requests/authorization_spec.rb):110

以下を確認した。

- 他ユーザーの通知を既読化できないこと
- SVG など許可外 MIME type のプロフィール画像アップロードを拒否すること
- サイズ超過のプロフィール画像アップロードを拒否すること

## Residual Risks / Follow-up

- Rails 用の静的解析ツール `brakeman` はこの環境に入っておらず未実行。継続運用では導入して CI に組み込むのが望ましい。
- 現在のレビューはコード読解中心で、認証フロー全体のペネトレーションテストまでは行っていない。
