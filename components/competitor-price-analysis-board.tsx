"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PriceRange = {
  minPrice: number;
  maxPrice: number;
} | null;

type CompetitorAnalysis = {
  summary: {
    competitorCount: number;
    itemCount: number;
    categoryCount: number;
    minPrice: number | null;
    maxPrice: number | null;
    avgPrice: number | null;
    yazhengItemCount: number;
    updatedAtRange: { startDate: string | null; endDate: string | null };
  };
  categoryComparison: Array<{
    projectCategory: string;
    itemCount: number;
    competitorCount: number;
    minPrice: number | null;
    maxPrice: number | null;
    avgPrice: number | null;
    yazhengPriceRange: PriceRange;
    pricePositionNote: string;
  }>;
  hospitalComparison: Array<{
    hospitalName: string;
    itemCount: number;
    minPrice: number | null;
    maxPrice: number | null;
    avgPrice: number | null;
    mainCategories: string[];
    lowPriceItemCount: number;
    highPriceItemCount: number;
    note: string;
  }>;
  priceBands: Array<{ bandName: string; itemCount: number; mainCategories: string[] }>;
  lowPriceItems: Array<{
    hospitalName: string;
    projectCategory: string;
    projectName: string;
    price: number | null;
    projectAttribute: string;
    note: string;
  }>;
  highValueItems: Array<{
    hospitalName: string;
    projectCategory: string;
    projectName: string;
    price: number | null;
    note: string;
  }>;
  reminders: string[];
};

type AnalysisFilters = {
  hospitalName: string;
  projectCategory: string;
  projectAttribute: string;
  minPrice: string;
  maxPrice: string;
  keyword: string;
  startDate: string;
  endDate: string;
};

const emptyFilters: AnalysisFilters = {
  hospitalName: "",
  projectCategory: "全部",
  projectAttribute: "全部",
  minPrice: "",
  maxPrice: "",
  keyword: "",
  startDate: "",
  endDate: "",
};

const projectCategoryOptions = [
  "洁牙",
  "补牙",
  "拔牙",
  "智齿",
  "儿牙",
  "窝沟封闭",
  "涂氟",
  "根管",
  "牙周",
  "种植",
  "正畸",
  "儿童早矫",
  "修复/牙冠",
  "美白/贴面",
  "检查",
  "其他",
];
const projectAttributeOptions = ["引流项目", "正式项目", "高客单项目", "检查项目", "其他"];

export function CompetitorPriceAnalysisBoard() {
  const [filters, setFilters] = useState<AnalysisFilters>(emptyFilters);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim() && value !== "全部") params.set(key, value.trim());
    });

    try {
      const response = await fetch(`/api/competitor-prices/analysis?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "读取竞品价格对比失败，请稍后再试。");
      setAnalysis(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "读取竞品价格对比失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnalysis();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAnalysis]);

  const hasData = Boolean(analysis && analysis.summary.itemCount > 0);
  const statCards = useMemo(() => {
    if (!analysis) return [];
    return [
      { label: "竞品医院数", value: String(analysis.summary.competitorCount) },
      { label: "价格项目数", value: String(analysis.summary.itemCount) },
      { label: "项目分类数", value: String(analysis.summary.categoryCount) },
      { label: "最低价", value: formatNullableCurrency(analysis.summary.minPrice) },
      { label: "最高价", value: formatNullableCurrency(analysis.summary.maxPrice) },
      { label: "平均价", value: formatNullableCurrency(analysis.summary.avgPrice) },
    ];
  }, [analysis]);

  function updateFilter(key: keyof AnalysisFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function downloadCsv() {
    if (!analysis) return;

    const rows: Array<Array<string | number | null>> = [
      ["模块", "字段1", "字段2", "字段3", "字段4", "字段5", "字段6", "字段7"],
      ["总览", "竞品医院数", analysis.summary.competitorCount, "价格项目数", analysis.summary.itemCount, "平均价", analysis.summary.avgPrice, ""],
      ["总览", "最低价", analysis.summary.minPrice, "最高价", analysis.summary.maxPrice, "项目分类数", analysis.summary.categoryCount, ""],
      ["分类对比", "项目分类", "项目数", "竞品医院数", "最低价", "最高价", "平均价", "观察提示"],
      ...analysis.categoryComparison.map((item) => [
        "分类对比",
        item.projectCategory,
        item.itemCount,
        item.competitorCount,
        item.minPrice,
        item.maxPrice,
        item.avgPrice,
        item.pricePositionNote,
      ]),
      ["医院对比", "医院名称", "项目数", "最低价", "最高价", "平均价", "主要分类", "观察提示"],
      ...analysis.hospitalComparison.map((item) => [
        "医院对比",
        item.hospitalName,
        item.itemCount,
        item.minPrice,
        item.maxPrice,
        item.avgPrice,
        item.mainCategories.join(" / "),
        item.note,
      ]),
      ["低价项目", "医院", "分类", "项目名称", "价格", "项目属性", "提醒", ""],
      ...analysis.lowPriceItems.map((item) => [
        "低价项目",
        item.hospitalName,
        item.projectCategory,
        item.projectName,
        item.price,
        item.projectAttribute,
        item.note,
        "",
      ]),
      ["高价值项目", "医院", "分类", "项目名称", "价格", "提醒", "", ""],
      ...analysis.highValueItems.map((item) => ["高价值项目", item.hospitalName, item.projectCategory, item.projectName, item.price, item.note, "", ""]),
      ["提醒", "内容", "", "", "", "", "", ""],
      ...analysis.reminders.map((item) => ["提醒", item, "", "", "", "", "", ""]),
    ];

    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `competitor-price-analysis-${todayString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6 rounded-md border border-cyan-200 bg-cyan-50/40 p-4" id="competitor-price-analysis">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">竞品价格对比看板</h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
            这里基于手动导入的竞品公开价格做对比，帮助查看本地口腔项目价格分布。当前不做自动采集，不做爬虫，不采集隐私数据，也不会自动调整雅正价格。
          </p>
        </div>
        <button
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={!analysis}
          onClick={downloadCsv}
        >
          下载竞品价格对比 CSV
        </button>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h4 className="text-base font-semibold text-slate-950">筛选区</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="医院" value={filters.hospitalName} placeholder="搜索医院名称" onChange={(value) => updateFilter("hospitalName", value)} />
          <SelectInput label="项目分类" value={filters.projectCategory} options={["全部", ...projectCategoryOptions]} onChange={(value) => updateFilter("projectCategory", value)} />
          <SelectInput label="项目属性" value={filters.projectAttribute} options={["全部", ...projectAttributeOptions]} onChange={(value) => updateFilter("projectAttribute", value)} />
          <TextInput label="关键词" value={filters.keyword} placeholder="医院、项目、套餐、限制、备注" onChange={(value) => updateFilter("keyword", value)} />
          <TextInput label="最低价" value={filters.minPrice} placeholder="例如：99" onChange={(value) => updateFilter("minPrice", value)} />
          <TextInput label="最高价" value={filters.maxPrice} placeholder="例如：5000" onChange={(value) => updateFilter("maxPrice", value)} />
          <DateInput label="采集日期开始" value={filters.startDate} onChange={(value) => updateFilter("startDate", value)} />
          <DateInput label="采集日期结束" value={filters.endDate} onChange={(value) => updateFilter("endDate", value)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" type="button" onClick={() => void loadAnalysis()}>
            查询对比
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            type="button"
            onClick={() => setFilters(emptyFilters)}
          >
            清空筛选
          </button>
          <a className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" href="#competitor-price-library">
            去导入竞品价格
          </a>
        </div>
      </section>

      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">正在读取竞品价格对比数据。</p> : null}

      {!loading && !hasData ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-950">还没有竞品价格数据。请先导入手动整理的竞品公开价格表。</p>
          <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="#competitor-price-library">
            去导入竞品价格
          </a>
        </section>
      ) : null}

      {analysis && hasData ? (
        <>
          <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {statCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} />
            ))}
          </section>

          <TableSection title="项目分类对比表" description="这里看不同项目分类的价格分布。低价项目多时，不要只拿最低价做调价依据。">
            <div className="max-h-[420px] overflow-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
                  <tr>{["项目分类", "项目数", "竞品医院数", "最低价", "最高价", "平均价", "雅正价格位置", "观察提示"].map((header) => <th className="px-4 py-3" key={header}>{header}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {analysis.categoryComparison.map((item) => (
                    <tr key={item.projectCategory}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{item.projectCategory}</td>
                      <td className="px-4 py-3 text-slate-700">{item.itemCount}</td>
                      <td className="px-4 py-3 text-slate-700">{item.competitorCount}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.minPrice)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.maxPrice)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.avgPrice)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatPriceRange(item.yazhengPriceRange)}</td>
                      <td className="px-4 py-3 text-slate-700">{item.pricePositionNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableSection>

          <TableSection title="医院对比表" description="这里看每家机构录入了多少项目、价格跨度和主要项目。">
            <div className="max-h-[360px] overflow-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[1050px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
                  <tr>{["医院名称", "项目数", "最低价", "最高价", "平均价", "主要项目分类", "观察提示"].map((header) => <th className="px-4 py-3" key={header}>{header}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {analysis.hospitalComparison.map((item) => (
                    <tr key={item.hospitalName}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{item.hospitalName}</td>
                      <td className="px-4 py-3 text-slate-700">{item.itemCount}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.minPrice)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.maxPrice)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.avgPrice)}</td>
                      <td className="px-4 py-3 text-slate-700">{item.mainCategories.join(" / ") || "暂无"}</td>
                      <td className="px-4 py-3 text-slate-700">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableSection>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <TableSection title="价格区间分布" description="先看价格集中在哪些区间，判断是低价引流多，还是正式项目多。">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {analysis.priceBands.map((band) => (
                  <article key={band.bandName} className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{band.bandName}</p>
                      <p className="text-sm font-semibold text-cyan-700">{band.itemCount} 项</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">主要分类：{band.mainCategories.join(" / ") || "暂无"}</p>
                  </article>
                ))}
              </div>
            </TableSection>

            <TableSection title="本页提醒" description="这些提醒是固定规则，不是 AI 自动分析。">
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {analysis.reminders.map((item) => (
                  <li key={item} className="rounded-md bg-slate-50 px-3 py-2">{item}</li>
                ))}
              </ul>
            </TableSection>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ItemTable title="低价引流项目表" items={analysis.lowPriceItems} type="low" />
            <ItemTable title="高价值项目表" items={analysis.highValueItems} type="high" />
          </section>
        </>
      ) : null}
    </section>
  );
}

function ItemTable({
  title,
  items,
  type,
}: {
  title: string;
  items: Array<{ hospitalName: string; projectCategory: string; projectName: string; price: number | null; projectAttribute?: string; note: string }>;
  type: "low" | "high";
}) {
  return (
    <TableSection title={title} description={type === "low" ? "低价项目通常要先判断是不是检查价、体验价或拉新价。" : "高价值项目要重点看套餐内容、医生、材料和成交周期。"}>
      <div className="max-h-[360px] overflow-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[850px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>{["医院", "分类", "项目名称", "价格", type === "low" ? "项目属性" : "提醒", "提醒"].map((header) => <th className="px-4 py-3" key={header}>{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-600" colSpan={6}>当前没有符合条件的项目。</td></tr>
            ) : null}
            {items.map((item, index) => (
              <tr key={`${item.hospitalName}-${item.projectName}-${index}`}>
                <td className="px-4 py-3 font-semibold text-slate-950">{item.hospitalName}</td>
                <td className="px-4 py-3 text-slate-700">{item.projectCategory}</td>
                <td className="px-4 py-3 text-slate-700">{item.projectName}</td>
                <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.price)}</td>
                <td className="px-4 py-3 text-slate-700">{type === "low" ? item.projectAttribute ?? "未填写" : item.note}</td>
                <td className="px-4 py-3 text-slate-700">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableSection>
  );
}

function TableSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function TextInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700" type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function formatNullableCurrency(value: number | null) {
  if (value === null || value === undefined) return "暂无";
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPriceRange(range: PriceRange) {
  if (!range) return "暂无雅正价格";
  if (range.minPrice === range.maxPrice) return formatNullableCurrency(range.minPrice);
  return `${formatNullableCurrency(range.minPrice)} - ${formatNullableCurrency(range.maxPrice)}`;
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
