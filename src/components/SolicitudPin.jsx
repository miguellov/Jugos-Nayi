import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function SolicitudPin({ abierto, onCancelar, onConfirmar }) {
  const validarPinAdmin = useStore((s) => s.validarPinAdmin)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  if (!abierto) return null

  const confirmar = async () => {
    if (pin.length !== 4) {
      setError('Ingresa 4 dígitos')
      return
    }
    const ok = await validarPinAdmin(pin)
    if (!ok) {
      setError('PIN admin incorrecto')
      setPin('')
      return
    }
    setError('')
    setPin('')
    onConfirmar?.()
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancelar?.()
      }}
    >
      <div className="w-full max-w-sm rounded-t-2xl border border-zinc-700 bg-zinc-900 p-4 text-white sm:rounded-2xl">
        <h3 className="text-base font-bold">🔒 Acceso restringido</h3>
        <p className="mt-2 text-sm text-zinc-300">Esta sección requiere permisos de administrador</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
            setError('')
          }}
          placeholder="••••"
          className="mt-3 w-full rounded-xl border border-white/15 bg-zinc-800 px-3 py-2.5 text-center tracking-[0.4em]"
        />
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-zinc-600 py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            className="flex-1 rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
