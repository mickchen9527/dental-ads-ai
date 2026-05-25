"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CompetitorPriceItem = {
  id: string;
  hospital_name: string | null;
  platform: string | null;
  city_area: string | null;
  project_category: string | null;
  project_attribute: string | null;
  project_name: string | null;
  display_price: number | null;
  original_price: number | null;
  package_content: string | null;
  restriction_note: string | null;
  sold_count: number | null;
  rating: number | null;
  review_count: number | null;
  page_url: string | null;
  collected_date: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CompetitorPriceForm = {
  hospitalName: string;
  platform: string;
  cityArea: string;
  projectCategory: string;
  projectAttribute: string;
  projectName: string;
  displayPrice: string;
  originalPrice: string;
  packageContent: string;
  restrictionNote: string;
  soldCount: string;
  rating: string;
  reviewCount: string;
  pageUrl: string;
  collectedDate: string;
  status: "active" | "inactive";
  notes: string;
};

type Filters = {
  hospitalName: string;
  platform: string;
  projectCategory: string;
  projectAttribute: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  startDate: string;
  endDate: string;
  keyword: string;
};

const emptyForm: CompetitorPriceForm = {
  hospitalName: "",
  platform: "美团",
  cityArea: "",
  projectCategory: "洁牙",
  projectAttribute: "引流项目",
  projectName: "",
  displayPrice: "",
  originalPrice: "",
  packageContent: "",
  restrictionNote: "",
  soldCount: "",
  rating: "",
  reviewCount: "",
  pageUrl: "",
  collectedDate: todayString(),
  status: "active",
  notes: "",
};

const emptyFilters: Filters = {
  hospitalName: "",
  platform: "全部",
  projectCategory: "全部",
  projectAttribute: "全部",
  status: "all",
  minPrice: "",
  maxPrice: "",
  startDate: "",
  endDate: "",
  keyword: "",
};

const platformOptions = ["美团", "大众点评", "抖音", "小红书", "腾讯广点通", "高德", "其他"];
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
const statusOptions = [
  { value: "all", label: "全部" },
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

export function CompetitorPriceLibrary() {
  const [items, setItems] = useState<CompetitorPriceItem[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [form, setForm] = useState<CompetitorPriceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim() && value !== "全部" && value !== "all") params.set(key, value.trim());
    });

    try {
      const response = await fetch(`/api/competitor-prices?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "读取竞品价格失败，请稍后再试。");
      setItems(payload.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "读取竞品价格失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadItems]);

  const stats = useMemo(() => {
    const activeCount = items.filter((item) => normalizeStatus(item.status) === "active").length;
    const inactiveCount = items.length - activeCount;
    const hospitalCount = new Set(items.map((item) => item.hospital_name).filter(Boolean)).size;
    const categoryCount = new Set(items.map((item) => item.project_category).filter(Boolean)).size;
    const pricedItems = items.filter((item) => typeof item.display_price === "number");
    const averagePrice = pricedItems.length
      ? pricedItems.reduce((sum, item) => sum + (item.display_price ?? 0), 0) / pricedItems.length
      : null;

    return { activeCount, inactiveCount, hospitalCount, categoryCount, averagePrice };
  }, [items]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateForm(key: keyof CompetitorPriceForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, collectedDate: todayString() });
    setMessage(null);
    setError(null);
  }

  function startEdit(item: CompetitorPriceItem) {
    setEditingId(item.id);
    setForm({
      hospitalName: item.hospital_name ?? "",
      platform: item.platform ?? "美团",
      cityArea: item.city_area ?? "",
      projectCategory: item.project_category ?? "其他",
      projectAttribute: item.project_attribute ?? "其他",
      projectName: item.project_name ?? "",
      displayPrice: stringifyNumber(item.display_price),
      originalPrice: stringifyNumber(item.original_price),
      packageContent: item.package_content ?? "",
      restrictionNote: item.restriction_note ?? "",
      soldCount: stringifyNumber(item.sold_count),
      rating: stringifyNumber(item.rating),
      reviewCount: stringifyNumber(item.review_count),
      pageUrl: item.page_url ?? "",
      collectedDate: item.collected_date ?? todayString(),
      status: normalizeStatus(item.status),
      notes: item.notes ?? "",
    });
    setMessage(null);
    setError(null);
  }

  async function saveItem() {
    if (!form.hospitalName.trim()) {
      setError("医院名称不能为空。");
      return;
    }

    if (!form.projectName.trim()) {
      setError("项目名称不能为空。");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    const body = {
      id: editingId ?? undefined,
      hospital_name: form.hospitalName,
      platform: form.platform,
      city_area: form.cityArea,
      project_category: form.projectCategory,
      project_attribute: form.projectAttribute,
      project_name: form.projectName,
      display_price: form.displayPrice,
      original_price: form.originalPrice,
      package_content: form.packageContent,
      restriction_note: form.restrictionNote,
      sold_count: form.soldCount,
      rating: form.rating,
      review_count: form.reviewCount,
      page_url: form.pageUrl,
      collected_date: form.collectedDate,
      status: form.status,
      notes: form.notes,
    };

    try {
      const response = await fetch("/api/competitor-prices", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "保存竞品价格失败，请稍后再试。");
      setMessage(payload?.message ?? "竞品价格已保存。");
      setEditingId(null);
      setForm({ ...emptyForm, collectedDate: todayString() });
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存竞品价格失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: CompetitorPriceItem) {
    const currentStatus = normalizeStatus(item.status);
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    const confirmed = window.confirm(
      nextStatus === "inactive"
        ? "确定停用这条竞品价格吗？停用后不参与后续参考，但会保留记录。"
        : "确定重新启用这条竞品价格吗？启用后后续可以继续作为市场参考。",
    );

    if (!confirmed) return;
    await patchStatus(item.id, nextStatus);
  }

  async function patchStatus(id: string, nextStatus: "active" | "inactive") {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/competitor-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "状态更新失败，请稍后再试。");
      setMessage(nextStatus === "active" ? "竞品价格已启用。" : "竞品价格已停用。价格过期时建议停用，不要急着删除。");
      await loadItems();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "状态更新失败，请稍后再试。");
    }
  }

  async function deleteItem(item: CompetitorPriceItem) {
    const confirmed = window.confirm(
      "确定删除这条竞品价格吗？删除适合录错、重复、测试数据。如果只是价格过期，建议停用，不要删除。",
    );

    if (!confirmed) return;
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/competitor-prices?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "删除竞品价格失败，请稍后再试。");
      setMessage(payload?.message ?? "竞品价格已删除。");
      if (editingId === item.id) startCreate();
      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除竞品价格失败，请稍后再试。");
    }
  }

  async function importPrices() {
    if (!importFile) {
      setError("请先选择要导入的竞品价格表。");
      return;
    }

    setImporting(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await fetch("/api/competitor-prices/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "导入竞品价格失败，请稍后再试。");
      setMessage(payload?.message ?? "导入完成。");
      setImportFile(null);
      await loadItems();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "导入竞品价格失败，请稍后再试。");
    } finally {
      setImporting(false);
    }
  }

  function downloadCsv() {
    const rows = [
      ["医院名称", "平台", "区域", "项目分类", "项目属性", "项目名称", "展示价", "原价", "套餐内容", "限制说明", "销量", "评分", "评价数", "页面链接", "采集日期", "状态", "备注"],
      ...items.map((item) => [
        item.hospital_name ?? "",
        item.platform ?? "",
        item.city_area ?? "",
        item.project_category ?? "",
        item.project_attribute ?? "",
        item.project_name ?? "",
        item.display_price ?? "",
        item.original_price ?? "",
        item.package_content ?? "",
        item.restriction_note ?? "",
        item.sold_count ?? "",
        item.rating ?? "",
        item.review_count ?? "",
        item.page_url ?? "",
        item.collected_date ?? "",
        normalizeStatus(item.status) === "active" ? "启用" : "停用",
        item.notes ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `competitor-prices-${todayString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6" id="competitor-price-library">
      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">合规提醒</p>
        <p>
          只建议导入公开页面能看到的价格、套餐、销量、评分等信息。不要导入手机号、微信号、客户姓名、私信、评论个人信息等隐私数据。
        </p>
        <p>本页只做人工整理的竞品价格库，不做自动爬虫，不自动抓取链接，不直接决定调价和预算。</p>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">顶部操作区</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              可以手动新增，也可以导入你整理好的公开价格表。导入不会采集隐私，只保存表格里的公开价格字段。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
              type="button"
              onClick={startCreate}
            >
              新增竞品价格
            </button>
            <label className="inline-flex cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              导入 Excel / CSV
              <input
                accept=".csv,.xls,.xlsx"
                className="sr-only"
                type="file"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!importFile || importing}
              onClick={importPrices}
            >
              {importing ? "导入中" : "开始导入"}
            </button>
            <button
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
              type="button"
              onClick={downloadCsv}
            >
              下载 CSV
            </button>
          </div>
        </div>
        {importFile ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">已选择：{importFile.name}</p> : null}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">筛选区</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="医院" value={filters.hospitalName} placeholder="搜索医院名称" onChange={(value) => updateFilter("hospitalName", value)} />
          <SelectInput label="平台" value={filters.platform} options={["全部", ...platformOptions]} onChange={(value) => updateFilter("platform", value)} />
          <SelectInput label="项目分类" value={filters.projectCategory} options={["全部", ...projectCategoryOptions]} onChange={(value) => updateFilter("projectCategory", value)} />
          <SelectInput label="项目属性" value={filters.projectAttribute} options={["全部", ...projectAttributeOptions]} onChange={(value) => updateFilter("projectAttribute", value)} />
          <SelectInput label="状态" value={filters.status} options={statusOptions.map((item) => item.value)} optionLabels={statusOptions} onChange={(value) => updateFilter("status", value)} />
          <TextInput label="最低展示价" value={filters.minPrice} placeholder="例如：99" onChange={(value) => updateFilter("minPrice", value)} />
          <TextInput label="最高展示价" value={filters.maxPrice} placeholder="例如：3000" onChange={(value) => updateFilter("maxPrice", value)} />
          <TextInput label="关键词搜索" value={filters.keyword} placeholder="医院、项目、套餐、限制、备注" onChange={(value) => updateFilter("keyword", value)} />
          <DateInput label="采集日期开始" value={filters.startDate} onChange={(value) => updateFilter("startDate", value)} />
          <DateInput label="采集日期结束" value={filters.endDate} onChange={(value) => updateFilter("endDate", value)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" type="button" onClick={() => void loadItems()}>
            查询
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            type="button"
            onClick={() => setFilters(emptyFilters)}
          >
            清空筛选
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="总记录数" value={`${items.length}`} />
        <StatCard label="启用价格数" value={`${stats.activeCount}`} />
        <StatCard label="停用价格数" value={`${stats.inactiveCount}`} />
        <StatCard label="医院数量" value={`${stats.hospitalCount}`} />
        <StatCard label="项目分类数量" value={`${stats.categoryCount}`} />
        <StatCard label="平均展示价" value={stats.averagePrice === null ? "暂无" : formatCurrency(stats.averagePrice)} />
      </section>

      {(message || error) ? (
        <section className={`rounded-md border p-4 text-sm leading-6 ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ?? message}
        </section>
      ) : null}

      <FormPanel
        editingId={editingId}
        form={form}
        saving={saving}
        onCancel={startCreate}
        onChange={updateForm}
        onSave={saveItem}
      />

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">竞品价格列表</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              当前表格固定高度，记录多时在表格内部滚动。价格过期建议停用，录错、重复、测试数据才删除。
            </p>
          </div>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => void loadItems()}>
            刷新列表
          </button>
        </div>

        <div className="mt-4 max-h-[560px] overflow-auto rounded-md border border-slate-200">
          <table className="w-full min-w-[1700px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["医院名称", "平台", "区域", "项目分类", "项目属性", "项目名称", "展示价", "原价", "销量", "评分", "评价数", "采集日期", "状态", "操作"].map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-600" colSpan={14}>
                    正在读取 Supabase 竞品价格库。
                  </td>
                </tr>
              ) : null}
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-600" colSpan={14}>
                    {hasActiveFilters(filters)
                      ? "当前筛选条件下没有竞品价格，可以调整医院、项目分类、价格区间或关键词。"
                      : "还没有竞品价格数据。可以先手动新增一条，或导入你整理好的竞品价格表。"}
                  </td>
                </tr>
              ) : null}
              {items.map((item) => {
                const itemStatus = normalizeStatus(item.status);
                return (
                  <tr key={item.id} className={itemStatus === "inactive" ? "bg-slate-50 text-slate-500" : undefined}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{item.hospital_name ?? "未填写"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.platform ?? "美团"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.city_area ?? "未填写"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.project_category ?? "未分类"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.project_attribute ?? "未填写"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.project_name ?? "未填写"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.display_price)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.original_price)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNullableInteger(item.sold_count)}</td>
                    <td className="px-4 py-3 text-slate-700">{item.rating ?? "暂无"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNullableInteger(item.review_count)}</td>
                    <td className="px-4 py-3 text-slate-700">{item.collected_date ?? "未填写"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${itemStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {itemStatus === "active" ? "启用" : "停用"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700" type="button" onClick={() => startEdit(item)}>
                          编辑
                        </button>
                        <button className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900" type="button" onClick={() => void toggleStatus(item)}>
                          {itemStatus === "active" ? "停用" : "启用"}
                        </button>
                        <button className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700" type="button" onClick={() => void deleteItem(item)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FormPanel({
  editingId,
  form,
  saving,
  onCancel,
  onChange,
  onSave,
}: {
  editingId: string | null;
  form: CompetitorPriceForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (key: keyof CompetitorPriceForm, value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{editingId ? "编辑竞品价格" : "新增竞品价格"}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">只录入公开页面能看到的信息，不录入个人隐私。</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={saving} onClick={onSave}>
            {saving ? "保存中" : "保存"}
          </button>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onCancel}>
            清空表单
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextInput label="医院名称" value={form.hospitalName} onChange={(value) => onChange("hospitalName", value)} />
        <SelectInput label="平台" value={form.platform} options={platformOptions} onChange={(value) => onChange("platform", value)} />
        <TextInput label="城市/区域" value={form.cityArea} onChange={(value) => onChange("cityArea", value)} />
        <SelectInput label="项目分类" value={form.projectCategory} options={projectCategoryOptions} onChange={(value) => onChange("projectCategory", value)} />
        <SelectInput label="项目属性" value={form.projectAttribute} options={projectAttributeOptions} onChange={(value) => onChange("projectAttribute", value)} />
        <TextInput label="项目名称" value={form.projectName} onChange={(value) => onChange("projectName", value)} />
        <TextInput label="展示价" value={form.displayPrice} onChange={(value) => onChange("displayPrice", value)} />
        <TextInput label="原价" value={form.originalPrice} onChange={(value) => onChange("originalPrice", value)} />
        <TextInput label="销量" value={form.soldCount} onChange={(value) => onChange("soldCount", value)} />
        <TextInput label="评分" value={form.rating} onChange={(value) => onChange("rating", value)} />
        <TextInput label="评价数" value={form.reviewCount} onChange={(value) => onChange("reviewCount", value)} />
        <DateInput label="采集日期" value={form.collectedDate} onChange={(value) => onChange("collectedDate", value)} />
        <SelectInput label="状态" value={form.status} options={["active", "inactive"]} optionLabels={[{ value: "active", label: "启用" }, { value: "inactive", label: "停用" }]} onChange={(value) => onChange("status", value)} />
        <TextInput label="页面链接" value={form.pageUrl} onChange={(value) => onChange("pageUrl", value)} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <TextArea label="套餐内容" value={form.packageContent} onChange={(value) => onChange("packageContent", value)} />
        <TextArea label="限制说明" value={form.restrictionNote} onChange={(value) => onChange("restrictionNote", value)} />
        <TextArea label="备注" value={form.notes} onChange={(value) => onChange("notes", value)} />
      </div>
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
      <input
        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select
        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.find((item) => item.value === option)?.label ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function normalizeStatus(value: string | null | undefined): "active" | "inactive" {
  return value === "inactive" ? "inactive" : "active";
}

function stringifyNumber(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNullableCurrency(value: number | null) {
  return value === null || value === undefined ? "暂无" : formatCurrency(value);
}

function formatNullableInteger(value: number | null) {
  return value === null || value === undefined ? "暂无" : value.toLocaleString("zh-CN");
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function hasActiveFilters(filters: Filters) {
  return Object.entries(filters).some(([key, value]) => {
    if (!value) return false;
    if (["platform", "projectCategory", "projectAttribute"].includes(key)) return value !== "全部";
    if (key === "status") return value !== "all";
    return Boolean(value.trim());
  });
}


