import { cases, skins, skinById, type Item } from '../src/lib/game'
import { banSeconds, ensureSchema, parseInventory, type PlayerRow } from './db'
import {
  cookie,
  getCookie,
  isUuidV4,
  json,
  nowSec,
  randomInt,
} from './util'
import type { Env } from './types'

// Messages of GameError are shown to the player; any other error becomes a generic 503.
class GameError extends Error {}

type Outcome = { title: string; skin?: string; won?: boolean }
type Result = { balance: number; inventory: Item[]; outcome?: Outcome }

function play(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: Record<string, any>,
  row: PlayerRow,
  promoUsed: boolean,
): Result {
  let balance = row.balance
  let inventory = parseInventory(row.inventory)
  let outcome: Outcome | undefined
  if (body.action === 'open') {
    const box = cases.find((c) => c.id === body.caseId)
    if (!box) throw new GameError('Кейс не найден')
    if (balance < box.price)
      throw new GameError(
        'Недостаточно кристаллов. Продайте скин или пригласите друга.',
      )
    const roll = randomInt(10000)
    let total = 0
    const drop = box.drops.find((d) => {
      total += d.weight
      return roll < total
    })!
    balance -= box.price
    inventory = [...inventory, { uid: crypto.randomUUID(), skin: drop.skin }]
    outcome = { title: 'Новый скин в коллекции!', skin: drop.skin, won: true }
  } else if (body.action === 'promo') {
    if (
      typeof body.code !== 'string' ||
      body.code.trim().toLowerCase() !== 'gigasquad'
    )
      throw new GameError('Промокод не найден')
    if (promoUsed)
      throw new GameError('Промокод уже активирован в этом профиле')
    balance += 10000
    outcome = { title: 'Промокод активирован: +10 000 кристаллов!' }
  } else if (body.action === 'sell' || body.action === 'upgrade') {
    const item = inventory.find((i) => i.uid === body.uid)
    if (!item) throw new GameError('Выберите скин из инвентаря')
    const source = skinById(item.skin)
    inventory = inventory.filter((i) => i.uid !== item.uid)
    if (body.action === 'sell') {
      balance += source.value
      outcome = { title: `Скин продан за ${source.value} кристаллов` }
    } else {
      const target = skins.find((s) => s.id === body.target)
      if (!target || target.value <= source.value)
        throw new GameError('Выберите более дорогой скин')
      const probability = Math.min(75, (source.value / target.value) * 90)
      const won = randomInt(1000000) / 10000 < probability
      if (won) inventory.push({ uid: crypto.randomUUID(), skin: target.id })
      outcome = {
        title: won ? 'Апгрейд удался!' : 'Не в этот раз. Скин потерян.',
        skin: won ? target.id : undefined,
        won,
      }
    }
  } else throw new GameError('Неизвестное действие')
  return { balance, inventory, outcome }
}

const MAX_ATTEMPTS = 6

export async function handleGame(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Метод не поддерживается' }, 405)
  if (req.headers.get('sec-fetch-site') === 'cross-site')
    return json({ error: 'Недопустимый запрос' }, 403)
  try {
    const db = env.DB
    const raw = await req.json().catch(() => null)
    if (!raw || typeof raw !== 'object') throw new GameError('Неизвестное действие')
    const body = raw as Record<string, unknown>
    await ensureSchema(db)
    const existing = getCookie(req, 'crystal_player')
    const session = isUuidV4(existing) ? existing : crypto.randomUUID()
    const now = nowSec()
    const byLogin = () =>
      db
        .prepare('SELECT * FROM players WHERE session = ?')
        .bind(session)
        .first<PlayerRow>()
    let row = await byLogin()
    let created = false
    if (!row) {
      const newId = crypto.randomUUID()
      const referrer = isUuidV4(body.ref) ? body.ref : null
      // Only the request that really inserts the profile can award a referral bonus.
      const [inserted] = await db.batch([
        db
          .prepare(
            'INSERT OR IGNORE INTO players (id, session, referrer, created_at) VALUES (?, ?, (SELECT id FROM players WHERE id = ?), ?)',
          )
          .bind(newId, session, referrer, now),
        db
          .prepare(
            'UPDATE players SET balance = balance + 5000, referrals = referrals + 1, version = version + 1 WHERE id = ? AND EXISTS (SELECT 1 FROM players WHERE id = ? AND session = ? AND referrer = ?)',
          )
          .bind(referrer, newId, session, referrer),
      ])
      created = inserted.meta.changes === 1
      row = await byLogin()
    }
    if (!row) throw new Error('player missing')
    const seconds = banSeconds(row, now)
    if (row.ban_permanent || seconds > 0)
      return json(
        {
          banned: true,
          permanent: Boolean(row.ban_permanent),
          seconds,
          reason: row.ban_reason || '',
          playerId: row.id,
        },
        403,
      )

    let outcome: Outcome | undefined
    if (body.action === 'state') {
      await db
        .prepare('UPDATE players SET last_seen = ? WHERE id = ?')
        .bind(now, row.id)
        .run()
    } else {
      let applied = false
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !applied; attempt++) {
        const promoUsed =
          body.action === 'promo' &&
          Boolean(
            await db
              .prepare('SELECT 1 AS used FROM promo_redemptions WHERE player = ?')
              .bind(row.id)
              .first(),
          )
        const result = play(body, row, promoUsed)
        outcome = result.outcome
        const update = db
          .prepare(
            'UPDATE players SET balance = ?, inventory = ?, last_seen = ?, version = version + 1 WHERE id = ? AND version = ?',
          )
          .bind(
            result.balance,
            JSON.stringify(result.inventory),
            now,
            row.id,
            row.version,
          )
        if (body.action === 'promo') {
          try {
            // Both statements only apply if the profile is still at the version we read.
            const [, updated] = await db.batch([
              db
                .prepare(
                  'INSERT INTO promo_redemptions (player, code, created_at) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id = ? AND version = ?)',
                )
                .bind(row.id, 'GigaSquad', now, row.id, row.version),
              update,
            ])
            applied = updated.meta.changes === 1
          } catch (error) {
            if (/UNIQUE|constraint/i.test(String(error)))
              throw new GameError('Промокод уже активирован в этом профиле')
            throw error
          }
        } else applied = (await update.run()).meta.changes === 1
        if (!applied) {
          // Someone changed the profile in between: reload and recalculate.
          const fresh = await byLogin()
          if (!fresh) throw new Error('player missing')
          row = fresh
        }
      }
      if (!applied) throw new Error('too many concurrent updates')
    }
    const player = await db
      .prepare('SELECT id, balance, inventory, referrals FROM players WHERE id = ?')
      .bind(row.id)
      .first<Pick<PlayerRow, 'id' | 'balance' | 'inventory' | 'referrals'>>()
    if (!player) throw new Error('player missing')
    return json(
      {
        player: { ...player, inventory: parseInventory(player.inventory) },
        outcome,
        welcome: created,
      },
      200,
      [
        cookie('crystal_player', session, {
          path: '/',
          sameSite: 'Lax',
          maxAge: 60 * 60 * 24 * 365,
        }),
      ],
    )
  } catch (error) {
    if (error instanceof GameError) return json({ error: error.message }, 400)
    console.error('game error', error)
    return json(
      { error: 'Не удалось подключиться к игре. Попробуйте ещё раз.' },
      503,
    )
  }
}
