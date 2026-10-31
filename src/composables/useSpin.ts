import type { Hero } from '../types'

export function useSpin() {
  function spin(pool: Hero[], lastWinnerId?: number | null): { reel: Hero[], winnerIndex: number } {
    if (!pool || pool.length === 0) {
      return { reel: [], winnerIndex: -1 }
    }

    let availablePool = pool
    if (lastWinnerId != null && pool.length > 1) {
      availablePool = pool.filter(h => h.id !== lastWinnerId)
    }

    const winner = availablePool[Math.floor(Math.random() * availablePool.length)]
    const reelLength = 60
    const reel: Hero[] = []
    
    for (let i = 0; i < reelLength; i++) {
      reel.push(pool[Math.floor(Math.random() * pool.length)])
    }

    const winnerIndex = reelLength - 5
    reel[winnerIndex] = winner

    return { reel, winnerIndex }
  }

  return { spin }
}