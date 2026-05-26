# Supabase 生产环境 Schema 清单

本清单根据当前代码中的 Supabase 表引用整理。它用于上线前人工核对生产环境，不会被应用自动执行。

注意：

- 本项目上传原文件依赖 Supabase Storage 私有 bucket：`uploaded-files`。
- 当前上传文件删除逻辑会按 `uploaded_files.storage_path` 删除单个 Storage 文件，并清理对应解析明细。
- 解析明细表都依赖 `uploaded_file_id` 关联 `uploaded_files.id`。
- 旧文件 `schema-v1.6.1.sql` 已不足以覆盖当前所有业务表。

## uploaded_files

### 用途

保存上传原文件记录，用于文件管理、解析入口、下载原文件、数据质量检测和所有分析 API 的有效文件筛选。

### 当前代码使用位置

- `app/api/uploads/route.ts`
- `app/api/uploads/list/route.ts`
- `app/api/uploads/download/route.ts`
- `app/api/uploads/delete/route.ts`
- `app/api/uploads/toggle-active/route.ts`
- 所有 `app/api/uploads/parse-*`
- `app/api/recommendations/today/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/closed-loop/meituan/route.ts`
- `app/api/project-analysis/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`
- `components/uploaded-data-manager.tsx`

### 必需字段

| 字段 | 建议类型 | 是否必需 | 用途 |
|---|---|---:|---|
| id | uuid | 是 | 上传记录主键 |
| platform | text | 否 | 平台筛选和文件归类 |
| data_type | text | 是 | 判断解析按钮和解析 API 类型 |
| original_file_name | text | 是 | 展示用户上传的原始文件名 |
| storage_path | text | 是 | Supabase Storage 私有文件路径 |
| period_start | date | 否 | 数据周期开始 |
| period_end | date | 否 | 数据周期结束 |
| uploaded_at | timestamptz | 是 | 上传时间 |
| row_count | integer | 否 | 解析行数 |
| parse_status | text | 是 | saved / parsed / failed |
| is_active | boolean | 是 | 停用时设为 false，分析 API 只读取 true |
| notes | text | 否 | 备注 |
| created_at | timestamptz | 否 | 建议保留，方便审计 |
| updated_at | timestamptz | 否 | 建议保留，方便审计 |

### 建议索引

- `uploaded_files_uploaded_at_idx`
- `uploaded_files_platform_idx`
- `uploaded_files_data_type_idx`
- `uploaded_files_active_parse_idx`

### 是否已有 SQL 文件

有：`supabase/schema-v1.6.1.sql`，但缺少部分建议字段和索引。

### 上线风险

缺失会导致上传、下载、解析、数据质量、今日建议、看板、周报全部不可用。

## action_logs

### 用途

保存今日总建议的采纳、继续观察、忽略动作，并支持执行状态、复盘结果和复盘备注。

### 当前代码使用位置

- `app/api/action-logs/route.ts`
- `app/action-logs/page.tsx`
- `components/today-recommendations-board.tsx`

### 必需字段

| 字段 | 建议类型 | 是否必需 | 用途 |
|---|---|---:|---|
| id | uuid | 是 | 操作记录主键 |
| action_type | text | 是 | recommendation_adopted / recommendation_watching / recommendation_ignored |
| source | text | 否 | 来源页面，例如 recommendations |
| recommendation_id | text | 否 | 建议稳定 ID，用于刷新后恢复状态 |
| platform | text | 否 | 平台 |
| title | text | 否 | 建议标题 |
| status | text | 否 | adopted / watching / ignored |
| note | text | 否 | 操作备注 |
| payload | jsonb | 否 | 建议摘要 |
| created_at | timestamptz | 是 | 操作时间 |
| execution_status | text | 否 | pending / done / delayed / cancelled |
| review_result | text | 否 | unreviewed / effective / ineffective / observing |
| review_note | text | 否 | 复盘备注 |
| reviewed_at | timestamptz | 否 | 复盘时间 |
| updated_at | timestamptz | 否 | 更新时间 |

### 建议索引

- `action_logs_created_at_idx`
- `action_logs_source_idx`
- `action_logs_recommendation_id_idx`
- `action_logs_platform_idx`
- `action_logs_status_idx`
- `action_logs_execution_status_idx`
- `action_logs_review_result_idx`

### 是否已有 SQL 文件

有：`supabase/action-logs.sql` 和 `supabase/action-logs-review.sql`。

### 上线风险

基础字段缺失会导致建议采纳状态无法云端保存；复盘字段缺失时页面会回退到本机临时复盘。

## target_settings

### 用途

保存用户自定义目标值，供今日总建议覆盖系统默认阈值。

### 当前代码使用位置

- `app/api/targets/route.ts`
- `app/targets/page.tsx`
- `app/api/recommendations/today/route.ts`
- `lib/recommendation-rules.ts`

### 必需字段

| 字段 | 建议类型 | 是否必需 | 用途 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| key | text | 是 | 稳定配置 key |
| label | text | 是 | 页面显示名称 |
| value | numeric | 是 | 阈值数值 |
| unit | text | 否 | 单位 |
| description | text | 否 | 说明 |
| updated_at | timestamptz | 是 | 更新时间 |

### 建议索引

- `target_settings_key_idx`

### 是否已有 SQL 文件

有：`supabase/target-settings.sql`。

### 上线风险

表缺失时 `/targets` 可本机临时保存，但服务端 `/recommendations` 会使用默认阈值。

## project_price_items

### 用途

维护 e看牙系统价、平台展示价、活动价和常见成交价，不是成本表。

### 当前代码使用位置

- `app/api/project-pricing/route.ts`
- `app/api/project-pricing/import/route.ts`
- `app/project-pricing/page.tsx`

### 必需字段

| 字段 | 建议类型 | 是否必需 | 用途 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| project_name | text | 是 | 项目名称 |
| project_category | text | 否 | 项目分类 |
| ekanya_system_price | numeric | 否 | e看牙系统价 |
| platform_display_price | numeric | 否 | 平台展示价 |
| campaign_price | numeric | 否 | 活动价 |
| common_actual_price | numeric | 否 | 常见成交价 |
| package_content | text | 否 | 套餐内容 |
| is_lead_project | boolean | 是 | 是否引流项目 |
| is_high_ticket | boolean | 是 | 是否高客单项目 |
| observation_cycle | text | 否 | 观察周期 |
| status | text | 是 | active / inactive |
| notes | text | 否 | 备注 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

### 建议索引

- `project_price_items_status_idx`
- `project_price_items_category_idx`
- `project_price_items_name_idx`

### 是否已有 SQL 文件

有：`supabase/schema-v1.6.1.sql`，但旧草案里状态默认值有乱码风险，建议以生产草案为准人工核对。

### 上线风险

缺失会导致项目价格管理无法读取、导入、编辑、停用和删除。

## competitor_price_items

### 用途

保存用户人工整理或导入的竞品公开价格数据，用于竞品价格库和竞品价格对比看板。

### 当前代码使用位置

- `app/api/competitor-prices/route.ts`
- `app/api/competitor-prices/import/route.ts`
- `app/api/competitor-prices/analysis/route.ts`
- `app/competitor-intelligence/page.tsx`
- `components/competitor-price-library-refined.tsx`
- `components/competitor-price-analysis-board.tsx`

### 必需字段

| 字段 | 建议类型 | 是否必需 | 用途 |
|---|---|---:|---|
| id | uuid | 是 | 主键 |
| hospital_name | text | 是 | 竞品医院名称 |
| platform | text | 否 | 来源平台，默认美团 |
| city_area | text | 否 | 城市/区域 |
| project_category | text | 否 | 项目分类 |
| project_attribute | text | 否 | 项目属性 |
| project_name | text | 是 | 项目或套餐名称 |
| display_price | numeric | 否 | 展示价 |
| original_price | numeric | 否 | 划线价 |
| package_content | text | 否 | 套餐内容 |
| restriction_note | text | 否 | 限制说明 |
| sold_count | integer | 否 | 销量 |
| rating | numeric | 否 | 评分 |
| review_count | integer | 否 | 评价数 |
| page_url | text | 否 | 公开页面链接 |
| collected_date | date | 否 | 采集日期 |
| status | text | 是 | active / inactive |
| notes | text | 否 | 备注 |
| raw_row | jsonb | 否 | 导入原始行 |
| created_at | timestamptz | 是 | 创建时间 |
| updated_at | timestamptz | 是 | 更新时间 |

### 建议索引

- `competitor_price_items_status_idx`
- `competitor_price_items_hospital_idx`
- `competitor_price_items_category_idx`
- `competitor_price_items_collected_date_idx`
- `competitor_price_items_price_idx`

### 是否已有 SQL 文件

无独立 SQL 文件。

### 上线风险

缺失会导致竞品价格库、导入、筛选、价格对比看板全部不可用。

## meituan_summary_rows

### 用途

保存美团推广汇总解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-meituan-summary/route.ts`
- `app/api/closed-loop/meituan/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `date date`, `promotion_name text`, `store_name text`, `spend numeric`, `impressions integer`, `clicks integer`, `avg_click_cost numeric`, `merchant_views integer`, `phone_views integer`, `online_consult_clicks integer`, `orders integer`, `group_buy_orders integer`, `group_buy_orders_15d integer`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `meituan_summary_rows_uploaded_file_id_idx`
- `meituan_summary_rows_date_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致美团推广汇总解析、今日建议、美团闭环、多平台看板和周报不可用。

## meituan_keyword_rows

### 用途

保存美团关键词解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-meituan-keywords/route.ts`
- `app/api/closed-loop/meituan/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `date date`, `promotion_name text`, `store_name text`, `keyword text`, `spend numeric`, `impressions integer`, `clicks integer`, `avg_click_cost numeric`, `merchant_views integer`, `phone_views integer`, `online_consult_clicks integer`, `orders integer`, `group_buy_orders integer`, `group_buy_orders_15d integer`, `bid_price numeric`, `match_type text`, `keyword_status text`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `meituan_keyword_rows_uploaded_file_id_idx`
- `meituan_keyword_rows_date_idx`
- `meituan_keyword_rows_keyword_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致美团关键词解析、关键词 Top 10、周报关键词观察不可用。

## douyin_plan_summary_rows

### 用途

保存抖音计划汇总解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-douyin-plan-summary/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `ad_group_name text`, `spend numeric`, `impressions integer`, `clicks integer`, `click_rate numeric`, `avg_click_cost numeric`, `conversions integer`, `conversion_cost numeric`, `form_count integer`, `private_message_count integer`, `phone_count integer`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `douyin_plan_summary_rows_uploaded_file_id_idx`
- `douyin_plan_summary_rows_date_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致抖音计划解析、多平台看板、今日建议和周报缺抖音前端数据。

## douyin_creative_rows

### 用途

保存抖音素材/创意解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-douyin-creatives/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `ad_group_name text`, `creative_name text`, `material_name text`, `video_name text`, `creative_id text`, `material_id text`, `spend numeric`, `impressions integer`, `clicks integer`, `click_rate numeric`, `avg_click_cost numeric`, `play_count integer`, `valid_play_count integer`, `complete_play_count integer`, `complete_play_rate numeric`, `conversions integer`, `conversion_cost numeric`, `form_count integer`, `private_message_count integer`, `phone_count integer`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `douyin_creative_rows_uploaded_file_id_idx`
- `douyin_creative_rows_date_idx`
- `douyin_creative_rows_creative_name_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致抖音素材解析和周报素材观察不可用。

## douyin_lead_rows

### 用途

保存抖音表单/私信线索解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-douyin-leads/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `lead_time timestamptz`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `ad_group_name text`, `creative_name text`, `material_name text`, `lead_type text`, `lead_source text`, `customer_name text`, `phone_tail text`, `city text`, `intention_project text`, `message_content text`, `follow_status text`, `appointment_status text`, `visit_status text`, `deal_status text`, `remark text`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `douyin_lead_rows_uploaded_file_id_idx`
- `douyin_lead_rows_date_idx`
- `douyin_lead_rows_status_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致抖音线索解析、多平台线索统计和周报线索统计不可用。

## gdt_plan_summary_rows

### 用途

保存腾讯广点通计划汇总解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-gdt-plan-summary/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `ad_group_name text`, `spend numeric`, `impressions integer`, `clicks integer`, `click_rate numeric`, `avg_click_cost numeric`, `conversions integer`, `conversion_cost numeric`, `form_count integer`, `phone_count integer`, `consult_count integer`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `gdt_plan_summary_rows_uploaded_file_id_idx`
- `gdt_plan_summary_rows_date_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致腾讯计划解析、多平台看板、今日建议和周报缺腾讯前端数据。

## gdt_creative_rows

### 用途

保存腾讯广告组/创意解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-gdt-creatives/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `ad_group_name text`, `creative_name text`, `creative_id text`, `material_name text`, `material_id text`, `spend numeric`, `impressions integer`, `clicks integer`, `click_rate numeric`, `avg_click_cost numeric`, `conversions integer`, `conversion_cost numeric`, `form_count integer`, `phone_count integer`, `consult_count integer`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `gdt_creative_rows_uploaded_file_id_idx`
- `gdt_creative_rows_date_idx`
- `gdt_creative_rows_creative_name_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致腾讯创意解析和周报创意观察不可用。

## gdt_lead_rows

### 用途

保存腾讯表单/电话线索解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-gdt-leads/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `lead_time timestamptz`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `ad_group_name text`, `creative_name text`, `lead_type text`, `lead_source text`, `customer_name text`, `phone_tail text`, `city text`, `intention_project text`, `consult_content text`, `follow_status text`, `appointment_status text`, `visit_status text`, `deal_status text`, `remark text`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `gdt_lead_rows_uploaded_file_id_idx`
- `gdt_lead_rows_date_idx`
- `gdt_lead_rows_status_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致腾讯线索解析、多平台线索统计和周报线索统计不可用。

## amap_summary_rows

### 用途

保存高德推广汇总解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-amap-summary/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `store_name text`, `spend numeric`, `impressions integer`, `clicks integer`, `click_rate numeric`, `avg_click_cost numeric`, `phone_clicks integer`, `navigation_clicks integer`, `store_view_count integer`, `address_clicks integer`, `coupon_clicks integer`, `lead_count integer`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `amap_summary_rows_uploaded_file_id_idx`
- `amap_summary_rows_date_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致高德汇总解析、多平台看板、今日建议和周报缺高德前端数据。

## amap_action_rows

### 用途

保存高德电话/导航/门店访问行为明细。

### 当前代码使用位置

- `app/api/uploads/parse-amap-actions/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `action_time timestamptz`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `store_name text`, `action_type text`, `action_name text`, `phone_clicks integer`, `navigation_clicks integer`, `address_clicks integer`, `store_view_count integer`, `coupon_clicks integer`, `city text`, `keyword text`, `device_type text`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `amap_action_rows_uploaded_file_id_idx`
- `amap_action_rows_date_idx`
- `amap_action_rows_action_type_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致高德行为解析和本地到店动作统计不可用。

## amap_lead_rows

### 用途

保存高德线索解析明细。

### 当前代码使用位置

- `app/api/uploads/parse-amap-leads/route.ts`
- `app/api/platform-overview/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `lead_time timestamptz`, `date date`, `account_name text`, `campaign_name text`, `plan_name text`, `store_name text`, `lead_type text`, `lead_source text`, `customer_name text`, `phone_tail text`, `city text`, `intention_project text`, `consult_content text`, `follow_status text`, `appointment_status text`, `visit_status text`, `deal_status text`, `remark text`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `amap_lead_rows_uploaded_file_id_idx`
- `amap_lead_rows_date_idx`
- `amap_lead_rows_status_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致高德线索解析、多平台线索统计和周报线索统计不可用。

## ekanya_backflow_rows

### 用途

保存 e看牙后端回流解析明细，用于项目分析、闭环 ROI、今日建议、周报。

### 当前代码使用位置

- `app/api/uploads/parse-ekanya-backflow/route.ts`
- `app/api/closed-loop/meituan/route.ts`
- `app/api/closed-loop/platforms/route.ts`
- `app/api/project-analysis/route.ts`
- `app/api/recommendations/today/route.ts`
- `app/api/reports/weekly/route.ts`
- `app/data-quality/page.tsx`

### 必需字段

`id uuid`, `uploaded_file_id uuid`, `source_date date`, `visit_date date`, `deal_date date`, `patient_name text`, `patient_no text`, `phone_tail text`, `source_platform text`, `source_channel text`, `intention_project text`, `visit_project text`, `deal_project text`, `appointment_status text`, `visit_status text`, `deal_status text`, `paid_amount numeric`, `receivable_amount numeric`, `discount_amount numeric`, `doctor_name text`, `consultant_name text`, `remark text`, `raw_row jsonb`, `created_at timestamptz`。

### 建议索引

- `ekanya_backflow_rows_uploaded_file_id_idx`
- `ekanya_backflow_rows_source_date_idx`
- `ekanya_backflow_rows_visit_date_idx`
- `ekanya_backflow_rows_deal_date_idx`
- `ekanya_backflow_rows_source_platform_idx`

### 是否已有 SQL 文件

无统一 SQL 文件。

### 上线风险

缺失会导致 e看牙回流解析、项目分析、闭环 ROI、今日建议和周报后端数据不可用。

## weekly_reports

### 用途

旧草案里的周报记录表。当前代码主要前端生成 CSV 周报，未发现生产业务 API 写入该表。

### 当前代码使用位置

- `supabase/schema-v1.6.1.sql`

### 必需字段

`id uuid`, `report_type text`, `period_start date`, `period_end date`, `title text`, `summary text`, `file_path text`, `created_at timestamptz`。

### 建议索引

- `weekly_reports_created_at_idx`

### 是否已有 SQL 文件

有：`supabase/schema-v1.6.1.sql`。

### 上线风险

当前业务代码未使用，缺失不影响现有周报预览和 CSV 下载。

