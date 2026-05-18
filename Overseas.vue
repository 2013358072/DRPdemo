<template>
  <div class="scene-content">
    <div class="scene-header">
      <h2>境外穿透<span class="sh-en">GLOBAL ASSET SUPERVISION</span></h2>
      <div class="sh-tag">
        <span>32家境外</span><span>15个国家</span>
        <span>286亿资产</span><span>双轨合规</span>
      </div>
    </div>

    <div class="os-layout">
      <!-- KPI -->
      <div class="ok panel">
        <span class="cb"></span><span class="cr"></span>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">境外资产 <span class="kpi-tag">TOTAL</span></div>
            <div class="kpi-value">286.4<span class="kpi-unit">亿</span></div>
            <div class="kpi-delta up">▲ 6.8%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">境外机构 <span class="kpi-tag">UNITS</span></div>
            <div class="kpi-value">32<span class="kpi-unit">家</span></div>
            <div class="kpi-delta">15 国家</div>
          </div>
          <div class="kpi-card warn">
            <div class="kpi-label">外汇敞口 <span class="kpi-tag">FX</span></div>
            <div class="kpi-value orange">42.6<span class="kpi-unit">亿</span></div>
            <div class="kpi-delta warn">⚠ 关注</div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-label">合规预警 <span class="kpi-tag">ALERT</span></div>
            <div class="kpi-value red">3<span class="kpi-unit">起</span></div>
            <div class="kpi-delta down">1红 2橙</div>
          </div>
        </div>
      </div>

      <!-- 左：区域 + 合规 -->
      <div class="oc">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head"><div class="panel-title">区域分布 <span class="pt-en">REGION</span></div></div>
          <div v-for="r in D_REGIONS" :key="r.region" class="region-row">
            <span class="r-name">{{ r.region }}</span>
            <span class="muted num">{{ r.units }} 家</span>
            <span class="num r-asset">{{ r.asset }} 亿</span>
            <span class="risk-tag" :class="riskCls(r.risk)">{{ r.risk }}</span>
          </div>
        </div>

        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head"><div class="panel-title">合规规则达标率 <span class="pt-en">COMPLIANCE</span></div></div>
          <div class="comp-list">
            <div v-for="c in D_COMPLIANCE" :key="c.rule" class="comp-item">
              <span class="comp-name">{{ c.rule }}</span>
              <span class="comp-bar">
                <span
                  class="comp-fill"
                  :class="c.score < 75 ? 'warn' : ''"
                  :style="{width: c.score + '%'}"
                ></span>
              </span>
              <span class="comp-score">{{ c.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中：世界地图 -->
      <div class="oc">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">全球资产分布 <span class="pt-en">WORLD MAP</span></div>
            <div class="panel-action">实时监控</div>
          </div>
          <div class="world-map">
            <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="dot-r" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#ff2e5e" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#ff2e5e" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="dot-o" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#ff8a3c" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#ff8a3c" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <!-- 简化大陆轮廓 -->
              <path d="M 100 100 Q 200 80 280 120 L 300 180 Q 250 220 200 200 Q 130 180 100 140 Z" fill="rgba(72,162,255,0.06)" stroke="#48a2ff" stroke-width="0.5" opacity="0.7"/>
              <path d="M 200 280 Q 250 260 280 320 L 270 360 Q 230 380 200 360 Z" fill="rgba(72,162,255,0.06)" stroke="#48a2ff" stroke-width="0.5" opacity="0.7"/>
              <path d="M 350 120 Q 430 100 500 150 L 500 200 Q 440 220 380 200 Q 350 170 350 120 Z" fill="rgba(72,162,255,0.06)" stroke="#48a2ff" stroke-width="0.5" opacity="0.7"/>
              <path d="M 380 230 Q 450 240 480 300 L 460 350 Q 410 360 380 320 Z" fill="rgba(72,162,255,0.06)" stroke="#48a2ff" stroke-width="0.5" opacity="0.7"/>
              <path d="M 520 100 Q 620 80 700 130 L 700 200 Q 620 230 540 200 Q 510 160 520 100 Z" fill="rgba(72,162,255,0.06)" stroke="#48a2ff" stroke-width="0.5" opacity="0.7"/>
              <path d="M 600 250 Q 650 270 680 320 L 660 350 Q 620 360 600 320 Z" fill="rgba(72,162,255,0.06)" stroke="#48a2ff" stroke-width="0.5" opacity="0.7"/>
              <!-- 经纬线 -->
              <line x1="0" y1="200" x2="800" y2="200" stroke="#48a2ff" stroke-width="0.3" opacity="0.2" stroke-dasharray="3 3"/>
              <line x1="400" y1="0" x2="400" y2="400" stroke="#48a2ff" stroke-width="0.3" opacity="0.2" stroke-dasharray="3 3"/>
              <!-- 国家点 -->
              <g><circle cx="624" cy="248" r="20" fill="url(#dot-o)"/><circle cx="624" cy="248" r="5" fill="#ff8a3c" stroke="#fff" stroke-width="0.5"/><text x="624" y="270" fill="#e6f1ff" font-size="10" text-anchor="middle">新加坡 48.2亿</text></g>
              <g><circle cx="608" cy="240" r="14" fill="url(#dot-o)"/><circle cx="608" cy="240" r="4" fill="#ffd000"/></g>
              <g><circle cx="480" cy="220" r="20" fill="url(#dot-o)"/><circle cx="480" cy="220" r="5" fill="#ff8a3c" stroke="#fff" stroke-width="0.5"/><text x="480" y="242" fill="#e6f1ff" font-size="10" text-anchor="middle">阿联酋 38.6亿</text></g>
              <g><circle cx="464" cy="224" r="22" fill="url(#dot-r)"/><circle cx="464" cy="224" r="6" fill="#ff2e5e" stroke="#fff" stroke-width="0.5"/><text x="464" y="208" fill="#ff2e5e" font-size="10" text-anchor="middle">沙特 26.8亿 ⚠</text></g>
              <g><circle cx="512" cy="152" r="14" fill="url(#dot-o)"/><circle cx="512" cy="152" r="4" fill="#ffd000"/><text x="512" y="172" fill="#e6f1ff" font-size="10" text-anchor="middle">哈萨克</text></g>
              <g><circle cx="376" cy="260" r="20" fill="url(#dot-o)"/><circle cx="376" cy="260" r="5" fill="#ff8a3c" stroke="#fff" stroke-width="0.5"/><text x="376" y="282" fill="#e6f1ff" font-size="10" text-anchor="middle">尼日利亚 24.2亿</text></g>
              <g>
                <circle cx="440" cy="264" r="26" fill="url(#dot-r)"/>
                <circle cx="440" cy="264" r="7" fill="#ff2e5e" stroke="#fff" stroke-width="0.5">
                  <animate attributeName="r" values="5;9;5" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <text x="440" y="248" fill="#ff2e5e" font-size="10" text-anchor="middle" font-weight="600">埃塞 8.4亿 🚨</text>
              </g>
              <g><circle cx="392" cy="128" r="14" fill="url(#dot-o)"/><circle cx="392" cy="128" r="4" fill="#00e89f"/><text x="392" y="148" fill="#e6f1ff" font-size="10" text-anchor="middle">德国</text></g>
              <g><circle cx="240" cy="300" r="14" fill="url(#dot-o)"/><circle cx="240" cy="300" r="4" fill="#ffd000"/><text x="240" y="320" fill="#e6f1ff" font-size="10" text-anchor="middle">巴西</text></g>
              <!-- 连线 -->
              <g stroke="#00d4ff" stroke-width="0.7" fill="none" opacity="0.4">
                <path d="M 500 180 Q 550 200 624 248" stroke-dasharray="3 3"/>
                <path d="M 500 180 Q 490 200 480 220"/>
                <path d="M 500 180 Q 470 200 440 264" stroke="#ff2e5e" stroke-dasharray="3 3"/>
                <path d="M 500 180 Q 450 150 392 128"/>
              </g>
              <!-- 中心 -->
              <circle cx="500" cy="180" r="6" fill="#00d4ff" stroke="#fff" stroke-width="1.5"/>
              <text x="500" y="200" fill="#00d4ff" font-size="11" text-anchor="middle" font-weight="700">中国总部</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- 右：预警 + 资金流向 -->
      <div class="oc">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">境外预警 <span class="pt-en">ALERTS</span></div>
            <div class="panel-action danger">3 起</div>
          </div>
          <div class="alert-list">
            <div
              v-for="a in D_OS_ALERTS" :key="a.country"
              class="alert-item" :class="a.level === '红' ? 'red' : 'orange'"
            >
              <div class="al-head">
                <span>{{ a.country }} · {{ a.project }}</span>
                <span class="num primary-strong">{{ a.amount }} 亿</span>
              </div>
              <div class="al-issue">{{ a.issue }}</div>
            </div>
          </div>
        </div>

        <div class="panel" style="flex:0.6">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">跨境资金流向 <span class="pt-en">FX FLOW</span></div>
          </div>
          <div class="fx-flow">
            <div class="fx-row">
              <span>· 流出 (CNY→外币)</span>
              <span class="num fx-val">18.6 亿</span>
            </div>
            <div class="fx-row">
              <span>· 流入 (外币→CNY)</span>
              <span class="num fx-val">14.2 亿</span>
            </div>
            <div class="fx-row">
              <span>· 境外间调拨</span>
              <span class="num fx-val">6.8 亿</span>
            </div>
            <div class="fx-row">
              <span>· 应回流逾期</span>
              <span class="num danger">4.2 亿</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { D_REGIONS, D_COMPLIANCE, D_OS_ALERTS, riskCls } from '../data/mockData.js'
</script>

<style scoped>
.os-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 14px;
  height: calc(100% - 50px);
}
.ok { grid-column: 1/-1; }
.oc { display: flex; flex-direction: column; gap: 14px; min-height: 0; }

/* 区域分布 */
.region-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 10px; padding: 9px 0;
  border-bottom: 1px dashed var(--line);
  font-size: 11px; align-items: center;
}
.r-name { color: var(--t-1); }
.r-asset { color: var(--t-1); }

/* 合规 */
.comp-list { display: flex; flex-direction: column; gap: 10px; }
.comp-item {
  display: grid;
  grid-template-columns: 1fr 70px 45px;
  gap: 10px; align-items: center;
  font-size: 11px;
}
.comp-name { color: var(--t-2); }
.comp-bar {
  height: 6px;
  background: rgba(72,162,255,0.08);
  position: relative;
}
.comp-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, var(--r-green), var(--primary));
  transition: width 1s;
}
.comp-fill.warn {
  background: linear-gradient(90deg, var(--r-orange), var(--r-yellow));
}
.comp-score {
  font-family: var(--f-n); color: var(--t-1);
  text-align: right; font-weight: 600;
}

/* 世界地图 */
.world-map {
  flex: 1; position: relative;
  min-height: 380px;
  background: radial-gradient(ellipse at 50% 50%, rgba(0,126,194,0.18), transparent 65%);
  overflow: hidden;
}
.world-map svg { width: 100%; height: 100%; }

/* 预警列表 */
.alert-list { display: flex; flex-direction: column; gap: 8px; }
.alert-item {
  padding: 8px 12px;
  background: rgba(72,162,255,0.05);
  border-left: 2px solid var(--t-4);
  font-size: 11px;
}
.alert-item.red { border-left-color: var(--r-red); }
.alert-item.orange { border-left-color: var(--r-orange); }
.al-head {
  display: flex; justify-content: space-between;
  color: var(--t-1); margin-bottom: 4px;
}
.al-issue { color: var(--t-2); font-size: 11px; line-height: 1.5; }
.primary-strong { color: var(--t-1); }

/* 资金流向 */
.fx-flow { padding: 4px; font-size: 11px; line-height: 2; color: var(--t-2); }
.fx-row {
  display: flex; justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dashed var(--line);
}
.fx-row:last-child { border-bottom: none; }
.fx-val { color: var(--t-1); }
</style>
