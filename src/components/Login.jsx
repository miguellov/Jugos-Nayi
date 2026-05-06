import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'

function avatarInicial(nombre) {
  const n = String(nombre || 'N').trim()
  return (n[0] || 'N').toUpperCase()
}

export default function Login() {
  const config = useStore((s) => s.config)
  const usuarios = useStore((s) => s.usuarios)
  const cargarUsuarios = useStore((s) => s.cargarUsuarios)
  const login = useStore((s) => s.login)
  const [usuarioId, setUsuarioId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [intentos, setIntentos] = useState(0)
  const [bloqueadoHasta, setBloqueadoHasta] = useState(0)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    void cargarUsuarios()
  }, [cargarUsuarios])

  const activos = useMemo(() => usuarios.filter((u) => u.activo), [usuarios])
  const bloqueoRestante = Math.max(0, Math.ceil((bloqueadoHasta - Date.now()) / 1000))
  const bloqueado = bloqueoRestante > 0

  useEffect(() => {
    if (!usuarioId && activos[0]) setUsuarioId(String(activos[0].id))
  }, [activos, usuarioId])

  const intentarLogin = async () => {
    if (!usuarioId || pin.length !== 4 || bloqueado) return
    const ok = await login(usuarioId, pin)
    if (ok) {
      setError('')
      return
    }
    const next = intentos + 1
    setIntentos(next)
    setError('PIN incorrecto, intenta de nuevo')
    setShake(true)
    setTimeout(() => setShake(false), 360)
    setPin('')
    if (next >= 3) {
      setBloqueadoHasta(Date.now() + 30_000)
      setIntentos(0)
    }
  }

  useEffect(() => {
    if (pin.length === 4) void intentarLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <style>{`
        @keyframes login-shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-2xl">
        <div className="flex flex-col items-center gap-2">
          {config.foto_perfil ? (
            <img src={config.foto_perfil} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-[#1D9E75]/30" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1D9E75] text-3xl font-bold">
              {avatarInicial(config.nombre_negocio)}
            </span>
          )}
          <h1 className="text-lg font-bold">{config.nombre_negocio || 'Jugos Nayi'}</h1>
        </div>

        <div className="space-y-3">
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-zinc-800 px-3 py-2.5 text-sm"
          >
            {activos.length === 0 ? <option value="">Sin usuarios activos</option> : null}
            {activos.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} (@{u.usuario})
              </option>
            ))}
          </select>

          <div
            className="flex items-center justify-center gap-2"
            style={shake ? { animation: 'login-shake 0.35s ease' } : undefined}
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => document.getElementById('login-pin-input')?.focus()}
                className={`h-12 w-12 rounded-xl border text-2xl transition ${
                  pin.length === idx ? 'border-[#1D9E75]' : 'border-white/20'
                }`}
              >
                {pin[idx] ? '●' : ''}
              </button>
            ))}
            <input
              id="login-pin-input"
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="sr-only"
            />
          </div>
          {error ? <p className="text-center text-sm font-medium text-red-400">{error}</p> : null}
          {bloqueado ? (
            <p className="text-center text-xs text-amber-300">Demasiados intentos. Espera {bloqueoRestante}s.</p>
          ) : null}

          <button
            type="button"
            disabled={!usuarioId || pin.length !== 4 || bloqueado}
            onClick={() => void intentarLogin()}
            className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Entrar
          </button>
        </div>

        <p className="pt-1 text-center text-[11px] text-zinc-400">Powered by Jugos Nayi</p>
      </div>
    </div>
  )
}
