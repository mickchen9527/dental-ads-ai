"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { formatCurrency } from "@/lib/utils/formatters";

type ProjectPriceItem = {
  id: string;
  project_name: string | null;
  project_category: string | null;
  ekanya_system_price: number | null;
  platform_display_price: number | null;
  campaign_price: number | null;
  common_actual_price: number | null;
  package_content: string | null;
  is_lead_project: boolean | null;
  is_high_ticket: boolean | null;
  observation_cycle: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProjectPriceForm = {
  projectName: string;
  projectCategory: string;
  ekanyaSystemPrice: string;
  platformDisplayPrice: string;
  campaignPrice: string;
  commonActualPrice: string;
  packageContent: string;
  isLeadProject: boolean;
  isHighTicket: boolean;
  observationCycle: string;
  status: "active" | "inactive";
  notes: string;
};

const emptyForm: ProjectPriceForm = {
  projectName: "",
  projectCategory: "",
  ekanyaSystemPrice: "",
  platformDisplayPrice: "",
  campaignPrice: "",
  commonActualPrice: "",
  packageContent: "",
  isLeadProject: false,
  isHighTicket: false,
  observationCycle: "",
  status: "active",
  notes: "",
};

const statusOptions = [
  { value: "all", label: "全部" },
  { value: "active", label: "启用" },
  { value: "inactive", label: "停用" },
];

export default function ProjectPricingPage() {
  const [items, setItems] = useState<ProjectPriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectPriceForm>(emptyForm);
  const [importFile, setImportFile] = useState<File | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.project_category).filter(Boolean))) as string[];
  }, [items]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category]);

  async function loadItems(nextKeyword = keyword) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (category !== "all") params.set("category", category);
    if (nextKeyword.trim()) params.set("keyword", nextKeyword.trim());

    try {
      const response = await fetch(`/api/project-pricing?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "读取项目价格失败，请稍后再试。");
      setItems(payload.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "读取项目价格失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
    setError(null);
  }

  function startEdit(item: ProjectPriceItem) {
    setEditingId(item.id);
    setForm({
      projectName: item.project_name ?? "",
      projectCategory: item.project_category ?? "",
      ekanyaSystemPrice: stringifyNumber(item.ekanya_system_price),
      platformDisplayPrice: stringifyNumber(item.platform_display_price),
      campaignPrice: stringifyNumber(item.campaign_price),
      commonActualPrice: stringifyNumber(item.common_actual_price),
      packageContent: item.package_content ?? "",
      isLeadProject: Boolean(item.is_lead_project),
      isHighTicket: Boolean(item.is_high_ticket),
      observationCycle: item.observation_cycle ?? "",
      status: normalizeStatus(item.status),
      notes: item.notes ?? "",
    });
    setMessage(null);
    setError(null);
  }

  async function saveProject() {
    if (!form.projectName.trim()) {
      setError("项目名称不能为空。");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const body = {
      id: editingId ?? undefined,
      ...form,
    };

    try {
      const response = await fetch("/api/project-pricing", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "保存项目失败，请稍后再试。");
      setMessage(payload?.message ?? "项目已保存。");
      setEditingId(null);
      setForm(emptyForm);
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存项目失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: ProjectPriceItem) {
    const currentStatus = normalizeStatus(item.status);
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    const confirmed = window.confirm(
      nextStatus === "inactive"
        ? "确定停用这个项目吗？停用后不建议用于后续分析，但会保留历史记录。"
        : "确定重新启用这个项目吗？启用后后续可以继续用于分析。",
    );

    if (!confirmed) return;

    await updateStatus(item.id, nextStatus);
  }

  async function updateStatus(id: string, nextStatus: "active" | "inactive") {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/project-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "状态更新失败，请稍后再试。");
      setMessage(nextStatus === "active" ? "项目已启用。" : "项目已停用，后续不建议用于分析。 ");
      await loadItems();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "状态更新失败，请稍后再试。");
    }
  }

  async function deleteProject(item: ProjectPriceItem) {
    const confirmed = window.confirm(
      "确定删除这个项目吗？删除适合录错、重复、测试数据。如果这个项目已经用于历史数据，建议停用，不要删除。",
    );

    if (!confirmed) return;

    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/project-pricing?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "删除项目失败，请稍后再试。");
      setMessage(payload?.message ?? "项目已删除。");
      if (editingId === item.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除项目失败，请稍后再试。");
    }
  }

  async function importPriceFile() {
    if (!importFile) {
      setError("请先选择 e看牙项目价格表文件。");
      return;
    }

    setImporting(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await fetch("/api/project-pricing/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "导入价格表失败，请稍后再试。");
      setMessage(payload?.message ?? "导入完成。");
      setImportFile(null);
      await loadItems();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "导入价格表失败，请稍后再试。");
    } finally {
      setImporting(false);
    }
  }

  return (
    <AppShell activeHref="/project-pricing">
      <PageHeader
        eyebrow="系统设置"
        title="项目价格管理"
        description="这里维护的是 e看牙系统收费价格、平台展示价、活动价和常见成交价，不是真实成本价。未配置真实成本时，系统只计算实收 ROI，不计算毛利 ROI。"
        action={
          <PageHelpButton
            purpose="维护项目价格口径，避免平台页面、e看牙和客服说法不一致。"
            when="第一次建项目库、价格有变化、复盘价格问题前看。"
            focus={["e看牙系统价", "平台展示价", "活动价", "常见成交价", "观察周期", "项目状态"]}
            next="价格有变化时，直接新增、编辑、停用或删除单个项目，不建议反复整表覆盖。"
            mistakes={["不要把这里当成本表", "没有真实成本时不要强算毛利 ROI", "历史用过的项目优先停用，不要删除"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">这里不是成本表。</p>
        <p>
          这里上传和维护的是 e看牙系统收费价格，不是真实成本价。未配置真实成本时，系统只计算实收 ROI，不计算毛利 ROI。
        </p>
        <p>
          历史用过的项目建议停用，不要删除。停用后不参与后续分析，但保留记录。删除只适合录错、重复、测试数据。
        </p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">导入 e看牙项目价格表</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              第一次使用时，可以上传 e看牙项目价格表，系统会生成项目价格库。后续价格有变化，不建议反复整表覆盖，可以直接新增、编辑、停用或删除单个项目。
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              同名项目默认跳过，不会覆盖已有项目，避免误改历史价格口径。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <label className="inline-flex cursor-pointer rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100">
              选择价格表 CSV / XLSX
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
              onClick={importPriceFile}
            >
              {importing ? "导入中" : "开始导入"}
            </button>
          </div>
        </div>
        {importFile ? (
          <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            已选择：{importFile.name}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoBlock
            title="建议字段"
            text="项目名称、项目分类、e看牙系统价、平台展示价、活动价、实际常见成交价、套餐包含内容、是否引流项目、是否高客单项目、观察周期、价格备注、状态。"
          />
          <InfoBlock
            title="允许基础字段导入"
            text="只要有项目名称、项目分类、e看牙系统价，就可以先导入。其他字段后续可以在本页面手动补充。"
          />
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px_auto]">
          <label className="text-sm font-semibold text-slate-700">
            搜索项目名称
            <input
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
              placeholder="例如：洁牙、种植、正畸"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadItems(event.currentTarget.value);
              }}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            项目分类
            <select
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">全部分类</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            状态
            <select
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              type="button"
              onClick={() => loadItems()}
            >
              查询
            </button>
            <button
              className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
              type="button"
              onClick={startCreate}
            >
              新增项目
            </button>
          </div>
        </div>
      </section>

      {(message || error) ? (
        <section className={`mb-6 rounded-md border p-4 text-sm leading-6 ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ?? message}
        </section>
      ) : null}

      <ProjectForm
        editingId={editingId}
        form={form}
        saving={saving}
        onCancel={() => {
          setEditingId(null);
          setForm(emptyForm);
        }}
        onChange={setForm}
        onSave={saveProject}
      />

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1650px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["项目名称", "项目分类", "e看牙系统价", "平台展示价", "活动价", "常见成交价", "套餐包含内容", "引流", "高客单", "观察周期", "备注", "状态", "操作"].map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-600" colSpan={13}>
                  正在读取 Supabase 项目价格库。
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-600" colSpan={13}>
                  还没有项目价格记录。可以先导入 e看牙项目价格表，也可以手动新增项目。
                </td>
              </tr>
            ) : null}
            {items.map((item) => {
              const itemStatus = normalizeStatus(item.status);
              return (
                <tr key={item.id} className={itemStatus === "inactive" ? "bg-slate-50 text-slate-500" : undefined}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{item.project_name ?? "未命名项目"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.project_category ?? "未分类"}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.ekanya_system_price)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.platform_display_price)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.campaign_price)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNullableCurrency(item.common_actual_price)}</td>
                  <td className="px-4 py-3 text-slate-700">{item.package_content ?? "待补充"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.is_lead_project ? "是" : "否"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.is_high_ticket ? "是" : "否"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.observation_cycle ?? "待设置"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.notes ?? "无"}</td>
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
                      <button className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900" type="button" onClick={() => toggleStatus(item)}>
                        {itemStatus === "active" ? "停用" : "启用"}
                      </button>
                      <button className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700" type="button" onClick={() => deleteProject(item)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

function ProjectForm({
  editingId,
  form,
  saving,
  onCancel,
  onChange,
  onSave,
}: {
  editingId: string | null;
  form: ProjectPriceForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: ProjectPriceForm) => void;
  onSave: () => void;
}) {
  return (
    <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{editingId ? "编辑项目" : "新增项目"}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            价格有变化时，建议改单个项目，不要反复整表覆盖。
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={saving} onClick={onSave}>
            {saving ? "保存中" : "保存项目"}
          </button>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onCancel}>
            清空表单
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextInput label="项目名称" value={form.projectName} onChange={(value) => onChange({ ...form, projectName: value })} />
        <TextInput label="项目分类" value={form.projectCategory} onChange={(value) => onChange({ ...form, projectCategory: value })} />
        <TextInput label="e看牙系统价" value={form.ekanyaSystemPrice} onChange={(value) => onChange({ ...form, ekanyaSystemPrice: value })} />
        <TextInput label="平台展示价" value={form.platformDisplayPrice} onChange={(value) => onChange({ ...form, platformDisplayPrice: value })} />
        <TextInput label="活动价" value={form.campaignPrice} onChange={(value) => onChange({ ...form, campaignPrice: value })} />
        <TextInput label="实际常见成交价" value={form.commonActualPrice} onChange={(value) => onChange({ ...form, commonActualPrice: value })} />
        <TextInput label="观察周期" value={form.observationCycle} onChange={(value) => onChange({ ...form, observationCycle: value })} />
        <label className="text-sm font-semibold text-slate-700">
          状态
          <select
            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
            value={form.status}
            onChange={(event) => onChange({ ...form, status: event.target.value as "active" | "inactive" })}
          >
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <TextArea label="套餐包含内容" value={form.packageContent} onChange={(value) => onChange({ ...form, packageContent: value })} />
        <TextArea label="价格备注" value={form.notes} onChange={(value) => onChange({ ...form, notes: value })} />
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            checked={form.isLeadProject}
            type="checkbox"
            onChange={(event) => onChange({ ...form, isLeadProject: event.target.checked })}
          />
          引流项目
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            checked={form.isHighTicket}
            type="checkbox"
            onChange={(event) => onChange({ ...form, isHighTicket: event.target.checked })}
          />
          高客单项目
        </label>
      </div>
    </section>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-md bg-slate-50 p-3">
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function stringifyNumber(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeStatus(value: string | null): "active" | "inactive" {
  return value === "inactive" ? "inactive" : "active";
}

function formatNullableCurrency(value: number | null) {
  return value === null || value === undefined ? "待补充" : formatCurrency(value);
}
