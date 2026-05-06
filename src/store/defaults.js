export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Índice en `plan` / `DIAS` según el día de hoy (Rep. Dominicana). */
export function todayPlanIndex() {
  const long = new Date().toLocaleDateString('es-DO', { weekday: 'long' })
  const cap = long.charAt(0).toUpperCase() + long.slice(1)
  const i = DIAS.indexOf(cap)
  // Domingo u otro día fuera del plan L–S: contabilizar en Sábado (última fila)
  return i >= 0 ? i : DIAS.length - 1
}

export const DEFAULT_SABORES = [
  { id: 'naranja', nombre: 'Naranja', emoji: '🍊', stock: 50 },
  { id: 'chinola', nombre: 'Chinola', emoji: '🟡', stock: 40 },
  { id: 'mango', nombre: 'Mango', emoji: '🥭', stock: 40 },
  { id: 'pina', nombre: 'Piña', emoji: '🍍', stock: 35 },
  { id: 'zanahoria', nombre: 'Zanahoria', emoji: '🥕', stock: 30 },
  { id: 'melon', nombre: 'Melón', emoji: '🍈', stock: 30 },
  { id: 'lechoza', nombre: 'Lechoza', emoji: '🍑', stock: 25 },
  { id: 'mix', nombre: 'Mix Tropical', emoji: '🍹', stock: 40 },
]

export function defaultPlan() {
  return DIAS.map((d) => ({ dia: d, pg: 40, pp: 25, vg: 0, vp: 0 }))
}

export const DEFAULT_COMPRAS = [
  { nombre: 'Naranja', cantidad: 10, precio: 150 },
  { nombre: 'Chinola', cantidad: 5, precio: 100 },
  { nombre: 'Vasos grandes', cantidad: 2, precio: 200 },
  { nombre: 'Vasos pequeños', cantidad: 2, precio: 150 },
]

export const DEFAULT_PG = 100
export const DEFAULT_PP = 65
