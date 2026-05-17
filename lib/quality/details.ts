import { dataSources } from "@/lib/config/dataSources";

export function buildUploadDetectionRows() {
  return dataSources.map((source) => ({
    type: source.name,
    uploaded: source.status === "已支持计算" ? "已上传" : "入口已开放",
    date: source.status === "已支持计算" ? "2026-05-16" : "-",
    rows: source.status === "已支持计算" ? "示例数据" : "-",
    fieldStatus: source.fieldMappingStatus,
    issue: source.status === "已支持计算" ? "字段映射已配置" : source.explanation,
    scoring: source.participatesInScoring ? "参与评分" : "不参与评分",
    calculation: source.participatesInCalculation ? "参与计算" : "不参与计算",
  }));
}

export function buildFieldMissingRows() {
  return [
    { field: "日期", exists: "存在", missingRate: 0.01, risk: "低" },
    { field: "平台", exists: "存在", missingRate: 0.02, risk: "低" },
    { field: "推广名称", exists: "存在", missingRate: 0.08, risk: "中" },
    { field: "项目", exists: "存在", missingRate: 0.06, risk: "中" },
    { field: "成交金额", exists: "存在", missingRate: 0.32, risk: "高" },
    { field: "手机号后四位", exists: "存在", missingRate: 0.18, risk: "中" },
  ];
}

export function buildMatchSummary() {
  return {
    totalPlatformLeads: 386,
    ekanyaRecords: 10,
    successfulMatches: 10,
    unmatched: 0,
    unreturnedLeads: 376,
    ekanyaRecordMatchRate: 1,
    platformLeadReturnRate: 10 / 386,
  };
}

export function buildAnomalyRows() {
  return [
    { type: "消耗为0但有点击", scope: "暂未发现", risk: "低", action: "保持观察" },
    { type: "有成交金额但无成交数", scope: "1条记录", risk: "高", action: "复核成交字段，避免成交率失真" },
    { type: "成交金额为空", scope: "3条记录", risk: "高", action: "补录成交金额后再判断 ROI" },
    { type: "项目分类无法识别", scope: "2条记录", risk: "中", action: "维护项目映射规则" },
    { type: "推广名称缺失", scope: "4条记录", risk: "中", action: "补齐推广名称以便归因匹配" },
    { type: "高客单项目仅有1天数据", scope: "1个项目", risk: "高", action: "种植/正畸至少观察7天" },
  ];
}
