import { useState, useLayoutEffect, useEffect } from 'react'
import { ShoppingBag, Calendar, ShoppingCart, TrendingUp, Moon, Sun, Type } from 'lucide-react'
import JuiceBackdrop from './components/JuiceBackdrop'
import PuntoDeVenta from './components/PuntoDeVenta'
import PlanDiario from './components/PlanDiario'
import Compras from './components/Compra'
import Ganancias from './components/Ganancia'
import { useUiPreferences } from './store/useUiPreferences'
import { initJugosCloud } from './sync/jugosCloud'

const tabs = [
  { id: 'venta', label: 'Venta', Icon: ShoppingBag },
  { id: 'plan', label: 'Plan', Icon: Calendar },
  { id: 'compras', label: 'Compras', Icon: ShoppingCart },
  { id: 'ganancias', label: 'Ganancias', Icon: TrendingUp },
]

const FONT_PX = { s: '15px', m: '16px', l: '18px' }
const FONT_LABEL = { s: 'pequeño', m: 'mediano', l: 'grande' }

export default function App() {
  const [tab, setTab] = useState('venta')
  const [bootstrapped, setBootstrapped] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const darkMode = useUiPreferences((s) => s.darkMode)
  const fontScale = useUiPreferences((s) => s.fontScale)
  const toggleDarkMode = useUiPreferences((s) => s.toggleDarkMode)
  const cycleFontScale = useUiPreferences((s) => s.cycleFontScale)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', darkMode)
    root.style.fontSize = FONT_PX[fontScale] ?? FONT_PX.m
  }, [darkMode, fontScale])

  useEffect(() => {
    let cancelled = false
    initJugosCloud()
      .then((r) => {
        if (cancelled) return
        if (!r.ok && r.error) setSyncMsg(r.error)
        setBootstrapped(true)
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) {
          setSyncMsg(String(e?.message ?? e))
          setBootstrapped(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!bootstrapped) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-emerald-50/90 via-white to-amber-50/40 px-4 dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/30">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent dark:border-brand-soft" />
        <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Sincronizando datos…</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <JuiceBackdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-gray-200/90 bg-white px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:gap-3 sm:px-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-soft to-amber-100/90 text-2xl text-brand-dark shadow-md ring-2 ring-brand/20 dark:from-brand/35 dark:to-amber-900/40 dark:text-brand-soft dark:ring-white/10 sm:h-12 sm:w-12"
            aria-hidden
          >
            🥤
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-gray-950 dark:text-white">
              JUGOS NAYI
            </h1>
            <p className="text-xs font-medium text-gray-700 dark:text-zinc-300">
              {new Date().toLocaleDateString('es-DO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="rounded-xl p-2 text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
            </button>
            <button
              type="button"
              onClick={cycleFontScale}
              className="rounded-xl p-2 text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label={`Tamaño de texto: ${FONT_LABEL[fontScale]}`}
              title={`Texto ${FONT_LABEL[fontScale]} — tocar para cambiar`}
            >
              <Type size={20} strokeWidth={2} />
            </button>
          </div>
        </header>

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
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200/90 bg-white shadow-nav dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-lg pb-[env(safe-area-inset-bottom,0px)]">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center gap-1 border-t-2 py-2.5 text-xs font-semibold transition-colors -mt-px
                ${
                  tab === id
                    ? 'border-brand bg-emerald-50 text-brand-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-brand dark:bg-emerald-950/50 dark:text-brand-soft dark:shadow-none'
                    : 'border-transparent text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-900/80 dark:hover:text-zinc-100'
                }`}
              >
                <Icon size={20} strokeWidth={tab === id ? 2.25 : 2} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
