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

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
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

function normalizeCompra(c) {
  return {
    ...c,
    cantidad: Number(c.cantidad) || 0,
    precio: Number(c.precio) || 0,
  }
}

function defaultConfig() {
  return {
    id: null,
    precio_grande: DEFAULT_PG,
    precio_pequeno: DEFAULT_PP,
    nombre_negocio: 'Jugos Nayi',
    updated_at: null,
  }
}

function normalizeConfigRow(row) {
  if (!row) return defaultConfig()
  return {
    id: row.id ?? null,
    precio_grande: Number(row.precio_grande) || DEFAULT_PG,
    precio_pequeno: Number(row.precio_pequeno) || DEFAULT_PP,
    nombre_negocio:
      row.nombre_negocio != null && String(row.nombre_negocio).trim() !== ''
        ? String(row.nombre_negocio).trim()
        : 'Jugos Nayi',
    updated_at: row.updated_at ?? null,
  }
}

export const useStore = create((set, get) => ({
  sabores: DEFAULT_SABORES,
  /** Lunes de la semana calendario actual (hoy). */
  semanaActiva: null,
  semanaSeleccionada: null,
  semanas: [],
  plan: [],
  ventas: [],
  compras: [],
  config: defaultConfig(),
  PG: DEFAULT_PG,
  PP: DEFAULT_PP,

  agregarSabor: () =>
    set((s) => ({
      sabores: [
        ...s.sabores,
        { id: `j-${Date.now()}`, nombre: 'Nuevo', emoji: '🥤', stock: 0 },
      ],
    })),
  updateSabor: (id, field, val) =>
    set((s) => ({
      sabores: s.sabores.map((x) =>
        x.id === id
          ? { ...x, [field]: field === 'nombre' || field === 'emoji' ? val : Number(val) || 0 }
          : x
      ),
    })),
  eliminarSabor: (id) => set((s) => ({ sabores: s.sabores.filter((x) => x.id !== id) })),

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

  /** Guarda los tres campos en una sola petición (formulario Configuración). */
  async guardarConfiguracion({ precio_grande, precio_pequeno, nombre_negocio }) {
    const pg = Number(precio_grande) || DEFAULT_PG
    const pp = Number(precio_pequeno) || DEFAULT_PP
    const nombre = String(nombre_negocio ?? '').trim() || 'Jugos Nayi'
    const updated_at = new Date().toISOString()
    const cfg = get().config

    if (!supabase) {
      set({
        config: { ...cfg, id: cfg.id, precio_grande: pg, precio_pequeno: pp, nombre_negocio: nombre, updated_at },
        PG: pg,
        PP: pp,
      })
      return
    }

    const patch = { precio_grande: pg, precio_pequeno: pp, nombre_negocio: nombre, updated_at }

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

  async cargarVentas() {
    if (!supabase) return
    const { start, end } = todayRange()
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
    if (error) return console.error('cargarVentas', error)
    set({ ventas: (data || []).map(normalizeVenta) })
  },

  async agregarVenta(venta) {
    const tempId = `tmp-${Date.now()}`
    const uiPlan = debeActualizarPlanUi(get)
    set((s) => ({
      ventas: [{ ...venta, id: tempId }, ...s.ventas],
      sabores: venta.saborId
        ? s.sabores.map((x) =>
            x.id === venta.saborId ? { ...x, stock: Math.max(0, x.stock - venta.qty) } : x
          )
        : s.sabores,
      plan: uiPlan ? ajustarPlanVenta(s.plan, venta, 1) : s.plan,
    }))

    if (!supabase) return
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
      })
      .select()
      .single()

    if (error) {
      console.error('agregarVenta', error)
      set((s) => ({
        ventas: s.ventas.filter((v) => v.id !== tempId),
        sabores: venta.saborId
          ? s.sabores.map((x) =>
              x.id === venta.saborId ? { ...x, stock: x.stock + venta.qty } : x
            )
          : s.sabores,
        plan: uiPlan ? ajustarPlanVenta(s.plan, venta, -1) : s.plan,
      }))
      return
    }

    set((s) => ({
      ventas: s.ventas.map((v) => (v.id === tempId ? normalizeVenta(data) : v)),
    }))
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
    set((s) => ({
      ventas: s.ventas.filter((v) => v.id !== id),
      sabores: s.sabores.map((x) =>
        x.nombre === prev.sabor ? { ...x, stock: x.stock + prev.qty } : x
      ),
      plan: uiPlan ? ajustarPlanVenta(s.plan, prev, -1) : s.plan,
    }))
    if (!supabase || String(id).startsWith('tmp-')) return
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (error) console.error('eliminarVenta', error)
    else {
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
        sabores = sabores.map((x) => (x.nombre === v.sabor ? { ...x, stock: x.stock + v.qty } : x))
      }
      return { ventas: [], plan, sabores }
    })
    if (!supabase) return
    const { start, end } = todayRange()
    const { error } = await supabase.from('ventas').delete().gte('created_at', start).lt('created_at', end)
    if (error) console.error('limpiarVentas', error)
    else {
      for (const v of prevVentas) {
        await get().aplicarVentaAPlanDb(v, -1)
      }
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
  },

  async updatePlan(id, field, val) {
    if (id == null) return
    const { semanaSeleccionada, semanaActiva, plan } = get()
    if (!plan.length) return
    if (semanaSeleccionada !== semanaActiva || plan[0].cerrada) return

    const nextVal = Number(val) || 0
    set((s) => ({ plan: s.plan.map((r) => (r.id === id ? { ...r, [field]: nextVal } : r)) }))
    if (!supabase) return
    const { error } = await supabase.from('plan_diario').update({ [field]: nextVal }).eq('id', id)
    if (error) console.error('updatePlan', error)
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
  },

  /** Arranque de la app: igual que cargarPlan (auto-crea la semana si no hay filas). */
  async inicializarPlanSemanas() {
    await get().cargarPlan()
  },

  async cargarCompras() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .order('id', { ascending: true })
    if (error) return console.error('cargarCompras', error)
    set({ compras: (data || []).map(normalizeCompra) })
  },

  async agregarCompra() {
    const tempId = `tmp-${Date.now()}`
    const empty = { id: tempId, nombre: '', cantidad: 0, precio: 0 }
    set((s) => ({ compras: [...s.compras, empty] }))
    if (!supabase) return
    const { data, error } = await supabase
      .from('compras')
      .insert({ nombre: '', cantidad: 0, precio: 0 })
      .select()
      .single()
    if (error) return console.error('agregarCompra', error)
    set((s) => ({
      compras: s.compras.map((c) => (c.id === tempId ? normalizeCompra(data) : c)),
    }))
  },

  async updateCompra(id, field, val) {
    const nextVal = field === 'nombre' ? val : Number(val) || 0
    set((s) => ({
      compras: s.compras.map((c) => (c.id === id ? { ...c, [field]: nextVal } : c)),
    }))
    if (!supabase || String(id).startsWith('tmp-')) return
    const { error } = await supabase.from('compras').update({ [field]: nextVal }).eq('id', id)
    if (error) console.error('updateCompra', error)
  },

  async eliminarCompra(id) {
    set((s) => ({ compras: s.compras.filter((c) => c.id !== id) }))
    if (!supabase || String(id).startsWith('tmp-')) return
    const { error } = await supabase.from('compras').delete().eq('id', id)
    if (error) console.error('eliminarCompra', error)
  },
}))
