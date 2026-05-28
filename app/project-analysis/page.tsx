import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { ProjectAnalysisLiveBoard } from "@/components/project-analysis-live-board";

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
        <p className="mt-2">没有真实项目数据时，本页不会展示种植、正畸、洁牙、补牙等固定项目判断，也不会给出模拟建议。</p>
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
            周报已统一放到“多平台周报”页面生成。这里不再提供固定示例 CSV，避免把示例内容当作真实项目结论。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/reports">
              去多平台周报
            </Link>
          </div>
        </article>
      </section>

      <ProjectAnalysisLiveBoard />

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">项目判断与建议</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          这里不再展示固定项目建议。真实项目判断来自上方“项目分类总览”读取到的 e看牙回流数据；如果没有真实项目数据，请先上传并解析 e看牙后端回流数据。
        </p>
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          暂无单独的静态项目判断。请以上方真实项目分类表为准；如果上方为空，说明当前时间范围内暂无真实项目分析数据，请先上传并解析 e看牙回流数据。
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
