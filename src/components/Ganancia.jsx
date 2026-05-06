import { useEffect, useMemo } from 'react'
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
} from '../store/useStore'
import { useMayoristasActivo } from '../store/useMayoristasActivo'

const BRAND = '#1D9E75'
const GASTOS = '#f87171'
const VERDE_HOY = '#1D9E75'
const VERDE_SUAVE = '#5DCAA5'
const GRIS_VACIO = '#B4B2A9'
const GRIS_TEXTO = '#B4B2A9'

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

export default function Ganancias() {
  const compras = useStore((s) => s.compras)
  const ventas = useStore((s) => s.ventas)
  const PG = useStore((s) => s.PG)
  const PP = useStore((s) => s.PP)
  const config = useStore((s) => s.config)
  const historial7Dias = useStore((s) => s.historial7Dias)
  const desgloseXTamano = useStore((s) => s.desgloseXTamano)
  const ordenesMayoristas = useStore((s) => s.ordenesMayoristas)
  const cargarOrdenesMayoristas = useStore((s) => s.cargarOrdenesMayoristas)
  const mayoristasOn = useMayoristasActivo()

  useEffect(() => {
    const { cargarHistorial7Dias, cargarDesgloseXTamano } = useStore.getState()
    void cargarHistorial7Dias()
    void cargarDesgloseXTamano()
  }, [])

  useEffect(() => {
    if (mayoristasOn) void cargarOrdenesMayoristas()
  }, [mayoristasOn, cargarOrdenesMayoristas])

  const ingresosRetail = useMemo(
    () => ventas.reduce((a, v) => a + (Number(v.total) || 0), 0),
    [ventas]
  )

  const { ingresoMayoristasHoy, numOrdenesMayoristasHoy } = useMemo(() => {
    if (!mayoristasOn) return { ingresoMayoristasHoy: 0, numOrdenesMayoristasHoy: 0 }
    const hoyStr = formatDateLocal(new Date())
    const { start, end } = dateRangeForYmd(hoyStr)
    const startMs = new Date(start).getTime()
    const endMs = new Date(end).getTime()
    let sum = 0
    let n = 0
    for (const o of ordenesMayoristas) {
      if (o.estado !== 'entregado') continue
      const t = o.created_at ? new Date(o.created_at).getTime() : NaN
      if (!Number.isFinite(t) || t < startMs || t >= endMs) continue
      sum += Number(o.total) || 0
      n += 1
    }
    return { ingresoMayoristasHoy: sum, numOrdenesMayoristasHoy: n }
  }, [mayoristasOn, ordenesMayoristas])

  const ingresos = ingresosRetail + ingresoMayoristasHoy

  const porSabor = useMemo(() => {
    const m = new Map()
    for (const v of ventas) {
      const key = v.sabor
      if (!m.has(key)) {
        m.set(key, { sabor: key, emoji: v.emoji, qty: 0, total: 0 })
      }
      const row = m.get(key)
      row.qty += Number(v.qty) || 0
      row.total += Number(v.total) || 0
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [ventas])

  const gastos = compras.reduce((a, c) => a + (Number(c.cantidad) || 0) * (Number(c.precio) || 0), 0)
  const neta = ingresos - gastos

  const chartData = useMemo(
    () => [
      { nombre: 'Ingresos', monto: ingresos, fill: BRAND },
      { nombre: 'Gastos', monto: gastos, fill: GASTOS },
    ],
    [ingresos, gastos]
  )

  const hoyStr = formatDateLocal(new Date())
  const maxDelPeriodo = useMemo(
    () => historial7Dias.reduce((m, r) => Math.max(m, Number(r.monto) || 0), 0),
    [historial7Dias]
  )

  const g = desgloseXTamano?.grande ?? { cantidad: 0, ingreso: 0 }
  const p = desgloseXTamano?.pequeno ?? { cantidad: 0, ingreso: 0 }
  const ingresoDesgloseTotal = g.ingreso + p.ingreso
  const pctGrande =
    ingresoDesgloseTotal > 0 ? Math.round((g.ingreso / ingresoDesgloseTotal) * 100) : 0
  const pctPequeno =
    ingresoDesgloseTotal > 0 ? Math.round((p.ingreso / ingresoDesgloseTotal) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="juice-kpi">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ingresos</p>
          <p className="text-lg font-semibold text-brand dark:text-brand-soft">
            {formatConMoneda(config, ingresos)}
          </p>
          {mayoristasOn && ingresoMayoristasHoy > 0 ? (
            <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
              Punto venta {formatConMoneda(config, ingresosRetail)} + mayor.{' '}
              {formatConMoneda(config, ingresoMayoristasHoy)}
            </p>
          ) : null}
        </div>
        <div className="juice-kpi border-rose-200/35 from-white/95 via-rose-50/45 to-amber-50/30 dark:border-rose-500/20 dark:from-gray-900/80 dark:via-rose-950/40 dark:to-amber-950/25">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Gastos</p>
          <p className="text-lg font-semibold text-red-500 dark:text-red-400">
            {formatConMoneda(config, gastos)}
          </p>
        </div>
        <div className="juice-kpi">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ganancia</p>
          <p
            className={`text-lg font-semibold ${neta >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
          >
            {formatConMoneda(config, neta)}
          </p>
        </div>
      </div>

      <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          Ingresos vs gastos (hoy)
        </p>
        <div className="mx-auto w-full max-w-[300px] text-gray-600 dark:text-gray-400">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
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
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-center">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ganancia neta
          </p>
          <p
            className={`text-2xl font-bold tabular-nums ${neta >= 0 ? 'text-[#1D9E75] dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
          >
            {formatConMoneda(config, neta)}
          </p>
        </div>
      </div>

      {mayoristasOn ? (
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
            Este monto ya está incluido en <strong>Ingresos</strong> y en la ganancia neta de arriba.
          </p>
        </div>
      ) : null}

      <div className="juice-card overflow-hidden">
        <div className="border-b border-white/50 bg-gradient-to-r from-brand-softer/50 to-amber-50/35 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:from-brand/15 dark:to-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ventas de hoy por sabor
          </p>
        </div>
        {porSabor.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Sin ventas registradas hoy</p>
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
          ...(mayoristasOn
            ? [
                [
                  'Ingresos punto de venta (hoy)',
                  formatConMoneda(config, ingresosRetail),
                  'text-gray-700 dark:text-gray-200',
                ],
                [
                  'Ingresos mayoristas (entregado hoy)',
                  formatConMoneda(config, ingresoMayoristasHoy),
                  'text-[#1D9E75] dark:text-brand-soft',
                ],
                [
                  'Total ingresos hoy',
                  formatConMoneda(config, ingresos),
                  'text-brand dark:text-brand-soft font-semibold',
                ],
              ]
            : [['Ingresos (ventas hoy)', formatConMoneda(config, ingresos), 'text-brand dark:text-brand-soft']]),
          ['Total gastos compras', formatConMoneda(config, gastos), 'text-red-500 dark:text-red-400'],
        ].map(([label, val, cls]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`font-medium ${cls}`}>{val}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-surface-border pt-3 dark:border-white/10">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Ganancia neta</span>
          <span
            className={`text-xl font-bold ${neta >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}
          >
            {formatConMoneda(config, neta)}
          </span>
        </div>
      </div>

      <div className="juice-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          Últimos 7 días
        </p>
        {historial7Dias.length === 0 ? (
          <p className="py-2 text-center text-sm text-gray-400 dark:text-gray-500">Sin datos</p>
        ) : (
          <ul className="space-y-3">
            {historial7Dias.map((row, i) => {
              const monto = Number(row.monto) || 0
              const esHoy = row.fecha === hoyStr
              const diaAnterior = historial7Dias[i + 1]
              const montoAnterior = diaAnterior != null ? Number(diaAnterior.monto) || 0 : null
              let flecha = null
              if (montoAnterior != null && monto !== montoAnterior) {
                flecha = monto > montoAnterior ? 'up' : 'down'
              }
              const anchoPct = maxDelPeriodo > 0 ? (monto / maxDelPeriodo) * 100 : 0
              const colorBarra =
                monto <= 0 ? GRIS_VACIO : esHoy ? VERDE_HOY : VERDE_SUAVE
              const pctMejor =
                monto > 0 && maxDelPeriodo > 0 ? Math.round((monto / maxDelPeriodo) * 100) : null

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
                      {esHoy ? (
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
                      {pctMejor}% del mejor día
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
          Esta semana por tamaño
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
