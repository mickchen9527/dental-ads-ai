import Link from "next/link";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/navigation";
import { LogoutButton } from "./logout-button";

type AppShellProps = {
  activeHref: string;
  children: React.ReactNode;
};

const attentionHrefs = new Set([
  "/tasks",
  "/alerts",
  "/data-quality",
  "/action-logs",
  "/recommendations",
  "/diagnosis",
  "/review",
  "/ai-insights",
]);

export function AppShell({ activeHref, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="px-5 py-6">
          <p className="text-xs font-semibold text-cyan-700">内部系统</p>
          <h1 className="mt-2 text-xl font-semibold leading-7">
            口腔投放决策辅助系统
          </h1>
        </div>
        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-xs font-semibold text-slate-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === activeHref;
                  const needsAttention = attentionHrefs.has(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-cyan-50 text-cyan-800"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      {needsAttention ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" title="重点关注" />
                      ) : (
                        <span className="h-2 w-2 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="m-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          红点只是重点关注提醒，不代表一定存在重大问题。AI建议仅供内部参考，广告预算、价格和医疗广告内容必须人工确认。
        </div>
        <div className="border-t border-slate-200 p-5">
          <LogoutButton />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">口腔投放决策辅助系统</p>
            <LogoutButton />
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                  item.href === activeHref
                    ? "bg-cyan-50 text-cyan-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {attentionHrefs.has(item.href) ? "● " : ""}
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
