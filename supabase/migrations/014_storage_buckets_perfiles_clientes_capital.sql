-- Buckets con id "Perfiles" y "Clientes" (mayúscula inicial), alineados con la app.
-- Si ya existían políticas para 'perfiles'/'clientes' en minúscula, se reemplazan.

drop policy if exists "perfiles_select_anon" on storage.objects;
drop policy if exists "perfiles_insert_anon" on storage.objects;
drop policy if exists "perfiles_update_anon" on storage.objects;
drop policy if exists "clientes_select_anon" on storage.objects;
drop policy if exists "clientes_insert_anon" on storage.objects;
drop policy if exists "clientes_update_anon" on storage.objects;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'Perfiles',
  'Perfiles',
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
  'Clientes',
  'Clientes',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "perfiles_select_anon"
  on storage.objects for select
  using (bucket_id = 'Perfiles');

create policy "perfiles_insert_anon"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'Perfiles');

create policy "perfiles_update_anon"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'Perfiles')
  with check (bucket_id = 'Perfiles');

create policy "clientes_select_anon"
  on storage.objects for select
  using (bucket_id = 'Clientes');

create policy "clientes_insert_anon"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'Clientes');

create policy "clientes_update_anon"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'Clientes')
  with check (bucket_id = 'Clientes');
