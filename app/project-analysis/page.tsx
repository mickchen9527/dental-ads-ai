import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { ProjectAnalysisLiveBoard } from "@/components/project-analysis-live-board";
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
  "实收 ROI",
  "项目价格说明",
  "观察周期",
  "当前判断",
  "建议动作",
];

const reportCsv = [
  ["统计周期", "按页面选择时间为准"],
  ["报告类型", "项目周报"],
  ["说明", "项目分析不是精准广告归因，而是把 e看牙回流按项目汇总，帮助开周会时看方向"],
  ["项目", "来源客户数", "到院数", "成交数", "实收金额", "当前判断"],
  ["示例", "请在页面读取真实数据后复盘", "", "", "", ""],
]
  .map((row) => row.join(","))
  .join("\n");

export default function ProjectAnalysisPage() {
  return (
    <AppShell activeHref="/project-analysis">
      <PageHeader
        eyebrow="项目维度经营判断"
        title="项目分析"
        description="这里读取 e看牙后端回流数据，按项目看来源、到院、成交和实收。当前是项目维度分析，不是精准广告归因。"
        action={
          <PageHelpButton
            purpose="看每个项目带来的客户、预约、到院、成交和实收表现。"
            when="想知道哪个项目该继续观察、哪个项目要先查承接、哪个项目不能急着下结论时看。"
            focus={["项目分类", "来源客户数", "到院数", "成交数", "实收金额", "观察周期"]}
            next="高客单项目继续追踪，低客单项目看后续转化，数据太少时先不要乱动。"
            mistakes={["不要把项目分析当成精准广告归因。", "不要只看单日成交。", "不要用洁牙的周期判断种植和正畸。"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">项目分析不是精准广告归因。</p>
        <p>
          这里先把 e看牙后端回流数据按项目放在一起看，帮助你判断哪些项目有来源、有到院、有成交和有实收。真正判断投放动作，还要结合平台前端数据、客服承接、医生面诊和观察周期。
        </p>
        <p className="mt-2">{riskBoundaryNotes.join(" ")}</p>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="e看牙回流摘要"
          items={["本页核心数据来自 ekanya_backflow_rows", "先上传并解析 e看牙后端回流数据", "来源、到院、成交和实收都要一起看", "数据少时不要急着下结论"]}
          href="/ekanya-analysis"
        />
        <SummaryCard
          title="闭环 ROI 摘要"
          items={["ROI 要结合广告花费看", "美团闭环可到闭环 ROI 页面查看", "项目页不做精准归因", "高客单项目继续看长周期"]}
          href="/roi-analysis"
        />
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">项目/投放周报生成入口</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            周报建议统一在项目分析里生成，因为这里能同时看平台、项目、e看牙回流和 ROI。当前先下载示例 CSV，不生成正式周报。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" type="button">
              生成项目/投放周报
            </button>
            <a
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(reportCsv)}`}
              download="project-weekly-report.csv"
            >
              下载 Excel 周报
            </a>
          </div>
        </article>
      </section>

      <ProjectAnalysisLiveBoard />

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">项目判断与建议</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          这里告诉你不同项目应该按什么周期判断，哪些可以继续观察，哪些需要处理，哪些不要急着下结论。下面仍保留静态经营规则，真实项目数据以上方“项目分类总览”为准。
        </p>
        <div className="mt-4 overflow-x-auto">
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
        </div>
      </section>
    </AppShell>
  );
}

function SummaryCard({ title, items, href }: { title: string; items: string[]; href: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Link className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href={href}>
        去查看详情
      </Link>
    </article>
  );
}