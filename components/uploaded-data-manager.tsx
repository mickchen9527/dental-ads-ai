"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type UploadedFileRecord = {
  id: string;
  platform: string | null;
  data_type: string | null;
  original_file_name: string | null;
  period_start: string | null;
  period_end: string | null;
  uploaded_at: string | null;
  row_count: number | null;
  parse_status: string | null;
  is_active: boolean | null;
  notes: string | null;
};

type UploadedDataManagerProps = {
  title?: string;
  description?: string;
  platform?: string;
  dataType?: string;
  filters?: string[];
  rows?: string[][];
};

type PlatformFilter = "all" | "meituan" | "ekanya" | "douyin" | "gdt" | "amap" | "projectPrice" | "other";
type StatusFilter = "all" | "saved" | "parsed" | "failed" | "inactive";

const platformOptions: Array<{ label: string; value: PlatformFilter }> = [
  { label: "全部", value: "all" },
  { label: "美团", value: "meituan" },
  { label: "e看牙", value: "ekanya" },
  { label: "抖音", value: "douyin" },
  { label: "腾讯广点通", value: "gdt" },
  { label: "高德", value: "amap" },
  { label: "项目价格", value: "projectPrice" },
  { label: "其他", value: "other" },
];

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "全部", value: "all" },
  { label: "已保存", value: "saved" },
  { label: "已解析", value: "parsed" },
  { label: "解析失败", value: "failed" },
  { label: "已停用", value: "inactive" },
];

const headers = ["平台", "数据类型", "文件名", "周期", "上传时间", "解析状态", "是否启用", "行数", "备注", "操作"];

export function UploadedDataManager({
  title = "已上传数据管理",
  description = "这里查看以前上传过的文件。当前读取 uploaded_files 的真实上传记录。",
  platform,
  dataType,
  filters,
}: UploadedDataManagerProps) {
  const [records, setRecords] = useState<UploadedFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [parsingId, setParsingId] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (platform?.trim()) params.set("platform", platform.trim());
    if (dataType?.trim()) params.set("dataType", dataType.trim());
    return params.toString();
  }, [dataType, platform]);

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return records.filter((record) => {
      const category = getPlatformCategory(record);
      if (platformFilter !== "all" && category !== platformFilter) return false;

      if (statusFilter === "inactive" && record.is_active !== false) return false;
      if (statusFilter !== "all" && statusFilter !== "inactive") {
        if (record.is_active === false) return false;
        if (record.parse_status !== statusFilter) return false;
      }

      if (!normalizedKeyword) return true;

      const searchableText = [
        record.original_file_name,
        record.platform,
        record.data_type,
        record.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });
  }, [keyword, platformFilter, records, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredRecords.length,
      parsed: filteredRecords.filter((record) => record.parse_status === "parsed" && record.is_active !== false).length,
      failed: filteredRecords.filter((record) => record.parse_status === "failed" && record.is_active !== false).length,
      inactive: filteredRecords.filter((record) => record.is_active === false).length,
    };
  }, [filteredRecords]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/uploads/list${queryString ? `?${queryString}` : ""}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "当前无法读取真实上传记录，请检查 Supabase 配置。");
        setRecords([]);
        return;
      }

      setRecords(payload.records ?? []);
    } catch {
      setError("当前无法读取真实上传记录，请检查 Supabase 配置。");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecords();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  async function downloadFile(id: string) {
    setDownloadingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/uploads/download?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "下载链接生成失败，请稍后再试。");
        return;
      }

      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("下载链接生成失败，请稍后再试。");
    } finally {
      setDownloadingId("");
    }
  }

  async function toggleActive(record: UploadedFileRecord) {
    const isActive = Boolean(record.is_active);
    const confirmed = window.confirm(
      isActive
        ? "确定停用这条上传记录吗？停用后不会参与后续分析，但会保留记录和原文件。"
        : "确定重新启用这条上传记录吗？启用后后续可以参与分析。",
    );

    if (!confirmed) return;

    setUpdatingId(record.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/uploads/toggle-active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: record.id }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "上传记录状态更新失败，请稍后再试。");
        return;
      }

      setNotice(payload.message ?? "上传记录状态已更新。");
      await loadRecords();
    } catch {
      setError("上传记录状态更新失败，请检查网络或 Supabase 配置。");
    } finally {
      setUpdatingId("");
    }
  }

  async function deleteRecord(record: UploadedFileRecord) {
    const confirmed = window.confirm(
      "确定删除这个上传文件吗？删除后会移除上传记录和 Supabase Storage 原文件。测试文件、重复文件、明显传错时才建议删除。",
    );

    if (!confirmed) return;

    setDeletingId(record.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/uploads/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: record.id }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "上传记录删除失败，请稍后再试。");
        return;
      }

      setNotice(payload.message ?? "上传记录已删除。");
      await loadRecords();
    } catch {
      setError("上传记录删除失败，请检查网络或 Supabase 配置。");
    } finally {
      setDeletingId("");
    }
  }

  async function parseUploadRecord(record: UploadedFileRecord) {
    const parseConfig = getParseConfig(record);
    if (!parseConfig) return;

    setParsingId(record.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(parseConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: record.id }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? `${parseConfig.label}解析失败，请稍后再试。`);
        return;
      }

      setNotice(payload.message ?? `${parseConfig.label}解析成功。`);
      await loadRecords();
    } catch {
      setError(`${parseConfig.label}解析失败，请检查网络或 Supabase 配置。`);
    } finally {
      setParsingId("");
    }
  }

  return (
    <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
            上传错优先停用，停用后不参与分析但保留记录；测试文件、重复文件或明显传错时再删除。
          </p>
          <p className="mt-2 rounded-md bg-cyan-50 px-3 py-2 text-sm font-semibold leading-6 text-cyan-800">
            完整上传记录只在数据上传页管理，其他分析页面只读取已解析数据。V1.6.3 以后，如果文件已经解析出明细数据，删除/停用时还需要同步处理解析数据。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={filteredRecords.length === 0}
            type="button"
            onClick={() => downloadRecordsCsv(filteredRecords)}
          >
            下载上传记录 CSV
          </button>
          <button
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
            type="button"
            onClick={() => void loadRecords()}
          >
            刷新记录
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <StatCard label="当前筛选记录数" value={stats.total} />
        <StatCard label="已解析" value={stats.parsed} />
        <StatCard label="解析失败" value={stats.failed} />
        <StatCard label="已停用" value={stats.inactive} />
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">平台分类</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {platformOptions.map((option) => (
              <button
                key={option.value}
                className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                  platformFilter === option.value
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                type="button"
                onClick={() => setPlatformFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-800">解析状态</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                  statusFilter === option.value
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                type="button"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold text-slate-800">
          关键词搜索
          <input
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="搜索文件名、平台或数据类型"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
      </div>

      {filters?.length ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          页面提示筛选项：{filters.join("、")}。当前文件管理中心使用平台、解析状态和关键词搜索来筛选真实上传记录。
        </p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-800">
          {notice}
        </div>
      ) : null}

      <div className="mt-4 max-h-[560px] overflow-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRecords.map((record) => {
              const isActive = Boolean(record.is_active);
              const parseConfig = isActive ? getParseConfig(record) : null;
              const parseButtonText = record.parse_status === "parsed" ? "重新解析" : "解析";

              return (
                <tr key={record.id} className={isActive ? "" : "bg-slate-50 opacity-70"}>
                  <td className="px-4 py-3 text-slate-700">{record.platform ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.data_type ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-950">
                    {record.original_file_name ?? "-"}
                    {!isActive ? (
                      <span className="ml-2 rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                        已停用
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatPeriod(record)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(record.uploaded_at)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatParseStatus(record.parse_status)}</td>
                  <td className="px-4 py-3 text-slate-700">{isActive ? "是" : "否，已停用"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.row_count ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.notes || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {parseConfig ? (
                        <button
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={parsingId === record.id}
                          type="button"
                          onClick={() => void parseUploadRecord(record)}
                          title={parseConfig.label}
                        >
                          {parsingId === record.id ? "解析中" : parseButtonText}
                        </button>
                      ) : null}
                      <button
                        className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={downloadingId === record.id}
                        type="button"
                        onClick={() => void downloadFile(record.id)}
                      >
                        {downloadingId === record.id ? "生成中" : "下载原文件"}
                      </button>
                      <button
                        className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={updatingId === record.id}
                        type="button"
                        onClick={() => void toggleActive(record)}
                      >
                        {updatingId === record.id ? "处理中" : isActive ? "停用" : "启用"}
                      </button>
                      <button
                        className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === record.id}
                        type="button"
                        onClick={() => void deleteRecord(record)}
                      >
                        {deletingId === record.id ? "删除中" : "删除"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && records.length === 0 ? (
        <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          还没有上传记录。请先在上方选择平台和数据类型上传文件。
        </p>
      ) : null}

      {!loading && records.length > 0 && filteredRecords.length === 0 ? (
        <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          当前筛选条件下没有上传记录，可以调整平台、状态或搜索关键词。
        </p>
      ) : null}

      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取真实上传记录...</p> : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value.toLocaleString("zh-CN")}</p>
    </div>
  );
}

function formatPeriod(record: UploadedFileRecord) {
  if (record.period_start && record.period_end) {
    return `${record.period_start} 至 ${record.period_end}`;
  }

  if (record.period_start) {
    return `从 ${record.period_start} 开始`;
  }

  if (record.period_end) {
    return `截至 ${record.period_end}`;
  }

  return "-";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    hour12: false,
    timeStyle: "short",
  }).format(date);
}

function formatParseStatus(status: string | null) {
  if (status === "saved") return "已保存，未解析";
  if (status === "parsed") return "已解析";
  if (status === "failed") return "解析失败";
  return status ?? "-";
}

function getPlatformCategory(record: UploadedFileRecord): PlatformFilter {
  const text = `${record.platform ?? ""} ${record.data_type ?? ""}`.toLowerCase();

  if (text.includes("美团") || text.includes("点评") || text.includes("meituan") || text.includes("dianping")) return "meituan";
  if (text.includes("e看牙") || text.includes("ekanya")) return "ekanya";
  if (text.includes("抖音") || text.includes("douyin")) return "douyin";
  if (text.includes("腾讯") || text.includes("广点通") || text.includes("gdt")) return "gdt";
  if (text.includes("高德") || text.includes("amap")) return "amap";
  if (text.includes("项目价格") || text.includes("价格表") || text.includes("project-pricing") || text.includes("project_price")) return "projectPrice";
  return "other";
}

function downloadRecordsCsv(records: UploadedFileRecord[]) {
  const rows = [
    ["平台", "数据类型", "文件名", "周期开始", "周期结束", "上传时间", "解析状态", "是否启用", "行数", "备注"],
    ...records.map((record) => [
      record.platform ?? "",
      record.data_type ?? "",
      record.original_file_name ?? "",
      record.period_start ?? "",
      record.period_end ?? "",
      record.uploaded_at ?? "",
      formatParseStatus(record.parse_status),
      record.is_active === false ? "否，已停用" : "是",
      record.row_count === null || record.row_count === undefined ? "" : String(record.row_count),
      record.notes ?? "",
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `uploaded-files-${formatDateForFile(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatDateForFile(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getParseConfig(record: UploadedFileRecord) {
  if (isDataType(record, ["美团推广汇总数据", "meituan-summary"])) {
    return {
      endpoint: "/api/uploads/parse-meituan-summary",
      label: "美团推广汇总数据",
    };
  }

  if (isDataType(record, ["美团关键词数据", "meituan-keywords"])) {
    return {
      endpoint: "/api/uploads/parse-meituan-keywords",
      label: "美团关键词数据",
    };
  }

  if (isDataType(record, ["e看牙后端回流数据", "ekanya-backflow"])) {
    return {
      endpoint: "/api/uploads/parse-ekanya-backflow",
      label: "e看牙后端回流数据",
    };
  }

  if (isDataType(record, ["抖音计划汇总数据", "抖音广告计划汇总数据", "douyin-plan-summary", "douyin-ad-plan-summary"])) {
    return {
      endpoint: "/api/uploads/parse-douyin-plan-summary",
      label: "抖音计划汇总数据",
    };
  }

  if (isDataType(record, ["抖音素材/创意数据", "抖音素材 / 创意数据", "douyin-creatives"])) {
    return {
      endpoint: "/api/uploads/parse-douyin-creatives",
      label: "抖音素材/创意数据",
    };
  }

  if (isDataType(record, ["抖音表单/私信线索数据", "抖音表单 / 私信线索数据", "douyin-leads"])) {
    return {
      endpoint: "/api/uploads/parse-douyin-leads",
      label: "抖音表单/私信线索数据",
    };
  }

  if (
    isDataType(record, [
      "腾讯广点通计划汇总数据",
      "腾讯计划汇总数据",
      "广点通计划汇总数据",
      "腾讯账户/计划汇总数据",
      "腾讯广告计划汇总数据",
      "腾讯信息流计划汇总数据",
      "腾讯广点通账户/计划汇总数据",
      "广点通账户/计划汇总数据",
      "gdt-plan-summary",
    ])
  ) {
    return {
      endpoint: "/api/uploads/parse-gdt-plan-summary",
      label: "腾讯广点通计划汇总数据",
    };
  }

  if (
    isDataType(record, [
      "腾讯广告组/创意数据",
      "腾讯广告组 / 创意数据",
      "腾讯广告组数据",
      "腾讯创意数据",
      "广点通广告组/创意数据",
      "广点通广告组 / 创意数据",
      "gdt-creatives",
    ])
  ) {
    return {
      endpoint: "/api/uploads/parse-gdt-creatives",
      label: "腾讯广告组/创意数据",
    };
  }

  if (
    isDataType(record, [
      "腾讯表单/电话线索数据",
      "腾讯表单 / 电话线索数据",
      "腾讯线索数据",
      "广点通线索数据",
      "腾讯表单线索数据",
      "腾讯电话线索数据",
      "gdt-leads",
    ])
  ) {
    return {
      endpoint: "/api/uploads/parse-gdt-leads",
      label: "腾讯表单/电话线索数据",
    };
  }

  if (isDataType(record, ["高德推广汇总数据", "高德广告汇总数据", "高德投放汇总数据", "amap-summary"])) {
    return {
      endpoint: "/api/uploads/parse-amap-summary",
      label: "高德推广汇总数据",
    };
  }

  if (
    isDataType(record, [
      "高德电话/导航/门店访问数据",
      "高德电话 / 导航 / 门店访问数据",
      "高德行为明细数据",
      "高德门店访问数据",
      "高德电话导航数据",
      "amap-actions",
    ])
  ) {
    return {
      endpoint: "/api/uploads/parse-amap-actions",
      label: "高德电话/导航/门店访问数据",
    };
  }

  if (isDataType(record, ["高德线索数据", "高德留资数据", "高德咨询线索数据", "高德客户线索数据", "amap-leads"])) {
    return {
      endpoint: "/api/uploads/parse-amap-leads",
      label: "高德线索数据",
    };
  }

  return null;
}

function isDataType(record: UploadedFileRecord, values: string[]) {
  return values.includes(record.data_type ?? "");
}
