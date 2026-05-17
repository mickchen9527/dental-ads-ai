import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { metricGroups } from "@/lib/v12-static-data";

export default function MetricCenterPage() {
  return (
    <AppShell activeHref="/metric-center">
      <PageHeader
        eyebrow="基础设置"
        title="指标公式中心"
        description="统一展示投放、咨询、承接、成本ROI、数据质量和素材指标的公式、解释、判断标准和建议动作。"
      />

      <div className="space-y-6">
        {metricGroups.map((group) => (
          <section key={group.title}>
            <h3 className="mb-3 text-base font-semibold text-slate-950">{group.title}</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map(([name, formula, explanation, high, low, causes, action]) => (
                <article key={name} className="rounded-md border border-slate-200 bg-white p-4">
                  <h4 className="text-base font-semibold text-slate-950">{name}</h4>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="公式" value={formula} />
                    <Field label="通俗解释" value={explanation} />
                    <Field label="数值偏高说明" value={high} />
                    <Field label="数值偏低说明" value={low} />
                    <Field label="常见原因" value={causes} />
                    <Field label="建议动作" value={action} />
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
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
