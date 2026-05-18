<template>
  <span class="badge" :style="{ color: cfg.color, borderColor: cfg.color }">{{ cfg.label }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { RISK_LEVELS } from '@/constants/risk'

const props = defineProps({
  level: { type: String, default: 'low' },
})

const cfg = computed(() => RISK_LEVELS[props.level] || RISK_LEVELS.low)
</script>

<style scoped>
.badge {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid;
  background: rgba(0, 0, 0, 0.25);
}
</style>
