"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

type TargetRule = {
  id: string;
  platform: string;
  projectCategory: string;
  metricType: string;
  metricName: string;
  condition: string;
  targetValue: string;
  periodStart: string;
  periodEnd: string;
  status: "启用" | "观察" | "停用";
  notes: string;
};

const targetRules: TargetRule[] = [
  {
    id: "meituan-cleaning-cpl",
    platform: "美团",
    projectCategory: "洁牙",
    metricType: "成本类",
    metricName: "目标咨询成本",
    condition: "按近 7 天美团推广汇总 + e看牙来源记录观察",
    targetValue: "≤ ¥80",
    periodStart: "2026-05-01",
    periodEnd: "2026-06-30",
    status: "启用",
    notes: "洁牙是引流项目，不能只看单笔成交。",
  },
  {
    id: "meituan-implant-roi",
    platform: "美团",
    projectCategory: "种植",
    metricType: "ROI",
    metricName: "目标实收 ROI",
    condition: "按 7-30 天看 e看牙实收回流",
    targetValue: "≥ 3.0",
    periodStart: "2026-05-01",
    periodEnd: "2026-07-31",
    status: "启用",
    notes: "高客单项目不要只看当天成交。",
  },
  {
    id: "douyin-ortho-lead",
    platform: "抖音",
    projectCategory: "正畸",
    metricType: "转化率",
    metricName: "有效线索率",
    condition: "素材/创意解析后结合线索状态观察",
    targetValue: "≥ 35%",
    periodStart: "2026-05-01",
    periodEnd: "2026-06-30",
    status: "观察",
    notes: "抖音线索先看质量，不要只看表单便宜。",
  },
  {
    id: "gdt-form-cpa",
    platform: "腾讯广点通",
    projectCategory: "补牙",
    metricType: "成本类",
    metricName: "目标转化成本",
    condition: "按计划汇总和表单/电话线索判断",
    targetValue: "≤ ¥120",
    periodStart: "2026-05-01",
    periodEnd: "2026-06-30",
    status: "启用",
    notes: "刚需项目重点看到院和当天转化。",
  },
  {
    id: "amap-phone-rate",
    platform: "高德",
    projectCategory: "综合",
    metricType: "转化率",
    metricName: "电话/导航动作率",
    condition: "按高德推广汇总和行为数据观察",
    targetValue: "≥ 4%",
    periodStart: "2026-05-01",
    periodEnd: "2026-06-30",
    status: "启用",
    notes: "高德重点看电话、导航、地址和门店访问。",
  },
  {
    id: "ekanya-source-quality",
    platform: "e看牙",
    projectCategory: "全部项目",
    metricType: "数据质量",
    metricName: "来源记录完整率",
    condition: "按 e看牙后端回流数据检查来源平台",
    targetValue: "≥ 90%",
    periodStart: "2026-05-01",
    periodEnd: "2026-12-31",
    status: "启用",
    notes: "来源没记清楚，就不要急着判断哪个平台好坏。",
  },
  {
    id: "meituan-keyword-review",
    platform: "美团",
    projectCategory: "全部项目",
    metricType: "预算类",
    metricName: "高花费关键词复核线",
    condition: "单关键词花费高但无电话、咨询、订单",
    targetValue: "≥ ¥300",
    periodStart: "2026-05-01",
    periodEnd: "2026-06-30",
    status: "观察",
    notes: "只提醒人工复核，不自动暂停关键词。",
  },
  {
    id: "orthodontics-cycle",
    platform: "全部平台",
    projectCategory: "正畸",
    metricType: "观察周期",
    metricName: "最短观察周期",
    condition: "正畸线索和到院后再看成交",
    targetValue: "7-30 天",
    periodStart: "2026-05-01",
    periodEnd: "2026-12-31",
    status: "启用",
    notes: "用户决策周期长，不要因为 1 天没成交就停。",
  },
  {
    id: "half-full-implant-cycle",
    platform: "全部平台",
    projectCategory: "半口/全口",
    metricType: "观察周期",
    metricName: "最短观察周期",
    condition: "半口/全口种植按长周期复盘",
    targetValue: "15-60 天",
    periodStart: "2026-05-01",
    periodEnd: "2026-12-31",
    status: "启用",
    notes: "超高客单项目必须看复诊和方案跟进。",
  },
  {
    id: "legacy-roi-rule",
    platform: "美团",
    projectCategory: "修复",
    metricType: "ROI",
    metricName: "旧版 ROI 参考线",
    condition: "旧活动规则，暂不继续使用",
    targetValue: "≥ 2.0",
    periodStart: "2026-01-01",
    periodEnd: "2026-04-30",
    status: "停用",
    notes: "历史规则保留，不参与后续判断。",
  },
];

const allOption = "全部";
const platforms = [allOption, "美团", "抖音", "腾讯广点通", "高德", "e看牙", "全部平台"];
const projectCategories = [allOption, "洁牙", "补牙", "种植", "正畸", "半口/全口", "修复", "综合", "全部项目"];
const metricTypes = [allOption, "成本类", "转化率", "ROI", "数据质量", "预算类", "观察周期"];
const statuses = [allOption, "启用", "观察", "停用"];

export default function TargetsPage() {
  const [platform, setPlatform] = useState(allOption);
  const [projectCategory, setProjectCategory] = useState(allOption);
  const [metricType, setMetricType] = useState(allOption);
  const [status, setStatus] = useState(allOption);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [keyword, setKeyword] = useState("");

  const filteredRules = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return targetRules.filter((rule) => {
      if (platform !== allOption && rule.platform !== platform) return false;
      if (projectCategory !== allOption && rule.projectCategory !== projectCategory) return false;
      if (metricType !== allOption && rule.metricType !== metricType) return false;
      if (status !== allOption && rule.status !== status) return false;
      if (periodStart && rule.periodEnd < periodStart) return false;
      if (periodEnd && rule.periodStart > periodEnd) return false;

      if (!normalizedKeyword) return true;

      return [
        rule.platform,
        rule.projectCategory,
        rule.metricType,
        rule.metricName,
        rule.condition,
        rule.targetValue,
        rule.status,
        rule.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword);
    });
  }, [keyword, metricType, periodEnd, periodStart, platform, projectCategory, status]);

  return (
    <AppShell activeHref="/targets">
      <PageHeader
        eyebrow="基础设置"
        title="目标值设置"
        description="这里用于维护各平台、各项目、各指标的参考目标。当前是页面管理雏形，后续版本会接 Supabase 保存。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        当前目标值设置为页面管理雏形，后续版本接 Supabase 保存。这里不会自动调价，也不会自动执行广告操作。
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectFilter label="平台" value={platform} options={platforms} onChange={setPlatform} />
            <SelectFilter label="项目分类" value={projectCategory} options={projectCategories} onChange={setProjectCategory} />
            <SelectFilter label="指标类型" value={metricType} options={metricTypes} onChange={setMetricType} />
            <SelectFilter label="状态" value={status} options={statuses} onChange={setStatus} />
          </div>

          <button
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
            type="button"
            onClick={() => downloadTargetsCsv(filteredRules)}
          >
            下载目标值 CSV
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            周期开始
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            周期结束
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            关键词搜索
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="搜索平台、项目、指标、条件或备注"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">目标管理表</h2>
            <p className="mt-1 text-sm text-slate-600">当前显示 {filteredRules.length} 条目标规则。</p>
          </div>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["平台", "项目分类", "指标名称", "判断条件", "目标值", "周期开始", "周期结束", "状态", "备注"].map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-4 py-3 text-slate-700">{rule.platform}</td>
                  <td className="px-4 py-3 text-slate-700">{rule.projectCategory}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{rule.metricName}</p>
                    <p className="mt-1 text-xs text-slate-500">{rule.metricType}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{rule.condition}</td>
                  <td className="px-4 py-3 font-semibold text-slate-950">{rule.targetValue}</td>
                  <td className="px-4 py-3 text-slate-700">{rule.periodStart}</td>
                  <td className="px-4 py-3 text-slate-700">{rule.periodEnd}</td>
                  <td className="px-4 py-3 text-slate-700">{rule.status}</td>
                  <td className="px-4 py-3 text-slate-600">{rule.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRules.length === 0 ? (
          <p className="m-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">当前筛选条件下没有目标规则，可以调整平台、项目、指标、状态或关键词。</p>
        ) : null}
      </section>
    </AppShell>
  );
}

function SelectFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function downloadTargetsCsv(rows: TargetRule[]) {
  const csvRows = [
    ["平台", "项目分类", "指标名称", "判断条件", "目标值", "周期开始", "周期结束", "状态", "备注"],
    ...rows.map((row) => [
      row.platform,
      row.projectCategory,
      row.metricName,
      row.condition,
      row.targetValue,
      row.periodStart,
      row.periodEnd,
      row.status,
      row.notes,
    ]),
  ];

  const csv = csvRows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `target-rules-${formatDateForFile(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatDateForFile(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
