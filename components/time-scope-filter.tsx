"use client";

import { useState } from "react";

const ranges = ["今日", "昨日", "近 7 天", "本周", "上周", "本月", "自定义日期"];
const scopes = ["按来源日期", "按到院日期", "按成交日期"];

export function TimeScopeFilter() {
  const [range, setRange] = useState("近 7 天");
  const [scope, setScope] = useState("按来源日期");

  return (
    <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">时间筛选和时间口径</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        同一个客户可能 5月11日来自平台，5月15日到院，5月20日成交。请选择不同时间口径查看，避免把成交算错周期。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ranges.map((item) => (
          <button
            key={item}
            className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
              range === item
                ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
            type="button"
            onClick={() => setRange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {scopes.map((item) => (
          <button
            key={item}
            className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
              scope === item
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            type="button"
            onClick={() => setScope(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
        当前选择：{range}，{scope}。当前为前端演示，接入数据库后会按该时间条件筛选真实数据。
      </p>
    </section>
  );
}
