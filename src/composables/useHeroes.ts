import { computed, ref } from 'vue'
import type { Hero, HeroesApiResponse } from '../types'

const CACHE_KEY = 'mlbb_heroes_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000

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
      const matchesRole = selectedRole.value === 'all' || hero.role.includes(selectedRole.value)
      const matchesSearch = !query || hero.name.toLowerCase().includes(query)
      return matchesRole && matchesSearch
    })
  })

  async function loadHeroes(forceFetch = false): Promise<void> {
    const url = import.meta.env.VITE_HEROES_API
    if (!url) {
      error.value = 'VITE_HEROES_API не задан в .env'
      return
    }

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
          localStorage.removeItem(CACHE_KEY)
        }
      }
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
      const data = (await response.json()) as HeroesApiResponse

      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }))
      processData(data)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Неизвестная ошибка сети'
    } finally {
      loading.value = false
    }
  }

  function processData(data: HeroesApiResponse) {
    const uniqueMap = new Map<number, Hero>(data.heroes.map((h) => [h.id, h]))
    const uniqueHeroes = Array.from(uniqueMap.values())

    if (uniqueHeroes.length !== data.total) {
      console.warn(`[useHeroes] Санити-чек: уникальных (${uniqueHeroes.length}) != total (${data.total})`)
    }

    heroes.value = uniqueHeroes
    total.value = data.total
  }

  return {
    heroes, total, loading, error, filteredHeroes, allRoles, searchQuery, selectedRole, loadHeroes,
  }
}