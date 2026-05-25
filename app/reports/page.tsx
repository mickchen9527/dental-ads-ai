import { AppShell } from "@/components/app-shell";
import { MultiPlatformWeeklyReport } from "@/components/multi-platform-weekly-report";
import { PageHeader } from "@/components/page-header";

export default function ReportsPage() {
  return (
    <AppShell activeHref="/reports">
      <PageHeader
        eyebrow="周会复盘"
        title="多平台周报"
        description="这是多平台周报雏形版，读取美团、抖音、腾讯广点通、高德和 e看牙回流数据。当前不是 AI 总结，也不是精准归因。"
      />

      <section className="mb-6 rounded-md border-2 border-yellow-400 bg-yellow-200 p-6 text-2xl font-bold text-slate-950">
        V1.7.12 多平台周报页面已加载
      </section>

      <MultiPlatformWeeklyReport />
    </AppShell>
  );
}
