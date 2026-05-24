"use client";

import { useEffect, useMemo, useState } from "react";

type MainMetric = {
  label: string;
  value: number;
};

type PlatformOverview = {
  platform: string;
  key: "meituan" | "douyin" | "gdt" | "amap";
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  clickRate: number | null;
  phoneCount: number;
  consultCount: number;
  orderCount: number;
  leadCount: number;
  appointmentCount: number;
  visitCount: number;
  dealCount: number;
  mainMetrics: MainMetric[];
  statusNote: string;
  hasData: boolean;
};

type PlatformOverviewPayload = {
  range: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalLeads: number;
    avgClickCost: number | null;
    bestSpendPlatform: string;
    mostLeadPlatform: string;
  };
  platforms: PlatformOverview[];
  warnings: string[];
  emptyStates: {
    hasAnyData: boolean;
  };
};

const presets = [
  { key: "today", label: "今日" },
  { key: "yesterday", label: "昨日" },
  { key: "last7", label: "近 7 天" },
  { key: "thisWeek", label: "本周" },
  { key: "lastWeek", label: "上周" },
  { key: "thisMonth", label: "本月" },
  { key: "custom", label: "自定义日期" },
] as const;

type PresetKey = (typeof presets)[number]["key"];

const platformTone: Record<PlatformOverview["key"], string> = {
  meituan: "border-cyan-100 bg-cyan-50 text-cyan-900",
  douyin: "border-rose-100 bg-rose-50 text-rose-900",
  gdt: "border-indigo-100 bg-indigo-50 text-indigo-900",
  amap: "border-emerald-100 bg-emerald-50 text-emerald-900",
};

export function PlatformOverviewBoard() {
  const initialRange = useMemo(() => getDateRange("last7"), []);
  const [preset, setPreset] = useState<PresetKey>("last7");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [data, setData] = useState<PlatformOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadOverview() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ startDate, endDate });
        const response = await fetch(`/api/platform-overview?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          if (!ignore) {
            setError(payload.message ?? "读取多平台统一看板失败，请检查 Supabase 配置和解析表权限。");
            setData(null);
          }
          return;
        }

        if (!ignore) setData(payload);
      } catch {
        if (!ignore) {
          setError("读取多平台统一看板失败，请检查网络、Supabase 配置或接口状态。");
          setData(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      ignore = true;
    };
  }, [endDate, startDate]);

  function selectPreset(nextPreset: PresetKey) {
    setPreset(nextPreset);
    if (nextPreset === "custom") return;

    const nextRange = getDateRange(nextPreset);
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
  }

  const summaryCards = [
    { label: "总花费", value: formatCurrency(data?.summary.totalSpend ?? 0) },
    { label: "总曝光", value: formatNumber(data?.summary.totalImpressions ?? 0) },
    { label: "总点击", value: formatNumber(data?.summary.totalClicks ?? 0) },
    { label: "平均点击成本", value: formatCurrency(data?.summary.avgClickCost ?? 0) },
    { label: "平台线索/动作数", value: formatNumber(data?.summary.totalLeads ?? 0) },
    { label: "花费最高平台", value: data?.summary.bestSpendPlatform ?? "暂无" },
    { label: "线索最多平台", value: data?.summary.mostLeadPlatform ?? "暂无" },
  ];

  return (
    <section className="mb-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">真实解析数据</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">多平台统一看板</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            这里把美团、抖音、腾讯广点通、高德的前端投放数据放在一起看。当前只看平台前端数据和平台线索，不代表最终成交效果。
            最终到院、成交、实收要在下一步多平台闭环里看。
          </p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
          这里的预约/到院/成交来自平台线索表字段，不等于 e看牙最终成交。
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((item) => (
          <button
            key={item.key}
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
              preset === item.key
                ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
            }`}
            type="button"
            onClick={() => selectPreset(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {preset === "custom" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            开始日期
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            结束日期
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>
      ) : null}

      <p className="mt-3 text-sm font-semibold text-slate-500">
        当前查看周期：{startDate} 至 {endDate}
      </p>

      {error ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取多平台解析数据...</p> : null}

      {!loading && data && !data.emptyStates.hasAnyData ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
          还没有可用的平台解析数据，请先到数据上传页上传并解析各平台数据。
        </div>
      ) : null}

      {data ? (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article key={card.label} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{card.value}</p>
              </article>
            ))}
          </div>

          {data.warnings.length > 0 ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-800">数据提示</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.warnings.map((warning) => (
                  <span key={warning} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {warning}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
                <tr>
                  {["平台", "花费", "曝光", "点击", "点击率", "平均点击成本", "核心动作", "平台线索", "预约", "到院", "成交", "状态提示"].map((header) => (
                    <th key={header} className="px-4 py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.platforms.map((platform) => (
                  <tr key={platform.key}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{platform.platform}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(platform.spend)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNumber(platform.impressions)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNumber(platform.clicks)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatPercent(platform.clickRate)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(platform.avgClickCost ?? 0)}</td>
                    <td className="px-4 py-3 text-slate-700">{summarizeMainMetrics(platform.mainMetrics)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNumber(platform.leadCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNumber(platform.appointmentCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNumber(platform.visitCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNumber(platform.dealCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{platform.statusNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {data.platforms.map((platform) => (
              <article key={platform.key} className={`rounded-md border p-4 ${platformTone[platform.key]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{platform.platform}</h3>
                    <p className="mt-1 text-xs font-semibold opacity-80">{platform.hasData ? "已有解析数据" : "还没有解析该平台数据"}</p>
                  </div>
                  <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-semibold">{formatCurrency(platform.spend)}</span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  {platform.mainMetrics.slice(0, 5).map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between gap-3">
                      <dt>{metric.label}</dt>
                      <dd className="font-semibold text-slate-950">{formatNumber(metric.value)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 rounded-md bg-white/70 p-2 text-xs font-semibold leading-5 text-slate-700">{platform.statusNote}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function summarizeMainMetrics(metrics: MainMetric[]) {
  const visibleMetrics = metrics.filter((metric) => metric.value > 0).slice(0, 3);
  if (visibleMetrics.length === 0) return "暂无核心动作";
  return visibleMetrics.map((metric) => `${metric.label} ${formatNumber(metric.value)}`).join("，");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function getDateRange(preset: Exclude<PresetKey, "custom">) {
  const today = startOfDay(new Date());

  if (preset === "today") {
    return toRange(today, today);
  }

  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return toRange(yesterday, yesterday);
  }

  if (preset === "thisWeek") {
    return toRange(startOfWeek(today), today);
  }

  if (preset === "lastWeek") {
    const end = addDays(startOfWeek(today), -1);
    const start = addDays(end, -6);
    return toRange(start, end);
  }

  if (preset === "thisMonth") {
    return toRange(new Date(today.getFullYear(), today.getMonth(), 1), today);
  }

  const start = addDays(today, -6);
  return toRange(start, today);
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
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toRange(start: Date, end: Date) {
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
