import { AppShell } from "@/components/app-shell";
import { CompetitorPriceLibraryRefined } from "@/components/competitor-price-library-refined";
import { PageHeader } from "@/components/page-header";

export default function CompetitorIntelligencePage() {
  return (
    <AppShell activeHref="/competitor-intelligence">
      <PageHeader
        eyebrow="公开价格人工管理"
        title="竞品价格库"
        description="这里用于管理手动整理或导入的竞品公开价格。当前不做自动采集，不做爬虫，不采集客户隐私，也不会自动调整雅正价格。"
      />
      <CompetitorPriceLibraryRefined />
    </AppShell>
  );
}
