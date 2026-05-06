import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

const fieldLabel = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'

const inputClass =
  'w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2.5 text-sm text-gray-900 shadow-sm backdrop-blur-sm ' +
  'focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 ' +
  'dark:border-white/15 dark:bg-zinc-900/70 dark:text-gray-100'

export default function Configuracion() {
  const config = useStore((s) => s.config)
  const guardarConfiguracion = useStore((s) => s.guardarConfiguracion)

  const [precioGrande, setPrecioGrande] = useState(String(config.precio_grande))
  const [precioPequeno, setPrecioPequeno] = useState(String(config.precio_pequeno))
  const [nombreNegocio, setNombreNegocio] = useState(config.nombre_negocio)
  const [toast, setToast] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    setPrecioGrande(String(config.precio_grande))
    setPrecioPequeno(String(config.precio_pequeno))
    setNombreNegocio(config.nombre_negocio)
  }, [config])

  const guardar = async () => {
    setGuardando(true)
    try {
      await guardarConfiguracion({
        precio_grande: precioGrande,
        precio_pequeno: precioPequeno,
        nombre_negocio: nombreNegocio,
      })
      setToast('✅ Cambios guardados')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          Configuración del negocio
        </p>

        <div className="space-y-4">
          <div>
            <label className={fieldLabel} htmlFor="cfg-nombre">
              Nombre del negocio
            </label>
            <input
              id="cfg-nombre"
              type="text"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              className={inputClass}
              autoComplete="organization"
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="cfg-pg">
              Precio jugo grande (RD$)
            </label>
            <input
              id="cfg-pg"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={precioGrande}
              onChange={(e) => setPrecioGrande(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="cfg-pp">
              Precio jugo pequeño (RD$)
            </label>
            <input
              id="cfg-pp"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={precioPequeno}
              onChange={(e) => setPrecioPequeno(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando}
          className="mt-5 w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60 dark:bg-brand dark:hover:brightness-110"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {toast && (
        <div
          className="rounded-xl border border-brand/25 bg-brand-softer px-4 py-3 text-center text-sm font-medium text-brand-dark dark:border-brand/35 dark:bg-emerald-950/75 dark:text-brand-soft"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
