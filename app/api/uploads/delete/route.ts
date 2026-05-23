import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";

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
  let storageWarning = "";

  if (storagePath) {
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

      storageWarning = "Storage 原文件删除失败或文件不存在，系统会继续删除上传记录。";
    }
  }

  // V1.6.3 以后，如果该文件已经解析出明细数据，删除时还需要同步处理解析数据。
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
    message: storageWarning
      ? `上传记录已删除。${storageWarning}`
      : "上传记录和 Supabase Storage 原文件已删除。",
  });
}
