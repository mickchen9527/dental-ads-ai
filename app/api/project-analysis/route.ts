import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const supportedDateTypes = new Set(["source_date", "visit_date", "deal_date"]);
const ekanyaDataTypes = ["e看牙后端回流数据", "ekanya-backflow"];

type NumericValue = number | string | null | undefined;

type UploadedFileRow = {
  id: string;
  data_type: string | null;
};

type EkanyaBackflowRow = {
  source_platform: string | null;
  source_date: string | null;
  visit_date: string | null;
  deal_date: string | null;
  intention_project: string | null;
  visit_project: string | null;
  deal_project: string | null;
  appointment_status: string | null;
  visit_status: string | null;
  deal_status: string | null;
  paid_amount: NumericValue;
};

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase 服务端连接失败：请检查 URL 和 service role / secret key 是否已配置。" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const range = resolveDateRange(searchParams.get("startDate"), searchParams.get("endDate"));
  const requestedDateType = searchParams.get("dateType") ?? "source_date";
  const dateType = supportedDateTypes.has(requestedDateType) ? requestedDateType : "source_date";

  const uploadedResult = await supabase
    .from("uploaded_files")
    .select("id, data_type")
    .eq("is_active", true)
    .in("parse_status", ["parsed"])
    .in("data_type", ekanyaDataTypes);

  if (uploadedResult.error) {
    console.error("[api/project-analysis] uploaded_files query failed", {
      code: uploadedResult.error.code,
      message: uploadedResult.error.message,
      details: uploadedResult.error.details,
      hint: uploadedResult.error.hint,
    });

    return NextResponse.json({ message: "读取上传记录失败，请检查 uploaded_files 表权限。" }, { status: 500 });
  }

  const uploadedFiles = (uploadedResult.data ?? []) as UploadedFileRow[];
  const uploadedFileIds = uploadedFiles.map((file) => file.id);

  if (uploadedFileIds.length === 0) {
    return NextResponse.json(buildEmptyResponse(range.startDate, range.endDate, dateType));
  }

  const rowsResult = await supabase
    .from("ekanya_backflow_rows")
    .select(
      "source_platform, source_date, visit_date, deal_date, intention_project, visit_project, deal_project, appointment_status, visit_status, deal_status, paid_amount",
    )
    .in("uploaded_file_id", uploadedFileIds)
    .gte(dateType, range.startDate)
    .lte(dateType, range.endDate)
    .limit(10000);

  if (rowsResult.error) {
    console.error("[api/project-analysis] ekanya_backflow_rows query failed", {
      code: rowsResult.error.code,
      message: rowsResult.error.message,
      details: rowsResult.error.details,
      hint: rowsResult.error.hint,
    });

    return NextResponse.json({ message: "读取 e看牙回流解析数据失败，请检查 ekanya_backflow_rows 表权限。" }, { status: 500 });
  }

  const rows = (rowsResult.data ?? []) as EkanyaBackflowRow[];
  const projectRows = summarizeProjectRows(rows);
  const summary = summarizeAllRows(rows);

  return NextResponse.json({
    range: {
      startDate: range.startDate,
      endDate: range.endDate,
      dateType,
    },
    summary,
    projectRows,
    emptyState: {
      hasEkanyaBackflow: rows.length > 0,
    },
  });
}

function summarizeProjectRows(rows: EkanyaBackflowRow[]) {
  const grouped = new Map<string, EkanyaBackflowRow[]>();

  rows.forEach((row) => {
    const projectName = normalizeProjectName(getProjectName(row));
    grouped.set(projectName, [...(grouped.get(projectName) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([projectName, projectRows]) => {
      const leadCount = projectRows.length;
      const appointmentCount = projectRows.filter((row) => isPositiveStatus(row.appointment_status)).length;
      const visitCount = projectRows.filter((row) => isPositiveStatus(row.visit_status) || Boolean(row.visit_date)).length;
      const dealCount = projectRows.filter((row) => isPositiveStatus(row.deal_status) || Boolean(row.deal_date) || toNumber(row.paid_amount) > 0).length;
      const paidAmount = projectRows.reduce((total, row) => total + toNumber(row.paid_amount), 0);

      return {
        projectName,
        leadCount,
        appointmentCount,
        visitCount,
        dealCount,
        paidAmount,
        avgPaidAmount: safeDivide(paidAmount, dealCount),
        mainSourcePlatform: getMainSourcePlatform(projectRows),
        visitRate: safeDivide(visitCount, appointmentCount || leadCount),
        dealRate: safeDivide(dealCount, visitCount),
        observationCycle: getObservationCycle(projectName),
        currentJudgment: getCurrentJudgment(projectName, leadCount, visitCount, dealCount, paidAmount),
      };
    })
    .sort((a, b) => b.paidAmount - a.paidAmount || b.leadCount - a.leadCount || a.projectName.localeCompare(b.projectName, "zh-CN"));
}

function summarizeAllRows(rows: EkanyaBackflowRow[]) {
  const leadCount = rows.length;
  const appointmentCount = rows.filter((row) => isPositiveStatus(row.appointment_status)).length;
  const visitCount = rows.filter((row) => isPositiveStatus(row.visit_status) || Boolean(row.visit_date)).length;
  const dealCount = rows.filter((row) => isPositiveStatus(row.deal_status) || Boolean(row.deal_date) || toNumber(row.paid_amount) > 0).length;
  const paidAmount = rows.reduce((total, row) => total + toNumber(row.paid_amount), 0);

  return {
    leadCount,
    appointmentCount,
    visitCount,
    dealCount,
    paidAmount,
    avgPaidAmount: safeDivide(paidAmount, dealCount),
    visitRate: safeDivide(visitCount, appointmentCount || leadCount),
    dealRate: safeDivide(dealCount, visitCount),
  };
}

function getProjectName(row: EkanyaBackflowRow) {
  return row.deal_project?.trim() || row.visit_project?.trim() || row.intention_project?.trim() || "其他";
}

function normalizeProjectName(projectName: string) {
  const text = projectName.trim().toLowerCase();

  if (/半口|全口|all\s*on|allon/.test(text)) return "半口/全口";
  if (/儿童早矫|早矫|儿早/.test(text)) return "儿童早矫";
  if (/窝沟|封闭/.test(text)) return "窝沟封闭";
  if (/涂氟|氟化/.test(text)) return "涂氟";
  if (/智齿|智慧齿/.test(text)) return "智齿";
  if (/洁牙|洗牙|喷砂|超声波洁治/.test(text)) return "洁牙";
  if (/补牙|树脂|充填/.test(text)) return "补牙";
  if (/拔牙|拔除/.test(text)) return "拔牙";
  if (/根管|牙髓|根尖/.test(text)) return "根管";
  if (/儿牙|儿童牙|儿童口腔|乳牙/.test(text)) return "儿牙";
  if (/正畸|矫正|牙套|隐形矫正|时代天使|隐适美/.test(text)) return "正畸";
  if (/种植|种牙|种植牙/.test(text)) return "种植";
  if (/修复|牙冠|冠修复|嵌体|义齿/.test(text)) return "修复";
  if (/牙周|牙龈|龈下|刮治/.test(text)) return "牙周";
  if (/美白|冷光/.test(text)) return "美白";
  if (/贴面|瓷贴面/.test(text)) return "贴面";
  if (/检查|拍片|ct|方案|评估|初诊/.test(text)) return "检查";

  return "其他";
}

function getMainSourcePlatform(rows: EkanyaBackflowRow[]) {
  const sourceCounts = new Map<string, number>();

  rows.forEach((row) => {
    const source = row.source_platform?.trim() || "未记录来源";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  });

  return Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "未记录来源";
}

function getObservationCycle(projectName: string) {
  if (projectName === "洁牙" || projectName === "检查") return "1-3天";
  if (["补牙", "拔牙", "智齿", "根管", "儿牙", "窝沟封闭", "涂氟"].includes(projectName)) return "3-7天";
  if (projectName === "半口/全口") return "15-60天";
  if (["正畸", "儿童早矫", "种植", "修复", "牙周", "美白", "贴面"].includes(projectName)) return "7-30天";
  return "3-7天";
}

function getCurrentJudgment(projectName: string, leadCount: number, visitCount: number, dealCount: number, paidAmount: number) {
  const visitRate = safeDivide(visitCount, leadCount) ?? 0;

  if (leadCount < 3) {
    return "样本太少，先不要下结论。";
  }

  if (paidAmount > 0) {
    return "这个项目已经产生实收，建议继续观察来源质量。";
  }

  if (["种植", "正畸", "儿童早矫", "半口/全口"].includes(projectName)) {
    if (dealCount === 0) return "高客单项目周期长，不能只看几天成交，建议观察 7-30 天。";
    return "先看方案沟通、复诊跟进和价格承接，不要马上否定投放。";
  }

  if (["洁牙", "补牙", "拔牙", "智齿", "根管", "儿牙", "窝沟封闭", "涂氟"].includes(projectName)) {
    if (visitRate < 0.4) return "前端有兴趣，但到院承接弱，先看客服邀约和到店路径。";
    if (visitCount > 0 && dealCount === 0) return "到院有了，重点看现场转化和项目升级。";
  }

  if (visitCount > 0 && dealCount === 0) {
    return "有到院但暂时没成交，先看医生方案、价格解释和复诊跟进。";
  }

  return "先按当前周期继续观察，不要只凭单日数据判断。";
}

function isPositiveStatus(value: string | null) {
  if (!value) return false;
  return /是|已|到|成交|预约|完成|yes|true|1/i.test(value);
}

function toNumber(value: NumericValue) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function resolveDateRange(startDateParam: string | null, endDateParam: string | null) {
  const today = new Date();
  const defaultEnd = formatDate(today);
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(today.getDate() - 6);

  const startDate = isDateString(startDateParam) ? startDateParam : formatDate(defaultStartDate);
  const endDate = isDateString(endDateParam) ? endDateParam : defaultEnd;

  return { startDate, endDate };
}

function buildEmptyResponse(startDate: string, endDate: string, dateType: string) {
  return {
    range: {
      startDate,
      endDate,
      dateType,
    },
    summary: {
      leadCount: 0,
      appointmentCount: 0,
      visitCount: 0,
      dealCount: 0,
      paidAmount: 0,
      avgPaidAmount: null,
      visitRate: null,
      dealRate: null,
    },
    projectRows: [],
    emptyState: {
      hasEkanyaBackflow: false,
    },
  };
}

function isDateString(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}