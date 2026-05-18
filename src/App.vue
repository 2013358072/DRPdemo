<template>
  <div class="app">
    <!-- 顶部 -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="17" stroke="#00d4ff" stroke-width="1" opacity="0.4"/>
            <circle cx="20" cy="20" r="11" stroke="#00d4ff" stroke-width="1" opacity="0.7"/>
            <circle cx="20" cy="20" r="5" stroke="#00d4ff" stroke-width="1.5" fill="rgba(0,212,255,0.2)"/>
            <line x1="20" y1="3" x2="20" y2="9" stroke="#00d4ff" stroke-width="1.5"/>
            <line x1="20" y1="31" x2="20" y2="37" stroke="#00d4ff" stroke-width="1.5"/>
            <line x1="3" y1="20" x2="9" y2="20" stroke="#00d4ff" stroke-width="1.5"/>
            <line x1="31" y1="20" x2="37" y2="20" stroke="#00d4ff" stroke-width="1.5"/>
            <circle cx="20" cy="20" r="1.5" fill="#ffd700"/>
          </svg>
        </div>
        <div class="brand-text">
          <div class="cn">穿 透 式 监 管</div>
        </div>
      </div>
      <div class="topbar-center-title">全景监管驾驶舱</div>
      <div class="topbar-info">
        <div class="stat">
          <span>系统时间</span>
          <strong>{{ clock }}</strong>
        </div>
        <div class="stat">
          <span>风险闭环率</span>
          <strong>76.4%</strong>
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

const DEFAULT_SCENE = 'dashboard'
const current = ref(DEFAULT_SCENE)
const currentComponent = computed(() => sceneMap[current.value])

function normalizeScene(scene) {
  return sceneMap[scene] ? scene : DEFAULT_SCENE
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
  grid-template-rows: 52px 1fr;
  height: 100vh; width: 100vw;
}

/* ====== 顶部 ====== */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
  position: relative;
  background: linear-gradient(180deg, rgba(8,18,42,0.8), transparent);
}
.topbar::before {
  content: ''; position: absolute; height: 2px; bottom: -1px;
  left: 25%; width: 50%;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  opacity: 0.55;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-logo { width: 30px; height: 30px; }
.brand-logo svg { width: 100%; height: 100%; filter: drop-shadow(0 0 8px var(--p-glow)); }
.brand-text .cn {
  font-family: var(--f-serif); font-weight: 900; font-size: 16px;
  letter-spacing: 0.1em;
  background: linear-gradient(180deg, var(--t-1), var(--primary));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.topbar-center-title {
  justify-self: center;
  padding: 0 18px;
  font-family: var(--f-serif);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #dff6ff;
  text-shadow: 0 0 14px rgba(0, 212, 255, 0.22);
  white-space: nowrap;
  position: relative;
}

.topbar-center-title::before,
.topbar-center-title::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 26px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.72));
  transform: translateY(-50%);
}

.topbar-center-title::before {
  left: -8px;
}

.topbar-center-title::after {
  right: -8px;
  transform: translateY(-50%) scaleX(-1);
}

.topbar-info { display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
.stat { display: flex; flex-direction: column; align-items: flex-end;
        color: var(--t-3); font-size: 9px; letter-spacing: 0.1em; }
.stat strong {
  font-family: var(--f-n); color: var(--t-1);
  font-size: 12px; font-weight: 600; margin-top: 1px;
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
    0 0 0 1px rgba(0, 212, 255, 0.28),
    0 0 22px rgba(0, 212, 255, 0.34),
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
  border: 1px solid rgba(0, 212, 255, 0.42);
  box-shadow: 0 0 24px rgba(0, 212, 255, 0.28);
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
    radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.5), rgba(8, 18, 42, 0.98) 72%);
  border: 1px solid rgba(0, 212, 255, 0.48);
  box-shadow:
    0 0 0 1px rgba(0, 212, 255, 0.18),
    0 0 24px rgba(0, 212, 255, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.ai-float-core svg {
  width: 22px;
  height: 22px;
  color: #dff8ff;
  filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.38));
}

.ai-float-text {
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  min-width: 28px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(8, 18, 42, 0.92);
  border: 1px solid rgba(0, 212, 255, 0.24);
  color: var(--primary);
  font-family: var(--f-n);
  font-size: 8px;
  letter-spacing: 0.18em;
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.12);
}

@keyframes ai-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
