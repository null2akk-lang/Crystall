import type { Item } from '../src/lib/game'
import type { D1Database } from './types'

// Timestamps are unix seconds. `version` is bumped on every balance/inventory
// change; writers compare it to detect concurrent updates (D1 has no row locks).
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    session TEXT NOT NULL UNIQUE,
    balance INTEGER NOT NULL DEFAULT 1000 CHECK (balance >= 0 AND balance <= 2147483647),
    inventory TEXT NOT NULL DEFAULT '[]',
    referrals INTEGER NOT NULL DEFAULT 0,
    referrer TEXT,
    created_at INTEGER NOT NULL,
    banned_until INTEGER,
    ban_permanent INTEGER NOT NULL DEFAULT 0,
    ban_reason TEXT,
    last_seen INTEGER,
    version INTEGER NOT NULL DEFAULT 0,
    tg_id INTEGER,
    tg_username TEXT,
    tg_name TEXT,
    tg_photo TEXT,
    tg_search TEXT,
    tg_verified INTEGER NOT NULL DEFAULT 0
  )`,
  // Bans that follow a (signature-verified) Telegram account across profiles.
  `CREATE TABLE IF NOT EXISTS tg_bans (
    tg_id INTEGER PRIMARY KEY,
    banned_until INTEGER,
    ban_permanent INTEGER NOT NULL DEFAULT 0,
    ban_reason TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_attempts (
    key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    window_start INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS crystal_grants (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL REFERENCES players(id),
    operator TEXT NOT NULL REFERENCES players(id),
    amount INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS promo_redemptions (
    player TEXT PRIMARY KEY REFERENCES players(id),
    code TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_actions (
    id TEXT PRIMARY KEY,
    operator TEXT NOT NULL REFERENCES players(id),
    target TEXT NOT NULL REFERENCES players(id),
    type TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL
  )`,
]

// Databases created before Telegram profiles existed get the new columns here.
const TELEGRAM_COLUMNS = [
  'tg_id INTEGER',
  'tg_username TEXT',
  'tg_name TEXT',
  'tg_photo TEXT',
  'tg_search TEXT',
  'tg_verified INTEGER NOT NULL DEFAULT 0',
]
async function addTelegramColumns(db: D1Database): Promise<void> {
  try {
    await db.prepare('SELECT tg_id, tg_username, tg_name, tg_photo, tg_search, tg_verified FROM players LIMIT 1').all()
    return
  } catch {
    // Old table without the columns: add them one by one.
  }
  for (const column of TELEGRAM_COLUMNS) {
    try {
      await db.prepare(`ALTER TABLE players ADD COLUMN ${column}`).run()
    } catch (error) {
      if (!/duplicate column/i.test(String(error))) throw error
    }
  }
}

const ready = new WeakMap<D1Database, Promise<void>>()
/** Creates the tables on first use (safe to run repeatedly). */
export function ensureSchema(db: D1Database): Promise<void> {
  let promise = ready.get(db)
  if (!promise) {
    promise = db
      .batch(SCHEMA.map((sql) => db.prepare(sql)))
      .then(() => addTelegramColumns(db))
      .catch((error) => {
        ready.delete(db)
        throw error
      })
    ready.set(db, promise)
  }
  return promise
}

export type PlayerRow = {
  id: string
  session: string
  balance: number
  inventory: string
  referrals: number
  referrer: string | null
  created_at: number
  banned_until: number | null
  ban_permanent: number
  ban_reason: string | null
  last_seen: number | null
  version: number
  tg_id: number | null
  tg_username: string | null
  tg_name: string | null
  tg_photo: string | null
  tg_search: string | null
  tg_verified: number
}
export const parseInventory = (text: string): Item[] => {
  try {
    const value = JSON.parse(text)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}
/** Seconds of an active temporary ban (0 when none). */
export const banSeconds = (row: Pick<PlayerRow, 'banned_until'>, now: number) =>
  row.banned_until && row.banned_until > now ? row.banned_until - now : 0

type BanFields = {
  ban_permanent: number
  banned_until: number | null
  ban_reason: string | null
}
/** The stronger of two bans (permanent wins, otherwise the one that lasts longer). */
export function strongerBan(a: BanFields, b: BanFields, now: number) {
  const pick = (x: BanFields) => ({
    permanent: Boolean(x.ban_permanent),
    seconds: banSeconds(x, now),
    reason: x.ban_reason,
  })
  const [x, y] = [pick(a), pick(b)]
  if (x.permanent !== y.permanent) return x.permanent ? x : y
  return x.seconds >= y.seconds ? x : y
}
