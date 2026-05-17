import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

const templates = [
  {
    name: "美团推广数据模板",
    status: "已支持计算",
    href: "/templates/meituan-template.csv",
    purpose: "用于导入美团推广消耗、曝光、点击、咨询和订单数据。",
    fields: "日期、推广名称、推广门店、花费（元）、曝光（次）、点击（次）、商户浏览量（次）、查看电话（次）、在线咨询点击（次）、订单量（个）、团购订单量（个）、15日团购订单量（次）",
  },
  {
    name: "e看牙承接/成交数据模板",
    status: "已支持计算",
    href: "/templates/ekanya-template.csv",
    purpose: "用于导入预约、到院、成交、成交金额和接待人员数据。",
    fields: "日期、平台、推广名称、客户编号、手机号后四位、项目、线索等级、是否预约、是否到院、是否成交、成交项目、成交金额、未成交原因、接待人员、医生、备注",
  },
  {
    name: "项目价格/成本表模板",
    status: "已支持计算",
    href: "/templates/project-cost-template.csv",
    purpose: "用于维护项目成交价、成本、目标成交成本和观察周期。",
    fields: "项目名称、当前成交价、项目成本、目标毛利率、允许投放占毛利比例、目标成交成本、最低可接受价格、观察周期",
  },
  {
    name: "抖音信息流数据模板",
    status: "入口已开放，V1.3 纳入计算",
    href: "/templates/douyin-template.csv",
    purpose: "后续用于导入计划、广告组、素材和转化成本等信息。",
    fields: "日期、账户、计划、广告组、素材、消耗、展示、点击、私信、表单、转化、转化成本",
  },
  {
    name: "腾讯广点通数据模板",
    status: "入口已开放，V1.3 纳入计算",
    href: "/templates/gdt-template.csv",
    purpose: "后续用于导入账户、广告组、创意、电话和转化成本等信息。",
    fields: "日期、账户、计划、广告组、创意、消耗、曝光、点击、表单、电话、转化、转化成本",
  },
  {
    name: "竞品情报表模板",
    status: "入口已开放，仅作参考分析",
    href: "/templates/competitor-template.csv",
    purpose: "后续用于记录竞品公开页面价格、活动机制和可信度等级。",
    fields: "日期、竞品名称、平台、项目、展示价格、活动机制、限制条件、主卖点、页面链接、评论区高频问题、差评关键词、可信度等级、备注",
  },
  {
    name: "素材标签模板",
    status: "预留模板",
    href: "/templates/creative-tags-template.csv",
    purpose: "用于统一素材标签，方便后续素材分析。",
    fields: "素材名称、平台、项目、素材类型、开头类型、主卖点、价格表达、目标人群、是否低价强刺激、是否医生出镜、是否真实场景、投放日期、备注",
  },
  {
    name: "操作记录模板",
    status: "预留模板",
    href: "/templates/action-logs-template.csv",
    purpose: "用于记录建议是否执行，以及执行后3天/7天效果。",
    fields: "日期、建议类型、平台、项目、计划/素材、系统建议、是否执行、执行动作、执行前数据、执行后3天结果、执行后7天结果、是否有效、备注",
  },
];

export default function TemplatesPage() {
  return (
    <AppShell activeHref="/templates">
      <PageHeader
        eyebrow="字段模板"
        title="模板中心"
        description="模板中心提供真实可下载的 CSV 表头文件。抖音、腾讯广点通入口已开放，V1.3 后纳入计算；竞品情报入口已开放，仅作参考分析。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        {pendingIntegrationNote}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <article key={template.name} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{template.name}</h3>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {template.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{template.purpose}</p>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">表头字段</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{template.fields}</p>
            </div>
            <p className="mt-4 text-xs text-slate-500">更新时间：2026-05-16</p>
            <a
              className="mt-4 inline-flex w-full justify-center rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
              href={template.href}
              download
            >
              下载模板
            </a>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
