"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { projectAnalysisRows, riskBoundaryNotes } from "@/lib/v12-static-data";

const projectCategories = ["全部", "洁牙", "补牙", "拔牙", "根管", "儿牙", "正畸", "种植", "修复", "牙周", "美白/贴面", "半口/全口", "其他"];
const periods = ["全部周期", "1-3天", "3-7天", "7-30天", "15-60天"];

const categoryRows = [
  ["洁牙", "42", "18", "22", "18", "12", "¥3,680.00", "美团", "4.9", "1-3天", "引流项目，要看后续补牙、牙周转化"],
  ["补牙", "18", "9", "10", "8", "5", "¥4,800.00", "高德", "3.2", "3-7天", "刚需项目，重点看到院后当天成交"],
  ["拔牙", "12", "6", "8", "7", "4", "¥3,200.00", "美团", "3.8", "3-7天", "看服务体验和术前说明是否清楚"],
  ["根管", "10", "5", "7", "6", "3", "¥5,400.00", "腾讯广点通", "2.9", "3-7天", "信任要求高，要解释流程和价格"],
  ["儿牙", "16", "8", "9", "7", "4", "¥2,680.00", "腾讯广点通", "2.6", "3-7天", "家庭决策项目，要看家长顾虑"],
  ["正畸", "26", "12", "11", "5", "1", "¥12,000.00", "抖音", "1.8", "7-30天", "长周期项目，先看到院和方案沟通"],
  ["种植", "24", "10", "12", "7", "2", "¥28,800.00", "美团", "2.4", "7-30天", "高客单项目，不因单日无成交直接停"],
  ["修复", "9", "4", "5", "4", "2", "¥9,600.00", "美团", "3.1", "7-14天", "方案型项目，重点看客单和方案接受度"],
  ["牙周", "8", "3", "4", "3", "1", "¥2,200.00", "美团", "1.7", "7-14天", "复诊转化项目，要追踪持续治疗"],
  ["美白/贴面", "11", "5", "6", "4", "1", "¥6,800.00", "抖音", "2.1", "7-30天", "审美型项目，看案例表达和信任"],
  ["半口/全口", "5", "2", "3", "2", "0", "¥0.00", "美团", "观察中", "15-60天", "超长周期项目，只做继续跟进"],
  ["其他", "6", "2", "3", "2", "1", "¥900.00", "高德", "1.2", "3-7天", "先确认项目映射是否准确"],
];

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

export default function ProjectAnalysisPage() {
  const [category, setCategory] = useState("全部");
  const [period, setPeriod] = useState("全部周期");

  const filteredCategoryRows = categoryRows.filter((row) => {
    const categoryMatched = category === "全部" || row[0] === category;
    const periodMatched = period === "全部周期" || row[9] === period;
    return categoryMatched && periodMatched;
  });

  const reportCsv = [
    ["统计周期", "2026-05-13 至 2026-05-19"],
    ["报告类型", "项目周报"],
    ["说明", "项目分析不是只看广告前端，也要结合 e看牙回流和闭环 ROI"],
    ["项目", "来源客户数", "到院数", "成交数", "实收金额", "实收 ROI"],
    ...categoryRows.map((row) => [row[0], row[1], row[4], row[5], row[6], row[8]]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  return (
    <AppShell activeHref="/project-analysis">
      <PageHeader
        eyebrow="项目维度经营判断"
        title="项目分析"
        description="补齐口腔常见经营项目，按项目类型、转化链路、实收 ROI 和观察周期做静态经营判断。当前未配置真实项目成本，不计算毛利 ROI。"
        action={
          <PageHelpButton
            purpose="看每个项目带来的客户、到院、成交和实收表现。"
            when="想知道哪个项目该继续投、哪个项目要先观察时看。"
            focus={["项目类型", "成交数", "实收 ROI", "观察周期", "建议动作"]}
            next="高客单项目继续追踪，低客单项目看后续转化。"
            mistakes={["不要用洁牙标准看种植。", "不要只看单日成交。"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">项目分析不是只看广告前端，也要结合 e看牙回流和闭环 ROI。</p>
        {riskBoundaryNotes.join(" ")}
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard title="e看牙回流摘要" items={["本周来源客户 61 人", "已到院 26 人", "已成交 15 人", "来源不清的客户先补记录"]} href="/ekanya-analysis" />
        <SummaryCard title="闭环 ROI 摘要" items={["本周广告费 ¥12,800.00", "e看牙实收 ¥19,908.00", "实收 ROI 1.56", "高客单项目继续看长周期"]} href="/roi-analysis" />
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">项目/投放周报生成入口</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            周报建议统一在项目分析里生成，因为这里能同时看平台、项目、e看牙回流和 ROI。当前先下载示例 CSV。
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

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">项目分类和周期筛选</h3>
        <FilterButtons label="项目分类" options={projectCategories} value={category} onChange={setCategory} />
        <FilterButtons label="观察周期" options={periods} value={period} onChange={setPeriod} />
      </section>

      <section className="mb-6 overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["项目分类", "来源客户数", "新增客户数", "预约数", "到院数", "成交数", "实收金额", "主要来源平台", "实收 ROI", "观察周期", "当前判断"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCategoryRows.map((row) => (
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
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
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
      </section>
    </AppShell>
  );
}

function FilterButtons({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="w-20 text-sm font-semibold text-slate-700">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
            value === option
              ? "border-cyan-200 bg-cyan-50 text-cyan-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
          type="button"
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
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
