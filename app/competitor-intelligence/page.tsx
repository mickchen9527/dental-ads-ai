"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StorageNote } from "@/components/storage-note";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

const complianceText =
  "本模块仅用于分析公开页面信息和市场策略，不采集个人联系方式，不用于骚扰、抢客或非法线索采集。竞品价格仅供内部经营参考，最终价格和投放策略需人工确认。";

const platforms = ["全部", "美团", "大众点评", "抖音", "小红书", "其他"];

const competitors = [
  {
    name: "同城口腔A",
    platform: "美团",
    project: "种植",
    type: "平台强竞品",
    source: "公开页面信息",
    price: "¥2,980起",
    mechanism: "限时团购价，到院面诊确认方案",
    notes: "页面明确包含基础检查，附加项目需到院确认。",
    limits: "新客专享，每人限购一次。",
    sellingPoint: "低门槛体验、医生面诊、检查项目说明",
    reviewNeeds: "价格透明、医生经验、术后复查",
    negativeKeywords: "等待时间、附加费用、预约改期",
    confidence: "A类",
    counter: "不直接跟价，强化医生、材料、CT检查和服务流程。",
  },
  {
    name: "同城口腔B",
    platform: "抖音",
    project: "洁牙",
    type: "内容强竞品",
    source: "公开页面信息",
    price: "¥99起",
    mechanism: "直播间券价，适用门店需客服确认",
    notes: "只看到展示价格，适用条件不完整。",
    limits: "节假日可能不可用。",
    sellingPoint: "低价体验、真实场景、用户晒图",
    reviewNeeds: "是否推销、是否敏感、效果持续时间",
    negativeKeywords: "推销、排队、敏感",
    confidence: "B类",
    counter: "优化价格表达和购买须知，避免被低价带节奏。",
  },
  {
    name: "同城口腔C",
    platform: "大众点评",
    project: "种植 / 正畸 / 洁牙",
    type: "平台强竞品 / 近距离竞品",
    source: "公开页面信息",
    price: "种植¥2,680起；正畸到院评估；洁牙¥88起",
    mechanism: "点评团购组合，低价项目引流，到院后按方案确认",
    notes: "该竞品来自大众点评公开页面信息，仅作为市场参考，不采集用户隐私，不抓取登录后数据。",
    limits: "价格条件不完整，部分项目限新客或限指定门店。",
    sellingPoint: "近距离门店、套餐丰富、低门槛检查、评价数量较多",
    reviewNeeds: "价格透明、预约效率、医生沟通、是否推销",
    negativeKeywords: "等待久、附加费用、套餐限制、客服回复慢",
    confidence: "B类",
    counter: "拆解活动条件后再判断，不直接跟价；我方强化医生、材料、服务和购买须知透明度。",
  },
];

export default function CompetitorIntelligencePage() {
  const [platform, setPlatform] = useState("全部");
  const filtered = competitors.filter((item) => platform === "全部" || item.platform === platform);
  const reportCsv = [
    ["统计周期", "2026-05-13 至 2026-05-19"],
    ["报告类型", "竞品观察周报"],
    ["说明", "竞品情报仅作参考，不直接参与调价，不直接决定预算"],
    ["竞品名称", "平台", "项目", "展示价格", "可信度等级", "我方反打建议"],
    ...competitors.map((item) => [item.name, item.platform, item.project, item.price, item.confidence, item.counter]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  return (
    <AppShell activeHref="/competitor-intelligence">
      <PageHeader
        eyebrow="公开信息人工录入"
        title="竞品情报中心"
        description="用于分析竞品公开页面信息，辅助美团、大众点评、抖音、小红书和腾讯广点通投放策略优化。竞品情报表入口已开放，仅作市场参考，不参与 V1 核心评分，不直接决定调价。"
      />

      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <p>{complianceText}</p>
        <p className="font-semibold">竞品情报仅作参考，不直接参与调价，不直接决定预算。</p>
        <p>{pendingIntegrationNote}</p>
      </section>

      <div className="mt-6">
        <StorageNote />
      </div>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">平台分类筛选</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {platforms.map((item) => (
            <button
              key={item}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                platform === item ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
              type="button"
              onClick={() => setPlatform(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">竞品录入区</h3>
          <div className="mt-4 grid gap-3">
            <Input label="竞品名称" placeholder="例如：同城口腔C" />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              平台
              <select className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option>美团</option>
                <option>大众点评</option>
                <option>抖音</option>
                <option>小红书</option>
                <option>其他</option>
              </select>
            </label>
            <Input label="竞品链接" placeholder="https://..." />
            <Input label="关注项目" placeholder="种植 / 正畸 / 洁牙 / 补牙 / 儿牙 / 修复" />
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">公开页面文案粘贴区</h3>
          <textarea
            className="mt-4 min-h-44 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6"
            placeholder="粘贴竞品公开页面文案、套餐说明、购买须知、公开评论区文本。不要粘贴手机号、微信号、身份证号或私信内容。"
          />
        </article>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">页面截图上传区</h3>
        <label className="mt-4 block rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-600">
          上传公开页面截图（第一版仅做 UI，不实现 OCR）
          <input className="sr-only" type="file" accept="image/*" />
        </label>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        {filtered.map((record) => {
          const confidenceClass =
            record.confidence === "A类"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-800";
          return (
            <article key={record.name} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">{record.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{record.platform} · {record.project}</p>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${confidenceClass}`}>
                  {record.confidence}
                </span>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <Field label="竞品类型" value={record.type} />
                <Field label="数据来源" value={record.source} />
                <Field label="展示价格" value={record.price} />
                <Field label="活动机制" value={record.mechanism} />
                <Field label="购买须知" value={record.notes} />
                <Field label="限制条件" value={record.limits} />
                <Field label="页面卖点" value={record.sellingPoint} />
                <Field label="评论区高频需求" value={record.reviewNeeds} />
                <Field label="差评关键词" value={record.negativeKeywords} />
                <Field label="可信度等级" value={record.confidence} />
                <Field label="我方反打建议" value={record.counter} />
              </dl>
              {record.confidence !== "A类" ? (
                <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  该竞品价格仅供参考，不建议直接作为调价依据。
                </p>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-md border border-cyan-200 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-cyan-950">数据来源</h3>
        <p className="mt-2 text-sm leading-6 text-cyan-900">
          数据来自已解析上传记录。如需管理文件，请到数据上传页。竞品情报仅作参考，不直接参与调价，不直接决定预算。
        </p>
        <a className="mt-4 inline-flex rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800" href="/upload">
          去数据上传页
        </a>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">生成竞品观察周报</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          竞品情报仅作参考，如需投放复盘周报，请到「项目分析」生成。这里保留竞品观察示例下载，方便单独记录公开页面变化。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" type="button">
            生成竞品观察周报
          </button>
          <a
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(reportCsv)}`}
            download="competitor-weekly-report.csv"
          >
            下载竞品观察周报
          </a>
        </div>
      </section>
    </AppShell>
  );
}

function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder={placeholder} />
    </label>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-700">{value}</dd>
    </div>
  );
}
