import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Ban, Copy, Gem, Gift, RefreshCw, Search } from 'lucide-react'
import { format, skinById, skins, type Item } from '../lib/game'

type PlayerRow = {
  id: string
  balance: number
  referrals: number
  created_at: string
  last_seen: string | null
  items: number
  ban_permanent: boolean
  ban_reason: string | null
  ban_seconds: number
  inventory?: Item[]
}
export type JournalRow = {
  id: string
  type: 'crystals' | 'skin' | 'ban' | 'unban'
  target: string
  details: {
    amount?: number
    skin?: string
    count?: number
    permanent?: boolean
    minutes?: number
    reason?: string
  }
  created_at: string
}
type Stats = { total: number; banned: number }

const DURATIONS = [
  { label: '1 час', minutes: 60 },
  { label: '6 часов', minutes: 360 },
  { label: '24 часа', minutes: 1440 },
  { label: '3 дня', minutes: 4320 },
  { label: '7 дней', minutes: 10080 },
  { label: '30 дней', minutes: 43200 },
  { label: 'Навсегда', minutes: 0 },
]
const skinOptions = [...skins].sort((a, b) => a.value - b.value)
const skinLabel = (id: string) => {
  const s = skins.find((x) => x.id === id)
  return s ? `${s.weapon} | ${s.name}` : id
}
const short = (id: string) => id.slice(0, 8)
const isBanned = (p: PlayerRow) => p.ban_permanent || p.ban_seconds > 0
function duration(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.ceil((seconds % 3600) / 60)
  if (d) return `${d} д ${h} ч`
  if (h) return `${h} ч ${m} мин`
  return `${m} мин`
}
function banLabel(p: PlayerRow) {
  if (p.ban_permanent) return 'Бан навсегда'
  return `Бан: ещё ${duration(p.ban_seconds)}`
}
function minutesLabel(minutes: number) {
  if (minutes % 1440 === 0) return `${minutes / 1440} д`
  if (minutes % 60 === 0) return `${minutes / 60} ч`
  return `${minutes} мин`
}
function journalText(row: JournalRow) {
  const d = row.details || {}
  if (row.type === 'crystals') return `+${format(d.amount ?? 0)} кристаллов`
  if (row.type === 'skin')
    return `Скин: ${skinLabel(d.skin ?? '')}${d.count && d.count > 1 ? ` ×${d.count}` : ''}`
  if (row.type === 'ban')
    return `${d.permanent ? 'Бан навсегда' : `Бан на ${minutesLabel(d.minutes ?? 0)}`}${d.reason ? ` · ${d.reason}` : ''}`
  return 'Разблокировка'
}

export function AdminPanel({
  ownId,
  initialJournal,
  onLogout,
  onUnauthorized,
  onOwnChange,
}: {
  ownId?: string
  initialJournal: JournalRow[]
  onLogout: () => void
  onUnauthorized: () => void
  onOwnChange: () => void
}) {
  const [tab, setTab] = useState<'players' | 'journal'>('players')
  const [search, setSearch] = useState('')
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState<PlayerRow | null>(null)
  const [journal, setJournal] = useState<JournalRow[]>(initialJournal)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [amount, setAmount] = useState('')
  const [skin, setSkin] = useState(skinOptions[0].id)
  const [count, setCount] = useState('1')
  const [banMinutes, setBanMinutes] = useState('1440')
  const [reason, setReason] = useState('')
  const request = useRef<{ signature: string; id: string } | null>(null)
  const unauthorized = useRef(onUnauthorized)
  unauthorized.current = onUnauthorized

  const api = useCallback(
    async (action: string, data: Record<string, unknown> = {}) => {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 401) unauthorized.current()
        throw new Error(result.error || 'Не удалось выполнить операцию')
      }
      if (result.journal) setJournal(result.journal)
      return result
    },
    [],
  )

  const loadPlayers = useCallback(
    async (query: string, offset = 0) => {
      setBusy(true)
      try {
        const result = await api('players', { search: query, offset })
        setPlayers((old) =>
          offset ? [...old, ...result.players] : result.players,
        )
        setStats(result.stats)
        setHasMore(result.hasMore)
      } catch (e) {
        setFailed(true)
        setMessage(e instanceof Error ? e.message : 'Ошибка соединения')
      } finally {
        setBusy(false)
      }
    },
    [api],
  )

  useEffect(() => {
    void loadPlayers('')
  }, [loadPlayers])

  async function openPlayer(id: string) {
    setBusy(true)
    setMessage('')
    try {
      const result = await api('player', { recipient: id })
      setSelected(result.player)
    } catch (e) {
      setFailed(true)
      setMessage(e instanceof Error ? e.message : 'Ошибка соединения')
    } finally {
      setBusy(false)
    }
  }

  // Runs one operator action on the selected player and refreshes the card.
  async function act(
    action: string,
    data: Record<string, unknown>,
    success: string,
    idempotent = false,
  ): Promise<boolean> {
    if (!selected) return false
    setBusy(true)
    setMessage('')
    setFailed(false)
    try {
      const signature = `${action}:${selected.id}:${JSON.stringify(data)}`
      if (idempotent && request.current?.signature !== signature)
        request.current = { signature, id: crypto.randomUUID() }
      await api(action, {
        recipient: selected.id,
        ...data,
        requestId: idempotent ? request.current?.id : undefined,
      })
      request.current = null
      const fresh = await api('player', { recipient: selected.id })
      setSelected(fresh.player)
      setPlayers((old) =>
        old.map((p) => (p.id === fresh.player.id ? fresh.player : p)),
      )
      setMessage(success)
      if (selected.id === ownId) onOwnChange()
      void api('status').catch(() => {})
      void loadStats()
      return true
    } catch (e) {
      setFailed(true)
      setMessage(
        e instanceof Error
          ? e.message
          : 'Ошибка соединения. Повторите с теми же данными.',
      )
      return false
    } finally {
      setBusy(false)
    }
  }
  async function loadStats() {
    try {
      const result = await api('players', { search: '', offset: 0 })
      setStats(result.stats)
    } catch {
      /* stats are optional */
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setFailed(false)
      setMessage('ID скопирован.')
    } catch {
      setFailed(true)
      setMessage('Не удалось скопировать. Выделите ID вручную.')
    }
  }

  const inventoryCounts = selected?.inventory
    ? Object.entries(
        selected.inventory.reduce<Record<string, number>>((acc, i) => {
          acc[i.skin] = (acc[i.skin] ?? 0) + 1
          return acc
        }, {}),
      )
    : []
  const banNumber = Number(banMinutes)

  return (
    <div className="dev-panel">
      <div className="dev-stats">
        <div>
          <b>{stats ? format(stats.total) : '…'}</b>
          <span>игроков</span>
        </div>
        <div>
          <b>{stats ? format(stats.banned) : '…'}</b>
          <span>в бане</span>
        </div>
      </div>

      {selected ? (
        <div className="dev-detail">
          <button
            className="dev-back"
            onClick={() => {
              setSelected(null)
              setMessage('')
            }}
          >
            <ArrowLeft size={15} /> К списку игроков
          </button>
          <div className="dev-id">
            <code>{selected.id}</code>
            <button
              aria-label="Скопировать ID"
              onClick={() => void copy(selected.id)}
            >
              <Copy size={15} />
            </button>
          </div>
          {isBanned(selected) && (
            <div className="dev-ban-box">
              <strong>{banLabel(selected)}</strong>
              {selected.ban_reason && <span>Причина: {selected.ban_reason}</span>}
              <button
                className="secondary full"
                disabled={busy}
                onClick={() => void act('unban', {}, 'Игрок разблокирован.')}
              >
                Разблокировать
              </button>
            </div>
          )}
          <dl className="dev-facts">
            <div>
              <dt>Баланс</dt>
              <dd>
                {format(selected.balance)} <Gem size={13} />
              </dd>
            </div>
            <div>
              <dt>Скинов</dt>
              <dd>{selected.items}</dd>
            </div>
            <div>
              <dt>Приглашено</dt>
              <dd>{selected.referrals}</dd>
            </div>
            <div>
              <dt>Последний вход</dt>
              <dd>
                {selected.last_seen
                  ? new Date(selected.last_seen).toLocaleString('ru-RU')
                  : 'нет данных'}
              </dd>
            </div>
          </dl>

          <form
            className="dev-block"
            onSubmit={(e) => {
              e.preventDefault()
              void act(
                'grant',
                { amount: Number(amount) },
                `Начислено ${format(Number(amount))} кристаллов.`,
                true,
              ).then((ok) => ok && setAmount(''))
            }}
          >
            <h4>Выдать кристаллы</h4>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={1000000}
              step={1}
              placeholder="от 1 до 1 000 000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <button className="primary full" disabled={busy || !amount}>
              Начислить <Gem size={16} />
            </button>
          </form>

          <form
            className="dev-block"
            onSubmit={(e) => {
              e.preventDefault()
              void act(
                'give_skin',
                { skin, count: Number(count) },
                `Выдано: ${skinLabel(skin)} ×${count}.`,
                true,
              )
            }}
          >
            <h4>Выдать скин</h4>
            <select value={skin} onChange={(e) => setSkin(e.target.value)}>
              {skinOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.weapon} | {s.name} — {format(s.value)}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              step={1}
              aria-label="Количество"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
            />
            <button className="primary full" disabled={busy || !count}>
              Выдать скин <Gift size={16} />
            </button>
          </form>

          {!isBanned(selected) && selected.id !== ownId && (
            <form
              className="dev-block danger"
              onSubmit={(e) => {
                e.preventDefault()
                const permanent = banNumber === 0
                if (
                  !window.confirm(
                    permanent
                      ? 'Заблокировать игрока навсегда?'
                      : `Заблокировать игрока на ${minutesLabel(banNumber)}?`,
                  )
                )
                  return
                void act(
                  'ban',
                  {
                    mode: permanent ? 'permanent' : 'temporary',
                    minutes: banNumber,
                    reason,
                  },
                  permanent
                    ? 'Игрок заблокирован навсегда.'
                    : `Игрок заблокирован на ${minutesLabel(banNumber)}.`,
                ).then((ok) => ok && setReason(''))
              }}
            >
              <h4>Блокировка</h4>
              <select
                value={banMinutes}
                onChange={(e) => setBanMinutes(e.target.value)}
              >
                {DURATIONS.map((d) => (
                  <option key={d.minutes} value={d.minutes}>
                    {d.label}
                  </option>
                ))}
              </select>
              <input
                value={reason}
                maxLength={200}
                placeholder="Причина (её увидит игрок)"
                onChange={(e) => setReason(e.target.value)}
              />
              <button className="primary full danger-button" disabled={busy}>
                Заблокировать <Ban size={16} />
              </button>
            </form>
          )}

          {inventoryCounts.length > 0 && (
            <div className="dev-block">
              <h4>Инвентарь</h4>
              <ul className="dev-inventory">
                {inventoryCounts.map(([id, n]) => (
                  <li key={id}>
                    <span>{skinLabel(id)}</span>
                    <b>×{n}</b>
                    <small>{format(skinById(id)?.value ?? 0)}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="dev-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'players'}
              className={tab === 'players' ? 'active' : ''}
              onClick={() => setTab('players')}
            >
              Игроки
            </button>
            <button
              role="tab"
              aria-selected={tab === 'journal'}
              className={tab === 'journal' ? 'active' : ''}
              onClick={() => setTab('journal')}
            >
              Журнал
            </button>
          </div>

          {tab === 'players' ? (
            <>
              <form
                className="dev-search"
                onSubmit={(e) => {
                  e.preventDefault()
                  void loadPlayers(search.trim())
                }}
              >
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ID игрока (начало или целиком)"
                  autoComplete="off"
                />
                <button aria-label="Найти" className="secondary" disabled={busy}>
                  <Search size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Обновить"
                  className="secondary"
                  disabled={busy}
                  onClick={() => void loadPlayers(search.trim())}
                >
                  <RefreshCw size={16} />
                </button>
              </form>
              {ownId && (
                <button
                  className="text-button"
                  onClick={() => {
                    setSearch(ownId)
                    void loadPlayers(ownId)
                  }}
                >
                  Найти мой профиль
                </button>
              )}
              <ul className="dev-list">
                {players.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => void openPlayer(p.id)}>
                      <code>{short(p.id)}</code>
                      <span className="dev-balance">
                        {format(p.balance)} <Gem size={12} />
                      </span>
                      <span className="dev-items">{p.items} ск.</span>
                      {isBanned(p) && <em className="dev-badge">бан</em>}
                      {p.id === ownId && <em className="dev-badge me">вы</em>}
                      <small>
                        {new Date(p.last_seen ?? p.created_at).toLocaleString(
                          'ru-RU',
                          { dateStyle: 'short', timeStyle: 'short' },
                        )}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
              {!players.length && !busy && (
                <p className="muted">Игроков не найдено.</p>
              )}
              {hasMore && (
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void loadPlayers(search.trim(), players.length)}
                >
                  Показать ещё
                </button>
              )}
              <p className="modal-note">
                Список отсортирован по последней активности. Нажмите на игрока,
                чтобы выдать кристаллы или скин и управлять блокировкой.
              </p>
            </>
          ) : (
            <ul className="dev-journal">
              {journal.length ? (
                journal.map((row) => (
                  <li key={`${row.type}-${row.id}`}>
                    <span>{journalText(row)}</span>
                    <code>{short(row.target)}</code>
                    <small>
                      {new Date(row.created_at).toLocaleString('ru-RU')}
                    </small>
                  </li>
                ))
              ) : (
                <li className="muted">Действий пока нет.</li>
              )}
            </ul>
          )}
        </>
      )}

      {message && (
        <p
          className={failed ? 'inline-error' : 'admin-message'}
          role={failed ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
      <button className="secondary full" disabled={busy} onClick={onLogout}>
        Выйти из управления
      </button>
    </div>
  )
}
