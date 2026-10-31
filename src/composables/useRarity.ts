import type { Hero, Rarity } from '../types'

const LEGENDARY_COMBOS = [
  ['Tank', 'Support'],
  ['Assassin', 'Mage'],
  ['Marksman', 'Mage'],
]

const RARE_SINGLE = new Set(['Assassin', 'Marksman', 'Mage'])
const COMMON_SINGLE = new Set(['Tank', 'Fighter', 'Support'])

export function getRarity(hero: Hero): Rarity {
  const roles = hero.role

  if (roles.length >= 2) {
    for (const combo of LEGENDARY_COMBOS) {
      if (
        roles.length === combo.length &&
        [...roles].sort().every((r, i) => r === [...combo].sort()[i])
      ) {
        return 'legendary'
      }
    }
    return 'epic'
  }

  if (roles.length === 1) {
    if (RARE_SINGLE.has(roles[0])) return 'rare'
    if (COMMON_SINGLE.has(roles[0])) return 'common'
  }

  return 'common'
}