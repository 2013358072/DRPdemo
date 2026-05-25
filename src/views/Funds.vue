<template>
  <div class="white-scene">
    <!-- ══════════ 资金穿透主视图 ══════════ -->
    <template v-if="viewMode !== 'risk-detail'">
      <div class="screen">
      <!-- ============ A 区 ============ -->
      <div class="row-a">
        <!-- A1 八维雷达 + 境外资金可视看板 -->
        <section class="card panel a1">
          <div class="panel-head">
            <div>
              <h3>司库八维指标</h3>
            </div>
            <span class="pill cyan">大盘</span>
          </div>
          <div class="a1-body">
            <div class="a1-radar">
              <EChart class="radar-chart" :option="radarOption" />
            </div>
            <div class="a1-board">
              <div class="board-title">境外资金可视合规看板 · 国资委 2 号文</div>
              <div class="board-main">
                <div class="board-num glow-cyan">88.0<small>%</small></div>
                <div class="board-label">境外资金可视率</div>
                <div class="board-track">
                  <span class="track-cap">境内</span>
                  <i class="track-line"><i class="track-dot"></i></i>
                  <span class="track-cap">境外</span>
                </div>
              </div>
              <div class="board-sub">
                <div class="sub-cell">
                  <span class="sub-num glow-green">100<small>%</small></span>
                  <span class="sub-cap">账户可视化率</span>
                </div>
                <div class="sub-cell">
                  <span class="sub-num glow-green">0</span>
                  <span class="sub-cap">隐蔽账户</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- A2 资金核心资产 -->
        <section class="card panel a2">
          <div class="panel-head">
            <div>
              <h3>资金核心指标</h3>
            </div>
            <span class="pill green">同比 +5.2%</span>
          </div>
          <div class="a2-grid">
            <div class="a2-main">
              <div class="a2-label">全集团资金池总余额</div>
              <div class="a2-value glow-cyan">¥4,280<small>亿</small></div>
              <div class="a2-meta">同比 +5.2%　·　环比 +1.5%</div>
            </div>
            <div class="a2-tiles">
              <div class="a2-tile" style="border-left-color:#16a34a">
                <span class="tile-cap">集中度</span>
                <span class="tile-val" style="color:#16a34a">94<i>%</i></span>
                <span class="tile-sub">目标 90% 已达成</span>
              </div>
              <div class="a2-tile" style="border-left-color:#7c3aed">
                <span class="tile-cap">融资总额</span>
                <span class="tile-val" style="color:#7c3aed">¥6,800<i>亿</i></span>
                <span class="tile-sub">同环比正常</span>
              </div>
              <div class="a2-tile" style="border-left-color:#f97316">
                <span class="tile-cap">担保总额</span>
                <span class="tile-val" style="color:#f97316">¥1,200<i>亿</i></span>
                <span class="tile-sub">合规</span>
              </div>
              <div class="a2-tile" style="border-left-color:#0891b2">
                <span class="tile-cap">资产归集率</span>
                <span class="tile-val" style="color:#0891b2">90<i>%</i></span>
                <span class="tile-sub">已达成</span>
              </div>
            </div>
          </div>
        </section>

        <!-- A3 四轴趋势 -->
        <section class="card panel a3">
          <div class="panel-head">
            <div>
              <h3>趋势数据</h3>
            </div>
            <span class="pill cyan">四轴</span>
          </div>
          <EChart class="trend-chart" :option="trendOption" />
        </section>
      </div>

      <!-- ============ 主体 B/C 区 ============ -->
      <div class="body">
        <!-- 左栏 -->
        <aside class="left">
          <!-- B1 资金风险全景（极坐标 · 时间维度） -->
          <section class="card panel b1-panel">
            <div class="panel-head">
              <div>
                <h3>资金风险全景</h3>
                <p>12 域 · {{ currentTotal }} 条 · 高 {{ currentHigh }} · 中 {{ currentMedium }}</p>
              </div>
              <div class="filter-pills">
                <span
                  v-for="p in periods"
                  :key="p.key"
                  class="filter-pill"
                  :class="{ active: period === p.key }"
                  @click="period = p.key"
                >{{ p.label }}</span>
              </div>
            </div>

            <div class="b1-stats">
              <div class="stat-cell red">
                <b>{{ currentHigh }}</b><span>高风险</span>
                <i class="stat-trend" :class="trendClass(periodTrend.high)">{{ periodTrend.high }}</i>
              </div>
              <div class="stat-cell orange">
                <b>{{ currentMedium }}</b><span>中风险</span>
                <i class="stat-trend" :class="trendClass(periodTrend.medium)">{{ periodTrend.medium }}</i>
              </div>
              <div class="stat-cell green">
                <b>{{ currentClosed }}</b><span>已闭环</span>
                <i class="stat-trend up">+{{ Math.round(currentClosed * 0.18) }}</i>
              </div>
            </div>

            <div class="b1-chart-wrap">
              <EChart class="b1-chart" :option="riskPolarOption" @chart-click="onDomainClick" @chart-hover="onDomainHover" @chart-blur="onDomainBlur" />
            </div>

            <div class="b1-legend">
              <span><i class="dot red"></i>严重</span>
              <span><i class="dot orange"></i>高</span>
              <span><i class="dot yellow"></i>中</span>
              <span><i class="dot blue"></i>低</span>
              <span><i class="dot gray"></i>业务总量</span>
              <span class="b1-tip">鼠标悬停扇区查看典型案例</span>
            </div>
            <transition name="blind">
              <div v-if="hoverCases.length" class="b1-cases">
                <span v-for="c in hoverCases" :key="c.no" class="case-pill" :class="c.tone">
                  {{ c.no }} · {{ c.text }}
                </span>
              </div>
            </transition>

            <transition name="blind">
              <div v-if="selectedAreaId" class="b1-detail" @click.stop>
                <div class="pop-head">
                  <span>{{ selectedArea.label }} · {{ selectedArea.count }} 条 · {{ periodLabel }}</span>
                  <i class="pop-close" @click.stop="selectedAreaId = ''">×</i>
                </div>
                <ul class="pop-list">
                  <li v-for="(t, i) in selectedArea.tickets" :key="i">
                    <i class="dot" :class="selectedArea.level"></i>
                    <span class="pop-no">{{ t.no }}</span>
                    <span class="pop-desc">{{ t.desc }}</span>
                  </li>
                </ul>
              </div>
            </transition>
          </section>

          <!-- C1 两类穿透 -->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>全链路穿透</h3>
              </div>
              <span class="pill orange">资金 5 异常 · 责任 9 异常</span>
            </div>
            <div class="pen-stack pen-single">
              <!-- ===== 路线一：资金穿透（账户 → 异常） ===== -->
              <div class="pen-card drill-panel">
                <div class="drill-macro drill-macro-2">
                  <div class="dm-cell"><span>账户</span><strong>1,200<em>户</em></strong></div>
                  <div class="dm-cell"><span>归集</span><strong>¥4,280<em>亿</em></strong></div>
                  <div class="dm-cell"><span>异常</span><strong style="color:#dc2626">¥3.2<em>亿</em></strong></div>
                  <div class="dm-cell"><span>拦截</span><strong style="color:#2563eb">5<em>笔</em></strong></div>
                  <div class="dm-cell"><span>授权</span><strong>680<em>项</em></strong></div>
                  <div class="dm-cell"><span>联签</span><strong>520<em>笔</em></strong></div>
                  <div class="dm-cell"><span>U盾异</span><strong style="color:#dc2626">6<em>枚</em></strong></div>
                  <div class="dm-cell"><span>出纳异</span><strong style="color:#dc2626">3<em>笔</em></strong></div>
                </div>
                <div class="drill-list">
                  <div v-for="d in fundDrillDomains" :key="d.id" class="dd-domain"
                    :class="[d.tone, { open: fundDomain === d.id }]">
                    <button class="dd-head" @click="toggleFundDomain(d.id)">
                      <span class="dd-ico">{{ d.icon }}</span>
                      <div class="dd-meta">
                        <strong>{{ d.name }}</strong>
                        <span>{{ d.summary }}</span>
                      </div>
                      <span class="dd-metric" :class="d.tone">{{ d.metric }}</span>
                      <span class="dd-badge" :class="d.tone">{{ d.badge }}</span>
                      <i class="dd-caret">▾</i>
                    </button>
                    <transition name="dd-acc">
                      <div v-if="fundDomain === d.id" class="dd-risks">
                        <div v-for="r in d.risks" :key="r.id" class="dd-risk"
                          :class="{ open: fundRisk === r.id }">
                          <div class="dr-row">
                            <i class="dr-bullet" :class="d.tone"></i>
                            <div class="dr-text">
                              <strong>{{ r.title }}</strong>
                              <p>{{ r.desc }}</p>
                            </div>
                            <span class="dr-amt">¥{{ r.amount }}</span>
                          </div>
                          <div class="dr-actions">
                            <span class="dr-actions-label">措施 ▸</span>
                            <button v-for="(a, i) in r.actions" :key="i" class="dr-action">{{ a }}</button>
                            <button class="dr-detail-btn" :class="{ open: fundRisk === r.id }"
                              @click="toggleFundRisk(r.id)">
                              {{ fundRisk === r.id ? '收起明细' : '查看明细' }} ▾
                            </button>
                          </div>
                          <transition name="dd-acc">
                            <div v-if="fundRisk === r.id" class="dr-leaf">
                              <div class="dl-head">
                                <span>流水号</span><span>对手方</span><span>金额</span><span>时间</span><span>证据</span>
                              </div>
                              <div v-for="(t, ti) in r.transactions" :key="t.no" class="dl-row" :style="{ '--i': ti }">
                                <span class="dl-no">{{ t.no }}</span>
                                <span class="dl-payee" :title="t.payee">{{ t.payee }}</span>
                                <span class="dl-amt">{{ t.amount }}</span>
                                <span class="dl-time">{{ t.time }}</span>
                                <span class="dl-evi" :title="t.evidence">{{ t.evidence }}</span>
                              </div>
                            </div>
                          </transition>
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <!-- 中栏 -->
        <main class="center">
          <!-- B2 资金主体穿透网络图（含 财务公司 枢纽） -->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>资金主体穿透网络图</h3>
              </div>
              <div class="b2-tools">
                <div class="legend-mini">
                  <span><i class="lg-dot lr-hq"></i>总部</span>
                  <span><i class="lg-dot lr-high"></i>高</span>
                  <span><i class="lg-dot lr-warn"></i>中</span>
                  <span><i class="lg-dot lr-safe"></i>低</span>
                </div>
                <button v-if="orbitChain" class="orbit-reset" @click="orbitChain = false">解除高亮</button>
              </div>
            </div>
            <div class="net-shell" :class="{ focused: orbitChain }">
              <div v-if="orbitChain" class="orbit-tip">
                <i>★</i> 已聚焦 ZJ-2026001 资金链路：对方账户 ← XX采购部门 ← XX建设一项目户 ← XX建设公司账户 ← 北方资金子户 ← 集团财务公司 ← 集团总部
              </div>
              <EChart :key="topoKey" class="net-chart" :option="networkOption" />
            </div>
          </section>

          <!-- C2 司库矩阵 + 银行/对手 TOP10 -->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>司库矩阵 · 银行/对手 TOP10 <span class="sub">业务热度 · U盾状态</span></h3>
              </div>
              <span class="pill cyan">穿透矩阵</span>
            </div>
            <div class="c2-body">
              <!-- 司库矩阵：10 业务域 × 风险态势（清晰可读版） -->
              <div class="matrix-wrap">
                <div class="matrix-head">
                  <span class="matrix-title">司库矩阵 · 业务域风险态势</span>
                  <span class="matrix-legend">
                    <i class="ml-chip green">正常 ≤2</i>
                    <i class="ml-chip yellow">关注 3-5</i>
                    <i class="ml-chip orange">告警 6-9</i>
                    <i class="ml-chip red">紧急 ≥10</i>
                  </span>
                </div>
                <div class="matrix-cols">
                  <span></span>
                  <span class="mc-cap" v-for="c in matrixCols" :key="c">{{ c }}</span>
                </div>
                <div class="matrix-grid">
                  <template v-for="row in matrixRows" :key="row.label">
                    <span class="mg-rowname" :class="row.tone">
                      {{ row.label }}
                      <em class="mg-sum">合计 <b>{{ row.sum }}</b></em>
                    </span>
                    <button
                      v-for="(v, i) in row.cells"
                      :key="row.label + '-' + i"
                      class="mg-cell"
                      :class="matrixToneOf(v)"
                      :title="`${row.label} · ${matrixCols[i]}: ${v} 项`"
                    >
                      <strong v-if="v > 0">{{ v }}</strong>
                    </button>
                  </template>
                </div>
              </div>
              <!-- 银行 TOP10 -->
              <div class="party-table">
                <div class="party-row party-head">
                  <span>#</span><span>银行/对手</span><span>余额</span><span>流入</span><span>流出</span><span>风险</span><span>U盾</span>
                </div>
                <button
                  v-for="b in bankRanking"
                  :key="b.rank"
                  class="party-row"
                  :class="{ active: activeBank === b.rank }"
                  @click="activeBank = activeBank === b.rank ? 0 : b.rank"
                >
                  <span class="party-rank" :class="rankClass(b.rank)">{{ b.rank }}</span>
                  <span class="party-name" :title="b.name">{{ b.name }}</span>
                  <span class="party-num">{{ b.balance }}</span>
                  <span class="party-num small-num">{{ b.inflow }}</span>
                  <span class="party-num small-num">{{ b.outflow }}</span>
                  <span class="party-risk">
                    <i v-if="b.risk > 0" class="risk-num" :class="b.risk >= 2 ? 'high' : 'mid'">{{ b.risk }}</i>
                    <i v-else class="risk-num zero">0</i>
                  </span>
                  <span class="party-ukey">
                    <i class="ukey-dot" :class="b.ukey"></i>
                    <em :class="b.ukey">{{ ukeyLabel(b.ukey) }}</em>
                  </span>
                  <!-- 原位名片 -->
                  <div v-if="activeBank === b.rank && b.card" class="bank-card" @click.stop>
                    <strong>{{ b.name }}</strong>
                    <p>{{ b.card }}</p>
                  </div>
                </button>
              </div>
            </div>
          </section>
        </main>

        <!-- 右栏 -->
        <aside class="right">
          <!-- B3 实时资金风险 -->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>实时资金风险</h3>
               
              </div>
              <span class="pill red">ZJ-2026001 置顶</span>
            </div>
            <div class="risk-stack">
              <button
                v-for="r in riskList"
                :key="r.id"
                class="risk-card"
                :class="[r.level, { active: activeRiskId === r.id }]"
                @click="showRiskDetail(r)"
              >
                <div class="risk-header">
                  <span class="risk-tag" :class="r.level">{{ r.no }}</span>
                  <span class="risk-level-badge" :class="r.level">{{ r.levelLabel }}</span>
                  <span class="risk-status" :class="r.statusCode">{{ r.status }}</span>
                  <span class="risk-time">⏱ {{ formatTime(r.warningTime) }}</span>
                  <button class="risk-ai-btn" @click.stop="openRisk(r.id)">
                    <span class="ai-btn-icon">✨</span>
                    <span class="ai-btn-text">AI 分析</span>
                    <span class="ai-btn-glow"></span>
                  </button>
                  <button v-if="analyzedRiskIds.has(r.id)" class="risk-report-btn" @click.stop="viewRiskReport(r.id)">
                    <span>📄</span>
                    <span>查看报告</span>
                  </button>
                </div>
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
              </button>
            </div>
          </section>

          <!-- C3 AI 建议 + 系统入口 -->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>AI 建议 · 系统入口</h3>
              </div>
              <span class="pill cyan">智能监管</span>
            </div>
            <div class="ai-list">
              <div
                v-for="a in aiSuggestions"
                :key="a.id"
                class="ai-item"
                :class="a.priority"
              >
                <div class="ai-avatar">AI</div>
                <div class="ai-body">
                  <div class="ai-meta">
                    <strong>{{ a.type }}</strong>
                    <span class="ai-pri" :class="a.priority">{{ a.priorityLabel }}</span>
                  </div>
                  <p>{{ a.content }}</p>
                </div>
              </div>
            </div>
            <div class="sys-grid">
              <button v-for="s in systemEntries" :key="s.id" class="sys-card" :class="{ off: s.statusClass === 'sys-maintenance' }">
                <span class="sys-icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
                <span class="sys-meta">
                  <strong>{{ s.label }}</strong>
                  <em :class="s.statusClass">{{ s.statusText }}</em>
                </span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
    </template>

    <!-- ══════════ 风险事项详情报告视图 ══════════ -->
    <template v-if="viewMode === 'risk-detail' && activeRisk">
      <div class="rd-view">
        <div class="cd-topbar rd-topbar">
          <div class="cd-topbar-left">
            <button type="button" class="rdr-back-btn" @click="goBack">{{ backLabel }}</button>
            <span class="cd-id">{{ activeRisk.no }}</span>
            <span class="risk-pill" :class="`rp-${activeRisk.level}`">{{ riskLevelLabel[activeRisk.level] }}</span>
          </div>
          <div class="cd-topbar-right">
            <span class="cd-status-pill" :class="`cdsp-${activeRisk.statusCode}`">{{ activeRisk.status }}</span>
            <span>生成时间：{{ activeRisk.warningTime }}</span>
          </div>
        </div>
        <div class="rd-content">
          <aside class="rd-sidebar">
            <!-- Hero 卡片：视觉重心 -->
            <div class="card rd-hero-card" :class="`rdh-${activeRisk.level}`">
              <div class="rdh-badge">
                <span class="rdh-badge-icon">{{ riskIconMap[activeRisk.level] }}</span>
                <span class="rdh-badge-text">{{ riskLevelLabel[activeRisk.level] }}</span>
              </div>
              <div class="rdh-id">{{ activeRisk.no }}</div>
              <h2 class="rdh-name">{{ activeRisk.name }}</h2>
              <div class="rdh-status-bar">
                <span class="rdh-status-pill" :class="`rics-${activeRisk.statusCode}`">{{ activeRisk.status }}</span>
                <span class="rdh-time">⏱ {{ activeRisk.warningTime }}</span>
              </div>
            </div>

            <!-- 关键信息卡 -->
            <div class="card rd-key-card">
              <div class="rdk-title">关键信息</div>
              <div class="rdk-row rdk-row-stack">
                <span class="rdk-lbl">👥 涉及主体</span>
                <div class="rdk-subjects">
                  <strong>{{ activeRisk.entity }}</strong>
                </div>
              </div>
              <div v-if="activeRisk.amount" class="rdk-row">
                <span class="rdk-lbl">💰 金额</span>
                <strong class="rdk-val">¥{{ activeRisk.amount }}{{ activeRisk.amountUnit }}</strong>
              </div>
              <div class="rdk-row rdk-row-stack">
                <span class="rdk-lbl">🛰 预警来源</span>
                <strong class="rdk-val-text">系统自动监测</strong>
              </div>
            </div>

            <!-- 处理进度卡 -->
            <div class="card rd-status-card">
              <div class="rds-title">处理进度</div>
              <div class="status-flow">
                <div class="sf-step" :class="{ done: true, current: activeRisk.status === '待核查' }">
                  <div class="sf-dot"></div>
                  <span>待核查</span>
                  <div class="sf-line"></div>
                </div>
                <div class="sf-step" :class="{ done: activeRisk.status !== '待核查', current: activeRisk.status === '核查中' }">
                  <div class="sf-dot"></div>
                  <span>核查中</span>
                  <div class="sf-line"></div>
                </div>
                <div class="sf-step" :class="{ done: activeRisk.status === '整改中' || activeRisk.status === '已闭环', current: activeRisk.status === '整改中' }">
                  <div class="sf-dot"></div>
                  <span>整改中</span>
                  <div class="sf-line"></div>
                </div>
                <div class="sf-step" :class="{ done: activeRisk.status === '已闭环', current: activeRisk.status === '已闭环' }">
                  <div class="sf-dot"></div>
                  <span>已闭环</span>
                </div>
              </div>
              <div class="rds-meta">
                <div><span>责任人</span><strong>{{ activeRisk.handler }}</strong></div>
                <div><span>整改期限</span><strong class="deadline">{{ activeRisk.deadline }}</strong></div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="card rd-actions-card">
              <div class="rda-title">核查操作</div>
              <div class="rda-grid">
                <button type="button" class="rda-btn primary" @click="showToast('核查工单已派发', 'info')">派发工单</button>
                <button type="button" class="rda-btn danger" @click="showToast('风险升级预警已推送', 'warn')">升级预警</button>
                <button type="button" class="rda-btn" @click="showToast('已补充材料，待审核', 'info')">补充材料</button>
                <button type="button" class="rda-btn" @click="showToast('已提交解除预警申请', 'info')">解除预警</button>
              </div>
            </div>
          </aside>
          <div class="rd-main">
            <div class="card rd-report">
              <div class="rdr-header">
                <div class="rdr-header-left">
                  <h2>风险事项详情报告</h2>
                  <p>资金管理域 · {{ activeRisk.name }} · AI智能体自动生成报告</p>
                  <p><a href="http://192.168.16.206:8098/process_detail?flow_id=10005&title=%E5%90%88%E5%90%8C%E7%A9%BF%E9%80%8F%E5%8E%9F" target="_blank">点击查看运行日志</a></p>
                </div>
              </div>
              <div class="rdr-scroll">
                <!-- ============ 完整报告内容 ============ -->
                <div class="report-container">
                    
                    <!-- 报告头部信息 -->
                    <div class="report-header-card">
                      <div class="rhc-title">【风险事项详情报告】</div>
                      <div class="rhc-info-grid">
                        <div class="rhc-info">
                          <span class="rhc-label">风险ID</span>
                          <span class="rhc-value mono">{{ activeRisk.no }}</span>
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
                          <span class="rhc-value">{{ activeRisk.warningTime }}</span>
                        </div>
                        <div class="rhc-info">
                          <span class="rhc-label">预警来源</span>
                          <span class="rhc-value">系统自动监测</span>
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
                          <div v-html="formatSectionContent(reportSectionOne)"></div>
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
                          <div v-html="formatSectionContent(reportSectionTwo)"></div>
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
                          <div v-html="formatSectionContent(reportSectionThree)"></div>
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
                        <div class="analysis-box">
                          <div v-html="formatSectionContent(reportSectionFour)"></div>
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
                            <div class="link-group-title">资金域</div>
                            <div class="link-items">
                              <button class="link-item" @click="showToast('查看银行流水', 'info')">
                                <span class="link-icon">💳</span>
                                <span class="link-text">银行流水</span>
                                <span class="link-id">LS-{{ activeRisk.no.slice(3) }}</span>
                              </button>
                              <button class="link-item" @click="showToast('查看付款申请', 'info')">
                                <span class="link-icon">📋</span>
                                <span class="link-text">付款申请单</span>
                                <span class="link-id">SK-{{ activeRisk.no.slice(3) }}</span>
                              </button>
                            </div>
                          </div>
                          <div class="link-group">
                            <div class="link-group-title">财务域</div>
                            <div class="link-items">
                              <button class="link-item" @click="showToast('查看发票', 'info')">
                                <span class="link-icon">🧾</span>
                                <span class="link-text">发票</span>
                                <span class="link-id">FP-{{ activeRisk.no.slice(3) }}</span>
                              </button>
                              <button class="link-item" @click="showToast('查看会计凭证', 'info')">
                                <span class="link-icon">📊</span>
                                <span class="link-text">会计凭证</span>
                                <span class="link-id">PZ-{{ activeRisk.no.slice(3) }}</span>
                              </button>
                            </div>
                          </div>
                          <div class="link-group">
                            <div class="link-group-title">合同域</div>
                            <div class="link-items">
                              <button class="link-item" @click="showToast('查看关联合同', 'info')">
                                <span class="link-icon">📄</span>
                                <span class="link-text">关联合同</span>
                                <span class="link-id">HT-{{ activeRisk.no.slice(3) }}</span>
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
                          <div v-html="formatSectionContent(reportSectionSix)"></div>
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
                            <span class="status-value" :class="activeRisk.status.toLowerCase().replace(/\s/g, '-')">{{ activeRisk.status }}</span>
                          </div>
                          <div class="status-item">
                            <span class="status-label">责任人</span>
                            <span class="status-value">{{ activeRisk.handler }}</span>
                          </div>
                          <div class="status-item">
                            <span class="status-label">整改期限</span>
                            <span class="status-value deadline">{{ activeRisk.deadline }}</span>
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

    <!-- Toast 提示 -->
    <Teleport to="body">
      <div v-if="toastVisible" class="toast-overlay">
        <div class="toast" :class="toastType">
          <span class="toast-icon">{{ toastType === 'warn' ? '⚠️' : 'ℹ️' }}</span>
          <span class="toast-text">{{ toastText }}</span>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import EChart from '../components/EChart.vue'
import axios from 'axios'

defineEmits(['navigate'])

// ===== 交互状态 =====
const selectedAreaId = ref('')
const period = ref('30d')
const activeRiskId = ref('R-ZJ-001')
const analyzedRiskIds = ref(new Set())
const riskDataCache = ref({})
const apiRiskData = ref(null)
const selectedRiskId = ref('')
const activeBank = ref(0)
const viewMode = ref('penetration')
const viewHistory = ref([])
const toastVisible = ref(false)
const toastText = ref('')
const toastType = ref('info')

// 风险等级标签映射
const riskLevelLabel = {
  red: '高风险',
  orange: '中风险',
  yellow: '低风险'
}

// 风险图标映射
const riskIconMap = {
  red: '⚠️',
  orange: '⚡',
  yellow: 'ℹ️'
}

// ----- C1 老板穿透：资金链路 + 责任链路 -----
const fundOpen = ref('approve')
const dutyOpen = ref('ukey')

// ===== Finance 风格资金穿透：支付层 / 账户层 / 境外担保 =====
const fundDomain = ref('fund-pay')
const fundRisk = ref('zj-2026001')
function toggleFundDomain(id) {
  fundDomain.value = fundDomain.value === id ? '' : id
  fundRisk.value = null
}
function toggleFundRisk(id) {
  fundRisk.value = fundRisk.value === id ? '' : id
}

const fundDrillDomains = [
  {
    id: 'fund-pay', icon: '💸', name: '支付层 · 异常出账',  tone: 'red',
    summary: 'ZJ-2026001 红线 · 对私大额 · 体外回流',
    metric: '94.0% 合规', badge: '5 笔异常',
    risks: [
      {
        id: 'zj-2026001', title: 'ZJ-2026001 异常大额付款', amount: '500 万',
        desc: 'XX采购部门向 XX贸易有限公司付款，无验收、合同金额仅 300 万',
        actions: ['🔒 立即拦截', '👤 追责经办', '📋 查看流水'],
        transactions: [
          { no: 'LS-20260518001', payee: 'XX贸易有限公司', amount: '¥500 万', time: '05-18 14:30', evidence: '无验收 · 合同差异 +67%' },
          { no: 'SK-20260518001', payee: 'XX贸易有限公司', amount: '¥500 万', time: '05-18 14:28', evidence: '审批未完成即出账' },
          { no: 'HD-20260518001', payee: '工行回单',       amount: '¥500 万', time: '05-18 14:32', evidence: '银行已扣款' },
        ],
      },
      {
        id: 'zj-2026012', title: '对私大额支付', amount: '280 万',
        desc: 'XX行政部门向 XXX 个人账户支付，无业务支撑',
        actions: ['🔒 冻结收款方', '👤 问责审批人', '📋 流水溯源'],
        transactions: [
          { no: 'LS-20260517028', payee: 'XXX 个人账户 6228****8821', amount: '¥280 万', time: '05-17 16:00', evidence: '收款方=报销人' },
          { no: 'SK-20260517028', payee: 'XXX 个人账户',              amount: '¥280 万', time: '05-17 15:48', evidence: '凭证无三方单据' },
        ],
      },
      {
        id: 'zj-2026018', title: '体外循环回流', amount: '850 万',
        desc: 'XX贸易公司付出后疑似经中间户回流',
        actions: ['🚨 反洗钱核查', '🔒 冻结中间户', '📦 关联项目'],
        transactions: [
          { no: 'LS-20260516011', payee: 'XX个人账户',  amount: '¥850 万', time: '05-16 11:30', evidence: '收方资金即转入三方' },
          { no: 'LS-20260514005', payee: 'XX空壳商贸', amount: '¥320 万', time: '05-14 09:48', evidence: '账户多层穿透 → 个人' },
        ],
      },
    ],
  },
  {
    id: 'fund-acc', icon: '🏦', name: '账户层 · 账户与归集', tone: 'orange',
    summary: '余额畸高 · 私设账户 · 归集失败',
    metric: '92.5% 合规', badge: '8 笔关注',
    risks: [
      {
        id: 'acc-r1', title: '余额畸高账户', amount: '12.6 亿',
        desc: 'XX科技公司主账户长期沉淀，归集率 < 60%',
        actions: ['📥 强制归集', '🔒 关停冗余户', '📞 通报二级总经理'],
        transactions: [
          { no: 'ACC-T-1024', payee: 'XX科技公司 基本户', amount: '¥12.6 亿', time: '余额', evidence: '归集率 42%' },
          { no: 'ACC-T-2057', payee: 'XX物流公司 一般户', amount: '¥3.8 亿',  time: '余额', evidence: '归集率 38%' },
        ],
      },
      {
        id: 'acc-r2', title: '账户私设疑似', amount: '0.85 亿',
        desc: 'XX能源公司未报备开立账户 2 个',
        actions: ['🔒 立即冻结', '👤 问责开户人', '📋 调阅档案'],
        transactions: [
          { no: 'ACC-X-205-A', payee: '某城商行（未报备）', amount: '¥5,200 万', time: '开户 2024-12', evidence: '操作员 陈XX 私自开户' },
          { no: 'ACC-X-205-B', payee: '某城商行（未报备）', amount: '¥3,300 万', time: '开户 2025-03', evidence: '资金来源不明' },
        ],
      },
      {
        id: 'acc-r3', title: '归集执行失败', amount: '5 次',
        desc: '夜间批量归集断链 2 小时',
        actions: ['🔍 排查接口', '🛠 恢复任务', '📞 通报技术部'],
        transactions: [
          { no: 'GJ-202605002', payee: '北方资金子户 → 财务公司', amount: '0 笔', time: '05-19 02:00', evidence: '接口超时 5 次' },
        ],
      },
    ],
  },
  {
    id: 'fund-off', icon: '🌐', name: '境外/担保 · 高风险关联', tone: 'red',
    summary: '境外可视 88% · 违规担保 ¥1,500万',
    metric: '88.0% 可视', badge: '6 笔预警',
    risks: [
      {
        id: 'off-r1', title: '境外银行 U 盾离线', amount: '> 72h',
        desc: 'XX银行（境外）U 盾持续离线，境外资金可视率下降',
        actions: ['📞 联系开户行', '🔒 暂停境外汇出', '📋 核查最后操作'],
        transactions: [
          { no: 'OFF-K0012', payee: 'XX境外银行 K0012', amount: '—', time: '离线 78h', evidence: '最后登录境外 IP' },
        ],
      },
      {
        id: 'off-r2', title: 'ZJ-2026025 违规担保', amount: '1,500 万',
        desc: 'XX投资公司未经董事会决议为关联企业提供担保',
        actions: ['🚫 解除担保', '📞 通报董事会', '🔒 冻结对外担保权限'],
        transactions: [
          { no: 'DB-2026025', payee: 'XX关联企业', amount: '¥1,500 万', time: '05-15 14:00', evidence: '未过三重一大' },
        ],
      },
    ],
  },
  // ===== 责任穿透 · 审批链路（合并入同一 drill 列表） =====
  {
    id: 'duty-ukey', icon: '🔑', name: '责任 · U盾 / 出纳越权', tone: 'red',
    summary: 'U盾异常 6 枚 · 出纳越权放款 ¥360万',
    metric: '95.5% 合规', badge: '9 笔异常',
    risks: [
      {
        id: 'duty-r1', title: 'ZJ-2026006 U盾境外异常登录', amount: '6 枚',
        desc: '出纳张XX 名下 6 枚 U 盾境外 IP 异常登录',
        actions: ['🔒 立即冻结 U 盾', '👤 责任人详情', '📋 操作日志'],
        transactions: [
          { no: 'U-K0012', payee: '出纳 张XX', amount: '6 枚 U 盾',  time: '05-19 03:42', evidence: '境外 IP · 凌晨登录' },
          { no: 'U-K0018', payee: '出纳 张XX', amount: 'K0018/0023', time: '05-19 03:55', evidence: '连续触发权限' },
        ],
      },
      {
        id: 'duty-r2', title: '出纳越权放款', amount: '360 万',
        desc: '陈XX 未联签直接对外放款 4 笔',
        actions: ['🔒 冻结出纳权限', '📥 资金追回', '🚨 移交纪检'],
        transactions: [
          { no: 'CN-202605001', payee: 'XX能源 出纳 陈XX', amount: '¥360 万', time: '05-19 11:28', evidence: '4 笔合计 · 未联签' },
        ],
      },
      {
        id: 'duty-r3', title: '非授权高频盖印', amount: '3 枚 · 47次/日',
        desc: '行政 高XX 持有 3 枚 U 盾单日盖印 47 次',
        actions: ['📋 调阅盖印日志', '👤 同岗排查', '🔒 临时冻结'],
        transactions: [
          { no: 'U-K0078', payee: '行政 高XX', amount: '17 次',  time: '05-18 22:10', evidence: '夜间高频' },
          { no: 'U-K0092', payee: '行政 高XX', amount: '18 次',  time: '05-18 22:42', evidence: '同 IP 多账号' },
          { no: 'U-K0103', payee: '行政 高XX', amount: '12 次',  time: '05-18 23:08', evidence: '零附件' },
        ],
      },
    ],
  },
  {
    id: 'duty-auth', icon: '⚖️', name: '责任 · 审批跳级 / 三重一大', tone: 'orange',
    summary: '审批跳级 8 项 · 三重一大缺失 8 项',
    metric: '94.2% 合规', badge: '16 项关注',
    risks: [
      {
        id: 'duty-r4', title: '审批跳级', amount: '8 项',
        desc: 'XX建设公司部门负责人直接绕过分管副总',
        actions: ['🔒 强控审批节点', '👤 问责审批人', '📋 调阅审批链'],
        transactions: [
          { no: 'SP-202605017', payee: 'XX建设 王某', amount: '5 项', time: '近 30 天', evidence: '应由副总审批' },
          { no: 'SP-202605021', payee: 'XX投资 李某', amount: '3 项', time: '近 30 天', evidence: '审批流跳过节点 3' },
        ],
      },
      {
        id: 'duty-r5', title: '三重一大缺失', amount: '8 项',
        desc: '8 项大额事项未走三重一大流程直接执行',
        actions: ['📞 通报董事会', '🚫 暂缓执行', '📋 补录会议纪要'],
        transactions: [
          { no: 'BIG-2026-018', payee: 'XX担保事项',    amount: '¥1,800 万', time: '05-15', evidence: '未过董事会' },
          { no: 'BIG-2026-012', payee: 'XX重大对外投资', amount: '¥1,200 万', time: '05-09', evidence: '总经理办公会越权' },
          { no: 'BIG-2026-007', payee: 'XX资产处置',     amount: '¥680 万',  time: '04-28', evidence: '无会议纪要' },
        ],
      },
    ],
  },
]

const fundChain = [
  { id: 'account', cap: '账户总览', val: '1,200 户' },
  { id: 'pool',    cap: '归集中心', val: '¥4,280亿' },
  { id: 'settle',  cap: '结算中心', val: '12,800 笔' },
  { id: 'approve', cap: '支付审批', val: '8,420 项', tone: 'warn', alert: 5 },
  { id: 'pay',     cap: '银行支付', val: '9,850 笔' },
]
const dutyChain = [
  { id: 'auth',    cap: '支付授权', val: '680 项' },
  { id: 'sign',    cap: '联签记录', val: '520 笔' },
  { id: 'ukey',    cap: 'U盾管理', val: '128 枚', tone: 'warn', alert: 6 },
  { id: 'cashier', cap: '出纳操作', val: '2,400 笔', tone: 'warn', alert: 3 },
  { id: 'major',   cap: '三重一大', val: '48 项', tone: 'ok' },
]

const fundDetails = {
  account: [
    { id: 'a1', no: 'ACC-Z108', level: 'orange', name: '余额畸高账户', amount: '12.6亿',
      handler: 'XX科技公司 主账户', payee: '工商银行 6222****1234', project: '长期资金沉淀' },
    { id: 'a2', no: 'ACC-X205', level: 'red', name: '账户私设疑似', amount: '0.85亿',
      handler: 'XX能源公司 / 操作员 陈XX', payee: '某城商行（未报备）', project: '——' },
  ],
  approve: [
    { id: 'p1', no: 'ZJ-2026001', level: 'red', name: '异常大额付款', amount: '500 万',
      handler: '王XX（XX采购部门）', payee: 'XX贸易有限公司', project: 'XX燃机备件采购 (HT-202603005)' },
    { id: 'p2', no: 'ZJ-2026012', level: 'red', name: '对私大额支付', amount: '280 万',
      handler: '李XX（XX行政部）', payee: 'XXX 个人账户 6228****8821', project: '——' },
    { id: 'p3', no: 'ZJ-2026018', level: 'red', name: '体外循环疑似', amount: '850 万',
      handler: '刘XX（XX贸易公司）', payee: 'XX个人账户 → 三方回流', project: '关联方资金回流' },
    { id: 'p4', no: 'ZJ-2026025', level: 'orange', name: '违规对外担保', amount: '1,500 万',
      handler: '赵XX（XX投资公司）', payee: 'XX关联企业', project: '未经董事会决议' },
    { id: 'p5', no: 'ZJ-2026032', level: 'orange', name: '挂靠费支付', amount: '65 万',
      handler: '钱XX（XX建设公司）', payee: 'XX个人承包商', project: '某市政外包项目' },
  ],
  settle: [
    { id: 's1', no: 'JS-202604018', level: 'orange', name: '跨境结算超阈', amount: '2,200 万',
      handler: 'XX贸易公司 / 出纳 周XX', payee: 'XX银行（境外）', project: '境外采购合同' },
  ],
  pool: [
    { id: 'g1', no: 'GJ-202605002', level: 'orange', name: '归集执行失败', amount: '5 次',
      handler: '集团财务公司 夜间批', payee: '——', project: '夜间归集断链 2 小时' },
  ],
  pay: [
    { id: 'y1', no: 'YH-20260518', level: 'orange', name: '高频拒付', amount: '12 笔',
      handler: '银行通道异常', payee: '——', project: '银行接口超时' },
  ],
}

const dutyDetails = {
  ukey: [
    { id: 'u1', no: 'ZJ-2026006', level: 'red', name: 'U盾境外异常登录', scope: '6 枚',
      handler: '出纳 张XX（XX财务部）', target: 'K0012 / K0018 / K0023 / K0031 / K0042 / K0055',
      last: '2026-05-19 03:42 · 境外 IP' },
    { id: 'u2', no: 'ZJ-2026029', level: 'orange', name: '非授权高频盖印', scope: '3 枚',
      handler: '行政 高XX（XX投资公司）', target: 'K0078 / K0092 / K0103',
      last: '2026-05-18 22:10 · 单日 47 次' },
  ],
  cashier: [
    { id: 'c1', no: 'CN-202605001', level: 'red', name: '出纳越权放款', scope: '1 人',
      handler: '出纳 陈XX（XX能源公司）', target: '4 笔合计 ¥360 万',
      last: '2026-05-19 11:28 · 未联签' },
    { id: 'c2', no: 'CN-202605002', level: 'orange', name: '出纳兼岗', scope: '2 人',
      handler: '出纳 何XX（XX物流公司）', target: '同时持有付款 + 记账',
      last: '不相容职责' },
  ],
  auth: [
    { id: 'au1', no: 'SP-202605017', level: 'orange', name: '审批跳级', scope: '8 项',
      handler: 'XX建设公司 / 部门负责人', target: '直接绕过分管副总',
      last: '近 30 天 8 次' },
  ],
  sign: [
    { id: 'ls1', no: 'LS-202605008', level: 'orange', name: '联签缺位', scope: '3 笔',
      handler: 'XX科技公司 / 第二联签人', target: '¥120 万合计',
      last: '应双签实际单签' },
  ],
  major: [
    { id: 'm1', no: 'SZ-2026001', level: 'green', name: '三重一大记录完整', scope: '48 项',
      handler: '集团董事会 / 党委会', target: '决议齐备',
      last: '合规率 100%' },
  ],
}

function fundChainCap(id) { return (fundChain.find(n => n.id === id) || {}).cap || '' }
function dutyChainCap(id) { return (dutyChain.find(n => n.id === id) || {}).cap || '' }
function toggleFundStep(id) { fundOpen.value = fundOpen.value === id ? '' : id }
function toggleDutyStep(id) { dutyOpen.value = dutyOpen.value === id ? '' : id }

const periods = [
  { key: '30d', label: '近30天' },
  { key: '3m',  label: '近3月' },
  { key: '6m',  label: '近半年' },
]
const periodLabelMap = { '30d': '近30天', '3m': '近3月', '6m': '近半年' }
const periodLabel = computed(() => periodLabelMap[period.value])

// 编辑型抬头日期戳
const _now = new Date()
const _pad = (n) => String(n).padStart(2, '0')
const _weekCn = ['日', '一', '二', '三', '四', '五', '六']
const todayMD = `${_pad(_now.getMonth() + 1)} · ${_pad(_now.getDate())}`
const todayYear = `${_now.getFullYear()}`
const todayWeek = `星期${_weekCn[_now.getDay()]}`

// ===== A1 八维雷达 =====
const radarOption = computed(() => ({
  animation: false,
  backgroundColor: 'transparent',
  tooltip: { backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#dbeafe', textStyle: { color: '#334155', fontSize: 11 } },
  radar: {
    indicator: [
      { name: '集中', max: 100 },
      { name: '结算', max: 100 },
      { name: '融资', max: 100 },
      { name: '票据', max: 100 },
      { name: '担保', max: 100 },
      { name: '外汇', max: 100 },
      { name: '两金', max: 100 },
      { name: '资源', max: 100 },
    ],
    radius: '52%',
    center: ['50%', '54%'],
    splitNumber: 4,
    axisName: { color: '#475569', fontSize: 11, fontWeight: 600 },
    splitArea: { areaStyle: { color: ['rgba(37,99,235,0.04)', 'rgba(37,99,235,0.08)'] } },
    splitLine: { lineStyle: { color: '#e2e8f0' } },
    axisLine: { lineStyle: { color: '#C9B98A' } },
  },
  series: [{
    type: 'radar',
    symbol: 'circle',
    symbolSize: 5,
    lineStyle: { color: '#2563eb', width: 2 },
    itemStyle: { color: '#2563eb', borderColor: '#fff', borderWidth: 1.5 },
    areaStyle: { color: 'rgba(37,99,235,0.18)' },
    data: [{ value: [94, 96, 85, 88, 82, 90, 78, 75], name: '司库大盘 86.0' }],
  }],
}))

// ===== A3 四轴趋势 =====
const trendOption = computed(() => ({
  animation: false,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(250,246,236,0.96)', borderColor: '#C9B98A', textStyle: { color: '#334155', fontSize: 11 } },
  legend: { top: 0, left: 'center', itemGap: 10, itemWidth: 10, itemHeight: 6, textStyle: { color: '#5C6A82', fontSize: 10 } },
  grid: { left: 8, right: 8, top: 32, bottom: 4, containLabel: true },
  xAxis: {
    type: 'category',
    data: ['06', '07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05'],
    axisLabel: { color: '#5C6A82', fontSize: 10 },
    axisLine: { lineStyle: { color: '#C9B98A' } },
  },
  yAxis: [
    { type: 'value', name: '亿', nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLabel: { color: '#5C6A82', fontSize: 10 }, splitLine: { lineStyle: { color: '#EEF0F4' } } },
    { type: 'value', name: '% / 笔', nameTextStyle: { color: '#8A8270', fontSize: 10 },
      axisLabel: { color: '#5C6A82', fontSize: 10 }, splitLine: { show: false } },
  ],
  series: [
    { name: '资金余额', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, yAxisIndex: 0,
      lineStyle: { width: 2, color: '#2563eb' }, itemStyle: { color: '#2563eb' },
      areaStyle: { color: 'rgba(37,99,235,0.14)' },
      data: [3800, 3850, 3920, 3780, 3980, 4050, 3900, 3950, 4080, 4180, 4250, 4280] },
    { name: '融资额', type: 'bar', yAxisIndex: 0, barWidth: 6,
      itemStyle: { color: 'rgba(124,58,237,0.5)' },
      data: [6200, 6280, 6350, 6400, 6450, 6500, 6550, 6580, 6620, 6680, 6750, 6800] },
    { name: '归集率', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, yAxisIndex: 1,
      lineStyle: { width: 2, color: '#16a34a' }, itemStyle: { color: '#16a34a' },
      data: [88, 89, 90, 88, 91, 92, 90, 91, 92, 93, 94, 94] },
    { name: '风险拦截', type: 'scatter', yAxisIndex: 1, symbolSize: 9,
      itemStyle: { color: '#f97316', borderColor: '#fff', borderWidth: 1 },
      data: [15, 12, 18, 10, 14, 11, 16, 9, 11, 13, 12, 10] },
  ],
}))

// ===== B1 风险域 =====
const riskAreas = [
  { id: 'ZJ-R02', label: '大额异常',     desc: '超阈值大额无业务支撑',       level: 'red',
    tickets: [{ no: 'ZJ-2026001', desc: 'XX采购部门 500 万无验收付款' }, { no: 'ZJ-2026012', desc: '对私大额 280 万' }] },
  { id: 'ZJ-R06', label: 'U盾失控',      desc: 'U盾保管使用不合规',          level: 'red',
    tickets: [{ no: 'ZJ-2026006', desc: '出纳 6 枚 U 盾异常登录' }] },
  { id: 'ZJ-R03', label: '违规担保',     desc: '超授权对外担保',             level: 'red',
    tickets: [{ no: 'ZJ-2026025', desc: 'XX投资公司 1,500 万违规担保' }] },
  { id: 'ZJ-R05', label: '境外失控',     desc: '境外资金不可见',             level: 'red',
    tickets: [{ no: 'ZJ-2026005', desc: 'XX银行（境外）U盾离线 > 72h' }] },
  { id: 'ZJ-R01', label: '体外循环',     desc: '资金脱离监管体系',           level: 'orange',
    tickets: [{ no: 'ZJ-2026018', desc: 'XX贸易公司 850 万付个人账户' }] },
  { id: 'ZJ-R04', label: '融资贸易',     desc: '贸易背景虚假融资',           level: 'orange',
    tickets: [{ no: 'ZJ-2026031', desc: '无实物贸易循环开票' }] },
  { id: 'ZJ-R07', label: '对私支付',     desc: '异常对私人大额支付',         level: 'orange',
    tickets: [{ no: 'ZJ-2026012', desc: 'XX 行政部门对个人 280 万' }] },
  { id: 'ZJ-R08', label: '挂靠费',       desc: '资金流水挂靠费关键词',       level: 'yellow',
    tickets: [{ no: 'ZJ-2026032', desc: 'XX 建设公司 65 万挂靠费' }] },
  { id: 'ZJ-R09', label: '账户私设',     desc: '未经审批私设账户',           level: 'yellow',
    tickets: [{ no: 'ZJ-2026038', desc: 'XX 能源公司未报备账户 2 个' }] },
  { id: 'ZJ-R10', label: '归集失败',     desc: '资金归集执行频繁失败',       level: 'yellow',
    tickets: [{ no: 'ZJ-2026041', desc: '夜间批量归集断链 5 次' }] },
  { id: 'ZJ-R11', label: '票据套利',     desc: '票据贴现套利',               level: 'blue',
    tickets: [{ no: 'ZJ-2026045', desc: '关联方背书循环' }] },
  { id: 'ZJ-R12', label: '两金占用',     desc: '资金被两金大量占用',         level: 'blue',
    tickets: [{ no: 'ZJ-2026050', desc: '应收账期超 180 天' }] },
]

// 三个时间档位的风险条数（30天/3月/半年 累积口径）
const periodCounts = {
  '30d': [5, 8, 4, 6, 3, 6, 8, 10, 9, 7, 12, 15],
  '3m':  [12, 18, 9, 14, 7, 13, 18, 22, 18, 15, 25, 30],
  '6m':  [22, 32, 16, 25, 12, 23, 30, 38, 30, 26, 42, 52],
}
const periodClosed = { '30d': 12, '3m': 38, '6m': 86 }

const currentAreas = computed(() => riskAreas.map((a, i) => ({ ...a, count: periodCounts[period.value][i] })))
const currentTotal = computed(() => periodCounts[period.value].reduce((s, n) => s + n, 0))
const currentHigh = computed(() => currentAreas.value.filter(a => a.level === 'red').reduce((s, a) => s + a.count, 0))
const currentMedium = computed(() => currentAreas.value.filter(a => a.level === 'orange' || a.level === 'yellow').reduce((s, a) => s + a.count, 0))
const currentClosed = computed(() => periodClosed[period.value])

const periodTrend = computed(() => {
  // 与上一档位比较
  const order = ['30d', '3m', '6m']
  const idx = order.indexOf(period.value)
  if (idx <= 0) return { high: '基准', medium: '基准' }
  const prev = order[idx - 1]
  const curHi = currentHigh.value
  const curMd = currentMedium.value
  const prevHi = riskAreas.reduce((s, a, i) => s + (a.level === 'red' ? periodCounts[prev][i] : 0), 0)
  const prevMd = riskAreas.reduce((s, a, i) => s + ((a.level === 'orange' || a.level === 'yellow') ? periodCounts[prev][i] : 0), 0)
  const fmt = (d) => (d > 0 ? `+${d}` : `${d}`)
  return { high: fmt(curHi - prevHi), medium: fmt(curMd - prevMd) }
})

function trendClass(v) {
  if (typeof v !== 'string') return ''
  if (v.startsWith('+')) return 'up'
  if (v.startsWith('-')) return 'down'
  return ''
}

const selectedArea = computed(() => currentAreas.value.find(a => a.id === selectedAreaId.value) || {})

const levelHex = { red: '#dc2626', orange: '#f97316', yellow: '#ca8a04', blue: '#2563eb', green: '#16a34a' }
// 12 域独立色相（沿色环均匀分布：红→玫瑰→紫→蓝→青→翠→金→琥珀），高区分度
// 例：ZJ-R01 体外循环 = 朱红；ZJ-R02 异常付款 = 红；ZJ-R03 违规担保 = 玫瑰；ZJ-R05 境外U盾 = 深紫；
// ZJ-R06 U盾失控 = 靛；ZJ-R07 对私支付 = 蓝；ZJ-R11 资金归集 = 青；ZJ-R12 境外结算 = 翠；
// ZJ-R04 虚假贸易 = 鲜黄；ZJ-R08 挂靠费 = 琥珀；ZJ-R09 利率异常 = 橙；ZJ-R10 票据贴现 = 金。
const domainHex = {
  'ZJ-R01': '#16A34A', // 翠绿  — 体外循环（用户指定）
  'ZJ-R02': '#DC2626', // 红    — 异常大额付款
  'ZJ-R03': '#F97316', // 橘    — 违规担保（用户指定）
  'ZJ-R04': '#A16207', // 深琥珀 — 融资贸易
  'ZJ-R05': '#7C3AED', // 深紫  — 境外失控
  'ZJ-R06': '#6366F1', // 靛蓝  — U盾失控
  'ZJ-R07': '#3B82F6', // 蓝    — 对私支付
  'ZJ-R08': '#D97706', // 琥珀  — 挂靠费
  'ZJ-R09': '#EF4444', // 红    — 账户私设（用户指定）
  'ZJ-R10': '#0891B2', // 青    — 归集失败
  'ZJ-R11': '#FACC15', // 黄    — 票据套利（用户指定）
  'ZJ-R12': '#14B8A6', // 翠绿  — 两金占用
}

// 每个风险域【正常业务量】基线 — 与风险条对比形成比例
const normalCount = [
  35, 180, 45, 120, 85, 128, 240, 22, 58, 380, 420, 320,
]

const riskPolarOption = computed(() => {
  const areas = currentAreas.value
  return {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(250,246,236,0.96)', borderColor: '#C9B98A', textStyle: { color: '#0F2546', fontSize: 11 },
      formatter: (p) => { const a = areas[p.dataIndex]; const hex = domainHex[a?.id] || levelHex[a?.level] || '#2563EB'; return `<b>${p.name}</b><br/>${a?.desc || ''}<br/>${periodLabel.value}：<b style="color:${hex}">${p.value} 条</b>`; },
    },
    polar: { radius: ['18%', '78%'], center: ['50%', '52%'] },
    angleAxis: {
      type: 'category',
      data: areas.map(a => a.label),
      startAngle: 90,
      axisLine: { lineStyle: { color: '#C9B98A' } },
      axisTick: { show: false },
      axisLabel: { color: '#5C6A82', fontSize: 9, interval: 0, margin: 4 },
    },
    radiusAxis: {
      max: 480,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(15,23,42,0.05)' } },
    },
    series: [
      {
        type: 'bar',
        coordinateSystem: 'polar',
        roundCap: true,
        barGap: '-100%',
        z: 1,
        silent: true,
        data: areas.map((a, i) => ({ value: normalCount[i], itemStyle: { color: 'rgba(148,163,184,0.20)' } })),
      },
      {
        type: 'bar',
        coordinateSystem: 'polar',
        roundCap: true,
        barGap: '-100%',
        z: 2,
        data: areas.map(a => ({ value: a.count, itemStyle: { color: domainHex[a.id] || levelHex[a.level], opacity: 0.92 }, name: a.id })),
        label: {
          show: true,
          position: 'middle',
          formatter: (p) => p.value > 0 ? String(p.value) : '',
          fontSize: 11,
          fontWeight: 800,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#fff',
          textBorderColor: 'rgba(15,23,42,0.45)',
          textBorderWidth: 2,
        },
        emphasis: { itemStyle: { opacity: 1, shadowBlur: 12, shadowColor: 'rgba(15,23,42,0.22)' }, label: { fontSize: 13 } },
      },
    ],
  }
})

const hoveredAreaId = ref('')
const caseMap = {
  'ZJ-R02': [ { no: 'ZJ-2026001', text: '异常大额付款 ¥500万 · XX采购部门', tone: 'red' } ],
  'ZJ-R06': [ { no: 'ZJ-2026006', text: 'U盾失控 6 枚 · 出纳张XX', tone: 'red' } ],
  'ZJ-R03': [ { no: 'ZJ-2026025', text: '违规担保 ¥1,500万 · XX投资公司', tone: 'orange' } ],
  'ZJ-R01': [ { no: 'ZJ-2026018', text: '体外循环 ¥850万', tone: 'orange' } ],
  'ZJ-R04': [ { no: 'ZJ-2026031', text: '无实物贸易循环开票', tone: 'orange' } ],
  'ZJ-R05': [ { no: 'ZJ-2026005', text: '境外银行 U 盾离线 > 72h', tone: 'red' } ],
  'ZJ-R07': [ { no: 'ZJ-2026012', text: '对私支付 ¥280万', tone: 'orange' } ],
  'ZJ-R08': [ { no: 'ZJ-2026032', text: '挂靠费 ¥65万', tone: 'yellow' } ],
}
const hoverCases = computed(() => caseMap[hoveredAreaId.value] || [])
function onDomainHover(e) {
  if (!e || typeof e.dataIndex !== 'number') return
  const id = currentAreas.value[e.dataIndex]?.id
  if (id) hoveredAreaId.value = id
}
function onDomainBlur() { hoveredAreaId.value = '' }
function onDomainClick(e) {
  if (!e || typeof e.dataIndex !== 'number') return
  const id = currentAreas.value[e.dataIndex]?.id
  if (!id) return
  selectedAreaId.value = selectedAreaId.value === id ? '' : id
}

// ===== C1 资金穿透 - 拦截 5 笔 =====
const interceptList = [
  { no: 'ZJ-2026001', party: 'XX 贸易有限公司',  amount: 500,  handler: 'XXX' },
  { no: 'ZJ-2026012', party: 'XXX 个人',         amount: 280,  handler: '李XX' },
  { no: 'ZJ-2026018', party: 'XX 个人账户',      amount: 850,  handler: '王XX' },
  { no: 'ZJ-2026025', party: 'XX 关联企业',      amount: 1500, handler: '赵XX' },
  { no: 'ZJ-2026032', party: 'XX 个人承包商',    amount: 65,   handler: '钱XX' },
]

const ukeyFiltered = computed(() => (ukeyFilter.value === 'all' ? 6 : ukeyFilter.value === 'offline' ? 3 : 3))

// ===== C2 业务热力图 =====
// ===== C2 司库矩阵：业务域 × 风险态势（明确数字 + 4 色等级） =====
const matrixCols = ['账户', '结算', '融资', '票据', '担保', '外汇', '两金', '挂靠', '境外']
const matrixRaw = [
  // 数字 = 该业务子域当月触发的风险项数量
  { label: '销售收款',  cells: [0, 1, 0, 0, 0, 0, 2, 0, 1] },
  { label: '采购付款',  cells: [3, 2, 0, 1, 0, 0, 4, 7, 2] },
  { label: '工资税费',  cells: [1, 1, 0, 0, 0, 0, 1, 0, 0] },
  { label: '担保保证',  cells: [0, 1, 0, 1,11, 0, 0, 0, 0] },
  { label: '融资本息',  cells: [2, 1,10, 3, 4, 2, 0, 0, 1] },
  { label: '票据贴现',  cells: [0, 1, 6,12, 0, 0, 1, 0, 0] },
  { label: '内部归集',  cells: [5, 3, 0, 0, 0, 1, 4, 1, 2] },
  { label: '境外结算',  cells: [0, 1, 0, 0, 0, 8, 0, 0,14] },
]
// 行视图：转成 {label, cells, sum, tone}
const matrixRows = matrixRaw.map(r => {
  const sum = r.cells.reduce((s, n) => s + n, 0)
  const max = Math.max(...r.cells)
  const tone = max >= 10 ? 'red' : max >= 6 ? 'orange' : max >= 3 ? 'yellow' : 'green'
  return { ...r, sum, tone }
})
function matrixToneOf(v) {
  if (v >= 10) return 'red'
  if (v >= 6)  return 'orange'
  if (v >= 3)  return 'yellow'
  if (v >= 1)  return 'mild'
  return 'zero'
}

const heatRows = ['账户', '结算', '融资', '票据', '担保', '外汇', '两金', '挂靠', '境外', '资源']
const heatCols = ['销售收款', '采购付款', '工资税费', '担保保证金', '融资本息', '票据贴现', '内部归集', '境外结算']
const heatRawData = [
  [80, 60, 30, 10, 20, 15, 90, 5],   // 账户
  [70, 85, 50, 12, 30, 22, 75, 8],   // 结算
  [20, 30, 15, 25, 92, 60, 18, 22],  // 融资
  [25, 45, 10, 18, 30, 88, 22, 15],  // 票据
  [10, 15, 8, 90, 35, 10, 12, 5],    // 担保
  [15, 20, 12, 10, 25, 15, 18, 78],  // 外汇
  [40, 55, 60, 15, 18, 12, 65, 10],  // 两金
  [12, 70, 8, 5, 6, 4, 8, 6],        // 挂靠（异常）
  [10, 18, 8, 6, 20, 10, 15, 95],    // 境外（异常）
  [22, 28, 18, 12, 14, 10, 20, 16],  // 资源
]
const hotCells = [{ r: 7, c: 1 }, { r: 8, c: 7 }]
const isHotCell = (r, c) => hotCells.some(h => h.r === r && h.c === c)
const heatmapOption = computed(() => {
  const data = []
  for (let r = 0; r < heatRows.length; r++) {
    for (let c = 0; c < heatCols.length; c++) {
      data.push([c, r, heatRawData[r][c], isHotCell(r, c)])
    }
  }
  return {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(250,246,236,0.96)', borderColor: '#C9B98A', textStyle: { color: '#0F2546', fontSize: 11 },
      formatter: (p) => `${heatRows[p.value[1]]} · ${heatCols[p.value[0]]}<br/>吞吐：<b>${p.value[2]}</b>${p.value[3] ? '<br/><span style="color:#f97316">异常高频</span>' : ''}`,
    },
    grid: { left: 50, right: 8, top: 20, bottom: 36 },
    xAxis: { type: 'category', data: heatCols, axisLabel: { color: '#5C6A82', fontSize: 9, rotate: 18 }, axisLine: { lineStyle: { color: '#C9B98A' } }, splitArea: { show: false } },
    yAxis: { type: 'category', data: heatRows, axisLabel: { color: '#5C6A82', fontSize: 10 }, axisLine: { lineStyle: { color: '#C9B98A' } }, splitArea: { show: false } },
    visualMap: { min: 0, max: 100, show: false, inRange: { color: ['#d1fae5', '#a7f3d0', '#fef08a', '#fdba74', '#fca5a5', '#ef4444'] } },
    series: [{
      type: 'heatmap', data,
      itemStyle: {
        borderColor: '#fff', borderWidth: 1,
      },
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(37,99,235,0.5)' } },
      markPoint: {
        symbol: 'rect', symbolSize: [38, 22], silent: true,
        label: { show: false },
        itemStyle: { color: 'rgba(249,115,22,0.18)', borderColor: '#f97316', borderWidth: 1.5 },
        data: hotCells.map(h => ({ coord: [h.c, h.r] })),
      },
    }],
  }
})

// ===== C2 银行 TOP10 =====
const bankRanking = [
  { rank: 1,  name: '中国工商银行 XX 分行', balance: 1280, inflow: 850, outflow: 720, risk: 0, ukey: 'online' },
  { rank: 2,  name: '中国建设银行 XX 分行', balance: 950,  inflow: 680, outflow: 580, risk: 0, ukey: 'online' },
  { rank: 3,  name: '中国银行 XX 分行',     balance: 680,  inflow: 420, outflow: 380, risk: 1, ukey: 'online' },
  { rank: 4,  name: '招商银行 XX 分行',     balance: 520,  inflow: 380, outflow: 320, risk: 0, ukey: 'online' },
  { rank: 5,  name: 'XX 银行（境外）',      balance: 380,  inflow: 220, outflow: 180, risk: 2, ukey: 'offline',
    card: '境外 U 盾离线超 72h，触发境外资金可视率失控预警，立即联系开户行复核。' },
  { rank: 6,  name: '中国农业银行 XX 分行', balance: 320,  inflow: 250, outflow: 220, risk: 0, ukey: 'online' },
  { rank: 7,  name: '交通银行 XX 分行',     balance: 220,  inflow: 180, outflow: 150, risk: 0, ukey: 'online' },
  { rank: 8,  name: 'XX 外资银行',          balance: 420,  inflow: 85,  outflow: 65,  risk: 0, ukey: 'abnormal',
    card: '硬件 U 盾呈现强光红色异常态。授信超额 80 亿、代垫资金占用 23 亿，建议立即组织代垫清欠。' },
  { rank: 9,  name: '中信银行 XX 分行',     balance: 180,  inflow: 120, outflow: 95,  risk: 1, ukey: 'online' },
  { rank: 10, name: '浦发银行 XX 分行',     balance: 85,   inflow: 65,  outflow: 55,  risk: 0, ukey: 'online' },
]

// ===== B3 实时风险 =====
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(' ')
  if (parts.length === 2) {
    return parts[1]
  }
  return timeStr
}

const riskList = [
  {
    id: 'R-ZJ-001', no: 'ZJ-2026001', name: '异常大额付款预警', level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-18 14:30', entity: 'XX采购部门 / XX贸易有限公司',
    status: '待核查', statusCode: 'pending', amount: '500', amountUnit: '万元',
    handler: '何XX（资金部）', deadline: '2026-05-25',
    endpoints: [
      { code: 'fund', icon: '💳', title: '资金端（司库系统）', tag: '红线触发', tone: 'red',
        lines: [
          '银行流水 <b class="mono">LS-20260518001</b>，实付 <b class="glow-red">500 万元</b>，经办人 XXX。',
          '<span class="glow-red">该笔资金在内部资金审批流程未完成、缺少部门负责人签字的情况下即触发线上出账。</span>',
        ] },
      { code: 'contract', icon: '📜', title: '合同端（法务系统）', tag: '严重偏差', tone: 'red',
        lines: [
          '关联合同 <b class="mono">HT-202603005</b>，约定总金额仅 <b>300 万元</b>，付款条款"验收合格后支付 80%"。',
          '当前合同履约进度 <b class="glow-yellow">仅 30%</b>，<span class="glow-red">判定为未达付款条件、付款金额与合同差异巨大</span>。',
        ] },
      { code: 'purchase', icon: '📦', title: '采购端（招采系统）', tag: '无凭证', tone: 'yellow',
        lines: [
          '招采供应链计划 <b class="mono">CG-202603005</b> 显示物资 <b class="glow-yellow">尚未在现场到货</b>。',
          '无任何对应的财务验收记录物证，无法支持本次 500 万元付款。',
        ] },
      { code: 'finance', icon: '📑', title: '财务端（核算系统）', tag: '合规不足', tone: 'yellow',
        lines: [
          '会计凭证 <b class="mono">PZ-20260518008</b> 未附三方到货单、合同付款节点说明。',
          '<span class="glow-yellow">核算合规依据极不充分</span>，需立即补充支撑材料并红冲。',
        ] },
    ],
    penetrationLinks: [
      { domain: '资金域', data: '银行流水 LS-20260518001' },
      { domain: '资金域', data: '付款申请单 SK-20260518001' },
      { domain: '资金域', data: '银行回单 HD-20260518001' },
      { domain: '合同域', data: '合同 HT-202603005' },
      { domain: '合同域', data: '合同审批 SP-202603005' },
      { domain: '采购域', data: '采购计划 CG-202603005' },
      { domain: '采购域', data: '中标记录 ZB-202603005' },
      { domain: '财务域', data: '会计凭证 PZ-20260518008' },
      { domain: '财务域', data: '发票 FP-20260518001' },
    ],
    rectifications: [
      '立即暂停该笔付款后续流程，由采购、财务联合核查付款合理性。',
      '要求采购部门补充验收记录，确认物资到货情况；若未到货立即协商退款。',
      '对未完成审批即付款的经办人 XXX 启动问责，强制 U 盾权限冻结。',
      '完善资金支付审批流程，明确"无验收、未达付款节点不得付款"为硬规则。',
      '同步反查供应商 XX 贸易有限公司历史合作流水，圈定潜在关联交易。',
    ],
  },
  { id: 'R-ZJ-002', no: 'ZJ-2026006', name: 'U盾失控预警',          level: 'red',    levelLabel: '高风险',
    warningTime: '2026-05-19 09:00', entity: 'XX财务部 / 出纳XXX',
    status: '核查中', statusCode: 'investigating', amount: '',    amountUnit: '',
    handler: '杨XX（资金部）', deadline: '2026-05-24',
    summary: '出纳 XXX 名下 6 枚 U 盾出现离线 / 异常登录，涉及资金支付权限。' },
  { id: 'R-ZJ-003', no: 'ZJ-2026012', name: '对私大额支付预警',      level: 'red',    levelLabel: '高风险',
    warningTime: '2026-05-17 16:00', entity: 'XX行政部门 / XXX 个人',
    status: '待核查', statusCode: 'pending', amount: '280',  amountUnit: '万元',
    handler: '朱XX（审计部）', deadline: '2026-05-24' },
  { id: 'R-ZJ-004', no: 'ZJ-2026018', name: '体外循环预警',          level: 'red',    levelLabel: '高风险',
    warningTime: '2026-05-16 11:30', entity: 'XX贸易公司 / XX个人账户',
    status: '整改中', statusCode: 'rectifying', amount: '850',  amountUnit: '万元',
    handler: '秦XX（风控部）', deadline: '2026-05-28' },
  { id: 'R-ZJ-005', no: 'ZJ-2026025', name: '违规担保预警',          level: 'red',    levelLabel: '高风险',
    warningTime: '2026-05-15 14:00', entity: 'XX投资公司 / XX关联企业',
    status: '核查中', statusCode: 'investigating', amount: '1,500', amountUnit: '万元',
    handler: '许XX（法务部）', deadline: '2026-05-25' },
  { id: 'R-ZJ-006', no: 'ZJ-2026032', name: '挂靠费异常支付预警',    level: 'orange', levelLabel: '中风险',
    warningTime: '2026-05-14 10:00', entity: 'XX建设公司 / XX个人承包商',
    status: '整改中', statusCode: 'rectifying', amount: '65',   amountUnit: '万元',
    handler: '曹XX（审计部）', deadline: '2026-05-27' },
  { id: 'R-ZJ-007', no: 'ZJ-2026038', name: '账户私设预警',          level: 'yellow', levelLabel: '低风险',
    warningTime: '2026-05-13 15:30', entity: 'XX能源公司 / XX银行',
    status: '已闭环', statusCode: 'closed', amount: '',     amountUnit: '',
    handler: '邓XX（资金部）', deadline: '2026-05-20' },
  { id: 'R-HT-002', no: 'HT-2026002', name: '合同价格异动预警',     level: 'orange', levelLabel: '中风险',
    warningTime: '2026-05-18 11:20', entity: 'XX能源公司 / 燃机备件供应商',
    status: '核查中', statusCode: 'investigating', amount: '58', amountUnit: '万元',
    handler: '冯XX（合同部）', deadline: '2026-05-26',
    summary: '本次单价 5,800 元/吨，历史均价 5,200、市场公允价 5,500，超阈值触发价格异动。' },
  { id: 'R-CG-001', no: 'CG-2026001', name: '未验收即付款预警',     level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-18 09:40', entity: 'XX建设公司 / 物资供应方',
    status: '待核查', statusCode: 'pending', amount: '40', amountUnit: '万元',
    handler: '孟XX（采购部）', deadline: '2026-05-24',
    summary: '合同 50 万，已付 40 万（80%），但采购未到货、无验收记录，付款与履约严重错位。' },
  { id: 'R-CW-001', no: 'CW-2026001', name: '虚假凭证预警',         level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-15 17:05', entity: 'XX科技公司 / 刘晓峰个人账户',
    status: '整改中', statusCode: 'rectifying', amount: '2.8', amountUnit: '万元',
    handler: '范XX（财务部）', deadline: '2026-05-22',
    summary: '凭证 PZ-20260515002 / 发票 FP-20260515002，报销人=收款人，无采购计划与验收记录。' },
]

const highRiskCount = computed(() => riskList.filter(r => r.level === 'red').length)

// ===== C3 AI =====
const aiSuggestions = [
  { id: 'AI-1', type: 'ZJ-2026001 大额异常', priority: 'high', priorityLabel: '高',
    content: 'XX 采购部门 500 万付款无验收、审批未完成即出账，建议立即冻结 U 盾并退款。' },
  { id: 'AI-2', type: 'U 盾预警', priority: 'high', priorityLabel: '高',
    content: '6 枚 U 盾呈离线 / 异常登录，建议立即核查保管责任人并强制重置。' },
  { id: 'AI-3', type: '境外资金预警', priority: 'medium', priorityLabel: '中',
    content: 'XX 银行（境外）U 盾离线超 72h，境外资金可视率下滑，建议联系开户行复核。' },
  { id: 'AI-4', type: '集中度建议', priority: 'low', priorityLabel: '低',
    content: '集中度 94% 超目标，可评估对二级实体下调最低留存额度。' },
]

const systemEntries = [
  { id: 'sys1', icon: '司', label: '司库系统', statusText: '在线',   statusClass: 'sys-online', color: '#2563eb', bg: '#eff6ff' },
  { id: 'sys2', icon: '财', label: '财务系统', statusText: '在线',   statusClass: 'sys-online', color: '#16a34a', bg: '#f0fdf4' },
  { id: 'sys3', icon: '网', label: '网银系统', statusText: '在线',   statusClass: 'sys-online', color: '#0891b2', bg: '#ecfeff' },
  { id: 'sys4', icon: '票', label: '票据系统', statusText: '维护中', statusClass: 'sys-maintenance', color: '#94a3b8', bg: '#f1f5f9' },
]

// ===== B2 资金主体穿透网络图（参考 Finance.vue 拓扑：fixed layout · roam · 多层 · 异常往来标签） =====
const orbitChain = ref(false)
const topoKey = ref(0)
function resetTopo() { orbitChain.value = false; topoKey.value++ }

const topoNodes = [
  // L0 集团总部
  { id: 'HQ',   name: '集团总部',         tier: 'l1', x: 0,     y: -780, rev: 4280, risk: '中' },

  // L1 资金枢纽 —— 集团财务公司（中央）
  { id: 'FC',   name: '集团财务公司',     tier: 'l1', x: 0,     y: -380, rev: 3850, risk: '中', parent: 'HQ' },

  // L2 银行通道（横排，上方）—— 资金外联
  { id: 'B-ICBC', name: '工行XX分行',     tier: 'l2', x: -1200, y: -680, rev: 1280, risk: '低', parent: 'FC' },
  { id: 'B-CCB',  name: '建行XX分行',     tier: 'l2', x: -720,  y: -780, rev: 950,  risk: '低', parent: 'FC' },
  { id: 'B-BOC',  name: '中行XX分行',     tier: 'l2', x: -240,  y: -820, rev: 680,  risk: '中', parent: 'FC' },
  { id: 'B-CMB',  name: '招商XX分行',     tier: 'l2', x: 240,   y: -820, rev: 520,  risk: '低', parent: 'FC' },
  { id: 'B-OFF',  name: 'XX境外银行',     tier: 'l2', x: 740,   y: -760, rev: 380,  risk: '高', parent: 'FC' },
  { id: 'B-FOR',  name: 'XX外资银行',     tier: 'l2', x: 1240,  y: -680, rev: 420,  risk: '高', parent: 'FC' },

  // L3 板块资金归集子户（财务公司下挂 4 个）
  { id: 'Z-N', name: '北方资金子户',     tier: 'l3', x: -680,  y: -80,  rev: 1850, risk: '高', parent: 'FC' },
  { id: 'Z-S', name: '南方资金子户',     tier: 'l3', x: -220,  y: -80,  rev: 1320, risk: '中', parent: 'FC' },
  { id: 'Z-O', name: '海外资金子户',     tier: 'l3', x: 240,   y: -80,  rev: 680,  risk: '高', parent: 'FC' },
  { id: 'Z-T', name: '科技板块子户',     tier: 'l3', x: 700,   y: -80,  rev: 420,  risk: '低', parent: 'FC' },

  // L4 业务单元资金账户（8）
  { id: 'A-CONS', name: 'XX建设公司账户', tier: 'l3', x: -1140, y: 260,  rev: 850,  risk: '高', parent: 'Z-N' },
  { id: 'A-ENER', name: 'XX能源公司账户', tier: 'l3', x: -760,  y: 260,  rev: 680,  risk: '中', parent: 'Z-N' },
  { id: 'A-LOG',  name: 'XX物流公司账户', tier: 'l3', x: -400,  y: 260,  rev: 320,  risk: '中', parent: 'Z-N' },
  { id: 'A-TRD',  name: 'XX贸易公司账户', tier: 'l3', x: -40,   y: 260,  rev: 520,  risk: '高', parent: 'Z-S' },
  { id: 'A-SUP',  name: 'XX供应链账户',   tier: 'l3', x: 320,   y: 260,  rev: 220,  risk: '中', parent: 'Z-S' },
  { id: 'A-INV',  name: 'XX投资公司账户', tier: 'l3', x: 680,   y: 260,  rev: 280,  risk: '高', parent: 'Z-T' },
  { id: 'A-TECH', name: 'XX科技公司账户', tier: 'l3', x: 1040,  y: 260,  rev: 420,  risk: '低', parent: 'Z-T' },
  { id: 'A-INTL', name: 'XX国际贸易账户', tier: 'l3', x: 1380,  y: 260,  rev: 280,  risk: '低', parent: 'Z-O' },

  // L5 末端：项目账户 / 部门 / 出纳U盾池 / 异常对手
  { id: 'P-PUR',  name: 'XX采购部门',       tier: 'l4', x: -1340, y: 580, rev: 50,  risk: '高', parent: 'A-CONS' },
  { id: 'P-N1',   name: 'XX建设一公司项目户', tier: 'l4', x: -980,  y: 580, rev: 380, risk: '高', parent: 'A-CONS' },
  { id: 'P-JET',  name: 'XX燃机项目户',     tier: 'l4', x: -620,  y: 580, rev: 320, risk: '中', parent: 'A-ENER' },
  { id: 'P-UKEY', name: '出纳U盾池',        tier: 'l4', x: -100,  y: 580, rev: 128, risk: '高', parent: 'A-TRD' },
  { id: 'P-RELY', name: '关联企业账户',     tier: 'l4', x: 600,   y: 580, rev: 180, risk: '高', parent: 'A-INV' },
  { id: 'P-OFFA', name: '离岸/疑似账户',    tier: 'l4', x: 1100,  y: 580, rev: 95,  risk: '高', parent: 'A-INTL' },

  // 体外对手方
  { id: 'X-EXT',  name: '对手 XX贸易有限公司', tier: 'l4', x: -1620, y: 820, rev: 500, risk: '高' },
  { id: 'X-PRSN', name: '个人账户(疑似)',     tier: 'l4', x: 220,   y: 820, rev: 280, risk: '高' },
]

const treeLinks = topoNodes.filter(n => n.parent).map(n => ({ source: n.parent, target: n.id }))

// 银行通道横向互联（资金调度）
const hqTopoLinks = [
  { source: 'B-ICBC', target: 'B-CCB', curveness: -0.1 },
  { source: 'B-CCB',  target: 'B-BOC', curveness: -0.1 },
  { source: 'B-BOC',  target: 'B-CMB', curveness: -0.1 },
  { source: 'B-CMB',  target: 'B-OFF', curveness: -0.1 },
  { source: 'B-OFF',  target: 'B-FOR', curveness: -0.1 },
]

// 异常资金流（彩色虚线 + 标签）
const bizLinks = [
  // 红线案例：异常大额付款
  { source: 'P-PUR',  target: 'X-EXT',  _color: '#dc2626', _dash: 'solid',  _label: 'ZJ-2026001 异常付款¥500万', curveness: -0.18 },
  // 体外循环
  { source: 'A-TRD',  target: 'X-PRSN', _color: '#9f1239', _dash: 'dashed', _label: '体外循环 ¥850万', curveness: 0.18 },
  // 违规担保
  { source: 'A-INV',  target: 'P-RELY', _color: '#b45309', _dash: 'dashed', _label: '违规担保 ¥1,500万', curveness: 0.10 },
  // 境外汇出
  { source: 'FC',     target: 'B-OFF',  _color: '#6d28d9', _dash: 'dashed', _label: '境外汇出 88%可视', curveness: -0.16 },
  { source: 'B-OFF',  target: 'P-OFFA', _color: '#6d28d9', _dash: 'dashed', _label: '离岸沉淀',           curveness: 0.18 },
  // U盾权限分发（点状）
  { source: 'P-UKEY', target: 'B-OFF',  _color: '#9ca3af', _dash: 'dotted',                              curveness: -0.30 },
  { source: 'P-UKEY', target: 'B-FOR',  _color: '#9ca3af', _dash: 'dotted',                              curveness: -0.34 },
  // 关联交易：贸易 ↔ 供应链
  { source: 'A-TRD',  target: 'A-SUP',  _color: '#0e7490', _dash: 'dashed', _label: '关联交易',          curveness: 0.22 },
  // 融资性贸易
  { source: 'A-CONS', target: 'A-TRD',  _color: '#b45309', _dash: 'dashed', _label: '融资性贸易',        curveness: 0.30 },
]

// ZJ-2026001 责任链路：对方 ← 采购部门 ← 建设一项目户 ← 建设公司账户 ← 北方子户 ← 集团财务公司 ← 集团总部
const chainIds = ['X-EXT', 'P-PUR', 'P-N1', 'A-CONS', 'Z-N', 'FC', 'HQ']
const chainColors = { 'X-EXT': '#DC2626', 'P-PUR': '#DC2626', 'P-N1': '#EF4444', 'A-CONS': '#EF4444', 'Z-N': '#F97316', 'FC': '#F97316', 'HQ': '#F97316' }
const tierLabels = { l1: '集团/枢纽', l2: '银行通道', l3: '归集/账户', l4: '项目/末端' }

function colorOf(n) {
  // 对齐 Finance.vue 调色板
  if (n.tier === 'l1') return 'rgba(249,115,22,0.78)'
  if (n.tier === 'l2') return n.risk === '高' ? 'rgba(239,68,68,0.72)'
    : n.risk === '中' ? 'rgba(245,158,11,0.72)'
    : 'rgba(59,130,246,0.72)'
  if (n.tier === 'l3') return n.risk === '高' ? 'rgba(239,68,68,0.7)'
    : n.risk === '中' ? 'rgba(245,158,11,0.7)'
    : 'rgba(16,185,129,0.7)'
  return n.risk === '高' ? 'rgba(220,38,38,0.78)'
    : n.risk === '中' ? 'rgba(252,211,77,0.7)'
    : 'rgba(147,197,253,0.7)'
}
function sizeOf(n) {
  if (n.tier === 'l1') return n.id === 'HQ' ? 60 : (n.id === 'FC' ? 58 : 48)
  if (n.tier === 'l2') return Math.max(26, Math.min(38, 18 + n.rev / 36))
  if (n.tier === 'l3') return Math.max(20, Math.min(32, 14 + n.rev / 40))
  return Math.max(14, Math.min(22, 10 + n.rev / 18))
}

function withAlpha(hex, a) {
  const h = hex.replace('#', '')
  const num = parseInt(h, 16)
  return `rgba(${num >> 16}, ${(num >> 8) & 0xff}, ${num & 0xff}, ${a})`
}

const networkOption = computed(() => {
  
  const focused = orbitChain.value
  const set = new Set(chainIds)
  const data = topoNodes.map(n => {
    const base = sizeOf(n)
    const baseColor = colorOf(n)
    const dim = focused && !set.has(n.id)
    const hit = focused && set.has(n.id)
    const fill = hit ? chainColors[n.id] : baseColor
    const isHigh = n.risk === '高'
    return {
      id: n.id, name: n.name, x: n.x, y: n.y,
      _tier: n.tier, _rev: n.rev, _risk: n.risk,
      symbol: 'circle',
      symbolSize: hit ? base * 1.45 : base,
      itemStyle: {
        color: fill,
        shadowColor: hit ? withAlpha(fill, 0.6)
          : (n.tier === 'l1' ? 'rgba(249,115,22,0.5)'
            : isHigh ? (n.tier === 'l4' ? 'rgba(220,38,38,0.5)' : 'rgba(239,68,68,0.3)')
            : 'transparent'),
        shadowBlur: hit ? 18 : (n.tier === 'l1' ? 14 : (isHigh ? (n.tier === 'l4' ? 12 : 8) : 0)),
        opacity: dim ? 0.1 : 1,
      },
      label: {
        show: !dim,
        position: n.tier === 'l1' ? 'inside'
          : (n.tier === 'l4' ? (n.y > 200 ? 'bottom' : 'top')
            : (n.x < 0 ? 'left' : 'right')),
        formatter: n.tier === 'l1' ? n.name.replace('区域总部', '区域') : n.name,
        fontSize: n.tier === 'l1' ? (n.id === 'HQ' ? 11 : 9) : (n.tier === 'l2' ? 9 : (n.tier === 'l3' ? 8 : 7)),
        color: n.tier === 'l1' ? '#FFF' : '#475569',
        fontWeight: hit ? 700 : 600,
        distance: 3, opacity: dim ? 0 : 1,
      },
    }
  })
  const allLinks = []
  treeLinks.forEach((l, i) => {
    const target = topoNodes.find(n => n.id === l.target)
    const onChain = set.has(l.source) && set.has(l.target)
    const tColor = target ? colorOf(target) : '#CBD5E1'
    allLinks.push({
      source: l.source, target: l.target,
      lineStyle: {
        color: onChain && focused ? '#EF4444' : tColor,
        width: onChain && focused ? 2.8 : (target && target.risk === '高' ? 1.6 : 1.1),
        opacity: focused ? (onChain ? 0.95 : 0.05) : (target && target.risk === '高' ? 0.8 : 0.55),
        curveness: (i % 2 === 0 ? 0.12 : -0.12),
        shadowColor: onChain && focused ? 'rgba(239,68,68,0.6)' : 'transparent',
        shadowBlur: onChain && focused ? 12 : 0,
      },
    })
  })
  hqTopoLinks.forEach(l => {
    const onChain = set.has(l.source) && set.has(l.target)
    allLinks.push({
      source: l.source, target: l.target,
      lineStyle: {
        color: onChain && focused ? '#EF4444' : '#F97316',
        width: onChain && focused ? 2.8 : 1.8,
        opacity: focused ? (onChain ? 0.95 : 0.06) : 0.7,
        curveness: l.curveness || 0,
        shadowColor: onChain && focused ? 'rgba(239,68,68,0.6)' : 'rgba(249,115,22,0.4)',
        shadowBlur: onChain && focused ? 12 : 4,
      },
    })
  })
  bizLinks.forEach(l => {
    allLinks.push({
      source: l.source, target: l.target,
      lineStyle: {
        color: l._color, width: 1.2, type: l._dash,
        opacity: focused ? 0.05 : 0.6,
        curveness: l.curveness || 0.3,
      },
      label: l._label ? {
        show: !focused,
        formatter: l._label,
        fontSize: 9, color: l._color, fontWeight: 600,
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: [2, 6], borderRadius: 999,
      } : { show: false },
    })
  })
  return {
    animation: true,backgroundColor: '#fff', animationDuration: 500, animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,23,42,.92)', borderColor: '#475569',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (p) => {
        if (p.dataType === 'edge') return ''
        const d = p.data
        return `<b>${d.name}</b><br/>层级：${tierLabels[d._tier]}<br/>资金池：${d._rev} 亿<br/>风险：${d._risk}<br/><i style="opacity:.6">拖拽 / 滚轮缩放 / 拖动平移</i>`
      },
    },
    series: [{
      type: 'graph',
      layout: 'none',
      roam: true,
      draggable: true,
      scaleLimit: { min: 0.3, max: 3 },
      edgeSymbol: ['none', 'none'],
      data, links: allLinks,
      lineStyle: { color: '#cbd5e1', width: 1, opacity: 0.45, curveness: 0.12 },
      emphasis: {
        focus: 'adjacency', scale: 1.08,
        lineStyle: { width: 2 },
        label: { fontWeight: 700, fontSize: 11, color: '#0f172a' },
      },
      blur: {
        itemStyle: { opacity: 0.18 },
        lineStyle: { opacity: 0.08 },
        label: { opacity: 0.1 },
      },
    }],
  }
})

// ===== helpers =====
function rankClass(rank) {
  if (rank <= 3) return 'top'
  if (rank <= 6) return 'mid'
  return 'low'
}

// ── 接口调用：流程实例流式运行 ──
async function callFlowInstanceStreamRun(riskId, action) {
  const url = '/api/jobs/open_plat/flow_instance/stream_run'
  
  const payload = {
    flow_id: 10005,
    flow_title: "合同穿透原",
    version: null,
    input_data: {
      "风险事项编号": riskId,
      "合同id": ""
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

// AI 分析风险
async function openRisk(id) {
  console.log('=== openRisk 开始 ===', 'riskId:', id)
  
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
      
      analyzedRiskIds.value.add(id)
      analyzedRiskIds.value = new Set(analyzedRiskIds.value)
      
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
      
      analyzedRiskIds.value.add(id)
      analyzedRiskIds.value = new Set(analyzedRiskIds.value)
      
      pushViewHistory('risk-detail')
      return
    }
  }
  
  selectedRiskId.value = id
  pushViewHistory('risk-detail')
}

// 查看报告
function viewRiskReport(id) {
  const cachedData = riskDataCache.value[id]
  if (cachedData) {
    apiRiskData.value = cachedData
  }
  
  selectedRiskId.value = id
  pushViewHistory('risk-detail')
}

// 视图历史管理
function pushViewHistory(targetMode) {
  if (viewMode.value !== targetMode) viewHistory.value.push(viewMode.value)
  viewMode.value = targetMode
}
function goBack() {
  if (viewHistory.value.length > 0) {
    viewMode.value = viewHistory.value.pop()
  } else {
    viewMode.value = 'penetration'
  }
}
const backLabel = computed(() => {
  const prev = viewHistory.value[viewHistory.value.length - 1]
  if (prev === 'risk-detail') return '← 返回风险报告'
  return '← 返回资金穿透'
})

// Toast 提示
function showToast(text, type = 'info') {
  toastText.value = text
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

// 获取当前选中的风险数据
const activeRisk = computed(() => {
  return riskList.find(r => r.id === selectedRiskId.value) || null
})

// ============ 格式化章节内容 ============
const formatSectionContent = (content) => {
  if (!content) return '<p class="empty-content">暂无内容</p>'
  
  let html = content
    .replace(/^(\d+)\.\s(.+)$/gm, '<div class="section-item"><span class="item-number">$1.</span><span class="item-content">$2</span></div>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  
  if (!html.startsWith('<') && !html.startsWith('<div') && !html.startsWith('<p')) {
    html = '<p>' + html + '</p>'
  }
  
  return html
}

// ============ 提取报告章节内容 ============
const reportSectionOne = computed(() => {
  const report = apiRiskData.value?.report || apiRiskData.value?.detailDescription || ''
  const match = report.match(/一、风险预警事项[\s\S]*?(?=二、|$)/)
  return match ? match[0].replace(/^一、风险预警事项\s*/, '').trim() : ''
})

const reportSectionTwo = computed(() => {
  const report = apiRiskData.value?.report || apiRiskData.value?.detailDescription || ''
  const match = report.match(/二、风险定义[\s\S]*?(?=三、|$)/)
  return match ? match[0].replace(/^二、风险定义\s*/, '').trim() : ''
})

const reportSectionThree = computed(() => {
  const report = apiRiskData.value?.report || apiRiskData.value?.detailDescription || ''
  const match = report.match(/三、计算逻辑[\s\S]*?(?=四、|$)/)
  return match ? match[0].replace(/^三、计算逻辑\s*/, '').trim() : ''
})

const reportSectionFour = computed(() => {
  const report = apiRiskData.value?.report || apiRiskData.value?.detailDescription || ''
  const match = report.match(/四、原因分析[\s\S]*?(?=五、|$)/)
  return match ? match[0].replace(/^四、原因分析\s*/, '').trim() : ''
})

const reportSectionSix = computed(() => {
  const report = apiRiskData.value?.report || apiRiskData.value?.detailDescription || ''
  const match = report.match(/六、整改建议[\s\S]*?(?=七、|$)/)
  return match ? match[0].replace(/^六、整改建议\s*/, '').trim() : ''
})
function ukeyLabel(s) {
  return s === 'online' ? 'Online' : s === 'offline' ? 'Offline' : 'Abnormal'
}
function penDomainColor(domain) {
  if (domain === '资金域') return 'cyan'
  if (domain === '合同域') return 'purple'
  if (domain === '采购域') return 'orange'
  if (domain === '财务域') return 'green'
  return 'cyan'
}
</script>

<style scoped>
/* =========================================================
   Funds.vue  ·  采用 Finance.vue 排版渲染语言（白底·克制·正式）
   ========================================================= */
.white-scene {
  height: 100%;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
  color: #1e293b;
}

.screen {
  height: 100%;
  display: grid;
  grid-template-rows: 168px 1fr;
  gap: 8px;
  padding: 8px 12px;
  font-family: 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  box-sizing: border-box;
}

/* ====== 基础排印 ====== */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, .05);
}
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px 14px;
}
.panel h3 { margin: 0; color: #0f172a; font-weight: 800; font-size: 14px; }
.panel p  { margin: 2px 0 0; font-size: 11px; color: #64748b; }
.panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
.row    { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.muted  { color: #94a3b8; }
.small-text { font-size: 11px; }
.sub    { margin-left: 6px; font-size: 11px; font-weight: 500; color: #94a3b8; }
.mono   { font-family: 'JetBrains Mono', Consolas, monospace; }

.glow-green  { color: #16a34a; font-weight: 700; }
.glow-cyan   { color: #2563eb; font-weight: 700; }
.glow-yellow { color: #ca8a04; font-weight: 700; }
.glow-red    { color: #dc2626; font-weight: 700; }

/* ====== Pill 标签（圆角胶囊，Finance 同款） ====== */
.pill { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; background: #eff6ff; color: #2563eb; }
.pill.cyan   { background: #eff6ff; color: #2563eb; }
.pill.blue   { background: #eff6ff; color: #2563eb; }
.pill.orange { background: #fff7ed; color: #f97316; }
.pill.red    { background: #fef2f2; color: #ef4444; }
.pill.green  { background: #f0fdf4; color: #16a34a; }
.pill.yellow { background: #fefce8; color: #ca8a04; }
.pill.pending       { background: #fef2f2; color: #ef4444; }
.pill.investigating { background: #fff7ed; color: #f97316; }
.pill.rectifying    { background: #eff6ff; color: #2563eb; }
.pill.closed        { background: #f0fdf4; color: #16a34a; }

/* ====== A 区 ====== */
.row-a { display: grid; grid-template-columns: 1.3fr 1.1fr 1fr; gap: 8px; min-height: 0; height: 100%; }
.row-a .panel { padding: 8px 12px; }
.row-a .panel-head { margin-bottom: 4px; }
.row-a .panel h3 { font-size: 13px; }
.row-a .panel p { font-size: 10px; }
.a1, .a2, .a3 { min-height: 0; }

.a1-body { display: grid; grid-template-columns: 60% 40%; gap: 8px; flex: 1; min-height: 0; }
.a1-radar { min-height: 0; }
.radar-chart { width: 100%; height: 100%; min-height: 120px; }
.a1-board {
  display: flex; flex-direction: column; gap: 3px;
  padding: 5px 8px;
  background: linear-gradient(135deg, #eff6ff, #f5f3ff);
  border: 1px solid #dbeafe;
  border-radius: 8px;
}
.board-title { font-size: 10px; font-weight: 700; color: #2563eb; text-align: center; letter-spacing: 0.04em; }
.board-main { display: flex; flex-direction: column; align-items: center; gap: 0; }
.board-num {
  font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;
  font-size: 19px; font-weight: 900; color: #1e40af; line-height: 1.05;
  text-shadow: 0 0 10px rgba(37,99,235,.18);
}
.board-num small { font-size: 13px; margin-left: 4px; color: #64748b; font-weight: 500; }
.board-label { font-size: 9px; color: #64748b; }
.board-track { display: flex; align-items: center; gap: 6px; margin-top: 4px; width: 100%; padding: 0 4px; }
.track-cap { font-size: 9px; color: #64748b; }
.track-line { flex: 1; height: 2px; background: linear-gradient(90deg, #cbd5e1, #2563eb); border-radius: 999px; position: relative; }
.track-dot { position: absolute; right: 12%; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
.board-sub { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 2px; }
.sub-cell {
  display: flex; flex-direction: column; align-items: center;
  padding: 4px 0; background: #fff; border: 1px solid #dbeafe; border-radius: 6px;
}
.sub-num { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 900; color: #059669; font-variant-numeric: tabular-nums; text-shadow: 0 0 10px rgba(5,150,105,.16); }
.sub-num small { font-size: 9px; margin-left: 1px; color: #64748b; font-weight: 500; }
.sub-cap { font-size: 8.5px; color: #64748b; margin-top: 0; font-weight: 600; }

.a2-grid { display: grid; grid-template-columns: 0.95fr 1.05fr; gap: 8px; flex: 1; min-height: 0; }
.a2-main {
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
  padding: 8px 12px; border-radius: 8px; text-align: left;
  background: linear-gradient(135deg, #f8faff, #eff6ff);
  border: 1px solid #dbeafe;
}
.a2-label { display: block; font-size: 9px; color: #64748b; font-weight: 600; }
.a2-value {
  font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;
  font-size: 22px; font-weight: 900; color: #1e40af; line-height: 1.05;
  text-shadow: 0 0 10px rgba(37,99,235,.18);
}
.a2-value small { font-size: 12px; margin-left: 4px; color: #64748b; font-weight: 500; }
.a2-meta { font-size: 10px; color: #059669; font-weight: 600; }
.a2-tiles { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 5px; }
.a2-tile {
  background: linear-gradient(135deg, #fafbfc, #fff);
  border: 1px solid #e2e8f0;
  border-left: 3px solid #cbd5e1;
  border-radius: 7px;
  padding: 5px 8px; display: flex; flex-direction: column; gap: 1px;
}
.tile-cap { font-size: 9px; color: #64748b; font-weight: 600; }
.tile-val { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 900; color: #0f172a; line-height: 1.05; }
.tile-val i { font-style: normal; font-size: 9px; font-weight: 600; color: #94a3b8; margin-left: 1px; }
.tile-sub { font-size: 9px; color: #059669; font-weight: 600; }

.trend-chart { flex: 1; min-height: 0; }

/* ====== 主体三栏 ====== */
.body { display: grid; grid-template-columns: 360px 1fr 360px; gap: 8px; min-height: 0; }
.left, .right { display: grid; gap: 8px; min-height: 0; }
.left  { grid-template-rows: 4fr 5fr; }
.right { grid-template-rows: 1.95fr 1fr; }
.center { display: grid; grid-template-rows: 1.55fr 0.8fr; gap: 8px; min-height: 0; }

/* ====== B1 风险全景 ====== */
.filter-pills { display: inline-flex; gap: 4px; }
.filter-pill { padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; cursor: pointer; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
.filter-pill.active { background: #2563eb; color: #fff; border-color: #2563eb; }

.b1-panel { position: relative; }
.b1-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 4px; }
.stat-cell {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 6px 4px; background: #fff;
  border: 1px solid #e2e8f0; border-radius: 8px;
}
.stat-cell.red    { background: linear-gradient(135deg, #fef2f2, #fff); border-color: rgba(239,68,68,0.32); }
.stat-cell.orange { background: linear-gradient(135deg, #fff7ed, #fff); border-color: rgba(249,115,22,0.32); }
.stat-cell.green  { background: linear-gradient(135deg, #f0fdf4, #fff); border-color: rgba(34,197,94,0.32); }
.stat-cell b { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 20px; font-weight: 900; line-height: 1; }
.stat-cell.red b    { color: #dc2626; }
.stat-cell.orange b { color: #f97316; }
.stat-cell.green  b { color: #16a34a; }
.stat-cell span { font-size: 10px; color: #64748b; margin-top: 2px; font-weight: 600; }
.stat-trend {
  position: absolute; top: 4px; right: 6px;
  font-style: normal; font-size: 9px; font-weight: 700;
  padding: 1px 5px; border-radius: 999px;
  background: #f1f5f9; color: #64748b;
}
.stat-trend.up   { background: #fef2f2; color: #dc2626; }
.stat-trend.down { background: #f0fdf4; color: #16a34a; }

.b1-chart-wrap { flex: 1; min-height: 0; position: relative; }
.b1-chart { width: 100%; height: 100%; min-height: 160px; cursor: pointer; }

.b1-legend { display: flex; gap: 10px; align-items: center; font-size: 10px; color: #64748b; padding: 4px 2px 0; }
.b1-legend span { display: inline-flex; align-items: center; gap: 3px; }
.b1-tip { margin-left: auto; color: #94a3b8; font-style: italic; font-size: 9px; }
.b1-cases { display: flex; gap: 4px; padding: 4px 2px 0; flex-wrap: wrap; }
.case-pill { font-size: 9.5px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.case-pill.red { background: #fef2f2; color: #dc2626; border-color: rgba(239,68,68,.32); }
.case-pill.orange { background: #fff7ed; color: #c2410c; border-color: rgba(249,115,22,.32); }
.case-pill.green { background: #f0fdf4; color: #16a34a; border-color: rgba(34,197,94,.32); }
.case-pill.blue  { background: #eff6ff; color: #2563eb; border-color: rgba(37,99,235,.32); }
.case-pill.yellow{ background: #fefce8; color: #ca8a04; border-color: rgba(202,138,4,.32); }

.b1-detail {
  position: absolute; left: 10px; right: 10px; bottom: 10px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba(37,99,235,.12);
  z-index: 4;
}
.pop-head { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #2563eb; font-weight: 700; margin-bottom: 4px; }
.pop-close { cursor: pointer; color: #64748b; font-size: 14px; line-height: 1; padding: 0 4px; }
.pop-close:hover { color: #dc2626; }
.pop-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; max-height: 96px; overflow-y: auto; }
.pop-list li { display: grid; grid-template-columns: 6px 96px 1fr; gap: 6px; align-items: center; font-size: 10px; color: #1e293b; }
.pop-no { font-family: 'JetBrains Mono', monospace; color: #2563eb; font-weight: 700; }
.pop-desc { color: #64748b; }
.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.dot.red    { background: #ef4444; }
.dot.orange { background: #f97316; }
.dot.yellow { background: #facc15; }
.dot.green  { background: #16a34a; }
.dot.blue   { background: #2563eb; }
.dot.gray   { background: #94a3b8; }

/* ====== C1 两类穿透 ====== */
.pen-stack { display: grid; grid-template-rows: 1fr 1fr; gap: 8px; flex: 1; min-height: 0; }
.pen-stack.pen-single { grid-template-rows: 1fr; height: 100%; }
.pen-card {
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8fafc, #fff);
  display: flex; flex-direction: column; gap: 5px; min-height: 0;
  overflow-y: auto;
}
.pen-card::-webkit-scrollbar { width: 4px; }
.pen-card::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.pen-head { display: flex; justify-content: space-between; align-items: baseline; }
.pen-head strong { font-size: 12px; color: #0f172a; }
.pen-head .muted { font-size: 10px; }
.pen-chain { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.chain-node {
  padding: 3px 7px;
  background: #eff6ff; color: #2563eb;
  border-radius: 6px;
  font-size: 10px; font-weight: 600;
}
.chain-node.warn { background: #fef2f2; color: #ef4444; }
.chain-node.ok   { background: #f0fdf4; color: #16a34a; }
.chain-node.clickable { cursor: pointer; user-select: none; }
.chain-node.clickable.active { background: #2563eb; color: #fff; }
.chain-arrow { width: 8px; height: 1.5px; background: #cbd5e1; position: relative; }
.chain-arrow::after { content: ''; position: absolute; right: -2px; top: -2px; width: 0; height: 0; border-left: 4px solid #94a3b8; border-top: 3px solid transparent; border-bottom: 3px solid transparent; }

.ukey-cell { display: inline-flex; align-items: center; gap: 4px; }
.inline-select {
  background: #fff; color: #b45309;
  border: 1px solid #fcd34d; border-radius: 4px;
  font-size: 9px; padding: 1px 2px; outline: none;
}
.inline-table {
  margin-top: 4px;
  background: #fff; border: 1px solid #dbeafe;
  border-radius: 6px; overflow: hidden;
}
.inline-row { display: grid; grid-template-columns: 96px 1fr 60px 56px; gap: 6px; align-items: center; padding: 4px 8px; font-size: 10px; color: #1e293b; border-top: 1px solid #f1f5f9; font-variant-numeric: tabular-nums; }
.inline-row:first-child { border-top: none; }
.inline-row.inline-head { color: #64748b; font-weight: 700; background: #f8fafc; font-size: 9px; }
.inline-row.hot { background: #fef2f2; }
.inline-row.hot .mono { color: #dc2626; }
.right { text-align: right; }
.inline-tip {
  margin-top: 4px;
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 10px; color: #1e293b;
}
.inline-tip b { color: #dc2626; }

/* ====== C1 老板穿透：executive drill ====== */
.pen-overview { font-size: 10px; color: #64748b; display: inline-flex; gap: 8px; flex-wrap: wrap; }
.pen-overview em { font-style: normal; font-weight: 700; color: #0f172a; }
.pen-overview em.warn { color: #dc2626; }

.exec-chain {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.exec-step {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-start; gap: 1px;
  padding: 5px 7px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all .15s ease;
  font-family: inherit;
  color: #0f172a;
}
.exec-step:hover { border-color: #bfdbfe; background: linear-gradient(135deg, #eff6ff, #fff); }
.exec-step.active { border-color: #2563eb; background: linear-gradient(135deg, #eff6ff, #fff); box-shadow: 0 4px 12px rgba(37,99,235,.12); }
.exec-step.warn { border-color: rgba(239,68,68,.42); background: linear-gradient(135deg, rgba(254,242,242,.7), #fff); }
.exec-step.warn.active { border-color: #dc2626; box-shadow: 0 4px 12px rgba(239,68,68,.18); }
.exec-step.ok { border-color: rgba(34,197,94,.42); background: linear-gradient(135deg, rgba(240,253,244,.7), #fff); }
.step-cap { font-size: 9px; color: #64748b; font-weight: 600; letter-spacing: 0; }
.step-val { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 11.5px; font-weight: 800; color: #0f172a; line-height: 1.05; }
.step-alert {
  position: absolute; top: 4px; right: 6px;
  font-style: normal; font-size: 9px; font-weight: 700;
  padding: 1px 5px; border-radius: 999px;
  background: #fef2f2; color: #dc2626;
}
.step-ok {
  position: absolute; top: 4px; right: 6px;
  font-style: normal; font-size: 10px; font-weight: 700;
  color: #16a34a;
}

.exec-drill {
  margin-top: 4px;
  display: flex; flex-direction: column; gap: 4px;
  padding-right: 2px;
}
.exec-drill::-webkit-scrollbar { width: 4px; }
.exec-drill::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.drill-tip {
  font-size: 10px; color: #475569;
  padding: 3px 8px;
  background: #eff6ff; border: 1px solid #dbeafe;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: space-between;
}
.drill-tip b { color: #2563eb; font-weight: 700; margin: 0 2px; }
.drill-jump { cursor: pointer; color: #64748b; font-size: 10px; }
.drill-jump:hover { color: #dc2626; }

.drill-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3px;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
}
.drill-row.red    { border-left-color: #ef4444; background: linear-gradient(135deg, rgba(254,242,242,.5), #fff); }
.drill-row.orange { border-left-color: #f97316; background: linear-gradient(135deg, rgba(255,247,237,.5), #fff); }
.drill-row.yellow { border-left-color: #facc15; }
.drill-row.green  { border-left-color: #16a34a; }

.drill-meta { display: flex; align-items: center; gap: 6px; }
.drill-no {
  font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;
  font-size: 9.5px; font-weight: 700;
  padding: 1px 6px; border-radius: 4px;
  background: #f1f5f9; color: #475569;
}
.drill-no.red    { background: #fef2f2; color: #dc2626; }
.drill-no.orange { background: #fff7ed; color: #c2410c; }
.drill-no.green  { background: #f0fdf4; color: #16a34a; }
.drill-name { font-size: 11px; color: #0f172a; font-weight: 700; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drill-amount { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 11px; font-weight: 800; color: #dc2626; }

.drill-who {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
  font-size: 10px; color: #334155;
}
.drill-who span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drill-who b { color: #94a3b8; font-weight: 600; margin-right: 4px; font-size: 9.5px; }

.drill-actions { display: flex; gap: 3px; flex-wrap: wrap; }
.act-btn {
  padding: 2px 7px;
  font-size: 9.5px; font-weight: 600;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #334155;
  cursor: pointer;
  transition: all .15s ease;
  font-family: inherit;
}
.act-btn:hover { border-color: #bfdbfe; color: #2563eb; background: #eff6ff; }
.act-btn.act-stop { color: #dc2626; border-color: rgba(239,68,68,.32); background: #fef2f2; }
.act-btn.act-stop:hover { background: #fee2e2; border-color: #dc2626; }


/* ====== B2 网络图 ====== */
.legend-mini { display: flex; gap: 8px; font-size: 10px; color: #64748b; align-items: center; flex-wrap: wrap; max-width: 280px; justify-content: flex-end; }
.legend-mini span { display: inline-flex; align-items: center; gap: 3px; }
.legend-sep { width: 1px; height: 10px; background: #e2e8f0; }
.lg-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.lg-dot.green  { background: #10B981; }
.lg-dot.yellow { background: #FBBF24; }
.lg-dot.orange { background: #F97316; }
.lg-dot.red    { background: #EF4444; }
.lg-dot.lr-hq   { background: #F97316; box-shadow: 0 0 0 2px rgba(249,115,22,.18); }
.lg-dot.lr-high { background: #EF4444; }
.lg-dot.lr-warn { background: #F59E0B; }
.lg-dot.lr-safe { background: #3B82F6; }
.lg-line { display: inline-block; width: 14px; height: 0; border-top: 1.5px solid #94a3b8; }
.lg-line.dashed { border-top-style: dashed; }
.lg-line.dotted { border-top-style: dotted; }
.net-shell {
  flex: 1; min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}
.net-chart { width: 100%; height: 100%; }

/* ====== C2 矩阵 + 银行 TOP10 ====== */
.c2-body { display: grid; grid-template-columns: 6fr 4fr; gap: 8px; flex: 1; min-height: 0; }

/* ===== C2 司库矩阵 ===== */
.matrix-wrap { display: flex; flex-direction: column; gap: 6px; min-height: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; overflow: hidden; }
.matrix-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.matrix-title { font-size: 11px; color: #0f172a; font-weight: 800; letter-spacing: 0.04em; }
.matrix-legend { display: flex; gap: 4px; flex-wrap: wrap; }
.ml-chip { font-style: normal; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 999px; border: 1px solid; }
.ml-chip.green  { color: #16a34a; background: #f0fdf4; border-color: rgba(34,197,94,.32); }
.ml-chip.yellow { color: #ca8a04; background: #fefce8; border-color: rgba(250,204,21,.42); }
.ml-chip.orange { color: #c2410c; background: #fff7ed; border-color: rgba(249,115,22,.42); }
.ml-chip.red    { color: #dc2626; background: #fef2f2; border-color: rgba(239,68,68,.42); }

.matrix-cols {
  display: grid;
  grid-template-columns: 82px 1fr 1fr 1.33fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 4px;
  padding: 0 2px;
}
.mc-cap { font-size: 9px; color: #64748b; font-weight: 600; text-align: center; padding: 2px 0; }
.matrix-grid {
  flex: 1; min-height: 0; overflow-y: auto;
  display: grid;
  grid-template-columns: 82px 1fr 1fr 1.33fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 4px;
  padding-right: 2px;
}
.matrix-grid::-webkit-scrollbar { width: 4px; }
.matrix-grid::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.mg-rowname {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10.5px; font-weight: 700; color: #0f172a;
  padding: 0 6px;
  border-radius: 4px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
}
.mg-rowname.green  { border-left-color: #22c55e; background: #f0fdf4; }
.mg-rowname.yellow { border-left-color: #facc15; background: #fefce8; }
.mg-rowname.orange { border-left-color: #f97316; background: #fff7ed; }
.mg-rowname.red    { border-left-color: #ef4444; background: #fef2f2; }
.mg-sum { font-style: normal; font-size: 9px; color: #94a3b8; font-weight: 500; }
.mg-sum b { color: #0f172a; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; margin-left: 2px; }

.mg-cell {
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0;
  background: #fff;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
  min-height: 30px;
}
.mg-cell:hover { transform: scale(1.04); box-shadow: 0 4px 10px rgba(15,23,42,.08); }
.mg-cell strong { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 800; color: #0f172a; }
.mg-cell.zero   { background: #fafbfc; border-color: #f1f5f9; }
.mg-cell.zero strong { display: none; }
.mg-cell.mild   { background: #f0fdf4; border-color: rgba(34,197,94,.32); }
.mg-cell.mild strong   { color: #16a34a; }
.mg-cell.yellow { background: #fefce8; border-color: rgba(250,204,21,.42); }
.mg-cell.yellow strong { color: #b45309; }
.mg-cell.orange { background: #fff7ed; border-color: rgba(249,115,22,.42); }
.mg-cell.orange strong { color: #c2410c; }
.mg-cell.red    { background: #fef2f2; border-color: rgba(239,68,68,.5); box-shadow: inset 0 0 0 1px rgba(239,68,68,.18); }
.mg-cell.red strong    { color: #dc2626; }

.party-table { flex: 1; display: flex; flex-direction: column; min-height: 0; gap: 2px; overflow-y: auto; }
.party-table::-webkit-scrollbar { width: 4px; }
.party-table::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.party-row {
  position: relative;
  display: grid; grid-template-columns: 22px 1.6fr 46px 40px 40px 26px 60px;
  align-items: center; gap: 6px; padding: 4px 8px;
  border: 1px solid #e2e8f0; border-radius: 6px;
  background: #fff; text-align: left; cursor: pointer;
  font-size: 11px; color: #334155; flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
}
.party-row.party-head { background: #f8fafc; font-size: 10px; font-weight: 700; color: #64748b; cursor: default; }
.party-row.party-head:hover { border-color: #e2e8f0; background: #f8fafc; }
.party-row:hover { border-color: #bfdbfe; background: linear-gradient(135deg, #eff6ff, #fff); }
.party-row.active { border-color: #bfdbfe; background: linear-gradient(135deg, #eff6ff, #fff); }
.party-rank { display: inline-flex; width: 20px; height: 20px; border-radius: 50%; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; background: #f1f5f9; color: #64748b; }
.party-rank.top { background: #fef3c7; color: #b45309; }
.party-rank.mid { background: #eff6ff; color: #2563eb; }
.party-name { font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10.5px; }
.party-num { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #2563eb; text-align: right; }
.party-num.small-num { color: #475569; font-weight: 600; font-size: 10px; }
.party-risk { display: flex; justify-content: center; }
.risk-num { display: inline-flex; min-width: 22px; height: 16px; padding: 0 4px; align-items: center; justify-content: center; border-radius: 4px; font-style: normal; font-size: 10px; font-weight: 700; background: #f0fdf4; color: #16a34a; }
.risk-num.mid  { background: #fff7ed; color: #f97316; }
.risk-num.high { background: #fef2f2; color: #ef4444; }
.risk-num.zero { background: #f1f5f9; color: #94a3b8; }
.party-ukey { display: flex; align-items: center; gap: 4px; }
.ukey-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; }
.ukey-dot.online   { background: #16a34a; box-shadow: 0 0 0 2px rgba(22,163,74,.18); }
.ukey-dot.offline  { background: #94a3b8; }
.ukey-dot.abnormal { background: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,.18); animation: blink 1.4s ease-in-out infinite; }
.party-ukey em { font-style: normal; font-size: 9px; font-weight: 700; }
.party-ukey em.online   { color: #16a34a; }
.party-ukey em.offline  { color: #64748b; }
.party-ukey em.abnormal { color: #ef4444; }
@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: .55 } }

.bank-card {
  position: absolute; top: 100%; left: 4%; right: 4%;
  margin-top: 4px; padding: 6px 10px;
  background: #fff; border: 1px solid #bfdbfe;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(37,99,235,.12);
  z-index: 5;
}
.bank-card strong { display: block; font-size: 11px; color: #2563eb; font-weight: 700; margin-bottom: 2px; }
.bank-card p { margin: 0; font-size: 10px; color: #334155; line-height: 1.55; }

/* ====== B3 实时风险 ====== */
.risk-stack { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow-y: auto; padding-right: 4px; }
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
.risk-card.active { border-color: #bfdbfe; box-shadow: 0 6px 14px rgba(37, 99, 235, .12); }

.risk-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.risk-tag {
  padding: 1px 6px; border-radius: 4px;
  font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;
  font-size: 9px; font-weight: 700; flex: 0 0 auto;
  background: #f1f5f9;
  color: #475569;
}
.risk-tag.red    { background: #fef2f2; color: #ef4444; }
.risk-tag.orange { background: #fff7ed; color: #f97316; }
.risk-tag.yellow { background: #fefce8; color: #ca8a04; }

.risk-level-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  flex: 0 0 auto;
}
.risk-level-badge.red    { background: #fef2f2; color: #ef4444; }
.risk-level-badge.orange { background: #fff7ed; color: #f97316; }
.risk-level-badge.yellow { background: #fefce8; color: #ca8a04; }

.risk-status {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  flex: 0 0 auto;
}
.risk-status.pending       { background: #fef2f2; color: #ef4444; }
.risk-status.investigating { background: #fff7ed; color: #f97316; }
.risk-status.rectifying    { background: #eff6ff; color: #2563eb; }
.risk-status.closed        { background: #f0fdf4; color: #16a34a; }

.risk-time {
  font-size: 10px;
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  flex: 0 0 auto;
}

.risk-ai-btn {
  position: relative;
  height: 26px;
  padding: 0 12px;
  border-radius: 7px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  transition: .2s;
  flex-shrink: 0;
  margin-left: auto;
}
.risk-ai-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}
.risk-ai-btn .ai-btn-icon {
  font-size: 12px;
}
.ai-btn-icon {
  font-size: 16px;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
}
.ai-btn-text {
  position: relative;
  z-index: 1;
}
.ai-btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  animation: ai-glow 2s ease-in-out infinite;
}
@keyframes ai-glow {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.risk-report-btn {
  height: 26px;
  padding: 0 12px;
  border-radius: 7px;
  background: #fff;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
}
.risk-report-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.risk-title {
  font-weight: 700;
  color: #0f172a;
  font-size: 12px;
  line-height: 1.4;
}

.risk-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 10px;
}

.risk-entity,
.risk-amount-row {
  display: flex;
  gap: 6px;
  color: #475569;
}

.risk-label {
  color: #94a3b8;
  font-weight: 500;
  flex-shrink: 0;
}

.risk-amount {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: #2563eb;
}

.risk-meta {
  display: flex;
  gap: 10px;
  color: #64748b;
  margin-top: 4px;
}

.risk-handler {
  color: #475569;
}

.risk-deadline {
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

/* ====== C3 AI 建议 + 系统入口 ====== */
.ai-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; flex: 1; min-height: 0; overflow-y: auto; }
.ai-list::-webkit-scrollbar { width: 4px; }
.ai-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.ai-item { display: flex; gap: 8px; padding: 7px 10px; background: linear-gradient(135deg, #eff6ff, #f5f3ff); border: 1px solid #dbeafe; border-radius: 8px; }
.ai-item.high   { border-left: 3px solid #ef4444; }
.ai-item.medium { border-left: 3px solid #f97316; }
.ai-item.low    { border-left: 3px solid #2563eb; }
.ai-avatar { width: 22px; height: 22px; flex: 0 0 22px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.ai-body { flex: 1; min-width: 0; }
.ai-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.ai-meta strong { font-size: 11px; color: #2563eb; font-weight: 700; }
.ai-pri { padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 700; }
.ai-pri.high   { background: #fef2f2; color: #ef4444; }
.ai-pri.medium { background: #fff7ed; color: #f97316; }
.ai-pri.low    { background: #eff6ff; color: #2563eb; }
.ai-body p { margin: 0; font-size: 10px; line-height: 1.5; color: #334155; }

.sys-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; flex: 0 0 auto; }
.sys-card { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; transition: all .18s ease; }
.sys-card.off { background: #f8fafc; }
.sys-card:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(37, 99, 235, .08); }
.sys-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
.sys-meta { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.sys-meta strong { font-size: 10px; color: #0f172a; font-weight: 700; }
.sys-meta em { font-style: normal; font-size: 9px; color: #94a3b8; }
.sys-online      { color: #16a34a !important; }
.sys-maintenance { color: #94a3b8 !important; }

/* ====== 右抽屉 ====== */
.drawer-mask {
  position: absolute; inset: 0;
  display: flex; justify-content: flex-end;
  background: rgba(15, 23, 42, .12);
  backdrop-filter: blur(3px);
  z-index: 40;
}
.holo-drawer {
  width: 38%;
  min-width: 500px; max-width: 760px;
  height: 100%;
  padding: 18px 22px;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  box-shadow: -12px 0 28px rgba(15, 23, 42, .08);
  display: flex; flex-direction: column; gap: 12px;
  overflow: hidden;
}
.drawer-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
.drawer-head h3 { margin: 4px 0 4px; font-size: 18px; color: #0f172a; font-weight: 800; }
.drawer-meta { display: flex; gap: 16px; font-size: 11px; color: #64748b; }
.drawer-meta b { color: #dc2626; font-weight: 700; }
.drawer-tags { display: flex; align-items: center; gap: 6px; }
.close { width: 26px; height: 26px; border: none; border-radius: 50%; background: #f1f5f9; color: #64748b; cursor: pointer; font-size: 16px; line-height: 1; }
.close:hover { background: #fef2f2; color: #dc2626; }

.drawer-body { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding-right: 4px; }
.drawer-body::-webkit-scrollbar { width: 4px; }
.drawer-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.acc-list { display: flex; flex-direction: column; gap: 6px; }
.acc-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer; overflow: hidden;
  transition: border-color .15s ease;
}
.acc-item:hover { border-color: #bfdbfe; }
.acc-item.open  { border-color: #bfdbfe; box-shadow: 0 6px 16px rgba(37,99,235,.08); }
.acc-head { display: grid; grid-template-columns: 24px 1fr auto 14px; align-items: center; gap: 8px; padding: 10px 14px; }
.acc-icon { font-size: 16px; }
.acc-head strong { font-size: 12px; color: #0f172a; font-weight: 700; }
.acc-tag { padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 700; }
.acc-tag.red    { background: #fef2f2; color: #ef4444; }
.acc-tag.yellow { background: #fefce8; color: #ca8a04; }
.acc-tag.cyan   { background: #eff6ff; color: #2563eb; }
.acc-caret { color: #94a3b8; font-size: 12px; transition: transform .25s ease; }
.acc-item.open .acc-caret { transform: rotate(180deg); color: #2563eb; }
.acc-body { padding: 0 14px 12px 46px; }
.acc-line { margin: 0 0 4px; font-size: 11px; line-height: 1.65; color: #334155; }
.acc-line :deep(b.mono) { font-family: 'JetBrains Mono', monospace; color: #2563eb; font-weight: 700; }
.acc-line :deep(b) { color: #0f172a; }
.acc-line :deep(.glow-red) { color: #dc2626; font-weight: 700; }
.acc-line :deep(.glow-yellow) { color: #ca8a04; font-weight: 700; }

.drawer-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
.drawer-block.ai { border-color: #dbeafe; background: linear-gradient(135deg, #eff6ff, #fff); }
.block-head { font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 6px; }
.drawer-block p { margin: 0 0 4px; font-size: 12px; line-height: 1.6; color: #334155; }
.cause-list { padding-left: 18px; margin: 0; }
.cause-list li { font-size: 11px; line-height: 1.55; color: #334155; margin-bottom: 4px; }

.penetration-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.pen-link { display: flex; align-items: center; gap: 5px; padding: 5px 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #334155; }
.pen-link em { font-style: normal; font-size: 10px; font-weight: 700; color: #2563eb; }
.pen-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; }
.pen-dot.cyan   { background: #2563eb; }
.pen-dot.purple { background: #7c3aed; }
.pen-dot.orange { background: #f97316; }
.pen-dot.green  { background: #16a34a; }

.b2-tools { display: flex; align-items: center; gap: 8px; }
.orbit-reset {
  font-size: 9.5px; font-weight: 700;
  padding: 2px 8px;
  background: #fef2f2;
  border: 1px solid rgba(239,68,68,.45);
  color: #dc2626;
  border-radius: 999px;
  cursor: pointer;
}
.orbit-reset:hover { background: #fee2e2; }
.net-shell.focused {
  background: #ffffff;
  border-color: rgba(239,68,68,.32);
  box-shadow: inset 0 0 0 2px rgba(239,68,68,.06);
}
.orbit-tip {
  position: absolute;
  top: 8px; left: 12px;
  z-index: 2;
  font-size: 10px; color: #b91c1c; font-weight: 700;
  padding: 4px 10px;
  background: rgba(255,255,255,.88);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(239,68,68,.32);
  border-radius: 999px;
}
.orbit-tip i { font-style: normal; color: #f97316; margin-right: 4px; }
.net-shell { position: relative; }


/* B2 panel 整体白底（图层、shell、emphasis 都白） */
.center > section:first-child { background: #ffffff; }
.center > section:first-child .net-shell,
.center > section:first-child .net-shell.focused { background: #ffffff !important; }
.center > section:first-child .net-chart { background: #ffffff; }


/* ===== Finance 风格宏观数据条 ===== */
.pen-macro {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
  padding: 4px 0 6px;
  border-bottom: 1px dashed #e2e8f0;
  margin-bottom: 4px;
}
.pm-cell { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 2px 0; }
.pm-cell span { font-size: 9px; color: #64748b; font-weight: 600; }
.pm-cell strong { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.1; }
.pm-cell strong em { font-style: normal; font-size: 9px; color: #94a3b8; font-weight: 500; margin-left: 1px; }


/* ===== Finance 风格资金穿透 drill list ===== */
.drill-panel { overflow: hidden !important; min-height: 0; height: 100%; display: flex !important; flex-direction: column !important; padding: 6px 10px !important; gap: 0 !important; }
.drill-panel .drill-macro { margin: 0 0 4px; flex: 0 0 auto; }
.drill-macro {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;
}
.dm-cell {
  display: flex; flex-direction: column; align-items: center;
  padding: 3px 4px; border-radius: 6px;
  background: linear-gradient(135deg, #f8fafc, #fff);
  border: 1px solid #e2e8f0;
}
.dm-cell span { font-size: 9px; color: #94a3b8; font-weight: 600; margin-bottom: 0; }
.dm-cell strong { font-size: 13px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; line-height: 1; }
.dm-cell strong em { font-size: 9px; font-style: normal; font-weight: 600; color: #94a3b8; margin-left: 1px; }

.drill-list {
  flex: 1 1 auto; min-height: 60px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 5px;
  padding-right: 4px;
  scrollbar-gutter: stable;
}
.drill-list::-webkit-scrollbar { width: 6px; }
.drill-list::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 999px; }
.drill-list::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 999px; }
.drill-list::-webkit-scrollbar-thumb:hover { background: #64748b; }

.dd-domain {
  flex: 0 0 auto;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; overflow: hidden;
  transition: border-color .15s, box-shadow .15s;
}
.dd-domain.open { box-shadow: 0 6px 16px rgba(15,23,42,.08); }
.dd-domain.red.open    { border-color: #fca5a5; }
.dd-domain.orange.open { border-color: #fdba74; }

.dd-head {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; background: none; border: none; cursor: pointer;
  text-align: left; font-family: inherit;
}
.dd-domain.red .dd-head    { border-left: 3px solid #ef4444; }
.dd-domain.orange .dd-head { border-left: 3px solid #f97316; }
.dd-ico { font-size: 16px; flex: 0 0 auto; }
.dd-meta { flex: 1; min-width: 0; }
.dd-meta strong { display: block; font-size: 12px; font-weight: 800; color: #0f172a; }
.dd-meta span {
  display: block; font-size: 9.5px; color: #64748b; margin-top: 1px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dd-metric {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px;
  flex: 0 0 auto; font-family: 'JetBrains Mono', monospace;
}
.dd-metric.red    { background: #fef2f2; color: #b91c1c; }
.dd-metric.orange { background: #fff7ed; color: #c2410c; }
.dd-badge {
  font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px;
  flex: 0 0 auto;
}
.dd-badge.red    { background: #fee2e2; color: #9f1239; }
.dd-badge.orange { background: #ffedd5; color: #c2410c; }
.dd-caret {
  font-style: normal; font-size: 11px; color: #94a3b8;
  transition: transform .2s; flex: 0 0 auto;
}
.dd-domain.open .dd-caret { transform: rotate(180deg); color: #2563eb; }

.dd-risks {
  padding: 6px 10px 8px 36px;
  background: linear-gradient(180deg, #fafbfc, #fff);
  border-top: 1px dashed #e2e8f0;
  display: flex; flex-direction: column; gap: 6px;
}
.dd-risk {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
  padding: 6px 8px;
  display: flex; flex-direction: column; gap: 4px;
}
.dd-risk.open { border-color: #93c5fd; box-shadow: 0 4px 12px rgba(37,99,235,.1); }
.dr-row { display: flex; align-items: flex-start; gap: 6px; }
.dr-bullet { width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; flex: 0 0 6px; }
.dr-bullet.red    { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,.5); }
.dr-bullet.orange { background: #f97316; box-shadow: 0 0 6px rgba(249,115,22,.5); }
.dr-text { flex: 1; min-width: 0; }
.dr-text strong { display: block; font-size: 11px; font-weight: 700; color: #0f172a; }
.dr-text p { margin: 1px 0 0; font-size: 10px; color: #64748b; line-height: 1.4; }
.dr-amt { font-size: 12px; font-weight: 800; color: #b91c1c; font-family: 'JetBrains Mono', monospace; flex: 0 0 auto; }
.dr-actions {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
  padding-top: 4px; border-top: 1px dashed #f1f5f9;
}
.dr-actions-label { font-size: 9.5px; color: #94a3b8; font-weight: 600; }
.dr-action {
  padding: 2px 7px; border-radius: 999px;
  border: 1px solid #c7d2fe; background: #eef2ff; color: #4338ca;
  font-size: 9.5px; font-weight: 700; cursor: pointer; transition: .12s;
  font-family: inherit;
}
.dr-action:hover { background: #c7d2fe; }
.dr-detail-btn {
  margin-left: auto; padding: 2px 8px; border-radius: 5px;
  border: 1px solid #e2e8f0; background: #fff; color: #475569;
  font-size: 9.5px; font-weight: 700; cursor: pointer; transition: .12s;
  font-family: inherit;
}
.dr-detail-btn:hover { border-color: #bfdbfe; color: #2563eb; background: #eff6ff; }
.dr-detail-btn.open { background: #2563eb; color: #fff; border-color: #2563eb; }

.dr-leaf {
  margin-top: 4px;
  border: 1px solid #fecaca; border-radius: 6px; overflow: hidden;
  background: linear-gradient(180deg, #fff8f8, #fff);
}
.dl-head, .dl-row {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr 0.8fr 0.8fr 1.4fr;
  gap: 6px; padding: 4px 8px; align-items: center;
  font-size: 9.5px;
}
.dl-head {
  background: linear-gradient(135deg, #fef2f2, #fff);
  color: #9f1239; font-weight: 800; font-size: 9px;
  border-bottom: 1px dashed #fecaca;
}
.dl-row { color: #334155; border-bottom: 1px dashed #f1f5f9; animation: leafIn .3s ease both; animation-delay: calc(var(--i, 0) * 0.05s + 0.05s); }
.dl-row:last-child { border-bottom: none; }
@keyframes leafIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.dl-no    { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #4338ca; }
.dl-payee { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.dl-amt   { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #b91c1c; text-align: right; }
.dl-time  { color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 9px; }
.dl-evi   { color: #c2410c; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dd-acc-enter-active { transition: all .26s cubic-bezier(.34,1.2,.64,1); overflow: hidden; }
.dd-acc-leave-active { transition: all .2s ease; overflow: hidden; }
.dd-acc-enter-from, .dd-acc-leave-to { opacity: 0; max-height: 0; }
.dd-acc-enter-to, .dd-acc-leave-from { opacity: 1; max-height: 600px; }


.drill-macro-2 {
  grid-template-columns: repeat(4, 1fr) !important;
  grid-template-rows: 1fr 1fr;
  gap: 4px !important;
}
.drill-macro-2 .dm-cell { padding: 2px 4px; border-radius: 5px; }
.drill-macro-2 .dm-cell strong { font-size: 12px; }
.drill-macro-2 .dm-cell strong em { font-size: 8px; }
.drill-macro-2 .dm-cell span { font-size: 8.5px; }

.drawer-enter-active, .drawer-leave-active { transition: all .22s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; transform: translateX(40px); }
.blind-enter-active, .blind-leave-active { transition: max-height .25s ease, opacity .2s ease; overflow: hidden; }
.blind-enter-from, .blind-leave-to { max-height: 0; opacity: 0; }
.blind-enter-to, .blind-leave-from { max-height: 400px; opacity: 1; }

/* ══════════ 风险详情报告视图样式 ══════════ */
.rd-view { flex:1; min-height:0; display:flex; flex-direction:column; gap:8px; padding:10px 16px 12px; position:relative; }
.rd-topbar { flex-shrink:0; }
.rd-content { flex:1; min-height:0; display:grid; grid-template-columns:280px minmax(0, 1fr); gap:10px; }
.rd-sidebar { display:flex; flex-direction:column; gap:8px; min-height:0; overflow-y:auto; }

/* === Hero 卡：视觉重心 === */
.rd-hero-card { padding:14px 16px; display:flex; flex-direction:column; gap:8px; position:relative; overflow:hidden; border:none; }
.rd-hero-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:5px; }
.rdh-red { background:linear-gradient(135deg, #fef2f2 0%, #ffffff 80%); border:1px solid #fecaca; }
.rdh-red::before { background:#ef4444; }
.rdh-orange { background:linear-gradient(135deg, #fff7ed 0%, #ffffff 80%); border:1px solid #fed7aa; }
.rdh-orange::before { background:#f97316; }
.rdh-yellow { background:linear-gradient(135deg, #fefce8 0%, #ffffff 80%); border:1px solid #fde68a; }
.rdh-yellow::before { background:#eab308; }

.rdh-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; align-self:flex-start; background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.05); }
.rdh-badge-icon { font-size:14px; }
.rdh-badge-text { font-size:12px; font-weight:800; }
.rdh-red .rdh-badge-text { color:#dc2626; }
.rdh-orange .rdh-badge-text { color:#c2410c; }
.rdh-yellow .rdh-badge-text { color:#a16207; }

.rdh-id { font-size:11px; font-weight:700; color:#475569; font-family:'JetBrains Mono', monospace; letter-spacing:0.04em; }
.rdh-name { margin:0; font-size:18px; font-weight:800; color:#0f172a; line-height:1.3; }
.rdh-status-bar { display:flex; align-items:center; gap:8px; padding-top:6px; border-top:1px dashed rgba(0,0,0,0.08); }
.rdh-status-pill { font-size:11px; font-weight:700; padding:2px 9px; border-radius:999px; }
.rdh-time { font-size:11px; color:#64748b; margin-left:auto; }

/* === 关键信息卡 === */
.rd-key-card { padding:10px 12px; display:flex; flex-direction:column; gap:2px; }
.rdk-title { font-size:11px; font-weight:800; color:#0f172a; padding-bottom:6px; border-bottom:1px solid #f1f5f9; margin-bottom:4px; }
.rdk-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 4px; border-radius:6px; transition:.14s; }
.rdk-row.rdk-row-stack { flex-direction:column; align-items:flex-start; gap:3px; }
.rdk-lbl { font-size:11px; color:#64748b; font-weight:600; white-space:nowrap; }
.rdk-val { font-size:12px; font-weight:700; color:#0f172a; font-family:'JetBrains Mono', monospace; }
.rdk-val-text { font-size:11px; color:#475569; font-weight:500; line-height:1.5; }
.rdk-subjects { display:flex; flex-direction:column; gap:2px; width:100%; }
.rdk-subjects strong { font-size:11px; color:#334155; font-weight:600; }

/* === 处理进度卡 === */
.rd-status-card { padding:12px; display:flex; flex-direction:column; gap:8px; }
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

/* === 操作卡 === */
.rd-actions-card { padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
.rda-title { font-size:11px; font-weight:800; color:#0f172a; padding-bottom:6px; border-bottom:1px solid #f1f5f9; }
.rda-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.rda-btn { height:30px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #e2e8f0; background:#f8fafc; color:#334155; transition:.14s; }
.rda-btn:hover { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
.rda-btn.primary { background:#2563eb; border-color:#2563eb; color:#fff; }
.rda-btn.primary:hover { background:#1d4ed8; }
.rda-btn.danger { background:#fef2f2; border-color:#fecaca; color:#ef4444; }
.rda-btn.danger:hover { background:#ef4444; color:#fff; }

/* === 主内容区域 === */
.rd-main { min-height:0; }
.rd-report { height:100%; display:grid; grid-template-rows:auto minmax(0, 1fr); }
.rdr-header { padding:14px 20px 12px; border-bottom:1px solid #e2e8f0; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.rdr-header h2 { margin:0 0 4px; font-size:16px; font-weight:800; color:#0f172a; }
.rdr-header p { margin:0; font-size:12px; color:#64748b; }
.rdr-back-btn { height:30px; padding:0 12px; border-radius:8px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; cursor:pointer; transition:.16s; }
.rdr-back-btn:hover { border-color:#93c5fd; background:#dbeafe; }
.rdr-scroll { overflow-y:auto; padding:14px 20px; }

/* === 报告内容样式 === */
.report-container { display:flex; flex-direction:column; gap:20px; }

/* 报告头部卡片 */
.report-header-card {
  background:linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  border-radius:16px;
  padding:24px;
  color:#fff;
  box-shadow:0 8px 32px rgba(30,58,138,0.3);
}
.rhc-title { font-size:20px; font-weight:800; margin-bottom:20px; text-align:center; letter-spacing:2px; }
.rhc-info-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; }
.rhc-info { display:flex; flex-direction:column; gap:4px; }
.rhc-label { font-size:11px; color:#93c5fd; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
.rhc-value { font-size:14px; font-weight:600; }
.rhc-value.mono { font-family:'JetBrains Mono', monospace; color:#fbbf24; }
.rhc-value.risk-badge { display:inline-flex; padding:4px 12px; border-radius:999px; font-size:12px; }
.rhc-value.risk-badge.red { background:#dc2626; }
.rhc-value.risk-badge.orange { background:#d97706; }
.rhc-value.risk-badge.yellow { background:#22c55e; }

/* 报告章节 */
.report-section { margin-bottom:18px; }
.section-header { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:800; color:#0f172a; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #eff6ff; }
.section-number { display:inline-flex; width:22px; height:22px; border-radius:50%; background:#2563eb; color:#fff; font-size:12px; font-weight:800; align-items:center; justify-content:center; flex-shrink:0; }
.section-title { font-size:14px; }
.section-content { padding:12px 16px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; }

/* 各章节内容样式 */
.warning-details p, .definition-box p, .calc-box p, .analysis-box p { margin:0; font-size:13px; line-height:1.8; color:#334155; }
.warning-details, .definition-box, .calc-box, .analysis-box { display:flex; flex-direction:column; gap:10px; }
.analysis-box ol, .suggestion-box ol { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:8px; }
.analysis-box li, .suggestion-box li { font-size:13px; line-height:1.75; color:#334155; }

/* 链接盒子 */
.link-box { display:flex; flex-direction:column; gap:12px; }
.link-group { display:flex; flex-direction:column; gap:6px; }
.link-group-title { font-size:12px; font-weight:700; color:#0f172a; padding-bottom:4px; }
.link-items { display:flex; flex-wrap:wrap; gap:6px; }
.link-item { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; border:1px solid #e2e8f0; background:#fff; cursor:pointer; transition:.14s; }
.link-item:hover { border-color:#93c5fd; background:#eff6ff; }
.link-icon { font-size:14px; }
.link-text { font-size:12px; color:#334155; font-weight:600; }
.link-id { font-size:11px; color:#64748b; font-family:'JetBrains Mono', monospace; }

/* 进度盒子 */
.progress-box { display:flex; flex-direction:column; gap:8px; }
.progress-item { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px dashed #e2e8f0; }
.progress-item:last-child { border-bottom:none; }
.progress-status { font-size:12px; color:#64748b; }
.progress-value { font-size:12px; font-weight:700; color:#0f172a; }

/* Toast 提示 */
.toast-overlay { position:fixed; top:20px; right:20px; z-index:1000; }
.toast { display:flex; align-items:center; gap:8px; padding:12px 16px; border-radius:10px; background:#fff; box-shadow:0 4px 20px rgba(0,0,0,0.15); border:1px solid #e2e8f0; animation:toast-in 0.3s ease; }
@keyframes toast-in { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
.toast-icon { font-size:16px; }
.toast-text { font-size:13px; color:#334155; font-weight:600; }
.toast.info { border-color:#bfdbfe; background:#eff6ff; }
.toast.info .toast-icon { color:#2563eb; }
.toast.warn { border-color:#fecaca; background:#fef2f2; }
.toast.warn .toast-icon { color:#ef4444; }

/* 风险标签样式 */
.risk-pill { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; }
.rp-red { background:#fef2f2; color:#dc2626; }
.rp-orange { background:#fff7ed; color:#c2410c; }
.rp-yellow { background:#fefce8; color:#a16207; }

/* 状态标签样式 */
.cd-status-pill { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; }
.cdsp-pending { background:#fefce8; color:#a16207; }
.cdsp-processing { background:#eff6ff; color:#1d4ed8; }
.cdsp-rectifying { background:#fff7ed; color:#c2410c; }
.cdsp-closed { background:#f0fdf4; color:#15803d; }

.rics-pending { background:#fefce8; color:#a16207; }
.rics-processing { background:#eff6ff; color:#1d4ed8; }
.rics-rectifying { background:#fff7ed; color:#c2410c; }
.rics-closed { background:#f0fdf4; color:#15803d; }

/* ============ 章节内容样式 ============ */
.section-item {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 10px;
  border-left: 4px solid #2563eb;
}

.section-item .item-number {
  font-weight: 700;
  color: #2563eb;
  font-size: 13px;
}

.section-item .item-content {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}

.empty-content {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
}

/* 各章节特殊样式 */
.warning-details .section-item {
  background: #fff5f5;
  border-left-color: #ef4444;
}
.warning-details .section-item .item-number {
  color: #ef4444;
}

.calc-box .section-item {
  background: #f0fdf4;
  border-left-color: #10b981;
}
.calc-box .section-item .item-number {
  color: #10b981;
}

.analysis-box .section-item {
  background: #fffbeb;
  border-left-color: #d97706;
}
.analysis-box .section-item .item-number {
  color: #d97706;
}

.suggestion-box .section-item {
  background: #f0fdf4;
  border-left-color: #059669;
}
.suggestion-box .section-item .item-number {
  color: #059669;
}

/* ============ 处理状态样式 ============ */
.status-box {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .status-box {
    grid-template-columns: 1fr;
  }
}

.status-box .status-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #d1fae5;
  text-align: center;
}

.status-box .status-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.status-box .status-value {
  font-size: 15px;
  font-weight: 800;
  color: #059669;
}

.status-box .status-value.deadline {
  color: #ef4444;
}

.status-box .status-value.待核查 {
  color: #a16207;
}

.status-box .status-value.核查中 {
  color: #1d4ed8;
}

.status-box .status-value.整改中 {
  color: #c2410c;
}

.status-box .status-value.已闭环 {
  color: #15803d;
}

</style>
