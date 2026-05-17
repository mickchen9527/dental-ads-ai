import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { targetRows } from "@/lib/v12-static-data";

const headers = [
  "项目",
  "目标咨询成本",
  "目标有效咨询成本",
  "目标预约率",
  "目标到院率",
  "目标成交率",
  "目标成交成本",
  "目标ROI",
  "目标毛利ROI",
  "观察周期",
];

export default function TargetsPage() {
  return (
    <AppShell activeHref="/targets">
      <PageHeader
        eyebrow="基础设置"
        title="目标值设置"
        description="展示各项目的目标成本、转化率、ROI和观察周期。第一版仅为静态目标值。"
      />

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {targetRows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">
                    {index === 0 ? <span className="font-semibold text-slate-950">{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
