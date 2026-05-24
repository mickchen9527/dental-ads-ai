import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";
const supportedDataTypes = new Set([
  "高德电话/导航/门店访问数据",
  "高德电话 / 导航 / 门店访问数据",
  "高德行为明细数据",
  "高德门店访问数据",
  "高德电话导航数据",
  "amap-actions",
]);

type CellValue = string | number | boolean | Date | null | undefined;
type RawSheetRow = Record<string, CellValue>;
type SupabaseLikeClient = ReturnType<typeof getSupabaseAdminClient>;

const headerAliases: Array<[string, string]> = [
  ["行为时间", "action_time"],
  ["操作时间", "action_time"],
  ["点击时间", "action_time"],
  ["访问时间", "action_time"],
  ["发生时间", "action_time"],
  ["时间", "action_time"],
  ["日期", "date"],
  ["数据日期", "date"],
  ["账户", "account_name"],
  ["账户名称", "account_name"],
  ["广告账户", "account_name"],
  ["推广系列", "campaign_name"],
  ["推广活动", "campaign_name"],
  ["活动名称", "campaign_name"],
  ["广告系列", "campaign_name"],
  ["推广计划", "plan_name"],
  ["计划名称", "plan_name"],
  ["广告计划", "plan_name"],
  ["广告计划名称", "plan_name"],
  ["门店", "store_name"],
  ["门店名称", "store_name"],
  ["推广门店", "store_name"],
  ["店铺名称", "store_name"],
  ["行为类型", "action_type"],
  ["操作类型", "action_type"],
  ["点击类型", "action_type"],
  ["访问类型", "action_type"],
  ["行为名称", "action_name"],
  ["操作名称", "action_name"],
  ["点击名称", "action_name"],
  ["事件名称", "action_name"],
  ["电话点击", "phone_clicks"],
  ["电话点击量", "phone_clicks"],
  ["拨打电话", "phone_clicks"],
  ["电话咨询", "phone_clicks"],
  ["查看电话", "phone_clicks"],
  ["导航点击", "navigation_clicks"],
  ["导航点击量", "navigation_clicks"],
  ["发起导航", "navigation_clicks"],
  ["导航", "navigation_clicks"],
  ["地址点击", "address_clicks"],
  ["查看地址", "address_clicks"],
  ["地址查看", "address_clicks"],
  ["门店浏览", "store_view_count"],
  ["门店浏览量", "store_view_count"],
  ["门店访问", "store_view_count"],
  ["店铺浏览", "store_view_count"],
  ["店铺访问", "store_view_count"],
  ["优惠券点击", "coupon_clicks"],
  ["领券点击", "coupon_clicks"],
  ["团购点击", "coupon_clicks"],
  ["城市", "city"],
  ["所在城市", "city"],
  ["关键词", "keyword"],
  ["搜索词", "keyword"],
  ["搜索关键词", "keyword"],
  ["设备", "device_type"],
  ["设备类型", "device_type"],
  ["终端", "device_type"],
];

const headerMap = headerAliases.reduce<Record<string, string>>((result, [header, field]) => {
  result[normalizeHeader(header)] = field;
  return result;
}, {});

const keyFieldCategories = [
  { label: "行为时间类", fields: ["action_time", "date"] },
  { label: "行为类型类", fields: ["action_type", "action_name"] },
  { label: "电话类", fields: ["phone_clicks"] },
  { label: "导航类", fields: ["navigation_clicks"] },
  { label: "门店访问类", fields: ["store_view_count"] },
  { label: "地址类", fields: ["address_clicks"] },
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
    .select("id, data_type, is_active, storage_path, original_file_name")
    .eq("id", id)
    .single();

  if (fileResult.error || !fileResult.data) {
    return NextResponse.json({ message: "没有找到这条上传记录，请刷新后再试。" }, { status: 404 });
  }

  if (!supportedDataTypes.has(fileResult.data.data_type ?? "")) {
    return NextResponse.json({ message: "当前 V1.7.8 只支持解析高德电话/导航/门店访问数据。" }, { status: 400 });
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
    console.error("[api/uploads/parse-amap-actions] Storage download failed", {
      name: downloadResult.error?.name,
      message: downloadResult.error?.message,
      bucket: bucketName,
      storagePath: fileResult.data.storage_path,
    });

    return NextResponse.json({ message: "原文件下载失败，请检查 Supabase Storage 文件是否存在。" }, { status: 500 });
  }

  try {
    const parsedData = await parseWorkbookData(downloadResult.data);
    const headerDiagnosis = diagnoseAmapActionHeaders(parsedData.headers);

    if (!hasAmapActionKeyFields(headerDiagnosis)) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-amap-actions] header validation failed", {
        headers: parsedData.headers.filter((header) => header.trim().length > 0),
        matchedGroups: headerDiagnosis.matchedCategories,
        missingGroups: headerDiagnosis.missingCategories,
      });

      return NextResponse.json({ message: buildHeaderFailureMessage(parsedData.headers, headerDiagnosis) }, { status: 400 });
    }

    if (parsedData.rows.length === 0) {
      await markUploadFailed(supabase, id);
      return NextResponse.json({ message: "文件里没有可解析的数据行，请检查是否上传了高德行为明细表。" }, { status: 400 });
    }

    const mappedRows = parsedData.rows.map((row) => mapAmapActionRow(id, row));
    const deleteResult = await supabase.from("amap_action_rows").delete().eq("uploaded_file_id", id);

    if (deleteResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-amap-actions] old rows delete failed", {
        code: deleteResult.error.code,
        message: deleteResult.error.message,
        details: deleteResult.error.details,
        hint: deleteResult.error.hint,
        uploadedFileId: id,
      });

      return NextResponse.json({ message: `清理旧高德行为数据失败：${deleteResult.error.message}` }, { status: 500 });
    }

    const insertResult = await supabase.from("amap_action_rows").insert(mappedRows);

    if (insertResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-amap-actions] rows insert failed", {
        code: insertResult.error.code,
        message: insertResult.error.message,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
      });

      return NextResponse.json({ message: "高德电话/导航/门店访问明细写入失败，请检查 amap_action_rows 表字段。" }, { status: 500 });
    }

    const updateResult = await supabase
      .from("uploaded_files")
      .update({
        parse_status: "parsed",
        row_count: mappedRows.length,
      })
      .eq("id", id);

    if (updateResult.error) {
      console.error("[api/uploads/parse-amap-actions] uploaded_files parsed update failed", {
        code: updateResult.error.code,
        message: updateResult.error.message,
        details: updateResult.error.details,
        hint: updateResult.error.hint,
      });

      return NextResponse.json({ message: "明细已写入，但上传记录状态更新失败，请检查 uploaded_files 表权限。" }, { status: 500 });
    }

    return NextResponse.json({
      rowCount: mappedRows.length,
      message: `高德电话/导航/门店访问数据解析成功，共写入 ${mappedRows.length} 行。`,
    });
  } catch (error) {
    await markUploadFailed(supabase, id);
    console.error("[api/uploads/parse-amap-actions] parse failed", {
      message: error instanceof Error ? error.message : "unknown parse error",
      originalFileName: fileResult.data.original_file_name,
    });

    return NextResponse.json({ message: "高德电话/导航/门店访问数据解析失败，请确认文件格式和表头是否正确。" }, { status: 500 });
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
  const headerRowIndex = findHeaderRowIndex(headerRows);

  if (headerRowIndex < 0) {
    return { headers: [], rows: [] };
  }

  const headers = rowToHeaders(headerRows[headerRowIndex] ?? []);
  const rows = XLSX.utils.sheet_to_json<RawSheetRow>(sheet, {
    defval: null,
    raw: true,
    range: headerRowIndex,
  }).filter(hasAnyCellValue);

  return { headers, rows };
}

function findHeaderRowIndex(headerRows: CellValue[][]) {
  const nonEmptyRows = headerRows
    .map((row, index) => ({ index, headers: rowToHeaders(row) }))
    .filter((item) => item.headers.some((header) => header.trim().length > 0));

  if (nonEmptyRows.length === 0) return -1;

  const likelyHeaderRow = nonEmptyRows.find((item) => hasAmapActionKeyFields(diagnoseAmapActionHeaders(item.headers)));
  if (likelyHeaderRow) return likelyHeaderRow.index;

  const rowWithMappedFields = nonEmptyRows
    .map((item) => ({
      ...item,
      mappedCount: item.headers.filter((header) => headerMap[normalizeHeader(header)]).length,
    }))
    .sort((first, second) => second.mappedCount - first.mappedCount)[0];

  if (rowWithMappedFields && rowWithMappedFields.mappedCount > 0) return rowWithMappedFields.index;

  return nonEmptyRows[0].index;
}

function rowToHeaders(row: CellValue[]) {
  return row.map((cell) => String(cell ?? "").trim());
}

function hasAnyCellValue(row: RawSheetRow) {
  return Object.values(row).some((value) => parseTextCell(value) !== null);
}

function mapAmapActionRow(uploadedFileId: string, row: RawSheetRow) {
  const actionTime = parseDateTimeCell(getCell(row, "action_time"));
  const date = parseDateCell(getCell(row, "date")) ?? extractDateFromDateTime(actionTime);
  const actionType = parseTextCell(getCell(row, "action_type"));
  const actionName = parseTextCell(getCell(row, "action_name"));
  const actionText = [actionType, actionName].filter(Boolean).join(" ");

  return {
    uploaded_file_id: uploadedFileId,
    action_time: actionTime,
    date,
    account_name: parseTextCell(getCell(row, "account_name")),
    campaign_name: parseTextCell(getCell(row, "campaign_name")),
    plan_name: parseTextCell(getCell(row, "plan_name")),
    store_name: parseTextCell(getCell(row, "store_name")),
    action_type: actionType,
    action_name: actionName,
    phone_clicks: parseIntegerWithActionFallback(getCell(row, "phone_clicks"), actionText, ["电话", "拨打", "查看电话"]),
    navigation_clicks: parseIntegerWithActionFallback(getCell(row, "navigation_clicks"), actionText, ["导航"]),
    address_clicks: parseIntegerWithActionFallback(getCell(row, "address_clicks"), actionText, ["地址"]),
    store_view_count: parseIntegerWithActionFallback(getCell(row, "store_view_count"), actionText, ["门店", "浏览", "访问"]),
    coupon_clicks: parseIntegerWithActionFallback(getCell(row, "coupon_clicks"), actionText, ["券", "团购"]),
    city: parseTextCell(getCell(row, "city")),
    keyword: parseTextCell(getCell(row, "keyword")),
    device_type: parseTextCell(getCell(row, "device_type")),
    raw_row: row,
  };
}

function hasAmapActionKeyFields(diagnosis: ReturnType<typeof diagnoseAmapActionHeaders>) {
  return diagnosis.matchedCategories.length >= 2;
}

function diagnoseAmapActionHeaders(headers: string[]) {
  const mappedFields = new Set(headers.map((header) => headerMap[normalizeHeader(header)]).filter(Boolean));
  const matchedCategories = keyFieldCategories
    .filter((category) => category.fields.some((field) => mappedFields.has(field)))
    .map((category) => category.label);
  const missingCategories = keyFieldCategories
    .filter((category) => !category.fields.some((field) => mappedFields.has(field)))
    .map((category) => category.label);

  return { matchedCategories, missingCategories };
}

function buildHeaderFailureMessage(headers: string[], diagnosis: ReturnType<typeof diagnoseAmapActionHeaders>) {
  const visibleHeaders = headers.filter((header) => header.trim().length > 0);
  const headerText = visibleHeaders.length > 0 ? visibleHeaders.join("、") : "没有读到表头";
  const matchedText = diagnosis.matchedCategories.length > 0 ? diagnosis.matchedCategories.join("、") : "无";
  const missingText = diagnosis.missingCategories.length > 0 ? diagnosis.missingCategories.join("、") : "无";

  return `解析失败：当前读取到的表头是：${headerText}。已识别：${matchedText}。缺失：${missingText}。请确认你上传的是高德行为明细表，不是推广汇总表或线索表。`;
}

function getCell(row: RawSheetRow, mappedField: string) {
  const matchedEntry = Object.entries(row).find(([header]) => headerMap[normalizeHeader(header)] === mappedField);
  return matchedEntry?.[1] ?? null;
}

function normalizeHeader(header: string) {
  return toHalfWidth(header)
    .trim()
    .replace(/[（(][^）)]*[）)]/g, "")
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, "");
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

function parseIntegerCell(value: CellValue) {
  const numberValue = parseNumberCell(value);
  return numberValue === null ? null : Math.trunc(numberValue);
}

function parseIntegerWithActionFallback(value: CellValue, actionText: string, keywords: string[]) {
  const parsedValue = parseIntegerCell(value);
  if (parsedValue !== null) return parsedValue;
  if (!actionText) return null;
  return keywords.some((keyword) => actionText.includes(keyword)) ? 1 : null;
}

function parseDateTimeCell(value: CellValue) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateTime(value);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return formatDateTime(new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H ?? 0, parsed.M ?? 0, Math.floor(parsed.S ?? 0)));
    }
  }

  const text = parseTextCell(value);
  if (!text) return null;

  const normalized = text
    .replace(/年/g, "-")
    .replace(/月/g, "-")
    .replace(/日/g, "")
    .replace(/\//g, "-")
    .trim();

  const dateTimeMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dateTimeMatch) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = dateTimeMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
  }

  const compactMatch = normalized.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]} 00:00:00`;
  }

  const parsedDate = new Date(text);
  return Number.isNaN(parsedDate.getTime()) ? null : formatDateTime(parsedDate);
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

function extractDateFromDateTime(value: string | null) {
  return value ? value.slice(0, 10) : null;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${formatDate(date)} ${hour}:${minute}:${second}`;
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
