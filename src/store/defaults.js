export const DIAS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

/** Domingo = 0 … Sábado = 6 (`Date.getDay()`). Alineado con filas `plan_diario.dia`. */
export const DIAS_JS_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

export function diaSemanaHoy() {
  return DIAS_JS_WEEK[new Date().getDay()]
}

/** Índice en `DIAS` (Lunes primero en plan) según el calendario local. */
export function todayPlanIndex() {
  const i = DIAS.indexOf(diaSemanaHoy())
  return i >= 0 ? i : 0
}

export const DEFAULT_SABORES = [
  { id: 'naranja', sabor: 'Naranja', emoji: '🍊', stock: 50 },
  { id: 'chinola', sabor: 'Chinola', emoji: '🟡', stock: 40 },
  { id: 'mango', sabor: 'Mango', emoji: '🥭', stock: 40 },
  { id: 'pina', sabor: 'Piña', emoji: '🍍', stock: 35 },
  { id: 'zanahoria', sabor: 'Zanahoria', emoji: '🥕', stock: 30 },
  { id: 'melon', sabor: 'Melón', emoji: '🍈', stock: 30 },
  { id: 'lechoza', sabor: 'Lechoza', emoji: '🍑', stock: 25 },
  { id: 'mix', sabor: 'Mix Tropical', emoji: '🍹', stock: 40 },
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
