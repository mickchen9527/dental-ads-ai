import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getKnowledgeArticle, knowledgeArticles } from "@/lib/knowledge/articles";

export function generateStaticParams() {
  return knowledgeArticles.map((article) => ({ slug: article.slug }));
}

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getKnowledgeArticle(slug);

  if (!article) {
    return (
      <AppShell activeHref="/knowledge">
        <PageHeader title="未找到该知识条目" />
        <Link className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" href="/knowledge">
          返回投放知识库
        </Link>
      </AppShell>
    );
  }

  const related = article.relatedArticles
    .map(getKnowledgeArticle)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <AppShell activeHref="/knowledge">
      <PageHeader
        eyebrow={`${article.category} · ${article.level}`}
        title={article.title}
        description={article.summary}
        action={
          <Link className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" href="/knowledge">
            返回投放知识库
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <Detail title="一句话解释" content={article.summary} />
          <Detail title="这个指标/概念有什么用" content={article.scenario} />
          <Detail title="计算公式" content={article.formula ?? "该概念没有固定公式，主要用于辅助判断。"} />
          <Detail title="举个例子" content={article.example} />
          <Detail title="正常怎么看" content={article.normalInterpretation} />
          <Detail title="偏高/偏低说明什么" content={article.highLowMeaning} />
          <List title="常见误区" items={article.mistakes} />
          <List title="你应该怎么操作" items={article.actionSteps} />
          <List title="在系统里应该看哪个页面" items={article.relatedPages} />
          <Detail title="什么情况下不要急着下结论" content={article.doNotConcludeWhen} />
        </article>

        <aside className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">相关知识推荐</h3>
          <div className="mt-4 space-y-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                className="block rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                href={`/knowledge/${item.slug}`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function Detail({ title, content }: { title: string; content: string }) {
  return (
    <section className="border-b border-slate-100 py-4 first:pt-0 last:border-b-0">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{content}</p>
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-b border-slate-100 py-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
