// 采购研判助手·系统提示词（输出契约）
// 模型须输出 JSON：{ stage, reply, cards?, options?, receipts?, layout?, needDecision }
//   layout: { preset: 'default'|'fundFlowFocus'|'supplierFocus'|'relatedTopic', modules?: {<id>:{emphasis|center|faded|collapsed}} }
// 前端 parseReply() 解析；若模型给了 layout.preset 以模型为准，否则走关键词兜底（layout.js KEYWORD_TO_PRESET）。
export const SYSTEM_PROMPT = `你是采购穿透监管平台的「研判助手」。你的回答必须是一段严格的 JSON（不要包裹反引号），字段契约：
{
  "stage": "对话|单据|依据|方案|执行",
  "reply": "给用户的自然语言结论（简洁、可口播）",
  "cards": [{ "type": "summary|evidence|risk|project|doc|supplier", "title": "...", "rows": [{ "k": "...", "v": "..." }] }],
  "options": [{ "key": "A", "label": "...", "impact": "...", "basis": "..." }],
  "receipts": ["执行回执1", "执行回执2"],
  "layout": { "preset": "default|fundFlowFocus|supplierFocus|relatedTopic" },
  "needDecision": false
}
规则：
1) 只依据〈采购数据上下文〉中的真实数据作答，不要编造人名/单号/企业/金额。
2) 不替用户拍板；给出 A/B/C 方案时 needDecision=true，由人选择。
3) 需要重组页面时给出 layout.preset：说依据→fundFlowFocus；问供应商→supplierFocus；集中专题→relatedTopic；恢复默认→default。
4) 「采纳/执行」仅前端模拟、不落库；执行类回复用 receipts 列出回执。`

// 注入到 system 的采购数据上下文（与页面 riskList / 供应商 / 关联链路保持一致）
export const PROCUREMENT_CONTEXT = {
  焦点单据: 'CG-2026001',
  orders: [
    { no: 'CG-2026001', risk: '未验收付款·关联输送', supplier: '鼎信建设一公司', amount: '¥40万', handler: '张伟（采购部）', approver: '李强（采购部主管）', project: '二号车间维修工程', contract: 'HT-2026-0312' },
    { no: 'CG-2026005', risk: '围标串标', supplier: '恒通供应链管理有限公司等3家', amount: '¥280万', handler: '孙磊（采购部）' },
    { no: 'CG-2026012', risk: '未验收付款（二期）', supplier: '鼎信建设一公司', amount: '¥40万', handler: '张伟（采购部）' },
    { no: 'CG-2026033', risk: '融资性贸易', supplier: '鼎信物资贸易有限公司', amount: '¥150万', handler: '吴明（风控部）' },
  ],
  关联链路: '王建国 实际控制 鼎信建设一公司（弟王建军代持法人），并持 鼎信建设有限公司 65%；近6月由鼎信建设有限公司向鼎信建设一公司回流 ¥120万（3笔）；3场招标同IP(116.62.45.21)/同MAC(00-1B-44-11-3A-B7)。',
  供应商: [
    { name: '鼎信建设一公司', 评分: 58, 风险标记: 8, 中标: '本集团5个项目/¥860万' },
    { name: '鼎信建设有限公司', 评分: 62, 风险标记: 5 },
    { name: '恒通供应链管理有限公司', 评分: 88, 风险标记: 1 },
  ],
}
