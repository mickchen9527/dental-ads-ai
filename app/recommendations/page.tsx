import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { TodayRecommendationsBoard } from "@/components/today-recommendations-board";

export default function RecommendationsPage() {
  return (
    <AppShell activeHref="/recommendations">
      <PageHeader
        eyebrow="人工确认闭环"
        title="今日总建议"
        description="这里读取已解析的多平台数据和 e看牙回流数据，但当前仍是规则型建议，不是 AI 自动决策。所有调整都需要人工复核后执行。"
        action={
          <PageHelpButton
            purpose="这里是今天的总建议，帮你看今天整体先做什么、哪些先别乱动。当前基于美团、抖音、腾讯广点通、高德和 e看牙回流做规则判断。"
            when="上传并解析数据以后看。每天先看数据质量，再看今日总建议。"
            focus={["问题是什么", "为什么这么判断", "现在该做什么", "具体怎么做", "不要做什么", "几天后看什么"]}
            next="人工复核后再执行。执行后去操作记录里登记，后面才能复盘有没有效果。"
            mistakes={["不要把规则建议当成自动决策", "不要在数据没回流时直接调预算", "不要让系统自动暂停关键词或自动调价"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">当前是规则型今日建议，不调用 AI，不自动执行广告操作。</p>
        <p>
          本页读取已解析的美团、抖音、腾讯广点通、高德和 e看牙后端回流数据。没有可分析数据的平台只会显示缺数提醒，不会硬生成建议。
        </p>
        <p>
          所有建议都只是帮你排优先级。预算、关键词、价格、页面、素材和客服动作必须由人工复核后执行；e看牙回流只是初步闭环，不是精准归因。
        </p>
      </section>

      <TodayRecommendationsBoard />
    </AppShell>
  );
}
