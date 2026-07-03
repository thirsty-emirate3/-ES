import Link from "next/link";

export default function NotFound() {
  return (
    <div className="oops">
      <img src="/kame-sorry.png" alt="" />
      <h1>ページが見つからないみたい</h1>
      <p>URLが変わったか、はじめからなかったページかも。</p>
      <Link href="/" className="mk-btn primary">ホームにもどる</Link>
    </div>
  );
}
