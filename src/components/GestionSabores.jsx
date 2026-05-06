import { useState } from 'react'
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function GestionSabores() {
  const { sabores, agregarSabor, updateSabor, eliminarSabor } = useStore()
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="juice-card overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/30 dark:hover:bg-white/5"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          <Settings2 size={18} className="text-brand dark:text-brand-soft" />
          Gestionar sabores y existencias
        </span>
        {abierto ? (
          <ChevronUp size={18} className="text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {abierto && (
        <div className="space-y-3 border-t border-white/40 bg-gradient-to-b from-emerald-50/40 to-amber-50/25 px-4 py-3 dark:border-white/10 dark:from-emerald-950/40 dark:to-amber-950/25">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cambia el nombre, el emoji y cuántas unidades tienes de cada sabor. Al vender, se descuenta solo aquí.
          </p>
          {sabores.map((s) => (
            <div key={s.id} className="grid grid-cols-12 items-center gap-2">
              <input
                value={s.emoji}
                onChange={(e) => updateSabor(s.id, 'emoji', e.target.value.slice(0, 4))}
                className="col-span-2 rounded-lg border border-white/60 bg-white/75 px-2 py-2 text-center text-xl text-gray-900 backdrop-blur-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-gray-900/60 dark:text-gray-100"
                title="Emoji"
                aria-label="Emoji del sabor"
              />
              <input
                value={s.nombre}
                onChange={(e) => updateSabor(s.id, 'nombre', e.target.value)}
                placeholder="Nombre del jugo"
                className="col-span-6 rounded-lg border border-white/60 bg-white/75 px-2 py-2 text-sm text-gray-900 backdrop-blur-sm placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <input
                type="number"
                min="0"
                value={s.stock}
                onChange={(e) => updateSabor(s.id, 'stock', e.target.value)}
                className="col-span-3 rounded-lg border border-white/60 bg-white/75 px-2 py-2 text-center text-sm text-gray-900 backdrop-blur-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-gray-900/60 dark:text-gray-100"
                title="Unidades disponibles"
              />
              <button
                type="button"
                onClick={() => eliminarSabor(s.id)}
                className="col-span-1 flex justify-center py-2 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                aria-label="Eliminar sabor"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={agregarSabor}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-brand hover:text-brand dark:border-white/20 dark:text-gray-300 dark:hover:border-brand-soft dark:hover:text-brand-soft"
          >
            <Plus size={16} /> Agregar sabor
          </button>
        </div>
      )}
    </div>
  )
}
