import { computed, ref } from 'vue'
import type { Hero, HeroesApiResponse } from '../types'

const CACHE_KEY = 'mlbb_heroes_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 часа

export function useHeroes() {
  const heroes = ref<Hero[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const searchQuery = ref('')
  const selectedRole = ref<string>('all')

  const allRoles = computed(() => {
    const set = new Set<string>()
    for (const hero of heroes.value) {
      for (const role of hero.role) set.add(role)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  })

  const filteredHeroes = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    return heroes.value.filter((hero) => {
      const matchesRole =
        selectedRole.value === 'all' || hero.role.includes(selectedRole.value)
      const matchesSearch = !query || hero.name.toLowerCase().includes(query)
      return matchesRole && matchesSearch
    })
  })

  async function loadHeroes(forceFetch = false): Promise<void> {
    // Добавлен фоллбэк на случай, если .env не загрузился на GitHub Pages
    const url = import.meta.env.VITE_HEROES_API || `${import.meta.env.BASE_URL}heroes.json`

    // 1. Проверка кэша
    if (!forceFetch) {
      const cachedStr = localStorage.getItem(CACHE_KEY)
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr)
          if (Date.now() - cached.timestamp < CACHE_TTL) {
            processData(cached.data)
            return
          }
        } catch (e) {
          console.warn('Ошибка чтения кэша, запрашиваем API заново', e)
          localStorage.removeItem(CACHE_KEY)
        }
      }
    }

    // 2. Запрос к API
    loading.value = true
    error.value = null

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      const data = (await response.json()) as HeroesApiResponse

      // Сохраняем в кэш
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data
      }))

      processData(data)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Неизвестная ошибка сети'
    } finally {
      loading.value = false
    }
  } // <--- ЗДЕСЬ БЫЛА ПРОПУЩЕНА СКОБКА

  function processData(data: HeroesApiResponse) {
    // Защитная дедупликация
    const uniqueMap = new Map<number, Hero>(
      data.heroes.map((h) => [h.id, h]),
    )
    const uniqueHeroes = Array.from(uniqueMap.values())

    // Санити-чек
    if (uniqueHeroes.length !== data.total) {
      console.warn(
        `[useHeroes] Санити-чек: количество уникальных героев (${uniqueHeroes.length}) не совпадает с total из API (${data.total})`,
      )
    }

    heroes.value = uniqueHeroes
    total.value = data.total
  }

  return {
    heroes,
    total,
    loading,
    error,
    filteredHeroes,
    allRoles,
    searchQuery,
    selectedRole,
    loadHeroes,
  }
}