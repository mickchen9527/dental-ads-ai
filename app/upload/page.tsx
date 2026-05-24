"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageHelpButton } from "@/components/page-help-button";
import { StorageNote } from "@/components/storage-note";
import { UploadedDataManager } from "@/components/uploaded-data-manager";
import { pendingIntegrationNote } from "@/lib/v12-static-data";

type UploadEntry = {
  name: string;
  platform: string;
  frequency: string;
  purpose: string;
  fields?: string;
  tip: string;
};

const platformDataGroups = [
  {
    platform: "美团数据",
    items: [
      {
        name: "美团推广汇总数据",
        frequency: "每日建议上传",
        purpose: "看推广计划整体表现",
        fields: "推广名称、推广门店、花费、曝光、点击、点击均价、商户浏览量、查看电话、在线咨询点击、订单量、团购订单量、15日团购订单量",
        tip: "这是推广计划表，不是关键词表。",
      },
      {
        name: "美团关键词数据",
        frequency: "每 3-7 天上传 / 调关键词前上传",
        purpose: "判断哪些词保留、加价、降价、暂停",
        fields: "关键词、花费、曝光、点击、点击均价、商户浏览量、查看电话、在线咨询点击、订单量、团购订单量、15日团购订单量",
        tip: "这个入口必须上传包含“关键词”字段的报表，不能用美团推广汇总表代替。",
      },
      {
        name: "美团订单/团购明细",
        frequency: "可选上传",
        purpose: "看团购订单和核销情况",
        fields: "订单日期、订单号、团购项目、门店、核销状态、订单金额、客户备注",
        tip: "如果暂时没有这张表，不影响基础美团分析。",
      },
    ],
  },
  {
    platform: "抖音数据",
    items: [
      {
        name: "抖音广告计划汇总数据",
        frequency: "每日或投放日上传",
        purpose: "看计划整体花费、点击和转化",
        fields: "日期、计划名称、消耗、展示、点击、点击率、点击成本、转化数、转化成本",
        tip: "这是计划汇总表，用来看计划整体表现。",
      },
      {
        name: "抖音素材/创意数据",
        frequency: "每 3-7 天上传 / 换素材前上传",
        purpose: "判断哪个视频素材该保留、暂停、继续测试",
        fields: "日期、素材名称、视频名称、计划名称、消耗、展示、点击、点击率、播放量、完播率、私信、表单、转化、转化成本",
        tip: "这是素材表，不是计划汇总表。",
      },
      {
        name: "抖音表单/私信线索数据",
        frequency: "能导就上传",
        purpose: "判断线索质量",
        fields: "线索时间、来源计划、来源素材、客户编号/姓名、手机号后四位、项目意向、表单内容、线索状态、备注",
        tip: "如果暂时不能导出，就先靠 e看牙记录来源。",
      },
    ],
  },
  {
    platform: "腾讯广点通数据",
    items: [
      {
        name: "腾讯账户/计划汇总数据",
        frequency: "每日或投放日上传",
        purpose: "看整体消耗和转化成本",
        fields: "日期、账户、计划名称、广告组、消耗、曝光、点击、点击率、点击成本、转化、转化成本",
        tip: "这是计划汇总表，用来看账户和计划整体表现。",
      },
      {
        name: "腾讯广告组/创意数据",
        frequency: "每 3-7 天上传 / 调创意前上传",
        purpose: "判断哪个创意有效",
        fields: "日期、计划名称、广告组、创意名称、消耗、曝光、点击、点击率、表单、电话、转化、转化成本",
        tip: "这是创意表，不是计划汇总表。",
      },
      {
        name: "腾讯表单/电话线索数据",
        frequency: "能导就上传",
        purpose: "判断线索质量",
        fields: "线索时间、来源计划、来源创意、来源方式、客户编号/姓名、手机号后四位、项目意向、线索状态、备注",
        tip: "能导出就上传，不能导出就先靠 e看牙补来源。",
      },
    ],
  },
  {
    platform: "高德数据",
    items: [
      {
        name: "高德推广汇总数据",
        frequency: "投放后上传",
        purpose: "看整体花费和点击",
        fields: "日期、推广名称、花费、曝光、点击、点击成本",
        tip: "这是高德推广花费表。",
      },
      {
        name: "高德电话/导航/门店访问数据",
        frequency: "重点上传",
        purpose: "判断本地到店意向",
        fields: "日期、电话、导航、地址查看、门店访问、路线规划、收藏、分享",
        tip: "高德重点看电话、导航、地址查看和门店访问，不是团购。",
      },
      {
        name: "高德线索数据",
        frequency: "能导就上传",
        purpose: "判断高德来的客户有没有进 e看牙",
        fields: "线索时间、来源方式、客户编号/姓名、手机号后四位、项目意向、线索状态、备注",
        tip: "如果高德不能导线索，就靠 e看牙记录来源。",
      },
    ],
  },
  {
    platform: "e看牙数据",
    items: [
      {
        name: "e看牙患者来源分析",
        frequency: "每日建议上传",
        purpose: "看客户来源平台",
        fields: "日期、平台、来源方式、客户编号/姓名、手机号后四位、项目意向、接待人员、备注",
        tip: "来源不清楚时，先补这张表。",
      },
      {
        name: "e看牙患者就诊分析",
        frequency: "每日或每周上传",
        purpose: "看是否预约、到院、初诊",
        fields: "日期、客户编号/姓名、预约状态、到院状态、初诊项目、接待人员、医生、备注",
        tip: "这张表用来判断后端有没有接住线索。",
      },
      {
        name: "e看牙成交收费明细",
        frequency: "每日或每周上传",
        purpose: "看是否成交、实收金额、实收 ROI",
        fields: "日期、客户编号/姓名、成交项目、实收金额、收费时间、医生、接待人员、备注",
        tip: "没有实收金额，就不要急着判断 ROI。",
      },
    ],
  },
  {
    platform: "项目价格表入口",
    items: [
      {
        name: "e看牙项目价格表",
        frequency: "第一次使用时导入",
        purpose: "生成项目价格库，后续用于统一项目价格口径",
        fields: "项目名称、项目分类、e看牙系统价，其他字段后续可手动补充",
        tip: "第一次使用时，可以去项目价格管理导入 e看牙项目价格表。后续价格有变化时，直接新增、编辑、停用或删除项目。",
      },
    ],
  },
];

const dailyUploadEntries: UploadEntry[] = [
  { ...platformDataGroups[0].items[0], platform: "美团" },
  {
    name: "e看牙后端回流数据",
    platform: "e看牙",
    frequency: "每日或每周上传",
    purpose: "看客户有没有进系统、有没有到院、有没有成交、有没有实收",
    fields: "如果你的 e看牙导出表是一张综合表，就先上传综合表；如果以后能分来源、就诊、收费三张表，再细分上传",
    tip: "新手阶段不要强制拆太多入口，先把来源、到院、成交、实收对上。",
  },
  { ...platformDataGroups[1].items[0], platform: "抖音" },
  { ...platformDataGroups[2].items[0], platform: "腾讯广点通" },
  { ...platformDataGroups[3].items[0], platform: "高德" },
];

const adjustmentUploadEntries: UploadEntry[] = [
  { ...platformDataGroups[0].items[1], platform: "美团" },
  { ...platformDataGroups[1].items[1], platform: "抖音" },
  { ...platformDataGroups[2].items[1], platform: "腾讯广点通" },
  { ...platformDataGroups[3].items[1], platform: "高德" },
];

const advancedUploadEntries: UploadEntry[] = [
  { ...platformDataGroups[0].items[2], platform: "美团" },
  { ...platformDataGroups[1].items[2], platform: "抖音" },
  { ...platformDataGroups[2].items[2], platform: "腾讯广点通" },
  { ...platformDataGroups[3].items[2], platform: "高德" },
  {
    name: "竞品数据",
    platform: "竞品情报",
    frequency: "需要看市场参考时上传",
    purpose: "参考竞品项目、价格表达、活动包装、差评关键词",
    fields: "竞品名称、平台、项目、展示价格、活动机制、限制条件、主卖点、页面链接、评论区高频问题、差评关键词、可信度等级、备注",
    tip: "竞品情报仅作参考，不直接决定调价，不直接决定预算。",
  },
];

export default function UploadPage() {
  const [typeFiles, setTypeFiles] = useState<Record<string, string>>({});
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <AppShell activeHref="/upload">
      <PageHeader
        eyebrow="统一导入口径"
        title="数据上传"
        description="先上传平台前端数据，再上传 e看牙回流数据。上传完不要急着看建议，先去检查数据质量。"
        action={
          <PageHelpButton
            purpose="把各个平台导出的表格放进系统，先看看字段和前10行。"
            when="每天投放结束后、调预算前、周报前看。"
            focus={["文件名", "字段列表", "缺失字段", "是否参与计算"]}
            next="按推荐顺序上传完，再去数据质量检测。"
            mistakes={["不要只上传平台表，不上传 e看牙。", "不要字段缺失还直接看建议。"]}
          />
        }
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
        <p>{pendingIntegrationNote}</p>
        <p>当前已开放上传入口和字段预览，暂未纳入核心评分和建议计算。待字段映射配置完成后再参与计算。</p>
      </section>

      <div className="mb-6">
        <StorageNote />
      </div>

      <section className="mb-6 rounded-md border border-cyan-100 bg-cyan-50 p-4">
        <h3 className="text-base font-semibold text-slate-950">推荐上传顺序</h3>
        <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
          <li className="rounded-md bg-white p-3"><strong>1. 上传平台前端数据：</strong>美团 / 抖音 / 腾讯 / 高德。每日建议上传。</li>
          <li className="rounded-md bg-white p-3"><strong>2. 上传平台细分数据：</strong>美团关键词 / 抖音素材 / 腾讯创意 / 高德电话导航。每 3-7 天上传。</li>
          <li className="rounded-md bg-white p-3"><strong>3. 上传 e看牙后端回流数据：</strong>患者来源分析 / 患者就诊分析 / 成交收费明细。调整前必须上传。</li>
          <li className="rounded-md bg-white p-3"><strong>4. 检查数据质量：</strong>先看字段和回流，再看建议。</li>
          <li className="rounded-md bg-white p-3"><strong>5. 进入对应平台页面：</strong>看美团、抖音、腾讯或高德的建议。有调整时再上传更新。</li>
          <li className="rounded-md bg-white p-3"><strong>可选上传：</strong>竞品情报和素材标签，用于辅助判断。</li>
        </ol>
      </section>

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-base font-semibold text-slate-950">不能混传</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">
          请按数据类型上传，不同入口不能混传。系统后续会根据字段判断文件是否匹配。
        </p>
        <div className="mt-4 grid gap-2 text-sm leading-6 text-amber-900 md:grid-cols-2">
          <p>美团推广汇总数据，不能上传到美团关键词入口。</p>
          <p>抖音计划汇总数据，不能上传到抖音素材入口。</p>
          <p>腾讯计划汇总数据，不能上传到腾讯创意入口。</p>
          <p>高德推广汇总数据，不能上传到高德电话/导航入口。</p>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-amber-800">
          当前为前端演示，接入解析功能后会自动检查字段是否匹配。
        </p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-950">上传频率说明</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FrequencyCard title="每日建议上传" items={["美团推广汇总数据", "已投放平台的计划汇总数据", "e看牙来源 / 就诊 / 收费数据"]} />
          <FrequencyCard title="每 3-7 天上传" items={["美团关键词数据", "抖音素材/创意数据", "腾讯广告组/创意数据", "高德电话/导航/门店访问数据"]} />
          <FrequencyCard title="调词/调素材/调创意前必须上传" items={["美团关键词数据", "抖音素材数据", "腾讯创意数据"]} />
          <FrequencyCard title="有价格变化时" items={["去项目价格管理新增、编辑、停用或删除项目", "不建议每次重新上传整张价格表"]} />
        </div>
      </section>

      <UploadLayer
        description="每天先传这些，先把广告花费和 e看牙结果对上。新手阶段先看这里就够了。"
        entries={dailyUploadEntries}
        selectedFiles={typeFiles}
        title="每日必传"
        onSelect={(name, fileName) => setTypeFiles((current) => ({ ...current, [name]: fileName }))}
        onUploaded={() => setRefreshToken((current) => current + 1)}
      />

      <UploadLayer
        description="这些不是每天都要传。只有你准备调词、换素材、调创意、判断高德到店意向前，再上传这些表。"
        entries={adjustmentUploadEntries}
        selectedFiles={typeFiles}
        title="调整前再传"
        onSelect={(name, fileName) => setTypeFiles((current) => ({ ...current, [name]: fileName }))}
        onUploaded={() => setRefreshToken((current) => current + 1)}
      />

      <details className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold text-slate-950">高级可选</summary>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          新手阶段可以先不传，不影响基础判断。需要看线索质量、团购质量、竞品参考时，再打开这里。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {advancedUploadEntries.map((entry) => (
            <UploadEntryCard
              key={entry.name}
              entry={entry}
              selectedFile={typeFiles[entry.name]}
              onSelect={(fileName) => setTypeFiles((current) => ({ ...current, [entry.name]: fileName }))}
              onUploaded={() => setRefreshToken((current) => current + 1)}
            />
          ))}
        </div>
      </details>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">项目价格管理</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            第一次使用时，可以去项目价格管理导入 e看牙项目价格表。后续价格有变化时，直接新增、编辑、停用或删除项目。
          </p>
          <Link className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/project-pricing">
            去项目价格管理维护价格
          </Link>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-base font-semibold text-slate-950">目标值设置</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            目标值不用天天改，有变化再进来调整。先把项目、观察周期和目标 ROI 口径定清楚，再看建议。
          </p>
          <Link className="mt-4 inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800" href="/targets">
            去目标值设置
          </Link>
        </article>
      </section>

      <section className="mt-6 flex flex-wrap gap-2 rounded-md border border-cyan-100 bg-cyan-50 p-4">
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/data-quality">
          前往数据质量检测
        </Link>
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/dashboard">
          查看首页汇总
        </Link>
        <Link className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-800 ring-1 ring-cyan-200" href="/recommendations">
          查看今日总建议
        </Link>
      </section>

      <UploadedDataManager
        key={refreshToken}
        description="这里读取 Supabase uploaded_files 的真实上传记录。上传后请在这里点击解析，系统会把已支持的数据写入对应明细表。"
      />
    </AppShell>
  );
}

function FrequencyCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function UploadLayer({
  title,
  description,
  entries,
  selectedFiles,
  onSelect,
  onUploaded,
}: {
  title: string;
  description: string;
  entries: UploadEntry[];
  selectedFiles: Record<string, string>;
  onSelect: (name: string, fileName: string) => void;
  onUploaded: () => void;
}) {
  return (
    <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <UploadEntryCard
            key={entry.name}
            entry={entry}
            selectedFile={selectedFiles[entry.name]}
            onSelect={(fileName) => onSelect(entry.name, fileName)}
            onUploaded={onUploaded}
          />
        ))}
      </div>
    </section>
  );
}

function UploadEntryCard({
  entry,
  selectedFile,
  onSelect,
  onUploaded,
}: {
  entry: UploadEntry;
  selectedFile?: string;
  onSelect: (fileName: string) => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadFile() {
    if (!file) {
      setMessage("请先选择要上传的文件。");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", entry.platform);
    formData.append("dataType", entry.name);
    formData.append("periodStart", periodStart);
    formData.append("periodEnd", periodEnd);
    formData.append("notes", notes);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.message ?? payload.error ?? "上传失败，请检查 Supabase 配置或稍后再试。");
        return;
      }

            setMessage("上传成功，已保存到 Supabase。请在下方‘已上传数据’里点击解析。");
      onUploaded();
    } catch {
      setMessage("上传失败，请检查网络或 Supabase 配置。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-950">{entry.name}</h4>
        <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800">{entry.frequency}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">用途：{entry.purpose}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">平台：{entry.platform}</p>
      {entry.fields ? <p className="mt-2 text-xs leading-5 text-slate-600">常见字段：{entry.fields}</p> : null}
      <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold leading-5 text-amber-900">提示：{entry.tip}</p>
      <label className="mt-3 inline-flex cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50">
        选择这个数据文件
        <input
          accept=".csv,.xlsx"
          className="sr-only"
          type="file"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (!selected) return;
            setFile(selected);
            onSelect(selected.name);
          }}
        />
      </label>
      <div className="mt-3 grid gap-2">
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            数据周期开始
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            数据周期结束
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </label>
        </div>
        <label className="text-xs font-semibold text-slate-600">
          备注，可选
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            placeholder="例如：本周美团汇总表"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>
      <button
        className="mt-3 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={uploading}
        type="button"
        onClick={() => void uploadFile()}
      >
        {uploading ? "上传中..." : "上传到 Supabase"}
      </button>
      {selectedFile ? (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          已选择：{selectedFile}。当前为前端演示，接入解析功能后会按这个数据类型检查字段是否匹配。
        </p>
      ) : null}
      {message ? <p className="mt-2 text-xs font-semibold leading-5 text-amber-900">{message}</p> : null}
    </article>
  );
}
