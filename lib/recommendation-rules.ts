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

export type TargetSettingKey =
  | "minimumClicks"
  | "lowConsultationRate"
  | "lowPhoneRate"
  | "lowOrderRate"
  | "lowRoi"
  | "highSpendKeywordCost"
  | "highSpendKeywordClicks";

export type TargetSettingDefinition = {
  key: TargetSettingKey;
  label: string;
  defaultValue: number;
  unit: string;
  description: string;
};

export type RecommendationThresholdSettings = Record<TargetSettingKey, number>;

export const targetSettingDefinitions: TargetSettingDefinition[] = [
  {
    key: "minimumClicks",
    label: "最小点击样本量",
    defaultValue: defaultRecommendationThresholds.sample.minClicksForTrafficJudgment,
    unit: "次",
    description: "低于这个点击量时，只提示继续观察，不下强结论。",
  },
  {
    key: "lowConsultationRate",
    label: "咨询率偏低线",
    defaultValue: defaultRecommendationThresholds.rate.lowConsultationRate,
    unit: "%",
    description: "低于这条线时，提示页面承接或咨询入口可能偏弱。",
  },
  {
    key: "lowPhoneRate",
    label: "电话率偏低线",
    defaultValue: defaultRecommendationThresholds.rate.lowPhoneRate,
    unit: "%",
    description: "低于这条线时，提示电话入口、信任感或到店意向可能偏弱。",
  },
  {
    key: "lowOrderRate",
    label: "订单转化率偏低线",
    defaultValue: defaultRecommendationThresholds.rate.lowOrderRate,
    unit: "%",
    description: "低于这条线时，提示点击后下单或团购动作偏弱。",
  },
  {
    key: "lowRoi",
    label: "实收 ROI 参考线",
    defaultValue: defaultRecommendationThresholds.roi.targetPaidRoi,
    unit: "倍",
    description: "当前用 1:3 作为参考线，不代表所有项目当周都必须达到。",
  },
  {
    key: "highSpendKeywordCost",
    label: "高花费关键词复核线",
    defaultValue: defaultRecommendationThresholds.sample.minSpendForKeywordReview,
    unit: "元",
    description: "单个关键词花费超过这条线且没有动作时，提示人工复核。",
  },
  {
    key: "highSpendKeywordClicks",
    label: "高花费关键词最小点击数",
    defaultValue: defaultRecommendationThresholds.sample.minClicksForKeywordReview,
    unit: "次",
    description: "关键词点击低于这个数量时，先不做强判断。",
  },
];

export const defaultTargetSettings = Object.fromEntries(
  targetSettingDefinitions.map((item) => [item.key, item.defaultValue]),
) as RecommendationThresholdSettings;

export function buildRecommendationThresholds(overrides?: Partial<Record<TargetSettingKey, number>>): RecommendationThresholdSettings {
  const nextSettings = { ...defaultTargetSettings };

  targetSettingDefinitions.forEach((definition) => {
    const value = overrides?.[definition.key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      nextSettings[definition.key] = value;
    }
  });

  return nextSettings;
}

export function isTargetSettingKey(value: string): value is TargetSettingKey {
  return targetSettingDefinitions.some((definition) => definition.key === value);
}

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

export function hasEnoughTrafficSample(clicks: number, thresholds: RecommendationThresholdSettings = defaultTargetSettings) {
  return clicks >= thresholds.minimumClicks;
}

export function isLowConsultationRate(rate: number | null, thresholds: RecommendationThresholdSettings = defaultTargetSettings) {
  return rate !== null && rate < thresholds.lowConsultationRate;
}

export function isLowPhoneRate(rate: number | null, thresholds: RecommendationThresholdSettings = defaultTargetSettings) {
  return rate !== null && rate < thresholds.lowPhoneRate;
}

export function isLowPaidRoi(roi: number | null, thresholds: RecommendationThresholdSettings = defaultTargetSettings) {
  return roi !== null && roi > 0 && roi < thresholds.lowRoi;
}

export function isHealthyPaidRoi(roi: number | null, thresholds: RecommendationThresholdSettings = defaultTargetSettings) {
  return roi !== null && roi >= thresholds.lowRoi;
}

export function isRiskyKeywordSpend(
  spend: number,
  clicks: number,
  actionCount: number,
  thresholds: RecommendationThresholdSettings = defaultTargetSettings,
) {
  return (
    spend >= thresholds.highSpendKeywordCost &&
    clicks >= thresholds.highSpendKeywordClicks &&
    actionCount === 0
  );
}

export function getSampleTooSmallMessage(platformName: string) {
  return `${platformName} 当前样本还不够，先继续观察，不建议马上做大幅调整。`;
}

export function getRoiMissingDataMessage() {
  return "缺少广告花费或 e看牙实收金额时，不要硬算 ROI；当前只能先看前端流量和回流记录是否完整。";
}
