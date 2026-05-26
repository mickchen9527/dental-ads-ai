import { NextResponse } from "next/server";
import {
  buildRecommendationThresholds,
  defaultTargetSettings,
  isTargetSettingKey,
  targetSettingDefinitions,
  type TargetSettingKey,
} from "@/lib/recommendation-rules";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type TargetSettingRow = {
  key: string;
  label: string | null;
  value: number | string | null;
  unit: string | null;
  description: string | null;
  updated_at: string | null;
};

type TargetSettingInput = {
  key: string;
  value: number;
};

export async function GET() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({
      source: "default",
      message: "Supabase 服务端连接不可用，当前使用系统默认目标值。",
      settings: toResponseSettings(defaultTargetSettings, null),
    });
  }

  const result = await supabase
    .from("target_settings")
    .select("key, label, value, unit, description, updated_at")
    .in(
      "key",
      targetSettingDefinitions.map((definition) => definition.key),
    );

  if (result.error) {
    console.error("[api/targets] target_settings query failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({
      source: "default",
      message: "云端目标值表暂不可用，当前使用系统默认目标值。你仍然可以先在本机临时保存。",
      settings: toResponseSettings(defaultTargetSettings, null),
    });
  }

  const rows = (result.data ?? []) as TargetSettingRow[];
  const values = buildRecommendationThresholds(rowsToOverrides(rows));

  return NextResponse.json({
    source: rows.length > 0 ? "cloud" : "default",
    message: rows.length > 0 ? "当前使用云端自定义目标值。" : "还没有云端自定义目标值，当前使用系统默认目标值。",
    settings: toResponseSettings(values, rows),
  });
}

export async function POST(request: Request) {
  return saveTargetSettings(request);
}

export async function PATCH(request: Request) {
  return saveTargetSettings(request);
}

async function saveTargetSettings(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase 服务端连接不可用，已交给前端本机临时保存。" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const inputSettings = parseInputSettings(body);

  if (inputSettings.length === 0) {
    return NextResponse.json({ message: "没有收到可保存的目标值。" }, { status: 400 });
  }

  const definitionByKey = new Map(targetSettingDefinitions.map((definition) => [definition.key, definition]));
  const now = new Date().toISOString();
  const rows = inputSettings.map((setting) => {
    const definition = definitionByKey.get(setting.key);
    return {
      key: setting.key,
      label: definition?.label ?? setting.key,
      value: setting.value,
      unit: definition?.unit ?? "",
      description: definition?.description ?? "",
      updated_at: now,
    };
  });

  const result = await supabase
    .from("target_settings")
    .upsert(rows, { onConflict: "key" })
    .select("key, label, value, unit, description, updated_at");

  if (result.error) {
    console.error("[api/targets] target_settings upsert failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return NextResponse.json({ message: `保存云端目标值失败：${result.error.message}` }, { status: 500 });
  }

  const savedRows = (result.data ?? []) as TargetSettingRow[];
  const values = buildRecommendationThresholds(rowsToOverrides(savedRows));

  return NextResponse.json({
    source: "cloud",
    message: "目标值已保存到云端。",
    settings: toResponseSettings(values, savedRows),
  });
}

function parseInputSettings(body: unknown): Array<{ key: TargetSettingKey; value: number }> {
  if (!body || typeof body !== "object") return [];
  const maybeSettings = (body as { settings?: unknown }).settings;
  if (!Array.isArray(maybeSettings)) return [];

  return maybeSettings
    .map((item): TargetSettingInput | null => {
      if (!item || typeof item !== "object") return null;
      const key = (item as { key?: unknown }).key;
      const value = (item as { value?: unknown }).value;
      if (typeof key !== "string" || !isTargetSettingKey(key)) return null;
      const numberValue = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numberValue) || numberValue < 0) return null;
      return { key, value: numberValue };
    })
    .filter((item): item is { key: TargetSettingKey; value: number } => Boolean(item));
}

function rowsToOverrides(rows: TargetSettingRow[]) {
  const overrides: Partial<Record<TargetSettingKey, number>> = {};

  rows.forEach((row) => {
    if (!isTargetSettingKey(row.key)) return;
    const value = typeof row.value === "number" ? row.value : Number(row.value);
    if (Number.isFinite(value) && value >= 0) {
      overrides[row.key] = value;
    }
  });

  return overrides;
}

function toResponseSettings(values: Record<TargetSettingKey, number>, rows: TargetSettingRow[] | null) {
  const updatedAtByKey = new Map((rows ?? []).map((row) => [row.key, row.updated_at]));

  return targetSettingDefinitions.map((definition) => ({
    ...definition,
    value: values[definition.key],
    updatedAt: updatedAtByKey.get(definition.key) ?? null,
  }));
}
