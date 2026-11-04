<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import confetti from 'canvas-confetti'
import type { Hero, Rarity } from '../types'
import { getRarity } from '../composables/useRarity'

const props = defineProps<{
  open: boolean
  hero: Hero | null
  hero2?: Hero | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'spin-again': []
}>()

const copied = ref(false)
const modalRef = ref<HTMLElement | null>(null)
const spinAgainBtnRef = ref<HTMLButtonElement | null>(null)

const rarity = computed<Rarity | null>(() => props.hero ? getRarity(props.hero) : null)
const rarity2 = computed<Rarity | null>(() => props.hero2 ? getRarity(props.hero2) : null)
const is1v1 = computed(() => !!props.hero2)

const rarityConfig: Record<Rarity, { label: string; border: string; badge: string; glow: string; text: string }> = {
  legendary: { label: 'Legendary', border: 'from-red-600 via-red-400 to-red-900', badge: 'bg-red-600 text-white', glow: 'shadow-[0_0_100px_rgba(239,68,68,0.2)]', text: 'text-red-500' },
  epic: { label: 'Epic', border: 'from-pink-600 via-pink-400 to-pink-900', badge: 'bg-pink-600 text-white', glow: 'shadow-[0_0_80px_rgba(236,72,153,0.2)]', text: 'text-pink-500' },
  rare: { label: 'Rare', border: 'from-purple-600 via-purple-400 to-purple-900', badge: 'bg-purple-600 text-white', glow: 'shadow-[0_0_60px_rgba(147,51,234,0.2)]', text: 'text-purple-500' },
  common: { label: 'Common', border: 'from-blue-600 via-blue-400 to-blue-900', badge: 'bg-blue-600 text-white', glow: '', text: 'text-blue-500' },
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    spinAgainBtnRef.value?.focus()
    if (rarity.value === 'legendary' || rarity2.value === 'legendary') {
      setTimeout(fireConfetti, 200)
    }
  }
})

function fireConfetti() {
  const duration = 3000
  const end = Date.now() + duration
  const colors = ['#ef4444', '#f97316', '#fbbf24', '#ffffff'] 
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

function handleTab(e: KeyboardEvent) {
  if (!modalRef.value) return
  const focusable = Array.from(modalRef.value.querySelectorAll('button'))
  if (focusable.length === 0) return
  const first = focusable[0] as HTMLElement
  const last = focusable[focusable.length - 1] as HTMLElement
  
  if (e.shiftKey && document.activeElement === first) {
    last.focus()
    e.preventDefault()
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus()
    e.preventDefault()
  }
}

async function copyResult() {
  if (!props.hero) return
  let text = ''
  if (is1v1.value && props.hero2) {
    text = `⚔️ 1v1: ${props.hero.name} [${props.hero.role.join(', ')}] 🆚 ${props.hero2.name} [${props.hero2.role.join(', ')}]`
  } else {
    text = `🎲 Выпал: ${props.hero.name} [${props.hero.role.join(', ')}]`
  }
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
      <div v-if="open && hero && rarity" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="emit('update:open', false)">
        
        <div 
          ref="modalRef" 
          @keydown.tab="handleTab" 
          role="dialog" 
          aria-modal="true" 
          class="relative w-full rounded-sm bg-[#120404] border-2 border-gold/50 p-8 flex flex-col items-center text-center overflow-hidden transition-all duration-300 shadow-[0_20px_70px_rgba(0,0,0,0.9)] card-double-border"
          :class="[is1v1 ? 'max-w-3xl' : 'max-w-sm', rarityConfig[rarity].glow]"
        >
          <!-- Углы-лозы внутри модалки -->
          <div class="vine-corner vine-tl opacity-60 scale-75"></div>
          <div class="vine-corner vine-tr opacity-60 scale-75"></div>
          <div class="vine-corner vine-bl opacity-60 scale-75"></div>
          <div class="vine-corner vine-br opacity-60 scale-75"></div>

          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>

          <div aria-live="polite" class="sr-only">
            <span v-if="!is1v1">Выпал герой: {{ hero.name }}.</span>
            <span v-else-if="hero2 && rarity2">Игрок 1: {{ hero.name }}. Игрок 2: {{ hero2.name }}.</span>
          </div>

          <!-- Одиночный режим -->
          <div v-if="!is1v1" class="flex flex-col items-center w-full relative z-10">
            <!-- Декоративный цветок сверху -->
            <div class="baroque-flower scale-75 -mt-4 opacity-60 mb-2"></div>

            <div class="relative mb-10 mt-2">
              <div class="p-1.5 border-2 bg-[#120404] relative shadow-[0_0_20px_rgba(0,0,0,0.5)]" :class="rarityConfig[rarity].border">
                <div class="w-32 h-32 overflow-hidden relative z-10">
                  <img :src="hero.image" :alt="hero.name" class="w-full h-full object-cover object-top" @error="handleImageError" />
                </div>
                
                <div class="acanthus-corner corner-tl -top-2 -left-2"></div>
                <div class="acanthus-corner corner-tr -top-2 -right-2"></div>
                <div class="acanthus-corner corner-bl -bottom-2 -left-2"></div>
                <div class="acanthus-corner corner-br -bottom-2 -right-2"></div>
              </div>

              <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-6 py-1.5 text-xs font-display font-black uppercase tracking-widest shadow-2xl border-2 border-black z-20" :class="rarityConfig[rarity].badge">
                {{ rarityConfig[rarity].label }}
              </div>
            </div>

            <h2 class="font-display text-3xl font-black text-gold-gradient tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-2">
              {{ hero.name }}
            </h2>
            
            <div class="baroque-flower mb-4 opacity-70"></div>

            <div class="flex flex-wrap justify-center gap-2 mb-6">
              <span v-for="role in hero.role" :key="role" class="text-xs px-3 py-1 bg-[#1a0505] text-gold-light border border-gold/40 font-display uppercase tracking-wider shadow-sm">
                {{ role }}
              </span>
            </div>
          </div>

          <!-- Режим 1v1 -->
          <div v-else-if="hero2 && rarity2" class="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full mt-4 mb-8 relative z-10">
            <div class="flex flex-col items-center flex-1">
              <div class="relative mb-10 mt-2">
                <div class="p-1.5 border-2 bg-[#120404] relative shadow-[0_0_20px_rgba(0,0,0,0.5)]" :class="rarityConfig[rarity].border">
                  <div class="w-28 h-28 md:w-32 md:h-32 overflow-hidden relative z-10">
                    <img :src="hero.image" :alt="hero.name" class="w-full h-full object-cover object-top" @error="handleImageError" />
                  </div>
                  <div class="acanthus-corner corner-tl -top-2 -left-2"></div>
                  <div class="acanthus-corner corner-tr -top-2 -right-2"></div>
                  <div class="acanthus-corner corner-bl -bottom-2 -left-2"></div>
                  <div class="acanthus-corner corner-br -bottom-2 -right-2"></div>
                </div>
                <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-display font-black uppercase tracking-widest shadow-xl border-2 border-black whitespace-nowrap z-20" :class="rarityConfig[rarity].badge">
                  {{ rarityConfig[rarity].label }}
                </div>
              </div>
              <h2 class="font-display text-2xl md:text-3xl font-black text-gold-gradient tracking-widest uppercase mb-2 mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {{ hero.name }}
              </h2>
            </div>

            <div class="text-5xl font-display font-black text-gold/30 italic drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]">VS</div>

            <div class="flex flex-col items-center flex-1">
              <div class="relative mb-10 mt-2">
                <div class="p-1.5 border-2 bg-[#120404] relative shadow-[0_0_20px_rgba(0,0,0,0.5)]" :class="rarityConfig[rarity2].border">
                  <div class="w-28 h-28 md:w-32 md:h-32 overflow-hidden relative z-10">
                    <img :src="hero2.image" :alt="hero2.name" class="w-full h-full object-cover object-top" @error="handleImageError" />
                  </div>
                  <div class="acanthus-corner corner-tl -top-2 -left-2"></div>
                  <div class="acanthus-corner corner-tr -top-2 -right-2"></div>
                  <div class="acanthus-corner corner-bl -bottom-2 -left-2"></div>
                  <div class="acanthus-corner corner-br -bottom-2 -right-2"></div>
                </div>
                <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-display font-black uppercase tracking-widest shadow-xl border-2 border-black whitespace-nowrap z-20" :class="rarityConfig[rarity2].badge">
                  {{ rarityConfig[rarity2].label }}
                </div>
              </div>
              <h2 class="font-display text-2xl md:text-3xl font-black text-gold-gradient tracking-widest uppercase mb-2 mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {{ hero2.name }}
              </h2>
            </div>
          </div>

          <!-- Кнопки -->
          <div class="w-full space-y-3 relative z-10 max-w-md mx-auto">
            <!-- Разделитель над кнопками -->
            <div class="flex justify-center w-full mb-2">
              <div class="baroque-divider"></div>
            </div>
            
            <button ref="spinAgainBtnRef" @click="emit('update:open', false); emit('spin-again')" class="w-full py-3.5 font-display font-black text-lg uppercase tracking-widest bg-gradient-to-b from-gold-light via-gold to-gold-dark text-velvet border-2 border-gold-light hover:brightness-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              Перекрутить
            </button>
            <div class="flex gap-3">
              <button @click="copyResult" class="flex-1 py-3 font-display text-sm font-bold uppercase tracking-wider bg-[#1a0505] text-gold border-2 border-gold/40 hover:bg-gold/10 hover:border-gold transition-colors flex items-center justify-center gap-2 focus:outline-none">
                <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                {{ copied ? 'Скопировано' : 'Копировать' }}
              </button>
              <button @click="emit('update:open', false)" class="flex-1 py-3 font-display text-sm font-bold uppercase tracking-wider bg-[#0a0202] text-gold/60 border-2 border-gold/20 hover:text-gold hover:border-gold/50 transition-colors focus:outline-none">
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
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-active .relative, .modal-leave-active .relative { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.9); }
</style>