import { useMemo, useState } from 'react'
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useStore } from '../store/useStore'

const inputBase =
  'rounded-lg border bg-white/75 px-2 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 dark:bg-gray-900/60 dark:text-gray-100'

/** Sabores sugeridos (texto = columna `sabor` en BD). */
const SABORES_PREDEF = [
  { sabor: 'Naranja', emoji: '🍊' },
  { sabor: 'Chinola', emoji: '🟣' },
  { sabor: 'Limón', emoji: '🍋' },
  { sabor: 'Piña', emoji: '🍍' },
  { sabor: 'Mango', emoji: '🥭' },
  { sabor: 'Lechoza', emoji: '🍑' },
  { sabor: 'Zanahoria', emoji: '🥕' },
  { sabor: 'Melón', emoji: '🍈' },
  { sabor: 'Mix Tropical', emoji: '🍹' },
  { sabor: 'Tamarindo', emoji: '🫘' },
  { sabor: 'Fresa', emoji: '🍓' },
  { sabor: 'Sandía', emoji: '🍉' },
  { sabor: 'Uva', emoji: '🍇' },
  { sabor: 'Kiwi', emoji: '🥝' },
  { sabor: 'Guineo', emoji: '🍌' },
  { sabor: 'Cereza', emoji: '🍒' },
]

const EMOJI_OPCIONES = [
  '🍊',
  '🟣',
  '🍋',
  '🍍',
  '🥭',
  '🍑',
  '🥕',
  '🍈',
  '🍹',
  '🫘',
  '🍓',
  '🍉',
  '🍇',
  '🥝',
  '🍌',
  '🍒',
  '🥤',
  '🍎',
  '🥥',
  '🍐',
]

function normNombre(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
}

function fieldBorderClass(saborFieldStatus, saborId, field) {
  const st = saborFieldStatus[`${saborId}:${field}`]
  if (st === 'saving')
    return 'border-amber-400 ring-2 ring-amber-400/35 focus:border-amber-500 focus:ring-amber-400/40 dark:border-amber-500/70'
  if (st === 'ok')
    return 'border-emerald-500 ring-2 ring-emerald-500/25 focus:border-emerald-500 focus:ring-emerald-500/30'
  if (st === 'error')
    return 'border-red-500 ring-2 ring-red-500/30 focus:border-red-500 focus:ring-red-500/35'
  return 'border-white/60 focus:border-brand focus:ring-brand/20 dark:border-white/15'
}

export default function GestionSabores() {
  const sabores = useStore((s) => s.sabores)
  const agregarSaborInventario = useStore((s) => s.agregarSaborInventario)
  const updateSabor = useStore((s) => s.updateSabor)
  const eliminarSabor = useStore((s) => s.eliminarSabor)
  const saborFieldStatus = useStore((s) => s.saborFieldStatus)

  const [abierto, setAbierto] = useState(false)
  const [modalAgregar, setModalAgregar] = useState(false)
  const [saborCustom, setSaborCustom] = useState('')
  const [emojiCustom, setEmojiCustom] = useState('🥤')
  const [modalError, setModalError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const saboresExistentes = useMemo(
    () => new Set(sabores.map((s) => normNombre(s.sabor ?? s.nombre))),
    [sabores]
  )

  const predefDisponibles = useMemo(
    () => SABORES_PREDEF.filter((p) => !saboresExistentes.has(normNombre(p.sabor))),
    [saboresExistentes]
  )

  const cerrarModal = () => {
    setModalAgregar(false)
    setModalError('')
    setSaborCustom('')
    setEmojiCustom('🥤')
    setGuardando(false)
  }

  const agregarPredef = async (item) => {
    setModalError('')
    setGuardando(true)
    const res = await agregarSaborInventario({ sabor: item.sabor, emoji: item.emoji })
    setGuardando(false)
    if (!res.ok) {
      if (res.error === 'duplicate') setModalError('Ese sabor ya está en tu lista.')
      else if (res.error === 'empty') setModalError('Nombre no válido.')
      else setModalError('No se pudo guardar. Revisa la conexión o intenta de nuevo.')
      return
    }
    cerrarModal()
  }

  const agregarPersonalizado = async () => {
    setModalError('')
    const saborTxt = saborCustom.trim()
    if (!saborTxt) {
      setModalError('Escribe el sabor del jugo.')
      return
    }
    setGuardando(true)
    const res = await agregarSaborInventario({ sabor: saborTxt, emoji: emojiCustom })
    setGuardando(false)
    if (!res.ok) {
      if (res.error === 'duplicate') setModalError('Ese sabor ya está en tu lista.')
      else setModalError('No se pudo guardar. Revisa la conexión o intenta de nuevo.')
      return
    }
    cerrarModal()
  }

  return (
    <>
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
            Los cambios se guardan en la nube.
          </p>
          {sabores.map((s) => {
            const hayError = ['emoji', 'sabor', 'stock'].some(
              (f) => saborFieldStatus[`${s.id}:${f}`] === 'error'
            )
            return (
              <div key={s.id} className="space-y-1">
                <div className="grid grid-cols-12 items-center gap-2">
                  <input
                    value={s.emoji}
                    onChange={(e) =>
                      void updateSabor(s.id, 'emoji', e.target.value.slice(0, 4))
                    }
                    className={`col-span-2 ${inputBase} text-center text-xl text-gray-900 ${fieldBorderClass(saborFieldStatus, s.id, 'emoji')}`}
                    title="Emoji"
                    aria-label="Emoji del sabor"
                  />
                  <input
                    value={s.sabor ?? s.nombre ?? ''}
                    onChange={(e) => void updateSabor(s.id, 'sabor', e.target.value)}
                    placeholder="Sabor del jugo"
                    className={`col-span-6 ${inputBase} text-sm text-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${fieldBorderClass(saborFieldStatus, s.id, 'sabor')}`}
                  />
                  <input
                    type="number"
                    min="0"
                    value={s.stock}
                    onChange={(e) => void updateSabor(s.id, 'stock', Number(e.target.value))}
                    className={`col-span-3 ${inputBase} text-center text-sm text-gray-900 ${fieldBorderClass(saborFieldStatus, s.id, 'stock')}`}
                    title="Unidades disponibles"
                  />
                  <button
                    type="button"
                    onClick={() => void eliminarSabor(s.id)}
                    className="col-span-1 flex justify-center py-2 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                    aria-label="Eliminar sabor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {hayError ? (
                  <p className="text-[11px] font-medium text-red-600 dark:text-red-400">
                    No se pudo guardar. Comprueba la conexión o la migración de base de datos e inténtalo de nuevo.
                  </p>
                ) : null}
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => {
              setModalError('')
              setModalAgregar(true)
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-brand hover:text-brand dark:border-white/20 dark:text-gray-300 dark:hover:border-brand-soft dark:hover:text-brand-soft"
          >
            <Plus size={16} /> Agregar sabor
          </button>
        </div>
      )}
    </div>

      {modalAgregar && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-agregar-sabor-titulo"
        >
          <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
              <h2
                id="modal-agregar-sabor-titulo"
                className="text-base font-bold text-gray-900 dark:text-white"
              >
                Agregar sabor
              </h2>
              <button
                type="button"
                onClick={() => !guardando && cerrarModal()}
                className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/10"
                aria-label="Cerrar"
                disabled={guardando}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {predefDisponibles.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ya tienes todos los sabores sugeridos en la lista. Puedes agregar uno personalizado abajo.
                </p>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Elige un sabor
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                    {predefDisponibles.map((p) => (
                      <button
                        key={p.sabor}
                        type="button"
                        disabled={guardando}
                        onClick={() => void agregarPredef(p)}
                        className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-gradient-to-b from-white to-emerald-50/30 px-3 py-3 text-center transition hover:border-[#1D9E75]/50 hover:shadow-sm disabled:opacity-50 dark:border-white/10 dark:from-zinc-900 dark:to-emerald-950/20 dark:hover:border-brand/40"
                      >
                        <span className="text-2xl leading-none" aria-hidden>
                          {p.emoji}
                        </span>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                          {p.sabor}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 py-1">
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/15" />
                <span className="shrink-0 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  O escribe uno personalizado
                </span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-white/15" />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Sabor
                </label>
                <input
                  value={saborCustom}
                  onChange={(e) => setSaborCustom(e.target.value)}
                  placeholder="Ej. Maracuyá"
                  disabled={guardando}
                  className="w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/25 dark:border-white/15 dark:bg-gray-900/70 dark:text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Emoji
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPCIONES.map((em) => (
                    <button
                      key={em}
                      type="button"
                      disabled={guardando}
                      onClick={() => setEmojiCustom(em)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition ${
                        emojiCustom === em
                          ? 'border-[#1D9E75] bg-emerald-50 ring-2 ring-[#1D9E75]/25 dark:bg-emerald-950/40'
                          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/15 dark:bg-zinc-800 dark:hover:border-white/25'
                      }`}
                      aria-label={`Emoji ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Seleccionado: <span className="text-lg">{emojiCustom}</span>
                </p>
              </div>

              {modalError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
                  {modalError}
                </p>
              ) : null}

              <button
                type="button"
                disabled={guardando}
                onClick={() => void agregarPersonalizado()}
                className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-60 dark:bg-brand"
              >
                {guardando ? 'Guardando…' : 'Agregar personalizado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
