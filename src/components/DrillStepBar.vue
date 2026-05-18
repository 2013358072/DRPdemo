<template>
  <div class="drill panel">
    <div class="steps">
      <button
        v-for="(s, i) in steps"
        :key="s.key"
        type="button"
        class="step"
        :class="{ active: i === modelValue, done: i < modelValue }"
        @click="$emit('update:modelValue', i)"
      >
        {{ i + 1 }}. {{ s.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  steps: { type: Array, default: () => [] },
  modelValue: { type: Number, default: 0 },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.drill {
  padding: 12px 16px;
  margin-bottom: 16px;
}
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.step {
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.step:hover {
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--text);
}
.step.active {
  border-color: var(--accent);
  color: var(--text);
  background: rgba(59, 130, 246, 0.2);
  box-shadow: var(--glow);
}
.step.done:not(.active) {
  border-color: rgba(34, 197, 94, 0.35);
  color: var(--risk-green);
}
</style>
