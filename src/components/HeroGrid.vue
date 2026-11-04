<script setup lang="ts">
import { computed } from 'vue'
import type { Hero, Rarity } from '../types'
import { getRarity } from '../composables/useRarity'

const props = defineProps<{
  heroes: Hero[]
  loading: boolean
  error: string | null
  bannedIds: number[]
}>()

const emit = defineEmits<{
  'toggle-ban': [id: number]
  'retry': []
}>()

interface RarityStyle {
  ring: string
  badge: string
  label: string
  glow: string
}

const rarityStyles: Record<Rarity, RarityStyle> = {
  legendary: { ring: 'border-red-600 shadow-[inset_0_0_15px_rgba(239,68,68,0.3)]', badge: 'bg-red-600 text-white', label: 'Legendary', glow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]' },
  epic: { ring: 'border-pink-600 shadow-[inset_0_0_15px_rgba(236,72,153,0.3)]', badge: 'bg-pink-600 text-white', label: 'Epic', glow: 'hover:shadow-[0_0_25px_rgba(236,72,153,0.4)]' },
  rare: { ring: 'border-purple-600 shadow-[inset_0_0_15px_rgba(147,51,234,0.3)]', badge: 'bg-purple-600 text-white', label: 'Rare', glow: 'hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]' },
  common: { ring: 'border-blue-600 shadow-[inset_0_0_15px_rgba(37,99,235,0.3)]', badge: 'bg-blue-600 text-white', label: 'Common', glow: 'hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]' },
}

const items = computed(() =>
  props.heroes.map((hero) => {
    const rarity = getRarity(hero)
    const isBanned = props.bannedIds.includes(hero.id)
    return { hero, style: rarityStyles[rarity], isBanned }
  }),
)

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/placeholder.png'
}
</script>

<template>
  <section class="relative">
    <Transition name="fade">
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
        <div v-for="i in 16" :key="i" class="aspect-square rounded-sm bg-velvet-light/30 border border-gold/10 animate-pulse" />
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="error" class="rounded-sm border border-red-500/40 bg-red-900/20 p-8 flex flex-col items-center justify-center text-center gap-4">
        <div>
          <p class="text-red-400 font-display font-bold text-lg uppercase tracking-wider">Ошибка загрузки</p>
          <p class="text-sm text-red-300/70 mt-1 font-serif">{{ error }}</p>
        </div>
        <button @click="emit('retry')" class="px-6 py-2 rounded-sm bg-velvet border border-red-500/50 text-red-300 hover:bg-red-900/30 transition-colors font-display uppercase tracking-widest text-xs">
          Повторить
        </button>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="!loading && !error && !items.length" class="rounded-sm border border-gold/20 bg-velvet/50 p-12 text-center">
        <p class="text-gold/60 font-serif italic text-lg">Герои не найдены</p>
      </div>
    </Transition>

    <TransitionGroup 
      v-if="!loading && !error && items.length" 
      tag="div"
      name="grid"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 relative [overflow-anchor:none]"
    >
      <article
        v-for="{ hero, style, isBanned } in items"
        :key="hero.id"
        @click="emit('toggle-ban', hero.id)"
        :class="[
          'group relative rounded-sm overflow-hidden cursor-pointer transition-all duration-300 card-double-border',
          'bg-velvet-light/20',
          isBanned ? 'opacity-30 grayscale scale-95 border-red-900' : ['hover:-translate-y-1', style.glow]
        ]"
      >
        <!-- Уголки лозы при наведении -->
        <div class="vine-corner vine-tl opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75"></div>
        <div class="vine-corner vine-tr opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75"></div>
        <div class="vine-corner vine-bl opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75"></div>
        <div class="vine-corner vine-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75"></div>

        <!-- Рамка редкости -->
        <div :class="['relative aspect-square overflow-hidden border-2', style.ring]">
          <img :src="hero.image" :alt="hero.name" loading="lazy" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0" @error="handleImageError" />
          
          <div class="absolute inset-0 bg-velvet-dark/80 flex flex-col justify-center items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none p-2 backdrop-blur-sm">
            <span v-for="role in hero.role" :key="role" class="text-[10px] sm:text-xs font-display font-bold px-3 py-1 rounded-sm bg-velvet border border-gold/30 text-gold-light uppercase tracking-widest">
              {{ role }}
            </span>
          </div>

          <div v-if="isBanned" class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <svg class="w-10 h-10 text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>

          <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 z-10 pointer-events-none">
            <h3 class="font-display font-black text-gold-light text-[11px] sm:text-xs truncate tracking-wider uppercase [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]">
              {{ hero.name }}
            </h3>
          </div>
          
          <span :class="['absolute top-1.5 right-1.5 text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 z-10 pointer-events-none border border-black/50', style.badge]">
            {{ style.label }}
          </span>
        </div>
      </article>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.grid-move { transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1); }
.grid-enter-active, .grid-leave-active { transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
.grid-leave-active {
  position: absolute; z-index: 0; width: calc(50% - 0.375rem);
}
@media (min-width: 640px) { .grid-leave-active { width: calc(33.333% - 0.66rem); } }
@media (min-width: 768px) { .grid-leave-active { width: calc(25% - 0.75rem); } }
@media (min-width: 1024px) { .grid-leave-active { width: calc(16.666% - 0.83rem); } }
@media (min-width: 1280px) { .grid-leave-active { width: calc(12.5% - 0.875rem); } }
.grid-enter-from, .grid-leave-to { opacity: 0; transform: scale(0.8) translateY(10px); }
</style>