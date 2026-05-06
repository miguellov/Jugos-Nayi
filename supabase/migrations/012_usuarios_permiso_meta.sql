-- Agrega permiso "meta" por defecto según rol
update public.usuarios
set permisos = coalesce(permisos, '{}'::jsonb) || '{"meta": false}'::jsonb
where rol <> 'admin';

update public.usuarios
set permisos = coalesce(permisos, '{}'::jsonb) || '{"meta": true}'::jsonb
where rol = 'admin';
