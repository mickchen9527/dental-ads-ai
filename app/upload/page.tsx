"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import { dataSources, type DataSourceKey } from "@/lib/config/dataSources";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

type UploadedPreview = {
  fileName: string;
  fields: string[];
  rows: string[][];
  note?: string;
};

const platformDataGroups = [
  {
    platform: "美团数据",
    items: [
      {
        name: "美团推广汇总数据",
        frequency: "每日建议上传",
        purpose: "看推广计划整体表现",
        fields: "推广名称、推广门店、花费、曝光、点击、点击均价、商户浏览量、查看电话、在线咨询点击、订单量、团购订单量、15日团购订单量",
        tip: "这是推广计划表，不是关键词表。",
      },
      {
        name: "美团关键词数据",
        frequency: "每 3-7 天上传 / 调关键词前上传",
        purpose: "判断哪些词保留、加价、降价、暂停",
        fields: "关键词、推广名称、花费、曝光、点击、点击率、点击成本、咨询、订单",
        tip: "必须包含“关键词”字段，不能用美团推广汇总表代替关键词表。",
      },
    ],
  },
  {
    platform: "抖音数据",
    items: [
      {
        name: "抖音广告计划汇总数据",
        frequency: "每日或投放日上传",
        purpose: "看计划整体花费、点击和转化",
        fields: "日期、计划名称、消耗、展示、点击、点击率、点击成本、转化数、转化成本",
        tip: "这是计划汇总表，用来看计划整体表现。",
      },
      {
        name: "抖音素材/创意数据",
        frequency: "每 3-7 天上传 / 换素材前上传",
        purpose: "判断哪个视频素材该保留、暂停、继续测试",
        fields: "日期、素材名称、视频名称、计划名称、消耗、展示、点击、点击率、播放量、完播率、私信、表单、转化、转化成本",
        tip: "这是素材表，不是计划汇总表。",
      },
      {
        name: "抖音表单/私信线索数据",
        frequency: "能导就上传",
        purpose: "判断线索质量",
        fields: "线索时间、来源计划、来源素材、客户编号/姓名、手机号后四位、项目意向、表单内容、线索状态、备注",
        tip: "如果暂时不能导出，就先靠 e看牙记录来源。",
      },
    ],
  },
  {
    platform: "腾讯广点通数据",
    items: [
      {
        name: "腾讯账户/计划汇总数据",
        frequency: "每日或投放日上传",
        purpose: "看整体消耗和转化成本",
        fields: "日期、账户、计划名称、广告组、消耗、曝光、点击、点击率、点击成本、转化、转化成本",
        tip: "这是计划汇总表，用来看账户和计划整体表现。",
      },
      {
        name: "腾讯广告组/创意数据",
        frequency: "每 3-7 天上传 / 调创意前上传",
        purpose: "判断哪个创意有效",
        fields: "日期、计划名称、广告组、创意名称、消耗、曝光、点击、点击率、表单、电话、转化、转化成本",
        tip: "这是创意表，不是计划汇总表。",
      },
      {
        name: "腾讯表单/电话线索数据",
        frequency: "能导就上传",
        purpose: "判断线索质量",
        fields: "线索时间、来源计划、来源创意、来源方式、客户编号/姓名、手机号后四位、项目意向、线索状态、备注",
        tip: "能导出就上传，不能导出就先靠 e看牙补来源。",
      },
    ],
  },
  {
    platform: "高德数据",
    items: [
      {
        name: "高德推广汇总数据",
        frequency: "投放后上传",
        purpose: "看整体花费和点击",
        fields: "日期、推广名称、花费、曝光、点击、点击成本",
        tip: "这是高德推广花费表。",
      },
      {
        name: "高德电话/导航/门店访问数据",
        frequency: "重点上传",
        purpose: "判断本地到店意向",
        fields: "日期、电话、导航、地址查看、门店访问、路线规划、收藏、分享",
        tip: "高德重点看电话、导航、地址查看和门店访问，不是团购。",
      },
      {
        name: "高德线索数据",
        frequency: "能导就上传",
        purpose: "判断高德来的客户有没有进 e看牙",
        fields: "线索时间、来源方式、客户编号/姓名、手机号后四位、项目意向、线索状态、备注",
        tip: "如果高德不能导线索，就靠 e看牙记录来源。",
      },
    ],
  },
];

export default function UploadPage() {
  const [previews, setPreviews] = useState<Partial<Record<DataSourceKey, UploadedPreview>>>({});
  const uploadSources = dataSources.filter((source) => source.key !== "project_cost");

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
        description="先上传平台前端数据，再上传 e看牙回流数据。上传完不要急着看建议，先去检查数据质量。"
        action={
          <PageHelpButton
            purpose="把各个平台导出的表格放进系统，先看看字段和前10行。"
            when="每天投放结束后、调预算前、周报前看。"
            focus={["文件名", "字段列表", "缺失字段", "是否参与计算"]}
            next="按推荐顺序上传完，再去数据质量检测。"
            mistakes={["不要只上传平台表，不上传 e看牙。", "不要字段缺失还直接看建议。"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        <p>{pendingIntegrationNote}</p>
        <p>当前已开放上传入口和字段预览，暂未纳入核心评分和建议计算。待字段映射配置完成后再参与计算。</p>
      </section>

      <div className="mb-6">
        <StorageNote />
      </div>

      <section className="mb-6 rounded-md border border-cyan-100 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-slate-950">推荐上传顺序</h3>
        <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
          <li className="rounded-md bg-white p-3"><strong>1. 上传平台前端数据：</strong>美团 / 抖音 / 腾讯 / 高德。每日建议上传。</li>
          <li className="rounded-md bg-white p-3"><strong>2. 上传平台细分数据：</strong>美团关键词 / 抖音素材 / 腾讯创意 / 高德电话导航。每 3-7 天上传。</li>
          <li className="rounded-md bg-white p-3"><strong>3. 上传 e看牙后端回流数据：</strong>患者来源分析 / 患者就诊分析 / 成交收费明细。调整前必须上传。</li>
          <li className="rounded-md bg-white p-3"><strong>4. 检查数据质量：</strong>先看字段和回流，再看建议。</li>
          <li className="rounded-md bg-white p-3"><strong>5. 进入对应平台页面：</strong>看美团、抖音、腾讯或高德的建议。有调整时再上传更新。</li>
          <li className="rounded-md bg-white p-3"><strong>可选上传：</strong>竞品情报和素材标签，用于辅助判断。</li>
        </ol>
      </section>

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-base font-semibold text-slate-950">不能混传</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
          请按数据类型上传，不同入口不能混传。系统后续会根据字段判断文件是否匹配。
        </p>
        <div className="mt-4 grid gap-2 text-sm leading-6 text-amber-900 md:grid-cols-2">
          <p>美团推广汇总数据，不能上传到美团关键词入口。</p>
          <p>抖音计划汇总数据，不能上传到抖音素材入口。</p>
          <p>腾讯计划汇总数据，不能上传到腾讯创意入口。</p>
          <p>高德推广汇总数据，不能上传到高德电话/导航入口。</p>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-amber-800">
          当前为前端演示，接入解析功能后会自动检查字段是否匹配。
        </p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">上传频率说明</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FrequencyCard title="每日建议上传" items={["美团推广汇总数据", "已投放平台的计划汇总数据", "e看牙来源 / 就诊 / 收费数据"]} />
          <FrequencyCard title="每 3-7 天上传" items={["美团关键词数据", "抖音素材/创意数据", "腾讯广告组/创意数据", "高德电话/导航/门店访问数据"]} />
          <FrequencyCard title="调词/调素材/调创意前必须上传" items={["美团关键词数据", "抖音素材数据", "腾讯创意数据"]} />
          <FrequencyCard title="有价格变化时" items={["去项目价格管理新增、编辑或停用项目", "不建议每次重新上传整张价格表"]} />
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">各平台数据类型说明</h3>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {platformDataGroups.map((group) => (
            <article key={group.platform} className="rounded-md border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-950">{group.platform}</h4>
              <div className="mt-3 grid gap-3">
                {group.items.map((item) => (
                  <div key={item.name} className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                      <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">{item.frequency}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">用途：{item.purpose}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">常见字段：{item.fields}</p>
                    <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold leading-5 text-amber-900">提示：{item.tip}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {uploadSources.map((source) => {
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

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">项目配置入口</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          项目价格不建议每次重新导入。价格有变化时，进入项目价格管理新增、编辑或停用项目。
        </p>
        <Link className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/project-pricing">
          去项目价格管理维护价格
        </Link>
      </section>

      <section className="mt-6 flex flex-wrap gap-2 rounded-md border border-cyan-100 bg-cyan-50 p-4">
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/data-quality">
          前往数据质量检测
        </Link>
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/dashboard">
          查看首页汇总
        </Link>
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/recommendations">
          查看今日总建议
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

function FrequencyCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
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
