<template>
  <div class="scene-content">
    <div class="scene-header">
      <h2>风险监控驾驶舱<span class="sh-en">RISK COMMAND CENTER</span></h2>
      <div class="sh-tag">
        <span>聚焦风险</span><span>四全穿透</span>
        <span>实时拦截</span><span>闭环可证</span>
      </div>
    </div>

    <div class="dash-layout">
      <!-- KPI 全聚焦风险 -->
      <div class="dk panel">
        <span class="cb"></span><span class="cr"></span>
        <div class="kpi-grid">
          <div class="kpi-card danger">
            <div class="kpi-label">高风险事件 <span class="kpi-tag">RED</span></div>
            <div class="kpi-value red">6<span class="kpi-unit">起</span></div>
            <div class="kpi-delta down">较昨日 +2 起</div>
          </div>
          <div class="kpi-card warn">
            <div class="kpi-label">预警事件 <span class="kpi-tag">ORANGE+YELLOW</span></div>
            <div class="kpi-value orange">36<span class="kpi-unit">起</span></div>
            <div class="kpi-delta warn">橙 11 · 黄 25</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">本日拦截笔数 <span class="kpi-tag">INTERCEPTED</span></div>
            <div class="kpi-value">17<span class="kpi-unit">笔</span></div>
            <div class="kpi-delta">涉及金额 ¥1.86 亿</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">风险闭环率 <span class="kpi-tag">CLOSURE</span></div>
            <div class="kpi-value">76.4<span class="kpi-unit">%</span></div>
            <div class="kpi-delta up">▲ 2.3pp 周环比</div>
          </div>
        </div>
      </div>

      <!-- 左列 -->
      <div class="dc">
        <!-- 7日风险趋势 -->
        <div class="panel" style="flex:0.85">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">7日风险趋势 <span class="pt-en">TREND</span></div>
            <div class="panel-action">单位: 起</div>
          </div>
          <div class="risk-trend">
            <div
              v-for="d in D_TREND"
              :key="d.date"
              class="rt-bar"
              :title="`${d.date} 红${d.red}/橙${d.orange}/黄${d.yellow}`"
            >
              <span class="rt-total">{{ d.red+d.orange+d.yellow }}</span>
              <div class="seg red" :style="{height:(d.red*4)+'px'}"></div>
              <div class="seg orange" :style="{height:(d.orange*4)+'px'}"></div>
              <div class="seg yellow" :style="{height:(d.yellow*4)+'px'}"></div>
              <span class="rt-label">{{ d.date }}</span>
            </div>
          </div>
        </div>

        <!-- 板块矩阵 -->
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">板块×场景风险矩阵 <span class="pt-en">MATRIX</span></div>
            <div class="panel-action">单位: 起</div>
          </div>
          <div class="plate-risk h"><div></div><div>投资</div><div>资金</div><div>合同</div><div>采购</div></div>
          <div v-for="p in D_PLATE_MX" :key="p.plate" class="plate-risk">
            <div class="p-name">{{ p.plate }}</div>
            <div class="p-cell" :class="cellCls(p.invest)">{{ p.invest || '-' }}</div>
            <div class="p-cell" :class="cellCls(p.fund)">{{ p.fund || '-' }}</div>
            <div class="p-cell" :class="cellCls(p.contract)">{{ p.contract || '-' }}</div>
            <div class="p-cell" :class="cellCls(p.procurement)">{{ p.procurement || '-' }}</div>
          </div>
        </div>

        <!-- 规则触发 TOP -->
        <div class="panel" style="flex:0.75">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">规则触发TOP <span class="pt-en">RULES</span></div>
            <div class="panel-action">本日</div>
          </div>
          <div class="rule-list">
            <div v-for="r in D_RULES" :key="r.name" class="rule-item" :class="r.cls">
              <span class="r-name">{{ r.name }}</span>
              <span class="r-count">{{ r.count }}</span>
              <span class="r-tag" :class="r.type==='硬'?'hd':'st'">{{ r.type==='硬'?'拦截':'预警' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中列 -->
      <div class="dc">
        <!-- 风险热力图 -->
        <div class="panel" style="flex:1.3">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">82家法人风险热力图 <span class="pt-en">HEATMAP</span></div>
            <div class="panel-action">综合风险</div>
          </div>
          <div class="heatmap">
            <div
              v-for="(u,i) in D_UNITS" :key="u.id"
              class="hc" :class="riskCls(u.risk)"
              :title="`${u.name} | ${u.risk} | 评分${u.score}`"
              @click="selectUnit = u"
            >
              <span class="hn">{{ i+1 }}</span>
            </div>
          </div>
          <div class="heat-legend">
            <span class="lg"><span class="lb green"></span>低 ({{ rc.green }})</span>
            <span class="lg"><span class="lb yellow"></span>关注 ({{ rc.yellow }})</span>
            <span class="lg"><span class="lb orange"></span>预警 ({{ rc.orange }})</span>
            <span class="lg"><span class="lb red"></span>高 ({{ rc.red }})</span>
          </div>
        </div>

        <!-- 闭环统计 -->
        <div class="panel" style="flex:0.8">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">风险闭环全流程 <span class="pt-en">CLOSURE</span></div>
            <div class="panel-action">规则→预警→工单→整改→销号</div>
          </div>
          <div class="closure-board">
            <div class="cr-row">
              <div class="cr-f">📋 规则命中<span class="cr-n">{{ D_CLOSURE.ruleHit }}</span></div>
              <div class="cr-a">─→</div>
              <div class="cr-t">⚠️ 生成预警<span class="cr-n">{{ D_CLOSURE.alertGen }}</span></div>
            </div>
            <div class="cr-row">
              <div class="cr-f">⚠️ 生成预警<span class="cr-n">{{ D_CLOSURE.alertGen }}</span></div>
              <div class="cr-a">─→</div>
              <div class="cr-t">📨 派发工单<span class="cr-n">{{ D_CLOSURE.orderSent }}</span></div>
            </div>
            <div class="cr-row">
              <div class="cr-f">📨 派发工单<span class="cr-n">{{ D_CLOSURE.orderSent }}</span></div>
              <div class="cr-a">─→</div>
              <div class="cr-t">🔧 整改中<span class="cr-n">{{ D_CLOSURE.inProgress }}</span></div>
            </div>
            <div class="cr-row">
              <div class="cr-f">🔧 整改中<span class="cr-n">{{ D_CLOSURE.inProgress }}</span></div>
              <div class="cr-a">─→</div>
              <div class="cr-t">✅ 已销号<span class="cr-n">{{ D_CLOSURE.closed }}</span></div>
            </div>
            <div class="closure-footer">
              <span class="muted">待处置: <strong class="danger num">{{ D_CLOSURE.pending }}</strong></span>
              <span class="muted">已超期: <strong class="warning num">{{ D_CLOSURE.overdue }}</strong></span>
              <span class="muted">闭环率: <strong class="success num">{{ D_CLOSURE.rate }}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列: 实时风险事件 -->
      <div class="dc">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">实时风险事件 <span class="pt-en">LIVE</span></div>
            <div class="panel-action danger">{{ D_EVENTS.length }} 待处置</div>
          </div>
          <div class="event-list">
            <div
              v-for="r in D_EVENTS" :key="r.code"
              class="event-item" :class="riskCls(r.level)"
              @click="selectEvent(r)"
            >
              <div class="ev-head">
                <span>{{ r.title }}</span>
                <span class="ev-code">{{ r.code }}</span>
              </div>
              <div class="ev-desc">{{ r.desc.length > 50 ? r.desc.slice(0,50) + '...' : r.desc }}</div>
              <div class="ev-meta">
                <span>🏷 {{ r.type }}</span>
                <span>👤 {{ r.handler }}</span>
                <span>⏱ {{ r.deadline }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件详情弹窗 -->
    <div v-if="modalEvent" class="modal-mask" @click.self="modalEvent = null">
      <div class="modal-box">
        <span class="cb"></span><span class="cr"></span>
        <div class="modal-head">
          <div class="modal-title">{{ modalEvent.title }}</div>
          <div class="modal-close" @click="modalEvent = null">✕</div>
        </div>
        <div class="modal-body">
          <div class="m-row"><span>风险编号:</span><strong class="num primary">{{ modalEvent.code }}</strong></div>
          <div class="m-row"><span>风险等级:</span>
            <strong>
              <span class="risk-tag" :class="riskCls(modalEvent.level)">{{ modalEvent.level }}</span>
              · 评分 {{ modalEvent.score || '—' }}
            </strong>
          </div>
          <div class="m-row"><span>触发规则:</span><strong>{{ modalEvent.rule }}</strong></div>
          <div class="m-row"><span>处理人:</span><strong>{{ modalEvent.handler }} | 期限: {{ modalEvent.deadline }}</strong></div>
          <div class="m-block danger-block">
            <div class="m-label">风险描述</div>
            <div>{{ modalEvent.desc }}</div>
          </div>
          <div class="m-block primary-block">
            <div class="m-label">AI 处置建议</div>
            <div>{{ modalEvent.suggestion }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  D_UNITS, D_TREND, D_PLATE_MX, D_RULES, D_EVENTS, D_CLOSURE,
  riskCls, cellCls
} from '../data/mockData.js'

const selectUnit = ref(null)
const modalEvent = ref(null)
const selectEvent = (e) => { modalEvent.value = e }

const rc = computed(() => {
  const c = { red:0, orange:0, yellow:0, green:0 }
  D_UNITS.forEach(u => {
    if (u.risk === '红') c.red++
    else if (u.risk === '橙') c.orange++
    else if (u.risk === '黄') c.yellow++
    else c.green++
  })
  return c
})
</script>

<style scoped>
.dash-layout {
  display: grid;
  grid-template-columns: 1.3fr 1.7fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 14px;
  height: calc(100% - 50px);
}
.dk { grid-column: 1/-1; }
.dc { display: flex; flex-direction: column; gap: 14px; min-height: 0; }

/* 7日风险趋势 */
.risk-trend {
  display: flex; align-items: flex-end; gap: 4px;
  height: 120px; padding: 8px 0;
  border-bottom: 1px dashed var(--line);
  margin-bottom: 12px;
}
.rt-bar {
  flex: 1; display: flex; flex-direction: column;
  justify-content: flex-end; position: relative;
  height: 100%; align-items: center; gap: 1px;
}
.rt-bar .seg { width: 100%; transition: all 0.5s; }
.rt-bar .seg.red { background: var(--r-red); }
.rt-bar .seg.orange { background: var(--r-orange); }
.rt-bar .seg.yellow { background: var(--r-yellow); }
.rt-bar .rt-label {
  font-size: 9px; color: var(--t-4);
  margin-top: 4px; font-family: var(--f-n);
}
.rt-bar .rt-total {
  position: absolute; top: -12px;
  font-size: 9px; color: var(--t-2);
  font-family: var(--f-n);
}
.rt-bar:hover .seg { opacity: 0.7; }

/* 板块矩阵 */
.plate-risk {
  display: grid; grid-template-columns: 60px repeat(4,1fr);
  gap: 8px; font-size: 11px;
  padding: 8px 0; border-bottom: 1px dashed var(--line);
  align-items: center;
}
.plate-risk.h {
  color: var(--t-3); font-size: 10px; letter-spacing: 0.1em;
  padding: 6px 0; border-bottom: 1px solid var(--line);
}
.plate-risk .p-name { color: var(--t-2); font-weight: 500; }
.plate-risk .p-cell {
  text-align: center; padding: 6px 4px;
  font-family: var(--f-n); font-weight: 600;
  border-radius: 2px;
}
.plate-risk .p-cell.red    { color: var(--r-red);    background: rgba(255,46,94,0.12);  border: 1px solid rgba(255,46,94,0.3); }
.plate-risk .p-cell.orange { color: var(--r-orange); background: rgba(255,138,60,0.12); border: 1px solid rgba(255,138,60,0.3); }
.plate-risk .p-cell.yellow { color: var(--r-yellow); background: rgba(255,208,0,0.10);  border: 1px solid rgba(255,208,0,0.3); }
.plate-risk .p-cell.green  { color: var(--r-green);  background: rgba(0,232,159,0.08);  border: 1px solid rgba(0,232,159,0.2); }
.plate-risk .p-cell.zero   { color: var(--t-4); }

/* 规则触发 */
.rule-list { display: flex; flex-direction: column; gap: 6px; padding: 4px 0; }
.rule-item {
  display: grid;
  grid-template-columns: 1fr 36px 50px;
  gap: 10px; align-items: center;
  font-size: 11px; padding: 6px 8px;
  background: rgba(72,162,255,0.04);
  border-left: 2px solid var(--primary);
}
.rule-item.danger { border-left-color: var(--r-red); }
.rule-item.warning { border-left-color: var(--r-orange); }
.r-name { color: var(--t-2); }
.r-count {
  font-family: var(--f-n); color: var(--t-1);
  font-weight: 600; text-align: right; font-size: 12px;
}
.r-tag { font-size: 9px; text-align: center; padding: 1px 3px; border-radius: 2px; }
.r-tag.hd { color: var(--r-red);    border: 1px solid var(--r-red);    background: rgba(255,46,94,0.1); }
.r-tag.st { color: var(--r-orange); border: 1px solid var(--r-orange); background: rgba(255,138,60,0.1); }

/* 热力图 */
.heatmap { display: grid; grid-template-columns: repeat(11,1fr); gap: 4px; }
.hc {
  aspect-ratio: 1; border: 1px solid var(--line);
  position: relative; cursor: pointer;
  transition: all 0.25s;
  background: rgba(72,162,255,0.04);
}
.hc.green  { background: rgba(0,232,159,0.18);  border-color: rgba(0,232,159,0.35); }
.hc.yellow { background: rgba(255,208,0,0.22);   border-color: rgba(255,208,0,0.45); }
.hc.orange { background: rgba(255,138,60,0.32);  border-color: rgba(255,138,60,0.55); }
.hc.red {
  background: rgba(255,46,94,0.38); border-color: var(--r-red);
  animation: redBlink 1.6s ease-in-out infinite;
}
.hc:hover { transform: scale(1.6); z-index: 5; outline: 1px solid var(--primary); }
.hn {
  position: absolute; bottom: 1px; right: 2px;
  font-family: var(--f-n); font-size: 7px;
  color: var(--t-1); opacity: 0.8;
}
.heat-legend {
  display: flex; justify-content: space-around;
  gap: 8px; margin-top: 10px;
  font-size: 11px; padding-top: 8px;
  border-top: 1px dashed var(--line);
}
.heat-legend .lg { display: flex; align-items: center; gap: 6px; color: var(--t-2); }
.heat-legend .lb { width: 12px; height: 12px; border-radius: 2px; }
.heat-legend .lb.green  { background: rgba(0,232,159,0.4);  border: 1px solid var(--r-green); }
.heat-legend .lb.yellow { background: rgba(255,208,0,0.4);  border: 1px solid var(--r-yellow); }
.heat-legend .lb.orange { background: rgba(255,138,60,0.5); border: 1px solid var(--r-orange); }
.heat-legend .lb.red    { background: rgba(255,46,94,0.5);  border: 1px solid var(--r-red); }

/* 闭环 */
.closure-board { padding: 6px 0; }
.cr-row {
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  align-items: center; gap: 10px;
  padding: 8px 0; font-size: 11px;
  border-bottom: 1px dashed var(--line);
}
.cr-row .cr-f { color: var(--t-2); text-align: right; }
.cr-row .cr-a { font-family: var(--f-n); color: var(--primary); text-align: center; }
.cr-row .cr-t { color: var(--t-1); font-weight: 500; }
.cr-row .cr-n {
  color: var(--primary); font-family: var(--f-n);
  font-weight: 600; font-size: 13px; margin-left: 6px;
}
.closure-footer {
  display: flex; justify-content: space-between;
  padding: 12px 0 4px; font-size: 11px;
  border-top: 1px dashed var(--line); margin-top: 6px;
}

/* 事件列表 */
.event-list {
  display: flex; flex-direction: column;
  gap: 8px; max-height: 100%; overflow-y: auto;
}
.event-item {
  padding: 10px 12px;
  border-left: 3px solid var(--t-4);
  background: rgba(72,162,255,0.04);
  font-size: 12px; cursor: pointer;
  transition: all 0.25s;
}
.event-item.red    { border-left-color: var(--r-red); }
.event-item.orange { border-left-color: var(--r-orange); }
.event-item.yellow { border-left-color: var(--r-yellow); }
.event-item:hover { background: rgba(72,162,255,0.10); transform: translateX(2px); }
.ev-head {
  display: flex; justify-content: space-between;
  font-weight: 500; color: var(--t-1);
  margin-bottom: 4px;
}
.ev-code { font-family: var(--f-n); font-size: 10px; color: var(--t-3); }
.ev-desc { color: var(--t-2); font-size: 11px; line-height: 1.6; }
.ev-meta {
  display: flex; gap: 10px; margin-top: 6px;
  font-size: 10px; color: var(--t-3); letter-spacing: 0.06em;
}

/* 弹窗 */
.modal-mask {
  position: fixed; inset: 0;
  background: rgba(3,8,20,0.85);
  z-index: 999;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  animation: fadeIn .25s ease;
}
.modal-box {
  width: 640px; max-width: 92%;
  background: var(--bg-1);
  border: 1px solid var(--primary);
  border-radius: 4px;
  position: relative;
  box-shadow: 0 0 40px var(--p-glow);
}
.modal-box .cb, .modal-box .cr {
  content: ''; position: absolute; width: 14px; height: 14px;
  border-color: var(--primary); border-style: solid;
}
.modal-box .cb { bottom: -1px; left: -1px; border-width: 0 0 1px 1px; }
.modal-box .cr { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--line);
}
.modal-title {
  font-size: 15px; font-weight: 600;
  font-family: var(--f-serif); letter-spacing: 0.08em;
}
.modal-close {
  cursor: pointer; font-size: 16px;
  color: var(--t-3);
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--line);
}
.modal-close:hover { color: var(--r-red); border-color: var(--r-red); }
.modal-body { padding: 20px 24px; font-size: 12px; line-height: 1.9; }
.m-row {
  display: flex; gap: 12px; align-items: baseline;
  padding: 5px 0;
}
.m-row span { color: var(--t-3); min-width: 75px; }
.m-row strong { color: var(--t-1); flex: 1; font-weight: 500; }
.m-block {
  margin-top: 12px; padding: 12px 14px;
  font-size: 12px; line-height: 1.7;
}
.danger-block {
  background: rgba(255,46,94,0.08);
  border-left: 2px solid var(--r-red);
}
.primary-block {
  background: rgba(0,212,255,0.08);
  border-left: 2px solid var(--primary);
}
.m-label {
  font-size: 10px; letter-spacing: 0.15em;
  color: var(--t-3); margin-bottom: 6px;
}
</style>
