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

const AXES = {
  "ガクチカ": ["課題の具体性", "主体性", "役割の明確さ", "チームの巻き込み", "行動→結果の納得感", "学びの深さ"],
  "志望動機": ["原体験の強さ", "企業との接続", "学びの具体性", "職種理解", "熱意"],
  "自己PR": ["強みの明確さ", "エピソードの裏付け", "再現性", "企業での活き方", "読みやすさ"],
  "研究内容": ["分かりやすさ", "社会的意義", "用語のかみくだき", "自分の工夫", "企業での活かし方"],
  "その他": ["設問への適合", "具体性", "論理のつながり", "読みやすさ", "独自性"],
};

/* ---- まるかめ診断レーダー(タイプで5角形/6角形が変わる) ---- */
function Radar({ labels, values }) {
  const size = 300, cx = size / 2, cy = size / 2 + 4, r = 92;
  const n = labels.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, ratio) => [cx + Math.cos(angle(i)) * r * ratio, cy + Math.sin(angle(i)) * r * ratio];
  const poly = (ratio) => labels.map((_, i) => pt(i, ratio).join(",")).join(" ");
  const dataPoly = values.map((v, i) => pt(i, Math.max(0.08, Math.min(v, 10) / 10)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label="まるかめ診断チャート">
      {[1, 0.66, 0.33].map((g) => (
        <polygon key={g} points={poly(g)} fill={g === 1 ? "#FFF8E2" : "none"} stroke="#EADFC0" strokeWidth="1.5" />
      ))}
      {labels.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="#EADFC0" strokeWidth="1" />
      ))}
      <polygon points={dataPoly} fill="rgba(127,174,107,.38)" stroke="#5E8F4E" strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = pt(i, Math.max(0.08, Math.min(v, 10) / 10));
        return <circle key={i} cx={x} cy={y} r="4" fill="#5E8F4E" stroke="#FFFDF4" strokeWidth="2" />;
      })}
      {labels.map((l, i) => {
        const [x, y] = pt(i, 1.28);
        const [, dy] = pt(i, 1);
        return (
          <text key={l} x={x} y={y + (dy > cy ? 8 : 0)} textAnchor="middle" className="radar-label">
            <tspan x={x} dy="0">{l}</tspan>
            <tspan x={x} dy="13" className="radar-score">{values[i]}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

/* ---- 添削結果 = まるかめ先生から返却された答案 ---- */
const SECTIONS = [
  { id: "sec-karte", label: "診断" },
  { id: "sec-soukan", label: "所感" },
  { id: "sec-good", label: "良い点" },
  { id: "sec-warn", label: "気になる点" },
  { id: "sec-rewrite", label: "修正版" },
  { id: "sec-mensetsu", label: "面接" },
];

function ResultView({ data, onPrint }) {
  const [copied, setCopied] = useState("");
  const [rewriteView, setRewriteView] = useState("after");
  const copy = async (text, key) => {
    try { await navigator.clipboard.writeText(text); }
    catch (_) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(key); setTimeout(() => setCopied(""), 1500);
  };
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const labels = data.axes || AXES[data.qtype] || AXES["その他"];
  const scores = Array.isArray(data.scores) && data.scores.length === labels.length ? data.scores : null;
  const avg = scores ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const beforeLen = (data.body || "").replace(/\s/g, "").length;
  const afterLen = (data.shuseiban || "").replace(/\s/g, "").length;
  const showing = rewriteView === "after" ? data.shuseiban : data.body;

  return (
    <div className="sh">
      {/* 表紙: 診断カルテ */}
      <div className="sh-sheet sh-hero" id="sec-karte">
        <div className="sh-stamp" aria-hidden="true">添削済</div>
        <img src="/kame-hanamaru.png" alt="" className="sh-kame" />
        <p className="sh-meta">{data.qtype} · {data.date}</p>
        {avg && (
          <div className="sh-score">
            <svg viewBox="0 0 120 74" className="sh-circle" aria-hidden="true">
              <ellipse cx="60" cy="37" rx="52" ry="28" fill="none" stroke="var(--shu)" strokeWidth="3" strokeLinecap="round" transform="rotate(-3 60 37)" />
              <ellipse cx="60" cy="37" rx="50" ry="26" fill="none" stroke="var(--shu)" strokeWidth="2" strokeLinecap="round" opacity=".45" transform="rotate(2 60 37)" />
            </svg>
            <span className="sh-score-n">{avg}</span>
            <small>/10</small>
          </div>
        )}
        {scores && <Radar labels={labels} values={scores} />}
        {scores && <p className="sh-score-note">スコアはまるかめの読みごたえのめやす。±1点くらいは揺れるよ</p>}
      </div>

      {/* セクションジャンプ */}
      <nav className="sh-nav">
        {SECTIONS.map((sec) => (
          <button key={sec.id} onClick={() => jump(sec.id)}>{sec.label}</button>
        ))}
      </nav>

      <div className="sh-sheet" id="sec-soukan">
        <h3 className="sh-h">全体所感</h3>
        <p className="sh-body">{data.zentai}</p>
      </div>

      <div className="sh-sheet" id="sec-good">
        <h3 className="sh-h">良かった点</h3>
        {(data.yokatta || []).map((k, i) => (
          <div className="sh-item" key={i}>
            <span className="sh-mark good">💮</span>
            <div><b>{k.title}</b><p>{k.body}</p></div>
          </div>
        ))}
      </div>

      <div className="sh-sheet" id="sec-warn">
        <h3 className="sh-h">気になった点</h3>
        {(data.kininatta || []).map((k, i) => (
          <div className="sh-item" key={i}>
            <span className="sh-mark warn">✍️</span>
            <div><b>{k.title}</b><p>{k.body}</p></div>
          </div>
        ))}
      </div>

      <div className="sh-sheet" id="sec-rewrite">
        <h3 className="sh-h">まるかめならこう書く</h3>
        <div className="sh-toggle" role="tablist">
          <button role="tab" className={rewriteView === "before" ? "on" : ""} onClick={() => setRewriteView("before")}>
            原文 <small>{beforeLen}字</small>
          </button>
          <button role="tab" className={rewriteView === "after" ? "on" : ""} onClick={() => setRewriteView("after")}>
            まるかめ版 <small>{afterLen}字</small>
          </button>
        </div>
        <div className={"sh-paper" + (rewriteView === "after" ? " after" : "")}>
          <p>{showing}</p>
        </div>
        <div className="sh-tools">
          <button className="mk-btn primary" onClick={() => copy(data.shuseiban, "s")}>
            {copied === "s" ? "✅ コピーした!" : "📋 まるかめ版をコピー"}
          </button>
        </div>
      </div>

      <div className="sh-sheet" id="sec-mensetsu">
        <h3 className="sh-h">面接で聞かれそうなこと</h3>
        <ol className="rv-qs">
          {(data.mensetsu || []).map((m, i) => <li key={i}>{m}</li>)}
        </ol>
      </div>

      <div className="sh-final">
        <img src="/kame-pen.png" alt="" />
        <div className="sh-bubble">{data.saigo}</div>
      </div>

      <div className="sh-tools" style={{ justifyContent: "center", marginTop: 4 }}>
        <button className="mk-btn" onClick={onPrint}>🖨 PDFで保存</button>
      </div>
    </div>
  );
}

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [credits, setCredits] = useState(null);
  const [tab, setTab] = useState("review"); // review | history

  const [qtype, setQtype] = useState("ガクチカ");
  const [question, setQuestion] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [extraTags, setExtraTags] = useState([]);

  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [err, setErr] = useState("");
  const [needPay, setNeedPay] = useState(false);

  const [history, setHistory] = useState(null);
  const [detail, setDetail] = useState(null);

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

  useEffect(() => {
    if (tab === "history" && user) loadHistory();
  }, [tab, user]);

  const loadCredits = async (uid) => {
    const { data } = await supabase.from("profiles").select("credits").eq("id", uid).single();
    if (data) setCredits(data.credits);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, qtype, question, created_at, result")
      .order("created_at", { ascending: false })
      .limit(30);
    setHistory(data || []);
  };

  const loginGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  const logout = async () => { await supabase.auth.signOut(); setCredits(null); setHistory(null); };

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
    setPhase("まるかめがESを読んでいます…");
    const timer = setTimeout(() => setPhase("赤ペンを入れています…"), 14000);
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
      if (res.status === 402 || data.error === "no_credits") { setNeedPay(true); return; }
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setOut({
        ...data, qtype, question, body,
        date: new Date().toLocaleDateString("ja-JP"),
      });
      if (typeof data.creditsLeft === "number") setCredits(data.creditsLeft);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErr("生成に失敗しました🙇 もう一度試してみてください。(" + (e.message || e) + ")");
    } finally {
      clearTimeout(timer);
      setLoading(false); setPhase("");
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

  const rowToData = (row) => ({
    ...(row.result || {}),
    qtype: row.qtype, question: row.question, body: row.body,
    date: new Date(row.created_at).toLocaleDateString("ja-JP"),
  });

  const activeResult = detail || out;

  return (
    <div className="mk">
      {/* ---- 添削中フルスクリーン ---- */}
      {loading && (
        <div className="loading-screen" role="status">
          <img src="/kame-reading.png" alt="" className="mk-loading-img" />
          <p className="ls-phase">{phase}</p>
          <p className="ls-note">30秒ほどかかるよ。このまま待っててね</p>
          <div className="ls-dots"><span /><span /><span /></div>
        </div>
      )}

      {user && (
        <header className="mk-band">
          <div className="mk-band-in">
            <div className="mk-logo"><img src="/kame-pen.png" alt="まるかめ" /></div>
            <div className="mk-title">
              まるかめ ESレビューシート
              <small>MARUKAME ES REVIEW SHEET</small>
            </div>
            {credits !== null && <div className="mk-cred">のこり {credits} 回</div>}
          </div>
        </header>
      )}

      <div className={"mk-wrap" + (user ? " has-tabbar" : "")}>
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
                <div><b>良いところを、ちゃんと褒める</b><p>まず伝わっている魅力から教えてくれる</p></div>
              </div>
              <div className="onb-row onb-in" style={{ animationDelay: "340ms" }}>
                <span className="onb-emoji">🔎</span>
                <div><b>気になる点は「なぜ」まで具体的に</b><p>読み手がどこで引っかかるかが分かる</p></div>
              </div>
              <div className="onb-row onb-in" style={{ animationDelay: "420ms" }}>
                <span className="onb-emoji">✍️</span>
                <div><b>まるかめが書いた修正版つき</b><p>あなたのエピソードのまま、伝わる形に</p></div>
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

        {/* ---- 添削タブ ---- */}
        {user && tab === "review" && !out && (
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

            <button className="mk-go" onClick={generate} disabled={loading}>🐢 添削してもらう</button>
            {err && <div className="mk-err">{err}</div>}

            {needPay && (
              <div className="mk-card" style={{ marginTop: 18, textAlign: "center" }}>
                <img src="/kame-sorry.png" alt="" className="mk-state-img" />
                <p style={{ fontWeight: 900, fontSize: 15 }}>無料分を使い切ったみたい🐢</p>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>続けて添削するにはプランを選んでね</p>
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
          </>
        )}

        {/* ---- 添削結果 ---- */}
        {user && tab === "review" && out && (
          <>
            <button className="rv-back" onClick={() => setOut(null)}>← 新しく添削する</button>
            <ResultView data={out} onPrint={() => window.print()} />
          </>
        )}

        {/* ---- 履歴タブ ---- */}
        {user && tab === "history" && !detail && (
          <>
            <h2 className="hist-title">きろく</h2>
            {history === null && <p className="hist-empty">読み込み中…</p>}
            {history && history.length === 0 && (
              <div className="hist-zero">
                <img src="/kame-reading.png" alt="" className="mk-state-img" />
                <p>まだ添削のきろくがないよ。<br />最初のESを見せてね🐢</p>
                <button className="mk-btn primary" onClick={() => setTab("review")}>添削してもらう</button>
              </div>
            )}
            {history && history.map((row) => {
              const sc = row.result?.scores;
              const avg = Array.isArray(sc) && sc.length ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) : null;
              return (
                <button key={row.id} className="hist-item" onClick={() => setDetail(rowToData(row))}>
                  <div className="hist-left">
                    <span className="hist-qtype">{QTYPES.find((q) => q.t === row.qtype)?.e || "📄"} {row.qtype}</span>
                    <span className="hist-q">{row.question || "(設問未記入)"}</span>
                    <span className="hist-date">{new Date(row.created_at).toLocaleDateString("ja-JP")}</span>
                  </div>
                  {avg && <span className="hist-avg">{avg}<small>/10</small></span>}
                  <span className="hist-arrow">›</span>
                </button>
              );
            })}
            <p style={{ textAlign: "center", marginTop: 28 }}>
              <button className="mk-btn" onClick={logout}>ログアウト</button>
            </p>
          </>
        )}

        {/* ---- 履歴詳細 ---- */}
        {user && tab === "history" && detail && (
          <>
            <button className="rv-back" onClick={() => setDetail(null)}>← きろく一覧へ</button>
            <ResultView data={detail} onPrint={() => window.print()} />
          </>
        )}
      </div>

      {/* ---- 下部タブバー ---- */}
      {user && (
        <nav className="tabbar">
          <button className={tab === "review" ? "on" : ""} onClick={() => { setTab("review"); setDetail(null); }}>
            <span className="tb-ico">✍️</span>添削
          </button>
          <button className={tab === "history" ? "on" : ""} onClick={() => { setTab("history"); }}>
            <span className="tb-ico">📚</span>きろく
          </button>
        </nav>
      )}

      {/* ---- 印刷用 ---- */}
      {activeResult && (
        <div className="mk-print">
          <div className="pr-band">
            <img src="/kame-pen.png" alt="" style={{ width: 46, height: 46 }} />
            <div>
              <div className="t">まるかめ ESレビューシート</div>
              <div className="s">MARUKAME ES REVIEW SHEET</div>
            </div>
          </div>
          <div className="pr-meta">設問タイプ: {activeResult.qtype} / {activeResult.date}</div>
          {activeResult.question && (<><div className="pr-h">設問</div><div className="pr-body">{activeResult.question}</div></>)}
          <div className="pr-h">原文</div><div className="pr-box">{activeResult.body}</div>
          <div className="pr-h">全体所感</div><div className="pr-body">{activeResult.zentai}</div>
          <div className="pr-h">良かった点</div>
          {(activeResult.yokatta || []).map((k, i) => (<div className="pr-item" key={i}><b>{i + 1}. {k.title}</b>{k.body}</div>))}
          <div className="pr-h">気になった点</div>
          {(activeResult.kininatta || []).map((k, i) => (<div className="pr-item" key={i}><b>{i + 1}. {k.title}</b>{k.body}</div>))}
          <div className="pr-h">まるかめならこう書く</div><div className="pr-box">{activeResult.shuseiban}</div>
          <div className="pr-h">面接で聞かれそうなこと</div>
          <div className="pr-body">{(activeResult.mensetsu || []).map((m, i) => `${i + 1}. ${m}`).join("\n")}</div>
          <div className="pr-h">最後に</div><div className="pr-body">{activeResult.saigo}</div>
          <div className="pr-foot">まるかめ ES添削 🐢 あくまで一意見なので、参考程度に見てもらえたら嬉しいです</div>
        </div>
      )}
    </div>
  );
}
