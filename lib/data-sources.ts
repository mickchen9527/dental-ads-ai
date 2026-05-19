import {
  dataSources,
  getDataSourceByLegacyId,
  type DataSourceConfig,
} from "./config/dataSources";

export const STANDARD_DATA_FIELDS = [
  "date",
  "platform",
  "account",
  "campaign",
  "ad_group",
  "creative",
  "store",
  "project",
  "spend",
  "impressions",
  "clicks",
  "consultations",
  "valid_consultations",
  "appointments",
  "arrivals",
  "deals",
  "revenue",
  "project_cost",
  "gross_profit",
  "failure_reason",
] as const;

export type StandardDataField = (typeof STANDARD_DATA_FIELDS)[number];

export type DataSourceId =
  | "meituan"
  | "internal-conversion"
  | "project-price-cost"
  | "douyin-feed"
  | "tencent-gdt"
  | "amap"
  | "competitor-intelligence";

export type DataSourceCategory = "ad" | "conversion" | "finance" | "market";

export type DataSource = {
  id: DataSourceId;
  config: DataSourceConfig;
  name: string;
  shortName: string;
  category: DataSourceCategory;
  sourceType: string;
  uploadMethod: string;
  status: DataSourceConfig["status"];
  requiredForScore: boolean;
  participatesInCalculation: boolean;
  description: string;
  standardFields: readonly StandardDataField[];
  requiredFields: string[];
  recommendedFields: string[];
  fieldMappingStatus: DataSourceConfig["fieldMappingStatus"];
};

const categoryMap: Record<DataSourceConfig["category"], DataSourceCategory> = {
  广告平台: "ad",
  "后端承接/成交数据源": "conversion",
  经营规则表: "finance",
  市场参考数据: "market",
};

function getStandardFields(source: DataSourceConfig): readonly StandardDataField[] {
  if (source.key === "project_cost") {
    return ["project", "revenue", "project_cost", "gross_profit"];
  }

  if (source.key === "competitor") {
    return ["platform", "project", "revenue", "failure_reason"];
  }

  return STANDARD_DATA_FIELDS;
}

export const DATA_SOURCES: DataSource[] = dataSources.map((source) => ({
  id: source.legacyId as DataSourceId,
  config: source,
  name: source.name,
  shortName: source.shortName,
  category: categoryMap[source.category],
  sourceType: source.category,
  uploadMethod: source.supportedFormats.join(" / "),
  status: source.status,
  requiredForScore: source.participatesInScoring,
  participatesInCalculation: source.participatesInCalculation,
  description: source.description,
  standardFields: getStandardFields(source),
  requiredFields: source.requiredFields,
  recommendedFields: source.recommendedFields,
  fieldMappingStatus: source.fieldMappingStatus,
}));

export const AD_SOURCE_IDS: DataSourceId[] = [
  "meituan",
  "douyin-feed",
  "tencent-gdt",
  "amap",
];

export const REQUIRED_OPERATION_SOURCE_IDS: DataSourceId[] = [
  "meituan",
  "internal-conversion",
  "project-price-cost",
];

export function getDataSource(sourceId: DataSourceId) {
  return DATA_SOURCES.find((source) => source.id === sourceId);
}

export function getDataSourceName(sourceId: DataSourceId) {
  return getDataSource(sourceId)?.name ?? getDataSourceByLegacyId(sourceId)?.name ?? sourceId;
}

export function getAdDataSources() {
  return DATA_SOURCES.filter((source) => source.category === "ad");
}
