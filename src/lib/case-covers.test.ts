import { expect, it } from 'vitest'
import { caseCovers, sortedCases } from './case-covers'
import { skinById } from './game'

it('gives all cases a real drop as artwork, with nondecreasing game values', () => {
  let previous = 0
  for (const box of sortedCases) {
    const id = caseCovers.get(box.id)
    expect(box.drops.some((drop) => drop.skin === id)).toBe(true)
    const skin = skinById(id!)
    expect(skin.value).toBeGreaterThanOrEqual(previous)
    previous = skin.value
  }
  expect(new Set(caseCovers.values()).size).toBe(sortedCases.length)
})
