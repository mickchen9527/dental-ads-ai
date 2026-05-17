import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { knowledgeArticles, knowledgeCategories } from "@/lib/knowledge/articles";

const quickLinks = [
  ["每天打开系统第一步看什么", "/knowledge/daily-first-step"],
  ["上传数据后应该怎么检查", "/knowledge/check-after-upload"],
  ["看到系统建议后怎么处理", "/knowledge/handle-system-suggestion"],
  ["如何判断今天能不能调预算", "/knowledge/adjust-budget-checklist"],
  ["如何做一周复盘", "/knowledge/weekly-review"],
  ["为什么咨询成本低不一定好", "/knowledge/low-consult-cost-not-always-good"],
  ["什么是毛利ROI", "/knowledge/gross-profit-roi"],
  ["什么是平台线索回流率", "/knowledge/platform-lead-return-rate"],
];

export default function KnowledgePage() {
  return (
    <AppShell activeHref="/knowledge">
      <PageHeader
        eyebrow="基础设置"
        title="投放知识库"
        description="把知识库做成新手也能跟着步骤走的投放操作手册。每张卡片和快速入口都可以进入详情页。"
      />

      <section className="mb-6 rounded-md border border-cyan-100 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-slate-950">快速入口</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(([label, href]) => (
            <Link
              key={href}
              className="rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50"
              href={href}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        {knowledgeCategories.map((category) => (
          <button key={category} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            {category}
          </button>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {knowledgeArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/knowledge/${article.slug}`}
            className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-cyan-200 hover:bg-cyan-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-cyan-700">{article.category}</p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">{article.title}</h3>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {article.level}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{article.summary}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">适用场景：{article.scenario}</p>
            <span className="mt-4 inline-flex rounded-md border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-800">
              点击查看详情
            </span>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
