import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const supportedDateTypes = new Set(["source_date", "visit_date", "deal_date"]);
const meituanSourceNames = ["美团", "大众点评", "美团点评", "meituan", "dianping"];

type NumericValue = number | string | null | undefined;

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

type UploadedFileRow = {
  id: string;
  data_type: string | null;
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
    console.error("[api/closed-loop/meituan] uploaded_files query failed", {
      code: uploadedResult.error.code,
      message: uploadedResult.error.message,
      details: uploadedResult.error.details,
      hint: uploadedResult.error.hint,
    });

    return NextResponse.json({ message: "读取上传记录失败，请检查 uploaded_files 表权限。" }, { status: 500 });
  }

  const uploadedFiles = (uploadedResult.data ?? []) as UploadedFileRow[];
  const summaryFileIds = filterFileIds(uploadedFiles, ["美团推广汇总数据", "meituan-summary"]);
  const keywordFileIds = filterFileIds(uploadedFiles, ["美团关键词数据", "meituan-keywords"]);
  const ekanyaFileIds = filterFileIds(uploadedFiles, ["e看牙后端回流数据", "ekanya-backflow"]);

  const [summaryRows, keywordRows, ekanyaRows] = await Promise.all([
    fetchMeituanSummaryRows(summaryFileIds, range.startDate, range.endDate),
    fetchMeituanKeywordRows(keywordFileIds, range.startDate, range.endDate),
    fetchEkanyaRows(ekanyaFileIds, dateType, range.startDate, range.endDate),
  ]);

  if (summaryRows.error || keywordRows.error || ekanyaRows.error) {
    return NextResponse.json(
      {
        message:
          summaryRows.error ?? keywordRows.error ?? ekanyaRows.error ?? "读取闭环数据失败，请检查解析表权限。",
      },
      { status: 500 },
    );
  }

  const meituanSummary = summarizeMeituanSummary(summaryRows.data);
  const keywordTop10 = summarizeKeywords(keywordRows.data);
  const ekanyaMeituanRows = ekanyaRows.data.filter(isMeituanSource);
  const ekanyaSummary = summarizeEkanya(ekanyaMeituanRows, meituanSummary.totalSpend);
  const projectRows = summarizeProjects(ekanyaMeituanRows, meituanSummary.totalSpend);

  return NextResponse.json({
    range: {
      startDate: range.startDate,
      endDate: range.endDate,
      dateType,
    },
    meituanSummary,
    keywordTop10,
    ekanyaSummary,
    projectRows,
    emptyStates: {
      hasMeituanSummary: summaryRows.data.length > 0,
      hasMeituanKeywords: keywordRows.data.length > 0,
      hasEkanyaBackflow: ekanyaMeituanRows.length > 0,
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
    .limit(5000);

  if (result.error) {
    console.error("[api/closed-loop/meituan] meituan_summary_rows query failed", {
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
    .limit(5000);

  if (result.error) {
    console.error("[api/closed-loop/meituan] meituan_keyword_rows query failed", {
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
    .limit(5000);

  if (result.error) {
    console.error("[api/closed-loop/meituan] ekanya_backflow_rows query failed", {
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
    consultRate: safeDivide(onlineConsultClicks, totalClicks),
    phoneRate: safeDivide(phoneViews, totalClicks),
    orderRate: safeDivide(orders, totalClicks),
  };
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
    current.merchant_views = toNumber(current.merchant_views) + toNumber(row.merchant_views);
    current.phone_views = toNumber(current.phone_views) + toNumber(row.phone_views);
    current.online_consult_clicks = toNumber(current.online_consult_clicks) + toNumber(row.online_consult_clicks);
    current.orders = toNumber(current.orders) + toNumber(row.orders);
    current.group_buy_orders = toNumber(current.group_buy_orders) + toNumber(row.group_buy_orders);
    current.group_buy_orders_15d = toNumber(current.group_buy_orders_15d) + toNumber(row.group_buy_orders_15d);
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

function summarizeEkanya(rows: EkanyaBackflowRow[], totalSpend: number) {
  const leadCount = rows.length;
  const appointmentCount = rows.filter((row) => isPositiveStatus(row.appointment_status)).length;
  const visitCount = rows.filter((row) => isPositiveStatus(row.visit_status) || Boolean(row.visit_date)).length;
  const dealCount = rows.filter((row) => isPositiveStatus(row.deal_status) || toNumber(row.paid_amount) > 0).length;
  const paidAmount = rows.reduce((total, row) => total + toNumber(row.paid_amount), 0);
  const paidRoi = safeDivide(paidAmount, totalSpend);

  return {
    leadCount,
    appointmentCount,
    visitCount,
    dealCount,
    paidAmount,
    avgPaidAmount: safeDivide(paidAmount, dealCount),
    visitRate: safeDivide(visitCount, appointmentCount || leadCount),
    dealRate: safeDivide(dealCount, visitCount),
    paidRoi,
    statusNote: getRoiStatusNote(paidRoi, dealCount),
  };
}

function summarizeProjects(rows: EkanyaBackflowRow[], totalSpend: number) {
  const grouped = new Map<string, EkanyaBackflowRow[]>();

  rows.forEach((row) => {
    const projectName = row.deal_project?.trim() || row.visit_project?.trim() || row.intention_project?.trim() || "其他";
    grouped.set(projectName, [...(grouped.get(projectName) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([projectName, projectRows]) => {
      const leadCount = projectRows.length;
      const visitCount = projectRows.filter((row) => isPositiveStatus(row.visit_status) || Boolean(row.visit_date)).length;
      const dealCount = projectRows.filter((row) => isPositiveStatus(row.deal_status) || toNumber(row.paid_amount) > 0).length;
      const paidAmount = projectRows.reduce((total, row) => total + toNumber(row.paid_amount), 0);
      const sourceCounts = new Map<string, number>();
      projectRows.forEach((row) => {
        const source = row.source_platform?.trim() || "未记录来源";
        sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
      });
      const mainSourcePlatform = Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "美团/点评体系";

      return {
        projectName,
        leadCount,
        visitCount,
        dealCount,
        paidAmount,
        avgPaidAmount: safeDivide(paidAmount, dealCount),
        mainSourcePlatform,
        paidRoi: safeDivide(paidAmount, totalSpend),
        observationNote: getProjectObservationNote(projectName, leadCount, dealCount),
      };
    })
    .sort((a, b) => b.paidAmount - a.paidAmount || b.leadCount - a.leadCount);
}

function getKeywordRuleNote(spend: number, clicks: number, actionCount: number) {
  if (spend > 0 && clicks > 0 && actionCount === 0) {
    return "花费和点击都有，但电话、咨询、订单还没有，先人工复核关键词意图和页面承接。";
  }
  if (clicks < 5 && spend < 100) {
    return "曝光和点击都少，样本太少，先继续观察。";
  }
  if (actionCount > 0) {
    return "已经带来电话、咨询或订单，先保留观察，不要急着动。";
  }
  if (spend >= 300 && actionCount === 0) {
    return "花费偏高但没有动作，谨慎处理，人工复核后再考虑降价或暂停。";
  }
  return "先看 3-7 天，不要只凭一天数据处理关键词。";
}

function getRoiStatusNote(paidRoi: number | null, dealCount: number) {
  if (paidRoi !== null && paidRoi >= 3) return "达到 1:3 参考线，但仍要看项目周期和服务承接。";
  if (paidRoi !== null && paidRoi > 0 && paidRoi < 3) return "未达 1:3，继续看项目结构和回流质量。";
  if (dealCount === 0) return "当前没有成交或实收，先看样本量和 e看牙记录是否完整，不能直接否定。";
  return "花费或实收不足，暂时只作为参考。";
}

function getProjectObservationNote(projectName: string, leadCount: number, dealCount: number) {
  if (/种植|正畸|半口|全口/.test(projectName)) {
    return "高客单项目要看 7-30 天甚至更久，不要因短期未成交就下结论。";
  }
  if (/洁牙|检查/.test(projectName)) {
    return "引流项目要看后续转化，不只看当次实收。";
  }
  if (leadCount > 0 && dealCount === 0) {
    return "有来源客户但暂无成交，先查到院和医生方案承接。";
  }
  return "结合到院、成交和实收继续观察。";
}

function isMeituanSource(row: EkanyaBackflowRow) {
  const source = row.source_platform?.trim().toLowerCase() ?? "";
  return meituanSourceNames.some((name) => source.includes(name.toLowerCase()));
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