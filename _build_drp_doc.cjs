/* Build DRP 穿透式监管系统 — 大屏布局与数据处理详解 (docx) */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const gRoot = execSync('npm root -g').toString().trim();
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageBreak, VerticalAlign,
} = require(path.join(gRoot, 'docx'));

const FONT = '微软雅黑';
const CW = 9026; // A4 content width with 1" margins
const border = { style: BorderStyle.SINGLE, size: 1, color: 'BFC9D9' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 110, right: 110 };

function run(text, o = {}) {
  return new TextRun({ text, font: FONT, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || '222222' });
}
function P(text, o = {}) {
  const children = Array.isArray(text) ? text : [run(text, o)];
  return new Paragraph({ children, spacing: { after: o.after == null ? 100 : o.after, before: o.before || 0, line: 288 }, alignment: o.align });
}
function H1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: FONT, bold: true, size: 30, color: '0B4DA2' })], spacing: { before: 260, after: 150 } }); }
function H2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: FONT, bold: true, size: 25, color: '15539E' })], spacing: { before: 200, after: 110 } }); }
function H3(t) { return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, font: FONT, bold: true, size: 22, color: '1F2937' })], spacing: { before: 150, after: 90 } }); }
function bullet(t, o = {}) {
  return new Paragraph({ numbering: { reference: 'bul', level: 0 }, children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: 60, line: 280 } });
}
function num(t, o = {}) {
  return new Paragraph({ numbering: { reference: 'numlist', level: 0 }, children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: 60, line: 280 } });
}
function quote(t) {
  return new Paragraph({
    children: [run(t, { italics: true, color: '0B4DA2', bold: true })],
    spacing: { before: 90, after: 130, line: 288 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: '0B4DA2', space: 12 } },
    shading: { fill: 'F0F5FC', type: ShadingType.CLEAR },
  });
}

function cell(text, w, o = {}) {
  const para = new Paragraph({
    children: (Array.isArray(text) ? text : [run(text, { size: o.size || 19, bold: o.bold, color: o.color })]),
    spacing: { after: 0, line: 264 },
    alignment: o.align,
  });
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders, margins: cellMargins,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [para],
  });
}
// generic table: widths[], header[], rows[][]
function table(widths, header, rows) {
  const headRow = new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { bold: true, color: 'FFFFFF', fill: '2E6BC6', size: 19 })) });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((c, i) => {
      const isMulti = Array.isArray(c) && c[0] instanceof TextRun;
      return cell(isMulti ? c : String(c), widths[i], { fill: ri % 2 ? 'F4F8FD' : 'FFFFFF', bold: i === 0 });
    }),
  }));
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] });
}

// Standard element decomposition table for a screen region
const ELEM_W = [1350, 1500, 3000, 3176];
const ELEM_H = ['要素 / 控件', '控件类型', '数据提取规则（怎么来的）', '数据关注点 · 代表含义 · 交互'];
function elemTable(rows) { return table(ELEM_W, ELEM_H, rows); }

const children = [];

/* ============ 封面 ============ */
children.push(new Paragraph({ spacing: { before: 1600, after: 0 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DRP 穿透式监管系统', font: FONT, bold: true, size: 56, color: '0B4DA2' })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 0 }, children: [new TextRun({ text: '大屏布局 · 要素提取规则 · 数据关注点 · AI 智能体机制详解', font: FONT, bold: true, size: 28, color: '334155' })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 0 }, children: [new TextRun({ text: '一屏统揽 · 逐级穿透 · 四全覆盖 · 人机协同', font: FONT, size: 24, color: '2E6BC6' })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1400 }, children: [new TextRun({ text: '对标 国资委 1号文 / 2号文 / 15号文 · 面向集团高层决策、业务管理、监管审计三类视角', font: FONT, size: 20, color: '64748B' })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 阅读说明 ============ */
children.push(H1('〇、这份文档怎么读'));
children.push(P('这不是一份功能罗列清单，而是把每一块屏、每一个图、每一张表"拆开给你看"——它从哪来、要盯什么、代表什么、点下去会发生什么，以及 AI 在其中究竟做了什么。'));
children.push(P([run('阅读地图（有粗有细）：', { bold: true })]));
children.push(bullet([run('粗线条', { bold: true }), run('——第一章先讲清整套大屏的"统一骨架"，看懂一屏即看懂四屏。')]));
children.push(bullet([run('细颗粒', { bold: true }), run('——第二至六章把驾驶舱与四大穿透域逐要素拆解，每个要素都附"提取规则 / 关注点 / 含义 / 交互"四列对照表。')]));
children.push(bullet([run('技术底', { bold: true }), run('——第七章统一说明全平台共用的判级、着色、刷新、弹窗等规则；第八章专讲 AI 智能体到底怎么干活。')]));

/* ============ 第一章 整体布局 ============ */
children.push(H1('一、整体设计语言：看懂一屏，即看懂四屏'));
children.push(P('四大领域二级大屏（合同 / 采购 / 财务 / 资金）共用同一套布局骨架，用户跨域切换时认知负担最小；差异只体现在各域的特色指标与配色，而非结构。'));

children.push(H2('1.1 三栏式 + A/B/C 三区骨架'));
children.push(table([1500, 1100, 1100, 5326],
  ['区域', '占比', '高度', '内容定位'],
  [
    ['顶部 A 区', '通栏', '约 22%', '该领域最关键的经营 / 监管核心指标（雷达评分 + 数字驾驶舱 + 趋势）'],
    ['主体 B 区', '通栏', '约 48%', '左 18% 风险域导航｜中 55% 主体穿透网络图｜右 27% 实时风险列表'],
    ['底部 C 区', '通栏', '约 30%', '两类穿透链路 + 业务热力矩阵 / TOP10 排行 + AI 建议与系统入口'],
  ]));
children.push(P([run('为什么这样排？', { bold: true }), run('左栏定位"看哪个风险"，中栏回答"风险在谁身上、怎么传导"，右栏回答"现在有哪些活的风险"——视线从左到右，正好是一条"选域 → 穿主体 → 抓事件"的决策动线。')]));

children.push(H2('1.2 顶栏：时间窗与双层 AI 入口'));
children.push(elemTable([
  ['时间窗切换', '分段按钮', "驾驶舱 / 财务 / 资金共用 mainPeriod，采购独立 procPeriod；取值 '30d' / '3m' / '6m'", '切换后全屏指标、图表、排行按同一时间口径联动重算（见 7.3）；默认近 6 个月'],
  ['指挥中心', '入口按钮', '跳转 AI 指挥调度中心（#/ai）', '统一进入智能中台：多 Agent 调度、智能问数、规则模型库'],
  ['实时提醒铃', '角标 + 下拉', '汇聚各域预警，按"全部 / 紧急 / 一般 / 通知"分级', '未读脉冲提醒；点击任一条直达对应业务页，做到"哪响点哪"'],
  ['AI 小助手', '右下角悬浮', '打开对话式智能体（GptChatModal，详见第八章）', '场景感知问答 + 自然语言驱动页面跳转，是"数找人"的入口'],
]));
children.push(P([run('设计取舍：', { bold: true }), run('页面跳转类的"重"操作放顶栏指挥中心，问答类的"轻"交互放右下角悬浮——重的稳、轻的快，互不打扰。')]));

children.push(H2('1.3 视觉与动效语言（信息即编码）'));
children.push(bullet([run('风险四色：', { bold: true }), run('红=高风险、橙=中风险、黄=关注、绿=正常。全平台统一，颜色本身就是数据。')]));
children.push(bullet([run('呼吸灯：', { bold: true }), run('高风险红色脉冲最快、中橙次之、关注黄最慢、正常不闪——闪得越急越要先看。')]));
children.push(bullet([run('节点大小：', { bold: true }), run('穿透网络图里节点越大，代表金额 / 营收 / 资金规模越大，"大而红"的节点是第一眼焦点。')]));
children.push(bullet([run('动效克制：', { bold: true }), run('数字滚动、雷达展开、资金流动画只服务于"引导注意力"，不做无意义炫技。')]));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 第二章 驾驶舱 ============ */
children.push(H1('二、全景驾驶舱（首页）：一屏看穿整个集团'));
children.push(P('驾驶舱是整套演示的"开场冲击"，目标是让决策层在 3 分钟内感到"从未如此清楚地看到集团全貌"。它不堆数据，而是按"经营脉搏 → 领域风险 → 空间分布 → 趋势 → 活事件 → 怎么办"组织视线。'));

children.push(H2('2.1 逐要素拆解'));
children.push(elemTable([
  ['一利五率 / 业绩 KPI', '指标卡片组', '集团经营核心指标按时间窗取数，环比 / 同比一并计算', '关注点：盈利与杠杆的健康度；这是"集团经营脉搏"，每 5 分钟刷新一次'],
  ['十大重点领域卡片', '风险卡片（呼吸灯+进度条+待办徽标）', '每个领域取其综合风险分（0–100）与未闭环待办数', '含义：风险分进度条直观给出 0–100 等级，呼吸灯标级别，红色待办徽标=要立刻处理的件数；点击卡片直接穿透进该域'],
  ['中国地图机构热力', '地图 + 散点', '82 家法人按所在省份与风险等级着色，附典型案例文案', '关注点：风险的"空间分布"，红色省份点进去看细节；回答"问题在哪个地方"'],
  ['业务穿透热力图', '五大板块 × 风险域矩阵热力图', '每格 = 板块在该风险域的风险指数；按 getRiskLevel 阈值分段着色（见 7.1）', '含义：颜色越红该交叉点越危险；一眼定位"哪个板块的哪类风险最突出"，点格下钻'],
  ['预警趋势', '双轴折线（近 12 月）', '按月统计预警数量与金额走势，随时间窗切换', '关注点："金额涨而风险降"即管控见效；看的是趋势而非单点'],
  ['实时风险事件列表', '滚动事件流', '汇聚全域最新风险事件，按级别 / 时间排序', '关注点：当下正在发生什么；高风险置顶、闪烁提醒'],
  ['AI 推荐处置', 'AI 建议卡片', '由规则与模型对高优先级风险生成处置建议', '含义：不止告诉你"有问题"，还给"怎么办"；点击进入处置流程'],
]));
children.push(quote('一句话价值：数据不再层层上报、层层失真——一键穿透到基层，集团全貌实时在线。'));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 第三章 合同 ============ */
children.push(H1('三、合同穿透域：每个条款都可智能解析'));
children.push(P('合同域的核心能力是"让机器读合同"——以 AI + NLP 解析条款、识别风险、监控履约，并以"价格一致性穿透核查"打穿采购价格异动。'));
children.push(H2('3.1 逐要素拆解'));
children.push(elemTable([
  ['A1 合同五维指标', '五维雷达 + 评分', '从签约、履约、逾期、变更、合规五个维度对全量合同打分，中心给综合分（约 95.0）', '达标蓝、欠佳橙；关注履约率（约 94.2%）、合规率；点维度下钻明细'],
  ['A2 核心指标 / 融资贸易识别', '数字驾驶舱 + 高亮卡', '合同总额动态滚动；"疑似融资贸易"金额由 74 号文禁止条款关键词（固定收益 / 回购承诺 / 资金占用费）扫描识别', '疑似融资贸易（约 ¥86 亿）红色闪烁告警；点开看识别关键词与 TOP3 高风险合同'],
  ['A3 趋势', '双轴折线', '近 12 月合同金额 vs 风险合同数', '看"金额增长但风险下降"的管控效果'],
  ['B1 合同十大风险域', '风险域导航（11 项）', '按风险域归集风险条数与等级（含融资性贸易、挂靠经营）', '高风险项脉冲提醒；点击切换中部网络图至该域视角，无关节点淡化至 30%'],
  ['B2 主体穿透网络', '力导向关系图', '集团→二级→三级→项目分层；节点大小∝合同金额，颜色=风险等级，连线区分隶属/协同/担保', '选中某风险即高亮其传导路径（如 HT-2026002：钢材采购项目→建设一公司→建设公司→集团）'],
  ['B3 实时合同风险列表', '自动轮播风险卡', '7 项标准字段（见 7.4）；首条预置 HT-2026002 采购合同价格异动预警（中）', '每 5 秒滚动、悬停暂停；点卡片弹出完整穿透报告（见 7.5）'],
  ['C1 两类穿透', '树状链路图', '资金穿透=合同付款链路；责任穿透=授权·签字·用印·三重一大', '异常节点红底 + 数量角标（如审批异常 12 笔）；点节点跳对应业务系统'],
  ['C2 业务穿透 + TOP10', '8×8 热力图 + 排行卡', '行业×合同类型金额热力；签约对方单位 TOP10 含合规健康度评分', '看品类集中度与对方单位健康度；点排行看五维健康雷达'],
  ['C3 AI 建议 + 系统入口', '建议卡 + 四宫格', '由风险联动生成建议；入口连 ERP / 法务 / 招采 / 资金', '在线蓝、维护灰；建议可点击直达处理页（如价格核查流程）'],
]));
children.push(H2('3.2 AI 智能点：价格一致性穿透核查'));
children.push(P('这是合同域最具说服力的动作。点击一份合同的"AI 风险分析"，系统启动多步推理（见第八章），随后进入三段式核查：'));
children.push(num('供应商历史合同——调出该供应商历史成交价格作基准；'));
children.push(num('采购询价记录——拉同期市场询价，判断当前价是否偏离市价；'));
children.push(num('发票详情——双列对比金额，确认价、量、票是否一致，最终录入"合理 / 违规异动"结论。'));
children.push(P([run('同时实时监控履约：', { bold: true }), run('一旦付款比例（paidRatio）超出交付进度（progress），立即判定"超进度付款风险"——甲方丧失履约制衡手段的资金敞口被当场点亮。NLP 解析关键条款，效率较人工审查提升约 20 倍。')]));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 第四章 采购 ============ */
children.push(H1('四、采购穿透域：围标串标无处遁形'));
children.push(P('采购域直接对标 74 号文"十不准"，以多维度交叉比对识别违规，核心看板用"交通灯"把红线指标摆在最显眼处。'));
children.push(H2('4.1 逐要素拆解'));
children.push(elemTable([
  ['A1 采购六维 + 74号文看板', '六维雷达 + 合规灯', '六维=规模/节资/公开/集中/合规/时效；右侧看板取应招未招、化整为零、虚假/融资性贸易笔数', '合规绿灯、异常红闪；综合约 89.3 分，74 号文合规率约 98.5%'],
  ['A2 核心指标', '数字驾驶舱', '采购总额 ¥5,680 亿、节资率 8.2%、公开招标率 72%、集中率 65%；应招未招 0 笔、化整为零 0 笔', '应招未招/化整为零"双零"是直接对标 74 号文十不准的合规证据'],
  ['A3 趋势', '三轴折线', '近 12 月采购金额 + 节资率 + 公开招标率', '看节资与公开化是否同步向好'],
  ['B1 采购十大风险域', '风险域导航（10 项）', '含应招未招、化整为零、空转走单、围标串标、关联输送等', '点击联动中部网络高亮该域主体'],
  ['B2 主体穿透网络', '力导向关系图', '结构同合同域，节点大小∝采购金额', 'CG-2026001 高亮路径：车间维修工程→建设一公司→建设公司→集团'],
  ['B3 实时采购风险列表', '自动轮播风险卡', '首条预置 CG-2026001 未验收即付款预警（高）', '点击弹出含 4 端穿透与 7 条穿透链接的完整报告'],
  ['C1 两类穿透', '树状链路图', '资金穿透=采购预算→申请→评标定标→签订→验收支付；责任穿透=授权→评标专家→定标审批→三重一大', '评标定标异常 8 笔、验收支付异常 3 笔等以角标点亮'],
  ['C2 品类矩阵 + 供应商 TOP10', '热力图 + 排行卡', '品类×采购方式金额热力；供应商 TOP10 含健康度 + 白名单状态', '白名单 False 且金额大的供应商重点盯防'],
  ['C3 AI 建议 + 系统入口', '建议卡 + 四宫格', '入口连 SRM / ERP / 招采 / 合同', 'CG-2026001 核查、74 号文排查、供应商健康度关注'],
]));
children.push(H2('4.2 AI 智能点：围标串标四维交叉比对'));
children.push(P('对同一招标的多家投标单位，系统同步比对四个维度，任一维度异常即拉响概率：'));
children.push(bullet([run('同 IP', { bold: true }), run('——多家投标文件上传自同一 IP 地址；')]));
children.push(bullet([run('同 MAC', { bold: true }), run('——投标设备硬件地址重合；')]));
children.push(bullet([run('报价等差', { bold: true }), run('——多家报价呈规律等差（如价差恰好 5%）；')]));
children.push(bullet([run('股权关联', { bold: true }), run('——知识图谱发现实际控制人为同一人。')]));
children.push(P([run('四维齐发时，AI 直接输出"', { }), run('串通概率 95%，建议废标并启动调查', { bold: true, color: 'C0392B' }), run('"，并生成核查工单。这正是 2 号文、15 号文强调的"多维度交叉验证"能力的直接落地。')]));
children.push(P([run('CG-2026001 触发逻辑：', { bold: true }), run('付款时间 < 验收记录生成时间 → 判定"未验收即付款"。工程未验收却已支付 40 万元，审批链中"验收确认"环节被跳过即被捕获。')]));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 第五章 财务 ============ */
children.push(H1('五、财务穿透域：从报表到凭证的纵向穿透'));
children.push(P('财务域打通集团合并报表到基层会计凭证的全链路，以"五维联动校验"识破虚假贸易。'));
children.push(H2('5.1 逐要素拆解'));
children.push(elemTable([
  ['A1 财务七维 + 五维联动校验', '七维雷达 + 五边形看板', '五维联动=业务·财务·税务·合同·票据五单匹配校验，给匹配率', '关注点：五单匹配率约 98.2%，不匹配 28 笔 / 653 万，对标虚假贸易"五维联动"识别要求'],
  ['A2 利润驾驶舱', '数字驾驶舱', '利润总额 ¥1,280 亿、预算完成率、资产负债率、ROE、营业现金比率、研发强度', '盈利、杠杆、现金三条线一屏看齐'],
  ['A3 趋势', '三轴折线', '营收 + 利润 + 现金流 近 12 月联动', '看"有利润是否有现金"'],
  ['B1 财务十大风险域', '风险域导航（11 项）', '含虚假贸易、资金体外循环、两金高企、税务违规、预算失控、关联交易非关联化', '点击联动网络图'],
  ['B2 主体穿透网络', '力导向关系图', '节点大小∝营收规模', 'CW-2026001 高亮路径：行政部门→建设一公司→建设公司→集团'],
  ['B3 实时财务风险列表', '自动轮播风险卡', '首条预置 CW-2026001 虚假凭证预警（高）', '点击弹出含 5 端穿透与 7 条链接的完整报告'],
  ['C1 两类穿透', '树状链路图', '资金穿透=账户→归集→支付审批→银行支付→凭证记账；责任穿透=授权→财务总监→会计→出纳→三重一大', '支付审批异常 6 笔、凭证记账异常 3 笔点亮'],
  ['C2 财务矩阵 + 往来 TOP10', '热力图 + 排行卡', '财务业务域×收支类型热力；资金往来单位 TOP10 含健康度', '健康度低的往来单位（如某投资控股 58 分）重点盯'],
  ['C3 AI 建议 + 系统入口', '建议卡 + 四宫格', '入口连 核算 / 资金 / 预算 / 税务', 'CW-2026001 核查、五维联动 28 笔不匹配预警、两金占用预警'],
]));
children.push(H2('5.2 AI 智能点：虚假凭证的三因子判定'));
children.push(P([run('CW-2026001 触发逻辑：', { bold: true }), run('发票校验失败 + 无业务支撑 + 资金流向异常，三者同时成立 → 触发"虚假凭证预警"。')]));
children.push(P('一笔 2.8 万元办公耗材报销，被逐级穿透发现：发票为虚假发票（抬头税号与供应商不符）、合同对方不在供应商名录、采购无对应记录、资金最终流向个人账户——从合并报表一路打穿到那一张问题凭证。传统审计需 3 个月，这里 3 分钟定位。'));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 第六章 资金 ============ */
children.push(H1('六、资金穿透域：每一分钱都在监控之下'));
children.push(P('资金域以司库体系为骨架，实现资金从集团到基层账户的全轨迹追踪与"事中拦截"。'));
children.push(H2('6.1 逐要素拆解'));
children.push(elemTable([
  ['A1 司库八维 + 境外可视', '八维雷达 + 可视看板', '八维=集中/结算/融资/票据/担保/外汇/两金/资源；看板取境外资金可视率、账户可视化率', '综合约 86.0；境外可视率 88%（对标 2 号文"由境内向境外"升级），账户可视化率 100%'],
  ['A2 资金核心指标', '数字驾驶舱', '全集团资金池总余额 ¥4,280 亿、可归集集中度 94%', '集中度越高资金越"管得住"；闲置/体外资金越少越好'],
  ['B1 资金十大风险域', '风险域导航（12 项）', '含体外循环、大额异常、U盾失控、对私支付、挂靠费异常', 'U盾失控、对私支付为高敏项'],
  ['B2 主体穿透网络', '力导向关系图（含动画）', '专设"集团财务公司"归集枢纽节点；归集连线带资金流动画', '与其他三屏最大差异：能直观看到资金往哪流。ZJ-2026001 路径：采购部门→建设一公司→建设公司→财务公司→集团'],
  ['B3 实时资金风险列表', '自动轮播风险卡', '首条预置 ZJ-2026001 异常大额付款预警（高，500 万）', '点击弹出含 4 端穿透与 9 条链接的完整报告'],
  ['C1 两类穿透', '树状链路图', '资金穿透=账户→归集→结算中心→支付审批→银行支付；责任穿透=支付审批→联签→U盾管理→出纳→三重一大', 'U盾异常 6 枚、出纳越权放款等点亮'],
  ['C2 司库矩阵 + 银行/对手 TOP10', '热力图 + 排行卡', '10 大司库业务域×资金类型热力；银行/对手 TOP10 标 U盾状态灯', 'U盾灯：在线绿 / 离线灰 / 异常红闪；境外银行离线重点关注'],
  ['C3 AI 建议 + 系统入口', '建议卡 + 四宫格', '入口连 司库 / 财务 / 网银 / 票据', 'ZJ-2026001 核查、U盾失控预警、境外 U盾离线预警'],
]));
children.push(H2('6.2 AI 智能点：从"事后查账"到"事中拦截"'));
children.push(P([run('ZJ-2026001 触发逻辑：', { bold: true }), run('付款金额 > 50 万阈值，且（无验收记录 + 无完整合同支撑 + 付款与合同金额差异 > 15%）→ 触发预警。')]));
children.push(P('一笔 500 万元付款，合同仅约定 300 万、履约进度仅 30%、物资尚未到货、审批未完成即支付——规则引擎在支付前直接拦截，等待人工确认。资金在"流出去之前"被按住，而不是出了问题再追。'));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 第七章 通用规则 ============ */
children.push(H1('七、全平台共用的提取与计算规则'));
children.push(P('以下规则被四大屏与驾驶舱共用，是"严谨"二字的底座。'));

children.push(H2('7.1 风险等级判定（getRiskLevel）'));
children.push(table([2000, 2000, 5026],
  ['风险指数', '等级', '配色与含义'],
  [
    ['≥ 80', '高风险', '红 — 需重点跟踪，建议周度穿透复核'],
    ['60 – 79', '中风险', '橙 — 总体可控，保持月度抽样检查'],
    ['40 – 59', '关注', '黄 — 运行平稳，例行监测'],
    ['< 40', '正常', '绿 — 当前以例行监测为主'],
  ]));

children.push(H2('7.2 热力图分段着色（避免边界缝隙）'));
children.push(P('热力图采用 piecewise 分段着色。为避免整数落在分段边界缝隙而"漏色"，统一改用 gte / lt 闭合区间（< 40 绿 / 40–60 黄 / 60–80 橙 / ≥ 80 红），与 7.1 阈值严格对齐，确保每一格都有颜色、含义无歧义。'));

children.push(H2('7.3 时间窗联动（period-keyed 数据）'));
children.push(P("切换 30d / 3m / 6m 时，并非只换一个数字，而是每个图表/统计/排行都按对应时间口径整体重算：内部以 { '30d','3m','6m' } 三套数据键驱动，雷达分值、风险计数、矩阵热力、排行金额、宏观数据与标签同步刷新，保证全屏口径一致、不串档。"));

children.push(H2('7.4 实时风险列表的 7 项标准字段'));
children.push(P('四大屏的实时风险列表遵循统一字段规范：风险编号、风险名称、风险等级、预警时间、涉及主体（部门/对方单位）、关联索引（合同/凭证/流水号）、处理状态。这保证"任何一条风险，信息粒度一致、可比、可追溯"。'));

children.push(H2('7.5 风险详情弹窗的六段式结构'));
children.push(P('点击任一风险卡片，弹窗严格按"穿透报告"六段呈现，与业务专家定义的报告结构一一对应：'));
children.push(num('风险预警事项——触发场景的事实描述；'));
children.push(num('风险定义——这是什么风险 + 计算逻辑；'));
children.push(num('原因分析——分资金端 / 合同端 / 采购端 / 财务端，每端带穿透链接；'));
children.push(num('关联数据穿透链接——一键跳到对应业务系统原始数据；'));
children.push(num('整改建议——5 条可操作建议；'));
children.push(num('处理进度——待核查 → 核查中 → 整改中 → 已闭环，含责任人与整改期限。'));

children.push(H2('7.6 自动刷新机制'));
children.push(table([3000, 2000, 4026],
  ['数据区域', '刷新频率', '方式'],
  [
    ['实时风险列表', '每 30 秒', '新增风险插入列表顶部并闪烁提示'],
    ['核心指标', '每 5 分钟', '数字滚动动画更新'],
    ['趋势图', '每 15 分钟', '平滑过渡动画'],
    ['AI 建议', '每 10 分钟', '新建议卡从顶部滑入'],
    ['穿透网络', '每 5 分钟', '增量更新节点风险状态，渐变过渡'],
  ]));
children.push(new Paragraph({ children: [new PageBreak()] }));

/* ============ 第八章 AI ============ */
children.push(H1('八、AI 智能体到底怎么干活'));
children.push(P('平台的"智能"不是一句口号，而是两层各司其职、且带安全约束的真实机制。核心原则只有一句：AI 辅助、人做决策——AI 负责发现与推理，处置由人确认。'));

children.push(H2('8.1 第一层：域内"风险穿透分析"智能体（多步推理弹窗）'));
children.push(P('在合同 / 采购 / 财务 / 资金任一域点击"AI 风险分析"，会弹出一个深色科技感的智能体执行窗，它把一次风险研判拆成约 7 个可见步骤逐条推进：'));
children.push(bullet('启动分析引擎 → 提取关键要素 → NLP / 规则解析 → 历史数据比对 → 穿透关联（采购/财务/履约链路）→ 规则验证 → 生成风险报告；'));
children.push(bullet([run('每一步有明确状态机：', { bold: true }), run('pending（待执行）→ running（执行中，带计时）→ done（完成，给出该步结论），节拍约 600ms 推进一步，并在 onBeforeUnmount 时清理计时器，绝不留后台空转；')]));
children.push(bullet([run('完成即产出：', { bold: true }), run('动画结束自动生成结构化风险报告并可一键跳转；用户也可中途点"查看分析报告"跳过等待。')]));
children.push(P([run('为什么要"可见地慢一点"？', { bold: true }), run('因为它要让决策者看见"机器是怎么一步步推出这个结论的"——推理过程透明，结论才可信，而不是黑箱给个分数。')]));

children.push(H2('8.2 第二层：全局"AI 小助手"对话智能体'));
children.push(P('右下角悬浮入口打开的对话智能体，基于大模型流式应答，具备四项关键能力：'));
children.push(elemTable([
  ['场景感知', '上下文注入', '把当前所在域、页面、选中对象注入系统提示（globalContext）', '问"这条风险怎么回事"时，它知道"这条"指的是哪一条——回答有上下文'],
  ['领域知识库', '检索增强', '每个域预置 overview / 典型案例 / 操作要点（domainKnowledge）', '回答有据可依，不会泛泛而谈；典型案例（如钢材采购合同价格偏高 11.5%）可直接引用'],
  ['思考档位', '推理强度可调', 'off / low / medium / high / max 控制推理链深度（reasoning_content）', '简单问题直接答、复杂问题展开多步推理，按需分配算力'],
  ['行动协议', '自然语言驱动操作', '模型在回复末尾输出受限 <drp> 指令，仅 navigate / openContract / analyzeRisk 三类', '说"打开合同域""分析钢材采购价格异动"即自动跳转/触发——"动嘴即动屏"'],
]));

children.push(H2('8.3 关键设计：为什么这个 Agent 不会"乱点"'));
children.push(P('能驱动页面的 AI 最怕"自作主张"。平台用一套双保险把风险摁住：'));
children.push(num([run('白名单收口：', { bold: true }), run('行动指令只允许三种、且目标被严格限定（navigate 仅四个固定域；openContract 仅指定那份钢材采购合同；analyzeRisk 仅指定那条价格异动风险），其余一律视为无效；')]));
children.push(num([run('双重校验：', { bold: true }), run('即便模型输出了 <drp> 指令，系统还要回头核对"用户这句话里是否真的带了意图词（打开/进入/跳转/查看…）+ 对应域关键词"，两者都命中才执行——普通问候、闲聊、概览问答绝不动页面；')]));
children.push(num([run('规则兜底：', { bold: true }), run('命中关键词时，系统也能不依赖模型、直接由规则推导出该跳哪——模型偶发抽风也不影响关键演示动线；')]));
children.push(num([run('执行隔离：', { bold: true }), run('真正的跳转/打开/分析通过受控的执行桥触发，指令解析与页面操作分离，便于审计"谁、因为哪句话、触发了什么"。')]));
children.push(quote('一句话：让 AI 主动发现、透明推理、受控行动——这才是"人机协同"，而不是把方向盘交给模型。'));

children.push(H2('8.4 这套 AI 机制，最终交付什么价值'));
children.push(bullet([run('从"人问数"到"数找人"：', { bold: true }), run('不用想该查什么，系统主动告诉你该关注什么；')]));
children.push(bullet([run('从"看结论"到"看推理"：', { bold: true }), run('每个风险判断都附过程与依据，经得起追问；')]));
children.push(bullet([run('从"事后追"到"事中拦"：', { bold: true }), run('规则引擎在资金支付前拦截，把损失挡在发生之前。')]));

children.push(new Paragraph({ spacing: { before: 300 }, children: [run('—— 全文完。本说明所引指标、阈值与触发逻辑，均与系统实际界面、数据及代码实现保持一致。', { italics: true, color: '64748B', size: 19 })] }));

/* ============ Document ============ */
const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: {
    config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '▪', alignment: AlignmentType.LEFT, style: { run: { color: '2E6BC6' }, paragraph: { indent: { left: 520, hanging: 260 } } } }] },
      { reference: 'numlist', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 520, hanging: 260 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children,
  }],
});

const out = process.argv[2];
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('WROTE ' + out + ' (' + buf.length + ' bytes)'); });
