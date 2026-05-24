import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CellValue = string | number | boolean | Date | null | undefined;
type RawSheetRow = Record<string, CellValue>;

type ProjectPriceInsert = {
  project_name: string;
  project_category: string | null;
  ekanya_system_price: number | null;
  platform_display_price: number | null;
  campaign_price: number | null;
  common_actual_price: number | null;
  package_content: string | null;
  is_lead_project: boolean;
  is_high_ticket: boolean;
  observation_cycle: string | null;
  status: string;
  notes: string | null;
};

const headerAliases: Array<[string, keyof ProjectPriceInsert]> = [
  ["项目名称", "project_name"],
  ["名称", "project_name"],
  ["项目", "project_name"],
  ["项目分类", "project_category"],
  ["分类", "project_category"],
  ["e看牙系统价", "ekanya_system_price"],
  ["系统价", "ekanya_system_price"],
  ["原价", "ekanya_system_price"],
  ["平台展示价", "platform_display_price"],
  ["展示价", "platform_display_price"],
  ["活动价", "campaign_price"],
  ["优惠价", "campaign_price"],
  ["团购价", "campaign_price"],
  ["实际常见成交价", "common_actual_price"],
  ["常见成交价", "common_actual_price"],
  ["成交价", "common_actual_price"],
  ["套餐包含内容", "package_content"],
  ["套餐内容", "package_content"],
  ["包含内容", "package_content"],
  ["是否引流项目", "is_lead_project"],
  ["引流项目", "is_lead_project"],
  ["是否高客单项目", "is_high_ticket"],
  ["高客单项目", "is_high_ticket"],
  ["观察周期", "observation_cycle"],
  ["价格备注", "notes"],
  ["备注", "notes"],
  ["状态", "status"],
];

const headerMap = headerAliases.reduce<Record<string, keyof ProjectPriceInsert>>((result, [header, field]) => {
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
    return NextResponse.json({ message: "没有收到价格表文件，请重新选择 Excel 或 CSV 文件。" }, { status: 400 });
  }

  try {
    const rows = await parseWorkbookRows(file);

    if (rows.length === 0) {
      return NextResponse.json({ message: "价格表里没有可导入的数据行，请检查文件内容。" }, { status: 400 });
    }

    const existingResult = await supabase.from("project_price_items").select("project_name");

    if (existingResult.error) {
      console.error("[api/project-pricing/import] existing names query failed", {
        code: existingResult.error.code,
        message: existingResult.error.message,
        details: existingResult.error.details,
        hint: existingResult.error.hint,
      });

      return NextResponse.json({ message: "读取已有项目失败，请检查 project_price_items 表权限。" }, { status: 500 });
    }

    const existingNames = new Set(
      (existingResult.data ?? [])
        .map((item) => normalizeNameKey(item.project_name))
        .filter((item): item is string => Boolean(item)),
    );

    const inserts: ProjectPriceInsert[] = [];
    let skippedCount = 0;
    let failedCount = 0;

    rows.forEach((row) => {
      const projectName = parseTextCell(getCell(row, "project_name"));
      const nameKey = normalizeNameKey(projectName);

      if (!projectName || !nameKey) {
        failedCount += 1;
        return;
      }

      if (existingNames.has(nameKey)) {
        skippedCount += 1;
        return;
      }

      existingNames.add(nameKey);
      inserts.push({
        project_name: projectName,
        project_category: parseTextCell(getCell(row, "project_category")),
        ekanya_system_price: parseMoneyCell(getCell(row, "ekanya_system_price")),
        platform_display_price: parseMoneyCell(getCell(row, "platform_display_price")),
        campaign_price: parseMoneyCell(getCell(row, "campaign_price")),
        common_actual_price: parseMoneyCell(getCell(row, "common_actual_price")),
        package_content: parseTextCell(getCell(row, "package_content")),
        is_lead_project: parseBooleanCell(getCell(row, "is_lead_project")),
        is_high_ticket: parseBooleanCell(getCell(row, "is_high_ticket")),
        observation_cycle: parseTextCell(getCell(row, "observation_cycle")),
        status: parseStatusCell(getCell(row, "status")),
        notes: parseTextCell(getCell(row, "notes")),
      });
    });

    if (inserts.length > 0) {
      const insertResult = await supabase.from("project_price_items").insert(inserts);

      if (insertResult.error) {
        console.error("[api/project-pricing/import] insert failed", {
          code: insertResult.error.code,
          message: insertResult.error.message,
          details: insertResult.error.details,
          hint: insertResult.error.hint,
        });

        return NextResponse.json({ message: "批量导入项目价格失败，请检查 project_price_items 表字段。" }, { status: 500 });
      }
    }

    return NextResponse.json({
      importedCount: inserts.length,
      skippedCount,
      failedCount,
      message: `导入完成：成功 ${inserts.length} 条，跳过同名 ${skippedCount} 条，失败 ${failedCount} 条。`,
    });
  } catch (error) {
    console.error("[api/project-pricing/import] parse failed", {
      message: error instanceof Error ? error.message : "unknown import error",
      fileName: file.name,
    });

    return NextResponse.json({ message: "价格表解析失败，请确认文件格式和表头是否正确。" }, { status: 500 });
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

function getCell(row: RawSheetRow, mappedField: keyof ProjectPriceInsert) {
  const matchedEntry = Object.entries(row).find(([header]) => headerMap[normalizeHeader(header)] === mappedField);
  return matchedEntry?.[1] ?? null;
}

function normalizeHeader(header: string) {
  return toHalfWidth(header)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[（(][^）)]*[）)]/g, "")
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

function parseBooleanCell(value: CellValue) {
  const text = parseTextCell(value)?.toLowerCase();
  if (!text) return false;
  return ["是", "true", "1", "yes", "y"].includes(text);
}

function parseStatusCell(value: CellValue) {
  const text = parseTextCell(value)?.toLowerCase();
  if (!text) return "active";
  if (["停用", "inactive", "下架", "禁用"].includes(text)) return "inactive";
  return "active";
}

function normalizeNameKey(value: unknown) {
  const text = parseTextCell(value as CellValue);
  return text ? text.toLowerCase() : null;
}
