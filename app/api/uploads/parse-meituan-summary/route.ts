import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";
const supportedDataTypes = new Set(["美团推广汇总数据", "meituan-summary"]);

type CellValue = string | number | boolean | Date | null | undefined;
type RawSheetRow = Record<string, CellValue>;
type SupabaseLikeClient = ReturnType<typeof getSupabaseAdminClient>;

const headerMap: Record<string, string> = {
  日期: "date",
  推广名称: "promotion_name",
  推广门店: "store_name",
  花费: "spend",
  曝光: "impressions",
  点击: "clicks",
  点击均价: "avg_click_cost",
  商户浏览量: "merchant_views",
  查看电话: "phone_views",
  在线咨询点击: "online_consult_clicks",
  订单量: "orders",
  团购订单量: "group_buy_orders",
  "15日团购订单量": "group_buy_orders_15d",
};

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
    return NextResponse.json({ message: "当前 V1.6.3.1 只支持解析美团推广汇总数据。" }, { status: 400 });
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
    console.error("[api/uploads/parse-meituan-summary] Storage download failed", {
      name: downloadResult.error?.name,
      message: downloadResult.error?.message,
      bucket: bucketName,
      storagePath: fileResult.data.storage_path,
    });

    return NextResponse.json({ message: "原文件下载失败，请检查 Supabase Storage 文件是否存在。" }, { status: 500 });
  }

  try {
    const rows = await parseWorkbookRows(downloadResult.data);

    if (rows.length === 0) {
      await markUploadFailed(supabase, id);
      return NextResponse.json({ message: "文件里没有可解析的数据行，请检查是否上传了美团推广汇总表。" }, { status: 400 });
    }

    const mappedRows = rows.map((row) => mapMeituanSummaryRow(id, row));
    const periodRange = getDateRange(mappedRows.map((row) => row.date));
    const deleteResult = await supabase.from("meituan_summary_rows").delete().eq("uploaded_file_id", id);

    if (deleteResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-meituan-summary] old rows delete failed", {
        code: deleteResult.error.code,
        message: deleteResult.error.message,
        details: deleteResult.error.details,
        hint: deleteResult.error.hint,
      });

      return NextResponse.json({ message: "重新解析前清理旧数据失败，请检查 meituan_summary_rows 表权限。" }, { status: 500 });
    }

    const insertResult = await supabase.from("meituan_summary_rows").insert(mappedRows);

    if (insertResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-meituan-summary] rows insert failed", {
        code: insertResult.error.code,
        message: insertResult.error.message,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
      });

      return NextResponse.json({ message: "美团汇总明细写入失败，请检查 meituan_summary_rows 表字段。" }, { status: 500 });
    }

    const updateResult = await supabase
      .from("uploaded_files")
      .update({
        parse_status: "parsed",
        row_count: mappedRows.length,
        period_start: periodRange.start,
        period_end: periodRange.end,
      })
      .eq("id", id);

    if (updateResult.error) {
      console.error("[api/uploads/parse-meituan-summary] uploaded_files parsed update failed", {
        code: updateResult.error.code,
        message: updateResult.error.message,
        details: updateResult.error.details,
        hint: updateResult.error.hint,
      });

      return NextResponse.json({ message: "明细已写入，但上传记录状态更新失败，请检查 uploaded_files 表权限。" }, { status: 500 });
    }

    return NextResponse.json({
      rowCount: mappedRows.length,
      message: `美团推广汇总数据解析成功，共写入 ${mappedRows.length} 行。`,
    });
  } catch (error) {
    await markUploadFailed(supabase, id);
    console.error("[api/uploads/parse-meituan-summary] parse failed", {
      message: error instanceof Error ? error.message : "unknown parse error",
      originalFileName: fileResult.data.original_file_name,
    });

    return NextResponse.json({ message: "美团推广汇总数据解析失败，请确认文件格式和表头是否正确。" }, { status: 500 });
  }
}

async function parseWorkbookRows(fileBlob: Blob) {
  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<RawSheetRow>(sheet, {
    defval: null,
    raw: false,
  });
}

function mapMeituanSummaryRow(uploadedFileId: string, row: RawSheetRow) {
  return {
    uploaded_file_id: uploadedFileId,
    date: parseDateCell(getCell(row, "date")),
    promotion_name: parseTextCell(getCell(row, "promotion_name")),
    store_name: parseTextCell(getCell(row, "store_name")),
    spend: parseNumberCell(getCell(row, "spend")),
    impressions: parseIntegerCell(getCell(row, "impressions")),
    clicks: parseIntegerCell(getCell(row, "clicks")),
    avg_click_cost: parseNumberCell(getCell(row, "avg_click_cost")),
    merchant_views: parseIntegerCell(getCell(row, "merchant_views")),
    phone_views: parseIntegerCell(getCell(row, "phone_views")),
    online_consult_clicks: parseIntegerCell(getCell(row, "online_consult_clicks")),
    orders: parseIntegerCell(getCell(row, "orders")),
    group_buy_orders: parseIntegerCell(getCell(row, "group_buy_orders")),
    group_buy_orders_15d: parseIntegerCell(getCell(row, "group_buy_orders_15d")),
    raw_row: row,
  };
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
    .replace(/[：:]/g, "")
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

  const normalized = String(value).replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!normalized) return null;

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
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

  const monthDayMatch = text.match(/^(\d{1,2})[-/.月](\d{1,2})(?:日)?$/);
  if (monthDayMatch) {
    const year = new Date().getFullYear();
    return `${year}-${monthDayMatch[1].padStart(2, "0")}-${monthDayMatch[2].padStart(2, "0")}`;
  }

  const parsedDate = new Date(text);
  return Number.isNaN(parsedDate.getTime()) ? null : formatDate(parsedDate);
}

function getDateRange(values: Array<string | null>) {
  const dates = values.filter((value): value is string => Boolean(value)).sort();
  return {
    start: dates[0] ?? null,
    end: dates.at(-1) ?? null,
  };
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
