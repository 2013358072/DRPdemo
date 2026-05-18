<template>
  <div class="scene-content">
    <div class="dashboard-cockpit">
      <div class="toast-bar" @click="emit('navigate', toastTarget)">
        <span class="toast-dot"></span>
        <strong>实时预警</strong>
        <span class="toast-text">{{ currentToast.text }}</span>
        <span class="toast-arrow">点击穿透 →</span>
      </div>

      <div class="dbrd-body">
        <div class="col col-left">
          <section class="panel panel-lg">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">风险等级分布 <span class="pt-en">DISTRIBUTION</span></div>
            </div>
            <EChart class="p-chart" :option="riskDonutOption" />
            <div class="legend-list">
              <div v-for="item in riskLegend" :key="item.label" class="legend-item">
                <span class="legend-dot" :style="{ background: item.color }"></span>
                <span>{{ item.label }}</span>
                <strong :style="{ color: item.color }">{{ item.value }}</strong>
              </div>
            </div>
          </section>

          <section class="panel panel-lg">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">板块风险得分 <span class="pt-en">SECTOR SCORE</span></div>
            </div>
            <EChart class="p-chart" :option="sectorRiskBarOption" />
          </section>

          <section class="panel panel-lg">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">资金池实时监控 <span class="pt-en">FUNDS POOL</span></div>
            </div>
            <div class="funds-micro-grid">
              <div v-for="item in fundsMicroKPIs" :key="item.label" class="fm-card">
                <span class="fm-icon">{{ item.icon }}</span>
                <span class="fm-val">{{ item.value }}</span>
                <span class="fm-label">{{ item.label }}</span>
              </div>
            </div>
          </section>

          <section class="panel panel-lg flex-1">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">合同履约监控 <span class="pt-en">PERFORMANCE</span></div>
              <div class="panel-action">高风险 {{ highRiskContractCount }}</div>
            </div>
            <div class="contract-perf-list">
              <div v-for="ct in topContracts" :key="ct.id" class="cp-item">
                <div class="cp-header">
                  <span class="cp-name">{{ ct.name }}</span>
                  <span class="mini-badge" :class="badgeCls(ct.level)">{{ ct.label }}</span>
                </div>
                <div class="cp-bar-wrap">
                  <div class="cp-bar">
                    <div class="cp-fill" :class="badgeCls(ct.level)" :style="{ width: `${ct.performance}%` }"></div>
                  </div>
                  <span class="cp-pct">{{ ct.performance }}%</span>
                </div>
              </div>
            </div>
            <div class="overpay-warn">AI 识别到 {{ highRiskContractCount }} 份合同存在高风险条款，建议立即派单整改。</div>
          </section>
        </div>

        <div class="col col-center">
          <section class="kpi-row">
            <div v-for="kpi in centerKPIs" :key="kpi.label" class="kpi-card" :class="{ 'kpi-risk': kpi.isRisk }">
              <div class="kpi-num">{{ kpi.display }}</div>
              <div class="kpi-lbl">{{ kpi.label }}</div>
              <div class="kpi-sub">{{ kpi.sub }}</div>
            </div>
          </section>

          <section class="panel panel-lg panel-heatmap">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">风险热力图 · 板块 × 风险域 <span class="pt-en">HEATMAP</span></div>
              <div class="panel-action">支持 hover</div>
            </div>
            <EChart class="p-chart heat-chart" :option="heatmapOption" />
          </section>

          <section class="panel panel-lg panel-table">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">风险样本 <span class="pt-en">RISK SAMPLES</span></div>
              <div class="panel-action">点击联动</div>
            </div>
            <div class="compact-table-wrap">
              <table class="compact-table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>类别</th>
                    <th>描述</th>
                    <th>等级</th>
                    <th>跳转</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="risk in dashboardRiskSamples" :key="risk.id" class="ct-row" @click="emit('navigate', risk.target)">
                    <td class="ct-mono">{{ risk.id }}</td>
                    <td>{{ risk.type }}</td>
                    <td class="ct-desc">{{ risk.summary }}</td>
                    <td><span class="mini-badge" :class="badgeCls(risk.level)">{{ risk.levelLabel }}</span></td>
                    <td class="ct-link">查看详情 →</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel panel-lg module-boards panel-scroll micro-scroll">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">核心业务穿透 <span class="pt-en">DRILL SCENES</span></div>
              <div class="panel-action">点击下钻</div>
            </div>
            <div class="board-grid">
              <div class="board-card" @click="emit('navigate', 'invest')">
                <div class="bd-header">
                  <span class="bd-icon">📊</span>
                  <span class="bd-name">投资管理</span>
                  <span class="mini-badge critical">高风险</span>
                </div>
                <div class="bd-kpis">
                  <span class="bd-kpi"><strong>42</strong><small>个项目</small></span>
                  <span class="bd-kpi warn"><strong>P06</strong><small>超预算 12%</small></span>
                  <span class="bd-kpi"><strong>112</strong><small>亿计划</small></span>
                </div>
                <EChart class="bd-chart" :option="boardInvestChart" />
              </div>

              <div class="board-card" @click="emit('navigate', 'finance')">
                <div class="bd-header">
                  <span class="bd-icon">💰</span>
                  <span class="bd-name">资金管理</span>
                  <span class="mini-badge high">预警</span>
                </div>
                <div class="bd-kpis">
                  <span class="bd-kpi"><strong>286</strong><small>亿余额</small></span>
                  <span class="bd-kpi warn"><strong>4800</strong><small>万异常支付</small></span>
                  <span class="bd-kpi"><strong>92%</strong><small>健康占比</small></span>
                </div>
                <EChart class="bd-chart" :option="boardFundsChart" />
              </div>

              <div class="board-card" @click="emit('navigate', 'overseas')">
                <div class="bd-header">
                  <span class="bd-icon">📦</span>
                  <span class="bd-name">采购招标</span>
                  <span class="mini-badge critical">高风险</span>
                </div>
                <div class="bd-kpis">
                  <span class="bd-kpi"><strong>18</strong><small>在途标段</small></span>
                  <span class="bd-kpi warn"><strong>95%</strong><small>围标概率</small></span>
                  <span class="bd-kpi"><strong>6</strong><small>触发预警</small></span>
                </div>
                <EChart class="bd-chart" :option="boardProcurementChart" />
              </div>

              <div class="board-card" @click="emit('navigate', 'equity')">
                <div class="bd-header">
                  <span class="bd-icon">📋</span>
                  <span class="bd-name">合同总览</span>
                  <span class="mini-badge high">预警</span>
                </div>
                <div class="bd-kpis contract-kpis">
                  <span class="bd-kpi"><strong>265</strong><small>份合同</small></span>
                  <span class="bd-kpi"><strong>386</strong><small>亿元</small></span>
                  <span class="bd-kpi warn"><strong>29</strong><small>高风险</small></span>
                  <span class="bd-kpi"><strong>17</strong><small>本月到期</small></span>
                </div>
                <EChart class="bd-chart" :option="boardContractChart" />
              </div>
            </div>
          </section>
        </div>

        <div class="col col-right">
          <section class="panel panel-lg">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">预警趋势 · 近 12 月 <span class="pt-en">ALERT TREND</span></div>
              <div class="panel-action">月度</div>
            </div>
            <EChart class="p-chart" :option="alertTrendOption" />
          </section>

          <section class="panel panel-lg">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">AI 智能中台 <span class="pt-en">AI CENTER</span></div>
              <div class="panel-action">主动预警</div>
            </div>
            <div class="ai-alerts">
              <div class="ai-alerts-title">推荐处置</div>
              <div v-for="alert in proactiveAlerts" :key="alert.id" class="ai-alert-item" @click="emit('navigate', alert.target)">
                <div class="aa-header">
                  <span class="aa-dot" :class="badgeCls(alert.level)"></span>
                  <span class="aa-title">{{ alert.title }}</span>
                  <span class="aa-time">{{ alert.time }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="panel panel-lg flex-1">
            <span class="cb"></span><span class="cr"></span>
            <div class="panel-head">
              <div class="panel-title">实时风险事件 <span class="pt-en">LIVE FEED</span></div>
              <div class="panel-action danger">{{ liveEvents.length }} 待处理</div>
            </div>
            <div class="event-list panel-scroll micro-scroll">
              <div v-for="event in liveEvents" :key="event.code" class="event-item" :class="badgeCls(event.level)" @click="emit('navigate', event.target)">
                <div class="ev-head">
                  <span class="ev-lvl-dot" :class="badgeCls(event.level)"></span>
                  <span class="ev-title">{{ event.title }}</span>
                </div>
                <div class="ev-row2">
                  <span class="ev-type">{{ event.type }}</span>
                  <span class="ev-code">{{ event.code }}</span>
                </div>
                <div class="ev-nav">穿透查看 →</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import EChart from '../components/EChart.vue'

const emit = defineEmits(['navigate'])

const riskLegend = [
  { label: '高风险', value: 6, color: '#F56C6C' },
  { label: '中风险', value: 13, color: '#E6A23C' },
  { label: '低风险', value: 21, color: '#E6B85C' },
  { label: '正常', value: 42, color: '#67C23A' },
]

const sectorRiskData = [
  { name: '火电', value: 58 },
  { name: '新能源', value: 77 },
  { name: '煤炭', value: 49 },
  { name: '化工', value: 69 },
  { name: '金融', value: 44 },
]

const fundsMicroKPIs = [
  { icon: '¥', value: '286亿', label: '资金总量' },
  { icon: '↔', value: '18.4亿', label: '日均流动' },
  { icon: '⚠', value: '7笔', label: '异常支付' },
  { icon: '⊕', value: '92%', label: '白名单覆盖' },
]

const topContracts = [
  { id: 'CT-0312', name: '海外 EPC 总包合同', level: 'critical', label: '高风险', performance: 42 },
  { id: 'CT-0508', name: '煤化工扩能采购合同', level: 'high', label: '预警', performance: 61 },
  { id: 'CT-0611', name: '风电设备供货合同', level: 'medium', label: '关注', performance: 76 },
  { id: 'CT-0622', name: '司库系统升级合同', level: 'low', label: '正常', performance: 88 },
  { id: 'CT-0472', name: '输煤栈桥加固合同', level: 'medium', label: '待审核', performance: 54 },
  { id: 'CT-0386', name: '主变压器成套采购合同', level: 'high', label: '预警', performance: 46 },
  { id: 'CT-0644', name: '数字化运维服务合同', level: 'low', label: '已归档', performance: 100 },
]

const highRiskContractCount = computed(() => topContracts.filter((item) => ['critical', 'high'].includes(item.level)).length)

const centerKPIs = [
  { label: '总资产', display: '4,860亿', sub: '同比 +4.6%' },
  { label: '营业收入', display: '1,928亿', sub: '环比 +3.2%' },
  { label: '净利润', display: '186亿', sub: '同比 +1.8%' },
  { label: '资产负债率', display: '64.2%', sub: '处于安全阈值' },
  { label: '投资完成率', display: '81%', sub: '重点项目推进', isRisk: true },
  { label: '资金归集率', display: '92%', sub: '司库集中管控' },
]

const dashboardRiskSamples = [
  { id: 'R01', type: '投资超预算', summary: '陇东风电基地二期累计超预算 12%', level: 'critical', levelLabel: '高风险', target: 'invest' },
  { id: 'R02', type: '异常支付', summary: '非白名单账户单笔 4800 万支付触发拦截', level: 'high', levelLabel: '预警', target: 'finance' },
  { id: 'R03', type: '高风险条款', summary: '100% 预付且无质保金条款被 AI 标红', level: 'high', levelLabel: '预警', target: 'equity' },
  { id: 'R04', type: '围标串标', summary: '三家投标单位 IP 相同且报价等差分布', level: 'critical', levelLabel: '高风险', target: 'overseas' },
]

const proactiveAlerts = [
  { id: 1, title: '建议先核查陇东风电 EPC 关联关系', level: 'critical', time: '刚刚', target: 'invest' },
  { id: 2, title: '建议冻结异常支付并追溯关联合同', level: 'high', time: '2 分钟前', target: 'finance' },
  { id: 3, title: '建议派发采购围标审计工单', level: 'high', time: '5 分钟前', target: 'overseas' },
]

const liveEvents = [
  { code: 'RE-2026-001', title: '陇东风电基地二期超预算预警', type: '投资', level: 'critical', target: 'invest' },
  { code: 'RE-2026-002', title: '非白名单账户支付 4800 万待处理', type: '资金', level: 'critical', target: 'finance' },
  { code: 'RE-2026-003', title: '采购项目围标概率达到 95%', type: '采购', level: 'critical', target: 'overseas' },
  { code: 'RE-2026-004', title: '合同出现 100% 预付高风险条款', type: '合同', level: 'high', target: 'equity' },
  { code: 'RE-2026-005', title: 'AI 检测到资金用途与项目节点不匹配', type: '资金', level: 'medium', target: 'finance' },
]

const toastQueue = [
  { text: '工程建设板块围标串标预警已触发', target: 'overseas' },
  { text: '陇东风电项目超预算 12%，建议进入投资穿透', target: 'invest' },
  { text: '4800 万非白名单支付待拦截', target: 'finance' },
  { text: '高风险合同条款已完成 AI 标红', target: 'equity' },
]

const toastIndex = ref(0)
const currentToast = computed(() => toastQueue[toastIndex.value])
const toastTarget = computed(() => currentToast.value.target)
let toastTimer = null

onMounted(() => {
  toastTimer = window.setInterval(() => {
    toastIndex.value = (toastIndex.value + 1) % toastQueue.length
  }, 4000)
})

onUnmounted(() => {
  window.clearInterval(toastTimer)
})

function badgeCls(level) {
  return {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  }[level] || 'low'
}

const riskDonutOption = computed(() => ({
  backgroundColor: 'transparent',
  color: riskLegend.map((item) => item.color),
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['52%', '72%'],
      center: ['50%', '46%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: '#060d22', borderWidth: 3 },
      data: riskLegend.map((item) => ({ name: item.label, value: item.value })),
    },
  ],
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: '36%',
      style: {
        text: '82',
        fill: '#e6f1ff',
        fontSize: 22,
        fontWeight: 700,
        fontFamily: 'Orbitron, JetBrains Mono, monospace',
      },
    },
    {
      type: 'text',
      left: 'center',
      top: '52%',
      style: {
        text: '家法人',
        fill: '#5d75a8',
        fontSize: 11,
      },
    },
  ],
}))

const sectorRiskBarOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 28, right: 10, top: 10, bottom: 24 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: sectorRiskData.map((item) => item.name),
    axisLabel: { color: '#9bb3da', fontSize: 10 },
    axisLine: { lineStyle: { color: 'rgba(72,162,255,0.18)' } },
  },
  yAxis: {
    type: 'value',
    max: 100,
    axisLabel: { color: '#5d75a8', fontSize: 9 },
    splitLine: { lineStyle: { color: 'rgba(72,162,255,0.08)' } },
  },
  series: [
    {
      type: 'bar',
      barWidth: 16,
      data: sectorRiskData.map((item) => ({
        value: item.value,
        itemStyle: {
          color: item.value >= 70 ? '#F56C6C' : item.value >= 60 ? '#E6A23C' : '#00d4ff',
          borderRadius: [4, 4, 0, 0],
        },
      })),
    },
  ],
}))

const heatmapOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    formatter: ({ data }) => `${data[1]} / ${data[0]}<br/>风险得分：${data[2]}`,
  },
  grid: { left: 60, right: 16, top: 12, bottom: 20 },
  xAxis: {
    type: 'category',
    data: ['投资', '资金', '合同', '采购'],
    axisLabel: { color: '#9bb3da', fontSize: 10 },
    axisLine: { lineStyle: { color: 'rgba(72,162,255,0.18)' } },
  },
  yAxis: {
    type: 'category',
    data: ['火电', '新能源', '煤炭', '化工', '金融'],
    axisLabel: { color: '#9bb3da', fontSize: 10 },
    axisLine: { lineStyle: { color: 'rgba(72,162,255,0.18)' } },
  },
  visualMap: {
    show: false,
    min: 0,
    max: 100,
    orient: 'horizontal',
    left: 'center',
    bottom: -4,
    textStyle: { color: '#5d75a8', fontSize: 9 },
    inRange: {
      color: ['#67C23A', '#E6B85C', '#E6A23C', '#F56C6C'],
    },
  },
  series: [
    {
      type: 'heatmap',
      data: [
        ['投资', '火电', 46], ['资金', '火电', 58], ['合同', '火电', 51], ['采购', '火电', 44],
        ['投资', '新能源', 82], ['资金', '新能源', 71], ['合同', '新能源', 63], ['采购', '新能源', 57],
        ['投资', '煤炭', 39], ['资金', '煤炭', 42], ['合同', '煤炭', 36], ['采购', '煤炭', 33],
        ['投资', '化工', 66], ['资金', '化工', 73], ['合同', '化工', 68], ['采购', '化工', 78],
        ['投资', '金融', 31], ['资金', '金融', 48], ['合同', '金融', 29], ['采购', '金融', 18],
      ].map(([x, y, value]) => [x, y, value]),
      label: { show: true, color: '#ffffff', fontSize: 10 },
      itemStyle: { borderColor: 'rgba(6,13,34,0.6)', borderWidth: 2 },
      emphasis: { itemStyle: { shadowBlur: 18, shadowColor: 'rgba(0,212,255,0.45)' } },
    },
  ],
}))

const alertTrendOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: {
    top: 0,
    right: 0,
    textStyle: { color: '#9bb3da', fontSize: 9 },
  },
  grid: { left: 26, right: 10, top: 24, bottom: 22 },
  xAxis: {
    type: 'category',
    data: ['06月', '07月', '08月', '09月', '10月', '11月', '12月', '01月', '02月', '03月', '04月', '05月'],
    axisLabel: { color: '#9bb3da', fontSize: 9 },
    axisLine: { lineStyle: { color: 'rgba(72,162,255,0.18)' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#5d75a8', fontSize: 9 },
    splitLine: { lineStyle: { color: 'rgba(72,162,255,0.08)' } },
  },
  series: [
    { name: '投资', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#F56C6C' }, data: [4, 5, 5, 6, 7, 6, 8, 9, 8, 10, 11, 13] },
    { name: '资金', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#00d4ff' }, data: [3, 4, 5, 4, 5, 6, 6, 7, 7, 8, 9, 10] },
    { name: '合同', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#E6A23C' }, data: [2, 3, 3, 4, 4, 4, 5, 5, 6, 7, 7, 8] },
  ],
}))

const boardInvestChart = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 10, right: 10, top: 10, bottom: 18 },
  xAxis: {
    type: 'category',
    data: ['P01', 'P04', 'P06'],
    axisLabel: { color: '#8ba3c7', fontSize: 9 },
    axisLine: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#5d75a8', fontSize: 8 },
    splitLine: { lineStyle: { color: 'rgba(72,162,255,0.08)' } },
  },
  series: [
    { name: '预算', type: 'bar', barWidth: 10, itemStyle: { color: '#00d4ff' }, data: [12.4, 45, 15] },
    { name: '实际', type: 'bar', barWidth: 10, itemStyle: { color: '#F56C6C' }, data: [14.7, 46.8, 16.8] },
  ],
}))

const boardFundsChart = computed(() => ({
  backgroundColor: 'transparent',
  series: [
    {
      type: 'gauge',
      radius: '86%',
      center: ['50%', '58%'],
      startAngle: 200,
      endAngle: -20,
      axisLine: {
        lineStyle: {
          width: 8,
          color: [
            [0.92, '#00e89f'],
            [1, '#1f2a44'],
          ],
        },
      },
      progress: { show: true, width: 8, itemStyle: { color: '#00d4ff' } },
      pointer: { length: '58%', width: 3, itemStyle: { color: '#e6f1ff' } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        offsetCenter: [0, '58%'],
        color: '#e6f1ff',
        fontSize: 15,
        fontWeight: 700,
      },
      data: [{ value: 92 }],
    },
  ],
}))

const boardProcurementChart = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 14, right: 6, top: 10, bottom: 16 },
  xAxis: {
    type: 'category',
    data: ['CG-01', 'CG-08', 'CG-12'],
    axisLabel: { color: '#8ba3c7', fontSize: 8 },
    axisLine: { show: false },
  },
  yAxis: {
    type: 'value',
    max: 100,
    axisLabel: { color: '#5d75a8', fontSize: 8 },
    splitLine: { lineStyle: { color: 'rgba(72,162,255,0.08)' } },
  },
  series: [
    {
      type: 'bar',
      barWidth: 12,
      data: [
        { value: 95, itemStyle: { color: '#F56C6C' } },
        { value: 74, itemStyle: { color: '#E6A23C' } },
        { value: 43, itemStyle: { color: '#00d4ff' } },
      ],
    },
  ],
}))

const boardContractChart = computed(() => ({
  backgroundColor: 'transparent',
  color: ['#67C23A', '#E6B85C', '#E6A23C', '#F56C6C'],
  series: [
    {
      type: 'pie',
      radius: ['46%', '70%'],
      center: ['50%', '52%'],
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: '#060d22', borderWidth: 2 },
      data: [
        { name: '正常', value: 164 },
        { name: '待审核', value: 55 },
        { name: '逾期', value: 17 },
        { name: '预警', value: 29 },
      ],
    },
  ],
}))
</script>

<style scoped>
/* ===== COCKPIT SHELL ===== */
.dashboard-cockpit {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.dashboard-cockpit .panel {
  padding: 6px 9px;
}

.dashboard-cockpit .panel-head {
  padding-bottom: 3px;
  margin-bottom: 4px;
}

.dashboard-cockpit .panel-head::after {
  width: 20px;
  height: 1px;
}

.dashboard-cockpit .panel-title {
  gap: 6px;
  font-size: 11px;
}

.dashboard-cockpit .panel-title::before {
  width: 2px;
  height: 9px;
}

.dashboard-cockpit .panel-title .pt-en {
  margin-left: 3px;
  font-size: 8px;
  letter-spacing: 0.16em;
}

.dashboard-cockpit .panel-action {
  padding: 1px 5px;
  font-size: 8px;
}

/* ===== TOAST ===== */
.toast-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  flex-shrink: 0;
  padding: 0 10px;
  border: 1px solid rgba(245, 108, 108, 0.34);
  background: linear-gradient(90deg, rgba(245, 108, 108, 0.16), rgba(8, 18, 42, 0.72));
  color: var(--t-1);
  cursor: pointer;
  box-shadow: inset 0 0 18px rgba(245, 108, 108, 0.08);
}

.toast-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--r-red);
  box-shadow: 0 0 10px var(--r-red);
  animation: pulse 1.8s ease-in-out infinite;
}

.toast-text {
  flex: 1;
  color: var(--t-2);
  font-size: 11px;
}

.toast-arrow {
  color: var(--primary);
  font-family: var(--f-n);
  font-size: 9px;
  letter-spacing: 0.12em;
}

/* ===== THREE-COLUMN BODY ===== */
.dbrd-body {
  display: grid;
  grid-template-columns: 24% 52% 24%;
  gap: 6px;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.col {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.panel-lg {
  min-height: 0;
}

/* ===== LEFT COLUMN: 4 panels, last one flex ===== */
.col-left {
  display: grid;
  grid-template-rows: 0.9fr 0.9fr 0.8fr 2fr;
  gap: 5px;
}

/* ===== CENTER COLUMN: kpi + heatmap + table + boards(flex) ===== */
.col-center {
  display: grid;
  grid-template-rows: 0.fr 1.05fr 1.2fr 1.4fr;
  gap: 1px;
}

/* ===== RIGHT COLUMN: trend + AI + events(flex) ===== */
.col-right {
  display: grid;
  grid-template-rows: 0.9fr 0.75fr 1.95fr;
  gap: 5px;
}

.col-left > .panel-lg,
.col-center > .panel-lg,
.col-right > .panel-lg {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ===== ECHART CONTAINERS ===== */
.p-chart {
  flex: 1;
  min-height: 110px;
  height: auto;
  width: 96%;
  margin: 0 auto;
}

/* override min-height from EChart.vue scoped style */
.p-chart :deep(.echart-host),
.heat-chart :deep(.echart-host),
.bd-chart :deep(.echart-host) {
  min-height: 0;
}

.heat-chart {
  min-height: 150px;
  height: auto;
  width: 98%;
}

/* ===== KPI ROW (center top) ===== */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  height: 100px;
  max-height: 90px;
  align-self: start;
}

.kpi-card {
  height: 100%;
  padding: 30px 4px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(15, 32, 64, 0.7), rgba(8, 18, 42, 0.82));
  text-align: center;
  overflow: hidden;
}

.kpi-card.kpi-risk {
  border-color: rgba(230, 162, 60, 0.45);
  box-shadow: inset 0 0 22px rgba(230, 162, 60, 0.08);
}

.kpi-num {
  font-family: var(--f-n);
  font-size: 13px;
  font-weight: 700;
  color: var(--t-1);
  line-height: 1.1;
}

.kpi-lbl {
  margin-top: 2px;
  font-size: 8px;
  color: var(--t-2);
  line-height: 1.1;
}

.kpi-sub {
  margin-top: 2px;
  font-size: 7px;
  color: var(--t-4);
  line-height: 1.1;
}

/* ===== DONUT LEGEND ===== */
.legend-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px 6px;
  margin-top: 2px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: var(--t-2);
}

.legend-item strong {
  margin-left: auto;
  font-family: var(--f-n);
}

.legend-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 2px;
}

/* ===== FUNDS MICRO GRID ===== */
.funds-micro-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.fm-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 4px 6px;
  border: 1px solid rgba(72, 162, 255, 0.16);
  background: rgba(15, 32, 64, 0.38);
}

.fm-icon {
  color: var(--primary);
  font-family: var(--f-n);
  font-size: 11px;
  line-height: 1;
}

.fm-val {
  font-family: var(--f-n);
  font-size: 12px;
  color: var(--t-1);
  font-weight: 700;
  line-height: 1.2;
}

.fm-label {
  font-size: 8px;
  color: var(--t-3);
  line-height: 1;
}

/* ===== CONTRACT PERF (bottom of left col, fills remaining) ===== */
.contract-perf-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.cp-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
}

.cp-name {
  color: var(--t-2);
  font-size: 9px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp-bar-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
}

.cp-bar {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(72, 162, 255, 0.1);
  overflow: hidden;
}

.cp-fill {
  height: 100%;
  border-radius: inherit;
}

.cp-fill.critical { background: #F56C6C; }
.cp-fill.high { background: #E6A23C; }
.cp-fill.medium { background: #E6B85C; }
.cp-fill.low { background: #67C23A; }

.cp-pct {
  width: 28px;
  text-align: right;
  color: var(--t-3);
  font-family: var(--f-n);
  font-size: 8px;
}

.overpay-warn {
  margin-top: 4px;
  padding: 3px 6px;
  border-left: 2px solid var(--r-orange);
  background: rgba(230, 162, 60, 0.08);
  color: var(--t-2);
  font-size: 8px;
  line-height: 1.4;
}

/* ===== COMPACT TABLE ===== */
.compact-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.compact-table {
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.compact-table th,
.compact-table td {
  padding: 4px 4px;
  border-bottom: 1px dashed rgba(72, 162, 255, 0.14);
  font-size: 8px;
  color: var(--t-2);
  text-align: left;
}

.compact-table th {
  color: var(--t-3);
  font-weight: 500;
}

.ct-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.ct-row:hover {
  background: rgba(0, 212, 255, 0.06);
}

.ct-mono {
  font-family: var(--f-n);
}

.ct-desc {
  color: var(--t-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ct-link {
  color: var(--primary);
}

/* ===== MODULE BOARDS (fills remaining center height) ===== */
.module-boards {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 3px;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.board-card {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 0;
  padding: 3px 4px;
  border: 1px solid rgba(72, 162, 255, 0.16);
  background: linear-gradient(180deg, rgba(15, 32, 64, 0.38), rgba(8, 18, 42, 0.7));
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  overflow: hidden;
}

.board-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 18px rgba(0, 212, 255, 0.08);
}

.bd-header {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.bd-icon {
  font-size: 9px;
}

.bd-name {
  flex: 1;
  color: var(--t-1);
  font-size: 8px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bd-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  margin-top: 1px;
}

.contract-kpis {
  grid-template-columns: repeat(4, 1fr);
}

.bd-kpi {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 1px;
  background: rgba(0, 0, 0, 0.16);
}

.bd-kpi strong {
  font-family: var(--f-n);
  font-size: 7px;
  color: var(--t-1);
  line-height: 1.2;
}

.bd-kpi small {
  color: var(--t-3);
  font-size: 4px;
  line-height: 1.2;
}

.bd-kpi.warn strong {
  color: var(--r-orange);
}

.bd-chart {
  height: auto;
  min-height: 72px;
  margin-top: 2px;
  width: 100%;
}

/* ===== AI PANEL ===== */
.ai-alerts {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-alerts-title {
  font-size: 10px;
  color: var(--t-3);
}

.ai-alert-item {
  padding: 4px 6px;
  border: 1px solid rgba(72, 162, 255, 0.12);
  background: rgba(15, 32, 64, 0.28);
  cursor: pointer;
}

.aa-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aa-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
}

.aa-dot.critical { background: #F56C6C; box-shadow: 0 0 8px #F56C6C; }
.aa-dot.high { background: #E6A23C; box-shadow: 0 0 8px #E6A23C; }
.aa-dot.medium { background: #E6B85C; }
.aa-dot.low { background: #67C23A; }

.aa-title {
  flex: 1;
  color: var(--t-2);
  font-size: 10px;
}

.aa-time {
  color: var(--t-4);
  font-size: 9px;
}

/* ===== LIVE EVENTS (fills remaining right height) ===== */

/* The last grid item in each col fills with 1fr — relay that height inward */
.col-left section:last-child,
.col-center section:last-child,
.col-right section:last-child {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  min-height: 0;
}

/* Shrink the left/right bottom panels by about one third as requested */

.col-left section:last-child,
.col-right section:last-child {
  min-height: 280px;
  align-self: stretch;
}

.col-left section:last-child .contract-perf-list,
.col-right section:last-child .event-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(72,162,255,0.14) transparent;
}

.col-right section:last-child .event-list {
  gap: 4px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-item {
  padding: 4px 6px;
  border-left: 3px solid var(--line-s);
  background: rgba(72, 162, 255, 0.04);
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease, transform 0.2s ease;
}

.event-item:hover {
  background: rgba(0, 212, 255, 0.08);
  transform: translateX(2px);
}

.event-item.critical { border-left-color: #F56C6C; }
.event-item.high { border-left-color: #E6A23C; }
.event-item.medium { border-left-color: #E6B85C; }
.event-item.low { border-left-color: #67C23A; }

.ev-head {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
}

.ev-lvl-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
}

.ev-lvl-dot.critical { background: #F56C6C; box-shadow: 0 0 8px #F56C6C; }
.ev-lvl-dot.high { background: #E6A23C; box-shadow: 0 0 8px #E6A23C; }
.ev-lvl-dot.medium { background: #E6B85C; }
.ev-lvl-dot.low { background: #67C23A; }

.ev-title {
  flex: 1;
  color: var(--t-1);
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-row2 {
  display: flex;
  justify-content: space-between;
  color: var(--t-3);
  font-size: 9px;
}

.ev-type {
  color: var(--primary);
}

.ev-code {
  font-family: var(--f-n);
}

.ev-nav {
  margin-top: 2px;
  color: var(--t-4);
  font-size: 8px;
  font-family: var(--f-n);
  letter-spacing: 0.12em;
}

/* ===== BADGES ===== */
.mini-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 1px 5px;
  border-radius: 999px;
  font-size: 8px;
  border: 1px solid transparent;
  line-height: 1.2;
  flex-shrink: 0;
}

.mini-badge.critical {
  color: #F56C6C;
  border-color: rgba(245, 108, 108, 0.5);
  background: rgba(245, 108, 108, 0.12);
}

.mini-badge.high {
  color: #E6A23C;
  border-color: rgba(230, 162, 60, 0.5);
  background: rgba(230, 162, 60, 0.12);
}

.mini-badge.medium {
  color: #E6B85C;
  border-color: rgba(230, 184, 92, 0.45);
  background: rgba(230, 184, 92, 0.12);
}

.mini-badge.low {
  color: #67C23A;
  border-color: rgba(103, 194, 58, 0.45);
  background: rgba(103, 194, 58, 0.12);
}
</style>
