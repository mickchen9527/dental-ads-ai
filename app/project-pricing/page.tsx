"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";

type ProjectPrice = {
  name: string;
  category: string;
  ekanyaPrice: string;
  displayPrice: string;
  activityPrice: string;
  commonDealPrice: string;
  includes: string;
  isLeadProject: string;
  isHighTicket: string;
  cycle: string;
  note: string;
  status: "启用" | "停用";
};

const initialRows: ProjectPrice[] = [
  {
    name: "种植检查",
    category: "种植",
    ekanyaPrice: "¥299.00",
    displayPrice: "¥99.00",
    activityPrice: "¥49.00",
    commonDealPrice: "¥99.00",
    includes: "口腔检查、基础方案沟通",
    isLeadProject: "是",
    isHighTicket: "否",
    cycle: "7-30天",
    note: "用于承接种植方案，不直接代表成交价。",
    status: "启用",
  },
  {
    name: "超声波洁牙",
    category: "洁牙",
    ekanyaPrice: "¥298.00",
    displayPrice: "¥198.00",
    activityPrice: "¥99.00",
    commonDealPrice: "¥168.00",
    includes: "洁牙、抛光、口腔建议",
    isLeadProject: "是",
    isHighTicket: "否",
    cycle: "1-3天",
    note: "看后续补牙、牙周转化。",
    status: "启用",
  },
  {
    name: "隐形矫正方案评估",
    category: "正畸",
    ekanyaPrice: "¥500.00",
    displayPrice: "到院评估",
    activityPrice: "到院评估",
    commonDealPrice: "¥18,000.00",
    includes: "初诊评估、方案沟通",
    isLeadProject: "否",
    isHighTicket: "是",
    cycle: "7-30天",
    note: "高客单长周期，不看单日成交。",
    status: "启用",
  },
];

export default function ProjectPricingPage() {
  const [rows, setRows] = useState(initialRows);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  function addProject() {
    setRows((current) => [
      ...current,
      {
        name: `新项目${current.length + 1}`,
        category: "待分类",
        ekanyaPrice: "待填写",
        displayPrice: "待填写",
        activityPrice: "待填写",
        commonDealPrice: "待填写",
        includes: "待补充",
        isLeadProject: "否",
        isHighTicket: "否",
        cycle: "待设置",
        note: "新增后请人工补充。",
        status: "启用",
      },
    ]);
  }

  function toggleStatus(name: string) {
    setRows((current) =>
      current.map((row) =>
        row.name === name
          ? { ...row, status: row.status === "启用" ? "停用" : "启用" }
          : row,
      ),
    );
  }

  function deleteProject(name: string) {
    const confirmed = window.confirm(
      "确定删除这个项目吗？如果这个项目已经用于历史数据，建议使用停用，不要删除。只有录错或重复项目才建议删除。",
    );

    if (!confirmed) return;
    setRows((current) => current.filter((row) => row.name !== name));
    if (editingName === name) setEditingName(null);
  }

  return (
    <AppShell activeHref="/project-pricing">
      <PageHeader
        eyebrow="系统设置"
        title="项目价格管理"
        description="这里不是成本表。这里用于维护 e看牙系统价、平台展示价、活动价和项目判断标准。未配置真实项目成本时，系统只计算实收 ROI，不计算毛利 ROI。"
        action={
          <PageHelpButton
            purpose="维护项目价格口径，避免平台页面、e看牙和客服说法不一致。"
            when="新增项目、改活动价、复盘价格问题前看。"
            focus={["e看牙系统价", "平台展示价", "活动价", "实际常见成交价", "观察周期"]}
            next="确认价格口径后，再去看平台页面和客服话术。"
            mistakes={["不要把这里当成本表。", "不要没有成本就强算毛利。", "不要频繁改价。"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        当前未配置项目真实成本，系统只计算实收 ROI，不计算毛利 ROI。接入数据库后可保存真实项目历史价格。
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">导入 e看牙项目价格表</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              第一次使用时，可以上传 e看牙项目价格表，系统会生成项目价格库。后续价格有调整时，不需要重新导入整张表，可以直接在本页面新增、编辑、停用或删除项目。
            </p>
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
              这里上传的是 e看牙系统收费价格，不是真实成本价。未配置真实成本时，系统只计算实收 ROI，不计算毛利 ROI。
            </p>
          </div>
          <label className="inline-flex cursor-pointer rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100">
            选择价格表 CSV / XLSX
            <input
              accept=".csv,.xlsx"
              className="sr-only"
              type="file"
              onChange={(event) => setImportFileName(event.target.files?.[0]?.name ?? null)}
            />
          </label>
        </div>
        {importFileName ? (
          <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            已选择：{importFileName}。当前为前端演示，接入数据库后会解析并生成项目价格库。
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoBlock title="建议字段" text="项目名称、项目分类、e看牙系统价、平台展示价、活动价、实际常见成交价、套餐包含内容、是否引流项目、是否高客单项目、观察周期、价格备注、状态。" />
          <InfoBlock title="允许基础字段导入" text="只要有项目名称、项目分类、e看牙系统价，就可以先导入。其他字段后续可以在本页面手动补充。" />
        </div>
      </section>

      <section className="mb-4 flex flex-wrap gap-2">
        <button className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" type="button" onClick={addProject}>
          新增项目
        </button>
        <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button">
          查看项目列表
        </button>
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1600px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["项目名称", "项目分类", "e看牙系统价", "平台展示价", "活动价", "实际常见成交价", "套餐包含内容", "是否引流项目", "是否高客单项目", "观察周期", "价格备注", "状态", "操作"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-semibold text-slate-950">{row.name}</td>
                <td className="px-4 py-3 text-slate-700">{row.category}</td>
                <td className="px-4 py-3 text-slate-700">{row.ekanyaPrice}</td>
                <td className="px-4 py-3 text-slate-700">{row.displayPrice}</td>
                <td className="px-4 py-3 text-slate-700">{row.activityPrice}</td>
                <td className="px-4 py-3 text-slate-700">{row.commonDealPrice}</td>
                <td className="px-4 py-3 text-slate-700">{row.includes}</td>
                <td className="px-4 py-3 text-slate-700">{row.isLeadProject}</td>
                <td className="px-4 py-3 text-slate-700">{row.isHighTicket}</td>
                <td className="px-4 py-3 text-slate-700">{row.cycle}</td>
                <td className="px-4 py-3 text-slate-700">{editingName === row.name ? "编辑中：请接入数据库后保存真实修改" : row.note}</td>
                <td className="px-4 py-3 text-slate-700">{row.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700" type="button" onClick={() => setEditingName(row.name)}>
                      编辑项目
                    </button>
                    <button className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900" type="button" onClick={() => toggleStatus(row.name)}>
                      {row.status === "启用" ? "停用项目" : "启用项目"}
                    </button>
                    <button className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700" type="button" onClick={() => deleteProject(row.name)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
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
