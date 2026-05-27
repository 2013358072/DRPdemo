<template>
  <div class="prc-scene">
    <div v-if="viewMode === 'penetration'" class="prc-screen">

      <!-- ===== 全局筛选栏 ===== -->
      <section class="filter-bar">
        <span class="fb-label">数据范围</span>
        <button v-for="p in periods" :key="p.id"
                :class="['fb-btn', { active: timePeriod === p.id }]"
                @click="timePeriod = p.id">{{ p.label }}</button>
        <span class="fb-sep"></span>
        <span class="fb-summary">
          采购总额 <strong>¥{{ pd.amount }}亿</strong>　｜　风险 <strong :style="{color:'#DC2626'}">{{ pd.riskTotal }}</strong> 条　｜　合规率 <strong :style="{color:'#059669'}">{{ pd.compliance }}%</strong>
        </span>
      </section>

      <!-- ========== 左列 1.5 : 3 : 2 ========== -->
      <div class="col col-left">
        <!-- A1 雷达 60% + 74号文看板 40% -->
        <section class="glass-panel a1-panel">
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
        <section class="glass-panel b1-panel">
          <div class="ph">
            <h3>采购十大风险域</h3>
            <div class="b1-filters">
              <button :class="['b1-filt', { active: riskFilter === 'all' }]"    @click="riskFilter = 'all'">全部</button>
              <button :class="['b1-filt', { active: riskFilter === 'danger' }]" @click="riskFilter = 'danger'">高危</button>
              <button :class="['b1-filt', { active: riskFilter === 'warn' }]"   @click="riskFilter = 'warn'">中危</button>
              <button :class="['b1-filt', { active: riskFilter === 'safe' }]"   @click="riskFilter = 'safe'">正常</button>
            </div>
          </div>
          <div class="b1-kpis">
            <div class="b1-kpi-item"><span class="b1-kpi-n">高风险</span><span class="b1-kpi-v" style="color:#DC2626">{{ pd.riskHigh }}</span></div>
            <div class="b1-kpi-item"><span class="b1-kpi-n">中风险</span><span class="b1-kpi-v" style="color:#D97706">{{ pd.riskMid }}</span></div>
            <div class="b1-kpi-item"><span class="b1-kpi-n">低风险</span><span class="b1-kpi-v" style="color:#2563EB">{{ pd.riskLow }}</span></div>
            <div class="b1-kpi-item"><span class="b1-kpi-n">合计</span><span class="b1-kpi-v" style="color:#0F172A">{{ pd.riskTotal }}</span></div>
          </div>
          <EChart class="b1-chart" :option="riskBarOption" />
        </section>

        <!-- C1 两类穿透概览（总分折叠形式）-->
        <section class="glass-panel c1-panel">
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
                        <button v-for="b in bidAnomalies" :key="b.code" class="pv3-item" @click="openPenetModal('bid')">
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
                        <button v-for="a in acceptAnomalies" :key="a.contract" class="pv3-item" @click="openPenetModal('accept')">
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
                        <button v-for="r in approvalAnomalies" :key="r.item+r.approver" class="pv3-item" @click="openPenetModal('approval')">
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
        <section class="glass-panel a2-panel">
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
        <section class="glass-panel b2-panel">
          <div class="ph">
            <h3>采购主体穿透网络图</h3>
            <div class="legend-mini">
              <span><i class="ld ld-safe"></i>低风险</span>
              <span><i class="ld ld-warn"></i>中风险</span>
              <span><i class="ld ld-danger"></i>高风险</span>
              <span class="ld-info">22节点 · 21边</span>
            </div>
          </div>
          <EChart class="net-chart" :option="darkNetworkOption" />
        </section>

        <!-- C2 热力图 + 供应商 -->
        <section class="glass-panel c2-panel">
          <div class="ph">
            <h3>品类 × 采购方式分布</h3>
            <div style="display:flex;align-items:center;gap:5px">
              <span class="gpill ice">风险色阶</span>
              <span class="gpill warn">供应商待关注 2</span>
            </div>
          </div>
          <div class="c2-body">
            <EChart class="heatmap-chart" :option="heatmapOption" />
            <div class="sup-side">
              <div class="sup-side-title">供应商 TOP 6</div>
              <div class="sup-side-rows">
                <div v-for="s in supplierRanking" :key="s.rank"
                     class="sup-side-row" :class="{ 'sup-alert': s.riskCount >= 5 }">
                  <span class="ssr-rank" :class="rankClass(s.rank)">{{ s.rank }}</span>
                  <div class="ssr-info">
                    <div class="ssr-name">{{ s.name }}</div>
                    <div class="ssr-meta">{{ s.category }}
                      <span :style="{ color: s.white ? '#059669' : '#DC2626' }">{{ s.white ? ' ✓' : ' ⚠' }}</span>
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
        <section class="glass-panel a3-panel">
          <div class="ph">
            <h3>趋势数据</h3>
            <span class="gpill ice">{{ periodLabel }} · 三轴</span>
          </div>
          <EChart class="trend-chart" :option="darkTrendOption" />
        </section>

        <!-- B3 实时采购风险 -->
        <section class="glass-panel b3-panel">
          <div class="ph">
            <h3>实时采购风险</h3>
            <span class="gpill danger">高 {{ highRiskCount }} 条</span>
          </div>
          <div class="risk-stack">
            <div v-for="r in riskList" :key="r.id" class="risk-card" :class="r.level">
              <div class="risk-header">
                <span class="risk-tag" :class="r.level">{{ r.no }}</span>
                <span class="risk-level-badge" :class="r.level">{{ r.levelLabel }}</span>
                <span class="risk-status" :class="r.statusCode">{{ r.status }}</span>
                <span class="risk-time">⏱ {{ formatTime(r.warningTime) }}</span>
              </div>
              <div class="risk-title-row">
                <div class="risk-title">{{ r.name }}</div>
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
          </div>
        </section>

        <!-- C3 AI建议 + 系统入口 -->
        <section class="glass-panel c3-panel">
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
                  <p><a href="http://192.168.16.206:8098/process_detail?flow_id=10010&title=%E9%87%87%E8%B4%AD%E7%A9%BF%E9%80%8F" target="_blank">点击查看运行日志</a></p>
                </div>
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
                            <button class="link-item" @click="showToast('查看采购计划')">
                              <span class="link-icon">🛒</span>
                              <span class="link-text">采购计划</span>
                              <span class="link-id">CGP-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="showToast('查看询价记录')">
                              <span class="link-icon">🔍</span>
                              <span class="link-text">询价记录</span>
                              <span class="link-id">XJ-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="showToast('查看中标公告')">
                              <span class="link-icon">📣</span>
                              <span class="link-text">中标公告</span>
                              <span class="link-id">ZB-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                          </div>
                        </div>
                        <div class="link-group">
                          <div class="link-group-title">合同域</div>
                          <div class="link-items">
                            <button class="link-item" @click="showToast('查看关联合同 ' + activeRisk.contractRef)">
                              <span class="link-icon">📄</span>
                              <span class="link-text">关联合同</span>
                              <span class="link-id">{{ activeRisk.contractRef }}</span>
                            </button>
                            <button class="link-item" @click="showToast('查看合同审批单')">
                              <span class="link-icon">✅</span>
                              <span class="link-text">合同审批单</span>
                              <span class="link-id">SP-{{ activeRisk.contractRef.replace('HT-','') }}</span>
                            </button>
                          </div>
                        </div>
                        <div class="link-group">
                          <div class="link-group-title">财务域</div>
                          <div class="link-items">
                            <button class="link-item" @click="showToast('查看发票')">
                              <span class="link-icon">🧾</span>
                              <span class="link-text">发票</span>
                              <span class="link-id">FP-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="showToast('查看会计凭证')">
                              <span class="link-icon">📊</span>
                              <span class="link-text">会计凭证</span>
                              <span class="link-id">PZ-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                            <button class="link-item" @click="showToast('查看付款申请')">
                              <span class="link-icon">💳</span>
                              <span class="link-text">付款申请</span>
                              <span class="link-id">FK-{{ activeRisk.no.replace('CG-','') }}</span>
                            </button>
                          </div>
                        </div>
                        <div class="link-group">
                          <div class="link-group-title">资金域</div>
                          <div class="link-items">
                            <button class="link-item" @click="showToast('查看银行流水')">
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

    <!-- ===== Toast 提示 ===== -->
    <transition name="report-fade">
      <div v-if="toastVisible" class="prc-toast">{{ toastText }}</div>
    </transition>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import axios from 'axios'
import EChart from '../components/EChart.vue'

const emit = defineEmits(['navigate'])
function goToDashboard(){ emit('navigate', 'dashboard'); if (typeof window !== 'undefined') window.location.hash = '#/dashboard' }

// ── State ──────────────────────────────────────────────────────────────────
const drawerOpen     = ref(false)
const drawerRisk     = ref(null)
const accordionOpen  = ref(new Set(['proc']))
const riskFilter     = ref('all')
const timePeriod     = ref('all')

// ── AI 风险识别检测报告 ────────────────────────────────────────────────────
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
      statusFlow: flow,
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
      statusFlow: ['待核查','核查中','整改中','已闭环'],
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
  { id:'all', label:'全部' },{ id:'month', label:'近1月' },
  { id:'quarter', label:'近3月' },{ id:'half', label:'近半年' },
]
const periodLabel = computed(() => periods.find(p => p.id === timePeriod.value)?.label || '全部')

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
const riskMatrix = [
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
]

const supplierRanking = [
  { rank:1, name:'XX建设工程有限公司',   amount:285.6, riskCount:5, health:72, trend:-1, white:true,  category:'土建工程' },
  { rank:2, name:'XX建材有限公司',       amount:248.2, riskCount:3, health:82, trend: 1, white:true,  category:'材料采购' },
  { rank:3, name:'XX能源科技有限公司',   amount:198.5, riskCount:1, health:92, trend: 1, white:true,  category:'设备采购' },
  { rank:4, name:'XX供应链管理有限公司', amount:168.8, riskCount:8, health:62, trend:-1, white:false, category:'服务采购' },
  { rank:5, name:'XX信息技术有限公司',   amount:125.3, riskCount:0, health:95, trend: 0, white:true,  category:'IT采购' },
  { rank:6, name:'XX设备制造有限公司',   amount: 98.6, riskCount:1, health:88, trend: 0, white:true,  category:'设备采购' },
]

const riskList = [
  { id:'R-CG-001', no:'CG-2026001', name:'未验收即付款预警', level:'red', levelLabel:'高风险',
    warningTime:'2026-05-16 09:40', entity:'XX工程部门 / XX建设工程有限公司',
    status:'待整改', statusCode:'rectifying', amount:'40', amountUnit:'万',
    handler:'马XX（工程部）', deadline:'2026-05-28',
    detail:{
      riskItem:'XX 车间维修工程，合同 HT-202604001 约定验收合格后付 80% 工程款 40 万元，工程未验收即于 2026-05-16 支付 40 万元。',
      causeAnalysis:[
        '采购计划 CG-202604001，工程计划完工时间 2026-05-20，截至预警日仍在施工中，未验收。',
        '合同 HT-202604001 明确约定"验收合格后支付 80% 工程款"，付款节点未提前。',
        '银行流水 LS-20260516001，付款 40 万元，审批流程中"验收确认"环节被跳过。',
        '会计凭证 PZ-20260516001 附合同复印件但未附验收记录。',
      ],
      penetrationLinks:[
        { domain:'采购域', data:'采购计划 CG-202604001' },
        { domain:'采购域', data:'采购验收记录 YS-202604001（未验收）' },
        { domain:'合同域', data:'合同详情 HT-202604001' },
        { domain:'资金域', data:'银行流水 LS-20260516001' },
        { domain:'财务域', data:'会计凭证 PZ-20260516001' },
      ],
      rectificationSuggestions:[
        '立即暂停后续付款，由工程部门组织核查工程进度及质量，尽快完成验收。',
        '若验收合格补充验收记录及质量检测报告；若不合格要求限期整改。',
        '问责：跳过验收确认的审批人、未核实验收的记账人员。',
        '系统设置"验收记录必传"校验，无验收记录无法提交付款申请。',
      ],
    },
  },
  { id:'R-CG-002', no:'CG-2026005', name:'围标串标预警', level:'red', levelLabel:'高风险',
    warningTime:'2026-05-18 14:20', entity:'XX采购部 / 3家投标单位',
    status:'核查中', statusCode:'investigating', amount:'280', amountUnit:'万',
    handler:'孙XX（采购部）', deadline:'2026-05-25',
    summary:'AI 检测到 3 家投标单位的 IP / MAC 地址、报价节奏存在串通嫌疑。' },
  { id:'R-CG-003', no:'CG-2026012', name:'关联输送预警', level:'red', levelLabel:'高风险',
    warningTime:'2026-05-15 11:00', entity:'XX能源公司 / XX关联供应商',
    status:'核查中', statusCode:'investigating', amount:'350', amountUnit:'万',
    handler:'钱XX（审计部）', deadline:'2026-05-22',
    summary:'疑似向关联供应商输送利益，合同金额 350 万元，关联关系已核实。' },
  { id:'R-CG-004', no:'CG-2026018', name:'异常低价中标预警', level:'orange', levelLabel:'中风险',
    warningTime:'2026-05-14 16:30', entity:'XX建设公司 / XX低价中标单位',
    status:'待核查', statusCode:'pending', amount:'120', amountUnit:'万',
    handler:'李XX（招采部）', deadline:'2026-05-24' },
  { id:'R-CG-005', no:'CG-2026025', name:'资质挂靠预警', level:'orange', levelLabel:'中风险',
    warningTime:'2026-05-13 09:15', entity:'XX建设一公司 / XX承包商',
    status:'整改中', statusCode:'rectifying', amount:'85', amountUnit:'万',
    handler:'周XX（工程部）', deadline:'2026-05-27' },
  { id:'R-CG-006', no:'CG-2026033', name:'融资性贸易采购预警', level:'red', levelLabel:'高风险',
    warningTime:'2026-05-12 13:45', entity:'XX贸易公司 / XX投资公司',
    status:'待核查', statusCode:'pending', amount:'150', amountUnit:'万',
    handler:'吴XX（风控部）', deadline:'2026-05-26' },
]

const aiSuggestions = [
  { id:'AI-1', type:'CG-2026001 未验收付款', priority:'high', priorityLabel:'高',
    content:'XX建设工程（TOP1供应商）未验收即付款 40 万元，建议立即暂停后续付款并核查工程进度。' },
  { id:'AI-2', type:'合规风险预警', priority:'high', priorityLabel:'高',
    content:'发现 2 笔采购涉嫌融资性贸易（合计 150 万），建议启动专项排查。' },
  { id:'AI-3', type:'供应商管理', priority:'medium', priorityLabel:'中',
    content:'XX供应链管理本月新增 18 笔合同但健康评分仅 62 分，建议重点关注其履约风险与白名单准入。' },
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
  { project:'XX车间改造工程',   code:'CG-202604012', winner:'XX建设工程有限公司', type:'评标程序违规',   level:'高', lvClass:'high', status:'待整改' },
  { project:'XX设备采购项目',   code:'CG-202604018', winner:'XX机械设备公司',     type:'评标专家回避',   level:'高', lvClass:'high', status:'核查中' },
  { project:'XX绿化工程',       code:'CG-202604025', winner:'XX园林公司',         type:'评分标准不一致', level:'中', lvClass:'mid',  status:'待整改' },
  { project:'XX道路修缮工程',   code:'CG-202604031', winner:'XX路桥公司',         type:'评标时间异常',   level:'中', lvClass:'mid',  status:'待核查' },
  { project:'XX办公装修项目',   code:'CG-202604038', winner:'XX装饰公司',         type:'围标串标嫌疑',   level:'高', lvClass:'high', status:'核查中' },
  { project:'XX消防设备采购',   code:'CG-202604042', winner:'XX消防器材公司',     type:'资质审查缺失',   level:'中', lvClass:'mid',  status:'待整改' },
  { project:'XX信息系统升级',   code:'CG-202604055', winner:'XX信息技术公司',     type:'评标流程不合规', level:'低', lvClass:'low',  status:'已闭环' },
  { project:'XX仓储物流项目',   code:'CG-202604061', winner:'XX物流公司',         type:'专家资质存疑',   level:'中', lvClass:'mid',  status:'核查中' },
]
const acceptAnomalies = [
  { contract:'HT-202604001', project:'XX车间维修工程', supplier:'XX建设工程有限公司', amount:'40万',  time:'2026-05-16', acceptStatus:'未验收',   requirement:'补充验收手续后方可付款' },
  { contract:'HT-202604015', project:'XX管道改造工程', supplier:'XX安装公司',         amount:'85万',  time:'2026-05-14', acceptStatus:'部分验收', requirement:'完成全部验收后付余款' },
  { contract:'HT-202604023', project:'XX外墙翻新工程', supplier:'XX建材公司',         amount:'28万',  time:'2026-05-18', acceptStatus:'未验收',   requirement:'暂停付款并组织验收' },
]
const approvalAnomalies = [
  { item:'设备采购定标', approver:'王XX', time:'2026-05-12', reason:'超权限审批',     level:'中', lvClass:'mid',  responsible:'王XX', deadline:'2026-05-25' },
  { item:'工程分包定标', approver:'李XX', time:'2026-05-10', reason:'审批流程缺失',   level:'高', lvClass:'high', responsible:'李XX', deadline:'2026-05-22' },
  { item:'服务采购定标', approver:'张XX', time:'2026-05-08', reason:'利益冲突未回避', level:'高', lvClass:'high', responsible:'张XX', deadline:'2026-05-20' },
  { item:'材料采购定标', approver:'陈XX', time:'2026-05-15', reason:'审批依据不充分', level:'低', lvClass:'low',  responsible:'陈XX', deadline:'2026-05-28' },
  { item:'IT采购定标',   approver:'赵XX', time:'2026-05-17', reason:'越级审批',       level:'中', lvClass:'mid',  responsible:'赵XX', deadline:'2026-05-26' },
]

const heatmapCategories = ['土建工程','安装工程','设备采购','材料采购','服务采购','IT采购','咨询服务','其他']
const heatmapMethods    = ['公开招标','竞争性谈判','单一来源','询价采购','框架协议','直接采购','委托代理','其他']
const heatmapBaseValues = [
  [85,12,8,15,20,5,3,2],[72,18,5,22,15,8,4,6],[45,25,15,35,28,12,8,5],[38,22,18,45,32,15,5,8],
  [25,18,12,28,42,22,15,10],[18,15,8,12,25,35,18,5],[12,10,5,8,15,8,28,6],[5,8,3,6,10,4,3,12],
]

// ── Computed ───────────────────────────────────────────────────────────────
const highRiskCount = computed(() => riskList.filter(r => r.level === 'red').length)
const penetModalTitle = computed(() => {
  if (penetModalType.value === 'bid')      return '评标定标异常明细（8笔）'
  if (penetModalType.value === 'accept')   return '验收支付异常明细（3笔）'
  if (penetModalType.value === 'approval') return '定标审批异常明细（5笔）'
  return ''
})
const filteredRiskMatrix = computed(() => {
  if (riskFilter.value === 'danger') return riskMatrix.filter(r => r.health === 'danger')
  if (riskFilter.value === 'warn')   return riskMatrix.filter(r => r.health === 'warn')
  if (riskFilter.value === 'safe')   return riskMatrix.filter(r => r.health === 'safe')
  return riskMatrix
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

// B2 网络：22节点 21边，上下各2分支·左右各3分支，CG-2026001高亮
const darkNetworkOption = computed(() => ({
  animation:false, backgroundColor:'transparent',
  tooltip:{trigger:'item',backgroundColor:'rgba(255,255,255,0.97)',borderColor:'#E2E8F0',textStyle:{color:'#334155',fontSize:11},extraCssText:'box-shadow:0 4px 20px rgba(15,23,42,0.1)',
    formatter:({data})=>data?.name?`<b>${data.name}</b><br/>层级：${data.tier||'-'}<br/>采购金额：${data.amount||'-'} 亿<br/>风险：${data.riskLabel||'-'}`:''
  },
  series:[{
    type:'graph',layout:'none',roam:false,draggable:false,
    edgeSymbol:['none','arrow'],edgeSymbolSize:[0,5],
    lineStyle:{color:'#CBD5E1',width:1.1,curveness:0.12},
    label:{show:true,position:'right',fontSize:8,color:'#475569',fontWeight:600,distance:3},
    emphasis:{focus:'adjacency',lineStyle:{width:2.5}},
    data:[
      /* 集团中心 */
      {name:'XX集团',x:260,y:135,symbolSize:48,tier:'集团',amount:5680,riskLabel:'中',
        itemStyle:{color:'#F97316',shadowColor:'rgba(249,115,22,0.5)',shadowBlur:14},label:{position:'inside',fontSize:9,color:'#FFF'}},
      /* ── 上方 2 分支 ── */
      {name:'XX科技公司',x:182,y:52,symbolSize:26,tier:'二级',amount:580,riskLabel:'低',itemStyle:{color:'#3B82F6'},label:{position:'top'}},
      {name:'XX信息系统项目',x:110,y:10,symbolSize:14,tier:'项目',amount:120,riskLabel:'低',itemStyle:{color:'#93C5FD'},label:{position:'top',fontSize:7}},
      {name:'XX监管公司',x:338,y:52,symbolSize:24,tier:'二级',amount:320,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'top'}},
      {name:'XX安防改造项目',x:415,y:10,symbolSize:14,tier:'项目',amount:85,riskLabel:'低',itemStyle:{color:'#6EE7B7'},label:{position:'top',fontSize:7}},
      /* ── 下方 2 分支 ── */
      {name:'XX物流公司',x:182,y:218,symbolSize:22,tier:'二级',amount:420,riskLabel:'中',itemStyle:{color:'#FBBF24'},label:{position:'bottom'}},
      {name:'XX仓储建设项目',x:110,y:258,symbolSize:14,tier:'项目',amount:95,riskLabel:'低',itemStyle:{color:'#93C5FD'},label:{position:'bottom',fontSize:7}},
      {name:'XX贸易公司',x:338,y:218,symbolSize:26,tier:'二级',amount:850,riskLabel:'高',itemStyle:{color:'#EF4444'},label:{position:'bottom'}},
      {name:'XX供应链项目',x:415,y:258,symbolSize:14,tier:'项目',amount:150,riskLabel:'中',itemStyle:{color:'#FCD34D'},label:{position:'bottom',fontSize:7}},
      /* ── 左侧 3 分支 ── */
      {name:'XX能源集团',x:125,y:80,symbolSize:32,tier:'二级',amount:1680,riskLabel:'中',itemStyle:{color:'#F97316'},label:{position:'left'}},
      {name:'XX光伏项目',x:38,y:35,symbolSize:14,tier:'项目',amount:280,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'left',fontSize:7}},
      {name:'XX材料公司',x:100,y:135,symbolSize:22,tier:'二级',amount:460,riskLabel:'中',itemStyle:{color:'#F59E0B'},label:{position:'left'}},
      {name:'XX管道项目',x:22,y:135,symbolSize:12,tier:'项目',amount:75,riskLabel:'低',itemStyle:{color:'#93C5FD'},label:{position:'left',fontSize:7}},
      {name:'XX环保公司',x:125,y:190,symbolSize:22,tier:'二级',amount:380,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'left'}},
      {name:'XX排污项目',x:38,y:235,symbolSize:14,tier:'项目',amount:90,riskLabel:'低',itemStyle:{color:'#6EE7B7'},label:{position:'left',fontSize:7}},
      /* ── 右侧 3 分支（含高亮路径）── */
      {name:'XX建设公司',x:395,y:80,symbolSize:36,tier:'二级',amount:2100,riskLabel:'高',
        itemStyle:{color:'#EF4444',shadowColor:'rgba(239,68,68,0.3)',shadowBlur:8}},
      {name:'XX建设一公司',x:470,y:40,symbolSize:22,tier:'三级',amount:450,riskLabel:'高',itemStyle:{color:'#EF4444'}},
      {name:'XX车间维修工程',x:530,y:10,symbolSize:16,tier:'项目',amount:50,riskLabel:'高',
        itemStyle:{color:'#DC2626',shadowColor:'rgba(220,38,38,0.5)',shadowBlur:12},label:{position:'top',fontSize:7}},
      {name:'XX安装公司',x:420,y:135,symbolSize:24,tier:'二级',amount:520,riskLabel:'中',itemStyle:{color:'#F59E0B'}},
      {name:'XX设备采购项目',x:510,y:135,symbolSize:14,tier:'项目',amount:160,riskLabel:'低',itemStyle:{color:'#93C5FD'},label:{fontSize:7}},
      {name:'XX供应链管理',x:395,y:190,symbolSize:22,tier:'二级',amount:360,riskLabel:'中',itemStyle:{color:'#F59E0B'}},
      {name:'XX仓储物流项目',x:490,y:240,symbolSize:14,tier:'项目',amount:110,riskLabel:'低',itemStyle:{color:'#10B981'},label:{position:'bottom',fontSize:7}},
    ],
    links:[
      /* 集团→上方 */
      {source:'XX集团',target:'XX科技公司',lineStyle:{width:1.4,color:'#3B82F6'}},
      {source:'XX集团',target:'XX监管公司',lineStyle:{width:1.2,color:'#10B981'}},
      /* 集团→下方 */
      {source:'XX集团',target:'XX物流公司',lineStyle:{width:1.2,color:'#FBBF24'}},
      {source:'XX集团',target:'XX贸易公司',lineStyle:{width:1.8,color:'#EF4444',opacity:0.6}},
      /* 集团→左侧 */
      {source:'XX集团',target:'XX能源集团',lineStyle:{width:1.8,color:'#F97316',opacity:0.8}},
      {source:'XX集团',target:'XX材料公司',lineStyle:{width:1.2,color:'#F59E0B'}},
      {source:'XX集团',target:'XX环保公司',lineStyle:{width:1.2,color:'#10B981'}},
      /* 集团→右侧 CG-2026001 高亮路径 */
      {source:'XX集团',target:'XX建设公司',lineStyle:{width:2.8,color:'#EF4444',opacity:0.95}},
      {source:'XX集团',target:'XX安装公司',lineStyle:{width:1.2,color:'#F59E0B'}},
      {source:'XX集团',target:'XX供应链管理',lineStyle:{width:1.2,color:'#F59E0B'}},
      /* 上方延伸→项目 */
      {source:'XX科技公司',target:'XX信息系统项目'},
      {source:'XX监管公司',target:'XX安防改造项目'},
      /* 下方延伸→项目 */
      {source:'XX物流公司',target:'XX仓储建设项目'},
      {source:'XX贸易公司',target:'XX供应链项目'},
      /* 左侧延伸→项目 */
      {source:'XX能源集团',target:'XX光伏项目'},
      {source:'XX材料公司',target:'XX管道项目'},
      {source:'XX环保公司',target:'XX排污项目'},
      /* 右侧延伸→项目 高亮路径续 */
      {source:'XX建设公司',target:'XX建设一公司',lineStyle:{width:2.8,color:'#EF4444',opacity:0.95}},
      {source:'XX建设一公司',target:'XX车间维修工程',lineStyle:{width:2.8,color:'#DC2626',opacity:1}},
      {source:'XX安装公司',target:'XX设备采购项目'},
      {source:'XX供应链管理',target:'XX仓储物流项目'},
    ],
  }],
}))

const heatmapOption = computed(() => {
  const data=[];heatmapBaseValues.forEach((row,ci)=>{row.forEach((v,mi)=>{data.push([mi,ci,v])})})
  return {
    animation:false,backgroundColor:'transparent',
    tooltip:{position:'top',backgroundColor:'rgba(255,255,255,0.97)',borderColor:'#E2E8F0',textStyle:{color:'#334155',fontSize:11},
      formatter:(p)=>`${heatmapCategories[p.data[1]]} × ${heatmapMethods[p.data[0]]}<br/>数量: ${p.data[2]}`},
    grid:{left:52,right:6,top:4,bottom:52,containLabel:false},
    xAxis:{type:'category',data:heatmapMethods,axisLabel:{color:'#64748B',fontSize:8,rotate:28,interval:0},
      axisLine:{lineStyle:{color:'#E2E8F0'}},splitArea:{show:true,areaStyle:{color:['#F8FAFC','#FFF']}}},
    yAxis:{type:'category',data:heatmapCategories,axisLabel:{color:'#64748B',fontSize:8},
      axisLine:{lineStyle:{color:'#E2E8F0'}},splitArea:{show:true,areaStyle:{color:['#F8FAFC','#FFF']}}},
    visualMap:{min:0,max:45,show:false,inRange:{color:['#F1F5F9','#DBEAFE','#93C5FD','#FDE68A','#FDBA74','#F87171','#B91C1C']}},
    series:[{name:'热力',type:'heatmap',data,
      label:{show:true,fontSize:9,formatter:(p)=>p.data[2]?String(p.data[2]):'',color:(p)=>p.data[2]>25?'#FFF':'#374151'},
      emphasis:{itemStyle:{shadowBlur:10,shadowColor:'rgba(239,68,68,0.35)'}}}],
  }
})

// ── Functions ──────────────────────────────────────────────────────────────
function openDrawer(r){ drawerRisk.value=r; drawerOpen.value=true; accordionOpen.value=new Set(['proc']) }
function toggleAcc(id){ const s=new Set(accordionOpen.value); s.has(id)?s.delete(id):s.add(id); accordionOpen.value=s }
function formatTime(s){ if(!s) return ''; const m=s.match(/(\d{2}:\d{2})/); return m ? m[1] : s.slice(-5) }

// ── AI 检测报告：点击 AI 分析 → 切换到 risk-detail 视图 ───────────────
async function openReport(r) {
  drawerOpen.value = false
  const id = r.no // 使用 CG-2026001 格式的编号
  
  console.log('=== openReport 开始 ===', 'riskId:', id)
  
  const apiData = await callFlowInstanceStreamRun(id, 'view')
  
  if (apiData && apiData.message) {
    let reportJson = null
    
    if (typeof apiData.message === 'object') {
      reportJson = apiData.message['整理报告_1.report_json']
    }
    
    if (!reportJson && typeof apiData.message === 'string') {
      try {
        const jsonMatch = apiData.message.match(/\{[\s\S]*"risk_code"[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          reportJson = parsed
        } else {
          const riskCodeMatch = apiData.message.match(/风险 ID[：:]\s*([A-Z0-9-]+)/)
          const riskNameMatch = apiData.message.match(/风险事项 [：:]\s*([^\n]+)/)
          const riskLevelMatch = apiData.message.match(/风险等级[：:]\s*([高中低][风险])/)
          
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
    
    if (reportJson) {
      const riskKey = reportJson.risk_code || reportJson.risk_id || id
      riskDataCache.value[riskKey] = reportJson
      apiRiskData.value = reportJson
      selectedRiskId.value = riskKey
      
      analyzedReportIds.value.add(id)
      analyzedReportIds.value = new Set(analyzedReportIds.value)
      
      pushViewHistory('risk-detail')
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
      
      pushViewHistory('risk-detail')
      return
    }
  }
  
  selectedRiskId.value = id
  pushViewHistory('risk-detail')
}

// 查看报告（直接使用缓存）
function viewReport(id) {
  const cachedData = riskDataCache.value[id]
  if (cachedData) {
    apiRiskData.value = cachedData
  }
  
  selectedRiskId.value = id
  pushViewHistory('risk-detail')
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
    flow_id: 10018,  // 采购穿透的 flow_id
    flow_title: "采购穿透",
    version: null,
    input_data: {
      "风险事项编号": riskId
    },
    run_mode: "normal",
    learn_trace_enable: true
  }

  const response = await axios.post(url, payload, {
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
  grid-template-rows: auto 1fr;
  gap:6px; padding:6px; box-sizing:border-box;
}
.filter-bar { grid-column: 1 / -1; }

.col {
  display:flex; flex-direction:column; gap:6px; min-height:0;
}
/* 左列 1.5 : 3 : 2 */
.col-left  .a1-panel { flex:1.5; }
.col-left  .b1-panel { flex:3;   }
.col-left  .c1-panel { flex:2;   }
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
}
.ph { display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:6px; flex-shrink:0; }
.ph h3 { margin:0; font-size:11px; font-weight:700; color:#0F172A; letter-spacing:0.02em; }

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
.b1-filters { display:flex; gap:2px; }
.b1-filt { padding:2px 5px; border-radius:999px; border:1px solid #E2E8F0; background:#F8FAFC;
  font-size:8.5px; font-weight:600; color:#64748B; cursor:pointer; transition:0.15s; white-space:nowrap; }
.b1-filt:hover  { border-color:#BFDBFE; color:#2563EB; background:#EFF6FF; }
.b1-filt.active { background:#2563EB; color:#FFF; border-color:#2563EB; }
.b1-kpis { display:flex; gap:4px; margin-bottom:4px; flex-shrink:0; }
.b1-kpi-item { flex:1; background:#F8FAFC; border:1px solid #E8EDF5; border-radius:6px;
  padding:3px 5px; display:flex; flex-direction:column; align-items:center; gap:0; }
.b1-kpi-n { font-size:8px; color:#94A3B8; } .b1-kpi-v { font-size:15px; font-weight:800; line-height:1.1; }
.b1-chart { flex:1; min-height:0; }

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
.risk-title-row {
  display: flex; align-items: center; gap: 8px;
  justify-content: space-between;
}
.risk-title-row .risk-title { flex: 1; min-width: 0; }
.risk-actions-row {
  display: flex; align-items: center; gap: 8px;
  justify-content: flex-end; flex-shrink: 0;
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
</style>
