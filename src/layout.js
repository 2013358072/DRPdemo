// 采购页布局动态重组引擎
// 由对话（AI 小助手）按话术命中 preset → applyPreset() 更新 layoutState；
// 页面完全按 layoutState 渲染各模块的 emphasis(放大上浮) / center(中央强调) / faded(淡出) / collapsed(折叠)。
// 所有变化带 CSS 过渡动效。保留细粒度 modules 解析分支，为自由语言/语音预留。
import { reactive } from 'vue'

// 采购页九宫模块 id（与 Procurement.vue 中各 .glass-panel 一一对应）
export const MODULES = ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3']
export const MODULE_LABELS = {
  a1: '六维评分 / 合规看板', b1: '十大风险域', c1: '两类穿透概览',
  a2: '核心指标', b2: '主体穿透网络图', c2: '热力图 / 供应商TOP6',
  a3: '趋势数据', b3: '实时采购风险', c3: 'AI建议 / 系统入口',
}

function blankModules() {
  const s = {}
  MODULES.forEach(m => { s[m] = { emphasis: false, center: false, faded: false, collapsed: false } })
  return s
}

// 响应式布局态：preset 名 + 每个模块的呈现状态 + 模块表现形式（写死示例：b1 柱状/趋势）
export const layoutState = reactive({ preset: 'default', modules: blankModules(), b1Chart: 'bar' })

// 四套预设（在默认布局上的覆盖项；与演示脚本严格对齐）
export const PRESETS = {
  // 还原全局视图
  default: {},
  // 「说说依据」：资金/关联链路聚焦 —— 网络图放大置顶高亮，实时风险保留，其余淡出
  fundFlowFocus: { center: ['b2'], emphasis: ['b3'], faded: ['a1', 'c1', 'a2', 'c2', 'a3', 'c3'] },
  // 「这家供应商还有别的问题」：供应商画像聚焦 —— 热力图+TOP6 中央放大高亮，其余淡出
  supplierFocus: { center: ['c2'], emphasis: ['b2'], faded: ['a1', 'b1', 'c1', 'a2', 'a3', 'c3'] },
  // 「把相关的都集中给我看」：专题视图 —— 仅并排保留 实时风险/供应商画像/网络图链路，其余折叠
  relatedTopic: { emphasis: ['b2', 'c2', 'b3'], collapsed: ['a1', 'b1', 'c1', 'a2', 'a3', 'c3'] },
}

// 应用预设：合并到默认态并更新 layoutState（带动效，由页面 CSS 过渡呈现）
export function applyPreset(name) {
  const p = PRESETS[name] || PRESETS.default
  const s = blankModules()
  ;(p.center || []).forEach(m => { if (s[m]) s[m].center = true })
  ;(p.emphasis || []).forEach(m => { if (s[m]) s[m].emphasis = true })
  ;(p.faded || []).forEach(m => { if (s[m]) s[m].faded = true })
  ;(p.collapsed || []).forEach(m => { if (s[m]) s[m].collapsed = true })
  layoutState.modules = s
  layoutState.preset = name
  if (name === 'default') layoutState.b1Chart = 'bar'   // 恢复默认同时还原图表形式
  return layoutState
}

// 细粒度解析分支（扩展点）：未来自由语言/语音可直接给出 { a1:{faded:true}, ... } 增量覆盖
export function applyModules(partial) {
  if (!partial || typeof partial !== 'object') return layoutState
  Object.entries(partial).forEach(([m, v]) => {
    if (layoutState.modules[m]) Object.assign(layoutState.modules[m], v)
  })
  layoutState.preset = 'custom'
  return layoutState
}

// 关键词 → preset（前端兜底；模型若直接给 layout.preset 则以模型为准）
export const KEYWORD_TO_PRESET = {
  '依据': 'fundFlowFocus',
  '别的问题': 'supplierFocus',
  '集中': 'relatedTopic',
  '相关的都': 'relatedTopic',
  '汇总': 'relatedTopic',
  '专题': 'relatedTopic',
  '关联链路': 'relatedTopic',
  '恢复默认': 'default',
  '回到报告': 'default',
  '重置': 'default',
  '调出': 'default',
  '研判报告': 'default',
}

// 若当前预设把 B1 折叠/隐藏（如专题视图），先切回默认布局让 B1 重新显示，再切换图表形式
function ensureB1Visible() {
  const p = PRESETS[layoutState.preset]
  if (p && (p.collapsed || []).includes('b1')) applyPreset('default')
}
// 由一段文本命中并应用 preset / 模块表现形式（供 AI 小助手 send() 调用）
// 返回值：{ type:'b1chart', mode } 表示切换了「采购十大风险域」图表形式；否则返回 applyPreset 结果或 null
export function applyPresetByText(text) {
  const t = String(text || '')
  // 模块表现形式切换：把「采购十大风险域」用 趋势图/流程图/图 展示；或回到柱状图
  const domainKw = /(风险域|风险领域|十大风险|十大重点|风险大类)/.test(t)
  if (domainKw) {
    const wantsBar = /(柱状|条形|条状)/.test(t)
    const wantsChart = /(趋势|折线|流程图|示意图|图表|用图|画图|展示|呈现|切换|换成|改成|变成)/.test(t)
    if (wantsBar) { ensureB1Visible(); layoutState.b1Chart = 'bar'; return { type: 'b1chart', mode: 'bar' } }
    if (wantsChart) { ensureB1Visible(); layoutState.b1Chart = 'trend'; return { type: 'b1chart', mode: 'trend' } }
  }
  const key = Object.keys(KEYWORD_TO_PRESET).find(k => t.includes(k))
  if (key) return applyPreset(KEYWORD_TO_PRESET[key])
  return null
}

// 模块名 → id 别名（供「不显示六维评分 / 把十大风险域上移 / 展开两类穿透概览」等自由话术）
const MODULE_ALIASES = [
  { id: 'a1', re: /(六维评分|合规看板|采购评分|六维)/ },
  { id: 'b1', re: /(十大风险域|十大风险|十大域|风险领域|风险大类|风险域|十大重点)/ },
  { id: 'c1', re: /(两类穿透|穿透概览|穿透预览)/ },
  { id: 'a2', re: /(核心指标)/ },
  { id: 'b2', re: /(主体穿透网络|穿透网络|网络图)/ },
  { id: 'c2', re: /(热力图|品类|供应商\s*top|供应商排行|供应商榜)/i },
  { id: 'a3', re: /(趋势数据|趋势图谱|趋势)/ },
  { id: 'b3', re: /(实时采购风险|实时风险)/ },
  { id: 'c3', re: /(ai\s*建议|系统入口|智能监管)/i },
]
// 自由话术 → 模块级表现形式调整（显示/隐藏/上移放大/淡化）。返回 { type:'modulecmd', ops, expandPenet } 或 null
export function applyModuleCommands(text) {
  const t = String(text || '')
  const hits = MODULE_ALIASES.filter(m => m.re.test(t)).map(m => m.id)
  if (!hits.length) return null
  const hide = /(不显示|不展示|别显示|别展示|隐藏|去掉|去除|收起|折叠|关闭|撤掉)/.test(t)
  const up   = /(上移|置顶|提前|靠前|突出|放大|重点|强调|上浮|凸显|高亮)/.test(t)
  const down = /(下移|靠后|缩小|淡化|弱化|次要)/.test(t)
  const show = /(显示|展开|打开|呈现|放出|展示|拉开|铺开)/.test(t)
  let action = null
  if (hide) action = { collapsed: true, faded: false, emphasis: false, center: false }
  else if (up) action = { emphasis: true, collapsed: false, faded: false }
  else if (down) action = { faded: true, emphasis: false, center: false }
  else if (show) action = { collapsed: false, faded: false }
  if (!action) return null
  const expandPenet = hits.includes('c1') && (show || up)
  const partial = {}
  hits.forEach(id => { partial[id] = { ...action } })
  // 「展开两类穿透概览」：除展开手风琴外，折叠同列的 六维评分(a1)/十大风险域(b1)，
  // 让 两类穿透概览(c1) 上移并铺满整个左栏，同时放大高亮使变化明显
  if (expandPenet) {
    partial['a1'] = { collapsed: true, faded: false, emphasis: false, center: false }
    partial['b1'] = { collapsed: true, faded: false, emphasis: false, center: false }
    partial['c1'] = { collapsed: false, faded: false, emphasis: true }
  }
  applyModules(partial)
  const ops = hits.map(id => ({ id, label: MODULE_LABELS[id], action: hide ? 'hide' : up ? 'up' : down ? 'down' : 'show' }))
  return { type: 'modulecmd', ops, expandPenet }
}
