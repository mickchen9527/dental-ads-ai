"use client";

import { useState } from "react";

type AiSummary = {
  summary: string;
  keyProblems: string[];
  tomorrowActions: string[];
  dataWarnings: string[];
  riskNotes: string[];
  confidence: "低" | "中" | "高" | string;
  disclaimer: string;
  model?: string;
  inputStats?: {
    recommendationCount?: number;
    dataQualityIssueCount?: number;
    actionLogCount?: number;
    competitorItemCount?: number;
  };
};

type LoadState = "idle" | "loading" | "success" | "error";

export function AiDailySummary() {
  const [state, setState] = useState<LoadState>("idle");
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function generateSummary() {
    setState("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/ai/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "recommendations" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "AI 总结生成失败，请稍后重试。规则型建议仍可正常使用。");
      }

      setSummary(payload as AiSummary);
      setState("success");
    } catch (error) {
      setSummary(null);
      setMessage(error instanceof Error ? error.message : "AI 总结生成失败，请稍后重试。规则型建议仍可正常使用。");
      setState("error");
    }
  }

  return (
    <section className="rounded-md border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">AI 辅助总结</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">AI 今日总结</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            基于今日总建议、数据质量、目标值和操作记录复盘生成，仅供人工参考。AI 不自动调价，不自动执行，也不替代现有规则系统。
          </p>
        </div>
        <button
          className="rounded-md border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={state === "loading"}
          type="button"
          onClick={generateSummary}
        >
          {state === "loading" ? "正在生成..." : "生成 AI 总结"}
        </button>
      </div>

      <div className="mt-4 rounded-md border border-indigo-100 bg-white p-3 text-sm leading-6 text-slate-700">
        <p>不点击按钮时不会调用 AI，避免产生不必要费用。</p>
        <p>如果没有配置 `OPENAI_API_KEY`，这里会提示未启用，规则型建议仍然正常使用。</p>
      </div>

      {state === "loading" ? (
        <div className="mt-4 rounded-md border border-indigo-100 bg-white p-4 text-sm text-slate-600">
          正在整理聚合摘要并生成 AI 总结，请稍等。不会发送全量原始明细数据。
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {message ?? "AI 总结生成失败，请稍后重试。规则型建议仍可正常使用。"}
        </div>
      ) : null}

      {summary ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-800">
                可信度：{summary.confidence}
              </span>
              {summary.model ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  模型：{summary.model}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{summary.summary}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SummaryList title="当前主要问题" items={summary.keyProblems} emptyText="AI 没有识别到明确主要问题。" />
            <SummaryList title="明日执行清单" items={summary.tomorrowActions} emptyText="AI 没有生成明日执行项。" />
            <SummaryList title="数据不足提醒" items={summary.dataWarnings} emptyText="暂未发现额外数据不足提醒。" />
            <SummaryList title="风险提醒" items={summary.riskNotes} emptyText="暂未发现额外风险提醒。" />
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-950">辅助判断说明</p>
            <p className="mt-1">{summary.disclaimer}</p>
            {summary.inputStats ? (
              <p className="mt-2 text-xs text-slate-500">
                本次摘要参考：规则建议 {summary.inputStats.recommendationCount ?? 0} 条，数据质量问题{" "}
                {summary.inputStats.dataQualityIssueCount ?? 0} 个，操作记录 {summary.inputStats.actionLogCount ?? 0} 条，竞品价格{" "}
                {summary.inputStats.competitorItemCount ?? 0} 条。
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {items.length > 0 ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}
