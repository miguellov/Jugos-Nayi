import { create } from 'zustand'
import {
  DEFAULT_COMPRAS,
  DEFAULT_PG,
  DEFAULT_PP,
  DEFAULT_SABORES,
  defaultPlan,
} from './defaults'

function restaurarStockPorVenta(sabores, venta) {
  if (!venta?.saborId) return sabores
  return sabores.map((x) =>
    x.id === venta.saborId ? { ...x, stock: x.stock + venta.qty } : x
  )
}

export const useStore = create((set) => ({
  sabores: DEFAULT_SABORES,
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

  plan: defaultPlan(),
  updatePlan: (i, field, val) =>
    set((s) => {
      const plan = [...s.plan]
      plan[i] = { ...plan[i], [field]: Number(val) }
      return { plan }
    }),

  compras: DEFAULT_COMPRAS,
  agregarCompra: () =>
    set((s) => ({ compras: [...s.compras, { nombre: '', cantidad: 0, precio: 0 }] })),
  updateCompra: (i, field, val) =>
    set((s) => {
      const compras = [...s.compras]
      compras[i] = {
        ...compras[i],
        [field]: field === 'nombre' ? val : Number(val),
      }
      return { compras }
    }),
  eliminarCompra: (i) =>
    set((s) => ({ compras: s.compras.filter((_, idx) => idx !== i) })),

  PG: DEFAULT_PG,
  PP: DEFAULT_PP,
}))
