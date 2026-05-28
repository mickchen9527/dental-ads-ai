import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
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
type DetailStatus = "正常" | "需补数据" | "有异常" | "暂不可分析";
type IssueSeverity = "严重" | "提醒";
type DetailRow = Record<string, unknown>;

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

type DetailTableSpec = {
  key: string;
  table: string;
  platform: PlatformKey;
  platformName: string;
  displayName: string;
  dataTypes: string[];
  select: string;
  requiredFields: string[];
};

type DetailTableResult = DetailTableSpec & {
  fileIds: string[];
  rows: DetailRow[];
  error: string | null;
};

type DetailPlatformQuality = {
  key: PlatformKey;
  name: string;
  analyzableFileCount: number;
  rowCount: number;
  keyCompleteness: number;
  issueCount: number;
  status: DetailStatus;
  note: string;
};

type QualityIssue = {
  type: "文件层问题" | "字段完整性问题" | "指标异常问题" | "分析可用性问题";
  severity: IssueSeverity;
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

const detailTableSpecs: DetailTableSpec[] = [
  {
    key: "meituanSummary",
    table: "meituan_summary_rows",
    platform: "meituan",
    platformName: "美团",
    displayName: "美团推广汇总",
    dataTypes: ["美团推广汇总数据", "meituan-summary"],
    select:
      "uploaded_file_id, spend, impressions, clicks, avg_click_cost, merchant_views, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d",
    requiredFields: ["spend", "impressions", "clicks", "merchant_views", "phone_views", "online_consult_clicks", "orders"],
  },
  {
    key: "meituanKeywords",
    table: "meituan_keyword_rows",
    platform: "meituan",
    platformName: "美团",
    displayName: "美团关键词",
    dataTypes: ["美团关键词数据", "meituan-keywords"],
    select:
      "uploaded_file_id, keyword, spend, impressions, clicks, avg_click_cost, merchant_views, phone_views, online_consult_clicks, orders, group_buy_orders, group_buy_orders_15d, bid_price, match_type, keyword_status",
    requiredFields: ["keyword", "spend", "impressions", "clicks"],
  },
  {
    key: "douyinPlan",
    table: "douyin_plan_summary_rows",
    platform: "douyin",
    platformName: "抖音",
    displayName: "抖音计划汇总",
    dataTypes: ["抖音计划汇总数据", "抖音广告计划汇总数据", "douyin-plan-summary", "douyin-ad-plan-summary"],
    select:
      "uploaded_file_id, spend, impressions, clicks, click_rate, avg_click_cost, conversions, conversion_cost, form_count, private_message_count, phone_count",
    requiredFields: ["spend", "impressions", "clicks"],
  },
  {
    key: "douyinCreatives",
    table: "douyin_creative_rows",
    platform: "douyin",
    platformName: "抖音",
    displayName: "抖音素材/创意",
    dataTypes: ["抖音素材/创意数据", "抖音素材 / 创意数据", "douyin-creatives"],
    select:
      "uploaded_file_id, creative_name, material_name, video_name, spend, impressions, clicks, play_count, complete_play_rate, conversions, form_count, private_message_count, phone_count",
    requiredFields: ["creative_name", "material_name", "video_name", "spend", "impressions", "clicks"],
  },
  {
    key: "douyinLeads",
    table: "douyin_lead_rows",
    platform: "douyin",
    platformName: "抖音",
    displayName: "抖音线索",
    dataTypes: ["抖音表单/私信线索数据", "抖音表单 / 私信线索数据", "douyin-leads"],
    select:
      "uploaded_file_id, lead_type, customer_name, phone_tail, intention_project, message_content, appointment_status, visit_status, deal_status",
    requiredFields: ["lead_type", "intention_project"],
  },
  {
    key: "gdtPlan",
    table: "gdt_plan_summary_rows",
    platform: "gdt",
    platformName: "腾讯广点通",
    displayName: "腾讯计划汇总",
    dataTypes: [
      "腾讯广点通计划汇总数据",
      "腾讯计划汇总数据",
      "广点通计划汇总数据",
      "腾讯账户/计划汇总数据",
      "腾讯广告计划汇总数据",
      "腾讯信息流计划汇总数据",
      "腾讯广点通账户/计划汇总数据",
      "广点通账户/计划汇总数据",
      "gdt-plan-summary",
    ],
    select:
      "uploaded_file_id, spend, impressions, clicks, click_rate, avg_click_cost, conversions, conversion_cost, form_count, phone_count, consult_count",
    requiredFields: ["spend", "impressions", "clicks"],
  },
  {
    key: "gdtCreatives",
    table: "gdt_creative_rows",
    platform: "gdt",
    platformName: "腾讯广点通",
    displayName: "腾讯广告组/创意",
    dataTypes: ["腾讯广告组/创意数据", "腾讯广告组 / 创意数据", "腾讯广告组数据", "腾讯创意数据", "广点通广告组/创意数据", "gdt-creatives"],
    select:
      "uploaded_file_id, ad_group_name, creative_name, material_name, spend, impressions, clicks, click_rate, avg_click_cost, conversions, conversion_cost, form_count, phone_count, consult_count",
    requiredFields: ["ad_group_name", "creative_name", "material_name", "spend", "impressions", "clicks"],
  },
  {
    key: "gdtLeads",
    table: "gdt_lead_rows",
    platform: "gdt",
    platformName: "腾讯广点通",
    displayName: "腾讯线索",
    dataTypes: ["腾讯表单/电话线索数据", "腾讯表单 / 电话线索数据", "腾讯线索数据", "广点通线索数据", "腾讯表单线索数据", "腾讯电话线索数据", "gdt-leads"],
    select:
      "uploaded_file_id, lead_type, customer_name, phone_tail, intention_project, consult_content, appointment_status, visit_status, deal_status",
    requiredFields: ["lead_type", "intention_project"],
  },
  {
    key: "amapSummary",
    table: "amap_summary_rows",
    platform: "amap",
    platformName: "高德",
    displayName: "高德推广汇总",
    dataTypes: ["高德推广汇总数据", "高德广告汇总数据", "高德投放汇总数据", "amap-summary"],
    select:
      "uploaded_file_id, spend, impressions, clicks, click_rate, avg_click_cost, phone_clicks, navigation_clicks, store_view_count, address_clicks, coupon_clicks, lead_count",
    requiredFields: ["spend", "impressions", "clicks", "phone_clicks", "navigation_clicks", "store_view_count"],
  },
  {
    key: "amapActions",
    table: "amap_action_rows",
    platform: "amap",
    platformName: "高德",
    displayName: "高德行为",
    dataTypes: ["高德电话/导航/门店访问数据", "高德电话 / 导航 / 门店访问数据", "高德行为明细数据", "高德门店访问数据", "高德电话导航数据", "amap-actions"],
    select:
      "uploaded_file_id, action_type, phone_clicks, navigation_clicks, address_clicks, store_view_count, coupon_clicks",
    requiredFields: ["action_type"],
  },
  {
    key: "amapLeads",
    table: "amap_lead_rows",
    platform: "amap",
    platformName: "高德",
    displayName: "高德线索",
    dataTypes: ["高德线索数据", "高德留资数据", "高德咨询线索数据", "高德客户线索数据", "amap-leads"],
    select:
      "uploaded_file_id, lead_type, customer_name, phone_tail, intention_project, consult_content, appointment_status, visit_status, deal_status",
    requiredFields: ["lead_type", "intention_project"],
  },
  {
    key: "ekanyaBackflow",
    table: "ekanya_backflow_rows",
    platform: "ekanya",
    platformName: "e看牙",
    displayName: "e看牙后端回流",
    dataTypes: ["e看牙后端回流数据", "ekanya-backflow"],
    select:
      "uploaded_file_id, source_platform, intention_project, visit_project, deal_project, appointment_status, visit_status, deal_status, paid_amount",
    requiredFields: ["source_platform", "deal_project", "paid_amount"],
  },
];

export default async function DataQualityPage() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return (
      <AppShell activeHref="/data-quality">
        <PageHeader
          eyebrow="真实上传记录校验"
          title="数据质量检测"
          description="这里读取 uploaded_files 和各平台解析明细表。当前 Supabase 服务端配置不完整，所以暂时不能检测真实数据。"
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
  const activeParsedRecords = records.filter((record) => record.is_active !== false && record.parse_status === "parsed");
  const detailTables = await fetchDetailTables(supabase, activeParsedRecords);
  const fileSummary = buildFileQualitySummary(records);
  const platformRows = buildPlatformRows(records);
  const detailRows = buildDetailPlatformRows(detailTables);
  const fileIssues = buildFileIssues(records, platformRows);
  const detailIssues = buildDetailIssues(detailTables);
  const issues = [...fileIssues, ...detailIssues];
  const detailSummary = buildDetailSummary(detailRows, detailTables, detailIssues);
  const totalScore = fileSummary.fileScore + detailSummary.detailScore;
  const analysisAvailability = buildAnalysisAvailability(records, platformRows, detailRows, issues);

  return (
    <AppShell activeHref="/data-quality">
      <PageHeader
        eyebrow="真实数据质量检测"
        title="数据质量检测"
        description="这里读取真实 uploaded_files 上传记录和各平台解析明细表。停用、未解析、解析失败的数据不会进入明细质量检查。"
        action={<Help />}
      />

      <section className="mb-6 rounded-md border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
        <p className="font-semibold">当前页面会同时检查文件层和明细层。</p>
        <p>
          文件层看上传记录是否启用、已解析、字段完整；明细层看解析后的花费、曝光、点击、线索、来源平台、项目和实收等字段是否能用于分析。
        </p>
        <p className="mt-2">
          数据质量检测是辅助判断，不代表投放一定好坏。e看牙回流不是手机号或订单级精准归因；抖音、腾讯、高德如果缺后端回流，只能先判断前端流量质量。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="总质量评分" value={`${totalScore}分`} helper={scoreLevel(totalScore)} tone={totalScore >= 80 ? "emerald" : totalScore >= 50 ? "amber" : "slate"} />
        <MetricCard label="文件层评分" value={`${fileSummary.fileScore}/50`} helper="上传记录、解析状态、停用状态" tone={fileSummary.fileScore >= 38 ? "emerald" : fileSummary.fileScore >= 23 ? "amber" : "slate"} />
        <MetricCard label="明细层评分" value={`${detailSummary.detailScore}/50`} helper="解析表行数、字段完整、异常指标" tone={detailSummary.detailScore >= 38 ? "emerald" : detailSummary.detailScore >= 23 ? "amber" : "slate"} />
        <MetricCard label="可参与分析平台数" value={formatInteger(detailSummary.analyzablePlatformCount)} helper="有启用解析文件且有明细行" tone="cyan" />
        <MetricCard label="存在问题数量" value={formatInteger(issues.length)} helper="真实检测出来的问题" tone={issues.length > 0 ? "amber" : "emerald"} />
        <MetricCard label="严重问题数量" value={formatInteger(issues.filter((issue) => issue.severity === "严重").length)} helper="会明显影响判断的问题" tone={issues.some((issue) => issue.severity === "严重") ? "amber" : "emerald"} />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="上传文件总数" value={formatInteger(fileSummary.totalCount)} helper="最近 500 条上传记录" />
        <MetricCard label="启用文件数" value={formatInteger(fileSummary.activeCount)} helper="停用文件不参与分析" tone="cyan" />
        <MetricCard label="可参与分析文件数" value={formatInteger(fileSummary.analyzableCount)} helper="启用且已解析的文件" tone="emerald" />
        <MetricCard label="明细总行数" value={formatInteger(detailSummary.totalRows)} helper="来自各平台解析明细表" tone="cyan" />
      </section>

      {fileSummary.analyzableCount === 0 ? (
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

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">明细表质量检测</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          这里只检查启用且已解析文件对应的明细行。停用、未解析、解析失败文件不会进入这里。
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">平台</th>
                <th className="px-4 py-3">可分析文件数</th>
                <th className="px-4 py-3">明细行数</th>
                <th className="px-4 py-3">关键字段完整率</th>
                <th className="px-4 py-3">异常问题数</th>
                <th className="px-4 py-3">当前判断</th>
                <th className="px-4 py-3">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailRows.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.analyzableFileCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.rowCount)}</td>
                  <td className="px-4 py-3 text-slate-700">{row.rowCount > 0 ? `${row.keyCompleteness}%` : "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(row.issueCount)}</td>
                  <td className="px-4 py-3">
                    <DetailStatusBadge status={row.status} />
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
            <div className="mt-4 max-h-[560px] overflow-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-100 text-left text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">严重度</th>
                    <th className="px-4 py-3">问题类型</th>
                    <th className="px-4 py-3">影响范围</th>
                    <th className="px-4 py-3">问题说明</th>
                    <th className="px-4 py-3">建议处理</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((issue) => (
                    <tr key={`${issue.type}-${issue.scope}-${issue.message}`}>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={issue.severity} />
                      </td>
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

async function fetchDetailTables(supabase: SupabaseClient, activeParsedRecords: UploadedFileRow[]) {
  const results = await Promise.all(
    detailTableSpecs.map(async (spec): Promise<DetailTableResult> => {
      const fileIds = activeParsedRecords
        .filter((record) => spec.dataTypes.includes(record.data_type ?? ""))
        .map((record) => record.id);

      if (fileIds.length === 0) {
        return { ...spec, fileIds, rows: [], error: null };
      }

      const result = await supabase.from(spec.table).select(spec.select).in("uploaded_file_id", fileIds).limit(5000);

      if (result.error) {
        console.error("[data-quality] detail table query failed", {
          table: spec.table,
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
        });

        return { ...spec, fileIds, rows: [], error: result.error.message };
      }

      return { ...spec, fileIds, rows: (result.data ?? []) as unknown as DetailRow[], error: null };
    }),
  );

  return results;
}

function Help() {
  return (
    <PageHelpButton
      purpose="检查真实上传记录和解析明细能不能用于分析，避免拿停用、未解析或字段缺失的数据做判断。"
      when="每次上传或解析文件后、看今日建议和 ROI 前都要看。"
      focus={["文件层评分", "明细层评分", "平台质量", "字段完整率", "异常问题"]}
      next="有未解析、解析失败或字段缺失时，先回到数据上传页处理。"
      mistakes={["不要把停用文件算进分析。", "不要有上传记录就默认已经能分析。", "不要缺字段时计算假 ROI。"]}
    />
  );
}

function buildFileQualitySummary(records: UploadedFileRow[]) {
  const activeRecords = records.filter((record) => record.is_active !== false);
  const inactiveRecords = records.filter((record) => record.is_active === false);
  const parsedRecords = records.filter((record) => record.parse_status === "parsed");
  const activeParsedRecords = activeRecords.filter((record) => record.parse_status === "parsed");
  const savedRecords = activeRecords.filter((record) => record.parse_status === "saved" || !record.parse_status);
  const failedRecords = activeRecords.filter((record) => record.parse_status === "failed");
  const missingPlatformCount = activeRecords.filter((record) => !record.platform).length;
  const missingDateCount = activeRecords.filter(isMissingUploadedPeriod).length;
  const missingStoragePathCount = activeRecords.filter((record) => !record.storage_path).length;
  const coveredPrimaryPlatforms = new Set(
    activeParsedRecords
      .map((record) => normalizePlatform(record.platform, record.data_type))
      .filter((platform) => primaryPlatformKeys.includes(platform)),
  ).size;

  let rawScore = 20;
  rawScore += Math.min(activeParsedRecords.length * 8, 35);
  rawScore += coveredPrimaryPlatforms * 7;
  rawScore -= failedRecords.length * 10;
  rawScore -= savedRecords.length * 4;
  rawScore -= (missingPlatformCount + missingDateCount + missingStoragePathCount) * 5;
  rawScore = Math.max(0, Math.min(100, rawScore));

  return {
    totalCount: records.length,
    activeCount: activeRecords.length,
    inactiveCount: inactiveRecords.length,
    parsedCount: parsedRecords.length,
    savedCount: savedRecords.length,
    failedCount: failedRecords.length,
    analyzableCount: activeParsedRecords.length,
    fileScore: Math.round(rawScore / 2),
  };
}

function buildDetailSummary(detailRows: DetailPlatformQuality[], detailTables: DetailTableResult[], detailIssues: QualityIssue[]) {
  const totalRows = detailTables.reduce((total, table) => total + table.rows.length, 0);
  const analyzablePlatformCount = detailRows.filter((row) => row.rowCount > 0).length;
  const averageCompleteness =
    detailRows.filter((row) => row.rowCount > 0).reduce((total, row) => total + row.keyCompleteness, 0) /
    Math.max(1, detailRows.filter((row) => row.rowCount > 0).length);

  let detailScore = totalRows > 0 ? 15 : 0;
  detailScore += Math.min(analyzablePlatformCount * 5, 20);
  detailScore += Math.round(Math.min(averageCompleteness, 100) * 0.15);
  detailScore -= detailIssues.filter((issue) => issue.severity === "严重").length * 6;
  detailScore -= detailIssues.filter((issue) => issue.severity === "提醒").length * 2;
  detailScore = Math.max(0, Math.min(50, detailScore));

  return {
    totalRows,
    analyzablePlatformCount,
    detailScore,
  };
}

function isMissingUploadedPeriod(record: UploadedFileRow) {
  if (record.period_start || record.period_end) return false;
  if (record.parse_status === "parsed" && canInferPeriodFromParsedData(record)) return false;
  return true;
}

function canInferPeriodFromParsedData(record: UploadedFileRow) {
  const text = `${record.platform ?? ""} ${record.data_type ?? ""}`.toLowerCase();
  return (
    text.includes("美团推广汇总") ||
    text.includes("meituan-summary") ||
    text.includes("e看牙后端回流") ||
    text.includes("ekanya-backflow")
  );
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
    const latestUploadedAt =
      platformRecords
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

function buildDetailPlatformRows(detailTables: DetailTableResult[]): DetailPlatformQuality[] {
  return (["meituan", "douyin", "gdt", "amap", "ekanya"] as PlatformKey[]).map((key) => {
    const tables = detailTables.filter((table) => table.platform === key);
    const analyzableFileCount = new Set(tables.flatMap((table) => table.fileIds)).size;
    const rowCount = tables.reduce((total, table) => total + table.rows.length, 0);
    const issueCount = buildDetailIssues(tables).length;
    const keyCompleteness = calculatePlatformCompleteness(tables);
    const status = getDetailStatus(analyzableFileCount, rowCount, issueCount, keyCompleteness, tables.some((table) => table.error));

    return {
      key,
      name: platformNames[key],
      analyzableFileCount,
      rowCount,
      keyCompleteness,
      issueCount,
      status,
      note: getDetailStatusNote(platformNames[key], status),
    };
  });
}

function buildFileIssues(records: UploadedFileRow[], platformRows: PlatformQuality[]): QualityIssue[] {
  const activeRecords = records.filter((record) => record.is_active !== false);
  const inactiveCount = records.filter((record) => record.is_active === false).length;
  const savedCount = activeRecords.filter((record) => record.parse_status === "saved" || !record.parse_status).length;
  const failedCount = activeRecords.filter((record) => record.parse_status === "failed").length;
  const missingPlatformCount = activeRecords.filter((record) => !record.platform).length;
  const missingDateCount = activeRecords.filter(isMissingUploadedPeriod).length;
  const missingStoragePathCount = activeRecords.filter((record) => !record.storage_path).length;
  const stalePlatforms = platformRows.filter((row) => row.uploadCount > 0 && row.latestUploadedAt && isOlderThanDays(row.latestUploadedAt, 7));
  const uploadedButNotAnalyzable = platformRows.filter((row) => row.uploadCount > 0 && row.analyzableCount === 0);

  const issues: QualityIssue[] = [];

  if (savedCount > 0) {
    issues.push({
      type: "文件层问题",
      severity: "提醒",
      scope: `${savedCount} 个启用文件`,
      message: "有文件已经上传，但还没有点击解析，所以不能参与分析。",
      action: "到数据上传页点击解析。解析成功后本页会自动把它算入可分析数据。",
    });
  }

  if (failedCount > 0) {
    issues.push({
      type: "文件层问题",
      severity: "严重",
      scope: `${failedCount} 个启用文件`,
      message: "有文件解析失败，通常是表头不匹配、文件类型不对或字段缺失。",
      action: "先查看解析错误，再确认是不是上传到了正确的数据入口。",
    });
  }

  if (missingPlatformCount > 0) {
    issues.push({
      type: "文件层问题",
      severity: "严重",
      scope: `${missingPlatformCount} 个启用文件`,
      message: "有上传记录缺少平台，后续看平台分析时可能归不到正确平台。",
      action: "建议重新上传到对应平台入口，或检查上传接口写入的平台字段。",
    });
  }

  if (missingDateCount > 0) {
    issues.push({
      type: "文件层问题",
      severity: "提醒",
      scope: `${missingDateCount} 个启用文件`,
      message: "有文件没有填写数据周期，按时间筛选时可能看不准。",
      action: "后续上传时补齐周期开始和结束日期。",
    });
  }

  if (missingStoragePathCount > 0) {
    issues.push({
      type: "文件层问题",
      severity: "严重",
      scope: `${missingStoragePathCount} 个启用文件`,
      message: "有上传记录没有原文件路径，后续无法下载或重新解析原文件。",
      action: "如果是测试记录，建议删除后重新上传；如果是历史记录，先不要用于分析。",
    });
  }

  if (inactiveCount > 0) {
    issues.push({
      type: "文件层问题",
      severity: "提醒",
      scope: `${inactiveCount} 个文件`,
      message: "这些文件已停用，所以不会参与分析。",
      action: "如果停用是误操作，可以到数据上传页重新启用。",
    });
  }

  stalePlatforms.forEach((platform) => {
    issues.push({
      type: "分析可用性问题",
      severity: "提醒",
      scope: platform.name,
      message: `${platform.name} 最近一次上传已超过 7 天，当前分析可能不是最新情况。`,
      action: "如果近期仍在投放，建议上传最新数据后再看建议。",
    });
  });

  uploadedButNotAnalyzable.forEach((platform) => {
    issues.push({
      type: "分析可用性问题",
      severity: "严重",
      scope: platform.name,
      message: `${platform.name} 有上传记录，但没有启用且已解析的数据。`,
      action: "请确认文件是否已解析成功，或者是否被停用。",
    });
  });

  return issues;
}

function buildDetailIssues(detailTables: DetailTableResult[]): QualityIssue[] {
  const issues: QualityIssue[] = [];

  detailTables.forEach((table) => {
    if (table.error) {
      issues.push({
        type: "分析可用性问题",
        severity: "严重",
        scope: table.displayName,
        message: `${table.displayName} 明细表读取失败：${table.error}`,
        action: "请检查该解析表是否存在、字段是否完整、Supabase 权限是否正确。",
      });
      return;
    }

    if (table.fileIds.length > 0 && table.rows.length === 0) {
      issues.push({
        type: "分析可用性问题",
        severity: "严重",
        scope: table.displayName,
        message: `${table.displayName} 有启用且已解析的上传文件，但明细表没有对应行。`,
        action: "建议重新解析该文件，确认解析 API 是否写入了 uploaded_file_id。",
      });
    }

    const missingRequired = countMissingRequiredCells(table);
    if (table.rows.length > 0 && missingRequired.missing > 0) {
      const rate = Math.round((missingRequired.missing / Math.max(1, missingRequired.total)) * 100);
      issues.push({
        type: "字段完整性问题",
        severity: rate >= 30 ? "严重" : "提醒",
        scope: table.displayName,
        message: `${table.displayName} 有 ${rate}% 的关键字段为空，会影响对应指标判断。`,
        action: "请检查原始表字段是否齐全，必要时重新导出并上传。",
      });
    }
  });

  addMeituanIssues(issues, detailTables);
  addDouyinIssues(issues, detailTables);
  addGdtIssues(issues, detailTables);
  addAmapIssues(issues, detailTables);
  addEkanyaIssues(issues, detailTables);

  return issues;
}

function addMeituanIssues(issues: QualityIssue[], detailTables: DetailTableResult[]) {
  const summaryRows = getRows(detailTables, "meituanSummary");
  const keywordRows = getRows(detailTables, "meituanKeywords");

  const spendNoTraffic = summaryRows.filter((row) => numberValue(row.spend) > 0 && numberValue(row.impressions) <= 0 && numberValue(row.clicks) <= 0).length;
  if (spendNoTraffic > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope: "美团推广汇总",
      message: `美团有 ${spendNoTraffic} 行花费大于 0，但曝光和点击都是 0。`,
      action: "请检查是否导错报表，或平台字段是否没有正确导出。",
    });
  }

  const clicksNoViews = summaryRows.filter((row) => numberValue(row.clicks) > 0 && numberValue(row.merchant_views) <= 0).length;
  if (clicksNoViews > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "提醒",
      scope: "美团推广汇总",
      message: `美团有 ${clicksNoViews} 行点击大于 0，但商户浏览量为空或为 0，会影响页面承接判断。`,
      action: "建议检查商户浏览量字段是否在报表里，或者重新导出完整报表。",
    });
  }

  const impossibleCtr = [...summaryRows, ...keywordRows].filter((row) => numberValue(row.impressions) > 0 && numberValue(row.clicks) / numberValue(row.impressions) > 1).length;
  if (impossibleCtr > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope: "美团",
      message: `美团有 ${impossibleCtr} 行点击率超过 100%，CTR 和 CPC 判断会失真。`,
      action: "请检查曝光和点击字段是否错列，或是否混入了其它表。",
    });
  }

  const emptyKeywords = keywordRows.filter((row) => isMissing(row.keyword)).length;
  if (emptyKeywords > 0) {
    issues.push({
      type: "字段完整性问题",
      severity: "严重",
      scope: "美团关键词",
      message: `美团关键词表有 ${emptyKeywords} 行关键词为空，无法判断具体哪些词需要处理。`,
      action: "请确认上传的是关键词报表，不是推广汇总报表。",
    });
  }
}

function addDouyinIssues(issues: QualityIssue[], detailTables: DetailTableResult[]) {
  const planRows = getRows(detailTables, "douyinPlan");
  const creativeRows = getRows(detailTables, "douyinCreatives");
  const leadRows = getRows(detailTables, "douyinLeads");

  addAdPlatformIssues(issues, "抖音计划汇总", planRows, ["conversions", "form_count", "private_message_count", "phone_count"]);
  addAdPlatformIssues(issues, "抖音素材/创意", creativeRows, ["conversions", "form_count", "private_message_count", "phone_count"]);

  const unnamedCreative = creativeRows.filter((row) => isMissing(row.creative_name) && isMissing(row.material_name) && isMissing(row.video_name)).length;
  if (unnamedCreative > 0) {
    issues.push({
      type: "字段完整性问题",
      severity: "严重",
      scope: "抖音素材/创意",
      message: `抖音素材/创意表有 ${unnamedCreative} 行缺少创意、素材或视频名称。`,
      action: "请重新导出素材/创意报表，确保能定位到具体视频或创意。",
    });
  }

  if ((planRows.length > 0 || creativeRows.length > 0) && leadRows.length === 0) {
    issues.push({
      type: "分析可用性问题",
      severity: "提醒",
      scope: "抖音",
      message: "抖音已有前端投放数据，但还没有线索明细数据，只能判断前端流量质量。",
      action: "如果能导出表单/私信线索，建议补传；否则不要把前端点击当作真实成交。",
    });
  }
}

function addGdtIssues(issues: QualityIssue[], detailTables: DetailTableResult[]) {
  const planRows = getRows(detailTables, "gdtPlan");
  const creativeRows = getRows(detailTables, "gdtCreatives");
  const leadRows = getRows(detailTables, "gdtLeads");

  addAdPlatformIssues(issues, "腾讯计划汇总", planRows, ["conversions", "form_count", "phone_count", "consult_count"]);
  addAdPlatformIssues(issues, "腾讯广告组/创意", creativeRows, ["conversions", "form_count", "phone_count", "consult_count"]);

  const unnamedCreative = creativeRows.filter((row) => isMissing(row.ad_group_name) && isMissing(row.creative_name) && isMissing(row.material_name)).length;
  if (unnamedCreative > 0) {
    issues.push({
      type: "字段完整性问题",
      severity: "严重",
      scope: "腾讯广告组/创意",
      message: `腾讯广告组/创意表有 ${unnamedCreative} 行缺少广告组、创意或素材名称。`,
      action: "请确认上传的是广告组/创意报表，不是计划汇总表。",
    });
  }

  if ((planRows.length > 0 || creativeRows.length > 0) && leadRows.length === 0) {
    issues.push({
      type: "分析可用性问题",
      severity: "提醒",
      scope: "腾讯广点通",
      message: "腾讯已有前端投放数据，但还没有表单/电话线索明细，只能判断前端流量质量。",
      action: "如果能导出腾讯线索明细，建议补传；否则不要直接判断后端转化。",
    });
  }
}

function addAmapIssues(issues: QualityIssue[], detailTables: DetailTableResult[]) {
  const summaryRows = getRows(detailTables, "amapSummary");
  const actionRows = getRows(detailTables, "amapActions");
  const leadRows = getRows(detailTables, "amapLeads");
  const localActionFields = ["phone_clicks", "navigation_clicks", "store_view_count", "address_clicks", "coupon_clicks"];
  const noLocalActions = [...summaryRows, ...actionRows].filter((row) => sumFields(row, localActionFields) <= 0).length;

  if (summaryRows.length > 0 && noLocalActions === summaryRows.length + actionRows.length) {
    issues.push({
      type: "分析可用性问题",
      severity: "提醒",
      scope: "高德",
      message: "高德有推广数据，但电话、导航、地址查看或门店访问等到店动作都为空。",
      action: "请确认是否上传了高德电话/导航/门店访问数据。高德重点看本地到店动作。",
    });
  }

  addAdPlatformIssues(issues, "高德推广汇总", summaryRows, localActionFields);

  if ((summaryRows.length > 0 || actionRows.length > 0) && leadRows.length === 0) {
    issues.push({
      type: "分析可用性问题",
      severity: "提醒",
      scope: "高德",
      message: "高德已有前端或行为数据，但还没有线索数据，只能看电话、导航、门店访问等动作。",
      action: "如果高德能导出线索，请补传；如果不能导出，需要靠 e看牙记录来源为高德。",
    });
  }
}

function addEkanyaIssues(issues: QualityIssue[], detailTables: DetailTableResult[]) {
  const rows = getRows(detailTables, "ekanyaBackflow");
  if (rows.length === 0) return;

  const missingSource = rows.filter((row) => isMissing(row.source_platform)).length;
  const missingProject = rows.filter((row) => isMissing(row.deal_project) && isMissing(row.visit_project) && isMissing(row.intention_project)).length;
  const dealNoPaid = rows.filter((row) => isPositiveStatus(row.deal_status) && numberValue(row.paid_amount) <= 0).length;
  const paidNoSource = rows.filter((row) => numberValue(row.paid_amount) > 0 && isMissing(row.source_platform)).length;
  const negativePaid = rows.filter((row) => numberValue(row.paid_amount) < 0).length;

  if (missingSource > 0) {
    issues.push({
      type: "字段完整性问题",
      severity: "严重",
      scope: "e看牙后端回流",
      message: `e看牙有 ${missingSource} 行缺少来源平台，闭环 ROI 只能做参考，不能当作精准归因。`,
      action: "请前台和客服统一记录来源平台，尤其是美团、抖音、腾讯、高德。",
    });
  }

  if (missingProject > 0) {
    issues.push({
      type: "字段完整性问题",
      severity: "严重",
      scope: "e看牙后端回流",
      message: `e看牙有 ${missingProject} 行缺少项目名称，项目分析会不稳定。`,
      action: "请补齐意向项目、到院项目或成交项目，至少保留一个项目字段。",
    });
  }

  if (dealNoPaid > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope: "e看牙后端回流",
      message: `e看牙有 ${dealNoPaid} 行显示已成交，但实收金额为空或为 0。`,
      action: "请检查收费明细是否漏传，缺实收时不要计算 ROI。",
    });
  }

  if (paidNoSource > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope: "e看牙后端回流",
      message: `e看牙有 ${paidNoSource} 行有实收金额，但缺少来源平台。`,
      action: "这些记录会影响多平台闭环分配，建议补齐来源平台。",
    });
  }

  if (negativePaid > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope: "e看牙后端回流",
      message: `e看牙有 ${negativePaid} 行实收金额为负数。`,
      action: "请确认是否退款、冲销或字段导错，避免 ROI 计算失真。",
    });
  }
}

function addAdPlatformIssues(issues: QualityIssue[], scope: string, rows: DetailRow[], actionFields: string[]) {
  const spendNoTraffic = rows.filter((row) => numberValue(row.spend) > 0 && numberValue(row.impressions) <= 0 && numberValue(row.clicks) <= 0).length;
  const clickRateOver100 = rows.filter((row) => numberValue(row.impressions) > 0 && numberValue(row.clicks) / numberValue(row.impressions) > 1).length;
  const spendNoAction = rows.filter((row) => numberValue(row.spend) > 0 && sumFields(row, actionFields) <= 0).length;
  const clickNoAction = rows.filter((row) => numberValue(row.clicks) > 0 && sumFields(row, actionFields) <= 0).length;
  const negativeValues = rows.filter((row) => ["spend", "impressions", "clicks", ...actionFields].some((field) => numberValue(row[field]) < 0)).length;

  if (spendNoTraffic > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope,
      message: `${scope} 有 ${spendNoTraffic} 行花费大于 0，但曝光和点击都是 0。`,
      action: "请检查是否导错报表，或花费、曝光、点击字段是否错列。",
    });
  }

  if (clickRateOver100 > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope,
      message: `${scope} 有 ${clickRateOver100} 行点击率超过 100%。`,
      action: "请检查曝光和点击字段是否错列，避免 CTR 判断失真。",
    });
  }

  if (spendNoAction > 0) {
    issues.push({
      type: "分析可用性问题",
      severity: "提醒",
      scope,
      message: `${scope} 有 ${spendNoAction} 行有花费，但没有表单、电话、咨询、订单或到店动作。`,
      action: "先看字段是否完整，再判断是不是流量质量问题。",
    });
  }

  if (clickNoAction > 0) {
    issues.push({
      type: "分析可用性问题",
      severity: "提醒",
      scope,
      message: `${scope} 有 ${clickNoAction} 行有点击，但没有后续动作，只能做前端流量判断。`,
      action: "不要直接下转化结论，先补齐线索或后端回流数据。",
    });
  }

  if (negativeValues > 0) {
    issues.push({
      type: "指标异常问题",
      severity: "严重",
      scope,
      message: `${scope} 有 ${negativeValues} 行出现负数指标。`,
      action: "请确认是否退款、冲销或字段导错，避免指标计算失真。",
    });
  }
}

function buildAnalysisAvailability(
  records: UploadedFileRow[],
  platformRows: PlatformQuality[],
  detailRows: DetailPlatformQuality[],
  issues: QualityIssue[],
) {
  const activeParsedRecords = records.filter((record) => record.is_active !== false && record.parse_status === "parsed");
  const hasMeituan = hasDetailPlatform(detailRows, "meituan");
  const hasEkanya = hasDetailPlatform(detailRows, "ekanya");
  const hasAnyAdPlatform = ["meituan", "douyin", "gdt", "amap"].some((key) => hasDetailPlatform(detailRows, key as PlatformKey));
  const hasMultiPlatform = ["meituan", "douyin", "gdt", "amap"].filter((key) => hasDetailPlatform(detailRows, key as PlatformKey)).length >= 2;
  const hasSeriousEkanyaIssue = issues.some((issue) => issue.scope.includes("e看牙") && issue.severity === "严重");

  return [
    {
      title: "当前哪些数据可以用于今日建议",
      available: activeParsedRecords.length > 0 && detailRows.some((row) => row.rowCount > 0),
      message:
        activeParsedRecords.length > 0
          ? `当前有明细数据的平台：${detailRows.filter((row) => row.rowCount > 0).map((row) => row.name).join("、") || "暂无"}。`
          : "当前没有启用且已解析的数据，暂时没有平台可以参与分析。",
    },
    {
      title: "哪些数据只能做趋势参考",
      available: hasAnyAdPlatform,
      message: hasEkanya
        ? "广告平台和 e看牙都有数据，可以做初步闭环参考，但不是手机号或订单级精准归因。"
        : "广告平台有前端数据，但 e看牙回流不足，抖音、腾讯、高德等只能先看曝光、点击和平台线索趋势。",
    },
    {
      title: "哪些数据暂时不能用于判断",
      available: !issues.some((issue) => issue.severity === "严重"),
      message:
        issues.length > 0
          ? "存在严重字段缺失、解析失败或明细行缺失时，不建议做重大调预算或调价。"
          : "当前没有明显严重问题，但仍要结合样本量和项目周期判断。",
    },
    {
      title: "今日建议",
      available: hasMeituan || hasEkanya || hasAnyAdPlatform,
      message:
        hasMeituan && hasEkanya && !hasSeriousEkanyaIssue
          ? "今日建议可以同时参考前端投放和 e看牙回流。"
          : hasAnyAdPlatform
            ? "今日建议可以参考前端数据，但后端成交和 ROI 判断需要谨慎。"
            : "今日建议缺少可分析数据，建议先补上传和解析。",
    },
    {
      title: "多平台看板",
      available: hasAnyAdPlatform,
      message: hasAnyAdPlatform
        ? hasMultiPlatform
          ? "已有多个广告平台明细数据，多平台看板可以做横向对比。"
          : "已有至少一个广告平台明细数据，多平台看板可以看基础表现，但横向对比还不完整。"
        : "没有广告平台的明细数据，多平台看板暂时没有可靠输入。",
    },
    {
      title: "ROI 分析",
      available: hasAnyAdPlatform && hasEkanya && !hasSeriousEkanyaIssue,
      message: hasAnyAdPlatform && hasEkanya
        ? hasSeriousEkanyaIssue
          ? "e看牙存在来源、项目或实收缺失，闭环 ROI 只能做参考，不能当作精准归因。"
          : "广告花费和 e看牙实收回流同时存在，可以看初步闭环 ROI。"
        : "ROI 分析需要广告花费和 e看牙实收回流同时存在；当前数据还不完整。",
    },
  ];
}

function calculatePlatformCompleteness(tables: DetailTableResult[]) {
  const totals = tables.reduce(
    (acc, table) => {
      const missing = countMissingRequiredCells(table);
      return {
        missing: acc.missing + missing.missing,
        total: acc.total + missing.total,
      };
    },
    { missing: 0, total: 0 },
  );

  if (totals.total === 0) return 0;
  return Math.round(((totals.total - totals.missing) / totals.total) * 100);
}

function countMissingRequiredCells(table: DetailTableResult) {
  const total = table.rows.length * table.requiredFields.length;
  const missing = table.rows.reduce((count, row) => {
    return count + table.requiredFields.filter((field) => isMissing(row[field])).length;
  }, 0);

  return { missing, total };
}

function getRows(detailTables: DetailTableResult[], key: string) {
  return detailTables.find((table) => table.key === key)?.rows ?? [];
}

function sumFields(row: DetailRow, fields: string[]) {
  return fields.reduce((total, field) => total + numberValue(row[field]), 0);
}

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").replace(/￥/g, "").replace(/¥/g, "").replace(/元/g, "").replace(/%/g, "").trim();
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }
  return 0;
}

function isMissing(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function isPositiveStatus(value: unknown) {
  const text = String(value ?? "").trim();
  return ["是", "已成交", "成交", "true", "1", "done"].includes(text);
}

function normalizePlatform(platform: string | null, dataType: string | null): PlatformKey {
  const text = `${platform ?? ""} ${dataType ?? ""}`.toLowerCase();

  if (text.includes("美团") || text.includes("meituan") || text.includes("点评") || text.includes("dianping")) return "meituan";
  if (text.includes("抖音") || text.includes("douyin") || text.includes("巨量")) return "douyin";
  if (text.includes("腾讯") || text.includes("广点通") || text.includes("gdt")) return "gdt";
  if (text.includes("高德") || text.includes("amap")) return "amap";
  if (text.includes("e看牙") || text.includes("ekanya")) return "ekanya";
  return "other";
}

function getPlatformStatus(uploadCount: number, parsedCount: number, failedCount: number): PlatformQuality["status"] {
  if (uploadCount === 0) return "未上传";
  if (failedCount > 0 && parsedCount === 0) return "解析异常";
  if (parsedCount === 0) return "缺数据";
  return "正常";
}

function getDetailStatus(
  analyzableFileCount: number,
  rowCount: number,
  issueCount: number,
  completeness: number,
  hasTableError: boolean,
): DetailStatus {
  if (analyzableFileCount === 0) return "暂不可分析";
  if (hasTableError || rowCount === 0) return "暂不可分析";
  if (issueCount > 0 || completeness < 70) return "有异常";
  if (completeness < 90) return "需补数据";
  return "正常";
}

function getPlatformNote(status: PlatformQuality["status"], platformName: string) {
  if (status === "正常") return `${platformName} 有启用且已解析的数据，可以参与当前分析。`;
  if (status === "解析异常") return `${platformName} 有文件解析失败，需要先处理表头或文件类型。`;
  if (status === "缺数据") return `${platformName} 有上传记录，但还没有可参与分析的数据。`;
  return `${platformName} 当前没有上传记录。`;
}

function getDetailStatusNote(platformName: string, status: DetailStatus) {
  if (status === "正常") return `${platformName} 明细字段基本完整，可以参与分析。`;
  if (status === "需补数据") return `${platformName} 明细可参考，但部分字段需要补齐。`;
  if (status === "有异常") return `${platformName} 明细存在字段缺失或指标异常，建议先复核。`;
  return `${platformName} 暂时没有可用明细数据。`;
}

function hasDetailPlatform(detailRows: DetailPlatformQuality[], key: PlatformKey) {
  return (detailRows.find((row) => row.key === key)?.rowCount ?? 0) > 0;
}

function isOlderThanDays(dateValue: string, days: number) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs > days * 24 * 60 * 60 * 1000;
}

function scoreLevel(score: number) {
  if (score >= 80) return "较可靠";
  if (score >= 50) return "可参考";
  return "数据不足";
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

function DetailStatusBadge({ status }: { status: DetailStatus }) {
  const className =
    status === "正常"
      ? "bg-emerald-100 text-emerald-700"
      : status === "有异常"
        ? "bg-rose-100 text-rose-700"
        : status === "需补数据"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-600";

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const className = severity === "严重" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{severity}</span>;
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
