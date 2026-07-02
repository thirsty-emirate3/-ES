# 🐢 まるかめ ESレビューシート

就活ESを、まるかめが優しく具体的に添削するWebサービス。
Googleログイン / 初回1回無料 / 3回パック¥500・月額¥980(10回)。

## 構成

- **Next.js 14** (App Router)
- **Supabase** — Googleログイン認証 + 残り回数(credits)管理
- **Anthropic API** — 添削生成(サーバー側でキー管理、クライアントに露出しない)
- **Stripe** — 都度課金 + サブスク

```
app/
  page.js                  # メイン画面(ログインゲート + 4ステップ入力 + 結果)
  layout.js / globals.css  # まるかめデザイン
  auth/callback/route.js   # Google OAuthコールバック
  api/review/route.js      # 添削生成API(認証・回数チェック・消費)
  api/checkout/route.js    # Stripe Checkoutセッション作成
  api/stripe/webhook/route.js # 決済完了 → 回数付与
lib/supabase/              # Supabaseクライアント
supabase/schema.sql        # profilesテーブル + 自動作成トリガー
```

## セットアップ手順

### 1. Supabase
1. https://supabase.com で新規プロジェクト作成
2. SQL Editor で `supabase/schema.sql` を実行
3. Authentication > Providers > Google を有効化
   - Google Cloud Console で OAuthクライアントを作成し、Client ID / Secret を設定
   - Redirect URL に Supabaseが表示するURLを登録
4. Authentication > URL Configuration の Site URL / Redirect URLs に本番URLと `http://localhost:3000` を追加

### 2. Anthropic
- https://console.anthropic.com で APIキーを発行

### 3. Stripe
1. 商品を2つ作成: 「3回パック ¥500(one-time)」「月額プラン ¥980(recurring)」
2. それぞれの Price ID を `.env` に設定
3. Webhook エンドポイント `https://あなたのドメイン/api/stripe/webhook` を登録
   - イベント: `checkout.session.completed`
   - Signing secret を `STRIPE_WEBHOOK_SECRET` に設定

### 4. 起動
```bash
cp .env.example .env.local   # 値を埋める
npm install
npm run dev
```

### 5. デプロイ(Vercel)
1. このリポジトリをVercelにインポート
2. 環境変数(.env.exampleの全項目)を設定
3. `NEXT_PUBLIC_SITE_URL` を本番URLに変更

## 回数のルール
- 新規登録時: credits = 1(初回無料)
- 添削成功時のみ 1 消費(失敗時は減らない)
- 3回パック購入: +3 / 月額: 請求ごとに +10

## TODO(次のステップ)
- [ ] 添削履歴の保存・マイページ
- [ ] 月額プランの毎月自動付与(現状はcheckout完了時のみ。invoice.paidイベント対応)
- [ ] 解約時のプラン表示切替
- [ ] レート制限(連打対策)
