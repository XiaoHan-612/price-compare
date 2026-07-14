# 比价猫 - 全网比价网站

支持京东、淘宝、拼多多三大电商平台的价格比较和历史价格追踪。

## 功能

- 🔍 商品搜索比价（京东、淘宝、拼多多）
- 📊 多平台价格对比
- 🏪 店铺信息展示（官方旗舰店优先）
- 📈 历史价格走势图

## 技术栈

- **前端**: Next.js 14 + Ant Design + ECharts + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel / Netlify
- **数据源**: 京东联盟 API + TMAPI（待接入）

## 项目结构

```
price-compare/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx            # 首页
│   │   ├── search/page.tsx     # 搜索结果页
│   │   ├── product/[id]/       # 商品详情页
│   │   └── api/                # API 路由
│   ├── components/             # React 组件
│   ├── lib/
│   │   ├── platforms/          # 电商平台 API 对接
│   │   ├── matcher.ts          # 跨平台商品匹配
│   │   └── utils.ts            # 工具函数
│   └── types/                  # TypeScript 类型定义
├── scripts/                    # 爬虫脚本（GitHub Actions）
├── supabase-schema.sql         # 数据库建表脚本
└── .env.local.example          # 环境变量模板
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
# 编辑 .env.local 填入 Supabase 和 API 密钥
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署

### Netlify 部署

1. 推送代码到 GitHub
2. 在 Netlify 导入仓库
3. 配置环境变量
4. 部署完成

### 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 京东联盟 API（可选）
JD_APP_KEY=xxx
JD_SECRET_KEY=xxx

# TMAPI（可选，第三方聚合 API）
TMAPI_TOKEN=xxx
```

## 数据来源

### 当前状态

- ✅ 京东联盟 API 已对接（分类推荐数据）
- ⏳ 关键词搜索需要申请 `jd.union.open.goods.query` 权限
- ⏳ 淘宝/拼多多联盟 API 待申请
- ⏳ 第三方聚合 API（TMAPI）待接入

### 已知限制

1. 京东联盟 API 的 `goods.material.query` 只返回推荐商品，不支持关键词搜索
2. 关键词搜索接口 `goods.query` 需要通过 APP 类型申请
3. 直接爬取电商网站会被反爬虫拦截

## 下一步计划

- [ ] 申请京东联盟 `goods.query` 关键词搜索权限
- [ ] 申请淘宝联盟 API 权限
- [ ] 申请多多进宝 API 权限
- [ ] 接入 TMAPI 第三方聚合 API
- [ ] 开发 Chrome 浏览器插件众包采集价格
- [ ] 添加降价提醒功能
- [ ] 移动端适配优化

## 数据库

使用 Supabase，执行 `supabase-schema.sql` 建表。

### 表结构

- `products` - 商品表（平台、价格、店铺信息）
- `price_history` - 价格历史表

## 许可证

MIT License
