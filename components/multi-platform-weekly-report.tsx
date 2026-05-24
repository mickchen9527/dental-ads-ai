"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatInteger, formatRate, formatRoi } from "@/lib/utils/formatters";

type DateType = "source_date" | "visit_date" | "deal_date";
type RangeKey = "today" | "yesterday" | "last7" | "thisWeek" | "lastWeek" | "thisMonth" | "custom";

type PlatformSummaryRow = {
  platform: string;
  key: "meituan" | "douyin" | "gdt" | "amap";
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  clickRate: number | null;
  platformLeadOrActionCount: number;
  ekanyaLeadCount: number;
  visitCount: number;
  dealCount: number;
  paidAmount: number;
  paidRoi: number | null;
  statusNote: string;
};

type ProjectSummaryRow = {
  projectName: string;
  leadCount: number;
  appointmentCount: number;
  visitCount: number;
  dealCount: number;
  paidAmount: number;
  avgPaidAmount: number | null;
  mainSourcePlatform: string;
  observationNote: string;
};

type HighlightRow = {
  name: string;
  type: string;
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  conversions: number;
  formOrPhoneCount: number;
  consultCount: number;
  ruleNote: string;
};

type WeeklyReportData = {
  range: {
    startDate: string;
    endDate: string;
    dateType: DateType;
  };
  executiveSummary: string[];
  platformSummary: PlatformSummaryRow[];
  frontDataSummary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgClickCost: number | null;
    totalPlatformLeadOrActionCount: number;
    highestSpendPlatform: string;
    mostClickPlatform: string;
    mostActionPlatform: string;
  };
  closedLoopSummary: {
    leadCount: number;
    appointmentCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    paidRoi: number | null;
    visitRate: number | null;
    dealRate: number | null;
  };
  projectSummary: ProjectSummaryRow[];
  keywordAndCreativeHighlights: {
    meituanKeywordsTop10: HighlightRow[];
    douyinCreativesTop10: HighlightRow[];
    gdtCreativesTop10: HighlightRow[];
  };
  reminders: string[];
  emptyStates: {
    hasAnyData: boolean;
    hasEkanyaBackflow: boolean;
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
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const displayReport = report ?? createEmptyReport(startDate, endDate, dateType);

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
          setReport(null);
          setError(payload.message ?? "读取多平台周报数据失败，请稍后再试。");
          return;
        }

        setReport(withReportDefaults(payload, startDate, endDate, dateType));
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setReport(null);
        setError("读取多平台周报数据失败，请检查 Supabase 配置和解析表是否正常。");
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
          <h2 className="mt-1 text-lg font-semibold text-slate-950">多平台周报</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{reportDescription}</p>
        </div>
        <button
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="button"
          onClick={() => downloadCsv(displayReport)}
        >
          下载 CSV 周报
        </button>
      </div>

      <FilterPanel
        dateType={dateType}
        endDate={endDate}
        rangeKey={rangeKey}
        setDateType={setDateType}
        setEndDate={setEndDate}
        setRangeKey={setRangeKey}
        setStartDate={setStartDate}
        startDate={startDate}
      />

      {error ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">{error}</div>
      ) : null}
      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取真实多平台周报数据...</p> : null}
      {!loading && !displayReport.emptyStates.hasAnyData ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">{emptyMessage}</div>
      ) : null}

      <div className="mt-5 space-y-6">
        <ExecutiveSummary data={displayReport} />
        <OverviewSections data={displayReport} />
        <PlatformSection rows={displayReport.platformSummary} />
        <ProjectSection rows={displayReport.projectSummary} />
        <HighlightSection data={displayReport} />
        <ReminderSection reminders={displayReport.reminders} />
      </div>
    </section>
  );
}

function FilterPanel({
  dateType,
  endDate,
  rangeKey,
  setDateType,
  setEndDate,
  setRangeKey,
  setStartDate,
  startDate,
}: {
  dateType: DateType;
  endDate: string;
  rangeKey: RangeKey;
  setDateType: (value: DateType) => void;
  setEndDate: (value: string) => void;
  setRangeKey: (value: RangeKey) => void;
  setStartDate: (value: string) => void;
  startDate: string;
}) {
  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">时间筛选和时间口径</p>
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
    </div>
  );
}

function ExecutiveSummary({ data }: { data: WeeklyReportData }) {
  return (
    <section className="rounded-md border border-cyan-200 bg-cyan-50 p-4">
      <h3 className="text-base font-semibold text-cyan-950">本周总览</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-cyan-900">
        {data.executiveSummary.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </section>
  );
}

function OverviewSections({ data }: { data: WeeklyReportData }) {
  const frontRows = [
    ["总花费", formatCurrency(data.frontDataSummary.totalSpend)],
    ["总曝光", formatInteger(data.frontDataSummary.totalImpressions)],
    ["总点击", formatInteger(data.frontDataSummary.totalClicks)],
    ["平均点击成本", formatNullableCurrency(data.frontDataSummary.avgClickCost)],
    ["平台动作/线索总数", formatInteger(data.frontDataSummary.totalPlatformLeadOrActionCount)],
    ["花费最高平台", data.frontDataSummary.highestSpendPlatform],
    ["点击最多平台", data.frontDataSummary.mostClickPlatform],
    ["线索/动作最多平台", data.frontDataSummary.mostActionPlatform],
  ];

  const closedRows = [
    ["e看牙来源客户数", formatInteger(data.closedLoopSummary.leadCount)],
    ["预约数", formatInteger(data.closedLoopSummary.appointmentCount)],
    ["到院数", formatInteger(data.closedLoopSummary.visitCount)],
    ["成交数", formatInteger(data.closedLoopSummary.dealCount)],
    ["实收金额", formatCurrency(data.closedLoopSummary.paidAmount)],
    ["平均实收", formatNullableCurrency(data.closedLoopSummary.avgPaidAmount)],
    ["初步 ROI", formatNullableRoi(data.closedLoopSummary.paidRoi)],
    ["到院率", formatNullableRate(data.closedLoopSummary.visitRate)],
    ["成交率", formatNullableRate(data.closedLoopSummary.dealRate)],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MiniTable title="平台前端数据" rows={frontRows} />
      <MiniTable title="e看牙闭环概览" rows={closedRows} note="这里是规则型初步闭环，不是精准归因。" />
    </div>
  );
}

function MiniTable({ title, rows, note }: { title: string; rows: string[][]; note?: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {note ? <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p> : null}
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function PlatformSection({ rows }: { rows: PlatformSummaryRow[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">平台表现对比</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        平台花费来自前端解析数据，到院、成交、实收来自 e看牙回流。当前不是精准一对一匹配。
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
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
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-3 font-semibold text-slate-950">{row.platform}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(row.spend)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(row.impressions)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(row.clicks)}</td>
                <td className="px-4 py-3 text-slate-700">{formatNullableRate(row.clickRate)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(row.platformLeadOrActionCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(row.ekanyaLeadCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(row.visitCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(row.dealCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(row.paidAmount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatNullableRoi(row.paidRoi)}</td>
                <td className="px-4 py-3 text-slate-600">{row.statusNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProjectSection({ rows }: { rows: ProjectSummaryRow[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">项目分类表现</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">按 e看牙项目字段汇总，优先看成交项目，其次看到院项目和意向项目。</p>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">当前时间范围内没有项目分类数据。</p>
      ) : (
        <div className="mt-4 max-h-[420px] overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="sticky top-0 bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["项目", "来源客户", "预约", "到院", "成交", "实收", "平均实收", "主要来源平台", "当前观察建议"].map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
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

function HighlightSection({ data }: { data: WeeklyReportData }) {
  const sections = [
    ["美团关键词 Top 10", data.keywordAndCreativeHighlights.meituanKeywordsTop10],
    ["抖音素材 / 创意 Top 10", data.keywordAndCreativeHighlights.douyinCreativesTop10],
    ["腾讯广告组 / 创意 Top 10", data.keywordAndCreativeHighlights.gdtCreativesTop10],
  ] as const;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">关键词 / 素材 / 创意重点观察</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">按花费倒序展示，只给规则提示，不做自动调价、自动暂停或 AI 建议。</p>
      <div className="mt-4 space-y-4">
        {sections.map(([title, rows]) => (
          <HighlightTable key={title} title={title} rows={rows} />
        ))}
      </div>
    </section>
  );
}

function HighlightTable({ title, rows }: { title: string; rows: HighlightRow[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {rows.length === 0 ? (
        <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">还没有解析对应数据。</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["名称", "类型", "花费", "曝光", "点击", "点击均价", "转化", "表单/电话", "咨询/私信", "规则提示"].map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={`${row.type}-${row.name}`}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.type}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(row.spend)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.impressions)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.clicks)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(row.avgClickCost)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.conversions)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.formOrPhoneCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.consultCount)}</td>
                  <td className="px-4 py-3 text-slate-600">{row.ruleNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReminderSection({ reminders }: { reminders: string[] }) {
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-base font-semibold text-amber-950">本周提醒</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
        {reminders.map((reminder) => (
          <li key={reminder}>- {reminder}</li>
        ))}
      </ul>
    </section>
  );
}

function createEmptyReport(startDate: string, endDate: string, dateType: DateType): WeeklyReportData {
  return {
    range: { startDate, endDate, dateType },
    executiveSummary: [emptyMessage],
    platformSummary: [
      createEmptyPlatform("美团", "meituan"),
      createEmptyPlatform("抖音", "douyin"),
      createEmptyPlatform("腾讯广点通", "gdt"),
      createEmptyPlatform("高德", "amap"),
    ],
    frontDataSummary: {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      avgClickCost: null,
      totalPlatformLeadOrActionCount: 0,
      highestSpendPlatform: "暂无",
      mostClickPlatform: "暂无",
      mostActionPlatform: "暂无",
    },
    closedLoopSummary: {
      leadCount: 0,
      appointmentCount: 0,
      visitCount: 0,
      dealCount: 0,
      paidAmount: 0,
      avgPaidAmount: null,
      paidRoi: null,
      visitRate: null,
      dealRate: null,
    },
    projectSummary: [],
    keywordAndCreativeHighlights: {
      meituanKeywordsTop10: [],
      douyinCreativesTop10: [],
      gdtCreativesTop10: [],
    },
    reminders: [emptyMessage],
    emptyStates: {
      hasAnyData: false,
      hasEkanyaBackflow: false,
    },
  };
}

function createEmptyPlatform(platform: string, key: PlatformSummaryRow["key"]): PlatformSummaryRow {
  return {
    platform,
    key,
    spend: 0,
    impressions: 0,
    clicks: 0,
    avgClickCost: null,
    clickRate: null,
    platformLeadOrActionCount: 0,
    ekanyaLeadCount: 0,
    visitCount: 0,
    dealCount: 0,
    paidAmount: 0,
    paidRoi: null,
    statusNote: "还没有解析该平台数据。",
  };
}

function withReportDefaults(payload: Partial<WeeklyReportData>, startDate: string, endDate: string, dateType: DateType): WeeklyReportData {
  const fallback = createEmptyReport(startDate, endDate, dateType);

  return {
    ...fallback,
    ...payload,
    range: { ...fallback.range, ...payload.range },
    frontDataSummary: { ...fallback.frontDataSummary, ...payload.frontDataSummary },
    closedLoopSummary: { ...fallback.closedLoopSummary, ...payload.closedLoopSummary },
    keywordAndCreativeHighlights: { ...fallback.keywordAndCreativeHighlights, ...payload.keywordAndCreativeHighlights },
    emptyStates: { ...fallback.emptyStates, ...payload.emptyStates },
    executiveSummary: payload.executiveSummary?.length ? payload.executiveSummary : fallback.executiveSummary,
    platformSummary: payload.platformSummary?.length ? payload.platformSummary : fallback.platformSummary,
    projectSummary: payload.projectSummary ?? fallback.projectSummary,
    reminders: payload.reminders?.length ? payload.reminders : fallback.reminders,
  };
}

function downloadCsv(data: WeeklyReportData) {
  const rows = buildCsvRows(data);
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `multi-platform-weekly-report-${data.range.startDate}-${data.range.endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildCsvRows(data: WeeklyReportData): string[][] {
  const dateTypeLabel = dateTypeOptions.find((item) => item.value === data.range.dateType)?.label ?? data.range.dateType;
  const highlights = [
    ...data.keywordAndCreativeHighlights.meituanKeywordsTop10,
    ...data.keywordAndCreativeHighlights.douyinCreativesTop10,
    ...data.keywordAndCreativeHighlights.gdtCreativesTop10,
  ];

  return [
    ["周报基础信息"],
    ["统计周期", `${data.range.startDate} 至 ${data.range.endDate}`],
    ["时间口径", dateTypeLabel],
    ["说明", "多平台周报雏形版，不是 AI 总结，也不是精准归因"],
    [],
    ["本周总览"],
    ...data.executiveSummary.map((item) => [item]),
    [],
    ["平台表现对比"],
    ["平台", "花费", "曝光", "点击", "点击率", "平台动作/线索", "e看牙来源", "到院", "成交", "实收", "初步 ROI", "状态提示"],
    ...data.platformSummary.map((row) => [
      row.platform,
      formatCurrency(row.spend),
      formatInteger(row.impressions),
      formatInteger(row.clicks),
      formatNullableRate(row.clickRate),
      formatInteger(row.platformLeadOrActionCount),
      formatInteger(row.ekanyaLeadCount),
      formatInteger(row.visitCount),
      formatInteger(row.dealCount),
      formatCurrency(row.paidAmount),
      formatNullableRoi(row.paidRoi),
      row.statusNote,
    ]),
    [],
    ["e看牙闭环概览"],
    ["e看牙来源客户数", formatInteger(data.closedLoopSummary.leadCount)],
    ["预约数", formatInteger(data.closedLoopSummary.appointmentCount)],
    ["到院数", formatInteger(data.closedLoopSummary.visitCount)],
    ["成交数", formatInteger(data.closedLoopSummary.dealCount)],
    ["实收金额", formatCurrency(data.closedLoopSummary.paidAmount)],
    ["平均实收", formatNullableCurrency(data.closedLoopSummary.avgPaidAmount)],
    ["初步 ROI", formatNullableRoi(data.closedLoopSummary.paidRoi)],
    ["到院率", formatNullableRate(data.closedLoopSummary.visitRate)],
    ["成交率", formatNullableRate(data.closedLoopSummary.dealRate)],
    [],
    ["项目分类表现"],
    ["项目名称", "来源客户数", "预约数", "到院数", "成交数", "实收金额", "平均实收", "主要来源平台", "当前观察建议"],
    ...data.projectSummary.map((row) => [
      row.projectName,
      formatInteger(row.leadCount),
      formatInteger(row.appointmentCount),
      formatInteger(row.visitCount),
      formatInteger(row.dealCount),
      formatCurrency(row.paidAmount),
      formatNullableCurrency(row.avgPaidAmount),
      row.mainSourcePlatform,
      row.observationNote,
    ]),
    [],
    ["关键词 / 素材 / 创意重点观察"],
    ["名称", "类型", "花费", "曝光", "点击", "点击均价", "转化", "表单/电话", "咨询/私信", "规则提示"],
    ...highlights.map((row) => [
      row.name,
      row.type,
      formatCurrency(row.spend),
      formatInteger(row.impressions),
      formatInteger(row.clicks),
      formatNullableCurrency(row.avgClickCost),
      formatInteger(row.conversions),
      formatInteger(row.formOrPhoneCount),
      formatInteger(row.consultCount),
      row.ruleNote,
    ]),
    [],
    ["本周提醒"],
    ...data.reminders.map((reminder) => [reminder]),
  ];
}

function escapeCsvCell(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function formatNullableCurrency(value: number | null) {
  return value === null ? "-" : formatCurrency(value);
}

function formatNullableRate(value: number | null) {
  return value === null ? "-" : formatRate(value);
}

function formatNullableRoi(value: number | null) {
  return value === null ? "-" : formatRoi(value);
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
