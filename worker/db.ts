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
    version INTEGER NOT NULL DEFAULT 0
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

const ready = new WeakMap<D1Database, Promise<void>>()
/** Creates the tables on first use (safe to run repeatedly). */
export function ensureSchema(db: D1Database): Promise<void> {
  let promise = ready.get(db)
  if (!promise) {
    promise = db
      .batch(SCHEMA.map((sql) => db.prepare(sql)))
      .then(() => undefined)
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
