import { useEffect, useRef, useState } from 'react'
import {
  Box,
  ArrowUpRight,
  Gem,
  Gift,
  Users,
  Backpack,
  X,
  Copy,
  Check,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Ban,
} from 'lucide-react'
import {
  cases,
  skins,
  skinById,
  format,
  chanceTier,
  tierInfo,
  upgradeChance,
  type Player,
  type Tier,
} from './lib/game'
import { AdminPanel, type JournalRow } from './components/admin-panel'

type Tab = 'cases' | 'upgrade' | 'inventory'
type Outcome = { title: string; skin?: string; won?: boolean }

function Weapon({
  skin = 'ember',
  className = '',
}: {
  skin?: string
  className?: string
}) {
  const item = skinById(skin)
  // A failed download is retried (with a cache-busting suffix) before giving up.
  const [attempt, setAttempt] = useState(0)
  useEffect(() => setAttempt(0), [item.image])
  if (attempt > 3)
    return (
      <span
        className={`weapon weapon-missing ${className}`}
        role="img"
        aria-label={`${item.weapon} | ${item.name}`}
      >
        {item.weapon}
      </span>
    )
  return (
    <img
      className={`weapon ${className}`}
      src={attempt ? `${item.image}?retry=${attempt}` : item.image}
      alt={`${item.weapon} | ${item.name}`}
      width={420}
      height={280}
      decoding="async"
      onError={() => setTimeout(() => setAttempt((n) => n + 1), 500 * (attempt + 1))}
    />
  )
}
function CaseArt({ color, index }: { color: string; index: number }) {
  return (
    <div
      className="case-art"
      style={{ '--case': color } as React.CSSProperties}
    >
      <div className="case-halo" />
      <Weapon skin={['slate', 'toxic', 'pulse', 'karambit'][index]} />
      <svg
        className="crate"
        viewBox="0 0 320 160"
        fill="none"
        aria-hidden="true"
      >
        <path d="M55 42L191 23L269 59L134 83Z" fill="#444a4e" stroke={color} />
        <path d="M55 42L134 83V142L55 99Z" fill="#22292f" stroke="#67716f" />
        <path d="M134 83L269 59V116L134 142Z" fill="#333c40" stroke={color} />
        <path d="M65 56L123 87V121L65 93Z" fill="#303a3e" />
        <path d="M144 91L258 70V105L144 129Z" fill="#192228" />
        <path
          d="M77 39L153 78L154 137M171 27L248 63L248 120"
          stroke={color}
          strokeWidth="9"
          opacity=".65"
        />
        <path d="M187 87L202 77L216 82L216 99L201 110L187 104Z" fill={color} />
        <path d="M193 90L201 84L210 87L202 101Z" fill="#27352a" />
        <path d="M52 96L135 140L271 114" stroke="#8b9595" strokeWidth="3" />
      </svg>
      <span className="case-serial">CD / 0{index + 1}</span>
    </div>
  )
}
export function Home() {
  const [tab, setTab] = useState<Tab>('cases')
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [boxId, setBoxId] = useState<string | null>(null)
  const [modal, setModal] = useState<'invite' | 'help' | 'promo' | null>(null)
  const [admin, setAdmin] = useState(false)
  const [code, setCode] = useState('')
  const [adminBusy, setAdminBusy] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')
  const [journal, setJournal] = useState<JournalRow[]>([])
  const [ban, setBan] = useState<{
    permanent: boolean
    until: number
    reason: string
  } | null>(null)
  const [reel, setReel] = useState<string[] | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [selected, setSelected] = useState('')
  const [target, setTarget] = useState('')
  const [copied, setCopied] = useState(false)
  const [tier, setTier] = useState<Tier | 'all'>('all')
  const [wheel, setWheel] = useState<{
    angle: number
    phase: 'idle' | 'wait' | 'spin'
  }>({ angle: 0, phase: 'idle' })
  const initialized = useRef(false)
  const dialogRef = useRef<HTMLElement>(null)
  const box = cases.find((c) => c.id === boxId)
  const item = player?.inventory.find((i) => i.uid === selected)
  const source = item ? skinById(item.skin) : null
  const targetSkin = skins.find((s) => s.id === target)
  const chance =
    source && targetSkin && targetSkin.value > source.value
      ? upgradeChance(source.value, targetSkin.value)
      : 0
  const targets = source
    ? skins
        .filter((s) => s.value > source.value)
        .map((s) => ({ skin: s, chance: upgradeChance(source.value, s.value) }))
    : skins.map((s) => ({ skin: s, chance: 0 }))
  const tierCount = (t: Tier) =>
    targets.filter((x) => chanceTier(x.chance) === t).length
  const shownTargets = source && tier !== 'all'
    ? targets.filter((x) => chanceTier(x.chance) === tier)
    : targets

  async function call(action: string, data: Record<string, unknown> = {}) {
    setError('')
    setBusy(true)
    if (action === 'upgrade') setWheel((w) => ({ ...w, phase: 'wait' }))
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ref: new URLSearchParams(window.location.search).get('ref'),
          // Signed Telegram profile data (empty outside Telegram).
          initData:
            (window as Window & { Telegram?: { WebApp?: { initData?: string } } })
              .Telegram?.WebApp?.initData || undefined,
          ...data,
        }),
      })
      const result = await res.json()
      if (res.status === 403 && result.banned) {
        setBan({
          permanent: Boolean(result.permanent),
          until: Date.now() + (result.seconds ?? 0) * 1000,
          reason: result.reason || '',
        })
        setModal(null)
        setBoxId(null)
        return
      }
      if (!res.ok)
        throw new Error(result.error || 'Не удалось выполнить действие')
      setBan(null)
      // After an upgrade the new inventory appears once the wheel has stopped.
      if (!(action === 'upgrade' && result.outcome)) setPlayer(result.player)
      if (result.welcome)
        setNotice('Добро пожаловать! На вашем балансе +1 000 кристаллов.')
      if (result.outcome) {
        if (action === 'open' && result.outcome.skin) {
          const openingBox = cases.find((c) => c.id === data.caseId)!
          const frames = Array.from({ length: 49 }, () => {
            const roll = Math.random() * 10000
            let total = 0
            return openingBox.drops.find((d) => {
              total += d.weight
              return roll < total
            })!.skin
          })
          frames[42] = result.outcome.skin
          setReel(frames)
          const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
          ).matches
          await new Promise((resolve) =>
            setTimeout(resolve, reduced ? 200 : 5400),
          )
          setReel(null)
        }
        if (action === 'upgrade') {
          const sector = chance * 3.6
          const win = Boolean(result.outcome.won)
          // The arrow stops inside the green sector on success, outside it on failure.
          const from = win ? sector * 0.12 : sector + (360 - sector) * 0.06
          const to = win ? sector * 0.88 : 360 - (360 - sector) * 0.06
          const stop = from + Math.random() * (to - from)
          const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
          ).matches
          setWheel((w) => ({
            angle: w.angle - (w.angle % 360) + 360 * 5 + stop,
            phase: 'spin',
          }))
          await new Promise((resolve) =>
            setTimeout(resolve, reduced ? 300 : 4800),
          )
          setPlayer(result.player)
        }
        if (action === 'promo') {
          setPromoCode('')
          setModal(null)
        }
        setOutcome(result.outcome)
        setBoxId(null)
        setSelected('')
        setTarget('')
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Ошибка соединения. Попробуйте ещё раз.',
      )
    } finally {
      setBusy(false)
      setLoading(false)
      setWheel((w) => ({ ...w, phase: 'idle' }))
    }
  }
  async function adminCall(action: 'login' | 'status' | 'logout') {
    setAdminBusy(true)
    setAdminMessage('')
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          code: action === 'login' ? code : undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 401) setAdmin(false)
        throw new Error(result.error || 'Не удалось выполнить операцию')
      }
      setAdmin(result.authorized)
      if (result.journal) setJournal(result.journal)
      if (action === 'login') {
        setCode('')
        setAdminMessage('Доступ открыт на 30 минут.')
      }
      if (action === 'logout') {
        setJournal([])
        setAdminMessage('Вы вышли из управления.')
      }
    } catch (e) {
      setAdminMessage(
        e instanceof Error
          ? e.message
          : 'Ошибка соединения. Повторите попытку.',
      )
    } finally {
      setAdminBusy(false)
    }
  }
  async function copyPlayerId() {
    if (!player) return
    try {
      await navigator.clipboard.writeText(player.id)
      setNotice('ID игрока скопирован.')
    } catch {
      setNotice('Выделите ID игрока и скопируйте вручную.')
    }
  }
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const telegram = (
      window as Window & {
        Telegram?: {
          WebApp?: {
            ready(): void
            expand(): void
            setHeaderColor(color: string): void
            setBackgroundColor(color: string): void
          }
        }
      }
    ).Telegram?.WebApp
    telegram?.ready()
    telegram?.expand()
    telegram?.setHeaderColor('#14161b')
    telegram?.setBackgroundColor('#111317')
    // Warm up all skin pictures so none of them pops in late (or not at all).
    for (const s of skins) new Image().src = s.image
    void call('state')
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 7000)
    return () => clearTimeout(timer)
  }, [notice])
  useEffect(() => {
    if (!modal && !box && !outcome) return
    const previousFocus = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled)',
        )
        if (elements?.length) {
          const first = elements[0],
            last = elements[elements.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }
      if (event.key === 'Escape' && !busy) {
        setModal(null)
        setBoxId(null)
        setOutcome(null)
      }
    }
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('keydown', close)
      document.body.style.overflow = oldOverflow
      previousFocus?.focus()
    }
  }, [modal, box, outcome, busy])
  function referralLink() {
    return `${window.location.origin}/?ref=${player?.id}`
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink())
      setCopied(true)
    } catch {
      setNotice('Не удалось скопировать. Выделите ссылку и скопируйте вручную.')
    }
  }
  const navigation = [
    { id: 'cases' as Tab, label: 'Кейсы', icon: Box },
    { id: 'upgrade' as Tab, label: 'Апгрейд', icon: ArrowUpRight },
    { id: 'inventory' as Tab, label: 'Инвентарь', icon: Backpack },
  ]
  if (ban) {
    return (
      <div className="ban-screen">
        <div className="ban-card">
          <Ban size={38} />
          <h1>Аккаунт заблокирован</h1>
          <p>
            {ban.permanent
              ? 'Блокировка бессрочная.'
              : `Блокировка действует до ${new Date(ban.until).toLocaleString('ru-RU')}.`}
          </p>
          {ban.reason && <p className="ban-reason">Причина: {ban.reason}</p>}
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void call('state')}
          >
            Проверить снова
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Crystal Drop — главная">
          <span className="brand-mark">
            <Gem size={26} />
          </span>
          <span>
            CRYSTAL
            <span className="brand-bottom">
              DROP<span className="brand-dot">.</span>
            </span>
          </span>
        </a>
        <div className="side-label">ИГРОВАЯ ЗОНА</div>
        <nav aria-label="Основная навигация">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setTab(n.id)
                setError('')
              }}
            >
              <n.icon size={20} />
              <span>{n.label}</span>
              {tab === n.id && <span className="nav-indicator" />}
            </button>
          ))}
          <button className="nav-item" onClick={() => setModal('invite')}>
            <Users size={20} />
            <span>Друзья</span>
            <span className="small-new">+5K</span>
          </button>
        </nav>
        <button
          className="nav-item"
          onClick={() => {
            setModal('promo')
            setAdminMessage('')
          }}
        >
          <Gift size={20} />
          <span>Промокоды</span>
        </button>
        <div className="side-promo">
          <Gift size={26} />
          <h3>Вместе — больше</h3>
          <p>
            Пригласи друга.
            <br />
            Забери 5 000 кристаллов.
          </p>
          <button onClick={() => setModal('invite')}>
            Пригласить <ArrowUpRight size={16} />
          </button>
        </div>
        <button className="help-link" onClick={() => setModal('help')}>
          <HelpCircle size={18} /> Как это работает
        </button>
        <div className="side-foot">
          <span className="status-dot" /> Игра без денежных ставок
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            Игровая зона <ChevronRight size={14} />
            <strong>{navigation.find((n) => n.id === tab)?.label}</strong>
          </div>
          <a className="mobile-brand" href="/">
            CRYSTAL DROP<span>.</span>
          </a>
          <div className="top-actions">
            <button
              className="gift-button"
              onClick={() => {
                setModal('promo')
                setAdminMessage('')
              }}
              aria-label="Промокоды и управление"
            >
              <Gift size={19} />
              <span>Промокоды</span>
            </button>
            <div className="balance">
              <Gem size={18} />
              <strong>{loading ? '…' : format(player?.balance ?? 0)}</strong>
              <span>кристаллов</span>
            </div>
            <div className="avatar" title="Гостевой профиль">
              P<span />
            </div>
          </div>
        </header>
        <main>
          <div className="page-kicker">
            <span className="status-dot" /> ТВОЯ КОЛЛЕКЦИЯ НАЧИНАЕТСЯ ЗДЕСЬ
          </div>
          {tab === 'cases' && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-eyebrow">
                    <span /> ОТКРЫВАЙ. СОБИРАЙ. УЛУЧШАЙ.
                  </div>
                  <h1>
                    Твой следующий
                    <br />
                    дроп — <em>легенда.</em>
                  </h1>
                  <p>
                    Открывай кейсы, находи редкие скины
                    <br className="desktop-break" /> и поднимай свою коллекцию
                    на новый уровень.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setTab('upgrade')
                      document
                        .getElementById('game-content')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Попробовать апгрейд <ArrowUpRight size={18} />
                  </button>
                  <div className="hero-note">
                    <ShieldCheck size={14} /> Только игровые предметы. Только
                    твой азарт.
                  </div>
                </div>
                <div className="hero-art">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <span className="art-cross cross-one">+</span>
                  <span className="art-cross cross-two">+</span>
                  <span className="art-code">SKIN / LEGENDARY</span>
                  <Weapon skin="ember" />
                  <div className="floating-label">
                    <span className="rarity-dot" />
                    <span>
                      AK-47 <strong>Redline</strong>
                    </span>
                    <ArrowUpRight size={19} />
                  </div>
                  <span className="art-edition">CRYSTAL COLLECTION / 01</span>
                </div>
              </section>
              <section className="welcome-strip">
                <div className="welcome-icon">
                  <Gift size={25} />
                </div>
                <div>
                  <h3>Твой первый шаг — за наш счёт</h3>
                  <p>
                    1 000 кристаллов при первом входе. Уже на балансе нового
                    игрока.
                  </p>
                </div>
                <span className="welcome-value">
                  +1 000 <Gem size={22} />
                </span>
              </section>
              <section id="game-content">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">ВЫБЕРИ СВОЙ ДРОП</span>
                    <h2>
                      Магазин кейсов <span>04</span>
                    </h2>
                  </div>
                  <div className="collection-label">
                    <span /> Коллекция: Original
                  </div>
                </div>
                <div className="cases-grid">
                  {cases.map((c, i) => (
                    <button
                      key={c.id}
                      className="case-card"
                      style={{ '--case': c.color } as React.CSSProperties}
                      onClick={() => {
                        setError('')
                        setBoxId(c.id)
                      }}
                    >
                      <div className="case-top">
                        <span className="case-tag">{c.tag}</span>
                        <ArrowUpRight size={17} />
                      </div>
                      <CaseArt color={c.color} index={i} />
                      <div className="case-info">
                        <h3>{c.name}</h3>
                        <p>{c.subtitle}</p>
                        <div className="case-bottom">
                          <span>
                            <Gem size={15} />
                            {format(c.price)}
                          </span>
                          <span className="case-open">
                            Открыть <ArrowRight size={15} />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              <section className="referral-strip">
                <div className="referral-symbol">
                  <Users size={35} />
                </div>
                <div>
                  <span className="eyebrow">
                    ХОРОШИЙ ДРОП ЛУЧШЕ ДЕЛИТЬ С ДРУЗЬЯМИ
                  </span>
                  <h3>
                    Приглашай друзей. Забирай <em>5 000</em> кристаллов.
                  </h3>
                </div>
                <button
                  className="secondary"
                  onClick={() => setModal('invite')}
                >
                  Моя ссылка <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          )}
          {tab === 'upgrade' && (
            <section id="game-content" className="inner-page">
              <span className="eyebrow">ВЫШЕ РИСК — ЦЕННЕЕ ДРОП</span>
              <h1>
                Апгрейд <em>скинов</em>
              </h1>
              <p className="muted">
                Обменяй один скин на шанс получить более дорогой. При неудаче
                исходный скин сгорает.
              </p>
              <div className="upgrade-machine">
                <div className="upgrade-slot">
                  {source ? (
                    <>
                      <Weapon skin={source.id} />
                      <h3>
                        {source.weapon} · {source.name}
                      </h3>
                      <span className="price">
                        <Gem size={15} />
                        {format(source.value)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Backpack size={45} />
                      <h3>Твой скин</h3>
                      <p>Выбери предмет ниже</p>
                    </>
                  )}
                </div>
                <div
                  className={`chance-wheel tier-${chance ? chanceTier(chance) : 'none'} ${wheel.phase === 'wait' ? 'rolling' : ''}`}
                  style={{ '--chance': `${chance}%` } as React.CSSProperties}
                >
                  <span>
                    {chance ? chance.toFixed(1) : '0'}
                    <small>%</small>
                  </span>
                  <p>ШАНС УСПЕХА</p>
                  <div
                    className={`wheel-arrow ${wheel.phase === 'spin' ? 'spinning' : ''}`}
                    style={{ transform: `rotate(${wheel.angle}deg)` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="upgrade-slot">
                  {targetSkin ? (
                    <>
                      <Weapon skin={targetSkin.id} />
                      <h3>
                        {targetSkin.weapon} · {targetSkin.name}
                      </h3>
                      <span className="price">
                        <Gem size={15} />
                        {format(targetSkin.value)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={45} />
                      <h3>Желаемый скин</h3>
                      <p>Выбери свою цель</p>
                    </>
                  )}
                </div>
              </div>
              <div className="upgrade-action">
                <button
                  className="primary"
                  disabled={busy || !player || !chance}
                  onClick={() =>
                    void call('upgrade', { uid: selected, target })
                  }
                >
                  {wheel.phase === 'spin'
                    ? 'Крутим колесо…'
                    : busy
                      ? 'Рассчитываем результат…'
                      : 'Улучшить скин'}
                  <ArrowUpRight size={18} />
                </button>
                <p>
                  Шанс = стоимость исходного / стоимость цели × 90%, максимум
                  75%.
                </p>
              </div>
              <div className="selection-grid">
                <section>
                  <h3>
                    Твой инвентарь{' '}
                    <span className="muted">
                      {player?.inventory.length || 0}
                    </span>
                  </h3>
                  {!player?.inventory.length ? (
                    <div className="empty-state">
                      <Box size={28} />
                      <h3>Здесь появятся твои скины</h3>
                      <p>Открой первый кейс, чтобы начать апгрейд.</p>
                      <button
                        className="secondary"
                        onClick={() => setTab('cases')}
                      >
                        К кейсам <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="skin-grid">
                      {player.inventory.map((i) => {
                        const s = skinById(i.skin)
                        return (
                          <button
                            className={`skin-card ${selected === i.uid ? 'selected' : ''}`}
                            key={i.uid}
                            onClick={() => {
                              setSelected(i.uid)
                              setTarget('')
                            }}
                          >
                            <Weapon skin={s.id} />
                            <small>{s.weapon}</small>
                            <strong>{s.name}</strong>
                            <span className="price">
                              <Gem size={13} />
                              {format(s.value)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>
                <section>
                  <h3>Цель апгрейда</h3>
                  <div className="tier-filter" role="group" aria-label="Шанс успеха">
                    <button
                      className={`tier-chip ${tier === 'all' ? 'active' : ''}`}
                      aria-pressed={tier === 'all'}
                      onClick={() => setTier('all')}
                    >
                      Все
                    </button>
                    {tierInfo.map((t) => (
                      <button
                        key={t.id}
                        className={`tier-chip tier-${t.id} ${tier === t.id ? 'active' : ''}`}
                        aria-pressed={tier === t.id}
                        disabled={!source}
                        onClick={() => setTier(t.id)}
                      >
                        {t.label}
                        <small>
                          {t.range}
                          {source ? ` · ${tierCount(t.id)}` : ''}
                        </small>
                      </button>
                    ))}
                  </div>
                  {!source && (
                    <p className="muted tier-hint">
                      Выбери свой скин, чтобы увидеть шансы и отфильтровать цели.
                    </p>
                  )}
                  {source && !shownTargets.length && (
                    <p className="muted tier-hint">
                      В этой категории нет целей для выбранного скина.
                    </p>
                  )}
                  <div className="skin-grid">
                    {shownTargets.map(({ skin: s, chance: c }) => (
                      <button
                        className={`skin-card ${target === s.id ? 'selected' : ''}`}
                        key={s.id}
                        disabled={!source}
                        onClick={() => setTarget(s.id)}
                      >
                        {source && (
                          <em className={`chance-badge tier-${chanceTier(c)}`}>
                            {c.toFixed(c < 10 ? 1 : 0)}%
                          </em>
                        )}
                        <Weapon skin={s.id} />
                        <small>{s.weapon}</small>
                        <strong>{s.name}</strong>
                        <span className="price">
                          <Gem size={13} />
                          {format(s.value)}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          )}
          {tab === 'inventory' && (
            <section className="inner-page">
              <span className="eyebrow">ТВОЯ ЛИЧНАЯ КОЛЛЕКЦИЯ</span>
              <h1>
                Инвентарь
                <span className="title-count">
                  {player?.inventory.length || 0}
                </span>
              </h1>
              <p className="muted">
                Улучшай предметы или продавай их за игровые кристаллы.
              </p>
              {!player?.inventory.length ? (
                <div className="empty-state inventory-empty">
                  <Backpack size={50} />
                  <h2>Первый дроп ещё впереди</h2>
                  <p>
                    В магазине тебя ждут четыре кейса. Начни с «Первого дропа»
                    за 250 кристаллов.
                  </p>
                  <button className="primary" onClick={() => setTab('cases')}>
                    Выбрать кейс <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="inventory-grid">
                  {player.inventory.map((i) => {
                    const s = skinById(i.skin)
                    return (
                      <article
                        className={`inventory-card rarity-${s.rarity}`}
                        key={i.uid}
                      >
                        <Weapon skin={s.id} />
                        <small>{s.weapon}</small>
                        <h3>{s.name}</h3>
                        <span className="price">
                          <Gem size={15} />
                          {format(s.value)}
                        </span>
                        <div className="item-actions">
                          <button
                            disabled={busy}
                            onClick={() => {
                              setSelected(i.uid)
                              setTab('upgrade')
                              setTarget('')
                            }}
                          >
                            Апгрейд <ArrowUpRight size={15} />
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => void call('sell', { uid: i.uid })}
                          >
                            Продать
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}
          {error && (
            <div className="error-message" role="alert">
              {error}
              <button onClick={() => void call('state')} disabled={busy}>
                <RefreshCw size={15} /> Повторить
              </button>
            </div>
          )}
          <footer>
            <span className="footer-brand">
              CRYSTAL DROP<span>.</span>
            </span>
            <p>
              Игровые скины и кристаллы не имеют денежной стоимости.
              <br />
              Пополнение за деньги и вывод предметов не предусмотрены.
            </p>
            <button onClick={() => setModal('help')}>
              Правила игры <ArrowUpRight size={14} />
            </button>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {navigation.map((n) => (
          <button
            className={tab === n.id ? 'active' : ''}
            key={n.id}
            onClick={() => setTab(n.id)}
          >
            <n.icon size={20} />
            {n.label}
          </button>
        ))}
        <button onClick={() => setModal('invite')}>
          <Users size={20} />
          Друзья
        </button>
        <button
          onClick={() => {
            setModal('promo')
            setAdminMessage('')
          }}
        >
          <Gift size={20} />
          Промокоды
        </button>
      </nav>
      {notice && (
        <div className="toast" role="status">
          <Gift size={21} />
          {notice}
          <button
            aria-label="Закрыть уведомление"
            onClick={() => setNotice('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {(box || modal || outcome) && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) {
              setBoxId(null)
              setModal(null)
              setOutcome(null)
            }
          }}
        >
          <section
            ref={dialogRef}
            className={`game-modal${modal === 'promo' && admin ? ' wide' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              box?.name ||
              outcome?.title ||
              (modal === 'invite'
                ? 'Пригласить друзей'
                : modal === 'promo'
                  ? 'Промокоды и управление'
                  : 'Правила игры')
            }
          >
            <button
              autoFocus
              className="modal-close"
              disabled={busy}
              aria-label="Закрыть"
              onClick={() => {
                setBoxId(null)
                setModal(null)
                setOutcome(null)
              }}
            >
              <X size={22} />
            </button>
            {box && (
              <>
                <span className="eyebrow">ОДИН КЕЙС — ОДИН НОВЫЙ СКИН</span>
                <h2>{box.name}</h2>
                {reel ? (
                  <div
                    className="case-roulette"
                    aria-label="Рулетка открытия кейса"
                    role="status"
                  >
                    <div className="roulette-marker" />
                    <div className="roulette-track">
                      {reel.map((id, index) => {
                        const skin = skinById(id)
                        return (
                          <div
                            key={index}
                            className="roulette-card"
                            style={
                              {
                                '--drop-color': skin.color,
                              } as React.CSSProperties
                            }
                          >
                            <Weapon skin={id} />
                            <small>{skin.weapon}</small>
                            <strong>{skin.name}</strong>
                          </div>
                        )
                      })}
                    </div>
                    <span className="roulette-caption">ОТКРЫВАЕМ КЕЙС…</span>
                  </div>
                ) : (
                  <div className={busy ? 'opening-case' : ''}>
                    <CaseArt color={box.color} index={cases.indexOf(box)} />
                  </div>
                )}
                <p className="modal-note">
                  50 скинов · Суммарный шанс ножа — 1%
                </p>
                <h3>Что может выпасть</h3>
                <div className="drop-list">
                  {box.drops.map((d) => {
                    const s = skinById(d.skin)
                    return (
                      <div key={d.skin}>
                        <span style={{ color: s.color }}>
                          {s.weapon} · {s.name}
                        </span>
                        <strong>{format(d.weight / 100)}%</strong>
                      </div>
                    )
                  })}
                </div>
                {error && (
                  <p role="alert" className="inline-error">
                    {error}
                  </p>
                )}
                <button
                  className="primary full"
                  disabled={busy || !player || player.balance < box.price}
                  onClick={() => void call('open', { caseId: box.id })}
                >
                  {busy
                    ? 'Открываем…'
                    : !player
                      ? 'Соединение с игрой…'
                      : player.balance < box.price
                        ? 'Недостаточно кристаллов'
                        : `Открыть за ${format(box.price)}`}
                  <Gem size={18} />
                </button>
                <p className="modal-note">
                  Случайный результат рассчитывается на сервере.
                </p>
              </>
            )}
            {outcome && (
              <div className="outcome">
                <div className="outcome-icon">
                  {outcome.won === false ? (
                    <RefreshCw size={28} />
                  ) : (
                    <Sparkles size={28} />
                  )}
                </div>
                <h2>{outcome.title}</h2>
                {outcome.skin && (
                  <>
                    <Weapon skin={outcome.skin} />
                    <span className="eyebrow">
                      {skinById(outcome.skin).weapon}
                    </span>
                    <h3>{skinById(outcome.skin).name}</h3>
                    <span className="price">
                      <Gem size={17} />
                      {format(skinById(outcome.skin).value)}
                    </span>
                  </>
                )}
                <button
                  className="primary full"
                  onClick={() => {
                    setOutcome(null)
                    if (outcome.skin) setTab('inventory')
                  }}
                >
                  {outcome.skin ? 'В инвентарь' : 'Продолжить'}
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
            {modal === 'invite' && (
              <>
                <div className="invite-icon">
                  <Users size={35} />
                </div>
                <span className="eyebrow">ИГРАЙТЕ ВМЕСТЕ</span>
                <h2>
                  Другу — старт.
                  <br />
                  Тебе — <em>5 000</em> кристаллов.
                </h2>
                <p className="muted">
                  Отправь свою ссылку другу. Когда новый игрок впервые откроет
                  её, ты получишь бонус, а он — 1 000 стартовых кристаллов.
                </p>
                <div className="invite-stats">
                  <div>
                    <strong>{player?.referrals ?? 0}</strong>
                    <span>друзей приглашено</span>
                  </div>
                  <div>
                    <strong>{format((player?.referrals ?? 0) * 5000)}</strong>
                    <span>кристаллов заработано</span>
                  </div>
                </div>
                {player ? (
                  <>
                    <label className="link-label" htmlFor="ref-link">
                      ТВОЯ ССЫЛКА
                    </label>
                    <input
                      id="ref-link"
                      readOnly
                      value={
                        typeof window !== 'undefined' ? referralLink() : ''
                      }
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      className="primary full"
                      onClick={() => void copyLink()}
                    >
                      {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <a
                      className="secondary full"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? referralLink() : '')}&text=${encodeURIComponent('Залетай в CRYSTAL DROP! Тебя ждут 1000 кристаллов и первый дроп.')}`}
                    >
                      Поделиться в Telegram <ArrowUpRight size={18} />
                    </a>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => void call('state')}
                    >
                      Обновить баланс
                    </button>
                  </>
                ) : (
                  <p className="muted">
                    {loading
                      ? 'Загружаем персональную ссылку…'
                      : 'Подключитесь к игре, чтобы получить ссылку.'}
                  </p>
                )}
                <p className="modal-note">
                  Бонус — за новый гостевой профиль. Профиль сохраняется в этом
                  браузере; не очищайте его данные.
                </p>
              </>
            )}
            {modal === 'promo' && (
              <>
                <span className="eyebrow">
                  {admin ? 'ПАНЕЛЬ РАЗРАБОТЧИКА' : 'БОНУСЫ'}
                </span>
                <h2>{admin ? 'Управление игрой' : 'Промокоды'}</h2>
                {admin ? (
                  <AdminPanel
                    ownId={player?.id}
                    initialJournal={journal}
                    onLogout={() => void adminCall('logout')}
                    onUnauthorized={() => setAdmin(false)}
                    onOwnChange={() => void call('state')}
                  />
                ) : (
                  <>
                    <p className="muted">
                      Введите промокод, чтобы получить бонус.
                    </p>
                    <form
                      className="admin-form promo-reward"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void call('promo', { code: promoCode })
                      }}
                    >
                      <label htmlFor="reward-code">Промокод на кристаллы</label>
                      <input
                        id="reward-code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Введите промокод"
                        autoComplete="off"
                        maxLength={64}
                        required
                      />
                      <button
                        className="primary full"
                        disabled={busy || adminBusy || !player || !promoCode.trim()}
                      >
                        {busy ? 'Активируем…' : 'Получить бонус'}{' '}
                        <Gift size={18} />
                      </button>
                      {error && (
                        <p className="inline-error" role="alert">
                          {error}
                        </p>
                      )}
                    </form>
                    {player && (
                      <div className="player-id">
                        <label htmlFor="player-id">Ваш ID игрока</label>
                        <input
                          id="player-id"
                          readOnly
                          value={player.id}
                          onFocus={(e) => e.target.select()}
                        />
                        <button
                          className="secondary full"
                          onClick={() => void copyPlayerId()}
                        >
                          <Copy size={16} /> Скопировать ID
                        </button>
                      </div>
                    )}
                    <form
                      className="admin-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void adminCall('login')
                      }}
                    >
                      <label htmlFor="promo-code">
                        Код доступа владельца · управление
                      </label>
                      <input
                        id="promo-code"
                        type="password"
                        autoComplete="off"
                        maxLength={256}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                      />
                      <button
                        className="primary full"
                        disabled={adminBusy || !player || !code}
                      >
                        {adminBusy ? 'Проверяем…' : 'Активировать'}
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        disabled={adminBusy || !player}
                        onClick={() => void adminCall('status')}
                      >
                        Восстановить открытую сессию
                      </button>
                    </form>
                  </>
                )}
                {adminMessage && (
                  <p className="admin-message" role="status">
                    {adminMessage}
                  </p>
                )}
              </>
            )}
            {modal === 'help' && (
              <>
                <span className="eyebrow">КРАТКО О ГЛАВНОМ</span>
                <h2>Твой путь к редкому дропу</h2>
                <div className="rules">
                  <p>
                    <b>01 / Начни с бонуса</b>Новый профиль получает 1 000
                    кристаллов автоматически. Профиль привязан к этому браузеру.
                  </p>
                  <p>
                    <b>02 / Открывай кейсы</b>Выбери кейс, изучи вероятности и
                    открой его за кристаллы. Предмет сразу попадает в инвентарь.
                  </p>
                  <p>
                    <b>03 / Улучшай коллекцию</b>Выбери свой скин и более
                    дорогую цель. Шанс виден до попытки. Неудача уничтожает
                    исходный скин.
                  </p>
                  <p>
                    <b>04 / Приглашай друзей</b>За первый вход нового гостевого
                    профиля по твоей ссылке начисляется 5 000 кристаллов.
                  </p>
                </div>
                <p className="modal-note">
                  Изображения скинов CS2 принадлежат Valve. Игровые предметы не
                  связаны с инвентарём Steam. Кристаллы нельзя купить или
                  вывести.
                </p>
                <button className="primary full" onClick={() => setModal(null)}>
                  Всё понятно <Check size={18} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
