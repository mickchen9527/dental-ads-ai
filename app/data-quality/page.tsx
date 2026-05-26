import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type UploadedFileRow = {
  id: string;
  platform: string | null;
  data_type: string | null;
  original_file_name: string | null;
  period_start: string | null;
  period_end: string | null;
  uploaded_at: string | null;
  row_count: number | null;
  parse_status: string | null;
  is_active: boolean | null;
  notes: string | null;
  storage_path: string | null;
};

type PlatformKey = "meituan" | "douyin" | "gdt" | "amap" | "ekanya" | "other";

type PlatformQuality = {
  key: PlatformKey;
  name: string;
  uploadCount: number;
  parsedCount: number;
  analyzableCount: number;
  latestUploadedAt: string | null;
  status: "正常" | "缺数据" | "解析异常" | "未上传";
  note: string;
};

type QualityIssue = {
  type: string;
  scope: string;
  message: string;
  action: string;
};

const platformNames: Record<PlatformKey, string> = {
  meituan: "美团",
  douyin: "抖音",
  gdt: "腾讯广点通",
  amap: "高德",
  ekanya: "e看牙",
  other: "其它平台",
};

const primaryPlatformKeys: PlatformKey[] = ["meituan", "douyin", "gdt", "amap", "ekanya"];

export default async function DataQualityPage() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return (
      <AppShell activeHref="/data-quality">
        <PageHeader
          eyebrow="真实上传记录校验"
          title="数据质量检测"
          description="这里读取 uploaded_files 的真实上传记录。当前 Supabase 服务端配置不完整，所以暂时不能检测真实数据。"
          action={<Help />}
        />
        <Notice tone="amber">
          当前无法连接 Supabase 服务端。请先检查环境变量配置，再回到本页查看真实数据质量。
        </Notice>
      </AppShell>
    );
  }

  const result = await supabase
    .from("uploaded_files")
    .select(
      "id, platform, data_type, original_file_name, period_start, period_end, uploaded_at, row_count, parse_status, is_active, notes, storage_path",
    )
    .order("uploaded_at", { ascending: false })
    .limit(500);

  if (result.error) {
    console.error("[data-quality] uploaded_files query failed", {
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return (
      <AppShell activeHref="/data-quality">
        <PageHeader
          eyebrow="真实上传记录校验"
          title="数据质量检测"
          description="这里读取 uploaded_files 的真实上传记录。当前读取失败，页面不会使用模拟数据冒充真实检测。"
          action={<Help />}
        />
        <Notice tone="amber">
          当前无法读取真实上传记录，请检查 Supabase 配置、uploaded_files 表权限和字段是否完整。
        </Notice>
      </AppShell>
    );
  }

  const records = (result.data ?? []) as UploadedFileRow[];
  const summary = buildQualitySummary(records);
  const platformRows = buildPlatformRows(records);
  const issues = buildIssues(records, platformRows);
  const analysisAvailability = buildAnalysisAvailability(records, platformRows);

  return (
    <AppShell activeHref="/data-quality">
      <PageHeader
        eyebrow="真实上传记录校验"
        title="数据质量检测"
        description="这里读取真实 uploaded_files 上传记录，只把启用且已解析的数据视为可分析数据。停用、未解析、解析失败的数据不会参与质量判断。"
        action={<Help />}
      />

      <section className="mb-6 rounded-md border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
        <p className="font-semibold">当前页面已改为真实数据口径。</p>
        <p>
          上传错的文件可以在数据上传页停用或删除。本页只统计启用中的上传记录，只有
          <strong> 已解析 </strong>
          的文件才算可参与分析。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="数据质量评分" value={`${summary.score}分`} helper={summary.scoreNote} tone={summary.score >= 75 ? "emerald" : summary.score >= 45 ? "amber" : "slate"} />
        <MetricCard label="上传文件总数" value={formatInteger(summary.totalCount)} helper="最近 500 条上传记录" />
        <MetricCard label="启用文件数" value={formatInteger(summary.activeCount)} helper="停用文件不参与分析" tone="cyan" />
        <MetricCard label="可参与分析文件数" value={formatInteger(summary.analyzableCount)} helper="启用且已解析的文件" tone="emerald" />
        <MetricCard label="停用文件数" value={formatInteger(summary.inactiveCount)} helper="已停用，不参与分析" />
        <MetricCard label="已解析文件数" value={formatInteger(summary.parsedCount)} helper="parse_status = parsed" tone="emerald" />
        <MetricCard label="未解析文件数" value={formatInteger(summary.savedCount)} helper="已保存但还没解析" tone={summary.savedCount > 0 ? "amber" : "slate"} />
        <MetricCard label="解析失败文件数" value={formatInteger(summary.failedCount)} helper="需要重新解析或检查表头" tone={summary.failedCount > 0 ? "amber" : "slate"} />
      </section>

      {summary.analyzableCount === 0 ? (
        <Notice tone="amber">
          当前没有任何启用且已解析的数据，今日建议、多平台看板和 ROI 分析都不能形成可靠判断。请先到数据上传页上传并解析文件。
        </Notice>
      ) : null}

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">平台覆盖情况</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              这里按平台统计真实上传记录。只有“启用 + 已解析”的文件才算可参与分析。
            </p>
          </div>
          <Link className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white" href="/upload">
            去数据上传页
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">平台</th>
                <th className="px-4 py-3">上传文件数</th>
                <th className="px-4 py-3">已解析文件数</th>
                <th className="px-4 py-3">可参与分析文件数</th>
                <th className="px-4 py-3">最近上传时间</th>
                <th className="px-4 py-3">当前状态</th>
                <th className="px-4 py-3">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {platformRows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.uploadCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.parsedCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.analyzableCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(row.latestUploadedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">数据质量问题列表</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            这里只展示真实检测出来的问题，不编造异常。
          </p>
          {issues.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">问题类型</th>
                    <th className="px-4 py-3">影响范围</th>
                    <th className="px-4 py-3">问题说明</th>
                    <th className="px-4 py-3">建议处理</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((issue) => (
                    <tr key={`${issue.type}-${issue.scope}-${issue.message}`}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{issue.type}</td>
                      <td className="px-4 py-3 text-slate-700">{issue.scope}</td>
                      <td className="px-4 py-3 text-slate-600">{issue.message}</td>
                      <td className="px-4 py-3 text-slate-600">{issue.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="当前没有发现明显数据质量问题。继续保持上传、解析和来源记录一致。" />
          )}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">分析可用性判断</h3>
          <div className="mt-4 space-y-3">
            {analysisAvailability.map((item) => (
              <article key={item.title} className="rounded-md bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-950">{item.title}</h4>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                    {item.available ? "可用" : "暂不完整"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">最近上传记录抽查</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          这里只展示最近 20 条，完整上传记录请到数据上传页管理。
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">文件名</th>
                <th className="px-4 py-3">平台</th>
                <th className="px-4 py-3">数据类型</th>
                <th className="px-4 py-3">数据周期</th>
                <th className="px-4 py-3">上传时间</th>
                <th className="px-4 py-3">解析状态</th>
                <th className="px-4 py-3">是否启用</th>
                <th className="px-4 py-3">行数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.slice(0, 20).map((record) => (
                <tr key={record.id} className={record.is_active === false ? "bg-slate-50 text-slate-400" : ""}>
                  <td className="max-w-[260px] truncate px-4 py-3 font-semibold text-slate-950">{record.original_file_name ?? "未命名文件"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.platform || "缺少平台"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.data_type || "缺少数据类型"}</td>
                  <td className="px-4 py-3 text-slate-700">{formatPeriod(record)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(record.uploaded_at)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatParseStatus(record.parse_status)}</td>
                  <td className="px-4 py-3 text-slate-700">{record.is_active === false ? "否，已停用" : "是"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.row_count == null ? "-" : formatInteger(record.row_count)}</td>
                </tr>
              ))}
              {records.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    还没有上传记录。请先到数据上传页上传文件。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function Help() {
  return (
    <PageHelpButton
      purpose="检查真实上传记录能不能用于分析，避免拿停用、未解析或解析失败的数据做判断。"
      when="每次上传或解析文件后、看今日建议和 ROI 前都要看。"
      focus={["启用文件数", "已解析文件数", "可参与分析文件数", "平台覆盖情况"]}
      next="有未解析或解析失败时，先回到数据上传页处理。"
      mistakes={["不要把停用文件算进分析。", "不要有上传记录就默认已经能分析。"]}
    />
  );
}

function buildQualitySummary(records: UploadedFileRow[]) {
  const activeRecords = records.filter((record) => record.is_active !== false);
  const inactiveRecords = records.filter((record) => record.is_active === false);
  const parsedRecords = records.filter((record) => record.parse_status === "parsed");
  const activeParsedRecords = activeRecords.filter((record) => record.parse_status === "parsed");
  const savedRecords = activeRecords.filter((record) => record.parse_status === "saved" || !record.parse_status);
  const failedRecords = activeRecords.filter((record) => record.parse_status === "failed");
  const missingPlatformCount = activeRecords.filter((record) => !record.platform).length;
  const missingDateCount = activeRecords.filter((record) => !record.period_start && !record.period_end).length;
  const missingStoragePathCount = activeRecords.filter((record) => !record.storage_path).length;
  const coveredPrimaryPlatforms = new Set(
    activeParsedRecords
      .map((record) => normalizePlatform(record.platform, record.data_type))
      .filter((platform) => primaryPlatformKeys.includes(platform)),
  ).size;

  let score = 20;
  score += Math.min(activeParsedRecords.length * 8, 35);
  score += coveredPrimaryPlatforms * 7;
  score -= failedRecords.length * 10;
  score -= savedRecords.length * 4;
  score -= (missingPlatformCount + missingDateCount + missingStoragePathCount) * 5;
  score = Math.max(0, Math.min(100, score));

  return {
    totalCount: records.length,
    activeCount: activeRecords.length,
    inactiveCount: inactiveRecords.length,
    parsedCount: parsedRecords.length,
    savedCount: savedRecords.length,
    failedCount: failedRecords.length,
    analyzableCount: activeParsedRecords.length,
    score,
    scoreNote: getScoreNote(score, activeParsedRecords.length),
  };
}

function buildPlatformRows(records: UploadedFileRow[]): PlatformQuality[] {
  const rows = new Map<PlatformKey, UploadedFileRow[]>();

  records.forEach((record) => {
    const platform = normalizePlatform(record.platform, record.data_type);
    rows.set(platform, [...(rows.get(platform) ?? []), record]);
  });

  return (["meituan", "douyin", "gdt", "amap", "ekanya", "other"] as PlatformKey[]).map((key) => {
    const platformRecords = rows.get(key) ?? [];
    const activeRecords = platformRecords.filter((record) => record.is_active !== false);
    const parsedRecords = activeRecords.filter((record) => record.parse_status === "parsed");
    const failedRecords = activeRecords.filter((record) => record.parse_status === "failed");
    const latestUploadedAt = platformRecords
      .map((record) => record.uploaded_at)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

    const status = getPlatformStatus(platformRecords.length, parsedRecords.length, failedRecords.length);

    return {
      key,
      name: platformNames[key],
      uploadCount: platformRecords.length,
      parsedCount: parsedRecords.length,
      analyzableCount: parsedRecords.length,
      latestUploadedAt,
      status,
      note: getPlatformNote(status, platformNames[key]),
    };
  });
}

function buildIssues(records: UploadedFileRow[], platformRows: PlatformQuality[]): QualityIssue[] {
  const activeRecords = records.filter((record) => record.is_active !== false);
  const inactiveCount = records.filter((record) => record.is_active === false).length;
  const savedCount = activeRecords.filter((record) => record.parse_status === "saved" || !record.parse_status).length;
  const failedCount = activeRecords.filter((record) => record.parse_status === "failed").length;
  const missingPlatformCount = activeRecords.filter((record) => !record.platform).length;
  const missingDateCount = activeRecords.filter((record) => !record.period_start && !record.period_end).length;
  const missingStoragePathCount = activeRecords.filter((record) => !record.storage_path).length;
  const stalePlatforms = platformRows.filter((row) => row.uploadCount > 0 && row.latestUploadedAt && isOlderThanDays(row.latestUploadedAt, 7));
  const missingPlatforms = platformRows.filter((row) => row.key !== "other" && row.uploadCount === 0);
  const uploadedButNotAnalyzable = platformRows.filter((row) => row.uploadCount > 0 && row.analyzableCount === 0);

  const issues: QualityIssue[] = [];

  if (savedCount > 0) {
    issues.push({
      type: "文件未解析",
      scope: `${savedCount} 个启用文件`,
      message: "有文件已经上传，但还没有点击解析，所以不能参与分析。",
      action: "到数据上传页点击解析。解析成功后本页会自动把它算入可分析数据。",
    });
  }

  if (failedCount > 0) {
    issues.push({
      type: "解析失败",
      scope: `${failedCount} 个启用文件`,
      message: "有文件解析失败，通常是表头不匹配、文件类型不对或字段缺失。",
      action: "先查看解析错误，再确认是不是上传到了正确的数据入口。",
    });
  }

  if (missingPlatformCount > 0) {
    issues.push({
      type: "缺少平台字段",
      scope: `${missingPlatformCount} 个启用文件`,
      message: "有上传记录缺少平台，后续看平台分析时可能归不到正确平台。",
      action: "建议重新上传到对应平台入口，或检查上传接口写入的平台字段。",
    });
  }

  if (missingDateCount > 0) {
    issues.push({
      type: "缺少数据周期",
      scope: `${missingDateCount} 个启用文件`,
      message: "有文件没有填写数据周期，按时间筛选时可能看不准。",
      action: "后续上传时补齐周期开始和结束日期。",
    });
  }

  if (missingStoragePathCount > 0) {
    issues.push({
      type: "缺少文件路径",
      scope: `${missingStoragePathCount} 个启用文件`,
      message: "有上传记录没有原文件路径，后续无法下载或重新解析原文件。",
      action: "如果是测试记录，建议删除后重新上传；如果是历史记录，先不要用于分析。",
    });
  }

  if (inactiveCount > 0) {
    issues.push({
      type: "存在停用文件",
      scope: `${inactiveCount} 个文件`,
      message: "这些文件已停用，所以不会参与分析。",
      action: "如果停用是误操作，可以到数据上传页重新启用。",
    });
  }

  stalePlatforms.forEach((platform) => {
    issues.push({
      type: "近期没有上传",
      scope: platform.name,
      message: `${platform.name} 最近一次上传已超过 7 天，当前分析可能不是最新情况。`,
      action: "如果近期仍在投放，建议上传最新数据后再看建议。",
    });
  });

  uploadedButNotAnalyzable.forEach((platform) => {
    issues.push({
      type: "有上传但不可分析",
      scope: platform.name,
      message: `${platform.name} 有上传记录，但没有启用且已解析的数据。`,
      action: "请确认文件是否已解析成功，或者是否被停用。",
    });
  });

  missingPlatforms.forEach((platform) => {
    issues.push({
      type: "平台未上传",
      scope: platform.name,
      message: `${platform.name} 当前没有上传记录。`,
      action: "如果这个平台近期没有投放，可以忽略；如果正在投放，请先上传数据。",
    });
  });

  return issues;
}

function buildAnalysisAvailability(records: UploadedFileRow[], platformRows: PlatformQuality[]) {
  const activeParsedRecords = records.filter((record) => record.is_active !== false && record.parse_status === "parsed");
  const hasMeituan = hasAnalyzablePlatform(platformRows, "meituan");
  const hasEkanya = hasAnalyzablePlatform(platformRows, "ekanya");
  const hasAnyAdPlatform = ["meituan", "douyin", "gdt", "amap"].some((key) => hasAnalyzablePlatform(platformRows, key as PlatformKey));
  const hasMultiPlatform = ["meituan", "douyin", "gdt", "amap"].filter((key) => hasAnalyzablePlatform(platformRows, key as PlatformKey)).length >= 2;

  return [
    {
      title: "当前哪些平台可以参与分析",
      available: activeParsedRecords.length > 0,
      message:
        activeParsedRecords.length > 0
          ? `当前可参与分析的平台：${platformRows.filter((row) => row.analyzableCount > 0).map((row) => row.name).join("、")}。`
          : "当前没有启用且已解析的数据，暂时没有平台可以参与分析。",
    },
    {
      title: "今日总建议",
      available: hasMeituan || hasEkanya,
      message:
        hasMeituan && hasEkanya
          ? "美团和 e看牙都有可分析数据，今日建议可以形成更完整的前端 + 后端判断。"
          : hasMeituan
            ? "已有美团可分析数据，但 e看牙回流不足，今日建议会偏前端。"
            : hasEkanya
              ? "已有 e看牙可分析数据，但缺少美团前端数据，今日建议会偏后端。"
              : "今日建议缺少美团和 e看牙可分析数据，建议先补上传和解析。",
    },
    {
      title: "多平台看板",
      available: hasAnyAdPlatform,
      message: hasAnyAdPlatform
        ? hasMultiPlatform
          ? "已有多个广告平台可分析数据，多平台看板可以做横向对比。"
          : "已有至少一个广告平台可分析数据，多平台看板可以看基础表现，但横向对比还不完整。"
        : "没有广告平台的可分析数据，多平台看板暂时没有可靠输入。",
    },
    {
      title: "ROI 分析",
      available: hasAnyAdPlatform && hasEkanya,
      message: hasAnyAdPlatform && hasEkanya
        ? "广告平台和 e看牙都有可分析数据，可以看初步闭环 ROI。"
        : "ROI 分析需要广告花费和 e看牙实收回流同时存在；当前数据还不完整。",
    },
  ];
}

function normalizePlatform(platform: string | null, dataType: string | null): PlatformKey {
  const text = `${platform ?? ""} ${dataType ?? ""}`.toLowerCase();

  if (text.includes("美团") || text.includes("meituan") || text.includes("点评") || text.includes("dianping")) {
    return "meituan";
  }
  if (text.includes("抖音") || text.includes("douyin") || text.includes("巨量")) {
    return "douyin";
  }
  if (text.includes("腾讯") || text.includes("广点通") || text.includes("gdt")) {
    return "gdt";
  }
  if (text.includes("高德") || text.includes("amap")) {
    return "amap";
  }
  if (text.includes("e看牙") || text.includes("ekanya")) {
    return "ekanya";
  }

  return "other";
}

function getPlatformStatus(uploadCount: number, parsedCount: number, failedCount: number): PlatformQuality["status"] {
  if (uploadCount === 0) return "未上传";
  if (failedCount > 0 && parsedCount === 0) return "解析异常";
  if (parsedCount === 0) return "缺数据";
  return "正常";
}

function getPlatformNote(status: PlatformQuality["status"], platformName: string) {
  if (status === "正常") return `${platformName} 有启用且已解析的数据，可以参与当前分析。`;
  if (status === "解析异常") return `${platformName} 有文件解析失败，需要先处理表头或文件类型。`;
  if (status === "缺数据") return `${platformName} 有上传记录，但还没有可参与分析的数据。`;
  return `${platformName} 当前没有上传记录。`;
}

function getScoreNote(score: number, analyzableCount: number) {
  if (analyzableCount === 0) return "没有可分析数据，建议先上传并解析";
  if (score >= 75) return "数据基本可用，仍需结合项目周期判断";
  if (score >= 45) return "部分数据可用，但建议先补齐问题项";
  return "数据不足，不建议做重大调整";
}

function hasAnalyzablePlatform(platformRows: PlatformQuality[], key: PlatformKey) {
  return (platformRows.find((row) => row.key === key)?.analyzableCount ?? 0) > 0;
}

function isOlderThanDays(dateValue: string, days: number) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs > days * 24 * 60 * 60 * 1000;
}

function StatusBadge({ status }: { status: PlatformQuality["status"] }) {
  const className =
    status === "正常"
      ? "bg-emerald-100 text-emerald-700"
      : status === "解析异常"
        ? "bg-rose-100 text-rose-700"
        : status === "缺数据"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-600";

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "amber" | "cyan" }) {
  const className =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-cyan-100 bg-cyan-50 text-cyan-950";

  return <section className={`mt-6 rounded-md border p-4 text-sm font-semibold leading-6 ${className}`}>{children}</section>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="mt-4 rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPeriod(record: UploadedFileRow) {
  if (record.period_start && record.period_end) return `${record.period_start} 至 ${record.period_end}`;
  if (record.period_start) return record.period_start;
  if (record.period_end) return record.period_end;
  return "缺少数据周期";
}

function formatParseStatus(value: string | null) {
  if (value === "parsed") return "已解析";
  if (value === "failed") return "解析失败";
  if (value === "saved") return "已保存，未解析";
  return "未解析";
}
