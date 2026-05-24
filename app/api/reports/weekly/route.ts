import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type NumericValue = number | string | null | undefined;
type PlatformKey = "meituan" | "douyin" | "gdt" | "amap";

type UploadedFileRow = {
  id: string;
  data_type: string | null;
};

type MeituanSummaryRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
  phone_views: NumericValue;
  online_consult_clicks: NumericValue;
  orders: NumericValue;
  group_buy_orders: NumericValue;
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

type DouyinCreativeRow = DouyinPlanRow & {
  creative_name: string | null;
  material_name: string | null;
  video_name: string | null;
  avg_click_cost: NumericValue;
  conversion_cost: NumericValue;
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

type GdtCreativeRow = GdtPlanRow & {
  ad_group_name: string | null;
  creative_name: string | null;
  material_name: string | null;
  avg_click_cost: NumericValue;
  conversion_cost: NumericValue;
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
};

type AmapActionRow = {
  phone_clicks: NumericValue;
  navigation_clicks: NumericValue;
  address_clicks: NumericValue;
  store_view_count: NumericValue;
  coupon_clicks: NumericValue;
};

type LeadRow = {
  appointment_status: string | null;
  visit_status: string | null;
  deal_status: string | null;
};

type EkanyaBackflowRow = LeadRow & {
  source_platform: string | null;
  source_date: string | null;
  visit_date: string | null;
  deal_date: string | null;
  intention_project: string | null;
  visit_project: string | null;
  deal_project: string | null;
  paid_amount: NumericValue;
};

type PlatformSummary = {
  platform: string;
  key: PlatformKey;
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  clickRate: number | null;
  platformLeadOrActionCount: number;
  ekanyaLeadCount: number;
  visitCount: number;
  dealCount: number;
  paidAmount: number;
  paidRoi: number | null;
  statusNote: string;
};

type FrontSummary = {
  spend: number;
  impressions: number;
  clicks: number;
  actionCount: number;
};

const supportedDateTypes = new Set(["source_date", "visit_date", "deal_date"]);

const dataTypes = {
  meituanSummary: ["美团推广汇总数据", "meituan-summary"],
  meituanKeywords: ["美团关键词数据", "meituan-keywords"],
  douyinPlan: ["抖音计划汇总数据", "抖音广告计划汇总数据", "douyin-plan-summary", "douyin-ad-plan-summary"],
  douyinCreatives: ["抖音素材/创意数据", "抖音素材 / 创意数据", "douyin-creatives"],
  douyinLeads: ["抖音表单/私信线索数据", "抖音表单 / 私信线索数据", "douyin-leads"],
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
  gdtCreatives: [
    "腾讯广告组/创意数据",
    "腾讯广告组 / 创意数据",
    "腾讯广告组数据",
    "腾讯创意数据",
    "广点通广告组/创意数据",
    "广点通广告组 / 创意数据",
    "gdt-creatives",
  ],
  gdtLeads: ["腾讯表单/电话线索数据", "腾讯表单 / 电话线索数据", "腾讯线索数据", "广点通线索数据", "腾讯表单线索数据", "腾讯电话线索数据", "gdt-leads"],
  amapSummary: ["高德推广汇总数据", "高德广告汇总数据", "高德投放汇总数据", "amap-summary"],
  amapActions: ["高德电话/导航/门店访问数据", "高德电话 / 导航 / 门店访问数据", "高德行为明细数据", "高德门店访问数据", "高德电话导航数据", "amap-actions"],
  amapLeads: ["高德线索数据", "高德留资数据", "高德咨询线索数据", "高德客户线索数据", "amap-leads"],
  ekanyaBackflow: ["e看牙后端回流数据", "ekanya-backflow"],
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
  const fileIds = {
    meituanSummary: filterFileIds(uploadedFiles, dataTypes.meituanSummary),
    meituanKeywords: filterFileIds(uploadedFiles, dataTypes.meituanKeywords),
    douyinPlan: filterFileIds(uploadedFiles, dataTypes.douyinPlan),
    douyinCreatives: filterFileIds(uploadedFiles, dataTypes.douyinCreatives),
    douyinLeads: filterFileIds(uploadedFiles, dataTypes.douyinLeads),
    gdtPlan: filterFileIds(uploadedFiles, dataTypes.gdtPlan),
    gdtCreatives: filterFileIds(uploadedFiles, dataTypes.gdtCreatives),
    gdtLeads: filterFileIds(uploadedFiles, dataTypes.gdtLeads),
    amapSummary: filterFileIds(uploadedFiles, dataTypes.amapSummary),
    amapActions: filterFileIds(uploadedFiles, dataTypes.amapActions),
    amapLeads: filterFileIds(uploadedFiles, dataTypes.amapLeads),
    ekanyaBackflow: filterFileIds(uploadedFiles, dataTypes.ekanyaBackflow),
  };

  const [
    meituanSummaryRows,
    meituanKeywordRows,
    douyinPlanRows,
    douyinCreativeRows,
    douyinLeadRows,
    gdtPlanRows,
    gdtCreativeRows,
    gdtLeadRows,
    amapSummaryRows,
    amapActionRows,
    amapLeadRows,
    ekanyaRows,
  ] = await Promise.all([
    fetchRows<MeituanSummaryRow>("meituan_summary_rows", "spend, impressions, clicks, phone_views, online_consult_clicks, orders, group_buy_orders", fileIds.meituanSummary, "date", range.startDate, range.endDate),
    fetchRows<MeituanKeywordRow>("meituan_keyword_rows", "keyword, spend, impressions, clicks, phone_views, online_consult_clicks, orders, group_buy_orders", fileIds.meituanKeywords, "date", range.startDate, range.endDate),
    fetchRows<DouyinPlanRow>("douyin_plan_summary_rows", "spend, impressions, clicks, conversions, form_count, private_message_count, phone_count", fileIds.douyinPlan, "date", range.startDate, range.endDate),
    fetchRows<DouyinCreativeRow>("douyin_creative_rows", "creative_name, material_name, video_name, spend, impressions, clicks, avg_click_cost, conversions, conversion_cost, form_count, private_message_count, phone_count", fileIds.douyinCreatives, "date", range.startDate, range.endDate),
    fetchRows<LeadRow>("douyin_lead_rows", "appointment_status, visit_status, deal_status", fileIds.douyinLeads, "date", range.startDate, range.endDate),
    fetchRows<GdtPlanRow>("gdt_plan_summary_rows", "spend, impressions, clicks, conversions, form_count, phone_count, consult_count", fileIds.gdtPlan, "date", range.startDate, range.endDate),
    fetchRows<GdtCreativeRow>("gdt_creative_rows", "ad_group_name, creative_name, material_name, spend, impressions, clicks, avg_click_cost, conversions, conversion_cost, form_count, phone_count, consult_count", fileIds.gdtCreatives, "date", range.startDate, range.endDate),
    fetchRows<LeadRow>("gdt_lead_rows", "appointment_status, visit_status, deal_status", fileIds.gdtLeads, "date", range.startDate, range.endDate),
    fetchRows<AmapSummaryRow>("amap_summary_rows", "spend, impressions, clicks, phone_clicks, navigation_clicks, store_view_count, address_clicks, coupon_clicks", fileIds.amapSummary, "date", range.startDate, range.endDate),
    fetchRows<AmapActionRow>("amap_action_rows", "phone_clicks, navigation_clicks, address_clicks, store_view_count, coupon_clicks", fileIds.amapActions, "date", range.startDate, range.endDate),
    fetchRows<LeadRow>("amap_lead_rows", "appointment_status, visit_status, deal_status", fileIds.amapLeads, "date", range.startDate, range.endDate),
    fetchRows<EkanyaBackflowRow>("ekanya_backflow_rows", "source_platform, source_date, visit_date, deal_date, intention_project, visit_project, deal_project, appointment_status, visit_status, deal_status, paid_amount", fileIds.ekanyaBackflow, dateType, range.startDate, range.endDate),
  ]);

  const failedFetch = [
    meituanSummaryRows,
    meituanKeywordRows,
    douyinPlanRows,
    douyinCreativeRows,
    douyinLeadRows,
    gdtPlanRows,
    gdtCreativeRows,
    gdtLeadRows,
    amapSummaryRows,
    amapActionRows,
    amapLeadRows,
    ekanyaRows,
  ].find((result) => result.error);

  if (failedFetch?.error) {
    return NextResponse.json({ message: failedFetch.error }, { status: 500 });
  }

  const frontByPlatform = {
    meituan: summarizeMeituanFront(meituanSummaryRows.data),
    douyin: summarizeDouyinFront(douyinPlanRows.data, douyinLeadRows.data),
    gdt: summarizeGdtFront(gdtPlanRows.data, gdtLeadRows.data),
    amap: summarizeAmapFront(amapSummaryRows.data, amapActionRows.data, amapLeadRows.data),
  };
  const ekanyaByPlatform = groupEkanyaRowsByPlatform(ekanyaRows.data);
  const platformSummary = buildPlatformSummary(frontByPlatform, ekanyaByPlatform);
  const totalSpend = platformSummary.reduce((total, platform) => total + platform.spend, 0);
  const totalImpressions = platformSummary.reduce((total, platform) => total + platform.impressions, 0);
  const totalClicks = platformSummary.reduce((total, platform) => total + platform.clicks, 0);
  const totalPlatformActions = platformSummary.reduce((total, platform) => total + platform.platformLeadOrActionCount, 0);
  const closedLoopSummary = summarizeEkanya(ekanyaRows.data, totalSpend);
  const projectSummary = summarizeProjects(ekanyaRows.data);
  const keywordAndCreativeHighlights = {
    meituanKeywordsTop10: summarizeMeituanKeywords(meituanKeywordRows.data),
    douyinCreativesTop10: summarizeDouyinCreatives(douyinCreativeRows.data),
    gdtCreativesTop10: summarizeGdtCreatives(gdtCreativeRows.data),
  };
  const frontDataSummary = {
    totalSpend,
    totalImpressions,
    totalClicks,
    avgClickCost: safeDivide(totalSpend, totalClicks),
    totalPlatformLeadOrActionCount: totalPlatformActions,
    highestSpendPlatform: getTopPlatform(platformSummary, (platform) => platform.spend),
    mostClickPlatform: getTopPlatform(platformSummary, (platform) => platform.clicks),
    mostActionPlatform: getTopPlatform(platformSummary, (platform) => platform.platformLeadOrActionCount),
  };
  const reminders = buildReminders(platformSummary, closedLoopSummary, projectSummary, {
    hasEkanya: ekanyaRows.data.length > 0,
    hasMeituan: meituanSummaryRows.data.length > 0,
    hasDouyin: douyinPlanRows.data.length > 0 || douyinLeadRows.data.length > 0,
    hasGdt: gdtPlanRows.data.length > 0 || gdtLeadRows.data.length > 0,
    hasAmap: amapSummaryRows.data.length > 0 || amapActionRows.data.length > 0 || amapLeadRows.data.length > 0,
  });
  const executiveSummary = buildExecutiveSummary(frontDataSummary, closedLoopSummary, reminders);

  return NextResponse.json({
    range: {
      startDate: range.startDate,
      endDate: range.endDate,
      dateType,
    },
    executiveSummary,
    platformSummary,
    frontDataSummary,
    closedLoopSummary,
    projectSummary,
    keywordAndCreativeHighlights,
    reminders,
    emptyStates: {
      hasAnyData: platformSummary.some((platform) => platform.spend > 0 || platform.platformLeadOrActionCount > 0) || ekanyaRows.data.length > 0,
      hasEkanyaBackflow: ekanyaRows.data.length > 0,
    },
  });
}

async function fetchRows<T>(tableName: string, columns: string, uploadedFileIds: string[], dateColumn: string, startDate: string, endDate: string) {
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
    console.error(`[api/reports/weekly] ${tableName} query failed`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return { data: [] as T[], error: `读取 ${tableName} 失败，请检查表权限和字段。` };
  }

  return { data: (result.data ?? []) as T[], error: null };
}

function summarizeMeituanFront(rows: MeituanSummaryRow[]) {
  const spend = sum(rows, "spend");
  const impressions = sum(rows, "impressions");
  const clicks = sum(rows, "clicks");
  const phoneViews = sum(rows, "phone_views");
  const onlineConsultClicks = sum(rows, "online_consult_clicks");
  const orders = sum(rows, "orders");
  const groupBuyOrders = sum(rows, "group_buy_orders");
  const actionCount = phoneViews + onlineConsultClicks + orders + groupBuyOrders;

  return { spend, impressions, clicks, actionCount, mainActions: { phoneViews, onlineConsultClicks, orders, groupBuyOrders } };
}

function summarizeDouyinFront(planRows: DouyinPlanRow[], leadRows: LeadRow[]) {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const privateMessageCount = sum(planRows, "private_message_count");
  const phoneCount = sum(planRows, "phone_count");
  const platformLeadCount = leadRows.length;
  const actionCount = formCount + privateMessageCount + phoneCount + platformLeadCount;

  return { spend, impressions, clicks, actionCount, mainActions: { conversions, formCount, privateMessageCount, phoneCount, platformLeadCount } };
}

function summarizeGdtFront(planRows: GdtPlanRow[], leadRows: LeadRow[]) {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const phoneCount = sum(planRows, "phone_count");
  const consultCount = sum(planRows, "consult_count");
  const platformLeadCount = leadRows.length;
  const actionCount = formCount + phoneCount + consultCount + platformLeadCount;

  return { spend, impressions, clicks, actionCount, mainActions: { conversions, formCount, phoneCount, consultCount, platformLeadCount } };
}

function summarizeAmapFront(summaryRows: AmapSummaryRow[], actionRows: AmapActionRow[], leadRows: LeadRow[]) {
  const spend = sum(summaryRows, "spend");
  const impressions = sum(summaryRows, "impressions");
  const clicks = sum(summaryRows, "clicks");
  const phoneClicks = sum(summaryRows, "phone_clicks") + sum(actionRows, "phone_clicks");
  const navigationClicks = sum(summaryRows, "navigation_clicks") + sum(actionRows, "navigation_clicks");
  const storeViewCount = sum(summaryRows, "store_view_count") + sum(actionRows, "store_view_count");
  const addressClicks = sum(summaryRows, "address_clicks") + sum(actionRows, "address_clicks");
  const couponClicks = sum(summaryRows, "coupon_clicks") + sum(actionRows, "coupon_clicks");
  const platformLeadCount = leadRows.length;
  const actionCount = phoneClicks + navigationClicks + storeViewCount + addressClicks + couponClicks + platformLeadCount;

  return { spend, impressions, clicks, actionCount, mainActions: { phoneClicks, navigationClicks, storeViewCount, addressClicks, couponClicks, platformLeadCount } };
}

function buildPlatformSummary(frontByPlatform: Record<PlatformKey, FrontSummary>, ekanyaByPlatform: Record<PlatformKey, EkanyaBackflowRow[]>): PlatformSummary[] {
  const platforms: Array<{ key: PlatformKey; platform: string }> = [
    { key: "meituan", platform: "美团" },
    { key: "douyin", platform: "抖音" },
    { key: "gdt", platform: "腾讯广点通" },
    { key: "amap", platform: "高德" },
  ];

  return platforms.map(({ key, platform }) => {
    const front = frontByPlatform[key];
    const ekanya = summarizeEkanya(ekanyaByPlatform[key] ?? [], front.spend);

    return {
      platform,
      key,
      spend: front.spend,
      impressions: front.impressions,
      clicks: front.clicks,
      avgClickCost: safeDivide(front.spend, front.clicks),
      clickRate: safeDivide(front.clicks, front.impressions),
      platformLeadOrActionCount: front.actionCount,
      ekanyaLeadCount: ekanya.leadCount,
      visitCount: ekanya.visitCount,
      dealCount: ekanya.dealCount,
      paidAmount: ekanya.paidAmount,
      paidRoi: ekanya.paidRoi,
      statusNote: getPlatformStatusNote(platform, front.spend, front.actionCount, ekanya),
    };
  });
}

function summarizeEkanya(rows: EkanyaBackflowRow[], spend: number) {
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
    paidRoi: safeDivide(paidAmount, spend),
    visitRate: safeDivide(visitCount, appointmentCount || leadCount),
    dealRate: safeDivide(dealCount, visitCount),
  };
}

function groupEkanyaRowsByPlatform(rows: EkanyaBackflowRow[]) {
  const grouped: Record<PlatformKey, EkanyaBackflowRow[]> = { meituan: [], douyin: [], gdt: [], amap: [] };

  rows.forEach((row) => {
    const platformKey = detectSourcePlatform(row.source_platform);
    if (platformKey) grouped[platformKey].push(row);
  });

  return grouped;
}

function detectSourcePlatform(sourcePlatform: string | null): PlatformKey | null {
  const source = normalizeSource(sourcePlatform);
  if (!source) return null;

  if (["美团", "大众点评", "美团点评", "点评", "meituan", "dianping"].some((name) => source.includes(normalizeSource(name)))) return "meituan";
  if (["抖音", "巨量", "巨量引擎", "今日头条", "头条", "douyin", "bytedance"].some((name) => source.includes(normalizeSource(name)))) return "douyin";
  if (["腾讯", "广点通", "腾讯广点通", "腾讯信息流", "微信广告", "朋友圈广告", "gdt"].some((name) => source.includes(normalizeSource(name)))) return "gdt";
  if (["高德", "高德地图", "高德推广", "amap"].some((name) => source.includes(normalizeSource(name)))) return "amap";

  return null;
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
      const appointmentCount = projectRows.filter((row) => isPositiveStatus(row.appointment_status)).length;
      const visitCount = projectRows.filter((row) => isPositiveStatus(row.visit_status) || Boolean(row.visit_date)).length;
      const dealCount = projectRows.filter((row) => isPositiveStatus(row.deal_status) || Boolean(row.deal_date) || toNumber(row.paid_amount) > 0).length;
      const paidAmount = projectRows.reduce((total, row) => total + toNumber(row.paid_amount), 0);

      return {
        projectName,
        leadCount,
        appointmentCount,
        visitCount,
        dealCount,
        paidAmount,
        avgPaidAmount: safeDivide(paidAmount, dealCount),
        mainSourcePlatform: getMainSourcePlatform(projectRows),
        observationNote: getProjectObservationNote(projectName, leadCount, visitCount, dealCount, paidAmount),
      };
    })
    .sort((first, second) => second.paidAmount - first.paidAmount || second.leadCount - first.leadCount || first.projectName.localeCompare(second.projectName, "zh-CN"));
}

function summarizeMeituanKeywords(rows: MeituanKeywordRow[]) {
  return groupByName(rows, (row) => row.keyword?.trim() || "未命名关键词", (groupName, groupRows) => {
    const spend = sum(groupRows, "spend");
    const clicks = sum(groupRows, "clicks");
    const actionCount = sum(groupRows, "phone_views") + sum(groupRows, "online_consult_clicks") + sum(groupRows, "orders") + sum(groupRows, "group_buy_orders");

    return {
      name: groupName,
      type: "美团关键词",
      spend,
      impressions: sum(groupRows, "impressions"),
      clicks,
      avgClickCost: safeDivide(spend, clicks),
      conversions: sum(groupRows, "orders") + sum(groupRows, "group_buy_orders"),
      formOrPhoneCount: sum(groupRows, "phone_views") + sum(groupRows, "online_consult_clicks"),
      consultCount: sum(groupRows, "online_consult_clicks"),
      ruleNote: getHighlightNote(spend, clicks, actionCount),
    };
  });
}

function summarizeDouyinCreatives(rows: DouyinCreativeRow[]) {
  return groupByName(rows, (row) => row.creative_name?.trim() || row.material_name?.trim() || row.video_name?.trim() || "未命名抖音素材", (groupName, groupRows) => {
    const spend = sum(groupRows, "spend");
    const clicks = sum(groupRows, "clicks");
    const actionCount = sum(groupRows, "conversions") + sum(groupRows, "form_count") + sum(groupRows, "private_message_count") + sum(groupRows, "phone_count");

    return {
      name: groupName,
      type: "抖音素材/创意",
      spend,
      impressions: sum(groupRows, "impressions"),
      clicks,
      avgClickCost: safeDivide(spend, clicks),
      conversions: sum(groupRows, "conversions"),
      formOrPhoneCount: sum(groupRows, "form_count") + sum(groupRows, "phone_count"),
      consultCount: sum(groupRows, "private_message_count"),
      ruleNote: getHighlightNote(spend, clicks, actionCount),
    };
  });
}

function summarizeGdtCreatives(rows: GdtCreativeRow[]) {
  return groupByName(rows, (row) => row.creative_name?.trim() || row.material_name?.trim() || row.ad_group_name?.trim() || "未命名腾讯创意", (groupName, groupRows) => {
    const spend = sum(groupRows, "spend");
    const clicks = sum(groupRows, "clicks");
    const actionCount = sum(groupRows, "conversions") + sum(groupRows, "form_count") + sum(groupRows, "phone_count") + sum(groupRows, "consult_count");

    return {
      name: groupName,
      type: "腾讯广告组/创意",
      spend,
      impressions: sum(groupRows, "impressions"),
      clicks,
      avgClickCost: safeDivide(spend, clicks),
      conversions: sum(groupRows, "conversions"),
      formOrPhoneCount: sum(groupRows, "form_count") + sum(groupRows, "phone_count"),
      consultCount: sum(groupRows, "consult_count"),
      ruleNote: getHighlightNote(spend, clicks, actionCount),
    };
  });
}

function groupByName<T>(rows: T[], getName: (row: T) => string, buildRow: (name: string, rows: T[]) => Record<string, string | number | null>) {
  const grouped = new Map<string, T[]>();
  rows.forEach((row) => {
    const name = getName(row);
    grouped.set(name, [...(grouped.get(name) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([name, groupRows]) => buildRow(name, groupRows))
    .sort((first, second) => toNumber(second.spend) - toNumber(first.spend))
    .slice(0, 10);
}

function buildExecutiveSummary(
  frontDataSummary: { totalSpend: number; highestSpendPlatform: string; mostActionPlatform: string },
  closedLoopSummary: ReturnType<typeof summarizeEkanya>,
  reminders: string[],
) {
  const summary = [
    `本周期总花费 ${formatPlainCurrency(frontDataSummary.totalSpend)}，花费最高平台是 ${frontDataSummary.highestSpendPlatform}。`,
    `平台线索/动作最多的是 ${frontDataSummary.mostActionPlatform}。`,
    `e看牙来源客户 ${closedLoopSummary.leadCount} 个，到院 ${closedLoopSummary.visitCount} 个，成交 ${closedLoopSummary.dealCount} 个，实收 ${formatPlainCurrency(closedLoopSummary.paidAmount)}。`,
    `初步实收 ROI 为 ${closedLoopSummary.paidRoi === null ? "暂无" : closedLoopSummary.paidRoi.toFixed(1)}，这只是时间范围和来源平台的初步参考。`,
  ];

  return [...summary, ...reminders.slice(0, 3)];
}

function buildReminders(
  platforms: PlatformSummary[],
  closedLoopSummary: ReturnType<typeof summarizeEkanya>,
  projectRows: Array<{ projectName: string; dealCount: number }>,
  dataState: { hasEkanya: boolean; hasMeituan: boolean; hasDouyin: boolean; hasGdt: boolean; hasAmap: boolean },
) {
  const reminders: string[] = [];

  if (!dataState.hasEkanya) reminders.push("还没有解析 e看牙后端回流数据，无法判断最终到院和实收。");
  platforms
    .filter((platform) => platform.spend > 0 && platform.ekanyaLeadCount === 0)
    .forEach((platform) => reminders.push(`${platform.platform}有花费但 e看牙来源为 0，先检查来源登记是否完整。`));
  if (closedLoopSummary.paidRoi !== null && closedLoopSummary.paidRoi < 3) reminders.push("初步 ROI 低于 1:3，先看项目结构和成交周期，不要直接下结论。");
  if (projectRows.some((row) => ["种植", "正畸", "半口/全口"].includes(row.projectName) && row.dealCount === 0)) reminders.push("高客单项目短期没成交，不要只看几天，要看 7-30 天甚至更久。");
  if (!dataState.hasMeituan) reminders.push("美团还没有解析数据，周报里美团表现不完整。");
  if (!dataState.hasDouyin) reminders.push("抖音还没有解析数据，周报里抖音表现不完整。");
  if (!dataState.hasGdt) reminders.push("腾讯广点通还没有解析数据，周报里腾讯表现不完整。");
  if (!dataState.hasAmap) reminders.push("高德还没有解析数据，周报里高德表现不完整。");

  return reminders.length > 0 ? reminders : ["本周期数据已形成多平台周报草稿，开会时仍需要人工确认数据口径和执行动作。"];
}

function getPlatformStatusNote(platform: string, spend: number, actionCount: number, ekanya: ReturnType<typeof summarizeEkanya>) {
  if (spend > 0 && ekanya.leadCount === 0) return "有花费但 e看牙没有对应来源客户，先检查来源登记。";
  if (ekanya.leadCount > 0 && ekanya.visitCount === 0) return "已有来源客户但到院少，先看客服邀约和到店路径。";
  if (ekanya.visitCount > 0 && ekanya.dealCount === 0) return "到院有了但成交少，重点看现场转化和复诊跟进。";
  if (ekanya.paidAmount > 0 && ekanya.paidRoi !== null && ekanya.paidRoi >= 3) return "初步 ROI 达到 1:3 参考线，但仍需结合项目周期判断。";
  if (ekanya.paidAmount > 0) return "已产生实收，继续观察项目结构和投放稳定性。";
  if (actionCount > 0) return "已有平台动作，下一步看 e看牙回流是否完整。";
  return `${platform}数据不足，先补上传和解析。`;
}

function getHighlightNote(spend: number, clicks: number, actionCount: number) {
  if (spend >= 300 && actionCount === 0) return "花费高但没有线索/动作，建议人工复核。";
  if (actionCount > 0) return "有线索/转化，继续观察。";
  if (clicks < 10) return "样本太少，先不要下结论。";
  return "继续观察，不要自动调整。";
}

function getProjectObservationNote(projectName: string, leadCount: number, visitCount: number, dealCount: number, paidAmount: number) {
  if (leadCount < 3) return "样本太少，先不要下结论。";
  if (paidAmount > 0) return "已经产生实收，继续观察来源质量。";
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

function filterFileIds(files: UploadedFileRow[], targetTypes: string[]) {
  return files.filter((file) => targetTypes.includes(file.data_type ?? "")).map((file) => file.id);
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

function getTopPlatform(platforms: PlatformSummary[], getValue: (platform: PlatformSummary) => number) {
  const sorted = [...platforms].sort((first, second) => getValue(second) - getValue(first));
  return getValue(sorted[0]) > 0 ? sorted[0].platform : "暂无";
}

function formatPlainCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
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
