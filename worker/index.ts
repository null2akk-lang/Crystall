import { handleAdmin } from './admin'
import { handleGame } from './game'
import { json } from './util'
import type { Env } from './types'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/game') return handleGame(request, env)
    if (pathname === '/api/admin') return handleAdmin(request, env)
    if (pathname.startsWith('/api/')) return json({ error: 'Не найдено' }, 404)
    // Everything else is the built web app (normally served before reaching this code).
    return env.ASSETS.fetch(request)
  },
}
