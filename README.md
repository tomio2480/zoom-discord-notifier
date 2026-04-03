# zoom-discord-notifier

Zoom ミーティングへの入室を Discord に通知する Cloudflare Workers アプリ

## セットアップ

### 環境変数

ローカル開発では `.dev.vars.example` をコピーして `.dev.vars` を作成する。

```bash
cp .dev.vars.example .dev.vars
```

本番環境では以下のコマンドで設定する。

```bash
wrangler secret put ZOOM_SECRET_TOKEN
wrangler secret put ZOOM_WEBHOOK_SECRET_TOKEN
wrangler secret put DISCORD_WEBHOOK_URL
```

### GitHub Actions（自動デプロイ）

`main` ブランチへのマージ時に Cloudflare Workers へ自動デプロイされる。

リポジトリの Settings > Secrets and variables > Actions に以下を登録する。

| Secret 名 | 内容 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers 用 API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |
