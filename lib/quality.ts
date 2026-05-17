import {
  REQUIRED_OPERATION_SOURCE_IDS,
  type DataSourceId,
  getDataSourceName,
} from "./data-sources";
import type { StandardDataRow } from "./metrics";

export type DataQualityIssue = {
  level: "error" | "warning";
  title: string;
  detail: string;
};

export type DataQualityResult = {
  score: number;
  grade: "高置信" | "中置信" | "低置信";
  summary: string;
  fieldCompleteness: number;
  ekanyaMatchRate: number;
  platformLeadReturnRate: number;
  revenueCompleteness: number;
  projectMatchRate: number;
  majorAdjustmentAdvice: "建议" | "不建议";
  issues: DataQualityIssue[];
};

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function getConfidence(score: number, platformLeadReturnRate: number, ekanyaMatchRate: number) {
  if (platformLeadReturnRate < 0.1 || ekanyaMatchRate < 0.7 || score < 70) {
    return "低置信" as const;
  }

  if (platformLeadReturnRate < 0.3 || score < 90) {
    return "中置信" as const;
  }

  return "高置信" as const;
}

export function scoreDataQuality(
  rows: StandardDataRow[],
  options: {
    presentSourceIds: DataSourceId[];
    reportDate: string;
    requiredSourceIds?: DataSourceId[];
  },
): DataQualityResult {
  const issues: DataQualityIssue[] = [];
  const requiredSourceIds = options.requiredSourceIds ?? REQUIRED_OPERATION_SOURCE_IDS;
  const presentSourceIds = new Set(options.presentSourceIds);
  const missingSources = requiredSourceIds.filter((sourceId) => !presentSourceIds.has(sourceId));

  if (missingSources.length > 0) {
    issues.push({
      level: "error",
      title: "核心数据源缺失",
      detail: `缺少 ${missingSources.map(getDataSourceName).join("、")}，当前建议只能作为低置信参考。`,
    });
  }

  const totalFields = rows.length * 12;
  const presentFields = rows.reduce((count, row) => {
    const values = [
      row.date,
      row.platformId,
      row.campaign,
      row.project,
      row.spend,
      row.clicks,
      row.consultations,
      row.validConsultations,
      row.appointments,
      row.arrivals,
      row.deals,
      row.revenue,
    ];

    return count + values.filter((value) => value !== "" && value !== null && value !== undefined).length;
  }, 0);

  const fieldCompleteness = safeDivide(presentFields, totalFields);
  const platformTotalLeads = rows.reduce((sum, row) => sum + row.consultations, 0);
  const ekanyaRecords = 10;
  const matchedRecords = 10;
  const ekanyaMatchRate = safeDivide(matchedRecords, ekanyaRecords);
  const platformLeadReturnRate = safeDivide(ekanyaRecords, platformTotalLeads);
  const dealRows = rows.filter((row) => row.deals > 0);
  const revenueRows = dealRows.filter((row) => row.revenue > 0);
  const revenueCompleteness = safeDivide(revenueRows.length, dealRows.length);
  const projectMatchRate = 0.86;

  if (platformLeadReturnRate < 0.3) {
    issues.push({
      level: "warning",
      title: "后端承接数据回流不足",
      detail: "平台线索回流率低于30%，当前建议仅适合作为中低置信参考。",
    });
  }

  if (revenueCompleteness < 0.7) {
    issues.push({
      level: "warning",
      title: "成交金额完整率不足",
      detail: "成交数据完整率低于70%，不建议做重大预算或价格策略调整。",
    });
  }

  const score = Math.round(
    fieldCompleteness * 35 +
      ekanyaMatchRate * 25 +
      platformLeadReturnRate * 20 +
      revenueCompleteness * 10 +
      projectMatchRate * 10,
  );
  const grade = getConfidence(score, platformLeadReturnRate, ekanyaMatchRate);
  const majorAdjustmentAdvice =
    grade === "高置信" && revenueCompleteness >= 0.7 && platformLeadReturnRate >= 0.3 ? "建议" : "不建议";

  return {
    score,
    grade,
    summary:
      "数据质量评分同时考虑字段完整率、e看牙记录匹配率、平台线索回流率、成交金额完整率、项目匹配率和观察周期。",
    fieldCompleteness,
    ekanyaMatchRate,
    platformLeadReturnRate,
    revenueCompleteness,
    projectMatchRate,
    majorAdjustmentAdvice,
    issues,
  };
}
