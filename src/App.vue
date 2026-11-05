<script setup lang="ts">
import { onMounted, ref, computed, watch, nextTick, onUnmounted } from 'vue'
import type { Hero } from './types'
import { useHeroes } from './composables/useHeroes'
import { useSpin } from './composables/useSpin'
import { useAudio } from './composables/useAudio'
import FilterBar from './components/FilterBar.vue'
import HeroGrid from './components/HeroGrid.vue'
import SpinReel from './components/SpinReel.vue'
import SpinControls from './components/SpinControls.vue'
import ResultModal from './components/ResultModal.vue'
import { getRarity } from './composables/useRarity'

const {
  heroes, total, loading, error, filteredHeroes, allRoles,
  searchQuery, selectedRole, loadHeroes,
} = useHeroes()

const { spin } = useSpin()
const { isMuted, toggleMute, playFanfare } = useAudio()

const modalOpen = ref(false)
const modalHero = ref<Hero | null>(null)
const modalHero2 = ref<Hero | null>(null)

const currentReel = ref<Hero[]>([])
const currentWinnerIndex = ref(-1)
const currentReel2 = ref<Hero[]>([])
const currentWinnerIndex2 = ref(-1)

const isSpinning = ref(false)
const isShaking = ref(false)
const bannedIds = ref<number[]>([])
const lastWinnerId = ref<number | null>(null)

const sourceMode = ref<'all' | 'filtered'>('all')
const isDoubleMode = ref(false)

const p1Winner = ref<Hero | null>(null)
const p2Winner = ref<Hero | null>(null)

const filterBarRef = ref<HTMLElement | null>(null)

// Перебор героев в плейсхолдере
const previewHero = ref<Hero | null>(null)
let previewInterval: number | undefined

function startPreviewLoop() {
  if (previewInterval) clearInterval(previewInterval)
  if (!heroes.value.length) return

  previewInterval = window.setInterval(() => {
    const randomIndex = Math.floor(Math.random() * heroes.value.length)
    previewHero.value = heroes.value[randomIndex]
  }, 400)
}

onUnmounted(() => {
  if (previewInterval) clearInterval(previewInterval)
})

watch(() => heroes.value.length, (newLength) => {
  if (newLength > 0 && !previewHero.value) {
    previewHero.value = heroes.value[0]
    startPreviewLoop()
  }
})

watch([selectedRole, searchQuery], () => {
  nextTick(() => {
    if (filterBarRef.value) {
      const rect = filterBarRef.value.getBoundingClientRect()
      if (rect.top < 0) {
        const yOffset = -20
        const y = rect.top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }
  })
})

const activePool = computed(() => {
  let base = heroes.value
  if (sourceMode.value === 'filtered') base = filteredHeroes.value
  return base.filter(h => !bannedIds.value.includes(h.id))
})

function toggleBan(id: number) {
  if (isSpinning.value) return
  if (bannedIds.value.includes(id)) bannedIds.value = bannedIds.value.filter(bid => bid !== id)
  else bannedIds.value.push(id)
}

const history = ref<Hero[]>([])
const MAX_HISTORY = 10

function handleSpin() {
  if (isSpinning.value || activePool.value.length === 0) return
  modalOpen.value = false
  p1Winner.value = null
  p2Winner.value = null
  
  const result = spin(activePool.value, lastWinnerId.value)
  currentReel.value = result.reel
  currentWinnerIndex.value = result.winnerIndex
  
  if (isDoubleMode.value) {
    const winner1 = result.reel[result.winnerIndex]
    const result2 = spin(activePool.value, winner1.id)
    currentReel2.value = result2.reel
    currentWinnerIndex2.value = result2.winnerIndex
  } else {
    currentReel2.value = []
    currentWinnerIndex2.value = -1
  }
  isSpinning.value = true
}

function handleShake() {
  isShaking.value = true
  setTimeout(() => { isShaking.value = false }, 200)
}

function handleFinished1(winner: Hero) {
  p1Winner.value = winner
  if (!isDoubleMode.value) openResult(winner, null)
  else if (p1Winner.value && p2Winner.value) openResult(p1Winner.value, p2Winner.value)
}

function handleFinished2(winner: Hero) {
  p2Winner.value = winner
  if (p1Winner.value && p2Winner.value) openResult(p1Winner.value, p2Winner.value)
}

function openResult(w1: Hero, w2: Hero | null) {
  lastWinnerId.value = w1.id
  if (w2) history.value = [w1, w2, ...history.value].slice(0, MAX_HISTORY)
  else history.value = [w1, ...history.value].slice(0, MAX_HISTORY)

  if (getRarity(w1) === 'legendary' || (w2 && getRarity(w2) === 'legendary')) playFanfare()

  modalHero.value = w1
  modalHero2.value = w2
  modalOpen.value = true

  setTimeout(() => {
    isSpinning.value = false
  }, 1500)
}

function handleSpinAgain() { handleSpin() }
onMounted(() => { loadHeroes() })
</script>

<template>
  <div class="relative min-h-screen pb-32 font-sans overflow-x-hidden" :class="{ 'animate-shake': isShaking }">
    
    <div class="fixed inset-0 -z-10 overflow-hidden bg-[url('/images/bg-baroque.jpg')] bg-cover bg-center bg-no-repeat bg-fixed">
      <div class="absolute inset-0 bg-[#0a0202]/85 backdrop-blur-[3px]"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold/10 blur-[150px] pointer-events-none" />
      <div class="absolute inset-0 bg-arabesque opacity-30 mix-blend-overlay"></div>
    </div>

    <div class="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
      
      <header 
        class="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500"
        :class="isSpinning ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'"
      >
        <div class="text-center sm:text-left">
          <h1 class="font-display text-4xl sm:text-5xl font-black tracking-widest text-gold-gradient uppercase">
            MLBB Royal <span class="text-gold-light">1v1</span>
          </h1>
          <p class="text-gold/60 text-sm mt-2 font-serif italic tracking-widest uppercase">
            Выберите своего чемпиона
          </p>
        </div>
        <button @click="toggleMute" class="p-3 gold-border text-gold hover:bg-gold/10 transition-colors">
          <svg v-if="!isMuted" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <svg v-else class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </button>
      </header>

      <div class="flex justify-center mb-8 transition-all duration-500" :class="isSpinning ? 'opacity-0' : 'opacity-100'">
        <svg class="w-64 h-8 text-gold/60" viewBox="0 0 200 30" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M0 15h70c10 0 15-10 30-10s20 10 30 10 20-10 30-10 20 10 30 10h10" />
          <circle cx="100" cy="15" r="4" fill="currentColor" />
          <path d="M85 10c5 0 10 5 15 5s10-5 15-5" stroke-width="1" />
        </svg>
      </div>

      <!-- ИСТОРИЯ ДРОПОВ (Уменьшена высота) -->
      <div class="transition-all duration-500" :class="isSpinning ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'">
        <section v-if="history.length > 0" class="mb-6 bg-[#0a0202]/90 border border-gold/30 px-4 py-3 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-md">
          <div class="absolute inset-0 bg-arabesque opacity-10 pointer-events-none rounded-sm"></div>
          
          <div class="vine-corner vine-tl opacity-40 scale-[0.6]"></div>
          <div class="vine-corner vine-tr opacity-40 scale-[0.6]"></div>
          <div class="vine-corner vine-bl opacity-40 scale-[0.6]"></div>
          <div class="vine-corner vine-br opacity-40 scale-[0.6]"></div>

          <div class="relative z-10 flex flex-col items-center mb-2">
            <h3 class="text-xs font-display font-bold text-gold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <svg class="w-3 h-3 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              Последние выпавшие герои
              <svg class="w-3 h-3 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </h3>
            <!-- Уменьшили разделитель по высоте -->
            <div class="baroque-divider scale-y-50 -my-2"></div>
          </div>
          
          <div class="flex gap-3 overflow-x-auto p-1 scrollbar-hide relative z-10">
            <div 
              v-for="(hero, idx) in history" 
              :key="`${hero.id}-${idx}`" 
              class="flex-shrink-0 w-16 h-16 rounded-full border-2 overflow-hidden bg-black relative group shadow-[0_0_10px_rgba(0,0,0,0.8)] transition-all hover:scale-110 hover:z-20" 
              :class="{
                'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]': getRarity(hero) === 'legendary',
                'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]': getRarity(hero) === 'epic',
                'border-purple-500': getRarity(hero) === 'rare',
                'border-blue-500': getRarity(hero) === 'common'
              }" 
              :title="hero.name"
            >
              <img :src="hero.image" class="w-full h-full object-cover object-top" @error="(e: any) => e.target.src = '/placeholder.png'" />
              <div class="absolute inset-0 bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-[9px] font-display font-bold text-gold-light uppercase text-center leading-tight px-1">{{ hero.name }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- СЕКЦИЯ РУЛЕТКИ -->
      <section 
        class="transition-opacity duration-500"
        :class="[
          isSpinning 
            ? 'fixed inset-0 z-50 bg-velvet-dark/95 backdrop-blur-md flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8' 
            : 'relative mb-10 z-10'
        ]"
      >
        <div class="w-full max-w-[1400px] mx-auto">
          
          <Transition name="fade">
            <div 
              v-if="!isSpinning" 
              class="relative w-full flex flex-col items-center justify-center py-12 cursor-pointer group"
              @click="handleSpin"
            >
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gold/10 group-hover:bg-gold/20 transition-colors duration-500 blur-[100px] animate-pulse pointer-events-none"></div>
              
              <div class="relative z-10 flex flex-col items-center animate-breathe">
                
                <div class="relative w-48 h-48 sm:w-56 sm:h-56 mb-6 rounded-sm card-double-border overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] group-hover:border-gold-light transition-all duration-300 bg-[#120404]">
                  
                  <Transition name="fade">
                    <img 
                      v-if="previewHero"
                      :key="previewHero.id"
                      :src="previewHero.image" 
                      :alt="previewHero.name"
                      class="w-full h-full object-cover object-top absolute inset-0"
                      @error="(e: any) => e.target.src = '/placeholder.png'"
                    />
                  </Transition>
                  
                  <div class="absolute inset-0 bg-black/60 backdrop-blur-[4px] z-10 group-hover:bg-black/40 transition-colors duration-300"></div>
                  
                  <div class="absolute inset-0 z-20 flex items-center justify-center">
                    <span class="font-display font-black text-7xl sm:text-8xl text-gold-gradient drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] group-hover:drop-shadow-[0_0_30px_rgba(212,175,55,1)] transition-all duration-300">?</span>
                  </div>

                  <div class="vine-corner vine-tl opacity-60 scale-75 z-30"></div>
                  <div class="vine-corner vine-tr opacity-60 scale-75 z-30"></div>
                  <div class="vine-corner vine-bl opacity-60 scale-75 z-30"></div>
                  <div class="vine-corner vine-br opacity-60 scale-75 z-30"></div>
                </div>

                <h3 class="text-4xl sm:text-5xl font-display font-black text-gold-gradient tracking-[0.15em] uppercase mb-3 group-hover:text-gold-light transition-colors duration-300">Random</h3>
                <p class="text-xl text-gold/80 italic font-serif group-hover:text-gold transition-colors duration-300">Нажмите «крутить»</p>
              </div>
            </div>
          </Transition>

          <SpinReel v-if="isSpinning" :reel="currentReel" :winnerIndex="currentWinnerIndex" :spinning="isSpinning" @finished="handleFinished1" @shake="handleShake" />
          
          <Transition enter-active-class="transition-all duration-500 ease-out" enter-from-class="opacity-0 translate-y-4 scale-95" leave-active-class="transition-all duration-300 ease-in" leave-to-class="opacity-0 translate-y-4 scale-95">
            <SpinReel v-if="isDoubleMode && isSpinning" :reel="currentReel2" :winnerIndex="currentWinnerIndex2" :spinning="isSpinning" @finished="handleFinished2" @shake="handleShake" class="mt-6" />
          </Transition>
        </div>
      </section>

      <div class="transition-all duration-500" :class="isSpinning ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100 translate-y-0'">
        <div ref="filterBarRef">
          <FilterBar v-model:search="searchQuery" v-model:selected-role="selectedRole" :roles="allRoles" :total="total" :shown="filteredHeroes.length" />
        </div>

        <HeroGrid :heroes="filteredHeroes" :loading="loading" :error="error" :bannedIds="bannedIds" @toggle-ban="toggleBan" @retry="loadHeroes(true)" />
      </div>

    </div>

    <Transition enter-active-class="transition-transform duration-300 ease-out" enter-from-class="translate-y-full" leave-active-class="transition-transform duration-300 ease-in" leave-to-class="translate-y-full">
      <SpinControls v-if="!isSpinning" :spinning="isSpinning" :poolSize="activePool.length" :sourceMode="sourceMode" :isDoubleMode="isDoubleMode" @update:sourceMode="sourceMode = $event" @update:isDoubleMode="isDoubleMode = $event" @spin="handleSpin" />
    </Transition>

    <ResultModal v-model:open="modalOpen" :hero="modalHero" :hero2="modalHero2" @spin-again="handleSpinAgain" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>