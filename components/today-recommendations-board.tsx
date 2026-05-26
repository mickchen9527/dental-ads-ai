"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  formatInteger,
  formatRate,
  formatRoi,
} from "@/lib/utils/formatters";

type Priority = "high" | "medium" | "low";
type DateType = "source_date" | "visit_date" | "deal_date";
type PresetKey = "today" | "yesterday" | "last7" | "thisWeek" | "lastWeek" | "thisMonth" | "custom";
type Choice = "采纳建议" | "继续观察" | "不采纳" | "记录执行" | "问 AI 小客服";
type HandledChoice = "采纳建议" | "继续观察" | "不采纳";
type ProcessedVariant = "accepted" | "watching" | "ignored";

type TodayRecommendation = {
  id: string;
  title: string;
  platform: string;
  priority: Priority;
  problemType: string;
  problem: string;
  reason: string;
  action: string;
  risk: string;
  immediateAdjustment: "建议先处理" | "建议观察" | "不建议立即调整";
  steps: string[];
  dontDo: string;
  observeDays: string;
  reviewMetrics: string[];
  dataBasis: string[];
  status: "pending";
};

type PlatformSummary = {
  key: "meituan" | "douyin" | "gdt" | "amap";
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  avgClickCost: number | null;
  clickRate: number | null;
  actionCount: number;
  leadCount: number;
  conversionCount: number;
  hasData: boolean;
  onlyFrontTraffic: boolean;
  ekanya: {
    leadCount: number;
    appointmentCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    visitRate: number | null;
    dealRate: number | null;
    paidRoi: number | null;
  };
};

type DataGap = {
  platform: string;
  message: string;
};

type TodayRecommendationsResponse = {
  range: {
    startDate: string;
    endDate: string;
    dateType: DateType;
  };
  uploadCompleteness: {
    hasMeituanSummary: boolean;
    hasMeituanKeywords: boolean;
    hasEkanyaBackflow: boolean;
    hasAnyParsedData: boolean;
    hasDouyin: boolean;
    hasGdt: boolean;
    hasAmap: boolean;
  };
  meituanSummary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    avgClickCost: number | null;
    phoneViews: number;
    onlineConsultClicks: number;
    orders: number;
    groupBuyOrders: number;
    clickRate: number | null;
    phoneRate: number | null;
    consultRate: number | null;
  };
  ekanyaSummary: {
    leadCount: number;
    appointmentCount: number;
    visitCount: number;
    dealCount: number;
    paidAmount: number;
    avgPaidAmount: number | null;
    visitRate: number | null;
    dealRate: number | null;
    paidRoi: number | null;
  };
  platformSummaries: PlatformSummary[];
  dataGaps: DataGap[];
  recommendations: TodayRecommendation[];
};

const presets: Array<{ key: PresetKey; label: string }> = [
  { key: "today", label: "今日" },
  { key: "yesterday", label: "昨日" },
  { key: "last7", label: "近 7 天" },
  { key: "thisWeek", label: "本周" },
  { key: "lastWeek", label: "上周" },
  { key: "thisMonth", label: "本月" },
  { key: "custom", label: "自定义日期" },
];

const dateTypes: Array<{ key: DateType; label: string; help: string }> = [
  { key: "source_date", label: "按来源日期", help: "看客户是哪天从平台来的。" },
  { key: "visit_date", label: "按到院日期", help: "看客户是哪天实际到院的。" },
  { key: "deal_date", label: "按成交日期", help: "看客户是哪天成交或收费的。" },
];

const priorityText: Record<Priority, string> = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

const priorityClass: Record<Priority, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const recommendationChoiceStorageKey = "dental_ads_recommendation_choices_v1";
const recommendationActionLogStorageKey = "dental_ads_recommendation_action_logs_v1";

export function TodayRecommendationsBoard() {
  const [preset, setPreset] = useState<PresetKey>("last7");
  const [dateType, setDateType] = useState<DateType>("source_date");
  const [customStart, setCustomStart] = useState(getPresetRange("last7").startDate);
  const [customEnd, setCustomEnd] = useState(getPresetRange("last7").endDate);
  const [data, setData] = useState<TodayRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choiceById, setChoiceById] = useState<Record<string, Choice>>(() => readStoredRecommendationChoices());
  const [expandedHandledIds, setExpandedHandledIds] = useState<Record<string, boolean>>({});

  const selectedRange = useMemo(() => {
    if (preset === "custom") {
      return { startDate: customStart, endDate: customEnd };
    }
    return getPresetRange(preset);
  }, [customEnd, customStart, preset]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      startDate: selectedRange.startDate,
      endDate: selectedRange.endDate,
      dateType,
    });

    async function loadRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/recommendations/today?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "读取今日总建议失败，请稍后再试。");
        }

        setData(payload as TodayRecommendationsResponse);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "读取今日总建议失败，请稍后再试。");
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
    return () => controller.abort();
  }, [dateType, selectedRange.endDate, selectedRange.startDate]);

  useEffect(() => {
    writeStoredRecommendationChoices(choiceById);
  }, [choiceById]);

  const recommendations = data?.recommendations ?? [];
  const acceptedRecommendations = recommendations.filter((recommendation) => choiceById[recommendation.id] === "采纳建议");
  const watchingRecommendations = recommendations.filter((recommendation) => choiceById[recommendation.id] === "继续观察");
  const ignoredRecommendations = recommendations.filter((recommendation) => choiceById[recommendation.id] === "不采纳");
  const pendingRecommendations = recommendations.filter((recommendation) => !isHandledChoice(choiceById[recommendation.id]));

  function handleChoose(recommendation: TodayRecommendation, choice: Choice) {
    setChoiceById((current) => ({ ...current, [recommendation.id]: choice }));
    appendRecommendationActionLog(recommendation, choice);
    if (isHandledChoice(choice)) {
      setExpandedHandledIds((current) => ({ ...current, [recommendation.id]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">时间范围</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              这里按你选的时间范围读取已解析数据。当前基于美团、抖音、腾讯广点通、高德和 e看牙做规则型建议。
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
            当前时间：{selectedRange.startDate} 至 {selectedRange.endDate}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((item) => (
            <button
              key={item.key}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                preset === item.key
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
              type="button"
              onClick={() => setPreset(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {preset === "custom" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              开始日期
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              结束日期
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-base font-semibold text-slate-950">时间口径</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {dateTypes.map((item) => (
              <button
                key={item.key}
                className={`rounded-md border px-3 py-2 text-left text-sm font-semibold ${
                  dateType === item.key
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
                type="button"
                onClick={() => setDateType(item.key)}
              >
                <span className="block">{item.label}</span>
                <span className="mt-1 block text-xs font-normal text-slate-500">{item.help}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          正在读取已解析数据，稍等一下。
        </section>
      ) : null}

      {error ? (
        <section className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
          {error}
        </section>
      ) : null}

      {data ? (
        <>
          <OverviewCards data={data} />
          <PlatformCoverage data={data} />

          {!data.uploadCompleteness.hasAnyParsedData ? (
            <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              当前还没有足够的真实数据生成建议。请先上传并解析各平台数据和 e看牙后端回流数据。
            </section>
          ) : null}

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  待处理建议（{pendingRecommendations.length} 条）
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  待处理建议默认展开。点击采纳后会移动到下方“已采纳建议”，并自动收起。
                </p>
              </div>
              <Link
                className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
                href="/upload"
              >
                去上传或解析数据
              </Link>
            </div>

            <div className="mt-4 grid gap-4">
              {pendingRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  choice={choiceById[recommendation.id]}
                  recommendation={recommendation}
                  onChoose={(choice) => handleChoose(recommendation, choice)}
                />
              ))}
              {pendingRecommendations.length === 0 ? (
                <EmptyState text="当前没有待处理建议。已采纳的建议会显示在下方，不会消失。" />
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-950">
              已采纳建议（{acceptedRecommendations.length} 条）
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              已采纳建议默认收起，只占一行摘要。需要复核时可以展开查看详情。
            </p>
            <div className="mt-4 grid gap-3">
              {acceptedRecommendations.map((recommendation) => (
                <ProcessedRecommendation
                  key={recommendation.id}
                  actionLabel="改为继续观察"
                  expanded={Boolean(expandedHandledIds[recommendation.id])}
                  label="已采纳"
                  recommendation={recommendation}
                  onToggle={() =>
                    setExpandedHandledIds((current) => ({
                      ...current,
                      [recommendation.id]: !current[recommendation.id],
                    }))
                  }
                  onAction={() => handleChoose(recommendation, "继续观察")}
                  variant="accepted"
                />
              ))}
              {acceptedRecommendations.length === 0 ? (
                <EmptyState text="还没有采纳建议。点击上方建议卡里的“采纳建议”后，会自动收起到这里。" />
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-950">
              继续观察（{watchingRecommendations.length} 条）
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              继续观察的建议会保留状态，适合样本量不够或观察周期没到的情况。
            </p>
            <div className="mt-4 grid gap-3">
              {watchingRecommendations.map((recommendation) => (
                <ProcessedRecommendation
                  key={recommendation.id}
                  actionLabel="采纳建议"
                  expanded={Boolean(expandedHandledIds[recommendation.id])}
                  label="继续观察"
                  recommendation={recommendation}
                  onToggle={() =>
                    setExpandedHandledIds((current) => ({
                      ...current,
                      [recommendation.id]: !current[recommendation.id],
                    }))
                  }
                  onAction={() => handleChoose(recommendation, "采纳建议")}
                  variant="watching"
                />
              ))}
              {watchingRecommendations.length === 0 ? (
                <EmptyState text="还没有继续观察的建议。样本量不够时，可以先放到这里。" />
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-950">
              已忽略 / 暂不采纳（{ignoredRecommendations.length} 条）
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              暂不采纳不是删除建议，只是说明这条暂时不处理，后面仍然可以展开复核。
            </p>
            <div className="mt-4 grid gap-3">
              {ignoredRecommendations.map((recommendation) => (
                <ProcessedRecommendation
                  key={recommendation.id}
                  actionLabel="改为继续观察"
                  expanded={Boolean(expandedHandledIds[recommendation.id])}
                  label="已忽略"
                  recommendation={recommendation}
                  onToggle={() =>
                    setExpandedHandledIds((current) => ({
                      ...current,
                      [recommendation.id]: !current[recommendation.id],
                    }))
                  }
                  onAction={() => handleChoose(recommendation, "继续观察")}
                  variant="ignored"
                />
              ))}
              {ignoredRecommendations.length === 0 ? (
                <EmptyState text="还没有暂不采纳的建议。点击“不采纳”后，会收起到这里。" />
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-950">数据不足提醒</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              没有数据的平台不会硬生成建议，只在这里提醒你是否需要补数据。
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.dataGaps.map((gap) => (
                <article key={gap.platform} className="rounded-md bg-slate-50 p-3">
                  <h4 className="text-sm font-semibold text-slate-950">{gap.platform}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{gap.message}</p>
                </article>
              ))}
              {data.dataGaps.length === 0 ? (
                <EmptyState text="当前已解析的平台数据比较完整，暂时没有平台缺数提醒。" />
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function OverviewCards({ data }: { data: TodayRecommendationsResponse }) {
  const totalSpend = data.platformSummaries.reduce((total, platform) => total + platform.spend, 0);
  const totalClicks = data.platformSummaries.reduce((total, platform) => total + platform.clicks, 0);
  const totalActions = data.platformSummaries.reduce((total, platform) => total + platform.actionCount, 0);
  const totalPaidAmount = data.platformSummaries.reduce((total, platform) => total + platform.ekanya.paidAmount, 0);
  const paidRoi = totalSpend > 0 ? totalPaidAmount / totalSpend : null;

  const cards = [
    { label: "多平台总花费", value: formatCurrency(totalSpend), note: "来自已解析平台前端数据" },
    { label: "多平台总点击", value: formatInteger(totalClicks), note: "美团、抖音、腾讯、高德合计" },
    { label: "平台线索/动作", value: formatInteger(totalActions), note: "电话、咨询、表单、导航、订单等动作" },
    { label: "初步实收 ROI", value: formatNullableRoi(paidRoi), note: "e看牙实收 / 平台总花费，不是精准归因" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{card.note}</p>
        </div>
      ))}
    </section>
  );
}

function PlatformCoverage({ data }: { data: TodayRecommendationsResponse }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">平台数据覆盖</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        平台前端数据用于判断流量和线索，e看牙用于判断到院、成交和实收。当前是初步闭环，不是精准归因。
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">平台</th>
              <th className="px-4 py-3">花费</th>
              <th className="px-4 py-3">点击</th>
              <th className="px-4 py-3">点击率</th>
              <th className="px-4 py-3">平台线索/动作</th>
              <th className="px-4 py-3">e看牙来源客户</th>
              <th className="px-4 py-3">实收</th>
              <th className="px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.platformSummaries.map((platform) => (
              <tr key={platform.key}>
                <td className="px-4 py-3 font-semibold text-slate-950">{platform.platform}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(platform.spend)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(platform.clicks)}</td>
                <td className="px-4 py-3 text-slate-700">{formatNullableRate(platform.clickRate)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(platform.actionCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatInteger(platform.ekanya.leadCount)}</td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(platform.ekanya.paidAmount)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {platform.hasData ? "有可分析数据" : "暂无可分析数据"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecommendationCard({
  recommendation,
  choice,
  onChoose,
}: {
  recommendation: TodayRecommendation;
  choice?: Choice;
  onChoose: (choice: Choice) => void;
}) {
  const aiChoice: Choice = "问 AI 小客服";
  const aiTip = "当前为前端演示，接入 OpenAI API 后可针对这条建议继续追问。";

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <RecommendationHeader recommendation={recommendation} statusText={choice ? `已选择：${choice}` : "待人工确认"} />

      <RecommendationDetails recommendation={recommendation} />

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {(["采纳建议", "继续观察", "不采纳"] as Choice[]).map((action) => (
          <button
            key={action}
            className={actionButtonClass(choice === action)}
            type="button"
            onClick={() => onChoose(action)}
          >
            {action}
          </button>
        ))}
        <Link
          className={actionButtonClass(choice === "记录执行")}
          href="/action-logs"
          onClick={() => onChoose("记录执行")}
        >
          记录执行
        </Link>
        <button
          className={choice === aiChoice ? activeAiButtonClass : inactiveButtonClass}
          type="button"
          onClick={() => onChoose(aiChoice)}
        >
          问 AI 小客服
        </button>
      </div>

      {choice ? (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          已选择：{choice}。{choice === aiChoice ? aiTip : "当前只做前端状态记录，后续接入数据库后会保存操作结果。"}
        </p>
      ) : null}
    </article>
  );
}

function ProcessedRecommendation({
  recommendation,
  label,
  variant,
  actionLabel,
  expanded,
  onToggle,
  onAction,
}: {
  recommendation: TodayRecommendation;
  label: string;
  variant: ProcessedVariant;
  actionLabel: string;
  expanded: boolean;
  onToggle: () => void;
  onAction: () => void;
}) {
  const style = processedVariantClass[variant];

  return (
    <article className={`rounded-md border p-4 ${style.container}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className={`text-sm font-semibold ${style.text}`}>
          {label}：{recommendation.platform}｜{recommendation.problemType}｜{recommendation.title}
        </p>
        <div className="flex flex-wrap gap-2">
          <button className={`rounded-md border bg-white px-3 py-2 text-sm font-semibold ${style.button}`} type="button" onClick={onToggle}>
            {expanded ? "收起详情" : "展开查看"}
          </button>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-4 rounded-md bg-white p-4">
          <RecommendationHeader recommendation={recommendation} statusText={label} compact />
          <RecommendationDetails recommendation={recommendation} />
        </div>
      ) : null}
    </article>
  );
}

const processedVariantClass: Record<ProcessedVariant, { container: string; text: string; button: string }> = {
  accepted: {
    container: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-900",
    button: "border-emerald-200 text-emerald-800",
  },
  watching: {
    container: "border-amber-200 bg-amber-50",
    text: "text-amber-900",
    button: "border-amber-200 text-amber-900",
  },
  ignored: {
    container: "border-slate-200 bg-slate-50",
    text: "text-slate-800",
    button: "border-slate-200 text-slate-700",
  },
};

function RecommendationHeader({ recommendation, statusText, compact = false }: { recommendation: TodayRecommendation; statusText: string; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${priorityClass[recommendation.priority]}`}>
            {priorityText[recommendation.priority]}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {recommendation.platform}
          </span>
          <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">
            {recommendation.problemType}
          </span>
          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
            {recommendation.immediateAdjustment}
          </span>
        </div>
        <h4 className={`${compact ? "mt-2 text-base" : "mt-3 text-lg"} font-semibold text-slate-950`}>{recommendation.title}</h4>
      </div>
      <span className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
        状态：{statusText}
      </span>
    </div>
  );
}

function RecommendationDetails({ recommendation }: { recommendation: TodayRecommendation }) {
  return (
    <dl className="mt-4 grid gap-4 lg:grid-cols-2">
      <Field label="发现的问题" value={recommendation.problem} />
      <Field label="可能原因" value={recommendation.reason} />
      <Field label="建议动作" value={recommendation.action} />
      <Field label="风险提醒" value={recommendation.risk} />
      <Field label="不要做什么" value={recommendation.dontDo} />
      <Field label="观察几天" value={recommendation.observeDays} />
      <ListField label="具体怎么做" items={recommendation.steps} />
      <ListField label="几天后看什么" items={recommendation.reviewMetrics} />
      <ListField label="数据依据" items={recommendation.dataBasis} />
    </dl>
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

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">{text}</div>;
}

function isHandledChoice(choice?: Choice): choice is HandledChoice {
  return choice === "采纳建议" || choice === "继续观察" || choice === "不采纳";
}

function isChoice(value: unknown): value is Choice {
  return (
    value === "采纳建议" ||
    value === "继续观察" ||
    value === "不采纳" ||
    value === "记录执行" ||
    value === "问 AI 小客服"
  );
}

function readStoredRecommendationChoices() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(recommendationChoiceStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<Record<string, Choice>>((result, [id, choice]) => {
      if (isChoice(choice)) {
        result[id] = choice;
      }
      return result;
    }, {});
  } catch {
    return {};
  }
}

function writeStoredRecommendationChoices(choices: Record<string, Choice>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(recommendationChoiceStorageKey, JSON.stringify(choices));
  } catch {
    // 本地浏览器存储不可用时，不影响建议页继续使用。
  }
}

function appendRecommendationActionLog(recommendation: TodayRecommendation, choice: Choice) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(recommendationActionLogStorageKey);
    const existing = raw ? JSON.parse(raw) : [];
    const previousLogs = Array.isArray(existing) ? existing : [];
    const actionType = getRecommendationActionType(choice);
    const status = getRecommendationStatusText(choice);
    const nextLog = {
      id: `${recommendation.id}-${actionType}-${Date.now()}`,
      recommendationId: recommendation.id,
      actionType,
      platform: recommendation.platform,
      title: recommendation.title,
      problemType: recommendation.problemType,
      status,
      note: `${status}：${recommendation.action}`,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      recommendationActionLogStorageKey,
      JSON.stringify([nextLog, ...previousLogs].slice(0, 200)),
    );
  } catch {
    // 操作记录写入失败时，只影响本机记录，不阻断建议状态切换。
  }
}

function getRecommendationActionType(choice: Choice) {
  if (choice === "采纳建议") return "recommendation_adopted";
  if (choice === "继续观察") return "recommendation_watching";
  if (choice === "不采纳") return "recommendation_ignored";
  if (choice === "记录执行") return "recommendation_record_execution";
  return "recommendation_ask_ai";
}

function getRecommendationStatusText(choice: Choice) {
  if (choice === "采纳建议") return "已采纳";
  if (choice === "继续观察") return "继续观察";
  if (choice === "不采纳") return "已忽略";
  if (choice === "记录执行") return "记录执行";
  return "问 AI 小客服";
}

function actionButtonClass(active: boolean) {
  return active ? activeButtonClass : inactiveButtonClass;
}

const activeButtonClass = "rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800";
const inactiveButtonClass = "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700";
const activeAiButtonClass = "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900";

function formatNullableRate(value: number | null) {
  return value === null ? "暂无" : formatRate(value);
}

function formatNullableRoi(value: number | null) {
  return value === null ? "暂无" : formatRoi(value);
}

function getPresetRange(preset: PresetKey) {
  const now = new Date();
  const today = startOfDay(now);

  if (preset === "today") {
    return { startDate: formatDate(today), endDate: formatDate(today) };
  }

  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
  }

  if (preset === "thisWeek") {
    const start = addDays(today, 1 - getChinaWeekday(today));
    return { startDate: formatDate(start), endDate: formatDate(today) };
  }

  if (preset === "lastWeek") {
    const thisWeekStart = addDays(today, 1 - getChinaWeekday(today));
    const lastWeekStart = addDays(thisWeekStart, -7);
    const lastWeekEnd = addDays(thisWeekStart, -1);
    return { startDate: formatDate(lastWeekStart), endDate: formatDate(lastWeekEnd) };
  }

  if (preset === "thisMonth") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: formatDate(start), endDate: formatDate(today) };
  }

  return { startDate: formatDate(addDays(today, -6)), endDate: formatDate(today) };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getChinaWeekday(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
