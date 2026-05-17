import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { alertRows } from "@/lib/v12-static-data";

const headers = ["异常指标", "异常幅度", "可能原因", "建议动作", "观察周期", "关注状态"];

export default function AlertsPage() {
  return (
    <AppShell activeHref="/alerts">
      <PageHeader
        eyebrow="每日操作"
        title="异常预警"
        description="展示当前经营数据中的异常信号。预警只提示风险，不自动执行预算、价格或广告操作。"
      />

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alertRows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">
                    {index === 5 ? (
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        cell === "需要重点关注" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"
                      }`}>
                        {cell}
                      </span>
                    ) : cell}
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
