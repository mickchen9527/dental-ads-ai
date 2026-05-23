import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";

const platformSlugMap: Record<string, string> = {
  美团: "meituan",
  抖音: "douyin",
  腾讯广点通: "gdt",
  腾讯: "gdt",
  高德: "amap",
  e看牙: "ekanya",
  竞品: "competitor",
  竞品情报: "competitor",
};

const dataTypeSlugMap: Record<string, string> = {
  美团推广汇总数据: "meituan-summary",
  美团关键词数据: "meituan-keywords",
  "美团订单/团购明细": "meituan-orders",
  抖音计划汇总数据: "douyin-plan-summary",
  抖音广告计划汇总数据: "douyin-plan-summary",
  "抖音素材/创意数据": "douyin-creatives",
  "抖音表单/私信线索数据": "douyin-leads",
  腾讯计划汇总数据: "gdt-plan-summary",
  "腾讯账户/计划汇总数据": "gdt-plan-summary",
  "腾讯广告组/创意数据": "gdt-creatives",
  "腾讯表单/电话线索数据": "gdt-leads",
  高德推广汇总数据: "amap-summary",
  "高德电话/导航/门店访问数据": "amap-visits",
  高德线索数据: "amap-leads",
  e看牙后端回流数据: "ekanya-backflow",
  e看牙项目价格表: "project-pricing",
  项目价格表: "project-pricing",
  项目价格管理: "project-pricing",
  竞品数据: "competitor-data",
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase 服务端连接失败：请检查 URL 和 service role / secret key 是否已配置。" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const platform = readFormValue(formData, "platform");
  const dataType = readFormValue(formData, "dataType");
  const periodStart = readFormValue(formData, "periodStart");
  const periodEnd = readFormValue(formData, "periodEnd");
  const notes = readFormValue(formData, "notes");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "文件为空或没有收到文件，请重新选择 Excel 或 CSV 文件。" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ message: "文件为空，请重新选择一个有内容的文件。" }, { status: 400 });
  }

  if (!platform || !dataType) {
    return NextResponse.json({ message: "请先确认平台和数据类型。" }, { status: 400 });
  }

  const originalFileName = file.name;
  const storagePath = [
    "uploads",
    getMappedSlug(platform, platformSlugMap),
    getMappedSlug(dataType, dataTypeSlugMap),
    buildSafeStorageFileName(originalFileName),
  ].join("/");
  const fileBody = Buffer.from(await file.arrayBuffer());

  const uploadResult = await supabase.storage.from(bucketName).upload(storagePath, fileBody, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadResult.error) {
    const error = uploadResult.error as {
      name?: string;
      message?: string;
      statusCode?: string | number;
    };

    console.error("[api/uploads] Supabase Storage upload failed", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      bucket: bucketName,
      storagePath,
    });

    return NextResponse.json(
      { message: "文件保存到 Supabase Storage 失败：请检查 uploaded-files bucket 是否存在、权限是否正确、服务端 key 是否可用。" },
      { status: 500 },
    );
  }

  const insertResult = await supabase.from("uploaded_files").insert({
    platform,
    data_type: dataType,
    original_file_name: originalFileName,
    storage_path: storagePath,
    period_start: periodStart || null,
    period_end: periodEnd || null,
    uploaded_at: new Date().toISOString(),
    row_count: null,
    parse_status: "saved",
    is_active: true,
    notes: notes || null,
  }).select("id").single();

  if (insertResult.error) {
    console.error("[api/uploads] uploaded_files insert failed", {
      code: insertResult.error.code,
      message: insertResult.error.message,
      details: insertResult.error.details,
      hint: insertResult.error.hint,
    });

    return NextResponse.json(
      { message: "数据库 uploaded_files 写入失败：文件已保存，但记录没有写入，请检查表名、字段名和权限。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: insertResult.data.id,
    message: "上传成功，已保存到 Supabase。",
  });
}

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getMappedSlug(value: string, slugMap: Record<string, string>) {
  return slugMap[value] ?? sanitizeSlug(value);
}

function sanitizeSlug(value: string) {
  const safeValue = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeValue || "unknown";
}

function buildSafeStorageFileName(originalFileName: string) {
  const extension = getSafeExtension(originalFileName);
  const baseName = originalFileName.replace(/\.[^.]+$/, "");
  const safeBaseName = sanitizeFileBaseName(baseName);
  const shortId = crypto.randomUUID().slice(0, 8);

  return `${Date.now()}-${safeBaseName}-${shortId}${extension}`;
}

function getSafeExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.(xlsx|xls|csv)$/);
  return match ? `.${match[1]}` : "";
}

function sanitizeFileBaseName(value: string) {
  const safeValue = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeValue || "file";
}
