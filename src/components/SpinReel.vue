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
  (e: 'shake'): void
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

const showReel = ref(false)

let hideReelTimeout: number | undefined
let tickTimeout: number | undefined
let resizeObserver: ResizeObserver | null = null

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

function startTicks() {
  const startTime = performance.now()
  const duration = 5500

  function tick() {
    const elapsed = performance.now() - startTime
    if (elapsed >= duration) return

    playTick()
    const progress = elapsed / duration
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

// Вынесли логику запуска в отдельную функцию
async function startSpin() {
  if (hideReelTimeout) clearTimeout(hideReelTimeout)
  
  transitionStyle.value = 'none'
  translateX.value = 0
  isAnimating.value = true
  isFlashing.value = false
  showReel.value = true

  await nextTick()
  
  setTimeout(() => {
    if (!containerRef.value) return
    const target = calculateTargetOffset(true)
    transitionStyle.value = 'transform 5.5s cubic-bezier(0.15, 0.85, 0.15, 1)'
    translateX.value = target
    startTicks()
  }, 50)
}

watch(() => props.spinning, (isSpinning) => {
  if (isSpinning) {
    startSpin()
  }
})

function onTransitionEnd(e: TransitionEvent) {
  // Проверка, что событие пришло именно от ленты, а не от других элементов
  if (e.target !== trackRef.value) return
  
  if (e.propertyName === 'transform' && isAnimating.value) {
    isAnimating.value = false
    transitionStyle.value = 'none'
    translateX.value = calculateTargetOffset(false)

    stopTicks()
    playStop()

    isFlashing.value = true
    setTimeout(() => { isFlashing.value = false }, 400)
    emit('shake')

    const winner = props.reel[props.winnerIndex]
    if (winner) emit('finished', winner)

    hideReelTimeout = window.setTimeout(() => {
      showReel.value = false
    }, 1200)
  }
}

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!isAnimating.value && !props.spinning && props.winnerIndex >= 0 && props.reel.length > 0) {
        translateX.value = calculateTargetOffset(false)
      }
    })
    resizeObserver.observe(containerRef.value)
  }
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если компонент смонтировался уже во время прокрутки
  if (props.spinning) {
    startSpin()
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  stopTicks()
  if (hideReelTimeout) clearTimeout(hideReelTimeout)
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
  <div ref="containerRef" class="relative w-full h-[220px] sm:h-[260px] bg-slate-900/60 rounded-3xl border border-purple-500/40 overflow-hidden flex items-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-shadow duration-500" :class="spinning ? 'shadow-[0_0_50px_rgba(168,85,247,0.3)]' : ''">
    
    <Transition name="fade">
      <div v-if="!showReel" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 overflow-hidden">
        <div class="absolute w-64 h-64 rounded-full bg-purple-500/20 blur-[60px] animate-pulse"></div>
        
        <div class="relative z-10 flex flex-col items-center">
          <div class="w-24 h-24 rounded-full bg-slate-800/90 border border-purple-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-3 transform transition-transform hover:scale-105">
            <svg class="w-12 h-12 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 class="text-xl font-display font-bold text-white mb-1">Сундук 1v1</h3>
          <p class="text-xs text-slate-400">Содержит героев MLBB</p>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div 
        v-if="showReel && reel.length > 0"
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
            <img :src="hero.image" :alt="hero.name" class="w-full h-full object-cover object-top" @error="handleImageError" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-1.5 text-center bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent pt-4">
            <h3 class="font-display font-bold text-white text-[10px] truncate">{{ hero.name }}</h3>
          </div>
        </div>
      </div>
    </Transition>

    <template v-if="showReel">
      <div class="absolute inset-y-0 left-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
      <div class="absolute inset-y-0 right-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />
      
      <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-purple-500/0 via-fuchsia-400/80 to-purple-500/0 z-20 pointer-events-none transition-all duration-300" :class="isFlashing ? 'animate-flash' : 'animate-flicker'" />
      
      <div class="absolute top-0 left-1/2 -translate-x-1/2 z-30 animate-flicker">
        <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-fuchsia-400" />
      </div>
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 animate-flicker">
        <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-fuchsia-400" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.is-spinning {
  filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.9));
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>