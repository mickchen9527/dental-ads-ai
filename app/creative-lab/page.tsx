import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TemporaryWorkflowNotice } from "@/components/temporary-workflow-notice";
import { pendingIntegrationNote, riskBoundaryNotes } from "@/lib/v12-static-data";

const diagnosis = [
  ["点击率低", "封面、标题、前三秒弱"],
  ["点击率高但咨询低", "页面承接或咨询入口弱"],
  ["咨询多但有效率低", "低价刺激吸引低质线索"],
  ["有效咨询高但预约低", "客服承接和到院理由不足"],
  ["到院高但成交低", "价格、方案、信任或医生面诊问题"],
];

const directions = [
  ["种植", "医生讲解型、价格透明型、材料对比型、方案评估型、中老年缺牙痛点型"],
  ["正畸", "学生暑期型、上班族形象型、隐形矫正对比型、分期付款型、嘴凸/牙齿拥挤科普型"],
  ["洁牙", "新客体验型、牙结石科普型、口气问题型、定期护理型"],
  ["补牙", "蛀牙早期症状型、儿童补牙科普型、材料差异型"],
  ["儿牙", "窝沟封闭、涂氟、儿童蛀牙、家长决策型"],
  ["拔牙", "智齿疼痛型、拔牙流程科普型、术前注意事项型"],
  ["修复/贴面/美白", "美观改善型、材料选择型、真实需求科普型、审美咨询型"],
  ["牙周/根管", "症状识别型、治疗必要性科普型、医生信任型"],
];

const testPlan = [
  ["本周测试项目", "种植、正畸、洁牙、儿牙"],
  ["测试方向", "医生讲解、方案评估、价格透明、信任背书"],
  ["每个方向素材数量", "3条短视频或3组页面素材"],
  ["观察周期", "洁牙1-3天，种植/正畸7-30天"],
  ["核心指标", "点击率、有效咨询率、到院率、成交成本、实收 ROI"],
  ["停投规则", "有效咨询率连续低于目标且样本量足够"],
  ["放量规则", "实收 ROI 达到参考线且数据质量合格后小幅放量"],
];

const platformScope = [
  ["美团", "页面/套餐优化方向，当前已用于V1展示。"],
  ["抖音", "短视频脚本/分镜/视频提示词方向，入口已开放，暂不参与计算。"],
  ["腾讯广点通", "信息流表单素材方向，入口已开放，暂不参与计算。"],
  ["大众点评", "公开页面和评价需求参考，不抓取登录后数据。"],
  ["小红书", "公开内容选题参考，不采集私信或个人隐私。"],
  ["e看牙", "后端承接结果参考，用于判断素材线索质量。"],
  ["竞品情报", "公开页面市场参考，不参与当前核心计算。"],
];

export default function CreativeLabPage() {
  return (
    <AppShell activeHref="/creative-lab">
      <PageHeader
        eyebrow="生产中心"
        title="素材生产中心"
        description="素材生产中心用于把投放数据问题转化为可拍摄、可测试的短视频/图文素材方案。当前 V1.2 只生成脚本、分镜、封面文案、视频提示词和测试计划，不直接生成真实视频，不自动发布广告。"
      />

      <TemporaryWorkflowNotice kind="reserved" />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p>{pendingIntegrationNote}</p>
        <p>{riskBoundaryNotes.join(" ")}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Block title="素材问题诊断" rows={diagnosis} />
        <Block title="素材方向推荐" rows={directions} />
      </section>

      <section className="mt-6">
        <Block title="平台分类与接入状态" rows={platformScope} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">脚本生成预览</h3>
          <dl className="mt-4 space-y-3">
            <Field label="标题" value="种植牙为什么不能只看低价？医生讲清检查和方案" />
            <Field label="前三秒钩子" value="缺牙很久，真的适合直接种吗？先看这三个检查点。" />
            <Field label="口播稿" value="种植牙不是只看一颗多少钱，要先看牙槽骨条件、咬合情况和全身基础情况。到院检查后，医生会根据CT和口腔情况给出方案。" />
            <Field label="分镜" value="诊室环境 -> 医生讲解 -> CT检查画面 -> 方案沟通 -> 到院引导" />
            <Field label="画面建议" value="真实门诊、医生讲解、设备和检查流程，避免夸张对比。" />
            <Field label="字幕文案" value="先检查，再定方案；价格要看材料、骨量和修复方式。" />
            <Field label="封面文案" value="种牙前先看这3件事" />
            <Field label="结尾引导" value="需要先判断是否适合种植，可预约到院检查和方案评估。" />
            <Field label="合规风险提醒" value="不承诺治疗效果，不虚构医生资质，不使用极限词，发布前必须人工审核。" />
          </dl>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">AI视频提示词</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            本区域用于生成给 Sora、即梦、可灵、剪映AI 等工具使用的视频提示词。当前系统不直接生成视频。
          </p>
          <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            真实医疗科普风格，干净明亮的口腔门诊环境，医生以专业克制的方式讲解种植牙检查流程。不要虚构医生资质，不虚构患者案例，不承诺治疗效果，不使用极限词，画面强调检查、方案评估、材料说明和人工审核。所有素材必须由人工审核后再使用。
          </div>
        </article>
      </section>

      <section className="mt-6">
        <Block title="素材测试计划" rows={testPlan} />
      </section>
    </AppShell>
  );
}

function Block({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <Field key={label} label={label} value={value} />
        ))}
      </dl>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}
