<template>
  <div class="investment-screen">
    <PageBackBar title="投资穿透" @back="emit('navigate', 'dashboard')" />

    <!-- Header -->
    <div class="inv-header">
      <div class="header-left">
        <div class="screen-kicker">全景监管驾驶舱 · 投资穿透</div>
        <h1 class="screen-title">投资项目全链路穿透监管驾驶舱</h1>
        <p class="screen-desc">从集团战略规划到板块分配、项目执行与底层资产穿透，重点识别超预算、进度滞后和关联交易三大风险。</p>
      </div>
      <div class="topbar-right">
        <div class="scenario-switcher">
          <button
            v-for="tab in scenarioTabs"
            :key="tab"
            type="button"
            class="scenario-btn"
            :class="{ active: activeScenario === tab }"
            @click="activateScenario(tab)"
          >
            {{ tab }}
          </button>
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
    </div>

    <!-- KPI Strip -->
    <div class="inv-kpi-strip">
      <article
        v-for="card in summaryCards"
        :key="card.key"
        class="glass-panel kpi-card"
        :class="card.status"
        :title="`同比 ${card.yoy} / 环比 ${card.qoq}`"
      >
        <div class="kpi-head">
          <span class="kpi-title">{{ card.label }}</span>
          <span class="kpi-status">{{ card.statusText }}</span>
        </div>
        <div class="kpi-main">
          <strong>{{ displayMetric(card) }}</strong>
          <span>{{ card.unit }}</span>
        </div>
        <div class="kpi-foot">
          <span>同比 {{ card.yoy }}</span>
          <span>环比 {{ card.qoq }}</span>
        </div>
        <svg class="kpi-trend" viewBox="0 0 120 28" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="`invest-kpi-${card.key}`" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0ea5e9" />
              <stop offset="100%" :stop-color="card.color" />
            </linearGradient>
          </defs>
          <polyline
            :points="sparklinePoints(card.trend)"
            :stroke="`url(#invest-kpi-${card.key})`"
            fill="none"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </article>
    </div>

    <!-- Body: 中间三列 + 底部两列 -->
    <div class="inv-body">

      <!-- 中间行：投资趋势与里程碑 | 项目列表 | 详情 -->
      <div class="inv-mid" :class="{ 'body-no-right': panelCollapsed }">

        <!-- Left: 投资趋势与里程碑（上移与项目列表对齐） -->
        <div class="inv-col-left">
          <section class="glass-panel bottom-panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">投资趋势与里程碑</h2>
              </div>
              <div class="panel-tags">
                <span class="panel-tag danger">偏差超10%标红</span>
                <span class="panel-tag warning">延期高亮</span>
              </div>
            </div>
            <div class="bottom-grid">
              <div class="chart-card bottom-trend-card">
                <div class="chart-title-row">
                  <h3>预算 vs 实际投资趋势</h3>
                </div>
                <EChart class="bottom-chart" :option="trendOption" />
              </div>
              <div class="chart-card bottom-gantt-card">
                <div class="chart-title-row">
                  <h3>里程碑甘特图</h3>
                </div>
                <EChart class="bottom-chart" :option="ganttOption" />
              </div>
            </div>
            <div class="bottom-info-bar">
              <div class="bottom-info">
                <span class="info-label">超预算原因</span>
                <strong>{{ selectedProject.profile.causeAnalysis }}</strong>
              </div>
              <div class="bottom-info">
                <span class="info-label">进度滞后说明</span>
                <strong>{{ laggingReason }}</strong>
              </div>
              <div class="bottom-info">
                <span class="info-label">关联交易建议</span>
                <strong>{{ relationAdvice }}</strong>
              </div>
              <div class="bottom-actions">
                <button type="button" class="op-btn primary" :class="{ pulse: pulseDispatch }" @click="dispatchWorkOrder">派发核查工单</button>
                <button type="button" class="op-btn" @click="openProjectContract">查看合同</button>
                <button type="button" class="op-btn" @click="openFundsRecords">资金拨付</button>
              </div>
            </div>
          </section>
        </div>

        <!-- Center column: project list -->
        <div class="inv-col-center">
          <section class="glass-panel list-panel">
          <div class="panel-head compact">
            <div>
              <h2 class="panel-title">项目列表与筛选区</h2>
              <p class="panel-sub">默认演示项目为陇东风电基地二期，支持超预算、滞后和关联交易一键筛选。</p>
            </div>
            <div class="list-head-stats">
              <span class="mini-stat">当前 {{ filteredProjects.length }} 个</span>
              <span class="mini-stat">默认 {{ defaultProjectCode }}</span>
            </div>
          </div>

          <div class="filter-bar">
            <label>
              <span>板块</span>
              <select v-model="sectorFilter">
                <option value="all">全部板块</option>
                <option v-for="sector in SECTORS" :key="sector.id" :value="sector.id">{{ sector.name }}</option>
              </select>
            </label>
            <label>
              <span>状态</span>
              <select v-model="statusFilter">
                <option value="all">全部状态</option>
                <option v-for="item in statusFilterOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <label>
              <span>风险等级</span>
              <select v-model="riskFilter">
                <option value="all">全部等级</option>
                <option v-for="item in riskFilterOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <label>
              <span>区域</span>
              <select v-model="regionFilter">
                <option value="all">全部区域</option>
                <option v-for="item in regionOptions" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
          </div>

          <div class="quick-filter-row">
            <button
              v-for="item in quickFilters"
              :key="item.key"
              type="button"
              class="quick-chip"
              :class="{ active: quickFilter === item.key }"
              @click="quickFilter = item.key"
            >
              {{ item.label }}
            </button>
          </div>

          <div class="table-shell">
            <table class="project-table">
              <thead>
                <tr>
                  <th>项目编号</th>
                  <th>项目名称</th>
                  <th>所属板块/单位</th>
                  <th>预算金额（亿元）</th>
                  <th>实际支出（亿元）</th>
                  <th>偏差率（%）</th>
                  <th>进度（%）</th>
                  <th>状态</th>
                  <th>风险等级</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in filteredProjects"
                  :key="item.id"
                  :class="[
                    'project-row',
                    rowTone(item),
                    { active: selectedProjectId === item.id },
                  ]"
                  @click="selectProject(item.id)"
                >
                  <td>
                    <span v-if="item.id === defaultProjectCode" class="live-dot"></span>
                    {{ item.id }}
                  </td>
                  <td class="align-left">
                    <div class="project-name-cell">{{ item.name }}</div>
                    <div class="project-row-meta">{{ item.location }} · {{ item.phaseState }}</div>
                  </td>
                  <td class="align-left">{{ item.sectorName }} / {{ item.companyName }}</td>
                  <td>{{ formatYi(item.budgetYi) }}</td>
                  <td :class="{ danger: item.isOverBudget }">{{ formatYi(item.actualYi) }}</td>
                  <td :class="{ danger: item.isOverBudget }">{{ signedNumber(item.deviationRate) }}</td>
                  <td :class="{ warning: item.isLagging }">{{ item.progress }}%</td>
                  <td>
                    <span class="status-pill" :class="statusClass(item.primaryStatus)">{{ item.primaryStatus }}</span>
                  </td>
                  <td>
                    <span class="risk-pill" :class="item.riskDisplay.className">{{ item.riskDisplay.label }}</span>
                  </td>
                  <td>
                    <div class="op-row">
                      <button type="button" class="op-btn" @click.stop="selectProject(item.id)">查看详情</button>
                      <button type="button" class="op-btn" @click.stop="focusRiskPath">查看关联</button>
                      <button type="button" class="op-btn primary" @click.stop="dispatchWorkOrder">派发工单</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredProjects.length">
                  <td colspan="10" class="empty-cell">当前筛选条件下暂无项目，请切换板块或风险筛选。</td>
                </tr>
              </tbody>
            </table>
          </div>
          </section>
        </div>

        <!-- Right column: detail panel -->
        <div v-if="!panelCollapsed" class="inv-col-right">
          <aside class="glass-panel detail-panel panel-scroll micro-scroll">
          <div class="panel-head compact">
            <div>
              <h2 class="panel-title">项目详情与关联图谱区</h2>
              <p class="panel-sub">右侧面板支持收起，默认加载 P06 的三重风险演示数据。</p>
            </div>
            <button type="button" class="ghost-btn" @click="panelCollapsed = true">收起面板</button>
          </div>

          <section class="detail-summary-card">
            <div class="summary-main">
              <div>
                <div class="detail-code">{{ selectedProject.id }}</div>
                <h3 class="detail-name">{{ selectedProject.name }}</h3>
                <div class="detail-owner">{{ selectedProject.companyName }} · EPC {{ selectedProject.epcName }}</div>
              </div>
              <div class="detail-risk-tags">
                <span v-for="tag in selectedProject.riskTags" :key="tag" class="tag-chip">{{ tag }}</span>
              </div>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <span>预算 / 实际</span>
                <strong>{{ formatYi(selectedProject.budgetYi) }} / {{ formatYi(selectedProject.actualYi) }} 亿</strong>
              </div>
              <div class="summary-item">
                <span>偏差率</span>
                <strong class="danger">{{ signedNumber(selectedProject.deviationRate) }}</strong>
              </div>
              <div class="summary-item">
                <span>当前进度</span>
                <strong :class="{ warning: selectedProject.isLagging }">{{ selectedProject.progress }}%</strong>
              </div>
              <div class="summary-item">
                <span>当前状态</span>
                <strong>{{ selectedProject.primaryStatus }}</strong>
              </div>
              <div class="summary-item">
                <span>关联交易金额</span>
                <strong>{{ formatYi(selectedProject.profile.relatedTradeAmountYi) }} 亿</strong>
              </div>
              <div class="summary-item">
                <span>关联交易占比</span>
                <strong>{{ formatPercent(selectedProject.profile.relatedTradeRatio) }}</strong>
              </div>
            </div>
            <div class="ai-conclusion-card">
              <span class="ai-kicker">AI 风险研判结论</span>
              <p>{{ aiConclusion }}</p>
            </div>
          </section>

          <section class="graph-panel">
            <div class="chart-title-row graph-toolbar">
              <div>
                <h3>关联交易知识图谱</h3>
                <span>支持缩放、拖拽、点击节点或边查看明细</span>
              </div>
              <div class="graph-actions">
                <button type="button" class="op-btn" @click="focusRiskPath">聚焦高风险路径</button>
                <button type="button" class="op-btn" @click="graphSelection = null">恢复概览</button>
              </div>
            </div>
            <KnowledgeGraph
              :graph-data="selectedGraph"
              :height="200"
              :highlight-nodes="highlightedGraph.nodes"
              :highlight-edges="highlightedGraph.edges"
              @select="handleGraphSelect"
            />
            <div class="graph-insight-grid">
              <div class="graph-insight-card">
                <span class="insight-label">高风险路径</span>
                <strong>{{ graphPathText }}</strong>
                <p>{{ selectedProject.profile.hiddenRelationNote }}</p>
              </div>
              <div class="graph-insight-card">
                <span class="insight-label">点击详情</span>
                <strong>{{ graphSelectionTitle }}</strong>
                <p>{{ graphSelectionDetail }}</p>
              </div>
            </div>
          </section>
          </aside>
        </div>

      </div><!-- /inv-mid -->

      <!-- 底部行：投资组合矩阵视图（左）＋ 板块投资完成率（右） -->
      <div class="inv-bottom">
        <div class="glass-panel inv-bottom-panel">
          <div class="panel-head">
            <h2 class="panel-title">投资组合矩阵视图</h2>
            <div class="panel-tags">
              <span class="panel-tag danger">超预算标红</span>
              <span class="panel-tag warning">滞后预警</span>
            </div>
          </div>
          <div class="chart-title-row">
            <h3>板块 × 状态矩阵热力图</h3>
            <span>五大板块 / 五类状态</span>
          </div>
          <EChart class="portfolio-chart" :option="matrixHeatmapOption" :events="matrixChartEvents" />
        </div>
        <div class="glass-panel inv-bottom-panel">
          <div class="panel-head">
            <h2 class="panel-title">板块投资完成率</h2>
            <div class="panel-tags">
              <span class="panel-tag focus">关联高亮</span>
            </div>
          </div>
          <div class="chart-title-row">
            <h3>计划 vs 实际 vs 偏差率</h3>
            <span>点击柱体筛选</span>
          </div>
          <EChart class="portfolio-chart" :option="sectorBarOption" :events="sectorBarEvents" />
        </div>
      </div><!-- /inv-bottom -->

    </div><!-- /inv-body -->

    <transition name="toast-fade">
      <div v-if="toastVisible" class="risk-toast">
        <span class="toast-dot"></span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EChart from '@/components/EChart.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import PageBackBar from '@/components/PageBackBar.vue'
import {
  SECTORS,
  COMPANIES,
  INVESTMENT_PROJECTS,
  INVESTMENT_PROJECT_PROFILES,
  INVESTMENT_RELATION_GRAPHS,
} from '@/mock/index.js'

const emit = defineEmits(['navigate'])

const scenarioTabs = ['全链穿透', '超预算监测', '关联交易识别']
const activeScenario = ref(scenarioTabs[0])
const currentTime = ref(formatNow())
const refreshText = ref('数据已刷新')
const panelCollapsed = ref(false)
const selectedProjectId = ref('P06')
const graphSelection = ref(null)
const toastMessage = ref('')
const toastVisible = ref(false)
const pulseDispatch = ref(false)
const graphFocusTick = ref(0)
const kpiProgress = ref(0)

const sectorFilter = ref('all')
const statusFilter = ref('all')
const riskFilter = ref('all')
const regionFilter = ref('all')
const quickFilter = ref('all')

const defaultProjectCode = 'P06'
const clockTimer = ref(null)
const kpiTimer = ref(null)
const toastTimer = ref(null)
const demoTimers = []

const riskMetaMap = {
  critical: { label: '高风险', color: '#f53f3f', className: 'critical' },
  high: { label: '中风险', color: '#ff8800', className: 'high' },
  medium: { label: '关注', color: '#facc16', className: 'medium' },
  low: { label: '正常', color: '#22c55e', className: 'low' },
}

const statusFilterOptions = ['在建', '投产', '超预算', '滞后', '正常', '预警']
const riskFilterOptions = ['高风险', '中风险', '关注', '正常']
const quickFilters = [
  { key: 'all', label: '全部项目' },
  { key: 'overBudget', label: '一键查看超预算' },
  { key: 'lagging', label: '一键查看进度滞后' },
  { key: 'related', label: '一键查看关联交易' },
]

const summaryCards = [
  {
    key: 'plan',
    label: '年度投资计划总额',
    target: 500,
    unit: '亿元',
    color: '#06b6d4',
    status: 'normal',
    statusText: '战略预算',
    yoy: '+8.6%',
    qoq: '+2.1%',
    trend: [48, 54, 58, 62, 65, 72],
  },
  {
    key: 'actual',
    label: '已完成投资',
    target: 328,
    unit: '亿元',
    color: '#0ea5e9',
    status: 'normal',
    statusText: '执行平稳',
    yoy: '+6.4%',
    qoq: '+1.7%',
    trend: [24, 38, 52, 66, 74, 86],
  },
  {
    key: 'projectCount',
    label: '在投项目总数',
    target: 42,
    unit: '个',
    color: '#38bdf8',
    status: 'normal',
    statusText: '项目在管',
    yoy: '+4.8%',
    qoq: '+0.9%',
    trend: [12, 16, 18, 24, 31, 42],
  },
  {
    key: 'overBudget',
    label: '超预算项目数',
    target: 7,
    unit: '个',
    color: '#f53f3f',
    status: 'critical',
    statusText: '红色高亮',
    yoy: '+2.0%',
    qoq: '+1.0%',
    trend: [2, 3, 4, 5, 6, 7],
  },
  {
    key: 'lagging',
    label: '进度滞后项目数',
    target: 5,
    unit: '个',
    color: '#ff8800',
    status: 'high',
    statusText: '橙色预警',
    yoy: '+1.5%',
    qoq: '+0.6%',
    trend: [1, 1, 2, 3, 4, 5],
  },
  {
    key: 'related',
    label: '关联交易高风险项目',
    target: 3,
    unit: '个',
    color: '#facc16',
    status: 'medium',
    statusText: '黄色提示',
    yoy: '+0.8%',
    qoq: '+0.5%',
    trend: [1, 1, 1, 2, 2, 3],
  },
]

const projects = computed(() => INVESTMENT_PROJECTS.map((project) => buildProject(project)))
const regionOptions = computed(() => [...new Set(projects.value.map((item) => item.region))])

const sectorSummary = computed(() =>
  SECTORS.map((sector) => {
    const list = projects.value.filter((item) => item.sectorId === sector.id)
    const budget = sumBy(list, 'budgetYi')
    const actual = sumBy(list, 'actualYi')
    const overBudgetCount = list.filter((item) => item.isOverBudget).length
    const laggingCount = list.filter((item) => item.isLagging).length
    const normalCount = list.filter((item) => item.primaryStatus === '正常').length
    return {
      ...sector,
      budget,
      actual,
      overBudgetCount,
      laggingCount,
      normalCount,
      progressRate: budget ? Number(((actual / budget) * 100).toFixed(1)) : 0,
      deviationRate: budget ? Number((((actual - budget) / budget) * 100).toFixed(1)) : 0,
    }
  })
)

const matrixStatusColumns = [
  { key: 'construct', label: '在建' },
  { key: 'operation', label: '投产' },
  { key: 'overBudget', label: '超预算' },
  { key: 'lagging', label: '滞后' },
  { key: 'normal', label: '正常' },
]

const matrixDemoCell = ref({ sectorId: 's3', statusKey: 'overBudget' })

const matrixCells = computed(() =>
  SECTORS.flatMap((sector, rowIndex) =>
    matrixStatusColumns.map((status, columnIndex) => {
      const list = projects.value.filter((item) => item.sectorId === sector.id)
      const value = list.filter((item) => matchMatrixStatus(item, status.key)).length
      const isDemo = matrixDemoCell.value.sectorId === sector.id && matrixDemoCell.value.statusKey === status.key
      const isRisk = status.key === 'overBudget' && value > 0
      return {
        value: [columnIndex, rowIndex, value],
        meta: { sectorId: sector.id, statusKey: status.key },
        itemStyle: {
          borderRadius: 8,
          borderColor: isDemo ? '#f53f3f' : 'rgba(14, 165, 233, 0.14)',
          borderWidth: isDemo ? 2 : 1,
          shadowBlur: isDemo ? 22 : 8,
          shadowColor: isDemo ? 'rgba(245,63,63,0.55)' : isRisk ? 'rgba(245,63,63,0.28)' : 'rgba(14,165,233,0.22)',
        },
      }
    })
  )
)

const matrixHeatmapOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    formatter: (params) => {
      const sectorName = SECTORS[params.data.value[1]]?.name || '-'
      const statusName = matrixStatusColumns[params.data.value[0]]?.label || '-'
      return `${sectorName}<br/>${statusName}：${params.data.value[2]} 个项目`
    },
  },
  grid: { left: 90, right: 16, top: 18, bottom: 20 },
  xAxis: {
    type: 'category',
    data: matrixStatusColumns.map((item) => item.label),
    axisLine: { lineStyle: { color: 'rgba(125, 211, 252, 0.24)' } },
    axisLabel: { color: '#c9ecff', fontSize: 8 },
    splitArea: { show: true, areaStyle: { color: ['rgba(3, 16, 31, 0.14)', 'rgba(3, 16, 31, 0.2)'] } },
  },
  yAxis: {
    type: 'category',
    data: SECTORS.map((item) => item.name),
    axisLine: { lineStyle: { color: 'rgba(125, 211, 252, 0.24)' } },
    axisLabel: { color: '#c9ecff', fontSize: 8 },
    splitArea: { show: true, areaStyle: { color: ['rgba(3, 16, 31, 0.06)', 'rgba(3, 16, 31, 0.12)'] } },
  },
  visualMap: {
    min: 0,
    max: Math.max(...matrixCells.value.map((item) => item.value[2]), 1),
    show: false,
    inRange: {
      color: ['#082544', '#0b466f', '#0ea5e9', '#ff8800', '#f53f3f'],
    },
  },
  series: [
    {
      type: 'heatmap',
      data: matrixCells.value,
      label: { show: true, color: '#f8fdff', fontWeight: 700, fontSize: 8 },
      emphasis: {
        itemStyle: {
          shadowBlur: 24,
          shadowColor: 'rgba(14, 165, 233, 0.45)',
        },
      },
    },
  ],
}))

const sectorBarOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { color: '#bfe9ff', fontSize: 7 }, itemWidth: 10, itemHeight: 8 },
  grid: { left: 44, right: 16, top: 32, bottom: 22 },
  xAxis: {
    type: 'category',
    data: sectorSummary.value.map((item) => item.name),
    axisLabel: { color: '#c9ecff', interval: 0, fontSize: 8 },
    axisLine: { lineStyle: { color: 'rgba(125, 211, 252, 0.24)' } },
  },
  yAxis: [
    {
      type: 'value',
      name: '金额（亿）',
      nameTextStyle: { fontSize: 7 },
      axisLabel: { color: '#95c8e2', fontSize: 7 },
      splitLine: { lineStyle: { color: 'rgba(14,165,233,0.12)' } },
    },
    {
      type: 'value',
      name: '偏差率',
      nameTextStyle: { fontSize: 7 },
      axisLabel: { color: '#95c8e2', formatter: '{value}%', fontSize: 7 },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: '计划',
      type: 'bar',
      barMaxWidth: 24,
      data: sectorSummary.value.map((item) => ({ value: item.budget, sectorId: item.id })),
      itemStyle: { color: 'rgba(14, 165, 233, 0.75)', borderRadius: [6, 6, 0, 0] },
    },
    {
      name: '实际',
      type: 'bar',
      barMaxWidth: 24,
      data: sectorSummary.value.map((item) => ({
        value: item.actual,
        sectorId: item.id,
        itemStyle: {
          color: item.overBudgetCount > 0 ? '#f53f3f' : '#06b6d4',
          borderRadius: [6, 6, 0, 0],
        },
      })),
    },
    {
      name: '偏差率',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbolSize: 8,
      data: sectorSummary.value.map((item) => ({ value: item.deviationRate, sectorId: item.id })),
      lineStyle: { color: '#facc16', width: 2 },
      itemStyle: { color: '#facc16' },
    },
  ],
}))

const filteredProjects = computed(() =>
  projects.value.filter((item) => {
    if (sectorFilter.value !== 'all' && item.sectorId !== sectorFilter.value) return false
    if (statusFilter.value !== 'all') {
      if (statusFilter.value === '在建' || statusFilter.value === '投产') {
        if (item.phaseState !== statusFilter.value) return false
      } else if (item.primaryStatus !== statusFilter.value) {
        return false
      }
    }
    if (riskFilter.value !== 'all' && item.riskDisplay.label !== riskFilter.value) return false
    if (regionFilter.value !== 'all' && item.region !== regionFilter.value) return false
    if (quickFilter.value === 'overBudget' && !item.isOverBudget) return false
    if (quickFilter.value === 'lagging' && !item.isLagging) return false
    if (quickFilter.value === 'related' && !item.hasRelatedRisk) return false
    return true
  })
)

watch(
  filteredProjects,
  (list) => {
    if (!list.length) return
    if (!list.some((item) => item.id === selectedProjectId.value)) {
      selectedProjectId.value = list[0].id
    }
  },
  { immediate: true }
)

const selectedProject = computed(() =>
  projects.value.find((item) => item.id === selectedProjectId.value) || projects.value[0]
)
const selectedGraph = computed(() => INVESTMENT_RELATION_GRAPHS[selectedProject.value.id] || { nodes: [], edges: [] })

const graphFocusPath = computed(() => {
  const projectId = selectedProject.value.id
  if (projectId === 'P06') {
    return {
      nodes: ['i62', 'i63', 'i64', 'i67', 'i66'],
      edges: [
        { source: 'i62', target: 'i63' },
        { source: 'i63', target: 'i64' },
        { source: 'i66', target: 'i67' },
        { source: 'i67', target: 'i64' },
        { source: 'i66', target: 'i62' },
      ],
      text: '西北新能源投资公司 → 陇东风电项目 SPV → 宁陇 EPC 联合体 → 刘某控制平台 → 少数股东刘某',
    }
  }
  const highlightNodes = selectedGraph.value.nodes
    .filter((node) => ['related', 'person'].includes(node.type))
    .map((node) => node.id)
  const highlightEdges = selectedGraph.value.edges.filter((edge) => highlightNodes.includes(edge.source) || highlightNodes.includes(edge.target))
  return {
    nodes: [...new Set([...highlightNodes, ...highlightEdges.flatMap((edge) => [edge.source, edge.target])])],
    edges: highlightEdges.map((edge) => ({ source: edge.source, target: edge.target })),
    text: selectedProject.value.profile.hiddenRelationNote,
  }
})

const highlightedGraph = computed(() => {
  graphFocusTick.value
  return {
    nodes: [...graphFocusPath.value.nodes],
    edges: graphFocusPath.value.edges.map((edge) => ({ ...edge })),
  }
})

const aiConclusion = computed(() => {
  const finding = []
  if (selectedProject.value.isOverBudget) {
    finding.push(`该项目存在超预算 ${formatPercent(selectedProject.value.deviationRate)}`)
  }
  if (selectedProject.value.isLagging) {
    finding.push('关键节点延期，当前进度较计划滞后约 3 个月')
  }
  if (selectedProject.value.hasRelatedRisk) {
    finding.push('EPC 承包商与下属企业股东存在隐蔽关联关系')
  }
  if (!finding.length) {
    return '项目整体执行平稳，当前未识别重大异常，建议保持月度投资偏差与关联交易持续监测。'
  }
  return `${finding.join('、')}，建议立即启动专项核查并同步复核投资签证、资金拨付与股权穿透底稿。`
})

const graphNodeMap = computed(() => new Map(selectedGraph.value.nodes.map((node) => [node.id, node.label])))
const graphSelectionTitle = computed(() => {
  if (!graphSelection.value) return '默认高风险路径'
  if (graphSelection.value.type === 'node') return graphSelection.value.data.label || '图谱节点'
  if (graphSelection.value.type === 'edge') {
    const source = graphNodeMap.value.get(graphSelection.value.data.source) || graphSelection.value.data.source
    const target = graphNodeMap.value.get(graphSelection.value.data.target) || graphSelection.value.data.target
    return `${source} → ${target}`
  }
  return '风险概览'
})
const graphSelectionDetail = computed(() => {
  if (!graphSelection.value) {
    return `系统已自动锁定隐蔽关联路径，关联交易金额 ${formatYi(selectedProject.value.profile.relatedTradeAmountYi)} 亿元，占项目累计支出 ${formatPercent(selectedProject.value.profile.relatedTradeRatio)}。`
  }
  if (graphSelection.value.type === 'node') {
    return `${graphSelection.value.data.label}：节点类型为 ${nodeTypeText(graphSelection.value.data.type)}，可继续沿上下游关系核查出资、控股或分包链路。`
  }
  return `${graphSelection.value.data.label}，可进一步核查持股比例、交易金额与同一控制关系。`
})
const graphPathText = computed(() => graphFocusPath.value.text)

const laggingReason = computed(() => {
  const delays = selectedProject.value.profile.milestones.filter((item) => item.status === 'delay')
  if (!delays.length) return '当前关键节点整体按计划推进。'
  return delays.map((item) => `${item.name}${item.note ? `：${item.note}` : ''}`).join('；')
})
const relationAdvice = computed(() => {
  if (!selectedProject.value.hasRelatedRisk) return '保持对供应商集中度和股权变更的常态化扫描。'
  return '建议核查 EPC 承包商、设备代理商与子公司股东的交叉持股关系，并同步复核关联交易定价依据。'
})

const trendOption = computed(() => {
  const months = selectedProject.value.profile.fundTrend.map((item) => item.month)
  const deviationSeries = selectedProject.value.profile.fundTrend.map((item) => Number((((item.actual - item.budget) / item.budget) * 100).toFixed(1)))
  const markAreaData = []
  months.forEach((month, index) => {
    if (Math.abs(deviationSeries[index]) <= 10) return
    const nextMonth = months[Math.min(index + 1, months.length - 1)]
    markAreaData.push([{ xAxis: month }, { xAxis: nextMonth }])
  })
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: '#d2f0ff', fontSize: 7 }, itemWidth: 10, itemHeight: 8 },
    grid: { left: 44, right: 36, top: 30, bottom: 20 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: 'rgba(125, 211, 252, 0.24)' } },
      axisLabel: { color: '#c9ecff', fontSize: 7 },
    },
    yAxis: [
      {
        type: 'value',
        name: '累计投资（亿）',
        nameTextStyle: { fontSize: 7 },
        axisLabel: { color: '#9ed5ef', fontSize: 7 },
        splitLine: { lineStyle: { color: 'rgba(14,165,233,0.12)' } },
      },
      {
        type: 'value',
        name: '偏差率',
        nameTextStyle: { fontSize: 7 },
        axisLabel: { color: '#9ed5ef', formatter: '{value}%', fontSize: 7 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '预算计划',
        type: 'line',
        smooth: true,
        symbolSize: 9,
        data: selectedProject.value.profile.fundTrend.map((item) => item.budget),
        lineStyle: { color: '#0ea5e9', width: 3 },
        itemStyle: { color: '#0ea5e9' },
      },
      {
        name: '实际支出',
        type: 'line',
        smooth: true,
        symbolSize: 9,
        data: selectedProject.value.profile.fundTrend.map((item) => item.actual),
        lineStyle: { color: '#ff8800', width: 3 },
        itemStyle: { color: '#ff8800' },
        markArea: markAreaData.length
          ? {
              itemStyle: { color: 'rgba(245, 63, 63, 0.16)' },
              data: markAreaData,
            }
          : undefined,
      },
      {
        name: '偏差率',
        type: 'bar',
        yAxisIndex: 1,
        barMaxWidth: 18,
        data: deviationSeries.map((value) => ({
          value,
          itemStyle: { color: Math.abs(value) > 10 ? '#f53f3f' : 'rgba(250, 204, 22, 0.8)' },
        })),
      },
    ],
  }
})

const ganttRows = computed(() => {
  const today = Date.now()
  return selectedProject.value.profile.milestones.map((item) => {
    const planned = toTimestamp(item.planned)
    const end = item.actual && item.actual !== '-'
      ? Math.max(toTimestamp(item.actual), planned + 4 * DAY)
      : Math.max(today, planned + 12 * DAY)
    return {
      name: item.name,
      value: [item.name, planned, end],
      itemStyle: { color: milestoneColor(item.status) },
      status: milestoneStatusText(item.status),
      note: item.note,
      delayDays: calcDelayDays(item.planned, item.actual, item.status),
    }
  })
})

const ganttMin = computed(() => Math.min(...ganttRows.value.map((item) => item.value[1]), Date.now() - 15 * DAY))
const ganttMax = computed(() => Math.max(...ganttRows.value.map((item) => item.value[2]), Date.now() + 20 * DAY))

const ganttOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    formatter: (params) => {
      const data = params.data
      return `${data.value[0]}<br/>状态：${data.status}<br/>说明：${data.note}<br/>延期天数：${Math.max(data.delayDays, 0)} 天`
    },
  },
  grid: { left: 88, right: 18, top: 14, bottom: 26 },
  xAxis: {
    type: 'time',
    min: ganttMin.value,
    max: ganttMax.value,
    axisLabel: {
      color: '#c9ecff',
      fontSize: 7,
      formatter: (value) => formatMonthDay(value),
    },
    splitLine: { lineStyle: { color: 'rgba(14,165,233,0.12)' } },
    axisLine: { lineStyle: { color: 'rgba(125, 211, 252, 0.24)' } },
  },
  yAxis: {
    type: 'category',
    data: selectedProject.value.profile.milestones.map((item) => item.name),
    axisLabel: { color: '#d7f1ff', fontSize: 7 },
    axisLine: { lineStyle: { color: 'rgba(125, 211, 252, 0.24)' } },
  },
  series: [
    {
      type: 'custom',
      renderItem(params, api) {
        const category = api.value(0)
        const start = api.coord([api.value(1), category])
        const end = api.coord([api.value(2), category])
        const height = api.size([0, 1])[1] * 0.42
        return {
          type: 'rect',
          shape: {
            x: start[0],
            y: start[1] - height / 2,
            width: Math.max(10, end[0] - start[0]),
            height,
          },
          style: api.style({
            shadowBlur: 16,
            shadowColor: api.visual('color'),
          }),
        }
      },
      encode: { x: [1, 2], y: 0 },
      data: ganttRows.value,
    },
  ],
}))

const matrixChartEvents = {
  click: (params) => {
    const meta = params.data?.meta
    if (!meta) return
    sectorFilter.value = meta.sectorId
    statusFilter.value = matrixStatusToFilter(meta.statusKey)
    panelCollapsed.value = false
  },
}

const sectorBarEvents = {
  click: (params) => {
    const sectorId = params.data?.sectorId || sectorSummary.value[params.dataIndex]?.id
    if (!sectorId) return
    sectorFilter.value = sectorId
    panelCollapsed.value = false
  },
}

function activateScenario(tab) {
  activeScenario.value = tab
  if (tab === '超预算监测') {
    quickFilter.value = 'overBudget'
    statusFilter.value = '超预算'
  } else if (tab === '关联交易识别') {
    quickFilter.value = 'related'
    statusFilter.value = 'all'
  } else {
    quickFilter.value = 'all'
    statusFilter.value = 'all'
  }
}

function buildProject(project) {
  const profile = INVESTMENT_PROJECT_PROFILES[project.id] || {
    progress: 50,
    location: '演示区域',
    owner: '-',
    board: '-',
    milestoneStatus: '-',
    overBudgetRate: 0,
    causeAnalysis: '暂无补充说明。',
    relatedTradeAmountYi: 0,
    relatedTradeRatio: 0,
    hiddenRelationCount: 0,
    hiddenRelationNote: '暂无隐蔽关联说明。',
    fundTrend: [],
    milestones: [],
    alerts: [],
  }
  const company = COMPANIES.find((item) => item.id === project.companyId)
  const sector = SECTORS.find((item) => item.id === project.sectorId)
  const deviationRate = Number((((project.actualYi - project.budgetYi) / project.budgetYi) * 100).toFixed(1))
  const isOverBudget = deviationRate > 0
  const isLagging = profile.milestones.some((item) => item.status === 'delay') || project.id === 'P06'
  const hasRelatedRisk = profile.relatedTradeRatio >= 20 || profile.hiddenRelationCount > 0
  const phaseState = project.phase === '投产' || profile.progress >= 90 ? '投产' : '在建'
  const primaryStatus = isOverBudget ? '超预算' : isLagging ? '滞后' : hasRelatedRisk ? '预警' : '正常'
  const epcName = buildEpcName(project.id)
  const riskTags = []
  if (isOverBudget) riskTags.push(`超预算 ${formatPercent(deviationRate)}`)
  if (isLagging) riskTags.push('进度滞后')
  if (hasRelatedRisk) riskTags.push('关联交易')
  if (!riskTags.length) riskTags.push('执行正常')
  return {
    ...project,
    profile,
    companyName: company?.name || profile.owner || '-',
    sectorName: sector?.name || profile.board || '-',
    progress: profile.progress,
    location: profile.location,
    region: normalizeRegion(profile.location),
    deviationRate,
    isOverBudget,
    isLagging,
    hasRelatedRisk,
    phaseState,
    primaryStatus,
    epcName,
    riskDisplay: riskMetaMap[project.risk] || riskMetaMap.low,
    riskTags,
  }
}

function selectProject(projectId) {
  selectedProjectId.value = projectId
  panelCollapsed.value = false
  graphSelection.value = null
}

function openProjectFromAssistant(projectId) {
  if (!projectId) return
  activeScenario.value = '全链穿透'
  sectorFilter.value = 'all'
  statusFilter.value = 'all'
  riskFilter.value = 'all'
  regionFilter.value = 'all'
  quickFilter.value = 'all'
  selectProject(projectId)
  focusRiskPath()
  showToast(`已打开 ${projects.value.find((item) => item.id === projectId)?.name || '项目'} 详情看板`)
}

function handleAssistantProjectOpen(event) {
  openProjectFromAssistant(event?.detail?.projectId || 'P01')
}

function rowTone(item) {
  if (item.isOverBudget || item.isLagging) return 'danger-row'
  if (item.hasRelatedRisk) return 'warning-row'
  return 'normal-row'
}

function statusClass(status) {
  if (status === '超预算' || status === '滞后') return 'danger'
  if (status === '预警') return 'warning'
  if (status === '投产') return 'focus'
  return 'normal'
}

function matchMatrixStatus(project, statusKey) {
  if (statusKey === 'construct') return project.phaseState === '在建'
  if (statusKey === 'operation') return project.phaseState === '投产'
  if (statusKey === 'overBudget') return project.isOverBudget
  if (statusKey === 'lagging') return project.isLagging
  return project.primaryStatus === '正常'
}

function matrixStatusToFilter(statusKey) {
  const map = {
    construct: '在建',
    operation: '投产',
    overBudget: '超预算',
    lagging: '滞后',
    normal: '正常',
  }
  return map[statusKey] || 'all'
}

function focusRiskPath() {
  graphSelection.value = null
  graphFocusTick.value += 1
  panelCollapsed.value = false
}

function handleGraphSelect(payload) {
  graphSelection.value = payload
}

function dispatchWorkOrder() {
  pulseDispatch.value = true
  showToast('已派发核查工单')
}

function openProjectContract() {
  emit('navigate', 'equity')
}

function openFundsRecords() {
  emit('navigate', 'finance')
}

function relatedRiskId() {
  const map = {
    P01: 'R01',
    P06: 'R11',
  }
  return map[selectedProject.value.id] || ''
}

function primaryWorkOrderId() {
  return selectedProject.value.profile.alerts[0]?.workOrderId || ''
}

function projectContractId(projectId) {
  const map = {
    P01: 'CT-2025-4412',
    P06: 'CT-2026-0001',
  }
  return map[projectId] || ''
}

function startClock() {
  currentTime.value = formatNow()
  clockTimer.value = window.setInterval(() => {
    currentTime.value = formatNow()
    refreshText.value = '数据已刷新'
  }, 1000)
}

function startKpiAnimation() {
  let frame = 0
  kpiProgress.value = 0
  kpiTimer.value = window.setInterval(() => {
    frame += 1
    kpiProgress.value = Math.min(frame / 36, 1)
    if (kpiProgress.value >= 1) {
      window.clearInterval(kpiTimer.value)
      kpiTimer.value = null
    }
  }, 24)
}

function runDemo() {
  queueDemo(() => {
    matrixDemoCell.value = { sectorId: 's3', statusKey: 'overBudget' }
  }, 2000)
  queueDemo(() => {
    activeScenario.value = '全链穿透'
    sectorFilter.value = 'all'
    statusFilter.value = 'all'
    riskFilter.value = 'all'
    regionFilter.value = 'all'
    quickFilter.value = 'all'
    selectProject('P06')
  }, 2600)
  queueDemo(() => {
    focusRiskPath()
  }, 3400)
  queueDemo(() => {
    showToast('已派发核查工单')
  }, 4300)
  queueDemo(() => {
    pulseDispatch.value = true
  }, 5000)
}

function queueDemo(callback, delay) {
  const timer = window.setTimeout(callback, delay)
  demoTimers.push(timer)
}

function showToast(message) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer.value) window.clearTimeout(toastTimer.value)
  toastTimer.value = window.setTimeout(() => {
    toastVisible.value = false
  }, 3200)
}

function sparklinePoints(values) {
  if (!values.length) return ''
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 120
      const y = 28 - (value / Math.max(...values)) * 24
      return `${x},${y}`
    })
    .join(' ')
}

function displayMetric(card) {
  const value = card.target * kpiProgress.value
  return card.unit === '亿元' ? Math.round(value) : Math.round(value)
}

function formatYi(value) {
  return Number(value || 0).toFixed(1).replace(/\.0$/, '')
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1).replace(/\.0$/, '')}%`
}

function signedNumber(value) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${Number(value || 0).toFixed(1).replace(/\.0$/, '')}`
}

function normalizeRegion(location) {
  if (!location) return '其他'
  if (location.includes('甘肃')) return '西北'
  if (location.includes('上海')) return '华东'
  if (location.includes('深圳')) return '华南'
  if (location.includes('江苏')) return '华东'
  if (location.includes('东南亚')) return '境外'
  return '其他'
}

function buildEpcName(projectId) {
  const map = {
    P01: '境外路桥 EPC 联合体',
    P02: '酒泉清能 EPC 总包',
    P03: '华东检修工程公司',
    P04: '鹏湾城建 EPC 总包',
    P05: '海工装备建造联合体',
    P06: '宁陇 EPC 联合体',
  }
  return map[projectId] || '项目 EPC 总包'
}

function nodeTypeText(type) {
  const map = {
    group: '集团',
    company: '子公司',
    spv: '项目 SPV',
    supplier: '承包商/供应商',
    related: '关联方',
    person: '自然人',
  }
  return map[type] || '图谱节点'
}

function milestoneColor(status) {
  if (status === 'delay') return '#f53f3f'
  if (status === 'running') return '#ff8800'
  return '#22c55e'
}

function milestoneStatusText(status) {
  if (status === 'delay') return '延期'
  if (status === 'running') return '进行中'
  return '已完成'
}

function calcDelayDays(planned, actual, status) {
  if (actual && actual !== '-') return dayDiff(actual, planned)
  if (status === 'delay') return 7
  if (status === 'running') return Math.max(dayDiff(formatDate(Date.now()), planned), 0)
  return 0
}

function toTimestamp(value) {
  return new Date(value).getTime()
}

function formatNow() {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mi = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function formatMonthDay(value) {
  const date = new Date(value)
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  return `${mm}-${dd}`
}

function formatDate(value) {
  const date = new Date(value)
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function dayDiff(actual, planned) {
  return Math.round((toTimestamp(actual) - toTimestamp(planned)) / DAY)
}

function sumBy(list, key) {
  return list.reduce((sum, item) => sum + Number(item[key] || 0), 0)
}

const DAY = 24 * 60 * 60 * 1000

onMounted(() => {
  startClock()
  startKpiAnimation()
  runDemo()
  window.addEventListener('drp-open-invest-project', handleAssistantProjectOpen)
})

onBeforeUnmount(() => {
  if (clockTimer.value) window.clearInterval(clockTimer.value)
  if (kpiTimer.value) window.clearInterval(kpiTimer.value)
  if (toastTimer.value) window.clearTimeout(toastTimer.value)
  demoTimers.forEach((timer) => window.clearTimeout(timer))
  window.removeEventListener('drp-open-invest-project', handleAssistantProjectOpen)
})
</script>

<style scoped>
/* ─── Root cockpit layout ─────────────────────────────────────── */
.investment-screen {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 4px;
  overflow: hidden;
  color: #e8fbff;
  font-family: 'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: 11px;
}

.investment-screen :deep(.page-backbar) {
  min-height: 32px;
  margin-bottom: 2px;
}

/* ─── Header bar ──────────────────────────────────────────────── */
.inv-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  padding: 4px 10px;
  background: rgba(8, 18, 42, 0.72);
  border: 1px solid rgba(72, 162, 255, 0.18);
  border-radius: 8px;
  flex-shrink: 0;
  gap: 8px;
}

.header-left {
  min-width: 0;
}

/* ─── KPI strip ───────────────────────────────────────────────── */
.inv-kpi-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 5px;
  flex-shrink: 0;
  height: 78px;
  align-items: stretch;
}

/* ─── Body 两行布局：中间行 + 底部行 ─────────────────────────── */
.inv-body {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 5px;
  min-height: 0;
  overflow: hidden;
}

/* 中间行：3 列（趋势 | 列表 | 详情） */
.inv-mid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 1.24fr) minmax(0, 1fr);
  gap: 6px;
  min-height: 0;
  overflow: hidden;
  transition: grid-template-columns 0.24s ease;
}

.inv-mid.body-no-right {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 1.7fr);
}

/* 底部行：2 列（矩阵热力图 | 板块完成率） */
.inv-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  height: 168px;
  min-height: 0;
}

.inv-bottom-panel {
  display: flex;
  flex-direction: column;
  padding: 5px 8px;
  min-height: 0;
  overflow: hidden;
}

.inv-col-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.inv-col-center,
.inv-col-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.inv-col-left > *,
.inv-col-center > *,
.inv-col-right > * {
  min-width: 0;
  min-height: 0;
}

.inv-col-left > *,
.inv-col-center > * {
  flex: 1;
  overflow: hidden;
}

.inv-col-right > * {
  flex: 1;
  overflow: hidden;
}

/* ─── Glass panel base ────────────────────────────────────────── */
.glass-panel {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(14, 165, 233, 0.22);
  background: linear-gradient(135deg, rgba(6, 24, 42, 0.88), rgba(3, 12, 24, 0.82));
  box-shadow: 0 8px 24px rgba(1, 12, 24, 0.36), inset 0 0 0 1px rgba(6, 182, 212, 0.06);
  backdrop-filter: blur(18px);
}

.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 10%, rgba(255, 255, 255, 0.05) 18%, transparent 32%);
  transform: translateX(-120%);
  animation: panelSweep 8s linear infinite;
  pointer-events: none;
}

/* ─── Header typography ───────────────────────────────────────── */
.screen-kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: #7ad8ff;
  text-transform: uppercase;
}

.screen-title {
  margin: 1px 0;
  font-size: 14px;
  font-weight: 800;
  text-shadow: 0 0 14px rgba(14, 165, 233, 0.42), 0 0 22px rgba(6, 182, 212, 0.18);
}

.screen-desc {
  display: none;
}

.topbar-right {
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px;
  align-items: start;
  flex-shrink: 0;
}

.scenario-switcher {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.scenario-btn,
.ghost-btn,
.op-btn {
  border: 1px solid rgba(14, 165, 233, 0.22);
  background: rgba(8, 28, 46, 0.74);
  color: #dff8ff;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.scenario-btn {
  padding: 3px 10px;
  font-size: 10px;
}

.scenario-btn.active,
.scenario-btn:hover,
.ghost-btn:hover,
.op-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(6, 182, 212, 0.48);
  box-shadow: 0 6px 16px rgba(3, 17, 32, 0.34), 0 0 12px rgba(6, 182, 212, 0.18);
}

.scenario-btn.active {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.28), rgba(6, 182, 212, 0.18));
}

.topbar-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.meta-card {
  min-width: 96px;
  padding: 3px 6px;
  border-radius: 8px;
  background: rgba(8, 28, 46, 0.6);
  border: 1px solid rgba(14, 165, 233, 0.18);
}

.meta-card.success {
  border-color: rgba(34, 197, 94, 0.24);
}

.meta-label {
  display: block;
  margin-bottom: 1px;
  font-size: 10px;
  color: #82c7e7;
}

.meta-card strong {
  font-size: 12px;
  color: #f6fdff;
}

/* ─── KPI cards ───────────────────────────────────────────────── */
.kpi-card {
  height: 100%;
  padding: 4px 6px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover,
.chart-card:hover,
.detail-summary-card:hover,
.graph-insight-card:hover,
.bottom-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(1, 12, 24, 0.4), 0 0 16px rgba(6, 182, 212, 0.12);
}

.kpi-card.critical { border-color: rgba(245, 63, 63, 0.5); }
.kpi-card.high     { border-color: rgba(255, 136, 0, 0.46); }
.kpi-card.medium   { border-color: rgba(250, 204, 22, 0.44); }

.kpi-head,
.kpi-foot,
.panel-head,
.chart-title-row,
.summary-main,
.graph-insight-grid,
.bottom-info-bar,
.list-head-stats,
.op-row,
.filter-bar,
.panel-tags,
.bottom-actions,
.summary-grid,
.graph-actions,
.detail-risk-tags,
.quick-filter-row {
  display: flex;
}

.kpi-head,
.kpi-foot,
.panel-head,
.chart-title-row,
.summary-main,
.bottom-info-bar {
  justify-content: space-between;
}

.kpi-head {
  align-items: center;
  margin-bottom: 2px;
}

.kpi-title,
.kpi-status,
.kpi-foot,
.panel-sub,
.chart-title-row span,
.project-row-meta,
.info-label,
.insight-label {
  color: #8cc8e4;
}

.kpi-title  { font-size: 11px; }
.kpi-status { font-size: 10px; }

.kpi-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.kpi-main strong {
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
  color: #ffffff;
}

.kpi-main span {
  font-size: 11px;
  color: #9ed4ea;
}

.kpi-foot {
  margin-top: 1px;
  font-size: 9px;
}

.kpi-trend {
  width: 100%;
  height: 16px;
  margin-top: 2px;
}

/* ─── Panel common ────────────────────────────────────────────── */
.portfolio-panel,
.bottom-panel,
.list-panel,
.detail-panel {
  padding: 6px 8px;
  min-height: 0;
}

.portfolio-panel,
.bottom-panel,
.list-panel {
  display: flex;
  flex-direction: column;
}

.panel-head {
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 3px;
}

.panel-head.compact {
  margin-bottom: 4px;
}

.panel-title {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(14, 165, 233, 0.36);
}

.panel-sub {
  display: none;
}

.panel-tags,
.list-head-stats,
.quick-filter-row,
.graph-actions,
.detail-risk-tags,
.bottom-actions,
.op-row {
  gap: 4px;
  flex-wrap: wrap;
}

.panel-tag,
.mini-stat,
.tag-chip,
.quick-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  border: 1px solid rgba(14, 165, 233, 0.16);
  background: rgba(8, 28, 46, 0.52);
}

.panel-tag.danger,
.tag-chip {
  border-color: rgba(245, 63, 63, 0.26);
  color: #ffd2d2;
}

.panel-tag.warning {
  border-color: rgba(255, 136, 0, 0.26);
  color: #ffdcb0;
}

.panel-tag.focus {
  border-color: rgba(250, 204, 22, 0.26);
  color: #ffeeb6;
}

/* ─── Portfolio charts ────────────────────────────────────────── */
.portfolio-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 5px;
  flex: 1;
  min-height: 0;
}

.chart-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 4px 6px;
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.14);
  background: rgba(2, 12, 24, 0.34);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chart-title-row {
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.chart-title-row h3 {
  margin: 0;
  font-size: 11px;
}

.portfolio-chart {
  flex: 1;
  min-height: 0;
  height: auto;
}

/* bottom panels内的图表撑满剩余高度 */
.inv-bottom-panel .portfolio-chart {
  flex: 1;
  min-height: 80px;
}

/* ─── List panel ──────────────────────────────────────────────── */
.list-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 4px;
  padding: 2px 0;
}

.filter-bar label {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
  color: #9bd4ea;
  font-size: 10px;
  white-space: nowrap;
}

.filter-bar select {
  flex: 1;
  min-width: 0;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(14, 165, 233, 0.16);
  background: rgba(7, 24, 40, 0.9);
  color: #ebfbff;
  padding: 0 4px;
  font-size: 10px;
}

.quick-chip {
  cursor: pointer;
  color: #cfefff;
}

.quick-chip.active {
  border-color: rgba(6, 182, 212, 0.48);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(6, 182, 212, 0.18));
}

.table-shell {
  overflow: auto;
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.12);
  flex: 1;
  min-height: 0;
  background: rgba(2, 12, 24, 0.3);
}

.project-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 860px;
  font-size: 10px;
}

.project-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 4px 5px;
  text-align: center;
  color: #f0fcff;
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.26), rgba(6, 182, 212, 0.14));
}

.project-table td {
  padding: 4px 5px;
  text-align: center;
  color: #dff6ff;
  border-bottom: 1px solid rgba(14, 165, 233, 0.08);
}

.align-left {
  text-align: left !important;
}

.project-row {
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.project-row:nth-child(odd) {
  background: rgba(255, 255, 255, 0.02);
}

.project-row:hover {
  background: rgba(14, 165, 233, 0.1);
  box-shadow: 0 4px 10px rgba(2, 16, 30, 0.22);
}

.project-row.active {
  background: rgba(14, 165, 233, 0.14) !important;
  box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.3);
}

.project-row.danger-row {
  background: linear-gradient(90deg, rgba(245, 63, 63, 0.16), rgba(245, 63, 63, 0.04)) !important;
}

.project-row.warning-row {
  background: linear-gradient(90deg, rgba(255, 136, 0, 0.14), rgba(255, 136, 0, 0.04)) !important;
}

.project-name-cell {
  font-weight: 700;
}

.live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 4px;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 10px rgba(245, 63, 63, 0.9);
  animation: pulseDot 1.1s ease-in-out infinite;
}

.status-pill,
.risk-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.status-pill.danger,
.risk-pill.critical {
  background: linear-gradient(135deg, #f53f3f, #fb7185);
  color: #fff;
}

.status-pill.warning,
.risk-pill.high {
  background: linear-gradient(135deg, #ff8800, #fb923c);
  color: #fff;
}

.status-pill.focus,
.risk-pill.medium {
  background: linear-gradient(135deg, #facc16, #fde68a);
  color: #3a2500;
}

.status-pill.normal,
.risk-pill.low {
  background: linear-gradient(135deg, #22c55e, #4ade80);
  color: #07230f;
}

.danger { color: #ffb5b5; }
.warning { color: #ffd39a; }

.op-btn,
.ghost-btn {
  padding: 3px 8px;
  font-size: 11px;
}

.op-btn.primary {
  border-color: rgba(6, 182, 212, 0.42);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(6, 182, 212, 0.18));
}

.op-btn.pulse {
  animation: pulseBtn 1.3s ease-in-out infinite;
}

/* ─── Detail panel ────────────────────────────────────────────── */
.detail-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 6px;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-summary-card {
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid rgba(14, 165, 233, 0.14);
  background: rgba(2, 12, 24, 0.36);
  overflow: hidden;
}

.detail-code {
  font-size: 11px;
  color: #8ccde7;
}

.detail-name {
  margin: 2px 0;
  font-size: 14px;
}

.detail-owner {
  color: #8ccce1;
  font-size: 11px;
}

.summary-main {
  align-items: flex-start;
  gap: 6px;
}

.detail-risk-tags {
  align-items: flex-start;
  justify-content: flex-end;
  max-width: 50%;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 6px;
}

.summary-item {
  min-width: 0;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.summary-item span,
.ai-kicker,
.empty-cell {
  display: block;
  font-size: 10px;
  color: #88c6e0;
}

.summary-item strong {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: #f7fdff;
}

.ai-conclusion-card {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(245, 63, 63, 0.18);
  background: linear-gradient(135deg, rgba(245, 63, 63, 0.16), rgba(14, 165, 233, 0.08));
}

.ai-conclusion-card p {
  margin: 4px 0 0;
  line-height: 1.5;
  color: #ffe6e6;
  font-size: 11px;
}

/* ─── Graph panel ─────────────────────────────────────────────── */
.graph-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 210px) auto;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.graph-toolbar {
  align-items: flex-start;
}

.graph-insight-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.graph-insight-card,
.bottom-info {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.12);
  background: rgba(2, 12, 24, 0.32);
}

.graph-insight-card strong,
.bottom-info strong {
  display: block;
  margin-top: 3px;
  line-height: 1.5;
  color: #f7fdff;
  font-size: 11px;
}

.graph-insight-card p {
  margin: 4px 0 0;
  line-height: 1.5;
  color: #98c6da;
  font-size: 11px;
}

/* ─── Bottom panel (in left col) ──────────────────────────────── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 4px;
  flex: 1;
  min-height: 0;
}

.bottom-chart {
  flex: 1;
  min-height: 76px;
  height: auto;
}

.bottom-info-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 4px;
  margin-top: 3px;
  align-items: stretch;
  flex-shrink: 0;
}

.bottom-info {
  min-width: 0;
}

.bottom-actions {
  align-items: center;
  justify-content: flex-end;
}

/* ─── Toast ───────────────────────────────────────────────────── */
.risk-toast {
  position: fixed;
  top: 88px;
  right: 22px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(245, 63, 63, 0.34);
  background: rgba(44, 10, 18, 0.9);
  color: #fff3f3;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28), 0 0 20px rgba(245, 63, 63, 0.22);
  z-index: 50;
  font-size: 12px;
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f53f3f;
  box-shadow: 0 0 10px rgba(245, 63, 63, 0.92);
  flex-shrink: 0;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ─── Keyframes ───────────────────────────────────────────────── */
@keyframes panelSweep {
  0%   { transform: translateX(-120%); }
  50%  { transform: translateX(120%); }
  100% { transform: translateX(120%); }
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.42; }
}

@keyframes pulseBtn {
  0%, 100% { box-shadow: 0 0 0 rgba(14, 165, 233, 0); }
  50%       { box-shadow: 0 0 16px rgba(14, 165, 233, 0.4); }
}
</style>
