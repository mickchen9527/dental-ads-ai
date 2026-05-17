import { AD_SOURCE_IDS, type DataSourceId } from "./data-sources";

export type StandardDataRow = {
  date: string;
  platformId: DataSourceId;
  account: string;
  campaign: string;
  adGroup: string;
  creative: string;
  store: string;
  project: string;
  spend: number;
  impressions: number;
  clicks: number;
  consultations: number;
  validConsultations: number;
  appointments: number;
  arrivals: number;
  deals: number;
  revenue: number;
  projectCost: number;
  grossProfit: number;
  failureReason?: string;
};

export type MetricSummary = {
  spend: number;
  impressions: number;
  clicks: number;
  consultations: number;
  validConsultations: number;
  appointments: number;
  arrivals: number;
  deals: number;
  revenue: number;
  projectCost: number;
  grossProfit: number;
  ctr: number;
  cpc: number;
  consultationCost: number;
  validConsultationRate: number;
  validConsultationCost: number;
  appointmentRate: number;
  arrivalRate: number;
  dealRate: number;
  dealCost: number;
  roi: number;
  grossProfitRoi: number;
};

export type GroupedMetricSummary = {
  key: string;
  rows: StandardDataRow[];
  metrics: MetricSummary;
};

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function summarizeRows(rows: StandardDataRow[]): MetricSummary {
  const totals = rows.reduce(
    (summary, row) => ({
      spend: summary.spend + row.spend,
      impressions: summary.impressions + row.impressions,
      clicks: summary.clicks + row.clicks,
      consultations: summary.consultations + row.consultations,
      validConsultations:
        summary.validConsultations + row.validConsultations,
      appointments: summary.appointments + row.appointments,
      arrivals: summary.arrivals + row.arrivals,
      deals: summary.deals + row.deals,
      revenue: summary.revenue + row.revenue,
      projectCost: summary.projectCost + row.projectCost,
      grossProfit: summary.grossProfit + row.grossProfit,
    }),
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      consultations: 0,
      validConsultations: 0,
      appointments: 0,
      arrivals: 0,
      deals: 0,
      revenue: 0,
      projectCost: 0,
      grossProfit: 0,
    },
  );

  return {
    ...totals,
    ctr: safeDivide(totals.clicks, totals.impressions),
    cpc: safeDivide(totals.spend, totals.clicks),
    consultationCost: safeDivide(totals.spend, totals.consultations),
    validConsultationRate: safeDivide(
      totals.validConsultations,
      totals.consultations,
    ),
    validConsultationCost: safeDivide(
      totals.spend,
      totals.validConsultations,
    ),
    appointmentRate: safeDivide(
      totals.appointments,
      totals.validConsultations,
    ),
    arrivalRate: safeDivide(totals.arrivals, totals.appointments),
    dealRate: safeDivide(totals.deals, totals.arrivals),
    dealCost: safeDivide(totals.spend, totals.deals),
    roi: safeDivide(totals.revenue, totals.spend),
    grossProfitRoi: safeDivide(totals.grossProfit, totals.spend),
  };
}

export function groupRows(
  rows: StandardDataRow[],
  getKey: (row: StandardDataRow) => string,
): GroupedMetricSummary[] {
  const grouped = new Map<string, StandardDataRow[]>();

  rows.forEach((row) => {
    const key = getKey(row);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  });

  return Array.from(grouped.entries()).map(([key, groupRowsValue]) => ({
    key,
    rows: groupRowsValue,
    metrics: summarizeRows(groupRowsValue),
  }));
}

export function getRowsByAdSource(rows: StandardDataRow[]) {
  return AD_SOURCE_IDS.map((sourceId) => ({
    sourceId,
    rows: rows.filter((row) => row.platformId === sourceId),
    metrics: summarizeRows(rows.filter((row) => row.platformId === sourceId)),
  }));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMultiplier(value: number) {
  return `${value.toFixed(2)}x`;
}
