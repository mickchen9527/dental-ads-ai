import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceStrip } from "@/components/data-source-strip";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { QualityScoreCard } from "@/components/quality-score-card";
import { RecommendationCard } from "@/components/recommendation-card";
import {
  pendingDataSourceText,
  pendingScoringNotice,
  supportedDataSourceText,
} from "@/lib/config/dataSources";
import { qualityResult, recommendations, standardRows, uploadedDataSourceIds } from "@/lib/mock-data";
import {
  formatCurrency,
  formatMultiplier,
  formatNumber,
  summarizeRows,
} from "@/lib/metrics";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

const quickLinks = [
  {
    href: "/tasks",
    title: "今日执行清单",
    description: "把系统建议拆成今日必须处理、建议处理和继续观察任务。",
  },
  {
    href: "/alerts",
    title: "异常预警",
    description: "查看消耗、咨询成本、到院率、毛利ROI等异常信号。",
  },
  {
    href: "/upload",
    title: "数据上传",
    description: "查看美团、e看牙、项目价格表和已开放入口的数据源。",
  },
  {
    href: "/data-quality",
    title: "数据质量检测",
    description: "上传数据后先检查完整性和匹配率，避免建议基于错误数据。",
  },
  {
    href: "/metric-center",
    title: "指标公式中心",
    description: "查看CTR、CPC、CPA、ROI、毛利ROI等指标公式。",
  },
  {
    href: "/action-logs",
    title: "操作记录",
    description: "记录系统建议是否执行，追踪3天和7天效果。",
  },
  {
    href: "/knowledge",
    title: "投放知识库",
    description: "查看指标、投放判断、价格策略、素材和每日流程手册。",
  },
  {
    href: "/creative-lab",
    title: "素材生产中心",
    description: "查看素材诊断、方向推荐、脚本预览和视频提示词。",
  },
  {
    href: "/version-roadmap",
    title: "版本路线说明",
    description: "了解当前版本能力边界和后续接入计划。",
  },
];

export default function DashboardPage() {
  const metrics = summarizeRows(standardRows);

  return (
    <AppShell activeHref="/dashboard">
      <PageHeader
        eyebrow="V1.2 操作系统"
        title="首页驾驶舱"
        description="当前首页基于 V1 已支持数据源展示经营汇总、数据质量、执行入口和建议卡。所有建议仅作辅助决策，必须人工确认。"
      />

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="总消耗" value={formatCurrency(metrics.spend)} helper="当前 V1 已支持数据源汇总" tone="cyan" />
        <MetricCard label="总咨询" value={formatNumber(metrics.consultations)} helper="来自美团推广数据的前端线索口径" tone="slate" />
        <MetricCard label="成交金额" value={formatCurrency(metrics.revenue)} helper="来自 e看牙承接/成交数据回流" tone="emerald" />
        <MetricCard label="毛利ROI" value={formatMultiplier(metrics.grossProfitRoi)} helper="毛利 / 广告消耗" tone="amber" />
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="有效咨询数" value={formatNumber(metrics.validConsultations)} helper="有效咨询汇总" />
        <MetricCard label="预约数" value={formatNumber(metrics.appointments)} helper="后端承接预约" />
        <MetricCard label="到院数" value={formatNumber(metrics.arrivals)} helper="到院转化记录" />
        <MetricCard label="成交数" value={formatNumber(metrics.deals)} helper="成交回流记录" />
        <MetricCard label="今日建议数" value={formatNumber(recommendations.length)} helper="规则建议卡数量" />
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">数据源口径</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Meta label="已支持数据源" value={supportedDataSourceText} />
            <Meta label="已开放但暂不参与计算的数据源" value={pendingDataSourceText} />
            <Meta label="AI建议置信度" value={qualityResult.grade} />
            <Meta label="是否建议重大调整" value={qualityResult.majorAdjustmentAdvice} />
          </dl>
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
            {pendingScoringNotice}
            <br />
            {pendingIntegrationNote}
          </p>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">快捷入口</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <QuickLink key={link.href} {...link} />
            ))}
          </div>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DataSourceStrip presentSourceIds={uploadedDataSourceIds} />
        <QualityScoreCard result={qualityResult} />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {recommendations.slice(0, 2).map((recommendation) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}
      </section>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-cyan-200 hover:bg-cyan-50">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
    </Link>
  );
}
