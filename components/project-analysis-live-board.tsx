"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatInteger, formatRate } from "@/lib/utils/formatters";

type DateType = "source_date" | "visit_date" | "deal_date";

type ProjectAnalysisData = {
  range: {
    startDate: string;
    endDate: string;
    dateType: DateType;
  };
  summary: {
    leadCount: number;
    appointmentCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    visitRate: number | null;
    dealRate: number | null;
  };
  projectRows: Array<{
    projectName: string;
    leadCount: number;
    appointmentCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    mainSourcePlatform: string;
    visitRate: number | null;
    dealRate: number | null;
    observationCycle: string;
    currentJudgment: string;
  }>;
  emptyState: {
    hasEkanyaBackflow: boolean;
  };
};

const rangeOptions = [
  { label: "今日", value: "today" },
  { label: "昨日", value: "yesterday" },
  { label: "近 7 天", value: "last7" },
  { label: "本周", value: "thisWeek" },
  { label: "上周", value: "lastWeek" },
  { label: "本月", value: "thisMonth" },
  { label: "自定义日期", value: "custom" },
];

const dateTypeOptions: Array<{ label: string; value: DateType }> = [
  { label: "按来源日期", value: "source_date" },
  { label: "按到院日期", value: "visit_date" },
  { label: "按成交日期", value: "deal_date" },
];

export function ProjectAnalysisLiveBoard() {
  const [rangeKey, setRangeKey] = useState("last7");
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [startDate, setStartDate] = useState(() => getDateRange("last7").startDate);
  const [endDate, setEndDate] = useState(() => getDateRange("last7").endDate);
  const [data, setData] = useState<ProjectAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          dateType,
        });
        const response = await fetch(`/api/project-analysis?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.message ?? "读取项目分析数据失败，请稍后再试。");
          setData(null);
          return;
        }

        setData(payload);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("读取项目分析数据失败，请检查 Supabase 配置和 e看牙解析表是否正常。");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void loadData();

    return () => controller.abort();
  }, [dateType, endDate, startDate]);

  return (
    <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">项目分类总览</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            这里看本周期各项目来了多少客户、预约多少、到院多少、成交多少、实收多少。数据来自已解析的 e看牙后端回流数据。
          </p>
        </div>
        <a
          className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
          href="/upload"
        >
          去上传并解析 e看牙数据
        </a>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-800">时间筛选和时间口径</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                rangeKey === option.value
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              type="button"
              onClick={() => {
                setRangeKey(option.value);
                if (option.value !== "custom") {
                  const nextRange = getDateRange(option.value);
                  setStartDate(nextRange.startDate);
                  setEndDate(nextRange.endDate);
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            开始日期
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="date"
              value={startDate}
              onChange={(event) => {
                setRangeKey("custom");
                setStartDate(event.target.value);
              }}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            结束日期
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              type="date"
              value={endDate}
              onChange={(event) => {
                setRangeKey("custom");
                setEndDate(event.target.value);
              }}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {dateTypeOptions.map((option) => (
            <button
              key={option.value}
              className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                dateType === option.value
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              type="button"
              onClick={() => setDateType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          当前选择：{startDate} 至 {endDate}，{dateTypeOptions.find((item) => item.value === dateType)?.label}。同一个客户可能来源、到院、成交不在同一天，所以要按不同口径看。
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取真实 e看牙回流数据...</p> : null}

      {!loading && data ? (
        <div className="mt-4 space-y-4">
          {!data.emptyState.hasEkanyaBackflow ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
              还没有解析 e看牙后端回流数据。请先到数据上传页上传并解析 e看牙后端回流数据。
            </div>
          ) : null}

          <SummaryCards data={data} />
          <ProjectTable rows={data.projectRows} />
        </div>
      ) : null}
    </section>
  );
}

function SummaryCards({ data }: { data: ProjectAnalysisData }) {
  const cards = [
    ["来源客户数", formatInteger(data.summary.leadCount), "按当前时间口径统计"],
    ["预约数", formatInteger(data.summary.appointmentCount), "来自 e看牙预约相关字段"],
    ["到院数", formatInteger(data.summary.visitCount), `到院率 ${formatNullableRate(data.summary.visitRate)}`],
    ["成交数", formatInteger(data.summary.dealCount), `成交率 ${formatNullableRate(data.summary.dealRate)}`],
    ["实收金额", formatCurrency(data.summary.paidAmount), "来自 e看牙实收/收费字段"],
    ["平均实收", formatNullableCurrency(data.summary.avgPaidAmount), "实收金额 / 成交数"],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map(([label, value, helper]) => (
        <article key={label} className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{helper}</p>
        </article>
      ))}
    </div>
  );
}

function ProjectTable({ rows }: { rows: ProjectAnalysisData["projectRows"] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
        当前时间范围内还没有项目回流数据。可以换一个时间范围，或先去上传并解析 e看牙后端回流数据。
      </p>
    );
  }

  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full min-w-[1320px] border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100 text-left text-xs font-semibold text-slate-600">
          <tr>
            {[
              "项目名称",
              "来源客户数",
              "预约数",
              "到院数",
              "成交数",
              "实收金额",
              "平均实收",
              "主要来源平台",
              "到院率",
              "成交率",
              "观察周期",
              "当前判断",
            ].map((header) => (
              <th key={header} className="px-4 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.projectName}>
              <td className="px-4 py-3 font-semibold text-slate-950">{row.projectName}</td>
              <td className="px-4 py-3 text-slate-700">{formatInteger(row.leadCount)}</td>
              <td className="px-4 py-3 text-slate-700">{formatInteger(row.appointmentCount)}</td>
              <td className="px-4 py-3 text-slate-700">{formatInteger(row.visitCount)}</td>
              <td className="px-4 py-3 text-slate-700">{formatInteger(row.dealCount)}</td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(row.paidAmount)}</td>
              <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(row.avgPaidAmount)}</td>
              <td className="px-4 py-3 text-slate-700">{row.mainSourcePlatform}</td>
              <td className="px-4 py-3 text-slate-700">{formatNullableRate(row.visitRate)}</td>
              <td className="px-4 py-3 text-slate-700">{formatNullableRate(row.dealRate)}</td>
              <td className="px-4 py-3 text-slate-700">{row.observationCycle}</td>
              <td className="px-4 py-3 text-slate-600">{row.currentJudgment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatNullableCurrency(value: number | null) {
  return value === null ? "-" : formatCurrency(value);
}

function formatNullableRate(value: number | null) {
  return value === null ? "-" : formatRate(value);
}

function getDateRange(rangeKey: string) {
  const today = startOfDay(new Date());

  if (rangeKey === "today") return datePair(today, today);
  if (rangeKey === "yesterday") {
    const yesterday = addDays(today, -1);
    return datePair(yesterday, yesterday);
  }
  if (rangeKey === "thisWeek") return datePair(startOfWeek(today), today);
  if (rangeKey === "lastWeek") {
    const thisWeekStart = startOfWeek(today);
    return datePair(addDays(thisWeekStart, -7), addDays(thisWeekStart, -1));
  }
  if (rangeKey === "thisMonth") return datePair(new Date(today.getFullYear(), today.getMonth(), 1), today);

  return datePair(addDays(today, -6), today);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay() || 7;
  return addDays(date, 1 - day);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function datePair(startDate: Date, endDate: Date) {
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}