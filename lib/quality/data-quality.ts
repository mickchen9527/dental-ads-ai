export type StaticDataQualityResult = {
  hasMeituan: boolean;
  hasEkanya: boolean;
  hasPricing: boolean;
  fieldCompletenessRate: number;
  ekanyaRecordMatchRate: number;
  platformLeadReturnRate: number;
  projectMatchRate: number;
  revenueCompletenessRate: number;
  score: number;
  confidence: "高置信" | "中置信" | "低置信";
  recommendMajorAdjustment: boolean;
};

export const staticDataQualityResult: StaticDataQualityResult = {
  hasMeituan: true,
  hasEkanya: true,
  hasPricing: true,
  fieldCompletenessRate: 0.91,
  ekanyaRecordMatchRate: 1,
  platformLeadReturnRate: 0.026,
  projectMatchRate: 0.86,
  revenueCompletenessRate: 0.68,
  score: 62,
  confidence: "低置信",
  recommendMajorAdjustment: false,
};

export function calculateDataQuality() {
  return staticDataQualityResult;
}
