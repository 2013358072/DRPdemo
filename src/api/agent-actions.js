/**
 * Agent action protocol.
 * Keep this intentionally tiny: ordinary chat must never move the page.
 */

export const STEEL_CONTRACT_ID = 'HT-202605002'
export const STEEL_PRICE_RISK_ID = 'HT-2026002'

const DOMAIN_TARGETS = new Set(['equity', 'finance', 'overseas', 'invest'])

export const AGENT_CAPABILITIES = `
## 页面操控能力
只有当用户明确要求"打开/进入/跳转/查看/切到"某个页面或指定合同/风险分析时，才可以在回复末尾插入行动指令。
普通问候、闲聊、解释、建议、概览问答、"你好"、"谢谢"、"你是谁" 等场景禁止插入任何 <drp> 指令。

可用动作仅限：
- navigate: 跳转固定域，target 只能是 equity(合同域)、finance(资金域)、overseas(采购域)、invest(投资域)
- openContract: 只允许打开华东电力有限公司的钢材采购合同详情，target 必须是 HT-202605002
- analyzeRisk: 只允许跳转到钢材采购合同并触发第一项价格异动预警风险分析，target 必须是 HT-2026002

示例：
"打开合同域" → <drp>{"type":"navigate","target":"equity"}</drp>
"去资金域" → <drp>{"type":"navigate","target":"finance"}</drp>
"查看华东电力钢材采购合同详情" → <drp>{"type":"openContract","target":"HT-202605002"}</drp>
"打开这份合同详情" → <drp>{"type":"openContract","target":"HT-202605002"}</drp>
"分析钢材采购合同价格异动预警" → <drp>{"type":"analyzeRisk","target":"HT-2026002"}</drp>
"HT-2026002 采购合同价格异动预警" → <drp>{"type":"analyzeRisk","target":"HT-2026002"}</drp>

不要为风险建议、普通回答或问候自动跳转页面。
`

const DOMAIN_KEYWORDS = {
  equity: ['合同域', '合同', '钢材采购', STEEL_CONTRACT_ID],
  finance: ['资金域', '资金'],
  overseas: ['采购域', '采购'],
  invest: ['投资域', '投资'],
}
const INTENT_WORDS = ['打开', '进入', '跳转', '查看', '切到', '切换', '去', '带我到', '定位']
const CONTRACT_DETAIL_WORDS = ['合同详情', '这份合同', '该合同', '钢材采购合同', STEEL_CONTRACT_ID]
const PRICE_RISK_WORDS = ['价格异动预警', '采购合同价格异动预警', '价格异动', STEEL_PRICE_RISK_ID]
const STEEL_WORDS = ['钢材采购', '价格异动', '华东电力', STEEL_CONTRACT_ID, STEEL_PRICE_RISK_ID]

function hasAny(text, words) {
  return words.some((word) => text.includes(word))
}

function normalizeAction(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string') return null
  const action = {
    type: raw.type,
    target: typeof raw.target === 'string' ? raw.target.trim() : '',
  }

  if (action.type === 'navigate' && DOMAIN_TARGETS.has(action.target)) return action
  if (action.type === 'openContract' && action.target === STEEL_CONTRACT_ID) return action
  if (action.type === 'analyzeRisk' && action.target === STEEL_PRICE_RISK_ID) return action
  return null
}

export function isActionAllowedForPrompt(action, prompt = '') {
  const text = String(prompt || '').trim()
  if (!text) return false

  if (action.type === 'navigate') {
    return hasAny(text, INTENT_WORDS) && hasAny(text, DOMAIN_KEYWORDS[action.target] || [])
  }

  if (action.type === 'openContract') {
    return hasAny(text, INTENT_WORDS) && hasAny(text, [...STEEL_WORDS, ...CONTRACT_DETAIL_WORDS])
  }

  if (action.type === 'analyzeRisk') {
    return hasAny(text, PRICE_RISK_WORDS)
  }

  return false
}

function pushUnique(actions, action) {
  if (!actions.some((item) => item.type === action.type && item.target === action.target)) {
    actions.push(action)
  }
}

export function deriveActionsFromPrompt(prompt = '') {
  const text = String(prompt || '').trim()
  const actions = []
  if (!text) return actions

  if (hasAny(text, PRICE_RISK_WORDS)) {
    pushUnique(actions, { type: 'analyzeRisk', target: STEEL_PRICE_RISK_ID })
    return actions
  }

  if (hasAny(text, INTENT_WORDS) && hasAny(text, CONTRACT_DETAIL_WORDS)) {
    pushUnique(actions, { type: 'openContract', target: STEEL_CONTRACT_ID })
    return actions
  }

  for (const target of DOMAIN_TARGETS) {
    if (hasAny(text, INTENT_WORDS) && hasAny(text, DOMAIN_KEYWORDS[target] || [])) {
      pushUnique(actions, { type: 'navigate', target })
      return actions
    }
  }

  return actions
}

export function parseActions(text, prompt = '') {
  const actions = []
  const regex = /<drp>([\s\S]*?)<\/drp>/g
  let match
  while ((match = regex.exec(text)) !== null) {
    try {
      const action = normalizeAction(JSON.parse(match[1]))
      if (action && isActionAllowedForPrompt(action, prompt)) actions.push(action)
    } catch {}
  }
  return actions
}

export function mergeActions(...groups) {
  const actions = []
  for (const group of groups) {
    for (const action of group || []) pushUnique(actions, action)
  }
  return actions
}

export function stripActions(text) {
  return text.replace(/<drp>[\s\S]*?<\/drp>/g, '').trim()
}

export const actionExecutors = {
  navigate(target) {
    if (window.__agentNavigate) window.__agentNavigate(target)
  },
  openContract(target) {
    if (window.__agentOpenContract) window.__agentOpenContract(target)
  },
  analyzeRisk(target) {
    if (window.__agentAnalyzeRisk) window.__agentAnalyzeRisk(target)
  },
}
