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
  if (isSpinning) startSpin()
})

function onTransitionEnd(e: TransitionEvent) {
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

    hideReelTimeout = window.setTimeout(() => { showReel.value = false }, 1200)
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
  if (props.spinning) startSpin()
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  stopTicks()
  if (hideReelTimeout) clearTimeout(hideReelTimeout)
})

const rarityStyles: Record<Rarity, any> = {
  legendary: { ring: 'border-2 border-red-600' },
  epic: { ring: 'border-2 border-pink-600' },
  rare: { ring: 'border border-purple-600' },
  common: { ring: 'border border-blue-600' },
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/placeholder.png'
}
</script>

<template>
  <div ref="containerRef" class="relative w-full h-[220px] sm:h-[260px] bg-velvet-dark/80 rounded-sm border-2 border-gold/30 overflow-hidden flex items-center shadow-[inset_0_0_50px_rgba(0,0,0,1)] transition-shadow duration-500" :class="spinning ? 'shadow-[0_0_60px_rgba(212,175,55,0.2)]' : ''">
    
    <Transition name="fade">
      <div v-if="!showReel" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-velvet overflow-hidden">
        <div class="absolute w-64 h-64 rounded-full bg-gold/10 blur-[60px] animate-pulse"></div>
        <div class="relative z-10 flex flex-col items-center">
          <div class="w-24 h-24 rounded-full gold-border flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)] mb-3 bg-velvet">
            <svg class="w-12 h-12 text-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 2L15 8L21 9L16 14L17 20L12 17L7 20L8 14L3 9L9 8L12 2Z" />
            </svg>
          </div>
          <h3 class="text-xl font-display font-bold text-gold-gradient mb-1 tracking-widest uppercase">Рулетка</h3>
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
          class="relative flex-shrink-0 flex flex-col rounded-sm overflow-hidden bg-velvet-light card-double-border"
          :style="{ width: `${CARD_WIDTH}px` }"
          :class="[rarityStyles[getRarity(hero)].ring]"
        >
          <!-- Уголки лозы на карточках рулетки (всегда видны, но полупрозрачные) -->
          <div class="vine-corner vine-tl opacity-40 scale-50"></div>
          <div class="vine-corner vine-tr opacity-40 scale-50"></div>
          <div class="vine-corner vine-bl opacity-40 scale-50"></div>
          <div class="vine-corner vine-br opacity-40 scale-50"></div>

          <div class="relative w-full" style="aspect-ratio: 3/4;">
            <img :src="hero.image" :alt="hero.name" class="w-full h-full object-cover object-top" @error="handleImageError" />
            <div class="absolute inset-0 bg-gradient-to-t from-velvet-dark via-transparent to-transparent opacity-90" />
          </div>
          
          <div class="absolute bottom-0 left-0 right-0 p-1.5 text-center bg-gradient-to-t from-black via-black/90 to-transparent pt-6">
            <h3 class="font-display font-black text-gold-light text-[10px] truncate uppercase tracking-wider [text-shadow:_0_1px_2px_rgba(0,0,0,1)]">
              {{ hero.name }}
            </h3>
          </div>
        </div>
      </div>
    </Transition>

    <template v-if="showReel">
      <div class="absolute inset-y-0 left-0 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-velvet-dark to-transparent z-20 pointer-events-none" />
      <div class="absolute inset-y-0 right-0 w-16 sm:w-24 md:w-32 bg-gradient-to-l from-velvet-dark to-transparent z-20 pointer-events-none" />
      
      <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-gold/0 via-gold to-gold/0 z-20 pointer-events-none transition-all duration-300" :class="isFlashing ? 'animate-flash' : 'animate-flicker'" />
      
      <div class="absolute top-0 left-1/2 -translate-x-1/2 z-30 animate-flicker drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]">
        <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
          <path d="M12 20L0 0H24L12 20Z" fill="#F3E5AB" />
          <path d="M12 16L4 2H20L12 16Z" fill="#D4AF37" />
          <circle cx="12" cy="6" r="2" fill="#1a0505" />
        </svg>
      </div>
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 animate-flicker drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]">
        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" class="rotate-180">
          <path d="M12 20L0 0H24L12 20Z" fill="#F3E5AB" />
          <path d="M12 16L4 2H20L12 16Z" fill="#D4AF37" />
          <circle cx="12" cy="6" r="2" fill="#1a0505" />
        </svg>
      </div>
    </template>
  </div>
</template>

<style scoped>
.is-spinning { filter: drop-shadow(0 0 25px rgba(212, 175, 55, 0.6)); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>