import { useStore } from '../store/useStore'

export default function Ganancias() {
  const { plan, compras, PG, PP, ventas } = useStore()
  const ingresos = plan.reduce((a, r) => a + r.vg * PG + r.vp * PP, 0)
  const ingresoCajaHoy = ventas.reduce((a, v) => a + (v.total || 0), 0)
  const gastos = compras.reduce((a, c) => a + (c.cantidad || 0) * (c.precio || 0), 0)
  const neta = ingresos - gastos

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="juice-kpi">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ingresos</p>
          <p className="text-lg font-semibold text-brand dark:text-brand-soft">${ingresos.toLocaleString()}</p>
        </div>
        <div className="juice-kpi border-rose-200/35 from-white/95 via-rose-50/45 to-amber-50/30 dark:border-rose-500/20 dark:from-gray-900/80 dark:via-rose-950/40 dark:to-amber-950/25">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Gastos</p>
          <p className="text-lg font-semibold text-red-500 dark:text-red-400">${gastos.toLocaleString()}</p>
        </div>
        <div className="juice-kpi">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Ganancia</p>
          <p className={`text-lg font-semibold ${neta >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}>
            ${neta.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="juice-card overflow-hidden">
        <div className="border-b border-white/50 bg-gradient-to-r from-brand-softer/50 to-amber-50/35 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:from-brand/15 dark:to-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Desglose por día
          </p>
        </div>
        {plan.filter((r) => r.vg > 0 || r.vp > 0).length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Sin ventas registradas aún</p>
        ) : (
          plan
            .filter((r) => r.vg > 0 || r.vp > 0)
            .map((r) => {
              const ing = r.vg * PG + r.vp * PP
              return (
                <div
                  key={r.dia}
                  className="flex items-center justify-between border-b border-surface-muted px-4 py-3 last:border-0 dark:border-white/10"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.dia}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {r.vg} grandes · {r.vp} pequeños
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand dark:text-brand-soft">${ing.toLocaleString()}</span>
                </div>
              )
            })
        )}
      </div>

      <div className="juice-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Resumen financiero
        </p>
        {[
          ['Precio jugo grande', '$' + PG, 'text-gray-700 dark:text-gray-200'],
          ['Precio jugo pequeño', '$' + PP, 'text-gray-700 dark:text-gray-200'],
          [
            'Ventas hoy (caja)',
            '$' + ingresoCajaHoy.toLocaleString(),
            'text-gray-700 dark:text-gray-200',
          ],
          ['Total ingresos (plan semanal)', '$' + ingresos.toLocaleString(), 'text-brand dark:text-brand-soft'],
          ['Total gastos compras', '$' + gastos.toLocaleString(), 'text-red-500 dark:text-red-400'],
        ].map(([label, val, cls]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`font-medium ${cls}`}>{val}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-surface-border pt-3 dark:border-white/10">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Ganancia neta</span>
          <span className={`text-xl font-bold ${neta >= 0 ? 'text-brand dark:text-brand-soft' : 'text-red-500 dark:text-red-400'}`}>
            ${neta.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
