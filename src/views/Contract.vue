<template>
  <div class="ct-scene">

    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="toastVisible" class="ct-toast" :class="`toast-${toastType}`">
        <span class="toast-icon">{{ toastType === 'warn' ? '⚠' : '✓' }}</span>
        {{ toastText }}
      </div>
    </transition>

    <!-- ══════════ 穿透视图 ══════════ -->
    <template v-if="viewMode === 'penetration'">
      <div class="ct-main">
        <section class="kpi-row">
          <article v-for="kpi in kpiCards" :key="kpi.label" class="card kpi-card" :style="{ '--c': kpi.color, '--bg': kpi.bg }">
            <div class="kc-head">
              <span class="kc-label">{{ kpi.label }}</span>
              <span class="kc-pill" :style="{ background: kpi.pillBg, color: kpi.color }">{{ kpi.badge }}</span>
            </div>
            <div class="kc-value" :style="{ color: kpi.color }">{{ kpi.value }}<small>{{ kpi.unit }}</small></div>
            <div class="kc-sub">{{ kpi.sub }}</div>
          </article>
        </section>

        <div class="ct-body">
          <!-- 左：机构树 -->
          <aside class="ct-left">
            <div class="card side-panel tree-panel">
              <div class="sp-head">
                <h3>合同智联仓库</h3>
                <span class="pill blue">{{ companyTree.length }} 集团</span>
              </div>
              <div class="company-tree micro-scroll">
                <button class="ctree-row ctree-all-row" :class="{ 'ctree-selected': selectedOrgId === null }" type="button" @click="selectOrg(null)">
                  <span class="ctree-ico">🗂</span>
                  <span class="ctree-name">集团公司</span>
                  <span class="ctree-cnt">{{ contracts.length }} 份</span>
                </button>
                <div v-for="grp in companyTree" :key="grp.id" class="ctree-group">
                  <button class="ctree-row ctree-group-row" :class="{ 'ctree-selected': selectedOrgId === grp.id }" type="button" @click="selectOrg(grp.id); toggleNode(grp.id)">
                    <span class="ctree-arrow" :class="{ open: expandedNodes.has(grp.id) }">›</span>
                    <span class="ctree-ico">🏢</span>
                    <span class="ctree-name">{{ grp.name }}</span>
                    <span class="ctree-cnt">{{ grp.totalContracts }} 份</span>
                  </button>
                  <div v-show="expandedNodes.has(grp.id)" class="ctree-children">
                    <button v-for="br in grp.children" :key="br.id" class="ctree-row ctree-branch-row" :class="{ 'ctree-selected': selectedOrgId === br.id }" type="button" @click="selectOrg(br.id)">
                      <span class="ctree-ico" style="margin-left:12px">🏬</span>
                      <span class="ctree-name">{{ br.name }}</span>
                      <span class="ctree-cnt">{{ br.contracts.length }} 份</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- 中：合同列表 -->
          <main class="ct-center">
            <div class="card contract-list-panel">
              <div class="cl-filter-bar">
                <div class="cl-filter-tabs">
                  <button v-for="f in riskFilters" :key="f.value" type="button" class="clf-tab" :class="{ active: riskFilter === f.value }" @click="riskFilter = f.value">{{ f.label }}<span v-if="f.count !== undefined" class="clf-count">{{ f.count }}</span></button>
                </div>
                <span class="cl-total-tip">共 {{ filteredContracts.length }} 份</span>
              </div>
              <div class="cl-list micro-scroll">
                <div v-for="c in filteredContracts" :key="c.id" class="cl-card" :class="[`cl-${c.risk}`, { 'cl-active': activeContractId === c.id }]" @click="selectContract(c.id)">
                  <!-- 顶部三栏 -->
                  <div class="clc-top-row">
                    <!-- 左：核心信息 -->
                    <div class="clc-core-zone">
                      <div class="ccz-title">
                        <span class="ccz-name">{{ c.name }}</span>
                        <span class="ccz-id">（{{ c.id }}）</span>
                      </div>
                      <div class="ccz-parties">
                        <span><em>甲方：</em>{{ getCompanyName(c.companyId) }}</span>
                        <span class="ccz-sep">·</span>
                        <span><em>乙方：</em>{{ c.supplier }}</span>
                      </div>
                      <div class="ccz-sign">
                        <span class="ccz-sign-icon">📅</span>
                        <span><em>签订时间：</em>{{ c.signDate }}</span>
                      </div>
                    </div>
                    <!-- 中：风险标识（含分级明细） -->
                    <div class="clc-risk-zone" :class="`crz-${c.risk}`">
                      <div class="crz-top">
                        <span class="crz-icon">{{ riskIconMap[c.risk] }}</span>
                        <strong class="crz-level">{{ riskLabelMap[c.risk] }}</strong>
                      </div>
                      <div v-if="c.riskCount" class="crz-breakdown">
                        <span v-if="riskBreakdown(c.id).high" class="crz-chip crz-chip-high">{{ riskBreakdown(c.id).high }} 高</span>
                        <span v-if="riskBreakdown(c.id).medium" class="crz-chip crz-chip-medium">{{ riskBreakdown(c.id).medium }} 中</span>
                        <span v-if="riskBreakdown(c.id).watch" class="crz-chip crz-chip-watch">{{ riskBreakdown(c.id).watch }} 低</span>
                      </div>
                      <span v-else class="crz-no-risk">无风险项</span>
                    </div>
                    <!-- 右：金额 + 状态 + 操作 -->
                    <div class="clc-action-zone" @click.stop>
                      <div class="caz-meta">
                        <strong class="caz-amount" :style="{ color: riskColor[c.risk] }">{{ c.amount }}</strong>
                        <span class="caz-status" :class="`csp-${c.risk}`">{{ c.status }}</span>
                      </div>
                      <div class="caz-btns">
                        <button type="button" class="caz-btn caz-btn-ghost" @click="openDrawer(c.id)">分析</button>
                        <button type="button" class="caz-btn caz-btn-primary" @click="openContractDetail(c.id)">详情</button>
                      </div>
                    </div>
                  </div>
                  <!-- 底部：履约进度条 -->
                  <div class="clc-progress-row">
                    <div class="cpr-item">
                      <div class="cpr-head">
                        <span class="cpr-label">履约进度</span>
                        <span class="cpr-bar-wrap">
                          <div class="cpr-bar">
                            <div class="cpr-bar-fill" :style="{ width: c.progress + '%', background: progressBarColor() }"></div>
                            <div class="cpr-plan-mark" :style="{ left: plannedProgress(c) + '%' }">
                              <div class="cpr-tooltip">{{ plannedTooltip(c) }}</div>
                            </div>
                          </div>
                        </span>
                        <span class="cpr-val">{{ c.progress }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="!filteredContracts.length" class="cl-empty">当前筛选条件下暂无合同</div>
              </div>
            </div>
          </main>

          <!-- 右：风险项列表 -->
          <aside class="ct-right">
            <div class="card risk-items-panel">
              <div class="sp-head">
                <h3>合同风险列表</h3>
                <span v-if="activeContract" class="rip-contract-name pill blue" :title="activeContract.name">{{ activeContract.id }}</span>
                <span v-else class="pill" style="color:#94a3b8">点击合同查看</span>
              </div>
              <div class="ri-list micro-scroll">
                <div v-for="item in activeRiskItems" :key="item.id" class="ri-card" :class="`ri-${item.level}`">
                  <!-- 顶行：ID + 等级 + 状态 + AI按钮 -->
                  <div class="ric-head">
                    <button class="ric-id-link" @click="openRisk(item.id)">{{ item.id }}</button>
                    <span class="risk-pill" :class="`rp-${item.level}`">{{ riskLevelLabel2[item.level] }}</span>
                    <span class="ric-status" :class="`rics-${item.statusKey}`">{{ item.status }}</span>
                    <span class="ric-time">⏱ {{ item.alertTime }}</span>
                    <button v-if="!item.analyzed" class="ric-ai-btn" @click.stop="analyzeRiskItem(item)">
                      <span class="ai-btn-icon">✨</span>
                      <span class="ai-btn-text">AI 分析</span>
                      <span class="ai-btn-glow"></span>
                    </button>
                    <button v-else class="ric-report-btn" @click.stop="openRisk(item.id)">
                      <span>📄</span>
                      <span>查看报告</span>
                    </button>
                  </div>
                  <!-- 名称 -->
                  <div class="ric-name">{{ item.name }}</div>
                  <!-- 涉及主体 + 关联索引 -->
                  <div class="ric-info-row">
                    <span class="ric-info-lbl">涉及主体</span>
                    <div class="ric-subjects">
                      <span v-for="s in item.subjects" :key="s" class="ric-subject">{{ s }}</span>
                    </div>
                    <span class="ric-info-lbl">关联索引</span>
                    <span class="ric-index">{{ item.relatedIndex }}</span>
                  </div>
                </div>
                <div v-if="!activeContract" class="domain-empty">请先在中间列表选择合同</div>
                <div v-else-if="activeRiskItems.length === 0" class="domain-clear">
                  <span class="dc-icon">✓</span>
                  <span>当前合同无风险项记录</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <!-- 侧拉抽屉 -->
        <transition name="drawer-slide">
          <div v-if="drawerOpen" class="ct-drawer">
            <div class="drawer-mask" @click="drawerOpen = false"></div>
            <div class="drawer-panel card">
              <div class="drawer-header">
                <div class="drawer-title">
                  <span class="drawer-contract-id">{{ activeContractId }}</span>
                  <span class="drawer-subtitle">分析图谱 · 风险核查摘要</span>
                </div>
                <button type="button" class="drawer-close" @click="drawerOpen = false">✕</button>
              </div>
              <div class="stage-tabs">
                <button v-for="(stage, i) in activeStages" :key="stage.id" type="button" class="stage-tab" :class="{ active: activeStageIdx === i, 'has-risk': stage.risks.length > 0 }" @click="activeStageIdx = i">
                  <span class="sn">{{ i + 1 }}</span>{{ stage.tabLabel }}
                  <span v-if="stage.risks.length" class="risk-badge">{{ stage.risks.length }}</span>
                </button>
              </div>
              <div class="drawer-chart">
                <EChart :option="stageChartOption" />
              </div>
              <div class="drawer-risk-section">
                <div class="rs-section-head">
                  <span class="rs-section-title">风险核查摘要</span>
                  <span class="pill red">{{ totalRisks }} 项</span>
                </div>
                <div class="drawer-risk-list micro-scroll">
                  <template v-if="riskSummary.length">
                    <div v-for="(item, i) in riskSummary" :key="i" class="rs-item" :class="`rs-${item.level}`" @click="jumpToStage(item.stageIdx)">
                      <div class="rs-top">
                        <span class="rs-stage">阶段 {{ item.stageIdx + 1 }}·{{ item.stageLabel }}</span>
                        <span class="risk-pill" :class="`rp-${item.level}`">{{ riskLabelMap[item.level] }}</span>
                      </div>
                      <div class="rs-title">{{ item.title }}</div>
                      <div class="rs-desc">{{ item.desc }}</div>
                    </div>
                  </template>
                  <div v-else class="risk-clear"><span>✓</span> 当前合同未发现风险项</div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </template>

    <!-- ══════════ 风险事项详情报告视图 ══════════ -->
    <template v-if="viewMode === 'risk-detail' && activeRisk">
      <div class="rd-view">
        <div class="cd-topbar rd-topbar">
          <div class="cd-topbar-left">
            <button type="button" class="rdr-back-btn" @click="goBack">{{ backLabel }}</button>
            <span class="cd-id">{{ activeRisk.id }}</span>
            <span class="risk-pill" :class="`rp-${activeRisk.level}`">{{ riskLevelLabel[activeRisk.level] }}</span>
            <button type="button" class="cd-contract-link" @click="openContractDetail(activeRisk.contractRef)" :title="'点击查看原合同 ' + activeRisk.contractRef">📄 查看原合同：{{ activeRisk.contractRef }}</button>
          </div>
          <div class="cd-topbar-right">
            <span class="cd-status-pill" style="background:#fff7ed;border-color:#fed7aa;color:#c2410c">{{ activeRisk.status }}</span>
            <span>生成时间：{{ activeRisk.alertTime }}</span>
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
              <div class="rdk-row" @click="openContractDetail(activeRisk.contractRef)">
                <span class="rdk-lbl">📄 关联合同</span>
                <strong class="rdk-val link">{{ activeRisk.contractRef }} ›</strong>
              </div>
              <div class="rdk-row" @click="navigateToProcurement">
                <span class="rdk-lbl">🛒 关联采购</span>
                <strong class="rdk-val link">{{ activeRisk.procurementRef }} ›</strong>
              </div>
              <div class="rdk-row rdk-row-stack">
                <span class="rdk-lbl">👥 涉及主体</span>
                <div class="rdk-subjects">
                  <strong v-for="s in activeRisk.subjects" :key="s">{{ s }}</strong>
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
                <div v-for="(step, si) in activeRisk.statusFlow" :key="step" class="sf-step" :class="{ done: si < activeRisk.currentStatusIdx, current: si === activeRisk.currentStatusIdx }">
                  <div class="sf-dot"></div>
                  <span>{{ step }}</span>
                  <div v-if="si < activeRisk.statusFlow.length - 1" class="sf-line"></div>
                </div>
              </div>
              <div class="rds-meta">
                <div><span>责任人</span><strong>{{ activeRisk.responsible }}</strong></div>
                <div><span>整改期限</span><strong class="deadline">{{ activeRisk.deadline }}</strong></div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="card rd-actions-card">
              <div class="rda-title">核查操作</div>
              <div class="rda-grid">
                <button type="button" class="rda-btn primary" @click="showToast('核查工单已派发至采购部门', 'info')">派发工单</button>
                <button type="button" class="rda-btn danger" @click="showToast('风险升级预警已推送至监管部门', 'warn')">升级预警</button>
                <button type="button" class="rda-btn" @click="showToast('已补充价格异动说明，待审核', 'info')">补充材料</button>
                <button type="button" class="rda-btn" @click="showToast('已提交解除预警申请，待审批', 'info')">解除预警</button>
              </div>
            </div>
          </aside>
          <div class="rd-main">
            <div class="card rd-report">
              <div class="rdr-header">
                <div class="rdr-header-left">
                  <h2>风险事项详情报告</h2>
                  <p>合同管理域 · {{ activeRisk.name }} · AI智能体自动生成报告</p>
                </div>
              </div>
              <div class="rdr-scroll">
                <div class="rdr-section">
                  <div class="rdr-section-title"><span class="rsn-num">一</span>风险预警事项</div>
                  <p class="rdr-para">{{ activeRisk.detailDescription || 'AI风险监测系统对该合同进行动态扫描，发现异常风险项，触发预警。涉及主体：' + activeRisk.subjects.join('、') + '，需进一步穿透核查确认风险成因。' }}</p>
                </div>
                <div class="rdr-section">
                  <div class="rdr-section-title"><span class="rsn-num">二</span>风险定义</div>
                  <div class="rdr-def-box"><strong>采购合同价格异动</strong>：指采购类合同（物资/服务/工程）的标的单价，与该供应商历史合作单价、同期同类型标的市场公允价格、同期其他供应商合作单价相比，异动幅度超过<strong>±10%（自定义阈值）</strong>，且无合理说明（如原材料涨价、规格升级）的情况，可能存在围标串标、经办人串通、价格虚报等风险。</div>
                </div>
                <div class="rdr-section">
                  <div class="rdr-section-title"><span class="rsn-num">三</span>计算逻辑</div>
                  <ol class="rdr-list">
                    <li><strong>筛选条件：</strong>采购类合同，标的为可量化物资（钢材、水泥等）或标准化服务；</li>
                    <li><strong>比对数据：</strong>① 该供应商近12个月同类标的历史合同单价；② 同期同类型标的市场公允价格；③ 同期其他供应商同类标的合同单价；</li>
                    <li><strong>异动计算：</strong>（本次合同单价 − 比对单价）/ 比对单价 × 100%；</li>
                    <li><strong>预警触发：</strong>任一比对维度异动幅度 ＞ ±10%，且无合理说明文档，触发预警。</li>
                  </ol>
                  <div class="price-compare price-compare-2col">
                    <div class="pc-item warn">
                      <span class="pc-label">本次合同单价</span>
                      <span class="pc-val">5800 元/吨</span>
                      <span class="pc-tag rp-high">偏高 +11.5%</span>
                    </div>
                    <div class="pc-item">
                      <span class="pc-label">市场公允价格</span>
                      <span class="pc-val">5500 元/吨</span>
                      <span class="pc-tag rp-watch">偏高 +5.5%</span>
                    </div>
                    <div class="pc-item">
                      <span class="pc-label">供应商历史均价</span>
                      <span class="pc-val">5200 元/吨</span>
                      <span class="pc-tag rp-normal">基准价</span>
                    </div>
                  </div>
                </div>
                <div class="rdr-section">
                  <div class="rdr-section-title"><span class="rsn-num">四</span>原因分析（结合穿透数据）</div>
                  <div class="evidence-cards">
                    <div class="ev-card ev-contract"><div class="ev-meta"><span class="ev-num">01</span><span class="ev-badge">合同端</span></div><p class="ev-text">合同 <button class="inline-link" @click="openContractDetail(activeRisk.contractRef)" :title="'点击查看原合同 ' + activeRisk.contractRef">{{ activeRisk.contractRef }} ›</button> 约定钢材规格 Φ16mm 螺纹钢，单价 <strong>5800 元/吨</strong>，合同正文未标注价格偏高说明，签订人为 XXX（采购经办人）。</p></div>
                    <div class="ev-card ev-history"><div class="ev-meta"><span class="ev-num">02</span><span class="ev-badge">历史数据</span></div><p class="ev-text">供应商近12个月同类采购合同 <button class="inline-link" @click="openPenetration('supplier')">HT-202602003</button> 单价 <strong>5200 元/吨</strong>，规格一致，同期无明显市场波动，本次涨幅达 <strong class="ev-highlight">11.5%</strong>，触发异动阈值。</p></div>
                    <div class="ev-card ev-proc"><div class="ev-meta"><span class="ev-num">03</span><span class="ev-badge">采购端</span></div><p class="ev-text">询价记录 <button class="inline-link proc-link" @click="openPenetration('inquiry')">XJ-202605002</button> 仅询价 <strong>2 家</strong>供应商（5800 / 5750 元/吨），未进行公开招标，询价范围过窄，缺乏充分竞争。</p></div>
                    <div class="ev-card ev-market"><div class="ev-meta"><span class="ev-num">04</span><span class="ev-badge">市场数据</span></div><p class="ev-text">第三方价格平台 <button class="inline-link" @click="showToast('市场价格数据来源：第三方钢材价格平台 SJ-20260517001', 'info')">SJ-20260517001</button> 显示同期公允价 <strong>5500 元/吨</strong>，本次合同单价偏高市场价 <strong class="ev-highlight">5.45%</strong>。</p></div>
                    <div class="ev-card ev-finance"><div class="ev-meta"><span class="ev-num">05</span><span class="ev-badge">财务端</span></div><p class="ev-text">发票 <button class="inline-link" @click="openPenetration('invoice')">FP-202605003</button> 标注单价 5800 元/吨与合同一致，但未附价格异动说明及市场价格佐证资料，凭证链路存在缺口。</p></div>
                  </div>
                  <div class="rdr-conclusion-box">综上，该合同价格异动无明确合理说明，询价流程不规范，可能存在采购经办人与供应商串通、未充分比价导致价格偏高的风险。</div>
                </div>
                <div class="rdr-section">
                  <div class="rdr-section-title"><span class="rsn-num">五</span>关联数据穿透链接</div>
                  <div class="pene-link-groups">
                    <div class="plg-group">
                      <div class="plg-label">合同域</div>
                      <div class="plg-tags">
                        <button type="button" class="plg-tag" @click="openContractDetail(activeRisk.contractRef)"><span class="plg-id">{{ activeRisk.contractRef }}</span><span class="plg-name">本次合同详情 ›</span></button>
                        <button type="button" class="plg-tag pene-active" @click="openPenetration('supplier')"><span class="plg-id">HT-202602003</span><span class="plg-name">供应商历史合同 → 查看历史价格</span></button>
                        <button type="button" class="plg-tag" @click="showToast('已加载合同审批记录 SP-' + activeRisk.contractRef.slice(3), 'info')"><span class="plg-id">SP-{{ activeRisk.contractRef.slice(3) }}</span><span class="plg-name">合同审批记录</span></button>
                      </div>
                    </div>
                    <div class="plg-group plg-proc">
                      <div class="plg-label">采购域 <span class="plg-nav-hint">↗ 点击穿透核查</span></div>
                      <div class="plg-tags">
                        <button type="button" class="plg-tag proc-tag" @click="navigateToProcurement"><span class="plg-id">{{ activeRisk.procurementRef }}</span><span class="plg-name">采购计划详情</span></button>
                        <button type="button" class="plg-tag proc-tag pene-active" @click="openPenetration('inquiry')"><span class="plg-id">XJ-{{ activeRisk.contractRef.slice(3) }}</span><span class="plg-name">采购询价记录 → 核查同期市场价格</span></button>
                        <button type="button" class="plg-tag proc-tag" @click="navigateToProcurement"><span class="plg-id">BJ-{{ activeRisk.contractRef.slice(3) }}</span><span class="plg-name">供应商报价记录</span></button>
                      </div>
                    </div>
                    <div class="plg-group">
                      <div class="plg-label">财务域</div>
                      <div class="plg-tags">
                        <button type="button" class="plg-tag fin-tag pene-active" @click="openPenetration('invoice')"><span class="plg-id">FP-{{ activeRisk.contractRef.slice(3) }}</span><span class="plg-name">发票号 → 确认发票价格与合同价格一致性</span></button>
                        <button type="button" class="plg-tag fin-tag" @click="showToast('已加载会计凭证 PZ-' + activeRisk.contractRef.slice(3), 'info')"><span class="plg-id">PZ-{{ activeRisk.contractRef.slice(3) }}</span><span class="plg-name">会计凭证详情</span></button>
                      </div>
                    </div>
                    <div class="plg-group"><div class="plg-label">外部数据</div><div class="plg-tags"><button type="button" class="plg-tag ext-tag" @click="showToast('已加载第三方市场价格数据 SJ-20260517001', 'info')"><span class="plg-id">SJ-20260517001</span><span class="plg-name">同期市场价格</span></button></div></div>
                  </div>
                </div>
                <div class="rdr-section">
                  <div class="rdr-section-title"><span class="rsn-num">六</span>整改建议</div>
                  <ol class="rdr-list">
                    <li>由采购部门牵头，核查本次价格异动原因，要求供应商提供价格上涨说明（如原材料采购凭证）；</li>
                    <li>若价格异动为合理（如原材料涨价），补充价格说明及佐证资料，上传系统，解除预警；若为不合理异动，协商供应商调整单价，或重新组织询价/招标；</li>
                    <li>完善采购询价流程，要求同类物资询价供应商不少于3家，必要时进行公开招标；</li>
                    <li>核查采购经办人（XXX）的履职情况，确认是否存在与供应商串通行为；</li>
                    <li>建立供应商价格动态监测机制，定期比对历史价格与市场价格，提前预警价格异常。</li>
                  </ol>
                </div>
                <div class="rdr-section last-section">
                  <div class="rdr-section-title"><span class="rsn-num">七</span>处理进度跟踪</div>
                  <div class="proc-track">
                    <div v-for="(step, si) in activeRisk.statusFlow" :key="step" class="pt-step" :class="{ done: si < activeRisk.currentStatusIdx, current: si === activeRisk.currentStatusIdx }">
                      <div class="pt-dot"></div>
                      <div class="pt-body"><strong>{{ step }}</strong><span v-if="si === activeRisk.currentStatusIdx" class="pt-current-badge">当前状态</span></div>
                    </div>
                  </div>
                  <div class="pt-meta-grid">
                    <div class="ptm-item"><span>处理状态</span><strong>{{ activeRisk.status }}</strong></div>
                    <div class="ptm-item"><span>责任人</span><strong>{{ activeRisk.responsible }}</strong></div>
                    <div class="ptm-item"><span>整改期限</span><strong class="deadline">{{ activeRisk.deadline }}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ 穿透详情面板 ══ -->
        <transition name="pene-slide">
          <div v-if="peneTarget" class="pene-overlay">
            <div class="pene-modal card">
              <div class="pene-head">
                <div class="pene-head-left">
                  <span class="pene-label">穿透核查</span>
                  <span class="pene-id">{{ peneDataMap[peneTarget]?.id || '' }}</span>
                  <span class="pene-title">{{ peneDataMap[peneTarget]?.title || '' }}</span>
                </div>
                <button type="button" class="drawer-close" @click="peneTarget = null">✕</button>
              </div>
              <div class="pene-subtitle">{{ peneDataMap[peneTarget]?.subtitle || '' }}</div>

              <!-- 供应商历史合同 -->
              <template v-if="peneTarget === 'supplier'">
                <div class="pene-body micro-scroll">
                  <div class="pene-sec-title">历史合同价格对比</div>
                  <table class="pene-table">
                    <thead><tr><th>合同编号</th><th>签订日期</th><th>规格型号</th><th>数量</th><th>单价</th><th>合同金额</th><th>状态</th></tr></thead>
                    <tbody>
                      <tr v-for="r in peneDataMap.supplier.records" :key="r.contractId" :class="{ 'ptr-current': r.current }">
                        <td class="mono-cell">{{ r.contractId }}<span v-if="r.current" class="ptr-cur-badge">本次</span></td>
                        <td>{{ r.date }}</td><td>{{ r.spec }}</td><td>{{ r.qty }}</td>
                        <td :class="r.current ? 'ptr-price-high' : ''"><strong>{{ r.unitPrice }}</strong></td>
                        <td>{{ r.amount }}</td>
                        <td><span class="ptr-status" :class="r.current ? 'ptr-st-active' : 'ptr-st-done'">{{ r.status }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="pene-conclusion-box pene-warn">{{ peneDataMap.supplier.conclusion }}</div>
                </div>
              </template>

              <!-- 采购询价记录 -->
              <template v-else-if="peneTarget === 'inquiry'">
                <div class="pene-body micro-scroll">
                  <div class="pene-sec-title">询价供应商对比</div>
                  <table class="pene-table">
                    <thead><tr><th>供应商</th><th>报价</th><th>交货期</th><th>资质等级</th><th>备注</th></tr></thead>
                    <tbody>
                      <tr v-for="r in peneDataMap.inquiry.records" :key="r.supplier" :class="{ 'ptr-current': r.selected }">
                        <td>{{ r.supplier }}<span v-if="r.selected" class="ptr-cur-badge">已选</span></td>
                        <td :class="r.selected ? 'ptr-price-high' : ''"><strong>{{ r.price }}</strong></td>
                        <td>{{ r.delivery }}</td><td>{{ r.qualification }}</td><td>{{ r.remark }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="pene-kv-row"><span class="pene-kv-label">同期市场参考价</span><strong class="pene-kv-val pene-kv-green">{{ peneDataMap.inquiry.marketRef }}</strong></div>
                  <div class="pene-conclusion-box pene-warn">{{ peneDataMap.inquiry.conclusion }}</div>
                </div>
              </template>

              <!-- 财务发票 -->
              <template v-else-if="peneTarget === 'invoice'">
                <div class="pene-body micro-scroll">
                  <div class="pene-sec-title">发票要素核查 · 两列对比</div>
                  <div class="pene-compare-2col">
                    <div class="pene-compare-col">
                      <div class="pene-compare-col-title">发票信息</div>
                      <div v-for="item in peneDataMap.invoice.items.slice(0, 5)" :key="item.field" class="pene-kv-row"><span>{{ item.field }}</span><strong>{{ item.value }}</strong></div>
                    </div>
                    <div class="pene-compare-col">
                      <div class="pene-compare-col-title">合同信息</div>
                      <div class="pene-kv-row"><span>合同编号</span><strong>HT-202605002</strong></div>
                      <div class="pene-kv-row"><span>签订日期</span><strong>2026-04-18</strong></div>
                      <div class="pene-kv-row"><span>供应商</span><strong>XX建材有限公司</strong></div>
                      <div class="pene-kv-row"><span>货物名称</span><strong>Φ16mm 螺纹钢 HRB400E</strong></div>
                      <div class="pene-kv-row"><span>数量</span><strong>100 吨</strong></div>
                    </div>
                  </div>
                  <div class="pene-compare-2col" style="margin-top:8px">
                    <div class="pene-compare-col">
                      <div class="pene-compare-col-title">发票价格信息</div>
                      <div v-for="item in peneDataMap.invoice.items.slice(5)" :key="item.field" class="pene-kv-row"><span>{{ item.field }}</span><strong>{{ item.value }}</strong></div>
                    </div>
                    <div class="pene-compare-col">
                      <div class="pene-compare-col-title">合同价格信息</div>
                      <div class="pene-kv-row"><span>不含税单价</span><strong>5,133.63 元/吨</strong></div>
                      <div class="pene-kv-row"><span>税率</span><strong>13%</strong></div>
                      <div class="pene-kv-row"><span>含税单价</span><strong>5,800 元/吨</strong></div>
                      <div class="pene-kv-row"><span>合同总金额</span><strong>¥580,000.00</strong></div>
                      <div class="pene-kv-row"><span>价格一致性</span><strong class="pene-kv-green">✓ 一致</strong></div>
                    </div>
                  </div>
                  <div class="pene-conclusion-box pene-ok">{{ peneDataMap.invoice.diff }}</div>
                  <div class="pene-conclusion-box" style="margin-top:6px">{{ peneDataMap.invoice.conclusion }}</div>
                </div>
              </template>

              <!-- 核查结论录入 -->
              <div class="pene-resolution">
                <div class="pene-res-title">核查结论录入</div>
                <div class="pene-res-desc">根据以上核查数据，本次价格异动属于：</div>
                <div class="pene-res-btns">
                  <button type="button" class="prb-btn prb-resolve" @click="resolveAlert('reasonable')"><span class="prb-icon">✓</span><span class="prb-text"><strong>合理异动</strong><em>补充说明，解除预警</em></span></button>
                  <button type="button" class="prb-btn prb-escalate" @click="resolveAlert('violation')"><span class="prb-icon">⚠</span><span class="prb-text"><strong>违规异动</strong><em>按整改建议处理</em></span></button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </template>

    <!-- ══════════ 合同详情页 ══════════ -->
    <template v-if="viewMode === 'contract-detail' && activeContract">
      <div class="cd-view micro-scroll">
        <div class="cd-topbar">
          <div class="cd-topbar-left">
            <button type="button" class="rdr-back-btn" @click="goBack">{{ backLabel }}</button>
            <span class="cd-id">{{ activeContract.id }}</span>
            <span class="risk-pill" :class="`rp-${activeContract.risk}`">{{ riskLabelMap[activeContract.risk] }}</span>
          </div>
          <div class="cd-topbar-right">
            <span class="cd-status-pill">{{ activeContract.status }}</span>
            <span class="cd-core-risk-inline" v-if="activeContract.riskCount">⚠ {{ activeContract.riskCount }} 项风险</span>
          </div>
        </div>

        <!-- AI 总览 -->
        <div class="cd-section cd-ai-overview">
          <div class="cd-sec-title"><span class="cd-sec-num">AI</span>合同解析总览</div>
          <div class="cd-ai-grid">
            <div class="cd-ai-item"><span>合同类型</span><strong>{{ activeContract.category }}</strong></div>
            <div class="cd-ai-item"><span>风险等级</span><strong :style="{ color: riskColor[activeContract.risk] }">{{ riskLabelMap[activeContract.risk] }}</strong></div>
            <div class="cd-ai-item"><span>合同状态</span><strong>{{ activeContract.status }}</strong></div>
            <div class="cd-ai-item"><span>履约进度</span><strong>{{ activeContract.progress }}%</strong></div>
            <div class="cd-ai-item"><span>付款进度</span><strong :style="{ color: activeContract.paidRatio > activeContract.progress ? '#ef4444' : '#16a34a' }">{{ activeContract.paidRatio }}%</strong></div>
            <div class="cd-ai-item"><span>合同金额</span><strong :style="{ color: riskColor[activeContract.risk] }">{{ activeContract.amount }}</strong></div>
          </div>
        </div>

        <div class="cd-body">
          <!-- 一：基础主体信息 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">一</span>基础主体信息</div>
            <div class="cd-three-col">
              <div class="cd-field-group">
                <div class="cd-fg-title">合同基本</div>
                <div class="cd-field"><span>合同编号</span><strong>{{ activeContract.id }}</strong></div>
                <div class="cd-field"><span>合同名称</span><strong>{{ activeContract.name }}</strong></div>
                <div class="cd-field"><span>合同类型</span><strong>{{ activeContract.category }}</strong></div>
                <div class="cd-field"><span>风险等级</span><strong :style="{ color: riskColor[activeContract.risk] }">{{ riskLabelMap[activeContract.risk] }}</strong></div>
              </div>
              <div class="cd-field-group">
                <div class="cd-fg-title">甲方（发包方）</div>
                <div class="cd-field"><span>单位全称</span><strong>{{ getCompanyName(activeContract.companyId) }}</strong></div>
                <div class="cd-field"><span>所属板块</span><strong>{{ getSectorName(activeContract.companyId) }}</strong></div>
                <div class="cd-field"><span>主管部门</span><strong>采购管理部</strong></div>
                <div class="cd-field"><span>经办人</span><strong>XXX</strong></div>
              </div>
              <div class="cd-field-group">
                <div class="cd-fg-title">乙方（承包方/供应商）</div>
                <div class="cd-field"><span>合作方全称</span><strong>{{ activeContract.supplier }}</strong></div>
                <div class="cd-field"><span>统一社会信用代码</span><strong>9132****×××XXXXXX</strong></div>
                <div class="cd-field"><span>企业性质</span><strong>有限责任公司</strong></div>
                <div class="cd-field"><span>联系人</span><strong>XXX / 139****XXXX</strong></div>
              </div>
            </div>
          </div>

          <!-- 二：合同时效数据 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">二</span>合同时效数据</div>
            <div class="cd-field-row">
              <div class="cd-field"><span>签订日期</span><strong>{{ activeContract.signDate }}</strong></div>
              <div class="cd-field"><span>生效日期</span><strong>{{ activeContract.signDate }}</strong></div>
              <div class="cd-field"><span>到期日期</span><strong>{{ activeContract.expireDate }}</strong></div>
              <div class="cd-field"><span>质保期</span><strong>交付后 12 个月</strong></div>
              <div class="cd-field"><span>付款方式</span><strong>{{ activeContract.payMethod }}</strong></div>
              <div class="cd-field"><span>履约截止</span><strong>{{ activeContract.expireDate }}</strong></div>
            </div>
          </div>

          <!-- 三：金额费用结构 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">三</span>金额费用结构化数据</div>
            <div class="cd-amount-grid">
              <div class="cd-amount-card cd-amount-total"><span>合同总金额</span><strong>{{ activeContract.amount }}</strong></div>
              <div class="cd-amount-card"><span>付款方式</span><strong>{{ activeContract.payMethod }}</strong></div>
              <div class="cd-amount-card"><span>税率</span><strong>13%（增值税）</strong></div>
              <div class="cd-amount-card" :class="{ 'cd-amount-warn': activeContract.paidRatio > activeContract.progress }"><span>履约 vs 付款</span><strong>{{ activeContract.progress }}% / {{ activeContract.paidRatio }}%</strong></div>
            </div>
            <div class="ci-progress-row" style="margin-top:10px">
              <span class="ci-prog-lbl">履约进度</span>
              <div class="ci-prog-bar" style="flex:1"><div class="ci-prog-fill" :style="{ width: activeContract.progress + '%', background: riskColor[activeContract.risk] }"></div></div>
              <span class="ci-prog-val">{{ activeContract.progress }}%</span>
              <span class="ci-prog-sep">·</span>
              <span class="ci-prog-lbl">付款进度</span>
              <div class="ci-prog-bar" style="flex:1"><div class="ci-prog-fill" :style="{ width: activeContract.paidRatio + '%', background: activeContract.paidRatio > activeContract.progress ? '#ef4444' : '#16a34a' }"></div></div>
              <span class="ci-prog-val" :style="{ color: activeContract.paidRatio > activeContract.progress ? '#ef4444' : '#16a34a' }">{{ activeContract.paidRatio }}%</span>
            </div>
          </div>

          <!-- 四：业务品类与标的 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">四</span>业务品类与标的数据</div>
            <div class="cd-field-row">
              <div class="cd-field"><span>业务大类</span><strong>{{ activeContract.category }}</strong></div>
              <div class="cd-field"><span>合同金额</span><strong>{{ activeContract.amount }}</strong></div>
              <div class="cd-field"><span>供应商</span><strong>{{ activeContract.supplier }}</strong></div>
              <div class="cd-field"><span>所属板块</span><strong>{{ getSectorName(activeContract.companyId) }}</strong></div>
              <div class="cd-field"><span>主体单位</span><strong>{{ getCompanyName(activeContract.companyId) }}</strong></div>
              <div class="cd-field"><span>风险项数</span><strong :style="{ color: riskColor[activeContract.risk] }">{{ activeContract.riskCount }} 项</strong></div>
            </div>
          </div>

          <!-- 五六七八：履约 · 结算 · 合规 · 关联（四列） -->
          <div class="cd-four-col">
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">五</span>履约管控</div>
              <div class="cd-field"><span>履约进度</span><strong>{{ activeContract.progress }}%</strong></div>
              <div class="cd-field"><span>付款进度</span><strong :style="{ color: activeContract.paidRatio > activeContract.progress ? '#ef4444' : '#16a34a' }">{{ activeContract.paidRatio }}%</strong></div>
              <div class="cd-field"><span>合同状态</span><strong>{{ activeContract.status }}</strong></div>
              <div class="cd-field"><span>风险项</span><strong>{{ activeContract.riskCount }} 项</strong></div>
            </div>
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">六</span>财务结算</div>
              <div class="cd-field"><span>付款方式</span><strong>{{ activeContract.payMethod }}</strong></div>
              <div class="cd-field"><span>合同金额</span><strong>{{ activeContract.amount }}</strong></div>
              <div class="cd-field"><span>发票类型</span><strong>增值税专用发票</strong></div>
              <div class="cd-field"><span>结算周期</span><strong>验收后 30 日内</strong></div>
            </div>
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">七</span>合规风控</div>
              <div class="cd-field"><span>风险等级</span><strong :style="{ color: riskColor[activeContract.risk] }">{{ riskLabelMap[activeContract.risk] }}</strong></div>
              <div class="cd-field"><span>风险条款</span><strong class="cd-risk-flag">{{ activeContract.riskClause || '无' }}</strong></div>
              <div class="cd-field"><span>法务审核</span><strong>{{ activeContract.risk === 'high' || activeContract.risk === 'critical' ? '未审核 ⚠' : '已审核' }}</strong></div>
              <div class="cd-field"><span>国资监管</span><strong>A 类（重点监控）</strong></div>
            </div>
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">八</span>拓展关联</div>
              <div class="cd-field"><span>采购订单</span><strong>CG-{{ activeContract.id.slice(3) }}</strong></div>
              <div class="cd-field"><span>询价记录</span><strong>XJ-{{ activeContract.id.slice(3) }}</strong></div>
              <div class="cd-field"><span>发票凭证</span><strong>FP-{{ activeContract.id.slice(3) }}</strong></div>
              <div class="cd-field"><span>审批记录</span><strong>SP-{{ activeContract.id.slice(3) }}</strong></div>
            </div>
          </div>

          <!-- 穿透链路 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">九</span>穿透链路关联</div>
            <div class="links-wrap">
              <span class="link-tag lt-procurement">CG-{{ activeContract.id.slice(3) }}<em>采购订单</em></span>
              <span class="link-tag lt-inquiry">XJ-{{ activeContract.id.slice(3) }}<em>询价记录</em></span>
              <span class="link-tag lt-invoice">FP-{{ activeContract.id.slice(3) }}<em>发票凭证</em></span>
              <span class="link-tag lt-approval">SP-{{ activeContract.id.slice(3) }}<em>审批流程</em></span>
              <span class="link-tag lt-voucher">PZ-{{ activeContract.id.slice(3) }}<em>账务凭证</em></span>
            </div>
          </div>

          <!-- AI 智能合同解析 -->
          <div class="cd-section cd-ai-action">
            <button class="cd-ai-btn" @click="analyzeCurrentContract">
              <span class="cd-ai-btn-icon">✨</span>
              <span class="cd-ai-btn-text">AI 智能合同解析</span>
              <span class="cd-ai-btn-sub">点击启动AI全面分析合同风险、合规、履约情况</span>
              <span class="cd-ai-btn-glow"></span>
            </button>
            <div v-if="aiAnalysisResult.length" class="cd-ai-result">
              <div class="cd-ai-result-title">AI 合规审查意见</div>
              <div v-for="(op, idx) in aiAnalysisResult" :key="idx" class="cd-opinion-item" :class="`cd-op-${op.level}`">
                <div class="cd-op-head"><span class="risk-pill" :class="`rp-${op.level}`">{{ riskLabelMap[op.level] }}</span><span class="cd-op-title">{{ op.title }}</span></div>
                <div class="cd-op-body">{{ op.content }}</div>
                <div class="cd-op-suggest">💡 整改建议：{{ op.suggest }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════ AI 智能体分析步骤弹窗 ══════════ -->
    <transition name="agent-fade">
      <div v-if="aiAgentModal" class="ai-agent-overlay">
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
            <div class="ai-agent-result">
              <span class="ai-result-icon">✓</span>
              <span>分析完成，已生成风险报告</span>
            </div>
            <button class="ai-agent-btn" @click="goToRiskReport">查看分析报告 →</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, onBeforeUnmount, ref } from 'vue'
import EChart from '@/components/EChart.vue'
import { CONTRACT_RISK_ITEMS, PRICE_PENETRATION_DATA, COMPANIES, SECTORS } from '@/mock/index.js'

const emit = defineEmits(['navigate'])

// ──────────── 全局状态 ────────────
const viewMode = ref('penetration')
const toastVisible = ref(false)
const toastText = ref('')
const toastType = ref('info')
let toastTimer = null

function showToast(text, type = 'info') {
  toastText.value = text; toastType.value = type; toastVisible.value = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastVisible.value = false }, 2800)
}

function navigateToProcurement() {
  showToast('正在跳转至采购穿透页…', 'info')
  setTimeout(() => emit('navigate', 'procurement'), 800)
}

function getCompanyName(id) { const c = COMPANIES.find(x => x.id === id); return c ? c.name : '—' }
function getSectorName(id) { const c = COMPANIES.find(x => x.id === id); if (!c) return '—'; const s = SECTORS.find(x => x.id === c.sectorId); return s ? s.name : '—' }

onBeforeUnmount(() => { window.clearTimeout(toastTimer) })

// ── 穿透视图数据
const riskLabelMap = { high: '高风险', medium: '中风险', watch: '低风险', normal: '正常', critical: '重大风险' }
const riskColor = { high: '#ef4444', medium: '#f97316', watch: '#eab308', normal: '#16a34a', critical: '#dc2626' }
const riskLevelLabel = { high: '高风险', medium: '中风险', watch: '低风险', normal: '正常', critical: '重大风险' }
const riskLevelLabel2 = { high: '高风险', medium: '中风险', watch: '低风险', normal: '正常', critical: '重大风险' }
const riskIconMap = { high: '⚠️', medium: '⚠', watch: 'ℹ', normal: '✓', critical: '🚨', low: '✓' }

// 合同风险分级统计：基于该合同的实际风险项，按等级聚合
function riskBreakdown(contractId) {
  const items = CONTRACT_RISK_ITEMS[contractId] ?? []
  const stat = { high: 0, medium: 0, watch: 0 }
  for (const r of items) {
    if (r.level === 'critical' || r.level === 'high') stat.high++
    else if (r.level === 'medium') stat.medium++
    else if (r.level === 'watch') stat.watch++
  }
  return stat
}

// 当前日期（演示固定为 2026-05-21）
function stepKeyOfRisk(r) {
  if (!r) return 'pending'
  if (r.status === '核查中') return 'checking'
  if (r.status === '整改中') return 'fixing'
  return 'pending'
}
const TODAY = new Date('2026-05-21')
function plannedProgress(c) {
  const sign = new Date(c.signDate)
  const expire = new Date(c.expireDate)
  if (isNaN(sign) || isNaN(expire) || expire <= sign) return 0
  const total = expire - sign
  const elapsed = TODAY - sign
  if (elapsed <= 0) return 0
  if (elapsed >= total) return 100
  return Math.round((elapsed / total) * 100)
}
function progressBarColor() {
  // 进度条统一使用中性蓝色，差异通过文字标签体现
  return 'linear-gradient(90deg, #60a5fa, #2563eb)'
}
function planStatusText(actual, planned) {
  const diff = actual - planned
  const sign = diff >= 0 ? '+' : ''
  const diffStr = `${sign}${diff}pct`
  // 超进度 vs 滞后 语义区分
  if (diff > 15) return `${diffStr} 严重超进度（待核查）`
  if (diff > 5) return `${diffStr} 超进度（待核查）`
  if (diff < -15) return `${diffStr} 严重滞后`
  if (diff < -5) return `${diffStr} 滞后`
  return `${diffStr} 正常`
}
function planStatusClass(actual, planned) {
  const diff = actual - planned
  if (diff > 15) return 'cpr-over-high'
  if (diff > 5) return 'cpr-over'
  if (diff < -15) return 'cpr-late-high'
  if (diff < -5) return 'cpr-late'
  return 'cpr-ok'
}
const TODAY_STR = '2026-05-21'
function plannedTooltip(c) {
  const pct = plannedProgress(c)
  return `计划节点：应完成 ${pct}%（对应时间：${TODAY_STR}）`
}

const kpiCards = [
  { label: '集团总计合同', value: '14,205', unit: '项', badge: '全量监控', color: '#2563eb', bg: '#eff6ff', pillBg: '#dbeafe', sub: '覆盖全集团所有合同台账' },
  { label: '穿透核查覆盖率', value: '98.4', unit: '%', badge: '高覆盖', color: '#16a34a', bg: '#f0fdf4', pillBg: '#dcfce7', sub: '较上季度提升 1.2 个百分点' },
  { label: '实时触发预警', value: '23', unit: '件', badge: '待处置', color: '#f97316', bg: '#fff7ed', pillBg: '#fed7aa', sub: '本月新增 8 件，已派发 15 件' },
  { label: '待整改闭环', value: '7', unit: '件', badge: '逾期预警', color: '#ef4444', bg: '#fef2f2', pillBg: '#fee2e2', sub: '最长逾期 21 天，需立即跟进' },
  { label: 'Agent 内核调用计数', value: '842,915', unit: '次', badge: '实时统计', color: '#7c3aed', bg: '#f5f3ff', pillBg: '#ede9fe', sub: '累计智能体模型推理调用总量' },
]

// 合同列表（从 mock 数据构建）
const contracts = [
  { id: 'HT-202605002', name: '钢材采购合同', companyId: 'c1', supplier: 'XX建材有限公司', amount: '58 万元', signDate: '2026-05-16', expireDate: '2027-05-15', payMethod: '按节点付款', category: '物资采购（Φ16mm螺纹钢 · 100吨）', status: '执行中', progress: 62, paidRatio: 64, risk: 'high', riskCount: 4 },
  { id: 'HT-202604015', name: '设备安装服务合同', companyId: 'c1', supplier: '苏州机电科技', amount: '320 万元', signDate: '2026-03-10', expireDate: '2026-12-31', payMethod: '里程碑付款', category: '工程服务', status: '执行中', progress: 80, paidRatio: 78, risk: 'medium', riskCount: 2 },
  { id: 'HT-202603008', name: '工程监理服务合同', companyId: 'c18', supplier: '长三角监理联盟', amount: '126 万元', signDate: '2026-02-22', expireDate: '2026-08-31', payMethod: '月度结算', category: '监理服务', status: '已完结', progress: 100, paidRatio: 100, risk: 'normal', riskCount: 0 },
  { id: 'HT-2026-0120', name: '智能变电站EPC总包', companyId: 'c8', supplier: '国电南瑞科技', amount: '6,800 万元', signDate: '2026-03-15', expireDate: '2027-06-30', payMethod: '里程碑付款', category: '工程总包', status: '预警中', progress: 35, paidRatio: 45, risk: 'high', riskCount: 3 },
  { id: 'HT-2026-0155', name: '海上风电安装合同', companyId: 'c9', supplier: '海洋工程局', amount: '1.24 亿元', signDate: '2026-04-01', expireDate: '2027-12-31', payMethod: '节点付款', category: '工程服务', status: '履行中', progress: 42, paidRatio: 38, risk: 'medium', riskCount: 2 },
  { id: 'HT-2026-0188', name: '水电站设备采购', companyId: 'c10', supplier: '东方电气集团', amount: '4,200 万元', signDate: '2026-02-20', expireDate: '2027-03-31', payMethod: '30/40/20/10', category: '设备采购', status: '履行中', progress: 72, paidRatio: 65, risk: 'low', riskCount: 0 },
  { id: 'HT-2026-0220', name: '热电联产燃料供应', companyId: 'c11', supplier: '东北煤炭集团', amount: '1,800 万元', signDate: '2026-05-01', expireDate: '2027-04-30', payMethod: '月度结算', category: '物资采购', status: '履行中', progress: 55, paidRatio: 52, risk: 'medium', riskCount: 1 },
  { id: 'HT-2026-0250', name: '电网智能化改造', companyId: 'c12', supplier: '华为数字能源', amount: '360 万元', signDate: '2026-05-10', expireDate: '2027-08-31', payMethod: '分期付款', category: '技术服务', status: '履行中', progress: 28, paidRatio: 22, risk: 'watch', riskCount: 1 },
  { id: 'HT-2026-0288', name: '主变压器成套采购', companyId: 'c1', supplier: '远东重电制造', amount: '8,400 万元', signDate: '2026-03-26', expireDate: '2027-02-28', payMethod: '30/30/30/10', category: '设备采购', status: '履行中', progress: 46, paidRatio: 62, risk: 'normal', riskCount: 0 },
  { id: 'HT-2026-0300', name: '精密机床进口合同', companyId: 'c13', supplier: '德国精机集团', amount: '280 万元', signDate: '2026-04-12', expireDate: '2027-05-31', payMethod: '信用证付款', category: '设备采购', status: '预警中', progress: 48, paidRatio: 55, risk: 'high', riskCount: 2 },
  { id: 'HT-2026-0330', name: '海洋平台建造合同', companyId: 'c14', supplier: '中海油服工程', amount: '1.86 亿元', signDate: '2026-05-08', expireDate: '2028-06-30', payMethod: '里程碑付款', category: '工程总包', status: '预警中', progress: 22, paidRatio: 28, risk: 'high', riskCount: 4 },
  { id: 'HT-2026-0360', name: '高铁轴承采购框架', companyId: 'c15', supplier: '洛阳LYC轴承', amount: '520 万元', signDate: '2026-02-15', expireDate: '2027-02-28', payMethod: '月度结算', category: '物资采购', status: '履行中', progress: 88, paidRatio: 85, risk: 'normal', riskCount: 0 },
  { id: 'HT-2026-0390', name: '特种合金材料供应', companyId: 'c16', supplier: '宝钛集团', amount: '160 万元', signDate: '2026-04-22', expireDate: '2027-04-30', payMethod: '批次结算', category: '物资采购', status: '履行中', progress: 65, paidRatio: 60, risk: 'watch', riskCount: 1 },
  { id: 'HT-2026-0420', name: '焊接机器人产线集成', companyId: 'c17', supplier: '发那科机器人', amount: '320 万元', signDate: '2026-03-08', expireDate: '2027-01-31', payMethod: '40/30/20/10', category: '设备采购', status: '履行中', progress: 58, paidRatio: 52, risk: 'medium', riskCount: 1 },
  { id: 'HT-2026-0312', name: '大型设备采购合同', companyId: 'c5', supplier: '宏基土木集团', amount: '230 万元', signDate: '2026-03-12', expireDate: '2027-06-30', payMethod: '全额预付', category: '设备采购', status: '预警中', progress: 60, paidRatio: 100, risk: 'high', riskCount: 4, riskClause: '预付100% + 无质保金' },
  { id: 'HT-2026-0450', name: '跨江大桥施工总包', companyId: 'c18', supplier: '中铁大桥局', amount: '2.84 亿元', signDate: '2026-04-28', expireDate: '2028-12-31', payMethod: '月度计量', category: '工程总包', status: '预警中', progress: 32, paidRatio: 38, risk: 'high', riskCount: 3 },
  { id: 'HT-2026-0480', name: '深水码头建设工程', companyId: 'c19', supplier: '中交航务工程局', amount: '9,600 万元', signDate: '2026-04-05', expireDate: '2027-09-30', payMethod: '节点付款', category: '工程总包', status: '履行中', progress: 55, paidRatio: 48, risk: 'medium', riskCount: 1 },
  { id: 'HT-2026-0510', name: '大坝加固改造工程', companyId: 'c20', supplier: '中国水电基础局', amount: '3,800 万元', signDate: '2026-03-18', expireDate: '2027-03-31', payMethod: '月度计量', category: '工程施工', status: '履行中', progress: 72, paidRatio: 68, risk: 'normal', riskCount: 0 },
  { id: 'HT-2026-0540', name: '航站楼钢结构采购', companyId: 'c21', supplier: '中建钢构', amount: '720 万元', signDate: '2026-05-03', expireDate: '2027-08-31', payMethod: '30/40/20/10', category: '物资采购', status: '预警中', progress: 40, paidRatio: 35, risk: 'medium', riskCount: 2 },
  { id: 'HT-2026-0570', name: '铁路信号系统集成', companyId: 'c22', supplier: '中国通号集团', amount: '540 万元', signDate: '2026-02-28', expireDate: '2027-06-30', payMethod: '里程碑付款', category: '系统集成', status: '履行中', progress: 62, paidRatio: 55, risk: 'watch', riskCount: 1 },
  { id: 'HT-2026-0551', name: '片区道路及管廊施工', companyId: 'c5', supplier: '城建路桥集团', amount: '6,740 万元', signDate: '2026-03-06', expireDate: '2027-08-30', payMethod: '25/25/25/15/10', category: '工程施工', status: '预警中', progress: 41, paidRatio: 58, risk: 'high', riskCount: 3 },
  { id: 'HT-2026-0600', name: '设备融资租赁合同', companyId: 'c23', supplier: '中联重科融资租赁', amount: '350 万元', signDate: '2026-05-15', expireDate: '2029-05-31', payMethod: '季度付租', category: '融资租赁', status: '预警中', progress: 68, paidRatio: 22, risk: 'high', riskCount: 2 },
  { id: 'HT-2026-0630', name: '工程一切险保单', companyId: 'c24', supplier: '中国平安财险', amount: '120 万元', signDate: '2026-04-01', expireDate: '2027-03-31', payMethod: '年缴', category: '保险服务', status: '履行中', progress: 90, paidRatio: 100, risk: 'medium', riskCount: 1 },
  { id: 'HT-2026-0660', name: '产业基金合伙协议', companyId: 'c25', supplier: '中信产业基金', amount: '1.50 亿元', signDate: '2026-05-20', expireDate: '2031-05-31', payMethod: 'Capital Call', category: '基金合伙', status: '预警中', progress: 35, paidRatio: 18, risk: 'high', riskCount: 3 },
  { id: 'HT-2026-0690', name: '信托受益权转让', companyId: 'c26', supplier: '中信信托', amount: '8,600 万元', signDate: '2026-04-18', expireDate: '2028-04-30', payMethod: '到期兑付', category: '信托投资', status: '核查中', progress: 50, paidRatio: 100, risk: 'high', riskCount: 2 },
  { id: 'HT-2026-0720', name: 'AI大模型训练平台', companyId: 'c27', supplier: '百度智能云', amount: '240 万元', signDate: '2026-05-12', expireDate: '2027-05-31', payMethod: '50/30/20', category: '技术服务', status: '履行中', progress: 52, paidRatio: 45, risk: 'medium', riskCount: 1 },
  { id: 'HT-2026-0750', name: '工业园区废水处理', companyId: 'c28', supplier: '碧水源科技', amount: '180 万元', signDate: '2026-03-22', expireDate: '2027-03-31', payMethod: '月度结算', category: '工程服务', status: '履行中', progress: 78, paidRatio: 72, risk: 'watch', riskCount: 1 },
  { id: 'HT-2026-0780', name: '碳纤维复合材料研发', companyId: 'c29', supplier: '中复神鹰碳纤维', amount: '90 万元', signDate: '2026-04-28', expireDate: '2027-10-31', payMethod: '阶段付款', category: '研发合作', status: '履行中', progress: 42, paidRatio: 35, risk: 'medium', riskCount: 1 },
  { id: 'HT-2026-0810', name: '生物发酵中试平台', companyId: 'c30', supplier: '凯赛生物', amount: '120 万元', signDate: '2026-02-10', expireDate: '2027-02-28', payMethod: '分期付款', category: '技术服务', status: '履行中', progress: 88, paidRatio: 82, risk: 'normal', riskCount: 0 },
  { id: 'HT-2026-0840', name: '水电移民安置总包', companyId: 'c10', supplier: '地方移民开发公司', amount: '1.62 亿元', signDate: '2026-05-05', expireDate: '2029-06-30', payMethod: '年度拨款', category: '工程总包', status: '预警中', progress: 18, paidRatio: 12, risk: 'critical', riskCount: 5 },
  { id: 'HT-2026-0870', name: '海上风电安装船建造', companyId: 'c14', supplier: '招商局重工', amount: '8,600 万元', signDate: '2026-04-15', expireDate: '2028-04-30', payMethod: '里程碑付款', category: '工程总包', status: '履行中', progress: 58, paidRatio: 52, risk: 'medium', riskCount: 2 },
  { id: 'HT-2026-0900', name: '境外营地物资采购', companyId: 'c4', supplier: '盛通供应链', amount: '320 万元', signDate: '2026-05-18', expireDate: '2027-05-31', payMethod: '预付50%', category: '物资采购', status: '核查中', progress: 30, paidRatio: 50, risk: 'high', riskCount: 3 },
]

// 公司树
const companyTree = [
  { id: 'grp-s1', name: '电力能源板块', type: 'group', totalContracts: 8,
    children: [
      { id: 'sub-c1', name: '华东电力有限公司', contracts: ['HT-202605002', 'HT-202604015', 'HT-2026-0288'] },
      { id: 'sub-c8', name: '华北电网运营公司', contracts: ['HT-2026-0120'] },
      { id: 'sub-c9', name: '南方电力建设公司', contracts: ['HT-2026-0155'] },
      { id: 'sub-c10', name: '西南水电开发有限公司', contracts: ['HT-2026-0188', 'HT-2026-0840'] },
      { id: 'sub-c11', name: '东北热电联产公司', contracts: ['HT-2026-0220'] },
      { id: 'sub-c12', name: '华中智能电网科技', contracts: ['HT-2026-0250'] },
    ] },
  { id: 'grp-s2', name: '装备制造板块', type: 'group', totalContracts: 6,
    children: [
      { id: 'sub-c13', name: '精密机械制造公司', contracts: ['HT-2026-0300'] },
      { id: 'sub-c14', name: '海工装备工程公司', contracts: ['HT-2026-0330', 'HT-2026-0870'] },
      { id: 'sub-c15', name: '轨道交通设备集团', contracts: ['HT-2026-0360'] },
      { id: 'sub-c16', name: '特种材料科技公司', contracts: ['HT-2026-0390'] },
      { id: 'sub-c17', name: '智能焊接机器人公司', contracts: ['HT-2026-0420'] },
    ] },
  { id: 'grp-s3', name: '工程建设板块', type: 'group', totalContracts: 9,
    children: [
      { id: 'sub-c4', name: '海外工程总承包公司', contracts: ['HT-2026-0900'] },
      { id: 'sub-c5', name: '城市基建投资公司', contracts: ['HT-2026-0312', 'HT-2026-0551'] },
      { id: 'sub-c18', name: '路桥隧道工程集团', contracts: ['HT-202603008', 'HT-2026-0450'] },
      { id: 'sub-c19', name: '港口航道建设公司', contracts: ['HT-2026-0480'] },
      { id: 'sub-c20', name: '水利水电工程局', contracts: ['HT-2026-0510'] },
      { id: 'sub-c21', name: '机场建设指挥部', contracts: ['HT-2026-0540'] },
      { id: 'sub-c22', name: '铁路工程分公司', contracts: ['HT-2026-0570'] },
    ] },
  { id: 'grp-s4', name: '金融服务板块', type: 'group', totalContracts: 5,
    children: [
      { id: 'sub-c23', name: '融资租赁有限公司', contracts: ['HT-2026-0600'] },
      { id: 'sub-c24', name: '保险经纪公司', contracts: ['HT-2026-0630'] },
      { id: 'sub-c25', name: '产业基金管理公司', contracts: ['HT-2026-0660'] },
      { id: 'sub-c26', name: '信托投资事业部', contracts: ['HT-2026-0690'] },
    ] },
  { id: 'grp-s5', name: '科创与其他板块', type: 'group', totalContracts: 5,
    children: [
      { id: 'sub-c27', name: '人工智能研究院', contracts: ['HT-2026-0720'] },
      { id: 'sub-c28', name: '环保科技公司', contracts: ['HT-2026-0750'] },
      { id: 'sub-c29', name: '新材料研发中心', contracts: ['HT-2026-0780'] },
      { id: 'sub-c30', name: '生物技术孵化平台', contracts: ['HT-2026-0810'] },
    ] },
]

const expandedNodes = ref(new Set(companyTree.map(g => g.id)))

function toggleNode(id) {
  const s = new Set(expandedNodes.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedNodes.value = s
}

function contractById(id) { return contracts.find(c => c.id === id) ?? contracts[0] }

const activeContractId = ref('')
const activeStageIdx = ref(0)
const activeContract = computed(() => contracts.find(c => c.id === activeContractId.value))

// Stage map
const stagesMap = {
  'HT-202605002': [
    { id: 's1', tabLabel: '交付进度', nodes: [{ icon:'📄', label:'合同签订', value:'2.8亿', active:true },{ icon:'✅', label:'履约交付', value:'进度62%', active:true },{ icon:'💰', label:'付款节点', value:'1.8亿', active:true, warn:true }], risks:[{ id:'r1', level:'high', title:'超进度付款', desc:'付款64%超交付62%' },{ id:'r2', level:'medium', title:'节点延误', desc:'累计延期14天' }], chartType:'stage1' },
    { id: 's2', tabLabel: '交易金额', nodes: [{ icon:'📄', label:'合同', value:'5800元/吨', active:true },{ icon:'🛒', label:'采购订单', value:'CG-202605002', active:true },{ icon:'📋', label:'招标记录', value:'无竞争招标', active:true, warn:true }], risks:[{ id:'r3', level:'high', title:'未竞争性招标', desc:'直接委托采购' },{ id:'r4', level:'medium', title:'价格偏高', desc:'偏高11.5%' }], chartType:'stage2' },
    { id: 's3', tabLabel: '实施费用', nodes: [{ icon:'📄', label:'合同', value:'HT-202605002', active:true },{ icon:'🧾', label:'发票', value:'FP-202605003', active:true, warn:true }], risks:[{ id:'r5', level:'watch', title:'发票差异', desc:'金额差异约3%' }], chartType:'stage3' },
    { id: 's4', tabLabel: '项目资产', nodes: [{ icon:'📄', label:'合同', value:'HT-202605002', active:true },{ icon:'🏗', label:'项目关联', value:'苏州科技园', active:true }], risks:[{ id:'r7', level:'medium', title:'预算超支', desc:'钢材超预算11.5%' }], chartType:'stage4' },
  ],
  'HT-202604015': [
    { id: 's1', tabLabel: '交付进度', nodes: [{ icon:'📄', label:'合同签订', value:'3.2亿', active:true },{ icon:'✅', label:'履约交付', value:'进度80%', active:true }], risks:[{ id:'r1', level:'medium', title:'进度滞后', desc:'落后计划约5%' }], chartType:'stage1' },
    { id: 's2', tabLabel: '交易金额', nodes: [{ icon:'📄', label:'合同', value:'3.2亿', active:true },{ icon:'🛒', label:'采购订单', value:'CG-202604015', active:true }], risks:[], chartType:'stage2' },
    { id: 's3', tabLabel: '实施费用', nodes: [{ icon:'📄', label:'合同', value:'3.2亿', active:true }], risks:[], chartType:'stage3' },
    { id: 's4', tabLabel: '项目资产', nodes: [{ icon:'📄', label:'合同', value:'3.2亿', active:true }], risks:[], chartType:'stage4' },
  ],
  'HT-202603008': [
    { id: 's1', tabLabel: '交付进度', nodes: [{ icon:'📄', label:'合同签订', value:'2.6亿', active:true },{ icon:'✅', label:'履约交付', value:'进度100%', active:true }], risks:[], chartType:'stage1' },
    { id: 's2', tabLabel: '交易金额', nodes: [{ icon:'📄', label:'合同', value:'2.6亿', active:true }], risks:[], chartType:'stage2' },
    { id: 's3', tabLabel: '实施费用', nodes: [{ icon:'📄', label:'合同', value:'2.6亿', active:true }], risks:[], chartType:'stage3' },
    { id: 's4', tabLabel: '项目资产', nodes: [{ icon:'📄', label:'合同', value:'2.6亿', active:true }], risks:[], chartType:'stage4' },
  ],
}

// Default stages for contracts without explicit stages
function defaultStages(contract) {
  return [
    { id: 's1', tabLabel: '交付进度', nodes: [{ icon:'📄', label:'合同签订', value: contract.amount, active:true },{ icon:'✅', label:'履约交付', value: `进度${contract.progress}%`, active:true }], risks: contract.riskCount > 0 ? [{ id:'r1', level: contract.risk, title: '风险项', desc: `${contract.riskCount}项风险` }] : [], chartType:'stage1' },
    { id: 's2', tabLabel: '交易金额', nodes: [{ icon:'📄', label:'合同', value: contract.amount, active:true },{ icon:'🏭', label:'供应商', value: contract.supplier, active:true }], risks:[], chartType:'stage2' },
    { id: 's3', tabLabel: '实施费用', nodes: [{ icon:'📄', label:'合同', value: contract.id, active:true }], risks:[], chartType:'stage3' },
    { id: 's4', tabLabel: '项目资产', nodes: [{ icon:'📄', label:'合同', value: contract.id, active:true }], risks:[], chartType:'stage4' },
  ]
}

const activeStages = computed(() => stagesMap[activeContractId.value] ?? defaultStages(activeContract.value))
const currentStage = computed(() => activeStages.value[activeStageIdx.value] ?? activeStages.value[0])

const riskSummary = computed(() => {
  const result = []
  activeStages.value.forEach((stage, si) => {
    stage.risks.forEach(risk => {
      result.push({ ...risk, stageIdx: si, stageLabel: stage.tabLabel, active: true })
    })
  })
  return result
})
const totalRisks = computed(() => riskSummary.value.length)

function selectContract(id) { activeContractId.value = id; activeStageIdx.value = 0 }
function jumpToStage(idx) { activeStageIdx.value = idx }

// Risk detail view — 动态生成所有风险项的报告数据
const selectedRiskId = ref('')
const activeRisk = computed(() => {
  if (!selectedRiskId.value) return null
  // 在所有合同的风险项中查找匹配项
  for (const [contractId, items] of Object.entries(CONTRACT_RISK_ITEMS)) {
    const found = items.find(r => r.id === selectedRiskId.value)
    if (found) {
      const contract = contracts.find(c => c.id === contractId)
      const levelLabel = { high: '高风险', medium: '中风险', watch: '低风险', normal: '正常', critical: '重大风险' }
      const statusFlowMap = { pending: ['待核查', '核查中', '整改中', '已闭环'], checking: ['待核查', '核查中', '整改中', '已闭环'], fixing: ['待核查', '核查中', '整改中', '已闭环'] }
      const statusIdxMap = { pending: 0, checking: 1, fixing: 2 }
      // 生成具体化的风险描述
      const isPriceRisk = found.name.includes('价格')
      const supplierName = (found.subjects[1] || '供应商').replace(/^供应商/, '')
      const detailDesc = isPriceRisk
        ? `2026年05月16日，本单位与${supplierName}签订钢材采购合同（合同编号：${contractId}），约定钢材采购单价为5800元/吨，采购数量100吨，合同总金额58万元。系统监测发现，该单价与该供应商历史合作单价（5200元/吨）相比，异动幅度达11.5%，超过±10%的预警阈值，且高于同期同类型钢材市场公允价格（5500元/吨），触发中风险预警。`
        : `AI风险监测系统对合同 ${contractId} 进行动态扫描，发现风险项：${found.name}。经系统多维度交叉比对，该合同在关键风险指标上存在异常偏离，触发${levelLabel[found.level] || found.level}。涉及主体：${found.subjects.join('、')}，需进一步穿透核查确认风险成因。`
      // 对 HT-2026002 (钢材价格异动) 使用文档明确的元数据
      const isCanonicalSteel = found.id === 'HT-2026002'
      return {
        id: found.id,
        name: isCanonicalSteel ? '采购合同价格异动预警（钢材采购价格偏高）' : found.name,
        subName: found.name,
        level: found.level,
        alertTime: found.alertTime,
        source: '系统自动监测（合同价格与历史价格、市场价格比对）',
        subjects: found.subjects,
        contractRef: contractId,
        procurementRef: `CG-${contractId.slice(3)}`,
        status: found.status,
        statusFlow: statusFlowMap[found.statusKey] || ['待核查', '核查中', '整改中', '已闭环'],
        currentStatusIdx: statusIdxMap[found.statusKey] ?? 1,
        responsible: isCanonicalSteel ? 'XXX（采购部门）、XXX（监管部门）' : `${getCompanyName(contract?.companyId || '')}（采购部门）、集团监管部门`,
        deadline: isCanonicalSteel ? '2026-05-24' : '2026-05-31',
        contract: contract,
        riskItem: found,
        detailDescription: detailDesc,
      }
    }
  }
  return { id: selectedRiskId.value, name: '未知风险事项', subName: '', level: 'medium', alertTime: '', source: '', subjects: [], contractRef: '', procurementRef: '', status: '核查中', statusFlow: ['待核查', '核查中', '整改中', '已闭环'], currentStatusIdx: 1, responsible: '', deadline: '', detailDescription: '' }
})

function openRisk(id) {
  selectedRiskId.value = id
  pushViewHistory('risk-detail')
}

// ── 视图导航历史栈（用于返回） ──
const viewHistory = ref([])
function pushViewHistory(targetMode) {
  // 进入新视图前，把当前视图压入历史栈
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
function backToContractView() { viewHistory.value = []; viewMode.value = 'penetration' }
const backLabel = computed(() => {
  const prev = viewHistory.value[viewHistory.value.length - 1]
  if (prev === 'risk-detail') return '← 返回风险报告'
  if (prev === 'contract-detail') return '← 返回合同详情'
  return '← 返回合同智联仓库'
})

// Filtering
const selectedOrgId = ref(null)
const riskFilter = ref('all')
const drawerOpen = ref(false)
const peneTarget = ref(null)
const aiAnalysisResult = ref([])

const filteredContractsBase = computed(() => {
  if (!selectedOrgId.value) return contracts
  const grp = companyTree.find(g => g.id === selectedOrgId.value)
  if (grp) { const ids = grp.children.flatMap(b => b.contracts); return contracts.filter(c => ids.includes(c.id)) }
  for (const g of companyTree) {
    const br = g.children.find(b => b.id === selectedOrgId.value)
    if (br) return contracts.filter(c => br.contracts.includes(c.id))
  }
  return contracts
})

const riskFilters = computed(() => {
  const base = filteredContractsBase.value
  return [
    { value: 'all', label: '全部', count: base.length },
    { value: 'high', label: '高风险', count: base.filter(c => c.risk === 'high' || c.risk === 'critical').length },
    { value: 'medium', label: '中风险', count: base.filter(c => c.risk === 'medium').length },
    { value: 'watch', label: '低风险', count: base.filter(c => c.risk === 'watch').length },
    { value: 'normal', label: '正常', count: base.filter(c => c.risk === 'normal' || c.risk === 'low').length },
  ]
})

const filteredContracts = computed(() => {
  let base = filteredContractsBase.value
  if (riskFilter.value === 'high') base = base.filter(c => c.risk === 'high' || c.risk === 'critical')
  else if (riskFilter.value === 'normal') base = base.filter(c => c.risk === 'normal' || c.risk === 'low')
  else if (riskFilter.value !== 'all') base = base.filter(c => c.risk === riskFilter.value)
  // 按签订日期倒序排序（新签订的在前）
  return [...base].sort((a, b) => new Date(b.signDate) - new Date(a.signDate))
})

// Risk items from mock data
// 已分析过的风险ID集合（会话期间持久化，不会因切换合同丢失）
// 默认每个合同前 2 条风险项已预分析，省得用户每次都等动画
const analyzedRiskIds = ref(new Set(
  Object.values(CONTRACT_RISK_ITEMS).flatMap(items => items.slice(0, 2).map(r => r.id))
))
const activeRiskItems = computed(() => {
  const items = CONTRACT_RISK_ITEMS[activeContractId.value] ?? []
  return items.map(item => ({ ...item, analyzed: analyzedRiskIds.value.has(item.id) }))
})

// ── AI 智能体弹窗状态 ──
const aiAgentModal = ref(false)
const aiAgentSteps = ref([])
const aiAgentComplete = ref(false)
const aiAgentTargetId = ref('')
const aiElapsed = ref(0)
let aiTimer = null
let aiElapsedTimer = null
const aiStepDefs = [
  { text: '启动智能体分析引擎…', detail: 'DRP Agent v4.7 · 风险穿透模型已加载' },
  { text: '提取合同条款与元数据…', detail: '识别关键条款 8 项 · 结构化字段 24 个' },
  { text: '调用 NLP 条款风险解析模型…', detail: '命中风险规则库 120+ 条 · 匹配中' },
  { text: '比对历史合同价格与条款数据…', detail: '检索近 12 个月同类合同 5 份' },
  { text: '穿透关联采购记录与发票凭证…', detail: '已关联 3 条采购链路 · 2 条财务链路' },
  { text: '运行合规规则引擎交叉验证…', detail: '风险评估矩阵计算完成 · 置信度 94%' },
  { text: '生成 AI 风险分析报告…', detail: '报告已生成 · 包含 7 个章节' },
]

// Contract-specific AI agent steps
const aiContractStepDefs = [
  { text: '启动合同智能解析引擎…', detail: 'DRP Agent v4.7 · 合同全维度分析模型已加载' },
  { text: 'OCR 识别合同全文与附件…', detail: '识别 12 条关键条款 · 结构化 36 个字段' },
  { text: 'NLP 条款风险模式匹配…', detail: '命中风险规则库 120+ 条 · 匹配高风险模式' },
  { text: '比对同类型合同历史数据…', detail: '检索同类合同 24 份 · 构建基准对比集' },
  { text: '穿透关联采购/财务/履约链路…', detail: '已关联 5 条采购链路 · 3 条资金链路' },
  { text: '合规规则引擎交叉验证…', detail: '法务 · 财务 · 国资监管三维度交叉核验' },
  { text: '生成 AI 合规审查意见报告…', detail: '报告已生成 · 含风险评估、整改建议、监控方案' },
]

function analyzeRiskItem(item) {
  runAgentModal(aiStepDefs, item.id, () => {
    // Agent 完成后：记忆已分析 + 自动导航到风险详情报告
    analyzedRiskIds.value.add(item.id)
    analyzedRiskIds.value = new Set(analyzedRiskIds.value)
    setTimeout(() => { aiAgentModal.value = false; openRisk(item.id) }, 600)
  })
}

function goToRiskReport() {
  aiAgentModal.value = false
  clearInterval(aiTimer)
  clearInterval(aiElapsedTimer)
  // 如果是合同页面的 AI 解析，关闭弹窗回到合同详情（结果已在 analyzeCurrentContract 回调中设置）
  if (viewMode.value === 'contract-detail') {
    return
  }
  openRisk(aiAgentTargetId.value)
}

// AI agent modal — shared step engine
function runAgentModal(steps, targetId, onComplete) {
  aiAgentTargetId.value = targetId
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
  }, 600)
}

function analyzeCurrentContract() {
  runAgentModal(aiContractStepDefs, activeContractId.value, () => {
    // Agent modal 完成后，生成结果
    const c = activeContract.value
    const results = []
    if (c.risk === 'high' || c.risk === 'critical') {
      results.push({ level: 'high', title: '高风险合同预警', content: `本合同风险等级为${riskLabelMap[c.risk]}，存在${c.riskCount}项风险指标。风险条款：${c.riskClause || '无'}，付款比例${c.paidRatio}%超出履约进度${c.progress}%。`, suggest: '建议立即启动专项审计，冻结后续付款，待合同条款整改后再恢复执行。' })
    }
    if (c.paidRatio > c.progress + 2) {
      results.push({ level: 'high', title: '超进度付款风险', content: `付款进度${c.paidRatio}%超过履约进度${c.progress}%，差异${c.paidRatio - c.progress}个百分点，存在资金预付风险敞口，甲方丧失履约制衡手段。`, suggest: '立即暂停第4期付款，待交付进度追平后再行结算；加强现场验收管控。' })
    }
    if (c.riskCount > 0) {
      const names = (CONTRACT_RISK_ITEMS[c.id] || []).map(r => r.name).join('、')
      results.push({ level: 'medium', title: `${c.riskCount} 项关联风险待处置`, content: `该合同关联${c.riskCount}项风险事项：${names}。需逐项核查并落实整改措施。`, suggest: '按风险等级优先处置高风险项，每项分配责任人并设定整改期限。' })
    }
    results.push({ level: 'watch', title: '履约持续监测建议', content: `当前履约进度${c.progress}%，合同金额${c.amount}，供应商为${c.supplier}，合同到期日${c.expireDate}。`, suggest: '建议保持月度履约评估与现场检查，建立供应商履约档案，定期复盘合同执行情况。' })
    aiAnalysisResult.value = results
  })
}

function selectOrg(id) { selectedOrgId.value = id; riskFilter.value = 'all'; activeContractId.value = '' }
function openDrawer(contractId) { selectContract(contractId); drawerOpen.value = true }
function openContractDetail(contractId) {
  selectContract(contractId)
  pushViewHistory('contract-detail')
}
function openPenetration(target) { peneTarget.value = target }
function resolveAlert(type) {
  peneTarget.value = null
  if (type === 'reasonable') showToast('已录入合理异动说明，预警已解除，等待审批', 'info')
  else showToast('已标记违规异动，整改工单已派发至采购合规部', 'warn')
}

// Penetration data (from mock)
const peneDataMap = PRICE_PENETRATION_DATA

// EChart
const axisLine = { lineStyle: { color: '#e2e8f0' } }
const splitLine = { lineStyle: { color: '#f1f5f9' } }
const axLbl = (extra = {}) => ({ color: '#64748b', fontSize: 10, ...extra })
const nameTxt = { color: '#94a3b8', fontSize: 10 }
const legend = { top: 4, right: 4, textStyle: { color: '#64748b', fontSize: 11 }, itemWidth: 12, itemHeight: 8 }
const grad = (c1, c2) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: c1 }, { offset: 1, color: c2 }])

const stageChartOption = computed(() => {
  const type = currentStage.value.chartType
  const c = activeContract.value
  if (!c) return {}
  if (type === 'stage1') {
    const nodes = ['签约', '第1期', '第2期', '第3期', '第4期', '竣工']
    const progress = c.progress; const paid = c.paidRatio
    const d = [0, Math.round(progress*0.17), Math.round(progress*0.36), Math.round(progress*0.55), Math.round(progress*0.78), progress]
    const p = [0, Math.round(paid*0.2), Math.round(paid*0.4), Math.round(paid*0.6), Math.round(paid*0.8), paid]
    const a = [0, 0.28, 0.7, 1.26, 1.8, 2.8]
    return { backgroundColor:'transparent', animationDuration:1000, tooltip:{trigger:'axis'}, legend, grid:{left:48,right:56,top:32,bottom:24}, xAxis:{type:'category',data:nodes,axisLine,axisLabel:axLbl()}, yAxis:[{type:'value',name:'进度%',min:0,max:100,splitNumber:4,axisLabel:axLbl({formatter:'{value}%'}),splitLine,nameTextStyle:nameTxt},{type:'value',name:'亿元',axisLabel:axLbl(),splitLine:{show:false},nameTextStyle:nameTxt}], series:[{name:'付款金额',type:'bar',yAxisIndex:1,barWidth:20,data:a,itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(249,115,22,0.8)','rgba(249,115,22,0.12)')},label:{show:true,position:'top',color:'#ea580c',fontSize:10,formatter:'{c}'}},{name:'交付进度',type:'line',smooth:true,symbol:'circle',symbolSize:7,data:d,yAxisIndex:0,itemStyle:{color:'#2563eb'},lineStyle:{width:2.5,color:'#2563eb'},label:{show:true,color:'#1d4ed8',fontSize:9,formatter:'{c}%'}},{name:'付款进度',type:'line',smooth:true,symbol:'diamond',symbolSize:7,data:p,yAxisIndex:0,itemStyle:{color:'#ef4444'},lineStyle:{width:2.5,color:'#ef4444'},label:{show:true,color:'#dc2626',fontSize:9,formatter:'{c}%'}}] }
  }
  if (type === 'stage2') {
    return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'axis'},grid:{left:56,right:28,top:32,bottom:24},xAxis:{type:'category',data:['合同单价','市场均价','历史均价'],axisLine,axisLabel:axLbl()},yAxis:{type:'value',name:'元/吨',min:4800,max:6200,axisLabel:axLbl(),splitLine,nameTextStyle:nameTxt},series:[{name:'价格对比',type:'bar',barWidth:64,data:[{value:5800,itemStyle:{borderRadius:[8,8,0,0],color:grad('rgba(239,68,68,0.85)','rgba(239,68,68,0.12)')}},{value:5500,itemStyle:{borderRadius:[8,8,0,0],color:grad('rgba(37,99,235,0.75)','rgba(37,99,235,0.1)')}},{value:5200,itemStyle:{borderRadius:[8,8,0,0],color:grad('rgba(22,163,74,0.75)','rgba(22,163,74,0.1)')}}],label:{show:true,position:'top',fontWeight:700,fontSize:13,formatter:(p)=>`¥${p.value}`},markLine:{silent:true,data:[{yAxis:5500,lineStyle:{color:'#f59e0b',type:'dashed',width:2},label:{formatter:'市场参考价',color:'#d97706',fontSize:10,position:'insideEndTop'}}]}}] }
  }
  if (type === 'stage3') {
    return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'item'},legend:{orient:'vertical',left:12,top:'center',textStyle:{color:'#475569',fontSize:11},itemWidth:11,itemHeight:11},series:[{type:'pie',radius:['36%','66%'],center:['64%','50%'],label:{show:true,formatter:'{d}%',color:'#475569',fontSize:11},labelLine:{lineStyle:{color:'#cbd5e1'}},itemStyle:{borderColor:'#fff',borderWidth:3},data:[{name:'材料费',value:24800,itemStyle:{color:'#ef4444'}},{name:'运输费',value:1200,itemStyle:{color:'#3b82f6'}},{name:'管理费',value:680,itemStyle:{color:'#f59e0b'}},{name:'其他',value:320,itemStyle:{color:'#8b5cf6'}}]}] }
  }
  if (type === 'stage4') {
    return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'axis'},legend,grid:{left:56,right:20,top:32,bottom:24},xAxis:{type:'category',data:['钢材采购','运输费用','管理费','验收'],axisLine,axisLabel:axLbl()},yAxis:{type:'value',name:'万元',axisLabel:axLbl(),splitLine,nameTextStyle:nameTxt},series:[{name:'预算金额',type:'bar',barWidth:22,barGap:'15%',data:[24000,1200,600,200],itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(37,99,235,0.65)','rgba(37,99,235,0.1)')}},{name:'实际金额',type:'bar',barWidth:22,data:[26752,1200,680,168],itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(239,68,68,0.8)','rgba(239,68,68,0.12)')}}] }
  }
  return {}
})

</script>

<style scoped>
/* ──────────── 场景骨架 ──────────── */
.ct-scene { flex:1; min-height:0; background:#f8fafc; overflow:hidden; color:#1e293b; display:flex; flex-direction:column; font-size:14px; }

/* Toast */
.ct-toast { position:fixed; top:56px; left:50%; transform:translateX(-50%); z-index:100; display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:999px; font-size:13px; font-weight:600; white-space:nowrap; box-shadow:0 8px 24px rgba(15,23,42,0.12); }
.toast-info { background:#fff; border:1px solid #bfdbfe; color:#1d4ed8; }
.toast-warn { background:#fff; border:1px solid #fca5a5; color:#ef4444; }
.toast-icon { font-size:14px; }
.toast-fade-enter-active, .toast-fade-leave-active { transition:opacity .22s, transform .22s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity:0; transform:translate(-50%, -8px); }

/* Card */
.card { background:#fff; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 1px 8px rgba(15,23,42,0.05); }

/* ── 穿透视图 ── */
.ct-main { flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden; }

.kpi-row { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:8px; padding:10px 16px 0; flex-shrink:0; }
.kpi-card { padding:10px 12px; background:linear-gradient(160deg, var(--bg, #f8fafc) 0%, #fff 70%); border-left:4px solid var(--c, #2563eb); border-radius:10px; display:flex; flex-direction:column; gap:2px; }
.kc-head { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.kc-label { font-size:12px; font-weight:600; color:#475569; }
.kc-pill { font-size:10px; font-weight:600; padding:2px 7px; border-radius:999px; }
.kc-value { font-size:24px; font-weight:800; line-height:1.1; }
.kc-value small { font-size:12px; font-weight:500; color:#64748b; margin-left:3px; }
.kc-sub { font-size:11px; color:#94a3b8; }

.ct-body { flex:1; min-height:0; display:grid; grid-template-columns:260px minmax(0, 1fr) 520px; grid-template-rows:1fr; gap:8px; padding:8px 16px 10px; overflow:hidden; }
.ct-left, .ct-right { display:flex; flex-direction:column; gap:8px; min-height:0; overflow:hidden; }
.ct-center { min-height:0; overflow:hidden; }

.side-panel { display:flex; flex-direction:column; gap:9px; padding:10px; min-height:0; }
.sp-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.sp-head h3 { margin:0; font-size:13px; font-weight:800; color:#0f172a; }

.pill { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; }
.pill.blue { background:#eff6ff; color:#2563eb; }
.pill.red { background:#fef2f2; color:#ef4444; }

.risk-pill { display:inline-flex; align-items:center; padding:2px 7px; border-radius:999px; font-size:10px; font-weight:600; }
.rp-high, .rp-critical { background:#fef2f2; color:#ef4444; }
.rp-medium { background:#fff7ed; color:#f97316; }
.rp-watch { background:#fefce8; color:#a16207; }
.rp-normal, .rp-low { background:#f0fdf4; color:#16a34a; }

/* Tree */
.tree-panel { flex:1; min-height:0; }
.company-tree { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
.ctree-group { display:flex; flex-direction:column; gap:1px; }
.ctree-row { display:flex; align-items:center; gap:6px; width:100%; text-align:left; border:none; background:none; cursor:pointer; padding:6px 8px; border-radius:8px; transition:.14s; font-size:13px; }
.ctree-row:hover { background:#f1f5f9; }
.ctree-group-row { font-size:13px; font-weight:800; color:#0f172a; }
.ctree-branch-row { font-size:12px; font-weight:600; color:#334155; padding-left:18px; }
.ctree-arrow { display:inline-flex; width:14px; height:14px; align-items:center; justify-content:center; font-size:15px; font-weight:700; color:#94a3b8; flex-shrink:0; transform:rotate(0deg); transition:transform .18s; }
.ctree-arrow.open { transform:rotate(90deg); }
.ctree-ico { font-size:14px; flex-shrink:0; }
.ctree-name { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ctree-cnt { font-size:11px; font-weight:600; color:#94a3b8; white-space:nowrap; flex-shrink:0; }
.ctree-selected { background:#eff6ff; border-color:#93c5fd; }
.ctree-children { display:flex; flex-direction:column; gap:1px; padding-left:4px; }

/* Contract list */
.contract-list-panel { display:flex; flex-direction:column; gap:6px; padding:10px; height:100%; min-height:0; }
.cl-filter-bar { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-shrink:0; }
.cl-filter-tabs { display:flex; gap:4px; flex-wrap:wrap; }
.clf-tab { padding:5px 12px; border-radius:999px; border:1px solid #e2e8f0; background:#f8fafc; color:#475569; font-size:12px; font-weight:600; cursor:pointer; transition:.14s; display:flex; align-items:center; gap:4px; }
.clf-tab:hover, .clf-tab.active { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
.clf-count { font-size:10px; opacity:.7; }
.cl-total-tip { font-size:11px; color:#94a3b8; white-space:nowrap; }
.cl-list { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:6px; }
.cl-empty { text-align:center; padding:40px; color:#94a3b8; font-size:13px; }

/* Contract card - 3-zone layout */
.cl-card { padding:12px 14px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; cursor:pointer; transition:.14s; display:flex; flex-direction:column; gap:10px; border-left:3px solid #e2e8f0; }
.cl-card:hover { border-color:#bfdbfe; box-shadow:0 3px 10px rgba(37,99,235,0.08); }
.cl-card.cl-active { border-color:#93c5fd; background:#eff6ff; }
.cl-high { border-left-color:#ef4444; }
.cl-medium { border-left-color:#f97316; }
.cl-watch { border-left-color:#ca8a04; }
.cl-normal, .cl-low { border-left-color:#16a34a; }
.cl-critical { border-left-color:#dc2626; }

/* === 顶部三栏 === */
.clc-top-row { display:grid; grid-template-columns:minmax(0, 1fr) auto auto; gap:14px; align-items:center; }

/* 左：风险标识（含分级明细） */
.clc-risk-zone { display:flex; flex-direction:column; gap:3px; padding:5px 9px; border-radius:7px; background:#f1f5f9; border:1px solid #e2e8f0; flex-shrink:0; align-items:flex-start; min-width:104px; }
.crz-high, .crz-critical { background:#fef2f2; border-color:#fecaca; }
.crz-medium { background:#fff7ed; border-color:#fed7aa; }
.crz-watch { background:#fefce8; border-color:#fde68a; }
.crz-normal, .crz-low { background:#f0fdf4; border-color:#bbf7d0; }
.crz-top { display:flex; align-items:center; gap:5px; line-height:1.2; }
.crz-icon { font-size:13px; line-height:1; flex-shrink:0; }
.crz-level { font-size:11px; font-weight:800; color:#0f172a; white-space:nowrap; }
.crz-high .crz-level, .crz-critical .crz-level { color:#dc2626; }
.crz-medium .crz-level { color:#c2410c; }
.crz-watch .crz-level { color:#a16207; }
.crz-normal .crz-level, .crz-low .crz-level { color:#15803d; }

.crz-breakdown { display:flex; gap:3px; flex-wrap:wrap; }
.crz-chip { display:inline-flex; align-items:center; padding:0 5px; min-width:24px; height:15px; border-radius:999px; font-size:9px; font-weight:700; line-height:1; font-family:'JetBrains Mono', monospace; border:1px solid; }
.crz-chip-high { background:#fef2f2; color:#dc2626; border-color:#fca5a5; }
.crz-chip-medium { background:#fff7ed; color:#c2410c; border-color:#fdba74; }
.crz-chip-watch { background:#fefce8; color:#a16207; border-color:#fde68a; }
.crz-no-risk { font-size:9px; color:#64748b; }

/* 中：核心信息 */
.clc-core-zone { display:flex; flex-direction:column; gap:4px; min-width:0; }
.ccz-title { display:flex; align-items:baseline; gap:4px; min-width:0; }
.ccz-name { font-size:14px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ccz-id { font-size:11px; font-weight:600; color:#94a3b8; font-family:'JetBrains Mono', monospace; flex-shrink:0; }
.ccz-parties { display:flex; align-items:center; gap:4px; font-size:11px; color:#475569; flex-wrap:wrap; }
.ccz-parties em { font-style:normal; color:#94a3b8; }
.ccz-sep { color:#cbd5e1; }
.ccz-sign { display:flex; align-items:center; gap:4px; font-size:10px; color:#64748b; padding-top:2px; }
.ccz-sign-icon { font-size:11px; }
.ccz-sign em { font-style:normal; color:#94a3b8; }

/* 右：金额 + 状态 + 按钮 */
.clc-action-zone { display:flex; align-items:center; gap:14px; flex-shrink:0; }
.caz-meta { display:flex; flex-direction:column; align-items:flex-end; gap:3px; }
.caz-amount { font-size:17px; font-weight:800; line-height:1.1; }
.caz-status { font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0; }
.csp-high, .csp-critical { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
.csp-medium { background:#fff7ed; color:#c2410c; border-color:#fed7aa; }
.csp-watch { background:#fefce8; color:#a16207; border-color:#fde68a; }
.csp-normal, .csp-low { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; }
.caz-btns { display:flex; gap:6px; }
.caz-btn { padding:6px 14px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; transition:.14s; border:1px solid transparent; }
.caz-btn-ghost { background:#f8fafc; border-color:#e2e8f0; color:#64748b; }
.caz-btn-ghost:hover { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
.caz-btn-primary { background:#2563eb; border-color:#2563eb; color:#fff; box-shadow:0 2px 6px rgba(37,99,235,0.25); }
.caz-btn-primary:hover { background:#1d4ed8; border-color:#1d4ed8; box-shadow:0 4px 12px rgba(37,99,235,0.35); }

/* === 底部进度条（仅履约） === */
.clc-progress-row { display:flex; padding-top:8px; border-top:1px dashed #e2e8f0; }
.clc-progress-row .cpr-item { flex:1; min-width:0; }
.cpr-item { min-width:0; }
.cpr-head { display:flex; align-items:center; gap:6px; }
.cpr-label { font-size:11px; font-weight:600; color:#64748b; flex-shrink:0; min-width:28px; }
.cpr-bar-wrap { flex:1; min-width:0; position:relative; }
.cpr-bar { position:relative; height:6px; background:#f1f5f9; border-radius:999px; overflow:visible; }
.cpr-bar-fill { height:100%; border-radius:999px; transition:width .4s; }
/* 计划节点标记：黑点 + 虚线 + 可交互 tooltip */
.cpr-plan-mark { position:absolute; top:-5px; bottom:-5px; width:2px; background:#475569; border-radius:1px; transform:translateX(-1px); cursor:help; z-index:2; }
.cpr-plan-mark::after { content:''; position:absolute; top:-3px; left:-3px; width:8px; height:8px; border-radius:50%; background:#475569; border:1.5px solid #fff; box-shadow:0 0 0 1px #475569; transition:.15s; }
.cpr-plan-mark:hover::after { background:#2563eb; box-shadow:0 0 0 1px #2563eb, 0 0 0 4px rgba(37,99,235,0.18); }
.cpr-tooltip { position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%); background:#0f172a; color:#fff; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:500; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity .15s; box-shadow:0 4px 12px rgba(0,0,0,0.18); z-index:10; }
.cpr-tooltip::after { content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%); border:4px solid transparent; border-top-color:#0f172a; }
.cpr-plan-mark:hover .cpr-tooltip { opacity:1; }
.cpr-val { font-size:12px; font-weight:800; color:#0f172a; font-family:'JetBrains Mono', monospace; flex-shrink:0; min-width:36px; text-align:right; }
.cpr-plan-text { font-size:10px; color:#94a3b8; flex-shrink:0; font-weight:600; }
.cpr-plan-text.cpr-ok { color:#16a34a; }
.cpr-plan-text.cpr-over { color:#f97316; }
.cpr-plan-text.cpr-over-high { color:#ea580c; }
.cpr-plan-text.cpr-late { color:#eab308; }
.cpr-plan-text.cpr-late-high { color:#ef4444; }

.ci-progress-row { display:flex; align-items:center; gap:4px; }
.ci-prog-lbl { font-size:10px; color:#94a3b8; flex-shrink:0; }
.ci-prog-bar { flex:1; height:4px; background:#f1f5f9; border-radius:999px; overflow:hidden; min-width:0; }
.ci-prog-fill { height:100%; border-radius:999px; transition:width .4s; }
.ci-prog-val { font-size:10px; font-weight:700; color:#475569; flex-shrink:0; font-family:'JetBrains Mono', monospace; }
.ci-prog-sep { font-size:10px; color:#cbd5e1; flex-shrink:0; }

/* Risk items panel */
.risk-items-panel { display:flex; flex-direction:column; gap:8px; padding:10px; height:100%; min-height:0; }
.rip-contract-name { max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ri-list { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:6px; }

/* === 风险卡片（紧凑版，红橙黄三色） === */
.ri-card { padding:9px 12px; border-radius:8px; border:1px solid #e2e8f0; background:#fff; display:flex; flex-direction:column; gap:4px; border-left:4px solid #94a3b8; }
.ri-high, .ri-critical { border-left-color:#ef4444; background:linear-gradient(90deg, #fff5f5 0%, #fff 60%); }
.ri-medium { border-left-color:#f97316; background:linear-gradient(90deg, #fff8f1 0%, #fff 60%); }
.ri-watch { border-left-color:#eab308; background:linear-gradient(90deg, #fefce8 0%, #fff 60%); }

.ric-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ric-id-link { font-size:12px; font-weight:700; color:#2563eb; font-family:'JetBrains Mono', monospace; background:none; border:none; cursor:pointer; padding:0; text-align:left; text-decoration:underline; text-underline-offset:2px; flex-shrink:0; }
.ric-id-link:hover { color:#1d4ed8; }
.ric-name { font-size:13px; font-weight:700; color:#0f172a; line-height:1.35; }
.ric-time { font-size:10px; color:#94a3b8; margin-left:auto; flex-shrink:0; }

.ric-info-row { display:grid; grid-template-columns:auto 1fr; gap:4px 10px; align-items:center; padding-top:3px; }
.ric-info-lbl { font-size:10px; color:#94a3b8; flex-shrink:0; }
.ric-subjects { display:flex; flex-wrap:wrap; gap:4px; }
.ric-subject { font-size:10px; padding:1px 7px; border-radius:999px; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
.ric-index { font-size:10px; color:#64748b; line-height:1.5; font-family:'JetBrains Mono', monospace; }

.ric-status { font-size:10px; font-weight:700; padding:1px 7px; border-radius:999px; flex-shrink:0; }
.rics-checking { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.rics-pending { background:#fefce8; color:#a16207; border:1px solid #fde68a; }
.rics-fixing { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }

/* AI 分析按钮（紧凑横向版） */
.ric-ai-btn { position:relative; height:26px; padding:0 12px; border-radius:7px; border:none; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; overflow:hidden; transition:.2s; flex-shrink:0; }
.ric-ai-btn:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(102,126,234,0.4); }
.ric-ai-btn .ai-btn-icon { font-size:12px; }
.ai-btn-icon { font-size:16px; filter:drop-shadow(0 0 4px rgba(255,255,255,0.5)); }
.ai-btn-text { position:relative; z-index:1; }
.ai-btn-glow { position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); animation:ai-glow 2s ease-in-out infinite; }
@keyframes ai-glow { 0%,100% { transform:translateX(-100%); } 50% { transform:translateX(100%); } }

.ric-analyzing { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; color:#7c3aed; font-size:13px; font-weight:600; }
@keyframes spin { to { transform:rotate(360deg); } }
.di-spin-ring { width:18px; height:18px; border:2px solid #e2e8f0; border-top-color:#7c3aed; border-radius:50%; animation:spin .6s linear infinite; }
.di-spin-lbl { font-size:13px; }

.ric-report-btn { height:26px; padding:0 10px; border-radius:7px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:.14s; flex-shrink:0; }
.ric-report-btn:hover { background:#2563eb; color:#fff; border-color:#2563eb; }
.ric-report-btn span:first-child { font-size:12px; }

.domain-empty { text-align:center; padding:30px; color:#94a3b8; font-size:13px; }
.domain-clear { display:flex; align-items:center; gap:7px; padding:12px; border-radius:9px; background:#f0fdf4; border:1px solid #bbf7d0; font-size:12px; font-weight:600; color:#16a34a; }
.dc-icon { font-size:16px; }

/* Drawer */
.ct-drawer { position:fixed; inset:0; z-index:50; display:flex; }
.drawer-mask { position:absolute; inset:0; background:rgba(15,23,42,0.3); }
.drawer-panel { position:relative; margin:20px; flex:1; display:flex; flex-direction:column; gap:10px; padding:16px; overflow:hidden; }
.drawer-header { display:flex; justify-content:space-between; align-items:center; }
.drawer-title { display:flex; align-items:center; gap:10px; }
.drawer-contract-id { font-size:15px; font-weight:800; color:#2563eb; font-family:'JetBrains Mono', monospace; }
.drawer-subtitle { font-size:12px; color:#64748b; }
.drawer-close { width:32px; height:32px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#94a3b8; }
.drawer-close:hover { background:#f1f5f9; color:#334155; }
.drawer-chart { min-height:0; flex:1; }
.drawer-risk-section { border-top:1px solid #f1f5f9; padding-top:8px; display:flex; flex-direction:column; gap:6px; max-height:200px; overflow:hidden; }
.rs-section-head { display:flex; align-items:center; justify-content:space-between; }
.rs-section-title { font-size:12px; font-weight:800; color:#0f172a; }
.drawer-risk-list { display:flex; flex-direction:column; gap:5px; overflow-y:auto; min-height:0; }

.rs-item { padding:8px 10px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; transition:.14s; display:flex; flex-direction:column; gap:2px; }
.rs-item:hover { border-color:#93c5fd; }
.rs-high { border-left:3px solid #ef4444; background:#fff5f5; }
.rs-medium { border-left:3px solid #f97316; background:#fff8f1; }
.rs-watch { border-left:3px solid #ca8a04; background:#fefce8; }
.rs-top { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.rs-stage { font-size:10px; color:#94a3b8; font-weight:600; }
.rs-title { font-size:11px; font-weight:700; color:#0f172a; }
.rs-desc { font-size:10px; color:#64748b; line-height:1.4; }
.risk-clear { display:flex; align-items:center; gap:7px; padding:8px 12px; border-radius:8px; background:#f0fdf4; border:1px solid #bbf7d0; font-size:12px; font-weight:600; color:#16a34a; }

.stage-tabs { display:flex; gap:6px; flex-shrink:0; }
.stage-tab { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; color:#475569; font-size:13px; font-weight:600; cursor:pointer; transition:.14s; flex:1; justify-content:center; }
.stage-tab:hover, .stage-tab.active { border-color:#2563eb; background:#eff6ff; color:#1d4ed8; }
.sn { width:20px; height:20px; border-radius:50%; background:#dbeafe; color:#1d4ed8; font-size:11px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.stage-tab.active .sn { background:#2563eb; color:#fff; }
.risk-badge { background:#ef4444; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:999px; }

.drawer-slide-enter-active, .drawer-slide-leave-active { transition:opacity .25s; }
.drawer-slide-enter-from, .drawer-slide-leave-to { opacity:0; }

/* ── Risk detail view ── */
.rd-view { flex:1; min-height:0; display:flex; flex-direction:column; gap:8px; padding:10px 16px 12px; position:relative; }
.rd-topbar { flex-shrink:0; }
.rd-content { flex:1; min-height:0; display:grid; grid-template-columns:280px minmax(0, 1fr); gap:10px; }
.rd-sidebar { display:flex; flex-direction:column; gap:8px; min-height:0; overflow-y:auto; }
/* === Hero 卡：视觉重心 === */
.rd-hero-card { padding:14px 16px; display:flex; flex-direction:column; gap:8px; position:relative; overflow:hidden; border:none; }
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

/* === 关键信息卡 === */
.rd-key-card { padding:10px 12px; display:flex; flex-direction:column; gap:2px; }
.rdk-title { font-size:11px; font-weight:800; color:#0f172a; padding-bottom:6px; border-bottom:1px solid #f1f5f9; margin-bottom:4px; }
.rdk-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 4px; border-radius:6px; transition:.14s; }
.rdk-row.rdk-row-stack { flex-direction:column; align-items:flex-start; gap:3px; }
.rdk-row[onclick], .rdk-row:has(.link) { cursor:pointer; }
.rdk-row:has(.link):hover { background:#eff6ff; }
.rdk-lbl { font-size:11px; color:#64748b; font-weight:600; white-space:nowrap; }
.rdk-val { font-size:12px; font-weight:700; color:#0f172a; font-family:'JetBrains Mono', monospace; }
.rdk-val.link { color:#2563eb; }
.rdk-val-text { font-size:11px; color:#475569; font-weight:500; line-height:1.5; }
.rdk-subjects { display:flex; flex-direction:column; gap:2px; width:100%; }
.rdk-subjects strong { font-size:11px; color:#334155; font-weight:600; }

/* topbar 合同链接 */
.cd-contract-link { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; cursor:pointer; font-family:'JetBrains Mono', monospace; transition:.14s; }
.cd-contract-link:hover { background:#2563eb; color:#fff; border-color:#2563eb; }
.link-text { color:#2563eb; cursor:pointer; font-weight:700; text-decoration:underline; text-underline-offset:2px; }
.link-text:hover { color:#1d4ed8; }

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

.rd-actions-card { padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
.rda-title { font-size:11px; font-weight:800; color:#0f172a; padding-bottom:6px; border-bottom:1px solid #f1f5f9; }
.rda-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.rda-btn { height:30px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #e2e8f0; background:#f8fafc; color:#334155; transition:.14s; }
.rda-btn:hover { background:#eff6ff; border-color:#93c5fd; color:#1d4ed8; }
.rda-btn.primary { background:#2563eb; border-color:#2563eb; color:#fff; }
.rda-btn.primary:hover { background:#1d4ed8; }
.rda-btn.danger { background:#fef2f2; border-color:#fecaca; color:#ef4444; }
.rda-btn.danger:hover { background:#ef4444; color:#fff; }

.rd-main { min-height:0; }
.rd-report { height:100%; display:grid; grid-template-rows:auto minmax(0, 1fr); }
.rdr-header { padding:14px 20px 12px; border-bottom:1px solid #e2e8f0; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.rdr-header h2 { margin:0 0 4px; font-size:16px; font-weight:800; color:#0f172a; }
.rdr-header p { margin:0; font-size:12px; color:#64748b; }
.rdr-back-btn { height:30px; padding:0 12px; border-radius:8px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; cursor:pointer; transition:.16s; }
.rdr-back-btn:hover { border-color:#93c5fd; background:#dbeafe; }
.rdr-scroll { overflow-y:auto; padding:14px 20px; }
.rdr-section { margin-bottom:18px; }
.rdr-section.last-section { margin-bottom:0; }
.rdr-section-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:800; color:#0f172a; margin-bottom:8px; padding-bottom:5px; border-bottom:2px solid #eff6ff; }
.rsn-num { display:inline-flex; width:20px; height:20px; border-radius:50%; background:#2563eb; color:#fff; font-size:11px; font-weight:800; align-items:center; justify-content:center; flex-shrink:0; }
.rdr-para { margin:0; font-size:13px; line-height:1.8; color:#334155; }
.warn-text { color:#ef4444; font-weight:700; }
.rdr-def-box { padding:10px 14px; background:#fefce8; border:1px solid #fde68a; border-radius:10px; font-size:13px; line-height:1.75; color:#334155; }
.rdr-def-box strong { color:#b45309; }
.rdr-list { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:7px; }
.rdr-list li { font-size:13px; line-height:1.75; color:#334155; }
.inline-link { display:inline; font-size:inherit; font-weight:700; color:#2563eb; background:none; border:none; cursor:pointer; padding:0 1px; text-decoration:underline; text-underline-offset:2px; }
.inline-link:hover { color:#1d4ed8; background:#eff6ff; }
.inline-link.proc-link { color:#7c3aed; }

.price-compare { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin-top:10px; }
.price-compare-2col { grid-template-columns:repeat(3, minmax(0, 1fr)); }
.pc-item { padding:10px 12px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:4px; }
.pc-item.warn { background:#fff5f5; border-color:#fecaca; }
.pc-label { font-size:11px; color:#64748b; }
.pc-val { font-size:17px; font-weight:800; color:#0f172a; }
.pc-tag { width:fit-content; }

.evidence-cards { display:flex; flex-direction:column; gap:7px; }
.ev-card { display:grid; grid-template-columns:70px 1fr; gap:0 12px; align-items:start; padding:8px 12px 8px 0; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; overflow:hidden; position:relative; }
.ev-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--ev-c, #2563eb); border-radius:10px 0 0 10px; }
.ev-meta { display:flex; flex-direction:column; align-items:center; gap:3px; padding:2px 0 0 12px; }
.ev-num { font-size:13px; font-weight:800; font-family:'JetBrains Mono', monospace; color:var(--ev-c, #2563eb); }
.ev-badge { display:inline-flex; padding:2px 6px; border-radius:999px; font-size:10px; font-weight:700; background:var(--ev-bg, #eff6ff); color:var(--ev-c, #2563eb); white-space:nowrap; }
.ev-text { margin:0; font-size:12px; line-height:1.8; color:#334155; padding:2px 0; }
.ev-highlight { color:#ef4444; font-weight:800; }
.ev-contract { --ev-c:#2563eb; --ev-bg:#eff6ff; }
.ev-history { --ev-c:#16a34a; --ev-bg:#f0fdf4; }
.ev-proc { --ev-c:#7c3aed; --ev-bg:#f5f3ff; }
.ev-market { --ev-c:#f97316; --ev-bg:#fff7ed; }
.ev-finance { --ev-c:#ca8a04; --ev-bg:#fefce8; }
.rdr-conclusion-box { margin-top:10px; padding:10px 14px; background:#fef2f2; border:1px solid #fecaca; border-radius:10px; font-size:13px; color:#991b1b; line-height:1.7; }

.pene-link-groups { display:flex; flex-direction:column; gap:10px; }
.plg-group { display:flex; flex-direction:column; gap:6px; }
.plg-label { font-size:12px; font-weight:700; color:#475569; display:flex; align-items:center; gap:7px; }
.plg-nav-hint { font-size:11px; color:#7c3aed; font-weight:600; }
.plg-tags { display:flex; flex-wrap:wrap; gap:6px; }
.plg-tag { display:inline-flex; flex-direction:column; gap:1px; padding:5px 9px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; text-align:left; transition:.14s; }
.plg-tag:hover { border-color:#93c5fd; background:#eff6ff; }
.plg-tag.pene-active { border-color:#7c3aed; background:#f5f3ff; }
.plg-id { font-size:11px; font-weight:700; color:#2563eb; font-family:'JetBrains Mono', monospace; }
.plg-name { font-size:10px; color:#64748b; }
.plg-tag.proc-tag .plg-id { color:#7c3aed; }
.plg-tag.fin-tag .plg-id { color:#ca8a04; }

.proc-track { display:flex; flex-direction:column; gap:0; }
.pt-step { display:flex; align-items:flex-start; gap:10px; padding-bottom:14px; position:relative; }
.pt-step:last-child { padding-bottom:0; }
.pt-dot { width:10px; height:10px; border-radius:50%; border:2px solid #e2e8f0; background:#f8fafc; flex-shrink:0; margin-top:4px; z-index:1; }
.pt-step.done .pt-dot { background:#22c55e; border-color:#22c55e; }
.pt-step.current .pt-dot { background:#2563eb; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.18); }
.pt-step::after { content:''; position:absolute; left:4px; top:16px; width:1px; height:calc(100% - 14px); background:#e2e8f0; z-index:0; }
.pt-step:last-child::after { display:none; }
.pt-step.done::after { background:#22c55e; }
.pt-body { display:flex; flex-direction:column; gap:2px; }
.pt-body strong { font-size:13px; color:#0f172a; }
.pt-current-badge { font-size:10px; color:#2563eb; font-weight:700; }
.pt-meta-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid #f1f5f9; }
.ptm-item { display:flex; flex-direction:column; gap:2px; }
.ptm-item span { font-size:10px; color:#94a3b8; }
.ptm-item strong { font-size:12px; color:#0f172a; }

/* Penetration overlay */
.pene-overlay { position:fixed; inset:0; z-index:60; background:rgba(15,23,42,0.35); display:flex; align-items:center; justify-content:center; }
.pene-modal { width:720px; max-height:85vh; display:flex; flex-direction:column; gap:10px; padding:16px; overflow:hidden; }
.pene-head { display:flex; justify-content:space-between; align-items:center; }
.pene-head-left { display:flex; align-items:center; gap:8px; }
.pene-label { font-size:11px; font-weight:700; color:#7c3aed; background:#f5f3ff; padding:2px 8px; border-radius:999px; }
.pene-id { font-size:13px; font-weight:800; color:#0f172a; font-family:'JetBrains Mono', monospace; }
.pene-title { font-size:13px; color:#334155; font-weight:600; }
.pene-subtitle { font-size:11px; color:#94a3b8; padding-bottom:4px; border-bottom:1px solid #f1f5f9; }
.pene-body { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:8px; }
.pene-sec-title { font-size:12px; font-weight:800; color:#0f172a; margin-bottom:2px; }
.pene-table { width:100%; border-collapse:collapse; }
.pene-table th { padding:6px 8px; font-size:11px; color:#64748b; font-weight:700; text-align:left; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
.pene-table td { padding:8px; font-size:12px; color:#334155; border-bottom:1px solid #f1f5f9; }
.ptr-current { background:#eff6ff; }
.ptr-cur-badge { font-size:9px; font-weight:700; color:#2563eb; background:#dbeafe; padding:1px 5px; border-radius:999px; margin-left:4px; }
.ptr-price-high { color:#ef4444 !important; font-weight:800 !important; }
.ptr-status { font-size:10px; font-weight:600; }
.ptr-st-active { color:#2563eb; }
.ptr-st-done { color:#16a34a; }
.mono-cell { font-family:'JetBrains Mono', monospace; font-size:11px; color:#475569; }

.pene-kv-row { display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-bottom:1px solid #f1f5f9; }
.pene-kv-label { font-size:11px; color:#64748b; }
.pene-kv-val { font-size:12px; color:#0f172a; }
.pene-kv-green { color:#16a34a !important; }

.pene-compare-2col { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.pene-compare-col { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; }
.pene-compare-col-title { padding:8px 10px; background:#eff6ff; border-bottom:1px solid #e2e8f0; font-size:11px; font-weight:700; color:#1d4ed8; }

.pene-conclusion-box { padding:8px 12px; border-radius:8px; font-size:12px; line-height:1.6; }
.pene-conclusion-box.pene-warn { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; }
.pene-conclusion-box.pene-ok { background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; }

.pene-resolution { border-top:1px solid #f1f5f9; padding-top:8px; display:flex; flex-direction:column; gap:6px; }
.pene-res-title { font-size:12px; font-weight:800; color:#0f172a; }
.pene-res-desc { font-size:11px; color:#64748b; }
.pene-res-btns { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.prb-btn { padding:10px 14px; border-radius:10px; border:2px solid #e2e8f0; background:#f8fafc; cursor:pointer; display:flex; align-items:center; gap:8px; transition:.14s; }
.prb-btn:hover { border-color:#93c5fd; background:#eff6ff; }
.prb-resolve:hover { border-color:#86efac; background:#f0fdf4; }
.prb-escalate:hover { border-color:#fca5a5; background:#fef2f2; }
.prb-icon { font-size:16px; }
.prb-text { display:flex; flex-direction:column; text-align:left; }
.prb-text strong { font-size:12px; color:#0f172a; }
.prb-text em { font-size:10px; color:#64748b; font-style:normal; }

.pene-slide-enter-active, .pene-slide-leave-active { transition:opacity .2s; }
.pene-slide-enter-from, .pene-slide-leave-to { opacity:0; }

/* ── Contract detail view ── */
.cd-view { flex:1; min-height:0; overflow-y:auto; padding:10px 16px 12px; display:flex; flex-direction:column; gap:10px; }
.cd-topbar { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; flex-shrink:0; }
.cd-topbar-left { display:flex; align-items:center; gap:10px; }
.cd-id { font-size:14px; font-weight:800; color:#2563eb; font-family:'JetBrains Mono', monospace; }
.cd-status-pill { font-size:11px; font-weight:600; padding:2px 10px; border-radius:999px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.cd-topbar-right { display:flex; align-items:center; gap:10px; font-size:11px; color:#94a3b8; }
.cd-risk-flag { color:#ef4444 !important; }

.cd-body { display:flex; flex-direction:column; gap:8px; }
.cd-section { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; }
.cd-sec-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:800; color:#0f172a; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid #eff6ff; }
.cd-sec-num { display:inline-flex; width:22px; height:22px; border-radius:50%; background:#2563eb; color:#fff; font-size:12px; font-weight:800; align-items:center; justify-content:center; flex-shrink:0; }

.cd-three-col { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }
.cd-field-group { display:flex; flex-direction:column; gap:4px; }
.cd-fg-title { font-size:12px; font-weight:700; color:#64748b; padding-bottom:4px; border-bottom:1px solid #f1f5f9; margin-bottom:2px; }
.cd-field { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:3px 0; }
.cd-field span { font-size:11px; color:#94a3b8; white-space:nowrap; }
.cd-field strong { font-size:12px; color:#0f172a; text-align:right; }
.cd-field-row { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px 12px; }

.cd-four-col { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; }
.cd-four-col .cd-section { padding:12px; }

/* AI overview */
.cd-ai-overview { background:linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); border-color:#ddd6fe; }
.cd-ai-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px; }
.cd-ai-item { display:flex; flex-direction:column; gap:2px; padding:8px 12px; background:rgba(255,255,255,0.7); border-radius:8px; border:1px solid #e2e8f0; }
.cd-ai-item span { font-size:11px; color:#64748b; }
.cd-ai-item strong { font-size:14px; color:#0f172a; }

/* Amount cards */
.cd-amount-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; }
.cd-amount-card { padding:10px 12px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:4px; }
.cd-amount-card span { font-size:11px; color:#64748b; }
.cd-amount-card strong { font-size:15px; color:#0f172a; font-weight:800; }
.cd-amount-card em { font-size:10px; color:#94a3b8; font-style:normal; }
.cd-amount-total { border-color:#bfdbfe; background:#eff6ff; }
.cd-amount-total strong { color:#2563eb; }
.cd-amount-warn { border-color:#fecaca; background:#fef2f2; }
.cd-amount-warn strong { color:#ef4444; }

/* AI opinion suggest */
.cd-op-suggest { font-size:11px; color:#1d4ed8; padding-top:4px; border-top:1px solid #f1f5f9; }
.cd-core-risk-inline { font-size:11px; color:#ef4444; font-weight:600; }

/* AI button area */
.cd-ai-action { display:flex; flex-direction:column; gap:10px; }
.cd-ai-btn { position:relative; width:100%; padding:18px 24px; border-radius:14px; border:2px solid transparent; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; overflow:hidden; transition:.2s; }
.cd-ai-btn:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(102,126,234,0.45); }
.cd-ai-btn-icon { font-size:24px; filter:drop-shadow(0 0 6px rgba(255,255,255,0.5)); }
.cd-ai-btn-text { font-size:17px; font-weight:800; position:relative; z-index:1; }
.cd-ai-btn-sub { font-size:13px; opacity:.85; position:relative; z-index:1; }
.cd-ai-btn-glow { position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); animation:ai-glow 2s ease-in-out infinite; }

.cd-ai-result { display:flex; flex-direction:column; gap:6px; }
.cd-ai-result-title { font-size:14px; font-weight:800; color:#0f172a; }
.cd-opinion-item { padding:10px 14px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; display:flex; flex-direction:column; gap:4px; }
.cd-op-high { border-left:3px solid #ef4444; background:#fff5f5; }
.cd-op-medium { border-left:3px solid #f97316; background:#fff8f1; }
.cd-op-watch { border-left:3px solid #ca8a04; background:#fefce8; }
.cd-op-head { display:flex; align-items:center; gap:8px; }
.cd-op-title { font-size:13px; font-weight:700; color:#0f172a; }
.cd-op-body { font-size:13px; color:#334155; line-height:1.6; }

/* Link tags */
.link-tag { display:inline-flex; align-items:center; gap:3px; padding:3px 8px; border-radius:999px; font-size:10px; font-weight:600; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; }
.link-tag em { font-style:normal; font-size:9px; color:#64748b; }
.lt-invoice { background:#fefce8; border-color:#fde68a; color:#b45309; }
.lt-voucher { background:#f5f3ff; border-color:#ddd6fe; color:#7c3aed; }
.lt-approval { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }
.lt-inquiry { background:#fff7ed; border-color:#fed7aa; color:#c2410c; }
.lt-procurement { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }

/* ── AI 智能体步骤弹窗 ── */
.ai-agent-overlay { position:fixed; inset:0; z-index:100; background:rgba(15,23,42,0.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; }
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
.ai-step-spin { width:18px; height:18px; border:2px solid rgba(99,102,241,0.3); border-top-color:#818cf8; border-radius:50%; animation:spin .7s linear infinite; }
.ai-step-check { width:22px; height:22px; border-radius:50%; background:rgba(16,185,129,0.2); color:#10b981; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; }
.ai-step-content { flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
.ai-step-text { font-size:13px; color:#cbd5e1; font-weight:500; }
.ai-step-detail { font-size:11px; color:#64748b; }
.ai-step-time { font-size:12px; color:#6366f1; font-family:'JetBrains Mono', monospace; flex-shrink:0; }

.ai-agent-footer { display:flex; flex-direction:column; gap:12px; border-top:1px solid rgba(99,102,241,0.15); padding-top:16px; }
.ai-agent-result { display:flex; align-items:center; gap:8px; color:#10b981; font-size:14px; font-weight:600; }
.ai-result-icon { width:24px; height:24px; border-radius:50%; background:rgba(16,185,129,0.2); display:flex; align-items:center; justify-content:center; font-size:13px; }
.ai-agent-btn { width:100%; height:44px; border-radius:12px; border:none; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:#fff; font-size:15px; font-weight:700; cursor:pointer; transition:.2s; letter-spacing:0.04em; }
.ai-agent-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(99,102,241,0.45); }

@keyframes spin { to { transform:rotate(360deg); } }

.agent-fade-enter-active { transition:opacity .25s; }
.agent-fade-leave-active { transition:opacity .2s; }
.agent-fade-enter-from, .agent-fade-leave-to { opacity:0; }
</style>
