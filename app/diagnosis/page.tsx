import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { diagnosisNodes } from "@/lib/v12-static-data";

const headers = ["问题位置", "诊断方向", "可能原因", "检查数据", "建议动作", "是否需要人工确认"];

export default function DiagnosisPage() {
  return (
    <AppShell activeHref="/diagnosis">
      <PageHeader
        eyebrow="决策中心"
        title="问题诊断中心"
        description="用诊断树定位经营问题发生在哪一段漏斗，先定位问题，再决定是否调预算、调素材或调价格。"
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
            {diagnosisNodes.map((row) => (
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
