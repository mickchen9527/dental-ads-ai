"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { actionLogRows } from "@/lib/v12-static-data";

const headers = [
  "日期",
  "建议类型",
  "平台",
  "项目",
  "计划/素材",
  "系统建议",
  "是否执行",
  "执行动作",
  "执行前数据",
  "执行后3天结果",
  "执行后7天结果",
  "是否有效",
  "备注",
];

const recommendationActionLogStorageKey = "dental_ads_recommendation_action_logs_v1";

type LocalRecommendationActionLog = {
  id?: string;
  recommendationId?: string;
  actionType?: string;
  platform?: string;
  title?: string;
  problemType?: string;
  status?: string;
  note?: string;
  createdAt?: string;
};

export default function ActionLogsPage() {
  const [filter, setFilter] = useState("全部");
  const [recommendationRows] = useState<string[][]>(() => readLocalRecommendationRows());

  const rows = [...recommendationRows, ...actionLogRows];
  const filteredRows = rows.filter((row) => {
    if (filter === "全部") return true;
    if (filter === "已执行") return row[6] === "已执行";
    if (filter === "未执行") return row[6] === "未执行";
    if (filter === "待复盘") return row[11] === "待复盘";
    if (filter === "有效") return row[11] === "有效";
    if (filter === "无效") return row[11] === "无效";
    return true;
  });

  return (
    <AppShell activeHref="/action-logs">
      <PageHeader
        eyebrow="执行闭环"
        title="操作记录"
        description="系统建议必须经过人工确认。执行后需要记录结果，否则无法判断建议是否有效。"
        action={
          <PageHelpButton
            purpose="记录建议到底有没有执行，执行后有没有变好。"
            when="每次改预算、改页面、改话术、改素材后都要记。"
            focus={["是否执行", "执行动作", "3天结果", "7天结果", "是否有效"]}
            next="满3天和7天回来复盘，把有效和无效标清楚。"
            mistakes={["不要只执行不记录。", "不要当天就判断高客单项目有效或无效。"]}
          />
        }
      />

      <section className="mb-6 flex flex-wrap gap-2">
        {["全部", "已执行", "未执行", "待复盘", "有效", "无效"].map((item) => (
          <button
            key={item}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              filter === item
                ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            type="button"
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="mb-4 rounded-md border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
        今日总建议里的“采纳 / 继续观察 / 忽略”会先记录在本机浏览器里，并显示到这里。后续接 Supabase 操作记录表后，可以跨电脑保存。
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1320px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row, rowIndex) => (
              <tr key={`${row.join("-")}-${rowIndex}`}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {filteredRows.length === 0 ? (
        <section className="mt-4 rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          当前筛选下没有记录。执行动作后记一条，后续复盘才有依据。
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Info title="3天复盘" text="已执行满3天，先看短期咨询、有效咨询和到院变化。" />
        <Info title="7天复盘" text="已执行满7天，再看成交成本和实收 ROI 趋势。" />
        <Info title="高客单周期" text="种植、正畸等项目未满观察周期，不建议提前下结论。" />
      </section>
    </AppShell>
  );
}

function readLocalRecommendationRows() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(recommendationActionLogStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is LocalRecommendationActionLog => Boolean(item && typeof item === "object"))
      .map((item) => {
        const status = item.status ?? "已记录";
        return [
          formatLogDate(item.createdAt),
          actionTypeLabel(item.actionType),
          item.platform ?? "未填写",
          "多平台建议",
          item.problemType ?? "今日总建议",
          item.title ?? "未命名建议",
          status === "已采纳" ? "已执行" : "未执行",
          status,
          item.recommendationId ?? "本机记录",
          "待复盘",
          "待复盘",
          status === "已采纳" ? "待复盘" : "未执行",
          item.note ?? "来自今日总建议页面的本机操作记录。",
        ];
      });
  } catch {
    return [];
  }
}

function actionTypeLabel(actionType?: string) {
  if (actionType === "recommendation_adopted") return "采纳今日建议";
  if (actionType === "recommendation_watching") return "继续观察今日建议";
  if (actionType === "recommendation_ignored") return "忽略今日建议";
  if (actionType === "recommendation_record_execution") return "记录执行入口";
  if (actionType === "recommendation_ask_ai") return "问 AI 小客服";
  return "今日建议操作";
}

function formatLogDate(value?: string) {
  if (!value) return "本机记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "本机记录";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
