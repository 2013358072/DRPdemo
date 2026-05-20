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
        <!-- 左：公司-分公司-合同 树状列表 -->
        <aside class="ct-left">
          <div class="card side-panel tree-panel">
            <div class="sp-head">
              <h3>合同列表</h3>
              <span class="pill blue">{{ contracts.length }} 份</span>
            </div>
            <div class="company-tree micro-scroll">
              <div v-for="grp in companyTree" :key="grp.id" class="ctree-group">
                <!-- 集团公司行 -->
                <button class="ctree-row ctree-group-row" type="button" @click="toggleNode(grp.id)">
                  <span class="ctree-arrow" :class="{ open: expandedNodes.has(grp.id) }">›</span>
                  <span class="ctree-ico">🏢</span>
                  <span class="ctree-name">{{ grp.name }}</span>
                  <span class="ctree-cnt">{{ grp.totalContracts }} 份</span>
                </button>
                <!-- 分公司 -->
                <div v-show="expandedNodes.has(grp.id)" class="ctree-children">
                  <div v-for="br in grp.children" :key="br.id">
                    <button class="ctree-row ctree-branch-row" type="button" @click="toggleNode(br.id)">
                      <span class="ctree-arrow" :class="{ open: expandedNodes.has(br.id) }">›</span>
                      <span class="ctree-ico">🏬</span>
                      <span class="ctree-name">{{ br.name }}</span>
                      <span class="ctree-cnt">{{ br.contracts.length }} 份</span>
                    </button>
                    <!-- 合同条目 -->
                    <div v-show="expandedNodes.has(br.id)" class="ctree-contracts">
                      <button
                        v-for="cid in br.contracts"
                        :key="cid"
                        type="button"
                        class="citem"
                        :class="[`ci-${contractById(cid).risk}`, { active: cid === activeContractId }]"
                        @click="selectContract(cid)"
                      >
                        <div class="ci-top">
                          <span class="ci-id">{{ contractById(cid).id }}</span>
                          <span class="risk-pill" :class="`rp-${contractById(cid).risk}`">{{ riskLabelMap[contractById(cid).risk] }}</span>
                        </div>
                        <div class="ci-name">{{ contractById(cid).name }}</div>
                        <div class="ci-badges">
                          <span class="ci-badge ci-badge-cat">{{ contractById(cid).category }}</span>
                          <span class="ci-badge" :class="`ci-status-${contractById(cid).risk}`">{{ contractById(cid).status }}</span>
                          <span v-if="contractById(cid).riskCount" class="ci-badge ci-badge-risk">⚠ {{ contractById(cid).riskCount }} 项风险</span>
                        </div>
                        <div class="ci-meta">
                          <span>{{ contractById(cid).supplier }}</span>
                          <strong :style="{ color: riskColor[contractById(cid).risk] }">{{ contractById(cid).amount }}</strong>
                        </div>
                        <div class="ci-dates">
                          <span>签订 {{ contractById(cid).signDate }}</span>
                          <span>到期 {{ contractById(cid).expireDate }}</span>
                        </div>
                        <div class="ci-progress-row">
                          <span class="ci-prog-lbl">履约</span>
                          <div class="ci-prog-bar">
                            <div class="ci-prog-fill" :style="{ width: contractById(cid).progress + '%', background: riskColor[contractById(cid).risk] }"></div>
                          </div>
                          <span class="ci-prog-val">{{ contractById(cid).progress }}%</span>
                          <span class="ci-prog-sep">·</span>
                          <span class="ci-prog-lbl">付款</span>
                          <span class="ci-prog-val" :style="{ color: contractById(cid).paidRatio > contractById(cid).progress ? '#ef4444' : '#16a34a' }">{{ contractById(cid).paidRatio }}%</span>
                        </div>
                        <div class="ci-pay-method">付款方式：{{ contractById(cid).payMethod }}</div>
                        <button
                          v-if="contractRiskMap[cid]"
                          type="button"
                          class="ci-risk-report-btn"
                          @click.stop="openRisk(contractRiskMap[cid])"
                        >📋 查看风险报告</button>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- 中：穿透面板 (图表 + 风险核查摘要) -->
        <main class="ct-center">
          <div class="card pene-panel">
            <div class="stage-tabs">
              <button
                v-for="(stage, i) in activeStages"
                :key="stage.id"
                type="button"
                class="stage-tab"
                :class="{ active: activeStageIdx === i, 'has-risk': stage.risks.length > 0 }"
                @click="activeStageIdx = i"
              >
                <span class="sn">{{ i + 1 }}</span>
                {{ stage.tabLabel }}
                <span v-if="stage.risks.length" class="risk-badge">{{ stage.risks.length }}</span>
              </button>
            </div>
            <div class="stage-chart">
              <EChart :option="stageChartOption" />
            </div>
            <!-- 风险核查摘要（图表下方） -->
            <div class="risk-section">
              <div class="rs-section-head">
                <span class="rs-section-title">风险核查摘要</span>
                <span class="pill red" style="font-size:10px;">{{ totalRisks }} 项</span>
              </div>
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
        </main>

        <!-- 右：合同详情 -->
        <aside class="ct-right">
          <div v-if="activeContract" class="card side-panel detail-panel">
            <div class="sp-head">
              <h3>合同详情</h3>
              <span class="risk-pill" :class="`rp-${activeContract.risk}`">{{ riskLabelMap[activeContract.risk] }}</span>
            </div>
            <div class="detail-grid">
              <div class="dg-row"><span>合同编号</span><strong>{{ activeContract.id }}</strong></div>
              <div class="dg-row"><span>签约单位</span><strong>{{ activeContract.company }}</strong></div>
              <div class="dg-row"><span>合作方</span><strong>{{ activeContract.supplier }}</strong></div>
              <div class="dg-row"><span>合同金额</span><strong :style="{ color: riskColor[activeContract.risk] }">{{ activeContract.amount }}</strong></div>
              <div class="dg-row"><span>签订日期</span><strong>{{ activeContract.signDate }}</strong></div>
              <div class="dg-row"><span>付款方式</span><strong>{{ activeContract.payMethod }}</strong></div>
            </div>
            <div class="link-section">
              <div class="ls-title">穿透链路</div>
              <div class="links-wrap">
                <span v-for="link in activeContract.links" :key="link.id" class="link-tag" :class="`lt-${link.type}`">
                  {{ link.id }}<em>{{ link.label }}</em>
                </span>
              </div>
            </div>
            <div class="action-btns">
              <button type="button" class="act-btn primary" @click="showToast('整改工单已派发至合规部', 'info')">派发整改工单</button>
              <button type="button" class="act-btn danger"  @click="showToast('风险预警已推送至责任人', 'warn')">发起风险预警</button>
              <button type="button" class="act-btn ghost"   @click="showToast('已纳入月度台账归档', 'info')">纳入台账</button>
              <button type="button" class="act-btn ghost"   @click="showToast('已标记待闭环，48h 后自动提醒', 'info')">标记待闭环</button>
            </div>
          </div>
        </aside>
        </div>
      </div>
    </template>


    <!-- ══════════ 风险事项详情报告视图 ══════════ -->
    <template v-if="viewMode === 'risk-detail' && activeRisk">
      <div class="rd-view">

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
              <div class="rdr-header-right">
                <button type="button" class="rdr-back-btn" @click="backToContractView">返回合同穿透</button>
                <span class="rdr-time">生成时间：{{ activeRisk.alertTime }}</span>
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
                      <button type="button" class="plg-tag" @click="showToast('已加载供应商历史合同列表', 'info')">
                        <span class="plg-id">HT-供应商历史</span><span class="plg-name">供应商历史合同</span>
                      </button>
                      <button type="button" class="plg-tag" @click="showToast('已加载合同审批记录 SP-202605002', 'info')">
                        <span class="plg-id">SP-202605002</span><span class="plg-name">合同审批记录</span>
                      </button>
                    </div>
                  </div>
                  <div class="plg-group plg-proc">
                    <div class="plg-label">采购域 <span class="plg-nav-hint">↗ 点击跳转采购穿透页</span></div>
                    <div class="plg-tags">
                      <button type="button" class="plg-tag proc-tag" @click="navigateToProcurement">
                        <span class="plg-id">CG-202605002</span><span class="plg-name">采购计划详情</span>
                      </button>
                      <button type="button" class="plg-tag proc-tag" @click="navigateToProcurement">
                        <span class="plg-id">XJ-202605002</span><span class="plg-name">采购询价记录</span>
                      </button>
                      <button type="button" class="plg-tag proc-tag" @click="navigateToProcurement">
                        <span class="plg-id">BJ-202605002</span><span class="plg-name">供应商报价记录</span>
                      </button>
                    </div>
                  </div>
                  <div class="plg-group">
                    <div class="plg-label">财务域</div>
                    <div class="plg-tags">
                      <button type="button" class="plg-tag fin-tag" @click="showToast('已加载发票详情 FP-202605003', 'info')">
                        <span class="plg-id">FP-202605003</span><span class="plg-name">发票详情</span>
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

      </div>
    </template>

  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, onBeforeUnmount, ref } from 'vue'
import EChart from '@/components/EChart.vue'

const emit = defineEmits(['navigate'])

// ──────────── 全局状态 ────────────
const viewMode = ref('penetration') // 'penetration' | 'risk-detail'
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
  { label: '集团总计合同', value: '14,205', unit: '项', badge: '全量监控', color: '#2563eb', bg: '#eff6ff', pillBg: '#dbeafe', sub: '覆盖全集团所有合同台账' },
  { label: '穿透核查覆盖率', value: '98.4', unit: '%',  badge: '高覆盖',   color: '#16a34a', bg: '#f0fdf4', pillBg: '#dcfce7', sub: '较上季度提升 1.2 个百分点' },
  { label: '实时触发预警', value: '12',    unit: '件',  badge: '待处置',   color: '#f97316', bg: '#fff7ed', pillBg: '#fed7aa', sub: '本月新增 3 件，已派发 9 件' },
  { label: '待整改闭环',   value: '3',     unit: '件',  badge: '逾期预警', color: '#ef4444', bg: '#fef2f2', pillBg: '#fee2e2', sub: '最长逾期 14 天，需立即跟进' },
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

</script>

<style scoped>
/* ──────────── 场景骨架 ──────────── */
.ct-scene {
  height: 100%;
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
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  display: grid;
  grid-template-columns: 480px minmax(0, 1fr) 300px;
  gap: 8px;
  padding: 8px 16px 10px;
  min-height: 0;
}

.ct-left  { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.ct-right { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.ct-center { min-height: 0; }

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

.stage-tabs { display: flex; gap: 5px; flex-wrap: wrap; }
.stage-tab { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 9px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.16s ease; white-space: nowrap; }
.stage-tab:hover, .stage-tab.active { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; box-shadow: 0 0 0 3px rgba(37,99,235,0.09); }

.sn { width: 17px; height: 17px; border-radius: 50%; background: #dbeafe; color: #1d4ed8; font-size: 9px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stage-tab.active .sn { background: #2563eb; color: #fff; }
.risk-badge { background: #ef4444; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 999px; }

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
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 10px;
  padding: 10px 16px 12px;
}

.rd-sidebar { display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }

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
</style>
