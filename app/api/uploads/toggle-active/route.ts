import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase 服务端连接失败：请检查 URL 和 service role / secret key 是否已配置。" },
      { status: 500 },
    );
  }

  const { id } = await request.json();

  if (!id || typeof id !== "string") {
    return NextResponse.json({ message: "缺少上传记录 id。" }, { status: 400 });
  }

  const currentResult = await supabase
    .from("uploaded_files")
    .select("id, is_active")
    .eq("id", id)
    .single();

  if (currentResult.error || !currentResult.data) {
    console.error("[api/uploads/toggle-active] uploaded_files select failed", {
      code: currentResult.error?.code,
      message: currentResult.error?.message,
      details: currentResult.error?.details,
      hint: currentResult.error?.hint,
    });

    return NextResponse.json({ message: "没有找到这条上传记录，请刷新后再试。" }, { status: 404 });
  }

  const nextActive = !Boolean(currentResult.data.is_active);
  const updateResult = await supabase
    .from("uploaded_files")
    .update({ is_active: nextActive })
    .eq("id", id)
    .select("id, is_active")
    .single();

  if (updateResult.error) {
    console.error("[api/uploads/toggle-active] uploaded_files update failed", {
      code: updateResult.error.code,
      message: updateResult.error.message,
      details: updateResult.error.details,
      hint: updateResult.error.hint,
    });

    return NextResponse.json({ message: "上传记录状态更新失败，请检查 uploaded_files 表权限。" }, { status: 500 });
  }

  return NextResponse.json({
    record: updateResult.data,
    message: nextActive
      ? "这条上传记录已重新启用，后续可以参与分析。"
      : "这条上传记录已停用，后续不会参与分析。",
  });
}
