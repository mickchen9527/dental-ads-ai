import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceStrip } from "@/components/data-source-strip";
import { MetricCard } from "@/components/metric-card";
import { PageHelpButton } from "@/components/page-help-button";
import { PageHeader } from "@/components/page-header";
import { QualityScoreCard } from "@/components/quality-score-card";
import {
  pendingDataSourceText,
  pendingScoringNotice,
  supportedDataSourceText,
} from "@/lib/config/dataSources";
import { qualityResult, standardRows, uploadedDataSourceIds } from "@/lib/mock-data";
import {
  formatCurrency,
  formatMultiplier,
  formatNumber,
  summarizeRows,
} from "@/lib/metrics";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

const quickLinks = [
  {
    href: "/upload",
    title: "数据上传",
    description: "先上传平台数据和 e看牙回流数据。",
  },
  {
    href: "/data-quality",
    title: "数据质量检测",
    description: "上传数据后先检查完整性和匹配率，避免建议基于错误数据。",
  },
  {
    href: "/recommendations",
    title: "今日总建议",
    description: "跨平台汇总今天最该先处理、哪些先别乱动。",
  },
  {
    href: "/action-logs",
    title: "操作记录",
    description: "记录系统建议是否执行，追踪3天和7天效果。",
  },
  {
    href: "/platforms/meituan",
    title: "美团分析",
    description: "单独查看美团花费、客资、回流和周报。",
  },
  {
    href: "/platforms/douyin",
    title: "抖音分析",
    description: "查看抖音上传入口、素材线索和回流记录。",
  },
  {
    href: "/platforms/gdt",
    title: "腾讯广点通分析",
    description: "查看腾讯表单、电话线索和后端承接。",
  },
  {
    href: "/platforms/amap",
    title: "高德分析",
    description: "查看高德电话、导航、到店意向和回流。",
  },
  {
    href: "/ekanya-analysis",
    title: "e看牙回流分析",
    description: "确认钱和客户有没有进后端记录。",
  },
  {
    href: "/roi-analysis",
    title: "闭环 ROI 分析",
    description: "把广告花费和 e看牙实收放在一起看。",
  },
  {
    href: "/project-analysis",
    title: "项目分析",
    description: "按洁牙、补牙、种植等项目看实收表现。",
  },
  {
    href: "/reports",
    title: "周报生成",
    description: "汇总本周花费、回流、项目和建议动作。",
  },
  {
    href: "/metric-center",
    title: "指标公式中心",
    description: "查看CTR、CPC、CPA、实收 ROI 等指标公式。",
  },
  {
    href: "/knowledge",
    title: "投放知识库",
    description: "查看指标、投放链路和每日操作手册。",
  },
  {
    href: "/project-pricing",
    title: "项目价格管理",
    description: "维护 e看牙系统价、平台展示价和项目状态。",
  },
];

const todayAnswers = [
  {
    question: "今天数据传了吗？",
    status: "部分已传",
    detail: "美团和 e看牙用示例数据演示；抖音、腾讯广点通、高德等待上传真实文件。",
  },
  {
    question: "数据能不能用？",
    status: `${qualityResult.score}分 · ${qualityResult.grade}`,
    detail: "可以先看方向，但要先补齐后端回流，不建议直接做大调整。",
  },
  {
    question: "哪个平台今天花费最高？",
    status: "美团最高",
    detail: "示例数据里美团今日广告费 ¥1,280.00。接入数据库后会按每日上传数据自动更新。",
  },
  {
    question: "钱有没有通过 e看牙回流？",
    status: "已有部分回流",
    detail: "示例数据有实收记录，但来源字段还要继续补齐。",
  },
  {
    question: "今天最该处理哪 3 件事？",
    status: "补回流 / 看美团页面 / 记操作",
    detail: "先补 e看牙来源，再优化美团页面，最后把执行动作写进操作记录。",
  },
];

const topActions = [
  {
    title: "先补齐 e看牙来源记录",
    text: "前端有线索，后端记录不完整时，不要急着动预算。",
  },
  {
    title: "先优化美团页面",
    text: "美团有浏览但咨询偏弱，优先检查套餐标题、购买须知和咨询入口。",
  },
  {
    title: "高客单项目继续观察",
    text: "种植、正畸不要因为单日成交少就暂停，先看 7-30 天。",
  },
];

export default function DashboardPage() {
  const metrics = summarizeRows(standardRows);

  return (
    <AppShell activeHref="/dashboard">
      <PageHeader
        eyebrow="V1.4 傻瓜式工作台"
        title="首页驾驶舱"
        description="首页先回答今天该不该动手：数据传没传、数据能不能用、哪个平台花钱最多、钱有没有回到 e看牙、今天最该处理哪 3 件事。"
        action={
          <PageHelpButton
            purpose="这是每天打开系统的第一站，用大白话告诉你今天先看什么。"
            when="每天上班后、上传数据后、准备调预算前看。"
            focus={["数据是否上传", "数据质量", "最高花费平台", "e看牙回流", "今日三件事"]}
            next="按今日使用顺序做，做完一件就在操作记录里记下来。"
            mistakes={["不要一上来就调预算。", "不要没有 e看牙回流就下结论。", "不要只看当天成交。"]}
          />
        }
      />

      <section className="mb-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">今天先回答 5 个问题</h3>
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
            当前使用示例数据，接入数据库后会根据每日上传数据自动更新。
          </p>
          <div className="mt-4 grid gap-3">
            {todayAnswers.map((item) => (
              <article key={item.question} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-950">{item.question}</h4>
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-cyan-800 ring-1 ring-cyan-100">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">今日使用顺序</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>上传平台数据。</li>
            <li>上传 e看牙回流数据。</li>
            <li>查看数据质量。</li>
            <li>进入对应平台页面看分析。</li>
            <li>查看今日总建议。</li>
            <li>记录操作。</li>
            <li>周末生成周报。</li>
          </ol>
        </article>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="总消耗" value={formatCurrency(metrics.spend)} helper="当前 V1 已支持数据源汇总" tone="cyan" />
        <MetricCard label="总咨询" value={formatNumber(metrics.consultations)} helper="来自美团推广数据的前端线索口径" tone="slate" />
        <MetricCard label="成交金额" value={formatCurrency(metrics.revenue)} helper="来自 e看牙承接/成交数据回流" tone="emerald" />
        <MetricCard label="实收 ROI" value={formatMultiplier(metrics.roi)} helper="e看牙实际实收金额 / 广告花费" tone="amber" />
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="有效咨询数" value={formatNumber(metrics.validConsultations)} helper="有效咨询汇总" />
        <MetricCard label="预约数" value={formatNumber(metrics.appointments)} helper="后端承接预约" />
        <MetricCard label="到院数" value={formatNumber(metrics.arrivals)} helper="到院转化记录" />
        <MetricCard label="成交数" value={formatNumber(metrics.deals)} helper="成交回流记录" />
        <MetricCard label="今日总建议数" value={formatNumber(topActions.length)} helper="首页只摘取最重要3条" />
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

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950">今天最该处理 3 件事</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">这里摘取今日总建议的前三件事，完整建议去“今日总建议”页看。</p>
          </div>
          <Link className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/recommendations">
            查看今日总建议
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {topActions.map((item, index) => (
            <article key={item.title} className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <span className="text-xs font-semibold text-cyan-700">第 {index + 1} 件</span>
              <h4 className="mt-2 text-sm font-semibold text-slate-950">{item.title}</h4>
              <p className="mt-2 text-xs leading-5 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
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
