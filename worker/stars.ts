import { starPackById } from '../src/lib/stars'
import { banSeconds, ensureSchema, type PlayerRow } from './db'
import { parseInitData } from './telegram'
import { json, nowSec, safeEqual } from './util'
import type { Env } from './types'

const MAX_BALANCE = 2147483647

/** Calls a Telegram Bot API method; throws when Telegram answers with an error. */
async function telegram(token: string, method: string, payload: object) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => null)) as {
    ok?: boolean
    result?: unknown
    description?: string
  } | null
  if (!res.ok || !data?.ok)
    throw new Error(`Telegram ${method}: ${data?.description ?? res.status}`)
  return data.result
}

/**
 * POST /api/stars { action: 'invoice', packId, initData } -> { link }
 * Creates a Telegram Stars invoice link for the signed-in Telegram player.
 */
export async function handleStars(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Метод не поддерживается' }, 405)
  if (req.headers.get('sec-fetch-site') === 'cross-site')
    return json({ error: 'Недопустимый запрос' }, 403)
  const token = env.TELEGRAM_BOT_TOKEN
  if (!token) return json({ error: 'Оплата звёздами пока не настроена' }, 503)
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const pack = starPackById(body?.packId)
    if (!body || body.action !== 'invoice' || !pack)
      return json({ error: 'Выберите пакет' }, 400)
    const tg = await parseInitData(body.initData, token)
    if (!tg?.verified)
      return json({ error: 'Откройте игру внутри Telegram, чтобы пополнить баланс' }, 403)
    await ensureSchema(env.DB)
    const row = await env.DB
      .prepare(
        'SELECT * FROM players WHERE tg_verified = 1 AND tg_id = ? ORDER BY created_at, id LIMIT 1',
      )
      .bind(tg.id)
      .first<PlayerRow>()
    if (!row) return json({ error: 'Сначала откройте игру и обновите страницу' }, 404)
    if (row.ban_permanent || banSeconds(row, nowSec()) > 0)
      return json({ error: 'Профиль заблокирован' }, 403)
    const link = await telegram(token, 'createInvoiceLink', {
      title: `${pack.crystals.toLocaleString('ru-RU')} кристаллов`,
      description: `Кристаллы для игры Crystal Drop (${pack.stars} ⭐)`,
      // Paid-out only after Telegram confirms it: see handleTelegramWebhook.
      payload: `${pack.id}:${row.id}`,
      currency: 'XTR',
      prices: [{ label: 'Кристаллы', amount: pack.stars }],
    })
    return json({ link })
  } catch (error) {
    console.error('stars invoice failed', error)
    return json({ error: 'Не удалось создать счёт. Попробуйте позже.' }, 503)
  }
}

type Update = {
  pre_checkout_query?: {
    id: string
    from: { id: number }
    currency: string
    total_amount: number
    invoice_payload: string
  }
  message?: {
    from?: { id: number }
    successful_payment?: {
      currency: string
      total_amount: number
      invoice_payload: string
      telegram_payment_charge_id: string
    }
  }
}

type Checked = { playerId: string; packId: string; stars: number; crystals: number }

/** Checks that a payment matches a real pack and the player who is paying. */
async function checkPayment(
  env: Env,
  payment: { currency: string; total_amount: number; invoice_payload: string },
  fromId: number | undefined,
): Promise<Checked | null> {
  const [packId, playerId] = String(payment.invoice_payload).split(':')
  const pack = starPackById(packId)
  if (!pack || !playerId || !fromId) return null
  if (payment.currency !== 'XTR' || payment.total_amount !== pack.stars) return null
  const owner = await env.DB
    .prepare('SELECT 1 AS ok FROM players WHERE id = ? AND tg_verified = 1 AND tg_id = ?')
    .bind(playerId, fromId)
    .first()
  if (!owner) return null
  return { playerId, packId: pack.id, stars: pack.stars, crystals: pack.crystals }
}

/**
 * Telegram bot webhook. Answers pre-checkout queries and, on a confirmed
 * successful_payment, credits the crystals exactly once per charge id.
 */
export async function handleTelegramWebhook(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Метод не поддерживается' }, 405)
  const token = env.TELEGRAM_BOT_TOKEN
  const secret = env.TELEGRAM_WEBHOOK_SECRET
  if (!token || !secret) return json({ error: 'Не настроено' }, 503)
  const given = req.headers.get('x-telegram-bot-api-secret-token') || ''
  if (!(await safeEqual(given, secret))) return json({ error: 'Нет доступа' }, 403)
  const update = (await req.json().catch(() => null)) as Update | null
  if (!update) return json({ ok: true })
  try {
    await ensureSchema(env.DB)
    const query = update.pre_checkout_query
    if (query) {
      const valid = await checkPayment(env, query, query.from.id)
      await telegram(
        token,
        'answerPreCheckoutQuery',
        valid
          ? { pre_checkout_query_id: query.id, ok: true }
          : {
              pre_checkout_query_id: query.id,
              ok: false,
              error_message: 'Платёж не прошёл проверку. Попробуйте ещё раз из игры.',
            },
      )
      return json({ ok: true })
    }
    const payment = update.message?.successful_payment
    if (payment) {
      const valid = await checkPayment(env, payment, update.message?.from?.id)
      if (!valid) {
        // Money was taken but we cannot match it: keep a trace for a manual refund.
        console.error('unmatched star payment', payment.telegram_payment_charge_id)
        return json({ ok: true })
      }
      try {
        await env.DB.batch([
          // charge_id is the primary key: a repeated delivery fails here and
          // the whole batch is rolled back, so crystals are never granted twice.
          env.DB
            .prepare(
              'INSERT INTO star_payments (charge_id, player, tg_id, pack, stars, crystals, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(
              payment.telegram_payment_charge_id,
              valid.playerId,
              update.message?.from?.id,
              valid.packId,
              valid.stars,
              valid.crystals,
              nowSec(),
            ),
          env.DB
            .prepare(
              'UPDATE players SET balance = MIN(balance + ?, ?), version = version + 1 WHERE id = ?',
            )
            .bind(valid.crystals, MAX_BALANCE, valid.playerId),
        ])
      } catch (error) {
        if (!/UNIQUE|constraint/i.test(String(error))) throw error
      }
    }
    return json({ ok: true })
  } catch (error) {
    // A non-200 answer makes Telegram retry later, which is what we want here.
    console.error('telegram webhook failed', error)
    return json({ error: 'Ошибка обработки' }, 500)
  }
}
