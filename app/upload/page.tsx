"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { dataSources, type DataSourceKey } from "@/lib/config/dataSources";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

type UploadedPreview = {
  fileName: string;
  fields: string[];
  rows: string[][];
  note?: string;
};

export default function UploadPage() {
  const [previews, setPreviews] = useState<Partial<Record<DataSourceKey, UploadedPreview>>>({});

  function handleFile(sourceKey: DataSourceKey, file?: File) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setPreviews((current) => ({
        ...current,
        [sourceKey]: {
          fileName: file.name,
          fields: [],
          rows: [],
          note: "已选择文件。当前前端仅预览 CSV 表头；XLSX 真实解析将在 V1.3 数据上传计算版接入。",
        },
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const parsed = lines.map((line) => line.split(",").map((cell) => cell.trim()));
      const fields = parsed[0] ?? [];
      const rows = parsed.slice(1, 11);

      setPreviews((current) => ({
        ...current,
        [sourceKey]: {
          fileName: file.name,
          fields,
          rows,
          note: rows.length === 0 ? "已读取表头。当前文件没有示例数据行。" : undefined,
        },
      }));
    };
    reader.readAsText(file, "utf-8");
  }

  return (
    <AppShell activeHref="/upload">
      <PageHeader
        eyebrow="统一导入口径"
        title="数据上传"
        description="当前 V1 优先跑通美团推广数据 + e看牙承接/成交数据 + 项目价格/成本表。抖音、腾讯广点通、竞品情报已开放上传入口和字段预览。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        <p>{pendingIntegrationNote}</p>
        <p>当前已开放上传入口和字段预览，暂未纳入核心评分和建议计算。待字段映射配置完成后再参与计算。</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dataSources.map((source) => {
          const preview = previews[source.key];
          const fields = source.requiredFields.length > 0 ? source.requiredFields : source.recommendedFields;

          return (
            <article key={source.key} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{source.name}</p>
                  <p className="mt-1 text-xs text-slate-500">支持格式：{source.supportedFormats.join(" / ")}</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  source.status === "已支持计算" ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}>
                  {source.statusLabel}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{source.description}</p>

              <dl className="mt-4 grid gap-2 rounded-md bg-slate-50 p-3 text-sm">
                <Meta label="是否参与当前评分" value={source.participatesInScoring ? "是" : "否"} />
                <Meta label="是否参与当前计算" value={source.participatesInCalculation ? "是" : "否"} />
                <Meta label="当前参与状态" value={source.participationLabel} />
                <Meta label="字段映射状态" value={source.fieldMappingStatus} />
              </dl>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500">字段说明</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{fields.join("、")}</p>
              </div>

              {source.status !== "已支持计算" ? (
                <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-xs font-semibold leading-5 text-slate-700">
                  {source.explanation}
                </div>
              ) : null}

              <label className="mt-4 block cursor-pointer rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50">
                选择 CSV / XLSX 文件
                <input
                  accept=".csv,.xlsx"
                  className="sr-only"
                  type="file"
                  onChange={(event) => handleFile(source.key, event.target.files?.[0])}
                />
              </label>

              {preview ? <Preview preview={preview} /> : null}
            </article>
          );
        })}
      </section>

      <section className="mt-6 flex flex-wrap gap-2 rounded-md border border-cyan-100 bg-cyan-50 p-4">
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/data-quality">
          前往数据质量检测
        </Link>
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/dashboard">
          查看首页汇总
        </Link>
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/recommendations">
          查看建议卡
        </Link>
      </section>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function Preview({ preview }: { preview: UploadedPreview }) {
  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-950">文件名：{preview.fileName}</p>
      <p className="mt-1 text-xs text-slate-600">行数：{preview.rows.length}</p>
      {preview.note ? <p className="mt-2 text-xs leading-5 text-amber-800">{preview.note}</p> : null}
      {preview.fields.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-500">字段列表</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {preview.fields.map((field) => (
              <span key={field} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {field}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {preview.rows.length > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-left text-slate-500">
              <tr>
                {preview.fields.map((field) => (
                  <th key={field} className="px-3 py-2">{field}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.rows.map((row, rowIndex) => (
                <tr key={`${preview.fileName}-${rowIndex}`}>
                  {preview.fields.map((field, index) => (
                    <td key={`${field}-${index}`} className="max-w-40 truncate px-3 py-2 text-slate-600">
                      {row[index] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
