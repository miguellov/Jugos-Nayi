import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Pencil, UserPlus, X } from 'lucide-react'
import { useStore, formatConMoneda } from '../store/useStore'
import { supabase } from '../supabase'
import { subirFoto, validarArchivoImagen, STORAGE_BUCKET_CLIENTES } from '../utils/uploadPhoto'

const inputClass =
  'w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2.5 text-sm text-gray-900 shadow-sm backdrop-blur-sm ' +
  'focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 ' +
  'dark:border-white/15 dark:bg-zinc-900/70 dark:text-gray-100'

const tabBtn =
  'flex-1 rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm'

const coloresAvatar = ['#1D9E75', '#378ADD', '#D85A30', '#D4537E', '#BA7517']

function colorAvatarNombre(nombre) {
  const n = String(nombre || '?').trim() || '?'
  const idx = n.charCodeAt(0) % coloresAvatar.length
  return coloresAvatar[idx]
}

function iniciales(nombre) {
  const p = String(nombre || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2)
  const s = p[0] || nombre || '?'
  return String(s).slice(0, 2).toUpperCase()
}

function badgeEstado(estado) {
  if (estado === 'entregado')
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100">
        🟢 Entregado
      </span>
    )
  if (estado === 'cancelado')
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950/55 dark:text-red-300">
        🔴 Cancelado
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/45 dark:text-amber-100">
      🟡 Pendiente
    </span>
  )
}

export default function Mayoristas() {
  const config = useStore((s) => s.config)
  const PG = useStore((s) => s.PG)
  const PP = useStore((s) => s.PP)
  const mayoristas = useStore((s) => s.mayoristas)
  const ordenesMayoristas = useStore((s) => s.ordenesMayoristas)
  const cargarMayoristas = useStore((s) => s.cargarMayoristas)
  const agregarMayorista = useStore((s) => s.agregarMayorista)
  const updateMayorista = useStore((s) => s.updateMayorista)
  const cargarOrdenesMayoristas = useStore((s) => s.cargarOrdenesMayoristas)
  const agregarOrdenMayorista = useStore((s) => s.agregarOrdenMayorista)
  const updateEstadoOrdenMayorista = useStore((s) => s.updateEstadoOrdenMayorista)

  const solicitarCambioEstado = (o, nuevo) => {
    if (nuevo === 'cancelado' && o.estado === 'entregado') {
      if (
        !window.confirm(
          'Esta orden ya fue entregada y el stock fue descontado. ¿Confirmas cancelar?'
        )
      ) {
        return
      }
    }
    void updateEstadoOrdenMayorista(o.id, nuevo)
  }

  const [pestana, setPestana] = useState('clientes')
  const [toast, setToast] = useState('')

  const [formCliente, setFormCliente] = useState(null)
  const [nombreColm, setNombreColm] = useState('')
  const [telColm, setTelColm] = useState('')
  const [pgColm, setPgColm] = useState('')
  const [ppColm, setPpColm] = useState('')
  const [fotoColm, setFotoColm] = useState('')
  const [previewFotoCliente, setPreviewFotoCliente] = useState(null)
  const [subiendoFotoCliente, setSubiendoFotoCliente] = useState(false)
  const [errorFotoCliente, setErrorFotoCliente] = useState('')
  const refFotoCliente = useRef(null)

  const [mayoristaOrdenId, setMayoristaOrdenId] = useState('')
  const [qtyG, setQtyG] = useState(0)
  const [qtyP, setQtyP] = useState(0)
  const [notasOrden, setNotasOrden] = useState('')

  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    void cargarMayoristas()
    void cargarOrdenesMayoristas()
  }, [cargarMayoristas, cargarOrdenesMayoristas])

  const mayoristasActivos = useMemo(() => mayoristas.filter((m) => m.activo !== false), [mayoristas])

  const elegidoOrden = useMemo(
    () => mayoristasActivos.find((m) => String(m.id) === String(mayoristaOrdenId)),
    [mayoristasActivos, mayoristaOrdenId]
  )

  const subG = (Number(qtyG) || 0) * (elegidoOrden ? Number(elegidoOrden.precio_grande) || 0 : 0)
  const subP = (Number(qtyP) || 0) * (elegidoOrden ? Number(elegidoOrden.precio_pequeno) || 0 : 0)
  const totalOrden = subG + subP

  const ordenesFiltradas = useMemo(() => {
    let list = [...ordenesMayoristas]
    if (filtroCliente) list = list.filter((o) => String(o.mayorista_id) === filtroCliente)
    if (filtroEstado !== 'todos') list = list.filter((o) => o.estado === filtroEstado)
    return list
  }, [ordenesMayoristas, filtroCliente, filtroEstado])

  const totalFacturadoVisible = useMemo(
    () => ordenesFiltradas.filter((o) => o.estado !== 'cancelado').reduce((a, o) => a + (Number(o.total) || 0), 0),
    [ordenesFiltradas]
  )

  const abrirNuevoCliente = () => {
    setFormCliente('nuevo')
    setNombreColm('')
    setTelColm('')
    setPgColm(String(PG))
    setPpColm(String(PP))
    setFotoColm('')
    setErrorFotoCliente('')
    setPreviewFotoCliente((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  const abrirEditar = (m) => {
    setFormCliente(m.id)
    setNombreColm(m.nombre)
    setTelColm(m.telefono || '')
    setPgColm(String(m.precio_grande))
    setPpColm(String(m.precio_pequeno))
    setFotoColm(m.foto || '')
    setErrorFotoCliente('')
    setPreviewFotoCliente((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  const cerrarForm = () => {
    setFormCliente(null)
    setPreviewFotoCliente((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  useEffect(() => {
    return () => {
      if (previewFotoCliente) URL.revokeObjectURL(previewFotoCliente)
    }
  }, [previewFotoCliente])

  const onSeleccionarFotoCliente = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErrorFotoCliente('')
    const v = validarArchivoImagen(file)
    if (!v.ok) {
      setErrorFotoCliente(v.mensaje)
      return
    }
    if (!supabase) {
      setErrorFotoCliente('Conecta Supabase para subir fotos')
      return
    }
    const slug = nombreColm.trim() || 'cliente'
    let objectUrl = null
    try {
      objectUrl = URL.createObjectURL(file)
      setPreviewFotoCliente((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return objectUrl
      })
      setSubiendoFotoCliente(true)
      const url = await subirFoto(file, STORAGE_BUCKET_CLIENTES, slug)
      if (!url) {
        setErrorFotoCliente('No se pudo subir la imagen')
        setPreviewFotoCliente((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        return
      }
      setFotoColm(url)
      setPreviewFotoCliente((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    } catch (err) {
      console.error(err)
      setErrorFotoCliente(err?.message || 'Error al procesar la imagen')
      setPreviewFotoCliente((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    } finally {
      setSubiendoFotoCliente(false)
    }
  }

  const guardarCliente = async () => {
    const nombre = nombreColm.trim()
    if (!nombre) {
      setToast('Indica el nombre del colmado')
      setTimeout(() => setToast(''), 2500)
      return
    }
    const pg = Number(pgColm) || 0
    const pp = Number(ppColm) || 0
    if (formCliente === 'nuevo') {
      await agregarMayorista({
        nombre,
        telefono: telColm.trim(),
        precio_grande: pg,
        precio_pequeno: pp,
        foto: fotoColm.trim() || undefined,
      })
      setToast('✅ Cliente guardado')
    } else if (formCliente != null) {
      await updateMayorista(formCliente, {
        nombre,
        telefono: telColm.trim(),
        precio_grande: pg,
        precio_pequeno: pp,
        foto: fotoColm.trim() || null,
      })
      setToast('✅ Cambios guardados')
    }
    cerrarForm()
    setTimeout(() => setToast(''), 2500)
  }

  const desactivarCliente = async (m) => {
    if (!window.confirm(`¿Desactivar a "${m.nombre}"? No aparecerá en nuevas órdenes.`)) return
    await updateMayorista(m.id, { activo: false })
    setToast('Cliente desactivado')
    setTimeout(() => setToast(''), 2500)
  }

  const registrarOrden = async () => {
    if (!elegidoOrden) {
      setToast('Selecciona un cliente')
      setTimeout(() => setToast(''), 2500)
      return
    }
    const cg = Math.max(0, Number(qtyG) || 0)
    const cp = Math.max(0, Number(qtyP) || 0)
    if (cg === 0 && cp === 0) {
      setToast('Indica al menos una cantidad')
      setTimeout(() => setToast(''), 2500)
      return
    }
    await agregarOrdenMayorista({
      mayorista_id: elegidoOrden.id,
      cantidad_grandes: cg,
      cantidad_pequenos: cp,
      precio_grande: elegidoOrden.precio_grande,
      precio_pequeno: elegidoOrden.precio_pequeno,
      notas: notasOrden,
    })
    setQtyG(0)
    setQtyP(0)
    setNotasOrden('')
    setToast('✅ Orden registrada')
    setTimeout(() => setToast(''), 2500)
    setPestana('historial')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-2xl border border-[#1D9E75]/20 bg-white/50 p-1 dark:border-brand/25 dark:bg-zinc-900/40">
        {[
          ['clientes', 'Clientes'],
          ['orden', 'Nueva orden'],
          ['historial', 'Historial'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPestana(id)}
            className={`${tabBtn} ${
              pestana === id
                ? 'bg-[#1D9E75] text-white shadow-md dark:bg-brand'
                : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pestana === 'clientes' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={abrirNuevoCliente}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99] dark:bg-brand"
          >
            <UserPlus size={18} strokeWidth={2} />
            Agregar cliente
          </button>

          {mayoristas.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay clientes. Agrega un colmado para empezar.
            </p>
          ) : (
            mayoristas.map((m) => (
              <div
                key={m.id}
                className="juice-card flex gap-3 border-[#1D9E75]/15 p-4 dark:border-brand/20"
              >
                {m.foto ? (
                  <img
                    src={m.foto}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white/30 dark:ring-white/10"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ring-2 ring-white/20"
                    style={{ backgroundColor: colorAvatarNombre(m.nombre) }}
                    aria-hidden
                  >
                    {iniciales(m.nombre)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{m.nombre}</p>
                      {m.telefono ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{m.telefono}</p>
                      ) : null}
                    </div>
                    {m.activo !== false ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 dark:bg-emerald-900/45 dark:text-emerald-100">
                        Activo
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:bg-zinc-600 dark:text-gray-300">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Grande:{' '}
                    <span className="font-semibold text-[#1D9E75] dark:text-brand-soft">
                      {formatConMoneda(config, m.precio_grande)}
                    </span>{' '}
                    · Pequeño:{' '}
                    <span className="font-semibold text-[#1D9E75] dark:text-brand-soft">
                      {formatConMoneda(config, m.precio_pequeno)}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(m)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1D9E75]/40 px-2.5 py-1 text-xs font-semibold text-[#1D9E75] dark:border-brand/50 dark:text-brand-soft"
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    {m.activo !== false ? (
                      <button
                        type="button"
                        onClick={() => void desactivarCliente(m)}
                        className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:border-zinc-600 dark:text-gray-300"
                      >
                        Desactivar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {pestana === 'orden' && (
        <div className="juice-card space-y-4 border-[#1D9E75]/20 p-4 dark:border-brand/25">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Cliente</label>
            <select
              value={mayoristaOrdenId}
              onChange={(e) => setMayoristaOrdenId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Elegir colmado —</option>
              {mayoristasActivos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {elegidoOrden ? (
            <p className="rounded-xl bg-emerald-50/80 px-3 py-2 text-xs text-gray-700 dark:bg-emerald-950/35 dark:text-gray-200">
              Precios especiales: grande {formatConMoneda(config, elegidoOrden.precio_grande)} · pequeño{' '}
              {formatConMoneda(config, elegidoOrden.precio_pequeno)}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Cant. grandes
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={qtyG === 0 ? '' : qtyG}
                onChange={(e) => setQtyG(e.target.value === '' ? 0 : Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Cant. pequeños
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={qtyP === 0 ? '' : qtyP}
                onChange={(e) => setQtyP(e.target.value === '' ? 0 : Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#1D9E75]/25 bg-white/60 p-3 text-sm dark:border-brand/30 dark:bg-zinc-900/50">
            <p className="mb-2 font-semibold text-[#1D9E75] dark:text-brand-soft">Resumen</p>
            <p className="text-gray-700 dark:text-gray-200">
              Grandes: {Number(qtyG) || 0} ×{' '}
              {elegidoOrden ? formatConMoneda(config, elegidoOrden.precio_grande) : '—'} ={' '}
              <span className="font-semibold text-[#1D9E75] dark:text-brand-soft">
                {formatConMoneda(config, subG)}
              </span>
            </p>
            <p className="mt-1 text-gray-700 dark:text-gray-200">
              Pequeños: {Number(qtyP) || 0} ×{' '}
              {elegidoOrden ? formatConMoneda(config, elegidoOrden.precio_pequeno) : '—'} ={' '}
              <span className="font-semibold text-[#1D9E75] dark:text-brand-soft">
                {formatConMoneda(config, subP)}
              </span>
            </p>
            <p className="mt-2 border-t border-gray-200 pt-2 text-base font-bold text-[#1D9E75] dark:text-brand-soft dark:border-white/10">
              Total: {formatConMoneda(config, totalOrden)}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Notas</label>
            <textarea
              value={notasOrden}
              onChange={(e) => setNotasOrden(e.target.value.slice(0, 500))}
              placeholder="con hielo, entregar mañana…"
              rows={3}
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={() => void registrarOrden()}
            className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 dark:bg-brand"
          >
            Registrar orden
          </button>
        </div>
      )}

      {pestana === 'historial' && (
        <div className="space-y-3">
          <div className="juice-card space-y-3 border-[#1D9E75]/20 p-4 dark:border-brand/25">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] dark:text-brand-soft">
              Filtros
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className={inputClass}
              >
                <option value="">Todos los clientes</option>
                {mayoristas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className={inputClass}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/90 px-3 py-2 dark:bg-emerald-950/40">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                Total (visible, sin cancelados)
              </span>
              <span className="text-lg font-bold tabular-nums text-[#1D9E75] dark:text-brand-soft">
                {formatConMoneda(config, totalFacturadoVisible)}
              </span>
            </div>
          </div>

          {ordenesFiltradas.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Sin órdenes en este filtro.</p>
          ) : (
            ordenesFiltradas.map((o) => (
              <div
                key={o.id}
                className="juice-card space-y-2 border-[#1D9E75]/15 p-4 dark:border-brand/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {o.mayorista_nombre || 'Cliente'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString('es-DO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {badgeEstado(o.estado)}
                    {o.estado === 'entregado' && o.stock_descontado ? (
                      <span className="inline-flex rounded-full bg-[#1D9E75]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534] dark:bg-emerald-900/40 dark:text-emerald-200">
                        ✅ Stock descontado
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Grandes: <strong>{o.cantidad_grandes}</strong> · Pequeños: <strong>{o.cantidad_pequenos}</strong>
                </p>
                <p className="text-base font-bold text-[#1D9E75] dark:text-brand-soft">
                  {formatConMoneda(config, o.total)}
                </p>
                {o.notas ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">&quot;{o.notas}&quot;</p>
                ) : null}
                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-2 dark:border-white/10">
                  {o.estado !== 'pendiente' ? (
                    <button
                      type="button"
                      onClick={() => solicitarCambioEstado(o, 'pendiente')}
                      className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                    >
                      Marcar pendiente
                    </button>
                  ) : null}
                  {o.estado !== 'entregado' ? (
                    <button
                      type="button"
                      onClick={() => solicitarCambioEstado(o, 'entregado')}
                      className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                    >
                      Marcar entregado
                    </button>
                  ) : null}
                  {o.estado !== 'cancelado' ? (
                    <button
                      type="button"
                      onClick={() => solicitarCambioEstado(o, 'cancelado')}
                      className="rounded-lg bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-200"
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {formCliente != null ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && cerrarForm()}
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {formCliente === 'nuevo' ? 'Nuevo cliente mayorista' : 'Editar cliente'}
              </h2>
              <button
                type="button"
                onClick={cerrarForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  {previewFotoCliente || fotoColm ? (
                    <img
                      src={previewFotoCliente || fotoColm}
                      alt=""
                      width={60}
                      height={60}
                      className="h-[60px] w-[60px] rounded-full object-cover shadow-md ring-2 ring-[#1D9E75]/25 dark:ring-white/10"
                    />
                  ) : (
                    <div
                      className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-base font-bold text-white shadow-md ring-2 ring-white/20"
                      style={{ backgroundColor: colorAvatarNombre(nombreColm) }}
                      aria-hidden
                    >
                      {iniciales(nombreColm)}
                    </div>
                  )}
                  {subiendoFotoCliente ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                      <Loader2 className="h-7 w-7 animate-spin text-white" aria-hidden />
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    ref={refFotoCliente}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(ev) => void onSeleccionarFotoCliente(ev)}
                  />
                  <button
                    type="button"
                    disabled={subiendoFotoCliente}
                    onClick={() => refFotoCliente.current?.click()}
                    className="rounded-xl border border-[#1D9E75]/40 bg-emerald-50/50 px-3 py-2 text-xs font-semibold text-[#1D9E75] transition hover:bg-emerald-100/80 disabled:opacity-50 dark:border-brand/45 dark:bg-zinc-900/50 dark:text-brand-soft dark:hover:bg-brand/15"
                  >
                    📷 Agregar foto
                  </button>
                  {errorFotoCliente ? (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{errorFotoCliente}</p>
                  ) : null}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Nombre del colmado
                </label>
                <input
                  value={nombreColm}
                  onChange={(e) => setNombreColm(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Teléfono (opcional)
                </label>
                <input
                  value={telColm}
                  onChange={(e) => setTelColm(e.target.value)}
                  className={inputClass}
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Precio jugo grande
                </label>
                <input
                  type="number"
                  min={0}
                  value={pgColm}
                  onChange={(e) => setPgColm(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Precio jugo pequeño
                </label>
                <input
                  type="number"
                  min={0}
                  value={ppColm}
                  onChange={(e) => setPpColm(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => void guardarCliente()}
                className="w-full rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white dark:bg-brand"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className="fixed bottom-24 left-1/2 z-[101] max-w-[90vw] -translate-x-1/2 rounded-xl border border-brand/25 bg-brand-softer px-4 py-2 text-center text-sm font-medium text-brand-dark shadow-lg dark:border-brand/35 dark:bg-emerald-950/90 dark:text-brand-soft"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
