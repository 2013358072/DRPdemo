# 代码质量要求

## 架构规范

- **三文件分离**：HTML 纯结构，CSS 独立样式文件，JS 独立业务逻辑文件（通过 `<link>` / `<script src>` 引入）
- 模板文件 `scripts/html_template.py`：三段式（`_CSS_TEMPLATE` / `_JS_TEMPLATE` / `_HTML_TEMPLATE`），通过 `{{PLACEHOLDER}}` 占位符替换

## 占位符列表

| 占位符 | 所在模板 | 说明 |
|--------|---------|------|
| `{{TITLE}}` | HTML | 页面标题 |
| `{{THEME_SWITCHER_HTML}}` | HTML | 主题切换按钮 HTML 块（锁定时为空） |
| `{{MODE}}` | JS | 数据模式：`mock` / `api` |
| `{{API_BASE}}` | JS | 后端 API 基础地址 |
| `{{DEFAULT_THEME}}` | JS | 默认主题名 |
| `{{SHOW_THEME_SWITCHER}}` | JS | 是否显示主题切换：`"true"` / `"false"` |

## 前端规范

- ECharts 5.4.3（CDN 引入，指定版本号）
- Tailwind CSS + Font Awesome 6.4.0（CDN 引入）
- ES5 兼容语法（function 声明，避免箭头函数/模板字符串），确保 `file://` 协议可用
- ECharts 加载容错：`waitEcharts()` 轮询等待 CDN 加载完成
- 中文字符直接使用 UTF-8 字面量（不使用 `\uXXXX` 转义），模板文件保存为 UTF-8
- 完善的 loading 状态和错误提示（网络请求失败友好提示）
- 图表自适应窗口 resize（`window.addEventListener('resize', chart.resize)`）
- Chrome/Edge 最新版兼容

## 响应式规范

### 4 断点体系

| 断点 | 范围 | KPI 列数 | 图表列数 | 布局策略 |
|------|------|---------|---------|---------|
| 大屏 | ≥1920px | 6 | 2 | flex 全屏填满，禁止滚动 |
| 桌面 | 1280-1919px | 3 | 2 | flex 全屏填满，禁止滚动 |
| 平板 | 768-1279px | 3 | 2 | 允许滚动，图表 min-height 320px |
| 移动端 | <768px | 2 | 1 | 单列布局，header 折叠 |

### CSS 布局原理

- **body**：`display: flex; flex-direction: column; overflow: hidden`
- **header**：`flex-shrink: 0; position: relative; height: auto`
- **main**：`flex: 1; min-height: 0; overflow: hidden`（大屏/桌面模式）
- **平板/移动端**：`html, body` 和 `.main` 改为 `overflow: auto`，`.main` 取消 flex 高度约束

### JS 断点函数

```javascript
function getBreakpoint(W) {
  if (W >= 1920) return "large";
  if (W >= 1280) return "desktop";
  if (W >= 768) return "tablet";
  return "mobile";
}
```

`adjustLayout()` 根据断点设置间距参数（mainPadTop/Bottom/LR、kpiGap、kpiMargin、chartGap、chartPaddingV），并通过 CSS 变量注入。平板/移动端跳过 JS padding 调整，由 CSS 媒体查询控制。

### 主题响应式覆盖

每个主题的特定样式（如 corporate 的 KPI 列数）需在 4 个断点的媒体查询中分别覆盖：
- `@media (max-width: 1919px) and (min-width: 1280px)`
- `@media (max-width: 1279px) and (min-width: 768px)`
- `@media (max-width: 767px)`

### 图表适配

- 所有图表 `grid` 配置必须设置 `containLabel: true`，防止轴标签被容器裁切
- X/Y 轴分类较多的图表（如职位分类分析）适当增大 `grid.bottom`（如 36px）
- 图表 resize 统一由 `adjustLayout()` 在 `window.resize` 时调用

## 参考文件

| 文件 | 用途 |
|------|------|
| `references/dept_tree_example.json` | 部门树示例数据（5 大部门，15 个子部门） |
| `references/mock_data_example.json` | Mock 数据完整示例（数据结构参考） |
| `references/oracle_sql_reference.sql` | Oracle SQL 查询参考（含分页、递归子部门） |
| `scripts/generate_dashboard.py` | 主生成脚本（输出 HTML + CSS + JS 三文件） |
| `scripts/generate_server.py` | 后端生成脚本（生成 server.js） |
| `scripts/html_template.py` | 三段式模板，`generate_files()` 返回三文件内容 |
