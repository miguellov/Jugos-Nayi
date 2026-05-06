create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default '',
  usuario text not null unique,
  pin text not null default '',
  rol text not null default 'empleado' check (rol in ('admin', 'empleado')),
  permisos jsonb not null default '{}'::jsonb,
  foto text null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios disable row level security;

insert into public.usuarios (nombre, usuario, pin, rol, permisos, activo)
select
  'Administrador',
  'admin',
  '1234',
  'admin',
  '{"venta":true,"plan":true,"compras":true,"ganancias":true,"mayoristas":true,"config":true}'::jsonb,
  true
where not exists (select 1 from public.usuarios where rol = 'admin');
