import { AppShell } from "@/components/app-shell";
import { CompetitorPriceLibrary } from "@/components/competitor-price-library";
import { PageHeader } from "@/components/page-header";

export default function CompetitorIntelligencePage() {
  return (
    <AppShell activeHref="/competitor-intelligence">
      <PageHeader
        eyebrow="公开价格人工管理"
        title="竞品价格库"
        description="这里用于管理你手动整理或导入的竞品公开价格。当前只处理公开价格数据，不做自动爬虫，不采集手机号、微信号、私信和客户隐私。"
      />
      <CompetitorPriceLibrary />
    </AppShell>
  );
}
