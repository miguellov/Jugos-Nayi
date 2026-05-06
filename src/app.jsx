import { useState, useLayoutEffect, useEffect, useCallback, useRef, useMemo } from 'react'
import { ShoppingBag, Calendar, ShoppingCart, TrendingUp, Settings, Moon, Sun, Type, LogOut } from 'lucide-react'
import JuiceBackdrop from './components/JuiceBackdrop'
import PuntoDeVenta from './components/PuntoDeVenta'
import PlanDiario from './components/PlanDiario'
import Compras from './components/Compra'
import Ganancias from './components/Ganancia'
import Configuracion from './components/Configuracion'
import Mayoristas from './components/Mayoristas'
import Login from './components/Login'
import SolicitudPin from './components/SolicitudPin'
import { useUiPreferences } from './store/useUiPreferences'
import { useStore, formatConMoneda } from './store/useStore'
import { useMayoristasActivo, getMayoristasActivo } from './store/useMayoristasActivo'

const tabsBase = [
  { id: 'venta', label: 'Venta', Icon: ShoppingBag },
  { id: 'plan', label: 'Plan', Icon: Calendar },
  { id: 'compras', label: 'Compras', Icon: ShoppingCart },
  { id: 'ganancias', label: 'Ganancias', Icon: TrendingUp },
]

function NavIconMayoristas({ size = 20 }) {
  return (
    <span className="leading-none" style={{ fontSize: size }} role="img" aria-hidden>
      🏪
    </span>
  )
}

const tabMayoristas = { id: 'mayoristas', label: 'Mayor.', Icon: NavIconMayoristas }
const tabConfig = { id: 'config', label: 'Ajustes', Icon: Settings }

const FONT_PX = { s: '15px', m: '16px', l: '18px' }
const FONT_LABEL = { s: 'pequeño', m: 'mediano', l: 'grande' }

function PanelMetaDia({ abierto }) {
  const config = useStore((s) => s.config)
  const gastosHoy = useStore((s) => s.gastosHoy)
  const totalGastos = useStore((s) => s.totalGastos)
  const precioPromedio = useStore((s) => s.precioPromedio)
  const puntoEquilibrio = useStore((s) => s.puntoEquilibrio)
  const metaRecomendada = useStore((s) => s.metaRecomendada)
  const gananciaActual = useStore((s) => s.gananciaActual)
  const gananciaProyectada = useStore((s) => s.gananciaProyectada)
  const totalJugosHoy = useStore((s) => s.totalJugosHoy)

  const sinGastosRegistrados = totalGastos <= 0
  const vendidos = Number(totalJugosHoy) || 0
  const metaY = Math.max(1, Number(metaRecomendada) || 0)
  const pctProgreso = Math.min(100, (vendidos / metaY) * 100)
  const metaPanelLograda = metaRecomendada > 0 && vendidos >= metaRecomendada

  let mensajeGanancia = null
  let claseGanancia = 'text-gray-700 dark:text-gray-300'
  if (!sinGastosRegistrados) {
    if (metaPanelLograda) {
      mensajeGanancia = '🎉 ¡Meta del día lograda!'
      claseGanancia = 'font-semibold text-emerald-700 dark:text-emerald-300'
    } else if (gananciaActual < 0) {
      mensajeGanancia = `Aún faltan ${formatConMoneda(config, Math.abs(gananciaActual))} para cubrir gastos`
      claseGanancia = 'font-medium text-red-600 dark:text-red-400'
    } else if (gananciaActual === 0) {
      mensajeGanancia = 'Justo en el punto de equilibrio'
      claseGanancia = 'font-medium text-amber-700 dark:text-amber-300'
    } else {
      mensajeGanancia = `Ganando ${formatConMoneda(config, gananciaActual)} hasta ahora 💰`
      claseGanancia = 'font-medium text-[#1D9E75] dark:text-brand-soft'
    }
  }

  const sep = 'my-3 border-t border-[#E5E7EB] dark:border-zinc-700'

  return (
    <div
      id="panel-meta-dia"
      role="region"
      aria-hidden={!abierto}
      className="w-full px-4 pb-4 pt-0 sm:px-4"
    >
      {sinGastosRegistrados ? (
        <p className="pt-3 text-center text-sm font-medium text-amber-800 dark:text-amber-200/90">
          Registra tus compras para ver tu meta 📦
        </p>
      ) : (
        <>
          <div className="pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] dark:text-zinc-400">
              Resumen de gastos
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-100">
              Gastos de hoy:{' '}
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatConMoneda(config, gastosHoy)}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-100">
              Precio promedio por jugo (plan de hoy):{' '}
              <span className="font-semibold tabular-nums text-[#1D9E75] dark:text-brand-soft">
                {formatConMoneda(config, precioPromedio)}
              </span>
            </p>
          </div>

          <div className={sep} />

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] dark:text-zinc-400">
              Punto de equilibrio
            </p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-100">
              Mínimo para no perder:{' '}
              <span className="font-bold tabular-nums text-gray-900 dark:text-white">{puntoEquilibrio}</span> jugos
            </p>
            <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-100">
              Meta recomendada:{' '}
              <span className="font-bold tabular-nums text-[#1D9E75] dark:text-brand-soft">{metaRecomendada}</span>{' '}
              jugos <span className="text-gray-500 dark:text-gray-400">(mínimo + 20%)</span>
            </p>
            <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-100">
              Ganancia proyectada si llega a meta:{' '}
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatConMoneda(config, gananciaProyectada)}
              </span>
            </p>
          </div>

          <div className={sep} />

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280] dark:text-zinc-400">
              Progreso actual
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              <span className="tabular-nums font-bold text-[#1D9E75] dark:text-brand-soft">{vendidos}</span>
              <span className="text-gray-500 dark:text-gray-400"> de </span>
              <span className="tabular-nums font-bold">{metaRecomendada}</span>
              <span className="text-gray-500 dark:text-gray-400"> jugos </span>
              <span className="tabular-nums text-gray-500 dark:text-gray-400">
                ({Math.round(pctProgreso)}%)
              </span>
            </p>
            <div className="mt-2 h-[10px] w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-[10px] rounded-full bg-[#1D9E75] dark:bg-emerald-500"
                style={{
                  width: `${pctProgreso}%`,
                  transition: 'width 0.45s ease',
                }}
              />
            </div>
            {mensajeGanancia ? (
              <p className={`mt-2 text-sm ${claseGanancia}`}>{mensajeGanancia}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

function HeaderAvatar() {
  const fotoPerfil = useStore((s) => s.config.foto_perfil)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [fotoPerfil])

  const url = fotoPerfil && String(fotoPerfil).trim() !== '' ? String(fotoPerfil).trim() : ''

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover shadow-md ring-2 ring-[#1D9E75]/20 dark:ring-white/10"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D9E75] text-[17px] font-bold leading-none text-white shadow-md ring-2 ring-[#1D9E75]/25 dark:ring-white/10"
      aria-hidden
    >
      N
    </span>
  )
}

export default function App() {
  const [tab, setTab] = useState('venta')
  const [bootstrapped, setBootstrapped] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const refPanelWrap = useRef(null)
  const refBotonMeta = useRef(null)
  const cargarVentas = useStore((s) => s.cargarVentas)
  const cargarInventarioSabores = useStore((s) => s.cargarInventarioSabores)
  const cargarConfig = useStore((s) => s.cargarConfig)
  const cargarPlan = useStore((s) => s.cargarPlan)
  const cargarCompras = useStore((s) => s.cargarCompras)
  const cargarMayoristas = useStore((s) => s.cargarMayoristas)
  const cargarOrdenesMayoristas = useStore((s) => s.cargarOrdenesMayoristas)
  const cargarUsuarios = useStore((s) => s.cargarUsuarios)
  const restaurarSesion = useStore((s) => s.restaurarSesion)
  const logout = useStore((s) => s.logout)
  const autenticado = useStore((s) => s.autenticado)
  const usuarioActivo = useStore((s) => s.usuarioActivo)
  const tienePermiso = useStore((s) => s.tienePermiso)
  const mayoristasActivoNav = useMayoristasActivo()
  const [tabPendiente, setTabPendiente] = useState(null)
  const [solicitarAdmin, setSolicitarAdmin] = useState(false)

  const tabs = useMemo(
    () => (mayoristasActivoNav ? [...tabsBase, tabMayoristas, tabConfig] : [...tabsBase, tabConfig]),
    [mayoristasActivoNav]
  )
  const nombreNegocio = useStore((s) => s.config.nombre_negocio)
  const nombreVendedor = useStore((s) => s.config.nombre_vendedor)
  const darkMode = useUiPreferences((s) => s.darkMode)
  const fontScale = useUiPreferences((s) => s.fontScale)
  const toggleDarkMode = useUiPreferences((s) => s.toggleDarkMode)
  const cycleFontScale = useUiPreferences((s) => s.cycleFontScale)

  const togglePanel = useCallback(() => {
    setPanelAbierto((v) => !v)
  }, [])

  useEffect(() => {
    if (!mayoristasActivoNav && tab === 'mayoristas') setTab('venta')
  }, [mayoristasActivoNav, tab])

  useEffect(() => {
    if (!bootstrapped || !mayoristasActivoNav) return
    void cargarMayoristas()
    void cargarOrdenesMayoristas()
  }, [bootstrapped, mayoristasActivoNav, cargarMayoristas, cargarOrdenesMayoristas])

  useEffect(() => {
    if (!panelAbierto) return
    const onDown = (e) => {
      const t = e.target
      if (refPanelWrap.current?.contains(t)) return
      if (refBotonMeta.current?.contains(t)) return
      setPanelAbierto(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [panelAbierto])

  const applyTemaRoot = useCallback(() => {
    const rootEl = document.getElementById('root')
    const html = document.documentElement
    html.classList.toggle('dark', darkMode)
    if (rootEl) {
      rootEl.classList.remove('tema-claro', 'tema-oscuro')
      rootEl.classList.add(darkMode ? 'tema-oscuro' : 'tema-claro')
      rootEl.style.transition = 'background-color 0.2s ease, color 0.2s ease'
    }
    html.style.fontSize = FONT_PX[fontScale] ?? FONT_PX.m
  }, [darkMode, fontScale])

  useLayoutEffect(() => {
    applyTemaRoot()
  }, [applyTemaRoot])

  useEffect(() => {
    try {
      if (localStorage.getItem('tema') == null) {
        const d = useUiPreferences.getState().darkMode
        localStorage.setItem('tema', d ? 'oscuro' : 'claro')
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([cargarVentas(), cargarInventarioSabores(), cargarConfig(), cargarPlan(), cargarCompras(), cargarUsuarios()])
      .then(() => {
        if (cancelled) return
        restaurarSesion()
        useStore.getState().calcularPuntoEquilibrio()
        if (getMayoristasActivo()) {
          void cargarMayoristas()
          void cargarOrdenesMayoristas()
        }
        setBootstrapped(true)
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) {
          useStore.getState().calcularPuntoEquilibrio()
          setSyncMsg('No se pudo cargar datos desde Supabase.')
          setBootstrapped(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [cargarVentas, cargarInventarioSabores, cargarConfig, cargarPlan, cargarCompras, cargarMayoristas, cargarOrdenesMayoristas, cargarUsuarios, restaurarSesion])

  if (!bootstrapped) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F9FAFB] px-4 dark:bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/30">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-soft" />
        <p className="text-sm font-medium text-[#6B7280] dark:text-zinc-300">Sincronizando datos…</p>
      </div>
    )
  }

  if (!autenticado) {
    return <Login />
  }

  const tabsConPermisos = tabs.map((t) => ({
    ...t,
    permitido: usuarioActivo?.rol === 'admin' ? true : tienePermiso(t.id),
  }))

  const seleccionarTab = (id, permitido) => {
    if (permitido) {
      setTab(id)
      return
    }
    setTabPendiente(id)
    setSolicitarAdmin(true)
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <JuiceBackdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        <div
          ref={refPanelWrap}
          className="sticky top-0 z-30 w-full border-b border-[#E5E7EB] bg-white shadow-sm transition-colors duration-200 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <header className="app-shell-header flex items-center gap-2 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4">
            <HeaderAvatar />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight text-[#111827] dark:text-white">
                {nombreNegocio || 'Jugos Nayi'}
              </h1>
              {nombreVendedor && String(nombreVendedor).trim() !== '' ? (
                <p className="text-xs font-semibold text-[#1D9E75] dark:text-brand-soft">
                  {String(nombreVendedor).trim()}
                </p>
              ) : null}
              {usuarioActivo?.nombre ? (
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-300">{usuarioActivo.nombre}</p>
              ) : null}
              <p
                className={`text-xs font-medium text-[#6B7280] dark:text-zinc-300 ${
                  nombreVendedor && String(nombreVendedor).trim() !== '' ? 'mt-0.5' : ''
                }`}
              >
                {new Date().toLocaleDateString('es-DO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              {usuarioActivo?.foto ? (
                <img src={usuarioActivo.foto} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20" />
              ) : null}
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl p-2 text-[#111827] transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="rounded-xl p-2 text-[#111827] transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              >
                {darkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
              </button>
              <button
                ref={refBotonMeta}
                type="button"
                onClick={togglePanel}
                className={`rounded-xl p-2 transition-colors ${
                  panelAbierto
                    ? 'bg-[#1D9E75] text-white shadow-md dark:bg-emerald-600 dark:text-white'
                    : 'text-[#111827] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
                }`}
                aria-expanded={panelAbierto}
                aria-controls="panel-meta-dia"
                title="Meta del día y punto de equilibrio"
              >
                <TrendingUp size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={cycleFontScale}
                className="rounded-xl p-2 text-[#111827] transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                aria-label={`Tamaño de texto: ${FONT_LABEL[fontScale]}`}
                title={`Texto ${FONT_LABEL[fontScale]} — tocar para cambiar`}
              >
                <Type size={20} strokeWidth={2} />
              </button>
            </div>
          </header>

          <div
            className={`overflow-hidden rounded-b-2xl border-t border-[#E5E7EB]/80 bg-white transition-[max-height] duration-300 ease-in-out dark:border-zinc-800/80 dark:bg-zinc-950 ${
              panelAbierto ? 'max-h-[min(85vh,720px)] border-b border-[#E5E7EB] dark:border-zinc-800' : 'max-h-0'
            }`}
          >
            <div className="max-h-[min(85vh,720px)] overflow-y-auto overscroll-contain">
              <PanelMetaDia abierto={panelAbierto} />
            </div>
          </div>
        </div>

        {syncMsg && (
          <div
            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-100"
            role="alert"
          >
            {syncMsg}
          </div>
        )}

        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
          {tab === 'venta' && <PuntoDeVenta />}
          {tab === 'plan' && <PlanDiario />}
          {tab === 'compras' && <Compras />}
          {tab === 'ganancias' && <Ganancias />}
          {tab === 'mayoristas' && mayoristasActivoNav && <Mayoristas />}
          {tab === 'config' && <Configuracion />}
        </main>

        <nav className="app-shell-nav fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5E7EB] bg-white shadow-nav transition-colors duration-200 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-lg pb-[env(safe-area-inset-bottom,0px)]">
            {tabsConPermisos.map(({ id, label, Icon, permitido }) => (
              <button
                key={id}
                type="button"
                onClick={() => seleccionarTab(id, permitido)}
                className={`flex flex-1 flex-col items-center gap-1 border-t-2 py-2.5 text-xs font-semibold transition-colors -mt-px
                ${
                  tab === id
                    ? 'border-brand bg-emerald-50 text-brand-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-brand dark:bg-emerald-950/50 dark:text-brand-soft dark:shadow-none'
                    : 'border-transparent text-[#374151] hover:bg-gray-100/80 hover:text-[#111827] dark:text-zinc-400 dark:hover:bg-zinc-900/80 dark:hover:text-zinc-100'
                }`}
              >
                {id === 'mayoristas' ? (
                  <NavIconMayoristas size={20} />
                ) : (
                  <Icon size={20} strokeWidth={tab === id ? 2.25 : 2} />
                )}
                {permitido ? label : `🔒 ${label}`}
              </button>
            ))}
          </div>
        </nav>
      </div>
      <SolicitudPin
        abierto={solicitarAdmin}
        onCancelar={() => {
          setSolicitarAdmin(false)
          setTabPendiente(null)
        }}
        onConfirmar={() => {
          if (tabPendiente) setTab(tabPendiente)
          setSolicitarAdmin(false)
          setTabPendiente(null)
        }}
      />
    </div>
  )
}
