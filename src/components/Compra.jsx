import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Compras() {
  const { compras, agregarCompra, updateCompra, eliminarCompra } = useStore()
  const total = compras.reduce((a, c) => a + (c.cantidad || 0) * (c.precio || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="juice-kpi border-rose-200/40 from-white/95 via-rose-50/50 to-amber-50/35 dark:border-rose-500/20 dark:from-gray-900/80 dark:via-rose-950/40 dark:to-amber-950/25">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Total gastos</p>
          <p className="text-2xl font-semibold text-red-500 dark:text-red-400">${total.toLocaleString()}</p>
        </div>
        <div className="juice-kpi">
          <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Items</p>
          <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{compras.length}</p>
        </div>
      </div>

      <div className="juice-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b border-white/50 bg-gradient-to-r from-emerald-50/60 to-stone-50/40 px-4 py-2 text-xs font-medium text-gray-600 backdrop-blur-sm dark:border-white/10 dark:from-emerald-950/45 dark:to-stone-900/35 dark:text-gray-300">
          <span className="col-span-5">Ingrediente</span>
          <span className="col-span-2 text-center">Cant.</span>
          <span className="col-span-3 text-center">Precio</span>
          <span className="col-span-2 text-center">Total</span>
        </div>
        {compras.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-12 items-center gap-2 border-b border-surface-muted px-3 py-2 last:border-0 dark:border-white/10"
          >
            <input
              value={c.nombre}
              onChange={(e) => updateCompra(c.id, 'nombre', e.target.value)}
              placeholder="Nombre"
              className="col-span-5 rounded border border-white/60 bg-white/70 px-2 py-1 text-xs text-gray-900 backdrop-blur-sm placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 dark:border-white/15 dark:bg-gray-900/55 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
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
            <div className="col-span-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                ${((c.cantidad || 0) * (c.precio || 0)).toLocaleString()}
              </span>
              <button
                onClick={() => eliminarCompra(c.id)}
                className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-between border-t border-white/50 bg-gradient-to-r from-rose-50/40 to-emerald-50/30 px-4 py-2 text-sm font-semibold backdrop-blur-sm dark:border-white/10 dark:from-rose-950/35 dark:to-emerald-950/30">
          <span className="text-gray-700 dark:text-gray-200">Total compras</span>
          <span className="text-red-500 dark:text-red-400">${total.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={agregarCompra}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border py-3 text-sm font-medium text-gray-500 transition-colors hover:border-brand hover:text-brand dark:border-white/20 dark:text-gray-400 dark:hover:border-brand-soft dark:hover:text-brand-soft"
      >
        <Plus size={16} /> Agregar ingrediente
      </button>
    </div>
  )
}
