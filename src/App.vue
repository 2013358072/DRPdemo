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

.topbar-info { display: flex; justify-content: flex-end; align-items: center; gap: 16px; justify-self: end; width: 100%; }
.stat { display: flex; flex-direction: column; align-items: flex-end;
        color: #64748b; font-size: 9px; letter-spacing: 0.1em; }
.stat strong {
  font-family: var(--f-n); color: #0f172a;
  font-size: 11px; font-weight: 600; margin-top: 1px;
}

/* ====== 主体 ====== */
.main { overflow: hidden; min-height: 0; }
.scene-wrap {
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 20px 10px;
  height: 100%;
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
