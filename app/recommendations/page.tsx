"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { RecommendationCard } from "@/components/recommendation-card";
import {
  pendingDataSourceText,
  supportedDataSourceText,
} from "@/lib/config/dataSources";
import { qualityResult, recommendations } from "@/lib/mock-data";
import { pendingIntegrationNote, riskBoundaryNotes } from "@/lib/v12-static-data";

const categoryMap: Record<string, string[]> = {
  全部建议: [],
  预算建议: ["预算", "暂停", "观察"],
  出价建议: ["出价", "加价"],
  素材建议: ["素材", "前三秒", "封面", "标题", "医生讲解", "信任型", "方案评估"],
  "页面/承接建议": ["页面", "套餐", "购买须知", "FAQ", "客服", "到院", "预约", "接待人员"],
  价格策略建议: ["价格", "价格表达", "价格梯度", "检查/方案", "降价", "涨价", "低价"],
  竞品应对建议: ["跟价", "医生/材料/服务", "内容反打", "竞品"],
  数据质量建议: ["e看牙", "项目成本表", "项目映射", "暂缓重大调整"],
};

const platforms = ["全部平台", "美团", "抖音", "腾讯广点通", "大众点评", "e看牙", "竞品情报"];
const projects = ["全部项目", "种植", "正畸", "洁牙", "补牙", "拔牙", "儿牙", "修复", "牙周", "根管治疗", "美白", "贴面", "全口/半口种植"];

export default function RecommendationsPage() {
  const [category, setCategory] = useState("全部建议");
  const [platform, setPlatform] = useState("全部平台");
  const [project, setProject] = useState("全部项目");

  const filtered = recommendations.filter((item) => {
    const categoryKeywords = categoryMap[category] ?? [];
    const categoryMatched = categoryKeywords.length === 0 || categoryKeywords.some((keyword) => item.type.includes(keyword) || item.action.includes(keyword));
    const platformMatched = platform === "全部平台" || item.platform.includes(platform) || item.sourceIds.some((sourceId) => {
      if (platform === "e看牙") return sourceId === "internal-conversion";
      if (platform === "竞品情报") return sourceId === "competitor-intelligence";
      return false;
    });
    const projectMatched = project === "全部项目" || item.project === project;
    return categoryMatched && platformMatched && projectMatched;
  });

  return (
    <AppShell activeHref="/recommendations">
      <PageHeader
        eyebrow="人工确认闭环"
        title="调预算/价格策略建议"
        description="本页不是让 AI 自动执行广告操作，而是把投放、素材、页面、承接、价格、竞品、数据质量等问题拆成可执行建议。所有建议必须人工确认。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">
          当前建议主要基于美团 + e看牙 + 项目价格/成本表。抖音、腾讯广点通入口已开放，但暂未纳入建议计算；竞品情报仅作参考。
        </p>
        <p>当前已支持计算的数据源：{supportedDataSourceText}</p>
        <p>已开放但暂不参与建议计算的数据源：{pendingDataSourceText}</p>
        <p>数据质量评分：{qualityResult.score}分，AI建议置信度：{qualityResult.grade}。</p>
        <p>{pendingIntegrationNote}</p>
        <p>{riskBoundaryNotes.join(" ")}</p>
      </section>

      <section className="mb-6 space-y-3 rounded-md border border-slate-200 bg-white p-4">
        <FilterRow label="快速导航" options={Object.keys(categoryMap)} value={category} onChange={setCategory} />
        <FilterRow label="平台筛选" options={platforms} value={platform} onChange={setPlatform} />
        <FilterRow label="项目筛选" options={projects} value={project} onChange={setProject} />
      </section>

      <section className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-950">
          完整经营建议类型（{filtered.length} / {recommendations.length}）
        </h3>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          静态规则建议，不自动执行
        </span>
      </section>

      <section className="grid gap-4">
        {filtered.map((recommendation) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}
      </section>
    </AppShell>
  );
}

function FilterRow({
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
    <div className="flex flex-wrap items-center gap-2">
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
