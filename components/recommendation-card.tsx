import type { Recommendation } from "@/lib/mock-data";
import { SourceBadge } from "./source-badge";

type RecommendationCardProps = {
  recommendation: Recommendation;
};

const confidenceClasses = {
  高置信: "bg-emerald-50 text-emerald-700",
  中置信: "bg-amber-50 text-amber-800",
  低置信: "bg-rose-50 text-rose-700",
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              {recommendation.type}
            </span>
            <span className={`rounded-md px-2 py-1 text-xs font-medium ${confidenceClasses[recommendation.confidence]}`}>
              AI建议置信度：{recommendation.confidence}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-slate-950">
            {recommendation.action}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            涉及平台：{recommendation.platform} · 涉及项目：{recommendation.project}
          </p>
        </div>
        <span className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          是否需要人工确认：{recommendation.needsHumanReview}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {recommendation.sourceIds.map((sourceId) => (
          <SourceBadge key={sourceId} sourceId={sourceId} />
        ))}
      </div>

      <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="建议动作" value={recommendation.action} />
        <Field label="数据周期" value={recommendation.dataCycle} />
        <Field label="样本量" value={recommendation.sampleSize} />
        <Field label="数据依据" value={recommendation.evidence} />
        <Field label="判断原因" value={recommendation.reason} />
        <Field label="风险提醒" value={recommendation.risk} />
        <Field label="观察周期" value={recommendation.observationCycle} />
        <Field label="是否基于完整成交回流" value={recommendation.completeRevenueReturn} />
        <Field label="是否需要人工确认" value={recommendation.needsHumanReview} />
      </dl>

      {recommendation.confidence === "低置信" ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900">
          低置信：当前数据质量不足，不建议直接执行重大调整。
        </div>
      ) : null}

      {recommendation.completeRevenueReturn === "否" ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          后端承接数据回流不足，建议仅作为参考。
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          采纳建议
        </button>
        <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">
          继续观察
        </button>
        <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          不采纳
        </button>
        <button className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          记录执行
        </button>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}
