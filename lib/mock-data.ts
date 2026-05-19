import type { DataSourceId } from "./data-sources";
import type { StandardDataRow } from "./metrics";
import { scoreDataQuality } from "./quality";

export const REPORT_DATE = "2026-05-16";

export const uploadedDataSourceIds: DataSourceId[] = [
  "meituan",
  "internal-conversion",
  "project-price-cost",
];

export const standardRows: StandardDataRow[] = [
  {
    date: REPORT_DATE,
    platformId: "meituan",
    account: "美团-总院",
    campaign: "种植牙本地团购",
    adGroup: "高意向搜索词",
    creative: "进口种植体限时体验",
    store: "总院",
    project: "种植",
    spend: 12800,
    impressions: 88000,
    clicks: 4200,
    consultations: 310,
    validConsultations: 178,
    appointments: 78,
    arrivals: 52,
    deals: 18,
    revenue: 176400,
    projectCost: 64800,
    grossProfit: 111600,
  },
  {
    date: REPORT_DATE,
    platformId: "meituan",
    account: "美团-总院",
    campaign: "正畸暑期提前蓄水",
    adGroup: "学生与家长",
    creative: "隐形矫正方案评估",
    store: "总院",
    project: "正畸",
    spend: 9600,
    impressions: 72000,
    clicks: 2780,
    consultations: 196,
    validConsultations: 118,
    appointments: 48,
    arrivals: 31,
    deals: 7,
    revenue: 126000,
    projectCost: 42000,
    grossProfit: 84000,
  },
  {
    date: REPORT_DATE,
    platformId: "meituan",
    account: "美团-分院A",
    campaign: "洁牙套餐转化",
    adGroup: "附近三公里",
    creative: "工作日洁牙套餐",
    store: "分院A",
    project: "洁牙",
    spend: 3600,
    impressions: 42000,
    clicks: 1680,
    consultations: 226,
    validConsultations: 92,
    appointments: 44,
    arrivals: 32,
    deals: 22,
    revenue: 17600,
    projectCost: 6600,
    grossProfit: 11000,
  },
];

export type CompetitorConfidenceLevel = "A" | "B" | "C";

export type CompetitorRecord = {
  id: string;
  competitorName: string;
  platform: string;
  projectName: string;
  displayedPrice: string;
  activityMechanism: string;
  purchaseNotes: string;
  limitConditions: string;
  confidenceLevel: CompetitorConfidenceLevel;
};

export const competitorRecords: CompetitorRecord[] = [
  {
    id: "cmp-001",
    competitorName: "同城口腔A",
    platform: "美团",
    projectName: "种植",
    displayedPrice: "¥2,980起",
    activityMechanism: "限时团购价，到院面诊确认方案",
    purchaseNotes: "页面明确包含基础检查，附加项目需到院确认。",
    limitConditions: "新客专享，每人限购一次。",
    confidenceLevel: "A",
  },
  {
    id: "cmp-002",
    competitorName: "同城口腔B",
    platform: "抖音公开页面",
    projectName: "洁牙",
    displayedPrice: "¥99起",
    activityMechanism: "直播间券价，适用门店需客服确认。",
    purchaseNotes: "只看到展示价格，适用条件不完整。",
    limitConditions: "节假日可能不可用。",
    confidenceLevel: "B",
  },
];

export type RecommendationType = string;

export type Recommendation = {
  id: string;
  type: RecommendationType;
  action: string;
  platform: string;
  project: string;
  dataCycle: string;
  sampleSize: string;
  evidence: string;
  reason: string;
  risk: string;
  observationCycle: string;
  confidence: "高置信" | "中置信" | "低置信";
  completeRevenueReturn: "是" | "否";
  needsHumanReview: "是" | "否";
  sourceIds: DataSourceId[];
};

const recommendationTypes = [
  "建议人工复核后小幅测试",
  "建议降预算",
  "建议暂停",
  "建议保持观察",
  "建议小幅提高出价",
  "建议降低出价",
  "建议维持当前出价",
  "建议先优化页面后再加价",
  "建议更换素材",
  "建议优化前三秒",
  "建议优化封面",
  "建议优化标题",
  "建议减少低价强刺激素材",
  "建议增加医生讲解型素材",
  "建议增加信任型素材",
  "建议增加方案评估型素材",
  "建议优化美团页面",
  "建议优化套餐标题",
  "建议优化购买须知",
  "建议优化页面 FAQ",
  "建议优化客服话术",
  "建议增加到院权益",
  "建议加强预约提醒",
  "建议复盘接待人员承接差异",
  "建议保持价格",
  "建议优化价格表达",
  "建议增加价格梯度",
  "建议改成检查/方案引流",
  "建议小范围测试降价",
  "建议小范围测试涨价",
  "不建议继续低价放量",
  "不建议直接跟价",
  "建议强化医生/材料/服务信任点",
  "建议做内容反打",
  "建议补充竞品情报后再判断",
  "建议拆解竞品活动条件",
  "建议先补充 e看牙回流数据",
  "建议先补齐项目价格管理",
  "建议先统一项目映射",
  "建议暂缓重大调整",
];

function buildRecommendation(type: string, index: number): Recommendation {
  const projects = ["种植", "正畸", "洁牙", "补牙", "儿牙", "修复", "美白", "贴面"];
  const project = projects[index % projects.length];
  const isDataQuality = index >= 36;
  const isHighTicket = project === "种植" || project === "正畸" || project === "贴面";
  const confidence = isDataQuality || isHighTicket ? "中置信" : "高置信";

  return {
    id: `rec-${index + 1}`,
    type,
    action: `${type}：${project}项目先做人工复核后执行`,
    platform: isDataQuality ? "美团 + e看牙 + 项目价格管理" : "美团",
    project,
    dataCycle: isHighTicket ? "近7-30天" : "近1-7天",
    sampleSize: isHighTicket ? "样本量偏小，需继续观察成交回流" : "示例样本：咨询80-300条",
    evidence: isDataQuality
      ? "数据质量评分、平台线索回流率和成交金额完整率提示需要先补数据。"
      : "结合消耗、有效咨询率、到院率、成交成本和实收 ROI 进行规则判断。",
    reason: isHighTicket
      ? "高客单项目决策周期长，不能只看单日表现。"
      : "当前指标变化已经指向可执行的优化方向。",
    risk: isDataQuality
      ? "数据不完整时，不建议做重大预算或价格调整。"
      : "所有建议必须人工确认，系统不会替你操作广告后台。",
    observationCycle: isHighTicket ? "7-30天" : "1-7天",
    confidence,
    completeRevenueReturn: "否",
    needsHumanReview: "是",
    sourceIds: isDataQuality
      ? ["meituan", "internal-conversion", "project-price-cost"]
      : ["meituan", "internal-conversion"],
  };
}

export const recommendations: Recommendation[] = recommendationTypes.map(buildRecommendation);

export const qualityResult = scoreDataQuality(standardRows, {
  presentSourceIds: uploadedDataSourceIds,
  reportDate: REPORT_DATE,
});
