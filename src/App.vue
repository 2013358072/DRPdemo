<template>
  <div class="app">
    <!-- 顶部 -->
    <header class="topbar">
      <div class="topbar-left">
        <button v-if="current !== 'dashboard'" type="button" class="topbar-back-btn" @click="navigate('dashboard')">
          <span class="topbar-back-arrow">←</span>
          <span>返回</span>
        </button>
        <span v-if="current !== 'dashboard'" class="topbar-app-name">{{ topbarAppName }}</span>
      </div>
      <div class="topbar-center-title">{{ currentPageTitle }}</div>
      <div class="topbar-info">
        <!-- 提醒铃 -->
        <div class="bell-wrap" v-click-outside="closeBell">
          <button class="bell-btn" type="button" @click="toggleBell" :class="{ active: bellOpen }" aria-label="实时提醒">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke-linecap="round"/>
            </svg>
            <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            <span class="bell-pulse" v-if="unreadCount > 0"></span>
          </button>
          <transition name="bell-fade">
            <div v-if="bellOpen" class="bell-panel">
              <div class="bell-panel-head">
                <strong>实时提醒</strong>
                <button class="bell-mark-all" type="button" @click="markAllRead">全部已读</button>
              </div>
              <div class="bell-panel-tabs">
                <button v-for="t in bellTabs" :key="t.value" class="bell-tab" :class="{ active: bellTab === t.value }" @click="bellTab = t.value">{{ t.label }}<span class="bell-tab-cnt">{{ t.count }}</span></button>
              </div>
              <div class="bell-panel-list">
                <div v-for="msg in filteredMessages" :key="msg.id" class="bell-msg" :class="[`bell-${msg.level}`, { 'bell-read': msg.read }]" @click="openMessage(msg)">
                  <div class="bell-msg-icon">{{ msg.icon }}</div>
                  <div class="bell-msg-body">
                    <div class="bell-msg-top"><strong>{{ msg.title }}</strong><span class="bell-msg-time">{{ msg.time }}</span></div>
                    <div class="bell-msg-desc">{{ msg.desc }}</div>
                    <div class="bell-msg-tag" v-if="msg.tag">{{ msg.tag }}</div>
                  </div>
                  <span v-if="!msg.read" class="bell-msg-dot"></span>
                </div>
                <div v-if="!filteredMessages.length" class="bell-msg-empty">暂无{{ bellTab === 'all' ? '' : bellTabs.find(t => t.value === bellTab)?.label }}消息</div>
              </div>
              <div class="bell-panel-foot">
                <button class="bell-foot-btn" type="button" @click="closeBell">查看全部 ›</button>
              </div>
            </div>
          </transition>
        </div>
        <div class="stat">
          <span>系统时间</span>
          <strong>{{ clock }}</strong>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <div class="main">
      <!-- 场景视图 -->
      <main class="scene-wrap">
        <KeepAlive>
          <component :is="currentComponent" :key="current" @navigate="navigate" />
        </KeepAlive>
      </main>
    </div>

    <button
      type="button"
      class="ai-float"
      :class="{ active: current === 'ai' }"
      @click="navigate('ai')"
      aria-label="打开 AI 智能体"
      title="打开 AI 智能体"
    >
      <span class="ai-float-ring"></span>
      <span class="ai-float-core">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path d="M12 3v3M12 18v3M4.8 7.2l2.2 2.2M17 14.8l2.2 2.2M3 12h3M18 12h3M4.8 16.8l2.2-2.2M17 9.2l2.2-2.2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="4.2"/>
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
        </svg>
      </span>
      <span class="ai-float-text">AI</span>
    </button>

    <FloatingAIAssistant :scene="current" @action="handleAssistantAction" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

import FloatingAIAssistant from './components/FloatingAIAssistant.vue'
import Dashboard from './views/Dashboard.vue'
import Investment from './views/Investment.vue'
import Funds from './views/Funds.vue'
import Contract from './views/Contract.vue'
import Procurement from './views/Procurement.vue'
import AIAgent from './views/AIAgent.vue'

const sceneMap = {
  dashboard: Dashboard,
  invest: Investment,
  finance: Funds,
  equity: Contract,
  overseas: Procurement,
  ai: AIAgent
}
const sceneAliasMap = {
  dashboard: 'dashboard',
  investment: 'invest',
  invest: 'invest',
  funds: 'finance',
  finance: 'finance',
  contract: 'equity',
  equity: 'equity',
  procurement: 'overseas',
  overseas: 'overseas',
  ai: 'ai',
}

const DEFAULT_SCENE = 'dashboard'
const current = ref(DEFAULT_SCENE)
const currentComponent = computed(() => sceneMap[current.value])
const topbarAppName = computed(() => '智能穿透监管平台')
const currentPageTitle = computed(() => {
  if (current.value === 'ai') return '指挥调度中心'
  if (current.value === 'equity') return '合同智联仓库'
  return '智能穿透监管平台'
})

function normalizeScene(scene) {
  return sceneAliasMap[scene] || DEFAULT_SCENE
}

function getSceneFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim()
  return normalizeScene(raw || DEFAULT_SCENE)
}

function syncSceneFromLocation() {
  current.value = getSceneFromHash()
}

function navigate(scene, options = {}) {
  const target = normalizeScene(scene)
  const nextHash = `#/${target}`

  if (window.location.hash === nextHash) {
    current.value = target
    return
  }

  if (options.replace) {
    window.history.replaceState(null, '', nextHash)
    syncSceneFromLocation()
    return
  }

  window.location.hash = nextHash
}

function dispatchProjectOpenEvent(projectId) {
  window.dispatchEvent(
    new CustomEvent('drp-open-invest-project', {
      detail: { projectId },
    })
  )
}

function handleAssistantAction(action) {
  if (!action || action.type !== 'open-invest-project') return

  const projectId = action.projectId || 'P01'
  if (current.value === 'invest') {
    dispatchProjectOpenEvent(projectId)
    return
  }

  navigate('invest')
  nextTick(() => {
    window.setTimeout(() => {
      dispatchProjectOpenEvent(projectId)
    }, 120)
  })
}

const clock = ref('--:--:--')
let timer = null
function tick() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  clock.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// ── 提醒铃 ──
const bellOpen = ref(false)
const bellTab = ref('all')
const bellMessages = ref([
  { id: 'M001', level: 'critical', icon: '🚨', title: '重大风险预警 · 水电移民安置总包', desc: 'HT-2026-0840 累计超预算 12%，社会稳定评估缺失，需立即上报集团领导。', tag: '合同管理域', time: '刚刚', read: false, scene: 'equity' },
  { id: 'M002', level: 'high', icon: '⚠', title: '高风险合同价格异动', desc: 'HT-202605002 钢材采购单价较供应商历史价偏高 11.5%，触发预警。', tag: '合同管理域', time: '2 分钟前', read: false, scene: 'equity' },
  { id: 'M003', level: 'high', icon: '💰', title: '大额异常支付拦截', desc: 'PO-2026-0418-017 对非白名单供应商支付 4800 万，已拦截待复核。', tag: '资金管理域', time: '8 分钟前', read: false, scene: 'finance' },
  { id: 'M004', level: 'medium', icon: '🔍', title: '采购围标线索', desc: 'CG-2026-0501 三家投标单位同 IP/MAC，建议立即启动专项调查。', tag: '采购管理域', time: '15 分钟前', read: false, scene: 'overseas' },
  { id: 'M005', level: 'medium', icon: '📈', title: '投资超预算预警', desc: '陇东风电基地二期累计超预算 12%，EPC 承包商存在关联交易疑点。', tag: '投资管理域', time: '32 分钟前', read: false, scene: 'invest' },
  { id: 'M006', level: 'watch', icon: 'ℹ', title: 'AI 智能体分析完成', desc: '日报已生成 · 本日累计扫描合同 1,205 份，发现待核查风险 23 项。', tag: '系统通知', time: '1 小时前', read: true, scene: 'ai' },
  { id: 'M007', level: 'watch', icon: '📊', title: '月度风险态势报告', desc: '5 月集团整体风险评分 68 分，较上月+2 分，重点关注工程建设板块。', tag: '系统通知', time: '3 小时前', read: true, scene: 'dashboard' },
  { id: 'M008', level: 'medium', icon: '⏰', title: '整改工单即将逾期', desc: 'WO-2026-0042 围标核查工单距整改期限剩余 2 天，请尽快推进。', tag: '工单提醒', time: '5 小时前', read: false, scene: 'equity' },
])
const bellTabs = computed(() => [
  { value: 'all', label: '全部', count: bellMessages.value.length },
  { value: 'critical', label: '紧急', count: bellMessages.value.filter(m => m.level === 'critical' || m.level === 'high').length },
  { value: 'medium', label: '一般', count: bellMessages.value.filter(m => m.level === 'medium').length },
  { value: 'watch', label: '通知', count: bellMessages.value.filter(m => m.level === 'watch').length },
])
const unreadCount = computed(() => bellMessages.value.filter(m => !m.read).length)
const filteredMessages = computed(() => {
  if (bellTab.value === 'all') return bellMessages.value
  if (bellTab.value === 'critical') return bellMessages.value.filter(m => m.level === 'critical' || m.level === 'high')
  return bellMessages.value.filter(m => m.level === bellTab.value)
})
function toggleBell() { bellOpen.value = !bellOpen.value }
function closeBell() { bellOpen.value = false }
function markAllRead() { bellMessages.value.forEach(m => { m.read = true }) }
function openMessage(msg) {
  msg.read = true
  if (msg.scene) {
    navigate(msg.scene)
    bellOpen.value = false
  }
}

// v-click-outside 指令
const vClickOutside = {
  mounted(el, binding) {
    el.__clickOutsideHandler__ = (e) => {
      if (!el.contains(e.target)) binding.value(e)
    }
    document.addEventListener('click', el.__clickOutsideHandler__)
  },
  unmounted(el) {
    document.removeEventListener('click', el.__clickOutsideHandler__)
  },
}

function handleHashChange() {
  syncSceneFromLocation()
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
  if (!window.location.hash) {
    navigate(DEFAULT_SCENE, { replace: true })
  } else {
    syncSceneFromLocation()
  }
  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<style scoped>
.app {
  display: grid;
  grid-template-rows: 44px 1fr;
  height: 100vh; width: 100vw;
}

/* ====== 顶部 ====== */
.topbar {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto minmax(220px, 1fr);
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
  position: relative;
  background: #ffffff;
}
.topbar::before {
  content: ''; position: absolute; height: 1px; bottom: -1px;
  left: 25%; width: 50%;
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.3), transparent);
  opacity: 1;
}

.topbar-left {
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid #dbe4ee;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease;
}

.topbar-back-btn:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.10);
}

.topbar-back-arrow {
  font-size: 13px;
  line-height: 1;
}

.topbar-app-name {
  display: inline-flex;
  align-items: center;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.topbar-center-title {
  justify-self: center;
  padding: 0 12px;
  font-family: var(--f-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #0f172a;
  white-space: nowrap;
  position: relative;
  line-height: 1;
}

.topbar-center-title::before,
.topbar-center-title::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 18px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.42));
  transform: translateY(-50%);
}

.topbar-center-title::before {
  left: -4px;
}

.topbar-center-title::after {
  right: -4px;
  transform: translateY(-50%) scaleX(-1);
}

.topbar-info { display: flex; justify-content: flex-end; align-items: center; gap: 14px; justify-self: end; width: 100%; }

/* ── 提醒铃 ── */
.bell-wrap { position: relative; }
.bell-btn { position: relative; width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: .15s; }
.bell-btn:hover, .bell-btn.active { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.bell-btn svg { width: 17px; height: 17px; }
.bell-badge { position: absolute; top: -4px; right: -4px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: #ef4444; color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 1.5px solid #fff; }
.bell-pulse { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background: rgba(239,68,68,0.5); animation: bell-pulse 1.6s ease-in-out infinite; pointer-events: none; }
@keyframes bell-pulse { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }

.bell-panel { position: absolute; top: calc(100% + 8px); right: 0; width: 380px; max-height: 520px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 12px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06); z-index: 9999; display: flex; flex-direction: column; overflow: hidden; }
.bell-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
.bell-panel-head strong { font-size: 14px; color: #0f172a; font-weight: 800; }
.bell-mark-all { font-size: 11px; color: #2563eb; background: none; border: none; cursor: pointer; font-weight: 600; }
.bell-mark-all:hover { text-decoration: underline; }

.bell-panel-tabs { display: flex; gap: 4px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
.bell-tab { padding: 4px 10px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #475569; font-size: 11px; font-weight: 600; cursor: pointer; transition: .14s; display: flex; align-items: center; gap: 4px; }
.bell-tab:hover, .bell-tab.active { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.bell-tab-cnt { font-size: 9px; opacity: 0.7; }

.bell-panel-list { flex: 1; min-height: 0; max-height: 360px; overflow-y: auto; padding: 4px 0; }
.bell-msg { display: flex; gap: 10px; padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f8fafc; position: relative; transition: .14s; }
.bell-msg:hover { background: #f8fafc; }
.bell-msg.bell-read { opacity: 0.62; }
.bell-msg-icon { font-size: 18px; flex-shrink: 0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #f1f5f9; }
.bell-critical .bell-msg-icon { background: #fee2e2; }
.bell-high .bell-msg-icon { background: #fef2f2; }
.bell-medium .bell-msg-icon { background: #fff7ed; }
.bell-watch .bell-msg-icon { background: #eff6ff; }
.bell-msg-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.bell-msg-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.bell-msg-top strong { font-size: 12px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bell-msg-time { font-size: 10px; color: #94a3b8; flex-shrink: 0; }
.bell-msg-desc { font-size: 11px; color: #475569; line-height: 1.5; }
.bell-msg-tag { display: inline-flex; align-self: flex-start; font-size: 9px; padding: 1px 6px; border-radius: 999px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; margin-top: 2px; }
.bell-msg-dot { position: absolute; top: 14px; right: 12px; width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }
.bell-msg-empty { text-align: center; padding: 36px 16px; color: #94a3b8; font-size: 12px; }

.bell-panel-foot { padding: 8px 14px; border-top: 1px solid #f1f5f9; background: #f8fafc; }
.bell-foot-btn { width: 100%; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #2563eb; font-size: 12px; font-weight: 600; cursor: pointer; }
.bell-foot-btn:hover { background: #eff6ff; border-color: #93c5fd; }

.bell-fade-enter-active, .bell-fade-leave-active { transition: opacity .2s, transform .2s; }
.bell-fade-enter-from, .bell-fade-leave-to { opacity: 0; transform: translateY(-4px); }

.stat { display: flex; flex-direction: column; align-items: flex-end;
        color: #64748b; font-size: 9px; letter-spacing: 0.1em; }
.stat strong {
  font-family: var(--f-n); color: #0f172a;
  font-size: 11px; font-weight: 600; margin-top: 1px;
}

/* ====== 主体 ====== */
.main { overflow: hidden; min-height: 0; height: 100%; }
.scene-wrap {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ai-float {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 62px;
  height: 62px;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  z-index: 9990;
  color: var(--t-1);
  opacity: 1;
  transition: transform 0.18s ease, filter 0.18s ease;
}

.ai-float:hover {
  transform: translateY(-2px) scale(1.03);
  filter: brightness(1.08);
}

.ai-float.active .ai-float-core {
  box-shadow:
    0 0 0 1px rgba(74, 144, 226, 0.28),
    0 0 22px rgba(74, 144, 226, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.ai-float-ring,
.ai-float-core,
.ai-float-text {
  position: absolute;
}

.ai-float-ring {
  inset: 1px;
  border-radius: 50%;
  border: 1px solid rgba(74, 144, 226, 0.42);
  box-shadow: 0 0 24px rgba(74, 144, 226, 0.28);
  animation: ai-orbit 3.6s linear infinite;
}

.ai-float-core {
  inset: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.22), transparent 34%),
    radial-gradient(circle at 50% 50%, rgba(74, 144, 226, 0.56), rgba(34, 74, 128, 0.98) 72%);
  border: 1px solid rgba(74, 144, 226, 0.48);
  box-shadow:
    0 0 0 1px rgba(74, 144, 226, 0.18),
    0 0 24px rgba(74, 144, 226, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.ai-float-core svg {
  width: 22px;
  height: 22px;
  color: #dff8ff;
  filter: drop-shadow(0 0 8px rgba(74, 144, 226, 0.38));
}

.ai-float-text {
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  min-width: 28px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(8, 18, 42, 0.92);
  border: 1px solid rgba(74, 144, 226, 0.24);
  color: var(--primary);
  font-family: var(--f-n);
  font-size: 8px;
  letter-spacing: 0.18em;
  box-shadow: 0 0 12px rgba(74, 144, 226, 0.12);
}

@keyframes ai-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
