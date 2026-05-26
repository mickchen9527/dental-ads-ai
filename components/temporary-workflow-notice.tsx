type TemporaryWorkflowNoticeProps = {
  kind?: "example" | "platform" | "reserved" | "ai";
};

const copy = {
  example: {
    title: "上线体验提示",
    text: "当前首页部分模块为示例概览，真实分析请以数据质量检测、今日总建议和多平台看板为准。",
  },
  platform: {
    title: "平台单页使用提示",
    text: "本页用于平台数据查看和辅助排查，正式判断请以已上传并解析后的多平台看板、数据质量检测和今日总建议为准。暂无真实数据时，页面会显示说明内容或示例参考，不代表真实投放结果。",
  },
  reserved: {
    title: "暂未纳入正式工作流",
    text: "该模块暂未纳入当前正式工作流，当前仅保留为后续功能预留。正式使用请以主导航中的上传、数据质量检测、今日建议、操作记录等模块为准。",
  },
  ai: {
    title: "暂未纳入正式工作流",
    text: "该模块暂未纳入当前正式工作流，当前未接入真实 AI，不会生成正式投放决策。正式使用请以主导航中的上传、数据质量检测、今日建议、操作记录等模块为准。",
  },
};

export function TemporaryWorkflowNotice({ kind = "reserved" }: TemporaryWorkflowNoticeProps) {
  const item = copy[kind];

  return (
    <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      <p className="font-semibold text-amber-950">{item.title}</p>
      <p className="mt-1">{item.text}</p>
    </section>
  );
}
