export type MetricDefinition = {
  key: string;
  name: string;
  formulaLabel: string;
  description: string;
  missingDataMessage: string;
};

export type PlatformRuleProfile = {
  key: "meituan" | "douyin" | "gdt" | "amap" | "ekanya";
  name: string;
  focusMetrics: string[];
  weakDataMessage: string;
};

export const recommendationMetricDefinitions: MetricDefinition[] = [
  {
    key: "ctr",
    name: "点击率",
    formulaLabel: "点击 / 曝光",
    description: "看用户看到广告后愿不愿意点进来。",
    missingDataMessage: "缺少曝光或点击时，不能判断点击率。",
  },
  {
    key: "cpc",
    name: "平均点击成本",
    formulaLabel: "花费 / 点击",
    description: "看每一次点击大概花了多少钱。",
    missingDataMessage: "缺少花费或点击时，不能判断点击成本。",
  },
  {
    key: "consultationRate",
    name: "咨询率",
    formulaLabel: "咨询动作 / 点击",
    description: "看点击后有多少人愿意咨询。",
    missingDataMessage: "缺少点击或咨询动作时，不能判断咨询率。",
  },
  {
    key: "phoneRate",
    name: "电话点击率",
    formulaLabel: "电话动作 / 点击",
    description: "看点击后有多少人愿意打电话或查看电话。",
    missingDataMessage: "缺少点击或电话动作时，不能判断电话点击率。",
  },
  {
    key: "orderRate",
    name: "订单转化率",
    formulaLabel: "订单 / 点击",
    description: "看点击后有多少人下单或产生团购订单。",
    missingDataMessage: "缺少点击或订单时，不能判断订单转化率。",
  },
  {
    key: "cpa",
    name: "单订单成本",
    formulaLabel: "花费 / 订单",
    description: "看每产生一条订单或转化大概花多少钱。",
    missingDataMessage: "缺少花费或订单时，不能判断单订单成本。",
  },
  {
    key: "roi",
    name: "实收 ROI",
    formulaLabel: "e看牙实际实收金额 / 广告花费",
    description: "看投放花费有没有大致回收到实收。",
    missingDataMessage: "缺少广告花费或 e看牙实收金额时，不要硬算 ROI。",
  },
  {
    key: "leadRate",
    name: "线索率",
    formulaLabel: "平台线索 / 点击",
    description: "看点击后有多少人留下表单、私信、电话或其它线索。",
    missingDataMessage: "缺少点击或线索明细时，不能判断线索率。",
  },
  {
    key: "dataCompleteness",
    name: "数据完整率",
    formulaLabel: "有效字段数 / 应有字段数",
    description: "看上传和解析后的数据够不够用。",
    missingDataMessage: "缺少解析数据时，只能先提示补数据。",
  },
];

export const defaultRecommendationThresholds = {
  sample: {
    minClicksForTrafficJudgment: 30,
    minSpendForKeywordReview: 300,
    minClicksForKeywordReview: 10,
  },
  rate: {
    lowCtr: 0.01,
    goodCtr: 0.03,
    lowConsultationRate: 0.03,
    lowPhoneRate: 0.02,
    lowOrderRate: 0.01,
  },
  roi: {
    weakPaidRoi: 1,
    targetPaidRoi: 3,
  },
} as const;

export const platformRuleProfiles: PlatformRuleProfile[] = [
  {
    key: "meituan",
    name: "美团",
    focusMetrics: ["曝光", "点击", "商户浏览", "电话", "在线咨询", "订单", "团购", "e看牙回流"],
    weakDataMessage: "美团没有推广汇总或关键词解析数据时，不要直接判断关键词和预算。",
  },
  {
    key: "douyin",
    name: "抖音",
    focusMetrics: ["曝光", "点击", "表单", "私信", "素材", "落地转化", "后端回流"],
    weakDataMessage: "抖音只有前端点击时，只能看流量质量，不能判断真实成交。",
  },
  {
    key: "gdt",
    name: "腾讯广点通",
    focusMetrics: ["曝光", "点击", "表单", "电话", "咨询", "平台线索"],
    weakDataMessage: "腾讯广点通缺线索明细时，只能先看计划层级表现。",
  },
  {
    key: "amap",
    name: "高德",
    focusMetrics: ["电话", "导航", "地址查看", "门店访问", "本地到店动作"],
    weakDataMessage: "高德重点看本地到店动作，缺电话/导航/门店访问时不要硬下结论。",
  },
  {
    key: "ekanya",
    name: "e看牙",
    focusMetrics: ["到院", "成交", "实收", "来源平台", "项目"],
    weakDataMessage: "e看牙来源平台不完整时，闭环 ROI 只能作为参考，不是精准归因。",
  },
];

export function getPlatformRuleProfile(key: PlatformRuleProfile["key"]) {
  return platformRuleProfiles.find((profile) => profile.key === key);
}

export function hasEnoughTrafficSample(clicks: number) {
  return clicks >= defaultRecommendationThresholds.sample.minClicksForTrafficJudgment;
}

export function isLowConsultationRate(rate: number | null) {
  return rate !== null && rate < defaultRecommendationThresholds.rate.lowConsultationRate;
}

export function isLowPhoneRate(rate: number | null) {
  return rate !== null && rate < defaultRecommendationThresholds.rate.lowPhoneRate;
}

export function isLowPaidRoi(roi: number | null) {
  return roi !== null && roi > 0 && roi < defaultRecommendationThresholds.roi.targetPaidRoi;
}

export function isHealthyPaidRoi(roi: number | null) {
  return roi !== null && roi >= defaultRecommendationThresholds.roi.targetPaidRoi;
}

export function isRiskyKeywordSpend(spend: number, clicks: number, actionCount: number) {
  return (
    spend >= defaultRecommendationThresholds.sample.minSpendForKeywordReview &&
    clicks >= defaultRecommendationThresholds.sample.minClicksForKeywordReview &&
    actionCount === 0
  );
}

export function getSampleTooSmallMessage(platformName: string) {
  return `${platformName} 当前样本还不够，先继续观察，不建议马上做大幅调整。`;
}

export function getRoiMissingDataMessage() {
  return "缺少广告花费或 e看牙实收金额时，不要硬算 ROI；当前只能先看前端流量和回流记录是否完整。";
}
