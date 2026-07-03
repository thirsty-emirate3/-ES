import Link from "next/link";

export const metadata = { title: "特定商取引法に基づく表記 | まるかめ ESレビューシート" };

export default function Tokushoho() {
  return (
    <div className="legal">
      <h1>特定商取引法に基づく表記</h1>
      <table className="legal-table">
        <tbody>
          <tr><th>販売事業者</th><td>【氏名を記載】</td></tr>
          <tr><th>運営責任者</th><td>【氏名を記載】</td></tr>
          <tr><th>所在地</th><td>請求があった場合、遅滞なく開示します</td></tr>
          <tr><th>電話番号</th><td>請求があった場合、遅滞なく開示します</td></tr>
          <tr><th>連絡先</th><td>X(旧Twitter)「まるかめ」アカウントのDM</td></tr>
          <tr><th>販売価格</th><td>各購入画面に表示(3回パック500円、月額プラン980円/月・いずれも税込)</td></tr>
          <tr><th>商品代金以外の必要料金</th><td>インターネット接続に係る通信料</td></tr>
          <tr><th>支払方法</th><td>クレジットカード等(Stripe決済)</td></tr>
          <tr><th>提供時期</th><td>決済完了後、ただちに利用可能</td></tr>
          <tr><th>返品・キャンセル</th><td>デジタルコンテンツの性質上、提供後の返金には原則応じられません。役務が提供されなかった場合を除きます。月額プランはいつでも解約でき、次回請求分から停止されます。</td></tr>
        </tbody>
      </table>
      <p className="legal-date">2026年7月制定</p>
      <p><Link href="/">← ホームにもどる</Link></p>
    </div>
  );
}
