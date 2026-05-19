type UploadedDataManagerProps = {
  title?: string;
  description?: string;
  rows: string[][];
  filters?: string[];
};

const headers = [
  "文件名",
  "数据类型",
  "数据周期",
  "上传时间",
  "行数",
  "解析状态",
  "是否参与分析",
  "操作",
];

export function UploadedDataManager({
  title = "已上传数据",
  description = "这里查看以前上传过的文件。",
  rows,
  filters = ["文件名", "数据类型", "日期范围"],
}: UploadedDataManagerProps) {
  return (
    <section className="mt-6 rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {filters.map((item) => (
          <input
            key={item}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder={`按${item}搜索`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["数据类型", "数据周期", "是否参与分析", "解析状态"].map((item) => (
          <button key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700" type="button">
            筛选：{item}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold text-slate-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.slice(0, 7).map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {["查看", "下载", "重新分析", "停用"].map((action) => (
                      <button key={action} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700" type="button">
                        {action}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
