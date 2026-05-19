import {
  DATA_SOURCES,
  type DataSourceId,
  getDataSourceName,
} from "@/lib/data-sources";

type DataSourceStripProps = {
  presentSourceIds: DataSourceId[];
};

export function DataSourceStrip({ presentSourceIds }: DataSourceStripProps) {
  const present = new Set(presentSourceIds);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            全站统一数据源
          </h3>
          <p className="text-xs leading-5 text-slate-500">
            当前 V1 优先跑通美团、e看牙、项目价格管理三类数据的闭环。
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500">
          已支持计算 {DATA_SOURCES.filter((source) => source.status === "已支持计算").length} / {DATA_SOURCES.length}
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DATA_SOURCES.map((source) => {
          const isPresent = present.has(source.id);

          return (
            <div
              key={source.id}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {getDataSourceName(source.id)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {source.sourceType}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    source.status === "已支持计算"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {source.status}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {source.status === "已支持计算" && isPresent
                  ? "已纳入当前 V1 评分与计算。"
                  : source.status === "已支持计算"
                    ? "已支持，等待上传。"
                    : source.config.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
