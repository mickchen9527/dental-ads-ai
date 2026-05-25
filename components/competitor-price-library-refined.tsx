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

type FormState = {
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
  priceBand: string;
  status: string;
  startDate: string;
  endDate: string;
  keyword: string;
};

type ActiveTab = "overview" | "details" | "manage";

const platformOptions = ["美团", "大众点评", "抖音", "小红书", "其他"];
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
const overviewCategories = ["洁牙", "补牙", "拔牙 / 智齿", "儿牙", "种植", "正畸", "修复 / 牙冠", "美白 / 贴面", "根管", "牙周", "检查", "其他"];
const projectAttributeOptions = ["引流项目", "正式项目", "高客单项目", "检查项目", "其他"];
const priceBandOptions = ["全部", "0-99", "100-299", "300-999", "1000-4999", "5000以上"];
const statusOptions = [
  { value: "all", label: "全部" },
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

const emptyFilters: Filters = {
  hospitalName: "",
  platform: "全部",
  projectCategory: "全部",
  projectAttribute: "全部",
  priceBand: "全部",
  status: "all",
  startDate: "",
  endDate: "",
  keyword: "",
};

const emptyForm: FormState = {
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

const tabs: Array<{ key: ActiveTab; label: string; description: string }> = [
  { key: "overview", label: "价格总览", description: "先看分类、最低价、最高价和平均价，不用一上来翻几百条明细。" },
  { key: "details", label: "价格明细", description: "按医院、项目、价格区间和关键词筛选后，再看具体套餐。" },
  { key: "manage", label: "导入 / 新增", description: "导入人工整理的公开价格表，或者手动新增、编辑单条价格。" },
];

export function CompetitorPriceLibraryRefined() {
  const [items, setItems] = useState<CompetitorPriceItem[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CompetitorPriceItem | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/competitor-prices?${buildQueryParams(filters).toString()}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { items?: CompetitorPriceItem[]; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "读取竞品价格失败，请稍后再试。");
      setItems(payload?.items ?? []);
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

  const stats = useMemo(() => buildStats(items), [items]);
  const categoryOverview = useMemo(() => buildCategoryOverview(items), [items]);
  const displayedItems = useMemo(() => items.slice(0, 50), [items]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateForm(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, collectedDate: todayString() });
    setActiveTab("manage");
  }

  function startEdit(item: CompetitorPriceItem) {
    setEditingId(item.id);
    setForm(toForm(item));
    setActiveTab("manage");
  }

  function copyCreate(item: CompetitorPriceItem) {
    setEditingId(null);
    setForm({ ...toForm(item), projectName: "", collectedDate: todayString(), status: "active" });
    setActiveTab("manage");
    setMessage("已复制这条竞品价格的大部分信息，请修改项目名称、价格和套餐内容后保存。");
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
    setError(null);
    setMessage(null);

    const payload = {
      id: editingId ?? undefined,
      hospitalName: form.hospitalName,
      platform: form.platform,
      cityArea: form.cityArea,
      projectCategory: form.projectCategory,
      projectAttribute: form.projectAttribute,
      projectName: form.projectName,
      displayPrice: form.displayPrice,
      originalPrice: form.originalPrice,
      packageContent: form.packageContent,
      restrictionNote: form.restrictionNote,
      soldCount: form.soldCount,
      rating: form.rating,
      reviewCount: form.reviewCount,
      pageUrl: form.pageUrl,
      collectedDate: form.collectedDate,
      status: form.status,
      notes: form.notes,
    };

    try {
      const response = await fetch("/api/competitor-prices", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "保存竞品价格失败，请稍后再试。");
      setMessage(result?.message ?? "竞品价格已保存。");
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
        ? "确定停用这条竞品价格吗？如果只是套餐过期或下架，建议停用，不要删除。"
        : "确定重新启用这条竞品价格吗？启用后会重新参与当前价格库查看和对比。",
    );
    if (!confirmed) return;

    await patchStatus(item.id, nextStatus);
  }

  async function patchStatus(id: string, nextStatus: "active" | "inactive") {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/competitor-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "更新状态失败，请稍后再试。");
      setMessage(nextStatus === "active" ? "竞品价格已启用。" : "竞品价格已停用。");
      await loadItems();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "更新状态失败，请稍后再试。");
    }
  }

  async function deleteItem(item: CompetitorPriceItem) {
    const confirmed = window.confirm("确定删除这条竞品价格吗？如果只是套餐过期，建议停用，不要删除。删除适合导入错了、重复数据、测试数据或明显不是口腔项目。");
    if (!confirmed) return;

    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/competitor-prices?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message ?? "删除竞品价格失败，请稍后再试。");
      setMessage(result?.message ?? "竞品价格已删除。");
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
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await fetch("/api/competitor-prices/import", { method: "POST", body: formData });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
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
    downloadRows(
      `competitor-prices-${todayString()}.csv`,
      [
        ["医院名称", "平台", "城市/区域", "项目分类", "项目属性", "项目名称", "展示价", "划线价", "套餐内容", "限制说明", "页面链接", "采集日期", "状态", "备注"],
        ...items.map((item) => [
          item.hospital_name,
          item.platform,
          item.city_area,
          item.project_category,
          item.project_attribute,
          item.project_name,
          item.display_price,
          item.original_price,
          item.package_content,
          item.restriction_note,
          item.page_url,
          item.collected_date,
          normalizeStatus(item.status) === "active" ? "启用" : "停用",
          item.notes,
        ]),
      ],
    );
  }

  function downloadTemplate() {
    downloadRows("competitor-price-template.csv", [
      ["医院名称", "平台", "城市/区域", "项目分类", "项目属性", "项目名称", "展示价", "划线价", "套餐内容", "限制说明", "页面链接", "采集日期", "状态", "备注"],
      ["同城口腔A", "美团", "杭州西湖区", "洁牙", "引流项目", "超声波洁牙套餐", "99", "299", "基础洁牙一次", "以页面公开说明为准", "https://example.com", todayString(), "启用", "示例行，请导入前删除"],
    ]);
  }

  return (
    <div className="space-y-5" id="competitor-price-library">
      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">合规提醒</p>
        <p>这里用于管理手动整理或导入的竞品公开价格。当前不做自动采集，不做爬虫，不采集客户隐私，也不会自动调整雅正价格。</p>
        <p>只建议导入公开页面能看到的价格、套餐、销量、评分等信息。不要导入手机号、微信号、客户姓名、私信、评论个人信息等隐私数据。</p>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-2">
        <div className="grid gap-2 md:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-md border px-4 py-3 text-left transition ${
                activeTab === tab.key ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-transparent bg-white text-slate-700 hover:bg-slate-50"
              }`}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{tab.description}</span>
            </button>
          ))}
        </div>
      </section>

      {message || error ? (
        <section className={`rounded-md border p-4 text-sm leading-6 ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ?? message}
        </section>
      ) : null}

      {activeTab === "overview" ? <OverviewTab stats={stats} categoryOverview={categoryOverview} loading={loading} onRefresh={() => void loadItems()} /> : null}
      {activeTab === "details" ? (
        <DetailsTab
          filters={filters}
          items={items}
          displayedItems={displayedItems}
          loading={loading}
          onChangeFilter={updateFilter}
          onClearFilters={() => setFilters(emptyFilters)}
          onRefresh={loadItems}
          onCreate={startCreate}
          onDownloadCsv={downloadCsv}
          onView={setSelectedItem}
          onEdit={startEdit}
          onCopy={copyCreate}
          onToggleStatus={toggleStatus}
          onDelete={deleteItem}
        />
      ) : null}
      {activeTab === "manage" ? (
        <ManageTab
          form={form}
          editingId={editingId}
          importFile={importFile}
          saving={saving}
          importing={importing}
          onChangeForm={updateForm}
          onSave={saveItem}
          onCancel={startCreate}
          onChooseImportFile={setImportFile}
          onImport={importPrices}
          onDownloadTemplate={downloadTemplate}
        />
      ) : null}

      {selectedItem ? <DetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
    </div>
  );
}

function OverviewTab({
  stats,
  categoryOverview,
  loading,
  onRefresh,
}: {
  stats: ReturnType<typeof buildStats>;
  categoryOverview: ReturnType<typeof buildCategoryOverview>;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        <StatCard label="竞品医院数" value={`${stats.hospitalCount}`} />
        <StatCard label="价格项目数" value={`${stats.itemCount}`} />
        <StatCard label="项目分类数" value={`${stats.categoryCount}`} />
        <StatCard label="最低价" value={formatNullableCurrency(stats.minPrice)} />
        <StatCard label="最高价" value={formatNullableCurrency(stats.maxPrice)} />
        <StatCard label="平均价" value={formatNullableCurrency(stats.avgPrice)} />
        <StatCard label="最近采集日期" value={stats.latestCollectedDate ?? "暂无"} />
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">项目分类概览</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">这里先看各类项目的价格范围，不默认展开全部明细，避免几百条数据铺满页面。</p>
          </div>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onRefresh}>
            {loading ? "读取中" : "刷新"}
          </button>
        </div>
        <div className="mt-4 max-h-[420px] overflow-auto rounded-md border border-slate-200">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["项目分类", "项目数量", "最低价", "最高价", "平均价", "竞品医院数"].map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryOverview.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-600" colSpan={6}>还没有竞品价格数据。可以先导入手动整理的竞品公开价格表，或者手动新增一条竞品价格。</td>
                </tr>
              ) : null}
              {categoryOverview.map((category) => (
                <tr key={category.projectCategory}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{category.projectCategory}</td>
                  <td className="px-4 py-3 text-slate-700">{category.itemCount}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(category.minPrice)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(category.maxPrice)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(category.avgPrice)}</td>
                  <td className="px-4 py-3 text-slate-700">{category.hospitalCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function DetailsTab({
  filters,
  items,
  displayedItems,
  loading,
  onChangeFilter,
  onClearFilters,
  onRefresh,
  onCreate,
  onDownloadCsv,
  onView,
  onEdit,
  onCopy,
  onToggleStatus,
  onDelete,
}: {
  filters: Filters;
  items: CompetitorPriceItem[];
  displayedItems: CompetitorPriceItem[];
  loading: boolean;
  onChangeFilter: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => Promise<void>;
  onCreate: () => void;
  onDownloadCsv: () => void;
  onView: (item: CompetitorPriceItem) => void;
  onEdit: (item: CompetitorPriceItem) => void;
  onCopy: (item: CompetitorPriceItem) => void;
  onToggleStatus: (item: CompetitorPriceItem) => Promise<void>;
  onDelete: (item: CompetitorPriceItem) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">价格明细筛选</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="医院" value={filters.hospitalName} placeholder="搜索医院名称" onChange={(value) => onChangeFilter("hospitalName", value)} />
          <SelectInput label="平台" value={filters.platform} options={["全部", ...platformOptions]} onChange={(value) => onChangeFilter("platform", value)} />
          <SelectInput label="项目分类" value={filters.projectCategory} options={["全部", ...projectCategoryOptions]} onChange={(value) => onChangeFilter("projectCategory", value)} />
          <SelectInput label="项目属性" value={filters.projectAttribute} options={["全部", ...projectAttributeOptions]} onChange={(value) => onChangeFilter("projectAttribute", value)} />
          <SelectInput label="价格区间" value={filters.priceBand} options={priceBandOptions} onChange={(value) => onChangeFilter("priceBand", value)} />
          <SelectInput label="状态" value={filters.status} options={statusOptions.map((item) => item.value)} optionLabels={statusOptions} onChange={(value) => onChangeFilter("status", value)} />
          <DateInput label="采集日期开始" value={filters.startDate} onChange={(value) => onChangeFilter("startDate", value)} />
          <DateInput label="采集日期结束" value={filters.endDate} onChange={(value) => onChangeFilter("endDate", value)} />
          <TextInput label="关键词搜索" value={filters.keyword} placeholder="医院、项目、套餐、限制、备注" onChange={(value) => onChangeFilter("keyword", value)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" type="button" onClick={() => void onRefresh()}>
            查询
          </button>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onClearFilters}>
            清空筛选
          </button>
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" type="button" onClick={onCreate}>
            新增竞品价格
          </button>
          <button className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800" type="button" onClick={onDownloadCsv}>
            下载竞品价格 CSV
          </button>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">价格明细列表</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              当前筛选结果 {items.length} 条，列表先显示前 {displayedItems.length} 条，表格内部滚动，不会把页面无限拉长。
            </p>
          </div>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => void onRefresh()}>
            刷新
          </button>
        </div>
        <div className="mt-4 max-h-[520px] overflow-auto rounded-md border border-slate-200">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["医院", "平台", "项目分类", "项目名称", "价格", "项目属性", "采集日期", "状态", "操作"].map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-600" colSpan={9}>正在读取 Supabase 竞品价格库。</td>
                </tr>
              ) : null}
              {!loading && displayedItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-600" colSpan={9}>
                    {hasActiveFilters(filters)
                      ? "当前筛选条件下没有竞品价格，可以调整医院、项目分类、价格区间或关键词。"
                      : "还没有竞品价格数据。可以先导入手动整理的竞品公开价格表，或者手动新增一条竞品价格。"}
                  </td>
                </tr>
              ) : null}
              {displayedItems.map((item) => {
                const itemStatus = normalizeStatus(item.status);
                return (
                  <tr key={item.id} className={itemStatus === "inactive" ? "bg-slate-50 text-slate-500" : undefined}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{item.hospital_name ?? "未填写"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.platform ?? "美团"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.project_category ?? "未分类"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.project_name ?? "未填写"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.display_price)}</td>
                    <td className="px-4 py-3 text-slate-700">{item.project_attribute ?? "未填写"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.collected_date ?? "未填写"}</td>
                    <td className="px-4 py-3"><StatusBadge status={itemStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <SmallButton onClick={() => onView(item)}>查看</SmallButton>
                        <SmallButton onClick={() => onEdit(item)}>编辑</SmallButton>
                        <SmallButton onClick={() => onCopy(item)}>复制新增</SmallButton>
                        <SmallButton tone="warning" onClick={() => void onToggleStatus(item)}>{itemStatus === "active" ? "停用" : "启用"}</SmallButton>
                        <SmallButton tone="danger" onClick={() => void onDelete(item)}>删除</SmallButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function ManageTab({
  form,
  editingId,
  importFile,
  saving,
  importing,
  onChangeForm,
  onSave,
  onCancel,
  onChooseImportFile,
  onImport,
  onDownloadTemplate,
}: {
  form: FormState;
  editingId: string | null;
  importFile: File | null;
  saving: boolean;
  importing: boolean;
  onChangeForm: (key: keyof FormState, value: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onChooseImportFile: (file: File | null) => void;
  onImport: () => Promise<void>;
  onDownloadTemplate: () => void;
}) {
  return (
    <section className="space-y-4">
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">导入竞品价格表</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              请导入人工整理的公开价格表，不要上传手机号、微信、客户隐私、私信内容。导入后可以在价格明细里筛选、停用、编辑或删除单条记录。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              选择 Excel / CSV
              <input
                accept=".csv,.xls,.xlsx"
                className="sr-only"
                type="file"
                onChange={(event) => onChooseImportFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!importFile || importing}
              type="button"
              onClick={() => void onImport()}
            >
              {importing ? "导入中" : "开始导入"}
            </button>
            <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onDownloadTemplate}>
              下载导入模板
            </button>
          </div>
        </div>
        {importFile ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">已选择：{importFile.name}</p> : null}
      </section>

      <FormPanel editingId={editingId} form={form} saving={saving} onCancel={onCancel} onChange={onChangeForm} onSave={onSave} />
    </section>
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
  form: FormState;
  saving: boolean;
  onCancel: () => void;
  onChange: (key: keyof FormState, value: string) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{editingId ? "编辑竞品价格" : "新增竞品价格"}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            新增适合手动录入单条公开价格；复制新增适合同一家医院多个类似套餐，改项目名称、价格和套餐内容即可。
          </p>
        </div>
        {editingId ? (
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onCancel}>
            取消编辑
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <TextInput label="医院名称" value={form.hospitalName} placeholder="例如：同城口腔A" onChange={(value) => onChange("hospitalName", value)} />
        <SelectInput label="平台" value={form.platform} options={platformOptions} onChange={(value) => onChange("platform", value)} />
        <TextInput label="城市 / 区域" value={form.cityArea} placeholder="例如：杭州西湖区" onChange={(value) => onChange("cityArea", value)} />
        <SelectInput label="项目分类" value={form.projectCategory} options={projectCategoryOptions} onChange={(value) => onChange("projectCategory", value)} />
        <SelectInput label="项目属性" value={form.projectAttribute} options={projectAttributeOptions} onChange={(value) => onChange("projectAttribute", value)} />
        <TextInput label="项目名称" value={form.projectName} placeholder="例如：超声波洁牙套餐" onChange={(value) => onChange("projectName", value)} />
        <TextInput label="展示价" value={form.displayPrice} placeholder="例如：99" onChange={(value) => onChange("displayPrice", value)} />
        <TextInput label="划线价" value={form.originalPrice} placeholder="例如：299" onChange={(value) => onChange("originalPrice", value)} />
        <DateInput label="采集日期" value={form.collectedDate} onChange={(value) => onChange("collectedDate", value)} />
        <SelectInput label="状态" value={form.status} options={["active", "inactive"]} optionLabels={[{ value: "active", label: "启用" }, { value: "inactive", label: "停用" }]} onChange={(value) => onChange("status", value)} />
        <TextInput label="销量" value={form.soldCount} placeholder="公开页面能看到再填" onChange={(value) => onChange("soldCount", value)} />
        <TextInput label="评分" value={form.rating} placeholder="公开页面能看到再填" onChange={(value) => onChange("rating", value)} />
        <TextInput label="评价数" value={form.reviewCount} placeholder="公开页面能看到再填" onChange={(value) => onChange("reviewCount", value)} />
        <TextInput label="页面链接" value={form.pageUrl} placeholder="公开页面链接，可选" onChange={(value) => onChange("pageUrl", value)} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <TextArea label="套餐内容" value={form.packageContent} onChange={(value) => onChange("packageContent", value)} />
        <TextArea label="限制说明" value={form.restrictionNote} onChange={(value) => onChange("restrictionNote", value)} />
        <TextArea label="备注" value={form.notes} onChange={(value) => onChange("notes", value)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-md border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="button"
          onClick={() => void onSave()}
        >
          {saving ? "保存中" : editingId ? "保存修改" : "保存新增"}
        </button>
        <button className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onCancel}>
          清空表单
        </button>
      </div>
    </section>
  );
}

function DetailDialog({ item, onClose }: { item: CompetitorPriceItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section className="max-h-[86vh] w-full max-w-3xl overflow-auto rounded-md bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">竞品价格详情</h3>
            <p className="mt-1 text-sm text-slate-600">这里展示完整字段，方便查看套餐内容、限制说明、链接和备注。</p>
          </div>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DetailItem label="医院名称" value={item.hospital_name} />
          <DetailItem label="平台" value={item.platform} />
          <DetailItem label="城市 / 区域" value={item.city_area} />
          <DetailItem label="项目分类" value={item.project_category} />
          <DetailItem label="项目属性" value={item.project_attribute} />
          <DetailItem label="项目名称" value={item.project_name} />
          <DetailItem label="展示价" value={formatNullableCurrency(item.display_price)} />
          <DetailItem label="划线价" value={formatNullableCurrency(item.original_price)} />
          <DetailItem label="销量" value={item.sold_count} />
          <DetailItem label="评分" value={item.rating} />
          <DetailItem label="评价数" value={item.review_count} />
          <DetailItem label="采集日期" value={item.collected_date} />
          <DetailItem label="状态" value={normalizeStatus(item.status) === "active" ? "启用" : "停用"} />
          <DetailItem label="页面链接" value={item.page_url} wide />
          <DetailItem label="套餐内容" value={item.package_content} wide />
          <DetailItem label="限制说明" value={item.restriction_note} wide />
          <DetailItem label="备注" value={item.notes} wide />
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value, wide = false }: { label: string; value: string | number | null | undefined; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-slate-200 bg-slate-50 p-3 ${wide ? "md:col-span-2" : ""}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{value === null || value === undefined || value === "" ? "未填写" : String(value)}</p>
    </div>
  );
}

function SmallButton({ children, tone = "default", onClick }: { children: string; tone?: "default" | "warning" | "danger"; onClick: () => void }) {
  const className =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-white text-slate-700";
  return (
    <button className={`rounded-md border px-2 py-1 text-xs font-semibold ${className}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
      {status === "active" ? "启用" : "停用"}
    </span>
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

function toForm(item: CompetitorPriceItem): FormState {
  return {
    hospitalName: item.hospital_name ?? "",
    platform: item.platform ?? "美团",
    cityArea: item.city_area ?? "",
    projectCategory: item.project_category ?? "洁牙",
    projectAttribute: item.project_attribute ?? "引流项目",
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
  };
}

function buildQueryParams(filters: Filters) {
  const params = new URLSearchParams();

  if (filters.hospitalName.trim()) params.set("hospitalName", filters.hospitalName.trim());
  if (filters.platform !== "全部") params.set("platform", filters.platform);
  if (filters.projectCategory !== "全部") params.set("projectCategory", filters.projectCategory);
  if (filters.projectAttribute !== "全部") params.set("projectAttribute", filters.projectAttribute);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  const band = parsePriceBand(filters.priceBand);
  if (band.min !== null) params.set("minPrice", String(band.min));
  if (band.max !== null) params.set("maxPrice", String(band.max));

  return params;
}

function buildStats(items: CompetitorPriceItem[]) {
  const hospitals = new Set(items.map((item) => item.hospital_name).filter(Boolean));
  const categories = new Set(items.map((item) => normalizeCategory(item.project_category)).filter(Boolean));
  const prices = items.map((item) => item.display_price).filter(isNumber);
  const collectedDates = items.map((item) => item.collected_date).filter((date): date is string => Boolean(date));

  return {
    hospitalCount: hospitals.size,
    itemCount: items.length,
    categoryCount: categories.size,
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    maxPrice: prices.length > 0 ? Math.max(...prices) : null,
    avgPrice: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null,
    latestCollectedDate: collectedDates.length > 0 ? collectedDates.sort().at(-1) ?? null : null,
  };
}

function buildCategoryOverview(items: CompetitorPriceItem[]) {
  const grouped = new Map<
    string,
    {
      projectCategory: string;
      itemCount: number;
      minPrice: number | null;
      maxPrice: number | null;
      avgPrice: number | null;
      hospitalCount: number;
      hospitals: Set<string>;
      prices: number[];
    }
  >();

  items.forEach((item) => {
    const projectCategory = normalizeCategory(item.project_category);
    const existing =
      grouped.get(projectCategory) ??
      {
        projectCategory,
        itemCount: 0,
        minPrice: null,
        maxPrice: null,
        avgPrice: null,
        hospitalCount: 0,
        hospitals: new Set<string>(),
        prices: [],
      };

    existing.itemCount += 1;
    if (item.hospital_name) existing.hospitals.add(item.hospital_name);
    if (isNumber(item.display_price)) existing.prices.push(item.display_price);
    grouped.set(projectCategory, existing);
  });

  return Array.from(grouped.values())
    .map((entry) => {
      const prices = entry.prices;
      return {
        projectCategory: entry.projectCategory,
        itemCount: entry.itemCount,
        minPrice: prices.length > 0 ? Math.min(...prices) : null,
        maxPrice: prices.length > 0 ? Math.max(...prices) : null,
        avgPrice: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null,
        hospitalCount: entry.hospitals.size,
      };
    })
    .sort((a, b) => {
      const indexA = overviewCategories.indexOf(a.projectCategory);
      const indexB = overviewCategories.indexOf(b.projectCategory);
      if (indexA === -1 && indexB === -1) return a.projectCategory.localeCompare(b.projectCategory, "zh-CN");
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
}

function parsePriceBand(priceBand: string) {
  if (priceBand === "0-99") return { min: 0, max: 99 };
  if (priceBand === "100-299") return { min: 100, max: 299 };
  if (priceBand === "300-999") return { min: 300, max: 999 };
  if (priceBand === "1000-4999") return { min: 1000, max: 4999 };
  if (priceBand === "5000以上") return { min: 5000, max: null };
  return { min: null, max: null };
}

function normalizeCategory(value: string | null | undefined) {
  const text = (value ?? "其他").trim();
  if (!text) return "其他";
  if (["拔牙", "智齿"].some((keyword) => text.includes(keyword))) return "拔牙 / 智齿";
  if (["修复", "牙冠", "嵌体"].some((keyword) => text.includes(keyword))) return "修复 / 牙冠";
  if (["美白", "贴面"].some((keyword) => text.includes(keyword))) return "美白 / 贴面";
  if (["洁牙", "洗牙"].some((keyword) => text.includes(keyword))) return "洁牙";
  if (["补牙"].some((keyword) => text.includes(keyword))) return "补牙";
  if (["儿牙", "儿童"].some((keyword) => text.includes(keyword))) return "儿牙";
  if (["种植", "种牙"].some((keyword) => text.includes(keyword))) return "种植";
  if (["正畸", "矫正", "牙套"].some((keyword) => text.includes(keyword))) return "正畸";
  if (["根管"].some((keyword) => text.includes(keyword))) return "根管";
  if (["牙周"].some((keyword) => text.includes(keyword))) return "牙周";
  if (["检查", "方案", "咨询"].some((keyword) => text.includes(keyword))) return "检查";
  return overviewCategories.includes(text) ? text : "其他";
}

function normalizeStatus(value: string | null | undefined): "active" | "inactive" {
  return value === "inactive" ? "inactive" : "active";
}

function stringifyNumber(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNullableCurrency(value: number | null | undefined) {
  return value === null || value === undefined ? "暂无" : formatCurrency(value);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function downloadRows(fileName: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function hasActiveFilters(filters: Filters) {
  return Object.entries(filters).some(([key, value]) => {
    if (!value) return false;
    if (["platform", "projectCategory", "projectAttribute", "priceBand"].includes(key)) return value !== "全部";
    if (key === "status") return value !== "all";
    return Boolean(value.trim());
  });
}
