"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { knowledgeArticles, type KnowledgeArticle } from "@/lib/knowledge/articles";

const quickLinks = [
  ["每天打开系统第一步看什么", "/knowledge/daily-first-step"],
  ["上传数据后应该怎么检查", "/knowledge/check-after-upload"],
  ["看到系统建议后怎么处理", "/knowledge/handle-system-suggestion"],
  ["如何判断今天能不能调预算", "/knowledge/adjust-budget-checklist"],
  ["如何做一周复盘", "/knowledge/weekly-review"],
  ["为什么咨询成本低不一定好", "/knowledge/low-consult-cost-not-always-good"],
  ["什么是实收 ROI", "/knowledge/gross-profit-roi"],
  ["什么是平台线索回流率", "/knowledge/platform-lead-return-rate"],
];

const categoryFilters = [
  {
    label: "全部",
    match: () => true,
  },
  {
    label: "基础指标",
    match: (article: KnowledgeArticle) => article.category === "基础指标",
  },
  {
    label: "投放链路判断",
    match: (article: KnowledgeArticle) => article.category === "投放链路判断",
  },
  {
    label: "平台数据怎么看",
    match: (article: KnowledgeArticle) => article.category === "平台理解",
  },
  {
    label: "调预算 / 调词 / 调价",
    match: (article: KnowledgeArticle) =>
      ["投放判断", "价格策略", "素材判断"].includes(article.category) ||
      /预算|调词|调价|价格|素材|创意/.test(`${article.title}${article.summary}`),
  },
  {
    label: "项目判断",
    match: (article: KnowledgeArticle) =>
      /种植|正畸|洁牙|补牙|儿牙|项目|高客单|半口|全口|牙周|根管/.test(`${article.title}${article.summary}${article.scenario}`),
  },
  {
    label: "数据上传说明",
    match: (article: KnowledgeArticle) =>
      ["数据质量", "每日操作流程"].includes(article.category) ||
      /上传|数据质量|回流|字段|e看牙/.test(`${article.title}${article.summary}${article.scenario}`),
  },
  {
    label: "常见误区",
    match: (article: KnowledgeArticle) =>
      article.category === "常见问题" ||
      /为什么|不能|不建议|误区|只看|不要/.test(`${article.title}${article.summary}${article.scenario}`),
  },
];

export default function KnowledgePage() {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const activeFilter = categoryFilters.find((category) => category.label === selectedCategory) ?? categoryFilters[0];
  const filteredArticles = knowledgeArticles.filter(activeFilter.match);

  return (
    <AppShell activeHref="/knowledge">
      <PageHeader
        eyebrow="基础设置"
        title="投放知识库"
        description="这里不是摆设，是给你慢慢学投放逻辑用的。先按分类看，不用一次看完。"
        action={
          <PageHelpButton
            purpose="遇到看不懂的指标和链路问题，就来这里查。"
            when="不知道问题卡在哪一步、看不懂建议、培训新人时看。"
            focus={["投放链路判断", "基础指标", "每日操作流程"]}
            next="找到对应文章，按里面的如果/那么步骤检查数据。"
            mistakes={["不要只背公式。", "不要只看点击、咨询或 ROI 一个数字。"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-cyan-100 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-slate-950">快速入口</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(([label, href]) => (
            <Link
              key={href}
              className="rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50"
              href={href}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((category) => (
            <button
              key={category.label}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                selectedCategory === category.label
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50"
              }`}
              type="button"
              onClick={() => setSelectedCategory(category.label)}
            >
              {category.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          当前分类：<strong>{selectedCategory}</strong>，共 {filteredArticles.length} 篇。分类只是帮你少翻一点，文章本身都还保留。
        </p>
        {selectedCategory === "投放链路判断" ? (
          <p className="mt-2 text-xs font-semibold text-cyan-700">
            投放链路判断分类已保留曝光、点击、咨询、到院、成交、实收等链路文章，适合按“如果……那么……”一步步排查。
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/knowledge/${article.slug}`}
            className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:bg-cyan-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-cyan-700">{article.category}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">{article.title}</h3>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {article.level}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{article.summary}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">适用场景：{article.scenario}</p>
            <span className="mt-4 inline-flex rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800">
              点击查看详情
            </span>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
