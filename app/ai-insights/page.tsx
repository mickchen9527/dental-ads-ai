import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { qualityResult } from "@/lib/mock-data";
import { formatPercent } from "@/lib/metrics";

export default function AiInsightsPage() {
  return (
    <AppShell activeHref="/ai-insights">
      <PageHeader
        eyebrow="分析中心"
        title="AI分析中心"
        description="AI只是解释层，核心指标先由规则引擎计算。当前页面为静态原型，不接 OpenAI API。"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="分析周期" value="近7天" helper="用于经营判断的观察窗口" tone="cyan" />
        <MetricCard label="数据完整度" value={formatPercent(qualityResult.fieldCompleteness)} helper="核心字段完整情况" />
        <MetricCard label="平台数据与e看牙匹配率" value={formatPercent(qualityResult.ekanyaMatchRate)} helper="已回流记录来源匹配情况" tone="emerald" />
        <MetricCard label="AI建议置信度" value={qualityResult.grade} helper="受回流率和成交完整率约束" tone="amber" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Block title="输入数据摘要" items={["美团推广数据：已支持计算，参与计算", "e看牙承接/成交数据：已支持计算，参与回流判断", "项目价格管理：已支持计算，参与价格口径和目标判断", "抖音、腾讯广点通：入口已开放，暂不参与计算", "竞品情报：入口已开放，仅作市场参考"]} />
        <Block title="规则判断结果" items={["平台线索回流率偏低，建议置信度需要降低", "成交金额完整率不足，不建议重大价格或预算调整", "高客单项目观察周期不足时，只建议继续观察"]} />
        <Block title="AI生成建议" items={["解释为什么种植只能人工复核后小幅测试，不能大幅放量", "解释为什么洁牙优先优化价格表达，而不是直接降价", "整理明日动作清单，提醒人工确认"]} />
        <Block title="关注提醒" items={["成交回流不足会导致ROI误判，需要人工复核", "竞品价格可信度不完整时，只能作为内部参考", "模板字段已预留，抖音和腾讯广点通暂不影响当前评分"]} />
      </section>
    </AppShell>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
