import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { WeeklyReportDraft } from "@/components/weekly-report-draft";

const reportNotes = [
  "当前周报读取已解析的美团推广汇总、美团关键词和 e看牙回流数据。",
  "周报雏形版只做规则汇总，不调用 OpenAI API，不做 AI 总结。",
  "当前不是精准归因，开会时仍需要人工确认数据口径和执行动作。",
];

export default function ReportsPage() {
  return (
    <AppShell activeHref="/reports">
      <PageHeader
        eyebrow="周会复盘"
        title="历史报告 / 周报"
        description="这里先提供项目/投放周报雏形版，方便开周会时快速看本周花费、回流、项目表现和关键词情况。"
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        {reportNotes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </section>

      <WeeklyReportDraft />
    </AppShell>
  );
}