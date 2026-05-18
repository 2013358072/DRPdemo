<template>
  <div class="scene-content">
    <div class="scene-header">
      <h2>财务穿透<span class="sh-en">7-LEVEL · REPORT→ACCOUNT→VOUCHER→DOC→CONTRACT→PROJECT→PURCHASE</span></h2>
      <div class="sh-tag">
        <span>三张主表</span><span>科目→凭证</span>
        <span>关联业务单据</span><span>追溯到采购订单</span>
      </div>
    </div>

    <div class="fin-layout">
      <!-- 左列：三张主表 + 根因图谱 -->
      <div class="fc">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">合并报表 (3 主表) <span class="pt-en">REPORTS</span></div>
            <div class="panel-action">2024 Q2</div>
          </div>
          <!-- Tab -->
          <div class="report-tabs">
            <div
              v-for="t in tabs" :key="t.key"
              class="rta" :class="{active: activeRpt === t.key}"
              @click="activeRpt = t.key"
            >{{ t.name }}</div>
          </div>
          <!-- 报表行 -->
          <div class="report-rows">
            <div
              v-for="r in curReport" :key="r.item"
              class="rr" :class="{alert: r.alert}"
            >
              <div class="rrn">
                {{ r.item }}
                <span v-if="r.alert" class="ai-icon">⚠</span>
              </div>
              <div class="rrv">{{ r.value }}{{ r.unit || ' 亿' }}</div>
              <div class="rrg" :class="r.growth > 10 ? 'al' : (r.growth > 0 ? 'up' : '')">
                {{ r.growth > 0 ? '+' : '' }}{{ r.growth }}%
              </div>
            </div>
          </div>
        </div>

        <!-- 根因关联图谱 -->
        <div class="panel" style="flex:0.6">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">异常根因图谱 <span class="pt-en">ROOT CAUSE</span></div>
          </div>
          <div class="graph-canvas">
            <svg viewBox="0 0 380 200" preserveAspectRatio="xMidYMid meet">
              <!-- 连线 -->
              <line x1="60" y1="100" x2="300" y2="100" stroke="#ff2e5e" stroke-width="2" stroke-dasharray="4 3" opacity="0.7"/>
              <line x1="60" y1="100" x2="60" y2="35" stroke="#48a2ff" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
              <line x1="60" y1="35" x2="180" y2="35" stroke="#48a2ff" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
              <line x1="180" y1="35" x2="300" y2="35" stroke="#48a2ff" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
              <line x1="300" y1="35" x2="300" y2="100" stroke="#ff2e5e" stroke-width="2" stroke-dasharray="4 3" opacity="0.7"/>
              <!-- 关系 -->
              <text x="180" y="115" fill="#ff2e5e" font-size="10" text-anchor="middle">支付2850万</text>
              <text x="60" y="68" fill="#48a2ff" font-size="9" text-anchor="middle">聘用</text>
              <text x="120" y="32" fill="#48a2ff" font-size="9" text-anchor="middle">配偶</text>
              <text x="240" y="32" fill="#48a2ff" font-size="9" text-anchor="middle">法人</text>
              <text x="320" y="68" fill="#ff2e5e" font-size="9" text-anchor="middle">同地址</text>
              <!-- 节点 -->
              <circle cx="60" cy="100" r="18" fill="rgba(255,46,94,0.25)" stroke="#ff2e5e" stroke-width="1.5" filter="drop-shadow(0 0 6px rgba(255,46,94,0.6))"/>
              <text x="60" y="104" fill="#ff2e5e" font-size="12" text-anchor="middle">⬡</text>
              <text x="60" y="130" fill="#e6f1ff" font-size="10" text-anchor="middle">宁夏煤化工</text>
              <circle cx="300" cy="100" r="18" fill="rgba(255,46,94,0.25)" stroke="#ff2e5e" stroke-width="1.5" filter="drop-shadow(0 0 6px rgba(255,46,94,0.6))"/>
              <text x="300" y="104" fill="#ff2e5e" font-size="12" text-anchor="middle">⬢</text>
              <text x="300" y="130" fill="#e6f1ff" font-size="10" text-anchor="middle">远景咨询</text>
              <circle cx="60" cy="35" r="14" fill="rgba(255,46,94,0.2)" stroke="#ff2e5e" stroke-width="1.5"/>
              <text x="60" y="39" fill="#ff2e5e" font-size="10" text-anchor="middle">👤</text>
              <text x="20" y="38" fill="#e6f1ff" font-size="10">陈某副总</text>
              <circle cx="180" cy="35" r="14" fill="rgba(255,46,94,0.2)" stroke="#ff2e5e" stroke-width="1.5"/>
              <text x="180" y="39" fill="#ff2e5e" font-size="10" text-anchor="middle">👤</text>
              <text x="180" y="18" fill="#e6f1ff" font-size="10" text-anchor="middle">王某·配偶</text>
              <circle cx="300" cy="35" r="14" fill="rgba(255,138,60,0.2)" stroke="#ff8a3c" stroke-width="1.5"/>
              <text x="300" y="39" fill="#ff8a3c" font-size="10" text-anchor="middle">⬢</text>
              <text x="340" y="38" fill="#e6f1ff" font-size="10">昌发咨询</text>
            </svg>
          </div>
          <div class="graph-tip">利益输送路径: 高管 → 配偶 → 关联公司 → 咨询合同</div>
        </div>
      </div>

      <!-- 中列：7级穿透链路 -->
      <div class="fc">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">7 级穿透链路 <span class="pt-en">DRILL CHAIN</span></div>
            <div class="panel-action danger">异常: 管理费用 +35.2%</div>
          </div>
          <div class="drill-chain-7">
            <div
              v-for="(d, i) in D_CHAIN7" :key="i"
              class="ds7" :class="{target: i === D_CHAIN7.length - 1}"
            >
              <div class="dsr">
                <div class="dss">L{{ d.level }}</div>
                <div class="di">
                  <div class="dt">
                    {{ d.name }}
                    <span class="d-src">{{ d.table }}</span>
                  </div>
                  <div class="d-detail">{{ d.detail }}</div>
                </div>
                <div class="dkp">
                  <div class="dv" :class="d.danger ? 'danger' : ''">{{ d.value }}</div>
                  <div v-if="d.growth" class="dg up">+{{ d.growth }}%</div>
                  <div class="d-act">{{ d.action }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：证据链 + AI研判 -->
      <div class="fc">
        <div class="panel" style="flex:0.5">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">穿透证据链 <span class="pt-en">EVIDENCE</span></div>
            <div class="panel-action danger">5 项证据</div>
          </div>
          <div class="evidence-list">
            <div v-for="e in D_EVIDENCE" :key="e.title" class="evc">
              <div class="ev-t">{{ e.title }}</div>
              <div class="ev-b" v-html="e.desc"></div>
            </div>
          </div>
        </div>

        <div class="panel" style="flex:0.5">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">AI 研判 + 工单 <span class="pt-en">AGENT</span></div>
            <div class="panel-action">置信度 95%</div>
          </div>
          <div class="ai-panel">
            <div class="ai-head"><span class="ai-icon-b">A</span>风险结论</div>
            <div class="ai-content">
              <div class="ai-line">疑似 <strong class="danger">利益输送</strong> 风险</div>
              <div class="ai-line">穿透路径完整 (7 级)</div>
              <div class="ai-line">证据链 <strong class="danger">5/5 命中</strong></div>
            </div>
            <div class="ai-conclude">
              <strong>风险评分: 92 / 100</strong><br>
              已派单审计部 · 限期 5 工作日 · 启动高管离任审计
            </div>
          </div>
          <div class="closure-state">
            <div class="muted cs-label">闭环状态</div>
            <div class="cs-row">
              <span class="risk-tag green">规则命中</span>
              <span class="cs-arrow">→</span>
              <span class="risk-tag green">预警生成</span>
              <span class="cs-arrow">→</span>
              <span class="risk-tag orange">核查中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { D_REPORTS, D_CHAIN7, D_EVIDENCE } from '../data/mockData.js'

const tabs = [
  { key: 'income',   name: '利润表' },
  { key: 'balance',  name: '资产负债表' },
  { key: 'cashflow', name: '现金流量表' }
]
const activeRpt = ref('income')
const curReport = computed(() => D_REPORTS[activeRpt.value])
</script>

<style scoped>
.fin-layout {
  display: grid;
  grid-template-columns: 1.1fr 2fr 1fr;
  gap: 14px;
  height: calc(100% - 50px);
}
.fc { display: flex; flex-direction: column; gap: 14px; min-height: 0; }

/* === Tabs === */
.report-tabs { display: flex; gap: 2px; margin-bottom: 10px; }
.rta {
  flex: 1; padding: 8px 10px;
  background: rgba(72,162,255,0.06);
  border: 1px solid var(--line);
  cursor: pointer; text-align: center;
  font-size: 11px; color: var(--t-3);
  transition: all 0.2s;
}
.rta.active {
  background: rgba(0,212,255,0.18);
  border-color: var(--primary);
  color: var(--primary); font-weight: 600;
}
.rta:hover { color: var(--t-1); }

/* === 报表行 === */
.report-rows {
  display: flex; flex-direction: column; gap: 4px;
  overflow-y: auto;
  max-height: calc(100% - 50px);
}
.rr {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center; gap: 10px;
  padding: 8px 12px;
  background: rgba(72,162,255,0.04);
  font-size: 12px; cursor: pointer;
  border-left: 2px solid transparent;
  transition: all 0.2s;
}
.rr:hover { background: rgba(72,162,255,0.10); }
.rr.alert {
  background: rgba(255,46,94,0.08);
  border-left-color: var(--r-red);
  animation: redBlink 2.5s ease-in-out infinite;
}
.rrn { color: var(--t-2); display: flex; align-items: center; gap: 6px; }
.ai-icon { color: var(--r-red); font-weight: bold; animation: pulse 1.5s ease-in-out infinite; }
.rrv {
  font-family: var(--f-n); color: var(--t-1);
  font-weight: 600; font-size: 13px;
}
.rrg {
  font-family: var(--f-n); font-size: 10px;
  color: var(--t-3); padding: 1px 5px;
}
.rrg.up { color: var(--r-green); }
.rrg.al {
  color: var(--r-red); font-weight: 700;
  background: rgba(255,46,94,0.12);
  border: 1px solid var(--r-red);
}

/* === 7 级穿透链 === */
.drill-chain-7 {
  display: flex; flex-direction: column;
  gap: 0; padding: 6px 0;
  overflow-y: auto; max-height: 100%;
}
.ds7 {
  position: relative;
  padding: 11px 14px;
  background: linear-gradient(90deg, rgba(0,126,194,0.06), transparent);
  border: 1px solid var(--line);
  margin-bottom: 4px;
  cursor: pointer; transition: all 0.3s;
  border-radius: 2px;
}
.ds7:nth-child(even) {
  background: linear-gradient(90deg, rgba(0,126,194,0.10), transparent);
}
.ds7.target {
  background: linear-gradient(90deg, rgba(255,46,94,0.18), rgba(255,138,60,0.05));
  border-color: var(--r-red);
}
.ds7::after {
  content: '↓';
  position: absolute; left: 50%; bottom: -13px;
  transform: translateX(-50%);
  font-size: 13px; color: var(--primary); z-index: 2;
  animation: arrowDown 1.8s ease-in-out infinite;
  background: var(--bg-0); padding: 0 4px;
}
.ds7:last-child::after { display: none; }
.dsr {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center; gap: 14px;
}
.dss {
  font-family: var(--f-n); font-weight: 900;
  font-size: 13px;
  width: 30px; height: 30px; border-radius: 50%;
  border: 1px solid var(--primary);
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,212,255,0.1);
  color: var(--primary);
}
.ds7.target .dss {
  color: var(--r-red); border-color: var(--r-red);
  background: rgba(255,46,94,0.1);
}
.di .dt {
  font-size: 12px; font-weight: 600; color: var(--t-1);
  margin-bottom: 3px; letter-spacing: 0.06em;
}
.di .dt .d-src {
  font-family: var(--f-n); font-size: 9px;
  color: var(--t-3);
  background: rgba(72,162,255,0.08);
  padding: 1px 5px;
  margin-left: 6px;
  border: 1px solid var(--line);
  font-weight: 400; letter-spacing: 0.1em;
}
.di .d-detail { font-size: 11px; color: var(--t-2); line-height: 1.6; }
.dkp { text-align: right; }
.dkp .dv {
  font-family: var(--f-n); font-size: 13px;
  font-weight: 700; color: var(--t-1);
}
.dkp .dv.danger { color: var(--r-red); }
.dkp .dg { font-size: 10px; color: var(--t-3); }
.dkp .dg.up { color: var(--r-red); font-weight: 600; }
.dkp .d-act {
  font-size: 10px; color: var(--primary);
  margin-top: 3px; letter-spacing: 0.08em;
}
.ds7.target .dkp .d-act { color: var(--r-red); }

/* === 证据 === */
.evidence-list { overflow-y: auto; max-height: 100%; }
.evc {
  padding: 10px 12px;
  background: rgba(255,46,94,0.06);
  border: 1px solid var(--r-red);
  border-radius: 2px;
  margin-bottom: 8px;
}
.ev-t {
  font-size: 11px; color: var(--r-red);
  font-weight: 600; letter-spacing: 0.1em;
  margin-bottom: 6px;
  display: flex; align-items: center; gap: 6px;
}
.ev-t::before { content: '◉'; color: var(--r-red); font-size: 10px; }
.ev-b { font-size: 11px; color: var(--t-2); line-height: 1.7; }
.ev-b :deep(strong) { color: var(--t-1); }

/* === 根因图谱 === */
.graph-canvas {
  flex: 1; min-height: 160px;
  background: radial-gradient(ellipse at center, rgba(0,126,194,0.08), transparent 70%);
  position: relative; overflow: hidden;
}
.graph-canvas svg { width: 100%; height: 100%; }
.graph-tip {
  font-size: 10px; color: var(--t-3);
  text-align: center; margin-top: 4px;
}

/* === AI 面板 === */
.ai-panel {
  border-left: 3px solid var(--primary);
  padding: 12px 14px;
  background: linear-gradient(90deg, rgba(0,212,255,0.06), transparent);
}
.ai-head {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: var(--primary);
  margin-bottom: 10px; font-weight: 600; letter-spacing: 0.1em;
}
.ai-icon-b {
  width: 18px; height: 18px; background: var(--primary);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--bg-0); font-size: 10px; font-weight: 900;
  animation: pulse 2s ease-in-out infinite;
}
.ai-content { font-size: 11px; color: var(--t-2); line-height: 1.7; }
.ai-line { margin-bottom: 5px; display: flex; align-items: flex-start; gap: 6px; }
.ai-line::before { content: '▸'; color: var(--primary); }
.ai-conclude {
  margin-top: 10px; padding: 8px 12px;
  background: rgba(255,46,94,0.10);
  border-left: 2px solid var(--r-red);
  color: var(--t-1); font-size: 11px; line-height: 1.6;
}

/* 闭环状态 */
.closure-state { margin-top: 12px; }
.cs-label {
  font-size: 10px; letter-spacing: 0.15em;
  margin-bottom: 6px;
}
.cs-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; flex-wrap: wrap;
}
.cs-arrow { color: var(--t-4); }
</style>
