import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublicKey) {
    return null;
  }

  browserClient ??= createClient(supabaseUrl, supabasePublicKey);
  return browserClient;
}

export function getSupabaseBrowserClientStatus() {
  const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  return {
    ready: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && hasPublicKey),
    message:
      process.env.NEXT_PUBLIC_SUPABASE_URL && hasPublicKey
        ? "Supabase 前端读取配置已完成。"
        : "Supabase 前端读取配置还不完整，请检查 NEXT_PUBLIC_SUPABASE_URL 和 anon / publishable key。",
  };
}
