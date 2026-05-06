export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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
