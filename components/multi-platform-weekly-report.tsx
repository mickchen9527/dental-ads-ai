"use client";

import { useEffect, useMemo, useState } from "react";

type DateType = "source_date" | "visit_date" | "deal_date";
type RangeKey = "today" | "yesterday" | "last7" | "thisWeek" | "lastWeek" | "thisMonth" | "custom";

type PlatformRow = {
  platform: string;
  key?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  clickRate?: number | null;
  platformLeadOrActionCount?: number;
  ekanyaLeadCount?: number;
  visitCount?: number;
  dealCount?: number;
  paidAmount?: number;
  paidRoi?: number | null;
  statusNote?: string;
};

type ProjectRow = {
  projectName: string;
  leadCount?: number;
  appointmentCount?: number;
  visitCount?: number;
  dealCount?: number;
  paidAmount?: number;
  mainSourcePlatform?: string;
  observationNote?: string;
};

type HighlightRow = {
  name: string;
  type: string;
  spend?: number;
  clicks?: number;
  conversions?: number;
  formOrPhoneCount?: number;
  consultCount?: number;
  ruleNote?: string;
};

type WeeklyReportData = {
  executiveSummary?: string[];
  platformSummary?: PlatformRow[];
  projectSummary?: ProjectRow[];
  keywordAndCreativeHighlights?: {
    meituanKeywordsTop10?: HighlightRow[];
    douyinCreativesTop10?: HighlightRow[];
    gdtCreativesTop10?: HighlightRow[];
  };
  reminders?: string[];
  closedLoopSummary?: {
    leadCount?: number;
    appointmentCount?: number;
    visitCount?: number;
    dealCount?: number;
    paidAmount?: number;
    paidRoi?: number | null;
    visitRate?: number | null;
    dealRate?: number | null;
  };
  emptyStates?: {
    hasAnyData?: boolean;
    hasEkanyaBackflow?: boolean;
  };
};

const reportDescription =
  "这是多平台周报雏形版，读取美团、抖音、腾讯广点通、高德和 e看牙回流数据，帮助你开周会时快速查看花费、线索、到院、成交、实收和项目表现。当前不是 AI 总结，也不是精准归因。";

const emptyMessage = "还没有可用的周报数据，请先到数据上传页上传并解析各平台数据和 e看牙回流数据。";

const rangeOptions: Array<{ label: string; value: RangeKey }> = [
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

export function MultiPlatformWeeklyReport() {
  const defaultRange = useMemo(() => getDateRange("last7"), []);
  const [rangeKey, setRangeKey] = useState<RangeKey>("last7");
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const platformRows = data?.platformSummary ?? [];
  const projectRows = data?.projectSummary ?? [];
  const highlights = [
    ...(data?.keywordAndCreativeHighlights?.meituanKeywordsTop10 ?? []),
    ...(data?.keywordAndCreativeHighlights?.douyinCreativesTop10 ?? []),
    ...(data?.keywordAndCreativeHighlights?.gdtCreativesTop10 ?? []),
  ];
  const reminders = data?.reminders?.length ? data.reminders : [emptyMessage];
  const executiveSummary = data?.executiveSummary?.length ? data.executiveSummary : [emptyMessage];
  const closedLoop = data?.closedLoopSummary ?? {};
  const hasAnyData = Boolean(data?.emptyStates?.hasAnyData) || platformRows.some((row) => toNumber(row.spend) > 0 || toNumber(row.platformLeadOrActionCount) > 0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ startDate, endDate, dateType });
        const response = await fetch(`/api/reports/weekly?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          setData(null);
          setError(payload.message ?? "读取多平台周报数据失败，请稍后再试。");
          return;
        }

        setData(payload);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setData(null);
        setError("读取多平台周报数据失败，请检查接口、Supabase 配置和解析表是否正常。");
      } finally {
        setLoading(false);
      }
    }

    void loadReport();

    return () => controller.abort();
  }, [dateType, endDate, startDate]);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">多平台周报</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">多平台周报</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{reportDescription}</p>
        </div>
        <button
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
          type="button"
          onClick={() => downloadCsv({ data, endDate, startDate })}
        >
          下载 CSV 周报
        </button>
      </div>

      <section className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-900">时间筛选</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                rangeKey === option.value ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-700"
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
                dateType === option.value ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"
              }`}
              type="button"
              onClick={() => setDateType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-600">正在读取多平台周报数据...</p> : null}
      {error ? <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{error}</p> : null}
      {!loading && !hasAnyData ? <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{emptyMessage}</p> : null}

      <div className="mt-5 space-y-6">
        <section className="rounded-md border border-cyan-200 bg-cyan-50 p-4">
          <h3 className="text-base font-semibold text-cyan-950">本周总览</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-cyan-900">
            {executiveSummary.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">平台表现对比</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">这里看美团、抖音、腾讯广点通、高德的花费、点击、平台动作和 e看牙回流。当前不是精准归因。</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
                <tr>
                  {["平台", "花费", "曝光", "点击", "点击率", "平台动作/线索", "e看牙来源", "到院", "成交", "实收", "初步 ROI", "状态提示"].map((header) => (
                    <th key={header} className="px-4 py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(platformRows.length ? platformRows : emptyPlatforms()).map((row) => (
                  <tr key={row.key ?? row.platform}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{row.platform}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.spend)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatInteger(row.impressions)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatInteger(row.clicks)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatRateValue(row.clickRate)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatInteger(row.platformLeadOrActionCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatInteger(row.ekanyaLeadCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatInteger(row.visitCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatInteger(row.dealCount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(row.paidAmount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatRoiValue(row.paidRoi)}</td>
                    <td className="px-4 py-3 text-slate-600">{row.statusNote ?? "还没有解析该平台数据。"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">e看牙闭环概览</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">这里看 e看牙来源客户、到院、成交和实收。它是初步闭环，不是精准归因。</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="来源客户" value={formatInteger(closedLoop.leadCount)} />
            <Metric label="预约数" value={formatInteger(closedLoop.appointmentCount)} />
            <Metric label="到院数" value={formatInteger(closedLoop.visitCount)} />
            <Metric label="成交数" value={formatInteger(closedLoop.dealCount)} />
            <Metric label="实收金额" value={formatCurrency(closedLoop.paidAmount)} />
            <Metric label="初步 ROI" value={formatRoiValue(closedLoop.paidRoi)} />
            <Metric label="到院率" value={formatRateValue(closedLoop.visitRate)} />
            <Metric label="成交率" value={formatRateValue(closedLoop.dealRate)} />
          </dl>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">项目分类表现</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">这里按项目看来源、预约、到院、成交和实收。数据少时先不要急着下结论。</p>
          {projectRows.length ? (
            <div className="mt-4 max-h-[360px] overflow-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-100 text-left text-xs font-semibold text-slate-600">
                  <tr>
                    {["项目", "来源客户", "预约", "到院", "成交", "实收", "主要来源平台", "观察提示"].map((header) => (
                      <th key={header} className="px-4 py-3">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectRows.map((row) => (
                    <tr key={row.projectName}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{row.projectName}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.leadCount)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.appointmentCount)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.visitCount)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.dealCount)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(row.paidAmount)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.mainSourcePlatform ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.observationNote ?? "继续观察，不要自动调整。"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">当前时间范围内没有项目分类数据。</p>
          )}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">关键词 / 素材 / 创意重点观察</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">这里只做规则型观察，不自动暂停、不自动加价、不自动调价。</p>
          {highlights.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
                  <tr>
                    {["名称", "类型", "花费", "点击", "转化", "表单/电话", "咨询/私信", "规则提示"].map((header) => (
                      <th key={header} className="px-4 py-3">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {highlights.map((row) => (
                    <tr key={`${row.type}-${row.name}`}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{row.name}</td>
                      <td className="px-4 py-3 text-slate-700">{row.type}</td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(row.spend)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.clicks)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.conversions)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.formOrPhoneCount)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatInteger(row.consultCount)}</td>
                      <td className="px-4 py-3 text-slate-600">{row.ruleNote ?? "继续观察。"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">还没有关键词、素材或创意重点观察数据。</p>
          )}
        </section>

        <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-base font-semibold text-amber-950">本周提醒</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
            {reminders.map((reminder) => (
              <li key={reminder}>- {reminder}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function emptyPlatforms(): PlatformRow[] {
  return [
    { platform: "美团", key: "meituan", statusNote: "还没有解析该平台数据。" },
    { platform: "抖音", key: "douyin", statusNote: "还没有解析该平台数据。" },
    { platform: "腾讯广点通", key: "gdt", statusNote: "还没有解析该平台数据。" },
    { platform: "高德", key: "amap", statusNote: "还没有解析该平台数据。" },
  ];
}

function downloadCsv({ data, endDate, startDate }: { data: WeeklyReportData | null; endDate: string; startDate: string }) {
  const rows = [
    ["周报基础信息"],
    ["统计周期", `${startDate} 至 ${endDate}`],
    ["说明", "多平台周报雏形版，不是 AI 总结，也不是精准归因"],
    [],
    ["本周总览"],
    ...((data?.executiveSummary?.length ? data.executiveSummary : [emptyMessage]).map((item) => [item])),
    [],
    ["平台表现对比"],
    ["平台", "花费", "曝光", "点击", "平台动作/线索", "e看牙来源", "到院", "成交", "实收", "初步 ROI"],
    ...((data?.platformSummary?.length ? data.platformSummary : emptyPlatforms()).map((row) => [
      row.platform,
      formatCurrency(row.spend),
      formatInteger(row.impressions),
      formatInteger(row.clicks),
      formatInteger(row.platformLeadOrActionCount),
      formatInteger(row.ekanyaLeadCount),
      formatInteger(row.visitCount),
      formatInteger(row.dealCount),
      formatCurrency(row.paidAmount),
      formatRoiValue(row.paidRoi),
    ])),
    [],
    ["本周提醒"],
    ...((data?.reminders?.length ? data.reminders : [emptyMessage]).map((item) => [item])),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `multi-platform-weekly-report-${startDate}-${endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("zh-CN", {
    currency: "CNY",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(toNumber(value));
}

function formatInteger(value: number | null | undefined) {
  return Math.round(toNumber(value)).toLocaleString("zh-CN");
}

function formatRateValue(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : `${(toNumber(value) * 100).toFixed(1)}%`;
}

function formatRoiValue(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : toNumber(value).toFixed(1);
}

function toNumber(value: number | null | undefined) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getDateRange(rangeKey: RangeKey) {
  const today = startOfDay(new Date());
  if (rangeKey === "today") return datePair(today, today);
  if (rangeKey === "yesterday") return datePair(addDays(today, -1), addDays(today, -1));
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
  nextDate.setDate(nextDate.getDate() + days);
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
