# Contexto JUGOS NAYI — para pegar en un chat nuevo

Abajo va el texto listo para **copiar y pegar** tal cual en tu primer mensaje del siguiente chat (puedes añadir al final lo que quieras hacer ese día).

---

## COPIAR DESDE AQUÍ ↓

**Proyecto: JUGOS NAYI** — App web para negocio de jugos: punto de venta, inventario por sabor, plan diario, compras y ganancias.

**Stack:** React 18 + Vite 5 + Tailwind 3. Estado con Zustand en `src/store/useStore.js`. Preferencias UI (modo oscuro, tamaño de texto) en `src/store/useUiPreferences.js`, localStorage `jugos-nayi-ui`.

**Supabase:** `@supabase/supabase-js`. Sesión anónima. Tabla `public.jugos_state` (JSONB `state`: sabores, ventas, plan, compras, PG, PP). Sync en `src/sync/jugosCloud.js` (carga al inicio, guardado con debounce ~700ms). Cliente `src/lib/supabase.js`. Env: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` — **no** poner la contraseña de Postgres en el frontend.

**Archivos clave:** `src/app.jsx`, `src/components/PuntoDeVenta.jsx`, `PlanDiario.jsx`, `Compra.jsx`, `Ganancia.jsx`, `GestionSabores.jsx`, `JuiceBackdrop.jsx`, `src/store/defaults.js`. SQL: `supabase/migrations/001_jugos_nayi.sql`. Plantilla: `.env.example`.

**Supabase (setup):** ejecutar SQL de la migración; Authentication → Providers → Anonymous activado; API URL + anon key en `.env.local` y en Vercel.

**Repo:** https://github.com/miguellov/Jugos-Nayi (rama `main`). Vercel: `npm run build`, salida `dist`.

**Nota:** solo auth anónima por ahora — datos ligados a la sesión del navegador; otro dispositivo es otro usuario anónimo hasta añadir login.

**COPIAR HASTA AQUÍ ↑**

---

El archivo vive en la raíz del repo: `CONTEXTO_PARA_NUEVO_CHAT.md` (puedes hacer commit para no perderlo).
