import { useEffect, useMemo } from 'react'
import { useStore, parseDateLocal } from '../store/useStore'
import { diaSemanaHoy } from '../store/defaults'

const inputCell =
  'box-border min-h-[40px] w-full min-w-[2.75rem] rounded-lg border border-white/60 bg-white/80 px-2 py-2 text-center text-sm tabular-nums text-gray-900 shadow-sm backdrop-blur-sm ' +
  'focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/35 ' +
  'dark:border-white/15 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:border-[#1D9E75] dark:focus:ring-[#1D9E75]/30'

const readCell =
  'box-border flex min-h-[40px] w-full min-w-[2.75rem] items-center justify-center rounded-lg border border-transparent bg-white/40 px-2 py-2 text-center text-sm tabular-nums text-gray-800 dark:bg-white/5 dark:text-gray-200'

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

export default function PlanDiario() {
  const plan = useStore((s) => s.plan)
  const semanas = useStore((s) => s.semanas)
  const semanaActiva = useStore((s) => s.semanaActiva)
  const semanaSeleccionada = useStore((s) => s.semanaSeleccionada)
  const PG = useStore((s) => s.PG)
  const PP = useStore((s) => s.PP)
  const cargarPlan = useStore((s) => s.cargarPlan)
  const cargarPlanPorSemana = useStore((s) => s.cargarPlanPorSemana)
  const cargarSemanas = useStore((s) => s.cargarSemanas)
  const cerrarSemana = useStore((s) => s.cerrarSemana)
  const updatePlan = useStore((s) => s.updatePlan)

  const opcionesSemana = useMemo(() => {
    const set = new Set(semanas || [])
    if (semanaActiva) set.add(semanaActiva)
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [semanas, semanaActiva])

  const puedeEditarPlan =
    Boolean(semanaSeleccionada) &&
    semanaSeleccionada === semanaActiva &&
    plan.length > 0 &&
    !plan[0].cerrada

  const puedeCerrar =
    Boolean(semanaSeleccionada) &&
    semanaSeleccionada === semanaActiva &&
    plan.length > 0 &&
    !plan[0].cerrada

  const tots = plan.reduce(
    (a, r) => ({
      pg: a.pg + r.pg,
      pp: a.pp + r.pp,
      vg: a.vg + r.vg,
      vp: a.vp + r.vp,
      ing: a.ing + r.vg * PG + r.vp * PP,
    }),
    { pg: 0, pp: 0, vg: 0, vp: 0, ing: 0 }
  )

  const diaHoyNombre = diaSemanaHoy()

  useEffect(() => {
    void (async () => {
      await cargarPlan()
      await cargarSemanas()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- al montar Plan solamente
  }, [])

  return (
    <div className="space-y-4">
      <div className="juice-card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="min-w-0 flex-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span className="mb-1 block">Semana</span>
            <select
              value={semanaSeleccionada ?? ''}
              onChange={(e) => {
                const v = e.target.value
                if (v) void cargarPlanPorSemana(v)
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
          {semanaSeleccionada === semanaActiva ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
              Semana actual
            </span>
          ) : semanaSeleccionada ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {parseDateLocal(semanaSeleccionada).toLocaleDateString('es-DO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {puedeCerrar && (
            <button
              type="button"
              onClick={() => void cerrarSemana()}
              className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-100/90 active:scale-[0.99] dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/55"
            >
              Cerrar semana
            </button>
          )}
        </div>

        {plan.length > 0 && plan[0].cerrada && semanaSeleccionada === semanaActiva && (
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200/90">
            Esta semana está cerrada; el plan es solo lectura.
          </p>
        )}
        {semanaSeleccionada !== semanaActiva && plan.length > 0 && (
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Semana histórica — solo lectura.
          </p>
        )}
      </div>

      {plan.length === 0 && (
        <div className="juice-card p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {semanaSeleccionada === semanaActiva
            ? 'Cargando plan de la semana…'
            : 'No hay plan guardado para esta semana.'}
        </div>
      )}

      {plan.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="juice-kpi">
              <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Total planeados</p>
              <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{tots.pg + tots.pp}</p>
            </div>
            <div className="juice-kpi">
              <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Total vendidos</p>
              <p className="text-2xl font-semibold text-brand dark:text-brand-soft">{tots.vg + tots.vp}</p>
            </div>
          </div>

          <div className="juice-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs">
                <thead className="border-b border-white/50 bg-gradient-to-r from-emerald-50/70 to-amber-50/40 backdrop-blur-sm dark:border-white/10 dark:from-emerald-950/50 dark:to-amber-950/35">
                  <tr>
                    {['Día', 'Grande', 'Pequeño', 'Ven. G', 'Ven. P', 'Ingreso', 'Estado'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.map((r) => {
                    const pg = Number(r.pg) || 0
                    const pp = Number(r.pp) || 0
                    const vg = Number(r.vg) || 0
                    const vp = Number(r.vp) || 0
                    const ing = vg * PG + vp * PP
                    const planTotal = pg + pp
                    const vendTotal = vg + vp
                    const diff = planTotal - vendTotal
                    const esHoy = r.dia === diaHoyNombre

                    let badge
                    if (planTotal === 0 && vendTotal === 0) {
                      badge = (
                        <span className="inline-flex min-h-[28px] items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                          —
                        </span>
                      )
                    } else if (diff === 0 && planTotal > 0) {
                      badge = (
                        <span className="inline-flex min-h-[28px] items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-900/45 dark:text-emerald-200">
                          ✓
                        </span>
                      )
                    } else if (diff > 0) {
                      badge = (
                        <span className="inline-flex min-h-[28px] items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          Falta {diff}
                        </span>
                      )
                    } else {
                      badge = (
                        <span className="inline-flex min-h-[28px] items-center rounded-full bg-red-50 px-2 py-0.5 text-red-600 dark:bg-red-950/55 dark:text-red-400">
                          +{Math.abs(diff)} de más
                        </span>
                      )
                    }

                    return (
                      <tr
                        key={r.id ?? r.dia}
                        className={`border-b border-surface-muted last:border-0 dark:border-white/10 ${
                          esHoy
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40'
                            : ''
                        }`}
                      >
                        <td className="px-2 py-2 align-middle font-medium text-gray-700 dark:text-gray-200">
                          <span className="inline-flex flex-wrap items-center gap-1.5">
                            {esHoy && (
                              <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>
                                ●
                              </span>
                            )}
                            {r.dia}
                            {esHoy && (
                              <span className="rounded-full bg-emerald-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 dark:bg-emerald-800/60 dark:text-emerald-100">
                                Hoy
                              </span>
                            )}
                          </span>
                        </td>
                        {[
                          ['pg', pg],
                          ['pp', pp],
                        ].map(([f, v]) => (
                          <td key={f} className="px-1 py-1.5 align-middle">
                            {puedeEditarPlan && r.id != null ? (
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={1}
                                value={v}
                                onChange={(e) => updatePlan(r.id, f, e.target.value)}
                                className={inputCell}
                                aria-label={`${r.dia} ${f}`}
                              />
                            ) : (
                              <span className={readCell} aria-label={`${r.dia} ${f}`}>
                                {v}
                              </span>
                            )}
                          </td>
                        ))}
                        {[
                          ['vg', vg],
                          ['vp', vp],
                        ].map(([f, v]) => (
                          <td key={f} className="px-1 py-1.5 align-middle">
                            <span className={readCell} aria-label={`${r.dia} ${f}`}>
                              {v}
                            </span>
                          </td>
                        ))}
                        <td className="px-2 py-2 align-middle font-medium text-brand dark:text-brand-soft">
                          ${ing.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 align-middle">{badge}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t border-white/50 bg-gradient-to-r from-brand-softer/60 to-amber-50/35 font-semibold text-gray-800 backdrop-blur-sm dark:border-white/10 dark:from-brand/15 dark:to-amber-950/30 dark:text-gray-100">
                  <tr>
                    <td className="px-2 py-2">Total</td>
                    <td className="px-2 py-2 text-center">{tots.pg}</td>
                    <td className="px-2 py-2 text-center">{tots.pp}</td>
                    <td className="px-2 py-2 text-center">{tots.vg}</td>
                    <td className="px-2 py-2 text-center">{tots.vp}</td>
                    <td className="px-2 py-2 text-brand dark:text-brand-soft">${tots.ing.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
