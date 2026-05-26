import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { TemporaryWorkflowNotice } from "@/components/temporary-workflow-notice";
import { reviewRows, reviewSummary } from "@/lib/v12-static-data";

const headers = ["日期", "系统建议", "是否执行", "执行动作", "执行后3天结果", "执行后7天结果", "是否有效", "复盘结论"];

export default function ReviewPage() {
  return (
    <AppShell activeHref="/review">
      <PageHeader
        eyebrow="决策中心"
        title="复盘中心"
        description="复盘系统建议是否真的有效，帮助后续优化投放规则和人工判断标准。"
      />

      <TemporaryWorkflowNotice kind="reserved" />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {reviewSummary.map(([label, value]) => (
          <MetricCard key={label} label={label} value={value} helper="静态示例数据" />
        ))}
      </section>

      <section className="mt-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviewRows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
