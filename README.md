# Ten Baht Ride 🚐

芭提雅双条车（Songthaew）乘车指南 —— 一个纯前端的交互式乘车助手。

> 双条车是芭提雅最常见的公共交通工具，因固定路线票价仅 10 泰铢而得名。

## 功能

### 1. 路线展示
- 展示芭提雅主要双条车固定路线（环线、Jomtien 线、Naklua 线等）
- 在 Google Maps 上可视化路线走向、主要站点及途经地标
- 标注票价信息（固定路线 10 THB / 包车价格参考）

### 2. 响应式设计
- 移动端优先，适配手机竖屏浏览
- 桌面端自适应布局，充分利用大屏空间

### 3. 智能乘车建议
用户输入目的地（如酒店名、商场、景点），系统给出：
- **推荐路线** — 乘坐哪条线路的双条车
- **上车地点** — 在哪里招手上车（地图标记）
- **下车地点** — 在哪里按铃下车（地图标记）
- **票价参考** — 预计费用
- **实用提示** — 按铃时机、注意事项

地点输入集成 Google Places Autocomplete，支持模糊搜索酒店、景点、商场等。

### 4. 国际化 (i18n)
支持多语言切换，覆盖主要游客群体：

| 语言 | 代码 | 说明 |
|------|------|------|
| English | `en` | 默认语言 |
| 中文（简体） | `zh-CN` | — |
| 中文（繁體） | `zh-TW` | — |
| ภาษาไทย | `th` | 泰语 |
| 한국어 | `ko` | 韩语 |
| 日本語 | `ja` | 日语 |
| Русский | `ru` | 俄语 |

- 自动检测浏览器语言偏好
- 用户可手动切换语言，选择持久化到 localStorage
- 路线名称、站点名称、乘车提示等均做多语言适配

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 19 |
| 构建 | Vite |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 路由 | React Router |
| 地图 | Google Maps JavaScript API + @vis.gl/react-google-maps |
| 地点搜索 | Google Places API (Autocomplete) |
| 国际化 | i18next + react-i18next |
| 部署 | Vercel / Cloudflare Pages |

## Google Maps API 配置

本项目依赖以下 Google Maps Platform API：

| API | 用途 |
|-----|------|
| Maps JavaScript API | 地图渲染、路线绘制 |
| Places API (New) | 地点自动补全、地点详情 |
| Geocoding API | 地址解析（可选） |

### 获取 API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并启用以上 API
3. 创建 API Key，建议限制：
   - **应用限制**：HTTP referrers（填写你的域名）
   - **API 限制**：仅启用上述 3 个 API
4. 在项目根目录创建 `.env.local`：

```bash
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

> ⚠️ 注意：Google Maps API 有免费额度（每月 $200 信用额度），个人小项目通常够用。详见 [Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)。

## 数据来源

路线与站点数据为静态 JSON，基于以下信息整理：
- 芭提雅双条车实际运营路线（2024-2025）
- 主要路线：
  - **环线（Circular Route）**：Beach Road 南行 → Walking Street 掉头 → Second Road 北行，全程 10 THB
  - **Jomtien 线**：市区 → Jomtien Beach，约 10-20 THB
  - **Naklua 线**：市区 → Naklua / Wongamat，约 10 THB
  - **Sukhumvit 线**：沿 Sukhumvit Road 行驶

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Google Maps API Key

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
Ten-Baht-Ride/
├── public/
│   └── data/                # 静态路线数据 (JSON)
├── src/
│   ├── components/          # 通用 UI 组件
│   │   ├── Map/             # 地图组件
│   │   ├── LanguageSwitcher/# 语言切换器
│   │   └── Layout/          # 布局组件
│   ├── features/
│   │   ├── routes/          # 路线展示功能
│   │   └── advisor/         # 乘车建议功能
│   ├── data/                # 路线、站点、地标数据
│   ├── i18n/
│   │   ├── index.ts         # i18next 初始化配置
│   │   └── locales/
│   │       ├── en.json      # English
│   │       ├── zh-CN.json   # 简体中文
│   │       ├── zh-TW.json   # 繁體中文
│   │       ├── th.json      # ภาษาไทย
│   │       ├── ko.json      # 한국어
│   │       ├── ja.json      # 日本語
│   │       └── ru.json      # Русский
│   ├── hooks/               # 自定义 Hooks
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── .env.example             # 环境变量模板
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## License

MIT
