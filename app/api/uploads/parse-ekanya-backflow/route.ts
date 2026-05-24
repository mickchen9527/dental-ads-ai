import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "uploaded-files";
const supportedDataTypes = new Set(["e看牙后端回流数据", "ekanya-backflow"]);

type CellValue = string | number | boolean | Date | null | undefined;
type RawSheetRow = Record<string, CellValue>;
type SupabaseLikeClient = ReturnType<typeof getSupabaseAdminClient>;

const headerAliases: Array<[string, string]> = [
  ["来源日期", "source_date"],
  ["初次来源日期", "source_date"],
  ["登记日期", "source_date"],
  ["创建日期", "source_date"],
  ["到院日期", "visit_date"],
  ["就诊日期", "visit_date"],
  ["初诊日期", "visit_date"],
  ["成交日期", "deal_date"],
  ["收费日期", "deal_date"],
  ["付款日期", "deal_date"],
  ["患者姓名", "patient_name"],
  ["客户姓名", "patient_name"],
  ["姓名", "patient_name"],
  ["患者编号", "patient_no"],
  ["病历号", "patient_no"],
  ["客户编号", "patient_no"],
  ["手机号后四位", "phone_tail"],
  ["手机尾号", "phone_tail"],
  ["电话后四位", "phone_tail"],
  ["来源平台", "source_platform"],
  ["客户来源", "source_platform"],
  ["来源", "source_platform"],
  ["来源渠道", "source_channel"],
  ["渠道", "source_channel"],
  ["二级来源", "source_channel"],
  ["意向项目", "intention_project"],
  ["咨询项目", "intention_project"],
  ["初始项目", "intention_project"],
  ["到院项目", "visit_project"],
  ["就诊项目", "visit_project"],
  ["检查项目", "visit_project"],
  ["成交项目", "deal_project"],
  ["收费项目", "deal_project"],
  ["购买项目", "deal_project"],
  ["预约状态", "appointment_status"],
  ["是否预约", "appointment_status"],
  ["到院状态", "visit_status"],
  ["是否到院", "visit_status"],
  ["就诊状态", "visit_status"],
  ["成交状态", "deal_status"],
  ["是否成交", "deal_status"],
  ["实收金额", "paid_amount"],
  ["收费金额", "paid_amount"],
  ["已收金额", "paid_amount"],
  ["实付金额", "paid_amount"],
  ["应收金额", "receivable_amount"],
  ["原价金额", "receivable_amount"],
  ["优惠金额", "discount_amount"],
  ["减免金额", "discount_amount"],
  ["医生", "doctor_name"],
  ["接诊医生", "doctor_name"],
  ["咨询师", "consultant_name"],
  ["接待", "consultant_name"],
  ["客服", "consultant_name"],
  ["备注", "remark"],
  ["说明", "remark"],
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
    return NextResponse.json({ message: "当前 V1.6.3.3 只支持解析 e看牙后端回流数据。" }, { status: 400 });
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
    console.error("[api/uploads/parse-ekanya-backflow] Storage download failed", {
      name: downloadResult.error?.name,
      message: downloadResult.error?.message,
      bucket: bucketName,
      storagePath: fileResult.data.storage_path,
    });

    return NextResponse.json({ message: "原文件下载失败，请检查 Supabase Storage 文件是否存在。" }, { status: 500 });
  }

  try {
    const parsedData = await parseWorkbookData(downloadResult.data);

    if (!hasEkanyaKeyField(parsedData.headers)) {
      await markUploadFailed(supabase, id);
      return NextResponse.json(
        { message: "这个文件不像 e看牙后端回流数据，缺少来源、到院、成交或实收相关字段。请确认你上传的是 e看牙导出的客户/就诊/收费数据。" },
        { status: 400 },
      );
    }

    if (parsedData.rows.length === 0) {
      await markUploadFailed(supabase, id);
      return NextResponse.json({ message: "文件里没有可解析的数据行，请检查是否上传了 e看牙导出的客户/就诊/收费数据。" }, { status: 400 });
    }

    const mappedRows = parsedData.rows.map((row) => mapEkanyaBackflowRow(id, row));
    const deleteResult = await supabase.from("ekanya_backflow_rows").delete().eq("uploaded_file_id", id);

    if (deleteResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-ekanya-backflow] old rows delete failed", {
        code: deleteResult.error.code,
        message: deleteResult.error.message,
        details: deleteResult.error.details,
        hint: deleteResult.error.hint,
      });

      return NextResponse.json({ message: "重新解析前清理旧数据失败，请检查 ekanya_backflow_rows 表权限。" }, { status: 500 });
    }

    const insertResult = await supabase.from("ekanya_backflow_rows").insert(mappedRows);

    if (insertResult.error) {
      await markUploadFailed(supabase, id);
      console.error("[api/uploads/parse-ekanya-backflow] rows insert failed", {
        code: insertResult.error.code,
        message: insertResult.error.message,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
      });

      return NextResponse.json({ message: "e看牙后端回流明细写入失败，请检查 ekanya_backflow_rows 表字段。" }, { status: 500 });
    }

    const updateResult = await supabase
      .from("uploaded_files")
      .update({
        parse_status: "parsed",
        row_count: mappedRows.length,
      })
      .eq("id", id);

    if (updateResult.error) {
      console.error("[api/uploads/parse-ekanya-backflow] uploaded_files parsed update failed", {
        code: updateResult.error.code,
        message: updateResult.error.message,
        details: updateResult.error.details,
        hint: updateResult.error.hint,
      });

      return NextResponse.json({ message: "明细已写入，但上传记录状态更新失败，请检查 uploaded_files 表权限。" }, { status: 500 });
    }

    return NextResponse.json({
      rowCount: mappedRows.length,
      message: `e看牙后端回流数据解析成功，共写入 ${mappedRows.length} 行。`,
    });
  } catch (error) {
    await markUploadFailed(supabase, id);
    console.error("[api/uploads/parse-ekanya-backflow] parse failed", {
      message: error instanceof Error ? error.message : "unknown parse error",
      originalFileName: fileResult.data.original_file_name,
    });

    return NextResponse.json({ message: "e看牙后端回流数据解析失败，请确认文件格式和表头是否正确。" }, { status: 500 });
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

function mapEkanyaBackflowRow(uploadedFileId: string, row: RawSheetRow) {
  return {
    uploaded_file_id: uploadedFileId,
    source_date: parseDateCell(getCell(row, "source_date")),
    visit_date: parseDateCell(getCell(row, "visit_date")),
    deal_date: parseDateCell(getCell(row, "deal_date")),
    patient_name: parseTextCell(getCell(row, "patient_name")),
    patient_no: parseTextCell(getCell(row, "patient_no")),
    phone_tail: parseTextCell(getCell(row, "phone_tail")),
    source_platform: parseTextCell(getCell(row, "source_platform")),
    source_channel: parseTextCell(getCell(row, "source_channel")),
    intention_project: parseTextCell(getCell(row, "intention_project")),
    visit_project: parseTextCell(getCell(row, "visit_project")),
    deal_project: parseTextCell(getCell(row, "deal_project")),
    appointment_status: parseTextCell(getCell(row, "appointment_status")),
    visit_status: parseTextCell(getCell(row, "visit_status")),
    deal_status: parseTextCell(getCell(row, "deal_status")),
    paid_amount: parseNumberCell(getCell(row, "paid_amount")),
    receivable_amount: parseNumberCell(getCell(row, "receivable_amount")),
    discount_amount: parseNumberCell(getCell(row, "discount_amount")),
    doctor_name: parseTextCell(getCell(row, "doctor_name")),
    consultant_name: parseTextCell(getCell(row, "consultant_name")),
    remark: parseTextCell(getCell(row, "remark")),
    raw_row: row,
  };
}

function hasEkanyaKeyField(headers: string[]) {
  return headers.some((header) => {
    const mappedField = headerMap[normalizeHeader(header)];
    return ["source_platform", "visit_status", "deal_status", "paid_amount"].includes(mappedField);
  });
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

  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/￥/g, "")
    .replace(/元/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return null;

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
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