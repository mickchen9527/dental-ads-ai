import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CompetitorPriceRequest = {
  id?: string;
  hospital_name?: string | null;
  hospitalName?: string | null;
  platform?: string | null;
  city_area?: string | null;
  cityArea?: string | null;
  project_category?: string | null;
  projectCategory?: string | null;
  project_attribute?: string | null;
  projectAttribute?: string | null;
  project_name?: string | null;
  projectName?: string | null;
  display_price?: number | string | null;
  displayPrice?: number | string | null;
  original_price?: number | string | null;
  originalPrice?: number | string | null;
  package_content?: string | null;
  packageContent?: string | null;
  restriction_note?: string | null;
  restrictionNote?: string | null;
  sold_count?: number | string | null;
  soldCount?: number | string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  reviewCount?: number | string | null;
  page_url?: string | null;
  pageUrl?: string | null;
  collected_date?: string | null;
  collectedDate?: string | null;
  status?: string | null;
  notes?: string | null;
};

type CompetitorPricePayload = {
  hospital_name?: string | null;
  platform?: string | null;
  city_area?: string | null;
  project_category?: string | null;
  project_attribute?: string | null;
  project_name?: string | null;
  display_price?: number | null;
  original_price?: number | null;
  package_content?: string | null;
  restriction_note?: string | null;
  sold_count?: number | null;
  rating?: number | null;
  review_count?: number | null;
  page_url?: string | null;
  collected_date?: string | null;
  status?: string;
  notes?: string | null;
  updated_at?: string;
};

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const hospitalName = normalizeText(searchParams.get("hospitalName"));
  const platform = normalizeText(searchParams.get("platform"));
  const projectCategory = normalizeText(searchParams.get("projectCategory"));
  const projectAttribute = normalizeText(searchParams.get("projectAttribute"));
  const status = normalizeText(searchParams.get("status"));
  const keyword = normalizeText(searchParams.get("keyword"));
  const minPrice = parseMoney(searchParams.get("minPrice"));
  const maxPrice = parseMoney(searchParams.get("maxPrice"));
  const startDate = normalizeDate(searchParams.get("startDate"));
  const endDate = normalizeDate(searchParams.get("endDate"));

  let query = supabase
    .from("competitor_price_items")
    .select(
      "id, hospital_name, platform, city_area, project_category, project_attribute, project_name, display_price, original_price, package_content, restriction_note, sold_count, rating, review_count, page_url, collected_date, status, notes, created_at, updated_at",
    )
    .order("collected_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (hospitalName) query = query.ilike("hospital_name", `%${hospitalName}%`);
  if (platform && platform !== "全部") query = query.eq("platform", platform);
  if (projectCategory && projectCategory !== "全部") query = query.eq("project_category", projectCategory);
  if (projectAttribute && projectAttribute !== "全部") query = query.eq("project_attribute", projectAttribute);
  if (status && status !== "all" && status !== "全部") query = query.eq("status", normalizeStatus(status));
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
    console.error("[api/competitor-prices] list failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "读取竞品价格列表失败，请检查 competitor_price_items 表权限。" }, { status: 500 });
  }

  return NextResponse.json({ items: result.data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const body = (await request.json()) as CompetitorPriceRequest;
  const hospitalName = normalizeText(body.hospital_name ?? body.hospitalName);
  const projectName = normalizeText(body.project_name ?? body.projectName);

  if (!hospitalName) {
    return NextResponse.json({ message: "医院名称不能为空。" }, { status: 400 });
  }

  if (!projectName) {
    return NextResponse.json({ message: "项目名称不能为空。" }, { status: 400 });
  }

  const payload = buildPayload(body, false);
  payload.hospital_name = hospitalName;
  payload.project_name = projectName;

  const result = await supabase.from("competitor_price_items").insert(payload).select().single();

  if (result.error) {
    console.error("[api/competitor-prices] create failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "新增竞品价格失败，请检查 competitor_price_items 表字段。" }, { status: 500 });
  }

  return NextResponse.json({ item: result.data, message: "竞品价格已保存。" });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const body = (await request.json()) as CompetitorPriceRequest;

  if (!body.id) {
    return NextResponse.json({ message: "缺少竞品价格 id。" }, { status: 400 });
  }

  const payload = buildPayload(body, true);
  payload.updated_at = new Date().toISOString();

  if (Object.keys(payload).length <= 1) {
    return NextResponse.json({ message: "没有需要更新的字段。" }, { status: 400 });
  }

  const result = await supabase.from("competitor_price_items").update(payload).eq("id", body.id).select().single();

  if (result.error) {
    console.error("[api/competitor-prices] update failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "更新竞品价格失败，请检查 competitor_price_items 表权限。" }, { status: 500 });
  }

  return NextResponse.json({ item: result.data, message: "竞品价格已更新。" });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get("id");
  const body = queryId ? null : ((await request.json().catch(() => null)) as CompetitorPriceRequest | null);
  const id = queryId ?? body?.id;

  if (!id) {
    return NextResponse.json({ message: "缺少竞品价格 id。" }, { status: 400 });
  }

  const result = await supabase.from("competitor_price_items").delete().eq("id", id);

  if (result.error) {
    console.error("[api/competitor-prices] delete failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "删除竞品价格失败，请检查 competitor_price_items 表权限。" }, { status: 500 });
  }

  return NextResponse.json({ message: "竞品价格已删除。删除只适合录错、重复、测试数据。" });
}

function buildPayload(body: CompetitorPriceRequest, partial: boolean): CompetitorPricePayload {
  const payload: CompetitorPricePayload = {};

  assignText(payload, "hospital_name", body.hospital_name ?? body.hospitalName, partial);
  assignText(payload, "platform", body.platform, partial, "美团");
  assignText(payload, "city_area", body.city_area ?? body.cityArea, partial);
  assignText(payload, "project_category", body.project_category ?? body.projectCategory, partial);
  assignText(payload, "project_attribute", body.project_attribute ?? body.projectAttribute, partial);
  assignText(payload, "project_name", body.project_name ?? body.projectName, partial);
  assignNumber(payload, "display_price", body.display_price ?? body.displayPrice, partial);
  assignNumber(payload, "original_price", body.original_price ?? body.originalPrice, partial);
  assignText(payload, "package_content", body.package_content ?? body.packageContent, partial);
  assignText(payload, "restriction_note", body.restriction_note ?? body.restrictionNote, partial);
  assignInteger(payload, "sold_count", body.sold_count ?? body.soldCount, partial);
  assignNumber(payload, "rating", body.rating, partial);
  assignInteger(payload, "review_count", body.review_count ?? body.reviewCount, partial);
  assignText(payload, "page_url", body.page_url ?? body.pageUrl, partial);
  assignText(payload, "collected_date", normalizeDate(body.collected_date ?? body.collectedDate), partial, todayString());
  assignText(payload, "notes", body.notes, partial);

  if (!partial || body.status !== undefined) {
    payload.status = normalizeStatus(body.status ?? "active");
  }

  return payload;
}

function assignText(
  payload: CompetitorPricePayload,
  key: keyof CompetitorPricePayload,
  value: unknown,
  partial: boolean,
  fallback: string | null = null,
) {
  if (partial && value === undefined) return;
  payload[key] = (normalizeText(value) ?? fallback) as never;
}

function assignNumber(payload: CompetitorPricePayload, key: keyof CompetitorPricePayload, value: unknown, partial: boolean) {
  if (partial && value === undefined) return;
  payload[key] = parseMoney(value) as never;
}

function assignInteger(payload: CompetitorPricePayload, key: keyof CompetitorPricePayload, value: unknown, partial: boolean) {
  if (partial && value === undefined) return;
  payload[key] = parseInteger(value) as never;
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

function parseInteger(value: unknown) {
  const numberValue = parseMoney(value);
  return numberValue === null ? null : Math.trunc(numberValue);
}

function normalizeStatus(value: unknown) {
  const normalized = String(value ?? "active").trim().toLowerCase();
  if (["inactive", "停用", "下架", "禁用"].includes(normalized)) return "inactive";
  return "active";
}

function normalizeDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const date = new Date(text.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, ""));
  if (Number.isNaN(date.getTime())) return text;
  return date.toISOString().slice(0, 10);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
