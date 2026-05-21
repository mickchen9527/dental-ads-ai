import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import type { PlatformWorkbenchData } from "@/lib/platform-workbench";

type PlatformWorkbenchProps = {
  data: PlatformWorkbenchData;
};

const uploadedHeaders = [
  "文件名称",
  "数据类型",
  "数据周期",
  "上传时间",
  "行数",
  "解析状态",
  "是否参与分析",
  "操作",
];

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
    ["本周广告费", data.weekSpend],
    ["来源客户数", data.customers.length.toString()],
    ["到院数", data.customers.filter((item) => item.arrival === "是").length.toString()],
    ["成交数", data.customers.filter((item) => item.deal === "是").length.toString()],
    ["实收金额", data.projectStats[0]?.paidAmount ?? "¥0.00"],
    ["本周主要问题", data.suggestions[0]?.problem ?? "暂无"],
    ["下周建议动作", data.suggestions[0]?.now ?? "继续观察"],
    ["会议备注区", ""],
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
        <MetricCard label="今日广告费" value={data.todaySpend} helper="今天该平台花了多少钱" tone={data.hasLatestData ? "cyan" : "amber"} />
        <MetricCard label="本周广告费" value={data.weekSpend} helper="本周该平台花了多少钱" />
        <MetricCard label="数据周期" value={data.period} helper="看数据时先确认时间范围" />
        <MetricCard label="数据状态" value={data.hasLatestData ? "可查看" : "等待上传"} helper={data.hasLatestData ? "已有示例上传记录" : "请先上传该平台数据"} tone="amber" />
      </section>

      <TableSection
        title={data.frontDataTitle}
        description="这是平台后台能导出的前端数据。前端数据只能说明有没有人点、问、留资，不能直接说明有没有成交。"
        headers={["字段", "数值", "大白话说明"]}
        rows={data.frontData}
      />

      <div className="mt-6">
        <StorageNote />
      </div>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">已上传数据</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          当前为前端演示，接入数据库后可保存真实上传历史和原文件下载。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="按文件名搜索" />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="按数据类型搜索" />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="按日期范围搜索" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["数据类型", "数据周期", "是否参与分析", "解析状态"].map((item) => (
            <button key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
              筛选：{item}
            </button>
          ))}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {uploadedHeaders.map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.uploadedFiles.map((file) => (
                <tr key={file.fileName}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{file.fileName}</td>
                  <td className="px-4 py-3 text-slate-700">{file.dataType}</td>
                  <td className="px-4 py-3 text-slate-700">{file.period}</td>
                  <td className="px-4 py-3 text-slate-700">{file.uploadedAt}</td>
                  <td className="px-4 py-3 text-slate-700">{file.rows}</td>
                  <td className="px-4 py-3 text-slate-700">{file.parseStatus}</td>
                  <td className="px-4 py-3 text-slate-700">{file.included}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {["查看", "下载", "重新分析", "停用"].map((action) => (
                        <button key={action} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">支持的数据类型：{data.dataTypes.join("、")}</p>
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
        description="这里看本周期该平台客户分别来自哪些项目。高客单项目要看更长周期，不要只看当天。"
        headers={projectHeaders}
        maxHeightClassName="max-h-[420px]"
        rows={data.projectStats.map((item) => [
          item.project,
          item.leads,
          item.appointments,
          item.arrivals,
          item.deals,
          item.paidAmount,
          data.name.replace("分析", ""),
          getProjectRoi(item.project),
          item.cycle,
          item.judgement,
        ])}
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

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {data.suggestions.map((item) => (
          <article key={item.problem} className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-950">本平台优化建议</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              这里不是全站总建议，只看当前平台的数据，告诉你这个平台现在该怎么处理。
            </p>
            <dl className="mt-4 space-y-4">
              <Field label="问题是什么" value={item.problem} />
              <Field label="为什么这么判断" value={item.reason} />
              <Field label="现在该做什么" value={item.now} />
              <ListField label="具体怎么做" items={item.steps} />
              <ListField label="不要做什么" items={item.avoid} />
              <Field label="观察几天" value={item.observe} />
              <ListField label="几天后看什么" items={item.review} />
            </dl>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function buildSourceCustomerRows(data: PlatformWorkbenchData) {
  const baseRows = data.customers.map((item) => [
    item.date,
    item.sourceType,
    item.intendedProject,
    item.arrivalProject,
    item.dealProject,
    item.status,
    item.paidAmount,
    item.note,
  ]);

  const fallbackRows = [
    ["2026-05-17", data.sourceTypes[0] ?? data.name.replace("分析", ""), "补牙", "补牙", "补牙", "已成交", "¥520.00", "刚需客户，当天处理。"],
    ["2026-05-16", data.sourceTypes[1] ?? data.name.replace("分析", ""), "正畸", "-", "-", "已预约", "¥0.00", "家长需要周末到院。"],
    ["2026-05-15", data.sourceTypes[0] ?? data.name.replace("分析", ""), "儿牙", "涂氟", "涂氟", "已成交", "¥268.00", "家长关注是否疼痛。"],
    ["2026-05-14", data.sourceTypes[2] ?? data.sourceTypes[0] ?? data.name.replace("分析", ""), "种植", "种植检查", "-", "待追踪", "¥0.00", "高客单项目继续观察。"],
    ["2026-05-13", data.sourceTypes[0] ?? data.name.replace("分析", ""), "洁牙", "洁牙", "洁牙", "已成交", "¥198.00", "后续可追踪补牙和牙周。"],
  ];

  return [...baseRows, ...fallbackRows].slice(0, Math.max(5, baseRows.length));
}

function getProjectRoi(project: string) {
  const roiByProject: Record<string, string> = {
    洁牙: "2.1",
    补牙: "2.4",
    拔牙: "1.8",
    智齿: "1.9",
    根管: "2.0",
    儿牙: "1.7",
    窝沟封闭: "1.5",
    涂氟: "1.6",
    正畸: "1.2",
    儿童早矫: "1.1",
    种植: "1.4",
    "半口/全口": "0.8",
    修复: "1.9",
    牙周: "1.6",
    美白: "2.3",
    贴面: "1.3",
    检查: "0.9",
    其他: "1.0",
  };

  return roiByProject[project] ?? "示例 1.0";
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1">
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </dd>
    </div>
  );
}
