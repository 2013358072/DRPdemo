<template>
  <div class="ai-page">
    <!-- 背景网格 -->
    <div class="ai-grid-bg" aria-hidden="true"></div>

    <div class="dashboard-container">
      <!-- 顶部指标 -->
      <section class="top-metrics">
        <article class="metric-card" v-for="(m, i) in metricCards" :key="i" :class="m.cls">
          <div class="metric-scan"></div>
          <div class="metric-left">
            <div class="metric-label">{{ m.title }}</div>
            <div class="metric-value" :class="m.valueCls">{{ m.isTimer ? runtimeStr : m.value }}</div>
            <div class="metric-sub">{{ m.sub }}</div>
          </div>
          <div class="metric-icon-wrap" :class="m.iconCls">
            <span class="metric-icon-text">{{ m.icon }}</span>
          </div>
        </article>
      </section>

      <section class="main-workspace">
        <!-- 左侧：监管模型库 -->
        <aside class="panel left-panel">
          <div class="panel-header">
            <span class="panel-title">国资穿透监管模型</span>
            <span class="panel-badge">11 类基准</span>
          </div>

          <!-- 统计模式切换 -->
          <div class="stats-toggle">
            <div class="stats-toggle-seg">
              <button type="button" class="st-btn" :class="{ active: statsMode === 'total' }" @click="statsMode = 'total'">全部</button>
              <button type="button" class="st-btn" :class="{ active: statsMode === '7d' }" @click="statsMode = '7d'">近7天</button>
              <button type="button" class="st-btn" :class="{ active: statsMode === '30d' }" @click="statsMode = '30d'">近30天</button>
              <button type="button" class="st-btn" :class="{ active: statsMode === '180d' }" @click="statsMode = '180d'">近180天</button>
            </div>
          </div>

          <div class="domain-tabs">
            <button
              v-for="tag in domainTabs"
              :key="tag.id"
              type="button"
              class="domain-tab"
              :class="{ active: activeDomain === tag.id }"
              @click="activeDomain = tag.id"
            >{{ tag.label }}</button>
          </div>

          <div class="model-grid micro-scroll">
            <button
              v-for="item in regulationCards"
              :key="item.id"
              type="button"
              class="model-card"
              :class="{ featured: item.featured, pending: item.pending }"
              @click="applyRegulationCard(item)"
            >
              <span class="model-dot"></span>
              <div class="mc-body">
                <strong class="mc-label">{{ item.label }}</strong>
                <div v-if="!item.pending" class="mc-stats">
                  <span class="mc-stat">
                    <span class="mc-stat-val">{{ cardStat(item, 'runs') }}</span>
                    <span class="mc-stat-lbl">运行</span>
                  </span>
                  <span class="mc-stat-sep">·</span>
                  <span class="mc-stat mc-risk">
                    <span class="mc-stat-val">{{ cardStat(item, 'risks') }}</span>
                    <span class="mc-stat-lbl">风险</span>
                  </span>
                </div>
                <div v-else class="mc-pending-label">能力建设中 · 敬请期待</div>
              </div>
            </button>
          </div>

          <!-- SkillHub 核心技能库（移至左下） -->
          <div class="skill-hub">
            <div class="skill-hub-header">
              <span>SkillHub 核心技能库</span>
              <span class="skill-count">{{ selectedSkillIds.length }}/{{ skillLibrary.length }} 已绑</span>
            </div>
            <div class="skill-grid micro-scroll">
              <button
                v-for="skill in skillLibrary"
                :key="skill.id"
                type="button"
                class="skill-btn"
                :class="{ active: selectedSkillIds.includes(skill.id) }"
                @click="toggleSkill(skill.id)"
              >
                <span class="skill-dot"></span>
                <div class="skill-info">
                  <div class="skill-name-row">
                    <span class="skill-name">{{ skill.name }}</span>
                  </div>
                  <div class="skill-stats-row">
                    <span class="skill-author">{{ skill.author }}</span>
                    <span class="skill-calls">{{ skillCalls(skill) }} 次</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <!-- 中心：指挥调度对话 -->
        <main class="panel center-panel">
          <!-- 绑定状态栏 -->
          <div class="bound-bar">
            <div class="bound-group">
              <span class="bg-label">模型</span>
              <span class="bp active">@{{ activeModel.short }}</span>
            </div>
            <div class="bound-group">
              <span class="bg-label">Skill</span>
              <span v-for="skill in selectedSkills" :key="skill.id" class="bp">{{ skill.name }}</span>
              <span v-if="!selectedSkills.length" class="bp muted">未绑定</span>
            </div>
          </div>

          <!-- 对话区 -->
          <div ref="historyRef" class="chat-area micro-scroll">
            <article
              v-for="message in messages"
              :key="message.id"
              class="message"
              :class="message.role"
            >
              <div class="message-meta">
                <span class="meta-role">{{ message.role === 'user' ? '■ 指令' : '◆ 响应' }}</span>
                <span class="meta-model">@{{ message.model }}</span>
                <span class="meta-time">{{ message.time }}</span>
              </div>
              <div v-if="message.role === 'ai' && message.thinking" class="msg-thinking">
                <button type="button" class="mt-toggle" @click="message._thinkOpen = !message._thinkOpen">💭 思考{{ message._streaming ? '中…' : '完成' }} {{ message._thinkOpen ? '▾' : '▸' }}</button>
                <div v-if="message._thinkOpen" class="mt-body">{{ message.thinking }}</div>
              </div>
              <div class="msg-bubble">
                <div class="msg-text" v-html="renderMsg(message.text)"></div>
                <span v-if="message._streaming && message.text" class="stream-cursor">▍</span>
                <div v-if="message.skills?.length" class="msg-tags">
                  <span v-for="skill in message.skills" :key="skill" class="msg-tag">{{ skill }}</span>
                </div>
                <div v-if="message.steps?.length" class="thinking-steps">
                  <span v-for="step in message.steps" :key="step" class="step-chip">{{ step }}</span>
                </div>
                <div v-if="message.actions?.length" class="msg-actions">
                  <button
                    v-for="act in message.actions"
                    :key="act.id"
                    type="button"
                    class="msg-action-btn"
                    @click="handleMsgAction(act)"
                  >{{ act.label }}</button>
                </div>
              </div>
            </article>

            <!-- 演示推荐问题 chips：未发起对话前展示，点击直接发送 -->
            <div v-if="!hasUserMessage" class="recommend-chips">
              <div class="rc-title">💡 推荐问题 · 点击直接发送</div>
              <div class="rc-grid">
                <button
                  v-for="(c, i) in RECOMMENDED_CHIPS" :key="i"
                  type="button" class="rc-chip"
                  :disabled="isSending || streaming"
                  @click="askChip(c)"
                ><span class="rc-num">{{ i + 1 }}</span><span class="rc-text">{{ c }}</span></button>
              </div>
            </div>

            <article v-if="isSending" class="message ai pending">
              <div class="message-meta">
                <span class="meta-role">◆ 响应</span>
                <span class="meta-model">@{{ activeModel.short }}</span>
              </div>
              <div class="msg-bubble pending-bubble">
                <span class="pending-dot"></span>
                <span class="pending-dot"></span>
                <span class="pending-dot"></span>
              </div>
            </article>
          </div>

          <!-- 快捷指令 -->
          <div class="quick-row">
            <button
              v-for="item in quickPrompts"
              :key="item.id"
              type="button"
              class="quick-btn"
              @click="applyQuickPrompt(item)"
            >{{ item.label }}</button>
          </div>

          <!-- 输入区 -->
          <div class="input-area">
            <div class="input-wrap">
              <!-- 工具栏：附件 + 思考模式 -->
              <div class="input-toolbar">
                <label class="tool-btn attach-label" title="上传附件（最大 20MB）">
                  <input ref="fileInputRef" type="file" class="hidden-file" multiple @change="handleFileUpload" />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tool-icon">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  附件
                </label>
                <button
                  type="button"
                  class="tool-btn think-toggle"
                  :class="{ active: thinkMode }"
                  @click="thinkMode = !thinkMode"
                  title="开启深度思考模式"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tool-icon">
                    <circle cx="12" cy="12" r="9" stroke-linecap="round"/>
                    <path d="M12 8v4l3 3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  深度思考
                  <span v-if="thinkMode" class="think-badge">ON</span>
                </button>
                <template v-if="attachments.length">
                  <span v-for="(f, i) in attachments" :key="i" class="attach-chip">
                    📎 {{ f.name }}
                    <button type="button" class="attach-remove" @click="removeAttachment(i)">×</button>
                  </span>
                </template>
              </div>
              <textarea
                ref="inputRef"
                v-model="prompt"
                class="input-box"
                placeholder="输入调度指令...  输入 @ 呼出模型列表"
                @keydown.enter.exact.prevent="sendPrompt"
              ></textarea>

              <div v-if="mentionState.open" class="mention-panel">
                <button
                  v-for="model in mentionState.list"
                  :key="model.id"
                  type="button"
                  class="mention-item"
                  @click="selectModel(model, true)"
                >
                  <span class="mention-name">@{{ model.short }}</span>
                  <span class="mention-desc">{{ model.desc }}</span>
                </button>
              </div>
            </div>

            <div class="input-actions">
              <button type="button" class="btn-reset" @click="resetPanel">重置</button>
              <button type="button" class="btn-send" :disabled="isSending || streaming || !prompt.trim()" @click="sendPrompt">
                <svg viewBox="0 0 20 20" fill="currentColor" class="send-icon"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                发 送
              </button>
            </div>
          </div>
        </main>

        <!-- 右侧：智能体 + SkillHub -->
        <aside class="panel right-panel">
          <div class="panel-header">
            <span class="panel-title">数字监管智能体</span>
            <span class="panel-badge online">● {{ agentLibrary.length }} 在线</span>
          </div>

          <div class="agent-list">
            <button
              v-for="agent in agentLibrary"
              :key="agent.id"
              type="button"
              class="agent-card"
              @click="selectModel(agent.bindModel, true)"
            >
              <div class="agent-icon" :class="`ai-${agent.id}`">{{ agent.icon }}</div>
              <div class="agent-info">
                <h4>{{ agent.name }}</h4>
                <p>{{ agent.desc }}</p>
              </div>
              <span class="agent-arrow">›</span>
            </button>
          </div>

          <!-- AI 实时风险事件列表 -->
          <div class="ai-risk-hub">
            <div class="ai-risk-header">
              <div class="arh-left">
                <span class="arh-title">AI 实时风险事件</span>
                <span class="arh-sub">主动发现 · 自动归因 · 一键派发</span>
              </div>
              <span class="arh-badge" :class="{ blink: liveRiskEvents.some(e => !e.handled && e.level === 'high') }">
                ● {{ liveRiskEvents.filter(e => !e.handled).length }} 待处置
              </span>
            </div>
            <div class="ai-risk-list micro-scroll">
              <div
                v-for="evt in liveRiskEvents"
                :key="evt.id"
                class="risk-evt"
                :class="[evt.level, { handled: evt.handled }]"
                @click="handleRiskEvt(evt)"
              >
                <div class="risk-evt-top">
                  <span class="risk-level-dot" :class="evt.level"></span>
                  <span class="risk-evt-title">{{ evt.title }}</span>
                  <span class="risk-evt-time">{{ evt.time }}</span>
                </div>
                <div class="risk-evt-desc">{{ evt.desc }}</div>
                <div class="risk-evt-footer">
                  <span class="risk-evt-model">{{ evt.model }}</span>
                  <span class="risk-evt-unit">{{ evt.unit }}</span>
                  <button
                    v-if="!evt.handled"
                    class="risk-dispatch-btn"
                    @click.stop="dispatchRiskEvt(evt)"
                  >派发 ›</button>
                  <span v-else class="risk-done-tag">✓ 已派发</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { matchScript, RECOMMENDED_CHIPS, SCRIPT_PACE } from '../data/agentScript.js'

const emit = defineEmits(['navigate'])

// ── 演示剧本流式播放辅助 ──────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function streamInto(msg, key, fullText, charMs) {
  for (let i = 1; i <= fullText.length; i++) {
    msg[key] = fullText.slice(0, i)
    if (i % 6 === 0) scrollHistoryToBottom()
    await sleep(charMs)
  }
  scrollHistoryToBottom()
}
// 渲染消息正文:转义后还原 **bold** 与换行（与 GptChatModal 一致）
function renderMsg(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}
const hasUserMessage = computed(() => messages.value.some(m => m.role === 'user'))
function askChip(text) {
  if (isSending.value || streaming.value) return
  prompt.value = text
  nextTick(() => sendPrompt())
}
const streaming = ref(false)

const modelLibrary = [
  { id: 'm1', short: '资金池分析', name: '资金池分析模型', desc: '资金归集与异常支付穿透', domain: 'funds' },
  { id: 'm2', short: '投资审查', name: '投资审查模型', desc: '项目投资与立项偏差识别', domain: 'operate' },
  { id: 'm3', short: '合同核验', name: '合同核验模型', desc: '合同履约与条款比对', domain: 'govern' },
  { id: 'm4', short: '采购风控', name: '采购风控模型', desc: '供应商与到货进度监测', domain: 'operate' },
  { id: 'm5', short: '产权治理', name: '产权治理模型', desc: '股权链路与控股结构识别', domain: 'govern' },
  { id: 'm6', short: '财务推理', name: '财务推理模型', desc: '凭证、预算与科目联查', domain: 'funds' },
  { id: 'm7', short: '薪酬合规', name: '薪酬合规模型', desc: '发放规则与留痕复核', domain: 'govern' },
  { id: 'm8', short: '境外合规', name: '境外合规模型', desc: '境外项目与外汇核验', domain: 'operate' },
  { id: 'm9', short: '金融监测', name: '金融监测模型', desc: '融资租赁与担保链路分析', domain: 'funds' },
  { id: 'm10', short: '会计映射', name: '会计映射模型', desc: '会计口径与共享质检', domain: 'govern' },
]

const domainTabs = [
  { id: 'funds', label: '资金域' },
  { id: 'operate', label: '经营域' },
  { id: 'govern', label: '治理域' },
]

const regulationCards = [
  { id: 'r1',  label: '过度负债',   bindModelId: 'm1', totalRuns: 328, runs180d: 198, runs30d:  42, runs7d: 11, risks: 19, risks180d: 13, risks30d:  8, risks7d: 2 },
  { id: 'r2',  label: '虚假贸易',   bindModelId: 'm3', totalRuns: 214, runs180d: 134, runs30d:  31, runs7d:  8, risks: 11, risks180d:  8, risks30d:  4, risks7d: 1 },
  { id: 'r3',  label: '无关多元',   bindModelId: 'm2', totalRuns: 186, runs180d: 112, runs30d:  28, runs7d:  7, risks:  9, risks180d:  6, risks30d:  3, risks7d: 1 },
  { id: 'r4',  label: '捞偏门',     bindModelId: 'm4', totalRuns: 142, runs180d:  89, runs30d:  19, runs7d:  5, risks:  7, risks180d:  5, risks30d:  2, risks7d: 1 },
  { id: 'r5',  label: '多层架构',   bindModelId: 'm5', totalRuns: 267, runs180d: 163, runs30d:  35, runs7d:  9, risks: 14, risks180d: 10, risks30d:  6, risks7d: 2 },
  { id: 'r6',  label: '靠企吃企',   bindModelId: 'm7', totalRuns:  98, runs180d:  61, runs30d:  14, runs7d:  4, risks:  5, risks180d:  4, risks30d:  2, risks7d: 1 },
  { id: 'r7',  label: '薪酬乱象',   bindModelId: 'm7', totalRuns: 156, runs180d:  96, runs30d:  22, runs7d:  6, risks:  8, risks180d:  6, risks30d:  3, risks7d: 1 },
  { id: 'r8',  label: '资产闲置浪费', bindModelId: 'm2', totalRuns: 203, runs180d: 124, runs30d:  27, runs7d:  7, risks: 12, risks180d:  9, risks30d:  5, risks7d: 1 },
  { id: 'r9',  label: '财务金融风险', bindModelId: 'm9', totalRuns: 289, runs180d: 175, runs30d:  38, runs7d: 10, risks: 16, risks180d: 11, risks30d:  7, risks7d: 2 },
  { id: 'r10', label: '境外业务风险', bindModelId: 'm8', totalRuns: 124, runs180d:  77, runs30d:  17, runs7d:  4, risks:  6, risks180d:  5, risks30d:  3, risks7d: 1 },
  { id: 'r11', label: '控股不控权',  bindModelId: 'm5', totalRuns: 176, runs180d: 107, runs30d:  24, runs7d:  6, risks: 10, risks180d:  8, risks30d:  4, risks7d: 1 },
  { id: 'r12', label: '敬请期待',   bindModelId: null,  pending: true,
    totalRuns: 0, runs180d: 0, runs30d: 0, runs7d: 0, risks: 0, risks180d: 0, risks30d: 0, risks7d: 0 },
]

const skillLibrary = [
  { id: 's1', name: '企业图谱查询', author: '数据中台组', totalCalls: 3241, calls180d: 1842, calls30d: 412, calls7d:  98 },
  { id: 's2', name: '合同语义比对', author: '法务技术组', totalCalls: 1876, calls180d: 1063, calls30d: 284, calls7d:  67 },
  { id: 's3', name: '银企直连流水', author: '资金科技组', totalCalls: 2654, calls180d: 1508, calls30d: 371, calls7d:  88 },
  { id: 's4', name: '财务数据推理', author: '财务数字化', totalCalls: 2108, calls180d: 1196, calls30d: 298, calls7d:  71 },
  { id: 's5', name: 'OCR 票据识别', author: '影像处理组', totalCalls: 4382, calls180d: 2489, calls30d: 563, calls7d: 134 },
  { id: 's6', name: '外汇实时核验', author: '境外合规组', totalCalls:  892, calls180d:  507, calls30d: 127, calls7d:  30 },
  { id: 's7', name: '招采履约跟踪', author: '采购数字化', totalCalls: 1543, calls180d:  876, calls30d: 218, calls7d:  52 },
  { id: 's8', name: '风险工单派发', author: '风控平台组', totalCalls: 2967, calls180d: 1684, calls30d: 406, calls7d:  97 },
]

const agentLibrary = [
  { id: 'a1', icon: 'AI', name: '@ 资金池穿透智能体', desc: '资金链路追踪与闭环分析', bindModel: modelLibrary[0] },
  { id: 'a2', icon: 'SC', name: '@ 供应链风控智能体', desc: '招投标与合同履约核查', bindModel: modelLibrary[3] },
  { id: 'a3', icon: 'AM', name: '@ 资产效能评估智能体', desc: '闲置资产与投资回报测算', bindModel: modelLibrary[1] },
  { id: 'a4', icon: 'FI', name: '@ 财务监管智能体', desc: '预算、凭证与共享质检', bindModel: modelLibrary[5] },
]

const metricCards = [
  { title: '智能体数量',     value: '4 个',        sub: '多智能体协同在线',   icon: 'AG',  cls: '',     iconCls: 'icon-blue',   valueCls: '' },
  { title: '集群算力 / 并发', value: '42% / 128',   sub: '算力池稳定运行',   icon: 'AI',  cls: '',     iconCls: 'icon-cyan',   valueCls: '' },
  { title: '资源穿透网络',    value: '12,401 节点', sub: '可追溯链路已联通', icon: 'NET', cls: '',     iconCls: 'icon-purple', valueCls: '' },
  { title: '当前异常拦截',    value: '86 项',       sub: '重点事项待分派',   icon: '!',   cls: 'warn', iconCls: 'icon-red',    valueCls: 'val-red' },
  { title: '智能体持续运行',  value: '',            sub: '自首次部署起连续运行', icon: 'RT', cls: '',  iconCls: 'icon-green',  valueCls: 'val-timer', isTimer: true },
]

// 运行时长计时器（初始值：123天9小时32分33秒）
const _initSec = 123 * 86400 + 9 * 3600 + 32 * 60 + 33
const runtimeSeconds = ref(_initSec)
const runtimeStr = computed(() => {
  const s = runtimeSeconds.value
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = n => String(n).padStart(2, '0')
  return `${d}天${h}时${p(m)}分${p(sec)}秒`
})
let _rtTimer = null
onMounted(() => { _rtTimer = setInterval(() => { runtimeSeconds.value++ }, 1000) })
onUnmounted(() => { clearInterval(_rtTimer) })

const quickPrompts = [
  { id: 'q1', label: '资金异常排查', text: '@资金池分析 对集团总部跨账户调拨审批耗时偏长问题做穿透说明，并给出处置建议。', skills: ['s1', 's3', 's8'] },
  { id: 'q2', label: '投资复核建议', text: '@投资审查 复核华东电力重点项目投资偏差，串联预算、付款和里程碑节点。', skills: ['s1', 's4'] },
  { id: 'q3', label: '采购链路核验', text: '@采购风控 排查南方工程关键设备到货延迟，并比对合同履约与供应商评分。', skills: ['s2', 's7'] },
]

const liveRiskEvents = ref([
  {
    id: 're1', level: 'high', levelText: '高风险', time: '09:26',
    title: '跨账户调拨审批链路超时',
    desc: 'AI 识别：集团总部司库 3 笔跨账户调拨审批耗时超阈值 2.3 倍，疑似流程梗阻。',
    model: '@资金池分析', unit: '集团总部', handled: false,
  },
  {
    id: 're2', level: 'medium', levelText: '中风险', time: '09:41',
    title: '供应商评分异常波动',
    desc: 'AI 识别：南方工程 2 名核心供应商近 30 天评分降幅超 18%，到货周期超预算节奏。',
    model: '@采购风控', unit: '南方工程', handled: false,
  },
  {
    id: 're3', level: 'high', levelText: '高风险', time: '10:03',
    title: '合同归档严重滞后',
    desc: 'AI 识别：江苏储能 4 份增补协议归档延期超 5 个工作日，主合同关联缺失。',
    model: '@合同核验', unit: '江苏储能', handled: false,
  },
  {
    id: 're4', level: 'watch', levelText: '关注', time: '10:18',
    title: '投资节奏偏差预警',
    desc: 'AI 识别：华东电力风电基地二期 Q2 资金支出与预算偏差率达 14.6%，超预警线。',
    model: '@投资审查', unit: '华东电力', handled: true,
  },
  {
    id: 're5', level: 'medium', levelText: '中风险', time: '10:34',
    title: '融资租赁回款延迟',
    desc: 'AI 识别：西部产融 2 笔融资租赁回款较合同约定延迟 7 天，担保敞口扩大。',
    model: '@金融监测', unit: '西部产融', handled: false,
  },
  {
    id: 're6', level: 'watch', levelText: '关注', time: '10:52',
    title: '境外费用合规异常',
    desc: 'AI 识别：海外工程分公司 1 笔差旅申报金额与外汇系统核验结果存在差异，需复核。',
    model: '@境外合规', unit: '海外工程', handled: false,
  },
])

const inputRef = ref(null)
const historyRef = ref(null)
const prompt = ref('@资金池分析 ')
const selectedModelId = ref('m3')
const statsMode = ref('total') // 'total' | '7d' | '30d' | '180d'
const thinkMode = ref(false)
const selectedSkillIds = ref(['s2', 's1'])
const activeDomain = ref('govern')
const isSending = ref(false)
const fileInputRef = ref(null)
const attachments = ref([])
function handleFileUpload(e) {
  const files = Array.from(e.target.files)
  attachments.value = [...attachments.value, ...files.map(f => ({ name: f.name, size: f.size }))]
  e.target.value = ''
}
function removeAttachment(i) {
  attachments.value = attachments.value.filter((_, idx) => idx !== i)
}

// 统计字段辅助
function cardStat(item, type) {
  const map = {
    total:  { runs: 'totalRuns',  risks: 'risks'      },
    '7d':   { runs: 'runs7d',     risks: 'risks7d'    },
    '30d':  { runs: 'runs30d',    risks: 'risks30d'   },
    '180d': { runs: 'runs180d',   risks: 'risks180d'  },
  }
  return item[map[statsMode.value]?.[type]] ?? 0
}
function skillCalls(skill) {
  const map = { total: 'totalCalls', '7d': 'calls7d', '30d': 'calls30d', '180d': 'calls180d' }
  const val = skill[map[statsMode.value]] ?? 0
  return Number(val).toLocaleString()
}

const messages = ref([
  {
    id: 'msg-welcome',
    role: 'ai',
    model: 'DRP Agent',
    time: '10:00',
    text: '您好，我是 **DRP 智能监管助手**。\n\n本演示场景已预置 8 条推荐问题，**点击下方任一气泡可直接发送**。也可自行输入关键词（如 "围标"、"打开资金"、"生成报告"），我会按场景回答。',
    skills: ['态势研判', '风险穿透', '驱动跳转', '报告生成'],
    steps: ['模型:DRP Agent v4.7', '场景:四域穿透', '状态:已就绪'],
  },
])

const activeModel = computed(() => modelLibrary.find((item) => item.id === selectedModelId.value) || modelLibrary[0])
const selectedSkills = computed(() => skillLibrary.filter((item) => selectedSkillIds.value.includes(item.id)))
const mentionState = computed(() => {
  const content = prompt.value
  const atIndex = content.lastIndexOf('@')
  if (atIndex < 0) return { open: false, list: [] }
  const suffix = content.slice(atIndex + 1)
  if (/[\s\n]/.test(suffix)) return { open: false, list: [] }
  const keyword = suffix.trim()
  const list = modelLibrary.filter((item) => {
    if (!keyword) return true
    return item.short.includes(keyword) || item.name.includes(keyword) || item.desc.includes(keyword)
  })
  return { open: true, list: list.length ? list : modelLibrary, atIndex }
})

function nowTime() {
  const date = new Date()
  const pad = (v) => String(v).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function scrollHistoryToBottom() {
  nextTick(() => { if (historyRef.value) historyRef.value.scrollTop = historyRef.value.scrollHeight })
}

function selectModel(model, injectToPrompt = false) {
  selectedModelId.value = model.id
  if (injectToPrompt) {
    const state = mentionState.value
    if (state.open) {
      prompt.value = `${prompt.value.slice(0, state.atIndex)}@${model.short} `
    } else if (!prompt.value.trim()) {
      prompt.value = `@${model.short} `
    }
  }
  nextTick(() => inputRef.value?.focus())
}

function toggleSkill(skillId) {
  if (selectedSkillIds.value.includes(skillId)) {
    selectedSkillIds.value = selectedSkillIds.value.filter((item) => item !== skillId)
  } else {
    selectedSkillIds.value = [...selectedSkillIds.value, skillId]
  }
}

function applyQuickPrompt(item) {
  prompt.value = item.text
  selectedSkillIds.value = [...item.skills]
  const model = modelLibrary.find((entry) => item.text.includes(`@${entry.short}`))
  if (model) selectedModelId.value = model.id
  nextTick(() => inputRef.value?.focus())
}

function applyRegulationCard(item) {
  if (item.pending) return
  const model = modelLibrary.find((entry) => entry.id === item.bindModelId) || modelLibrary[0]
  selectedModelId.value = model.id
  prompt.value = `@${model.short} 围绕"${item.label}"开展穿透核查并输出风险建议。`
  nextTick(() => inputRef.value?.focus())
}

function handleMsgAction(act) {
  const labels = {
    'view-contract':  '已调取合同台账，4 份增补协议归档详情已完整定位并生成摘要报告。',
    'notify-party':   '督办通知已发送至当事人，等待 48 小时内回传确认。',
    'dispatch-order': '整改工单已自动生成并派发至江苏储能合同管理部，待责任人签收。',
    'add-to-ledger':  '已纳入本月合规台账，法务合规部将持续跟踪归档进度。',
    'mark-pending':   '已标记为待闭环，系统将在 48 小时后自动触发提醒。',
  }
  const reply = labels[act.type] || `已执行：${act.label}`
  messages.value.push({
    id: `action-${Date.now()}`,
    role: 'ai',
    model: activeModel.value.short,
    time: nowTime(),
    text: `✓ ${act.label}  —  ${reply}`,
    skills: [],
    steps: [`操作：${act.label}`, '状态：已完成 · 留痕归档'],
  })
  scrollHistoryToBottom()
}

function buildAssistantReply(text) {
  const skills = selectedSkills.value.map((item) => item.name)
  const model = activeModel.value
  const hint = text.includes('采购')
    ? '已识别供应商、合同履约与到货节奏三条主链路。'
    : text.includes('投资')
      ? '已串联项目预算、资金节点与里程碑偏差。'
      : text.includes('合同')
        ? '已对条款相似度、归档时效与履约节点做聚合分析。'
        : '已对资金归集、账户调拨与审批耗时做联动分析。'
  return {
    text: `已调用 @${model.short}，并绑定 ${skills.length ? skills.join('、') : '默认能力'}。${hint} 建议继续补充单位、时间范围或指定处置动作。`,
    steps: [`模型：${model.name}`, `Skill：${skills.length ? skills.join(' / ') : '未额外绑定'}`, '状态：结果已生成'],
  }
}

function resetPanel() {
  prompt.value = `@${activeModel.value.short} `
  selectedSkillIds.value = ['s1', 's3']
  messages.value = messages.value.slice(0, 1)
  scrollHistoryToBottom()
  nextTick(() => inputRef.value?.focus())
}

function handleRiskEvt(evt) {
  const model = modelLibrary.find(m => evt.model.includes(m.short))
  if (!model) return
  selectedModelId.value = model.id
  prompt.value = `${evt.model} 对"${evt.title}"进行深度穿透核查，单位：${evt.unit}，风险摘要：${evt.desc}`
  nextTick(() => inputRef.value?.focus())
}

function dispatchRiskEvt(evt) {
  evt.handled = true
  const model = modelLibrary.find(m => evt.model.includes(m.short)) || modelLibrary[0]
  selectedModelId.value = model.id
  const dispatchText = `${evt.model} 自动生成处置工单并派发 —— 事项：${evt.title}，单位：${evt.unit}，风险等级：${evt.levelText}。`
  messages.value.push({
    id: `dispatch-${Date.now()}`,
    role: 'user',
    model: model.short,
    time: nowTime(),
    text: dispatchText,
    skills: ['风险工单派发'],
  })
  isSending.value = true
  scrollHistoryToBottom()
  window.setTimeout(() => {
    messages.value.push({
      id: `ai-dispatch-${Date.now()}`,
      role: 'ai',
      model: model.short,
      time: nowTime(),
      text: `工单已自动生成并派发至 ${evt.unit} 责任部门。已完成全链路穿透取证与留痕归档，等待责任人签收确认。建议 48 小时内完成整改并回传闭环结果。`,
      skills: ['风险工单派发'],
      steps: [`事项：${evt.title}`, `责任单位：${evt.unit}`, '状态：已派发 · 待签收'],
    })
    isSending.value = false
    scrollHistoryToBottom()
  }, 360)
}

async function sendPrompt() {
  const text = prompt.value.trim()
  if (!text || isSending.value || streaming.value) return
  const currentModel = activeModel.value
  const currentSkills = selectedSkills.value.map((item) => item.name)

  // 1. 推入用户消息
  messages.value.push({
    id: `user-${Date.now()}`, role: 'user',
    model: currentModel.short, time: nowTime(),
    text, skills: currentSkills,
  })
  prompt.value = ''
  scrollHistoryToBottom()

  // 2. 命中剧本
  const script = matchScript(text)
  const pace = { ...SCRIPT_PACE, ...(script.pace || {}) }

  // 3. 推入空 AI 消息（reactive 以便流式更新触发渲染）
  const aiMsg = reactive({
    id: `ai-${Date.now()}`, role: 'ai',
    model: currentModel.short, time: nowTime(),
    text: '', thinking: '',
    _thinkOpen: true, _streaming: true,
    skills: currentSkills, steps: [],
  })
  messages.value.push(aiMsg)
  streaming.value = true
  scrollHistoryToBottom()

  // 4. Phase 1: 流式播放思考链（若有）
  if (script.thinking) {
    await streamInto(aiMsg, 'thinking', script.thinking, pace.thinkMs)
    aiMsg._thinkOpen = false  // 进入正文时自动收起
  }

  // 5. Phase 2: 流式播放正文
  await streamInto(aiMsg, 'text', script.reply.text, pace.charMs)
  aiMsg.steps = script.reply.steps || []
  aiMsg._streaming = false
  streaming.value = false

  // 6. Phase 3: 行动（导航）
  if (script.action?.type === 'navigate' && script.action.target) {
    setTimeout(() => emit('navigate', script.action.target), 500)
  }
  scrollHistoryToBottom()
}
</script>

<style scoped>
/* ====== 变量 & 基础 ====== */
.ai-page {
  --c-bg:    #f0f6ff;
  --c-bg2:   #f8fafc;
  --c-card:  #ffffff;
  --c-line:  #e2e8f0;
  --c-lines: #bfdbfe;
  --c-blue:  #2563eb;
  --c-blue2: #1d4ed8;
  --c-teal:  #0891b2;
  --c-pur:   #7c3aed;
  --c-red:   #ef4444;
  --c-grn:   #16a34a;
  --c-ora:   #f97316;
  --c-t1:    #0f172a;
  --c-t2:    #475569;
  --c-t3:    #94a3b8;
  --c-t4:    #cbd5e1;
  --c-glowb: rgba(37,99,235,0.12);
  --c-glowt: rgba(8,145,178,0.12);

  height: 100%;
  background: linear-gradient(160deg, #eef5ff 0%, #f8fafc 55%, #f0f9ff 100%);
  color: var(--c-t1);
  overflow: hidden;
  position: relative;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  letter-spacing: 0.02em;
}

/* 背景装饰 */
.ai-grid-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px);
  background-size: 44px 44px;
}
.ai-grid-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(37,99,235,0.07), transparent 50%),
    radial-gradient(ellipse at 90% 90%, rgba(8,145,178,0.05), transparent 45%);
}

.dashboard-container {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 14px 12px;
  gap: 10px;
}

/* ====== 顶部指标卡 ====== */
.top-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0,1fr));
  gap: 10px;
  flex-shrink: 0;
}

.metric-card {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--c-card);
  border: 1px solid var(--c-line);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.metric-card:hover { border-color: var(--c-lines); box-shadow: 0 6px 24px rgba(37,99,235,0.1); }
.metric-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--c-teal), var(--c-blue));
}
.metric-card.warn::before { background: linear-gradient(180deg, var(--c-red), var(--c-ora)); }

/* 背景光晕 */
.metric-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(37,99,235,0.03) 0%, transparent 60%);
  pointer-events: none;
}
.metric-card.warn .metric-scan { background: linear-gradient(135deg, rgba(239,68,68,0.04) 0%, transparent 60%); }
@keyframes mscan { 50%,100% { transform: translateX(100%); } }

.metric-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--c-t2);
  margin-bottom: 5px;
  font-weight: 600;
}
.metric-value {
  font-family: 'Orbitron','JetBrains Mono', monospace;
  font-size: 17px;
  font-weight: 700;
  color: var(--c-t1);
  line-height: 1;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.metric-value.val-red {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  -webkit-background-clip: text; background-clip: text;
}
.metric-value.val-timer {
  font-size: 13px;
  background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
  -webkit-background-clip: text; background-clip: text;
  letter-spacing: 0.02em;
}
.metric-sub { font-size: 10px; color: var(--c-t3); margin-top: 4px; }

.metric-icon-wrap {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 800; letter-spacing: 0.06em;
  flex-shrink: 0;
}
.icon-blue  { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.icon-cyan  { background: #ecfeff; color: #0891b2; border: 1px solid #a5f3fc; }
.icon-purple{ background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
.icon-red   { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
.icon-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

/* ====== 主体三栏 ====== */
.main-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 450px 1fr 427px;
  gap: 10px;
}

.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--c-card);
  border: 1px solid var(--c-line);
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(15,23,42,0.06), 0 1px 4px rgba(15,23,42,0.04);
  position: relative;
}

/* ====== 面板标题 ====== */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px 10px;
  border-bottom: 1px solid var(--c-line);
  position: relative;
  flex-shrink: 0;
  background: linear-gradient(90deg, #fafcff, #fff);
}
.panel-header::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0;
  width: 36px; height: 2px;
  background: linear-gradient(90deg, var(--c-blue), var(--c-teal));
  border-radius: 999px;
}
.panel-title {
  font-size: 12px; font-weight: 800; letter-spacing: 0.08em; color: var(--c-t1);
  display: flex; align-items: center; gap: 7px;
}
.panel-title::before {
  content: '';
  width: 3px; height: 12px;
  background: linear-gradient(180deg, var(--c-blue), var(--c-teal));
  border-radius: 999px;
  flex-shrink: 0;
}
.panel-badge {
  font-size: 9px; font-family: 'JetBrains Mono',monospace;
  padding: 2px 8px; border-radius: 999px;
  background: #eff6ff; border: 1px solid #bfdbfe;
  color: var(--c-blue); letter-spacing: 0.08em; font-weight: 700;
}
.panel-badge.online { color: var(--c-grn); background: #f0fdf4; border-color: #bbf7d0; }

/* ====== 左栏 ====== */
.domain-tabs {
  display: flex;
  gap: 6px;
  padding: 10px 14px 6px;
  flex-shrink: 0;
}
.domain-tab {
  padding: 4px 13px;
  border-radius: 999px;
  border: 1px solid var(--c-line);
  background: #f8fafc;
  color: var(--c-t2);
  font-size: 11px; font-weight: 700;
  cursor: pointer;
  transition: 0.16s;
}
.domain-tab.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: var(--c-blue);
  box-shadow: 0 2px 8px rgba(37,99,235,0.1);
}

.model-grid {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  padding: 8px 14px 10px;
  align-content: start;
}
.model-card {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  cursor: pointer;
  text-align: left;
  font-size: 11px; font-weight: 700;
  transition: 0.16s;
}
.model-card:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  box-shadow: 0 4px 12px rgba(239,68,68,0.1);
  transform: translateY(-1px);
}
.model-card.featured {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}
.model-card.featured:hover { background: #fee2e2; border-color: #fca5a5; box-shadow: 0 4px 12px rgba(239,68,68,0.1); }
.model-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: currentColor; flex-shrink: 0;
  margin-top: 3px;
}

.active-model-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 10px;
  border-top: 1px solid var(--c-line);
  background: #fafcff;
  flex-shrink: 0;
}
.amb-label { font-size: 9px; color: var(--c-t3); letter-spacing: 0.12em; font-weight: 600; }
.amb-value {
  font-family: 'JetBrains Mono',monospace;
  font-size: 11px; font-weight: 700; color: var(--c-blue);
  padding: 2px 9px; border-radius: 999px;
  background: #eff6ff; border: 1px solid #bfdbfe;
}
.amb-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.22);
  animation: blink-dot 2.2s ease-in-out infinite;
  margin-left: auto;
}
@keyframes blink-dot { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)} }

/* ====== 中栏 ====== */
.ph-left { display: flex; flex-direction: column; gap: 2px; }
.ph-desc { font-size: 9px; color: var(--c-t3); letter-spacing: 0.06em; }
.header-badges { display: flex; align-items: center; gap: 6px; }
.hb {
  font-size: 10px; font-weight: 700;
  padding: 2px 9px; border-radius: 999px;
  border: 1px solid var(--c-line);
  color: var(--c-t2);
  background: #f8fafc;
}
.hb.active { color: var(--c-blue); background: #eff6ff; border-color: #bfdbfe; }

.bound-bar {
  display: flex;
  gap: 14px;
  padding: 7px 14px 0;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.bound-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.bg-label { font-size: 9px; color: var(--c-t3); letter-spacing: 0.1em; font-weight: 600; }
.bp {
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 999px;
  border: 1px solid var(--c-line);
  color: var(--c-t2);
  background: #f8fafc;
}
.bp.active { color: var(--c-blue); background: #eff6ff; border-color: #bfdbfe; }
.bp.muted  { color: var(--c-t3); }

/* 对话区 */
.chat-area {
  flex: 1;
  min-height: 0;
  padding: 14px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
}
.message {
  display: flex; flex-direction: column;
  max-width: 82%; gap: 5px;
}
.message.user { align-self: flex-end; }
.message.ai   { align-self: flex-start; }

.message-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 9px; color: var(--c-t3);
}
.meta-role { font-weight: 700; letter-spacing: 0.06em; color: var(--c-t2); }
.message.user .meta-role { color: var(--c-blue); }
.message.ai   .meta-role { color: var(--c-teal); }
.meta-model { color: var(--c-t2); font-family: 'JetBrains Mono',monospace; font-size: 9px; }

.msg-bubble {
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 12px;
  line-height: 1.72;
  border: 1px solid var(--c-line);
  background: #fff;
  box-shadow: 0 2px 12px rgba(15,23,42,0.06);
  color: var(--c-t1);
}
.message.user .msg-bubble {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 20px rgba(37,99,235,0.22);
}
.message.ai .msg-bubble { border-top-left-radius: 4px; }
.message.user .msg-bubble { border-top-right-radius: 4px; }
.msg-bubble p { margin: 0; }
.msg-text { word-break: break-word; }
.msg-text strong { color: var(--c-blue2); font-weight: 700; }
.message.user .msg-text strong { color: #fff; }

/* 流式光标 */
.stream-cursor {
  display: inline-block; margin-left: 2px;
  color: var(--c-blue); font-weight: 700;
  animation: stream-blink 0.85s steps(2, end) infinite;
}
@keyframes stream-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

/* 思考链折叠块（位于 ai 消息 meta 与 bubble 之间） */
.msg-thinking {
  align-self: flex-start;
  max-width: 88%;
  margin: 4px 0 6px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
}
.mt-toggle {
  background: none; border: none; padding: 0;
  font-size: 11px; font-weight: 700; color: var(--c-pur);
  cursor: pointer;
}
.mt-toggle:hover { color: #6d28d9; }
.mt-body {
  margin-top: 4px; padding-left: 8px;
  border-left: 2px solid #ddd6fe;
  font-size: 11px; color: #6b7280; line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}

/* 推荐问题 chips（无对话时显示） */
.recommend-chips {
  align-self: stretch;
  margin: 6px 4px 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%);
  border: 1px solid #bfdbfe;
}
.rc-title {
  font-size: 11px; font-weight: 700; color: var(--c-blue2);
  margin-bottom: 8px; letter-spacing: 0.04em;
}
.rc-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
}
.rc-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-radius: 8px;
  background: #fff; border: 1px solid #e2e8f0;
  font-size: 12px; color: var(--c-t1); text-align: left;
  cursor: pointer; transition: 0.15s;
}
.rc-chip:hover:not(:disabled) {
  border-color: var(--c-blue); background: #eff6ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
}
.rc-chip:disabled { opacity: 0.5; cursor: not-allowed; }
.rc-num {
  flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%;
  background: var(--c-blue); color: #fff;
  font-size: 10px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
}
.rc-text { flex: 1; line-height: 1.3; }

.msg-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.msg-tag {
  font-size: 9px; font-weight: 600;
  padding: 2px 7px; border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: var(--c-blue);
}
.message.user .msg-tag {
  border-color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.18);
  color: #fff;
}

.thinking-steps { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.step-chip {
  font-size: 9px; padding: 3px 8px; border-radius: 6px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  color: var(--c-t2); font-weight: 600;
}

/* 等待动画 */
.pending-bubble {
  display: flex; gap: 6px; align-items: center;
  padding: 14px 18px;
  min-width: 64px;
}
.pending-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #bfdbfe;
  animation: pdot 1.3s ease-in-out infinite;
}
.pending-dot:nth-child(2) { animation-delay: 0.18s; background: #93c5fd; }
.pending-dot:nth-child(3) { animation-delay: 0.36s; background: #60a5fa; }
@keyframes pdot { 0%,100%{opacity:0.3;transform:scale(0.75)}50%{opacity:1;transform:scale(1.1)} }

/* 快捷指令 */
.quick-row {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding: 6px 14px 8px;
  flex-shrink: 0;
  border-top: 1px solid #f1f5f9;
}
.quick-btn {
  font-size: 10px; font-weight: 700;
  padding: 4px 12px; border-radius: 999px;
  border: 1px solid var(--c-line);
  background: #f8fafc;
  color: var(--c-t2);
  cursor: pointer;
  transition: 0.16s;
}
.quick-btn:hover {
  border-color: #bfdbfe;
  color: var(--c-blue);
  background: #eff6ff;
}

/* 输入区 */
.input-area {
  display: flex; gap: 10px; align-items: flex-end;
  padding: 8px 14px 12px;
  border-top: 1px solid var(--c-line);
  background: #fafcff;
  flex-shrink: 0;
}
.input-wrap { flex: 1; position: relative; }
.input-box {
  width: 100%;
  min-height: 72px;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: var(--c-t1);
  resize: none;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  transition: 0.2s;
}
.input-box::placeholder { color: var(--c-t3); }
.input-box:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}

.mention-panel {
  position: absolute; left: 0; right: 0; bottom: calc(100% + 8px);
  display: grid; gap: 4px; padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.98);
  box-shadow: 0 16px 40px rgba(15,23,42,0.12);
  backdrop-filter: blur(12px);
  z-index: 10;
}
.mention-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px; border-radius: 8px;
  border: 1px solid transparent; background: transparent;
  cursor: pointer; text-align: left;
  transition: 0.14s;
}
.mention-item:hover { border-color: #bfdbfe; background: #f0f7ff; }
.mention-name { font-size: 11px; font-weight: 700; color: var(--c-blue); font-family: 'JetBrains Mono',monospace; }
.mention-desc { flex: 1; font-size: 10px; color: var(--c-t2); }

.input-actions { display: flex; flex-direction: column; gap: 6px; }
.btn-reset, .btn-send {
  width: 88px; height: 34px; border-radius: 8px;
  border: none; cursor: pointer;
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.04em;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  transition: 0.18s;
}
.btn-reset {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: var(--c-t2);
}
.btn-reset:hover { border-color: #bfdbfe; color: var(--c-blue); background: #f8faff; }
.btn-send {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  box-shadow: 0 4px 14px rgba(37,99,235,0.28);
}
.btn-send:hover:not(:disabled) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 6px 20px rgba(37,99,235,0.38);
  transform: translateY(-1px);
}
.btn-send:disabled { opacity: 0.45; cursor: default; transform: none; }
.send-icon { width: 13px; height: 13px; }

/* ====== 右栏 ====== */
.agent-list {
  padding: 10px 12px;
  display: flex; flex-direction: column; gap: 8px;
  flex-shrink: 0;
}
.agent-card {
  display: flex; gap: 10px; align-items: center;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--c-line);
  border-radius: 10px;
  cursor: pointer; text-align: left;
  transition: 0.18s;
  box-shadow: 0 1px 4px rgba(15,23,42,0.04);
}
.agent-card:hover {
  border-color: #bfdbfe;
  background: #f8fbff;
  box-shadow: 0 4px 16px rgba(37,99,235,0.1);
  transform: translateX(2px);
}
.agent-icon {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  font-size: 11px; font-weight: 800;
  font-family: 'JetBrains Mono',monospace;
  flex-shrink: 0;
}
.ai-a1 { background: #ecfeff; color: #0891b2; border: 1px solid #a5f3fc; }
.ai-a2 { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.ai-a3 { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
.ai-a4 { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }

.agent-info { flex: 1; min-width: 0; }
.agent-info h4 { margin: 0 0 2px; font-size: 11px; font-weight: 700; color: var(--c-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agent-info p  { margin: 0; font-size: 10px; color: var(--c-t2); }
.agent-arrow { color: var(--c-t3); font-size: 18px; line-height: 1; font-weight: 300; }

/* SkillHub */
.skill-hub {
  flex: 0 0 auto;
  display: flex; flex-direction: column;
  border-top: 1px solid var(--c-line);
  background: #f8fafc;
  padding-bottom: 10px;
}
.skill-hub-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px 6px;
  font-size: 11px; font-weight: 800; color: var(--c-t1);
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.skill-count {
  font-size: 9px; font-family: 'JetBrains Mono',monospace;
  color: var(--c-blue); background: #eff6ff;
  padding: 1px 7px; border-radius: 999px;
  border: 1px solid #bfdbfe; font-weight: 700;
}

.skill-grid {
  padding: 2px 12px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  align-content: start;
}
.skill-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: var(--c-t2);
  font-size: 10px; font-weight: 600;
  cursor: pointer; text-align: left;
  transition: 0.16s;
  box-shadow: 0 1px 3px rgba(15,23,42,0.04);
}
.skill-btn:hover { border-color: #bfdbfe; color: var(--c-blue); background: #f8fbff; }
.skill-btn.active {
  border-color: #93c5fd;
  background: #eff6ff;
  color: var(--c-blue);
  box-shadow: 0 2px 10px rgba(37,99,235,0.1);
}
.skill-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #cbd5e1; flex-shrink: 0; transition: 0.16s;
}
.skill-btn.active .skill-dot { background: var(--c-blue); }

/* 滚动条 */
.micro-scroll::-webkit-scrollbar { width: 3px; }
.micro-scroll::-webkit-scrollbar-thumb { border-radius: 999px; background: #cbd5e1; }
.micro-scroll::-webkit-scrollbar-track { background: transparent; }

/* ====== AI 实时风险事件模块 ====== */
.ai-risk-hub {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--c-line);
  background: #f8fafc;
}

.ai-risk-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 9px 14px 7px;
  flex-shrink: 0;
  gap: 8px;
}

.arh-left {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.arh-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--c-t1);
  letter-spacing: 0.06em;
}

.arh-sub {
  font-size: 9px;
  color: var(--c-t3);
  letter-spacing: 0.04em;
}

.arh-badge {
  font-size: 9px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--c-red);
  white-space: nowrap;
  flex-shrink: 0;
}

.arh-badge.blink {
  animation: badge-blink 1.8s ease-in-out infinite;
}

@keyframes badge-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

.ai-risk-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

/* 风险事件卡片 */
.risk-evt {
  padding: 9px 11px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: 0.16s;
  box-shadow: 0 1px 4px rgba(15,23,42,0.04);
  border-left: 3px solid #e2e8f0;
}

.risk-evt:hover {
  box-shadow: 0 4px 14px rgba(15,23,42,0.08);
  transform: translateX(2px);
}

.risk-evt.high {
  border-left-color: var(--c-red);
  background: linear-gradient(135deg, #fff8f8 0%, #fff 60%);
}

.risk-evt.medium {
  border-left-color: var(--c-ora);
  background: linear-gradient(135deg, #fffaf6 0%, #fff 60%);
}

.risk-evt.watch {
  border-left-color: #eab308;
  background: linear-gradient(135deg, #fefdf0 0%, #fff 60%);
}

.risk-evt.handled {
  opacity: 0.55;
  border-left-color: #22c55e;
  background: linear-gradient(135deg, #f6fef9 0%, #fff 60%);
}

.risk-evt-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.risk-level-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.risk-level-dot.high   { background: var(--c-red);  box-shadow: 0 0 5px rgba(239,68,68,0.5); }
.risk-level-dot.medium { background: var(--c-ora);  box-shadow: 0 0 5px rgba(249,115,22,0.4); }
.risk-level-dot.watch  { background: #eab308;        box-shadow: 0 0 5px rgba(234,179,8,0.4); }
.risk-level-dot.handled-dot { background: #22c55e; }

.risk-evt-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-t1);
  flex: 1;
  line-height: 1.3;
}

.risk-evt-time {
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--c-t3);
  flex-shrink: 0;
}

.risk-evt-desc {
  font-size: 10px;
  color: var(--c-t2);
  line-height: 1.55;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.risk-evt-footer {
  display: flex;
  align-items: center;
  gap: 6px;
}

.risk-evt-model {
  font-size: 9px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--c-blue);
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
}

.risk-evt-unit {
  font-size: 9px;
  color: var(--c-t3);
  flex: 1;
}

.risk-dispatch-btn {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: var(--c-blue);
  cursor: pointer;
  transition: 0.14s;
  white-space: nowrap;
}

.risk-dispatch-btn:hover {
  background: var(--c-blue);
  color: #fff;
  border-color: var(--c-blue);
  box-shadow: 0 3px 10px rgba(37,99,235,0.25);
}

.risk-done-tag {
  font-size: 9px;
  font-weight: 700;
  color: #16a34a;
  background: #f0fdf4;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #bbf7d0;
}

/* ====== 统计切换（segmented control 样式，区别于资金域胶囊 tab） ====== */
.stats-toggle {
  display: flex;
  padding: 4px 14px 6px;
  flex-shrink: 0;
}
.stats-toggle-seg {
  display: inline-flex;
  background: #eef0f4;
  border-radius: 7px;
  padding: 2px;
  gap: 1px;
  border: 1px solid #dde1e8;
}
.st-btn {
  padding: 3px 14px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: var(--c-t3);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
  letter-spacing: 0.03em;
  white-space: nowrap;
}
.st-btn:hover { color: var(--c-t1); }
.st-btn.active {
  background: #fff;
  color: var(--c-t1);
  box-shadow: 0 1px 4px rgba(15,23,42,0.1), 0 0 0 0.5px rgba(15,23,42,0.06);
  font-weight: 700;
}

/* ====== 模型卡统计 ====== */
.mc-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
  align-items: flex-start;
}
.mc-label {
  font-size: 11px;
  font-weight: 700;
  color: currentColor;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.mc-stats {
  display: flex;
  align-items: center;
  gap: 3px;
}
.mc-stat {
  display: flex;
  align-items: baseline;
  gap: 1px;
}
.mc-stat-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: currentColor;
  opacity: 0.82;
}
.mc-stat-lbl {
  font-size: 9px;
  font-weight: 400;
  opacity: 0.6;
}
.mc-stat-sep {
  font-size: 8px;
  opacity: 0.35;
  margin: 0 1px;
}
.mc-risk .mc-stat-val { color: #dc2626; }
.model-card.featured .mc-risk .mc-stat-val { color: var(--c-blue); }

/* ====== 技能卡统计 ====== */
.skill-btn {
  align-items: flex-start !important;
}
.skill-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.skill-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.skill-name {
  font-size: 10px;
  font-weight: 700;
  color: currentColor;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.skill-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.skill-author {
  font-size: 9px;
  color: var(--c-t3);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.skill-calls {
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--c-t3);
  white-space: nowrap;
  flex-shrink: 0;
}
.skill-btn.active .skill-calls { color: var(--c-blue); opacity: 0.8; }
.skill-btn.active .skill-author { color: var(--c-t2); }

/* ====== 左侧面板整体滚动 ====== */
.left-panel {
  overflow-y: auto !important;
}
/* 面板头 sticky，滚动时始终固定在顶部 */
.left-panel .panel-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background: linear-gradient(90deg, #fafcff, #fff);
}
/* 统计切换跟着头部也 sticky */
.left-panel .stats-toggle {
  position: sticky;
  top: 43px;  /* panel-header 高度 */
  z-index: 2;
  background: var(--c-card);
  border-bottom: 1px solid #f1f5f9;
  padding-top: 6px;
  padding-bottom: 4px;
  margin-bottom: 0;
}
/* domain-tabs 跟随 sticky */
.left-panel .domain-tabs {
  position: sticky;
  top: 86px;  /* header + stats-toggle */
  z-index: 2;
  background: var(--c-card);
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
  margin-bottom: 2px;
}
/* mc-risk 风险数字用红色强调 */
.mc-risk .mc-stat-val { color: #dc2626 !important; opacity: 1; }

/* ====== 敬请期待卡片（r12） ====== */
.model-card.pending {
  border-color: #dde3ec;
  border-style: dashed;
  background: linear-gradient(135deg, #f8f9fc 0%, #f0f3f8 100%);
  color: #a0aec0;
  cursor: default;
  opacity: 0.72;
}
.model-card.pending:hover {
  background: linear-gradient(135deg, #f8f9fc 0%, #f0f3f8 100%);
  border-color: #dde3ec;
  box-shadow: none;
  transform: none;
}
.model-card.pending .model-dot { background: #c8d0dc; }
.mc-pending-label {
  font-size: 9px;
  color: #b0bcc8;
  font-style: italic;
  margin-top: 2px;
  letter-spacing: 0.03em;
}

/* ====== 输入工具栏：附件 + 深度思考 ====== */
.input-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 4px 0 5px;
}
.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: var(--c-t2);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
  white-space: nowrap;
  letter-spacing: 0.02em;
  user-select: none;
}
.tool-btn:hover {
  border-color: #bfdbfe;
  color: var(--c-blue);
  background: #eff6ff;
}
.attach-label { cursor: pointer; }
.hidden-file  { display: none; }
.tool-icon { width: 13px; height: 13px; flex-shrink: 0; }
.think-toggle.active {
  border-color: #7c3aed;
  background: #f5f3ff;
  color: #7c3aed;
  box-shadow: 0 2px 8px rgba(124,58,237,0.14);
}
.think-badge {
  font-size: 8px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 999px;
  background: #7c3aed;
  color: #fff;
  margin-left: 2px;
  letter-spacing: 0.04em;
}
.attach-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: var(--c-blue);
  font-size: 10px;
  font-weight: 600;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attach-remove {
  width: 14px; height: 14px;
  border-radius: 50%;
  border: none;
  background: #bfdbfe;
  color: #1e40af;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  flex-shrink: 0;
}
.attach-remove:hover { background: #93c5fd; }

/* ====== 消息气泡操作按钮 ====== */
.msg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid rgba(15,23,42,0.07);
}
.msg-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.16s;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: var(--c-blue);
  letter-spacing: 0.02em;
}
.msg-action-btn:hover {
  background: var(--c-blue);
  color: #fff;
  border-color: var(--c-blue);
  box-shadow: 0 3px 12px rgba(37,99,235,0.22);
  transform: translateY(-1px);
}
</style>
