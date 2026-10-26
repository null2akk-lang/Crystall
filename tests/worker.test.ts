// Run: node --import tsx tests/worker.test.ts   (needs Node 22.13+; tsx comes from devDependencies)
import assert from 'node:assert/strict'
import worker from '../worker/index'
import { cases, skins } from '../src/lib/game'
import { createD1 } from './d1-shim'
import type { Env } from '../worker/types'

const db = createD1()
const env: Env = {
  DB: db,
  ASSETS: { fetch: async () => new Response('asset') },
}
const ORIGIN = 'https://game.test'

class Client {
  jar = new Map<string, string>()
  constructor(public ip = '1.1.1.1') {}
  async post(path: string, body: unknown) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      'CF-Connecting-IP': this.ip,
    }
    if (this.jar.size)
      headers.Cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ')
    const res = await worker.fetch(
      new Request(ORIGIN + path, { method: 'POST', headers, body: JSON.stringify(body) }),
      env,
    )
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split('; ')
      const [k, v] = pair.split('=')
      if (attrs.includes('Max-Age=0')) this.jar.delete(k)
      else this.jar.set(k, v)
    }
    return { status: res.status, data: (await res.json()) as any, res }
  }
  game(body: Record<string, unknown>) {
    return this.post('/api/game', body)
  }
  admin(body: Record<string, unknown>) {
    return this.post('/api/admin', body)
  }
}

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

const cheap = [...cases].sort((a, b) => a.price - b.price)[0]
const alice = new Client('10.0.0.1')
const bob = new Client('10.0.0.2')
let aliceId = ''
let bobId = ''

await test('new guest gets 1000 crystals and a cookie', async () => {
  const r = await alice.game({ action: 'state' })
  assert.equal(r.status, 200)
  assert.equal(r.data.player.balance, 1000)
  assert.equal(r.data.welcome, true)
  assert.deepEqual(r.data.player.inventory, [])
  assert.ok(alice.jar.get('crystal_player'))
  aliceId = r.data.player.id
})
await test('returning guest is the same profile, no second welcome', async () => {
  const r = await alice.game({ action: 'state' })
  assert.equal(r.data.player.id, aliceId)
  assert.equal(r.data.welcome, false)
})
await test('referral gives the inviter 5000 once', async () => {
  const r = await bob.game({ action: 'state', ref: aliceId })
  bobId = r.data.player.id
  assert.equal(r.data.player.balance, 1000)
  await bob.game({ action: 'state', ref: aliceId }) // same profile again
  const a = await alice.game({ action: 'state' })
  assert.equal(a.data.player.balance, 6000)
  assert.equal(a.data.player.referrals, 1)
  const stranger = new Client('10.0.0.9')
  await stranger.game({ action: 'state', ref: '11111111-2222-4333-8444-555555555555' })
  const c = new Client('10.0.0.8')
  const sr = await c.game({ action: 'state', ref: 'not-an-id' })
  assert.equal(sr.data.player.balance, 1000)
})
await test('open a case spends crystals and adds a skin', async () => {
  const before = (await alice.game({ action: 'state' })).data.player.balance
  const r = await alice.game({ action: 'open', caseId: cheap.id })
  assert.equal(r.status, 200)
  assert.equal(r.data.player.balance, before - cheap.price)
  assert.equal(r.data.player.inventory.length, 1)
  assert.equal(r.data.outcome.skin, r.data.player.inventory[0].skin)
})
await test('not enough crystals is a clean 400', async () => {
  const poor = new Client('10.0.0.7')
  const first = await poor.game({ action: 'state' })
  const priciest = [...cases].sort((a, b) => b.price - a.price)[0]
  assert.ok(priciest.price > first.data.player.balance)
  const r = await poor.game({ action: 'open', caseId: priciest.id })
  assert.equal(r.status, 400)
  assert.match(r.data.error, /^Недостаточно/)
  assert.equal((await poor.game({ action: 'open', caseId: 'nope' })).status, 400)
  assert.equal((await poor.game({ action: 'hack' })).status, 400)
})
await test('sell returns the skin value', async () => {
  const state = (await alice.game({ action: 'state' })).data.player
  const item = state.inventory[0]
  const value = skins.find((s) => s.id === item.skin)!.value
  const r = await alice.game({ action: 'sell', uid: item.uid })
  assert.equal(r.data.player.balance, state.balance + value)
  assert.equal(r.data.player.inventory.length, 0)
  assert.equal((await alice.game({ action: 'sell', uid: item.uid })).status, 400)
})
await test('upgrade consumes the skin and may produce the target', async () => {
  let r = await alice.game({ action: 'open', caseId: cheap.id })
  const item = r.data.player.inventory[0]
  const source = skins.find((s) => s.id === item.skin)!
  const target = [...skins].sort((a, b) => b.value - a.value).find((s) => s.value > source.value)!
  r = await alice.game({ action: 'upgrade', uid: item.uid, target: target.id })
  assert.equal(r.status, 200)
  assert.equal(r.data.player.inventory.length, r.data.outcome.won ? 1 : 0)
  if (r.data.outcome.won) assert.equal(r.data.player.inventory[0].skin, target.id)
  r = await alice.game({ action: 'upgrade', uid: 'x', target: target.id })
  assert.equal(r.status, 400)
})
await test('hidden promo: works once, any case, wrong code rejected', async () => {
  const p = new Client('10.0.0.5')
  await p.game({ action: 'state' })
  assert.equal((await p.game({ action: 'promo', code: 'nope' })).status, 400)
  const ok = await p.game({ action: 'promo', code: ' gigasquad ' })
  assert.equal(ok.status, 200)
  assert.equal(ok.data.player.balance, 11000)
  assert.ok(!/GigaSquad/i.test(ok.data.outcome.title))
  const again = await p.game({ action: 'promo', code: 'GigaSquad' })
  assert.equal(again.status, 400)
  assert.match(again.data.error, /уже активирован/)
})
await test('parallel promo requests credit exactly once', async () => {
  const p = new Client('10.0.0.6')
  await p.game({ action: 'state' })
  const rs = await Promise.all(Array.from({ length: 6 }, () => p.game({ action: 'promo', code: 'GigaSquad' })))
  assert.equal(rs.filter((r) => r.status === 200).length, 1)
  assert.equal((await p.game({ action: 'state' })).data.player.balance, 11000)
})
await test('parallel case openings never lose or duplicate crystals', async () => {
  const p = new Client('10.0.0.4')
  await p.game({ action: 'state' })
  await p.game({ action: 'promo', code: 'GigaSquad' }) // 11000
  const rs = await Promise.all(Array.from({ length: 5 }, () => p.game({ action: 'open', caseId: cheap.id })))
  const ok = rs.filter((r) => r.status === 200).length
  const s = (await p.game({ action: 'state' })).data.player
  assert.equal(s.balance, 11000 - ok * cheap.price)
  assert.equal(s.inventory.length, ok)
  assert.equal(ok, 5)
})
await test('cross-site game request is refused', async () => {
  const res = await worker.fetch(
    new Request(ORIGIN + '/api/game', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' }, body: '{}' }),
    env,
  )
  assert.equal(res.status, 403)
})

// ---------- developer panel ----------
const dev = alice
await test('admin: needs login; wrong code rejected', async () => {
  assert.equal((await dev.admin({ action: 'players' })).status, 401)
  const bad = await dev.admin({ action: 'login', code: 'wrong' })
  assert.equal(bad.status, 401)
  const nocookie = await new Client('9.9.9.9').admin({ action: 'login', code: 'Sundet_2010' })
  assert.equal(nocookie.status, 401) // no game session yet
})
await test('admin: Sundet_2010 opens the panel', async () => {
  const r = await dev.admin({ action: 'login', code: 'Sundet_2010' })
  assert.equal(r.status, 200)
  assert.equal(r.data.authorized, true)
  assert.ok(dev.jar.get('crystal_admin'))
  assert.equal((await dev.admin({ action: 'status' })).data.authorized, true)
})
await test('admin: foreign origin is refused', async () => {
  const res = await worker.fetch(
    new Request(ORIGIN + '/api/admin', { method: 'POST', headers: { Origin: 'https://evil.test' }, body: '{}' }),
    env,
  )
  assert.equal(res.status, 403)
})
await test('admin: players list, search, details', async () => {
  const r = await dev.admin({ action: 'players' })
  assert.equal(r.status, 200)
  assert.ok(r.data.stats.total >= 5)
  assert.equal(r.data.stats.banned, 0)
  assert.ok(r.data.players.some((p: any) => p.id === bobId))
  const found = await dev.admin({ action: 'players', search: bobId.slice(0, 8) })
  assert.equal(found.data.players.length, 1)
  const d = await dev.admin({ action: 'player', recipient: bobId })
  assert.equal(d.data.player.id, bobId)
  assert.ok(Array.isArray(d.data.player.inventory))
  assert.equal(typeof d.data.player.created_at, 'string')
  assert.equal((await dev.admin({ action: 'player', recipient: '11111111-2222-3333-4444-555555555555' })).status, 400)
})
await test('admin: crystal grant is applied once per request id', async () => {
  const rid = crypto.randomUUID()
  const before = (await bob.game({ action: 'state' })).data.player.balance
  const a = await dev.admin({ action: 'grant', recipient: bobId, amount: 777, requestId: rid })
  const b = await dev.admin({ action: 'grant', recipient: bobId, amount: 777, requestId: rid })
  assert.equal(a.status, 200)
  assert.equal(b.status, 200)
  assert.equal((await bob.game({ action: 'state' })).data.player.balance, before + 777)
  const clash = await dev.admin({ action: 'grant', recipient: bobId, amount: 5, requestId: rid })
  assert.equal(clash.status, 400)
  assert.equal((await dev.admin({ action: 'grant', recipient: bobId, amount: 0, requestId: crypto.randomUUID() })).status, 400)
  assert.equal((await dev.admin({ action: 'grant', recipient: bobId, amount: 2e9, requestId: crypto.randomUUID() })).status, 400)
})
await test('admin: grant races with the player without losing crystals', async () => {
  const before = (await bob.game({ action: 'state' })).data.player.balance
  const jobs = [
    dev.admin({ action: 'grant', recipient: bobId, amount: 100, requestId: crypto.randomUUID() }),
    bob.game({ action: 'promo', code: 'GigaSquad' }),
    dev.admin({ action: 'grant', recipient: bobId, amount: 200, requestId: crypto.randomUUID() }),
  ]
  const rs = await Promise.all(jobs)
  assert.ok(rs.every((r) => r.status === 200))
  assert.equal((await bob.game({ action: 'state' })).data.player.balance, before + 300 + 10000)
})
await test('admin: give skins (idempotent, validated)', async () => {
  const rid = crypto.randomUUID()
  const skin = skins[3].id
  const a = await dev.admin({ action: 'give_skin', recipient: bobId, skin, count: 3, requestId: rid })
  const b = await dev.admin({ action: 'give_skin', recipient: bobId, skin, count: 3, requestId: rid })
  assert.equal(a.status, 200)
  assert.equal(b.status, 200)
  const inv = (await bob.game({ action: 'state' })).data.player.inventory
  assert.equal(inv.filter((i: any) => i.skin === skin).length, 3)
  assert.equal(new Set(inv.map((i: any) => i.uid)).size, inv.length)
  assert.equal((await dev.admin({ action: 'give_skin', recipient: bobId, skin: 'nope', count: 1, requestId: crypto.randomUUID() })).status, 400)
  assert.equal((await dev.admin({ action: 'give_skin', recipient: bobId, skin, count: 11, requestId: crypto.randomUUID() })).status, 400)
  const sold = await bob.game({ action: 'sell', uid: inv[0].uid })
  assert.equal(sold.status, 200)
})
await test('admin: journal lists actions', async () => {
  const r = await dev.admin({ action: 'status' })
  const types = new Set(r.data.journal.map((j: any) => j.type))
  assert.ok(types.has('crystals') && types.has('skin'))
  assert.equal(typeof r.data.journal[0].created_at, 'string')
})
await test('admin: permanent ban blocks the game, unban restores it', async () => {
  const r = await dev.admin({ action: 'ban', recipient: bobId, mode: 'permanent', reason: 'тест' })
  assert.equal(r.status, 200)
  const blocked = await bob.game({ action: 'state' })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.data.banned, true)
  assert.equal(blocked.data.permanent, true)
  assert.equal(blocked.data.reason, 'тест')
  assert.equal((await bob.game({ action: 'open', caseId: cheap.id })).status, 403)
  const list = await dev.admin({ action: 'players' })
  assert.equal(list.data.stats.banned, 1)
  const d = await dev.admin({ action: 'player', recipient: bobId })
  assert.equal(d.data.player.ban_permanent, true)
  await dev.admin({ action: 'unban', recipient: bobId })
  assert.equal((await bob.game({ action: 'state' })).status, 200)
})
await test('admin: temporary ban counts down and expires', async () => {
  const r = await dev.admin({ action: 'ban', recipient: bobId, mode: 'temporary', minutes: 60 })
  assert.equal(r.status, 200)
  const blocked = await bob.game({ action: 'state' })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.data.permanent, false)
  assert.ok(blocked.data.seconds > 3500 && blocked.data.seconds <= 3600)
  const d = await dev.admin({ action: 'player', recipient: bobId })
  assert.ok(d.data.player.ban_seconds > 3500)
  await db.prepare('UPDATE players SET banned_until = ? WHERE id = ?').bind(Math.floor(Date.now() / 1000) - 5, bobId).run()
  assert.equal((await bob.game({ action: 'state' })).status, 200)
  assert.equal((await dev.admin({ action: 'ban', recipient: bobId, mode: 'temporary', minutes: 0 })).status, 400)
  assert.equal((await dev.admin({ action: 'ban', recipient: bobId, mode: 'weird' })).status, 400)
})
await test('admin: cannot ban yourself', async () => {
  assert.equal((await dev.admin({ action: 'ban', recipient: aliceId, mode: 'permanent' })).status, 400)
})
await test('admin: logout closes the session', async () => {
  await dev.admin({ action: 'logout' })
  assert.equal((await dev.admin({ action: 'players' })).status, 401)
})
await test('admin: login attempts are rate limited (5 per 15 min)', async () => {
  const c = new Client('7.7.7.7')
  await c.game({ action: 'state' })
  const codes: number[] = []
  for (let i = 0; i < 7; i++) codes.push((await c.admin({ action: 'login', code: 'x' + i })).status)
  assert.deepEqual(codes, [401, 401, 401, 401, 401, 429, 429])
  assert.equal((await c.admin({ action: 'login', code: 'Sundet_2010' })).status, 429)
})
await test('CRYSTAL_ADMIN_CODE overrides the built-in code', async () => {
  const c = new Client('6.6.6.6')
  await c.game({ action: 'state' })
  env.CRYSTAL_ADMIN_CODE = 'other-secret'
  assert.equal((await c.admin({ action: 'login', code: 'Sundet_2010' })).status, 401)
  assert.equal((await c.admin({ action: 'login', code: 'other-secret' })).status, 200)
  delete env.CRYSTAL_ADMIN_CODE
})
await test('static files fall through to ASSETS, unknown api is 404', async () => {
  const res = await worker.fetch(new Request(ORIGIN + '/index.html'), env)
  assert.equal(await res.text(), 'asset')
  assert.equal((await worker.fetch(new Request(ORIGIN + '/api/zzz'), env)).status, 404)
  assert.equal((await worker.fetch(new Request(ORIGIN + '/api/game'), env)).status, 405)
})
console.log(process.exitCode ? 'SOME TESTS FAILED' : `all ${passed} tests passed`)
