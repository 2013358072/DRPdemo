<template>
  <div class="scene-content">
    <div class="scene-header">
      <h2>投资穿透<span class="sh-en">INVESTMENT · DRILL TO ASSET</span></h2>
      <div class="sh-tag">
        <span>42个项目</span><span>500亿投资盘</span>
        <span>关联交易识别</span><span>底层资产穿透</span>
      </div>
    </div>

    <div class="i-layout">
      <!-- KPI -->
      <div class="ik panel">
        <span class="cb"></span><span class="cr"></span>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">在建项目 <span class="kpi-tag">ACTIVE</span></div>
            <div class="kpi-value">42<span class="kpi-unit">个</span></div>
            <div class="kpi-delta">投资盘 ¥500亿</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">完成率 <span class="kpi-tag">PROGRESS</span></div>
            <div class="kpi-value">67.4<span class="kpi-unit">%</span></div>
            <div class="kpi-delta up">▲ 5.2pp</div>
          </div>
          <div class="kpi-card warn">
            <div class="kpi-label">超预算 <span class="kpi-tag">OVERRUN</span></div>
            <div class="kpi-value orange">3<span class="kpi-unit">个</span></div>
            <div class="kpi-delta warn">⚠ 阈值&gt;10%</div>
          </div>
          <div class="kpi-card danger">
            <div class="kpi-label">关联交易嫌疑 <span class="kpi-tag">DETECTED</span></div>
            <div class="kpi-value red">2<span class="kpi-unit">起</span></div>
            <div class="kpi-delta down">紧急核查</div>
          </div>
        </div>
      </div>

      <!-- 左列：项目矩阵 + 异常焦点 -->
      <div class="ic">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">42 个项目矩阵 <span class="pt-en">GRID</span></div>
            <div class="panel-action">按板块·风险</div>
          </div>
          <div class="plate-legend">
            <span>● 新能源 18</span><span>● 火电 8</span><span>● 煤炭 7</span><span>● 化工 6</span><span>● 金融 3</span>
          </div>
          <div class="project-grid">
            <div
              v-for="(p,i) in D_PROJECTS"
              :key="i"
              class="proj-cell"
              :class="riskCls(p.risk)"
              :title="(p.name || '项目' + (i+1)) + ' | ' + p.plate"
            >
              <span class="pc-num">{{ String(i+1).padStart(2,'0') }}</span>
            </div>
          </div>
        </div>

        <div class="panel" style="flex:0.5">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">异常项目焦点 <span class="pt-en">TOP RISK</span></div>
          </div>
          <div
            v-for="p in topRisk" :key="p.code"
            class="risk-focus"
          >
            <div class="rf-head">
              <span>{{ p.name.length > 14 ? p.name.slice(0,14) + '..' : p.name }}</span>
              <span class="risk-tag red">红</span>
            </div>
            <div class="rf-detail">
              超预算 +{{ p.overrun }}% · 滞后 {{ p.delay }} 月
            </div>
          </div>
        </div>
      </div>

      <!-- 中列：项目详情 + 关联图谱 -->
      <div class="ic">
        <div class="panel" style="flex:0.4">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">北疆500MW风电场 · 项目穿透</div>
            <div class="panel-action danger">高风险 · 红</div>
          </div>
          <div class="proj-detail">
            <div class="pd-cell">
              <div class="pd-label">项目编码</div>
              <div class="pd-val num">INV-2024-018</div>
            </div>
            <div class="pd-cell">
              <div class="pd-label">板块/类型</div>
              <div class="pd-val">新能源 · 风电</div>
            </div>
            <div class="pd-cell">
              <div class="pd-label">计划投资</div>
              <div class="pd-val num">28.6 亿</div>
            </div>
            <div class="pd-cell">
              <div class="pd-label">实际支出</div>
              <div class="pd-val num danger">32.0 亿 (+11.9%)</div>
            </div>
          </div>
          <div class="progress-block">
            <div class="pd-label" style="margin-bottom:5px;">建设进度</div>
            <div class="prog-bar">
              <div class="prog-fill" style="width:52%"></div>
              <div class="prog-mark" style="left:75%"></div>
            </div>
            <div class="prog-meta">
              <span>实际 <span class="num danger">52%</span></span>
              <span>计划 <span class="num primary">75%</span> · 滞后 3 月</span>
            </div>
          </div>
        </div>

        <!-- 关联方知识图谱 -->
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">关联方知识图谱 <span class="pt-en">GRAPH</span></div>
            <div class="panel-action">2跳路径</div>
          </div>
          <div class="graph-canvas">
            <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
              <!-- 连线 -->
              <line x1="200" y1="60" x2="80" y2="140" stroke="#48a2ff" stroke-width="1.5" opacity="0.7"/>
              <line x1="200" y1="60" x2="320" y2="140" stroke="#48a2ff" stroke-width="1.5" opacity="0.7"/>
              <line x1="320" y1="140" x2="320" y2="220" stroke="#48a2ff" stroke-width="1.5" opacity="0.7"/>
              <line x1="80" y1="140" x2="80" y2="220" stroke="#48a2ff" stroke-width="1.5" opacity="0.7"/>
              <line x1="80" y1="220" x2="320" y2="220" stroke="#ff2e5e" stroke-width="2" stroke-dasharray="4 3" opacity="0.85"/>
              <!-- 关系标签 -->
              <text x="140" y="100" fill="#48a2ff" font-size="10" text-anchor="middle">所属</text>
              <text x="260" y="100" fill="#48a2ff" font-size="10" text-anchor="middle">EPC承包</text>
              <text x="200" y="230" fill="#ff2e5e" font-size="11" text-anchor="middle" font-weight="600">⚠ 父子关系</text>
              <!-- 节点 -->
              <circle cx="200" cy="60" r="22" fill="rgba(255,46,94,0.25)" stroke="#ff2e5e" stroke-width="1.8" filter="drop-shadow(0 0 6px rgba(255,46,94,0.6))"/>
              <text x="200" y="64" fill="#ff2e5e" font-size="14" text-anchor="middle">◈</text>
              <text x="200" y="36" fill="#e6f1ff" font-size="11" text-anchor="middle">北疆500MW风电</text>
              <circle cx="80" cy="140" r="18" fill="rgba(255,46,94,0.2)" stroke="#ff2e5e" stroke-width="1.5"/>
              <text x="80" y="144" fill="#ff2e5e" font-size="12" text-anchor="middle">⬡</text>
              <text x="80" y="170" fill="#e6f1ff" font-size="10" text-anchor="middle">北疆风电公司</text>
              <circle cx="320" cy="140" r="18" fill="rgba(255,138,60,0.2)" stroke="#ff8a3c" stroke-width="1.5"/>
              <text x="320" y="144" fill="#ff8a3c" font-size="12" text-anchor="middle">⬢</text>
              <text x="320" y="170" fill="#e6f1ff" font-size="10" text-anchor="middle">北方风能工程</text>
              <circle cx="80" cy="220" r="16" fill="rgba(255,208,0,0.18)" stroke="#ffd000" stroke-width="1.5"/>
              <text x="80" y="224" fill="#ffd000" font-size="11" text-anchor="middle">⬡</text>
              <text x="80" y="248" fill="#e6f1ff" font-size="10" text-anchor="middle">北疆风电子司</text>
              <circle cx="320" cy="220" r="16" fill="rgba(255,138,60,0.2)" stroke="#ff8a3c" stroke-width="1.5"/>
              <text x="320" y="224" fill="#ff8a3c" font-size="11" text-anchor="middle">👤</text>
              <text x="320" y="248" fill="#e6f1ff" font-size="10" text-anchor="middle">王建国(实控)</text>
            </svg>
          </div>
          <div class="graph-tip">发现: EPC实控人↔项目单位高管亲属 隐性关联</div>
        </div>
      </div>

      <!-- 右列：AI研判 + 底层资产 -->
      <div class="ic">
        <div class="panel" style="flex:0.55">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">AI 风险研判 <span class="pt-en">AGENT</span></div>
            <div class="panel-action">置信度 92%</div>
          </div>
          <div class="ai-panel">
            <div class="ai-head"><span class="ai-icon">A</span>风险综合分析</div>
            <div class="ai-content">
              <div class="ai-line">超预算 <strong class="danger">+11.9%</strong> (¥3.4亿)</div>
              <div class="ai-line">进度滞后 <strong class="danger">3 个月</strong></div>
              <div class="ai-line">EPC实控人与公司股东 <strong class="danger">亲属关系</strong></div>
              <div class="ai-line">EPC合同 <strong class="danger">未法务审核</strong></div>
            </div>
            <div class="ai-conclude">
              <strong>综合评分: 88 / 100</strong><br>
              立即专项审计 · 暂停付款 · 派单投资部
            </div>
          </div>
        </div>

        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">底层资产穿透 <span class="pt-en">ASSETS</span></div>
          </div>
          <div class="assets-block">
            <div class="muted assets-label">资产清单 (4 项)</div>
            <div v-for="(a,i) in D_ASSETS" :key="i" class="asset-item">
              <span class="num asset-idx">{{ String(i+1).padStart(2,'0') }}</span>
              <span class="asset-name">{{ a }}</span>
              <span class="risk-tag green" style="font-size:8px">已核实</span>
            </div>
            <div class="assets-tip">
              💡 每项资产可继续穿透至: 采购合同 → 验收单 → 资产卡片 → 折旧凭证
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { D_PROJECTS, D_ASSETS, riskCls } from '../data/mockData.js'

const topRisk = computed(() => D_PROJECTS.filter(p => p.risk === '红' && p.code))
</script>

<style scoped>
.i-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 14px;
  height: calc(100% - 50px);
}
.ik { grid-column: 1/-1; }
.ic { display: flex; flex-direction: column; gap: 14px; min-height: 0; }

.plate-legend {
  font-size: 10px; color: var(--t-3);
  margin-bottom: 8px;
  display: flex; gap: 12px; flex-wrap: wrap;
}

/* 项目矩阵 */
.project-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.proj-cell {
  aspect-ratio: 1; position: relative;
  background: rgba(72,162,255,0.06);
  border: 1px solid var(--line);
  cursor: pointer; transition: all 0.25s;
  display: flex; align-items: center; justify-content: center;
}
.proj-cell.green  { background: linear-gradient(135deg, rgba(0,232,159,0.2), rgba(0,232,159,0.06));  border-color: rgba(0,232,159,0.4); }
.proj-cell.yellow { background: linear-gradient(135deg, rgba(255,208,0,0.2), rgba(255,208,0,0.06));   border-color: rgba(255,208,0,0.4); }
.proj-cell.orange { background: linear-gradient(135deg, rgba(255,138,60,0.25), rgba(255,138,60,0.06)); border-color: rgba(255,138,60,0.5); }
.proj-cell.red {
  background: linear-gradient(135deg, rgba(255,46,94,0.3), rgba(255,46,94,0.06));
  border-color: var(--r-red);
  animation: redBlink 1.8s ease-in-out infinite;
}
.proj-cell .pc-num {
  font-family: var(--f-n); font-size: 11px;
  font-weight: 700; color: var(--t-1);
}
.proj-cell:hover { transform: scale(1.5); z-index: 4; }

/* 异常焦点 */
.risk-focus {
  padding: 9px 11px;
  border-left: 2px solid var(--r-red);
  background: rgba(255,46,94,0.06);
  margin-bottom: 8px;
}
.rf-head {
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--t-1); margin-bottom: 3px;
}
.rf-detail { font-size: 10px; color: var(--t-2); line-height: 1.6; }

/* 项目详情 */
.proj-detail {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; font-size: 11px; line-height: 1.7;
}
.pd-label { font-size: 10px; letter-spacing: 0.15em; color: var(--t-3); }
.pd-val { color: var(--t-1); font-size: 13px; }
.pd-val.num { font-family: var(--f-n); font-size: 13px; }
.pd-val.danger { color: var(--r-red); }

.progress-block { margin-top: 12px; }
.prog-bar { position: relative; height: 7px; background: rgba(72,162,255,0.1); }
.prog-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, var(--r-red), var(--r-orange));
}
.prog-mark {
  position: absolute; top: -4px; bottom: -4px;
  width: 1px; background: var(--primary);
}
.prog-meta {
  display: flex; justify-content: space-between;
  font-size: 10px; color: var(--t-3); margin-top: 4px;
}

/* 知识图谱 */
.graph-canvas {
  flex: 1; min-height: 240px;
  background: radial-gradient(ellipse at center, rgba(0,126,194,0.08), transparent 70%);
  position: relative; overflow: hidden;
}
.graph-canvas svg { width: 100%; height: 100%; }
.graph-tip {
  font-size: 10px; color: var(--t-3);
  text-align: center; margin-top: 4px;
}

/* AI 面板 */
.ai-panel {
  border-left: 3px solid var(--primary);
  padding: 12px 14px;
  background: linear-gradient(90deg, rgba(0,212,255,0.06), transparent);
}
.ai-head {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: var(--primary);
  margin-bottom: 10px; font-weight: 600;
  letter-spacing: 0.1em;
}
.ai-icon {
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

/* 资产清单 */
.assets-block { font-size: 11px; color: var(--t-2); line-height: 1.8; }
.assets-label { font-size: 10px; letter-spacing: 0.15em; margin-bottom: 8px; }
.asset-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px;
  background: rgba(72,162,255,0.05);
  margin-bottom: 5px;
  border-left: 2px solid var(--primary);
}
.asset-idx { color: var(--t-3); font-size: 10px; }
.asset-name { flex: 1; color: var(--t-1); }
.assets-tip {
  margin-top: 10px; padding: 8px 12px;
  background: rgba(0,212,255,0.06);
  border: 1px dashed var(--line);
  font-size: 10px; color: var(--t-3); line-height: 1.6;
}
</style>
