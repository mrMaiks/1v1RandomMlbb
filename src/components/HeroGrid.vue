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
  legendary: { ring: 'ring-2 ring-fuchsia-400/80', badge: 'bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white', label: 'Legendary', glow: 'hover:shadow-[0_0_35px_rgba(232,121,249,0.5)]' },
  epic: { ring: 'ring-2 ring-purple-500/70', badge: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white', label: 'Epic', glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]' },
  rare: { ring: 'ring-2 ring-sky-500/70', badge: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white', label: 'Rare', glow: 'hover:shadow-[0_0_25px_rgba(56,189,248,0.4)]' },
  common: { ring: 'ring-1 ring-slate-600/70', badge: 'bg-slate-700 text-slate-200', label: 'Common', glow: 'hover:shadow-[0_0_20px_rgba(100,116,139,0.3)]' },
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
        <div v-for="i in 16" :key="i" class="aspect-square rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 animate-pulse" />
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="error" class="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 flex flex-col items-center justify-center text-center gap-4">
        <div>
          <p class="text-red-300 font-semibold text-lg">Не удалось загрузить героев</p>
          <p class="text-sm text-red-200/70 mt-1">{{ error }}</p>
        </div>
        <button @click="emit('retry')" class="px-6 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 transition-colors font-medium text-sm">
          Повторить попытку
        </button>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="!loading && !error && !items.length" class="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-10 text-center">
        <p class="text-slate-400">Герои не найдены</p>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="!loading && !error && items.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
        <article
          v-for="{ hero, style, isBanned } in items"
          :key="hero.id"
          @click="emit('toggle-ban', hero.id)"
          :class="[
            'group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300',
            'bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/50',
            isBanned ? 'opacity-40 grayscale scale-95 border-red-500/30' : ['hover:-translate-y-1 hover:border-purple-500/60', style.glow]
          ]"
        >
          <div :class="['relative aspect-square overflow-hidden', !isBanned && style.ring]">
            <img :src="hero.image" :alt="hero.name" loading="lazy" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" @error="handleImageError" />
            
            <div class="absolute inset-0 bg-slate-950/80 flex flex-col justify-center items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none p-2">
              <span v-for="role in hero.role" :key="role" class="text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-800 text-purple-300 border border-purple-500/30">
                {{ role }}
              </span>
            </div>

            <div v-if="isBanned" class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <svg class="w-10 h-10 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>

            <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pt-6 z-10 pointer-events-none">
              <h3 class="font-display font-bold text-white text-[11px] sm:text-xs truncate">{{ hero.name }}</h3>
            </div>
            
            <span :class="['absolute top-1.5 right-1.5 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md z-10 pointer-events-none', style.badge]">
              {{ style.label }}
            </span>
          </div>
        </article>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>