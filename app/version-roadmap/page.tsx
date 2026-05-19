import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

const versions: Array<[string, string[]]> = [
  ["V1.0 静态后台原型", ["搭建后台框架", "建立首页、上传页、分析页、建议页、设置页", "使用静态假数据", "不接数据库", "不接AI"]],
  ["V1.1 数据源与质量修复版", ["统一数据源状态", "补齐美团、e看牙、项目价格管理", "预留抖音、腾讯广点通、竞品情报", "新增数据质量检测", "修复匹配率逻辑", "建议卡加入置信度和人工确认"]],
  ["V1.2 经营辅助模块版", ["补齐项目分析维度", "补齐素材生产中心", "补齐投放知识库", "补齐指标公式中心", "补齐版本路线说明", "补齐目标值、复盘、操作记录、异常预警"]],
  ["V1.3 数据上传计算版", ["正式解析 Excel/CSV", "保存上传数据", "计算指标", "生成建议卡", "支持历史数据对比"]],
  ["V1.4 Supabase 存储版", ["接入 Supabase 数据库", "保存历史上传记录", "保存报告", "保存操作记录", "增加单账号登录"]],
  ["V1.5 OpenAI API 智能分析版", ["接入 OpenAI API", "生成日报", "生成建议卡解释", "生成素材脚本", "生成竞品情报结构化分析", "生成复盘总结"]],
  ["V1.6 素材生产增强版", ["接入图片/视频生成工具", "输出视频提示词", "辅助生成短视频脚本", "建立素材测试计划", "不自动发布广告"]],
  ["V1.7 多平台完整接入版", ["接入抖音信息流数据", "接入腾讯广点通数据", "支持多平台对比", "支持素材维度归因", "支持平台级预算建议"]],
  ["V2.0 经营决策系统版", ["数据上传", "数据质量检测", "指标计算", "AI建议", "人工确认", "执行记录", "复盘优化", "形成完整经营闭环"]],
];

export default function VersionRoadmapPage() {
  return (
    <AppShell activeHref="/version-roadmap">
      <PageHeader
        eyebrow="基础设置"
        title="版本路线说明"
        description="说明每个版本能做什么、不能做什么，避免误以为当前版本已经全自动化。"
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {versions.map(([version, items]) => (
          <article key={version} className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-950">{version}</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
              {(items as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        当前系统仍处于 V1 阶段，所有建议均为辅助决策，不会替你修改广告后台，不会替你改价格，不会替你发布医疗广告。
      </section>
    </AppShell>
  );
}
