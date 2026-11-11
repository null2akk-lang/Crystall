// Run: node --import tsx tests/stars.test.ts   (needs Node 22.13+)
import assert from 'node:assert/strict'
import worker from '../worker/index'
import { createD1 } from './d1-shim'
import { hmacRaw, toHex } from '../worker/util'
import { STAR_PACKS } from '../src/lib/stars'
import type { Env } from '../worker/types'

const TOKEN = '123456:TEST-TOKEN'
const SECRET = 'webhook-secret'
const ORIGIN = 'https://game.test'
const env: Env = {
  DB: createD1(),
  ASSETS: { fetch: async () => new Response('asset') },
  TELEGRAM_BOT_TOKEN: TOKEN,
  TELEGRAM_WEBHOOK_SECRET: SECRET,
}

// Records every call the Worker makes to the Telegram Bot API.
const telegramCalls: { method: string; payload: any }[] = []
globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const method = String(url).split('/').pop()!
  const payload = JSON.parse(String(init?.body))
  telegramCalls.push({ method, payload })
  const result = method === 'createInvoiceLink' ? 'https://t.me/$invoice' : true
  return new Response(JSON.stringify({ ok: true, result }))
}) as typeof fetch

async function initData(userId: number) {
  const params = new URLSearchParams({
    user: JSON.stringify({ id: userId, first_name: 'Test' }),
    auth_date: String(Math.floor(Date.now() / 1000)),
  })
  const data = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secret = await hmacRaw('WebAppData', TOKEN)
  params.set('hash', toHex(await hmacRaw(secret, data)))
  return params.toString()
}

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  worker.fetch(
    new Request(ORIGIN + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
    env,
  )
const webhook = (update: unknown, secret = SECRET) =>
  post('/api/telegram-webhook', update, { 'x-telegram-bot-api-secret-token': secret })

let passed = 0
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    passed++
    console.log('  ok  ', name)
  } catch (error) {
    console.error('  FAIL', name, '\n', error)
    process.exitCode = 1
  }
}

const pack = STAR_PACKS[1]
const TG_ID = 777
let playerId = ''
let balance = 0
let payload = ''

await test('player opens the game with Telegram', async () => {
  const res = await post('/api/game', { action: 'state', initData: await initData(TG_ID) })
  const data = (await res.json()) as any
  playerId = data.player.id
  balance = data.player.balance
  assert.ok(playerId)
})

await test('invoice needs a signed Telegram profile', async () => {
  const res = await post('/api/stars', { action: 'invoice', packId: pack.id })
  assert.equal(res.status, 403)
})

await test('unknown pack is rejected', async () => {
  const res = await post('/api/stars', {
    action: 'invoice',
    packId: 'free-money',
    initData: await initData(TG_ID),
  })
  assert.equal(res.status, 400)
})

await test('invoice link is created in Stars (XTR)', async () => {
  const res = await post('/api/stars', {
    action: 'invoice',
    packId: pack.id,
    initData: await initData(TG_ID),
  })
  assert.equal(res.status, 200)
  assert.equal(((await res.json()) as any).link, 'https://t.me/$invoice')
  const call = telegramCalls.find((c) => c.method === 'createInvoiceLink')!
  assert.equal(call.payload.currency, 'XTR')
  assert.equal(call.payload.prices[0].amount, pack.stars)
  payload = call.payload.payload
  assert.equal(payload, `${pack.id}:${playerId}`)
})

await test('webhook rejects a wrong secret', async () => {
  const res = await webhook({}, 'nope')
  assert.equal(res.status, 403)
})

await test('pre-checkout is approved for a valid payment', async () => {
  await webhook({
    pre_checkout_query: {
      id: 'q1',
      from: { id: TG_ID },
      currency: 'XTR',
      total_amount: pack.stars,
      invoice_payload: payload,
    },
  })
  const call = telegramCalls.filter((c) => c.method === 'answerPreCheckoutQuery').pop()!
  assert.equal(call.payload.ok, true)
})

await test('pre-checkout is declined for a wrong amount or another user', async () => {
  for (const [from, amount] of [
    [TG_ID, pack.stars - 1],
    [999, pack.stars],
  ]) {
    await webhook({
      pre_checkout_query: {
        id: 'q2',
        from: { id: from },
        currency: 'XTR',
        total_amount: amount,
        invoice_payload: payload,
      },
    })
    const call = telegramCalls.filter((c) => c.method === 'answerPreCheckoutQuery').pop()!
    assert.equal(call.payload.ok, false)
  }
})

const payment = (chargeId: string) => ({
  message: {
    from: { id: TG_ID },
    successful_payment: {
      currency: 'XTR',
      total_amount: pack.stars,
      invoice_payload: payload,
      telegram_payment_charge_id: chargeId,
    },
  },
})
const currentBalance = async () =>
  (
    (await (
      await post('/api/game', { action: 'state', initData: await initData(TG_ID) })
    ).json()) as any
  ).player.balance as number

await test('a successful payment credits the crystals', async () => {
  await webhook(payment('charge-1'))
  assert.equal(await currentBalance(), balance + pack.crystals)
})

await test('a repeated delivery does not credit twice', async () => {
  await webhook(payment('charge-1'))
  assert.equal(await currentBalance(), balance + pack.crystals)
})

await test('a payment with a wrong amount credits nothing', async () => {
  const bad = payment('charge-2')
  bad.message.successful_payment.total_amount = 1
  await webhook(bad)
  assert.equal(await currentBalance(), balance + pack.crystals)
})

console.log(`${passed} passed`)
