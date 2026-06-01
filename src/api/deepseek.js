/**
 * DeepSeek API — 流式调用 + 思考模式 + Agent 行动
 */
import { buildSystemPrompt, globalContext } from './knowledge.js'

const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const MAX_HISTORY_TOKENS = 8000

function getApiKey() {
  const encoded = import.meta.env.VITE_DEEPSEEK_KEY_ENCODED
  if (!encoded) throw new Error('未配置 API Key，请在 .env 中设置 VITE_DEEPSEEK_KEY_ENCODED')
  return atob(encoded)
}

export function loadConversations() {
  try { const raw = localStorage.getItem('drp_ai_conversations'); return raw ? JSON.parse(raw) : null } catch { return null }
}
export function saveConversations(list) {
  try { localStorage.setItem('drp_ai_conversations', JSON.stringify(list)) } catch {}
}

function trimHistory(messages, maxTokens) {
  const total = messages.reduce((s, m) => s + Math.ceil(m.content.length / 2), 0)
  if (total <= maxTokens) return messages
  return [{ role: 'assistant', content: '[已截断早期消息]' }, ...messages.slice(-10)]
}

function thinkingInstruction(level) {
  const map = {
    max: '对每个问题深入多步推理。在 reasoning_content 中展示完整思考：问题拆解→多维分析→数据引用→结论推导。',
    high: '较详细分析，在 reasoning_content 中展示关键推理步骤。',
    medium: '适度思考，在 reasoning_content 中简要展示分析要点。',
    low: '仅必要时简短思考，大部分情况直接回答。',
    off: '【重要】禁止使用推理链。直接给出简洁答案，不要输出任何思考过程或 reasoning_content。',
  }
  return map[level] || map.low
}

export async function chatWithDeepSeekStream(messages, context = {}, { onToken, onThinking } = {}) {
  const apiKey = getApiKey()
  const thinkOff = context.thinkLevel === 'off'

  if (context.scene) globalContext.currentScene = context.scene
  if (context.pageName) globalContext.currentPage = context.pageName

  const systemPrompt = buildSystemPrompt({
    scene: globalContext.currentScene,
    pageName: globalContext.currentPage,
  }) + '\n\n' + thinkingInstruction(context.thinkLevel || 'low')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'system', content: systemPrompt }, ...trimHistory(messages, MAX_HISTORY_TOKENS).map(m => ({ role: m.role, content: m.content }))],
      max_tokens: 1024, temperature: 0.7, stream: true,
    }),
  })

  if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err.slice(0, 200)}`) }

  const reader = res.body.getReader(); const decoder = new TextDecoder()
  let fullText = '', thinkingText = '', buffer = ''
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n'); buffer = lines.pop() || ''
    for (const line of lines) {
      const t = line.trim(); if (!t?.startsWith('data:')) continue
      const d = t.slice(5).trim(); if (d === '[DONE]') continue
      try {
        const delta = JSON.parse(d).choices?.[0]?.delta
        if (delta?.reasoning_content && !thinkOff) { thinkingText += delta.reasoning_content; if (onThinking) onThinking(delta.reasoning_content) }
        if (delta?.content) { fullText += delta.content; if (onToken) onToken(delta.content) }
      } catch {}
    }
  }
  return { content: fullText, thinking: (!thinkOff && thinkingText) ? thinkingText : null }
}
