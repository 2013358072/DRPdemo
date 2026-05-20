<template>
  <div class="ct-scene">


    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="toastVisible" class="ct-toast" :class="`toast-${toastType}`">
        <span class="toast-icon">{{ toastType === 'warn' ? '⚠' : '✓' }}</span>
        {{ toastText }}
      </div>
    </transition>

    <!-- ══════════ 四阶段穿透视图 ══════════ -->
    <template v-if="viewMode === 'penetration'">
      <div class="ct-main">
       
        <section class="kpi-row">
          <article
            v-for="kpi in kpiCards"
            :key="kpi.label"
            class="card kpi-card"
            :style="{ '--c': kpi.color, '--bg': kpi.bg }"
          >
            <div class="kc-head">
              <span class="kc-label">{{ kpi.label }}</span>
              <span class="kc-pill" :style="{ background: kpi.pillBg, color: kpi.color }">{{ kpi.badge }}</span>
            </div>
            <div class="kc-value" :style="{ color: kpi.color }">{{ kpi.value }}<small>{{ kpi.unit }}</small></div>
            <div class="kc-sub">{{ kpi.sub }}</div>
          </article>
        </section>

        <div class="ct-body">

          <!-- 左：机构树（仅集团/公司/分公司） -->
          <aside class="ct-left">
            <div class="card side-panel tree-panel">
              <div class="sp-head">
                <h3>合同智联仓库</h3>
                <span class="pill blue">{{ companyTree.length }} 集团</span>
              </div>
              <div class="company-tree micro-scroll">
                <!-- 全部 -->
                <button
                  class="ctree-row ctree-all-row"
                  :class="{ 'ctree-selected': selectedOrgId === null }"
                  type="button"
                  @click="selectOrg(null)"
                >
                  <span class="ctree-ico">🗂</span>
                  <span class="ctree-name">全部机构</span>
                  <span class="ctree-cnt">{{ contracts.length }} 份</span>
                </button>
                <div v-for="grp in companyTree" :key="grp.id" class="ctree-group">
                  <button
                    class="ctree-row ctree-group-row"
                    :class="{ 'ctree-selected': selectedOrgId === grp.id }"
                    type="button"
                    @click="selectOrg(grp.id); toggleNode(grp.id)"
                  >
                    <span class="ctree-arrow" :class="{ open: expandedNodes.has(grp.id) }">›</span>
                    <span class="ctree-ico">🏢</span>
                    <span class="ctree-name">{{ grp.name }}</span>
                    <span class="ctree-cnt">{{ grp.totalContracts }} 份</span>
                  </button>
                  <div v-show="expandedNodes.has(grp.id)" class="ctree-children">
                    <div v-for="br in grp.children" :key="br.id">
                      <button
                        class="ctree-row ctree-branch-row"
                        :class="{ 'ctree-selected': selectedOrgId === br.id }"
                        type="button"
                        @click="selectOrg(br.id)"
                      >
                        <span class="ctree-ico" style="margin-left:12px">🏬</span>
                        <span class="ctree-name">{{ br.name }}</span>
                        <span class="ctree-cnt">{{ br.contracts.length }} 份</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- 中：合同列表 + 风险筛选 -->
          <main class="ct-center">
            <div class="card contract-list-panel">
              <!-- 筛选栏 -->
              <div class="cl-filter-bar">
                <div class="cl-filter-tabs">
                  <button
                    v-for="f in riskFilters"
                    :key="f.value"
                    type="button"
                    class="clf-tab"
                    :class="{ active: riskFilter === f.value }"
                    @click="riskFilter = f.value"
                  >{{ f.label }}<span v-if="f.count !== undefined" class="clf-count">{{ f.count }}</span></button>
                </div>
                <span class="cl-total-tip">共 {{ filteredContracts.length }} 份</span>
              </div>

              <!-- 合同卡片列表 -->
              <div class="cl-list micro-scroll">
                <div
                  v-for="c in filteredContracts"
                  :key="c.id"
                  class="cl-card"
                  :class="[`cl-${c.risk}`, { 'cl-active': activeContractId === c.id }]"
                  @click="selectContract(c.id)"
                >
                  <div class="clc-top">
                    <div class="clc-id-row">
                      <span class="clc-id">{{ c.id }}</span>
                      <span class="risk-pill" :class="`rp-${c.risk}`">{{ riskLabelMap[c.risk] }}</span>
                      <span v-if="c.riskCount" class="clc-risk-cnt">⚠ {{ c.riskCount }} 项</span>
                    </div>
                    <div class="clc-name">{{ c.name }}</div>
                  </div>
                  <div class="clc-badges">
                    <span class="ci-badge ci-badge-cat">{{ c.category }}</span>
                    <span class="ci-badge" :class="`ci-status-${c.risk}`">{{ c.status }}</span>
                  </div>
                  <div class="clc-meta-row">
                    <span class="clc-supplier">{{ c.supplier }}</span>
                    <strong class="clc-amount" :style="{ color: riskColor[c.risk] }">{{ c.amount }}</strong>
                  </div>
                  <div class="ci-dates">
                    <span>签订 {{ c.signDate }}</span>
                    <span>到期 {{ c.expireDate }}</span>
                    <span>{{ c.payMethod }}</span>
                  </div>
                  <div class="ci-progress-row">
                    <span class="ci-prog-lbl">履约</span>
                    <div class="ci-prog-bar"><div class="ci-prog-fill" :style="{ width: c.progress + '%', background: riskColor[c.risk] }"></div></div>
                    <span class="ci-prog-val">{{ c.progress }}%</span>
                    <span class="ci-prog-sep">·</span>
                    <span class="ci-prog-lbl">付款</span>
                    <span class="ci-prog-val" :style="{ color: c.paidRatio > c.progress ? '#ef4444' : '#16a34a' }">{{ c.paidRatio }}%</span>
                  </div>
                  <div class="clc-actions" @click.stop>
                    <button type="button" class="clc-btn clc-btn-chart" @click="openDrawer(c.id)">📊 分析图谱</button>
                    <button type="button" class="clc-btn clc-btn-detail" @click="openContractDetail(c.id)">📄 合同详情</button>
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
                <h3>风险项</h3>
                <span v-if="activeContract" class="rip-contract-name pill blue" :title="activeContract.name">{{ activeContract.name }}</span>
                <span v-else class="pill" style="font-size:9px;color:#94a3b8">点击合同查看</span>
              </div>

              <div class="ri-list micro-scroll">
                <div
                  v-for="item in activeRiskItems"
                  :key="item.id"
                  class="ri-card"
                  :class="`ri-${item.level}`"
                >
                  <!-- 顶行：ID · 等级 · 状态 -->
                  <div class="ric-head">
                    <span class="ric-id">{{ item.id }}</span>
                    <span class="risk-pill" :class="`rp-${item.level}`">{{ riskLabelMap[item.level] }}</span>
                    <span class="ric-status" :class="`rics-${item.statusKey}`">{{ item.status }}</span>
                  </div>
                  <!-- 事项名称 -->
                  <div class="ric-name">{{ item.name }}</div>
                  <!-- 预警时间 -->
                  <div class="ric-meta-row">
                    <span class="ric-time">⏱ {{ item.alertTime }}</span>
                  </div>
                  <!-- 涉及主体 -->
                  <div class="ric-subjects">
                    <span v-for="s in item.subjects" :key="s" class="ric-subject">{{ s }}</span>
                  </div>
                  <!-- 关联索引 -->
                  <div class="ric-index">🔗 {{ item.relatedIndex }}</div>
                  <!-- AI 分析三态按钮 -->
                  <div class="ric-footer" @click.stop>
                    <button v-if="!item.analyzing && !item.analyzed" class="ric-ai-btn" @click="analyzeRiskItem(item)">✦ AI 分析</button>
                    <span v-else-if="item.analyzing" class="ric-analyzing">
                      <span class="di-spin-ring"></span>
                      <span class="di-spin-lbl">分析中…</span>
                    </span>
                    <button v-else class="ric-report-btn" @click="openRisk(item.id)">查看风险报告 ›</button>
                  </div>
                </div>

                <div v-if="!activeContract" class="domain-empty">请先在中间列表选择合同</div>
                <div v-else-if="activeRiskItems.length === 0" class="domain-clear">
                  <span class="dc-icon">✓</span>
                  <span>当前合同无风险项记录</span>
                </div>
              </div>

              <div v-if="activeContract && activeRiskItems.length" class="action-btns" style="padding-top:8px;border-top:1px solid #f1f5f9">
                <button type="button" class="act-btn primary" @click="showToast('整改工单已派发至合规部', 'info')">派发整改工单</button>
                <button type="button" class="act-btn danger"  @click="showToast('风险预警已推送至责任人', 'warn')">发起风险预警</button>
              </div>
            </div>
          </aside>
        </div>

        <!-- 侧拉抽屉：穿透图 + 风险核查摘要 -->
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
              <!-- 阶段 tabs -->
              <div class="stage-tabs">
                <button
                  v-for="(stage, i) in activeStages"
                  :key="stage.id"
                  type="button"
                  class="stage-tab"
                  :class="{ active: activeStageIdx === i, 'has-risk': stage.risks.length > 0 }"
                  @click="activeStageIdx = i"
                >
                  <span class="sn">{{ i + 1 }}</span>{{ stage.tabLabel }}
                  <span v-if="stage.risks.length" class="risk-badge">{{ stage.risks.length }}</span>
                </button>
              </div>
              <!-- 图表 -->
              <div class="drawer-chart">
                <EChart :option="stageChartOption" />
              </div>
              <!-- 风险摘要 -->
              <div class="drawer-risk-section">
                <div class="rs-section-head">
                  <span class="rs-section-title">风险核查摘要</span>
                  <span class="pill red" style="font-size:10px">{{ totalRisks }} 项</span>
                </div>
                <div class="drawer-risk-list micro-scroll">
                  <template v-if="riskSummary.length">
                    <div v-for="(item, i) in riskSummary" :key="i" class="rs-item" :class="`rs-${item.level}`" @click="jumpToStage(item.stageIdx)">
                      <div class="rs-top">
                        <span class="rs-stage">阶段 {{ item.stageIdx + 1 }}・{{ item.stageLabel }}</span>
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
        <!-- 顶栏（对齐合同详情样式） -->
        <div class="cd-topbar rd-topbar">
          <div class="cd-topbar-left">
            <button type="button" class="rdr-back-btn" @click="backToContractView">← 返回合同智联仓库</button>
            <span class="cd-id">{{ activeRisk.id }}</span>
            <span class="risk-pill" :class="`rp-${activeRisk.level}`">{{ riskLevelLabel[activeRisk.level] }}</span>
          </div>
          <div class="cd-topbar-right">
            <span class="cd-status-pill" style="background:#fff7ed;border-color:#fed7aa;color:#c2410c">{{ activeRisk.status }}</span>
            <span style="font-size:10px;color:#94a3b8">生成时间：{{ activeRisk.alertTime }}</span>
          </div>
        </div>

        <div class="rd-content">
        <!-- 左侧：报告元信息 + 操作 -->
        <aside class="rd-sidebar">

          <!-- 风险基本信息 -->
          <div class="card rd-meta-card">
            <div class="rdm-id-row">
              <span class="rdm-id">{{ activeRisk.id }}</span>
              <span class="risk-pill" :class="`rp-${activeRisk.level}`">{{ riskLevelLabel[activeRisk.level] }}</span>
            </div>
            <div class="rdm-name">{{ activeRisk.name }}</div>
            <div class="rdm-subname">{{ activeRisk.subName }}</div>
            <div class="rdm-rows">
              <div class="rdm-row"><span>预警时间</span><strong>{{ activeRisk.alertTime }}</strong></div>
              <div class="rdm-row"><span>预警来源</span><strong>{{ activeRisk.source }}</strong></div>
              <div class="rdm-row"><span>涉及主体</span>
                <div class="rdm-subjects">
                  <strong v-for="s in activeRisk.subjects" :key="s">{{ s }}</strong>
                </div>
              </div>
              <div class="rdm-row"><span>合同编号</span><strong class="link-text" @click="showToast('已定位合同 HT-202605002', 'info')">{{ activeRisk.contractRef }}</strong></div>
              <div class="rdm-row"><span>采购编号</span><strong class="link-text" @click="navigateToProcurement">{{ activeRisk.procurementRef }}</strong></div>
            </div>
          </div>

          <!-- 处理状态流 -->
          <div class="card rd-status-card">
            <div class="rds-title">处理进度跟踪</div>
            <div class="status-flow">
              <div
                v-for="(step, si) in activeRisk.statusFlow"
                :key="step"
                class="sf-step"
                :class="{ done: si < activeRisk.currentStatusIdx, current: si === activeRisk.currentStatusIdx }"
              >
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

          <!-- 操作区 -->
          <div class="card rd-actions-card">
            <div class="rda-title">核查操作</div>
            <button type="button" class="rda-btn primary" @click="showToast('核查工单已派发至采购部门', 'info')">派发核查工单</button>
            <button type="button" class="rda-btn danger"  @click="showToast('风险升级预警已推送至监管部门', 'warn')">升级风险预警</button>
            <button type="button" class="rda-btn"         @click="showToast('已补充价格异动说明，待审核', 'info')">补充说明材料</button>
            <button type="button" class="rda-btn"         @click="showToast('已提交解除预警申请，待审批', 'info')">申请解除预警</button>
            <button type="button" class="rda-btn ghost"   @click="showToast('已纳入月度合规台账', 'info')">纳入台账</button>
          </div>

        </aside>

        <!-- 右侧：报告正文 -->
        <div class="rd-main">
          <div class="card rd-report">
            <div class="rdr-header">
              <div class="rdr-header-left">
                <h2>风险事项详情报告</h2>
                <p>合同管理域 · 采购合同价格异动预警 · 自动生成报告</p>
              </div>
            </div>

            <div class="rdr-scroll">

              <!-- 第一节 -->
              <div class="rdr-section">
                <div class="rdr-section-title"><span class="rsn-num">一</span>风险预警事项</div>
                <p class="rdr-para">
                  2026年05月16日，本单位与XX建材有限公司签订钢材采购合同（合同编号：<button class="inline-link" @click="showToast('已定位至合同详情 HT-202605002', 'info')">HT-202605002</button>），约定钢材采购单价为<strong>5800元/吨</strong>，采购数量100吨，合同总金额58万元。系统监测发现，该单价与该供应商历史合作单价（5200元/吨）相比，异动幅度达<strong class="warn-text">11.5%</strong>，超过±10%的预警阈值，且高于同期同类型钢材市场公允价格（5500元/吨），触发<strong class="warn-text">中风险预警</strong>。
                </p>
              </div>

              <!-- 第二节 -->
              <div class="rdr-section">
                <div class="rdr-section-title"><span class="rsn-num">二</span>风险定义</div>
                <div class="rdr-def-box">
                  <strong>采购合同价格异动</strong>：指采购类合同（物资/服务/工程）的标的单价，与该供应商历史合作单价、同期同类型标的市场公允价格、同期其他供应商合作单价相比，异动幅度超过<strong>±10%（自定义阈值）</strong>，且无合理说明（如原材料涨价、规格升级）的情况，可能存在围标串标、经办人串通、价格虚报等风险。
                </div>
              </div>

              <!-- 第三节 -->
              <div class="rdr-section">
                <div class="rdr-section-title"><span class="rsn-num">三</span>计算逻辑</div>
                <ol class="rdr-list">
                  <li><strong>筛选条件：</strong>采购类合同，标的为可量化物资（钢材、水泥等）或标准化服务；</li>
                  <li><strong>比对数据：</strong>① 该供应商近12个月同类标的历史合同单价；② 同期同类型标的市场公允价格（系统对接第三方价格平台）；③ 同期其他供应商同类标的合同单价；</li>
                  <li><strong>异动计算：</strong>（本次合同单价 − 比对单价）/ 比对单价 × 100%；</li>
                  <li><strong>预警触发：</strong>任一比对维度异动幅度 ＞ ±10%，且无合理说明文档，触发预警。</li>
                </ol>
                <!-- 价格对比小卡 -->
                <div class="price-compare">
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

              <!-- 第四节 -->
              <div class="rdr-section">
                <div class="rdr-section-title"><span class="rsn-num">四</span>原因分析（结合穿透数据）</div>
                <div class="evidence-cards">
                  <!-- 01 合同端 -->
                  <div class="ev-card ev-contract">
                    <div class="ev-meta">
                      <span class="ev-num">01</span>
                      <span class="ev-badge">合同端</span>
                    </div>
                    <p class="ev-text">
                      合同 <button class="inline-link" @click="showToast('已定位至合同详情 HT-202605002', 'info')">HT-202605002</button>
                      约定钢材规格 Φ16mm 螺纹钢，单价 <strong>5800 元/吨</strong>，合同正文未标注价格偏高说明，签订人为 XXX（采购经办人）。
                    </p>
                  </div>
                  <!-- 02 历史数据 -->
                  <div class="ev-card ev-history">
                    <div class="ev-meta">
                      <span class="ev-num">02</span>
                      <span class="ev-badge">历史数据</span>
                    </div>
                    <p class="ev-text">
                      供应商近 12 个月同类采购合同
                      <button class="inline-link" @click="showToast('已加载历史合同 HT-202602003 详情', 'info')">HT-202602003</button>
                      单价 <strong>5200 元/吨</strong>，规格一致，同期无明显市场波动，本次涨幅达
                      <strong class="ev-highlight">11.5%</strong>，触发异动阈值。
                    </p>
                  </div>
                  <!-- 03 采购端 -->
                  <div class="ev-card ev-proc">
                    <div class="ev-meta">
                      <span class="ev-num">03</span>
                      <span class="ev-badge">采购端</span>
                    </div>
                    <p class="ev-text">
                      询价记录 <button class="inline-link proc-link" @click="navigateToProcurement">XJ-202605002</button>
                      仅询价 <strong>2 家</strong>供应商（5800 / 5750 元/吨），未进行公开招标，询价范围过窄，缺乏充分竞争。
                    </p>
                  </div>
                  <!-- 04 市场数据 -->
                  <div class="ev-card ev-market">
                    <div class="ev-meta">
                      <span class="ev-num">04</span>
                      <span class="ev-badge">市场数据</span>
                    </div>
                    <p class="ev-text">
                      第三方价格平台
                      <button class="inline-link" @click="showToast('市场价格数据来源：第三方钢材价格平台 SJ-20260517001', 'info')">SJ-20260517001</button>
                      显示同期公允价 <strong>5500 元/吨</strong>，本次合同单价偏高市场价
                      <strong class="ev-highlight">5.45%</strong>。
                    </p>
                  </div>
                  <!-- 05 财务端 -->
                  <div class="ev-card ev-finance">
                    <div class="ev-meta">
                      <span class="ev-num">05</span>
                      <span class="ev-badge">财务端</span>
                    </div>
                    <p class="ev-text">
                      发票 <button class="inline-link" @click="showToast('已加载发票详情 FP-202605003', 'info')">FP-202605003</button>
                      标注单价 5800 元/吨与合同一致，但未附价格异动说明及市场价格佐证资料，凭证链路存在缺口。
                    </p>
                  </div>
                </div>
                <div class="rdr-conclusion-box">
                  综上，该合同价格异动无明确合理说明，询价流程不规范，可能存在采购经办人与供应商串通、未充分比价导致价格偏高的风险。
                </div>
              </div>

              <!-- 第五节 -->
              <div class="rdr-section">
                <div class="rdr-section-title"><span class="rsn-num">五</span>关联数据穿透链接</div>
                <div class="pene-link-groups">
                  <div class="plg-group">
                    <div class="plg-label">合同域</div>
                    <div class="plg-tags">
                      <button type="button" class="plg-tag" @click="showToast('已定位合同详情 HT-202605002', 'info')">
                        <span class="plg-id">HT-202605002</span><span class="plg-name">本次合同详情</span>
                      </button>
                      <button type="button" class="plg-tag pene-active" @click="openPenetration('supplier')">
                        <span class="plg-id">HT-202602003</span><span class="plg-name">供应商历史合同 ↗</span>
                      </button>
                      <button type="button" class="plg-tag" @click="showToast('已加载合同审批记录 SP-202605002', 'info')">
                        <span class="plg-id">SP-202605002</span><span class="plg-name">合同审批记录</span>
                      </button>
                    </div>
                  </div>
                  <div class="plg-group plg-proc">
                    <div class="plg-label">采购域 <span class="plg-nav-hint">↗ 点击穿透核查</span></div>
                    <div class="plg-tags">
                      <button type="button" class="plg-tag proc-tag" @click="navigateToProcurement">
                        <span class="plg-id">CG-202605002</span><span class="plg-name">采购计划详情</span>
                      </button>
                      <button type="button" class="plg-tag proc-tag pene-active" @click="openPenetration('inquiry')">
                        <span class="plg-id">XJ-202605002</span><span class="plg-name">采购询价记录 ↗</span>
                      </button>
                      <button type="button" class="plg-tag proc-tag" @click="navigateToProcurement">
                        <span class="plg-id">BJ-202605002</span><span class="plg-name">供应商报价记录</span>
                      </button>
                    </div>
                  </div>
                  <div class="plg-group">
                    <div class="plg-label">财务域</div>
                    <div class="plg-tags">
                      <button type="button" class="plg-tag fin-tag pene-active" @click="openPenetration('invoice')">
                        <span class="plg-id">FP-202605003</span><span class="plg-name">财务发票详情 ↗</span>
                      </button>
                      <button type="button" class="plg-tag fin-tag" @click="showToast('已加载会计凭证 PZ-202605003', 'info')">
                        <span class="plg-id">PZ-202605003</span><span class="plg-name">会计凭证详情</span>
                      </button>
                    </div>
                  </div>
                  <div class="plg-group">
                    <div class="plg-label">外部数据</div>
                    <div class="plg-tags">
                      <button type="button" class="plg-tag ext-tag" @click="showToast('已加载第三方市场价格数据 SJ-20260517001', 'info')">
                        <span class="plg-id">SJ-20260517001</span><span class="plg-name">同期市场价格</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 第六节 -->
              <div class="rdr-section">
                <div class="rdr-section-title"><span class="rsn-num">六</span>整改建议</div>
                <ol class="rdr-list">
                  <li>由采购部门牵头，核查本次价格异动原因，要求供应商提供价格上涨说明（如原材料采购凭证），并对接第三方价格平台，核实市场价格真实性；</li>
                  <li>若价格异动为合理（如原材料涨价），补充价格说明及佐证资料，上传系统，解除预警；若为不合理异动，协商供应商调整单价，或重新组织询价/招标；</li>
                  <li>完善采购询价流程，要求同类物资询价供应商不少于3家，必要时进行公开招标，避免询价范围过窄导致价格偏高；</li>
                  <li>核查采购经办人（XXX）的履职情况，确认是否存在与供应商串通行为，若有违规，按制度问责；</li>
                  <li>建立供应商价格动态监测机制，定期比对历史价格与市场价格，提前预警价格异常。</li>
                </ol>
              </div>

              <!-- 第七节 -->
              <div class="rdr-section last-section">
                <div class="rdr-section-title"><span class="rsn-num">七</span>处理进度跟踪</div>
                <div class="proc-track">
                  <div
                    v-for="(step, si) in activeRisk.statusFlow"
                    :key="step"
                    class="pt-step"
                    :class="{ done: si < activeRisk.currentStatusIdx, current: si === activeRisk.currentStatusIdx }"
                  >
                    <div class="pt-dot"></div>
                    <div class="pt-body">
                      <strong>{{ step }}</strong>
                      <span v-if="si === activeRisk.currentStatusIdx" class="pt-current-badge">当前状态</span>
                    </div>
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
        </div><!-- /.rd-content -->

        <!-- ══ 穿透详情面板 ══ -->
        <transition name="pene-slide">
          <div v-if="peneTarget" class="pene-overlay">
            <div class="pene-modal card">

              <!-- 面板头 -->
              <div class="pene-head">
                <div class="pene-head-left">
                  <span class="pene-label">穿透核查</span>
                  <span class="pene-id">{{ peneDataMap[peneTarget].id }}</span>
                  <span class="pene-title">{{ peneDataMap[peneTarget].title }}</span>
                </div>
                <button type="button" class="drawer-close" @click="peneTarget = null">✕</button>
              </div>
              <div class="pene-subtitle">{{ peneDataMap[peneTarget].subtitle }}</div>

              <!-- 供应商历史合同 -->
              <template v-if="peneTarget === 'supplier'">
                <div class="pene-body micro-scroll">
                  <div class="pene-sec-title">历史合同价格对比</div>
                  <table class="pene-table">
                    <thead><tr>
                      <th>合同编号</th><th>签订日期</th><th>规格型号</th><th>数量</th><th>单价</th><th>合同金额</th><th>状态</th>
                    </tr></thead>
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
                    <thead><tr>
                      <th>供应商</th><th>报价</th><th>交货期</th><th>资质等级</th><th>备注</th>
                    </tr></thead>
                    <tbody>
                      <tr v-for="r in peneDataMap.inquiry.records" :key="r.supplier" :class="{ 'ptr-current': r.selected }">
                        <td>{{ r.supplier }}<span v-if="r.selected" class="ptr-cur-badge">已选</span></td>
                        <td :class="r.selected ? 'ptr-price-high' : ''"><strong>{{ r.price }}</strong></td>
                        <td>{{ r.delivery }}</td><td>{{ r.qualification }}</td><td>{{ r.remark }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="pene-kv-row">
                    <span class="pene-kv-label">同期市场参考价</span>
                    <strong class="pene-kv-val pene-kv-green">{{ peneDataMap.inquiry.marketRef }}</strong>
                  </div>
                  <div class="pene-conclusion-box pene-warn">{{ peneDataMap.inquiry.conclusion }}</div>
                </div>
              </template>

              <!-- 财务发票 -->
              <template v-else-if="peneTarget === 'invoice'">
                <div class="pene-body micro-scroll">
                  <div class="pene-sec-title">发票要素核查</div>
                  <div class="pene-kv-grid">
                    <div v-for="item in peneDataMap.invoice.items" :key="item.field" class="pene-kv-item">
                      <span>{{ item.field }}</span><strong>{{ item.value }}</strong>
                    </div>
                  </div>
                  <div class="pene-conclusion-box pene-ok">{{ peneDataMap.invoice.diff }}</div>
                  <div class="pene-conclusion-box" style="margin-top:6px">{{ peneDataMap.invoice.conclusion }}</div>
                </div>
              </template>

              <!-- 核查结论录入 -->
              <div class="pene-resolution">
                <div class="pene-res-title">📝 核查结论录入</div>
                <div class="pene-res-desc">根据以上核查数据，本次价格异动属于：</div>
                <div class="pene-res-btns">
                  <button type="button" class="prb-btn prb-resolve" @click="resolveAlert('reasonable')">
                    <span class="prb-icon">✓</span>
                    <span class="prb-text"><strong>合理异动</strong><em>补充说明，解除预警</em></span>
                  </button>
                  <button type="button" class="prb-btn prb-escalate" @click="resolveAlert('violation')">
                    <span class="prb-icon">⚠</span>
                    <span class="prb-text"><strong>违规异动</strong><em>按整改建议处理</em></span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </transition>

      </div>
    </template>

    <!-- ══════════ 合同详情页 ══════════ -->
    <template v-if="viewMode === 'contract-detail' && activeContractDetail">
      <div class="cd-view micro-scroll">
        <!-- 顶栏 -->
        <div class="cd-topbar">
          <div class="cd-topbar-left">
            <button type="button" class="rdr-back-btn" @click="viewMode = 'penetration'">← 返回合同智联仓库</button>
            <span class="cd-id">{{ activeContractDetail.base.contractNo }}</span>
            <span class="risk-pill" :class="`rp-${activeContractDetail.meta.riskLevel}`">{{ riskLabelMap[activeContractDetail.meta.riskLevel] }}</span>
          </div>
          <div class="cd-topbar-right">
            <span class="cd-status-pill">{{ activeContractDetail.base.status }}</span>
            <span class="cd-core-risk-inline">⚠ {{ activeContractDetail.meta.coreRisk }}</span>
          </div>
        </div>

        <!-- AI 总览 -->
        <div class="cd-section cd-ai-overview">
          <div class="cd-sec-title"><span class="cd-sec-num">AI</span>合同解析总览</div>
          <div class="cd-ai-grid">
            <div class="cd-ai-item"><span>合同类型</span><strong>{{ activeContractDetail.meta.type }}</strong></div>
            <div class="cd-ai-item"><span>风险等级</span>
              <strong :style="{ color: riskColor[activeContractDetail.meta.riskLevel] }">{{ riskLabelMap[activeContractDetail.meta.riskLevel] }}</strong>
            </div>
            <div class="cd-ai-item"><span>合同状态</span><strong>{{ activeContractDetail.base.status }}</strong></div>
          </div>
        </div>

        <div class="cd-body">
          <!-- 一：基础主体信息 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">一</span>基础主体信息</div>
            <div class="cd-three-col">
              <div class="cd-field-group">
                <div class="cd-fg-title">合同基本</div>
                <div class="cd-field"><span>合同编号</span><strong>{{ activeContractDetail.base.contractNo }}</strong></div>
                <div class="cd-field"><span>合同名称</span><strong>{{ activeContractDetail.base.name }}</strong></div>
                <div class="cd-field"><span>合同类型</span><strong>{{ activeContractDetail.base.type }}</strong></div>
                <div class="cd-field"><span>归档编号</span><strong>{{ activeContractDetail.base.archiveNo }}</strong></div>
              </div>
              <div class="cd-field-group">
                <div class="cd-fg-title">甲方（发包方）</div>
                <div class="cd-field"><span>单位全称</span><strong>{{ activeContractDetail.partyA.name }}</strong></div>
                <div class="cd-field"><span>统一社会信用代码</span><strong>{{ activeContractDetail.partyA.creditCode }}</strong></div>
                <div class="cd-field"><span>所属集团</span><strong>{{ activeContractDetail.partyA.group }}</strong></div>
                <div class="cd-field"><span>联系人</span><strong>{{ activeContractDetail.partyA.contact }}</strong></div>
              </div>
              <div class="cd-field-group">
                <div class="cd-fg-title">乙方（承包方）</div>
                <div class="cd-field"><span>合作方全称</span><strong>{{ activeContractDetail.partyB.name }}</strong></div>
                <div class="cd-field"><span>统一社会信用代码</span><strong>{{ activeContractDetail.partyB.creditCode }}</strong></div>
                <div class="cd-field"><span>企业性质</span><strong>{{ activeContractDetail.partyB.nature }}</strong></div>
                <div class="cd-field"><span>联系人</span><strong>{{ activeContractDetail.partyB.contact }}</strong></div>
              </div>
            </div>
          </div>

          <!-- 二：合同时效数据 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">二</span>合同时效数据</div>
            <div class="cd-field-row">
              <div class="cd-field"><span>签订日期</span><strong>{{ activeContractDetail.timeline.signDate }}</strong></div>
              <div class="cd-field"><span>生效日期</span><strong>{{ activeContractDetail.timeline.effectDate }}</strong></div>
              <div class="cd-field"><span>终止日期</span><strong>{{ activeContractDetail.timeline.expireDate }}</strong></div>
              <div class="cd-field"><span>质保期</span><strong>{{ activeContractDetail.timeline.warrantyPeriod }}</strong></div>
              <div class="cd-field"><span>付款节点</span><strong>{{ activeContractDetail.timeline.payNodes }}</strong></div>
              <div class="cd-field"><span>履约截止</span><strong>{{ activeContractDetail.timeline.performDeadline }}</strong></div>
            </div>
          </div>

          <!-- 三：金额费用结构 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">三</span>金额费用结构化数据</div>
            <div class="cd-amount-grid">
              <div class="cd-amount-card cd-amount-total">
                <span>合同总金额</span>
                <strong>{{ activeContractDetail.finance.totalAmount }}</strong>
                <em>{{ activeContractDetail.finance.totalAmountCN }}</em>
              </div>
              <div class="cd-amount-card">
                <span>含税金额</span><strong>{{ activeContractDetail.finance.taxIncluded }}</strong>
              </div>
              <div class="cd-amount-card">
                <span>税率</span><strong>{{ activeContractDetail.finance.taxRate }}</strong>
              </div>
              <div class="cd-amount-card">
                <span>预付款</span><strong>{{ activeContractDetail.finance.prepay }}</strong>
              </div>
              <div class="cd-amount-card">
                <span>进度款</span><strong>{{ activeContractDetail.finance.progress }}</strong>
              </div>
              <div class="cd-amount-card">
                <span>尾款</span><strong>{{ activeContractDetail.finance.final }}</strong>
              </div>
              <div class="cd-amount-card">
                <span>履约保证金</span><strong>{{ activeContractDetail.finance.deposit }}</strong>
              </div>
              <div class="cd-amount-card cd-amount-warn">
                <span>违约金标准</span><strong>{{ activeContractDetail.finance.penalty }}</strong>
              </div>
            </div>
          </div>

          <!-- 四：业务品类与标的 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">四</span>业务品类与标的数据</div>
            <div class="cd-field-row">
              <div class="cd-field"><span>业务大类</span><strong>{{ activeContractDetail.subject.category }}</strong></div>
              <div class="cd-field"><span>采购品目</span><strong>{{ activeContractDetail.subject.item }}</strong></div>
              <div class="cd-field"><span>标的名称</span><strong>{{ activeContractDetail.subject.name }}</strong></div>
              <div class="cd-field"><span>规格型号</span><strong>{{ activeContractDetail.subject.spec }}</strong></div>
              <div class="cd-field"><span>数量/单位</span><strong>{{ activeContractDetail.subject.qty }}</strong></div>
              <div class="cd-field"><span>单价</span><strong>{{ activeContractDetail.subject.unitPrice }}</strong></div>
              <div class="cd-field"><span>交付地点</span><strong>{{ activeContractDetail.subject.deliverPlace }}</strong></div>
              <div class="cd-field"><span>立项文号</span><strong>{{ activeContractDetail.subject.projectNo }}</strong></div>
            </div>
          </div>

          <!-- 五：审批与流程 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">五</span>审批与流程数据</div>
            <div class="cd-field-row">
              <div class="cd-field"><span>发起部门</span><strong>{{ activeContractDetail.approval.dept }}</strong></div>
              <div class="cd-field"><span>经办人</span><strong>{{ activeContractDetail.approval.handler }}</strong></div>
              <div class="cd-field"><span>招标方式</span><strong class="cd-risk-flag">{{ activeContractDetail.approval.bidMethod }}</strong></div>
              <div class="cd-field"><span>招标编号</span><strong>{{ activeContractDetail.approval.bidNo }}</strong></div>
              <div class="cd-field"><span>法务审核</span><strong>{{ activeContractDetail.approval.legalStatus }}</strong></div>
              <div class="cd-field"><span>财务审核</span><strong>{{ activeContractDetail.approval.financeStatus }}</strong></div>
            </div>
          </div>

          <!-- 六七八九：履约 · 财务 · 合规 · 存档（四列一行） -->
          <div class="cd-four-col">
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">六</span>履约管控数据</div>
              <div class="cd-field"><span>交付方式</span><strong>{{ activeContractDetail.perform.deliverMethod }}</strong></div>
              <div class="cd-field"><span>验收标准</span><strong>{{ activeContractDetail.perform.acceptStd }}</strong></div>
              <div class="cd-field"><span>履约责任人</span><strong>{{ activeContractDetail.perform.responsible }}</strong></div>
              <div class="cd-field"><span>变更次数</span><strong>{{ activeContractDetail.perform.changeCount }}</strong></div>
              <div class="cd-field"><span>违约情形</span><strong class="cd-risk-flag">{{ activeContractDetail.perform.breachCase }}</strong></div>
            </div>
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">七</span>财务结算数据</div>
              <div class="cd-field"><span>结算方式</span><strong>{{ activeContractDetail.settlement.method }}</strong></div>
              <div class="cd-field"><span>付款周期</span><strong>{{ activeContractDetail.settlement.cycle }}</strong></div>
              <div class="cd-field"><span>发票类目</span><strong>{{ activeContractDetail.settlement.invoiceType }}</strong></div>
              <div class="cd-field"><span>对账周期</span><strong>{{ activeContractDetail.settlement.reconcile }}</strong></div>
              <div class="cd-field"><span>资金计划编号</span><strong>{{ activeContractDetail.settlement.fundPlanNo }}</strong></div>
            </div>
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">八</span>合规风控字段</div>
              <div class="cd-field"><span>涉密等级</span><strong>{{ activeContractDetail.compliance.secretLevel }}</strong></div>
              <div class="cd-field"><span>关联框架协议</span><strong>{{ activeContractDetail.compliance.frameworkRef }}</strong></div>
              <div class="cd-field"><span>合规风险标签</span>
                <span class="cd-tags">
                  <span v-for="t in activeContractDetail.compliance.riskTags" :key="t" class="cd-tag cd-tag-risk">{{ t }}</span>
                </span>
              </div>
              <div class="cd-field"><span>国资监管分类</span><strong>{{ activeContractDetail.compliance.stateAssetCategory }}</strong></div>
            </div>
            <div class="cd-section">
              <div class="cd-sec-title"><span class="cd-sec-num">九</span>存档管理数据</div>
              <div class="cd-field"><span>归档状态</span><strong>{{ activeContractDetail.archive.status }}</strong></div>
              <div class="cd-field"><span>归档人</span><strong>{{ activeContractDetail.archive.archivist }}</strong></div>
              <div class="cd-field"><span>归档时间</span><strong>{{ activeContractDetail.archive.archiveDate }}</strong></div>
              <div class="cd-field"><span>纸质份数</span><strong>{{ activeContractDetail.archive.paperCount }}</strong></div>
              <div class="cd-field"><span>合同状态</span><strong>{{ activeContractDetail.archive.contractStatus }}</strong></div>
            </div>
          </div>

          <!-- 十：拓展关联 -->
          <div class="cd-section">
            <div class="cd-sec-title"><span class="cd-sec-num">十</span>拓展关联数据</div>
            <div class="cd-field-row">
              <div class="cd-field"><span>关联项目ID</span><strong>{{ activeContractDetail.extend.projectId }}</strong></div>
              <div class="cd-field"><span>关联采购订单</span><strong>{{ activeContractDetail.extend.purchaseOrderId }}</strong></div>
              <div class="cd-field"><span>供应商等级</span><strong>{{ activeContractDetail.extend.supplierGrade }}</strong></div>
              <div class="cd-field"><span>历史合作次数</span><strong>{{ activeContractDetail.extend.historyCoopCount }}</strong></div>
              <div class="cd-field"><span>年度框架额度</span><strong>{{ activeContractDetail.extend.annualQuota }}</strong></div>
              <div class="cd-field"><span>剩余可用额度</span><strong>{{ activeContractDetail.extend.remainQuota }}</strong></div>
            </div>
            <!-- 穿透链路 -->
            <div class="link-section" style="margin-top:10px">
              <div class="ls-title">穿透链路关联</div>
              <div class="links-wrap">
                <span v-for="link in (contractById(activeContractDetail.base.contractNo)?.links || [])" :key="link.id" class="link-tag" :class="`lt-${link.type}`">
                  {{ link.id }}<em>{{ link.label }}</em>
                </span>
              </div>
            </div>
          </div>

          <!-- AI 合规审查意见 -->
          <div class="cd-section cd-ai-review">
            <div class="cd-sec-title"><span class="cd-sec-num">AI</span>合规审查意见</div>
            <div v-for="op in activeContractDetail.aiOpinion" :key="op.level" class="cd-opinion-item" :class="`cd-op-${op.level}`">
              <div class="cd-op-head">
                <span class="risk-pill" :class="`rp-${op.level}`">{{ riskLabelMap[op.level] }}</span>
                <span class="cd-op-title">{{ op.title }}</span>
              </div>
              <div class="cd-op-body">{{ op.content }}</div>
              <div class="cd-op-suggest">💡 整改建议：{{ op.suggest }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div><!-- /.ct-scene -->
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, onBeforeUnmount, ref } from 'vue'
import EChart from '@/components/EChart.vue'

const emit = defineEmits(['navigate'])

// ──────────── 全局状态 ────────────
const viewMode = ref('penetration') // 'penetration' | 'risk-detail' | 'contract-detail'
const toastVisible = ref(false)
const toastText    = ref('')
const toastType    = ref('info')
let toastTimer = null

// ──────────── 工具 ────────────
function showToast(text, type = 'info') {
  toastText.value    = text
  toastType.value    = type
  toastVisible.value = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastVisible.value = false }, 2800)
}

function navigateToProcurement() {
  showToast('正在跳转至采购穿透页 → XJ-202605002 询价记录…', 'info')
  setTimeout(() => emit('navigate', 'procurement'), 800)
}

onBeforeUnmount(() => { window.clearTimeout(toastTimer) })

// ──────────────────────────────────────
// ── 穿透视图数据
// ──────────────────────────────────────
const riskLabelMap = { high: '高风险', medium: '中风险', watch: '关注', normal: '正常' }
const riskColor    = { high: '#ef4444', medium: '#f97316', watch: '#ca8a04', normal: '#16a34a' }

const kpiCards = [
  { label: '集团总计合同',           value: '14,205',  unit: '项', badge: '全量监控', color: '#2563eb', bg: '#eff6ff', pillBg: '#dbeafe', sub: '覆盖全集团所有合同台账' },
  { label: '穿透核查覆盖率',         value: '98.4',    unit: '%',  badge: '高覆盖',   color: '#16a34a', bg: '#f0fdf4', pillBg: '#dcfce7', sub: '较上季度提升 1.2 个百分点' },
  { label: '实时触发预警',           value: '12',      unit: '件', badge: '待处置',   color: '#f97316', bg: '#fff7ed', pillBg: '#fed7aa', sub: '本月新增 3 件，已派发 9 件' },
  { label: '待整改闭环',             value: '3',       unit: '件', badge: '逾期预警', color: '#ef4444', bg: '#fef2f2', pillBg: '#fee2e2', sub: '最长逾期 14 天，需立即跟进' },
  { label: 'Agent 内核调用计数',     value: '842,915', unit: '次', badge: '实时统计', color: '#7c3aed', bg: '#f5f3ff', pillBg: '#ede9fe', sub: '累计智能体模型推理调用总量' },
]

const contracts = [
  {
    id: 'HT-202605002', name: '钢材采购框架协议', company: '华东建设集团', supplier: '江苏钢材联盟',
    amount: '2.8 亿元', signDate: '2026-04-18', expireDate: '2027-04-17', payMethod: '按节点付款',
    category: '物资采购', status: '执行中', progress: 62, paidRatio: 64,
    risk: 'high', riskCount: 4,
    advice: '立即启动采购专项审计，核查招标缺失；对超进度付款部分发起退款申请；联动供应商资质复核。',
    links: [{ id: 'CG-202605002', label: '采购订单', type: 'procurement' }, { id: 'XJ-202605002', label: '询价记录', type: 'inquiry' }, { id: 'FP-202605003', label: '发票凭证', type: 'invoice' }, { id: 'SP-202605002', label: '审批流程', type: 'approval' }, { id: 'PZ-202605003', label: '账务凭证', type: 'voucher' }],
  },
  {
    id: 'HT-202604015', name: '设备安装服务合同', company: '华东建设集团', supplier: '苏州机电科技',
    amount: '3.2 亿元', signDate: '2026-03-10', expireDate: '2026-12-31', payMethod: '里程碑付款',
    category: '工程服务', status: '执行中', progress: 80, paidRatio: 78,
    risk: 'medium', riskCount: 1,
    advice: '跟进履约进度偏差，确认延期原因；下季度启动中期评估。',
    links: [{ id: 'CG-202604015', label: '采购订单', type: 'procurement' }, { id: 'FP-202604018', label: '发票凭证', type: 'invoice' }],
  },
  {
    id: 'HT-202603008', name: '工程监理服务合同', company: '南方建工集团', supplier: '长三角监理联盟',
    amount: '2.6 亿元', signDate: '2026-02-22', expireDate: '2026-08-31', payMethod: '月度结算',
    category: '监理服务', status: '已完结', progress: 100, paidRatio: 100,
    risk: 'normal', riskCount: 0,
    advice: '合同已完结归档，持续保持监测即可。',
    links: [{ id: 'CG-202603008', label: '采购订单', type: 'procurement' }],
  },
]

const stagesMap = {
  'HT-202605002': [
    { id: 's1', tabLabel: '交付进度', nodes: [{ icon: '📄', label: '合同签订', value: '2.8 亿', active: true }, { icon: '✅', label: '履约交付', value: '进度 62%', active: true }, { icon: '💰', label: '付款节点', value: '1.8 亿', active: true, warn: true }, { icon: '🏦', label: '资金流向', value: '超进度付款', active: true, warn: true }, { icon: '⚠', label: '风险识别', value: '高风险', active: true, warn: true }], risks: [{ id: 'r1', level: 'high', title: '超进度付款', desc: '付款进度 64% 超交付进度 62%，差异金额约 1200 万元' }, { id: 'r2', level: 'medium', title: '履约节点延误', desc: '累计 3 次节点延误，合计延期 14 天' }], chartType: 'stage1' },
    { id: 's2', tabLabel: '交易金额', nodes: [{ icon: '📄', label: '合同', value: '5800 元/吨', active: true }, { icon: '🛒', label: '采购订单', value: 'CG-202605002', active: true }, { icon: '📋', label: '招标记录', value: '无竞争招标', active: true, warn: true }, { icon: '🏭', label: '供应商', value: '江苏钢材联盟', active: true, warn: true }], risks: [{ id: 'r3', level: 'high', title: '未竞争性招标', desc: '直接委托采购，未经询价比价，违反采购制度第 12 条' }, { id: 'r4', level: 'medium', title: '价格显著偏高', desc: '合同价 5800 元/吨，市场价 5500，历史均价 5200，偏高 11.5%' }], chartType: 'stage2' },
    { id: 's3', tabLabel: '实施费用', nodes: [{ icon: '📄', label: '合同', value: 'HT-202605002', active: true }, { icon: '🧾', label: '发票凭证', value: 'FP-202605003', active: true, warn: true }, { icon: '📊', label: '会计科目', value: '材料费-钢材', active: true }, { icon: '📑', label: '财务报表', value: '成本超预算', active: true, warn: true }], risks: [{ id: 'r5', level: 'watch', title: '发票金额差异', desc: '发票总额与合同金额差异约 3%，有待核实' }, { id: 'r6', level: 'medium', title: '科目归集异常', desc: '部分费用归入管理费用，与合同约定科目不符' }], chartType: 'stage3' },
    { id: 's4', tabLabel: '项目资产', nodes: [{ icon: '📄', label: '合同', value: 'HT-202605002', active: true }, { icon: '🏗', label: '项目关联', value: '苏州科技园工程', active: true }, { icon: '💼', label: '预算对比', value: '超预算 11.5%', active: true, warn: true }, { icon: '🏢', label: '资产评估', value: '未达资本化', active: true }], risks: [{ id: 'r7', level: 'medium', title: '预算超支', desc: '钢材预算 5200 元/吨，实际 5800 元/吨，超出 11.5%' }, { id: 'r8', level: 'watch', title: '资产化条件待确认', desc: '部分物资尚未达到资本化确认条件，需财务核定' }], chartType: 'stage4' },
  ],
  'HT-202604015': [
    { id: 's1', tabLabel: '交付进度', nodes: [{ icon: '📄', label: '合同签订', value: '3.2 亿', active: true }, { icon: '✅', label: '履约交付', value: '进度 80%', active: true }, { icon: '💰', label: '付款节点', value: '2.5 亿', active: true }, { icon: '🏦', label: '资金流向', value: '正常', active: true }, { icon: '✔', label: '风险状态', value: '中风险', active: true }], risks: [{ id: 'r1', level: 'medium', title: '履约进度滞后', desc: '实际进度落后计划约 5%，需持续跟进' }], chartType: 'stage1' },
    { id: 's2', tabLabel: '交易金额', nodes: [{ icon: '📄', label: '合同', value: '3.2 亿', active: true }, { icon: '🛒', label: '采购订单', value: 'CG-202604015', active: true }, { icon: '📋', label: '招标记录', value: '竞争招标', active: true }, { icon: '🏭', label: '供应商', value: '苏州机电科技', active: true }], risks: [], chartType: 'stage2' },
    { id: 's3', tabLabel: '实施费用', nodes: [{ icon: '📄', label: '合同', value: '3.2 亿', active: true }, { icon: '🧾', label: '发票凭证', value: 'FP-202604018', active: true }, { icon: '📊', label: '会计科目', value: '设备费', active: true }, { icon: '📑', label: '财务报表', value: '正常', active: true }], risks: [], chartType: 'stage3' },
    { id: 's4', tabLabel: '项目资产', nodes: [{ icon: '📄', label: '合同', value: '3.2 亿', active: true }, { icon: '🏗', label: '项目关联', value: '苏州科技园', active: true }, { icon: '💼', label: '预算对比', value: '预算匹配', active: true }, { icon: '🏢', label: '资产评估', value: '已资本化', active: true }], risks: [], chartType: 'stage4' },
  ],
  'HT-202603008': [
    { id: 's1', tabLabel: '交付进度', nodes: [{ icon: '📄', label: '合同签订', value: '2.6 亿', active: true }, { icon: '✅', label: '履约交付', value: '进度 100%', active: true }, { icon: '💰', label: '付款节点', value: '2.6 亿', active: true }, { icon: '🏦', label: '资金流向', value: '正常', active: true }, { icon: '✔', label: '风险状态', value: '正常', active: true }], risks: [], chartType: 'stage1' },
    { id: 's2', tabLabel: '交易金额', nodes: [{ icon: '📄', label: '合同', value: '2.6 亿', active: true }, { icon: '🛒', label: '采购订单', value: 'CG-202603008', active: true }, { icon: '📋', label: '招标记录', value: '公开招标', active: true }, { icon: '🏭', label: '供应商', value: '长三角监理联盟', active: true }], risks: [], chartType: 'stage2' },
    { id: 's3', tabLabel: '实施费用', nodes: [{ icon: '📄', label: '合同', value: '2.6 亿', active: true }, { icon: '🧾', label: '发票凭证', value: '已完结', active: true }, { icon: '📊', label: '会计科目', value: '管理费用', active: true }, { icon: '📑', label: '财务报表', value: '已归档', active: true }], risks: [], chartType: 'stage3' },
    { id: 's4', tabLabel: '项目资产', nodes: [{ icon: '📄', label: '合同', value: '2.6 亿', active: true }, { icon: '🏗', label: '项目关联', value: '南方建工', active: true }, { icon: '💼', label: '预算对比', value: '预算匹配', active: true }, { icon: '🏢', label: '资产评估', value: '费用化', active: true }], risks: [], chartType: 'stage4' },
  ],
}

// ── 公司-分公司树结构
const companyTree = [
  {
    id: 'grp-hua', name: '华东建设集团', type: 'group', totalContracts: 2,
    children: [
      { id: 'sub-hua-1', name: '华东建设（苏州）分公司', contracts: ['HT-202605002', 'HT-202604015'] },
    ],
  },
  {
    id: 'grp-nan', name: '南方建工集团', type: 'group', totalContracts: 1,
    children: [
      { id: 'sub-nan-1', name: '南方建工（广州）分公司', contracts: ['HT-202603008'] },
    ],
  },
]
const expandedNodes = ref(new Set(['grp-hua', 'sub-hua-1', 'grp-nan', 'sub-nan-1']))
function toggleNode(id) {
  const s = new Set(expandedNodes.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedNodes.value = s
}
function contractById(id) { return contracts.find(c => c.id === id) ?? contracts[0] }

const activeContractId = ref('HT-202605002')
const activeStageIdx   = ref(0)
const activeContract   = computed(() => contracts.find((c) => c.id === activeContractId.value))
const activeStages     = computed(() => stagesMap[activeContractId.value] ?? stagesMap['HT-202605002'])
const currentStage     = computed(() => activeStages.value[activeStageIdx.value] ?? activeStages.value[0])

const riskSummary = computed(() => {
  const result = []
  activeStages.value.forEach((stage, si) => {
    stage.risks.forEach((risk) => {
      result.push({ ...risk, stageIdx: si, stageLabel: stage.tabLabel.split('→')[1] ?? stage.tabLabel, active: true })
    })
  })
  return result
})
const totalRisks = computed(() => riskSummary.value.length)

const aiConclusion = computed(() => {
  const cid = activeContractId.value
  if (cid === 'HT-202605002') return ['① 资金链路：付款超前于交付，超进度付款风险高，建议暂停第 4 期付款。', '② 采购链路：无竞争性招标记录，直接委托采购，采购合规性存在重大缺陷。', '③ 财务链路：发票与合同金额差异 3%，存在虚开发票嫌疑，需专项核查。', '④ 项目链路：钢材单价超预算 11.5%，需报批追加预算或重新谈判。']
  if (cid === 'HT-202604015') return ['① 资金链路：付款与交付进度匹配，存在轻微滞后。', '② 采购链路：竞争招标程序合规，供应商资质正常。', '③ 财务链路：凭证与科目匹配，数据正常。']
  return ['① 合同已完结归档，各链路均无异常。', '② 监理合同履约率 100%，可作为优秀案例。']
})

// 合同 → 关联风险ID 映射
const contractRiskMap = {
  'HT-202605002': 'HT-2026002',
  'HT-202604015': 'HT-2026001',
}

function selectContract(id) { activeContractId.value = id; activeStageIdx.value = 0 }
function jumpToStage(idx)   { activeStageIdx.value = idx }

function openRisk(id) {
  selectedRiskId.value = id
  if (id === 'HT-2026002') {
    viewMode.value = 'risk-detail'
  } else {
    showToast(`风险详情 ${id} 暂无完整报告，请联系监管部门`, 'warn')
  }
}

function backToContractView() {
  viewMode.value = 'penetration'
}

// ── EChart ──
const axisLine  = { lineStyle: { color: '#e2e8f0' } }
const splitLine = { lineStyle: { color: '#f1f5f9' } }
const axLbl     = (extra = {}) => ({ color: '#64748b', fontSize: 10, ...extra })
const nameTxt   = { color: '#94a3b8', fontSize: 10 }
const legend    = { top: 4, right: 4, textStyle: { color: '#64748b', fontSize: 11 }, itemWidth: 12, itemHeight: 8 }
const grad      = (c1, c2) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: c1 }, { offset: 1, color: c2 }])

const stageChartOption = computed(() => {
  const cid  = activeContractId.value
  const type = currentStage.value.chartType
  if (type === 'stage1') {
    const nodes = ['签约', '第 1 期', '第 2 期', '第 3 期', '第 4 期', '竣工']
    const src = { 'HT-202605002': { d: [0,10,28,45,62,100], p: [0,15,35,52,64,100], a: [0,0.28,0.7,1.26,1.8,2.8], ov: true }, 'HT-202604015': { d: [0,20,42,62,80,100], p: [0,20,40,60,80,100], a: [0,0.64,1.28,1.92,2.56,3.2], ov: false }, 'HT-202603008': { d: [0,20,40,60,80,100], p: [0,20,40,60,80,100], a: [0,0.52,1.04,1.56,2.08,2.6], ov: false } }
    const { d, p, a, ov } = src[cid]
    return { backgroundColor:'transparent', animationDuration:1000, tooltip:{trigger:'axis',axisPointer:{type:'cross'}}, legend, grid:{left:48,right:56,top:32,bottom:24}, xAxis:{type:'category',data:nodes,axisLine,axisLabel:axLbl()}, yAxis:[{type:'value',name:'进度 %',min:0,max:100,splitNumber:4,axisLabel:axLbl({formatter:'{value}%'}),splitLine,nameTextStyle:nameTxt},{type:'value',name:'亿元',axisLabel:axLbl(),splitLine:{show:false},nameTextStyle:nameTxt}], series:[{name:'付款金额',type:'bar',yAxisIndex:1,barWidth:20,data:a,itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(249,115,22,0.8)','rgba(249,115,22,0.12)')},label:{show:true,position:'top',color:'#ea580c',fontSize:10,formatter:'{c}'},...(ov?{markArea:{silent:true,itemStyle:{color:'rgba(239,68,68,0.05)'},data:[[{xAxis:'第 2 期'},{xAxis:'第 4 期'}]]}}:{})},{name:'交付进度',type:'line',smooth:true,symbol:'circle',symbolSize:7,data:d,yAxisIndex:0,itemStyle:{color:'#2563eb'},lineStyle:{width:2.5,color:'#2563eb'},label:{show:true,color:'#1d4ed8',fontSize:9,formatter:'{c}%'}},{name:'付款进度',type:'line',smooth:true,symbol:'diamond',symbolSize:7,data:p,yAxisIndex:0,itemStyle:{color:'#ef4444'},lineStyle:{width:2.5,color:'#ef4444',type:ov?'dashed':'solid'},label:{show:true,color:'#dc2626',fontSize:9,formatter:'{c}%'}}] }
  }
  if (type === 'stage2') {
    if (cid === 'HT-202605002') return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'axis'},grid:{left:56,right:28,top:32,bottom:24},xAxis:{type:'category',data:['合同单价','市场均价','历史均价'],axisLine,axisLabel:axLbl()},yAxis:{type:'value',name:'元/吨',min:4800,max:6200,axisLabel:axLbl(),splitLine,nameTextStyle:nameTxt},series:[{name:'价格对比',type:'bar',barWidth:64,data:[{value:5800,itemStyle:{borderRadius:[8,8,0,0],color:grad('rgba(239,68,68,0.85)','rgba(239,68,68,0.12)')}},{value:5500,itemStyle:{borderRadius:[8,8,0,0],color:grad('rgba(37,99,235,0.75)','rgba(37,99,235,0.1)')}},{value:5200,itemStyle:{borderRadius:[8,8,0,0],color:grad('rgba(22,163,74,0.75)','rgba(22,163,74,0.1)')}}],label:{show:true,position:'top',fontWeight:700,fontSize:13,formatter:(p)=>`¥${p.value}`},markLine:{silent:true,data:[{yAxis:5500,lineStyle:{color:'#f59e0b',type:'dashed',width:2},label:{formatter:'市场参考价',color:'#d97706',fontSize:10,position:'insideEndTop'}}]}}] }
    return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'axis'},grid:{left:52,right:24,top:32,bottom:24},xAxis:{type:'category',data:['合同单价','市场均价','历史均价'],axisLine,axisLabel:axLbl()},yAxis:{type:'value',name:'指数',axisLabel:axLbl(),splitLine,nameTextStyle:nameTxt},series:[{name:'价格指数',type:'bar',barWidth:60,data:[100,100,96],itemStyle:{borderRadius:[8,8,0,0],color:grad('rgba(37,99,235,0.7)','rgba(37,99,235,0.1)')},label:{show:true,position:'top',fontSize:13,fontWeight:700}}] }
  }
  if (type === 'stage3') {
    if (cid === 'HT-202605002') return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'item',formatter:'{b}：{c} 万元 ({d}%)'},legend:{orient:'vertical',left:12,top:'center',textStyle:{color:'#475569',fontSize:11},itemWidth:11,itemHeight:11},series:[{type:'pie',radius:['36%','66%'],center:['64%','50%'],label:{show:true,formatter:'{d}%',color:'#475569',fontSize:11},labelLine:{lineStyle:{color:'#cbd5e1'}},itemStyle:{borderColor:'#fff',borderWidth:3},data:[{name:'材料费-钢材',value:24800,itemStyle:{color:'#ef4444'}},{name:'运输费',value:1200,itemStyle:{color:'#3b82f6'}},{name:'管理费用',value:680,itemStyle:{color:'#f59e0b'}},{name:'其他',value:320,itemStyle:{color:'#8b5cf6'}}]}] }
    return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'item',formatter:'{b}：{c} 万元 ({d}%)'},legend:{orient:'vertical',left:12,top:'center',textStyle:{color:'#475569',fontSize:11}},series:[{type:'pie',radius:['36%','64%'],center:['64%','50%'],label:{show:true,formatter:'{d}%',fontSize:11},itemStyle:{borderColor:'#fff',borderWidth:3},data:[{name:'设备费',value:2800,itemStyle:{color:'#3b82f6'}},{name:'安装费',value:380,itemStyle:{color:'#10b981'}},{name:'其他',value:20,itemStyle:{color:'#8b5cf6'}}]}] }
  }
  if (type === 'stage4') {
    if (cid === 'HT-202605002') return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'axis'},legend,grid:{left:56,right:20,top:32,bottom:24},xAxis:{type:'category',data:['钢材采购','运输费用','管理费用','验收费用'],axisLine,axisLabel:axLbl()},yAxis:{type:'value',name:'万元',axisLabel:axLbl(),splitLine,nameTextStyle:nameTxt},series:[{name:'预算金额',type:'bar',barWidth:22,barGap:'15%',data:[24000,1200,600,200],itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(37,99,235,0.65)','rgba(37,99,235,0.1)')}},{name:'实际金额',type:'bar',barWidth:22,data:[26752,1200,680,168],itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(239,68,68,0.8)','rgba(239,68,68,0.12)')}}] }
    return { backgroundColor:'transparent',animationDuration:900,tooltip:{trigger:'axis'},legend,grid:{left:56,right:20,top:32,bottom:24},xAxis:{type:'category',data:['设备采购','安装服务','其他'],axisLine,axisLabel:axLbl()},yAxis:{type:'value',name:'万元',axisLabel:axLbl(),splitLine,nameTextStyle:nameTxt},series:[{name:'预算',type:'bar',barWidth:26,barGap:'15%',data:[2900,350,20],itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(37,99,235,0.65)','rgba(37,99,235,0.1)')}},{name:'实际',type:'bar',barWidth:26,data:[2800,380,20],itemStyle:{borderRadius:[4,4,0,0],color:grad('rgba(22,163,74,0.75)','rgba(22,163,74,0.1)')}}] }
  }
  return {}
})

// ──────────────────────────────────────
// ── 风险详情报告
// ──────────────────────────────────────
const riskLevelLabel = { high: '高风险', medium: '中风险', watch: '关注', normal: '正常' }
const selectedRiskId = ref('')
const activeRisk = computed(() => {
  if (selectedRiskId.value !== 'HT-2026002') return null
  return {
    id: 'HT-2026002',
    name: '采购合同价格异动预警',
    subName: '钢材采购价格偏高',
    level: 'medium',
    alertTime: '2026-05-17 10:15',
    source: '系统自动监测（合同价格与历史价格、市场价格比对）',
    subjects: ['本单位XX物资采购部门', '供应商XX建材有限公司'],
    contractRef: 'HT-202605002',
    procurementRef: 'CG-202605002',
    status: '核查中',
    statusFlow: ['待核查', '核查中', '整改中', '已闭环'],
    currentStatusIdx: 1,
    responsible: 'XXX（采购部门）、XXX（监管部门）',
    deadline: '2026-05-24',
  }
})

// ──────────────────────────────────────
// ── 合同列表 · 筛选 · 侧拉 · 风险项 · 详情
// ──────────────────────────────────────
const selectedOrgId = ref(null)
const riskFilter    = ref('all')
const drawerOpen    = ref(false)
const peneTarget    = ref(null) // null | 'supplier' | 'inquiry' | 'invoice'

// 各合同的风险项列表（reactive，支持 analyzing/analyzed 状态）
const riskItemsData = ref({
  'HT-202605002': [
    {
      id: 'HT-2026002', name: '采购合同价格异动预警', level: 'medium',
      alertTime: '2026-05-17 10:15',
      subjects: ['本单位XX物资采购部门', '供应商XX建材有限公司'],
      relatedIndex: '合同编号：HT-202605002；采购计划编号：CG-202605002',
      status: '核查中', statusKey: 'checking', analyzing: false, analyzed: false,
    },
    {
      id: 'HT-2026003', name: '招标程序缺失预警', level: 'high',
      alertTime: '2026-05-17 10:16',
      subjects: ['本单位采购管理部', '经办人XXX'],
      relatedIndex: '合同编号：HT-202605002；询价记录：XJ-202605002',
      status: '待核查', statusKey: 'pending', analyzing: false, analyzed: false,
    },
    {
      id: 'HT-2026004', name: '超进度付款风险预警', level: 'high',
      alertTime: '2026-05-18 09:00',
      subjects: ['本单位财务部门', '供应商江苏钢材联盟'],
      relatedIndex: '合同编号：HT-202605002；付款凭证：PZ-202605003',
      status: '核查中', statusKey: 'checking', analyzing: false, analyzed: false,
    },
    {
      id: 'HT-2026005', name: '发票金额差异提示', level: 'watch',
      alertTime: '2026-05-18 14:30',
      subjects: ['本单位财务核算部', '开票方XX建材有限公司'],
      relatedIndex: '发票号：FP-202605003；合同编号：HT-202605002',
      status: '待核查', statusKey: 'pending', analyzing: false, analyzed: false,
    },
  ],
  'HT-202604015': [
    {
      id: 'HT-2026006', name: '履约进度滞后预警', level: 'medium',
      alertTime: '2026-05-15 11:20',
      subjects: ['供应商苏州机电科技', '本单位工程管理部'],
      relatedIndex: '合同编号：HT-202604015；施工计划编号：SC-202604015',
      status: '整改中', statusKey: 'fixing', analyzing: false, analyzed: false,
    },
    {
      id: 'HT-2026007', name: '供应商资质复核提示', level: 'watch',
      alertTime: '2026-05-16 09:00',
      subjects: ['供应商苏州机电科技', '本单位采购管理部'],
      relatedIndex: '合同编号：HT-202604015；资质证书：ZZ-202501023',
      status: '待核查', statusKey: 'pending', analyzing: false, analyzed: false,
    },
  ],
  'HT-202603008': [],
})

// 穿透核查面板数据
const peneDataMap = {
  supplier: {
    id: 'HT-202602003', title: '供应商历史合同',
    subtitle: '江苏钢材联盟有限公司 · 历史价格核查',
    records: [
      { contractId: 'HT-202605002', date: '2026-04-18', spec: 'HRB400E Φ16mm', qty: '100吨', unitPrice: '5,800元/吨', amount: '58.0万元', status: '执行中', current: true },
      { contractId: 'HT-202602003', date: '2025-12-10', spec: 'HRB400E Φ16mm', qty: '80吨',  unitPrice: '5,200元/吨', amount: '41.6万元', status: '已完结', current: false },
      { contractId: 'HT-202601008', date: '2025-08-15', spec: 'HRB400E Φ16mm', qty: '60吨',  unitPrice: '5,150元/吨', amount: '30.9万元', status: '已完结', current: false },
      { contractId: 'HT-202507021', date: '2025-03-22', spec: 'HRB400E Φ16mm', qty: '50吨',  unitPrice: '5,100元/吨', amount: '25.5万元', status: '已完结', current: false },
    ],
    conclusion: '供应商近 3 次同规格合同单价分别为 5,200、5,150、5,100 元/吨，呈缓慢上涨趋势（约 1%/季度）。本次合同单价 5,800 元/吨较历史均价（5,150 元/吨）偏高 12.6%，远超正常涨幅范围，缺乏合理依据。',
  },
  inquiry: {
    id: 'XJ-202605002', title: '采购询价记录',
    subtitle: '钢材采购询价单 · 同期市场价格核查',
    records: [
      { supplier: '江苏钢材联盟有限公司', price: '5,800元/吨', delivery: '7天',  qualification: 'B级', selected: true,  remark: '本次中选' },
      { supplier: '华东金属材料有限公司', price: '5,750元/吨', delivery: '10天', qualification: 'B级', selected: false, remark: '' },
    ],
    marketRef: '5,500元/吨（第三方平台 SJ-20260517001）',
    conclusion: '本次询价仅邀请 2 家供应商参与，未进行公开竞争性招标；所有报价均高于同期市场公允价格（5,500 元/吨）。按制度规定，单笔采购超 500 万须公开招标，本次操作违规。',
  },
  invoice: {
    id: 'FP-202605003', title: '财务发票详情',
    subtitle: '增值税专用发票 · 与合同价格一致性核查',
    items: [
      { field: '发票号码',   value: 'FP-202605003' },
      { field: '开票日期',   value: '2026-04-25' },
      { field: '销售方',     value: '江苏钢材联盟有限公司' },
      { field: '购买方',     value: '某某建设集团有限公司' },
      { field: '货物名称',   value: 'Φ16mm 螺纹钢 HRB400E' },
      { field: '数量',       value: '100 吨' },
      { field: '不含税单价', value: '5,133.63 元/吨' },
      { field: '税率',       value: '13%' },
      { field: '含税单价',   value: '5,800 元/吨 ✓ 与合同一致' },
      { field: '价税合计',   value: '¥580,000.00' },
    ],
    diff: '✓ 发票含税单价（5,800元/吨）与合同约定单价（5,800元/吨）完全一致，未发现发票价格虚高问题。',
    conclusion: '价格异动发生在合同签订阶段，而非开票环节。问题根源在于招标议价过程，建议重点核查采购经办人的议价行为。',
  },
}

// 按机构筛选后的合同基础集
const filteredContractsBase = computed(() => {
  if (!selectedOrgId.value) return contracts
  const grp = companyTree.find(g => g.id === selectedOrgId.value)
  if (grp) {
    const ids = grp.children.flatMap(b => b.contracts)
    return contracts.filter(c => ids.includes(c.id))
  }
  for (const g of companyTree) {
    const br = g.children.find(b => b.id === selectedOrgId.value)
    if (br) return contracts.filter(c => br.contracts.includes(c.id))
  }
  return contracts
})

// 风险筛选标签（含计数）
const riskFilters = computed(() => {
  const base = filteredContractsBase.value
  return [
    { value: 'all',    label: '全部',   count: base.length },
    { value: 'high',   label: '高风险', count: base.filter(c => c.risk === 'high').length },
    { value: 'medium', label: '中风险', count: base.filter(c => c.risk === 'medium').length },
    { value: 'watch',  label: '关注',   count: base.filter(c => c.risk === 'watch').length },
    { value: 'normal', label: '正常',   count: base.filter(c => c.risk === 'normal').length },
  ]
})

// 最终展示的合同列表
const filteredContracts = computed(() => {
  const base = filteredContractsBase.value
  if (riskFilter.value === 'all') return base
  return base.filter(c => c.risk === riskFilter.value)
})

// 当前合同的风险项
const activeRiskItems = computed(() =>
  riskItemsData.value[activeContractId.value] ?? []
)

function analyzeRiskItem(item) {
  item.analyzing = true
  item.analyzed  = false
  window.setTimeout(() => {
    item.analyzing = false
    item.analyzed  = true
  }, 1800)
}

// ── 操作函数
function selectOrg(id) {
  selectedOrgId.value = id
  riskFilter.value = 'all'
}

function openDrawer(contractId) {
  selectContract(contractId)
  drawerOpen.value = true
}

function openContractDetail(contractId) {
  selectContract(contractId)
  viewMode.value = 'contract-detail'
}

function openPenetration(target) {
  peneTarget.value = target
}

function resolveAlert(type) {
  peneTarget.value = null
  if (type === 'reasonable') {
    showToast('已录入合理异动说明，预警已解除，等待审批', 'info')
  } else {
    showToast('已标记违规异动，整改工单已派发至采购合规部', 'warn')
  }
}

// ── 合同详情（十大类结构化数据）
const contractDetailData = {
  'HT-202605002': {
    meta: {
      type: '物资采购合同',
      riskLevel: 'high',
      coreRisk: '价格异动超阈值（+11.5%），未经竞争性招标，付款进度超交付进度',
    },
    base: {
      contractNo: 'HT-202605002',
      name: '钢材采购框架协议',
      type: '物资采购合同',
      archiveNo: 'DA-2026-HT-0032',
      status: '履行中',
    },
    partyA: {
      name: '某某建设集团有限公司',
      creditCode: '9132****×××XXXXXX',
      group: '华东建设集团',
      contact: 'XXX（采购经办人）',
    },
    partyB: {
      name: '江苏钢材联盟有限公司',
      creditCode: '9132****×××XXXXXX',
      nature: '有限责任公司（民营）',
      contact: 'XXX / 139****XXXX',
    },
    timeline: {
      signDate: '2026-04-18',
      effectDate: '2026-04-18',
      expireDate: '2027-04-17',
      warrantyPeriod: '交付后 12 个月',
      payNodes: '预付 30% · 进度 50% · 尾款 20%',
      performDeadline: '2027-03-31',
    },
    finance: {
      totalAmount: '¥ 2.8 亿元',
      totalAmountCN: '贰亿捌仟万元整',
      taxIncluded: '¥ 2.8 亿元（含税）',
      taxRate: '13%（增值税专用发票）',
      prepay: '¥ 840 万元（30%）',
      progress: '¥ 1,400 万元（50%）',
      final: '¥ 560 万元（20%）',
      deposit: '¥ 280 万元（合同金额 1%）',
      penalty: '逾期每日 0.05%，上限 10%',
    },
    subject: {
      category: '物资采购',
      item: '建筑用钢材',
      name: 'Φ16mm 螺纹钢',
      spec: 'HRB400E Φ16mm',
      qty: '100 吨',
      unitPrice: '5,800 元/吨 ⚠',
      deliverPlace: '江苏省苏州市工业园区施工现场',
      projectNo: 'LX-2026-SZ-001',
    },
    approval: {
      dept: '采购管理部',
      handler: 'XXX',
      bidMethod: '询价采购（仅 2 家）⚠ 未公开招标',
      bidNo: 'XJ-202605002',
      legalStatus: '法务审核通过',
      financeStatus: '财务审核通过',
    },
    perform: {
      deliverMethod: '供应商送货至施工现场',
      acceptStd: '国标 GB/T 1499.2-2018',
      responsible: 'XXX（工程部项目负责人）',
      changeCount: '0 次',
      breachCase: '延迟交付 10 天以上触发违约金 ⚠',
    },
    settlement: {
      method: '银行转账',
      cycle: '验收合格后 30 日内',
      invoiceType: '增值税专用发票（13%）',
      reconcile: '每月 25 日',
      fundPlanNo: 'FP-PLAN-2026-042',
    },
    compliance: {
      secretLevel: '内部',
      frameworkRef: '无关联框架协议',
      riskTags: ['价格异动', '招标缺失', '超进度付款'],
      stateAssetCategory: '国资监管 A 类（重点监控）',
    },
    archive: {
      status: '已归档（电子）',
      archivist: 'XXX（合同管理员）',
      archiveDate: '2026-04-20',
      paperCount: '正本 2 份，副本 3 份',
      contractStatus: '履行中',
    },
    extend: {
      projectId: 'PROJ-SZ-2026-018',
      purchaseOrderId: 'CG-202605002',
      supplierGrade: 'B 级（合格供应商）',
      historyCoopCount: '3 次',
      annualQuota: '5,000 万元',
      remainQuota: '2,200 万元',
    },
    aiOpinion: [
      {
        level: 'high',
        title: '招标程序缺失',
        content: '本合同采用询价采购方式，仅对比 2 家供应商报价，未进行公开招标或竞争性谈判，违反采购管理制度第 12 条"单笔采购金额超 500 万元须公开招标"规定。',
        suggest: '立即启动采购专项审计，补充招标合规说明；对责任经办人启动问询；后续同类采购严格执行公开招标程序。',
      },
      {
        level: 'medium',
        title: '合同价格异动超阈值',
        content: '合同单价 5,800 元/吨，较供应商历史合作均价（5,200 元/吨）偏高 11.5%，超过系统预警阈值（±10%）；较同期市场公允价格（5,500 元/吨）偏高 5.45%，无合理价格说明文件。',
        suggest: '要求供应商出具价格上涨说明及原材料采购凭证；对接第三方价格平台核实市场价格；如不合理则协商调整或重新询价。',
      },
      {
        level: 'watch',
        title: '付款进度超交付进度',
        content: '当前付款进度 64%，交付进度 62%，超进度付款差异约 1,200 万元，存在资金预付风险，需持续跟踪。',
        suggest: '暂缓第 4 期付款，待交付进度追平后再行结算；加强现场验收管控，确保付款与交付同步推进。',
      },
    ],
  },
}

const activeContractDetail = computed(() =>
  contractDetailData[activeContractId.value] ?? contractDetailData['HT-202605002']
)

</script>

<style scoped>
/* ──────────── 场景骨架 ──────────── */
.ct-scene {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
  overflow: hidden;
  color: #1e293b;
  font-family: 'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
}

/* ──────────── 顶部导航栏 ──────────── */
.ct-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  height: 46px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.ct-nav-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ct-nav-title {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  padding-left: 4px;
  border-left: 3px solid #2563eb;
}

.ct-nav-meta {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

/* ──────────── 通用卡片 ──────────── */
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
}

/* ──────────── Toast ──────────── */
.ct-toast {
  position: fixed;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.toast-info { background: #fff; border: 1px solid #bfdbfe; color: #1d4ed8; }
.toast-warn { background: #fff; border: 1px solid #fca5a5; color: #ef4444; }
.toast-icon { font-size: 13px; }

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translate(-50%, -8px); }

/* ──────────── 穿透视图 ──────────── */
.ct-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 页面大标题 ── */
.ct-page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 2px;
  flex-shrink: 0;
}
.cpt-icon {
  font-size: 18px;
  line-height: 1;
}
.cpt-text {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: 0.01em;
}
.cpt-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 4px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 16px 0;
  flex-shrink: 0;
}

.kpi-card {
  padding: 10px 12px;
  background: linear-gradient(160deg, var(--bg, #f8fafc) 0%, #fff 70%);
  border-left: 4px solid var(--c, #2563eb);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kc-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.kc-label { font-size: 11px; font-weight: 600; color: #475569; }
.kc-pill  { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; }
.kc-value { font-size: 22px; font-weight: 800; line-height: 1.1; }
.kc-value small { font-size: 11px; font-weight: 500; color: #64748b; margin-left: 3px; }
.kc-sub   { font-size: 10px; color: #94a3b8; }

.ct-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 480px minmax(0, 1fr) 600px;
  grid-template-rows: 1fr;
  gap: 8px;
  padding: 8px 16px 10px;
  overflow: hidden;
}

.ct-left  { display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow: hidden; }
.ct-right { display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow: hidden; }
.ct-center { min-height: 0; overflow: hidden; }

.side-panel { display: flex; flex-direction: column; gap: 9px; padding: 12px; min-height: 0; }
.sp-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sp-head h3 { margin: 0; font-size: 12px; font-weight: 800; color: #0f172a; }

.pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
.pill.blue { background: #eff6ff; color: #2563eb; }
.pill.red  { background: #fef2f2; color: #ef4444; }

.risk-pill { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; }
.rp-high   { background: #fef2f2; color: #ef4444; }
.rp-medium { background: #fff7ed; color: #f97316; }
.rp-watch  { background: #fefce8; color: #ca8a04; }
.rp-normal { background: #f0fdf4; color: #16a34a; }

.clist { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; min-height: 0; flex: 1; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }

/* ── 公司树 ── */
.tree-panel { flex: 1; min-height: 0; }
.company-tree { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }

.ctree-group { display: flex; flex-direction: column; gap: 1px; }

.ctree-row {
  display: flex; align-items: center; gap: 6px;
  width: 100%; text-align: left; border: none; background: none; cursor: pointer;
  padding: 6px 8px; border-radius: 8px; transition: 0.14s ease;
}
.ctree-row:hover { background: #f1f5f9; }

.ctree-group-row { font-size: 12px; font-weight: 800; color: #0f172a; }
.ctree-branch-row { font-size: 11px; font-weight: 600; color: #334155; padding-left: 18px; }

.ctree-arrow {
  display: inline-flex; width: 14px; height: 14px; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #94a3b8; flex-shrink: 0;
  transform: rotate(0deg); transition: transform 0.18s ease;
}
.ctree-arrow.open { transform: rotate(90deg); }

.ctree-ico { font-size: 13px; flex-shrink: 0; }
.ctree-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctree-cnt { font-size: 10px; font-weight: 600; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }

.ctree-children { display: flex; flex-direction: column; gap: 1px; padding-left: 4px; }

.ctree-contracts { display: flex; flex-direction: column; gap: 4px; padding: 4px 0 4px 32px; }

.citem { width: 100%; text-align: left; padding: 8px 10px; border-radius: 9px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; transition: 0.16s ease; display: flex; flex-direction: column; gap: 3px; }
.citem:hover { border-color: #bfdbfe; box-shadow: 0 3px 10px rgba(37,99,235,0.08); }
.citem.active { border-color: #93c5fd; background: #eff6ff; }
.ci-high   { border-left: 3px solid #ef4444; }
.ci-medium { border-left: 3px solid #f97316; }
.ci-normal { border-left: 3px solid #22c55e; }

.ci-top  { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.ci-id   { font-size: 10px; font-weight: 700; color: #334155; }
.ci-name { font-size: 11px; color: #0f172a; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-meta { display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }

.ci-risk-report-btn {
  margin-top: 5px;
  width: 100%;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #ef4444;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  transition: 0.14s ease;
}
.ci-risk-report-btn:hover {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

.detail-panel { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
.detail-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 8px; }
.dg-row { display: flex; flex-direction: column; gap: 1px; }
.dg-row span   { font-size: 10px; color: #94a3b8; }
.dg-row strong { font-size: 11px; color: #0f172a; font-weight: 600; }

.link-section { padding-top: 6px; border-top: 1px solid #f1f5f9; }
.ls-title { font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 5px; }
.links-wrap { display: flex; flex-wrap: wrap; gap: 4px; }

.link-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 999px; font-size: 9px; font-weight: 600; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
.link-tag em { font-style: normal; font-size: 8px; color: #64748b; }
.lt-invoice    { background: #fefce8; border-color: #fde68a; color: #b45309; }
.lt-voucher    { background: #f5f3ff; border-color: #ddd6fe; color: #7c3aed; }
.lt-approval   { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.lt-inquiry    { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.lt-procurement { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

.action-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding-top: 6px; border-top: 1px solid #f1f5f9; }
.act-btn { height: 28px; border-radius: 7px; font-size: 10px; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; transition: 0.15s ease; }
.act-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.act-btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; grid-column: 1 / -1; }
.act-btn.primary:hover { background: #1d4ed8; }
.act-btn.danger  { background: #fef2f2; border-color: #fecaca; color: #ef4444; grid-column: 1 / -1; }
.act-btn.danger:hover { background: #ef4444; color: #fff; }

.pene-panel { height: 100%; padding: 14px; display: grid; grid-template-rows: auto minmax(0, 1fr) 190px; gap: 10px; }

.stage-tabs { display: flex; gap: 8px; flex-wrap: nowrap; padding: 0 14px 10px; }
.stage-tab { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.16s ease; white-space: nowrap; flex: 1; justify-content: center; }
.stage-tab:hover, .stage-tab.active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; box-shadow: 0 0 0 3px rgba(37,99,235,0.09); }

.sn { width: 22px; height: 22px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stage-tab.active .sn { background: #2563eb; color: #fff; }
.risk-badge { background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; }

.flow-strip { display: flex; align-items: center; gap: 5px; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; overflow-x: auto; scrollbar-width: none; }
.flow-strip::-webkit-scrollbar { display: none; }

.flow-node { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 9px; background: #fff; border: 1px solid #e2e8f0; flex-shrink: 0; min-width: 82px; box-shadow: 0 1px 6px rgba(15,23,42,0.04); }
.flow-node.fn-warn { border-color: #fca5a5; background: #fff5f5; }
.fn-icon  { font-size: 17px; line-height: 1; }
.fn-label { font-size: 11px; font-weight: 700; color: #334155; text-align: center; white-space: nowrap; }
.fn-value { font-size: 10px; color: #64748b; text-align: center; white-space: nowrap; }
.fv-warn  { color: #ef4444 !important; font-weight: 700; }
.flow-sep { flex-shrink: 0; opacity: 0.8; }

.stage-chart { min-height: 0; position: relative; }

.risk-section { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; border-top: 1px solid #f1f5f9; padding-top: 6px; }
.rs-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
.rs-section-title { font-size: 11px; font-weight: 800; color: #0f172a; }
.risk-item { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 9px; border: 1px solid #e2e8f0; background: #f8fafc; }
.ri-high   { background: #fff5f5; border-color: #fecaca; }
.ri-medium { background: #fff8f1; border-color: #fed7aa; }
.ri-watch  { background: #fefce8; border-color: #fde68a; }
.ri-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ri-high .ri-dot   { background: #ef4444; }
.ri-medium .ri-dot { background: #f97316; }
.ri-watch .ri-dot  { background: #ca8a04; }
.ri-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ri-body strong { font-size: 10px; color: #0f172a; }
.ri-body span   { font-size: 9px; color: #64748b; }
.risk-clear { display: flex; align-items: center; gap: 7px; padding: 7px 12px; border-radius: 9px; background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 11px; font-weight: 600; color: #16a34a; }

.risk-summary { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 9px; padding: 12px; }
.ai-block     { flex-shrink: 0; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ai-block .sp-head { margin-bottom: 0; }
.rs-list { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; min-height: 0; flex: 1; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
.rs-item { padding: 8px 10px; border-radius: 9px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; transition: 0.15s ease; display: flex; flex-direction: column; gap: 3px; }
.rs-item:hover { border-color: #93c5fd; }
.rs-high   { border-left: 3px solid #ef4444; background: #fff5f5; }
.rs-medium { border-left: 3px solid #f97316; background: #fff8f1; }
.rs-watch  { border-left: 3px solid #ca8a04; background: #fefce8; }
.rs-top    { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.rs-stage  { font-size: 9px; color: #94a3b8; font-weight: 600; }
.rs-title  { font-size: 10px; font-weight: 700; color: #0f172a; }
.rs-desc   { font-size: 9px; color: #64748b; line-height: 1.4; }
.rs-empty  { font-size: 11px; color: #94a3b8; padding: 12px; text-align: center; }
.ai-conclusion { display: flex; flex-direction: column; gap: 4px; }
.ai-conclusion p { margin: 0; font-size: 10px; color: #334155; line-height: 1.6; padding: 3px 0; border-bottom: 1px solid #f1f5f9; }
.ai-conclusion p:last-child { border-bottom: none; }
.ai-advice { padding: 8px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9px; font-size: 10px; color: #1d4ed8; line-height: 1.6; }
.ai-advice strong { font-weight: 700; }

/* ──────────── 合同列表项增强 ──────────── */
.ci-badges {
  display: flex; flex-wrap: wrap; gap: 4px; margin: 1px 0;
}
.ci-badge {
  font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 999px;
  border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b;
}
.ci-badge-cat { background: #f0f9ff; border-color: #bae6fd; color: #0369a1; }
.ci-badge-risk { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
.ci-status-high   { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
.ci-status-medium { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.ci-status-normal { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.ci-status-watch  { background: #fefce8; border-color: #fde68a; color: #a16207; }

.ci-dates {
  display: flex; justify-content: space-between;
  font-size: 9px; color: #94a3b8; margin-top: 1px;
}

.ci-progress-row {
  display: flex; align-items: center; gap: 4px;
  margin-top: 3px;
}
.ci-prog-lbl { font-size: 9px; color: #94a3b8; flex-shrink: 0; }
.ci-prog-bar {
  flex: 1; height: 4px; background: #f1f5f9; border-radius: 999px; overflow: hidden; min-width: 0;
}
.ci-prog-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.ci-prog-val  { font-size: 9px; font-weight: 700; color: #475569; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; }
.ci-prog-sep  { font-size: 9px; color: #cbd5e1; flex-shrink: 0; }

.ci-pay-method {
  font-size: 9px; color: #94a3b8; margin-top: 2px;
}

/* 风险摘要区域固定滚动 */
.risk-section {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

/* ──────────── 风险列表视图 ──────────── */
.risk-list-view {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 10px;
  padding: 10px 16px 12px;
  min-height: 0;
}

.rl-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }

.rl-stat-card { padding: 10px 14px; border-radius: 10px; }
.rsc-label { font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 3px; }
.rsc-value { font-size: 26px; font-weight: 800; line-height: 1; margin-bottom: 2px; }
.rsc-desc  { font-size: 10px; color: #94a3b8; }
.rsc-total  { border-left: 4px solid #2563eb; }
.rsc-high   { border-left: 4px solid #ef4444; }
.rsc-medium { border-left: 4px solid #f97316; }
.rsc-watch  { border-left: 4px solid #ca8a04; }
.rsc-normal { border-left: 4px solid #2563eb; }

.rl-domain-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ldb-left { display: flex; align-items: center; gap: 8px; }
.ldb-domain { font-size: 14px; font-weight: 800; color: #0f172a; }
.ldb-sep { color: #cbd5e1; }
.ldb-sub { font-size: 12px; color: #64748b; }
.ldb-filters { display: flex; align-items: center; gap: 5px; }
.ldb-filter { padding: 4px 10px; border-radius: 999px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.15s; }
.ldb-filter.active { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.ldb-search { margin-left: 8px; }
.search-inp { height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 11px; color: #334155; outline: none; width: 200px; }
.search-inp::placeholder { color: #94a3b8; }
.search-inp:focus { border-color: #93c5fd; }

.rl-table-wrap { min-height: 0; overflow: auto; }
.rl-table { width: 100%; border-collapse: separate; border-spacing: 0 4px; }
.rl-table th { position: sticky; top: 0; z-index: 2; padding: 10px 12px; font-size: 11px; color: #64748b; font-weight: 700; text-align: left; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.rl-table td { padding: 10px 12px; font-size: 12px; color: #334155; background: #fff; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
.rl-table td:first-child { border-left: 1px solid #f1f5f9; border-radius: 8px 0 0 8px; }
.rl-table td:last-child  { border-right: 1px solid #f1f5f9; border-radius: 0 8px 8px 0; }
.rl-row { cursor: pointer; transition: 0.15s; }
.rl-row:hover td { background: #f8fafc; border-color: #e2e8f0; }

.risk-id-link { font-size: 12px; font-weight: 700; color: #2563eb; background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 2px; }
.risk-id-link:hover { color: #1d4ed8; }

.risk-name-cell { display: flex; flex-direction: column; gap: 2px; }
.risk-name-cell strong { font-size: 12px; color: #0f172a; }
.risk-name-cell span   { font-size: 10px; color: #64748b; }

.mono-cell { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; }

.subject-cell { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: #475569; }

.ref-cell { display: flex; flex-direction: column; gap: 3px; }
.ref-tag { display: inline-flex; padding: 1px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; width: fit-content; }

.status-pill { display: inline-flex; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
.sp-checking { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.sp-pending  { background: #fefce8; color: #ca8a04; border: 1px solid #fde68a; }
.sp-closed   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.row-ops { display: flex; gap: 5px; }
.op-btn { height: 24px; padding: 0 9px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; transition: 0.14s; }
.op-btn:hover { background: #2563eb; color: #fff; }
.op-btn.ghost { background: #f8fafc; border-color: #e2e8f0; color: #64748b; }
.op-btn.ghost:hover { background: #f1f5f9; }

.empty-row { text-align: center; color: #94a3b8; padding: 32px; font-size: 13px; }

/* ──────────── 风险详情报告视图 ──────────── */
.rd-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 16px 12px;
  position: relative;
}
.rd-topbar { flex-shrink: 0; }
.rd-content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 10px;
}

.rd-sidebar { display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; align-self: start; max-height: 100%; }

/* 元信息卡 */
.rd-meta-card { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.rdm-id-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rdm-id   { font-size: 11px; font-weight: 800; color: #2563eb; font-family: 'JetBrains Mono', monospace; }
.rdm-name { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.3; }
.rdm-subname { font-size: 11px; color: #64748b; }
.rdm-rows { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid #f1f5f9; padding-top: 8px; }
.rdm-row { display: flex; flex-direction: column; gap: 1px; }
.rdm-row > span { font-size: 9px; color: #94a3b8; }
.rdm-row > strong { font-size: 11px; color: #0f172a; }
.rdm-subjects { display: flex; flex-direction: column; gap: 2px; }
.rdm-subjects strong { font-size: 10px; color: #334155; font-weight: 600; }
.link-text { color: #2563eb; cursor: pointer; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
.link-text:hover { color: #1d4ed8; }

/* 状态流卡 */
.rd-status-card { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.rds-title { font-size: 11px; font-weight: 800; color: #0f172a; }

.status-flow { display: flex; flex-direction: column; gap: 0; }
.sf-step { display: flex; align-items: flex-start; gap: 9px; position: relative; padding-bottom: 12px; }
.sf-step:last-child { padding-bottom: 0; }
.sf-dot { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; margin-top: 2px; z-index: 1; }
.sf-step.done .sf-dot    { background: #22c55e; border-color: #22c55e; }
.sf-step.current .sf-dot { background: #2563eb; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
.sf-step span { font-size: 11px; color: #64748b; font-weight: 600; }
.sf-step.done span    { color: #16a34a; }
.sf-step.current span { color: #1d4ed8; font-weight: 800; }
.sf-line { position: absolute; left: 5px; top: 14px; width: 1px; height: calc(100% - 12px); background: #e2e8f0; z-index: 0; }
.sf-step.done .sf-line { background: #22c55e; }

.rds-meta { display: flex; flex-direction: column; gap: 5px; border-top: 1px solid #f1f5f9; padding-top: 8px; }
.rds-meta > div { display: flex; flex-direction: column; gap: 1px; }
.rds-meta span { font-size: 9px; color: #94a3b8; }
.rds-meta strong { font-size: 11px; color: #334155; }
.deadline { color: #ef4444 !important; }

/* 操作卡 */
.rd-actions-card { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.rda-title { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
.rda-btn { width: 100%; height: 32px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; transition: 0.15s; }
.rda-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.rda-btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.rda-btn.primary:hover { background: #1d4ed8; }
.rda-btn.danger  { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
.rda-btn.danger:hover  { background: #ef4444; color: #fff; }
.rda-btn.ghost { background: #f8fafc; color: #94a3b8; }

/* 报告正文区 */
.rd-main { min-height: 0; }
.rd-report { height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr); }

.rdr-header { padding: 16px 20px 12px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.rdr-header h2 { margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a; }
.rdr-header p  { margin: 0; font-size: 11px; color: #64748b; }
.rdr-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.rdr-back-btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.16s ease;
}
.rdr-back-btn:hover {
  border-color: #93c5fd;
  background: #dbeafe;
}
.rdr-time { font-size: 11px; color: #94a3b8; white-space: nowrap; }

.rdr-scroll { overflow-y: auto; padding: 16px 20px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }

.rdr-section { margin-bottom: 22px; }
.rdr-section.last-section { margin-bottom: 0; }
.rdr-section-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #eff6ff; }
.rsn-num { display: inline-flex; width: 20px; height: 20px; border-radius: 50%; background: #2563eb; color: #fff; font-size: 10px; font-weight: 800; align-items: center; justify-content: center; flex-shrink: 0; }

.rdr-para { margin: 0; font-size: 13px; line-height: 1.8; color: #334155; }
.warn-text { color: #ef4444; font-weight: 700; }

.rdr-def-box { padding: 12px 14px; background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; font-size: 12px; line-height: 1.75; color: #334155; }
.rdr-def-box strong { color: #b45309; }

.rdr-list { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
.rdr-list li { font-size: 12px; line-height: 1.75; color: #334155; }
.rdr-list.linked-list { list-style-type: none; padding-left: 0; counter-reset: list-counter; }
.rdr-list.linked-list li { counter-increment: list-counter; display: grid; grid-template-columns: 20px 1fr; gap: 4px; }
.rdr-list.linked-list li::before { content: counter(list-counter) "."; font-weight: 700; color: #2563eb; font-size: 12px; margin-top: 2px; }

.inline-link { display: inline; font-size: inherit; font-weight: 700; color: #2563eb; background: none; border: none; cursor: pointer; padding: 0 1px; text-decoration: underline; text-underline-offset: 2px; border-radius: 3px; transition: 0.14s; }
.inline-link:hover { color: #1d4ed8; background: #eff6ff; }
.inline-link.proc-link { color: #7c3aed; }
.inline-link.proc-link:hover { background: #f5f3ff; }

.price-compare { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.pc-item { padding: 10px 12px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 4px; }
.pc-item.warn { background: #fff5f5; border-color: #fecaca; }
.pc-label { font-size: 10px; color: #64748b; }
.pc-val   { font-size: 16px; font-weight: 800; color: #0f172a; }
.pc-tag   { width: fit-content; }

/* 证据卡片布局 */
.evidence-cards { display: flex; flex-direction: column; gap: 8px; }
.ev-card {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 0 14px;
  align-items: start;
  padding: 10px 14px 10px 0;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
}
.ev-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--ev-c, #2563eb);
  border-radius: 10px 0 0 10px;
}
.ev-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 2px 0 0 14px;
}
.ev-num {
  font-size: 13px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: var(--ev-c, #2563eb);
  line-height: 1;
}
.ev-badge {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: var(--ev-bg, #eff6ff);
  color: var(--ev-c, #2563eb);
  white-space: nowrap;
}
.ev-text { margin: 0; font-size: 12px; line-height: 1.8; color: #334155; padding: 2px 0; }
.ev-highlight { color: #ef4444; font-weight: 800; }

/* Domain color tokens */
.ev-contract { --ev-c: #2563eb; --ev-bg: #eff6ff; }
.ev-history  { --ev-c: #16a34a; --ev-bg: #f0fdf4; }
.ev-proc     { --ev-c: #7c3aed; --ev-bg: #f5f3ff; }
.ev-market   { --ev-c: #f97316; --ev-bg: #fff7ed; }
.ev-finance  { --ev-c: #ca8a04; --ev-bg: #fefce8; }

.rdr-conclusion-box { margin-top: 12px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; font-size: 12px; color: #991b1b; line-height: 1.7; }

/* 穿透链接组 */
.pene-link-groups { display: flex; flex-direction: column; gap: 12px; }
.plg-group { display: flex; flex-direction: column; gap: 7px; }
.plg-label { font-size: 11px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 7px; }
.plg-nav-hint { font-size: 10px; color: #7c3aed; font-weight: 600; }
.plg-tags { display: flex; flex-wrap: wrap; gap: 6px; }

.plg-tag { display: inline-flex; flex-direction: column; gap: 1px; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; text-align: left; transition: 0.15s; }
.plg-tag:hover { border-color: #93c5fd; background: #eff6ff; }
.plg-id   { font-size: 11px; font-weight: 700; color: #2563eb; font-family: 'JetBrains Mono', monospace; }
.plg-name { font-size: 9px; color: #64748b; }

.plg-proc .plg-tag.proc-tag { border-color: #ddd6fe; background: #f5f3ff; }
.plg-proc .plg-tag.proc-tag:hover { border-color: #a78bfa; background: #ede9fe; }
.plg-proc .plg-tag.proc-tag .plg-id { color: #7c3aed; }

.fin-tag { border-color: #fde68a; background: #fefce8; }
.fin-tag:hover { border-color: #f59e0b; background: #fffbeb; }
.fin-tag .plg-id { color: #b45309; }

.ext-tag { border-color: #bbf7d0; background: #f0fdf4; }
.ext-tag:hover { border-color: #4ade80; background: #dcfce7; }
.ext-tag .plg-id { color: #166534; }

/* 第七节进度条 */
.proc-track { display: flex; flex-direction: row; gap: 0; align-items: flex-start; margin-bottom: 14px; }
.pt-step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
.pt-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; z-index: 1; }
.pt-step.done .pt-dot    { background: #22c55e; border-color: #22c55e; }
.pt-step.current .pt-dot { background: #2563eb; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.16); }
.pt-step::before { content: ''; position: absolute; top: 7px; left: calc(-50% + 7px); right: calc(50% + 7px); height: 2px; background: #e2e8f0; }
.pt-step:first-child::before { display: none; }
.pt-step.done::before { background: #22c55e; }
.pt-body { margin-top: 7px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.pt-body strong { font-size: 10px; color: #475569; }
.pt-step.done .pt-body strong    { color: #16a34a; }
.pt-step.current .pt-body strong { color: #1d4ed8; font-weight: 800; }
.pt-current-badge { font-size: 9px; background: #eff6ff; color: #2563eb; padding: 1px 6px; border-radius: 999px; font-weight: 700; border: 1px solid #bfdbfe; }

.pt-meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.ptm-item { padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; flex-direction: column; gap: 2px; }
.ptm-item span   { font-size: 9px; color: #94a3b8; }
.ptm-item strong { font-size: 11px; color: #334155; }
.ptm-item .deadline { color: #ef4444; }

/* ──────────── 机构树选中态 ──────────── */
.ctree-all-row {
  font-size: 11px; font-weight: 700; color: #475569;
  border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; border-radius: 8px;
}
.ctree-selected {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
}
.ctree-selected .ctree-name { color: #1d4ed8; }
.ctree-selected .ctree-cnt  { color: #93c5fd; }
.ctree-selected .ctree-arrow { color: #2563eb; }

/* ──────────── 合同列表面板 ──────────── */
.contract-list-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cl-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.cl-filter-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.clf-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
  white-space: nowrap;
}
.clf-tab:hover { border-color: #93c5fd; background: #eff6ff; color: #2563eb; }
.clf-tab.active { background: #2563eb; border-color: #2563eb; color: #fff; }
.clf-count {
  font-size: 10px;
  font-weight: 700;
  background: rgba(255,255,255,0.25);
  border-radius: 999px;
  padding: 0 5px;
  line-height: 1.5;
}
.clf-tab:not(.active) .clf-count {
  background: #e2e8f0;
  color: #64748b;
}

.cl-total-tip { font-size: 10px; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }

.cl-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.cl-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
  padding: 32px 0;
}

/* ── 合同卡片 ── */
.cl-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: box-shadow 0.16s, border-color 0.16s;
  border-left: 4px solid #e2e8f0;
}
.cl-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.08); border-color: #bfdbfe; }
.cl-active { border-color: #93c5fd !important; background: #f0f7ff; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }

.cl-high   { border-left-color: #ef4444; }
.cl-medium { border-left-color: #f97316; }
.cl-watch  { border-left-color: #ca8a04; }
.cl-normal { border-left-color: #16a34a; }

.clc-top { display: flex; flex-direction: column; gap: 3px; }
.clc-id-row { display: flex; align-items: center; gap: 6px; }
.clc-id { font-size: 10px; font-weight: 700; color: #2563eb; font-family: 'JetBrains Mono', monospace; }
.clc-risk-cnt { font-size: 10px; font-weight: 700; color: #ef4444; background: #fef2f2; border-radius: 999px; padding: 0 5px; }
.clc-name { font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.3; }

.clc-badges { display: flex; flex-wrap: wrap; gap: 4px; }

.clc-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.clc-supplier { font-size: 10px; color: #64748b; }
.clc-amount   { font-size: 13px; font-weight: 800; }

/* ── 合同卡片操作按钮区 ── */
.clc-actions {
  display: flex;
  gap: 5px;
  margin-top: 2px;
  padding-top: 6px;
  border-top: 1px solid #f1f5f9;
}
.clc-btn {
  flex: 1;
  height: 26px;
  border-radius: 7px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.14s;
  white-space: nowrap;
}
.clc-btn:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
.clc-btn-chart  { }
.clc-btn-detail { background: #f0f7ff; border-color: #bfdbfe; color: #1d4ed8; }
.clc-btn-detail:hover { background: #dbeafe; }
.clc-btn-risk   { background: #fef2f2; border-color: #fecaca; color: #ef4444; }
.clc-btn-risk:hover { background: #ef4444; color: #fff; }

/* ──────────── 多维风险面板 ──────────── */
.domain-risk-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
}

.domain-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.domain-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.domain-item:hover { border-color: #bfdbfe; background: #f8fbff; box-shadow: 0 2px 8px rgba(37,99,235,0.07); }

.di-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.di-icon { font-size: 20px; flex-shrink: 0; line-height: 1; }
.di-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.di-top-row { display: flex; align-items: center; gap: 6px; }
.di-domain { font-size: 12px; font-weight: 800; color: #334155; }
.di-title  { font-size: 11px; color: #64748b; line-height: 1.4; }

.di-action { flex-shrink: 0; }

.di-analyze-btn {
  height: 24px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.14s;
  white-space: nowrap;
}
.di-analyze-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

.di-spin-wrap {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #2563eb;
}
.di-spin-ring {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #bfdbfe;
  border-top-color: #2563eb;
  animation: di-spin-anim 0.75s linear infinite;
  flex-shrink: 0;
  display: inline-block;
}
.di-spin-lbl {
  font-size: 10px;
  font-weight: 600;
  color: #2563eb;
  white-space: nowrap;
}
@keyframes di-spin-anim {
  to { transform: rotate(360deg); }
}

.domain-clear {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 9px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
}
.dc-icon {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #16a34a;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.di-report-btn {
  height: 24px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #16a34a;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.14s;
  white-space: nowrap;
}
.di-report-btn:hover { background: #16a34a; color: #fff; border-color: #16a34a; }

.domain-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 11px;
  padding: 24px 0;
}

/* ──────────── 侧拉抽屉 ──────────── */
.ct-drawer {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: all;
}

.drawer-mask {
  position: absolute;
  inset: 0;
  background: transparent;
}

.drawer-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 680px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  border-radius: 12px 0 0 12px;
  border-right: none;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.drawer-title { display: flex; align-items: center; gap: 10px; }
.drawer-contract-id { font-size: 13px; font-weight: 800; color: #2563eb; font-family: 'JetBrains Mono', monospace; }
.drawer-subtitle { font-size: 11px; color: #64748b; }
.drawer-close {
  width: 28px; height: 28px;
  border-radius: 7px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: 0.14s;
  display: flex; align-items: center; justify-content: center;
}
.drawer-close:hover { background: #fef2f2; border-color: #fecaca; color: #ef4444; }

.drawer-chart {
  height: 220px;
  flex-shrink: 0;
  padding: 0 14px;
}

.drawer-risk-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px 14px;
  border-top: 1px solid #f1f5f9;
}

.drawer-risk-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

/* 抽屉整体进出：蒙层 opacity，面板 translateX */
.drawer-slide-enter-active { transition: opacity 0.25s ease; }
.drawer-slide-leave-active { transition: opacity 0.2s ease; }
.drawer-slide-enter-from,
.drawer-slide-leave-to { opacity: 0; }

.drawer-slide-enter-active .drawer-panel { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
.drawer-slide-leave-active .drawer-panel { transition: transform 0.22s ease-in; }
.drawer-slide-enter-from  .drawer-panel  { transform: translateX(100%); }
.drawer-slide-leave-to    .drawer-panel  { transform: translateX(100%); }

/* ──────────── 合同详情视图 ──────────── */
.cd-view {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px 16px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cd-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  flex-shrink: 0;
}
.cd-topbar-left  { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.cd-topbar-right { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; justify-content: flex-end; }
.cd-id { font-size: 13px; font-weight: 800; color: #2563eb; font-family: 'JetBrains Mono', monospace; }

.cd-core-risk-inline {
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 7px;
  padding: 4px 10px;
  max-width: 360px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.cd-ai-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #eff6ff, #f0f9ff);
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}
.cd-status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

.cd-body { display: flex; flex-direction: column; gap: 10px; }

.cd-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cd-sec-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  padding-bottom: 8px;
  border-bottom: 2px solid #eff6ff;
}
.cd-sec-num {
  display: inline-flex;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* AI 总览 grid */
.cd-ai-overview { background: linear-gradient(160deg, #eff6ff 0%, #f0f9ff 100%); border-color: #bfdbfe; }
.cd-ai-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
.cd-ai-item {
  padding: 8px 10px;
  background: rgba(255,255,255,0.7);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cd-ai-item span   { font-size: 10px; color: #3b82f6; }
.cd-ai-item strong { font-size: 11px; font-weight: 700; color: #0f172a; }
.cd-ai-item-full { grid-column: 1 / -1; }

/* 两列布局 */
.cd-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* 三列布局（基础主体信息） */
.cd-three-col {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

/* 四列布局（六七八九合并行） */
.cd-four-col {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

/* 字段行布局 */
.cd-field-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 6px 12px;
}

.cd-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: #f8fafc;
  border-radius: 7px;
}
.cd-field span   { font-size: 9px; color: #94a3b8; }
.cd-field strong { font-size: 11px; font-weight: 600; color: #0f172a; line-height: 1.4; }

.cd-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}
.cd-fg-title { font-size: 10px; font-weight: 800; color: #475569; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; margin-bottom: 2px; }

.cd-risk-flag { color: #ef4444; font-weight: 700; }

/* 金额 grid */
.cd-amount-grid {
  display: grid;
  grid-template-columns: 2fr repeat(3, minmax(0,1fr)) repeat(4, minmax(0,1fr));
  gap: 6px;
}
@media (max-width: 1400px) {
  .cd-amount-grid { grid-template-columns: repeat(4, minmax(0,1fr)); }
}
.cd-amount-card {
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cd-amount-card span   { font-size: 10px; color: #94a3b8; }
.cd-amount-card strong { font-size: 14px; font-weight: 800; color: #0f172a; }
.cd-amount-card em     { font-size: 10px; font-style: normal; color: #64748b; }
.cd-amount-total { background: linear-gradient(160deg, #eff6ff, #f8fafc); border-color: #bfdbfe; }
.cd-amount-total strong { color: #2563eb; font-size: 16px; }
.cd-amount-warn { border-color: #fecaca; background: #fff5f5; }
.cd-amount-warn strong { color: #ef4444; }

/* 合规标签 */
.cd-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.cd-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
}
.cd-tag-risk { background: #fef2f2; border-color: #fecaca; color: #ef4444; }

/* AI 合规审查 */
.cd-ai-review { background: #fafafa; }
.cd-opinion-item {
  padding: 12px 14px;
  border-radius: 9px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cd-op-head { display: flex; align-items: center; gap: 8px; }
.cd-op-title { font-size: 12px; font-weight: 800; color: #0f172a; }
.cd-op-body  { font-size: 11px; color: #334155; line-height: 1.75; }
.cd-op-suggest { font-size: 10px; color: #475569; background: #f1f5f9; border-radius: 6px; padding: 6px 9px; border-left: 3px solid #2563eb; }

.cd-op-high   { border-color: #fecaca; background: #fff5f5; }
.cd-op-high .cd-op-suggest { border-color: #ef4444; }
.cd-op-medium { border-color: #fed7aa; background: #fff8f1; }
.cd-op-medium .cd-op-suggest { border-color: #f97316; }
.cd-op-watch  { border-color: #fde68a; background: #fefce8; }
.cd-op-watch .cd-op-suggest  { border-color: #ca8a04; }

/* micro-scroll 统一 */
.micro-scroll {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
.micro-scroll::-webkit-scrollbar       { width: 4px; }
.micro-scroll::-webkit-scrollbar-track { background: transparent; }
.micro-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }

/* ──────────── 风险项面板 ──────────── */
.risk-items-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
}
.rip-contract-name {
  font-size: 9px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ri-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

/* ── 风险项卡片 ── */
.ri-card {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #e2e8f0;
  background: #f8fafc;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: box-shadow 0.16s, border-color 0.16s, background 0.16s;
}
.ri-card:hover { background: #fff; box-shadow: 0 4px 16px rgba(15,23,42,0.08); }

.ri-high   { border-left-color: #ef4444; }
.ri-medium { border-left-color: #f97316; }
.ri-watch  { border-left-color: #ca8a04; }
.ri-normal { border-left-color: #16a34a; }
.ri-high:hover   { border-color: #fca5a5; }
.ri-medium:hover { border-color: #fed7aa; }
.ri-watch:hover  { border-color: #fde68a; }

.ric-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ric-id {
  font-size: 11px;
  font-weight: 800;
  color: #2563eb;
  font-family: 'JetBrains Mono', monospace;
}
.ric-status {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  margin-left: auto;
  white-space: nowrap;
}
.rics-checking { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
.rics-pending  { background: #fefce8; border: 1px solid #fde68a; color: #a16207; }
.rics-fixing   { background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; }
.rics-done     { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }

.ric-name {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}
.ric-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ric-time { font-size: 10px; color: #94a3b8; }

.ric-subjects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ric-subject {
  font-size: 10px;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  padding: 1px 6px;
}
.ric-index {
  font-size: 10px;
  color: #64748b;
  line-height: 1.4;
  border-top: 1px dashed #e2e8f0;
  padding-top: 5px;
}
.ric-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
  margin-top: 2px;
}
.ric-view-hint {
  font-size: 10px;
  color: #2563eb;
  font-weight: 600;
}

/* AI 分析按钮 */
.ric-ai-btn {
  height: 24px;
  padding: 0 11px;
  border-radius: 7px;
  border: 1px solid #bfdbfe;
  background: linear-gradient(135deg, #eff6ff, #f0f9ff);
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.14s;
  white-space: nowrap;
}
.ric-ai-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

/* 分析中状态 */
.ric-analyzing {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* 查看报告按钮 */
.ric-report-btn {
  height: 24px;
  padding: 0 11px;
  border-radius: 7px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.14s;
  white-space: nowrap;
}
.ric-report-btn:hover { background: #16a34a; color: #fff; border-color: #16a34a; }

/* ──────────── 穿透详情面板（覆盖在 rd-view 内） ──────────── */
.pene-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  pointer-events: all;
}

.pene-modal {
  width: 680px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  border-radius: 12px 0 0 12px;
  border-right: none;
  overflow: hidden;
  box-shadow: -8px 0 32px rgba(15,23,42,0.12);
}

.pene-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 8px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.pene-head-left { display: flex; align-items: center; gap: 8px; }
.pene-label {
  font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px;
  background: linear-gradient(135deg, #eff6ff, #f0f9ff); border: 1px solid #bfdbfe; color: #1d4ed8;
}
.pene-id    { font-size: 12px; font-weight: 800; color: #2563eb; font-family: 'JetBrains Mono', monospace; }
.pene-title { font-size: 13px; font-weight: 800; color: #0f172a; }
.pene-subtitle {
  font-size: 11px; color: #64748b;
  padding: 0 16px 10px;
  flex-shrink: 0;
}

.pene-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pene-sec-title {
  font-size: 11px; font-weight: 800; color: #334155;
  padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;
}

/* 穿透数据表格 */
.pene-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.pene-table th {
  padding: 7px 10px;
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
.pene-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f8fafc;
  color: #334155;
}
.pene-table tr:hover td { background: #fafcff; }

.ptr-current td { background: #fffbeb; }
.ptr-cur-badge {
  display: inline-flex; margin-left: 5px;
  font-size: 9px; font-weight: 700;
  padding: 1px 5px; border-radius: 999px;
  background: #2563eb; color: #fff;
}
.ptr-price-high strong { color: #ef4444; font-weight: 800; }
.ptr-status {
  display: inline-flex; padding: 1px 7px; border-radius: 999px;
  font-size: 10px; font-weight: 600;
}
.ptr-st-active { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.ptr-st-done   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.pene-kv-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; background: #f8fafc; border-radius: 8px;
}
.pene-kv-label { font-size: 11px; color: #64748b; }
.pene-kv-val   { font-size: 12px; }
.pene-kv-green { color: #16a34a; }

.pene-kv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.pene-kv-item {
  display: flex; flex-direction: column; gap: 2px;
  padding: 6px 10px; background: #f8fafc; border-radius: 7px;
}
.pene-kv-item span   { font-size: 9px; color: #94a3b8; }
.pene-kv-item strong { font-size: 11px; color: #0f172a; }

.pene-conclusion-box {
  padding: 10px 12px;
  border-radius: 9px;
  font-size: 11px;
  line-height: 1.7;
  color: #334155;
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.pene-ok  { background: #f0fdf4 !important; border-color: #bbf7d0 !important; color: #15803d !important; }
.pene-warn { background: #fef2f2; border-color: #fecaca; }

/* 核查结论录入 */
.pene-resolution {
  flex-shrink: 0;
  padding: 12px 16px 14px;
  border-top: 2px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.pene-res-title { font-size: 12px; font-weight: 800; color: #0f172a; }
.pene-res-desc  { font-size: 11px; color: #64748b; }
.pene-res-btns  { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.prb-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  border: 1px solid #e2e8f0; background: #fff;
  cursor: pointer; text-align: left;
  transition: 0.16s;
}
.prb-icon { font-size: 18px; flex-shrink: 0; }
.prb-text { display: flex; flex-direction: column; gap: 1px; }
.prb-text strong { font-size: 12px; color: #0f172a; }
.prb-text em { font-size: 10px; font-style: normal; color: #64748b; }

.prb-resolve {
  border-color: #bbf7d0; background: #f0fdf4;
}
.prb-resolve .prb-icon { color: #16a34a; }
.prb-resolve:hover { background: #16a34a; border-color: #16a34a; }
.prb-resolve:hover strong, .prb-resolve:hover em { color: #fff; }

.prb-escalate {
  border-color: #fecaca; background: #fef2f2;
}
.prb-escalate .prb-icon { color: #ef4444; }
.prb-escalate:hover { background: #ef4444; border-color: #ef4444; }
.prb-escalate:hover strong, .prb-escalate:hover em { color: #fff; }

/* 穿透面板滑入动画 */
.pene-slide-enter-active { transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease; }
.pene-slide-leave-active { transition: transform 0.2s ease-in, opacity 0.18s ease; }
.pene-slide-enter-from, .pene-slide-leave-to { transform: translateX(60px); opacity: 0; }

/* 穿透激活按钮（可点击穿透的链接标记） */
.plg-tag.pene-active { border-color: #a78bfa; background: #f5f3ff; }
.plg-tag.pene-active:hover { border-color: #7c3aed; background: #ede9fe; }
.plg-tag.pene-active .plg-id { color: #7c3aed; }
.plg-tag.pene-active .plg-name { color: #7c3aed; font-weight: 700; }
</style>
