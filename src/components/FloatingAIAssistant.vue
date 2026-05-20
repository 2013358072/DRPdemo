<template>
  <div class="qa-float-shell">
    <button
      type="button"
      class="qa-trigger"
      :class="{ active: isOpen && !isMinimized }"
      aria-label="打开智能数智问答"
      title="智能数智问答"
      @click="togglePanel"
    >
      <span class="qa-trigger-pulse"></span>
      <span class="qa-trigger-ring"></span>
      <span class="qa-trigger-core">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path
            d="M7 16.5c-2.2-1.2-3.5-3.2-3.5-5.5C3.5 7.1 7.3 4 12 4s8.5 3.1 8.5 7c0 3.9-3.8 7-8.5 7a11 11 0 0 1-3.5-.6L5 20z"
            stroke-linejoin="round"
          />
          <path d="M8.5 11.2h7M8.5 8.4h5M8.5 14h4" stroke-linecap="round" />
        </svg>
      </span>
    </button>

    <transition name="qa-panel">
      <section v-if="isOpen && !isMinimized" class="qa-panel">
        <div class="qa-panel-head">
          <div>
            <div class="qa-panel-title">智能数智问答</div>
            <div class="qa-panel-sub">已联动 {{ sceneContext.title }}</div>
          </div>
          <div class="qa-panel-actions">
            <button type="button" class="qa-icon-btn" title="最小化" @click="minimizePanel">
              <span></span>
            </button>
            <button type="button" class="qa-icon-btn close" title="关闭" @click="closePanel">
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div class="qa-context-card">
          <div class="qa-context-kicker">当前场景</div>
          <div class="qa-context-title">{{ sceneContext.title }}</div>
          <div class="qa-context-metrics">
            <span v-for="metric in sceneContext.metrics.slice(0, 3)" :key="metric">{{ metric }}</span>
          </div>
        </div>

        <div ref="messageListRef" class="qa-message-list micro-scroll">
          <div
            v-for="message in messages"
            :key="message.id"
            class="qa-message-row"
            :class="message.role"
          >
            <div v-if="message.role === 'user'" class="qa-user-bubble">
              {{ message.content }}
            </div>

            <div v-else class="qa-ai-card">
              <div class="qa-ai-meta">
                <span class="qa-ai-tag">解析意图</span>
                <strong>{{ message.intent }}</strong>
              </div>
              <div class="qa-ai-answer">{{ message.answer }}</div>

              <div class="qa-ai-grid">
                <div class="qa-ai-block">
                  <div class="qa-ai-block-title">调用数据</div>
                  <div class="qa-chip-list">
                    <span v-for="source in message.sources" :key="source" class="qa-chip">{{ source }}</span>
                  </div>
                </div>
                <div class="qa-ai-block">
                  <div class="qa-ai-block-title">计算逻辑</div>
                  <p>{{ message.logic }}</p>
                </div>
              </div>

              <div v-if="message.action" class="qa-action-row">
                <button
                  type="button"
                  class="qa-action-btn"
                  @click="handleMessageAction(message.action)"
                >
                  {{ message.action.label }}
                </button>
              </div>

              <div v-if="message.followUps?.length" class="qa-follow-list">
                <button
                  v-for="item in message.followUps"
                  :key="item"
                  type="button"
                  class="qa-follow-btn"
                  @click="useSuggestion(item)"
                >
                  {{ item }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="qa-suggest-bar">
          <button
            v-for="item in visibleSuggestions"
            :key="item"
            type="button"
            class="qa-suggest-chip"
            @click="pickSuggestion(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="qa-input-wrap">
          <textarea
            v-model="draft"
            class="qa-input"
            rows="2"
            placeholder="请输入问题，如：新能源板块ROI、查看关联关系、投资偏差原因、东南亚某国路桥PPP详情、陇东风电基地二期关联"
            @keydown.enter.exact.prevent="sendPrompt()"
          ></textarea>
          <button type="button" class="qa-send-btn" :disabled="!draft.trim()" @click="sendPrompt()">
            发送
          </button>
        </div>
      </section>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  KPI,
  SECTORS,
  RISK_SAMPLES,
  INVESTMENT_PROJECTS,
  INVESTMENT_PROJECT_PROFILES,
  DRP_FUNDS_OVERVIEW,
  DRP_PAYMENT_ORDER,
  DRP_FUNDS_INTERCEPT_RULES,
  CONTRACT_COMMAND_CENTER,
  DRP_PROCUREMENT_OVERVIEW,
  DRP_PROCUREMENT_PROJECT,
} from '@/mock/index.js'

const props = defineProps({
  scene: {
    type: String,
    default: 'dashboard',
  },
})
const emit = defineEmits(['action'])

const STORAGE_KEY = 'drp-floating-ai-history'

const isOpen = ref(false)
const isMinimized = ref(false)
const draft = ref('')
const messageListRef = ref(null)
const messages = ref(loadHistory())
const DEFAULT_QUESTIONS = ['新能源板块ROI', '查看关联关系', '投资偏差原因']
const INVESTMENT_QUESTIONS = ['新能源板块ROI', '查看关联关系', '投资偏差原因', '东南亚某国路桥PPP详情', '陇东风电基地二期关联']

const sceneLabels = {
  dashboard: '首页大屏',
  invest: '投资穿透',
  finance: '资金穿透',
  equity: '合同穿透',
  overseas: '采购穿透',
  ai: 'AI 智能体',
}

const sceneContext = computed(() => getSceneContext(props.scene))
const visibleSuggestions = computed(() => getSuggestions(props.scene))

function loadHistory() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory() {
  try {
    const recent = messages.value.slice(-12)
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
  } catch {
    // ignore storage failures in demo mode
  }
}

function ensureWelcomeMessage() {
  if (messages.value.length) return
  messages.value.push(buildWelcomeMessage(props.scene))
}

function buildWelcomeMessage(scene) {
  const context = getSceneContext(scene)
  const suggestions = getSuggestions(scene)
  return {
    id: `ai-${Date.now()}`,
    role: 'assistant',
    intent: '场景联动初始化',
    answer: `当前已接入 ${context.title} 的指标和图表数据。你可以直接点击或输入这些固定问题：${suggestions.join('、')}。`,
    sources: context.sources.slice(0, 4),
    logic: `系统会优先匹配当前页面场景、指标摘要、图表主题和演示数据，再按问题关键词生成回答。当前重点图表包括：${context.charts.join('、')}。`,
    followUps: suggestions,
  }
}

function togglePanel() {
  if (!isOpen.value) {
    isOpen.value = true
    isMinimized.value = false
    ensureWelcomeMessage()
    scrollToBottom()
    return
  }
  if (isMinimized.value) {
    isMinimized.value = false
    scrollToBottom()
    return
  }
  isMinimized.value = true
}

function closePanel() {
  isOpen.value = false
  isMinimized.value = false
}

function minimizePanel() {
  isMinimized.value = true
}

function pickSuggestion(text) {
  draft.value = text
}

function sendPrompt(customText) {
  const content = (customText || draft.value).trim()
  if (!content) return

  ensureWelcomeMessage()

  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content,
  })

  messages.value.push(buildAssistantReply(content, props.scene))
  draft.value = ''
  isOpen.value = true
  isMinimized.value = false
  scrollToBottom()
}

function handleMessageAction(action) {
  emit('action', action)
}

function buildAssistantReply(question, scene) {
  const context = getSceneContext(scene)
  const text = question.toLowerCase()
  const compactText = question.replace(/\s+/g, '').toLowerCase()

  let intent = '综合指标问答'
  let answer = `当前场景为 ${context.title}。页面正在展示 ${context.charts.join('、')} 等图表，可直接联动的核心指标包括：${context.metrics.slice(0, 3).join('，')}。`
  let logic = `先识别问题关键词，再映射到 ${context.title} 的演示数据集和图表摘要，最后按当前场景输出解释与建议。`
  let sources = [...context.sources.slice(0, 4)]
  let followUps = [...getSuggestions(scene)]
  let action = null

  if (question === '新能源板块ROI' || text.includes('roi') || question.includes('回报')) {
    intent = '投资回报测算'
    const sector = SECTORS.find((item) => item.name.includes('电力能源'))
    const newEnergyProjects = INVESTMENT_PROJECTS.filter((item) => ['P02', 'P06'].includes(item.id))
    const actualYi = sumBy(newEnergyProjects, 'actualYi')
    const roi = actualYi ? (((sector.revenueYi - actualYi) / actualYi) * 100).toFixed(1) : '0.0'
    answer = `按当前演示口径，新能源所在的电力能源板块收入 ${sector.revenueYi} 亿元，对应重点投资项目实际支出约 ${formatNumber(actualYi)} 亿元，粗算 ROI 约为 ${roi}%。其中高风险项目是陇东风电基地二期，已出现超预算 12% 与关联交易占比 32.1% 的双重偏差，因此该 ROI 只能作为页面快照观察值，正式口径仍建议按项目现金流折现复核。`
    logic = '以电力能源板块收入作为收益端，以当前页面投资项目实际支出作为投入端做演示口径测算，同时叠加 P06 的风险因子进行结果修正提示。'
    sources = ['SECTORS.revenueYi', 'INVESTMENT_PROJECTS.actualYi', 'INVESTMENT_PROJECT_PROFILES.P06']
  } else if (question === '查看关联关系' || question.includes('关联')) {
    intent = '关联关系穿透分析'
    const focus = INVESTMENT_PROJECT_PROFILES.P06
    answer = `当前最值得关注的是陇东风电基地二期。页面图谱显示 EPC 承包商、设备代理商与子公司少数股东存在交叉持股和一致行动关系，关联交易金额 ${formatNumber(focus.relatedTradeAmountYi)} 亿元，占项目累计支出 ${formatPercent(focus.relatedTradeRatio)}。如果你在采购场景提问，对应的高风险标段是 CG-2026-0501，围标概率 95%，同 IP、同 MAC 和报价等差特征同时命中。`
    logic = '优先读取当前页面的知识图谱/风险图表摘要；若问题未限定场景，则联动投资图谱和采购关系图中的高风险默认案例输出。'
    sources = ['INVESTMENT_PROJECT_PROFILES.P06.hiddenRelationNote', 'DRP_PROCUREMENT_PROJECT.CG-2026-0501', 'RISK_SAMPLES.R11']
  } else if (question === '投资偏差原因' || question.includes('偏差原因')) {
    intent = '投资偏差原因分析'
    const focus = INVESTMENT_PROJECT_PROFILES.P06
    const delayedMilestones = focus.milestones.filter((item) => item.status === 'delay').map((item) => item.name).join('、')
    answer = `当前投资偏差主要来自陇东风电基地二期。页面数据显示该项目累计超预算 ${formatPercent(focus.overBudgetRate)}，核心原因是 ${focus.causeAnalysis}。同时 ${delayedMilestones} 两个关键节点已发生延期，说明偏差不仅体现在造价上，也传导到了进度执行。`
    logic = '优先锁定默认高风险项目 P06，再结合项目画像中的 causeAnalysis、超预算比例和延期里程碑，输出固定原因解释。'
    sources = ['INVESTMENT_PROJECT_PROFILES.P06.causeAnalysis', 'INVESTMENT_PROJECT_PROFILES.P06.overBudgetRate', 'INVESTMENT_PROJECT_PROFILES.P06.milestones']
  } else if (question === '东南亚某国路桥PPP详情' || compactText.includes('东南亚某国路桥ppp详情')) {
    intent = '境外 PPP 项目穿透分析'
    const project = INVESTMENT_PROJECTS.find((item) => item.id === 'P01')
    const profile = INVESTMENT_PROJECT_PROFILES.P01
    answer = `东南亚某国路桥 PPP 当前累计投资 ${formatNumber(project?.actualYi)} 亿元，较批复预算 ${formatNumber(project?.budgetYi)} 亿元超支 ${formatPercent(profile.overBudgetRate)}，项目整体进度 ${profile.progress}%。AI 判断本次偏差并非单一材料涨价，而是设计变更频繁、境外分包重议价、EPC 合同签署延后共同叠加，造成成本与工期同步偏离。与此同时，关联交易金额已达 ${formatNumber(profile.relatedTradeAmountYi)} 亿元，占累计支出 ${formatPercent(profile.relatedTradeRatio)}，当地分包 A 与高管亲属企业存在同一控制关系，说明该项目同时存在造价失控和治理穿透不足两类风险，建议优先核验签证、分包定价与资金拆借链路。`
    logic = '锁定投资穿透场景的 P01 项目，综合读取预算执行、里程碑延期、关联交易占比和隐蔽关系说明，输出固定穿透分析结果。'
    sources = ['INVESTMENT_PROJECTS.P01', 'INVESTMENT_PROJECT_PROFILES.P01.overBudgetRate', 'INVESTMENT_PROJECT_PROFILES.P01.hiddenRelationNote']
    followUps = ['查看关联关系', '投资偏差原因', '生成风险报告']
    action = {
      type: 'open-invest-project',
      label: '查看详情',
      scene: 'invest',
      projectId: 'P01',
    }
  } else if (question === '陇东风电基地二期关联' || compactText.includes('陇东风电基地二期关联')) {
    intent = '关联关系定向穿透'
    const project = INVESTMENT_PROJECTS.find((item) => item.id === 'P06')
    const profile = INVESTMENT_PROJECT_PROFILES.P06
    answer = `陇东风电基地二期当前最核心的关联风险，集中在 EPC 承包商、设备代理商与子公司少数股东之间的隐蔽关系链。页面画像显示，关联交易金额 ${formatNumber(profile.relatedTradeAmountYi)} 亿元，占累计支出 ${formatPercent(profile.relatedTradeRatio)}，且存在交叉持股、一致行动与资金拆借三类特征同时命中。结合该项目超预算 ${formatPercent(profile.overBudgetRate)} 与关键节点延期情况，AI 判断这不是单纯执行偏差，更可能是关联方协同导致的造价抬升与流程失真，建议立即复核股权路径、分包定价和付款审批链路。`
    logic = '直接锁定投资穿透默认高风险项目 P06，读取关联交易金额、占比、隐蔽关系说明和超预算结果，输出固定关联穿透结论。'
    sources = ['INVESTMENT_PROJECTS.P06', 'INVESTMENT_PROJECT_PROFILES.P06.relatedTradeRatio', 'INVESTMENT_PROJECT_PROFILES.P06.hiddenRelationNote']
    followUps = ['查看关联关系', '投资偏差原因', '生成风险报告']
    action = {
      type: 'open-invest-project',
      label: '查看关联看板',
      scene: 'invest',
      projectId: 'P06',
    }
  } else if (question.includes('风险') && question.includes('报告')) {
    intent = '风险分析报告生成'
    answer = `${context.title}风险报告已生成。摘要如下：${context.summary}。建议优先处理 ${context.priority}，同步核验 ${context.actions.join('、')}。如需更细，我可以继续展开为“指标摘要 + 风险判定 + 工单建议”的完整报告格式。`
    logic = '基于当前场景的 KPI、默认高风险对象和页面主图表做压缩摘要，再输出优先级与处理建议。'
    sources = [...context.sources.slice(0, 5)]
    followUps = ['查看关联关系', '查看拦截规则', '高风险合同分析']
  } else if (question.includes('合同') || question.includes('法务')) {
    intent = '合同履约与法务检查'
    const contract = CONTRACT_COMMAND_CENTER.contracts[0]
    answer = `当前合同场景默认聚焦 ${contract.id} ${contract.name}。页面数据表明该合同金额 ${formatNumber(contract.amountYi)} 亿元，状态为${contract.status}，已出现 ${contract.abnormal.join('、')} 等异常，付款进度 ${contract.paymentProgress}% 明显快于交付进度 ${contract.deliveryProgress}%。如果你是从资金场景发问，异常支付单 PO-2026-0418-017 还存在“无合同、非白名单、无法务审批”三项叠加风险。`
    logic = '优先读取合同中台默认合同，再与资金页面的异常支付单做交叉核验，判断合同完备性和付款偏差。'
    sources = ['CONTRACT_COMMAND_CENTER.defaultContractId', 'CONTRACT_COMMAND_CENTER.contracts', 'DRP_PAYMENT_ORDER.PO-2026-0418-017']
    followUps = ['高风险合同分析', '查看履约偏差', '生成风险报告']
  } else if (question.includes('支付') || question.includes('资金') || question.includes('拦截')) {
    intent = '资金异常识别'
    const abnormal = DRP_PAYMENT_ORDER.find((item) => item.id === 'PO-2026-0418-017') || DRP_PAYMENT_ORDER[0]
    answer = `当前资金穿透场景里，最关键的异常单据是 ${abnormal.id}，付款金额 ${formatNumber(abnormal.amountYi)} 亿元，收款方为非白名单，且未匹配有效合同编号。系统已命中 ${DRP_FUNDS_INTERCEPT_RULES.join('、')} 四条规则中的多项，因此建议直接进入拦截复核，并联动核查项目 ${abnormal.projectId || '未关联项目'} 的合同与审批流。`
    logic = '从资金总览 KPI 中先锁定异常支付，再读取默认单据的白名单、合同、审批和拦截规则信息，输出异常原因与建议动作。'
    sources = ['DRP_FUNDS_OVERVIEW.kpis', 'DRP_PAYMENT_ORDER.PO-2026-0418-017', 'DRP_FUNDS_INTERCEPT_RULES']
    followUps = ['查看拦截规则', '项目资金链路', '生成风险报告']
  } else if (question.includes('采购') || question.includes('围标') || question.includes('标段')) {
    intent = '采购风险识别'
    const project = DRP_PROCUREMENT_PROJECT[0]
    answer = `采购场景当前高风险标段为 ${project.id} ${project.projectName}，围标概率 ${project.collusionProbability}%，已命中 ${project.riskTags.join('、')} 等特征。页面概览显示可疑投标项目 ${DRP_PROCUREMENT_OVERVIEW.kpis.find((item) => item.key === 'suspicious')?.value} 个、高风险项目 ${DRP_PROCUREMENT_OVERVIEW.kpis.find((item) => item.key === 'critical')?.value} 个，建议先对该标段补做投标单位股权和设备指纹穿透。`
    logic = '读取采购总览 KPI 和默认高风险标段，优先输出围标概率、异常特征和处置建议。'
    sources = ['DRP_PROCUREMENT_OVERVIEW.kpis', 'DRP_PROCUREMENT_PROJECT.CG-2026-0501', 'PROCUREMENT_PACKAGES.aiScore']
    followUps = ['查看关联关系', '高风险标段', '生成风险报告']
  } else if (compactText.includes('首页风险摘要')) {
    intent = '首页全景摘要'
    answer = `首页大屏当前核心指标为总资产 ${KPI.totalAssetsYi} 亿元、投资项目 ${KPI.investmentProjects} 个、待闭环风险 ${KPI.openRisks} 项。风险最高板块是 ${highestRiskSector().name}，风险得分 ${highestRiskSector().riskScore}。当前最需关注的样本仍是 ${RISK_SAMPLES.find((item) => item.id === 'R11')?.summary}。`
    logic = '从首页 KPI、板块风险分和风险样本中抽取最能代表当前态势的指标，形成一段摘要。'
    sources = ['KPI', 'SECTORS', 'RISK_SAMPLES.R11']
    followUps = ['投资重点项目', '查看关联关系', '生成风险报告']
  }

  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'assistant',
    intent,
    answer,
    logic,
    sources,
    followUps,
    action,
  }
}

function getSuggestions(scene) {
  if (scene === 'invest') return INVESTMENT_QUESTIONS
  return DEFAULT_QUESTIONS
}

function getSceneContext(scene) {
  const fundsAbnormal = DRP_FUNDS_OVERVIEW.kpis.find((item) => item.key === 'abnormal')?.value || 0
  const blockedCount = DRP_FUNDS_OVERVIEW.kpis.find((item) => item.key === 'blocked')?.value || 0
  const investOverBudget = INVESTMENT_PROJECTS.filter((item) => item.actualYi > item.budgetYi).length
  const focusInvestment = INVESTMENT_PROJECT_PROFILES.P06
  const contractKpi = CONTRACT_COMMAND_CENTER.kpis
  const procurementKpi = DRP_PROCUREMENT_OVERVIEW.kpis

  const map = {
    dashboard: {
      title: '首页大屏',
      metrics: [`总资产 ${KPI.totalAssetsYi} 亿元`, `投资项目 ${KPI.investmentProjects} 个`, `待闭环风险 ${KPI.openRisks} 项`, '风险闭环率 76.4%'],
      charts: ['风险等级分布', '板块风险得分', '风险热力图', '预警趋势'],
      summary: `全局仍以投资超预算、异常支付和采购围标为主风险，最高风险板块为 ${highestRiskSector().name}`,
      priority: '工程建设板块围标风险与新能源投资超预算项目',
      actions: ['高风险样本复核', '投资偏差核查', '异常支付拦截'],
      sources: ['KPI.totalAssetsYi', 'KPI.openRisks', 'SECTORS.riskScore', 'RISK_SAMPLES'],
    },
    invest: {
      title: '投资穿透',
      metrics: [`在投项目 ${INVESTMENT_PROJECTS.length} 个`, `超预算项目 ${investOverBudget} 个`, `默认项目超预算 ${formatPercent(focusInvestment.overBudgetRate)}`, `关联交易占比 ${formatPercent(focusInvestment.relatedTradeRatio)}`],
      charts: ['预算 vs 实际投资趋势', '里程碑甘特图', '投资组合矩阵视图', '关联交易知识图谱'],
      summary: `投资场景当前聚焦陇东风电基地二期，超预算 ${formatPercent(focusInvestment.overBudgetRate)}，关联交易金额 ${formatNumber(focusInvestment.relatedTradeAmountYi)} 亿元`,
      priority: '陇东风电基地二期的超预算与隐蔽关联路径',
      actions: ['EPC 清单复核', '关联股权穿透', '投资签证核验'],
      sources: ['INVESTMENT_PROJECTS', 'INVESTMENT_PROJECT_PROFILES.P06', 'INVESTMENT_RELATION_GRAPHS.P06'],
    },
    finance: {
      title: '资金穿透',
      metrics: [`资金总规模 ${formatNumber(DRP_FUNDS_OVERVIEW.kpis[0].value)} 亿元`, `今日支付 ${formatNumber(DRP_FUNDS_OVERVIEW.kpis[2].value)} 亿元`, `异常支付 ${fundsAbnormal} 笔`, `已拦截 ${blockedCount} 笔`],
      charts: ['资金组织视图', '支付单据列表', '账户余额分布', '资金流向链路'],
      summary: `资金场景的核心异常是非白名单大额支付与合同缺失，当前异常支付 ${fundsAbnormal} 笔、已拦截 ${blockedCount} 笔`,
      priority: 'PO-2026-0418-017 异常支付单与相关审批缺口',
      actions: ['白名单复核', '合同挂接补录', '法务审批补发起'],
      sources: ['DRP_FUNDS_OVERVIEW.kpis', 'DRP_PAYMENT_ORDER', 'DRP_FUNDS_INTERCEPT_RULES'],
    },
    equity: {
      title: '合同穿透',
      metrics: [`合同总数 ${contractKpi[0].value} 份`, `合同总金额 ${formatNumber(contractKpi[1].value)} 亿元`, `高风险合同 ${contractKpi[2].value} 份`, `待法务审核 ${contractKpi[3].value} 份`],
      charts: ['风险分布环图', '履约状态分布', '付款/交付进度对比', '合同解析步骤'],
      summary: `合同场景默认合同存在 100% 预付、无法务审核和无质保金的叠加风险`,
      priority: 'HT-2026-0588 的付款进度与履约进度倒挂',
      actions: ['法务补审', '风险条款重签', '付款节点复核'],
      sources: ['CONTRACT_COMMAND_CENTER.kpis', 'CONTRACT_COMMAND_CENTER.contracts', 'CONTRACT_COMMAND_CENTER.riskDistribution'],
    },
    overseas: {
      title: '采购穿透',
      metrics: [`招标项目 ${procurementKpi[0].value} 个`, `投标单位 ${procurementKpi[1].value} 家`, `可疑项目 ${procurementKpi[4].value} 个`, `高风险项目 ${procurementKpi[5].value} 个`],
      charts: ['风险项目列表', '围标特征分析', '投标单位关系图', '概率评估图'],
      summary: `采购场景当前最显著风险是 CG-2026-0501 围标概率 95%，同 IP、同 MAC 和报价等差特征并发`,
      priority: 'CG-2026-0501 的围标串标核查',
      actions: ['设备指纹核验', '股权关系穿透', '评标复核'],
      sources: ['DRP_PROCUREMENT_OVERVIEW.kpis', 'DRP_PROCUREMENT_PROJECT', 'DRP_PROCUREMENT_RISK_EVENT'],
    },
    ai: {
      title: 'AI 智能体',
      metrics: ['智能体 4 个', '本日任务 2650+', '主动发现 28 条', '准确率 93.6%'],
      charts: ['智能问数对话', '主动发现列表', '协作流程'],
      summary: 'AI 智能体场景支持从问答转为主动发现，并联动各穿透模块的指标摘要',
      priority: '高风险问题的跨模块联动解释',
      actions: ['查看关联关系', '生成风险报告', '解释计算逻辑'],
      sources: ['AIAgent.dialog', 'AIAgent.proactive', 'scene contexts'],
    },
  }

  return map[scene] || map.dashboard
}

function highestRiskSector() {
  return [...SECTORS].sort((a, b) => b.riskScore - a.riskScore)[0]
}

function sumBy(list, key) {
  return list.reduce((sum, item) => sum + Number(item[key] || 0), 0)
}

function formatNumber(value) {
  return Number(value || 0).toFixed(1).replace(/\.0$/, '')
}

function formatPercent(value) {
  return `${formatNumber(value)}%`
}

function scrollToBottom() {
  nextTick(() => {
    const el = messageListRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  })
}

watch(messages, saveHistory, { deep: true })

watch(
  () => props.scene,
  (scene, prev) => {
    if (scene === prev || !messages.value.length) return
    messages.value.push({
      id: `scene-${Date.now()}`,
      role: 'assistant',
      intent: '场景切换同步',
      answer: `已同步到 ${sceneLabels[scene] || '当前场景'}。现在可以直接提问：${getSuggestions(scene).join('、')}。`,
      sources: getSceneContext(scene).sources.slice(0, 3),
      logic: '场景切换后自动刷新建议问题和数据引用范围，但保留历史问答记录供滚动查看。',
      followUps: getSuggestions(scene),
    })
    scrollToBottom()
  }
)

onMounted(() => {
  ensureWelcomeMessage()
})
</script>

<style scoped>
.qa-float-shell {
  position: fixed;
  right: 22px;
  bottom: 100px;
  z-index: 9999;
}

.qa-trigger {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  color: #fff;
  z-index: 9999;
  transition: transform 0.22s ease, filter 0.22s ease;
}

.qa-trigger:hover {
  transform: scale(1.06);
  filter: brightness(1.08);
}

.qa-trigger.active .qa-trigger-core {
  box-shadow:
    0 0 0 1px rgba(74, 144, 226, 0.36),
    0 0 32px rgba(74, 144, 226, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.qa-trigger-pulse,
.qa-trigger-ring,
.qa-trigger-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.qa-trigger-pulse {
  background: radial-gradient(circle, rgba(74, 144, 226, 0.22) 0%, rgba(74, 144, 226, 0) 72%);
  animation: qa-pulse 2.4s ease-out infinite;
}

.qa-trigger-ring {
  inset: 2px;
  border: 1px solid rgba(74, 144, 226, 0.48);
  box-shadow: 0 0 18px rgba(74, 144, 226, 0.28);
}

.qa-trigger-core {
  inset: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.24), transparent 34%),
    linear-gradient(180deg, rgba(74, 144, 226, 0.92), rgba(43, 96, 165, 0.96));
  border: 1px solid rgba(74, 144, 226, 0.44);
  backdrop-filter: blur(14px);
  box-shadow:
    0 10px 24px rgba(2, 12, 28, 0.44),
    0 0 20px rgba(74, 144, 226, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.qa-trigger-core svg {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 8px rgba(74, 144, 226, 0.38));
}

.qa-panel {
  position: absolute;
  right: 84px;
  bottom: 14px;
  width: 532px;
  height: 800px;
  max-width: calc(100vw - 120px);
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(125, 211, 252, 0.22);
  background:
    linear-gradient(180deg, rgba(5, 18, 38, 0.94), rgba(3, 10, 24, 0.9)),
    radial-gradient(circle at top left, rgba(0, 212, 255, 0.12), transparent 36%);
  box-shadow:
    0 24px 46px rgba(0, 0, 0, 0.42),
    0 0 28px rgba(0, 212, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  overflow: hidden;
  z-index: 9998;
}

.qa-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(130deg, transparent 10%, rgba(255, 255, 255, 0.04) 18%, transparent 34%);
  transform: translateX(-120%);
  animation: qa-sweep 8s linear infinite;
  pointer-events: none;
}

.qa-panel-head,
.qa-panel-actions,
.qa-context-metrics,
.qa-follow-list,
.qa-suggest-bar,
.qa-input-wrap,
.qa-ai-meta {
  display: flex;
}

.qa-panel-head {
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(72, 162, 255, 0.16);
}

.qa-panel-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--t-1);
  letter-spacing: 0.08em;
}

.qa-panel-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #8ecbe8;
  letter-spacing: 0.08em;
}

.qa-panel-actions {
  gap: 8px;
}

.qa-icon-btn {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(72, 162, 255, 0.18);
  background: rgba(8, 24, 42, 0.8);
  cursor: pointer;
}

.qa-icon-btn:hover {
  border-color: rgba(0, 212, 255, 0.38);
  box-shadow: 0 0 14px rgba(0, 212, 255, 0.14);
}

.qa-icon-btn span {
  position: absolute;
  left: 50%;
  top: 50%;
  display: block;
  background: #dff8ff;
  transform: translate(-50%, -50%);
}

.qa-icon-btn:not(.close) span {
  width: 10px;
  height: 2px;
}

.qa-icon-btn.close span {
  width: 12px;
  height: 1.6px;
}

.qa-icon-btn.close span:first-child {
  transform: translate(-50%, -50%) rotate(45deg);
}

.qa-icon-btn.close span:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.qa-context-card {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(72, 162, 255, 0.16);
  background: linear-gradient(135deg, rgba(0, 126, 194, 0.16), rgba(8, 18, 42, 0.36));
}

.qa-context-kicker {
  font-size: 10px;
  color: var(--t-3);
  letter-spacing: 0.18em;
}

.qa-context-title {
  margin-top: 4px;
  font-size: 14px;
  color: var(--t-1);
  font-weight: 700;
}

.qa-context-metrics {
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.qa-context-metrics span,
.qa-suggest-chip,
.qa-chip,
.qa-follow-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.qa-context-metrics span,
.qa-chip {
  padding: 3px 8px;
  font-size: 10px;
  color: #a8dbef;
  background: rgba(8, 24, 42, 0.7);
  border: 1px solid rgba(72, 162, 255, 0.16);
}

.qa-message-list {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
}

.qa-message-row {
  display: flex;
  margin-bottom: 12px;
}

.qa-message-row.user {
  justify-content: flex-end;
}

.qa-user-bubble {
  max-width: 84%;
  padding: 10px 12px;
  border-radius: 14px 14px 4px 14px;
  background: linear-gradient(135deg, rgba(0, 126, 194, 0.42), rgba(0, 212, 255, 0.28));
  color: #f2fbff;
  font-size: 13px;
  line-height: 1.55;
  box-shadow: 0 8px 18px rgba(1, 12, 28, 0.26);
}

.qa-ai-card {
  width: 100%;
  padding: 12px;
  border-radius: 14px 14px 14px 4px;
  border: 1px solid rgba(72, 162, 255, 0.14);
  background: linear-gradient(135deg, rgba(0, 78, 122, 0.2), rgba(8, 18, 42, 0.82));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.qa-ai-meta {
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.qa-ai-tag {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  color: var(--primary);
  border: 1px solid rgba(0, 212, 255, 0.22);
  background: rgba(8, 24, 42, 0.7);
}

.qa-ai-meta strong {
  color: var(--t-1);
  font-size: 12px;
}

.qa-ai-answer {
  color: #e8f7ff;
  font-size: 13px;
  line-height: 1.7;
}

.qa-ai-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 10px;
}

.qa-ai-block {
  padding: 8px 9px;
  border-radius: 10px;
  background: rgba(4, 16, 32, 0.48);
  border: 1px solid rgba(72, 162, 255, 0.1);
}

.qa-ai-block-title {
  margin-bottom: 6px;
  font-size: 10px;
  color: var(--t-3);
  letter-spacing: 0.12em;
}

.qa-ai-block p {
  font-size: 11px;
  line-height: 1.6;
  color: #98c6da;
}

.qa-chip-list,
.qa-follow-list,
.qa-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.qa-action-row {
  margin-top: 10px;
}

.qa-follow-list {
  margin-top: 10px;
}

.qa-follow-btn,
.qa-action-btn,
.qa-suggest-chip,
.qa-send-btn {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.qa-follow-btn,
.qa-action-btn,
.qa-suggest-chip {
  padding: 4px 9px;
  border: 1px solid rgba(72, 162, 255, 0.16);
  background: rgba(8, 24, 42, 0.7);
  color: #d5f4ff;
  font-size: 11px;
}

.qa-action-btn {
  min-width: 76px;
  padding: 6px 14px;
  border-color: rgba(0, 212, 255, 0.32);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(6, 182, 212, 0.12));
  color: #f3fbff;
}

.qa-follow-btn:hover,
.qa-action-btn:hover,
.qa-suggest-chip:hover,
.qa-send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(0, 212, 255, 0.38);
  box-shadow: 0 8px 16px rgba(3, 17, 32, 0.24);
}

.qa-suggest-bar {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(72, 162, 255, 0.12);
}

.qa-input-wrap {
  gap: 10px;
  align-items: flex-end;
  margin-top: 12px;
}

.qa-input {
  flex: 1;
  min-height: 64px;
  resize: none;
  border: 1px solid rgba(72, 162, 255, 0.16);
  border-radius: 12px;
  background: rgba(5, 16, 32, 0.84);
  color: #ebfbff;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
}

.qa-input:focus {
  border-color: rgba(0, 212, 255, 0.38);
  box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.18);
}

.qa-send-btn {
  width: 72px;
  height: 42px;
  border: 1px solid rgba(0, 212, 255, 0.34);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.32), rgba(6, 182, 212, 0.2));
  color: #f3fbff;
  font-size: 13px;
}

.qa-send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.qa-panel-enter-active,
.qa-panel-leave-active {
  transition: opacity 0.26s ease, transform 0.26s ease;
}

.qa-panel-enter-from,
.qa-panel-leave-to {
  opacity: 0;
  transform: translate(20px, 22px) scale(0.96);
}

@keyframes qa-pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.72;
  }
  70% {
    transform: scale(1.22);
    opacity: 0;
  }
  100% {
    transform: scale(1.24);
    opacity: 0;
  }
}

@keyframes qa-sweep {
  0% {
    transform: translateX(-120%);
  }
  50%,
  100% {
    transform: translateX(120%);
  }
}
</style>
