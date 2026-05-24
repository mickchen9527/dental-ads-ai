import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const supportedDateTypes = new Set(["source_date", "visit_date", "deal_date"]);
const meituanSummaryTypes = ["美团推广汇总数据", "meituan-summary"];
const meituanKeywordTypes = ["美团关键词数据", "meituan-keywords"];
const ekanyaBackflowTypes = ["e看牙后端回流数据", "ekanya-backflow"];
const meituanSourceNames = ["美团", "大众点评", "美团点评", "meituan", "dianping"];

type NumericValue = number | string | null | undefined;
type Priority = "high" | "medium" | "low";

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

type EkanyaBackflowRow = {
  source_platform: string | null;
  source_date: string | null;
  visit_date: string | null;
  deal_date: string | null;
  appointment_status: string | null;
  visit_status: string | null;
  deal_status: string | null;
  paid_amount: NumericValue;
};

type TodayRecommendation = {
  id: string;
  title: string;
  platform: string;
  priority: Priority;
  problem: string;
  reason: string;
  action: string;
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
  const summaryFileIds = getParsedFileIds(uploadedFiles, meituanSummaryTypes);
  const keywordFileIds = getParsedFileIds(uploadedFiles, meituanKeywordTypes);
  const ekanyaFileIds = getParsedFileIds(uploadedFiles, ekanyaBackflowTypes);

  const [summaryRows, keywordRows, ekanyaRows] = await Promise.all([
    fetchMeituanSummaryRows(summaryFileIds, range.startDate, range.endDate),
    fetchMeituanKeywordRows(keywordFileIds, range.startDate, range.endDate),
    fetchEkanyaRows(ekanyaFileIds, dateType, range.startDate, range.endDate),
  ]);

  if (summaryRows.error || keywordRows.error || ekanyaRows.error) {
    return NextResponse.json(
      { message: summaryRows.error ?? keywordRows.error ?? ekanyaRows.error ?? "读取今日建议数据失败，请检查解析表权限。" },
      { status: 500 },
    );
  }

  const meituanSummary = summarizeMeituanSummary(summaryRows.data);
  const keywordTop = summarizeKeywords(keywordRows.data);
  const meituanBackflowRows = ekanyaRows.data.filter(isMeituanSource);
  const ekanyaSummary = summarizeEkanya(meituanBackflowRows, meituanSummary.totalSpend);
  const uploadCompleteness = {
    hasMeituanSummary: summaryRows.data.length > 0,
    hasMeituanKeywords: keywordRows.data.length > 0,
    hasEkanyaBackflow: meituanBackflowRows.length > 0,
    hasAnyParsedData: summaryRows.data.length > 0 || keywordRows.data.length > 0 || meituanBackflowRows.length > 0,
  };

  const recommendations = buildRecommendations({
    uploadCompleteness,
    meituanSummary,
    keywordTop,
    ekanyaSummary,
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
    recommendations,
  });
}

async function fetchMeituanSummaryRows(uploadedFileIds: string[], startDate: string, endDate: string) {
  if (uploadedFileIds.length === 0) return { data: [] as MeituanSummaryRow[], error: null as string | null };
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { data: [] as MeituanSummaryRow[], error: "Supabase 服务端连接失败。" };

  const result = await supabase
    .from("meituan_summary_rows")
    .select("spend, impressions, clicks, merchant_views, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d")
    .in("uploaded_file_id", uploadedFileIds)
    .gte("date", startDate)
    .lte("date", endDate)
    .limit(10000);

  if (result.error) {
    console.error("[api/recommendations/today] meituan_summary_rows query failed", {
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
    .select("keyword, spend, impressions, clicks, phone_views, online_consult_clicks, orders, group_buy_orders")
    .in("uploaded_file_id", uploadedFileIds)
    .gte("date", startDate)
    .lte("date", endDate)
    .limit(10000);

  if (result.error) {
    console.error("[api/recommendations/today] meituan_keyword_rows query failed", {
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
    .select("source_platform, source_date, visit_date, deal_date, appointment_status, visit_status, deal_status, paid_amount")
    .in("uploaded_file_id", uploadedFileIds)
    .gte(dateType, startDate)
    .lte(dateType, endDate)
    .limit(10000);

  if (result.error) {
    console.error("[api/recommendations/today] ekanya_backflow_rows query failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    return { data: [] as EkanyaBackflowRow[], error: "读取 e看牙回流解析数据失败，请检查 ekanya_backflow_rows 表权限。" };
  }

  return { data: (result.data ?? []) as EkanyaBackflowRow[], error: null };
}

function getParsedFileIds(files: UploadedFileRow[], dataTypes: string[]) {
  return files.filter((file) => dataTypes.includes(file.data_type ?? "") && file.parse_status === "parsed").map((file) => file.id);
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
      avg_click_cost: 0,
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

function buildRecommendations({
  uploadCompleteness,
  meituanSummary,
  keywordTop,
  ekanyaSummary,
}: {
  uploadCompleteness: { hasMeituanSummary: boolean; hasMeituanKeywords: boolean; hasEkanyaBackflow: boolean; hasAnyParsedData: boolean };
  meituanSummary: ReturnType<typeof summarizeMeituanSummary>;
  keywordTop: ReturnType<typeof summarizeKeywords>;
  ekanyaSummary: ReturnType<typeof summarizeEkanya>;
}) {
  const recommendations: TodayRecommendation[] = [];

  if (!uploadCompleteness.hasMeituanSummary) {
    recommendations.push(makeRecommendation({
      id: "missing-meituan-summary",
      title: "先上传美团推广汇总数据",
      platform: "数据质量",
      priority: "high",
      problem: "当前没有美团推广汇总解析数据，无法判断花费、点击、电话和咨询。",
      reason: "没有前端花费和点击数据，就不知道今天钱花到哪里了。",
      action: "先到数据上传页上传并解析美团推广汇总数据，建议人工复核后执行。",
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
      problem: "当前没有 e看牙回流数据，暂时无法判断到院、成交和实收。",
      reason: "只有前端数据看不出客户有没有真的到院和成交。",
      action: "先上传并解析 e看牙后端回流数据，建议人工复核后执行。",
      steps: ["导出 e看牙客户/就诊/收费数据", "上传到 e看牙后端回流数据入口", "上传后点击解析", "确认来源平台记录是否包含美团或点评"],
      dontDo: "不要只看点击和咨询就判断投放好坏。",
      observeDays: "今天先补数据",
      reviewMetrics: ["美团来源客户数", "到院数", "成交数", "实收金额"],
      dataBasis: ["uploaded_files", "ekanya_backflow_rows"],
    }));
  }

  if (!uploadCompleteness.hasMeituanKeywords) {
    recommendations.push(makeRecommendation({
      id: "missing-meituan-keywords",
      title: "关键词数据还没接上",
      platform: "美团",
      priority: "medium",
      problem: "当前没有美团关键词数据，不能判断具体哪些词需要复核。",
      reason: "没有关键词表，只能看账户大盘，不能看到词级别花费和线索。",
      action: "准备调词前，先上传并解析美团关键词数据，建议人工复核后执行。",
      steps: ["从美团后台导出关键词数据", "确认表里包含“关键词”字段", "上传到美团关键词数据入口", "解析后再看高花费关键词"],
      dontDo: "不要用推广汇总表代替关键词表。",
      observeDays: "调词前必须补",
      reviewMetrics: ["关键词花费", "关键词点击", "电话/咨询/订单"],
      dataBasis: ["uploaded_files", "meituan_keyword_rows"],
    }));
  }

  if (meituanSummary.totalSpend > 0 && ekanyaSummary.leadCount === 0) {
    recommendations.push(makeRecommendation({
      id: "spend-no-backflow",
      title: "先查美团来源有没有记进 e看牙",
      platform: "美团",
      priority: "high",
      problem: "美团有花费，但 e看牙里没有看到美团来源客户。",
      reason: "可能是 e看牙来源记录不完整，也可能是广告没有带来有效客户。",
      action: "先不要急着否定投放，先检查前台/客服是否正确记录来源，建议人工复核后执行。",
      steps: ["抽查当天美团电话、咨询和团购订单", "核对 e看牙客户来源是否写了美团/点评", "让前台统一记录来源平台和来源方式", "补齐后再看实收 ROI"],
      dontDo: "不要直接停预算，也不要直接加预算。",
      observeDays: "3天",
      reviewMetrics: ["e看牙美团来源客户数", "到院数", "实收金额"],
      dataBasis: ["meituan_summary_rows", "ekanya_backflow_rows"],
    }));
  }

  if (meituanSummary.totalClicks >= 30 && (meituanSummary.consultRate ?? 0) < 0.03) {
    recommendations.push(makeRecommendation({
      id: "clicks-low-consult",
      title: "点击有了，但在线咨询偏少",
      platform: "美团",
      priority: "medium",
      problem: "点击有了，但在线咨询偏少。",
      reason: "可能是关键词意图不准，也可能是美团页面承接不够清楚。",
      action: "优先检查高花费关键词、套餐标题、价格表达和购买须知，建议人工复核后执行。",
      steps: ["看 Top 花费关键词是否太泛", "检查套餐标题是否一眼能看懂", "检查价格和包含项目是否写清楚", "补充购买须知和常见问题"],
      dontDo: "不要只看点击量判断效果好。",
      observeDays: "3-7天",
      reviewMetrics: ["在线咨询点击率", "团购订单量", "e看牙来源客户数"],
      dataBasis: ["meituan_summary_rows", "meituan_keyword_rows"],
    }));
  }

  if (meituanSummary.totalClicks >= 30 && (meituanSummary.phoneRate ?? 0) < 0.02) {
    recommendations.push(makeRecommendation({
      id: "clicks-low-phone",
      title: "点击后查看电话的人偏少",
      platform: "美团",
      priority: "medium",
      problem: "点击后查看电话的人偏少。",
      reason: "用户可能只是浏览，没有强到店意向，也可能页面信任感不足。",
      action: "检查门店评分、医生/案例展示、套餐卖点和电话入口是否明显，建议人工复核后执行。",
      steps: ["检查电话入口是否明显", "检查医生、案例和服务说明是否够清楚", "检查套餐卖点是否只写低价", "对比点击高但电话少的关键词"],
      dontDo: "不要只加预算。",
      observeDays: "3-7天",
      reviewMetrics: ["查看电话率", "在线咨询点击", "到院数"],
      dataBasis: ["meituan_summary_rows"],
    }));
  }

  if (ekanyaSummary.visitCount > 0 && ekanyaSummary.dealCount === 0) {
    recommendations.push(makeRecommendation({
      id: "visits-no-deals",
      title: "有到院但暂时没成交",
      platform: "e看牙",
      priority: "medium",
      problem: "已经有到院，但暂时没有成交。",
      reason: "问题可能不在前端投放，而在现场接诊、方案沟通、价格承接或复诊跟进。",
      action: "复盘到院客户项目、医生方案、咨询沟通和未成交原因，建议人工复核后执行。",
      steps: ["列出到院未成交客户", "查看意向项目和到院项目是否一致", "复盘医生方案沟通", "记录未成交原因并安排跟进"],
      dontDo: "不要马上否定投放。",
      observeDays: "7-14天",
      reviewMetrics: ["到院转成交率", "未成交原因", "复诊跟进结果"],
      dataBasis: ["ekanya_backflow_rows"],
    }));
  }

  if (ekanyaSummary.paidAmount > 0 && ekanyaSummary.paidRoi !== null && ekanyaSummary.paidRoi < 3) {
    recommendations.push(makeRecommendation({
      id: "paid-roi-low",
      title: "有成交和实收，但暂时低于 1:3",
      platform: "美团",
      priority: "medium",
      problem: "有成交和实收，但暂时低于 1:3。",
      reason: "可能是项目客单价低、观察周期短，或者种植/正畸还没完全成交。",
      action: "拆开看项目结构，低客单项目和高客单项目不要混着判断，建议人工复核后执行。",
      steps: ["看成交项目是洁牙还是高客单项目", "看是否还有到院未成交客户", "看高客单项目是否还在方案沟通期", "再决定是否小幅调整预算"],
      dontDo: "不要只看当天 ROI。",
      observeDays: "7-30天",
      reviewMetrics: ["实收 ROI", "项目结构", "高客单成交回流"],
      dataBasis: ["meituan_summary_rows", "ekanya_backflow_rows"],
    }));
  }

  if (ekanyaSummary.paidRoi !== null && ekanyaSummary.paidRoi >= 3) {
    recommendations.push(makeRecommendation({
      id: "paid-roi-healthy",
      title: "初步实收 ROI 已达到 1:3 参考线",
      platform: "美团",
      priority: "low",
      problem: "本周期初步实收 ROI 已达到 1:3 参考线。",
      reason: "说明当前周期内已有实收覆盖投放参考线。",
      action: "先保持观察，不要大幅改动，重点看关键词和项目结构，建议人工复核后执行。",
      steps: ["保留当前有效计划", "看高花费关键词是否健康", "看成交项目结构", "小幅测试，不做大起大落"],
      dontDo: "不要因为短期达标就盲目加大预算。",
      observeDays: "3-7天",
      reviewMetrics: ["实收 ROI", "成交项目", "关键词花费"],
      dataBasis: ["meituan_summary_rows", "ekanya_backflow_rows"],
    }));
  }

  const riskyKeywords = keywordTop.filter((row) => row.spend >= 300 && row.clicks >= 10 && row.actionCount === 0).slice(0, 3);
  if (riskyKeywords.length > 0) {
    recommendations.push(makeRecommendation({
      id: "high-spend-keywords",
      title: "高花费关键词需要人工复核",
      platform: "美团",
      priority: "high",
      problem: `有 ${riskyKeywords.length} 个关键词花费较高，但暂时没有电话、咨询或订单。`,
      reason: "可能是词意图偏泛，或者页面承接不匹配。",
      action: "人工复核这些词的搜索意图和匹配方式，再决定是否降价、缩匹配或暂停，建议人工复核后执行。",
      steps: riskyKeywords.map((row) => `复核关键词：${row.keyword}，花费约 ${row.spend.toFixed(2)}，点击 ${row.clicks}`),
      dontDo: "不要让系统自动暂停关键词。",
      observeDays: "3-7天",
      reviewMetrics: ["关键词花费", "查看电话", "在线咨询点击", "订单量"],
      dataBasis: ["meituan_keyword_rows"],
    }));
  }

  if (!uploadCompleteness.hasAnyParsedData) {
    recommendations.push(makeRecommendation({
      id: "no-real-data",
      title: "先把三张核心数据接上",
      platform: "数据质量",
      priority: "high",
      problem: "当前还没有足够的真实数据生成建议。",
      reason: "没有已解析的美团推广汇总、美团关键词和 e看牙后端回流数据，系统只能给补数据建议。",
      action: "请先上传并解析：美团推广汇总数据、美团关键词数据、e看牙后端回流数据，建议人工复核后执行。",
      steps: ["先传美团推广汇总数据", "再传 e看牙后端回流数据", "准备调词前传美团关键词数据", "全部解析后刷新今日总建议"],
      dontDo: "不要在没有真实数据时调整预算、调价或暂停关键词。",
      observeDays: "今天先补数据",
      reviewMetrics: ["上传记录", "解析状态", "row_count"],
      dataBasis: ["uploaded_files"],
    }));
  }

  return recommendations;
}

function makeRecommendation(input: Omit<TodayRecommendation, "status">): TodayRecommendation {
  return { ...input, status: "pending" };
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