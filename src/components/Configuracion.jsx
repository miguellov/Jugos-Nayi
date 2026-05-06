import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Lock, CircleDollarSign, Unlock, Loader2 } from 'lucide-react'
import { subirFoto, validarArchivoImagen } from '../utils/uploadPhoto'
import { supabase } from '../supabase'
import { useStore, formatDateLocal, mondayOfDate, dateRangeForYmd, parseDateLocal } from '../store/useStore'
import { useMayoristasActivo, setMayoristasActivo } from '../store/useMayoristasActivo'

const fieldLabel = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'

const inputClass =
  'w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2.5 text-sm text-gray-900 shadow-sm backdrop-blur-sm ' +
  'focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 ' +
  'dark:border-white/15 dark:bg-zinc-900/70 dark:text-gray-100'

const btnExport =
  'flex w-full items-center justify-center gap-2 rounded-xl border border-[#1D9E75]/35 bg-zinc-900/40 py-3 text-sm font-semibold text-[#1D9E75] shadow-sm transition hover:bg-[#1D9E75]/10 active:scale-[0.99] dark:border-brand/40 dark:bg-zinc-900/60 dark:text-brand-soft dark:hover:bg-brand/15'

function csvEscape(val) {
  const s = String(val ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(filename, headerRow, dataRows) {
  const lines = [headerRow.map(csvEscape).join(',')]
  for (const row of dataRows) {
    lines.push(row.map(csvEscape).join(','))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function tamLabel(tam) {
  if (tam === 'grande') return 'Grande'
  if (tam === 'pequeno') return 'Pequeño'
  return String(tam ?? '')
}

async function fetchVentasRango(startIso, endIso) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('fetchVentasRango', error)
    return []
  }
  return data || []
}

async function fetchComprasRango(startIso, endIso) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('compras')
    .select('*')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
  if (error) {
    console.error('fetchComprasRango', error)
    return []
  }
  return data || []
}

function ymdFromDate(d) {
  return formatDateLocal(d)
}

function addDaysYmd(ymd, days) {
  const [y, m, day] = ymd.split('-').map(Number)
  const x = new Date(y, m - 1, day)
  x.setDate(x.getDate() + days)
  return formatDateLocal(x)
}

function formatRangoSemanaLista(lunesKey) {
  const start = parseDateLocal(lunesKey)
  if (Number.isNaN(start.getTime())) return lunesKey
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const o = { weekday: 'short', day: 'numeric', month: 'short' }
  const a = start.toLocaleDateString('es-DO', o)
  const b = end.toLocaleDateString('es-DO', o)
  const A = a.charAt(0).toUpperCase() + a.slice(1)
  const B = b.charAt(0).toUpperCase() + b.slice(1)
  return `${A} — ${B}`
}

function textoConfirmarReabrir(lunesKey) {
  const start = parseDateLocal(lunesKey)
  if (Number.isNaN(start.getTime())) return `¿Seguro que quieres reabrir la semana ${lunesKey}?`
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const o = { weekday: 'short', day: 'numeric', month: 'short' }
  let a = start.toLocaleDateString('es-DO', o)
  let b = end.toLocaleDateString('es-DO', o)
  a = a.charAt(0).toUpperCase() + a.slice(1)
  b = b.charAt(0).toUpperCase() + b.slice(1)
  return `¿Seguro que quieres reabrir la semana del ${a} al ${b}?`
}

export default function Configuracion() {
  const config = useStore((s) => s.config)
  const guardarConfiguracion = useStore((s) => s.guardarConfiguracion)
  const actualizarFotoPerfil = useStore((s) => s.actualizarFotoPerfil)
  const semanasCerradas = useStore((s) => s.semanasCerradas)
  const cargarSemanasCerradasList = useStore((s) => s.cargarSemanasCerradasList)
  const reabrirSemana = useStore((s) => s.reabrirSemana)
  const usuarios = useStore((s) => s.usuarios)
  const usuarioActivo = useStore((s) => s.usuarioActivo)
  const cargarUsuarios = useStore((s) => s.cargarUsuarios)
  const agregarUsuario = useStore((s) => s.agregarUsuario)
  const updateUsuario = useStore((s) => s.updateUsuario)
  const cambiarPin = useStore((s) => s.cambiarPin)

  const [precioGrande, setPrecioGrande] = useState(String(config.precio_grande))
  const [precioPequeno, setPrecioPequeno] = useState(String(config.precio_pequeno))
  const [nombreNegocio, setNombreNegocio] = useState(config.nombre_negocio)
  const [moneda, setMoneda] = useState(config.moneda || 'RD$')
  const [nombreVendedor, setNombreVendedor] = useState(config.nombre_vendedor || '')
  const [pinInput, setPinInput] = useState(() => String(config.pin || '').replace(/\D/g, '').slice(0, 4))
  const [pinActivo, setPinActivo] = useState(Boolean(config.pin_activo))
  const [metaDiaria, setMetaDiaria] = useState(String(config.meta_diaria ?? 65))

  const [toast, setToast] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(null)
  const [pinIngreso, setPinIngreso] = useState('')
  const [pinError, setPinError] = useState('')
  const [reabrirLunesPendiente, setReabrirLunesPendiente] = useState(null)
  const [pinReabrir, setPinReabrir] = useState('')
  const [pinReabrirError, setPinReabrirError] = useState('')
  const [reabriendo, setReabriendo] = useState(false)

  const refFotoPerfil = useRef(null)
  const [subiendoFotoPerfil, setSubiendoFotoPerfil] = useState(false)
  const [fotoPerfilError, setFotoPerfilError] = useState('')
  const [previewPerfil, setPreviewPerfil] = useState(null)
  const [editandoUsuarioId, setEditandoUsuarioId] = useState(null)
  const [usrNombre, setUsrNombre] = useState('')
  const [usrHandle, setUsrHandle] = useState('')
  const [usrPin, setUsrPin] = useState('')
  const [usrActivo, setUsrActivo] = useState(true)
  const [usrPermisos, setUsrPermisos] = useState({
    venta: true,
    plan: false,
    compras: false,
    ganancias: false,
    mayoristas: false,
    config: false,
  })
  const [pinActual, setPinActual] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [pinConfirmar, setPinConfirmar] = useState('')

  const mayoristasModuloActivo = useMayoristasActivo()

  const pinRequerido = useMemo(
    () => Boolean(config.pin_activo) && String(config.pin || '').replace(/\D/g, '').length === 4,
    [config.pin_activo, config.pin]
  )

  const [desbloqueado, setDesbloqueado] = useState(!pinRequerido)

  useEffect(() => {
    if (!pinRequerido) setDesbloqueado(true)
  }, [pinRequerido])

  useEffect(() => {
    if (!pinRequerido || desbloqueado) {
      void cargarSemanasCerradasList()
    }
  }, [pinRequerido, desbloqueado, cargarSemanasCerradasList])

  useEffect(() => {
    if (usuarioActivo?.rol === 'admin') void cargarUsuarios()
  }, [usuarioActivo, cargarUsuarios])

  useEffect(() => {
    setPrecioGrande(String(config.precio_grande))
    setPrecioPequeno(String(config.precio_pequeno))
    setNombreNegocio(config.nombre_negocio)
    setMoneda(config.moneda || 'RD$')
    setNombreVendedor(config.nombre_vendedor || '')
    setPinInput(String(config.pin || '').replace(/\D/g, '').slice(0, 4))
    setPinActivo(Boolean(config.pin_activo))
    setMetaDiaria(String(config.meta_diaria ?? 65))
  }, [config])

  const mostrarToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    return () => {
      if (previewPerfil) URL.revokeObjectURL(previewPerfil)
    }
  }, [previewPerfil])

  const onSeleccionarFotoPerfil = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFotoPerfilError('')
    const v = validarArchivoImagen(file)
    if (!v.ok) {
      setFotoPerfilError(v.mensaje)
      return
    }
    if (!supabase) {
      setFotoPerfilError('Conecta Supabase para subir fotos')
      return
    }
    let objectUrl = null
    try {
      objectUrl = URL.createObjectURL(file)
      setPreviewPerfil((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return objectUrl
      })
      setSubiendoFotoPerfil(true)
      const url = await subirFoto(file, 'perfiles', nombreNegocio || 'negocio')
      if (!url) {
        setFotoPerfilError('No se pudo subir la imagen')
        setPreviewPerfil((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        return
      }
      const ok = await actualizarFotoPerfil(url)
      if (!ok) {
        setFotoPerfilError('No se pudo guardar la foto en la base de datos')
        setPreviewPerfil((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        return
      }
      mostrarToast('✅ Foto actualizada')
      setPreviewPerfil((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    } catch (err) {
      console.error(err)
      setFotoPerfilError(err?.message || 'Error al procesar la imagen')
      setPreviewPerfil((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    } finally {
      setSubiendoFotoPerfil(false)
    }
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      await guardarConfiguracion({
        precio_grande: precioGrande,
        precio_pequeno: precioPequeno,
        nombre_negocio: nombreNegocio,
        moneda,
        nombre_vendedor: nombreVendedor,
        pin: pinInput,
        pin_activo: pinActivo,
        meta_diaria: metaDiaria,
      })
      mostrarToast('✅ Cambios guardados')
    } finally {
      setGuardando(false)
    }
  }

  const abrirNuevoUsuario = () => {
    setEditandoUsuarioId('nuevo')
    setUsrNombre('')
    setUsrHandle('')
    setUsrPin('')
    setUsrActivo(true)
    setUsrPermisos({
      venta: true,
      plan: false,
      compras: false,
      ganancias: false,
      mayoristas: false,
      config: false,
    })
  }

  const editarUsuario = (u) => {
    setEditandoUsuarioId(u.id)
    setUsrNombre(u.nombre)
    setUsrHandle(u.usuario)
    setUsrPin('')
    setUsrActivo(u.activo !== false)
    setUsrPermisos({ ...u.permisos })
  }

  const guardarUsuario = async () => {
    const payload = {
      nombre: usrNombre.trim(),
      usuario: usrHandle.trim().toLowerCase().replace(/\s+/g, ''),
      pin: usrPin,
      activo: usrActivo,
      permisos: usrPermisos,
    }
    if (editandoUsuarioId === 'nuevo') {
      if (!payload.pin || payload.pin.length !== 4) return mostrarToast('PIN de 4 dígitos requerido')
      const ok = await agregarUsuario(payload)
      if (!ok) return mostrarToast('No se pudo guardar usuario')
      mostrarToast('✅ Usuario creado')
    } else if (editandoUsuarioId) {
      const item = usuarios.find((u) => String(u.id) === String(editandoUsuarioId))
      if (item?.rol === 'admin' && usrActivo === false) return mostrarToast('No se puede desactivar el admin principal')
      const ok = await updateUsuario(editandoUsuarioId, {
        nombre: payload.nombre,
        usuario: payload.usuario,
        activo: payload.activo,
        permisos: payload.permisos,
        ...(payload.pin.length === 4 ? { pin: payload.pin } : {}),
      })
      if (!ok) return mostrarToast('No se pudo actualizar usuario')
      mostrarToast('✅ Usuario actualizado')
    }
    setEditandoUsuarioId(null)
    void cargarUsuarios()
  }

  const guardarCambioPin = async () => {
    if (!usuarioActivo?.id) return
    if (pinNuevo.length !== 4 || pinConfirmar.length !== 4) return mostrarToast('PIN nuevo inválido')
    if (pinNuevo !== pinConfirmar) return mostrarToast('Los PIN no coinciden')
    const ok = await cambiarPin(usuarioActivo.id, pinActual, pinNuevo)
    if (!ok) return mostrarToast('PIN actual incorrecto')
    setPinActual('')
    setPinNuevo('')
    setPinConfirmar('')
    mostrarToast('✅ PIN actualizado')
  }

  const cerrarModalReabrir = () => {
    setReabrirLunesPendiente(null)
    setPinReabrir('')
    setPinReabrirError('')
  }

  const confirmarReabrirSemana = async () => {
    if (!reabrirLunesPendiente) return
    if (pinRequerido) {
      const esperado = String(config.pin || '').replace(/\D/g, '')
      const ing = pinReabrir.replace(/\D/g, '')
      if (ing.length !== 4) {
        setPinReabrirError('Ingresa el PIN de 4 dígitos')
        return
      }
      if (ing !== esperado) {
        setPinReabrirError('PIN incorrecto')
        setPinReabrir('')
        return
      }
    }
    setPinReabrirError('')
    setReabriendo(true)
    try {
      await reabrirSemana(reabrirLunesPendiente)
      mostrarToast('✅ Semana reabierta')
      cerrarModalReabrir()
    } finally {
      setReabriendo(false)
    }
  }

  const intentarPin = () => {
    const esperado = String(config.pin || '').replace(/\D/g, '')
    const ing = pinIngreso.replace(/\D/g, '')
    if (ing.length !== 4) {
      setPinError('Ingresa 4 dígitos')
      return
    }
    if (ing !== esperado) {
      setPinError('PIN incorrecto')
      setPinIngreso('')
      return
    }
    setPinError('')
    setPinIngreso('')
    setDesbloqueado(true)
  }

  const ventasRowsDesdeData = (rows) =>
    rows.map((v) => [
      v.hora ?? '',
      v.sabor ?? '',
      tamLabel(v.tam),
      v.qty ?? '',
      v.total ?? '',
      v.notas ?? '',
    ])

  const exportarVentasDia = async () => {
    if (!supabase) {
      mostrarToast('Sin conexión a datos')
      return
    }
    setExportando('dia')
    try {
      const ymd = formatDateLocal(new Date())
      const { start, end } = dateRangeForYmd(ymd)
      const rows = await fetchVentasRango(start, end)
      const fn = `ventas_jugos_${ymd}.csv`
      downloadCsv(
        fn,
        ['Hora', 'Sabor', 'Tamaño', 'Cantidad', 'Total', 'Notas'],
        ventasRowsDesdeData(rows)
      )
      mostrarToast('✅ CSV descargado')
    } finally {
      setExportando(null)
    }
  }

  const exportarVentasSemana = async () => {
    if (!supabase) {
      mostrarToast('Sin conexión a datos')
      return
    }
    setExportando('semana')
    try {
      const lunes = mondayOfDate()
      const start = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate(), 0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const rows = await fetchVentasRango(start.toISOString(), end.toISOString())
      const fn = `ventas_jugos_semana_${formatDateLocal(lunes)}.csv`
      downloadCsv(
        fn,
        ['Hora', 'Sabor', 'Tamaño', 'Cantidad', 'Total', 'Notas'],
        ventasRowsDesdeData(rows)
      )
      mostrarToast('✅ CSV descargado')
    } finally {
      setExportando(null)
    }
  }

  const exportarGananciasSemana = async () => {
    if (!supabase) {
      mostrarToast('Sin conexión a datos')
      return
    }
    setExportando('ganancias')
    try {
      const lunes = mondayOfDate()
      const start = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate(), 0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const startIso = start.toISOString()
      const endIso = end.toISOString()
      const [ventasW, comprasW] = await Promise.all([
        fetchVentasRango(startIso, endIso),
        fetchComprasRango(startIso, endIso),
      ])

      const porDiaVentas = {}
      const porDiaGastos = {}
      let y = ymdFromDate(lunes)
      for (let i = 0; i < 7; i++) {
        porDiaVentas[y] = { g: 0, p: 0, ing: 0 }
        porDiaGastos[y] = 0
        y = addDaysYmd(y, 1)
      }

      for (const v of ventasW) {
        const d = new Date(v.created_at)
        const key = formatDateLocal(d)
        if (!porDiaVentas[key]) continue
        const qty = Number(v.qty) || 0
        const total = Number(v.total) || 0
        if (v.tam === 'grande') porDiaVentas[key].g += qty
        else if (v.tam === 'pequeno') porDiaVentas[key].p += qty
        porDiaVentas[key].ing += total
      }

      for (const c of comprasW) {
        const d = new Date(c.created_at)
        const key = formatDateLocal(d)
        if (porDiaGastos[key] === undefined) continue
        porDiaGastos[key] += (Number(c.cantidad) || 0) * (Number(c.precio) || 0)
      }

      const dataRows = []
      y = ymdFromDate(lunes)
      for (let i = 0; i < 7; i++) {
        const v = porDiaVentas[y] || { g: 0, p: 0, ing: 0 }
        const gastos = porDiaGastos[y] || 0
        const neta = v.ing - gastos
        dataRows.push([y, v.g, v.p, v.ing, gastos, neta])
        y = addDaysYmd(y, 1)
      }

      const fn = `ganancias_jugos_${formatDateLocal(lunes)}.csv`
      downloadCsv(
        fn,
        ['Día', 'Grandes vendidos', 'Pequeños vendidos', 'Ingreso', 'Gastos', 'Ganancia neta'],
        dataRows
      )
      mostrarToast('✅ CSV descargado')
    } finally {
      setExportando(null)
    }
  }

  if (pinRequerido && !desbloqueado) {
    return (
      <div className="space-y-4">
        <div className="juice-card border-[#1D9E75]/25 p-5 dark:border-brand/30">
          <div className="mb-4 flex items-center gap-2 text-[#1D9E75] dark:text-brand-soft">
            <Lock className="shrink-0" size={22} strokeWidth={2} aria-hidden />
            <p className="text-sm font-semibold uppercase tracking-wide">Ajustes protegidos</p>
          </div>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">Introduce el PIN de 4 dígitos para continuar.</p>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={pinIngreso}
            onChange={(e) => {
              setPinIngreso(e.target.value.replace(/\D/g, '').slice(0, 4))
              setPinError('')
            }}
            placeholder="••••"
            className={inputClass}
            aria-label="PIN de 4 dígitos"
          />
          {pinError ? (
            <p className="mt-2 text-sm font-medium text-red-500 dark:text-red-400">{pinError}</p>
          ) : null}
          <button
            type="button"
            onClick={intentarPin}
            className="mt-4 w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] dark:bg-brand dark:hover:brightness-110"
          >
            Desbloquear
          </button>
        </div>
      </div>
    )
  }

  const simboloPrecio = moneda === 'USD' ? 'USD' : 'RD$'

  return (
    <div className="space-y-4">
      <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          Configuración del negocio
        </p>

        <div className="mb-5 rounded-xl border border-[#1D9E75]/20 bg-emerald-50/20 p-4 dark:border-brand/25 dark:bg-emerald-950/15">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
            Perfil del negocio
          </p>
          <p className="mb-3 text-[11px] text-gray-600 dark:text-gray-400">
            Foto de perfil (máx. 10 MB, JPG, PNG o WebP). Se comprime antes de subir.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              {previewPerfil || (config.foto_perfil && String(config.foto_perfil).trim()) ? (
                <img
                  src={previewPerfil || config.foto_perfil}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover shadow-md ring-2 ring-[#1D9E75]/25 dark:ring-white/10"
                />
              ) : (
                <span
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1D9E75] text-2xl font-bold text-white shadow-md ring-2 ring-[#1D9E75]/25 dark:ring-white/10"
                  aria-hidden
                >
                  N
                </span>
              )}
              {subiendoFotoPerfil ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                  <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
                </div>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                ref={refFotoPerfil}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                capture="environment"
                className="hidden"
                onChange={(ev) => void onSeleccionarFotoPerfil(ev)}
              />
              <button
                type="button"
                disabled={subiendoFotoPerfil}
                onClick={() => refFotoPerfil.current?.click()}
                className="rounded-xl border border-[#1D9E75]/40 bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#1D9E75] shadow-sm transition hover:bg-[#1D9E75]/10 disabled:opacity-50 dark:border-brand/45 dark:bg-zinc-900/60 dark:text-brand-soft dark:hover:bg-brand/15"
              >
                Cambiar foto
              </button>
              {fotoPerfilError ? (
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{fotoPerfilError}</p>
              ) : null}
            </div>
          </div>
        </div>

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
            <label className={`${fieldLabel} flex items-center gap-1.5`} htmlFor="cfg-moneda">
              <CircleDollarSign size={14} className="text-[#1D9E75] dark:text-brand-soft" aria-hidden />
              Moneda
            </label>
            <select
              id="cfg-moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className={inputClass}
            >
              <option value="RD$">RD$ (peso dominicano)</option>
              <option value="USD">USD (dólar)</option>
            </select>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="cfg-vendedor">
              Nombre del vendedor / turno
            </label>
            <input
              id="cfg-vendedor"
              type="text"
              value={nombreVendedor}
              onChange={(e) => setNombreVendedor(e.target.value)}
              placeholder="Ej. Nayi — Turno mañana"
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label className={fieldLabel} htmlFor="cfg-pg">
              Precio jugo grande ({simboloPrecio})
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
              Precio jugo pequeño ({simboloPrecio})
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

          <div>
            <label className={fieldLabel} htmlFor="cfg-meta">
              Meta diaria de jugos (unidades vendidas)
            </label>
            <input
              id="cfg-meta"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={metaDiaria}
              onChange={(e) => setMetaDiaria(e.target.value)}
              placeholder="Ej. 65"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Se muestra en Punto de venta como barra de progreso del día.
            </p>
          </div>

          <div className="rounded-xl border border-[#1D9E75]/20 bg-emerald-50/30 p-4 dark:border-brand/25 dark:bg-emerald-950/20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
              🏪 Ventas mayoristas
            </p>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 dark:border-white/10">
              <span className="text-sm text-gray-700 dark:text-gray-200">Activar módulo mayoristas</span>
              <button
                type="button"
                role="switch"
                aria-checked={mayoristasModuloActivo}
                onClick={() => setMayoristasActivo(!mayoristasModuloActivo)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  mayoristasModuloActivo ? 'bg-[#1D9E75] dark:bg-brand' : 'bg-gray-300 dark:bg-zinc-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    mayoristasModuloActivo ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </label>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              Muestra la pestaña 🏪 en la barra inferior para clientes al por mayor (colmados).
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#1D9E75]/20 bg-zinc-900/20 p-4 dark:border-brand/25 dark:bg-zinc-900/40">
          <div className="mb-3 flex items-center gap-2 text-[#1D9E75] dark:text-brand-soft">
            <Lock size={18} strokeWidth={2} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wide">PIN de seguridad (Ajustes)</p>
          </div>
          <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 dark:border-white/10">
            <span className="text-sm text-gray-700 dark:text-gray-200">Exigir PIN al abrir Ajustes</span>
            <button
              type="button"
              role="switch"
              aria-checked={pinActivo}
              onClick={() => setPinActivo((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                pinActivo ? 'bg-[#1D9E75] dark:bg-brand' : 'bg-gray-300 dark:bg-zinc-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  pinActivo ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </label>
          <label className={fieldLabel} htmlFor="cfg-pin">
            PIN (4 dígitos)
          </label>
          <input
            id="cfg-pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Solo números"
            className={inputClass}
            autoComplete="new-password"
          />
          {pinActivo && pinInput.replace(/\D/g, '').length < 4 ? (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Activa el PIN con 4 dígitos; si faltan, se guardará desactivado.
            </p>
          ) : null}
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

      {usuarioActivo?.rol === 'admin' ? (
        <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
              Gestión de usuarios
            </p>
            <button
              type="button"
              onClick={abrirNuevoUsuario}
              className="rounded-lg bg-[#1D9E75] px-2.5 py-1 text-xs font-semibold text-white"
            >
              + Usuario
            </button>
          </div>
          <div className="space-y-2">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 p-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  {u.foto ? (
                    <img src={u.foto} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D9E75] text-sm font-bold text-white">
                      {String(u.nombre || 'U').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{u.nombre}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{u.usuario}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.rol === 'admin' ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-200 text-gray-700'}`}>
                    {u.rol === 'admin' ? 'Admin' : 'Empleado'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.activo ? 'bg-blue-100 text-blue-900' : 'bg-zinc-200 text-zinc-700'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => editarUsuario(u)}
                    className="rounded-lg border border-[#1D9E75]/40 px-2 py-1 text-xs font-semibold text-[#1D9E75]"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editandoUsuarioId ? (
            <div className="mt-3 space-y-2 rounded-xl border border-white/10 p-3">
              <input className={inputClass} placeholder="Nombre completo" value={usrNombre} onChange={(e) => setUsrNombre(e.target.value)} />
              <input
                className={inputClass}
                placeholder="@usuario"
                value={usrHandle}
                onChange={(e) => setUsrHandle(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              />
              <input
                className={inputClass}
                placeholder="PIN (4 dígitos)"
                value={usrPin}
                maxLength={4}
                inputMode="numeric"
                onChange={(e) => setUsrPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <label className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <span className="text-sm text-gray-700 dark:text-gray-200">Activo</span>
                <input type="checkbox" checked={usrActivo} onChange={(e) => setUsrActivo(e.target.checked)} />
              </label>
              {[
                ['venta', '🥤 Ventas'],
                ['plan', '📊 Plan diario'],
                ['compras', '🛒 Compras'],
                ['ganancias', '💰 Ganancias'],
                ['mayoristas', '🏪 Mayoristas'],
                ['config', '⚙️ Ajustes'],
              ].map(([k, label]) => (
                <label key={k} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(usrPermisos[k])}
                    onChange={(e) => setUsrPermisos((s) => ({ ...s, [k]: e.target.checked }))}
                  />
                </label>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditandoUsuarioId(null)} className="flex-1 rounded-xl border border-zinc-300 py-2 text-sm font-semibold">
                  Cancelar
                </button>
                <button type="button" onClick={() => void guardarUsuario()} className="flex-1 rounded-xl bg-[#1D9E75] py-2 text-sm font-semibold text-white">
                  Guardar usuario
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-white/10 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">Cambiar mi PIN</p>
            <div className="space-y-2">
              <input className={inputClass} placeholder="PIN actual" maxLength={4} inputMode="numeric" value={pinActual} onChange={(e) => setPinActual(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <input className={inputClass} placeholder="PIN nuevo" maxLength={4} inputMode="numeric" value={pinNuevo} onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <input className={inputClass} placeholder="Confirmar PIN nuevo" maxLength={4} inputMode="numeric" value={pinConfirmar} onChange={(e) => setPinConfirmar(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <button type="button" onClick={() => void guardarCambioPin()} className="w-full rounded-xl bg-[#1D9E75] py-2.5 text-sm font-semibold text-white">
                Cambiar PIN
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="juice-card border-orange-200/50 p-4 dark:border-orange-500/25">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-800 dark:text-orange-200/90">
          <Unlock size={16} strokeWidth={2} aria-hidden />
          Gestión de semanas
        </p>
        <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
          Semanas cerradas. Reabrir permite editar de nuevo el plan (solo con acceso a Ajustes
          {pinRequerido ? ' y PIN' : ''}).
        </p>
        {!supabase ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">Conecta Supabase para gestionar semanas.</p>
        ) : semanasCerradas.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No hay semanas cerradas.</p>
        ) : (
          <ul className="space-y-2">
            {semanasCerradas.map((lunes) => (
              <li
                key={lunes}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/40 px-3 py-2.5 dark:border-white/10 dark:bg-zinc-900/40"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {formatRangoSemanaLista(lunes)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReabrirLunesPendiente(lunes)
                    setPinReabrir('')
                    setPinReabrirError('')
                  }}
                  className="shrink-0 rounded-lg border border-orange-500/80 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-900 transition hover:bg-orange-100 dark:border-orange-400/60 dark:bg-orange-950/50 dark:text-orange-100 dark:hover:bg-orange-950/70"
                >
                  Reabrir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {reabrirLunesPendiente ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reabrir-semana-titulo"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModalReabrir()
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#E5E7EB] bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-2xl">
            <h2 id="reabrir-semana-titulo" className="text-sm font-bold text-[#111827] dark:text-white">
              Reabrir semana
            </h2>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{textoConfirmarReabrir(reabrirLunesPendiente)}</p>
            {pinRequerido ? (
              <div className="mt-4">
                <label className={fieldLabel} htmlFor="pin-reabrir">
                  PIN de administrador
                </label>
                <input
                  id="pin-reabrir"
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  value={pinReabrir}
                  onChange={(e) => {
                    setPinReabrir(e.target.value.replace(/\D/g, '').slice(0, 4))
                    setPinReabrirError('')
                  }}
                  placeholder="••••"
                  className={inputClass}
                />
                {pinReabrirError ? (
                  <p className="mt-2 text-sm font-medium text-red-500 dark:text-red-400">{pinReabrirError}</p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarModalReabrir}
                disabled={reabriendo}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-600 dark:text-gray-200 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarReabrirSemana()}
                disabled={reabriendo}
                className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-700 disabled:opacity-50 dark:bg-orange-700 dark:hover:bg-orange-600"
              >
                {reabriendo ? 'Reabriendo…' : 'Sí, reabrir'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="juice-card border-[#1D9E75]/20 p-4 dark:border-brand/25">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
          <Download size={16} strokeWidth={2} aria-hidden />
          Exportar datos
        </p>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Los montos en CSV son numéricos sin símbolo. Vista previa en hoja de cálculo.
        </p>
        <div className="space-y-2">
          <button
            type="button"
            disabled={exportando != null}
            onClick={() => void exportarVentasDia()}
            className={btnExport}
          >
            <Download size={18} />
            {exportando === 'dia' ? 'Generando…' : 'Exportar ventas del día → CSV'}
          </button>
          <button
            type="button"
            disabled={exportando != null}
            onClick={() => void exportarVentasSemana()}
            className={btnExport}
          >
            <Download size={18} />
            {exportando === 'semana' ? 'Generando…' : 'Exportar ventas de la semana → CSV'}
          </button>
          <button
            type="button"
            disabled={exportando != null}
            onClick={() => void exportarGananciasSemana()}
            className={btnExport}
          >
            <Download size={18} />
            {exportando === 'ganancias' ? 'Generando…' : 'Exportar ganancias → CSV'}
          </button>
        </div>
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
