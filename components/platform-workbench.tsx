import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import { TemporaryWorkflowNotice } from "@/components/temporary-workflow-notice";
import type { PlatformWorkbenchData } from "@/lib/platform-workbench";

type PlatformWorkbenchProps = {
  data: PlatformWorkbenchData;
};

const customerHeaders = [
  "日期",
  "来源方式",
  "意向项目",
  "到院项目",
  "成交项目",
  "状态",
  "实收金额",
  "备注",
];

const projectHeaders = [
  "项目名称",
  "来源客户数",
  "预约数",
  "到院数",
  "成交数",
  "实收金额",
  "主要来源平台",
  "实收 ROI",
  "观察周期",
  "当前判断",
];

export function PlatformWorkbench({ data }: PlatformWorkbenchProps) {
  const customerRows = buildSourceCustomerRows(data);
  const reportCsv = [
    ["统计周期", data.period],
    ["平台名称", data.name],
    ["说明", "本平台单页不导出固定示例结果，真实周报请到多平台周报页面下载。"],
  ]
    .map((row) => row.join(","))
    .join("\n");

  return (
    <AppShell activeHref={data.activeHref}>
      <PageHeader
        eyebrow="平台分析"
        title={data.name}
        description="这页只看一个平台，不把所有平台混在一起。先看有没有上传数据，再看客户有没有通过 e看牙回流。"
        action={
          <PageHelpButton
            purpose={`这页用来看${data.name.replace("分析", "")}投放有没有花钱、有没有客户、客户最后有没有到院成交。`}
            when="每天上传完该平台数据后看；周末复盘前也要看。"
            focus={["今日/本周广告费", "前端线索", "e看牙来源客户", "实收 ROI", "项目分类"]}
            next="看完后，只处理最影响结果的一件事，并把动作记到操作记录。"
            mistakes={["不要只看点击。", "不要没有 e看牙回流就调预算。", "高客单项目不要只看一天。"]}
          />
        }
      />

      <TemporaryWorkflowNotice kind="platform" />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">平台单页说明</p>
        <p>
          本页用于平台数据查看和辅助排查。正式判断请以已上传并解析后的多平台看板、数据质量检测和今日总建议为准。
          如果页面出现示例说明或参考字段，不参与真实分析。
        </p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold text-cyan-700">页面顶部状态</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{data.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{data.conclusion}</p>
          </div>
          <span className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">
            {data.status}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 md:grid-cols-3">
          <SmallMetric label="数据周期" value={data.period} />
          <SmallMetric label="是否有最新数据" value={data.hasLatestData ? "有最新数据" : "请先上传该平台数据"} />
          <SmallMetric label="本周结论" value={data.conclusion} />
        </dl>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="今日广告费" value="请看多平台看板" helper="本页不展示固定示例数字" tone="amber" />
        <MetricCard label="本周广告费" value="请看多平台周报" helper="真实汇总以已解析数据为准" />
        <MetricCard label="数据周期" value="请看上传记录" helper="上传时间和数据周期在数据上传页管理" />
        <MetricCard label="数据状态" value="辅助排查页" helper="正式判断以数据质量检测和今日总建议为准" tone="amber" />
      </section>

      <TableSection
        title={data.frontDataTitle}
        description="这是平台后台能导出的前端数据字段说明。真实数值请以多平台统一看板和已解析上传记录为准。"
        headers={["字段", "数值", "大白话说明"]}
        rows={[]}
      />

      <div className="mt-6">
        <StorageNote />
      </div>

      <section className="mt-6 rounded-md border border-cyan-200 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-cyan-950">数据来源</h3>
        <p className="mt-2 text-sm leading-6 text-cyan-900">
          数据来自已解析上传记录。如需管理文件，请到数据上传页。
        </p>
        <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800" href="/upload">
          去数据上传页
        </a>
      </section>

      <TableSection
        title="来源客户登记"
        description="这个模块回答：这个平台来的客户，到底来做什么项目？这里先放最常看的字段，更细的接待人员、医生、未成交原因后续进详情里看。当前 e看牙来源记录不完整时，请前台统一记录来源平台、来源项目和来源方式。"
        headers={customerHeaders}
        maxHeightClassName="max-h-[360px]"
        rows={customerRows}
      />

      <TableSection
        title="项目分类统计"
        description="这里原来只做示例说明。正式项目表现请以项目分析、多平台闭环和 e看牙回流数据为准。"
        headers={projectHeaders}
        maxHeightClassName="max-h-[420px]"
        rows={[]}
      />

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">生成周报</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          当前生成的是示例周报 CSV，Excel 可以直接打开。接入数据库后可生成真实历史周报。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={data.period} />
          {["包含平台前端数据", "包含关键词/素材/创意数据", "包含 e看牙后端回流数据", "包含来源客户登记", "包含项目分类统计", "包含系统建议"].map((item) => (
            <label key={item} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" defaultChecked />
              {item}
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">
            生成本平台周报
          </button>
          <a
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(reportCsv)}`}
            download={`${data.key}-weekly-report.csv`}
          >
            下载 Excel 周报
          </a>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">本平台优化建议</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          这里不再展示固定示例建议。真实建议请到“今日总建议”查看，系统会基于已上传、已解析且启用的数据生成规则型建议。
        </p>
        <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/recommendations">
          去今日总建议
        </a>
      </section>
    </AppShell>
  );
}

function buildSourceCustomerRows(data: PlatformWorkbenchData) {
  void data;
  return [];
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-slate-950">{value}</dd>
    </div>
  );
}

function TableSection({
  title,
  description,
  headers,
  rows,
  maxHeightClassName,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
  maxHeightClassName?: string;
}) {
  return (
    <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className={`mt-4 overflow-auto ${maxHeightClassName ?? ""}`}>
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={headers.length}>
                  暂无真实数据。请先到数据上传页上传并解析对应平台文件。
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
