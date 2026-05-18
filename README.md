# DRP 穿透式监管系统 · 演示驾驶舱

基于 Vue 3 + Vite 的最小启动版前端 Demo，覆盖 6 大演示场景。

## 🚀 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 浏览器自动打开 http://localhost:5173
```

> 推荐 Node.js 18+

## 📁 项目结构

```
drp-demo/
├── index.html              # 入口 HTML
├── package.json            # 仅依赖 vue + vite + @vitejs/plugin-vue
├── vite.config.js
└── src/
    ├── main.js             # 应用入口
    ├── App.vue             # 主壳: 顶部 + 侧栏 + 场景切换 + 底部
    ├── style.css           # 全局样式（CSS 变量 + 公共类）
    ├── data/
    │   └── mockData.js     # 模拟数据（严格对照42张数据表）
    └── views/              # 6 大演示场景
        ├── Dashboard.vue   # 场景1: 风险监控驾驶舱
        ├── Invest.vue      # 场景2: 投资穿透
        ├── Finance.vue     # 场景3: 财务穿透(7级穿透链路)
        ├── Equity.vue      # 场景4: 产权穿透(5层股权树)
        ├── Overseas.vue    # 场景5: 境外穿透(全球地图)
        └── AIAgent.vue     # 场景6: AI 智能体
```

## 🎯 核心场景

| # | 场景 | 核心点 |
|---|------|--------|
| 01 | **风险监控驾驶舱** | 4个风险 KPI · 7日趋势 · 板块×场景矩阵 · 82家热力图 · 规则触发 · 闭环全流程 · 实时事件 |
| 02 | **投资穿透** | 42个项目矩阵 · 关联方知识图谱 · 项目穿透详情 · AI 研判 · 底层资产 |
| 04 | **财务穿透** ⭐ | **7级穿透链路**: 报表 → 科目余额 → 明细科目 → 凭证 → 业务单据 → 合同 → 项目/采购订单 |
| 05 | **产权穿透** | 5层股权树 · 实控人识别 · 关联交易清单 |
| 09 | **境外穿透** | 全球资产地图 · 区域分布 · 合规规则达标 · 跨境资金 |
| 10 | **AI 智能体** | 4个 Agent · 智能问数对话 · 主动发现 · 协作流程 |

## 🎨 设计要点

- 深空蓝指挥中心配色 + 科技青/警示红橙
- 严肃宋体标题 + Orbitron 数字字体
- 关系驱动的可视化（不堆砌图表，展现穿透联动）
- 监控大屏聚焦风险呈现
- 1920×1080 大屏优先适配

## 🛠 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **Vite** (零配置 HMR)
- 纯 CSS + SVG（无引入 ECharts/D3，保持轻量）
- 无路由依赖（场景切换用 `<component :is>` + `KeepAlive`）

## 📊 数据规范

所有 mock 数据存放在 `src/data/mockData.js`，命名严格对照《DRP最小业务还原版42张》：
- `drp_org_unit` → `D_UNITS`
- `drp_risk_event` → `D_EVENTS`
- `drp_finance_report/account/voucher` → `D_REPORTS` / `D_CHAIN7`
- `drp_invest_project/asset` → `D_PROJECTS` / `D_ASSETS`
- 共 12 个数据集，可平滑替换为真实接口
