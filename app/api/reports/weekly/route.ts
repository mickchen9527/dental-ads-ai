import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const supportedDateTypes = new Set(["source_date", "visit_date", "deal_date"]);
const meituanSummaryTypes = ["美团推广汇总数据", "meituan-summary"];
const meituanKeywordTypes = ["美团关键词数据", "meituan-keywords"];
const ekanyaBackflowTypes = ["e看牙后端回流数据", "ekanya-backflow"];

type NumericValue = number | string | null | undefined;

type UploadedFileRow = {
  id: string;
  data_type: string | null;
};

type MeituanSummaryRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  avg_click_cost: NumericValue;
  merchant_views: NumericValue;
  phone_views: NumericValue;
  online_consult_clicks: NumericValue;
  orders: NumericValue;
  group_buy_orders: NumericValue;
  group_buy_orders_15d: NumericValue;
};

type MeituanKeywordRow = MeituanSummaryRow & {
  keyword: string | null;
};

type EkanyaBackflowRow = {
  source_platform: string | null;
  source_date: string | null;
  visit_date: string | null;
  deal_date: string | null;
  intention_project: string | null;
  visit_project: string | null;
  deal_project: string | null;
  appointment_status: string | null;
  visit_status: string | null;
  deal_status: string | null;
  paid_amount: NumericValue;
};

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase 服务端连接失败：请检查 URL 和 service role / secret key 是否已配置。" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const range = resolveDateRange(searchParams.get("startDate"), searchParams.get("endDate"));
  const requestedDateType = searchParams.get("dateType") ?? "source_date";
  const dateType = supportedDateTypes.has(requestedDateType) ? requestedDateType : "source_date";

  const uploadedResult = await supabase
    .from("uploaded_files")
    .select("id, data_type")
    .eq("is_active", true)
    .in("parse_status", ["parsed"]);

  if (uploadedResult.error) {
    console.error("[api/reports/weekly] uploaded_files query failed", {
      code: uploadedResult.error.code,
      message: uploadedResult.error.message,
      details: uploadedResult.error.details,
      hint: uploadedResult.error.hint,
    });

    return NextResponse.json({ message: "读取上传记录失败，请检查 uploaded_files 表权限。" }, { status: 500 });
  }

  const uploadedFiles = (uploadedResult.data ?? []) as UploadedFileRow[];
  const summaryFileIds = filterFileIds(uploadedFiles, meituanSummaryTypes);
  const keywordFileIds = filterFileIds(uploadedFiles, meituanKeywordTypes);
  const ekanyaFileIds = filterFileIds(uploadedFiles, ekanyaBackflowTypes);

  const [summaryRows, keywordRows, ekanyaRows] = await Promise.all([
    fetchMeituanSummaryRows(summaryFileIds, range.startDate, range.endDate),
    fetchMeituanKeywordRows(keywordFileIds, range.startDate, range.endDate),
    fetchEkanyaRows(ekanyaFileIds, dateType, range.startDate, range.endDate),
  ]);

  if (summaryRows.error || keywordRows.error || ekanyaRows.error) {
    return NextResponse.json(
      { message: summaryRows.error ?? keywordRows.error ?? ekanyaRows.error ?? "读取周报数据失败，请检查解析表权限。" },
      { status: 500 },
    );
  }

  const adOverview = summarizeMeituanSummary(summaryRows.data);
  const ekanyaOverview = summarizeEkanya(ekanyaRows.data, adOverview.totalSpend);
  const projectRows = summarizeProjects(ekanyaRows.data);
  const keywordTop10 = summarizeKeywords(keywordRows.data);
  const reminders = buildReminders({
    hasMeituanSummary: summaryRows.data.length > 0,
    hasMeituanKeywords: keywordRows.data.length > 0,
    hasEkanyaBackflow: ekanyaRows.data.length > 0,
    totalSpend: adOverview.totalSpend,
    paidAmount: ekanyaOverview.paidAmount,
    paidRoi: ekanyaOverview.paidRoi,
    projectRows,
  });

  return NextResponse.json({
    range: {
      startDate: range.startDate,
      endDate: range.endDate,
      dateType,
    },
    adOverview,
    ekanyaOverview,
    projectRows,
    keywordTop10,
    reminders,
    emptyStates: {
      hasMeituanSummary: summaryRows.data.length > 0,
      hasMeituanKeywords: keywordRows.data.length > 0,
      hasEkanyaBackflow: ekanyaRows.data.length > 0,
    },
  });
}

async function fetchMeituanSummaryRows(uploadedFileIds: string[], startDate: string, endDate: string) {
  if (uploadedFileIds.length === 0) return { data: [] as MeituanSummaryRow[], error: null as string | null };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as MeituanSummaryRow[], error: "Supabase 服务端连接失败。" };

  const result = await supabase
    .from("meituan_summary_rows")
    .select(
      "spend, impressions, clicks, avg_click_cost, merchant_views, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d",
    )
    .in("uploaded_file_id", uploadedFileIds)
    .gte("date", startDate)
    .lte("date", endDate)
    .limit(10000);

  if (result.error) {
    console.error("[api/reports/weekly] meituan_summary_rows query failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    return { data: [] as MeituanSummaryRow[], error: "读取美团推广汇总解析数据失败，请检查 meituan_summary_rows 表权限。" };
  }

  return { data: (result.data ?? []) as MeituanSummaryRow[], error: null };
}

async function fetchMeituanKeywordRows(uploadedFileIds: string[], startDate: string, endDate: string) {
  if (uploadedFileIds.length === 0) return { data: [] as MeituanKeywordRow[], error: null as string | null };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as MeituanKeywordRow[], error: "Supabase 服务端连接失败。" };

  const result = await supabase
    .from("meituan_keyword_rows")
    .select(
      "keyword, spend, impressions, clicks, avg_click_cost, merchant_views, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d",
    )
    .in("uploaded_file_id", uploadedFileIds)
    .gte("date", startDate)
    .lte("date", endDate)
    .limit(10000);

  if (result.error) {
    console.error("[api/reports/weekly] meituan_keyword_rows query failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    return { data: [] as MeituanKeywordRow[], error: "读取美团关键词解析数据失败，请检查 meituan_keyword_rows 表权限。" };
  }

  return { data: (result.data ?? []) as MeituanKeywordRow[], error: null };
}

async function fetchEkanyaRows(uploadedFileIds: string[], dateType: string, startDate: string, endDate: string) {
  if (uploadedFileIds.length === 0) return { data: [] as EkanyaBackflowRow[], error: null as string | null };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as EkanyaBackflowRow[], error: "Supabase 服务端连接失败。" };

  const result = await supabase
    .from("ekanya_backflow_rows")
    .select(
      "source_platform, source_date, visit_date, deal_date, intention_project, visit_project, deal_project, appointment_status, visit_status, deal_status, paid_amount",
    )
    .in("uploaded_file_id", uploadedFileIds)
    .gte(dateType, startDate)
    .lte(dateType, endDate)
    .limit(10000);

  if (result.error) {
    console.error("[api/reports/weekly] ekanya_backflow_rows query failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    return { data: [] as EkanyaBackflowRow[], error: "读取 e看牙回流解析数据失败，请检查 ekanya_backflow_rows 表权限。" };
  }

  return { data: (result.data ?? []) as EkanyaBackflowRow[], error: null };
}

function filterFileIds(files: UploadedFileRow[], dataTypes: string[]) {
  return files.filter((file) => dataTypes.includes(file.data_type ?? "")).map((file) => file.id);
}

function summarizeMeituanSummary(rows: MeituanSummaryRow[]) {
  const totalSpend = sum(rows, "spend");
  const totalImpressions = sum(rows, "impressions");
  const totalClicks = sum(rows, "clicks");
  const merchantViews = sum(rows, "merchant_views");
  const phoneViews = sum(rows, "phone_views");
  const onlineConsultClicks = sum(rows, "online_consult_clicks");
  const orders = sum(rows, "orders");
  const groupBuyOrders = sum(rows, "group_buy_orders");
  const groupBuyOrders15d = sum(rows, "group_buy_orders_15d");

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    avgClickCost: safeDivide(totalSpend, totalClicks),
    merchantViews,
    phoneViews,
    onlineConsultClicks,
    orders,
    groupBuyOrders,
    groupBuyOrders15d,
    clickRate: safeDivide(totalClicks, totalImpressions),
    phoneRate: safeDivide(phoneViews, totalClicks),
    consultRate: safeDivide(onlineConsultClicks, totalClicks),
    orderRate: safeDivide(orders, totalClicks),
  };
}

function summarizeEkanya(rows: EkanyaBackflowRow[], totalSpend: number) {
  const leadCount = rows.length;
  const appointmentCount = rows.filter((row) => isPositiveStatus(row.appointment_status)).length;
  const visitCount = rows.filter((row) => isPositiveStatus(row.visit_status) || Boolean(row.visit_date)).length;
  const dealCount = rows.filter((row) => isPositiveStatus(row.deal_status) || Boolean(row.deal_date) || toNumber(row.paid_amount) > 0).length;
  const paidAmount = rows.reduce((total, row) => total + toNumber(row.paid_amount), 0);

  return {
    leadCount,
    appointmentCount,
    visitCount,
    dealCount,
    paidAmount,
    avgPaidAmount: safeDivide(paidAmount, dealCount),
    visitRate: safeDivide(visitCount, appointmentCount || leadCount),
    dealRate: safeDivide(dealCount, visitCount),
    paidRoi: safeDivide(paidAmount, totalSpend),
  };
}

function summarizeProjects(rows: EkanyaBackflowRow[]) {
  const grouped = new Map<string, EkanyaBackflowRow[]>();

  rows.forEach((row) => {
    const projectName = normalizeProjectName(row.deal_project?.trim() || row.visit_project?.trim() || row.intention_project?.trim() || "其他");
    grouped.set(projectName, [...(grouped.get(projectName) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([projectName, projectRows]) => {
      const leadCount = projectRows.length;
      const visitCount = projectRows.filter((row) => isPositiveStatus(row.visit_status) || Boolean(row.visit_date)).length;
      const dealCount = projectRows.filter((row) => isPositiveStatus(row.deal_status) || Boolean(row.deal_date) || toNumber(row.paid_amount) > 0).length;
      const paidAmount = projectRows.reduce((total, row) => total + toNumber(row.paid_amount), 0);

      return {
        projectName,
        leadCount,
        visitCount,
        dealCount,
        paidAmount,
        avgPaidAmount: safeDivide(paidAmount, dealCount),
        mainSourcePlatform: getMainSourcePlatform(projectRows),
        observationNote: getProjectObservationNote(projectName, leadCount, visitCount, dealCount, paidAmount),
      };
    })
    .sort((a, b) => b.paidAmount - a.paidAmount || b.leadCount - a.leadCount || a.projectName.localeCompare(b.projectName, "zh-CN"));
}

function summarizeKeywords(rows: MeituanKeywordRow[]) {
  const grouped = new Map<string, MeituanSummaryRow & { keyword: string }>();

  rows.forEach((row) => {
    const keyword = row.keyword?.trim() || "未命名关键词";
    const current = grouped.get(keyword) ?? {
      keyword,
      spend: 0,
      impressions: 0,
      clicks: 0,
      avg_click_cost: 0,
      merchant_views: 0,
      phone_views: 0,
      online_consult_clicks: 0,
      orders: 0,
      group_buy_orders: 0,
      group_buy_orders_15d: 0,
    };

    current.spend = toNumber(current.spend) + toNumber(row.spend);
    current.impressions = toNumber(current.impressions) + toNumber(row.impressions);
    current.clicks = toNumber(current.clicks) + toNumber(row.clicks);
    current.phone_views = toNumber(current.phone_views) + toNumber(row.phone_views);
    current.online_consult_clicks = toNumber(current.online_consult_clicks) + toNumber(row.online_consult_clicks);
    current.orders = toNumber(current.orders) + toNumber(row.orders);
    current.group_buy_orders = toNumber(current.group_buy_orders) + toNumber(row.group_buy_orders);
    grouped.set(keyword, current);
  });

  return Array.from(grouped.values())
    .map((row) => {
      const spend = toNumber(row.spend);
      const clicks = toNumber(row.clicks);
      const phoneViews = toNumber(row.phone_views);
      const onlineConsultClicks = toNumber(row.online_consult_clicks);
      const orders = toNumber(row.orders);
      const groupBuyOrders = toNumber(row.group_buy_orders);
      const actionCount = phoneViews + onlineConsultClicks + orders + groupBuyOrders;

      return {
        keyword: row.keyword,
        spend,
        impressions: toNumber(row.impressions),
        clicks,
        avgClickCost: safeDivide(spend, clicks),
        phoneViews,
        onlineConsultClicks,
        orders,
        groupBuyOrders,
        ruleNote: getKeywordRuleNote(spend, clicks, actionCount),
      };
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
}

function buildReminders({
  hasMeituanSummary,
  hasMeituanKeywords,
  hasEkanyaBackflow,
  totalSpend,
  paidAmount,
  paidRoi,
  projectRows,
}: {
  hasMeituanSummary: boolean;
  hasMeituanKeywords: boolean;
  hasEkanyaBackflow: boolean;
  totalSpend: number;
  paidAmount: number;
  paidRoi: number | null;
  projectRows: Array<{ projectName: string; dealCount: number }>;
}) {
  const reminders: string[] = [];

  if (!hasMeituanSummary) reminders.push("还没有解析美团推广汇总数据，本周投放花费和前端链路不完整。");
  if (!hasEkanyaBackflow) reminders.push("还没有 e看牙回流数据，本周只能看前端数据，无法判断到院和成交。");
  if (totalSpend > 0 && paidAmount === 0) reminders.push("本周有花费但实收为 0，先确认 e看牙来源是否记录完整，再判断投放效果。");
  if (paidRoi !== null && paidRoi < 3) reminders.push("初步实收 ROI 未达 1:3，先看项目结构、到院率和成交率，不要直接下结论。");
  if (projectRows.some((row) => ["种植", "正畸", "半口/全口"].includes(row.projectName) && row.dealCount === 0)) {
    reminders.push("种植、正畸、半口/全口这类项目周期较长，短期没成交不要只看几天就否定。");
  }
  if (!hasMeituanKeywords) reminders.push("还没有美团关键词数据，周报暂时无法判断哪些关键词需要处理。");

  return reminders.length > 0 ? reminders : ["本周数据已形成基础周报草稿，开会时仍需要人工确认投放动作。"];
}

function getKeywordRuleNote(spend: number, clicks: number, actionCount: number) {
  if (spend >= 300 && clicks >= 10 && actionCount === 0) return "花费高、点击高但电话/咨询/订单少，建议人工复核关键词意图和页面承接。";
  if (actionCount > 0) return "已经带来电话、咨询或订单，先保留观察。";
  if (spend >= 300 && actionCount === 0) return "花费偏高但没有动作，谨慎处理，人工复核后再考虑降价或暂停。";
  return "样本太少，先继续观察。";
}

function getProjectObservationNote(projectName: string, leadCount: number, visitCount: number, dealCount: number, paidAmount: number) {
  if (leadCount < 3) return "样本太少，先不要下结论。";
  if (paidAmount > 0) return "已经产生实收，建议继续观察来源质量。";
  if (["种植", "正畸", "半口/全口"].includes(projectName) && dealCount === 0) return "高客单项目周期长，不要只看几天成交。";
  if (visitCount > 0 && dealCount === 0) return "到院有了，重点看现场转化、方案沟通和复诊跟进。";
  return "继续按项目周期观察，不要自动调整。";
}

function normalizeProjectName(projectName: string) {
  const text = projectName.trim().toLowerCase();

  if (/半口|全口|all\s*on|allon/.test(text)) return "半口/全口";
  if (/儿童早矫|早矫|儿早/.test(text)) return "儿童早矫";
  if (/窝沟|封闭/.test(text)) return "窝沟封闭";
  if (/涂氟|氟化/.test(text)) return "涂氟";
  if (/智齿|智慧齿/.test(text)) return "智齿";
  if (/洁牙|洗牙|喷砂|超声波洁治/.test(text)) return "洁牙";
  if (/补牙|树脂|充填/.test(text)) return "补牙";
  if (/拔牙|拔除/.test(text)) return "拔牙";
  if (/根管|牙髓|根尖/.test(text)) return "根管";
  if (/儿牙|儿童牙|儿童口腔|乳牙/.test(text)) return "儿牙";
  if (/正畸|矫正|牙套|隐形矫正|时代天使|隐适美/.test(text)) return "正畸";
  if (/种植|种牙|种植牙/.test(text)) return "种植";
  if (/修复|牙冠|冠修复|嵌体|义齿/.test(text)) return "修复";
  if (/牙周|牙龈|龈下|刮治/.test(text)) return "牙周";
  if (/美白|冷光/.test(text)) return "美白";
  if (/贴面|瓷贴面/.test(text)) return "贴面";
  if (/检查|拍片|ct|方案|评估|初诊/.test(text)) return "检查";

  return "其他";
}

function getMainSourcePlatform(rows: EkanyaBackflowRow[]) {
  const sourceCounts = new Map<string, number>();

  rows.forEach((row) => {
    const source = row.source_platform?.trim() || "未记录来源";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  });

  return Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "未记录来源";
}

function isPositiveStatus(value: string | null) {
  if (!value) return false;
  return /是|已|到|成交|预约|完成|yes|true|1/i.test(value);
}

function sum<T extends Record<string, NumericValue>>(rows: T[], key: keyof T) {
  return rows.reduce((total, row) => total + toNumber(row[key]), 0);
}

function toNumber(value: NumericValue) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function resolveDateRange(startDateParam: string | null, endDateParam: string | null) {
  const today = new Date();
  const defaultEnd = formatDate(today);
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(today.getDate() - 6);

  const startDate = isDateString(startDateParam) ? startDateParam : formatDate(defaultStartDate);
  const endDate = isDateString(endDateParam) ? endDateParam : defaultEnd;

  return { startDate, endDate };
}

function isDateString(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}