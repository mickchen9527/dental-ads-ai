"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatInteger, formatRate, formatRoi } from "@/lib/utils/formatters";

type DateType = "source_date" | "visit_date" | "deal_date";

type WeeklyReportData = {
  range: {
    startDate: string;
    endDate: string;
    dateType: DateType;
  };
  adOverview: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgClickCost: number | null;
    merchantViews: number;
    phoneViews: number;
    onlineConsultClicks: number;
    orders: number;
    groupBuyOrders: number;
    groupBuyOrders15d: number;
    clickRate: number | null;
    phoneRate: number | null;
    consultRate: number | null;
    orderRate: number | null;
  };
  ekanyaOverview: {
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
  projectRows: Array<{
    projectName: string;
    leadCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    mainSourcePlatform: string;
    observationNote: string;
  }>;
  keywordTop10: Array<{
    keyword: string;
    spend: number;
    impressions: number;
    clicks: number;
    avgClickCost: number | null;
    phoneViews: number;
    onlineConsultClicks: number;
    orders: number;
    groupBuyOrders: number;
    ruleNote: string;
  }>;
  reminders: string[];
  emptyStates: {
    hasMeituanSummary: boolean;
    hasMeituanKeywords: boolean;
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

export function WeeklyReportDraft() {
  const [rangeKey, setRangeKey] = useState("last7");
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [startDate, setStartDate] = useState(() => getDateRange("last7").startDate);
  const [endDate, setEndDate] = useState(() => getDateRange("last7").endDate);
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
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
          setError(payload.message ?? "读取周报数据失败，请稍后再试。");
          setData(null);
          return;
        }

        setData(payload);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("读取周报数据失败，请检查 Supabase 配置和解析表是否正常。");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void loadData();

    return () => controller.abort();
  }, [dateType, endDate, startDate]);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">项目/投放周报雏形版</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">周报预览</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            这是周报雏形版，读取已解析的美团推广数据、美团关键词数据和 e看牙回流数据，帮你开周会时快速看本周花费、到院、成交、实收和项目表现。当前不是 AI 总结，也不是精准归因。
          </p>
        </div>
        <button
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!data}
          type="button"
          onClick={() => data && downloadCsv(data)}
        >
          下载 CSV 周报
        </button>
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
      </div>

      {error ? <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">{error}</div> : null}
      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取真实周报数据...</p> : null}

      {!loading && data ? (
        <div className="mt-4 space-y-6">
          <EmptyStates data={data} />
          <OverviewSections data={data} />
          <ProjectSection rows={data.projectRows} />
          <KeywordSection rows={data.keywordTop10} hasRows={data.emptyStates.hasMeituanKeywords} />
          <ReminderSection reminders={data.reminders} />
        </div>
      ) : null}
    </section>
  );
}

function EmptyStates({ data }: { data: WeeklyReportData }) {
  const messages = [
    !data.emptyStates.hasMeituanSummary ? "还没有解析美团推广汇总数据，请先到数据上传页上传并解析。" : "",
    !data.emptyStates.hasMeituanKeywords ? "还没有解析美团关键词数据。没有关键词数据时，周报不会展示关键词 Top 10。" : "",
    !data.emptyStates.hasEkanyaBackflow ? "还没有解析 e看牙后端回流数据。没有回流数据时，周报无法展示到院、成交和实收。" : "",
  ].filter(Boolean);

  if (messages.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}

function OverviewSections({ data }: { data: WeeklyReportData }) {
  const adRows = [
    ["美团总花费", formatCurrency(data.adOverview.totalSpend)],
    ["总曝光", formatInteger(data.adOverview.totalImpressions)],
    ["总点击", formatInteger(data.adOverview.totalClicks)],
    ["平均点击成本", formatNullableCurrency(data.adOverview.avgClickCost)],
    ["商户浏览量", formatInteger(data.adOverview.merchantViews)],
    ["查看电话", formatInteger(data.adOverview.phoneViews)],
    ["在线咨询点击", formatInteger(data.adOverview.onlineConsultClicks)],
    ["订单量", formatInteger(data.adOverview.orders)],
    ["团购订单量", formatInteger(data.adOverview.groupBuyOrders)],
    ["15日团购订单量", formatInteger(data.adOverview.groupBuyOrders15d)],
    ["点击率", formatNullableRate(data.adOverview.clickRate)],
    ["电话率", formatNullableRate(data.adOverview.phoneRate)],
    ["咨询率", formatNullableRate(data.adOverview.consultRate)],
    ["订单率", formatNullableRate(data.adOverview.orderRate)],
  ];

  const ekanyaRows = [
    ["来源客户数", formatInteger(data.ekanyaOverview.leadCount)],
    ["预约数", formatInteger(data.ekanyaOverview.appointmentCount)],
    ["到院数", formatInteger(data.ekanyaOverview.visitCount)],
    ["成交数", formatInteger(data.ekanyaOverview.dealCount)],
    ["实收金额", formatCurrency(data.ekanyaOverview.paidAmount)],
    ["平均实收", formatNullableCurrency(data.ekanyaOverview.avgPaidAmount)],
    ["到院率", formatNullableRate(data.ekanyaOverview.visitRate)],
    ["成交率", formatNullableRate(data.ekanyaOverview.dealRate)],
    ["初步实收 ROI", formatNullableRoi(data.ekanyaOverview.paidRoi)],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MiniTable title="本周投放概览" rows={adRows} />
      <MiniTable
        title="e看牙回流概览"
        rows={ekanyaRows}
        note="这不是精准归因，只是按时间范围和来源平台做初步闭环参考。"
      />
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

function ProjectSection({ rows }: { rows: WeeklyReportData["projectRows"] }) {
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
                {["项目", "来源客户", "到院", "成交", "实收", "平均实收", "主要来源平台", "当前观察建议"].map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.projectName}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{row.projectName}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.leadCount)}</td>
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

function KeywordSection({ rows, hasRows }: { rows: WeeklyReportData["keywordTop10"]; hasRows: boolean }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">美团关键词 Top 10</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">按花费倒序展示，只给规则提示，不做自动调价或自动暂停。</p>
      {!hasRows ? (
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">还没有解析美团关键词数据。没有关键词数据时，周报不会展示关键词 Top 10。</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["关键词", "花费", "曝光", "点击", "点击均价", "查看电话", "在线咨询点击", "订单量", "团购订单量", "初步判断"].map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.keyword}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{row.keyword}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(row.spend)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.impressions)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.clicks)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(row.avgClickCost)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.phoneViews)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.onlineConsultClicks)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.orders)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.groupBuyOrders)}</td>
                  <td className="px-4 py-3 text-slate-600">{row.ruleNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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

function downloadCsv(data: WeeklyReportData) {
  const rows = buildCsvRows(data);
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `weekly-report-${data.range.startDate}-${data.range.endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildCsvRows(data: WeeklyReportData) {
  const dateTypeLabel = dateTypeOptions.find((item) => item.value === data.range.dateType)?.label ?? data.range.dateType;
  const rows: string[][] = [
    ["周报基础信息"],
    ["统计周期", `${data.range.startDate} 至 ${data.range.endDate}`],
    ["时间口径", dateTypeLabel],
    ["说明", "周报雏形版，不是 AI 总结，也不是精准归因"],
    [],
    ["本周投放概览"],
    ["美团总花费", formatCurrency(data.adOverview.totalSpend)],
    ["总曝光", formatInteger(data.adOverview.totalImpressions)],
    ["总点击", formatInteger(data.adOverview.totalClicks)],
    ["平均点击成本", formatNullableCurrency(data.adOverview.avgClickCost)],
    ["商户浏览量", formatInteger(data.adOverview.merchantViews)],
    ["查看电话", formatInteger(data.adOverview.phoneViews)],
    ["在线咨询点击", formatInteger(data.adOverview.onlineConsultClicks)],
    ["订单量", formatInteger(data.adOverview.orders)],
    ["团购订单量", formatInteger(data.adOverview.groupBuyOrders)],
    ["15日团购订单量", formatInteger(data.adOverview.groupBuyOrders15d)],
    ["点击率", formatNullableRate(data.adOverview.clickRate)],
    ["电话率", formatNullableRate(data.adOverview.phoneRate)],
    ["咨询率", formatNullableRate(data.adOverview.consultRate)],
    ["订单率", formatNullableRate(data.adOverview.orderRate)],
    [],
    ["e看牙回流概览"],
    ["来源客户数", formatInteger(data.ekanyaOverview.leadCount)],
    ["预约数", formatInteger(data.ekanyaOverview.appointmentCount)],
    ["到院数", formatInteger(data.ekanyaOverview.visitCount)],
    ["成交数", formatInteger(data.ekanyaOverview.dealCount)],
    ["实收金额", formatCurrency(data.ekanyaOverview.paidAmount)],
    ["平均实收", formatNullableCurrency(data.ekanyaOverview.avgPaidAmount)],
    ["到院率", formatNullableRate(data.ekanyaOverview.visitRate)],
    ["成交率", formatNullableRate(data.ekanyaOverview.dealRate)],
    ["初步实收 ROI", formatNullableRoi(data.ekanyaOverview.paidRoi)],
    [],
    ["项目分类表现"],
    ["项目名称", "来源客户数", "到院数", "成交数", "实收金额", "平均实收", "主要来源平台", "当前观察建议"],
    ...data.projectRows.map((row) => [
      row.projectName,
      formatInteger(row.leadCount),
      formatInteger(row.visitCount),
      formatInteger(row.dealCount),
      formatCurrency(row.paidAmount),
      formatNullableCurrency(row.avgPaidAmount),
      row.mainSourcePlatform,
      row.observationNote,
    ]),
    [],
    ["美团关键词 Top 10"],
    ["关键词", "花费", "曝光", "点击", "点击均价", "查看电话", "在线咨询点击", "订单量", "团购订单量", "初步判断"],
    ...data.keywordTop10.map((row) => [
      row.keyword,
      formatCurrency(row.spend),
      formatInteger(row.impressions),
      formatInteger(row.clicks),
      formatNullableCurrency(row.avgClickCost),
      formatInteger(row.phoneViews),
      formatInteger(row.onlineConsultClicks),
      formatInteger(row.orders),
      formatInteger(row.groupBuyOrders),
      row.ruleNote,
    ]),
    [],
    ["本周提醒"],
    ...data.reminders.map((reminder) => [reminder]),
  ];

  return rows;
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
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

function getDateRange(rangeKey: string) {
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