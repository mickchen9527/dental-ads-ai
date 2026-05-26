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

type ActionLogReviewRequest = {
  id?: string;
  execution_status?: string;
  executionStatus?: string;
  review_result?: string;
  reviewResult?: string;
  review_note?: string | null;
  reviewNote?: string | null;
};

const selectFields =
  "id, action_type, source, recommendation_id, platform, title, status, note, payload, created_at";
const reviewSelectFields =
  "id, action_type, source, recommendation_id, platform, title, status, note, payload, created_at, execution_status, review_result, review_note, reviewed_at, updated_at";

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
    .select(reviewSelectFields)
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

    let fallbackQuery = supabase
      .from("action_logs")
      .select(selectFields)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (source) {
      fallbackQuery = fallbackQuery.eq("source", source);
    }

    const fallbackResult = await fallbackQuery;

    if (!fallbackResult.error) {
      return NextResponse.json({
        records: fallbackResult.data ?? [],
        reviewFieldsReady: false,
        message: "云端复盘字段尚未创建，当前仅展示基础操作记录。请执行 supabase/action-logs-review.sql 后再使用复盘保存。",
      });
    }

    console.error("[api/action-logs] fallback list failed", {
      code: fallbackResult.error.code,
      message: fallbackResult.error.message,
      details: fallbackResult.error.details,
      hint: fallbackResult.error.hint,
    });

    return NextResponse.json(
      { message: `读取云端操作记录失败：${fallbackResult.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ records: result.data ?? [], reviewFieldsReady: true });
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

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接失败，请检查环境变量配置。" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as ActionLogReviewRequest | null;

  if (!body?.id) {
    return NextResponse.json({ message: "缺少操作记录 id。" }, { status: 400 });
  }

  const executionStatus = normalizeExecutionStatus(body.execution_status ?? body.executionStatus);
  const reviewResult = normalizeReviewResult(body.review_result ?? body.reviewResult);
  const reviewNote = normalizeNullableText(body.review_note ?? body.reviewNote);
  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (executionStatus) {
    payload.execution_status = executionStatus;
  }

  if (reviewResult) {
    payload.review_result = reviewResult;
    payload.reviewed_at = new Date().toISOString();
  }

  if (body.review_note !== undefined || body.reviewNote !== undefined) {
    payload.review_note = reviewNote;
    payload.reviewed_at = new Date().toISOString();
  }

  if (Object.keys(payload).length <= 1) {
    return NextResponse.json({ message: "没有需要更新的复盘字段。" }, { status: 400 });
  }

  const result = await supabase
    .from("action_logs")
    .update(payload)
    .eq("id", body.id)
    .select(reviewSelectFields)
    .single();

  if (result.error) {
    console.error("[api/action-logs] review update failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      id: body.id,
    });

    return NextResponse.json(
      { message: `更新云端复盘状态失败：${result.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ record: result.data, message: "复盘状态已更新。" });
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeNullableText(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeExecutionStatus(value: unknown) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (["pending", "done", "delayed", "cancelled"].includes(normalized)) return normalized;
  return null;
}

function normalizeReviewResult(value: unknown) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (["unreviewed", "effective", "ineffective", "observing"].includes(normalized)) return normalized;
  return null;
}

function normalizeLimit(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return 100;
  return Math.min(Math.floor(numberValue), 200);
}
