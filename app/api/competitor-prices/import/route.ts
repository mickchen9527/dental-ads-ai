import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CellValue = string | number | boolean | Date | null | undefined;
type RawSheetRow = Record<string, CellValue>;

type CompetitorPriceInsert = {
  hospital_name: string;
  platform: string;
  city_area: string | null;
  project_category: string | null;
  project_attribute: string | null;
  project_name: string;
  display_price: number | null;
  original_price: number | null;
  package_content: string | null;
  restriction_note: string | null;
  sold_count: number | null;
  rating: number | null;
  review_count: number | null;
  page_url: string | null;
  collected_date: string;
  status: string;
  notes: string | null;
  raw_row: RawSheetRow;
};

const headerAliases: Array<[string, keyof CompetitorPriceInsert]> = [
  ["医院名称", "hospital_name"],
  ["竞品医院", "hospital_name"],
  ["机构名称", "hospital_name"],
  ["平台", "platform"],
  ["城市", "city_area"],
  ["区域", "city_area"],
  ["城市区域", "city_area"],
  ["项目分类", "project_category"],
  ["分类", "project_category"],
  ["项目属性", "project_attribute"],
  ["属性", "project_attribute"],
  ["项目名称", "project_name"],
  ["套餐名称", "project_name"],
  ["美团套餐标题", "project_name"],
  ["展示价", "display_price"],
  ["价格", "display_price"],
  ["团购价", "display_price"],
  ["到手价", "display_price"],
  ["原价", "original_price"],
  ["划线价", "original_price"],
  ["套餐内容", "package_content"],
  ["内容", "package_content"],
  ["限制说明", "restriction_note"],
  ["使用限制", "restriction_note"],
  ["购买须知", "restriction_note"],
  ["销量", "sold_count"],
  ["已售", "sold_count"],
  ["评分", "rating"],
  ["评价数", "review_count"],
  ["评论数", "review_count"],
  ["页面链接", "page_url"],
  ["美团链接", "page_url"],
  ["链接", "page_url"],
  ["采集日期", "collected_date"],
  ["收集日期", "collected_date"],
  ["状态", "status"],
  ["备注", "notes"],
];

const headerMap = headerAliases.reduce<Record<string, keyof CompetitorPriceInsert>>((result, [header, field]) => {
  result[normalizeHeader(header)] = field;
  return result;
}, {});

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "没有收到竞品价格表文件，请重新选择 Excel 或 CSV 文件。" }, { status: 400 });
  }

  try {
    const rows = await parseWorkbookRows(file);

    if (rows.length === 0) {
      return NextResponse.json({ message: "竞品价格表里没有可导入的数据行，请检查文件内容。" }, { status: 400 });
    }

    const inserts: CompetitorPriceInsert[] = [];
    let failedCount = 0;

    rows.forEach((row) => {
      const hospitalName = parseTextCell(getCell(row, "hospital_name"));
      const projectName = parseTextCell(getCell(row, "project_name"));

      if (!hospitalName || !projectName) {
        failedCount += 1;
        return;
      }

      inserts.push({
        hospital_name: hospitalName,
        platform: parseTextCell(getCell(row, "platform")) ?? "美团",
        city_area: parseTextCell(getCell(row, "city_area")),
        project_category: parseTextCell(getCell(row, "project_category")),
        project_attribute: parseTextCell(getCell(row, "project_attribute")),
        project_name: projectName,
        display_price: parseMoneyCell(getCell(row, "display_price")),
        original_price: parseMoneyCell(getCell(row, "original_price")),
        package_content: parseTextCell(getCell(row, "package_content")),
        restriction_note: parseTextCell(getCell(row, "restriction_note")),
        sold_count: parseIntegerCell(getCell(row, "sold_count")),
        rating: parseMoneyCell(getCell(row, "rating")),
        review_count: parseIntegerCell(getCell(row, "review_count")),
        page_url: parseTextCell(getCell(row, "page_url")),
        collected_date: parseDateCell(getCell(row, "collected_date")) ?? todayString(),
        status: parseStatusCell(getCell(row, "status")),
        notes: parseTextCell(getCell(row, "notes")),
        raw_row: row,
      });
    });

    if (inserts.length > 0) {
      const insertResult = await supabase.from("competitor_price_items").insert(inserts);

      if (insertResult.error) {
        console.error("[api/competitor-prices/import] insert failed", {
          code: insertResult.error.code,
          message: insertResult.error.message,
          details: insertResult.error.details,
          hint: insertResult.error.hint,
        });

        return NextResponse.json({ message: "批量导入竞品价格失败，请检查 competitor_price_items 表字段。" }, { status: 500 });
      }
    }

    return NextResponse.json({
      importedCount: inserts.length,
      failedCount,
      message: `导入完成：成功 ${inserts.length} 条，失败 ${failedCount} 条。失败通常是缺少医院名称或项目名称。`,
    });
  } catch (error) {
    console.error("[api/competitor-prices/import] parse failed", {
      message: error instanceof Error ? error.message : "unknown import error",
      fileName: file.name,
    });

    return NextResponse.json({ message: "竞品价格表解析失败，请确认文件格式和表头是否正确。" }, { status: 500 });
  }
}

async function parseWorkbookRows(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<RawSheetRow>(sheet, {
    defval: null,
    raw: true,
  });
}

function getCell(row: RawSheetRow, mappedField: keyof CompetitorPriceInsert) {
  const matchedEntry = Object.entries(row).find(([header]) => headerMap[normalizeHeader(header)] === mappedField);
  return matchedEntry?.[1] ?? null;
}

function normalizeHeader(header: string) {
  return toHalfWidth(header)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[\/、，,:：]/g, "")
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

function parseMoneyCell(value: CellValue) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/￥/g, "")
    .replace(/¥/g, "")
    .replace(/元/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseIntegerCell(value: CellValue) {
  const numberValue = parseMoneyCell(value);
  return numberValue === null ? null : Math.trunc(numberValue);
}

function parseDateCell(value: CellValue) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const parsed = new Date(Date.UTC(date.y, date.m - 1, date.d));
      return parsed.toISOString().slice(0, 10);
    }
  }
  const text = String(value).trim();
  const normalized = text.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function parseStatusCell(value: CellValue) {
  const text = parseTextCell(value)?.toLowerCase();
  if (!text) return "active";
  if (["停用", "inactive", "下架", "禁用"].includes(text)) return "inactive";
  return "active";
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
