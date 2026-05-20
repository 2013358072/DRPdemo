# 交互组件规范

## 年份下拉选择器

- 使用自定义下拉面板（与部门树风格一致），非原生 `<select>`
- HTML 结构：`.year-dropdown-wrapper` > `.dept-trigger#yearTrigger` + `.dept-panel.year-panel#yearPanel`
- 面板内每个年份为 `.year-item`，点击切换并触发 `loadData()`
- 选中态 `.year-item.active` 高亮，文字加大到 14px、padding 加大确保清晰可读
- 点击面板外部自动关闭
- 四个主题分别适配：
  - **深空蓝**：悬停/选中为青蓝色高亮
  - **赛博朋克**：霓虹绿 `#00ffe0`，选中态带 `text-shadow` 发光
  - **星空宇宙**：蓝紫 `#5588ff`，选中态带 `text-shadow` 发光
  - **商务蓝白**：蓝白 `#2196F3`，白底面板，清晰专业

## 下钻弹窗

- 触发方式：点击图表数据点、点击指标卡片
- 弹窗标题随来源变化：如"优秀员工明细"、"评分中员工明细"
- 表格字段：
  | 字段 | 说明 |
  |------|------|
  | 员工账号 | account |
  | 姓名 | name |
  | 部门 | dept_name（超 10 字省略+tooltip） |
  | 职位分类 | job_type |
  | 职位 | job_title（超 10 字省略+tooltip） |
  | 考核得分 | score |
  | 考核系数 | score/100，保留 2 位小数 |
  | 考核等级 | level_name（彩色 badge） |
- 分页：每页 10 条，显示总条数和页码

## 部门树形组件

- 不依赖外部 UI 库，手写下拉树
- 支持多级展开/折叠（默认展开第一级）
- 默认选中顶层节点（"股份公司"或第一个根节点）
- 选中后递归收集该节点及所有子部门 ID，传给数据查询
- 参考结构见 `references/dept_tree_example.json`

## 主题切换

- 标题栏右侧四个圆形色块按钮（`.theme-switcher`）
- 点击切换 `data-theme` 属性：`default` / `cyberpunk` / `starfield` / `corporate`
- 主题选择持久化到 `localStorage`（key: `dashboard-theme`）
- 切换后延迟 350ms 重绘 ECharts（颜色跟随主题）
- 支持 `--lock-theme` 锁定主题（隐藏按钮，页面只显示指定主题）
