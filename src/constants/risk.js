/** 风险等级：绿 / 黄 / 橙 / 红 */
export const RISK_LEVELS = {
  low: { key: 'low', label: '低风险', color: '#22c55e' },
  medium: { key: 'medium', label: '中风险', color: '#eab308' },
  high: { key: 'high', label: '高风险', color: '#f97316' },
  critical: { key: 'critical', label: '重大风险', color: '#ef4444' },
}

export function riskStyle(levelKey) {
  const m = RISK_LEVELS[levelKey] || RISK_LEVELS.low
  return { color: m.color, borderColor: m.color }
}
