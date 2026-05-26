import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ActionLogRequest = {
  actionType?: string;
  source?: string;
  recommendationId?: string;
  platform?: string;
  title?: string;
  status?: string;
  note?: string;
  payload?: Record<string, unknown> | null;
};

const selectFields =
  "id, action_type, source, recommendation_id, platform, title, status, note, payload, created_at";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const source = normalizeText(searchParams.get("source"));
  const limit = normalizeLimit(searchParams.get("limit"));

  let query = supabase
    .from("action_logs")
    .select(selectFields)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (source) {
    query = query.eq("source", source);
  }

  const result = await query;

  if (result.error) {
    console.error("[api/action-logs] list failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json(
      { message: `读取云端操作记录失败：${result.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ records: result.data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as ActionLogRequest | null;

  if (!body) {
    return NextResponse.json({ message: "操作记录内容为空。" }, { status: 400 });
  }

  const actionType = normalizeText(body.actionType);

  if (!actionType) {
    return NextResponse.json({ message: "缺少操作类型。" }, { status: 400 });
  }

  const payload = {
    action_type: actionType,
    source: normalizeText(body.source) ?? "recommendations",
    recommendation_id: normalizeText(body.recommendationId),
    platform: normalizeText(body.platform),
    title: normalizeText(body.title),
    status: normalizeText(body.status),
    note: normalizeText(body.note),
    payload: body.payload ?? null,
  };

  const result = await supabase.from("action_logs").insert(payload).select(selectFields).single();

  if (result.error) {
    console.error("[api/action-logs] create failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      actionType,
      recommendationId: payload.recommendation_id,
    });

    return NextResponse.json(
      { message: `写入云端操作记录失败：${result.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ record: result.data, message: "操作记录已保存到云端。" });
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeLimit(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return 100;
  return Math.min(Math.floor(numberValue), 200);
}
