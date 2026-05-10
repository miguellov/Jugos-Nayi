import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useStore } from '../store/useStore'
import {
  DEFAULT_COMPRAS,
  DEFAULT_PG,
  DEFAULT_PP,
  DEFAULT_SABORES,
  defaultPlan,
} from '../store/defaults'

const DEBOUNCE_MS = 350

let saveTimer = null
/** Evita upsert durante la hidratación; se activa al terminar init (incl. Strict Mode). */
let cloudSaveEnabled = false
let listenerAttached = false
let lifecycleFlushRegistered = false

function registerLifecycleFlush() {
  if (typeof window === 'undefined' || lifecycleFlushRegistered) return
  lifecycleFlushRegistered = true
  window.addEventListener('pagehide', () => flushPendingCloudSave())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingCloudSave()
  })
}

function snapshotFromStore(s) {
  return {
    sabores: s.sabores,
    ventas: s.ventas,
    plan: s.plan,
    compras: s.compras,
    PG: s.PG,
    PP: s.PP,
  }
}

function normalizeSaboresDesdeNube(list) {
  return (list || []).map((item) => {
    if (!item || typeof item !== 'object') return item
    const sabor =
      item.sabor != null && String(item.sabor).trim() !== ''
        ? String(item.sabor).trim()
        : item.nombre != null
          ? String(item.nombre).trim()
          : ''
    const { nombre: _omit, ...rest } = item
    return { ...rest, sabor }
  })
}

function mergeServerState(raw) {
  if (!raw || typeof raw !== 'object') return null
  const dias = 7
  const saboresRaw =
    Array.isArray(raw.sabores) && raw.sabores.length > 0 ? raw.sabores : [...DEFAULT_SABORES]
  return {
    sabores: normalizeSaboresDesdeNube(saboresRaw),
    ventas: Array.isArray(raw.ventas) ? raw.ventas : [],
    plan:
      Array.isArray(raw.plan) && raw.plan.length === dias ? raw.plan : defaultPlan(),
    compras: Array.isArray(raw.compras) ? raw.compras : [...DEFAULT_COMPRAS],
    PG: typeof raw.PG === 'number' ? raw.PG : DEFAULT_PG,
    PP: typeof raw.PP === 'number' ? raw.PP : DEFAULT_PP,
  }
}

async function ensureSession() {
  if (!supabase) {
    return { session: null, authError: null }
  }

  const {
    data: { session: existing },
  } = await supabase.auth.getSession()
  if (existing?.user) return { session: existing, authError: null }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('[Supabase] signInAnonymously', error)
    return { session: null, authError: error.message || 'Error de autenticación' }
  }
  return { session: data.session, authError: null }
}

async function saveCloudState(partialSnapshot) {
  if (!isSupabaseConfigured()) return

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return

  const payload = {
    user_id: session.user.id,
    state: partialSnapshot,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('jugos_state').upsert(payload, { onConflict: 'user_id' })

  if (error) console.error('[Supabase] save', error)
}

/** Guarda de inmediato (p. ej. al cerrar pestaña o cambiar de app) para no perder el debounce. */
export function flushPendingCloudSave() {
  clearTimeout(saveTimer)
  saveTimer = null
  if (!cloudSaveEnabled || !isSupabaseConfigured()) return
  const snap = snapshotFromStore(useStore.getState())
  void saveCloudState(snap)
}

registerLifecycleFlush()

/**
 * Carga la nube, hidrata Zustand y escucha cambios para guardar (debounce).
 * El guardado persistente es la tabla jugos_state en Supabase.
 */
export async function initJugosCloud() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      mode: 'local',
      error:
        'Supabase no está configurado (faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Sin nube, los cambios se pierden al recargar.',
    }
  }

  const { session, authError } = await ensureSession()
  if (!session?.user) {
    const hint =
      ' Activa Anonymous en Supabase (Authentication → Providers) y revisa VITE_SUPABASE_* en Vercel + Redeploy.'
    return {
      ok: false,
      mode: 'cloud',
      error: (authError || 'No hay sesión con Supabase.') + hint,
    }
  }

  const { data, error } = await supabase
    .from('jugos_state')
    .select('state')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('[Supabase] load', error)
    return {
      ok: false,
      mode: 'cloud',
      error: `${error.message} Revisa la tabla jugos_state y el SQL de migración.`,
    }
  }

  const rawState =
    data?.state != null && typeof data.state === 'object' ? data.state : null
  const merged = mergeServerState(rawState)

  const scheduleSave = () => {
    if (!cloudSaveEnabled) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const snap = snapshotFromStore(useStore.getState())
      saveCloudState(snap)
    }, DEBOUNCE_MS)
  }

  if (!listenerAttached) {
    listenerAttached = true
    useStore.subscribe(scheduleSave)
  }

  cloudSaveEnabled = false
  if (merged) {
    useStore.setState(merged)
  }
  cloudSaveEnabled = true

  return { ok: true, mode: 'cloud' }
}
