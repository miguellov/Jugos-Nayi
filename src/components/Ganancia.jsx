import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  useStore,
  formatConMoneda,
  formatDateLocal,
  parseDateLocal,
  dateRangeForYmd,
  mondayOfDate,
  fechaCompraYmd,
} from '../store/useStore'
import { useMayoristasActivo } from '../store/useMayoristasActivo'

const BRAND = '#1D9E75'
const GASTOS = '#f87171'
const VERDE_HOY = '#1D9E75'
const VERDE_SUAVE = '#5DCAA5'
const GRIS_VACIO = '#B4B2A9'
const GRIS_TEXTO = '#B4B2A9'

/** Mismo formato que PlanDiario.jsx: "Lun 4 may — Dom 10 may" */
function formatRangoSemana(lunesKey) {
  const start = parseDateLocal(lunesKey)
  if (Number.isNaN(start.getTime())) return lunesKey
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const o = { weekday: 'short', day: 'numeric', month: 'short' }
  const a = start.toLocaleDateString('es-DO', o)
  const b = end.toLocaleDateString('es-DO', o)
  const A = a.charAt(0).toUpperCase() + a.slice(1)
  const B = b.charAt(0).toUpperCase() + b.slice(1)
  return `${A} — ${B}`
}

function rangoIsoSemanaDesdeLunes(lunesYmd) {
  const start = parseDateLocal(lunesYmd)
  if (Number.isNaN(start.getTime())) return { startIso: '', endIso: '', startMs: 0, endMs: 0 }
  const rangeStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0)
  const rangeEnd = new Date(rangeStart)
  rangeEnd.setDate(rangeEnd.getDate() + 7)
  return {
    startIso: rangeStart.toISOString(),
    endIso: rangeEnd.toISOString(),
    startMs: rangeStart.getTime(),
    endMs: rangeEnd.getTime(),
  }
}

function totalLineaVenta(v) {
  const t = Number(v.total)
  if (t) return t
  return (Number(v.qty) || 0) * (Number(v.precio) || 0)
}

function montoLineaCompra(c) {
  return (Number(c.cantidad) || 0) * (Number(c.precio) || 0)
}

function etiquetaDiaCorto(fechaYmd) {
  const d = parseDateLocal(fechaYmd)
  if (Number.isNaN(d.getTime())) return fechaYmd
  const wd = d.toLocaleDateString('es-DO', { weekday: 'long' })
  const mes = d.toLocaleDateString('es-DO', { month: 'short' }).replace(/\./g, '')
  const dia = d.getDate()
  const W = wd.charAt(0).toUpperCase() + wd.slice(1)
  const M = mes.charAt(0).toUpperCase() + mes.slice(1)
  return `${W} ${dia} ${M}`
}

function desgloseDesdeVentas(lista) {
  const acc = {
    grande: { cantidad: 0, ingreso: 0 },
    pequeno: { cantidad: 0, ingreso: 0 },
  }
  for (const row of lista || []) {
    const tam = row.tam === 'grande' ? 'grande' : row.tam === 'pequeno' ? 'pequeno' : null
    if (!tam) continue
    acc[tam].cantidad += Number(row.qty) || 0
    acc[tam].ingreso += totalLineaVenta(row)
  }
  return acc
}

export default function Ganancias() {
  const compras = useStore((s) => s.compras)
  const ventas = useStore((s) => s.ventas)
  const PG = useStore((s) => s.PG)
  const PP = useStore((s) => s.PP)
  const config = useStore((s) => s.config)
  const semanas = useStore((s) => s.semanas)
  const semanaActiva = useStore((s) => s.semanaActiva)
  const semanasCerradas = useStore((s) => s.semanasCerradas)
  const ordenesMayoristas = useStore((s) => s.ordenesMayoristas)
  const cargarVentas = useStore((s) => s.cargarVentas)
  const cargarCompras = useStore((s) => s.cargarCompras)
  const cargarSemanas = useStore((s) => s.cargarSemanas)
  const cargarSemanasCerradasList = useStore((s) => s.cargarSemanasCerradasList)
  const fetchVentasRango = useStore((s) => s.fetchVentasRango)
  const cargarOrdenesMayoristas = useStore((s) => s.cargarOrdenesMayoristas)
  const mayoristasOn = useMayoristasActivo()

  const [semanaLunes, setSemanaLunes] = useState(() => useStore.getState().semanaActiva || '')
  const [ventasRango, setVentasRango] = useState([])
  const [cargandoVentasSemana, setCargandoVentasSemana] = useState(false)

  const opcionesSemana = useMemo(() => {
    const set = new Set(semanas || [])
    if (semanaActiva) set.add(semanaActiva)
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [semanas, semanaActiva])

  const hoyStr = formatDateLocal(new Date())
  const lunesCalendarioActual = formatDateLocal(mondayOfDate())
  const esSemanaCalendarioActual = Boolean(semanaLunes && semanaLunes === semanaActiva)

  useEffect(() => {
    void cargarSemanas()
    void cargarSemanasCerradasList()
  }, [cargarSemanas, cargarSemanasCerradasList])

  useEffect(() => {
    if (semanaLunes) return
    const pick = semanaActiva || opcionesSemana[0]
    if (pick) setSemanaLunes(pick)
  }, [semanaLunes, semanaActiva, opcionesSemana])

  useEffect(() => {
    void cargarVentas()
    void cargarCompras()
  }, [cargarVentas, cargarCompras])

  useEffect(() => {
    if (mayoristasOn) void cargarOrdenesMayoristas()
  }, [mayoristasOn, cargarOrdenesMayoristas])

  useEffect(() => {
    if (!semanaLunes) return
    let cancelled = false
    const { startIso, endIso } = rangoIsoSemanaDesdeLunes(semanaLunes)
    if (!startIso || !endIso) return
    setCargandoVentasSemana(true)
    void (async () => {
      const rows = await fetchVentasRango(startIso, endIso)
      if (!cancelled) {
        setVentasRango(rows)
        setCargandoVentasSemana(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [semanaLunes, fetchVentasRango])

  const { startMs, endMs } = useMemo(() => {
    const { startMs: a, endMs: b } = rangoIsoSemanaDesdeLunes(semanaLunes)
    return { startMs: a, endMs: b }
  }, [semanaLunes])

  const ingresosRetailHoy = useMemo(
    () => ventas.reduce((a, v) => a + totalLineaVenta(v), 0),
    [ventas]
  )

  const ingresosRetailSemana = useMemo(
    () => ventasRango.reduce((a, v) => a + totalLineaVenta(v), 0),
    [ventasRango]
  )

  const { ingresoMayoristasHoy, ingresoMayoristasSemana, numOrdenesMayoristasHoy } = useMemo(() => {
    if (!mayoristasOn) {
      return { ingresoMayoristasHoy: 0, ingresoMayoristasSemana: 0, numOrdenesMayoristasHoy: 0 }
    }
    const { start, end } = dateRangeForYmd(hoyStr)
    const startMsHoy = new Date(start).getTime()
    const endMsHoy = new Date(end).getTime()

    let sumHoy = 0
    let sumSem = 0
    let nHoy = 0
    for (const o of ordenesMayoristas) {
      if (o.estado !== 'entregado') continue
      const t = o.created_at ? new Date(o.created_at).getTime() : NaN
      if (!Number.isFinite(t)) continue
      const tot = Number(o.total) || 0
      if (t >= startMsHoy && t < endMsHoy) {
        sumHoy += tot
        nHoy += 1
      }
      if (t >= startMs && t < endMs) sumSem += tot
    }
    return {
      ingresoMayoristasHoy: sumHoy,
      ingresoMayoristasSemana: sumSem,
      numOrdenesMayoristasHoy: nHoy,
    }
  }, [mayoristasOn, ordenesMayoristas, hoyStr, startMs, endMs])

  const ingresosHoy = ingresosRetailHoy + ingresoMayoristasHoy
  const ingresosSemana = ingresosRetailSemana + ingresoMayoristasSemana

  const gastosHoy = useMemo(
    () =>
      compras
        .filter((c) => fechaCompraYmd(c) === hoyStr)
        .reduce((a, c) => a + montoLineaCompra(c), 0),
    [compras, hoyStr]
  )

  const gastosSemana = useMemo(() => {
    if (!semanaLunes) return 0
    const lun = parseDateLocal(semanaLunes)
    if (Number.isNaN(lun.getTime())) return 0
    const domingo = new Date(lun.getFullYear(), lun.getMonth(), lun.getDate() + 6)
    const domingoStr = formatDateLocal(domingo)
    return compras
      .filter((c) => {
        const f = fechaCompraYmd(c)
        return f >= semanaLunes && f <= domingoStr
      })
      .reduce((a, c) => a + montoLineaCompra(c), 0)
  }, [compras, semanaLunes])

  const gastosTotales = useMemo(
    () => compras.reduce((a, c) => a + montoLineaCompra(c), 0),
    [compras]
  )

  const gananciaHoy = ingresosHoy - gastosHoy
  const gananciaSemana = ingresosSemana - gastosSemana

  const historialSemana = useMemo(() => {
    if (!semanaLunes || !startMs) return []
    const start = parseDateLocal(semanaLunes)
    if (Number.isNaN(start.getTime())) return []
    const porDia = new Map()
    for (const v of ventasRango) {
      if (!v.created_at) continue
      const ymd = formatDateLocal(new Date(v.created_at))
      porDia.set(ymd, (porDia.get(ymd) || 0) + totalLineaVenta(v))
    }
    const dias = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 0, 0, 0, 0)
      const fecha = formatDateLocal(d)
      dias.push({ fecha, monto: porDia.get(fecha) || 0 })
    }
    return dias
  }, [semanaLunes, startMs, ventasRango])

  const maxDelHistorialSemana = useMemo(
    () => historialSemana.reduce((m, r) => Math.max(m, Number(r.monto) || 0), 0),
    [historialSemana]
  )

  const desgloseXTamano = useMemo(() => desgloseDesdeVentas(ventasRango), [ventasRango])

  const porSabor = useMemo(() => {
    const m = new Map()
    for (const v of ventasRango) {
      const key = v.sabor
      if (!m.has(key)) {
        m.set(key, { sabor: key, emoji: v.emoji, qty: 0, total: 0 })
      }
      const row = m.get(key)
      row.qty += Number(v.qty) || 0
      row.total += totalLineaVenta(v)
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [ventasRango])

  const chartDataHoy = useMemo(
    () => [
      { nombre: 'Ingresos', monto: ingresosHoy, fill: BRAND },
      { nombre: 'Gastos', monto: gastosHoy, fill: GASTOS },
    ],
    [ingresosHoy, gastosHoy]
  )

  const chartDataSemana = useMemo(
    () => [
      { nombre: 'Ingresos', monto: ingresosSemana, fill: BRAND },
      { nombre: 'Gastos', monto: gastosSemana, fill: GASTOS },
    ],
    [ingresosSemana, gastosSemana]
  )

  const g = desgloseXTamano?.grande ?? { cantidad: 0, ingreso: 0 }
  const p = desgloseXTamano?.pequeno ?? { cantidad: 0, ingreso: 0 }
  const ingresoDesgloseTotal = g.ingreso + p.ingreso
  const pctGrande =
    ingresoDesgloseTotal > 0 ? Math.round((g.ingreso / ingresoDesgloseTotal) * 100) : 0
  const pctPequeno =
    ingresoDesgloseTotal > 0 ? Math.round((p.ingreso / ingresoDesgloseTotal) * 100) : 0

  const semanaEsPasadaOCerradaUi = Boolean(semanaLunes && semanaLunes !== semanaActiva)
  const semanaCerradaNegocio = Boolean(semanaLunes && semanasCerradas?.includes(semanaLunes))

  return (
    <div className="space-y-4">
      <div className="juice-card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="min-w-0 w-full flex-1 text-xs font-medium text-gray-600 dark:text-gray-400 sm:min-w-[12rem]">
            <span className="mb-1 block">Semana</span>
            <select
              value={semanaLunes}
              onChange={(e) => {
                const v = e.target.value
                if (v) setSemanaLunes(v)
              }}
              className="w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm backdrop-blur-sm focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 dark:border-white/15 dark:bg-gray-900/70 dark:text-gray-100"
            >
              {opcionesSemana.length === 0 && semanaActiva && (
                <option value={semanaActiva}>{formatRangoSemana(semanaActiva)}</option>
              )}
              {opcionesSemana.map((key) => (
                <option key={key} value={key}>
                  {formatRangoSemana(key)}
                  {key === semanaActiva ? ' · Semana actual' : ''}
                </option>
              ))}
            </select>
          </label>
          {semanaLunes === semanaActiva ? (
            <span className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 sm:w-auto dark:bg-emerald-900/50 dark:text-emerald-100">
              Semana actual
            </span>
          ) : semanaLunes ? (
            <span className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 sm:w-auto dark:bg-white/10 dark:text-gray-300">
              Semana cerrada
            </span>
          ) : null}
        </div>
        {semanaEsPasadaOCerradaUi ? (
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Datos históricos de la semana seleccionada — solo lectura.
            {semanaCerradaNegocio ? ' Esta semana fue cerrada en el plan.' : null}
          </p>
        ) : null}
        {cargandoVentasSemana ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Cargando ventas del período…</p>
        ) : null}
      </div>

      {esSemanaCalendarioActual ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Hoy ({hoyStr})
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="juice-kpi">
              <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ingresos hoy</p>
              <p className="text-lg font-semibold text-brand dark:text-brand-soft">
                {formatConMoneda(config, ingresosHoy)}
              </p>
              {mayoristasOn && ingresoMayoristasHoy > 0 ? (
                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                  Ventas {formatConMoneda(config, ingresosRetailHoy)} + mayor.{' '}
                  {formatConMoneda(config, ingresoMayoristasHoy)}
                </p>
              ) : (
                <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                  Tabla ventas: {formatConMoneda(config, ingresosRetailHoy)}
                </p>
              )}
            </div>
            <div className="juice-kpi border-rose-200/35 from-white/95 via-rose-50/45 to-amber-50/30 dark:border-rose-500/20 dark:from-gray-900/80 dark:via-rose-950/40 dark:to-amber-950/25">
              <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Gastos hoy</p>
              <p className="text-lg font-semibold text-red-500 dark:text-red-400">
                {formatConMoneda(config, gastosHoy)}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Compras registradas hoy</p>
            </div>
            <div className="juice-kpi">
              <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ganancia neta hoy</p>
              <p
                className={`text-lg font-semibold ${gananciaHoy >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
              >
                {formatConMoneda(config, gananciaHoy)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Semana completa ({formatRangoSemana(semanaLunes || lunesCalendarioActual)})
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="juice-kpi">
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ingresos semana</p>
            <p className="text-lg font-semibold text-brand dark:text-brand-soft">
              {formatConMoneda(config, ingresosSemana)}
            </p>
            {mayoristasOn && ingresoMayoristasSemana > 0 ? (
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                Ventas {formatConMoneda(config, ingresosRetailSemana)} + mayor.{' '}
                {formatConMoneda(config, ingresoMayoristasSemana)}
              </p>
            ) : (
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                Lun–dom · tabla ventas + mayoristas
              </p>
            )}
          </div>
          <div className="juice-kpi border-rose-200/35 from-white/95 via-rose-50/45 to-amber-50/30 dark:border-rose-500/20 dark:from-gray-900/80 dark:via-rose-950/40 dark:to-amber-950/25">
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Gastos semana</p>
            <p className="text-lg font-semibold text-red-500 dark:text-red-400">
              {formatConMoneda(config, gastosSemana)}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Compras en el período</p>
          </div>
          <div className="juice-kpi">
            <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ganancia neta semana</p>
            <p
              className={`text-lg font-semibold ${gananciaSemana >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
            >
              {formatConMoneda(config, gananciaSemana)}
            </p>
          </div>
        </div>
      </div>

      {esSemanaCalendarioActual ? (
        <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
            Ingresos vs gastos — hoy
          </p>
          <div className="mx-auto w-full max-w-[300px] text-gray-600 dark:text-gray-400">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartDataHoy} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.35)' }}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(29,158,117,0.08)' }}
                  contentStyle={{
                    background: 'rgba(24,24,27,0.95)',
                    border: '1px solid rgba(29,158,117,0.35)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value) => [formatConMoneda(config, value), '']}
                />
                <Bar dataKey="monto" radius={[8, 8, 0, 0]} maxBarSize={56}>
                  {chartDataHoy.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-center">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Ganancia neta hoy
            </p>
            <p
              className={`text-2xl font-bold tabular-nums ${gananciaHoy >= 0 ? 'text-[#1D9E75] dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
            >
              {formatConMoneda(config, gananciaHoy)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          Ingresos vs gastos — semana seleccionada
        </p>
        <div className="mx-auto w-full max-w-[300px] text-gray-600 dark:text-gray-400">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartDataSemana} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
              <XAxis
                dataKey="nombre"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                axisLine={{ stroke: 'rgba(148,163,184,0.35)' }}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(29,158,117,0.08)' }}
                contentStyle={{
                  background: 'rgba(24,24,27,0.95)',
                  border: '1px solid rgba(29,158,117,0.35)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value) => [formatConMoneda(config, value), '']}
              />
              <Bar dataKey="monto" radius={[8, 8, 0, 0]} maxBarSize={56}>
                {chartDataSemana.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-center">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ganancia neta semana
          </p>
          <p
            className={`text-2xl font-bold tabular-nums ${gananciaSemana >= 0 ? 'text-[#1D9E75] dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
          >
            {formatConMoneda(config, gananciaSemana)}
          </p>
        </div>
      </div>

      {mayoristasOn && esSemanaCalendarioActual ? (
        <div className="juice-card border-[#1D9E75]/25 p-4 dark:border-brand/30">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
            Ventas mayoristas (hoy)
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Órdenes <strong className="text-gray-900 dark:text-gray-100">entregadas</strong> en el día:{' '}
            <span className="font-bold tabular-nums text-[#1D9E75] dark:text-brand-soft">
              {numOrdenesMayoristasHoy}
            </span>
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#1D9E75] dark:text-brand-soft">
            {formatConMoneda(config, ingresoMayoristasHoy)}
            <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              facturado (entregado)
            </span>
          </p>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            Incluido en <strong>Ingresos hoy</strong> y en la ganancia del período cuando aplica.
          </p>
        </div>
      ) : null}

      <div className="juice-card overflow-hidden">
        <div className="border-b border-white/50 bg-gradient-to-r from-brand-softer/50 to-amber-50/35 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:from-brand/15 dark:to-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ventas por sabor — semana seleccionada
          </p>
        </div>
        {porSabor.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            Sin ventas en este período
          </p>
        ) : (
          porSabor.map((r) => (
            <div
              key={r.sabor}
              className="flex items-center justify-between border-b border-surface-muted px-4 py-3 last:border-0 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{r.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.sabor}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{r.qty} unidades</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-brand dark:text-brand-soft">
                {formatConMoneda(config, r.total)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="juice-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Resumen financiero
        </p>
        {[
          ['Precio jugo grande', formatConMoneda(config, PG), 'text-gray-700 dark:text-gray-200'],
          ['Precio jugo pequeño', formatConMoneda(config, PP), 'text-gray-700 dark:text-gray-200'],
          ...(esSemanaCalendarioActual && mayoristasOn
            ? [
                [
                  'Ingresos tabla ventas (hoy)',
                  formatConMoneda(config, ingresosRetailHoy),
                  'text-gray-700 dark:text-gray-200',
                ],
                [
                  'Ingresos mayoristas (entregado hoy)',
                  formatConMoneda(config, ingresoMayoristasHoy),
                  'text-[#1D9E75] dark:text-brand-soft',
                ],
                [
                  'Total ingresos hoy',
                  formatConMoneda(config, ingresosHoy),
                  'text-brand dark:text-brand-soft font-semibold',
                ],
              ]
            : esSemanaCalendarioActual
              ? [
                  [
                    'Ingresos ventas (hoy)',
                    formatConMoneda(config, ingresosRetailHoy),
                    'text-brand dark:text-brand-soft',
                  ],
                ]
              : []),
          ...(mayoristasOn
            ? [
                [
                  'Ingresos tabla ventas (semana)',
                  formatConMoneda(config, ingresosRetailSemana),
                  'text-gray-700 dark:text-gray-200',
                ],
                [
                  'Ingresos mayoristas (semana entregado)',
                  formatConMoneda(config, ingresoMayoristasSemana),
                  'text-[#1D9E75] dark:text-brand-soft',
                ],
                [
                  'Total ingresos semana',
                  formatConMoneda(config, ingresosSemana),
                  'text-brand dark:text-brand-soft font-semibold',
                ],
              ]
            : [
                [
                  'Ingresos ventas (semana)',
                  formatConMoneda(config, ingresosRetailSemana),
                  'text-brand dark:text-brand-soft',
                ],
              ]),
          ...(esSemanaCalendarioActual
            ? [['Gastos compras (hoy)', formatConMoneda(config, gastosHoy), 'text-red-500 dark:text-red-400']]
            : []),
          ['Gastos compras (semana)', formatConMoneda(config, gastosSemana), 'text-red-500 dark:text-red-400'],
          ['Gastos compras (histórico total)', formatConMoneda(config, gastosTotales), 'text-red-400 dark:text-red-300'],
        ].map(([label, val, cls]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`font-medium ${cls}`}>{val}</span>
          </div>
        ))}
        {esSemanaCalendarioActual ? (
          <div className="flex items-center justify-between border-t border-surface-border pt-3 dark:border-white/10">
            <span className="font-semibold text-gray-800 dark:text-gray-100">Ganancia neta hoy</span>
            <span
              className={`text-xl font-bold ${gananciaHoy >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
            >
              {formatConMoneda(config, gananciaHoy)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-surface-border pt-3 dark:border-white/10">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Ganancia neta semana</span>
          <span
            className={`text-xl font-bold ${gananciaSemana >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
          >
            {formatConMoneda(config, gananciaSemana)}
          </span>
        </div>
      </div>

      <div className="juice-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          La semana día a día (lun → dom)
        </p>
        {historialSemana.length === 0 ? (
          <p className="py-2 text-center text-sm text-gray-400 dark:text-gray-500">Sin datos</p>
        ) : (
          <ul className="space-y-3">
            {historialSemana.map((row, i) => {
              const monto = Number(row.monto) || 0
              const esHoyCalendario = row.fecha === hoyStr
              const diaAnterior = historialSemana[i - 1]
              const montoAnterior = diaAnterior != null ? Number(diaAnterior.monto) || 0 : null
              let flecha = null
              if (i > 0 && montoAnterior != null && monto !== montoAnterior) {
                flecha = monto > montoAnterior ? 'up' : 'down'
              }
              const anchoPct = maxDelHistorialSemana > 0 ? (monto / maxDelHistorialSemana) * 100 : 0
              const colorBarra =
                monto <= 0 ? GRIS_VACIO : esHoyCalendario ? VERDE_HOY : VERDE_SUAVE
              const pctMejor =
                monto > 0 && maxDelHistorialSemana > 0
                  ? Math.round((monto / maxDelHistorialSemana) * 100)
                  : null

              return (
                <li
                  key={row.fecha}
                  className="rounded-xl border border-gray-200/90 bg-white/50 p-3 dark:border-white/15 dark:bg-zinc-900/40"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {etiquetaDiaCorto(row.fecha)}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: monto > 0 ? VERDE_HOY : GRIS_TEXTO }}
                      >
                        {formatConMoneda(config, monto)}
                      </span>
                      {esHoyCalendario ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{ backgroundColor: VERDE_HOY }}
                        >
                          Hoy
                        </span>
                      ) : null}
                      {monto <= 0 ? (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                          Sin ventas
                        </span>
                      ) : null}
                      {flecha === 'up' ? (
                        <ArrowUp
                          className="shrink-0"
                          size={18}
                          strokeWidth={2.5}
                          style={{ color: VERDE_HOY }}
                          aria-label="Más que el día anterior"
                        />
                      ) : flecha === 'down' ? (
                        <ArrowDown
                          className="shrink-0 text-red-500 dark:text-red-400"
                          size={18}
                          strokeWidth={2.5}
                          aria-label="Menos que el día anterior"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-black/[0.06] dark:bg-white/10">
                    <div
                      className="h-2 rounded transition-[width] duration-300 ease-out"
                      style={{
                        width: `${anchoPct}%`,
                        maxWidth: '100%',
                        backgroundColor: colorBarra,
                        borderRadius: 4,
                        height: 8,
                      }}
                    />
                  </div>
                  {pctMejor != null ? (
                    <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {pctMejor}% del mejor día de la semana
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="juice-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          Por tamaño — semana seleccionada
        </p>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-gray-800 dark:text-gray-100">
              🥤 Grandes: <strong>{g.cantidad}</strong> jugos → {formatConMoneda(config, g.ingreso)}{' '}
              <span className="text-[#1D9E75] dark:text-brand-soft">({pctGrande}%)</span>
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-gray-800 dark:text-gray-100">
              🥤 Pequeños: <strong>{p.cantidad}</strong> jugos → {formatConMoneda(config, p.ingreso)}{' '}
              <span className="text-[#1D9E75] dark:text-brand-soft">({pctPequeno}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
