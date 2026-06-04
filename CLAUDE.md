# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install deps (Node 18+)
npm run dev        # Vite dev server on :5173 (auto-opens browser)
npm run build      # production build to dist/
npm run preview    # preview the production build
```

There is no test runner, linter, or formatter configured — `dev`/`build`/`preview` are the only scripts.

## What this is

A **frontend-only demo** of a "穿透式监管" (penetrating supervision) dashboard for a large state-owned group. Everything is mock data driven; there is no real backend except an optional DeepSeek LLM call. Vue 3 (`<script setup>` Composition API) + Vite 5 + ECharts 6 + @antv/g6 4.

UI text, comments, and domain concepts are in Chinese. Keep that convention when adding content.

## Architecture

### Routing — custom hash SPA (no vue-router)
`src/App.vue` is the shell and the router. It maps `window.location.hash` to a scene component via `sceneMap`, renders the active one inside `<KeepAlive>` (so each view keeps its state when navigated away), and exposes a `navigate(scene)` function passed down as the `@navigate` event.

The **actual** scenes are:

| hash | component | domain |
|------|-----------|--------|
| `#/dashboard` | `views/Dashboard.vue` | 首页驾驶舱 (map, heatmap, KPIs) |
| `#/funds` | `views/Funds.vue` | 资金穿透 |
| `#/contract` | `views/Contract.vue` | 合同穿透 |
| `#/procurement` | `views/Procurement.vue` | 采购穿透 |
| `#/finance` | `views/Finance.vue` | 财务/资金穿透 |
| `#/ai` | `views/AIAgent.vue` | AI 指挥调度中心 |

> The `README.md` is partially **stale**: it references `Investment.vue` and routes `#/equity`, `#/invest`, `#/overseas` that no longer exist in `sceneMap`. Trust `App.vue`'s `sceneMap`, not the README, for the current route list. Unknown hashes resolve through `sceneAliasMap` in `normalizeScene` and fall back to `dashboard`. (A leftover `equity` branch in `currentPageTitle` is dead — `equity` is not a real scene.)

### Period toggle wiring
App.vue owns two independent period toggles in the topbar and passes the value down as a `period` prop:
- `procPeriod` → only `procurement`
- `mainPeriod` → `dashboard`, `finance`, `funds`

Period values are the strings `'30d' | '3m' | '6m'`. Views that react to period use the **period-keyed map** pattern: a plain object keyed by those three strings plus `const xxx = computed(() => map[props.period] || map['6m'])`. When adding period reactivity to a chart/stat, extend the map and read from the computed — don't add new toggle UI.

### AI / LLM layer (`src/api/`)
- `deepseek.js` — streaming chat against DeepSeek (`model: deepseek-v4-flash`). Reads the API key from `import.meta.env.VITE_DEEPSEEK_KEY_ENCODED`, which is a **base64-encoded** key decoded at runtime with `atob`. Without it, the assistant throws "未配置 API Key". The key lives in `.env` (already present; gitignored only via build conventions — it is committed here for the demo).
- `knowledge.js` — `buildSystemPrompt(context)` injects per-scene `domainKnowledge` into the system prompt; `globalContext` tracks current scene/page/selection.
- `agent-actions.js` — `AGENT_CAPABILITIES`, the action schema the LLM can emit (e.g. navigate/open). `GptChatModal` emits an `action` event that App.vue's `handleAIChatAction` turns into `navigate(...)`.

`GptChatModal.vue` (bottom-right `fab-chat` button) is the **current** assistant. `FloatingAIAssistant.vue` still exists but is **no longer wired into App.vue** — treat it as legacy.

The streaming bubble must **never render raw `<drp>{...}</drp>` action directives** to the user. `GptChatModal` strips them mid-stream via `renderStream()` (removes closed tags and truncates at a partial `<drp`) and on finalize via `stripActions`. Preserve this when touching the chat render path.

### Scripted (no-LLM) AI demos
Two flows are **fully hardcoded** for reliable live demos — they do *not* call DeepSeek:
- `views/AIAgent.vue` (指挥调度中心) is driven by `src/data/agentScript.js`: `matchScript(text)` keyword-matches the user's prompt to one of the `SCRIPT` entries, then the view streams the canned `thinking` + `reply.text`, sets `steps`, and may emit `navigate` for entries with an `action`. `RECOMMENDED_CHIPS` are the suggested prompts shown until the user sends a first message. To extend the demo, add/edit `SCRIPT` entries here, not in the component.
- `views/StoryAssociatedTransfer.vue` is a **self-contained** "故事线一：关联输送" walkthrough (own ECharts force graph, all mock data inline, no external state). A `step` (0–7) state machine + `async play()`/`sleep()` auto-advances the whole investigation; the only human interaction is one click on "采纳方案 A" (step 6→7). `runToken` cancels in-flight loops on reset. Mount with `<StoryAssociatedTransfer />`.

### Per-domain "AI 智能体" risk-analysis modal
Contract / Finance / Funds / Procurement each have a self-contained, step-by-step agent animation modal (deep-tech styling, ~7 reasoning steps driven by a `setInterval` at 600ms, status enum `pending/running/done`). The original "open risk report" logic in each view is wrapped: the public `openReport`/`openRisk` shows the modal, and the real navigation/API logic lives in a `_open...Real` counterpart called when the animation completes (or when the user clicks "查看分析报告"). Always `clearInterval` the timers in `onBeforeUnmount`. The four implementations are intentionally near-identical — keep them in sync when changing one.

### Charts
All ECharts usage goes through `components/EChart.vue` (a wrapper that owns the instance + a `ResizeObserver`); pass a reactive `:option` computed. Relationship/graph visualizations use `components/KnowledgeGraph.vue` (G6 4.x). `public/china.json` is the GeoJSON the Dashboard map registers.

ECharts gotcha seen in this repo: `visualMap` **piecewise** `pieces` defined with `min`/`max` can leave integer-boundary gaps (a value landing exactly on a seam renders with no color). Prefer `gte`/`lt` for contiguous, unambiguous ranges.

### Data
Mock data is the source of truth: primarily `src/mock/index.js` (large, ~40 datasets across all domains), with `src/data/mockData.js` and a root-level `mockData.js` also present. Risk-level constants and the `riskStyle()` helper live in `src/constants/risk.js`.

### Build / dev config (`vite.config.js`)
- `@` aliased to `src/`.
- Dev server: port 5173, `host: true`, `open: true`.
- Proxy: `/api` → `http://192.168.16.206:8899` (an internal demo backend; only relevant if real API calls are added — the app otherwise runs fully on mock data).
