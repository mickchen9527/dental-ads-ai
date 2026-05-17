import { getDataSourceName, type DataSourceId } from "@/lib/data-sources";
import {
  formatCurrency,
  formatMultiplier,
  formatNumber,
  formatPercent,
  type MetricSummary,
} from "@/lib/metrics";

type PlatformPerformanceTableProps = {
  rows: {
    sourceId: DataSourceId;
    metrics: MetricSummary;
  }[];
};

export function PlatformPerformanceTable({ rows }: PlatformPerformanceTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
          <tr>
            <th className="px-4 py-3">平台</th>
            <th className="px-4 py-3">消耗</th>
            <th className="px-4 py-3">点击</th>
            <th className="px-4 py-3">有效咨询率</th>
            <th className="px-4 py-3">预约率</th>
            <th className="px-4 py-3">到院率</th>
            <th className="px-4 py-3">成交成本</th>
            <th className="px-4 py-3">ROI</th>
            <th className="px-4 py-3">毛利ROI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ sourceId, metrics }) => (
            <tr key={sourceId} className="text-slate-700">
              <td className="px-4 py-3 font-semibold text-slate-950">
                {getDataSourceName(sourceId)}
              </td>
              <td className="px-4 py-3">{formatCurrency(metrics.spend)}</td>
              <td className="px-4 py-3">{formatNumber(metrics.clicks)}</td>
              <td className="px-4 py-3">
                {formatPercent(metrics.validConsultationRate)}
              </td>
              <td className="px-4 py-3">
                {formatPercent(metrics.appointmentRate)}
              </td>
              <td className="px-4 py-3">
                {formatPercent(metrics.arrivalRate)}
              </td>
              <td className="px-4 py-3">
                {formatCurrency(metrics.dealCost)}
              </td>
              <td className="px-4 py-3">{formatMultiplier(metrics.roi)}</td>
              <td className="px-4 py-3">
                {formatMultiplier(metrics.grossProfitRoi)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
