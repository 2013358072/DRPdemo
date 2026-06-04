<template>
  <transition name="gpt-fade">
    <div v-if="visible" class="gpt-overlay">
      <div class="gpt-modal" :class="{ collapsed: sidebarCollapsed }" :style="modalStyle">

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
          <div class="gpt-header gpt-drag-handle" @mousedown="startDrag">
            <div class="gpt-header-left">
              <button v-if="sidebarCollapsed" class="gpt-side-expand" @click="sidebarCollapsed = false">▶</button>
              <div class="gpt-avatar">🤖</div>
              <strong>AI 小助手</strong>
              <span class="gpt-drag-hint" title="按住可拖动">⠿</span>
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
                  <div class="gpt-msg-body" :style="(msg.thinking && thinkLevel!=='off')?{paddingLeft:'48px'}:{}">
                  <div class="gpt-msg-bubble">
                    <div class="gpt-msg-text" v-html="renderMsg(msg.display || msg.content)"></div>

                    <!-- 路线三：研判卡片 -->
                    <div v-for="(c, ci) in (msg.cards || [])" :key="'c'+ci" class="r3-card" :class="'r3-'+c.type">
                      <div class="r3-card-title">{{ c.title }}</div>
                      <div class="r3-card-rows">
                        <div v-for="(r, ri) in c.rows" :key="ri" class="r3-card-row">
                          <span class="r3-k">{{ r.k }}</span><span class="r3-v">{{ r.v }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 路线三：处置方案 A/B/C -->
                    <div v-if="msg.options" class="r3-options">
                      <div v-for="opt in msg.options" :key="opt.key" class="r3-opt">
                        <button class="r3-opt-btn" :class="'opt-'+opt.key" @click="r3ChoosePlan(opt)">
                          <span class="r3-opt-key">{{ opt.key }}</span>
                          <span class="r3-opt-main"><b>{{ opt.label }}</b><em>预计影响：{{ opt.impact }}</em></span>
                        </button>
                        <button class="r3-basis-toggle" @click="r3ToggleBasis(msg, opt.key)">{{ msg._basisKey === opt.key ? '收起依据 ▲' : '查看依据 ▼' }}</button>
                        <div v-if="msg._basisKey === opt.key" class="r3-basis">{{ opt.basis }}</div>
                      </div>
                    </div>

                    <!-- 路线三：执行回执 -->
                    <div v-if="msg.receipts" class="r3-receipts">
                      <div v-if="msg._revealed < msg.receipts.length" class="r3-exec-running"><span class="r3-spin"></span>执行中…（{{ msg._revealed }}/{{ msg.receipts.length }}）</div>
                      <div v-for="(rc, ri) in msg.receipts" :key="ri" v-show="ri < msg._revealed" class="r3-receipt"><span class="r3-check">✓</span><span>{{ rc }}</span></div>
                      <div v-if="msg._revealed >= msg.receipts.length" class="r3-exec-done">✓ 处置闭环完成（演示）</div>
                    </div>
                  </div>
                  <div class="gpt-msg-meta"><span class="gpt-msg-time">{{ msg.time }}</span></div>
                </div>
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
import { applyPresetByText } from '../layout.js'

const props = defineProps({ visible: Boolean, scene: String })
const emit = defineEmits(['close', 'action'])

const input = ref(''), msgContainer = ref(null), activeHistory = ref(''), sidebarCollapsed = ref(true)

// 面板拖动（始终以「右边距」锚定 → 打开历史/侧边栏时向左扩展，而非向右）
const dragPos = reactive({ right: null, top: null })
let dragOff = { x: 0, y: 0 }
let dragging = false
const modalStyle = computed(() => dragPos.right == null ? {} : { right: dragPos.right + 'px', top: dragPos.top + 'px', left: 'auto', bottom: 'auto' })
function startDrag(e) {
  if (e.target.closest('button, select, input, textarea, .gsi-edit')) return
  const modal = e.currentTarget.closest('.gpt-modal'); if (!modal) return
  const rect = modal.getBoundingClientRect()
  dragPos.right = Math.max(0, window.innerWidth - rect.right)
  dragPos.top = rect.top
  dragOff = { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width }
  dragging = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  e.preventDefault()
}
function onDrag(e) {
  if (!dragging) return
  const w = window.innerWidth, h = window.innerHeight
  const newLeft = e.clientX - dragOff.x
  // 用右边距锚定：右边距 = 视口宽 - (左 + 宽)；这样宽度变化（开侧边栏）时右边固定、向左扩展
  dragPos.right = Math.max(0, Math.min(w - (newLeft + dragOff.w), w - 120))
  dragPos.top = Math.max(0, Math.min(e.clientY - dragOff.y, h - 60))
}
function endDrag() { dragging = false; window.removeEventListener('mousemove', onDrag); window.removeEventListener('mouseup', endDrag) }
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

// ═══ 路线三：采购页脚本化研判演示（关键词命中固定卡片，未命中走真模型） ═══
const ROUTE3_QUICK = [
  '调出今日高风险研判报告',
  '第一条未验收付款，说说依据',
  '这家供应商还有别的问题吗',
  '把和这家供应商相关的都集中给我看',
  '这笔未验收付款该怎么处置',
  '恢复默认',
]
const showRoute3Quick = computed(() => props.scene === 'procurement')
const R3_REPORT = {
  reply: '已为您生成《今日高风险研判报告》，今日共 4 条高风险线索，按严重度排列。需要我对哪一条深入研判？',
  cards: [{ type: 'summary', title: '今日高风险研判报告（4条）', rows: [
    { k: '1 · 未验收付款', v: 'CG-2026001 · 鼎信建设一公司 · ¥40万 · 经办张伟' },
    { k: '2 · 围标串标', v: 'CG-2026005 · 恒通供应链等3家 · ¥280万 · 经办孙磊' },
    { k: '3 · 未验收付款(二期)', v: 'CG-2026012 · 鼎信建设一公司 · ¥40万 · 经办张伟' },
    { k: '4 · 融资性贸易', v: 'CG-2026033 · 鼎信物资贸易有限公司 · ¥150万 · 经办吴明' },
  ] }],
}
const R3 = {
  evidence: {
    reply: '第一条 CG-2026001 的核心问题：¥40万工程款已申请待付，但系统中验收单缺失、无验收人签字——属于未验收付款。AI 穿透发现承接方鼎信建设一公司与集团供应商鼎信建设有限公司同受王建国控制，疑为关联输送。',
    cards: [
      { type: 'evidence', title: '① 调依据', rows: [
        { k: '资金', v: '合同 HT-2026-0312 约定验收后付 80%（¥40万），工程未验收即申请付款；近6月鼎信建设有限公司向鼎信建设一公司回流 ¥120万（3笔）' },
        { k: '投标行为', v: '两家公司 3 场招标同一投标IP(116.62.45.21)、同一制单设备(MAC 00-1B-44-11-3A-B7)' },
        { k: '工商', v: '王建国持鼎信建设有限公司 65%，实际控制鼎信建设一公司（其弟王建军代持法人），未申报关联关系' },
      ] },
      { type: 'risk', title: '② 关联风险', rows: [
        { k: '风险类型', v: '未验收付款 + 关联输送（资金风险）' },
        { k: '命中红线', v: '十不准：不准未经验收支付款项' },
      ] },
      { type: 'project', title: '③ 具体项目', rows: [
        { k: '项目', v: '二号车间维修工程' },
        { k: '合同号', v: 'HT-2026-0312' },
        { k: '金额', v: '¥40万' },
      ] },
      { type: 'doc', title: '④ 穿透单据·责任人', rows: [
        { k: '采购单', v: 'CG-2026001' },
        { k: '经办', v: '张伟（采购部）' },
        { k: '审批', v: '李强（采购部主管）' },
        { k: '缺失节点', v: '验收单（YS-2026-0312）、验收人签字' },
      ] },
    ],
  },
  supplier: {
    reply: '鼎信建设一公司问题集中——健康评分仅 58、共 8 个风险标记，近年密集中标本集团 5 个项目（合计 ¥860万），中标集中度异常。除这笔未验收付款外，还涉未验收付款（二期）和资质挂靠。',
    cards: [{ type: 'supplier', title: '鼎信建设一公司 · 供应商画像', rows: [
      { k: '健康评分', v: '58（偏低）' },
      { k: '风险标记(8)', v: '关联交易未披露 / 未验收付款 / 实控人代持(王建军代持·王建国实控) / 同源投标(同IP·同MAC) / 资金回流(¥120万·3笔) / 中标集中度异常 / 验收单缺失 / 资质挂靠' },
      { k: '其他关联', v: 'CG-2026012 未验收付款·二期(¥40万) · CG-2026025 资质挂靠(¥85万)' },
    ] }],
  },
  aggregate: {
    reply: '已把与鼎信系相关的四块要点汇总如下（本阶段在对话内呈现，页面布局重组为下一阶段功能）：',
    cards: [
      { type: 'summary', title: '① 实时风险（鼎信系在途3条·合计¥360万）', rows: [
        { k: '未验收付款', v: 'CG-2026001 · ¥40万' },
        { k: '围标串标(同源/陪标)', v: 'CG-2026005 · ¥280万' },
        { k: '未验收付款(二期)', v: 'CG-2026012 · ¥40万' },
      ] },
      { type: 'summary', title: '② 供应商画像', rows: [
        { k: '评分/标记', v: '鼎信建设一公司 58分 · 8个风险标记' },
        { k: '中标', v: '本集团5个项目/¥860万 · 集中度异常' },
      ] },
      { type: 'summary', title: '③ 资金闭环（CG-2026001）', rows: [
        { k: '付款', v: '¥40万待付' },
        { k: '断点', v: '验收凭证缺失（YS-2026-0312）' },
      ] },
      { type: 'summary', title: '④ 网络图链路', rows: [
        { k: '异常', v: '同IP(116.62.45.21)/同MAC 投标；近6月回流 ¥120万(3笔)' },
        { k: '推断', v: '王建国实控鼎信建设有限公司(65%)+鼎信建设一公司(王建军代持)' },
      ] },
    ],
  },
  plan: {
    reply: '建议：立即冻结付款并启动关联输送专项审查，倒查同类未验收付款。需联动财务（冻结付款节点）、采购部（限期补验收）、纪检监察室（牵头核查）。理由：无验收即付款违反资金闭环与红线，供应商高风险，存在资金损失与利益输送风险。请选择处置方案：',
    options: [
      { key: 'A', label: '立即冻结付款 + 补验收 + 立案核查', impact: '资金保全；流程中断约2周；触发纪检介入', basis: '无验收即付款违反资金闭环，鼎信建设一公司高风险(评分58)；历史同类案例3起，平均挽回损失 ¥86万' },
      { key: 'B', label: '暂不冻结，限期补验收 + 整改', impact: '资金暂留风险；对流程影响小；7个工作日内补齐', basis: '若项目确已完工可先补验收闭环——本例供应商风险偏高(评分58)，需谨慎' },
      { key: 'C', label: '列入观察名单，下一付款节点拦截', impact: '当前风险不即时处置，仅监控', basis: '本例金额虽小但叠加关联输送，证据已较充分，不建议仅观察' },
    ],
  },
  receipts: {
    reply: '已采纳方案A，开始执行（演示环境仅前端联动、不实际落库）：',
    receipts: [
      'SRM 已将鼎信建设一公司标记“待核查”，并冻结采购单 CG-2026001 付款节点（¥40万）',
      '生成《关联输送核查任务单》(RW-2026-0501)，附工商/资金/投标证据链，派发纪检监察室核查组',
      '向经办张伟及主管李强推送整改通知，要求补充关联披露与验收材料，回执截止 2026-05-28，逾期自动升级',
    ],
  },
}
function matchRoute3(text) {
  // 采购穿透问答脚本：采购页与首页（dashboard）均可触发，首页询问也能给出同样的研判答复
  if (props.scene !== 'procurement' && props.scene !== 'dashboard') return null
  const t = (text || '').trim()
  if (/恢复默认|回到报告|初始视图/.test(t)) return R3_REPORT
  if (/我选方案\s*A|采纳方案\s*A|方案A|执行方案/.test(t)) return R3.receipts
  if (/处置|怎么办|如何处理|该怎么/.test(t)) return R3.plan
  if (/集中|相关的都|汇总|都给我看|一起看/.test(t)) return R3.aggregate
  if (/供应商|这家|别的问题|还有.*问题/.test(t)) return R3.supplier
  if (/依据|第一条|未验收|为什么|为何/.test(t)) return R3.evidence
  if (/今日.*报告|高风险研判|研判报告|调出.*报告/.test(t)) return R3_REPORT
  return null
}
function pushRoute3(hist, resp) {
  const msg = { role: 'assistant', content: resp.reply, display: resp.reply, time: now(),
    cards: resp.cards || null, options: resp.options || null, receipts: resp.receipts || null, _revealed: 0, _basisKey: null }
  hist.msgs.push(msg)
  scrollBottom(); persist()
  if (resp.receipts && resp.receipts.length) {
    const idx = hist.msgs.length - 1
    resp.receipts.forEach((_, i) => queueAction(() => { const m = hist.msgs[idx]; if (m) m._revealed = i + 1; scrollBottom() }, 700 * (i + 1)))
  }
}
function r3ChoosePlan(opt) { if (streamingWait.value || stream.active) return; input.value = `我选方案${opt.key}：${opt.label}`; send() }
function r3ToggleBasis(msg, key) { msg._basisKey = msg._basisKey === key ? null : key }

// 业务域跳转：对话里说「看一下采购域 / 跳转到资金域 / 到财务域 / 切到合同域」→ 页面跳转到对应域
const DOMAIN_NAV = [
  { re: /采购域|采购管理域/, scene: 'procurement', label: '采购管理域' },
  { re: /资金域/, scene: 'funds', label: '资金域' },
  { re: /财务域/, scene: 'finance', label: '财务域' },
  { re: /合同域/, scene: 'contract', label: '合同域' },
]
function matchDomainNav(text) {
  const t = (text || '').trim()
  if (!/(看|查看|瞧|跳转|切换|切到|打开|进入|前往|去|到|导航)/.test(t)) return null
  return DOMAIN_NAV.find(d => d.re.test(t)) || null
}

// ═══ 发送 ═══
function send() {
  const q = input.value.trim(); if (!q || streamingWait.value || stream.active) return
  const hist = findHistory(activeHistory.value); if (!hist) return

  if (!hist.msgs.length) { hist.title = q.slice(0,18)+(q.length>18?'…':''); hist._named = false }
  hist.time = now()
  hist.msgs.push({ role: 'user', content: q, time: now() })
  input.value = ''

  // 布局重组：采购页按用户话术关键词命中 preset，对话驱动页面动态重组（§6 前端兜底）
  if (props.scene === 'procurement') applyPresetByText(q)

  // 业务域跳转：说「看一下采购域 / 跳转到资金域 / 财务域 / 合同域」→ 页面跳转
  const domainNav = matchDomainNav(q)
  if (domainNav) {
    hist.msgs.push({ role: 'assistant', content: `好的，正在为您跳转到「${domainNav.label}」…`, time: now() })
    scrollBottom(); persist()
    emit('action', { type: 'navigate', scene: domainNav.scene })
    return
  }

  // 路线三：采购页脚本化命中 → 直接出固定卡片，不调用真模型；并联动页面组件高亮
  const scripted = matchRoute3(q)
  if (scripted) {
    let focus = 'report'
    if (/恢复默认|回到报告|初始视图/.test(q)) focus = 'reset'
    else if (/我选方案\s*A|采纳方案\s*A|方案A|执行方案/.test(q)) focus = 'receipts'
    else if (/处置|怎么办|如何处理|该怎么/.test(q)) focus = 'plan'
    else if (/集中|相关的都|汇总|都给我看|一起看/.test(q)) focus = 'aggregate'
    else if (/供应商|这家|别的问题|还有.*问题/.test(q)) focus = 'supplier'
    else if (/依据|第一条|未验收|为什么|为何/.test(q)) focus = 'evidence'
    try { window.dispatchEvent(new CustomEvent('drp-assistant-focus', { detail: { key: focus } })) } catch {}
    streamingWait.value = true; scrollBottom(); persist()
    queueAction(() => { streamingWait.value = false; pushRoute3(hist, scripted) }, 500)
    return
  }

  const promptActions = deriveActionsFromPrompt(q)
  const lastUser = hist.msgs[hist.msgs.length - 1]; if (lastUser) lastUser._promptActions = promptActions

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
/* 不虚化背景、不挡页面：遮罩层穿透点击，仅面板可交互 */
.gpt-overlay{position:fixed;inset:0;z-index:9999;background:transparent;pointer-events:none}
.gpt-modal{position:fixed;right:20px;top:8vh;pointer-events:auto;width:720px;height:84vh;background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(15,23,42,.28);display:flex;overflow:hidden;border:1px solid #e2e8f0;resize:both;min-width:340px;min-height:340px;max-width:96vw;max-height:94vh}
.gpt-modal.collapsed{width:480px}
/* 右下角拉伸把手视觉提示（原生 resize 句柄叠加） */
.gpt-modal::after{content:'';position:absolute;right:2px;bottom:2px;width:14px;height:14px;pointer-events:none;background:linear-gradient(135deg,transparent 0 50%,#cbd5e1 50% 60%,transparent 60% 70%,#cbd5e1 70% 80%,transparent 80%);opacity:.8;border-bottom-right-radius:14px}
.gpt-drag-handle{cursor:move;user-select:none}
.gpt-drag-hint{color:#cbd5e1;font-size:14px;letter-spacing:-2px;cursor:move}

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

/* ═══ 路线三：研判卡片 / 方案 / 回执 ═══ */
.r3-card{margin-top:10px;border:1px solid #e9edf5;border-radius:10px;overflow:hidden;background:#fcfdff}
.r3-card-title{padding:7px 11px;font-size:12.5px;font-weight:800;color:#fff;background:linear-gradient(135deg,#6366f1,#4f46e5)}
.r3-card.r3-evidence .r3-card-title{background:linear-gradient(135deg,#0891b2,#0e7490)}
.r3-card.r3-risk .r3-card-title{background:linear-gradient(135deg,#dc2626,#b91c1c)}
.r3-card.r3-project .r3-card-title{background:linear-gradient(135deg,#f59e0b,#d97706)}
.r3-card.r3-doc .r3-card-title{background:linear-gradient(135deg,#475569,#334155)}
.r3-card.r3-supplier .r3-card-title{background:linear-gradient(135deg,#7c3aed,#6d28d9)}
.r3-card-rows{padding:7px 11px}
.r3-card-row{display:flex;gap:10px;padding:5px 0;border-bottom:1px dashed #eef1f6}
.r3-card-row:last-child{border-bottom:none}
.r3-k{flex-shrink:0;width:104px;font-size:12px;color:#94a3b8;font-weight:700}
.r3-v{flex:1;font-size:12.5px;color:#1e293b;line-height:1.6}
.r3-options{margin-top:10px;display:flex;flex-direction:column;gap:10px}
.r3-opt{border:1px solid #e9edf5;border-radius:10px;padding:9px;background:#fcfdff}
.r3-opt-btn{width:100%;display:flex;gap:10px;align-items:flex-start;text-align:left;border:none;background:transparent;cursor:pointer;padding:2px}
.r3-opt-key{flex-shrink:0;width:24px;height:24px;border-radius:6px;background:#4f46e5;color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center}
.r3-opt-btn.opt-A .r3-opt-key{background:#dc2626}
.r3-opt-btn.opt-B .r3-opt-key{background:#f59e0b}
.r3-opt-btn.opt-C .r3-opt-key{background:#64748b}
.r3-opt-main{display:flex;flex-direction:column;gap:2px}
.r3-opt-main b{font-size:13px;font-weight:700;color:#0f172a}
.r3-opt-main em{font-style:normal;font-size:11.5px;color:#64748b;line-height:1.5}
.r3-opt-btn:hover .r3-opt-main b{color:#4f46e5}
.r3-basis-toggle{margin-top:7px;padding:3px 9px;border-radius:6px;border:1px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;font-size:11.5px;font-weight:700;cursor:pointer}
.r3-basis-toggle:hover{background:#ede9fe}
.r3-basis{margin-top:7px;padding:9px 11px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#92400e;line-height:1.65}
.r3-receipts{margin-top:10px;display:flex;flex-direction:column;gap:7px}
.r3-exec-running{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#6d28d9;font-weight:700}
.r3-spin{width:14px;height:14px;border:2px solid #ddd6fe;border-top-color:#6d28d9;border-radius:50%;animation:r3-spin .7s linear infinite}
@keyframes r3-spin{to{transform:rotate(360deg)}}
.r3-receipt{display:flex;gap:9px;align-items:flex-start;padding:9px 11px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:12.5px;color:#166534;line-height:1.6;animation:r3-in .3s ease}
@keyframes r3-in{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
.r3-check{flex-shrink:0;width:17px;height:17px;border-radius:50%;background:#22c55e;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center}
.r3-exec-done{margin-top:2px;padding:9px;text-align:center;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;color:#059669;font-size:13px;font-weight:800}
.r3-quick-bar{display:flex;gap:8px;overflow-x:auto;padding:10px 22px 0;background:#fafbfc}
.r3-quick-chip{flex-shrink:0;padding:5px 12px;border-radius:999px;border:1px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:.15s}
.r3-quick-chip:hover:not(:disabled){background:#ede9fe;border-color:#c4b5fd}
.r3-quick-chip:disabled{opacity:.5;cursor:default}
</style>
