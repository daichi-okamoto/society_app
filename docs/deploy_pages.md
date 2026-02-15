# Cloudflare Pages本番デプロイ手順（React SPA）

## 1. 前提
- Cloudflareアカウント作成済み
- GitHub連携済み
- フロントコードが `frontend` 配下にある

## 2. 初回デプロイ
1. Cloudflare Dashboardで `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`
2. 対象リポジトリを選択
3. Build設定を以下にする
- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Build output directory: `dist`
4. Deployを実行

## 3. 必須ENV設定（Pages）
Production環境に以下を設定。

- `VITE_API_BASE_URL`（例: `https://<render-api-domain>`）
- `VITE_STRIPE_PUBLIC_KEY`

注記:
- `VITE_` で始まるENVのみクライアントへ注入される
- API URL末尾に `/` は付けない

## 4. ルーティング設定（SPA）
- `frontend/public/_redirects` を配置済み
- ルール: `/* /index.html 200`
- これにより `/teams/1` など直アクセスでも404にならない

## 5. 初回デプロイ後の確認
1. トップ画面が表示される
2. 直リンク確認
```bash
curl -I https://<pages-domain>/teams
curl -I https://<pages-domain>/admin
```
3. ブラウザでログイン画面からAPI接続確認
4. 決済画面で公開キー読込を確認（コンソールエラーがないこと）

## 6. CORS確認（Render側）
PagesドメインをRailsの許可オリジンに登録しておく。

- 例: `https://<project>.pages.dev`
- カスタムドメイン利用時はそのドメインも追加
- Render側ENV `CORS_ORIGINS` にカンマ区切りで設定
  - 例: `https://<project>.pages.dev,https://example.com`

## 7. 本番運用
- `main` へのpushで自動デプロイ
- 緊急時はPagesで特定コミットにロールバック
- Preview環境で事前確認後に本番反映

## 8. トラブルシュート
- `404 (Pages)`:
  - `_redirects` が `dist/_redirects` に含まれているか確認
- `CORS error`:
  - RailsのCORS許可ドメインを確認
- `API接続エラー`:
  - `VITE_API_BASE_URL` の値とプロトコル（https）を確認
- `決済関連エラー`:
  - `VITE_STRIPE_PUBLIC_KEY` の設定を確認
