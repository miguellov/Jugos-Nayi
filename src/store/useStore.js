import { create } from 'zustand'

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

const SABORES_INICIAL = [
  { id: 'naranja', nombre: 'Naranja', emoji: '🍊', stock: 50 },
  { id: 'chinola', nombre: 'Chinola', emoji: '🟡', stock: 40 },
  { id: 'mango', nombre: 'Mango', emoji: '🥭', stock: 40 },
  { id: 'pina', nombre: 'Piña', emoji: '🍍', stock: 35 },
  { id: 'zanahoria', nombre: 'Zanahoria', emoji: '🥕', stock: 30 },
  { id: 'melon', nombre: 'Melón', emoji: '🍈', stock: 30 },
  { id: 'lechoza', nombre: 'Lechoza', emoji: '🍑', stock: 25 },
  { id: 'mix', nombre: 'Mix Tropical', emoji: '🍹', stock: 40 },
]

function restaurarStockPorVenta(sabores, venta) {
  if (!venta?.saborId) return sabores
  return sabores.map((x) =>
    x.id === venta.saborId ? { ...x, stock: x.stock + venta.qty } : x
  )
}

export const useStore = create((set) => ({
  // Sabores / inventario por jugo
  sabores: SABORES_INICIAL,
  agregarSabor: () =>
    set((s) => ({
      sabores: [
        ...s.sabores,
        {
          id: `j-${Date.now()}`,
          nombre: 'Nuevo',
          emoji: '🥤',
          stock: 0,
        },
      ],
    })),
  updateSabor: (id, field, val) =>
    set((s) => ({
      sabores: s.sabores.map((x) =>
        x.id === id
          ? {
              ...x,
              [field]: field === 'nombre' || field === 'emoji' ? val : Number(val) || 0,
            }
          : x
      ),
    })),
  eliminarSabor: (id) =>
    set((s) => ({
      sabores: s.sabores.filter((x) => x.id !== id),
    })),

  // Ventas del punto de venta
  ventas: [],
  agregarVenta: (venta) =>
    set((s) => {
      const sabores = venta.saborId
        ? s.sabores.map((x) =>
            x.id === venta.saborId
              ? { ...x, stock: Math.max(0, x.stock - venta.qty) }
              : x
          )
        : s.sabores
      return { ventas: [venta, ...s.ventas], sabores }
    }),
  eliminarVenta: (i) =>
    set((s) => {
      const venta = s.ventas[i]
      const ventas = s.ventas.filter((_, idx) => idx !== i)
      const sabores = venta ? restaurarStockPorVenta(s.sabores, venta) : s.sabores
      return { ventas, sabores }
    }),
  limpiarVentas: () =>
    set((s) => {
      let sabores = s.sabores
      for (const v of s.ventas) {
        sabores = restaurarStockPorVenta(sabores, v)
      }
      return { ventas: [], sabores }
    }),

  // Plan diario
  plan: DIAS.map(d => ({ dia: d, pg: 40, pp: 25, vg: 0, vp: 0 })),
  updatePlan: (i, field, val) => set(s => {
    const plan = [...s.plan]
    plan[i] = { ...plan[i], [field]: Number(val) }
    return { plan }
  }),

  // Compras
  compras: [
    { nombre: 'Naranja', cantidad: 10, precio: 150 },
    { nombre: 'Chinola', cantidad: 5, precio: 100 },
    { nombre: 'Vasos grandes', cantidad: 2, precio: 200 },
    { nombre: 'Vasos pequeños', cantidad: 2, precio: 150 },
  ],
  agregarCompra: () => set(s => ({ compras: [...s.compras, { nombre: '', cantidad: 0, precio: 0 }] })),
  updateCompra: (i, field, val) => set(s => {
    const compras = [...s.compras]
    compras[i] = { ...compras[i], [field]: field === 'nombre' ? val : Number(val) }
    return { compras }
  }),
  eliminarCompra: (i) => set(s => ({ compras: s.compras.filter((_,idx) => idx !== i) })),

  // Precios
  PG: 100,
  PP: 65,
}))