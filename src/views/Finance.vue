<template>
  <div class="white-scene">
    <template v-if="viewMode !== 'risk-detail'">
    <div class="screen">
      <div class="body">
        <!-- 左栏 -->
        <aside class="left">
          <!-- A1 财务七维雷达 + 五维联动校验看板 -->
          <section class="card panel a1-panel">
            <div class="panel-head">
              <h3>财务七维评分</h3>
              <span class="pill blue">综合 91.5 分</span>
            </div>
            <div class="a1-body">
              <EChart class="radar-chart" theme="light" :option="radarOption" />
              <div class="ww-board">
                <div class="ww-title">五维联动校验看板</div>
                <EChart class="ww-chart" theme="light" :option="wuweiOption" />
                <div class="ww-rate">五单匹配率 <strong>98.2<em>%</em></strong></div>
                <div class="ww-diffs">
                  <div class="ww-diff" title="业务-财务差异：12笔 共320万元">
                    <span class="ww-dd">业务-财务</span>
                    <strong class="ww-dv warn">12笔</strong>
                    <em class="ww-da">320万</em>
                  </div>
                  <div class="ww-diff" title="财务-税务差异：8笔 共180万元">
                    <span class="ww-dd">财务-税务</span>
                    <strong class="ww-dv warn">8笔</strong>
                    <em class="ww-da">180万</em>
                  </div>
                  <div class="ww-diff" title="合同-票据差异：5笔 共95万元">
                    <span class="ww-dd">合同-票据</span>
                    <strong class="ww-dv warn">5笔</strong>
                    <em class="ww-da">95万</em>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- B1 财务十大风险域 （采购页风格：KPI + 堆叠条形图）-->
          <section class="card panel fb1-panel">
            <div class="panel-head">
              <h3>财务十大风险域 </h3>
              <div class="fb1-filters">
                <button :class="['fb1-filt', { active: riskFilter === 'all' }]"    @click="riskFilter = 'all'">全部</button>
                <button :class="['fb1-filt', { active: riskFilter === 'danger' }]" @click="riskFilter = 'danger'">高</button>
                <button :class="['fb1-filt', { active: riskFilter === 'warn' }]"   @click="riskFilter = 'warn'">中</button>
                <button :class="['fb1-filt', { active: riskFilter === 'safe' }]"   @click="riskFilter = 'safe'">低</button>
              </div>
            </div>
            <div class="fb1-kpis">
              <div class="fb1-kpi-item">
                <span class="fb1-kpi-n">高风险</span>
                <span class="fb1-kpi-v" style="color:#DC2626">{{ stats.high }}</span>
              </div>
              <div class="fb1-kpi-item">
                <span class="fb1-kpi-n">中风险</span>
                <span class="fb1-kpi-v" style="color:#D97706">{{ stats.medium }}</span>
              </div>
              <div class="fb1-kpi-item">
                <span class="fb1-kpi-n">低风险</span>
                <span class="fb1-kpi-v" style="color:#2563EB">{{ stats.low }}</span>
              </div>
              <div class="fb1-kpi-item">
                <span class="fb1-kpi-n">合计</span>
                <span class="fb1-kpi-v" style="color:#0F172A">{{ stats.high + stats.medium + stats.low }}</span>
              </div>
            </div>
            <div class="fb1-chart-box">
              <EChart class="fb1-chart" theme="light" :option="riskBarOption" />
            </div>
          </section>

          <!-- C1 财务穿透（3 层钻取：概要 → 风险+措施 → 流水细节）-->
          <section class="card panel drill-panel">
            <div class="panel-head">
              <div>
                <h3>财务穿透</h3>
              
              </div>
              <span class="pill orange">异常 21</span>
            </div>
            <!-- 顶部宏观数据条 -->
            <div class="drill-macro">
              <div class="dm-cell">
                <span>资金归集</span>
                <strong>¥4,280<em>亿</em></strong>
              </div>
              <div class="dm-cell">
                <span>合规率</span>
                <strong style="color:#16a34a">96.2<em>%</em></strong>
              </div>
              <div class="dm-cell">
                <span>异常金额</span>
                <strong style="color:#dc2626">¥6.5<em>亿</em></strong>
              </div>
              <div class="dm-cell">
                <span>追回 / 锁止</span>
                <strong style="color:#2563eb">¥4.2<em>亿</em></strong>
              </div>
            </div>
            <!-- 4 域钻取列表 -->
            <div class="drill-list">
              <div v-for="d in drillDomains" :key="d.id" class="dd-domain"
                :class="[d.tone, { open: drillDomain === d.id }]">
                <button class="dd-head" @click="toggleDrillDomain(d.id)">
                  <span class="dd-ico">{{ d.icon }}</span>
                  <div class="dd-meta">
                    <strong>{{ d.name }}</strong>
                    <span>{{ d.summary }}</span>
                  </div>
                  <span class="dd-metric" :class="d.tone">{{ d.metric }}</span>
                  <span class="dd-badge" :class="d.tone">{{ d.badge }}</span>
                  <i class="dd-caret">▾</i>
                </button>
                <!-- L1 风险 + 措施 -->
                <transition name="dd-acc">
                  <div v-if="drillDomain === d.id" class="dd-risks">
                    <div v-for="r in d.risks" :key="r.id" class="dd-risk"
                      :class="{ open: drillRisk === r.id }">
                      <div class="dr-row">
                        <i class="dr-bullet" :class="d.tone"></i>
                        <div class="dr-text">
                          <strong>{{ r.title }}</strong>
                          <p>{{ r.desc }}</p>
                        </div>
                        <span class="dr-amt">¥{{ r.amount }}</span>
                      </div>
                      <div class="dr-actions">
                        <span class="dr-actions-label">建议措施 ▸</span>
                        <button v-for="(a, i) in r.actions" :key="i" class="dr-action">
                          {{ a }}
                        </button>
                        <button class="dr-detail-btn" :class="{ open: drillRisk === r.id }"
                          @click="toggleDrillRisk(r.id)">
                          {{ drillRisk === r.id ? '收起明细' : '查看明细' }} ▾
                        </button>
                      </div>
                      <!-- L2 银行支付级细节 -->
                      <transition name="dd-acc">
                        <div v-if="drillRisk === r.id" class="dr-leaf">
                          <div class="dl-head">
                            <span>流水号</span><span>收款方</span><span>金额</span><span>时间</span><span>证据</span>
                          </div>
                          <div v-for="(t, ti) in r.transactions" :key="t.no" class="dl-row"
                            :style="{ '--i': ti }">
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
          </section>
        </aside>

        <!-- 中栏 -->
        <main class="center">
          <!-- A2 财务核心利润驾驶舱 -->
          <section class="card panel a2-panel">
            <div class="panel-head">
              <h3>财务核心指标</h3>
              <span class="pill green">达标</span>
            </div>
            <div class="a2-hero">
              <div class="hero-big">
                <span class="hero-label">利润总额</span>
                <span class="hero-val glow-blue">¥1,280<em>亿</em></span>
              </div>
              <div class="hero-big">
                <span class="hero-label">预算完成率</span>
                <span class="hero-val glow-green">102<em>%</em></span>
              </div>
            </div>
            <div class="a2-grid">
              <div class="a2-cell">
                <span class="a2-cl">资产负债率</span>
                <strong class="a2-cv" style="color:#0891b2">68<em>%</em></strong>
              </div>
              <div class="a2-cell">
                <span class="a2-cl">净资产收益率(ROE)</span>
                <strong class="a2-cv" style="color:#7c3aed">11.5<em>%</em></strong>
              </div>
              <div class="a2-cell">
                <span class="a2-cl">营业现金比率</span>
                <strong class="a2-cv" style="color:#f97316">14.2<em>%</em></strong>
              </div>
              <div class="a2-cell">
                <span class="a2-cl">研发投入强度</span>
                <strong class="a2-cv" style="color:#2563eb">4.8<em>%</em></strong>
              </div>
            </div>
          </section>

          <!-- B2 财务主体多总部拓扑图（可拖拽/缩放/平移）-->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>财务主体多总部拓扑</h3>
              </div>
              <div class="legend-mini">
                <span><i class="lg-dot lr-hq"></i>总部</span>
                <span><i class="lg-dot lr-safe"></i>低</span>
                <span><i class="lg-dot lr-warn"></i>中</span>
                <span><i class="lg-dot lr-high"></i>高</span>
                <button class="orbit-reset" @click="resetTopo">⟳ 复位</button>
                <button class="orbit-reset" v-if="orbitChain" @click="orbitChain = false">解除高亮</button>
              </div>
            </div>
            <div class="orbit-shell" :class="{ focused: orbitChain }">
              <EChart :key="topoKey" ref="topoChart" class="net-chart" theme="light" :option="networkOption" />
              <div v-if="orbitChain" class="orbit-tip">
                <strong>CW-2026001 问责链路</strong>
                XX行政部门 ➜ XX建设一公司 ➜ XX建设公司 ➜ 北方区域总部 ➜ 集团总部
              </div>
            </div>
          </section>

          <!-- C2 财务矩阵 + 资金往来 TOP10（采购页风格：热力图 4 + 排行 2）-->
          <section class="card panel fc2-panel">
            <div class="panel-head">
              <h3>财务业务域 × 收支类型分布</h3>
              <div style="display:flex;align-items:center;gap:5px">
                <span class="pill blue">风险色阶</span>
                <span class="pill yellow">⚡挂靠/划转 待关注 2</span>
              </div>
            </div>
            <div class="fc2-body">
              <EChart class="fc2-heatmap" theme="light" :option="financeHeatOption" />
              <div class="fc2-side">
                <div class="fc2-side-title">资金往来单位 TOP10</div>
                <div class="fc2-side-rows">
                  <div v-for="p in partyRanking" :key="p.rank"
                    class="fc2-row" :class="{ 'fc2-alert': p.health < 60, open: partyOpenId === p.rank }">
                    <button class="fc2-row-btn" @click="togglePartyCard(p)">
                      <span class="fc2-rank" :class="rankClass(p.rank)">{{ p.rank }}</span>
                      <div class="fc2-info">
                        <div class="fc2-name">
                          {{ p.name }}
                          <i v-if="p.health < 60" class="fc2-dot">●</i>
                        </div>
                        <div class="fc2-meta">
                          收<b>{{ p.receive }}</b>亿 · 付<b>{{ p.pay }}</b>亿
                        </div>
                      </div>
                      <div class="fc2-right">
                        <span class="fc2-risk" :class="p.risk >= 5 ? 'h' : p.risk > 0 ? 'm' : 'n'">
                          {{ p.risk > 0 ? p.risk + '险' : '—' }}
                        </span>
                        <span class="fc2-health" :style="{ color: healthColor(p.health) }">{{ p.health }}</span>
                      </div>
                    </button>
                    <transition name="card-pop">
                      <div v-if="partyOpenId === p.rank && p.card" class="party-card">
                        <div class="pc-head">
                          <strong>{{ p.name }}</strong>
                          <span class="pill red">严重风险</span>
                        </div>
                        <div class="pc-grid">
                          <div v-for="kv in p.card" :key="kv.k" class="pc-kv">
                            <span>{{ kv.k }}</span>
                            <strong :class="kv.tone">{{ kv.v }}</strong>
                          </div>
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <!-- 右栏 -->
        <aside class="right">
          <!-- A3 战略三轴全时态趋势图 -->
          <section class="card panel a3-panel">
            <div class="panel-head">
              <div>
                <h3>趋势数据</h3>
                <p>营收 · 利润 · 现金流（近 12 月 · 三轴联动）</p>
              </div>
              <span class="pill blue">三轴</span>
            </div>
            <EChart class="trend-chart" theme="light" :option="trendOption" />
          </section>

          <!-- B3 实时财务风险列表 -->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>实时财务风险</h3>
                
              </div>
              <span class="pill red">高 {{ highRiskCount }} 条</span>
            </div>
            <div class="risk-stack">
              <div
                v-for="r in riskList"
                :key="r.id"
                class="risk-card"
                :class="[r.level, { active: selectedRiskId === r.no, pinned: r.no === 'CW-2026001' }]"
              >
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
                  <div v-if="r.no === 'CW-2026001'" class="risk-meta-extra">
                    <i>关联凭证 <b>PZ-20260515002</b></i>
                    <i>时间 2026-05-15 16:20</i>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- C3 AI建议 + 系统入口 -->
          <section class="card panel">
            <div class="panel-head">
              <div>
                <h3>AI 建议 · 系统入口</h3>
              </div>
              <span class="pill blue">智能监管</span>
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
              <button v-for="s in systemEntries" :key="s.id" class="sys-card">
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
            <span class="risk-pill" :class="`rp-${rdLevelKey(activeRisk.level)}`">{{ activeRisk.level || riskLevelLabel[activeRisk.level] || '获取失败' }}</span>
            <button type="button" class="cd-contract-link" @click="showToast('打开会计凭证详情', 'info')" :title="'查看会计凭证 ' + voucherRef(activeRisk)">📊 查看会计凭证：{{ voucherRef(activeRisk) }}</button>
          </div>
          <div class="cd-topbar-right">
            <span class="cd-status-pill" style="background:#fff7ed;border-color:#fed7aa;color:#c2410c">{{ activeRisk.status }}</span>
            <span>生成时间：{{ activeRisk.warningTime }}</span>
          </div>
        </div>
        <div class="rd-content">
          <aside class="rd-sidebar">
            <!-- Hero 卡片：视觉重心 -->
            <div class="card rd-hero-card" :class="`rdh-${rdLevelKey(activeRisk.level)}`">
              <div class="rdh-badge">
                <span class="rdh-badge-icon">{{ riskIconMap[activeRisk.level] }}</span>
                <span class="rdh-badge-text">{{ activeRisk.level || riskLevelLabel[activeRisk.level] || '获取失败' }}</span>
              </div>
              <div class="rdh-id">{{ activeRisk.no }}</div>
              <h2 class="rdh-name">{{ activeRisk.name }}</h2>
              <div class="rdh-status-bar">
                <span class="rdh-status-pill" :class="`rics-${stepKeyOfRisk(activeRisk)}`">{{ activeRisk.status }}</span>
                <span class="rdh-time">⏱ {{ activeRisk.warningTime }}</span>
              </div>
            </div>

            <!-- 关键信息卡 -->
            <div class="card rd-key-card">
              <div class="rdk-title">关键信息</div>
              <div class="rdk-row" @click="showToast('打开会计凭证 ' + voucherRef(activeRisk), 'info')">
                <span class="rdk-lbl">📊 会计凭证</span>
                <strong class="rdk-val link">{{ voucherRef(activeRisk) }} ›</strong>
              </div>
              <div class="rdk-row" @click="showToast('打开关联发票 ' + invoiceRef(activeRisk), 'info')">
                <span class="rdk-lbl">🧾 关联发票</span>
                <strong class="rdk-val link">{{ invoiceRef(activeRisk) }} ›</strong>
              </div>
              <div class="rdk-row rdk-row-stack">
                <span class="rdk-lbl">👥 涉及主体</span>
                <div class="rdk-subjects">
                  <strong>{{ activeRisk.entity }}</strong>
                </div>
              </div>
              <div class="rdk-row rdk-row-stack">
                <span class="rdk-lbl">🛰 预警来源</span>
                <strong class="rdk-val-text">AI智能体 · 财务全量数据穿透</strong>
              </div>
            </div>

            <!-- 处理进度卡 -->
            <div class="card rd-status-card">
              <div class="rds-title">处理进度</div>
              <div class="status-flow">
                <div v-for="(step, si) in progressSteps" :key="step.code" class="sf-step" :class="{ done: si < progressIndex(activeRisk), current: si === progressIndex(activeRisk) }">
                  <div class="sf-dot"></div>
                  <span>{{ step.label }}</span>
                  <div v-if="si < progressSteps.length - 1" class="sf-line"></div>
                </div>
              </div>
              <div class="rds-meta">
                <div><span>责任人</span><strong>{{ extractNames(activeRisk.parsedReport?.sections?.progress_tracking?.responsible_person || activeRisk.handler) }}</strong></div>
                <div><span>整改期限</span><strong class="deadline">{{ activeRisk.parsedReport?.sections?.progress_tracking?.deadline || activeRisk.deadline }}</strong></div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="card rd-actions-card">
              <div class="rda-title">核查操作</div>
              <div class="rda-grid">
                <button type="button" class="rda-btn primary" @click="showToast('核查工单已派发至财务部门', 'info')">派发核查工单</button>
                <button type="button" class="rda-btn danger" @click="showToast('财务风险已升级至集团预警', 'warn')">升级集团预警</button>
                <button type="button" class="rda-btn" @click="showToast('已上传补充佐证材料，待审核', 'info')">补充佐证材料</button>
                <button type="button" class="rda-btn" @click="showToast('已提交解除财务预警申请', 'info')">解除财务预警</button>
              </div>
            </div>
          </aside>
          <div class="rd-main">
            <div class="card rd-report">
              <div class="rdr-header">
                <div class="rdr-header-left">
                  <h2>风险事项详情报告</h2>
                  <p>财务管理域 · {{ activeRisk.name }} · AI智能体自动生成报告</p>
                  <p><a href="http://192.168.16.206:8098/process_detail?flow_id=10011&title=%E8%B4%A2%E5%8A%A1%E7%A9%BF%E9%80%8F" target="_blank">点击查看运行日志</a></p>
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
                        <span class="rhc-value mono">{{ activeRisk.no || '获取失败' }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">风险名称</span>
                        <span class="rhc-value">{{ activeRisk.name || '获取失败' }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">风险等级</span>
                        <span class="rhc-value risk-badge" :class="rdBadgeKey(activeRisk.level)">{{ activeRisk.level || riskLevelLabel[activeRisk.level] || '获取失败' }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">预警时间</span>
                        <span class="rhc-value">{{ activeRisk.warningTime || activeRisk.alertTime || '获取失败' }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">预警来源</span>
                        <span class="rhc-value">{{ activeRisk.source || '获取失败' }}</span>
                      </div>
                      <div class="rhc-info">
                        <span class="rhc-label">涉及主体</span>
                        <span class="rhc-value">{{ activeRisk.entity || '获取失败' }}</span>
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
                        <div v-html="formatSectionContent(activeRisk.parsedReport?.sections?.risk_warning?.content || activeRisk.detailDescription || '获取失败')"></div>
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
                        <div v-html="formatSectionContent(activeRisk.parsedReport?.sections?.risk_definition?.content || '获取失败')"></div>
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
                        <template v-if="activeRisk.parsedReport?.sections?.calculation_logic?.items?.length">
                          <div v-for="(item, idx) in activeRisk.parsedReport.sections.calculation_logic.items" :key="idx" class="section-item">
                            <div class="item-label">{{ item.label }}</div>
                            <div class="item-content" v-html="formatSectionContent(item.content)"></div>
                          </div>
                        </template>
                        <div v-else v-html="formatSectionContent('获取失败')"></div>
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
                        <template v-if="activeRisk.parsedReport?.sections?.cause_analysis?.items?.length">
                          <div v-for="(item, idx) in activeRisk.parsedReport.sections.cause_analysis.items" :key="idx" class="section-item">
                            <div class="item-label">{{ idx + 1 }}. {{ item.domain }}</div>
                            <div class="item-content">{{ item.detail || item.content || item.analysis }}</div>
                          </div>
                        </template>
                        <template v-else>
                          <div style="color:#999;text-align:center;padding:20px">暂无原因分析数据</div>
                        </template>
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
                        <template v-if="activeRisk.parsedReport?.sections?.data_links?.groups?.length">
                          <div v-for="(group, gIdx) in activeRisk.parsedReport.sections.data_links.groups" :key="gIdx" class="link-group">
                            <div class="link-group-title">{{ group.domain }}</div>
                            <div class="link-items">
                              <button v-for="(link, lIdx) in group.links" :key="lIdx" class="link-item" @click="showToast('查看 ' + link.label, 'info')">
                                <span class="link-icon">🔗</span>
                                <span class="link-text">{{ link.label }}</span>
                                <span class="link-id">{{ link.biz_id }}</span>
                              </button>
                            </div>
                          </div>
                        </template>
                        <div v-else class="empty-content">暂无数据</div>
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
                        <template v-if="activeRisk.parsedReport?.sections?.rectification_suggestions?.items?.length">
                          <div v-for="(item, idx) in activeRisk.parsedReport.sections.rectification_suggestions.items" :key="idx" class="section-item">
                            <!-- <span class="item-number">{{ idx + 1 }}.</span> -->
                            <span class="item-content">{{ item }}</span>
                          </div>
                        </template>
                        <div v-else v-html="formatSectionContent('获取失败')"></div>
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
                          <span class="status-value">{{ activeRisk.parsedReport?.sections?.progress_tracking?.current_status || activeRisk.status || '获取失败' }}</span>
                        </div>
                        <div class="status-item">
                          <span class="status-label">责任人</span>
                          <span class="status-value">{{ extractNames(activeRisk.parsedReport?.sections?.progress_tracking?.responsible_person || activeRisk.responsible) }}</span>
                        </div>
                        <div class="status-item">
                          <span class="status-label">整改期限</span>
                          <span class="status-value deadline">{{ activeRisk.parsedReport?.sections?.progress_tracking?.deadline || activeRisk.deadline || '获取失败' }}</span>
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

  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import axios from 'axios'
import EChart from '../components/EChart.vue'

const emit = defineEmits(['navigate'])
function goToDashboard(){ emit('navigate', 'dashboard'); if (typeof window !== 'undefined') window.location.hash = '#/dashboard' }

const selectedAreaId = ref('CW-R01')
const filterLevel = ref('all')

// ── AI 风险识别检测报告 ────────────────────────────────────────────────────
const analyzedReportIds = ref(new Set())
const riskDataCache = ref({})
const apiRiskData = ref(null)
const selectedRiskId = ref('')

// ── 风险事项详情视图 ────────────────────────────────────────────────────
const viewMode      = ref('penetration')
const viewHistory   = ref([])

// ── Toast 提示 ──────────────────────────────────────────────────────────
const toastVisible  = ref(false)
const toastText     = ref('')
let toastTimer = null
function showToast(text){
  toastText.value = text
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(()=>{ toastVisible.value = false }, 2400)
}
// 提取责任人姓名（去掉部门前缀）
function extractNames(fullStr) {
  if (!fullStr) return fullStr || ''
  const parts = fullStr.split('，')
  return parts.length > 1 ? parts[1] : fullStr
}

function formatTime(s){ if(!s) return ''; const m=s.match(/(\d{2}:\d{2})/); return m ? m[1] : s.slice(-5) }

const riskLevelLabel = { 'red': '高风险', 'orange': '中风险', 'yellow': '低风险', 'green': '低风险', '高风险': '高风险', '中风险': '中风险', '低风险': '低风险', '重大风险': '高风险' }
const riskIconMap    = { 'red': '🚨', 'orange': '⚠', 'yellow': 'ℹ', 'green': 'ℹ', '高风险': '🚨', '中风险': '⚠', '低风险': 'ℹ', '重大风险': '🚨' }

// 风险等级映射（API字符串 → 内部key）
function getRiskLevelKey(apiLevel) {
  const map = { '高风险': 'red', '中风险': 'orange', '低风险': 'yellow', '重大风险': 'red', '正常': 'yellow' }
  return map[apiLevel] || 'orange'
}

function rdLevelKey(level){
  if (level === 'red' || level === '高风险' || level === '重大风险') return 'high'
  if (level === 'orange' || level === '中风险') return 'medium'
  if (level === 'yellow' || level === '低风险') return 'watch'
  if (level === 'green') return 'low'
  return 'normal'
}
function rdBadgeKey(level){
  if (level === 'red' || level === '高风险' || level === '重大风险') return 'high'
  if (level === 'orange' || level === '中风险') return 'medium'
  return 'low'
}
function stepKeyOfRisk(r){ return r?.statusCode || 'pending' }

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
  return '← 返回财务穿透'
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

function refTail(r){ return r?.no ? r.no.replace(/[^0-9]/g, '') : 'XXXXXXX' }
function voucherRef(r){ return r?.voucherRef || ('PZ-' + refTail(r)) }
function invoiceRef(r){ return r?.invoiceRef || ('FP-' + refTail(r)) }

const definitionMap = {
  'R-CW-001': '会计凭证所附资料虚假、无效，或凭证内容与实际业务不符，违反《会计法》第九条对会计凭证真实、完整、合法的基本要求。',
  'R-CW-002': '以贸易为名实施融资或自循环交易，缺乏真实货物流与服务流支撑，违反企业会计准则收入确认"五步法"原则。',
  'R-CW-003': '资金通过表外或个人账户体外循环，脱离财务监管体系，违反《企业内部控制基本规范》中资金活动控制要求。',
  'R-CW-004': '应收账款与存货长期高位运行，占用经营性现金流，违反两金压控目标与企业内控规范应用指引。',
  'R-CW-005': '对外担保未经董事会"三重一大"决策授权或超出授权额度，违反《企业财务通则》与《担保管理办法》相关条款。',
  'R-CW-006': '关联方交易通过中间方"非关联化"安排进行价格转移或利益输送，违反《企业会计准则第36号 - 关联方披露》。',
  'R-CW-007': '预算执行突破单项科目或总额上限，缺乏调整审批，违反预算法及集团预算管理办法相关规定。',
}

const defaultFinanceRectifications = [
  '立即冻结该笔业务后续会计处理与对外资金支付，列入重点跟踪台账。',
  '由财务部牵头核查，限期 5 个工作日内出具书面说明与完整佐证材料。',
  '对相关记账人、复核人、审批人开展问责，必要时移交内审或纪检部门。',
  '在财务共享与内控系统中增加同类业务的强制前置校验规则，避免再发。',
]

function financeTableRows(r){
  if (r?.detail?.tableRows?.length) return r.detail.tableRows
  return [
    { 类别:'会计凭证', 对象:r.entity, 编号:voucherRef(r), 关键数据:`金额 ¥${r.amount || '—'}${r.amountUnit || ''}`, 风险说明:'凭证附件 / 业务真实性核验异常' },
    { 类别:'关联发票', 对象:r.entity, 编号:invoiceRef(r), 关键数据:'发票校验状态：异常', 风险说明:'税务系统校验未通过或与凭证不符' },
    { 类别:'银行流水', 对象:r.entity, 编号:'LS-' + refTail(r), 关键数据:'资金流向异常', 风险说明:'与合同约定收付款方不一致' },
    { 类别:'关联合同', 对象:r.entity, 编号:'HT-' + refTail(r), 关键数据:'合同真实性存疑', 风险说明:'缺乏审批 / 不在供应商名录' },
  ]
}

// ── 获取当前选中的风险数据 ────────────────────────────────────────────────
const activeRisk = computed(() => {
  if (!selectedRiskId.value) return null
  
  // 先从本地风险列表中获取基本信息（支持通过 id 或 no 匹配）
  const localRisk = riskList.find(r => r.id === selectedRiskId.value || r.no === selectedRiskId.value)
  
  // 先从缓存中获取对应风险项的数据
  const cachedData = riskDataCache.value[selectedRiskId.value]
  // 如果缓存中有数据就用缓存，否则用全局的 apiRiskData
  const apiData = cachedData || apiRiskData.value
  console.log('=== activeRisk apiData ===', 'selectedRiskId:', selectedRiskId.value, 'cachedData?', !!cachedData, 'apiRiskData?', !!apiRiskData.value, 'risk_level:', apiData?.risk_level)
  
  if (apiData) {
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
    
    // 凭证编号
    const baseSeq = (localRisk?.no || selectedRiskId.value).replace('CW-','').replace('R-CW-','')
    
    return {
      // 基础信息 - 使用显示的编号（如 CW-2026001）作为 id 和 no
      id: selectedRiskId.value,
      no: apiData.risk_code || apiData.risk_id || apiData.no || selectedRiskId.value,
      name: apiData.risk_name || apiData.name || localRisk?.name || '未知风险事项',
      level: (() => {
        console.log('=== level ===', 'apiData.risk_level:', apiData?.risk_level, 'localRisk?.level:', localRisk?.level)
        return apiData.risk_level || localRisk?.level || ''
      })(),
      warningTime: apiData.warning_time || apiData.alertTime || localRisk?.warningTime || '',
      alertTime: apiData.warning_time || apiData.alertTime || localRisk?.warningTime || new Date().toLocaleString(),
      entity: apiData.subjects?.join(' / ') || apiData.entity || apiData.involved_subject || localRisk?.entity || '暂无',
      source: apiData.data_source || 'AI智能体 · 财务全量数据穿透',
      
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
      
      // 报告内容 - 直接使用API返回的数据对象
      riskItem: apiData, // 保存完整数据，供其他地方使用
      summary: apiData.summary || '',
      detailDescription: apiData.report || apiData.detailDescription || apiData.sections?.risk_warning?.content || '',

      // 解析报告JSON - 处理对象或字符串
      parsedReport: (() => {
        // 如果apiData本身就有sections结构，直接使用
        if (apiData.sections) {
          console.log('=== Finance parsedReport: apiData has sections directly ===')
          return apiData
        }
        // 否则尝试解析report或detailDescription字段
        const raw = apiData.report || apiData.detailDescription || '{}'
        console.log('=== Finance parsedReport raw ===', raw.substring(0, 300))
        try {
          const parsed = JSON.parse(raw)
          console.log('=== Finance parsedReport parsed ===', parsed)
          return parsed
        } catch (e) {
          console.error('报告解析失败', e)
          return {}
        }
      })(),
      
      // 关联数据
      tableRows: apiData.table_rows || apiData['整理报告_1.table_rows'] || [
        { 类别:'会计凭证', 对象:apiData?.involved_subject || localRisk?.entity || '—', 编号:'PZ-'+baseSeq, 关键数据: apiData?.amount ? '¥'+apiData.amount+(apiData.amountUnit||'万') : localRisk?.amount ? '¥'+localRisk.amount+(localRisk.amountUnit||'') : '—', 风险说明:'待API返回' },
        { 类别:'关联发票', 对象:apiData?.involved_subject || localRisk?.entity || '—', 编号:'FP-'+baseSeq, 关键数据:'发票校验状态：待API返回', 风险说明:'待API返回' },
        { 类别:'银行流水', 对象:apiData?.involved_subject || localRisk?.entity || '—', 编号:'LS-'+baseSeq, 关键数据:'资金流向待核实', 风险说明:'待API返回' },
        { 类别:'关联合同', 对象:apiData?.involved_subject || localRisk?.entity || '—', 编号:'HT-'+baseSeq, 关键数据:'合同真实性待核验', 风险说明:'待API返回' },
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
      source: 'AI智能体 · 财务全量数据穿透',
      statusFlow: ['待核查','核查中','整改中','已闭环'],
      currentStatusIdx: Math.max(0, progressSteps.findIndex(s => s.code === localRisk.statusCode))
    }
  }
  
  return null
})

// ── AI 分析风险 ────────────────────────────────────────────────────────────
async function openReport(r) {
  const id = r.no || r.id // 使用 CW-2026001 格式的编号
  
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
      console.log('=== openReport reportJson ===', 'risk_key:', riskKey, 'risk_level:', reportJson.risk_level)
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

// ── 查看报告（直接使用缓存）─────────────────────────────────────────────────
function viewReport(id) {
  const cachedData = riskDataCache.value[id]
  console.log('=== viewReport ===', 'id:', id, 'cachedData:', cachedData ? 'exists' : 'null')
  if (cachedData) {
    apiRiskData.value = cachedData
  }

  selectedRiskId.value = id
  pushViewHistory('risk-detail')
}

// ── 接口调用：流程实例流式运行 ──────────────────────────────────────────────
async function callFlowInstanceStreamRun(riskId, action) {
  const url = '/api/jobs/open_plat/flow_instance/stream_run'
  
  const payload = {
    flow_id: 10011,  // 财务穿透的 flow_id
    flow_title: "财务穿透",
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
const matrixCell = ref(null)
const riskFilter = ref('all')
const orbitChain = ref(false)


// A1 七维雷达
const radarOption = computed(() => ({
  animation: false,
  radar: {
    indicator: [
      { name: '盈利', max: 100 }, { name: '资产', max: 100 }, { name: '现金', max: 100 },
      { name: '税务', max: 100 }, { name: '预算', max: 100 }, { name: '产权', max: 100 },
      { name: '融资', max: 100 },
    ],
    center: ['50%', '55%'], radius: '65%', shape: 'polygon', nameGap: 6,
    axisName: { color: '#475569', fontSize: 10, fontWeight: 600 },
    splitNumber: 4,
    axisLine: { lineStyle: { color: 'rgba(37,99,235,0.18)' } },
    splitLine: { lineStyle: { color: 'rgba(37,99,235,0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(37,99,235,0.03)', 'rgba(37,99,235,0.07)'] } },
  },
  series: [{
    type: 'radar', symbol: 'circle', symbolSize: 5,
    data: [{
      value: [92, 88, 85, 96, 102, 90, 78], name: '财务评分',
      areaStyle: { color: 'rgba(37,99,235,0.12)' },
      lineStyle: { color: '#2563eb', width: 2 },
      itemStyle: { color: '#2563eb' },
    }],
  }],
}))

// A1 五维联动校验五边形
const wuweiOption = computed(() => ({
  animation: false,
  radar: {
    indicator: [
      { name: '业务', max: 100 }, { name: '财务', max: 100 }, { name: '税务', max: 100 },
      { name: '合同', max: 100 }, { name: '票据', max: 100 },
    ],
    center: ['50%', '52%'], radius: '58%', shape: 'polygon', nameGap: 5,
    axisName: { color: '#6d28d9', fontSize: 9, fontWeight: 700 },
    splitNumber: 3,
    axisLine: { lineStyle: { color: 'rgba(124,58,237,0.2)' } },
    splitLine: { lineStyle: { color: 'rgba(124,58,237,0.14)' } },
    splitArea: { areaStyle: { color: ['rgba(124,58,237,0.03)', 'rgba(124,58,237,0.08)'] } },
  },
  series: [{
    type: 'radar', symbol: 'circle', symbolSize: 4,
    data: [{
      value: [99, 97, 98, 96, 99], name: '五维匹配',
      areaStyle: { color: 'rgba(124,58,237,0.14)' },
      lineStyle: { color: '#7c3aed', width: 2 },
      itemStyle: { color: '#7c3aed' },
    }],
  }],
}))

const filters = [
  { key: 'all', label: '全部' },
  { key: '高', label: '高' },
  { key: '中', label: '中' },
  { key: '低', label: '低' },
]

const riskAreas = [
  { id: 'CW-R01', label: '虚假贸易',           desc: '虚构交易背景资金流转',     level: 'red',    rawLevel: '高', count: 6,  trend: '+1' },
  { id: 'CW-R02', label: '融资性贸易',         desc: '以贸易为名进行融资',       level: 'red',    rawLevel: '高', count: 8,  trend: '+2' },
  { id: 'CW-R03', label: '资金体外循环',       desc: '资金脱离监管体系流转',     level: 'red',    rawLevel: '高', count: 5,  trend: '0'  },
  { id: 'CW-R04', label: '两金高企',           desc: '应收账款和存货占用过高',   level: 'orange', rawLevel: '中', count: 15, trend: '+3' },
  { id: 'CW-R05', label: '违规担保',           desc: '超授权或违规对外担保',     level: 'red',    rawLevel: '高', count: 4,  trend: '0'  },
  { id: 'CW-R06', label: '账实不符',           desc: '账面数据与实际不符',       level: 'orange', rawLevel: '中', count: 12, trend: '+1' },
  { id: 'CW-R07', label: '税务违规',           desc: '税务申报不合规',           level: 'orange', rawLevel: '中', count: 9,  trend: '-1' },
  { id: 'CW-R08', label: '预算失控',           desc: '超预算或预算偏差大',       level: 'orange', rawLevel: '中', count: 18, trend: '+2' },
  { id: 'CW-R09', label: '关联交易非关联化',   desc: '中间方规避关联披露',       level: 'red',    rawLevel: '高', count: 7,  trend: '+1' },
  { id: 'CW-R10', label: '挂靠经营',           desc: '资金流水挂靠费关键词',     level: 'orange', rawLevel: '中', count: 11, trend: '+2' },
  { id: 'CW-R11', label: '资金集中率低',       desc: '可归集资金集中度未达标',   level: 'yellow', rawLevel: '低', count: 6,  trend: '-2' },
]

const stats = { high: 30, medium: 55, low: 16 }

const filteredAreas = computed(() => {
  if (filterLevel.value === 'all') return riskAreas
  return riskAreas.filter(a => a.rawLevel === filterLevel.value)
})

// ===== B1 时空矩阵：11 风险域 × 4 时窗 =====
// cells: [近7天, 近30天, 近半年, 健康度]
const matrixRows = [
  { key: 'fk',   name: '虚假贸易',         cells: [
    { count: 6, level: 'red',    ids: ['CW-2026008', 'CW-2026012', 'CW-2026019', 'CW-2026023', 'CW-2026029', 'CW-2026031'] },
    { count: 7, level: 'orange', ids: ['CW-2025091', 'CW-2025093', 'CW-2025096', 'CW-2025099', 'CW-2025102', 'CW-2025104', 'CW-2025108'] },
    { count: 2, level: 'yellow', ids: ['CW-2025013', 'CW-2025028'] },
    { health: 62, color: '#ef4444' },
  ]},
  { key: 'rzx', name: '融资性贸易',       cells: [
    { count: 8, level: 'red',    ids: ['CW-2026002', 'CW-2026005', 'CW-2026011', 'CW-2026016', 'CW-2026020', 'CW-2026024', 'CW-2026027', 'CW-2026033'] },
    { count: 6, level: 'orange', ids: ['CW-2025082', 'CW-2025086', 'CW-2025090', 'CW-2025094', 'CW-2025098', 'CW-2025101'] },
    { count: 1, level: 'yellow', ids: ['CW-2025010'] },
    { health: 58, color: '#ef4444' },
  ]},
  { key: 'twxh', name: '资金体外循环',     cells: [
    { count: 5, level: 'red',    ids: ['CW-2026015', 'CW-2026021', 'CW-2026026', 'CW-2026032', 'CW-2026036'] },
    { count: 5, level: 'orange', ids: ['CW-2025085', 'CW-2025089', 'CW-2025095', 'CW-2025103', 'CW-2025107'] },
    { count: 2, level: 'yellow', ids: ['CW-2025021', 'CW-2025034'] },
    { health: 68, color: '#f97316' },
  ]},
  { key: 'ljgq', name: '两金高企',         cells: [
    { count: 2, level: 'orange', ids: ['CW-2026022', 'CW-2026034'] },
    { count: 9, level: 'orange', ids: ['CW-2025080', 'CW-2025084', 'CW-2025088', 'CW-2025092', 'CW-2025097', 'CW-2025100', 'CW-2025105', 'CW-2025109', 'CW-2025112'] },
    { count: 2, level: 'yellow', ids: ['CW-2025040', 'CW-2025051'] },
    { health: 72, color: '#f97316' },
  ]},
  { key: 'sw',   name: '税务违规',         cells: [
    { count: 1, level: 'orange', ids: ['CW-2026017'] },
    { count: 6, level: 'orange', ids: ['CW-2025078', 'CW-2025083', 'CW-2025087', 'CW-2025091', 'CW-2025106', 'CW-2025110'] },
    { count: 1, level: 'yellow', ids: ['CW-2025060'] },
    { health: 81, color: '#facc15' },
  ]},
  { key: 'ys',   name: '预算失控',         cells: [
    { count: 0, level: 'low',    ids: [] },
    { count: 8, level: 'orange', ids: ['CW-2025075', 'CW-2025081', 'CW-2025085', 'CW-2025092', 'CW-2025098', 'CW-2025104', 'CW-2025109', 'CW-2025113'] },
    { count: 3, level: 'yellow', ids: ['CW-2025045', 'CW-2025056', 'CW-2025068'] },
    { health: 76, color: '#facc15' },
  ]},
  { key: 'gl',   name: '关联交易非关联化', cells: [
    { count: 7, level: 'red',    ids: ['CW-2026003', 'CW-2026009', 'CW-2026014', 'CW-2026018', 'CW-2026025', 'CW-2026030', 'CW-2026035'] },
    { count: 4, level: 'orange', ids: ['CW-2025079', 'CW-2025088', 'CW-2025097', 'CW-2025111'] },
    { count: 1, level: 'yellow', ids: ['CW-2025025'] },
    { health: 64, color: '#f97316' },
  ]},
  { key: 'wgdb', name: '违规担保',         cells: [
    { count: 4, level: 'red',    ids: ['CW-2026004', 'CW-2026013', 'CW-2026028', 'CW-2026037'] },
    { count: 3, level: 'orange', ids: ['CW-2025082', 'CW-2025095', 'CW-2025108'] },
    { count: 1, level: 'yellow', ids: ['CW-2025035'] },
    { health: 70, color: '#f97316' },
  ]},
  { key: 'zclf', name: '资产流失',         cells: [
    { count: 0, level: 'low',    ids: [] },
    { count: 3, level: 'orange', ids: ['CW-2025077', 'CW-2025089', 'CW-2025102'] },
    { count: 2, level: 'yellow', ids: ['CW-2025048', 'CW-2025063'] },
    { health: 85, color: '#22c55e' },
  ]},
  { key: 'pzzj', name: '凭证造假',         cells: [
    { count: 1, level: 'red',    ids: ['CW-2026001'] },
    { count: 2, level: 'orange', ids: ['CW-2025090', 'CW-2025103'] },
    { count: 1, level: 'yellow', ids: ['CW-2025058'] },
    { health: 74, color: '#facc15' },
  ]},
  { key: 'hzjt', name: '坏账计提',         cells: [
    { count: 0, level: 'low',    ids: [] },
    { count: 1, level: 'yellow', ids: ['CW-2025096'] },
    { count: 0, level: 'low',    ids: [] },
    { health: 92, color: '#22c55e' },
  ]},
]
const matrixColNames = ['近7天新增', '近30天积压', '近半年归档', '健康度']

// 把 matrixRows 转成条形图数据（每域 d7 / d30 / total / health 等级）
const riskMatrixFlat = computed(() => matrixRows.map(r => {
  const d7  = r.cells[0]?.count || 0
  const d30 = r.cells[1]?.count || 0
  const d6m = r.cells[2]?.count || 0
  const total = d7 + d30 + d6m
  // 健康等级：d7>=4 高危; d7>=1||d30>=4 中危; 否则低
  const health = d7 >= 4 ? 'danger' : (d7 >= 1 || d30 >= 4 ? 'warn' : 'safe')
  return { key: r.key, label: r.name, d7, d30, d6m, total, health }
}))

const filteredRiskMatrix = computed(() => {
  if (riskFilter.value === 'all') return riskMatrixFlat.value
  return riskMatrixFlat.value.filter(r => r.health === riskFilter.value)
})

const riskBarOption = computed(() => {
  const rows = [...filteredRiskMatrix.value].sort((a, b) => (b.d7 * 3 + b.d30) - (a.d7 * 3 + a.d30))
  if (riskFilter.value === 'safe' && rows.length === 0) {
    return {
      animation: false, backgroundColor: 'transparent',
      graphic: [{ type: 'text', left: 'center', top: 'middle',
        style: { text: '✓  低风险域全部合规达标', font: 'bold 12px Microsoft YaHei', fill: '#059669' } }],
    }
  }
  const cP = { danger: '#EF4444', warn: '#F59E0B', safe: '#10B981' }
  const cS = { danger: 'rgba(239,68,68,0.22)', warn: 'rgba(245,158,11,0.2)', safe: 'rgba(16,185,129,0.18)' }
  return {
    animation: false, backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.97)', borderColor: '#E2E8F0',
      textStyle: { color: '#334155', fontSize: 11 },
      extraCssText: 'box-shadow:0 4px 20px rgba(15,23,42,0.1)',
      formatter: (p) => {
        const r = rows[p[0].dataIndex]
        if (!r) return ''
        return `<b>${r.label}</b><br/>近7天: <b style="color:${cP[r.health]}">${r.d7}</b> 近30天: <b>${r.d30}</b> 近半年: <b>${r.d6m}</b> 合计: <b>${r.total}</b>`
      },
    },
    legend: { top: 0, right: 0, itemWidth: 8, itemHeight: 8, textStyle: { color: '#94A3B8', fontSize: 9 }, data: ['近7天', '近30天'] },
    grid: { left: 4, right: 30, top: 18, bottom: 2, containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#CBD5E1', fontSize: 9 }, splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'category', data: rows.map(r => r.label), axisLabel: { color: '#475569', fontSize: 9 }, axisLine: { lineStyle: { color: '#E8EDF5' } }, axisTick: { show: false }, inverse: true },
    series: [
      { name: '近7天', type: 'bar', barMaxWidth: 12, stack: 'risk',
        data: rows.map(r => ({ value: r.d7, itemStyle: { color: cP[r.health] } })),
        itemStyle: { borderRadius: [0, 0, 0, 0] } },
      { name: '近30天', type: 'bar', barMaxWidth: 12, stack: 'risk',
        data: rows.map(r => ({ value: r.d30, itemStyle: { color: cS[r.health] } })),
        itemStyle: { borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'right', fontSize: 9, color: '#94A3B8', formatter: (p) => { const r = rows[p.dataIndex]; return r ? `${r.total}` : '' } } },
    ],
  }
})

function openMatrixCell(row, ci, cell, evt) {
  if (ci === 3) {
    matrixCell.value = null
    return
  }
  if (!cell.ids || cell.ids.length === 0) {
    matrixCell.value = null
    return
  }
  // 取相对于 matrix-wrap 的偏移
  const wrap = evt.currentTarget.closest('.matrix-wrap')
  const wr = wrap.getBoundingClientRect()
  const cr = evt.currentTarget.getBoundingClientRect()
  matrixCell.value = {
    row: row.key,
    col: ci,
    rowName: row.name,
    colName: matrixColNames[ci],
    level: cell.level,
    ids: cell.ids,
    x: Math.min(cr.left - wr.left + cr.width * 0.65, wr.width - 220),
    y: cr.top - wr.top + cr.height * 0.7,
  }
}

// ===== B2 多总部拓扑节点 =====
// 4 个总部 + 10 二级 + 12 三级 + 8 末端
const topoNodes = [
  // L1 总部（4 个）— 全部橙色（与采购页 XX集团 同款）
  { id: 'HQ',   name: '集团总部',         tier: 'l1', x: 0,     y: -40,  rev: 10560, risk: '中' },
  { id: 'HQ-N', name: '北方区域总部',     tier: 'l1', x: -880,  y: -380, rev: 3800,  risk: '高' }, // 出问题区域
  { id: 'HQ-S', name: '南方区域总部',     tier: 'l1', x: 900,   y: -360, rev: 3200,  risk: '中' },
  { id: 'HQ-O', name: '海外区域总部',     tier: 'l1', x: 60,    y: 620,  rev: 1560,  risk: '低' },

  // L2 二级公司 — 颜色按 risk：低=蓝 中=琥珀 高=红
  { id: 'T-INV',  name: 'XX投资公司',     tier: 'l2', x: -340,  y: 200,  rev: 850,  parent: 'HQ',   risk: '高' },
  { id: 'T-TECH', name: 'XX科技公司',     tier: 'l2', x: 360,   y: 240,  rev: 1280, parent: 'HQ',   risk: '低' },
  { id: 'N-CONS', name: 'XX建设公司',     tier: 'l2', x: -1180, y: -120, rev: 2850, parent: 'HQ-N', risk: '高' }, // 链路
  { id: 'N-ENER', name: 'XX能源公司',     tier: 'l2', x: -560,  y: -640, rev: 2280, parent: 'HQ-N', risk: '中' },
  { id: 'N-LOG',  name: 'XX物流公司',     tier: 'l2', x: -1100, y: -720, rev: 980,  parent: 'HQ-N', risk: '中' },
  { id: 'S-TRD',  name: 'XX贸易公司',     tier: 'l2', x: 1200,  y: -120, rev: 1650, parent: 'HQ-S', risk: '高' },
  { id: 'S-SUP',  name: 'XX供应链公司',   tier: 'l2', x: 540,   y: -640, rev: 1100, parent: 'HQ-S', risk: '中' },
  { id: 'S-FIN',  name: 'XX金融租赁',     tier: 'l2', x: 1140,  y: -720, rev: 780,  parent: 'HQ-S', risk: '低' },
  { id: 'O-INT',  name: 'XX国际贸易',     tier: 'l2', x: -360,  y: 860,  rev: 680,  parent: 'HQ-O', risk: '低' },
  { id: 'O-ENG',  name: 'XX海外工程',     tier: 'l2', x: 420,   y: 880,  rev: 560,  parent: 'HQ-O', risk: '中' },

  // L3 三级实体 — 低=绿 中=琥珀 高=红
  { id: 'N1', name: 'XX建设一公司', tier: 'l3', x: -1480, y: 120,   rev: 1200, parent: 'N-CONS', risk: '高' }, // 链路
  { id: 'N2', name: 'XX建设二公司', tier: 'l3', x: -1420, y: -340,  rev: 980,  parent: 'N-CONS', risk: '中' },
  { id: 'N3', name: 'XX建设三公司', tier: 'l3', x: -1060, y: 220,   rev: 720,  parent: 'N-CONS', risk: '低' },
  { id: 'N4', name: 'XX新能源公司', tier: 'l3', x: -680,  y: -900,  rev: 850,  parent: 'N-ENER', risk: '低' },
  { id: 'N5', name: 'XX电力子公司', tier: 'l3', x: -300,  y: -780,  rev: 620,  parent: 'N-ENER', risk: '中' },
  { id: 'S1', name: 'XX大宗商品',   tier: 'l3', x: 1480,  y: 120,   rev: 780,  parent: 'S-TRD',  risk: '高' },
  { id: 'S2', name: 'XX供应链子',   tier: 'l3', x: 1420,  y: -340,  rev: 560,  parent: 'S-TRD',  risk: '中' },
  { id: 'S3', name: 'XX快消子公司', tier: 'l3', x: 720,   y: -880,  rev: 420,  parent: 'S-SUP',  risk: '低' },
  { id: 'T1', name: 'XX软件子公司', tier: 'l3', x: 580,   y: 440,   rev: 580,  parent: 'T-TECH', risk: '低' },
  { id: 'T2', name: 'XX硬件子公司', tier: 'l3', x: 120,   y: 500,   rev: 420,  parent: 'T-TECH', risk: '低' },
  { id: 'O1', name: 'XX中东项目部', tier: 'l3', x: 620,   y: 1080,  rev: 280,  parent: 'O-ENG',  risk: '中' },
  { id: 'O2', name: 'XX东南亚分公司', tier: 'l3', x: -540, y: 1100, rev: 240,  parent: 'O-INT',  risk: '低' },

  // L4 末端 — 低=浅蓝 中=浅琥珀 高=深红
  { id: 'P-ADM', name: 'XX行政部门',  tier: 'l4', x: -1740, y: 340,  rev: 25,  parent: 'N1', risk: '高' }, // 链路
  { id: 'P-A',   name: 'XX项目A标段', tier: 'l4', x: -1720, y: 60,   rev: 180, parent: 'N1', risk: '中' },
  { id: 'P-B',   name: 'XX项目B标段', tier: 'l4', x: -1320, y: 400,  rev: 160, parent: 'N1', risk: '低' },
  { id: 'P-C',   name: 'XX项目C标段', tier: 'l4', x: -1680, y: -520, rev: 140, parent: 'N2', risk: '低' },
  { id: 'P-D',   name: 'XX项目D标段', tier: 'l4', x: -1000, y: -1060,rev: 120, parent: 'N4', risk: '低' },
  { id: 'P-E',   name: 'XX项目E标段', tier: 'l4', x: 1720,  y: 340,  rev: 130, parent: 'S1', risk: '中' },
  { id: 'P-F',   name: 'XX海外项目F', tier: 'l4', x: 840,   y: 1260, rev: 90,  parent: 'O1', risk: '低' },
  { id: 'P-G',   name: 'XX海外项目G', tier: 'l4', x: -780,  y: 1280, rev: 80,  parent: 'O2', risk: '低' },
]

// 树形分支（HQ→L2→L3→L4）
const treeLinks = topoNodes.filter(n => n.parent).map(n => ({ source: n.parent, target: n.id }))

// 总部之间互联（细 indigo 弧线）
const hqLinks = [
  { source: 'HQ', target: 'HQ-N', curveness: 0.18 },
  { source: 'HQ', target: 'HQ-S', curveness: -0.18 },
  { source: 'HQ', target: 'HQ-O', curveness: 0.12 },
  { source: 'HQ-N', target: 'HQ-S', curveness: 0.32 },
]

// 异常往来分支（柔和高级色虚线 / 长曲线）
const bizLinks = [
  { source: 'N-CONS', target: 'S-TRD', _color: '#b45309', _dash: 'dashed', _label: '融资性贸易', curveness: 0.32 },
  { source: 'N1',     target: 'S-SUP', _color: '#9f1239', _dash: 'dashed', _label: '资金归集',   curveness: 0.42 },
  { source: 'T-INV',  target: 'O-ENG', _color: '#6d28d9', _dash: 'dashed', _label: '违规担保',   curveness: 0.38 },
  { source: 'S-TRD',  target: 'S1',    _color: '#9f1239', _dash: 'dashed', _label: '关联交易',   curveness: 0.22 },
  { source: 'N-ENER', target: 'S-SUP', _color: '#0e7490', _dash: 'dashed',                       curveness: 0.5  },
  { source: 'O-INT',  target: 'S-TRD', _color: '#6d28d9', _dash: 'dashed',                       curveness: 0.48 },
  { source: 'T-TECH', target: 'O-INT', _color: '#0e7490', _dash: 'dashed',                       curveness: 0.28 },
]

// CW-2026001 问责链路：末端 → 三级 → 二级 → 区域总部 → 集团总部
const chainIds = ['P-ADM', 'N1', 'N-CONS', 'HQ-N', 'HQ']
// 采购页 22 节点网络图同款色板：节点颜色 = f(tier, risk)
// L1 总部 全部 #F97316；L2 二级 低→蓝 中→琥珀 高→红；L3 三级 低→绿 中→琥珀 高→红；L4 末端 低→浅蓝 中→浅琥珀 高→深红
// 整体加 0.72 透明度，质感更柔和不刺眼；链路高亮时恢复饱和
function colorOf(n) {
  if (n.tier === 'l1') return 'rgba(249,115,22,0.78)'   // #F97316 @ 0.78
  if (n.tier === 'l2') return n.risk === '高' ? 'rgba(239,68,68,0.72)'  // #EF4444
    : n.risk === '中' ? 'rgba(245,158,11,0.72)'                          // #F59E0B
    : 'rgba(59,130,246,0.72)'                                            // #3B82F6
  if (n.tier === 'l3') return n.risk === '高' ? 'rgba(239,68,68,0.7)'
    : n.risk === '中' ? 'rgba(245,158,11,0.7)'
    : 'rgba(16,185,129,0.7)'                                             // #10B981
  /* l4 */               return n.risk === '高' ? 'rgba(220,38,38,0.78)' // #DC2626 末端高风险稍亮
    : n.risk === '中' ? 'rgba(252,211,77,0.7)'                            // #FCD34D
    : 'rgba(147,197,253,0.7)'                                             // #93C5FD
}
// 链路高亮：末端深红 → 三级红 → 二级红 → 区域橙 → 集团橙（与采购页 XX建设公司→XX建设一公司→XX车间维修工程 同色系）
const chainColors = { 'P-ADM': '#DC2626', 'N1': '#EF4444', 'N-CONS': '#EF4444', 'HQ-N': '#F97316', 'HQ': '#F97316' }
const tierLabels = { l1: '总部', l2: '二级', l3: '三级', l4: '末端' }

function sizeOf(n) {
  if (n.tier === 'l1') return n.id === 'HQ' ? 64 : Math.max(46, Math.min(56, 36 + n.rev / 110))
  if (n.tier === 'l2') return Math.max(28, Math.min(46, 18 + n.rev / 78))
  if (n.tier === 'l3') return Math.max(18, Math.min(28, 12 + n.rev / 80))
  return Math.max(11, Math.min(17, 8 + n.rev / 18))
}

const topoChart = ref(null)
const topoKey = ref(0)

function resetTopo() {
  orbitChain.value = false
  // 通过 key 强制 EChart 组件重建 —— 完全清除拖拽/缩放/平移状态
  topoKey.value++
}



const partyRanking = [
  { rank: 1,  name: 'XX银行总行',           receive: 2850, pay: 3200, risk: 0, health: 98, top: true },
  { rank: 2,  name: 'XX建设工程有限公司',   receive: 850,  pay: 1200, risk: 5, health: 72 },
  { rank: 3,  name: 'XX建材有限公司',       receive: 620,  pay: 780,  risk: 3, health: 82 },
  { rank: 4,  name: 'XX能源科技有限公司',   receive: 580,  pay: 650,  risk: 1, health: 92 },
  { rank: 5,  name: 'XX供应链管理有限公司', receive: 420,  pay: 580,  risk: 8, health: 62 },
  { rank: 6,  name: 'XX信息技术有限公司',   receive: 350,  pay: 420,  risk: 0, health: 95 },
  { rank: 7,  name: 'XX设备制造有限公司',   receive: 280,  pay: 350,  risk: 1, health: 88 },
  { rank: 8,  name: 'XX投资控股有限公司',   receive: 220,  pay: 380,  risk: 4, health: 58 },
  { rank: 9,  name: 'XX物流运输公司',       receive: 180,  pay: 220,  risk: 2, health: 85 },
  { rank: 10, name: 'XX咨询服务有限公司',   receive: 120,  pay: 180,  risk: 0, health: 90 },
]

const riskList = [
  {
    id: 'R-CW-001', no: 'CW-2026001', name: '虚假凭证预警', level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-15 16:20', entity: 'XX行政部门 / 报销人XXX',
    status: '待核查', statusCode: 'pending', amount: '2.8', amountUnit: '万',
    handler: '郑XX（财务部）', deadline: '2026-05-22',
    detail: {
      riskItem: '办公耗材采购费用报销 2.8 万元，发票为虚假发票，关联合同为虚假合同，资金流向个人账号。',
      riskDefinition: '会计凭证所附资料虚假、无效，或凭证内容与实际业务不符。',
      calculationLogic: '发票校验失败 + 无业务支撑 + 资金流向异常 → 触发预警',
      causeAnalysis: [
        '会计凭证 PZ-20260515002 标注"办公耗材采购"金额 2.8 万元，记账与审核人员未核实即入账。',
        '发票 FP-20260515002 经税务系统核查为虚假发票，抬头税号与供应商信息不符。',
        '合同 HT-202605003 约定供应商不在供应商名录中，无审批记录，属虚假合同。',
        '采购计划 CG-202605003 无对应记录，无询价、验收记录，确认无实际采购业务。',
        '银行流水 LS-20260515002 显示 2.8 万元支付至 XXX 个人账号，非合同约定供应商账号。',
      ],
      penetrationLinks: [
        { domain: '财务域', data: '会计凭证 PZ-20260515002' },
        { domain: '财务域', data: '发票校验 FP-20260515002' },
        { domain: '财务域', data: '费用报销单 BX-20260515002' },
        { domain: '合同域', data: '虚假合同 HT-202605003' },
        { domain: '合同域', data: '供应商名录核查' },
        { domain: '采购域', data: '采购计划查询（无 CG-202605003）' },
        { domain: '资金域', data: '银行流水 LS-20260515002' },
      ],
      rectificationSuggestions: [
        '立即追回违规报销资金 2.8 万元，对报销人 XXX 问责，情节严重移交纪检。',
        '对记账与审核人员问责，重新学习发票校验与凭证审核流程。',
        '完善凭证审核流程：必须对接税务系统校验发票、必须核查业务支撑资料。',
        '对近 3 个月费用报销凭证全面排查。',
        '加强员工培训，普及财务合规知识。',
      ],
    },
  },
  { id: 'R-CW-002', no: 'CW-2026008', name: '虚假贸易收入确认预警', level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-18 10:30', entity: 'XX贸易公司 / XX关联企业',
    status: '核查中', statusCode: 'investigating', amount: '1,500', amountUnit: '万',
    handler: '冯XX（审计部）', deadline: '2026-05-25',
    summary: '贸易闭环存在自循环嫌疑，需核查货物流与资金流匹配。' },
  { id: 'R-CW-003', no: 'CW-2026015', name: '资金体外循环预警', level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-17 14:00', entity: 'XX投资公司 / XX个人账户',
    status: '待核查', statusCode: 'pending', amount: '800', amountUnit: '万',
    handler: '陈XX（风控部）', deadline: '2026-05-24' },
  { id: 'R-CW-004', no: 'CW-2026022', name: '两金占用高企预警', level: 'orange', levelLabel: '中风险',
    warningTime: '2026-05-16 09:00', entity: 'XX建设公司 / 多个客户',
    status: '整改中', statusCode: 'rectifying', amount: '1,850', amountUnit: '亿',
    handler: '林XX（财务部）', deadline: '2026-05-30' },
  { id: 'R-CW-005', no: 'CW-2026028', name: '违规担保预警', level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-14 11:30', entity: 'XX投资公司 / XX关联企业',
    status: '核查中', statusCode: 'investigating', amount: '2,500', amountUnit: '万',
    handler: '黄XX（法务部）', deadline: '2026-05-23' },
  { id: 'R-CW-006', no: 'CW-2026035', name: '关联交易非关联化预警', level: 'red', levelLabel: '高风险',
    warningTime: '2026-05-13 15:00', entity: 'XX能源公司 / XX中间商',
    status: '整改中', statusCode: 'rectifying', amount: '680', amountUnit: '万',
    handler: '刘XX（审计部）', deadline: '2026-05-27' },
  { id: 'R-CW-007', no: 'CW-2026042', name: '预算超支预警', level: 'yellow', levelLabel: '低风险',
    warningTime: '2026-05-12 10:00', entity: 'XX建设一公司 / 多个项目',
    status: '已闭环', statusCode: 'closed', amount: '320', amountUnit: '万',
    handler: '张XX（预算部）', deadline: '2026-05-20' },
]

const highRiskCount = computed(() => riskList.filter(r => r.level === 'red').length)

const aiSuggestions = [
  { id: 'AI-1', type: 'CW-2026001 虚假凭证', priority: 'high', priorityLabel: '高',
    content: 'XX行政部门虚假凭证（2.8万），虚假发票+虚假合同+资金流向个人，建议立即核查并追回资金。' },
  { id: 'AI-2', type: '五维联动预警', priority: 'high', priorityLabel: '高',
    content: '发现 28 笔五单不匹配（合计 653 万），其中业务-财务差异 12 笔 320 万，建议启动联动核查。' },
  { id: 'AI-3', type: '两金占用趋势', priority: 'medium', priorityLabel: '中',
    content: '两金占用 1,850 亿超目标 50 亿，建设公司应收账龄超 180 天占比上升，建议加强催收。' },
]

// ===== C1 全局穿透：3 层钻取状态 =====
const drillDomain = ref(null) // 当前展开的域 id
const drillRisk = ref(null)   // 当前展开的风险细节 id

function toggleDrillDomain(id) {
  drillDomain.value = drillDomain.value === id ? null : id
  drillRisk.value = null
}
function toggleDrillRisk(id) {
  drillRisk.value = drillRisk.value === id ? null : id
}

// 两大穿透主题：资金穿透 (账户链路) / 责任穿透 (审批链路)，每主题含若干风险，每风险含细节流水/审批记录
const drillDomains = [
  {
    id: 'fund', icon: '💰', name: '资金穿透 · 账户链路', tone: 'red',
    summary: '银行账户 385 → 归集 4,280 亿 → 支付 9,850 笔 → 记账',
    metric: '96.2% 合规', badge: '9 笔异常',
    risks: [
      {
        id: 'fund-r1', title: '资金体外循环', amount: '923 万',
        desc: '账户链路脱离监管，疑似通过中间户 / 个人账户拆分流转',
        actions: ['冻结相关账户', '启动反洗钱核查', '同步纪检立案'],
        transactions: [
          { no: 'LS-20260515002', payee: 'XXX 个人账户',    amount: '¥2.8 万',  time: '05-15 16:20', evidence: '虚假凭证 PZ-20260515002' },
          { no: 'LS-20260512083', payee: 'XX商贸 (空壳)',   amount: '¥320 万',  time: '05-12 09:48', evidence: '账户多层穿透→个人' },
          { no: 'LS-20260508045', payee: 'XX供应链 (体外)', amount: '¥600 万',  time: '05-08 14:30', evidence: '代垫利息出表' },
        ],
      },
      {
        id: 'fund-r2', title: '账户归集异常', amount: '4,860 万',
        desc: '5 个二级公司归集率 < 60%，疑似账户外置规避集中管控',
        actions: ['强制纳入资金池', '关停冗余账户', '通报二级总经理'],
        transactions: [
          { no: 'ACC-N-2089', payee: 'XX建设公司 基本户',  amount: '¥2,300 万', time: '余额', evidence: '归集率 42% · 未入池' },
          { no: 'ACC-S-1056', payee: 'XX贸易公司 一般户',  amount: '¥1,580 万', time: '余额', evidence: '归集率 38% · 长期闲置' },
          { no: 'ACC-O-0312', payee: 'XX海外工程 离岸户',  amount: '¥980 万',   time: '余额', evidence: '归集率 0% · 海外监管盲区' },
        ],
      },
      {
        id: 'fund-r3', title: '支付链路异常拦截', amount: '186 万',
        desc: '6 笔大额支付被资金系统强控拦截 · 收款方为黑名单或个人户',
        actions: ['维持拦截 · 转人工核查', '排查发起人', '完善支付黑名单'],
        transactions: [
          { no: 'PAY-20260514001', payee: 'XXX 个人 (建设)', amount: '¥86 万',  time: '05-14 11:05', evidence: '收款方匹配黑名单' },
          { no: 'PAY-20260511012', payee: 'XX未备案供应商',  amount: '¥58 万',  time: '05-11 17:22', evidence: '收款户非合同方' },
          { no: 'PAY-20260507005', payee: 'XX离岸账户',      amount: '¥42 万',  time: '05-07 10:14', evidence: '夜间出账·跨境异常' },
        ],
      },
    ],
  },
  {
    id: 'duty', icon: '⚖️', name: '责任穿透 · 审批链路', tone: 'orange',
    summary: '授权 156 项 → 财务总监 28 → 会计 / 出纳 → 三重一大 48',
    metric: '98.0% 合规', badge: '12 笔异常',
    risks: [
      {
        id: 'duty-r1', title: '审批越权', amount: '380 万',
        desc: '5 笔大额拨付绕过财务总监 / 三重一大节点直接出账',
        actions: ['追回越权拨付', '问责审批人', '系统强控审批节点'],
        transactions: [
          { no: 'AP-20260514008', payee: '三级 · 张某 越权代签', amount: '¥180 万', time: '05-14', evidence: '应由二级总监审批' },
          { no: 'AP-20260511015', payee: '二级 · 王某 缺总监签', amount: '¥120 万', time: '05-11', evidence: '审批流跳过节点 3' },
          { no: 'AP-20260506022', payee: '三级 · 李某 分拆规避', amount: '¥80 万',  time: '05-06', evidence: '同日 4 笔单签拆分' },
        ],
      },
      {
        id: 'duty-r2', title: '高频无单录入', amount: '52 笔 · 218 万',
        desc: '会计人员高频录入零附件凭证，疑似工具人代签',
        actions: ['冻结相关账号操作权', '抽样回查全部凭证', '重新培训上岗'],
        transactions: [
          { no: 'OP-LXX-2026', payee: '李某 (XX行政部)', amount: '7 笔 · ¥38 万',  time: '近 30 天', evidence: '零附件入账率 100%' },
          { no: 'OP-ZXX-2026', payee: '郑某 (XX建设)',  amount: '12 笔 · ¥85 万', time: '近 30 天', evidence: '夜间高频提交' },
          { no: 'OP-WXX-2026', payee: '王某 (XX贸易)',  amount: '9 笔 · ¥45 万',  time: '近 30 天', evidence: '同 IP 多账号操作' },
        ],
      },
      {
        id: 'duty-r3', title: '三重一大缺失', amount: '8 项',
        desc: '8 项大额事项未走三重一大流程直接执行',
        actions: ['立即追补会议纪要', '通报董事会', '修订三重一大制度'],
        transactions: [
          { no: 'BIG-2026-018', payee: 'XX担保事项',     amount: '¥1,800 万', time: '05-15', evidence: '未过董事会' },
          { no: 'BIG-2026-012', payee: 'XX重大对外投资', amount: '¥1,200 万', time: '05-09', evidence: '总经理办公会越权决策' },
          { no: 'BIG-2026-007', payee: 'XX资产处置',     amount: '¥680 万',   time: '04-28', evidence: '无会议纪要' },
        ],
      },
    ],
  },
]

// ===== C2 财务热力图（8 业务域 × 8 收支类型）=====
const heatCols = ['资金', '预算', '核算', '税务', '报表', '产权', '融资', '挂靠']
const heatRows = ['经营流入', '经营流出', '投资流入', '投资流出', '筹资流入', '筹资流出', '内部划转', '专项拨款']
// 单位：亿
const heatValues = [
  // 资金  预算  核算  税务  报表  产权  融资  挂靠
  [320, 180,  92,  68, 145,  38,  60,  12], // 经营流入
  [285, 165,  88,  72, 138,  35,  55,  18], // 经营流出
  [125,  85,  42,  28,  78,  56,  92,   8], // 投资流入
  [148, 102,  48,  32,  82,  68, 110,  14], // 投资流出
  [ 95, 220,  35,  18,  62,  12, 180,   6], // 筹资流入
  [ 88, 195,  32,  16,  58,  10, 165,   9], // 筹资流出
  [185, 120, 105,  22, 220,  88,  45,  92], // 内部划转（挂靠列异常）
  [ 75,  82,  28,  14,  48,  22,  35,  68], // 专项拨款（挂靠列异常）
]

const financeHeatOption = computed(() => {
  const data = []
  heatValues.forEach((row, ri) => {
    row.forEach((v, ci) => data.push([ci, ri, v]))
  })
  return {
    animation: false, backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(255,255,255,0.97)', borderColor: '#E2E8F0',
      textStyle: { color: '#334155', fontSize: 11 },
      formatter: (p) => `${heatRows[p.data[1]]} × ${heatCols[p.data[0]]}<br/>资金量: <b>${p.data[2]}</b> 亿`,
    },
    grid: { left: 56, right: 8, top: 6, bottom: 26, containLabel: false },
    xAxis: {
      type: 'category', data: heatCols,
      axisLabel: { color: '#475569', fontSize: 9, interval: 0, fontWeight: 600 },
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisTick: { show: false },
      splitArea: { show: true, areaStyle: { color: ['#F8FAFC', '#FFF'] } },
    },
    yAxis: {
      type: 'category', data: heatRows, inverse: true,
      axisLabel: { color: '#475569', fontSize: 9, fontWeight: 600 },
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisTick: { show: false },
      splitArea: { show: true, areaStyle: { color: ['#F8FAFC', '#FFF'] } },
    },
    visualMap: {
      min: 0, max: 320, show: false,
      inRange: { color: ['#F1F5F9', '#DBEAFE', '#93C5FD', '#FDE68A', '#FDBA74', '#F87171', '#B91C1C'] },
    },
    series: [{
      name: '资金量', type: 'heatmap', data,
      label: {
        show: true, fontSize: 9, fontWeight: 700,
        formatter: (p) => p.data[2] ? String(p.data[2]) : '',
        color: (p) => p.data[2] > 180 ? '#FFF' : '#374151',
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(239,68,68,0.35)' } },
    }],
  }
})

// ===== C2 单位名片 =====
const partyOpenId = ref(null)
const partyRankingExtra = partyRanking.map(p => {
  if (p.name === 'XX投资控股有限公司') {
    return { ...p, card: [
      { k: '授信额度',     v: '125% 超额', tone: 'warn' },
      { k: '两金占用',     v: '14.2% 超控线', tone: 'warn' },
      { k: '代垫资金',     v: '¥ 86 亿',  tone: 'warn' },
      { k: '近 30 天预警', v: '4 条',     tone: 'warn' },
      { k: '关联企业',     v: '12 家',    tone: '' },
      { k: '建议',         v: '暂停非生产性拨付', tone: 'warn' },
    ]}
  }
  return p
})
// 替换原数组引用为带 card 字段的新数组
;(function reassignParty() {
  partyRanking.length = 0
  partyRankingExtra.forEach(p => partyRanking.push(p))
})()

function togglePartyCard(p) {
  if (!p.card) return
  partyOpenId.value = partyOpenId.value === p.rank ? null : p.rank
}

// C3 系统入口（恢复上一轮 4-card sys-grid）
const systemEntries = [
  { id: 'sys1', icon: '核', label: '核算系统', statusText: '在线', statusClass: 'sys-online', color: '#2563eb', bg: '#eff6ff' },
  { id: 'sys2', icon: '资', label: '资金系统', statusText: '在线', statusClass: 'sys-online', color: '#0891b2', bg: '#ecfeff' },
  { id: 'sys3', icon: '预', label: '预算系统', statusText: '在线', statusClass: 'sys-online', color: '#16a34a', bg: '#f0fdf4' },
  { id: 'sys4', icon: '税', label: '税务系统', statusText: '在线', statusClass: 'sys-online', color: '#f97316', bg: '#fff7ed' },
]

const progressSteps = [
  { code: 'pending',       label: '待核查' },
  { code: 'investigating', label: '核查中' },
  { code: 'rectifying',    label: '整改中' },
  { code: 'closed',        label: '已闭环' },
]

function progressIndex(r) {
  return progressSteps.findIndex(s => s.code === r.statusCode)
}

function selectArea(id) {
  selectedAreaId.value = id
}

function showRiskDetail(r) {
  selectedRiskId.value = r.no || r.id
  activeRisk.value = r
  // 触发 B2 星轨问责链路高亮
  orbitChain.value = r.no === 'CW-2026001'
}

function rankClass(rank) {
  if (rank <= 3) return 'top'
  if (rank <= 6) return 'mid'
  return 'low'
}

function healthColor(v) {
  if (v >= 90) return '#16a34a'
  if (v >= 75) return '#2563eb'
  if (v >= 60) return '#f97316'
  return '#ef4444'
}

function penDomainColor(domain) {
  if (domain === '资金域') return 'blue'
  if (domain === '合同域') return 'purple'
  if (domain === '采购域') return 'orange'
  if (domain === '财务域') return 'green'
  return 'blue'
}

// (removed old spark/ring helpers — replaced by A1 radar + A2 hero)

// B2 多总部拓扑：ECharts graph + roam + draggable + 多分支 + 异常往来
const networkOption = computed(() => {
  const focused = orbitChain.value
  const set = new Set(chainIds)

  const data = topoNodes.map(n => {
    const base = sizeOf(n)
    const baseColor = colorOf(n)
    const dim = focused && !set.has(n.id)
    const hit = focused && set.has(n.id)
    const fill = hit ? chainColors[n.id] : baseColor
    // 高风险节点带阴影（采购页 XX建设公司 / XX车间维修工程 同款）
    const isHigh = n.risk === '高'
    return {
      id: n.id,
      name: n.name,
      x: n.x,
      y: n.y,
      _tier: n.tier,
      _rev: n.rev,
      _risk: n.risk,
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
        distance: 3,
        opacity: dim ? 0 : 1,
      },
    }
  })

  const allLinks = []
  // 树形：边色继承目标节点颜色（采购页 集团→XX科技公司=蓝、集团→XX贸易公司=红 同款）
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
  // 总部互联（橙色，匹配 L1 集团色）
  hqLinks.forEach(l => {
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
  // 异常往来：彩色虚线带标签
  bizLinks.forEach(l => {
    allLinks.push({
      source: l.source, target: l.target,
      lineStyle: {
        color: l._color,
        width: 1.2,
        type: l._dash,
        opacity: focused ? 0.05 : 0.6,
        curveness: l.curveness || 0.3,
      },
      label: l._label ? {
        show: !focused,
        formatter: l._label,
        fontSize: 9,
        color: l._color,
        fontWeight: 600,
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: [2, 6],
        borderRadius: 999,
      } : { show: false },
    })
  })

  return {
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,23,42,.92)',
      borderColor: '#475569',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (p) => {
        if (p.dataType === 'edge') return ''
        const d = p.data
        return `<b>${d.name}</b><br/>层级：${tierLabels[d._tier]}<br/>营收：${d._rev} 亿<br/><i style="opacity:.6">拖拽可移动 / 滚轮缩放 / 空白拖动平移</i>`
      },
    },
    series: [{
      type: 'graph',
      layout: 'none',
      roam: true,
      draggable: true,
      // 不设 zoom，让 ECharts 按节点坐标自动适配画布；scaleLimit 仅限制用户后续滚轮缩放范围
      scaleLimit: { min: 0.3, max: 3 },
      edgeSymbol: ['none', 'none'],
      data,
      links: allLinks,
      lineStyle: { color: '#cbd5e1', width: 1, opacity: 0.45, curveness: 0.12 },
      emphasis: {
        focus: 'adjacency',
        scale: 1.08,
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

function lighten(hex, amt) {
  const h = hex.replace('#', '')
  const num = parseInt(h, 16)
  let r = (num >> 16) + amt
  let g = ((num >> 8) & 0xff) + amt
  let b = (num & 0xff) + amt
  r = Math.min(255, Math.max(0, r))
  g = Math.min(255, Math.max(0, g))
  b = Math.min(255, Math.max(0, b))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}
function withAlpha(hex, a) {
  const h = hex.replace('#', '')
  const num = parseInt(h, 16)
  return `rgba(${num >> 16}, ${(num >> 8) & 0xff}, ${num & 0xff}, ${a})`
}

// A3 战略三轴全时态趋势图：柱状营收 + 极光绿利润折线 + 冰晶蓝现金流折线
const trendOption = computed(() => ({
  animation: false,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#dbeafe',
    textStyle: { color: '#334155', fontSize: 11 }, extraCssText: 'box-shadow:0 4px 20px rgba(15,23,42,.1)' },
  legend: { top: 2, left: 'center', itemGap: 10, itemWidth: 10, itemHeight: 6, textStyle: { color: '#64748b', fontSize: 10 } },
  grid: { left: 8, right: 8, top: 38, bottom: 4, containLabel: true },
  xAxis: {
    type: 'category',
    data: ['06', '07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05'],
    axisLabel: { color: '#94a3b8', fontSize: 10 },
    axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false },
  },
  yAxis: [
    { type: 'value', name: '营收(亿)', nameTextStyle: { color: '#94a3b8', fontSize: 9 },
      axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 9 },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}' }, splitLine: { show: false } },
  ],
  series: [
    { name: '营业收入', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, yAxisIndex: 0,
      lineStyle: { width: 2.2, color: '#3b82f6' }, itemStyle: { color: '#3b82f6' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.22)' }, { offset: 1, color: 'rgba(59,130,246,0.02)' }] } },
      data: [820, 835, 848, 830, 855, 868, 840, 852, 865, 878, 885, 880] },
    { name: '利润总额', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, yAxisIndex: 1,
      lineStyle: { width: 2, color: '#16a34a' }, itemStyle: { color: '#16a34a' },
      data: [105, 108, 112, 104, 115, 118, 108, 112, 118, 122, 125, 128] },
    { name: '经营性现金流', type: 'line', smooth: true, symbol: 'circle', symbolSize: 4, yAxisIndex: 1,
      lineStyle: { width: 2, color: '#0891b2' }, itemStyle: { color: '#0891b2' },
      areaStyle: { color: 'rgba(8,145,178,0.08)' },
      data: [65, 68, 72, 58, 75, 78, 55, 62, 70, 82, 85, 75] },
  ],
}))
</script>

<style scoped>
.white-scene {
  height: 100%;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
  color: #1e293b;
}

.screen {
  height: 100%;
  padding: 6px 10px;
  font-family: 'Source Han Sans SC', 'Microsoft YaHei', sans-serif;
  box-sizing: border-box;
}

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

.panel h3 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
  font-size: 14px;
}

.panel p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #64748b;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.muted {
  color: #94a3b8;
}

.small-text {
  font-size: 11px;
}

.sub {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: #eff6ff;
  color: #2563eb;
}

.pill.blue { background: #eff6ff; color: #2563eb; }
.pill.orange { background: #fff7ed; color: #f97316; }
.pill.red { background: #fef2f2; color: #ef4444; }
.pill.green { background: #f0fdf4; color: #16a34a; }
.pill.yellow { background: #fefce8; color: #ca8a04; }
.pill.pending { background: #fef2f2; color: #ef4444; }
.pill.investigating { background: #fff7ed; color: #f97316; }
.pill.rectifying { background: #eff6ff; color: #2563eb; }
.pill.closed { background: #f0fdf4; color: #16a34a; }

/* ====== A1 七维雷达 + 五维联动 ====== */
.a1-panel .panel-head { margin-bottom: 4px; }
.a1-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 60% 40%; gap: 4px; }
.radar-chart { width: 100%; height: 100%; min-height: 0; }

.ww-board {
  display: flex; flex-direction: column; gap: 3px;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  border: 1px solid #c4b5fd; border-radius: 8px; padding: 5px 7px;
}
.ww-title { font-size: 9px; font-weight: 700; color: #6d28d9; text-align: center; }
.ww-chart { flex: 1; min-height: 0; min-height: 60px; }
.ww-rate { text-align: center; font-size: 9px; color: #475569; }
.ww-rate strong { font-size: 16px; font-weight: 800; color: #7c3aed; line-height: 1; }
.ww-rate em { font-size: 10px; font-style: normal; font-weight: 600; }
.ww-diffs { display: flex; flex-direction: column; gap: 2px; }
.ww-diff {
  display: flex; align-items: center; gap: 4px; padding: 2px 5px;
  background: rgba(255,255,255,.7); border-radius: 4px; font-size: 9px; color: #475569;
  cursor: pointer; transition: background .15s;
}
.ww-diff:hover { background: #fef2f2; }
.ww-dd { flex: 1; font-weight: 600; }
.ww-dv { font-size: 10px; }
.ww-dv.warn { color: #dc2626; }
.ww-da { font-style: normal; color: #94a3b8; font-size: 9px; }

/* ====== A2 财务核心利润驾驶舱 ====== */
.a2-panel { padding: 8px 12px; }
.a2-panel .panel-head { margin-bottom: 4px; }
.a2-hero { display: flex; gap: 8px; margin-bottom: 4px; }
.hero-big {
  flex: 1; padding: 5px 10px; border-radius: 8px; text-align: center;
  background: linear-gradient(135deg, #f8faff, #eff6ff); border: 1px solid #dbeafe;
}
.hero-label { display: block; font-size: 9px; color: #64748b; margin-bottom: 1px; font-weight: 600; }
.hero-val { font-size: 19px; font-weight: 900; line-height: 1.1; }
.hero-val em { font-size: 10px; font-weight: 500; margin-left: 2px; font-style: normal; color: #64748b; }
.glow-blue { color: #1e40af; text-shadow: 0 0 12px rgba(37,99,235,.2); }
.glow-green { color: #059669; text-shadow: 0 0 12px rgba(5,150,105,.2); }

.a2-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; flex: 0 0 auto; align-content: start; }
.a2-cell {
  background: linear-gradient(135deg, #fafbfc, #fff);
  border: 1px solid #e2e8f0; border-radius: 7px;
  padding: 4px 6px; text-align: center;
  display: flex; flex-direction: column; gap: 1px; justify-content: center;
}
.a2-cl { display: block; font-size: 9px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.a2-cv { font-size: 14px; font-weight: 900; line-height: 1.05; }
.a2-cv em { font-size: 9px; font-weight: 600; font-style: normal; color: #94a3b8; margin-left: 1px; }

/* ====== Body 三栏 ====== */
.body {
  display: grid;
  grid-template-columns: 0.9fr 3.2fr 1.2fr;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.left, .center, .right {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

/* 左列 A1:B1:C1 = 1.5:2.5:2 */
.left > :nth-child(1) { flex: 1.5; }
.left > :nth-child(2) { flex: 2.5; }
.left > :nth-child(3) { flex: 2; }

/* 中列：A2 按内容自适应（不再贪占空间），剩余高度按 B2 : C2 = 3.7 : 2 分给拓扑 + 热力图 */
.center > :nth-child(1) { flex: 0 0 auto; }
.center > :nth-child(2) { flex: 3.7; min-height: 0; }
.center > :nth-child(3) { flex: 2;   min-height: 0; }

/* 右列 A3:B3:C3 = 1:2:1 */
.right > :nth-child(1) { flex: 1; }
.right > :nth-child(2) { flex: 2; }
.right > :nth-child(3) { flex: 1; }

/* ====== B1 风险域 ====== */
.filter-pills {
  display: inline-flex;
  gap: 4px;
}

.filter-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.filter-pill.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.area-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  align-content: start;
  padding-right: 2px;
}

.area-list::-webkit-scrollbar { width: 4px; }
.area-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.area {
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  background: #fff;
  padding: 5px 9px;
  text-align: left;
  cursor: pointer;
  transition: all .18s ease;
}

.area:hover, .area.active {
  border-color: #bfdbfe;
  box-shadow: 0 4px 12px rgba(37, 99, 235, .08);
}

.area.green { background: linear-gradient(135deg, rgba(34, 197, 94, .08), #fff); border-color: rgba(34, 197, 94, .28); }
.area.yellow { background: linear-gradient(135deg, rgba(250, 204, 21, .12), #fff); border-color: rgba(234, 179, 8, .34); }
.area.orange { background: linear-gradient(135deg, rgba(249, 115, 22, .13), #fff); border-color: rgba(249, 115, 22, .38); }
.area.red { background: linear-gradient(135deg, rgba(239, 68, 68, .14), #fff); border-color: rgba(239, 68, 68, .42); }

.area-grid {
  display: grid;
  grid-template-columns: 88px 1fr 26px;
  align-items: center;
  gap: 8px;
}

.area-name {
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
}

.area-desc {
  font-size: 10px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.area-cnt {
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  padding: 1px 4px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
}

.area-cnt.red { background: #fef2f2; color: #ef4444; }
.area-cnt.orange { background: #fff7ed; color: #f97316; }
.area-cnt.yellow { background: #fefce8; color: #ca8a04; }

/* ====== C1 两类穿透 ====== */
.pen-stack {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.pen-card {
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8fafc, #fff);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  justify-content: center;
}

.pen-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.pen-head strong { font-size: 12px; color: #0f172a; }
.pen-head .muted { font-size: 10px; }

.pen-chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.chain-node {
  padding: 3px 7px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.chain-node.warn { background: #fef2f2; color: #ef4444; }
.chain-node.ok { background: #f0fdf4; color: #16a34a; }

.chain-arrow {
  width: 8px;
  height: 1.5px;
  background: #cbd5e1;
  position: relative;
}

.chain-arrow::after {
  content: '';
  position: absolute;
  right: -2px;
  top: -2px;
  width: 0;
  height: 0;
  border-left: 4px solid #94a3b8;
  border-top: 3px solid transparent;
  border-bottom: 3px solid transparent;
}

/* ====== B2 网络图 ====== */
.legend-mini {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: #64748b;
}

.legend-mini span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.lg-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.lg-dot.green { background: #10B981; }
.lg-dot.yellow { background: #FBBF24; }
.lg-dot.orange { background: #F97316; }
.lg-dot.red { background: #93C5FD; }
/* B2 拓扑图例：总部 + 风险三色（与 colorOf 一一对齐） */
.lg-dot.lr-hq   { background: #F97316; }
.lg-dot.lr-safe { background: #3B82F6; }
.lg-dot.lr-warn { background: #F59E0B; }
.lg-dot.lr-high { background: #EF4444; }

.net-shell {
  flex: 1;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: linear-gradient(180deg, #fff, #f8fafc);
}

.net-chart { width: 100%; height: 100%; }

/* ====== C2 资金往来TOP10 ====== */
.party-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 2px;
  overflow-y: auto;
}

.party-table::-webkit-scrollbar { width: 4px; }
.party-table::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.party-row {
  display: grid;
  grid-template-columns: 30px 1.6fr 64px 64px 38px 1fr;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  font-size: 11px;
  color: #334155;
  flex: 0 0 auto;
}

.party-row.party-head {
  background: #f8fafc;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  cursor: default;
  padding: 4px 8px;
}

.party-row.party-head:hover {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.party-row:hover {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff, #fff);
}

.party-rank {
  display: inline-flex;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 10px;
  background: #f1f5f9;
  color: #64748b;
}

.party-rank.top { background: #fef3c7; color: #b45309; }
.party-rank.mid { background: #eff6ff; color: #2563eb; }

.party-name {
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.party-num {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #2563eb;
  text-align: right;
}

.party-risk { justify-content: center; display: flex; }

.risk-num {
  display: inline-flex;
  width: 22px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-style: normal;
  font-size: 10px;
  font-weight: 700;
  background: #f0fdf4;
  color: #16a34a;
}

.risk-num.mid { background: #fff7ed; color: #f97316; }
.risk-num.high { background: #fef2f2; color: #ef4444; }
.risk-num.zero { background: #f1f5f9; color: #94a3b8; }

.party-health { display: flex; align-items: center; gap: 5px; }

.bar-bg {
  flex: 1;
  height: 5px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
  display: block;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.party-health em {
  font-style: normal;
  font-size: 10px;
  color: #64748b;
  min-width: 22px;
  text-align: right;
  font-weight: 700;
}

/* ====== A3 趋势 ====== */
.trend-chart {
  flex: 1;
  min-height: 0;
}

/* ====== B3 实时风险 ====== */
.risk-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.risk-stack::-webkit-scrollbar { width: 5px; }
.risk-stack::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

/* ── B3 实时财务风险 ── 完全对齐资金穿透实时风险 ── */
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
.risk-card.active { box-shadow: 0 6px 14px rgba(37,99,235,.12); border-color: #bfdbfe; }

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
  flex-shrink: 0; margin-left: auto;
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

/* ====== C3 AI建议 + 系统入口 ====== */
.ai-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.ai-list::-webkit-scrollbar { width: 4px; }
.ai-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.ai-item {
  display: flex;
  gap: 8px;
  padding: 7px 10px;
  background: linear-gradient(135deg, #eff6ff, #f5f3ff);
  border: 1px solid #dbeafe;
  border-radius: 8px;
}

.ai-item.high {
  border-left: 3px solid #ef4444;
}

.ai-item.medium {
  border-left: 3px solid #f97316;
}

.ai-avatar {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-body { flex: 1; min-width: 0; }

.ai-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.ai-meta strong {
  font-size: 11px;
  color: #2563eb;
}

.ai-pri {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
}

.ai-pri.high { background: #fef2f2; color: #ef4444; }
.ai-pri.medium { background: #fff7ed; color: #f97316; }

.ai-body p {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
  color: #334155;
}

.sys-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  flex: 0 0 auto;
}

.sys-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: all .18s ease;
}

.sys-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 12px rgba(37, 99, 235, .08);
}

.sys-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.sys-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.sys-meta strong {
  font-size: 10px;
  color: #0f172a;
  font-weight: 700;
}

.sys-meta em {
  font-style: normal;
  font-size: 9px;
  color: #94a3b8;
}

.sys-online { color: #16a34a !important; }

/* ====== 风险详情弹窗 ====== */
.mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, .12);
  backdrop-filter: blur(3px);
  z-index: 30;
}

.drawer {
  width: 720px;
  max-width: calc(100% - 48px);
  max-height: 86vh;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.drawer-head h3 {
  margin: 4px 0 0;
  font-size: 18px;
  color: #0f172a;
}

.drawer-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.close {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  font-size: 16px;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
}

.drawer-body::-webkit-scrollbar { width: 5px; }
.drawer-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

.drawer-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
}

.block-head {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 6px;
}

.drawer-block p {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #334155;
}

.cause-list {
  padding-left: 18px;
  margin: 0;
}

.cause-list li {
  font-size: 11px;
  line-height: 1.55;
  color: #334155;
  margin-bottom: 4px;
}

.penetration-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.pen-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 11px;
  color: #334155;
}

.pen-link em {
  font-style: normal;
  font-size: 10px;
  font-weight: 700;
  color: #2563eb;
}

.pen-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.pen-dot.blue { background: #2563eb; }
.pen-dot.purple { background: #7c3aed; }
.pen-dot.orange { background: #f97316; }
.pen-dot.green { background: #16a34a; }

.progress-line {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.prog-step {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
  position: relative;
  padding: 4px 10px;
  background: #fff;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
}

.prog-step i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.prog-step.done {
  color: #16a34a;
  border-color: rgba(34, 197, 94, .38);
  background: #f0fdf4;
}

.prog-step.done i { background: #16a34a; }

.prog-step.current {
  color: #2563eb;
  border-color: rgba(37, 99, 235, .42);
  background: #eff6ff;
  font-weight: 700;
}

.prog-step.current i { background: #2563eb; }

.fade-enter-active, .fade-leave-active { transition: all .22s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(6px); }

/* ====== B1 财务十大风险域（采购页风格 KPI + 条形图）====== */
.fb1-panel { display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
.fb1-panel .panel-head { margin-bottom: 6px; align-items: center; }
.fb1-filters { display: flex; gap: 3px; }
.fb1-filt {
  padding: 2px 8px; border-radius: 999px; border: 1px solid #E2E8F0; background: #F8FAFC;
  font-size: 10px; font-weight: 600; color: #64748B; cursor: pointer; transition: .15s; white-space: nowrap;
}
.fb1-filt:hover  { border-color: #BFDBFE; color: #2563EB; background: #EFF6FF; }
.fb1-filt.active { background: #2563EB; color: #FFF; border-color: #2563EB; }

.fb1-kpis { display: flex; gap: 5px; margin-bottom: 6px; flex-shrink: 0; }
.fb1-kpi-item {
  flex: 1; background: linear-gradient(135deg, #fafbfc, #fff);
  border: 1px solid #E8EDF5; border-radius: 7px;
  padding: 5px 6px; display: flex; flex-direction: column; align-items: center; gap: 1px;
}
.fb1-kpi-n { font-size: 9px; color: #94A3B8; font-weight: 600; }
.fb1-kpi-v { font-size: 18px; font-weight: 800; line-height: 1.1; font-family: 'JetBrains Mono', monospace; }
/* 关键：用绝对定位容器隔离 echarts canvas 与父级 flex 的双向尺寸反馈，避免无限震荡 */
.fb1-chart-box {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  position: relative;
  overflow: hidden;
}
.fb1-chart {
  position: absolute !important;
  top: 0; left: 0; right: 0; bottom: 0;
  width: auto !important;
  height: auto !important;
}

/* ====== B1 时空矩阵（保留以备复用，当前不挂载） ====== */
.matrix-panel .matrix-wrap {
  flex: 1; min-height: 0; position: relative;
  background: linear-gradient(180deg, #fff, #f8fafc);
  border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 6px; overflow: hidden;
}
.matrix-grid {
  display: grid;
  grid-template-columns: 72px repeat(4, 1fr);
  grid-auto-rows: minmax(0, 1fr);
  gap: 2px;
  height: 100%;
}
.m-cell {
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; border-radius: 4px; background: #fff;
  border: 1px solid #eef2f7;
  font-weight: 700;
  position: relative;
  transition: all .15s;
}
.m-cell.m-head {
  background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 800;
  letter-spacing: 0.2px;
}
.m-cell.m-row-head {
  background: #f8fafc; color: #0f172a; font-size: 10px;
  justify-content: flex-start; padding-left: 6px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.m-cell.m-col-head em { font-style: normal; font-size: 9px; margin-left: 3px; opacity: .8; }
.m-cell.m-col-head.red    { background: #fef2f2; color: #ef4444; }
.m-cell.m-col-head.orange { background: #fff7ed; color: #f97316; }
.m-cell.m-col-head.yellow { background: #fefce8; color: #ca8a04; }
.m-cell.m-col-head.blue   { background: #eff6ff; color: #2563eb; }
.m-cell.m-data { cursor: pointer; font-family: 'JetBrains Mono', monospace; color: #94a3b8; }
.m-cell.m-data:hover { transform: scale(1.04); z-index: 2; }
.m-cell.m-data.red    { background: linear-gradient(135deg, #fef2f2, #fff); color: #ef4444; }
.m-cell.m-data.orange { background: linear-gradient(135deg, #fff7ed, #fff); color: #f97316; }
.m-cell.m-data.yellow { background: linear-gradient(135deg, #fefce8, #fff); color: #ca8a04; }
.m-cell.m-data.low    { background: #fafbfc; color: #cbd5e1; cursor: default; }
.m-cell.m-data.hot { box-shadow: 0 0 0 1.5px rgba(239,68,68,.35) inset, 0 0 12px rgba(239,68,68,.18); }
.m-cell.m-data.sel {
  box-shadow: 0 0 0 2px #2563eb inset, 0 4px 14px rgba(37,99,235,.28);
  z-index: 3;
}
.m-health { font-size: 13px; font-weight: 900; }
.m-bubble {
  position: absolute; min-width: 168px; max-width: 220px;
  background: linear-gradient(135deg, rgba(15,23,42,.92), rgba(15,23,42,.78));
  color: #fff; border-radius: 8px; padding: 8px 10px; z-index: 10;
  backdrop-filter: blur(6px); box-shadow: 0 12px 32px rgba(15,23,42,.35);
  border: 1px solid rgba(59,130,246,.5);
  animation: bub-glow 1.8s ease-in-out infinite alternate;
}
@keyframes bub-glow {
  from { box-shadow: 0 12px 32px rgba(15,23,42,.35), 0 0 0 0 rgba(59,130,246,.45); }
  to   { box-shadow: 0 12px 32px rgba(15,23,42,.35), 0 0 0 4px rgba(59,130,246,0); }
}
.m-bub-head {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; padding-bottom: 5px; margin-bottom: 5px;
  border-bottom: 1px dashed rgba(255,255,255,.18);
}
.m-bub-head strong { color: #fde047; font-weight: 800; }
.m-bub-head span { color: #cbd5e1; font-size: 10px; }
.m-bub-close {
  margin-left: auto; cursor: pointer; font-style: normal;
  width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(255,255,255,.1); font-size: 12px;
}
.m-bub-body { display: flex; flex-direction: column; gap: 3px; max-height: 130px; overflow-y: auto; }
.m-bub-body::-webkit-scrollbar { width: 3px; }
.m-bub-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.2); border-radius: 999px; }
.m-bub-id {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-family: 'JetBrains Mono', monospace;
  padding: 3px 6px; background: rgba(255,255,255,.06); border-radius: 4px;
}
.m-bub-id .dot { width: 5px; height: 5px; border-radius: 50%; flex: 0 0 5px; }
.m-bub-id .dot.red { background: #f87171; }
.m-bub-id .dot.orange { background: #fb923c; }
.m-bub-id .dot.yellow { background: #facc15; }

/* ====== B2 3D 星轨 ====== */
.orbit-shell {
  flex: 1; min-height: 0; position: relative; overflow: hidden;
  border: 1px solid #e5e7eb; border-radius: 12px;
  background: #ffffff;
}
.orbit-shell::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(rgba(148,163,184,0.10) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.55;
  mask-image: radial-gradient(ellipse at center, #000 55%, transparent 95%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 55%, transparent 95%);
}
.orbit-svg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none;
}
.orbit-svg .ring {
  fill: none;
  stroke: rgba(37,99,235,0.18);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}
.orbit-svg .ring.r1 { stroke: rgba(37,99,235,0.35); stroke-width: 1.2; }
.orbit-svg .ring.r2 { stroke: rgba(34,197,94,0.28); }
.orbit-svg .ring.r3 { stroke: rgba(249,115,22,0.24); }
.orbit-svg .ring.r4 { stroke: rgba(239,68,68,0.20); }
.chain-flow { filter: drop-shadow(0 0 6px rgba(239,68,68,.55)); animation: dashFlow 1.4s linear infinite; }
@keyframes dashFlow { to { stroke-dashoffset: -40; } }

.orbit-node {
  position: absolute; transform: translate(-50%, -50%);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  background: rgba(255,255,255,.85);
  border: 1.5px solid rgba(37,99,235,0.35);
  box-shadow: 0 4px 12px rgba(15,23,42,.08), inset 0 0 8px rgba(37,99,235,.08);
  transition: opacity .35s, transform .35s, box-shadow .35s, border-color .35s;
  z-index: 3;
}
.orbit-node .on-core {
  width: 30%; height: 30%; border-radius: 50%;
  background: radial-gradient(circle, #60a5fa, #2563eb);
  box-shadow: 0 0 6px rgba(37,99,235,.6);
}
.orbit-node .on-label {
  position: absolute; left: 100%; margin-left: 4px;
  font-size: 8.5px; color: #475569; white-space: nowrap;
  pointer-events: none; font-weight: 700;
}
.orbit-node.l1 {
  border-color: #2563eb;
  background: radial-gradient(circle, #dbeafe, #93c5fd);
  box-shadow: 0 0 24px rgba(37,99,235,.45), inset 0 0 12px rgba(37,99,235,.25);
  z-index: 5;
}
.orbit-node.l1 .on-label { font-size: 10px; color: #1e40af; }
.orbit-node.l2 { border-color: #22c55e; }
.orbit-node.l2 .on-core { background: radial-gradient(circle, #86efac, #16a34a); box-shadow: 0 0 5px rgba(22,163,74,.5); }
.orbit-node.l3 { border-color: #f97316; }
.orbit-node.l3 .on-core { background: radial-gradient(circle, #fdba74, #ea580c); box-shadow: 0 0 5px rgba(234,88,12,.5); }
.orbit-node.l3 .on-label { font-size: 8px; }
.orbit-node.l4 { border-color: #ef4444; opacity: .85; }
.orbit-node.l4 .on-core { background: radial-gradient(circle, #fca5a5, #dc2626); box-shadow: 0 0 4px rgba(220,38,38,.55); }
.orbit-node.l4 .on-label { display: none; }

.orbit-shell.focused .orbit-node.dim { opacity: 0.08; filter: grayscale(.8); }
.orbit-shell.focused .orbit-svg .ring { opacity: 0.18; }

.orbit-node.hit { z-index: 6; transform: translate(-50%, -50%) scale(1.45); }
.orbit-node.hit .on-label { display: inline; font-size: 10px; color: #fff; padding: 1px 5px; border-radius: 3px; background: rgba(15,23,42,.85); }
.orbit-node.c-red {
  border-color: #dc2626; background: radial-gradient(circle, #fecaca, #ef4444);
  box-shadow: 0 0 22px rgba(239,68,68,.95), 0 0 0 4px rgba(239,68,68,.25);
  animation: pulseRed 1.1s ease-in-out infinite;
}
.orbit-node.c-yellow {
  border-color: #ca8a04; background: radial-gradient(circle, #fef08a, #facc15);
  box-shadow: 0 0 18px rgba(250,204,21,.85);
}
.orbit-node.c-green {
  border-color: #047857; background: radial-gradient(circle, #6ee7b7, #059669);
  box-shadow: 0 0 18px rgba(16,185,129,.7);
}
.orbit-node.c-blue {
  border-color: #1d4ed8; background: radial-gradient(circle, #bfdbfe, #2563eb);
  box-shadow: 0 0 28px rgba(37,99,235,.85);
}
@keyframes pulseRed {
  0%,100% { box-shadow: 0 0 22px rgba(239,68,68,.95), 0 0 0 4px rgba(239,68,68,.25); }
  50%     { box-shadow: 0 0 30px rgba(239,68,68,1),    0 0 0 9px rgba(239,68,68,0); }
}

.orbit-tip {
  position: absolute; left: 12px; bottom: 12px;
  background: linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,41,59,0.72));
  color: #fff; padding: 8px 12px; border-radius: 8px;
  font-size: 10px; font-weight: 500; max-width: 340px; line-height: 1.5;
  box-shadow: 0 10px 26px rgba(15,23,42,0.18);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(225,29,72,0.35);
}
.orbit-tip strong {
  display: block; font-size: 11px; margin-bottom: 3px;
  color: #fda4af; letter-spacing: 0.4px;
}

.orbit-reset {
  border: 1px solid #c7d2fe; background: rgba(255,255,255,0.7);
  color: #4f46e5; font-size: 9px; padding: 2px 8px;
  border-radius: 999px; cursor: pointer; font-weight: 600;
  transition: all .15s; backdrop-filter: blur(4px);
}
.orbit-reset:hover { background: #eef2ff; border-color: #a5b4fc; }

.lg-dot.blue { background: #3B82F6; }

/* ====== B3 pinned 卡片 ====== */
.risk-card.pinned {
  background: linear-gradient(135deg, #fef2f2, #fff);
  border-color: #fca5a5;
  box-shadow: 0 0 0 1.5px rgba(239,68,68,.25) inset, 0 6px 14px rgba(239,68,68,.12);
}
.risk-meta-extra {
  display: flex; gap: 8px; margin-top: 2px;
  font-size: 9px; color: #94a3b8;
}
.risk-meta-extra i { font-style: normal; }
.risk-meta-extra b { color: #ef4444; font-family: 'JetBrains Mono', monospace; }



/* =================== C1 全局穿透视图（3 层钻取）=================== */
.drill-panel { overflow: hidden; min-height: 0; display: flex; flex-direction: column; }

/* 顶部宏观数据条 */
.drill-macro {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;
  margin-bottom: 8px; flex: 0 0 auto;
}
.dm-cell {
  display: flex; flex-direction: column; align-items: center;
  padding: 5px 4px; border-radius: 7px;
  background: linear-gradient(135deg, #f8fafc, #fff);
  border: 1px solid #e2e8f0;
}
.dm-cell span { font-size: 9px; color: #94a3b8; font-weight: 600; margin-bottom: 1px; }
.dm-cell strong {
  font-size: 15px; font-weight: 800; color: #0f172a;
  font-family: 'JetBrains Mono', monospace; line-height: 1;
}
.dm-cell strong em { font-size: 9px; font-style: normal; font-weight: 600; color: #94a3b8; margin-left: 1px; }

/* 钻取域列表 */
.drill-list {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 5px;
  scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
  padding-right: 2px;
}
.drill-list::-webkit-scrollbar { width: 4px; }
.drill-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

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
  text-align: left;
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

/* L1 风险列表 */
.dd-risks {
  padding: 6px 10px 8px 36px;
  background: linear-gradient(180deg, #fafbfc, #fff);
  border-top: 1px dashed #e2e8f0;
  display: flex; flex-direction: column; gap: 6px;
}
.dd-risk {
  background: #fff;
  border: 1px solid #e2e8f0; border-radius: 6px;
  padding: 6px 8px;
  display: flex; flex-direction: column; gap: 4px;
}
.dd-risk.open { border-color: #93c5fd; box-shadow: 0 4px 12px rgba(37,99,235,.1); }
.dr-row {
  display: flex; align-items: flex-start; gap: 6px;
}
.dr-bullet {
  width: 6px; height: 6px; border-radius: 50%; margin-top: 5px;
  flex: 0 0 6px;
}
.dr-bullet.red    { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,.5); }
.dr-bullet.orange { background: #f97316; box-shadow: 0 0 6px rgba(249,115,22,.5); }
.dr-text { flex: 1; min-width: 0; }
.dr-text strong { display: block; font-size: 11px; font-weight: 700; color: #0f172a; }
.dr-text p { margin: 1px 0 0; font-size: 10px; color: #64748b; line-height: 1.4; }
.dr-amt {
  font-size: 12px; font-weight: 800; color: #b91c1c;
  font-family: 'JetBrains Mono', monospace; flex: 0 0 auto;
}

.dr-actions {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
  padding-top: 4px; border-top: 1px dashed #f1f5f9;
}
.dr-actions-label { font-size: 9.5px; color: #94a3b8; font-weight: 600; }
.dr-action {
  padding: 2px 7px; border-radius: 999px;
  border: 1px solid #c7d2fe; background: #eef2ff; color: #4338ca;
  font-size: 9.5px; font-weight: 700; cursor: pointer; transition: .12s;
}
.dr-action:hover { background: #c7d2fe; }
.dr-detail-btn {
  margin-left: auto; padding: 2px 8px; border-radius: 5px;
  border: 1px solid #e2e8f0; background: #fff; color: #475569;
  font-size: 9.5px; font-weight: 700; cursor: pointer; transition: .12s;
}
.dr-detail-btn:hover { border-color: #bfdbfe; color: #2563eb; background: #eff6ff; }
.dr-detail-btn.open { background: #2563eb; color: #fff; border-color: #2563eb; }

/* L2 流水级细节表 */
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
.dl-row {
  color: #334155; border-bottom: 1px dashed #f1f5f9;
  animation: leafIn .3s ease both;
  animation-delay: calc(var(--i, 0) * 0.05s + 0.05s);
}
.dl-row:last-child { border-bottom: none; }
@keyframes leafIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
.dl-no    { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #4338ca; }
.dl-payee { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.dl-amt   { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #b91c1c; text-align: right; }
.dl-time  { color: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 9px; }
.dl-evi   { color: #c2410c; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 手风琴动画（共用） */
.dd-acc-enter-active { transition: all .26s cubic-bezier(.34,1.2,.64,1); overflow: hidden; }
.dd-acc-leave-active { transition: all .2s ease; overflow: hidden; }
.dd-acc-enter-from, .dd-acc-leave-to { opacity: 0; max-height: 0; }
.dd-acc-enter-to, .dd-acc-leave-from { opacity: 1; max-height: 600px; }
.route-card {
  background: linear-gradient(135deg, #fafbfc, #fff);
  border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 9px 11px; display: flex; flex-direction: column; gap: 7px;
  position: relative;
}
.route-card.route-fund { border-left: 3px solid #4f46e5; }
.route-card.route-duty { border-left: 3px solid #0d9488; }
.route-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.route-head strong {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; color: #0f172a; font-weight: 800;
}
.route-head .muted { font-size: 10px; }
.r-tag {
  display: inline-flex; width: 18px; height: 18px; border-radius: 5px;
  align-items: center; justify-content: center; font-style: normal; font-size: 11px;
}
.r-tag.fund { background: #eef2ff; }
.r-tag.duty { background: #ecfdf5; }

.route-chain { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.r-node, .r-node-wrap > .r-node {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 9px; border-radius: 6px; background: #f8fafc;
  border: 1px solid #e2e8f0; font-size: 10.5px; font-weight: 600; color: #334155;
  cursor: default; line-height: 1.2; white-space: nowrap;
}
.r-node em { font-style: normal; font-size: 10px; color: #64748b; font-weight: 700; }
.r-node.warn { background: linear-gradient(135deg, #fff1f2, #fff); border-color: #fecdd3; color: #9f1239; }
.r-node.warn em { color: #be123c; }
.r-node.ok   { background: linear-gradient(135deg, #ecfdf5, #fff); border-color: #a7f3d0; color: #047857; }
.r-node.ok em { color: #047857; }
.r-node.hot {
  cursor: pointer;
  background: linear-gradient(135deg, #fef2f2, #fff);
  border-color: #fca5a5; color: #b91c1c;
  box-shadow: 0 0 0 0 rgba(239,68,68,.0);
  transition: all .2s;
}
.r-node.hot:hover, .r-node.hot.open {
  background: linear-gradient(135deg, #fee2e2, #fff5f5);
  box-shadow: 0 4px 12px rgba(239,68,68,.18);
}
.r-node.hot em { color: #b91c1c; }
.r-node-wrap { position: relative; display: inline-flex; }
.r-node-wrap .r-node { cursor: pointer; }
.r-caret { font-style: normal; font-size: 9px; margin-left: 2px; transition: transform .2s; }
.r-node.open .r-caret { transform: rotate(180deg); }

.r-flow {
  width: 14px; height: 1px; background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
  position: relative;
}
.r-flow::after {
  content: ''; position: absolute; right: -3px; top: -2.5px;
  width: 0; height: 0; border-left: 5px solid #cbd5e1;
  border-top: 3px solid transparent; border-bottom: 3px solid transparent;
}

/* 百叶窗下钻表 */
.slat-table {
  display: flex; flex-direction: column; gap: 2px;
  border-radius: 6px; overflow: hidden;
  background: #fff; border: 1px solid #fecaca;
  box-shadow: inset 0 1px 0 rgba(239,68,68,.15);
}
.slat-row {
  display: grid; grid-template-columns: 88px 1fr 70px 110px;
  gap: 8px; align-items: center; padding: 5px 9px;
  font-size: 10.5px; color: #334155;
  background: #fff;
  animation: slatIn .35s ease both;
  animation-delay: calc(var(--i, 0) * 0.06s + 0.05s);
}
@keyframes slatIn {
  from { opacity: 0; transform: translateY(-10px) scaleY(.5); transform-origin: top; }
  to   { opacity: 1; transform: none; }
}
.slat-row.slat-head {
  background: linear-gradient(135deg, #fef2f2, #fff);
  color: #9f1239; font-weight: 700; font-size: 10px;
  animation: none;
}
.slat-no {
  font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 10px;
  padding: 1px 5px; border-radius: 3px;
}
.slat-no.red    { background: #fef2f2; color: #b91c1c; }
.slat-no.orange { background: #fff7ed; color: #c2410c; }
.slat-entity { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.slat-amt { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #b91c1c; text-align: right; }
.slat-tag {
  font-size: 9.5px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
  text-align: center;
}
.slat-tag.red    { background: #fef2f2; color: #b91c1c; }
.slat-tag.orange { background: #fff7ed; color: #c2410c; }

.slat-enter-active { transition: all .3s cubic-bezier(.34,1.3,.64,1); overflow: hidden; }
.slat-leave-active { transition: all .22s ease; overflow: hidden; }
.slat-enter-from, .slat-leave-to { opacity: 0; max-height: 0; transform: translateY(-6px); }
.slat-enter-to, .slat-leave-from { opacity: 1; max-height: 240px; }

/* 级联选择浮层 */
.cas-pop {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 8;
  min-width: 240px; padding: 8px 10px;
  background: linear-gradient(135deg, rgba(255,255,255,.98), rgba(248,250,252,.96));
  border: 1px solid #c7d2fe; border-radius: 8px;
  box-shadow: 0 14px 32px rgba(15,23,42,.18);
  backdrop-filter: blur(6px);
}
.cas-title { font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 5px; }
.cas-opt {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 6px; border-radius: 5px; cursor: pointer;
  font-size: 11px; color: #0f172a;
}
.cas-opt:hover { background: #eef2ff; }
.cas-opt input { accent-color: #4f46e5; }
.cas-opt em { margin-left: auto; font-style: normal; font-weight: 700; font-size: 10px; }
.cas-opt em.red    { color: #b91c1c; }
.cas-opt em.orange { color: #c2410c; }

.cas-risk {
  margin-top: 6px; padding: 6px 8px;
  background: linear-gradient(135deg, #fef2f2, #fff7ed);
  border: 1px solid #fecdd3; border-radius: 6px;
  display: flex; gap: 6px; align-items: flex-start;
  animation: tipPulse 1.6s ease-in-out infinite alternate;
}
@keyframes tipPulse {
  from { box-shadow: 0 0 0 0 rgba(239,68,68,.0); }
  to   { box-shadow: 0 0 0 3px rgba(239,68,68,.12); }
}
.cas-risk i { font-style: normal; color: #b91c1c; font-size: 13px; line-height: 1; }
.cas-risk strong { font-size: 10px; color: #9f1239; display: block; }
.cas-risk p { margin: 2px 0 0; font-size: 10px; line-height: 1.5; color: #475569; }

.cas-enter-active, .cas-leave-active { transition: all .2s ease; }
.cas-enter-from, .cas-leave-to { opacity: 0; transform: translateY(-4px) scale(.96); }
.riskfade-enter-active, .riskfade-leave-active { transition: all .25s ease; }
.riskfade-enter-from, .riskfade-leave-to { opacity: 0; transform: translateY(-4px); }

/* =================== C2 财务热力图 + TOP10（采购页同款 4:2 布局）=================== */
.fc2-panel { display: flex; flex-direction: column; }
.fc2-panel .panel-head { margin-bottom: 6px; align-items: center; }
.fc2-body { flex: 1; min-height: 0; display: flex; gap: 8px; }
.fc2-heatmap { flex: 4; min-height: 0; min-width: 0; }
.fc2-side { flex: 2; min-width: 0; display: flex; flex-direction: column; gap: 4px; min-height: 0; }
.fc2-side-title {
  font-size: 10px; font-weight: 700; color: #334155;
  padding-bottom: 4px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
}
.fc2-side-rows {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 3px;
  scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
}
.fc2-side-rows::-webkit-scrollbar { width: 4px; }
.fc2-side-rows::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }

.fc2-row {
  border-radius: 6px;
  border: 1px solid #f1f5f9;
  background: #fafbfc;
  border-left: 3px solid transparent;
  transition: 0.12s;
}
.fc2-row:hover { background: #f8fafc; }
.fc2-row.fc2-alert {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fff8f8, #fff);
}
.fc2-row.open {
  border-color: #fca5a5;
  box-shadow: 0 4px 12px rgba(239,68,68,.12);
}
.fc2-row-btn {
  width: 100%; display: flex; align-items: flex-start; gap: 5px;
  padding: 5px 6px; background: none; border: none; cursor: pointer;
  text-align: left;
}
.fc2-rank {
  font-size: 12px; font-weight: 800; width: 14px; flex-shrink: 0;
  text-align: center; margin-top: 1px; color: #64748b;
}
.fc2-rank.top { color: #d97706; }
.fc2-rank.mid { color: #64748b; }
.fc2-info { flex: 1; min-width: 0; }
.fc2-name {
  font-size: 10px; font-weight: 700; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: flex; align-items: center; gap: 3px;
}
.fc2-dot { font-style: normal; color: #ef4444; font-size: 9px; flex: 0 0 auto; }
.fc2-meta {
  font-size: 8.5px; color: #94a3b8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fc2-meta b {
  font-weight: 700; color: #1e40af;
  font-family: 'JetBrains Mono', monospace; margin: 0 1px;
}
.fc2-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
  flex-shrink: 0;
}
.fc2-risk {
  font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 3px;
}
.fc2-risk.h { background: #fee2e2; color: #dc2626; }
.fc2-risk.m { background: #ffedd5; color: #ea580c; }
.fc2-risk.n { color: #94a3b8; background: transparent; }
.fc2-health { font-size: 11px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }

/* （原 heat-grid 手写网格 CSS 已弃用，但保留 .matrix2-panel/.heat-* 以防复用） */
.matrix2-panel { gap: 0; }
.heat-wrap { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.heat-grid {
  display: grid;
  grid-auto-rows: minmax(0, 22px);
  gap: 2px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 4px;
}
.h-cell {
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
}
.h-corner { background: transparent; }
.h-col-head, .h-row-head {
  font-size: 9.5px; color: #475569; font-weight: 700;
  background: #f8fafc; padding: 2px 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.h-row-head { justify-content: flex-start; padding-left: 6px; }
.h-data { transition: transform .15s, box-shadow .15s; cursor: pointer; }
.h-data:hover { transform: scale(1.08); z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,.15); }
.h-data.blink {
  position: relative;
  box-shadow: inset 0 0 0 1.5px #facc15;
  animation: blinkYellow 1.3s ease-in-out infinite;
}
@keyframes blinkYellow {
  0%,100% { box-shadow: inset 0 0 0 1.5px #facc15, 0 0 0 0 rgba(250,204,21,0); }
  50%     { box-shadow: inset 0 0 0 1.5px #facc15, 0 0 0 4px rgba(250,204,21,.35); }
}
.heat-legend {
  display: flex; align-items: center; gap: 4px;
  font-size: 9px; color: #94a3b8; justify-content: flex-end;
}
.heat-bar {
  display: inline-block; width: 80px; height: 5px; border-radius: 999px;
  background: linear-gradient(90deg, rgba(99,102,241,.1), rgba(217,119,6,.5), rgba(180,83,9,.95));
}

.party-divider {
  display: flex; align-items: center; gap: 6px; margin: 4px 0 4px;
  font-size: 10px; color: #475569; font-weight: 700;
}
.party-divider i { flex: 1; height: 1px; background: linear-gradient(90deg, #cbd5e1, transparent); }

.party-table-compact {
  display: flex; flex-direction: column; gap: 1px;
  flex: 1; min-height: 0; overflow-y: auto;
}
.party-table-compact::-webkit-scrollbar { width: 4px; }
.party-table-compact::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.party-row-c { background: #fff; border-radius: 6px; }
.party-row-c.critical .party-cell-row {
  background: linear-gradient(135deg, rgba(239,68,68,.05), #fff);
  border-color: #fecaca;
}
.party-head-c {
  background: #f8fafc !important; border: 1px solid #e2e8f0;
  display: grid; grid-template-columns: 30px 1.6fr 60px 60px 38px 1fr;
  gap: 6px; padding: 3px 8px;
  font-size: 9.5px; font-weight: 700; color: #64748b;
}
.party-cell-row {
  width: 100%; display: grid; grid-template-columns: 30px 1.6fr 60px 60px 38px 1fr;
  gap: 6px; align-items: center; padding: 3px 8px;
  border: 1px solid #e2e8f0; border-radius: 6px; background: #fff;
  text-align: left; cursor: pointer; font-size: 10.5px; color: #334155;
  transition: all .15s;
}
.party-cell-row:hover { border-color: #bfdbfe; }
.party-row-c.open .party-cell-row {
  border-color: #fca5a5;
  box-shadow: 0 4px 12px rgba(239,68,68,.15);
}
.party-name {
  font-weight: 700; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: inline-flex; align-items: center; gap: 4px;
}
.red-dot { font-style: normal; font-size: 9px; flex: 0 0 auto; }

/* 极简名片 */
.party-card {
  margin-top: 4px; padding: 8px 10px;
  background: linear-gradient(135deg, #fef2f2, #fff7ed);
  border: 1px solid #fecdd3; border-radius: 8px;
  box-shadow: 0 10px 24px rgba(239,68,68,.14);
}
.pc-head {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  margin-bottom: 6px;
  border-bottom: 1px dashed #fecaca; padding-bottom: 5px;
}
.pc-head strong { font-size: 11px; color: #9f1239; }
.pc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 8px; }
.pc-kv {
  display: flex; flex-direction: column; gap: 1px;
  padding: 3px 6px; background: rgba(255,255,255,.7); border-radius: 4px;
}
.pc-kv span { font-size: 9px; color: #64748b; }
.pc-kv strong { font-size: 10.5px; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
.pc-kv strong.warn { color: #b91c1c; }

.card-pop-enter-active { transition: all .28s cubic-bezier(.34,1.3,.64,1); overflow: hidden; }
.card-pop-leave-active { transition: all .2s ease; overflow: hidden; }
.card-pop-enter-from, .card-pop-leave-to { opacity: 0; max-height: 0; transform: translateY(-4px); }
.card-pop-enter-to, .card-pop-leave-from { opacity: 1; max-height: 200px; }

/* =================== C3 策略墙 + 系统入口 =================== */
.ai-panel { gap: 0; overflow: hidden; }
.strategy-wall {
  height: 92px; overflow: hidden; position: relative;
  margin-bottom: 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0f4ff, #fefce8);
  border: 1px solid #e2e8f0;
}
.strategy-wall::before, .strategy-wall::after {
  content: ''; position: absolute; left: 0; right: 0; height: 16px; z-index: 2; pointer-events: none;
}
.strategy-wall::before { top: 0; background: linear-gradient(180deg, #f0f4ff, transparent); }
.strategy-wall::after  { bottom: 0; background: linear-gradient(0deg, #fefce8, transparent); }

.sw-track {
  display: flex; flex-direction: column; gap: 6px;
  padding: 6px 10px;
  animation: swScroll 18s linear infinite;
}
.strategy-wall:hover .sw-track { animation-play-state: paused; }
@keyframes swScroll {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}
.sw-item {
  background: rgba(255,255,255,.85);
  border-left: 3px solid #4f46e5;
  border-radius: 6px;
  padding: 5px 8px;
  flex: 0 0 auto;
}
.sw-item.red    { border-left-color: #e11d48; background: linear-gradient(90deg, rgba(254,242,242,.95), rgba(255,255,255,.85)); }
.sw-item.orange { border-left-color: #b45309; background: linear-gradient(90deg, rgba(255,247,237,.95), rgba(255,255,255,.85)); }
.sw-item.blue   { border-left-color: #4f46e5; background: linear-gradient(90deg, rgba(238,242,255,.95), rgba(255,255,255,.85)); }
.sw-head { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
.sw-tag {
  font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;
}
.sw-tag.red    { background: #fee2e2; color: #9f1239; }
.sw-tag.orange { background: #ffedd5; color: #c2410c; }
.sw-tag.blue   { background: #e0e7ff; color: #4338ca; }
.sw-item strong { font-size: 11px; color: #0f172a; font-weight: 800; }
.sw-item p { margin: 0; font-size: 10px; line-height: 1.45; color: #475569; }

/* 2×2 portal */
.portal-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  flex: 0 0 auto;
}
.portal-card {
  position: relative; overflow: hidden;
  border: 1px solid #e2e8f0; border-radius: 10px;
  background: linear-gradient(135deg, #fff, #f8fafc);
  padding: 8px 10px; cursor: pointer;
  display: flex; flex-direction: column; gap: 4px;
  transition: all .2s;
}
.portal-card:hover { border-color: #c7d2fe; box-shadow: 0 8px 18px rgba(79,70,229,.12); transform: translateY(-1px); }
.portal-card.spot {
  border-color: #67e8f9;
  background: linear-gradient(135deg, #ecfeff, #fff);
  box-shadow: 0 0 0 1.5px rgba(8,145,178,.2) inset;
}
.portal-card.spot::after {
  content: ''; position: absolute; top: 0; left: -120%; width: 60%; height: 100%;
  background: linear-gradient(110deg, transparent, rgba(34,211,238,.35), transparent);
  animation: flowShine 2.6s ease-in-out infinite;
}
@keyframes flowShine { 0% { left: -120%; } 100% { left: 160%; } }
.pc-top { display: flex; align-items: center; justify-content: space-between; }
.portal-ico {
  width: 24px; height: 24px; border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800;
}
.portal-status {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 9px; font-weight: 700;
  padding: 1px 5px; border-radius: 999px;
  background: #f0fdf4; color: #047857;
}
.portal-status.warn { background: #fff7ed; color: #c2410c; animation: warnPulse 1.4s ease-in-out infinite alternate; }
@keyframes warnPulse {
  from { box-shadow: 0 0 0 0 rgba(194,65,12,0); }
  to   { box-shadow: 0 0 0 3px rgba(194,65,12,.18); }
}
.ps-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.portal-body { display: flex; flex-direction: column; }
.portal-body strong { font-size: 11px; color: #0f172a; font-weight: 800; }
.portal-body span { font-size: 9.5px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

/* =================== 资金锁止指令控制台 =================== */
.lock-mask {
  position: absolute; inset: 0; z-index: 9999;
  background: rgba(15,23,42,.55);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
}
.lock-console {
  width: 580px; max-width: calc(100% - 64px);
  background: linear-gradient(135deg, rgba(255,255,255,.94), rgba(248,250,252,.92));
  border: 1px solid rgba(8,145,178,.45);
  border-radius: 14px;
  box-shadow: 0 30px 80px rgba(15,23,42,.4), 0 0 0 1px rgba(255,255,255,.5) inset;
  backdrop-filter: blur(12px);
  position: relative; overflow: hidden;
}
.lock-console::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse at top, rgba(8,145,178,.16), transparent 60%),
    radial-gradient(ellipse at bottom, rgba(239,68,68,.08), transparent 60%);
}
.lock-head {
  position: relative; z-index: 1;
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 14px 18px 12px; border-bottom: 1px solid rgba(8,145,178,.18);
}
.lock-title { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.4px; }
.lock-sub { font-size: 11px; color: #0891b2; margin-top: 2px; font-weight: 600; }
.lock-body {
  position: relative; z-index: 1;
  padding: 14px 18px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.lock-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ls-cell {
  padding: 8px 10px; background: rgba(255,255,255,.7);
  border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;
}
.ls-cell span { font-size: 10px; color: #64748b; display: block; margin-bottom: 3px; }
.ls-cell strong { font-size: 16px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
.ls-cell strong.warn { color: #b91c1c; }
.ls-cell strong.ok { color: #0d9488; }
.ls-cell strong em { font-size: 10px; font-style: normal; font-weight: 600; color: #64748b; margin-left: 2px; }

.lock-row { display: flex; flex-direction: column; gap: 5px; }
.lock-label { font-size: 11px; font-weight: 700; color: #475569; }
.lock-chain { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.lock-chain span {
  padding: 4px 8px; background: #f1f5f9; border-radius: 5px;
  font-size: 10.5px; color: #334155; font-weight: 600;
}
.lock-chain span.warn { background: #fee2e2; color: #b91c1c; }
.lock-chain i {
  width: 10px; height: 1px;
  background: linear-gradient(90deg, transparent, #94a3b8, transparent);
  position: relative;
}
.lock-chain i::after {
  content: ''; position: absolute; right: -3px; top: -2.5px;
  width: 0; height: 0; border-left: 5px solid #94a3b8;
  border-top: 3px solid transparent; border-bottom: 3px solid transparent;
}

.lock-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.lock-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  padding: 9px 8px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 700;
  border: 1px solid transparent; transition: all .15s;
}
.lock-btn i { font-style: normal; font-size: 13px; }
.lock-btn.danger {
  background: linear-gradient(135deg, #dc2626, #991b1b); color: #fff;
  box-shadow: 0 6px 16px rgba(220,38,38,.32);
}
.lock-btn.danger:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(220,38,38,.4); }
.lock-btn.safe {
  background: #fff; color: #047857; border-color: #6ee7b7;
}
.lock-btn.safe:hover { background: #ecfdf5; }
.lock-btn.neutral {
  background: #fff; color: #4338ca; border-color: #c7d2fe;
}
.lock-btn.neutral:hover { background: #eef2ff; }

.lock-log {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 600;
  background: #f8fafc; border-left: 3px solid #94a3b8; color: #334155;
}
.lock-log.red    { background: #fef2f2; border-left-color: #dc2626; color: #9f1239; }
.lock-log.green  { background: #ecfdf5; border-left-color: #0d9488; color: #047857; }
.lock-log.orange { background: #fff7ed; border-left-color: #c2410c; color: #c2410c; }
.lock-log i { font-style: normal; font-size: 8px; }
.lock-log .muted { margin-left: auto; font-size: 10px; }

.lock-enter-active, .lock-leave-active { transition: all .26s cubic-bezier(.34,1.2,.64,1); }
.lock-enter-from, .lock-leave-to { opacity: 0; }
.lock-enter-from .lock-console, .lock-leave-to .lock-console {
  transform: scale(.88) translateY(20px); opacity: 0;
}
.lock-enter-active .lock-console, .lock-leave-active .lock-console {
  transition: all .32s cubic-bezier(.34,1.2,.64,1);
}
.logfade-enter-active, .logfade-leave-active { transition: all .24s ease; }
.logfade-enter-from, .logfade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ===== 风险事项详情报告视图（与 Contract.vue 同款） ===== */
.mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }

.rd-view { position: fixed; top: 44px; left: 0; right: 0; bottom: 0; background: #f8fafc; z-index: 50; display: flex; flex-direction: column; gap: 8px; padding: 10px 16px 12px; overflow: hidden; }
.rd-topbar { flex-shrink: 0; }

.cd-topbar { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; flex-shrink:0; }
.cd-topbar-left { display:flex; align-items:center; gap:10px; }
.cd-id { font-size:14px; font-weight:800; color:#2563eb; font-family:'JetBrains Mono', monospace; }
.cd-status-pill { font-size:11px; font-weight:600; padding:2px 10px; border-radius:999px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.cd-topbar-right { display:flex; align-items:center; gap:10px; font-size:11px; color:#94a3b8; }

.risk-pill { display:inline-flex; align-items:center; padding:2px 7px; border-radius:999px; font-size:10px; font-weight:600; }
.rp-high, .rp-critical { background:#fef2f2; color:#ef4444; }
.rp-medium { background:#fff7ed; color:#f97316; }
.rp-watch { background:#fefce8; color:#a16207; }
.rp-normal, .rp-low { background:#f0fdf4; color:#16a34a; }

.cd-contract-link { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; cursor:pointer; font-family:'JetBrains Mono', monospace; transition:.14s; }
.cd-contract-link:hover { background:#2563eb; color:#fff; border-color:#2563eb; }

.rd-content { flex:1; min-height:0; display:grid; grid-template-columns:280px minmax(0, 1fr); gap:10px; }
.rd-sidebar { display:flex; flex-direction:column; gap:8px; min-height:0; overflow-y:auto; }

.rd-hero-card { padding:14px 16px; display:flex; flex-direction:column; gap:8px; position:relative; overflow:hidden; border:none; background:#fff; border-radius:10px; }
.rd-hero-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:5px; }
.rdh-high, .rdh-critical { background:linear-gradient(135deg, #fef2f2 0%, #ffffff 80%); border:1px solid #fecaca; }
.rdh-high::before, .rdh-critical::before { background:#ef4444; }
.rdh-medium { background:linear-gradient(135deg, #fff7ed 0%, #ffffff 80%); border:1px solid #fed7aa; }
.rdh-medium::before { background:#f97316; }
.rdh-watch { background:linear-gradient(135deg, #fefce8 0%, #ffffff 80%); border:1px solid #fde68a; }
.rdh-watch::before { background:#eab308; }
.rdh-normal, .rdh-low { background:linear-gradient(135deg, #f0fdf4 0%, #ffffff 80%); border:1px solid #bbf7d0; }
.rdh-normal::before, .rdh-low::before { background:#16a34a; }

.rdh-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; align-self:flex-start; background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.05); }
.rdh-badge-icon { font-size:14px; }
.rdh-badge-text { font-size:12px; font-weight:800; }
.rdh-high .rdh-badge-text, .rdh-critical .rdh-badge-text { color:#dc2626; }
.rdh-medium .rdh-badge-text { color:#c2410c; }
.rdh-watch .rdh-badge-text { color:#a16207; }
.rdh-normal .rdh-badge-text, .rdh-low .rdh-badge-text { color:#15803d; }

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

/* ============ 完整报告样式 ============ */
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
.rhc-value.risk-badge.high { background: #dc2626; }
.rhc-value.risk-badge.medium { background: #d97706; }
.rhc-value.risk-badge.low { background: #22c55e; }

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
