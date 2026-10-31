export interface Hero {
  id: number
  name: string
  role: string[]
  image: string
}

export interface HeroesApiResponse {
  total: number
  updated: string
  heroes: Hero[]
}

export type Rarity = 'legendary' | 'epic' | 'rare' | 'common'