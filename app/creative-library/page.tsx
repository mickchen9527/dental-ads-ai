import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TemporaryWorkflowNotice } from "@/components/temporary-workflow-notice";
import { creativeRows, pendingIntegrationNote } from "@/lib/v12-static-data";

const headers = [
  "素材名称",
  "平台",
  "项目",
  "素材类型",
  "开头类型",
  "主卖点",
  "价格表达",
  "目标人群",
  "是否低价强刺激",
  "是否医生出镜",
  "是否真实场景",
  "投放日期",
  "消耗",
  "点击率",
  "咨询成本",
  "有效咨询率",
  "到院率",
  "成交成本",
  "实收 ROI",
  "系统评分",
  "建议动作",
];

const filters = [
  ["平台", "美团", "抖音（入口已开放/示例数据）", "腾讯广点通（入口已开放/示例数据）"],
  ["项目", "种植", "正畸", "洁牙", "补牙", "儿牙", "修复", "牙周", "美白", "贴面"],
  ["素材类型", "低价型", "医生讲解型", "信任型", "科普型", "案例型", "方案评估型"],
  ["状态", "测试中", "建议放量", "建议暂停", "继续观察"],
];

export default function CreativeLibraryPage() {
  return (
    <AppShell activeHref="/creative-library">
      <PageHeader
        eyebrow="分析中心"
        title="素材库"
        description="素材好不好不能只看播放量和点击率，要结合有效咨询率、到院率、成交成本和实收 ROI。"
      />

      <TemporaryWorkflowNotice kind="reserved" />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        {pendingIntegrationNote}
      </section>

      <section className="mb-6 space-y-3 rounded-md border border-slate-200 bg-white p-4">
        {filters.map(([label, ...options]) => (
          <div key={label} className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-sm font-semibold text-slate-700">{label}</span>
            {options.map((option) => (
              <button key={option} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                {option}
              </button>
            ))}
          </div>
        ))}
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1800px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {creativeRows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
