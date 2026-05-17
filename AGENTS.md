# 项目说明

本项目是一个个人专属的「口腔医院AI投放经营系统」。

项目目标：
- 这是医院内部使用的网站，不开放注册。
- 只有管理员一个账号可以登录。
- 用于每天上传美团、腾讯广点通、抖音信息流、承接端成交数据。
- 系统自动计算投放指标，包括咨询成本、有效咨询率、预约率、到院率、成交成本、ROI、毛利ROI。
- 后期接入 OpenAI API，用于生成日报、调预算建议、调价建议、素材优化建议。
- AI建议仅作为内部参考，不自动修改广告后台。

技术栈：
- Next.js App Router
- TypeScript
- Tailwind CSS
- 后期使用 Supabase PostgreSQL / Auth / Storage
- 后期使用 OpenAI API
- 后期使用 Recharts 做图表
- 后期使用 xlsx 解析 Excel

开发原则：
- 每个页面单独放在 app 目录下。
- 页面组件尽量清晰，不要把所有代码写在一个大文件里。
- 后期功能要方便增加和删除。
- 不要在前端暴露任何 API Key。
- OpenAI API Key 必须只放在服务端环境变量中。
- 医疗广告相关建议必须保留人工审核，不允许自动发布或自动调预算。

第一阶段只做静态后台原型：
- 登录页
- 首页驾驶舱
- 数据上传页
- 平台分析页
- 项目分析页
- 调预算/调价建议页
- 历史报告页
- 系统设置页

UI风格：
- 中文界面
- 专业、干净、偏经营数据后台
- 深色或浅色均可，但要有医疗/经营系统的稳定感
- 使用 Tailwind CSS# 
Project Instructions

This project is a private internal web system named:

口腔医院AI投放经营系统

## Goal

This is a personal cloud dashboard for managing dental hospital advertising data.

The system is only for internal use. It is not a public SaaS product. It should only allow one administrator account to log in.

The system will be used to upload and analyze advertising data from:

- Meituan
- Douyin Ads
- Tencent Guangdiantong
- Internal sales / consultation conversion data
- Project price and cost tables

The goal is to calculate advertising performance and generate business suggestions, including:

- Consultation cost
- Valid consultation rate
- Appointment rate
- Arrival rate
- Deal rate
- Deal cost
- Revenue ROI
- Gross profit ROI
- Budget adjustment suggestions
- Price adjustment suggestions
- Campaign pause / scale suggestions
- AI daily reports

## Tech Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- OpenAI API
- Recharts for charts
- xlsx for Excel parsing
- Vercel deployment

## Development Principles

- This is a modular system.
- Each page should have its own route inside the `app` directory.
- Each major feature should be separated into its own module.
- Do not put all logic into one large file.
- The system should be easy to add or remove features later.
- Do not expose any API keys in frontend code.
- OpenAI API key must only be used on the server side.
- AI suggestions are only for internal reference.
- The system must not automatically modify ad budgets, ad campaigns, or medical advertising content.
- Medical advertising content must always be manually reviewed.

## V1 Pages

Build these pages first:

- `/dashboard` 首页驾驶舱
- `/upload` 数据上传
- `/platform-analysis` 平台分析
- `/project-analysis` 项目分析
- `/recommendations` 调预算/调价建议
- `/reports` 历史报告
- `/settings` 系统设置

## V1 Data Types

Support these uploaded files later:

- Meituan advertising data
- Douyin advertising data
- Tencent Guangdiantong advertising data
- Internal conversion data
- Project price and cost table

## Standard Data Fields

All platform data should eventually be standardized into these fields:

- date
- platform
- account
- campaign
- ad_group
- creative
- store
- project
- spend
- impressions
- clicks
- consultations
- valid_consultations
- appointments
- arrivals
- deals
- revenue
- project_cost
- gross_profit
- failure_reason

## Metrics

Calculate:

- CTR = clicks / impressions
- CPC = spend / clicks
- Consultation cost = spend / consultations
- Valid consultation rate = valid_consultations / consultations
- Valid consultation cost = spend / valid_consultations
- Appointment rate = appointments / valid_consultations
- Arrival rate = arrivals / appointments
- Deal rate = deals / arrivals
- Deal cost = spend / deals
- ROI = revenue / spend
- Gross profit ROI = gross_profit / spend

## Recommendation Rules

Budget suggestions:

- Gross profit ROI > 3 and valid consultation rate > 50%: suggest increasing budget by 10%-20%
- Gross profit ROI between 1.5 and 3: suggest keeping current budget and observing
- Gross profit ROI < 1: suggest reducing budget or pausing
- Deal cost higher than target CPA by 30%: suggest reducing budget
- Spend increases for 3 consecutive days while valid consultations decrease: suggest pausing or changing creative

Price suggestions:

- Project gross profit = current price - project cost
- Affordable acquisition cost = project gross profit × allowed marketing ratio
- If actual deal cost is higher than affordable acquisition cost, warn that the current price is not suitable for scaling

Possible suggestions:

- Increase price
- Reduce ad budget
- Change activity mechanism
- Use checkup / consultation as lead generation
- Improve conversion process
- Replace creative or selling point

## AI Report

The system should first calculate structured data, then send the structured summary to OpenAI API.

The AI report should include:

1. 今日核心判断
2. 平台表现
3. 项目表现
4. 调预算建议
5. 调价建议
6. 素材优化建议
7. 明日动作清单
8. 风险提醒

## UI Style

- Chinese interface
- Clean business dashboard style
- Professional and stable
- Suitable for dental hospital advertising management
- Use Tailwind CSS
## Competitor Intelligence Center

Add a module named 「竞品情报中心」 for analyzing competitor public-page information.

This module is used to support Meituan, Douyin, Tencent Guangdiantong, and local dental marketing strategy decisions.

### Compliance Boundaries

The system may only analyze public information manually provided by the user.

Allowed inputs:

- Competitor public page links
- Public page copy pasted by the user
- Public page screenshots uploaded by the user
- Public comments or review text copied by the user

Allowed extracted information:

- Competitor name
- Platform
- Project name
- Displayed price
- Activity mechanism
- Purchase notes
- Limit conditions
- Whether it is limited to new customers
- Whether it includes consultation / checkup
- Whether it includes CT / X-ray
- Whether it specifies material / implant brand
- Main selling points
- Trust signals
- Common public-review needs
- Negative-review keywords
- User concerns

Forbidden:

- Do not collect phone numbers
- Do not collect WeChat IDs
- Do not collect ID numbers
- Do not collect private personal data
- Do not collect private messages
- Do not collect logged-in-only data
- Do not collect competitor backend data
- Do not bypass platform restrictions
- Do not scrape personal contact information
- Do not build tools for harassment, illegal lead scraping, or customer poaching

### Competitor Confidence Levels

Use three confidence levels for competitor prices:

- A: The page clearly states included items and restrictions.
- B: Only the displayed price is visible, but conditions are incomplete.
- C: Price is found from public comments or ads and is not verified.

If the competitor price is B or C, the UI must show:

“该竞品价格仅供参考，不建议直接作为调价依据。”

### Output Suggestions

The module should generate:

- Whether to follow competitor price
- Whether to keep current price
- Whether to improve price expression
- Whether to switch to checkup / treatment-plan lead generation
- Whether to strengthen doctor, material, service, or trust signals
- Meituan page optimization suggestions
- Douyin / Xiaohongshu content counter-positioning ideas
- Customer-service response suggestions

### UI Requirements

Create a page:

- `/competitor-intelligence`

The page should include:

1. Competitor input section
2. Public text paste area
3. Screenshot upload area
4. Competitor extraction result section
5. Competitor confidence level section
6. Counter-strategy suggestion cards
7. Compliance reminder

The page must clearly state:

“本模块仅用于分析公开页面信息和市场策略，不采集个人联系方式，不用于骚扰、抢客或非法线索采集。竞品价格仅供内部经营参考，最终价格和投放策略需人工确认。”

### Implementation Stage

For V1, build static UI and fake data only.

Do not implement real scraping.

Do not implement automatic crawling.

Do not implement phone number extraction.

Do not implement private-data collection.

Later versions may use OpenAI API to extract structured information from user-provided public text.