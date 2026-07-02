import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const maxDuration = 60;

const KANTEN = {
  "ガクチカ": "何に取り組んだか一文で分かるか/課題の具体性/なぜ本人が動いたか/役割の明確さ/一人で全部やったように見えないか/チームの巻き込み方/課題→施策→結果のつながり/学びが一般論になっていないか",
  "志望動機": "①達成したいこと・夢→②原体験→③なぜその企業が必要か→④具体的に何を学びたいか、の流れが強い。原体験と企業の接続/学びたいことの具体性/企業名を変えても通じる文章になっていないか/職種理解",
  "自己PR": "強みが一文で分かるか/裏付けエピソードの具体性/再現性が見えるか/企業でどう活きるか",
  "研究内容": "初見の人でもテーマが分かるか/社会的意義/専門用語の説明/自分の工夫や役割/企業でどう活かせるか",
  "その他": "設問の意図に答えているか/具体性/論理のつながり/読みやすさ",
};

const TONE = `口調ルール(重要):
- まず良い点をしっかり褒め、その後に気になる点を具体的に指摘する
- 「〜と思います」を連続させない。語尾を揃えすぎない
- 機械的な列挙をしない。無難すぎるコメントを避ける
- 上から目線にしない。「あくまで一意見として参考にしてね」という温度感
- 指摘は「なぜ読み手が引っかかるのか」まで書く
- よく使う表現:「全体として、かなり良いESだと思いました!」「個人的に良いなと感じたのは〜」「一方で、少し気になったのは〜」「素材自体はかなり良いです」
- 絵文字は🐢をたまに使う程度`;

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // 管理者(開発用): ADMIN_EMAILSに登録されたメールは回数無制限
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const isAdmin = adminEmails.includes((user.email || "").toLowerCase());

  // 残り回数チェック(service roleで確実に読む)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: profile } = await admin
    .from("profiles").select("credits").eq("id", user.id).single();

  if (!isAdmin && (!profile || profile.credits <= 0)) {
    return NextResponse.json({ error: "no_credits" }, { status: 402 });
  }

  const { qtype, question, body, tags } = await req.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "ES本文が空です" }, { status: 400 });
  }

  const bodyLen = body.replace(/\s/g, "").length;
  const info = `設問タイプ: ${qtype}
設問文: ${question || "(未記入)"}
※設問文に文字数制限(例:400字以内)が含まれていたら、それを制限として扱うこと。
見てほしいところ: ${tags?.length ? tags.join(" / ") : "特になし(全体を見る)"}
本文の現在の文字数: ${bodyLen}字

【ES本文】
${body}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // ① 添削コメント(JSON)
    const r1 = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `あなたは就活ES添削者「まるかめ」です。自然で優しいが具体的な添削をします。
${TONE}
この設問タイプで見る観点: ${KANTEN[qtype] || KANTEN["その他"]}
「見てほしいところ」に挙がっている点は必ず言及すること。各コメントは2〜3文。

${info}

以下のJSONのみを出力(前置き・コードブロック禁止):
{"zentai":"全体所感(まず褒める→気になった点に軽く触れる。3〜4文)","yokatta":[{"title":"短い見出し","body":"コメント"}],"kininatta":[{"title":"短い見出し","body":"なぜ読み手が引っかかるかまで書く"}],"mensetsu":["面接で深掘りされそうな質問を4つ"],"saigo":"前向きな締めの一言(🐢を添える)"}`,
      }],
    });
    const t1 = r1.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const clean = t1.replace(/```json|```/g, "").trim();
    const comments = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));

    // ② 修正版(プレーンテキスト)
    const r2 = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `あなたは就活ES添削者「まるかめ」です。以下のESの修正版を書いてください。
ルール:
- 元のエピソードを大きく変えず、本人の素材を活かす
- 読みやすさ・論理性・企業への刺さり方を改善する
- 設問文に文字数制限があれば必ずその字数以内に収める
- 修正版の本文のみを出力。前置き・説明・見出しは一切不要

${info}`,
      }],
    });
    const shuseiban = r2.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();

    // 成功時のみ1回消費(管理者は消費しない)
    let creditsLeft = profile ? profile.credits : 0;
    if (!isAdmin) {
      creditsLeft = profile.credits - 1;
      await admin.from("profiles")
        .update({ credits: creditsLeft })
        .eq("id", user.id);
    }

    return NextResponse.json({ ...comments, shuseiban, creditsLeft, isAdmin });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "生成に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
