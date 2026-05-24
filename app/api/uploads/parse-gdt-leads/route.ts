import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";
const supportedDataTypes = new Set([
  "腾讯表单/电话线索数据",
  "腾讯表单 / 电话线索数据",
  "腾讯线索数据",
  "广点通线索数据",
  "腾讯表单线索数据",
  "腾讯电话线索数据",
  "gdt-leads",
]);

type CellValue = string | number | boolean | Date | null | undefined;
type RawSheetRow = Record<string, CellValue>;
type SupabaseLikeClient = ReturnType<typeof getSupabaseAdminClient>;

const headerAliases: Array<[string, string]> = [
  ["线索时间", "lead_time"],
  ["提交时间", "lead_time"],
  ["表单时间", "lead_time"],
  ["电话时间", "lead_time"],
  ["创建时间", "lead_time"],
  ["留资时间", "lead_time"],
  ["咨询时间", "lead_time"],
  ["线索创建时间", "lead_time"],
  ["客户提交时间", "lead_time"],
  ["日期", "date"],
  ["数据日期", "date"],
  ["账户", "account_name"],
  ["账户名称", "account_name"],
  ["广告账户", "account_name"],
  ["推广系列", "campaign_name"],
  ["广告系列", "campaign_name"],
  ["项目名称", "campaign_name"],
  ["推广计划", "plan_name"],
  ["计划名称", "plan_name"],
  ["广告计划", "plan_name"],
  ["广告计划名称", "plan_name"],
  ["广告组", "ad_group_name"],
  ["广告组名称", "ad_group_name"],
  ["单元名称", "ad_group_name"],
  ["广告单元", "ad_group_name"],
  ["创意名称", "creative_name"],
  ["广告创意", "creative_name"],
  ["创意", "creative_name"],
  ["线索类型", "lead_type"],
  ["类型", "lead_type"],
  ["线索方式", "lead_type"],
  ["咨询方式", "lead_type"],
  ["来源类型", "lead_type"],
  ["表单/电话", "lead_type"],
  ["表单线索", "lead_type"],
  ["电话线索", "lead_type"],
  ["线索来源", "lead_source"],
  ["来源", "lead_source"],
  ["客户姓名", "customer_name"],
  ["姓名", "customer_name"],
  ["用户名称", "customer_name"],
  ["联系人", "customer_name"],
  ["客户", "customer_name"],
  ["用户", "customer_name"],
  ["昵称", "customer_name"],
  ["手机号后四位", "phone_tail"],
  ["手机尾号", "phone_tail"],
  ["电话后四位", "phone_tail"],
  ["电话尾号", "phone_tail"],
  ["联系电话后四位", "phone_tail"],
  ["手机号", "phone_tail"],
  ["手机", "phone_tail"],
  ["电话", "phone_tail"],
  ["联系电话", "phone_tail"],
  ["客户电话", "phone_tail"],
  ["城市", "city"],
  ["所在城市", "city"],
  ["意向项目", "intention_project"],
  ["咨询项目", "intention_project"],
  ["留资项目", "intention_project"],
  ["项目", "intention_project"],
  ["需求项目", "intention_project"],
  ["咨询内容项目", "intention_project"],
  ["咨询内容", "consult_content"],
  ["留言内容", "consult_content"],
  ["表单内容", "consult_content"],
  ["通话备注", "consult_content"],
  ["沟通内容", "consult_content"],
  ["用户留言", "consult_content"],
  ["需求描述", "consult_content"],
  ["跟进状态", "follow_status"],
  ["处理状态", "follow_status"],
  ["预约状态", "appointment_status"],
  ["是否预约", "appointment_status"],
  ["到院状态", "visit_status"],
  ["是否到院", "visit_status"],
  ["成交状态", "deal_status"],
  ["是否成交", "deal_status"],
  ["备注", "remark"],
  ["说明", "remark"],
];

const headerMap = headerAliases.reduce<Record<string, string>>((result, [header, field]) => {
  result[normalizeHeader(header)] = field;
  return result;
}, {});

const keyFieldCategories = [
  { label: "线索时间类", fields: ["lead_time", "date"] },
  { label: "线索类型类", fields: ["lead_type", "lead_source"] },
  { label: "客户信息类", fields: ["customer_name", "phone_tail"] },
  { label: "意向项目类", fields: ["intention_project"] },
  { label: "咨询内容类", fields: ["consult_content", "remark"] },
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
    return NextResponse.json({ message: "当前 V1.7.6 只支持解析腾讯表单/电话线索数据。" }, { status: 400 });
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
    console.error("[api/uploads/parse-gdt-leads] Storage download failed", {
      name: downloadResult.error?.name,
      message: downloadResult.error?.message,
      bucket: bucketName,
      storagePath: fileResult.data.storage_path,
    });

    return NextResponse.json({ message: "原文件下载失败，请检查 Supabase Storage 文件是否存在。" }, { status: 500 });
  }

  try {
    const parsedData = await parseWorkbookData(downloadResult.data);
    const headerDiagnosis = diagnoseGdtLeadHeaders(parsedData.headers);

    if (!hasGdtLeadKeyFields(headerDiagnosis)) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-gdt-leads] header validation failed", {
        headers: parsedData.headers.filter((header) => header.trim().length > 0),
        matchedGroups: headerDiagnosis.matchedCategories,
        missingGroups: headerDiagnosis.missingCategories,
      });

      return NextResponse.json({ message: buildHeaderFailureMessage(parsedData.headers, headerDiagnosis) }, { status: 400 });
    }

    if (parsedData.rows.length === 0) {
      await markUploadFailed(supabase, id);
      return NextResponse.json({ message: "文件里没有可解析的数据行，请检查是否上传了腾讯线索明细表。" }, { status: 400 });
    }

    const mappedRows = parsedData.rows.map((row) => mapGdtLeadRow(id, row));
    const deleteResult = await supabase.from("gdt_lead_rows").delete().eq("uploaded_file_id", id);

    if (deleteResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-gdt-leads] old rows delete failed", {
        code: deleteResult.error.code,
        message: deleteResult.error.message,
        details: deleteResult.error.details,
        hint: deleteResult.error.hint,
      });

      return NextResponse.json({ message: "重新解析前清理旧数据失败，请检查 gdt_lead_rows 表权限。" }, { status: 500 });
    }

    const insertResult = await supabase.from("gdt_lead_rows").insert(mappedRows);

    if (insertResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-gdt-leads] rows insert failed", {
        code: insertResult.error.code,
        message: insertResult.error.message,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
      });

      return NextResponse.json({ message: "腾讯表单/电话线索明细写入失败，请检查 gdt_lead_rows 表字段。" }, { status: 500 });
    }

    const updateResult = await supabase
      .from("uploaded_files")
      .update({
        parse_status: "parsed",
        row_count: mappedRows.length,
      })
      .eq("id", id);

    if (updateResult.error) {
      console.error("[api/uploads/parse-gdt-leads] uploaded_files parsed update failed", {
        code: updateResult.error.code,
        message: updateResult.error.message,
        details: updateResult.error.details,
        hint: updateResult.error.hint,
      });

      return NextResponse.json({ message: "明细已写入，但上传记录状态更新失败，请检查 uploaded_files 表权限。" }, { status: 500 });
    }

    return NextResponse.json({
      rowCount: mappedRows.length,
      message: `腾讯表单/电话线索数据解析成功，共写入 ${mappedRows.length} 行。`,
    });
  } catch (error) {
    await markUploadFailed(supabase, id);
    console.error("[api/uploads/parse-gdt-leads] parse failed", {
      message: error instanceof Error ? error.message : "unknown parse error",
      originalFileName: fileResult.data.original_file_name,
    });

    return NextResponse.json({ message: "腾讯表单/电话线索数据解析失败，请确认文件格式和表头是否正确。" }, { status: 500 });
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

  const likelyHeaderRow = nonEmptyRows.find((item) => hasGdtLeadKeyFields(diagnoseGdtLeadHeaders(item.headers)));
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

function mapGdtLeadRow(uploadedFileId: string, row: RawSheetRow) {
  const leadTime = parseDateTimeCell(getCell(row, "lead_time"));
  const date = parseDateCell(getCell(row, "date")) ?? extractDateFromDateTime(leadTime);
  const consultContent = parseTextCell(getCell(row, "consult_content")) ?? parseTextCell(getCell(row, "remark"));

  return {
    uploaded_file_id: uploadedFileId,
    lead_time: leadTime,
    date,
    account_name: parseTextCell(getCell(row, "account_name")),
    campaign_name: parseTextCell(getCell(row, "campaign_name")),
    plan_name: parseTextCell(getCell(row, "plan_name")),
    ad_group_name: parseTextCell(getCell(row, "ad_group_name")),
    creative_name: parseTextCell(getCell(row, "creative_name")),
    lead_type: parseTextCell(getCell(row, "lead_type")),
    lead_source: parseTextCell(getCell(row, "lead_source")),
    customer_name: parseTextCell(getCell(row, "customer_name")),
    phone_tail: parsePhoneTailCell(getCell(row, "phone_tail")),
    city: parseTextCell(getCell(row, "city")),
    intention_project: parseTextCell(getCell(row, "intention_project")),
    consult_content: consultContent,
    follow_status: parseTextCell(getCell(row, "follow_status")),
    appointment_status: parseTextCell(getCell(row, "appointment_status")),
    visit_status: parseTextCell(getCell(row, "visit_status")),
    deal_status: parseTextCell(getCell(row, "deal_status")),
    remark: parseTextCell(getCell(row, "remark")),
    raw_row: sanitizeRawRow(row),
  };
}

function hasGdtLeadKeyFields(diagnosis: ReturnType<typeof diagnoseGdtLeadHeaders>) {
  return diagnosis.matchedCategories.length >= 2;
}

function diagnoseGdtLeadHeaders(headers: string[]) {
  const mappedFields = new Set(headers.map((header) => headerMap[normalizeHeader(header)]).filter(Boolean));
  const matchedCategories = keyFieldCategories
    .filter((category) => category.fields.some((field) => mappedFields.has(field)))
    .map((category) => category.label);
  const missingCategories = keyFieldCategories
    .filter((category) => !category.fields.some((field) => mappedFields.has(field)))
    .map((category) => category.label);

  return { matchedCategories, missingCategories };
}

function buildHeaderFailureMessage(headers: string[], diagnosis: ReturnType<typeof diagnoseGdtLeadHeaders>) {
  const visibleHeaders = headers.filter((header) => header.trim().length > 0);
  const headerText = visibleHeaders.length > 0 ? visibleHeaders.join("、") : "没有读到表头";
  const matchedText = diagnosis.matchedCategories.length > 0 ? diagnosis.matchedCategories.join("、") : "无";
  const missingText = diagnosis.missingCategories.length > 0 ? diagnosis.missingCategories.join("、") : "无";

  return `解析失败：当前读取到的表头是：${headerText}。已识别：${matchedText}。缺失：${missingText}。请确认你上传的是腾讯线索明细表，不是计划汇总表或创意表。`;
}

function sanitizeRawRow(row: RawSheetRow) {
  return Object.fromEntries(
    Object.entries(row).map(([header, value]) => {
      const normalizedHeader = normalizeHeader(header);
      const mappedField = headerMap[normalizedHeader];

      if (mappedField === "phone_tail" || isPhoneLikeHeader(normalizedHeader)) {
        return [header, parsePhoneTailCell(value)];
      }

      return [header, value];
    }),
  );
}

function isPhoneLikeHeader(normalizedHeader: string) {
  return (
    normalizedHeader.includes("手机号") ||
    normalizedHeader.includes("手机") ||
    normalizedHeader.includes("电话") ||
    normalizedHeader.includes("联系方式") ||
    normalizedHeader.includes("联系电话")
  );
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

function parsePhoneTailCell(value: CellValue) {
  const text = parseTextCell(value);
  if (!text) return null;
  const digits = text.replace(/\D/g, "");
  if (!digits) return null;
  return digits.slice(-4);
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
