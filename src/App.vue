<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
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
  <!-- pb-32 нужен, чтобы фиксированная панель не перекрывала контент внизу -->
  <div class="relative min-h-screen pb-32 font-sans overflow-x-hidden" :class="{ 'animate-shake': isShaking }">
    
    <div class="fixed inset-0 -z-10 overflow-hidden bg-noise">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-900/20 blur-[150px] pointer-events-none" />
      <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
    </div>

    <div class="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
      
      <header 
        class="mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500"
        :class="isSpinning ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'"
      >
        <div class="text-center sm:text-left">
          <h1 class="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            MLBB Random <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">1v1</span>
          </h1>
          <p class="text-fuchsia-400/80 text-sm mt-2 font-medium tracking-widest uppercase drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">
            Выбери своего чемпиона
          </p>
        </div>
        <button @click="toggleMute" class="p-3 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
          <svg v-if="!isMuted" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <svg v-else class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </button>
      </header>

      <section 
        class="transition-opacity duration-500"
        :class="[
          isSpinning 
            ? 'fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8' 
            : 'relative mb-10 z-10'
        ]"
      >
        <div class="w-full max-w-[1400px] mx-auto">
          
          <!-- ПЛЕЙСХОЛДЕР (сундук) -->
          <Transition name="fade">
            <div v-if="!isSpinning" class="relative w-full flex flex-col items-center justify-center py-16 pointer-events-none">
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-600/20 blur-[80px] animate-pulse"></div>
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full bg-fuchsia-500/20 blur-[40px]"></div>

              <div class="relative z-10 flex flex-col items-center animate-[bounce_3s_infinite]">
                <div class="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-slate-900/60 border border-purple-500/40 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.3)] backdrop-blur-sm mb-6 transform rotate-3">
                  <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr from-purple-500/10 to-transparent"></div>
                  <svg class="w-16 h-16 sm:w-20 sm:h-20 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 class="text-2xl sm:text-3xl font-display font-black text-white tracking-wide mb-2">Random Hero</h3>
                <p class="text-sm text-slate-400">Нажмите «Крутить», чтобы открыть</p>
              </div>
            </div>
          </Transition>

          <!-- Колеса -->
          <SpinReel 
            v-if="isSpinning"
            :reel="currentReel" 
            :winnerIndex="currentWinnerIndex" 
            :spinning="isSpinning" 
            @finished="handleFinished1"
            @shake="handleShake"
          />
          
          <Transition
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 translate-y-4 scale-95"
            leave-active-class="transition-all duration-300 ease-in"
            leave-to-class="opacity-0 translate-y-4 scale-95"
          >
            <SpinReel 
              v-if="isDoubleMode && isSpinning"
              :reel="currentReel2" 
              :winnerIndex="currentWinnerIndex2" 
              :spinning="isSpinning" 
              @finished="handleFinished2"
              @shake="handleShake"
              class="mt-4"
            />
          </Transition>
        </div>
      </section>

      <!-- Основной контент -->
      <div 
        class="transition-all duration-500"
        :class="isSpinning ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100 translate-y-0'"
      >
        <section v-if="history.length > 0" class="mb-8">
          <h3 class="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Последние дропы</h3>
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <div v-for="(hero, idx) in history" :key="`${hero.id}-${idx}`" class="flex-shrink-0 w-12 h-12 rounded-full border-2 overflow-hidden bg-slate-800 relative group" :class="{
                'border-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.5)]': getRarity(hero) === 'legendary',
                'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]': getRarity(hero) === 'epic',
                'border-sky-500': getRarity(hero) === 'rare',
                'border-slate-600': getRarity(hero) === 'common'
              }" :title="hero.name">
              <img :src="hero.image" class="w-full h-full object-cover object-top" @error="(e: any) => e.target.src = '/placeholder.png'" />
            </div>
          </div>
        </section>

        <FilterBar v-model:search="searchQuery" v-model:selected-role="selectedRole" :roles="allRoles" :total="total" :shown="filteredHeroes.length" />

        <HeroGrid :heroes="filteredHeroes" :loading="loading" :error="error" :bannedIds="bannedIds" @toggle-ban="toggleBan" @retry="loadHeroes(true)" />
      </div>

    </div>

    <!-- Панель управления (выезжает снизу, скрыта при прокрутке) -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-to-class="translate-y-full"
    >
      <SpinControls 
        v-if="!isSpinning"
        :spinning="isSpinning" 
        :poolSize="activePool.length" 
        :sourceMode="sourceMode" 
        :isDoubleMode="isDoubleMode"
        @update:sourceMode="sourceMode = $event" 
        @update:isDoubleMode="isDoubleMode = $event"
        @spin="handleSpin" 
      />
    </Transition>

    <ResultModal v-model:open="modalOpen" :hero="modalHero" :hero2="modalHero2" @spin-again="handleSpinAgain" />
  </div>
</template>