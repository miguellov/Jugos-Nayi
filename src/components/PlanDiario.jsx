import { useStore } from '../store/useStore'

const inputCell =
  'box-border min-h-[40px] w-full min-w-[2.75rem] rounded-lg border border-white/60 bg-white/80 px-2 py-2 text-center text-sm tabular-nums text-gray-900 shadow-sm backdrop-blur-sm ' +
  'focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/35 ' +
  'dark:border-white/15 dark:bg-gray-900/60 dark:text-gray-100 dark:focus:border-[#1D9E75] dark:focus:ring-[#1D9E75]/30'

export default function PlanDiario() {
  const { plan, updatePlan, iniciarSemana, PG, PP } = useStore()
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

  if (plan.length === 0) {
    return (
      <div className="space-y-4">
        <div className="juice-card flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            No hay filas de plan para esta semana en la base de datos.
          </p>
          <button
            type="button"
            onClick={() => void iniciarSemana()}
            className="rounded-xl bg-gradient-to-r from-teal-600 via-brand to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] dark:from-teal-700 dark:via-brand dark:to-emerald-700"
          >
            Iniciar semana
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Crea Lunes a Sábado con Plan G 40, Plan P 25, ventas 0.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
                {['Día', 'Plan G', 'Plan P', 'Vend G', 'Vend P', 'Ingreso', 'Estado'].map((h) => (
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
                      −{diff}
                    </span>
                  )
                } else {
                  badge = (
                    <span className="inline-flex min-h-[28px] items-center rounded-full bg-red-50 px-2 py-0.5 text-red-600 dark:bg-red-950/55 dark:text-red-400">
                      +{Math.abs(diff)}
                    </span>
                  )
                }

                return (
                  <tr key={r.id ?? r.dia} className="border-b border-surface-muted last:border-0 dark:border-white/10">
                    <td className="px-2 py-2 align-middle font-medium text-gray-700 dark:text-gray-200">{r.dia}</td>
                    {[
                      ['pg', pg],
                      ['pp', pp],
                      ['vg', vg],
                      ['vp', vp],
                    ].map(([f, v]) => (
                      <td key={f} className="px-1 py-1.5 align-middle">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={v}
                          onChange={(e) => updatePlan(r.id, f, e.target.value)}
                          disabled={r.id == null}
                          className={inputCell + (r.id == null ? ' opacity-50' : '')}
                          aria-label={`${r.dia} ${f}`}
                        />
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
    </div>
  )
}
