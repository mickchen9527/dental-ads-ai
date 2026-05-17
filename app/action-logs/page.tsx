import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { actionLogRows } from "@/lib/v12-static-data";

const headers = [
  "日期",
  "建议类型",
  "平台",
  "项目",
  "计划/素材",
  "系统建议",
  "是否执行",
  "执行动作",
  "执行前数据",
  "执行后3天结果",
  "执行后7天结果",
  "是否有效",
  "备注",
];

export default function ActionLogsPage() {
  return (
    <AppShell activeHref="/action-logs">
      <PageHeader
        eyebrow="执行闭环"
        title="操作记录"
        description="系统建议必须经过人工确认。执行后需要记录结果，否则无法判断建议是否有效。"
      />

      <section className="mb-6 flex flex-wrap gap-2">
        {["全部", "已执行", "未执行", "待复盘", "有效", "无效"].map((item) => (
          <button key={item} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            {item}
          </button>
        ))}
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1320px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {actionLogRows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Info title="3天复盘" text="已执行满3天，先看短期咨询、有效咨询和到院变化。" />
        <Info title="7天复盘" text="已执行满7天，再看成交成本、ROI和毛利ROI趋势。" />
        <Info title="高客单周期" text="种植、正畸等项目未满观察周期，不建议提前下结论。" />
      </section>
    </AppShell>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
