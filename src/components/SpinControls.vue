<script setup lang="ts">
defineProps<{
  spinning: boolean
  poolSize: number
  sourceMode: 'all' | 'filtered'
  isDoubleMode: boolean
}>()

const emit = defineEmits<{
  spin: []
  'update:sourceMode': [value: 'all' | 'filtered']
  'update:isDoubleMode': [value: boolean]
}>()
</script>

<template>
  <!-- Обертка fixed bottom-0 -->
  <div class="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
    <div class="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      
      <!-- Левая часть: Счетчик и Режимы -->
      <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
        <!-- Счетчик -->
        <div class="text-xs sm:text-sm font-medium text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
          В пуле: <span class="text-fuchsia-400 font-bold ml-1">{{ poolSize }}</span>
        </div>
        
        <!-- Переключатели пула -->
        <div class="flex bg-slate-900/50 rounded-lg border border-slate-700/50 p-1">
          <button
            :disabled="spinning"
            :class="[
              'px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all duration-200',
              sourceMode === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
            ]"
            @click="emit('update:sourceMode', 'all')"
          >
            Все герои
          </button>
          <button
            :disabled="spinning"
            :class="[
              'px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all duration-200',
              sourceMode === 'filtered' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
            ]"
            @click="emit('update:sourceMode', 'filtered')"
          >
            По фильтрам
          </button>
        </div>

        <!-- Переключатель 1v1 -->
        <button
          :disabled="spinning"
          :class="[
            'px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 uppercase tracking-wider border',
            isDoubleMode 
              ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 shadow-[0_0_15px_rgba(232,121,249,0.2)]' 
              : 'bg-slate-900/50 text-slate-500 border-slate-700/50 hover:text-slate-300',
          ]"
          @click="emit('update:isDoubleMode', !isDoubleMode)"
        >
          1v1
        </button>
      </div>

      <!-- Правая часть: Кнопка -->
      <button
        :disabled="spinning || poolSize === 0"
        class="btn-pulse group relative w-full md:w-auto px-12 py-3.5 rounded-xl font-display font-extrabold text-lg tracking-wide text-white transition-all duration-300 overflow-hidden
               bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400
               shadow-[0_0_20px_rgba(236,72,153,0.3)]
               hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]
               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]
               active:scale-95"
        @click="emit('spin')"
      >
        <span class="relative z-10 flex items-center justify-center gap-2">
          <svg v-if="spinning" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span v-else>{{ isDoubleMode ? 'Крутить 1v1' : 'Крутить' }}</span>
        </span>
      </button>
    </div>
  </div>
</template>