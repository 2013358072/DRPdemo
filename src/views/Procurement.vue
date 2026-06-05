<template>
  <div class="prc-scene">
    <div v-if="viewMode === 'penetration'" class="prc-screen">

      <!-- 布局重组状态条（对话切换布局时出现，可一键还原） -->
      <transition name="report-fade">
        <div v-if="layoutState.preset !== 'default'" class="layout-chip">
          <span class="layout-chip-dot"></span>
          <span class="layout-chip-tx">布局已重组 · {{ presetLabel }}</span>
          <button class="layout-chip-reset" @click="applyPreset('default')">还原</button>
        </div>
      </transition>

      <!-- ========== 左列 1.5 : 3 : 2 ========== -->
      <div class="col col-left">
        <!-- 专题视图：对话「相关的都集中 / 专题 / 关联链路」时，左列改为纵向呈现该风险的可视化 -->
        <section v-if="layoutState.preset === 'relatedTopic'" class="glass-panel topic-panel">
          <div class="ph">
            <h3>专题视图 · 关联链路聚焦</h3>
            <span class="gpill warn">CG-2026001</span>
          </div>
          <div class="topic-stack">
            <div class="topic-viz timeline">
              <div class="topic-viz-title">📅 项目时间线 · 二号车间维修工程</div>
              <div class="topic-timeline">
                <div v-for="(e,i) in topicTimelineEvents" :key="i" class="ttl-item" :class="e.lv">
                  <div class="ttl-dot"></div>
                  <div class="ttl-body">
                    <span class="ttl-date">2026-{{ e.date }}</span>
                    <span class="ttl-label">{{ e.label }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="topic-viz radar">
              <div class="topic-viz-title">🏢 鼎信建设一公司 · 风险画像
                <span class="topic-viz-meta">评分 58 · 风险标记 8 · 本集团中标 5 项 / ¥860万</span>
              </div>
              <EChart class="topic-chart" :option="topicSupplierRadarOption" />
            </div>
          </div>
        </section>

        <!-- 常规左列（非专题视图时显示，逐块 v-if 切换） -->
        <!-- A1 雷达 60% + 74号文看板 40% -->
        <section v-if="layoutState.preset !== 'relatedTopic'" class="glass-panel a1-panel" :class="lm('a1')">
          <div class="ph">
            <h3>采购六维评分</h3>
            <span class="gpill ice">综合 {{ pd.radarScore }} 分</span>
          </div>
          <div class="a1-body">
            <EChart class="radar-chart" :option="radarOption" />
            <div class="comp-board">
              <div class="cb-header">
                <span class="cb-title">合规看板</span>
                <span class="cb-rate">{{ pd.compliance }}<em>%</em></span>
              </div>
              <div class="cb-items">
                <div v-for="t in traffic74Display" :key="t.id" class="cb-row" :class="t.status">
                  <span class="cb-dot"></span>
                  <span class="cb-label">{{ t.label }}</span>
                  <span class="cb-val">{{ t.value }}</span>
                </div>
              </div>
              <div class="cb-note">直接对标74号文十不准</div>
            </div>
          </div>
        </section>

        <!-- B1 采购十大风险域 -->
        <section v-if="layoutState.preset !== 'relatedTopic'" class="glass-panel b1-panel" :class="[{ linked: penetrationContext.active }, lm('b1')]">
          <div class="ph">
            <h3>采购十大风险域</h3>
            <div class="b1-head-right">
              <div class="b1-form">
                <button :class="['b1-form-btn', { active: b1ChartMode === 'bar' }]" @click="setB1Chart('bar')" title="柱状图">▭</button>
                <button :class="['b1-form-btn', { active: b1ChartMode === 'trend' }]" @click="setB1Chart('trend')" title="趋势图">📈</button>
              </div>
              <div class="b1-filters">
                <button :class="['b1-filt', { active: riskFilter === 'all' }]"    @click="riskFilter = 'all'">全部</button>
                <button :class="['b1-filt', { active: riskFilter === 'danger' }]" @click="riskFilter = 'danger'">高危</button>
                <button :class="['b1-filt', { active: riskFilter === 'warn' }]"   @click="riskFilter = 'warn'">中危</button>
                <button :class="['b1-filt', { active: riskFilter === 'safe' }]"   @click="riskFilter = 'safe'">正常</button>
              </div>
            </div>
          </div>
          <div class="b1-kpis">
            <div class="b1-kpi-item"><span class="b1-kpi-n">高风险</span><span class="b1-kpi-v" style="color:#DC2626">{{ pd.riskHigh }}</span></div>
            <div class="b1-kpi-item"><span class="b1-kpi-n">中风险</span><span class="b1-kpi-v" style="color:#D97706">{{ pd.riskMid }}</span></div>
            <div class="b1-kpi-item"><span class="b1-kpi-n">低风险</span><span class="b1-kpi-v" style="color:#2563EB">{{ pd.riskLow }}</span></div>
            <div class="b1-kpi-item"><span class="b1-kpi-n">合计</span><span class="b1-kpi-v" style="color:#0F172A">{{ pd.riskTotal }}</span></div>
          </div>
          <div v-if="activeRiskDomain" class="b1-link-tip">
            <span>已联动网络图 · <b>{{ activeRiskDomain }}</b></span>
            <button class="b1-link-clear" @click="clearRiskDomain">✕ 取消</button>
          </div>
          <EChart class="b1-chart" :option="b1ChartOption" @chart-click="onRiskDomainClick" />
        </section>

        <!-- C1 两类穿透概览（总分折叠形式）-->
        <section v-if="layoutState.preset !== 'relatedTopic'" class="glass-panel c1-panel" :class="lm('c1')">
          <div class="ph">
            <h3>两类穿透概览</h3>
            <span class="gpill warn">异常 {{ pd.penetAnomTotal }}</span>
          </div>
          <div class="pv3-scroll">
            <!-- ── 资金闭环穿透 ── -->
            <div class="pv3-group pv3-hero-group">
              <button class="pv3-group-head pv3-hero-head" @click="togglePenet('capital')">
                <span class="pv3-gicon capital">资</span>
                <span class="pv3-gtitle">资金闭环</span>
                <span class="pv3-sum-badge ok">健康</span>
                <span class="pv3-hc">异常 <strong>{{ pd.bidAnomCount + pd.acceptAnomCount }}</strong></span>
                <i class="pv3-arr" :class="{ open: penetOpen.has('capital') }">▾</i>
              </button>
              <transition name="acc-expand">
                <div v-if="penetOpen.has('capital')" class="pv3-group-body">
                  <!-- 核心指标卡 -->
                  <div class="pv3-kpi-grid">
                    <div class="pv3-kpi"><span class="pv3-kn">预算总额</span><span class="pv3-kv blue">¥{{ pd.amount }}亿</span></div>
                    <div class="pv3-kpi"><span class="pv3-kn">申请金额</span><span class="pv3-kv">¥{{ pd.applyAmount }}亿</span></div>
                    <div class="pv3-kpi"><span class="pv3-kn">签约金额</span><span class="pv3-kv">¥{{ pd.contractAmount }}亿</span></div>
                    <div class="pv3-kpi"><span class="pv3-kn">合同数</span><span class="pv3-kv">{{ pd.contractCount }}份</span></div>
                  </div>
                  <!-- 资金流向 -->
                  <div class="pv3-flow-chain">
                    <span class="pv3-fn active">预算</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn active">申请</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn active">签约</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn active">履约</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn">验收</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn">付款</span>
                  </div>
                  <!-- 状态指标 -->
                  <div class="pv3-ov-stats">
                    <span>合规率 <strong style="color:#059669">{{ pd.compliance }}%</strong></span>
                    <span>资金回收率 <strong style="color:#2563EB">96.2%</strong></span>
                    <span>超期付款 <strong style="color:#DC2626">3笔</strong></span>
                  </div>
                  <!-- 评标定标 -->
                  <div class="pv3-sub">
                    <button class="pv3-sub-head" @click="togglePenet('bid')">
                      <span class="pv3-sd warn"></span>
                      <span>评标定标异常</span>
                      <strong class="pv3-sc">{{ pd.bidAnomCount }}</strong>
                      <i class="pv3-arr sm" :class="{ open: penetOpen.has('bid') }">▾</i>
                    </button>
                    <transition name="acc-expand">
                      <div v-if="penetOpen.has('bid')" class="pv3-sub-list">
                        <button v-for="b in bidAnomalies" :key="b.code" class="pv3-item" :class="b.route ? 'route-on r'+b.route : ''" @click="b.route ? openRouteClue(b.route) : openPenetModal('bid')">
                          <span class="pi-dot" :class="b.lvClass"></span>
                          <span class="pi-name">{{ b.project }}</span>
                          <span class="pi-tag" :class="b.lvClass">{{ b.level }}</span>
                        </button>
                      </div>
                    </transition>
                  </div>
                  <!-- 验收支付 -->
                  <div class="pv3-sub">
                    <button class="pv3-sub-head" @click="togglePenet('accept')">
                      <span class="pv3-sd danger"></span>
                      <span>验收支付异常</span>
                      <strong class="pv3-sc">{{ pd.acceptAnomCount }}</strong>
                      <i class="pv3-arr sm" :class="{ open: penetOpen.has('accept') }">▾</i>
                    </button>
                    <transition name="acc-expand">
                      <div v-if="penetOpen.has('accept')" class="pv3-sub-list">
                        <button v-for="a in acceptAnomalies" :key="a.contract" class="pv3-item" :class="a.route ? 'route-on r'+a.route : ''" @click="a.route ? openRouteClue(a.route) : openPenetModal('accept')">
                          <span class="pi-dot warn"></span>
                          <span class="pi-name">{{ a.project }}</span>
                          <span class="pi-amt">¥{{ a.amount }}</span>
                        </button>
                      </div>
                    </transition>
                  </div>
                </div>
              </transition>
            </div>

            <!-- ── 决策责任穿透 ── -->
            <div class="pv3-group pv3-hero-group">
              <button class="pv3-group-head pv3-hero-head" @click="togglePenet('resp')">
                <span class="pv3-gicon resp">责</span>
                <span class="pv3-gtitle">决策责任</span>
                <span class="pv3-sum-badge ok">合规</span>
                <span class="pv3-hc">异常 <strong>{{ pd.approvalAnomCount }}</strong></span>
                <i class="pv3-arr" :class="{ open: penetOpen.has('resp') }">▾</i>
              </button>
              <transition name="acc-expand">
                <div v-if="penetOpen.has('resp')" class="pv3-group-body">
                  <!-- 核心指标卡 -->
                  <div class="pv3-kpi-grid">
                    <div class="pv3-kpi"><span class="pv3-kn">授权事项</span><span class="pv3-kv">380项</span></div>
                    <div class="pv3-kpi"><span class="pv3-kn">评审专家</span><span class="pv3-kv">2,560人</span></div>
                    <div class="pv3-kpi"><span class="pv3-kn">三重一大</span><span class="pv3-kv">480项</span></div>
                    <div class="pv3-kpi"><span class="pv3-kn">审批覆盖率</span><span class="pv3-kv green">99.1%</span></div>
                  </div>
                  <!-- 决策链路 -->
                  <div class="pv3-flow-chain">
                    <span class="pv3-fn active">立项</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn active">授权</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn active">评审</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn">定标</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn">审批</span><span class="pv3-fa">→</span>
                    <span class="pv3-fn">归档</span>
                  </div>
                  <!-- 状态指标 -->
                  <div class="pv3-ov-stats">
                    <span>合规率 <strong style="color:#059669">99.1%</strong></span>
                    <span>回避执行率 <strong style="color:#2563EB">97.8%</strong></span>
                    <span>超权限 <strong style="color:#DC2626">2项</strong></span>
                  </div>
                  <div class="pv3-sub">
                    <button class="pv3-sub-head" @click="togglePenet('approval')">
                      <span class="pv3-sd warn"></span>
                      <span>定标审批异常</span>
                      <strong class="pv3-sc">{{ pd.approvalAnomCount }}</strong>
                      <i class="pv3-arr sm" :class="{ open: penetOpen.has('approval') }">▾</i>
                    </button>
                    <transition name="acc-expand">
                      <div v-if="penetOpen.has('approval')" class="pv3-sub-list">
                        <button v-for="r in approvalAnomalies" :key="r.item+r.approver" class="pv3-item" :class="r.route ? 'route-on r'+r.route : ''" @click="r.route ? openRouteClue(r.route) : openPenetModal('approval')">
                          <span class="pi-dot" :class="r.lvClass"></span>
                          <span class="pi-name">{{ r.item }}</span>
                          <span class="pi-tag" :class="r.lvClass">{{ r.level }}</span>
                        </button>
                      </div>
                    </transition>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </section>
      </div>

      <!-- ========== 中列 核心指标(+1/6高) : 网络图 : 热力图 ========== -->
      <div class="col col-center">
        <!-- A2 核心指标 -->
        <section class="glass-panel a2-panel" :class="lm('a2')">
          <div class="ph">
            <h3>核心指标</h3>
            <span class="gpill green">{{ periodLabel }}</span>
          </div>
          <div class="hero-row-3">
            <div class="hero-item">
              <span class="hero-label">采购总额</span>
              <span class="hero-val blue">¥{{ pd.amount }}<em>亿</em></span>
            </div>
            <div class="hero-item">
              <span class="hero-label">节资率</span>
              <span class="hero-val green">{{ pd.savingRate }}<em>%</em></span>
            </div>
            <div class="hero-item risk-bg">
              <span class="hero-label">高风险预警</span>
              <span class="hero-val red">{{ pd.highRisk }}<em>条</em></span>
            </div>
          </div>
          <div class="metrics-row-5">
            <div v-for="m in displayMetrics" :key="m.id" class="m5-cell">
              <span class="m5-label">{{ m.label }}</span>
              <span class="m5-val" :style="{ color: m.color }">{{ m.value }}</span>
            </div>
          </div>
        </section>

        <!-- B2 穿透网络图 -->
        <section class="glass-panel b2-panel" :class="[{ linked: penetrationContext.active || story2.clueOpen }, lm('b2')]">
          <div class="ph">
            <h3>采购主体穿透网络图</h3>
            <transition name="linkbadge-fade">
              <span v-if="penetrationContext.active" class="link-badge">
                <i class="link-dot"></i>联动中 · 关联链路 {{ penetrationContext.highlightNodes.length }} 主体
              </span>
              <span v-else-if="story2.clueOpen" class="link-badge">
                <i class="link-dot"></i>联动中 · 恒通复合风险链路 {{ STORY2_NET_NODES.length }} 主体
              </span>
            </transition>
            <button v-if="penetrationContext.active" class="net-reset-btn" @click="resetPenetration">⟲ 恢复默认</button>
            <button v-else-if="story2.clueOpen" class="net-reset-btn" @click="resetStory2">⟲ 恢复默认</button>
            <div class="legend-mini">
              <span><i class="ld ld-safe"></i>低风险</span>
              <span><i class="ld ld-warn"></i>中风险</span>
              <span><i class="ld ld-danger"></i>高风险</span>
              <span class="ld-info">22节点 · 23边</span>
            </div>
          </div>
          <EChart class="net-chart" :option="darkNetworkOption" />
        </section>

        <!-- C2 热力图 + 供应商 -->
        <section class="glass-panel c2-panel" :class="lm('c2')">
          <div class="ph">
            <h3>品类 × 采购方式分布</h3>
            <div style="display:flex;align-items:center;gap:5px">
              <span class="gpill ice">风险色阶</span>
              <span class="gpill warn">供应商待关注 2</span>
            </div>
          </div>
          <div class="c2-body">
            <EChart class="heatmap-chart" :option="heatmapOption" @chart-click="onHeatmapClick" />
            <div class="sup-side">
              <div class="sup-side-title">供应商 TOP 6</div>
              <div class="sup-side-rows">
                <div v-for="s in supplierRanking" :key="s.rank"
                     class="sup-side-row" :class="{ 'sup-alert': s.riskCount >= 5, 'assistant-hl': assistantSupplierHl && s.name.includes('鼎信建设一公司'), 'story2-hl': story2.supplierHl && s.story2, 'story2-clickable': story2.supplierHl && s.story2 }"
                     @click="onSupplierRowClick(s)">
                  <span class="ssr-rank" :class="rankClass(s.rank)">{{ s.rank }}</span>
                  <div class="ssr-info">
                    <div class="ssr-name">{{ s.name }}</div>
                    <div class="ssr-meta">{{ s.category }}
                      <span :style="{ color: s.white ? '#059669' : '#DC2626' }">{{ s.white ? ' ✓' : ' ⚠' }}</span>
                    </div>
                    <div v-if="story2.supplierHl && s.story2 && s.riskFlags" class="ssr-flags">
                      <span v-for="f in s.riskFlags" :key="f" class="ssr-flag">{{ f }}</span>
                    </div>
                  </div>
                  <div class="ssr-right">
                    <span class="ssr-amt">{{ s.amount }}<em>亿</em></span>
                    <div class="ssr-row2">
                      <span class="sup-risk-badge" :class="s.riskCount >= 5 ? 'risk-high' : s.riskCount > 0 ? 'risk-mid' : 'risk-none'">
                        {{ s.riskCount > 0 ? s.riskCount + '险' : '—' }}
                      </span>
                      <span class="ssr-health" :style="{ color: healthColor(s.health) }">{{ s.health }}</span>
                      <span class="sup-trend" :class="s.trend > 0 ? 'trend-up' : s.trend < 0 ? 'trend-dn' : 'trend-flat'">
                        {{ s.trend > 0 ? '↑' : s.trend < 0 ? '↓' : '→' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ========== 右列 3 : 4 : 3 ========== -->
      <div class="col col-right">
        <!-- A3 趋势 -->
        <section class="glass-panel a3-panel" :class="lm('a3')">
          <div class="ph">
            <h3>趋势数据</h3>
            <span class="gpill ice">{{ periodLabel }} · 三轴</span>
          </div>
          <EChart class="trend-chart" :option="darkTrendOption" />
        </section>

        <!-- B3 实时采购风险 -->
        <section class="glass-panel b3-panel" :class="[{ linked: penetrationContext.active, 'rl-flash': riskListFlash }, lm('b3')]">
          <div class="ph">
            <h3>实时采购风险</h3>
            <span class="gpill danger">高 {{ highRiskCount }} 条</span>
          </div>
          <!-- 故事线二：复合风险线索（点恒通行后并案拉起两条风险） -->
          <div v-if="story2.clueOpen" class="story2-clue">
            <div class="s2c-main">
              <span class="s2c-tag">复合风险</span>
              <div class="s2c-tt">
                <strong>恒通供应链 · 围标串标 + 履约不符</strong>
                <span>并案 CG-2026005(¥280万) + CG-2026041(¥40万) · 合计 ¥320万 · 评分 62</span>
              </div>
              <button class="s2c-close" @click="resetStory2" title="收起">✕</button>
            </div>
            <button class="s2c-open" @click="openStory2Panel">打开 AI 研判面板 →</button>
          </div>
          <div class="risk-stack">
            <div v-for="r in riskList" :key="r.id" class="risk-card"
                 :class="[r.level, { 'story-focus': r.storyFocus && penetrationContext.active && focusOrderId === r.no, 'story2-focus': r.story2Focus && story2.clueOpen }]">
              <div class="risk-header">
                <span class="risk-tag" :class="r.level">{{ r.no }}</span>
                <span class="risk-level-badge" :class="r.level">{{ r.levelLabel }}</span>
                <span class="risk-status" :class="r.statusCode">{{ r.status }}</span>
                <span class="risk-time">⏱ {{ formatTime(r.warningTime) }}</span>
              </div>
              <div class="risk-main-row">
                <div class="risk-info-col">
                  <div class="risk-title">{{ r.name }}</div>
                  <div class="risk-body">
                    <div class="risk-entity">
                      <span class="risk-label">涉及主体</span>
                      <span>{{ r.entity }}</span>
                    </div>
                    <div v-if="r.amount" class="risk-amount-row">
                      <span class="risk-label">金额</span>
                      <span class="risk-amount">¥{{ r.amount }}{{ r.amountUnit }}</span>
                    </div>
                    <div class="risk-meta">
                      <span class="risk-handler">{{ r.handler }}</span>
                      <span class="risk-deadline">期限 {{ r.deadline }}</span>
                    </div>
                  </div>
                </div>
                <div class="risk-actions-row">
                  <button class="risk-ai-btn" @click.stop="openReport(r)">
                    <span class="ai-btn-icon">✨</span>
                    <span class="ai-btn-text">AI 分析</span>
                    <span class="ai-btn-glow"></span>
                  </button>
                  <button v-if="analyzedReportIds.has(r.no)" class="risk-report-btn" @click.stop="viewReport(r.no)">
                    <span>📄</span>
                    <span>查看报告</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- C3 AI建议 + 系统入口 -->
        <section class="glass-panel c3-panel" :class="lm('c3')">
          <div class="ph">
            <h3>AI 建议 · 系统入口</h3>
            <span class="gpill ice">智能监管</span>
          </div>
          <div class="ai-list">
            <div v-for="a in aiSuggestions" :key="a.id" class="ai-item" :class="a.priority">
              <div class="ai-ava">AI</div>
              <div class="ai-bw">
                <div class="ai-meta"><strong>{{ a.type }}</strong><span class="ai-pri" :class="a.priority">{{ a.priorityLabel }}</span></div>
                <p>{{ a.content }}</p>
              </div>
            </div>
          </div>
          <div class="sys-grid">
            <button v-for="s in systemEntries" :key="s.id" class="sys-card">
              <span class="sys-icon">{{ s.icon }}</span>
              <span class="sys-label">{{ s.label }}</span>
              <span class="sys-online">在线</span>
            </button>
          </div>
        </section>
      </div>

    </div>

    <!-- ===== 全息抽屉 ===== -->
    <transition name="drawer-slide">
      <div v-if="drawerOpen && viewMode !== 'risk-detail'" class="holo-overlay" @click.self="drawerOpen = false">
        <div class="holo-drawer">
          <div class="hd-head">
            <div>
              <div class="hd-no">{{ drawerRisk?.no }} · {{ drawerRisk?.warningTime }}</div>
              <h3 class="hd-title">{{ drawerRisk?.name }}</h3>
            </div>
            <div class="hd-tags">
              <span class="gpill" :class="drawerRisk?.level">{{ drawerRisk?.levelLabel }}</span>
              <button class="hd-close" @click="drawerOpen = false">✕</button>
            </div>
          </div>
          <div class="hd-body" v-if="drawerRisk">
            <div v-for="acc in drawerAccordions" :key="acc.id" class="acc-section">
              <button class="acc-head" @click="toggleAcc(acc.id)">
                <span class="acc-icon" :class="acc.domain">{{ acc.icon }}</span>
                <span>{{ acc.title }}</span>
                <i class="acc-arr" :class="{ open: accordionOpen.has(acc.id) }">▾</i>
              </button>
              <transition name="acc-expand">
                <div v-if="accordionOpen.has(acc.id)" class="acc-body">
                  <template v-if="acc.id === 'proc'">
                    <div class="acc-rows">
                      <div v-if="drawerRisk.detail?.riskItem" class="acc-row"><i class="acc-bullet"></i>{{ drawerRisk.detail.riskItem }}</div>
                      <div v-for="(c, i) in drawerRisk.detail?.causeAnalysis" :key="i" class="acc-row"><i class="acc-bullet"></i>{{ c }}</div>
                      <div v-if="!drawerRisk.detail" class="acc-row"><i class="acc-bullet"></i>{{ drawerRisk.summary || '暂无详细原因分析' }}</div>
                    </div>
                  </template>
                  <template v-else-if="acc.id === 'pene'">
                    <div class="pene-links" v-if="drawerRisk.detail?.penetrationLinks">
                      <span v-for="(l, i) in drawerRisk.detail.penetrationLinks" :key="i" class="pen-link" :class="penDomainColor(l.domain)">
                        <i class="pen-dot"></i><em>{{ l.domain }}</em>&nbsp;{{ l.data }}
                      </span>
                    </div>
                    <div v-else class="acc-rows"><div class="acc-row"><i class="acc-bullet"></i>暂无穿透链接数据</div></div>
                  </template>
                  <template v-else-if="acc.id === 'rect'">
                    <div class="acc-rows">
                      <div v-if="drawerRisk.detail?.rectificationSuggestions" v-for="(r, i) in drawerRisk.detail.rectificationSuggestions" :key="i" class="acc-row"><i class="acc-bullet"></i>{{ r }}</div>
                      <div v-else class="acc-row"><i class="acc-bullet"></i>暂无整改建议</div>
                    </div>
                  </template>
                  <template v-else-if="acc.id === 'prog'">
                    <div class="prog-line">
                      <span v-for="(step, i) in progressSteps" :key="step.code" class="prog-step"
                            :class="{ done: progressIndex(drawerRisk) >= i, current: progressIndex(drawerRisk) === i }">
                        <i></i>{{ step.label }}
                      </span>
                    </div>
                    <div class="hd-handler">责任人 {{ drawerRisk.handler }} · 整改期限 {{ drawerRisk.deadline }}</div>
                  </template>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== 穿透异常明细弹窗 ===== -->
    <transition name="drawer-slide">
      <div v-if="penetModalType && viewMode !== 'risk-detail'" class="pm-overlay" @click.self="penetModalType = null">
        <div class="pm-dialog">
          <div class="pm-head">
            <h3>{{ penetModalTitle }}</h3>
            <button class="pm-close" @click="penetModalType = null">✕</button>
          </div>
          <div class="pm-body">
            <table v-if="penetModalType === 'bid'" class="pm-table">
              <thead><tr><th>项目名称</th><th>采购编号</th><th>中标单位</th><th>异常类型</th><th>风险等级</th><th>处理状态</th></tr></thead>
              <tbody>
                <tr v-for="r in bidAnomalies" :key="r.code">
                  <td>{{ r.project }}</td><td class="mono">{{ r.code }}</td><td>{{ r.winner }}</td>
                  <td>{{ r.type }}</td><td><span class="pm-lv" :class="r.lvClass">{{ r.level }}</span></td><td>{{ r.status }}</td>
                </tr>
              </tbody>
            </table>
            <table v-if="penetModalType === 'accept'" class="pm-table">
              <thead><tr><th>合同编号</th><th>项目名称</th><th>供应商</th><th>付款金额</th><th>付款时间</th><th>验收状态</th><th>整改要求</th></tr></thead>
              <tbody>
                <tr v-for="r in acceptAnomalies" :key="r.contract">
                  <td class="mono">{{ r.contract }}</td><td>{{ r.project }}</td><td>{{ r.supplier }}</td>
                  <td class="amt">{{ r.amount }}</td><td class="mono">{{ r.time }}</td>
                  <td><span class="pm-st warn">{{ r.acceptStatus }}</span></td><td>{{ r.requirement }}</td>
                </tr>
              </tbody>
            </table>
            <table v-if="penetModalType === 'approval'" class="pm-table">
              <thead><tr><th>审批事项</th><th>审批人</th><th>审批时间</th><th>异常原因</th><th>风险等级</th><th>整改责任人</th><th>整改期限</th></tr></thead>
              <tbody>
                <tr v-for="r in approvalAnomalies" :key="r.item+r.approver">
                  <td>{{ r.item }}</td><td>{{ r.approver }}</td><td class="mono">{{ r.time }}</td>
                  <td>{{ r.reason }}</td><td><span class="pm-lv" :class="r.lvClass">{{ r.level }}</span></td>
                  <td>{{ r.responsible }}</td><td class="mono">{{ r.deadline }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pm-foot"><button class="pm-btn" @click="penetModalType = null">关 闭</button></div>
        </div>
      </div>
    </transition>

    <!-- ══════════ 风险事项详情报告视图 ══════════ -->
    <template v-if="viewMode === 'risk-detail' && activeRisk">
      <div class="rd-view">
        <div class="cd-topbar rd-topbar">
          <div class="cd-topbar-left">
            <button type="button" class="rdr-back-btn" @click="goBack">{{ backLabel }}</button>
            <span class="cd-id">{{ activeRisk.id }}</span>
            <span class="risk-pill" :class="`rp-${activeRisk.level}`">{{ riskLevelLabel[activeRisk.level] }}</span>
            <button type="button" class="cd-contract-link" @click="showToast('查看关联合同 ' + activeRisk.contractRef)" :title="'点击查看关联合同 ' + activeRisk.contractRef">📄 关联合同：{{ activeRisk.contractRef }}</button>
          </div>
          <div class="cd-topbar-right">
            <span class="cd-status-pill" style="background:#fff7ed;border-color:#fed7aa;color:#c2410c">{{ activeRisk.status }}</span>
            <span>生成时间：{{ activeRisk.alertTime }}</span>
          </div>
        </div>
        <div class="rd-content">
          <aside class="rd-sidebar">
            <!-- Hero 卡片 -->
            <div class="card rd-hero-card" :class="`rdh-${activeRisk.level}`">
              <div class="rdh-badge">
                <span class="rdh-badge-icon">{{ riskIconMap[activeRisk.level] }}</span>
                <span class="rdh-badge-text">{{ riskLevelLabel[activeRisk.level] }}</span>
              </div>
              <div class="rdh-id">{{ activeRisk.id }}</div>
              <h2 class="rdh-name">{{ activeRisk.name }}</h2>
              <div class="rdh-status-bar">
                <span class="rdh-status-pill" :class="`rics-${stepKeyOfRisk(activeRisk)}`">{{ activeRisk.status }}</span>
                <span class="rdh-time">⏱ {{ activeRisk.alertTime }}</span>
              </div>
            </div>

            <!-- 关键信息卡 -->
            <div class="card rd-key-card">
              <div class="rdk-title">关键信息</div>
              <div class="rdk-row" @click="showToast('查看关联合同 ' + activeRisk.contractRef)">
                <span class="rdk-lbl">📄 关联合同</span>
                <strong class="rdk-val link">{{ activeRisk.contractRef }} ›</strong>
              </div>
              <div class="rdk-row">
                <span class="rdk-lbl">🛒 采购编号</span>
                <strong class="rdk-val">{{ activeRisk.no }}</strong>
              </div>
              <div class="rdk-row rdk-row-stack">
                <span class="rdk-lbl">👥 涉及主体</span>
                <div class="rdk-subjects">
                  <strong>{{ activeRisk.entity }}</strong>
                </div>
              </div>
              <div class="rdk-row rdk-row-stack">
                <span class="rdk-lbl">🛰 预警来源</span>
                <strong class="rdk-val-text">{{ activeRisk.source }}</strong>
              </div>
            </div>

            <!-- 处理进度卡 -->
            <div class="card rd-status-card">
              <div class="rds-title">处理进度</div>
              <div class="status-flow">
                <div v-for="(step, si) in (progressTracking.status_flow || activeRisk.statusFlow || []).split(' → ') || []" :key="step" class="sf-step" :class="{ done: si < (progressTracking.current_status ? getStatusIdx(progressTracking.current_status) : activeRisk.currentStatusIdx || 0), current: si === (progressTracking.current_status ? getStatusIdx(progressTracking.current_status) : activeRisk.currentStatusIdx || 0) }">
                  <div class="sf-dot"></div>
                  <span>{{ progressTracking.current_status && si === getStatusIdx(progressTracking.current_status) ? progressTracking.current_status : step }}</span>
                  <div v-if="si < ((progressTracking.status_flow || activeRisk.statusFlow || []).split(' → ')||[]).length - 1" class="sf-line"></div>
                </div>
              </div>
              <div class="rds-meta">
                <div><span>责任人</span><strong>{{ extractNames(progressTracking.responsible_person || activeRisk.responsible) }}</strong></div>
                <div><span>整改期限</span><strong class="deadline">{{ progressTracking.deadline || activeRisk.deadline }}</strong></div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="card rd-actions-card">
              <div class="rda-title">核查操作</div>
              <div class="rda-grid">
                <button type="button" class="rda-btn primary" @click="showToast('核查工单已派发至采购部门')">派发核查工单</button>
                <button type="button" class="rda-btn danger" @click="showToast('风险已升级至集团预警')">升级集团预警</button>
                <button type="button" class="rda-btn" @click="showToast('已补充佐证材料，待审核')">补充佐证材料</button>
                <button type="button" class="rda-btn" @click="showToast('已提交解除采购预警申请')">解除采购预警</button>
              </div>
            </div>
          </aside>
          <div class="rd-main">
            <div class="card rd-report">
              <div class="rdr-header">
                <div class="rdr-header-left">
                  <h2>风险事项详情报告</h2>
                  <p>采购管理域 · {{ activeRisk.name }} · AI智能体自动生成报告</p>
                  <p><a href="http://10.8.0.206:8098/process_detail?flow_id=10010&title=%E9%87%87%E8%B4%AD%E7%A9%BF%E9%80%8F" target="_blank">点击查看运行日志</a></p>
                </div>
                <button v-if="activeRisk" class="rdr-drill-btn" :class="{ active: drillPanelOpen }" @click="drillPanelOpen = !drillPanelOpen">
                  <span class="rdr-drill-ico">🔎</span>关联穿透 · 逐层下钻
                </button>
              </div>
              <div class="rdr-scroll">
                <div class="report-container">
                  <!-- 报告头部信息 -->
                  <div class="report-header-card">
                    <div class="rhc-title">【风险事项详情报告】</div>
                    <div class="rhc-info-grid">
                      <div class="rhc-info">
                        <span class="rhc-label">风险ID</span>
                        <span class="rhc-value mono">{{ activeRisk.id }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">风险名称</span>
                        <span class="rhc-value">{{ activeRisk.name }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">风险等级</span>
                        <span class="rhc-value risk-badge" :class="activeRisk.level">{{ riskLevelLabel[activeRisk.level] }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">预警时间</span>
                        <span class="rhc-value">{{ activeRisk.alertTime }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">预警来源</span>
                        <span class="rhc-value">{{ activeRisk.source }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">涉及主体</span>
                        <span class="rhc-value">{{ activeRisk.entity }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 一、风险预警事项 -->
                  <div class="report-section">
                    <div class="section-header">
                      <span class="section-number">一</span>
                      <span class="section-title">风险预警事项</span>
                    </div>
                    <div class="section-content">
                      <div class="warning-details">
                        <div class="report-text">
                          {{ reportSections.risk_warning?.content }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 二、风险定义 -->
                  <div class="report-section">
                    <div class="section-header">
                      <span class="section-number">二</span>
                      <span class="section-title">风险定义</span>
                    </div>
                    <div class="section-content">
                      <div class="definition-box">
                        <div class="report-text">
                          {{ reportSections.risk_definition?.content }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 三、计算逻辑 -->
                  <div class="report-section">
                    <div class="section-header">
                      <span class="section-number">三</span>
                      <span class="section-title">计算逻辑</span>
                    </div>
                    <div class="section-content">
                      <div class="calc-box">
                        <div
                          class="logic-item"
                          v-for="(item, index) in reportSections.calculation_logic?.items || []"
                          :key="index"
                        >
                          <div class="logic-title">{{ item.label }}</div>
                          <div class="logic-content">{{ item.content }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 四、原因分析 -->
                  <div class="report-section">
                    <div class="section-header">
                      <span class="section-number">四</span>
                      <span class="section-title">原因分析</span>
                    </div>
                    <div class="section-content">
                      <div class="analysis-list">
                        <div
                          class="analysis-item"
                          v-for="(item, index) in reportSections.cause_analysis?.items || []"
                          :key="index"
                        >
                          <div class="analysis-title">{{ item.label }}</div>
                          <div class="analysis-content">{{ item.content }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 五、关联数据穿透链接 -->
                  <div class="report-section">
                    <div class="section-header">
                      <span class="section-number">五</span>
                      <span class="section-title">关联数据穿透链接</span>
                    </div>
                    <div class="section-content">
                      <div class="link-box">
                        <div class="link-group">
                          <div class="link-group-title">采购域</div>
                          <div class="link-items">
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'采购计划', label:'CGP-'+activeRisk.no.replace('CG-',''), domain:'采购域' })">
                              <span class="link-icon">🛒</span>
                              <span class="link-text">采购计划</span>
                              <span class="link-id">CGP-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'询价记录', label:'XJ-'+activeRisk.no.replace('CG-',''), domain:'采购域' })">
                              <span class="link-icon">🔍</span>
                              <span class="link-text">询价记录</span>
                              <span class="link-id">XJ-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'中标公告', label:'ZB-'+activeRisk.no.replace('CG-',''), domain:'采购域' })">
                              <span class="link-icon">📣</span>
                              <span class="link-text">中标公告</span>
                              <span class="link-id">ZB-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                          </div>
                        </div>
                        <div class="link-group">
                          <div class="link-group-title">合同域</div>
                          <div class="link-items">
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'关联合同', label:activeRisk.contractRef, domain:'合同域' })">
                              <span class="link-icon">📄</span>
                              <span class="link-text">关联合同</span>
                              <span class="link-id">{{ activeRisk.contractRef }}</span>
                            </button>
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'合同审批单', label:'SP-'+activeRisk.contractRef.replace('HT-',''), domain:'合同域' })">
                              <span class="link-icon">✅</span>
                              <span class="link-text">合同审批单</span>
                              <span class="link-id">SP-{{ activeRisk.contractRef.replace('HT-','') }}</span>
                            </button>
                          </div>
                        </div>
                        <div class="link-group">
                          <div class="link-group-title">财务域</div>
                          <div class="link-items">
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'发票', label:'FP-'+activeRisk.no.replace('CG-',''), domain:'财务域' })">
                              <span class="link-icon">🧾</span>
                              <span class="link-text">发票</span>
                              <span class="link-id">FP-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'会计凭证', label:'PZ-'+activeRisk.no.replace('CG-',''), domain:'财务域' })">
                              <span class="link-icon">📊</span>
                              <span class="link-text">会计凭证</span>
                              <span class="link-id">PZ-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'付款申请', label:'FK-'+activeRisk.no.replace('CG-',''), domain:'财务域' })">
                              <span class="link-icon">💳</span>
                              <span class="link-text">付款申请</span>
                              <span class="link-id">FK-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                          </div>
                        </div>
                        <div class="link-group">
                          <div class="link-group-title">资金域</div>
                          <div class="link-items">
                            <button class="link-item" @click="openDrill({ kind:'doc', type:'银行流水', label:'LS-'+activeRisk.no.replace('CG-',''), domain:'资金域' })">
                              <span class="link-icon">🏦</span>
                              <span class="link-text">银行流水</span>
                              <span class="link-id">LS-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 六、整改建议 -->
                  <div class="report-section">
                    <div class="section-header">
                      <span class="section-number">六</span>
                      <span class="section-title">整改建议</span>
                    </div>
                    <div class="section-content">
                      <div class="suggestion-box">
                        <div
                          class="suggestion-item"
                          v-for="(item, index) in reportSections.rectification_suggestions?.items || []"
                          :key="index"
                        >
                          <span class="suggestion-num">{{ index + 1 }}.</span>
                          <span class="suggestion-text">{{ stripLeadingNumber(typeof item === 'string' ? item : item.content || item.label) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 七、处理进度跟踪 -->
                  <div class="report-section status-section">
                    <div class="section-header">
                      <span class="section-number">七</span>
                      <span class="section-title">处理进度跟踪</span>
                    </div>
                    <div class="section-content">
                      <div class="status-box">
                        <div class="status-item">
                          <span class="status-label">处理状态</span>
                          <span class="status-value">{{ progressTracking.current_status || activeRisk.status }}</span>
                        </div>
                        <div class="status-item">
                          <span class="status-label">责任人</span>
                          <span class="status-value">{{ extractNames(progressTracking.responsible_person || activeRisk.responsible) }}</span>
                        </div>
                        <div class="status-item">
                          <span class="status-label">整改期限</span>
                          <span class="status-value deadline">{{ progressTracking.deadline || activeRisk.deadline }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════ 关联穿透浮层（页面 1/3，悬浮于页面） ══════════ -->
      <div v-if="drillPanelOpen && activeRisk" class="drillpanel" :class="{ expanded: plansVisible }">
        <div class="dp-head">
          <div class="dp-head-l">
            <span class="dp-ico">🔎</span>
            <div class="dp-head-tt">
              <strong>风险核查与处置工作台</strong>
              <span>{{ activeRisk.id }} · {{ activeRisk.name }}</span>
            </div>
          </div>
          <button class="dp-close" @click="drillPanelOpen = false">✕</button>
        </div>
        <div class="dp-body" ref="dpBodyEl">
          <!-- ① 涉及对象：用关系图展示，点击放大弹窗 -->
          <div class="dp-block">
            <div class="dp-block-hd"><span class="dp-step">1</span>涉及对象
              <button class="dp-expand" @click="entityModalOpen = true">⤢ 放大</button>
            </div>
            <div class="entity-graph-wrap" @click="entityModalOpen = true">
              <EChart class="entity-graph" :option="entityGraphOption" />
              <span class="entity-graph-hint">点击放大</span>
            </div>
          </div>

          <!-- ② AI 推荐核查方向（自然措辞，不暴露剧本；整改建议已独立下移） -->
          <div v-if="showStoryAdvice" class="dp-block">
            <div class="dp-block-hd"><span class="dp-step">2</span>AI 推荐核查方向</div>
            <div class="dp-chips">
              <button class="advice-chip" @click="openDrill('risk_related_transfer')">资金往来核查</button>
              <button class="advice-chip" @click="openDrill('person_zhangwei')">经办人画像</button>
              <button class="advice-chip" @click="openDrill('org_dingxin1')">供应商背景</button>
            </div>
          </div>

          <!-- 整改建议：独立、显著的向下推进按钮 -->
          <div v-if="showStoryAdvice" class="dp-rectify">
            <button class="rectify-cta" :class="{ loading: rectifyLoading, done: plansVisible }" :disabled="rectifyLoading" @click="onRectifyClick">
              <span class="rc-ico">{{ rectifyLoading ? '⏳' : plansVisible ? '✓' : '🛠' }}</span>
              <span class="rc-main">
                <b>整改建议</b>
                <em>{{ rectifyLoading ? 'AI 正在生成处置方案…' : plansVisible ? '处置方案已生成' : '点击生成处置方案' }}</em>
              </span>
              <span v-if="!plansVisible && !rectifyLoading" class="rc-arrow">↓</span>
            </button>
          </div>

          <!-- ③ 处置闭环：人选方案 + AI 实施（点整改建议后延迟出现 + 动画） -->
          <transition name="plans-reveal">
          <div v-if="storyReportActive && plansVisible" class="dp-block">
            <div class="dp-block-hd"><span class="dp-step">3</span>处置闭环 · 人选方案 + AI 实施</div>
            <div class="plan-grid">
              <button v-for="p in plans" :key="p.key" class="plan-card"
                      :class="[{ selected: selectedPlan === p.key, recommended: p.recommended }]"
                      @click="choosePlan(p.key)">
                <div class="plan-top">
                  <span class="plan-key">{{ p.key }}</span>
                  <span class="plan-name">{{ p.name }}</span>
                  <span class="plan-strength" :class="p.strength">{{ p.strength }}</span>
                  <span v-if="p.recommended" class="plan-rec">推荐</span>
                </div>
                <div class="plan-impact">预计影响：{{ p.impact }}</div>
              </button>
            </div>

            <!-- 三个方案对比（可视化数表弹窗） -->
            <button class="plan-compare-btn" @click="planCompareOpen = true">📊 查看三个方案对比 · 不同派发方式的结果推演</button>

            <!-- 已选方案 → 处置结果以弹窗呈现，这里提供再次查看入口 -->
            <div v-if="selectedPlan" class="exec-wrap">
              <button class="exec-reopen" @click="reopenPlanResult">📋 查看方案 {{ selectedPlan }} 处置结果与初步成效</button>
            </div>
          </div>
          </transition>
        </div>
      </div>

    <!-- ══════════ 涉及对象·关系图放大弹窗（图 + 对象按钮） ══════════ -->
    <div v-if="entityModalOpen && activeRisk" class="ent-overlay" @click.self="entityModalOpen = false">
        <div class="ent-dialog">
          <div class="ent-head">
            <h3>涉及对象 · 关系视图</h3>
            <span class="ent-sub">{{ activeRisk.id }}</span>
            <span class="ent-hint">滚轮缩放 · 拖动平移 · 可拖拽节点</span>
            <button class="ent-close" @click="entityModalOpen = false">✕</button>
          </div>
          <EChart class="ent-graph-big" :option="entityGraphOptionBig" />
          <div class="ent-btns-wrap">
            <div class="ent-btns-lbl">点击对象查看明细：</div>
            <div class="ent-btns">
              <button v-for="(e, ei) in reportEntitiesLive" :key="ei" class="drill-chip" @click="openEntityFromModal(e)">
                <em class="chip-kind">{{ e.type }}</em>{{ e.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

    <!-- ══════════ 处置结果弹窗（下达后初步成效 + 继续穿透，完善故事线解决部分） ══════════ -->
    <div v-if="planResultOpen && currentPlanResult" class="pr-overlay" @click.self="planResultOpen = false">
      <div class="pr-dialog" :class="currentPlanResult.tone">
        <div class="pr-head">
          <div class="pr-head-l">
            <span class="pr-badge" :class="currentPlanResult.tone">方案 {{ selectedPlan }}</span>
            <div class="pr-head-tt">
              <strong>{{ currentPlanResult.name }}</strong>
              <span>已下达 · {{ currentPlanResult.status }}</span>
            </div>
          </div>
          <button class="pr-close" @click="planResultOpen = false">✕</button>
        </div>
        <div class="pr-body">
          <!-- AI 实施回执（方案A 逐条打勾） -->
          <div v-if="selectedPlan === 'A'" class="pr-sect">
            <div class="pr-sect-lbl">AI 实施回执</div>
            <transition-group name="exec-fade" tag="div" class="exec-list">
              <div v-for="s in executionVisible" :key="s.step" class="exec-step">
                <span class="exec-step-no">{{ s.step }}</span>
                <div class="exec-step-bd">
                  <div class="exec-step-text">{{ s.text }}</div>
                  <div class="exec-step-meta">{{ s.operator }} · {{ s.time }} · <em :class="{ wait: s.status.includes('待') }">{{ s.status }}</em></div>
                </div>
              </div>
            </transition-group>
          </div>

          <!-- 处置效果（初步）：整改后逐条缓慢动态生效 -->
          <div class="pr-sect">
            <div class="pr-sect-lbl">处置效果（初步）</div>
            <transition-group name="pr-eff" tag="div" class="pr-effects">
              <div v-for="(ef, i) in visibleEffects" :key="i" class="pr-effect">
                <span class="pr-ef-ico">{{ ef.icon }}</span>
                <div class="pr-ef-bd"><b>{{ ef.k }}</b><span>{{ ef.v }}</span></div>
              </div>
            </transition-group>
            <div v-if="!effectsAllShown" class="pr-analyzing">
              <span class="pr-spin"></span>整改处置中，效果逐项生效…（{{ prEffectsRevealed }}/{{ currentPlanResult.effects.length }}）
            </div>
          </div>

          <!-- 继续穿透 + 闭环结论：效果全部生效后再出现（一步步推进） -->
          <transition name="pr-eff">
            <div v-if="effectsAllShown">
              <div v-if="currentPlanResult.drill && currentPlanResult.drill.length" class="pr-sect">
                <div class="pr-sect-lbl">继续穿透 · 核验处置结果</div>
                <div class="pr-drills">
                  <button v-for="(d, i) in currentPlanResult.drill" :key="i" class="pr-drill-btn" @click="openDrill(d.to)">{{ d.label }} →</button>
                </div>
              </div>
              <div class="pr-closing">{{ currentPlanResult.closing }}</div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- ══════════ 故事线二：复合风险 AI 研判面板（12 环 + A/B/C + 查看依据 + 选A 回执） ══════════ -->
    <div v-if="story2PanelOpen" class="s2p-overlay" @click.self="story2PanelOpen = false">
      <div class="s2p-dialog">
        <div class="s2p-head">
          <div class="s2p-head-l">
            <span class="s2p-badge">复合风险研判</span>
            <div class="s2p-head-tt">
              <strong>{{ story2Judge.supplier }}</strong>
              <span>围标串标 + 履约不符（复合） · 涉 {{ story2Judge.amount }} · 健康评分 {{ story2Judge.score }} · {{ story2Judge.flags }} 个风险标记</span>
            </div>
          </div>
          <button class="s2p-close" @click="story2PanelOpen = false">✕</button>
        </div>
        <div class="s2p-body">
          <!-- 并案两条线索 -->
          <div class="s2p-sect-lbl">并案线索（2 条）</div>
          <div class="s2p-items">
            <div v-for="it in story2Judge.items" :key="it.no" class="s2p-item" :class="it.type === '围标串标' ? 'tone-bid' : 'tone-pay'">
              <div class="s2p-item-h"><span class="s2p-item-no">{{ it.no }}</span><span class="s2p-item-type">{{ it.type }}</span><span class="s2p-item-amt">{{ it.amount }}</span></div>
              <div class="s2p-item-proj">{{ it.proj }} · {{ it.handler }}</div>
              <div class="s2p-item-extra">{{ it.extra }}</div>
            </div>
          </div>

          <!-- 12 环 AI 研判 -->
          <div class="s2p-sect-lbl">AI 研判 · 12 环穿透</div>
          <div class="s2p-rings">
            <div v-for="r in story2Judge.rings" :key="r.k" class="s2p-ring">
              <span class="s2p-ring-k">{{ r.k }}</span>
              <span class="s2p-ring-v">{{ r.v }}</span>
            </div>
          </div>

          <!-- 处置方案：点「AI 建议」加载 A/B/C -->
          <div class="s2p-sect-lbl">处置方案（人判断 + AI 实施）</div>
          <!-- 未生成：AI 建议入口 -->
          <button v-if="!story2AdviceReady" class="s2p-advice-btn" :class="{ loading: story2AdviceLoading }" :disabled="story2AdviceLoading" @click="story2AskAdvice">
            <span v-if="story2AdviceLoading" class="s2p-advice-spin"></span>
            <span class="s2p-advice-ico" v-else>🤖</span>
            {{ story2AdviceLoading ? 'AI 正在生成处置建议…' : '让 AI 给出处置建议（A / B / C）' }}
          </button>
          <!-- 已生成：对比入口 + A/B/C -->
          <template v-else>
            <button class="s2p-compare-btn" @click="story2CompareOpen = true">📊 查看三个方案对比</button>
            <div class="s2p-plans">
              <div v-for="p in story2Judge.plans" :key="p.key" class="s2p-plan" :class="{ chosen: story2Plan === p.key }">
                <button class="s2p-plan-btn" :class="'opt-'+p.key" @click="chooseStory2Plan(p.key)">
                  <span class="s2p-plan-key">{{ p.key }}</span>
                  <span class="s2p-plan-main">
                    <b>{{ p.label }}<em v-if="p.recommended" class="s2p-rec">推荐</em></b>
                    <span class="s2p-plan-impact">预计影响：{{ p.impact }}</span>
                  </span>
                </button>
                <button class="s2p-basis-toggle" @click="toggleStory2Basis(p.key)">{{ story2BasisKey === p.key ? '收起依据 ▲' : '查看依据 ▼' }}</button>
                <div v-if="story2BasisKey === p.key" class="s2p-basis">
                  <p>{{ p.basis }}</p>
                  <div class="s2p-basis-figs">
                    <span class="s2p-fig">📈 报价曲线（占位）</span>
                    <span class="s2p-fig">⚖️ 同类判例（占位）</span>
                    <span class="s2p-fig">📉 供应商风险趋势（占位）</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ══════════ 故事线二：三方案对比·可视化数表弹窗（数据依 CG-2026005/CG-2026041 演进） ══════════ -->
    <div v-if="story2CompareOpen" class="pc-overlay s2-top" @click.self="story2CompareOpen = false">
      <div class="pc-dialog">
        <div class="pc-head">
          <div class="pc-head-tt">
            <strong>📊 三个处置方案对比 · 不同处置方式的结果推演</strong>
            <span>恒通供应链 · 围标串标 + 履约不符（复合）· CG-2026005 + CG-2026041 · ¥320万</span>
          </div>
          <button class="pc-close" @click="story2CompareOpen = false">✕</button>
        </div>
        <div class="pc-body">
          <table class="pc-table">
            <thead>
              <tr>
                <th class="pc-dim-h">对比维度</th>
                <th v-for="c in story2CompareCols" :key="c.key" class="pc-col-h" :class="{ rec: c.key === 'A' }">
                  <span class="pc-col-key">方案 {{ c.key }}</span>
                  <span class="pc-col-name">{{ c.name }}</span>
                  <span class="pc-col-tag" :class="{ rec: c.key === 'A' }">{{ c.tag }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in story2CompareRows" :key="i">
                <td class="pc-dim">{{ r.dim }}</td>
                <td v-for="c in story2CompareCols" :key="c.key" class="pc-cell" :class="[r[c.key].tone, { rec: c.key === 'A' }]">
                  <i class="pc-dot" :class="r[c.key].tone"></i><span>{{ r[c.key].v }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 点击指标模块 → 展示三方案随处置周期演化的对比曲线 -->
          <div class="pc-charts">
            <div class="pcc-cap">📈 结果推演 · 点击指标查看三方案随处置周期的变化曲线</div>
            <div class="pcc-tabs">
              <button v-for="mt in story2Metrics" :key="mt.key"
                      :class="['pcc-tab', { active: story2ChartMetric === mt.key }]"
                      @click="story2ChartMetric = mt.key">
                <span class="pcc-ic">{{ mt.icon }}</span>
                <span class="pcc-lb">{{ mt.label }}</span>
                <span class="pcc-delta">A {{ mt.series.A[mt.series.A.length-1] }}{{ mt.unit }} · C {{ mt.series.C[mt.series.C.length-1] }}{{ mt.unit }}</span>
              </button>
            </div>
            <div class="pcc-desc">{{ story2ChartData.desc }}</div>
            <EChart class="pcc-chart" :option="story2TrendOption" />
            <div class="pcc-insight"><span class="pcc-insight-ic">💡</span><span>{{ story2ChartData.insight }}</span></div>
          </div>

          <div class="pc-foot">
            <span class="pc-legend"><i class="pc-dot good"></i>有利 / 风险低</span>
            <span class="pc-legend"><i class="pc-dot warn"></i>需权衡</span>
            <span class="pc-legend"><i class="pc-dot bad"></i>风险高 / 不利</span>
            <span class="pc-foot-note">说明：数据依本案（围标串标 ¥280万 + 履约不符 ¥40万 · 合计 ¥320万 · 恒通评分 62）推演，仅作处置决策参考。</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ 故事线二：选中方案后自动弹出·AI 实施回执 ══════════ -->
    <div v-if="story2ResultOpen && story2CurrentResult" class="pr-overlay s2-top" @click.self="story2ResultOpen = false">
      <div class="pr-dialog" :class="story2CurrentResult.tone">
        <div class="pr-head">
          <div class="pr-head-l">
            <span class="pr-badge" :class="story2CurrentResult.tone">方案 {{ story2Plan }}</span>
            <div class="pr-head-tt">
              <strong>{{ story2Judge.plans.find(p => p.key === story2Plan)?.label }}</strong>
              <span>已下达 · {{ story2CurrentResult.status }}</span>
            </div>
          </div>
          <button class="pr-close" @click="story2ResultOpen = false">✕</button>
        </div>
        <div class="pr-body">
          <div class="pr-sect">
            <div class="pr-sect-lbl">AI 实施回执</div>
            <transition-group name="exec-fade" tag="div" class="s2p-exec">
              <div v-for="(e, i) in story2ExecVisible" :key="i" class="s2p-exec-step">
                <span class="s2p-exec-no">✓</span><span>{{ e }}</span>
              </div>
            </transition-group>
            <div v-if="!story2ExecDone" class="pr-analyzing"><span class="pr-spin"></span>AI 正在逐条执行…（{{ story2ExecVisible.length }}/{{ story2CurrentResult.receipts.length }}）</div>
          </div>
          <transition name="pr-eff">
            <div v-if="story2ExecDone">
              <div class="s2p-exec-done">✓ 处置闭环已启动</div>
              <div class="pr-closing">{{ story2CurrentResult.closing }}</div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- ══════════ 两类穿透概览 → 路线①②③ 联动弹窗 ══════════ -->
    <div v-if="routeClueOpen && routeClueData" class="rc-overlay" @click.self="routeClueOpen = false">
      <div class="rc-dialog" :class="routeClueData.tone">
        <div class="rc-head">
          <span class="rc-tag" :class="routeClueData.tone">{{ routeClueData.tag }}</span>
          <div class="rc-head-tt">
            <strong>{{ routeClueData.name }}</strong>
            <span>{{ routeClueData.sub }}</span>
          </div>
          <button class="rc-close" @click="routeClueOpen = false">✕</button>
        </div>
        <div class="rc-body">
          <div class="rc-sect-lbl">关联链路（已联动中部穿透网络）</div>
          <div class="rc-chain">
            <div v-for="(c, i) in routeClueData.chain" :key="i" class="rc-chain-row"><span class="rc-chain-dot"></span>{{ c }}</div>
          </div>
          <div class="rc-grid">
            <div class="rc-kv"><span>资金闭环</span><strong>{{ routeClueData.fund }}</strong></div>
            <div class="rc-kv"><span>决策责任</span><strong>{{ routeClueData.resp }}</strong></div>
          </div>
        </div>
        <div class="rc-foot">
          <button class="rc-btn ghost" @click="routeClueOpen = false">关闭</button>
          <button class="rc-btn" :class="routeClueData.tone" @click="runRouteClue">{{ routeClueData.cta }} →</button>
        </div>
      </div>
    </div>

    <!-- ══════════ 三个处置方案对比·可视化数表弹窗（数据依 CG-2026001 当前案情演进） ══════════ -->
    <div v-if="planCompareOpen" class="pc-overlay" @click.self="planCompareOpen = false">
      <div class="pc-dialog">
        <div class="pc-head">
          <div class="pc-head-tt">
            <strong>📊 三个处置方案对比 · 不同派发方式的结果推演</strong>
            <span>CG-2026001 · 未验收即付款·关联输送 · 鼎信建设一公司</span>
          </div>
          <button class="pc-close" @click="planCompareOpen = false">✕</button>
        </div>
        <div class="pc-body">
          <table class="pc-table">
            <thead>
              <tr>
                <th class="pc-dim-h">对比维度</th>
                <th v-for="c in planCompareCols" :key="c.key" class="pc-col-h" :class="{ rec: c.key === 'A' }">
                  <span class="pc-col-key">方案 {{ c.key }}</span>
                  <span class="pc-col-name">{{ c.name }}</span>
                  <span class="pc-col-tag" :class="{ rec: c.key === 'A' }">{{ c.tag }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in planCompareRows" :key="i">
                <td class="pc-dim">{{ r.dim }}</td>
                <td v-for="c in planCompareCols" :key="c.key" class="pc-cell" :class="[r[c.key].tone, { rec: c.key === 'A' }]">
                  <i class="pc-dot" :class="r[c.key].tone"></i><span>{{ r[c.key].v }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 点击指标模块 → 展示三方案随处置周期演化的对比曲线 -->
          <div class="pc-charts">
            <div class="pcc-cap">📈 结果推演 · 点击指标查看三方案随处置周期的变化曲线</div>
            <div class="pcc-tabs">
              <button v-for="mt in planMetrics" :key="mt.key"
                      :class="['pcc-tab', { active: planChartMetric === mt.key }]"
                      @click="planChartMetric = mt.key">
                <span class="pcc-ic">{{ mt.icon }}</span>
                <span class="pcc-lb">{{ mt.label }}</span>
                <span class="pcc-delta">A {{ mt.series.A[mt.series.A.length-1] }}{{ mt.unit }} · C {{ mt.series.C[mt.series.C.length-1] }}{{ mt.unit }}</span>
              </button>
            </div>
            <div class="pcc-desc">{{ planChartData.desc }}</div>
            <EChart class="pcc-chart" :option="planTrendOption" />
            <div class="pcc-insight"><span class="pcc-insight-ic">💡</span><span>{{ planChartData.insight }}</span></div>
          </div>

          <div class="pc-foot">
            <span class="pc-legend"><i class="pc-dot good"></i>有利 / 风险低</span>
            <span class="pc-legend"><i class="pc-dot warn"></i>需权衡</span>
            <span class="pc-legend"><i class="pc-dot bad"></i>风险高 / 不利</span>
            <span class="pc-foot-note">说明：数据依据 CG-2026001 当前案情（¥40万付款、¥360万在途关联敞口、整改截止 2026-05-28）推演，仅作处置决策参考。</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ 穿透弹窗（可视化图表 + 明细表 + 核查处置表单/按钮） ══════════ -->
    <div v-if="drillModalOpen && currentLayer" class="dm-overlay" @click.self="closeDrillModal">
        <div class="dm-dialog">
          <!-- 头部 + 面包屑 -->
          <div class="dm-head">
            <div class="dm-head-main">
              <span class="dm-type">{{ currentLayer.type }}</span>
              <h3 class="dm-title">{{ currentLayer.title }}</h3>
              <span v-if="currentLayer.badge" class="dm-badge">{{ currentLayer.badge }}</span>
              <span class="dm-srctag" :class="{ advice: currentLayer.kind === 'advice' }">{{ currentLayer.kind === 'advice' ? 'AI建议·供参考' : '报告对象' }}</span>
            </div>
            <button class="dm-close" @click="closeDrillModal">✕</button>
          </div>
          <div class="dm-breadcrumb">
            <button class="dbc-item" @click="backToReport">{{ cameFromEntityModal ? '🔍 放大图' : '报告' }}</button>
            <template v-for="(d, i) in drillNodes" :key="i">
              <span class="dbc-sep">›</span>
              <button class="dbc-item" :class="{ active: i === drillNodes.length - 1 }" @click="drillTo(i)">{{ d.title }}</button>
            </template>
          </div>

          <div class="dm-body">
            <p v-if="currentLayer.summary" class="dm-summary">{{ currentLayer.summary }}</p>

            <!-- 可视化图表 -->
            <div v-if="currentChart" class="dm-chart-wrap">
              <EChart class="dm-chart" :option="currentChart" />
            </div>

            <!-- 字段卡 -->
            <div v-if="currentLayer.fields && currentLayer.fields.length" class="dm-fields">
              <div v-for="(f, fi) in currentLayer.fields" :key="fi" class="dm-field" :class="{ danger: f.danger }">
                <span class="dm-fk">{{ f.k }}</span>
                <span class="dm-fv">{{ f.v }}</span>
              </div>
            </div>

            <!-- 明细表 -->
            <table v-if="currentLayer.table" class="dm-table">
              <thead><tr><th v-for="(c, ci) in currentLayer.table.columns" :key="ci">{{ c }}</th></tr></thead>
              <tbody>
                <tr v-for="(row, ri) in currentLayer.table.rows" :key="ri">
                  <td v-for="(cell, cci) in row" :key="cci">{{ cell }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 建议穿透方向（提示性） -->
            <div v-if="currentLayer.suggestions && currentLayer.suggestions.length" class="dm-suggest">
              <div class="dm-suggest-title">💡 建议核查方向（可继续，非强制）</div>
              <ul><li v-for="(s, si) in currentLayer.suggestions" :key="si">{{ s }}</li></ul>
            </div>

            <!-- 继续穿透（AI建议路径节点） -->
            <div v-if="currentLayer.drilldowns && currentLayer.drilldowns.length" class="dm-drilldowns">
              <div class="dm-section-lbl">继续穿透</div>
              <div class="dm-dd-grid">
                <button v-for="(dd, ddi) in currentLayer.drilldowns" :key="ddi" class="dm-dbtn" @click="openDrill(dd.to)">
                  {{ dd.label }}<em v-if="dd.hint"> · {{ dd.hint }}</em> →
                </button>
              </div>
            </div>
          </div>

          <!-- 底部：核查处置操作（力度递进；点击后弹窗提示已下达） -->
          <div class="dm-foot">
            <div class="dm-foot-head">
              <span class="dm-foot-lbl">核查处置</span>
              <span class="dm-foot-flow">按处置力度递进：<b>留观</b> → <b>取证</b> → <b>核查</b> → <b>阻断</b></span>
            </div>
            <div class="dm-act-row">
              <button v-for="a in drillActions" :key="a.label" class="dm-act-btn" :class="a.tone" @click="doDrillAction(a)">
                <span class="dm-act-ico">{{ a.icon }}</span>
                <span class="dm-act-name">{{ a.label }}</span>
                <span class="dm-act-tag" :class="a.tone">{{ a.stage }}·{{ a.strength }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    <!-- ══════════ 核查处置·操作已下达 确认弹窗 ══════════ -->
    <div v-if="actionDone" class="ad-overlay" @click.self="actionDone = null">
      <div class="ad-card" :class="actionDone.tone">
        <div class="ad-ico">✓</div>
        <div class="ad-title">操作已下达</div>
        <div class="ad-action">
          <span class="ad-emoji">{{ actionDone.icon }}</span>{{ actionDone.label }}
          <em class="dm-act-tag" :class="actionDone.tone">{{ actionDone.stage }}·{{ actionDone.strength }}</em>
        </div>
        <div class="ad-effect">{{ actionDone.effect }}</div>
        <div class="ad-meta">承办：核查中心 · 状态：已下达待执行</div>
        <button class="ad-ok" @click="actionDone = null">确定</button>
      </div>
    </div>

    <!-- ===== Toast 提示 ===== -->
    <transition name="report-fade">
      <div v-if="toastVisible" class="prc-toast">{{ toastText }}</div>
    </transition>

    <!-- ══════════ AI 智能体分析步骤弹窗 ══════════ -->
    <transition name="agent-fade">
      <div v-if="aiAgentModal && viewMode !== 'risk-detail'" class="ai-agent-overlay" @click.self="closeAgentModal">
        <div class="ai-agent-modal">
          <div class="ai-agent-header">
            <div class="ai-agent-brain">
              <span class="ai-brain-core">🧠</span>
              <span class="ai-brain-pulse"></span>
            </div>
            <div class="ai-agent-title">
              <strong>AI 智能体 · 风险穿透分析</strong>
              <span>DRP Agent 正在执行多步推理…</span>
            </div>
          </div>
          <div class="ai-agent-body">
            <div v-for="(step, i) in aiAgentSteps" :key="i" class="ai-step" :class="`step-${step.status}`">
              <div class="ai-step-indicator">
                <span v-if="step.status === 'pending'" class="ai-step-dot"></span>
                <span v-else-if="step.status === 'running'" class="ai-step-spin"></span>
                <span v-else class="ai-step-check">✓</span>
              </div>
              <div class="ai-step-content">
                <span class="ai-step-text">{{ step.text }}</span>
                <span v-if="step.detail && step.status === 'done'" class="ai-step-detail">{{ step.detail }}</span>
              </div>
              <span v-if="step.status === 'running'" class="ai-step-time">{{ aiElapsed }}s</span>
            </div>
          </div>
          <div v-if="aiAgentComplete" class="ai-agent-footer">
            <template v-if="aiReportReady">
              <div class="ai-agent-result">
                <span class="ai-result-icon">✓</span>
                <span>分析完成，已生成风险报告</span>
              </div>
              <button class="ai-agent-btn" @click="goToRiskReport">查看分析报告 →</button>
            </template>
            <div v-else class="ai-agent-result" style="color:#7c3aed">
              <span class="ai-step-spin"></span>
              <span>正在生成报告数据，请稍候…</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick } from 'vue'
import axios from 'axios'
import EChart from '../components/EChart.vue'
import { layoutState, applyPreset } from '../layout.js'

// 布局重组：按模块 id 返回当前呈现状态类（页面完全按 layoutState 渲染）
function lm(id) {
  const m = layoutState.modules[id] || {}
  return { 'lm-emphasis': m.emphasis, 'lm-center': m.center, 'lm-faded': m.faded, 'lm-collapsed': m.collapsed }
}
const presetLabelMap = { fundFlowFocus: '资金/关联链路聚焦', supplierFocus: '供应商画像聚焦', relatedTopic: '关联专题视图', custom: '自定义布局' }
const presetLabel = computed(() => presetLabelMap[layoutState.preset] || layoutState.preset)

const props = defineProps({ period: { type: String, default: 'half' } })
const emit = defineEmits(['navigate'])
function goToDashboard(){ emit('navigate', 'dashboard'); if (typeof window !== 'undefined') window.location.hash = '#/dashboard' }

// ── State ──────────────────────────────────────────────────────────────────
const drawerOpen     = ref(false)
const drawerRisk     = ref(null)
const accordionOpen  = ref(new Set(['proc']))
const riskFilter     = ref('all')
const timePeriod     = computed(() => props.period)

// ── B1 十大风险域 ↔ B2 主体穿透网络 联动高亮 ──
const activeRiskDomain = ref('')
// 每个风险域涉及的网络主体节点（点击该域 → 中部网络高亮这些主体）
const riskDomainNodes = {
  '关联输送':   ['华东建设集团','鼎信建设有限公司','鼎信建设一公司','二号车间维修工程','王建国','王建军（王建国之弟）','鼎信物资贸易有限公司'],
  '围标串标':   ['恒通供应链管理有限公司','智能设备采购项目','鼎信建设一公司'],
  '单一来源滥用':['宏达建材公司','厂区管网改造'],
  '异常低价':   ['宏达建材公司','厂区管网改造'],
  '资质挂靠':   ['鼎信建设一公司','清源环保公司','排污治理项目'],
  '履约不符':   ['华东能源公司','华东仓储物流公司','仓储建设项目'],
  '融资性贸易': ['恒通供应链管理有限公司','鼎信物资贸易有限公司'],
  '空转走单':   ['华东仓储物流公司','仓储建设项目','鼎信物资贸易有限公司'],
  '应招未招':   ['华建工程监理公司','厂区安防改造项目'],
  '化整为零':   ['华建科技公司','智慧园区信息系统'],
}
function onRiskDomainClick(params) {
  const label = params?.name || params?.data?.label || ''
  if (!label || !(label in riskDomainNodes)) return
  // 关联输送 = 故事线一入口：写穿透上下文、高亮红链、定位 CG-2026001
  if (label === '关联输送') {
    if (penetrationContext.active && penetrationContext.riskDomain === 'related_transfer') {
      resetPenetration()
    } else {
      activateRelatedTransfer('riskDomain')
    }
    return
  }
  activeRiskDomain.value = activeRiskDomain.value === label ? '' : label
}
function clearRiskDomain() { activeRiskDomain.value = ''; if (penetrationContext.riskDomain === 'related_transfer') resetPenetration() }

// ══════════ 故事线一：关联输送穿透底座 ══════════
// 穿透上下文：任一模块/任一穿透层触发时写入它，其余模块据此高亮/重算/定位
const penetrationContext = reactive({
  active: false,
  riskDomain: null,      // 'related_transfer'
  highlightNodes: [],    // 网络图要高亮的节点 name 集合
  focusOrderId: null,    // 'CG-2026001'
  source: null,          // 'riskDomain' | 'realtime' | 'drill'
})
const focusOrderId = ref('')   // 右栏高亮定位的单据编号

// 激活关联输送故事线（点「关联输送」域 或 点 CG-2026001「AI研判」）
function activateRelatedTransfer(source) {
  Object.assign(penetrationContext, {
    active: true,
    riskDomain: 'related_transfer',
    highlightNodes: [...storyChainNodes],
    focusOrderId: 'CG-2026001',
    source,
  })
  activeRiskDomain.value = '关联输送'
  focusOrderId.value = 'CG-2026001'
  // 右栏定位滚动到焦点卡片
  nextTick(() => {
    const el = typeof document !== 'undefined' && document.querySelector('.risk-card.story-focus')
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// 恢复默认：清空穿透栈与上下文，三栏复位
function resetPenetration() {
  Object.assign(penetrationContext, { active: false, riskDomain: null, highlightNodes: [], focusOrderId: null, source: null })
  activeRiskDomain.value = ''
  focusOrderId.value = ''
  drillStack.value = []
  selectedPlan.value = ''
  executionVisible.value = []
  if (execTimer) { clearTimeout(execTimer); execTimer = null }
  assistantSupplierHl.value = false
}

// ══════════ 故事线二：复合风险联查（围标串标 + 履约不符 → 恒通供应链） ══════════
// 点击穿透驱动：热力图深红格(设备采购×询价采购) → TOP6 恒通高亮 → 点恒通并案两条实时风险 → AI 研判 → A/B/C → 选A 回执
const STORY2_HEAT = { mi: 3, ci: 2 }   // 询价采购(列idx3) × 设备采购(行idx2)
const STORY2_ORDERS = ['CG-2026005', 'CG-2026041']
// 故事线二联动中部穿透网络要高亮的节点（与 netNodes 实名一致）
// 仅高亮「恒通供应链 → 智能设备采购项目」2 个节点（由红色围标承接链相连）：
// 既聚焦本案两个核心主体、避免与故事线一共用「华东建设集团」造成高亮冲突，也不再闪烁第三个节点。
const STORY2_NET_NODES = ['恒通供应链管理有限公司', '智能设备采购项目']
const story2 = reactive({ heatHl: false, supplierHl: false, clueOpen: false })
const story2PanelOpen = ref(false)     // AI 研判面板弹窗
const story2AdviceLoading = ref(false) // 点「AI 建议」加载中
const story2AdviceReady = ref(false)   // A/B/C 三方案已生成
const story2CompareOpen = ref(false)   // 三方案对比弹窗
const story2ResultOpen = ref(false)    // 选中方案后自动弹出·实施回执
const story2Plan = ref('')             // 选中方案 A/B/C
const story2BasisKey = ref('')         // 展开「查看依据」的方案
const story2ExecVisible = ref([])      // 选A 后逐条揭示的回执
let story2ExecTimer = null
let story2AdviceTimer = null
// 研判面板固定文案（§6 自洽假数据；执行仅前端模拟、不接后端、不落库）
const story2Judge = {
  supplier: '恒通供应链管理有限公司', amount: '¥320万', score: 62, flags: 8,
  rings: [
    { k: '依据', v: '中标集中度异常 + 3 家投标单位报价规律；同源制单：投标文件雷同度 92%、报价固定差 1.5%、保证金同一账户、同一 MAC 地址上传。' },
    { k: '风险与项目', v: '围标串标 + 履约不符（复合）；定位「智能设备采购项目」(¥280万) 与「三号厂房改造工程」(¥40万)。' },
    { k: '单据 · 责任人', v: 'CG-2026005 经办孙磊（采购部，期限 05-25）+ 评标专家 3 人；CG-2026041 经办马涛（工程部），交付以次充好 / 工程量缺口约 18%、验收却判合格并已付款。' },
    { k: '建议', v: '废标重招 + 暂停投标资格 + 追回扣款并重新验收 + 启动专项核查。' },
    { k: '协调', v: '招投标办 + 纪检牵头、财务冻结、评标专家库复核。' },
    { k: '理由', v: '串标抬价损害公平竞争，复合违规涉 ¥320万 且供应商健康评分仅 62。' },
  ],
  items: [
    { no: 'CG-2026005', type: '围标串标', proj: '智能设备采购项目', amount: '¥280万', handler: '孙磊（采购部）', extra: '评标专家 3 人 · 投标 3 家 · 文件雷同度 92% · 报价固定差 1.5% · 同一账户 / 同一 MAC' },
    { no: 'CG-2026041', type: '履约不符', proj: '三号厂房改造工程', amount: '¥40万', handler: '马涛（工程部）', extra: '交付：钢材以次充好(Q345B→Q235) · 工程量缺口约 18% · 验收判合格并已全额付款' },
  ],
  plans: [
    { key: 'A', label: '废标重招 + 立案', recommended: true, impact: '3 家投标单位暂停投标资格；CG-2026005 废标待重招；CG-2026041 ¥40万 追回扣款并重新验收整改；移交纪检立案。',
      basis: '报价曲线高度趋同（固定差 1.5%）、同类判例已认定串标、供应商风险趋势上升（评分 62 / 8 标记）。' },
    { key: 'B', label: '保留结果但强化履约监管', recommended: false, impact: '暂留中标结果，加挂履约保证金与过程审计；资金按节点放行、保留追溯。',
      basis: '若履约确可控可暂留结果——本例评分偏低、证据较充分，需谨慎。' },
    { key: 'C', label: '约谈限期补正', recommended: false, impact: '约谈经办与供应商，限期补齐验收与披露材料后再议。',
      basis: '适用于轻微瑕疵；本例为复合违规、证据已较充分，不建议仅补正。' },
  ],
  exec: [
    '招标平台将 3 家投标单位置为「暂停投标」，CG-2026005 标记「废标待重招」。',
    '生成《围标串标核查任务》附证据链（工商 / 报价 / IP·MAC 三类），派发纪检 + 招投标办。',
    '对 CG-2026041 已付 ¥40万 启动追回 / 扣款并组织第三方复检与重新验收整改，向马涛推送，到期未回执自动升级上级监管。',
  ],
}
// 三方案对比数表（数据依本案 CG-2026005/CG-2026041 演进；tone：good 有利 / warn 权衡 / bad 不利）
const story2CompareCols = [
  { key: 'A', name: '废标重招 + 立案', tag: '推荐' },
  { key: 'B', name: '保留结果强化监管', tag: '谨慎' },
  { key: 'C', name: '约谈限期补正', tag: '不建议' },
]
const story2CompareRows = [
  { dim: '围标处置', A: { v: '废标重招 + 3家暂停投标', tone: 'good' }, B: { v: '保留中标结果', tone: 'bad' }, C: { v: '仅约谈、结果不变', tone: 'bad' } },
  { dim: '资金处置(¥40万)', A: { v: '追回扣款 + 重新验收', tone: 'good' }, B: { v: '扣保证金后放行', tone: 'warn' }, C: { v: '限期整改后核付', tone: 'warn' } },
  { dim: '涉案金额覆盖', A: { v: '¥320万 全覆盖', tone: 'good' }, B: { v: '仅 ¥40万', tone: 'warn' }, C: { v: '基本未覆盖', tone: 'bad' } },
  { dim: '公平竞争修复', A: { v: '恢复公开竞争', tone: 'good' }, B: { v: '存疑、受损未修复', tone: 'bad' }, C: { v: '仍受损', tone: 'bad' } },
  { dim: '供应商(评分62)', A: { v: '暂停准入 + 立案', tone: 'good' }, B: { v: '加保证金留用', tone: 'warn' }, C: { v: '约谈警示', tone: 'warn' } },
  { dim: '纪检介入', A: { v: '立案移交', tone: 'good' }, B: { v: '不介入', tone: 'warn' }, C: { v: '不介入', tone: 'warn' } },
  { dim: '处置时效', A: { v: '即时生效', tone: 'good' }, B: { v: '约 5 个工作日', tone: 'warn' }, C: { v: '限期补正周期长', tone: 'bad' } },
  { dim: '业务影响', A: { v: '采购周期延后约 2 周', tone: 'warn' }, B: { v: '影响小', tone: 'good' }, C: { v: '影响小', tone: 'good' } },
  { dim: '风险残留', A: { v: '低', tone: 'good' }, B: { v: '中', tone: 'warn' }, C: { v: '高', tone: 'bad' } },
]
// 三方案结果推演·四类指标随处置周期演化（点对比弹窗的指标模块切换图表）
// A 废标重招+立案（强处置）/ B 保留结果强化监管（中）/ C 约谈限期补正（弱）
const STORY2_TREND_TL = ['处置前', 'T+3天', 'T+1周', 'T+2周', 'T+4周', 'T+8周']
const story2Metrics = [
  { key:'fund', label:'采购资金敞口', icon:'💰', unit:'万', better:'low', desc:'涉案/在途资金敞口随处置推进的变化（越低越好）',
    series:{ A:[320,120,40,10,0,0], B:[320,280,210,150,110,90], C:[320,318,305,290,275,255] },
    insight:'方案A 经止付追回 + 废标，T+4周 将 ¥320万 敞口清零；方案C 几乎不动，T+8周 仍占压 ¥255万。' },
  { key:'risk', label:'复合风险指数', icon:'⚠️', unit:'', better:'low', desc:'围标串标 + 履约不符复合风险指数 0–100（越低越好）',
    series:{ A:[88,66,42,24,13,7], B:[88,80,68,56,47,42], C:[88,86,82,79,76,73] },
    insight:'方案A 处置后风险快速回落至 7；方案B 收敛有限、稳于 42；方案C 长期高位（>70），隐患未除。' },
  { key:'loss', label:'累计预计损失', icon:'📉', unit:'万', better:'low', desc:'累计已发生 + 预计损失（越低越好）',
    series:{ A:[0,6,9,11,12,12], B:[0,18,38,58,74,84], C:[0,32,72,116,156,196] },
    insight:'方案A 把损失锁定在 ¥12万；方案C 损失持续扩大至 ¥196万，约为方案A 的 16 倍。' },
  { key:'sla', label:'处置闭环进度', icon:'⏱', unit:'%', better:'high', desc:'响应时效·处置闭环完成度（越快越好）',
    series:{ A:[0,62,86,96,100,100], B:[0,30,50,70,86,96], C:[0,12,26,42,56,70] },
    insight:'方案A T+4周 即达成 100% 闭环；方案B 需至 T+8周 近闭环；方案C 进度迟缓，T+8周 仅 70%。' },
]
const story2ChartMetric = ref('fund')
const story2ChartData = computed(() => story2Metrics.find(m => m.key === story2ChartMetric.value) || story2Metrics[0])
const story2TrendCols = [
  { key:'A', name:'方案A · 废标重招+立案', color:'#10B981', area:true,  dash:false },
  { key:'B', name:'方案B · 保留强化监管', color:'#F59E0B', area:false, dash:false },
  { key:'C', name:'方案C · 约谈限期补正', color:'#EF4444', area:false, dash:true  },
]
// 三方案结果推演图通用构造器（资金/风险/损失/时效；A 绿实心面积·B 橙·C 红虚线）
function makeTrendOption(m, cols, timeline) {
  const u = m.unit
  return {
    animation:true, animationDuration:650, animationEasing:'cubicOut', backgroundColor:'transparent',
    tooltip:{ trigger:'axis', backgroundColor:'rgba(255,255,255,0.98)', borderColor:'#E2E8F0',
      textStyle:{ color:'#334155', fontSize:11 }, extraCssText:'box-shadow:0 6px 24px rgba(15,23,42,0.12)',
      valueFormatter:(v)=> (v==null?'-':`${v}${u}`) },
    legend:{ top:0, icon:'roundRect', itemWidth:16, itemHeight:7, itemGap:14,
      textStyle:{ color:'#64748B', fontSize:10.5 }, data:cols.map(c=>c.name) },
    grid:{ left:6, right:46, top:38, bottom:6, containLabel:true },
    xAxis:{ type:'category', boundaryGap:false, data:timeline,
      axisLabel:{ color:'#64748B', fontSize:10 }, axisLine:{ lineStyle:{ color:'#E2E8F0' } }, axisTick:{ show:false } },
    yAxis:{ type:'value', name:u?`(${u})`:'', nameTextStyle:{ color:'#94A3B8', fontSize:9, align:'right' },
      axisLabel:{ color:'#94A3B8', fontSize:9 }, axisLine:{ show:false }, axisTick:{ show:false },
      splitLine:{ lineStyle:{ color:'#F1F5F9', type:'dashed' } } },
    series: cols.map(c => ({
      name:c.name, type:'line', smooth:true, symbol:'circle', symbolSize: c.key==='A'?7:5,
      data:m.series[c.key], z: c.key==='A'?4:2,
      lineStyle:{ width: c.key==='A'?3.4:2, color:c.color, type: c.dash?'dashed':'solid',
        shadowColor: c.key==='A'?'rgba(16,185,129,0.35)':'transparent', shadowBlur: c.key==='A'?8:0 },
      itemStyle:{ color:c.color, borderColor:'#fff', borderWidth:1 },
      areaStyle: c.area ? { color:{ type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[
        { offset:0, color:'rgba(16,185,129,0.24)' }, { offset:1, color:'rgba(16,185,129,0.02)' } ] } } : undefined,
      endLabel:{ show:true, formatter:(p)=>`${p.value}${u}`, color:c.color, fontSize:10.5, fontWeight:800,
        distance:6, backgroundColor:'rgba(255,255,255,0.85)', padding:[1,3], borderRadius:3 },
      emphasis:{ focus:'series', lineStyle:{ width: c.key==='A'?4:2.6 } },
    })),
  }
}
const story2TrendOption = computed(() => makeTrendOption(story2ChartData.value, story2TrendCols, STORY2_TREND_TL))

// 故事线一（CG-2026001 关联输送）三方案结果推演·四类指标（A 立即止付+冻结 / B 保留付款约谈 / C 不干预）
const PLAN_TREND_TL = ['处置前', 'T+1天', 'T+3天', 'T+1周', 'T+2周', 'T+4周']
const planMetrics = [
  { key:'fund', label:'资金敞口', icon:'💰', unit:'万', better:'low', desc:'¥40万待付 + ¥360万在途关联敞口随处置的变化（越低越好）',
    series:{ A:[400,150,60,20,5,0], B:[400,360,300,250,210,180], C:[400,398,395,392,388,384] },
    insight:'方案A 当日止付 ¥40万 并阻断在途关联敞口，T+4周 清零；方案C 不干预，¥384万 敞口长期存续。' },
  { key:'risk', label:'关联风险指数', icon:'⚠️', unit:'', better:'low', desc:'关联输送·未验收付款风险指数 0–100（越低越好）',
    series:{ A:[86,60,40,24,13,6], B:[86,78,66,55,46,41], C:[86,85,83,81,79,77] },
    insight:'方案A 处置后风险快速回落至 6；方案B 稳于 41；方案C 长期高位（>76），关联输送隐患未除。' },
  { key:'loss', label:'累计预计损失', icon:'📉', unit:'万', better:'low', desc:'累计已发生 + 预计损失（越低越好）',
    series:{ A:[0,3,6,8,10,10], B:[0,14,30,48,64,76], C:[0,38,86,144,202,262] },
    insight:'方案A 把损失锁定在 ¥10万；方案C 因放任关联输送，损失扩大至 ¥262万。' },
  { key:'sla', label:'处置闭环进度', icon:'⏱', unit:'%', better:'high', desc:'响应时效·处置闭环完成度（越快越好）',
    series:{ A:[0,68,90,98,100,100], B:[0,26,46,66,84,95], C:[0,8,20,36,52,66] },
    insight:'方案A 当日即响应止付、T+2周 闭环；方案C 进度迟缓，T+4周 仅 66%。' },
]
const planChartMetric = ref('fund')
const planChartData = computed(() => planMetrics.find(m => m.key === planChartMetric.value) || planMetrics[0])
const planTrendCols = [
  { key:'A', name:'方案A · 立即止付+冻结', color:'#10B981', area:true,  dash:false },
  { key:'B', name:'方案B · 保留付款+约谈', color:'#F59E0B', area:false, dash:false },
  { key:'C', name:'方案C · 不干预',       color:'#EF4444', area:false, dash:true  },
]
const planTrendOption = computed(() => makeTrendOption(planChartData.value, planTrendCols, PLAN_TREND_TL))
// 选中方案后弹窗渲染的结果（A 走逐条实施回执；B/C 给要点）
const story2PlanResults = {
  A: { tone: 'block', status: '处置中 · 待闭环', receipts: story2Judge.exec,
    closing: '处置闭环已启动；待纪检 + 招投标办核查回执确认后转「已闭环」。' },
  B: { tone: 'route', status: '留用 · 强化监管', receipts: [
      '中标结果暂予保留，加挂履约保证金并启动全过程审计跟踪。',
      'CG-2026041 履约偏差挂账并扣减履约保证金，整改重验合格后再核付尾款。',
      '将恒通供应链列入重点监控，评分回升至 75 前不予新单准入。' ],
    closing: '保留结果但强化监管；如审计发现履约异常即升级为废标处置。' },
  C: { tone: 'watch', status: '约谈 · 待补正', receipts: [
      '约谈恒通供应链与经办孙磊 / 马涛，下达限期补正通知。',
      '要求补齐履约整改、第三方复检与报价说明，期限 5 个工作日。',
      '列入观察名单，逾期未补正自动升级核查。' ],
    closing: '本例为复合违规、证据较充分，仅补正风险残留偏高，建议审慎采用。' },
}
const story2CurrentResult = computed(() => story2Plan.value ? story2PlanResults[story2Plan.value] : null)
function clearStory2Exec() { if (story2ExecTimer) { clearTimeout(story2ExecTimer); story2ExecTimer = null } }
function clearStory2Advice() { if (story2AdviceTimer) { clearTimeout(story2AdviceTimer); story2AdviceTimer = null } }
// 步① 点热力图深红格：提示供应商高度集中 → 步② 定位并高亮 TOP6 恒通 + 联动中部网络
function onHeatmapClick(params) {
  const v = params?.value || params?.data
  if (!Array.isArray(v) || v[0] !== STORY2_HEAT.mi || v[1] !== STORY2_HEAT.ci) return
  story2.heatHl = true
  story2.supplierHl = true
  nextTick(() => { const el = document.querySelector('.sup-side-row.story2-hl'); if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
}
// 步③ 点恒通行：并案拉起两条实时风险，成一条复合风险线索 + 联动中部穿透网络高亮
function onSupplierRowClick(s) {
  if (!s?.story2) return
  story2.supplierHl = true
  story2.clueOpen = true   // → darkNetworkOption 据此高亮 STORY2_NET_NODES（中部网络联动）
  nextTick(() => { const el = document.querySelector('.risk-card.story2-focus'); if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
}
// 对话联动：小助手触发故事线二（联动热力图/TOP6/实时风险/中部网络）
function startStory2FromAssistant() {
  story2.heatHl = true; story2.supplierHl = true; story2.clueOpen = true
  nextTick(() => { const el = document.querySelector('.risk-card.story2-focus') || document.querySelector('.sup-side-row.story2-hl'); if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
}
// 步④ 打开复合风险 AI 研判面板（初始仅出研判，A/B/C 需点「AI 建议」再加载）
function openStory2Panel() {
  story2PanelOpen.value = true
  story2AdviceReady.value = false; story2AdviceLoading.value = false
  story2Plan.value = ''; story2BasisKey.value = ''; story2ExecVisible.value = []
  story2CompareOpen.value = false; story2ResultOpen.value = false
  clearStory2Exec(); clearStory2Advice()
}
// 点「AI 建议」→ 加载动画 → 生成 A/B/C
function story2AskAdvice() {
  if (story2AdviceReady.value || story2AdviceLoading.value) return
  story2AdviceLoading.value = true
  clearStory2Advice()
  story2AdviceTimer = setTimeout(() => { story2AdviceLoading.value = false; story2AdviceReady.value = true }, 1200)
}
function toggleStory2Basis(k) { story2BasisKey.value = story2BasisKey.value === k ? '' : k }
// 步⑤ 人选方案 → 自动弹出处置结果弹窗，逐条渲染 AI 实施回执（仅前端模拟）
function chooseStory2Plan(key) {
  story2Plan.value = key
  story2ResultOpen.value = true   // 选中后自动弹窗
  story2ExecVisible.value = []
  clearStory2Exec()
  const res = story2PlanResults[key]
  const steps = res ? res.receipts : []
  let i = 0
  const tick = () => { if (i >= steps.length) return; story2ExecVisible.value = [...story2ExecVisible.value, steps[i]]; i++; story2ExecTimer = setTimeout(tick, 800) }
  tick()
}
const story2ExecDone = computed(() => !!story2CurrentResult.value && story2ExecVisible.value.length === story2CurrentResult.value.receipts.length)
function resetStory2() {
  story2.heatHl = false; story2.supplierHl = false; story2.clueOpen = false
  story2PanelOpen.value = false; story2AdviceLoading.value = false; story2AdviceReady.value = false
  story2CompareOpen.value = false; story2ResultOpen.value = false
  story2Plan.value = ''; story2BasisKey.value = ''; story2ExecVisible.value = []
  clearStory2Exec(); clearStory2Advice()
  routeClueOpen.value = false
}

// ── 两类穿透概览 ↔ 路线①②③ 数据对应（点击穿透联动 + 弹窗） ──
const routeClueOpen = ref(false)
const routeClueKey = ref('')
const ROUTE_CLUE = {
  '1': { tag: '关联输送', cn: '①', name: '关联输送穿透（点击式）', tone: 'rt',
    sub: 'CG-2026001 · 鼎信建设一公司 · 未验收即付款 ¥40万',
    chain: ['华东建设集团 → 鼎信建设有限公司 → 鼎信建设一公司 → 二号车间维修工程', '王建国实控（持股65% + 代持）· 近6月资金回流 ¥120万/3笔', '验收单 YS-2026-0312 缺失，未验收即申请付款'],
    fund: '¥40万 待付（验收凭证缺失）', resp: '经办 张伟 / 审批 李强（关联未披露）',
    cta: '联动网络图 + 定位实时风险' },
  '2': { tag: '复合风险', cn: '②', name: '复合风险研判（点击式）', tone: 's2',
    sub: 'CG-2026005 + CG-2026041 · 恒通供应链 · 围标串标 + 履约不符 ¥320万',
    chain: ['华东建设集团 → 恒通供应链管理有限公司 → 智能设备采购项目', '3 家同源投标（同 IP 116.62.45.21 / 同 MAC）· 报价固定差 1.5%', '三号厂房改造工程 交付以次充好 / 工程量缺口约 18%，验收却判合格并已付款'],
    fund: '¥280万 中标待废 + ¥40万 已付待追', resp: '经办 孙磊 / 马涛 · 评标专家 3 人',
    cta: '打开复合风险 AI 研判面板' },
  '3': { tag: '对话研判', cn: '③', name: '对话式研判（AI 小助手）', tone: 'r3',
    sub: 'CG-2026001 · 经 AI 小助手逐环对话穿透',
    chain: ['依据 → 风险与项目 → 单据·责任人 → 建议·协调·理由', '12 环对话穿透 · A/B/C 处置方案', '定标审批：关联关系未要求披露（审批 李强）'],
    fund: '¥40万 待付', resp: '经办 张伟 / 审批 李强',
    cta: '用 AI 对话研判' },
}
const routeClueData = computed(() => ROUTE_CLUE[routeClueKey.value] || null)
function routeCn(r) { return ({ '1': '①', '2': '②', '3': '③' })[r] || r }
// 点击 两类穿透概览 中的「路线」条目 → 打开联动弹窗 + 中部网络高亮
function openRouteClue(key) {
  routeClueKey.value = key
  routeClueOpen.value = true
  if (key === '1') activateRelatedTransfer('drill')
  else if (key === '2') { story2.heatHl = true; story2.supplierHl = true; story2.clueOpen = true }
  else if (key === '3') { activeRiskDomain.value = '关联输送'; activateRelatedTransfer('drill') }
}
// 弹窗内主操作：跳到对应路线的处置入口
function runRouteClue() {
  const k = routeClueKey.value
  routeClueOpen.value = false
  if (k === '1') {
    activateRelatedTransfer('drill')
    nextTick(() => { const el = document.querySelector('.b2-panel'); if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
  } else if (k === '2') {
    startStory2FromAssistant(); openStory2Panel()
  } else if (k === '3') {
    try { window.dispatchEvent(new CustomEvent('drp-open-assistant', { detail: { text: '第一条未验收付款，说说依据' } })) } catch {}
  }
}

// ── AI 小助手 ↔ 页面组件联动：小助手研判时高亮页面对应模块 ──
const assistantSupplierHl = ref(false)   // 供应商画像 → 高亮鼎信建设一公司行（CG-2026001 供应商）
let supplierHlTimer = null
function onAssistantFocus(e) {
  const key = e?.detail?.key
  if (!key) return
  if (key === 'reset') { resetPenetration(); resetStory2(); return }
  // 故事线二：对话联动复合风险（含中部穿透网络）；story2_panel 额外打开研判面板
  if (key === 'story2' || key === 'story2_panel') {
    startStory2FromAssistant()
    if (key === 'story2_panel') openStory2Panel()
    return
  }
  if (key === 'supplier') {
    assistantSupplierHl.value = true
    nextTick(() => { const el = document.querySelector('.sup-side-row.assistant-hl'); if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
    if (supplierHlTimer) clearTimeout(supplierHlTimer)
    supplierHlTimer = setTimeout(() => { assistantSupplierHl.value = false }, 6000)
    return
  }
  // report / evidence / aggregate / plan / receipts → 点亮三栏联动 + 定位 CG-2026001
  activateRelatedTransfer('assistant')
}
// 对话「展开两类穿透概览」→ 展开 c1 手风琴内容
function onModuleCmd(e) {
  if (e?.detail?.expandPenet) {
    // 展开两类穿透概览的全部分组与子项，并滚动到可视区，确保变化明显
    penetOpen.value = new Set(['capital', 'resp', 'bid', 'accept', 'approval'])
    nextTick(() => { const el = document.querySelector('.c1-panel'); if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
  }
}
// 小助手「采购高风险有哪些」→ 高亮闪烁实时采购风险列表（闪 5 下）
const riskListFlash = ref(false)
let riskFlashTimer = null
function onFlashRiskList() {
  // 确保该模块可见（若被布局指令折叠/淡化，先复位）
  const b3 = layoutState.modules?.b3
  if (b3 && (b3.collapsed || b3.faded)) { b3.collapsed = false; b3.faded = false }
  if (riskFlashTimer) { clearTimeout(riskFlashTimer); riskFlashTimer = null }
  riskListFlash.value = false   // 先复位，便于连续触发重放动画
  nextTick(() => {
    riskListFlash.value = true
    const el = document.querySelector('.b3-panel')
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    riskFlashTimer = setTimeout(() => { riskListFlash.value = false }, 2700)  // 5 次 × 0.5s + 余量
  })
}
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('drp-assistant-focus', onAssistantFocus)
    window.addEventListener('drp-module-cmd', onModuleCmd)
    window.addEventListener('drp-flash-risklist', onFlashRiskList)
  }
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') { window.removeEventListener('drp-assistant-focus', onAssistantFocus); window.removeEventListener('drp-module-cmd', onModuleCmd); window.removeEventListener('drp-flash-risklist', onFlashRiskList) }
  if (supplierHlTimer) clearTimeout(supplierHlTimer)
  if (riskFlashTimer) clearTimeout(riskFlashTimer)
  clearStory2Exec(); clearStory2Advice()
})

// ── 报告后穿透：穿透栈 + 面包屑 ──
// 穿透层统一结构：{ kind, type, title, badge?, summary, fields?, table?, suggestions?, drilldowns?, srcReal }
//  - 真实实体（从后台报告字段动态生成）走 liveLayerFor，srcReal=true，无明细时只给"建议方向"；
//  - AI 建议路径（故事线剧情）走 penetrationGraph，srcReal=false，明确标注"供参考"。
// 二者共用同一套渲染，互不写死覆盖。
const drillStack = ref([])
const drillNodes = computed(() => drillStack.value)
const drillModalOpen = ref(false)                                   // 穿透以弹窗形式展示
const drillPanelOpen = ref(false)                                   // 关联穿透浮层（页面1/3）
const currentLayer = computed(() => drillStack.value[drillStack.value.length - 1] || null)

// graphKey → 网络图节点名（剧情节点联动网络高亮用）
const penetGraphNodeName = {
  group: '华东建设集团', dingxin: '鼎信建设有限公司', dingxin1: '鼎信建设一公司',
  proj: '二号车间维修工程', wang: '王建国', wangj: '王建军（王建国之弟）', trade: '鼎信物资贸易有限公司',
}
function applyDrillContext(ctx) {
  if (!ctx) return
  const names = (ctx.highlightChain || []).map(k => penetGraphNodeName[k]).filter(Boolean)
  Object.assign(penetrationContext, {
    active: true,
    riskDomain: ctx.riskDomain || penetrationContext.riskDomain || 'related_transfer',
    highlightNodes: names.length ? names : penetrationContext.highlightNodes,
    focusOrderId: ctx.focusOrderId || penetrationContext.focusOrderId,
    source: 'drill',
  })
  activeRiskDomain.value = '关联输送'
  if (ctx.focusOrderId) focusOrderId.value = ctx.focusOrderId
}
// openDrill 既接 AI建议路径(字符串=penetrationGraph key) 也接真实实体(对象)
function openDrill(arg) {
  if (!drillStack.value.length) cameFromEntityModal.value = false   // 顶层新穿透默认非来自放大图（嵌套穿透保留来源标记）
  if (typeof arg === 'string') {
    const g = penetrationGraph[arg]
    if (!g) return
    drillStack.value.push({ kind: 'advice', key: arg, srcReal: false, ...g })
    applyDrillContext(g.context)
  } else if (arg && typeof arg === 'object') {
    drillStack.value.push(liveLayerFor(arg))
  } else return
  drillModalOpen.value = true
}
function drillTo(index) { drillStack.value = drillStack.value.slice(0, index + 1) }
function backOneLevel() { drillStack.value.pop(); if (!drillStack.value.length) drillModalOpen.value = false }
function backToReport() {
  drillStack.value = []; drillModalOpen.value = false
  // 若本次穿透是从「涉及对象放大图」进入，则回退到放大图，而非直接回报告
  if (cameFromEntityModal.value) { cameFromEntityModal.value = false; entityModalOpen.value = true }
}
function closeDrillModal() { drillModalOpen.value = false; drillStack.value = []; cameFromEntityModal.value = false }

// 从真实报告字段动态构造穿透层；无真实明细时只给"建议穿透方向"，绝不写死假数据
function liveLayerFor(ent) {
  const a = activeRisk.value || {}
  const secs = reportSections.value || {}
  const money = a.amount ? ('¥' + a.amount + (a.amountUnit || '')) : '—'
  if (ent.kind === 'risk') {
    return { kind:'live', type:'风险', srcReal:true, title: ent.label, badge: riskLevelLabel[a.level] || '',
      summary: secs.risk_definition?.content || a.summary || '本单风险定义。',
      fields: (secs.cause_analysis?.items || []).map(it => ({ k: it.label, v: it.content })),
      suggestions: ['可继续查看「计算逻辑 / 原因分析」作为佐证', '可穿透涉及主体与责任人核实关联关系'] }
  }
  if (ent.kind === 'person') {
    return { kind:'live', type:'责任人', srcReal:true, title: ent.label,
      summary: '本单相关责任人，可核查其经办 / 审批行为。',
      fields: [ { k:'关联单据', v:a.no }, { k:'整改期限', v:a.deadline||'—' }, { k:'当前状态', v:a.status||'—' } ],
      suggestions: ['可核查其经办单据的供应商集中度是否异常', '可核查其审批通过率与回避执行情况'] }
  }
  if (ent.kind === 'subject') {
    const rows = (a.table_rows || []).filter(r => JSON.stringify(r).includes(ent.label))
    return { kind:'live', type:'涉及主体', srcReal: rows.length > 0, title: ent.label,
      summary: rows.length ? '报告内可关联到的明细如下。' : '报告涉及主体（报告未含更细数据，以下为建议核查方向）。',
      fields: [ { k:'涉及单据', v:a.no }, { k:'涉及金额', v: money } ],
      table: rows.length ? { columns: Object.keys(rows[0]), rows: rows.map(r => Object.values(r)) } : null,
      suggestions: ['可核查该主体工商登记与股权 / 实控关系', '可核查与该主体的资金往来流水', '可核查其投标记录是否同源'] }
  }
  if (ent.kind === 'doc') {
    return { kind:'live', type: ent.type || '单据', srcReal:true, title: ent.label, badge: ent.domain,
      summary: ent.domain ? (ent.domain + ' · 关联单据穿透') : '关联单据穿透。',
      fields: [ { k:'编号', v: ent.label }, { k:'所属域', v: ent.domain || '—' }, { k:'关联金额', v: money }, { k:'当前状态', v: a.status || '—' } ],
      suggestions: ['可核对该单据与合同约定 / 付款节点是否匹配', '可核查审批、验收记录是否齐全'] }
  }
  return { kind:'live', type:'实体', srcReal:false, title: ent.label || '实体', summary:'', fields:[], suggestions:[] }
}

// ── 穿透弹窗里的可视化图表（按层动态生成 ECharts 配置；无可视数据则返回 null 只展示表单/表格） ──
function mkBar(cats, vals, name, color) {
  return {
    animation:false, backgroundColor:'transparent',
    grid:{ left:8, right:14, top:30, bottom:6, containLabel:true },
    tooltip:{ trigger:'axis', axisPointer:{ type:'shadow' } },
    title:{ text:name, left:0, top:0, textStyle:{ fontSize:11, color:'#64748B', fontWeight:600 } },
    xAxis:{ type:'category', data:cats, axisLabel:{ color:'#64748B', fontSize:10 }, axisLine:{ lineStyle:{ color:'#E2E8F0' } }, axisTick:{ show:false } },
    yAxis:{ type:'value', axisLabel:{ color:'#94A3B8', fontSize:10 }, splitLine:{ lineStyle:{ color:'#F1F5F9' } } },
    series:[{ type:'bar', barMaxWidth:34, data:vals, itemStyle:{ color, borderRadius:[4,4,0,0] },
      label:{ show:true, position:'top', fontSize:10, color:'#475569' } }],
  }
}
function mkGauge(val, name, max, color) {
  return {
    animation:false, backgroundColor:'transparent',
    series:[{ type:'gauge', min:0, max:max||100, radius:'92%', center:['50%','58%'],
      progress:{ show:true, width:12, itemStyle:{ color } },
      axisLine:{ lineStyle:{ width:12, color:[[1,'#EEF2F7']] } },
      axisTick:{ show:false }, splitLine:{ show:false }, axisLabel:{ show:false }, pointer:{ show:false },
      anchor:{ show:false },
      detail:{ valueAnimation:false, fontSize:22, fontWeight:800, color, offsetCenter:[0,'5%'], formatter:'{value}' },
      title:{ offsetCenter:[0,'34%'], fontSize:11, color:'#64748B' },
      data:[{ value:val, name }] }],
  }
}
function mkPie(data, name) {
  return {
    animation:false, backgroundColor:'transparent',
    title:{ text:name, left:0, top:0, textStyle:{ fontSize:11, color:'#64748B', fontWeight:600 } },
    tooltip:{ trigger:'item' },
    series:[{ type:'pie', radius:['38%','66%'], center:['50%','58%'], avoidLabelOverlap:true,
      label:{ fontSize:10, color:'#475569' },
      data: data.map((d,i)=>({ ...d, itemStyle:{ color:['#DC2626','#F59E0B','#3B82F6','#10B981'][i%4] } })) }],
  }
}
// 尝试从真实表格里取一个数值列做柱状图（live 实体兜底可视化）
function barFromTable(tbl) {
  if (!tbl || !tbl.rows?.length) return null
  const cols = tbl.columns || []
  for (let c = 0; c < cols.length; c++) {
    const nums = tbl.rows.map(r => { const m = String(r[c]).match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null })
    if (nums.every(n => n !== null) && nums.some(n => n > 0)) {
      const labelCol = c === 0 ? (cols.length > 1 ? 1 : 0) : 0
      return mkBar(tbl.rows.map(r => String(r[labelCol]).slice(0,8)), nums, cols[c], '#7C3AED')
    }
  }
  return null
}
const currentChart = computed(() => {
  const l = currentLayer.value
  if (!l) return null
  switch (l.key) {
    case 'evidence_fund':        return mkBar(['03-12','04-08','05-06'], [45,38,37], '资金回流 (万元) · 合计120', '#DC2626')
    case 'reason_projects':      return mkBar(['CG-2026001','CG-2026005','CG-2026012'], [40,280,40], '在途关联敞口 (万元) · 合计360', '#F59E0B')
    case 'case_history':         return mkBar(['物资关联案','分包关联案','服务关联案'], [92,81,85], '历史挽回损失 (万元)', '#10B981')
    case 'person_zhangwei':      return mkGauge(37, '鼎信系集中度 %', 100, '#DC2626')
    case 'org_dingxin1':         return mkGauge(58, '供应商健康评分', 100, '#F59E0B')
    case 'person_zhangwei_scope':return mkBar(['CG-2026001','CG-2026012','CG-2026031','CG-2026044'], [40,40,18,26], '经办单金额 (万元)', '#7C3AED')
    case 'evidence_bid':         return mkPie([{ name:'同IP同设备场次', value:3 }, { name:'独立投标', value:0 }], '投标同源分析')
  }
  if (l.table) return barFromTable(l.table)
  return null
})
// 穿透弹窗内的核查处置操作（按处置力度由弱到强：留观 → 取证 → 核查 → 阻断）
// 每个动作给出「效果提示」与「与其他动作的联系」，体现处置链路的递进关系
const drillActions = [
  { label: '标记待核查', icon: '🚩', tone: 'watch', stage: '留观', strength: '弱',
    effect: '仅打标监控、不干预业务，纳入重点观察名单。',
    relate: '证据不足时的过渡动作；补齐佐证后可升级为「派发核查工单」。' },
  { label: '补充佐证材料', icon: '📎', tone: 'evidence', stage: '取证', strength: '辅助',
    effect: '关联 / 上传佐证材料，提升风险定性置信度。',
    relate: '为「派发核查工单」提供依据；佐证充分可直接「冻结付款节点」。' },
  { label: '派发核查工单', icon: '📨', tone: 'route', stage: '核查', strength: '中',
    effect: '生成核查工单派发至采购部 / 纪检，限时反馈结论。',
    relate: '通常与「冻结付款节点」并行；核查结论决定解冻或移交。' },
  { label: '冻结付款节点', icon: '🧊', tone: 'block', stage: '阻断', strength: '强',
    effect: '当前付款节点立即止付，资金不再流出（最强处置）。',
    relate: '触发后建议同时「派发核查工单」核实，避免误冻。' },
]
const actionDone = ref(null)   // 当前已下达的处置动作 → 弹窗提示
function doDrillAction(a) { actionDone.value = a }

// ── 处置闭环：A/B/C 方案 + 人判断 + AI 实施回执 ──
const plans = [
  { key: 'A', name: '立即冻结付款 + 启动专项审查', strength: '强', recommended: true,
    impact: '当日止付 ¥40 万；冻结后供应商或申诉；可一并阻断 3 个在途关联标的。' },
  { key: 'B', name: '暂不冻结，先约谈经办与供应商核实', strength: '中', recommended: false,
    impact: '保留付款选项、给整改空间；存在资金已付的风险窗口约 5 个工作日。' },
  { key: 'C', name: '列入重点观察名单，持续监控', strength: '弱', recommended: false,
    impact: '不干预当前业务、持续监控；适用证据不足场景，本案证据已较充分，不建议。' },
]
const executionSteps = [
  { step: 1, status: '已执行',
    text: '在 SRM 系统将「鼎信建设一公司」标记“待核查”，并冻结采购单 CG-2026001 的付款节点。',
    operator: 'AI 助手', time: '2026-05-21 09:46' },
  { step: 2, status: '已执行',
    text: '自动生成《关联输送核查任务单》（编号 RW-2026-0501），附完整证据链（工商/资金/投标三类），派发至纪检监察室核查组。',
    operator: 'AI 助手', time: '2026-05-21 09:46' },
  { step: 3, status: '已派发 · 待回执',
    text: '向经办 张伟 及主管 李强 推送整改通知，要求补充关联披露与验收材料，回执截止 2026-05-28；逾期自动升级上级监管并预警。',
    operator: 'AI 助手', time: '2026-05-21 09:46' },
]
const selectedPlan = ref('')
const executionVisible = ref([])
const reportFailed = ref(false)        // 真实接口失败 → 报告体回退 12 环兜底
const storyReportActive = ref(false)   // 当前报告是否为故事线一焦点（CG-2026001）
let execTimer = null
const prEffectsRevealed = ref(0)        // 处置效果逐条揭示计数
let prTimers = []
function clearPrTimers() { prTimers.forEach(clearTimeout); prTimers = []; if (execTimer) { clearTimeout(execTimer); execTimer = null } }
function choosePlan(key) {
  selectedPlan.value = key
  executionVisible.value = []
  prEffectsRevealed.value = 0
  clearPrTimers()
  planResultOpen.value = true   // 选定方案 → 弹出处置结果（含实施回执、初步成效、继续穿透）
  const res = planResults[key]
  const effN = res ? res.effects.length : 0
  // 处置效果：整改后「缓慢、一个个」动态揭示（每条间隔 1s）
  const startEffects = (delay) => {
    for (let i = 0; i < effN; i++) {
      prTimers.push(setTimeout(() => { prEffectsRevealed.value = i + 1 }, delay + i * 1000))
    }
  }
  if (key === 'A') {
    // 先逐条出「AI 实施回执」，回执走完后再缓慢逐条出「处置效果」，形成一步步推进的节奏
    let i = 0
    const tick = () => {
      if (i >= executionSteps.length) return
      executionVisible.value = [...executionVisible.value, executionSteps[i]]
      i++
      execTimer = setTimeout(tick, 700)
    }
    tick()
    startEffects(executionSteps.length * 700 + 500)
  } else {
    startEffects(500)
  }
}
const executionDone = computed(() => selectedPlan.value === 'A' && executionVisible.value.length === executionSteps.length)
// 已揭示的处置效果（逐条切片，配合 transition-group 出场动画）
const visibleEffects = computed(() => currentPlanResult.value ? currentPlanResult.value.effects.slice(0, prEffectsRevealed.value) : [])
const effectsAllShown = computed(() => !!currentPlanResult.value && prEffectsRevealed.value >= currentPlanResult.value.effects.length)

// 处置结果弹窗：下达后的初步成效 + 继续穿透（完善故事线"解决"部分）
const planResultOpen = ref(false)
const planResults = {
  A: {
    name: '立即冻结付款 + 启动专项审查', tone: 'block', status: '处置中 · 待闭环',
    effects: [
      { icon: '🧊', k: '资金止付', v: 'CG-2026001 ¥40万 付款节点已冻结，资金不再流出' },
      { icon: '🚧', k: '关联阻断', v: '一并阻断鼎信系在途关联标的 3 单、合计 ¥360万（CG-2026001 / 005 / 012）' },
      { icon: '🏷️', k: '供应商处置', v: '鼎信建设一公司 列入“待核查”，暂停新单准入与付款' },
      { icon: '📨', k: '核查派单', v: '《关联输送核查任务单》RW-2026-0501 附证据链已派发纪检监察室' },
      { icon: '📉', k: '初步成效', v: '预计避免资金损失 ¥40万、阻断潜在关联输送敞口 ¥320万；本单状态 待整改 → 处置中 → 待闭环' },
    ],
    drill: [ { label: '看在途关联敞口（¥360万）', to: 'reason_projects' }, { label: '看供应商处置', to: 'org_dingxin1' }, { label: '穿透实控人王建国', to: 'person_wangjianguo' } ],
    closing: '处置闭环已启动；待纪检核查回执（截止 2026-05-28）确认后转「已闭环」。',
  },
  B: {
    name: '暂不冻结，先约谈核实', tone: 'route', status: '观察 · 待补验收',
    effects: [
      { icon: '📞', k: '发起约谈', v: '已向经办张伟与鼎信建设一公司发起约谈，要求 7 个工作日内补验收 + 关联披露' },
      { icon: '⏳', k: '风险窗口', v: '付款选项保留，存在资金已付风险窗口约 5 个工作日，需持续盯办' },
      { icon: '🔎', k: '未即时阻断', v: '未触发止付与关联阻断；约谈不实将自动升级为方案 A' },
    ],
    drill: [ { label: '看本单依据', to: 'risk_related_transfer' }, { label: '看供应商背景', to: 'org_dingxin1' } ],
    closing: '已进入限期整改观察；逾期未补齐将自动升级为冻结处置。',
  },
  C: {
    name: '列入重点观察名单，持续监控', tone: 'watch', status: '监控中',
    effects: [
      { icon: '🚩', k: '打标监控', v: 'CG-2026001 及鼎信建设一公司 列入重点观察名单，不干预当前业务' },
      { icon: '📡', k: '节点拦截', v: '在下一付款 / 中标节点自动拦截复核' },
      { icon: '⚠️', k: '风险提示', v: '本案叠加关联输送、证据已较充分，仅观察存在资金损失风险，建议升级处置' },
    ],
    drill: [ { label: '看关联输送证据', to: 'risk_related_transfer' } ],
    closing: '已纳入持续监控；如出现新单或付款将触发拦截。',
  },
}
const currentPlanResult = computed(() => (selectedPlan.value && planResults[selectedPlan.value]) || null)

// ── 三个处置方案对比（可视化数表）——数据依当前案例 CG-2026001 演进 ──
const planCompareOpen = ref(false)
const planCompareCols = [
  { key: 'A', name: '立即冻结付款 + 专项审查', tag: '强 · 推荐' },
  { key: 'B', name: '暂不冻结 · 先约谈核实', tag: '中' },
  { key: 'C', name: '列入观察名单 · 持续监控', tag: '弱' },
]
const planCompareRows = [
  { dim: '当前付款（CG-2026001 ¥40万）',
    A: { v: '当日止付，资金不流出', tone: 'good' }, B: { v: '保留付款，约5个工作日风险窗口', tone: 'warn' }, C: { v: '不干预，可能照常付款', tone: 'bad' } },
  { dim: '在途关联敞口（¥360万 / 3单）',
    A: { v: '一并阻断 CG-005 / 012', tone: 'good' }, B: { v: '暂不阻断，持续盯办', tone: 'warn' }, C: { v: '仅节点拦截复核', tone: 'warn' } },
  { dim: '供应商（鼎信建设一公司）',
    A: { v: '列入待核查，暂停准入与付款', tone: 'good' }, B: { v: '约谈，限7个工作日补验收/披露', tone: 'warn' }, C: { v: '列入重点观察名单', tone: 'warn' } },
  { dim: '响应时效',
    A: { v: '当日处置', tone: 'good' }, B: { v: '7 个工作日', tone: 'warn' }, C: { v: '持续监控', tone: 'warn' } },
  { dim: '资金损失风险',
    A: { v: '低（预计避免 ¥40万）', tone: 'good' }, B: { v: '中（窗口期已付风险）', tone: 'warn' }, C: { v: '高（叠加关联输送）', tone: 'bad' } },
  { dim: '对正常业务影响',
    A: { v: '较大（冻结 / 暂停）', tone: 'warn' }, B: { v: '较小（仅约谈）', tone: 'good' }, C: { v: '无', tone: 'good' } },
  { dim: '供应商申诉 / 阻力',
    A: { v: '较高', tone: 'warn' }, B: { v: '中', tone: 'warn' }, C: { v: '低', tone: 'good' } },
  { dim: '合规闭环（截止 2026-05-28）',
    A: { v: '快，待纪检回执即闭环', tone: 'good' }, B: { v: '限期整改，逾期升级', tone: 'warn' }, C: { v: '慢，仅留痕', tone: 'bad' } },
  { dim: '适用前提 / 建议',
    A: { v: '证据充分 → 推荐', tone: 'good' }, B: { v: '需补证后判定', tone: 'warn' }, C: { v: '本案证据已充分，不建议', tone: 'bad' } },
]

function reopenPlanResult() {
  if (!selectedPlan.value) return
  // 重看：直接显示全部（不重新逐条动画）
  clearPrTimers()
  const res = planResults[selectedPlan.value]
  prEffectsRevealed.value = res ? res.effects.length : 0
  if (selectedPlan.value === 'A') executionVisible.value = [...executionSteps]
  planResultOpen.value = true
}

// ── 从真实报告动态识别可点实体（报告变 → 实体跟着变，不预设、不写死） ──
const reportEntitiesLive = computed(() => {
  const a = activeRisk.value
  if (!a) return []
  const ents = []
  ;(a.entity || '').split(/[\/、,，;；]+/).map(s => s.trim()).filter(Boolean).forEach(name => ents.push({ kind: 'subject', type: '主体', label: name }))
  const rp = extractNames(a.responsible)
  if (rp && rp !== '无法获取' && rp !== '—') ents.push({ kind: 'person', type: '责任人', label: rp })
  if (a.contractRef) ents.push({ kind: 'doc', type: '合同', label: a.contractRef, domain: '合同域' })
  if (a.no) ents.push({ kind: 'doc', type: '采购单', label: a.no, domain: '采购域' })
  if (a.name) ents.push({ kind: 'risk', type: '风险', label: a.name })
  return ents
})

// ① 涉及对象关系图：力导向（不僵硬），可缩放/拖动；焦点单据用富关系链，其余用动态报告实体
const entCatColor = { '风险': '#DC2626', '采购单': '#F59E0B', '供应商': '#2563EB', '责任人': '#7C3AED', '项目': '#0D9488', '合同': '#0891B2', '自然人': '#B91C1C', '关联企业': '#EF4444', '主体': '#2563EB', '默认': '#64748B' }
// 焦点（CG-2026001 关联输送）富关系图：节点 + 带关系标签的边
function entStoryGraph() {
  const nodes = [
    { name: 'CG-2026001', _cat: '采购单' },
    { name: '未验收付款·关联输送', _cat: '风险' },
    { name: '鼎信建设一公司', _cat: '供应商' },
    { name: '张伟（采购部）', _cat: '责任人' },
    { name: '李强（审批）', _cat: '责任人' },
    { name: '二号车间维修工程', _cat: '项目' },
    { name: 'HT-2026-0312', _cat: '合同' },
    { name: '王建国（实控人）', _cat: '自然人' },
    { name: '鼎信建设有限公司', _cat: '关联企业' },
    { name: '王建军（代持法人）', _cat: '自然人' },
  ]
  const links = [
    ['CG-2026001', '未验收付款·关联输送', '命中'],
    ['CG-2026001', '鼎信建设一公司', '供应商'],
    ['CG-2026001', '张伟（采购部）', '经办'],
    ['CG-2026001', '李强（审批）', '审批'],
    ['CG-2026001', 'HT-2026-0312', '付款依据'],
    ['HT-2026-0312', '二号车间维修工程', '标的'],
    ['鼎信建设一公司', '二号车间维修工程', '承接'],
    ['王建国（实控人）', '鼎信建设一公司', '实际控制'],
    ['王建国（实控人）', '鼎信建设有限公司', '持股65%'],
    ['鼎信建设有限公司', '鼎信建设一公司', '资金回流¥120万'],
    ['王建军（代持法人）', '鼎信建设一公司', '代持法人'],
  ]
  return { nodes, links }
}
// 通用：从动态报告实体生成（中心=风险）
function entGenericGraph() {
  const ents = reportEntitiesLive.value
  const center = ents.find(e => e.kind === 'risk') || { type: '风险', label: activeRisk.value?.name || '风险事项' }
  const others = ents.filter(e => e.kind !== 'risk')
  const nodes = [{ name: center.label, _cat: '风险' }]
  const links = []
  others.forEach(e => { nodes.push({ name: e.label, _cat: e.type === '主体' ? '供应商' : e.type }); links.push([center.label, e.label, e.type]) })
  return { nodes, links }
}
function buildEntityGraphOption(big) {
  const { nodes, links } = storyReportActive.value ? entStoryGraph() : entGenericGraph()
  const cats = [...new Set(nodes.map(n => n._cat))].map(c => ({ name: c, itemStyle: { color: entCatColor[c] || entCatColor['默认'] } }))
  const catIndex = Object.fromEntries(cats.map((c, i) => [c.name, i]))
  return {
    animation: true, animationDuration: 600, backgroundColor: 'transparent',
    legend: big ? [{ data: cats.map(c => c.name), bottom: 4, itemWidth: 9, itemHeight: 9, itemGap: 10, textStyle: { fontSize: 10, color: '#64748B' } }] : undefined,
    tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,0.97)', borderColor: '#E2E8F0', textStyle: { color: '#334155', fontSize: 11 },
      formatter: (p) => p.dataType === 'edge' ? (p.data._rel || '') : `<b>${p.data._cat}</b> · ${p.data.name}` },
    series: [{
      type: 'graph', layout: 'force', roam: big, draggable: big, symbol: 'circle',
      force: { repulsion: big ? 340 : 140, edgeLength: big ? [70, 140] : [34, 64], gravity: 0.08, friction: 0.16 },
      categories: cats,
      label: { show: true, position: 'right', fontSize: big ? 11 : 8, color: '#334155', fontWeight: 600,
        formatter: (p) => { const s = String(p.data.name); return s.length > (big ? 16 : 7) ? s.slice(0, big ? 15 : 6) + '…' : s } },
      edgeSymbol: ['none', 'arrow'], edgeSymbolSize: [0, big ? 7 : 4],
      lineStyle: { color: '#CBD5E1', width: big ? 1.5 : 1, curveness: 0.12, opacity: 0.85 },
      edgeLabel: big ? { show: true, fontSize: 9, color: '#B91C1C', fontWeight: 600, formatter: (p) => p.data._rel || '' } : { show: false },
      emphasis: { focus: 'adjacency', lineStyle: { width: big ? 3 : 2, opacity: 1 }, label: { fontSize: big ? 12 : 9 } },
      data: nodes.map(n => ({ name: n.name, _cat: n._cat, category: catIndex[n._cat],
        symbolSize: n._cat === '风险' ? (big ? 58 : 34) : n._cat === '采购单' ? (big ? 50 : 30) : (big ? 38 : 22),
        itemStyle: { borderColor: '#fff', borderWidth: big ? 2.5 : 1.5, shadowColor: 'rgba(15,23,42,0.18)', shadowBlur: 6 } })),
      links: links.map(([s, t, rel]) => ({ source: s, target: t, _rel: rel })),
    }],
  }
}
const entityGraphOption = computed(() => buildEntityGraphOption(false))
const entityGraphOptionBig = computed(() => buildEntityGraphOption(true))
const entityModalOpen = ref(false)
const cameFromEntityModal = ref(false)   // 标记：穿透弹窗是否从「涉及对象放大图」进入，便于「报告」按钮回退到放大图
function openEntityFromModal(e) { entityModalOpen.value = false; openDrill(e); cameFromEntityModal.value = true }

// 整改建议 → 延迟 1s 揭示「处置闭环」并播放动画
const dpBodyEl = ref(null)
const plansVisible = ref(false)
const rectifyLoading = ref(false)
let rectifyTimer = null
function onRectifyClick() {
  if (rectifyLoading.value || plansVisible.value) return
  rectifyLoading.value = true
  if (rectifyTimer) clearTimeout(rectifyTimer)
  rectifyTimer = setTimeout(() => {
    rectifyLoading.value = false
    plansVisible.value = true
    nextTick(() => { const el = dpBodyEl.value; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) })
  }, 1000)
}
function resetDisposition() { plansVisible.value = false; rectifyLoading.value = false; if (rectifyTimer) clearTimeout(rectifyTimer); selectedPlan.value = ''; planResultOpen.value = false; prEffectsRevealed.value = 0; clearPrTimers() }

// AI 建议路径（故事线剧情）：默认收起，点了才展开；仅当报告疑似关联输送时才提示"可以这样穿透"
const storyAdviceOpen = ref(false)
const showStoryAdvice = computed(() => {
  const a = activeRisk.value
  const blob = JSON.stringify(reportSections.value || {}) + (a?.name || '') + (a?.entity || '')
  return storyReportActive.value || /关联|输送|鼎信|关联交易|利益输送/.test(blob)
})

// ── 全量穿透图（报告后逐层穿透，不断头） ──
const penetrationGraph = {
  risk_related_transfer: {
    type: 'risk', title: '关联输送风险', badge: '高',
    summary: 'CG-2026001 命中“隐性关联 + 资金回流 + 同源投标”组合特征，疑为未披露关联交易项下的利益输送。',
    context: { riskDomain: 'related_transfer', highlightChain: ['group','dingxin','dingxin1','proj'], focusOrderId: 'CG-2026001' },
    fields: [
      { k: '风险等级', v: '高', danger: true },
      { k: '命中规则', v: 'R-07 关联交易未披露' },
      { k: '触发特征', v: '隐性关联 + 资金回流¥120万 + 同源投标', danger: true },
      { k: '命中红线', v: '十不准·不准向关联方输送利益 / 不准隐瞒关联关系参与采购', danger: true },
      { k: '关联单据', v: 'CG-2026001（¥40万，待付）' },
    ],
    drilldowns: [
      { label: '看工商证据', to: 'evidence_gongshang' },
      { label: '看资金证据', to: 'evidence_fund', hint: '回流 ¥120万 / 3笔' },
      { label: '看投标证据', to: 'evidence_bid', hint: '同IP / 同设备' },
      { label: '穿透关联主体', to: 'org_dingxin1' },
      { label: '穿透实控人', to: 'person_wangjianguo' },
    ],
  },
  evidence_gongshang: {
    type: 'evidence', title: '工商证据', summary: '股权与控制关系穿透，证明两家供应商实为关联方。',
    fields: [
      { k: '王建国 → 鼎信建设有限公司', v: '持股 65%（控股）', danger: true },
      { k: '王建国 → 鼎信建设一公司', v: '实际控制（其弟王建军代持法人）', danger: true },
      { k: '关联企业', v: '鼎信建设有限公司 / 鼎信建设一公司 / 鼎信物资贸易有限公司 / 信达劳务服务有限公司（4家）' },
      { k: '披露情况', v: '本次采购未申报关联关系', danger: true },
    ],
    drilldowns: [ { label: '穿透王建国关联网络', to: 'person_wangjianguo' }, { label: '看供应商画像', to: 'org_dingxin1' } ],
  },
  evidence_fund: {
    type: 'evidence', title: '资金证据 · 近6月回流 ¥120万', summary: '鼎信建设有限公司向关联方鼎信建设一公司回流资金，分3笔合计¥120万。',
    table: {
      columns: ['日期', '金额', '付方 → 收方', '备注'],
      rows: [
        ['2026-03-12', '¥45万', '鼎信建设有限公司 → 鼎信建设一公司', '工程款'],
        ['2026-04-08', '¥38万', '鼎信建设有限公司 → 鼎信建设一公司', '材料预付'],
        ['2026-05-06', '¥37万', '鼎信建设有限公司 → 鼎信建设一公司', '往来款'],
      ],
    },
    fields: [ { k: '合计', v: '¥120万', danger: true }, { k: '资金性质', v: '关联方往来，与真实交易匹配度低' } ],
    drilldowns: [ { label: '穿透收款方', to: 'org_dingxin1' } ],
  },
  evidence_bid: {
    type: 'evidence', title: '投标证据 · 同源投标', summary: '两家公司在3场招标中表现出同源制单特征。',
    table: {
      columns: ['招标项目', '投标IP', '制单设备MAC', '结果'],
      rows: [
        ['二号车间维修工程', '116.62.45.21', '00-1B-44-11-3A-B7', '鼎信建设一公司中标'],
        ['智能设备采购项目', '116.62.45.21', '00-1B-44-11-3A-B7', '陪标'],
        ['厂区管网改造',     '116.62.45.21', '00-1B-44-11-3A-B7', '陪标'],
      ],
    },
    fields: [ { k: '同IP', v: '116.62.45.21（3场一致）', danger: true }, { k: '同制单设备', v: 'MAC 00-1B-44-11-3A-B7', danger: true } ],
    drilldowns: [ { label: '看智能设备采购项目', to: 'project_smartdevice' } ],
  },
  person_zhangwei: {
    type: 'person', title: '张伟（经办人）', badge: '采购部',
    summary: '本单经办人。其经办业务对鼎信系供应商集中度偏高，存在利益关联嫌疑。',
    context: { riskDomain: 'related_transfer', highlightChain: ['group','dingxin','dingxin1','proj'], focusOrderId: 'CG-2026001' },
    fields: [
      { k: '部门 / 岗位', v: '采购部 / 采购主管' },
      { k: '入职时间', v: '2019-03' },
      { k: '近12月经办采购单', v: '86 笔' },
      { k: '触发预警', v: '5 次', danger: true },
      { k: '鼎信系集中度', v: '占其经办金额 37%（异常偏高）', danger: true },
    ],
    drilldowns: [
      { label: '穿透他所负责的内容', to: 'person_zhangwei_scope', hint: '在办单据/项目' },
      { label: '看本单 CG-2026001', to: 'order_cg2026001' },
      { label: '看同供应商单 CG-2026012', to: 'order_cg2026012', hint: '同为鼎信建设一公司' },
    ],
  },
  person_zhangwei_scope: {
    type: 'scope', title: '张伟 · 所负责的内容', badge: '在办 4 单',
    summary: '其在办采购单中两单连续指向同一关联供应商鼎信建设一公司，集中度异常，建议并案核查。',
    table: {
      columns: ['采购单', '项目', '金额', '供应商', '风险', '状态'],
      rows: [
        ['CG-2026001', '二号车间维修工程',         '¥40万', '鼎信建设一公司', '关联输送·高', '待付'],
        ['CG-2026012', '二号车间维修工程（二期）', '¥40万', '鼎信建设一公司', '未验收付款·高', '已付待验收'],
        ['CG-2026031', '厂区绿化养护',             '¥18万', '绿源园林工程有限公司', '正常', '已完成'],
        ['CG-2026044', '安防设备维保',             '¥26万', '安泰智能科技有限公司', '正常', '在办'],
      ],
    },
    fields: [
      { k: '负责项目', v: '二号车间维修工程（含二期）、厂区配套' },
      { k: '异常提示', v: '鼎信系连续两单 ¥80万，集中度异常，建议并案', danger: true },
    ],
    drilldowns: [
      { label: '穿透 CG-2026012', to: 'order_cg2026012' },
      { label: '穿透二号车间维修工程', to: 'project_workshop2' },
    ],
  },
  person_liqiang: {
    type: 'person', title: '李强（审批人）', badge: '采购部主管',
    summary: '本单审批人。对鼎信系单据审批通过率 100%，审批把关存疑。',
    fields: [
      { k: '部门 / 岗位', v: '采购部 / 主管' },
      { k: '近12月审批', v: '210 笔' },
      { k: '鼎信系单据审批', v: '6/6 全部通过', danger: true },
      { k: '本单审批', v: 'CG-2026001 已审批通过（未要求关联披露）', danger: true },
    ],
    drilldowns: [ { label: '看其审批的鼎信系单据', to: 'person_zhangwei_scope' } ],
  },
  org_dingxin1: {
    type: 'org', title: '鼎信建设一公司', badge: '关联供应商 · 评分58',
    summary: '王建国实际控制的关联供应商（王建军代持），近年密集中标本集团项目。',
    context: { riskDomain: 'related_transfer', highlightChain: ['dingxin','dingxin1','proj'], focusOrderId: 'CG-2026001' },
    fields: [
      { k: '成立时间', v: '2021-08' },
      { k: '注册资本', v: '500 万' },
      { k: '法定代表人', v: '王建军（王建国之弟，代持）', danger: true },
      { k: '实际控制人', v: '王建国（未披露）', danger: true },
      { k: '供应商健康评分', v: '58（偏低）', danger: true },
      { k: '中标本集团项目', v: '5 个 / 合计 ¥860万' },
    ],
    drilldowns: [
      { label: '穿透实控人王建国', to: 'person_wangjianguo' },
      { label: '看资金往来', to: 'evidence_fund' },
      { label: '看承接项目', to: 'project_workshop2' },
    ],
  },
  person_wangjianguo: {
    type: 'person', title: '王建国（共同实际控制人）', badge: '自然人',
    summary: '同时控制鼎信建设有限公司与鼎信建设一公司，形成隐性关联交易闭环。',
    context: { riskDomain: 'related_transfer', highlightChain: ['group','dingxin','dingxin1','proj','wang'], focusOrderId: 'CG-2026001' },
    fields: [
      { k: '鼎信建设有限公司', v: '持股 65%（控股）', danger: true },
      { k: '鼎信建设一公司', v: '实际控制（王建军代持）', danger: true },
      { k: '关联企业', v: '鼎信建设有限公司 / 鼎信建设一公司 / 鼎信物资贸易有限公司 / 信达劳务服务有限公司' },
      { k: '风险结论', v: '可在关联企业间转移利益、操纵投标', danger: true },
    ],
    drilldowns: [ { label: '看资金证据', to: 'evidence_fund' }, { label: '看投标证据', to: 'evidence_bid' } ],
  },
  project_workshop2: {
    type: 'project', title: '二号车间维修工程', badge: '合同 HT-2026-0312',
    summary: '本案核心项目，由关联供应商鼎信建设一公司承接，验收单缺失而付款待付。',
    context: { riskDomain: 'related_transfer', highlightChain: ['group','dingxin1','proj'], focusOrderId: 'CG-2026001' },
    fields: [
      { k: '合同编号 / 金额', v: 'HT-2026-0312 / ¥40万' },
      { k: '承接方', v: '鼎信建设一公司' },
      { k: '对应采购单', v: 'CG-2026001' },
      { k: '施工进度', v: '已施工 60%' },
      { k: '验收单', v: '缺失', danger: true },
      { k: '付款状态', v: '待付 ¥40万', danger: true },
    ],
    drilldowns: [
      { label: '看采购单 CG-2026001', to: 'order_cg2026001' },
      { label: '看二期 CG-2026012', to: 'order_cg2026012' },
      { label: '看在途关联标的', to: 'reason_projects' },
    ],
  },
  project_smartdevice: {
    type: 'project', title: '智能设备采购项目', badge: '¥280万',
    summary: '鼎信建设一公司在此项目陪标（同IP/同设备），与本案同源，属在途关联敞口。',
    fields: [
      { k: '金额', v: '¥280万' }, { k: '采购单', v: 'CG-2026005' },
      { k: '关联点', v: '鼎信参与投标，同IP同制单设备', danger: true },
    ],
    drilldowns: [ { label: '看投标证据', to: 'evidence_bid' } ],
  },
  order_cg2026001: {
    type: 'order', title: '采购单 CG-2026001', badge: '关联输送·高', summary: '本案焦点单据。',
    fields: [
      { k: '项目', v: '二号车间维修工程' }, { k: '金额', v: '¥40万' },
      { k: '供应商', v: '鼎信建设一公司' }, { k: '经办', v: '张伟（采购部）' },
      { k: '审批', v: '李强（采购部主管）' }, { k: '验收单', v: '缺失', danger: true }, { k: '付款', v: '待付', danger: true },
    ],
    drilldowns: [ { label: '穿透经办人张伟', to: 'person_zhangwei' }, { label: '穿透供应商', to: 'org_dingxin1' } ],
  },
  order_cg2026012: {
    type: 'order', title: '采购单 CG-2026012', badge: '未验收付款·高',
    summary: '张伟经办的另一单，同供应商鼎信建设一公司，付款已走但验收单空缺。',
    fields: [
      { k: '项目', v: '二号车间维修工程（二期）' }, { k: '金额', v: '¥40万' },
      { k: '供应商', v: '鼎信建设一公司' }, { k: '经办', v: '张伟（采购部）' },
      { k: '付款', v: '已付', danger: true }, { k: '验收单', v: '空缺', danger: true },
    ],
    drilldowns: [ { label: '穿透供应商', to: 'org_dingxin1' }, { label: '回到张伟负责内容', to: 'person_zhangwei_scope' } ],
  },
  suggestion_root: {
    type: 'suggestion', title: '整改建议', summary: '三个处置方案，推荐 A。点方案可看建议原因。',
    fields: [
      { k: 'A（推荐）', v: '立即冻结付款 + 启动专项审查 ｜ 影响：当日止付¥40万，可阻断在途关联标的' },
      { k: 'B', v: '先约谈核实 ｜ 影响：保留付款选项，存在已付风险窗口约5个工作日' },
      { k: 'C', v: '列入重点观察名单 ｜ 影响：不干预，持续监控（本案证据已充分，不建议）' },
    ],
    drilldowns: [ { label: '为什么推荐A（建议原因）', to: 'reason_A' } ],
  },
  reason_A: {
    type: 'reason', title: '建议原因 · 为什么立即冻结+审查',
    summary: '金额虽小但性质恶劣、模式可复制、证据已充分，须先阻断防扩散。',
    fields: [
      { k: '模式可复制', v: '“隐性关联+资金回流+同源投标”可套用到更大标的', danger: true },
      { k: '扩散风险', v: '存在多个在途关联标的，敞口合计 ¥360万', danger: true },
      { k: '证据充分', v: '工商/资金/投标三类证据闭环' },
      { k: '历史佐证', v: '同类案例 3 起，平均挽回损失 ¥86万' },
    ],
    drilldowns: [
      { label: '看原因涉及的项目', to: 'reason_projects', hint: '在途关联敞口 ¥360万' },
      { label: '看历史案例', to: 'case_history' },
      { label: '看法规依据', to: 'regulation' },
    ],
  },
  reason_projects: {
    type: 'project', title: '原因涉及的项目 · 在途关联敞口', badge: '合计 ¥360万',
    summary: '若不立即阻断，以下在途关联标的存在同样的利益输送扩散风险。',
    table: {
      columns: ['采购单', '项目', '金额', '关联点', '状态'],
      rows: [
        ['CG-2026001', '二号车间维修工程',         '¥40万',  '鼎信建设一公司承接', '待付'],
        ['CG-2026005', '智能设备采购项目',         '¥280万', '鼎信同源投标/陪标', '评标中'],
        ['CG-2026012', '二号车间维修工程（二期）', '¥40万',  '鼎信建设一公司承接', '已付待验收'],
      ],
    },
    fields: [ { k: '敞口合计', v: '¥360万', danger: true } ],
    drilldowns: [
      { label: '穿透 CG-2026005 项目', to: 'project_smartdevice' },
      { label: '穿透 CG-2026012', to: 'order_cg2026012' },
    ],
  },
  case_history: {
    type: 'case', title: '历史同类案例（3起）', summary: '关联输送类案例处置参考。',
    table: {
      columns: ['案例', '手法', '处置', '挽回'],
      rows: [
        ['2024 物资采购关联案', '亲属代持+回流', '冻结+移送纪检', '¥92万'],
        ['2025 工程分包关联案', '同源投标抬价',   '废标重招+追责', '¥81万'],
        ['2025 服务类关联案',   '未披露关联交易', '止付+补充披露', '¥85万'],
      ],
    },
    fields: [ { k: '平均挽回', v: '¥86万' } ],
  },
  regulation: {
    type: 'regulation', title: '法规 / 制度依据', summary: '本次研判与处置的合规依据。',
    fields: [
      { k: '《招标投标法实施条例》第34条', v: '投标人不得与他人串通投标、不得弄虚作假' },
      { k: '集团《采购管理办法》', v: '关联交易须如实披露，违者暂停资格' },
      { k: '十不准', v: '不准向关联方输送利益 / 不准隐瞒关联关系参与采购' },
    ],
  },
}

// 12 环兜底（仅当真实接口失败时按此渲染）
const verdict12Fallback = [
  { ring: 1, title: '关联依据', body: '「关联输送」风险域 18 笔居首；CG-2026001 命中“隐性关联 + 资金回流 + 同源投标”组合特征，初判为未披露关联交易项下的利益输送。' },
  { ring: 2, title: '弹窗调依据', body: '证据卡：\n· 工商 — 王建国持鼎信建设有限公司 65% 股权，同时实际控制鼎信建设一公司（其弟王建军代持法人）。\n· 资金 — 近6个月鼎信建设有限公司向鼎信建设一公司回流 ¥120 万，分3笔。\n· 投标 — 2026年3场招标两家公司同一投标IP（116.62.45.21）、同一制单设备（MAC 00-1B-44-11-3A-B7）上传标书。' },
  { ring: 3, title: '关联风险', body: '关联交易未披露、利益输送、围标嫌疑；对应红线「十不准」之“不准向关联方输送利益”“不准隐瞒关联关系参与采购”。' },
  { ring: 4, title: '具体项目', body: '「二号车间维修工程」，合同 HT-2026-0312，金额 ¥40 万，承接方 鼎信建设一公司。' },
  { ring: 5, title: '穿透单据·责任人', body: '采购单 CG-2026001：经办 张伟（采购部）、审批 李强（采购部主管）；缺陷—验收单缺失，付款申请已提交财务待付。' },
  { ring: 6, title: '给出建议', body: '暂停 CG-2026001 付款 + 启动专项核查 + 要求鼎信建设一公司补充关联关系披露材料。' },
  { ring: 7, title: '协调方式', body: '纪检监察室牵头核查、财务部冻结付款节点、SRM 将鼎信建设一公司标记“待核查”并限制新单。' },
  { ring: 8, title: '给出理由', body: '本单虽仅 ¥40 万，但“隐性关联+资金回流+同源投标”模式可复制到更大标的，须先阻断，防系统性扩散。' },
  { ring: 9, title: '可选方案', body: '见 A / B / C（每个标注预计影响）。', plans: true },
  { ring: 10, title: '调理由依据', body: '历史同类案例3起（平均挽回损失 ¥86 万）；鼎信建设一公司供应商健康评分 58；《招标投标法实施条例》第34条；集团《采购管理办法》关联交易披露条款。' },
  { ring: 11, title: '人做判断', body: '监管员在 A / B / C 中选定（决策权在人）。' },
  { ring: 12, title: 'AI 实施', body: '执行所选方案并实时回执。' },
]

// ── AI 风险识别检测报告 ────────────────────────────────────────────────────
// ── AI 智能体弹窗 ────────────────────────────────────────────────────────
const aiAgentModal     = ref(false)
const aiAgentSteps     = ref([])
const aiAgentComplete  = ref(false)
const aiElapsed        = ref(0)
const aiAgentPendingRisk = ref(null)
const aiReportReady    = ref(false)   // 报告数据是否已拉取就绪（决定「查看分析报告」按钮何时可点）
let aiDeferNav     = false            // 预取期间为 true：只取数、不跳转；待用户点「查看分析报告」再跳
let aiTimer        = null
let aiElapsedTimer = null

const procStepDefs = [
  { text: '启动采购风险分析引擎…',         detail: 'DRP Agent v4.7 · 采购穿透模型已加载' },
  { text: '提取采购订单与合同数据…',       detail: '识别采购记录 8 份 · 结构化字段 28 个' },
  { text: '调用围标串标模式识别模型…',     detail: '命中风险规则库 150+ 条 · 匹配中' },
  { text: '穿透关联供应商与招投标记录…',   detail: '已关联 3 条供应商链路 · 2 条价格链路' },
  { text: '比对市场价格与历史中标数据…',   detail: '检索近 12 个月同类采购 · 异常偏差识别' },
  { text: '运行采购合规规则交叉验证…',     detail: '资质 · 价格 · 关联关系三维度交叉核验' },
  { text: '生成 AI 采购风险分析报告…',     detail: '报告已生成 · 包含 7 个章节' },
]

function runAgentModal(steps, onComplete) {
  aiAgentComplete.value = false
  aiAgentSteps.value = steps.map((s, i) => ({ ...s, status: i === 0 ? 'running' : 'pending' }))
  aiElapsed.value = 0
  aiAgentModal.value = true
  aiElapsedTimer = setInterval(() => { aiElapsed.value++ }, 1000)
  let stepIdx = 1
  aiTimer = setInterval(() => {
    if (stepIdx < steps.length) {
      aiAgentSteps.value[stepIdx - 1].status = 'done'
      aiAgentSteps.value[stepIdx].status = 'running'
      stepIdx++
    } else {
      clearInterval(aiTimer)
      clearInterval(aiElapsedTimer)
      aiAgentSteps.value[aiAgentSteps.value.length - 1].status = 'done'
      aiAgentComplete.value = true
      if (onComplete) onComplete()
    }
  }, 1700)
}

// 点击遮罩关闭弹窗（不跳转）
function closeAgentModal() {
  aiAgentModal.value = false
  clearInterval(aiTimer)
  clearInterval(aiElapsedTimer)
}

function goToRiskReport() {
  // 报告数据已在加载期间预取就绪；此刻（用户点击）才真正跳转到报告页
  aiAgentModal.value = false
  clearInterval(aiTimer)
  clearInterval(aiElapsedTimer)
  pushViewHistory('risk-detail')
}

onBeforeUnmount(() => {
  clearInterval(aiTimer)
  clearInterval(aiElapsedTimer)
})

const analyzedReportIds = ref(new Set())
const riskDataCache = ref({})
const apiRiskData   = ref(null)
const selectedRiskId = ref('')
const penetModalType = ref(null)
const penetOpen      = ref(new Set(['capital'])) // 默认展开资金闭环

// ── 风险事项详情视图 ────────────────────────────────────────────────────
const viewMode      = ref('penetration')
const viewHistory   = ref([])
const toastVisible  = ref(false)
const toastText     = ref('')
let toastTimer = null
function showToast(text){
  toastText.value = text
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(()=>{ toastVisible.value = false }, 2400)
}
const riskLevelLabel = { red:'高风险', orange:'中风险', yellow:'低风险', high:'高风险', medium:'中风险', watch:'低风险' }
const riskIconMap    = { red:'⚠️', orange:'⚠', yellow:'ℹ', high:'⚠️', medium:'⚠', watch:'ℹ' }
function stepKeyOfRisk(r){
  if (!r) return 'pending'
  const code = r.statusCode
  if (code === 'investigating') return 'checking'
  if (code === 'rectifying')    return 'fixing'
  if (code === 'closed')        return 'fixing'
  return 'pending'
}
function pushViewHistory(targetMode){
  if (viewMode.value !== targetMode) viewHistory.value.push(viewMode.value)
  viewMode.value = targetMode
}
function goBack(){
  if (viewHistory.value.length > 0) viewMode.value = viewHistory.value.pop()
  else viewMode.value = 'penetration'
}
const backLabel = computed(() => {
  const prev = viewHistory.value[viewHistory.value.length - 1]
  if (prev === 'risk-detail') return '← 返回风险报告'
  return '← 返回采购穿透'
})

// 从风险列表中获取风险项
const getRiskFromList = (riskId) => {
  return riskList.find(r => r.id === riskId || r.no === riskId)
}

// 获取当前选中的风险数据
const activeRisk = computed(() => {
  if (!selectedRiskId.value) return null
  
  // 先从本地风险列表中获取基本信息（支持通过 id 或 no 匹配）
  const localRisk = riskList.find(r => r.id === selectedRiskId.value || r.no === selectedRiskId.value)
  
  // 先从缓存中获取对应风险项的数据
  const cachedData = riskDataCache.value[selectedRiskId.value]
  // 如果缓存中有数据就用缓存，否则用全局的 apiRiskData
  const apiData = cachedData || apiRiskData.value
  
  if (apiData) {
    const levelMap = { '高风险': 'red', '中风险': 'orange', '低风险': 'yellow', '重大风险': 'red', '正常': 'yellow' }
    
    // 处理进度索引
    const statusMap = {
      '待核查': 'pending',
      '核查中': 'investigating',
      '整改中': 'rectifying',
      '已闭环': 'closed',
      '待整改': 'rectifying'
    }
    const apiStatus = apiData.process_status || apiData.status || localRisk?.status || '待核查'
    const statusCode = apiData.statusCode || statusMap[apiStatus] || 'pending'
    const flow = ['待核查','核查中','整改中','已闭环']
    const curIdx = Math.max(0, progressSteps.findIndex(s => s.code === statusCode))
    
    // 合同编号
    const baseSeq = (localRisk?.no || selectedRiskId.value).replace('CG-','').replace('R-CG-','')
    const contractRef = apiData?.contractRef || apiData?.contract_no || 'HT-' + baseSeq
    
    return {
      // 基础信息 - 使用显示的编号（如 CG-2026001）作为 id 和 no
      id: selectedRiskId.value,
      no: apiData.risk_code || apiData.risk_id || apiData.no || selectedRiskId.value,
      name: apiData.risk_name || apiData.name || localRisk?.name || '未知风险事项',
      level: levelMap[apiData.risk_level] || apiData.level || localRisk?.level || 'orange',
      warningTime: apiData.warning_time || apiData.alertTime || localRisk?.warningTime || '',
      alertTime: apiData.warning_time || apiData.alertTime || localRisk?.warningTime || new Date().toLocaleString(),
      entity: apiData.subjects?.join(' / ') || apiData.entity || apiData.involved_subject || localRisk?.entity || '暂无',
      source: apiData.data_source || 'AI智能体 · 采购全量数据穿透',
      
      // 金额信息
      amount: apiData.amount || localRisk?.amount,
      amountUnit: apiData.amountUnit || localRisk?.amountUnit || '万元',
      
      // 状态信息
      status: apiStatus,
      statusCode: statusCode,
      statusFlow: Array.isArray(flow) ? flow.join(' → ') : flow,
      currentStatusIdx: curIdx,
      responsible: apiData.responsible_person || apiData.responsible || apiData.handler || localRisk?.handler || '无法获取',
      deadline: apiData.deadline || localRisk?.deadline || '—',
      
      // 合同信息
      contractRef: contractRef,
      
      // 报告内容
      riskItem: apiData, // 保存完整数据，供其他地方使用
      summary: apiData.summary || '',
      detailDescription: apiData.report || apiData.detailDescription || '',

      // 解析报告JSON
      parsedReport: (() => {
        const raw = apiData.report || apiData.detailDescription || '{}'
        try {
          return JSON.parse(raw)
        } catch (e) {
          return {}
        }
      })(),

      // 处理进度（取接口返回的 progress_tracking）
      progressTracking: (() => {
        try {
          const raw = apiData.report || apiData.detailDescription || '{}'
          const parsed = JSON.parse(raw)
          return parsed.sections?.progress_tracking || {}
        } catch (e) {
          return {}
        }
      })(),
      
      // 关联数据
      tableRows: apiData.table_rows || apiData['整理报告_1.table_rows'] || [
        { 类别:'采购', 对象:'采购计划',  编号:'CGP-'+baseSeq, 关键数据: apiData?.involved_subject || localRisk?.entity || '—', 风险说明: '待API返回' },
        { 类别:'合同', 对象:'关联合同',  编号:contractRef,    关键数据: apiData?.amount ? '¥'+apiData.amount+(apiData.amountUnit||'万') : localRisk?.amount ? '¥'+localRisk.amount+(localRisk.amountUnit||'') : '—', 风险说明:'待API返回' },
        { 类别:'资金', 对象:'银行流水',  编号:'LS-'+baseSeq,  关键数据: apiData?.amount ? '¥'+apiData.amount+(apiData.amountUnit||'万') : localRisk?.amount ? '¥'+localRisk.amount+(localRisk.amountUnit||'') : '—', 风险说明:'待API返回' },
        { 类别:'财务', 对象:'会计凭证',  编号:'PZ-'+baseSeq,  关键数据:'待API返回',  风险说明:'待API返回' },
      ],
      context: apiData.context || {},
      evidence: apiData.evidence || {}
    }
  }
  
  // 如果接口没有数据，从本地风险列表中获取
  if (localRisk) {
    return {
      ...localRisk,
      id: selectedRiskId.value, // 使用传入的编号作为 id
      no: localRisk.no || selectedRiskId.value, // 确保 no 字段正确
      alertTime: localRisk.warningTime || new Date().toLocaleString(),
      source: 'AI智能体 · 采购全量数据穿透',
      contractRef: 'HT-' + (localRisk.no || selectedRiskId.value).replace('CG-','').replace('R-CG-',''),
      statusFlow: '待核查 → 核查中 → 整改中 → 已闭环',
      currentStatusIdx: Math.max(0, progressSteps.findIndex(s => s.code === localRisk.statusCode))
    }
  }
  
  return null
})

// ============ 报告数据解析 ============
const getReportData = () => {
  try {
    return JSON.parse(
      activeRisk.value?.detailDescription ||
      activeRisk.value?.report ||
      '{}'
    )
  } catch (e) {
    console.error('报告解析失败', e)
    return {}
  }
}

const parsedReport = computed(() => {
  return getReportData()
})

const reportSections = computed(() => {
  return parsedReport.value.sections || {}
})

// 处理进度（computed，直接取接口返回的 progress_tracking）
const progressTracking = computed(() => {
  return activeRisk.value?.progressTracking || reportSections.value.progress_tracking || {}
})

// ============ 格式化章节内容 ============
const formatSectionContent = (content) => {
  if (!content) {
    return '<p class="empty-content">暂无内容</p>'
  }

  // 如果是 JSON 字符串
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      // 解析成功后递归处理
      return formatSectionContent(parsed)
    } catch (e) {
      // 不是 JSON 就继续正常处理
    }
  }

  // 数组处理
  if (Array.isArray(content)) {
    return content.map((item, index) => {
      if (typeof item === 'string') {
        return `<p>${index + 1}. ${item}</p>`
      }

      if (typeof item === 'object' && item !== null) {
        const label = item.label || item.title || ''
        const value = item.content || item.value || item.desc || ''

        return `
          <div class="section-item">
            <div class="item-title">
              ${index + 1}. ${label}
            </div>
            <div class="item-content">
              ${value}
            </div>
          </div>
        `
      }

      return `<p>${String(item)}</p>`
    }).join('')
  }

  // 对象处理
  if (typeof content === 'object' && content !== null) {
    // 有 items
    if (Array.isArray(content.items)) {
      return `
        <div class="section-wrapper">
          ${content.title ? `<div class="section-main-title">${content.title}</div>` : ''}
          ${formatSectionContent(content.items)}
        </div>
      `
    }

    // 普通对象
    return Object.entries(content)
      .map(([key, value]) => `
        <div class="object-row">
          <span class="obj-key">${key}：</span>
          <span class="obj-value">${value}</span>
        </div>
      `)
      .join('')
  }

  // 普通字符串
  let html = String(content)
  html = html.replace(/\\n/g, '<br>').trim()
  return `<p>${html}</p>`
}

// ============ 提取报告章节内容（从已解析的 reportSections 获取）============
const reportSectionOne = computed(() => {
  return reportSections.value.risk_warning?.content || ''
})

const reportSectionTwo = computed(() => {
  return reportSections.value.risk_definition?.content || ''
})

const reportSectionThree = computed(() => {
  const items = reportSections.value.calculation_logic?.items
  if (!items) return ''
  return items.map((item, idx) => `${idx + 1}. ${item.label}：${item.content}`).join('\n')
})

const reportSectionFour = computed(() => {
  const items = reportSections.value.cause_analysis?.items
  if (!items) return ''
  return items.map((item, idx) => `${idx + 1}. ${item.label}：${item.content}`).join('\n')
})

const reportSectionSix = computed(() => {
  const items = reportSections.value.rectification_suggestions?.items
  if (!items) return ''
  return items.map((item, idx) => `${idx + 1}. ${typeof item === 'string' ? item : item.content || item.label || JSON.stringify(item)}`).join('\n')
})

// ── 全局时间筛选 ────────────────────────────────────────────────────────
const periods = [
  { id:'month', label:'近1月' },
  { id:'quarter', label:'近3月' },
  { id:'half', label:'近半年' },
]
const periodLabel = computed(() => periods.find(p => p.id === timePeriod.value)?.label || '近半年')

const periodDataMap = {
  all:     { amount:'5,680', applyAmount:'4,250', contractAmount:'3,820', contractCount:856,
             savingRate:'8.2', highRisk:28, compliance:'98.5', radarScore:'89.3',
             riskHigh:28, riskMid:45, riskLow:20, riskTotal:93,
             bidAnomCount:8, acceptAnomCount:3, approvalAnomCount:5, penetAnomTotal:16,
             metrics:[
               { id:'m1', label:'采购合规率', value:'98.5%', color:'#0891B2' },
               { id:'m2', label:'平均采购周期', value:'18.5天', color:'#7C3AED' },
               { id:'m3', label:'节约金额', value:'¥465.8亿', color:'#D97706' },
               { id:'m4', label:'公开招标率', value:'72%', color:'#059669' },
               { id:'m5', label:'集中采购率', value:'65%', color:'#2563EB' },
             ],
             trendMonths:['06','07','08','09','10','11','12','01','02','03','04','05'],
             trendBar:[420,435,448,430,455,468,440,450,462,478,485,470],
             trendLine1:[7.2,7.5,7.8,7.4,7.6,7.9,7.5,7.8,8.0,8.1,8.3,8.2],
             trendLine2:[68,69,70,68,71,72,69,70,71,73,72,72],
             traffic:[
               { id:'t1', label:'应招未招', value:'0 笔', status:'ok' },
               { id:'t2', label:'化整为零', value:'0 笔', status:'ok' },
               { id:'t3', label:'虚假贸易', value:'0 笔', status:'ok' },
               { id:'t4', label:'融资性贸易', value:'2 笔', status:'warn' },
             ] },
  half:    { amount:'2,840', applyAmount:'2,120', contractAmount:'1,910', contractCount:428,
             savingRate:'8.1', highRisk:18, compliance:'98.8', radarScore:'90.1',
             riskHigh:18, riskMid:28, riskLow:12, riskTotal:58,
             bidAnomCount:5, acceptAnomCount:2, approvalAnomCount:3, penetAnomTotal:10,
             metrics:[
               { id:'m1', label:'采购合规率', value:'98.8%', color:'#0891B2' },
               { id:'m2', label:'平均采购周期', value:'17.8天', color:'#7C3AED' },
               { id:'m3', label:'节约金额', value:'¥230.1亿', color:'#D97706' },
               { id:'m4', label:'公开招标率', value:'73%', color:'#059669' },
               { id:'m5', label:'集中采购率', value:'66%', color:'#2563EB' },
             ],
             trendMonths:['12','01','02','03','04','05'],
             trendBar:[440,450,462,478,485,470],
             trendLine1:[7.5,7.8,8.0,8.1,8.3,8.2],
             trendLine2:[69,70,71,73,72,72],
             traffic:[
               { id:'t1', label:'应招未招', value:'0 笔', status:'ok' },
               { id:'t2', label:'化整为零', value:'0 笔', status:'ok' },
               { id:'t3', label:'虚假贸易', value:'0 笔', status:'ok' },
               { id:'t4', label:'融资性贸易', value:'1 笔', status:'warn' },
             ] },
  quarter: { amount:'1,420', applyAmount:'1,060', contractAmount:'955', contractCount:214,
             savingRate:'8.3', highRisk:12, compliance:'99.1', radarScore:'91.2',
             riskHigh:12, riskMid:18, riskLow:8, riskTotal:38,
             bidAnomCount:3, acceptAnomCount:1, approvalAnomCount:2, penetAnomTotal:6,
             metrics:[
               { id:'m1', label:'采购合规率', value:'99.1%', color:'#0891B2' },
               { id:'m2', label:'平均采购周期', value:'17.2天', color:'#7C3AED' },
               { id:'m3', label:'节约金额', value:'¥117.9亿', color:'#D97706' },
               { id:'m4', label:'公开招标率', value:'74%', color:'#059669' },
               { id:'m5', label:'集中采购率', value:'67%', color:'#2563EB' },
             ],
             trendMonths:['03','04','05'],
             trendBar:[478,485,470],
             trendLine1:[8.1,8.3,8.2],
             trendLine2:[73,72,72],
             traffic:[
               { id:'t1', label:'应招未招', value:'0 笔', status:'ok' },
               { id:'t2', label:'化整为零', value:'0 笔', status:'ok' },
               { id:'t3', label:'虚假贸易', value:'0 笔', status:'ok' },
               { id:'t4', label:'融资性贸易', value:'0 笔', status:'ok' },
             ] },
  month:   { amount:'480', applyAmount:'358', contractAmount:'322', contractCount:72,
             savingRate:'7.8', highRisk:4, compliance:'99.5', radarScore:'92.0',
             riskHigh:4, riskMid:8, riskLow:3, riskTotal:15,
             bidAnomCount:1, acceptAnomCount:1, approvalAnomCount:1, penetAnomTotal:3,
             metrics:[
               { id:'m1', label:'采购合规率', value:'99.5%', color:'#0891B2' },
               { id:'m2', label:'平均采购周期', value:'16.8天', color:'#7C3AED' },
               { id:'m3', label:'节约金额', value:'¥37.4亿', color:'#D97706' },
               { id:'m4', label:'公开招标率', value:'75%', color:'#059669' },
               { id:'m5', label:'集中采购率', value:'68%', color:'#2563EB' },
             ],
             trendMonths:['05'],
             trendBar:[470],
             trendLine1:[8.2],
             trendLine2:[72],
             traffic:[
               { id:'t1', label:'应招未招', value:'0 笔', status:'ok' },
               { id:'t2', label:'化整为零', value:'0 笔', status:'ok' },
               { id:'t3', label:'虚假贸易', value:'0 笔', status:'ok' },
               { id:'t4', label:'融资性贸易', value:'0 笔', status:'ok' },
             ] },
}
const pd = computed(() => periodDataMap[timePeriod.value])
const displayMetrics = computed(() => pd.value.metrics)
const traffic74Display = computed(() => pd.value.traffic)

// ── 十大风险域 ──────────────────────────────────────────────────────────
const riskMatrixByPeriod = {
  half: [
    { id:'RM1',  label:'应招未招',     total:0,  d7:0, d30:0,  health:'safe' },
    { id:'RM2',  label:'化整为零',     total:0,  d7:0, d30:0,  health:'safe' },
    { id:'RM3',  label:'围标串标',     total:16, d7:5, d30:11, health:'danger' },
    { id:'RM4',  label:'关联输送',     total:18, d7:7, d30:11, health:'danger' },
    { id:'RM5',  label:'单一来源滥用', total:11, d7:3, d30:8,  health:'warn' },
    { id:'RM6',  label:'异常低价',     total:10, d7:4, d30:6,  health:'warn' },
    { id:'RM7',  label:'资质挂靠',     total:8,  d7:2, d30:6,  health:'warn' },
    { id:'RM8',  label:'履约不符',     total:14, d7:5, d30:9,  health:'danger' },
    { id:'RM9',  label:'融资性贸易',   total:10, d7:3, d30:7,  health:'warn' },
    { id:'RM10', label:'空转走单',     total:6,  d7:1, d30:5,  health:'warn' },
  ],
  quarter: [
    { id:'RM1',  label:'应招未招',     total:0, d7:0, d30:0, health:'safe' },
    { id:'RM2',  label:'化整为零',     total:0, d7:0, d30:0, health:'safe' },
    { id:'RM3',  label:'围标串标',     total:9, d7:3, d30:6, health:'danger' },
    { id:'RM4',  label:'关联输送',     total:10,d7:4, d30:6, health:'danger' },
    { id:'RM5',  label:'单一来源滥用', total:6, d7:2, d30:4, health:'warn' },
    { id:'RM6',  label:'异常低价',     total:5, d7:2, d30:3, health:'warn' },
    { id:'RM7',  label:'资质挂靠',     total:4, d7:1, d30:3, health:'warn' },
    { id:'RM8',  label:'履约不符',     total:8, d7:3, d30:5, health:'danger' },
    { id:'RM9',  label:'融资性贸易',   total:5, d7:1, d30:4, health:'warn' },
    { id:'RM10', label:'空转走单',     total:3, d7:0, d30:3, health:'warn' },
  ],
  month: [
    { id:'RM1',  label:'应招未招',     total:0, d7:0, d30:0, health:'safe' },
    { id:'RM2',  label:'化整为零',     total:0, d7:0, d30:0, health:'safe' },
    { id:'RM3',  label:'围标串标',     total:5, d7:5, d30:0, health:'danger' },
    { id:'RM4',  label:'关联输送',     total:7, d7:7, d30:0, health:'danger' },
    { id:'RM5',  label:'单一来源滥用', total:3, d7:3, d30:0, health:'warn' },
    { id:'RM6',  label:'异常低价',     total:4, d7:4, d30:0, health:'warn' },
    { id:'RM7',  label:'资质挂靠',     total:2, d7:2, d30:0, health:'warn' },
    { id:'RM8',  label:'履约不符',     total:5, d7:5, d30:0, health:'danger' },
    { id:'RM9',  label:'融资性贸易',   total:3, d7:3, d30:0, health:'warn' },
    { id:'RM10', label:'空转走单',     total:1, d7:1, d30:0, health:'warn' },
  ],
}
riskMatrixByPeriod.all = riskMatrixByPeriod.half
const riskMatrix = computed(() => riskMatrixByPeriod[timePeriod.value] || riskMatrixByPeriod.half)

const supplierRanking = [
  { rank:1, name:'鼎信建设有限公司',     amount:285.6, riskCount:5, health:62, trend:-1, white:false, category:'土建工程' },
  { rank:2, name:'宏达建材有限公司',     amount:248.2, riskCount:3, health:82, trend: 1, white:true,  category:'材料采购' },
  { rank:3, name:'华东能源科技有限公司', amount:198.5, riskCount:1, health:92, trend: 1, white:true,  category:'设备采购' },
  { rank:4, name:'鼎信建设一公司',       amount:168.8, riskCount:8, health:58, trend:-1, white:false, category:'服务采购' },
  { rank:5, name:'华建信息技术有限公司', amount:125.3, riskCount:0, health:95, trend: 0, white:true,  category:'IT采购' },
  { rank:6, name:'恒通供应链管理有限公司',amount: 98.6, riskCount:8, health:62, trend:-1, white:false, category:'设备采购', story2:true,
    riskFlags:['围标串标','履约不符','单一来源滥用','中标集中度异常','报价规律雷同(固定差1.5%)','保证金同一账户','投标文件同一MAC上传','材料以次充好'] },
]

const riskList = [
  { id:'R-CG-001', no:'CG-2026001', name:'未验收即付款预警 · 关联输送', level:'red', levelLabel:'高风险',
    storyFocus:true, domain:'未验收付款',
    warningTime:'2026-05-21 09:40', entity:'采购部 / 鼎信建设一公司',
    status:'待整改', statusCode:'rectifying', amount:'40', amountUnit:'万',
    handler:'张伟（采购部）', deadline:'2026-05-28',
    detail:{
      riskItem:'二号车间维修工程，合同 HT-2026-0312 约定验收合格后付 80% 工程款 40 万元，工程未验收即提交付款申请待付。AI 穿透发现承接方鼎信建设一公司与集团供应商鼎信建设有限公司同受王建国控制，疑为未披露关联交易项下的利益输送。',
      causeAnalysis:[
        '采购计划 CGP-2026001，工程计划完工时间 2026-05-20，截至预警日已施工 60%，未验收。',
        '合同 HT-2026-0312 明确约定"验收合格后支付 80% 工程款"，付款节点未提前。',
        '工商穿透：王建国持鼎信建设有限公司 65% 股权，同时实际控制鼎信建设一公司（其弟王建军代持法人），本次采购未申报关联关系。',
        '资金穿透：近6月鼎信建设有限公司向鼎信建设一公司回流 ¥120 万（分3笔）。',
        '投标穿透：两家公司 3 场招标同一投标IP（116.62.45.21）、同一制单设备（MAC 00-1B-44-11-3A-B7）。',
      ],
      penetrationLinks:[
        { domain:'采购域', data:'采购计划 CGP-2026001' },
        { domain:'采购域', data:'采购验收记录 YS-2026-0312（缺失）' },
        { domain:'合同域', data:'合同详情 HT-2026-0312' },
        { domain:'资金域', data:'资金回流 ¥120万 / 3笔（鼎信建设→鼎信建设一公司）' },
        { domain:'财务域', data:'付款申请 FK-2026001（待付 ¥40万）' },
      ],
      rectificationSuggestions:[
        '立即冻结 CG-2026001 付款节点，启动关联输送专项审查。',
        '要求鼎信建设一公司补充关联关系披露材料与验收记录。',
        '问责：跳过验收确认、未核实关联关系的经办张伟与审批李强。',
        '系统设置"关联关系申报 + 验收记录必传"校验，无则无法提交付款申请。',
      ],
    },
  },
  { id:'R-CG-002', no:'CG-2026005', name:'围标串标预警', level:'red', levelLabel:'高风险',
    domain:'围标串标', story2Focus:true,
    warningTime:'2026-05-20 14:20', entity:'采购部 / 恒通供应链管理有限公司',
    status:'核查中', statusCode:'investigating', amount:'280', amountUnit:'万',
    handler:'孙磊（采购部）', deadline:'2026-05-25',
    summary:'AI 检测到 3 家投标单位的 IP / MAC 地址、报价节奏存在串通嫌疑。' },
  { id:'R-CG-007', no:'CG-2026041', name:'履约不符预警', level:'red', levelLabel:'高风险',
    domain:'履约不符', story2Focus:true,
    warningTime:'2026-05-20 16:05', entity:'工程部 / 恒通供应链管理有限公司',
    status:'核查中', statusCode:'investigating', amount:'40', amountUnit:'万',
    handler:'马涛（工程部）', deadline:'2026-05-26',
    summary:'三号厂房改造工程，恒通供应链交付与合同约定不符（材料以次充好、工程量缺口约 18%），却已通过验收并全额付款 ¥40万；与 CG-2026005 围标串标同属恒通，并案复合核查。',
    detail:{
      riskItem:'三号厂房改造工程（合同 HT-2026-0341，¥40万）由恒通供应链管理有限公司承接，AI 履约穿透发现实际交付与合同约定严重不符：钢材规格以次充好、工程量较结算量缺口约 18%，但验收记录全部判定「合格」并已全额付款。结合 CG-2026005「智能设备采购」围标串标线索，两单同属恒通供应链，并案为复合风险。',
      causeAnalysis:[
        '履约穿透：合同 HT-2026-0341 约定 Q345B 钢材，实际进场抽检为 Q235 替代（以次充好）；竣工结算工程量较现场复核缺口约 18%。',
        '验收穿透：验收记录 YS-2026-0341 各项均判「合格」，与现场抽检结论矛盾，验收把关流于形式。',
        '资金穿透：付款申请 FK-2026041 已按「验收合格」全额放行 ¥40万，履约不符却未触发任何扣款或追责。',
        '主体穿透：与 CG-2026005 围标串标同属恒通供应链管理有限公司（健康评分 62 / 8 个风险标记），由「设备采购 × 询价采购」热力深红格穿透定位 TOP6 并案。',
        '采购方式穿透：恒通在「设备采购 × 询价采购」格中标高度集中，规避公开招标迹象明显，履约监管同步缺位。',
      ],
      penetrationLinks:[
        { domain:'采购域', data:'采购单 CG-2026041（履约不符）/ 并案 CG-2026005（围标串标）' },
        { domain:'采购域', data:'验收记录 YS-2026-0341（判合格，与抽检矛盾）' },
        { domain:'合同域', data:'合同 HT-2026-0341（三号厂房改造工程 ¥40万）' },
        { domain:'质量域', data:'进场抽检：钢材 Q345B→Q235 以次充好 · 工程量缺口约 18%' },
        { domain:'财务域', data:'付款申请 FK-2026041（已全额支付 ¥40万）' },
      ],
      rectificationSuggestions:[
        '立即追回 / 扣减 CG-2026041 已付款，按履约不符重新核算并扣履约保证金。',
        '组织第三方复检与重新验收，整改不合格部位，问责原验收人。',
        '与 CG-2026005 围标串标并案，将恒通供应链列入重点监控，评分回升前不予新单准入。',
        '系统设置「验收抽检留痕 + 履约偏差预警」校验，结算与验收不一致即拦截付款。',
      ],
    },
  },
  { id:'R-CG-003', no:'CG-2026012', name:'未验收付款预警（二期）', level:'red', levelLabel:'高风险',
    domain:'未验收付款',
    warningTime:'2026-05-19 11:00', entity:'采购部 / 鼎信建设一公司',
    status:'核查中', statusCode:'investigating', amount:'40', amountUnit:'万',
    handler:'张伟（采购部）', deadline:'2026-05-26',
    summary:'二号车间维修工程（二期），同经办张伟、同供应商鼎信建设一公司，付款已走但验收单空缺，与 CG-2026001 同源。' },
  { id:'R-CG-004', no:'CG-2026018', name:'价格虚高预警', level:'orange', levelLabel:'中风险',
    domain:'价格虚高',
    warningTime:'2026-05-18 15:30', entity:'综合部 / 锐捷办公用品有限公司',
    status:'待核查', statusCode:'pending', amount:'56', amountUnit:'万',
    handler:'周敏（综合部）', deadline:'2026-05-30' },
  { id:'R-CG-005', no:'CG-2026025', name:'资质挂靠预警', level:'orange', levelLabel:'中风险',
    domain:'资质挂靠',
    warningTime:'2026-05-13 09:15', entity:'工程部 / 鼎信建设一公司',
    status:'整改中', statusCode:'rectifying', amount:'85', amountUnit:'万',
    handler:'周强（工程部）', deadline:'2026-05-27' },
  { id:'R-CG-006', no:'CG-2026033', name:'融资性贸易采购预警', level:'red', levelLabel:'高风险',
    domain:'融资性贸易',
    warningTime:'2026-05-12 13:45', entity:'风控部 / 鼎信物资贸易有限公司',
    status:'待核查', statusCode:'pending', amount:'150', amountUnit:'万',
    handler:'吴明（风控部）', deadline:'2026-05-26' },
]

const aiSuggestions = [
  { id:'AI-1', type:'CG-2026001 关联输送', priority:'high', priorityLabel:'高',
    content:'二号车间维修工程承接方鼎信建设一公司与集团供应商鼎信建设有限公司同受王建国控制，未验收即待付 40 万元，建议立即冻结付款并启动专项审查。' },
  { id:'AI-2', type:'合规风险预警', priority:'high', priorityLabel:'高',
    content:'发现鼎信系在途关联标的合计 ¥360 万（CG-2026001/005/012），建议并案启动专项排查。' },
  { id:'AI-3', type:'供应商管理', priority:'medium', priorityLabel:'中',
    content:'鼎信建设一公司健康评分仅 58 分、近年密集中标本集团 5 个项目，建议重点关注关联关系与白名单准入。' },
]
const systemEntries = [
  { id:'sys1', icon:'SRM', label:'SRM 系统' },{ id:'sys2', icon:'ERP', label:'ERP 系统' },
  { id:'sys3', icon:'招', label:'招采平台' },{ id:'sys4', icon:'同', label:'合同系统' },
]
const progressSteps = [
  { code:'pending', label:'待核查' },{ code:'investigating', label:'核查中' },
  { code:'rectifying', label:'整改中' },{ code:'closed', label:'已闭环' },
]
const statusLabelMap = { '待核查':'pending','核查中':'investigating','整改中':'rectifying','已闭环':'closed','待整改':'rectifying' }
function getStatusIdx(label) {
  const code = statusLabelMap[label] || label
  return Math.max(0, progressSteps.findIndex(s => s.code === code || s.label === label))
}
// 从责任人字符串中提取纯姓名（去掉部门前缀）
function extractNames(fullStr) {
  if (!fullStr) return fullStr || ''
  // 去掉 "设备工程部/财务管理部/审计风控部，" 前缀，取逗号后面的部分
  const parts = fullStr.split('，')
  return parts.length > 1 ? parts[1] : fullStr
}
// 去掉字符串开头的序号（如 "1. " 或 "1、"
function stripLeadingNumber(str) {
  return String(str).replace(/^\d+[.、]\s*/, '')
}
const drawerAccordions = [
  { id:'proc', title:'采购端原因分析', icon:'采', domain:'procurement' },
  { id:'pene', title:'关联数据穿透链接', icon:'链', domain:'link' },
  { id:'rect', title:'整改建议', icon:'改', domain:'rectify' },
  { id:'prog', title:'处理进度', icon:'进', domain:'progress' },
]

// ── 穿透弹窗数据 ────────────────────────────────────────────────────────
const bidAnomalies = [
  { project:'二号车间维修工程',   code:'CG-2026001', winner:'鼎信建设一公司',   type:'同源投标/关联未披露', level:'高', lvClass:'high', status:'待整改', route:'1' },
  { project:'智能设备采购项目',   code:'CG-2026005', winner:'恒通供应链管理有限公司', type:'三家投标同源',     level:'高', lvClass:'high', status:'核查中', route:'2' },
  { project:'厂区绿化养护',       code:'CG-2026025', winner:'绿源园林工程有限公司', type:'评分标准不一致',     level:'中', lvClass:'mid',  status:'待整改' },
  { project:'厂区道路修缮工程',   code:'CG-2026031', winner:'华路路桥有限公司',     type:'评标时间异常',       level:'中', lvClass:'mid',  status:'待核查' },
  { project:'办公装修项目',       code:'CG-2026038', winner:'雅居装饰有限公司',     type:'围标串标嫌疑',       level:'高', lvClass:'high', status:'核查中' },
  { project:'消防设备采购',       code:'CG-2026042', winner:'安泰消防器材有限公司', type:'资质审查缺失',       level:'中', lvClass:'mid',  status:'待整改' },
  { project:'信息系统升级',       code:'CG-2026055', winner:'华建信息技术有限公司', type:'评标流程不合规',     level:'低', lvClass:'low',  status:'已闭环' },
  { project:'仓储物流外包项目',   code:'CG-2026061', winner:'华东仓储物流公司',     type:'专家资质存疑',       level:'中', lvClass:'mid',  status:'核查中' },
]
const acceptAnomalies = [
  { contract:'HT-2026-0312', project:'二号车间维修工程',     supplier:'鼎信建设一公司', amount:'40万',  time:'2026-05-21', acceptStatus:'未验收',   requirement:'冻结付款并启动关联输送审查', route:'1' },
  { contract:'HT-2026-0341', project:'三号厂房改造工程',     supplier:'恒通供应链管理有限公司', amount:'40万',  time:'2026-05-20', acceptStatus:'验收不实',   requirement:'履约不符·追回扣款并重新验收，与围标并案处置', route:'2' },
  { contract:'HT-2026-0301', project:'二号车间维修工程（二期）', supplier:'鼎信建设一公司', amount:'40万',  time:'2026-05-19', acceptStatus:'未验收',   requirement:'付款已走，补验收并并案核查' },
  { contract:'HT-2026-0318', project:'外墙翻新工程',         supplier:'宏达建材有限公司', amount:'28万',  time:'2026-05-18', acceptStatus:'部分验收', requirement:'完成全部验收后付余款' },
]
const approvalAnomalies = [
  { item:'二号车间维修工程定标', approver:'李强', time:'2026-05-21', reason:'关联关系未要求披露', level:'高', lvClass:'high', responsible:'李强', deadline:'2026-05-28', route:'3' },
  { item:'智能设备采购定标',     approver:'李强', time:'2026-05-20', reason:'同源投标未识别',     level:'高', lvClass:'high', responsible:'李强', deadline:'2026-05-25', route:'2' },
  { item:'材料采购定标',         approver:'陈晓', time:'2026-05-15', reason:'审批依据不充分',     level:'低', lvClass:'low',  responsible:'陈晓', deadline:'2026-05-28' },
  { item:'服务采购定标',         approver:'赵刚', time:'2026-05-17', reason:'利益冲突未回避',     level:'中', lvClass:'mid',  responsible:'赵刚', deadline:'2026-05-26' },
]

const heatmapCategories = ['土建工程','安装工程','设备采购','材料采购','服务采购','IT采购','咨询服务','其他']
const heatmapMethods    = ['公开招标','竞争性谈判','单一来源','询价采购','框架协议','直接采购','委托代理','其他']
const heatmapValsByPeriod = {
  half: [
    [85,12,8,15,20,5,3,2],[72,18,5,22,15,8,4,6],[45,25,15,35,28,12,8,5],[38,22,18,45,32,15,5,8],
    [25,18,12,28,42,22,15,10],[18,15,8,12,25,35,18,5],[12,10,5,8,15,8,28,6],[5,8,3,6,10,4,3,12],
  ],
  quarter: [
    [47,7,4,8,11,3,2,1],[40,10,3,12,8,4,2,3],[25,14,8,19,15,7,4,3],[21,12,10,25,18,8,3,4],
    [14,10,7,15,23,12,8,6],[10,8,4,7,14,19,10,3],[7,6,3,4,8,4,15,3],[3,4,2,3,6,2,2,7],
  ],
  month: [
    [19,3,2,3,4,1,1,0],[16,4,1,5,3,2,1,1],[10,6,3,8,6,3,2,1],[8,5,4,10,7,3,1,2],
    [6,4,3,6,9,5,3,2],[4,3,2,3,6,8,4,1],[3,2,1,2,3,2,6,1],[1,2,1,1,2,1,1,3],
  ],
}
heatmapValsByPeriod.all = heatmapValsByPeriod.half
const heatmapBaseValues = computed(() => heatmapValsByPeriod[timePeriod.value] || heatmapValsByPeriod.half)

// ── Computed ───────────────────────────────────────────────────────────────
const highRiskCount = computed(() => riskList.filter(r => r.level === 'red').length)
const penetModalTitle = computed(() => {
  if (penetModalType.value === 'bid')      return '评标定标异常明细（8笔）'
  if (penetModalType.value === 'accept')   return '验收支付异常明细（3笔）'
  if (penetModalType.value === 'approval') return '定标审批异常明细（5笔）'
  return ''
})
const filteredRiskMatrix = computed(() => {
  if (riskFilter.value === 'danger') return riskMatrix.value.filter(r => r.health === 'danger')
  if (riskFilter.value === 'warn')   return riskMatrix.value.filter(r => r.health === 'warn')
  if (riskFilter.value === 'safe')   return riskMatrix.value.filter(r => r.health === 'safe')
  return riskMatrix.value
})

const radarOption = computed(() => ({
  animation:false, backgroundColor:'transparent',
  radar:{
    indicator:[{name:'规模',max:100},{name:'节资',max:100},{name:'公开',max:100},
      {name:'集中',max:100},{name:'合规',max:100},{name:'时效',max:100}],
    center:['50%','55%'], radius:'64%', shape:'polygon', nameGap:6,
    axisName:{color:'#475569',fontSize:11,fontWeight:600}, splitNumber:4,
    axisLine:{lineStyle:{color:'rgba(37,99,235,0.18)'}},
    splitLine:{lineStyle:{color:'rgba(37,99,235,0.12)'}},
    splitArea:{areaStyle:{color:['rgba(37,99,235,0.03)','rgba(37,99,235,0.07)']}},
  },
  series:[{type:'radar',symbol:'circle',symbolSize:5,
    data:[{value:[85,82,72,65,98,94],name:'采购评分',
      areaStyle:{color:'rgba(37,99,235,0.12)'},lineStyle:{color:'#2563EB',width:2},itemStyle:{color:'#2563EB'}}]}],
}))

const riskBarOption = computed(() => {
  const rows = [...filteredRiskMatrix.value].sort((a,b)=>(b.d7*3+b.d30)-(a.d7*3+a.d30))
  if (riskFilter.value === 'safe') {
    return { animation:false, backgroundColor:'transparent',
      graphic:[{type:'text',left:'center',top:'middle',
        style:{text:'✓  应招未招 / 化整为零 均为 0，合规达标',font:'bold 12px Microsoft YaHei',fill:'#059669'}}] }
  }
  const cP={danger:'#EF4444',warn:'#F59E0B',safe:'#10B981'}
  const cS={danger:'rgba(239,68,68,0.22)',warn:'rgba(245,158,11,0.2)',safe:'rgba(16,185,129,0.18)'}
  return {
    animation:false, backgroundColor:'transparent',
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'rgba(255,255,255,0.97)',borderColor:'#E2E8F0',
      textStyle:{color:'#334155',fontSize:11},extraCssText:'box-shadow:0 4px 20px rgba(15,23,42,0.1)',
      formatter:(p)=>{const r=rows[p[0].dataIndex];return r?`<b>${r.label}</b><br/>近7天: <b style="color:${cP[r.health]}">${r.d7}</b> 近30天: <b>${r.d30}</b> 合计: <b>${r.total}</b>`:''}},
    legend:{top:0,right:0,itemWidth:8,itemHeight:8,textStyle:{color:'#94A3B8',fontSize:9},data:['近7天','近30天']},
    grid:{left:4,right:30,top:18,bottom:2,containLabel:true},
    xAxis:{type:'value',axisLabel:{color:'#CBD5E1',fontSize:9},splitLine:{lineStyle:{color:'#F1F5F9',type:'dashed'}},axisLine:{show:false},axisTick:{show:false}},
    yAxis:{type:'category',data:rows.map(r=>r.label),axisLabel:{color:'#475569',fontSize:9},axisLine:{lineStyle:{color:'#E8EDF5'}},axisTick:{show:false},inverse:true},
    series:[
      {name:'近7天',type:'bar',barMaxWidth:12,stack:'risk',data:rows.map(r=>({value:r.d7,itemStyle:{color:cP[r.health]}})),itemStyle:{borderRadius:[0,0,0,0]}},
      {name:'近30天',type:'bar',barMaxWidth:12,stack:'risk',data:rows.map(r=>({value:r.d30,itemStyle:{color:cS[r.health]}})),itemStyle:{borderRadius:[0,3,3,0]},
        label:{show:true,position:'right',fontSize:9,color:'#94A3B8',formatter:(p)=>{const r=rows[p.dataIndex];return r?`${r.total}`:''}}},
    ],
  }
})

// 「十大风险域」的趋势图表现形式（写死示例：对话切换 / 表头切换触发；适配 B1 区域）
const riskTrendOption = computed(() => {
  const rows = [...filteredRiskMatrix.value].sort((a,b)=>(b.d7*3+b.d30)-(a.d7*3+a.d30))
  if (riskFilter.value === 'safe') {
    return { animation:false, backgroundColor:'transparent',
      graphic:[{type:'text',left:'center',top:'middle',
        style:{text:'✓  应招未招 / 化整为零 均为 0，合规达标',font:'bold 12px Microsoft YaHei',fill:'#059669'}}] }
  }
  const cats = rows.map(r=>r.label)
  return {
    animation:true, animationDuration:500, backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'rgba(255,255,255,0.97)',borderColor:'#E2E8F0',textStyle:{color:'#334155',fontSize:11},extraCssText:'box-shadow:0 4px 20px rgba(15,23,42,0.1)',
      formatter:(p)=>{const r=rows[p[0].dataIndex];return r?`<b>${r.label}</b><br/>近7天: <b style="color:#EF4444">${r.d7}</b> 近30天: <b style="color:#F59E0B">${r.d30}</b> 合计: <b>${r.total}</b>`:''}},
    legend:{top:0,right:0,itemWidth:10,itemHeight:6,textStyle:{color:'#94A3B8',fontSize:9},data:['近7天','近30天']},
    grid:{left:4,right:12,top:18,bottom:42,containLabel:true},
    xAxis:{type:'category',data:cats,boundaryGap:false,axisLabel:{color:'#64748B',fontSize:8.5,rotate:34,interval:0},axisLine:{lineStyle:{color:'#E8EDF5'}},axisTick:{show:false}},
    yAxis:{type:'value',axisLabel:{color:'#CBD5E1',fontSize:9},splitLine:{lineStyle:{color:'#F1F5F9',type:'dashed'}},axisLine:{show:false},axisTick:{show:false}},
    series:[
      {name:'近7天',type:'line',smooth:true,symbol:'circle',symbolSize:5,data:rows.map(r=>r.d7),
        lineStyle:{width:2.4,color:'#EF4444'},itemStyle:{color:'#EF4444'},areaStyle:{color:'rgba(239,68,68,0.14)'}},
      {name:'近30天',type:'line',smooth:true,symbol:'circle',symbolSize:5,data:rows.map(r=>r.d30),
        lineStyle:{width:2.4,color:'#F59E0B'},itemStyle:{color:'#F59E0B'},areaStyle:{color:'rgba(245,158,11,0.12)'},
        label:{show:true,position:'top',fontSize:9,color:'#94A3B8',formatter:(p)=>{const r=rows[p.dataIndex];return r?`${r.total}`:''}}},
    ],
  }
})
// B1 当前表现形式：bar | trend（受 layoutState.b1Chart 驱动，可对话/手动切换）
const b1ChartMode = computed(() => layoutState.b1Chart || 'bar')
const b1ChartOption = computed(() => b1ChartMode.value === 'trend' ? riskTrendOption.value : riskBarOption.value)
function setB1Chart(mode) { layoutState.b1Chart = mode }

// ── 专题视图（对话「相关的都集中/专题/关联链路」时左列纵向呈现的可视化）──────────
// 1) 该风险（CG-2026001 未验收即付款·关联输送）项目时间线
const topicTimelineEvents = [
  { date:'03-12', label:'合同签订 HT-2026-0312', lv:'safe' },
  { date:'04-18', label:'鼎信建设一公司中标', lv:'warn' },
  { date:'05-10', label:'提交付款申请 ¥40万', lv:'warn' },
  { date:'05-16', label:'未验收即付款预警', lv:'danger' },
  { date:'05-22', label:'关联输送·回流¥120万', lv:'danger' },
  { date:'05-28', label:'整改期限', lv:'warn' },
]
// 时间线改为纵向时间轴（HTML 渲染，见模板 .topic-timeline），不再用图表
// 2) 鼎信建设一公司 · 风险画像（该项目供应商风险专题，雷达图）
const topicSupplierRadarOption = computed(() => {
  const indicator = [
    { name:'关联输送', max:100 },
    { name:'资金回流', max:100 },
    { name:'未验收付款', max:100 },
    { name:'围标串标', max:100 },
    { name:'中标集中度', max:100 },
    { name:'资质合规', max:100 },
  ]
  const val = [92, 85, 88, 78, 80, 62]
  return {
    animation:true, animationDuration:700, backgroundColor:'transparent',
    tooltip:{ trigger:'item', backgroundColor:'rgba(255,255,255,0.97)', borderColor:'#E2E8F0',
      textStyle:{color:'#334155',fontSize:11}, extraCssText:'box-shadow:0 4px 20px rgba(15,23,42,0.1)' },
    radar:{
      center:['50%','55%'], radius:'64%', indicator,
      axisName:{ color:'#475569', fontSize:9.5 },
      splitNumber:4,
      splitLine:{ lineStyle:{ color:'#E8EDF5' } },
      splitArea:{ areaStyle:{ color:['rgba(241,245,249,0.6)','rgba(255,255,255,0)'] } },
      axisLine:{ lineStyle:{ color:'#E8EDF5' } },
    },
    series:[{
      type:'radar', symbol:'circle', symbolSize:4,
      data:[{ value:val, name:'鼎信建设一公司 风险指数',
        lineStyle:{ color:'#2563EB', width:2 }, itemStyle:{ color:'#2563EB' },
        areaStyle:{ color:'rgba(37,99,235,0.16)' },
        label:{ show:true, fontSize:9, color:'#1D4ED8', formatter:(p)=>p.value } }],
    }],
  }
})

const darkTrendOption = computed(() => {
  const d = pd.value
  return {
    animation:false, backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'rgba(255,255,255,0.97)',borderColor:'#E2E8F0',textStyle:{color:'#334155',fontSize:11},extraCssText:'box-shadow:0 4px 20px rgba(15,23,42,0.1)'},
    legend:{top:2,left:'center',itemGap:10,itemWidth:10,itemHeight:6,textStyle:{color:'#64748B',fontSize:10}},
    grid:{left:8,right:8,top:36,bottom:4,containLabel:true},
    xAxis:{type:'category',data:d.trendMonths,axisLabel:{color:'#94A3B8',fontSize:10},axisLine:{lineStyle:{color:'#E2E8F0'}},axisTick:{show:false}},
    yAxis:[
      {type:'value',name:'金额(亿)',nameTextStyle:{color:'#94A3B8',fontSize:9},axisLabel:{color:'#94A3B8',fontSize:10},splitLine:{lineStyle:{color:'#F1F5F9'}}},
      {type:'value',name:'%',nameTextStyle:{color:'#94A3B8',fontSize:9},axisLabel:{color:'#94A3B8',fontSize:10,formatter:'{value}%'},splitLine:{show:false},max:100},
    ],
    series:[
      {name:'采购金额',type:'bar',barWidth:8,yAxisIndex:0,
        itemStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'#3B82F6'},{offset:1,color:'rgba(59,130,246,0.25)'}]},borderRadius:[3,3,0,0]},data:d.trendBar},
      {name:'节资率',type:'line',smooth:true,symbol:'circle',symbolSize:4,yAxisIndex:1,lineStyle:{width:2,color:'#10B981'},itemStyle:{color:'#10B981'},data:d.trendLine1},
      {name:'公开招标率',type:'line',smooth:true,symbol:'circle',symbolSize:4,yAxisIndex:1,lineStyle:{width:2,color:'#F59E0B'},itemStyle:{color:'#F59E0B'},data:d.trendLine2},
    ],
  }
})

// B2 网络：真实主体命名（无 XX 占位）。故事线一红链：
// 华东建设集团 → 鼎信建设有限公司 → 鼎信建设一公司 → 二号车间维修工程，叠加王建国隐性控制边 + 资金回流边 + 同源投标虚线
const netNodes = [
      /* 集团中心 */
      {name:'华东建设集团',x:260,y:135,symbolSize:48,tier:'集团',amount:5680,riskLabel:'中',
        itemStyle:{color:'#F97316',shadowColor:'rgba(249,115,22,0.5)',shadowBlur:14},label:{position:'inside',fontSize:9,color:'#FFF'}},
      /* ── 上方 2 分支 ── */
      {name:'华建科技公司',x:182,y:52,symbolSize:26,tier:'二级',amount:580,riskLabel:'低',itemStyle:{color:'#3B82F6'},label:{position:'top'}},
      {name:'智慧园区信息系统',x:110,y:10,symbolSize:14,tier:'项目',amount:120,riskLabel:'低',itemStyle:{color:'#93C5FD'},label:{position:'top',fontSize:7}},
      {name:'华建工程监理公司',x:338,y:52,symbolSize:24,tier:'二级',amount:320,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'top'}},
      {name:'厂区安防改造项目',x:415,y:10,symbolSize:14,tier:'项目',amount:85,riskLabel:'低',itemStyle:{color:'#6EE7B7'},label:{position:'top',fontSize:7}},
      /* ── 下方 2 分支 ── */
      {name:'华东仓储物流公司',x:182,y:218,symbolSize:22,tier:'二级',amount:420,riskLabel:'中',itemStyle:{color:'#FBBF24'},label:{position:'bottom'}},
      {name:'仓储建设项目',x:110,y:258,symbolSize:14,tier:'项目',amount:95,riskLabel:'低',itemStyle:{color:'#93C5FD'},label:{position:'bottom',fontSize:7}},
      {name:'恒通供应链管理有限公司',x:338,y:218,symbolSize:26,tier:'二级',amount:850,riskLabel:'高',itemStyle:{color:'#EF4444'},label:{position:'bottom'}},
      {name:'智能设备采购项目',x:415,y:258,symbolSize:14,tier:'项目',amount:150,riskLabel:'中',itemStyle:{color:'#FCD34D'},label:{position:'bottom',fontSize:7}},
      /* ── 左侧 3 分支 ── */
      {name:'华东能源公司',x:125,y:80,symbolSize:32,tier:'二级',amount:1680,riskLabel:'中',itemStyle:{color:'#F97316'},label:{position:'left'}},
      {name:'光伏发电项目',x:38,y:35,symbolSize:14,tier:'项目',amount:280,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'left',fontSize:7}},
      {name:'宏达建材公司',x:100,y:135,symbolSize:22,tier:'二级',amount:460,riskLabel:'中',itemStyle:{color:'#F59E0B'},label:{position:'left'}},
      {name:'厂区管网改造',x:22,y:135,symbolSize:12,tier:'项目',amount:75,riskLabel:'低',itemStyle:{color:'#93C5FD'},label:{position:'left',fontSize:7}},
      {name:'清源环保公司',x:125,y:190,symbolSize:22,tier:'二级',amount:380,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'left'}},
      {name:'排污治理项目',x:38,y:235,symbolSize:14,tier:'项目',amount:90,riskLabel:'低',itemStyle:{color:'#6EE7B7'},label:{position:'left',fontSize:7}},
      /* ── 右侧 3 分支（含故事线一高亮红链）── */
      {name:'鼎信建设有限公司',x:395,y:80,symbolSize:36,tier:'供应商',amount:2100,riskLabel:'高',
        itemStyle:{color:'#EF4444',shadowColor:'rgba(239,68,68,0.3)',shadowBlur:8}},
      {name:'鼎信建设一公司',x:470,y:40,symbolSize:22,tier:'关联供应商',amount:450,riskLabel:'高',itemStyle:{color:'#EF4444'}},
      {name:'二号车间维修工程',x:530,y:10,symbolSize:16,tier:'项目',amount:40,riskLabel:'高',
        itemStyle:{color:'#DC2626',shadowColor:'rgba(220,38,38,0.5)',shadowBlur:12},label:{position:'top',fontSize:7}},
      /* 王建国：隐性实控人；王建军：代持法人 */
      {name:'王建国',x:455,y:120,symbolSize:26,tier:'自然人',amount:0,riskLabel:'高',
        itemStyle:{color:'#B91C1C',shadowColor:'rgba(185,28,28,0.5)',shadowBlur:10},label:{position:'right',fontSize:8}},
      {name:'王建军（王建国之弟）',x:545,y:90,symbolSize:16,tier:'自然人',amount:0,riskLabel:'中',itemStyle:{color:'#F59E0B'},label:{position:'right',fontSize:7}},
      {name:'鼎信物资贸易有限公司',x:395,y:190,symbolSize:22,tier:'关联方',amount:360,riskLabel:'中',itemStyle:{color:'#F59E0B'},label:{position:'bottom'}},
      {name:'仓储物流外包项目',x:490,y:240,symbolSize:14,tier:'项目',amount:110,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'bottom',fontSize:7}},
]
const netLinks = [
      /* 集团→上方 */
      {source:'华东建设集团',target:'华建科技公司',lineStyle:{width:1.4,color:'#3B82F6'}},
      {source:'华东建设集团',target:'华建工程监理公司',lineStyle:{width:1.2,color:'#10B981'}},
      /* 集团→下方 */
      {source:'华东建设集团',target:'华东仓储物流公司',lineStyle:{width:1.2,color:'#FBBF24'}},
      {source:'华东建设集团',target:'恒通供应链管理有限公司',relation:'设备采购·询价（中标集中）',lineStyle:{width:1.8,color:'#EF4444',opacity:0.6}},
      /* 集团→左侧 */
      {source:'华东建设集团',target:'华东能源公司',lineStyle:{width:1.8,color:'#F97316',opacity:0.8}},
      {source:'华东建设集团',target:'宏达建材公司',lineStyle:{width:1.2,color:'#F59E0B'}},
      {source:'华东建设集团',target:'清源环保公司',lineStyle:{width:1.2,color:'#10B981'}},
      /* 集团→右侧 故事线一高亮红链 */
      {source:'华东建设集团',target:'鼎信建设有限公司',relation:'采购合同（多笔）',lineStyle:{width:2.8,color:'#EF4444',opacity:0.95}},
      {source:'华东建设集团',target:'二号车间维修工程',relation:'采购单 CG-2026001',lineStyle:{width:1.4,color:'#EF4444',opacity:0.5,type:'dashed'}},
      {source:'华东建设集团',target:'鼎信物资贸易有限公司',lineStyle:{width:1.2,color:'#F59E0B'}},
      /* 上方延伸→项目 */
      {source:'华建科技公司',target:'智慧园区信息系统'},
      {source:'华建工程监理公司',target:'厂区安防改造项目'},
      /* 下方延伸→项目 */
      {source:'华东仓储物流公司',target:'仓储建设项目'},
      {source:'恒通供应链管理有限公司',target:'智能设备采购项目',relation:'中标承接 CG-2026005（围标串标·3家同源）',lineStyle:{width:2.2,color:'#EF4444',opacity:0.9}},
      /* 左侧延伸→项目 */
      {source:'华东能源公司',target:'光伏发电项目'},
      {source:'宏达建材公司',target:'厂区管网改造'},
      {source:'清源环保公司',target:'排污治理项目'},
      /* 右侧延伸→项目 高亮路径续 */
      {source:'鼎信建设有限公司',target:'鼎信建设一公司',relation:'近6月资金回流 ¥120万（分3笔）',lineStyle:{width:2.8,color:'#DC2626',opacity:1}},
      {source:'鼎信建设一公司',target:'二号车间维修工程',relation:'中标承接',lineStyle:{width:2.8,color:'#DC2626',opacity:1}},
      /* 王建国隐性控制 + 同源投标 + 资金通道 */
      {source:'王建国',target:'鼎信建设有限公司',relation:'持股65%（控股）',lineStyle:{width:2,color:'#B91C1C',opacity:0.9}},
      {source:'王建国',target:'鼎信建设一公司',relation:'实际控制（未披露）',lineStyle:{width:2,color:'#B91C1C',opacity:0.9,type:'dashed'}},
      {source:'王建军（王建国之弟）',target:'鼎信建设一公司',relation:'法人/代持',lineStyle:{width:1.2,color:'#F59E0B',type:'dashed'}},
      {source:'鼎信建设一公司',target:'鼎信物资贸易有限公司',relation:'资金往来',lineStyle:{width:1.2,color:'#F59E0B',type:'dashed'}},
]
// 故事线一红链节点集合（含隐性实控人）
const storyChainNodes = ['华东建设集团','鼎信建设有限公司','鼎信建设一公司','二号车间维修工程','王建国','王建军（王建国之弟）','鼎信物资贸易有限公司']
// 联动高亮：选中风险域时，高亮该域涉及主体、淡化其余
const darkNetworkOption = computed(() => {
  // 优先用穿透上下文（含穿透层逐层收窄）；否则回退到风险域点击高亮
  const ctxStory = penetrationContext.active && penetrationContext.highlightNodes.length
  const hi = ctxStory
    ? new Set([...penetrationContext.highlightNodes, '华东建设集团'])
    : (story2.clueOpen ? new Set(STORY2_NET_NODES)
    : (activeRiskDomain.value ? new Set([...(riskDomainNodes[activeRiskDomain.value] || []), '华东建设集团']) : null))
  const data = netNodes.map(n => {
    if (!hi) return n
    if (hi.has(n.name)) return { ...n, itemStyle:{ ...(n.itemStyle||{}), borderColor:'#2563EB', borderWidth:3, shadowColor:'rgba(37,99,235,0.55)', shadowBlur:18, opacity:1 }, label:{ ...(n.label||{}), opacity:1 } }
    return { ...n, itemStyle:{ ...(n.itemStyle||{}), opacity:0.1 }, label:{ ...(n.label||{}), opacity:0.1 } }
  })
  const links = netLinks.map(l => {
    if (!hi) return l
    const on = hi.has(l.source) && hi.has(l.target)
    return {
      ...l,
      lineStyle:{ ...(l.lineStyle||{}), opacity: on ? 0.95 : 0.05, width: on ? Math.max(2.6, l.lineStyle?.width || 0) : (l.lineStyle?.width || 1) },
      label: on && l.relation ? { show:true, formatter:l.relation, fontSize:7, color:'#B91C1C', fontWeight:600 } : { show:false },
    }
  })
  return {
    animation:false, backgroundColor:'transparent',
    tooltip:{trigger:'item',backgroundColor:'rgba(255,255,255,0.97)',borderColor:'#E2E8F0',textStyle:{color:'#334155',fontSize:11},extraCssText:'box-shadow:0 4px 20px rgba(15,23,42,0.1)',
      formatter:({data})=>data?.name?`<b>${data.name}</b><br/>层级：${data.tier||'-'}<br/>采购金额：${data.amount||'-'} 亿<br/>风险：${data.riskLabel||'-'}`:''
    },
    series:[{
      type:'graph',layout:'none',roam:true,draggable:true,
      edgeSymbol:['none','arrow'],edgeSymbolSize:[0,5],
      lineStyle:{color:'#CBD5E1',width:1.1,curveness:0.12},
      label:{show:true,position:'right',fontSize:8,color:'#475569',fontWeight:600,distance:3},
      emphasis:{focus:'adjacency',lineStyle:{width:2.5}},
      data, links,
    }],
  }
})

const heatmapOption = computed(() => {
  // 故事线二入口：标注「设备采购 × 询价采购」深红格（虚线红框提示可点；选中后实线高亮）
  const data=[];heatmapBaseValues.value.forEach((row,ci)=>{row.forEach((v,mi)=>{
    if (mi===STORY2_HEAT.mi && ci===STORY2_HEAT.ci) {
      data.push({ value:[mi,ci,v], itemStyle: story2.heatHl
        ? { borderColor:'#7F1D1D', borderWidth:3, shadowBlur:12, shadowColor:'rgba(185,28,28,0.55)' }
        : { borderColor:'#DC2626', borderWidth:1.6, borderType:'dashed' } })
    } else data.push([mi,ci,v])
  })})
  return {
    animation:false,backgroundColor:'transparent',
    tooltip:{position:'top',backgroundColor:'rgba(255,255,255,0.97)',borderColor:'#E2E8F0',textStyle:{color:'#334155',fontSize:11},
      formatter:(p)=>`${heatmapCategories[p.value[1]]} × ${heatmapMethods[p.value[0]]}<br/>数量: ${p.value[2]}`},
    grid:{left:52,right:6,top:4,bottom:52,containLabel:false},
    xAxis:{type:'category',data:heatmapMethods,axisLabel:{color:'#64748B',fontSize:8,rotate:28,interval:0},
      axisLine:{lineStyle:{color:'#E2E8F0'}},splitArea:{show:true,areaStyle:{color:['#F8FAFC','#FFF']}}},
    yAxis:{type:'category',data:heatmapCategories,axisLabel:{color:'#64748B',fontSize:8},
      axisLine:{lineStyle:{color:'#E2E8F0'}},splitArea:{show:true,areaStyle:{color:['#F8FAFC','#FFF']}}},
    visualMap:{min:0,max:45,show:false,inRange:{color:['#F1F5F9','#DBEAFE','#93C5FD','#FDE68A','#FDBA74','#F87171','#B91C1C']}},
    series:[{name:'热力',type:'heatmap',data,
      label:{show:true,fontSize:9,formatter:(p)=>p.value[2]?String(p.value[2]):'',color:(p)=>p.value[2]>25?'#FFF':'#374151'},
      emphasis:{itemStyle:{shadowBlur:10,shadowColor:'rgba(239,68,68,0.35)'}}}],
  }
})

// ── Functions ──────────────────────────────────────────────────────────────
function openDrawer(r){ drawerRisk.value=r; drawerOpen.value=true; accordionOpen.value=new Set(['proc']) }
function toggleAcc(id){ const s=new Set(accordionOpen.value); s.has(id)?s.delete(id):s.add(id); accordionOpen.value=s }
function formatTime(s){ if(!s) return ''; const m=s.match(/(\d{2}:\d{2})/); return m ? m[1] : s.slice(-5) }

// ── AI 检测报告：先显示弹窗动画，完成后执行真实逻辑 ─────────────────────
function openReport(r) {
  // 故事线一：点 CG-2026001（焦点单据）「AI 分析」即写穿透上下文，联动高亮红链 + 定位卡片
  storyReportActive.value = !!r.storyFocus
  if (r.storyFocus) {
    activateRelatedTransfer('realtime')
    drillStack.value = []
    selectedPlan.value = ''
    executionVisible.value = []
    resetDisposition()
  }
  // 故事线二：点恒通复合预警（CG-2026005 / CG-2026041）「AI 分析」即拉起故事线二联动
  // （热力深红格高亮 + TOP6 恒通 + 并案复合线索 + 中部穿透网络「恒通→智能设备采购项目」2 节点高亮）
  if (r.story2Focus) startStory2FromAssistant()
  reportFailed.value = false
  // 已分析过：直接看报告，不再弹加载窗
  if (analyzedReportIds.value.has(r.no)) { viewReport(r.no); return }
  aiAgentPendingRisk.value = r
  aiReportReady.value = false
  // 弹窗动画与报告数据「预取」并发：预取期间 aiDeferNav=true 只取数不跳转；就绪后出现「查看分析报告」
  runAgentModal(procStepDefs, null)
  aiDeferNav = true
  fetchReportWithRetry(r)
}

// 始终访问后台真实报告：失败不写死、不切演示，自动重试直到取得真实数据（用户关闭弹窗则停止）
function fetchReportWithRetry(r) {
  _openReportReal(r)
    .then(() => { aiReportReady.value = true; aiDeferNav = false })
    .catch((e) => {
      console.warn('真实报告获取失败，正在自动重试访问后台…', e)
      if (!aiAgentModal.value) { aiDeferNav = false; return }   // 用户已关闭加载窗 → 停止重试
      setTimeout(() => { if (aiAgentModal.value) fetchReportWithRetry(r); else aiDeferNav = false }, 2500)
    })
}

async function _openReportReal(r) {
  drawerOpen.value = false
  const id = r.no // 使用 CG-2026001 格式的编号
  // 提前锁定焦点单据：即便真实接口失败/超时，报告视图也能回退本地数据并渲染 12 环兜底
  selectedRiskId.value = id

  console.log('=== openReport 开始 ===', 'riskId:', id)

  const apiData = await callFlowInstanceStreamRun(id, 'view')
  
  if (apiData && apiData.message) {
    let reportJson = null
    
    const tryParse = (s) => { try { return JSON.parse(s) } catch (e) { return null } }

    // 1) message 为对象：兼容旧结构（整理报告_1.report_json），或对象本身即报告
    if (apiData.message && typeof apiData.message === 'object') {
      reportJson = apiData.message['整理报告_1.report_json']
        || (apiData.message.risk_id || apiData.message.risk_code || apiData.message.sections ? apiData.message : null)
    }

    // 2) message 为字符串：新后台返回 JSON 字符串（含 risk_id / report_title / sections）
    let jsonSrc = ''
    if (!reportJson && typeof apiData.message === 'string') {
      try {
        const raw = apiData.message.trim()
        let parsed = tryParse(raw)
        if (!parsed) {                              // 容错：从混排文本里抠出 JSON 段
          const m = raw.match(/\{[\s\S]*\}/)
          if (m) { parsed = tryParse(m[0]); if (parsed) jsonSrc = m[0] }
        } else {
          jsonSrc = raw
        }
        if (parsed && (parsed.risk_id || parsed.risk_code || parsed.report_title || parsed.sections)) {
          reportJson = parsed
        } else {
          // 兜底：纯文本报告，从中提取风险 ID / 事项 / 等级
          const riskCodeMatch = raw.match(/风险\s*ID[：:]\s*([A-Z0-9-]+)/)
          const riskNameMatch = raw.match(/风险事项\s*[：:]\s*([^\n]+)/)
          const riskLevelMatch = raw.match(/风险等级[：:]\s*((?:重大|高|中|低)风险|正常)/)
          if (riskCodeMatch || riskNameMatch) {
            reportJson = {
              risk_code: riskCodeMatch ? riskCodeMatch[1] : id,
              risk_name: riskNameMatch ? riskNameMatch[1].trim() : '风险事项',
              risk_level: riskLevelMatch ? riskLevelMatch[1] : '中风险',
              report: apiData.message,
              detailDescription: apiData.message
            }
          }
        }
      } catch (e) {
        console.error('解析 message 字符串失败:', e)
      }
    }

    // 统一规整：确保 report/detailDescription 为含 sections 的 JSON 字符串，供报告详情解析
    if (reportJson && typeof reportJson === 'object' && reportJson.sections && !reportJson.report) {
      const jsonStr = jsonSrc || JSON.stringify(reportJson)
      reportJson.report = jsonStr
      reportJson.detailDescription = jsonStr
    }

    if (reportJson) {
      const riskKey = reportJson.risk_code || reportJson.risk_id || id
      riskDataCache.value[riskKey] = reportJson
      apiRiskData.value = reportJson
      selectedRiskId.value = riskKey
      
      analyzedReportIds.value.add(id)
      analyzedReportIds.value = new Set(analyzedReportIds.value)
      
      if (!aiDeferNav) pushViewHistory('risk-detail')
      return
    } else {
      const fallbackData = {
        risk_code: id,
        risk_name: '风险事项',
        risk_level: '中风险',
        report: typeof apiData.message === 'string' ? apiData.message : JSON.stringify(apiData.message),
        detailDescription: typeof apiData.message === 'string' ? apiData.message : JSON.stringify(apiData.message)
      }
      riskDataCache.value[id] = fallbackData
      apiRiskData.value = fallbackData
      selectedRiskId.value = id
      
      analyzedReportIds.value.add(id)
      analyzedReportIds.value = new Set(analyzedReportIds.value)
      
      if (!aiDeferNav) pushViewHistory('risk-detail')
      return
    }
  }
  
  selectedRiskId.value = id
  if (!aiDeferNav) pushViewHistory('risk-detail')
}

// 查看报告（直接使用缓存）
function viewReport(id) {
  const cachedData = riskDataCache.value[id]
  if (cachedData) {
    apiRiskData.value = cachedData
  }
  
  selectedRiskId.value = id
  if (!aiDeferNav) pushViewHistory('risk-detail')
}

function progressIndex(r){ return progressSteps.findIndex(s=>s.code===r.statusCode) }
function rankClass(rank){ return rank<=3?'top':rank<=6?'mid':'low' }
function healthColor(v){ return v>=90?'#10B981':v>=75?'#2563EB':v>=60?'#F59E0B':'#EF4444' }
function penDomainColor(d){ return d==='资金域'?'blue':d==='合同域'?'purple':d==='采购域'?'orange':d==='财务域'?'green':'blue' }
function openPenetModal(type){ penetModalType.value=type }
function togglePenet(id){ const s=new Set(penetOpen.value); s.has(id)?s.delete(id):s.add(id); penetOpen.value=s }

// ── 接口调用：流程实例流式运行 ──
async function callFlowInstanceStreamRun(riskId, action) {
  const url = '/api/jobs/open_plat/flow_instance/stream_run'
  
  const payload = {
    flow_id: 10010,  // 采购穿透的 flow_id
    flow_title: "采购穿透",
    version: null,
    input_data: {
      "风险事项编号": riskId
    },
    run_mode: "normal",
    learn_trace_enable: true
  }

  const response = await axios.post(url, payload, {
    timeout: 0,   // 不设超时：一直等到后台真实报告生成完为止（慢也等），失败自动重试访问，绝不写死/切演示
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Authorization': 'external eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0bm4iOiJkcnAiLCJ1c2VyX25hbWUiOiJkZXYiLCJwYXNzd29yZCI6IlFaRGV2LjUwNiIsInVzZXJfa2V5IjoxMDJ9.0_xloniXOlNVJ-F2FsSdrEcb3tkrRDyya-sXU_eYAJs',
      'Content-Type': 'application/json'
    }
  })

  const responseText = response.data
  const dataBlocks = responseText.split(/\ndata:\s*/).filter(block => block.trim())
  
  let finalResult = null
  for (let i = dataBlocks.length - 1; i >= 0; i--) {
    try {
      const block = JSON.parse(dataBlocks[i])
      if (block.type === 'result') {
        finalResult = block
        break
      }
    } catch (e) {
      console.log('解析数据块失败:', dataBlocks[i].substring(0, 100))
    }
  }
  
  if (finalResult) {
    return finalResult
  }
  
  if (dataBlocks.length > 0) {
    try {
      return JSON.parse(dataBlocks[dataBlocks.length - 1])
    } catch (e) {
      return { message: responseText }
    }
  }
  
  return response.data
}
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────────────── */
.prc-scene {
  height:100%; background:#F0F4FA; overflow:hidden; position:relative;
  color:#0F172A; font-family:'Source Han Sans SC','Microsoft YaHei',sans-serif;
}

/* ── 核心布局：筛选栏 + 三列独立行比 ──────────────────────────────────── */
.prc-screen {
  height:100%; display:grid;
  grid-template-columns: 1fr 2.5fr 1fr;
  grid-template-rows: 1fr;
  gap:6px; padding:6px; box-sizing:border-box;
}

.col {
  display:flex; flex-direction:column; gap:6px; min-height:0;
}
/* 左列 1.5 : 3 : 2 */
.col-left  .a1-panel { flex:1.5; }
.col-left  .b1-panel { flex:3;   }
.col-left  .c1-panel { flex:2;   }
/* 专题视图：左列整列纵向呈现 2 个可视化 */
.col-left  .topic-panel { flex:1; }
.topic-panel { animation: topic-in .4s ease; }
@keyframes topic-in { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:none; } }
.topic-stack { display:flex; flex-direction:column; gap:10px; flex:1; min-height:0; }
/* 白底 + 蓝色描边 + 常规阴影，无红色/闪动 */
.topic-viz { display:flex; flex-direction:column; min-height:0;
  background:#FFF; border:1px solid #93C5FD; border-radius:10px; padding:8px 8px 4px;
  box-shadow:0 1px 4px rgba(37,99,235,0.06),0 4px 16px rgba(37,99,235,0.10);
  /* 仅保留入场时从下向上滑入，无持续闪烁 */
  opacity:0; transform:translateY(34px);
  animation:topic-rise .62s cubic-bezier(.22,.9,.3,1) forwards; }
.topic-viz.timeline { flex:1.5; animation-delay:0s; }
.topic-viz.radar    { flex:1;   animation-delay:.22s; }
@keyframes topic-rise { from { opacity:0; transform:translateY(34px); } to { opacity:1; transform:translateY(0); } }
.topic-viz-title { font-size:11.5px; font-weight:700; color:#334155; margin-bottom:2px; flex-shrink:0; }
.topic-viz-meta { font-weight:500; font-size:9px; color:#94A3B8; margin-left:6px; }
.topic-chart { flex:1; min-height:150px; width:100%; }

/* 纵向时间轴：清爽、不重叠（替代原蛇形横向图） */
/* 纵向时间轴整体放大约 1/3（在框内放大，超出可滚动） */
.topic-timeline { flex:1; min-height:0; overflow-y:auto; padding:9px 4px 2px 6px; }
.ttl-item { position:relative; display:flex; gap:12px; padding-bottom:15px; }
.ttl-item:last-child { padding-bottom:3px; }
.ttl-item:not(:last-child)::before { content:''; position:absolute; left:7px; top:18px; bottom:-2px; width:2px; background:#E2E8F0; }
.ttl-dot { width:16px; height:16px; border-radius:50%; flex-shrink:0; margin-top:3px; z-index:1;
  background:#94A3B8; border:2px solid #fff; box-shadow:0 0 0 2px #CBD5E1; }
.ttl-item.danger .ttl-dot { background:#EF4444; box-shadow:0 0 0 2px #FCA5A5; }
.ttl-item.warn   .ttl-dot { background:#F59E0B; box-shadow:0 0 0 2px #FCD34D; }
.ttl-item.safe   .ttl-dot { background:#10B981; box-shadow:0 0 0 2px #6EE7B7; }
.ttl-body { display:flex; flex-direction:column; gap:2px; min-width:0; }
.ttl-date { font-size:13px; font-weight:800; color:#1E293B; font-family:'JetBrains Mono',monospace; }
.ttl-label { font-size:13px; color:#475569; line-height:1.35; }
/* 中列 核心指标 +1/6 高 ≈ 0.72 : 2.38 : 1.5 */
.col-center .a2-panel { flex:0.72; }
.col-center .b2-panel { flex:2.38; }
.col-center .c2-panel { flex:1.5;  }
/* 右列 2.4 : 4.6 : 3  （A3 趋势上下缩小 1/5，余量给 B3 实时风险） */
.col-right .a3-panel { flex:2.4; }
.col-right .b3-panel { flex:4.6; }
.col-right .c3-panel { flex:3; }

/* ── 筛选栏 ──────────────────────────────────────────────────────────── */
.filter-bar {
  display:flex; align-items:center; gap:6px;
  padding:4px 10px; background:#FFF; border:1px solid #E8EDF5; border-radius:8px;
  box-shadow:0 1px 4px rgba(15,23,42,0.04);
}
.fb-label { font-size:10px; font-weight:700; color:#64748B; flex-shrink:0; }
.fb-btn {
  padding:3px 10px; border-radius:999px; border:1px solid #E2E8F0; background:#F8FAFC;
  font-size:10px; font-weight:600; color:#64748B; cursor:pointer; transition:0.15s; white-space:nowrap;
}
.fb-btn:hover  { border-color:#BFDBFE; color:#2563EB; background:#EFF6FF; }
.fb-btn.active { background:#2563EB; color:#FFF; border-color:#2563EB; }
.fb-sep  { width:1px; height:16px; background:#E2E8F0; flex-shrink:0; margin:0 4px; }
.fb-summary { font-size:10px; color:#475569; white-space:nowrap; }
.fb-summary strong { font-weight:800; }

/* ── Cards ──────────────────────────────────────────────────────────────── */
.glass-panel {
  background:#FFF; border:1px solid #E8EDF5; border-radius:10px;
  display:flex; flex-direction:column; min-height:0;
  padding:9px 11px; box-shadow:0 1px 4px rgba(15,23,42,0.04),0 4px 16px rgba(15,23,42,0.06);
  transition:opacity .42s ease, transform .42s ease, flex-grow .5s ease, flex-basis .5s ease, max-height .5s ease, box-shadow .3s ease, filter .42s ease, padding .4s ease, margin .4s ease;
}
/* ── 对话驱动·布局重组态 ───────────────────────────────────────────── */
.glass-panel.lm-faded { opacity:.32 !important; filter:saturate(.55) blur(.4px); pointer-events:none; }
.glass-panel.lm-emphasis { transform:scale(1.012); z-index:5; box-shadow:0 10px 30px rgba(37,99,235,0.18); border-color:#BFDBFE; }
.glass-panel.lm-center { z-index:6; transform:scale(1.03); box-shadow:0 16px 44px rgba(124,58,237,0.24); border-color:#C4B5FD; }
.glass-panel.lm-collapsed { opacity:0 !important; transform:scale(.94); flex:0 0 0 !important; max-height:0 !important; min-height:0 !important; margin:0 !important; padding-top:0 !important; padding-bottom:0 !important; border-width:0 !important; overflow:hidden; pointer-events:none; }
/* 布局重组状态条 */
.layout-chip { position:absolute; top:10px; left:50%; transform:translateX(-50%); z-index:40; display:flex; align-items:center; gap:8px; padding:5px 12px; border-radius:999px; background:rgba(124,58,237,0.96); color:#fff; font-size:12px; font-weight:700; box-shadow:0 6px 20px rgba(124,58,237,0.35); }
.layout-chip-dot { width:7px; height:7px; border-radius:50%; background:#fff; animation:link-dot-pulse 1.4s ease-out infinite; }
.layout-chip-reset { padding:1px 9px; border-radius:999px; border:none; background:rgba(255,255,255,0.22); color:#fff; font-size:11px; font-weight:700; cursor:pointer; }
.layout-chip-reset:hover { background:rgba(255,255,255,0.34); }
.ph { display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:6px; flex-shrink:0; }
.ph h3 { margin:0; font-size:14px; font-weight:800; color:#0F172A; letter-spacing:0.02em; }

/* ── 联动态：被联动的面板柔和高亮（突出但不突兀） ─────────────────── */
.glass-panel.linked { border-color:#FBD5DD; transition:border-color .4s ease; }
/* 实时采购风险：联动时内部渲染淡红渐变（浅，不要太深） */
.b3-panel.linked { background:linear-gradient(180deg,#FFF6F6 0%,#FFFAFA 38%,#FFFFFF 100%); transition:background .5s ease; }
/* 小助手「采购高风险有哪些」→ 实时采购风险列表高亮闪烁 5 下 */
.b3-panel.rl-flash { animation: rl-flash .5s ease-in-out 5; z-index:6; }
@keyframes rl-flash {
  0%, 100% { box-shadow:0 0 0 0 rgba(239,68,68,0); border-color:#E5E9F0; background:#fff; }
  50% { box-shadow:0 0 0 4px rgba(239,68,68,.45), 0 12px 30px rgba(239,68,68,.28); border-color:#EF4444; background:linear-gradient(180deg,#FEECEC 0%,#FFF5F5 60%,#FFFFFF 100%); }
}
/* B2 头部·联动徽标 */
.link-badge { display:inline-flex; align-items:center; gap:5px; margin-left:auto; padding:2px 9px; border-radius:999px; background:#FEF2F2; color:#DC2626; font-size:10px; font-weight:800; border:1px solid #FECACA; white-space:nowrap; }
.link-dot { width:6px; height:6px; border-radius:50%; background:#DC2626; box-shadow:0 0 0 0 rgba(220,38,38,0.5); animation:link-dot-pulse 1.4s ease-out infinite; }
@keyframes link-dot-pulse { 0% { box-shadow:0 0 0 0 rgba(220,38,38,0.5);} 70% { box-shadow:0 0 0 5px rgba(220,38,38,0);} 100% { box-shadow:0 0 0 0 rgba(220,38,38,0);} }
.linkbadge-fade-enter-active, .linkbadge-fade-leave-active { transition:opacity .3s, transform .3s; }
.linkbadge-fade-enter-from, .linkbadge-fade-leave-to { opacity:0; transform:translateY(-3px); }

/* ── Pills ──────────────────────────────────────────────────────────────── */
.gpill { display:inline-flex; align-items:center; padding:1px 6px; border-radius:999px; font-size:10px; font-weight:700; white-space:nowrap; }
.gpill.ice    { background:#EFF6FF; color:#2563EB; border:1px solid #BFDBFE; }
.gpill.green  { background:#F0FDF4; color:#059669; border:1px solid #A7F3D0; }
.gpill.warn   { background:#FFFBEB; color:#D97706; border:1px solid #FCD34D; }
.gpill.danger,.gpill.red { background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; }
.gpill.orange { background:#FFF7ED; color:#EA580C; border:1px solid #FED7AA; }

/* ── A1 雷达 60% + 看板 40% ────────────────────────────────────────────── */
.a1-body { flex:1; min-height:0; display:grid; grid-template-columns:60% 40%; gap:4px; align-items:stretch; }
.radar-chart { width:100%; height:100%; min-height:0; }
.comp-board { display:flex; flex-direction:column; gap:4px; background:linear-gradient(135deg,#F8FAFF,#EFF6FF);
  border:1px solid #BFDBFE; border-radius:8px; padding:6px 8px; }
.cb-header { display:flex; align-items:baseline; justify-content:space-between; gap:4px; }
.cb-title  { font-size:9px; font-weight:700; color:#1E40AF; }
.cb-rate   { font-size:18px; font-weight:800; color:#059669; line-height:1; }
.cb-rate em{ font-size:10px; font-weight:600; }
.cb-items  { display:flex; flex-direction:column; gap:3px; flex:1; }
.cb-row    { display:flex; align-items:center; gap:4px; }
.cb-dot    { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.cb-row.ok   .cb-dot { background:#10B981; box-shadow:0 0 5px rgba(16,185,129,0.5); }
.cb-row.warn .cb-dot { background:#F59E0B; box-shadow:0 0 5px rgba(245,158,11,0.5); animation:blink 1.4s ease-in-out infinite; }
.cb-label { flex:1; font-size:9px; color:#475569; }
.cb-val   { font-size:10px; font-weight:700; }
.cb-row.ok   .cb-val { color:#059669; }
.cb-row.warn .cb-val { color:#D97706; }
.cb-note { font-size:8px; color:#94A3B8; font-style:italic; border-top:1px dashed #BFDBFE; padding-top:3px; margin-top:auto; }
@keyframes blink { 0%,100%{opacity:1}50%{opacity:.35} }

/* ── A2 核心指标 ────────────────────────────────────────────────────────── */
.hero-row-3 { display:flex; gap:6px; margin-bottom:4px; flex-shrink:0; }
.hero-item { flex:1; background:linear-gradient(135deg,#F8FAFF,#EFF6FF); border-radius:7px; padding:5px 8px; border:1px solid #DBEAFE; }
.hero-item.risk-bg { background:linear-gradient(135deg,#FFF5F5,#FEF2F2); border:1px solid #FECACA; }
.hero-label { display:block; font-size:9px; color:#64748B; margin-bottom:1px; }
.hero-val { font-size:16px; font-weight:800; line-height:1.15; }
.hero-val.blue { color:#1E40AF; } .hero-val.green { color:#059669; } .hero-val.red { color:#DC2626; }
.hero-val em { font-size:10px; font-weight:500; margin-left:2px; font-style:normal; color:#64748B; }
.metrics-row-5 { display:grid; grid-template-columns:repeat(5,1fr); gap:3px; flex-shrink:0; }
.m5-cell { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:5px; padding:3px 5px; text-align:center; }
.m5-label { display:block; font-size:8px; color:#94A3B8; margin-bottom:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.m5-val { font-size:11px; font-weight:700; }

/* ── A3 趋势 ────────────────────────────────────────────────────────────── */
.a3-panel .trend-chart { flex:1; min-height:0; }

/* ── B1 十大风险域 ──────────────────────────────────────────────────────── */
.b1-head-right { display:flex; align-items:center; gap:6px; }
.b1-form { display:flex; gap:2px; }
.b1-form-btn { padding:1px 6px; border-radius:6px; border:1px solid #E2E8F0; background:#F8FAFC; color:#94A3B8; font-size:11px; line-height:1.4; cursor:pointer; transition:.15s; }
.b1-form-btn.active { background:#EEF2FF; border-color:#A5B4FC; color:#4F46E5; }
.b1-filters { display:flex; gap:2px; }
.b1-filt { padding:2px 5px; border-radius:999px; border:1px solid #E2E8F0; background:#F8FAFC;
  font-size:8.5px; font-weight:600; color:#64748B; cursor:pointer; transition:0.15s; white-space:nowrap; }
.b1-filt:hover  { border-color:#BFDBFE; color:#2563EB; background:#EFF6FF; }
.b1-filt.active { background:#2563EB; color:#FFF; border-color:#2563EB; }
.b1-kpis { display:flex; gap:4px; margin-bottom:4px; flex-shrink:0; }
.b1-kpi-item { flex:1; background:#F8FAFC; border:1px solid #E8EDF5; border-radius:6px;
  padding:3px 5px; display:flex; flex-direction:column; align-items:center; gap:0; }
.b1-kpi-n { font-size:8px; color:#94A3B8; } .b1-kpi-v { font-size:15px; font-weight:800; line-height:1.1; }
.b1-chart { flex:1; min-height:0; cursor:pointer; }
.b1-link-tip { display:flex; align-items:center; justify-content:space-between; gap:6px;
  margin-bottom:4px; padding:3px 8px; border-radius:6px; flex-shrink:0;
  background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:10px; }
.b1-link-tip b { font-weight:800; }
.b1-link-clear { border:none; background:transparent; color:#64748B; font-size:10px; cursor:pointer; padding:0 2px; }
.b1-link-clear:hover { color:#DC2626; }

/* ── B2 网络图 ──────────────────────────────────────────────────────────── */
.b2-panel { padding-top:7px; padding-bottom:6px; }
.b2-panel .ph { margin-bottom:4px; }
.b2-panel .net-chart { flex:1; min-height:0; }
.legend-mini { display:flex; gap:8px; align-items:center; }
.legend-mini span { display:flex; align-items:center; gap:3px; font-size:9px; color:#64748B; }
.ld { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
.ld-safe { background:#10B981; } .ld-warn { background:#F59E0B; } .ld-danger { background:#EF4444; }
.ld-info { font-size:8px; color:#94A3B8; font-weight:600; margin-left:4px; }

/* ── B3 实时采购风险（完全对齐资金穿透实时风险）─────────────────────────── */
.risk-stack {
  flex: 1; display: flex; flex-direction: column; gap: 8px;
  min-height: 0; overflow-y: auto; padding-right: 4px;
}
.risk-stack::-webkit-scrollbar { width: 4px; }
.risk-stack::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.risk-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  padding: 10px 12px;
  text-align: left; cursor: pointer;
  display: flex; flex-direction: column; gap: 8px;
  font-size: 11px; color: #1e293b; flex: 0 0 auto;
  transition: all .15s ease;
}
.risk-card.red    { border-left: 3px solid #ef4444; }
.risk-card.orange { border-left: 3px solid #f97316; }
.risk-card.yellow { border-left: 3px solid #facc15; }
.risk-card:hover  { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(37,99,235,.08); }

.risk-header {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.risk-tag {
  padding: 1px 6px; border-radius: 4px;
  font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;
  font-size: 9px; font-weight: 700; flex: 0 0 auto;
  background: #f1f5f9; color: #475569;
}
.risk-tag.red    { background: #fef2f2; color: #ef4444; }
.risk-tag.orange { background: #fff7ed; color: #f97316; }
.risk-tag.yellow { background: #fefce8; color: #ca8a04; }

.risk-level-badge {
  padding: 1px 6px; border-radius: 4px;
  font-size: 9px; font-weight: 700; flex: 0 0 auto;
}
.risk-level-badge.red    { background: #fef2f2; color: #ef4444; }
.risk-level-badge.orange { background: #fff7ed; color: #f97316; }
.risk-level-badge.yellow { background: #fefce8; color: #ca8a04; }

.risk-status {
  padding: 1px 6px; border-radius: 4px;
  font-size: 9px; font-weight: 700; flex: 0 0 auto;
}
.risk-status.pending       { background: #fef2f2; color: #ef4444; }
.risk-status.investigating { background: #fff7ed; color: #f97316; }
.risk-status.rectifying    { background: #eff6ff; color: #2563eb; }
.risk-status.closed        { background: #f0fdf4; color: #16a34a; }

.risk-time {
  font-size: 10px; color: #94a3b8;
  font-family: 'JetBrains Mono', monospace; flex: 0 0 auto;
}

.risk-ai-btn {
  position: relative; height: 26px; padding: 0 12px;
  border-radius: 7px; border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; font-size: 11px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center;
  justify-content: center; gap: 4px;
  overflow: hidden; transition: .2s;
  flex-shrink: 0;
}
.risk-ai-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(102,126,234,.4); }
.risk-ai-btn .ai-btn-icon { font-size: 12px; }
.ai-btn-icon { font-size: 16px; filter: drop-shadow(0 0 4px rgba(255,255,255,.5)); }
.ai-btn-text { position: relative; z-index: 1; }
.ai-btn-glow {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
  animation: ai-glow 2s ease-in-out infinite;
}
@keyframes ai-glow {
  0%, 100% { transform: translateX(-100%); }
  50%      { transform: translateX(100%); }
}

.risk-report-btn {
  height: 26px; padding: 0 12px; border-radius: 7px;
  background: #fff; color: #64748b;
  font-size: 11px; font-weight: 600;
  border: 1px solid #e2e8f0;
  cursor: pointer; display: inline-flex; align-items: center;
  justify-content: center; gap: 4px; flex-shrink: 0;
}
.risk-report-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

.risk-title { font-weight: 700; color: #0f172a; font-size: 12px; line-height: 1.4; }

.risk-body {
  display: flex; flex-direction: column; gap: 4px; font-size: 10px;
}
.risk-entity, .risk-amount-row { display: flex; gap: 6px; color: #475569; }
.risk-label { color: #94a3b8; font-weight: 500; flex-shrink: 0; }
.risk-amount {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  font-weight: 700; color: #2563eb;
}
.risk-meta { display: flex; gap: 10px; color: #64748b; margin-top: 4px; }
/* 两栏布局：左侧风险信息（标题+涉及主体+金额+经办/期限），右侧两个按钮纵向堆叠 */
.risk-main-row {
  display: flex; align-items: flex-start; gap: 10px;
  justify-content: space-between;
}
.risk-info-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
/* 标题与第一个按钮（AI 分析，高 26px）同行对齐 */
.risk-info-col .risk-title { min-height: 26px; display: flex; align-items: center; }
.risk-actions-row {
  display: flex; flex-direction: column; align-items: stretch; gap: 4px;
  justify-content: center; flex-shrink: 0;
}
.risk-handler { color: #475569; }
.risk-deadline {
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

/* ── C1 两类穿透（总分折叠）─────────────────────────────────────────── */
.pv3-scroll { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:5px;
  scrollbar-width:thin; scrollbar-color:#CBD5E1 transparent; }

/* 穿透徽章 */
.pv3-sum-badge { font-size:8px; font-weight:700; padding:1px 5px; border-radius:999px; }
.pv3-sum-badge.ok { background:#F0FDF4; color:#059669; border:1px solid #A7F3D0; }
.pv3-hc { font-size:9px; color:#94A3B8; flex-shrink:0; margin-left:auto; }
.pv3-hc strong { color:#DC2626; font-size:13px; font-weight:800; }

/* 穿透组强调 */
.pv3-hero-group { border:1px solid #DBEAFE; }
.pv3-hero-head { padding:7px 8px; background:linear-gradient(135deg,#F8FAFF,#EFF6FF)!important; }
.pv3-hero-head:hover { background:linear-gradient(135deg,#EFF6FF,#DBEAFE)!important; }

/* 穿透 KPI 网格 */
.pv3-kpi-grid { display:grid; grid-template-columns:1fr 1fr; gap:3px; margin-bottom:5px; }
.pv3-kpi { background:#F8FAFC; border:1px solid #E8EDF5; border-radius:5px; padding:3px 6px; text-align:center; }
.pv3-kn { display:block; font-size:8px; color:#94A3B8; margin-bottom:1px; }
.pv3-kv { font-size:12px; font-weight:800; color:#1E40AF; line-height:1.2; }
.pv3-kv.blue  { color:#1E40AF; }
.pv3-kv.green { color:#059669; }

/* 流程链 */
.pv3-flow-chain { display:flex; align-items:center; gap:2px; flex-wrap:wrap; padding:4px 0;
  border-bottom:1px dashed #E8EDF5; margin-bottom:4px; }
.pv3-fn { font-size:8px; font-weight:600; color:#94A3B8; padding:1px 4px; border-radius:3px;
  background:#F1F5F9; border:1px solid #E2E8F0; }
.pv3-fn.active { background:#DBEAFE; color:#1D4ED8; border-color:#93C5FD; }
.pv3-fa { font-size:8px; color:#CBD5E1; font-weight:700; }

/* 概览指标行 */
.pv3-ov-stats { display:flex; flex-wrap:wrap; gap:6px; font-size:8px; color:#64748B;
  padding:3px 0 5px; border-bottom:1px dashed #E8EDF5; margin-bottom:4px; }
.pv3-ov-stats strong { font-size:10px; font-weight:700; }

/* 折叠组 */
.pv3-group { border:1px solid #E8EDF5; border-radius:7px; overflow:hidden; flex-shrink:0; }
.pv3-group-head {
  display:flex; align-items:center; gap:5px; width:100%; padding:6px 8px;
  background:#FAFBFC; border:none; cursor:pointer; text-align:left; transition:0.15s;
}
.pv3-group-head:hover { background:#F1F5F9; }
.pv3-gicon { width:18px; height:18px; border-radius:5px; display:flex; align-items:center; justify-content:center;
  font-size:9px; font-weight:800; flex-shrink:0; }
.pv3-gicon.capital { background:#DBEAFE; color:#1D4ED8; }
.pv3-gicon.resp    { background:#EDE9FE; color:#6D28D9; }
.pv3-gtitle { font-size:10px; font-weight:700; color:#0F172A; flex:1; }
.pv3-arr { font-size:10px; color:#94A3B8; transition:transform 0.2s; display:inline-block; margin-left:auto; }
.pv3-arr.open { transform:rotate(180deg); }
.pv3-arr.sm { font-size:9px; }

.pv3-group-body { padding:5px 8px 6px; background:#FFF; }

/* 子折叠：异常类型 */
.pv3-sub { margin-top:3px; }
.pv3-sub-head {
  display:flex; align-items:center; gap:4px; width:100%; padding:3px 4px;
  background:none; border:none; border-radius:4px; cursor:pointer; text-align:left;
  font-size:9px; font-weight:600; color:#475569; transition:0.12s;
}
.pv3-sub-head:hover { background:#F8FAFC; }
.pv3-sd { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.pv3-sd.warn   { background:#F59E0B; }
.pv3-sd.danger { background:#EF4444; }
.pv3-sc { font-size:13px; font-weight:800; color:#DC2626; margin-left:auto; line-height:1; }

/* 异常条目列表 */
.pv3-sub-list { display:flex; flex-direction:column; gap:1px; padding:2px 0 2px 10px; }
.pv3-item {
  display:flex; align-items:center; gap:4px; width:100%; padding:3px 5px;
  background:none; border:none; border-radius:4px; cursor:pointer; text-align:left;
  font-size:9px; color:#475569; transition:0.12s;
}
.pv3-item:hover { background:#EFF6FF; color:#1D4ED8; }
.pi-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
.pi-dot.high { background:#EF4444; } .pi-dot.mid { background:#F59E0B; } .pi-dot.low { background:#10B981; } .pi-dot.warn { background:#F59E0B; }
.pi-name { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; }
.pi-tag { font-size:8px; font-weight:700; padding:0 3px; border-radius:2px; flex-shrink:0; }
.pi-tag.high { background:#FEE2E2; color:#DC2626; } .pi-tag.mid { background:#FEF3C7; color:#D97706; } .pi-tag.low { background:#F0FDF4; color:#059669; }
.pi-amt { font-size:9px; color:#D97706; font-weight:700; flex-shrink:0; }

/* ── C2 热力图 4:2 ─────────────────────────────────────────────────────── */
.c2-body { flex:1; min-height:0; display:flex; gap:8px; }
.heatmap-chart { flex:4; min-height:0; min-width:0; }
.sup-side { flex:2; min-width:0; display:flex; flex-direction:column; gap:4px; min-height:0; }
.sup-side-title { font-size:10px; font-weight:700; color:#334155; padding-bottom:4px; border-bottom:1px solid #F1F5F9; flex-shrink:0; }
.sup-side-rows { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:3px;
  scrollbar-width:thin; scrollbar-color:#E2E8F0 transparent; }
.sup-side-row { display:flex; align-items:flex-start; gap:5px; padding:4px 5px; border-radius:6px;
  border:1px solid #F1F5F9; background:#FAFBFC; border-left:3px solid transparent; transition:0.12s; }
.sup-side-row:hover { background:#F8FAFC; }
.sup-side-row.sup-alert { border-left-color:#EF4444; background:#FFF8F8; }
.ssr-rank { font-size:12px; font-weight:800; width:14px; flex-shrink:0; text-align:center; margin-top:1px; }
.ssr-rank.top { color:#D97706; } .ssr-rank.mid { color:#64748B; }
.ssr-info { flex:1; min-width:0; }
.ssr-name { font-size:9px; font-weight:600; color:#0F172A; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ssr-meta { font-size:8px; color:#94A3B8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ssr-right { display:flex; flex-direction:column; align-items:flex-end; gap:2px; flex-shrink:0; }
.ssr-amt { font-size:10px; font-weight:700; color:#1E40AF; }
.ssr-amt em { font-style:normal; font-size:8px; color:#94A3B8; }
.ssr-row2 { display:flex; align-items:center; gap:3px; }
.ssr-health { font-size:9px; font-weight:700; }
.sup-risk-badge { font-size:8px; font-weight:700; padding:1px 3px; border-radius:3px; }
.risk-high { background:#FEE2E2; color:#DC2626; } .risk-mid { background:#FFEDD5; color:#EA580C; } .risk-none { color:#94A3B8; }
.sup-trend { font-size:11px; font-weight:700; }
.trend-up { color:#059669; } .trend-dn { color:#DC2626; } .trend-flat { color:#94A3B8; }

/* ── C3 AI + 系统 ──────────────────────────────────────────────────────── */
.ai-list { display:flex; flex-direction:column; gap:4px; flex:1; min-height:0; overflow-y:auto;
  scrollbar-width:thin; scrollbar-color:#E2E8F0 transparent; }
.ai-item { display:flex; gap:6px; padding:5px 7px; border-radius:7px; border:1px solid #E8EDF5; background:#FAFBFC; }
.ai-item.high   { background:#FFF5F5; border-left:3px solid #EF4444; }
.ai-item.medium { background:#FFFDF0; border-left:3px solid #F59E0B; }
.ai-ava { width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#2563EB,#0891B2);
  display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:800; color:#FFF; flex-shrink:0; }
.ai-bw { flex:1; min-width:0; }
.ai-meta { display:flex; align-items:center; gap:4px; margin-bottom:1px; }
.ai-meta strong { font-size:10px; color:#0F172A; }
.ai-pri { font-size:9px; font-weight:700; padding:1px 4px; border-radius:3px; }
.ai-pri.high { background:#FEE2E2; color:#DC2626; } .ai-pri.medium { background:#FEF3C7; color:#D97706; }
.ai-bw p { margin:0; font-size:9px; color:#64748B; line-height:1.4; }
.sys-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; margin-top:auto; padding-top:5px; border-top:1px solid #F1F5F9; }
.sys-card { display:flex; align-items:center; gap:3px; padding:3px 5px; border-radius:5px;
  border:1px solid #E2E8F0; background:#F8FAFC; cursor:pointer; transition:0.15s; }
.sys-card:hover { background:#EFF6FF; border-color:#BFDBFE; }
.sys-icon { font-size:8px; font-weight:800; width:18px; height:18px; border-radius:4px;
  display:flex; align-items:center; justify-content:center; background:#EFF6FF; color:#2563EB; flex-shrink:0; }
.sys-label { font-size:8px; font-weight:600; color:#0F172A; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sys-online { font-size:7px; color:#059669; flex-shrink:0; display:none; }

/* ── 抽屉 ──────────────────────────────────────────────────────────────── */
.holo-overlay { position:fixed; inset:0; z-index:1000; background:rgba(15,23,42,0.3); backdrop-filter:blur(3px); display:flex; justify-content:flex-end; }
.holo-drawer { width:36%; min-width:320px; max-width:560px; height:100%; background:#FFF;
  border-left:1px solid #E2E8F0; box-shadow:-8px 0 40px rgba(15,23,42,0.1); display:flex; flex-direction:column; overflow:hidden; }
.hd-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
  padding:14px 18px 10px; border-bottom:1px solid #E8EDF5; background:linear-gradient(135deg,#F8FAFF,#FFF); flex-shrink:0; }
.hd-no { font-size:10px; color:#64748B; margin-bottom:3px; }
.hd-title { margin:0; font-size:14px; font-weight:800; color:#0F172A; }
.hd-tags { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.hd-close { width:24px; height:24px; border-radius:50%; border:1px solid #E2E8F0; background:#F8FAFC;
  color:#64748B; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.15s; }
.hd-close:hover { background:#FEE2E2; color:#DC2626; border-color:#FECACA; }
.hd-body { flex:1; overflow-y:auto; padding:8px 18px; scrollbar-width:thin; scrollbar-color:#CBD5E1 transparent; }
.acc-section { border-bottom:1px solid #F1F5F9; }
.acc-head { display:flex; align-items:center; gap:8px; width:100%; padding:8px 0; background:none;
  border:none; cursor:pointer; color:#334155; font-size:11px; font-weight:600; text-align:left; }
.acc-head:hover { color:#0F172A; }
.acc-icon { width:18px; height:18px; border-radius:4px; display:flex; align-items:center; justify-content:center;
  font-size:9px; font-weight:800; flex-shrink:0; }
.acc-icon.procurement { background:#FFEDD5; color:#EA580C; }
.acc-icon.link { background:#EFF6FF; color:#2563EB; }
.acc-icon.rectify { background:#F0FDF4; color:#059669; }
.acc-icon.progress { background:#F5F3FF; color:#7C3AED; }
.acc-arr { margin-left:auto; font-size:11px; transition:transform 0.2s; display:inline-block; color:#94A3B8; }
.acc-arr.open { transform:rotate(180deg); }
.acc-body { padding:0 0 8px 26px; }
.acc-rows { display:flex; flex-direction:column; gap:4px; }
.acc-row { display:flex; gap:6px; font-size:10px; color:#475569; line-height:1.5; }
.acc-bullet { width:5px; height:5px; border-radius:50%; background:#BFDBFE; flex-shrink:0; margin-top:6px; }
.pene-links { display:flex; flex-direction:column; gap:3px; }
.pen-link { display:flex; align-items:center; gap:5px; font-size:10px; color:#64748B; }
.pen-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.pen-link.blue .pen-dot { background:#3B82F6; } .pen-link.purple .pen-dot { background:#8B5CF6; }
.pen-link.orange .pen-dot { background:#F97316; } .pen-link.green .pen-dot { background:#10B981; }
.pen-link em { font-style:normal; font-weight:600; color:#334155; }
.prog-line { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:6px; }
.prog-step { display:flex; align-items:center; gap:4px; font-size:10px; color:#CBD5E1; }
.prog-step i { width:9px; height:9px; border-radius:50%; background:#F1F5F9; border:1.5px solid #CBD5E1; }
.prog-step.done { color:#94A3B8; } .prog-step.done i { background:#BFDBFE; border-color:#3B82F6; }
.prog-step.current { color:#2563EB; font-weight:700; }
.prog-step.current i { background:#2563EB; border-color:#2563EB; box-shadow:0 0 6px rgba(37,99,235,0.4); }
.hd-handler { font-size:10px; color:#64748B; }

/* ── 穿透弹窗 ─────────────────────────────────────────────────────────── */
.pm-overlay { position:fixed; inset:0; z-index:1100; background:rgba(15,23,42,0.38); backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center; }
.pm-dialog { width:72%; max-width:860px; max-height:80vh; background:#FFF; border-radius:14px;
  box-shadow:0 12px 60px rgba(15,23,42,0.18); display:flex; flex-direction:column; overflow:hidden; }
.pm-head { display:flex; align-items:center; justify-content:space-between; padding:14px 20px 10px;
  border-bottom:1px solid #E8EDF5; background:linear-gradient(135deg,#F8FAFF,#FFF); flex-shrink:0; }
.pm-head h3 { margin:0; font-size:14px; font-weight:700; color:#0F172A; }
.pm-close { width:28px; height:28px; border-radius:50%; border:1px solid #E2E8F0; background:#F8FAFC;
  color:#64748B; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.15s; }
.pm-close:hover { background:#FEE2E2; color:#DC2626; border-color:#FECACA; }
.pm-body { flex:1; overflow-y:auto; padding:12px 20px; scrollbar-width:thin; scrollbar-color:#CBD5E1 transparent; }
.pm-foot { padding:8px 20px 12px; border-top:1px solid #F1F5F9; display:flex; justify-content:flex-end; flex-shrink:0; }
.pm-btn { padding:5px 18px; border-radius:6px; border:1px solid #E2E8F0; background:#F8FAFC;
  color:#334155; font-size:12px; font-weight:600; cursor:pointer; transition:0.15s; }
.pm-btn:hover { background:#EFF6FF; border-color:#BFDBFE; color:#2563EB; }
.pm-table { width:100%; border-collapse:collapse; font-size:11px; }
.pm-table th { text-align:left; padding:6px 8px; font-weight:700; color:#475569; background:#F8FAFC;
  border-bottom:2px solid #E2E8F0; white-space:nowrap; font-size:10px; }
.pm-table td { padding:7px 8px; color:#334155; border-bottom:1px solid #F1F5F9; vertical-align:top; }
.pm-table tr:hover td { background:#FAFBFC; }
.pm-table .mono { font-family:'Consolas','SF Mono',monospace; font-size:10px; color:#64748B; }
.pm-table .amt { font-weight:700; color:#D97706; white-space:nowrap; }
.pm-lv { display:inline-block; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:700; white-space:nowrap; }
.pm-lv.high { background:#FEE2E2; color:#DC2626; } .pm-lv.mid { background:#FEF3C7; color:#D97706; } .pm-lv.low { background:#F0FDF4; color:#059669; }
.pm-st { display:inline-block; padding:1px 5px; border-radius:3px; font-size:10px; font-weight:600; white-space:nowrap; }
.pm-st.warn { background:#FEF2F2; color:#DC2626; }

/* ── Transitions ─────────────────────────────────────────────────────────── */
.drawer-slide-enter-active,.drawer-slide-leave-active { transition:opacity 0.22s ease; }
.drawer-slide-enter-from,.drawer-slide-leave-to { opacity:0; }
.acc-expand-enter-active,.acc-expand-leave-active { transition:max-height 0.22s ease,opacity 0.18s ease; overflow:hidden; }
.acc-expand-enter-from,.acc-expand-leave-to { max-height:0; opacity:0; }
.acc-expand-enter-to,.acc-expand-leave-from { max-height:600px; opacity:1; }

/* ── AI 风险识别检测报告 全屏页 ──────────────────────────────────────────── */
.rpt-overlay {
  position:fixed; inset:0; z-index:9999;
  background:#F1F5F9;
  display:flex; align-items:stretch; justify-content:center;
  overflow:auto;
}
.rpt-page {
  width:100%; max-width:1280px; margin:0 auto;
  display:flex; flex-direction:column; min-height:100%;
  background:#FFFFFF;
  box-shadow:0 0 40px rgba(15,23,42,0.08);
}
.rpt-topbar {
  display:flex; align-items:center; justify-content:space-between; gap:16px;
  padding:14px 28px; border-bottom:1px solid #E2E8F0;
  background:linear-gradient(180deg,#FAFBFC,#FFFFFF);
  position:sticky; top:0; z-index:5;
}
.rpt-back {
  height:30px; padding:0 14px; border-radius:999px;
  border:1px solid #DBE4EE; background:#fff; color:#334155;
  font-size:12px; font-weight:700; cursor:pointer; transition:0.18s;
}
.rpt-back:hover { background:#EFF6FF; border-color:#BFDBFE; color:#1D4ED8; }
.rpt-brand { display:flex; align-items:center; gap:10px; }
.rpt-brand-mark {
  width:28px; height:28px; border-radius:8px;
  background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:800; letter-spacing:0.04em;
}
.rpt-brand-name { font-size:15px; font-weight:800; color:#0F172A; letter-spacing:0.04em; }
.rpt-brand-tag { font-size:11px; color:#94A3B8; }
.rpt-stamp {
  display:inline-block; padding:3px 10px; border-radius:999px;
  background:#F0FDF4; color:#059669; font-size:11px; font-weight:700; border:1px solid #A7F3D0;
}

/* loading */
.rpt-loading { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:80px 20px; color:#475569; }
.rpt-spin {
  width:42px; height:42px; border-radius:50%;
  border:3px solid #E2E8F0; border-top-color:#667eea;
  animation:rpt-spin 0.8s linear infinite;
}
.rpt-loading p { margin:0; font-size:14px; font-weight:600; }
.rpt-loading-sub { font-size:12px; color:#94A3B8; }
@keyframes rpt-spin { to { transform:rotate(360deg); } }

/* 报告头卡 */
.rpt-body { padding:24px 28px 40px; display:flex; flex-direction:column; gap:18px; }
.rpt-head-card {
  display:grid; grid-template-columns:1fr 340px; gap:24px;
  padding:20px 24px; border-radius:14px;
  background:linear-gradient(135deg,#F5F8FF 0%,#FFFFFF 60%);
  border:1px solid #E2E8F0;
}
.rpt-head-tags { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
.rpt-tag {
  padding:2px 8px; border-radius:5px;
  background:#F1F5F9; color:#475569; font-size:11px; font-weight:700;
  font-family:'JetBrains Mono', monospace;
}
.rpt-lv { padding:2px 10px; border-radius:999px; font-size:11px; font-weight:700; }
.rpt-lv.red    { background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; }
.rpt-lv.orange { background:#FFF7ED; color:#EA580C; border:1px solid #FED7AA; }
.rpt-lv.yellow { background:#FEFCE8; color:#CA8A04; border:1px solid #FEF08A; }
.rpt-meta { font-size:11px; color:#64748B; }
.rpt-title-h1 { margin:6px 0; font-size:22px; color:#0F172A; font-weight:800; letter-spacing:0.02em; }
.rpt-sub { margin:0; font-size:13px; color:#475569; }

.rpt-head-right { display:flex; flex-direction:column; gap:12px; align-items:stretch; }
.rpt-score {
  display:flex; align-items:baseline; gap:4px; padding:10px 14px;
  background:#fff; border:1px solid #E2E8F0; border-radius:10px;
  box-shadow:0 1px 3px rgba(15,23,42,0.04);
}
.rpt-score-n { font-size:36px; font-weight:800; line-height:1; font-family:'JetBrains Mono', monospace; }
.rpt-score-n.red    { color:#DC2626; }
.rpt-score-n.orange { color:#EA580C; }
.rpt-score-n.yellow { color:#CA8A04; }
.rpt-score-u { font-size:14px; color:#94A3B8; font-weight:600; }
.rpt-score-l { margin-left:auto; font-size:11px; color:#64748B; font-weight:600; }
.rpt-kv-row { display:flex; gap:8px; }
.rpt-kv { flex:1; background:#fff; border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px; }
.rpt-kv span { display:block; font-size:10px; color:#94A3B8; margin-bottom:2px; }
.rpt-kv strong { font-size:12px; color:#0F172A; font-weight:700; }

/* 主体两列 */
.rpt-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; align-items:start; }
.rpt-col { display:flex; flex-direction:column; gap:14px; min-width:0; }

.rpt-section {
  background:#fff; border:1px solid #E8EDF5; border-radius:10px; padding:14px 16px;
}
.rpt-h2 {
  margin:0 0 10px; font-size:13px; color:#0F172A; font-weight:800;
  display:flex; align-items:center; gap:8px;
}
.rpt-h2-no {
  width:22px; height:22px; border-radius:5px;
  background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:800; font-family:'JetBrains Mono', monospace;
}

/* AI 识别 patterns */
.rpt-patterns { display:flex; flex-direction:column; gap:8px; }
.rpt-pattern {
  display:flex; gap:10px; padding:9px 12px;
  background:#F5F8FF; border:1px solid #DBEAFE; border-radius:8px;
}
.rpt-pat-tag {
  flex-shrink:0; height:18px; padding:0 8px; border-radius:4px;
  background:#1D4ED8; color:#fff; font-size:10px; font-weight:700;
  display:inline-flex; align-items:center;
}
.rpt-pattern p { margin:0; font-size:12px; line-height:1.6; color:#1E293B; }

/* bullet list */
.rpt-bullet { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; }
.rpt-bullet li {
  position:relative; padding:6px 12px 6px 22px; font-size:12px; line-height:1.6; color:#334155;
  background:#FAFBFC; border-radius:6px; border:1px solid #F1F5F9;
}
.rpt-bullet li::before {
  content:''; position:absolute; left:9px; top:14px;
  width:5px; height:5px; border-radius:50%; background:#667eea;
}

/* table 评分 */
.rpt-table { width:100%; border-collapse:collapse; font-size:11.5px; }
.rpt-table thead { background:#F8FAFC; }
.rpt-table th, .rpt-table td { padding:7px 10px; text-align:left; border-bottom:1px solid #F1F5F9; }
.rpt-table th { font-size:11px; font-weight:700; color:#64748B; }
.rpt-table td { color:#334155; vertical-align:top; }
.rpt-td-evi { color:#475569; font-size:11px; line-height:1.5; }
.rpt-trig { padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; background:#F1F5F9; color:#94A3B8; }
.rpt-trig.on { background:#FEF2F2; color:#DC2626; }
.mono { font-family:'JetBrains Mono', monospace; font-variant-numeric:tabular-nums; }

/* 合规 checks */
.rpt-checks { margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:5px; }
.rpt-checks li {
  display:grid; grid-template-columns:90px 1fr 80px; gap:10px; align-items:center;
  padding:7px 12px; border-radius:6px; background:#F0FDF4; border:1px solid #BBF7D0;
  font-size:12px;
}
.rpt-checks li.fail { background:#FEF2F2; border-color:#FECACA; }
.rpt-chk-code { font-size:10px; color:#64748B; font-weight:700; }
.rpt-chk-title { color:#1E293B; }
.rpt-chk-state { font-size:11px; font-weight:700; color:#059669; text-align:right; }
.rpt-checks li.fail .rpt-chk-state { color:#DC2626; }

/* 关联线索 */
.rpt-links { display:flex; flex-wrap:wrap; gap:6px; }
.rpt-link {
  display:inline-flex; align-items:center; gap:4px;
  padding:4px 9px; border-radius:5px; font-size:11px; line-height:1.4;
  background:#F8FAFC; border:1px solid #E2E8F0; color:#334155;
}
.rpt-link em { font-style:normal; font-weight:700; color:#1D4ED8; padding-right:4px; border-right:1px solid #E2E8F0; }
.rpt-link.orange { background:#FFF7ED; border-color:#FED7AA; }
.rpt-link.purple { background:#F5F3FF; border-color:#DDD6FE; }
.rpt-link.blue   { background:#EFF6FF; border-color:#BFDBFE; }
.rpt-link.green  { background:#F0FDF4; border-color:#A7F3D0; }
.rpt-link.red    { background:#FEF2F2; border-color:#FECACA; }

/* 整改建议 */
.rpt-rect { margin:0; padding-left:22px; display:flex; flex-direction:column; gap:6px; }
.rpt-rect li { font-size:12px; line-height:1.6; color:#334155; }
.rpt-rect li::marker { color:#667eea; font-weight:800; }

/* 结论 */
.rpt-conclusion { border-width:1px; border-style:solid; }
.rpt-conclusion.red    { background:linear-gradient(135deg,#FEF2F2,#FFFFFF); border-color:#FECACA; }
.rpt-conclusion.orange { background:linear-gradient(135deg,#FFF7ED,#FFFFFF); border-color:#FED7AA; }
.rpt-conclusion.yellow { background:linear-gradient(135deg,#FEFCE8,#FFFFFF); border-color:#FEF08A; }
.rpt-concl-text { margin:0 0 10px; font-size:13px; line-height:1.7; color:#1E293B; font-weight:600; }
.rpt-concl-meta { display:flex; justify-content:space-between; gap:12px; font-size:11px; color:#94A3B8; padding-top:8px; border-top:1px dashed #E2E8F0; }

/* 报告过渡 */
.report-fade-enter-active, .report-fade-leave-active { transition:opacity 0.22s ease; }
.report-fade-enter-from,   .report-fade-leave-to     { opacity:0; }

@media (max-width: 980px) {
  .rpt-head-card { grid-template-columns:1fr; }
  .rpt-grid      { grid-template-columns:1fr; }
}

/* ══════════════════════════════════════════════════════════════════
   风险事项详情报告视图 (Contract.vue 同款样式)
   ══════════════════════════════════════════════════════════════════ */
.rd-view { position: fixed; top: 44px; left: 0; right: 0; bottom: 0; background: #f8fafc; z-index: 50; display: flex; flex-direction: column; gap: 8px; padding: 10px 16px 12px; overflow: hidden; }
.rd-topbar { flex-shrink: 0; }

.cd-topbar { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; flex-shrink:0; }
.cd-topbar-left { display:flex; align-items:center; gap:10px; }
.cd-id { font-size:14px; font-weight:800; color:#2563eb; font-family:'JetBrains Mono', monospace; }
.cd-status-pill { font-size:11px; font-weight:600; padding:2px 10px; border-radius:999px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.cd-topbar-right { display:flex; align-items:center; gap:10px; font-size:11px; color:#94a3b8; }

.risk-pill { display:inline-flex; align-items:center; padding:2px 7px; border-radius:999px; font-size:10px; font-weight:600; }
.rp-red, .rp-high, .rp-critical { background:#fef2f2; color:#ef4444; }
.rp-orange, .rp-medium { background:#fff7ed; color:#f97316; }
.rp-yellow, .rp-watch { background:#fefce8; color:#a16207; }
.rp-green, .rp-normal, .rp-low { background:#f0fdf4; color:#16a34a; }

.cd-contract-link { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; cursor:pointer; font-family:'JetBrains Mono', monospace; transition:.14s; }
.cd-contract-link:hover { background:#2563eb; color:#fff; border-color:#2563eb; }

.rd-content { flex:1; min-height:0; display:grid; grid-template-columns:280px minmax(0, 1fr); gap:10px; }
.rd-sidebar { display:flex; flex-direction:column; gap:8px; min-height:0; overflow-y:auto; }

.rd-hero-card { padding:14px 16px; display:flex; flex-direction:column; gap:8px; position:relative; overflow:hidden; border:none; background:#fff; border-radius:10px; }
.rd-hero-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:5px; }
.rdh-red, .rdh-high, .rdh-critical { background:linear-gradient(135deg, #fef2f2 0%, #ffffff 80%); border:1px solid #fecaca; }
.rdh-red::before, .rdh-high::before, .rdh-critical::before { background:#ef4444; }
.rdh-orange, .rdh-medium { background:linear-gradient(135deg, #fff7ed 0%, #ffffff 80%); border:1px solid #fed7aa; }
.rdh-orange::before, .rdh-medium::before { background:#f97316; }
.rdh-yellow, .rdh-watch { background:linear-gradient(135deg, #fefce8 0%, #ffffff 80%); border:1px solid #fde68a; }
.rdh-yellow::before, .rdh-watch::before { background:#eab308; }
.rdh-green, .rdh-normal, .rdh-low { background:linear-gradient(135deg, #f0fdf4 0%, #ffffff 80%); border:1px solid #bbf7d0; }
.rdh-green::before, .rdh-normal::before, .rdh-low::before { background:#16a34a; }

.rdh-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; align-self:flex-start; background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.05); }
.rdh-badge-icon { font-size:14px; }
.rdh-badge-text { font-size:12px; font-weight:800; }
.rdh-red .rdh-badge-text, .rdh-high .rdh-badge-text, .rdh-critical .rdh-badge-text { color:#dc2626; }
.rdh-orange .rdh-badge-text, .rdh-medium .rdh-badge-text { color:#c2410c; }
.rdh-yellow .rdh-badge-text, .rdh-watch .rdh-badge-text { color:#a16207; }
.rdh-green .rdh-badge-text, .rdh-normal .rdh-badge-text, .rdh-low .rdh-badge-text { color:#15803d; }

.rdh-id { font-size:11px; font-weight:700; color:#475569; font-family:'JetBrains Mono', monospace; letter-spacing:0.04em; }
.rdh-name { margin:0; font-size:18px; font-weight:800; color:#0f172a; line-height:1.3; }
.rdh-status-bar { display:flex; align-items:center; gap:8px; padding-top:6px; border-top:1px dashed rgba(0,0,0,0.08); }
.rdh-status-pill { font-size:11px; font-weight:700; padding:2px 9px; border-radius:999px; }
.rdh-time { font-size:11px; color:#64748b; margin-left:auto; }

.rics-checking, .rics-investigating { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.rics-pending { background:#fefce8; color:#a16207; border:1px solid #fde68a; }
.rics-fixing, .rics-rectifying { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
.rics-closed { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }

.rd-key-card { padding:10px 12px; display:flex; flex-direction:column; gap:2px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; }
.rdk-title { font-size:11px; font-weight:800; color:#0f172a; padding-bottom:6px; border-bottom:1px solid #f1f5f9; margin-bottom:4px; }
.rdk-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 4px; border-radius:6px; transition:.14s; cursor:pointer; }
.rdk-row.rdk-row-stack { flex-direction:column; align-items:flex-start; gap:3px; cursor:default; }
.rdk-row:hover { background:#eff6ff; }
.rdk-row.rdk-row-stack:hover { background:transparent; }
.rdk-lbl { font-size:11px; color:#64748b; font-weight:600; white-space:nowrap; }
.rdk-val { font-size:12px; font-weight:700; color:#0f172a; font-family:'JetBrains Mono', monospace; }
.rdk-val.link { color:#2563eb; }
.rdk-val-text { font-size:11px; color:#475569; font-weight:500; line-height:1.5; }
.rdk-subjects { display:flex; flex-direction:column; gap:2px; width:100%; }
.rdk-subjects strong { font-size:11px; color:#334155; font-weight:600; }

.rd-status-card { padding:12px; display:flex; flex-direction:column; gap:8px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; }
.rds-title { font-size:12px; font-weight:800; color:#0f172a; }
.status-flow { display:flex; flex-direction:column; gap:0; }
.sf-step { display:flex; align-items:flex-start; gap:8px; position:relative; padding-bottom:12px; }
.sf-step:last-child { padding-bottom:0; }
.sf-dot { width:10px; height:10px; border-radius:50%; border:2px solid #e2e8f0; background:#f8fafc; flex-shrink:0; margin-top:2px; z-index:1; }
.sf-step.done .sf-dot { background:#22c55e; border-color:#22c55e; }
.sf-step.current .sf-dot { background:#2563eb; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.18); }
.sf-step span { font-size:12px; color:#64748b; font-weight:600; }
.sf-step.done span { color:#16a34a; }
.sf-step.current span { color:#1d4ed8; font-weight:800; }
.sf-line { position:absolute; left:4px; top:14px; width:1px; height:calc(100% - 12px); background:#e2e8f0; z-index:0; }
.sf-step.done .sf-line { background:#22c55e; }
.rds-meta { display:flex; flex-direction:column; gap:5px; border-top:1px solid #f1f5f9; padding-top:8px; }
.rds-meta > div { display:flex; flex-direction:column; gap:1px; }
.rds-meta span { font-size:10px; color:#94a3b8; }
.rds-meta strong { font-size:12px; color:#334155; }
.deadline { color:#ef4444 !important; }

.rd-actions-card { padding:10px 12px; display:flex; flex-direction:column; gap:6px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; }
.rda-title { font-size:11px; font-weight:800; color:#0f172a; padding-bottom:6px; border-bottom:1px solid #f1f5f9; }
.rda-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.rda-btn { height:30px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #e2e8f0; background:#f8fafc; color:#334155; transition:.14s; }
.rda-btn:hover { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
.rda-btn.primary { background:#2563eb; border-color:#2563eb; color:#fff; }
.rda-btn.primary:hover { background:#1d4ed8; }
.rda-btn.danger { background:#fef2f2; border-color:#fecaca; color:#ef4444; }
.rda-btn.danger:hover { background:#ef4444; color:#fff; }

.rd-main { min-height:0; }
.rd-report { height:100%; display:grid; grid-template-rows:auto minmax(0, 1fr); background:#fff; border:1px solid #e2e8f0; border-radius:10px; }
.rdr-header { padding:14px 20px 12px; border-bottom:1px solid #e2e8f0; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.rdr-header h2 { margin:0 0 4px; font-size:16px; font-weight:800; color:#0f172a; }
.rdr-header p { margin:0; font-size:12px; color:#64748b; }
.rdr-back-btn { height:30px; padding:0 12px; border-radius:8px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; cursor:pointer; transition:.16s; }
.rdr-back-btn:hover { border-color:#93c5fd; background:#dbeafe; }
.rdr-scroll { overflow-y:auto; padding:14px 20px; }

.risk-badge { background:#ef4444; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:999px; }

.report-container { display: flex; flex-direction: column; gap: 20px; }

.report-header-card {
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  border-radius: 16px; padding: 24px; color: #fff;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.3);
}
.rhc-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; text-align: center; letter-spacing: 2px; }
.rhc-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.rhc-info { display: flex; flex-direction: column; gap: 4px; }
.rhc-label { font-size: 11px; color: #93c5fd; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.rhc-value { font-size: 14px; font-weight: 600; }
.rhc-value.mono { font-family: 'JetBrains Mono', monospace; color: #fbbf24; }
.rhc-value.risk-badge { display: inline-flex; padding: 4px 12px; border-radius: 999px; font-size: 12px; }
.rhc-value.risk-badge.red, .rhc-value.risk-badge.high { background: #dc2626; }
.rhc-value.risk-badge.orange, .rhc-value.risk-badge.medium { background: #d97706; }
.rhc-value.risk-badge.yellow, .rhc-value.risk-badge.low { background: #22c55e; }

.data-table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
.data-table thead { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); }
.data-table th { padding: 14px 12px; font-size: 12px; font-weight: 700; color: #475569; text-align: left; border-bottom: 2px solid #cbd5e1; }
.data-table td { padding: 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #e2e8f0; }
.data-table tbody tr:hover { background: #f8fafc; }
.data-table tbody tr:last-child td { border-bottom: none; }
.category-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 600; }
.risk-note { display: inline-flex; padding: 4px 10px; border-radius: 8px; background: #fff5f5; color: #dc2626; font-size: 12px; }
.data-table .mono { font-family: 'JetBrains Mono', monospace; color: #1e40af; font-weight: 600; }

.report-section { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #eff6ff; }
.section-number {
  display: inline-flex; width: 24px; height: 24px; border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #fff;
  font-size: 12px; font-weight: 800; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}
.section-title { font-size: 15px; font-weight: 800; color: #0f172a; }
.section-content { font-size: 13px; line-height: 1.75; color: #334155; }
.section-content p { margin: 0 0 10px 0; }
.section-content p:last-child { margin-bottom: 0; }

.section-item { display: flex; gap: 8px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #2563eb; }
.section-item .item-number { font-weight: 700; color: #2563eb; font-size: 13px; flex-shrink: 0; }
.section-item .item-content { font-size: 13px; color: #334155; line-height: 1.6; }
.empty-content { text-align: center; color: #94a3b8; padding: 20px; font-style: italic; }

.warning-details { display: flex; flex-direction: column; gap: 12px; }
.warning-details p { margin: 0; font-size: 13px; line-height: 1.8; color: #334155; }
.warning-details .section-item { background: #fff5f5; border-left-color: #ef4444; }
.warning-details .section-item .item-number { color: #ef4444; }

.definition-box { padding: 14px; background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%); border-radius: 12px; border: 1px solid #e0e7ff; }
.definition-box p { margin: 0; font-size: 13px; line-height: 1.8; color: #334155; }

.calc-box { display: flex; flex-direction: column; gap: 10px; }
.calc-box .section-item { background: #f0fdf4; border-left-color: #10b981; }
.calc-box .section-item .item-number { color: #10b981; }
.calc-box p { margin: 0; font-size: 13px; line-height: 1.8; color: #334155; }

.analysis-box { display: flex; flex-direction: column; gap: 10px; }
.analysis-box .section-item { background: #fffbeb; border-left-color: #d97706; }
.analysis-box .section-item .item-number { color: #d97706; }
.analysis-box p { margin: 0; font-size: 13px; line-height: 1.8; color: #334155; }

/* 报告文本 */
.report-text { line-height: 1.9; color: #475569; }

/* 计算逻辑项 */
.logic-item { padding: 14px; background: #f8fafc; border-radius: 10px; }
.logic-title { font-weight: 700; margin-bottom: 8px; color: #0f172a; }
.logic-content { line-height: 1.8; color: #475569; }

/* 原因分析列表 */
.analysis-list { display: flex; flex-direction: column; gap: 14px; }
.analysis-item { padding: 14px; background: #f8fafc; border-radius: 10px; }
.analysis-title { font-weight: 700; margin-bottom: 8px; color: #0f172a; }
.analysis-content { line-height: 1.8; color: #475569; }

/* 整改建议项 */
.suggestion-item { padding: 10px 14px; background: #f8fafc; border-radius: 8px; margin-bottom: 10px; font-size: 13px; line-height: 1.7; }
.suggestion-num { font-weight: 700; margin-right: 6px; color: #0f172a; }
.suggestion-text { color: #334155; }

.link-box { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 768px) { .link-box { grid-template-columns: 1fr; } }
.link-group { display: flex; flex-direction: column; gap: 8px; }
.link-group-title { font-size: 11px; font-weight: 700; color: #64748b; padding: 4px 8px; background: #f1f5f9; border-radius: 6px; width: fit-content; }
.link-items { display: flex; flex-direction: column; gap: 6px; }
.link-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s; text-align: left; }
.link-item:hover { border-color: #2563eb; background: #eff6ff; transform: translateX(4px); }
.link-icon { font-size: 16px; flex-shrink: 0; }
.link-text { font-size: 12px; font-weight: 600; color: #334155; flex: 1; }
.link-id { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #2563eb; font-weight: 700; flex-shrink: 0; }

.suggestion-box { display: flex; flex-direction: column; gap: 10px; }
.suggestion-box .section-item { background: #f0fdf4; border-left-color: #059669; }
.suggestion-box .section-item .item-number { color: #059669; }
.suggestion-box p { margin: 0; font-size: 13px; line-height: 1.8; color: #334155; }

.status-section { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #bbf7d0; }
.status-section .section-header { border-bottom-color: #bbf7d0; }

.status-box { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 640px) { .status-box { grid-template-columns: 1fr; } }
.status-box .status-item { display: flex; flex-direction: column; gap: 6px; padding: 14px; background: #fff; border-radius: 12px; border: 1px solid #d1fae5; text-align: center; }
.status-box .status-label { font-size: 12px; color: #64748b; font-weight: 600; }
.status-box .status-value { font-size: 15px; font-weight: 800; color: #059669; }
.status-box .status-value.deadline { color: #dc2626; font-family: 'JetBrains Mono', monospace; }

/* ══════════ AI 智能体分析弹窗 ══════════ */
.ai-agent-overlay { position:fixed; inset:0; z-index:9999; background:rgba(15,23,42,0.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; }
.ai-agent-modal { width:560px; max-height:80vh; background:#0b1120; border:1px solid rgba(99,102,241,0.35); border-radius:18px; padding:28px; display:flex; flex-direction:column; gap:20px; box-shadow:0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.12); }
.ai-agent-header { display:flex; align-items:center; gap:14px; }
.ai-agent-brain { position:relative; width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ai-brain-core { font-size:24px; position:relative; z-index:1; }
.ai-brain-pulse { position:absolute; inset:-4px; border-radius:50%; border:2px solid rgba(99,102,241,0.5); animation:brain-pulse 1.5s ease-in-out infinite; }
@keyframes brain-pulse { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.15); opacity:1; } }
.ai-agent-title { display:flex; flex-direction:column; gap:3px; }
.ai-agent-title strong { font-size:17px; color:#e2e8f0; letter-spacing:0.02em; }
.ai-agent-title span { font-size:12px; color:#64748b; }
.ai-agent-body { display:flex; flex-direction:column; gap:6px; max-height:340px; overflow-y:auto; }
.ai-step { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:10px; transition:.3s; }
.ai-step.step-running { background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.25); }
.ai-step.step-done { background:rgba(16,185,129,0.06); }
.ai-step.step-done .ai-step-text { color:#94a3b8; }
.ai-step-indicator { width:26px; height:26px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ai-step-dot { width:8px; height:8px; border-radius:50%; background:#334155; }
.ai-step-spin { width:18px; height:18px; border:2px solid rgba(99,102,241,0.3); border-top-color:#818cf8; border-radius:50%; animation:agent-spin .7s linear infinite; }
.ai-step-check { width:22px; height:22px; border-radius:50%; background:rgba(16,185,129,0.2); color:#10b981; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; }
.ai-step-content { flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
.ai-step-text { font-size:13px; color:#cbd5e1; font-weight:500; }
.ai-step-detail { font-size:11px; color:#64748b; }
.ai-step-time { font-size:12px; color:#6366f1; font-family:'JetBrains Mono',monospace; flex-shrink:0; }
.ai-agent-footer { display:flex; flex-direction:column; gap:12px; border-top:1px solid rgba(99,102,241,0.15); padding-top:16px; }
.ai-agent-result { display:flex; align-items:center; gap:8px; color:#10b981; font-size:14px; font-weight:600; }
.ai-result-icon { width:24px; height:24px; border-radius:50%; background:rgba(16,185,129,0.2); display:flex; align-items:center; justify-content:center; font-size:13px; }
.ai-agent-btn { width:100%; height:44px; border-radius:12px; border:none; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; font-size:15px; font-weight:700; cursor:pointer; transition:.2s; letter-spacing:.04em; }
.ai-agent-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(99,102,241,0.45); }
@keyframes agent-spin { to { transform:rotate(360deg); } }
.agent-fade-enter-active { transition:opacity .25s; }
.agent-fade-leave-active { transition:opacity .2s; }
.agent-fade-enter-from, .agent-fade-leave-to { opacity:0; }

/* ══════════ 故事线一：联动 / 穿透 / 处置闭环 ══════════ */
/* 网络图恢复默认按钮 */
.net-reset-btn { padding:2px 8px; border-radius:999px; border:1px solid #FECACA; background:#FEF2F2; color:#DC2626; font-size:10px; font-weight:700; cursor:pointer; transition:.15s; }
.net-reset-btn:hover { background:#FEE2E2; }
/* 焦点风险卡高亮 + 联动徽标 */
/* 焦点高亮：取消红色外框/左边框，整卡淡红渲染突出（轻微呼吸） */
.risk-stack .risk-card.story-focus { background:#FEF2F2; border:1px solid #FCA5A5 !important; box-shadow:0 4px 16px rgba(220,38,38,0.12); animation:story-pulse 1.9s ease-in-out infinite; }
@keyframes story-pulse { 0%,100% { background-color:#FEF2F2; } 50% { background-color:#FCDCDC; } }
.risk-focus-flag { margin-left:auto; padding:0 6px; border-radius:999px; background:#FEF2F2; color:#DC2626; font-size:9px; font-weight:800; border:1px solid #FECACA; }

/* 报告内：来源标记 / 演示兜底 */
.sl-src-tag { margin-left:8px; padding:1px 8px; border-radius:999px; font-size:10px; font-weight:700; background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; }
.sl-src-tag.fail { background:#FFF7ED; color:#C2410C; border-color:#FED7AA; }
.sl-demo-tag { margin-left:8px; padding:1px 8px; border-radius:999px; font-size:10px; font-weight:700; background:#FFF7ED; color:#C2410C; border:1px solid #FED7AA; }

/* 12 环兜底 */
.ring-list { display:flex; flex-direction:column; gap:8px; }
.ring-item { display:flex; gap:10px; padding:8px 10px; background:#F8FAFC; border:1px solid #E8EDF5; border-radius:8px; }
.ring-no { flex-shrink:0; width:22px; height:22px; border-radius:50%; background:#F59E0B; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.ring-bd { min-width:0; }
.ring-title { font-size:13px; font-weight:700; color:#0F172A; margin-bottom:2px; }
.ring-body { font-size:12px; color:#475569; line-height:1.6; white-space:pre-line; }

/* 穿透：可点实体 chip */
.drill-entities { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
.drill-entities-lbl { font-size:12px; color:#64748B; }
.drill-chip { padding:3px 12px; border-radius:999px; border:1px solid #C7D2FE; background:#EEF2FF; color:#4338CA; font-size:12px; font-weight:600; cursor:pointer; transition:.15s; }
.drill-chip:hover { background:#E0E7FF; border-color:#A5B4FC; transform:translateY(-1px); }
/* 面包屑 */
.drill-breadcrumb { display:flex; align-items:center; flex-wrap:wrap; gap:4px; padding:6px 8px; background:#F1F5F9; border-radius:8px; margin-bottom:10px; }
.dbc-item { padding:2px 8px; border-radius:6px; border:none; background:transparent; color:#475569; font-size:12px; font-weight:600; cursor:pointer; }
.dbc-item:hover { background:#E2E8F0; }
.dbc-item.active { background:#7C3AED; color:#fff; }
.dbc-sep { color:#94A3B8; font-size:12px; }
.dbc-tools { margin-left:auto; display:flex; gap:6px; }
.dbc-tool { padding:2px 8px; border-radius:6px; border:1px solid #E2E8F0; background:#fff; color:#64748B; font-size:11px; cursor:pointer; }
.dbc-tool:hover { border-color:#CBD5E1; color:#334155; }
/* 穿透层卡片 */
.drill-layer { }
.dl-card { border:1px solid #E8EDF5; border-radius:10px; padding:12px 14px; background:#fff; box-shadow:0 2px 10px rgba(15,23,42,0.05); }
.dl-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.dl-type { padding:1px 7px; border-radius:6px; background:#EEF2FF; color:#6366F1; font-size:10px; font-weight:700; text-transform:uppercase; }
.dl-title { font-size:15px; font-weight:800; color:#0F172A; }
.dl-badge { padding:1px 8px; border-radius:999px; background:#FEF2F2; color:#DC2626; font-size:11px; font-weight:700; border:1px solid #FECACA; }
.dl-summary { font-size:12.5px; color:#475569; line-height:1.7; margin-bottom:10px; }
.dl-fields { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px; }
.dl-field { display:flex; flex-direction:column; gap:1px; padding:6px 9px; background:#F8FAFC; border:1px solid #EEF2F7; border-radius:7px; }
.dl-field.danger { background:#FEF2F2; border-color:#FECACA; }
.dl-fk { font-size:10.5px; color:#94A3B8; }
.dl-fv { font-size:12.5px; color:#0F172A; font-weight:600; }
.dl-field.danger .dl-fv { color:#DC2626; }
.dl-table { width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11.5px; }
.dl-table th { background:#F1F5F9; color:#475569; font-weight:700; padding:6px 8px; text-align:left; border:1px solid #E8EDF5; }
.dl-table td { padding:6px 8px; border:1px solid #EEF2F7; color:#334155; }
.dl-table tbody tr:nth-child(even) { background:#FAFCFF; }
.dl-drilldowns { display:flex; flex-wrap:wrap; gap:8px; }
.dl-dbtn { padding:5px 12px; border-radius:8px; border:1px solid #DDD6FE; background:#F5F3FF; color:#6D28D9; font-size:12px; font-weight:600; cursor:pointer; transition:.15s; }
.dl-dbtn:hover { background:#EDE9FE; border-color:#C4B5FD; transform:translateY(-1px); }
.dl-dbtn em { font-style:normal; color:#9CA3AF; font-weight:500; }
.drill-empty { padding:14px; text-align:center; color:#94A3B8; font-size:12.5px; background:#F8FAFC; border:1px dashed #E2E8F0; border-radius:8px; }
/* 报告头部·关联穿透按钮 */
.rdr-drill-btn { flex-shrink:0; display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:10px; border:1px solid #C4B5FD; background:linear-gradient(135deg,#7C3AED,#6D28D9); color:#fff; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(124,58,237,.28); transition:.15s; }
.rdr-drill-btn:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(124,58,237,.38); }
.rdr-drill-btn.active { background:#fff; color:#6D28D9; }
.rdr-drill-ico { font-size:14px; }
/* 关联穿透浮层（页面 1/3） */
.drillpanel { position:fixed; top:50%; right:24px; transform:translateY(-50%); width:36vw; max-width:600px; min-width:400px; height:74vh; z-index:9500; display:flex; flex-direction:column; background:#fff; border:1px solid #E2E8F0; border-radius:16px; box-shadow:0 18px 50px rgba(15,23,42,.28); overflow:hidden; transition:width .35s ease, height .35s ease, opacity .2s ease, transform .2s ease; }
/* 点「整改建议」出现处置闭环后：弹窗变大、内容可滚动看到 A/B/C */
.drillpanel.expanded { width:40vw; max-width:680px; height:88vh; }
/* 初始（未出方案）：第一部分(涉及对象图) : 第二部分(推荐方向) ≈ 2:1，图更大更突出；出方案后图收小，腾出空间给 A/B/C */
.drillpanel:not(.expanded) .entity-graph-wrap { height:36vh !important; }
.drillpanel.expanded .entity-graph-wrap { height:20vh !important; }
.dp-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; background:linear-gradient(135deg,#F5F3FF,#EDE9FE); border-bottom:1px solid #E9E5FB; }
.dp-head-l { display:flex; align-items:center; gap:10px; min-width:0; }
.dp-ico { font-size:20px; }
.dp-head-tt { display:flex; flex-direction:column; min-width:0; }
.dp-head-tt strong { font-size:14px; font-weight:800; color:#5B21B6; }
.dp-head-tt span { font-size:11.5px; color:#7C6FB0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dp-close { flex-shrink:0; width:28px; height:28px; border-radius:8px; border:none; background:rgba(124,58,237,.1); color:#6D28D9; font-size:14px; cursor:pointer; transition:.15s; }
.dp-close:hover { background:rgba(124,58,237,.2); }
.dp-body { flex:1; overflow-y:auto; padding:16px 18px; }
.dp-block { margin-bottom:14px; }
.dp-block-lbl { font-size:12px; font-weight:700; color:#475569; margin-bottom:8px; }
.dp-block-hd { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:800; color:#334155; margin-bottom:10px; padding-bottom:7px; border-bottom:1px solid #EEF1F6; }
.dp-step { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:#7C3AED; color:#fff; font-size:11px; font-weight:700; flex-shrink:0; }
.dp-chips { display:flex; flex-wrap:wrap; gap:8px; }
/* ① 涉及对象关系图 */
.dp-expand { margin-left:auto; padding:1px 9px; border-radius:999px; border:1px solid #DDD6FE; background:#F5F3FF; color:#6D28D9; font-size:10.5px; font-weight:700; cursor:pointer; transition:.15s; }
.dp-expand:hover { background:#EDE9FE; }
.entity-graph-wrap { position:relative; height:150px; border:1px solid #EEF1F6; border-radius:10px; background:linear-gradient(180deg,#FCFCFF,#F8FAFC); cursor:pointer; overflow:hidden; transition:height .35s ease, border-color .15s ease, box-shadow .15s ease; }
.entity-graph-wrap:hover { border-color:#C4B5FD; box-shadow:0 4px 14px rgba(124,58,237,.10); }
.entity-graph { width:100%; height:100%; }
.entity-graph-hint { position:absolute; right:8px; bottom:6px; padding:1px 8px; border-radius:999px; background:rgba(124,58,237,.08); color:#7C3AED; font-size:10px; font-weight:700; pointer-events:none; }
/* 整改建议·独立显著推进按钮 */
.dp-rectify { margin:4px 0 14px; }
.rectify-cta { width:100%; display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:12px; border:none; cursor:pointer; text-align:left;
  background:linear-gradient(135deg,#059669,#047857); color:#fff; box-shadow:0 4px 14px rgba(5,150,105,.28); transition:.18s; }
.rectify-cta:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(5,150,105,.38); }
.rectify-cta:disabled { cursor:default; }
.rectify-cta.loading { background:linear-gradient(135deg,#34D399,#10B981); }
.rectify-cta.done { background:#F0FDF4; color:#047857; box-shadow:none; border:1px solid #A7F3D0; }
.rc-ico { font-size:20px; flex-shrink:0; }
.rc-main { display:flex; flex-direction:column; line-height:1.25; flex:1; }
.rc-main b { font-size:14px; font-weight:800; }
.rc-main em { font-style:normal; font-size:11px; opacity:.92; }
.rc-arrow { font-size:18px; font-weight:800; animation:rc-bounce 1.3s ease-in-out infinite; }
@keyframes rc-bounce { 0%,100% { transform:translateY(0);} 50% { transform:translateY(3px);} }
/* ③ 处置闭环·揭示动画 */
.plans-reveal-enter-active { transition:opacity .5s ease, transform .5s ease; }
.plans-reveal-enter-from { opacity:0; transform:translateY(14px); }
/* 方案对比按钮 */
.plan-compare-btn { width:100%; margin-top:10px; padding:9px 12px; border-radius:10px; border:1px solid #C7D2FE; background:linear-gradient(135deg,#EEF2FF,#E0E7FF); color:#4338CA; font-size:12.5px; font-weight:800; cursor:pointer; transition:.15s; }
.plan-compare-btn:hover { background:#E0E7FF; transform:translateY(-1px); box-shadow:0 4px 14px rgba(99,102,241,.2); }
/* 方案对比·可视化数表弹窗 */
.pc-overlay { position:fixed; inset:0; z-index:9850; display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,.45); backdrop-filter:blur(2px); }
.pc-dialog { width:780px; max-width:94vw; max-height:88vh; background:#fff; border-radius:16px; box-shadow:0 24px 60px rgba(15,23,42,.35); overflow:hidden; display:flex; flex-direction:column; }
.pc-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; background:linear-gradient(135deg,#EEF2FF,#E0E7FF); border-bottom:1px solid #E2E8F0; }
.pc-head-tt { display:flex; flex-direction:column; min-width:0; }
.pc-head-tt strong { font-size:15px; font-weight:800; color:#3730A3; }
.pc-head-tt span { font-size:11.5px; color:#6366F1; margin-top:1px; }
.pc-close { flex-shrink:0; width:28px; height:28px; border-radius:8px; border:none; background:rgba(99,102,241,.12); color:#4338CA; font-size:14px; cursor:pointer; transition:.15s; }
.pc-close:hover { background:rgba(99,102,241,.22); }
.pc-body { padding:14px 16px 16px; overflow:auto; }
.pc-table { width:100%; border-collapse:separate; border-spacing:0; font-size:12px; }
.pc-table th, .pc-table td { padding:8px 10px; text-align:left; vertical-align:top; border-bottom:1px solid #EEF1F6; }
.pc-dim-h, .pc-col-h { position:sticky; top:0; background:#F8FAFC; z-index:1; }
.pc-dim-h { width:160px; font-size:11px; color:#64748B; font-weight:700; }
.pc-col-key { display:block; font-size:12.5px; font-weight:800; color:#334155; }
.pc-col-name { display:block; font-size:10.5px; color:#475569; font-weight:600; margin-top:1px; }
.pc-col-tag { display:inline-block; margin-top:4px; font-size:9.5px; padding:1px 7px; border-radius:999px; background:#E0E7FF; color:#4338CA; font-weight:700; }
.pc-col-tag.rec { background:#D1FAE5; color:#047857; }
.pc-col-h.rec { background:#ECFDF5; }
.pc-dim { font-size:11.5px; color:#475569; font-weight:600; background:#FCFDFF; width:160px; }
.pc-cell { color:#334155; line-height:1.4; }
.pc-cell.rec { background:rgba(16,185,129,0.06); }
.pc-cell.good { color:#0F766E; }
.pc-cell.warn { color:#92400E; }
.pc-cell.bad { color:#B91C1C; }
.pc-dot { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; vertical-align:middle; background:#94A3B8; }
.pc-dot.good { background:#10B981; }
.pc-dot.warn { background:#F59E0B; }
.pc-dot.bad { background:#EF4444; }
.pc-foot { display:flex; flex-wrap:wrap; align-items:center; gap:14px; margin-top:12px; padding-top:10px; border-top:1px solid #EEF1F6; }
.pc-legend { display:inline-flex; align-items:center; font-size:10.5px; color:#64748B; }
.pc-foot-note { flex-basis:100%; font-size:10.5px; color:#94A3B8; line-height:1.5; }
/* 三方案结果推演·指标对比图 */
.pc-charts { margin-top:14px; padding-top:12px; border-top:1px dashed #E2E8F0; }
.pcc-cap { font-size:12px; font-weight:800; color:#3730A3; margin-bottom:9px; }
.pcc-tabs { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.pcc-tab { display:flex; flex-direction:column; align-items:center; gap:3px; padding:9px 6px; border:1px solid #E2E8F0; border-radius:10px; background:#F8FAFC; cursor:pointer; transition:all .2s ease; }
.pcc-tab:hover { border-color:#A5B4FC; background:#fff; transform:translateY(-1px); }
.pcc-tab.active { border-color:#6366F1; background:linear-gradient(135deg,#EEF2FF,#fff); box-shadow:0 6px 16px rgba(99,102,241,0.18); }
.pcc-ic { font-size:17px; line-height:1; }
.pcc-lb { font-size:11.5px; font-weight:800; color:#475569; }
.pcc-tab.active .pcc-lb { color:#4338CA; }
.pcc-delta { font-size:9px; color:#94A3B8; font-weight:600; letter-spacing:.01em; }
.pcc-tab.active .pcc-delta { color:#6366F1; }
.pcc-desc { margin:11px 2px 0; font-size:10.5px; color:#94A3B8; }
.pcc-chart { width:100%; height:236px; margin-top:2px; }
.pcc-insight { display:flex; gap:7px; margin-top:6px; padding:9px 11px; background:#F0F9FF; border:1px solid #BAE6FD; border-radius:9px; font-size:11.5px; color:#075985; line-height:1.55; }
.pcc-insight-ic { flex-shrink:0; }
/* 涉及对象放大弹窗 */
.ent-overlay { position:fixed; inset:0; z-index:9800; display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,.45); backdrop-filter:blur(2px); }
.ent-dialog { width:560px; max-width:92vw; background:#fff; border-radius:16px; box-shadow:0 24px 60px rgba(15,23,42,.35); overflow:hidden; display:flex; flex-direction:column; }
.ent-head { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid #EEF1F6; }
.ent-head h3 { margin:0; font-size:15px; font-weight:800; color:#0F172A; }
.ent-sub { font-size:11px; color:#94A3B8; font-weight:700; }
.ent-hint { margin-left:auto; font-size:10.5px; color:#7C3AED; background:#F5F3FF; border:1px solid #DDD6FE; border-radius:999px; padding:2px 9px; font-weight:600; }
.ent-close { width:28px; height:28px; border-radius:8px; border:none; background:#F1F5F9; color:#475569; font-size:14px; cursor:pointer; }
.ent-close:hover { background:#E2E8F0; }
.ent-graph-big { width:100%; height:380px; cursor:grab; }
.ent-graph-big:active { cursor:grabbing; }
.ent-btns-wrap { padding:12px 18px 18px; border-top:1px solid #EEF1F6; }
.ent-btns-lbl { font-size:12px; font-weight:700; color:#475569; margin-bottom:9px; }
.ent-btns { display:flex; flex-wrap:wrap; gap:8px; }
.ent-fade-enter-active, .ent-fade-leave-active { transition:opacity .22s; }
.ent-fade-enter-from, .ent-fade-leave-to { opacity:0; }
.drillpanel-fade-enter-active, .drillpanel-fade-leave-active { transition:opacity .2s, transform .2s; }
.drillpanel-fade-enter-from, .drillpanel-fade-leave-to { opacity:0; transform:translateY(-50%) translateX(20px); }
/* 实体 chip 上的类型小标 */
.chip-kind { font-style:normal; margin-right:5px; padding:0 5px; border-radius:4px; background:#E0E7FF; color:#4338CA; font-size:10px; font-weight:700; }
/* AI 建议路径（可选） */
.ai-advice { margin-bottom:10px; border:1px solid #FDE68A; background:#FFFBEB; border-radius:10px; overflow:hidden; }
.ai-advice-head { width:100%; display:flex; align-items:center; gap:8px; padding:9px 12px; background:transparent; border:none; cursor:pointer; text-align:left; }
.ai-advice-icon { font-size:14px; }
.ai-advice-text { flex:1; font-size:12.5px; color:#92400E; line-height:1.5; }
.ai-advice-text b { color:#B45309; }
.ai-advice-tag { padding:0 7px; border-radius:999px; background:#FEF3C7; color:#B45309; font-size:10px; font-weight:700; border:1px solid #FDE68A; }
.ai-advice-arr { color:#B45309; font-size:11px; transition:transform .2s; }
.ai-advice-arr.open { transform:rotate(180deg); }
.ai-advice-body { padding:0 12px 10px; }
.ai-advice-hint { display:block; font-size:11.5px; color:#A16207; margin-bottom:6px; }
.ai-advice-chips { display:flex; flex-wrap:wrap; gap:6px; }
.advice-chip { padding:3px 12px; border-radius:999px; border:1px dashed #FCD34D; background:#fff; color:#B45309; font-size:12px; font-weight:600; cursor:pointer; transition:.15s; }
.advice-chip:hover { background:#FEF3C7; border-style:solid; }
/* 穿透层来源标 + 建议方向 */
.dl-srctag { margin-left:auto; padding:0 8px; border-radius:999px; font-size:10px; font-weight:700; background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; }
.dl-srctag.advice { background:#FFFBEB; color:#B45309; border-color:#FDE68A; }
.dl-suggest { margin-top:6px; padding:9px 11px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; }
.dl-suggest-title { font-size:11.5px; font-weight:700; color:#B45309; margin-bottom:4px; }
.dl-suggest ul { margin:0; padding-left:18px; }
.dl-suggest li { font-size:12px; color:#92400E; line-height:1.7; }

/* ── 穿透弹窗 ── */
.dm-overlay { position:fixed; inset:0; z-index:10000; background:rgba(15,23,42,0.5); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:24px; }
.dm-dialog { width:760px; max-width:94vw; max-height:88vh; display:flex; flex-direction:column; background:#fff; border-radius:14px; box-shadow:0 24px 70px rgba(15,23,42,0.35); overflow:hidden; }
.dm-head { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid #EEF2F7; }
.dm-head-main { display:flex; align-items:center; gap:9px; min-width:0; flex:1; }
.dm-type { padding:2px 8px; border-radius:6px; background:#EEF2FF; color:#6366F1; font-size:11px; font-weight:700; flex-shrink:0; }
.dm-title { margin:0; font-size:17px; font-weight:800; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dm-badge { padding:1px 9px; border-radius:999px; background:#FEF2F2; color:#DC2626; font-size:11px; font-weight:700; border:1px solid #FECACA; flex-shrink:0; }
.dm-srctag { padding:1px 9px; border-radius:999px; font-size:10px; font-weight:700; background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; flex-shrink:0; }
.dm-srctag.advice { background:#FFFBEB; color:#B45309; border-color:#FDE68A; }
.dm-close { margin-left:auto; width:30px; height:30px; border-radius:8px; border:1px solid #E2E8F0; background:#F8FAFC; color:#64748B; font-size:14px; cursor:pointer; flex-shrink:0; }
.dm-close:hover { background:#FEE2E2; color:#DC2626; border-color:#FECACA; }
.dm-breadcrumb { display:flex; align-items:center; flex-wrap:wrap; gap:4px; padding:8px 18px; background:#F8FAFC; border-bottom:1px solid #EEF2F7; }
.dm-body { padding:16px 18px; overflow-y:auto; }
.dm-summary { margin:0 0 12px; font-size:13px; color:#475569; line-height:1.7; }
.dm-chart-wrap { background:#FBFCFE; border:1px solid #EEF2F7; border-radius:10px; padding:8px; margin-bottom:14px; }
.dm-chart { width:100%; height:210px; }
.dm-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
.dm-field { display:flex; flex-direction:column; gap:2px; padding:8px 11px; background:#F8FAFC; border:1px solid #EEF2F7; border-radius:8px; }
.dm-field.danger { background:#FEF2F2; border-color:#FECACA; }
.dm-fk { font-size:11px; color:#94A3B8; }
.dm-fv { font-size:13.5px; color:#0F172A; font-weight:600; }
.dm-field.danger .dm-fv { color:#DC2626; }
.dm-table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:12px; }
.dm-table th { background:#F1F5F9; color:#475569; font-weight:700; padding:8px 10px; text-align:left; border:1px solid #E8EDF5; }
.dm-table td { padding:7px 10px; border:1px solid #EEF2F7; color:#334155; }
.dm-table tbody tr:nth-child(even) { background:#FAFCFF; }
.dm-suggest { padding:10px 12px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:9px; margin-bottom:14px; }
.dm-suggest-title { font-size:12px; font-weight:700; color:#B45309; margin-bottom:5px; }
.dm-suggest ul { margin:0; padding-left:18px; }
.dm-suggest li { font-size:12.5px; color:#92400E; line-height:1.8; }
.dm-section-lbl { font-size:11.5px; font-weight:700; color:#64748B; margin-bottom:7px; }
.dm-dd-grid { display:flex; flex-wrap:wrap; gap:8px; }
.dm-dbtn { padding:6px 13px; border-radius:8px; border:1px solid #DDD6FE; background:#F5F3FF; color:#6D28D9; font-size:12.5px; font-weight:600; cursor:pointer; transition:.15s; }
.dm-dbtn:hover { background:#EDE9FE; border-color:#C4B5FD; transform:translateY(-1px); }
.dm-dbtn em { font-style:normal; color:#9CA3AF; font-weight:500; }
.dm-foot { padding:12px 18px 14px; border-top:1px solid #EEF2F7; background:#FAFBFD; }
.dm-foot-head { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.dm-foot-lbl { font-size:12px; font-weight:800; color:#475569; }
.dm-foot-flow { font-size:11px; color:#94A3B8; }
.dm-foot-flow b { color:#64748B; font-weight:700; }
.dm-act-row { display:flex; flex-wrap:wrap; gap:8px; }
.dm-act-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 11px; border-radius:8px; border:1px solid #E2E8F0; background:#fff; color:#334155; font-size:12.5px; font-weight:700; cursor:pointer; transition:.15s; }
.dm-act-ico { font-size:14px; }
.dm-act-tag { font-size:10px; font-weight:800; padding:1px 7px; border-radius:999px; white-space:nowrap; }
/* 力度配色：留观→取证→核查→阻断 */
.dm-act-btn.watch:hover    { border-color:#94A3B8; background:#F8FAFC; }
.dm-act-btn.evidence:hover { border-color:#22D3EE; background:#ECFEFF; }
.dm-act-btn.route:hover    { border-color:#2563EB; background:#EFF6FF; }
.dm-act-btn.block:hover    { border-color:#EF4444; background:#FEF2F2; }
.dm-act-btn.block { border-color:#FECACA; }
.dm-act-tag.watch    { background:#F1F5F9; color:#64748B; }
.dm-act-tag.evidence { background:#ECFEFF; color:#0891B2; }
.dm-act-tag.route    { background:#EFF6FF; color:#2563EB; }
.dm-act-tag.block    { background:#FEF2F2; color:#DC2626; }
/* 操作已下达·确认弹窗 */
.ad-overlay { position:fixed; inset:0; z-index:10100; display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,.42); backdrop-filter:blur(2px); }
.ad-card { width:360px; max-width:90vw; background:#fff; border-radius:16px; padding:24px 22px 18px; text-align:center; box-shadow:0 24px 60px rgba(15,23,42,.35); border-top:4px solid #2563EB; }
.ad-card.watch    { border-top-color:#94A3B8; }
.ad-card.evidence { border-top-color:#0891B2; }
.ad-card.route    { border-top-color:#2563EB; }
.ad-card.block    { border-top-color:#DC2626; }
.ad-ico { width:46px; height:46px; margin:0 auto 10px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; color:#fff; background:linear-gradient(135deg,#10B981,#059669); box-shadow:0 6px 16px rgba(5,150,105,.35); }
.ad-title { font-size:16px; font-weight:800; color:#0F172A; margin-bottom:12px; }
.ad-action { display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:700; color:#1E293B; margin-bottom:8px; }
.ad-emoji { font-size:16px; }
.ad-action .dm-act-tag { margin-left:2px; }
.ad-effect { font-size:12.5px; color:#475569; line-height:1.65; margin-bottom:10px; }
.ad-meta { font-size:11px; color:#94A3B8; margin-bottom:16px; }
.ad-ok { width:100%; padding:9px 0; border:none; border-radius:10px; background:linear-gradient(135deg,#2563EB,#1D4ED8); color:#fff; font-size:13px; font-weight:700; cursor:pointer; transition:.15s; }
.ad-ok:hover { box-shadow:0 4px 14px rgba(37,99,235,.4); }

/* 处置闭环：A/B/C 方案 */
.plan-grid { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
.plan-card { text-align:left; border:1.5px solid #E8EDF5; border-radius:10px; padding:10px 12px; background:#fff; cursor:pointer; transition:.15s; }
.plan-card:hover { border-color:#CBD5E1; box-shadow:0 4px 14px rgba(15,23,42,0.07); }
.plan-card.recommended { border-color:#A7F3D0; background:#F0FDF4; }
.plan-card.selected { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,0.15); }
.plan-top { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.plan-key { width:22px; height:22px; border-radius:6px; background:#0F172A; color:#fff; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.plan-card.recommended .plan-key { background:#059669; }
.plan-name { font-size:13.5px; font-weight:700; color:#0F172A; }
.plan-strength { padding:0 7px; border-radius:999px; font-size:10px; font-weight:700; }
.plan-strength.强 { background:#FEF2F2; color:#DC2626; }
.plan-strength.中 { background:#FFF7ED; color:#C2410C; }
.plan-strength.弱 { background:#F1F5F9; color:#64748B; }
.plan-rec { margin-left:auto; padding:0 8px; border-radius:999px; background:#059669; color:#fff; font-size:10px; font-weight:700; }
.plan-impact { font-size:12px; color:#475569; line-height:1.6; }
/* AI 实施回执 */
.exec-wrap { border-top:1px dashed #E2E8F0; padding-top:12px; }
.exec-note { font-size:12.5px; color:#C2410C; background:#FFF7ED; border:1px solid #FED7AA; border-radius:8px; padding:10px 12px; }
.exec-title { font-size:12px; font-weight:700; color:#64748B; margin-bottom:8px; }
.exec-list { display:flex; flex-direction:column; gap:8px; }
.exec-step { display:flex; gap:10px; padding:9px 11px; background:#F8FAFC; border:1px solid #E8EDF5; border-radius:8px; }
.exec-step-no { flex-shrink:0; width:22px; height:22px; border-radius:50%; background:#059669; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.exec-step-bd { min-width:0; }
.exec-step-text { font-size:12.5px; color:#0F172A; line-height:1.6; }
.exec-step-meta { font-size:11px; color:#94A3B8; margin-top:3px; }
.exec-step-meta em { font-style:normal; color:#059669; font-weight:700; }
.exec-step-meta em.wait { color:#C2410C; }
.exec-done { margin-top:10px; padding:10px 12px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; color:#059669; font-size:13px; font-weight:800; text-align:center; }
.exec-fade-enter-active { transition:all .4s ease; }
.exec-fade-enter-from { opacity:0; transform:translateY(8px); }
.exec-reopen { width:100%; padding:9px; border-radius:9px; border:1px solid #A7F3D0; background:#ECFDF5; color:#059669; font-size:12.5px; font-weight:700; cursor:pointer; transition:.15s; }
.exec-reopen:hover { background:#D1FAE5; }

/* 处置结果弹窗 */
.pr-overlay { position:fixed; inset:0; z-index:9900; display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,.42); backdrop-filter:blur(2px); }
.pr-dialog { width:560px; max-width:92vw; max-height:84vh; display:flex; flex-direction:column; background:#fff; border-radius:16px; box-shadow:0 24px 60px rgba(15,23,42,.35); overflow:hidden; border-top:4px solid #059669; }
.pr-dialog.route { border-top-color:#2563EB; }
.pr-dialog.watch { border-top-color:#94A3B8; }
.pr-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:14px 18px; border-bottom:1px solid #EEF1F6; background:#F4FBF7; }
.pr-dialog.route .pr-head { background:#F5F9FF; }
.pr-dialog.watch .pr-head { background:#F8FAFC; }
.pr-head-l { display:flex; align-items:center; gap:10px; }
.pr-badge { padding:3px 10px; border-radius:8px; background:#059669; color:#fff; font-size:13px; font-weight:800; }
.pr-badge.route { background:#2563EB; } .pr-badge.watch { background:#64748B; }
.pr-head-tt { display:flex; flex-direction:column; line-height:1.3; }
.pr-head-tt strong { font-size:14px; font-weight:800; color:#0F172A; }
.pr-head-tt span { font-size:11.5px; color:#64748B; }
.pr-close { width:28px; height:28px; border-radius:8px; border:none; background:#F1F5F9; color:#475569; font-size:14px; cursor:pointer; }
.pr-close:hover { background:#E2E8F0; }
.pr-body { padding:14px 18px 18px; overflow-y:auto; }
.pr-sect { margin-bottom:14px; }
.pr-sect-lbl { font-size:12px; font-weight:800; color:#475569; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #F1F5F9; }
.pr-effects { display:flex; flex-direction:column; gap:8px; }
.pr-effect { display:flex; gap:9px; align-items:flex-start; padding:9px 11px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:9px; }
.pr-dialog.route .pr-effect { background:#EFF6FF; border-color:#BFDBFE; }
.pr-dialog.watch .pr-effect { background:#F8FAFC; border-color:#E2E8F0; }
.pr-ef-ico { font-size:16px; flex-shrink:0; }
.pr-ef-bd { display:flex; flex-direction:column; gap:1px; }
.pr-ef-bd b { font-size:12.5px; font-weight:700; color:#0F172A; }
.pr-ef-bd span { font-size:12px; color:#475569; line-height:1.55; }
.pr-drills { display:flex; flex-wrap:wrap; gap:8px; }
.pr-drill-btn { padding:6px 12px; border-radius:8px; border:1px solid #DDD6FE; background:#F5F3FF; color:#6D28D9; font-size:12px; font-weight:600; cursor:pointer; transition:.15s; }
.pr-drill-btn:hover { background:#EDE9FE; border-color:#C4B5FD; transform:translateY(-1px); }
.pr-closing { margin-top:4px; padding:10px 12px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:9px; font-size:12px; color:#92400E; line-height:1.6; }
/* 处置效果·逐条揭示动画 + 进行中指示 */
.pr-eff-enter-active { transition:opacity .45s ease, transform .45s ease; }
.pr-eff-enter-from { opacity:0; transform:translateX(-12px); }
.pr-eff-leave-active { transition:opacity .2s ease; position:absolute; }
.pr-eff-leave-to { opacity:0; }
.pr-analyzing { display:flex; align-items:center; gap:8px; margin-top:8px; padding:8px 11px; border-radius:9px; background:#F5F3FF; border:1px dashed #DDD6FE; color:#6D28D9; font-size:12px; font-weight:700; }
.pr-spin { width:14px; height:14px; border:2px solid #DDD6FE; border-top-color:#6D28D9; border-radius:50%; animation:pr-spin-kf .7s linear infinite; }
@keyframes pr-spin-kf { to { transform:rotate(360deg); } }

/* AI 小助手联动：高亮供应商行（恒通） */
.sup-side-row.assistant-hl { outline:2px solid #7C3AED; outline-offset:1px; border-radius:8px; background:#F5F3FF; box-shadow:0 0 0 4px rgba(124,58,237,.12); animation:assist-sup-pulse 1.5s ease-in-out infinite; }
@keyframes assist-sup-pulse { 0%,100% { box-shadow:0 0 0 3px rgba(124,58,237,.10);} 50% { box-shadow:0 0 0 6px rgba(124,58,237,.20);} }

/* ══════════ 故事线二：复合风险联查 ══════════ */
/* TOP6 恒通高亮 + 可点 */
.sup-side-row.story2-clickable { cursor:pointer; }
.sup-side-row.story2-hl { outline:2px solid #DC2626; outline-offset:1px; border-radius:8px; background:#FEF2F2; box-shadow:0 0 0 4px rgba(220,38,38,.12); animation:assist-sup-pulse 1.5s ease-in-out infinite; }
.ssr-flags { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px; }
.ssr-flag { font-size:9px; line-height:1.3; padding:1px 5px; border-radius:4px; background:#FEE2E2; color:#B91C1C; font-weight:700; white-space:nowrap; }
/* 复合风险线索条 */
.story2-clue { margin-bottom:8px; border:1px solid #FCA5A5; border-radius:10px; background:linear-gradient(135deg,#FEF2F2,#FFF1F2); padding:8px 10px; box-shadow:0 4px 16px rgba(220,38,38,.10); }
.s2c-main { display:flex; align-items:center; gap:8px; }
.s2c-tag { flex-shrink:0; padding:2px 8px; border-radius:999px; background:#DC2626; color:#fff; font-size:10px; font-weight:800; }
.s2c-tt { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
.s2c-tt strong { font-size:12.5px; color:#0F172A; }
.s2c-tt span { font-size:10.5px; color:#64748B; }
.s2c-close { flex-shrink:0; width:20px; height:20px; border:none; background:transparent; color:#94A3B8; font-size:13px; cursor:pointer; border-radius:5px; }
.s2c-close:hover { background:#FEE2E2; color:#DC2626; }
.s2c-open { width:100%; margin-top:7px; padding:7px 0; border:none; border-radius:8px; background:linear-gradient(135deg,#DC2626,#B91C1C); color:#fff; font-size:12px; font-weight:800; cursor:pointer; transition:.15s; }
.s2c-open:hover { box-shadow:0 4px 14px rgba(220,38,38,.4); }
/* 实时风险卡 story2 高亮（复用 story-pulse 动画） */
.risk-stack .risk-card.story2-focus { background:#FEF2F2; border:1px solid #FCA5A5 !important; box-shadow:0 4px 16px rgba(220,38,38,0.12); animation:story-pulse 1.9s ease-in-out infinite; }

/* AI 研判面板弹窗 */
.s2p-overlay { position:fixed; inset:0; z-index:10120; display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,.46); backdrop-filter:blur(3px); }
/* 故事线二：对比 / 实施回执弹窗需盖在研判面板(10120)之上，否则被遮挡看不到动画 */
.pc-overlay.s2-top, .pr-overlay.s2-top { z-index:10200; }
.s2p-dialog { width:680px; max-width:94vw; max-height:90vh; display:flex; flex-direction:column; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 28px 70px rgba(15,23,42,.4); border-top:4px solid #DC2626; }
.s2p-head { display:flex; align-items:flex-start; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #F1F5F9; background:#FEFCFC; }
.s2p-head-l { display:flex; align-items:center; gap:10px; }
.s2p-badge { padding:4px 10px; border-radius:8px; background:#DC2626; color:#fff; font-size:12px; font-weight:800; white-space:nowrap; }
.s2p-head-tt { display:flex; flex-direction:column; gap:2px; }
.s2p-head-tt strong { font-size:15px; color:#0F172A; }
.s2p-head-tt span { font-size:11.5px; color:#64748B; }
.s2p-close { width:30px; height:30px; border-radius:50%; border:1px solid #E2E8F0; background:#fff; color:#64748B; font-size:14px; cursor:pointer; }
.s2p-close:hover { background:#FEE2E2; color:#DC2626; }
.s2p-body { padding:14px 18px 18px; overflow-y:auto; }
.s2p-sect-lbl { font-size:12px; font-weight:800; color:#475569; margin:14px 0 8px; }
.s2p-sect-lbl:first-child { margin-top:0; }
.s2p-items { display:flex; gap:10px; }
.s2p-item { flex:1; min-width:0; border:1px solid #E9EDF5; border-radius:10px; padding:9px 11px; background:#FCFDFF; }
.s2p-item.tone-bid { border-color:#FECACA; background:#FEF6F6; }
.s2p-item.tone-pay { border-color:#FED7AA; background:#FFFBF5; }
.s2p-item-h { display:flex; align-items:center; gap:7px; margin-bottom:3px; }
.s2p-item-no { font-size:12px; font-weight:800; color:#0F172A; font-family:'JetBrains Mono',monospace; }
.s2p-item-type { padding:1px 7px; border-radius:999px; font-size:10px; font-weight:800; background:#DC2626; color:#fff; }
.s2p-item.tone-pay .s2p-item-type { background:#EA580C; }
.s2p-item-amt { margin-left:auto; font-size:12.5px; font-weight:800; color:#B91C1C; }
.s2p-item-proj { font-size:12px; color:#334155; font-weight:600; margin-bottom:2px; }
.s2p-item-extra { font-size:11px; color:#64748B; line-height:1.55; }
.s2p-rings { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
.s2p-ring { display:flex; gap:8px; padding:8px 10px; border:1px solid #EEF1F6; border-radius:9px; background:#fff; }
.s2p-ring-k { flex-shrink:0; width:74px; font-size:11.5px; font-weight:800; color:#DC2626; }
.s2p-ring-v { flex:1; font-size:11.5px; color:#1E293B; line-height:1.55; }
.s2p-plans { display:flex; flex-direction:column; gap:9px; }
.s2p-plan { border:1px solid #E9EDF5; border-radius:10px; padding:9px; background:#FCFDFF; transition:.15s; }
.s2p-plan.chosen { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,.14); }
.s2p-plan-btn { width:100%; display:flex; gap:10px; align-items:flex-start; text-align:left; border:none; background:transparent; cursor:pointer; padding:2px; }
.s2p-plan-key { flex-shrink:0; width:24px; height:24px; border-radius:6px; color:#fff; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.s2p-plan-btn.opt-A .s2p-plan-key { background:#DC2626; }
.s2p-plan-btn.opt-B .s2p-plan-key { background:#F59E0B; }
.s2p-plan-btn.opt-C .s2p-plan-key { background:#64748B; }
.s2p-plan-main { display:flex; flex-direction:column; gap:2px; }
.s2p-plan-main b { font-size:13px; font-weight:700; color:#0F172A; display:flex; align-items:center; gap:6px; }
.s2p-rec { font-style:normal; font-size:10px; font-weight:800; padding:0 7px; border-radius:999px; background:#059669; color:#fff; }
.s2p-plan-impact { font-size:11.5px; color:#64748B; line-height:1.5; }
.s2p-basis-toggle { margin-top:7px; padding:3px 9px; border-radius:6px; border:1px solid #FECACA; background:#FEF2F2; color:#B91C1C; font-size:11.5px; font-weight:700; cursor:pointer; }
.s2p-basis-toggle:hover { background:#FEE2E2; }
.s2p-basis { margin-top:7px; padding:9px 11px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; }
.s2p-basis p { font-size:12px; color:#92400E; line-height:1.6; margin:0 0 7px; }
.s2p-basis-figs { display:flex; flex-wrap:wrap; gap:6px; }
.s2p-fig { font-size:11px; padding:4px 9px; border-radius:7px; background:#fff; border:1px dashed #FCD34D; color:#B45309; }
.s2p-advice-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px 0; border:1px dashed #FCA5A5; border-radius:10px; background:linear-gradient(135deg,#FEF2F2,#FFF7ED); color:#B91C1C; font-size:13px; font-weight:800; cursor:pointer; transition:.15s; }
.s2p-advice-btn:hover:not(:disabled) { border-style:solid; box-shadow:0 4px 14px rgba(220,38,38,.16); }
.s2p-advice-btn.loading { cursor:default; color:#9A3412; }
.s2p-advice-ico { font-size:16px; }
.s2p-advice-spin { width:15px; height:15px; border:2px solid #FECACA; border-top-color:#DC2626; border-radius:50%; animation:pr-spin-kf .7s linear infinite; }
.s2p-compare-btn { width:100%; margin-bottom:9px; padding:8px 0; border:1px solid #BFDBFE; border-radius:9px; background:#EFF6FF; color:#1D4ED8; font-size:12.5px; font-weight:800; cursor:pointer; transition:.15s; }
.s2p-compare-btn:hover { background:#DBEAFE; box-shadow:0 3px 12px rgba(37,99,235,.18); }
.s2p-exec { display:flex; flex-direction:column; gap:7px; }
.s2p-exec-step { display:flex; gap:9px; align-items:flex-start; padding:9px 11px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; font-size:12.5px; color:#166534; line-height:1.6; }
.s2p-exec-no { flex-shrink:0; width:17px; height:17px; border-radius:50%; background:#22C55E; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.s2p-exec-done { margin-top:9px; padding:9px; text-align:center; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; color:#059669; font-size:12.5px; font-weight:800; }
.s2p-other-note { margin-top:9px; padding:9px 11px; background:#FFF7ED; border:1px solid #FED7AA; border-radius:8px; color:#C2410C; font-size:12px; line-height:1.6; }

/* 两类穿透概览 → 路线①②③ 标签 + 联动条目 */
.pv3-item.route-on { background:linear-gradient(90deg,rgba(37,99,235,.05),transparent); }
.pv3-item.route-on:hover { background:linear-gradient(90deg,rgba(37,99,235,.10),transparent); }
.pi-route { flex-shrink:0; margin-left:auto; padding:1px 6px; border-radius:999px; font-size:9px; font-weight:800; color:#fff; }
.pi-route.r1 { background:#DC2626; }
.pi-route.r2 { background:#EA580C; }
.pi-route.r3 { background:#7C3AED; }
.pv3-item.route-on .pi-tag { margin-left:6px; }
/* 路线联动弹窗 */
.rc-overlay { position:fixed; inset:0; z-index:10120; display:flex; align-items:center; justify-content:center; background:rgba(15,23,42,.46); backdrop-filter:blur(3px); }
.rc-dialog { width:520px; max-width:92vw; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 28px 70px rgba(15,23,42,.4); border-top:4px solid #DC2626; }
.rc-dialog.r3 { border-top-color:#7C3AED; }
.rc-dialog.s2 { border-top-color:#EA580C; }
.rc-head { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid #F1F5F9; background:#FEFCFC; }
.rc-tag { flex-shrink:0; padding:4px 10px; border-radius:8px; background:#DC2626; color:#fff; font-size:12px; font-weight:800; }
.rc-tag.r3 { background:#7C3AED; } .rc-tag.s2 { background:#EA580C; }
.rc-head-tt { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
.rc-head-tt strong { font-size:15px; color:#0F172A; }
.rc-head-tt span { font-size:11.5px; color:#64748B; }
.rc-close { width:30px; height:30px; border-radius:50%; border:1px solid #E2E8F0; background:#fff; color:#64748B; font-size:14px; cursor:pointer; }
.rc-close:hover { background:#FEE2E2; color:#DC2626; }
.rc-body { padding:14px 18px; }
.rc-sect-lbl { font-size:12px; font-weight:800; color:#475569; margin-bottom:8px; }
.rc-chain { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.rc-chain-row { position:relative; padding-left:16px; font-size:12px; color:#1E293B; line-height:1.55; }
.rc-chain-dot { position:absolute; left:2px; top:6px; width:7px; height:7px; border-radius:50%; background:#DC2626; }
.rc-dialog.r3 .rc-chain-dot { background:#7C3AED; } .rc-dialog.s2 .rc-chain-dot { background:#EA580C; }
.rc-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
.rc-kv { border:1px solid #EEF1F6; border-radius:9px; padding:8px 11px; background:#FCFDFF; display:flex; flex-direction:column; gap:3px; }
.rc-kv span { font-size:11px; color:#94A3B8; font-weight:700; }
.rc-kv strong { font-size:12px; color:#0F172A; line-height:1.45; }
.rc-foot { display:flex; gap:10px; padding:12px 18px 16px; }
.rc-btn { flex:1; padding:9px 0; border:none; border-radius:10px; font-size:13px; font-weight:800; cursor:pointer; color:#fff; background:#DC2626; transition:.15s; }
.rc-btn.r3 { background:#7C3AED; } .rc-btn.s2 { background:#EA580C; }
.rc-btn:hover { box-shadow:0 4px 14px rgba(220,38,38,.35); }
.rc-btn.ghost { flex:0 0 88px; background:#F1F5F9; color:#475569; }
.rc-btn.ghost:hover { background:#E2E8F0; box-shadow:none; }
</style>
