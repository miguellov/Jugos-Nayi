import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiPreferences = create(
  persist(
    (set, get) => ({
      darkMode: false,
      /** @type {'s' | 'm' | 'l'} */
      fontScale: 'm',
      toggleDarkMode: () => {
        const next = !get().darkMode
        try {
          localStorage.setItem('tema', next ? 'oscuro' : 'claro')
        } catch {
          /* ignore */
        }
        set({ darkMode: next })
      },
      cycleFontScale: () =>
        set((s) => ({
          fontScale: s.fontScale === 's' ? 'm' : s.fontScale === 'm' ? 'l' : 's',
        })),
    }),
    { name: 'jugos-nayi-ui' }
  )
)
