"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";

type LogSource = "loading" | "cloud" | "local";
type ExecutionStatus = "pending" | "done" | "delayed" | "cancelled";
type ReviewResult = "unreviewed" | "effective" | "ineffective" | "observing";
type ActionStatus = "adopted" | "watching" | "ignored" | "record_execution" | "ask_ai" | "unknown";

type ActionLogRecord = {
  id: string;
  actionType: string;
  source: string;
  recommendationId: string;
  platform: string;
  title: string;
  actionStatus: ActionStatus;
  note: string;
  payload: unknown;
  createdAt: string;
  executionStatus: ExecutionStatus;
  reviewResult: ReviewResult;
  reviewNote: string;
  reviewedAt: string | null;
  updatedAt: string | null;
};

type LocalRecommendationActionLog = {
  id?: string;
  recommendationId?: string;
  actionType?: string;
  platform?: string;
  title?: string;
  problemType?: string;
  status?: string;
  note?: string;
  createdAt?: string;
  executionStatus?: string;
  reviewResult?: string;
  reviewNote?: string;
  reviewedAt?: string | null;
  updatedAt?: string | null;
};

type CloudRecommendationActionLog = {
  id?: string;
  action_type?: string | null;
  source?: string | null;
  recommendation_id?: string | null;
  platform?: string | null;
  title?: string | null;
  status?: string | null;
  note?: string | null;
  payload?: unknown;
  created_at?: string | null;
  execution_status?: string | null;
  review_result?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  updated_at?: string | null;
};

type LocalReviewPatch = {
  executionStatus?: ExecutionStatus;
  reviewResult?: ReviewResult;
  reviewNote?: string;
  reviewedAt?: string | null;
  updatedAt?: string | null;
};

const recommendationActionLogStorageKey = "dental_ads_recommendation_action_logs_v1";
const actionLogReviewStorageKey = "dental_ads_action_log_reviews_v1";

const platformOptions = ["全部", "美团", "抖音", "腾讯广点通", "高德", "e看牙"];
const actionStatusOptions = ["全部", "已采纳", "继续观察", "不采纳"];
const executionStatusOptions = ["全部", "未执行", "已执行", "暂缓", "不执行"];
const reviewResultOptions = ["全部", "未复盘", "有效", "无效", "继续观察"];

export default function ActionLogsPage() {
  const [logSource, setLogSource] = useState<LogSource>("loading");
  const [sourceMessage, setSourceMessage] = useState("正在读取云端操作记录。");
  const [cloudReviewReady, setCloudReviewReady] = useState(false);
  const [records, setRecords] = useState<ActionLogRecord[]>([]);
  const [platformFilter, setPlatformFilter] = useState("全部");
  const [actionStatusFilter, setActionStatusFilter] = useState("全部");
  const [executionStatusFilter, setExecutionStatusFilter] = useState("全部");
  const [reviewResultFilter, setReviewResultFilter] = useState("全部");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function loadActionLogs() {
      try {
        const response = await fetch("/api/action-logs?limit=100", { cache: "no-store" });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "读取云端操作记录失败。");
        }

        if (!active) return;
        const mappedRecords = mergeLocalReviews(mapCloudRecords(payload?.records));
        setRecords(mappedRecords);
        setLogSource("cloud");
        setCloudReviewReady(Boolean(payload?.reviewFieldsReady));
        setSourceMessage(
          payload?.reviewFieldsReady
            ? "当前显示：云端操作记录，可跨设备保留。"
            : "当前显示：云端基础操作记录。云端复盘字段尚未创建，复盘修改会先保存在本机浏览器。",
        );
      } catch {
        if (!active) return;
        setRecords(mergeLocalReviews(readLocalRecords()));
        setLogSource("local");
        setCloudReviewReady(false);
        setSourceMessage("当前显示：本机临时记录。本机记录只保存在当前浏览器，换电脑或清缓存会丢失。");
      }
    }

    loadActionLogs();
    return () => {
      active = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (platformFilter !== "全部" && normalizePlatform(record.platform) !== platformFilter) return false;
      if (actionStatusFilter !== "全部" && actionStatusLabel(record.actionStatus) !== actionStatusFilter) return false;
      if (executionStatusFilter !== "全部" && executionStatusLabel(record.executionStatus) !== executionStatusFilter) return false;
      if (reviewResultFilter !== "全部" && reviewResultLabel(record.reviewResult) !== reviewResultFilter) return false;
      return true;
    });
  }, [actionStatusFilter, executionStatusFilter, platformFilter, records, reviewResultFilter]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      adopted: records.filter((record) => record.actionStatus === "adopted").length,
      done: records.filter((record) => record.executionStatus === "done").length,
      pendingReview: records.filter((record) => record.reviewResult === "unreviewed").length,
      effective: records.filter((record) => record.reviewResult === "effective").length,
      observing: records.filter((record) => record.reviewResult === "observing").length,
    };
  }, [records]);

  async function updateReview(record: ActionLogRecord, patch: LocalReviewPatch) {
    const now = new Date().toISOString();
    const nextPatch: LocalReviewPatch = {
      ...patch,
      updatedAt: now,
    };

    if (patch.reviewResult || patch.reviewNote !== undefined) {
      nextPatch.reviewedAt = now;
    }

    if (logSource === "cloud" && cloudReviewReady) {
      try {
        const response = await fetch("/api/action-logs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: record.id,
            executionStatus: nextPatch.executionStatus,
            reviewResult: nextPatch.reviewResult,
            reviewNote: nextPatch.reviewNote,
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "云端复盘状态保存失败。");
        }

        const [updatedRecord] = mergeLocalReviews(mapCloudRecords([payload.record]));
        if (updatedRecord) {
          setRecords((current) => current.map((item) => (item.id === record.id ? updatedRecord : item)));
        }
        return;
      } catch {
        setSourceMessage("云端复盘保存失败，当前这次修改已先保存在本机浏览器。");
      }
    }

    const updatedRecord = applyReviewPatch(record, nextPatch);
    writeLocalReviewPatch(record.id, nextPatch);
    setRecords((current) => current.map((item) => (item.id === record.id ? updatedRecord : item)));
  }

  return (
    <AppShell activeHref="/action-logs">
      <PageHeader
        eyebrow="执行复盘"
        title="建议执行复盘"
        description="这里不是只看日志，而是记录建议有没有执行、执行后有没有效果，方便下一次判断。"
        action={
          <PageHelpButton
            purpose="把今日总建议变成可复盘的执行记录。"
            when="每次采纳建议、暂缓建议、执行动作后都可以回来标记结果。"
            focus={["执行状态", "复盘结果", "复盘备注", "是否继续观察"]}
            next="先标记是否执行，满3天或7天后再补复盘结果。"
            mistakes={["不要只采纳不复盘。", "不要高客单项目刚执行一天就判断无效。"]}
          />
        }
      />

      <section className="mb-4 rounded-md border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
        {sourceMessage}
        <br />
        云端记录可以跨设备保留；本机临时记录只保存在当前浏览器。
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="总操作记录" value={stats.total} />
        <StatCard label="已采纳建议" value={stats.adopted} />
        <StatCard label="已执行" value={stats.done} />
        <StatCard label="待复盘" value={stats.pendingReview} />
        <StatCard label="有效建议" value={stats.effective} />
        <StatCard label="继续观察" value={stats.observing} />
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">筛选记录</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          可以按平台、建议处理状态、执行状态和复盘结果筛选。没有数据时先到今日总建议里采纳或记录一条。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SelectFilter label="平台" value={platformFilter} options={platformOptions} onChange={setPlatformFilter} />
          <SelectFilter label="操作状态" value={actionStatusFilter} options={actionStatusOptions} onChange={setActionStatusFilter} />
          <SelectFilter label="执行状态" value={executionStatusFilter} options={executionStatusOptions} onChange={setExecutionStatusFilter} />
          <SelectFilter label="复盘结果" value={reviewResultFilter} options={reviewResultOptions} onChange={setReviewResultFilter} />
        </div>
      </section>

      <section className="grid gap-4">
        {logSource === "loading" ? (
          <EmptyState text="正在读取操作记录，稍等一下。" />
        ) : null}

        {filteredRecords.map((record) => (
          <article key={record.id} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge text={normalizePlatform(record.platform)} />
                  <Badge text={actionStatusLabel(record.actionStatus)} />
                  <Badge text={executionStatusLabel(record.executionStatus)} />
                  <Badge text={reviewResultLabel(record.reviewResult)} />
                </div>
                <h2 className="mt-3 text-base font-semibold text-slate-950">{record.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  时间：{formatLogDate(record.createdAt)}｜来源：{sourceText(record.source)}｜操作：{actionTypeLabel(record.actionType)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{record.note || "暂无操作备注。"}</p>
              </div>
              <div className="text-sm leading-6 text-slate-600 xl:text-right">
                <p>这条建议执行了吗？</p>
                <p>执行后有没有效果？</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">执行状态</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ActionButton active={record.executionStatus === "done"} text="标记为已执行" onClick={() => updateReview(record, { executionStatus: "done" })} />
                  <ActionButton active={record.executionStatus === "delayed"} text="标记为暂缓" onClick={() => updateReview(record, { executionStatus: "delayed" })} />
                  <ActionButton active={record.executionStatus === "cancelled"} text="标记为不执行" onClick={() => updateReview(record, { executionStatus: "cancelled" })} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-950">复盘结果</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ActionButton active={record.reviewResult === "effective"} text="标记为有效" onClick={() => updateReview(record, { reviewResult: "effective" })} />
                  <ActionButton active={record.reviewResult === "ineffective"} text="标记为无效" onClick={() => updateReview(record, { reviewResult: "ineffective" })} />
                  <ActionButton active={record.reviewResult === "observing"} text="继续观察" onClick={() => updateReview(record, { reviewResult: "observing" })} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-950">复盘备注</h3>
                <textarea
                  className="mt-2 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700"
                  placeholder="写一句复盘备注，方便下次判断。"
                  value={noteDrafts[record.id] ?? record.reviewNote}
                  onChange={(event) =>
                    setNoteDrafts((current) => ({
                      ...current,
                      [record.id]: event.target.value,
                    }))
                  }
                />
                <button
                  className="mt-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
                  type="button"
                  onClick={() => updateReview(record, { reviewNote: noteDrafts[record.id] ?? record.reviewNote })}
                >
                  保存备注
                </button>
              </div>
            </div>
          </article>
        ))}

        {logSource !== "loading" && filteredRecords.length === 0 ? (
          <EmptyState text="当前筛选条件下没有操作记录。可以去今日总建议里采纳、观察或忽略一条建议。" />
        ) : null}
      </section>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select
        className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionButton({ active, text, onClick }: { active: boolean; text: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-md border px-3 py-2 text-sm font-semibold ${
        active ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-700"
      }`}
      type="button"
      onClick={onClick}
    >
      {text}
    </button>
  );
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{text}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">{text}</div>;
}

function mapCloudRecords(records: unknown) {
  if (!Array.isArray(records)) return [];

  return records
    .filter((item): item is CloudRecommendationActionLog => Boolean(item && typeof item === "object"))
    .map((item) => {
      const id = item.id ?? item.recommendation_id ?? `${item.action_type ?? "action"}-${item.created_at ?? Date.now()}`;
      return {
        id,
        actionType: item.action_type ?? "unknown",
        source: item.source ?? "recommendations",
        recommendationId: item.recommendation_id ?? id,
        platform: item.platform ?? "未填写",
        title: item.title ?? "未命名建议",
        actionStatus: actionStatusFromValue(item.status, item.action_type),
        note: item.note ?? "",
        payload: item.payload ?? null,
        createdAt: item.created_at ?? "",
        executionStatus: normalizeExecutionStatus(item.execution_status),
        reviewResult: normalizeReviewResult(item.review_result),
        reviewNote: item.review_note ?? "",
        reviewedAt: item.reviewed_at ?? null,
        updatedAt: item.updated_at ?? null,
      } satisfies ActionLogRecord;
    });
}

function readLocalRecords() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(recommendationActionLogStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is LocalRecommendationActionLog => Boolean(item && typeof item === "object"))
      .map((item) => {
        const id = item.id ?? item.recommendationId ?? `${item.actionType ?? "action"}-${item.createdAt ?? Date.now()}`;
        return {
          id,
          actionType: item.actionType ?? "unknown",
          source: "recommendations",
          recommendationId: item.recommendationId ?? id,
          platform: item.platform ?? "未填写",
          title: item.title ?? "未命名建议",
          actionStatus: actionStatusFromValue(item.status, item.actionType),
          note: item.note ?? "",
          payload: null,
          createdAt: item.createdAt ?? "",
          executionStatus: normalizeExecutionStatus(item.executionStatus),
          reviewResult: normalizeReviewResult(item.reviewResult),
          reviewNote: item.reviewNote ?? "",
          reviewedAt: item.reviewedAt ?? null,
          updatedAt: item.updatedAt ?? null,
        } satisfies ActionLogRecord;
      });
  } catch {
    return [];
  }
}

function mergeLocalReviews(records: ActionLogRecord[]) {
  const reviews = readLocalReviewPatches();
  return records.map((record) => {
    const patch = reviews[record.id];
    return patch ? applyReviewPatch(record, patch) : record;
  });
}

function applyReviewPatch(record: ActionLogRecord, patch: LocalReviewPatch) {
  return {
    ...record,
    executionStatus: patch.executionStatus ?? record.executionStatus,
    reviewResult: patch.reviewResult ?? record.reviewResult,
    reviewNote: patch.reviewNote ?? record.reviewNote,
    reviewedAt: patch.reviewedAt ?? record.reviewedAt,
    updatedAt: patch.updatedAt ?? record.updatedAt,
  };
}

function readLocalReviewPatches() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(actionLogReviewStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, LocalReviewPatch>;
  } catch {
    return {};
  }
}

function writeLocalReviewPatch(id: string, patch: LocalReviewPatch) {
  if (typeof window === "undefined") return;

  try {
    const current = readLocalReviewPatches();
    window.localStorage.setItem(actionLogReviewStorageKey, JSON.stringify({ ...current, [id]: { ...current[id], ...patch } }));
  } catch {
    // 本机复盘状态保存失败时，不阻断页面操作。
  }
}

function actionStatusFromValue(status?: string | null, actionType?: string | null): ActionStatus {
  if (status === "adopted" || status === "已采纳") return "adopted";
  if (status === "watching" || status === "继续观察") return "watching";
  if (status === "ignored" || status === "已忽略") return "ignored";
  if (status === "record_execution" || status === "记录执行") return "record_execution";
  if (status === "ask_ai" || status === "问 AI 小客服") return "ask_ai";
  if (actionType === "recommendation_adopted") return "adopted";
  if (actionType === "recommendation_watching") return "watching";
  if (actionType === "recommendation_ignored") return "ignored";
  if (actionType === "recommendation_record_execution") return "record_execution";
  if (actionType === "recommendation_ask_ai") return "ask_ai";
  return "unknown";
}

function normalizeExecutionStatus(value?: string | null): ExecutionStatus {
  if (value === "done" || value === "已执行") return "done";
  if (value === "delayed" || value === "暂缓") return "delayed";
  if (value === "cancelled" || value === "不执行") return "cancelled";
  return "pending";
}

function normalizeReviewResult(value?: string | null): ReviewResult {
  if (value === "effective" || value === "有效") return "effective";
  if (value === "ineffective" || value === "无效") return "ineffective";
  if (value === "observing" || value === "继续观察") return "observing";
  return "unreviewed";
}

function normalizePlatform(platform: string) {
  if (platform.includes("美团") || platform.includes("点评")) return "美团";
  if (platform.includes("抖音")) return "抖音";
  if (platform.includes("腾讯") || platform.includes("广点通")) return "腾讯广点通";
  if (platform.includes("高德")) return "高德";
  if (platform.includes("e看牙")) return "e看牙";
  return platform || "未填写";
}

function actionStatusLabel(status: ActionStatus) {
  if (status === "adopted") return "已采纳";
  if (status === "watching") return "继续观察";
  if (status === "ignored") return "不采纳";
  if (status === "record_execution") return "记录执行";
  if (status === "ask_ai") return "问 AI 小客服";
  return "已记录";
}

function executionStatusLabel(status: ExecutionStatus) {
  if (status === "done") return "已执行";
  if (status === "delayed") return "暂缓";
  if (status === "cancelled") return "不执行";
  return "未执行";
}

function reviewResultLabel(result: ReviewResult) {
  if (result === "effective") return "有效";
  if (result === "ineffective") return "无效";
  if (result === "observing") return "继续观察";
  return "未复盘";
}

function actionTypeLabel(actionType?: string) {
  if (actionType === "recommendation_adopted") return "采纳今日建议";
  if (actionType === "recommendation_watching") return "继续观察今日建议";
  if (actionType === "recommendation_ignored") return "忽略今日建议";
  if (actionType === "recommendation_record_execution") return "记录执行入口";
  if (actionType === "recommendation_ask_ai") return "问 AI 小客服";
  return "今日建议操作";
}

function sourceText(source?: string | null) {
  if (source === "recommendations") return "今日总建议";
  return source ?? "系统操作";
}

function formatLogDate(value?: string | null) {
  if (!value) return "本机记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "本机记录";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
