<template>
  <div class="scene-content">
    <div class="scene-header">
      <h2>AI 智能体<span class="sh-en">PASSIVE QUERY → PROACTIVE DISCOVERY</span></h2>
      <div class="sh-tag">
        <span>4个Agent</span><span>2650+任务/日</span>
        <span>智能问数</span><span>"数找人"</span>
      </div>
    </div>

    <div class="ai-layout">
      <!-- KPI -->
      <div class="ak panel">
        <span class="cb"></span><span class="cr"></span>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">智能体 <span class="kpi-tag">AGENTS</span></div>
            <div class="kpi-value">4<span class="kpi-unit">个</span></div>
            <div class="kpi-delta up">在线协作</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">本日任务 <span class="kpi-tag">TASKS</span></div>
            <div class="kpi-value">2,650<span class="kpi-unit">+</span></div>
            <div class="kpi-delta up">自动执行</div>
          </div>
          <div class="kpi-card warn">
            <div class="kpi-label">主动发现 <span class="kpi-tag">DISCOVERED</span></div>
            <div class="kpi-value orange">28<span class="kpi-unit">条</span></div>
            <div class="kpi-delta warn">本周新增</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">准确率 <span class="kpi-tag">ACCURACY</span></div>
            <div class="kpi-value">93.6<span class="kpi-unit">%</span></div>
            <div class="kpi-delta up">▲ 持续学习</div>
          </div>
        </div>
      </div>

      <!-- 左：Agent 群 -->
      <div class="ac">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">AI 智能体群 <span class="pt-en">FLEET</span></div>
          </div>
          <div class="agent-list">
            <div v-for="a in D_AGENTS" :key="a.name" class="agent-card">
              <div class="ag-status">在线</div>
              <div class="ag-name">{{ a.name }}</div>
              <div class="ag-role">{{ a.role }}</div>
              <div class="ag-tasks">本日任务: {{ a.tasks }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中：对话流 -->
      <div class="ac">
        <div class="panel flex-1 chat-panel">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">智能问数对话 <span class="pt-en">DIALOG</span></div>
            <div class="panel-action">▶ 自动演示</div>
          </div>
          <div class="chat-stream">
            <div v-for="(c, i) in D_CONVERSATIONS" :key="i" class="chat-block">
              <div class="chat-msg user">
                <div class="msg-bubble">{{ c.user }}</div>
              </div>
              <div class="chat-msg ai">
                <div class="ai-think">
                  <div v-for="(t, j) in c.thinking" :key="j" class="think-step">{{ t }}</div>
                </div>
                <div class="ai-bubble">{{ c.response }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：主动发现 + 协作流程 -->
      <div class="ac">
        <div class="panel flex-1">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">主动发现 <span class="pt-en">PROACTIVE</span></div>
            <div class="panel-action">数找人</div>
          </div>
          <div class="proactive-list">
            <div
              v-for="p in D_PROACTIVE" :key="p.title"
              class="pro-card" :class="p.type"
            >
              <div class="pc-head">
                <span>{{ p.title }}</span>
                <span class="pc-time">{{ p.time }}</span>
              </div>
              <div class="pc-detail">{{ p.detail }}</div>
            </div>
          </div>
        </div>

        <div class="panel" style="flex:0.5">
          <span class="cb"></span><span class="cr"></span>
          <div class="panel-head">
            <div class="panel-title">协作流程 <span class="pt-en">WORKFLOW</span></div>
          </div>
          <div class="workflow">
            <div v-for="(s, i) in D_WORKFLOW" :key="i" class="wf-step">
              <span class="wf-num">{{ i + 1 }}</span>
              <span>{{ s }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { D_AGENTS, D_CONVERSATIONS, D_PROACTIVE, D_WORKFLOW } from '../data/mockData.js'
</script>

<style scoped>
.ai-layout {
  display: grid;
  grid-template-columns: 1fr 1.6fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 14px;
  height: calc(100% - 50px);
}
.ak { grid-column: 1/-1; }
.ac { display: flex; flex-direction: column; gap: 14px; min-height: 0; }

/* Agent 卡片 */
.agent-list { overflow-y: auto; max-height: 100%; }
.agent-card {
  padding: 11px;
  border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(0,126,194,0.12), rgba(8,18,42,0.4));
  margin-bottom: 8px;
  position: relative;
}
.ag-status {
  position: absolute; top: 10px; right: 12px;
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: var(--r-green);
  letter-spacing: 0.1em;
}
.ag-status::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: var(--r-green); box-shadow: 0 0 6px var(--r-green);
  animation: pulse 2s ease-in-out infinite;
}
.ag-name {
  font-size: 13px; font-weight: 600;
  color: var(--t-1); margin-bottom: 3px;
}
.ag-role { font-size: 11px; color: var(--t-3); line-height: 1.5; }
.ag-tasks {
  margin-top: 6px;
  font-family: var(--f-n); font-size: 11px;
  color: var(--primary);
}

/* 对话流 */
.chat-panel { display: flex; flex-direction: column; }
.chat-stream { flex: 1; overflow-y: auto; padding: 6px; }
.chat-block { margin-bottom: 14px; animation: fadeIn .5s ease; }
.chat-msg.user { text-align: right; }
.chat-msg.user .msg-bubble {
  display: inline-block; padding: 9px 12px;
  background: linear-gradient(135deg, var(--p-dim), rgba(0,212,255,0.4));
  color: var(--t-1); font-size: 12px;
  max-width: 75%; text-align: left;
  border-radius: 3px;
}
.chat-msg.ai .ai-think {
  background: rgba(72,162,255,0.04);
  border-left: 2px solid var(--p-dim);
  padding: 8px 10px;
  font-size: 10px; color: var(--t-3);
  margin-bottom: 6px;
  font-family: var(--f-m);
}
.chat-msg.ai .think-step {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 2px;
}
.chat-msg.ai .think-step::before {
  content: '◉'; color: var(--primary); font-size: 7px;
}
.chat-msg.ai .ai-bubble {
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(0,126,194,0.18), rgba(8,18,42,0.6));
  border: 1px solid var(--p-dim);
  font-size: 12px; line-height: 1.6;
  border-radius: 3px;
  color: var(--t-1);
}

/* 主动发现 */
.proactive-list { display: flex; flex-direction: column; gap: 8px; }
.pro-card {
  padding: 11px;
  border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(255,138,60,0.08), rgba(8,18,42,0.4));
  border-left: 3px solid var(--r-orange);
  font-size: 11px;
}
.pro-card.discovery {
  border-left-color: var(--primary);
  background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(8,18,42,0.4));
}
.pro-card.anomaly {
  border-left-color: var(--r-red);
  background: linear-gradient(135deg, rgba(255,46,94,0.08), rgba(8,18,42,0.4));
}
.pc-head {
  display: flex; justify-content: space-between;
  font-weight: 500; color: var(--t-1);
  font-size: 12px; margin-bottom: 4px;
}
.pc-time { font-family: var(--f-n); font-size: 9px; color: var(--t-3); }
.pc-detail { font-size: 11px; color: var(--t-2); line-height: 1.5; }

/* 协作流程 */
.workflow { padding: 6px; font-size: 11px; line-height: 2; }
.wf-step {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0;
  color: var(--t-2);
}
.wf-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(0,212,255,0.2);
  border: 1px solid var(--primary);
  color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
  font-family: var(--f-n);
}
</style>
