import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const maxDuration = 60;

const parse = (r) => {
  const t = r.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const c = t.replace(/```json|```/g, "").trim();
  return JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
};

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const isAdmin = adminEmails.includes((user.email || "").toLowerCase());

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: profile } = await admin
    .from("profiles").select("credits").eq("id", user.id).single();
  if (!isAdmin && (!profile || profile.credits <= 0)) {
    return NextResponse.json({ error: "no_credits" }, { status: 402 });
  }

  const { qtype, question, body } = await req.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "ES本文が空です" }, { status: 400 });
  }

  const info = `設問タイプ: ${qtype}
設問文: ${question || "(未記入)"}

【ES本文】
${body}`;

  const RULES = `あなたは就活の面接コーチ「まるかめ」。「幹枝テクニック」でESを面接用に構造化する。
幹枝テクニックとは: 面接は全部話す場ではなく、最初は幹(核となる短い回答)だけを渡し、面接官に深掘りさせたいキーワードを意図的に埋め込み、深掘りされたら枝(詳細)を展開することで面接の主導権を握る手法。
文体は自然な話し言葉ベース。就活生が読んでそのまま口に出せる形にする。`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // 幹と枝を1回で生成(タイムアウト対策: 枝は4本×3問、回答は簡潔に)
    const r1 = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2800,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `${RULES}

${info}

このESから面接用の幹枝シートを作成し、JSONのみを出力(前置き・コードブロック禁止):
{"ikkabun":"一文要約。環境/課題/自分の行動/結果の4要素を1文に","kaito30":"30秒回答。サンドイッチ構成(結論→背景と課題→施策2つ→結果)。話し言葉で250字前後","miki":[{"kw":"キーワード(7文字以内)","qs":[{"q":"面接官の質問","whys":["その答えに対する『なぜ?』の深掘り","さらにもう一段掘る質問(価値観・再現性を突く)"]}]}]}
制約:
- mikiは必ず6本。1〜5本目はこのESに固有の深掘りキーワード。
- 6本目は必ず {"kw":"共通質問"} とし、どのESでも聞かれる汎用質問(入社後どう活かすか/最も困難だった点/もう一度やるなら等)をこのESの文脈に寄せて作る。
- 各枝のqsは3問。各質問に必ずwhysを2段。合計 6枝×3問×(1+2)=54項目。
- 全て質問文のみ(答えは書かない)。各質問は45字以内で簡潔に。`,
      }],
    });
    const result = parse(r1);

    if (!isAdmin) {
      await admin.from("profiles")
        .update({ credits: profile.credits - 1 })
        .eq("id", user.id);
    }

    const { data: saved } = await admin.from("interview_sheets").insert({
      user_id: user.id, qtype, question, body, result,
    }).select("id").single();

    return NextResponse.json({
      ...result,
      creditsLeft: isAdmin ? (profile?.credits ?? 0) : profile.credits - 1,
      sheetId: saved?.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "生成に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
