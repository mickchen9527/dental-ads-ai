"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatInteger, formatRate, formatRoi } from "@/lib/utils/formatters";

type DateType = "source_date" | "visit_date" | "deal_date";

type ClosedLoopData = {
  range: {
    startDate: string;
    endDate: string;
    dateType: DateType;
  };
  meituanSummary: {
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
    consultRate: number | null;
    phoneRate: number | null;
    orderRate: number | null;
  };
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
    statusNote: string;
  };
  projectRows: Array<{
    projectName: string;
    leadCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    mainSourcePlatform: string;
    paidRoi: number | null;
    observationNote: string;
  }>;
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

export function MeituanClosedLoopBoard() {
  const [rangeKey, setRangeKey] = useState("last7");
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [startDate, setStartDate] = useState(() => getDateRange("last7").startDate);
  const [endDate, setEndDate] = useState(() => getDateRange("last7").endDate);
  const [data, setData] = useState<ClosedLoopData | null>(null);
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
        const response = await fetch(`/api/closed-loop/meituan?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.message ?? "读取美团闭环数据失败，请稍后再试。");
          setData(null);
          return;
        }

        setData(payload);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("读取美团闭环数据失败，请检查 Supabase 配置和解析表是否正常。");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void loadData();

    return () => controller.abort();
  }, [dateType, endDate, startDate]);

  return (
    <section className="mb-6 rounded-md border border-cyan-100 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">美团 + e看牙初步闭环</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">把美团前端数据和 e看牙回流放在一起看</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            这是初步闭环，不是精准归因。当前按时间范围、来源平台和项目分类，把美团前端数据与 e看牙后端回流放在一起看，帮助你判断钱有没有大致流回到真实到院和成交。
          </p>
        </div>
        <a
          className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
          href="/upload"
        >
          去上传并解析数据
        </a>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-800">时间筛选</p>
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

      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取真实解析数据...</p> : null}

      {!loading && data ? (
        <div className="mt-4 space-y-6">
          <EmptyStateNotices data={data} />
          <CoreCards data={data} />
          <FunnelBlocks data={data} />
          <KeywordTable rows={data.keywordTop10} hasRows={data.emptyStates.hasMeituanKeywords} />
          <ProjectTable rows={data.projectRows} hasRows={data.emptyStates.hasEkanyaBackflow} />
        </div>
      ) : null}
    </section>
  );
}

function EmptyStateNotices({ data }: { data: ClosedLoopData }) {
  const notices = [
    !data.emptyStates.hasMeituanSummary ? "还没有解析美团推广汇总数据，请先到数据上传页上传并解析。" : "",
    !data.emptyStates.hasMeituanKeywords ? "还没有解析美团关键词数据。没有关键词数据时，不影响基础闭环，但不能判断哪些词该处理。" : "",
    !data.emptyStates.hasEkanyaBackflow ? "还没有解析 e看牙后端回流数据，所以暂时只能看到美团前端数据，不能判断到院、成交和实收。" : "",
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

function CoreCards({ data }: { data: ClosedLoopData }) {
  const cards = [
    ["美团花费", formatCurrency(data.meituanSummary.totalSpend), "来自美团推广汇总解析数据"],
    ["点击", formatInteger(data.meituanSummary.totalClicks), `点击率 ${formatNullableRate(data.meituanSummary.clickRate)}`],
    ["查看电话", formatInteger(data.meituanSummary.phoneViews), `电话点击率 ${formatNullableRate(data.meituanSummary.phoneRate)}`],
    ["在线咨询", formatInteger(data.meituanSummary.onlineConsultClicks), `咨询点击率 ${formatNullableRate(data.meituanSummary.consultRate)}`],
    ["美团来源客户数", formatInteger(data.ekanyaSummary.leadCount), "来自 e看牙来源平台记录"],
    ["到院数", formatInteger(data.ekanyaSummary.visitCount), `到院率 ${formatNullableRate(data.ekanyaSummary.visitRate)}`],
    ["成交数", formatInteger(data.ekanyaSummary.dealCount), `成交率 ${formatNullableRate(data.ekanyaSummary.dealRate)}`],
    ["实收金额", formatCurrency(data.ekanyaSummary.paidAmount), `初步实收 ROI ${formatNullableRoi(data.ekanyaSummary.paidRoi)}`],
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
      <article className="rounded-md border border-emerald-200 bg-emerald-50 p-4 md:col-span-4">
        <p className="text-sm font-semibold text-emerald-900">实收 ROI 判断</p>
        <p className="mt-2 text-sm leading-6 text-emerald-900">{data.ekanyaSummary.statusNote}</p>
      </article>
    </div>
  );
}

function FunnelBlocks({ data }: { data: ClosedLoopData }) {
  const frontend = [
    ["曝光", formatInteger(data.meituanSummary.totalImpressions)],
    ["点击", formatInteger(data.meituanSummary.totalClicks)],
    ["电话/咨询", formatInteger(data.meituanSummary.phoneViews + data.meituanSummary.onlineConsultClicks)],
    ["订单", formatInteger(data.meituanSummary.orders)],
  ];
  const backend = [
    ["美团来源客户", formatInteger(data.ekanyaSummary.leadCount)],
    ["到院", formatInteger(data.ekanyaSummary.visitCount)],
    ["成交", formatInteger(data.ekanyaSummary.dealCount)],
    ["实收", formatCurrency(data.ekanyaSummary.paidAmount)],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChainCard title="前端链路" description="看美团页面前面有没有人看、点、问、下单。" rows={frontend} />
      <ChainCard title="后端回流" description="看美团来的客户有没有进入 e看牙、到院、成交和实收。" rows={backend} />
    </div>
  );
}

function ChainCard({ title, description, rows }: { title: string; description: string; rows: string[][] }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md bg-slate-50 p-3 text-center">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function KeywordTable({ rows, hasRows }: { rows: ClosedLoopData["keywordTop10"]; hasRows: boolean }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">关键词 Top 10</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        这里不是自动调词，只是按花费排序后给一个规则提示。真正要降价、加价或暂停，仍然要人工复核。
      </p>
      {!hasRows ? (
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          还没有解析美团关键词数据。没有关键词数据时，不影响基础闭环，但不能判断哪些词该处理。
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {[
                  "关键词",
                  "花费",
                  "曝光",
                  "点击",
                  "点击成本",
                  "查看电话",
                  "在线咨询",
                  "订单",
                  "团购订单",
                  "规则提示",
                ].map((header) => (
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

function ProjectTable({ rows, hasRows }: { rows: ClosedLoopData["projectRows"]; hasRows: boolean }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">项目分类闭环</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        项目 ROI 这里只做整体参考，不是把每个项目的广告费精确分摊。重点先看哪些项目带来到院、成交和实收。
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
                {["项目", "来源客户", "到院", "成交", "实收", "平均实收", "主要来源", "初步实收 ROI", "观察提示"].map((header) => (
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
                  <td className="px-4 py-3 text-slate-700">{formatNullableRoi(row.paidRoi)}</td>
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

  if (rangeKey === "today") {
    return datePair(today, today);
  }

  if (rangeKey === "yesterday") {
    const yesterday = addDays(today, -1);
    return datePair(yesterday, yesterday);
  }

  if (rangeKey === "thisWeek") {
    return datePair(startOfWeek(today), today);
  }

  if (rangeKey === "lastWeek") {
    const thisWeekStart = startOfWeek(today);
    return datePair(addDays(thisWeekStart, -7), addDays(thisWeekStart, -1));
  }

  if (rangeKey === "thisMonth") {
    return datePair(new Date(today.getFullYear(), today.getMonth(), 1), today);
  }

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