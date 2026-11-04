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
  <div class="fixed bottom-0 left-0 right-0 z-40 bg-velvet-dark/95 backdrop-blur-xl border-t-2 border-gold/40 p-4 shadow-[0_-10px_50px_rgba(212,175,55,0.15)]">
    
    <!-- Декор нижней панели (свитки по краям) -->
    <div class="absolute top-0 left-4 -translate-y-1/2 text-gold/50">
      <svg class="w-8 h-4" viewBox="0 0 50 20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M0 10 C 15 10, 20 0, 35 0 C 45 0, 50 10, 50 10 C 50 10, 45 20, 35 20 C 20 20, 15 10, 0 10 Z" fill="#1a0505" />
        <circle cx="15" cy="10" r="2" fill="currentColor"/>
      </svg>
    </div>
    <div class="absolute top-0 right-4 -translate-y-1/2 text-gold/50 scale-x-[-1]">
      <svg class="w-8 h-4" viewBox="0 0 50 20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M0 10 C 15 10, 20 0, 35 0 C 45 0, 50 10, 50 10 C 50 10, 45 20, 35 20 C 20 20, 15 10, 0 10 Z" fill="#1a0505" />
        <circle cx="15" cy="10" r="2" fill="currentColor"/>
      </svg>
    </div>

    <div class="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      
      <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
        <div class="text-xs font-display uppercase tracking-widest text-gold/60 border border-gold/30 px-3 py-1.5 bg-velvet">
          В пуле: <span class="text-gold font-bold ml-1">{{ poolSize }}</span>
        </div>
        
        <div class="flex bg-velvet border border-gold/30 p-1">
          <button
            :disabled="spinning"
            :class="[
              'px-4 py-1.5 text-xs font-display uppercase tracking-widest transition-all duration-200',
              sourceMode === 'all' ? 'bg-gold text-velvet font-bold' : 'text-gold/60 hover:text-gold',
            ]"
            @click="emit('update:sourceMode', 'all')"
          >
            Все
          </button>
          <button
            :disabled="spinning"
            :class="[
              'px-4 py-1.5 text-xs font-display uppercase tracking-widest transition-all duration-200',
              sourceMode === 'filtered' ? 'bg-gold text-velvet font-bold' : 'text-gold/60 hover:text-gold',
            ]"
            @click="emit('update:sourceMode', 'filtered')"
          >
            По фильтрам
          </button>
        </div>

        <button
          :disabled="spinning"
          :class="[
            'px-4 py-1.5 border text-xs font-display font-bold uppercase tracking-widest transition-all duration-200',
            isDoubleMode 
              ? 'bg-gold-light text-velvet border-gold-light shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
              : 'bg-velvet text-gold/60 border-gold/30 hover:text-gold',
          ]"
          @click="emit('update:isDoubleMode', !isDoubleMode)"
        >
          1v1
        </button>
      </div>

      <button
        :disabled="spinning || poolSize === 0"
        class="btn-pulse relative group w-full md:w-auto px-14 py-4 font-display font-black text-xl tracking-[0.2em] uppercase transition-all duration-300
               bg-gradient-to-b from-gold-light via-gold to-gold-dark
               text-velvet shadow-[0_0_20px_rgba(212,175,55,0.3)]
               hover:shadow-[0_0_50px_rgba(212,175,55,0.7)] hover:brightness-110
               disabled:opacity-50 disabled:grayscale
               border-2 border-gold-light"
        @click="emit('spin')"
      >
        <div class="acanthus-corner corner-tl opacity-60 mix-blend-multiply"></div>
        <div class="acanthus-corner corner-tr opacity-60 mix-blend-multiply"></div>
        <div class="acanthus-corner corner-bl opacity-60 mix-blend-multiply"></div>
        <div class="acanthus-corner corner-br opacity-60 mix-blend-multiply"></div>

        <span class="relative z-10 flex items-center justify-center gap-2">
          <svg v-if="spinning" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <!-- ИЗМЕНЕННЫЙ ТЕКСТ КНОПКИ -->
          <span v-else>{{ isDoubleMode ? 'Дуэль' : 'Крутить' }}</span>
        </span>
      </button>
    </div>
  </div>
</template>