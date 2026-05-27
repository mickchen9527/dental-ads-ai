import { NextResponse } from "next/server";
import { targetSettingDefinitions } from "@/lib/recommendation-rules";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RecommendationSummaryItem = {
  id?: string;
  title?: string;
  platform?: string;
  priority?: string;
  problemType?: string;
  problem?: string;
  reason?: string;
  action?: string;
  risk?: string;
  dataBasis?: string[];
};

type PlatformSummaryItem = {
  platform?: string;
  spend?: number;
  clicks?: number;
  actionCount?: number;
  hasData?: boolean;
  onlyFrontTraffic?: boolean;
  ekanya?: {
    leadCount?: number;
    visitCount?: number;
    dealCount?: number;
    paidAmount?: number;
    paidRoi?: number | null;
  };
};

type RecommendationPayload = {
  range?: {
    startDate?: string;
    endDate?: string;
    dateType?: string;
  };
  recommendations?: RecommendationSummaryItem[];
  dataGaps?: Array<{ platform?: string; message?: string }>;
  platformSummaries?: PlatformSummaryItem[];
  uploadCompleteness?: Record<string, boolean>;
};

type UploadedFileRow = {
  id: string;
  platform: string | null;
  parse_status: string | null;
  is_active: boolean | null;
};

type ActionLogRow = {
  action_type: string | null;
  platform: string | null;
  title: string | null;
  status: string | null;
  execution_status: string | null;
  review_result: string | null;
  review_note: string | null;
  created_at: string | null;
};

type TargetSettingRow = {
  key: string;
  value: number | string | null;
};

type CompetitorPriceRow = {
  hospital_name: string | null;
  project_category: string | null;
  display_price: number | string | null;
};

const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

const detailTables = [
  "meituan_summary_rows",
  "meituan_keyword_rows",
  "douyin_plan_summary_rows",
  "douyin_creative_rows",
  "douyin_lead_rows",
  "gdt_plan_summary_rows",
  "gdt_creative_rows",
  "gdt_lead_rows",
  "amap_summary_rows",
  "amap_action_rows",
  "amap_lead_rows",
  "ekanya_backflow_rows",
];

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { message: "AI 总结暂未启用，请先在环境变量中配置 DEEPSEEK_API_KEY。" },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase 服务端连接不可用，暂时不能整理 AI 总结所需的数据摘要。" },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;
  const range = resolveRange();
  const [recommendations, dataQuality, targets, actionLogs, competitorSummary] = await Promise.all([
    fetchRecommendationSummary(origin, range),
    fetchDataQualitySummary(supabase),
    fetchTargetSummary(supabase),
    fetchActionLogSummary(supabase),
    fetchCompetitorSummary(supabase),
  ]);

  const compactInput = {
    range,
    dataQuality,
    recommendations,
    targets,
    actionLogs,
    competitorSummary,
    boundaries: [
      "AI 只读取聚合摘要，不读取原始上传明细行。",
      "AI 不会自动修改预算、关键词、价格、数据库或操作记录。",
      "e看牙回流只是初步闭环参考，不是手机号或订单级精准归因。",
    ],
  };

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是乐清雅正口腔投放数据分析助手。你只能基于系统提供的数据摘要进行总结，不能编造不存在的数据。你不能给出自动调价或自动执行指令。如果数据不足，必须明确说“数据不足，暂不下强结论”。e看牙回流不是精准归因，只能作为初步闭环参考。你的输出必须服务于人工决策，而不是替代人工决策。",
        },
        {
          role: "user",
          content:
            `请基于下面 JSON 摘要，输出严格 JSON，不要输出 Markdown。字段必须包含：summary:string, keyProblems:string[], tomorrowActions:string[], dataWarnings:string[], riskNotes:string[], confidence:"低"|"中"|"高", disclaimer:string。\n\n${JSON.stringify(compactInput)}`,
        },
      ],
      stream: false,
      max_tokens: 1200,
      temperature: 1,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = normalizeDeepSeekError(payload) ?? "AI 总结生成失败，请稍后重试。规则型建议仍可正常使用。";
    return NextResponse.json({ message }, { status: response.status });
  }

  const outputText = extractOutputText(payload);
  const summary = parseAiSummary(outputText);

  if (!summary) {
    return NextResponse.json(
      {
        message: "AI 已返回内容，但格式暂时无法展示。规则型建议仍可正常使用。",
        rawText: outputText.slice(0, 1200),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ...summary,
    model,
    inputStats: {
      recommendationCount: recommendations.items.length,
      dataQualityIssueCount: dataQuality.issueCount,
      actionLogCount: actionLogs.total,
      competitorItemCount: competitorSummary.itemCount,
    },
  });
}

function resolveRange() {
  const today = startOfDay(new Date());
  const start = addDays(today, -6);
  return {
    startDate: formatDate(start),
    endDate: formatDate(today),
    dateType: "source_date",
    note: "默认读取近 7 天摘要，避免单日样本太少时误判。",
  };
}

async function fetchRecommendationSummary(origin: string, range: ReturnType<typeof resolveRange>) {
  try {
    const url = new URL("/api/recommendations/today", origin);
    url.searchParams.set("startDate", range.startDate);
    url.searchParams.set("endDate", range.endDate);
    url.searchParams.set("dateType", range.dateType);
    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as RecommendationPayload | null;

    if (!response.ok || !payload) {
      return {
        available: false,
        message: "今日总建议暂时读取失败，AI 只能基于其它摘要做保守总结。",
        items: [],
        dataGaps: [],
        platformSummaries: [],
      };
    }

    return {
      available: true,
      range: payload.range,
      uploadCompleteness: payload.uploadCompleteness,
      items: (payload.recommendations ?? []).slice(0, 20).map((item) => ({
        id: item.id,
        title: item.title,
        platform: item.platform,
        priority: item.priority,
        problemType: item.problemType,
        problem: item.problem,
        reason: item.reason,
        action: item.action,
        risk: item.risk,
        dataBasis: item.dataBasis,
      })),
      dataGaps: payload.dataGaps ?? [],
      platformSummaries: (payload.platformSummaries ?? []).map((platform) => ({
        platform: platform.platform,
        spend: platform.spend,
        clicks: platform.clicks,
        actionCount: platform.actionCount,
        hasData: platform.hasData,
        onlyFrontTraffic: platform.onlyFrontTraffic,
        ekanya: platform.ekanya,
      })),
    };
  } catch {
    return {
      available: false,
      message: "今日总建议暂时读取失败，AI 只能基于其它摘要做保守总结。",
      items: [],
      dataGaps: [],
      platformSummaries: [],
    };
  }
}

async function fetchDataQualitySummary(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const result = await supabase
    .from("uploaded_files")
    .select("id, platform, parse_status, is_active")
    .order("uploaded_at", { ascending: false })
    .limit(500);

  if (result.error) {
    return {
      available: false,
      issueCount: 1,
      severeIssueCount: 1,
      message: `uploaded_files 读取失败：${result.error.message}`,
    };
  }

  const files = (result.data ?? []) as UploadedFileRow[];
  const activeFiles = files.filter((file) => file.is_active !== false);
  const parsedFiles = activeFiles.filter((file) => file.parse_status === "parsed");
  const failedFiles = activeFiles.filter((file) => file.parse_status === "failed");
  const savedFiles = activeFiles.filter((file) => file.parse_status !== "parsed" && file.parse_status !== "failed");
  const disabledFiles = files.filter((file) => file.is_active === false);
  const parsedFileIds = parsedFiles.map((file) => file.id);
  const detailRowCounts = await fetchDetailRowCounts(supabase, parsedFileIds);
  const detailRowTotal = Object.values(detailRowCounts).reduce((total, count) => total + count, 0);
  const platformSet = new Set(parsedFiles.map((file) => normalizePlatform(file.platform)).filter(Boolean));
  const issueCount = failedFiles.length + savedFiles.length + (parsedFiles.length > 0 && detailRowTotal === 0 ? 1 : 0);
  const severeIssueCount = failedFiles.length + (activeFiles.length > 0 && parsedFiles.length === 0 ? 1 : 0);

  return {
    available: true,
    totalFiles: files.length,
    activeFiles: activeFiles.length,
    disabledFiles: disabledFiles.length,
    parsedFiles: parsedFiles.length,
    unparsedFiles: savedFiles.length,
    failedFiles: failedFiles.length,
    analyzableFiles: parsedFiles.length,
    analyzablePlatforms: Array.from(platformSet),
    detailRowTotal,
    detailRowCounts,
    issueCount,
    severeIssueCount,
    summary:
      parsedFiles.length > 0
        ? "已有 active + parsed 数据，可以做规则型建议和 AI 辅助总结。"
        : "还没有 active + parsed 数据，建议只能提示补数据，不能下强结论。",
  };
}

async function fetchDetailRowCounts(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, fileIds: string[]) {
  const counts: Record<string, number> = {};

  if (fileIds.length === 0) {
    detailTables.forEach((table) => {
      counts[table] = 0;
    });
    return counts;
  }

  await Promise.all(
    detailTables.map(async (table) => {
      const result = await supabase
        .from(table)
        .select("uploaded_file_id", { count: "exact", head: true })
        .in("uploaded_file_id", fileIds);
      counts[table] = result.error ? 0 : result.count ?? 0;
    }),
  );

  return counts;
}

async function fetchTargetSummary(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const defaults = targetSettingDefinitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    value: definition.defaultValue,
    unit: definition.unit,
    source: "default",
  }));

  const result = await supabase
    .from("target_settings")
    .select("key, value")
    .in(
      "key",
      targetSettingDefinitions.map((definition) => definition.key),
    );

  if (result.error) {
    return {
      source: "default",
      settings: defaults,
      message: `云端目标值暂不可用，使用系统默认目标值：${result.error.message}`,
    };
  }

  const rows = (result.data ?? []) as TargetSettingRow[];
  const valueByKey = new Map(rows.map((row) => [row.key, Number(row.value)]));

  return {
    source: rows.length > 0 ? "cloud" : "default",
    settings: targetSettingDefinitions.map((definition) => ({
      key: definition.key,
      label: definition.label,
      value: Number.isFinite(valueByKey.get(definition.key)) ? valueByKey.get(definition.key) : definition.defaultValue,
      unit: definition.unit,
      source: valueByKey.has(definition.key) ? "cloud" : "default",
    })),
  };
}

async function fetchActionLogSummary(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const result = await supabase
    .from("action_logs")
    .select("action_type, platform, title, status, execution_status, review_result, review_note, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (result.error) {
    return {
      available: false,
      total: 0,
      adopted: [],
      done: [],
      effective: [],
      observing: [],
      ineffective: [],
      message: `云端操作记录暂不可用：${result.error.message}`,
    };
  }

  const rows = (result.data ?? []) as ActionLogRow[];
  const toTiny = (row: ActionLogRow) => ({
    platform: row.platform,
    title: row.title,
    status: row.status,
    executionStatus: row.execution_status,
    reviewResult: row.review_result,
    note: row.review_note,
    createdAt: row.created_at,
  });

  return {
    available: true,
    total: rows.length,
    adopted: rows.filter((row) => row.action_type === "recommendation_adopted").slice(0, 8).map(toTiny),
    done: rows.filter((row) => row.execution_status === "done").slice(0, 8).map(toTiny),
    effective: rows.filter((row) => row.review_result === "effective").slice(0, 8).map(toTiny),
    observing: rows.filter((row) => row.review_result === "observing").slice(0, 8).map(toTiny),
    ineffective: rows.filter((row) => row.review_result === "ineffective").slice(0, 8).map(toTiny),
  };
}

async function fetchCompetitorSummary(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const result = await supabase
    .from("competitor_price_items")
    .select("hospital_name, project_category, display_price")
    .eq("status", "active")
    .limit(500);

  if (result.error) {
    return {
      available: false,
      itemCount: 0,
      message: `竞品价格摘要暂不可用：${result.error.message}`,
    };
  }

  const rows = (result.data ?? []) as CompetitorPriceRow[];
  const prices = rows.map((row) => toNumber(row.display_price)).filter((price): price is number => price !== null);

  return {
    available: true,
    itemCount: rows.length,
    competitorCount: new Set(rows.map((row) => row.hospital_name).filter(Boolean)).size,
    categoryCount: new Set(rows.map((row) => row.project_category).filter(Boolean)).size,
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    maxPrice: prices.length > 0 ? Math.max(...prices) : null,
    avgPrice: prices.length > 0 ? prices.reduce((total, price) => total + price, 0) / prices.length : null,
  };
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const choices = (payload as { choices?: unknown }).choices;
  if (Array.isArray(choices)) {
    const firstChoice = choices[0];
    if (firstChoice && typeof firstChoice === "object") {
      const message = (firstChoice as { message?: unknown }).message;
      if (message && typeof message === "object") {
        const content = (message as { content?: unknown }).content;
        if (typeof content === "string") return content.trim();
      }
    }
  }

  const maybeOutputText = (payload as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === "string") return maybeOutputText;

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.map((part) => {
        if (!part || typeof part !== "object") return "";
        const maybeText = (part as { text?: unknown }).text;
        return typeof maybeText === "string" ? maybeText : "";
      });
    })
    .join("\n")
    .trim();
}

function parseAiSummary(text: string) {
  const parsed = parseJsonObject(text);
  if (!parsed) return null;

  return {
    summary: normalizeString(parsed.summary) ?? "AI 已生成总结，但缺少总体判断。",
    keyProblems: normalizeStringArray(parsed.keyProblems),
    tomorrowActions: normalizeStringArray(parsed.tomorrowActions),
    dataWarnings: normalizeStringArray(parsed.dataWarnings),
    riskNotes: normalizeStringArray(parsed.riskNotes),
    confidence: normalizeConfidence(parsed.confidence),
    disclaimer:
      normalizeString(parsed.disclaimer) ??
      "这是 AI 辅助总结，不自动调价，不自动执行，也不能替代人工判断。",
  };
}

function parseJsonObject(text: string) {
  if (!text) return null;
  const trimmed = text.trim();

  try {
    const direct = JSON.parse(trimmed);
    return direct && typeof direct === "object" && !Array.isArray(direct) ? direct as Record<string, unknown> : null;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      const sliced = JSON.parse(trimmed.slice(start, end + 1));
      return sliced && typeof sliced === "object" && !Array.isArray(sliced) ? sliced as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
}

function normalizeDeepSeekError(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim().length > 0
    ? `AI 总结生成失败：${message}`
    : null;
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeString(item)).filter((item): item is string => Boolean(item)).slice(0, 8);
}

function normalizeConfidence(value: unknown) {
  const text = normalizeString(value);
  if (text === "低" || text === "中" || text === "高") return text;
  return "中";
}

function normalizePlatform(value: unknown) {
  if (!value) return null;
  const text = String(value);
  if (text.includes("美团") || text.includes("点评") || text.toLowerCase().includes("meituan")) return "美团";
  if (text.includes("抖音") || text.includes("巨量") || text.toLowerCase().includes("douyin")) return "抖音";
  if (text.includes("腾讯") || text.includes("广点通") || text.toLowerCase().includes("gdt")) return "腾讯广点通";
  if (text.includes("高德") || text.toLowerCase().includes("amap")) return "高德";
  if (text.includes("e看牙") || text.toLowerCase().includes("ekanya")) return "e看牙";
  return "其他";
}

function toNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
