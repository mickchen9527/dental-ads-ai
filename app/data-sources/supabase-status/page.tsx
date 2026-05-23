import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { getSupabaseEnvStatus } from "@/lib/supabase/env";

export default function SupabaseStatusPage() {
  const status = getSupabaseEnvStatus();

  return (
    <AppShell activeHref="/data-sources">
      <PageHeader
        eyebrow="数据源配置"
        title="Supabase 连接状态"
        description="这里只检查 Supabase 环境变量有没有配好，不会显示真实 key，也不会连接业务表。"
      />

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">当前状态</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{status.summary}</h3>
          </div>
          <span className={`rounded-md px-3 py-2 text-sm font-semibold ${
            status.allConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-900"
          }`}>
            {status.allConfigured ? "全部已配置" : "需要补充配置"}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          当前只完成数据库连接地基，还没有开始保存上传文件。下一步会建立上传记录表和文件存储。
        </p>
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["配置项", "状态", "说明"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {status.items.map((item) => (
              <tr key={item.key}>
                <td className="px-4 py-3 font-semibold text-slate-950">{item.label}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    item.status === "已配置" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">只显示是否配置，不显示真实值。</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        V1.6.1 只检查 Supabase 是否配置完成。真正保存上传文件，需要 V1.6.2 建立 Storage 和上传记录写入。
      </section>

      <Link className="mt-6 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/data-sources">
        返回数据源配置
      </Link>
    </AppShell>
  );
}
