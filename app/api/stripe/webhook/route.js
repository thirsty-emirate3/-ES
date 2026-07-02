import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

// 購入完了 → 回数を付与
// pack: +3回 / monthly: +10回(毎月の請求ごと)
export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const addCredits = async (userId, n, plan) => {
    const { data: p } = await admin.from("profiles").select("credits").eq("id", userId).single();
    await admin.from("profiles")
      .update({ credits: (p?.credits || 0) + n, plan })
      .eq("id", userId);
  };

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const userId = s.client_reference_id;
    if (userId) {
      if (s.mode === "payment") await addCredits(userId, 3, "pack");
      if (s.mode === "subscription") await addCredits(userId, 10, "monthly");
    }
  }

  return NextResponse.json({ received: true });
}
