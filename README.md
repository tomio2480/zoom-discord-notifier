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
