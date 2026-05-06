-- Nota del dia para empleados (visible en modo "solo ventas")
alter table public.configuracion
  add column if not exists nota_del_dia text default '';
