import { useStore } from '../store/useStore'

export default function PlanDiario() {
  const { plan, updatePlan, PG, PP } = useStore()
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
          <table className="w-full text-xs">
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
              {plan.map((r, i) => {
                const ing = r.vg * PG + r.vp * PP
                const diff = r.pg + r.pp - (r.vg + r.vp)
                const badge =
                  diff === 0 && r.pg + r.pp > 0 ? (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand-dark dark:bg-brand/30 dark:text-brand-soft">
                      ✓
                    </span>
                  ) : diff > 0 ? (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                      -{diff}
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                      +{Math.abs(diff)}
                    </span>
                  )
                return (
                  <tr key={r.dia} className="border-b border-surface-muted last:border-0 dark:border-white/10">
                    <td className="px-2 py-2 font-medium text-gray-700 dark:text-gray-200">{r.dia}</td>
                    {[
                      ['pg', r.pg],
                      ['pp', r.pp],
                      ['vg', r.vg],
                      ['vp', r.vp],
                    ].map(([f, v]) => (
                      <td key={f} className="px-1 py-1">
                        <input
                          type="number"
                          min="0"
                          value={v}
                          onChange={(e) => updatePlan(i, f, e.target.value)}
                          className="w-12 rounded border border-white/60 bg-white/70 px-1 py-1 text-center text-xs text-gray-900 backdrop-blur-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/25 dark:border-white/15 dark:bg-gray-900/55 dark:text-gray-100"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2 font-medium text-brand dark:text-brand-soft">${ing.toLocaleString()}</td>
                    <td className="px-2 py-2">{badge}</td>
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
