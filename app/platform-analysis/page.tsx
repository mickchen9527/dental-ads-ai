import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PlatformOverviewBoard } from "@/components/platform-overview-board";
import { PlatformPerformanceTable } from "@/components/platform-performance-table";
import { dataSources } from "@/lib/config/dataSources";
import { standardRows } from "@/lib/mock-data";
import {
  formatCurrency,
  formatNumber,
  getRowsByAdSource,
} from "@/lib/metrics";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

const platformStatus = [
  ["美团", "已支持，参与当前计算。", "emerald"],
  ["抖音信息流", "入口已开放，当前为示例/预留数据，暂不参与真实计算。", "amber"],
  ["腾讯广点通", "入口已开放，当前为示例/预留数据，暂不参与真实计算。", "amber"],
  ["高德", "入口已开放，当前为示例/预留数据，暂不参与真实计算。", "amber"],
  ["大众点评", "市场与竞品公开页面参考，不参与当前计算。", "slate"],
  ["小红书", "内容参考平台，当前不参与计算。", "slate"],
  ["e看牙", "后端承接/成交数据源，用于转化归因。", "cyan"],
  ["竞品情报", "市场参考数据，不参与当前平台实收 ROI 计算。", "slate"],
] as const;

export default function PlatformAnalysisPage() {
  const platformRows = getRowsByAdSource(standardRows);

  return (
    <AppShell activeHref="/platform-analysis">
      <PageHeader
        eyebrow="平台接入口径"
        title="多平台统一看板"
        description="当前只看平台前端数据和平台线索，不代表最终成交效果。最终到院、成交和实收要看多平台 + e看牙闭环。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        {pendingIntegrationNote}
      </section>

      <PlatformOverviewBoard />

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {platformStatus.map(([title, description, tone]) => (
          <StatusCard key={title} title={title} description={description} tone={tone} />
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {platformRows.map(({ sourceId, metrics }) => {
          const source = dataSources.find((item) => item.legacyId === sourceId);
          const isSupported = source?.status === "已支持计算";

          return (
            <MetricCard
              key={sourceId}
              label={source?.name ?? sourceId}
              value={isSupported ? formatCurrency(metrics.spend) : "暂不参与计算"}
              helper={
                isSupported
                  ? `咨询 ${formatNumber(metrics.consultations)}，成交 ${formatNumber(metrics.deals)}`
                  : "示例入口，当前不参与核心计算"
              }
              tone={isSupported ? "cyan" : "amber"}
            />
          );
        })}
      </div>

      <section className="mt-6">
        <PlatformPerformanceTable rows={platformRows} />
      </section>
    </AppShell>
  );
}

function StatusCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "emerald" | "amber" | "cyan" | "slate";
}) {
  const classes = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    amber: "border-amber-100 bg-amber-50 text-amber-900",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-800",
    slate: "border-slate-200 bg-white text-slate-700",
  };

  return (
    <article className={`rounded-md border p-4 ${classes[tone]}`}>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-xs leading-5">{description}</p>
    </article>
  );
}
