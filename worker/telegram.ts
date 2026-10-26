import { hmacRaw, nowSec, safeEqual, toHex } from './util'

export type TelegramUser = {
  id: number
  username: string | null
  name: string | null
  photo: string | null
  /** True only when the signature was checked with the bot token. */
  verified: boolean
}

const MAX_AGE_SECONDS = 24 * 60 * 60

const text = (value: unknown, max: number): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null

/**
 * Reads the player's Telegram profile from `Telegram.WebApp.initData`.
 * With a bot token the signature is checked (a forged profile is rejected);
 * without one the data is accepted as is, which is fine for display only.
 */
export async function parseInitData(
  raw: unknown,
  botToken?: string,
): Promise<TelegramUser | null> {
  if (typeof raw !== 'string' || !raw || raw.length > 8192) return null
  const params = new URLSearchParams(raw)
  const userJson = params.get('user')
  if (!userJson) return null
  if (botToken) {
    const hash = params.get('hash')
    if (!hash) return null
    params.delete('hash')
    const data = [...params.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    const secret = await hmacRaw('WebAppData', botToken)
    const signature = toHex(await hmacRaw(secret, data))
    if (!(await safeEqual(signature, hash.toLowerCase()))) return null
    const authDate = Number(params.get('auth_date'))
    if (!Number.isFinite(authDate) || nowSec() - authDate > MAX_AGE_SECONDS)
      return null
  }
  try {
    const user = JSON.parse(userJson) as Record<string, unknown>
    if (!Number.isSafeInteger(user.id) || (user.id as number) <= 0) return null
    const username = text(user.username, 64)
    const name = [text(user.first_name, 64), text(user.last_name, 64)]
      .filter(Boolean)
      .join(' ')
    const photo = text(user.photo_url, 300)
    return {
      id: user.id as number,
      username: username && /^[A-Za-z0-9_]+$/.test(username) ? username : null,
      name: name || null,
      photo: photo && /^https:\/\//i.test(photo) ? photo : null,
      verified: Boolean(botToken),
    }
  } catch {
    return null
  }
}
