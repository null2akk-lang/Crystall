import { skinCatalog } from './skin-catalog'
import { crystalValueFor } from './skin-prices'

const baseSkins = [
  {
    id: 'slate',
    image: '/skins/slate.webp',
    name: 'Slate',
    weapon: 'AK-47',
    value: 120,
    rarity: 'common',
    color: '#91a8be',
  },
  {
    id: 'arctic',
    image: '/skins/arctic.webp',
    name: 'Decimator',
    weapon: 'M4A1-S',
    value: 280,
    rarity: 'rare',
    color: '#6caeff',
  },
  {
    id: 'toxic',
    image: '/skins/toxic.webp',
    name: 'Monster Mashup',
    weapon: 'USP-S',
    value: 650,
    rarity: 'rare',
    color: '#a2d85a',
  },
  {
    id: 'pulse',
    image: '/skins/pulse.webp',
    name: 'Neo-Noir',
    weapon: 'AWP',
    value: 1400,
    rarity: 'epic',
    color: '#ba8cf5',
  },
  {
    id: 'ember',
    image: '/skins/ember.webp',
    name: 'Redline',
    weapon: 'AK-47',
    value: 3200,
    rarity: 'epic',
    color: '#f16c72',
  },
  {
    id: 'fade',
    image: '/skins/fade.webp',
    name: 'Fade',
    weapon: 'M4A1-S',
    value: 7500,
    rarity: 'legendary',
    color: '#f2bd69',
  },
  {
    knife: true,
    id: 'karambit',
    image: '/skins/karambit.webp',
    name: 'Doppler',
    weapon: 'Karambit',
    value: 16000,
    rarity: 'legendary',
    color: '#d4a3ff',
  },

  {
    id: 'cs2-skin-8f578bc8c6ef',
    image: '/skins/skin-8f578bc8c6ef.webp',
    name: 'Sand Dune',
    weapon: 'P250',
    value: 15,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-7f5e06a2c68c',
    image: '/skins/skin-7f5e06a2c68c.webp',
    name: 'Sand Dune',
    weapon: 'Nova',
    value: 20,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-dfd5859c02ae',
    image: '/skins/skin-dfd5859c02ae.webp',
    name: 'Sand Dashed',
    weapon: 'MP9',
    value: 25,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-319e3413b40b',
    image: '/skins/skin-319e3413b40b.webp',
    name: 'Death Rattle',
    weapon: 'Glock-18',
    value: 30,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-d4dd8527d3b1',
    image: '/skins/skin-d4dd8527d3b1.webp',
    name: 'Forest Night',
    weapon: 'Five-SeveN',
    value: 35,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-9971505b1e6e',
    image: '/skins/skin-9971505b1e6e.webp',
    name: 'Army Sheen',
    weapon: 'SG 553',
    value: 40,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-e68259d80f02',
    image: '/skins/skin-e68259d80f02.webp',
    name: 'Contractor',
    weapon: 'SCAR-20',
    value: 45,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-bdbf47639811',
    image: '/skins/skin-bdbf47639811.webp',
    name: 'Desert Storm',
    weapon: 'G3SG1',
    value: 50,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-484fe1d0665e',
    image: '/skins/skin-484fe1d0665e.webp',
    name: 'Sand Dashed',
    weapon: 'PP-Bizon',
    value: 55,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-7cc934394691',
    image: '/skins/skin-7cc934394691.webp',
    name: 'Rust Coat',
    weapon: 'MAG-7',
    value: 60,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-e34d4776c3fa',
    image: '/skins/skin-e34d4776c3fa.webp',
    name: 'Forest DDPAT',
    weapon: 'Sawed-Off',
    value: 65,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-99e9ef5072fe',
    image: '/skins/skin-99e9ef5072fe.webp',
    name: 'Urban DDPAT',
    weapon: 'UMP-45',
    value: 70,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-034dafc33fbe',
    image: '/skins/skin-034dafc33fbe.webp',
    name: 'Sand Spray',
    weapon: 'P90',
    value: 80,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-47412dd518bb',
    image: '/skins/skin-47412dd518bb.webp',
    name: 'Silver',
    weapon: 'MAC-10',
    value: 95,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-7698ea25d00a',
    image: '/skins/skin-7698ea25d00a.webp',
    name: 'Bronze Deco',
    weapon: 'Desert Eagle',
    value: 110,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-82e19c21d6d0',
    image: '/skins/skin-82e19c21d6d0.webp',
    name: 'Ice Cap',
    weapon: 'Tec-9',
    value: 140,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-3903899a4282',
    image: '/skins/skin-3903899a4282.webp',
    name: 'Oceanic',
    weapon: 'P2000',
    value: 170,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-df49957ef56b',
    image: '/skins/skin-df49957ef56b.webp',
    name: 'Cirrus',
    weapon: 'MP7',
    value: 210,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-4a4571ce6fe7',
    image: '/skins/skin-4a4571ce6fe7.webp',
    name: 'Survivor Z',
    weapon: 'FAMAS',
    value: 250,
    rarity: 'common',
    color: '#91a8be',
    knife: false,
  },
  {
    id: 'cs2-skin-8ba4193b0479',
    image: '/skins/skin-8ba4193b0479.webp',
    name: 'Rocket Pop',
    weapon: 'Galil AR',
    value: 300,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-ded653e7bd24',
    image: '/skins/skin-ded653e7bd24.webp',
    name: 'Abyss',
    weapon: 'SSG 08',
    value: 360,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-52971a3886a2',
    image: '/skins/skin-52971a3886a2.webp',
    name: 'Moonrise',
    weapon: 'Glock-18',
    value: 430,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-b10fdec34656',
    image: '/skins/skin-b10fdec34656.webp',
    name: 'Asiimov',
    weapon: 'P250',
    value: 550,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-b2a5203033ee',
    image: '/skins/skin-b2a5203033ee.webp',
    name: 'Monkey Business',
    weapon: 'Five-SeveN',
    value: 700,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-ec1689ee3e4c',
    image: '/skins/skin-ec1689ee3e4c.webp',
    name: 'Conspiracy',
    weapon: 'Desert Eagle',
    value: 850,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-b587b6dd9b9b',
    image: '/skins/skin-b587b6dd9b9b.webp',
    name: 'Evil Daimyo',
    weapon: 'M4A4',
    value: 1000,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-ea4e27f0cd16',
    image: '/skins/skin-ea4e27f0cd16.webp',
    name: 'Elite Build',
    weapon: 'AK-47',
    value: 1250,
    rarity: 'rare',
    color: '#6caeff',
    knife: false,
  },
  {
    id: 'cs2-skin-d6cf8565026b',
    image: '/skins/skin-d6cf8565026b.webp',
    name: 'Atheris',
    weapon: 'AWP',
    value: 1600,
    rarity: 'epic',
    color: '#ba8cf5',
    knife: false,
  },
  {
    id: 'cs2-skin-3901933d5e47',
    image: '/skins/skin-3901933d5e47.webp',
    name: 'Cortex',
    weapon: 'USP-S',
    value: 2000,
    rarity: 'epic',
    color: '#ba8cf5',
    knife: false,
  },
  {
    id: 'cs2-skin-e8144faeae9f',
    image: '/skins/skin-e8144faeae9f.webp',
    name: 'Neo-Noir',
    weapon: 'M4A4',
    value: 2600,
    rarity: 'epic',
    color: '#ba8cf5',
    knife: false,
  },
  {
    id: 'cs2-skin-1e9f98a04b79',
    image: '/skins/skin-1e9f98a04b79.webp',
    name: 'Frontside Misty',
    weapon: 'AK-47',
    value: 3500,
    rarity: 'epic',
    color: '#ba8cf5',
    knife: false,
  },
  {
    id: 'cs2-skin-bb633c21fc25',
    image: '/skins/skin-bb633c21fc25.webp',
    name: 'Asiimov',
    weapon: 'AWP',
    value: 4800,
    rarity: 'epic',
    color: '#ba8cf5',
    knife: false,
  },
  {
    id: 'cs2-skin-1b3ca668024e',
    image: '/skins/skin-1b3ca668024e.webp',
    name: 'The Empress',
    weapon: 'AK-47',
    value: 6200,
    rarity: 'epic',
    color: '#ba8cf5',
    knife: false,
  },
  {
    id: 'cs2-skin-8e45a15cf7f5',
    image: '/skins/skin-8e45a15cf7f5.webp',
    name: 'Printstream',
    weapon: 'M4A1-S',
    value: 9000,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: false,
  },
  {
    id: 'cs2-skin-4f8d99d09ded',
    image: '/skins/skin-4f8d99d09ded.webp',
    name: 'Dragon Lore',
    weapon: 'AWP',
    value: 14000,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: false,
  },
  {
    id: 'cs2-skin-95831ce7c492',
    image: '/skins/skin-95831ce7c492.webp',
    name: 'Fade',
    weapon: 'Bayonet',
    value: 12000,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
  {
    id: 'cs2-skin-eae7c10fa54f',
    image: '/skins/skin-eae7c10fa54f.webp',
    name: 'Slaughter',
    weapon: 'Butterfly Knife',
    value: 14500,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
  {
    id: 'cs2-skin-3bc3ff53883a',
    image: '/skins/skin-3bc3ff53883a.webp',
    name: 'Tiger Tooth',
    weapon: 'M9 Bayonet',
    value: 17000,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
  {
    id: 'cs2-skin-90511e74f417',
    image: '/skins/skin-90511e74f417.webp',
    name: 'Doppler',
    weapon: 'Flip Knife',
    value: 19500,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
  {
    id: 'cs2-skin-a5ee841493d7',
    image: '/skins/skin-a5ee841493d7.webp',
    name: 'Marble Fade',
    weapon: 'Gut Knife',
    value: 22000,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
  {
    id: 'cs2-skin-243a437e4586',
    image: '/skins/skin-243a437e4586.webp',
    name: 'Tiger Tooth',
    weapon: 'Huntsman Knife',
    value: 24500,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
  {
    id: 'cs2-skin-9309cf0662b7',
    image: '/skins/skin-9309cf0662b7.webp',
    name: 'Crimson Web',
    weapon: 'Bowie Knife',
    value: 27000,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
  {
    id: 'cs2-skin-eb63179edd1a',
    image: '/skins/skin-eb63179edd1a.webp',
    name: 'Fade',
    weapon: 'Falchion Knife',
    value: 29500,
    rarity: 'legendary',
    color: '#e8bd75',
    knife: true,
  },
] as const

export type Skin = {
  id: string
  image: string
  name: string
  weapon: string
  value: number
  rarity: string
  color: string
  knife?: boolean
  glove?: boolean
  charm?: boolean
}

const rarityColor = {
  common: '#91a8be',
  rare: '#6caeff',
  epic: '#ba8cf5',
  legendary: '#f2bd69',
}
const rarityFor = (value: number) =>
  value >= 7000
    ? 'legendary'
    : value >= 1500
      ? 'epic'
      : value >= 300
        ? 'rare'
        : 'common'

const findBase = (weapon: string, name: string) => {
  const s = baseSkins.find((b) => b.weapon === weapon && b.name === name)
  if (!s) throw new Error(`Missing base skin ${weapon} ${name}`)
  return s as Skin
}
const labels = {
  st: 'StatTrak™',
  souv: 'Сувенирный',
  coll: 'Коллекционный',
}
/** A pricier edition of an existing skin (same render, new id and value). */
const edition = (
  weapon: string,
  name: string,
  kind: keyof typeof labels,
  value: number,
): Skin => {
  const base = findBase(weapon, name)
  const rarity = rarityFor(value)
  return {
    id: `${base.id}-${kind}`,
    image: base.image,
    name: `${base.name} (${labels[kind]})`,
    weapon: base.weapon,
    value,
    rarity,
    color: base.knife
      ? base.color
      : rarityColor[rarity as keyof typeof rarityColor],
    knife: base.knife,
  }
}
const glove = (
  slug: string,
  weapon: string,
  name: string,
  value: number,
  color: string,
): Skin => ({
  id: `glove-${slug}`,
  image: skinCatalog.find(
    (skin) => skin.weapon === weapon && skin.name === name,
  )!.image,
  name,
  weapon,
  value,
  rarity: 'legendary',
  color,
  glove: true,
})

const extraSkins: Skin[] = [
  // AK-47
  edition('AK-47', 'Redline', 'st', 9500),
  edition('AK-47', 'Frontside Misty', 'st', 12000),
  edition('AK-47', 'The Empress', 'st', 22000),
  edition('AK-47', 'Redline', 'souv', 38000),
  edition('AK-47', 'The Empress', 'souv', 85000),
  edition('AK-47', 'The Empress', 'coll', 210000),
  edition('AK-47', 'Redline', 'coll', 140000),
  edition('AK-47', 'Frontside Misty', 'coll', 320000),
  // AWP
  edition('AWP', 'Neo-Noir', 'st', 5000),
  edition('AWP', 'Atheris', 'st', 6500),
  edition('AWP', 'Asiimov', 'st', 13000),
  edition('AWP', 'Asiimov', 'souv', 40000),
  edition('AWP', 'Dragon Lore', 'st', 48000),
  edition('AWP', 'Dragon Lore', 'coll', 260000),
  edition('AWP', 'Dragon Lore', 'souv', 900000),
  // USP-S
  edition('USP-S', 'Monster Mashup', 'st', 2400),
  edition('USP-S', 'Cortex', 'st', 6500),
  edition('USP-S', 'Monster Mashup', 'souv', 11000),
  edition('USP-S', 'Cortex', 'souv', 32000),
  edition('USP-S', 'Cortex', 'coll', 85000),
  // Desert Eagle
  edition('Desert Eagle', 'Bronze Deco', 'st', 450),
  edition('Desert Eagle', 'Conspiracy', 'st', 3200),
  edition('Desert Eagle', 'Conspiracy', 'souv', 14000),
  edition('Desert Eagle', 'Conspiracy', 'coll', 55000),
  edition('Desert Eagle', 'Bronze Deco', 'coll', 130000),
  // M4A4
  edition('M4A4', 'Evil Daimyo', 'st', 3500),
  edition('M4A4', 'Neo-Noir', 'st', 9500),
  edition('M4A4', 'Evil Daimyo', 'souv', 24000),
  edition('M4A4', 'Neo-Noir', 'souv', 60000),
  edition('M4A4', 'Neo-Noir', 'coll', 150000),
  // Other expensive guns (premium cases)
  edition('M4A1-S', 'Printstream', 'st', 30000),
  edition('M4A1-S', 'Fade', 'st', 21000),
  // Knives: StatTrak™ and top editions
  edition('Bayonet', 'Fade', 'st', 38000),
  edition('Karambit', 'Doppler', 'st', 52000),
  edition('Butterfly Knife', 'Slaughter', 'st', 48000),
  edition('M9 Bayonet', 'Tiger Tooth', 'st', 55000),
  edition('Flip Knife', 'Doppler', 'st', 62000),
  edition('Gut Knife', 'Marble Fade', 'st', 70000),
  edition('Huntsman Knife', 'Tiger Tooth', 'st', 80000),
  edition('Bowie Knife', 'Crimson Web', 'st', 90000),
  edition('Falchion Knife', 'Fade', 'st', 100000),
  edition('Karambit', 'Doppler', 'coll', 260000),
  edition('Butterfly Knife', 'Slaughter', 'coll', 340000),
  edition('M9 Bayonet', 'Tiger Tooth', 'coll', 420000),
  edition('Flip Knife', 'Doppler', 'coll', 650000),
  // Preserve legacy glove IDs and values; use the confirmed CS2 renders.
  glove('hand-wraps-slaughter', 'Hand Wraps', 'Slaughter', 48000, '#e5cdb0'),
  glove('moto-spearmint', 'Moto Gloves', 'Spearmint', 72000, '#6fd1a8'),
  glove('bloodhound-charred', 'Bloodhound Gloves', 'Charred', 95000, '#d08a4c'),
  glove('driver-king-snake', 'Driver Gloves', 'King Snake', 140000, '#d2b24a'),
  glove('specialist-kimono', 'Specialist Gloves', 'Crimson Kimono', 210000, '#e0574a'),
  glove('sport-hedge-maze', 'Sport Gloves', 'Hedge Maze', 320000, '#7fc46f'),
  glove('specialist-emerald', 'Specialist Gloves', 'Emerald Web', 480000, '#3ed49a'),
  glove('sport-pandora', 'Sport Gloves', "Pandora's Box", 750000, '#a77bf0'),
  glove('sport-vice', 'Sport Gloves', 'Vice', 1100000, '#ff6fb5'),
  glove('driver-crimson-weave', 'Driver Gloves', 'Crimson Weave', 1600000, '#d12d4a'),
  glove('specialist-fade', 'Specialist Gloves', 'Fade', 2200000, '#ff9d52'),
]

// Keep every existing ID/value so inventories remain compatible. Only images are
// refreshed for existing items; new finishes are appended once by weapon + name.
const existingSkins: Skin[] = [...baseSkins, ...extraSkins]
const itemKey = (skin: Pick<Skin, 'weapon' | 'name'>) => `${skin.weapon} | ${skin.name}`
const catalogByName = new Map(skinCatalog.map((skin) => [itemKey(skin), skin]))
const existingNames = new Set(existingSkins.map(itemKey))
const mergedSkins: Skin[] = [
  ...existingSkins.map((skin) => ({
    ...skin,
    image: catalogByName.get(itemKey(skin))?.image ?? skin.image,
  })),
  ...skinCatalog.filter((skin) => !existingNames.has(itemKey(skin))),
]

/**
 * Every item is worth its approximate Steam price at the fixed peg
 * 1 USD = 7 500 crystals (see `skin-prices.ts`). StatTrak/Сувенирный/Коллекционный
 * editions follow the base price via their multiplier. The old per-item values
 * above are only kept as the source of ids, names and images.
 */
export const skins: readonly Skin[] = mergedSkins.map((skin) => ({
  ...skin,
  value: crystalValueFor(skin),
}))

export const isKnife = (skin: Skin) => skin.knife === true
export const isGlove = (skin: Skin) => skin.glove === true
export const isCharm = (skin: Skin) => skin.charm === true
/** Knives and gloves: the "premium-only" drops. */
export const isPremiumItem = (skin: Skin) => isKnife(skin) || isGlove(skin)

export type Drop = { skin: string; weight: number }

/**
 * Maximum chance (0.45 = 45%) of getting at least the case price, by case group.
 * Premium cases go from 35% (cheapest) down to 25% (most expensive).
 */
const paybackChance = (group: string, price: number) =>
  group === 'basic' ? 0.45 : group === 'weapon' ? 0.35 : 0.35 - ((price - 100000) / 400000) * 0.1

/**
 * Drop table whose weights sum to exactly 10 000 (0.01% steps).
 * Weight ~ value^-s. s is the smallest exponent that satisfies both limits:
 * the chance of getting at least the case price is <= `maxHit`, and the
 * expected payout is <= `rtp` * price.
 */
function buildDrops(
  pool: Skin[],
  price: number,
  rtp: number,
  maxHit: number,
): Drop[] {
  const vmin = Math.min(...pool.map((s) => s.value))
  const scores = (s: number) => pool.map((x) => Math.pow(x.value / vmin, -s))
  const stats = (s: number) => {
    const sc = scores(s)
    const sum = sc.reduce((a, b) => a + b, 0)
    let ev = 0
    let hit = 0
    sc.forEach((w, i) => {
      ev += (w / sum) * pool[i].value
      if (pool[i].value >= price) hit += w / sum
    })
    return { ev, hit }
  }
  const target = Math.max(vmin, price * rtp)
  const ok = (s: number) => {
    const { ev, hit } = stats(s)
    return ev <= target && hit <= maxHit
  }
  let lo = -8
  let hi = 8
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (ok(mid)) hi = mid
    else lo = mid
  }
  const sc = scores(hi)
  const sum = sc.reduce((a, b) => a + b, 0)
  const weights = sc.map((w) => Math.max(1, Math.floor((w / sum) * 10000)))
  const top = weights.indexOf(Math.max(...weights))
  weights[top] += 10000 - weights.reduce((a, b) => a + b, 0)
  return pool.map((s, i) => ({ skin: s.id, weight: weights[i] }))
}

type CaseDef = {
  id: string
  name: string
  subtitle: string
  price: number
  color: string
  tag: string
  group: 'basic' | 'weapon' | 'premium'
  pool: (s: Skin) => boolean
  rtp: number
}

export const caseGroups = [
  { id: 'basic', label: 'Обычные кейсы', hint: '500 – 20 000 · без ножей и перчаток' },
  { id: 'weapon', label: 'Оружейные кейсы', hint: '45 000 – 300 000 · только один тип оружия' },
  { id: 'premium', label: 'Премиум кейсы', hint: '100 000 – 500 000 · ножи, перчатки, топ-скины' },
] as const

const basicPool = (price: number) => (s: Skin) =>
  !isPremiumItem(s) &&
  !s.id.endsWith('-souv') &&
  !s.id.endsWith('-coll') &&
  s.value >= price * 0.07 &&
  s.value <= price * 2
const weaponPool = (weapon: string, price: number) => (s: Skin) =>
  s.weapon === weapon && !isPremiumItem(s) && s.value <= price * 4
const premiumPool = (price: number) => (s: Skin) =>
  s.value >= price * 0.15 && s.value <= price * 5

const caseDefs: CaseDef[] = [
  // --- Обычные: 500 – 20 000 ---
  { id: 'starter', name: 'Первый дроп', subtitle: 'Большое начинается с малого', price: 500, color: '#93b8ff', tag: 'ДЛЯ СТАРТА', group: 'basic', pool: basicPool(500), rtp: 0.9 },
  { id: 'toxic', name: 'Monster Mashup', subtitle: 'Заряжен на редкие находки', price: 900, color: '#b7e77c', tag: 'ПОПУЛЯРНЫЙ', group: 'basic', pool: basicPool(900), rtp: 0.9 },
  { id: 'rust', name: 'Rust Belt', subtitle: 'Старый металл, новые шансы', price: 1500, color: '#d9a066', tag: 'НОВЫЙ', group: 'basic', pool: basicPool(1500), rtp: 0.9 },
  { id: 'night', name: 'Night Protocol', subtitle: 'Тёмная сторона коллекции', price: 2500, color: '#b699ed', tag: 'ЭПИЧЕСКИЙ', group: 'basic', pool: basicPool(2500), rtp: 0.9 },
  { id: 'frost', name: 'Frostbite', subtitle: 'Холодный расчёт', price: 3500, color: '#8fe3f2', tag: 'ХИТ', group: 'basic', pool: basicPool(3500), rtp: 0.9 },
  { id: 'neon', name: 'Neon District', subtitle: 'Город, который не спит', price: 6000, color: '#ff79c6', tag: 'ЯРКИЙ', group: 'basic', pool: basicPool(6000), rtp: 0.9 },
  { id: 'gold', name: 'Golden Hour', subtitle: 'Твой шанс на легенду', price: 7500, color: '#e8bd75', tag: 'ЛЕГЕНДАРНЫЙ', group: 'basic', pool: basicPool(7500), rtp: 0.9 },
  { id: 'crimson', name: 'Crimson Tide', subtitle: 'Красная волна удачи', price: 12500, color: '#f16c72', tag: 'ГОРЯЧИЙ', group: 'basic', pool: basicPool(12500), rtp: 0.9 },
  { id: 'storm', name: 'Storm Front', subtitle: 'Гроза несёт дорогие скины', price: 15000, color: '#7aa2ff', tag: 'МОЩНЫЙ', group: 'basic', pool: basicPool(15000), rtp: 0.9 },
  { id: 'apex', name: 'Apex', subtitle: 'Вершина обычных кейсов', price: 20000, color: '#f2d36b', tag: 'ТОП', group: 'basic', pool: basicPool(20000), rtp: 0.9 },
  // --- Оружейные: 45 000 – 300 000 ---
  { id: 'usp', name: 'USP Cache', subtitle: 'Только USP-S', price: 45000, color: '#9ad0ff', tag: 'USP-S', group: 'weapon', pool: weaponPool('USP-S', 45000), rtp: 0.9 },
  { id: 'deagle', name: 'Deagle Vault', subtitle: 'Только Desert Eagle', price: 70000, color: '#ffd166', tag: 'DESERT EAGLE', group: 'weapon', pool: weaponPool('Desert Eagle', 70000), rtp: 0.9 },
  { id: 'm4a4', name: 'M4A4 Armory', subtitle: 'Только M4A4', price: 100000, color: '#7ee0b0', tag: 'M4A4', group: 'weapon', pool: weaponPool('M4A4', 100000), rtp: 0.9 },
  { id: 'ak47', name: 'AK-47 Arsenal', subtitle: 'Только AK-47', price: 210000, color: '#ff8a65', tag: 'AK-47', group: 'weapon', pool: weaponPool('AK-47', 210000), rtp: 0.9 },
  { id: 'awp', name: 'AWP Sniper Nest', subtitle: 'Только AWP', price: 300000, color: '#c792ff', tag: 'AWP', group: 'weapon', pool: weaponPool('AWP', 300000), rtp: 0.9 },
  // --- Премиум: 100 000 – 500 000 ---
  { id: 'blade-1', name: 'Blade Society', subtitle: 'Первые ножи и перчатки', price: 100000, color: '#cfd8e3', tag: 'ПРЕМИУМ', group: 'premium', pool: premiumPool(100000), rtp: 0.9 },
  { id: 'wraps', name: 'Wrapped Fortune', subtitle: 'Перчатки и острые лезвия', price: 125000, color: '#e5cdb0', tag: 'ПЕРЧАТКИ', group: 'premium', pool: premiumPool(125000), rtp: 0.9 },
  { id: 'obsidian', name: 'Obsidian Vault', subtitle: 'Тёмное золото коллекции', price: 150000, color: '#a58cff', tag: 'ЭЛИТА', group: 'premium', pool: premiumPool(150000), rtp: 0.9 },
  { id: 'emberfall', name: 'Emberfall', subtitle: 'Горячие ножи', price: 185000, color: '#ff7a59', tag: 'ГОРЯЧИЙ', group: 'premium', pool: premiumPool(185000), rtp: 0.9 },
  { id: 'kimono', name: 'Crimson Kimono', subtitle: 'Редкие перчатки в шансе', price: 225000, color: '#e0574a', tag: 'РЕДКИЙ', group: 'premium', pool: premiumPool(225000), rtp: 0.9 },
  { id: 'emerald', name: 'Emerald Crown', subtitle: 'Изумрудная коллекция', price: 270000, color: '#3ed49a', tag: 'КОРОНА', group: 'premium', pool: premiumPool(270000), rtp: 0.9 },
  { id: 'dragon', name: 'Dragon Hoard', subtitle: 'Сокровища дракона', price: 320000, color: '#f2bd69', tag: 'ЛЕГЕНДА', group: 'premium', pool: premiumPool(320000), rtp: 0.9 },
  { id: 'pandora', name: "Pandora's Box", subtitle: 'Открой — и узнаешь', price: 370000, color: '#c08cff', tag: 'МИФИЧЕСКИЙ', group: 'premium', pool: premiumPool(370000), rtp: 0.9 },
  { id: 'vice', name: 'Vice Royale', subtitle: 'Королевский дроп', price: 430000, color: '#ff6fb5', tag: 'РОЯЛ', group: 'premium', pool: premiumPool(430000), rtp: 0.9 },
  { id: 'sovereign', name: 'Sovereign', subtitle: 'Самый дорогой кейс', price: 500000, color: '#ffd76a', tag: 'ВЕРШИНА', group: 'premium', pool: premiumPool(500000), rtp: 0.9 },
]

export const cases = caseDefs.map(({ pool, rtp, ...c }) => ({
  ...c,
  drops: buildDrops(
    skins.filter(pool),
    c.price,
    rtp,
    paybackChance(c.group, c.price),
  ),
}))

/** Total chance (in percent) of a knife or glove from this case. */
export const premiumChance = (drops: Drop[]) =>
  drops
    .filter((d) => isPremiumItem(skinById(d.skin)))
    .reduce((a, d) => a + d.weight, 0) / 100
export type Item = { uid: string; skin: string }
export type Player = {
  balance: number
  inventory: Item[]
  referrals: number
  id: string
}
export const skinById = (id: string) => skins.find((s) => s.id === id)!
export const format = (n: number) => n.toLocaleString('ru-RU')

/** Chance of a successful upgrade, in percent (same formula as on the server). */
export const upgradeChance = (from: number, to: number) =>
  Math.min(75, (from / to) * 90)
export type Tier = 'safe' | 'risk' | 'critical'
export const chanceTier = (chance: number): Tier =>
  chance >= 40 ? 'safe' : chance >= 20 ? 'risk' : 'critical'
export const tierInfo: { id: Tier; label: string; range: string }[] = [
  { id: 'safe', label: 'Надёжно', range: '40%+' },
  { id: 'risk', label: 'Риск', range: '20–40%' },
  { id: 'critical', label: 'Критически', range: '0–20%' },
]
