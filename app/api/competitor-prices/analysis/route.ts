import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CompetitorPriceRow = {
  id: string;
  hospital_name: string | null;
  platform: string | null;
  city_area: string | null;
  project_category: string | null;
  project_attribute: string | null;
  project_name: string | null;
  display_price: number | null;
  original_price: number | null;
  package_content: string | null;
  restriction_note: string | null;
  sold_count: number | null;
  rating: number | null;
  review_count: number | null;
  page_url: string | null;
  collected_date: string | null;
  status: string | null;
  notes: string | null;
};

type CategoryBucket = {
  projectCategory: string;
  items: CompetitorPriceRow[];
};

type HospitalBucket = {
  hospitalName: string;
  items: CompetitorPriceRow[];
};

const priceBands = [
  { bandName: "0-99", min: 0, max: 99 },
  { bandName: "100-299", min: 100, max: 299 },
  { bandName: "300-999", min: 300, max: 999 },
  { bandName: "1000-4999", min: 1000, max: 4999 },
  { bandName: "5000以上", min: 5000, max: Infinity },
];

const highValueCategories = new Set(["种植", "正畸", "儿童早矫", "修复/牙冠", "美白/贴面"]);

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const hospitalName = normalizeText(searchParams.get("hospitalName"));
  const projectCategory = normalizeText(searchParams.get("projectCategory"));
  const projectAttribute = normalizeText(searchParams.get("projectAttribute"));
  const keyword = normalizeText(searchParams.get("keyword"));
  const minPrice = parseMoney(searchParams.get("minPrice"));
  const maxPrice = parseMoney(searchParams.get("maxPrice"));
  const startDate = normalizeDate(searchParams.get("startDate"));
  const endDate = normalizeDate(searchParams.get("endDate"));

  let query = supabase
    .from("competitor_price_items")
    .select(
      "id, hospital_name, platform, city_area, project_category, project_attribute, project_name, display_price, original_price, package_content, restriction_note, sold_count, rating, review_count, page_url, collected_date, status, notes",
    )
    .eq("status", "active")
    .order("collected_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (hospitalName) query = query.ilike("hospital_name", `%${hospitalName}%`);
  if (projectCategory && projectCategory !== "全部") query = query.eq("project_category", projectCategory);
  if (projectAttribute && projectAttribute !== "全部") query = query.eq("project_attribute", projectAttribute);
  if (minPrice !== null) query = query.gte("display_price", minPrice);
  if (maxPrice !== null) query = query.lte("display_price", maxPrice);
  if (startDate) query = query.gte("collected_date", startDate);
  if (endDate) query = query.lte("collected_date", endDate);
  if (keyword) {
    const escaped = keyword.replace(/,/g, " ");
    query = query.or(
      [
        `hospital_name.ilike.%${escaped}%`,
        `project_name.ilike.%${escaped}%`,
        `package_content.ilike.%${escaped}%`,
        `restriction_note.ilike.%${escaped}%`,
        `notes.ilike.%${escaped}%`,
      ].join(","),
    );
  }

  const result = await query;

  if (result.error) {
    console.error("[api/competitor-prices/analysis] list failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "读取竞品价格对比数据失败，请检查 competitor_price_items 表权限。" }, { status: 500 });
  }

  const rows = (result.data ?? []) as CompetitorPriceRow[];
  return NextResponse.json(buildAnalysis(rows));
}

function buildAnalysis(rows: CompetitorPriceRow[]) {
  const pricedRows = rows.filter((row) => isNumber(row.display_price));
  const competitorRows = rows.filter((row) => !isYazheng(row.hospital_name));
  const yazhengRows = rows.filter((row) => isYazheng(row.hospital_name));
  const prices = pricedRows.map((row) => row.display_price as number);
  const collectedDates = rows.map((row) => row.collected_date).filter((date): date is string => Boolean(date));

  const summary = {
    competitorCount: new Set(competitorRows.map((row) => row.hospital_name).filter(Boolean)).size,
    itemCount: rows.length,
    categoryCount: new Set(rows.map((row) => categoryOf(row)).filter(Boolean)).size,
    minPrice: minOrNull(prices),
    maxPrice: maxOrNull(prices),
    avgPrice: averageOrNull(prices),
    yazhengItemCount: yazhengRows.length,
    updatedAtRange: {
      startDate: collectedDates.length ? collectedDates.sort()[0] : null,
      endDate: collectedDates.length ? collectedDates.sort()[collectedDates.length - 1] : null,
    },
  };

  const categoryComparison = groupByCategory(rows).map(({ projectCategory, items }) => {
    const itemPrices = items.map((item) => item.display_price).filter(isNumber);
    const yazhengPrices = items.filter((item) => isYazheng(item.hospital_name)).map((item) => item.display_price).filter(isNumber);
    const avgPrice = averageOrNull(itemPrices);

    return {
      projectCategory,
      itemCount: items.length,
      competitorCount: new Set(items.map((item) => item.hospital_name).filter(Boolean)).size,
      minPrice: minOrNull(itemPrices),
      maxPrice: maxOrNull(itemPrices),
      avgPrice,
      yazhengPriceRange: buildPriceRange(yazhengPrices),
      pricePositionNote: buildCategoryNote(projectCategory, yazhengPrices, avgPrice, itemPrices),
    };
  });

  const hospitalComparison = groupByHospital(rows).map(({ hospitalName, items }) => {
    const itemPrices = items.map((item) => item.display_price).filter(isNumber);
    const avgPrice = averageOrNull(itemPrices);
    const mainCategories = topValues(items.map((item) => categoryOf(item)), 4);
    const lowPriceItemCount = items.filter((item) => isLowPriceItem(item)).length;
    const highPriceItemCount = items.filter((item) => isHighValueItem(item)).length;

    return {
      hospitalName,
      itemCount: items.length,
      minPrice: minOrNull(itemPrices),
      maxPrice: maxOrNull(itemPrices),
      avgPrice,
      mainCategories,
      lowPriceItemCount,
      highPriceItemCount,
      note: buildHospitalNote(lowPriceItemCount, highPriceItemCount, avgPrice),
    };
  });

  const bandItems = priceBands.map((band) => {
    const items = pricedRows.filter((row) => {
      const price = row.display_price as number;
      return price >= band.min && price <= band.max;
    });

    return {
      bandName: band.bandName,
      itemCount: items.length,
      mainCategories: topValues(items.map((item) => categoryOf(item)), 5),
    };
  });

  const lowPriceItems = rows
    .filter((row) => isLowPriceItem(row))
    .slice(0, 30)
    .map((row) => ({
      hospitalName: row.hospital_name ?? "未填写医院",
      projectCategory: categoryOf(row),
      projectName: row.project_name ?? "未填写项目",
      price: row.display_price,
      projectAttribute: row.project_attribute ?? "未填写",
      note: "可能是引流项目，不适合直接和正式治疗价对比。适合观察拉新策略，但不能单独代表治疗价格。",
    }));

  const highValueItems = rows
    .filter((row) => isHighValueItem(row))
    .slice(0, 30)
    .map((row) => ({
      hospitalName: row.hospital_name ?? "未填写医院",
      projectCategory: categoryOf(row),
      projectName: row.project_name ?? "未填写项目",
      price: row.display_price,
      note: "这是高客单或高价值项目，比较时要看医生、材料、套餐内容、检查范围和成交周期。",
    }));

  return {
    summary,
    categoryComparison,
    hospitalComparison,
    priceBands: bandItems,
    lowPriceItems,
    highValueItems,
    reminders: [
      "竞品价格来自人工整理的公开信息，不代表实时价格。",
      "低价检查项目不能直接等同正式治疗价格。",
      "竞品价格分析只用于参考，不自动调整雅正价格。",
      "建议结合美团订单、到院、成交、实收一起看。",
    ],
  };
}

function groupByCategory(rows: CompetitorPriceRow[]): CategoryBucket[] {
  const map = new Map<string, CompetitorPriceRow[]>();
  rows.forEach((row) => {
    const key = categoryOf(row);
    map.set(key, [...(map.get(key) ?? []), row]);
  });
  return Array.from(map.entries())
    .map(([projectCategory, items]) => ({ projectCategory, items }))
    .sort((a, b) => b.items.length - a.items.length);
}

function groupByHospital(rows: CompetitorPriceRow[]): HospitalBucket[] {
  const map = new Map<string, CompetitorPriceRow[]>();
  rows.forEach((row) => {
    const key = row.hospital_name ?? "未填写医院";
    map.set(key, [...(map.get(key) ?? []), row]);
  });
  return Array.from(map.entries())
    .map(([hospitalName, items]) => ({ hospitalName, items }))
    .sort((a, b) => b.items.length - a.items.length);
}

function buildCategoryNote(category: string, yazhengPrices: number[], avgPrice: number | null, prices: number[]) {
  const minPrice = minOrNull(prices);
  const maxPrice = maxOrNull(prices);
  const yazhengAvg = averageOrNull(yazhengPrices);

  if (["洁牙", "检查", "涂氟", "窝沟封闭"].includes(category)) {
    return "该分类低价引流明显，需要区分检查价、体验价和正式治疗价。";
  }

  if (minPrice !== null && maxPrice !== null && maxPrice >= minPrice * 3) {
    return "该分类竞品价格差异较大，建议不要只看最低价。";
  }

  if (yazhengAvg !== null && avgPrice !== null && yazhengAvg > avgPrice * 1.15) {
    return "雅正价格高于均价，建议突出医生、环境、材料和流程。";
  }

  if (yazhengAvg !== null && avgPrice !== null) {
    return "雅正价格接近均价，可以重点强调服务和套餐内容。";
  }

  return "当前可先看价格分布，后续再结合到院、成交和实收一起判断。";
}

function buildHospitalNote(lowPriceCount: number, highValueCount: number, avgPrice: number | null) {
  if (lowPriceCount > highValueCount && lowPriceCount > 0) return "低价项目较多，可能偏拉新引流，不能直接当正式治疗价对比。";
  if (highValueCount > 0) return "高价值项目较多，建议重点看套餐内容、医生材料和限制条件。";
  if (avgPrice !== null) return "该机构已有可参考价格，建议结合项目分类一起看。";
  return "该机构价格信息还不完整，先作为参考。";
}

function isLowPriceItem(row: CompetitorPriceRow) {
  const price = row.display_price;
  const attribute = `${row.project_attribute ?? ""}${row.project_name ?? ""}`;
  return (isNumber(price) && price <= 99) || /引流|检查|方案|咨询|体验/.test(attribute);
}

function isHighValueItem(row: CompetitorPriceRow) {
  const price = row.display_price;
  return highValueCategories.has(categoryOf(row)) || (isNumber(price) && price >= 1000);
}

function categoryOf(row: CompetitorPriceRow) {
  return row.project_category || "其他";
}

function isYazheng(value: string | null) {
  return Boolean(value && /雅正/i.test(value));
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function minOrNull(values: number[]) {
  return values.length ? Math.min(...values) : null;
}

function maxOrNull(values: number[]) {
  return values.length ? Math.max(...values) : null;
}

function averageOrNull(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function buildPriceRange(values: number[]) {
  const minPrice = minOrNull(values);
  const maxPrice = maxOrNull(values);
  if (minPrice === null || maxPrice === null) return null;
  return { minPrice, maxPrice };
}

function topValues(values: string[], limit: number) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseMoney(value: unknown) {
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

function normalizeDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const date = new Date(text.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, ""));
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString().slice(0, 10);
}
