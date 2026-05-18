/* ===================================================================
   DRP 模拟数据 · 严格对照「42张最小业务还原版」
   =================================================================== */

// 场景元信息
export const SCENES = [
  { key:'dashboard', num:'01', name:'风险驾驶舱',
    icon:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z' },
  { key:'invest',    num:'02', name:'投资穿透',
    icon:'M3 17l6-6 4 4 8-8M14 7h7v7' },
  { key:'finance',   num:'04', name:'财务穿透',
    icon:'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { key:'equity',    num:'05', name:'产权穿透',
    icon:'M12 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM5 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 7.5v4M12 11.5L5.5 17M12 11.5L18.5 17' },
  { key:'overseas',  num:'09', name:'境外穿透',
    icon:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' },
  { key:'ai',        num:'10', name:'AI 智能体',
    icon:'M3 7h18v13H3zM8 3v4M16 3v4M8.5 11.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM15.5 11.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z' }
]

// 数据字典统计 (drp_dl1~5 + drp_data_standard)
export const D_DICT = {
  entityCount: 42,    // 42张表
  layers: 9,
  fields: 612,
  standards: 142
}

// 82家法人单位 (drp_org_unit)
export const D_UNITS = (() => {
  const list = []
  const cfg = [
    { plate:'火电',   count:22, red:1, orange:2, yellow:4 },
    { plate:'新能源', count:18, red:1, orange:3, yellow:4 },
    { plate:'煤炭',   count:14, red:0, orange:2, yellow:3 },
    { plate:'化工',   count:16, red:2, orange:3, yellow:5 },
    { plate:'金融',   count:12, red:0, orange:1, yellow:2 }
  ]
  const names = {
    '火电':['华北火电','东能发电','西北热电','南方电力','中盛能源'],
    '新能源':['绿源风电','光启新能','北疆风电','南海光伏','海风能源'],
    '煤炭':['晋北煤业','陕西矿业','内蒙煤电','准格尔煤'],
    '化工':['华东化工','盛达化学','中盐化工','海湾化工','宁夏煤化'],
    '金融':['集团财司','能源信托','产投基金']
  }
  let idx = 0
  cfg.forEach(c => {
    for (let i = 0; i < c.count; i++) {
      idx++
      let risk = '绿'
      if (i < c.red) risk = '红'
      else if (i < c.red + c.orange) risk = '橙'
      else if (i < c.red + c.orange + c.yellow) risk = '黄'
      const base = names[c.plate][i % names[c.plate].length]
      const suf = i < names[c.plate].length ? '' : `(${Math.floor(i / names[c.plate].length) + 1})`
      list.push({
        id:`U${String(idx).padStart(3,'0')}`,
        name:base+suf+'有限公司', plate:c.plate, risk,
        score: risk === '红' ? 25 + Math.floor(Math.random()*15)
             : risk === '橙' ? 45 + Math.floor(Math.random()*15)
             : risk === '黄' ? 60 + Math.floor(Math.random()*15)
             : 80 + Math.floor(Math.random()*15)
      })
    }
  })
  return list
})()

// 7日风险趋势 (drp_risk_event 聚合)
export const D_TREND = [
  { date:'05-12', red:2, orange:4, yellow:8 },
  { date:'05-13', red:3, orange:5, yellow:10 },
  { date:'05-14', red:2, orange:7, yellow:9 },
  { date:'05-15', red:4, orange:6, yellow:11 },
  { date:'05-16', red:3, orange:8, yellow:12 },
  { date:'05-17', red:5, orange:9, yellow:14 },
  { date:'05-18', red:6, orange:11, yellow:25 }
]

// 板块×场景风险矩阵
export const D_PLATE_MX = [
  { plate:'火电',   invest:2, fund:1, contract:3, procurement:2 },
  { plate:'新能源', invest:5, fund:4, contract:2, procurement:1 },
  { plate:'煤炭',   invest:1, fund:2, contract:1, procurement:0 },
  { plate:'化工',   invest:3, fund:6, contract:4, procurement:5 },
  { plate:'金融',   invest:0, fund:1, contract:0, procurement:0 }
]

// 风险规则触发 TOP (drp_risk_rule)
export const D_RULES = [
  { name:'非白名单大额支付',  count:42, type:'硬', cls:'danger' },
  { name:'合同未法务审核',    count:28, type:'硬', cls:'danger' },
  { name:'超预算>10%支出',    count:18, type:'软', cls:'warning' },
  { name:'IP/MAC相同投标',    count:12, type:'软', cls:'warning' },
  { name:'报价等差识别',      count:8,  type:'软', cls:'warning' },
  { name:'咨询费同比异常',    count:6,  type:'软', cls:'warning' },
  { name:'关联方交易识别',    count:14, type:'软', cls:'warning' }
]

// 风险事件 (drp_risk_event)
export const D_EVENTS = [
  { code:'RE-20240518-001', title:'北疆风电EPC大额异常支付', type:'资金', level:'红',
    handler:'王经理', deadline:'2024-05-20',
    desc:'北疆风电(2)向"北方风能工程"支付4800万，收款方非白名单',
    rule:'单笔>3000万 + 非白名单 + 合同未法务审核',
    suggestion:'立即冻结该笔支付，启动深度核查' },
  { code:'RE-20240515-002', title:'宁夏煤化工咨询费疑似利益输送', type:'财务', level:'红',
    handler:'李审计', deadline:'2024-05-22',
    desc:'向"远景咨询"支付2850万，注册3个月，与高管配偶名下企业重合',
    rule:'咨询费同比>500% + 收款方注册<6月 + 关联关系命中',
    suggestion:'冻结合同后续付款；调取交付物；启动高管离任审计' },
  { code:'RE-20240412-003', title:'宁夏储罐区设备采购围标嫌疑', type:'采购', level:'红',
    handler:'张主管', deadline:'2024-05-20',
    desc:'3家投标单位IP/MAC完全相同，报价等差递减5%',
    rule:'IP相同 + 实控人关联 + 报价等差',
    suggestion:'已废标·建议禁止该3家供应商3年内参与集团采购' },
  { code:'RE-20240425-004', title:'北疆风电项目超预算及进度滞后', type:'投资', level:'橙',
    handler:'陈经理', deadline:'2024-06-15',
    desc:'项目实际支出32亿，超预算11.9%；进度52%落后计划23pp',
    rule:'超预算>10% + 进度滞后>2月 + 关联方EPC',
    suggestion:'暂停后续付款；重新评估EPC合作；启动专项审计' },
  { code:'RE-20240509-005', title:'埃塞俄比亚项目资金回流逾期', type:'境外', level:'红',
    handler:'海外财务', deadline:'2024-05-25',
    desc:'埃塞光伏项目应回流资金2.4亿，已逾期62天',
    rule:'境外资金回流逾期>60天 + 当地政局不稳',
    suggestion:'启动境外法律支持；评估资产减值；调整后续投资计划' },
  { code:'RE-20240510-006', title:'某三级公司变相薪酬', type:'财务', level:'橙',
    handler:'人力审计', deadline:'2024-05-28',
    desc:'内蒙光伏子公司向"东方个体工商户"支付劳务费380万',
    rule:'咨询/劳务费支付对象=员工亲属',
    suggestion:'约谈相关人员；追缴违规款项；纳入年度薪酬审计' }
]

// 闭环统计 (drp_risk_event/work_order/rectification)
export const D_CLOSURE = {
  ruleHit: 142, alertGen: 42, orderSent: 38,
  inProgress: 26, closed: 29,
  pending: 13, overdue: 2, rate: 76.4
}

/* ========== 财务穿透 - 三张主表 + 7级穿透 ========== */
export const D_REPORTS = {
  income: [
    { item:'营业收入',   value:'5,320.4', growth:8.4,  alert:0 },
    { item:'营业成本',   value:'4,380.6', growth:9.2,  alert:0 },
    { item:'销售费用',   value:'142.8',   growth:4.6,  alert:0 },
    { item:'管理费用',   value:'286.4',   growth:35.2, alert:1 },
    { item:'研发费用',   value:'168.2',   growth:12.4, alert:0 },
    { item:'财务费用',   value:'96.5',    growth:6.8,  alert:0 },
    { item:'营业利润',   value:'408.6',   growth:-3.8, alert:0 },
    { item:'净利润',     value:'412.8',   growth:-3.2, alert:0 }
  ],
  balance: [
    { item:'货币资金',   value:'845.6',   growth:5.2,  alert:0 },
    { item:'应收账款',   value:'1,256.4', growth:18.5, alert:1 },
    { item:'存货',       value:'682.3',   growth:6.8,  alert:0 },
    { item:'固定资产',   value:'4,820.5', growth:4.2,  alert:0 },
    { item:'无形资产',   value:'286.8',   growth:8.4,  alert:0 },
    { item:'短期借款',   value:'1,420.6', growth:12.6, alert:0 },
    { item:'应付账款',   value:'986.4',   growth:7.8,  alert:0 },
    { item:'长期借款',   value:'2,840.3', growth:5.2,  alert:0 }
  ],
  cashflow: [
    { item:'经营活动净流入', value:'682.4',   growth:-12.6, alert:0 },
    { item:'投资活动净流出', value:'-486.5',  growth:25.8,  alert:1 },
    { item:'筹资活动净流入', value:'285.6',   growth:18.4,  alert:0 },
    { item:'现金净增加',     value:'481.5',   growth:-5.2,  alert:0 },
    { item:'购买商品支付',   value:'3,820.6', growth:8.4,   alert:0 },
    { item:'支付职工薪酬',   value:'686.4',   growth:6.2,   alert:0 },
    { item:'购建固定资产',   value:'586.4',   growth:32.6,  alert:1 }
  ]
}

// 7级穿透链
export const D_CHAIN7 = [
  { level:1, name:'合并报表·利润表', table:'drp_finance_report',
    detail:'管理费用 同比 +35.2%，超过 10% 预警阈值',
    value:'286.4 亿', growth:'35.2', danger:true, action:'↓ 下钻科目余额' },
  { level:2, name:'科目余额表·管理费用', table:'drp_finance_account',
    detail:'下钻发现 化工板块占比 27%，宁夏煤化工子公司贡献最大',
    value:'78.4 亿 (化工)', growth:'68.2', danger:true, action:'↓ 下钻明细科目' },
  { level:3, name:'明细科目·咨询服务费', table:'drp_finance_subaccount',
    detail:'咨询费科目同比 +1840%，集中支付给 2 家新注册公司',
    value:'24.6 亿', growth:'1840', danger:true, action:'↓ 下钻凭证' },
  { level:4, name:'会计凭证 #2024-05-02-218', table:'drp_finance_voucher',
    detail:'凭证摘要: "支付远景咨询服务费"，制单 2024-05-02',
    value:'2,850 万元', danger:true, action:'↓ 下钻业务单据' },
  { level:5, name:'付款审批单 #PAY-2024-05-15-892', table:'drp_payment_order',
    detail:'付款单已审批·收款方非白名单·审批链 4/4 节点齐全',
    value:'2,850 万元', danger:true, action:'↓ 关联合同' },
  { level:6, name:'关联合同 #HT-2024-CON-127', table:'drp_contract',
    detail:'战略咨询服务·100%预付·无质保金·法务审核已通过',
    value:'2,850 万元', danger:true, action:'↓ 关联项目/采购' },
  { level:7, name:'关联采购单 + 投资项目', table:'drp_procurement + invest_project',
    detail:'⚠ 未走招投标·单一来源·关联项目"宁夏煤化工延伸项目"(已超预算13%)',
    value:'根因锁定', danger:true, action:'🔍 派单审计·启动高管离任审计' }
]

// 财务穿透证据
export const D_EVIDENCE = [
  { title:'证据1 · 凭证级异常',     desc:'咨询费单笔 <strong>2,850万元</strong>，远超日常50万均值' },
  { title:'证据2 · 合同条款风险',   desc:'合同 <strong>HT-2024-CON-127</strong> 付款100%预付·无质保金' },
  { title:'证据3 · 供应商画像',     desc:'<strong>远景咨询</strong>注册仅3个月，工商信息异常' },
  { title:'证据4 · 关联关系',       desc:'供应商地址与子公司高管<strong>配偶名下企业</strong>高度重合' },
  { title:'证据5 · 采购订单异常',   desc:'关联采购订单<strong>未走招投标</strong>，单一来源' }
]

/* ========== 投资穿透 ========== */
export const D_PROJECTS = (() => {
  const list = [
    { name:'北疆500MW风电场',  plate:'新能源', risk:'红', overrun:11.9, delay:3, code:'INV-2024-018' },
    { name:'宁夏煤化工延伸',    plate:'化工',   risk:'红', overrun:13.0, delay:4, code:'INV-2024-027' },
    { name:'内蒙古光伏100MW',   plate:'新能源', risk:'黄', overrun:4.9,  delay:0 },
    { name:'西北燃机调峰',      plate:'火电',   risk:'绿', overrun:-6.1, delay:-1 },
    { name:'山西煤矿智能化',    plate:'煤炭',   risk:'绿', overrun:3.2,  delay:1 }
  ]
  const plates = [
    '新能源','新能源','新能源','新能源','新能源','新能源','新能源','新能源','新能源',
    '新能源','新能源','新能源','新能源','新能源','新能源','新能源','新能源','新能源',
    '火电','火电','火电','火电','火电','火电','火电','火电',
    '煤炭','煤炭','煤炭','煤炭','煤炭','煤炭','煤炭',
    '化工','化工','化工','化工','化工','化工',
    '金融','金融','金融'
  ]
  for (let i = list.length; i < 42; i++) {
    const r = Math.random()
    list.push({ plate:plates[i], risk: r < 0.05 ? '橙' : r < 0.2 ? '黄' : '绿' })
  }
  return list.slice(0, 42)
})()

export const D_ASSETS = [
  '风机组(150台)','升压站(2座)','集电线路(86km)','运维楼(1栋)'
]

/* ========== 产权穿透 ========== */
export const D_REL_TRANS = [
  { company:'北方风能工程公司', business:'EPC承包',   amount:'23.5亿', risk:'红' },
  { company:'远景咨询服务',     business:'咨询费',    amount:'2850万', risk:'红' },
  { company:'内蒙能源贸易',     business:'物资采购',  amount:'8200万', risk:'橙' }
]

/* ========== 境外穿透 ========== */
export const D_REGIONS = [
  { region:'东南亚', units:12, asset:86.4, risk:'黄' },
  { region:'中东',   units:6,  asset:72.8, risk:'橙' },
  { region:'非洲',   units:8,  asset:58.6, risk:'橙' },
  { region:'欧洲',   units:4,  asset:42.3, risk:'绿' },
  { region:'南美',   units:2,  asset:26.3, risk:'黄' }
]
export const D_COMPLIANCE = [
  { rule:'EU GDPR 数据合规',  score:92 },
  { rule:'中东本地化雇用',    score:85 },
  { rule:'外汇额度管控',      score:76 },
  { rule:'非洲法定股比',      score:68 },
  { rule:'反腐败合规 FCPA',   score:95 },
  { rule:'当地税务申报',      score:88 }
]
export const D_OS_ALERTS = [
  { country:'埃塞俄比亚', project:'光伏分布式电站', issue:'资金回流逾期62天',     amount:2.4, level:'红' },
  { country:'沙特',       project:'燃机电站EPC',     issue:'当地合规变更未响应',   amount:8.6, level:'橙' },
  { country:'安哥拉',     project:'矿产合作开发',    issue:'外汇结汇额度临近上限', amount:1.8, level:'橙' }
]

/* ========== AI 智能体 ========== */
export const D_AGENTS = [
  { name:'合规助手', role:'自动扫描合同/付款单与监管规则比对', tasks:1284 },
  { name:'智能问数', role:'自然语言查询→跨数据库→可视化',     tasks:862 },
  { name:'风险研判', role:'综合多维度信息输出风险判断',         tasks:348 },
  { name:'报告生成', role:'自动汇总数据生成结构化报告',         tasks:156 }
]
export const D_CONVERSATIONS = [
  { user:'新能源板块本季度投资回报率是多少？',
    thinking:['解析意图: 计算 ROI', '调用: invest_project + org_unit', '范围: 板块=新能源, Q2', '聚合: (利润/投资)×100%'],
    response:'新能源板块本季度投资完成 168.5 亿元，已投产项目年化回报率 8.4%，较去年同期上升 0.6pp。' },
  { user:'查一下"北方风能工程"与集团内部人员的关联关系',
    thinking:['解析意图: 关联方排查', '调用: relation_graph + counterparty', '算法: 2跳路径分析', '风险评分'],
    response:'⚠️ 高风险关联：发现 3 条强关联路径。该供应商实控人王建国之子王国民，担任北疆风电子公司法人代表，且EPC合同未走法务审核。建议立即纳入关联交易重点监控。' },
  { user:'生成本月集团整体风险分析报告',
    thinking:['汇总: 6类风险事件', '统计: 风险分布·趋势·闭环率', '生成: 结构化文档+图表', '推荐: 处置建议'],
    response:'已完成报告。本月共触发风险事件 42 起（红 6/橙 11/黄 25），同比上升 12%。最大风险点：化工板块·投资板块。闭环率 76%，3 起红色事件待集团层处置。' }
]
export const D_PROACTIVE = [
  { type:'discovery', title:'发现潜在关联交易',   detail:'近 30 天 3 家子公司与同一供应商交易额 1.86 亿，建议关注', time:'2 分钟前' },
  { type:'anomaly',   title:'检测到资金异常聚集', detail:'化工板块下属 4 家公司向同一收款方累计支付 9800 万',       time:'15 分钟前' },
  { type:'',          title:'风险预测',           detail:'基于近 6 月数据，建议将"宁夏煤化工"风险等级从黄调整为橙',  time:'1 小时前' }
]
export const D_WORKFLOW = [
  '智能问数 → 调中台',
  '合规助手 → 比对规则',
  '风险研判 → 综合分析',
  '报告生成 → 结构化输出'
]

/* ========== 工具函数 ========== */
export const riskCls = (risk) =>
  risk === '红' ? 'red' :
  risk === '橙' ? 'orange' :
  risk === '黄' ? 'yellow' : 'green'

export const cellCls = (n) =>
  !n ? 'zero' :
  n >= 5 ? 'red' :
  n >= 3 ? 'orange' :
  n >= 1 ? 'yellow' : 'green'
