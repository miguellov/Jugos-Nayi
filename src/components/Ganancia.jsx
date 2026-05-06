import { useMemo } from 'react'
import { useStore } from '../store/useStore'

export default function Ganancias() {
  const { compras, ventas, PG, PP } = useStore()

  const ingresos = useMemo(
    () => ventas.reduce((a, v) => a + (Number(v.total) || 0), 0),
    [ventas]
  )

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
              <span className="text-sm font-semibold text-brand dark:text-brand-soft">${r.total.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      <div className="juice-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Resumen financiero
        </p>
        {[
          ['Precio jugo grande', '$' + Number(PG).toLocaleString(), 'text-gray-700 dark:text-gray-200'],
          ['Precio jugo pequeño', '$' + Number(PP).toLocaleString(), 'text-gray-700 dark:text-gray-200'],
          ['Ingresos (ventas hoy)', '$' + ingresos.toLocaleString(), 'text-brand dark:text-brand-soft'],
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
