import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { projectAnalysisRows, riskBoundaryNotes } from "@/lib/v12-static-data";

const headers = [
  "项目名称",
  "项目类型",
  "当前消耗",
  "咨询数",
  "有效咨询数",
  "预约数",
  "到院数",
  "成交数",
  "成交金额",
  "成交成本",
  "ROI",
  "毛利ROI",
  "观察周期",
  "当前判断",
  "建议动作",
];

export default function ProjectAnalysisPage() {
  return (
    <AppShell activeHref="/project-analysis">
      <PageHeader
        eyebrow="项目维度经营判断"
        title="项目分析"
        description="补齐口腔常见经营项目，按项目类型、转化链路、ROI、毛利ROI和观察周期做静态经营判断。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        {riskBoundaryNotes.join(" ")}
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1680px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projectAnalysisRows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className="px-4 py-3 text-slate-700">
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
