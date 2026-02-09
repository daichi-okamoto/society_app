# SSE通知 詳細設計（MVP）

## 目的
- 運営が任意のタイミングで通知を送信できる
- 参加者の画面上にリアルタイムでバナー/バッジ表示
- プッシュ通知は使わない

## 対象と権限
- 通知作成: adminのみ
- 受信: ログインユーザーのみ
- 配信対象は運営が選択

## 配信対象（notification_targets）
- everyone: 全ユーザー
- tournament: 大会参加者全員
- team: 特定チームのメンバー
- user: 特定ユーザー

## 送信タイミング
- scheduled_at による予約送信
- scheduled_at <= now の時点で送信対象に配信

## SSE仕様
- エンドポイント: `GET /notifications/stream`
- 形式: Server-Sent Events
- 再接続: `Last-Event-ID` を利用
- keep-alive: 30秒ごとにコメント送信

### SSEメッセージ形式
```
 event: notification
 data: {"id":"...","title":"...","body":"...","sent_at":"2026-04-01T10:20:00Z"}

```

## 既読管理
- 既読は `POST /notifications/:id/read`
- 未読一覧は `GET /notifications` で取得
- 通知受信時点では未読
- 画面でバナーを閉じると既読にする

## UI仕様（参加者側）
- バナー: 画面上部に一時表示（10秒）
- バッジ: ヘッダのベルアイコンに未読件数
- 通知センター: 未読/既読の一覧

## UI仕様（運営側）
- 通知作成フォーム
- 入力: タイトル/本文/送信時間/対象
- 対象選択: 全体/大会/チーム/ユーザー
- 送信後は一覧に履歴表示

## バリデーション
- title: 必須, 1-100
- body: 必須
- scheduled_at: 必須
- targets: 1件以上必須

## 例外・エラー
- scheduled_at が過去: 即時送信
- targets が空: validation_error
- SSE接続切断: クライアント再接続

## 実装メモ（Rails）
- `ActionController::Live` を使う
- `notifications` テーブルをポーリングして配信 or Redis Pub/Sub
- MVPではDBポーリング + SSEで簡素に
