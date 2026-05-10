import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ShoppingCart, X } from 'lucide-react'
import {
  useStore,
  formatConMoneda,
  formatDateLocal,
  parseDateLocal,
  fechaCompraYmd,
  mondayOfDate,
} from '../store/useStore'

/**
 * Recetas orientativas (por unidad de jugo del plan):
 * grande → 3 naranjas | 2 mangos | ¼ piña
 * pequeño → 2 naranjas | 1 mango | ⅛ piña
 */
function estimarFrutasDesdePlan(planRows) {
  const G = planRows.reduce((a, r) => a + (Number(r.pg) || 0), 0)
  const P = planRows.reduce((a, r) => a + (Number(r.pp) || 0), 0)
  const naranjas = Math.ceil(3 * G + 2 * P)
  const mangos = Math.ceil(2 * G + P)
  const pina = Math.max(0, Math.ceil(G * 0.25 + P * 0.125))
  return { G, P, naranjas, mangos, pina }
}

const FILTRO_HOY = 'hoy'
const FILTRO_SEMANA = 'semana'
const FILTRO_TODO = 'todo'

export default function Compras() {
  const compras = useStore((s) => s.compras)
  const plan = useStore((s) => s.plan)
  const agregarCompra = useStore((s) => s.agregarCompra)
  const updateCompra = useStore((s) => s.updateCompra)
  const eliminarCompra = useStore((s) => s.eliminarCompra)
  const agregarSugerenciasACompras = useStore((s) => s.agregarSugerenciasACompras)
  const cargarPlan = useStore((s) => s.cargarPlan)
  const config = useStore((s) => s.config)

  const [panelCalc, setPanelCalc] = useState(false)
  const [agregandoSug, setAgregandoSug] = useState(false)
  const [filtroPeriodo, setFiltroPeriodo] = useState(FILTRO_HOY)

  useEffect(() => {
    void cargarPlan()
  }, [cargarPlan])

  const estimacion = useMemo(() => estimarFrutasDesdePlan(plan || []), [plan])

  const lineasSugeridas = useMemo(() => {
    const { naranjas, mangos, pina } = estimacion
    const out = []
    if (naranjas > 0) out.push({ nombre: '🍊 Naranja (plan semanal)', cantidad: naranjas, precio: 0 })
    if (mangos > 0) out.push({ nombre: '🥭 Mango (plan semanal)', cantidad: mangos, precio: 0 })
    if (pina > 0) out.push({ nombre: '🍍 Piña (plan semanal)', cantidad: pina, precio: 0 })
    return out
  }, [estimacion])

  const fechaHoyStr = formatDateLocal(new Date())
  const fechaLunesStr = formatDateLocal(mondayOfDate())

  const comprasFiltradas = useMemo(() => {
    if (filtroPeriodo === FILTRO_TODO) return compras
    if (filtroPeriodo === FILTRO_HOY) {
      return compras.filter((c) => fechaCompraYmd(c) === fechaHoyStr)
    }
    return compras.filter((c) => fechaCompraYmd(c) >= fechaLunesStr)
  }, [compras, filtroPeriodo, fechaHoyStr, fechaLunesStr])

  const totalFiltrado = useMemo(
    () => comprasFiltradas.reduce((a, c) => a + (Number(c.cantidad) || 0) * (Number(c.precio) || 0), 0),
    [comprasFiltradas]
  )

  const tituloTotalKpi = useMemo(() => {
    if (filtroPeriodo === FILTRO_HOY) return 'Total compras de hoy'
    if (filtroPeriodo === FILTRO_SEMANA) return 'Total compras semana'
    return 'Total compras (todas)'
  }, [filtroPeriodo])

  const tituloFooterTotal = useMemo(() => {
    if (filtroPeriodo === FILTRO_HOY) return 'Total compras de hoy'
    if (filtroPeriodo === FILTRO_SEMANA) return 'Total compras semana'
    return 'Total compras'
  }, [filtroPeriodo])

  const gruposPorFecha = useMemo(() => {
    const map = new Map()
    for (const c of comprasFiltradas) {
      const f = fechaCompraYmd(c)
      if (!map.has(f)) map.set(f, [])
      map.get(f).push(c)
    }
    const keys = [...map.keys()].sort((a, b) => b.localeCompare(a))
    return keys.map((fecha) => ({ fecha, items: map.get(fecha) }))
  }, [comprasFiltradas])

  const variasFechas = gruposPorFecha.length > 1

  const etiquetaRegistro = (fechaYmd) => {
    if (fechaYmd === fechaHoyStr) return 'Registrada: hoy'
    const d = parseDateLocal(fechaYmd)
    if (Number.isNaN(d.getTime())) return `Registrada: ${fechaYmd}`
    const short = d
      .toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
      .replace(/\./g, '')
    const S = short.charAt(0).toUpperCase() + short.slice(1)
    return `Registrada: ${S}`
  }

  const tituloGrupoFecha = (fechaYmd) => {
    if (fechaYmd === fechaHoyStr) return 'Hoy'
    const d = parseDateLocal(fechaYmd)
    if (Number.isNaN(d.getTime())) return fechaYmd
    const t = d.toLocaleDateString('es-DO', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return t.charAt(0).toUpperCase() + t.slice(1)
  }

  const agregarTodo = async () => {
    if (!lineasSugeridas.length) return
    setAgregandoSug(true)
    try {
      await agregarSugerenciasACompras(lineasSugeridas)
      setPanelCalc(false)
    } finally {
      setAgregandoSug(false)
    }
  }

  const pillBase =
    'rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-[0.99] sm:text-sm'
  const pillOff =
    'border border-gray-200/90 bg-white/70 text-gray-600 hover:border-[#1D9E75]/40 hover:text-[#1D9E75] dark:border-white/15 dark:bg-gray-900/50 dark:text-gray-300 dark:hover:border-brand/50 dark:hover:text-brand-soft'
  const pillOn =
    'border border-[#1D9E75]/50 bg-[#1D9E75] text-white shadow-sm dark:border-brand/50 dark:bg-brand'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="juice-kpi border-rose-200/40 from-white/95 via-rose-50/50 to-amber-50/35 dark:border-rose-500/20 dark:from-gray-900/80 dark:via-rose-950/40 dark:to-amber-950/25">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">{tituloTotalKpi}</p>
          <p className="text-2xl font-semibold text-red-500 dark:text-red-400">
            {formatConMoneda(config, totalFiltrado)}
          </p>
        </div>
        <div className="juice-kpi">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ítems (período)</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{comprasFiltradas.length}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPanelCalc(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] dark:bg-brand dark:hover:brightness-110"
      >
        <ShoppingCart className="h-5 w-5" strokeWidth={2} />
        ¿Qué necesito comprar?
      </button>

      {panelCalc && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calc-compras-titulo"
        >
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#E5E7EB] bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
              <h2 id="calc-compras-titulo" className="text-sm font-bold text-[#111827] dark:text-white">
                Compras sugeridas (estimación)
              </h2>
              <button
                type="button"
                onClick={() => setPanelCalc(false)}
                className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs text-[#6B7280] dark:text-gray-400">
                Según el <strong>plan semanal</strong> (suma de jugos grandes y pequeños planificados por día) y
                recetas aproximadas. Ajusta cantidades en la lista después de agregar.
              </p>
              {!plan || plan.length === 0 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
                  No hay plan cargado. Abre la pestaña <strong>Plan</strong> y espera a que sincronice, o vuelve a
                  intentar.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Plan de la semana:{' '}
                    <span className="font-semibold text-[#1D9E75] dark:text-brand-soft">
                      {estimacion.G} grandes
                    </span>
                    ,{' '}
                    <span className="font-semibold text-[#1D9E75] dark:text-brand-soft">
                      {estimacion.P} pequeños
                    </span>{' '}
                    (total planificado).
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
                    Para tu plan de esta semana necesitas (aprox.):
                  </p>
                  <ul className="space-y-2 rounded-xl border border-gray-200 bg-[#F9FAFB] p-3 dark:border-white/10 dark:bg-zinc-800/50">
                    {lineasSugeridas.length === 0 ? (
                      <li className="text-sm text-gray-500 dark:text-gray-400">Sin cantidades que sugerir.</li>
                    ) : (
                      lineasSugeridas.map((l) => (
                        <li key={l.nombre} className="flex justify-between text-sm font-medium text-gray-800 dark:text-gray-100">
                          <span>{l.nombre}</span>
                          <span className="tabular-nums text-[#1D9E75] dark:text-brand-soft">~{l.cantidad} uds.</span>
                        </li>
                      ))
                    )}
                  </ul>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">
                    1 grande ≈ 3 naranjas / 2 mangos / ¼ piña · 1 pequeño ≈ 2 naranjas / 1 mango / ⅛ piña
                  </p>
                  <button
                    type="button"
                    disabled={!lineasSugeridas.length || agregandoSug}
                    onClick={() => void agregarTodo()}
                    className="w-full rounded-xl border-2 border-dashed border-[#1D9E75]/50 py-3 text-sm font-semibold text-[#1D9E75] transition hover:bg-emerald-50 disabled:opacity-50 dark:border-brand/50 dark:text-brand-soft dark:hover:bg-emerald-950/30"
                  >
                    {agregandoSug ? 'Agregando…' : 'Agregar todo a Compras'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="juice-card overflow-hidden">
        <div className="flex w-full flex-col gap-2 border-b border-white/50 bg-white/40 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/30 sm:flex-row sm:flex-wrap sm:items-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:mr-1">
            Ver
          </p>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-1">
            <button
              type="button"
              onClick={() => setFiltroPeriodo(FILTRO_HOY)}
              className={`${pillBase} flex-1 sm:flex-none ${filtroPeriodo === FILTRO_HOY ? pillOn : pillOff}`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setFiltroPeriodo(FILTRO_SEMANA)}
              className={`${pillBase} flex-1 sm:flex-none ${filtroPeriodo === FILTRO_SEMANA ? pillOn : pillOff}`}
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => setFiltroPeriodo(FILTRO_TODO)}
              className={`${pillBase} flex-1 sm:flex-none ${filtroPeriodo === FILTRO_TODO ? pillOn : pillOff}`}
            >
              Todo
            </button>
          </div>
        </div>

        {comprasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay compras registradas para este período</p>
            <button
              type="button"
              onClick={() => void agregarCompra()}
              className="rounded-xl bg-[#1D9E75] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] dark:bg-brand"
            >
              Agregar compra de hoy
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-2 border-b border-white/50 bg-gradient-to-r from-emerald-50/60 to-stone-50/40 px-4 py-2 text-xs font-medium text-gray-600 backdrop-blur-sm dark:border-white/10 dark:from-emerald-950/45 dark:to-stone-900/35 dark:text-gray-300">
              <span className="col-span-5">Ingrediente</span>
              <span className="col-span-2 text-center">Cant.</span>
              <span className="col-span-3 text-center">Precio</span>
              <span className="col-span-2 text-center">Total</span>
            </div>
            {gruposPorFecha.map(({ fecha: fechaGrupo, items }) => (
              <div key={fechaGrupo}>
                {variasFechas ? (
                  <div className="border-b border-emerald-200/50 bg-emerald-50/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1D9E75] dark:border-white/10 dark:bg-emerald-950/35 dark:text-brand-soft">
                    {tituloGrupoFecha(fechaGrupo)}
                  </div>
                ) : null}
                {items.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-12 items-center gap-2 border-b border-surface-muted px-3 py-2 last:border-0 dark:border-white/10"
                  >
                    <div className="col-span-5 flex min-w-0 flex-col gap-0.5">
                      <input
                        value={c.nombre}
                        onChange={(e) => updateCompra(c.id, 'nombre', e.target.value)}
                        placeholder="Nombre"
                        className="w-full rounded border border-white/60 bg-white/70 px-2 py-1 text-xs text-gray-900 backdrop-blur-sm placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 dark:border-white/15 dark:bg-gray-900/55 dark:text-gray-100 dark:placeholder:text-gray-500"
                      />
                      <span className="inline-flex w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-400">
                        {etiquetaRegistro(fechaCompraYmd(c))}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={c.cantidad}
                      onChange={(e) => updateCompra(c.id, 'cantidad', e.target.value)}
                      className="col-span-2 rounded border border-white/60 bg-white/70 px-1 py-1 text-center text-xs text-gray-900 backdrop-blur-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 dark:border-white/15 dark:bg-gray-900/55 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      min="0"
                      value={c.precio}
                      onChange={(e) => updateCompra(c.id, 'precio', e.target.value)}
                      className="col-span-3 rounded border border-white/60 bg-white/70 px-1 py-1 text-center text-xs text-gray-900 backdrop-blur-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 dark:border-white/15 dark:bg-gray-900/55 dark:text-gray-100"
                    />
                    <div className="col-span-2 flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {formatConMoneda(config, (c.cantidad || 0) * (c.precio || 0))}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarCompra(c.id)}
                        className="shrink-0 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex justify-between border-t border-white/50 bg-gradient-to-r from-rose-50/40 to-emerald-50/30 px-4 py-2 text-sm font-semibold backdrop-blur-sm dark:border-white/10 dark:from-rose-950/35 dark:to-emerald-950/30">
              <span className="text-gray-700 dark:text-gray-200">{tituloFooterTotal}</span>
              <span className="text-red-500 dark:text-red-400">{formatConMoneda(config, totalFiltrado)}</span>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => void agregarCompra()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border py-3 text-sm font-medium text-gray-500 transition-colors hover:border-brand hover:text-brand dark:border-white/20 dark:text-gray-400 dark:hover:border-brand-soft dark:hover:text-brand-soft"
      >
        <Plus size={16} /> Agregar ingrediente
      </button>
    </div>
  )
}
