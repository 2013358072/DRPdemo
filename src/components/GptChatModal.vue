<template>
  <transition name="gpt-fade">
    <div v-if="visible" class="gpt-overlay" @click.self="close">
      <div class="gpt-modal" :class="{ collapsed: sidebarCollapsed }">

        <!-- 左侧栏 -->
        <aside class="gpt-sidebar" v-show="!sidebarCollapsed">
          <div class="gpt-side-head">
            <button class="gpt-new-chat" @click="newChat">+ 新对话</button>
            <button class="gpt-side-toggle" @click="sidebarCollapsed = true">◀</button>
          </div>
          <div class="gpt-side-scroll">
            <template v-if="pinnedList.length">
              <div class="gpt-side-sect">📌 置顶</div>
              <div v-for="h in pinnedList" :key="h._id" class="gpt-side-item" :class="{ active: activeHistory === h._id }" @click="switchHistory(h._id)">
                <div class="gsi-icon">💬</div><div class="gsi-body"><div class="gsi-title" v-if="editingId!==h._id">{{ h.title }}</div><input v-else class="gsi-edit" v-model="renameText" @blur="finishRename(h)" @keydown.enter="finishRename(h)" @click.stop /><div class="gsi-time">{{ formatTime(h.time) }}</div></div>
                <div class="gsi-menu-wrap" @click.stop><button class="gsi-dots" @click="toggleMenu(h._id)">···</button>
                  <div v-if="menuOpen===h._id" class="gsi-menu" v-click-outside="()=>menuOpen=''">
                    <button @click="togglePin(h);menuOpen=''">📌 {{ h.pinned?'取消置顶':'置顶' }}</button>
                    <button @click="startRename(h);menuOpen=''">✎ 重命名</button>
                    <button class="gsi-menu-del" @click="deleteHistory(h._id);menuOpen=''">🗑 删除</button>
                  </div>
                </div>
              </div>
            </template>
            <div class="gpt-side-sect" v-if="pinnedList.length">💬 对话</div>
            <div v-for="h in normalList" :key="h._id" class="gpt-side-item" :class="{ active: activeHistory===h._id }" @click="switchHistory(h._id)">
              <div class="gsi-icon">💬</div><div class="gsi-body"><div class="gsi-title" v-if="editingId!==h._id">{{ h.title }}</div><input v-else class="gsi-edit" v-model="renameText" @blur="finishRename(h)" @keydown.enter="finishRename(h)" @click.stop /><div class="gsi-time">{{ formatTime(h.time) }}</div></div>
              <div class="gsi-menu-wrap" @click.stop><button class="gsi-dots" @click="toggleMenu(h._id)">···</button>
                <div v-if="menuOpen===h._id" class="gsi-menu" v-click-outside="()=>menuOpen=''">
                  <button @click="togglePin(h);menuOpen=''">📌 {{ h.pinned?'取消置顶':'置顶' }}</button>
                  <button @click="startRename(h);menuOpen=''">✎ 重命名</button>
                  <button class="gsi-menu-del" @click="deleteHistory(h._id);menuOpen=''">🗑 删除</button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- 右侧 -->
        <div class="gpt-main">
          <div class="gpt-header">
            <div class="gpt-header-left">
              <button v-if="sidebarCollapsed" class="gpt-side-expand" @click="sidebarCollapsed = false">▶</button>
              <div class="gpt-avatar">🤖</div>
              <strong>AI 小助手</strong>
              <span v-if="agentToast" class="agent-toast">{{ agentToast }}</span>
            </div>
            <div class="gpt-header-right">
              <div class="think-toggle"><span class="think-label">💭</span><select class="think-select" v-model="thinkLevel" @change="saveThinkLevel"><option v-for="t in thinkLevels" :key="t.value" :value="t.value">{{ t.label }}</option></select></div>
              <button class="gpt-close" @click="close">✕</button>
            </div>
          </div>

          <div class="gpt-messages" ref="msgContainer">
            <div v-if="!currentMessages.length && !stream.active" class="gpt-welcome">
              <div class="gpt-welcome-icon">🤖</div>
              <h2>AI 智能 Agent</h2>
              <p>用自然语言操控整个 DRP 系统。试试说：<br>"帮我打开合同域，筛选高风险"</p>
            </div>

            <!-- 历史消息 -->
            <template v-for="(msg,i) in currentMessages" :key="'h'+i">
              <div v-if="msg.role==='user'" class="gpt-msg gpt-msg-user">
                <div class="gpt-msg-avatar">👤</div><div class="gpt-msg-body"><div class="gpt-msg-bubble"><div class="gpt-msg-text" v-html="renderMsg(msg.content)"></div></div><div class="gpt-msg-meta"><span class="gpt-msg-time">{{ msg.time }}</span></div></div>
              </div>
              <div v-else>
                <div v-if="msg.thinking && thinkLevel!=='off'" class="gpt-msg"><div class="gpt-msg-avatar">🤖</div><div class="gpt-msg-body"><div class="gpt-thinking"><button class="gt-toggle" @click="msg._thinkOpen=!msg._thinkOpen">💭 思考完成 {{ msg._thinkOpen?'▾':'▸' }}</button><div v-if="msg._thinkOpen" class="gt-body">{{ msg.thinking }}</div></div></div></div>
                <div class="gpt-msg" :class="{ 'gt-no-avatar': msg.thinking && thinkLevel!=='off' }">
                  <div v-if="!msg.thinking || thinkLevel==='off'" class="gpt-msg-avatar">🤖</div>
                  <div class="gpt-msg-body" :style="(msg.thinking && thinkLevel!=='off')?{paddingLeft:'48px'}:{}"><div class="gpt-msg-bubble"><div class="gpt-msg-text" v-html="renderMsg(msg.display || msg.content)"></div></div><div class="gpt-msg-meta"><span class="gpt-msg-time">{{ msg.time }}</span></div></div>
                </div>
              </div>
            </template>

            <!-- 流式区域 -->
            <template v-if="stream.active">
              <div v-if="stream.thinking && thinkLevel!=='off'" class="gpt-msg"><div class="gpt-msg-avatar">🤖</div><div class="gpt-msg-body"><div class="gpt-thinking gt-streaming"><button class="gt-toggle" @click="stream.thinkOpen=!stream.thinkOpen">💭 思考{{ stream.content?'完成':'中...' }} {{ stream.thinkOpen?'▾':'▸' }}</button><div v-if="stream.thinkOpen" class="gt-body">{{ stream.thinking }}</div></div></div></div>
              <div class="gpt-msg" :class="{ 'gt-no-avatar': stream.thinking && thinkLevel!=='off' }">
                <div v-if="!stream.thinking || thinkLevel==='off'" class="gpt-msg-avatar">🤖</div>
                <div class="gpt-msg-body" :style="(stream.thinking && thinkLevel!=='off')?{paddingLeft:'48px'}:{}"><div class="gpt-msg-bubble"><div class="gpt-msg-text" v-html="renderStream(stream.content)"></div><span class="gpt-cursor">|</span></div></div>
              </div>
            </template>

            <div v-if="streamingWait && !stream.active" class="gpt-msg"><div class="gpt-msg-avatar">🤖</div><div class="gpt-msg-body"><div class="gpt-msg-bubble"><span class="gpt-typing"><span>.</span><span>.</span><span>.</span></span></div></div></div>
          </div>

          <div class="gpt-input-row">
            <button class="gpt-mic" :class="{ active: listening }" @click="toggleMic" :title="listening?'停止录音':'语音输入'">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              <span v-if="listening" class="mic-pulse"></span>
            </button>
            <input class="gpt-input" v-model="input" :placeholder="listening?'🎤 正在聆听...':(micError||'输入指令, 按 Enter 执行...')" :class="{ 'input-error': micError }" @keydown.enter="send" :disabled="streamingWait||stream.active" />
            <button class="gpt-send" @click="send" :disabled="(streamingWait||stream.active)||!input.trim()">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { chatWithDeepSeekStream, loadConversations, saveConversations } from '../api/deepseek.js'
import { actionExecutors, deriveActionsFromPrompt, mergeActions, parseActions, stripActions } from '../api/agent-actions.js'

const props = defineProps({ visible: Boolean, scene: String })
const emit = defineEmits(['close', 'action'])

const input = ref(''), msgContainer = ref(null), activeHistory = ref(''), sidebarCollapsed = ref(false)
const menuOpen = ref(''), editingId = ref(''), renameText = ref('')
const thinkLevel = ref(localStorage.getItem('drp_think_level') || 'low')
const thinkLevels = [{ value:'max',label:'💭 最大' },{ value:'high',label:'💭 高' },{ value:'medium',label:'💭 中' },{ value:'low',label:'💭 低' },{ value:'off',label:'💤 关' }]
function saveThinkLevel() { localStorage.setItem('drp_think_level', thinkLevel.value) }

// 流式状态
const stream = reactive({ active: false, thinking: '', content: '', thinkOpen: true })
const streamingWait = ref(false)
const agentToast = ref('')

const now = () => { const d = new Date(); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }
function uid() { return 'c'+Date.now()+'_'+Math.random().toString(36).slice(2,8) }

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t); if (isNaN(d)) return t
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return '今天'
  const y = new Date(today); y.setDate(y.getDate()-1)
  if (d.toDateString() === y.toDateString()) return '昨天'
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// 历史
const historyList = ref([])
const pinnedList = computed(() => historyList.value.filter(h => h.pinned))
const normalList = computed(() => historyList.value.filter(h => !h.pinned))
function findHistory(id) { return historyList.value.find(h => h._id===id) }
const currentMessages = computed(() => findHistory(activeHistory.value)?.msgs || [])

const DEMO_CONVERSATIONS = [
  {
    _id: 'demo1', title: '合同价格异动分析', pinned: true, _named: true,
    time: '2026-05-27T14:30:00',
    msgs: [
      { role: 'user', content: '最近合同域有什么高风险需要关注？', time: '14:30' },
      { role: 'assistant', content: '合同域当前高风险合同 12 份。最需要关注的是 **HT-202605002 钢材采购合同**，单价 5800 元/吨，较历史均价 5200 元/吨偏高 11.5%，触发中风险预警。另外 HT-2026-0312 存在 100% 预付 + 无质保金问题，甲方完全丧失履约制衡手段。', time: '14:30', _thinkOpen: false },
      { role: 'user', content: 'HT-202605002 具体是什么情况？帮我分析一下', time: '14:32' },
      { role: 'assistant', content: 'HT-202605002 由华东电力与XX建材有限公司签订，100 吨 Φ16mm 螺纹钢，总价 58 万元。主要问题：\n\n1. **价格异动**：较历史均价偏高 11.5%，超出 ±10% 预警阈值\n2. **采购违规**：仅询价 2 家，未公开招标\n3. **付款异常**：付款 64% 超履约 62%，存在超进度付款\n\n建议启动 AI 风险穿透分析。', time: '14:32', _thinkOpen: false },
      { role: 'user', content: '帮我打开这个合同的 AI 风险分析', time: '14:35' },
      { role: 'assistant', content: '好的，已帮你定位到 HT-202605002。建议先查看「超进度付款风险预警」（HT-2026004）和「采购合同价格异动预警」（HT-2026002），这两个是当前最紧急的风险项。', time: '14:35', _thinkOpen: false },
    ]
  },
  {
    _id: 'demo2', title: '资金异常付款排查', pinned: false, _named: true,
    time: '2026-05-26T10:15:00',
    msgs: [
      { role: 'user', content: '昨天那笔大额付款怎么回事？', time: '10:15' },
      { role: 'assistant', content: '你说的是 **ZJ-2026001** 吧。5 月 18 日华东电力向 XX 贸易有限公司支付 500 万元"采购货款"，但系统核查发现三个问题：\n\n🔴 无对应合同支撑（关联的 HT-202603005 金额仅 300 万）\n🔴 无采购验收记录\n🔴 审批流程未完成即支付\n\n目前状态：**待核查**，整改期限 5 月 25 日。', time: '10:15', _thinkOpen: false },
      { role: 'user', content: '这个供应商之前有没有类似的异常？', time: '10:18' },
      { role: 'assistant', content: '该供应商（XX贸易有限公司）近 12 个月共有 3 笔交易记录，其中 1 笔也存在付款金额超合同约定 15% 的情况。建议穿透核查其历史合同和银行流水。', time: '10:18', _thinkOpen: false },
      { role: 'user', content: '好，帮我把资金域的高风险都筛出来', time: '10:20' },
      { role: 'assistant', content: '已为你筛选。资金域当前高风险付款共 3 笔：ZJ-2026001（500万/待核查）、PO-2026-0516-012（920万/已拦截）、PO-2026-0513-006（4200万/待审核）。建议优先处置 ZJ-2026001。', time: '10:20', _thinkOpen: false },
    ]
  },
  {
    _id: 'demo3', title: '集团风险态势总览', pinned: false, _named: true,
    time: '2026-05-24T09:00:00',
    msgs: [
      { role: 'user', content: '帮我看看集团上周整体风险情况', time: '09:00' },
      { role: 'assistant', content: '上周集团风险总评分 **68 分**（较前周 +2），37 个未闭环风险事件。各域排名：\n\n🔴 资金域（84 分）— 最高风险，6 待办\n🔴 合同域（81 分）— 12 高风险合同\n🟠 采购域（68 分）— 围标嫌疑 7 项\n🟠 投资域（61 分）— 2 项目超预算\n\n建议重点关注资金域的大额异常付款和合同域的价格异动。', time: '09:00', _thinkOpen: false },
      { role: 'user', content: '具体哪些板块最严重？', time: '09:03' },
      { role: 'assistant', content: '工程建设板块风险最高，集中在海外工程总承包和城市基建投资两家公司。电力能源板块主要风险在华东电力的合同管理和西北新能源的投资偏差。', time: '09:03', _thinkOpen: false },
      { role: 'user', content: '给我一个包含各域高风险数量的汇总', time: '09:05' },
      { role: 'assistant', content: '📊 **集团高风险事件汇总**\n\n| 域 | 高风险 | 中风险 | 低风险 |\n|------|------|------|------|\n| 资金 | 1 | 3 | 13 |\n| 合同 | 12 | 8 | 6 |\n| 采购 | 7 | 12 | — |\n| 投资 | 2 | 8 | — |\n\n合计待处置：23 件，已闭环：12 件。', time: '09:05', _thinkOpen: false },
    ]
  },
]

onMounted(() => {
  const saved = loadConversations()
  if (saved?.length) {
    historyList.value = saved.map(h=>({...h,_id:h._id||uid(),pinned:!!h.pinned}))
  } else {
    historyList.value = [...DEMO_CONVERSATIONS]
    // 清掉旧的空对话
    localStorage.removeItem('drp_ai_conversations')
  }
  if (!activeHistory.value && historyList.value.length) activeHistory.value = historyList.value[0]._id
})
function persist() { saveConversations(historyList.value) }
// 弹窗打开时滚动 + 活跃对话 + 语音查询监听
watch(()=>props.visible,(v)=>{
  if(v){
    nextTick(scrollBottom)
    if(!activeHistory.value&&historyList.value.length)activeHistory.value=historyList.value[0]._id
    window.addEventListener('agent-voice-query', onVoiceQuery)
  } else {
    window.removeEventListener('agent-voice-query', onVoiceQuery)
  }
})
function scrollBottom(){nextTick(()=>{const el=msgContainer.value;if(el)el.scrollTop=el.scrollHeight})}

function newChat(){const id=uid();historyList.value.unshift({_id:id,title:'新对话',time:'',msgs:[],pinned:false});activeHistory.value=id;persist()}
function switchHistory(id){activeHistory.value=id;setTimeout(scrollBottom,50)}
function deleteHistory(id){historyList.value=historyList.value.filter(h=>h._id!==id);if(activeHistory.value===id)activeHistory.value=historyList.value[0]?._id||'';persist()}
function togglePin(h){h.pinned=!h.pinned;persist()}
function toggleMenu(id){menuOpen.value=menuOpen.value===id?'':id}
function startRename(h){editingId.value=h._id;renameText.value=h.title;nextTick(()=>document.querySelector('.gsi-edit')?.focus())}
function finishRename(h){if(renameText.value.trim())h.title=renameText.value.trim();editingId.value='';persist()}
const vClickOutside={mounted(el,binding){el.__co=(e)=>{if(!el.contains(e.target))binding.value(e)};document.addEventListener('click',el.__co)},unmounted(el){document.removeEventListener('click',el.__co)}}

function renderMsg(text) {
  if (!text) return ''
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')
}

// 流式渲染：实时隐藏 <drp> 行动指令（含正在输出、尚未闭合的半截标签），不让其作为正文显示
function renderStream(text) {
  if (!text) return ''
  let t = text.replace(/<drp>[\s\S]*?<\/drp>/g, '')
  const i = t.indexOf('<drp')
  if (i !== -1) t = t.slice(0, i)
  return renderMsg(t)
}

// ═══ Agent 行动执行 ═══
const actionTimers = new Set()
let toastTimer = null
let micErrorTimer = null

function queueAction(callback, delay) {
  const timer = setTimeout(() => {
    actionTimers.delete(timer)
    callback()
  }, delay)
  actionTimers.add(timer)
}

function executeAgentActions(actions) {
  if (!actions.length) return
  let delay = 300
  for (const action of actions) {
    queueAction(() => {
      showAgentToast(action)
      if (action.type === 'navigate' && action.target) {
        actionExecutors.navigate(action.target)
        emit('action', { type: 'navigate', scene: action.target })
      } else if (action.type === 'openContract' && action.target) {
        actionExecutors.openContract(action.target)
        emit('action', { type: 'navigate', scene: 'equity' })
      } else if (action.type === 'analyzeRisk' && action.target) {
        actionExecutors.analyzeRisk(action.target)
        emit('action', { type: 'navigate', scene: 'equity' })
      }
    }, delay)
    delay += 400
  }
}

function showAgentToast(action) {
  const labels = { navigate: '跳转页面', openContract: '打开合同', analyzeRisk: '分析风险' }
  agentToast.value = `⚡ ${labels[action.type] || action.type}: ${action.target || ''}`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { agentToast.value = '' }, 2000)
}

// ═══ 语音识别（ChatGPT 风格） ═══
const listening = ref(false)
const micError = ref('')
let recognition = null

function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = 'cmn-Hans-CN'
  rec.interimResults = true
  rec.continuous = true
  return rec
}

let autoStopTimer = null
const SILENCE_TIMEOUT = 3000 // 3秒没说话自动停

function toggleMic() {
  if (listening.value) {
    clearTimeout(autoStopTimer)
    recognition?.stop()
    recognition = null
    listening.value = false
    return
  }

  recognition = initRecognition()
  if (!recognition) { micError.value = '请用 Chrome 浏览器打开'; return }

  recognition.onresult = (event) => {
    // 每次收到结果，重置静默计时器
    clearTimeout(autoStopTimer)
    let final = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript.trim()
      if (event.results[i].isFinal) final += text
    }
    if (final) {
      input.value = final
      recognition?.stop()
    }
    // 设一个静默超时，3秒没新结果就自动停
    autoStopTimer = setTimeout(() => {
      if (recognition) recognition.stop()
    }, SILENCE_TIMEOUT)
  }

  recognition.onerror = (event) => {
    console.log('[Mic] error:', event.error)
    if (event.error === 'aborted') return // 忽略 abort，由 onend 处理
    if (event.error === 'not-allowed') micError.value = '请允许麦克风权限'
    else if (event.error === 'no-speech') micError.value = '未检测到声音'
    else micError.value = event.error
    clearTimeout(micErrorTimer)
    micErrorTimer = setTimeout(() => micError.value = '', 3000)
  }

  recognition.onend = () => {
    clearTimeout(autoStopTimer)
    listening.value = false
    recognition = null
  }

  recognition.onaudiostart = () => { listening.value = true; micError.value = '' }

  try {
    recognition.start()
    listening.value = true
  } catch (e) {
    micError.value = '语音启动失败'; listening.value = false
  }
}

// ═══ 发送 ═══
function send() {
  const q = input.value.trim(); if (!q || streamingWait.value || stream.active) return
  const hist = findHistory(activeHistory.value); if (!hist) return

  if (!hist.msgs.length) { hist.title = q.slice(0,18)+(q.length>18?'…':''); hist._named = false }
  hist.time = now()
  const promptActions = deriveActionsFromPrompt(q)
  hist.msgs.push({ role: 'user', content: q, time: now(), _promptActions: promptActions })
  input.value = ''

  stream.active = false; stream.thinking = ''; stream.content = ''; stream.thinkOpen = true
  streamingWait.value = true; scrollBottom(); persist()
  if (promptActions.length) executeAgentActions(promptActions)
  callStreamAPI(hist)
}

async function callStreamAPI(hist) {
  let contentStarted = false
  try {
    await chatWithDeepSeekStream(hist.msgs, { scene: props.scene, thinkLevel: thinkLevel.value }, {
      onToken(token) {
        if (!contentStarted) { contentStarted = true; streamingWait.value = false; stream.active = true; if (stream.thinking) stream.thinkOpen = false }
        stream.content += token; scrollBottom()
      },
      onThinking(t) { streamingWait.value = false; stream.active = true; if (thinkLevel.value !== 'off') { stream.thinking += t; scrollBottom() } },
    })

    // 解析 Agent 行动
    const lastUserMessage = [...hist.msgs].reverse().find((m) => m.role === 'user') || {}
    const lastUserPrompt = lastUserMessage.content || ''
    const promptActions = lastUserMessage._promptActions || []
    const modelActions = parseActions(stream.content, lastUserPrompt)
    const actions = modelActions.filter((action) => !promptActions.some((item) => item.type === action.type && item.target === action.target))
    const recordedActions = mergeActions(promptActions, modelActions)
    let displayText = stripActions(stream.content)
    const partialIdx = displayText.indexOf('<drp')
    if (partialIdx !== -1) displayText = displayText.slice(0, partialIdx).trim()

    const finalMsg = { role: 'assistant', content: stream.content, display: displayText, time: now(), thinking: thinkLevel.value !== 'off' ? stream.thinking : '', _thinkOpen: false, _actions: recordedActions }
    if (!finalMsg.thinking) delete finalMsg.thinking
    hist.msgs.push(finalMsg)

    // 执行行动
    if (actions.length) executeAgentActions(actions)
  } catch (e) {
    hist.msgs.push({ role: 'assistant', content: `抱歉，AI 暂不可用（${e.message?.slice(0,60)}）`, display: `抱歉，AI 暂不可用（${e.message?.slice(0,60)}）`, time: now() })
  } finally {
    stream.active = false; stream.thinking = ''; stream.content = ''
    streamingWait.value = false; autoTitle(hist); persist(); scrollBottom()
  }
}

async function autoTitle(hist) {
  const userMsgs = hist.msgs.filter(m => m.role === 'user')
  if (userMsgs.length === 1 && !hist._named) hist.title = userMsgs[0].content.slice(0,20)+(userMsgs[0].content.length>20?'…':'')
  if (userMsgs.length === 2 && !hist._named) {
    hist._named = true
    try {
      const prompt = `根据两轮对话生成标题（不超过20字，直接返回）：\n第一轮 问：${userMsgs[0]?.content?.slice(0,100)||''} 答：${(hist.msgs.find(m=>m.role==='assistant')?.content||'').slice(0,100)}\n第二轮 问：${userMsgs[1]?.content?.slice(0,100)||''} 答：${(hist.msgs.findLast(m=>m.role==='assistant')?.content||'').slice(0,100)}`
      const r = await chatWithDeepSeekStream([{ role: 'user', content: prompt }], { thinkLevel: 'off' }, { onToken(){}, onThinking(){} })
      if (r.content?.trim()) hist.title = r.content.trim().slice(0,20)
    } catch { hist.title = userMsgs[0].content.slice(0,20) }
  }
}

// 监听语音查询 → 自动发送（确保对话已就绪）
function onVoiceQuery(e) {
  if (!e.detail?.text || stream.active || streamingWait.value) return
  let hist = findHistory(activeHistory.value)
  if (!hist) newChat()
  nextTick(() => {
    hist = findHistory(activeHistory.value)
    if (!hist) return
    input.value = e.detail.text
    nextTick(() => send())
  })
}

onBeforeUnmount(() => {
  window.removeEventListener('agent-voice-query', onVoiceQuery)
  actionTimers.forEach((timer) => clearTimeout(timer))
  actionTimers.clear()
  clearTimeout(toastTimer)
  clearTimeout(micErrorTimer)
  clearTimeout(autoStopTimer)
  recognition?.stop()
  recognition = null
})

function close() { emit('close') }
</script>

<style scoped>
.gpt-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.35);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center}
.gpt-modal{width:92vw;max-width:1200px;height:92vh;max-height:900px;background:#fff;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.16);display:flex;overflow:hidden;border:1px solid #e2e8f0;transition:all .25s}
.gpt-modal.collapsed{width:72vw;max-width:960px}

.gpt-sidebar{width:280px;flex-shrink:0;background:#f8fafc;border-right:1px solid #e2e8f0;display:flex;flex-direction:column}
.gpt-side-head{display:flex;gap:6px;padding:12px}
.gpt-new-chat{flex:1;height:36px;border-radius:8px;border:1px solid #ddd6fe;background:#f5f3ff;color:#7c3aed;font-size:13px;font-weight:600;cursor:pointer}
.gpt-new-chat:hover{background:#7c3aed;color:#fff}
.gpt-side-toggle{width:36px;height:36px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#94a3b8;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.gpt-side-scroll{flex:1;overflow-y:auto;padding:0 8px 8px}
.gpt-side-sect{font-size:10px;font-weight:700;color:#94a3b8;padding:8px 10px 4px;letter-spacing:.06em}
.gpt-side-item{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:8px;cursor:pointer;transition:.14s;position:relative}
.gpt-side-item:hover,.gpt-side-item.active{background:#fff;border:1px solid #e2e8f0}
.gsi-icon{font-size:13px;flex-shrink:0}
.gsi-body{flex:1;min-width:0}
.gsi-title{font-size:12px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gsi-time{font-size:9px;color:#94a3b8}
.gsi-edit{width:100%;height:22px;padding:0 6px;border:1px solid #93c5fd;border-radius:4px;font-size:12px;outline:none}
.gsi-menu-wrap{position:relative;flex-shrink:0}
.gsi-dots{width:26px;height:26px;border-radius:6px;border:none;background:none;color:#94a3b8;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;letter-spacing:1px;opacity:0;transition:.14s}
.gpt-side-item:hover .gsi-dots{opacity:1}
.gsi-dots:hover{background:#e2e8f0}
.gsi-menu{position:absolute;right:0;top:100%;z-index:20;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,.1);padding:4px;min-width:120px}
.gsi-menu button{display:block;width:100%;padding:6px 10px;border:none;background:none;font-size:12px;color:#334155;cursor:pointer;text-align:left;border-radius:4px}
.gsi-menu button:hover{background:#f1f5f9}
.gsi-menu-del:hover{background:#fee2e2!important;color:#ef4444!important}

.gpt-main{flex:1;display:flex;flex-direction:column;min-width:0}
.gpt-header{display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #f1f5f9;background:#fafbfc;flex-shrink:0}
.gpt-header-left{display:flex;align-items:center;gap:10px}
.gpt-header-right{display:flex;align-items:center;gap:12px}
.gpt-side-expand{width:30px;height:30px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;color:#94a3b8;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.gpt-avatar{font-size:26px}
.gpt-header-left strong{font-size:16px;color:#0f172a}
.agent-toast{font-size:11px;color:#7c3aed;background:#f5f3ff;padding:2px 10px;border-radius:999px;font-weight:600;animation:toastIn .3s}
@keyframes toastIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.think-toggle{display:flex;align-items:center;gap:4px}
.think-label{font-size:13px}
.think-select{height:30px;padding:0 8px;border-radius:6px;border:1px solid #e2e8f0;background:#fff;font-size:12px;color:#475569;cursor:pointer;outline:none}
.think-select:focus{border-color:#93c5fd}
.gpt-close{width:32px;height:32px;border-radius:50%;border:1px solid #e2e8f0;background:#fff;font-size:15px;cursor:pointer;color:#64748b;display:flex;align-items:center;justify-content:center}
.gpt-close:hover{background:#f1f5f9;color:#0f172a}

.gpt-messages{flex:1;min-height:0;overflow-y:auto;padding:20px 28px;display:flex;flex-direction:column;gap:18px;background:#fff}
.gpt-welcome{text-align:center;padding:80px 20px}
.gpt-welcome-icon{font-size:56px}
.gpt-welcome h2{font-size:24px;color:#0f172a;margin:16px 0 8px}
.gpt-welcome p{font-size:15px;color:#64748b}

.gpt-msg{display:flex;gap:14px}
.gpt-msg-user{flex-direction:row-reverse}
.gpt-msg-avatar{width:34px;height:34px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.gpt-msg-body{max-width:82%;display:flex;flex-direction:column}
.gpt-msg-user .gpt-msg-body{align-items:flex-end}
.gpt-msg-bubble{padding:12px 18px;border-radius:14px;font-size:14px;line-height:1.75}
.gpt-msg .gpt-msg-bubble{background:#f8fafc;border:1px solid #e2e8f0;color:#334155;border-top-left-radius:4px}
.gpt-msg-user .gpt-msg-bubble{background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;border-top-right-radius:4px}
.gpt-cursor{animation:blink .7s infinite;color:#2563eb;font-weight:700}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.gpt-msg-meta{margin-top:4px}
.gpt-msg-time{font-size:11px;color:#94a3b8}
.gpt-msg-user .gpt-msg-time{text-align:right}

.gpt-thinking{background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:8px 14px;margin-bottom:6px}
.gt-streaming{border-color:#c4b5fd}
.gt-toggle{background:none;border:none;font-size:12px;font-weight:700;color:#7c3aed;cursor:pointer;padding:0}
.gt-toggle:hover{color:#6d28d9}
.gt-body{margin-top:6px;font-size:12px;color:#6b7280;line-height:1.6;white-space:pre-wrap;border-left:2px solid #ddd6fe;padding-left:10px;max-height:200px;overflow-y:auto}

.gpt-typing{display:flex;gap:4px;padding:3px 0}
.gpt-typing span{width:7px;height:7px;border-radius:50%;background:#94a3b8;animation:gpt-bounce 1.2s infinite}
.gpt-typing span:nth-child(2){animation-delay:.15s}
.gpt-typing span:nth-child(3){animation-delay:.3s}
@keyframes gpt-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}

.gpt-input-row{display:flex;gap:10px;padding:14px 22px;border-top:1px solid #e2e8f0;background:#fafbfc;flex-shrink:0}
.gpt-mic{width:46px;height:46px;border-radius:50%;border:1px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;transition:.14s}
.gpt-mic:hover{background:#f5f3ff;border-color:#c4b5fd;color:#7c3aed}
.gpt-mic.active{background:#7c3aed;color:#fff;border-color:#7c3aed;box-shadow:0 0 0 0 rgba(124,58,237,.5);animation:micBreathe 1.6s ease-in-out infinite}
.mic-pulse{position:absolute;inset:-4px;border-radius:50%;border:2px solid #7c3aed;animation:micRing 1.2s ease-in-out infinite}
.mic-pulse::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:1.5px solid rgba(124,58,237,.3);animation:micRing 1.2s ease-in-out .4s infinite}
@keyframes micBreathe{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)}50%{box-shadow:0 0 0 12px rgba(124,58,237,0)}}
@keyframes micRing{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.12);opacity:1}}
.gpt-input{flex:1;height:46px;padding:0 18px;border-radius:23px;border:1px solid #e2e8f0;background:#fff;font-size:14px;color:#0f172a;outline:none}
.gpt-input:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(59,130,246,.08)}
.gpt-send{width:46px;height:46px;border-radius:50%;border:none;background:#2563eb;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.gpt-send:hover{background:#1d4ed8}
.gpt-send:disabled{opacity:.4;cursor:default}
.gpt-fade-enter-active,.gpt-fade-leave-active{transition:opacity .2s}
.gpt-fade-enter-from,.gpt-fade-leave-to{opacity:0}
</style>
