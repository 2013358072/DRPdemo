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
          <div class="en">DRP · DIGITALIZED RESOURCE PLATFORM</div>
        </div>
      </div>
      <div class="topbar-center">全 域 数 字 化 资 源 监 管 中 心</div>
      <div class="topbar-info">
        <div class="stat">
          <span><span class="live-dot"></span>规则引擎</span>
          <strong>30 硬拦截 · 80 弹性</strong>
        </div>
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
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <div class="s-label">DEMO SCENES</div>
        <div
          v-for="s in SCENES"
          :key="s.key"
          class="nav-item"
          :class="{ active: current === s.key }"
          @click="current = s.key"
        >
          <span class="n-num">{{ s.num }}</span>
          <span class="n-i">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path :d="s.icon" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="n-name">{{ s.name }}</span>
        </div>
        <div class="s-meta">
          <h5>42 张业务表</h5>
          <div class="m"><span>数据字典层</span><strong>7</strong></div>
          <div class="m"><span>公共主数据</span><strong>6</strong></div>
          <div class="m"><span>驾驶舱</span><strong>3</strong></div>
          <div class="m"><span>投资穿透</span><strong>5</strong></div>
          <div class="m"><span>资金穿透</span><strong>5</strong></div>
          <div class="m"><span>合同穿透</span><strong>5</strong></div>
          <div class="m"><span>采购穿透</span><strong>5</strong></div>
          <div class="m"><span>风险+AI</span><strong>6</strong></div>
        </div>
      </aside>

      <!-- 场景视图 -->
      <main class="scene-wrap">
        <KeepAlive>
          <component :is="currentComponent" />
        </KeepAlive>
      </main>
    </div>

    <!-- 底部 -->
    <footer class="bottom-bar">
      <div class="marquee">
        <span>SYSTEM · 全域监管中心 v2026</span>
        <span><strong class="lbl">42</strong> 业务表 · <strong class="lbl">9</strong> 分层架构</span>
        <span>规则引擎: <strong class="lbl primary">30</strong> 硬拦截 · <strong class="lbl primary">80</strong> 弹性预警</span>
        <span>四全穿透: 全级次 · 全链条 · 全过程 · 全要素</span>
      </div>
      <div><span class="sd"></span> 系统正常 · POWERED BY DRP</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { SCENES } from './data/mockData.js'

import Dashboard from './views/Dashboard.vue'
import Invest from './views/Invest.vue'
import Finance from './views/Finance.vue'
import Equity from './views/Equity.vue'
import Overseas from './views/Overseas.vue'
import AIAgent from './views/AIAgent.vue'

const sceneMap = {
  dashboard: Dashboard,
  invest: Invest,
  finance: Finance,
  equity: Equity,
  overseas: Overseas,
  ai: AIAgent
}

const current = ref('dashboard')
const currentComponent = computed(() => sceneMap[current.value])

const clock = ref('--:--:--')
let timer = null
function tick() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  clock.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
onMounted(() => { tick(); timer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.app {
  display: grid;
  grid-template-rows: 64px 1fr 28px;
  height: 100vh; width: 100vw;
}

/* ====== 顶部 ====== */
.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 28px;
  border-bottom: 1px solid var(--line);
  position: relative;
  background: linear-gradient(180deg, rgba(8,18,42,0.8), transparent);
}
.topbar::before {
  content: ''; position: absolute; height: 2px; bottom: -1px;
  left: 35%; width: 30%;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  opacity: 0.7;
}
.brand { display: flex; align-items: center; gap: 14px; }
.brand-logo { width: 36px; height: 36px; }
.brand-logo svg { width: 100%; height: 100%; filter: drop-shadow(0 0 8px var(--p-glow)); }
.brand-text .cn {
  font-family: var(--f-serif); font-weight: 900; font-size: 19px;
  letter-spacing: 0.12em;
  background: linear-gradient(180deg, var(--t-1), var(--primary));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.brand-text .en {
  font-family: var(--f-n); font-size: 8px; color: var(--t-3);
  letter-spacing: 0.32em; margin-top: 2px;
}
.topbar-center {
  text-align: center;
  font-family: var(--f-serif); font-weight: 700; font-size: 22px;
  letter-spacing: 0.4em; color: var(--t-1);
  text-shadow: 0 0 28px var(--p-glow); position: relative;
}
.topbar-center::before, .topbar-center::after {
  content: ''; position: absolute; top: 50%;
  width: 50px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary));
}
.topbar-center::before { right: 100%; margin-right: 14px; }
.topbar-center::after { left: 100%; margin-left: 14px; transform: scaleX(-1); }

.topbar-info { display: flex; justify-content: flex-end; align-items: center; gap: 22px; }
.stat { display: flex; flex-direction: column; align-items: flex-end;
        color: var(--t-3); font-size: 10px; letter-spacing: 0.12em; }
.stat strong {
  font-family: var(--f-n); color: var(--t-1);
  font-size: 13px; font-weight: 600; margin-top: 1px;
}
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--r-green); margin-right: 5px;
  box-shadow: 0 0 12px var(--r-green);
  animation: pulse 2s ease-in-out infinite;
  display: inline-block; vertical-align: middle;
}

/* ====== 主体 ====== */
.main { display: grid; grid-template-columns: 200px 1fr; overflow: hidden; }
.sidebar {
  border-right: 1px solid var(--line);
  padding: 20px 14px;
  background: linear-gradient(180deg, var(--panel), transparent);
  overflow-y: auto;
}
.s-label {
  font-family: var(--f-n); font-size: 9px;
  letter-spacing: 0.32em; color: var(--t-4);
  margin: 0 0 16px 8px; padding-bottom: 12px;
  border-bottom: 1px dashed var(--line);
}
.nav-item {
  display: flex; align-items: center; gap: 11px;
  padding: 12px; margin-bottom: 5px;
  cursor: pointer; position: relative;
  border-radius: 3px; transition: all 0.3s;
  color: var(--t-2);
}
.nav-item .n-num {
  font-family: var(--f-n); font-size: 10px;
  font-weight: 700; color: var(--t-4); letter-spacing: 0.1em;
}
.nav-item .n-i {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  color: var(--t-3);
}
.nav-item .n-i svg { width: 100%; height: 100%; }
.nav-item .n-name {
  font-size: 13px; font-weight: 500; letter-spacing: 0.08em;
}
.nav-item:hover { background: var(--panel-2); color: var(--t-1); }
.nav-item:hover .n-i { color: var(--primary); }
.nav-item.active {
  background: linear-gradient(90deg, rgba(0,212,255,0.18), transparent);
  color: var(--t-1);
}
.nav-item.active::before {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 3px; background: var(--primary);
  box-shadow: 0 0 12px var(--p-glow);
}
.nav-item.active .n-i,
.nav-item.active .n-name { color: var(--primary); }
.nav-item.active .n-num { color: var(--t-2); }

.s-meta {
  margin-top: 24px; padding: 14px 12px;
  border: 1px solid var(--line);
  border-radius: 3px; position: relative;
  background: rgba(0,212,255,0.04);
}
.s-meta::before, .s-meta::after {
  content: ''; position: absolute;
  width: 9px; height: 9px; border: 1px solid var(--primary);
}
.s-meta::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.s-meta::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }
.s-meta h5 {
  font-size: 9px; letter-spacing: 0.25em; color: var(--t-3);
  font-weight: 500; margin-bottom: 10px;
}
.s-meta .m {
  display: flex; justify-content: space-between;
  font-size: 11px; margin-bottom: 5px; color: var(--t-2);
}
.s-meta .m strong { font-family: var(--f-n); color: var(--primary); font-weight: 600; }

.scene-wrap { overflow: hidden; padding: 14px 20px; height: 100%; }

/* ====== 底部 ====== */
.bottom-bar {
  display: flex; align-items: center;
  padding: 0 24px;
  border-top: 1px solid var(--line);
  font-size: 10px; color: var(--t-4);
  font-family: var(--f-m); letter-spacing: 0.15em;
  background: var(--bg-0); justify-content: space-between;
}
.marquee {
  display: flex; align-items: center; gap: 32px;
  color: var(--t-3); white-space: nowrap; overflow: hidden;
}
.marquee span { display: inline-flex; align-items: center; gap: 6px; }
.marquee span::before { content: '◆'; color: var(--primary); font-size: 8px; }
.lbl { color: var(--t-1); font-family: var(--f-n); font-weight: 600; }
.lbl.primary { color: var(--primary); }
.sd {
  display: inline-block; width: 6px; height: 6px;
  border-radius: 50%; background: var(--r-green);
  box-shadow: 0 0 6px var(--r-green); margin-right: 4px;
  animation: pulse 2s ease-in-out infinite;
}
</style>
