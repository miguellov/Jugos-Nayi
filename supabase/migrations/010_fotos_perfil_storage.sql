-- Fotos de perfil (negocio) y clientes mayoristas + buckets públicos

alter table public.configuracion
  add column if not exists foto_perfil text;

alter table public.mayoristas
  add column if not exists foto text;

-- Buckets públicos para URLs directas en la app (anon key)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'perfiles',
  'perfiles',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clientes',
  'clientes',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Políticas Storage (rol anon de la app SPA)
drop policy if exists "perfiles_select_anon" on storage.objects;
drop policy if exists "perfiles_insert_anon" on storage.objects;
drop policy if exists "perfiles_update_anon" on storage.objects;
drop policy if exists "clientes_select_anon" on storage.objects;
drop policy if exists "clientes_insert_anon" on storage.objects;
drop policy if exists "clientes_update_anon" on storage.objects;

create policy "perfiles_select_anon"
  on storage.objects for select
  using (bucket_id = 'perfiles');

create policy "perfiles_insert_anon"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'perfiles');

create policy "perfiles_update_anon"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'perfiles')
  with check (bucket_id = 'perfiles');

create policy "clientes_select_anon"
  on storage.objects for select
  using (bucket_id = 'clientes');

create policy "clientes_insert_anon"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'clientes');

create policy "clientes_update_anon"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'clientes')
  with check (bucket_id = 'clientes');
