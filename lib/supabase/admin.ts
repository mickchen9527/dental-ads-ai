import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  // service role key 只能在服务端使用，不能暴露到浏览器，也不能用于 client component。
  adminClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

export function getSupabaseAdminClientStatus() {
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY);

  return {
    ready: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && hasServiceKey),
    message:
      process.env.NEXT_PUBLIC_SUPABASE_URL && hasServiceKey
        ? "Supabase 服务端管理配置已完成。"
        : "Supabase 服务端管理配置还不完整，请检查 NEXT_PUBLIC_SUPABASE_URL 和 service role / secret key。",
  };
}
