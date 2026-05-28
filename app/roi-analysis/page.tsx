import { AppShell } from "@/components/app-shell";
import { MultiPlatformClosedLoopBoard } from "@/components/multi-platform-closed-loop-board";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import { TimeScopeFilter } from "@/components/time-scope-filter";

export default function RoiAnalysisPage() {
  return (
    <AppShell activeHref="/roi-analysis">
      <PageHeader
        eyebrow="后端闭环"
        title="闭环 ROI 分析"
        description="这里用于查看多平台 + e看牙初步闭环。平台前端数据来自美团、抖音、腾讯广点通、高德；到院、成交、实收来自 e看牙后端回流。当前是初步闭环，不是精准归因。"
        action={
          <PageHelpButton
            purpose="把广告花费和 e看牙实收金额放在一起看，判断钱有没有回收。"
            when="上传平台花费和 e看牙成交收费后看。"
            focus={["广告花费", "实收金额", "实收 ROI", "观察周期"]}
            next="ROI低时先查回流和成交，不要马上降价。"
            mistakes={["不要把成交金额当利润。", "不要要求种植正畸当周都达到1:3。"]}
          />
        }
      />

      <TimeScopeFilter />

      <div className="mb-6">
        <StorageNote />
      </div>

      <section className="mb-6 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
        <p className="font-semibold">这里用于查看多平台 + e看牙初步闭环。</p>
        <p>平台前端数据来自美团、抖音、腾讯广点通、高德；到院、成交、实收来自 e看牙后端回流。</p>
        <p>当前是初步闭环，不是精准归因。</p>
      </section>

      <MultiPlatformClosedLoopBoard />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        本页只保留真实多平台闭环看板。没有真实解析数据时，不显示固定广告费、固定实收金额或固定 ROI。ROI 参考线只是判断口径，不代表所有项目当周都必须达到。
      </section>

      <section className="mt-6 rounded-md border border-cyan-200 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-cyan-950">数据来源</h3>
        <p className="mt-2 text-sm leading-6 text-cyan-900">
          数据来自已解析上传记录。如需管理文件，请到数据上传页。
        </p>
        <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800" href="/upload">
          去数据上传页
        </a>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">周报提示</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">如需生成周报，请到「项目分析」统一生成，避免多处周报口径不一致。</p>
        <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/project-analysis">
          去项目分析生成周报
        </a>
      </section>
    </AppShell>
  );
}
