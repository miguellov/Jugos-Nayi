import { useEffect, useState } from 'react'
import { Plus, Minus, Check, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import GestionSabores from './GestionSabores'

export default function PuntoDeVenta() {
  const {
    sabores,
    ventas,
    agregarVenta,
    eliminarVenta,
    limpiarVentas,
    PG,
    PP,
  } = useStore()
  const [sabor, setSabor] = useState(null)
  const [tam, setTam] = useState(null)
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState('')

  const elegido = sabores.find((x) => x.id === sabor)
  const stockDisp = elegido?.stock ?? 0

  useEffect(() => {
    if (!sabor) return
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, stockDisp)))
  }, [sabor, stockDisp])

  const precio = tam === 'grande' ? PG : tam === 'pequeno' ? PP : 0
  const subtotal = precio * qty
  const puedeVender =
    elegido &&
    tam &&
    qty >= 1 &&
    qty <= stockDisp &&
    stockDisp > 0

  const registrar = () => {
    if (!puedeVender || !elegido) return
    const hora = new Date().toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    })
    agregarVenta({
      saborId: elegido.id,
      sabor: elegido.nombre,
      emoji: elegido.emoji,
      tam,
      qty,
      precio,
      total: subtotal,
      hora,
    })
    setToast(`${elegido.emoji} ${qty}x ${elegido.nombre} ${tam} — $${subtotal}`)
    setTimeout(() => setToast(''), 2500)
    setSabor(null)
    setTam(null)
    setQty(1)
  }

  const totalDia = ventas.reduce((a, v) => a + v.total, 0)
  const cantidadDia = ventas.reduce((a, v) => a + v.qty, 0)

  return (
    <div className="space-y-4">
      <GestionSabores />

      <div className="grid grid-cols-2 gap-3">
        <div className="juice-kpi">
          <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">Ventas hoy</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{cantidadDia}</p>
        </div>
        <div className="juice-kpi">
          <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">Total cobrado</p>
          <p className="text-2xl font-bold tabular-nums text-brand dark:text-brand-soft">${totalDia.toLocaleString()}</p>
        </div>
      </div>

      {toast && (
        <div className="rounded-lg border border-brand/20 bg-brand-softer px-4 py-3 text-center text-sm font-medium text-brand-dark dark:border-brand/35 dark:bg-emerald-950/75 dark:text-brand-soft">
          ✅ {toast}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
          1. Elige el sabor
        </p>
        <div className="grid grid-cols-2 gap-2">
          {sabores.map((s) => {
            const agotado = s.stock <= 0
            return (
              <button
                key={s.id}
                type="button"
                disabled={agotado}
                onClick={() => !agotado && setSabor(s.id)}
                className={`rounded-xl border py-3 px-2 text-center transition-all
                ${agotado ? 'cursor-not-allowed border-surface-muted bg-surface-inset opacity-50 dark:border-white/10 dark:bg-white/5' : ''}
                ${!agotado && sabor === s.id
                  ? 'border-2 border-brand bg-gradient-to-br from-brand-softer to-emerald-100/50 shadow-juiceLift ring-2 ring-brand/15 dark:from-brand/25 dark:to-emerald-900/45 dark:ring-brand/35'
                  : !agotado && 'border-gray-200/90 bg-white/90 shadow-md backdrop-blur-sm hover:border-brand hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15'}`}
              >
                <span className="mb-1 block text-3xl">{s.emoji}</span>
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{s.nombre}</span>
                <span
                  className={`mt-1 inline-block text-xs font-semibold ${
                    agotado ? 'text-red-500' : 'text-brand-dark dark:text-brand-soft'
                  }`}
                >
                  {agotado ? 'Agotado' : `Quedan: ${s.stock}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
          2. Elige el tamaño
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['grande', 'Grande', '$100', 28],
            ['pequeno', 'Pequeño', '$65', 20],
          ].map(([id, label, precioTxt, sz]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTam(id)}
              className={`rounded-xl border py-4 text-center transition-all
                ${tam === id
                  ? 'border-2 border-brand bg-gradient-to-br from-brand-softer to-teal-50/80 shadow-juiceLift ring-2 ring-brand/15 dark:from-brand/25 dark:to-teal-950/50 dark:ring-brand/35'
                  : 'border-gray-200/90 bg-white/90 shadow-md backdrop-blur-sm hover:border-brand hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15'}`}
            >
              <span className="mb-1 block" style={{ fontSize: sz }}>
                🥤
              </span>
              <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">{label}</span>
              <span className="text-xs text-brand-dark dark:text-brand-soft">{precioTxt}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
          3. Cantidad
        </p>
        <div className="juice-card flex items-center gap-4 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={!elegido || stockDisp <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface-inset hover:border-brand hover:bg-brand-softer disabled:opacity-40 dark:border-white/15 dark:bg-white/5 dark:hover:bg-brand/20"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-xl font-semibold text-gray-800 dark:text-gray-100">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(stockDisp || 1, q + 1))}
              disabled={!elegido || qty >= stockDisp}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface-inset hover:border-brand hover:bg-brand-softer disabled:opacity-40 dark:border-white/15 dark:bg-white/5 dark:hover:bg-brand/20"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Subtotal</p>
            <p className="text-xl font-semibold text-brand dark:text-brand-soft">${subtotal.toLocaleString()}</p>
            {elegido && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Máx. {stockDisp} por existencia</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={registrar}
        disabled={!puedeVender}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-brand to-emerald-600 py-5 text-center text-lg font-semibold text-white
          shadow-[inset_0_2px_0_rgba(255,255,255,0.28),0_10px_28px_-6px_rgba(13,148,136,0.55)]
          hover:from-teal-700 hover:via-brand-dark hover:to-emerald-700 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.22),0_12px_32px_-6px_rgba(13,148,136,0.6)]
          active:scale-[0.99] active:brightness-95
          disabled:cursor-not-allowed disabled:bg-gradient-to-r disabled:from-stone-300 disabled:via-stone-300 disabled:to-stone-300 disabled:text-gray-500 disabled:shadow-none disabled:active:scale-100 dark:disabled:from-gray-700 dark:disabled:via-gray-700 dark:disabled:to-gray-700 dark:disabled:text-gray-400"
      >
        <Check size={24} strokeWidth={2.5} className="shrink-0" aria-hidden />
        <span>Registrar venta</span>
      </button>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-400">
            Ventas del día
          </p>
          <button
            type="button"
            onClick={limpiarVentas}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
          >
            <Trash2 size={12} /> Limpiar
          </button>
        </div>
        <div className="juice-card overflow-hidden">
          {ventas.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Sin ventas aún</p>
          ) : (
            ventas.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between border-b border-surface-muted px-4 py-3 last:border-0 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{v.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {v.qty > 1 ? `${v.qty}x ` : ''}
                      {v.sabor}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {v.tam === 'grande' ? 'Grande' : 'Pequeño'} · {v.hora}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand dark:text-brand-soft">
                    ${v.total.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarVenta(v.id)}
                    className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
