export type SupabaseEnvItem = {
  key: "supabaseUrl" | "supabasePublicKey" | "supabaseServiceKey";
  label: string;
  status: "已配置" | "未配置";
};

const supabaseEnvItems: Array<{
  key: SupabaseEnvItem["key"];
  label: string;
  envNames: string[];
}> = [
  {
    key: "supabaseUrl",
    label: "Supabase URL",
    envNames: ["NEXT_PUBLIC_SUPABASE_URL"],
  },
  {
    key: "supabasePublicKey",
    label: "anon / publishable key",
    envNames: ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  },
  {
    key: "supabaseServiceKey",
    label: "service role / secret key",
    envNames: ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
  },
];

export function getSupabaseEnvStatus() {
  const items: SupabaseEnvItem[] = supabaseEnvItems.map((item) => ({
    key: item.key,
    label: item.label,
    status: item.envNames.some((envName) => Boolean(process.env[envName])) ? "已配置" : "未配置",
  }));
  const allConfigured = items.every((item) => item.status === "已配置");

  return {
    items,
    allConfigured,
    summary: allConfigured ? "Supabase 基础配置已完成" : "Supabase 尚未配置完整",
  };
}
