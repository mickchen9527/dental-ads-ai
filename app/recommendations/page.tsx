"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import {
  pendingDataSourceText,
  supportedDataSourceText,
} from "@/lib/config/dataSources";
import { qualityResult } from "@/lib/mock-data";
import { pendingIntegrationNote, riskBoundaryNotes } from "@/lib/v12-static-data";

const categoryMap: Record<string, string[]> = {
  全部建议: [],
  预算建议: ["预算", "暂停", "观察"],
  出价建议: ["出价", "加价"],
  素材建议: ["素材", "前三秒", "封面", "标题", "医生讲解", "信任型", "方案评估"],
  "页面/承接建议": ["页面", "套餐", "购买须知", "FAQ", "客服", "到院", "预约", "接待人员"],
  价格策略建议: ["价格", "价格表达", "价格梯度", "检查/方案", "降价", "涨价", "低价"],
  高德建议: ["高德", "导航", "到店"],
  数据质量建议: ["e看牙", "项目价格管理", "项目映射", "暂缓重大调整"],
};

const platforms = ["全部", "美团", "抖音", "腾讯广点通", "高德", "e看牙", "项目价格", "数据质量"];
const projects = ["全部项目", "种植", "正畸", "洁牙", "补牙", "拔牙", "儿牙", "修复", "牙周", "根管治疗", "美白", "贴面", "全口/半口种植"];

const manualSuggestions = [
  {
    category: "页面/承接建议",
    platform: "美团",
    platformGroup: "美团",
    project: "洁牙",
    problem: "美团浏览后咨询偏弱。",
    reason: "有商户浏览，但在线咨询点击偏少，说明用户看了页面却没有马上问。",
    now: "先优化美团页面，不要加预算。",
    steps: ["检查套餐标题是不是一眼能看懂。", "检查购买须知是否写清楚包含什么。", "检查价格是否写清楚，不要让用户觉得有隐藏费用。", "补充医生、材料、服务说明。"],
    avoid: ["不要直接全项目降价。", "不要页面没改好就大幅加预算。"],
    observe: "3天",
    review: ["在线咨询点击率", "团购订单成本", "e看牙来源客户数"],
  },
  {
    category: "数据质量建议",
    platform: "e看牙",
    platformGroup: "e看牙",
    project: "全项目",
    problem: "平台线索进了前端，但 e看牙回流不够。",
    reason: "前端能看到咨询或订单，但后端来源客户记录少，会影响实收 ROI 判断。",
    now: "先补来源记录，再看预算建议。",
    steps: ["让前台统一填写来源平台。", "把来源方式写清楚，例如美团电话、抖音表单。", "补齐是否预约、是否到院、是否成交。", "补齐实收金额。"],
    avoid: ["不要在回流不清楚时调预算。", "不要把来源空白客户算给某个平台。"],
    observe: "今天内先补数据",
    review: ["e看牙记录匹配率", "平台线索回流率", "实收金额完整率"],
  },
  {
    category: "素材建议",
    platform: "抖音",
    platformGroup: "抖音",
    project: "种植",
    problem: "抖音还没有真实上传数据，不能判断素材好坏。",
    reason: "当前只有入口和字段预览，没有正式字段映射和 e看牙抖音回流。",
    now: "先上传抖音计划和素材表。",
    steps: ["导出抖音计划汇总。", "导出素材/创意表。", "前台记录抖音表单和抖音私信来源。", "3-7天后再看有效咨询和到院。"],
    avoid: ["不要只看播放量。", "不要把示例数据当真实效果。"],
    observe: "7天",
    review: ["有效咨询率", "到院数", "实收 ROI"],
  },
  {
    category: "高德建议",
    platform: "高德",
    platformGroup: "高德",
    project: "补牙",
    problem: "高德有到店意向，但现在还分不清自然到店和广告到店。",
    reason: "高德客户可能来自电话、导航、地图搜索，也可能是自然到店。如果来源不写清，实收 ROI 会算偏。",
    now: "先统一前台登记来源，再看高德是否值得加投入。",
    steps: ["前台登记来源类型：高德电话、高德导航到店或高德地图搜索。", "把实际到院项目写清楚。", "有成交时补上实收金额。", "满7天后再看高德客户是否稳定到院。"],
    avoid: ["不要把所有地图到店都算成广告效果。", "不要没有来源登记就加预算。"],
    observe: "7天",
    review: ["高德来源客户数", "到院数", "实收金额", "实收 ROI"],
  },
  {
    category: "价格策略建议",
    platform: "项目价格",
    platformGroup: "项目价格",
    project: "种植",
    problem: "种植属于高客单长周期项目，不能因为单日成交少就大幅调整价格。",
    reason: "种植通常需要检查、沟通方案、和家人商量，7-30天才更容易看清结果。",
    now: "人工复核后做小幅测试，先继续观察，不要大幅加预算或直接降价。",
    steps: ["检查项目价格管理里展示价、活动价和实际常见成交价是否一致。", "确认套餐包含内容是否说清楚。", "让医生补充方案评估说明。", "观察7-30天后再判断是否调整价格表达。"],
    avoid: ["不要直接跟低价竞品。", "不要只看当天成交就暂停种植投放。"],
    observe: "7-30天",
    review: ["种植来源客户数", "到院数", "方案沟通情况", "实收 ROI"],
  },
];

export default function RecommendationsPage() {
  const [category, setCategory] = useState("全部建议");
  const [platform, setPlatform] = useState("全部");
  const [project, setProject] = useState("全部项目");

  const filtered = manualSuggestions.filter((item) => {
    const categoryKeywords = categoryMap[category] ?? [];
    const text = `${item.category} ${item.problem} ${item.now}`;
    const categoryMatched = categoryKeywords.length === 0 || categoryKeywords.some((keyword) => text.includes(keyword));
    const platformMatched = platform === "全部" || item.platformGroup === platform || item.category.includes(platform);
    const projectMatched = project === "全部项目" || item.project === project;
    return categoryMatched && platformMatched && projectMatched;
  });

  return (
    <AppShell activeHref="/recommendations">
      <PageHeader
        eyebrow="人工确认闭环"
        title="今日总建议"
        description="这里是今天的总建议，帮你看今天整体先做什么、哪些先别乱动。系统不会替你操作广告后台，所有建议必须人工确认。"
        action={
          <PageHelpButton
            purpose="这是跨平台汇总建议，把今天整体最该处理的事写成一步一步的操作手册。"
            when="看完数据质量和平台页面后看。"
            focus={["问题是什么", "现在该做什么", "具体怎么做", "不要做什么", "几天后看什么"]}
            next="按步骤执行，执行后去操作记录里登记。"
            mistakes={["不要让系统替你操作广告后台。", "不要看不懂原因就改预算。"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">
          当前建议主要基于美团 + e看牙 + 项目价格管理。抖音、腾讯广点通入口已开放，但暂未纳入建议计算；竞品情报仅作参考。
        </p>
        <p>当前已支持计算的数据源：{supportedDataSourceText}</p>
        <p>已开放但暂不参与建议计算的数据源：{pendingDataSourceText}</p>
        <p>数据质量评分：{qualityResult.score}分，AI建议置信度：{qualityResult.grade}。</p>
        <p>{pendingIntegrationNote}</p>
        <p>{riskBoundaryNotes.join(" ")}</p>
      </section>

      <section className="mb-6 space-y-3 rounded-md border border-slate-200 bg-white p-4">
        <FilterRow label="快速导航" options={Object.keys(categoryMap)} value={category} onChange={setCategory} />
        <FilterRow label="平台筛选" options={platforms} value={platform} onChange={setPlatform} />
        <FilterRow label="项目筛选" options={projects} value={project} onChange={setProject} />
      </section>

      <section className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-950">
          今日总建议（{filtered.length} / {manualSuggestions.length}）
        </h3>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          静态规则建议，需要人工确认
        </span>
      </section>

      <section className="grid gap-4">
        {filtered.map((suggestion) => (
          <ManualSuggestionCard key={`${suggestion.platform}-${suggestion.problem}`} suggestion={suggestion} />
        ))}
      </section>
    </AppShell>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-sm font-semibold text-slate-700">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
            value === option
              ? "border-cyan-200 bg-cyan-50 text-cyan-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
          type="button"
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ManualSuggestionCard({ suggestion }: { suggestion: (typeof manualSuggestions)[number] }) {
  const [choice, setChoice] = useState<string | null>(null);
  const aiTip = "当前为前端演示，接入 OpenAI API 后可针对这条建议继续追问。";

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">{suggestion.category}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{suggestion.platform}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{suggestion.project}</span>
      </div>
      <dl className="mt-4 grid gap-4 lg:grid-cols-2">
        <Field label="问题是什么" value={suggestion.problem} />
        <Field label="为什么这么判断" value={suggestion.reason} />
        <Field label="现在该做什么" value={suggestion.now} />
        <ListField label="具体怎么做" items={suggestion.steps} />
        <ListField label="不要做什么" items={suggestion.avoid} />
        <Field label="观察几天" value={suggestion.observe} />
        <ListField label="几天后看什么" items={suggestion.review} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {["采纳建议", "继续观察", "不采纳"].map((action) => (
          <button
            key={action}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              choice === action
                ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            type="button"
            onClick={() => setChoice(action)}
          >
            {action}
          </button>
        ))}
        <Link
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
            choice === "记录执行"
              ? "border-cyan-200 bg-cyan-50 text-cyan-800"
              : "border-slate-200 bg-white text-slate-700"
          }`}
          href="/action-logs"
          onClick={() => setChoice("记录执行")}
        >
          记录执行
        </Link>
        <button
          className={`rounded-md border px-3 py-2 text-sm font-semibold ${
            choice === "问 AI 小客服"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-white text-slate-700"
          }`}
          type="button"
          onClick={() => setChoice("问 AI 小客服")}
        >
          问 AI 小客服
        </button>
      </div>
      {choice ? (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          已选择：{choice}。{choice === "问 AI 小客服" ? aiTip : "当前为前端演示，接入数据库后会保存这次选择。"}
        </p>
      ) : null}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1">
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </dd>
    </div>
  );
}
