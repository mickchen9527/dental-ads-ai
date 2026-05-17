import type { Recommendation } from "@/lib/mock-data";

export function RecommendationCard({ item }: { item: Recommendation }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-cyan-700">建议动作</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">{item.action}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {item.type} · {item.confidence}
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          需要人工确认：{item.needsHumanReview}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="涉及平台" value={item.platform} />
        <Field label="涉及项目" value={item.project} />
        <Field label="数据周期" value={item.dataCycle} />
        <Field label="样本量" value={item.sampleSize} />
        <Field label="数据依据" value={item.evidence} />
        <Field label="判断原因" value={item.reason} />
        <Field label="风险提醒" value={item.risk} />
        <Field label="观察周期" value={item.observationCycle} />
        <Field label="AI建议置信度" value={item.confidence} />
        <Field label="是否基于完整成交回流" value={item.completeRevenueReturn} />
      </dl>

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
