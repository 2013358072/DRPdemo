<template>
  <div class="contract-screen">
    <PageBackBar title="合同穿透" @back="emit('navigate', 'dashboard')" />

    <div class="contract-layout">
      <transition name="toast-fade">
        <div v-if="warningBannerVisible" class="warning-toast">
          <span class="toast-dot" />
          <span>{{ warningBannerText }}</span>
        </div>
      </transition>

      <section class="overview-strip glass-panel">
        <article
          v-for="(kpi, index) in kpiCards"
          :key="kpi.label"
          class="kpi-card"
          :class="`status-${kpi.status}`"
        >
          <div class="kpi-head">
            <span class="kpi-label">{{ kpi.label }}</span>
            <span class="kpi-status">{{ statusTextMap[kpi.status] }}</span>
          </div>
          <div class="kpi-value-row">
            <div class="kpi-value-wrap">
              <span class="kpi-value">{{ formatAnimatedValue(animatedKpis[index], kpi.decimals) }}</span>
              <span class="kpi-unit">{{ kpi.unit }}</span>
            </div>
          </div>
          <div class="kpi-foot">
            <span class="kpi-sub">{{ kpi.sub }}</span>
            <svg class="kpi-sparkline" viewBox="0 0 120 28" preserveAspectRatio="none">
              <polyline
                :points="sparklinePoints(kpi.trend)"
                fill="none"
                :stroke="statusColorMap[kpi.status]"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                :cx="sparklineLastPoint(kpi.trend).x"
                :cy="sparklineLastPoint(kpi.trend).y"
                r="3"
                :fill="statusColorMap[kpi.status]"
              />
            </svg>
          </div>
        </article>
      </section>

      <section class="middle-zone" :class="{ collapsed: aiCollapsed }">
        <div class="left-main">
          <section class="distribution-shell glass-panel">
            <div class="section-head compact">
              <div>
                <h3>风险与状态分布</h3>
              </div>
              <div class="scene-tabs">
                <button
                  v-for="tab in sceneTabs"
                  :key="tab"
                  type="button"
                  class="scene-chip"
                  :class="{ active: activeScene === tab }"
                  @click="activeScene = tab"
                >
                  {{ tab }}
                </button>
              </div>
            </div>

            <div class="distribution-grid">
              <article class="distribution-card panel-lite">
                <div class="mini-title">合同风险等级分布</div>
                <div class="distribution-body">
                  <div class="legend-list vertical">
                    <button
                      type="button"
                      class="legend-chip"
                      :class="{ active: riskFilter === '全部' }"
                      @click="riskFilter = '全部'"
                    >
                      <span class="legend-dot all-dot" />
                      <span>全部</span>
                      <strong>{{ sceneFilteredContracts.length }}</strong>
                    </button>
                    <button
                      v-for="item in riskLegendLeftItems"
                      :key="item.name"
                      type="button"
                      class="legend-chip"
                      :class="{ active: riskFilter === item.name }"
                      @click="toggleRiskFilter(item.name)"
                    >
                      <span class="legend-dot" :style="{ background: item.color }" />
                      <span>{{ item.name }}</span>
                      <strong>{{ item.value }}</strong>
                    </button>
                  </div>
                  <div class="distribution-chart compact-chart">
                    <EChart :option="riskPieOption" />
                  </div>
                  <div class="legend-list vertical">
                    <button
                      v-for="item in riskLegendRightItems"
                      :key="item.name"
                      type="button"
                      class="legend-chip"
                      :class="{ active: riskFilter === item.name }"
                      @click="toggleRiskFilter(item.name)"
                    >
                      <span class="legend-dot" :style="{ background: item.color }" />
                      <span>{{ item.name }}</span>
                      <strong>{{ item.value }}</strong>
                    </button>
                  </div>
                </div>
              </article>

              <article class="distribution-card panel-lite">
                <div class="mini-title">合同履约状态分布</div>
                <div class="distribution-body">
                  <div class="legend-list vertical">
                    <button
                      type="button"
                      class="legend-chip"
                      :class="{ active: statusFilter === '全部' }"
                      @click="statusFilter = '全部'"
                    >
                      <span class="legend-dot all-dot" />
                      <span>全部</span>
                      <strong>{{ sceneFilteredContracts.length }}</strong>
                    </button>
                    <button
                      v-for="item in statusLegendLeftItems"
                      :key="item.name"
                      type="button"
                      class="legend-chip"
                      :class="{ active: statusFilter === item.name }"
                      @click="toggleStatusFilter(item.name)"
                    >
                      <span class="legend-dot" :style="{ background: item.color }" />
                      <span>{{ item.name }}</span>
                      <strong>{{ item.value }}</strong>
                    </button>
                  </div>
                  <div class="distribution-chart compact-chart">
                    <EChart :option="statusPieOption" />
                  </div>
                  <div class="legend-list vertical">
                    <button
                      v-for="item in statusLegendRightItems"
                      :key="item.name"
                      type="button"
                      class="legend-chip"
                      :class="{ active: statusFilter === item.name }"
                      @click="toggleStatusFilter(item.name)"
                    >
                      <span class="legend-dot" :style="{ background: item.color }" />
                      <span>{{ item.name }}</span>
                      <strong>{{ item.value }}</strong>
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section class="list-shell glass-panel">
            <div class="section-head list-head">
              <div>
                <h3>合同主列表</h3>
                <p>默认锁定演示合同 {{ defaultContractId }}，高风险整行高亮，支持滚动与点击下钻</p>
              </div>
              <div class="list-tools">
                <div class="filter-summary">
                  <span>风险筛选：{{ riskFilter }}</span>
                  <span>状态筛选：{{ statusFilter }}</span>
                </div>
                <input
                  v-model.trim="keyword"
                  class="search-input"
                  type="text"
                  placeholder="搜索合同编号 / 名称 / 合作方"
                />
              </div>
            </div>

            <div class="table-scroll" ref="tableScrollRef">
              <table class="contract-table">
                <thead>
                  <tr>
                    <th>合同编号</th>
                    <th>名称</th>
                    <th>签约单位</th>
                    <th>合作方</th>
                    <th>金额</th>
                    <th>签订日期</th>
                    <th>风险等级</th>
                    <th>履约状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="contract in filteredContracts"
                    :key="contract.id"
                    :data-contract-id="contract.id"
                    class="table-row"
                    :class="[
                      `risk-${contract.riskLevel}`,
                      { selected: contract.id === selectedContractId, abnormal: contract.riskLevel === 'high' }
                    ]"
                    @click="selectContract(contract, false)"
                  >
                    <td>
                      <div class="contract-id-cell">
                        <span>{{ contract.id }}</span>
                        <em v-if="contract.id === defaultContractId">默认演示</em>
                      </div>
                    </td>
                    <td>{{ contract.name }}</td>
                    <td>{{ contract.company }}</td>
                    <td>{{ contract.supplier }}</td>
                    <td>{{ contract.amountYi.toFixed(2) }} 亿元</td>
                    <td>{{ contract.signDate }}</td>
                    <td>
                      <span class="risk-pill" :class="`risk-${contract.riskLevel}`">
                        {{ riskLabelMap[contract.riskLevel] }}
                      </span>
                    </td>
                    <td>
                      <span class="status-pill" :class="statusClass(contract.status)">
                        {{ contract.status }}
                      </span>
                    </td>
                    <td>
                      <div class="row-actions">
                        <button type="button" class="tiny-btn" @click.stop="selectContract(contract, false)">AI解析</button>
                        <button type="button" class="tiny-btn ghost" @click.stop="focusProgress(contract)">履约图</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!filteredContracts.length">
                    <td colspan="9" class="empty-cell">当前筛选条件下暂无合同，请切换图例或搜索条件。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside v-if="!aiCollapsed" class="ai-center glass-panel">
          <section class="ai-block base-block panel-lite">
            <div class="section-head compact no-bottom">
              <div>
                <h3>AI 智能解析中心</h3>
                <p>围绕当前选中合同进行自动解析与风险研判</p>
              </div>
              <button type="button" class="collapse-btn" @click="toggleAiPanel(true)">收起面板</button>
            </div>
            <div class="base-grid">
              <div class="base-item"><span>合同名称</span><strong>{{ selectedBasicInfo.name }}</strong></div>
              <div class="base-item"><span>合同编号</span><strong>{{ selectedBasicInfo.id }}</strong></div>
              <div class="base-item"><span>合同金额</span><strong>{{ selectedBasicInfo.amount }}</strong></div>
              <div class="base-item"><span>供应商</span><strong>{{ selectedBasicInfo.supplier }}</strong></div>
              <div class="base-item"><span>签订日期</span><strong>{{ selectedBasicInfo.signDate }}</strong></div>
              <div class="base-item"><span>付款方式</span><strong>{{ selectedBasicInfo.paymentMethod }}</strong></div>
              <div class="base-item">
                <span>质保金状态</span>
                <strong :class="{ warn: selectedBasicInfo.warranty.includes('未') }">{{ selectedBasicInfo.warranty }}</strong>
              </div>
              <div class="base-item">
                <span>法务审核</span>
                <strong :class="{ warn: selectedBasicInfo.legalReview.includes('未') || selectedBasicInfo.legalReview.includes('待') }">
                  {{ selectedBasicInfo.legalReview }}
                </strong>
              </div>
            </div>
          </section>

          <section class="ai-block clause-block panel-lite">
            <div class="block-title-row">
              <div>
                <h4>合同原文 + 风险条款标红</h4>
                <p>条款逐条自动高亮，支持滚动查看全文</p>
              </div>
              <span class="analysis-chip">{{ revealedClauseCount }}/{{ selectedClauses.length }}</span>
            </div>
            <div class="clause-scroll">
              <article
                v-for="(clause, index) in selectedClauses"
                :key="clause.article"
                class="clause-card"
                :class="{
                  risk: clause.risk,
                  active: index < revealedClauseCount,
                  muted: demoRunning && index >= revealedClauseCount
                }"
              >
                <div class="clause-head">
                  <span class="clause-article">{{ clause.article }}</span>
                  <span v-if="clause.tag" class="risk-pill" :class="clause.risk ? 'risk-high' : 'risk-watch'">
                    {{ clause.tag }}
                  </span>
                </div>
                <p class="clause-text">{{ clause.text }}</p>
              </article>
            </div>
          </section>

          <section class="ai-block compliance-block panel-lite">
            <div class="block-title-row">
              <div>
                <h4>合规依据 + AI 研判结论</h4>
                <p>结构化呈现违规依据、整改建议与总判断</p>
              </div>
              <span class="analysis-chip strong">{{ selectedConclusion.level }}</span>
            </div>
            <div class="compliance-list">
              <article
                v-for="(item, index) in selectedCompliance"
                :key="item.violated"
                class="compliance-item"
                :class="{ visible: index < revealedComplianceCount }"
              >
                <div class="compliance-head">
                  <span class="risk-pill" :class="complianceLevelClass(item.level)">{{ item.level }}</span>
                  <span class="compliance-violated">{{ item.violated }}</span>
                </div>
                <div class="compliance-body">
                  <p><strong>内控依据：</strong>{{ item.rule }}</p>
                  <p><strong>依据说明：</strong>{{ item.basis }}</p>
                  <p><strong>整改建议：</strong>{{ item.suggestion }}</p>
                </div>
              </article>
            </div>
            <div class="ai-conclusion">
              <div class="conclusion-title">AI 研判结论</div>
              <ul>
                <li v-for="line in selectedConclusion.summary" :key="line">{{ line }}</li>
              </ul>
              <p class="conclusion-advice">{{ selectedConclusion.advice }}</p>
            </div>
          </section>

          <section class="ai-block action-block panel-lite">
            <div class="block-title-row compact-actions">
              <div>
                <h4>操作按钮区</h4>
                <p>支持下钻查看、预警联动与面板收起</p>
              </div>
              <span class="action-feedback">{{ actionFeedback }}</span>
            </div>
            <div class="action-grid">
              <button type="button" class="action-btn" @click="focusProgress(selectedContract)">查看履约</button>
              <button type="button" class="action-btn" @click="showActionBanner('已联动查看关联支付路径')">查看关联支付</button>
              <button type="button" class="action-btn warning" @click="triggerWarning('检测到高风险合同，已生成预警工单')">
                发起预警
              </button>
              <button type="button" class="action-btn primary" :class="{ pulse: dispatchPulse }" @click="dispatchWorkOrder">
                派发工单
              </button>
              <button type="button" class="action-btn collapse" @click="toggleAiPanel(true)">收起面板</button>
            </div>
          </section>
        </aside>

        <button v-else type="button" class="expand-tab" @click="toggleAiPanel(false)">
          <span>AI 智能解析中心</span>
          <small>展开</small>
        </button>
      </section>

      <section class="progress-shell glass-panel" ref="progressSectionRef">
        <div class="section-head compact">
          <div>
            <h3>履约进度对比可视化</h3>
            <p>双轴折线 + 柱状组合图，异常区域自动高亮预警</p>
          </div>
          <div class="progress-stats">
            <span>交付进度 {{ selectedContract.deliveryProgress }}%</span>
            <span>付款进度 {{ selectedContract.paymentProgress }}%</span>
            <span>累计付款 {{ selectedContract.amountYi.toFixed(2) }} 亿元</span>
          </div>
        </div>
        <div class="progress-chart-wrap">
          <EChart :option="progressOption" />
          <div class="progress-alert" :class="{ active: progressAlertVisible }">超进度付款风险 → 已自动预警</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EChart from '@/components/EChart.vue'
import PageBackBar from '@/components/PageBackBar.vue'
import { CONTRACT_COMMAND_CENTER } from '@/mock/index.js'

const emit = defineEmits(['navigate'])

const statusColorMap = {
  normal: '#0ea5e9',
  high: '#f53f3f',
  watch: '#facc16',
  medium: '#ff8800',
}

const statusTextMap = {
  normal: '实时正常',
  high: '红色高亮',
  watch: '法务关注',
  medium: '预警中',
}

const riskLabelMap = {
  high: '高风险',
  medium: '中风险',
  watch: '关注',
  normal: '正常',
}

const statusClassMap = {
  正常履约: 'status-normal',
  待审核: 'status-watch',
  已逾期: 'status-medium',
  预警中: 'status-high',
  已归档: 'status-archive',
}

const commandCenter = CONTRACT_COMMAND_CENTER
const sceneTabs = ['全部', ...commandCenter.sceneTabs]
const contracts = commandCenter.contracts
const defaultContractId = commandCenter.defaultContractId

const activeScene = ref('全部')
const riskFilter = ref('全部')
const statusFilter = ref('全部')
const keyword = ref('')
const selectedContractId = ref(defaultContractId)
const aiCollapsed = ref(true)
const warningBannerVisible = ref(false)
const warningBannerText = ref('检测到高风险合同，已生成预警工单')
const progressAlertVisible = ref(false)
const dispatchPulse = ref(false)
const demoRunning = ref(false)
const revealedClauseCount = ref(0)
const revealedComplianceCount = ref(0)
const actionFeedback = ref('自动演示已就绪')
const animatedKpis = ref(commandCenter.kpis.map(() => 0))
const tableScrollRef = ref(null)
const progressSectionRef = ref(null)

let bannerTimer = null
let kpiFrame = 0
const demoTimers = []

const kpiCards = commandCenter.kpis.map((item) => ({
  ...item,
  decimals: item.label === '合同总金额' ? 2 : 0,
  sub:
    item.label === '合同总金额'
      ? '近 6 个月持续上升'
      : item.label === '高风险合同'
        ? '自动联动预警工单'
        : item.label === '待法务审核'
          ? '等待法务前置审查'
          : item.label === '逾期履约合同'
            ? '需要履约纠偏'
            : item.label === '本月新增合同'
              ? '合同新增保持增长'
              : '集团合同库实时汇总',
}))

const selectedContract = computed(() => {
  return contracts.find((item) => item.id === selectedContractId.value) || contracts[0]
})

const selectedDetail = computed(() => {
  const detail = commandCenter.contractDetails[selectedContract.value.id]
  if (detail) return detail
  return {
    basicInfo: {
      name: selectedContract.value.name,
      id: selectedContract.value.id,
      amount: `${selectedContract.value.amountYi.toFixed(2)} 亿元`,
      supplier: selectedContract.value.supplier,
      signDate: selectedContract.value.signDate,
      cycle: selectedContract.value.cycle,
      paymentMethod: selectedContract.value.paymentMethod,
      warranty: selectedContract.value.warrantyStatus,
      legalReview: selectedContract.value.legalReview,
    },
    clauses: selectedContract.value.abnormal.map((item, index) => ({
      article: `风险提示 ${index + 1}`,
      text: item,
      risk: true,
      tag: '关注',
    })),
    compliance: [
      {
        level: '关注',
        violated: '履约信息待补充',
        rule: '需结合集团合同制度进一步核查',
        basis: '当前为演示合同，建议补充更完整的履约台账信息。',
        suggestion: '补录台账并发起法务复核。',
      },
    ],
    conclusion: {
      level: '自动研判',
      summary: ['该合同已纳入 AI 智能解析范围，建议持续跟踪履约与付款偏差。'],
      advice: '继续监测合同条款、付款节点与供应商履约行为。',
    },
  }
})

const selectedBasicInfo = computed(() => selectedDetail.value.basicInfo)
const selectedClauses = computed(() => selectedDetail.value.clauses || [])
const selectedCompliance = computed(() => selectedDetail.value.compliance || [])
const selectedConclusion = computed(() => selectedDetail.value.conclusion || { level: '', summary: [], advice: '' })

const sceneFilteredContracts = computed(() => {
  return contracts.filter((item) => {
    const matchScene = activeScene.value === '全部' || item.scene === activeScene.value
    const matchKeyword =
      !keyword.value ||
      [item.id, item.name, item.supplier, item.company].some((field) => field.includes(keyword.value))
    return matchScene && matchKeyword
  })
})

const riskLegendItems = computed(() => {
  const countMap = { 高风险: 0, 中风险: 0, 关注: 0, 正常: 0 }
  sceneFilteredContracts.value.forEach((item) => {
    countMap[riskLabelMap[item.riskLevel]] += 1
  })
  return commandCenter.riskDistribution.map((item) => ({
    ...item,
    value: countMap[item.name] ?? 0,
  }))
})

const riskLegendLeftItems = computed(() => {
  const splitIndex = Math.ceil(riskLegendItems.value.length / 2)
  return riskLegendItems.value.slice(0, splitIndex)
})

const riskLegendRightItems = computed(() => {
  const splitIndex = Math.ceil(riskLegendItems.value.length / 2)
  return riskLegendItems.value.slice(splitIndex)
})

const statusLegendItems = computed(() => {
  const countMap = {
    正常履约: 0,
    待审核: 0,
    已逾期: 0,
    预警中: 0,
    已归档: 0,
  }
  sceneFilteredContracts.value.forEach((item) => {
    countMap[item.status] += 1
  })
  return commandCenter.statusDistribution.map((item) => ({
    ...item,
    value: countMap[item.name] ?? 0,
  }))
})

const statusLegendLeftItems = computed(() => {
  const splitIndex = Math.ceil(statusLegendItems.value.length / 2)
  return statusLegendItems.value.slice(0, splitIndex)
})

const statusLegendRightItems = computed(() => {
  const splitIndex = Math.ceil(statusLegendItems.value.length / 2)
  return statusLegendItems.value.slice(splitIndex)
})

const filteredContracts = computed(() => {
  return sceneFilteredContracts.value.filter((item) => {
    const matchRisk = riskFilter.value === '全部' || riskLabelMap[item.riskLevel] === riskFilter.value
    const matchStatus = statusFilter.value === '全部' || item.status === statusFilter.value
    return matchRisk && matchStatus
  })
})

const riskPieOption = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 900,
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 份 ({d}%)' },
  series: [
    {
      type: 'pie',
      radius: ['38%', '60%'],
      center: ['50%', '36%'],
      startAngle: 110,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: {
        borderColor: '#081426',
        borderWidth: 3,
        shadowBlur: 16,
        shadowColor: 'rgba(14,165,233,0.18)',
      },
      data: riskLegendItems.value,
    },
  ],
  graphic: [
    {
      type: 'group',
      left: 'center',
      top: '20%',
      children: [
        {
          type: 'text',
          style: {
            text: String(sceneFilteredContracts.value.length),
            fill: '#eef8ff',
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          top: 24,
          style: {
            text: '合同总量',
            fill: '#7cb4d8',
            fontSize: 10,
            textAlign: 'center',
          },
        },
      ],
    },
  ],
}))

const statusPieOption = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 900,
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 份 ({d}%)' },
  series: [
    {
      type: 'pie',
      radius: ['34%', '58%'],
      center: ['50%', '36%'],
      startAngle: 120,
      roseType: 'radius',
      label: { show: false },
      labelLine: { show: false },
      itemStyle: {
        borderColor: '#081426',
        borderWidth: 3,
      },
      data: statusLegendItems.value,
    },
  ],
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: '26%',
      style: {
        text: selectedContract.value.status,
        fill: '#eef8ff',
        fontSize: 12,
        fontWeight: 600,
      },
    },
  ],
}))

const progressData = computed(() => {
  if (selectedContract.value.id === defaultContractId) {
    return {
      nodes: commandCenter.progressNodes,
      delivery: commandCenter.progressDelivery,
      payment: commandCenter.progressPayment,
      amount: commandCenter.progressAmountYi,
    }
  }

  const nodes = commandCenter.progressNodes
  const basePercent = [0, 18, 36, 54, 72, 100]
  const delivery = basePercent.map((value) => Math.round((value * selectedContract.value.deliveryProgress) / 100))
  const payment = basePercent.map((value) => Math.min(100, Math.round((value * selectedContract.value.paymentProgress) / 100)))
  const amount = payment.map((value) => Number(((value / 100) * selectedContract.value.amountYi).toFixed(2)))
  return { nodes, delivery, payment, amount }
})

const progressOption = computed(() => ({
  backgroundColor: 'transparent',
  animationDuration: 1400,
  animationEasing: 'cubicOut',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross', crossStyle: { color: '#4cc9f0' } },
  },
  legend: {
    top: 2,
    right: 0,
    itemWidth: 12,
    itemHeight: 8,
    textStyle: { color: '#9fc8e4', fontSize: 11 },
    data: ['累计付款金额', '交付进度', '付款进度'],
  },
  grid: { left: 42, right: 52, top: 26, bottom: 26 },
  xAxis: {
    type: 'category',
    data: progressData.value.nodes,
    axisLine: { lineStyle: { color: 'rgba(125,197,255,0.25)' } },
    axisLabel: { color: '#9fc8e4', fontSize: 11 },
  },
  yAxis: [
    {
      type: 'value',
      name: '进度 %',
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLabel: { color: '#9fc8e4', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(110,173,255,0.10)' } },
      nameTextStyle: { color: '#7cb4d8' },
    },
    {
      type: 'value',
      name: '金额 亿元',
      min: 0,
      axisLabel: { color: '#9fc8e4', formatter: '{value}' },
      splitLine: { show: false },
      nameTextStyle: { color: '#7cb4d8' },
    },
  ],
  series: [
    {
      name: '累计付款金额',
      type: 'bar',
      yAxisIndex: 1,
      barWidth: 22,
      data: progressData.value.amount,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,136,0,0.9)' },
          { offset: 1, color: 'rgba(255,136,0,0.18)' },
        ]),
      },
      label: {
        show: true,
        position: 'top',
        color: '#ffd7a1',
        fontSize: 10,
        formatter: '{c}',
      },
      markArea:
        selectedContract.value.paymentProgress > selectedContract.value.deliveryProgress
          ? {
              silent: true,
              itemStyle: { color: 'rgba(245,63,63,0.12)' },
              data: [[{ xAxis: progressData.value.nodes[1] }, { xAxis: progressData.value.nodes[5] }]],
            }
          : undefined,
    },
    {
      name: '交付进度',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: progressData.value.delivery,
      itemStyle: { color: '#0ea5e9' },
      lineStyle: { width: 3, color: '#0ea5e9' },
      label: { show: true, color: '#bce8ff', fontSize: 10, formatter: '{c}%' },
    },
    {
      name: '付款进度',
      type: 'line',
      smooth: true,
      symbol: 'diamond',
      symbolSize: 8,
      data: progressData.value.payment,
      itemStyle: { color: '#ff8800' },
      lineStyle: { width: 3, color: '#ff8800' },
      label: { show: true, color: '#ffd7a1', fontSize: 10, formatter: '{c}%' },
    },
  ],
}))

function statusClass(status) {
  return statusClassMap[status] || 'status-normal'
}

function complianceLevelClass(level) {
  if (level.includes('高')) return 'risk-high'
  if (level.includes('中')) return 'risk-medium'
  if (level.includes('关')) return 'risk-watch'
  return 'risk-normal'
}

function toggleRiskFilter(name) {
  riskFilter.value = riskFilter.value === name ? '全部' : name
}

function toggleStatusFilter(name) {
  statusFilter.value = statusFilter.value === name ? '全部' : name
}

function selectContract(contract, fromAuto) {
  selectedContractId.value = contract.id
  aiCollapsed.value = fromAuto ? true : false
  progressAlertVisible.value = contract.paymentProgress > contract.deliveryProgress
  if (!fromAuto) {
    revealedClauseCount.value = selectedClauses.value.length
    revealedComplianceCount.value = selectedCompliance.value.length
    dispatchPulse.value = false
    actionFeedback.value = `已切换到 ${contract.id}`
    showActionBanner(`已定位合同 ${contract.id}`)
  }
  nextTick(() => {
    scrollToSelectedRow(contract.id)
  })
}

function toggleAiPanel(collapsed) {
  aiCollapsed.value = collapsed
  actionFeedback.value = collapsed ? 'AI 面板已收起，左侧列表自动扩展' : 'AI 面板已展开'
}

function showActionBanner(text) {
  warningBannerText.value = text
  warningBannerVisible.value = true
  window.clearTimeout(bannerTimer)
  bannerTimer = window.setTimeout(() => {
    warningBannerVisible.value = false
  }, 2600)
}

function triggerWarning(text) {
  dispatchPulse.value = true
  progressAlertVisible.value = true
  actionFeedback.value = '已发起预警联动'
  showActionBanner(text)
}

function dispatchWorkOrder() {
  dispatchPulse.value = false
  actionFeedback.value = '工单已派发至法务与采购协同处理'
  showActionBanner(`合同 ${selectedContract.value.id} 的预警工单已派发`)
}

function focusProgress(contract) {
  if (contract && contract.id !== selectedContractId.value) {
    selectContract(contract, false)
  }
  progressAlertVisible.value = true
  actionFeedback.value = '已联动定位履约对比图'
  nextTick(() => {
    progressSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function scrollToSelectedRow(id) {
  const host = tableScrollRef.value
  if (!host) return
  const row = host.querySelector(`[data-contract-id="${id}"]`)
  row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function sparklinePoints(values) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const height = 24
  const width = 120
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width
      const y = max === min ? height / 2 : height - ((value - min) / (max - min)) * height
      return `${x},${y}`
    })
    .join(' ')
}

function sparklineLastPoint(values) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const height = 24
  const width = 120
  const value = values[values.length - 1]
  return {
    x: width,
    y: max === min ? height / 2 : height - ((value - min) / (max - min)) * height,
  }
}

function formatAnimatedValue(value, decimals) {
  return Number(value).toFixed(decimals)
}

function startKpiAnimation() {
  const start = performance.now()
  const duration = 1200
  const targets = kpiCards.map((item) => item.value)

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    animatedKpis.value = targets.map((target) => Number((target * progress).toFixed(2)))
    if (progress < 1) {
      kpiFrame = window.requestAnimationFrame(tick)
    }
  }

  window.cancelAnimationFrame(kpiFrame)
  kpiFrame = window.requestAnimationFrame(tick)
}

function resetDemoState() {
  demoTimers.forEach((timer) => window.clearTimeout(timer))
  demoTimers.length = 0
  demoRunning.value = false
  revealedClauseCount.value = selectedClauses.value.length
  revealedComplianceCount.value = selectedCompliance.value.length
  dispatchPulse.value = false
}

function scheduleDemo(delay, callback) {
  const timer = window.setTimeout(callback, delay)
  demoTimers.push(timer)
}

function runAutoDemo() {
  resetDemoState()
  demoRunning.value = true
  activeScene.value = '全部'
  riskFilter.value = '全部'
  statusFilter.value = '全部'
  keyword.value = ''
  selectedContractId.value = defaultContractId
  aiCollapsed.value = true
  progressAlertVisible.value = false
  revealedClauseCount.value = 0
  revealedComplianceCount.value = 0
  dispatchPulse.value = false
  actionFeedback.value = 'AI 面板已收起，左侧列表自动扩展'

  scheduleDemo(2000, async () => {
    const target = contracts.find((item) => item.id === defaultContractId)
    if (!target) return
    selectContract(target, true)
    await nextTick()
    scrollToSelectedRow(defaultContractId)
    actionFeedback.value = `已自动定位高风险合同 ${defaultContractId}`

    selectedClauses.value.forEach((_, index) => {
      scheduleDemo(2400 + index * 360, () => {
        revealedClauseCount.value = index + 1
      })
    })

    selectedCompliance.value.forEach((_, index) => {
      scheduleDemo(3400 + index * 420, () => {
        revealedComplianceCount.value = index + 1
      })
    })

    scheduleDemo(4200, () => {
      progressAlertVisible.value = true
      actionFeedback.value = '履约异常区域已自动高亮'
    })

    scheduleDemo(4800, () => {
      triggerWarning('检测到高风险合同，已生成预警工单')
    })

    scheduleDemo(5200, () => {
      dispatchPulse.value = true
      actionFeedback.value = '请点击“派发工单”完成演示闭环'
      demoRunning.value = false
    })
  })
}

watch(
  filteredContracts,
  (list) => {
    if (!list.length) return
    const exists = list.some((item) => item.id === selectedContractId.value)
    if (!exists) {
      selectedContractId.value = list[0].id
    }
  },
  { immediate: true }
)

watch(selectedContractId, () => {
  if (!demoRunning.value) {
    revealedClauseCount.value = selectedClauses.value.length
    revealedComplianceCount.value = selectedCompliance.value.length
  }
})

onMounted(() => {
  startKpiAnimation()
  progressAlertVisible.value = selectedContract.value.paymentProgress > selectedContract.value.deliveryProgress
  revealedClauseCount.value = selectedClauses.value.length
  revealedComplianceCount.value = selectedCompliance.value.length
  nextTick(() => {
    scrollToSelectedRow(defaultContractId)
  })
  runAutoDemo()
})

onBeforeUnmount(() => {
  resetDemoState()
  window.clearTimeout(bannerTimer)
  window.cancelAnimationFrame(kpiFrame)
})
</script>

<style scoped>
.contract-screen {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 6px;
  color: #eef8ff;
}

.contract-layout {
  position: relative;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(60px, 7%) minmax(0, 67%) minmax(180px, 26%);
  gap: 4px;
}

.glass-panel,
.panel-lite {
  position: relative;
  border: 1px solid rgba(62, 140, 220, 0.38);
  background:
    linear-gradient(180deg, rgba(7, 24, 46, 0.94), rgba(4, 16, 34, 0.92)),
    rgba(6, 18, 36, 0.88);
  box-shadow:
    inset 0 0 0 1px rgba(10, 180, 255, 0.06),
    0 18px 34px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  overflow: hidden;
}

.glass-panel::before,
.panel-lite::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.12), transparent 24%, transparent 76%, rgba(6, 182, 212, 0.12));
  pointer-events: none;
}

.overview-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
}

.kpi-card {
  position: relative;
  min-width: 0;
  padding: 4px 6px 4px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(8, 28, 54, 0.92), rgba(4, 18, 37, 0.9));
  border: 1px solid rgba(71, 134, 214, 0.28);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 2px;
}

.kpi-card::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.75;
}

.kpi-card.status-high { color: #f53f3f; }
.kpi-card.status-medium { color: #ff8800; }
.kpi-card.status-watch { color: #facc16; }
.kpi-card.status-normal { color: #06b6d4; }

.kpi-head,
.kpi-foot,
.section-head,
.block-title-row,
.kpi-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-label {
  color: #d8f2ff;
  font-size: 10px;
  font-weight: 600;
}

.kpi-status,
.analysis-chip,
.action-feedback {
  flex-shrink: 0;
  padding: 1px 5px;
  border-radius: 999px;
  font-size: 8px;
  color: #d3ebff;
  background: rgba(10, 132, 255, 0.16);
  border: 1px solid rgba(10, 132, 255, 0.2);
}

.analysis-chip.strong {
  background: rgba(245, 63, 63, 0.14);
  border-color: rgba(245, 63, 63, 0.3);
}

.kpi-value-wrap {
  display: inline-flex;
  align-items: flex-end;
}

.kpi-value {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
}

.kpi-unit {
  margin-left: 4px;
  color: #8ccff1;
  font-size: 9px;
}

.kpi-sub {
  color: #7ca9c5;
  font-size: 8px;
}

.kpi-sparkline {
  width: 78px;
  height: 16px;
  opacity: 0.95;
}

.middle-zone {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 65fr) minmax(300px, 35fr);
  gap: 4px;
}

.middle-zone.collapsed {
  grid-template-columns: minmax(0, 1fr) 48px;
}

.left-main {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(96px, 21%) minmax(0, 79%);
  gap: 4px;
}

.distribution-shell,
.list-shell,
.ai-center {
  padding: 5px 6px;
}

.distribution-shell {
  min-height: 96px;
}

.distribution-shell,
.list-shell,
.ai-center,
.progress-shell,
.distribution-card,
.ai-block {
  min-height: 0;
}

.section-head {
  margin-bottom: 4px;
}

.section-head.compact {
  margin-bottom: 2px;
}

.section-head.no-bottom {
  margin-bottom: 2px;
}

.section-head h3,
.block-title-row h4 {
  margin: 0;
  font-size: 11px;
  color: #eff9ff;
  font-weight: 700;
}

.section-head p,
.block-title-row p {
  margin: 2px 0 0;
  font-size: 8px;
  color: #77abc9;
}

.scene-tabs,
.legend-list,
.progress-stats,
.filter-summary,
.base-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.scene-chip,
.legend-chip,
.tiny-btn,
.collapse-btn,
.action-btn,
.expand-tab,
.search-input {
  border: 1px solid rgba(98, 164, 230, 0.22);
  background: rgba(8, 30, 58, 0.82);
  color: #dcefff;
}

.scene-chip,
.legend-chip,
.tiny-btn,
.collapse-btn,
.action-btn,
.expand-tab {
  cursor: pointer;
  transition: 0.18s ease;
}

.scene-chip {
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 9px;
}

.scene-chip.active,
.legend-chip.active,
.tiny-btn:hover,
.collapse-btn:hover,
.action-btn:hover,
.expand-tab:hover {
  border-color: rgba(14, 165, 233, 0.5);
  background: rgba(14, 165, 233, 0.18);
  box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.08) inset;
}

.distribution-grid {
  height: calc(100% - 42px);
  min-height: 110px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.distribution-card {
  padding: 5px 6px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(9, 29, 53, 0.9), rgba(5, 20, 38, 0.9));
  border: 1px solid rgba(78, 140, 216, 0.25);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 2px;
}

.mini-title {
  font-size: 9px;
  font-weight: 600;
  color: #d9f2ff;
}

.distribution-body {
  min-height: 0;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 64px;
  gap: 3px;
  align-items: start;
}

.distribution-chart {
  min-height: 0;
}

.compact-chart {
  min-height: 96px;
  height: 100%;
}

.legend-chip {
  align-items: center;
  display: inline-flex;
  gap: 4px;
  padding: 2px 5px;
  border-radius: 999px;
  font-size: 8px;
}

.legend-list.vertical {
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: center;
}

.legend-list.vertical .legend-chip {
  width: 100%;
  justify-content: flex-start;
}

.legend-list.vertical .legend-chip strong {
  margin-left: auto;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.all-dot {
  background: #53d6ff;
}

.list-head {
  gap: 8px;
}

.list-tools {
  display: grid;
  gap: 4px;
  justify-items: end;
}

.filter-summary {
  justify-content: flex-end;
  color: #7eaed0;
  font-size: 9px;
}

.search-input {
  width: 240px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  outline: none;
  font-size: 9px;
}

.table-scroll {
  height: calc(100% - 58px);
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(14, 165, 233, 0.38) transparent;
}

.contract-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
  table-layout: fixed;
}

.contract-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 5px 6px;
  font-size: 8px;
  color: #7fb6d7;
  font-weight: 600;
  text-align: left;
  background: rgba(5, 20, 39, 0.98);
}

.contract-table td {
  padding: 5px 6px;
  font-size: 9px;
  color: #e6f4ff;
  background: rgba(8, 26, 49, 0.86);
  border-top: 1px solid rgba(96, 155, 229, 0.12);
  border-bottom: 1px solid rgba(96, 155, 229, 0.12);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contract-table td:first-child,
.contract-table th:first-child {
  border-left: 1px solid rgba(96, 155, 229, 0.12);
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.contract-table td:last-child,
.contract-table th:last-child {
  border-right: 1px solid rgba(96, 155, 229, 0.12);
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.table-row {
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.table-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
}

.table-row.selected td {
  border-color: rgba(14, 165, 233, 0.36);
  background: linear-gradient(90deg, rgba(10, 52, 96, 0.92), rgba(8, 34, 62, 0.88));
}

.table-row.abnormal td {
  background: linear-gradient(90deg, rgba(68, 14, 24, 0.82), rgba(37, 16, 28, 0.72));
}

.contract-id-cell {
  display: grid;
  gap: 2px;
}

.contract-id-cell em {
  color: #7fdcff;
  font-size: 8px;
  font-style: normal;
}

.risk-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.risk-high,
.status-high {
  color: #ffd8d8;
  background: rgba(245, 63, 63, 0.18);
  border: 1px solid rgba(245, 63, 63, 0.28);
}

.risk-medium,
.status-medium {
  color: #ffe0c2;
  background: rgba(255, 136, 0, 0.16);
  border: 1px solid rgba(255, 136, 0, 0.28);
}

.risk-watch,
.status-watch {
  color: #fff0b8;
  background: rgba(250, 204, 22, 0.14);
  border: 1px solid rgba(250, 204, 22, 0.24);
}

.risk-normal,
.status-normal,
.status-archive {
  color: #bdf5ff;
  background: rgba(14, 165, 233, 0.14);
  border: 1px solid rgba(14, 165, 233, 0.24);
}

.row-actions {
  display: flex;
  gap: 4px;
}

.tiny-btn {
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 8px;
}

.tiny-btn.ghost {
  background: rgba(8, 30, 58, 0.42);
}

.empty-cell {
  text-align: center;
  color: #7daed0;
}

.ai-center {
  min-width: 0;
  display: grid;
  grid-template-rows: minmax(0, 15%) minmax(0, 35%) minmax(0, 30%) minmax(0, 20%);
  gap: 4px;
}

.ai-block {
  padding: 5px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(8, 28, 49, 0.92), rgba(5, 18, 34, 0.9));
  border: 1px solid rgba(74, 132, 206, 0.2);
}

.base-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 6px;
}

.base-item {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.base-item span {
  font-size: 8px;
  color: #7aa9ca;
}

.base-item strong {
  font-size: 9px;
  color: #eff8ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.base-item strong.warn {
  color: #ffd0d0;
}

.clause-scroll,
.compliance-list {
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(14, 165, 233, 0.3) transparent;
}

.clause-scroll {
  display: grid;
  gap: 4px;
}

.clause-card,
.compliance-item,
.ai-conclusion {
  border-radius: 10px;
  border: 1px solid rgba(72, 132, 206, 0.16);
  background: rgba(7, 25, 46, 0.84);
}

.clause-card {
  padding: 5px;
  opacity: 1;
  transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.clause-card.risk {
  border-color: rgba(245, 63, 63, 0.25);
}

.clause-card.active {
  box-shadow: 0 0 0 1px rgba(245, 63, 63, 0.18) inset, 0 12px 20px rgba(245, 63, 63, 0.08);
  background: linear-gradient(90deg, rgba(74, 15, 23, 0.86), rgba(36, 16, 28, 0.78));
}

.clause-card.muted {
  opacity: 0.45;
}

.clause-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 4px;
}

.clause-article {
  font-size: 9px;
  font-weight: 600;
  color: #e9f8ff;
}

.clause-text,
.compliance-body p,
.ai-conclusion li,
.conclusion-advice {
  margin: 0;
  font-size: 9px;
  line-height: 1.45;
  color: #d7e9f8;
}

.compliance-list {
  display: grid;
  gap: 4px;
  margin-bottom: 4px;
}

.compliance-item {
  padding: 5px;
  opacity: 0.45;
  transform: translateY(4px);
  transition: 0.2s ease;
}

.compliance-item.visible {
  opacity: 1;
  transform: translateY(0);
}

.compliance-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.compliance-violated {
  font-size: 9px;
  font-weight: 600;
  color: #eef8ff;
}

.ai-conclusion {
  padding: 5px;
}

.conclusion-title {
  margin-bottom: 4px;
  font-size: 9px;
  font-weight: 700;
  color: #eff8ff;
}

.ai-conclusion ul {
  margin: 0;
  padding-left: 14px;
  display: grid;
  gap: 3px;
}

.conclusion-advice {
  margin-top: 6px;
  color: #83d7f6;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  margin-top: 4px;
}

.action-btn,
.collapse-btn {
  height: 26px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
}

.action-btn.primary {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.24), rgba(6, 182, 212, 0.2));
}

.action-btn.warning {
  background: linear-gradient(90deg, rgba(245, 63, 63, 0.18), rgba(255, 136, 0, 0.16));
}

.action-btn.collapse {
  grid-column: 1 / -1;
}

.action-btn.pulse {
  animation: pulse-glow 1s infinite;
}

.expand-tab {
  align-self: center;
  height: 118px;
  width: 32px;
  border-radius: 12px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 0.08em;
  font-size: 9px;
  font-weight: 700;
}

.expand-tab small {
  margin-top: 6px;
  font-size: 8px;
  color: #7fb9da;
}

.progress-shell {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 3px;
}

.progress-chart-wrap {
  position: relative;
  min-height: 0;
}

.progress-alert {
  position: absolute;
  right: 12px;
  top: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 9px;
  color: #ffe7e7;
  background: rgba(245, 63, 63, 0.18);
  border: 1px solid rgba(245, 63, 63, 0.34);
  opacity: 0.45;
}

.progress-alert.active {
  opacity: 1;
  animation: blink-alert 1.05s infinite;
}

.progress-stats {
  justify-content: flex-end;
  color: #8bb7d8;
  font-size: 9px;
}

.warning-toast {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  color: #fff5f5;
  background: rgba(90, 16, 28, 0.94);
  border: 1px solid rgba(245, 63, 63, 0.32);
  box-shadow: 0 14px 32px rgba(245, 63, 63, 0.16);
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 12px rgba(245, 63, 63, 0.7);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(14, 165, 233, 0.18);
  }
  50% {
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.32);
  }
}

@keyframes blink-alert {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(245, 63, 63, 0.12);
  }
  50% {
    box-shadow: 0 0 18px rgba(245, 63, 63, 0.3);
  }
}

@media (max-width: 1440px) {
  .overview-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .middle-zone {
    grid-template-columns: 1fr;
  }

  .middle-zone.collapsed {
    grid-template-columns: 1fr;
  }

  .ai-center {
    grid-template-rows: repeat(4, minmax(0, auto));
  }
}
</style>
