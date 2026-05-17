import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { dataSources } from "@/lib/config/dataSources";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

const projectMappings = [
  "种植牙 / 单颗种植 / 老人种牙 / 进口种植 -> 种植",
  "隐形矫正 / 时代天使 / 正畸 / 牙套 -> 正畸",
  "洗牙 / 洁牙 / 超声波洁牙 -> 洁牙",
  "补牙 / 树脂补牙 / 儿童补牙 -> 补牙",
];

const leadLevels = [
  "A类：高意向，有明确项目和时间，愿意预约",
  "B类：中意向，有需求但仍在比较",
  "C类：低意向，只问价格，不愿留资",
  "D类：无效，误点、同行、区域不符、无需求",
];

const observationCycles = [
  "洁牙/补牙：1-3天",
  "拔牙/儿牙：3-7天",
  "正畸：7-30天",
  "单颗种植：7-30天",
  "半口/全口种植：15-60天",
];

const competitorConfidence = [
  "A类：页面明确说明包含内容、限制条件清楚",
  "B类：只看到展示价格，但条件不完整",
  "C类：评论/广告里看到，未经确认",
];

export default function SettingsPage() {
  return (
    <AppShell activeHref="/settings">
      <PageHeader
        eyebrow="系统配置"
        title="系统设置"
        description="集中维护数据源接入状态、字段映射、项目映射、线索分级和观察周期。当前仍为静态配置展示。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        {pendingIntegrationNote}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">
          数据源接入状态与字段映射状态
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">数据源</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">字段映射状态</th>
                <th className="px-4 py-3">是否参与评分</th>
                <th className="px-4 py-3">是否参与计算</th>
                <th className="px-4 py-3">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataSources.map((source) => (
                <tr key={source.key}>
                  <td className="px-4 py-3 font-semibold text-slate-950">
                    {source.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{source.statusLabel}</td>
                  <td className="px-4 py-3 text-slate-600">{source.fieldMappingStatus}</td>
                  <td className="px-4 py-3 text-slate-600">{source.participatesInScoring ? "是" : "否"}</td>
                  <td className="px-4 py-3 text-slate-600">{source.participatesInCalculation ? "是" : "否"}</td>
                  <td className="px-4 py-3 text-slate-600">{source.calculationNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <InfoBlock title="项目映射规则" items={projectMappings} note="如果项目映射不统一，项目分析和 ROI 计算会出现偏差。" />
        <InfoBlock title="线索质量分级" items={leadLevels} />
        <InfoBlock title="项目观察周期" items={observationCycles} />
        <InfoBlock title="竞品可信度等级" items={competitorConfidence} note="竞品价格仅供内部经营参考，不建议直接作为调价依据。" />
      </section>
    </AppShell>
  );
}

function InfoBlock({ title, items, note }: { title: string; items: string[]; note?: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {note ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {note}
        </p>
      ) : null}
    </article>
  );
}
