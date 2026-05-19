export type PlatformKey = "meituan" | "douyin" | "gdt" | "amap";

export type UploadedFileRow = {
  fileName: string;
  dataType: string;
  period: string;
  uploadedAt: string;
  rows: string;
  parseStatus: string;
  included: string;
};

export type CustomerRow = {
  date: string;
  platform: string;
  customer: string;
  phoneTail: string;
  sourceType: string;
  intendedProject: string;
  appointmentProject: string;
  arrivalProject: string;
  dealProject: string;
  appointment: string;
  arrival: string;
  deal: string;
  paidAmount: string;
  noDealReason: string;
  staff: string;
  doctor: string;
  status: string;
  note: string;
};

export type ProjectStatRow = {
  project: string;
  leads: string;
  appointments: string;
  arrivals: string;
  deals: string;
  paidAmount: string;
  projectType: string;
  cycle: string;
  judgement: string;
};

export type PlatformWorkbenchData = {
  key: PlatformKey;
  activeHref: string;
  name: string;
  status: string;
  period: string;
  conclusion: string;
  todaySpend: string;
  weekSpend: string;
  hasLatestData: boolean;
  frontDataTitle: string;
  frontData: Array<[string, string, string]>;
  uploadedFiles: UploadedFileRow[];
  dataTypes: string[];
  customers: CustomerRow[];
  sourceTypes: string[];
  projectStats: ProjectStatRow[];
  suggestions: Array<{
    problem: string;
    reason: string;
    now: string;
    steps: string[];
    avoid: string[];
    observe: string;
    review: string[];
  }>;
};

const commonCustomers = {
  meituan: [
    {
      date: "2026-05-18",
      platform: "美团",
      customer: "MT-001",
      phoneTail: "2386",
      sourceType: "美团在线咨询",
      intendedProject: "洁牙",
      appointmentProject: "洁牙",
      arrivalProject: "洁牙",
      dealProject: "洁牙",
      appointment: "是",
      arrival: "是",
      deal: "是",
      paidAmount: "¥198.00",
      noDealReason: "-",
      staff: "前台A",
      doctor: "医生王",
      status: "已成交",
      note: "团购后到院升级护理",
    },
    {
      date: "2026-05-18",
      platform: "美团",
      customer: "MT-002",
      phoneTail: "0912",
      sourceType: "美团电话",
      intendedProject: "种植",
      appointmentProject: "种植检查",
      arrivalProject: "种植检查",
      dealProject: "-",
      appointment: "是",
      arrival: "是",
      deal: "否",
      paidAmount: "¥0.00",
      noDealReason: "暂时考虑",
      staff: "客服B",
      doctor: "医生李",
      status: "待追踪",
      note: "高客单项目继续跟进",
    },
  ],
  douyin: [
    {
      date: "2026-05-18",
      platform: "抖音",
      customer: "DY-001",
      phoneTail: "6631",
      sourceType: "抖音表单",
      intendedProject: "正畸",
      appointmentProject: "正畸评估",
      arrivalProject: "-",
      dealProject: "-",
      appointment: "是",
      arrival: "否",
      deal: "否",
      paidAmount: "¥0.00",
      noDealReason: "没有时间",
      staff: "客服C",
      doctor: "-",
      status: "已预约",
      note: "提醒周末到院",
    },
  ],
  gdt: [
    {
      date: "2026-05-18",
      platform: "腾讯广点通",
      customer: "TX-001",
      phoneTail: "7710",
      sourceType: "腾讯电话",
      intendedProject: "儿牙",
      appointmentProject: "涂氟",
      arrivalProject: "涂氟",
      dealProject: "涂氟",
      appointment: "是",
      arrival: "是",
      deal: "是",
      paidAmount: "¥268.00",
      noDealReason: "-",
      staff: "客服A",
      doctor: "医生赵",
      status: "已成交",
      note: "家长关注是否疼痛",
    },
  ],
  amap: [
    {
      date: "2026-05-18",
      platform: "高德",
      customer: "GD-001",
      phoneTail: "5068",
      sourceType: "高德导航到店",
      intendedProject: "补牙",
      appointmentProject: "补牙",
      arrivalProject: "补牙",
      dealProject: "补牙",
      appointment: "否",
      arrival: "是",
      deal: "是",
      paidAmount: "¥520.00",
      noDealReason: "-",
      staff: "前台B",
      doctor: "医生陈",
      status: "已成交",
      note: "地图搜索后直接到店",
    },
  ],
} satisfies Record<PlatformKey, CustomerRow[]>;

const commonProjectStats: ProjectStatRow[] = [
  {
    project: "洁牙",
    leads: "42",
    appointments: "22",
    arrivals: "18",
    deals: "12",
    paidAmount: "¥3,680.00",
    projectType: "引流项目",
    cycle: "1-3天",
    judgement: "看后续是否带来补牙、牙周等转化。",
  },
  {
    project: "种植",
    leads: "18",
    appointments: "9",
    arrivals: "5",
    deals: "1",
    paidAmount: "¥8,800.00",
    projectType: "高客单长周期",
    cycle: "7-30天",
    judgement: "不要只看单日成交，继续追踪方案和复诊。",
  },
  {
    project: "正畸",
    leads: "16",
    appointments: "7",
    arrivals: "3",
    deals: "0",
    paidAmount: "¥0.00",
    projectType: "方案型项目",
    cycle: "7-30天",
    judgement: "决策周期长，先看预约和到院，不急着停。",
  },
];

export const platformWorkbenches: Record<PlatformKey, PlatformWorkbenchData> = {
  meituan: {
    key: "meituan",
    activeHref: "/platforms/meituan",
    name: "美团分析",
    status: "已支持计算",
    period: "2026-05-13 至 2026-05-19",
    conclusion: "美团本周有花费、有咨询，也有 e看牙回流；先看页面咨询入口和团购成本。",
    todaySpend: "¥1,280.00",
    weekSpend: "¥12,800.00",
    hasLatestData: true,
    frontDataTitle: "美团前端数据",
    frontData: [
      ["花费", "¥12,800.00", "后台导出字段"],
      ["曝光", "386,000", "后台导出字段"],
      ["点击", "6,420", "后台导出字段"],
      ["点击均价", "¥1.99", "花费 / 点击"],
      ["商户浏览量", "4,880", "后台导出字段"],
      ["查看电话", "96", "后台导出字段"],
      ["在线咨询点击", "188", "后台导出字段"],
      ["订单量", "42", "后台导出字段"],
      ["团购订单量", "38", "后台导出字段"],
      ["15日团购订单量", "52", "后台导出字段"],
      ["美团前端客资量", "322", "查看电话 + 在线咨询点击 + 团购订单量"],
      ["美团前端客资成本", "¥39.75", "花费 / 美团前端客资量"],
    ],
    uploadedFiles: [
      { fileName: "meituan-20260513-0519.csv", dataType: "美团推广汇总数据", period: "本周", uploadedAt: "2026-05-19 09:12", rows: "386", parseStatus: "解析成功", included: "是" },
      { fileName: "meituan-keywords.csv", dataType: "美团关键词数据", period: "本周", uploadedAt: "2026-05-19 09:18", rows: "128", parseStatus: "解析成功", included: "是" },
      { fileName: "ekanya-meituan.csv", dataType: "e看牙美团后端回流数据", period: "本周", uploadedAt: "2026-05-19 09:25", rows: "42", parseStatus: "需要复核", included: "是" },
    ],
    dataTypes: ["美团推广汇总数据", "美团关键词数据", "美团订单/团购明细，可选", "e看牙美团后端回流数据"],
    customers: commonCustomers.meituan,
    sourceTypes: ["美团团购", "美团电话", "美团在线咨询"],
    projectStats: commonProjectStats,
    suggestions: [
      {
        problem: "美团浏览后咨询偏弱。",
        reason: "商户浏览量不少，但在线咨询点击没有同步放大。",
        now: "先优化美团页面，不要急着加预算。",
        steps: ["检查套餐标题是否说人话。", "检查购买须知是否写清包含项。", "把医生、材料、服务流程补到页面。", "把在线咨询入口放到更明显的位置。"],
        avoid: ["不要直接全项目降价。", "不要在页面没改前大幅加预算。"],
        observe: "3天",
        review: ["在线咨询点击", "团购订单成本", "e看牙来源客户数"],
      },
    ],
  },
  douyin: {
    key: "douyin",
    activeHref: "/platforms/douyin",
    name: "抖音分析",
    status: "入口已开放，等待上传数据",
    period: "示例周期：2026-05-13 至 2026-05-19",
    conclusion: "抖音入口已开放，当前先看上传结构和素材方向；接入字段映射后再参与计算。",
    todaySpend: "¥0.00",
    weekSpend: "¥0.00",
    hasLatestData: false,
    frontDataTitle: "抖音前端数据",
    frontData: [
      ["消耗", "等待上传", "请先上传抖音广告计划汇总数据"],
      ["展示", "等待上传", "后台导出字段"],
      ["点击", "等待上传", "后台导出字段"],
      ["点击率", "等待上传", "点击 / 展示"],
      ["点击成本", "等待上传", "消耗 / 点击"],
      ["私信", "等待上传", "后台导出字段"],
      ["表单", "等待上传", "后台导出字段"],
      ["转化", "等待上传", "后台导出字段"],
      ["转化成本", "等待上传", "后台导出字段"],
      ["计划名称", "等待上传", "后台导出字段"],
      ["素材名称", "等待上传", "后台导出字段"],
      ["素材方向", "等待上传", "人工标签"],
    ],
    uploadedFiles: [
      { fileName: "douyin-demo.csv", dataType: "抖音广告计划汇总数据", period: "示例", uploadedAt: "2026-05-18 18:00", rows: "0", parseStatus: "等待真实上传", included: "否" },
    ],
    dataTypes: ["抖音广告计划汇总数据", "抖音素材/创意数据", "抖音表单/私信线索数据", "e看牙抖音后端回流数据"],
    customers: commonCustomers.douyin,
    sourceTypes: ["抖音表单", "抖音私信"],
    projectStats: commonProjectStats.slice(1),
    suggestions: [
      {
        problem: "抖音现在没有进入核心计算。",
        reason: "还没有配置正式字段映射，也缺 e看牙抖音来源回流。",
        now: "先上传计划汇总和素材表，再补 e看牙来源。",
        steps: ["导出抖音计划汇总表。", "导出素材/创意表。", "让前台记录来源类型是抖音表单还是抖音私信。", "上传后先看数据质量。"],
        avoid: ["不要把示例数据当真实结果。", "不要只看播放量就加预算。"],
        observe: "7天",
        review: ["有效咨询率", "到院数", "实收 ROI"],
      },
    ],
  },
  gdt: {
    key: "gdt",
    activeHref: "/platforms/gdt",
    name: "腾讯广点通分析",
    status: "入口已开放，等待上传数据",
    period: "示例周期：2026-05-13 至 2026-05-19",
    conclusion: "腾讯广点通先看表单、电话和 e看牙回流；真实数据上传后再看建议。",
    todaySpend: "¥0.00",
    weekSpend: "¥0.00",
    hasLatestData: false,
    frontDataTitle: "腾讯广点通前端数据",
    frontData: [
      ["消耗", "等待上传", "后台导出字段"],
      ["曝光", "等待上传", "后台导出字段"],
      ["点击", "等待上传", "后台导出字段"],
      ["点击率", "等待上传", "点击 / 曝光"],
      ["点击成本", "等待上传", "消耗 / 点击"],
      ["表单", "等待上传", "后台导出字段"],
      ["电话", "等待上传", "后台导出字段"],
      ["转化", "等待上传", "后台导出字段"],
      ["转化成本", "等待上传", "后台导出字段"],
      ["账户", "等待上传", "后台导出字段"],
      ["计划", "等待上传", "后台导出字段"],
      ["广告组", "等待上传", "后台导出字段"],
      ["创意", "等待上传", "后台导出字段"],
    ],
    uploadedFiles: [
      { fileName: "gdt-demo.csv", dataType: "腾讯账户/计划汇总数据", period: "示例", uploadedAt: "2026-05-18 18:00", rows: "0", parseStatus: "等待真实上传", included: "否" },
    ],
    dataTypes: ["腾讯账户/计划汇总数据", "腾讯广告组/创意数据", "腾讯表单/电话线索数据", "e看牙腾讯后端回流数据"],
    customers: commonCustomers.gdt,
    sourceTypes: ["腾讯表单", "腾讯电话"],
    projectStats: commonProjectStats,
    suggestions: [
      {
        problem: "腾讯表单线索需要先看后端是否接住。",
        reason: "信息流表单容易有低意向客户，必须看 e看牙到院和成交。",
        now: "先统一前台记录来源，再判断预算。",
        steps: ["上传账户/计划汇总表。", "上传表单/电话线索表。", "让客服把来源写成腾讯表单或腾讯电话。", "3天后看是否有到院。"],
        avoid: ["不要只看表单成本。", "不要没有回流就大幅加预算。"],
        observe: "3-7天",
        review: ["来源客户数", "到院率", "实收金额"],
      },
    ],
  },
  amap: {
    key: "amap",
    activeHref: "/platforms/amap",
    name: "高德分析",
    status: "预留平台，后续接入",
    period: "示例周期：2026-05-13 至 2026-05-19",
    conclusion: "高德适合看电话、导航、地址查看和到店意向；当前先做页面和字段预留。",
    todaySpend: "¥0.00",
    weekSpend: "¥0.00",
    hasLatestData: false,
    frontDataTitle: "高德前端数据",
    frontData: [
      ["花费", "等待上传", "后台导出字段"],
      ["曝光", "等待上传", "后台导出字段"],
      ["点击", "等待上传", "后台导出字段"],
      ["电话", "等待上传", "后台导出字段"],
      ["导航", "等待上传", "后台导出字段"],
      ["地址查看", "等待上传", "后台导出字段"],
      ["门店访问", "等待上传", "后台导出字段"],
      ["路线规划", "等待上传", "后台导出字段"],
      ["到店意向", "等待上传", "电话 + 导航 + 地址查看 + 路线规划"],
    ],
    uploadedFiles: [
      { fileName: "amap-demo.csv", dataType: "高德推广汇总数据", period: "示例", uploadedAt: "2026-05-18 18:00", rows: "0", parseStatus: "等待真实上传", included: "否" },
    ],
    dataTypes: ["高德推广汇总数据", "高德电话/导航/门店访问数据", "高德线索数据，如果能导出", "e看牙高德后端回流数据"],
    customers: commonCustomers.amap,
    sourceTypes: ["高德电话", "高德导航到店", "高德地图搜索"],
    projectStats: commonProjectStats,
    suggestions: [
      {
        problem: "高德还没有真实上传数据。",
        reason: "当前只是预留平台，不能用它判断投放好坏。",
        now: "先准备高德导出模板和前台来源记录口径。",
        steps: ["确认高德能导出哪些字段。", "前台记录高德电话、导航到店、地图搜索。", "把到店客户补进 e看牙。", "有一周数据后再看实收 ROI。"],
        avoid: ["不要用空数据做预算判断。", "不要把自然到店全算成广告效果。"],
        observe: "7天",
        review: ["电话", "导航", "到店意向", "e看牙回流"],
      },
    ],
  },
};
