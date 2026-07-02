"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const QTYPES = [
  { t: "ガクチカ", e: "💪" },
  { t: "志望動機", e: "🔥" },
  { t: "自己PR", e: "🌟" },
  { t: "研究内容", e: "🔬" },
  { t: "その他", e: "📄" },
];

const TAG_SUGGEST = [
  "🧩 論理のつながり", "🔍 具体性", "✂️ 文字数の調整", "🎯 企業への刺さり方",
  "📖 読みやすさ", "🏗 構成・順番", "💬 言い回し", "🔥 熱意の伝わり方",
  "🤝 チームでの動き方", "🌱 学び・成長の見せ方", "✏️ 誤字脱字チェック", "❓ 設問に答えているか",
];

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [credits, setCredits] = useState(null);

  const [qtype, setQtype] = useState("ガクチカ");
  const [question, setQuestion] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [extraTags, setExtraTags] = useState([]);

  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const [needPay, setNeedPay] = useState(false);

  const bodyLen = body.replace(/\s/g, "").length;
  const allTags = [...TAG_SUGGEST, ...extraTags];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
      if (data.user) loadCredits(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      if (session?.user) loadCredits(session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadCredits = async (uid) => {
    const { data } = await supabase.from("profiles").select("credits").eq("id", uid).single();
    if (data) setCredits(data.credits);
  };

  const loginGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

  const logout = async () => { await supabase.auth.signOut(); setCredits(null); };

  const toggleTag = (t) =>
    setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);

  const addCustom = () => {
    const t = customTag.trim();
    if (!t) return;
    const tagged = "💡 " + t;
    if (!allTags.includes(tagged)) setExtraTags([...extraTags, tagged]);
    if (!tags.includes(tagged)) setTags([...tags, tagged]);
    setCustomTag("");
  };

  const generate = async () => {
    if (!body.trim()) { setErr("ES本文を貼り付けてね🐢"); return; }
    setErr(""); setOut(null); setNeedPay(false); setLoading(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qtype, question, body,
          tags: tags.map((t) => t.replace(/^\S+\s/, "")),
        }),
      });
      const data = await res.json();
      if (res.status === 402 || data.error === "no_credits") {
        setNeedPay(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setOut({ ...data, qtype, question, body, tags: [...tags], date: new Date().toLocaleDateString("ja-JP") });
      if (typeof data.creditsLeft === "number") setCredits(data.creditsLeft);
    } catch (e) {
      setErr("生成に失敗しました🙇 もう一度試してみてください。(" + (e.message || e) + ")");
    } finally {
      setLoading(false);
    }
  };

  const buy = async (plan) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) location.href = data.url;
  };

  const copy = async (text, key) => {
    try { await navigator.clipboard.writeText(text); }
    catch (_) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(key); setTimeout(() => setCopied(""), 1500);
  };

  const shuLen = out ? (out.shuseiban || "").replace(/\s/g, "").length : 0;

  return (
    <div className="mk">
      {user && (
        <header className="mk-band">
          <div className="mk-band-in">
            <div className="mk-logo"><img src="/kame-pen.png" alt="まるかめ" /></div>
            <div className="mk-title">
              まるかめ ESレビューシート
              <small>MARUKAME ES REVIEW SHEET</small>
            </div>
            {credits !== null && (
              <div className="mk-cred">のこり {credits} 回</div>
            )}
          </div>
        </header>
      )}

      <div className="mk-wrap">
        {/* ---- 未ログイン(オンボーディング) ---- */}
        {authReady && !user && (
          <div className="onb">
            <div className="onb-top">
              <div className="onb-icon onb-in" style={{ animationDelay: "0ms" }}>
                <img src="/kame-pen.png" alt="まるかめ" />
              </div>
              <p className="onb-eyebrow onb-in" style={{ animationDelay: "80ms" }}>まるかめ ESレビューシート</p>
              <h1 className="onb-title onb-in" style={{ animationDelay: "160ms" }}>
                あなたのESに、<br />まるかめの赤ペンを。
              </h1>
            </div>

            <div className="onb-features">
              <div className="onb-row onb-in" style={{ animationDelay: "260ms" }}>
                <span className="onb-emoji">💮</span>
                <div>
                  <b>良いところを、ちゃんと褒める</b>
                  <p>まず伝わっている魅力から教えてくれる</p>
                </div>
              </div>
              <div className="onb-row onb-in" style={{ animationDelay: "340ms" }}>
                <span className="onb-emoji">🔎</span>
                <div>
                  <b>気になる点は「なぜ」まで具体的に</b>
                  <p>読み手がどこで引っかかるかが分かる</p>
                </div>
              </div>
              <div className="onb-row onb-in" style={{ animationDelay: "420ms" }}>
                <span className="onb-emoji">✍️</span>
                <div>
                  <b>まるかめが書いた修正版つき</b>
                  <p>あなたのエピソードのまま、伝わる形に</p>
                </div>
              </div>
            </div>

            <div className="onb-bottom onb-in" style={{ animationDelay: "520ms" }}>
              <button className="onb-cta" onClick={loginGoogle}>
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 34.9 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                Googleではじめる
              </button>
              <p className="onb-note">初回は1回無料 · 登録は30秒</p>
            </div>
          </div>
        )}

        {/* ---- ログイン済み ---- */}
        {user && (
          <>
            <div className="mk-card">
              <div className="mk-step"><span className="n">1</span>設問のタイプは?</div>
              <div className="mk-types">
                {QTYPES.map((q) => (
                  <button key={q.t} className={"mk-type " + (qtype === q.t ? "on" : "")} onClick={() => setQtype(q.t)}>
                    <span className="e">{q.e}</span><span className="t">{q.t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mk-card">
              <div className="mk-step"><span className="n">2</span>設問文を貼ってね</div>
              <div className="mk-hint">文字数制限(例: 400字以内)もそのまま貼ればOK。自動で読み取るよ</div>
              <textarea className="mk-textarea" style={{ minHeight: 64 }} value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例: 学生時代に最も力を入れたことを教えてください(400字以内)" />
            </div>

            <div className="mk-card">
              <div className="mk-step"><span className="n">3</span>ES本文を貼ってね</div>
              <textarea className="mk-textarea" style={{ minHeight: 190 }} value={body}
                onChange={(e) => setBody(e.target.value)} placeholder="書いたESをここにペタッと🐢" />
              <div className="mk-meta"><span className={bodyLen > 0 ? "ok" : ""}>{bodyLen}字</span></div>
            </div>

            <div className="mk-card">
              <div className="mk-step"><span className="n">4</span>とくに見てほしいところは?</div>
              <div className="mk-hint">いくつ選んでもOK。選ばなければ全体をまるっと見るよ</div>
              <div className="mk-tags">
                {allTags.map((t) => (
                  <button key={t} className={"mk-tag " + (tags.includes(t) ? "on" : "")} onClick={() => toggleTag(t)}>{t}</button>
                ))}
              </div>
              <div className="mk-tag-add">
                <input className="mk-tag-input" value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="じぶんで追加もできるよ(例: 数字の使い方)" />
                <button className="mk-tag-btn" onClick={addCustom}>+ 追加</button>
              </div>
            </div>

            <button className="mk-go" onClick={generate} disabled={loading}>
              {loading ? "添削中…" : "🐢 添削してもらう"}
            </button>
            {err && <div className="mk-err">{err}</div>}

            {loading && (
              <div className="mk-card mk-load" style={{ marginTop: 18 }}>
                <img src="/kame-reading.png" alt="" className="mk-loading-img" />
                <p>じっくり読んでいます…(30秒くらいかかるよ)</p>
              </div>
            )}

            {/* ---- 回数切れ → プラン表示 ---- */}
            {needPay && (
              <div className="mk-card" style={{ marginTop: 18, textAlign: "center" }}>
                <img src="/kame-sorry.png" alt="" className="mk-state-img" />
                <p style={{ fontWeight: 900, fontSize: 15 }}>無料分を使い切ったみたい🐢</p>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
                  続けて添削するにはプランを選んでね
                </p>
                <div className="mk-plans">
                  <div className="mk-plan">
                    <div className="p-name">🍡 3回パック</div>
                    <div className="p-price">¥500</div>
                    <div className="p-note">ES提出前の駆け込みに</div>
                    <button className="mk-btn primary" onClick={() => buy("pack")}>これにする</button>
                  </div>
                  <div className="mk-plan">
                    <div className="p-name">🐢 月額プラン(10回/月)</div>
                    <div className="p-price">¥980<span style={{ fontSize: 12 }}>/月</span></div>
                    <div className="p-note">ESラッシュ期はこっちがお得</div>
                    <button className="mk-btn primary" onClick={() => buy("monthly")}>これにする</button>
                  </div>
                </div>
              </div>
            )}

            {/* ---- 結果 ---- */}
            {out && (
              <div className="mk-card" style={{ marginTop: 22 }}>
                <div style={{ textAlign: "center", marginBottom: 6 }}>
                  <img src="/kame-hanamaru.png" alt="添削完了" className="mk-state-img" />
                </div>
                <div className="mk-actions">
                  <button className="mk-btn" onClick={() => window.print()}>🖨 PDFで保存</button>
                </div>

                <div className="mk-sec"><span className="mk-sec-h">🌱 全体所感</span><div className="mk-out">{out.zentai}</div></div>

                <div className="mk-sec">
                  <span className="mk-sec-h">💮 良かった点</span>
                  {(out.yokatta || []).map((k, i) => (
                    <div className="mk-good" key={i}><b>{i + 1}. {k.title}</b><p>{k.body}</p></div>
                  ))}
                </div>

                <div className="mk-sec">
                  <span className="mk-sec-h">🔎 気になった点</span>
                  {(out.kininatta || []).map((k, i) => (
                    <div className="mk-warn" key={i}><b>{i + 1}. {k.title}</b><p>{k.body}</p></div>
                  ))}
                </div>

                <div className="mk-sec">
                  <span className="mk-sec-h">✍️ まるかめならこう書く</span>
                  <div className="mk-actions" style={{ margin: "0 0 8px" }}>
                    <button className="mk-btn primary" onClick={() => copy(out.shuseiban, "s")}>{copied === "s" ? "✅ コピーした!" : "📋 修正版をコピー"}</button>
                    <span className="mk-chip">{shuLen}字</span>
                  </div>
                  <div className="mk-quote">{out.shuseiban}</div>
                </div>

                <div className="mk-sec">
                  <span className="mk-sec-h">🎤 面接で聞かれそうなこと</span>
                  <div className="mk-out">{(out.mensetsu || []).map((m, i) => `${i + 1}. ${m}`).join("\n")}</div>
                </div>

                <div className="mk-sec" style={{ marginBottom: 0 }}>
                  <span className="mk-sec-h">🐢 最後に</span>
                  <div className="mk-out">{out.saigo}</div>
                </div>
              </div>
            )}

            <p style={{ textAlign: "center", marginTop: 24 }}>
              <button className="mk-btn" onClick={logout}>ログアウト</button>
            </p>
          </>
        )}
      </div>

      {/* ---- 印刷用 ---- */}
      {out && (
        <div className="mk-print">
          <div className="pr-band">
            <img src="/kame-pen.png" alt="" style={{ width: 46, height: 46 }} />
            <div>
              <div className="t">まるかめ ESレビューシート</div>
              <div className="s">MARUKAME ES REVIEW SHEET</div>
            </div>
          </div>
          <div className="pr-meta">設問タイプ: {out.qtype} / {out.date}</div>
          {out.question && (<><div className="pr-h">設問</div><div className="pr-body">{out.question}</div></>)}
          <div className="pr-h">原文</div><div className="pr-box">{out.body}</div>
          <div className="pr-h">全体所感</div><div className="pr-body">{out.zentai}</div>
          <div className="pr-h">良かった点</div>
          {(out.yokatta || []).map((k, i) => (<div className="pr-item" key={i}><b>{i + 1}. {k.title}</b>{k.body}</div>))}
          <div className="pr-h">気になった点</div>
          {(out.kininatta || []).map((k, i) => (<div className="pr-item" key={i}><b>{i + 1}. {k.title}</b>{k.body}</div>))}
          <div className="pr-h">まるかめならこう書く</div><div className="pr-box">{out.shuseiban}</div>
          <div className="pr-h">面接で聞かれそうなこと</div>
          <div className="pr-body">{(out.mensetsu || []).map((m, i) => `${i + 1}. ${m}`).join("\n")}</div>
          <div className="pr-h">最後に</div><div className="pr-body">{out.saigo}</div>
          <div className="pr-foot">まるかめ ES添削 🐢 あくまで一意見なので、参考程度に見てもらえたら嬉しいです</div>
        </div>
      )}
    </div>
  );
}
