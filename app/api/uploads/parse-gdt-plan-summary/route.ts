import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";
const supportedDataTypes = new Set([
  "腾讯广点通计划汇总数据",
  "腾讯计划汇总数据",
  "广点通计划汇总数据",
  "腾讯账户/计划汇总数据",
  "腾讯广告计划汇总数据",
  "腾讯信息流计划汇总数据",
  "腾讯广点通账户/计划汇总数据",
  "广点通账户/计划汇总数据",
  "gdt-plan-summary",
]);

type CellValue = string | number | boolean | Date | null | undefined;
type RawSheetRow = Record<string, CellValue>;
type SupabaseLikeClient = ReturnType<typeof getSupabaseAdminClient>;

const headerAliases: Array<[string, string]> = [
  ["日期", "date"],
  ["时间", "date"],
  ["数据日期", "date"],
  ["账户", "account_name"],
  ["账户名称", "account_name"],
  ["广告账户", "account_name"],
  ["推广计划", "plan_name"],
  ["计划名称", "plan_name"],
  ["广告计划", "plan_name"],
  ["广告计划名称", "plan_name"],
  ["推广系列", "campaign_name"],
  ["广告系列", "campaign_name"],
  ["项目名称", "campaign_name"],
  ["广告组", "ad_group_name"],
  ["广告组名称", "ad_group_name"],
  ["单元名称", "ad_group_name"],
  ["消耗", "spend"],
  ["花费", "spend"],
  ["花费（元）", "spend"],
  ["花费(元)", "spend"],
  ["消耗金额", "spend"],
  ["现金消耗", "spend"],
  ["消耗（元）", "spend"],
  ["消耗(元)", "spend"],
  ["曝光", "impressions"],
  ["曝光量", "impressions"],
  ["展示", "impressions"],
  ["展示量", "impressions"],
  ["展示数", "impressions"],
  ["展现", "impressions"],
  ["展现量", "impressions"],
  ["点击", "clicks"],
  ["点击量", "clicks"],
  ["点击率", "click_rate"],
  ["CTR", "click_rate"],
  ["点击均价", "avg_click_cost"],
  ["平均点击成本", "avg_click_cost"],
  ["CPC", "avg_click_cost"],
  ["点击成本", "avg_click_cost"],
  ["转化", "conversions"],
  ["转化数", "conversions"],
  ["转化量", "conversions"],
  ["转化成本", "conversion_cost"],
  ["CPA", "conversion_cost"],
  ["转化成本（元）", "conversion_cost"],
  ["转化成本(元)", "conversion_cost"],
  ["表单", "form_count"],
  ["表单数", "form_count"],
  ["表单提交", "form_count"],
  ["留资数", "form_count"],
  ["电话", "phone_count"],
  ["电话数", "phone_count"],
  ["电话咨询", "phone_count"],
  ["咨询", "consult_count"],
  ["咨询数", "consult_count"],
  ["在线咨询", "consult_count"],
  ["客服咨询", "consult_count"],
];

const headerMap = headerAliases.reduce<Record<string, string>>((result, [header, field]) => {
  result[normalizeHeader(header)] = field;
  return result;
}, {});

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
    .select("id, data_type, is_active, storage_path, original_file_name")
    .eq("id", id)
    .single();

  if (fileResult.error || !fileResult.data) {
    return NextResponse.json({ message: "没有找到这条上传记录，请刷新后再试。" }, { status: 404 });
  }

  if (!supportedDataTypes.has(fileResult.data.data_type ?? "")) {
    return NextResponse.json({ message: "当前 V1.7.4 只支持解析腾讯广点通计划汇总数据。" }, { status: 400 });
  }

  if (!fileResult.data.is_active) {
    return NextResponse.json({ message: "这条上传记录已停用，不能参与解析。请先启用后再解析。" }, { status: 400 });
  }

  if (!fileResult.data.storage_path) {
    await markUploadFailed(supabase, id);
    return NextResponse.json({ message: "这条记录没有 Storage 文件路径，无法解析。" }, { status: 400 });
  }

  const downloadResult = await supabase.storage.from(bucketName).download(fileResult.data.storage_path);

  if (downloadResult.error || !downloadResult.data) {
    await markUploadFailed(supabase, id);
    console.error("[api/uploads/parse-gdt-plan-summary] Storage download failed", {
      name: downloadResult.error?.name,
      message: downloadResult.error?.message,
      bucket: bucketName,
      storagePath: fileResult.data.storage_path,
    });

    return NextResponse.json({ message: "原文件下载失败，请检查 Supabase Storage 文件是否存在。" }, { status: 500 });
  }

  try {
    const parsedData = await parseWorkbookData(downloadResult.data);

    if (!hasGdtPlanKeyFields(parsedData.headers)) {
      await markUploadFailed(supabase, id);
      return NextResponse.json(
        { message: "这个文件不像腾讯广点通计划汇总数据，缺少计划名称、消耗、曝光、点击或转化相关字段。请确认你上传的是腾讯广点通计划汇总报表，不是创意表或线索表。" },
        { status: 400 },
      );
    }

    if (parsedData.rows.length === 0) {
      await markUploadFailed(supabase, id);
      return NextResponse.json({ message: "文件里没有可解析的数据行，请检查是否上传了腾讯广点通计划汇总报表。" }, { status: 400 });
    }

    const mappedRows = parsedData.rows.map((row) => mapGdtPlanSummaryRow(id, row));
    const deleteResult = await supabase.from("gdt_plan_summary_rows").delete().eq("uploaded_file_id", id);

    if (deleteResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-gdt-plan-summary] old rows delete failed", {
        code: deleteResult.error.code,
        message: deleteResult.error.message,
        details: deleteResult.error.details,
        hint: deleteResult.error.hint,
      });

      return NextResponse.json({ message: "重新解析前清理旧数据失败，请检查 gdt_plan_summary_rows 表权限。" }, { status: 500 });
    }

    const insertResult = await supabase.from("gdt_plan_summary_rows").insert(mappedRows);

    if (insertResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-gdt-plan-summary] rows insert failed", {
        code: insertResult.error.code,
        message: insertResult.error.message,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
      });

      return NextResponse.json({ message: "腾讯广点通计划汇总明细写入失败，请检查 gdt_plan_summary_rows 表字段。" }, { status: 500 });
    }

    const updateResult = await supabase
      .from("uploaded_files")
      .update({
        parse_status: "parsed",
        row_count: mappedRows.length,
      })
      .eq("id", id);

    if (updateResult.error) {
      console.error("[api/uploads/parse-gdt-plan-summary] uploaded_files parsed update failed", {
        code: updateResult.error.code,
        message: updateResult.error.message,
        details: updateResult.error.details,
        hint: updateResult.error.hint,
      });

      return NextResponse.json({ message: "明细已写入，但上传记录状态更新失败，请检查 uploaded_files 表权限。" }, { status: 500 });
    }

    return NextResponse.json({
      rowCount: mappedRows.length,
      message: `腾讯广点通计划汇总数据解析成功，共写入 ${mappedRows.length} 行。`,
    });
  } catch (error) {
    await markUploadFailed(supabase, id);
    console.error("[api/uploads/parse-gdt-plan-summary] parse failed", {
      message: error instanceof Error ? error.message : "unknown parse error",
      originalFileName: fileResult.data.original_file_name,
    });

    return NextResponse.json({ message: "腾讯广点通计划汇总数据解析失败，请确认文件格式和表头是否正确。" }, { status: 500 });
  }
}

async function parseWorkbookData(fileBlob: Blob) {
  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { headers: [], rows: [] };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const headerRows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
  const headers = (headerRows[0] ?? []).map((cell) => String(cell ?? ""));
  const rows = XLSX.utils.sheet_to_json<RawSheetRow>(sheet, {
    defval: null,
    raw: true,
  });

  return { headers, rows };
}

function mapGdtPlanSummaryRow(uploadedFileId: string, row: RawSheetRow) {
  return {
    uploaded_file_id: uploadedFileId,
    date: parseDateCell(getCell(row, "date")),
    account_name: parseTextCell(getCell(row, "account_name")),
    campaign_name: parseTextCell(getCell(row, "campaign_name")),
    plan_name: parseTextCell(getCell(row, "plan_name")),
    ad_group_name: parseTextCell(getCell(row, "ad_group_name")),
    spend: parseNumberCell(getCell(row, "spend")),
    impressions: parseIntegerCell(getCell(row, "impressions")),
    clicks: parseIntegerCell(getCell(row, "clicks")),
    click_rate: parsePercentCell(getCell(row, "click_rate")),
    avg_click_cost: parseNumberCell(getCell(row, "avg_click_cost")),
    conversions: parseIntegerCell(getCell(row, "conversions")),
    conversion_cost: parseNumberCell(getCell(row, "conversion_cost")),
    form_count: parseIntegerCell(getCell(row, "form_count")),
    phone_count: parseIntegerCell(getCell(row, "phone_count")),
    consult_count: parseIntegerCell(getCell(row, "consult_count")),
    raw_row: row,
  };
}

function hasGdtPlanKeyFields(headers: string[]) {
  const mappedFields = new Set(headers.map((header) => headerMap[normalizeHeader(header)]).filter(Boolean));
  const groups = [
    ["plan_name"],
    ["spend"],
    ["impressions"],
    ["clicks"],
    ["conversions", "form_count", "phone_count", "consult_count"],
  ];

  return groups.filter((group) => group.some((field) => mappedFields.has(field))).length >= 2;
}

function getCell(row: RawSheetRow, mappedField: string) {
  const matchedEntry = Object.entries(row).find(([header]) => headerMap[normalizeHeader(header)] === mappedField);
  return matchedEntry?.[1] ?? null;
}

function normalizeHeader(header: string) {
  return toHalfWidth(header)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[（）()]/g, "")
    .toLowerCase();
}

function toHalfWidth(value: string) {
  return value.replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");
}

function parseTextCell(value: CellValue) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseNumberCell(value: CellValue) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/￥/g, "")
    .replace(/¥/g, "")
    .replace(/元/g, "")
    .replace(/%/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return null;

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parsePercentCell(value: CellValue) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value > 1 ? value / 100 : value;
  }

  const text = String(value).trim();
  const numberValue = parseNumberCell(value);
  if (numberValue === null) return null;
  return text.includes("%") || numberValue > 1 ? numberValue / 100 : numberValue;
}

function parseIntegerCell(value: CellValue) {
  const numberValue = parseNumberCell(value);
  return numberValue === null ? null : Math.trunc(numberValue);
}

function parseDateCell(value: CellValue) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return formatDate(new Date(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  const text = parseTextCell(value);
  if (!text) return null;

  const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  const separatedMatch = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (separatedMatch) {
    return `${separatedMatch[1]}-${separatedMatch[2].padStart(2, "0")}-${separatedMatch[3].padStart(2, "0")}`;
  }

  const parsedDate = new Date(text);
  return Number.isNaN(parsedDate.getTime()) ? null : formatDate(parsedDate);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function markUploadFailed(supabase: SupabaseLikeClient, id: string) {
  if (!supabase) return;

  await supabase
    .from("uploaded_files")
    .update({
      parse_status: "failed",
    })
    .eq("id", id);
}
