import type { Hero, Rarity } from '../types'

const LEGENDARY_COMBOS: readonly (readonly string[])[] = [
  ['Tank', 'Support'],
  ['Assassin', 'Mage'],
  ['Marksman', 'Mage'],
]

const RARE_SINGLE = new Set(['Assassin', 'Marksman', 'Mage'])
const COMMON_SINGLE = new Set(['Tank', 'Fighter', 'Support'])

function isSameCombo(roles: string[], combo: readonly string[]): boolean {
  if (roles.length !== combo.length) return false
  const a = [...roles].sort()
  const b = [...combo].sort()
  return a.every((role, i) => role === b[i])
}

/**
 * Определяет редкость героя по комбинации ролей.
 * Легендарки — строгие пары, эпики — любые другие пары и более,
 * рарки/коммоны — одиночные роли.
 */
export function getRarity(hero: Hero): Rarity {
  const roles = hero.role

  if (roles.length >= 2) {
    for (const combo of LEGENDARY_COMBOS) {
      if (isSameCombo(roles, combo)) return 'legendary'
    }
    return 'epic'
  }

  if (roles.length === 1) {
    if (RARE_SINGLE.has(roles[0])) return 'rare'
    if (COMMON_SINGLE.has(roles[0])) return 'common'
  }

  return 'common'
}

export function useRarity() {
  return { getRarity }
}