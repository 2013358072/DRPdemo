<template>
  <div class="white-scene">
    <div class="screen">
      <section class="kpis">
        <article v-for="item in kpis" :key="item.id" class="card kpi" :style="{ '--c': item.color, '--bg': item.bg }">
          <div class="row">
            <span class="kpi-label">{{ item.label }}</span>
            <span class="pill" :style="{ color: item.color }">{{ item.tag }}</span>
          </div>
          <div class="kpi-value">{{ item.value }}<small>{{ item.unit }}</small></div>
          <EChart class="mini-chart" theme="light" :option="spark(item)" />
          <div class="row small">
            <strong :style="{ color: item.color }">{{ item.yoy }}</strong>
            <span>{{ item.desc }}</span>
          </div>
        </article>
      </section>

      <section class="value-kpis">
        <article
          v-for="item in valueKpis"
          :key="item.id"
          class="card value-kpi"
          :style="{ '--c': item.color, '--bg': item.bg }"
        >
          <div class="vk-main">
            <span class="value-kpi-label">{{ item.label }}</span>
            <span class="value-kpi-value">{{ item.value }}<small>{{ item.unit }}</small></span>
          </div>
          <div class="vk-sub">
            <strong :style="{ color: item.color }">{{ item.yoy }}</strong>
            <span class="vk-desc">{{ item.desc }}</span>
          </div>
        </article>
      </section>

      <div class="body">
        <aside class="left">
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>十大重点领域</h3>
              </div>
              <span class="pill blue">10 个领域</span>
            </div>
            <div class="area-list">
              <button
                v-for="area in areas"
                :key="area.id"
                class="area"
                :class="[area.level, { active: selectedAreaId === area.id, 'has-pulse': area.level !== 'green' }]"
                @click="handleAreaClick(area)"
              >
                <!-- 呼吸灯（非正常都有） -->
                <span v-if="area.level !== 'green'" class="area-pulse" :class="area.level"></span>

                <div class="area-row-1">
                  <span class="area-level-tag" :class="area.level">{{ area.text }}</span>
                  <strong class="area-name">{{ area.label }}</strong>
                  <span class="area-alerts" v-if="area.alerts > 0" :class="area.level">
                    <span class="area-alerts-num">{{ area.alerts }}</span>
                    <span class="area-alerts-lbl">待办</span>
                  </span>
                </div>
                <div class="area-row-2">
                  <div class="area-score-bar">
                    <span class="area-score-lbl">风险分</span>
                    <div class="area-bar" :class="area.level"><div class="area-bar-fill" :style="{ width: area.risk + '%' }"></div></div>
                    <strong class="area-score-val">{{ area.risk }}</strong>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section class="card panel">
            <div class="penetration-stack">
              <div class="penetration-card">
                <div class="penetration-head">
                  <strong>资金穿透</strong>
                  <span class="muted">全国企业 · 资金分布结构</span>
                </div>
                <EChart class="penetration-chart" theme="light" :option="fundsOption" @chart-click="handleFundsChartClick" />
              </div>

              <div class="penetration-card">
                <div class="penetration-head">
                  <strong>责任穿透</strong>
                  <span class="muted">全国法人 · 整改进度追踪</span>
                </div>
                <EChart class="penetration-chart" theme="light" :option="dutyOption" @chart-click="handleDutyChartClick" />
              </div>
            </div>
          </section>
        </aside>

        <main class="center">
          <section class="card panel map-panel">
            <div class="map-wrap">
              <div class="map" :class="{ dragging: isMapDragging }" @wheel.prevent="handleMapWheel" @mousedown="startMapDrag">
                <div class="map-zoom-layer" :style="mapTransformStyle">
                  <EChart class="map-chart" theme="light" :option="chinaMapOption" />
                  <svg viewBox="0 0 900 450" class="lines">
                    <path v-for="line in visibleLines" :key="line.id" :d="line.d" />
                  </svg>
                  <button
                    v-for="n in visibleNodes"
                    :key="n.id"
                    class="node"
                    :class="{ active: selectedUnitId === n.id }"
                    :style="{ left: `${n.x}%`, top: `${n.y}%` }"
                    @click="focusUnit(n.id, true)"
                  >
                    <span class="pulse"></span>
                    <span class="core"></span>
                    <span class="label">{{ n.name }}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="card panel panel-business">
            <div class="panel-head heatmap-head">
              <h3>业务穿透<span class="heatmap-sub">五大板块 × 风险域热力图</span></h3>
              <div class="heatmap-legend">
                <span class="legend-item"><i class="legend-color low"></i>正常</span>
                <span class="legend-item"><i class="legend-color watch"></i>关注</span>
                <span class="legend-item"><i class="legend-color medium"></i>中风险</span>
                <span class="legend-item"><i class="legend-color high"></i>高风险</span>
              </div>
            </div>
            <div class="heatmap-shell">
              <EChart class="biz-chart heatmap-chart" theme="light" :option="heatmapOption" @chart-click="handleHeatmapClick" />
            </div>
          </section>
        </main>

        <aside class="right">
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>预警趋势</h3>
                <p>近 12 个月 · 异常月标红</p>
              </div>
              <span class="pill red">12 个月</span>
            </div>
            <EChart class="trend" theme="light" :option="trendOption" />
          </section>

          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>实时风险事件列表</h3>
              </div>
              <span class="pill orange">{{ events.length }} 条</span>
            </div>
            <div class="table-head">
              <span>ID</span><span>类型</span><span>单位</span><span>描述</span><span>级别</span><span>状态</span><span>时间</span>
            </div>
            <div class="stack panel-scroll micro-scroll">
              <button v-for="e in sortedEvents" :key="e.id" class="event" :class="[e.level,{ focus: flashId===e.id }]" @click="openEvent(e)">
                <span class="mono ellipsis">{{ e.id }}</span>
                <span class="ellipsis">{{ e.scene }}</span>
                <span class="ellipsis">{{ e.unit }}</span>
                <span class="ellipsis">{{ e.desc }}</span>
                <span class="pill ellipsis" :class="e.level">{{ e.levelText }}</span>
                <span class="ellipsis">{{ e.status }}</span>
                <span class="ellipsis">{{ e.time }}</span>
              </button>
            </div>
          </section>

          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>AI 推荐处置</h3>
              </div>
              <span class="pill blue">智能建议</span>
            </div>
            <div class="stack panel-scroll micro-scroll">
              <div v-for="plan in plans" :key="plan.id" class="plan" :class="{ urgent: plan.urgent }" @click="showPlan(plan)">
                <div class="row plan-head"><strong>{{ plan.title }}</strong><span class="muted plan-deadline">{{ plan.deadline }}</span></div>
                <div class="muted plan-dept">责任部门：{{ plan.dept }}</div>
                <div class="desc plan-action">{{ plan.action }}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <transition name="fade">
      <div v-if="popupVisible && activePlan" class="popup card">
        <div class="row">
          <span class="pill red">AI 自动演示</span>
          <button class="close" @click="popupVisible=false">×</button>
        </div>
        <h4>{{ activePlan.title }}</h4>
        <p>{{ activePlan.action }}</p>
        <div class="muted">{{ activePlan.dept }} · {{ activePlan.deadline }}</div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="drawer" class="mask" @click.self="drawer=null">
        <div class="card drawer">
          <div class="row">
            <div>
              <div class="muted">对应穿透页面</div>
              <h3>{{ routeMap[drawer.route] }}</h3>
            </div>
            <button class="close" @click="drawer=null">×</button>
          </div>
          <div class="grid2 mt">
            <div><span>风险事项</span><strong>{{ drawer.desc }}</strong></div>
            <div><span>责任部门</span><strong>{{ drawer.dept }}</strong></div>
            <div><span>责任单位</span><strong>{{ drawer.unit }}</strong></div>
            <div><span>处理时限</span><strong>{{ drawer.deadline }}</strong></div>
          </div>
          <div class="chips mt">
            <span v-for="s in drawer.steps" :key="s" class="chip active">{{ s }}</span>
          </div>
          <div class="row mt">
            <button class="action ghost" @click="drawer=null">关闭</button>
            <button class="action primary" @click="emit('navigate', drawer.route)">进入穿透页面</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import EChart from '../components/EChart.vue'

const emit = defineEmits(['navigate'])
const closureRate = 91.8
const clock = ref('--:--:--')
const selectedAreaId = ref('funds')
const selectedUnitId = ref('hq')
const level = ref('associate')
const sector = ref('financialService')
const mapMode = ref('area')
const popupVisible = ref(false)
const activePlanId = ref('p1')
const drawer = ref(null)
const flashId = ref('E02')
const chinaMapReady = ref(false)
const mapScale = ref(1.38)
const mapOffset = ref({ x: 0, y: 80})
const isMapDragging = ref(false)
const mapTransformStyle = computed(() => ({
  transform: `translate(${mapOffset.value.x}px, ${mapOffset.value.y}px) scale(${mapScale.value})`,
}))
let mapDragStart = { x: 0, y: 0, offsetX: 0, offsetY: 0 }

const routeMap = { invest: '投资穿透页面', finance: '资金穿透页面', equity: '合同 / 责任穿透页面', overseas: '采购 / 境外穿透页面' }
const areaNavigateMap = {
  invest: 'investment',
  funds: 'funds',
  contract: 'contract',
  procurement: 'procurement',
}
const rank = { group: 0, subsidiary: 1, associate: 2 }

const kpis = [
  { id: 'a', label: '利润总额', value: '286.4', unit: '亿', yoy: '同比 +8.6%', desc: '利润稳中有升',  color: '#2563eb', bg: '#eff6ff', trend: [168,182,176,194,208,216,228,236,248,257,272,286] },
  { id: 'b', label: '净资产收益率', value: '12.8', unit: '%', yoy: '同比 +1.3pp', desc: '经营效率提升', color: '#7c3aed', bg: '#f5f3ff', trend: [8.1,8.4,8.7,9.2,9.6,10.1,10.6,10.9,11.2,11.8,12.3,12.8] },
  { id: 'c', label: '营业现金比率', value: '92.6', unit: '%', yoy: '同比 +4.2pp', desc: '现金流质量向好',  color: '#0891b2', bg: '#ecfeff', trend: [71,72,75,79,81,82,84,86,88,89,91,92.6] },
  { id: 'd', label: '资产负债率', value: '64.3', unit: '%', yoy: '同比 -1.1pp', desc: '风险可控',  color: '#ef4444', bg: '#fef2f2', trend: [68.9,68.4,67.8,67.4,67.1,66.6,66.1,65.9,65.5,65.1,64.8,64.3] },
  { id: 'e', label: '研发投入强度', value: '5.7', unit: '%', yoy: '同比 +0.8pp', desc: '创新投入增强', color: '#f97316', bg: '#fff7ed', trend: [3.2,3.5,3.7,4.0,4.2,4.5,4.8,5.0,5.2,5.3,5.5,5.7] },
  { id: 'f', label: '全员劳动生产率', value: '168', unit: '万/人', yoy: '同比 +6.5%', desc: '效率持续提升', color: '#16a34a', bg: '#f0fdf4', trend: [118,123,127,132,139,144,148,153,157,161,165,168] },
]

const valueKpis = [
  { id: 'v1', label: '提升增加值', value: '124.6', unit: '亿', yoy: '+12.3%', desc: '同比持续提升', color: '#0891b2', bg: '#ecfeff' },
  { id: 'v2', label: '功能价值', value: '92.8', unit: '亿', yoy: '+8.7%', desc: '功能价值稳健增长', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'v3', label: '经济增加值', value: '48.3', unit: '亿', yoy: '+15.2%', desc: 'EVA 优化显著', color: '#16a34a', bg: '#f0fdf4' },
  { id: 'v4', label: '战新产业占比', value: '38.6', unit: '%', yoy: '+3.1pp', desc: '战略性新兴产业收入及增加值', color: '#f97316', bg: '#fff7ed' },
  { id: 'v5', label: '品牌价值', value: '1,280', unit: '亿', yoy: '+9.4%', desc: '品牌持续增值', color: '#2563eb', bg: '#eff6ff' },
]

const areas = [
  { id: 'invest', label: '投资', risk: 58, alerts: 3, level: 'yellow', text: '关注', sector: 'powerEnergy', top3: ['风电基地二期付款节奏需复核', '参股项目资本金到位偏慢', '立项复盘资料待补齐'] },
  { id: 'funds', label: '资金', risk: 84, alerts: 6, level: 'red', text: '高风险', sector: 'financialService', top3: ['个别付款审批链较长', '白名单账户抽检待完成', '司库日终对账有轻微延迟'] },
  { id: 'contract', label: '合同', risk: 46, alerts: 2, level: 'yellow', text: '关注', sector: 'engineeringBuild', top3: ['增补协议台账需更新', '合同归档时效略慢', '履约节点提醒待确认'] },
  { id: 'procurement', label: '采购', risk: 68, alerts: 4, level: 'orange', text: '中风险', sector: 'equipmentMake', top3: ['部分供应商评分波动较大', '招采资料补录不及时', '关键设备到货周期需跟踪'] },
  { id: 'equity', label: '产权', risk: 32, alerts: 1, level: 'green', text: '正常', sector: 'financialService', top3: ['产权台账更新正常', '变更资料归档完整', '参股链路月度复核通过'] },
  { id: 'finance', label: '财务', risk: 61, alerts: 3, level: 'orange', text: '中风险', sector: 'powerEnergy', top3: ['成本归集需月末复核', '预算执行偏差可控', '共享凭证抽查正常'] },
  { id: 'payroll', label: '薪酬', risk: 26, alerts: 1, level: 'green', text: '正常', sector: 'innovationOther', top3: ['绩效发放流程平稳', '专项津贴留痕完整', '抽样复核未见异常'] },
  { id: 'overseas', label: '境外', risk: 38, alerts: 1, level: 'green', text: '正常', sector: 'engineeringBuild', top3: ['境外回单回传正常', '汇率敞口处于控制线内', '合规审批节点基本顺畅'] },
  { id: 'financial', label: '金融', risk: 52, alerts: 2, level: 'yellow', text: '关注', sector: 'financialService', top3: ['融资租赁回款整体稳定', '担保责任按月跟踪', '资产组合久期匹配正常'] },
  { id: 'accounting', label: '会计', risk: 29, alerts: 1, level: 'green', text: '正常', sector: 'equipmentMake', top3: ['会计映射抽检正常', '研发资本化边界清晰', '共享凭证质检通过'] },
]

const nodes = [
  { id: 'hq', name: '集团总部', x: 46, y: 24, level: 'group', levelLabel: '集团层', risk: 66, alerts: 3, dept: '集团风控中心', areaIds: ['funds','finance'], sectorKey: 'financialService', route: 'finance', path: ['集团总部'], pathLabel: '集团总部', problem: '司库归集运行总体平稳，个别跨账户调拨审批时长偏长。' },
  { id: 'east', name: '华东电力公司', x: 60, y: 36, level: 'subsidiary', levelLabel: '子公司', risk: 71, alerts: 4, dept: '投资管理部', areaIds: ['invest','funds'], sectorKey: 'powerEnergy', route: 'invest', path: ['集团总部','华东电力公司'], pathLabel: '集团总部 / 华东电力公司', problem: '风电项目存在轻微投资偏差，整体仍处于可控区间。' },
  { id: 'storage', name: '江苏储能参股公司', x: 68, y: 46, level: 'associate', levelLabel: '参股单位', risk: 59, alerts: 2, dept: '联合专班', areaIds: ['invest','contract'], sectorKey: 'powerEnergy', route: 'invest', path: ['集团总部','华东电力公司','江苏储能参股公司'], pathLabel: '集团总部 / 华东电力公司 / 江苏储能参股公司', problem: '参股单位合同回传稍慢，设备采购与付款节奏基本匹配。' },
  { id: 'south', name: '南方工程公司', x: 56, y: 69, level: 'subsidiary', levelLabel: '子公司', risk: 68, alerts: 3, dept: '采购监管部', areaIds: ['procurement','contract'], sectorKey: 'engineeringBuild', route: 'overseas', path: ['集团总部','南方工程公司'], pathLabel: '集团总部 / 南方工程公司', problem: '招采执行总体稳定，个别供应商资料补录略有延迟。' },
  { id: 'zhuhai', name: '珠海装备参股平台', x: 61, y: 77, level: 'associate', levelLabel: '参股单位', risk: 52, alerts: 2, dept: '采购监管部', areaIds: ['procurement','overseas'], sectorKey: 'equipmentMake', route: 'overseas', path: ['集团总部','南方工程公司','珠海装备参股平台'], pathLabel: '集团总部 / 南方工程公司 / 珠海装备参股平台', problem: '关键设备海外采购链路较长，但供应商关联核验结果正常。' },
  { id: 'west', name: '西部产融平台', x: 34, y: 53, level: 'subsidiary', levelLabel: '子公司', risk: 47, alerts: 1, dept: '金融业务部', areaIds: ['financial','funds'], sectorKey: 'financialService', route: 'finance', path: ['集团总部','西部产融平台'], pathLabel: '集团总部 / 西部产融平台', problem: '融资租赁回款节奏稳定，少量项目需持续观察。' },
]

const links = [
  ['hq','east'], ['east','storage'], ['hq','south'], ['south','zhuhai'], ['hq','west']
]

const sectors = [
  { key: 'powerEnergy', label: '电力能源', revenue: 865, profit: 96, risk: 64, area: 'invest', route: 'invest', desc: '投资规模较大，但多数项目执行平稳，少量重点项目需跟踪。' },
  { key: 'equipmentMake', label: '装备制造', revenue: 482, profit: 39, risk: 58, area: 'procurement', route: 'overseas', desc: '供应链整体稳定，采购进度和到货周期存在少量波动。' },
  { key: 'engineeringBuild', label: '工程建设', revenue: 536, profit: 44, risk: 61, area: 'contract', route: 'equity', desc: '工程履约总体可控，主要关注合同归档与境外协同效率。' },
  { key: 'financialService', label: '金融服务', revenue: 318, profit: 52, risk: 67, area: 'funds', route: 'finance', desc: '资金调度总体正常，局部审批时效仍需优化。' },
  { key: 'innovationOther', label: '科创与其他', revenue: 205, profit: 28, risk: 36, area: 'payroll', route: 'finance', desc: '研发与共享业务整体平稳，例行监测即可。' },
]

const heatmapMatrix = {
  powerEnergy: { invest: 76, funds: 84, contract: 55, procurement: 43, equity: 31, finance: 67, payroll: 28, overseas: 37, financial: 48, accounting: 34 },
  equipmentMake: { invest: 42, funds: 57, contract: 61, procurement: 72, equity: 36, finance: 53, payroll: 29, overseas: 65, financial: 33, accounting: 27 },
  engineeringBuild: { invest: 48, funds: 44, contract: 81, procurement: 69, equity: 35, finance: 58, payroll: 26, overseas: 74, financial: 39, accounting: 32 },
  financialService: { invest: 34, funds: 86, contract: 47, procurement: 38, equity: 52, finance: 78, payroll: 24, overseas: 41, financial: 63, accounting: 45 },
  innovationOther: { invest: 27, funds: 36, contract: 33, procurement: 29, equity: 22, finance: 43, payroll: 18, overseas: 25, financial: 31, accounting: 20 },
}

const plans = [
  { id: 'p1', title: '优化司库审批链路时效', dept: '司库运营中心', deadline: '1 个工作日', urgent: false, area: 'funds', unit: 'hq', action: '针对个别审批偏慢节点进行压缩，保持账户支付链路平稳运行。' },
  { id: 'p2', title: '复核重点项目投资节奏', dept: '投资管理部', deadline: '2 个工作日', urgent: false, area: 'invest', unit: 'east', action: '对重点风电项目开展例行穿透复核，确认预算、进度与付款的一致性。' },
  { id: 'p3', title: '补齐采购资料归档', dept: '采购监管部', deadline: '48h', urgent: false, area: 'procurement', unit: 'south', action: '完善招采留痕和供应商资料，维持采购风险在可控范围。' },
]

const events = [
  { id: 'E01', scene: '投资', unit: '华东电力公司', unitId: 'east', desc: '风电基地二期月度偏差略高于计划值', level: 'medium', levelText: '关注', status: '跟踪中', time: '09:18', route: 'invest', area: 'invest', dept: '投资管理部', deadline: '2 天', steps: ['复核预算节奏', '确认付款节点', '形成月度说明'] },
  { id: 'E02', scene: '资金', unit: '集团总部', unitId: 'hq', desc: '个别跨账户调拨审批耗时偏长', level: 'high', levelText: '中风险', status: '处理中', time: '09:26', route: 'finance', area: 'funds', dept: '司库运营中心', deadline: '1 天', steps: ['梳理审批节点', '优化处理时效', '回看抽样结果'] },
  { id: 'E03', scene: '合同', unit: '江苏储能参股公司', unitId: 'storage', desc: '增补协议归档时间晚于计划 1 天', level: 'green', levelText: '正常', status: '已提醒', time: '10:02', route: 'equity', area: 'contract', dept: '法务合规部', deadline: '48h', steps: ['补齐归档材料', '核验主合同', '完成例行复盘'] },
  { id: 'E04', scene: '采购', unit: '南方工程公司', unitId: 'south', desc: '关键设备到货进度需持续跟踪', level: 'medium', levelText: '关注', status: '跟踪中', time: '10:24', route: 'overseas', area: 'procurement', dept: '采购监管部', deadline: '3 天', steps: ['核对供货计划', '更新台账状态', '周度复盘'] },
  { id: 'E05', scene: '薪酬', unit: '西部产融平台', unitId: 'west', desc: '绩效发放抽检通过，持续例行监测', level: 'green', levelText: '正常', status: '已完成', time: '10:41', route: 'finance', area: 'payroll', dept: '人力资源部', deadline: '已完成', steps: ['抽检发放明细', '核验审批留痕', '归档月度记录'] },
]

// 全国企业资金穿透 – 按板块归集资金规模（亿元）
const fundFlowItems = [
  { id: 'ff1', name: '电力能源', value: 865, unitId: 'east',    area: 'invest',      route: 'invest',   riskLabel: '正常' },
  { id: 'ff2', name: '工程建设', value: 536, unitId: 'south',   area: 'contract',    route: 'equity',   riskLabel: '关注' },
  { id: 'ff3', name: '装备制造', value: 482, unitId: 'south',   area: 'procurement', route: 'overseas', riskLabel: '正常' },
  { id: 'ff4', name: '金融服务', value: 318, unitId: 'west',    area: 'funds',       route: 'finance',  riskLabel: '关注' },
  { id: 'ff5', name: '科创其他', value: 205, unitId: 'hq',      area: 'finance',     route: 'finance',  riskLabel: '正常' },
  { id: 'ff6', name: '预警资金', value: 15,  unitId: 'hq',      area: 'funds',       route: 'finance',  riskLabel: '高风险' },
]

// 全国法人责任穿透 – 各成员单位整改完成率（%）
const dutyBars = [
  { id: 'db1', name: '集团总部',   value: 91, unitId: 'hq',      area: 'funds',       planId: 'p1', owner: '集团总部',   project: '全口径整改', riskItem: '审批链路优化', status: '处理中' },
  { id: 'db2', name: '集团财务',   value: 85, unitId: 'west',    area: 'funds',       planId: 'p1', owner: '集团财务',   project: '资金归集',   riskItem: '归集效率',     status: '处理中' },
  { id: 'db3', name: '华东电力',   value: 78, unitId: 'east',    area: 'invest',      planId: 'p2', owner: '华东电力',   project: '投资偏差整改', riskItem: '投资节奏',    status: '跟踪中' },
  { id: 'db4', name: '南方工程',   value: 64, unitId: 'south',   area: 'procurement', planId: 'p3', owner: '南方工程',   project: '采购合规',   riskItem: '供应商管理',   status: '跟踪中' },
  { id: 'db5', name: '西部产融',   value: 52, unitId: 'west',    area: 'financial',   planId: 'p1', owner: '西部产融',   project: '金融风险',   riskItem: '融资敞口',     status: '核查中' },
  { id: 'db6', name: '海外工程',   value: 43, unitId: 'south',   area: 'overseas',    planId: 'p3', owner: '海外工程',   project: '境外合规',   riskItem: '履约进度',     status: '核查中' },
]

const currentArea = computed(() => areas.find(i => i.id === selectedAreaId.value) || areas[0])
const currentUnit = computed(() => nodes.find(i => i.id === selectedUnitId.value) || nodes[0])
const currentSector = computed(() => sectors.find(i => i.key === sector.value) || sectors[0])
const activePlan = computed(() => plans.find(i => i.id === activePlanId.value))
const visibleNodes = computed(() => nodes.filter((i) => {
  const match = mapMode.value === 'sector' ? i.sectorKey === sector.value : i.areaIds.includes(selectedAreaId.value)
  return match && rank[i.level] <= rank[level.value]
}))
const visibleLines = computed(() => links.map(([a,b],idx)=>{ const from=nodes.find(i=>i.id===a); const to=nodes.find(i=>i.id===b); if(!from||!to) return null; if(!visibleNodes.value.some(i=>i.id===a)||!visibleNodes.value.some(i=>i.id===b)) return null; return { id: idx, d: `M ${from.x*9} ${from.y*4.5} C ${(from.x+to.x)*4.5} ${from.y*4.5}, ${(from.x+to.x)*4.5} ${to.y*4.5}, ${to.x*9} ${to.y*4.5}` } }).filter(Boolean))
const sortedEvents = computed(() => [...events].sort((a,b) => (b.area===selectedAreaId.value) - (a.area===selectedAreaId.value)))
function buildHeatTop3(cellValue, sectorLabel, areaItem) {
  if (cellValue >= 75) {
    return [
      `${sectorLabel}${areaItem.label}需重点跟踪`,
      areaItem.top3[0],
      '建议维持周度穿透复核',
    ]
  }
  if (cellValue >= 55) {
    return [
      `${sectorLabel}${areaItem.label}总体可控`,
      areaItem.top3[1],
      '保持月度抽样检查',
    ]
  }
  return [
    `${sectorLabel}${areaItem.label}运行平稳`,
    areaItem.top3[2],
    '当前以例行监测为主',
  ]
}

function getRiskLevel(value) {
  if (value >= 80) return { key: 'red', label: '高风险', color: '#ef4444' }
  if (value >= 60) return { key: 'orange', label: '中风险', color: '#f97316' }
  if (value >= 40) return { key: 'yellow', label: '关注', color: '#facc15' }
  return { key: 'green', label: '正常', color: '#22c55e' }
}

function areaDotCount(value) {
  if (value >= 80) return 5
  if (value >= 60) return 4
  if (value >= 40) return 3
  return 2
}

const heatmapData = computed(() => sectors.flatMap((sectorItem, rowIndex) => areas.map((areaItem, colIndex) => ({
  value: [colIndex, rowIndex, heatmapMatrix[sectorItem.key][areaItem.id]],
  sectorKey: sectorItem.key,
  sectorLabel: sectorItem.label,
  areaId: areaItem.id,
  areaLabel: areaItem.label,
  level: getRiskLevel(heatmapMatrix[sectorItem.key][areaItem.id]),
  top3: buildHeatTop3(heatmapMatrix[sectorItem.key][areaItem.id], sectorItem.label, areaItem),
  route: sectorItem.route || routeMap[areaItem.id],
}))))

const provinceCases = [
  { name: '北京市', value: 84, case: '司库集中支付频次较高，需重点跟踪' },
  { name: '上海市', value: 66, case: '金融类审批效率待优化' },
  { name: '江苏省', value: 55, case: '合同归档时效需持续复核' },
  { name: '浙江省', value: 33, case: '供应链执行平稳，维持例行监测' },
  { name: '山东省', value: 45, case: '财务抽样复核存在轻微波动' },
  { name: '广东省', value: 72, case: '采购到货周期波动，需要周度跟踪' },
  { name: '福建省', value: 29, case: '境外业务回单正常，风险较低' },
  { name: '湖北省', value: 42, case: '项目付款节奏略有波动' },
  { name: '河南省', value: 38, case: '共享服务运行稳定' },
  { name: '四川省', value: 58, case: '产融业务需保持月度抽检' },
  { name: '重庆市', value: 31, case: '会计抽查正常，处于稳定区间' },
  { name: '云南省', value: 26, case: '境外项目推进平稳' },
  { name: '陕西省', value: 64, case: '工程履约节点存在一定压力' },
  { name: '辽宁省', value: 36, case: '装备制造经营平稳' },
  { name: '新疆维吾尔自治区', value: 47, case: '项目投资复盘待补充材料' },
  { name: '内蒙古自治区', value: 52, case: '新能源项目资金节奏需关注' },
]

const chinaRiskProvinces = computed(() => provinceCases.map((item) => ({
  ...item,
  level: getRiskLevel(item.value),
})))

const chinaMapOption = computed(() => {
  if (!chinaMapReady.value) {
    return {
      animation: false,
      graphic: [{
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '中国地图加载中...',
          fill: '#94a3b8',
          fontSize: 14,
          fontWeight: 600,
        },
      }],
    }
  }

  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      formatter: ({ data }) => {
        if (!data) return ''
        return `
          <div style="font-weight:700;color:#1e40af;margin-bottom:6px">${data.name}</div>
          <div>风险级别：<strong style="color:${data.level.color}">${data.level.label}</strong></div>
          <div>风险指数：<strong>${data.value || 0}</strong></div>
          <div style="margin-top:4px">${data.case}</div>
        `
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      type: 'piecewise',
      show: false,
      pieces: [
        { min: 80, color: '#ef4444' },
        { min: 60, max: 79, color: '#f97316' },
        { min: 40, max: 59, color: '#facc15' },
        { max: 39, color: '#22c55e' },
      ],
    },
    series: [
      {
        type: 'map',
        map: 'china',
        roam: false,
        selectedMode: false,
        layoutCenter: ['50%', '53%'],
        layoutSize: '102%',
        label: {
          show: false,
          color: '#475569',
        },
        itemStyle: {
          areaColor: '#f8fafc',
          borderColor: '#cbd5e1',
          borderWidth: 1,
        },
        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: '#dbeafe',
            borderColor: '#93c5fd',
          },
        },
        data: chinaRiskProvinces.value,
      },
    ],
  }
})

function tick() { const d = new Date(); const p = n => String(n).padStart(2,'0'); clock.value = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }
function spark(item) { return { animation:false, grid:{left:0,right:0,top:4,bottom:0}, xAxis:{show:false,type:'category',data:item.trend.map((_,i)=>i)}, yAxis:{show:false,type:'value'}, series:[{ type:'line', smooth:true, symbol:'none', data:item.trend, lineStyle:{ width:2, color:item.color }, areaStyle:{ color:{ type:'linear', x:0, y:0, x2:0, y2:1, colorStops:[{offset:0,color:`${item.color}33`},{offset:1,color:`${item.color}05`}] } } }] } }
function selectArea(id, options = {}) {
  selectedAreaId.value = id
  const a = areas.find(i => i.id === id)
  if (a && options.syncSector !== false) sector.value = a.sector
  if (options.activateMap !== false) mapMode.value = 'area'
  if (options.focusTarget !== false) {
    const target = nodes.filter(i => i.areaIds.includes(id)).sort((a,b)=>b.risk-a.risk)[0]
    if (target) focusUnit(target.id, false, { preserveArea: true, preserveMap: true })
  }
}
function handleAreaClick(area) {
  selectArea(area.id)
  const targetRoute = areaNavigateMap[area.id]
  if (targetRoute) emit('navigate', targetRoute)
}
function focusUnit(id, advance, options = {}) {
  const unit = nodes.find(i => i.id === id)
  if (!unit) return
  selectedUnitId.value = id
  sector.value = unit.sectorKey
  if (!options.preserveArea) selectedAreaId.value = unit.areaIds[0]
  if (!options.preserveMap) mapMode.value = 'area'
  if (advance) level.value = unit.level === 'group' ? 'subsidiary' : 'associate'
}
function focusSector(key) {
  sector.value = key
  mapMode.value = 'sector'
  const target = nodes.filter(i => i.sectorKey === key).sort((a, b) => b.risk - a.risk)[0]
  if (target) {
    selectedUnitId.value = target.id
  }
}
function clampMapScale(next) {
  return Math.min(1.45, Math.max(0.5, Number(next.toFixed(2))))
}
function handleMapWheel(event) {
  const delta = event.deltaY > 0 ? -0.08 : 0.08
  mapScale.value = clampMapScale(mapScale.value + delta)
}
function startMapDrag(event) {
  if (event.target?.closest?.('.node')) return
  isMapDragging.value = true
  mapDragStart = {
    x: event.clientX,
    y: event.clientY,
    offsetX: mapOffset.value.x,
    offsetY: mapOffset.value.y,
  }
}
function handleMapDragMove(event) {
  if (!isMapDragging.value) return
  mapOffset.value = {
    x: mapDragStart.offsetX + event.clientX - mapDragStart.x,
    y: mapDragStart.offsetY + event.clientY - mapDragStart.y,
  }
}
function stopMapDrag() {
  isMapDragging.value = false
}
function selectSector(key) {
  const s = sectors.find(i => i.key === key)
  if (!s) return
  focusSector(key)
}
function showPlan(plan) { activePlanId.value = plan.id; popupVisible.value = true; selectedAreaId.value = plan.area; focusUnit(plan.unit, true) }
function openEvent(e) { flashId.value = e.id; selectedAreaId.value = e.area; focusUnit(e.unitId, true); drawer.value = e }
function handleFundsChartClick(params) {
  const item = fundFlowItems.find((entry) => entry.name === params.name)
  if (!item) return
  selectedAreaId.value = item.area
  focusUnit(item.unitId, true)
  emit('navigate', item.route)
}
function handleDutyChartClick(params) {
  const item = dutyBars.find((entry) => entry.name === params.name)
  if (!item) return
  selectedAreaId.value = item.area
  focusUnit(item.unitId, true)
  const plan = plans.find((entry) => entry.id === item.planId)
  if (plan) showPlan(plan)
}
function handleHeatmapClick(params) {
  if (params.componentType === 'yAxis') {
    const row = sectors.find((item) => item.label === params.value)
    if (row) selectSector(row.key)
    return
  }

  if (params.componentType === 'xAxis') {
    const col = areas.find((item) => item.label === params.value)
    if (col) selectArea(col.id)
    return
  }

  if (params.componentType === 'series' && params.seriesType === 'heatmap' && params.data) {
    const cell = params.data
    focusSector(cell.sectorKey)
    selectArea(cell.areaId, { syncSector: false, activateMap: false, focusTarget: false })
    if (cell.value[2] >= 80 && cell.route) {
      emit('navigate', cell.route)
    }
  }
}
async function loadChinaMap() {
  try {
    const geoJson = await fetch('/china.json').then((res) => res.json())
    echarts.registerMap('china', geoJson)
    chinaMapReady.value = true
  } catch (error) {
    console.error('Failed to load china map:', error)
  }
}

const heatmapOption = computed(() => ({
  backgroundColor: 'transparent',
  grid: { left: 76, right: 8, top: 10, bottom: 2, containLabel: true },
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: '#dbeafe',
    borderWidth: 1,
    textStyle: { color: '#334155' },
    formatter: (params) => {
      if (!params.data) return ''
      const cell = params.data
      return `
        <div style="font-weight:700;color:#1e40af;margin-bottom:6px">${cell.sectorLabel} · ${cell.areaLabel}</div>
        <div>风险级别：<strong style="color:${cell.level.color}">${cell.level.label}</strong></div>
        <div style="margin-bottom:4px">风险指数：<strong>${cell.value[2]}</strong></div>
        <div>TOP3：</div>
        <div>1. ${cell.top3[0]}</div>
        <div>2. ${cell.top3[1]}</div>
        <div>3. ${cell.top3[2]}</div>
      `
    },
  },
  xAxis: {
    type: 'category',
    position: 'top',
    data: areas.map(i => i.label),
    triggerEvent: true,
    axisLine: { show: false },
    axisTick: { show: false },
    splitArea: { show: false },
    axisLabel: {
      interval: 0,
      color: '#475569',
      fontSize: 10,
      margin: 6,
      formatter: (value) => value === currentArea.value.label ? `{active|${value}}` : `{normal|${value}}`,
      rich: {
        active: { color: '#2563eb', fontWeight: 700, backgroundColor: '#eff6ff', padding: [3, 5], borderRadius: 6 },
        normal: { color: '#475569', fontWeight: 600 },
      },
    },
  },
  yAxis: {
    type: 'category',
    data: sectors.map(i => i.label),
    triggerEvent: true,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#475569',
      fontSize: 10,
      margin: 6,
      fontWeight: 700,
      formatter: (value) => value === currentSector.value.label ? `{active|${value}}` : `{normal|${value}}`,
      rich: {
        active: { color: '#2563eb', fontWeight: 700, backgroundColor: '#eff6ff', padding: [3, 6], borderRadius: 6 },
        normal: { color: '#334155', fontWeight: 700 },
      },
    },
  },
  visualMap: {
    min: 0,
    max: 100,
    type: 'piecewise',
    show: false,
    calculable: false,
    pieces: [
      { min: 80, color: '#ef4444' },
      { min: 60, max: 79, color: '#f97316' },
      { min: 40, max: 59, color: '#facc15' },
      { max: 39, color: '#22c55e' },
    ],
  },
  series: [
    {
      type: 'heatmap',
      data: heatmapData.value,
      progressive: 0,
      label: {
        show: true,
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        formatter: ({ data }) => data.value[2],
      },
      itemStyle: {
        borderRadius: 10,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 18,
          shadowColor: 'rgba(15,23,42,0.18)',
        },
      },
    },
  ],
}))

const fundsOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255,255,255,.97)',
    borderColor: '#dbeafe',
    textStyle: { color: '#334155', fontSize: 11 },
    formatter: ({ data }) => `<b>${data.name}</b><br/>资金规模：<b>${data.value} 亿元</b><br/>风险：${data.riskLabel}`,
  },
  legend: {
    bottom: 2,
    left: 'center',
    orient: 'horizontal',
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 8,
    textStyle: { color: '#64748b', fontSize: 9 },
  },
  series: [
    {
      type: 'pie',
      radius: ['34%', '58%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 11, fontWeight: 700, color: '#0f172a' },
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,.14)' },
      },
      data: fundFlowItems.map((item, index) => ({
        ...item,
        itemStyle: {
          color: ['#2563eb','#0891b2','#7c3aed','#16a34a','#f97316','#ef4444'][index],
        },
      })),
    },
  ],
}))

const dutyOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255,255,255,.97)',
    borderColor: '#dbeafe',
    textStyle: { color: '#334155', fontSize: 11 },
    formatter: ({ data }) => `<b>${data.name}</b><br/>整改进度：<b>${data.value}%</b><br/>主要事项：${data.riskItem}<br/>状态：${data.status}`,
  },
  grid: { left: 56, right: 30, top: 4, bottom: 4, containLabel: true },
  xAxis: { type: 'value', max: 100, show: false },
  yAxis: {
    type: 'category',
    data: dutyBars.map(i => i.name),
    axisLabel: { color: '#334155', fontSize: 10, fontWeight: 600 },
    axisTick: { show: false },
    axisLine: { show: false },
  },
  series: [
    {
      type: 'bar',
      barWidth: 9,
      showBackground: true,
      backgroundStyle: { color: '#f1f5f9', borderRadius: [0, 6, 6, 0] },
      data: dutyBars.map(item => ({
        ...item,
        value: item.value,
        itemStyle: {
          color: item.value >= 80 ? '#16a34a' : item.value >= 60 ? '#2563eb' : item.value >= 50 ? '#f97316' : '#ef4444',
          borderRadius: [0, 6, 6, 0],
        },
      })),
      label: {
        show: true,
        position: 'right',
        color: '#64748b',
        fontSize: 9,
        formatter: ({ data }) => `${data.value}%`,
      },
    },
  ],
}))

const trendOption = computed(() => ({
  backgroundColor:'transparent',
  tooltip:{ trigger:'axis' },
  legend:{ top:0, textStyle:{ color:'#64748b', fontSize:11 } },
  grid:{ left:32, right:10, top:26, bottom:16, containLabel:true },
  xAxis:{ type:'category', data:['06月','07月','08月','09月','10月','11月','12月','01月','02月','03月','04月','05月'], axisLabel:{ color:'#64748b', fontSize:10, margin: 8 }, axisLine:{ lineStyle:{ color:'#cbd5e1' } } },
  yAxis:{ type:'value', axisLabel:{ color:'#64748b', fontSize:10 }, splitLine:{ lineStyle:{ color:'#e2e8f0' } } },
  series:[
    { name:'投资', type:'line', smooth:true, symbol:'circle', symbolSize:7, lineStyle:{ width:3, color:'#2563eb' }, itemStyle:{ color:'#2563eb' }, markPoint:{ symbolSize:32, itemStyle:{ color:'#ef4444' }, data:[{ coord:['03月',12], value:'异常' }] }, data:[4,5,5,6,7,6,7,8,9,12,11,10] },
    { name:'资金', type:'line', smooth:true, symbol:'circle', symbolSize:7, lineStyle:{ width:3, color:'#0891b2' }, itemStyle:{ color:'#0891b2' }, data:[3,4,4,5,5,6,7,8,7,8,9,11] },
    { name:'合同', type:'line', smooth:true, symbol:'circle', symbolSize:7, lineStyle:{ width:3, color:'#7c3aed' }, itemStyle:{ color:'#7c3aed' }, data:[2,3,3,4,4,5,6,6,6,7,8,8] },
    { name:'采购', type:'line', smooth:true, symbol:'circle', symbolSize:7, lineStyle:{ width:3, color:'#f97316' }, itemStyle:{ color:'#f97316' }, markPoint:{ symbolSize:32, itemStyle:{ color:'#ef4444' }, data:[{ coord:['05月',10], value:'异常' }] }, data:[2,2,3,3,4,5,5,6,7,8,10,9] },
  ],
}))

let t1 = null
let t2 = null
let t3 = null
onMounted(() => {
  loadChinaMap()
  tick()
  window.addEventListener('mousemove', handleMapDragMove)
  window.addEventListener('mouseup', stopMapDrag)
  t1 = setInterval(tick, 1000)
  t2 = setTimeout(() => {
    selectArea('funds')
    focusUnit('hq', true)
    flashId.value = 'E02'
    t3 = setTimeout(() => showPlan(plans[0]), 700)
  }, 2000)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMapDragMove)
  window.removeEventListener('mouseup', stopMapDrag)
  clearInterval(t1)
  clearTimeout(t2)
  clearTimeout(t3)
})
</script>

<style scoped>
.white-scene{height:100%;background:#f8fafc;overflow:hidden;position:relative;color:#1e293b}.screen{height:100%;display:grid;grid-template-rows:auto 1fr;gap:16px;padding:16px;font-family:'Source Han Sans SC','Microsoft YaHei',sans-serif}.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.06)}.panel h3,.detail h4,.drawer h3,.popup h4{margin:0;color:#0f172a;font-weight:800}.muted,.small,.table-head,.panel p{color:#64748b}.chips,.row{display:flex;gap:10px;align-items:center}.kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}.kpi{display:flex;flex-direction:column;min-height:150px;padding:16px;background:linear-gradient(180deg,var(--bg),#fff 78%)}.kpi-label{font-size:13px}.kpi-value{margin-top:8px;font-size:30px;font-weight:800;color:var(--c)}.kpi-value small{margin-left:6px;font-size:13px}.mini-chart{flex:1;min-height:48px;margin:8px 0 4px}.body{display:grid;grid-template-columns:320px 1fr 360px;gap:16px;min-height:0}.left,.right{display:grid;grid-template-rows:1fr 1fr;gap:16px;min-height:0}.center{display:grid;grid-template-rows:1.08fr .92fr;gap:16px;min-height:0}.panel{display:flex;flex-direction:column;min-height:0;padding:18px}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}.panel p{margin:6px 0 0;font-size:12px}.stack{display:flex;flex-direction:column;gap:10px;min-height:0;flex:1}.pill,.chip{display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}.pill{background:#eff6ff;color:#2563eb}.pill.blue,.chip.active,.btn.active{background:#eff6ff;color:#2563eb}.pill.orange,.orange{background:#fff7ed;color:#f97316}.pill.red,.red,.critical{background:#fef2f2;color:#ef4444}.yellow,.medium{background:#fefce8;color:#ca8a04}.green{background:#f0fdf4;color:#16a34a}.chip,.btn{border:1px solid #e2e8f0;background:#f8fafc;color:#475569}.area,.issue,.plan,.detail-card,.event{border:1px solid #e2e8f0;border-radius:12px;background:#fff}.area{display:flex;flex-direction:column;gap:10px;padding:14px;text-align:left;cursor:pointer}.area.active,.area:hover,.event:hover,.plan:hover{border-color:#bfdbfe;box-shadow:0 8px 20px rgba(37,99,235,.08)}.area strong,.issue strong,.plan strong,.detail strong{color:#0f172a}.bar{height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden}.bar span{display:block;height:100%;border-radius:inherit}.bar .red{background:linear-gradient(90deg,#ef4444,#fb7185)}.bar .orange{background:linear-gradient(90deg,#f97316,#fb923c)}.bar .yellow{background:linear-gradient(90deg,#facc15,#f59e0b)}.bar .green{background:linear-gradient(90deg,#22c55e,#16a34a)}.issue,.plan{padding:12px;cursor:pointer}.desc{margin-top:6px;line-height:1.6;color:#334155}.dot{width:10px;height:10px;border-radius:50%;background:rgba(239,68,68,.22)}.dot.on{background:#ef4444;box-shadow:0 0 12px rgba(239,68,68,.28)}.progresses{display:flex;flex-direction:column;gap:10px;margin-top:14px}.map-wrap{display:grid;grid-template-columns:1fr 300px;gap:16px;flex:1;min-height:0}.map{position:relative;border:1px solid #e2e8f0;border-radius:16px;background:linear-gradient(180deg,#fff,#f8fafc);overflow:hidden}.map-chart,.lines{width:100%;height:100%}.map-chart{position:absolute;inset:0}.lines{position:absolute;inset:0;pointer-events:none}.lines path{fill:none;stroke:#cbd5e1;stroke-width:2;stroke-dasharray:6 6}.node{position:absolute;transform:translate(-50%,-50%);background:none;border:none;padding:0;cursor:pointer}.pulse,.core{position:absolute;border-radius:50%}.pulse{inset:-8px;background:rgba(125,211,252,.18);animation:pulse 2s ease-out infinite}.core{width:12px;height:12px;background:#93c5fd;box-shadow:0 0 0 5px rgba(147,197,253,.22)}.node .label{display:block;margin-left:18px;padding:8px 10px;border-radius:10px;border:1px solid #dbeafe;background:rgba(255,255,255,.95);color:#475569;white-space:nowrap;box-shadow:0 10px 24px rgba(148,163,184,.12)}.node.active .label{font-weight:700}.detail{display:flex;flex-direction:column;gap:16px}.detail-card{padding:16px}.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.grid2>div{display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:12px;background:#f8fafc}.biz{display:grid;grid-template-columns:1fr 220px;gap:16px;flex:1;min-height:0}.biz-chart,.trend{min-height:0;flex:1}.biz-side{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}.table-head,.event{display:grid;grid-template-columns:72px 52px 92px 1fr 64px 52px 52px;gap:8px;align-items:center}.table-head{padding:0 12px 10px;font-size:11px;font-weight:600}.event{padding:12px;text-align:left;cursor:pointer;color:#334155;transition:.2s}.event.critical,.event.high{border-left:3px solid #ef4444}.event.focus{animation:blink 1.3s ease-in-out infinite}.ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mono{font-family:'JetBrains Mono',monospace}.popup{position:absolute;top:26px;right:26px;width:360px;padding:18px;z-index:20;border-color:#fecaca}.close{width:28px;height:28px;border:none;border-radius:50%;background:#f8fafc;color:#64748b;cursor:pointer}.mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.12);backdrop-filter:blur(3px);z-index:18}.drawer{width:680px;max-width:calc(100% - 48px);padding:22px}.action{min-width:128px;padding:10px 18px;border:none;border-radius:10px;font-weight:700;cursor:pointer}.action.primary{background:#2563eb;color:#fff}.action.ghost{background:#f1f5f9;color:#334155}.mt{margin-top:16px}.fade-enter-active,.fade-leave-active{transition:all .25s ease}.fade-enter-from,.fade-leave-to{opacity:0;transform:translateY(8px)}@keyframes pulse{0%{transform:scale(.7);opacity:.8}100%{transform:scale(1.4);opacity:0}}@keyframes blink{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.12)}50%{box-shadow:0 0 0 6px rgba(239,68,68,.08)}}
.screen {
  grid-template-rows: auto auto 1fr;
  gap: 6px;
  padding: 8px 14px;
}

.kpis {
  gap: 6px;
}

.kpi {
  min-height: 46px;
  padding: 6px 10px;
}

.kpi-label {
  font-size: 11px;
}

.kpi .pill {
  padding: 2px 6px;
  font-size: 10px;
}

.kpi-value {
  margin-top: 2px;
  font-size: 15px;
}

.kpi-value small {
  font-size: 10px;
}

.mini-chart {
  min-height: 14px;
  margin: 2px 0 1px;
}

.kpi .small {
  font-size: 10px;
}

.value-kpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.value-kpi {
  min-height: 52px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  background: linear-gradient(135deg, var(--bg, #f8fafc) 0%, #fff 65%);
  border-left: 3px solid var(--c, #2563eb);
  border-radius: 10px;
}

.value-kpi-label {
  font-size: 11px;
  color: #475569;
  font-weight: 600;
  line-height: 1.2;
}

.value-kpi-value {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.value-kpi-value small {
  margin-left: 3px;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}

.vk-sub,
.value-kpi-sub {
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.vk-sub strong,
.value-kpi-sub strong {
  font-size: 10px;
}

.vk-desc {
  font-size: 11px;
  line-height: 1.2;
}

.body {
  gap: 10px;
  grid-template-columns: 300px 1fr 346px;
}

.center {
  grid-template-rows: 3fr 1fr;
  gap: 8px;
}

.map-panel {
  padding: 10px;
}

.panel-business {
  padding: 14px 16px;
}

.panel-business .panel-head {
  margin-bottom: 10px;
}

.panel-business h3 {
  font-size: 16px;
}

.panel-business .panel-head p {
  margin-top: 4px;
  font-size: 11px;
}

.panel-business .chip,
.panel-business .pill {
  padding: 3px 8px;
  font-size: 11px;
}

.panel-business .biz {
  grid-template-columns: 1fr 180px;
  gap: 12px;
}

.panel-business .biz-side {
  gap: 8px;
  padding: 10px;
}

.panel-business .biz-side p {
  font-size: 12px;
  line-height: 1.5;
}

.panel-business .biz-chart {
  min-height: 0;
}

.map-wrap {
  grid-template-columns: 1fr;
  height: 100%;
}

.map {
  min-height: 100%;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}

.map.dragging {
  cursor: grabbing;
}

.map-zoom-layer {
  position: absolute;
  inset: 0;
  transform-origin: center center;
  transition: transform .18s ease;
}

.area-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-content: start;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(148,163,184,0.25) transparent;
}

.area {
  position: relative;
  padding: 9px 10px;
  overflow: hidden;
  border: 1px solid #dbe4ee;
  background: #fff;
  border-radius: 8px;
  transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease, transform .14s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  text-align: left;
}

.area:hover { transform: translateY(-1px); }

.area.green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(255, 255, 255, 0.98));
  border-color: rgba(34, 197, 94, 0.28);
}
.area.yellow {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.11), rgba(255, 255, 255, 0.98));
  border-color: rgba(234, 179, 8, 0.34);
}
.area.orange {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.13), rgba(255, 255, 255, 0.98));
  border-color: rgba(249, 115, 22, 0.4);
}
.area.red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(255, 255, 255, 0.98));
  border-color: rgba(239, 68, 68, 0.45);
}

/* 呼吸灯 - 高风险/中风险 */
.area-pulse {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 1;
}
.area-pulse.red {
  background: #ef4444;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.65);
  animation: area-breathe-red 1.4s ease-in-out infinite;
}
.area-pulse.orange {
  background: #f97316;
  box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.65);
  animation: area-breathe-orange 1.6s ease-in-out infinite;
}
.area-pulse.yellow {
  background: #eab308;
  box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.55);
  animation: area-breathe-yellow 1.8s ease-in-out infinite;
}
@keyframes area-breathe-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); transform: scale(1.15); }
}
@keyframes area-breathe-orange {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgba(249, 115, 22, 0); transform: scale(1.15); }
}
@keyframes area-breathe-yellow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.55); transform: scale(1); }
  50% { box-shadow: 0 0 0 6px rgba(234, 179, 8, 0); transform: scale(1.12); }
}

/* 第一行：风险等级标签 + 领域名 + 待办数 */
.area-row-1 { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  min-width: 0; 
  width: 100%;
}
.area-level-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}
.area-level-tag.green { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.area-level-tag.yellow { background: #fefce8; color: #a16207; border: 1px solid #fde68a; }
.area-level-tag.orange { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.area-level-tag.red { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }

.area-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  flex-shrink: 0;
  flex-grow: 0;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed;
  white-space: nowrap;
}

.area-alerts {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid;
  flex-shrink: 0;
  margin-left: auto;
}
.area-alerts.green { border-color: #bbf7d0; color: #15803d; }
.area-alerts.yellow { border-color: #fde68a; color: #a16207; }
.area-alerts.orange { border-color: #fed7aa; color: #c2410c; }
.area-alerts.red { border-color: #fca5a5; color: #dc2626; }
.area-alerts-num { font-size: 12px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
.area-alerts-lbl { font-size: 9px; opacity: 0.75; }

/* 第二行：风险分进度条 */
.area-row-2 { display: flex; align-items: center; }
.area-score-bar { display: flex; align-items: center; gap: 6px; flex: 1; }
.area-score-lbl { font-size: 10px; color: #64748b; flex-shrink: 0; }
.area-bar { flex: 1; height: 4px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.area-bar-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
.area-bar.green .area-bar-fill { background: linear-gradient(90deg, #86efac, #16a34a); }
.area-bar.yellow .area-bar-fill { background: linear-gradient(90deg, #fde047, #d4a106); }
.area-bar.orange .area-bar-fill { background: linear-gradient(90deg, #fdba74, #ea580c); }
.area-bar.red .area-bar-fill { background: linear-gradient(90deg, #fca5a5, #dc2626); }
.area-score-val {
  font-size: 12px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: #334155;
  flex-shrink: 0;
  min-width: 22px;
  text-align: right;
}

.area.green.active, .area.green:hover { box-shadow: 0 6px 16px rgba(34, 197, 94, 0.12); }
.area.yellow.active, .area.yellow:hover { box-shadow: 0 6px 16px rgba(250, 204, 21, 0.14); }
.area.orange.active, .area.orange:hover { box-shadow: 0 6px 16px rgba(249, 115, 22, 0.18); }
.area.red.active, .area.red:hover { box-shadow: 0 6px 16px rgba(239, 68, 68, 0.22); }
.area.active { border-width: 2px; padding: 8px 9px; }

/* 旧 area-score 兼容（已不再使用，保留避免引用错误） */
.area-score {
  text-align: right;
  font-size: 10px;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
}

.area.green .area-score,
.area.yellow .area-score,
.area.orange .area-score,
.area.red .area-score {
  color: #334155;
}

.area-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  width: 240px;
  padding: 10px 12px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-50%) translateX(-4px);
  transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
  z-index: 8;
  pointer-events: none;
}

.area:hover .area-tooltip,
.area.active .area-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}

.area-tooltip-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #1d4ed8;
}

.area-tooltip-item {
  font-size: 12px;
  line-height: 1.55;
  color: #475569;
}

.penetration-stack {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.penetration-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 2px 0 0;
}

.penetration-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 0 2px 4px;
}

.penetration-head strong {
  font-size: 12px;
  color: #0f172a;
}

.penetration-head .muted {
  font-size: 10px;
}

.penetration-chart {
  flex: 1;
  min-height: 80px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.66), rgba(255, 255, 255, 0.98));
  border-radius: 10px;
}

.panel-business {
  border: 0;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
  padding: 10px 12px 8px;
}

.panel-business-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  margin-bottom: 4px;
}

.panel-business-title h3 {
  margin: 0;
  font-size: 12px;
  color: #0f172a;
  line-height: 1.1;
}

.panel-business-title p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #94a3b8;
}

.heatmap-shell {
  flex: 1;
  min-height: 90px;
  overflow: hidden;
}

.heatmap-chart {
  min-height: 0;
  height: 100%;
}

/* .heatmap-legend defined in compactness overrides below */

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 14px;
  height: 6px;
  border-radius: 999px;
}

.legend-color.low {
  background: #22c55e;
}

.legend-color.watch {
  background: #facc15;
}

.legend-color.medium {
  background: #f97316;
}

.legend-color.high {
  background: #ef4444;
}

/* ===== Global compactness overrides ===== */

/* Panels — reduce base padding from 18px */
.panel {
  padding: 11px 13px;
}

.panel-head {
  margin-bottom: 9px;
}

.panel h3 {
  font-size: 13px;
}

.panel p {
  font-size: 11px;
  margin: 2px 0 0;
}

.stack {
  gap: 7px;
}

/* Left column: equal split, both panels scroll independently */
.left {
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}
.left > .panel {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Right column: 3 rows — trend (fixed) | events (3fr) | plans (2fr) */
.right {
  grid-template-rows: 168px 3fr 2fr;
  gap: 10px;
}

.right > .panel:first-child {
  padding: 8px 10px 6px;
}

.right > .panel:first-child .panel-head {
  margin-bottom: 4px;
}

.right > .panel:first-child .panel-head p {
  margin-top: 1px;
}

.trend {
  min-height: 0;
  margin-top: -2px;
}

/* Area list items */
.area {
  padding: 6px 8px;
}

.area-name {
  font-size: 11px;
}

.area-score {
  font-size: 10px;
}

/* Issue / plan cards */
.issue,
.plan {
  padding: 8px 10px;
}

.issue strong,
.plan strong {
  font-size: 12px;
}

.plan-head {
  gap: 6px;
  align-items: center;
}

.plan-deadline,
.plan-dept,
.plan-action {
  font-size: 10px;
  line-height: 1.45;
}

.plan-deadline {
  white-space: nowrap;
}

.plan-dept {
  margin-top: 2px;
}

.desc {
  font-size: 11px;
  margin-top: 3px;
}

.plan-action {
  margin-top: 2px;
}

/* Event table — override base 480px columns to fit 280px inner width */
.table-head,
.event {
  grid-template-columns: 30px 26px minmax(0, 1fr) minmax(0, 1.6fr) 36px 28px 28px;
  gap: 5px;
}

/* Prevent pill from stretching the risk column */
.event .pill {
  padding: 1px 4px;
  font-size: 9px;
  min-width: 0;
  justify-content: flex-start;
}

.table-head {
  padding: 0 8px 6px;
  font-size: 9px;
  letter-spacing: 0;
}

.event {
  padding: 5px 8px;
  font-size: 10px;
  border-radius: 8px;
}

/* Progress bars in穿透面板 */
.progresses {
  gap: 7px;
  margin-top: 10px;
}

.progresses .row.small {
  font-size: 11px;
}

.bar {
  height: 7px;
}

/* Chips */
.chips {
  gap: 6px;
  margin-bottom: 7px;
}

.chip,
.pill {
  font-size: 11px;
  padding: 2px 8px;
}

/* Heatmap panel */
.panel-business {
  padding: 8px 10px 6px;
}

.heatmap-head {
  margin-bottom: 6px;
  align-items: center;
}

.heatmap-head h3 {
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.heatmap-sub {
  font-size: 10px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #64748b;
  flex-shrink: 0;
  margin-top: 0;
}

.legend-item {
  gap: 3px;
}

.legend-color {
  width: 12px;
  height: 5px;
}

/* Trend chart min height inside fixed 148px panel */
.trend {
  min-height: 72px;
}

/* Popup / drawer */
.popup {
  top: 18px;
  right: 18px;
  width: 320px;
  padding: 14px;
}

.drawer {
  padding: 18px;
}

/* Value kpi section separator */
.value-kpis {
  position: relative;
}

.value-kpis::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
  pointer-events: none;
}

/* =====================================================
   AIAgent 风格统一覆盖
   ===================================================== */

/* 1. 背景：蓝白渐变 + 淡网格 */
.white-scene {
  background: linear-gradient(160deg, #eef5ff 0%, #f8fafc 55%, #f0f9ff 100%);
}
.white-scene::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px);
  background-size: 44px 44px;
}
.white-scene::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 18% 0%, rgba(37,99,235,0.07), transparent 50%),
    radial-gradient(ellipse at 90% 95%, rgba(8,145,178,0.05), transparent 45%);
}
.screen {
  position: relative;
  z-index: 1;
}

/* 2. 卡片 — 轻柔阴影 */
.card {
  box-shadow: 0 2px 14px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04);
  border-color: #e8eef6;
}

/* 3. 面板头 — 浅蓝渐变底色 + 双色下划线 + 标题左竖条 */
.panel-head {
  background: linear-gradient(90deg, #fafcff 0%, #fff 100%);
  border-bottom: 1px solid #eef2f8;
  margin: -11px -13px 10px;
  padding: 10px 13px 9px;
  border-radius: 12px 12px 0 0;
  position: relative;
}
.panel-head::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 13px;
  width: 36px; height: 2px;
  background: linear-gradient(90deg, #2563eb, #0891b2);
  border-radius: 999px;
}

/* 4. 面板标题左竖条 */
.panel h3 {
  display: flex;
  align-items: center;
  gap: 7px;
}
.panel h3::before {
  content: '';
  width: 3px; height: 12px;
  background: linear-gradient(180deg, #2563eb, #0891b2);
  border-radius: 999px;
  flex-shrink: 0;
}

/* 5. KPI 卡片 — 彩色左侧竖条 */
.kpi {
  border-left: 3px solid var(--c, #2563eb);
  background: linear-gradient(135deg, var(--bg, #eff6ff) 0%, #fff 70%);
  border-radius: 12px;
}

/* 6. value-kpi 卡片 — 增强阴影 */
.value-kpi {
  box-shadow: 0 2px 10px rgba(15,23,42,0.05);
}

/* 7. Plan 卡片 — 左边框 + 悬停高亮 */
.plan {
  border-left: 3px solid transparent;
  transition: border-color 0.16s, background-color 0.16s, box-shadow 0.16s;
}
.plan:hover {
  border-left-color: #bfdbfe;
  background: #f8fbff;
  box-shadow: 0 4px 16px rgba(37,99,235,0.08);
}

/* 8. Event 行 — 激活态用蓝边 */
.event.medium { border-left: 3px solid #f97316; }
.event.green  { border-left: 3px solid #22c55e; }

/* 9. 穿透图表背景 — 与 AIAgent skill-hub 一致 */
.penetration-chart {
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  border: 1px solid #eef2f8;
}

/* 10. 热力图面板头 — 与 panel-head 统一 */
.heatmap-head {
  background: linear-gradient(90deg, #fafcff 0%, #fff 100%);
  border-bottom: 1px solid #eef2f8;
  margin: -8px -10px 6px;
  padding: 8px 10px 7px;
  border-radius: 12px 12px 0 0;
  position: relative;
}
.heatmap-head::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 10px;
  width: 32px; height: 2px;
  background: linear-gradient(90deg, #2563eb, #0891b2);
  border-radius: 999px;
}
.heatmap-head h3::before { display: none; }

/* 11. 地图面板 — 边框提亮 */
.map {
  border-color: #dbeafe;
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
}

/* 12. 节点标签 — 蓝边白底 */
.node .label {
  border-color: #bfdbfe;
  background: rgba(255,255,255,0.97);
  box-shadow: 0 6px 18px rgba(37,99,235,0.1);
  font-size: 11px;
  color: #334155;
}
.node.active .label {
  color: #1d4ed8;
  border-color: #93c5fd;
  background: #f0f7ff;
}

/* 13. 脉冲点 — 蓝色系 */
.pulse { background: rgba(96,165,250,0.2); }
.core  { background: #3b82f6; box-shadow: 0 0 0 5px rgba(59,130,246,0.18); }

/* 14. 主操作按钮 */
.action.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 14px rgba(37,99,235,0.28);
  transition: 0.18s;
}
.action.primary:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 6px 20px rgba(37,99,235,0.38);
  transform: translateY(-1px);
}
.action.ghost {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  transition: 0.18s;
}
.action.ghost:hover {
  border-color: #bfdbfe;
  color: #2563eb;
  background: #f0f7ff;
}

/* 15. Drawer / popup — 蓝边白底 */
.drawer {
  border: 1px solid #dbeafe;
  box-shadow: 0 24px 60px rgba(15,23,42,0.14);
}
.popup {
  border-color: #fecaca;
  box-shadow: 0 16px 40px rgba(239,68,68,0.12);
}

/* 16. 右栏趋势面板 panel-head 修正（padding 更小） */
.right > .panel:first-child .panel-head {
  margin: -8px -10px 4px;
  padding: 8px 10px 7px;
}
</style>
