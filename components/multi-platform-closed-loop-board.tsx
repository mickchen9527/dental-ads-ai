"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatInteger, formatRoi } from "@/lib/utils/formatters";

type DateType = "source_date" | "visit_date" | "deal_date";

type MainAction = {
  label: string;
  value: number;
};

type ClosedLoopPlatform = {
  platform: string;
  key: "meituan" | "douyin" | "gdt" | "amap";
  front: {
    spend: number;
    impressions: number;
    clicks: number;
    avgClickCost: number | null;
    platformLeadCount: number;
    mainActions: MainAction[];
    hasData: boolean;
  };
  ekanya: {
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
  statusNote: string;
};

type ProjectRow = {
  projectName: string;
  leadCount: number;
  appointmentCount: number;
  visitCount: number;
  dealCount: number;
  paidAmount: number;
  avgPaidAmount: number | null;
  mainSourcePlatform: string;
  sourcePlatforms: string[];
  observationNote: string;
};

type ClosedLoopPayload = {
  range: {
    startDate: string;
    endDate: string;
    dateType: DateType;
  };
  summary: {
    totalSpend: number;
    totalPlatformLeads: number;
    totalEkanyaLeads: number;
    totalVisits: number;
    totalDeals: number;
    totalPaidAmount: number;
    overallPaidRoi: number | null;
    bestRoiPlatform: string;
    highestSpendPlatform: string;
    mostVisitPlatform: string;
  };
  platforms: ClosedLoopPlatform[];
  projects: ProjectRow[];
  warnings: string[];
  emptyStates: {
    hasAnyFrontData: boolean;
    hasEkanyaBackflow: boolean;
    hasAnyClosedLoopData: boolean;
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

const platformCardTone: Record<ClosedLoopPlatform["key"], string> = {
  meituan: "border-cyan-100 bg-cyan-50",
  douyin: "border-rose-100 bg-rose-50",
  gdt: "border-indigo-100 bg-indigo-50",
  amap: "border-emerald-100 bg-emerald-50",
};

export function MultiPlatformClosedLoopBoard() {
  const [rangeKey, setRangeKey] = useState("last7");
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [startDate, setStartDate] = useState(() => getDateRange("last7").startDate);
  const [endDate, setEndDate] = useState(() => getDateRange("last7").endDate);
  const [data, setData] = useState<ClosedLoopPayload | null>(null);
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
        const response = await fetch(`/api/closed-loop/platforms?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.message ?? "读取多平台闭环数据失败，请稍后再试。");
          setData(null);
          return;
        }

        setData(payload);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("读取多平台闭环数据失败，请检查 Supabase 配置和解析表是否正常。");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void loadData();

    return () => controller.abort();
  }, [dateType, endDate, startDate]);

  return (
    <section className="mb-6 rounded-md border border-emerald-100 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">多平台 + e看牙初步闭环</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">把平台前端数据和 e看牙回流放在一起看</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            这是多平台初步闭环，不是精准归因。当前按时间范围、来源平台和项目分类，把美团、抖音、腾讯广点通、高德的前端投放数据与 e看牙后端回流放在一起看，帮助你判断钱有没有大致流回到真实到院、成交和实收。
          </p>
        </div>
        <a
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
          href="/upload"
        >
          去上传并解析数据
        </a>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
        平台线索/核心动作来自平台数据；到院、成交、实收来自 e看牙回流。两者当前不是精准一对一匹配。
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-800">时间筛选</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                rangeKey === option.value
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
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
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
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

      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取多平台闭环数据...</p> : null}

      {!loading && data ? (
        <div className="mt-4 space-y-6">
          <EmptyStateNotices data={data} />
          <SummaryCards data={data} />
          <PlatformClosedLoopTable platforms={data.platforms} />
          <PlatformCards platforms={data.platforms} />
          <ProjectClosedLoopTable rows={data.projects} hasRows={data.emptyStates.hasEkanyaBackflow} />
        </div>
      ) : null}
    </section>
  );
}

function EmptyStateNotices({ data }: { data: ClosedLoopPayload }) {
  const notices = [
    !data.emptyStates.hasAnyFrontData ? "还没有可用的平台前端解析数据，请先到数据上传页上传并解析各平台数据。" : "",
    !data.emptyStates.hasEkanyaBackflow ? "还没有解析 e看牙后端回流数据，所以暂时不能看真实到院、成交和实收。" : "",
    !data.emptyStates.hasAnyClosedLoopData ? "还没有可用的闭环数据，请先到数据上传页上传并解析各平台数据和 e看牙回流数据。" : "",
    ...data.warnings,
  ].filter(Boolean);

  if (notices.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
      {notices.map((notice) => (
        <p key={notice}>{notice}</p>
      ))}
    </div>
  );
}

function SummaryCards({ data }: { data: ClosedLoopPayload }) {
  const cards = [
    ["总花费", formatCurrency(data.summary.totalSpend), "来自各平台前端解析数据"],
    ["平台线索/动作", formatInteger(data.summary.totalPlatformLeads), "平台里的电话、咨询、表单、导航等动作"],
    ["e看牙来源客户", formatInteger(data.summary.totalEkanyaLeads), "来自 e看牙来源平台记录"],
    ["到院数", formatInteger(data.summary.totalVisits), "按当前时间口径统计"],
    ["成交数", formatInteger(data.summary.totalDeals), "以 e看牙回流为准"],
    ["实收金额", formatCurrency(data.summary.totalPaidAmount), "e看牙实际实收金额"],
    ["初步实收 ROI", formatNullableRoi(data.summary.overallPaidRoi), "实收金额 / 平台花费"],
    ["ROI 最高平台", data.summary.bestRoiPlatform, `花费最高：${data.summary.highestSpendPlatform}`],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4">
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

function PlatformClosedLoopTable({ platforms }: { platforms: ClosedLoopPlatform[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">平台闭环对比表</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        这里先把平台花费和 e看牙结果放在一张表里看。它能帮助发现方向问题，但不能当成精准归因。
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["平台", "花费", "点击", "平台线索/核心动作", "e看牙来源客户", "到院", "成交", "实收", "初步 ROI", "状态提示"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {platforms.map((platform) => (
              <tr key={platform.key}>
                <td className="px-4 py-3 font-semibold text-slate-950">{platform.platform}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(platform.front.spend)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(platform.front.clicks)}</td>
                <td className="px-4 py-3 text-slate-700">{formatMainActions(platform.front.mainActions)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(platform.ekanya.leadCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(platform.ekanya.visitCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(platform.ekanya.dealCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(platform.ekanya.paidAmount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatNullableRoi(platform.ekanya.paidRoi)}</td>
                <td className="px-4 py-3 text-slate-600">{platform.statusNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlatformCards({ platforms }: { platforms: ClosedLoopPlatform[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {platforms.map((platform) => (
        <article key={platform.key} className={`rounded-md border p-4 ${platformCardTone[platform.key]}`}>
          <h3 className="text-base font-semibold text-slate-950">{platform.platform}</h3>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            {platform.front.hasData ? "已有平台前端数据" : "还没有解析该平台前端数据"}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <MetricLine label="前端花费" value={formatCurrency(platform.front.spend)} />
            <MetricLine label="点击" value={formatInteger(platform.front.clicks)} />
            <MetricLine label="核心动作" value={formatInteger(platform.front.platformLeadCount)} />
            <MetricLine label="e看牙来源客户" value={formatInteger(platform.ekanya.leadCount)} />
            <MetricLine label="到院 / 成交" value={`${formatInteger(platform.ekanya.visitCount)} / ${formatInteger(platform.ekanya.dealCount)}`} />
            <MetricLine label="实收 / ROI" value={`${formatCurrency(platform.ekanya.paidAmount)} / ${formatNullableRoi(platform.ekanya.paidRoi)}`} />
          </dl>
          <p className="mt-4 rounded-md bg-white/70 p-2 text-xs font-semibold leading-5 text-slate-700">{platform.statusNote}</p>
        </article>
      ))}
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function ProjectClosedLoopTable({ rows, hasRows }: { rows: ProjectRow[]; hasRows: boolean }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">项目分类闭环</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        这里按 e看牙项目分类看来源、到院、成交和实收。项目多时可以向下滚动查看更多。
      </p>
      {!hasRows ? (
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          还没有解析 e看牙后端回流数据，所以暂时不能看项目分类闭环。
        </p>
      ) : (
        <div className="mt-4 max-h-[420px] overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="sticky top-0 bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["项目", "来源客户", "预约", "到院", "成交", "实收", "平均实收", "主要来源平台", "观察提示"].map((header) => (
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
                  <td className="px-4 py-3 text-slate-600">{row.observationNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatMainActions(actions: MainAction[]) {
  const visibleActions = actions.filter((action) => action.value > 0).slice(0, 3);
  if (visibleActions.length === 0) return "暂无核心动作";
  return visibleActions.map((action) => `${action.label} ${formatInteger(action.value)}`).join("，");
}

function formatNullableCurrency(value: number | null) {
  return value === null ? "-" : formatCurrency(value);
}

function formatNullableRoi(value: number | null) {
  return value === null ? "-" : formatRoi(value);
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
