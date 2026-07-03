"use client";

export default function Error({ reset }) {
  return (
    <div className="oops">
      <img src="/kame-sorry.png" alt="" />
      <h1>ごめんね、エラーが起きたみたい</h1>
      <p>少し待ってからもう一度試してみてください。</p>
      <button className="mk-btn primary" onClick={() => reset()}>もう一度ためす</button>
    </div>
  );
}
