import { useEffect, useMemo, useState } from 'react'
import { Plus, Minus, Check, Trash2, Pause, Play } from 'lucide-react'
import { useStore, formatDateLocal, formatConMoneda } from '../store/useStore'
import GestionSabores from './GestionSabores'

function labelSabor(s) {
  return String(s.sabor ?? s.nombre ?? '').trim()
}

function stockParaSabor(s, inventarioPorSabor) {
  const k = labelSabor(s)
  if (inventarioPorSabor[k] !== undefined && inventarioPorSabor[k] !== null) {
    return Number(inventarioPorSabor[k]) || 0
  }
  return Number(s.stock) || 0
}

function claseStockCard(stock) {
  if (stock <= 0) {
    return 'cursor-not-allowed border border-gray-300 bg-gray-100/80 opacity-60 dark:border-white/10 dark:bg-white/5'
  }
  if (stock <= 5) {
    return 'border-2 border-red-500 bg-white/90 shadow-md hover:border-red-400 dark:border-red-400 dark:bg-red-950/20'
  }
  if (stock <= 10) {
    return 'border-2 border-amber-400 bg-white/90 shadow-md hover:border-amber-500 dark:border-amber-400/90 dark:bg-amber-950/25'
  }
  return 'border border-gray-300 bg-white/90 shadow-md backdrop-blur-sm hover:border-[#5DCAA5] dark:border-white/15 dark:bg-white/10 dark:hover:border-[#5DCAA5]/90'
}

function BotellaSVG({ tipo, seleccionado, onClick, precio, config }) {
  const esGrande = tipo === 'grande'

  const svgGrande = (
    <>
      <defs>
        <clipPath id="clip-grande">
          <rect x="18" y="35" width="44" height="115" rx="8" />
        </clipPath>
      </defs>
      <rect x="26" y="1" width="28" height="11" rx="5" fill="#1a1a1a" />
      <rect x="22" y="10" width="36" height="6" rx="3" fill="#2a2a2a" />
      <rect x="24" y="16" width="32" height="14" rx="4" fill="rgba(200,230,200,0.5)" />
      <path d="M18 30 Q18 25 24 25 L56 25 Q62 25 62 30 L62 40 L18 40Z" fill="rgba(200,230,200,0.4)" />
      <rect
        x="18"
        y="35"
        width="44"
        height="115"
        rx="8"
        fill="rgba(220,240,220,0.35)"
        stroke="rgba(76,175,80,0.4)"
        strokeWidth="1"
      />
      <rect
        x="18"
        y="60"
        width="44"
        height="90"
        rx="8"
        fill="#2E7D32"
        opacity="0.85"
        clipPath="url(#clip-grande)"
      />
      <rect x="20" y="62" width="40" height="55" rx="4" fill="white" opacity="0.92" />
      <circle cx="40" cy="82" r="16" fill="#1D9E75" />
      <ellipse cx="37" cy="83" rx="7" ry="9" fill="#F9A825" />
      <line x1="33" y1="74" x2="37" y2="74" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
      <line x1="35" y1="73" x2="37" y2="71" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="72" x2="40" y2="70" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="46" cy="87" rx="7" ry="7" fill="#F57F17" />
      <ellipse cx="46" cy="87" rx="5.5" ry="5.5" fill="#FFA000" />
      <line x1="46" y1="82" x2="46" y2="92" stroke="#F57F17" strokeWidth="1" />
      <line x1="41" y1="87" x2="51" y2="87" stroke="#F57F17" strokeWidth="1" />
      <text x="40" y="105" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1B5E20" fontFamily="sans-serif">
        JUGOS
      </text>
      <text x="40" y="112" textAnchor="middle" fontSize="8" fontWeight="700" fill="#F57F17" fontFamily="sans-serif">
        NAYI
      </text>
      <text x="40" y="118" textAnchor="middle" fontSize="4.5" fill="#555" fontFamily="sans-serif">
        NATURALMENTE PURO
      </text>
      <rect x="22" y="38" width="7" height="90" rx="3.5" fill="rgba(255,255,255,0.2)" />
      <rect x="18" y="125" width="44" height="1" fill="rgba(255,255,255,0.15)" />
      <rect x="18" y="138" width="44" height="1" fill="rgba(255,255,255,0.15)" />
    </>
  )

  const svgPequeno = (
    <>
      <defs>
        <clipPath id="clip-pequeno">
          <rect x="20" y="75" width="40" height="78" rx="7" />
        </clipPath>
      </defs>
      <g transform="translate(0,30)">
        <rect x="26" y="1" width="28" height="10" rx="5" fill="#1a1a1a" />
        <rect x="22" y="9" width="36" height="5" rx="3" fill="#2a2a2a" />
        <rect x="24" y="14" width="32" height="11" rx="4" fill="rgba(200,230,200,0.5)" />
        <path d="M20 25 Q20 20 24 20 L56 20 Q60 20 60 25 L60 33 L20 33Z" fill="rgba(200,230,200,0.4)" />
        <rect
          x="20"
          y="28"
          width="40"
          height="78"
          rx="7"
          fill="rgba(220,240,220,0.35)"
          stroke="rgba(255,160,0,0.4)"
          strokeWidth="1"
        />
        <rect
          x="20"
          y="48"
          width="40"
          height="58"
          rx="7"
          fill="#F57F17"
          opacity="0.85"
          clipPath="url(#clip-pequeno)"
        />
        <rect x="22" y="48" width="36" height="45" rx="4" fill="white" opacity="0.92" />
        <circle cx="40" cy="64" r="13" fill="#1D9E75" />
        <ellipse cx="37" cy="65" rx="5.5" ry="7" fill="#F9A825" />
        <line x1="34" y1="58" x2="37" y2="58" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="36" y1="57" x2="39" y2="55" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="45" cy="67" rx="5.5" ry="5.5" fill="#F57F17" />
        <ellipse cx="45" cy="67" rx="4" ry="4" fill="#FFA000" />
        <line x1="45" y1="63" x2="45" y2="71" stroke="#F57F17" strokeWidth="0.8" />
        <line x1="41" y1="67" x2="49" y2="67" stroke="#F57F17" strokeWidth="0.8" />
        <text x="40" y="83" textAnchor="middle" fontSize="6" fontWeight="700" fill="#1B5E20" fontFamily="sans-serif">
          JUGOS
        </text>
        <text x="40" y="89" textAnchor="middle" fontSize="7" fontWeight="700" fill="#F57F17" fontFamily="sans-serif">
          NAYI
        </text>
        <text x="40" y="94" textAnchor="middle" fontSize="4" fill="#555" fontFamily="sans-serif">
          NAT. PURO
        </text>
        <rect x="23" y="30" width="6" height="65" rx="3" fill="rgba(255,255,255,0.2)" />
      </g>
    </>
  )

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 max-w-[150px] flex-1 flex-col items-center rounded-2xl border-2 px-3 pb-3 pt-2 text-center transition-all ${
        seleccionado
          ? 'border-[#1D9E75] bg-green-50 dark:border-[#1D9E75] dark:bg-emerald-950/45'
          : 'border-gray-200 bg-white hover:border-[#1D9E75] dark:border-white/15 dark:bg-zinc-900/60 dark:hover:border-[#1D9E75]'
      }`}
    >
      {seleccionado ? (
        <div className="mb-1 flex h-5 w-5 shrink-0 items-center justify-center self-center rounded-full bg-[#1D9E75]">
          <span className="text-xs leading-none text-white">✓</span>
        </div>
      ) : (
        <div className="mb-1 h-5 shrink-0" aria-hidden />
      )}

      <span className="block w-full text-sm font-semibold text-gray-800 dark:text-gray-100">
        {esGrande ? 'Grande' : 'Pequeño'}
      </span>
      <span className="mb-3 block w-full text-xs text-[#1D9E75] dark:text-brand-soft">
        {formatConMoneda(config, precio)}
      </span>

      {esGrande ? (
        <svg
          width="60"
          height="140"
          viewBox="0 0 80 160"
          className="mt-auto shrink-0"
          style={{ display: 'block', margin: '0 auto' }}
        >
          {svgGrande}
        </svg>
      ) : (
        <svg
          width="60"
          height="110"
          viewBox="0 0 80 160"
          className="mt-auto shrink-0"
          style={{ display: 'block', margin: '0 auto' }}
        >
          {svgPequeno}
        </svg>
      )}
    </button>
  )
}

export default function PuntoDeVenta() {
  const {
    sabores,
    ventas,
    inventarioPorSabor,
    pausadoPorSabor,
    setPausadoSabor,
    agregarVenta,
    eliminarVenta,
    limpiarVentas,
    cargarVentasPorFecha,
    PG,
    PP,
    config,
    totalJugosHoy,
    metaDiaria,
    calcularPuntoEquilibrio,
    usuarioActivo,
  } = useStore()
  const esAdmin = usuarioActivo?.rol === 'admin'
  const permisos = usuarioActivo?.permisos || {}
  const soloVentas =
    !esAdmin &&
    !permisos.plan &&
    !permisos.compras &&
    !permisos.ganancias &&
    !permisos.mayoristas &&
    !permisos.config &&
    !permisos.ajustes
  const notaDelDia = String(config?.nota_del_dia || '').trim()

  const [sabor, setSabor] = useState(null)
  const [tam, setTam] = useState(null)
  const [qty, setQty] = useState(1)
  const [notas, setNotas] = useState('')
  const [toast, setToast] = useState('')
  const [ahora, setAhora] = useState(() => new Date())
  const [animRegistrar, setAnimRegistrar] = useState(false)
  const [fechaLista, setFechaLista] = useState(() => formatDateLocal(new Date()))
  const [ventasOtroDia, setVentasOtroDia] = useState(null)
  const [modalLimpiar, setModalLimpiar] = useState(false)

  const hoyStr = formatDateLocal(new Date())
  const esHoyLista = fechaLista === hoyStr

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (esHoyLista) {
      setVentasOtroDia(null)
      return () => {
        cancelled = true
      }
    }
    void (async () => {
      const rows = await cargarVentasPorFecha(fechaLista)
      if (!cancelled) setVentasOtroDia(rows)
    })()
    return () => {
      cancelled = true
    }
  }, [fechaLista, esHoyLista, cargarVentasPorFecha])

  const listaVentas = esHoyLista ? ventas : ventasOtroDia ?? []

  const vendidosHoyPorNombre = useMemo(() => {
    const m = {}
    for (const v of ventas) {
      const n = v.sabor
      m[n] = (m[n] || 0) + (Number(v.qty) || 0)
    }
    return m
  }, [ventas])

  const inventarioGanancia = useMemo(() => {
    const totalDisponible = sabores.reduce((a, s) => {
      const clave = labelSabor(s)
      if (pausadoPorSabor[clave] === true) return a
      return a + (stockParaSabor(s, inventarioPorSabor) || 0)
    }, 0)
    const gananciaActualVentas = ventas.reduce((a, v) => a + (Number(v.total) || 0), 0)
    const vendidosN = Number(totalJugosHoy) || 0
    const unidadesRestantes = Math.max(0, totalDisponible - vendidosN)
    const pg = Number(PG) || 0
    const pp = Number(PP) || 0
    return {
      totalDisponible,
      gananciaActualVentas,
      potencialRestanteMin: unidadesRestantes * pp,
      potencialRestanteMax: unidadesRestantes * pg,
      siVendesTodoMax: totalDisponible * pg,
    }
  }, [sabores, inventarioPorSabor, pausadoPorSabor, ventas, totalJugosHoy, PG, PP])

  const elegido = sabores.find((x) => x.id === sabor)
  const elegidoPausado = elegido != null && pausadoPorSabor[labelSabor(elegido)] === true
  const stockDisp = elegido != null ? stockParaSabor(elegido, inventarioPorSabor) : 0

  useEffect(() => {
    if (!sabor) return
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, stockDisp)))
  }, [sabor, stockDisp])

  const precio = tam === 'grande' ? PG : tam === 'pequeno' ? PP : 0
  const subtotal = precio * qty
  const puedeVender =
    elegido &&
    !elegidoPausado &&
    tam &&
    qty >= 1 &&
    qty <= stockDisp &&
    stockDisp > 0

  const registrar = () => {
    if (!puedeVender || !elegido) return
    const hora = new Date().toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    })
    agregarVenta({
      saborId: elegido.id,
      sabor: labelSabor(elegido),
      emoji: elegido.emoji,
      tam,
      qty,
      precio,
      total: subtotal,
      hora,
      notas: notas.trim().slice(0, 50),
    })
    calcularPuntoEquilibrio()
    setToast(`${elegido.emoji} ${qty}x ${labelSabor(elegido)} ${tam} — ${formatConMoneda(config, subtotal)}`)
    setTimeout(() => setToast(''), 2500)
    setSabor(null)
    setTam(null)
    setQty(1)
    setNotas('')
  }

  const totalDia = ventas.reduce((a, v) => a + (Number(v.total) || 0), 0)

  const totalLista = listaVentas.reduce((a, v) => a + (Number(v.total) || 0), 0)
  const unidadesLista = listaVentas.reduce((a, v) => a + (Number(v.qty) || 0), 0)

  const confirmarLimpiar = () => {
    setModalLimpiar(false)
    void limpiarVentas()
  }

  const vendidos = Number(totalJugosHoy) || 0
  const { totalDisponible, gananciaActualVentas, potencialRestanteMin, potencialRestanteMax, siVendesTodoMax } =
    inventarioGanancia
  const pctDisponibleRaw = totalDisponible > 0 ? (vendidos / totalDisponible) * 100 : 0
  const pctDisponibleBar = Math.min(100, pctDisponibleRaw)
  const pctDisponibleEtiqueta = Math.min(100, Math.round(pctDisponibleRaw))
  const meta = Math.max(0, Number(metaDiaria) || 0)
  const sinInventarioMeta = meta <= 0
  const pctRaw = meta > 0 ? (vendidos / meta) * 100 : 0
  const metaLograda = meta > 0 && vendidos >= meta
  /** Tramos de animo / color (solo si hay meta por inventario). */
  const tramoCasi = !sinInventarioMeta && !metaLograda && pctRaw >= 90
  const tramoBien = !sinInventarioMeta && !metaLograda && pctRaw >= 50 && pctRaw < 90

  let barraBg = '#1D9E75'
  if (metaLograda || tramoCasi) barraBg = '#EF9F27'
  else if (tramoBien) barraBg = '#22C55E'

  const togglePausaSabor = (e, claveSabor) => {
    e.preventDefault()
    e.stopPropagation()
    if (elegido && labelSabor(elegido) === claveSabor) setSabor(null)
    const actual = pausadoPorSabor[claveSabor] === true
    void setPausadoSabor(claveSabor, !actual)
  }

  return (
    <div className="space-y-4">
      {soloVentas ? (
        <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
          <p className="text-base font-bold text-gray-900 dark:text-white">
            Hola, {usuarioActivo?.nombre || 'equipo'} 👋
          </p>
          <p className="mt-1 text-sm font-medium text-[#1D9E75] dark:text-brand-soft">
            {ahora.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {ahora.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      ) : null}

      {soloVentas && notaDelDia ? (
        <div className="rounded-xl border border-[#1D9E75]/25 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-brand/30 dark:bg-emerald-950/35 dark:text-emerald-100">
          📌 Nota de hoy: {notaDelDia}
        </div>
      ) : null}

      <div
        className={`juice-card border-[#1D9E75]/25 p-4 dark:border-brand/30 ${
          metaLograda
            ? 'rounded-xl bg-emerald-50/90 ring-2 ring-[#1D9E75]/20 dark:bg-emerald-950/35 dark:ring-emerald-500/25'
            : ''
        }`}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          Total de jugos
        </p>
        {sinInventarioMeta ? (
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200/90">
            Configura tu inventario primero
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-100">
              Vendidos:{' '}
              <span className="tabular-nums font-bold text-[#1D9E75] dark:text-brand-soft">
                {vendidos} de {totalDisponible} disponibles
              </span>{' '}
              <span className="text-gray-500 dark:text-gray-400">({pctDisponibleEtiqueta}%)</span>
            </p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${pctDisponibleBar}%`,
                  background: metaLograda
                    ? 'linear-gradient(90deg, #CA8A04, #FACC15, #D97706)'
                    : barraBg,
                  transition: 'width 0.5s ease, background-color 0.5s ease',
                }}
              />
            </div>
            <div className="mt-4 space-y-2 border-t border-black/5 pt-4 dark:border-white/10">
              <p className="text-sm font-semibold text-[#1D9E75] dark:text-brand-soft">
                💰 Ganado hasta ahora:{' '}
                <span className="tabular-nums">{formatConMoneda(config, gananciaActualVentas)}</span>
              </p>
              <div className="space-y-0.5 text-sm">
                <p className="font-medium text-gray-800 dark:text-gray-200">📈 Potencial restante:</p>
                <p className="pl-2 tabular-nums text-gray-500 dark:text-gray-400">
                  Mínimo: {formatConMoneda(config, potencialRestanteMin)}
                </p>
                <p className="pl-2 tabular-nums text-emerald-600 dark:text-emerald-400/90">
                  Máximo: {formatConMoneda(config, potencialRestanteMax)}
                </p>
              </div>
              <p className="text-sm font-bold tabular-nums text-[#10B981] dark:text-emerald-300">
                🎯 Si vendes todo: hasta {formatConMoneda(config, siVendesTodoMax)}
              </p>
            </div>
            {metaLograda ? (
              <p className="mt-4 text-center text-base font-bold leading-snug text-[#166534] dark:text-emerald-200 sm:text-lg">
                🎉 ¡Felicidades! ¡Lograste tu meta de hoy!
              </p>
            ) : tramoCasi ? (
              <p className="mt-2 text-center text-sm font-semibold text-[#C2410C] dark:text-orange-300">
                ¡Casi llegas! 🔥
              </p>
            ) : tramoBien ? (
              <p className="mt-2 text-center text-sm font-semibold text-[#15803D] dark:text-emerald-300">
                ¡Vas muy bien! 💪
              </p>
            ) : null}
          </>
        )}
      </div>

      {esAdmin ? <GestionSabores /> : null}

      <div className={`grid grid-cols-2 gap-3 ${soloVentas ? 'gap-4' : ''}`}>
        <div className="juice-kpi">
          <p className={`mb-1 text-gray-700 dark:text-gray-300 ${soloVentas ? 'text-sm font-semibold' : 'text-xs font-medium'}`}>
            Jugos vendidos
          </p>
          <p className={`tabular-nums text-gray-900 dark:text-gray-100 ${soloVentas ? 'text-4xl font-extrabold' : 'text-2xl font-bold'}`}>
            {vendidos}
          </p>
        </div>
        <div className="juice-kpi">
          <p className={`mb-1 text-gray-700 dark:text-gray-300 ${soloVentas ? 'text-sm font-semibold' : 'text-xs font-medium'}`}>
            Total cobrado
          </p>
          <p className={`tabular-nums text-brand dark:text-brand-soft ${soloVentas ? 'text-3xl font-extrabold' : 'text-2xl font-bold'}`}>
            {formatConMoneda(config, totalDia)}
          </p>
        </div>
      </div>

      {toast && (
        <div className="rounded-lg border border-brand/20 bg-brand-softer px-4 py-3 text-center text-sm font-medium text-brand-dark dark:border-brand/35 dark:bg-emerald-950/75 dark:text-brand-soft">
          ✅ {toast}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
          1. Elige el sabor
        </p>
        <div className="grid grid-cols-2 gap-2">
          {sabores.map((s) => {
            const stock = stockParaSabor(s, inventarioPorSabor)
            const agotado = stock <= 0
            const clave = labelSabor(s)
            const pausado = pausadoPorSabor[clave] === true
            const noVenta = agotado || pausado
            const vendHoy = vendidosHoyPorNombre[clave] ?? 0
            let badge = null
            if (pausado) {
              badge = <span className="font-semibold text-gray-500 dark:text-gray-400">Pausado</span>
            } else if (agotado) {
              badge = <span className="text-red-400 dark:text-red-300">Agotado</span>
            } else if (stock <= 5) {
              badge = <span className="font-semibold text-red-600 dark:text-red-400">🔴 Bajo</span>
            } else if (stock <= 10) {
              badge = <span className="font-semibold text-amber-700 dark:text-amber-300">⚠️ Poco</span>
            } else {
              badge = <span className="text-brand-dark dark:text-brand-soft">Vendidos hoy: {vendHoy}</span>
            }

            const seleccionado = !noVenta && sabor === s.id
            const cardClass = noVenta
              ? pausado
                ? 'relative border border-gray-300 bg-gray-200/50 opacity-50 grayscale dark:border-zinc-600 dark:bg-zinc-800/60'
                : claseStockCard(0)
              : seleccionado
                ? 'relative border-2 border-[#1D9E75] bg-[#E8F6F0]/95 shadow-md dark:border-[#1D9E75] dark:bg-emerald-950/55'
                : claseStockCard(stock)

            return (
              <div key={s.id} className="relative">
                {esAdmin && !agotado ? (
                  <button
                    type="button"
                    onClick={(e) => togglePausaSabor(e, clave)}
                    className="absolute left-2 top-2 z-30 flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-full border border-gray-200 bg-white/95 text-[#1D9E75] shadow-md transition hover:bg-emerald-50 dark:border-white/15 dark:bg-zinc-900/95 dark:text-brand-soft dark:hover:bg-emerald-950/60"
                    aria-label={pausado ? 'Reanudar sabor' : 'Pausar sabor'}
                    title={pausado ? 'Reanudar' : 'Pausar'}
                  >
                    {pausado ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={noVenta}
                  onClick={() => !noVenta && setSabor(s.id)}
                  className={`relative w-full rounded-xl py-3 px-2 pt-9 text-center transition-all duration-200 ${cardClass}`}
                >
                  {seleccionado ? (
                    <span
                      className="absolute right-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#1D9E75] text-white shadow-sm"
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  ) : null}
                  <span className="mb-1 block text-3xl">{s.emoji}</span>
                  <span
                    className={`block text-sm font-semibold ${
                      seleccionado ? 'text-[#1D9E75] dark:text-brand-soft' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {clave}
                  </span>
                  <span className={`mt-1 inline-block text-xs ${noVenta && !pausado ? '' : 'font-semibold'}`}>
                    {badge}
                  </span>
                  {!agotado && (
                    <span className="mt-0.5 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Stock: {stock}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
          2. Elige el tamaño
        </p>
        <div className="flex justify-center items-end" style={{ gap: '12px', marginBottom: '20px' }}>
          <BotellaSVG
            tipo="grande"
            seleccionado={tam === 'grande'}
            onClick={() => setTam('grande')}
            precio={PG}
            config={config}
          />
          <BotellaSVG
            tipo="pequeno"
            seleccionado={tam === 'pequeno'}
            onClick={() => setTam('pequeno')}
            precio={PP}
            config={config}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
          3. Cantidad
        </p>
        <div className="juice-card flex items-center gap-4 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={!elegido || stockDisp <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface-inset hover:border-brand hover:bg-brand-softer disabled:opacity-40 dark:border-white/15 dark:bg-white/5 dark:hover:bg-brand/20"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-xl font-semibold text-gray-800 dark:text-gray-100">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(stockDisp || 1, q + 1))}
              disabled={!elegido || qty >= stockDisp}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface-inset hover:border-brand hover:bg-brand-softer disabled:opacity-40 dark:border-white/15 dark:bg-white/5 dark:hover:bg-brand/20"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Subtotal</p>
            <p className="text-xl font-semibold text-brand dark:text-brand-soft">
              {formatConMoneda(config, subtotal)}
            </p>
            {elegido && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Máx. {stockDisp} por existencia</p>
            )}
            {!elegido && tam && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Elige sabor para registrar</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
          Nota (opcional)
        </label>
        <input
          type="text"
          value={notas}
          maxLength={50}
          onChange={(e) => setNotas(e.target.value.slice(0, 50))}
          placeholder="con hielo, sin azúcar..."
          className="w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2.5 text-sm text-gray-900 shadow-sm backdrop-blur-sm placeholder:text-gray-400 focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 dark:border-white/15 dark:bg-zinc-900/70 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        <p className="mt-1 text-right text-[10px] text-gray-400 dark:text-gray-500">{notas.length}/50</p>
      </div>

      <button
        type="button"
        onClick={() => {
          setAnimRegistrar(true)
          setTimeout(() => setAnimRegistrar(false), 180)
          registrar()
        }}
        disabled={!puedeVender}
        className={`flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-brand to-emerald-600 text-center font-semibold text-white transition-transform
          ${soloVentas ? 'py-[18px] text-lg' : 'py-5 text-lg'}
          ${animRegistrar ? 'scale-95' : 'scale-100'}
          shadow-[inset_0_2px_0_rgba(255,255,255,0.28),0_10px_28px_-6px_rgba(13,148,136,0.55)]
          hover:from-teal-700 hover:via-brand-dark hover:to-emerald-700 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_12px_32px_-6px_rgba(13,148,136,0.6)]
          active:scale-[0.99] active:brightness-95
          disabled:cursor-not-allowed disabled:bg-gradient-to-r disabled:from-stone-300 disabled:via-stone-300 disabled:to-stone-300 disabled:text-gray-500 disabled:shadow-none disabled:active:scale-100 dark:disabled:from-gray-700 dark:disabled:via-gray-700 dark:disabled:to-gray-700 dark:disabled:text-gray-400`}
      >
        <Check size={soloVentas ? 26 : 24} strokeWidth={2.5} className="shrink-0" aria-hidden />
        <span>Registrar venta</span>
      </button>

      <div>
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
              {soloVentas ? 'Mis ventas de hoy' : 'Historial de ventas'}
            </p>
            <label className="sr-only" htmlFor="fecha-ventas">
              Fecha
            </label>
            <input
              id="fecha-ventas"
              type="date"
              value={fechaLista}
              max={hoyStr}
              onChange={(e) => setFechaLista(e.target.value)}
              className="w-full max-w-[11.5rem] rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-white/15 dark:bg-zinc-900/70 dark:text-gray-100"
            />
          </div>
          {esHoyLista && esAdmin && (
            <button
              type="button"
              onClick={() => setModalLimpiar(true)}
              className="flex shrink-0 items-center gap-1 self-start text-xs font-medium text-gray-600 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
            >
              <Trash2 size={12} /> Limpiar
            </button>
          )}
        </div>
        <div className="juice-card overflow-hidden">
          {!esHoyLista && ventasOtroDia === null ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Cargando…</p>
          ) : listaVentas.length === 0 ? (
            soloVentas && esHoyLista ? (
              <div className="py-8 text-center">
                <p className="text-4xl">🥤</p>
                <p className="mt-2 text-base font-semibold text-gray-800 dark:text-gray-100">¡Listo para vender!</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Selecciona un sabor para comenzar</p>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Sin ventas este día</p>
            )
          ) : (
            listaVentas.map((v) => (
              <div
                key={v.id}
                className={`flex items-center justify-between border-b border-surface-muted px-4 last:border-0 dark:border-white/10 ${
                  soloVentas ? 'py-4' : 'py-3'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-xl shrink-0">{v.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {v.qty > 1 ? `${v.qty}x ` : ''}
                      {v.sabor}
                    </p>
                    {v.notas ? (
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{v.notas}</p>
                    ) : null}
                    <p className={`dark:text-gray-400 ${soloVentas ? 'text-sm font-semibold text-gray-600' : 'text-xs text-gray-400'}`}>
                      {v.tam === 'grande' ? 'Grande' : 'Pequeño'} · {v.hora}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-brand dark:text-brand-soft">
                    {formatConMoneda(config, v.total)}
                  </span>
                  {esHoyLista && (
                    <button
                      type="button"
                      onClick={() => eliminarVenta(v.id)}
                      className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
                      aria-label="Eliminar venta"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {listaVentas.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/50 bg-gradient-to-r from-brand-softer/40 to-amber-50/25 px-4 py-3 text-sm font-semibold dark:border-white/10 dark:from-brand/10 dark:to-amber-950/20">
              <span className="text-gray-700 dark:text-gray-200">
                Total ({unidadesLista} uds.)
              </span>
              <span className="text-brand dark:text-brand-soft">{formatConMoneda(config, totalLista)}</span>
            </div>
          )}
        </div>
      </div>

      {modalLimpiar && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="limpiar-titulo"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900">
            <h2 id="limpiar-titulo" className="text-base font-bold text-gray-900 dark:text-white">
              ¿Limpiar ventas de hoy?
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              ¿Seguro que quieres limpiar todas las ventas de hoy? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalLimpiar(false)}
                className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 dark:border-white/15 dark:bg-zinc-800 dark:text-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarLimpiar}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              >
                Sí, limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
