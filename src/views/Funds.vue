<template>
  <div class="funds-screen">
    <PageBackBar title="资金穿透" @back="emit('navigate', 'dashboard')" />
    <div class="funds-header">
      <div>
        <div class="screen-kicker">全景监管驾驶舱 · 资金穿透</div>
        <h1 class="screen-title">资金全景可视、流向可追、异常可拦、源头可溯</h1>
        <p class="screen-desc">
          围绕"异常支付拦截"核心场景，打通资金全景、流向图谱、异常预警、自动拦截、支付流水、关联合同和项目穿透完整链路。
        </p>
      </div>
      <div class="topbar-meta">
        <div class="meta-card">
          <span class="meta-label">实时时间</span>
          <strong>{{ currentTime }}</strong>
        </div>
        <div class="meta-card success">
          <span class="meta-label">刷新状态</span>
          <strong>{{ refreshText }}</strong>
        </div>
      </div>
    </div>

    <div class="funds-kpi-strip">
      <article
        v-for="card in summaryCards"
        :key="card.key"
        class="glass-panel kpi-card"
        :class="card.status"
      >
        <div class="kpi-head">
          <span class="kpi-title">{{ card.label }}</span>
          <span class="kpi-chip">{{ card.statusText }}</span>
        </div>
        <div class="kpi-main">
          <strong>{{ displayMetric(card) }}</strong>
          <span>{{ card.unit }}</span>
        </div>
        <div class="kpi-foot">
          <span>{{ card.source }}</span>
          <span>{{ card.tip }}</span>
        </div>
        <svg class="kpi-trend" viewBox="0 0 140 28" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="`funds-kpi-${card.key}`" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0ea5e9" />
              <stop offset="100%" :stop-color="card.color" />
            </linearGradient>
          </defs>
          <polyline
            :points="sparklinePoints(card.trend)"
            :stroke="`url(#funds-kpi-${card.key})`"
            fill="none"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </article>
    </div>

    <div class="funds-body">

      <!-- 中上：账户分布地图（全宽，向下延伸） -->
      <div class="glass-panel funds-row-map">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">账户分布地图</h2>
          </div>
          <div class="panel-tags">
            <span class="tag ok">绿色 正常</span>
            <span class="tag watch">黄色 关注</span>
            <span class="tag medium">橙色 异常</span>
            <span class="tag danger">红色 高风险</span>
          </div>
        </div>
        <EChart class="map-chart" :option="accountMapOption" :events="accountMapEvents" />
      </div>

      <!-- 中间：资金流向图谱（左）＋ 拦截结构（右） -->
      <div class="funds-row-mid">
        <div class="glass-panel funds-flow-panel">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">资金流向图谱</h2>
            </div>
            <div class="panel-tags">
              <span class="tag danger">红色路径为异常</span>
              <span class="tag focus">线宽表示金额</span>
            </div>
          </div>
          <EChart class="flow-chart" :option="fundFlowOption" :events="fundFlowEvents" />
        </div>

        <div class="glass-panel funds-intercept-panel">
          <div class="panel-title small">拦截结构</div>
          <div class="result-metrics">
            <div>
              <span>当前异常单</span>
              <strong>{{ demoPayment.id }}</strong>
            </div>
            <div>
              <span>处理状态</span>
              <strong :class="{ danger: !isBlocked(demoPayment.id), success: isBlocked(demoPayment.id) }">
                {{ isBlocked(demoPayment.id) ? '已拦截' : '待拦截' }}
              </strong>
            </div>
            <div>
              <span>已生成工单</span>
              <strong>{{ currentWorkOrder?.id || '待生成' }}</strong>
            </div>
          </div>
          <ul class="timeline-list">
            <li v-for="item in eventTimeline" :key="item.id">
              <span>{{ item.createdAt }}</span>
              <strong>{{ item.title }}</strong>
              <em>{{ item.status }}</em>
            </li>
          </ul>
        </div>
      </div>

      <!-- 中下：支付流水列表（70%）＋ 风险说明与处置建议（30%） -->
      <div class="funds-row-bot">
        <section class="glass-panel table-panel">
          <div class="panel-head table-head">
            <div>
              <h2 class="panel-title">支付流水列表</h2>
            </div>
            <div class="table-summary">
              <span>当前单位：{{ activeUnitLabel }}</span>
              <span>共 {{ filteredPayments.length }} 笔</span>
            </div>
          </div>

          <div class="filter-bar">
            <label>
              <span>单位</span>
              <select v-model="activeUnitId">
                <option value="all">全部单位</option>
                <option v-for="unit in companyUnits" :key="unit.id" :value="unit.id">{{ unit.unitName }}</option>
              </select>
            </label>
            <label>
              <span>风险等级</span>
              <select v-model="riskFilter">
                <option value="all">全部等级</option>
                <option v-for="item in riskOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <label>
              <span>时间</span>
              <select v-model="dateFilter">
                <option value="all">全部日期</option>
                <option v-for="item in dateOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <label>
              <span>状态</span>
              <select v-model="statusFilter">
                <option value="all">全部状态</option>
                <option v-for="item in statusOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
          </div>

          <div class="table-shell">
            <table class="payment-table">
              <thead>
                <tr>
                  <th>支付单号</th>
                  <th>付款日期</th>
                  <th>付款单位</th>
                  <th>收款单位</th>
                  <th>金额（亿元）</th>
                  <th>账户号</th>
                  <th>用途</th>
                  <th>白名单</th>
                  <th>关联合同</th>
                  <th>风险</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredPayments"
                  :key="item.id"
                  :class="['payment-row', rowTone(item), { active: selectedPaymentId === item.id }]"
                  @click="openPaymentDetail(item.id)"
                >
                  <td>
                    <span v-if="item.id === demoPaymentId" class="live-dot"></span>
                    {{ item.id }}
                  </td>
                  <td>{{ item.paymentDate }}</td>
                  <td class="align-left">{{ item.payerName }}</td>
                  <td class="align-left">{{ item.payeeName }}</td>
                  <td>{{ formatYi(item.amountYi) }}</td>
                  <td class="mono">{{ item.accountNo }}</td>
                  <td class="align-left">{{ item.purpose }}</td>
                  <td>
                    <span class="tag-pill" :class="whiteListClass(item.whiteListStatus)">{{ item.whiteListStatus }}</span>
                  </td>
                  <td>{{ item.contractId || '未关联' }}</td>
                  <td>
                    <span class="risk-pill" :class="riskClass(item.riskLevel)">{{ riskText(item.riskLevel) }}</span>
                  </td>
                  <td>
                    <span class="status-pill" :class="statusClass(paymentStatus(item))">{{ paymentStatus(item) }}</span>
                  </td>
                  <td>
                    <div class="action-row">
                      <button type="button" class="op-btn" @click.stop="openPaymentDetail(item.id)">详情</button>
                      <button type="button" class="op-btn" @click.stop="openContract(item)">合同</button>
                      <button type="button" class="op-btn primary" @click.stop="openWorkOrder(item)">工单</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="bottom-card funds-risk-panel">
          <div class="panel-title small">风险说明与处置建议</div>
          <div class="reason-box">
            <div class="reason-title">命中规则</div>
            <ul class="reason-list">
              <li v-for="item in DRP_FUNDS_INTERCEPT_RULES" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="reason-box">
            <div class="reason-title">自动研判结论</div>
            <p>
              该笔支付金额 4800 万元，收款方不在白名单，未关联有效合同，且审批链缺失法务节点，
              属于"非白名单 + 大额 + 无合同 + 未审批"四项叠加异常，建议立即冻结支付并派发专项核查工单。
            </p>
          </div>
          <div class="bottom-actions">
            <button type="button" class="op-btn primary" @click="interceptPayment(demoPayment.id)">立即拦截</button>
            <button type="button" class="op-btn" @click="openContract(demoPayment)">合同核验</button>
            <button type="button" class="op-btn" @click="openInvestment(demoPayment)">项目穿透</button>
          </div>
        </div>
      </div>

    </div>

    <transition name="alert-pop">
      <div v-if="alertVisible" class="alert-mask">
        <div class="alert-dialog">
          <div class="alert-header">异常支付预警</div>
          <h3>检测到一笔 4800 万元大额支付</h3>
          <p>收款方不在白名单 + 无关联合同 + 无法务审批，系统建议立即拦截。</p>
          <div class="alert-tags">
            <span class="tag danger">非白名单</span>
            <span class="tag danger">无合同</span>
            <span class="tag medium">未审批</span>
          </div>
          <div class="alert-actions">
            <button type="button" class="op-btn primary large" @click="interceptPayment(demoPayment.id)">拦截</button>
            <button type="button" class="op-btn large" @click="viewAnomalyDetail">查看详情</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="drawer-slide">
      <aside v-if="drawerVisible && selectedPayment" class="drawer">
        <div class="drawer-head">
          <div>
            <div class="drawer-kicker">支付详情抽屉</div>
            <h2>{{ selectedPayment.id }}</h2>
          </div>
          <button type="button" class="drawer-close" @click="drawerVisible = false">×</button>
        </div>

        <section class="drawer-section">
          <div class="section-title">支付基础信息</div>
          <div class="detail-grid">
            <div><span>付款单位</span><strong>{{ selectedPayment.payerName }}</strong></div>
            <div><span>收款单位</span><strong>{{ selectedPayment.payeeName }}</strong></div>
            <div><span>付款日期</span><strong>{{ selectedPayment.paymentDate }}</strong></div>
            <div><span>支付金额</span><strong>{{ formatYi(selectedPayment.amountYi) }}</strong></div>
            <div><span>账户号</span><strong>{{ selectedPayment.accountNo }}</strong></div>
            <div><span>用途</span><strong>{{ selectedPayment.purpose }}</strong></div>
          </div>
        </section>

        <section class="drawer-section">
          <div class="section-title">收款方信息与白名单校验</div>
          <div class="detail-grid">
            <div><span>客商类别</span><strong>{{ selectedPayment.payeeCategory }}</strong></div>
            <div><span>白名单状态</span><strong :class="riskClass(selectedPayment.counterparty.riskLevel)">{{ selectedPayment.whiteListStatus }}</strong></div>
            <div><span>所有者</span><strong>{{ selectedPayment.counterparty.owner }}</strong></div>
            <div><span>风险等级</span><strong>{{ riskText(selectedPayment.counterparty.riskLevel) }}</strong></div>
          </div>
        </section>

        <section class="drawer-section">
          <div class="section-title">关联合同与项目</div>
          <div class="detail-grid">
            <div>
              <span>关联合同</span>
              <strong>{{ selectedPayment.contractId || '未匹配合同' }}</strong>
            </div>
            <div>
              <span>建议核验合同</span>
              <strong>{{ selectedPayment.suggestedContractId || '无' }}</strong>
            </div>
            <div>
              <span>关联项目</span>
              <strong>{{ selectedPayment.projectName || '未关联项目' }}</strong>
            </div>
            <div>
              <span>项目编号</span>
              <strong>{{ selectedPayment.projectId || '无' }}</strong>
            </div>
          </div>
          <div class="drawer-actions">
            <button type="button" class="op-btn" @click="openContract(selectedPayment)">查看合同穿透</button>
            <button type="button" class="op-btn" @click="openInvestment(selectedPayment)">查看项目穿透</button>
          </div>
        </section>

        <section class="drawer-section">
          <div class="section-title">审批链</div>
          <ul class="approval-list">
            <li v-for="item in selectedPayment.approvals" :key="item.id" :class="approvalClass(item.status)">
              <div>
                <strong>{{ item.nodeName }}</strong>
                <span>{{ item.approver }}</span>
              </div>
              <div>
                <strong>{{ item.status }}</strong>
                <span>{{ item.actionTime }}</span>
              </div>
            </li>
          </ul>
        </section>

        <section class="drawer-section">
          <div class="section-title">风险研判与拦截原因</div>
          <div class="ai-box">
            <p v-for="item in selectedPayment.aiInsights" :key="item">{{ item }}</p>
          </div>
          <div class="drawer-actions">
            <button type="button" class="op-btn primary" @click="interceptPayment(selectedPayment.id)">派发工单</button>
            <button type="button" class="op-btn" @click="openWorkOrder(selectedPayment)">查看工单</button>
          </div>
        </section>
      </aside>
    </transition>

    <transition name="toast-rise">
      <div v-if="toastMessage" class="toast-banner">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EChart from '@/components/EChart.vue'
import PageBackBar from '@/components/PageBackBar.vue'
import {
  CONTRACTS,
  DRP_BANK_ACCOUNT,
  DRP_COUNTERPARTY,
  DRP_FUND_ACCOUNT_BALANCE,
  DRP_FUNDS_INTERCEPT_RULES,
  DRP_FUNDS_OVERVIEW,
  DRP_ORG_UNIT,
  DRP_PAYMENT_APPROVAL,
  DRP_PAYMENT_FLOW,
  DRP_PAYMENT_ORDER,
  DRP_PAYEE_WHITELIST,
  DRP_RISK_EVENT,
  DRP_WORK_ORDER,
  INVESTMENT_PROJECTS,
} from '@/mock/index.js'

const emit = defineEmits(['navigate'])

const currentTime = ref('')
const refreshText = ref('数据已刷新 08 秒前')
const animatedMetrics = ref({})
const activeUnitId = ref('all')
const riskFilter = ref('all')
const dateFilter = ref('all')
const statusFilter = ref('all')
const drawerVisible = ref(false)
const alertVisible = ref(false)
const selectedPaymentId = ref(DRP_FUNDS_OVERVIEW.defaultPaymentOrderId)
const blockedPaymentIds = ref(DRP_PAYMENT_ORDER.filter((item) => item.isBlocked).map((item) => item.id))
const generatedRiskEvents = ref([...DRP_RISK_EVENT])
const generatedWorkOrders = ref([...DRP_WORK_ORDER])
const toastMessage = ref('')

let clockTimer = null
let toastTimer = null
let refreshTimer = null
const demoTimers = []

const riskTextMap = {
  critical: '高风险',
  high: '中风险',
  medium: '关注',
  low: '正常',
}

const counterpartyMap = Object.fromEntries(DRP_COUNTERPARTY.map((item) => [item.id, item]))
const accountMap = Object.fromEntries(DRP_BANK_ACCOUNT.map((item) => [item.id, item]))
const balanceMap = Object.fromEntries(DRP_FUND_ACCOUNT_BALANCE.map((item) => [item.accountId, item]))
const orgUnitMap = Object.fromEntries(DRP_ORG_UNIT.map((item) => [item.id, item]))
const contractMap = Object.fromEntries(CONTRACTS.map((item) => [item.id, item]))
const projectMap = Object.fromEntries(INVESTMENT_PROJECTS.map((item) => [item.id, item]))

const demoPaymentId = DRP_FUNDS_OVERVIEW.defaultPaymentOrderId

const summaryCards = computed(() =>
  DRP_FUNDS_OVERVIEW.kpis.map((item) => ({
    ...item,
    color: item.status === 'critical' ? '#f53f3f' : item.status === 'high' ? '#ff8800' : '#06b6d4',
    source: item.key === 'scale' ? 'drp_fund_account_balance' : item.key === 'accounts' ? 'drp_bank_account' : 'drp_payment_order',
    tip: item.status === 'critical' ? '自动预警中' : item.status === 'high' ? '持续拦截中' : '实时更新',
    statusText: item.status === 'critical' ? '红色预警' : item.status === 'high' ? '橙色提示' : '正常监控',
  }))
)

const companyUnits = computed(() => DRP_ORG_UNIT.filter((item) => item.unitType === 'company'))
const riskOptions = ['高风险', '中风险', '关注', '正常']
const statusOptions = ['正常', '异常', '已拦截', '待审核']
const dateOptions = [...new Set(DRP_PAYMENT_ORDER.map((item) => item.paymentDate))]

const enrichedPayments = computed(() =>
  DRP_PAYMENT_ORDER.map((item) => {
    const payer = orgUnitMap[item.payerUnitId]
    const payee = counterpartyMap[item.payeeId]
    const account = accountMap[item.accountId]
    const contract = contractMap[item.contractId] || contractMap[item.suggestedContractId]
    const project = projectMap[item.projectId]
    const approvals = DRP_PAYMENT_APPROVAL.filter((approval) => approval.paymentOrderId === item.id)
    const whiteList = DRP_PAYEE_WHITELIST.find((record) => record.payeeId === item.payeeId)
    const isBlockedNow = isBlocked(item.id)

    return {
      ...item,
      payerName: payer?.unitName || item.payerUnitId,
      payeeName: payee?.name || item.payeeId,
      payeeCategory: payee?.category || '-',
      accountNo: account?.accountNo || item.accountId,
      counterparty: payee || { riskLevel: 'medium', owner: '-', category: '-' },
      approvals,
      whiteList,
      projectName: project?.name || '',
      contractName: contract?.name || '',
      contractAmountYi: contract?.amountYi || 0,
      isBlockedNow,
      aiInsights: buildAiInsights(item, payee, contract, project, approvals, isBlockedNow),
    }
  })
)

const filteredPayments = computed(() =>
  enrichedPayments.value.filter((item) => {
    const riskLabel = riskText(item.riskLevel)
    const statusLabel = paymentStatus(item)
    return (activeUnitId.value === 'all' || item.payerUnitId === activeUnitId.value)
      && (riskFilter.value === 'all' || riskFilter.value === riskLabel)
      && (dateFilter.value === 'all' || dateFilter.value === item.paymentDate)
      && (statusFilter.value === 'all' || statusFilter.value === statusLabel)
  })
)

const selectedPayment = computed(() =>
  enrichedPayments.value.find((item) => item.id === selectedPaymentId.value) || enrichedPayments.value[0] || null
)

const demoPayment = computed(() =>
  enrichedPayments.value.find((item) => item.id === demoPaymentId) || enrichedPayments.value[0]
)

const currentWorkOrder = computed(() =>
  generatedWorkOrders.value.find((item) => item.paymentOrderId === demoPaymentId) || null
)

const eventTimeline = computed(() =>
  generatedRiskEvents.value
    .filter((item) => item.paymentOrderId === demoPaymentId || item.paymentOrderId === 'PO-2026-0417-014')
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
)

const activeUnitLabel = computed(() => {
  if (activeUnitId.value === 'all') return '全部单位'
  return orgUnitMap[activeUnitId.value]?.unitName || '全部单位'
})

const accountMapOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    formatter: ({ data }) => {
      if (!data) return ''
      return `
        <div style="min-width:180px">
          <strong>${data.unitName}</strong><br/>
          板块：${data.sectorName}<br/>
          区域：${data.region}<br/>
          账户数：${data.accountCount} 个<br/>
          余额：${formatYi(data.balanceYi)}<br/>
          风险等级：${riskText(data.riskLevel)}
        </div>
      `
    },
  },
  grid: { left: 10, right: 10, top: 20, bottom: 0 },
  xAxis: { min: 0, max: 100, show: false },
  yAxis: { min: 0, max: 100, show: false },
  series: [
    {
      type: 'scatter',
      data: companyUnits.value.map((unit) => ({
        value: [...unit.coord, unitBalance(unit.id)],
        id: unit.id,
        unitName: unit.unitName,
        sectorName: unit.sectorName,
        region: unit.region,
        accountCount: unit.accountCount,
        balanceYi: unitBalance(unit.id),
        riskLevel: unit.riskLevel,
        symbolSize: 18 + unitBalance(unit.id) * 0.16,
        itemStyle: {
          color: pointColor(unit.riskLevel),
          shadowBlur: activeUnitId.value === unit.id ? 22 : 12,
          shadowColor: pointColor(unit.riskLevel),
          borderColor: activeUnitId.value === unit.id ? '#ffffff' : 'rgba(255,255,255,0.18)',
          borderWidth: activeUnitId.value === unit.id ? 2 : 1,
        },
        label: {
          show: true,
          formatter: unit.shortName,
          color: '#dfefff',
          fontSize: 11,
          position: 'bottom',
        },
      })),
      emphasis: { scale: 1.2 },
    },
    {
      type: 'effectScatter',
      data: companyUnits.value
        .filter((unit) => unit.riskLevel === 'critical' || unit.id === activeUnitId.value)
        .map((unit) => ({
          value: [...unit.coord, unitBalance(unit.id)],
          id: unit.id,
          symbolSize: 28 + unitBalance(unit.id) * 0.12,
          itemStyle: { color: pointColor(unit.riskLevel) },
        })),
      rippleEffect: { scale: 3.5, brushType: 'stroke' },
      showEffectOn: 'render',
      zlevel: 1,
    },
  ],
  graphic: [
    {
      type: 'rect',
      left: '5%',
      top: '12%',
      shape: { width: 360, height: 200, r: 20 },
      style: { stroke: 'rgba(14,165,233,0.25)', fill: 'rgba(10,24,40,0.22)' },
    },
    {
      type: 'text',
      left: '9%',
      top: '14%',
      style: { text: '账户分布地图 · 演示底图', fill: '#8fb7db', fontSize: 12 },
    },
  ],
}))

const accountMapEvents = {
  click: ({ data }) => {
    if (!data?.id) return
    activeUnitId.value = data.id
  },
}

const visibleFlows = computed(() =>
  DRP_PAYMENT_FLOW.filter((item) => activeUnitId.value === 'all' || item.sourceChain.includes(activeUnitId.value))
)

const sankeyNodes = computed(() => {
  const map = new Map()
  visibleFlows.value.forEach((flow) => {
    [...flow.sourceChain, flow.targetId].forEach((nodeId) => {
      if (!map.has(nodeId)) {
        map.set(nodeId, sankeyNode(nodeId))
      }
    })
  })
  return [...map.values()]
})

const fundFlowOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    formatter: (params) => {
      if (params.dataType === 'edge') {
        const payment = enrichedPayments.value.find((item) => item.id === params.data.paymentOrderId)
        return `
          <div style="min-width:220px">
            <strong>${payment?.id || '支付路径'}</strong><br/>
            付款单位：${payment?.payerName || '-'}<br/>
            收款单位：${payment?.payeeName || '-'}<br/>
            金额：${formatYi(payment?.amountYi || 0)}<br/>
            日期：${payment?.paymentDate || '-'}<br/>
            白名单：${payment?.whiteListStatus || '-'}<br/>
            合同号：${payment?.contractId || '未关联'}<br/>
            风险等级：${riskText(payment?.riskLevel || 'low')}
          </div>
        `
      }
      return params.data?.displayName || params.name
    },
  },
  series: [
    {
      type: 'sankey',
      left: 8,
      right: 8,
      top: 18,
      bottom: 8,
      emphasis: { focus: 'adjacency' },
      nodeGap: 18,
      draggable: true,
      animationDuration: 1200,
      data: sankeyNodes.value,
      links: visibleFlows.value.flatMap((flow) => buildFlowLinks(flow)),
      lineStyle: { curveness: 0.5, opacity: 0.35 },
      itemStyle: { borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 },
      label: { color: '#dfefff', fontSize: 11 },
    },
  ],
}))

const fundFlowEvents = {
  click: ({ dataType, data }) => {
    if (dataType === 'edge' && data?.paymentOrderId) {
      openPaymentDetail(data.paymentOrderId)
      return
    }
    if (dataType === 'node' && orgUnitMap[data?.id]?.unitType === 'company') {
      activeUnitId.value = data.id
    }
  },
}

watch(filteredPayments, (list) => {
  if (!list.some((item) => item.id === selectedPaymentId.value) && list[0]) {
    selectedPaymentId.value = list[0].id
  }
})

onMounted(() => {
  updateClock()
  clockTimer = window.setInterval(updateClock, 1000)
  refreshTimer = window.setInterval(updateRefreshText, 1000)
  animateKpis()
  runDemo()
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  window.clearInterval(refreshTimer)
  window.clearTimeout(toastTimer)
  demoTimers.forEach((timer) => window.clearTimeout(timer))
})

function updateClock() {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function updateRefreshText() {
  const match = refreshText.value.match(/(\d+)/)
  const next = match ? Number(match[1]) + 1 : 9
  refreshText.value = `数据已刷新 ${String(next).padStart(2, '0')} 秒前`
}

function animateKpis() {
  summaryCards.value.forEach((card) => {
    animatedMetrics.value[card.key] = 0
    const frames = 18
    const stepValue = Number(card.value) / frames
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      animatedMetrics.value[card.key] = count >= frames ? Number(card.value) : Number((stepValue * count).toFixed(1))
      if (count >= frames) window.clearInterval(timer)
    }, 40)
    demoTimers.push(timer)
  })
}

function displayMetric(card) {
  const value = animatedMetrics.value[card.key]
  if (value === undefined) return card.value
  if (card.unit === '亿元') return Number(value).toFixed(1)
  return Math.round(Number(value)).toLocaleString('zh-CN')
}

function sparklinePoints(values) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)
  return values.map((value, index) => {
    const x = (index / (values.length - 1 || 1)) * 140
    const y = 24 - ((value - min) / range) * 18
    return `${x},${y}`
  }).join(' ')
}

function unitBalance(unitId) {
  return DRP_BANK_ACCOUNT
    .filter((item) => item.orgUnitId === unitId)
    .reduce((sum, item) => sum + (balanceMap[item.id]?.balanceYi || 0), 0)
}

function pointColor(level) {
  return {
    critical: '#f53f3f',
    high: '#ff8800',
    medium: '#facc16',
    low: '#22c55e',
  }[level] || '#0ea5e9'
}

function sankeyNode(nodeId) {
  if (nodeId.startsWith('A')) {
    return { id: nodeId, name: nodeId, displayName: `${nodeId} 银行账户`, itemStyle: { color: '#22d3ee' } }
  }
  if (nodeId.startsWith('cp-')) {
    return { id: nodeId, name: nodeId, displayName: counterpartyMap[nodeId]?.name || nodeId, itemStyle: { color: pointColor(counterpartyMap[nodeId]?.riskLevel || 'medium') } }
  }
  return { id: nodeId, name: nodeId, displayName: orgUnitMap[nodeId]?.shortName || orgUnitMap[nodeId]?.unitName || nodeId, itemStyle: { color: pointColor(orgUnitMap[nodeId]?.riskLevel || 'low') } }
}

function buildFlowLinks(flow) {
  const chain = [...flow.sourceChain, flow.targetId]
  return chain.slice(0, -1).map((node, index) => {
    const selected = selectedPaymentId.value === flow.paymentOrderId
    const blocked = isBlocked(flow.paymentOrderId)
    const edgeColor = blocked || flow.paymentOrderId === demoPaymentId
      ? 'rgba(245,63,63,0.85)'
      : flow.riskLevel === 'high' || flow.riskLevel === 'critical'
        ? 'rgba(255,136,0,0.7)'
        : 'rgba(14,165,233,0.55)'
    return {
      source: chain[index],
      target: chain[index + 1],
      value: flow.amountYi,
      paymentOrderId: flow.paymentOrderId,
      lineStyle: {
        color: edgeColor,
        opacity: selected || blocked ? 0.95 : 0.5,
      },
    }
  })
}

function rowTone(item) {
  if (paymentStatus(item) === '已拦截' || item.whiteListStatus === '非白名单') return 'danger'
  if (paymentStatus(item) === '待审核' || item.riskLevel === 'medium') return 'warning'
  return 'safe'
}

function openPaymentDetail(paymentId) {
  selectedPaymentId.value = paymentId
  drawerVisible.value = true
}

function viewAnomalyDetail() {
  alertVisible.value = false
  openPaymentDetail(demoPaymentId)
}

function paymentStatus(item) {
  if (isBlocked(item.id)) return '已拦截'
  return item.paymentStatus
}

function isBlocked(paymentId) {
  return blockedPaymentIds.value.includes(paymentId)
}

function interceptPayment(paymentId) {
  if (!paymentId) return
  if (!isBlocked(paymentId)) {
    blockedPaymentIds.value = [...blockedPaymentIds.value, paymentId]
  }
  selectedPaymentId.value = paymentId
  drawerVisible.value = true
  alertVisible.value = false
  ensureRiskEvent(paymentId)
  ensureWorkOrder(paymentId)
  showToast('已拦截，已生成风险工单')
}

function ensureRiskEvent(paymentId) {
  if (generatedRiskEvents.value.some((item) => item.paymentOrderId === paymentId)) return
  generatedRiskEvents.value = [
    {
      id: 'RE-2026-0108',
      paymentOrderId: paymentId,
      riskId: 'R02',
      title: '异常支付自动拦截',
      status: '已拦截',
      level: 'critical',
      createdAt: '2026-04-18 09:18',
      reason: '收款方不在白名单，且未关联合同、审批链缺失。',
    },
    ...generatedRiskEvents.value,
  ]
}

function ensureWorkOrder(paymentId) {
  if (generatedWorkOrders.value.some((item) => item.paymentOrderId === paymentId)) return
  generatedWorkOrders.value = [
    {
      id: 'WO-2026-0031',
      paymentOrderId: paymentId,
      riskId: 'R02',
      title: '大额异常支付核查',
      status: '待派单',
      owner: '司库中心-赵某',
      due: '2026-05-10',
      sourceTable: 'drp_work_order',
    },
    ...generatedWorkOrders.value,
  ]
}

function openWorkOrder(payment) {
  const target = payment || selectedPayment.value
  if (!target) return
  ensureWorkOrder(target.id)
  emit('navigate', 'ai')
}

function openContract(payment) {
  const target = payment || selectedPayment.value
  if (!target) return
  const contractId = target.contractId || target.suggestedContractId
  if (!contractId) return
  emit('navigate', 'equity')
}

function openInvestment(payment) {
  const target = payment || selectedPayment.value
  if (!target?.projectId) return
  emit('navigate', 'invest')
}

function showToast(message) {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 2600)
}

function runDemo() {
  demoTimers.push(window.setTimeout(() => {
    activeUnitId.value = DRP_FUNDS_OVERVIEW.defaultUnitId
    selectedPaymentId.value = demoPaymentId
    alertVisible.value = true
  }, 2000))
  demoTimers.push(window.setTimeout(() => {
    interceptPayment(demoPaymentId)
  }, 3600))
}

function buildAiInsights(item, payee, contract, project, approvals, blocked) {
  const insights = [
    `支付对象为 ${payee?.name || '未知客商'}，白名单状态：${item.whiteListStatus}。`,
    `付款单 ${item.id} 金额 ${formatYi(item.amountYi)}，用途为"${item.purpose}"。`,
  ]
  if (!item.contractId) insights.push('未匹配到有效合同编号，需核验是否存在线下协议或拆单支付。')
  if (!approvals.some((approval) => approval.nodeName.includes('法务') && approval.status === '通过')) {
    insights.push('审批链未完成法务节点审核，违反大额支付合规要求。')
  }
  if (project?.id) insights.push(`资金用途疑似指向项目 ${project.name}（${project.id}），建议同步核对投资进度与合同挂接。`)
  if (blocked) insights.push('系统已执行拦截，风险事件和核查工单已自动写入闭环流程。')
  if (contract?.id && item.contractId) insights.push(`关联合同 ${contract.id} 已归档，可继续联动合同穿透核验付款条件。`)
  return insights
}

function riskText(level) {
  return riskTextMap[level] || '正常'
}

function riskClass(level) {
  return {
    critical: 'danger',
    high: 'medium',
    medium: 'watch',
    low: 'safe',
  }[level] || 'safe'
}

function whiteListClass(status) {
  if (status === '非白名单') return 'danger'
  if (status === '关注名单') return 'watch'
  return 'safe'
}

function statusClass(status) {
  if (status === '已拦截' || status === '异常') return 'danger'
  if (status === '待审核') return 'watch'
  return 'safe'
}

function approvalClass(status) {
  if (status === '通过' || status === '已提交') return 'safe'
  if (status === '待审批' || status === '待复核') return 'watch'
  return 'danger'
}

function formatYi(value) {
  return `${Number(value || 0).toFixed(2)}`
}
</script>

<style scoped>
/* ── Root cockpit layout ── */
.funds-screen {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 6px;
  overflow: hidden;
  color: #dff6ff;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 12px;
  position: relative;
}

/* ── Header ── */
.funds-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 10px;
  background: rgba(8, 18, 42, 0.72);
  border: 1px solid rgba(72, 162, 255, 0.18);
  border-radius: 3px;
}

/* ── KPI strip ── */
.funds-kpi-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
  height: 122px;
  align-items: stretch;
}

/* ── Body 三行布局 ── */
.funds-body {
  display: grid;
  grid-template-rows: 1fr 1fr 1.4fr;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

/* 中上：账户分布地图（全宽） */
.funds-row-map {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 6px 10px;
}

.map-chart {
  flex: 1;
  min-height: 0;
}

/* 中间：流向图谱 ＋ 拦截结构 */
.funds-row-mid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.funds-flow-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 6px 10px;
}

.flow-chart {
  flex: 1;
  min-height: 0;
}

.funds-intercept-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px;
}

/* 中下：支付流水（70%）＋ 风险说明（30%） */
.funds-row-bot {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.funds-row-bot > .table-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 6px 10px;
}

.funds-risk-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

/* Table scrolls inside panel */
.table-shell { flex: 1; min-height: 0; overflow-y: auto; overflow-x: auto; }

/* ── Glass panel base ── */
.glass-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(14, 165, 233, 0.24);
  background: linear-gradient(180deg, rgba(7, 20, 34, 0.92), rgba(7, 20, 34, 0.74));
  box-shadow: 0 22px 40px rgba(2, 12, 27, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  border-radius: 10px;
}

.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.06) 20%, transparent 42%);
  transform: translateX(-120%);
  animation: panel-shine 6s linear infinite;
  pointer-events: none;
}

/* ── Header internals ── */
.screen-kicker {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #7dd3fc;
}

.screen-title {
  margin: 1px 0;
  font-size: 12px;
  color: #f5fbff;
  text-shadow: 0 0 18px rgba(14, 165, 233, 0.28);
}

.screen-desc {
  display: none;
}

.topbar-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  min-width: 260px;
}

.meta-card {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(14, 165, 233, 0.22);
  background: rgba(4, 15, 26, 0.54);
}

.meta-card.success {
  border-color: rgba(34, 197, 94, 0.28);
}

.meta-label {
  display: block;
  color: #8db9d9;
  font-size: 10px;
  margin-bottom: 2px;
}

.meta-card strong {
  font-size: 12px;
  color: #f2fbff;
}

/* ── KPI cards ── */
.kpi-card {
  height: 100%;
  min-height: 0;
  padding: 3px 5px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 26px 44px rgba(2, 12, 27, 0.42);
}

.kpi-card.critical {
  border-color: rgba(245, 63, 63, 0.4);
}

.kpi-card.high {
  border-color: rgba(255, 136, 0, 0.38);
}

.kpi-head,
.kpi-foot,
.panel-head,
.drawer-head,
.bottom-actions,
.alert-actions,
.drawer-actions,
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.kpi-title,
.panel-sub,
.drawer-kicker,
.reason-title,
.detail-grid span,
.timeline-list span,
.approval-list span {
  color: #8db9d9;
  font-size: 10px;
}

.table-summary {
  color: #8db9d9;
  font-size: 11px;
  display: flex;
  gap: 12px;
}

.kpi-chip,
.tag,
.tag-pill,
.status-pill,
.risk-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  white-space: nowrap;
}

.kpi-chip {
  border: 1px solid rgba(14, 165, 233, 0.22);
  background: rgba(14, 165, 233, 0.1);
  color: #7dd3fc;
}

.kpi-main {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin: 2px 0 1px;
}

.kpi-main strong {
  font-size: 13px;
  line-height: 1;
  color: #f7fdff;
  text-shadow: 0 0 18px rgba(14, 165, 233, 0.24);
}

.kpi-main span {
  font-size: 9px;
  color: #9ec9ea;
}

.kpi-foot {
  font-size: 8px;
}

.kpi-trend {
  width: 100%;
  height: 14px;
  margin-top: 2px;
}

/* ── Chart panels ── */
.chart-panel,
.table-panel {
  padding: 5px 8px;
}

.panel-title {
  margin: 0;
  font-size: 13px;
  color: #f5fbff;
}

.panel-title.small {
  font-size: 12px;
}

.panel-sub {
  display: none;
}

.panel-head {
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.panel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  border: 1px solid transparent;
}

.tag.ok,
.tag-pill.safe,
.status-pill.safe,
.risk-pill.safe {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.22);
}

.tag.watch,
.tag-pill.watch,
.status-pill.watch,
.risk-pill.watch {
  color: #facc16;
  background: rgba(250, 204, 22, 0.14);
  border-color: rgba(250, 204, 22, 0.24);
}

.tag.medium,
.risk-pill.medium {
  color: #ff8800;
  background: rgba(255, 136, 0, 0.14);
  border-color: rgba(255, 136, 0, 0.24);
}

.tag.danger,
.tag-pill.danger,
.status-pill.danger,
.risk-pill.danger {
  color: #f53f3f;
  background: rgba(245, 63, 63, 0.14);
  border-color: rgba(245, 63, 63, 0.28);
}

.tag.focus {
  color: #7dd3fc;
  background: rgba(14, 165, 233, 0.12);
  border-color: rgba(14, 165, 233, 0.22);
}

.visual-chart {
  height: 100px;
  margin-top: 2px;
}

/* map/flow charts fill their flex container */
.map-chart,
.flow-chart {
  margin-top: 4px;
}

/* ── Table panel internals ── */
.table-head {
  margin-bottom: 4px;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 4px;
}

.filter-bar label {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #8db9d9;
  white-space: nowrap;
}

.filter-bar select {
  flex: 1;
  min-width: 0;
  height: 24px;
  padding: 0 6px;
  border-radius: 6px;
  border: 1px solid rgba(14, 165, 233, 0.18);
  background: rgba(4, 15, 26, 0.7);
  color: #e8f4ff;
  outline: none;
  font-size: 11px;
}

.payment-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
  min-width: 960px;
}

.payment-table th {
  padding: 4px 8px;
  text-align: center;
  font-size: 11px;
  color: #a7cbe7;
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.16), rgba(6, 182, 212, 0.08));
}

.payment-table th:first-child {
  border-radius: 6px 0 0 6px;
}

.payment-table th:last-child {
  border-radius: 0 6px 6px 0;
}

.payment-row td {
  padding: 5px 8px;
  text-align: center;
  font-size: 11px;
  background: rgba(8, 18, 30, 0.78);
  border-top: 1px solid rgba(14, 165, 233, 0.08);
  border-bottom: 1px solid rgba(14, 165, 233, 0.08);
  transition: transform 0.18s ease, background 0.18s ease;
}

.payment-row td:first-child {
  border-left: 1px solid rgba(14, 165, 233, 0.08);
  border-radius: 6px 0 0 6px;
}

.payment-row td:last-child {
  border-right: 1px solid rgba(14, 165, 233, 0.08);
  border-radius: 0 6px 6px 0;
}

.payment-row:hover td,
.payment-row.active td {
  transform: translateY(-1px);
  background: rgba(14, 28, 42, 0.92);
}

.payment-row.safe td {
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.06);
}

.payment-row.warning td {
  box-shadow: inset 0 0 0 1px rgba(255, 136, 0, 0.1);
}

.payment-row.danger td {
  box-shadow: inset 0 0 0 1px rgba(245, 63, 63, 0.16);
}

.align-left {
  text-align: left !important;
}

.mono {
  font-family: Consolas, Monaco, 'Courier New', monospace;
}

.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 4px;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 8px rgba(245, 63, 63, 0.7);
  animation: pulse 1.4s infinite;
}

.op-btn {
  height: 22px;
  padding: 0 6px;
  border-radius: 5px;
  border: 1px solid rgba(14, 165, 233, 0.22);
  background: rgba(8, 18, 30, 0.82);
  color: #eaf8ff;
  cursor: pointer;
  font-size: 10px;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.op-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(14, 165, 233, 0.42);
}

.op-btn.primary {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.24), rgba(245, 63, 63, 0.26));
  border-color: rgba(14, 165, 233, 0.38);
}

.op-btn.large {
  min-width: 100px;
  height: 30px;
  font-size: 12px;
}

/* ── Bottom cards ── */
.bottom-card {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.12);
  background: rgba(6, 14, 24, 0.62);
}

/* 新增截面内部面板样式 */
.funds-intercept-panel,
.funds-risk-panel {
  border-radius: 10px;
  border: 1px solid rgba(14, 165, 233, 0.2);
  background: linear-gradient(180deg, rgba(7, 20, 34, 0.92), rgba(7, 20, 34, 0.74));
  box-shadow: 0 8px 24px rgba(2, 12, 27, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

/* ── Thin scrollbars ── */
.funds-intercept-panel::-webkit-scrollbar,
.funds-risk-panel::-webkit-scrollbar,
.table-shell::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.funds-intercept-panel::-webkit-scrollbar-track,
.funds-risk-panel::-webkit-scrollbar-track,
.table-shell::-webkit-scrollbar-track {
  background: transparent;
}
.funds-intercept-panel::-webkit-scrollbar-thumb,
.funds-risk-panel::-webkit-scrollbar-thumb,
.table-shell::-webkit-scrollbar-thumb {
  background: rgba(14, 165, 233, 0.28);
  border-radius: 999px;
}

.result-metrics,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 4px;
}

.result-metrics div,
.detail-grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid rgba(14, 165, 233, 0.12);
  background: rgba(10, 22, 36, 0.72);
  font-size: 10px;
}

.result-metrics strong,
.detail-grid strong,
.approval-list strong,
.timeline-list strong {
  color: #f4fbff;
  font-size: 11px;
}

.result-metrics strong.success {
  color: #22c55e;
}

.result-metrics strong.danger {
  color: #f53f3f;
}

.timeline-list,
.approval-list,
.reason-list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
}

.timeline-list li,
.approval-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 0;
  border-bottom: 1px dashed rgba(14, 165, 233, 0.12);
  font-size: 11px;
}

.timeline-list em {
  font-style: normal;
  color: #7dd3fc;
}

.reason-box {
  margin-top: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(14, 165, 233, 0.12);
  background: rgba(8, 18, 30, 0.7);
  font-size: 11px;
}

.reason-list {
  margin-top: 4px;
  display: grid;
  gap: 4px;
}

.reason-list li {
  position: relative;
  padding-left: 14px;
  color: #dcefff;
  font-size: 11px;
  line-height: 1.6;
}

.reason-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 6px rgba(245, 63, 63, 0.65);
}

.bottom-actions {
  margin-top: 6px;
}

/* ── Alert / Drawer / Toast overlays ── */
.alert-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 10, 18, 0.62);
}

.alert-dialog {
  width: min(480px, calc(100vw - 32px));
  padding: 24px 26px;
  border-radius: 20px;
  border: 1px solid rgba(245, 63, 63, 0.42);
  background: linear-gradient(180deg, rgba(33, 8, 12, 0.96), rgba(16, 10, 18, 0.92));
  box-shadow: 0 20px 60px rgba(245, 63, 63, 0.16);
}

.alert-header {
  display: inline-flex;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(245, 63, 63, 0.14);
  color: #ff9e9e;
  font-size: 12px;
  margin-bottom: 12px;
}

.alert-dialog h3 {
  margin: 0;
  font-size: 24px;
  color: #fff3f3;
}

.alert-dialog p {
  margin: 12px 0 16px;
  color: #ffd4d4;
  line-height: 1.7;
}

.alert-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 35;
  width: min(520px, 92vw);
  height: 100vh;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(180deg, rgba(6, 16, 28, 0.98), rgba(6, 16, 28, 0.94));
  border-left: 1px solid rgba(14, 165, 233, 0.22);
  box-shadow: -18px 0 48px rgba(0, 0, 0, 0.34);
}

.drawer-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: #fff;
  cursor: pointer;
}

.drawer-section {
  margin-top: 18px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(14, 165, 233, 0.1);
  background: rgba(10, 22, 36, 0.72);
}

.section-title {
  margin-bottom: 12px;
  font-size: 15px;
  color: #f3fbff;
}

.approval-list li.safe strong,
.approval-list li.safe span {
  color: #99f6b1;
}

.approval-list li.watch strong,
.approval-list li.watch span {
  color: #fde68a;
}

.approval-list li.danger strong,
.approval-list li.danger span {
  color: #ffb3b3;
}

.ai-box {
  display: grid;
  gap: 10px;
}

.ai-box p {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(245, 63, 63, 0.08);
  border: 1px solid rgba(245, 63, 63, 0.16);
  color: #ffe1e1;
  line-height: 1.7;
}

.toast-banner {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 45;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(245, 63, 63, 0.9);
  color: #fff;
  font-size: 12px;
  box-shadow: 0 16px 34px rgba(245, 63, 63, 0.26);
}

/* ── Animations ── */
@keyframes panel-shine {
  to {
    transform: translateX(120%);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.alert-pop-enter-active,
.alert-pop-leave-active,
.drawer-slide-enter-active,
.drawer-slide-leave-active,
.toast-rise-enter-active,
.toast-rise-leave-active {
  transition: all 0.24s ease;
}

.alert-pop-enter-from,
.alert-pop-leave-to {
  opacity: 0;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateX(32px);
}

.toast-rise-enter-from,
.toast-rise-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

/* ════════════════════════════════════════════════
   WHITE THEME OVERRIDES
   ════════════════════════════════════════════════ */
.funds-screen {
  background: #f8fafc !important;
  color: #0f172a !important;
}

/* ── Panel / card backgrounds ── */
.glass-panel,
.funds-screen :deep(.page-backbar),
.funds-header,
.meta-card,
.table-shell,
.funds-intercept-panel,
.funds-risk-panel,
.bottom-card,
.detail-section,
.drawer,
.alert-dialog,
.reason-box,
.flow-detail-panel,
.account-detail-card,
.payment-detail-panel,
.risk-panel {
  background: #ffffff !important;
  border-color: #e2e8f0 !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06) !important;
  backdrop-filter: none !important;
}

.glass-panel::before,
.glass-panel::after {
  display: none !important;
}

/* ── Typography ── */
.screen-kicker,
.meta-label,
.panel-sub,
.kpi-foot,
.table-summary,
.reason-title,
.drawer-kicker,
.timeline-list li span,
.detail-grid span {
  color: #64748b !important;
}

.screen-title,
.panel-title,
.meta-card strong,
.kpi-title,
.kpi-main strong,
.result-metrics strong,
.reason-box p,
.timeline-list li strong,
.drawer h3,
.section-title,
.table-panel th,
.table-panel td {
  color: #0f172a !important;
  text-shadow: none !important;
}

.kpi-main span { color: #64748b !important; }

/* ── KPI cards ── */
.kpi-card {
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06) !important;
  border-color: #e2e8f0 !important;
}
.kpi-card.critical { border-color: #fca5a5 !important; }
.kpi-card.high     { border-color: #fed7aa !important; }

/* ── Tags / chips ── */
.kpi-chip {
  background: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1d4ed8 !important;
}

.tag         { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #475569 !important; }
.tag.ok      { background: #f0fdf4 !important; border-color: #bbf7d0 !important; color: #16a34a !important; }
.tag.watch   { background: #fefce8 !important; border-color: #fde68a !important; color: #ca8a04 !important; }
.tag.medium  { background: #fff7ed !important; border-color: #fed7aa !important; color: #f97316 !important; }
.tag.danger  { background: #fef2f2 !important; border-color: #fecaca !important; color: #ef4444 !important; }

.tag-pill, .status-pill { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #475569 !important; }
.white-list-pill        { background: #f0fdf4 !important; border-color: #bbf7d0 !important; color: #16a34a !important; }

.risk-pill          { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #475569 !important; }
.risk-pill.low      { background: #f0fdf4 !important; border-color: #bbf7d0 !important; color: #16a34a !important; }
.risk-pill.medium   { background: #fefce8 !important; border-color: #fde68a !important; color: #ca8a04 !important; }
.risk-pill.high     { background: #fff7ed !important; border-color: #fed7aa !important; color: #f97316 !important; }
.risk-pill.critical { background: #fef2f2 !important; border-color: #fecaca !important; color: #ef4444 !important; }

/* ── Table ── */
.payment-table thead th,
.table-panel thead th {
  background: #f1f5f9 !important;
  color: #475569 !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.payment-table tbody tr,
.payment-row,
.table-panel tbody tr {
  background: #ffffff !important;
  color: #334155 !important;
}

.payment-table th,
.payment-table td,
.table-panel th,
.table-panel td {
  border-bottom: 1px solid #f1f5f9 !important;
  color: #334155 !important;
}

.payment-row:hover,
.payment-row:hover td { background: #f8fafc !important; }
.payment-row.active,
.payment-row.active td { background: #eff6ff !important; }
.payment-row.intercepted,
.payment-row.intercepted td { background: #fef2f2 !important; }

/* ── Buttons / inputs ── */
.filter-bar select,
.filter-bar input {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #334155 !important;
}

.op-btn {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #475569 !important;
}

.op-btn:hover {
  background: #eff6ff !important;
  border-color: #93c5fd !important;
  color: #1d4ed8 !important;
}

/* ── AI / alert boxes ── */
.ai-box {
  background: #f0fdf4 !important;
  border-color: #bbf7d0 !important;
}

.ai-box p {
  background: #fff7ed !important;
  border-color: #fed7aa !important;
  color: #9a3412 !important;
}

.ai-box.critical {
  background: #fef2f2 !important;
  border-color: #fecaca !important;
}

/* ── Timeline ── */
.timeline-list li {
  background: #ffffff !important;
  border-color: #e2e8f0 !important;
  color: #334155 !important;
}

/* ── Toast ── */
.toast-banner {
  background: #ef4444 !important;
  color: #ffffff !important;
  border-color: #fca5a5 !important;
}
</style>
