---
name: kpi-dashboard
description: 绩效考核大屏
---

# 绩效考核大屏生成器 Skill



## 概述

根据用户提供的绩效考核数据或数据库配置，自动生成绩效考核结果监控大屏，支持 Oracle 数据库对接或内置 Mock 数据演示。

**输出结构（三文件分离）**：
```
<output_dir>/
  index.html            ← 纯 HTML 结构，引用外部 CSS/JS
  assets/
    dashboard.css       ← 全部样式（CSS 变量、布局、动画）
    dashboard.js        ← 全部业务逻辑（Mock/API 双模式）
```

**Base directory**: `~/.workbuddy/skills/kpi-dashboard/`

---

## 功能特性

- 自定义年份下拉面板 + 部门树形筛选（含子部门递归汇总），四个主题均清晰可读
- 6 个关键指标卡片 + **3D 翻牌器动画**
- ECharts 5.4.3 图表（折线图 / 柱状图 / 饼图）+ 图表下钻弹窗
- **四套可切换主题**：深空蓝 / 赛博朋克 / 星空宇宙 / 商务蓝白，支持锁定
- 支持切换 Mock 数据 ↔ Oracle REST API 两种数据源
- **4 断点响应式布局**：大屏≥1920px / 桌面1280-1919px / 平板768-1279px / 移动端<768px
  - 大屏/桌面：全屏填满禁止滚动（flex 布局）
  - 平板/移动端：允许自然滚动，header 折叠，卡片堆叠/单列
- 图表 grid 配置 `containLabel: true`，防止轴标签被裁切

---

## 技术栈

| 类别 | 技术 | 版本/来源 |
|------|------|-----------|
| CSS 框架 | Tailwind CSS | CDN `cdn.tailwindcss.com` |
| 图表库 | ECharts | 5.4.3 (`cdn.jsdelivr.net`) |
| 图标库 | Font Awesome | 6.4.0 (`cdnjs.cloudflare.com`) |
| 后端 | Node.js + Express + oracledb | 仅 API 模式需要 |

---

## 详细文档

> 以下文档存放在 `docs/` 目录，维护时修改对应文档即可。

| 文档 | 路径 | 内容 |
|------|------|------|
| 设计规范 | [`docs/design-spec.md`](docs/design-spec.md) | 视觉风格、色板、布局、动画、四套主题、图标映射 |
| 数据逻辑 | [`docs/data-logic.md`](docs/data-logic.md) | 指标计算、等级映射、状态列表、API 接口 |
| 组件规范 | [`docs/component-spec.md`](docs/component-spec.md) | 下钻弹窗、部门树、主题切换 |
| 代码规范 | [`docs/code-standards.md`](docs/code-standards.md) | 架构规范、占位符列表、前端规范、参考文件 |

---