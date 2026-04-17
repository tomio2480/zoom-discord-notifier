# zoom-discord-notifier

Zoom ミーティングへの入室・退室・終了を Discord に通知する Cloudflare Workers アプリ。

## 目次

- [システム構成](#システム構成)
- [前提条件](#前提条件)
- [セットアップ](#セットアップ)
- [開発](#開発)

## システム構成

```text
Zoom ミーティング（入室・退室・終了）
    ↓ Webhook イベント
Zoom Webhook（Zoom Marketplace アプリ）
    ↓ HTTPS POST（署名付き）
Cloudflare Workers（本リポジトリ）
    ↓ 署名検証 → イベント整形 → 参加者数管理（KV）
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

### 1. Cloudflare アカウントの準備とデプロイ

Workers の URL を先に確定させる。Zoom の Webhook URL 設定に必要。

1. https://dash.cloudflare.com でアカウントを作成する
   - 「Build and scale apps globally」を選択する
   - 「Connect git repo or use template」（WORKERS COMPUTE）を選択する
   - 「Start with Hello World」を選択する
   - Worker name を `zoom-discord-notifier` に変更して「Deploy」を押す（`wrangler.toml` の `name` と一致させる）
2. API トークンを発行する
   - プロフィールアイコンから「My Profile」>「API Tokens」>「Create Token」を開く
   - 「Edit Cloudflare Workers」テンプレートを使用する（ **Global API Key ではない** ）
   - 「アカウント リソース」で自分のアカウントを選択する
   - トークンの値を控えておく（作成直後のみ表示される）
3. アカウント ID を確認する
   - ダッシュボード URL の `https://dash.cloudflare.com/<ここ>` で確認できる
4. KV namespace を作成する

```bash
npx wrangler kv namespace create PARTICIPANT_STORE
```

表示された `id` を `wrangler.toml` の `kv_namespaces` に設定する。

5. リポジトリのコードをデプロイする

```bash
npm ci
npm run deploy
```

デプロイ後の URL（`https://zoom-discord-notifier.<subdomain>.workers.dev`）を控えておく。

**GitHub Actions で自動デプロイする場合：**

リポジトリの Settings > Secrets and variables > Actions の **「Repository secrets」** （Environment secrets ではない）に以下を登録する。

| Secret 名 | 内容 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 手順 2 で発行した API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | 手順 3 で確認したアカウント ID |

`main` ブランチへの push 時に自動デプロイされる。

### 2. Zoom Marketplace アプリの作成

1. https://marketplace.zoom.us にアクセスする
2. 「Build App」から「Webhook only」を選択する
3. Event Subscriptions を ON にして以下のイベントを追加する
   - Participant/Host joined meeting
   - Participant/Host left meeting
   - End Meeting
4. 「Secret Token」と「Verification Token」を控えておく
5. Webhook URL の設定と Validate は手順 5 で行う
6. Information ページで以下を入力する（Activation に必須）
   - Developer contact name（自分の名前）
   - Developer contact email（自分のメールアドレス）
   - Company name（個人利用なら自分の名前で可）

### 3. Discord Incoming Webhook の作成

1. 通知先チャンネルの設定を開く
2. 「連携サービス」から「ウェブフック」を選択する
3. 「新しいウェブフック」を作成する
4. Webhook URL を控えておく

### 4. 環境変数の設定

手順 2, 3 で控えた値と、通知対象のミーティング ID を本番環境に設定する。PowerShell またはターミナルで実行する。

```bash
npx wrangler secret put ZOOM_SECRET_TOKEN
npx wrangler secret put ZOOM_WEBHOOK_SECRET_TOKEN
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler secret put ZOOM_MEETING_ID
npx wrangler secret put MEETING_DISPLAY_NAME  # 省略可
```

各コマンド実行時に値の入力を求められる。

| 変数名 | 必須 | 内容 |
|---|---|---|
| `ZOOM_SECRET_TOKEN` | はい | Zoom Webhook の検証トークン |
| `ZOOM_WEBHOOK_SECRET_TOKEN` | はい | Zoom 署名検証用シークレット |
| `DISCORD_WEBHOOK_URL` | はい | Discord Incoming Webhook の URL |
| `ZOOM_MEETING_ID` | はい | 通知対象のミーティング ID（招待 URL の `/j/` 以降の数字） |
| `MEETING_DISPLAY_NAME` | いいえ | 通知に表示する会議室名（省略時は Zoom の topic を使用） |

ローカル開発では `.dev.vars.example` をコピーして `.dev.vars` を作成する。

```bash
cp .dev.vars.example .dev.vars
```

### 5. Zoom Webhook URL の設定

環境変数の設定が完了してから行う。Validate には `ZOOM_SECRET_TOKEN` が必要なため、手順 4 より前には実行できない。

1. Zoom Marketplace アプリの Event Subscriptions に戻る
2. 「Event notification endpoint URL」に手順 1 で取得した Workers の URL を入力する
3. 「Validate」ボタンを押して検証を通す
4. 「Save」で保存する
5. Activation ページでアプリを有効化する

## 開発

```bash
npm ci
npm run dev       # ローカル開発サーバー起動
npm run lint      # lint 実行
npm run typecheck # 型チェック実行
npm run test      # テスト実行
```
