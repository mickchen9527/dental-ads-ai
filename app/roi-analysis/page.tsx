import { AppShell } from "@/components/app-shell";
import { MeituanClosedLoopBoard } from "@/components/meituan-closed-loop-board";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import { TimeScopeFilter } from "@/components/time-scope-filter";
import { UploadedDataManager } from "@/components/uploaded-data-manager";

const roiRows = [
  ["美团", "¥12,800.00", "¥18,600.00", "1.45", "回收偏弱，先优化页面和承接"],
  ["抖音", "¥0.00", "¥0.00", "-", "等待上传数据"],
  ["腾讯广点通", "¥0.00", "¥268.00", "-", "等待广告花费数据"],
  ["高德", "¥0.00", "¥1,040.00", "-", "预留平台，先分清自然到店和广告到店"],
];

const uploadedRows = [
  ["meituan-20260513-0519.csv", "平台广告花费", "近 7 天", "2026-05-19 09:12", "386", "解析成功", "是"],
  ["ekanya-payment-20260513-0519.csv", "e看牙成交收费明细", "近 7 天", "2026-05-19 09:31", "15", "需要复核", "是"],
  ["ekanya-source-20260513-0519.csv", "e看牙患者来源分析", "近 7 天", "2026-05-19 09:25", "61", "解析成功", "是"],
];

export default function RoiAnalysisPage() {
  return (
    <AppShell activeHref="/roi-analysis">
      <PageHeader
        eyebrow="后端闭环"
        title="闭环 ROI 分析"
        description="这里统一看实收 ROI。实收 ROI = e看牙实际实收金额 / 广告花费。当前未配置项目真实成本，系统只计算实收 ROI，不计算毛利 ROI。"
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

      <MeituanClosedLoopBoard />

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="本周广告费" value="¥12,800.00" helper="当前已上传平台花费" tone="cyan" />
        <MetricCard label="e看牙实收" value="¥19,908.00" helper="以实际收费为准" tone="emerald" />
        <MetricCard label="实收 ROI" value="1.56" helper="实收金额 / 广告花费" tone="amber" />
        <MetricCard label="目标参考线" value="1:3" helper="不是所有项目当周必须达到" />
      </section>

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        ROI &lt; 1：当期回收很弱，需要重点关注；ROI 1-2：回收偏弱，先观察；ROI 2-3：接近可接受，继续优化；ROI ≥ 3：达到较健康参考线。种植、正畸、半口/全口项目要看 7-30 天甚至 15-60 天。
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["平台", "广告花费", "e看牙实收金额", "实收 ROI", "大白话判断"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roiRows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <UploadedDataManager
        title="已上传数据"
        description="这里管理闭环 ROI 需要用到的文件：平台广告花费、e看牙患者来源分析、e看牙成交收费明细。缺任何一类，都先别急着判断钱有没有回收。"
        filters={["文件名", "数据类型", "日期范围", "来源平台", "项目"]}
        rows={uploadedRows}
      />

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
