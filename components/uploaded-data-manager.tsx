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

const headers = [
  "文件名",
  "平台",
  "数据类型",
  "数据周期",
  "上传时间",
  "解析状态",
  "是否参与分析",
  "备注",
  "操作",
];

export function UploadedDataManager({
  title = "已上传数据",
  description = "这里查看以前上传过的文件。当前读取 uploaded_files 的真实上传记录。",
  platform,
  dataType,
  filters,
}: UploadedDataManagerProps) {
  const [records, setRecords] = useState<UploadedFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [platformFilter, setPlatformFilter] = useState(platform ?? "");
  const [dataTypeFilter, setDataTypeFilter] = useState(dataType ?? "");
  const [downloadingId, setDownloadingId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [parsingId, setParsingId] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (platformFilter.trim()) params.set("platform", platformFilter.trim());
    if (dataTypeFilter.trim()) params.set("dataType", dataTypeFilter.trim());
    return params.toString();
  }, [dataTypeFilter, platformFilter]);

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
            上传错文件时，优先用停用：不参与分析，但保留记录和原文件。只有测试文件、重复上传、明显传错时，才建议删除。V1.6.3 以后如果文件已经解析，还需要同步清理或停用解析数据。
          </p>
          <p className="mt-2 rounded-md bg-cyan-50 px-3 py-2 text-sm font-semibold leading-6 text-cyan-800">
            当前已支持解析美团推广汇总、美团关键词和 e看牙后端回流数据。e看牙数据用于判断客户是否到院、成交和实收，是后续闭环 ROI 的基础。
          </p>
          <p className="mt-2 rounded-md bg-cyan-50 px-3 py-2 text-sm font-semibold leading-6 text-cyan-800">
            当前已支持解析美团推广汇总、美团关键词、e看牙后端回流和抖音计划汇总数据。抖音计划汇总数据用于看计划层级的花费、点击、转化和转化成本；素材/创意和线索明细会在后续版本接入。
          </p>
        </div>
        <button
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
          type="button"
          onClick={() => void loadRecords()}
        >
          刷新记录
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="按平台筛选，例如：美团"
          value={platformFilter}
          onChange={(event) => setPlatformFilter(event.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="按数据类型筛选，例如：美团推广汇总数据"
          value={dataTypeFilter}
          onChange={(event) => setDataTypeFilter(event.target.value)}
        />
      </div>
      {filters?.length ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          旧筛选项已保留为页面提示：{filters.join("、")}。当前真实记录先支持按平台和数据类型筛选。
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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => {
              const isActive = Boolean(record.is_active);
              const parseConfig = isActive ? getParseConfig(record) : null;
              const parseButtonText = record.parse_status === "parsed" ? "重新解析" : "解析";

              return (
              <tr key={record.id} className={isActive ? "" : "bg-slate-50 opacity-70"}>
                <td className="px-4 py-3 font-semibold text-slate-950">
                  {record.original_file_name ?? "-"}
                  {!isActive ? (
                    <span className="ml-2 rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                      已停用
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-700">{record.platform ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{record.data_type ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{formatPeriod(record)}</td>
                <td className="px-4 py-3 text-slate-700">{formatDateTime(record.uploaded_at)}</td>
                <td className="px-4 py-3 text-slate-700">{formatParseStatus(record.parse_status)}</td>
                <td className="px-4 py-3 text-slate-700">{isActive ? "是" : "否，已停用"}</td>
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
          还没有读取到上传记录。请先在数据上传页上传文件，或检查筛选条件是否过窄。
        </p>
      ) : null}

      {loading ? <p className="mt-4 text-sm font-semibold text-slate-500">正在读取真实上传记录...</p> : null}
    </section>
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

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));
}

function formatParseStatus(status: string | null) {
  if (status === "saved") return "已保存，未解析";
  if (status === "parsed") return "已解析";
  if (status === "failed") return "解析失败";
  return status ?? "-";
}

function getParseConfig(record: UploadedFileRecord) {
  if (record.data_type === "美团推广汇总数据" || record.data_type === "meituan-summary") {
    return {
      endpoint: "/api/uploads/parse-meituan-summary",
      label: "美团推广汇总数据",
    };
  }

  if (record.data_type === "美团关键词数据" || record.data_type === "meituan-keywords") {
    return {
      endpoint: "/api/uploads/parse-meituan-keywords",
      label: "美团关键词数据",
    };
  }

  if (record.data_type === "e看牙后端回流数据" || record.data_type === "ekanya-backflow") {
    return {
      endpoint: "/api/uploads/parse-ekanya-backflow",
      label: "e看牙后端回流数据",
    };
  }
  if (
    record.data_type === "抖音计划汇总数据" ||
    record.data_type === "抖音广告计划汇总数据" ||
    record.data_type === "douyin-plan-summary" ||
    record.data_type === "douyin-ad-plan-summary"
  ) {
    return {
      endpoint: "/api/uploads/parse-douyin-plan-summary",
      label: "抖音计划汇总数据",
    };
  }
  return null;
}
