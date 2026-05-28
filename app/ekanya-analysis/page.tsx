import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import { TimeScopeFilter } from "@/components/time-scope-filter";

export default function EkanyaAnalysisPage() {
  return (
    <AppShell activeHref="/ekanya-analysis">
      <PageHeader
        eyebrow="后端闭环"
        title="e看牙回流分析"
        description="这里专门看前台和客服有没有把来源记录清楚。没有 e看牙回流，就不要急着调预算。"
        action={
          <PageHelpButton
            purpose="看平台来的客户有没有进入 e看牙，最后有没有预约、到院、成交和实收。"
            when="上传 e看牙回流数据后看。"
            focus={["来源客户数", "到院数", "成交数", "实收金额"]}
            next="来源不清楚时，先让前台补记录，再看平台效果。"
            mistakes={["不要只有平台点击就判断效果。", "不要把来源空白的客户算给某个平台。"]}
          />
        }
      />

      <TimeScopeFilter />

      <div className="mb-6">
        <StorageNote />
      </div>

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">暂无独立 e看牙静态回流结果。</p>
        <p>
          本页不再展示固定回流客户数、到院数、成交数和实收金额。请先上传并解析 e看牙后端回流数据，真实到院、成交和实收会在“项目分析”和“闭环 ROI 分析”中展示。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900" href="/upload">
            去数据上传页
          </a>
          <a className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/project-analysis">
            查看项目分析
          </a>
          <a className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800" href="/roi-analysis">
            查看闭环 ROI
          </a>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-cyan-200 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-cyan-950">数据来源</h3>
        <p className="mt-2 text-sm leading-6 text-cyan-900">
          数据来自已解析的 e看牙后端回流数据。如需上传、解析、停用或删除文件，请到数据上传页管理。
        </p>
        <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800" href="/upload">
          去数据上传页
        </a>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">周报提示</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">如需开周会，请到「项目分析」统一生成周报，避免 e看牙回流和平台花费口径分开看。</p>
        <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/project-analysis">
          去项目分析生成周报
        </a>
      </section>
    </AppShell>
  );
}
