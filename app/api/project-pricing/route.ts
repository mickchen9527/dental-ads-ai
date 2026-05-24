import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ProjectPriceRequest = {
  id?: string;
  projectName?: string;
  projectCategory?: string;
  ekanyaSystemPrice?: number | string | null;
  platformDisplayPrice?: number | string | null;
  campaignPrice?: number | string | null;
  commonActualPrice?: number | string | null;
  packageContent?: string | null;
  isLeadProject?: boolean | string | null;
  isHighTicket?: boolean | string | null;
  observationCycle?: string | null;
  status?: string | null;
  notes?: string | null;
};

type ProjectPricePayload = {
  project_name?: string;
  project_category?: string | null;
  ekanya_system_price?: number | null;
  platform_display_price?: number | null;
  campaign_price?: number | null;
  common_actual_price?: number | null;
  package_content?: string | null;
  is_lead_project?: boolean;
  is_high_ticket?: boolean;
  observation_cycle?: string | null;
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
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const keyword = searchParams.get("keyword")?.trim();

  let query = supabase
    .from("project_price_items")
    .select(
      "id, project_name, project_category, ekanya_system_price, platform_display_price, campaign_price, common_actual_price, package_content, is_lead_project, is_high_ticket, observation_cycle, status, notes, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", normalizeStatus(status));
  }

  if (category && category !== "all") {
    query = query.eq("project_category", category);
  }

  if (keyword) {
    query = query.ilike("project_name", `%${keyword}%`);
  }

  const result = await query;

  if (result.error) {
    console.error("[api/project-pricing] list failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "读取项目价格列表失败，请检查 project_price_items 表权限。" }, { status: 500 });
  }

  return NextResponse.json({ items: result.data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const body = (await request.json()) as ProjectPriceRequest;
  const projectName = normalizeText(body.projectName);

  if (!projectName) {
    return NextResponse.json({ message: "项目名称不能为空。" }, { status: 400 });
  }

  const payload = buildProjectPricePayload(body, false);
  payload.project_name = projectName;

  const result = await supabase.from("project_price_items").insert(payload).select().single();

  if (result.error) {
    console.error("[api/project-pricing] create failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "新增项目价格失败，请检查 project_price_items 表字段。" }, { status: 500 });
  }

  return NextResponse.json({ item: result.data, message: "项目已保存到 Supabase。" });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const body = (await request.json()) as ProjectPriceRequest;

  if (!body.id) {
    return NextResponse.json({ message: "缺少项目 id。" }, { status: 400 });
  }

  const payload = buildProjectPricePayload(body, true);
  payload.updated_at = new Date().toISOString();

  if (Object.keys(payload).length <= 1) {
    return NextResponse.json({ message: "没有需要更新的字段。" }, { status: 400 });
  }

  const result = await supabase.from("project_price_items").update(payload).eq("id", body.id).select().single();

  if (result.error) {
    console.error("[api/project-pricing] update failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "更新项目价格失败，请检查 project_price_items 表权限。" }, { status: 500 });
  }

  return NextResponse.json({ item: result.data, message: "项目价格已更新。" });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "缺少项目 id。" }, { status: 400 });
  }

  const result = await supabase.from("project_price_items").delete().eq("id", id);

  if (result.error) {
    console.error("[api/project-pricing] delete failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: "删除项目失败，请检查 project_price_items 表权限。" }, { status: 500 });
  }

  return NextResponse.json({ message: "项目已删除。删除只适合录错、重复、测试数据。" });
}

function buildProjectPricePayload(body: ProjectPriceRequest, partial: boolean): ProjectPricePayload {
  const payload: ProjectPricePayload = {};

  assignText(payload, "project_name", body.projectName, partial);
  assignText(payload, "project_category", body.projectCategory, partial);
  assignNumber(payload, "ekanya_system_price", body.ekanyaSystemPrice, partial);
  assignNumber(payload, "platform_display_price", body.platformDisplayPrice, partial);
  assignNumber(payload, "campaign_price", body.campaignPrice, partial);
  assignNumber(payload, "common_actual_price", body.commonActualPrice, partial);
  assignText(payload, "package_content", body.packageContent, partial);
  assignBoolean(payload, "is_lead_project", body.isLeadProject, partial);
  assignBoolean(payload, "is_high_ticket", body.isHighTicket, partial);
  assignText(payload, "observation_cycle", body.observationCycle, partial);
  assignText(payload, "notes", body.notes, partial);

  if (!partial || body.status !== undefined) {
    payload.status = normalizeStatus(body.status ?? "active");
  }

  return payload;
}

function assignText(payload: ProjectPricePayload, key: keyof ProjectPricePayload, value: unknown, partial: boolean) {
  if (partial && value === undefined) return;
  payload[key] = normalizeText(value) as never;
}

function assignNumber(payload: ProjectPricePayload, key: keyof ProjectPricePayload, value: unknown, partial: boolean) {
  if (partial && value === undefined) return;
  payload[key] = parseMoney(value) as never;
}

function assignBoolean(payload: ProjectPricePayload, key: keyof ProjectPricePayload, value: unknown, partial: boolean) {
  if (partial && value === undefined) return;
  payload[key] = parseBoolean(value) as never;
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
    .replace(/元/g, "")
    .replace(/¥/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || value === "") return false;
  const normalized = String(value).trim().toLowerCase();
  return ["是", "true", "1", "yes", "y", "启用"].includes(normalized);
}

function normalizeStatus(value: unknown) {
  const normalized = String(value ?? "active").trim().toLowerCase();
  if (["inactive", "停用", "下架", "禁用"].includes(normalized)) return "inactive";
  return "active";
}
