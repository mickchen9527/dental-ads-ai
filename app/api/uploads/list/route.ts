import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "当前无法读取真实上传记录，请检查 Supabase 配置。" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const dataType = searchParams.get("dataType");

  let query = supabase
    .from("uploaded_files")
    .select("id, platform, data_type, original_file_name, period_start, period_end, uploaded_at, row_count, parse_status, is_active, notes")
    .order("uploaded_at", { ascending: false })
    .limit(500);

  if (platform) {
    query = query.eq("platform", platform);
  }

  if (dataType) {
    query = query.eq("data_type", dataType);
  }

  const result = await query;

  if (result.error) {
    return NextResponse.json(
      { error: "当前无法读取真实上传记录，请检查 Supabase 配置。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ records: result.data ?? [] });
}
