import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type NumericValue = number | string | null | undefined;
type PlatformKey = "meituan" | "douyin" | "gdt" | "amap";

type UploadedFileRow = {
  id: string;
  data_type: string | null;
};

type MainAction = {
  label: string;
  value: number;
};

type MeituanSummaryRow = {
  spend: NumericValue;
  impressions: NumericValue;
  clicks: NumericValue;
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

type FrontSummary = {
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  platformLeadCount: number;
  mainActions: MainAction[];
  hasData: boolean;
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

const supportedDateTypes = new Set(["source_date", "visit_date", "deal_date"]);

const dataTypes = {
  meituanSummary: ["美团推广汇总数据", "meituan-summary"],
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
    console.error("[api/closed-loop/platforms] uploaded_files query failed", {
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
    douyinPlan: filterFileIds(uploadedFiles, dataTypes.douyinPlan),
    douyinLead: filterFileIds(uploadedFiles, dataTypes.douyinLead),
    gdtPlan: filterFileIds(uploadedFiles, dataTypes.gdtPlan),
    gdtLead: filterFileIds(uploadedFiles, dataTypes.gdtLead),
    amapSummary: filterFileIds(uploadedFiles, dataTypes.amapSummary),
    amapAction: filterFileIds(uploadedFiles, dataTypes.amapAction),
    amapLead: filterFileIds(uploadedFiles, dataTypes.amapLead),
    ekanyaBackflow: filterFileIds(uploadedFiles, dataTypes.ekanyaBackflow),
  };

  const [
    meituanRows,
    douyinPlanRows,
    douyinLeadRows,
    gdtPlanRows,
    gdtLeadRows,
    amapSummaryRows,
    amapActionRows,
    amapLeadRows,
    ekanyaRows,
  ] = await Promise.all([
    fetchRows<MeituanSummaryRow>(
      "meituan_summary_rows",
      "spend, impressions, clicks, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d",
      fileIds.meituanSummary,
      "date",
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
    fetchRows<LeadRow>(
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
    fetchRows<LeadRow>(
      "gdt_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.gdtLead,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<AmapSummaryRow>(
      "amap_summary_rows",
      "spend, impressions, clicks, phone_clicks, navigation_clicks, store_view_count, address_clicks, coupon_clicks",
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
    fetchRows<LeadRow>(
      "amap_lead_rows",
      "appointment_status, visit_status, deal_status",
      fileIds.amapLead,
      "date",
      range.startDate,
      range.endDate,
    ),
    fetchRows<EkanyaBackflowRow>(
      "ekanya_backflow_rows",
      "source_platform, source_date, visit_date, deal_date, intention_project, visit_project, deal_project, appointment_status, visit_status, deal_status, paid_amount",
      fileIds.ekanyaBackflow,
      dateType,
      range.startDate,
      range.endDate,
    ),
  ]);

  const failedFetch = [
    meituanRows,
    douyinPlanRows,
    douyinLeadRows,
    gdtPlanRows,
    gdtLeadRows,
    amapSummaryRows,
    amapActionRows,
    amapLeadRows,
    ekanyaRows,
  ].find((result) => result.error);

  if (failedFetch?.error) {
    return NextResponse.json({ message: failedFetch.error }, { status: 500 });
  }

  const frontByPlatform: Record<PlatformKey, FrontSummary> = {
    meituan: summarizeMeituanFront(meituanRows.data),
    douyin: summarizeDouyinFront(douyinPlanRows.data, douyinLeadRows.data),
    gdt: summarizeGdtFront(gdtPlanRows.data, gdtLeadRows.data),
    amap: summarizeAmapFront(amapSummaryRows.data, amapActionRows.data, amapLeadRows.data),
  };

  const ekanyaByPlatform = groupEkanyaRowsByPlatform(ekanyaRows.data);
  const platforms = buildPlatformRows(frontByPlatform, ekanyaByPlatform);
  const projects = summarizeProjects(ekanyaRows.data);
  const totalSpend = platforms.reduce((total, platform) => total + platform.front.spend, 0);
  const totalPlatformLeads = platforms.reduce((total, platform) => total + platform.front.platformLeadCount, 0);
  const totalEkanyaLeads = platforms.reduce((total, platform) => total + platform.ekanya.leadCount, 0);
  const totalVisits = platforms.reduce((total, platform) => total + platform.ekanya.visitCount, 0);
  const totalDeals = platforms.reduce((total, platform) => total + platform.ekanya.dealCount, 0);
  const totalPaidAmount = platforms.reduce((total, platform) => total + platform.ekanya.paidAmount, 0);

  return NextResponse.json({
    range: {
      startDate: range.startDate,
      endDate: range.endDate,
      dateType,
    },
    summary: {
      totalSpend,
      totalPlatformLeads,
      totalEkanyaLeads,
      totalVisits,
      totalDeals,
      totalPaidAmount,
      overallPaidRoi: safeDivide(totalPaidAmount, totalSpend),
      bestRoiPlatform: getBestRoiPlatform(platforms),
      highestSpendPlatform: getTopPlatform(platforms, (platform) => platform.front.spend),
      mostVisitPlatform: getTopPlatform(platforms, (platform) => platform.ekanya.visitCount),
    },
    platforms,
    projects,
    warnings: buildWarnings(platforms, ekanyaRows.data.length),
    emptyStates: {
      hasAnyFrontData: platforms.some((platform) => platform.front.hasData),
      hasEkanyaBackflow: ekanyaRows.data.length > 0,
      hasAnyClosedLoopData: platforms.some((platform) => platform.front.hasData || platform.ekanya.leadCount > 0),
    },
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
    console.error(`[api/closed-loop/platforms] ${tableName} query failed`, {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return { data: [] as T[], error: `读取 ${tableName} 失败，请检查表权限和字段。` };
  }

  return { data: (result.data ?? []) as T[], error: null };
}

function summarizeMeituanFront(rows: MeituanSummaryRow[]): FrontSummary {
  const spend = sum(rows, "spend");
  const impressions = sum(rows, "impressions");
  const clicks = sum(rows, "clicks");
  const phoneViews = sum(rows, "phone_views");
  const onlineConsultClicks = sum(rows, "online_consult_clicks");
  const orders = sum(rows, "orders");
  const groupBuyOrders = sum(rows, "group_buy_orders");
  const groupBuyOrders15d = sum(rows, "group_buy_orders_15d");
  const platformLeadCount = phoneViews + onlineConsultClicks + groupBuyOrders;

  return {
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    platformLeadCount,
    mainActions: [
      { label: "查看电话", value: phoneViews },
      { label: "在线咨询", value: onlineConsultClicks },
      { label: "订单量", value: orders },
      { label: "团购订单", value: groupBuyOrders },
      { label: "15日团购订单", value: groupBuyOrders15d },
    ],
    hasData: rows.length > 0,
  };
}

function summarizeDouyinFront(planRows: DouyinPlanRow[], leadRows: LeadRow[]): FrontSummary {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const privateMessageCount = sum(planRows, "private_message_count");
  const phoneCount = sum(planRows, "phone_count");
  const platformLeadCount = leadRows.length;

  return {
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    platformLeadCount,
    mainActions: [
      { label: "表单", value: formCount },
      { label: "私信", value: privateMessageCount },
      { label: "电话", value: phoneCount },
      { label: "转化", value: conversions },
      { label: "平台线索", value: platformLeadCount },
    ],
    hasData: planRows.length > 0 || leadRows.length > 0,
  };
}

function summarizeGdtFront(planRows: GdtPlanRow[], leadRows: LeadRow[]): FrontSummary {
  const spend = sum(planRows, "spend");
  const impressions = sum(planRows, "impressions");
  const clicks = sum(planRows, "clicks");
  const conversions = sum(planRows, "conversions");
  const formCount = sum(planRows, "form_count");
  const phoneCount = sum(planRows, "phone_count");
  const consultCount = sum(planRows, "consult_count");
  const platformLeadCount = leadRows.length;

  return {
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    platformLeadCount,
    mainActions: [
      { label: "表单", value: formCount },
      { label: "电话", value: phoneCount },
      { label: "咨询", value: consultCount },
      { label: "转化", value: conversions },
      { label: "平台线索", value: platformLeadCount },
    ],
    hasData: planRows.length > 0 || leadRows.length > 0,
  };
}

function summarizeAmapFront(summaryRows: AmapSummaryRow[], actionRows: AmapActionRow[], leadRows: LeadRow[]): FrontSummary {
  const spend = sum(summaryRows, "spend");
  const impressions = sum(summaryRows, "impressions");
  const clicks = sum(summaryRows, "clicks");
  const phoneClicks = sum(summaryRows, "phone_clicks") + sum(actionRows, "phone_clicks");
  const navigationClicks = sum(summaryRows, "navigation_clicks") + sum(actionRows, "navigation_clicks");
  const storeViewCount = sum(summaryRows, "store_view_count") + sum(actionRows, "store_view_count");
  const addressClicks = sum(summaryRows, "address_clicks") + sum(actionRows, "address_clicks");
  const couponClicks = sum(summaryRows, "coupon_clicks") + sum(actionRows, "coupon_clicks");
  const platformLeadCount = leadRows.length;

  return {
    spend,
    impressions,
    clicks,
    avgClickCost: safeDivide(spend, clicks),
    platformLeadCount,
    mainActions: [
      { label: "电话点击", value: phoneClicks },
      { label: "导航点击", value: navigationClicks },
      { label: "门店浏览", value: storeViewCount },
      { label: "地址查看", value: addressClicks },
      { label: "优惠/团购点击", value: couponClicks },
      { label: "高德线索", value: platformLeadCount },
    ],
    hasData: summaryRows.length > 0 || actionRows.length > 0 || leadRows.length > 0,
  };
}

function buildPlatformRows(frontByPlatform: Record<PlatformKey, FrontSummary>, ekanyaByPlatform: Record<PlatformKey, EkanyaBackflowRow[]>) {
  const platformMeta: Array<{ key: PlatformKey; platform: string }> = [
    { key: "meituan", platform: "美团" },
    { key: "douyin", platform: "抖音" },
    { key: "gdt", platform: "腾讯广点通" },
    { key: "amap", platform: "高德" },
  ];

  return platformMeta.map(({ key, platform }) => {
    const front = frontByPlatform[key];
    const ekanya = summarizeEkanya(ekanyaByPlatform[key] ?? [], front.spend);

    return {
      platform,
      key,
      front,
      ekanya,
      statusNote: getPlatformStatusNote(platform, front, ekanya),
    };
  });
}

function summarizeEkanya(rows: EkanyaBackflowRow[], spend: number): EkanyaSummary {
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
    paidRoi: safeDivide(paidAmount, spend),
  };
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
      const sourcePlatforms = getSourcePlatforms(projectRows);

      return {
        projectName,
        leadCount,
        appointmentCount,
        visitCount,
        dealCount,
        paidAmount,
        avgPaidAmount: safeDivide(paidAmount, dealCount),
        mainSourcePlatform: sourcePlatforms[0] ?? "未记录来源",
        sourcePlatforms,
        observationNote: getProjectObservationNote(projectName, leadCount, visitCount, dealCount, paidAmount),
      };
    })
    .sort((first, second) => second.paidAmount - first.paidAmount || second.leadCount - first.leadCount || first.projectName.localeCompare(second.projectName, "zh-CN"));
}

function getSourcePlatforms(rows: EkanyaBackflowRow[]) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const source = row.source_platform?.trim() || "未记录来源";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((first, second) => second[1] - first[1])
    .map(([source]) => source);
}

function getPlatformStatusNote(platform: string, front: FrontSummary, ekanya: EkanyaSummary) {
  if (!front.hasData && ekanya.leadCount === 0) return "还没有解析该平台前端数据，也没有看到 e看牙回流。";
  if (front.spend > 0 && ekanya.leadCount === 0) return "平台有花费，但 e看牙没有对应来源客户。先检查来源登记是否完整。";
  if (ekanya.leadCount > 0 && ekanya.visitCount === 0) return "已有来源客户，但到院偏少，先看客服邀约和到店路径。";
  if (ekanya.visitCount > 0 && ekanya.dealCount === 0) return "到院有了，但成交偏少，重点看现场转化和复诊跟进。";
  if (ekanya.paidRoi !== null && ekanya.paidRoi >= 3) return "初步 ROI 达到 1:3 参考线，但仍需结合项目周期判断。";
  if (ekanya.paidAmount > 0) return "已产生实收，继续观察项目结构和投放稳定性。";
  if (front.hasData && front.platformLeadCount > 0) return "已有平台线索，下一步要看 e看牙回流是否到院成交。";
  return `${platform}已有部分数据，先继续观察，不要自动调价或自动停投。`;
}

function getProjectObservationNote(projectName: string, leadCount: number, visitCount: number, dealCount: number, paidAmount: number) {
  if (leadCount < 3) return "样本太少，先不要下结论。";
  if (paidAmount > 0) return "已经产生实收，继续观察来源质量和项目结构。";
  if (["种植", "正畸", "半口/全口"].includes(projectName) && dealCount === 0) return "种植、正畸等高客单项目周期长，不要只看几天成交。";
  if (visitCount > 0 && dealCount === 0) return "到院有了但成交少，重点看现场转化、方案沟通和复诊跟进。";
  return "结合项目观察周期继续看，不要自动做大调整。";
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

function buildWarnings(platforms: ReturnType<typeof buildPlatformRows>, ekanyaRowCount: number) {
  const warnings: string[] = [];
  if (!platforms.some((platform) => platform.front.hasData)) warnings.push("还没有可用的平台前端解析数据。");
  if (ekanyaRowCount === 0) warnings.push("还没有解析 e看牙后端回流数据，所以暂时不能看真实到院、成交和实收。");
  platforms
    .filter((platform) => platform.front.hasData && platform.ekanya.leadCount === 0)
    .forEach((platform) => warnings.push(`${platform.platform}有前端数据，但 e看牙没有对应来源客户。`));
  return warnings;
}

function getBestRoiPlatform(platforms: ReturnType<typeof buildPlatformRows>) {
  const withRoi = platforms.filter((platform) => platform.ekanya.paidRoi !== null);
  if (withRoi.length === 0) return "暂无";
  return [...withRoi].sort((first, second) => (second.ekanya.paidRoi ?? 0) - (first.ekanya.paidRoi ?? 0))[0].platform;
}

function getTopPlatform(platforms: ReturnType<typeof buildPlatformRows>, getValue: (platform: ReturnType<typeof buildPlatformRows>[number]) => number) {
  const sorted = [...platforms].sort((first, second) => getValue(second) - getValue(first));
  return getValue(sorted[0]) > 0 ? sorted[0].platform : "暂无";
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
