import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import { TimeScopeFilter } from "@/components/time-scope-filter";
import { UploadedDataManager } from "@/components/uploaded-data-manager";

const rows = [
  ["美团", "42", "28", "19", "12", "¥18,600.00", "来源较清楚，继续补成交备注"],
  ["抖音", "8", "5", "1", "0", "¥0.00", "来源记录少，先补前台登记"],
  ["腾讯广点通", "6", "4", "3", "1", "¥268.00", "样本少，先观察"],
  ["高德", "5", "2", "3", "2", "¥1,040.00", "自然到店和广告到店要分开记"],
];

const uploadedRows = [
  ["ekanya-source-20260513-0519.csv", "患者来源分析", "近 7 天", "2026-05-19 09:25", "61", "解析成功", "是"],
  ["ekanya-visit-20260513-0519.csv", "患者就诊分析", "近 7 天", "2026-05-19 09:28", "26", "解析成功", "是"],
  ["ekanya-payment-20260513-0519.csv", "成交收费明细", "近 7 天", "2026-05-19 09:31", "15", "需要复核", "是"],
];

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

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="本周回流客户" value="61" helper="e看牙里能看到来源的平台客户" tone="cyan" />
        <MetricCard label="到院数" value="26" helper="已经到院的客户数" />
        <MetricCard label="成交数" value="15" helper="已成交客户数" tone="emerald" />
        <MetricCard label="实收金额" value="¥19,908.00" helper="以 e看牙实际实收为准" tone="amber" />
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["平台", "来源客户数", "预约数", "到院数", "成交数", "实收金额", "大白话判断"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
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
        description="这里管理 e看牙回流文件：患者来源分析、患者就诊分析、成交收费明细。来源不清时，先补记录再看预算建议。"
        filters={["文件名", "数据类型", "日期范围", "来源平台", "项目"]}
        rows={uploadedRows}
      />

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
