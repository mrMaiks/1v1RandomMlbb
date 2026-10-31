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
  <div class="mb-6 space-y-4">
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="search" type="text" placeholder="Поиск героя по имени…" class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition" />
      </div>
      <div class="text-sm text-slate-400 shrink-0">
        Отфильтровано: <span class="text-purple-300 font-semibold">{{ shown }}</span> из <span class="text-slate-200 font-semibold">{{ total }}</span>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        :class="[
          'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all',
          selectedRole === 'all'
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-[0_0_15px_rgba(168,85,247,0.4)]'
            : 'bg-slate-900/60 text-slate-300 border-slate-700/60 hover:border-purple-500/50 hover:text-white',
        ]"
        @click="selectedRole = 'all'"
      >
        Все
      </button>
      <button
        v-for="role in roles"
        :key="role"
        :class="[
          'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all',
          selectedRole === role
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-[0_0_15px_rgba(168,85,247,0.4)]'
            : 'bg-slate-900/60 text-slate-300 border-slate-700/60 hover:border-purple-500/50 hover:text-white',
        ]"
        @click="selectedRole = role"
      >
        {{ role }}
      </button>
    </div>
  </div>
</template>