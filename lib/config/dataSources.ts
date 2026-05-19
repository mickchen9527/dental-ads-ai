export type DataSourceKey =
  | "meituan"
  | "ekanya"
  | "project_cost"
  | "douyin"
  | "gdt"
  | "amap"
  | "competitor";

export type DataSourceStatus =
  | "已支持计算"
  | "入口已开放，暂不参与计算"
  | "入口已开放，仅作参考";

export type DataSourceCategory =
  | "广告平台"
  | "后端承接/成交数据源"
  | "经营规则表"
  | "市场参考数据";

export type DataSourceConfig = {
  key: DataSourceKey;
  legacyId: string;
  name: string;
  shortName: string;
  status: DataSourceStatus;
  statusLabel: DataSourceStatus;
  participationLabel: string;
  category: DataSourceCategory;
  participatesInScoring: boolean;
  participatesInCalculation: boolean;
  supportedFormats: string[];
  description: string;
  explanation: string;
  requiredFields: string[];
  recommendedFields: string[];
  fieldMappingStatus: string;
  calculationNote: string;
};

const supportedExplanation =
  "已支持上传、解析、参与数据质量评分、参与指标计算、参与建议卡生成。";

const openNoCalculationExplanation =
  "当前可上传文件并查看字段预览，但暂不纳入数据质量评分和建议卡计算。V1.3 将接入正式字段映射和指标计算。";

const referenceOnlyExplanation =
  "当前可录入或上传竞品公开信息，仅作为市场参考，不直接作为调价依据。";

export const dataSources: DataSourceConfig[] = [
  {
    key: "meituan",
    legacyId: "meituan",
    name: "美团推广数据",
    shortName: "美团",
    status: "已支持计算",
    statusLabel: "已支持计算",
    participationLabel: "参与评分 / 参与计算",
    category: "广告平台",
    participatesInScoring: true,
    participatesInCalculation: true,
    supportedFormats: ["CSV", "XLSX"],
    description: "用于上传美团推广后台导出的消耗、曝光、点击、咨询、订单等数据。",
    explanation: supportedExplanation,
    requiredFields: [
      "日期",
      "推广名称",
      "推广门店",
      "花费（元）",
      "曝光（次）",
      "点击（次）",
      "在线咨询点击（次）",
      "订单量（个）",
      "团购订单量（个）",
    ],
    recommendedFields: ["商户浏览量（次）", "查看电话（次）", "15日团购订单量（次）"],
    fieldMappingStatus: "已配置，参与计算",
    calculationNote: "参与当前 V1 数据质量评分和核心指标计算。",
  },
  {
    key: "ekanya",
    legacyId: "internal-conversion",
    name: "e看牙承接/成交数据",
    shortName: "e看牙",
    status: "已支持计算",
    statusLabel: "已支持计算",
    participationLabel: "参与评分 / 参与计算",
    category: "后端承接/成交数据源",
    participatesInScoring: true,
    participatesInCalculation: true,
    supportedFormats: ["CSV", "XLSX"],
    description: "用于上传预约、到院、成交、成交金额、未成交原因、接待人员等后端承接数据。",
    explanation: supportedExplanation,
    requiredFields: [
      "日期",
      "平台",
      "推广名称",
      "客户编号",
      "手机号后四位",
      "项目",
      "线索等级",
      "是否预约",
      "是否到院",
      "是否成交",
      "成交项目",
      "成交金额",
      "未成交原因",
      "接待人员",
    ],
    recommendedFields: ["医生", "备注"],
    fieldMappingStatus: "已配置，参与计算",
    calculationNote: "参与后端转化归因、成交回流和数据质量评分。",
  },
  {
    key: "project_cost",
    legacyId: "project-price-cost",
    name: "项目价格管理",
    shortName: "项目价格管理",
    status: "已支持计算",
    statusLabel: "已支持计算",
    participationLabel: "参与评分 / 参与计算",
    category: "经营规则表",
    participatesInScoring: true,
    participatesInCalculation: true,
    supportedFormats: ["CSV", "XLSX"],
    description: "用于维护 e看牙系统价、平台展示价、活动价、实际常见成交价和观察周期等数据。",
    explanation: supportedExplanation,
    requiredFields: [
      "项目名称",
      "项目分类",
      "e看牙系统价",
      "平台展示价",
      "活动价",
      "实际常见成交价",
      "套餐包含内容",
      "观察周期",
    ],
    recommendedFields: [],
    fieldMappingStatus: "已配置，参与计算",
    calculationNote: "参与项目价格口径、目标成交成本和实收 ROI 判断；未配置真实项目成本时不计算毛利 ROI。",
  },
  {
    key: "douyin",
    legacyId: "douyin-feed",
    name: "抖音信息流数据",
    shortName: "抖音信息流",
    status: "入口已开放，暂不参与计算",
    statusLabel: "入口已开放，暂不参与计算",
    participationLabel: "暂不参与评分 / 暂不参与计算",
    category: "广告平台",
    participatesInScoring: false,
    participatesInCalculation: false,
    supportedFormats: ["CSV", "XLSX"],
    description: "用于预留抖音信息流计划、广告组、素材、消耗、展示、点击、表单、转化成本等字段。",
    explanation: openNoCalculationExplanation,
    requiredFields: [],
    recommendedFields: ["日期", "账户", "计划", "广告组", "素材", "消耗", "展示", "点击", "私信", "表单", "转化", "转化成本"],
    fieldMappingStatus: "入口已开放，字段映射待配置",
    calculationNote: "当前 V1.2 暂不参与数据质量评分和建议卡计算，V1.3 后再纳入计算。",
  },
  {
    key: "gdt",
    legacyId: "tencent-gdt",
    name: "腾讯广点通数据",
    shortName: "腾讯广点通",
    status: "入口已开放，暂不参与计算",
    statusLabel: "入口已开放，暂不参与计算",
    participationLabel: "暂不参与评分 / 暂不参与计算",
    category: "广告平台",
    participatesInScoring: false,
    participatesInCalculation: false,
    supportedFormats: ["CSV", "XLSX"],
    description: "用于预留腾讯广点通账户、计划、广告组、创意、消耗、曝光、点击、表单、电话、转化成本等字段。",
    explanation: openNoCalculationExplanation,
    requiredFields: [],
    recommendedFields: ["日期", "账户", "计划", "广告组", "创意", "消耗", "曝光", "点击", "表单", "电话", "转化", "转化成本"],
    fieldMappingStatus: "入口已开放，字段映射待配置",
    calculationNote: "当前 V1.2 暂不参与数据质量评分和建议卡计算，V1.3 后再纳入计算。",
  },
  {
    key: "amap",
    legacyId: "amap",
    name: "高德数据",
    shortName: "高德",
    status: "入口已开放，暂不参与计算",
    statusLabel: "入口已开放，暂不参与计算",
    participationLabel: "暂不参与评分 / 暂不参与计算",
    category: "广告平台",
    participatesInScoring: false,
    participatesInCalculation: false,
    supportedFormats: ["CSV", "XLSX"],
    description: "用于预留高德推广汇总、电话、导航、地址查看、门店访问和路线规划等字段。",
    explanation: "当前可上传文件并查看字段预览，但暂不纳入数据质量评分和建议卡计算。后续配置字段映射后再参与计算。",
    requiredFields: [],
    recommendedFields: ["高德推广汇总数据", "高德电话/导航/门店访问数据", "高德线索数据，如果能导出", "e看牙高德后端回流数据", "日期", "花费", "曝光", "点击", "电话", "导航", "地址查看", "门店访问", "路线规划", "到店意向"],
    fieldMappingStatus: "入口已开放，字段映射待配置",
    calculationNote: "当前暂不参与数据质量评分和建议卡计算，后续再纳入计算。",
  },
  {
    key: "competitor",
    legacyId: "competitor-intelligence",
    name: "竞品情报表",
    shortName: "竞品情报",
    status: "入口已开放，仅作参考",
    statusLabel: "入口已开放，仅作参考",
    participationLabel: "仅作市场参考 / 不参与核心评分",
    category: "市场参考数据",
    participatesInScoring: false,
    participatesInCalculation: false,
    supportedFormats: ["CSV", "XLSX", "手动录入", "公开文本粘贴"],
    description: "用于录入竞品公开页面价格、活动机制、限制条件、页面卖点、评论区需求和差评关键词。",
    explanation: referenceOnlyExplanation,
    requiredFields: [],
    recommendedFields: ["日期", "竞品名称", "平台", "项目", "展示价格", "活动机制", "限制条件", "主卖点", "页面链接", "评论区高频问题", "差评关键词", "可信度等级", "备注"],
    fieldMappingStatus: "入口已开放，仅作参考，可信度等级待人工确认",
    calculationNote: "当前仅作为市场参考，不直接参与核心评分，不直接决定调价。",
  },
];

export const scoringDataSources = dataSources.filter((source) => source.participatesInScoring);
export const calculationDataSources = dataSources.filter((source) => source.participatesInCalculation);
export const supportedDataSources = dataSources.filter((source) => source.status === "已支持计算");
export const openDataSources = dataSources.filter((source) => source.status !== "已支持计算");
export const pendingDataSources = openDataSources;

export const supportedDataSourceText = supportedDataSources.map((source) => source.shortName).join("、");
export const pendingDataSourceText = openDataSources.map((source) => source.shortName).join("、");
export const openButNotCalculatedDataSourceText = openDataSources.map((source) => source.shortName).join("、");
export const pendingScoringNotice =
  "当前数据质量评分仍主要基于美团推广数据、e看牙承接/成交数据、项目价格管理。抖音、腾讯广点通、竞品情报已开放入口，但暂未纳入核心评分。";

export function getDataSourceByKey(key: DataSourceKey) {
  return dataSources.find((source) => source.key === key);
}

export function getDataSourceByLegacyId(legacyId: string) {
  return dataSources.find((source) => source.legacyId === legacyId);
}
