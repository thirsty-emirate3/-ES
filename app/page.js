"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const IC = {
  pen: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><path d="M12 18v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  heart: <path d="M19.5 13.6 12 21l-7.5-7.4A5.2 5.2 0 1 1 12 6.4a5.2 5.2 0 1 1 7.5 7.2z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
};
const TIPS = [
  "ガクチカは全部話すと逆効果。面接では「幹」だけ渡して、深掘りは「枝」で返すのがコツ🐢",
  "一文で説明できないエピソードは、面接でも話が散らばりやすい。まずは一文要約から",
  "「なぜ?」を3回重ねると、行動の説明が「考え方」に変わる。面接官が見ているのはそこ",
  "学びが「粘り強さ」だけだと少しもったいない。仕事でどう再現できるかまで言えると強い",
  "志望動機は「企業名を変えても通じる文章」になっていないかチェック。原体験と企業の接続が命",
  "数字は魔法。「頑張った」より「180秒→120秒」のほうが100倍伝わる",
  "課題→施策→結果のつながりに飛びがないか、声に出して読むと気づけるよ",
  "ESの設問には必ず意図がある。「何を確かめたい質問か」から逆算して書こう",
];

const CONF = ["#F3C64F", "#EF9086", "#7FAE6B", "#8FC1E3", "#E7A6C7"];

function useReveal(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.querySelectorAll(".sh-sheet").forEach((el) => el.classList.add("sh-vis"));
      return;
    }
    const obs = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("sh-vis"); obs.unobserve(e.target); }
    }), { threshold: 0.1 });
    root.querySelectorAll(".sh-sheet").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {IC[name]}
    </svg>
  );
}

const QTYPES = [
  { t: "ガクチカ", e: "💪" },
  { t: "志望動機", e: "🔥" },
  { t: "自己PR", e: "🌟" },
  { t: "研究内容", e: "🔬" },
  { t: "その他", e: "📄" },
];

const TAG_SUGGEST = [
  "論理のつながり", "具体性", "文字数の調整", "企業への刺さり方",
  "読みやすさ", "構成・順番", "言い回し", "熱意の伝わり方",
  "チームでの動き方", "学び・成長の見せ方", "誤字脱字チェック", "設問に答えているか",
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
      <polygon className="radar-data" points={dataPoly} fill="rgba(127,174,107,.38)" stroke="#5E8F4E" strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = pt(i, Math.max(0.08, Math.min(v, 10) / 10));
        return <circle key={i} className="radar-dot" cx={x} cy={y} r="4" fill="#5E8F4E" stroke="#FFFDF4" strokeWidth="2" />;
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

/* ---- 幹枝の概念図(描画アニメーション付き) ---- */
function MikiEdaDiagram() {
  return (
    <svg viewBox="0 0 340 170" className="med" aria-label="幹枝テクニックの図">
      <path className="med-line med-trunk" d="M28 85 H160" />
      <path className="med-line med-b1" d="M160 85 C 210 85, 230 35, 292 30" />
      <path className="med-line med-b2" d="M160 85 C 220 85, 240 85, 292 85" />
      <path className="med-line med-b3" d="M160 85 C 210 85, 230 135, 292 140" />
      <circle className="med-node med-n0" cx="28" cy="85" r="15" />
      <text className="med-t med-t0" x="28" y="120" textAnchor="middle">あなたのES</text>
      <circle className="med-node med-n1" cx="160" cy="85" r="12" />
      <text className="med-t med-t1" x="160" y="62" textAnchor="middle">30秒の幹</text>
      <circle className="med-leaf med-l1" cx="292" cy="30" r="8" />
      <circle className="med-leaf med-l2" cx="292" cy="85" r="8" />
      <circle className="med-leaf med-l3" cx="292" cy="140" r="8" />
      <text className="med-t med-t2" x="310" y="34" textAnchor="start">なぜ?</text>
      <text className="med-t med-t3" x="310" y="89" textAnchor="start">具体的には?</text>
      <text className="med-t med-t4" x="310" y="144" textAnchor="start">反対は?</text>
    </svg>
  );
}

/* ---- スコアの円形ゲージ ---- */
function ScoreRing({ value }) {
  const r = 19, c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(10, parseFloat(value) || 0));
  return (
    <span className="ring">
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#F0E9D4" strokeWidth="5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--matcha)" strokeWidth="5"
          strokeLinecap="round" strokeDasharray={`${(v / 10) * c} ${c}`}
          transform="rotate(-90 24 24)" />
      </svg>
      <b>{value}</b>
    </span>
  );
}

/* ---- ウィザード進捗: まるかめが道を歩く ---- */
function StepProgress({ step, total }) {
  const pct = (step / (total - 1)) * 100;
  return (
    <div className="wiz-prog" role="progressbar" aria-valuenow={step + 1} aria-valuemax={total}>
      <div className="wiz-track">
        <div className="wiz-fill" style={{ width: `${pct}%` }} />
        <img src="/kame-walk.png" alt="" className="wiz-kame" style={{ left: `${pct}%` }} />
      </div>
      <span className="wiz-count">{step + 1}/{total}</span>
    </div>
  );
}

/* ---- 幹枝シート = NotebookLM風の展開ツリー ---- */
function InterviewView({ data }) {
  const [openKw, setOpenKw] = useState(() => new Set());
  const [openQ, setOpenQ] = useState(() => new Set());
  const [copied, setCopied] = useState("");
  const rootRef = useRef(null);
  useReveal(rootRef);
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
    <div className="sh sh-reveal" ref={rootRef}>
      <div className="sh-sheet sh-hero">
        <div className="sh-stamp" aria-hidden="true">面接対策</div>
        <img src="/kame-pen.png" alt="" className="sh-kame" />
        <p className="sh-meta">{data.qtype} · {data.date} · 幹枝シート</p>
      </div>

      <div className="sh-sheet">
        <h3 className="sh-h2"><em>MIKIEDA 01</em>一文要約 — 最初に渡す地図</h3>
        <p className="tr-ikkabun">{data.ikkabun}</p>
      </div>

      <div className="sh-sheet">
        <h3 className="sh-h2"><em>MIKIEDA 02</em>30秒回答 — 幹</h3>
        <div className="sh-paper after"><p>{data.kaito30}</p></div>
        <div className="sh-tools">
          <button className="mk-btn primary" onClick={() => copy(data.kaito30, "k")}>
            {copied === "k" ? "コピーしました" : "30秒回答をコピー"}
          </button>
        </div>
        <p className="tr-hint">全部話さない。ここで面接官に「聞きたい」と思わせるのが幹の役割🐢</p>
      </div>

      <div className="sh-sheet">
        <h3 className="sh-h2"><em>MIKIEDA 03</em>深掘りの枝分かれ</h3>
        <p className="tr-hint" style={{ marginBottom: 14 }}>キーワードをタップすると、面接官の想定質問と答え方がひらくよ</p>
        <div className="tree">
          {(data.miki || []).map((m, mi) => (
            <div className="tr-branch" key={mi}>
              <button className={"tr-kw" + (openKw.has(mi) ? " open" : "")} onClick={() => toggle(openKw, setOpenKw, mi)}>
                <span className="tr-kw-idx">{mi + 1}</span>
                <span className="tr-kw-t">{m.kw}</span>
                <span className="tr-kw-n">{(m.eda || []).length}問</span>
                <span className={"tr-chev" + (openKw.has(mi) ? " open" : "")}>›</span>
              </button>
              {openKw.has(mi) && (
                <div className="tr-edas">
                  {(m.eda || []).map((e, ei) => {
                    const qk = mi + "-" + ei;
                    return (
                      <div className="tr-eda" key={ei}>
                        <button className={"tr-q" + (openQ.has(qk) ? " open" : "")} onClick={() => toggle(openQ, setOpenQ, qk)}>
                          <span className="tr-q-badge">Q{ei + 1}</span>{e.q}
                        </button>
                        {openQ.has(qk) && (
                          <div className="tr-a">
                            <span className="tr-a-label">こたえ方</span>
                            <p>{e.a}</p>
                            {(e.why || []).map((w, wi) => (
                              <div className="tr-why" key={wi}>
                                <span>↳ さらに深掘りされたら</span>
                                <p>{w.replace(/^さらに『なぜ\?』と聞かれたら:\s*/, "").replace(/^さらに「なぜ\?」と聞かれたら:\s*/, "")}</p>
                              </div>
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

      <div className="sh-tools" style={{ justifyContent: "center", marginTop: 4 }}>
        <button className="mk-btn" onClick={() => window.print()}>PDFで保存</button>
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
  const [disp, setDisp] = useState("0.0");
  const rootRef = useRef(null);
  useReveal(rootRef);
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
  const high = avg !== null && parseFloat(avg) >= 8;

  useEffect(() => {
    if (avg === null) return;
    const target = parseFloat(avg);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisp(avg); return;
    }
    const t0 = performance.now(), dur = 1100;
    let raf;
    const tick = (t) => {
      const pr = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - pr, 3);
      setDisp((target * e).toFixed(1));
      if (pr < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [avg]);

  const beforeLen = (data.body || "").replace(/\s/g, "").length;
  const afterLen = (data.shuseiban || "").replace(/\s/g, "").length;
  const showing = rewriteView === "after" ? data.shuseiban : data.body;

  return (
    <div className="sh sh-reveal" ref={rootRef}>
      {/* 表紙: 診断カルテ */}
      <div className="sh-sheet sh-hero" id="sec-karte">
        <div className="sh-stamp" aria-hidden="true">添削済</div>
        {high && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => (
              <i key={i} style={{
                left: `${(i * 53) % 100}%`,
                background: CONF[i % 5],
                animationDelay: `${(i % 6) * 0.12}s`,
                animationDuration: `${1.6 + (i % 4) * 0.35}s`,
              }} />
            ))}
          </div>
        )}
        <img src={high ? "/kame-jump.png" : "/kame-hanamaru.png"} alt="" className="sh-kame" />
        <p className="sh-meta">{data.qtype} · {data.date}</p>
        {avg && (
          <div className="sh-score">
            <svg viewBox="0 0 120 74" className="sh-circle" aria-hidden="true">
              <ellipse className="c1" pathLength="100" cx="60" cy="37" rx="52" ry="28" fill="none" stroke="var(--shu)" strokeWidth="3" strokeLinecap="round" transform="rotate(-3 60 37)" />
              <ellipse className="c2" pathLength="100" cx="60" cy="37" rx="50" ry="26" fill="none" stroke="var(--shu)" strokeWidth="2" strokeLinecap="round" opacity=".45" transform="rotate(2 60 37)" />
            </svg>
            <span className="sh-score-n">{disp}</span>
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

      <div className="sh-sheet sec-lead" id="sec-soukan">
        <h3 className="sh-h2"><em>REVIEW 01</em>全体所感</h3>
        <p className="sh-lead">{data.zentai}</p>
      </div>

      <div className="sh-sheet sec-good" id="sec-good">
        <h3 className="sh-h2"><em>REVIEW 02</em>良かった点</h3>
        {(data.yokatta || []).map((k, i) => (
          <div className="sh-item" key={i}>
            <span className="sh-mark good">💮</span>
            <div><b>{k.title}</b><p>{k.body}</p></div>
          </div>
        ))}
      </div>

      <div className="sh-sheet sec-warn" id="sec-warn">
        <h3 className="sh-h2"><em>REVIEW 03</em>気になった点</h3>
        {(data.kininatta || []).map((k, i) => (
          <div className="sh-item" key={i}>
            <span className="sh-mark warn">✍️</span>
            <div><b>{k.title}</b><p>{k.body}</p></div>
          </div>
        ))}
      </div>

      <div className="sh-sheet sec-rewrite" id="sec-rewrite">
        <h3 className="sh-h2"><em>REVIEW 04</em>まるかめならこう書く</h3>
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
          <button className={"mk-btn primary" + (copied === "s" ? " copied" : "")} onClick={() => copy(data.shuseiban, "s")}>
            {copied === "s" ? "コピーしました" : "まるかめ版をコピー"}
          </button>
        </div>
      </div>

      <div className="sh-sheet sec-qs" id="sec-mensetsu">
        <h3 className="sh-h2"><em>REVIEW 05</em>面接で聞かれそうなこと</h3>
        <ol className="rv-qs">
          {(data.mensetsu || []).map((m, i) => <li key={i}>{m}</li>)}
        </ol>
      </div>

      <div className="sh-final">
        <img src="/kame-pen.png" alt="" />
        <div className="sh-bubble">{data.saigo}</div>
      </div>

      <div className="sh-tools" style={{ justifyContent: "center", marginTop: 4 }}>
        <button className="mk-btn" onClick={onPrint}>PDFで保存</button>
        {avg && (
          <a
            className="mk-btn"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `まるかめに${data.qtype}を添削してもらったら ${avg}/10 だった🐢\n#まるかめES添削\n`
            )}&url=${encodeURIComponent("https://es-henna-three.vercel.app")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            スコアをシェア
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

  const [prog, setProg] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    if (!loading) { setProg(0); return; }
    setTipIdx(Math.floor(Math.random() * TIPS.length));
    const pi = setInterval(() => setProg((v) => v + (96 - v) * 0.035), 150);
    const ti = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 5000);
    return () => { clearInterval(pi); clearInterval(ti); };
  }, [loading]);

  const [history, setHistory] = useState(null);
  const [detail, setDetail] = useState(null);

  const [rStep, setRStep] = useState(0);
  const [iStep, setIStep] = useState(0);

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
    const tagged = t;
    if (!allTags.includes(tagged)) setExtraTags([...extraTags, tagged]);
    if (!tags.includes(tagged)) setTags([...tags, tagged]);
    setCustomTag("");
  };

  const generate = async (payloadArg) => {
    const pl = payloadArg || { qtype, question, body, tags };
    if (!pl.body.trim()) { setErr("ES本文を貼り付けてね🐢"); return; }
    setErr(""); setOut(null); setNeedPay(false); setLoading(true);
    setPhase("まるかめがESを読んでいます…");
    const timer = setTimeout(() => setPhase("赤ペンを入れています…"), 14000);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qtype: pl.qtype, question: pl.question, body: pl.body,
          tags: pl.tags,
        }),
      });
      let data;
      try { data = await res.json(); }
      catch (_) { throw new Error("サーバーが混み合ってるみたい。もう一度押すと成功することが多いよ"); }
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
      let data;
      try { data = await res.json(); }
      catch (_) { throw new Error("サーバーが混み合ってるみたい。もう一度押すと成功することが多いよ"); }
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

  const activeResult = detail || out || iOut;

  const [histFilter, setHistFilter] = useState("all");
  const histFiltered = history ? history.filter((r) => histFilter === "all" || r.kind === histFilter) : null;
  const histGroups = [];
  if (histFiltered) {
    const m = new Map();
    histFiltered.forEach((row) => {
      const key = new Date(row.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
      if (!m.has(key)) { m.set(key, []); histGroups.push([key, m.get(key)]); }
      m.get(key).push(row);
    });
  }

  const reviewForm = (
    <>
      <StepProgress step={rStep} total={4} />

      <div className="wiz-step" key={"r" + rStep}>
        {rStep === 0 && (
          <div className="mk-card">
            <div className="mk-step"><span className="n">1</span>設問のタイプは?</div>
            <div className="mk-types">
              {QTYPES.map((q) => (
                <button key={q.t} className={"mk-type " + (qtype === q.t ? "on" : "")}
                  onClick={() => { setQtype(q.t); setRStep(1); }}>
                  <span className="t">{q.t}</span>
                </button>
              ))}
            </div>
            <p className="wiz-hint">タップするとつぎに進むよ</p>
          </div>
        )}

        {rStep === 1 && (
          <div className="mk-card">
            <div className="mk-step"><span className="n">2</span>設問文を貼ってね</div>
            <div className="mk-hint">文字数制限(例: 400字以内)もそのまま貼ればOK。自動で読み取るよ</div>
            <textarea className="mk-textarea" style={{ minHeight: 110 }} value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例: 学生時代に最も力を入れたことを教えてください(400字以内)" />
          </div>
        )}

        {rStep === 2 && (
          <div className="mk-card">
            <div className="mk-step"><span className="n">3</span>ES本文を貼ってね</div>
            <textarea className="mk-textarea" style={{ minHeight: 260 }} value={body}
              onChange={(e) => setBody(e.target.value)} placeholder="書いたESをここにペタッと🐢" />
            <div className="mk-meta"><span className={bodyLen > 0 ? "ok" : ""}>{bodyLen}字</span></div>
          </div>
        )}

        {rStep === 3 && (
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
        )}
      </div>

      <div className="wiz-nav">
        {rStep > 0 && <button className="wiz-back" onClick={() => setRStep(rStep - 1)}>もどる</button>}
        {rStep === 1 && (
          <button className="mk-go wiz-next" onClick={() => setRStep(2)}>
            {question.trim() ? "次へ" : "スキップ"}
          </button>
        )}
        {rStep === 2 && (
          <button className="mk-go wiz-next" disabled={!body.trim()} onClick={() => setRStep(3)}>次へ</button>
        )}
        {rStep === 3 && (
          <button className="mk-go wiz-next" onClick={() => generate()} disabled={loading}>添削してもらう</button>
        )}
      </div>
      {err && <div className="mk-err">{err}</div>}
    </>
  );

  return (
    <div className="mk">
      {/* ---- 添削中フルスクリーン ---- */}
      {loading && (
        <div className="loading-screen" role="status">
          <img src="/kame-glass.png" alt="" className="mk-loading-img" />
          <p className="ls-phase">{phase}</p>
          <div className="ls-bar"><div className="ls-fill" style={{ width: `${prog}%` }} /></div>
          <p className="ls-note">だいたい30秒くらいかかるよ</p>
          <div className="ls-tip" key={tipIdx}>
            <b>まるかめ豆知識</b>
            <p>{TIPS[tipIdx]}</p>
          </div>
        </div>
      )}

      {user && (
        <header className="hd">
          <div className="hd-in">
            <img src="/kame-pen.png" alt="" className="hd-logo" />
            <span className="hd-name">まるかめ ESレビューシート</span>
            {credits !== null && <span className="hd-cred">のこり {credits}</span>}
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
                <span className="onb-emoji"><Icon name="heart" size={20} /></span>
                <div><b>良いところを、ちゃんと褒める</b><p>まず伝わっている魅力から教えてくれる</p></div>
              </div>
              <div className="onb-row onb-in" style={{ animationDelay: "340ms" }}>
                <span className="onb-emoji"><Icon name="search" size={20} /></span>
                <div><b>気になる点は「なぜ」まで具体的に</b><p>読み手がどこで引っかかるかが分かる</p></div>
              </div>
              <div className="onb-row onb-in" style={{ animationDelay: "420ms" }}>
                <span className="onb-emoji"><Icon name="mic" size={20} /></span>
                <div><b>面接対策までつながる</b><p>ESから30秒回答と深掘りの枝分かれをつくれる</p></div>
              </div>
            </div>
            <div className="onb-bottom onb-in" style={{ animationDelay: "520ms" }}>
              <button className="onb-cta" onClick={loginGoogle}>
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 34.9 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
                Googleではじめる
              </button>
              <p className="onb-note">初回は1回無料 · 登録は30秒</p>
              <p className="onb-legal">
                はじめることで<a href="/terms">利用規約</a>と<a href="/privacy">プライバシーポリシー</a>に同意したことになります
              </p>
            </div>
          </div>
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
                    <div className="p-name">3回パック</div>
                    <div className="p-price">¥500</div>
                    <div className="p-note">ES提出前の駆け込みに</div>
                    <button className="mk-btn primary" onClick={() => buy("pack")}>これにする</button>
                  </div>
                  <div className="mk-plan">
                    <div className="p-name">月額プラン(10回/月)</div>
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
            <button className="rv-back" onClick={() => { setOut(null); setRStep(0); }}>← 新しく添削する</button>
            <ResultView data={out} onPrint={() => window.print()} />
          </>
        )}

        {/* ---- 面接タブ ---- */}
        {user && tab === "interview" && !iOut && (
          <>
            <StepProgress step={iStep} total={2} />

            <div className="wiz-step" key={"i" + iStep}>
              {iStep === 0 && (
                <>
                  <div className="med-hero">
                    <img src="/kame-mic.png" alt="" className="med-kame" />
                    <p className="med-eyebrow">MIKI-EDA METHOD</p>
                    <h2 className="med-title">幹枝シート</h2>
                    <p className="med-sub">全部話すと、面接は負け。<br />幹だけ渡して、深掘りは枝で返す。</p>
                    <MikiEdaDiagram />
                    <div className="med-steps">
                      <span>ESを貼る</span><i>→</i><span>30秒の幹</span><i>→</i><span>深掘りの枝</span>
                    </div>
                  </div>
                  <div className="mk-card">
                    <div className="mk-step"><span className="n">1</span>設問のタイプは?</div>
                    <div className="mk-types">
                      {QTYPES.map((q) => (
                        <button key={q.t} className={"mk-type " + (iQtype === q.t ? "on" : "")}
                          onClick={() => { setIQtype(q.t); setIStep(1); }}>
                          <span className="t">{q.t}</span>
                        </button>
                      ))}
                    </div>
                    <p className="wiz-hint">タップするとつぎに進むよ</p>
                  </div>
                </>
              )}

              {iStep === 1 && (
                <div className="mk-card">
                  <div className="mk-step"><span className="n">2</span>ES本文を貼ってね</div>
                  <div className="mk-hint">添削済みでも、書いたままでもOK。これを面接用に組み替えるよ</div>
                  <textarea className="mk-textarea" style={{ minHeight: 260 }} value={iBody}
                    onChange={(e) => setIBody(e.target.value)} placeholder="面接対策したいESをペタッと🐢" />
                </div>
              )}
            </div>

            <div className="wiz-nav">
              {iStep > 0 && <button className="wiz-back" onClick={() => setIStep(0)}>もどる</button>}
              {iStep === 1 && (
                <button className="mk-go wiz-next" disabled={!iBody.trim() || loading} onClick={generateInterview}>
                  幹枝シートをつくる
                </button>
              )}
            </div>
            {iErr && <div className="mk-err">{iErr}</div>}

            {iNeedPay && (
              <div className="mk-card" style={{ marginTop: 18, textAlign: "center" }}>
                <img src="/kame-sorry.png" alt="" className="mk-state-img" />
                <p style={{ fontWeight: 900, fontSize: 15 }}>無料分を使い切ったみたい🐢</p>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>続けるにはプランを選んでね</p>
                <div className="mk-plans">
                  <div className="mk-plan">
                    <div className="p-name">3回パック</div>
                    <div className="p-price">¥500</div>
                    <div className="p-note">ES提出前の駆け込みに</div>
                    <button className="mk-btn primary" onClick={() => buy("pack")}>これにする</button>
                  </div>
                  <div className="mk-plan">
                    <div className="p-name">月額プラン(10回/月)</div>
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
            <button className="rv-back" onClick={() => { setIOut(null); setIStep(0); }}>← 新しくつくる</button>
            <InterviewView data={iOut} />
          </>
        )}

        {/* ---- 履歴タブ ---- */}
        {user && tab === "history" && !detail && (
          <>
            <h2 className="hist-title">きろく</h2>
            <div className="hist-filters">
              {[["all", "すべて"], ["review", "添削"], ["interview", "面接"]].map(([k, l]) => (
                <button key={k} className={histFilter === k ? "on" : ""} onClick={() => setHistFilter(k)}>{l}</button>
              ))}
            </div>

            {history === null && <p className="hist-empty">読み込み中…</p>}
            {histFiltered && histFiltered.length === 0 && (
              <div className="hist-zero">
                <img src="/kame-reading.png" alt="" className="mk-state-img" />
                <p>まだきろくがないよ。<br />最初のESを見せてね🐢</p>
                <button className="mk-btn primary" onClick={() => setTab("review")}>添削してもらう</button>
              </div>
            )}

            {histGroups.map(([month, rows]) => (
              <div key={month} className="hist-group">
                <p className="hist-month">{month}</p>
                {rows.map((row) => {
                  const sc = row.result?.scores;
                  const avg = Array.isArray(sc) && sc.length ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) : null;
                  const isInt = row.kind === "interview";
                  const d = new Date(row.created_at);
                  return (
                    <button key={row.kind + row.id} className="hist-item" onClick={() => setDetail(rowToData(row))}>
                      {isInt
                        ? <span className="hist-ic"><Icon name="mic" size={19} /></span>
                        : (avg ? <ScoreRing value={avg} /> : <span className="hist-ic pen"><Icon name="pen" size={18} /></span>)}
                      <div className="hist-left">
                        <span className="hist-qtype">{row.qtype}<em>{isInt ? "面接" : "添削"}</em></span>
                        <span className="hist-q">{row.question || (isInt ? row.result?.ikkabun : "") || "(設問未記入)"}</span>
                      </div>
                      <span className="hist-date2">{d.getMonth() + 1}/{d.getDate()}</span>
                      <span className="hist-arrow">›</span>
                    </button>
                  );
                })}
              </div>
            ))}

            <p style={{ textAlign: "center", marginTop: 30 }}>
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
            <span className="tb-ico"><Icon name="pen" /></span>添削
          </button>
          <button className={tab === "interview" ? "on" : ""} onClick={() => { setTab("interview"); setDetail(null); }}>
            <span className="tb-ico"><Icon name="mic" /></span>面接
          </button>
          <button className={tab === "history" ? "on" : ""} onClick={() => { setTab("history"); }}>
            <span className="tb-ico"><Icon name="clock" /></span>きろく
          </button>
        </nav>
      )}

      {/* ---- 印刷用(幹枝シート) ---- */}
      {activeResult && activeResult.miki && (
        <div className="mk-print">
          <div className="pr-band">
            <img src="/kame-mic.png" alt="" style={{ width: 46, height: 46 }} />
            <div>
              <div className="t">まるかめ 幹枝シート</div>
              <div className="s">MIKI-EDA INTERVIEW SHEET</div>
            </div>
          </div>
          <div className="pr-meta">設問タイプ: {activeResult.qtype} / {activeResult.date}</div>
          <div className="pr-h">一文要約(最初に渡す地図)</div>
          <div className="pr-box">{activeResult.ikkabun}</div>
          <div className="pr-h">30秒回答(幹)</div>
          <div className="pr-box">{activeResult.kaito30}</div>
          <div className="pr-h">深掘りの枝分かれ</div>
          {(activeResult.miki || []).map((m, mi) => (
            <div key={mi} style={{ marginBottom: 10 }}>
              <div className="pr-kw">枝{mi + 1}. {m.kw}</div>
              {(m.eda || []).map((e, ei) => (
                <div className="pr-item" key={ei} style={{ marginLeft: 12 }}>
                  <b>Q{ei + 1}. {e.q}</b>
                  {e.a}
                  {(e.why || []).map((w, wi) => (
                    <div key={wi} style={{ marginLeft: 10, color: "#8A7A5E" }}>↳ {w}</div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <div className="pr-foot">まるかめ 幹枝シート 🐢 幹だけ渡して、深掘りは枝で返そう</div>
        </div>
      )}

      {/* ---- 印刷用(添削) ---- */}
      {activeResult && !activeResult.miki && (
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
