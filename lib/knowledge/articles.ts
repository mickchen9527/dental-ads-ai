export type KnowledgeArticle = {
  slug: string;
  title: string;
  category: string;
  level: "入门" | "进阶" | "重要";
  summary: string;
  scenario: string;
  formula?: string;
  example: string;
  normalInterpretation: string;
  highLowMeaning: string;
  mistakes: string[];
  actionSteps: string[];
  relatedPages: string[];
  doNotConcludeWhen: string;
  relatedArticles: string[];
};

type Seed = {
  slug: string;
  title: string;
  category: string;
  level?: KnowledgeArticle["level"];
  formula?: string;
  summary: string;
  scenario: string;
  action: string;
};

const seeds: Seed[] = [
  { slug: "impressions", title: "什么是曝光", category: "基础指标", level: "入门", summary: "曝光是广告被展示的次数。", scenario: "曝光低时用于判断流量是否拿得到。", action: "先看预算是否花出去，再看点击率，再判断素材或出价问题。" },
  { slug: "ctr", title: "什么是点击率 CTR", category: "基础指标", level: "入门", formula: "点击率 = 点击数 / 曝光数 × 100%", summary: "点击率表示看到广告的人里有多少愿意点击。", scenario: "点击率低时优先查封面、标题、主图、前三秒和人群。", action: "不要只因为点击率高就加预算，要继续看咨询和成交。" },
  { slug: "cpc", title: "什么是点击成本 CPC", category: "基础指标", formula: "点击成本 = 消耗 / 点击数", summary: "点击成本表示买到一次点击需要花多少钱。", scenario: "用于判断广告流量获取成本。", action: "点击成本高不一定亏，点击成本低也不一定赚，要继续看咨询率、有效咨询率和成交成本。" },
  { slug: "consultation-rate", title: "什么是咨询率", category: "基础指标", formula: "咨询率 = 咨询数 / 点击数 × 100%", summary: "咨询率表示点击后有多少人进入咨询。", scenario: "点击多但咨询少时用于定位页面和入口问题。", action: "检查页面、价格表达、咨询入口和套餐解释。" },
  { slug: "consultation-cost", title: "什么是咨询成本", category: "基础指标", formula: "咨询成本 = 消耗 / 咨询数", summary: "咨询成本只是前端指标，不代表成交质量。", scenario: "用于粗看获取咨询是否太贵。", action: "继续看有效咨询率、到院率和毛利ROI。" },
  { slug: "valid-consultation-rate", title: "什么是有效咨询率", category: "基础指标", formula: "有效咨询率 = 有效咨询数 / 咨询数 × 100%", summary: "有效咨询率比咨询成本更重要。", scenario: "用于判断线索质量。", action: "有效咨询率低说明线索质量差，先换素材或提高线索门槛。" },
  { slug: "valid-consultation-cost", title: "什么是有效咨询成本", category: "基础指标", formula: "有效咨询成本 = 消耗 / 有效咨询数", summary: "有效咨询成本比咨询成本更接近真实投放质量。", scenario: "用于比较不同项目和素材的真实线索成本。", action: "结合预约率、到院率继续拆解。" },
  { slug: "appointment-rate", title: "什么是预约率", category: "基础指标", formula: "预约率 = 预约数 / 有效咨询数 × 100%", summary: "预约率用于判断客服是否能把有效咨询约到院。", scenario: "有效咨询高但预约低时使用。", action: "优化客服话术、活动解释和到院理由。" },
  { slug: "arrival-rate", title: "什么是到院率", category: "基础指标", formula: "到院率 = 到院数 / 预约数 × 100%", summary: "到院率表示预约客户是否真的到院。", scenario: "预约高但到院低时使用。", action: "检查预约提醒、客户距离、时间安排和到院权益。" },
  { slug: "deal-rate", title: "什么是成交率", category: "基础指标", formula: "成交率 = 成交数 / 到院数 × 100%", summary: "成交率表示到院客户最终成交比例。", scenario: "到院高但成交低时使用。", action: "复盘医生方案、价格落差、信任不足和付款压力。" },
  { slug: "cpa", title: "什么是成交成本 CPA", category: "基础指标", formula: "成交成本 = 广告消耗 / 成交数", summary: "CPA表示获得一笔成交的广告成本。", scenario: "用于判断预算是否值得继续投。", action: "不同项目不能用同一成交成本标准。" },
  { slug: "roi", title: "什么是 ROI", category: "基础指标", formula: "ROI = 成交金额 / 广告消耗", summary: "ROI看的是产出金额，不是利润。", scenario: "用于粗看收入产出比。", action: "继续看毛利ROI，避免高收入低利润误判。" },
  { slug: "gross-profit-roi", title: "什么是毛利 ROI", category: "基础指标", formula: "毛利ROI = 毛利 / 广告消耗；毛利 = 成交金额 - 项目成本", summary: "毛利ROI比普通ROI更重要。", scenario: "用于判断投放是否真正赚钱。", action: "低于1时不建议继续放量。" },
  { slug: "platform-lead-return-rate", title: "什么是平台线索回流率", category: "基础指标", level: "重要", formula: "平台线索回流率 = e看牙承接记录数 / 平台总线索数", summary: "它判断前端线索有多少进入后端承接数据。", scenario: "数据质量检测时必须看。", action: "该指标低时，AI建议置信度要降低。" },
  { slug: "ekanya-match-rate", title: "什么是 e看牙记录匹配率", category: "基础指标", level: "重要", formula: "e看牙记录匹配率 = 成功匹配数 / e看牙承接记录数", summary: "它只代表已回流记录能不能匹配来源。", scenario: "用于判断后端记录来源是否清楚。", action: "不要把它当成整体线索回流率。" },
  { slug: "cheap-consultation-not-always-good", title: "为什么咨询成本低不一定好", category: "投放判断", level: "重要", summary: "咨询便宜可能是低质线索。", scenario: "咨询成本下降但成交没有改善时。", action: "如果咨询成本低但有效咨询率低，不要加预算，先换素材或提高线索门槛。" },
  { slug: "high-ctr-not-equal-good", title: "为什么点击率高不等于效果好", category: "投放判断", summary: "点击率高只代表用户愿意点，不代表愿意咨询、到院、成交。", scenario: "素材点击率很好但咨询或成交差时。", action: "继续看咨询率、有效咨询率和成交成本。" },
  { slug: "valid-rate-more-important", title: "为什么有效咨询率比咨询成本更重要", category: "投放判断", summary: "有效咨询才有可能预约和成交。", scenario: "咨询很多但有效率差时。", action: "优先提升线索质量，而不是只追求便宜咨询。" },
  { slug: "implant-not-same-day", title: "为什么种植不能只看当天成交", category: "投放判断", level: "重要", summary: "种植是高客单长决策项目。", scenario: "当天无成交但咨询和到院正常时。", action: "种植看7-30天，半口全口看15-60天。" },
  { slug: "ortho-7-30-days", title: "为什么正畸要看7-30天", category: "投放判断", summary: "正畸决策周期长，用户会对比、咨询家人、看医生资质。", scenario: "正畸短期成交低时。", action: "观察7-30天成交回流，不因单日数据直接暂停。" },
  { slug: "cleaning-follow-up", title: "为什么洁牙要看后续转化", category: "投放判断", summary: "洁牙低客单，但可能带来补牙、牙周、正畸、种植线索。", scenario: "洁牙ROI看起来不高时。", action: "追踪后续项目转化价值。" },
  { slug: "when-increase-budget", title: "什么情况下该加预算", category: "投放判断", level: "重要", summary: "加预算必须建立在数据质量和毛利ROI达标之上。", scenario: "考虑扩大投放时。", action: "数据质量合格、有效咨询率达标、到院率达标、成交成本低于目标、毛利ROI达标，再小幅加预算。" },
  { slug: "when-reduce-budget", title: "什么情况下该降预算", category: "投放判断", summary: "降预算适合持续低质或毛利ROI不足的场景。", scenario: "消耗高但有效线索和成交差时。", action: "有效咨询率低、低质线索多、成交成本高、毛利ROI低且观察周期足够时再降。" },
  { slug: "when-pause", title: "什么情况下该暂停", category: "投放判断", summary: "暂停适用于连续多天消耗但无有效线索，或素材低质严重。", scenario: "计划持续无效时。", action: "高客单项目不能因单日无成交直接暂停。" },
  { slug: "when-observe", title: "什么情况下只建议观察", category: "投放判断", summary: "样本量太少时，不适合立刻下结论。", scenario: "数据周期短、回流不足、竞品信息不完整时。", action: "先继续观察并补齐数据。" },
  { slug: "low-quality-no-major-change", title: "为什么数据质量低时不建议重大调整", category: "投放判断", level: "重要", summary: "数据不完整时，系统建议只能作为参考。", scenario: "数据质量评分低于70分时。", action: "先修数据，再判断预算或价格。" },
  { slug: "no-frequent-price-change", title: "为什么不建议频繁调价", category: "价格策略", level: "重要", summary: "频繁调价会造成客户不信任、员工口径混乱、平台页面不同步。", scenario: "短期转化波动时。", action: "先优化价格表达，不要频繁改成交价。" },
  { slug: "when-lower-price", title: "什么情况下才考虑降价", category: "价格策略", summary: "降价需要有明确价格流失证据。", scenario: "价格高流失占比持续高时。", action: "确认竞品条件、毛利空间和观察周期后，小范围测试。" },
  { slug: "when-raise-price", title: "什么情况下反而应该涨价", category: "价格策略", summary: "低价可能吸引低质线索并压缩服务资源。", scenario: "低价线索多但成交毛利不足时。", action: "提高价格门槛或改成方案评估引流。" },
  { slug: "price-expression", title: "什么是价格表达优化", category: "价格策略", summary: "不是降价，而是讲清包含项、材料、医生、服务和限制条件。", scenario: "用户只问价格或误解套餐时。", action: "优化标题、购买须知和FAQ。" },
  { slug: "price-tiers", title: "什么是价格梯度", category: "价格策略", summary: "设置基础版、标准版、升级版，帮助不同需求客户选择。", scenario: "项目选择复杂时。", action: "用价格梯度承接不同预算和需求。" },
  { slug: "checkup-plan-lead", title: "什么是检查/方案引流", category: "价格策略", summary: "高客单项目不一定直接卖成交价，可以先引导检查和方案评估。", scenario: "种植、正畸、贴面等方案型项目。", action: "强调检查、医生面诊和方案评估价值。" },
  { slug: "competitor-low-price", title: "为什么竞品低价不能直接跟价", category: "价格策略", level: "重要", summary: "竞品价格可能有限制条件、可能不含材料、可能只是引流价。", scenario: "看到竞品低价活动时。", action: "先拆解竞品活动条件和可信度。" },
  { slug: "price-loss-ratio", title: "为什么价格高流失占比很重要", category: "价格策略", summary: "只有客户真实因为价格流失，价格才是主要问题。", scenario: "考虑调价时。", action: "复盘未成交原因，不要只凭感觉调价。" },
  { slug: "gross-profit-roi-more-important", title: "为什么毛利ROI比普通ROI更重要", category: "价格策略", summary: "成交金额高不代表赚钱，要看扣除项目成本后的毛利。", scenario: "ROI看起来不错但利润薄时。", action: "预算建议优先看毛利ROI。" },
  { slug: "low-price-creative", title: "什么是低价强刺激素材", category: "素材判断", summary: "主要靠低价吸引咨询，容易带来只问价格的低质客户。", scenario: "咨询成本低但有效率低时。", action: "减少极端低价表达，增加服务和信任信息。" },
  { slug: "doctor-explain-creative", title: "什么是医生讲解型素材", category: "素材判断", summary: "通过医生解释项目、材料、流程和注意事项，提升信任。", scenario: "高客单项目或信任不足时。", action: "用医生口播解释方案和风险边界。" },
  { slug: "trust-creative", title: "什么是信任型素材", category: "素材判断", summary: "强调医生资质、流程透明、服务体验、材料说明。", scenario: "到院高但成交低时。", action: "补充医生、材料、服务和流程说明。" },
  { slug: "plan-evaluation-creative", title: "什么是方案评估型素材", category: "素材判断", summary: "引导用户先做检查和方案，而不是直接被低价吸引。", scenario: "种植、正畸、贴面等项目。", action: "把到院价值从低价改为方案评估。" },
  { slug: "science-creative", title: "什么是科普型素材", category: "素材判断", summary: "用口腔问题解释需求，适合提升认知和筛选用户。", scenario: "用户不了解症状风险时。", action: "用症状识别和治疗必要性做内容。" },
  { slug: "judge-low-quality-creative", title: "如何判断素材吸引的是低质线索", category: "素材判断", summary: "咨询成本低，但有效咨询率、预约率、到院率都低。", scenario: "素材看起来热闹但成交差时。", action: "看有效咨询率和到院率，不只看点击。" },
  { slug: "views-not-good", title: "为什么播放量高不代表素材好", category: "素材判断", summary: "播放量只是曝光和兴趣，不代表线索质量和成交。", scenario: "短视频曝光很好但有效咨询差时。", action: "结合有效咨询率、成交成本和毛利ROI判断。" },
  { slug: "creative-test-cycle", title: "如何设置素材测试周期", category: "素材判断", summary: "低客单项目看1-3天，高客单项目看7-30天。", scenario: "素材刚上线时。", action: "按项目客单和决策周期设置观察窗口。" },
  { slug: "short-video-valid-rate", title: "为什么短视频素材要看有效咨询率", category: "素材判断", summary: "短视频容易吸引泛流量，所以必须看有效线索。", scenario: "抖音或信息流素材测试时。", action: "不要只看播放、点赞和点击。" },
  { slug: "meituan-data", title: "美团数据怎么看", category: "平台理解", summary: "先看曝光、点击、商户浏览、咨询、团购订单，再接e看牙看预约、到院、成交。", scenario: "分析美团推广效果时。", action: "前端和后端数据合起来看。" },
  { slug: "douyin-data", title: "抖音信息流数据怎么看", category: "平台理解", summary: "当前入口已开放，但暂不参与计算。后续重点看素材、消耗、点击、私信/表单、有效线索、成交回流。", scenario: "后续接入抖音数据时。", action: "先建立字段映射和后端归因。" },
  { slug: "gdt-data", title: "腾讯广点通数据怎么看", category: "平台理解", summary: "当前入口已开放，但暂不参与计算。后续重点看表单、电话、有效率、到院率和成交成本。", scenario: "后续接入广点通数据时。", action: "不要在V1阶段误认为已参与评分。" },
  { slug: "ekanya-role", title: "e看牙数据在系统里起什么作用", category: "平台理解", level: "重要", summary: "它是后端承接和成交数据来源。", scenario: "判断广告有没有真实经营结果时。", action: "用它判断预约、到院、成交和成交金额。" },
  { slug: "competitor-reference", title: "竞品情报为什么只能作为参考", category: "平台理解", summary: "竞品页面只能看到公开展示，不能看到真实成交成本和毛利。", scenario: "参考竞品价格和活动时。", action: "只做内部参考，不直接跟价。" },
  { slug: "why-pending-douyin-gdt", title: "为什么抖音和广点通当前暂不参与计算", category: "平台理解", summary: "因为字段映射和后端归因还没配置，当前不参与评分和计算。", scenario: "看到入口已开放但暂不参与计算标签时。", action: "不要把示例数据当成真实计算结果。" },
  { slug: "daily-first-step", title: "每天打开系统第一步看什么", category: "每日操作流程", level: "重要", summary: "先看数据质量，再看经营指标和异常。", scenario: "每天开始运营工作时。", action: "先看数据质量检测，再看首页驾驶舱、异常预警、今日执行清单、建议卡。" },
  { slug: "after-upload-check", title: "上传数据后应该怎么检查", category: "每日操作流程", summary: "上传后先确认数据能不能用于建议。", scenario: "刚导入表格后。", action: "看是否上传成功、字段缺失、数据质量评分、平台线索回流率和AI建议置信度。" },
  { slug: "handle-recommendation", title: "看到系统建议后怎么处理", category: "每日操作流程", summary: "建议必须经过人工确认。", scenario: "处理建议卡时。", action: "先看置信度、数据依据、风险提醒，再确认是否执行，执行后记录操作。" },
  { slug: "can-adjust-budget-today", title: "如何判断今天能不能调预算", category: "每日操作流程", level: "重要", summary: "调预算前先确认数据质量、样本量、观察周期和毛利ROI。", scenario: "准备调预算时。", action: "数据质量合格、样本足够、周期足够、毛利ROI达标后再人工确认。" },
  { slug: "weekly-review", title: "如何做一周复盘", category: "每日操作流程", summary: "复盘建议是否有效，才能优化规则。", scenario: "每周复盘时。", action: "看建议数量、执行情况、3天/7天结果、有效建议和需要调整的规则。" },
];

export const knowledgeArticles: KnowledgeArticle[] = seeds.map((seed, index) => ({
  slug: seed.slug,
  title: seed.title,
  category: seed.category,
  level: seed.level ?? (index % 5 === 0 ? "重要" : index % 3 === 0 ? "进阶" : "入门"),
  summary: seed.summary,
  scenario: seed.scenario,
  formula: seed.formula,
  example: seed.formula
    ? `例如：如果${seed.title.replace("什么是", "")}相关数据为100和20，就按公式计算并结合后端成交判断。`
    : `例如：当你遇到“${seed.scenario}”，不要只看单一指标，要继续拆解后端转化。`,
  normalInterpretation: "正常情况下，要把前端指标、承接指标和成交结果放在一起看。",
  highLowMeaning: "偏高或偏低都不能单独下结论，需要结合项目类型、观察周期和数据质量。",
  mistakes: [
    "只看单日数据就下结论。",
    "只看便宜线索，不看有效咨询和成交。",
    "忽略数据回流和字段缺失。",
  ],
  actionSteps: [
    seed.action,
    "确认数据质量评分和AI建议置信度。",
    "执行前人工确认，执行后记录3天和7天结果。",
  ],
  relatedPages: ["/dashboard", "/data-quality", "/recommendations"],
  doNotConcludeWhen: "样本量太少、观察周期不足、平台线索回流率低、成交金额缺失或高客单项目还未满观察周期时，不要急着下结论。",
  relatedArticles: seeds
    .filter((item) => item.category === seed.category && item.slug !== seed.slug)
    .slice(0, 3)
    .map((item) => item.slug),
}));

export const knowledgeCategories = [
  "基础指标",
  "投放判断",
  "价格策略",
  "素材判断",
  "平台理解",
  "数据质量",
  "每日操作流程",
  "常见问题",
];

const articleAliases: Record<string, string> = {
  "check-after-upload": "after-upload-check",
  "handle-system-suggestion": "handle-recommendation",
  "adjust-budget-checklist": "can-adjust-budget-today",
  "low-consult-cost-not-always-good": "cheap-consultation-not-always-good",
};

export function getKnowledgeArticle(slug: string) {
  const resolvedSlug = articleAliases[slug] ?? slug;
  return knowledgeArticles.find((article) => article.slug === resolvedSlug);
}
