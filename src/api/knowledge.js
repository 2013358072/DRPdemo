import { AGENT_CAPABILITIES } from './agent-actions.js'

export { AGENT_CAPABILITIES }

export const globalContext = { currentScene: 'dashboard', currentPage: '', selectedItem: null }

const domainKnowledge = {
  contract: {
    overview: `合同仓库 32 份有效合同。高风险 12 份、中风险 8 份、低风险 6 份、正常 6 份。`,
    keyCases: `合同名称→ID映射：钢材采购合同=HT-202605002（58万元，价格偏高11.5%）。该合同关联4个风险项：HT-2026002(采购合同价格异动预警/中风险)、HT-2026003(招标程序缺失预警/高风险)、HT-2026004(超进度付款风险预警/高风险)、HT-2026005(发票金额差异提示/低风险)。
其他：HT-2026-0312大型设备采购（全额预付+无质保金），HT-2026-0840水电移民安置总包（超预算12%）。`,
    features: `用户说"AI分析某风险"时，先openContract打开合同，再analyzeRisk触发该风险的AI分析。`,
  },
  funds: {
    overview: `今日 1,368 笔支付，总金额 8,620.50 万元。正常资金 216 笔、高风险 1 笔、中风险 3 笔、已闭环 12 笔。`,
    keyCases: `典型案例：ZJ-2026001 异常大额付款（500万元，付款方华东电力→收款方XX贸易有限公司，无合同支撑、无验收记录、审批未完成即支付，待核查，整改期限 2026-05-25）；PO-2026-0516-012 非白名单供应商大额支付 920 万元已拦截。`,
    features: `资金穿透：资金风险统一列表页(表格形式，11列)→风险详情报告(完整7节)→穿透核查(银行流水→合同→凭证)。支持按风险等级/处理状态/主体筛选。`,
  },
  procurement: {
    overview: `招标项目 214 个，围标串标高风险项目 7 个、可疑投标项目 19 个。`,
    keyCases: `典型案例：CG-2026-0501 海外营地物资集中采购，3家投标单位同IP同MAC，报价等差分布，AI判定串通概率94%，工单WO-2026-0042。CG-2026-0421 箱变成套采购，供应商地址重合，串通概率76%。`,
    features: `采购穿透：招标列表→投标人分析→围标检测(同IP/同MAC/等差报价/股权关联)→供应商档案。`,
  },
  invest: {
    overview: `42个投资项目，重点关注超预算和关联交易。`,
    keyCases: `典型案例：P06 陇东风电基地二期（超预算12%，EPC关联交易，3条隐蔽关系，关联金额5.4亿）；P01 东南亚路桥PPP（超预算18.6%，隐性关联方2个）。`,
    features: `投资穿透：项目矩阵→甘特图→项目详情→知识图谱(关联方穿透)→工单分派。`,
  },
  dashboard: {
    overview: `十大重点领域风险卡片（含呼吸灯+风险分进度条）、中国地图热力分布、预警趋势12个月走势。集团风险总评分68分（+2），37个未闭环风险：高12、中19、低6。`,
    keyCases: `最高风险领域：资金域(84分/红色/6待办)、合同域(81分/红色)、采购域(68分/橙色)。`,
    features: `十大领域卡片可直接穿透到对应域。呼吸灯：红(1.4s)/橙(1.6s)/黄(1.8s)/绿无。`,
  },
}

export function buildSystemPrompt(context = {}) {
  const scene = context.scene || 'dashboard'
  const currentDomain = domainKnowledge[scene] || domainKnowledge.dashboard
  let ctxInfo = ''
  if (context.selectedItem) {
    ctxInfo = `\n用户当前在「${context.pageName || scene}」页面，选中的${context.selectedItem.type}：${context.selectedItem.id}（${context.selectedItem.name || ''}）。`
  }

  return `你是"DRP 穿透式监管智能助手"，服务大型国企集团穿透式监管平台。运行在 DeepSeek V4 Flash 上。

## 身份
DRP 智能助手，覆盖投资/资金/合同/采购/产权/财务/薪酬/境外/金融/会计十大领域。

## 知识库
### 合同域
${domainKnowledge.contract.overview} ${domainKnowledge.contract.keyCases} ${domainKnowledge.contract.features}
### 资金域
${domainKnowledge.funds.overview} ${domainKnowledge.funds.keyCases} ${domainKnowledge.funds.features}
### 采购域
${domainKnowledge.procurement.overview} ${domainKnowledge.procurement.keyCases} ${domainKnowledge.procurement.features}
### 投资域
${domainKnowledge.invest.overview} ${domainKnowledge.invest.keyCases} ${domainKnowledge.invest.features}
### 首页
${domainKnowledge.dashboard.overview} ${domainKnowledge.dashboard.keyCases} ${domainKnowledge.dashboard.features}
${ctxInfo}

## 回复规则
1. 简洁专业，每次 250 字以内
2. 风险等级用 🔴高 🟠中 🟡低 🟢正常
3. 引用真实编号（HT/ZJ/CG/PO）
4. 分析问题优先结合各域数据交叉验证
${AGENT_CAPABILITIES}`
}

export function getDomainKnowledge(domain) { return domainKnowledge[domain] || null }
