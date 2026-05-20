<template>
  <div class="page-backbar">
    <button type="button" class="back-btn" @click="$emit('back')">
      <span class="back-arrow">←</span>
      <span>返回驾驶舱</span>
    </button>
    <div class="crumb">
      <span class="crumb-home">驾驶舱</span>
      <span class="crumb-sep">›</span>
      <span class="crumb-current">{{ title }}</span>
    </div>
    <div class="page-mark">{{ title }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
})

defineEmits(['back'])
</script>

<style scoped>
.page-backbar {
  display: none;
  align-items: center;
  gap: 12px;
  min-height: 38px;
  padding: 0 12px;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 212, 255, 0.14);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(6, 14, 34, 0.92), rgba(4, 11, 28, 0.82));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(72, 162, 255, 0.26);
  background: linear-gradient(180deg, rgba(18, 38, 76, 0.92), rgba(9, 21, 48, 0.96));
  color: #dbeeff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.back-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 212, 255, 0.42);
  box-shadow: 0 0 14px rgba(0, 212, 255, 0.12);
}

.back-arrow {
  color: #9adfff;
  font-size: 13px;
  line-height: 1;
}

.crumb {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #7c92ba;
  font-size: 12px;
  white-space: nowrap;
}

.crumb-home {
  color: #8ea8d6;
}

.crumb-sep {
  color: #4d6a9e;
}

.crumb-current {
  color: #cfe7ff;
  font-weight: 600;
}

.page-mark {
  margin-left: auto;
  color: rgba(0, 212, 255, 0.22);
  font-family: var(--f-n);
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
