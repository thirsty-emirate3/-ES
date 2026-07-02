import { createBrowserClient } from "@supabase/ssr";

// 環境変数が未設定でもビルドが落ちないようにフォールバックを持たせる
// (本番では必ずVercelの環境変数に実際の値を設定すること)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  );
}
