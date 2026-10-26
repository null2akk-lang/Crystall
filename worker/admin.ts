/* eslint-disable @typescript-eslint/no-explicit-any */
import { skins } from '../src/lib/game'
import { banSeconds, ensureSchema, parseInventory, type PlayerRow } from './db'
import {
  cookie,
  getCookie,
  hmacHex,
  iso,
  isUuid,
  json,
  nowSec,
  safeEqual,
  sha256Hex,
} from './util'
import type { D1Database, Env } from './types'

// Test project: built-in access code. Set CRYSTAL_ADMIN_CODE in Cloudflare to override it.
const DEFAULT_CODE = 'Sundet_2010'
const SESSION_MS = 30 * 60 * 1000

class AdminError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

const adminCookie = (value: string, maxAge: number) =>
  cookie('crystal_admin', value, { path: '/api/admin', sameSite: 'Strict', maxAge })

async function journal(db: D1Database, operator: string) {
  const { results } = await db
    .prepare(
      `SELECT id, type, target, details, created_at FROM (
        SELECT id, 'crystals' AS type, recipient AS target, json_object('amount', amount) AS details, created_at
          FROM crystal_grants WHERE operator = ?
        UNION ALL
        SELECT id, type, target, details, created_at FROM admin_actions WHERE operator = ?
      ) ORDER BY created_at DESC LIMIT 40`,
    )
    .bind(operator, operator)
    .all<{ id: string; type: string; target: string; details: string; created_at: number }>()
  return results.map((r) => ({
    id: r.id,
    type: r.type,
    target: r.target,
    details: JSON.parse(r.details || '{}'),
    created_at: iso(r.created_at),
  }))
}

const playerView = (p: PlayerRow & { items: number }, now: number) => ({
  id: p.id,
  balance: p.balance,
  referrals: p.referrals,
  created_at: iso(p.created_at),
  last_seen: iso(p.last_seen),
  items: p.items,
  ban_permanent: Boolean(p.ban_permanent),
  ban_reason: p.ban_reason,
  ban_seconds: banSeconds(p, now),
})
const PLAYER_COLUMNS =
  'id, balance, referrals, created_at, last_seen, json_array_length(inventory) AS items, ban_permanent, ban_reason, banned_until'

export async function handleAdmin(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Метод не поддерживается' }, 405)
  const origin = req.headers.get('origin')
  if (
    !origin ||
    origin !== new URL(req.url).origin ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  )
    return json({ error: 'Недопустимый запрос' }, 403)
  try {
    const db = env.DB
    await ensureSchema(db)
    const body = (await req.json().catch(() => ({}))) as Record<string, any>
    const session = getCookie(req, 'crystal_player')
    if (!isUuid(session)) throw new AdminError('Сначала подключитесь к игре', 401)
    const found = await db
      .prepare('SELECT id FROM players WHERE session = ?')
      .bind(session)
      .first<{ id: string }>()
    if (!found) throw new AdminError('Сначала подключитесь к игре', 401)
    const operator = found.id
    const secret = env.CRYSTAL_ADMIN_CODE || DEFAULT_CODE
    const sign = (expires: string) => hmacHex(secret, `${session}:${expires}`)
    const [expires, signature] = (getCookie(req, 'crystal_admin') || '').split('.')
    const authorized = Boolean(
      expires &&
        /^\d+$/.test(expires) &&
        Number(expires) > Date.now() &&
        Number(expires) <= Date.now() + SESSION_MS &&
        signature &&
        (await safeEqual(signature, await sign(expires))),
    )
    const now = nowSec()

    if (body.action === 'login') {
      // The key holds no raw IP address; the database keeps the rate limit across requests.
      const ip = req.headers.get('CF-Connecting-IP') || 'unknown'
      const key = (await sha256Hex(ip)).slice(0, 32)
      const attempt = await db
        .prepare(
          `INSERT INTO admin_attempts (key, attempts, window_start) VALUES (?, 1, ?)
          ON CONFLICT (key) DO UPDATE SET
            attempts = CASE WHEN window_start < ? - 900 THEN 1 ELSE attempts + 1 END,
            window_start = CASE WHEN window_start < ? - 900 THEN ? ELSE window_start END
          RETURNING attempts`,
        )
        .bind(key, now, now, now, now)
        .first<{ attempts: number }>()
      if (!attempt || attempt.attempts > 5)
        throw new AdminError('Слишком много попыток. Повторите через 15 минут.', 429)
      if (
        typeof body.code !== 'string' ||
        body.code.length > 256 ||
        !(await safeEqual(body.code, secret))
      )
        throw new AdminError('Промокод недействителен', 401)
      const expiry = String(Date.now() + SESSION_MS)
      return json({ authorized: true, journal: await journal(db, operator) }, 200, [
        adminCookie(`${expiry}.${await sign(expiry)}`, 1800),
      ])
    }
    if (body.action === 'logout')
      return json({ authorized: false }, 200, [adminCookie('', 0)])
    if (!authorized)
      throw new AdminError('Введите код в разделе «Промокоды» для входа', 401)

    const recipientId = () => {
      if (!isUuid(body.recipient)) throw new AdminError('Укажите корректный ID игрока')
      return body.recipient as string
    }
    const loadPlayer = async (id: string) => {
      const row = await db
        .prepare('SELECT * FROM players WHERE id = ?')
        .bind(id)
        .first<PlayerRow>()
      if (!row) throw new AdminError('Игрок не найден.')
      return row
    }

    if (body.action === 'grant') {
      const recipient = recipientId()
      if (!isUuid(body.requestId)) throw new AdminError('Некорректный запрос')
      if (
        !Number.isSafeInteger(body.amount) ||
        body.amount < 1 ||
        body.amount > 1000000
      )
        throw new AdminError('Количество: целое число от 1 до 1 000 000')
      const same = async () => {
        const prev = await db
          .prepare('SELECT recipient, amount, operator FROM crystal_grants WHERE id = ?')
          .bind(body.requestId)
          .first<{ recipient: string; amount: number; operator: string }>()
        if (!prev) return false
        if (
          prev.recipient !== recipient ||
          prev.amount !== body.amount ||
          prev.operator !== operator
        )
          throw new AdminError('ID операции уже использован')
        return true
      }
      if (!(await same())) {
        const target = await loadPlayer(recipient)
        if (target.balance > 2147483647 - body.amount)
          throw new AdminError('Достигнут предел баланса')
        try {
          // One transaction: the grant record and the balance change apply together.
          await db.batch([
            db
              .prepare(
                'INSERT INTO crystal_grants (id, recipient, operator, amount, created_at) VALUES (?, ?, ?, ?, ?)',
              )
              .bind(body.requestId, recipient, operator, body.amount, now),
            db
              .prepare(
                'UPDATE players SET balance = balance + ?, version = version + 1 WHERE id = ?',
              )
              .bind(body.amount, recipient),
          ])
        } catch (error) {
          // A parallel retry of the same request may have won: that is fine.
          if (!(await same())) throw error
        }
      }
    } else if (body.action === 'give_skin') {
      const recipient = recipientId()
      if (!isUuid(body.requestId)) throw new AdminError('Некорректный запрос')
      const skin = skins.find((x) => x.id === body.skin)
      if (!skin) throw new AdminError('Скин не найден')
      if (!Number.isSafeInteger(body.count) || body.count < 1 || body.count > 10)
        throw new AdminError('Количество скинов: от 1 до 10')
      const same = async () => {
        const prev = await db
          .prepare('SELECT target, operator, details FROM admin_actions WHERE id = ?')
          .bind(body.requestId)
          .first<{ target: string; operator: string; details: string }>()
        if (!prev) return false
        const d = JSON.parse(prev.details || '{}')
        if (
          prev.target !== recipient ||
          prev.operator !== operator ||
          d.skin !== skin.id ||
          d.count !== body.count
        )
          throw new AdminError('ID операции уже использован')
        return true
      }
      if (!(await same())) {
        let applied = false
        for (let attempt = 0; attempt < 5 && !applied; attempt++) {
          const target = await loadPlayer(recipient)
          const inventory = parseInventory(target.inventory)
          if (inventory.length + body.count > 500)
            throw new AdminError('В инвентаре не может быть больше 500 скинов')
          for (let i = 0; i < body.count; i++)
            inventory.push({ uid: crypto.randomUUID(), skin: skin.id })
          try {
            // Both statements apply only if the player did not change since we read them.
            const [, updated] = await db.batch([
              db
                .prepare(
                  `INSERT INTO admin_actions (id, operator, target, type, details, created_at)
                  SELECT ?, ?, ?, 'skin', ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id = ? AND version = ?)`,
                )
                .bind(
                  body.requestId,
                  operator,
                  recipient,
                  JSON.stringify({ skin: skin.id, count: body.count }),
                  now,
                  recipient,
                  target.version,
                ),
              db
                .prepare(
                  'UPDATE players SET inventory = ?, version = version + 1 WHERE id = ? AND version = ?',
                )
                .bind(JSON.stringify(inventory), recipient, target.version),
            ])
            applied = updated.meta.changes === 1
          } catch (error) {
            if (await same()) {
              applied = true
              break
            }
            throw error
          }
        }
        if (!applied) throw new Error('too many concurrent updates')
      }
    } else if (body.action === 'ban') {
      const recipient = recipientId()
      if (recipient === operator)
        throw new AdminError('Нельзя заблокировать самого себя')
      const permanent = body.mode === 'permanent'
      if (!permanent && body.mode !== 'temporary')
        throw new AdminError('Выберите тип блокировки')
      const minutes = permanent ? 0 : body.minutes
      if (!permanent && (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 525600))
        throw new AdminError('Срок блокировки: от 1 минуты до 365 дней')
      const reason =
        typeof body.reason === 'string' ? body.reason.trim().slice(0, 200) : ''
      await loadPlayer(recipient)
      await db.batch([
        db
          .prepare(
            'UPDATE players SET ban_permanent = ?, banned_until = ?, ban_reason = ? WHERE id = ?',
          )
          .bind(permanent ? 1 : 0, permanent ? null : now + minutes * 60, reason || null, recipient),
        db
          .prepare(
            `INSERT INTO admin_actions (id, operator, target, type, details, created_at) VALUES (?, ?, ?, 'ban', ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            operator,
            recipient,
            JSON.stringify({ permanent, minutes, reason }),
            now,
          ),
      ])
    } else if (body.action === 'unban') {
      const recipient = recipientId()
      await loadPlayer(recipient)
      await db.batch([
        db
          .prepare(
            'UPDATE players SET ban_permanent = 0, banned_until = NULL, ban_reason = NULL WHERE id = ?',
          )
          .bind(recipient),
        db
          .prepare(
            `INSERT INTO admin_actions (id, operator, target, type, details, created_at) VALUES (?, ?, ?, 'unban', '{}', ?)`,
          )
          .bind(crypto.randomUUID(), operator, recipient, now),
      ])
    } else if (body.action === 'players') {
      const search =
        typeof body.search === 'string'
          ? body.search.toLowerCase().replace(/[^0-9a-f-]/g, '').slice(0, 36)
          : ''
      const offset =
        Number.isSafeInteger(body.offset) && body.offset > 0
          ? Math.min(body.offset, 100000)
          : 0
      const { results } = await db
        .prepare(
          `SELECT ${PLAYER_COLUMNS} FROM players
            WHERE (? = '' OR id LIKE ? || '%')
            ORDER BY COALESCE(last_seen, created_at) DESC
            LIMIT 50 OFFSET ?`,
        )
        .bind(search, search, offset)
        .all<PlayerRow & { items: number }>()
      const stats = await db
        .prepare(
          `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN ban_permanent = 1 OR banned_until > ? THEN 1 ELSE 0 END), 0) AS banned
            FROM players`,
        )
        .bind(now)
        .first<{ total: number; banned: number }>()
      return json({
        authorized: true,
        players: results.map((p) => playerView(p, now)),
        stats,
        hasMore: results.length === 50,
      })
    } else if (body.action === 'player') {
      const p = await loadPlayer(recipientId())
      const items = parseInventory(p.inventory)
      return json({
        authorized: true,
        player: { ...playerView({ ...p, items: items.length }, now), inventory: items },
      })
    } else if (body.action !== 'status') throw new AdminError('Неизвестное действие')
    return json({ authorized: true, journal: await journal(db, operator) })
  } catch (error) {
    if (error instanceof AdminError) return json({ error: error.message }, error.status)
    console.error('admin error', error)
    return json({ error: 'Не удалось выполнить операцию. Повторите попытку.' }, 503)
  }
}
