import { dataSources } from "@/lib/config/dataSources";

export function UploadWorkbench() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {dataSources.map((source) => (
        <section key={source.key} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">{source.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{source.supportedFormats.join(" / ")}</p>
            </div>
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                source.status === "已支持计算"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {source.statusLabel}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{source.description}</p>
          <label className="mt-4 block rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm font-medium text-slate-600">
            选择文件
            <input className="sr-only" type="file" />
          </label>
        </section>
      ))}
    </div>
  );
}
