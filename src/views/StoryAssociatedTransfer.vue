<!--
  StoryAssociatedTransfer.vue
  ───────────────────────────────────────────────────────────────────────────
  「故事线一：关联输送」演示组件（自包含单文件组件）

  核心理念：AI 自动跑完整条调查，人只拍一次板。
    AI 主动发现风险 → 自动穿透关系网络 → 自动多源交叉取证
    → 自动生成研判报告 → 人点 1 次「采纳方案 A」→ AI 自动执行处置。
  除「采纳方案」1 次点击外，全程由前端按时序自动播放，不依赖任何外部状态 /
  后端 / 真实大模型，所有数据均为组件内假数据。

  ── 如何挂到现有页面 ──────────────────────────────────────────────────────
  1. 依赖（项目已安装 echarts^6，若无：  npm i echarts  ）
  2. 在目标页面（如 Procurement.vue）中：
        import StoryAssociatedTransfer from './StoryAssociatedTransfer.vue'
     模板中放置：
        <StoryAssociatedTransfer />
     组件单屏自适应父容器宽高，建议给父容器一个明确高度（如 100% / 720px）。
  ───────────────────────────────────────────────────────────────────────────
-->
<script setup>
import { ref, reactive, shallowRef, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

/* ───────────────────────── 假数据 ───────────────────────── */
const graph = {
  highlightChain: ['XX集团', '鼎信建设公司', '鼎信建设一公司', '二号车间维修工程'],
  nodes: [
    { id: 'XX集团', risk: 'center' },
    { id: '鼎信建设公司', risk: 'mid' },
    { id: '鼎信建设一公司', risk: 'high' },
    { id: '二号车间维修工程', risk: 'high' },
    { id: 'XX能源集团', risk: 'low' }, { id: 'XX科技公司', risk: 'low' },
    { id: 'XX材料公司', risk: 'mid' }, { id: 'XX物流公司', risk: 'low' },
    { id: 'XX监管公司', risk: 'low' }, { id: 'XX安装公司', risk: 'mid' },
    { id: 'XX环保公司', risk: 'low' }, { id: 'XX贸易公司', risk: 'mid' },
  ],
  links: [
    { source: 'XX集团', target: '鼎信建设公司' },
    { source: '鼎信建设公司', target: '鼎信建设一公司' },
    { source: '鼎信建设一公司', target: '二号车间维修工程' },
    { source: 'XX集团', target: 'XX能源集团' }, { source: 'XX集团', target: 'XX科技公司' },
    { source: 'XX集团', target: 'XX材料公司' }, { source: 'XX集团', target: 'XX物流公司' },
    { source: 'XX集团', target: 'XX监管公司' }, { source: 'XX集团', target: 'XX安装公司' },
    { source: 'XX集团', target: 'XX环保公司' }, { source: 'XX集团', target: 'XX贸易公司' },
  ],
}

const alert = {
  id: 'CG-2026012', level: '高风险', status: 'AI 研判中', type: '关联输送预警',
  time: '11:00', involved: 'XX工程部 / 鼎信建设一公司',
  amount: '¥40万', owner: '张伟（采购部）', deadline: '2026-05-28',
}

const report = {
  evidence: [
    { src: '工商关联', text: '共同实控人 王建国；持股链路 鼎信建设公司 65% → 鼎信建设一公司' },
    { src: '资金流向', text: '近 6 个月 鼎信建设一公司 → 个人账户 → 回流 鼎信建设公司 ¥120 万' },
    { src: '招投标行为', text: '两家投标文件由同一 IP、同一制单设备上传' },
  ],
  risk: '关联交易未披露 / 利益输送，命中“十不准”关联交易红线',
  project: '二号车间维修工程（合同号 HT-2026-0312，金额 ¥40 万）',
  doc: '采购单 CG-2026012｜经办：张伟（采购部）｜审批：李强｜验收单：缺失',
  reason: '金额虽小，但“共同实控人 + 资金回流 + 投标雷同”是典型利益输送模式，可复制到大额项目，须先阻断再查。',
  plans: [
    { key: 'A', title: '立即冻结 + 专项审查', effect: '阻断风险扩散，处置时长约 3 个工作日', recommended: true },
    { key: 'B', title: '先约谈核实再定', effect: '风险存续，处置时长约 7 个工作日' },
    { key: 'C', title: '列入观察名单暂不冻结', effect: '不阻断，仅持续监控' },
  ],
  basis: ['同类已查实案例 3 起', '该供应商风险评分 62（偏低）', '对应法规条款：关联交易须披露'],
}

const actions = [
  '冻结 CG-2026012 付款节点 + SRM 标记供应商为“待核查”',
  '生成《关联输送核查任务单》附完整证据链，派发纪检监察部',
  '向责任人张伟及主管推送整改通知，回执截止 2026-05-28，到期自动升级',
]
const actionReceipts = [
  '回执：付款节点已锁定，SRM 状态=待核查',
  '回执：任务单 RW-2026-0512 已派发 · 含 3 类证据',
  '回执：通知已送达 张伟 + 主管李强 · 到期自动升级',
]

/* ───────────────────────── 状态机 ───────────────────────── */
const step = ref(0)            // 0~7
const playing = ref(false)
let runToken = 0               // 用于重置时取消旧的播放循环

// 预警卡
const alertVisible = ref(false)
const alertTitle = ref('')     // 打字机标题

// 网络穿透：已点亮的红链节点数量
const litNodes = ref(0)
const dimOthers = ref(false)
const pulseOn = ref(false)     // 脉冲开关（外发光强弱交替）

// 研判报告
const reportTitle = ref('')    // 打字机标题
const evidenceShown = ref(0)
const showRisk = ref(false)
const showProject = ref(false)
const showDoc = ref(false)
const showReason = ref(false)
const showPlans = ref(false)
const basisOpen = ref(false)

// 决策与处置
const adopted = ref(false)
const actionStates = reactive([])   // 每条： 'pending' | 'loading' | 'done'
const allDone = ref(false)

/* ───────────────────────── 工具函数 ───────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 打字机：把 text 逐字写入 refObj
async function typeInto(refObj, text, token, ms = 60) {
  refObj.value = ''
  for (let i = 0; i < text.length; i++) {
    if (token !== runToken) return
    refObj.value += text[i]
    await sleep(ms)
  }
}

/* ───────────────────────── ECharts 网络图 ───────────────────────── */
const chartEl = ref(null)
let chart = null
let pulseTimer = null

const RISK_COLOR = {
  center: '#2563eb',
  high: '#C0392B',
  mid: '#E67E22',
  low: '#27AE60',
}

function isChainNode(id) {
  const idx = graph.highlightChain.indexOf(id)
  return idx !== -1 && idx < litNodes.value
}
function isChainLink(src, tgt) {
  // 链路第 i 段连接 chain[i] 与 chain[i+1]，当 litNodes > i+1 时点亮
  for (let i = 0; i < graph.highlightChain.length - 1; i++) {
    const a = graph.highlightChain[i]
    const b = graph.highlightChain[i + 1]
    if ((src === a && tgt === b) || (src === b && tgt === a)) {
      return litNodes.value > i + 1
    }
  }
  return false
}

function buildOption() {
  const glow = pulseOn.value ? 26 : 12
  const nodes = graph.nodes.map((n) => {
    const lit = isChainNode(n.id)
    const dim = dimOthers.value && !lit
    const baseColor = RISK_COLOR[n.risk] || '#64748b'
    const isCenter = n.risk === 'center'
    return {
      name: n.id,
      symbolSize: isCenter ? 56 : lit ? 42 : 30,
      itemStyle: {
        color: lit && !isCenter ? '#C0392B' : baseColor,
        borderColor: lit ? '#ff6b6b' : 'rgba(148,163,184,0.5)',
        borderWidth: lit ? 3 : 1,
        shadowColor: lit ? 'rgba(192,57,43,0.95)' : 'transparent',
        shadowBlur: lit ? glow : 0,
        opacity: dim ? 0.16 : 1,
      },
      label: {
        show: true,
        color: dim ? 'rgba(226,232,240,0.35)' : '#e8eefb',
        fontSize: isCenter ? 14 : 12,
        fontWeight: lit || isCenter ? 700 : 400,
      },
    }
  })

  const links = graph.links.map((l) => {
    const lit = isChainLink(l.source, l.target)
    const dim = dimOthers.value && !lit
    return {
      source: l.source,
      target: l.target,
      lineStyle: {
        color: lit ? '#C0392B' : 'rgba(120,140,170,0.45)',
        width: lit ? 4 : 1,
        opacity: dim ? 0.12 : lit ? 1 : 0.6,
        curveness: 0.08,
        shadowColor: lit ? 'rgba(192,57,43,0.8)' : 'transparent',
        shadowBlur: lit ? 10 : 0,
      },
    }
  })

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(14,33,56,0.95)',
      borderColor: 'rgba(99,179,237,0.4)',
      textStyle: { color: '#e8eefb', fontSize: 12 },
      formatter: (p) => (p.dataType === 'node' ? p.name : `${p.data.source} → ${p.data.target}`),
    },
    animationDuration: 500,
    animationEasingUpdate: 'cubicInOut',
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      force: { repulsion: 320, edgeLength: 110, gravity: 0.08, friction: 0.18 },
      data: nodes,
      links,
      lineStyle: { color: 'source' },
      emphasis: { focus: 'adjacency', scale: false },
    }],
  }
}

function refreshChart() {
  if (chart) chart.setOption(buildOption(), { notMerge: false, lazyUpdate: true })
}

/* ───────────────────────── 主播放循环 ───────────────────────── */
async function play() {
  if (playing.value) return
  resetState(false)            // 不重绘按钮态，仅清数据
  playing.value = true
  const token = ++runToken

  // step 1 —— AI 主动预警
  step.value = 1
  alertVisible.value = true
  await typeInto(alertTitle, 'AI 检测到关联输送风险', token, 55)
  if (token !== runToken) return
  await sleep(700)

  // step 2 —— 自动穿透关系网络（逐跳点亮）
  step.value = 2
  dimOthers.value = true
  refreshChart()
  for (let i = 1; i <= graph.highlightChain.length; i++) {
    if (token !== runToken) return
    litNodes.value = i
    refreshChart()
    await sleep(640)
  }
  await sleep(400)

  // step 3 —— 自动多源交叉取证
  step.value = 3
  await typeInto(reportTitle, 'AI 研判报告', token, 70)
  if (token !== runToken) return
  for (let i = 0; i < report.evidence.length; i++) {
    if (token !== runToken) return
    evidenceShown.value = i + 1
    await sleep(720)
  }

  // step 4 —— 自动定性 / 定位
  step.value = 4
  showRisk.value = true; await sleep(620); if (token !== runToken) return
  showProject.value = true; await sleep(620); if (token !== runToken) return
  showDoc.value = true; await sleep(620); if (token !== runToken) return

  // step 5 —— 自动给出处置建议
  step.value = 5
  showReason.value = true
  await sleep(500); if (token !== runToken) return
  showPlans.value = true
  await sleep(800); if (token !== runToken) return

  // step 6 —— 等待人决策（唯一人工交互）
  step.value = 6
  playing.value = false
}

// step 7 —— 采纳后 AI 自动实施（唯一人工触发点）
async function adoptPlanA() {
  if (adopted.value || step.value !== 6) return
  adopted.value = true
  step.value = 7
  const token = runToken
  actionStates.splice(0, actionStates.length, ...actions.map(() => 'pending'))
  for (let i = 0; i < actions.length; i++) {
    if (token !== runToken) return
    actionStates[i] = 'loading'
    await sleep(850)
    if (token !== runToken) return
    actionStates[i] = 'done'
    await sleep(350)
  }
  await sleep(300)
  if (token !== runToken) return
  allDone.value = true
}

/* ───────────────────────── 重置 ───────────────────────── */
function resetState(toStepZero = true) {
  runToken++                   // 取消所有进行中的 await 循环
  playing.value = false
  alertTitle.value = ''
  reportTitle.value = ''
  litNodes.value = 0
  dimOthers.value = false
  evidenceShown.value = 0
  showRisk.value = false
  showProject.value = false
  showDoc.value = false
  showReason.value = false
  showPlans.value = false
  basisOpen.value = false
  adopted.value = false
  allDone.value = false
  actionStates.splice(0, actionStates.length)
  if (toStepZero) {
    step.value = 0
    alertVisible.value = false
  }
  refreshChart()
}

function onReset() {
  resetState(true)
}

/* ───────────────────────── 生命周期 ───────────────────────── */
function handleResize() { if (chart) chart.resize() }

onMounted(() => {
  chart = echarts.init(chartEl.value)
  chart.setOption(buildOption())
  window.addEventListener('resize', handleResize)
  // 脉冲：让已点亮节点的外发光强弱交替
  pulseTimer = setInterval(() => {
    if (litNodes.value > 0) {
      pulseOn.value = !pulseOn.value
      refreshChart()
    }
  }, 650)
})

onBeforeUnmount(() => {
  runToken++
  window.removeEventListener('resize', handleResize)
  if (pulseTimer) clearInterval(pulseTimer)
  if (chart) { chart.dispose(); chart = null }
})
</script>

<template>
  <div class="story-sat">
    <!-- 顶部工具条 -->
    <header class="sat-top">
      <div class="sat-brand">
        <span class="sat-dot" />
        采购智能穿透监管平台 · <em>故事线一：关联输送</em>
      </div>
      <div class="sat-tagline">AI 自动跑完整条调查，人只拍一次板</div>
      <div class="sat-ctrls">
        <button class="btn btn-play" :disabled="playing && step < 6" @click="play">
          ▶ 开始演示
        </button>
        <button class="btn btn-reset" @click="onReset">↻ 重置</button>
      </div>
    </header>

    <!-- 单屏：左网络图 + 右研判面板 -->
    <div class="sat-body">
      <!-- 左：穿透网络图 -->
      <section class="sat-left">
        <div class="panel-hd">
          <span>采购主体穿透网络</span>
          <span class="hd-legend">
            <i class="lg lg-center" />集团核心
            <i class="lg lg-high" />高风险
            <i class="lg lg-mid" />中风险
            <i class="lg lg-low" />低风险
          </span>
        </div>
        <div ref="chartEl" class="sat-chart" />
        <transition name="fade">
          <div v-if="step >= 2 && litNodes >= graph.highlightChain.length" class="chain-tip">
            🔴 已自动穿透 {{ graph.highlightChain.length }} 层关联：
            {{ graph.highlightChain.join(' → ') }}
          </div>
        </transition>
      </section>

      <!-- 右：AI 研判报告面板 -->
      <section class="sat-right">
        <div class="report-scroll">
          <!-- 空态 -->
          <div v-if="step < 3" class="report-empty">
            <div class="re-ico">🧠</div>
            <p v-if="step === 0">点击「开始演示」，AI 将自动发起穿透调查</p>
            <p v-else-if="step === 1">AI 已捕获预警，正在锁定关联主体…</p>
            <p v-else>正在沿股权 / 资金 / 投标链路自动穿透…</p>
          </div>

          <template v-else>
            <h3 class="report-title">
              {{ reportTitle }}<span v-if="reportTitle.length < 'AI 研判报告'.length" class="caret" />
            </h3>

            <!-- 三源交叉取证 -->
            <div class="rsec-label">三源交叉取证</div>
            <transition-group name="rise" tag="div" class="ev-list">
              <div
                v-for="(ev, i) in report.evidence"
                v-show="i < evidenceShown"
                :key="ev.src"
                class="ev-card"
              >
                <div class="ev-top">
                  <span class="ev-src">{{ ev.src }}</span>
                  <span class="ev-ok">✓ 已交叉验证</span>
                </div>
                <div class="ev-text">{{ ev.text }}</div>
              </div>
            </transition-group>

            <!-- 定性 / 定位 -->
            <transition name="rise">
              <div v-if="showRisk" class="block block-risk">
                <span class="blk-tag">风险定性</span>
                <span class="blk-body">{{ report.risk }}</span>
              </div>
            </transition>
            <transition name="rise">
              <div v-if="showProject" class="block">
                <span class="blk-tag">涉及项目</span>
                <span class="blk-body">{{ report.project }}</span>
              </div>
            </transition>
            <transition name="rise">
              <div v-if="showDoc" class="block">
                <span class="blk-tag">单据 / 责任人</span>
                <span class="blk-body">
                  采购单 CG-2026012｜经办：张伟（采购部）｜审批：李强｜<b class="miss">验收单：缺失</b>
                </span>
              </div>
            </transition>

            <!-- 处置建议 -->
            <transition name="rise">
              <div v-if="showReason" class="block block-reason">
                <span class="blk-tag">研判理由</span>
                <span class="blk-body">{{ report.reason }}</span>
              </div>
            </transition>

            <transition name="rise">
              <div v-if="showPlans" class="plans">
                <div class="rsec-label">AI 处置建议</div>
                <div
                  v-for="p in report.plans"
                  :key="p.key"
                  class="plan-card"
                  :class="{ rec: p.recommended }"
                >
                  <div class="plan-hd">
                    <span class="plan-key">方案 {{ p.key }}</span>
                    <span class="plan-title">{{ p.title }}</span>
                    <span v-if="p.recommended" class="plan-badge">AI 推荐</span>
                  </div>
                  <div class="plan-effect">{{ p.effect }}</div>

                  <!-- 仅 A 卡、step6 时呈现呼吸采纳按钮 -->
                  <button
                    v-if="p.recommended"
                    class="btn-adopt"
                    :class="{ breathing: step === 6 && !adopted, done: adopted }"
                    :disabled="step !== 6 || adopted"
                    @click="adoptPlanA"
                  >
                    {{ adopted ? '✓ 已采纳方案 A' : '采纳此方案' }}
                  </button>
                </div>

                <!-- 折叠依据 -->
                <div class="basis">
                  <button class="basis-toggle" @click="basisOpen = !basisOpen">
                    {{ basisOpen ? '▾' : '▸' }} 查看研判依据
                  </button>
                  <transition name="rise">
                    <ul v-if="basisOpen" class="basis-list">
                      <li v-for="b in report.basis" :key="b">{{ b }}</li>
                    </ul>
                  </transition>
                </div>
              </div>
            </transition>

            <!-- AI 自动实施 -->
            <transition name="rise">
              <div v-if="step === 7" class="exec">
                <div class="rsec-label">AI 自动实施处置</div>
                <div
                  v-for="(a, i) in actions"
                  :key="i"
                  class="exec-row"
                  :class="actionStates[i]"
                >
                  <span class="exec-ico">
                    <span v-if="actionStates[i] === 'loading'" class="spin" />
                    <span v-else-if="actionStates[i] === 'done'">✓</span>
                    <span v-else class="dot-wait" />
                  </span>
                  <div class="exec-main">
                    <div class="exec-text">{{ a }}</div>
                    <transition name="fade">
                      <div v-if="actionStates[i] === 'done'" class="exec-receipt">
                        {{ actionReceipts[i] }}
                      </div>
                    </transition>
                  </div>
                </div>

                <transition name="rise">
                  <div v-if="allDone" class="exec-done">
                    ✓ 处置完成 · 风险已阻断，进入闭环跟踪
                  </div>
                </transition>
              </div>
            </transition>
          </template>
        </div>
      </section>
    </div>

    <!-- 右上角：实时风险预警卡（浮层） -->
    <transition name="slide-in">
      <div v-if="alertVisible" class="alert-card">
        <div class="ac-bar">
          <span class="ac-level">{{ alert.level }}</span>
          <span class="ac-type">{{ alert.type }}</span>
          <span class="ac-status">{{ alert.status }}</span>
        </div>
        <div class="ac-title">
          {{ alertTitle }}<span v-if="alertTitle.length < 'AI 检测到关联输送风险'.length" class="caret" />
        </div>
        <div class="ac-grid">
          <div><label>预警编号</label><b>{{ alert.id }}</b></div>
          <div><label>预警时间</label><b>{{ alert.time }}</b></div>
          <div class="span2"><label>涉及主体</label><b>{{ alert.involved }}</b></div>
          <div><label>涉及金额</label><b class="amt">{{ alert.amount }}</b></div>
          <div><label>责任人</label><b>{{ alert.owner }}</b></div>
          <div class="span2"><label>回执截止</label><b>{{ alert.deadline }}</b></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.story-sat {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 640px;
  padding: 14px;
  box-sizing: border-box;
  background:
    radial-gradient(1200px 600px at 18% -10%, rgba(37, 99, 235, 0.18), transparent 60%),
    linear-gradient(160deg, #0b1b30 0%, #0e2138 55%, #0a1626 100%);
  color: #e8eefb;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  border-radius: 14px;
  overflow: hidden;
}

/* 顶部 */
.sat-top {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  margin-bottom: 12px;
}
.sat-brand { font-size: 16px; font-weight: 700; letter-spacing: .3px; }
.sat-brand em { color: #63b3ed; font-style: normal; }
.sat-dot {
  display: inline-block; width: 9px; height: 9px; border-radius: 50%;
  margin-right: 8px; background: #27AE60; box-shadow: 0 0 10px #27AE60;
}
.sat-tagline {
  font-size: 12.5px; color: #9fb3d1; padding: 3px 12px;
  border: 1px solid rgba(99, 179, 237, 0.25); border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
}
.sat-ctrls { margin-left: auto; display: flex; gap: 10px; }
.btn {
  cursor: pointer; border: none; border-radius: 8px; padding: 8px 16px;
  font-size: 13.5px; font-weight: 600; transition: all .18s; color: #fff;
}
.btn-play { background: linear-gradient(135deg, #2563eb, #1d4ed8); box-shadow: 0 4px 14px rgba(37, 99, 235, .4); }
.btn-play:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37, 99, 235, .55); }
.btn-play:disabled { opacity: .45; cursor: not-allowed; }
.btn-reset { background: rgba(148, 163, 184, .18); border: 1px solid rgba(148, 163, 184, .35); }
.btn-reset:hover { background: rgba(148, 163, 184, .3); }

/* 主体 */
.sat-body { flex: 1; display: flex; gap: 14px; min-height: 0; }
.sat-left { flex: 0 0 60%; display: flex; flex-direction: column; min-width: 0; }
.sat-right { flex: 1; min-width: 0; display: flex; }

.panel-hd, .report-scroll, .sat-left {
  background: rgba(14, 33, 56, .55);
  border: 1px solid rgba(99, 179, 237, .18);
  border-radius: 12px;
}
.sat-left { padding: 0; position: relative; overflow: hidden; }
.panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border: none; border-bottom: 1px solid rgba(99, 179, 237, .15);
  background: transparent; font-size: 14px; font-weight: 600; border-radius: 0;
}
.hd-legend { font-size: 11.5px; color: #9fb3d1; font-weight: 400; }
.lg { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin: 0 4px 0 10px; vertical-align: middle; }
.lg-center { background: #2563eb; }
.lg-high { background: #C0392B; }
.lg-mid { background: #E67E22; }
.lg-low { background: #27AE60; }
.sat-chart { flex: 1; width: 100%; min-height: 0; }
.chain-tip {
  position: absolute; left: 14px; right: 14px; bottom: 14px;
  padding: 8px 14px; font-size: 12.5px; color: #ffd9d4;
  background: rgba(192, 57, 43, .22); border: 1px solid rgba(192, 57, 43, .5);
  border-radius: 8px; backdrop-filter: blur(2px);
}

/* 右侧报告面板 */
.sat-right { border: none; }
.report-scroll {
  flex: 1; padding: 16px 16px 24px; overflow-y: auto;
  background: rgba(14, 33, 56, .55);
}
.report-scroll::-webkit-scrollbar { width: 7px; }
.report-scroll::-webkit-scrollbar-thumb { background: rgba(99, 179, 237, .3); border-radius: 4px; }

.report-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #7d93b3; text-align: center; gap: 12px; }
.re-ico { font-size: 42px; opacity: .7; }

.report-title { font-size: 18px; font-weight: 800; margin: 0 0 14px; color: #cfe2ff; letter-spacing: .5px; }
.caret { display: inline-block; width: 8px; height: 1.05em; vertical-align: -2px; margin-left: 2px; background: #63b3ed; animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }

.rsec-label { font-size: 12px; font-weight: 700; color: #63b3ed; margin: 14px 0 8px; padding-left: 9px; border-left: 3px solid #2563eb; }
.rsec-label:first-child { margin-top: 0; }

.ev-list { display: flex; flex-direction: column; gap: 8px; }
.ev-card { background: rgba(255, 255, 255, .04); border: 1px solid rgba(99, 179, 237, .18); border-radius: 10px; padding: 10px 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, .2); }
.ev-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
.ev-src { font-size: 12.5px; font-weight: 700; color: #e8eefb; padding: 2px 9px; background: rgba(37, 99, 235, .25); border-radius: 6px; }
.ev-ok { font-size: 11.5px; color: #34d399; font-weight: 600; }
.ev-text { font-size: 12.8px; line-height: 1.65; color: #c4d3ec; }

.block { margin-top: 8px; padding: 10px 12px; background: rgba(255, 255, 255, .035); border: 1px solid rgba(99, 179, 237, .15); border-radius: 10px; display: flex; gap: 10px; align-items: flex-start; }
.block-risk { border-color: rgba(192, 57, 43, .55); background: rgba(192, 57, 43, .12); }
.block-reason { border-color: rgba(230, 126, 34, .45); background: rgba(230, 126, 34, .1); }
.blk-tag { flex-shrink: 0; font-size: 11.5px; font-weight: 700; color: #9fb3d1; padding: 2px 8px; background: rgba(148, 163, 184, .15); border-radius: 6px; }
.blk-body { font-size: 12.8px; line-height: 1.6; color: #dbe6f7; }
.miss { color: #ff7a6b; font-weight: 700; }

/* 方案 */
.plans { margin-top: 6px; }
.plan-card { margin-top: 8px; padding: 11px 13px; border-radius: 11px; border: 1px solid rgba(148, 163, 184, .25); background: rgba(255, 255, 255, .03); }
.plan-card.rec { border: 1.5px solid #34d399; background: rgba(39, 174, 96, .12); box-shadow: 0 0 0 1px rgba(52, 211, 153, .2), 0 4px 16px rgba(39, 174, 96, .2); }
.plan-hd { display: flex; align-items: center; gap: 8px; }
.plan-key { font-size: 12px; font-weight: 700; color: #9fb3d1; }
.plan-title { font-size: 13.5px; font-weight: 700; color: #fff; }
.plan-badge { margin-left: auto; font-size: 10.5px; font-weight: 700; color: #052e1a; background: linear-gradient(135deg, #34d399, #10b981); padding: 2px 8px; border-radius: 6px; }
.plan-effect { font-size: 12.3px; color: #b9c8e2; margin-top: 6px; line-height: 1.55; }
.btn-adopt { margin-top: 10px; width: 100%; padding: 9px; border: none; border-radius: 8px; font-size: 13.5px; font-weight: 700; color: #fff; cursor: pointer; background: linear-gradient(135deg, #27AE60, #1f9e54); transition: all .18s; }
.btn-adopt:disabled { cursor: default; }
.btn-adopt.done { background: rgba(39, 174, 96, .25); color: #6ee7b7; border: 1px solid rgba(52, 211, 153, .5); }
.btn-adopt.breathing { animation: breathe 1.4s ease-in-out infinite; }
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, .6); transform: scale(1); }
  50% { box-shadow: 0 0 0 8px rgba(52, 211, 153, 0); transform: scale(1.02); }
}

/* 依据折叠 */
.basis { margin-top: 12px; }
.basis-toggle { background: none; border: none; color: #63b3ed; font-size: 12.5px; cursor: pointer; padding: 0; }
.basis-list { margin: 8px 0 0; padding-left: 18px; font-size: 12.3px; line-height: 1.9; color: #b9c8e2; }

/* 实施 */
.exec { margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(99, 179, 237, .25); }
.exec-row { display: flex; gap: 10px; padding: 9px 11px; margin-top: 8px; border-radius: 10px; background: rgba(255, 255, 255, .03); border: 1px solid rgba(148, 163, 184, .18); transition: all .25s; }
.exec-row.done { border-color: rgba(52, 211, 153, .45); background: rgba(39, 174, 96, .1); }
.exec-row.loading { border-color: rgba(99, 179, 237, .45); }
.exec-ico { flex-shrink: 0; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #34d399; }
.dot-wait { width: 8px; height: 8px; border-radius: 50%; background: rgba(148, 163, 184, .5); }
.spin { width: 16px; height: 16px; border: 2px solid rgba(99, 179, 237, .3); border-top-color: #63b3ed; border-radius: 50%; animation: rot .7s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }
.exec-main { flex: 1; min-width: 0; }
.exec-text { font-size: 12.8px; line-height: 1.55; color: #dbe6f7; }
.exec-receipt { margin-top: 5px; font-size: 11.8px; color: #6ee7b7; }
.exec-done { margin-top: 14px; padding: 12px; text-align: center; font-size: 14px; font-weight: 700; color: #6ee7b7; background: rgba(39, 174, 96, .15); border: 1px solid rgba(52, 211, 153, .5); border-radius: 10px; }

/* 预警浮层 */
.alert-card {
  position: absolute; top: 64px; right: 18px; width: 320px; z-index: 30;
  background: linear-gradient(160deg, rgba(34, 18, 22, .96), rgba(20, 14, 18, .96));
  border: 1px solid rgba(192, 57, 43, .6); border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .5), 0 0 0 1px rgba(192, 57, 43, .2);
  padding: 14px; backdrop-filter: blur(6px);
}
.ac-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.ac-level { font-size: 11.5px; font-weight: 700; color: #fff; background: #C0392B; padding: 2px 9px; border-radius: 6px; box-shadow: 0 0 12px rgba(192, 57, 43, .7); }
.ac-type { font-size: 12.5px; font-weight: 600; color: #ffd9d4; }
.ac-status { margin-left: auto; font-size: 11px; color: #ffb4ab; }
.ac-status::before { content: '●'; margin-right: 4px; animation: blink 1.1s infinite; }
.ac-title { font-size: 14.5px; font-weight: 800; color: #fff; margin-bottom: 11px; min-height: 1.2em; }
.ac-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
.ac-grid > div { display: flex; flex-direction: column; gap: 2px; }
.ac-grid .span2 { grid-column: 1 / -1; }
.ac-grid label { font-size: 10.5px; color: #b08a8a; }
.ac-grid b { font-size: 12.5px; color: #f0e3e3; font-weight: 600; }
.ac-grid .amt { color: #ff8a7a; }

/* 过渡 */
.fade-enter-active, .fade-leave-active { transition: opacity .4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.rise-enter-active { transition: all .45s cubic-bezier(.2, .7, .3, 1); }
.rise-enter-from { opacity: 0; transform: translateY(8px); }
.slide-in-enter-active { transition: all .5s cubic-bezier(.2, .8, .25, 1); }
.slide-in-enter-from { opacity: 0; transform: translateX(60px); }
.slide-in-leave-active { transition: all .3s; }
.slide-in-leave-to { opacity: 0; transform: translateX(40px); }
</style>
