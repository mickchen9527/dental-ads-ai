import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

type DouyinPlanRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  avg_click_cost: NumericValue;
  conversions: NumericValue;
  conversion_cost: NumericValue;
  form_count: NumericValue;
  private_message_count: NumericValue;
  phone_count: NumericValue;
};

type GdtPlanRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  avg_click_cost: NumericValue;
  conversions: NumericValue;
  conversion_cost: NumericValue;
  form_count: NumericValue;
  phone_count: NumericValue;
  consult_count: NumericValue;
};

type AmapSummaryRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  avg_click_cost: NumericValue;
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

type MainMetric = {
  label: string;
  value: number;
};

type PlatformOverview = {
  platform: string;
  key: "meituan" | "douyin" | "gdt" | "amap";
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  clickRate: number | null;
  phoneCount: number;
  consultCount: number;
  orderCount: number;
  leadCount: number;
  appointmentCount: number;
  visitCount: number;
  dealCount: number;
  mainMetrics: MainMetric[];
  statusNote: string;
  hasData: boolean;
};

const meituanSummaryTypes = ["美团推广汇总数据", "meituan-summary"];
const douyinPlanTypes = ["抖音计划汇总数据", "抖音广告计划汇总数据", "douyin-plan-summary", "douyin-ad-plan-summary"];
const douyinLeadTypes = ["抖音表单/私信线索数据", "抖音表单 / 私信线索数据", "douyin-leads"];
const gdtPlanTypes = [
  "腾讯广点通计划汇总数据",
  "腾讯计划汇总数据",
  "广点通计划汇总数据",
  "腾讯账户/计划汇总数据",
  "腾讯广告计划汇总数据",
  "腾讯信息流计划汇总数据",
  "腾讯广点通账户/计划汇总数据",
  "广点通账户/计划汇总数据",
  "gdt-plan-summary",
];
const gdtLeadTypes = [
  "腾讯表单/电话线索数据",
  "腾讯表单 / 电话线索数据",
  "腾讯线索数据",
  "广点通线索数据",
  "腾讯表单线索数据",
  "腾讯电话线索数据",
  "gdt-leads",
];
const amapSummaryTypes = ["高德推广汇总数据", "高德广告汇总数据", "高德投放汇总数据", "amap-summary"];
const amapActionTypes = [
  "高德电话/导航/门店访问数据",
  "高德电话 / 导航 / 门店访问数据",
  "高德行为明细数据",
  "高德门店访问数据",
  "高德电话导航数据",
  "amap-actions",
];
const amapLeadTypes = ["高德线索数据", "高德留资数据", "高德咨询线索数据", "高德客户线索数据", "amap-leads"];

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

  const uploadedResult = await supabase
    .from("uploaded_files")
    .select("id, data_type")
    .eq("is_active", true)
    .in("parse_status", ["parsed"]);

  if (uploadedResult.error) {
    console.error("[api/platform-overview] uploaded_files query failed", {
      code: uploadedResult.error.code,
      message: uploadedResult.error.message,
      details: uploadedResult.error.details,
      hint: uploadedResult.error.hint,
    });

    return NextResponse.json({ message: "读取上传记录失败，请检查 uploaded_files 表权限。" }, { status: 500 });
  }

  const uploadedFiles = (uploadedResult.data ?? []) as UploadedFileRow[];
  const fileIds = {
    meituanSummary: filterFileIds(uploadedFiles, meituanSummaryTypes),
    douyinPlan: filterFileIds(uploadedFiles, douyinPlanTypes),
    douyinLead: filterFileIds(uploadedFiles, douyinLeadTypes),
    gdtPlan: filterFileIds(uploadedFiles, gdtPlanTypes),
    gdtLead: filterFileIds(uploadedFiles, gdtLeadTypes),
    amapSummary: filterFileIds(uploadedFiles, amapSummaryTypes),
    amapAction: filterFileIds(uploadedFiles, amapActionTypes),
    amapLead: filterFileIds(uploadedFiles, amapLeadTypes),
  };

  const [
    meituanSummaryRows,
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
      "spend, impressions, clicks, avg_click_cost, merchant_views, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d",
      fileIds.meituanSummary,
      range.startDate,
      range.endDate,
    ),
    fetchRows<DouyinPlanRow>(
      "douyin_plan_summary_rows",
      "spend, impressions, clicks, avg_click_cost, conversions, conversion_cost, form_count, private_message_count, phone_count",
      fileIds.douyinPlan,
      range.startDate,
      range.endDate,
    ),
    fetchRows<LeadStatusRow>(
      "douyin_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.douyinLead,
      range.startDate,
      range.endDate,
    ),
    fetchRows<GdtPlanRow>(
      "gdt_plan_summary_rows",
      "spend, impressions, clicks, avg_click_cost, conversions, conversion_cost, form_count, phone_count, consult_count",
      fileIds.gdtPlan,
      range.startDate,
      range.endDate,
    ),
    fetchRows<LeadStatusRow>(
      "gdt_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.gdtLead,
      range.startDate,
      range.endDate,
    ),
    fetchRows<AmapSummaryRow>(
      "amap_summary_rows",
      "spend, impressions, clicks, avg_click_cost, phone_clicks, navigation_clicks, store_view_count, address_clicks, coupon_clicks, lead_count",
      fileIds.amapSummary,
      range.startDate,
      range.endDate,
    ),
    fetchRows<AmapActionRow>(
      "amap_action_rows",
      "phone_clicks, navigation_clicks, address_clicks, store_view_count, coupon_clicks",
      fileIds.amapAction,
      range.startDate,
      range.endDate,
    ),
    fetchRows<LeadStatusRow>(
      "amap_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.amapLead,
      range.startDate,
      range.endDate,
    ),
  ]);

  const failedFetch = [
    meituanSummaryRows,
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

  const platforms = [
    summarizeMeituan(meituanSummaryRows.data),
    summarizeDouyin(douyinPlanRows.data, douyinLeadRows.data),
    summarizeGdt(gdtPlanRows.data, gdtLeadRows.data),
    summarizeAmap(amapSummaryRows.data, amapActionRows.data, amapLeadRows.data),
  ];

  const totalSpend = platforms.reduce((total, platform) => total + platform.spend, 0);
  const totalImpressions = platforms.reduce((total, platform) => total + platform.impressions, 0);
  const totalClicks = platforms.reduce((total, platform) => total + platform.clicks, 0);
  const totalLeads = platforms.reduce((total, platform) => total + platform.leadCount, 0);
  const bestSpendPlatform = getTopPlatform(platforms, "spend");
  const mostLeadPlatform = getTopPlatform(platforms, "leadCount");
  const warnings = buildWarnings(platforms);

  return NextResponse.json({
    range,
    summary: {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalLeads,
      avgClickCost: safeDivide(totalSpend, totalClicks),
      bestSpendPlatform,
      mostLeadPlatform,
    },
    platforms,
    warnings,
    emptyStates: {
      hasAnyData: platforms.some((platform) => platform.hasData),
      hasMeituan: meituanSummaryRows.data.length > 0,
      hasDouyin: douyinPlanRows.data.length > 0 || douyinLeadRows.data.length > 0,
      hasGdt: gdtPlanRows.data.length > 0 || gdtLeadRows.data.length > 0,
      hasAmap: amapSummaryRows.data.length > 0 || amapActionRows.data.length > 0 || amapLeadRows.data.length > 0,
    },
  });
}

async function fetchRows<T>(tableName: string, columns: string, uploadedFileIds: string[], startDate: string, endDate: string) {
  if (uploadedFileIds.length === 0) return { data: [] as T[], error: null as string | null };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as T[], error: "Supabase 服务端连接失败。" };

  const result = await supabase
    .from(tableName)
    .select(columns)
    .in("uploaded_file_id", uploadedFileIds)
    .gte("date", startDate)
    .lte("date", endDate)
    .limit(10000);

  if (result.error) {
    console.error(`[api/platform-overview] ${tableName} query failed`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return { data: [] as T[], error: `读取 ${tableName} 失败，请检查表权限和字段。` };
  }

  return { data: (result.data ?? []) as T[], error: null };
}

function summarizeMeituan(rows: MeituanSummaryRow[]): PlatformOverview {
  const spend = sum(rows, "spend");
  const impressions = sum(rows, "impressions");
  const clicks = sum(rows, "clicks");
  const merchantViews = sum(rows, "merchant_views");
  const phoneViews = sum(rows, "phone_views");
  const onlineConsultClicks = sum(rows, "online_consult_clicks");
  const orders = sum(rows, "orders");
  const groupBuyOrders = sum(rows, "group_buy_orders");
  const groupBuyOrders15d = sum(rows, "group_buy_orders_15d");
  const leadCount = phoneViews + onlineConsultClicks + groupBuyOrders;

  return {
    platform: "美团",
    key: "meituan",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    phoneCount: phoneViews,
    consultCount: onlineConsultClicks,
    orderCount: orders + groupBuyOrders,
    leadCount,
    appointmentCount: 0,
    visitCount: 0,
    dealCount: 0,
    mainMetrics: [
      { label: "商户浏览", value: merchantViews },
      { label: "查看电话", value: phoneViews },
      { label: "在线咨询", value: onlineConsultClicks },
      { label: "订单量", value: orders },
      { label: "团购订单", value: groupBuyOrders },
      { label: "15日团购订单", value: groupBuyOrders15d },
    ],
    statusNote: getStatusNote({ hasData: rows.length > 0, spend, clicks, leadCount }),
    hasData: rows.length > 0,
  };
}

function summarizeDouyin(planRows: DouyinPlanRow[], leadRows: LeadStatusRow[]): PlatformOverview {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const privateMessageCount = sum(planRows, "private_message_count");
  const phoneCount = sum(planRows, "phone_count");
  const leadCount = leadRows.length;
  const appointmentCount = countPositive(leadRows, "appointment_status");
  const visitCount = countPositive(leadRows, "visit_status");
  const dealCount = countPositive(leadRows, "deal_status");

  return {
    platform: "抖音",
    key: "douyin",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    phoneCount,
    consultCount: privateMessageCount,
    orderCount: conversions,
    leadCount,
    appointmentCount,
    visitCount,
    dealCount,
    mainMetrics: [
      { label: "表单", value: formCount },
      { label: "私信", value: privateMessageCount },
      { label: "电话", value: phoneCount },
      { label: "平台线索", value: leadCount },
      { label: "转化", value: conversions },
    ],
    statusNote: getStatusNote({ hasData: planRows.length > 0 || leadRows.length > 0, spend, clicks, leadCount }),
    hasData: planRows.length > 0 || leadRows.length > 0,
  };
}

function summarizeGdt(planRows: GdtPlanRow[], leadRows: LeadStatusRow[]): PlatformOverview {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const phoneCount = sum(planRows, "phone_count");
  const consultCount = sum(planRows, "consult_count");
  const leadCount = leadRows.length;
  const appointmentCount = countPositive(leadRows, "appointment_status");
  const visitCount = countPositive(leadRows, "visit_status");
  const dealCount = countPositive(leadRows, "deal_status");

  return {
    platform: "腾讯广点通",
    key: "gdt",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    phoneCount,
    consultCount,
    orderCount: conversions,
    leadCount,
    appointmentCount,
    visitCount,
    dealCount,
    mainMetrics: [
      { label: "表单", value: formCount },
      { label: "电话", value: phoneCount },
      { label: "咨询", value: consultCount },
      { label: "平台线索", value: leadCount },
      { label: "转化", value: conversions },
    ],
    statusNote: getStatusNote({ hasData: planRows.length > 0 || leadRows.length > 0, spend, clicks, leadCount }),
    hasData: planRows.length > 0 || leadRows.length > 0,
  };
}

function summarizeAmap(summaryRows: AmapSummaryRow[], actionRows: AmapActionRow[], leadRows: LeadStatusRow[]): PlatformOverview {
  const spend = sum(summaryRows, "spend");
  const impressions = sum(summaryRows, "impressions");
  const clicks = sum(summaryRows, "clicks");
  const summaryPhoneClicks = sum(summaryRows, "phone_clicks");
  const summaryNavigationClicks = sum(summaryRows, "navigation_clicks");
  const summaryStoreViews = sum(summaryRows, "store_view_count");
  const summaryAddressClicks = sum(summaryRows, "address_clicks");
  const summaryCouponClicks = sum(summaryRows, "coupon_clicks");
  const summaryLeadCount = sum(summaryRows, "lead_count");
  const actionPhoneClicks = sum(actionRows, "phone_clicks");
  const actionNavigationClicks = sum(actionRows, "navigation_clicks");
  const actionAddressClicks = sum(actionRows, "address_clicks");
  const actionStoreViews = sum(actionRows, "store_view_count");
  const actionCouponClicks = sum(actionRows, "coupon_clicks");
  const phoneCount = summaryPhoneClicks + actionPhoneClicks;
  const navigationCount = summaryNavigationClicks + actionNavigationClicks;
  const storeViewCount = summaryStoreViews + actionStoreViews;
  const addressCount = summaryAddressClicks + actionAddressClicks;
  const couponCount = summaryCouponClicks + actionCouponClicks;
  const leadRowsCount = leadRows.length;
  const leadCount = summaryLeadCount + leadRowsCount;
  const appointmentCount = countPositive(leadRows, "appointment_status");
  const visitCount = countPositive(leadRows, "visit_status");
  const dealCount = countPositive(leadRows, "deal_status");

  return {
    platform: "高德",
    key: "amap",
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    clickRate: safeDivide(clicks, impressions),
    phoneCount,
    consultCount: navigationCount + storeViewCount + addressCount,
    orderCount: couponCount,
    leadCount,
    appointmentCount,
    visitCount,
    dealCount,
    mainMetrics: [
      { label: "电话点击", value: phoneCount },
      { label: "导航点击", value: navigationCount },
      { label: "门店浏览", value: storeViewCount },
      { label: "地址查看", value: addressCount },
      { label: "高德线索", value: leadRowsCount },
    ],
    statusNote: getStatusNote({ hasData: summaryRows.length > 0 || actionRows.length > 0 || leadRows.length > 0, spend, clicks, leadCount }),
    hasData: summaryRows.length > 0 || actionRows.length > 0 || leadRows.length > 0,
  };
}

function getStatusNote({ hasData, spend, clicks, leadCount }: { hasData: boolean; spend: number; clicks: number; leadCount: number }) {
  if (!hasData) return "还没有解析该平台数据。";
  if (spend > 0 && clicks < 10) return "有花费但点击偏少，先检查曝光和点击率。";
  if (clicks >= 10 && leadCount === 0) return "点击有了，但平台线索偏少，先看页面承接和线索入口。";
  if (leadCount > 0) return "已有平台线索，下一步要看 e看牙回流是否到院成交。";
  return "已有前端数据，先继续观察平台动作和线索入口。";
}

function buildWarnings(platforms: PlatformOverview[]) {
  const warnings: string[] = [];
  if (!platforms.some((platform) => platform.hasData)) {
    warnings.push("还没有可用的平台解析数据，请先到数据上传页上传并解析各平台数据。");
  }

  platforms
    .filter((platform) => !platform.hasData)
    .forEach((platform) => warnings.push(`${platform.platform}还没有解析数据。`));

  return warnings;
}

function getTopPlatform(platforms: PlatformOverview[], key: "spend" | "leadCount") {
  const sorted = [...platforms].sort((first, second) => second[key] - first[key]);
  return sorted[0]?.[key] > 0 ? sorted[0].platform : "暂无";
}

function countPositive<T extends Record<string, string | null>>(rows: T[], key: keyof T) {
  return rows.filter((row) => isPositiveStatus(row[key])).length;
}

function isPositiveStatus(value: string | null) {
  if (!value) return false;
  const text = value.trim().toLowerCase();
  if (!text || /^(0|false|no|否|无|未|未预约|未到院|未成交|无效)$/.test(text)) return false;
  if (text.includes("未") || text.includes("否") || text.includes("无效")) return false;
  return /^(1|true|yes|是|已|预约|到院|成交|完成)/.test(text) || text.includes("已");
}

function filterFileIds(files: UploadedFileRow[], dataTypes: string[]) {
  return files.filter((file) => dataTypes.includes(file.data_type ?? "")).map((file) => file.id);
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
