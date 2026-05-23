import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "当前无法生成下载链接，请检查 Supabase 配置。" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "缺少上传记录 id。" }, { status: 400 });
  }

  const fileResult = await supabase
    .from("uploaded_files")
    .select("storage_path, original_file_name")
    .eq("id", id)
    .single();

  if (fileResult.error || !fileResult.data?.storage_path) {
    return NextResponse.json({ error: "没有找到这个上传文件记录。" }, { status: 404 });
  }

  const signedUrlResult = await supabase.storage
    .from(bucketName)
    .createSignedUrl(fileResult.data.storage_path, 60, {
      download: fileResult.data.original_file_name || true,
    });

  if (signedUrlResult.error) {
    return NextResponse.json(
      { error: "生成下载链接失败，请检查 Supabase Storage 文件是否存在。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: signedUrlResult.data.signedUrl });
}
