export type NavItem = {
  href: string;
  label: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "每日操作",
    items: [
      { href: "/dashboard", label: "首页驾驶舱" },
      { href: "/tasks", label: "今日执行清单" },
      { href: "/alerts", label: "异常预警" },
      { href: "/upload", label: "数据上传" },
      { href: "/data-quality", label: "数据质量检测" },
      { href: "/action-logs", label: "操作记录" },
    ],
  },
  {
    title: "分析中心",
    items: [
      { href: "/platform-analysis", label: "平台分析" },
      { href: "/project-analysis", label: "项目分析" },
      { href: "/creative-library", label: "素材库" },
      { href: "/competitor-intelligence", label: "竞品情报" },
      { href: "/ai-insights", label: "AI分析中心" },
    ],
  },
  {
    title: "生产中心",
    items: [{ href: "/creative-lab", label: "素材生产中心" }],
  },
  {
    title: "决策中心",
    items: [
      { href: "/recommendations", label: "调预算/价格策略建议" },
      { href: "/diagnosis", label: "问题诊断中心" },
      { href: "/review", label: "复盘中心" },
    ],
  },
  {
    title: "基础设置",
    items: [
      { href: "/metric-center", label: "指标公式中心" },
      { href: "/targets", label: "目标值设置" },
      { href: "/templates", label: "模板中心" },
      { href: "/knowledge", label: "投放知识库" },
      { href: "/version-roadmap", label: "版本路线说明" },
      { href: "/settings", label: "系统设置" },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
