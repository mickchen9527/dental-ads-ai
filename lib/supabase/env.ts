export type SupabaseEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY";

export type SupabaseEnvItem = {
  key: SupabaseEnvKey;
  label: string;
  status: "已配置" | "未配置";
};

const supabaseEnvItems: Array<{ key: SupabaseEnvKey; label: string }> = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    label: "Supabase 项目 URL",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    label: "anon key",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    label: "service role key",
  },
];

export function getSupabaseEnvStatus() {
  const items: SupabaseEnvItem[] = supabaseEnvItems.map((item) => ({
    ...item,
    status: process.env[item.key] ? "已配置" : "未配置",
  }));
  const allConfigured = items.every((item) => item.status === "已配置");

  return {
    items,
    allConfigured,
    summary: allConfigured ? "Supabase 基础配置已完成" : "Supabase 尚未配置完整",
  };
}
