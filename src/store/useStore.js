import { create } from 'zustand'
import { supabase } from '../supabase'
import { DEFAULT_PG, DEFAULT_PP, DEFAULT_SABORES, DIAS } from './defaults'

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function currentWeekKey() {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now - yearStart) / 86400000)
  const week = Math.ceil((days + yearStart.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function todayPlanIndex() {
  const long = new Date().toLocaleDateString('es-DO', { weekday: 'long' })
  const cap = long.charAt(0).toUpperCase() + long.slice(1)
  const idx = DIAS.indexOf(cap)
  return idx >= 0 ? idx : DIAS.length - 1
}

function ajustarPlanVenta(plan, venta, sign = 1) {
  const idx = todayPlanIndex()
  if (idx < 0 || idx >= plan.length) return plan
  const next = [...plan]
  const row = { ...next[idx] }
  if (venta.tam === 'grande') row.vg = Math.max(0, (row.vg || 0) + sign * venta.qty)
  if (venta.tam === 'pequeno') row.vp = Math.max(0, (row.vp || 0) + sign * venta.qty)
  next[idx] = row
  return next
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
    pg: Number(r.pg) || 0,
    pp: Number(r.pp) || 0,
    vg: Number(r.vg) || 0,
    vp: Number(r.vp) || 0,
  }
}

function normalizeCompra(c) {
  return {
    ...c,
    cantidad: Number(c.cantidad) || 0,
    precio: Number(c.precio) || 0,
  }
}

export const useStore = create((set, get) => ({
  sabores: DEFAULT_SABORES,
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

  ventas: [],
  plan: [],
  compras: [],
  PG: DEFAULT_PG,
  PP: DEFAULT_PP,

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
    set((s) => ({
      ventas: [{ ...venta, id: tempId }, ...s.ventas],
      sabores: venta.saborId
        ? s.sabores.map((x) =>
            x.id === venta.saborId ? { ...x, stock: Math.max(0, x.stock - venta.qty) } : x
          )
        : s.sabores,
      plan: ajustarPlanVenta(s.plan, venta, 1),
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
        plan: ajustarPlanVenta(s.plan, venta, -1),
      }))
      return
    }

    set((s) => ({
      ventas: s.ventas.map((v) => (v.id === tempId ? normalizeVenta(data) : v)),
    }))
  },

  async eliminarVenta(id) {
    const prev = get().ventas.find((v) => v.id === id)
    if (!prev) return
    set((s) => ({
      ventas: s.ventas.filter((v) => v.id !== id),
      sabores: s.sabores.map((x) =>
        x.nombre === prev.sabor ? { ...x, stock: x.stock + prev.qty } : x
      ),
      plan: ajustarPlanVenta(s.plan, prev, -1),
    }))
    if (!supabase || String(id).startsWith('tmp-')) return
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (error) console.error('eliminarVenta', error)
  },

  async limpiarVentas() {
    const prevVentas = get().ventas
    set((s) => {
      let plan = s.plan
      let sabores = s.sabores
      for (const v of prevVentas) {
        plan = ajustarPlanVenta(plan, v, -1)
        sabores = sabores.map((x) => (x.nombre === v.sabor ? { ...x, stock: x.stock + v.qty } : x))
      }
      return { ventas: [], plan, sabores }
    })
    if (!supabase) return
    const { start, end } = todayRange()
    const { error } = await supabase.from('ventas').delete().gte('created_at', start).lt('created_at', end)
    if (error) console.error('limpiarVentas', error)
  },

  async cargarPlan() {
    if (!supabase) return
    const semana = currentWeekKey()
    const { data, error } = await supabase
      .from('plan_diario')
      .select('*')
      .eq('semana', semana)
      .order('id', { ascending: true })
    if (error) return console.error('cargarPlan', error)
    set({ plan: (data || []).map(normalizePlanRow) })
  },

  async iniciarSemana() {
    if (!supabase) {
      console.error('iniciarSemana', new Error('Supabase no configurado'))
      return
    }
    const semana = currentWeekKey()
    const seed = DIAS.map((dia) => ({ dia, pg: 40, pp: 25, vg: 0, vp: 0, semana }))
    const { data, error } = await supabase
      .from('plan_diario')
      .insert(seed)
      .select('*')
      .order('id', { ascending: true })
    if (error) return console.error('iniciarSemana', error)
    set({ plan: (data || []).map(normalizePlanRow) })
  },

  async updatePlan(id, field, val) {
    if (id == null) return
    const nextVal = Number(val) || 0
    set((s) => ({ plan: s.plan.map((r) => (r.id === id ? { ...r, [field]: nextVal } : r)) }))
    if (!supabase) return
    const { error } = await supabase.from('plan_diario').update({ [field]: nextVal }).eq('id', id)
    if (error) console.error('updatePlan', error)
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
