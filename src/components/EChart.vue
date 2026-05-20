<template>
  <div ref="host" class="echart-host" />
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

const props = defineProps({
  option: { type: Object, required: true },
  theme: { type: String, default: 'dark' },
})
const emit = defineEmits(['chart-click'])

const host = ref(null)
const chart = shallowRef(null)
let resizeObserver = null
let resizeFrame = 0

function resize() {
  chart.value?.resize()
}

function scheduleResize() {
  window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    resize()
  })
}

function init() {
  if (!host.value) return

  resizeObserver?.disconnect()
  window.removeEventListener('resize', resize)

  if (chart.value) {
    chart.value.dispose()
    chart.value = null
  }

  chart.value = echarts.init(host.value, props.theme, { renderer: 'canvas' })
  chart.value.setOption(props.option, true)
  chart.value.on('click', (params) => {
    emit('chart-click', params)
  })

  window.addEventListener('resize', resize)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      scheduleResize()
    })
    resizeObserver.observe(host.value)
  }
}

onMounted(init)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  resizeObserver?.disconnect()
  resizeObserver = null
  window.cancelAnimationFrame(resizeFrame)
  chart.value?.dispose()
  chart.value = null
})

watch(
  () => props.option,
  (option) => {
    if (chart.value && option) {
      chart.value.setOption(option, true)
    }
  },
  { deep: true }
)
</script>

<style scoped>
.echart-host {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
