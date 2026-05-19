import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RecommendationCard } from "@/components/recommendation-card";
import { qualityResult, recommendations, REPORT_DATE } from "@/lib/mock-data";

const reportSections = [
  "今日核心判断",
  "平台表现",
  "项目表现",
  "调预算建议",
  "调价建议",
  "素材优化建议",
  "明日动作清单",
  "风险提醒",
];

export default function ReportsPage() {
  return (
    <AppShell activeHref="/reports">
      <PageHeader
        eyebrow="静态报告结构"
        title="历史报告"
        description="V1.1 展示静态日报结构，后续接入 OpenAI API 前先由系统完成结构化计算。"
      />

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">
            {REPORT_DATE} 经营日报
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">数据质量</dt>
              <dd className="font-semibold text-slate-950">
                {qualityResult.score}分 · {qualityResult.grade}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">当前已支持数据源</dt>
              <dd className="font-semibold text-slate-950">
                美团、e看牙、项目价格管理
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">已开放但暂不参与计算的数据源</dt>
              <dd className="font-semibold text-slate-950">
                抖音、腾讯广点通、竞品情报
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">
            报告章节
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {reportSections.map((section, index) => (
              <div
                key={section}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {index + 1}. {section}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6">
        <h3 className="mb-3 text-base font-semibold text-slate-950">
          已进入报告的动作建议
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.slice(0, 2).map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
