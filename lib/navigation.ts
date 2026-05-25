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
    title: "每日工作",
    items: [
      { href: "/dashboard", label: "首页驾驶舱" },
      { href: "/upload", label: "数据上传" },
      { href: "/data-quality", label: "数据质量检测" },
      { href: "/recommendations", label: "今日总建议" },
      { href: "/action-logs", label: "操作记录" },
    ],
  },
  {
    title: "平台分析",
    items: [
      { href: "/platform-analysis", label: "多平台统一看板" },
      { href: "/platforms/meituan", label: "美团分析" },
      { href: "/platforms/douyin", label: "抖音分析" },
      { href: "/platforms/gdt", label: "腾讯广点通分析" },
      { href: "/platforms/amap", label: "高德分析" },
    ],
  },
  {
    title: "后端闭环",
    items: [
      { href: "/ekanya-analysis", label: "e看牙回流分析" },
      { href: "/roi-analysis", label: "闭环 ROI 分析" },
      { href: "/project-analysis", label: "项目分析" },
      { href: "/reports", label: "多平台周报" },
    ],
  },
  {
    title: "辅助工具",
    items: [
      { href: "/metric-center", label: "指标公式中心" },
      { href: "/templates", label: "模板中心" },
      { href: "/knowledge", label: "投放知识库" },
      { href: "/competitor-intelligence", label: "竞品情报" },
      { href: "/creative-lab", label: "素材生产中心" },
      { href: "/version-roadmap", label: "版本路线说明" },
    ],
  },
  {
    title: "系统设置",
    items: [
      { href: "/project-pricing", label: "项目价格管理" },
      { href: "/targets", label: "目标值设置" },
      { href: "/data-sources", label: "数据源配置" },
      { href: "/settings", label: "系统设置" },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
