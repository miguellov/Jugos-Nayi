import { create } from 'zustand'
import { supabase } from '../supabase'
import { DEFAULT_PG, DEFAULT_PP, DEFAULT_SABORES, DIAS, diaSemanaHoy } from './defaults'

/** Lunes de la semana calendario que contiene `d` (hora local). */
export function mondayOfDate(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

export function formatDateLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** `YYYY-MM-DD` en calendario local (sin UTC). */
export function parseDateLocal(ymd) {
  if (!ymd || typeof ymd !== 'string') return new Date(NaN)
  const [y, m, d] = ymd.split('-').map((n) => Number(n))
  if (!y || !m || !d) return new Date(NaN)
  return new Date(y, m - 1, d)
}

export function normalizeSemanaKey(v) {
  if (v == null) return null
  if (typeof v === 'string') return v.slice(0, 10)
  if (v instanceof Date) return formatDateLocal(v)
  return String(v).slice(0, 10)
}

function sortPlanRows(rows) {
  return [...(rows || [])].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia))
}

/** UUID v4 (filas `inventario_sabores.id`). */
function isInvUuid(id) {
  if (id == null) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id))
}

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Rango UTC-ISO para un día local `YYYY-MM-DD` (misma lógica que ventas del día). */
export function dateRangeForYmd(ymd) {
  const d = parseDateLocal(ymd)
  if (Number.isNaN(d.getTime())) return todayRange()
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Símbolo / formato de moneda según configuración (RD$ o USD). */
export function formatConMoneda(config, num) {
  const n = Number(num) || 0
  if (config?.moneda === 'USD') {
    return `$${n.toLocaleString('en-US')}`
  }
  return `RD$${n.toLocaleString('es-DO')}`
}

function ajustarPlanVenta(plan, venta, sign = 1) {
  const idx = DIAS.indexOf(diaSemanaHoy())
  if (idx < 0 || idx >= plan.length) return plan
  const next = [...plan]
  const row = { ...next[idx] }
  if (venta.tam === 'grande') row.vg = Math.max(0, (row.vg || 0) + sign * venta.qty)
  if (venta.tam === 'pequeno') row.vp = Math.max(0, (row.vp || 0) + sign * venta.qty)
  next[idx] = row
  return next
}

function debeActualizarPlanUi(get) {
  const { semanaSeleccionada, semanaActiva, plan } = get()
  if (!semanaSeleccionada || !semanaActiva || semanaSeleccionada !== semanaActiva) return false
  if (!plan.length) return true
  return !plan[0].cerrada
}

function normalizeVenta(v) {
  return {
    ...v,
    qty: Number(v.qty) || 0,
    precio: Number(v.precio) || 0,
    total: Number(v.total) || 0,
  }
}

/** Suma de unidades vendidas (qty), no número de transacciones. */
function totalQtyVentas(ventas) {
  return (ventas || []).reduce((acc, v) => acc + (Number(v.qty) || 0), 0)
}

function normalizePlanRow(r) {
  return {
    ...r,
    semana: normalizeSemanaKey(r.semana),
    pg: Number(r.pg) || 0,
    pp: Number(r.pp) || 0,
    vg: Number(r.vg) || 0,
    vp: Number(r.vp) || 0,
    cerrada: Boolean(r.cerrada),
  }
}

/** `YYYY-MM-DD` local para una fila de compra (columna `fecha`, o respaldo desde `created_at`). */
export function fechaCompraYmd(c) {
  if (c.fecha != null && String(c.fecha).trim() !== '') {
    return String(c.fecha).slice(0, 10)
  }
  if (c.created_at) {
    return formatDateLocal(new Date(c.created_at))
  }
  return formatDateLocal(new Date())
}

function normalizeCompra(c) {
  return {
    ...c,
    cantidad: Number(c.cantidad) || 0,
    precio: Number(c.precio) || 0,
    fecha: fechaCompraYmd(c),
  }
}

function normalizeMayorista(row) {
  if (!row) return null
  return {
    ...row,
    id: row.id,
    nombre: row.nombre != null ? String(row.nombre) : '',
    telefono: row.telefono != null ? String(row.telefono) : '',
    precio_grande: Number(row.precio_grande) || 0,
    precio_pequeno: Number(row.precio_pequeno) || 0,
    activo: row.activo !== false,
    foto: row.foto != null && String(row.foto).trim() !== '' ? String(row.foto).trim() : '',
  }
}

function normalizeOrdenMayorista(row) {
  if (!row) return null
  const m = row.mayoristas
  const nombreJoin = m && typeof m === 'object' && !Array.isArray(m) ? m.nombre : null
  const nombreArr = Array.isArray(m) && m[0] ? m[0].nombre : null
  const estadoNorm = ['pendiente', 'entregado', 'cancelado'].includes(row.estado) ? row.estado : 'pendiente'
  return {
    ...row,
    cantidad_grandes: Number(row.cantidad_grandes) || 0,
    cantidad_pequenos: Number(row.cantidad_pequenos) || 0,
    precio_grande: Number(row.precio_grande) || 0,
    precio_pequeno: Number(row.precio_pequeno) || 0,
    total: Number(row.total) || 0,
    notas: row.notas != null ? String(row.notas) : '',
    estado: estadoNorm,
    stock_descontado: Boolean(row.stock_descontado),
    mayorista_nombre:
      row.mayorista_nombre != null
        ? String(row.mayorista_nombre)
        : nombreJoin != null
          ? String(nombreJoin)
          : nombreArr != null
            ? String(nombreArr)
            : '',
  }
}

/** Descuenta jugos (grandes+pequeños como unidades) del inventario: sabores no pausados, mayor stock primero. */
async function aplicarDescuentoInventarioMayorista(supabaseClient, cantidad_grandes, cantidad_pequenos) {
  const totalJugos =
    Math.max(0, Number(cantidad_grandes) || 0) + Math.max(0, Number(cantidad_pequenos) || 0)
  if (totalJugos <= 0) return

  const { data, error } = await supabaseClient.from('inventario_sabores').select('id, sabor, stock, pausado')
  if (error) {
    console.error('aplicarDescuentoInventarioMayorista', error)
    return
  }
  const rows = (data || [])
    .filter((r) => r.pausado !== true)
    .sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0))

  let restante = totalJugos
  for (const sabor of rows) {
    if (restante <= 0) break
    const stock = Math.max(0, Number(sabor.stock) || 0)
    if (stock <= 0) continue
    const descontar = Math.min(stock, restante)
    const nuevo = stock - descontar
    const { error: upErr } = await supabaseClient
      .from('inventario_sabores')
      .update({ stock: nuevo })
      .eq('id', sabor.id)
    if (upErr) console.error('aplicarDescuentoInventarioMayorista update', upErr)
    restante -= descontar
  }
  if (restante > 0) console.warn('[Mayoristas] Stock insuficiente; unidades no descontadas:', restante)
}

/** Suma ventas al plan del día actual (semana calendario en curso). */
async function aplicarPlanDiarioMayorista(supabaseClient, get, cantidad_grandes, cantidad_pequenos) {
  const cg = Math.max(0, Number(cantidad_grandes) || 0)
  const cp = Math.max(0, Number(cantidad_pequenos) || 0)
  if (cg === 0 && cp === 0) return

  const lunesKey = get().semanaActiva || formatDateLocal(mondayOfDate())
  const dia = diaSemanaHoy()

  const { data: row, error } = await supabaseClient
    .from('plan_diario')
    .select('id, vg, vp')
    .eq('semana', lunesKey)
    .eq('dia', dia)
    .maybeSingle()
  if (error) {
    console.error('aplicarPlanDiarioMayorista', error)
    return
  }
  if (!row?.id) return

  const vg = Math.max(0, (Number(row.vg) || 0) + cg)
  const vp = Math.max(0, (Number(row.vp) || 0) + cp)
  const { error: upErr } = await supabaseClient.from('plan_diario').update({ vg, vp }).eq('id', row.id)
  if (upErr) console.error('aplicarPlanDiarioMayorista update', upErr)
}

function aplicarDescuentoMayoristaOffline(get, set, orden) {
  const cg = Math.max(0, Number(orden.cantidad_grandes) || 0)
  const cp = Math.max(0, Number(orden.cantidad_pequenos) || 0)
  const totalJugos = cg + cp
  if (totalJugos <= 0) return

  const pausadoMap = get().pausadoPorSabor || {}
  const inv = { ...get().inventarioPorSabor }
  const entries = Object.entries(inv)
    .filter(([claveSabor]) => pausadoMap[claveSabor] !== true)
    .map(([claveSabor, stock]) => ({
      claveSabor,
      stock: Math.max(0, Number(stock) || 0),
    }))
    .sort((a, b) => b.stock - a.stock)

  let restante = totalJugos
  for (const { claveSabor, stock } of entries) {
    if (restante <= 0) break
    const des = Math.min(stock, restante)
    inv[claveSabor] = stock - des
    restante -= des
  }

  const dia = diaSemanaHoy()
  const lunesKey = get().semanaActiva || formatDateLocal(mondayOfDate())

  set((s) => {
    const plan = s.plan.map((r) => {
      if (r.dia !== dia) return r
      if (normalizeSemanaKey(r.semana) !== lunesKey) return r
      return {
        ...r,
        vg: Math.max(0, (Number(r.vg) || 0) + cg),
        vp: Math.max(0, (Number(r.vp) || 0) + cp),
      }
    })
    const sabores = s.sabores.map((x) => {
      const label = String(x.sabor ?? x.nombre ?? '').trim()
      const q = label ? inv[label] : undefined
      if (q === undefined) return x
      return { ...x, stock: Math.max(0, Number(q) || 0) }
    })
    return { inventarioPorSabor: inv, plan, sabores }
  })
}

function normalizeMoneda(v) {
  return v === 'USD' ? 'USD' : 'RD$'
}

function normalizePinStr(v) {
  return String(v ?? '')
    .replace(/\D/g, '')
    .slice(0, 4)
}

function defaultConfig() {
  return {
    id: null,
    precio_grande: DEFAULT_PG,
    precio_pequeno: DEFAULT_PP,
    nombre_negocio: 'Jugos Nayi',
    moneda: 'RD$',
    nombre_vendedor: '',
    pin: '',
    pin_activo: false,
    meta_diaria: 65,
    foto_perfil: '',
    nota_del_dia: '',
    updated_at: null,
  }
}

function normalizeConfigRow(row) {
  if (!row) return defaultConfig()
  const pin = normalizePinStr(row.pin)
  const pinActivoDb = Boolean(row.pin_activo)
  return {
    id: row.id ?? null,
    precio_grande: Number(row.precio_grande) || DEFAULT_PG,
    precio_pequeno: Number(row.precio_pequeno) || DEFAULT_PP,
    nombre_negocio:
      row.nombre_negocio != null && String(row.nombre_negocio).trim() !== ''
        ? String(row.nombre_negocio).trim()
        : 'Jugos Nayi',
    moneda: normalizeMoneda(row.moneda),
    nombre_vendedor: row.nombre_vendedor != null ? String(row.nombre_vendedor) : '',
    pin,
    pin_activo: pinActivoDb && pin.length === 4,
    meta_diaria:
      row.meta_diaria != null && Number(row.meta_diaria) > 0 ? Math.round(Number(row.meta_diaria)) : 65,
    foto_perfil:
      row.foto_perfil != null && String(row.foto_perfil).trim() !== '' ? String(row.foto_perfil).trim() : '',
    nota_del_dia: row.nota_del_dia != null ? String(row.nota_del_dia) : '',
    updated_at: row.updated_at ?? null,
  }
}

function permisosBase() {
  return {
    venta: true,
    plan: false,
    compras: false,
    ganancias: false,
    mayoristas: false,
    config: false,
    meta: false,
  }
}

function normalizePermisos(permisos, rol = 'empleado') {
  const p = { ...permisosBase(), ...(permisos && typeof permisos === 'object' ? permisos : {}) }
  if (rol === 'admin') {
    return {
      venta: true,
      plan: true,
      compras: true,
      ganancias: true,
      mayoristas: true,
      config: true,
      meta: true,
    }
  }
  return {
    venta: Boolean(p.venta),
    plan: Boolean(p.plan),
    compras: Boolean(p.compras),
    ganancias: Boolean(p.ganancias),
    mayoristas: Boolean(p.mayoristas),
    config: Boolean(p.config),
    meta: Boolean(p.meta),
  }
}

function normalizeUsuario(row) {
  if (!row) return null
  const rol = row.rol === 'admin' ? 'admin' : 'empleado'
  return {
    id: row.id,
    nombre: row.nombre != null ? String(row.nombre).trim() : '',
    usuario: row.usuario != null ? String(row.usuario).trim().toLowerCase() : '',
    pin: normalizePinStr(row.pin),
    rol,
    activo: row.activo !== false,
    foto: row.foto != null && String(row.foto).trim() !== '' ? String(row.foto).trim() : '',
    permisos: normalizePermisos(row.permisos, rol),
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  }
}

export const useStore = create((set, get) => ({
  sabores: DEFAULT_SABORES,
  /** Lunes de la semana calendario actual (hoy). */
  semanaActiva: null,
  semanaSeleccionada: null,
  semanas: [],
  /** Lunes (`YYYY-MM-DD`) de semanas con `cerrada` en BD (para Ajustes). */
  semanasCerradas: [],
  plan: [],
  ventas: [],
  /** Ventas desde el lunes de la semana calendario actual hasta hoy (hora local). Para Ganancías / semana. */
  ventasSemana: [],
  /** Unidades (suma de qty) vendidas hoy — mismo conjunto que `ventas` (día local en BD). */
  totalJugosHoy: 0,
  /** Meta del día: SUM(stock) en `inventario_sabores` con `pausado === false` (jugos disponibles). */
  metaDiaria: 0,
  /** `sabor` → stock en `inventario_sabores` (si no hay fila, la UI usa `sabores.stock`). */
  inventarioPorSabor: {},
  /** `sabor` → pausado (no vender). */
  pausadoPorSabor: {},
  compras: [],
  /** Suma histórica de todas las líneas de compras. */
  totalGastos: 0,
  /** Suma de compras con `fecha` = hoy (local). */
  gastosHoy: 0,
  precioPromedio: 0,
  puntoEquilibrio: 0,
  metaRecomendada: 0,
  gananciaActual: 0,
  gananciaProyectada: 0,
  config: defaultConfig(),
  PG: DEFAULT_PG,
  PP: DEFAULT_PP,
  /** Últimos 7 días calendario (hoy primero): `{ fecha: 'YYYY-MM-DD', monto }`. */
  historial7Dias: [],
  /** Ventas semana actual (lun → hoy) agrupadas por tamaño. */
  desgloseXTamano: {
    grande: { cantidad: 0, ingreso: 0 },
    pequeno: { cantidad: 0, ingreso: 0 },
  },

  /** Clientes mayoristas (toda la lista; la UI filtra `activo`). */
  mayoristas: [],
  /** Órdenes con `mayorista_nombre` desde join. */
  ordenesMayoristas: [],
  usuarios: [],
  usuarioActivo: null,
  autenticado: false,

  /** `${saborId}:${field}` → `saving` | `ok` | `error` (para bordes en GestionSabores). */
  saborFieldStatus: {},

  /**
   * Inserta un sabor en `inventario_sabores`.
   * @returns {{ ok: true } | { ok: false, error: string }}
   */
  async agregarSaborInventario({ sabor: saborRaw, emoji }) {
    const sabor = String(saborRaw ?? '').trim()
    const em = String(emoji ?? '🥤').slice(0, 4) || '🥤'
    if (!sabor) return { ok: false, error: 'empty' }

    const yaExiste = get().sabores.some(
      (x) =>
        String(x.sabor ?? x.nombre)
          .trim()
          .toLowerCase() === sabor.toLowerCase()
    )
    if (yaExiste) return { ok: false, error: 'duplicate' }

    const tempId = `j-${Date.now()}`
    set((s) => ({
      sabores: [...s.sabores, { id: tempId, sabor, emoji: em, stock: 0 }],
      inventarioPorSabor: { ...s.inventarioPorSabor, [sabor]: 0 },
      pausadoPorSabor: { ...s.pausadoPorSabor, [sabor]: false },
    }))

    if (!supabase) {
      await get().calcularMeta()
      return { ok: true }
    }

    const { data, error } = await supabase
      .from('inventario_sabores')
      .insert({ sabor, stock: 0, emoji: em, pausado: false })
      .select('id, sabor, stock, emoji')
      .single()

    if (error) {
      console.error('agregarSaborInventario', error)
      set((s) => {
        const inventarioPorSabor = { ...s.inventarioPorSabor }
        delete inventarioPorSabor[sabor]
        const pausadoPorSabor = { ...s.pausadoPorSabor }
        delete pausadoPorSabor[sabor]
        return {
          sabores: s.sabores.filter((x) => x.id !== tempId),
          inventarioPorSabor,
          pausadoPorSabor,
        }
      })
      return { ok: false, error: error.message || 'db' }
    }

    const row = data
    set((s) => ({
      sabores: s.sabores.map((x) =>
        x.id === tempId
          ? {
              id: row.id,
              invId: row.id,
              sabor: row.sabor,
              stock: Number(row.stock) || 0,
              emoji:
                row.emoji != null && String(row.emoji).trim() !== ''
                  ? String(row.emoji).slice(0, 4)
                  : em,
            }
          : x
      ),
      inventarioPorSabor: {
        ...s.inventarioPorSabor,
        [row.sabor]: Number(row.stock) || 0,
      },
    }))
    await get().calcularMeta()
    return { ok: true }
  },

  async updateSabor(id, field, rawVal) {
    if (field !== 'sabor' && field !== 'emoji' && field !== 'stock') return
    const prev = get().sabores.find((x) => String(x.id) === String(id))
    if (!prev) return

    const prevSabor = String(prev.sabor ?? prev.nombre ?? '').trim()
    const nextSabor =
      field === 'sabor'
        ? String(rawVal ?? '').trim() || prevSabor
        : prevSabor
    const nextEmoji =
      field === 'emoji' ? String(rawVal ?? '').slice(0, 4) : prev.emoji
    const nextStock =
      field === 'stock' ? Number(rawVal) || 0 : Number(prev.stock) || 0

    const key = `${id}:${field}`
    set((s) => ({ saborFieldStatus: { ...s.saborFieldStatus, [key]: 'saving' } }))

    set((s) => {
      const sabores = s.sabores.map((x) =>
        String(x.id) !== String(id)
          ? x
          : { ...x, sabor: nextSabor, emoji: nextEmoji, stock: nextStock }
      )
      const inventarioPorSabor = { ...s.inventarioPorSabor }
      if (field === 'sabor' && prevSabor !== nextSabor) {
        if (Object.prototype.hasOwnProperty.call(inventarioPorSabor, prevSabor)) {
          inventarioPorSabor[nextSabor] = inventarioPorSabor[prevSabor]
          delete inventarioPorSabor[prevSabor]
        }
        inventarioPorSabor[nextSabor] = nextStock
      } else if (field === 'stock') {
        inventarioPorSabor[nextSabor] = nextStock
      }
      const pausadoPorSabor = { ...s.pausadoPorSabor }
      if (field === 'sabor' && prevSabor !== nextSabor && prevSabor in pausadoPorSabor) {
        pausadoPorSabor[nextSabor] = pausadoPorSabor[prevSabor]
        delete pausadoPorSabor[prevSabor]
      }
      return { sabores, inventarioPorSabor, pausadoPorSabor }
    })

    const clearOkLater = () => {
      set((s) => ({ saborFieldStatus: { ...s.saborFieldStatus, [key]: 'ok' } }))
      setTimeout(() => {
        set((s) => {
          const next = { ...s.saborFieldStatus }
          delete next[key]
          return { saborFieldStatus: next }
        })
      }, 1000)
    }

    if (!supabase) {
      clearOkLater()
      return
    }

    const patch = { updated_at: new Date().toISOString() }
    if (field === 'stock') patch.stock = nextStock
    if (field === 'emoji') patch.emoji = nextEmoji
    if (field === 'sabor') patch.sabor = nextSabor

    let targetId = prev.invId || (isInvUuid(prev.id) ? prev.id : null)
    if (!targetId) {
      const { data: found } = await supabase
        .from('inventario_sabores')
        .select('id')
        .eq('sabor', prevSabor)
        .maybeSingle()
      targetId = found?.id || null
    }

    let error = null
    if (targetId) {
      const r = await supabase.from('inventario_sabores').update(patch).eq('id', targetId)
      error = r.error
      if (!error) {
        set((s) => ({
          sabores: s.sabores.map((x) =>
            String(x.id) === String(id) ? { ...x, invId: targetId, id: targetId } : x
          ),
        }))
      }
    } else {
      const ins = await supabase
        .from('inventario_sabores')
        .insert({
          sabor: nextSabor,
          stock: nextStock,
          emoji: nextEmoji || '🥤',
          pausado: false,
        })
        .select('id, sabor, stock, emoji')
        .single()
      error = ins.error
      if (!error && ins.data) {
        const dat = ins.data
        set((s) => ({
          sabores: s.sabores.map((x) =>
            String(x.id) === String(id)
              ? {
                  ...x,
                  id: dat.id,
                  invId: dat.id,
                  sabor: dat.sabor,
                  stock: Number(dat.stock) || 0,
                  emoji:
                    dat.emoji != null && String(dat.emoji).trim() !== ''
                      ? String(dat.emoji).slice(0, 4)
                      : x.emoji,
                }
              : x
          ),
          inventarioPorSabor: {
            ...s.inventarioPorSabor,
            [dat.sabor]: Number(dat.stock) || 0,
          },
        }))
      }
    }

    if (error) {
      console.error('updateSabor', error)
      set((s) => ({ saborFieldStatus: { ...s.saborFieldStatus, [key]: 'error' } }))
      await get().cargarInventarioSabores()
      return
    }

    clearOkLater()
    await get().calcularMeta()
  },

  async eliminarSabor(id) {
    const prev = get().sabores.find((x) => String(x.id) === String(id))
    if (!prev) return
    const saborKey = String(prev.sabor ?? prev.nombre ?? '').trim()
    const targetId = prev.invId || (isInvUuid(prev.id) ? prev.id : null)

    set((s) => {
      const inventarioPorSabor = { ...s.inventarioPorSabor }
      delete inventarioPorSabor[saborKey]
      const pausadoPorSabor = { ...s.pausadoPorSabor }
      delete pausadoPorSabor[saborKey]
      return {
        sabores: s.sabores.filter((x) => String(x.id) !== String(id)),
        inventarioPorSabor,
        pausadoPorSabor,
      }
    })

    if (!supabase) return
    if (targetId) {
      const { error } = await supabase.from('inventario_sabores').delete().eq('id', targetId)
      if (error) console.error('eliminarSabor', error)
    } else if (!String(id).startsWith('j-')) {
      const { error } = await supabase.from('inventario_sabores').delete().eq('sabor', saborKey)
      if (error) console.error('eliminarSabor', error)
    }
    await get().calcularMeta()
  },

  async cargarConfig() {
    if (!supabase) return
    const { data, error } = await supabase.from('configuracion').select('*').limit(1).maybeSingle()
    if (error) {
      console.error('cargarConfig', error)
      return
    }
    if (!data) {
      const d = defaultConfig()
      set({ config: d, PG: d.precio_grande, PP: d.precio_pequeno })
      return
    }
    const c = normalizeConfigRow(data)
    set({ config: c, PG: c.precio_grande, PP: c.precio_pequeno })
  },

  async cargarUsuarios() {
    if (!supabase) {
      set({ usuarios: [] })
      return
    }
    const { data, error } = await supabase.from('usuarios').select('*').order('nombre', { ascending: true })
    if (error) {
      console.error('cargarUsuarios', error)
      return
    }
    set({ usuarios: (data || []).map(normalizeUsuario).filter(Boolean) })
  },

  async login(usuarioId, pin) {
    const pinNorm = normalizePinStr(pin)
    if (!supabase || !usuarioId || pinNorm.length !== 4) return false
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', usuarioId)
      .eq('pin', pinNorm)
      .eq('activo', true)
      .maybeSingle()
    if (error || !data) return false
    const u = normalizeUsuario(data)
    const sesion = {
      id: u.id,
      nombre: u.nombre,
      usuario: u.usuario,
      rol: u.rol,
      permisos: u.permisos,
      foto: u.foto,
      timestamp: Date.now(),
    }
    localStorage.setItem('sesion', JSON.stringify(sesion))
    set({ usuarioActivo: sesion, autenticado: true })
    return true
  },

  logout() {
    localStorage.removeItem('sesion')
    set({ usuarioActivo: null, autenticado: false })
  },

  restaurarSesion() {
    try {
      const raw = localStorage.getItem('sesion')
      if (!raw) return false
      const sesion = JSON.parse(raw)
      const ahora = Date.now()
      if (!sesion?.timestamp || ahora - Number(sesion.timestamp) > 12 * 60 * 60 * 1000) {
        get().logout()
        return false
      }
      localStorage.setItem('sesion', JSON.stringify({ ...sesion, timestamp: ahora }))
      set({ usuarioActivo: sesion, autenticado: true })
      return true
    } catch {
      get().logout()
      return false
    }
  },

  tienePermiso(seccion) {
    try {
      const { usuarioActivo } = get()
      if (!usuarioActivo) return false
      if (usuarioActivo.rol === 'admin') return true
      return usuarioActivo.permisos?.[seccion] === true
    } catch {
      return false
    }
  },

  tabsVisibles() {
    const { usuarioActivo } = get()
    if (!usuarioActivo) return []
    if (usuarioActivo.rol === 'admin') return 'all'
    const p = usuarioActivo.permisos || {}
    return Object.keys(p).filter((k) => p[k] === true)
  },

  async validarPinAdmin(pin) {
    const pinNorm = normalizePinStr(pin)
    if (!supabase || pinNorm.length !== 4) return false
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('rol', 'admin')
      .eq('activo', true)
      .eq('pin', pinNorm)
      .limit(1)
      .maybeSingle()
    return !error && Boolean(data?.id)
  },

  async agregarUsuario(usuario) {
    const row = {
      nombre: String(usuario?.nombre ?? '').trim(),
      usuario: String(usuario?.usuario ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ''),
      pin: normalizePinStr(usuario?.pin),
      rol: 'empleado',
      activo: usuario?.activo !== false,
      permisos: normalizePermisos(usuario?.permisos, 'empleado'),
      foto: usuario?.foto ? String(usuario.foto).trim() : null,
    }
    if (!row.nombre || !row.usuario || row.pin.length !== 4) return null
    if (!supabase) return null
    const { data, error } = await supabase.from('usuarios').insert(row).select().single()
    if (error) {
      console.error('agregarUsuario', error)
      return null
    }
    await get().cargarUsuarios()
    return normalizeUsuario(data)
  },

  async updateUsuario(id, campos) {
    if (!id) return false
    const patch = {}
    if (campos.nombre != null) patch.nombre = String(campos.nombre).trim()
    if (campos.usuario != null) {
      patch.usuario = String(campos.usuario)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
    }
    if (campos.pin != null) patch.pin = normalizePinStr(campos.pin)
    if (campos.activo != null) patch.activo = Boolean(campos.activo)
    if (campos.permisos != null) patch.permisos = normalizePermisos(campos.permisos, 'empleado')
    if (campos.foto !== undefined) patch.foto = campos.foto ? String(campos.foto).trim() : null
    if (!Object.keys(patch).length || !supabase) return false

    const current = get().usuarios.find((u) => String(u.id) === String(id))
    if (current?.rol === 'admin' && patch.activo === false) return false

    const { error } = await supabase.from('usuarios').update(patch).eq('id', id)
    if (error) {
      console.error('updateUsuario', error)
      return false
    }
    await get().cargarUsuarios()
    return true
  },

  async cambiarPin(id, pinActual, pinNuevo) {
    const actual = normalizePinStr(pinActual)
    const nuevo = normalizePinStr(pinNuevo)
    if (!supabase || !id || actual.length !== 4 || nuevo.length !== 4) return false
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,pin')
      .eq('id', id)
      .eq('activo', true)
      .maybeSingle()
    if (error || !data || String(data.pin) !== actual) return false
    const { error: upErr } = await supabase.from('usuarios').update({ pin: nuevo }).eq('id', id)
    if (upErr) {
      console.error('cambiarPin', upErr)
      return false
    }
    await get().cargarUsuarios()
    return true
  },

  /**
   * Actualiza un campo en `configuracion` y el estado local (incl. PG/PP si aplica).
   */
  async updateConfig(campo, valor) {
    const allowed = ['precio_grande', 'precio_pequeno', 'nombre_negocio']
    if (!allowed.includes(campo)) return

    const cfg = get().config
    const nextVal =
      campo === 'nombre_negocio' ? String(valor ?? '').trim() || 'Jugos Nayi' : Number(valor) || 0

    const nextConfig = {
      ...cfg,
      [campo]: nextVal,
      updated_at: new Date().toISOString(),
    }

    if (!supabase) {
      set((s) => ({
        config: { ...nextConfig },
        PG: campo === 'precio_grande' ? nextVal : s.PG,
        PP: campo === 'precio_pequeno' ? nextVal : s.PP,
      }))
      return
    }

    const patch = {
      [campo]: nextVal,
      updated_at: nextConfig.updated_at,
    }

    if (cfg.id) {
      const { error } = await supabase.from('configuracion').update(patch).eq('id', cfg.id)
      if (error) {
        console.error('updateConfig', error)
        return
      }
    } else {
      const insertRow = {
        precio_grande: campo === 'precio_grande' ? nextVal : cfg.precio_grande,
        precio_pequeno: campo === 'precio_pequeno' ? nextVal : cfg.precio_pequeno,
        nombre_negocio: campo === 'nombre_negocio' ? nextVal : cfg.nombre_negocio,
        moneda: cfg.moneda ?? 'RD$',
        nombre_vendedor: cfg.nombre_vendedor ?? '',
        pin: cfg.pin ?? '',
        pin_activo: Boolean(cfg.pin_activo),
        meta_diaria: cfg.meta_diaria ?? 65,
        foto_perfil: cfg.foto_perfil || null,
        updated_at: nextConfig.updated_at,
      }
      const { data: newRow, error } = await supabase.from('configuracion').insert(insertRow).select().single()
      if (error) {
        console.error('updateConfig insert', error)
        return
      }
      const c = normalizeConfigRow(newRow)
      set({ config: c, PG: c.precio_grande, PP: c.precio_pequeno })
      return
    }

    set((s) => ({
      config: { ...s.config, ...patch },
      PG: campo === 'precio_grande' ? nextVal : s.PG,
      PP: campo === 'precio_pequeno' ? nextVal : s.PP,
    }))
  },

  /**
   * Guarda configuración del negocio (precios, nombre, moneda, vendedor, PIN).
   * `pin_activo` solo queda en true si el PIN tiene 4 dígitos y el toggle está activo.
   */
  async guardarConfiguracion({
    precio_grande,
    precio_pequeno,
    nombre_negocio,
    moneda,
    nombre_vendedor,
    pin,
    pin_activo,
    meta_diaria,
    nota_del_dia,
  }) {
    const pg = Number(precio_grande) || DEFAULT_PG
    const pp = Number(precio_pequeno) || DEFAULT_PP
    const nombre = String(nombre_negocio ?? '').trim() || 'Jugos Nayi'
    const monedaNorm = normalizeMoneda(moneda)
    const nv = String(nombre_vendedor ?? '').trim()
    const pinNorm = normalizePinStr(pin)
    const pinOn = Boolean(pin_activo) && pinNorm.length === 4
    const meta =
      meta_diaria != null && String(meta_diaria).trim() !== ''
        ? Math.max(1, Math.round(Number(meta_diaria)) || 65)
        : 65
    const nota = String(nota_del_dia ?? '').slice(0, 180)
    const updated_at = new Date().toISOString()
    const cfg = get().config

    if (!supabase) {
      set({
        config: {
          ...cfg,
          id: cfg.id,
          precio_grande: pg,
          precio_pequeno: pp,
          nombre_negocio: nombre,
          moneda: monedaNorm,
          nombre_vendedor: nv,
          pin: pinNorm,
          pin_activo: pinOn,
          meta_diaria: meta,
          foto_perfil: cfg.foto_perfil ?? '',
          nota_del_dia: nota,
          updated_at,
        },
        PG: pg,
        PP: pp,
      })
      return
    }

    const patch = {
      precio_grande: pg,
      precio_pequeno: pp,
      nombre_negocio: nombre,
      moneda: monedaNorm,
      nombre_vendedor: nv,
      pin: pinNorm,
      pin_activo: pinOn,
      meta_diaria: meta,
      foto_perfil: cfg.foto_perfil ? cfg.foto_perfil : null,
      nota_del_dia: nota,
      updated_at,
    }

    if (cfg.id) {
      const { data, error } = await supabase.from('configuracion').update(patch).eq('id', cfg.id).select().single()
      if (error) {
        console.error('guardarConfiguracion', error)
        return
      }
      const c = normalizeConfigRow(data)
      set({ config: c, PG: c.precio_grande, PP: c.precio_pequeno })
      return
    }

    const { data, error } = await supabase.from('configuracion').insert(patch).select().single()
    if (error) {
      console.error('guardarConfiguracion insert', error)
      return
    }
    const c = normalizeConfigRow(data)
    set({ config: c, PG: c.precio_grande, PP: c.precio_pequeno })
  },

  /**
   * Guarda la URL pública de la foto de perfil del negocio (`configuracion.foto_perfil`).
   */
  async actualizarFotoPerfil(fotoUrl) {
    const url = String(fotoUrl ?? '').trim()
    const updated_at = new Date().toISOString()
    const cfg = get().config

    if (!supabase) {
      set({ config: { ...cfg, foto_perfil: url, updated_at } })
      return true
    }

    const patch = { foto_perfil: url || null, updated_at }

    if (cfg.id) {
      const { data, error } = await supabase.from('configuracion').update(patch).eq('id', cfg.id).select().single()
      if (error) {
        console.error('actualizarFotoPerfil', error)
        return false
      }
      set({ config: normalizeConfigRow(data) })
      return true
    }

    const pinNorm = normalizePinStr(cfg.pin)
    const pinOn = Boolean(cfg.pin_activo) && pinNorm.length === 4
    const insertRow = {
      precio_grande: Number(cfg.precio_grande) || DEFAULT_PG,
      precio_pequeno: Number(cfg.precio_pequeno) || DEFAULT_PP,
      nombre_negocio:
        cfg.nombre_negocio != null && String(cfg.nombre_negocio).trim() !== ''
          ? String(cfg.nombre_negocio).trim()
          : 'Jugos Nayi',
      moneda: normalizeMoneda(cfg.moneda),
      nombre_vendedor: cfg.nombre_vendedor != null ? String(cfg.nombre_vendedor) : '',
      pin: pinNorm,
      pin_activo: pinOn,
      meta_diaria:
        cfg.meta_diaria != null && Number(cfg.meta_diaria) > 0 ? Math.round(Number(cfg.meta_diaria)) : 65,
      foto_perfil: url || null,
      updated_at,
    }
    const { data, error } = await supabase.from('configuracion').insert(insertRow).select().single()
    if (error) {
      console.error('actualizarFotoPerfil insert', error)
      return false
    }
    const c = normalizeConfigRow(data)
    set({ config: c, PG: c.precio_grande, PP: c.precio_pequeno })
    return true
  },

  async aplicarVentaAPlanDb(venta, sign) {
    if (!supabase) return
    const lunes = get().semanaActiva || formatDateLocal(mondayOfDate())
    const dia = diaSemanaHoy()
    const { data: row, error } = await supabase
      .from('plan_diario')
      .select('id, vg, vp')
      .eq('semana', lunes)
      .eq('dia', dia)
      .maybeSingle()
    if (error || !row) return
    let vg = Number(row.vg) || 0
    let vp = Number(row.vp) || 0
    if (venta.tam === 'grande') vg = Math.max(0, vg + sign * venta.qty)
    else if (venta.tam === 'pequeno') vp = Math.max(0, vp + sign * venta.qty)
    await supabase.from('plan_diario').update({ vg, vp }).eq('id', row.id)
  },

  /**
   * Punto de equilibrio y ganancias estimadas (plan del día, compras de hoy, ventas de hoy).
   * `totalGastos`: histórico (todas las compras). Meta y equilibrio usan solo compras con `fecha` = hoy.
   * Si el plan de hoy tiene pg=pp=0, el precio promedio ponderado usa la semana o (PG+PP)/2.
   */
  calcularPuntoEquilibrio() {
    const { compras, plan, PG, PP, ventas, totalJugosHoy } = get()
    const lista = compras || []
    const fechaHoy = formatDateLocal(new Date())
    const monto = (c) => (Number(c.cantidad) || 0) * (Number(c.precio) || 0)

    const totalGastos = lista.reduce((a, c) => a + monto(c), 0)
    const gastosHoyCalc = lista
      .filter((c) => fechaCompraYmd(c) === fechaHoy)
      .reduce((a, c) => a + monto(c), 0)

    const diaHoy = diaSemanaHoy()
    const planHoy = (plan || []).find((r) => r.dia === diaHoy)
    const pg = Number(planHoy?.pg) || 0
    const pp = Number(planHoy?.pp) || 0
    const totalPlanHoy = pg + pp

    const pgN = Number(PG) || DEFAULT_PG
    const ppN = Number(PP) || DEFAULT_PP

    let precioPromedio
    if (totalPlanHoy > 0) {
      precioPromedio = Math.round((pg * pgN + pp * ppN) / totalPlanHoy)
    } else {
      const planRows = plan || []
      const totalSemana = planRows.reduce(
        (a, r) => a + (Number(r.pg) || 0) + (Number(r.pp) || 0),
        0
      )
      if (totalSemana > 0) {
        const sumaPonderada = planRows.reduce(
          (a, r) => a + (Number(r.pg) || 0) * pgN + (Number(r.pp) || 0) * ppN,
          0
        )
        precioPromedio = Math.round(sumaPonderada / totalSemana)
      } else {
        precioPromedio = Math.round((pgN + ppN) / 2)
      }
    }

    const precioBase = Math.max(1, precioPromedio)
    const equilibrio = gastosHoyCalc > 0 ? Math.ceil(gastosHoyCalc / precioBase) : 0
    const metaRecomendada = Math.ceil(equilibrio * 1.2)

    const vendidosHoy = Number(totalJugosHoy) || totalQtyVentas(ventas)

    const gananciaActual = Math.round(vendidosHoy * precioPromedio - gastosHoyCalc)
    const gananciaProyectada = Math.round(metaRecomendada * precioPromedio - gastosHoyCalc)

    set({
      totalGastos,
      gastosHoy: gastosHoyCalc,
      precioPromedio,
      puntoEquilibrio: equilibrio,
      metaRecomendada,
      gananciaActual,
      gananciaProyectada,
    })
  },

  /**
   * Meta = jugos disponibles hoy: suma de `stock` en sabores no pausados.
   */
  async calcularMeta() {
    if (!supabase) {
      const { inventarioPorSabor, pausadoPorSabor } = get()
      let meta = 0
      for (const [nombre, stock] of Object.entries(inventarioPorSabor || {})) {
        if (pausadoPorSabor[nombre] === true) continue
        meta += Number(stock) || 0
      }
      set({ metaDiaria: meta })
      return
    }
    const { data, error } = await supabase.from('inventario_sabores').select('stock, pausado')
    if (error) {
      console.error('calcularMeta', error)
      return
    }
    const metaDiaria = (data || []).reduce((a, s) => {
      if (s.pausado === true) return a
      return a + (Number(s.stock) || 0)
    }, 0)
    set({ metaDiaria })
  },

  async cargarVentas() {
    const hoy = formatDateLocal(new Date())
    const { start, end } = dateRangeForYmd(hoy)
    if (!supabase) {
      const ventas = get().ventas
      set({ totalJugosHoy: totalQtyVentas(ventas) })
      await get().calcularMeta()
      get().calcularPuntoEquilibrio()
      return
    }
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
    if (error) return console.error('cargarVentas', error)
    const rows = (data || []).map(normalizeVenta)
    set({ ventas: rows, totalJugosHoy: totalQtyVentas(rows) })
    await get().calcularMeta()
    get().calcularPuntoEquilibrio()
  },

  /**
   * Ventas del lunes (local) de esta semana hasta fin del día de hoy.
   * No sustituye `ventas` (que sigue siendo solo el día en curso para el POS).
   */
  async cargarVentasSemanaCalendario() {
    const lunes = mondayOfDate()
    const rangeStart = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate(), 0, 0, 0, 0)
    const ahora = new Date()
    const rangeEnd = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0, 0)

    if (!supabase) {
      const desde = rangeStart.getTime()
      const hasta = rangeEnd.getTime()
      const filtradas = (get().ventas || []).filter((v) => {
        if (!v.created_at) return false
        const t = new Date(v.created_at).getTime()
        return Number.isFinite(t) && t >= desde && t < hasta
      })
      set({ ventasSemana: filtradas.map(normalizeVenta) })
      return
    }

    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .gte('created_at', rangeStart.toISOString())
      .lt('created_at', rangeEnd.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('cargarVentasSemanaCalendario', error)
      return
    }
    set({ ventasSemana: (data || []).map(normalizeVenta) })
  },

  /** Ventas de un día local concreto (`YYYY-MM-DD`), sin mutar `ventas` (hoy). */
  async cargarVentasPorFecha(fechaYmd) {
    if (!supabase) return []
    const { start, end } = dateRangeForYmd(fechaYmd)
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('cargarVentasPorFecha', error)
      return []
    }
    return (data || []).map(normalizeVenta)
  },

  /**
   * Ventas en `[startIso, endIso)` sin mutar `ventas` (p. ej. Ganancias con semana elegida).
   * @param {string} startIso
   * @param {string} endIso
   */
  async fetchVentasRango(startIso, endIso) {
    if (!startIso || !endIso) return []
    const desde = new Date(startIso).getTime()
    const hasta = new Date(endIso).getTime()
    if (!Number.isFinite(desde) || !Number.isFinite(hasta) || hasta <= desde) return []

    if (!supabase) {
      const candidatas = [...(get().ventas || []), ...(get().ventasSemana || [])]
      const out = []
      const seen = new Set()
      for (const v of candidatas) {
        if (!v?.created_at) continue
        const t = new Date(v.created_at).getTime()
        if (!Number.isFinite(t) || t < desde || t >= hasta) continue
        const key = v.id != null ? `id:${v.id}` : `${v.sabor}-${v.created_at}-${v.qty}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push(normalizeVenta(v))
      }
      return out
    }

    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('fetchVentasRango', error)
      return []
    }
    return (data || []).map(normalizeVenta)
  },

  async cargarInventarioSabores() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('inventario_sabores')
      .select('id, sabor, stock, pausado, emoji')
    if (error) {
      console.error('cargarInventarioSabores', error)
      return
    }
    const map = {}
    const pausadoMap = {}
    for (const r of data || []) {
      if (r.sabor) {
        map[r.sabor] = Number(r.stock) || 0
        pausadoMap[r.sabor] = Boolean(r.pausado)
      }
    }
    set((s) => {
      const byKey = new Map(
        (data || []).map((row) => [String(row.sabor).trim().toLowerCase(), row])
      )
      const seenDb = new Set()
      const saboresNext = s.sabores.map((item) => {
        const k = String(item.sabor ?? item.nombre).trim().toLowerCase()
        const row = byKey.get(k)
        if (!row) return item
        seenDb.add(k)
        return {
          ...item,
          id: row.id,
          invId: row.id,
          sabor: row.sabor,
          stock: Number(row.stock) || 0,
          emoji:
            row.emoji != null && String(row.emoji).trim() !== ''
              ? String(row.emoji).slice(0, 4)
              : item.emoji,
        }
      })
      for (const row of data || []) {
        const k = String(row.sabor).trim().toLowerCase()
        if (seenDb.has(k)) continue
        saboresNext.push({
          id: row.id,
          invId: row.id,
          sabor: row.sabor,
          emoji:
            row.emoji != null && String(row.emoji).trim() !== ''
              ? String(row.emoji).slice(0, 4)
              : '🥤',
          stock: Number(row.stock) || 0,
        })
      }
      return { inventarioPorSabor: map, pausadoPorSabor: pausadoMap, sabores: saboresNext }
    })
    await get().calcularMeta()
  },

  /** Pausa o reanuda un sabor en `inventario_sabores` (upsert si no existe fila). */
  async setPausadoSabor(nombreSabor, pausado) {
    const name = String(nombreSabor ?? '').trim()
    if (!name) return
    const stock = Number(get().inventarioPorSabor[name]) || 0
    set((s) => ({
      pausadoPorSabor: { ...s.pausadoPorSabor, [name]: Boolean(pausado) },
    }))
    if (!supabase) {
      await get().calcularMeta()
      return
    }
    const { error } = await supabase
      .from('inventario_sabores')
      .upsert(
        { sabor: name, stock, pausado: Boolean(pausado) },
        { onConflict: 'sabor' }
      )
    if (error) {
      console.error('setPausadoSabor', error)
      await get().cargarInventarioSabores()
    } else {
      await get().calcularMeta()
    }
  },

  /**
   * Inserta varias filas en `compras` (sugerencias de la calculadora).
   * @param {Array<{ nombre: string, cantidad: number, precio?: number }>} items
   */
  async agregarSugerenciasACompras(items) {
    const list = (items || []).filter((i) => i && String(i.nombre || '').trim() !== '')
    if (!list.length) return
    const fechaHoy = formatDateLocal(new Date())
    if (!supabase) {
      const temp = list.map((i, idx) => ({
        id: `tmp-sug-${Date.now()}-${idx}`,
        nombre: String(i.nombre).trim(),
        cantidad: Math.max(0, Number(i.cantidad) || 0),
        precio: Number(i.precio) || 0,
        fecha: fechaHoy,
      }))
      set((s) => ({ compras: [...s.compras, ...temp] }))
      get().calcularPuntoEquilibrio()
      return
    }
    const rows = list.map((i) => ({
      nombre: String(i.nombre).trim(),
      cantidad: Math.max(0, Number(i.cantidad) || 0),
      precio: Number(i.precio) || 0,
      fecha: fechaHoy,
    }))
    const { data, error } = await supabase.from('compras').insert(rows).select()
    if (error) {
      console.error('agregarSugerenciasACompras', error)
      return
    }
    set((s) => ({
      compras: [...s.compras, ...(data || []).map(normalizeCompra)],
    }))
    get().calcularPuntoEquilibrio()
  },

  async agregarVenta(venta) {
    const tempId = `tmp-${Date.now()}`
    const uiPlan = debeActualizarPlanUi(get)
    const qtyNum = Number(venta.qty) || 0
    set((s) => {
      const ventas = [{ ...venta, qty: qtyNum, id: tempId }, ...s.ventas]
      return {
        ventas,
        totalJugosHoy: totalQtyVentas(ventas),
        sabores: venta.saborId
          ? s.sabores.map((x) =>
              x.id === venta.saborId ? { ...x, stock: Math.max(0, x.stock - qtyNum) } : x
            )
          : s.sabores,
        plan: uiPlan ? ajustarPlanVenta(s.plan, { ...venta, qty: qtyNum }, 1) : s.plan,
      }
    })
    get().calcularPuntoEquilibrio()

    if (!supabase) return
    const notas =
      venta.notas != null && String(venta.notas).trim() !== ''
        ? String(venta.notas).trim().slice(0, 50)
        : ''

    const { data, error } = await supabase
      .from('ventas')
      .insert({
        sabor: venta.sabor,
        emoji: venta.emoji,
        tam: venta.tam,
        qty: venta.qty,
        precio: venta.precio,
        total: venta.total,
        hora: venta.hora,
        notas,
      })
      .select()
      .single()

    if (error) {
      console.error('agregarVenta', error)
      set((s) => {
        const ventas = s.ventas.filter((v) => v.id !== tempId)
        return {
          ventas,
          totalJugosHoy: totalQtyVentas(ventas),
          sabores: venta.saborId
            ? s.sabores.map((x) =>
                x.id === venta.saborId ? { ...x, stock: x.stock + qtyNum } : x
              )
            : s.sabores,
          plan: uiPlan ? ajustarPlanVenta(s.plan, { ...venta, qty: qtyNum }, -1) : s.plan,
        }
      })
      get().calcularPuntoEquilibrio()
      return
    }

    set((s) => {
      const ventas = s.ventas.map((v) => (v.id === tempId ? normalizeVenta(data) : v))
      return { ventas, totalJugosHoy: totalQtyVentas(ventas) }
    })
    get().calcularPuntoEquilibrio()
    await get().cargarInventarioSabores()
    await get().aplicarVentaAPlanDb(venta, 1)
    if (uiPlan) {
      const sel = get().semanaSeleccionada
      if (sel) await get().cargarPlanPorSemana(sel)
    }
  },

  async eliminarVenta(id) {
    const prev = get().ventas.find((v) => v.id === id)
    if (!prev) return
    const uiPlan = debeActualizarPlanUi(get)
    set((s) => {
      const ventas = s.ventas.filter((v) => v.id !== id)
      return {
        ventas,
        totalJugosHoy: totalQtyVentas(ventas),
        sabores: s.sabores.map((x) =>
          String(x.sabor ?? x.nombre) === String(prev.sabor)
            ? { ...x, stock: x.stock + prev.qty }
            : x
        ),
        plan: uiPlan ? ajustarPlanVenta(s.plan, prev, -1) : s.plan,
      }
    })
    get().calcularPuntoEquilibrio()
    if (!supabase || String(id).startsWith('tmp-')) return
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (error) console.error('eliminarVenta', error)
    else {
      await get().cargarInventarioSabores()
      await get().aplicarVentaAPlanDb(prev, -1)
      if (uiPlan) {
        const sel = get().semanaSeleccionada
        if (sel) await get().cargarPlanPorSemana(sel)
      }
    }
  },

  async limpiarVentas() {
    const prevVentas = get().ventas
    const uiPlan = debeActualizarPlanUi(get)
    set((s) => {
      let plan = s.plan
      let sabores = s.sabores
      for (const v of prevVentas) {
        if (uiPlan) plan = ajustarPlanVenta(plan, v, -1)
        sabores = sabores.map((x) =>
          String(x.sabor ?? x.nombre) === String(v.sabor)
            ? { ...x, stock: x.stock + v.qty }
            : x
        )
      }
      return { ventas: [], totalJugosHoy: 0, plan, sabores }
    })
    get().calcularPuntoEquilibrio()
    if (!supabase) return
    const hoy = formatDateLocal(new Date())
    const { start, end } = dateRangeForYmd(hoy)
    const { error } = await supabase.from('ventas').delete().gte('created_at', start).lt('created_at', end)
    if (error) console.error('limpiarVentas', error)
    else {
      for (const v of prevVentas) {
        await get().aplicarVentaAPlanDb(v, -1)
      }
      await get().cargarInventarioSabores()
      if (uiPlan) {
        const sel = get().semanaSeleccionada
        if (sel) await get().cargarPlanPorSemana(sel)
      }
    }
  },

  async cargarSemanas() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('plan_diario')
      .select('semana')
      .order('semana', { ascending: false })
    if (error) return console.error('cargarSemanas', error)
    const seen = new Set()
    const list = []
    for (const row of data || []) {
      const key = normalizeSemanaKey(row.semana)
      if (key && !seen.has(key)) {
        seen.add(key)
        list.push(key)
      }
    }
    list.sort((a, b) => b.localeCompare(a))
    set({ semanas: list })
  },

  async cargarPlanPorSemana(fecha) {
    if (!supabase || !fecha) return
    const key = normalizeSemanaKey(fecha)
    const { data, error } = await supabase.from('plan_diario').select('*').eq('semana', key)
    if (error) return console.error('cargarPlanPorSemana', error)
    const sorted = sortPlanRows(data).map(normalizePlanRow)
    set({ semanaSeleccionada: key, plan: sorted })
    get().calcularPuntoEquilibrio()
  },

  async iniciarSemana() {
    console.log('Iniciando semana...')

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const dia = hoy.getDay()
    const diffLunes = dia === 0 ? -6 : 1 - dia
    const lunesDate = new Date(hoy)
    lunesDate.setDate(hoy.getDate() + diffLunes)
    lunesDate.setHours(0, 0, 0, 0)
    const fechaLunes = formatDateLocal(lunesDate)

    console.log('Fecha lunes:', fechaLunes)
    console.log('Creando semana desde:', fechaLunes)

    if (!supabase) {
      console.error('iniciarSemana', new Error('Supabase no configurado'))
      return
    }

    const { data: existe, error: errExiste } = await supabase
      .from('plan_diario')
      .select('id')
      .eq('semana', fechaLunes)
      .limit(1)

    if (errExiste) {
      console.error('Error verificando si la semana existe:', errExiste)
      return
    }

    if (existe && existe.length > 0) {
      console.log('La semana ya existe')
      await get().cargarSemanas()
      await get().cargarPlanPorSemana(fechaLunes)
      set({ semanaActiva: fechaLunes, semanaSeleccionada: fechaLunes })
      return
    }

    const filas = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((diaNombre) => ({
      dia: diaNombre,
      pg: 40,
      pp: 25,
      vg: 0,
      vp: 0,
      semana: fechaLunes,
      cerrada: false,
    }))

    const { data, error } = await supabase.from('plan_diario').insert(filas).select()
    console.log('Resultado insert:', data, error)

    if (error) {
      console.error('Error creando semana:', error)
      return
    }

    console.log('Semana creada:', data)

    const planOrdenado = sortPlanRows(data).map(normalizePlanRow)
    set({
      semanaActiva: fechaLunes,
      semanaSeleccionada: fechaLunes,
      plan: planOrdenado,
    })
    await get().cargarSemanas()
    await get().cargarSemanasCerradasList()
    get().calcularPuntoEquilibrio()
  },

  async cerrarSemana() {
    const fecha = get().semanaSeleccionada
    const activa = get().semanaActiva
    if (!supabase || !fecha || fecha !== activa) return
    set((s) => ({
      plan: s.plan.map((r) => ({ ...r, cerrada: true })),
    }))
    const { error } = await supabase.from('plan_diario').update({ cerrada: true }).eq('semana', fecha)
    if (error) {
      console.error('cerrarSemana', error)
      await get().cargarPlanPorSemana(fecha)
      return
    }
    await get().cargarSemanas()
    await get().cargarSemanasCerradasList()
    get().calcularPuntoEquilibrio()
  },

  /**
   * Lista de lunes (`YYYY-MM-DD`) que tienen al menos una fila `plan_diario` cerrada.
   */
  async cargarSemanasCerradasList() {
    if (!supabase) {
      set({ semanasCerradas: [] })
      return
    }
    const { data, error } = await supabase.from('plan_diario').select('semana').eq('cerrada', true)
    if (error) {
      console.error('cargarSemanasCerradasList', error)
      return
    }
    const seen = new Set()
    for (const row of data || []) {
      const k = normalizeSemanaKey(row.semana)
      if (k) seen.add(k)
    }
    const list = [...seen].sort((a, b) => b.localeCompare(a))
    set({ semanasCerradas: list })
  },

  /**
   * Reabre una semana (todas las filas con ese lunes): `cerrada = false`.
   * @param {string} [lunesYmd] Lunes de la semana; por defecto `semanaActiva`.
   */
  async reabrirSemana(lunesYmd) {
    const key = normalizeSemanaKey(lunesYmd ?? get().semanaActiva)
    if (!key) return
    const sel = get().semanaSeleccionada

    if (!supabase) {
      set((s) => ({
        plan: s.plan.map((r) =>
          normalizeSemanaKey(r.semana) === key ? { ...r, cerrada: false } : r
        ),
      }))
      get().calcularPuntoEquilibrio()
      await get().cargarSemanasCerradasList()
      return
    }

    const { error } = await supabase.from('plan_diario').update({ cerrada: false }).eq('semana', key)
    if (error) {
      console.error('reabrirSemana', error)
      if (sel === key) await get().cargarPlanPorSemana(key)
      return
    }

    await get().cargarSemanas()
    await get().cargarSemanasCerradasList()
    if (sel === key) await get().cargarPlanPorSemana(key)
    get().calcularPuntoEquilibrio()
  },

  async updatePlan(id, field, val) {
    if (id == null) return
    const { semanaSeleccionada, semanaActiva, plan } = get()
    if (!plan.length) return
    if (semanaSeleccionada !== semanaActiva || plan[0].cerrada) return

    const nextVal = Number(val) || 0
    set((s) => ({ plan: s.plan.map((r) => (r.id === id ? { ...r, [field]: nextVal } : r)) }))
    if (!supabase) {
      get().calcularPuntoEquilibrio()
      return
    }
    const { error } = await supabase.from('plan_diario').update({ [field]: nextVal }).eq('id', id)
    if (error) console.error('updatePlan', error)
    get().calcularPuntoEquilibrio()
  },

  /**
   * Semana calendario actual: carga `plan_diario` o inserta 7 días automáticamente.
   * Fecha del lunes en hora local (`formatDateLocal`, no UTC).
   */
  async cargarPlan() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const dia = hoy.getDay()
    const diffLunes = dia === 0 ? -6 : 1 - dia
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() + diffLunes)
    lunes.setHours(0, 0, 0, 0)
    const fechaLunes = formatDateLocal(lunes)

    set({ semanaActiva: fechaLunes, semanaSeleccionada: fechaLunes })

    if (!supabase) {
      console.warn('cargarPlan: Supabase no configurado')
      get().calcularPuntoEquilibrio()
      return
    }

    const { data, error: errQuery } = await supabase
      .from('plan_diario')
      .select('*')
      .eq('semana', fechaLunes)
      .order('id', { ascending: true })

    if (errQuery) {
      console.error('cargarPlan:', errQuery)
      return
    }

    if (!data || data.length === 0) {
      const filas = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((nombreDia) => ({
        dia: nombreDia,
        pg: 40,
        pp: 25,
        vg: 0,
        vp: 0,
        semana: fechaLunes,
        cerrada: false,
      }))

      const { data: nuevas, error: errInsert } = await supabase.from('plan_diario').insert(filas).select()

      if (errInsert) {
        console.error('cargarPlan insert:', errInsert)
        return
      }

      const planOrdenado = sortPlanRows(nuevas).map(normalizePlanRow)
      set({
        plan: planOrdenado,
        semanaActiva: fechaLunes,
        semanaSeleccionada: fechaLunes,
      })
    } else {
      const planOrdenado = sortPlanRows(data).map(normalizePlanRow)
      set({
        plan: planOrdenado,
        semanaActiva: fechaLunes,
        semanaSeleccionada: fechaLunes,
      })
    }

    await get().cargarSemanas()
    get().calcularPuntoEquilibrio()
  },

  /** Arranque de la app: igual que cargarPlan (auto-crea la semana si no hay filas). */
  async inicializarPlanSemanas() {
    await get().cargarPlan()
  },

  /** Carga todas las filas de `compras`; el filtro por fecha/período es responsabilidad de la UI. */
  async cargarCompras() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .order('id', { ascending: true })
    if (error) return console.error('cargarCompras', error)
    set({ compras: (data || []).map(normalizeCompra) })
    get().calcularPuntoEquilibrio()
  },

  /**
   * Últimos 7 días del calendario (hoy → hace 6 días), con montos por día.
   * Equivale a agrupar ventas por DATE(created_at) en hora local y rellenar días sin filas con 0.
   */
  async cargarHistorial7Dias() {
    if (!supabase) {
      set({ historial7Dias: [] })
      return
    }

    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      return formatDateLocal(d)
    })

    const fechaMasAntigua = dias[6]
    const dAnt = parseDateLocal(fechaMasAntigua)
    const rangeStart = new Date(dAnt.getFullYear(), dAnt.getMonth(), dAnt.getDate(), 0, 0, 0, 0)
    const hoy = new Date()
    const rangeEnd = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 0, 0, 0, 0)

    const { data, error } = await supabase
      .from('ventas')
      .select('created_at, total')
      .gte('created_at', rangeStart.toISOString())
      .lt('created_at', rangeEnd.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('cargarHistorial7Dias', error)
      set({ historial7Dias: [] })
      return
    }

    const porDia = new Map()
    for (const row of data || []) {
      const ymd = formatDateLocal(new Date(row.created_at))
      const t = Number(row.total) || 0
      porDia.set(ymd, (porDia.get(ymd) || 0) + t)
    }

    const resultado = dias.map((fecha) => ({
      fecha,
      monto: porDia.get(fecha) || 0,
    }))

    set({ historial7Dias: resultado })
  },

  /**
   * Desglose por tamaño para la semana calendario actual (desde lunes local hasta fin de hoy).
   */
  async cargarDesgloseXTamano() {
    const vacio = {
      grande: { cantidad: 0, ingreso: 0 },
      pequeno: { cantidad: 0, ingreso: 0 },
    }
    if (!supabase) {
      set({ desgloseXTamano: vacio })
      return
    }

    const lunes = mondayOfDate()
    const weekStart = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate(), 0, 0, 0, 0)
    const now = new Date()
    const rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)

    const { data, error } = await supabase
      .from('ventas')
      .select('tam, qty, total')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', rangeEnd.toISOString())

    if (error) {
      console.error('cargarDesgloseXTamano', error)
      set({ desgloseXTamano: vacio })
      return
    }

    const acc = {
      grande: { cantidad: 0, ingreso: 0 },
      pequeno: { cantidad: 0, ingreso: 0 },
    }
    for (const row of data || []) {
      const tam = row.tam === 'grande' ? 'grande' : row.tam === 'pequeno' ? 'pequeno' : null
      if (!tam) continue
      acc[tam].cantidad += Number(row.qty) || 0
      acc[tam].ingreso += Number(row.total) || 0
    }
    set({ desgloseXTamano: acc })
  },

  async agregarCompra() {
    const tempId = `tmp-${Date.now()}`
    const fechaHoy = formatDateLocal(new Date())
    const empty = { id: tempId, nombre: '', cantidad: 0, precio: 0, fecha: fechaHoy }
    set((s) => ({ compras: [...s.compras, empty] }))
    get().calcularPuntoEquilibrio()
    if (!supabase) return
    const { data, error } = await supabase
      .from('compras')
      .insert({ nombre: '', cantidad: 0, precio: 0, fecha: fechaHoy })
      .select()
      .single()
    if (error) return console.error('agregarCompra', error)
    set((s) => ({
      compras: s.compras.map((c) => (c.id === tempId ? normalizeCompra(data) : c)),
    }))
    get().calcularPuntoEquilibrio()
  },

  async updateCompra(id, field, val) {
    const nextVal = field === 'nombre' ? val : Number(val) || 0
    set((s) => ({
      compras: s.compras.map((c) => (c.id === id ? { ...c, [field]: nextVal } : c)),
    }))
    get().calcularPuntoEquilibrio()
    if (!supabase || String(id).startsWith('tmp-')) return
    const { error } = await supabase.from('compras').update({ [field]: nextVal }).eq('id', id)
    if (error) console.error('updateCompra', error)
  },

  async eliminarCompra(id) {
    set((s) => ({ compras: s.compras.filter((c) => c.id !== id) }))
    get().calcularPuntoEquilibrio()
    if (!supabase || String(id).startsWith('tmp-')) return
    const { error } = await supabase.from('compras').delete().eq('id', id)
    if (error) console.error('eliminarCompra', error)
  },

  async cargarMayoristas() {
    if (!supabase) {
      set({ mayoristas: [] })
      return
    }
    const { data, error } = await supabase
      .from('mayoristas')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) {
      console.error('cargarMayoristas', error)
      return
    }
    set({ mayoristas: (data || []).map(normalizeMayorista).filter(Boolean) })
  },

  async agregarMayorista(cliente) {
    const nombre = String(cliente?.nombre ?? '').trim()
    const telefono = String(cliente?.telefono ?? '').trim()
    const precio_grande = Number(cliente?.precio_grande) || 0
    const precio_pequeno = Number(cliente?.precio_pequeno) || 0
    if (!nombre) return null

    const fotoVal = cliente?.foto != null ? String(cliente.foto).trim() : ''
    const row = { nombre, telefono, precio_grande, precio_pequeno, activo: true }
    if (fotoVal) row.foto = fotoVal
    if (!supabase) {
      const id = `tmp-m-${Date.now()}`
      const m = normalizeMayorista({ id, ...row })
      set((s) => ({ mayoristas: [...s.mayoristas, m].sort((a, b) => a.nombre.localeCompare(b.nombre)) }))
      return m
    }
    const { data, error } = await supabase.from('mayoristas').insert(row).select().single()
    if (error) {
      console.error('agregarMayorista', error)
      return null
    }
    const m = normalizeMayorista(data)
    await get().cargarMayoristas()
    return m
  },

  async updateMayorista(id, campos) {
    const patch = {}
    if (campos.nombre != null) patch.nombre = String(campos.nombre).trim()
    if (campos.telefono != null) patch.telefono = String(campos.telefono).trim()
    if (campos.precio_grande != null) patch.precio_grande = Number(campos.precio_grande) || 0
    if (campos.precio_pequeno != null) patch.precio_pequeno = Number(campos.precio_pequeno) || 0
    if (campos.activo != null) patch.activo = Boolean(campos.activo)
    if (campos.foto !== undefined) {
      const f = campos.foto != null ? String(campos.foto).trim() : ''
      patch.foto = f || null
    }
    if (!Object.keys(patch).length) return

    if (!supabase || String(id).startsWith('tmp-')) {
      set((s) => ({
        mayoristas: s.mayoristas.map((x) => (x.id === id ? normalizeMayorista({ ...x, ...patch }) : x)),
      }))
      return
    }
    const { error } = await supabase.from('mayoristas').update(patch).eq('id', id)
    if (error) console.error('updateMayorista', error)
    else await get().cargarMayoristas()
  },

  async cargarOrdenesMayoristas() {
    if (!supabase) {
      set({ ordenesMayoristas: [] })
      return
    }
    const { data, error } = await supabase
      .from('ordenes_mayoristas')
      .select('*, mayoristas(nombre)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('cargarOrdenesMayoristas', error)
      return
    }
    set({ ordenesMayoristas: (data || []).map(normalizeOrdenMayorista).filter(Boolean) })
  },

  async agregarOrdenMayorista(orden) {
    const mayorista_id = orden.mayorista_id
    const cantidad_grandes = Math.max(0, Number(orden.cantidad_grandes) || 0)
    const cantidad_pequenos = Math.max(0, Number(orden.cantidad_pequenos) || 0)
    const precio_grande = Number(orden.precio_grande) || 0
    const precio_pequeno = Number(orden.precio_pequeno) || 0
    const notas = String(orden.notas ?? '').trim().slice(0, 500)
    const total = cantidad_grandes * precio_grande + cantidad_pequenos * precio_pequeno
    if (!mayorista_id || (cantidad_grandes <= 0 && cantidad_pequenos <= 0)) return null

    const insertRow = {
      mayorista_id,
      cantidad_grandes,
      cantidad_pequenos,
      precio_grande,
      precio_pequeno,
      total,
      notas,
      estado: 'pendiente',
    }

    if (!supabase || String(mayorista_id).startsWith('tmp-')) {
      const id = `tmp-o-${Date.now()}`
      const nombre =
        get().mayoristas.find((m) => String(m.id) === String(mayorista_id))?.nombre ?? 'Cliente'
      const o = normalizeOrdenMayorista({
        id,
        ...insertRow,
        created_at: new Date().toISOString(),
        mayorista_nombre: nombre,
      })
      set((s) => ({ ordenesMayoristas: [o, ...s.ordenesMayoristas] }))
      return o
    }

    const { data, error } = await supabase.from('ordenes_mayoristas').insert(insertRow).select().single()
    if (error) {
      console.error('agregarOrdenMayorista', error)
      return null
    }
    await get().cargarOrdenesMayoristas()
    const m = get().mayoristas.find((x) => Number(x.id) === Number(data.mayorista_id))
    return normalizeOrdenMayorista({ ...data, mayorista_nombre: m?.nombre ?? '' })
  },

  async updateEstadoOrdenMayorista(id, estado) {
    const e = ['pendiente', 'entregado', 'cancelado'].includes(estado) ? estado : 'pendiente'

    if (!supabase || String(id).startsWith('tmp-')) {
      const prev = get().ordenesMayoristas.find((o) => String(o.id) === String(id))
      const becomingEntregado = prev && e === 'entregado' && prev.estado !== 'entregado' && !prev.stock_descontado
      if (becomingEntregado && prev) {
        aplicarDescuentoMayoristaOffline(get, set, prev)
      }
      set((s) => ({
        ordenesMayoristas: s.ordenesMayoristas.map((o) =>
          String(o.id) === String(id)
            ? {
                ...o,
                estado: e,
                stock_descontado: becomingEntregado ? true : o.stock_descontado,
              }
            : o
        ),
      }))
      get().calcularPuntoEquilibrio()
      await get().calcularMeta()
      return
    }

    const { data: ordenDb, error: fetchErr } = await supabase
      .from('ordenes_mayoristas')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (fetchErr || !ordenDb) {
      console.error('updateEstadoOrdenMayorista fetch', fetchErr)
      return
    }

    const prevEstado = ordenDb.estado
    const yaDescontado = Boolean(ordenDb.stock_descontado)
    const becomingEntregado = e === 'entregado' && prevEstado !== 'entregado' && !yaDescontado

    if (becomingEntregado) {
      await aplicarDescuentoInventarioMayorista(supabase, ordenDb.cantidad_grandes, ordenDb.cantidad_pequenos)
      await aplicarPlanDiarioMayorista(supabase, get, ordenDb.cantidad_grandes, ordenDb.cantidad_pequenos)
    }

    const patch = { estado: e }
    if (becomingEntregado) patch.stock_descontado = true

    const { error } = await supabase.from('ordenes_mayoristas').update(patch).eq('id', id)
    if (error) {
      console.error('updateEstadoOrdenMayorista', error)
      return
    }

    await get().cargarOrdenesMayoristas()
    await get().cargarInventarioSabores()
    await get().cargarPlan()
    get().calcularPuntoEquilibrio()
    await get().calcularMeta()
  },
}))
