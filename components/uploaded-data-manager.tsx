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
  const [platformFilter, setPlatformFilter] = useState(platform ?? "");
  const [dataTypeFilter, setDataTypeFilter] = useState(dataType ?? "");
  const [downloadingId, setDownloadingId] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (platformFilter.trim()) params.set("platform", platformFilter.trim());
    if (dataTypeFilter.trim()) params.set("dataType", dataTypeFilter.trim());
    return params.toString();
  }, [dataTypeFilter, platformFilter]);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

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

  return (
    <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
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
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 font-semibold text-slate-950">{record.original_file_name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{record.platform ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{record.data_type ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{formatPeriod(record)}</td>
                <td className="px-4 py-3 text-slate-700">{formatDateTime(record.uploaded_at)}</td>
                <td className="px-4 py-3 text-slate-700">{record.parse_status === "saved" ? "已保存原文件，暂未解析" : record.parse_status ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{record.is_active ? "是" : "否"}</td>
                <td className="px-4 py-3 text-slate-700">{record.notes || "-"}</td>
                <td className="px-4 py-3">
                  <button
                    className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={downloadingId === record.id}
                    type="button"
                    onClick={() => void downloadFile(record.id)}
                  >
                    {downloadingId === record.id ? "生成中" : "下载原文件"}
                  </button>
                </td>
              </tr>
            ))}
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
