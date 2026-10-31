<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue'
import confetti from 'canvas-confetti'
import type { Hero, Rarity } from '../types'
import { getRarity } from '../composables/useRarity'

const props = defineProps<{
  open: boolean
  hero: Hero | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'spin-again': []
}>()

const copied = ref(false)

const rarity = computed<Rarity | null>(() => {
  return props.hero ? getRarity(props.hero) : null
})

// Стили для рамки, бейджа и свечения в зависимости от редкости
const rarityConfig: Record<Rarity, { label: string; border: string; badge: string; glow: string; text: string }> = {
  legendary: {
    label: 'Legendary',
    border: 'from-fuchsia-500 via-orange-400 to-yellow-400',
    badge: 'bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white',
    glow: 'shadow-[0_0_50px_rgba(232,121,249,0.4)]',
    text: 'text-fuchsia-400',
  },
  epic: {
    label: 'Epic',
    border: 'from-purple-500 via-indigo-500 to-purple-500',
    badge: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.4)]',
    text: 'text-purple-400',
  },
  rare: {
    label: 'Rare',
    border: 'from-sky-400 to-blue-600',
    badge: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white',
    glow: 'shadow-[0_0_30px_rgba(56,189,248,0.3)]',
    text: 'text-sky-400',
  },
  common: {
    label: 'Common',
    border: 'from-slate-500 to-slate-700',
    badge: 'bg-slate-700 text-slate-200',
    glow: '',
    text: 'text-slate-400',
  },
}

// Запуск конфетти при открытии, если выпала легендарка
watch(() => props.open, (isOpen) => {
  if (isOpen && rarity.value === 'legendary') {
    // Небольшая задержка, чтобы модалка успела появиться
    setTimeout(fireConfetti, 200)
  }
})

function fireConfetti() {
  const duration = 3000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#a855f7', '#ec4899', '#fbbf24', '#ffffff']
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#a855f7', '#ec4899', '#fbbf24', '#ffffff']
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()
}

function close() {
  emit('update:open', false)
  copied.value = false
}

function spinAgain() {
  close()
  emit('spin-again')
}

async function copyResult() {
  if (!props.hero) return
  const text = `🎲 Выпал: ${props.hero.name} [${props.hero.role.join(', ')}]`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Не удалось скопировать', err)
  }
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/placeholder.png'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open && hero && rarity"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        @click.self="close"
      >
        <!-- Карточка модалки -->
        <div
          class="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/50 p-6 flex flex-col items-center text-center overflow-hidden"
          :class="rarityConfig[rarity].glow"
        >
          <!-- Фоновая подсветка внутри карточки -->
          <div class="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <!-- Аватарка с градиентной рамкой -->
          <div class="relative mb-5 mt-2">
            <div 
              class="p-1.5 rounded-full bg-gradient-to-tr"
              :class="rarityConfig[rarity].border"
            >
              <div class="w-32 h-32 rounded-full overflow-hidden bg-slate-800 border-4 border-slate-900 relative">
                <img
                  :src="hero.image"
                  :alt="hero.name"
                  class="w-full h-full object-cover object-top"
                  @error="handleImageError"
                />
              </div>
            </div>
            
            <!-- Бейдж редкости -->
            <div 
              class="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg"
              :class="rarityConfig[rarity].badge"
            >
              {{ rarityConfig[rarity].label }}
            </div>
          </div>

          <!-- Имя и роли -->
          <h2 class="font-display text-3xl font-extrabold text-white mt-2 mb-2">
            {{ hero.name }}
          </h2>
          
          <div class="flex flex-wrap justify-center gap-1.5 mb-8">
            <span
              v-for="role in hero.role"
              :key="role"
              class="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
            >
              {{ role }}
            </span>
          </div>

          <!-- Кнопки -->
          <div class="w-full space-y-3 relative z-10">
            <button
              @click="spinAgain"
              class="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              Крутить ещё раз
            </button>

            <div class="flex gap-3">
              <button
                @click="copyResult"
                class="flex-1 py-2.5 rounded-xl font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                {{ copied ? 'Скопировано' : 'Копировать' }}
              </button>

              <button
                @click="close"
                class="flex-1 py-2.5 rounded-xl font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Анимация fade + scale */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>