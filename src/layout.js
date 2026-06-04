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

// 由一段文本命中并应用 preset / 模块表现形式（供 AI 小助手 send() 调用）
export function applyPresetByText(text) {
  const t = String(text || '')
  // 模块表现形式切换（写死示例）：把「十大风险域」用趋势图/柱状图展示
  if (/(趋势|折线)/.test(t) && /(风险域|风险领域|十大|风险大类)/.test(t)) layoutState.b1Chart = 'trend'
  else if (/(柱状|条形|条状)/.test(t) && /(风险域|风险领域|十大|风险大类)/.test(t)) layoutState.b1Chart = 'bar'
  const key = Object.keys(KEYWORD_TO_PRESET).find(k => t.includes(k))
  if (key) return applyPreset(KEYWORD_TO_PRESET[key])
  return null
}
