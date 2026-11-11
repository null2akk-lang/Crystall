import { cases, skinById } from './game'

// Presentation only: do not alter the drop pools, odds or inventory values.
export const sortedCases = [...cases].sort((a, b) => a.price - b.price)
export const caseCovers = new Map<string, string>()
const used = new Set<string>()
let previousValue = 0
for (const box of sortedCases) {
  const target = box.price * (box.group === 'basic' ? 0.25 : 0.7)
  const candidates = box.drops
    .map((drop) => skinById(drop.skin))
    .filter((skin) => !/-(st|souv|coll)$/.test(skin.id))
    .filter((skin) => skin.value >= previousValue)
    .sort((a, b) => Math.abs(a.value - target) - Math.abs(b.value - target))
  const cover = candidates.find((skin) => !used.has(skin.id)) ?? candidates[0]
  if (cover) {
    caseCovers.set(box.id, cover.id)
    used.add(cover.id)
    previousValue = cover.value
  }
}
