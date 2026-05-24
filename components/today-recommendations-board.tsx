"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  formatInteger,
  formatRate,
  formatRoi,
} from "@/lib/utils/formatters";

type Priority = "high" | "medium" | "low";
type DateType = "source_date" | "visit_date" | "deal_date";
type PresetKey = "today" | "yesterday" | "last7" | "thisWeek" | "lastWeek" | "thisMonth" | "custom";

type TodayRecommendation = {
  id: string;
  title: string;
  platform: string;
  priority: Priority;
  problem: string;
  reason: string;
  action: string;
  steps: string[];
  dontDo: string;
  observeDays: string;
  reviewMetrics: string[];
  dataBasis: string[];
  status: "pending";
};

type TodayRecommendationsResponse = {
  range: {
    startDate: string;
    endDate: string;
    dateType: DateType;
  };
  uploadCompleteness: {
    hasMeituanSummary: boolean;
    hasMeituanKeywords: boolean;
    hasEkanyaBackflow: boolean;
    hasAnyParsedData: boolean;
  };
  meituanSummary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgClickCost: number | null;
    phoneViews: number;
    onlineConsultClicks: number;
    orders: number;
    groupBuyOrders: number;
    clickRate: number | null;
    phoneRate: number | null;
    consultRate: number | null;
  };
  ekanyaSummary: {
    leadCount: number;
    appointmentCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    visitRate: number | null;
    dealRate: number | null;
    paidRoi: number | null;
  };
  recommendations: TodayRecommendation[];
};

const presets: Array<{ key: PresetKey; label: string }> = [
  { key: "today", label: "今日" },
  { key: "yesterday", label: "昨日" },
  { key: "last7", label: "近 7 天" },
  { key: "thisWeek", label: "本周" },
  { key: "lastWeek", label: "上周" },
  { key: "thisMonth", label: "本月" },
  { key: "custom", label: "自定义日期" },
];

const dateTypes: Array<{ key: DateType; label: string; help: string }> = [
  { key: "source_date", label: "按来源日期", help: "看客户是哪天从平台来的。" },
  { key: "visit_date", label: "按到院日期", help: "看客户是哪天实际到院的。" },
  { key: "deal_date", label: "按成交日期", help: "看客户是哪天成交或收费的。" },
];

const priorityText: Record<Priority, string> = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

const priorityClass: Record<Priority, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function TodayRecommendationsBoard() {
  const [preset, setPreset] = useState<PresetKey>("last7");
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [customStart, setCustomStart] = useState(getPresetRange("last7").startDate);
  const [customEnd, setCustomEnd] = useState(getPresetRange("last7").endDate);
  const [data, setData] = useState<TodayRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choiceById, setChoiceById] = useState<Record<string, string>>({});

  const selectedRange = useMemo(() => {
    if (preset === "custom") {
      return { startDate: customStart, endDate: customEnd };
    }
    return getPresetRange(preset);
  }, [customEnd, customStart, preset]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      startDate: selectedRange.startDate,
      endDate: selectedRange.endDate,
      dateType,
    });

    async function loadRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/recommendations/today?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "读取今日总建议失败，请稍后再试。");
        }

        setData(payload as TodayRecommendationsResponse);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "读取今日总建议失败，请稍后再试。");
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
    return () => controller.abort();
  }, [dateType, selectedRange.endDate, selectedRange.startDate]);

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">时间范围</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              这里按你选的时间范围读取已解析数据。当前只基于美团推广、美团关键词和 e看牙回流生成规则型建议。
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
            当前时间：{selectedRange.startDate} 至 {selectedRange.endDate}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((item) => (
            <button
              key={item.key}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                preset === item.key
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
              type="button"
              onClick={() => setPreset(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === "custom" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              开始日期
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              结束日期
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-base font-semibold text-slate-950">时间口径</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {dateTypes.map((item) => (
              <button
                key={item.key}
                className={`rounded-md border px-3 py-2 text-left text-sm font-semibold ${
                  dateType === item.key
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
                type="button"
                onClick={() => setDateType(item.key)}
              >
                <span className="block">{item.label}</span>
                <span className="mt-1 block text-xs font-normal text-slate-500">{item.help}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          正在读取已解析数据，稍等一下。
        </section>
      ) : null}

      {error ? (
        <section className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
          {error}
        </section>
      ) : null}

      {data ? (
        <>
          <OverviewCards data={data} />

          {!data.uploadCompleteness.hasAnyParsedData ? (
            <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              当前还没有足够的真实数据生成建议。请先上传并解析：美团推广汇总数据、美团关键词数据、e看牙后端回流数据。
            </section>
          ) : null}

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  规则型今日建议（{data.recommendations.length} 条）
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  这些建议来自规则判断，不是 AI 自动决策。所有调整都要建议人工复核后执行。
                </p>
              </div>
              <Link
                className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
                href="/upload"
              >
                去上传或解析数据
              </Link>
            </div>

            <div className="grid gap-4">
              {data.recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  choice={choiceById[recommendation.id]}
                  recommendation={recommendation}
                  onChoose={(choice) =>
                    setChoiceById((current) => ({ ...current, [recommendation.id]: choice }))
                  }
                />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function OverviewCards({ data }: { data: TodayRecommendationsResponse }) {
  const cards = [
    { label: "美团花费", value: formatCurrency(data.meituanSummary.totalSpend), note: "来自美团推广汇总解析数据" },
    { label: "美团点击", value: formatInteger(data.meituanSummary.totalClicks), note: `点击率 ${formatNullableRate(data.meituanSummary.clickRate)}` },
    { label: "美团来源客户", value: formatInteger(data.ekanyaSummary.leadCount), note: "来自 e看牙后端回流" },
    { label: "实收 ROI", value: formatNullableRoi(data.ekanyaSummary.paidRoi), note: "实收金额 / 美团花费，初步参考" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{card.note}</p>
        </div>
      ))}
    </section>
  );
}

function RecommendationCard({
  recommendation,
  choice,
  onChoose,
}: {
  recommendation: TodayRecommendation;
  choice?: string;
  onChoose: (choice: string) => void;
}) {
  const aiChoice = "问 AI 小客服";
  const aiTip = "当前为前端演示，接入 OpenAI API 后可针对这条建议继续追问。";

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${priorityClass[recommendation.priority]}`}>
              {priorityText[recommendation.priority]}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {recommendation.platform}
            </span>
            <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">
              规则型建议
            </span>
          </div>
          <h4 className="mt-3 text-lg font-semibold text-slate-950">{recommendation.title}</h4>
        </div>
        <span className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          状态：待人工确认
        </span>
      </div>

      <dl className="mt-4 grid gap-4 lg:grid-cols-2">
        <Field label="问题是什么" value={recommendation.problem} />
        <Field label="为什么这么判断" value={recommendation.reason} />
        <Field label="现在该做什么" value={recommendation.action} />
        <Field label="不要做什么" value={recommendation.dontDo} />
        <Field label="观察几天" value={recommendation.observeDays} />
        <ListField label="具体怎么做" items={recommendation.steps} />
        <ListField label="几天后看什么" items={recommendation.reviewMetrics} />
        <ListField label="数据依据" items={recommendation.dataBasis} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {["采纳建议", "继续观察", "不采纳"].map((action) => (
          <button
            key={action}
            className={actionButtonClass(choice === action)}
            type="button"
            onClick={() => onChoose(action)}
          >
            {action}
          </button>
        ))}
        <Link
          className={actionButtonClass(choice === "记录执行")}
          href="/action-logs"
          onClick={() => onChoose("记录执行")}
        >
          记录执行
        </Link>
        <button
          className={choice === aiChoice ? activeAiButtonClass : inactiveButtonClass}
          type="button"
          onClick={() => onChoose(aiChoice)}
        >
          问 AI 小客服
        </button>
      </div>

      {choice ? (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          已选择：{choice}。{choice === aiChoice ? aiTip : "当前只做前端状态记录，后续接入数据库后会保存操作结果。"}
        </p>
      ) : null}
    </article>
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

function actionButtonClass(active: boolean) {
  return active ? activeButtonClass : inactiveButtonClass;
}

const activeButtonClass = "rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800";
const inactiveButtonClass = "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700";
const activeAiButtonClass = "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900";

function formatNullableRate(value: number | null) {
  return value === null ? "暂无" : formatRate(value);
}

function formatNullableRoi(value: number | null) {
  return value === null ? "暂无" : formatRoi(value);
}

function getPresetRange(preset: PresetKey) {
  const now = new Date();
  const today = startOfDay(now);

  if (preset === "today") {
    return { startDate: formatDate(today), endDate: formatDate(today) };
  }

  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
  }

  if (preset === "thisWeek") {
    const start = addDays(today, 1 - getChinaWeekday(today));
    return { startDate: formatDate(start), endDate: formatDate(today) };
  }

  if (preset === "lastWeek") {
    const thisWeekStart = addDays(today, 1 - getChinaWeekday(today));
    const lastWeekStart = addDays(thisWeekStart, -7);
    const lastWeekEnd = addDays(thisWeekStart, -1);
    return { startDate: formatDate(lastWeekStart), endDate: formatDate(lastWeekEnd) };
  }

  if (preset === "thisMonth") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: formatDate(start), endDate: formatDate(today) };
  }

  return { startDate: formatDate(addDays(today, -6)), endDate: formatDate(today) };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getChinaWeekday(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
