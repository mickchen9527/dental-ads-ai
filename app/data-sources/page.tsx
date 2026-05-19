import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { dataSources } from "@/lib/config/dataSources";

export default function DataSourcesPage() {
  return (
    <AppShell activeHref="/data-sources">
      <PageHeader
        eyebrow="系统设置"
        title="数据源配置"
        description="这里看每类数据现在能不能参与计算。抖音、腾讯广点通入口已开放，但还要等字段映射完成后再参与计算。"
      />

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["数据源", "当前状态", "是否参与评分", "是否参与计算", "字段映射状态", "说明"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataSources.map((source) => (
              <tr key={source.key}>
                <td className="px-4 py-3 font-semibold text-slate-950">{source.name}</td>
                <td className="px-4 py-3 text-slate-700">{source.statusLabel}</td>
                <td className="px-4 py-3 text-slate-700">{source.participatesInScoring ? "是" : "否"}</td>
                <td className="px-4 py-3 text-slate-700">{source.participatesInCalculation ? "是" : "否"}</td>
                <td className="px-4 py-3 text-slate-700">{source.fieldMappingStatus}</td>
                <td className="px-4 py-3 text-slate-700">{source.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
