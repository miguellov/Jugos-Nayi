import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiPreferences = create(
  persist(
    (set, get) => ({
      darkMode: false,
      /** @type {'s' | 'm' | 'l'} */
      fontScale: 'm',
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
      cycleFontScale: () =>
        set((s) => ({
          fontScale: s.fontScale === 's' ? 'm' : s.fontScale === 'm' ? 'l' : 's',
        })),
    }),
    { name: 'jugos-nayi-ui' }
  )
)
