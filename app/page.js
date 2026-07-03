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

/* ---- 幹枝シート = NotebookLM風の展開ツリー ---- */
function InterviewView({ data }) {
  const [openKw, setOpenKw] = useState(() => new Set());
  const [openQ, setOpenQ] = useState(() => new Set());
  const [copied, setCopied] = useState("");
  const toggle = (set, setFn, key) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setFn(next);
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

  return (
    <div className="sh">
      <div className="sh-sheet sh-hero">
        <div className="sh-stamp" aria-hidden="true">面接対策</div>
        <img src="/kame-pen.png" alt="" className="sh-kame" />
        <p className="sh-meta">{data.qtype} · {data.date} · 幹枝シート</p>
      </div>

      <div className="sh-sheet">
        <h3 className="sh-h">🌰 一文要約(最初に渡す地図)</h3>
        <p className="tr-ikkabun">{data.ikkabun}</p>
      </div>

      <div className="sh-sheet">
        <h3 className="sh-h">🌳 30秒回答(幹)</h3>
        <div className="sh-paper after"><p>{data.kaito30}</p></div>
        <div className="sh-tools">
          <button className="mk-btn primary" onClick={() => copy(data.kaito30, "k")}>
            {copied === "k" ? "✅ コピーした!" : "📋 30秒回答をコピー"}
          </button>
        </div>
        <p className="tr-hint">全部話さない。ここで面接官に「聞きたい」と思わせるのが幹の役割🐢</p>
      </div>

      <div className="sh-sheet">
        <h3 className="sh-h">🌿 深掘りの枝分かれ</h3>
        <p className="tr-hint" style={{ marginBottom: 14 }}>キーワードをタップすると、面接官の想定質問と答え方がひらくよ</p>
        <div className="tree">
          {(data.miki || []).map((m, mi) => (
            <div className="tr-branch" key={mi}>
              <button className={"tr-kw" + (openKw.has(mi) ? " open" : "")} onClick={() => toggle(openKw, setOpenKw, mi)}>
                <span className="tr-kw-dot" />
                {m.kw}
                <span className="tr-caret">{openKw.has(mi) ? "−" : "+"}</span>
              </button>
              {openKw.has(mi) && (
                <div className="tr-edas">
                  {(m.eda || []).map((e, ei) => {
                    const qk = mi + "-" + ei;
                    return (
                      <div className="tr-eda" key={ei}>
                        <button className={"tr-q" + (openQ.has(qk) ? " open" : "")} onClick={() => toggle(openQ, setOpenQ, qk)}>
                          <span className="tr-q-badge">Q</span>{e.q}
                        </button>
                        {openQ.has(qk) && (
                          <div className="tr-a">
                            <p>{e.a}</p>
                            {(e.why || []).map((w, wi) => (
                              <p className="tr-why" key={wi}>{w}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sh-final">
        <img src="/kame-pen.png" alt="" />
        <div className="sh-bubble">面接は暗記じゃなくて枝分かれの準備。どの枝を選ばれても大丈夫な状態にしておこうね🐢</div>
      </div>
    </div>
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
        {avg && (
          <a
            className="mk-btn"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `まるかめに${data.qtype}を添削してもらったら ${avg}/10 だった🐢\n#まるかめES添削\n`
            )}&url=${encodeURIComponent("https://es-henna-three.vercel.app")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            🐦 スコアをシェア
          </a>
        )}
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

  const [iQtype, setIQtype] = useState("ガクチカ");
  const [iQuestion, setIQuestion] = useState("");
  const [iBody, setIBody] = useState("");
  const [iOut, setIOut] = useState(null);
  const [iErr, setIErr] = useState("");
  const [iNeedPay, setINeedPay] = useState(false);

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

  // ゲスト時に入力したESを、ログイン後に復元して自動で添削開始
  useEffect(() => {
    if (!user) return;
    let d = null;
    try { d = localStorage.getItem("mk-draft"); } catch (_) {}
    if (!d) return;
    try { localStorage.removeItem("mk-draft"); } catch (_) {}
    try {
      const pl = JSON.parse(d);
      setQtype(pl.qtype); setQuestion(pl.question); setBody(pl.body); setTags(pl.tags || []);
      setTab("review");
      generate(pl);
    } catch (_) {}
  }, [user]);

  const loadCredits = async (uid) => {
    const { data } = await supabase.from("profiles").select("credits").eq("id", uid).single();
    if (data) setCredits(data.credits);
  };

  const loadHistory = async () => {
    const [r, i] = await Promise.all([
      supabase.from("reviews").select("id, qtype, question, body, created_at, result")
        .order("created_at", { ascending: false }).limit(30),
      supabase.from("interview_sheets").select("id, qtype, question, body, created_at, result")
        .order("created_at", { ascending: false }).limit(30),
    ]);
    const merged = [
      ...(r.data || []).map((row) => ({ ...row, kind: "review" })),
      ...(i.data || []).map((row) => ({ ...row, kind: "interview" })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setHistory(merged);
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

  const generate = async (payloadArg) => {
    const pl = payloadArg || { qtype, question, body, tags };
    if (!pl.body.trim()) { setErr("ES本文を貼り付けてね🐢"); return; }
    if (!user) {
      // ゲスト: 入力を保存してログインへ。戻ってきたら自動で添削が始まる
      try { localStorage.setItem("mk-draft", JSON.stringify(pl)); } catch (_) {}
      loginGoogle();
      return;
    }
    setErr(""); setOut(null); setNeedPay(false); setLoading(true);
    setPhase("まるかめがESを読んでいます…");
    const timer = setTimeout(() => setPhase("赤ペンを入れています…"), 14000);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qtype: pl.qtype, question: pl.question, body: pl.body,
          tags: pl.tags.map((t) => t.replace(/^\S+\s/, "")),
        }),
      });
      const data = await res.json();
      if (res.status === 402 || data.error === "no_credits") { setNeedPay(true); return; }
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setOut({
        ...data, qtype: pl.qtype, question: pl.question, body: pl.body,
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

  const generateInterview = async () => {
    if (!iBody.trim()) { setIErr("ES本文を貼り付けてね🐢"); return; }
    setIErr(""); setIOut(null); setINeedPay(false); setLoading(true);
    setPhase("ESから幹をつくっています…");
    const timer = setTimeout(() => setPhase("枝分かれを伸ばしています…"), 14000);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qtype: iQtype, question: iQuestion, body: iBody }),
      });
      const data = await res.json();
      if (res.status === 402 || data.error === "no_credits") { setINeedPay(true); return; }
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setIOut({ ...data, qtype: iQtype, date: new Date().toLocaleDateString("ja-JP") });
      if (typeof data.creditsLeft === "number") setCredits(data.creditsLeft);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setIErr("生成に失敗しました🙇 もう一度試してみてください。(" + (e.message || e) + ")");
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
    kind: row.kind || "review",
    qtype: row.qtype, question: row.question, body: row.body,
    date: new Date(row.created_at).toLocaleDateString("ja-JP"),
  });

  const activeResult = detail || out;

  const reviewForm = (
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

      <button className="mk-go" onClick={() => generate()} disabled={loading}>
        {user ? "🐢 添削してもらう" : "🐢 無料で添削してもらう"}
      </button>
      {!user && (
        <p className="guest-note">ボタンを押すとGoogleログインに進むよ。入力した内容はそのまま引き継がれる</p>
      )}
      {err && <div className="mk-err">{err}</div>}
    </>
  );

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
        {/* ---- 未ログイン: そのまま試せる ---- */}
        {authReady && !user && (
          <>
            <div className="guest-hero">
              <div className="onb-icon onb-in" style={{ animationDelay: "0ms", width: 84, height: 84 }}>
                <img src="/kame-pen.png" alt="まるかめ" style={{ width: 64, height: 64 }} />
              </div>
              <p className="onb-eyebrow onb-in" style={{ animationDelay: "70ms" }}>まるかめ ESレビューシート</p>
              <h1 className="onb-title onb-in" style={{ animationDelay: "140ms", fontSize: "clamp(23px,6.4vw,30px)" }}>
                あなたのESに、<br />まるかめの赤ペンを。
              </h1>
              <div className="guest-badges onb-in" style={{ animationDelay: "220ms" }}>
                <span>💮 褒めて</span><span>🔍 なぜまで直して</span><span>🎤 面接まで</span>
              </div>
              <p className="guest-free onb-in" style={{ animationDelay: "280ms" }}>初回1回無料 · 下に貼るだけ⬇</p>
            </div>
            <div className="onb-in" style={{ animationDelay: "340ms" }}>
              {reviewForm}
            </div>
            <p className="onb-legal" style={{ textAlign: "center" }}>
              はじめることで<a href="/terms">利用規約</a>と<a href="/privacy">プライバシーポリシー</a>に同意したことになります
            </p>
          </>
        )}

        {/* ---- 添削タブ ---- */}
        {user && tab === "review" && !out && (
          <>
            {reviewForm}

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

        {/* ---- 面接タブ ---- */}
        {user && tab === "interview" && !iOut && (
          <>
            <div className="mk-card tr-intro">
              <img src="/kame-reading.png" alt="" />
              <div>
                <b>幹枝(みきえだ)シート</b>
                <p>ESを貼ると、面接用の「30秒回答」と「深掘りの枝分かれ」に変換するよ。ESは通るのに面接で落ちる人のための機能🐢</p>
              </div>
            </div>

            <div className="mk-card">
              <div className="mk-step"><span className="n">1</span>設問のタイプは?</div>
              <div className="mk-types">
                {QTYPES.map((q) => (
                  <button key={q.t} className={"mk-type " + (iQtype === q.t ? "on" : "")} onClick={() => setIQtype(q.t)}>
                    <span className="e">{q.e}</span><span className="t">{q.t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mk-card">
              <div className="mk-step"><span className="n">2</span>ES本文を貼ってね</div>
              <div className="mk-hint">添削済みでも、書いたままでもOK。これを面接用に組み替えるよ</div>
              <textarea className="mk-textarea" style={{ minHeight: 190 }} value={iBody}
                onChange={(e) => setIBody(e.target.value)} placeholder="面接対策したいESをペタッと🐢" />
            </div>

            <button className="mk-go" onClick={generateInterview} disabled={loading}>🎤 幹枝シートをつくる</button>
            {iErr && <div className="mk-err">{iErr}</div>}

            {iNeedPay && (
              <div className="mk-card" style={{ marginTop: 18, textAlign: "center" }}>
                <img src="/kame-sorry.png" alt="" className="mk-state-img" />
                <p style={{ fontWeight: 900, fontSize: 15 }}>無料分を使い切ったみたい🐢</p>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>続けるにはプランを選んでね</p>
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
                    <div className="p-note">選考ラッシュ期はこっちがお得</div>
                    <button className="mk-btn primary" onClick={() => buy("monthly")}>これにする</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {user && tab === "interview" && iOut && (
          <>
            <button className="rv-back" onClick={() => setIOut(null)}>← 新しくつくる</button>
            <InterviewView data={iOut} />
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
              const isInt = row.kind === "interview";
              return (
                <button key={row.kind + row.id} className="hist-item" onClick={() => setDetail(rowToData(row))}>
                  <div className="hist-left">
                    <span className="hist-qtype">
                      {isInt ? "🎤 面接対策" : `${QTYPES.find((q) => q.t === row.qtype)?.e || "📄"} 添削`} · {row.qtype}
                    </span>
                    <span className="hist-q">{row.question || (isInt ? row.result?.ikkabun : "(設問未記入)") || ""}</span>
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
            {detail.kind === "interview"
              ? <InterviewView data={detail} />
              : <ResultView data={detail} onPrint={() => window.print()} />}
          </>
        )}
      </div>

      {/* ---- 下部タブバー ---- */}
      {user && (
        <nav className="tabbar">
          <button className={tab === "review" ? "on" : ""} onClick={() => { setTab("review"); setDetail(null); }}>
            <span className="tb-ico">✍️</span>添削
          </button>
          <button className={tab === "interview" ? "on" : ""} onClick={() => { setTab("interview"); setDetail(null); }}>
            <span className="tb-ico">🎤</span>面接
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
