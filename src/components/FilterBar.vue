<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  roles: string[]
  search: string
  selectedRole: string
  total: number
  shown: number
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:selectedRole': [value: string]
}>()

const search = computed({
  get: () => props.search,
  set: (v) => emit('update:search', v),
})

const selectedRole = computed({
  get: () => props.selectedRole,
  set: (v) => emit('update:selectedRole', v),
})
</script>

<template>
  <div class="mb-8 space-y-4">
    <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="search" type="text" placeholder="Поиск героя по имени…" class="w-full pl-10 pr-4 py-2.5 bg-velvet border border-gold/30 text-gold-light placeholder-gold/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition font-serif text-lg" />
      </div>
      
      <!-- 
        Добавлены классы sm:min-w-[200px], sm:text-right и tabular-nums. 
        Теперь блок имеет фиксированную ширину на десктопе и не прыгает.
      -->
      <div class="text-sm font-display text-gold/60 shrink-0 uppercase tracking-widest sm:min-w-[200px] sm:text-right tabular-nums">
        Найдено: <span class="text-gold font-bold">{{ shown }}</span> из <span class="text-gold-light">{{ total }}</span>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        :class="[
          'px-4 py-1.5 text-xs font-display font-bold uppercase tracking-widest border transition-all',
          selectedRole === 'all'
            ? 'bg-gold text-velvet border-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
            : 'bg-velvet text-gold/60 border-gold/30 hover:border-gold hover:text-gold',
        ]"
        @click="selectedRole = 'all'"
      >
        Все
      </button>
      <button
        v-for="role in roles"
        :key="role"
        :class="[
          'px-4 py-1.5 text-xs font-display font-bold uppercase tracking-widest border transition-all',
          selectedRole === role
            ? 'bg-gold text-velvet border-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
            : 'bg-velvet text-gold/60 border-gold/30 hover:border-gold hover:text-gold',
        ]"
        @click="selectedRole = role"
      >
        {{ role }}
      </button>
    </div>
  </div>
</template>