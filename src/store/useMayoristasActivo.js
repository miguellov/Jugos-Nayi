import { useSyncExternalStore } from 'react'

const KEY = 'mayoristas_activo'

function getSnapshot() {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

function subscribe(callback) {
  window.addEventListener('storage', callback)
  window.addEventListener('mayoristas-activo-changed', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('mayoristas-activo-changed', callback)
  }
}

export function setMayoristasActivo(activo) {
  try {
    localStorage.setItem(KEY, activo ? 'true' : 'false')
    window.dispatchEvent(new Event('mayoristas-activo-changed'))
  } catch {
    /* ignore */
  }
}

export function getMayoristasActivo() {
  return getSnapshot()
}

export function useMayoristasActivo() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
