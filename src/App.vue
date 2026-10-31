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
const modalHero2 = ref<Hero | null>(null) // ДОБАВЛЕНО

// Состояние первой ленты
const currentReel = ref<Hero[]>([])
const currentWinnerIndex = ref(-1)

// Состояние второй ленты
const currentReel2 = ref<Hero[]>([])
const currentWinnerIndex2 = ref(-1)

const isSpinning = ref(false)
const isShaking = ref(false)
const bannedIds = ref<number[]>([])
const lastWinnerId = ref<number | null>(null)

const sourceMode = ref<'all' | 'filtered'>('all')
const isDoubleMode = ref(false) // ДОБАВЛЕНО

// Временное хранение результатов до завершения обеих анимаций
const p1Winner = ref<Hero | null>(null)
const p2Winner = ref<Hero | null>(null)

const activePool = computed(() => {
  let base = heroes.value
  if (sourceMode.value === 'filtered') {
    base = filteredHeroes.value
  }
  return base.filter(h => !bannedIds.value.includes(h.id))
})

function toggleBan(id: number) {
  if (isSpinning.value) return
  if (bannedIds.value.includes(id)) {
    bannedIds.value = bannedIds.value.filter(bid => bid !== id)
  } else {
    bannedIds.value.push(id)
  }
}

const history = ref<Hero[]>([])
const MAX_HISTORY = 10

function handleSpin() {
  if (isSpinning.value || activePool.value.length === 0) return
  
  modalOpen.value = false
  p1Winner.value = null
  p2Winner.value = null
  
  // Генерируем первый спин
  const result = spin(activePool.value, lastWinnerId.value)
  currentReel.value = result.reel
  currentWinnerIndex.value = result.winnerIndex
  
  // Если включен 1v1, генерируем второй спин
  if (isDoubleMode.value) {
    const winner1 = result.reel[result.winnerIndex]
    // Передаем победителя первого спина, чтобы избежать дубликата
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
  if (!isDoubleMode.value) {
    openResult(winner, null)
  } else if (p1Winner.value && p2Winner.value) {
    openResult(p1Winner.value, p2Winner.value)
  }
}

function handleFinished2(winner: Hero) {
  p2Winner.value = winner
  if (p1Winner.value && p2Winner.value) {
    openResult(p1Winner.value, p2Winner.value)
  }
}

function openResult(w1: Hero, w2: Hero | null) {
  isSpinning.value = false
  lastWinnerId.value = w1.id
  
  if (w2) {
    history.value = [w1, w2, ...history.value].slice(0, MAX_HISTORY)
  } else {
    history.value = [w1, ...history.value].slice(0, MAX_HISTORY)
  }

  if (getRarity(w1) === 'legendary' || (w2 && getRarity(w2) === 'legendary')) {
    playFanfare()
  }

  setTimeout(() => {
    modalHero.value = w1
    modalHero2.value = w2
    modalOpen.value = true
  }, 600)
}

function handleSpinAgain() {
  handleSpin()
}

onMounted(() => {
  loadHeroes()
})
</script>

<template>
  <div class="relative min-h-screen pb-12 font-sans" :class="{ 'animate-shake': isShaking }">
    <div class="fixed inset-0 -z-10 overflow-hidden bg-noise">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-900/20 blur-[150px] pointer-events-none" />
      <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
    </div>

    <div class="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header class="mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-center sm:text-left">
          <h1 class="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            MLBB Random <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">1v1</span>
          </h1>
          <p class="text-fuchsia-400/80 text-sm mt-2 font-medium tracking-widest uppercase drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">
            Выбери своего чемпиона
          </p>
        </div>
        
        <button @click="toggleMute" class="p-3 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors" :title="isMuted ? 'Включить звук' : 'Выключить звук'">
          <svg v-if="!isMuted" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <svg v-else class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        </button>
      </header>

      <section class="mb-10 space-y-4">
        <!-- Первая лента -->
        <SpinReel 
          :reel="currentReel" 
          :winnerIndex="currentWinnerIndex" 
          :spinning="isSpinning" 
          @finished="handleFinished1"
          @shake="handleShake"
        />
        
        <!-- Вторая лента (появляется в режиме 1v1) -->
        <SpinReel 
          v-if="isDoubleMode"
          :reel="currentReel2" 
          :winnerIndex="currentWinnerIndex2" 
          :spinning="isSpinning" 
          @finished="handleFinished2"
          @shake="handleShake"
        />

        <SpinControls 
          :spinning="isSpinning" 
          :poolSize="activePool.length" 
          :sourceMode="sourceMode" 
          :isDoubleMode="isDoubleMode"
          @update:sourceMode="sourceMode = $event" 
          @update:isDoubleMode="isDoubleMode = $event"
          @spin="handleSpin" 
        />
      </section>

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

    <ResultModal 
      v-model:open="modalOpen" 
      :hero="modalHero" 
      :hero2="modalHero2" 
      @spin-again="handleSpinAgain" 
    />
  </div>
</template>