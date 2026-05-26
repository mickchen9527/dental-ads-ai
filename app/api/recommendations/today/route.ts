import { NextResponse } from "next/server";
import {
  buildRecommendationThresholds,
  getPlatformRuleProfile,
  getSampleTooSmallMessage,
  hasEnoughTrafficSample,
  isHealthyPaidRoi,
  isLowConsultationRate,
  isLowPaidRoi,
  isLowPhoneRate,
  isRiskyKeywordSpend,
  isTargetSettingKey,
  targetSettingDefinitions,
  type RecommendationThresholdSettings,
  type TargetSettingKey,
} from "@/lib/recommendation-rules";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const supportedDateTypes = new Set(["source_date", "visit_date", "deal_date"]);

const dataTypes = {
  meituanSummary: ["美团推广汇总数据", "meituan-summary"],
  meituanKeywords: ["美团关键词数据", "meituan-keywords"],
  ekanyaBackflow: ["e看牙后端回流数据", "ekanya-backflow"],
  douyinPlan: ["抖音计划汇总数据", "抖音广告计划汇总数据", "douyin-plan-summary", "douyin-ad-plan-summary"],
  douyinLead: ["抖音表单/私信线索数据", "抖音表单 / 私信线索数据", "douyin-leads"],
  gdtPlan: [
    "腾讯广点通计划汇总数据",
    "腾讯计划汇总数据",
    "广点通计划汇总数据",
    "腾讯账户/计划汇总数据",
    "腾讯广告计划汇总数据",
    "腾讯信息流计划汇总数据",
    "腾讯广点通账户/计划汇总数据",
    "广点通账户/计划汇总数据",
    "gdt-plan-summary",
  ],
  gdtLead: [
    "腾讯表单/电话线索数据",
    "腾讯表单 / 电话线索数据",
    "腾讯线索数据",
    "广点通线索数据",
    "腾讯表单线索数据",
    "腾讯电话线索数据",
    "gdt-leads",
  ],
  amapSummary: ["高德推广汇总数据", "高德广告汇总数据", "高德投放汇总数据", "amap-summary"],
  amapAction: [
    "高德电话/导航/门店访问数据",
    "高德电话 / 导航 / 门店访问数据",
    "高德行为明细数据",
    "高德门店访问数据",
    "高德电话导航数据",
    "amap-actions",
  ],
  amapLead: ["高德线索数据", "高德留资数据", "高德咨询线索数据", "高德客户线索数据", "amap-leads"],
};

type NumericValue = number | string | null | undefined;
type Priority = "high" | "medium" | "low";
type PlatformKey = "meituan" | "douyin" | "gdt" | "amap";

type UploadedFileRow = {
  id: string;
  data_type: string | null;
  parse_status: string | null;
};

type MeituanSummaryRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
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

type DouyinPlanRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  conversions: NumericValue;
  form_count: NumericValue;
  private_message_count: NumericValue;
  phone_count: NumericValue;
};

type GdtPlanRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  conversions: NumericValue;
  form_count: NumericValue;
  phone_count: NumericValue;
  consult_count: NumericValue;
};

type AmapSummaryRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  phone_clicks: NumericValue;
  navigation_clicks: NumericValue;
  store_view_count: NumericValue;
  address_clicks: NumericValue;
  coupon_clicks: NumericValue;
  lead_count: NumericValue;
};

type AmapActionRow = {
  phone_clicks: NumericValue;
  navigation_clicks: NumericValue;
  address_clicks: NumericValue;
  store_view_count: NumericValue;
  coupon_clicks: NumericValue;
};

type LeadStatusRow = {
  appointment_status: string | null;
  visit_status: string | null;
  deal_status: string | null;
};

type EkanyaBackflowRow = LeadStatusRow & {
  source_platform: string | null;
  source_date: string | null;
  visit_date: string | null;
  deal_date: string | null;
  paid_amount: NumericValue;
};

type FrontPlatformSummary = {
  key: PlatformKey;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  clickRate: number | null;
  actionCount: number;
  leadCount: number;
  conversionCount: number;
  hasData: boolean;
  onlyFrontTraffic: boolean;
};

type EkanyaSummary = {
  leadCount: number;
  appointmentCount: number;
  visitCount: number;
  dealCount: number;
  paidAmount: number;
  avgPaidAmount: number | null;
  visitRate: number | null;
  dealRate: number | null;
  paidRoi: number | null;
};

type PlatformRecommendationInput = {
  front: FrontPlatformSummary;
  ekanya: EkanyaSummary;
};

type TodayRecommendation = {
  id: string;
  title: string;
  platform: string;
  priority: Priority;
  problemType: string;
  problem: string;
  reason: string;
  action: string;
  risk: string;
  immediateAdjustment: "建议先处理" | "建议观察" | "不建议立即调整";
  steps: string[];
  dontDo: string;
  observeDays: string;
  reviewMetrics: string[];
  dataBasis: string[];
  status: "pending";
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
  const targetSettings = await fetchTargetSettings();

  const uploadedResult = await supabase
    .from("uploaded_files")
    .select("id, data_type, parse_status")
    .eq("is_active", true);

  if (uploadedResult.error) {
    console.error("[api/recommendations/today] uploaded_files query failed", {
      code: uploadedResult.error.code,
      message: uploadedResult.error.message,
      details: uploadedResult.error.details,
      hint: uploadedResult.error.hint,
    });
    return NextResponse.json({ message: "读取上传记录失败，请检查 uploaded_files 表权限。" }, { status: 500 });
  }

  const uploadedFiles = (uploadedResult.data ?? []) as UploadedFileRow[];
  const fileIds = {
    meituanSummary: getParsedFileIds(uploadedFiles, dataTypes.meituanSummary),
    meituanKeywords: getParsedFileIds(uploadedFiles, dataTypes.meituanKeywords),
    ekanyaBackflow: getParsedFileIds(uploadedFiles, dataTypes.ekanyaBackflow),
    douyinPlan: getParsedFileIds(uploadedFiles, dataTypes.douyinPlan),
    douyinLead: getParsedFileIds(uploadedFiles, dataTypes.douyinLead),
    gdtPlan: getParsedFileIds(uploadedFiles, dataTypes.gdtPlan),
    gdtLead: getParsedFileIds(uploadedFiles, dataTypes.gdtLead),
    amapSummary: getParsedFileIds(uploadedFiles, dataTypes.amapSummary),
    amapAction: getParsedFileIds(uploadedFiles, dataTypes.amapAction),
    amapLead: getParsedFileIds(uploadedFiles, dataTypes.amapLead),
  };

  const [
    meituanSummaryRows,
    keywordRows,
    ekanyaRows,
    douyinPlanRows,
    douyinLeadRows,
    gdtPlanRows,
    gdtLeadRows,
    amapSummaryRows,
    amapActionRows,
    amapLeadRows,
  ] = await Promise.all([
    fetchRows<MeituanSummaryRow>(
      "meituan_summary_rows",
      "spend, impressions, clicks, merchant_views, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d",
      fileIds.meituanSummary,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<MeituanKeywordRow>(
      "meituan_keyword_rows",
      "keyword, spend, impressions, clicks, phone_views, online_consult_clicks, orders, group_buy_orders",
      fileIds.meituanKeywords,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<EkanyaBackflowRow>(
      "ekanya_backflow_rows",
      "source_platform, source_date, visit_date, deal_date, appointment_status, visit_status, deal_status, paid_amount",
      fileIds.ekanyaBackflow,
      dateType,
      range.startDate,
      range.endDate,
    ),
    fetchRows<DouyinPlanRow>(
      "douyin_plan_summary_rows",
      "spend, impressions, clicks, conversions, form_count, private_message_count, phone_count",
      fileIds.douyinPlan,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<LeadStatusRow>(
      "douyin_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.douyinLead,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<GdtPlanRow>(
      "gdt_plan_summary_rows",
      "spend, impressions, clicks, conversions, form_count, phone_count, consult_count",
      fileIds.gdtPlan,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<LeadStatusRow>(
      "gdt_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.gdtLead,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<AmapSummaryRow>(
      "amap_summary_rows",
      "spend, impressions, clicks, phone_clicks, navigation_clicks, store_view_count, address_clicks, coupon_clicks, lead_count",
      fileIds.amapSummary,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<AmapActionRow>(
      "amap_action_rows",
      "phone_clicks, navigation_clicks, address_clicks, store_view_count, coupon_clicks",
      fileIds.amapAction,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<LeadStatusRow>(
      "amap_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.amapLead,
      "date",
      range.startDate,
      range.endDate,
    ),
  ]);

  const failedFetch = [
    meituanSummaryRows,
    keywordRows,
    ekanyaRows,
    douyinPlanRows,
    douyinLeadRows,
    gdtPlanRows,
    gdtLeadRows,
    amapSummaryRows,
    amapActionRows,
    amapLeadRows,
  ].find((result) => result.error);

  if (failedFetch?.error) {
    return NextResponse.json({ message: failedFetch.error }, { status: 500 });
  }

  const ekanyaByPlatform = groupEkanyaRowsByPlatform(ekanyaRows.data);
  const meituanSummary = summarizeMeituanSummary(meituanSummaryRows.data);
  const keywordTop = summarizeKeywords(keywordRows.data);
  const frontPlatforms: Record<PlatformKey, FrontPlatformSummary> = {
    meituan: summarizeMeituanFront(meituanSummaryRows.data),
    douyin: summarizeDouyinFront(douyinPlanRows.data, douyinLeadRows.data),
    gdt: summarizeGdtFront(gdtPlanRows.data, gdtLeadRows.data),
    amap: summarizeAmapFront(amapSummaryRows.data, amapActionRows.data, amapLeadRows.data),
  };
  const platformSummaries = (Object.keys(frontPlatforms) as PlatformKey[]).map((key) => {
    const front = frontPlatforms[key];
    return {
      ...front,
      ekanya: summarizeEkanya(ekanyaByPlatform[key] ?? [], front.spend),
    };
  });

  const uploadCompleteness = {
    hasMeituanSummary: meituanSummaryRows.data.length > 0,
    hasMeituanKeywords: keywordRows.data.length > 0,
    hasEkanyaBackflow: ekanyaRows.data.length > 0,
    hasAnyParsedData:
      meituanSummaryRows.data.length > 0 ||
      keywordRows.data.length > 0 ||
      ekanyaRows.data.length > 0 ||
      douyinPlanRows.data.length > 0 ||
      douyinLeadRows.data.length > 0 ||
      gdtPlanRows.data.length > 0 ||
      gdtLeadRows.data.length > 0 ||
      amapSummaryRows.data.length > 0 ||
      amapActionRows.data.length > 0 ||
      amapLeadRows.data.length > 0,
    hasDouyin: douyinPlanRows.data.length > 0 || douyinLeadRows.data.length > 0,
    hasGdt: gdtPlanRows.data.length > 0 || gdtLeadRows.data.length > 0,
    hasAmap: amapSummaryRows.data.length > 0 || amapActionRows.data.length > 0 || amapLeadRows.data.length > 0,
  };

  const ekanyaSummary = platformSummaries.find((platform) => platform.key === "meituan")?.ekanya ?? summarizeEkanya([], meituanSummary.totalSpend);
  const dataGaps = buildDataGaps(platformSummaries);
  const recommendations = buildRecommendations({
    uploadCompleteness,
    meituanSummary,
    keywordTop,
    ekanyaSummary,
    platformSummaries,
    thresholds: targetSettings.thresholds,
  });

  return NextResponse.json({
    range: {
      startDate: range.startDate,
      endDate: range.endDate,
      dateType,
    },
    uploadCompleteness,
    meituanSummary,
    keywordTop,
    ekanyaSummary,
    platformSummaries,
    dataGaps,
    targetSettings: {
      source: targetSettings.source,
      values: targetSettings.thresholds,
    },
    recommendations,
  });
}

async function fetchRows<T>(
  tableName: string,
  columns: string,
  uploadedFileIds: string[],
  dateColumn: string,
  startDate: string,
  endDate: string,
) {
  if (uploadedFileIds.length === 0) return { data: [] as T[], error: null as string | null };
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as T[], error: "Supabase 服务端连接失败。" };

  const result = await supabase
    .from(tableName)
    .select(columns)
    .in("uploaded_file_id", uploadedFileIds)
    .gte(dateColumn, startDate)
    .lte(dateColumn, endDate)
    .limit(10000);

  if (result.error) {
    console.error(`[api/recommendations/today] ${tableName} query failed`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    return { data: [] as T[], error: `读取 ${tableName} 失败，请检查表权限和字段。` };
  }

  return { data: (result.data ?? []) as T[], error: null };
}

async function fetchTargetSettings(): Promise<{
  source: "cloud" | "default";
  thresholds: RecommendationThresholdSettings;
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { source: "default", thresholds: buildRecommendationThresholds() };
  }

  const result = await supabase
    .from("target_settings")
    .select("key, value")
    .in(
      "key",
      targetSettingDefinitions.map((definition) => definition.key),
    );

  if (result.error) {
    console.error("[api/recommendations/today] target_settings query failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    return { source: "default", thresholds: buildRecommendationThresholds() };
  }

  const overrides: Partial<Record<TargetSettingKey, number>> = {};
  (result.data ?? []).forEach((row) => {
    const key = typeof row.key === "string" ? row.key : "";
    if (!isTargetSettingKey(key)) return;
    const value = typeof row.value === "number" ? row.value : Number(row.value);
    if (Number.isFinite(value) && value >= 0) {
      overrides[key] = value;
    }
  });

  return {
    source: Object.keys(overrides).length > 0 ? "cloud" : "default",
    thresholds: buildRecommendationThresholds(overrides),
  };
}

function getParsedFileIds(files: UploadedFileRow[], targetTypes: string[]) {
  return files.filter((file) => targetTypes.includes(file.data_type ?? "") && file.parse_status === "parsed").map((file) => file.id);
}

function summarizeMeituanSummary(rows: MeituanSummaryRow[]) {
  const front = summarizeMeituanFront(rows);
  const phoneViews = sum(rows, "phone_views");
  const onlineConsultClicks = sum(rows, "online_consult_clicks");
  const orders = sum(rows, "orders");
  const groupBuyOrders = sum(rows, "group_buy_orders");
  const groupBuyOrders15d = sum(rows, "group_buy_orders_15d");

  return {
    totalSpend: front.spend,
    totalImpressions: front.impressions,
    totalClicks: front.clicks,
    avgClickCost: front.avgClickCost,
    merchantViews: sum(rows, "merchant_views"),
    phoneViews,
    onlineConsultClicks,
    orders,
    groupBuyOrders,
    groupBuyOrders15d,
    clickRate: front.clickRate,
    phoneRate: safeDivide(phoneViews, front.clicks),
    consultRate: safeDivide(onlineConsultClicks, front.clicks),
    orderRate: safeDivide(orders, front.clicks),
  };
}

function summarizeMeituanFront(rows: MeituanSummaryRow[]): FrontPlatformSummary {
  const spend = sum(rows, "spend");
  const impressions = sum(rows, "impressions");
  const clicks = sum(rows, "clicks");
  const phoneViews = sum(rows, "phone_views");
  const onlineConsultClicks = sum(rows, "online_consult_clicks");
  const orders = sum(rows, "orders");
  const groupBuyOrders = sum(rows, "group_buy_orders");
  const actionCount = phoneViews + onlineConsultClicks + orders + groupBuyOrders;

  return {
    key: "meituan",
    platform: "美团",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    actionCount,
    leadCount: phoneViews + onlineConsultClicks + groupBuyOrders,
    conversionCount: orders + groupBuyOrders,
    hasData: rows.length > 0,
    onlyFrontTraffic: rows.length > 0,
  };
}

function summarizeDouyinFront(planRows: DouyinPlanRow[], leadRows: LeadStatusRow[]): FrontPlatformSummary {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const privateMessageCount = sum(planRows, "private_message_count");
  const phoneCount = sum(planRows, "phone_count");
  const leadCount = leadRows.length;
  const actionCount = conversions + formCount + privateMessageCount + phoneCount + leadCount;

  return {
    key: "douyin",
    platform: "抖音",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    actionCount,
    leadCount,
    conversionCount: conversions,
    hasData: planRows.length > 0 || leadRows.length > 0,
    onlyFrontTraffic: planRows.length > 0 && leadRows.length === 0,
  };
}

function summarizeGdtFront(planRows: GdtPlanRow[], leadRows: LeadStatusRow[]): FrontPlatformSummary {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const phoneCount = sum(planRows, "phone_count");
  const consultCount = sum(planRows, "consult_count");
  const leadCount = leadRows.length;
  const actionCount = conversions + formCount + phoneCount + consultCount + leadCount;

  return {
    key: "gdt",
    platform: "腾讯广点通",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    actionCount,
    leadCount,
    conversionCount: conversions,
    hasData: planRows.length > 0 || leadRows.length > 0,
    onlyFrontTraffic: planRows.length > 0 && leadRows.length === 0,
  };
}

function summarizeAmapFront(summaryRows: AmapSummaryRow[], actionRows: AmapActionRow[], leadRows: LeadStatusRow[]): FrontPlatformSummary {
  const spend = sum(summaryRows, "spend");
  const impressions = sum(summaryRows, "impressions");
  const clicks = sum(summaryRows, "clicks");
  const phoneClicks = sum(summaryRows, "phone_clicks") + sum(actionRows, "phone_clicks");
  const navigationClicks = sum(summaryRows, "navigation_clicks") + sum(actionRows, "navigation_clicks");
  const storeViews = sum(summaryRows, "store_view_count") + sum(actionRows, "store_view_count");
  const addressClicks = sum(summaryRows, "address_clicks") + sum(actionRows, "address_clicks");
  const couponClicks = sum(summaryRows, "coupon_clicks") + sum(actionRows, "coupon_clicks");
  const summaryLeadCount = sum(summaryRows, "lead_count");
  const leadCount = summaryLeadCount + leadRows.length;
  const actionCount = phoneClicks + navigationClicks + storeViews + addressClicks + couponClicks + leadCount;

  return {
    key: "amap",
    platform: "高德",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    actionCount,
    leadCount,
    conversionCount: couponClicks,
    hasData: summaryRows.length > 0 || actionRows.length > 0 || leadRows.length > 0,
    onlyFrontTraffic: (summaryRows.length > 0 || actionRows.length > 0) && leadRows.length === 0,
  };
}

function summarizeKeywords(rows: MeituanKeywordRow[]) {
  const grouped = new Map<string, MeituanKeywordRow & { keyword: string }>();

  rows.forEach((row) => {
    const keyword = row.keyword?.trim() || "未命名关键词";
    const current = grouped.get(keyword) ?? {
      keyword,
      spend: 0,
      impressions: 0,
      clicks: 0,
      phone_views: 0,
      online_consult_clicks: 0,
      orders: 0,
      group_buy_orders: 0,
      merchant_views: 0,
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
        actionCount: phoneViews + onlineConsultClicks + orders + groupBuyOrders,
      };
    })
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
}

function summarizeEkanya(rows: EkanyaBackflowRow[], totalSpend: number): EkanyaSummary {
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

function buildRecommendations({
  uploadCompleteness,
  meituanSummary,
  keywordTop,
  ekanyaSummary,
  platformSummaries,
  thresholds,
}: {
  uploadCompleteness: {
    hasMeituanSummary: boolean;
    hasMeituanKeywords: boolean;
    hasEkanyaBackflow: boolean;
    hasAnyParsedData: boolean;
    hasDouyin: boolean;
    hasGdt: boolean;
    hasAmap: boolean;
  };
  meituanSummary: ReturnType<typeof summarizeMeituanSummary>;
  keywordTop: ReturnType<typeof summarizeKeywords>;
  ekanyaSummary: EkanyaSummary;
  platformSummaries: Array<FrontPlatformSummary & { ekanya: EkanyaSummary }>;
  thresholds: RecommendationThresholdSettings;
}) {
  const recommendations: TodayRecommendation[] = [];

  if (!uploadCompleteness.hasMeituanSummary) {
    recommendations.push(makeRecommendation({
      id: "missing-meituan-summary",
      title: "先上传美团推广汇总数据",
      platform: "数据质量",
      priority: "high",
      problemType: "数据缺失",
      problem: "当前没有美团推广汇总解析数据，无法判断花费、点击、电话和咨询。",
      reason: "没有前端花费和点击数据，就不知道今天钱花到哪里了。",
      action: "先到数据上传页上传并解析美团推广汇总数据，建议人工复核后执行。",
      risk: "缺少美团前端数据时，不建议直接调预算。",
      immediateAdjustment: "建议先处理",
      steps: ["进入数据上传页", "上传美团推广汇总数据", "上传后点击解析", "回到今日总建议刷新页面"],
      dontDo: "不要在没有花费和点击数据时调整预算。",
      observeDays: "今天先补数据",
      reviewMetrics: ["美团总花费", "点击", "查看电话", "在线咨询点击"],
      dataBasis: ["uploaded_files", "meituan_summary_rows"],
    }));
  }

  if (!uploadCompleteness.hasEkanyaBackflow) {
    recommendations.push(makeRecommendation({
      id: "missing-ekanya-backflow",
      title: "先补 e看牙后端回流数据",
      platform: "数据质量",
      priority: "high",
      problemType: "数据缺失",
      problem: "当前没有 e看牙回流数据，暂时无法判断到院、成交和实收。",
      reason: "只有前端数据看不出客户有没有真的到院和成交。",
      action: "先上传并解析 e看牙后端回流数据，建议人工复核后执行。",
      risk: "缺少后端回流时，ROI 和成交判断都只是参考。",
      immediateAdjustment: "建议先处理",
      steps: ["导出 e看牙客户/就诊/收费数据", "上传到 e看牙后端回流数据入口", "上传后点击解析", "确认来源平台记录是否包含各广告平台"],
      dontDo: "不要只看点击和咨询就判断投放好坏。",
      observeDays: "今天先补数据",
      reviewMetrics: ["来源客户数", "到院数", "成交数", "实收金额"],
      dataBasis: ["uploaded_files", "ekanya_backflow_rows"],
    }));
  }

  if (!uploadCompleteness.hasMeituanKeywords) {
    recommendations.push(makeRecommendation({
      id: "missing-meituan-keywords",
      title: "关键词数据还没接上",
      platform: "美团",
      priority: "medium",
      problemType: "数据缺失",
      problem: "当前没有美团关键词数据，不能判断具体哪些词需要复核。",
      reason: "没有关键词表，只能看账户大盘，不能看到词级别花费和线索。",
      action: "准备调词前，先上传并解析美团关键词数据，建议人工复核后执行。",
      risk: "缺少关键词数据时，不建议直接调词。",
      immediateAdjustment: "建议观察",
      steps: ["从美团后台导出关键词数据", "确认表里包含“关键词”字段", "上传到美团关键词数据入口", "解析后再看高花费关键词"],
      dontDo: "不要用推广汇总表代替关键词表。",
      observeDays: "调词前必须补",
      reviewMetrics: ["关键词花费", "关键词点击", "电话/咨询/订单"],
      dataBasis: ["uploaded_files", "meituan_keyword_rows"],
    }));
  }

  const meituan = platformSummaries.find((platform) => platform.key === "meituan");
  if (meituan) {
    recommendations.push(...buildMeituanRecommendations(meituan, meituanSummary, keywordTop, ekanyaSummary, thresholds));
  }

  platformSummaries
    .filter((platform) => platform.key !== "meituan")
    .forEach((platform) => {
      recommendations.push(...buildAdPlatformRecommendations({ front: platform, ekanya: platform.ekanya }, thresholds));
    });

  if (!uploadCompleteness.hasAnyParsedData) {
    recommendations.push(makeRecommendation({
      id: "no-real-data",
      title: "先把核心数据接上",
      platform: "数据质量",
      priority: "high",
      problemType: "数据不足",
      problem: "当前还没有足够的真实数据生成建议。",
      reason: "没有已解析的平台数据和 e看牙后端回流数据，系统只能给补数据建议。",
      action: "请先上传并解析平台数据和 e看牙后端回流数据，建议人工复核后执行。",
      risk: "没有真实数据时，任何调整都容易误判。",
      immediateAdjustment: "建议先处理",
      steps: ["先传平台汇总数据", "再传 e看牙后端回流数据", "需要调词/素材前再传明细数据", "全部解析后刷新今日总建议"],
      dontDo: "不要在没有真实数据时调整预算、调价或暂停关键词。",
      observeDays: "今天先补数据",
      reviewMetrics: ["上传记录", "解析状态", "row_count"],
      dataBasis: ["uploaded_files"],
    }));
  }

  return recommendations;
}

function buildMeituanRecommendations(
  platform: FrontPlatformSummary & { ekanya: EkanyaSummary },
  meituanSummary: ReturnType<typeof summarizeMeituanSummary>,
  keywordTop: ReturnType<typeof summarizeKeywords>,
  ekanyaSummary: EkanyaSummary,
  thresholds: RecommendationThresholdSettings,
) {
  const recommendations: TodayRecommendation[] = [];

  if (meituanSummary.totalSpend > 0 && ekanyaSummary.leadCount === 0) {
    recommendations.push(makeRecommendation({
      id: "meituan-spend-no-backflow",
      title: "先查美团来源有没有记进 e看牙",
      platform: "美团",
      priority: "high",
      problemType: "后端回流缺失",
      problem: "美团有花费，但 e看牙里没有看到美团来源客户。",
      reason: "可能是 e看牙来源记录不完整，也可能是广告没有带来有效客户。",
      action: "先不要急着否定投放，先检查前台/客服是否正确记录来源，建议人工复核后执行。",
      risk: "当前不是精准归因，不能直接判断真实 ROI。",
      immediateAdjustment: "不建议立即调整",
      steps: ["抽查当天美团电话、咨询和团购订单", "核对 e看牙客户来源是否写了美团/点评", "让前台统一记录来源平台和来源方式", "补齐后再看实收 ROI"],
      dontDo: "不要直接停预算，也不要直接加预算。",
      observeDays: "3天",
      reviewMetrics: ["e看牙美团来源客户数", "到院数", "实收金额"],
      dataBasis: ["meituan_summary_rows", "ekanya_backflow_rows"],
    }));
  }

  if (hasEnoughTrafficSample(meituanSummary.totalClicks, thresholds) && isLowConsultationRate(meituanSummary.consultRate, thresholds)) {
    recommendations.push(makeRecommendation({
      id: "meituan-clicks-low-consult",
      title: "点击有了，但在线咨询偏少",
      platform: "美团",
      priority: "medium",
      problemType: "前端承接偏弱",
      problem: "点击有了，但在线咨询偏少。",
      reason: "可能是关键词意图不准，也可能是美团页面承接不够清楚。",
      action: "优先检查高花费关键词、套餐标题、价格表达和购买须知，建议人工复核后执行。",
      risk: "只看点击不看咨询，容易把无效流量当成好流量。",
      immediateAdjustment: "建议先处理",
      steps: ["看 Top 花费关键词是否太泛", "检查套餐标题是否一眼能看懂", "检查价格和包含项目是否写清楚", "补充购买须知和常见问题"],
      dontDo: "不要只看点击量判断效果好。",
      observeDays: "3-7天",
      reviewMetrics: ["在线咨询点击率", "团购订单量", "e看牙来源客户数"],
      dataBasis: ["meituan_summary_rows", "meituan_keyword_rows"],
    }));
  }

  if (hasEnoughTrafficSample(meituanSummary.totalClicks, thresholds) && isLowPhoneRate(meituanSummary.phoneRate, thresholds)) {
    recommendations.push(makeRecommendation({
      id: "meituan-clicks-low-phone",
      title: "点击后查看电话的人偏少",
      platform: "美团",
      priority: "medium",
      problemType: "到店意向偏弱",
      problem: "点击后查看电话的人偏少。",
      reason: "用户可能只是浏览，没有强到店意向，也可能页面信任感不足。",
      action: "检查门店评分、医生/案例展示、套餐卖点和电话入口是否明显，建议人工复核后执行。",
      risk: "直接加预算可能只是放大无效点击。",
      immediateAdjustment: "建议先处理",
      steps: ["检查电话入口是否明显", "检查医生、案例和服务说明是否够清楚", "检查套餐卖点是否只写低价", "对比点击高但电话少的关键词"],
      dontDo: "不要只加预算。",
      observeDays: "3-7天",
      reviewMetrics: ["查看电话率", "在线咨询点击", "到院数"],
      dataBasis: ["meituan_summary_rows"],
    }));
  }

  if (ekanyaSummary.visitCount > 0 && ekanyaSummary.dealCount === 0) {
    recommendations.push(makeRecommendation({
      id: "ekanya-visits-no-deals",
      title: "有到院但暂时没成交",
      platform: "e看牙",
      priority: "medium",
      problemType: "现场转化待复核",
      problem: "已经有到院，但暂时没有成交。",
      reason: "问题可能不在前端投放，而在现场接诊、方案沟通、价格承接或复诊跟进。",
      action: "复盘到院客户项目、医生方案、咨询沟通和未成交原因，建议人工复核后执行。",
      risk: "不要把现场成交问题都归因到广告。",
      immediateAdjustment: "建议观察",
      steps: ["列出到院未成交客户", "查看意向项目和到院项目是否一致", "复盘医生方案沟通", "记录未成交原因并安排跟进"],
      dontDo: "不要马上否定投放。",
      observeDays: "7-14天",
      reviewMetrics: ["到院转成交率", "未成交原因", "复诊跟进结果"],
      dataBasis: ["ekanya_backflow_rows"],
    }));
  }

  if (ekanyaSummary.paidAmount > 0 && isLowPaidRoi(ekanyaSummary.paidRoi, thresholds)) {
    recommendations.push(makeRecommendation({
      id: "meituan-paid-roi-low",
      title: "有成交和实收，但暂时低于 1:3",
      platform: "美团",
      priority: "medium",
      problemType: "初步 ROI 偏弱",
      problem: "有成交和实收，但暂时低于 1:3。",
      reason: "可能是项目客单价低、观察周期短，或者种植/正畸还没完全成交。",
      action: "拆开看项目结构，低客单项目和高客单项目不要混着判断，建议人工复核后执行。",
      risk: "当前是初步闭环，不是精准归因。",
      immediateAdjustment: "建议观察",
      steps: ["看成交项目是洁牙还是高客单项目", "看是否还有到院未成交客户", "看高客单项目是否还在方案沟通期", "再决定是否小幅调整预算"],
      dontDo: "不要只看当天 ROI。",
      observeDays: "7-30天",
      reviewMetrics: ["实收 ROI", "项目结构", "高客单成交回流"],
      dataBasis: ["meituan_summary_rows", "ekanya_backflow_rows"],
    }));
  }

  if (isHealthyPaidRoi(ekanyaSummary.paidRoi, thresholds)) {
    recommendations.push(makeRecommendation({
      id: "meituan-paid-roi-healthy",
      title: "初步实收 ROI 已达到 1:3 参考线",
      platform: "美团",
      priority: "low",
      problemType: "表现正常",
      problem: "本周期初步实收 ROI 已达到 1:3 参考线。",
      reason: "说明当前周期内已有实收覆盖投放参考线。",
      action: "先保持观察，不要大幅改动，重点看关键词和项目结构，建议人工复核后执行。",
      risk: "短期达标不代表所有项目都稳定，仍需看观察周期。",
      immediateAdjustment: "建议观察",
      steps: ["保留当前有效计划", "看高花费关键词是否健康", "看成交项目结构", "小幅测试，不做大起大落"],
      dontDo: "不要因为短期达标就盲目加大预算。",
      observeDays: "3-7天",
      reviewMetrics: ["实收 ROI", "成交项目", "关键词花费"],
      dataBasis: ["meituan_summary_rows", "ekanya_backflow_rows"],
    }));
  }

  const riskyKeywords = keywordTop.filter((row) => isRiskyKeywordSpend(row.spend, row.clicks, row.actionCount, thresholds)).slice(0, 3);
  if (riskyKeywords.length > 0) {
    recommendations.push(makeRecommendation({
      id: "meituan-high-spend-keywords",
      title: "高花费关键词需要人工复核",
      platform: "美团",
      priority: "high",
      problemType: "关键词消耗异常",
      problem: `有 ${riskyKeywords.length} 个关键词花费较高，但暂时没有电话、咨询或订单。`,
      reason: "可能是词意图偏泛，或者页面承接不匹配。",
      action: "人工复核这些词的搜索意图和匹配方式，再决定是否降价、缩匹配或暂停，建议人工复核后执行。",
      risk: "不要让系统自动暂停关键词。",
      immediateAdjustment: "建议先处理",
      steps: riskyKeywords.map((row) => `复核关键词：${row.keyword}，花费约 ${row.spend.toFixed(2)}，点击 ${row.clicks}`),
      dontDo: "不要让系统自动暂停关键词。",
      observeDays: "3-7天",
      reviewMetrics: ["关键词花费", "查看电话", "在线咨询点击", "订单量"],
      dataBasis: ["meituan_keyword_rows"],
    }));
  }

  if (platform.hasData && recommendations.length === 0) {
    recommendations.push(makeObservationRecommendation(platform, "美团当前有可分析数据，但没有触发强处理规则，建议继续观察，不要大幅调整。"));
  }

  return recommendations;
}

function buildAdPlatformRecommendations({ front, ekanya }: PlatformRecommendationInput, thresholds: RecommendationThresholdSettings) {
  const recommendations: TodayRecommendation[] = [];

  if (!front.hasData) return recommendations;
  const profile = getPlatformRuleProfile(front.key);

  if (front.spend > 0 && front.clicks < Math.max(10, Math.floor(thresholds.minimumClicks / 3))) {
    recommendations.push(makeRecommendation({
      id: `${front.key}-low-clicks`,
      title: `${front.platform}有花费但点击偏少`,
      platform: front.platform,
      priority: "medium",
      problemType: "前端流量不足",
      problem: `${front.platform}本周期有花费，但点击样本偏少。`,
      reason: "样本量还不够，可能是曝光少、出价低、人群窄，也可能是素材吸引力弱。",
      action: "先看曝光、点击率和点击成本，不要急着大幅调预算，建议人工复核后执行。",
      risk: "样本太少时下结论容易误判。",
      immediateAdjustment: "建议观察",
      steps: ["确认该平台是否正常投放", "查看曝光和点击率", "检查素材或页面是否过弱", "再决定是否小范围测试"],
      dontDo: "不要因为几次点击少就直接否定平台。",
      observeDays: "3-7天",
      reviewMetrics: ["曝光", "点击", "点击率", "点击成本"],
      dataBasis: [`${front.key}_front_rows`, "uploaded_files"],
    }));
  }

  if (hasEnoughTrafficSample(front.clicks, thresholds) && front.actionCount === 0) {
    recommendations.push(makeRecommendation({
      id: `${front.key}-clicks-no-actions`,
      title: `${front.platform}点击有了，但线索/动作偏少`,
      platform: front.platform,
      priority: "medium",
      problemType: "前端承接偏弱",
      problem: `${front.platform}有点击，但没有看到表单、私信、电话、导航或其它平台动作。`,
      reason: "可能是素材吸引了泛流量，也可能是落地页、表单或咨询入口承接不足。",
      action: "先检查素材点击质量、落地页承接和线索入口，建议人工复核后执行。",
      risk: "当前只能做前端流量判断，缺少后端成交回流时不能判断真实 ROI。",
      immediateAdjustment: "建议先处理",
      steps: ["查看高点击计划或素材", "检查表单/电话/私信入口是否明显", "检查落地页价格和项目说明", "小范围换素材或优化页面"],
      dontDo: "不要直接加预算。",
      observeDays: "3-7天",
      reviewMetrics: ["点击成本", "表单/私信/电话", "平台线索", "e看牙来源客户"],
      dataBasis: [`${front.key}_parsed_rows`, "uploaded_files"],
    }));
  }

  if (front.spend > 0 && ekanya.leadCount === 0) {
    recommendations.push(makeRecommendation({
      id: `${front.key}-front-no-ekanya`,
      title: `${front.platform}有前端数据，但 e看牙没有对应来源`,
      platform: front.platform,
      priority: "medium",
      problemType: "后端回流缺失",
      problem: `${front.platform}已有前端投放或平台线索，但 e看牙里没有看到对应来源客户。`,
      reason: "可能是 e看牙来源登记不完整，也可能是平台线索还没有进入后端承接。",
      action: "先检查前台/客服是否统一记录来源平台，不要把它当成精准归因结果，建议人工复核后执行。",
      risk: "没有 e看牙回流时，不能判断到院、成交和真实 ROI。",
      immediateAdjustment: "不建议立即调整",
      steps: ["抽查该平台线索记录", "核对 e看牙来源平台是否写对", "统一来源记录口径", "等回流完整后再判断预算动作"],
      dontDo: "不要直接停投，也不要直接加预算。",
      observeDays: "3-7天",
      reviewMetrics: ["平台线索", "e看牙来源客户", "到院数", "实收金额"],
      dataBasis: [`${front.key}_parsed_rows`, "ekanya_backflow_rows"],
    }));
  }

  if (front.onlyFrontTraffic) {
    recommendations.push(makeRecommendation({
      id: `${front.key}-front-only`,
      title: `${front.platform}当前只能做前端流量判断`,
      platform: front.platform,
      priority: "low",
      problemType: "数据口径不完整",
      problem: `${front.platform}已有曝光、点击或消耗数据，但缺少平台线索明细或 e看牙回流。`,
      reason: "只有前端数据时，只能判断流量有没有来，不能判断客户有没有到院和成交。",
      action: "继续观察前端指标，同时补充线索明细和 e看牙来源记录，建议人工复核后执行。",
      risk: "不能用前端点击直接推导成交效果。",
      immediateAdjustment: "建议观察",
      steps: ["确认计划汇总已解析", "补充线索明细数据", "检查 e看牙来源记录", "数据补齐后再看闭环"],
      dontDo: "不要只看点击成本就判断好坏。",
      observeDays: "3-7天",
      reviewMetrics: ["点击成本", "平台线索", "e看牙来源客户"],
      dataBasis: [`${front.key}_plan_rows`],
    }));
  }

  if (front.clicks > 0 && !hasEnoughTrafficSample(front.clicks, thresholds) && recommendations.length === 0) {
    recommendations.push(makeObservationRecommendation(front, profile?.weakDataMessage ?? getSampleTooSmallMessage(front.platform)));
  }

  if (ekanya.visitCount > 0 && ekanya.dealCount === 0) {
    recommendations.push(makeRecommendation({
      id: `${front.key}-visits-no-deals`,
      title: `${front.platform}已有到院，但成交还要继续跟进`,
      platform: front.platform,
      priority: "medium",
      problemType: "后端转化待复核",
      problem: `${front.platform}来源客户已有到院，但暂时没有成交。`,
      reason: "可能是项目周期长，也可能是现场方案、价格承接或复诊跟进还没完成。",
      action: "复盘到院客户项目和未成交原因，不要马上否定前端投放，建议人工复核后执行。",
      risk: "高客单项目短期没成交很常见，不能只看当天。",
      immediateAdjustment: "建议观察",
      steps: ["列出该平台到院未成交客户", "查看项目类型", "复盘医生方案和价格沟通", "安排复诊或跟进"],
      dontDo: "不要自动暂停该平台预算。",
      observeDays: "7-14天",
      reviewMetrics: ["到院数", "成交数", "未成交原因", "复诊结果"],
      dataBasis: ["ekanya_backflow_rows"],
    }));
  }

  if (front.hasData && recommendations.length === 0) {
    recommendations.push(makeObservationRecommendation(front, `${front.platform}当前有可分析数据，但没有触发强处理规则。先继续观察，不要自动调价或自动停投。`));
  }

  return recommendations;
}

function makeObservationRecommendation(front: FrontPlatformSummary, message: string): TodayRecommendation {
  return makeRecommendation({
    id: `${front.key}-observe`,
    title: `${front.platform}先继续观察`,
    platform: front.platform,
    priority: "low",
    problemType: "样本观察",
    problem: message,
    reason: "当前样本没有触发高风险规则，继续看趋势比立刻调整更稳。",
    action: "保持人工观察，等样本更完整后再决定是否调整。",
    risk: "过早调整可能打乱原本正常的数据趋势。",
    immediateAdjustment: "建议观察",
    steps: ["保留当前设置", "继续上传和解析最新数据", "观察点击、线索和 e看牙回流", "样本足够后再复盘"],
    dontDo: "不要频繁大改预算、素材或价格。",
    observeDays: "3-7天",
    reviewMetrics: ["点击", "平台线索/动作", "e看牙来源客户", "到院/成交"],
    dataBasis: ["uploaded_files", `${front.key}_parsed_rows`],
  });
}

function buildDataGaps(platformSummaries: Array<FrontPlatformSummary & { ekanya: EkanyaSummary }>) {
  return platformSummaries
    .filter((platform) => !platform.hasData)
    .map((platform) => ({
      platform: platform.platform,
      message: `${platform.platform}暂无可分析数据。如果该平台近期没有投放，可以忽略；如果正在投放，请先到数据上传页上传并解析。`,
    }));
}

function makeRecommendation(input: Omit<TodayRecommendation, "status">): TodayRecommendation {
  return { ...input, status: "pending" };
}

function groupEkanyaRowsByPlatform(rows: EkanyaBackflowRow[]) {
  const grouped: Record<PlatformKey, EkanyaBackflowRow[]> = {
    meituan: [],
    douyin: [],
    gdt: [],
    amap: [],
  };

  rows.forEach((row) => {
    const platformKey = detectSourcePlatform(row.source_platform);
    if (platformKey) grouped[platformKey].push(row);
  });

  return grouped;
}

function detectSourcePlatform(sourcePlatform: string | null): PlatformKey | null {
  const source = normalizeSource(sourcePlatform);
  if (!source) return null;

  if (["美团", "大众点评", "美团点评", "meituan", "dianping", "点评"].some((name) => source.includes(normalizeSource(name)))) return "meituan";
  if (["抖音", "巨量", "巨量引擎", "douyin", "bytedance", "今日头条", "头条"].some((name) => source.includes(normalizeSource(name)))) return "douyin";
  if (["腾讯", "广点通", "腾讯广点通", "gdt", "微信广告", "朋友圈广告", "腾讯信息流"].some((name) => source.includes(normalizeSource(name)))) return "gdt";
  if (["高德", "高德地图", "amap", "高德推广"].some((name) => source.includes(normalizeSource(name)))) return "amap";

  return null;
}

function normalizeSource(value: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function isPositiveStatus(value: string | null) {
  if (!value) return false;
  const text = value.trim().toLowerCase();
  if (!text || /^(0|false|no|否|无|未|未预约|未到院|未成交|无效)$/.test(text)) return false;
  if (text.includes("未") || text.includes("否") || text.includes("无效")) return false;
  return /^(1|true|yes|是|已|预约|到院|成交|完成)/.test(text) || text.includes("已");
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
