import type { Skin } from './game'

// Approximate Steam Community Market prices in USD for ordinary versions, across
// wears. These are manually maintained estimates, not live Steam quotes.
// Crystal values of every skin are derived from them (see `crystalValueFor`).
const estimates: Record<string, Record<string, number>> = {
  'AK-47': {
    Slate: 4,
    Redline: 25,
    'Elite Build': 2,
    'Frontside Misty': 18,
    'The Empress': 35,
    'Fire Serpent': 650,
    Vulcan: 180,
    Asiimov: 30,
    'Neon Revolution': 22,
    Bloodsport: 120,
    'Fuel Injector': 150,
    Hydroponic: 1400,
    'Wasteland Rebel': 30,
    'Case Hardened': 180,
    'Neon Rider': 45,
    'Phantom Disruptor': 5,
    'Point Disarray': 12,
  },
  'M4A1-S': {
    Decimator: 15,
    Fade: 400,
    Printstream: 150,
    'Hyper Beast': 20,
    Cyrex: 25,
    'Golden Coil': 45,
    'Master Piece': 100,
    'Hot Rod': 900,
    "Chantico's Fire": 20,
    'Mecha Industries': 30,
    Knight: 2000,
    'Atomic Alloy': 45,
    'Blue Phosphor': 700,
  },
  'USP-S': {
    'Monster Mashup': 20,
    Cortex: 4,
    'Kill Confirmed': 45,
    Orion: 55,
    'Neo-Noir': 15,
    Caiman: 45,
    Printstream: 35,
    Whiteout: 30,
    Guardian: 5,
    'Road Rash': 30,
  },
  AWP: {
    'Neo-Noir': 25,
    Atheris: 3,
    Asiimov: 90,
    'Dragon Lore': 4500,
    Medusa: 2200,
    Gungnir: 6500,
    'Hyper Beast': 25,
    'Lightning Strike': 650,
    Fade: 900,
    'Containment Breach': 50,
    'Oni Taiji': 200,
    Wildfire: 40,
    Graphite: 150,
    "Man-o'-war": 35,
    'Electric Hive': 45,
  },
  Karambit: {
    Doppler: 1500,
    Fade: 2500,
    'Marble Fade': 1900,
    'Tiger Tooth': 1400,
    'Crimson Web': 800,
    Slaughter: 1200,
    'Case Hardened': 1000,
    Lore: 700,
    Autotronic: 1000,
    'Gamma Doppler': 1900,
  },
  P250: {
    'Sand Dune': 0.03,
    Asiimov: 3,
    Whiteout: 25,
    'See Ya Later': 3,
    Muertos: 6,
    Nevermore: 1,
  },
  Nova: { 'Sand Dune': 0.03, 'Hyper Beast': 12, Bloomstick: 8 },
  MP9: { 'Sand Dashed': 0.03, Hypnotic: 12, 'Hot Rod': 150, 'Rose Iron': 8 },
  'Glock-18': {
    'Death Rattle': 0.1,
    Moonrise: 0.5,
    Fade: 1500,
    'Water Elemental': 5,
    'Wasteland Rebel': 5,
    Vogue: 3,
    'Bullet Queen': 8,
    'Neo-Noir': 12,
    'Gamma Doppler': 70,
  },
  'Five-SeveN': {
    'Forest Night': 0.03,
    'Monkey Business': 3,
    'Hyper Beast': 25,
    'Case Hardened': 15,
    'Fowl Play': 4,
    'Angry Mob': 4,
  },
  'SG 553': { 'Army Sheen': 0.03, Cyrex: 5, Integrale: 40, Pulse: 3 },
  'SCAR-20': { Contractor: 0.03, Cyrex: 35, Cardiac: 5, Emerald: 50 },
  G3SG1: { 'Desert Storm': 0.03, 'The Executioner': 3, Flux: 10 },
  'PP-Bizon': {
    'Sand Dashed': 0.03,
    'Judgement of Anubis': 6,
    'Blue Streak': 4,
  },
  'MAG-7': { 'Rust Coat': 0.05, Bulldozer: 5, Praetorian: 3 },
  'Sawed-Off': { 'Forest DDPAT': 0.03 },
  'UMP-45': { 'Urban DDPAT': 0.03, 'Primal Saber': 3, Momentum: 4, Blaze: 20 },
  P90: {
    'Sand Spray': 0.03,
    Asiimov: 8,
    'Death by Kitty': 40,
    'Emerald Dragon': 120,
    Trigon: 8,
  },
  'MAC-10': { Silver: 0.2, 'Neon Rider': 7, Stalker: 15, Heat: 3 },
  'Desert Eagle': {
    'Bronze Deco': 0.3,
    Conspiracy: 8,
    Blaze: 600,
    'Code Red': 20,
    Printstream: 30,
    'Kumicho Dragon': 20,
    Hypnotic: 120,
    'Sunset Storm 壱': 220,
    'Sunset Storm 弐': 220,
    'Mecha Industries': 5,
    'Cobalt Disruption': 90,
  },
  'Tec-9': {
    'Ice Cap': 0.15,
    'Fuel Injector': 3,
    'Nuclear Threat': 40,
    Decimator: 10,
  },
  P2000: { Oceanic: 0.1 },
  MP7: { Cirrus: 0.15, Bloodsport: 2, Nemesis: 8, Fade: 6 },
  FAMAS: { 'Survivor Z': 0.3, 'Roll Cage': 3, Djinn: 3, Pulse: 6 },
  'Galil AR': { 'Rocket Pop': 0.5, Chatterbox: 10, Eco: 3, Cerberus: 25 },
  'SSG 08': {
    Abyss: 0.3,
    'Blood in the Water': 60,
    Dragonfire: 15,
    'Death Strike': 500,
  },
  M4A4: {
    'Evil Daimyo': 2,
    'Neo-Noir': 8,
    Howl: 4500,
    Asiimov: 100,
    'Desolate Space': 5,
    'The Emperor': 15,
    'Buzz Kill': 8,
    'Cyber Security': 10,
    '龍王 (Dragon King)': 10,
    Poseidon: 1000,
  },
  Bayonet: {
    Fade: 800,
    Doppler: 650,
    'Marble Fade': 700,
    'Tiger Tooth': 500,
    'Crimson Web': 300,
    Slaughter: 450,
  },
  'Butterfly Knife': {
    Slaughter: 1600,
    Fade: 3000,
    Doppler: 2300,
    'Marble Fade': 2300,
    'Tiger Tooth': 1800,
    'Case Hardened': 1200,
  },
  'M9 Bayonet': {
    'Tiger Tooth': 1100,
    Fade: 1700,
    Doppler: 1400,
    'Marble Fade': 1500,
    'Crimson Web': 700,
    'Case Hardened': 850,
  },
  'Flip Knife': {
    Doppler: 400,
    Fade: 600,
    'Marble Fade': 500,
    'Tiger Tooth': 350,
    Slaughter: 300,
  },
  'Gut Knife': {
    'Marble Fade': 220,
    Fade: 250,
    Doppler: 200,
    'Tiger Tooth': 180,
  },
  'Huntsman Knife': {
    'Tiger Tooth': 300,
    Fade: 450,
    Doppler: 400,
    Slaughter: 250,
    'Marble Fade': 380,
  },
  'Bowie Knife': {
    'Crimson Web': 150,
    Fade: 350,
    Doppler: 300,
    Slaughter: 200,
  },
  'Falchion Knife': {
    Fade: 350,
    Doppler: 300,
    'Marble Fade': 320,
    Slaughter: 200,
  },
  'Hand Wraps': {
    Slaughter: 160,
    'Cobalt Skulls': 250,
    'Duct Tape': 70,
    Badlands: 100,
    Leather: 100,
    Overprint: 150,
    Giraffe: 90,
  },
  'Moto Gloves': {
    Spearmint: 500,
    'Cool Mint': 200,
    Eclipse: 100,
    'POW!': 150,
    Transport: 70,
    'Boom!': 120,
  },
  'Bloodhound Gloves': {
    Charred: 100,
    Snakebite: 90,
    Bronzed: 85,
    Guerrilla: 90,
  },
  'Driver Gloves': {
    'King Snake': 250,
    'Crimson Weave': 180,
    'Lunar Weave': 100,
    Diamondback: 90,
    Overtake: 90,
    'Imperial Plaid': 250,
  },
  'Specialist Gloves': {
    'Crimson Kimono': 700,
    'Emerald Web': 350,
    Fade: 200,
    Foundation: 150,
    Mogul: 120,
    'Marble Fade': 200,
    'Forest DDPAT': 70,
  },
  'Sport Gloves': {
    'Hedge Maze': 1500,
    "Pandora's Box": 2500,
    Vice: 700,
    Superconductor: 1400,
    Amphibious: 400,
    Arid: 250,
    Omega: 350,
  },
  'Shadow Daggers': { Fade: 200, Doppler: 180, Slaughter: 150 },
  'Navaja Knife': { Fade: 200, Doppler: 170 },
  'Stiletto Knife': { Fade: 800, Doppler: 650 },
  'Talon Knife': { Fade: 1100, Doppler: 850, 'Marble Fade': 900 },
  'Ursus Knife': { Fade: 500, Doppler: 400 },
  'Skeleton Knife': { Fade: 1400, 'Crimson Web': 500 },
  'Nomad Knife': { Fade: 800, 'Crimson Web': 300 },
  'Kukri Knife': { Fade: 500, Slaughter: 300 },
  'Hydra Gloves': {
    'Case Hardened': 100,
    Emerald: 100,
    Mangrove: 65,
    Rattler: 65,
  },
  'CZ75-Auto': { Victoria: 6, Tigris: 1 },
  'R8 Revolver': { Fade: 8, 'Crimson Web': 0.2, 'Llama Cannon': 3 },
  AUG: { Chameleon: 3, 'Akihabara Accept': 350, Stymphalian: 2 },
  XM1014: { Tranquility: 8, Incinegator: 2 },
  Negev: { "Man-o'-war": 0.15, 'Power Loader': 1 },
  M249: { 'Nebula Crusader': 1, 'Emerald Poison Dart': 2 },
  Брелок: {
    "Lil' Ava": 1,
    "Lil' Squirt": 0.5,
    "Lil' Monster": 1,
    "Lil' Teacup": 2,
    "Lil' Whiskers": 2,
    "Lil' Crass": 0.5,
    "Lil' Cap Gun": 0.5,
    'Hot Howl': 30,
    'Hot Wurst': 1,
    'Hot Sauce': 1,
    'Hot Hands': 1,
    'Baby Karat T': 25,
    'Baby Karat CT': 25,
    'Disco MAC': 3,
    'Diner Dog': 1,
    Backsplash: 0.5,
    'Semi-Precious': 2,
    'Titeenium AWP': 3,
    'Die-cast AK': 5,
    'POP Art': 2,
    'Glamour Shot': 2,
    'Big Kev': 1,
    'Pocket AWP': 1,
    "Chicken Lil'": 2,
    'Whittle Knife': 3,
  },
}

/**
 * Economy peg: 1 USD = 7 500 crystals. Taken from the Telegram Stars base rate
 * (50 stars = 8 300 crystals ~ 1.10 USD, i.e. ~7 545 crystals per USD), rounded
 * down so a skin is never cheaper than its Steam price.
 */
export const CRYSTALS_PER_USD = 7500

/** Price of a special edition relative to the ordinary version. */
export const EDITION_PRICE_MULTIPLIER = {
  'StatTrak™': 1.6,
  Сувенирный: 4,
  Коллекционный: 3,
} as const

const editionPattern = /^(.*) \((StatTrak™|Сувенирный|Коллекционный)\)$/

/** Approximate Steam price in USD, including the StatTrak/Сувенирный/Коллекционный multiplier. */
export function approximatePriceUsd(
  item: Pick<Skin, 'weapon' | 'name'>,
): number {
  const match = editionPattern.exec(item.name)
  const finish = match ? match[1] : item.name
  const price = estimates[item.weapon]?.[finish]
  if (price === undefined)
    throw new Error(`Missing price estimate: ${item.weapon} | ${finish}`)
  if (!match) return price
  const multiplier =
    EDITION_PRICE_MULTIPLIER[match[2] as keyof typeof EDITION_PRICE_MULTIPLIER]
  return Math.round(price * multiplier * 100) / 100
}

/** Rounds crystal amounts to 2-3 significant digits so prices look tidy. */
const roundCrystals = (v: number) => {
  const step = v < 1000 ? 5 : v < 10000 ? 50 : v < 100000 ? 500 : v < 1000000 ? 5000 : 50000
  return Math.max(step, Math.round(v / step) * step)
}

/** Crystal value of an item: its USD price at the fixed peg. */
export const crystalValueFor = (item: Pick<Skin, 'weapon' | 'name'>) =>
  roundCrystals(approximatePriceUsd(item) * CRYSTALS_PER_USD)
