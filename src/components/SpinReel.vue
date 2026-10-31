<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { Hero, Rarity } from '../types'
import { getRarity } from '../composables/useRarity'
import { useAudio } from '../composables/useAudio'

const props = defineProps<{
  reel: Hero[]
  winnerIndex: number
  spinning: boolean
}>()

const emit = defineEmits<{
  (e: 'finished', winner: Hero): void
  (e: 'shake'): void // Эмитим событие наверх для тряски всего экрана
}>()

const { playTick, playStop } = useAudio()

const containerRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

const CARD_WIDTH = 120
const GAP = 12
const STEP = CARD_WIDTH + GAP

const translateX = ref(0)
const transitionStyle = ref('none')
const isAnimating = ref(false)
const currentJitter = ref(0)
const isFlashing = ref(false)

let tickTimeout: number | undefined

const trackStyle = computed(() => ({
  transform: `translateX(${translateX.value}px)`,
  transition: transitionStyle.value,
}))

function calculateTargetOffset(useJitter = true): number {
  if (!containerRef.value) return 0
  const containerWidth = containerRef.value.clientWidth
  const baseOffset = props.winnerIndex * STEP + (STEP / 2) - (containerWidth / 2)
  
  let jitter = 0
  if (useJitter) {
    jitter = (Math.random() - 0.5) * 2 * (CARD_WIDTH * 0.25)
    currentJitter.value = jitter
  } else {
    jitter = currentJitter.value
  }
  return -(baseOffset + jitter)
}

// Генерация тиков с замедлением
function startTicks() {
  const startTime = performance.now()
  const duration = 5500 // должно совпадать с CSS transition

  function tick() {
    const elapsed = performance.now() - startTime
    if (elapsed >= duration) return

    playTick()

    // Вычисляем прогресс от 0 до 1
    const progress = elapsed / duration
    // Кривая затухания (начинаем с 30мс, доходим до 500мс к концу)
    const nextDelay = 30 + Math.pow(progress, 3) * 500

    tickTimeout = window.setTimeout(tick, nextDelay)
  }
  
  tick()
}

function stopTicks() {
  if (tickTimeout) {
    clearTimeout(tickTimeout)
    tickTimeout = undefined
  }
}

watch(() => props.spinning, async (isSpinning) => {
  if (isSpinning) {
    transitionStyle.value = 'none'
    translateX.value = 0
    isAnimating.value = true
    isFlashing.value = false

    await nextTick()
    void trackRef.value?.offsetHeight

    const target = calculateTargetOffset(true)
    
    setTimeout(() => {
      transitionStyle.value = 'transform 5.5s cubic-bezier(0.15, 0.85, 0.15, 1)'
      translateX.value = target
      startTicks() // Запуск тиков
    }, 50)
  }
})

function onTransitionEnd(e: TransitionEvent) {
  if (e.propertyName === 'transform' && isAnimating.value) {
    isAnimating.value = false
    transitionStyle.value = 'none'
    translateX.value = calculateTargetOffset(false)

    stopTicks()
    playStop()

    // Триггерим вспышку маркера
    isFlashing.value = true
    setTimeout(() => { isFlashing.value = false }, 400)

    // Триггерим тряску экрана (через родителя)
    emit('shake')

    const winner = props.reel[props.winnerIndex]
    if (winner) emit('finished', winner)
  }
}

function handleResize() {
  if (props.winnerIndex >= 0 && props.reel.length > 0) {
    translateX.value = calculateTargetOffset(false)
  }
}

onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopTicks()
})

const rarityStyles: Record<Rarity, any> = {
  legendary: { ring: 'ring-2 ring-fuchsia-400', badge: 'text-fuchsia-300 border-fuchsia-500/30' },
  epic: { ring: 'ring-2 ring-purple-500', badge: 'text-purple-300 border-purple-500/30' },
  rare: { ring: 'ring-2 ring-sky-500', badge: 'text-sky-300 border-sky-500/30' },
  common: { ring: 'ring-1 ring-slate-600', badge: 'text-slate-300 border-slate-600/50' },
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/placeholder.png'
}


</script>

<template>
  <div 
    ref="containerRef" 
    class="relative w-full h-[220px] sm:h-[260px] bg-slate-900/40 rounded-3xl border border-purple-500/30 overflow-hidden flex items-center shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]"
  >
    <div class="absolute inset-y-0 left-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-[#0b0614] to-transparent z-20 pointer-events-none" />
    <div class="absolute inset-y-0 right-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-[#0b0614] to-transparent z-20 pointer-events-none" />

    <!-- Маркер (линия) с эффектом вспышки -->
    <div 
      class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-purple-500/0 via-fuchsia-400/80 to-purple-500/0 z-20 pointer-events-none transition-all duration-300"
      :class="isFlashing ? 'animate-flash' : 'animate-flicker'"
    />
    
    <!-- Маркеры (треугольники) -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 z-30 animate-flicker">
      <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-fuchsia-400" />
    </div>
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 animate-flicker">
      <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-fuchsia-400" />
    </div>

    <div 
      v-if="reel.length > 0"
      ref="trackRef"
      class="absolute top-[5%] -translate-y-1/2 flex gap-[12px] will-change-transform"
      :class="{ 'is-spinning': spinning }"
      :style="trackStyle"
      @transitionend="onTransitionEnd"
    >
      <div
        v-for="(hero, index) in reel"
        :key="`${hero.id}-${index}`"
        class="relative flex-shrink-0 flex flex-col rounded-xl overflow-hidden bg-slate-800"
        :style="{ width: `${CARD_WIDTH}px` }"
        :class="[rarityStyles[getRarity(hero)].ring]"
      >
        <div class="relative w-full" style="aspect-ratio: 3/4;">
          <img
            :src="hero.image"
            :alt="hero.name"
            class="w-full h-full object-cover object-top"
            @error="handleImageError"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        </div>
        
        <div class="absolute bottom-0 left-0 right-0 p-1.5 text-center bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent pt-4">
          <h3 class="font-display font-bold text-white text-[10px] truncate">
            {{ hero.name }}
          </h3>
        </div>
      </div>
    </div>

    <div v-else class="w-full text-center text-slate-500 text-sm z-10">
      Нажмите «Крутить», чтобы сгенерировать рулетку
    </div>
  </div>
</template>

<style scoped>
.is-spinning {
  filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.8));
}
</style>