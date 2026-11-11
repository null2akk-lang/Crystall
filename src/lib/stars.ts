// Telegram Stars (XTR) crystal packs. Shared by the web app and the Worker, which
// only trusts this list (the client just sends a pack id).
export type StarPack = { id: string; stars: number; crystals: number }

/** Base rate: 150 stars = 25 000 crystals. Bigger packs add a bonus on top. */
export const CRYSTALS_PER_STAR = 25000 / 150

export const STAR_PACKS: readonly StarPack[] = [
  { id: 's50', stars: 50, crystals: 8300 },
  { id: 's150', stars: 150, crystals: 25000 },
  { id: 's300', stars: 300, crystals: 52000 },
  { id: 's750', stars: 750, crystals: 135000 },
  { id: 's1500', stars: 1500, crystals: 280000 },
  { id: 's3000', stars: 3000, crystals: 600000 },
]

export const starPackById = (id: unknown) =>
  STAR_PACKS.find((pack) => pack.id === id)

/** Bonus over the base rate, in whole percent. */
export const packBonus = (pack: StarPack) =>
  Math.max(0, Math.round((pack.crystals / (pack.stars * CRYSTALS_PER_STAR) - 1) * 100))
