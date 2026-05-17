import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { pendingScoringNotice } from "@/lib/config/dataSources";
import { buildAnomalyRows, buildFieldMissingRows, buildMatchSummary, buildUploadDetectionRows } from "@/lib/quality/details";
import { qualityResult } from "@/lib/mock-data";
import { formatNumber, formatPercent } from "@/lib/metrics";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

export default function DataQualityPage() {
  const uploadRows = buildUploadDetectionRows();
  const fieldRows = buildFieldMissingRows();
  const matchSummary = buildMatchSummary();
  const anomalyRows = buildAnomalyRows();

  return (
    <AppShell activeHref="/data-quality">
      <PageHeader
        eyebrow="AI建议前置校验"
        title="数据质量检测"
        description="数据质量会直接影响AI建议准确性。若数据匹配率低、成交数据缺失或观察周期不足，系统建议只能作为低置信参考。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        <p>{pendingScoringNotice}</p>
        <p>{pendingIntegrationNote}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="数据质量评分" value={`${qualityResult.score}分`} helper="综合字段、匹配、回流和成交完整率" tone="cyan" />
        <MetricCard label="字段完整率" value={formatPercent(qualityResult.fieldCompleteness)} helper="核心字段存在比例" />
        <MetricCard label="e看牙记录匹配率" value={formatPercent(qualityResult.ekanyaMatchRate)} helper="已回流记录能否匹配广告来源" tone="emerald" />
        <MetricCard label="平台线索回流率" value={formatPercent(qualityResult.platformLeadReturnRate)} helper="前端线索进入后端承接的比例" tone="amber" />
        <MetricCard label="AI建议置信度" value={qualityResult.grade} helper="受回流率和匹配率共同约束" />
        <MetricCard label="是否建议重大调整" value={qualityResult.majorAdjustmentAdvice} helper="成交回流不足时不建议" tone="amber" />
      </section>

      {qualityResult.platformLeadReturnRate < 0.3 ? (
        <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
          后端承接数据回流不足，当前建议仅适合作为中低置信参考，不建议直接做重大预算或价格调整。
        </section>
      ) : null}

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">平台数据上传检测</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">数据类型</th>
                <th className="px-4 py-3">是否上传</th>
                <th className="px-4 py-3">上传日期</th>
                <th className="px-4 py-3">行数</th>
                <th className="px-4 py-3">字段状态</th>
                <th className="px-4 py-3">评分/计算状态</th>
                <th className="px-4 py-3">异常说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploadRows.map((row) => (
                <tr key={row.type}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{row.type}</td>
                  <td className="px-4 py-3 text-slate-600">{row.uploaded}</td>
                  <td className="px-4 py-3 text-slate-600">{row.date}</td>
                  <td className="px-4 py-3 text-slate-600">{row.rows}</td>
                  <td className="px-4 py-3 text-slate-600">{row.fieldStatus}</td>
                  <td className="px-4 py-3 text-slate-600">{row.scoring} / {row.calculation}</td>
                  <td className="px-4 py-3 text-slate-600">{row.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">数据匹配检测</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          e看牙记录匹配率高，只代表已回流记录能匹配来源；平台线索回流率低，说明大量前端线索没有进入后端承接数据，建议置信度需要降低。
        </p>
        <dl className="mt-4 grid gap-3 md:grid-cols-5">
          <Metric label="平台数据总线索数" value={formatNumber(matchSummary.totalPlatformLeads)} />
          <Metric label="e看牙承接记录数" value={formatNumber(matchSummary.ekanyaRecords)} />
          <Metric label="成功匹配数" value={formatNumber(matchSummary.successfulMatches)} />
          <Metric label="e看牙记录匹配率" value={formatPercent(matchSummary.ekanyaRecordMatchRate)} />
          <Metric label="平台线索回流率" value={formatPercent(matchSummary.platformLeadReturnRate)} />
        </dl>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <TableBlock
          title="字段缺失检测"
          headers={["字段", "是否存在", "缺失比例", "风险等级"]}
          rows={fieldRows.map((row) => [row.field, row.exists, formatPercent(row.missingRate), row.risk])}
        />
        <TableBlock
          title="数据异常检测"
          headers={["异常类型", "影响范围", "风险等级", "建议处理方式"]}
          rows={anomalyRows.map((row) => [row.type, row.scope, row.risk, row.action])}
        />
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">AI建议置信度说明</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Info title="高置信" text="数据完整、匹配率高、成交回流充分。" />
          <Info title="中置信" text="部分数据缺失、样本量一般、观察周期不足。" />
          <Info title="低置信" text="只有平台前端数据、缺少成交数据、匹配率低或样本量过少。" />
        </div>
      </section>
    </AppShell>
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

function TableBlock({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-600">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-md bg-slate-50 p-3">
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
