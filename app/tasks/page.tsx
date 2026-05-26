import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TemporaryWorkflowNotice } from "@/components/temporary-workflow-notice";
import { taskGroups } from "@/lib/v12-static-data";

export default function TasksPage() {
  return (
    <AppShell activeHref="/tasks">
      <PageHeader
        eyebrow="每日操作"
        title="今日执行清单"
        description="把系统建议拆成可执行任务，所有动作仍需人工确认后执行。"
      />

      <TemporaryWorkflowNotice kind="reserved" />

      <div className="space-y-6">
        {taskGroups.map((group) => (
          <section key={group.title}>
            <h3 className="mb-3 text-base font-semibold text-slate-950">{group.title}</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {group.tasks.map((task) => (
                <article key={task.name} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-950">{task.name}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {task.platform} · {task.project}
                      </p>
                    </div>
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                      优先级：{task.priority}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="建议动作" value={task.action} />
                    <Field label="数据依据" value={task.evidence} />
                    <Field label="预计影响" value={task.impact} />
                    <Field label="风险提醒" value={task.risk} />
                    <Field label="观察周期" value={task.cycle} />
                    <Field label="是否已执行" value={task.done} />
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}
