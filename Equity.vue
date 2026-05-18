<template>
  <div class="scene-content">
    <div class="scene-header">
      <h2>产权穿透<span class="sh-en">5-LAYER OWNERSHIP DRILL</span></h2>
      <div class="sh-tag">
        <span>82家法人</span><span>5级穿透</span>
        <span>实控人识别</span><span>1862条关联</span>
      </div>
    </div>

    <div class="eq-layout">
      <!-- KPI -->
      <div class="ek panel">
        <span class="cb"></span><span class="cr"></span>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">法人单位 <span class="kpi-tag">UNITS</span></div>
            <div class="kpi-value">82<span class="kpi-unit">家</span></div>
            <div class="kpi-delta">5 级层级</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">股权关系 <span class="kpi-tag">EQUITY</span></div>
            <div class="kpi-value">1,862<span class="kpi-unit">条</span></div>
            <div class="kpi-delta">图谱节点</div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-label">隐性关联 <span class="kpi-tag">SHADOW</span></div>
            <div class="kpi-value red">14<span class="kpi-unit">条</span></div>
            <div class="kpi-delta down">⚠ 关联交易</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">穿透耗时 <span class="kpi-tag">SPEED</span></div>
            <div class="kpi-value">&lt;1<span class="kpi-unit">秒</span></div>
            <div class="kpi-delta up">5 层穿透</div>
          </div>
        </div>
      </div>

      <!-- 5 层股权树 -->
      <div class="ec" style="grid-column: span 2">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">穿透目标: 北疆风电(三级)有限公司 <span class="pt-en">5-LAYER TREE</span></div>
            <div class="panel-action">已穿透 5/5</div>
          </div>
          <div class="tree-wrap">
            <svg viewBox="0 0 800 440" preserveAspectRatio="xMidYMid meet">
              <!-- 连线 -->
              <path d="M 400 100 L 400 130" stroke="#48a2ff" stroke-width="1.5" fill="none" opacity="0.7"/>
              <path d="M 400 180 L 400 210" stroke="#48a2ff" stroke-width="1.5" fill="none" opacity="0.7"/>
              <path d="M 400 260 L 400 290" stroke="#ffd700" stroke-width="2" fill="none" opacity="0.8"/>
              <path d="M 400 340 C 400 360, 200 360, 200 370" stroke="#48a2ff" stroke-width="1.5" fill="none" opacity="0.7"/>
              <path d="M 400 340 L 400 370" stroke="#48a2ff" stroke-width="1.5" fill="none" opacity="0.7"/>
              <path d="M 400 340 C 400 360, 600 360, 600 370" stroke="#ff2e5e" stroke-width="2" fill="none" opacity="0.8" stroke-dasharray="4 3"/>
              <!-- L1 集团 -->
              <rect x="320" y="50" width="160" height="50" rx="3" fill="rgba(0,212,255,0.12)" stroke="#48a2ff" stroke-width="1"/>
              <text x="400" y="72" fill="#e6f1ff" font-size="12" text-anchor="middle" font-weight="600">集团总公司</text>
              <text x="400" y="90" fill="#9bb3da" font-size="10" text-anchor="middle">国资委 100%</text>
              <text x="280" y="80" fill="#48a2ff" font-size="10" text-anchor="middle">L1</text>
              <!-- L2 板块 -->
              <rect x="320" y="130" width="160" height="50" rx="3" fill="rgba(0,212,255,0.12)" stroke="#48a2ff" stroke-width="1"/>
              <text x="400" y="152" fill="#e6f1ff" font-size="12" text-anchor="middle" font-weight="600">新能源板块</text>
              <text x="400" y="170" fill="#9bb3da" font-size="10" text-anchor="middle">集团 100%</text>
              <text x="280" y="160" fill="#48a2ff" font-size="10" text-anchor="middle">L2</text>
              <!-- L3 二级 -->
              <rect x="310" y="210" width="180" height="50" rx="3" fill="rgba(0,212,255,0.12)" stroke="#48a2ff" stroke-width="1"/>
              <text x="400" y="232" fill="#e6f1ff" font-size="12" text-anchor="middle" font-weight="600">北疆风电公司(二级)</text>
              <text x="400" y="250" fill="#9bb3da" font-size="10" text-anchor="middle">板块 100%</text>
              <text x="280" y="240" fill="#48a2ff" font-size="10" text-anchor="middle">L3</text>
              <!-- L4 三级 - 高亮 -->
              <rect x="290" y="290" width="220" height="50" rx="3" fill="rgba(255,215,0,0.12)" stroke="#ffd700" stroke-width="1.5" filter="drop-shadow(0 0 6px rgba(255,215,0,0.3))"/>
              <text x="400" y="312" fill="#ffd700" font-size="12" text-anchor="middle" font-weight="700">★ 北疆风电(三级)有限公司</text>
              <text x="400" y="330" fill="#ffd700" font-size="10" text-anchor="middle">穿透目标 · 二级 80%</text>
              <text x="280" y="320" fill="#ffd700" font-size="10" text-anchor="middle">L4★</text>
              <!-- L5 三个子公司 -->
              <rect x="120" y="370" width="160" height="50" rx="3" fill="rgba(0,212,255,0.12)" stroke="#48a2ff" stroke-width="1"/>
              <text x="200" y="392" fill="#e6f1ff" font-size="11" text-anchor="middle">北疆风电(子)</text>
              <text x="200" y="408" fill="#9bb3da" font-size="10" text-anchor="middle">三级 100%</text>
              <text x="80" y="400" fill="#48a2ff" font-size="10" text-anchor="middle">L5</text>
              <rect x="320" y="370" width="160" height="50" rx="3" fill="rgba(0,212,255,0.12)" stroke="#48a2ff" stroke-width="1"/>
              <text x="400" y="392" fill="#e6f1ff" font-size="11" text-anchor="middle">内蒙风电运营</text>
              <text x="400" y="408" fill="#9bb3da" font-size="10" text-anchor="middle">三级 100%</text>
              <rect x="520" y="370" width="160" height="50" rx="3" fill="rgba(255,46,94,0.15)" stroke="#ff2e5e" stroke-width="1.5" filter="drop-shadow(0 0 6px rgba(255,46,94,0.4))"/>
              <text x="600" y="388" fill="#ff2e5e" font-size="11" text-anchor="middle" font-weight="600">⚠ 北方风能工程</text>
              <text x="600" y="404" fill="#ff2e5e" font-size="10" text-anchor="middle">51% (自然人控股)</text>
              <text x="600" y="418" fill="#ff8a3c" font-size="9" text-anchor="middle">EPC关联交易</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- 右列：实控人 + 关联交易 -->
      <div class="ec">
        <div class="panel" style="flex:0.5">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">实际控制人 <span class="pt-en">CONTROLLER</span></div>
            <div class="panel-action danger">⚠ 隐性关联</div>
          </div>
          <div class="ctrl-content">
            <div class="ctrl-title">表层: 国有资本 100% 控股</div>
            <div class="ctrl-title danger">穿透发现: 5 层后存在私人股权(51%)</div>
            <div class="muted ctrl-label">关联自然人</div>
            <div class="ctrl-person">
              <div><strong>王建国</strong> · 北方风能实控人(51%)</div>
              <div class="muted ctrl-sub">⤷ 配偶为集团子公司董事</div>
              <div class="ctrl-margin"><strong>王国民</strong> · 王建国之子</div>
              <div class="muted ctrl-sub">⤷ 同时持有3家供应商股权</div>
            </div>
          </div>
        </div>

        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">关联方交易 <span class="pt-en">RELATED</span></div>
          </div>
          <div v-for="t in D_REL_TRANS" :key="t.company" class="rel-trans">
            <div class="rt-head">
              <span>{{ t.company }}</span>
              <span class="risk-tag" :class="t.risk === '红' ? 'red' : 'orange'">{{ t.risk }}</span>
            </div>
            <div class="rt-info">
              {{ t.business }} · <span class="num primary-strong">{{ t.amount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { D_REL_TRANS } from '../data/mockData.js'
</script>

<style scoped>
.eq-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 14px;
  height: calc(100% - 50px);
}
.ek { grid-column: 1/-1; }
.ec { display: flex; flex-direction: column; gap: 14px; min-height: 0; }

/* 树状图 */
.tree-wrap {
  flex: 1; position: relative;
  overflow: auto; padding: 14px;
}
.tree-wrap svg { width: 100%; height: 100%; }

/* 控制人 */
.ctrl-content { padding: 6px 0; }
.ctrl-title {
  font-size: 12px; color: var(--t-1);
  font-weight: 600; margin-bottom: 6px;
}
.ctrl-title.danger { color: var(--r-red); margin-bottom: 12px; }
.ctrl-label {
  font-size: 10px; letter-spacing: 0.15em;
  margin-bottom: 6px;
}
.ctrl-person {
  border-left: 2px solid var(--r-red);
  padding-left: 11px;
  font-size: 11px; line-height: 1.7;
  color: var(--t-2);
}
.ctrl-person strong { color: var(--t-1); }
.ctrl-sub { font-size: 10px; }
.ctrl-margin { margin-top: 6px; }

/* 关联交易 */
.rel-trans {
  padding: 9px 11px;
  border-left: 2px solid var(--r-red);
  background: rgba(255,46,94,0.04);
  margin-bottom: 6px;
}
.rt-head {
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--t-1);
  margin-bottom: 3px;
}
.rt-info { font-size: 10px; color: var(--t-2); }
.primary-strong { color: var(--t-1); }
</style>
