# zoom-discord-notifier

Zoom ミーティングへの入室を Discord に通知する Cloudflare Workers アプリ。

## 目次

- [システム構成](#システム構成)
- [前提条件](#前提条件)
- [セットアップ](#セットアップ)
- [開発](#開発)

## システム構成

```text
Zoom ミーティング（参加者入室）
    ↓ meeting.participant_joined イベント
Zoom Webhook（Zoom Marketplace アプリ）
    ↓ HTTPS POST（署名付き）
Cloudflare Workers（本リポジトリ）
    ↓ 署名検証 → イベント整形
Discord Incoming Webhook
    ↓
Discord チャンネルに通知メッセージ表示
```

## 前提条件

- Node.js 22 以上
- Cloudflare アカウント（無料プラン可）
- Zoom Marketplace アカウント
- Discord サーバーの管理権限

## セットアップ

### 1. Zoom Marketplace アプリの作成

1. https://marketplace.zoom.us にアクセスする
2. 「Build App」から「Webhook only」を選択する
3. Event Subscriptions に `meeting.participant_joined` を追加する
4. 「Secret Token」と「Verification Token」を控えておく
5. Webhook URL は Cloudflare Workers のデプロイ後に設定する

### 2. Discord Incoming Webhook の作成

1. 通知先チャンネルの設定を開く
2. 「連携サービス」から「ウェブフック」を選択する
3. 「新しいウェブフック」を作成する
4. Webhook URL を控えておく

### 3. Cloudflare アカウントの準備

1. https://dash.cloudflare.com でアカウントを作成する
2. Workers 用の API トークンを発行する
3. アカウント ID を確認する

### 4. 環境変数の設定

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

| 変数名 | 内容 |
|---|---|
| `ZOOM_SECRET_TOKEN` | Zoom Webhook の検証トークン |
| `ZOOM_WEBHOOK_SECRET_TOKEN` | Zoom 署名検証用シークレット |
| `DISCORD_WEBHOOK_URL` | Discord Incoming Webhook の URL |

### 5. デプロイ

手動デプロイは以下のコマンドで実行する。

```bash
npm ci
npm run deploy
```

### 6. GitHub Actions（自動デプロイ）

`main` ブランチへの push 時に Cloudflare Workers へ自動デプロイされる。

リポジトリの Settings > Secrets and variables > Actions に以下を登録する。

| Secret 名 | 内容 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers 用 API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

## 開発

```bash
npm ci
npm run dev      # ローカル開発サーバー起動
npm run lint     # lint 実行
npm run test     # テスト実行
```
