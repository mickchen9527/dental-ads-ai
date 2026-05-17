import type { DataQualityResult } from "@/lib/quality";
import { formatPercent } from "@/lib/metrics";

type QualityScoreCardProps = {
  result: DataQualityResult;
};

export function QualityScoreCard({ result }: QualityScoreCardProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-cyan-700">数据质量评分</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-semibold text-slate-950">
              {result.score}
            </span>
            <span className="pb-1 text-sm font-medium text-slate-500">
              分 · {result.grade}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {result.summary}
          </p>
        </div>
        <span className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          是否建议重大调整：{result.majorAdjustmentAdvice}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="字段完整率" value={formatPercent(result.fieldCompleteness)} />
        <Metric label="e看牙记录匹配率" value={formatPercent(result.ekanyaMatchRate)} />
        <Metric label="平台线索回流率" value={formatPercent(result.platformLeadReturnRate)} />
        <Metric label="成交金额完整率" value={formatPercent(result.revenueCompleteness)} />
      </dl>

      <div className="mt-4 space-y-2">
        {result.issues.map((issue) => (
          <div
            key={`${issue.title}-${issue.detail}`}
            className={`rounded-md border p-3 ${
              issue.level === "error"
                ? "border-rose-100 bg-rose-50"
                : "border-amber-100 bg-amber-50"
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">
              {issue.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {issue.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
