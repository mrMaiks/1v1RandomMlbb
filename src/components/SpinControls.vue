<script setup lang="ts">
defineProps<{
  spinning: boolean
  poolSize: number
  sourceMode: 'all' | 'filtered'
}>()

const emit = defineEmits<{
  spin: []
  'update:sourceMode': ['all' | 'filtered']
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
    
    <!-- Индикатор пула и режимы -->
    <div class="flex items-center gap-4 w-full sm:w-auto">
      <div class="text-sm font-medium text-slate-400">
        В пуле: <span class="text-fuchsia-400 font-bold">{{ poolSize }}</span>
      </div>
      <div class="h-6 w-px bg-slate-700 hidden sm:block"></div>
      <div class="flex gap-2">
        <button
          :disabled="spinning"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
            sourceMode === 'all'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800',
            spinning ? 'opacity-50 cursor-not-allowed' : ''
          ]"
          @click="emit('update:sourceMode', 'all')"
        >
          Все герои
        </button>
        <button
          :disabled="spinning"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
            sourceMode === 'filtered'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800',
            spinning ? 'opacity-50 cursor-not-allowed' : ''
          ]"
          @click="emit('update:sourceMode', 'filtered')"
        >
          По фильтрам
        </button>
      </div>
    </div>

    <button
      :disabled="spinning || poolSize === 0"
      class="btn-pulse group relative w-full sm:w-auto px-10 py-4 rounded-xl font-display font-extrabold text-lg tracking-wide text-white transition-all duration-300 overflow-hidden
             bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400
             shadow-[0_0_20px_rgba(236,72,153,0.4)]
             hover:scale-105 hover:shadow-[0_0_40px_rgba(236,72,153,0.7)]
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]
             active:scale-95"
      @click="emit('spin')"
    >
      <span class="relative z-10 flex items-center justify-center gap-2">
        <svg v-if="spinning" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span v-else>Крутить</span>
      </span>
    </button>
  </div>
</template>