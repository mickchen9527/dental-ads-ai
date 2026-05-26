import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";
const parsedDataTables = [
  "meituan_summary_rows",
  "meituan_keyword_rows",
  "ekanya_backflow_rows",
  "douyin_plan_summary_rows",
  "douyin_creative_rows",
  "douyin_lead_rows",
  "gdt_plan_summary_rows",
  "gdt_creative_rows",
  "gdt_lead_rows",
  "amap_summary_rows",
  "amap_action_rows",
  "amap_lead_rows",
];

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

  const fileResult = await supabase
    .from("uploaded_files")
    .select("id, storage_path")
    .eq("id", id)
    .single();

  if (fileResult.error || !fileResult.data) {
    console.error("[api/uploads/delete] uploaded_files select failed", {
      code: fileResult.error?.code,
      message: fileResult.error?.message,
      details: fileResult.error?.details,
      hint: fileResult.error?.hint,
    });

    return NextResponse.json({ message: "没有找到这条上传记录，请刷新后再试。" }, { status: 404 });
  }

  const storagePath = fileResult.data.storage_path;

  if (!storagePath) {
    return NextResponse.json(
      { message: "这条上传记录没有原文件路径，系统不会盲删。请检查上传记录后再处理。" },
      { status: 400 },
    );
  }

  for (const tableName of parsedDataTables) {
    const parsedDeleteResult = await supabase.from(tableName).delete().eq("uploaded_file_id", id);

    if (parsedDeleteResult.error) {
      console.error("[api/uploads/delete] parsed rows delete failed", {
        tableName,
        uploadedFileId: id,
        code: parsedDeleteResult.error.code,
        message: parsedDeleteResult.error.message,
        details: parsedDeleteResult.error.details,
        hint: parsedDeleteResult.error.hint,
      });

      return NextResponse.json(
        { message: `删除解析明细失败：${tableName} 表清理失败，请检查表权限。` },
        { status: 500 },
      );
    }
  }

  const removeResult = await supabase.storage.from(bucketName).remove([storagePath]);

  if (removeResult.error) {
    const error = removeResult.error as {
      name?: string;
      message?: string;
      statusCode?: string | number;
    };

    console.error("[api/uploads/delete] Supabase Storage remove failed", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      bucket: bucketName,
      storagePath,
    });

    return NextResponse.json(
      { message: `Supabase Storage 原文件删除失败：${error.message ?? "请检查 bucket 权限和文件路径。"}` },
      { status: 500 },
    );
  }

  const deleteResult = await supabase.from("uploaded_files").delete().eq("id", id);

  if (deleteResult.error) {
    console.error("[api/uploads/delete] uploaded_files delete failed", {
      code: deleteResult.error.code,
      message: deleteResult.error.message,
      details: deleteResult.error.details,
      hint: deleteResult.error.hint,
    });

    return NextResponse.json({ message: "上传记录删除失败，请检查 uploaded_files 表权限。" }, { status: 500 });
  }

  return NextResponse.json({
    message: "上传记录、Supabase Storage 原文件和对应解析明细已删除。",
  });
}
