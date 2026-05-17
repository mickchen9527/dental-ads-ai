import { getDataSourceName, type DataSourceId } from "@/lib/data-sources";

type SourceBadgeProps = {
  sourceId: DataSourceId;
};

export function SourceBadge({ sourceId }: SourceBadgeProps) {
  return (
    <span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
      {getDataSourceName(sourceId)}
    </span>
  );
}
