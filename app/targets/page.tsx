"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import {
  defaultTargetSettings,
  targetSettingDefinitions,
  type RecommendationThresholdSettings,
  type TargetSettingKey,
} from "@/lib/recommendation-rules";

type SourceType = "default" | "cloud" | "local";

type TargetSettingResponseItem = {
  key: TargetSettingKey;
  label: string;
  value: number;
  unit: string;
  description: string;
  defaultValue: number;
  updatedAt: string | null;
};

type TargetsApiResponse = {
  source: "default" | "cloud";
  message: string;
  settings: TargetSettingResponseItem[];
};

const localStorageKey = "dental_ads_target_settings_v1";

export default function TargetsPage() {
  const [source, setSource] = useState<SourceType>("default");
  const [inputValues, setInputValues] = useState<Record<TargetSettingKey, string>>(() =>
    toInputValues(defaultTargetSettings),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("正在读取目标值设置。");

  const numericValues = useMemo(() => parseInputValues(inputValues), [inputValues]);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      const localSettings = readLocalSettings();

      try {
        const response = await fetch("/api/targets", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as TargetsApiResponse | null;

        if (!response.ok || !payload) {
          throw new Error(payload?.message ?? "读取云端目标值失败。");
        }

        if (!active) return;

        if (payload.source === "cloud") {
          const values = settingsResponseToValues(payload.settings);
          setInputValues(toInputValues(values));
          setSource("cloud");
          setMessage("当前使用：云端自定义目标值。");
          return;
        }

        if (localSettings) {
          setInputValues(toInputValues(localSettings));
          setSource("local");
          setMessage("当前使用：本机临时目标值。云端目标值表还没建好或没有数据。");
          return;
        }

        setInputValues(toInputValues(defaultTargetSettings));
        setSource("default");
        setMessage(payload.message || "当前使用：系统默认目标值。");
      } catch (error) {
        if (!active) return;

        if (localSettings) {
          setInputValues(toInputValues(localSettings));
          setSource("local");
          setMessage("当前使用：本机临时目标值。云端暂时不可用。");
        } else {
          setInputValues(toInputValues(defaultTargetSettings));
          setSource("default");
          setMessage(error instanceof Error ? `${error.message} 当前使用系统默认目标值。` : "当前使用系统默认目标值。");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    const settings = targetSettingDefinitions.map((definition) => ({
      key: definition.key,
      value: numericValues[definition.key],
    }));

    try {
      const response = await fetch("/api/targets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const payload = (await response.json().catch(() => null)) as TargetsApiResponse | null;

      if (!response.ok || !payload) {
        throw new Error(payload?.message ?? "保存云端目标值失败。");
      }

      const savedValues = settingsResponseToValues(payload.settings);
      setInputValues(toInputValues(savedValues));
      setSource("cloud");
      setMessage("目标值已保存到云端。今日总建议会优先使用云端目标值。");
      window.localStorage.removeItem(localStorageKey);
    } catch (error) {
      writeLocalSettings(numericValues);
      setSource("local");
      setMessage(
        error instanceof Error
          ? `${error.message} 已先保存为本机临时目标值。`
          : "云端保存失败，已先保存为本机临时目标值。",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreDefaults() {
    setInputValues(toInputValues(defaultTargetSettings));
    window.localStorage.removeItem(localStorageKey);
    setSource("default");
    setMessage("已恢复为系统默认目标值。");
  }

  return (
    <AppShell activeHref="/targets">
      <PageHeader
        eyebrow="基础设置"
        title="目标值设置"
        description="这里设置系统判断投放数据时使用的参考线。没有自定义时，系统会使用默认参考值。目标值不是行业绝对标准，只是用于统一你自己的判断口径。"
      />

      <div className="space-y-6">
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">当前数据来源：{sourceLabel(source)}</p>
          <p>{message}</p>
          <p>
            指标公式中心负责说明“怎么算”，目标值设置负责说明“怎么算低或高”，今日总建议会按这些判断线给规则型提醒。
          </p>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">系统判断线</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                目标值调得太紧，系统会更容易提示问题；调得太宽，系统可能漏掉问题。建议先按默认值跑一段时间，再小幅调整。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                type="button"
                onClick={handleRestoreDefaults}
              >
                恢复默认值
              </button>
              <button
                className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? "保存中..." : "保存目标值"}
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">指标名称</th>
                  <th className="px-4 py-3">当前值</th>
                  <th className="px-4 py-3">默认值</th>
                  <th className="px-4 py-3">单位</th>
                  <th className="px-4 py-3">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {targetSettingDefinitions.map((definition) => (
                  <tr key={definition.key}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{definition.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{definition.key}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
                        min="0"
                        step={definition.unit === "%" ? "0.1" : "1"}
                        type="number"
                        value={inputValues[definition.key]}
                        onChange={(event) => {
                          const value = event.target.value;
                          setInputValues((current) => ({ ...current, [definition.key]: value }));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatSettingValue(definition.defaultValue, definition.unit)}</td>
                    <td className="px-4 py-3 text-slate-700">{definition.unit}</td>
                    <td className="px-4 py-3 leading-6 text-slate-600">{definition.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading ? <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">正在加载目标值...</p> : null}
        </section>

        <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-950">使用边界</p>
          <p>这些目标值只影响规则型提醒的强弱，不会自动调预算、自动调价，也不会自动暂停广告。</p>
          <p>如果 Supabase 表还没创建，本页面会先保存到当前浏览器；换电脑或清缓存后，本机临时目标值可能会丢失。</p>
        </section>
      </div>
    </AppShell>
  );
}

function sourceLabel(source: SourceType) {
  if (source === "cloud") return "云端自定义目标值";
  if (source === "local") return "本机临时目标值";
  return "系统默认目标值";
}

function toInputValues(values: RecommendationThresholdSettings): Record<TargetSettingKey, string> {
  return Object.fromEntries(
    targetSettingDefinitions.map((definition) => [
      definition.key,
      String(definition.unit === "%" ? Number((values[definition.key] * 100).toFixed(4)) : values[definition.key]),
    ]),
  ) as Record<TargetSettingKey, string>;
}

function parseInputValues(values: Record<TargetSettingKey, string>): RecommendationThresholdSettings {
  return Object.fromEntries(
    targetSettingDefinitions.map((definition) => {
      const rawValue = Number(values[definition.key]);
      const safeValue = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : definition.defaultValue;
      return [definition.key, definition.unit === "%" ? safeValue / 100 : safeValue];
    }),
  ) as RecommendationThresholdSettings;
}

function settingsResponseToValues(settings: TargetSettingResponseItem[]): RecommendationThresholdSettings {
  const values = { ...defaultTargetSettings };
  settings.forEach((setting) => {
    values[setting.key] = setting.value;
  });
  return values;
}

function readLocalSettings(): RecommendationThresholdSettings | null {
  try {
    const rawValue = window.localStorage.getItem(localStorageKey);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue) as Partial<Record<TargetSettingKey, number>>;
    const values = { ...defaultTargetSettings };

    targetSettingDefinitions.forEach((definition) => {
      const value = parsed[definition.key];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        values[definition.key] = value;
      }
    });

    return values;
  } catch {
    return null;
  }
}

function writeLocalSettings(values: RecommendationThresholdSettings) {
  window.localStorage.setItem(localStorageKey, JSON.stringify(values));
}

function formatSettingValue(value: number, unit: string) {
  if (unit === "%") return `${(value * 100).toFixed(1)}%`;
  if (unit === "倍") return `1:${value}`;
  return `${value}${unit}`;
}
